export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

const TAU = Math.PI * 2;
const ARENA = Object.freeze({ left: 34, right: 1246, top: 34, bottom: 686 });
const INITIAL_SWARM = 84;
const DEFAULT_ENEMY_BUDGET = 300;
const MAX_LIVE_ENEMIES = 156;
const MAX_PROJECTILES = 520;
const MAX_ENEMY_PROJECTILES = 360;
const MAX_PARTICLES = 320;
const MAX_PICKUPS = 170;
const GRID_SIZE = 96;
const FLOOR_ELLIPSE = Object.freeze({ x: 640, y: 360, rx: 555, ry: 292 });

export const BOSS_PATTERNS = Object.freeze(["radial", "sweep", "bombs", "rings", "charge"]);

const ENEMY_DATA = Object.freeze({
  hunter: Object.freeze({ hp: 30, speed: 76, radius: 14, damage: 10, xp: 4, color: "#ff526d" }),
  suppressor: Object.freeze({ hp: 52, speed: 52, radius: 17, damage: 9, xp: 7, color: "#f3ab42" }),
  brute: Object.freeze({ hp: 88, speed: 38, radius: 23, damage: 18, xp: 10, color: "#d93955" }),
});

export const REWARD_DEFINITIONS = Object.freeze({
  scatter: Object.freeze({ id: "scatter", category: "weapon", name: "SCATTER ARRAY", description: "Fires a close-range five-shot cone." }),
  rail: Object.freeze({ id: "rail", category: "weapon", name: "RAIL LANCE", description: "Pierces an entire lane with a heavy slug." }),
  rocket: Object.freeze({ id: "rocket", category: "weapon", name: "ROCKET POD", description: "Launches a missile with a wide blast radius." }),
  orbit: Object.freeze({ id: "orbit", category: "weapon", name: "ORBIT BLADES", description: "Spinning blades shred enemies around you." }),
  damage: Object.freeze({ id: "damage", category: "skill", name: "OVERCHARGE", description: "+25% damage for every weapon and ally." }),
  fireRate: Object.freeze({ id: "fireRate", category: "skill", name: "CLOCK SURGE", description: "+19% attack speed for every weapon." }),
  multishot: Object.freeze({ id: "multishot", category: "skill", name: "FORKED BARREL", description: "Adds one projectile to pulse volleys." }),
  shield: Object.freeze({ id: "shield", category: "skill", name: "AEGIS LAYER", description: "Gain and refill 40 regenerating shield." }),
  dash: Object.freeze({ id: "dash", category: "skill", name: "PHASE DRIVE", description: "Shorter dash cooldown and longer invulnerability." }),
  regen: Object.freeze({ id: "regen", category: "skill", name: "NANO REPAIR", description: "Continuously repairs lost hull integrity." }),
  drone: Object.freeze({ id: "drone", category: "ally", name: "HUNTER DRONE", description: "A mobile drone automatically hunts nearby targets." }),
  sentry: Object.freeze({ id: "sentry", category: "ally", name: "PULSE SENTRY", description: "Deploy a rapid-fire turret at your position." }),
  suppressor: Object.freeze({ id: "suppressor", category: "ally", name: "SUPPRESSOR WISP", description: "An escort slows and shocks dense enemy packs." }),
});

const REWARD_POOLS = Object.freeze({
  weapon: Object.freeze(["scatter", "rail", "rocket", "orbit"]),
  skill: Object.freeze(["damage", "fireRate", "multishot", "shield", "dash", "regen"]),
  ally: Object.freeze(["drone", "sentry", "suppressor"]),
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function normalize(x, y, fallbackX = 1, fallbackY = 0) {
  const length = Math.hypot(x, y);
  if (!Number.isFinite(length) || length < 0.00001) return { x: fallbackX, y: fallbackY };
  return { x: x / length, y: y / length };
}

function rayToEllipseBoundary(x, y, direction, padding = 0) {
  const rx = Math.max(1, FLOOR_ELLIPSE.rx - padding);
  const ry = Math.max(1, FLOOR_ELLIPSE.ry - padding);
  const ox = x - FLOOR_ELLIPSE.x;
  const oy = y - FLOOR_ELLIPSE.y;
  const a = (direction.x * direction.x) / (rx * rx) + (direction.y * direction.y) / (ry * ry);
  const b = 2 * ((ox * direction.x) / (rx * rx) + (oy * direction.y) / (ry * ry));
  const c = (ox * ox) / (rx * rx) + (oy * oy) / (ry * ry) - 1;
  const discriminant = Math.max(0, b * b - 4 * a * c);
  const rootA = (-b + Math.sqrt(discriminant)) / (2 * a);
  const rootB = (-b - Math.sqrt(discriminant)) / (2 * a);
  const distance = Math.max(rootA, rootB, 0);
  return {
    x: FLOOR_ELLIPSE.x + clamp(ox + direction.x * distance, -rx, rx),
    y: FLOOR_ELLIPSE.y + clamp(oy + direction.y * distance, -ry, ry),
    distance,
  };
}

function compact(array, keep) {
  let write = 0;
  for (let read = 0; read < array.length; read += 1) {
    const value = array[read];
    if (keep(value)) array[write++] = value;
  }
  array.length = write;
}

function emit(state, type, payload = {}) {
  if (state.events.length >= 180) state.events.shift();
  state.events.push({ type, time: state.time, ...payload });
}

function addText(state, text, x, y, color = "#f8f4e8", scale = 1) {
  if (state.texts.length >= 70) state.texts.shift();
  state.texts.push({ text, x, y, color, scale, life: 1, maxLife: 1, vy: -30 });
}

function addParticle(state, x, y, color, speed = 140, life = 0.45, size = 4) {
  if (state.particles.length >= MAX_PARTICLES) return;
  const angle = state.random() * TAU;
  const velocity = speed * (0.35 + state.random() * 0.65);
  state.particles.push({
    x,
    y,
    vx: Math.cos(angle) * velocity,
    vy: Math.sin(angle) * velocity,
    color,
    size: size * (0.65 + state.random() * 0.7),
    life,
    maxLife: life,
  });
}

function burst(state, x, y, color, count, speed = 190, life = 0.55, size = 5) {
  const available = Math.max(0, MAX_PARTICLES - state.particles.length);
  const amount = Math.min(count, available);
  for (let index = 0; index < amount; index += 1) addParticle(state, x, y, color, speed, life, size);
}

function edgeSpawn(state, index) {
  const side = index % 4;
  const padding = 10 + state.random() * 24;
  // The authored map has exactly four open entry ramps. Keeping every spawn
  // inside these corridors makes the collision contract match the artwork:
  // the surrounding machinery is scenery, never a traversable spawn surface.
  if (side === 0) return { x: FLOOR_ELLIPSE.x + (state.random() - 0.5) * 150, y: ARENA.top + padding };
  if (side === 1) return { x: ARENA.right - padding, y: FLOOR_ELLIPSE.y + (state.random() - 0.5) * 120 };
  if (side === 2) return { x: FLOOR_ELLIPSE.x + (state.random() - 0.5) * 150, y: ARENA.bottom - padding };
  return { x: ARENA.left + padding, y: FLOOR_ELLIPSE.y + (state.random() - 0.5) * 120 };
}

function chooseEnemyType(index) {
  if (index % 11 === 0) return "brute";
  if (index % 4 === 0) return "suppressor";
  return "hunter";
}

function spawnEnemy(state) {
  if (state.spawnedEnemies >= state.enemyBudget || state.enemies.length >= MAX_LIVE_ENEMIES) return false;
  const spawnIndex = state.spawnedEnemies;
  const type = chooseEnemyType(spawnIndex);
  const base = ENEMY_DATA[type];
  const elite = spawnIndex > 0 && spawnIndex % 29 === 0;
  const scale = elite ? 1.3 : 1;
  const hpScale = elite ? 2.35 : 1;
  const point = edgeSpawn(state, spawnIndex);
  state.enemies.push({
    id: ++state.nextEntityId,
    type,
    x: point.x,
    y: point.y,
    vx: 0,
    vy: 0,
    angle: 0,
    radius: base.radius * scale,
    hp: base.hp * hpScale,
    maxHp: base.hp * hpScale,
    speed: base.speed * (elite ? 1.08 : 1),
    damage: base.damage * (elite ? 1.55 : 1),
    xp: Math.round(base.xp * (elite ? 2.5 : 1)),
    color: base.color,
    elite,
    dead: false,
    hitFlash: 0,
    attackCooldown: state.random() * 0.8,
    shootCooldown: 0.5 + state.random(),
    slow: 0,
    orbitHitCooldown: 0,
  });
  state.spawnedEnemies += 1;
  return true;
}

function spawnInitialSwarm(state) {
  const count = Math.min(INITIAL_SWARM, state.enemyBudget, MAX_LIVE_ENEMIES);
  for (let index = 0; index < count; index += 1) spawnEnemy(state);
}

function createPlayer() {
  return {
    name: "THE TRAINER",
    x: GAME_WIDTH * 0.5,
    y: GAME_HEIGHT * 0.5,
    vx: 0,
    vy: 0,
    angle: 0,
    radius: 18,
    speed: 245,
    hp: 340,
    maxHp: 340,
    shield: 0,
    shieldMax: 0,
    shieldDelay: 0,
    level: 1,
    xp: 0,
    nextXp: 64,
    damageMultiplier: 1,
    fireRateMultiplier: 1,
    multishot: 1,
    regen: 0,
    dashTimer: 0,
    dashCooldown: 0,
    dashMax: 2.35,
    dashDuration: 0.16,
    dashSpeed: 790,
    dashX: 1,
    dashY: 0,
    invulnerability: 2.5,
    hitFlash: 0,
    dead: false,
    fireTimers: { pulse: 0, scatter: 0, rail: 0, rocket: 0 },
    orbitAngle: 0,
  };
}

function createBoss() {
  return {
    name: "THE WRONG ENGINE",
    active: false,
    x: GAME_WIDTH * 0.78,
    y: GAME_HEIGHT * 0.5,
    vx: 0,
    vy: 0,
    angle: Math.PI,
    radius: 70,
    hp: 30000,
    maxHp: 30000,
    stage: 1,
    hitFlash: 0,
    dead: false,
    patternCooldown: 1.6,
    patternIndex: 0,
    activePattern: null,
    contactCooldown: 0,
    weakness: 0,
    damageMultiplier: 1,
  };
}

export function createSwarmState({ random = Math.random, duration = 180 } = {}) {
  const safeRandom = typeof random === "function" ? random : Math.random;
  const state = {
    mode: "swarm",
    phase: "swarm",
    status: "running",
    duration: Math.max(30, finite(duration, 180)),
    time: 0,
    timeLeft: Math.max(30, finite(duration, 180)),
    phaseTime: 0,
    random: safeRandom,
    player: createPlayer(),
    boss: createBoss(),
    aim: { x: GAME_WIDTH * 0.82, y: GAME_HEIGHT * 0.5 },
    aimX: GAME_WIDTH * 0.82,
    aimY: GAME_HEIGHT * 0.5,
    enemyBudget: DEFAULT_ENEMY_BUDGET,
    spawnedEnemies: 0,
    killedEnemies: 0,
    spawnAccumulator: 0,
    phaseTransition: 0,
    nextEntityId: 0,
    enemies: [],
    projectiles: [],
    enemyProjectiles: [],
    particles: [],
    telegraphs: [],
    allies: [],
    deployables: [],
    pickups: [],
    texts: [],
    events: [],
    spatialGrid: new Map(),
    levelupPending: false,
    rewardOptions: [],
    rewardCycle: 0,
    build: {
      weapons: { pulse: 1, scatter: 0, rail: 0, rocket: 0, orbit: 0 },
      skills: { damage: 0, fireRate: 0, multishot: 0, shield: 0, dash: 0, regen: 0 },
      allies: { drone: 0, sentry: 0, suppressor: 0 },
    },
    stats: {
      kills: 0,
      shots: 0,
      hits: 0,
      damageDealt: 0,
      damageTaken: 0,
      levels: 1,
      rewardsChosen: 0,
      bossPatternsDodged: 0,
      bossPatternsHit: 0,
      peakEnemies: 0,
    },
    shake: 0,
    flash: 0,
    lastShotEvent: -10,
  };
  spawnInitialSwarm(state);
  state.stats.peakEnemies = state.enemies.length;
  emit(state, "swarmStart", { enemies: state.enemies.length, budget: state.enemyBudget });
  return state;
}

export function createSwarmInput() {
  return { up: false, down: false, left: false, right: false, dashPressed: false };
}

export function clearPressedInput(input) {
  if (!input || typeof input !== "object") return false;
  input.dashPressed = false;
  return true;
}

export function setSwarmAim(state, x, y) {
  if (!state || !Number.isFinite(x) || !Number.isFinite(y)) return false;
  state.aim.x = clamp(x, 0, GAME_WIDTH);
  state.aim.y = clamp(y, 0, GAME_HEIGHT);
  state.aimX = state.aim.x;
  state.aimY = state.aim.y;
  return true;
}

function movementDirection(input) {
  return normalize(
    (input?.right ? 1 : 0) - (input?.left ? 1 : 0),
    (input?.down ? 1 : 0) - (input?.up ? 1 : 0),
    0,
    0,
  );
}

function clampPlayerToFloor(player) {
  const rx = FLOOR_ELLIPSE.rx - player.radius;
  const ry = FLOOR_ELLIPSE.ry - player.radius;
  const dx = player.x - FLOOR_ELLIPSE.x;
  const dy = player.y - FLOOR_ELLIPSE.y;
  const ellipseDistance = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
  if (ellipseDistance <= 1) return;
  const scale = 1 / Math.sqrt(ellipseDistance);
  player.x = FLOOR_ELLIPSE.x + dx * scale;
  player.y = FLOOR_ELLIPSE.y + dy * scale;
  const outward = normalize(dx / (rx * rx), dy / (ry * ry));
  const outwardSpeed = player.vx * outward.x + player.vy * outward.y;
  if (outwardSpeed > 0) {
    player.vx -= outward.x * outwardSpeed;
    player.vy -= outward.y * outwardSpeed;
  }
}

function updatePlayer(state, input, dt) {
  const player = state.player;
  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  player.invulnerability = Math.max(0, player.invulnerability - dt);
  player.hitFlash = Math.max(0, player.hitFlash - dt);
  player.shieldDelay = Math.max(0, player.shieldDelay - dt);
  if (player.regen > 0 && player.hp > 0) player.hp = Math.min(player.maxHp, player.hp + player.regen * dt);
  if (player.shieldMax > 0 && player.shieldDelay <= 0) {
    player.shield = Math.min(player.shieldMax, player.shield + (4 + player.shieldMax * 0.035) * dt);
  }

  const move = movementDirection(input);
  const aim = normalize(state.aim.x - player.x, state.aim.y - player.y);
  player.angle = Math.atan2(aim.y, aim.x);
  if (input?.dashPressed && player.dashCooldown <= 0) {
    const dash = Math.hypot(move.x, move.y) > 0 ? move : aim;
    player.dashX = dash.x;
    player.dashY = dash.y;
    player.dashTimer = player.dashDuration;
    player.dashCooldown = player.dashMax;
    player.invulnerability = Math.max(player.invulnerability, player.dashDuration + 0.08 + state.build.skills.dash * 0.04);
    emit(state, "dash", { x: player.x, y: player.y });
  }
  if (player.dashTimer > 0) {
    player.dashTimer = Math.max(0, player.dashTimer - dt);
    player.vx = player.dashX * player.dashSpeed;
    player.vy = player.dashY * player.dashSpeed;
  } else {
    player.vx = move.x * player.speed;
    player.vy = move.y * player.speed;
  }
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  clampPlayerToFloor(player);
}

function pushPlayerProjectile(state, projectile) {
  if (state.projectiles.length >= MAX_PROJECTILES) return false;
  state.projectiles.push({
    id: ++state.nextEntityId,
    px: projectile.x,
    py: projectile.y,
    dead: false,
    ...projectile,
  });
  state.stats.shots += 1;
  return true;
}

function fireBulletFan(state, kind, count, spread, speed, damage, radius, life, extra = {}) {
  const player = state.player;
  const baseAngle = player.angle;
  const emitted = [];
  for (let index = 0; index < count; index += 1) {
    const offset = count === 1 ? 0 : (index / (count - 1) - 0.5) * spread;
    const angle = baseAngle + offset;
    const x = player.x + Math.cos(angle) * 24;
    const y = player.y + Math.sin(angle) * 24;
    const projectile = {
      kind,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle,
      radius,
      damage: damage * player.damageMultiplier,
      color: extra.color || "#62eaff",
      life,
      pierce: extra.pierce ?? 0,
      splash: extra.splash ?? 0,
      hitIds: extra.pierce ? new Set() : null,
    };
    if (pushPlayerProjectile(state, projectile)) emitted.push(projectile);
  }
  if (emitted.length && state.time - state.lastShotEvent >= 0.12) {
    state.lastShotEvent = state.time;
    emit(state, "shot", { kind, count: emitted.length, x: player.x, y: player.y });
  }
}

function updateAutoWeapons(state, dt) {
  const player = state.player;
  const timers = player.fireTimers;
  const attackSpeed = Math.max(0.38, player.fireRateMultiplier);
  for (const key of Object.keys(timers)) timers[key] -= dt;

  if (timers.pulse <= 0) {
    const count = clamp(player.multishot, 1, 5);
    fireBulletFan(state, "pulse", count, count > 1 ? 0.12 * (count - 1) : 0, 850, 34, 5, 1.55, { pierce: state.build.weapons.pulse >= 4 ? 1 : 0 });
    timers.pulse += 0.145 * attackSpeed / (1 + (state.build.weapons.pulse - 1) * 0.08);
  }

  const scatterLevel = state.build.weapons.scatter;
  if (scatterLevel > 0 && timers.scatter <= 0) {
    fireBulletFan(state, "scatter", 4 + scatterLevel, 0.65, 720, 18 + scatterLevel * 5, 5, 0.82, { color: "#8bf4da" });
    timers.scatter += Math.max(0.34, 0.76 * attackSpeed);
  }

  const railLevel = state.build.weapons.rail;
  if (railLevel > 0 && timers.rail <= 0) {
    fireBulletFan(state, "rail", 1, 0, 1300, 125 + railLevel * 42, 9, 1.05, { color: "#fff4a6", pierce: 4 + railLevel * 2 });
    timers.rail += Math.max(0.62, 1.42 * attackSpeed);
  }

  const rocketLevel = state.build.weapons.rocket;
  if (rocketLevel > 0 && timers.rocket <= 0) {
    fireBulletFan(state, "rocket", 1, 0, 440, 56 + rocketLevel * 24, 10, 2.6, { color: "#ffb35a", splash: 72 + rocketLevel * 15 });
    timers.rocket += Math.max(0.78, 1.78 * attackSpeed);
  }
}

function gridKey(column, row) {
  return (column + 32) * 1024 + (row + 32);
}

function rebuildEnemyGrid(state) {
  const grid = state.spatialGrid;
  grid.clear();
  for (const enemy of state.enemies) {
    if (enemy.dead) continue;
    const column = Math.floor(enemy.x / GRID_SIZE);
    const row = Math.floor(enemy.y / GRID_SIZE);
    const key = gridKey(column, row);
    let bucket = grid.get(key);
    if (!bucket) {
      bucket = [];
      grid.set(key, bucket);
    }
    bucket.push(enemy);
  }
}

function nearbyEnemies(state, x, y, radius = 0) {
  const found = [];
  const reach = Math.max(1, Math.ceil(radius / GRID_SIZE));
  const column = Math.floor(x / GRID_SIZE);
  const row = Math.floor(y / GRID_SIZE);
  for (let dx = -reach; dx <= reach; dx += 1) {
    for (let dy = -reach; dy <= reach; dy += 1) {
      const bucket = state.spatialGrid.get(gridKey(column + dx, row + dy));
      if (bucket) found.push(...bucket);
    }
  }
  return found;
}

function closestEnemy(state, x, y, maxDistance = Infinity) {
  let best = null;
  let bestSq = maxDistance * maxDistance;
  for (const enemy of state.enemies) {
    if (enemy.dead) continue;
    const dx = enemy.x - x;
    const dy = enemy.y - y;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq < bestSq) {
      best = enemy;
      bestSq = distanceSq;
    }
  }
  if (state.phase === "boss" && state.boss.active && !state.boss.dead) {
    const dx = state.boss.x - x;
    const dy = state.boss.y - y;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq < bestSq) best = state.boss;
  }
  return best;
}

function gainXp(state, amount) {
  const player = state.player;
  player.xp += amount;
  while (player.xp >= player.nextXp && !state.levelupPending) {
    player.xp -= player.nextXp;
    player.level += 1;
    state.stats.levels = player.level;
    player.nextXp = Math.round(48 + Math.pow(player.level, 1.22) * 18);
    state.levelupPending = true;
    state.rewardOptions = buildRewardOffer(state);
    state.rewardCycle += 1;
    state.flash = Math.max(state.flash, 0.34);
    emit(state, "levelUp", { level: player.level, options: state.rewardOptions.map((option) => option.id) });
    addText(state, `LEVEL ${player.level}`, player.x, player.y - 52, "#ffe371", 1.35);
  }
}

function spawnXpPickup(state, enemy) {
  if (state.pickups.length >= MAX_PICKUPS) {
    gainXp(state, enemy.xp);
    return;
  }
  state.pickups.push({
    id: ++state.nextEntityId,
    type: "xp",
    x: enemy.x,
    y: enemy.y,
    vx: 0,
    vy: 0,
    value: enemy.xp,
    age: 0,
    radius: enemy.elite ? 8 : 5,
    dead: false,
  });
}

function killEnemy(state, enemy, source = "weapon") {
  if (enemy.dead) return;
  enemy.dead = true;
  enemy.hp = 0;
  state.killedEnemies += 1;
  state.stats.kills += 1;
  spawnXpPickup(state, enemy);
  burst(state, enemy.x, enemy.y, enemy.elite ? "#ffe06b" : enemy.color, enemy.elite ? 16 : 6, enemy.elite ? 250 : 150, 0.55, enemy.elite ? 7 : 4);
  if (enemy.elite) addText(state, "ELITE DOWN", enemy.x, enemy.y - 28, "#ffe371", 0.9);
  if (state.killedEnemies % 4 === 0 || enemy.elite) emit(state, "enemyKilled", { type: enemy.type, elite: enemy.elite, source });
}

function damageEnemy(state, enemy, amount, source = "weapon") {
  if (!enemy || enemy.dead || amount <= 0) return 0;
  const dealt = Math.min(enemy.hp, amount);
  enemy.hp -= dealt;
  enemy.hitFlash = 0.09;
  state.stats.hits += 1;
  state.stats.damageDealt += dealt;
  if (enemy.hp <= 0) killEnemy(state, enemy, source);
  return dealt;
}

function damageBoss(state, amount, source = "weapon") {
  const boss = state.boss;
  if (!boss.active || boss.dead || amount <= 0) return 0;
  const multiplier = boss.weakness > 0 ? 2 : 1;
  boss.damageMultiplier = multiplier;
  const dealt = Math.min(boss.hp, amount * multiplier);
  boss.hp -= dealt;
  boss.hitFlash = 0.1;
  state.stats.hits += 1;
  state.stats.damageDealt += dealt;
  if (boss.hp <= boss.maxHp * 0.66 && boss.stage === 1) {
    boss.stage = 2;
    boss.patternCooldown = Math.min(boss.patternCooldown, 0.45);
    emit(state, "bossStage", { stage: 2 });
  }
  if (boss.hp <= boss.maxHp * 0.33 && boss.stage === 2) {
    boss.stage = 3;
    boss.patternCooldown = Math.min(boss.patternCooldown, 0.35);
    emit(state, "bossStage", { stage: 3 });
  }
  if (boss.hp <= 0) {
    boss.hp = 0;
    boss.dead = true;
    state.phase = "victory";
    state.status = "victory";
    state.phaseTime = 0;
    state.shake = 26;
    state.flash = 0.75;
    burst(state, boss.x, boss.y, "#ff385d", 80, 440, 1.2, 9);
    addText(state, "THE WRONG ENGINE DESTROYED", boss.x, boss.y - 100, "#ffffff", 1.5);
    emit(state, "win", { kills: state.stats.kills, level: state.player.level });
  }
  return dealt;
}

function explodeRocket(state, projectile) {
  const targets = state.phase === "boss" ? [] : nearbyEnemies(state, projectile.x, projectile.y, projectile.splash);
  for (const enemy of targets) {
    const distance = Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y);
    if (distance <= projectile.splash + enemy.radius) damageEnemy(state, enemy, projectile.damage * (1 - distance / (projectile.splash * 1.8)), "rocket");
  }
  if (state.phase === "boss") {
    const distance = Math.hypot(state.boss.x - projectile.x, state.boss.y - projectile.y);
    if (distance <= projectile.splash + state.boss.radius) damageBoss(state, projectile.damage, "rocket");
  }
  burst(state, projectile.x, projectile.y, "#ffad55", 18, 260, 0.65, 7);
  state.shake = Math.max(state.shake, 6);
  emit(state, "explosion", { x: projectile.x, y: projectile.y });
}

function updateProjectiles(state, dt) {
  for (const projectile of state.projectiles) {
    if (projectile.dead) continue;
    projectile.life -= dt;
    projectile.px = projectile.x;
    projectile.py = projectile.y;
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    if (projectile.life <= 0 || projectile.x < -80 || projectile.x > GAME_WIDTH + 80 || projectile.y < -80 || projectile.y > GAME_HEIGHT + 80) {
      if (projectile.kind === "rocket" && projectile.life <= 0) explodeRocket(state, projectile);
      projectile.dead = true;
      continue;
    }

    if (state.phase === "boss") {
      const boss = state.boss;
      if (boss.active && !boss.dead && Math.hypot(projectile.x - boss.x, projectile.y - boss.y) <= projectile.radius + boss.radius) {
        damageBoss(state, projectile.damage, projectile.kind);
        if (projectile.kind === "rocket") explodeRocket(state, projectile);
        projectile.dead = true;
      }
      continue;
    }

    const candidates = nearbyEnemies(state, projectile.x, projectile.y, projectile.radius + 28);
    for (const enemy of candidates) {
      if (enemy.dead || projectile.dead) continue;
      if (projectile.hitIds?.has(enemy.id)) continue;
      if (Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y) > projectile.radius + enemy.radius) continue;
      damageEnemy(state, enemy, projectile.damage, projectile.kind);
      if (projectile.kind === "rocket") {
        explodeRocket(state, projectile);
        projectile.dead = true;
      } else if (projectile.pierce > 0) {
        projectile.hitIds?.add(enemy.id);
        projectile.pierce -= 1;
      } else {
        projectile.dead = true;
      }
    }
  }
  compact(state.projectiles, (projectile) => !projectile.dead);
}

function pushEnemyProjectile(state, x, y, angle, speed, damage, kind = "enemy", radius = 7, life = 4) {
  if (state.enemyProjectiles.length >= MAX_ENEMY_PROJECTILES) return false;
  state.enemyProjectiles.push({
    id: ++state.nextEntityId,
    kind,
    x,
    y,
    px: x,
    py: y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    angle,
    speed,
    damage,
    radius,
    color: kind === "boss" ? "#ff385d" : "#ff9f57",
    life,
    dead: false,
  });
  return true;
}

function damagePlayer(state, amount, source) {
  const player = state.player;
  if (player.dead || player.invulnerability > 0 || amount <= 0 || state.phase === "victory" || state.phase === "defeat") return false;
  let remaining = amount;
  if (player.shield > 0) {
    const absorbed = Math.min(player.shield, remaining);
    player.shield -= absorbed;
    remaining -= absorbed;
  }
  if (remaining > 0) player.hp = Math.max(0, player.hp - remaining);
  player.shieldDelay = 3.5;
  player.invulnerability = 0.48;
  player.hitFlash = 0.16;
  state.stats.damageTaken += amount;
  state.shake = Math.max(state.shake, 10);
  burst(state, player.x, player.y, "#ff4968", 12, 220, 0.48, 5);
  addText(state, `-${Math.round(amount)}`, player.x, player.y - 34, "#ff647a", 0.9);
  emit(state, "playerHit", { damage: amount, source });
  if (player.hp <= 0) {
    player.hp = 0;
    player.dead = true;
    state.phase = "defeat";
    state.status = "defeat";
    state.phaseTime = 0;
    emit(state, "loss", { reason: source, kills: state.stats.kills });
  }
  return true;
}

function updateEnemyProjectiles(state, dt) {
  const player = state.player;
  for (const projectile of state.enemyProjectiles) {
    if (projectile.dead) continue;
    projectile.life -= dt;
    projectile.px = projectile.x;
    projectile.py = projectile.y;
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    if (projectile.life <= 0 || projectile.x < -100 || projectile.x > GAME_WIDTH + 100 || projectile.y < -100 || projectile.y > GAME_HEIGHT + 100) {
      projectile.dead = true;
      continue;
    }
    if (Math.hypot(projectile.x - player.x, projectile.y - player.y) <= projectile.radius + player.radius) {
      if (damagePlayer(state, projectile.damage, projectile.kind)) {
        if (projectile.kind === "boss") state.stats.bossPatternsHit += 1;
      }
      projectile.dead = true;
    }
  }
  compact(state.enemyProjectiles, (projectile) => !projectile.dead);
}

function updateEnemies(state, dt) {
  const player = state.player;
  for (const enemy of state.enemies) {
    if (enemy.dead) continue;
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    enemy.attackCooldown -= dt;
    enemy.shootCooldown -= dt;
    enemy.slow = Math.max(0, enemy.slow - dt);
    enemy.orbitHitCooldown = Math.max(0, enemy.orbitHitCooldown - dt);
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.max(0.001, Math.hypot(dx, dy));
    const toward = { x: dx / distance, y: dy / distance };
    const slowScale = enemy.slow > 0 ? 0.48 : 1;
    let movement = 1;
    if (enemy.type === "suppressor" && distance < 270) movement = distance < 210 ? -0.4 : 0;
    enemy.vx = toward.x * enemy.speed * slowScale * movement;
    enemy.vy = toward.y * enemy.speed * slowScale * movement;
    enemy.x = clamp(enemy.x + enemy.vx * dt, ARENA.left, ARENA.right);
    enemy.y = clamp(enemy.y + enemy.vy * dt, ARENA.top, ARENA.bottom);
    enemy.angle = Math.atan2(dy, dx);

    if (enemy.type === "suppressor" && distance < 430 && enemy.shootCooldown <= 0) {
      pushEnemyProjectile(state, enemy.x, enemy.y, enemy.angle, 270, enemy.damage, "suppressor", 6, 2.4);
      enemy.shootCooldown = enemy.elite ? 1.05 : 1.65;
    }
    if (distance <= enemy.radius + player.radius + 2 && enemy.attackCooldown <= 0) {
      damagePlayer(state, enemy.damage, enemy.type);
      enemy.attackCooldown = enemy.elite ? 0.62 : 0.9;
    }
  }
  compact(state.enemies, (enemy) => !enemy.dead);
}

function updatePickups(state, dt) {
  const player = state.player;
  for (const pickup of state.pickups) {
    if (pickup.dead) continue;
    pickup.age += dt;
    const dx = player.x - pickup.x;
    const dy = player.y - pickup.y;
    const distance = Math.max(0.001, Math.hypot(dx, dy));
    if (distance < 190 || pickup.age > 1.15) {
      const speed = clamp(170 + pickup.age * 260, 170, 780);
      pickup.vx = (dx / distance) * speed;
      pickup.vy = (dy / distance) * speed;
      pickup.x += pickup.vx * dt;
      pickup.y += pickup.vy * dt;
    }
    if (distance <= player.radius + pickup.radius + 9) {
      pickup.dead = true;
      gainXp(state, pickup.value);
      emit(state, "xp", { amount: pickup.value });
    }
  }
  compact(state.pickups, (pickup) => !pickup.dead);
}

function updateOrbitWeapon(state, dt) {
  const level = state.build.weapons.orbit;
  if (level <= 0 || state.phase !== "swarm") return;
  const player = state.player;
  player.orbitAngle = (player.orbitAngle + dt * (2.4 + level * 0.16)) % TAU;
  const bladeCount = Math.min(5, 1 + level);
  const distance = 68 + level * 7;
  for (let index = 0; index < bladeCount; index += 1) {
    const angle = player.orbitAngle + (index / bladeCount) * TAU;
    const x = player.x + Math.cos(angle) * distance;
    const y = player.y + Math.sin(angle) * distance;
    for (const enemy of nearbyEnemies(state, x, y, 34)) {
      if (!enemy.dead && enemy.orbitHitCooldown <= 0 && Math.hypot(enemy.x - x, enemy.y - y) <= enemy.radius + 14) {
        damageEnemy(state, enemy, (22 + level * 10) * player.damageMultiplier, "orbit");
        enemy.orbitHitCooldown = 0.28;
      }
    }
  }
}

function syncAllies(state) {
  const wantedDrones = Math.min(4, state.build.allies.drone);
  const wantedSuppressors = Math.min(3, state.build.allies.suppressor);
  const drones = state.allies.filter((ally) => ally.type === "drone").length;
  const suppressors = state.allies.filter((ally) => ally.type === "suppressor").length;
  for (let index = drones; index < wantedDrones; index += 1) {
    state.allies.push({ id: ++state.nextEntityId, type: "drone", x: state.player.x, y: state.player.y, angle: 0, orbit: state.random() * TAU, fireCooldown: 0 });
  }
  for (let index = suppressors; index < wantedSuppressors; index += 1) {
    state.allies.push({ id: ++state.nextEntityId, type: "suppressor", x: state.player.x, y: state.player.y, angle: 0, orbit: state.random() * TAU, fireCooldown: 0, pulseCooldown: 0 });
  }
}

function updateAllies(state, dt) {
  syncAllies(state);
  const total = Math.max(1, state.allies.length);
  for (let index = 0; index < state.allies.length; index += 1) {
    const ally = state.allies[index];
    ally.orbit += dt * (ally.type === "drone" ? 0.75 : -0.55);
    const radius = ally.type === "drone" ? 78 : 105;
    const targetX = state.player.x + Math.cos(ally.orbit + (index / total) * TAU) * radius;
    const targetY = state.player.y + Math.sin(ally.orbit + (index / total) * TAU) * radius;
    ally.x += (targetX - ally.x) * Math.min(1, dt * 7);
    ally.y += (targetY - ally.y) * Math.min(1, dt * 7);
    ally.fireCooldown -= dt;
    ally.pulseCooldown -= dt;
    const target = closestEnemy(state, ally.x, ally.y, ally.type === "drone" ? 510 : 300);
    if (target) {
      ally.angle = Math.atan2(target.y - ally.y, target.x - ally.x);
      if (ally.type === "drone" && ally.fireCooldown <= 0) {
        const damage = (18 + state.build.allies.drone * 6) * state.player.damageMultiplier;
        pushPlayerProjectile(state, {
          kind: "drone",
          x: ally.x,
          y: ally.y,
          vx: Math.cos(ally.angle) * 720,
          vy: Math.sin(ally.angle) * 720,
          angle: ally.angle,
          radius: 4,
          damage,
          color: "#68f6ff",
          life: 1.2,
          pierce: 0,
          splash: 0,
          hitIds: null,
        });
        ally.fireCooldown = 0.62;
      }
      if (ally.type === "suppressor" && ally.pulseCooldown <= 0) {
        for (const enemy of state.enemies) {
          if (!enemy.dead && Math.hypot(enemy.x - ally.x, enemy.y - ally.y) < 170) {
            enemy.slow = Math.max(enemy.slow, 1.1);
            damageEnemy(state, enemy, (8 + state.build.allies.suppressor * 4) * state.player.damageMultiplier, "suppressorAlly");
          }
        }
        ally.pulseCooldown = 1.25;
        emit(state, "allyPulse", { x: ally.x, y: ally.y });
      }
    }
  }

  for (const sentry of state.deployables) {
    sentry.fireCooldown -= dt;
    const target = closestEnemy(state, sentry.x, sentry.y, 560);
    if (!target) continue;
    sentry.angle = Math.atan2(target.y - sentry.y, target.x - sentry.x);
    if (sentry.fireCooldown <= 0) {
      pushPlayerProjectile(state, {
        kind: "sentry",
        x: sentry.x,
        y: sentry.y,
        vx: Math.cos(sentry.angle) * 760,
        vy: Math.sin(sentry.angle) * 760,
        angle: sentry.angle,
        radius: 4,
        damage: (21 + sentry.level * 5) * state.player.damageMultiplier,
        color: "#ffe86d",
        life: 1.3,
        pierce: 0,
        splash: 0,
        hitIds: null,
      });
      sentry.fireCooldown = Math.max(0.2, 0.48 - sentry.level * 0.035);
    }
  }
}

function buildRewardOffer(state) {
  const offer = [];
  const categories = ["weapon", "skill", "ally"];
  for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex += 1) {
    const category = categories[categoryIndex];
    const pool = REWARD_POOLS[category];
    const offset = Math.floor(clamp(state.random(), 0, 0.999999) * pool.length);
    const id = pool[(state.rewardCycle + categoryIndex + offset) % pool.length];
    const definition = REWARD_DEFINITIONS[id];
    const currentLevel = state.build[`${category}${category === "ally" ? "ies" : "s"}`]?.[id]
      ?? (category === "weapon" ? state.build.weapons[id] : category === "skill" ? state.build.skills[id] : state.build.allies[id])
      ?? 0;
    offer.push({ ...definition, level: currentLevel, nextLevel: currentLevel + 1 });
  }
  return offer;
}

function applyReward(state, id) {
  const definition = REWARD_DEFINITIONS[id];
  if (!definition) return false;
  if (definition.category === "weapon") {
    state.build.weapons[id] = (state.build.weapons[id] || 0) + 1;
  } else if (definition.category === "skill") {
    state.build.skills[id] = (state.build.skills[id] || 0) + 1;
    const level = state.build.skills[id];
    if (id === "damage") state.player.damageMultiplier *= 1.25;
    if (id === "fireRate") state.player.fireRateMultiplier *= 0.84;
    if (id === "multishot") state.player.multishot = Math.min(5, state.player.multishot + 1);
    if (id === "shield") {
      state.player.shieldMax += 40;
      state.player.shield = state.player.shieldMax;
    }
    if (id === "dash") state.player.dashMax = Math.max(0.82, 2.35 - level * 0.28);
    if (id === "regen") state.player.regen += 1.8;
  } else {
    state.build.allies[id] = (state.build.allies[id] || 0) + 1;
    if (id === "sentry") {
      const existing = state.deployables.find((deployable) => deployable.type === "sentry" && deployable.level < 4);
      if (existing) existing.level += 1;
      else if (state.deployables.length < 4) {
        state.deployables.push({ id: ++state.nextEntityId, type: "sentry", x: state.player.x, y: state.player.y, angle: state.player.angle, fireCooldown: 0, level: 1 });
      }
    }
    syncAllies(state);
  }
  return true;
}

export function chooseLevelReward(state, id) {
  if (!state?.levelupPending || !REWARD_DEFINITIONS[id]) return false;
  if (!state.rewardOptions.some((option) => option.id === id)) return false;
  if (!applyReward(state, id)) return false;
  state.levelupPending = false;
  state.rewardOptions = [];
  state.stats.rewardsChosen += 1;
  state.flash = Math.max(state.flash, 0.22);
  emit(state, "rewardChosen", { id, category: REWARD_DEFINITIONS[id].category });
  addText(state, REWARD_DEFINITIONS[id].name, state.player.x, state.player.y - 54, "#ffe371", 1.05);
  if (state.player.xp >= state.player.nextXp) gainXp(state, 0);
  return true;
}

function startBossPhase(state) {
  state.phase = "boss";
  state.phaseTime = 0;
  state.phaseTransition = 0;
  state.boss.active = true;
  state.boss.patternCooldown = 1.45;
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + state.player.maxHp * 0.4);
  state.player.shield = state.player.shieldMax;
  state.enemyProjectiles.length = 0;
  state.projectiles.length = 0;
  state.pickups.length = 0;
  state.telegraphs.length = 0;
  state.flash = 0.65;
  state.shake = 18;
  addText(state, "THE WRONG ENGINE", GAME_WIDTH * 0.5, 132, "#ff4b63", 1.65);
  emit(state, "bossIntro", { hp: state.boss.hp, patterns: BOSS_PATTERNS });
}

function updateSwarmSpawning(state, dt) {
  if (state.spawnedEnemies < state.enemyBudget) {
    state.spawnAccumulator += dt * 11;
    while (state.spawnAccumulator >= 1 && state.enemies.length < MAX_LIVE_ENEMIES && state.spawnedEnemies < state.enemyBudget) {
      state.spawnAccumulator -= 1;
      spawnEnemy(state);
    }
  }
  state.stats.peakEnemies = Math.max(state.stats.peakEnemies, state.enemies.length);
  if (state.spawnedEnemies >= state.enemyBudget && state.killedEnemies >= state.enemyBudget && state.enemies.length === 0) {
    if (state.phaseTransition <= 0) {
      state.phaseTransition = 2;
      emit(state, "swarmCleared", { kills: state.killedEnemies });
      addText(state, "SWARM PURGED", GAME_WIDTH * 0.5, GAME_HEIGHT * 0.45, "#72f2ff", 1.45);
    } else {
      state.phaseTransition -= dt;
      if (state.phaseTransition <= 0) startBossPhase(state);
    }
  }
}

function pointLineDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq > 0 ? clamp(((px - x1) * dx + (py - y1) * dy) / lengthSq, 0, 1) : 0;
  return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
}

function beginBossPattern(state) {
  const boss = state.boss;
  const type = BOSS_PATTERNS[boss.patternIndex % BOSS_PATTERNS.length];
  boss.patternIndex += 1;
  const playerAngle = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);
  let pattern;
  if (type === "radial") {
    pattern = { type, phase: "warning", x: boss.x, y: boss.y, angle: playerAngle, radius: 120, width: 12, life: 0.95, maxLife: 0.95, fired: false };
  } else if (type === "sweep") {
    pattern = { type, phase: "warning", x: boss.x, y: boss.y, angle: playerAngle - 0.9, startAngle: playerAngle - 0.9, endAngle: playerAngle + 1.05, radius: 980, width: 28, life: 1.1, maxLife: 1.1, activeLife: 1.25, fired: false, hit: false };
  } else if (type === "bombs") {
    const targets = [];
    const count = 4 + boss.stage;
    for (let index = 0; index < count; index += 1) {
      const lead = index * 0.12;
      targets.push({
        x: clamp(state.player.x + state.player.vx * lead + (state.random() - 0.5) * 210, ARENA.left + 50, ARENA.right - 50),
        y: clamp(state.player.y + state.player.vy * lead + (state.random() - 0.5) * 170, ARENA.top + 50, ARENA.bottom - 50),
        radius: 58 + boss.stage * 5,
        hit: false,
      });
    }
    pattern = { type, phase: "warning", x: boss.x, y: boss.y, angle: playerAngle, radius: 65, width: 5, targets, life: 1.15, maxLife: 1.15, fired: false };
  } else if (type === "rings") {
    pattern = { type, phase: "warning", x: boss.x, y: boss.y, angle: 0, radius: 70, width: 15, life: 1.05, maxLife: 1.05, rings: 2 + boss.stage, fired: false };
  } else {
    const direction = normalize(state.player.x - boss.x, state.player.y - boss.y);
    const boundary = rayToEllipseBoundary(boss.x, boss.y, direction, boss.radius * 0.72);
    pattern = {
      type,
      phase: "warning",
      x: boss.x,
      y: boss.y,
      originX: boss.x,
      originY: boss.y,
      playerTargetX: state.player.x,
      playerTargetY: state.player.y,
      targetX: boundary.x,
      targetY: boundary.y,
      directionX: direction.x,
      directionY: direction.y,
      angle: Math.atan2(direction.y, direction.x),
      radius: boundary.distance,
      width: 46,
      life: 0.72,
      maxLife: 0.72,
      activeLife: 0.52,
      fired: false,
      hit: false,
      reachedBoundary: false,
    };
  }
  boss.activePattern = pattern;
  state.telegraphs.push(pattern);
  emit(state, "bossPatternTelegraph", { pattern: type, duration: pattern.maxLife });
}

function fireBossPattern(state, pattern) {
  const boss = state.boss;
  pattern.fired = true;
  emit(state, "bossPatternFire", { pattern: pattern.type });
  if (pattern.type === "radial") {
    const count = 20 + boss.stage * 6;
    const offset = boss.patternIndex * 0.21;
    for (let index = 0; index < count; index += 1) {
      pushEnemyProjectile(state, boss.x, boss.y, offset + (index / count) * TAU, 225 + boss.stage * 28, 7 + boss.stage * 2, "boss", 7, 5.2);
    }
    burst(state, boss.x, boss.y, "#ff3f60", 26, 260, 0.6, 6);
    boss.activePattern = null;
  } else if (pattern.type === "sweep") {
    pattern.phase = "active";
    pattern.life = pattern.activeLife;
    pattern.maxLife = pattern.activeLife;
    pattern.angle = pattern.startAngle;
  } else if (pattern.type === "bombs") {
    let anyHit = false;
    for (const target of pattern.targets) {
      if (Math.hypot(state.player.x - target.x, state.player.y - target.y) <= target.radius + state.player.radius) {
        if (damagePlayer(state, 18 + boss.stage * 3, "bossBomb")) anyHit = true;
      }
      burst(state, target.x, target.y, "#ff5b55", 12, 240, 0.55, 6);
    }
    if (!anyHit) state.stats.bossPatternsDodged += 1;
    boss.activePattern = null;
  } else if (pattern.type === "rings") {
    pattern.phase = "active";
    pattern.life = 2.15;
    pattern.maxLife = 2.15;
    pattern.startRadius = 76;
    pattern.radius = 76;
    pattern.hitRings = new Set();
  } else if (pattern.type === "charge") {
    pattern.phase = "active";
    pattern.life = pattern.activeLife;
    pattern.maxLife = pattern.activeLife;
    const distance = Math.max(1, Math.hypot(pattern.targetX - boss.x, pattern.targetY - boss.y));
    pattern.chargeSpeed = distance / 0.47;
    boss.vx = pattern.directionX * pattern.chargeSpeed;
    boss.vy = pattern.directionY * pattern.chargeSpeed;
  }
}

function exposeBossCore(state, pattern) {
  const boss = state.boss;
  const duration = 3;
  boss.x = pattern.targetX;
  boss.y = pattern.targetY;
  boss.vx = 0;
  boss.vy = 0;
  boss.weakness = duration;
  boss.damageMultiplier = 2;
  boss.patternCooldown = duration;
  pattern.reachedBoundary = true;
  pattern.life = 0;
  boss.activePattern = null;
  state.stats.bossPatternsDodged += 1;
  state.shake = Math.max(state.shake, 18);
  state.flash = Math.max(state.flash, 0.32);
  burst(state, boss.x, boss.y, "#ffe06b", 34, 310, 0.85, 7);
  addText(state, "CORE EXPOSED ×2", boss.x, boss.y - 92, "#ffe371", 1.3);
  emit(state, "bossWeakness", { duration, multiplier: 2 });
}

function updateBossPattern(state, dt) {
  const boss = state.boss;
  let pattern = boss.activePattern;
  if (!pattern) {
    boss.patternCooldown -= dt;
    if (boss.patternCooldown <= 0) beginBossPattern(state);
    return;
  }
  pattern.life -= dt;
  if (pattern.phase === "warning") {
    if (pattern.life <= 0) fireBossPattern(state, pattern);
    return;
  }
  if (pattern.type === "sweep") {
    const progress = 1 - pattern.life / pattern.maxLife;
    pattern.angle = pattern.startAngle + (pattern.endAngle - pattern.startAngle) * progress;
    const endX = boss.x + Math.cos(pattern.angle) * pattern.radius;
    const endY = boss.y + Math.sin(pattern.angle) * pattern.radius;
    if (!pattern.hit && pointLineDistance(state.player.x, state.player.y, boss.x, boss.y, endX, endY) <= pattern.width + state.player.radius) {
      if (damagePlayer(state, 24 + boss.stage * 4, "bossSweep")) pattern.hit = true;
    }
    if (pattern.life <= 0) {
      if (!pattern.hit) state.stats.bossPatternsDodged += 1;
      boss.activePattern = null;
    }
  } else if (pattern.type === "rings") {
    const progress = 1 - pattern.life / pattern.maxLife;
    const maxRadius = 830;
    const spacing = 150;
    pattern.radius = pattern.startRadius + progress * maxRadius;
    for (let ring = 0; ring < pattern.rings; ring += 1) {
      const ringRadius = pattern.radius - ring * spacing;
      if (ringRadius < 0 || pattern.hitRings.has(ring)) continue;
      const distance = Math.hypot(state.player.x - boss.x, state.player.y - boss.y);
      if (Math.abs(distance - ringRadius) < pattern.width + state.player.radius) {
        if (damagePlayer(state, 15 + boss.stage * 3, "bossRing")) pattern.hitRings.add(ring);
      }
    }
    if (pattern.life <= 0) {
      if (pattern.hitRings.size === 0) state.stats.bossPatternsDodged += 1;
      boss.activePattern = null;
    }
  } else if (pattern.type === "charge") {
    const remainingX = pattern.targetX - boss.x;
    const remainingY = pattern.targetY - boss.y;
    const remainingDistance = Math.hypot(remainingX, remainingY);
    const travel = pattern.chargeSpeed * dt;
    if (travel >= remainingDistance || pattern.life <= 0) {
      exposeBossCore(state, pattern);
    } else {
      boss.vx = pattern.directionX * pattern.chargeSpeed;
      boss.vy = pattern.directionY * pattern.chargeSpeed;
      boss.x += boss.vx * dt;
      boss.y += boss.vy * dt;
      if (Math.hypot(state.player.x - boss.x, state.player.y - boss.y) <= state.player.radius + boss.radius) {
        if (damagePlayer(state, 48 + boss.stage * 6, "bossCharge")) {
          pattern.hit = true;
          pattern.life = 0;
          boss.vx = 0;
          boss.vy = 0;
          boss.activePattern = null;
          boss.patternCooldown = 1.35;
          state.stats.bossPatternsHit += 1;
          state.shake = Math.max(state.shake, 20);
          emit(state, "bossChargeHit", { damage: 48 + boss.stage * 6 });
        }
      }
    }
  }
  if (!boss.activePattern && boss.patternCooldown <= 0) boss.patternCooldown = Math.max(0.6, 2.1 - boss.stage * 0.28);
}

function updateBoss(state, dt) {
  const boss = state.boss;
  boss.hitFlash = Math.max(0, boss.hitFlash - dt);
  boss.contactCooldown = Math.max(0, boss.contactCooldown - dt);
  boss.weakness = Math.max(0, boss.weakness - dt);
  boss.damageMultiplier = boss.weakness > 0 ? 2 : 1;
  if (boss.activePattern?.type !== "charge" && boss.weakness <= 0) {
    const desiredX = GAME_WIDTH * 0.76 + Math.sin(state.phaseTime * 0.43) * 125;
    const desiredY = GAME_HEIGHT * 0.5 + Math.sin(state.phaseTime * 0.71) * 190;
    boss.vx = (desiredX - boss.x) * 0.65;
    boss.vy = (desiredY - boss.y) * 0.65;
    boss.x = clamp(boss.x + boss.vx * dt, ARENA.left + boss.radius, ARENA.right - boss.radius);
    boss.y = clamp(boss.y + boss.vy * dt, ARENA.top + boss.radius, ARENA.bottom - boss.radius);
  } else if (boss.activePattern?.phase === "warning" || boss.weakness > 0) {
    boss.vx = 0;
    boss.vy = 0;
  }
  boss.angle = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);
  if (boss.activePattern?.type !== "charge"
    && Math.hypot(state.player.x - boss.x, state.player.y - boss.y) <= state.player.radius + boss.radius
    && boss.contactCooldown <= 0) {
    damagePlayer(state, 20, "bossContact");
    boss.contactCooldown = 0.9;
  }
  updateBossPattern(state, dt);
}

function updateEffects(state, dt) {
  state.shake = Math.max(0, state.shake - dt * 28);
  state.flash = Math.max(0, state.flash - dt * 2.4);
  for (const particle of state.particles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= Math.pow(0.04, dt);
    particle.vy *= Math.pow(0.04, dt);
  }
  compact(state.particles, (particle) => particle.life > 0);
  for (const text of state.texts) {
    text.life -= dt;
    text.y += text.vy * dt;
  }
  compact(state.texts, (text) => text.life > 0);
  compact(state.telegraphs, (telegraph) => telegraph === state.boss.activePattern || telegraph.life > 0);
}

export function stepSwarm(state, input, dt) {
  if (!state || state.status !== "running") return state;
  const delta = clamp(finite(dt, 0), 0, 0.05);
  if (delta <= 0) return state;
  if (state.levelupPending) return state;

  state.time = Math.min(state.duration, state.time + delta);
  state.timeLeft = Math.max(0, state.duration - state.time);
  state.phaseTime += delta;
  if (state.time >= state.duration) {
    state.phase = "defeat";
    state.status = "defeat";
    state.player.dead = true;
    emit(state, "loss", { reason: "timeout", kills: state.stats.kills });
    return state;
  }

  updatePlayer(state, input, delta);
  updateAutoWeapons(state, delta);
  updateAllies(state, delta);

  if (state.phase === "swarm") {
    updateEnemies(state, delta);
    rebuildEnemyGrid(state);
    updateOrbitWeapon(state, delta);
    updateProjectiles(state, delta);
    updateEnemyProjectiles(state, delta);
    updatePickups(state, delta);
    updateSwarmSpawning(state, delta);
  } else if (state.phase === "boss") {
    updateBoss(state, delta);
    updateProjectiles(state, delta);
    updateEnemyProjectiles(state, delta);
  }

  updateEffects(state, delta);
  return state;
}

export function drainSwarmEvents(state) {
  if (!state?.events) return [];
  const events = state.events.slice();
  state.events.length = 0;
  return events;
}

export function getSwarmHud(state) {
  const player = state.player;
  const remaining = Math.max(0, state.enemyBudget - state.killedEnemies);
  return {
    phase: state.phase,
    status: state.status,
    time: state.time,
    timeLeft: state.timeLeft,
    remaining: state.timeLeft,
    phaseTime: state.phaseTime,
    enemiesRemaining: remaining,
    remainingEnemies: remaining,
    totalEnemies: state.enemyBudget,
    enemyBudget: state.enemyBudget,
    swarmProgress: state.enemyBudget > 0
      ? clamp(state.killedEnemies / state.enemyBudget, 0, 1)
      : 1,
    spawnedEnemies: state.spawnedEnemies,
    liveEnemies: state.enemies.length,
    kills: state.stats.kills,
    level: player.level,
    xp: player.xp,
    nextXp: player.nextXp,
    player: {
      hp: player.hp,
      maxHp: player.maxHp,
      shield: player.shield,
      shieldMax: player.shieldMax,
      dashCooldown: player.dashCooldown,
      dashMax: player.dashMax,
    },
    boss: state.boss.active ? {
      name: state.boss.name,
      hp: state.boss.hp,
      maxHp: state.boss.maxHp,
      stage: state.boss.stage,
      pattern: state.boss.activePattern?.type ?? null,
      weakness: state.boss.weakness,
      damageMultiplier: state.boss.damageMultiplier,
    } : null,
    rewards: {
      pending: state.levelupPending,
      options: state.rewardOptions.map((option) => ({ ...option })),
    },
    build: {
      weapons: { ...state.build.weapons },
      skills: { ...state.build.skills },
      allies: { ...state.build.allies },
    },
    stats: { ...state.stats },
  };
}

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

const TAU = Math.PI * 2;
const ARENA = Object.freeze({ left: 34, right: 1246, top: 34, bottom: 686 });
const INITIAL_SWARM = 128;
const DEFAULT_ENEMY_BUDGET = 1000;
const MAX_LIVE_ENEMIES = 220;
const MAX_PROJECTILES = 620;
const MAX_ENEMY_PROJECTILES = 360;
const MAX_PARTICLES = 320;
const MAX_PICKUPS = 220;
const GRID_SIZE = 96;
const FLOOR_ELLIPSE = Object.freeze({ x: 640, y: 360, rx: 555, ry: 292 });
const SURGE_WAVES = Object.freeze([
  Object.freeze({ warnAt: 6, startAt: 7.25, count: 180, rate: 58, label: "RED TIDE · 180" }),
  Object.freeze({ warnAt: 17, startAt: 18.4, count: 280, rate: 84, label: "BREACH FLOOD · 280" }),
  Object.freeze({ warnAt: 30, startAt: 31.5, count: 412, rate: 118, label: "TERMINAL OVERLOAD · 412" }),
]);

const OVERDRIVE_THRESHOLDS = Object.freeze([0.48, 0.72, 0.88]);

export const BOSS_PATTERNS = Object.freeze(["radial", "sweep", "bombs", "rings", "charge", "multiCharge"]);

const SQUAD_RECALL_DURATION = 12;
const SQUAD_RECALL_COOLDOWN = 30;
const SQUAD_FORMATION = Object.freeze([
  Object.freeze({ type: "vanguard", name: "AEGIS ECHO", x: -82, y: -66, color: "#63efff" }),
  Object.freeze({ type: "gunner", name: "ROOK", x: 82, y: -66, color: "#ffad42" }),
  Object.freeze({ type: "arcanist", name: "NYX", x: -92, y: 62, color: "#ba7dff" }),
  Object.freeze({ type: "warden", name: "MOSS", x: 92, y: 62, color: "#76f09c" }),
]);

const ENEMY_DATA = Object.freeze({
  hunter: Object.freeze({ hp: 38, speed: 88, radius: 14, damage: 12, xp: 4, color: "#ff526d" }),
  suppressor: Object.freeze({ hp: 68, speed: 61, radius: 17, damage: 12, xp: 7, color: "#f3ab42" }),
  brute: Object.freeze({ hp: 132, speed: 44, radius: 23, damage: 22, xp: 10, color: "#d93955" }),
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
  chain: Object.freeze({ id: "chain", category: "skill", name: "ARC CASCADE", description: "Periodically chains lightning through packed targets. Rank 3 unlocks a full storm." }),
  nova: Object.freeze({ id: "nova", category: "skill", name: "ZERO-POINT NOVA", description: "Detonates a radial shockwave. Rank 3 repeats it across the visible combat zone." }),
  airstrike: Object.freeze({ id: "airstrike", category: "skill", name: "SKYFALL SUPPORT", description: "Calls a long-cooldown airstrike on dense enemy formations." }),
  omegaLaser: Object.freeze({ id: "omegaLaser", category: "skill", name: "OMEGA LASER", description: "Charges a colossal support beam through the aimed lane." }),
  drone: Object.freeze({ id: "drone", category: "ally", name: "HUNTER DRONE", description: "A mobile drone automatically hunts nearby targets." }),
  sentry: Object.freeze({ id: "sentry", category: "ally", name: "PULSE SENTRY", description: "Deploy a rapid-fire turret at your position." }),
  suppressor: Object.freeze({ id: "suppressor", category: "ally", name: "SUPPRESSOR WISP", description: "An escort slows and shocks dense enemy packs." }),
});

const REWARD_POOLS = Object.freeze({
  weapon: Object.freeze(["scatter", "rail", "rocket", "orbit"]),
  skill: Object.freeze(["airstrike", "omegaLaser", "chain", "nova", "damage", "fireRate", "multishot", "shield", "dash", "regen"]),
  ally: Object.freeze(["drone", "sentry", "suppressor"]),
});

const MAX_REWARD_RANK = Object.freeze({
  scatter: 5, rail: 5, rocket: 5, orbit: 5,
  chain: 3, nova: 3, airstrike: 3, omegaLaser: 3,
  damage: 5, fireRate: 5, multishot: 4, shield: 4, dash: 4, regen: 4,
  drone: 4, sentry: 4, suppressor: 4,
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
  const datasetProgress = clamp(spawnIndex / Math.max(1, state.enemyBudget - 1), 0, 1);
  const scale = elite ? 1.3 : 1;
  const hpScale = (elite ? 2.35 : 1) * (1 + datasetProgress * 0.45);
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
    speed: base.speed * (elite ? 1.08 : 1) * (1 + datasetProgress * 0.12),
    damage: base.damage * (elite ? 1.55 : 1) * (1 + datasetProgress * 0.22),
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
    hp: 360,
    maxHp: 360,
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
    dashInvulnerability: 0.46,
    dashX: 1,
    dashY: 0,
    invulnerability: 2.5,
    hitFlash: 0,
    dead: false,
    fireTimers: { pulse: 0, scatter: 0, rail: 0, rocket: 0 },
    orbitAngle: 0,
    orbitMasterTimer: 0,
    overdriveDamage: 1,
    overdriveHaste: 1,
    overdriveTier: 0,
    overdriveVolleyTimer: 0,
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
    hp: 180000,
    maxHp: 180000,
    stage: 1,
    hitFlash: 0,
    dead: false,
    patternCooldown: 1.6,
    patternIndex: 0,
    activePattern: null,
    contactCooldown: 0,
    weakness: 0,
    damageMultiplier: 1,
    transformTimer: 0,
    transformDuration: 1.8,
    phaseFlash: 0,
    alertPulses: 0,
    alertPulseTimer: 0,
    rageBurstCooldown: 5.5,
    enrage: 1,
    orbitHitCooldown: 0,
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
    surgeIndex: 0,
    surgeQueued: 0,
    surgeSpawnAccumulator: 0,
    surgeWarning: null,
    activeSurge: null,
    phaseTransition: 0,
    nextEntityId: 0,
    enemies: [],
    projectiles: [],
    enemyProjectiles: [],
    particles: [],
    telegraphs: [],
    beams: [],
    chains: [],
    shockwaves: [],
    orbitals: [],
    airstrikes: [],
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
      skills: { damage: 0, fireRate: 0, multishot: 0, shield: 0, dash: 0, regen: 0, chain: 0, nova: 0, airstrike: 0, omegaLaser: 0 },
      allies: { drone: 0, sentry: 0, suppressor: 0 },
    },
    lastChosenByCategory: { weapon: null, skill: null, ally: null },
    support: {
      chainCooldown: 0,
      novaCooldown: 0,
      airstrikeCooldown: 2.5,
      laserCooldown: 5,
      squadCooldown: 0,
      squadDuration: 0,
    },
    camera: { x: GAME_WIDTH * 0.5, y: GAME_HEIGHT * 0.5, zoom: 1.58 },
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
      skillsMastered: 0,
      ultimateCasts: 0,
      squadCalls: 0,
      overdriveTier: 0,
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
  return { up: false, down: false, left: false, right: false, dashPressed: false, supportPressed: false };
}

export function clearPressedInput(input) {
  if (!input || typeof input !== "object") return false;
  input.dashPressed = false;
  input.supportPressed = false;
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

export function setSwarmScreenAim(state, screenX, screenY) {
  if (!state || !Number.isFinite(screenX) || !Number.isFinite(screenY)) return false;
  const camera = state.camera || { x: GAME_WIDTH * 0.5, y: GAME_HEIGHT * 0.5, zoom: 1 };
  const zoom = Math.max(0.1, finite(camera.zoom, 1));
  return setSwarmAim(
    state,
    finite(camera.x, GAME_WIDTH * 0.5) + (screenX - GAME_WIDTH * 0.5) / zoom,
    finite(camera.y, GAME_HEIGHT * 0.5) + (screenY - GAME_HEIGHT * 0.5) / zoom,
  );
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
    const phaseWindow = player.dashInvulnerability + state.build.skills.dash * 0.05;
    player.invulnerability = Math.max(player.invulnerability, phaseWindow);
    emit(state, "dash", { x: player.x, y: player.y, invulnerability: phaseWindow });
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

  const camera = state.camera;
  if (camera) {
    const targetZoom = state.phase === "boss" ? 1.36 : 1.58;
    const follow = 1 - Math.exp(-dt * 7.5);
    camera.x += (player.x - camera.x) * follow;
    camera.y += (player.y - camera.y) * follow;
    camera.zoom += (targetZoom - camera.zoom) * (1 - Math.exp(-dt * 3.5));
  }
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

function fireRadialVolley(state, kind, count, speed, damage, radius, life, extra = {}) {
  const player = state.player;
  for (let index = 0; index < count; index += 1) {
    const angle = player.angle + (index / count) * TAU;
    pushPlayerProjectile(state, {
      kind,
      x: player.x + Math.cos(angle) * 22,
      y: player.y + Math.sin(angle) * 22,
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
    });
  }
}

function updateOverdrive(state, dt) {
  const player = state.player;
  const progress = state.phase === "boss"
    ? 1
    : clamp(state.killedEnemies / Math.max(1, state.enemyBudget), 0, 1);
  const ramp = clamp((progress - 0.2) / 0.8, 0, 1);
  player.overdriveDamage = 1 + Math.pow(ramp, 1.22) * 3.4;
  player.overdriveHaste = Math.max(0.22, 1 - Math.pow(ramp, 1.08) * 0.78);
  let tier = 0;
  for (const threshold of OVERDRIVE_THRESHOLDS) if (progress >= threshold) tier += 1;
  if (tier > player.overdriveTier) {
    player.overdriveTier = tier;
    state.stats.overdriveTier = tier;
    player.overdriveVolleyTimer = 0;
    state.flash = Math.max(state.flash, 0.38 + tier * 0.08);
    state.shake = Math.max(state.shake, 6 + tier * 2);
    addText(state, `OVERDRIVE ${tier}`, player.x, player.y - 78, tier >= 3 ? "#fff0a6" : "#8ffcff", 1.3);
    emit(state, "overdrive", { tier, progress, damage: player.overdriveDamage, haste: player.overdriveHaste });
  }
  player.overdriveVolleyTimer = Math.max(0, player.overdriveVolleyTimer - dt);
}

function updateAutoWeapons(state, dt) {
  const player = state.player;
  const timers = player.fireTimers;
  const attackSpeed = Math.max(0.16, player.fireRateMultiplier * player.overdriveHaste);
  for (const key of Object.keys(timers)) timers[key] -= dt;

  if (timers.pulse <= 0) {
    const count = clamp(player.multishot + Math.max(0, player.overdriveTier - 1), 1, 7);
    fireBulletFan(state, "pulse", count, count > 1 ? 0.12 * (count - 1) : 0, 850, 34, 5, 1.55, { pierce: state.build.weapons.pulse >= 5 ? 2 : state.build.weapons.pulse >= 4 ? 1 : 0 });
    if (player.overdriveTier >= 2 && player.overdriveVolleyTimer <= 0) {
      const volleyCount = player.overdriveTier >= 3 ? 24 : 14;
      fireRadialVolley(state, "pulseOverdrive", volleyCount, 760, player.overdriveTier >= 3 ? 52 : 38, 6, 1.1, { color: "#a7fbff", pierce: player.overdriveTier >= 3 ? 2 : 1 });
      player.overdriveVolleyTimer = player.overdriveTier >= 3 ? 0.78 : 1.35;
      emit(state, "masterAttack", { skill: "pulseOverdrive", count: volleyCount });
    }
    timers.pulse += 0.145 * attackSpeed / (1 + (state.build.weapons.pulse - 1) * 0.08);
  }

  const scatterLevel = state.build.weapons.scatter;
  if (scatterLevel > 0 && timers.scatter <= 0) {
    fireBulletFan(state, "scatter", scatterLevel >= 5 ? 13 : 4 + scatterLevel, scatterLevel >= 5 ? 1.18 : 0.65, 720, 18 + scatterLevel * 5, 5, 0.82, { color: "#8bf4da" });
    if (scatterLevel >= 5) fireRadialVolley(state, "scatterMaster", 16, 630, 24, 5, 0.9, { color: "#73ffe0", pierce: 1 });
    timers.scatter += Math.max(0.34, 0.76 * attackSpeed);
  }

  const railLevel = state.build.weapons.rail;
  if (railLevel > 0 && timers.rail <= 0) {
    fireBulletFan(state, "rail", railLevel >= 5 ? 3 : 1, railLevel >= 5 ? 0.18 : 0, 1300, 125 + railLevel * 42, railLevel >= 5 ? 12 : 9, 1.05, { color: "#fff4a6", pierce: railLevel >= 5 ? 18 : 4 + railLevel * 2 });
    timers.rail += Math.max(0.62, 1.42 * attackSpeed);
  }

  const rocketLevel = state.build.weapons.rocket;
  if (rocketLevel > 0 && timers.rocket <= 0) {
    fireBulletFan(state, "rocket", rocketLevel >= 5 ? 3 : 1, rocketLevel >= 5 ? 0.28 : 0, 440, 56 + rocketLevel * 24, 10, 2.6, { color: "#ffb35a", splash: rocketLevel >= 5 ? 165 : 72 + rocketLevel * 15 });
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
  const candidates = Number.isFinite(maxDistance) && state.spatialGrid.size > 0
    ? nearbyEnemies(state, x, y, maxDistance)
    : state.enemies;
  for (const enemy of candidates) {
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
  if (state.stats.kills % 25 === 0) {
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 6);
    if (state.stats.kills % 100 === 0) {
      addText(state, "COMBAT REPAIR +6", state.player.x, state.player.y - 46, "#8dffc0", 0.88);
      burst(state, state.player.x, state.player.y, "#72f0ad", 8, 120, 0.42, 4);
    }
  }
  spawnXpPickup(state, enemy);
  burst(state, enemy.x, enemy.y, enemy.elite ? "#ffe06b" : enemy.color, enemy.elite ? 16 : 6, enemy.elite ? 250 : 150, 0.55, enemy.elite ? 7 : 4);
  if (enemy.elite) addText(state, "ELITE DOWN", enemy.x, enemy.y - 28, "#ffe371", 0.9);
  if (state.killedEnemies % 4 === 0 || enemy.elite) emit(state, "enemyKilled", { type: enemy.type, elite: enemy.elite, source });
}

function damageEnemy(state, enemy, amount, source = "weapon") {
  if (!enemy || enemy.dead || amount <= 0) return 0;
  const dealt = Math.min(enemy.hp, amount * finite(state.player?.overdriveDamage, 1));
  enemy.hp -= dealt;
  enemy.hitFlash = 0.09;
  state.stats.hits += 1;
  state.stats.damageDealt += dealt;
  if (enemy.hp <= 0) killEnemy(state, enemy, source);
  return dealt;
}

function triggerBossStage(state, stage) {
  const boss = state.boss;
  boss.stage = stage;
  boss.enrage = stage === 3 ? 2.15 : 1.5;
  boss.transformTimer = boss.transformDuration;
  boss.phaseFlash = 1;
  boss.alertPulses = 2;
  boss.alertPulseTimer = 0.42;
  boss.patternCooldown = boss.transformDuration + 0.38;
  boss.activePattern = null;
  boss.vx = 0;
  boss.vy = 0;
  state.telegraphs.length = 0;
  state.enemyProjectiles.length = 0;
  state.shake = Math.max(state.shake, 20 + stage * 3);
  state.flash = Math.max(state.flash, 0.72);
  burst(state, boss.x, boss.y, stage >= 3 ? "#ff8a3d" : "#ff385d", 52, 390, 0.92, 8);
  state.shockwaves.push({ type: "bossTransform", enemy: true, x: boss.x, y: boss.y, maxRadius: 360, life: 1.15, maxLife: 1.15, color: stage >= 3 ? "#ffad4f" : "#ff385d", width: 16 });
  addText(state, stage >= 3 ? "CORE MELTDOWN · PHASE III" : "ARMOR BREAK · PHASE II", boss.x, boss.y - 112, "#fff0d0", 1.35);
  emit(state, "bossStage", { stage, enrage: boss.enrage, pulses: 3 });
}

function damageBoss(state, amount, source = "weapon") {
  const boss = state.boss;
  if (!boss.active || boss.dead || boss.transformTimer > 0 || amount <= 0) return 0;
  const multiplier = boss.weakness > 0 ? 2 : 1;
  boss.damageMultiplier = multiplier;
  const dealt = Math.min(boss.hp, amount * multiplier * finite(state.player?.overdriveDamage, 1));
  boss.hp -= dealt;
  boss.hitFlash = 0.1;
  state.stats.hits += 1;
  state.stats.damageDealt += dealt;
  if (boss.hp <= boss.maxHp * 0.7 && boss.stage === 1) triggerBossStage(state, 2);
  else if (boss.hp <= boss.maxHp * 0.38 && boss.stage === 2) triggerBossStage(state, 3);
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
  state.orbitals.length = 0;
  if (level <= 0) return;
  const player = state.player;
  player.orbitAngle = (player.orbitAngle + dt * (2.4 + level * 0.16)) % TAU;
  const bladeCount = Math.min(5, 1 + level);
  const distance = 68 + level * 7;
  for (let index = 0; index < bladeCount; index += 1) {
    const angle = player.orbitAngle + (index / bladeCount) * TAU;
    const x = player.x + Math.cos(angle) * distance;
    const y = player.y + Math.sin(angle) * distance;
    state.orbitals.push({ id: index, type: "orbitBlade", x, y, angle: angle + Math.PI * 0.5, radius: 14, level });
    if (state.phase === "boss") {
      if (state.boss.active && !state.boss.dead && state.boss.orbitHitCooldown <= 0
        && Math.hypot(state.boss.x - x, state.boss.y - y) <= state.boss.radius + 15) {
        damageBoss(state, (22 + level * 10) * player.damageMultiplier, "orbit");
        state.boss.orbitHitCooldown = 0.22;
      }
      continue;
    }
    for (const enemy of nearbyEnemies(state, x, y, 34)) {
      if (!enemy.dead && enemy.orbitHitCooldown <= 0 && Math.hypot(enemy.x - x, enemy.y - y) <= enemy.radius + 14) {
        damageEnemy(state, enemy, (22 + level * 10) * player.damageMultiplier, "orbit");
        enemy.orbitHitCooldown = 0.28;
      }
    }
  }
  player.orbitMasterTimer = Math.max(0, player.orbitMasterTimer - dt);
  if (level >= 5 && player.orbitMasterTimer <= 0) {
    player.orbitMasterTimer = 2.15;
    const radius = 310;
    for (const enemy of nearbyEnemies(state, player.x, player.y, radius)) {
      if (!enemy.dead && Math.hypot(enemy.x - player.x, enemy.y - player.y) <= radius + enemy.radius) {
        damageEnemy(state, enemy, 105 * player.damageMultiplier, "orbitMaster");
      }
    }
    state.shockwaves.push({ type: "orbitMaster", x: player.x, y: player.y, maxRadius: radius, life: 0.55, maxLife: 0.55, color: "#6fffe8", width: 10 });
    emit(state, "masterAttack", { skill: "orbit", x: player.x, y: player.y });
  }
}

function damageArea(state, x, y, radius, damage, source) {
  let hits = 0;
  if (state.phase === "boss") {
    const boss = state.boss;
    if (boss.active && !boss.dead && Math.hypot(boss.x - x, boss.y - y) <= radius + boss.radius) {
      damageBoss(state, damage, source);
      hits += 1;
    }
    return hits;
  }
  for (const enemy of nearbyEnemies(state, x, y, radius)) {
    if (enemy.dead || Math.hypot(enemy.x - x, enemy.y - y) > radius + enemy.radius) continue;
    damageEnemy(state, enemy, damage, source);
    hits += 1;
  }
  return hits;
}

function triggerChainLightning(state, level) {
  const limit = (level >= 3 ? 14 : 3 + level * 2) + state.player.overdriveTier * 3;
  const points = [{ x: state.player.x, y: state.player.y }];
  const used = new Set();
  let x = state.player.x;
  let y = state.player.y;
  for (let hop = 0; hop < limit; hop += 1) {
    let target = null;
    let bestSq = (level >= 3 ? 430 : 260) ** 2;
    for (const enemy of state.enemies) {
      if (enemy.dead || used.has(enemy.id)) continue;
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq < bestSq) {
        bestSq = distanceSq;
        target = enemy;
      }
    }
    if (!target) break;
    used.add(target.id);
    points.push({ x: target.x, y: target.y });
    damageEnemy(state, target, (48 + level * 26) * state.player.damageMultiplier, "chain");
    x = target.x;
    y = target.y;
  }
  if (state.phase === "boss" && state.boss.active) {
    points.push({ x: state.boss.x, y: state.boss.y });
    damageBoss(state, (90 + level * 48) * state.player.damageMultiplier, "chain");
  }
  if (points.length > 1) {
    state.chains.push({ type: "chain", points, life: 0.22, maxLife: 0.22, alpha: 1, width: level >= 3 ? 7 : 4, color: level >= 3 ? "#fff2a1" : "#8ff9ff" });
    emit(state, level >= 3 ? "masterAttack" : "skillAttack", { skill: "chain", hits: points.length - 1 });
  }
}

function triggerNova(state, level) {
  const radius = (level >= 3 ? 390 : 150 + level * 58) + state.player.overdriveTier * 22;
  const damage = (64 + level * 48) * state.player.damageMultiplier;
  damageArea(state, state.player.x, state.player.y, radius, damage, "nova");
  state.shockwaves.push({ type: "nova", x: state.player.x, y: state.player.y, maxRadius: radius, life: 0.72, maxLife: 0.72, color: level >= 3 ? "#fff0a6" : "#8ffcff", width: level >= 3 ? 15 : 9 });
  if (level >= 3) {
    state.shockwaves.push({ type: "novaEcho", x: state.player.x, y: state.player.y, maxRadius: radius * 0.72, life: 1.02, maxLife: 1.02, color: "#7ef4ff", width: 8 });
    if (state.player.overdriveTier >= 3) state.shockwaves.push({ type: "novaMaster", x: state.player.x, y: state.player.y, maxRadius: radius * 1.18, life: 1.22, maxLife: 1.22, color: "#fff0a6", width: 12 });
    state.shake = Math.max(state.shake, 13);
  }
  emit(state, level >= 3 ? "masterAttack" : "skillAttack", { skill: "nova", radius });
}

function strikeTarget(state, index) {
  if (state.phase === "boss" && state.boss.active) return { x: state.boss.x, y: state.boss.y };
  const live = state.enemies;
  if (!live.length) return { x: state.player.x, y: state.player.y };
  const enemy = live[(index * 37 + state.stats.ultimateCasts * 11) % live.length];
  return { x: enemy.x, y: enemy.y };
}

function triggerAirstrike(state, level) {
  const count = (level >= 3 ? 15 : 5 + level * 3) + state.player.overdriveTier * 3;
  for (let index = 0; index < count; index += 1) {
    const target = strikeTarget(state, index);
    const spread = level >= 3 ? 72 : 38;
    state.airstrikes.push({
      id: ++state.nextEntityId,
      type: "airstrike",
      phase: "warning",
      x: clamp(target.x + (state.random() - 0.5) * spread, ARENA.left + 26, ARENA.right - 26),
      y: clamp(target.y + (state.random() - 0.5) * spread, ARENA.top + 26, ARENA.bottom - 26),
      radius: 76 + level * 15,
      damage: (135 + level * 88) * state.player.damageMultiplier,
      life: 1.05 + index * 0.035,
      maxLife: 1.05 + index * 0.035,
    });
  }
  state.stats.ultimateCasts += 1;
  emit(state, "ultimateWarning", { skill: "airstrike", count });
}

function triggerOmegaLaser(state, level) {
  const direction = normalize(state.aim.x - state.player.x, state.aim.y - state.player.y);
  const beam = {
    id: ++state.nextEntityId,
    type: "omegaLaser",
    phase: "charge",
    x1: state.player.x,
    y1: state.player.y,
    x2: state.player.x + direction.x * 1500,
    y2: state.player.y + direction.y * 1500,
    angle: Math.atan2(direction.y, direction.x),
    width: level >= 3 ? 116 : 58 + level * 16,
    damage: (105 + level * 70) * state.player.damageMultiplier,
    charge: 0.68,
    life: level >= 3 ? 1.95 : 1.55,
    maxLife: level >= 3 ? 1.95 : 1.55,
    tickTimer: 0,
    color: level >= 3 ? "#fff2a5" : "#72f7ff",
    alpha: 1,
  };
  state.beams.push(beam);
  state.stats.ultimateCasts += 1;
  emit(state, "ultimateWarning", { skill: "omegaLaser" });
}

function updateAirstrikes(state, dt) {
  for (const strike of state.airstrikes) {
    strike.life -= dt;
    if (strike.phase === "warning" && strike.life <= 0) {
      strike.phase = "impact";
      strike.life = 0.32;
      strike.maxLife = 0.32;
      damageArea(state, strike.x, strike.y, strike.radius, strike.damage, "airstrike");
      burst(state, strike.x, strike.y, "#ffcf68", 16, 330, 0.62, 7);
      state.shockwaves.push({ type: "airstrike", x: strike.x, y: strike.y, maxRadius: strike.radius, life: 0.42, maxLife: 0.42, color: "#ffbd58", width: 10 });
      state.shake = Math.max(state.shake, 8);
      emit(state, "ultimateImpact", { skill: "airstrike", x: strike.x, y: strike.y });
    }
  }
  compact(state.airstrikes, (strike) => strike.life > 0);
}

function updateOmegaBeams(state, dt) {
  for (const beam of state.beams) {
    beam.life -= dt;
    beam.alpha = clamp(beam.life / Math.max(0.001, beam.maxLife * 0.45), 0, 1);
    if (beam.phase === "charge") {
      beam.charge -= dt;
      if (beam.charge <= 0) {
        beam.phase = "active";
        state.flash = Math.max(state.flash, 0.5);
        state.shake = Math.max(state.shake, 20);
        emit(state, "ultimateFire", { skill: "omegaLaser" });
      }
      continue;
    }
    beam.tickTimer -= dt;
    if (beam.tickTimer > 0) continue;
    beam.tickTimer = 0.1;
    if (state.phase === "boss") {
      if (pointLineDistance(state.boss.x, state.boss.y, beam.x1, beam.y1, beam.x2, beam.y2) <= beam.width * 0.5 + state.boss.radius) {
        damageBoss(state, beam.damage, "omegaLaser");
      }
    } else {
      for (const enemy of state.enemies) {
        if (!enemy.dead && pointLineDistance(enemy.x, enemy.y, beam.x1, beam.y1, beam.x2, beam.y2) <= beam.width * 0.5 + enemy.radius) {
          damageEnemy(state, enemy, beam.damage, "omegaLaser");
        }
      }
    }
  }
  compact(state.beams, (beam) => beam.life > 0);
}

function updateSupportSkills(state, dt) {
  const skills = state.build.skills;
  const support = state.support;
  support.chainCooldown -= dt;
  support.novaCooldown -= dt;
  support.airstrikeCooldown -= dt;
  support.laserCooldown -= dt;

  const overdriveCooldownScale = Math.max(0.26, state.player.overdriveHaste * 0.94);
  if (skills.chain > 0 && support.chainCooldown <= 0) {
    triggerChainLightning(state, skills.chain);
    support.chainCooldown += (skills.chain >= 3 ? 1.65 : 3.2 - skills.chain * 0.38) * overdriveCooldownScale;
  }
  if (skills.nova > 0 && support.novaCooldown <= 0) {
    triggerNova(state, skills.nova);
    support.novaCooldown += (skills.nova >= 3 ? 3.8 : 6.4 - skills.nova * 0.7) * overdriveCooldownScale;
  }
  if (skills.airstrike > 0 && support.airstrikeCooldown <= 0) {
    triggerAirstrike(state, skills.airstrike);
    support.airstrikeCooldown += (skills.airstrike >= 3 ? 11.5 : 18.5 - skills.airstrike * 2.1) * overdriveCooldownScale;
  }
  if (skills.omegaLaser > 0 && support.laserCooldown <= 0) {
    triggerOmegaLaser(state, skills.omegaLaser);
    support.laserCooldown += (skills.omegaLaser >= 3 ? 15 : 25 - skills.omegaLaser * 2.3) * overdriveCooldownScale;
  }
  updateAirstrikes(state, dt);
  updateOmegaBeams(state, dt);
}

function summonSupportSquad(state) {
  const support = state.support;
  if (support.squadCooldown > 0 || support.squadDuration > 0) return false;
  support.squadCooldown = SQUAD_RECALL_COOLDOWN;
  support.squadDuration = SQUAD_RECALL_DURATION;
  for (let index = 0; index < SQUAD_FORMATION.length; index += 1) {
    const member = SQUAD_FORMATION[index];
    state.allies.push({
      id: ++state.nextEntityId,
      type: member.type,
      name: member.name,
      color: member.color,
      summoned: true,
      formationIndex: index,
      formationX: member.x,
      formationY: member.y,
      x: state.player.x,
      y: state.player.y,
      vx: 0,
      vy: 0,
      angle: state.player.angle,
      fireCooldown: index * 0.07,
      life: SQUAD_RECALL_DURATION,
      maxLife: SQUAD_RECALL_DURATION,
      alpha: 0,
      active: true,
    });
  }
  state.stats.squadCalls += 1;
  state.flash = Math.max(state.flash, 0.32);
  state.shake = Math.max(state.shake, 7);
  state.shockwaves.push({ type: "squadRecall", x: state.player.x, y: state.player.y, maxRadius: 210, life: 0.7, maxLife: 0.7, color: "#c390ff", width: 9 });
  burst(state, state.player.x, state.player.y, "#b879ff", 24, 260, 0.7, 6);
  addText(state, "4-FRONT RECALL", state.player.x, state.player.y - 70, "#d9b8ff", 1.2);
  emit(state, "squadSummon", { duration: SQUAD_RECALL_DURATION, members: SQUAD_FORMATION.map((member) => member.name) });
  return true;
}

function fireSummonedProjectile(state, ally, kind, speed, damage, radius = 5, extra = {}, angleOverride = ally.angle) {
  return pushPlayerProjectile(state, {
    kind,
    x: ally.x + Math.cos(ally.angle) * 20,
    y: ally.y + Math.sin(ally.angle) * 20,
    vx: Math.cos(angleOverride) * speed,
    vy: Math.sin(angleOverride) * speed,
    angle: angleOverride,
    radius,
    damage: damage * state.player.damageMultiplier,
    color: extra.color || ally.color,
    life: extra.life || 1.3,
    pierce: extra.pierce || 0,
    splash: extra.splash || 0,
    hitIds: extra.pierce ? new Set() : null,
  });
}

function fireSummonedAlly(state, ally, target) {
  if (ally.type === "gunner") {
    for (let index = -2; index <= 2; index += 1) {
      const angle = ally.angle + index * 0.11;
      fireSummonedProjectile(state, ally, "rookScatter", 690, 19, 4, { color: "#ffb75d", life: 0.72 }, angle);
    }
    ally.fireCooldown = 0.68;
  } else if (ally.type === "arcanist") {
    const points = [{ x: ally.x, y: ally.y }, { x: target.x, y: target.y }];
    if (state.phase === "boss") damageBoss(state, 92 * state.player.damageMultiplier, "nyxArc");
    else {
      damageEnemy(state, target, 74 * state.player.damageMultiplier, "nyxArc");
      let jumps = 0;
      for (const enemy of nearbyEnemies(state, target.x, target.y, 170)) {
        if (enemy.dead || enemy === target || jumps >= 3) continue;
        damageEnemy(state, enemy, 48 * state.player.damageMultiplier, "nyxArc");
        points.push({ x: enemy.x, y: enemy.y });
        jumps += 1;
      }
    }
    state.chains.push({ type: "nyxArc", points, life: 0.24, maxLife: 0.24, alpha: 1, width: 5, color: "#c893ff" });
    ally.fireCooldown = 0.82;
  } else if (ally.type === "warden") {
    fireSummonedProjectile(state, ally, "mossHeavy", 590, 112, 9, { color: "#8cffaa", life: 1.5, pierce: 3 });
    ally.fireCooldown = 0.94;
  } else {
    fireSummonedProjectile(state, ally, "aegisEcho", 820, 45, 5, { color: "#6af4ff", life: 1.2, pierce: 1 });
    ally.fireCooldown = 0.34;
  }
}

function updateSummonedSquad(state, dt) {
  const support = state.support;
  support.squadCooldown = Math.max(0, support.squadCooldown - dt);
  support.squadDuration = Math.max(0, support.squadDuration - dt);
  let activeMembers = 0;
  for (const ally of state.allies) {
    if (!ally.summoned || ally.active === false) continue;
    ally.life = Math.max(0, ally.life - dt);
    if (ally.life <= 0) {
      ally.active = false;
      continue;
    }
    activeMembers += 1;
    const targetX = state.player.x + ally.formationX;
    const targetY = state.player.y + ally.formationY;
    const follow = Math.min(1, dt * 9);
    const previousX = ally.x;
    const previousY = ally.y;
    ally.x += (targetX - ally.x) * follow;
    ally.y += (targetY - ally.y) * follow;
    ally.vx = (ally.x - previousX) / Math.max(0.001, dt);
    ally.vy = (ally.y - previousY) / Math.max(0.001, dt);
    ally.alpha = clamp(Math.min((ally.maxLife - ally.life) * 4, ally.life * 2.5), 0, 1);
    ally.fireCooldown -= dt;
    const target = closestEnemy(state, ally.x, ally.y, 650);
    if (!target) continue;
    ally.angle = Math.atan2(target.y - ally.y, target.x - ally.x);
    if (ally.fireCooldown <= 0) fireSummonedAlly(state, ally, target);
  }
  if (support.squadDuration <= 0 && activeMembers === 0) {
    compact(state.allies, (ally) => !ally.summoned);
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
  updateSummonedSquad(state, dt);
  syncAllies(state);
  const total = Math.max(1, state.allies.length);
  for (let index = 0; index < state.allies.length; index += 1) {
    const ally = state.allies[index];
    if (ally.summoned) continue;
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
        for (const enemy of nearbyEnemies(state, ally.x, ally.y, 170)) {
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
    const bucket = category === "weapon" ? state.build.weapons : category === "skill" ? state.build.skills : state.build.allies;
    let pool = REWARD_POOLS[category].filter((candidate) => (bucket[candidate] || 0) < (MAX_REWARD_RANK[candidate] || 5));
    if (!pool.length) pool = REWARD_POOLS[category];
    if (category === "skill" && state.rewardCycle === 0) pool = pool.filter((candidate) => ["airstrike", "omegaLaser", "chain", "nova"].includes(candidate));
    const previous = state.lastChosenByCategory[category];
    const repeatPrevious = previous && pool.includes(previous) && state.random() < 0.62;
    const offset = Math.floor(clamp(state.random(), 0, 0.999999) * pool.length);
    const id = repeatPrevious ? previous : pool[(state.rewardCycle + categoryIndex + offset) % pool.length];
    const definition = REWARD_DEFINITIONS[id];
    const currentLevel = bucket[id] || 0;
    const maxRank = MAX_REWARD_RANK[id] || 5;
    offer.push({ ...definition, level: currentLevel, nextLevel: Math.min(maxRank, currentLevel + 1), maxRank, mastery: currentLevel + 1 >= maxRank });
  }
  return offer;
}

function applyReward(state, id) {
  const definition = REWARD_DEFINITIONS[id];
  if (!definition) return false;
  const bucket = definition.category === "weapon" ? state.build.weapons : definition.category === "skill" ? state.build.skills : state.build.allies;
  const currentRank = bucket[id] || 0;
  const maxRank = MAX_REWARD_RANK[id] || 5;
  if (currentRank >= maxRank) return false;
  if (definition.category === "weapon") {
    state.build.weapons[id] = currentRank + 1;
  } else if (definition.category === "skill") {
    state.build.skills[id] = currentRank + 1;
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
    state.build.allies[id] = currentRank + 1;
    if (id === "sentry") {
      const existing = state.deployables.find((deployable) => deployable.type === "sentry" && deployable.level < 4);
      if (existing) existing.level += 1;
      else if (state.deployables.length < 4) {
        state.deployables.push({ id: ++state.nextEntityId, type: "sentry", x: state.player.x, y: state.player.y, angle: state.player.angle, fireCooldown: 0, level: 1 });
      }
    }
    syncAllies(state);
  }
  state.lastChosenByCategory[definition.category] = id;
  if (currentRank + 1 === maxRank) {
    state.stats.skillsMastered += 1;
    state.flash = Math.max(state.flash, 0.6);
    state.shake = Math.max(state.shake, 12);
    emit(state, "skillMastered", { id, category: definition.category, name: definition.name });
    addText(state, `${definition.name} · MASTER`, state.player.x, state.player.y - 72, "#fff0a6", 1.25);
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
  state.airstrikes.length = 0;
  state.beams.length = 0;
  state.chains.length = 0;
  state.flash = 0.65;
  state.shake = 18;
  addText(state, "THE WRONG ENGINE", GAME_WIDTH * 0.5, 132, "#ff4b63", 1.65);
  emit(state, "bossIntro", { hp: state.boss.hp, patterns: BOSS_PATTERNS });
}

function updateSwarmSpawning(state, dt) {
  const wave = SURGE_WAVES[state.surgeIndex];
  if (wave && !state.surgeWarning && state.time >= wave.warnAt) {
    state.surgeWarning = { index: state.surgeIndex, label: wave.label, count: wave.count, startsIn: Math.max(0, wave.startAt - state.time) };
    emit(state, "surgeWarning", { wave: state.surgeIndex + 1, label: wave.label, count: wave.count, startsIn: wave.startAt - wave.warnAt });
  }
  if (wave && state.surgeWarning?.index === state.surgeIndex) {
    state.surgeWarning.startsIn = Math.max(0, wave.startAt - state.time);
    if (state.time >= wave.startAt) {
      state.surgeQueued += wave.count;
      state.activeSurge = { index: state.surgeIndex, label: wave.label, count: wave.count, remaining: state.surgeQueued, rate: wave.rate };
      state.surgeWarning = null;
      state.surgeIndex += 1;
      emit(state, "surgeStart", { wave: state.surgeIndex, label: wave.label, count: wave.count });
      state.shake = Math.max(state.shake, 7);
    }
  }

  if (state.surgeQueued > 0 && state.spawnedEnemies < state.enemyBudget) {
    const rate = state.activeSurge?.rate || 34;
    state.surgeSpawnAccumulator = Math.min(12, state.surgeSpawnAccumulator + dt * rate);
    let spawnedThisStep = 0;
    while (state.surgeSpawnAccumulator >= 1
      && spawnedThisStep < 5
      && state.enemies.length < MAX_LIVE_ENEMIES
      && state.spawnedEnemies < state.enemyBudget
      && state.surgeQueued > 0) {
      state.surgeSpawnAccumulator -= 1;
      if (!spawnEnemy(state)) break;
      state.surgeQueued -= 1;
      spawnedThisStep += 1;
    }
    if (state.activeSurge) state.activeSurge.remaining = state.surgeQueued;
    if (state.surgeQueued <= 0 && state.activeSurge) {
      emit(state, "surgeDeployed", { wave: state.activeSurge.index + 1, label: state.activeSurge.label });
      state.activeSurge = null;
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
  const warningScale = boss.stage === 3 ? 0.68 : boss.stage === 2 ? 0.82 : 1;
  let pattern;
  if (type === "radial") {
    pattern = { type, phase: "warning", x: boss.x, y: boss.y, angle: playerAngle, radius: 120, width: 12, life: 0.95 * warningScale, maxLife: 0.95 * warningScale, fired: false };
  } else if (type === "sweep") {
    pattern = { type, phase: "warning", x: boss.x, y: boss.y, angle: playerAngle - 0.9, startAngle: playerAngle - 0.9, endAngle: playerAngle + 1.05, radius: 980, width: 28 + boss.stage * 3, life: 1.1 * warningScale, maxLife: 1.1 * warningScale, activeLife: Math.max(0.82, 1.32 - boss.stage * 0.14), dual: boss.stage >= 3, fired: false, hit: false };
  } else if (type === "bombs") {
    const targets = [];
    const count = 4 + boss.stage * 2;
    for (let index = 0; index < count; index += 1) {
      const lead = index * 0.12;
      targets.push({
        x: clamp(state.player.x + state.player.vx * lead + (state.random() - 0.5) * 210, ARENA.left + 50, ARENA.right - 50),
        y: clamp(state.player.y + state.player.vy * lead + (state.random() - 0.5) * 170, ARENA.top + 50, ARENA.bottom - 50),
        radius: 58 + boss.stage * 5,
        hit: false,
      });
    }
    pattern = { type, phase: "warning", x: boss.x, y: boss.y, angle: playerAngle, radius: 65, width: 5, targets, life: 1.15 * warningScale, maxLife: 1.15 * warningScale, fired: false };
  } else if (type === "rings") {
    pattern = { type, phase: "warning", x: boss.x, y: boss.y, angle: 0, radius: 70, width: 15 + boss.stage * 2, life: 1.05 * warningScale, maxLife: 1.05 * warningScale, rings: 2 + boss.stage * 2, fired: false };
  } else {
    const multi = type === "multiCharge";
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
      width: multi ? 40 : 46,
      life: (multi ? 0.66 : 0.72) * warningScale,
      maxLife: (multi ? 0.66 : 0.72) * warningScale,
      activeLife: multi ? 0.34 : 0.52,
      chargeCount: multi ? 2 + boss.stage : 1,
      chargeIndex: 1,
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
    const count = 20 + boss.stage * 10;
    const offset = boss.patternIndex * 0.21;
    const volleys = boss.stage;
    for (let volley = 0; volley < volleys; volley += 1) {
      for (let index = 0; index < count; index += 1) {
        pushEnemyProjectile(state, boss.x, boss.y, offset + volley * 0.095 + (index / count) * TAU, 225 + boss.stage * 38 + volley * 28, 7 + boss.stage * 3, "bossRadial", 8, 5.2);
      }
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
    pattern.life = Math.max(1.42, 2.38 - boss.stage * 0.28);
    pattern.maxLife = pattern.life;
    pattern.startRadius = 76;
    pattern.radius = 76;
    pattern.hitRings = new Set();
  } else if (pattern.type === "charge" || pattern.type === "multiCharge") {
    pattern.phase = "active";
    pattern.life = pattern.activeLife;
    pattern.maxLife = pattern.activeLife;
    const distance = Math.max(1, Math.hypot(pattern.targetX - boss.x, pattern.targetY - boss.y));
    pattern.chargeSpeed = distance / pattern.activeLife;
    boss.vx = pattern.directionX * pattern.chargeSpeed;
    boss.vy = pattern.directionY * pattern.chargeSpeed;
  }
}

function queueNextMultiCharge(state, pattern) {
  const boss = state.boss;
  pattern.chargeIndex += 1;
  boss.x = pattern.targetX;
  boss.y = pattern.targetY;
  boss.vx = 0;
  boss.vy = 0;
  const direction = normalize(state.player.x - boss.x, state.player.y - boss.y);
  const boundary = rayToEllipseBoundary(boss.x, boss.y, direction, boss.radius * 0.72);
  pattern.phase = "warning";
  pattern.x = boss.x;
  pattern.y = boss.y;
  pattern.originX = boss.x;
  pattern.originY = boss.y;
  pattern.playerTargetX = state.player.x;
  pattern.playerTargetY = state.player.y;
  pattern.targetX = boundary.x;
  pattern.targetY = boundary.y;
  pattern.directionX = direction.x;
  pattern.directionY = direction.y;
  pattern.angle = Math.atan2(direction.y, direction.x);
  pattern.radius = boundary.distance;
  pattern.life = 0.32;
  pattern.maxLife = 0.32;
  pattern.activeLife = 0.34;
  pattern.fired = false;
  pattern.hit = false;
  emit(state, "bossPatternTelegraph", {
    pattern: "multiCharge",
    duration: pattern.maxLife,
    charge: pattern.chargeIndex,
    total: pattern.chargeCount,
  });
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
    const hitPrimary = pointLineDistance(state.player.x, state.player.y, boss.x, boss.y, endX, endY) <= pattern.width + state.player.radius;
    const oppositeX = boss.x - Math.cos(pattern.angle) * pattern.radius;
    const oppositeY = boss.y - Math.sin(pattern.angle) * pattern.radius;
    const hitSecondary = pattern.dual && pointLineDistance(state.player.x, state.player.y, boss.x, boss.y, oppositeX, oppositeY) <= pattern.width + state.player.radius;
    if (!pattern.hit && (hitPrimary || hitSecondary)) {
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
  } else if (pattern.type === "charge" || pattern.type === "multiCharge") {
    const remainingX = pattern.targetX - boss.x;
    const remainingY = pattern.targetY - boss.y;
    const remainingDistance = Math.hypot(remainingX, remainingY);
    const travel = pattern.chargeSpeed * dt;
    if (travel >= remainingDistance || pattern.life <= 0) {
      if (pattern.type === "multiCharge" && pattern.chargeIndex < pattern.chargeCount) queueNextMultiCharge(state, pattern);
      else exposeBossCore(state, pattern);
    } else {
      const previousX = boss.x;
      const previousY = boss.y;
      boss.vx = pattern.directionX * pattern.chargeSpeed;
      boss.vy = pattern.directionY * pattern.chargeSpeed;
      boss.x += boss.vx * dt;
      boss.y += boss.vy * dt;
      if (pointLineDistance(state.player.x, state.player.y, previousX, previousY, boss.x, boss.y) <= state.player.radius + boss.radius) {
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
  if (!boss.activePattern && boss.patternCooldown <= 0) boss.patternCooldown = Math.max(0.48, 1.92 - boss.stage * 0.4);
}

function updateBoss(state, dt) {
  const boss = state.boss;
  boss.hitFlash = Math.max(0, boss.hitFlash - dt);
  boss.contactCooldown = Math.max(0, boss.contactCooldown - dt);
  boss.orbitHitCooldown = Math.max(0, boss.orbitHitCooldown - dt);
  boss.weakness = Math.max(0, boss.weakness - dt);
  boss.phaseFlash = Math.max(0, boss.phaseFlash - dt * 0.72);
  if (boss.transformTimer > 0) {
    boss.transformTimer = Math.max(0, boss.transformTimer - dt);
    boss.alertPulseTimer -= dt;
    if (boss.alertPulses > 0 && boss.alertPulseTimer <= 0) {
      boss.alertPulses -= 1;
      boss.alertPulseTimer = 0.48;
      boss.phaseFlash = 1;
      state.flash = Math.max(state.flash, 0.52);
      state.shake = Math.max(state.shake, 16);
      emit(state, "bossStagePulse", { stage: boss.stage, remaining: boss.alertPulses });
    }
  }
  boss.damageMultiplier = boss.weakness > 0 ? 2 : 1;
  const charging = boss.activePattern?.type === "charge" || boss.activePattern?.type === "multiCharge";
  if (!charging && boss.weakness <= 0 && boss.transformTimer <= 0) {
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
  if (!charging
    && Math.hypot(state.player.x - boss.x, state.player.y - boss.y) <= state.player.radius + boss.radius
    && boss.contactCooldown <= 0) {
    damagePlayer(state, 20, "bossContact");
    boss.contactCooldown = 0.9;
  }
  if (boss.transformTimer <= 0) {
    boss.rageBurstCooldown -= dt;
    if (boss.stage >= 2 && boss.rageBurstCooldown <= 0 && !boss.activePattern) {
      const count = boss.stage === 3 ? 20 : 12;
      const offset = state.phaseTime * 0.65;
      for (let index = 0; index < count; index += 1) {
        pushEnemyProjectile(state, boss.x, boss.y, offset + (index / count) * TAU, 310 + boss.stage * 44, 10 + boss.stage * 3, "bossRage", 8, 4.2);
      }
      boss.rageBurstCooldown = boss.stage === 3 ? 3.1 : 4.7;
      state.shake = Math.max(state.shake, 9);
      emit(state, "bossRageBurst", { stage: boss.stage, count });
    }
    updateBossPattern(state, dt);
  }
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
  for (const chain of state.chains) {
    chain.life -= dt;
    chain.alpha = clamp(chain.life / Math.max(0.001, chain.maxLife), 0, 1);
  }
  compact(state.chains, (chain) => chain.life > 0);
  for (const shockwave of state.shockwaves) shockwave.life -= dt;
  compact(state.shockwaves, (shockwave) => shockwave.life > 0);
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
  if (input?.supportPressed) summonSupportSquad(state);
  updateOverdrive(state, delta);
  updateAutoWeapons(state, delta);
  updateAllies(state, delta);

  if (state.phase === "swarm") {
    updateEnemies(state, delta);
    rebuildEnemyGrid(state);
    updateOrbitWeapon(state, delta);
    updateSupportSkills(state, delta);
    updateProjectiles(state, delta);
    updateEnemyProjectiles(state, delta);
    updatePickups(state, delta);
    updateSwarmSpawning(state, delta);
  } else if (state.phase === "boss") {
    updateBoss(state, delta);
    updateOrbitWeapon(state, delta);
    updateSupportSkills(state, delta);
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
    surge: {
      warning: state.surgeWarning ? { ...state.surgeWarning } : null,
      active: state.activeSurge ? { ...state.activeSurge } : null,
      nextWave: state.surgeIndex < SURGE_WAVES.length ? state.surgeIndex + 1 : null,
    },
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
      dashInvulnerability: player.dashInvulnerability + state.build.skills.dash * 0.05,
      invulnerability: player.invulnerability,
      overdriveTier: player.overdriveTier,
      overdriveDamage: player.overdriveDamage,
      overdriveHaste: player.overdriveHaste,
    },
    boss: state.boss.active ? {
      name: state.boss.name,
      hp: state.boss.hp,
      maxHp: state.boss.maxHp,
      stage: state.boss.stage,
      pattern: state.boss.activePattern?.type ?? null,
      weakness: state.boss.weakness,
      damageMultiplier: state.boss.damageMultiplier,
      enrage: state.boss.enrage,
      transforming: state.boss.transformTimer > 0,
      transformTimer: state.boss.transformTimer,
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
    abilities: {
      chain: { rank: state.build.skills.chain, cooldown: Math.max(0, state.support.chainCooldown), maxRank: 3 },
      nova: { rank: state.build.skills.nova, cooldown: Math.max(0, state.support.novaCooldown), maxRank: 3 },
      airstrike: { rank: state.build.skills.airstrike, cooldown: Math.max(0, state.support.airstrikeCooldown), maxRank: 3, ultimate: true },
      omegaLaser: { rank: state.build.skills.omegaLaser, cooldown: Math.max(0, state.support.laserCooldown), maxRank: 3, ultimate: true },
      squadRecall: {
        rank: 1,
        cooldown: Math.max(0, state.support.squadCooldown),
        duration: Math.max(0, state.support.squadDuration),
        maxRank: 1,
        special: true,
        key: "F",
      },
    },
    stats: { ...state.stats },
  };
}

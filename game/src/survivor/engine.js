import {
  ARENA_PHASES,
  CONVERGENCE_TIMES,
  ENEMY_TYPES,
  GAME_HEIGHT,
  GAME_WIDTH,
  HERO_ARCHETYPES,
  REGIONS,
  RUN_DURATION,
  SHOP_ITEMS,
  getShopItemCost,
} from "./data.js";
import {
  createNeuralEcho,
  getNeuralEchoMetrics,
  neuralEchoStateBin,
  predictNeuralEcho,
  trainNeuralEcho,
} from "./neuralEcho.js";

const TAU = Math.PI * 2;
const ZONE_PADDING = 34;
const BOSS_PATTERN_ORDER = ["crossfire", "deadZone", "bombardment", "rotorSweep"];
const ENEMY_GRID_SIZE = 128;
const PHASE_ZONE_TO_ARENA = [
  [0, 1, 2, 3],
  [0, 1, 0, 1],
  [0, 0, 0, 0],
];

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function compactArray(array, keep) {
  let write = 0;
  for (let read = 0; read < array.length; read += 1) {
    const value = array[read];
    if (keep(value)) array[write++] = value;
  }
  array.length = write;
  return array;
}

function normalizeAngle(angle) {
  let value = angle;
  while (value > Math.PI) value -= TAU;
  while (value < -Math.PI) value += TAU;
  return value;
}

function uid(state, prefix) {
  state.entityId += 1;
  return `${prefix}-${state.entityId}`;
}

function emit(state, type, payload = {}) {
  state.events.push({ type, ...payload });
}

export function drainEvents(state) {
  return state.events.splice(0, state.events.length);
}

function createHero(region) {
  const archetype = HERO_ARCHETYPES[region.hero];
  return {
    id: `hero-${region.id}`,
    zoneId: region.id,
    archetype: region.hero,
    name: archetype.name,
    role: archetype.role,
    sprite: archetype.sprite,
    color: archetype.color,
    x: region.x + region.width / 2,
    y: region.y + region.height / 2 + 28,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    targetAngle: -Math.PI / 2,
    radius: archetype.radius,
    hp: archetype.hp,
    maxHp: archetype.hp,
    shield: 0,
    speed: archetype.speed,
    dead: false,
    kills: 0,
    fireCooldown: 0.2 + region.id * 0.08,
    droneCooldown: 0,
    dashCooldown: 0,
    dashRemaining: 0,
    sentryCooldown: 0,
    empCooldown: 0,
    invulnerability: 0,
    hitFlash: 0,
    combo: 0,
    comboTimer: 0,
    aiProfile: {
      samples: 0,
      effectiveSamples: 0,
      training: 0,
      aggression: 0.48,
      strafe: 0.54,
      dashInstinct: 0.35,
      style: "BALANCED",
      loss: 1,
      coverage: 0,
      architecture: "17-12-5",
      parameters: 281,
      intent: "CALIBRATING",
      safetyOverride: false,
    },
    neuralEcho: {
      model: createNeuralEcho({ seed: 0x544d5700 + region.id * 97 }),
      trainAccumulator: 0,
      inferAccumulator: 0,
      dashPulse: 0,
      sentryPulse: 0,
      empPulse: 0,
      features: new Float32Array(17),
      target: new Float32Array(5),
      mask: new Float32Array([1, 1, 1, 0, 0]),
      output: new Float32Array(5),
      cachedForward: 0,
      cachedTangent: 0,
      cachedDash: 0,
    },
    stats: {
      damage: archetype.damage,
      fireInterval: archetype.fireInterval,
      bulletSpeed: archetype.bulletSpeed,
      range: archetype.range,
      projectile: archetype.projectile,
      regen: archetype.regen || 0,
    },
    upgrades: {
      arsenal: 0,
      firerate: 0,
      vitality: 0,
      regen: 0,
      drone: 0,
      sentry: 0,
      emp: 0,
    },
  };
}

export function createGameState({ random = Math.random, duration = RUN_DURATION } = {}) {
  const zones = REGIONS.map((region) => ({
    ...region,
    status: "active",
    spawnCooldown: 0.6 + region.id * 0.24,
    invasionLevel: 0,
    pressure: 0,
    fallTime: null,
  }));
  const state = {
    status: "running",
    paused: false,
    random,
    duration,
    time: 0,
    timeLeft: duration,
    wave: 1,
    phaseLevel: 0,
    phase: ARENA_PHASES[0].id,
    phaseFlash: 0,
    phaseTitle: "FOUR FRONTS ONLINE",
    entityId: 0,
    controlledZoneId: null,
    controlledArenaId: null,
    gold: 18,
    zones,
    heroes: REGIONS.map(createHero),
    enemies: [],
    projectiles: [],
    enemyShots: [],
    towers: [],
    beams: [],
    particles: [],
    texts: [],
    finalBossSpawned: false,
    bossPattern: null,
    bossPatternIndex: 0,
    bossPatternCooldown: 3.5,
    earlyEliteSpawned: false,
    emergencySurgeSpawned: false,
    runStats: {
      kills: 0,
      goldEarned: 0,
      goldSpent: 0,
      zonesLost: 0,
      invasions: 0,
      killsByZone: REGIONS.map(() => 0),
      purchases: 0,
      patternsCleared: 0,
      patternsFailed: 0,
      manualTrainingSeconds: 0,
    },
    events: [],
    shake: 0,
    dangerPulse: 0,
    invasionFlash: 0,
    combatAlert: null,
    hitStop: 0,
    enemyGrid: new Map(),
    pressureAccumulator: 0,
    performance: {
      particleScale: 0.7,
      maxParticles: 140,
    },
  };
  for (const zone of state.zones) {
    for (let index = 0; index < 5; index += 1) spawnEnemy(state, index === 4 ? "shooter" : "raider", zone.id);
  }
  return state;
}

export function createInputState() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    dashPressed: false,
    deploySentryPressed: false,
    deployEmpPressed: false,
  };
}

export function clearPressedInput(input) {
  input.dashPressed = false;
  input.deploySentryPressed = false;
  input.deployEmpPressed = false;
}

export function selectControlledZone(state, zoneId) {
  const zone = state.zones[zoneId];
  const hero = state.heroes[zoneId];
  if (!zone || zone.status !== "active" || !hero || hero.dead) return false;
  const arenaId = arenaIdForZone(state, zoneId);
  state.controlledZoneId = zoneId;
  state.controlledArenaId = arenaId;
  emit(state, "focus", { zoneId, arenaId });
  return true;
}

export function returnToOverview(state) {
  state.controlledZoneId = null;
  state.controlledArenaId = null;
  emit(state, "overview");
}

export function getHeroForZone(state, zoneId) {
  return state.heroes.find((hero) => hero.zoneId === zoneId) || null;
}

export function getArenaGroups(state) {
  return ARENA_PHASES[state.phaseLevel]?.groups || ARENA_PHASES[0].groups;
}

export function arenaIdForZone(state, zoneId) {
  return PHASE_ZONE_TO_ARENA[state.phaseLevel]?.[zoneId] ?? 0;
}

export function getArenaMembers(state, arenaId) {
  return getArenaGroups(state)[arenaId] || [];
}

export function getArenaBounds(state, arenaId) {
  if (state.phaseLevel === 0) {
    const region = REGIONS[arenaId] || REGIONS[0];
    return { x: region.x, y: region.y, width: region.width, height: region.height };
  }
  if (state.phaseLevel === 1) {
    return { x: arenaId === 0 ? 0 : GAME_WIDTH / 2, y: 0, width: GAME_WIDTH / 2, height: GAME_HEIGHT };
  }
  return { x: 0, y: 0, width: GAME_WIDTH, height: GAME_HEIGHT };
}

export function getArenaForZone(state, zoneId) {
  const arenaId = arenaIdForZone(state, zoneId);
  return { id: arenaId, members: getArenaMembers(state, arenaId), ...getArenaBounds(state, arenaId) };
}

function zonesShareArena(state, leftZoneId, rightZoneId) {
  return arenaIdForZone(state, leftZoneId) === arenaIdForZone(state, rightZoneId);
}

function enemyCellKey(cellX, cellY) {
  return cellY * 32 + cellX;
}

function rebuildEnemyIndex(state) {
  const grid = state.enemyGrid || new Map();
  grid.clear();
  for (const enemy of state.enemies) {
    if (enemy.dead) continue;
    const cellX = Math.floor(enemy.x / ENEMY_GRID_SIZE);
    const cellY = Math.floor(enemy.y / ENEMY_GRID_SIZE);
    const key = enemyCellKey(cellX, cellY);
    let bucket = grid.get(key);
    if (!bucket) {
      bucket = [];
      grid.set(key, bucket);
    }
    bucket.push(enemy);
  }
  state.enemyGrid = grid;
}

function addParticles(state, x, y, color, count = 7, speed = 110) {
  const performance = state.performance || { particleScale: 1, maxParticles: 220 };
  const scaledCount = Math.max(1, Math.round(count * performance.particleScale));
  const available = Math.max(0, performance.maxParticles - state.particles.length);
  for (let index = 0; index < Math.min(scaledCount, available); index += 1) {
    const angle = state.random() * TAU;
    const velocity = speed * (0.3 + state.random() * 0.8);
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      life: 0.25 + state.random() * 0.32,
      maxLife: 0.58,
      size: 1.4 + state.random() * 2.7,
      color,
    });
  }
}

function addText(state, x, y, text, color = "#ffffff") {
  state.texts.push({ x, y, text, color, life: 0.82, maxLife: 0.82 });
}

function zoneBounds(state, zoneId) {
  return getArenaForZone(state, zoneId);
}

function clampToZone(state, entity, zoneId, extra = 0) {
  const zone = zoneBounds(state, zoneId);
  if (!zone) return;
  entity.x = clamp(entity.x, zone.x + ZONE_PADDING + extra, zone.x + zone.width - ZONE_PADDING - extra);
  entity.y = clamp(entity.y, zone.y + ZONE_PADDING + extra, zone.y + zone.height - ZONE_PADDING - extra);
}

function livingZoneIds(state) {
  return state.zones.filter((zone) => zone.status === "active").map((zone) => zone.id);
}

function livingHeroesForArena(state, arenaId) {
  return getArenaMembers(state, arenaId)
    .map((zoneId) => state.heroes[zoneId])
    .filter((hero) => hero && !hero.dead);
}

function chooseInvasionTarget(state, fromZoneId) {
  const alive = livingZoneIds(state);
  if (!alive.length) return null;
  const from = state.zones[fromZoneId];
  const adjacent = alive.filter((zoneId) => {
    const zone = state.zones[zoneId];
    const horizontal = Math.abs(zone.x - from.x) === from.width && zone.y === from.y;
    const vertical = Math.abs(zone.y - from.y) === from.height && zone.x === from.x;
    return horizontal || vertical;
  });
  const pool = adjacent.length ? adjacent : alive;
  return pool.sort((a, b) => state.zones[a].pressure - state.zones[b].pressure)[0];
}

function getSpawnPoint(state, zoneId, gateIndex = Math.floor(state.random() * 4)) {
  const zone = zoneBounds(state, zoneId);
  const margin = 22;
  const spreadX = zone.x + margin + state.random() * (zone.width - margin * 2);
  const spreadY = zone.y + margin + state.random() * (zone.height - margin * 2);
  if (gateIndex === 0) return { x: spreadX, y: zone.y + margin };
  if (gateIndex === 1) return { x: zone.x + zone.width - margin, y: spreadY };
  if (gateIndex === 2) return { x: spreadX, y: zone.y + zone.height - margin };
  return { x: zone.x + margin, y: spreadY };
}

export function spawnEnemy(state, requestedType = null, zoneId = 0, options = {}) {
  const zone = state.zones[zoneId];
  if (!zone) return null;
  let type = requestedType;
  if (!type) {
    const roll = state.random();
    if (state.wave >= 5 && roll > 0.88) type = "brute";
    else if (state.wave >= 2 && roll > 0.66) type = "shooter";
    else type = "raider";
  }
  const config = ENEMY_TYPES[type];
  if (!config) return null;
  const targetZoneId = options.targetZoneId ?? (zone.status === "active" ? zoneId : chooseInvasionTarget(state, zoneId));
  if (targetZoneId === null) return null;
  const arena = getArenaForZone(state, targetZoneId);
  const point = config.finalBoss
    ? { x: arena.x + arena.width / 2, y: arena.y + arena.height / 2 - 25 }
    : getSpawnPoint(state, zoneId, options.gateIndex);
  const waveScale = config.finalBoss ? 1 : 1 + Math.max(0, state.wave - 1) * 0.085 + state.zones[targetZoneId].invasionLevel * 0.12;
  const elite = !config.boss && (options.elite || (state.wave >= 4 && state.random() > 0.94));
  const hp = config.hp * waveScale * (elite ? 1.65 : 1);
  const enemy = {
    id: uid(state, "enemy"),
    type,
    name: config.name,
    originZoneId: zoneId,
    zoneId,
    targetZoneId,
    migrating: targetZoneId !== zoneId,
    x: point.x,
    y: point.y,
    vx: 0,
    vy: 0,
    angle: 0,
    radius: config.radius * (elite ? 1.12 : 1),
    hp,
    maxHp: hp,
    speed: config.speed * (1 + state.zones[targetZoneId].invasionLevel * 0.07),
    damage: config.damage * (1 + Math.max(0, state.wave - 1) * 0.035),
    gold: Math.round(config.gold * (elite ? 1.8 : 1)),
    sprite: config.sprite,
    ranged: Boolean(config.ranged),
    boss: Boolean(config.boss),
    finalBoss: Boolean(config.finalBoss),
    elite,
    attackCooldown: 0.7 + state.random() * 0.9,
    contactCooldown: 0,
    hitFlash: 0,
    slow: 0,
    weakness: 0,
    stagger: 0,
    patternGlow: 0,
    dead: false,
  };
  state.enemies.push(enemy);
  return enemy;
}

function nearestEnemy(state, origin, range = Infinity, predicate = () => true) {
  let bestSquared = range * range;
  let target = null;
  const visit = (enemy) => {
    if (enemy.dead || !predicate(enemy)) return;
    const dx = origin.x - enemy.x;
    const dy = origin.y - enemy.y;
    const currentSquared = dx * dx + dy * dy;
    if (currentSquared < bestSquared) {
      bestSquared = currentSquared;
      target = enemy;
    }
  };
  if (state.enemyGrid?.size && Number.isFinite(range)) {
    const minX = Math.floor((origin.x - range) / ENEMY_GRID_SIZE);
    const maxX = Math.floor((origin.x + range) / ENEMY_GRID_SIZE);
    const minY = Math.floor((origin.y - range) / ENEMY_GRID_SIZE);
    const maxY = Math.floor((origin.y + range) / ENEMY_GRID_SIZE);
    for (let cellY = minY; cellY <= maxY; cellY += 1) {
      for (let cellX = minX; cellX <= maxX; cellX += 1) {
        const bucket = state.enemyGrid.get(enemyCellKey(cellX, cellY));
        if (bucket) for (const enemy of bucket) visit(enemy);
      }
    }
  } else {
    for (const enemy of state.enemies) visit(enemy);
  }
  return target;
}

function enemiesForZone(state, zoneId) {
  return state.enemies.filter((enemy) => !enemy.dead && zonesShareArena(state, enemy.targetZoneId, zoneId));
}

export function damageEnemy(state, enemy, amount, sourceZoneId = null, source = "weapon") {
  if (!enemy || enemy.dead) return 0;
  const exposedMultiplier = enemy.finalBoss && enemy.weakness > 0 && source !== "patternClear" ? 3.2 : 1;
  const dealt = amount * exposedMultiplier;
  enemy.hp -= dealt;
  enemy.hitFlash = 0.09;
  if (exposedMultiplier > 1) {
    addText(state, enemy.x + (state.random() - 0.5) * 46, enemy.y - enemy.radius, `WEAK ${Math.round(dealt)}`, "#fff18a");
  }
  if (enemy.hp <= 0) killEnemy(state, enemy, sourceZoneId, source);
  return dealt;
}

function killEnemy(state, enemy, sourceZoneId, source) {
  enemy.dead = true;
  state.gold += enemy.gold;
  state.runStats.kills += 1;
  state.runStats.goldEarned += enemy.gold;
  if (Number.isInteger(sourceZoneId) && state.heroes[sourceZoneId]) {
    state.heroes[sourceZoneId].kills += 1;
    state.heroes[sourceZoneId].combo += 1;
    state.heroes[sourceZoneId].comboTimer = 2.8;
    state.runStats.killsByZone[sourceZoneId] += 1;
  }
  addText(state, enemy.x, enemy.y - enemy.radius, `+${enemy.gold}G`, "#ffd56b");
  addParticles(state, enemy.x, enemy.y, enemy.boss ? "#ffd36a" : state.zones[enemy.originZoneId].accent, enemy.boss ? 28 : 8, enemy.boss ? 240 : 130);
  state.shake = Math.max(state.shake, enemy.finalBoss ? 1.5 : enemy.boss ? 0.75 : enemy.elite ? 0.28 : 0.1);
  state.hitStop = Math.max(state.hitStop, enemy.finalBoss ? 0.18 : enemy.elite ? 0.05 : 0);
  emit(state, "enemyKilled", { enemy, gold: enemy.gold, source });
  emit(state, "goldEarned", { amount: enemy.gold });
  if (enemy.finalBoss) {
    state.status = "victory";
    state.bossPattern = null;
    emit(state, "bossDefeated", { enemy });
    emit(state, "victory");
  }
}

function makeProjectile(state, hero, angle, options = {}) {
  const speed = options.speed ?? hero.stats.bulletSpeed;
  state.projectiles.push({
    id: uid(state, "shot"),
    ownerZoneId: hero.zoneId,
    source: options.source || "weapon",
    x: options.x ?? hero.x + Math.cos(angle) * 23,
    y: options.y ?? hero.y + Math.sin(angle) * 23,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    angle,
    damage: options.damage ?? hero.stats.damage,
    life: options.life ?? 0.9,
    radius: options.radius ?? 3.5,
    pierce: options.pierce ?? 0,
    color: options.color || hero.color,
    hit: (options.pierce ?? 0) > 0 ? new Set() : null,
  });
}

function fireChainWeapon(state, hero, firstTarget) {
  const visited = new Set();
  let origin = hero;
  let target = firstTarget;
  const chains = 2 + Math.floor(hero.upgrades.arsenal / 2);
  for (let index = 0; index < chains && target; index += 1) {
    state.beams.push({ x1: origin.x, y1: origin.y, x2: target.x, y2: target.y, color: hero.color, width: 2.3, life: 0.16 });
    damageEnemy(state, target, hero.stats.damage * (1 - index * 0.12), hero.zoneId, "chain");
    visited.add(target.id);
    origin = target;
    target = nearestEnemy(state, origin, 115, (enemy) => zonesShareArena(state, enemy.targetZoneId, hero.zoneId) && !visited.has(enemy.id));
  }
  emit(state, "arc", { zoneId: hero.zoneId });
}

function fireHeroWeapon(state, hero) {
  const target = nearestEnemy(state, hero, hero.stats.range, (enemy) => zonesShareArena(state, enemy.targetZoneId, hero.zoneId));
  if (!target) return false;
  const angle = Math.atan2(target.y - hero.y, target.x - hero.x);
  hero.targetAngle = angle;
  if (hero.stats.projectile === "chain") {
    fireChainWeapon(state, hero, target);
  } else if (hero.stats.projectile === "scatter") {
    for (let index = -1; index <= 1; index += 1) {
      makeProjectile(state, hero, angle + index * 0.13, { damage: hero.stats.damage, life: 0.56, radius: 3.2 });
    }
  } else if (hero.stats.projectile === "heavy") {
    makeProjectile(state, hero, angle, { damage: hero.stats.damage, pierce: 2, radius: 6, color: "#9dffb4" });
  } else {
    makeProjectile(state, hero, angle, { damage: hero.stats.damage, pierce: hero.upgrades.arsenal >= 4 ? 1 : 0 });
  }
  hero.fireCooldown = hero.stats.fireInterval;
  emit(state, "playerShot", { zoneId: hero.zoneId, archetype: hero.archetype });
  return true;
}

function updateDrone(state, hero) {
  const level = hero.upgrades.drone;
  if (!level || hero.droneCooldown > 0) return;
  const orbit = state.time * (1.28 + level * 0.08) + hero.zoneId * 1.7;
  const origin = { x: hero.x + Math.cos(orbit) * 34, y: hero.y + Math.sin(orbit) * 34 };
  const target = nearestEnemy(state, origin, 230 + level * 20, (enemy) => zonesShareArena(state, enemy.targetZoneId, hero.zoneId));
  if (!target) return;
  const angle = Math.atan2(target.y - origin.y, target.x - origin.x);
  makeProjectile(state, hero, angle, {
    x: origin.x,
    y: origin.y,
    speed: 520,
    damage: 10 + level * 6,
    radius: 2.7,
    color: "#c898ff",
    source: "drone",
  });
  hero.droneCooldown = Math.max(0.24, 0.58 - level * 0.08);
}

function deployTower(state, hero, kind, forced = false) {
  const level = hero.upgrades[kind];
  const cooldownKey = kind === "sentry" ? "sentryCooldown" : "empCooldown";
  if (!level || (!forced && hero[cooldownKey] > 0)) {
    emit(state, "buildDenied", { kind, zoneId: hero.zoneId });
    return false;
  }
  const sameKind = state.towers.filter((tower) => tower.zoneId === hero.zoneId && tower.kind === kind);
  const maximum = kind === "sentry" ? 2 + Math.floor(level / 2) : 1 + Math.floor(level / 3);
  if (sameKind.length >= maximum) sameKind.sort((a, b) => a.life - b.life)[0].life = 0;
  const angle = hero.angle + Math.PI;
  const life = kind === "sentry" ? 36 + level * 9 : 26 + level * 7;
  const tower = {
    id: uid(state, kind),
    kind,
    zoneId: hero.zoneId,
    ownerZoneId: hero.zoneId,
    x: hero.x + Math.cos(angle) * 34,
    y: hero.y + Math.sin(angle) * 34,
    angle: 0,
    life,
    maxLife: life,
    level,
    cooldown: 0.2,
    pulse: 0,
  };
  clampToZone(state, tower, hero.zoneId, 8);
  state.towers.push(tower);
  hero[cooldownKey] = kind === "sentry" ? Math.max(10, 19 - level * 2) : Math.max(15, 27 - level * 2);
  addParticles(state, tower.x, tower.y, kind === "sentry" ? "#ffbf54" : "#b77cff", 11, 95);
  emit(state, "build", { kind, zoneId: hero.zoneId });
  return true;
}

function updateTowers(state, dt) {
  for (const tower of state.towers) {
    tower.life -= dt;
    tower.cooldown -= dt;
    tower.pulse = Math.max(0, tower.pulse - dt);
    if (tower.kind === "sentry") {
      const target = nearestEnemy(state, tower, 205 + tower.level * 24, (enemy) => zonesShareArena(state, enemy.targetZoneId, tower.zoneId));
      if (target) {
        const desired = Math.atan2(target.y - tower.y, target.x - tower.x);
        tower.angle += normalizeAngle(desired - tower.angle) * Math.min(1, dt * 12);
      }
      if (target && tower.cooldown <= 0) {
        const owner = state.heroes[tower.ownerZoneId];
        makeProjectile(state, owner, tower.angle, {
          x: tower.x + Math.cos(tower.angle) * 14,
          y: tower.y + Math.sin(tower.angle) * 14,
          speed: 540,
          damage: 13 + tower.level * 7,
          color: "#ffc257",
          source: "sentry",
        });
        tower.cooldown = Math.max(0.24, 0.52 - tower.level * 0.06);
        emit(state, "towerShot", { zoneId: tower.zoneId });
      }
    } else if (tower.cooldown <= 0) {
      tower.cooldown = Math.max(2.2, 3.5 - tower.level * 0.25);
      tower.pulse = 0.45;
      const radius = 112 + tower.level * 20;
      for (const enemy of state.enemies) {
        if (!enemy.dead && zonesShareArena(state, enemy.targetZoneId, tower.zoneId) && distance(tower, enemy) < radius) {
          damageEnemy(state, enemy, 10 + tower.level * 5, tower.ownerZoneId, "emp");
          enemy.slow = 2.1 + tower.level * 0.35;
        }
      }
      state.beams.push({ x1: tower.x, y1: tower.y, x2: tower.x, y2: tower.y, radius, ring: true, color: "#b97cff", width: 3.5, life: 0.4 });
      emit(state, "empPulse", { zoneId: tower.zoneId });
    }
  }
  compactArray(state.towers, (tower) => tower.life > 0 && state.zones[tower.zoneId].status === "active");
}

function getFallbackAiMovement(state, hero) {
  const zone = state.zones[hero.zoneId];
  const target = nearestEnemy(state, hero, 390, (enemy) => zonesShareArena(state, enemy.targetZoneId, hero.zoneId));
  if (!target) {
    const homeX = zone.x + zone.width / 2;
    const homeY = zone.y + zone.height / 2;
    const dx = homeX - hero.x;
    const dy = homeY - hero.y;
    const length = Math.hypot(dx, dy) || 1;
    return Math.hypot(dx, dy) > 28 ? { x: dx / length * 0.45, y: dy / length * 0.45, target: null } : { x: 0, y: 0, target: null };
  }
  const dx = target.x - hero.x;
  const dy = target.y - hero.y;
  const length = Math.hypot(dx, dy) || 1;
  let crowd = 0;
  for (const enemy of state.enemies) {
    if (enemy.dead || !zonesShareArena(state, enemy.targetZoneId, hero.zoneId)) continue;
    const crowdDx = hero.x - enemy.x;
    const crowdDy = hero.y - enemy.y;
    if (crowdDx * crowdDx + crowdDy * crowdDy < 92 * 92) crowd += 1;
  }
  const profile = hero.aiProfile;
  let forward = length > hero.stats.range * (0.58 + profile.aggression * 0.28)
    ? 0.32 + profile.aggression * 0.72
    : length < 82 + (1 - profile.aggression) * 35 ? -1 : 0;
  if (crowd >= Math.max(2, Math.round(5 - profile.dashInstinct * 2))) forward = -1;
  const strafe = Math.sin(state.time * (1.35 + profile.strafe) + hero.zoneId * 2.2) * (0.28 + profile.strafe * 0.78);
  return {
    x: dx / length * forward + -dy / length * strafe,
    y: dy / length * forward + dx / length * strafe,
    target,
    crowd,
  };
}

function buildNeuralFeatures(state, hero, target, output) {
  const arena = getArenaForZone(state, hero.zoneId);
  const homeX = arena.x + arena.width / 2;
  const homeY = arena.y + arena.height / 2;
  const basisTarget = target || { x: homeX, y: homeY };
  const dx = basisTarget.x - hero.x;
  const dy = basisTarget.y - hero.y;
  const targetDistance = Math.hypot(dx, dy) || 1;
  const radialX = dx / targetDistance;
  const radialY = dy / targetDistance;
  const tangentX = -radialY;
  const tangentY = radialX;
  const desiredRange = Math.max(80, hero.stats.range * 0.58);
  let nearCrowd = 0;
  let midCrowd = 0;
  for (const enemy of state.enemies) {
    if (enemy.dead || !zonesShareArena(state, enemy.targetZoneId, hero.zoneId)) continue;
    const enemyDx = enemy.x - hero.x;
    const enemyDy = enemy.y - hero.y;
    const squared = enemyDx * enemyDx + enemyDy * enemyDy;
    if (squared < 92 * 92) nearCrowd += 1;
    if (squared < 190 * 190) midCrowd += 1;
  }
  let hazardX = 0;
  let hazardY = 0;
  let projectileRisk = 0;
  for (const shot of state.enemyShots) {
    const shotDx = hero.x - shot.x;
    const shotDy = hero.y - shot.y;
    const squared = shotDx * shotDx + shotDy * shotDy;
    if (squared > 230 * 230) continue;
    const range = Math.sqrt(squared) || 1;
    const velocity = Math.hypot(shot.vx, shot.vy) || 1;
    const closing = clamp((shot.vx / velocity * shotDx / range + shot.vy / velocity * shotDy / range + 1) * 0.5, 0, 1);
    const risk = (1 - range / 230) * closing;
    projectileRisk = Math.max(projectileRisk, risk);
    hazardX += shotDx / range * risk;
    hazardY += shotDy / range * risk;
  }
  let edgeX = 0;
  let edgeY = 0;
  const edgeMargin = 72;
  if (hero.x - arena.x < edgeMargin) edgeX += 1 - (hero.x - arena.x) / edgeMargin;
  if (arena.x + arena.width - hero.x < edgeMargin) edgeX -= 1 - (arena.x + arena.width - hero.x) / edgeMargin;
  if (hero.y - arena.y < edgeMargin) edgeY += 1 - (hero.y - arena.y) / edgeMargin;
  if (arena.y + arena.height - hero.y < edgeMargin) edgeY -= 1 - (arena.y + arena.height - hero.y) / edgeMargin;
  const speedScale = Math.max(1, hero.speed);
  output[0] = clamp((targetDistance - desiredRange) / desiredRange, -1, 1);
  output[1] = clamp((96 - targetDistance) / 96, 0, 1);
  output[2] = clamp(nearCrowd / 6, 0, 1);
  output[3] = clamp(midCrowd / 12, 0, 1);
  output[4] = clamp(1 - hero.hp / Math.max(1, hero.maxHp), 0, 1);
  output[5] = hero.dashCooldown <= 0 ? 1 : 0;
  output[6] = hero.upgrades.sentry && hero.sentryCooldown <= 0 ? 1 : 0;
  output[7] = hero.upgrades.emp && hero.empCooldown <= 0 ? 1 : 0;
  output[8] = projectileRisk;
  output[9] = clamp(hazardX * radialX + hazardY * radialY, -1, 1);
  output[10] = clamp(hazardX * tangentX + hazardY * tangentY, -1, 1);
  output[11] = clamp(edgeX * radialX + edgeY * radialY, -1, 1);
  output[12] = clamp(edgeX * tangentX + edgeY * tangentY, -1, 1);
  output[13] = clamp((hero.vx * radialX + hero.vy * radialY) / speedScale, -1, 1);
  output[14] = clamp((hero.vx * tangentX + hero.vy * tangentY) / speedScale, -1, 1);
  output[15] = state.bossPattern?.stage === "telegraph" ? clamp(1 - state.bossPattern.timeLeft / state.bossPattern.total, 0, 1) : 0;
  output[16] = target ? 0 : 1;
  return { radialX, radialY, tangentX, tangentY, nearCrowd };
}

function refreshAiProfile(hero, stateBin) {
  const echo = hero.neuralEcho;
  const metrics = getNeuralEchoMetrics(echo.model, stateBin);
  const profile = hero.aiProfile;
  profile.samples = metrics.samples;
  profile.effectiveSamples = metrics.effectiveSamples;
  profile.training = metrics.confidence;
  profile.loss = metrics.loss;
  profile.coverage = metrics.coverage;
  profile.aggression = clamp((echo.cachedForward + 1) * 0.5, 0, 1);
  profile.strafe = clamp(Math.abs(echo.cachedTangent), 0, 1);
  profile.dashInstinct = clamp(echo.cachedDash, 0, 1);
  if (echo.cachedForward > 0.52) profile.style = "PRESSURE LEARNER";
  else if (Math.abs(echo.cachedTangent) > 0.58) profile.style = "EVASIVE CLONE";
  else if (echo.cachedDash > 0.52) profile.style = "BURST DODGER";
  else profile.style = metrics.samples < 8 ? "CALIBRATING" : "ADAPTIVE";
  const direction = echo.cachedTangent > 0.15 ? "STRAFE R" : echo.cachedTangent < -0.15 ? "STRAFE L" : echo.cachedForward > 0.15 ? "PUSH" : echo.cachedForward < -0.15 ? "RETREAT" : "HOLD";
  profile.intent = `${direction} · DASH ${Math.round(echo.cachedDash * 100)}%`;
}

function getBossSafetyMovement(state, hero) {
  const pattern = state.bossPattern;
  if (!pattern || pattern.stage !== "telegraph") return null;
  const boss = state.enemies.find((enemy) => enemy.finalBoss && !enemy.dead);
  if (!boss) return null;
  const urgency = clamp(1 - pattern.timeLeft / pattern.total, 0, 1);
  let x = 0;
  let y = 0;
  if (pattern.type === "crossfire") {
    const horizontalDanger = Math.abs(hero.y - boss.y) < 90;
    const verticalDanger = Math.abs(hero.x - boss.x) < 90;
    if (horizontalDanger) y = hero.y < boss.y ? -1 : 1;
    if (verticalDanger) x = hero.x < boss.x ? -1 : 1;
  } else if (pattern.type === "deadZone") {
    const dx = hero.x - boss.x;
    const dy = hero.y - boss.y;
    const range = Math.hypot(dx, dy) || 1;
    if (range > 112 && range < 312) {
      const outward = range >= 212 ? 1 : -1;
      x = dx / range * outward;
      y = dy / range * outward;
    }
  } else if (pattern.type === "bombardment") {
    const marker = pattern.markers.find((entry) => entry.heroId === hero.id);
    if (marker) {
      const dx = hero.x - marker.x;
      const dy = hero.y - marker.y;
      const range = Math.hypot(dx, dy);
      if (range < 110) {
        const fallbackAngle = hero.zoneId * Math.PI / 2 + Math.PI / 4;
        x = range > 4 ? dx / range : Math.cos(fallbackAngle);
        y = range > 4 ? dy / range : Math.sin(fallbackAngle);
      }
    }
  } else {
    const heroAngle = Math.atan2(hero.y - boss.y, hero.x - boss.x);
    const delta = normalizeAngle(heroAngle - pattern.angle);
    if (Math.abs(delta) < 0.64) {
      const escapeAngle = pattern.angle + (delta < 0 ? -0.82 : 0.82);
      x = Math.cos(escapeAngle);
      y = Math.sin(escapeAngle);
    }
  }
  if (Math.abs(x) + Math.abs(y) < 0.05) return null;
  const magnitude = Math.hypot(x, y) || 1;
  return { x: x / magnitude, y: y / magnitude, urgency };
}

function getAiMovement(state, hero, dt) {
  const fallback = getFallbackAiMovement(state, hero);
  const echo = hero.neuralEcho;
  echo.inferAccumulator += dt;
  const frame = buildNeuralFeatures(state, hero, fallback.target, echo.features);
  const stateBin = neuralEchoStateBin(echo.features);
  if (echo.inferAccumulator >= 1 / 12) {
    echo.inferAccumulator = 0;
    const output = predictNeuralEcho(echo.model, echo.features, echo.output);
    echo.cachedForward = output[0];
    echo.cachedTangent = output[1];
    echo.cachedDash = output[2];
    refreshAiProfile(hero, stateBin);
  }
  const safety = getBossSafetyMovement(state, hero);
  if (safety) {
    hero.aiProfile.safetyOverride = true;
    hero.aiProfile.intent = `SAFETY OVERRIDE · ${Math.round(safety.urgency * 100)}%`;
    return {
      x: safety.x,
      y: safety.y,
      target: fallback.target,
      crowd: frame.nearCrowd,
      dashProbability: safety.urgency > 0.58 ? 0.92 : echo.cachedDash,
    };
  }
  hero.aiProfile.safetyOverride = false;
  const confidence = hero.aiProfile.training;
  const learnedX = frame.radialX * echo.cachedForward + frame.tangentX * echo.cachedTangent;
  const learnedY = frame.radialY * echo.cachedForward + frame.tangentY * echo.cachedTangent;
  const blend = confidence * 0.78;
  return {
    x: fallback.x * (1 - blend) + learnedX * blend,
    y: fallback.y * (1 - blend) + learnedY * blend,
    target: fallback.target,
    crowd: frame.nearCrowd,
    dashProbability: echo.cachedDash,
  };
}

function updateAiTraining(state, hero, moveX, moveY, input, dt) {
  const echo = hero.neuralEcho;
  if (input.dashPressed) echo.dashPulse = 0.25;
  if (input.deploySentryPressed) echo.sentryPulse = 0.25;
  if (input.deployEmpPressed) echo.empPulse = 0.25;
  echo.dashPulse = Math.max(0, echo.dashPulse - dt);
  echo.sentryPulse = Math.max(0, echo.sentryPulse - dt);
  echo.empPulse = Math.max(0, echo.empPulse - dt);
  echo.trainAccumulator += dt;
  state.runStats.manualTrainingSeconds += dt;
  if (echo.trainAccumulator < 0.1) return;
  echo.trainAccumulator %= 0.1;
  const target = nearestEnemy(state, hero, 440, (enemy) => zonesShareArena(state, enemy.targetZoneId, hero.zoneId));
  const frame = buildNeuralFeatures(state, hero, target, echo.features);
  const magnitude = Math.hypot(moveX, moveY);
  const normalizedX = magnitude > 1 ? moveX / magnitude : moveX;
  const normalizedY = magnitude > 1 ? moveY / magnitude : moveY;
  echo.target[0] = normalizedX * frame.radialX + normalizedY * frame.radialY;
  echo.target[1] = normalizedX * frame.tangentX + normalizedY * frame.tangentY;
  echo.target[2] = echo.dashPulse > 0 ? 1 : 0;
  echo.target[3] = echo.sentryPulse > 0 ? 1 : 0;
  echo.target[4] = echo.empPulse > 0 ? 1 : 0;
  echo.mask[3] = hero.upgrades.sentry ? 1 : 0;
  echo.mask[4] = hero.upgrades.emp ? 1 : 0;
  const stateBin = neuralEchoStateBin(echo.features);
  const demonstratedAction = magnitude > 0.1 || echo.target[2] || echo.target[3] || echo.target[4];
  const sampleWeight = demonstratedAction ? 1 : echo.features[8] > 0.25 || echo.features[15] > 0.25 ? 0.45 : 0.2;
  trainNeuralEcho(echo.model, echo.features, echo.target, { stateBin, mask: echo.mask, sampleWeight });
  const output = predictNeuralEcho(echo.model, echo.features, echo.output);
  echo.cachedForward = output[0];
  echo.cachedTangent = output[1];
  echo.cachedDash = output[2];
  refreshAiProfile(hero, stateBin);
}

function updateHero(state, hero, input, dt) {
  if (hero.dead) return;
  hero.fireCooldown -= dt;
  hero.droneCooldown -= dt;
  hero.dashCooldown = Math.max(0, hero.dashCooldown - dt);
  hero.dashRemaining = Math.max(0, hero.dashRemaining - dt);
  hero.sentryCooldown = Math.max(0, hero.sentryCooldown - dt);
  hero.empCooldown = Math.max(0, hero.empCooldown - dt);
  hero.invulnerability = Math.max(0, hero.invulnerability - dt);
  hero.hitFlash = Math.max(0, hero.hitFlash - dt);
  hero.comboTimer = Math.max(0, hero.comboTimer - dt);
  if (hero.comboTimer <= 0) hero.combo = 0;
  hero.hp = Math.min(hero.maxHp, hero.hp + hero.stats.regen * dt);
  hero.shield = Math.max(0, hero.shield - dt * 0.7);

  const manuallyControlled = Number.isInteger(state.controlledArenaId)
    && state.controlledArenaId === arenaIdForZone(state, hero.zoneId);
  let moveX = 0;
  let moveY = 0;
  let crowd = 0;
  let dashProbability = 0;
  if (manuallyControlled) {
    moveX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    moveY = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    updateAiTraining(state, hero, moveX, moveY, input, dt);
  } else {
    const ai = getAiMovement(state, hero, dt);
    moveX = ai.x;
    moveY = ai.y;
    crowd = ai.crowd || 0;
    dashProbability = ai.dashProbability || 0;
  }
  const magnitude = Math.hypot(moveX, moveY);
  if (magnitude > 1) {
    moveX /= magnitude;
    moveY /= magnitude;
  }

  const wantsDash = manuallyControlled
    ? input.dashPressed
    : hero.dashCooldown <= 0 && (dashProbability > 0.62 || crowd >= Math.max(3, Math.round(6 - hero.aiProfile.dashInstinct * 3)));
  if (wantsDash && hero.dashCooldown <= 0) {
    const dashX = magnitude ? moveX : Math.cos(hero.angle);
    const dashY = magnitude ? moveY : Math.sin(hero.angle);
    hero.vx = dashX * 480;
    hero.vy = dashY * 480;
    hero.dashRemaining = 0.15;
    hero.dashCooldown = 2.4;
    hero.invulnerability = 0.23;
    emit(state, "dash", { zoneId: hero.zoneId });
  }
  if (hero.dashRemaining <= 0) {
    const targetVx = moveX * hero.speed;
    const targetVy = moveY * hero.speed;
    const ease = 1 - Math.exp(-dt * (magnitude ? 10 : 15));
    hero.vx += (targetVx - hero.vx) * ease;
    hero.vy += (targetVy - hero.vy) * ease;
  }
  hero.x += hero.vx * dt;
  hero.y += hero.vy * dt;
  clampToZone(state, hero, hero.zoneId, hero.radius * 0.35);
  if (Math.hypot(hero.vx, hero.vy) > 12) hero.targetAngle = Math.atan2(hero.vy, hero.vx);
  hero.angle += normalizeAngle(hero.targetAngle - hero.angle) * Math.min(1, dt * 12);

  if (manuallyControlled && input.deploySentryPressed) deployTower(state, hero, "sentry");
  if (manuallyControlled && input.deployEmpPressed) deployTower(state, hero, "emp");
  if (!manuallyControlled) {
    let threatCount = 0;
    for (const enemy of state.enemies) {
      if (enemy.dead || !zonesShareArena(state, enemy.targetZoneId, hero.zoneId)) continue;
      const threatDx = hero.x - enemy.x;
      const threatDy = hero.y - enemy.y;
      if (threatDx * threatDx + threatDy * threatDy < 185 * 185) threatCount += 1;
    }
    if ((threatCount >= 7 || hero.neuralEcho.output[3] > 0.68) && hero.upgrades.sentry && hero.sentryCooldown <= 0) deployTower(state, hero, "sentry");
    if ((threatCount >= 10 || hero.neuralEcho.output[4] > 0.72) && hero.upgrades.emp && hero.empCooldown <= 0) deployTower(state, hero, "emp");
  }
  if (hero.fireCooldown <= 0) fireHeroWeapon(state, hero);
  updateDrone(state, hero);
}

function updateProjectiles(state, dt) {
  for (const projectile of state.projectiles) {
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.life -= dt;
    if (projectile.life <= 0) continue;
    const collisionRange = projectile.radius + 112;
    const minX = Math.floor((projectile.x - collisionRange) / ENEMY_GRID_SIZE);
    const maxX = Math.floor((projectile.x + collisionRange) / ENEMY_GRID_SIZE);
    const minY = Math.floor((projectile.y - collisionRange) / ENEMY_GRID_SIZE);
    const maxY = Math.floor((projectile.y + collisionRange) / ENEMY_GRID_SIZE);
    let consumed = false;
    for (let cellY = minY; cellY <= maxY && !consumed; cellY += 1) {
      for (let cellX = minX; cellX <= maxX && !consumed; cellX += 1) {
        const bucket = state.enemyGrid.get(enemyCellKey(cellX, cellY));
        if (!bucket) continue;
        for (const enemy of bucket) {
          if (enemy.dead || projectile.hit?.has(enemy.id)) continue;
          const dx = projectile.x - enemy.x;
          const dy = projectile.y - enemy.y;
          const collisionRadius = projectile.radius + enemy.radius;
          if (dx * dx + dy * dy > collisionRadius * collisionRadius) continue;
          projectile.hit?.add(enemy.id);
          damageEnemy(state, enemy, projectile.damage, projectile.ownerZoneId, projectile.source);
          addParticles(state, projectile.x, projectile.y, projectile.color, 4, 82);
          emit(state, "enemyHit", { source: projectile.source });
          if (projectile.pierce > 0) projectile.pierce -= 1;
          else {
            projectile.life = 0;
            consumed = true;
            break;
          }
        }
      }
    }
  }
  compactArray(state.projectiles, (shot) => shot.life > 0 && shot.x > -30 && shot.x < GAME_WIDTH + 30 && shot.y > -30 && shot.y < GAME_HEIGHT + 30);
}

function damageHero(state, hero, rawDamage) {
  if (!hero || hero.dead || hero.invulnerability > 0 || state.status !== "running") return;
  let damage = rawDamage;
  if (hero.shield > 0) {
    const absorbed = Math.min(hero.shield, damage);
    hero.shield -= absorbed;
    damage -= absorbed;
  }
  if (damage <= 0) return;
  hero.hp -= damage;
  hero.invulnerability = 0.36;
  hero.hitFlash = 0.16;
  state.shake = Math.max(state.shake, 0.26);
  state.dangerPulse = 0.35;
  addParticles(state, hero.x, hero.y, "#ff536d", 8, 130);
  emit(state, "playerHit", { zoneId: hero.zoneId });
  if (hero.hp <= 0) fallZone(state, hero.zoneId);
}

export function fallZone(state, zoneId) {
  const zone = state.zones[zoneId];
  const hero = state.heroes[zoneId];
  if (!zone || zone.status === "fallen") return false;
  zone.status = "fallen";
  zone.fallTime = state.time;
  hero.hp = 0;
  hero.dead = true;
  hero.vx = 0;
  hero.vy = 0;
  if (state.controlledZoneId === zoneId || state.controlledArenaId === arenaIdForZone(state, zoneId)) {
    const replacement = livingHeroesForArena(state, arenaIdForZone(state, zoneId)).find((entry) => entry.zoneId !== zoneId);
    state.controlledZoneId = replacement?.zoneId ?? null;
    state.controlledArenaId = replacement ? arenaIdForZone(state, replacement.zoneId) : null;
  }
  state.towers = state.towers.filter((tower) => tower.zoneId !== zoneId);
  const remaining = livingZoneIds(state);
  for (const activeZoneId of remaining) state.zones[activeZoneId].invasionLevel += 1;
  for (const enemy of state.enemies) {
    if (enemy.dead || enemy.targetZoneId !== zoneId) continue;
    const targetZoneId = chooseInvasionTarget(state, zoneId);
    if (targetZoneId !== null) {
      enemy.targetZoneId = targetZoneId;
      enemy.migrating = true;
      enemy.speed *= 1.12;
    }
  }
  state.runStats.zonesLost += 1;
  state.runStats.invasions += remaining.length;
  state.invasionFlash = 4;
  state.combatAlert = { title: "FRONT COLLAPSED", subtitle: "적 병력이 생존 구역으로 침공합니다", timeLeft: 4 };
  emit(state, "zoneFall", { zoneId, targets: remaining });
  emit(state, "invasion", { zoneId, targets: remaining });
  if (!remaining.length) {
    state.status = "defeat";
    emit(state, "defeat");
  }
  return true;
}

function fireEnemyShot(state, enemy, hero) {
  const angle = Math.atan2(hero.y - enemy.y, hero.x - enemy.x);
  const count = enemy.finalBoss ? 1 : enemy.boss ? 3 : 1;
  for (let index = 0; index < count; index += 1) {
    const current = angle + (index - (count - 1) / 2) * 0.18;
    state.enemyShots.push({
      id: uid(state, "enemy-shot"),
      targetHeroId: hero.id,
      x: enemy.x + Math.cos(current) * enemy.radius,
      y: enemy.y + Math.sin(current) * enemy.radius,
      vx: Math.cos(current) * (enemy.boss ? 230 : 190),
      vy: Math.sin(current) * (enemy.boss ? 230 : 190),
      radius: enemy.boss ? 5 : 3.6,
      damage: enemy.finalBoss ? 12 : enemy.damage,
      life: 3.2,
      color: state.zones[enemy.originZoneId].accent,
    });
  }
  emit(state, "enemyShot", { zoneId: enemy.targetZoneId });
}

function retargetEnemy(state, enemy) {
  const next = chooseInvasionTarget(state, enemy.targetZoneId);
  if (next === null) return null;
  enemy.targetZoneId = next;
  enemy.migrating = true;
  return state.heroes[next];
}

function targetHeroForEnemy(state, enemy) {
  const arenaId = arenaIdForZone(state, enemy.targetZoneId);
  const candidates = livingHeroesForArena(state, arenaId);
  if (!candidates.length) return retargetEnemy(state, enemy);
  let closest = candidates[0];
  let bestSquared = Infinity;
  for (const candidate of candidates) {
    const dx = enemy.x - candidate.x;
    const dy = enemy.y - candidate.y;
    const currentSquared = dx * dx + dy * dy;
    if (currentSquared < bestSquared) {
      closest = candidate;
      bestSquared = currentSquared;
    }
  }
  return closest;
}

function patternDamageHero(state, hero, amount) {
  const before = hero.hp;
  damageHero(state, hero, amount);
  return hero.hp < before;
}

function startBossPattern(state, boss) {
  const type = BOSS_PATTERN_ORDER[state.bossPatternIndex % BOSS_PATTERN_ORDER.length];
  state.bossPatternIndex += 1;
  const heroes = state.heroes.filter((hero) => !hero.dead);
  const definitions = {
    crossfire: { name: "EXECUTION CROSS", korean: "십자 처형포", duration: 2.35, instruction: "십자 궤도에서 이탈" },
    deadZone: { name: "NULL RING", korean: "소거 고리", duration: 2.6, instruction: "붉은 고리 밖으로 회피" },
    bombardment: { name: "MEMORY BOMB", korean: "기억 좌표 폭격", duration: 2.3, instruction: "표식 위치를 버리고 이동" },
    rotorSweep: { name: "PREDICTION SWEEP", korean: "예측 부채꼴", duration: 2.45, instruction: "회전 예측선에서 이탈" },
  };
  const definition = definitions[type];
  state.bossPattern = {
    type,
    ...definition,
    timeLeft: definition.duration,
    total: definition.duration,
    stage: "telegraph",
    result: null,
    resultTime: 0,
    angle: state.random() * TAU,
    markers: type === "bombardment" ? heroes.map((hero) => ({ x: hero.x, y: hero.y, heroId: hero.id })) : [],
  };
  boss.patternGlow = definition.duration;
  emit(state, "bossPatternStart", { pattern: state.bossPattern });
}

function resolveBossPattern(state, boss, pattern) {
  const heroes = state.heroes.filter((hero) => !hero.dead);
  let hits = 0;
  if (pattern.type === "crossfire") {
    for (const hero of heroes) {
      const onCross = Math.abs(hero.x - boss.x) < 62 || Math.abs(hero.y - boss.y) < 62;
      if (onCross && patternDamageHero(state, hero, 34)) hits += 1;
    }
    state.beams.push({ x1: 0, y1: boss.y, x2: GAME_WIDTH, y2: boss.y, color: "#ff3c58", width: 15, life: 0.42, straight: true });
    state.beams.push({ x1: boss.x, y1: 0, x2: boss.x, y2: GAME_HEIGHT, color: "#ff3c58", width: 15, life: 0.42, straight: true });
  } else if (pattern.type === "deadZone") {
    for (const hero of heroes) {
      const range = distance(hero, boss);
      const inRing = range > 132 && range < 292;
      if (inRing && patternDamageHero(state, hero, 39)) hits += 1;
    }
    state.beams.push({ x1: boss.x, y1: boss.y, x2: boss.x, y2: boss.y, radius: 292, ring: true, color: "#ff3c58", width: 12, life: 0.4 });
  } else if (pattern.type === "bombardment") {
    for (const marker of pattern.markers) {
      const caught = heroes.find((hero) => distance(hero, marker) < 78);
      if (caught && patternDamageHero(state, caught, 37)) hits += 1;
      addParticles(state, marker.x, marker.y, "#ff536d", 18, 210);
    }
  } else {
    for (const hero of heroes) {
      const heroAngle = Math.atan2(hero.y - boss.y, hero.x - boss.x);
      const caught = Math.abs(normalizeAngle(heroAngle - pattern.angle)) < 0.48;
      if (caught && patternDamageHero(state, hero, 42)) hits += 1;
    }
  }

  const success = hits === 0;
  pattern.stage = "result";
  pattern.result = success ? "clear" : "failed";
  pattern.resultTime = 1.25;
  if (success) {
    const overload = boss.maxHp * 0.072;
    boss.weakness = 4.5;
    damageEnemy(state, boss, overload, state.controlledZoneId, "patternClear");
    state.runStats.patternsCleared += 1;
    state.shake = Math.max(state.shake, 1.1);
    state.hitStop = Math.max(state.hitStop, 0.12);
    addText(state, boss.x, boss.y - boss.radius - 24, `CORE OVERLOAD -${Math.round(overload)}`, "#fff18a");
    addParticles(state, boss.x, boss.y, "#fff18a", 32, 260);
    emit(state, "bossPatternClear", { pattern: pattern.type, damage: overload });
  } else {
    state.runStats.patternsFailed += 1;
    for (let index = 0; index < 4; index += 1) spawnEnemy(state, "raider", index);
    emit(state, "bossPatternFail", { pattern: pattern.type, hits });
  }
}

function updateFinalBoss(state, boss, dt) {
  boss.vx = 0;
  boss.vy = 0;
  boss.angle += dt * (boss.weakness > 0 ? 0.9 : 0.22);
  boss.hitFlash = Math.max(0, boss.hitFlash - dt);
  boss.weakness = Math.max(0, boss.weakness - dt);
  boss.patternGlow = Math.max(0, boss.patternGlow - dt);
  boss.attackCooldown -= dt;
  if (state.bossPattern) {
    const pattern = state.bossPattern;
    if (pattern.stage === "telegraph") {
      pattern.timeLeft -= dt;
      if (pattern.type === "rotorSweep") pattern.angle += dt * 0.54;
      if (pattern.timeLeft <= 0) resolveBossPattern(state, boss, pattern);
    } else {
      pattern.resultTime -= dt;
      if (pattern.resultTime <= 0) {
        state.bossPattern = null;
        state.bossPatternCooldown = 3.1;
      }
    }
    return;
  }
  state.bossPatternCooldown -= dt;
  if (state.bossPatternCooldown <= 0) {
    startBossPattern(state, boss);
    return;
  }
  if (boss.attackCooldown <= 0) {
    for (const hero of state.heroes.filter((entry) => !entry.dead)) fireEnemyShot(state, boss, hero);
    boss.attackCooldown = 1.65;
  }
}

function updateEnemies(state, dt) {
  for (let index = 0; index < state.enemies.length; index += 1) {
    const enemy = state.enemies[index];
    if (enemy.dead) continue;
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    enemy.contactCooldown = Math.max(0, enemy.contactCooldown - dt);
    enemy.attackCooldown -= dt;
    enemy.slow = Math.max(0, enemy.slow - dt);
    if (enemy.finalBoss) {
      updateFinalBoss(state, enemy, dt);
      continue;
    }
    let hero = state.heroes[enemy.targetZoneId];
    if (!hero || hero.dead || state.phaseLevel > 0) hero = targetHeroForEnemy(state, enemy);
    if (!hero) continue;
    const dx = hero.x - enemy.x;
    const dy = hero.y - enemy.y;
    const currentDistance = Math.hypot(dx, dy) || 1;
    const desired = Math.atan2(dy, dx);
    enemy.angle += normalizeAngle(desired - enemy.angle) * Math.min(1, dt * 7);
    let speed = enemy.speed * (enemy.slow > 0 ? 0.44 : 1) * (enemy.migrating ? 1.12 : 1);
    if (enemy.ranged && currentDistance < (enemy.boss ? 190 : 150)) speed *= -0.25;
    let sepX = 0;
    let sepY = 0;
    for (let otherIndex = Math.max(0, index - 5); otherIndex < Math.min(state.enemies.length, index + 6); otherIndex += 1) {
      const other = state.enemies[otherIndex];
      if (other === enemy || other.dead) continue;
      const apart = distance(enemy, other);
      const minimum = enemy.radius + other.radius + 2;
      if (apart > 0 && apart < minimum) {
        sepX += (enemy.x - other.x) / apart * (minimum - apart) * 4;
        sepY += (enemy.y - other.y) / apart * (minimum - apart) * 4;
      }
    }
    const ease = 1 - Math.exp(-dt * 5);
    enemy.vx += (Math.cos(desired) * speed + sepX - enemy.vx) * ease;
    enemy.vy += (Math.sin(desired) * speed + sepY - enemy.vy) * ease;
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
    const destination = state.zones[enemy.targetZoneId];
    if (enemy.migrating && enemy.x > destination.x && enemy.x < destination.x + destination.width && enemy.y > destination.y && enemy.y < destination.y + destination.height) {
      enemy.migrating = false;
      enemy.zoneId = enemy.targetZoneId;
    }
    if (enemy.ranged && currentDistance < (enemy.boss ? 300 : 235) && enemy.attackCooldown <= 0) {
      fireEnemyShot(state, enemy, hero);
      enemy.attackCooldown = enemy.boss ? 1.35 : 2 + state.random() * 0.7;
    }
    if (currentDistance < hero.radius + enemy.radius + 2 && enemy.contactCooldown <= 0) {
      damageHero(state, hero, enemy.damage);
      enemy.contactCooldown = 0.82;
      enemy.vx *= -0.7;
      enemy.vy *= -0.7;
    }
  }
  compactArray(state.enemies, (enemy) => !enemy.dead);
}

function updateEnemyShots(state, dt) {
  for (const shot of state.enemyShots) {
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.life -= dt;
    const hero = state.heroes.find((entry) => entry.id === shot.targetHeroId);
    if (hero && !hero.dead && distance(shot, hero) < shot.radius + hero.radius) {
      damageHero(state, hero, shot.damage);
      shot.life = 0;
    }
  }
  compactArray(state.enemyShots, (shot) => shot.life > 0 && shot.x > -40 && shot.x < GAME_WIDTH + 40 && shot.y > -40 && shot.y < GAME_HEIGHT + 40);
}

function updateSpawner(state, dt) {
  if (state.enemies.length > 170) return;
  if (!state.earlyEliteSpawned && state.time >= 20) {
    state.earlyEliteSpawned = true;
    for (const zone of state.zones.filter((entry) => entry.status === "active")) {
      spawnEnemy(state, "brute", zone.id, { elite: true });
    }
    emit(state, "eliteSurge", { label: "ARMORED HUNTERS INBOUND" });
  }
  if (!state.emergencySurgeSpawned && state.time >= 35) {
    state.emergencySurgeSpawned = true;
    for (const zone of state.zones.filter((entry) => entry.status === "active")) {
      spawnEnemy(state, "shooter", zone.id);
      spawnEnemy(state, "shooter", zone.id);
    }
    state.combatAlert = { title: "CROSSFIRE SURGE", subtitle: "원거리 적 증원 · 엄폐 없이 계속 이동하세요", timeLeft: 2.8 };
    emit(state, "emergencySurge", { label: "CROSSFIRE SURGE" });
  }
  for (const zone of state.zones) {
    zone.spawnCooldown -= dt;
    if (zone.spawnCooldown > 0) continue;
    if (state.phaseLevel === 2 && zone.id !== Math.floor(state.time / 2.4) % state.zones.length) continue;
    if (zone.status === "active") {
      const phaseBase = state.phaseLevel === 0 ? 2 : state.phaseLevel === 1 ? 3 : 1;
      const group = state.phaseLevel === 2
        ? 1
        : Math.min(5, phaseBase + Math.floor(state.wave / 4) + Math.floor(zone.invasionLevel / 2));
      for (let index = 0; index < group; index += 1) spawnEnemy(state, null, zone.id);
      const finalSlowdown = state.phaseLevel === 2 ? 1.75 : 1;
      const base = Math.max(0.78, 1.82 - state.wave * 0.055 - zone.invasionLevel * 0.08) * finalSlowdown;
      zone.spawnCooldown = base * (0.82 + state.random() * 0.42);
    } else {
      const targetZoneId = chooseInvasionTarget(state, zone.id);
      if (targetZoneId !== null) {
        spawnEnemy(state, state.random() > 0.72 ? "shooter" : "raider", zone.id, { targetZoneId });
        state.runStats.invasions += 1;
      }
      zone.spawnCooldown = Math.max(1.5, 3 - state.wave * 0.08);
    }
  }
}

function enterPhase(state, phaseLevel) {
  if (phaseLevel <= state.phaseLevel) return;
  state.phaseLevel = phaseLevel;
  state.phase = ARENA_PHASES[phaseLevel].id;
  state.phaseFlash = 2.6;
  state.phaseTitle = phaseLevel === 1 ? "PAIR CONVERGENCE / 2 FRONTS" : "FINAL CONVERGENCE / ALL HEROES";
  state.enemyShots = [];
  const controlledZone = Number.isInteger(state.controlledZoneId) && !state.heroes[state.controlledZoneId].dead
    ? state.controlledZoneId
    : livingZoneIds(state)[0] ?? null;
  if (controlledZone !== null) {
    state.controlledZoneId = controlledZone;
    state.controlledArenaId = arenaIdForZone(state, controlledZone);
  }
  for (const enemy of state.enemies) {
    if (enemy.dead || enemy.finalBoss) continue;
    const target = targetHeroForEnemy(state, enemy);
    if (target) enemy.targetZoneId = target.zoneId;
  }
  for (const zone of state.zones) zone.spawnCooldown = Math.max(zone.spawnCooldown, 1.25);
  state.shake = Math.max(state.shake, 0.9);
  state.invasionFlash = Math.max(state.invasionFlash, 2.5);
  emit(state, "phaseMerge", { phaseLevel, title: state.phaseTitle });
  if (phaseLevel === 2 && !state.finalBossSpawned) {
    state.enemies = state.enemies.filter((enemy) => enemy.finalBoss);
    state.projectiles = [];
    for (const hero of state.heroes) {
      if (!hero.dead) {
        hero.hp = Math.min(hero.maxHp, hero.hp + hero.maxHp * 0.35);
        hero.shield = Math.max(hero.shield, 24);
        addParticles(state, hero.x, hero.y, hero.color, 18, 155);
      }
    }
    state.finalBossSpawned = true;
    const targetZoneId = livingZoneIds(state)[0] ?? 0;
    spawnEnemy(state, "finalBoss", targetZoneId);
    state.bossPatternCooldown = 4.2;
    emit(state, "bossSpawn", { zoneId: targetZoneId, final: true });
  }
}

function updatePhase(state) {
  const pairedAt = Math.min(CONVERGENCE_TIMES.paired, state.duration * 0.34);
  const finalAt = Math.min(CONVERGENCE_TIMES.final, state.duration * 0.7);
  if (state.time >= finalAt) enterPhase(state, 2);
  else if (state.time >= pairedAt) enterPhase(state, 1);
}

function updateEffects(state, dt) {
  for (const particle of state.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= Math.pow(0.08, dt);
    particle.vy *= Math.pow(0.08, dt);
    particle.life -= dt;
  }
  compactArray(state.particles, (particle) => particle.life > 0);
  for (const beam of state.beams) beam.life -= dt;
  compactArray(state.beams, (beam) => beam.life > 0);
  for (const text of state.texts) {
    text.y -= 24 * dt;
    text.life -= dt;
  }
  compactArray(state.texts, (text) => text.life > 0);
  state.shake = Math.max(0, state.shake - dt * 3);
  state.dangerPulse = Math.max(0, state.dangerPulse - dt);
  state.invasionFlash = Math.max(0, state.invasionFlash - dt);
  if (state.combatAlert) {
    state.combatAlert.timeLeft -= dt;
    if (state.combatAlert.timeLeft <= 0) state.combatAlert = null;
  }
  state.phaseFlash = Math.max(0, state.phaseFlash - dt);
}

function updatePressure(state) {
  state.pressureAccumulator += 1;
  if (state.pressureAccumulator < 12) return;
  state.pressureAccumulator = 0;
  for (const zone of state.zones) {
    const threats = enemiesForZone(state, zone.id);
    const boss = threats.some((enemy) => enemy.boss) ? 8 : 0;
    zone.pressure = clamp((threats.length + boss + zone.invasionLevel * 4) / 28, 0, 1);
  }
}

export function purchaseShopItem(state, itemId, zoneId = state.controlledZoneId) {
  const item = SHOP_ITEMS.find((entry) => entry.id === itemId);
  const hero = Number.isInteger(zoneId) ? state.heroes[zoneId] : null;
  if (!item || !hero || hero.dead || state.zones[zoneId].status !== "active") return false;
  const level = hero.upgrades[itemId] || 0;
  if (!item.consumable && level >= item.max) return false;
  if (itemId === "medkit" && hero.hp >= hero.maxHp) return false;
  const cost = getShopItemCost(item, level);
  if (state.gold < cost) {
    emit(state, "purchaseDenied", { itemId, cost });
    return false;
  }
  state.gold -= cost;
  state.runStats.goldSpent += cost;
  state.runStats.purchases += 1;
  if (!item.consumable) hero.upgrades[itemId] = level + 1;
  switch (itemId) {
    case "arsenal":
      hero.stats.damage *= 1.24;
      break;
    case "firerate":
      hero.stats.fireInterval *= 0.86;
      break;
    case "vitality":
      hero.maxHp += 30;
      hero.hp = Math.min(hero.maxHp, hero.hp + 30);
      break;
    case "regen":
      hero.stats.regen += 0.45;
      break;
    case "drone":
      break;
    case "sentry":
      deployTower(state, hero, "sentry", true);
      break;
    case "emp":
      deployTower(state, hero, "emp", true);
      break;
    case "medkit":
      hero.hp = Math.min(hero.maxHp, hero.hp + 55);
      addText(state, hero.x, hero.y - 28, "+55 HP", "#76f09c");
      break;
    case "barrier":
      hero.shield = Math.min(90, hero.shield + 35);
      addText(state, hero.x, hero.y - 28, "+35 SHIELD", "#70dfff");
      break;
    case "teamRepair":
      for (const ally of state.heroes) {
        if (!ally.dead) ally.hp = Math.min(ally.maxHp, ally.hp + 26);
      }
      break;
    default:
      break;
  }
  emit(state, "purchase", { item, cost, zoneId });
  return true;
}

export function stepGame(state, input, rawDt) {
  const dt = clamp(rawDt, 0, 0.034);
  if (state.paused) return state;
  if (state.hitStop > 0) {
    state.hitStop = Math.max(0, state.hitStop - rawDt);
    return state;
  }
  updateEffects(state, dt);
  if (state.status !== "running") return state;
  state.time += dt;
  state.timeLeft = Math.max(0, state.duration - state.time);
  state.wave = 1 + Math.floor(state.time / 30);
  updatePhase(state);
  rebuildEnemyIndex(state);
  for (const hero of state.heroes) updateHero(state, hero, input, dt);
  updateSpawner(state, dt);
  updateTowers(state, dt);
  updateProjectiles(state, dt);
  updateEnemies(state, dt);
  updateEnemyShots(state, dt);
  updatePressure(state);
  if (state.time >= state.duration && livingZoneIds(state).length && state.status === "running") {
    const finalBoss = state.enemies.find((enemy) => enemy.finalBoss && !enemy.dead);
    state.status = finalBoss ? "defeat" : "victory";
    emit(state, state.status);
  }
  return state;
}

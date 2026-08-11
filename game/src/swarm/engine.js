export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const WORLD_WIDTH = 1920;
export const WORLD_HEIGHT = 1080;
export const EXPEDITION_WORLD_WIDTH = 13200;

const TAU = Math.PI * 2;
const ARENA = Object.freeze({ left: 34, right: 1246, top: 34, bottom: 686 });
const BOSS_ARENA = Object.freeze({ left: 54, right: WORLD_WIDTH - 54, top: 54, bottom: WORLD_HEIGHT - 54 });
const EXPEDITION_ARENA = Object.freeze({ left: 54, right: EXPEDITION_WORLD_WIDTH - 54, top: 54, bottom: 1026 });
const INITIAL_SWARM = 36;
const DEFAULT_ENEMY_BUDGET = 1000;
const FIRST_REGION_ENEMY_BUDGET = 300;
const MINIMAP_ENEMY_SAMPLE_CAP = 24;
const MAX_LIVE_ENEMIES = 220;
const MAX_PROJECTILES = 620;
const MAX_ENEMY_PROJECTILES = 360;
const MAX_PARTICLES = 320;
const MAX_PICKUPS = 220;
const ROUTE_HEALING_KITS = 14;
const GRID_SIZE = 96;
const LEGACY_WORLD_SIZE = Object.freeze({ width: GAME_WIDTH, height: GAME_HEIGHT });
const BOSS_WORLD_SIZE = Object.freeze({ width: WORLD_WIDTH, height: WORLD_HEIGHT });
const EXPEDITION_WORLD_SIZE = Object.freeze({ width: EXPEDITION_WORLD_WIDTH, height: WORLD_HEIGHT });
const FIRE_TIMER_KEYS = Object.freeze(["pulse", "scatter", "rail", "rocket"]);
const FLOOR_ELLIPSE = Object.freeze({ x: 640, y: 360, rx: 555, ry: 292 });
const EXPEDITION_FLOOR_ELLIPSE = Object.freeze({ x: 960, y: 540, rx: 840, ry: 460 });
const EXPEDITION_ROUTE_LENGTH = 12000;
const EXPEDITION_BOSS_GATE = 11200;
const EXPEDITION_GATE_LOCK_DISTANCE = 10680;
const EXPEDITION_ROUTE_ORIGIN_X = 580;
const EXPEDITION_CORRIDOR = Object.freeze({ left: 54, right: EXPEDITION_WORLD_WIDTH - 54, top: 150, bottom: 930 });
const EXPEDITION_DEEP_PURSUIT_DISTANCE = 720;
const EXPEDITION_PURSUIT_SPEED_MULTIPLIER = 1.12;
const EXPEDITION_SPAWN_GATES = Object.freeze([
  Object.freeze({ id: "east-upper", offsetX: 520, y: 270 }),
  Object.freeze({ id: "east-lower", offsetX: 520, y: 810 }),
  Object.freeze({ id: "north-rail", offsetX: 400, y: 235 }),
  Object.freeze({ id: "south-rail", offsetX: 400, y: 845 }),
  Object.freeze({ id: "rear-breach", offsetX: -500, y: 540 }),
]);
const EXPEDITION_TRACES = Object.freeze([
  Object.freeze({ id: "rook", distance: 2200, y: 360, kind: "helmet", beat: "rook-trace" }),
  Object.freeze({ id: "nyx", distance: 5600, y: 760, kind: "weapon", beat: "nyx-trace" }),
  Object.freeze({ id: "moss", distance: 8600, y: 510, kind: "body", beat: "moss-trace" }),
]);
const SURGE_WAVES = Object.freeze([
  Object.freeze({ warnAt: 8, startAt: 9.25, progressAt: 0.1, warningLead: 1.25, count: 124, rate: 20, label: "GATE PRESSURE · TIER I" }),
  Object.freeze({ warnAt: 33, startAt: 34.5, progressAt: 0.34, warningLead: 1.35, count: 180, rate: 30, label: "BREACH FLOOD · TIER II" }),
  Object.freeze({ warnAt: 66, startAt: 67.5, progressAt: 0.6, warningLead: 1.45, count: 260, rate: 42, label: "SOVEREIGN SURGE · TIER III" }),
  Object.freeze({ warnAt: 104, startAt: 105.5, progressAt: 0.82, warningLead: 1.5, count: 400, rate: 60, label: "TERMINAL OVERLOAD · MAXIMUM" }),
]);

const OVERDRIVE_THRESHOLDS = Object.freeze([0.48, 0.72, 0.88]);
const FIRST_REWARD_EARLIEST = 6.4;
const FIRST_REWARD_DEADLINE = 9.6;
const REWARD_COMBAT_INTERVAL = 5.4;
const MAX_BATCH_REWARD_RANKS = 3;
const BOSS_CONTACT_STUN = 0.8;
const BOSS_CONTACT_COOLDOWN = 1.4;
const ROUTE_CLEAR_WARNING_DURATION = 1.2;
const ROUTE_CLEAR_PANIC_DURATION = 1.6;
const WRONG_ENGINE_GROGGY_DURATION = 2.6;
const WRONG_ENGINE_GROGGY_MULTIPLIER = 2.5;
const SUICIDE_ARM_DURATION = 0.95;
const SUICIDE_ELITE_ARM_DURATION = 0.82;
const SUICIDE_TRIGGER_RADIUS = 168;
const SUICIDE_ELITE_TRIGGER_RADIUS = 196;
const SUICIDE_BLAST_RADIUS = 210;
const SUICIDE_ELITE_BLAST_RADIUS = 246;

export const REGION_COMBAT_CONFIGS = Object.freeze({
  "wrong-engine-core": Object.freeze({
    id: "wrong-engine-core",
    chapterId: "chapter-01",
    bossName: "THE WRONG ENGINE",
    enemyBudget: FIRST_REGION_ENEMY_BUDGET,
    bossHp: 560000,
    objective: "ADVANCE TO THE ENGINE",
    chamber: "THE ENGINE CHAMBER",
    deploymentBeat: "deployment",
    encounterBeat: "engine-encounter",
    victoryBeat: "engine-destroyed",
    traces: true,
  }),
  "glass-dune": Object.freeze({
    id: "glass-dune",
    chapterId: "chapter-02",
    bossName: "MIRROR TYRANT",
    enemyBudget: DEFAULT_ENEMY_BUDGET,
    bossHp: 960000,
    objective: "CROSS THE GLASS DUNE",
    chamber: "BURIED SOLAR OBSERVATORY",
    deploymentBeat: "glass-dune-deployment",
    encounterBeat: "glass-dune-encounter",
    victoryBeat: "glass-dune-destroyed",
    traces: false,
  }),
  "abyssal-archive": Object.freeze({
    id: "abyssal-archive",
    chapterId: "chapter-02",
    bossName: "DROWNED ORACLE",
    enemyBudget: DEFAULT_ENEMY_BUDGET,
    bossHp: 1120000,
    objective: "DESCEND INTO THE ARCHIVE",
    chamber: "ABYSSAL MEMORY VAULT",
    deploymentBeat: "abyssal-archive-deployment",
    encounterBeat: "abyssal-archive-encounter",
    victoryBeat: "abyssal-archive-destroyed",
    traces: false,
  }),
});

export const BOSS_PATTERNS = Object.freeze(["radial", "sweep", "bombs", "rings", "charge", "multiCharge"]);

export const REGION_BOSS_PATTERNS = Object.freeze({
  "wrong-engine-core": BOSS_PATTERNS,
  "glass-dune": Object.freeze(["prismLattice", "solarFlare", "refractionSweep", "mirrorShards"]),
  "abyssal-archive": Object.freeze(["memorySpiral", "depthCollapse", "archiveEcho", "undertow"]),
});

const BOSS_PARRY_WINDOW = 1.5;
const BOSS_PARRY_SLOW_SCALE = 0.16;
const BOSS_PARRY_ELIGIBLE = Object.freeze(new Set([
  "rings",
  "multiCharge",
  "prismLattice",
  "refractionSweep",
  "memorySpiral",
  "depthCollapse",
  "undertow",
]));
const BOSS_BOMB_THRESHOLDS = Object.freeze([0.55, 0.3, 0.12]);
const BOSS_BOMB_COUNTS = Object.freeze([2, 4, 8]);
const BOSS_BOMB_SIREN_DURATION = 1.15;
const BOSS_BOMB_ACTIVE_DURATIONS = Object.freeze([10, 14, 22]);

export const REGION_ENEMY_PROFILES = Object.freeze({
  "wrong-engine-core": Object.freeze({
    opening: Object.freeze({ weights: Object.freeze({ hunter: 6, suppressor: 3, brute: 1 }), offset: 0 }),
    reinforcement: Object.freeze({ weights: Object.freeze({ hunter: 5, suppressor: 3, brute: 2 }), offset: 2 }),
  }),
  "glass-dune": Object.freeze({
    opening: Object.freeze({ weights: Object.freeze({ hunter: 2, suppressor: 3, brute: 5 }), offset: 1 }),
    reinforcement: Object.freeze({ weights: Object.freeze({ hunter: 1, suppressor: 3, brute: 6 }), offset: 3 }),
  }),
  "abyssal-archive": Object.freeze({
    opening: Object.freeze({ weights: Object.freeze({ hunter: 8, suppressor: 1, brute: 1 }), offset: 2 }),
    reinforcement: Object.freeze({ weights: Object.freeze({ hunter: 7, suppressor: 2, brute: 1 }), offset: 4 }),
  }),
});

const ENEMY_TYPE_ORDER = Object.freeze(["hunter", "suppressor", "brute"]);

export const MANUAL_ACTIVE_ABILITIES = Object.freeze({
  empPulse: Object.freeze({ id: "empPulse", key: "Q", name: "EMP PULSE", baseCooldown: 18 }),
  aegisWard: Object.freeze({ id: "aegisWard", key: "E", name: "AEGIS WARD", baseCooldown: 28 }),
  stratosRun: Object.freeze({ id: "stratosRun", key: "F", name: "STRATOS RUN", baseCooldown: 34 }),
  helixTempest: Object.freeze({ id: "helixTempest", key: "R", name: "HELIX TEMPEST", baseCooldown: 72 }),
});
const MANUAL_ABILITY_KEYS = Object.freeze(["empPulse", "aegisWard", "stratosRun", "helixTempest"]);
const MANUAL_INPUT_FIELDS = Object.freeze(["empPulsePressed", "aegisWardPressed", "stratosRunPressed", "helixTempestPressed"]);

const ENEMY_DATA = Object.freeze({
  hunter: Object.freeze({ role: "suicideDrone", hp: 38, speed: 118, radius: 22, damage: 78, xp: 4, color: "#ff526d" }),
  suppressor: Object.freeze({ role: "rifleman", hp: 68, speed: 64, radius: 27, damage: 10, xp: 7, color: "#f3ab42" }),
  brute: Object.freeze({ role: "sniper", hp: 132, speed: 48, radius: 36, damage: 44, xp: 10, color: "#d93955" }),
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
  drone: Object.freeze({ id: "drone", category: "ally", name: "HUNTER DRONE", description: "Mobile pursuit wing: long-range high-velocity fire gains armor pierce." }),
  sentry: Object.freeze({ id: "sentry", category: "ally", name: "LANCE ESCORT", description: "Mobile piercing escort: paired shots follow AEGIS and grow into high-speed crossfire." }),
  suppressor: Object.freeze({ id: "suppressor", category: "ally", name: "SUPPRESSOR WISP", description: "Control escort: repeated EMP blooms slow and erase packed formations." }),
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

function activeArena(state) {
  if (!state?.expedition) return ARENA;
  return state.phase === "boss" ? BOSS_ARENA : EXPEDITION_ARENA;
}

function activeWorldSize(state) {
  if (state?.expedition) return state.phase === "swarm" ? EXPEDITION_WORLD_SIZE : BOSS_WORLD_SIZE;
  return LEGACY_WORLD_SIZE;
}

export function getEnemyPressureCap(state) {
  if (!state?.expedition) return MAX_LIVE_ENEMIES;
  const routeProgress = clamp(finite(state.expedition.progress), 0, 1);
  const levelPressure = clamp((finite(state.player?.level, 1) - 1) * 6, 0, 48);
  const clearPressure = clamp(finite(state.killedEnemies) / Math.max(1, finite(state.enemyBudget, DEFAULT_ENEMY_BUDGET)) * 36, 0, 36);
  const timePressure = clamp(finite(state.time) / 180 * 20, 0, 20);
  // Route depth is the dominant crowd signal. The convex curve keeps the
  // deployment readable, then opens substantially more live slots near the
  // second half and terminal approach without changing the authored budget.
  const routePressure = Math.pow(routeProgress, 1.55) * 132;
  return Math.round(clamp(
    INITIAL_SWARM + levelPressure + clearPressure + timePressure + routePressure,
    INITIAL_SWARM,
    MAX_LIVE_ENEMIES,
  ));
}

export function getSniperLockCap(state) {
  if (!state?.expedition) return 5;
  const routeProgress = clamp(finite(state.expedition.progress), 0, 1);
  if (routeProgress < 0.34) return 3;
  if (routeProgress < 0.72) return 5;
  return 7;
}

function activeBossFloor(state) {
  return state?.expedition ? EXPEDITION_FLOOR_ELLIPSE : FLOOR_ELLIPSE;
}

function xpRequirementForLevel(level) {
  if (level <= 1) return 84;
  return Math.round(60 + Math.pow(level, 1.32) * 24);
}

function rayToEllipseBoundary(floor, x, y, direction, padding = 0) {
  const rx = Math.max(1, floor.rx - padding);
  const ry = Math.max(1, floor.ry - padding);
  const ox = x - floor.x;
  const oy = y - floor.y;
  const a = (direction.x * direction.x) / (rx * rx) + (direction.y * direction.y) / (ry * ry);
  const b = 2 * ((ox * direction.x) / (rx * rx) + (oy * direction.y) / (ry * ry));
  const c = (ox * ox) / (rx * rx) + (oy * oy) / (ry * ry) - 1;
  const discriminant = Math.max(0, b * b - 4 * a * c);
  const rootA = (-b + Math.sqrt(discriminant)) / (2 * a);
  const rootB = (-b - Math.sqrt(discriminant)) / (2 * a);
  const distance = Math.max(rootA, rootB, 0);
  return {
    x: floor.x + clamp(ox + direction.x * distance, -rx, rx),
    y: floor.y + clamp(oy + direction.y * distance, -ry, ry),
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

function keepAliveEntity(entity) {
  return !entity.dead;
}

function keepEnemyPresentation(enemy) {
  return !enemy.dead || enemy.deathTimer > 0;
}

function keepPositiveLife(entity) {
  return entity.life > 0;
}

function keepIncompleteLane(lane) {
  return lane.phase !== "done";
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
  if (state.expedition) {
    const streamIndex = Math.floor(index / 8);
    const gate = EXPEDITION_SPAWN_GATES[streamIndex % EXPEDITION_SPAWN_GATES.length];
    const slot = index % 8;
    const x = clamp(state.player.x + gate.offsetX, EXPEDITION_ARENA.left + 34, EXPEDITION_ARENA.right - 34);
    const y = clamp(gate.y + (slot - 3.5) * 8, EXPEDITION_ARENA.top + 12, EXPEDITION_ARENA.bottom - 12);
    const gateActive = state.spawnPortals.some((portal) => portal.gateId === gate.id && portal.life > 0.32);
    if (slot === 0 || !gateActive) {
      state.spawnPortals.push({
        id: ++state.nextEntityId,
        type: "spawnGate",
        gateId: gate.id,
        x,
        y: gate.y,
        life: 1.35,
        maxLife: 1.35,
      });
      emit(state, "spawnGate", { gate: gate.id, x, y: gate.y });
    }
    return {
      x,
      y,
      gateId: gate.id,
      gateSlot: slot,
    };
  }
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

function chooseEnemyType(state, index) {
  const tier = index < INITIAL_SWARM ? "opening" : "reinforcement";
  const profile = state.enemyProfile?.[tier] ?? REGION_ENEMY_PROFILES["wrong-engine-core"][tier];
  const weights = profile.weights;
  const totalWeight = ENEMY_TYPE_ORDER.reduce((total, type) => total + Math.max(0, finite(weights[type])), 0);
  if (totalWeight <= 0) return "hunter";
  let slot = ((index * 7 + finite(profile.offset)) % totalWeight + totalWeight) % totalWeight;
  for (const type of ENEMY_TYPE_ORDER) {
    const weight = Math.max(0, finite(weights[type]));
    if (slot < weight) return type;
    slot -= weight;
  }
  return "hunter";
}

function spawnEnemy(state) {
  if (state.spawnedEnemies >= state.enemyBudget || state.enemies.length >= getEnemyPressureCap(state)) return false;
  const spawnIndex = state.spawnedEnemies;
  const type = chooseEnemyType(state, spawnIndex);
  const base = ENEMY_DATA[type];
  const elite = spawnIndex > 0 && spawnIndex % 29 === 0;
  const datasetProgress = clamp(spawnIndex / Math.max(1, state.enemyBudget - 1), 0, 1);
  const scale = elite ? 1.3 : 1;
  const hpScale = (elite ? 2.35 : 1) * (1 + datasetProgress * 0.45);
  const point = edgeSpawn(state, spawnIndex);
  state.enemies.push({
    id: ++state.nextEntityId,
    type,
    combatRole: base.role,
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
    burstShots: 0,
    burstTimer: 0,
    aimTimer: 0,
    aimDuration: 0,
    lockedAimX: 0,
    lockedAimY: 0,
    lockedStartX: 0,
    lockedStartY: 0,
    slow: 0,
    disabledTimer: 0,
    selfDestructArmed: false,
    selfDestructTimer: 0,
    selfDestructDuration: elite ? SUICIDE_ELITE_ARM_DURATION : SUICIDE_ARM_DURATION,
    selfDestructTriggerRadius: elite ? SUICIDE_ELITE_TRIGGER_RADIUS : SUICIDE_TRIGGER_RADIUS,
    selfDestructBlastRadius: elite ? SUICIDE_ELITE_BLAST_RADIUS : SUICIDE_BLAST_RADIUS,
    orbitHitCooldown: 0,
    animationState: "spawn",
    animationTimer: 0.24,
    attackState: "idle",
    attackTimer: 0,
    recoil: 0,
    hitStun: 0,
    deathTimer: 0,
    moveBlend: 0,
    spawnGateId: point.gateId ?? null,
    spawnDelay: state.expedition
      ? spawnIndex < INITIAL_SWARM
        ? 0.08 + finite(point.gateSlot) * 0.008
        : 0.38 + finite(point.gateSlot) * 0.025
      : 0,
    spawnDuration: state.expedition ? 0.58 : 0,
  });
  state.spawnedEnemies += 1;
  return true;
}

function spawnInitialSwarm(state) {
  const count = Math.min(INITIAL_SWARM, state.enemyBudget, getEnemyPressureCap(state));
  for (let index = 0; index < count; index += 1) spawnEnemy(state);
}

function spawnRouteHealingKits(state) {
  if (!state.expedition) return;
  const routeStart = finite(state.expedition.originX, EXPEDITION_ROUTE_ORIGIN_X);
  const routeEnd = routeStart + finite(state.expedition.gateLockDistance, EXPEDITION_GATE_LOCK_DISTANCE) - 260;
  const span = Math.max(1, routeEnd - routeStart - 760);
  for (let index = 0; index < ROUTE_HEALING_KITS; index += 1) {
    const laneProgress = (index + 0.55 + (state.random() - 0.5) * 0.36) / ROUTE_HEALING_KITS;
    state.healthKits.push({
      id: ++state.nextEntityId,
      type: "healthKit",
      x: clamp(routeStart + 520 + span * laneProgress, routeStart + 420, routeEnd),
      y: clamp(150 + state.random() * 780, EXPEDITION_CORRIDOR.top + 50, EXPEDITION_CORRIDOR.bottom - 50),
      radius: 25,
      heal: 92,
      age: state.random() * 2,
      dead: false,
    });
  }
}

function sanitizeCombatBonuses(value) {
  const source = value && typeof value === "object" ? value : {};
  return Object.freeze({
    damageMultiplier: clamp(finite(source.damageMultiplier, 1), 1, 1.5),
    xpGainMultiplier: clamp(finite(source.xpGainMultiplier, 1), 1, 1.5),
    moveSpeedMultiplier: clamp(finite(source.moveSpeedMultiplier, 1), 1, 1.35),
    fireRateMultiplier: clamp(finite(source.fireRateMultiplier, 1), 1, 1.4),
    maxHpFlat: clamp(finite(source.maxHpFlat, 0), 0, 240),
    healingMultiplier: clamp(finite(source.healingMultiplier, 1), 1, 1.6),
  });
}

function createPlayer(combatBonuses) {
  const bonuses = sanitizeCombatBonuses(combatBonuses);
  const maxHp = 360 + bonuses.maxHpFlat;
  return {
    name: "THE TRAINER",
    x: GAME_WIDTH * 0.5,
    y: GAME_HEIGHT * 0.5,
    vx: 0,
    vy: 0,
    angle: 0,
    radius: 15,
    speed: 245 * bonuses.moveSpeedMultiplier,
    hp: maxHp,
    maxHp,
    shield: 0,
    shieldMax: 0,
    shieldDelay: 0,
    aegisWardShield: 0,
    aegisWardShieldMax: 0,
    aegisWardTimer: 0,
    aegisWardDuration: 0,
    aegisWardDamageReduction: 0,
    level: 1,
    xp: 0,
    nextXp: xpRequirementForLevel(1),
    damageMultiplier: bonuses.damageMultiplier,
    fireRateMultiplier: bonuses.fireRateMultiplier,
    xpGainMultiplier: bonuses.xpGainMultiplier,
    healingMultiplier: bonuses.healingMultiplier,
    baseCombatBonuses: bonuses,
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
    stunTimer: 0,
    stunDuration: 0,
    hitStun: 0,
    recoil: 0,
    attackState: "idle",
    attackTimer: 0,
    animationState: "idle",
    animationTimer: 0,
    deathTimer: 0,
    moveBlend: 0,
    dashBlend: 0,
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

function createBoss(regionConfig = REGION_COMBAT_CONFIGS["wrong-engine-core"]) {
  return {
    name: regionConfig.bossName,
    patterns: REGION_BOSS_PATTERNS[regionConfig.id] ?? BOSS_PATTERNS,
    active: false,
    x: GAME_WIDTH * 0.78,
    y: GAME_HEIGHT * 0.5,
    vx: 0,
    vy: 0,
    angle: Math.PI,
    radius: 70,
    hp: regionConfig.bossHp,
    maxHp: regionConfig.bossHp,
    stage: 1,
    hitFlash: 0,
    dead: false,
    patternCooldown: 1.6,
    patternIndex: 0,
    activePattern: null,
    parryWindow: null,
    parryEligibleCount: 0,
    bombSequence: null,
    bombSequenceTier: 0,
    siren: null,
    contactCooldown: 0,
    weakness: 0,
    groggy: 0,
    groggyDuration: 0,
    groggyMultiplier: 1,
    damageMultiplier: 1,
    transformTimer: 0,
    transformDuration: 1.8,
    phaseFlash: 0,
    alertPulses: 0,
    alertPulseTimer: 0,
    rageBurstCooldown: 5.5,
    enrage: 1,
    orbitHitCooldown: 0,
    animationState: "idle",
    animationTimer: 0,
    attackState: "idle",
    attackTimer: 0,
    recoil: 0,
    hitStun: 0,
    deathTimer: 0,
    moveBlend: 0,
  };
}

export function createSwarmState({ random = Math.random, duration = 180, expedition = false, regionId = "wrong-engine-core", combatBonuses = {} } = {}) {
  const safeRandom = typeof random === "function" ? random : Math.random;
  const regionConfig = REGION_COMBAT_CONFIGS[regionId] ?? REGION_COMBAT_CONFIGS["wrong-engine-core"];
  const state = {
    mode: "swarm",
    phase: "swarm",
    status: "running",
    duration: Math.max(30, finite(duration, 180)),
    time: 0,
    timeLeft: Math.max(30, finite(duration, 180)),
    phaseTime: 0,
    random: safeRandom,
    regionId: regionConfig.id,
    enemyProfile: REGION_ENEMY_PROFILES[regionConfig.id] ?? REGION_ENEMY_PROFILES["wrong-engine-core"],
    chapterId: regionConfig.chapterId,
    regionObjective: regionConfig.objective,
    bossChamber: regionConfig.chamber,
    storyBeats: {
      deployment: regionConfig.deploymentBeat,
      encounter: regionConfig.encounterBeat,
      victory: regionConfig.victoryBeat,
    },
    player: createPlayer(combatBonuses),
    boss: createBoss(regionConfig),
    aim: { x: GAME_WIDTH * 0.82, y: GAME_HEIGHT * 0.5 },
    aimX: GAME_WIDTH * 0.82,
    aimY: GAME_HEIGHT * 0.5,
    enemyBudget: expedition ? regionConfig.enemyBudget : DEFAULT_ENEMY_BUDGET,
    spawnedEnemies: 0,
    killedEnemies: 0,
    spawnAccumulator: 0,
    surgeIndex: 0,
    surgeQueued: 0,
    surgeSpawnAccumulator: 0,
    surgeWarning: null,
    activeSurge: null,
    phaseTransition: 0,
    expedition: expedition ? {
      distance: 0,
      originX: EXPEDITION_ROUTE_ORIGIN_X,
      routeLength: EXPEDITION_ROUTE_LENGTH,
      bossGate: EXPEDITION_BOSS_GATE,
      gateLockDistance: EXPEDITION_GATE_LOCK_DISTANCE,
      progress: 0,
      checkpointIndex: 0,
      objective: regionConfig.objective,
      reachedGate: false,
      gateLocked: true,
      gateUnlocked: false,
      gateWarningShown: false,
      gateLockedPrompted: false,
      atLockedGate: false,
      clearTransition: null,
      entryPrompted: false,
      awaitingBossEntry: false,
      autoBossEntry: false,
      bossEntryConfirmed: false,
      bossRoom: false,
      traces: regionConfig.traces ? EXPEDITION_TRACES.map((trace) => ({ ...trace, triggered: false })) : [],
    } : null,
    nextEntityId: 0,
    enemies: [],
    projectiles: [],
    enemyProjectiles: [],
    particles: [],
    telegraphs: [],
    beams: [],
    chains: [],
    shockwaves: [],
    spawnPortals: [],
    orbitals: [],
    airstrikes: [],
    empPulses: [],
    aegisWards: [],
    stratosRuns: [],
    helixTempests: [],
    bossBombBursts: [],
    allies: [],
    deployables: [],
    pickups: [],
    healthKits: [],
    texts: [],
    events: [],
    spatialGrid: new Map(),
    spatialBuckets: [],
    activeSpatialBuckets: [],
    spatialBounds: { minColumn: 0, maxColumn: -1, minRow: 0, maxRow: -1 },
    nearbyScratch: [],
    levelupPending: false,
    rewardOptions: [],
    rewardCycle: 0,
    levelFlow: {
      queuedLevels: 0,
      batchLevels: 0,
      nextOfferAt: FIRST_REWARD_EARLIEST,
      lastOfferAt: -Infinity,
      lastChoiceAt: -Infinity,
      firstDeadline: FIRST_REWARD_DEADLINE,
      combatInterval: REWARD_COMBAT_INTERVAL,
    },
    build: {
      weapons: { pulse: 1, scatter: 0, rail: 0, rocket: 0, orbit: 0 },
      skills: { damage: 0, fireRate: 0, multishot: 0, shield: 0, dash: 0, regen: 0, chain: 0, nova: 0, airstrike: 0, omegaLaser: 0 },
      allies: { drone: 0, sentry: 0, suppressor: 0 },
    },
    lastChosenByCategory: { weapon: null, skill: null, ally: null },
    support: {
      chainCooldown: 0,
      chainCooldownMax: 0,
      novaCooldown: 0,
      novaCooldownMax: 0,
      airstrikeCooldown: 0,
      airstrikeCooldownMax: 0,
      omegaLaserCooldown: 0,
      omegaLaserCooldownMax: 0,
    },
    manualAbilities: {
      empPulse: { cooldown: 0, maxCooldown: MANUAL_ACTIVE_ABILITIES.empPulse.baseCooldown },
      aegisWard: { cooldown: 0, maxCooldown: MANUAL_ACTIVE_ABILITIES.aegisWard.baseCooldown },
      stratosRun: { cooldown: 0, maxCooldown: MANUAL_ACTIVE_ABILITIES.stratosRun.baseCooldown },
      helixTempest: { cooldown: 0, maxCooldown: MANUAL_ACTIVE_ABILITIES.helixTempest.baseCooldown },
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
      bossParries: 0,
      bossParryFailures: 0,
      bossBombsDefused: 0,
      bossBombFailures: 0,
      activeAbilityCasts: { empPulse: 0, aegisWard: 0, stratosRun: 0, helixTempest: 0 },
      overdriveTier: 0,
      batchedOverflowLevels: 0,
    },
    shake: 0,
    flash: 0,
    lastShotEvent: -10,
  };
  if (state.expedition) {
    state.player.name = "AEGIS";
    state.player.x = 580;
    state.player.y = WORLD_HEIGHT * 0.5;
    state.boss.x = WORLD_WIDTH * 0.8;
    state.boss.y = WORLD_HEIGHT * 0.5;
    state.boss.radius = 110;
    state.aim.x = 1180;
    state.aim.y = WORLD_HEIGHT * 0.5;
    state.aimX = state.aim.x;
    state.aimY = state.aim.y;
    state.camera.x = state.player.x;
    state.camera.y = WORLD_HEIGHT * 0.5;
    state.camera.zoom = 1.08;
    spawnRouteHealingKits(state);
  }
  spawnInitialSwarm(state);
  state.stats.peakEnemies = state.enemies.length;
  emit(state, "swarmStart", { enemies: state.enemies.length, budget: state.enemyBudget });
  if (state.expedition) emit(state, "scenario", { beat: state.storyBeats.deployment, regionId: state.regionId });
  return state;
}

export function createSwarmInput() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    dashPressed: false,
    empPulsePressed: false,
    aegisWardPressed: false,
    stratosRunPressed: false,
    helixTempestPressed: false,
    parryPressed: false,
    bossMechanicClickX: null,
    bossMechanicClickY: null,
  };
}

export function clearPressedInput(input) {
  if (!input || typeof input !== "object") return false;
  input.dashPressed = false;
  input.empPulsePressed = false;
  input.aegisWardPressed = false;
  input.stratosRunPressed = false;
  input.helixTempestPressed = false;
  input.parryPressed = false;
  input.bossMechanicClickX = null;
  input.bossMechanicClickY = null;
  return true;
}

export function setSwarmAim(state, x, y) {
  if (!state || !Number.isFinite(x) || !Number.isFinite(y)) return false;
  const worldWidth = state.expedition ? WORLD_WIDTH : GAME_WIDTH;
  const worldHeight = state.expedition ? WORLD_HEIGHT : GAME_HEIGHT;
  state.aim.x = state.expedition ? x : clamp(x, 0, worldWidth);
  state.aim.y = state.expedition ? y : clamp(y, 0, worldHeight);
  state.aimX = state.aim.x;
  state.aimY = state.aim.y;
  return true;
}

export function setSwarmScreenAim(state, screenX, screenY) {
  if (!state || !Number.isFinite(screenX) || !Number.isFinite(screenY)) return false;
  const worldWidth = state.expedition ? WORLD_WIDTH : GAME_WIDTH;
  const worldHeight = state.expedition ? WORLD_HEIGHT : GAME_HEIGHT;
  const camera = state.camera || { x: worldWidth * 0.5, y: worldHeight * 0.5, zoom: 1 };
  const zoom = Math.max(0.1, finite(camera.zoom, 1));
  const halfWidth = GAME_WIDTH / (2 * zoom);
  const halfHeight = GAME_HEIGHT / (2 * zoom);
  const cameraX = state.expedition
    ? finite(camera.x, worldWidth * 0.5)
    : clamp(finite(camera.x, worldWidth * 0.5), halfWidth, worldWidth - halfWidth);
  const cameraY = state.expedition
    ? finite(camera.y, worldHeight * 0.5)
    : clamp(finite(camera.y, worldHeight * 0.5), halfHeight, worldHeight - halfHeight);
  return setSwarmAim(
    state,
    cameraX + (screenX - GAME_WIDTH * 0.5) / zoom,
    cameraY + (screenY - GAME_HEIGHT * 0.5) / zoom,
  );
}

function clampPlayerToFloor(player, expedition = null) {
  if (expedition) {
    const minX = EXPEDITION_CORRIDOR.left + player.radius;
    const routeLimit = finite(expedition.originX, EXPEDITION_ROUTE_ORIGIN_X)
      + (expedition.gateUnlocked ? finite(expedition.routeLength, EXPEDITION_ROUTE_LENGTH) : finite(expedition.gateLockDistance, EXPEDITION_GATE_LOCK_DISTANCE));
    const maxX = Math.min(EXPEDITION_CORRIDOR.right - player.radius, routeLimit);
    const minY = EXPEDITION_CORRIDOR.top + player.radius;
    const maxY = EXPEDITION_CORRIDOR.bottom - player.radius;
    player.x = clamp(player.x, minX, maxX);
    player.y = clamp(player.y, minY, maxY);
    if ((player.x <= minX && player.vx < 0) || (player.x >= maxX && player.vx > 0)) player.vx = 0;
    if ((player.y <= minY && player.vy < 0) || (player.y >= maxY && player.vy > 0)) player.vy = 0;
    return;
  }
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
  player.hitStun = Math.max(0, player.hitStun - dt);
  player.stunTimer = Math.max(0, player.stunTimer - dt);
  player.attackTimer = Math.max(0, player.attackTimer - dt);
  player.animationTimer = Math.max(0, player.animationTimer - dt);
  player.recoil = Math.max(0, player.recoil - dt * 8.5);
  player.shieldDelay = Math.max(0, player.shieldDelay - dt);
  player.aegisWardTimer = Math.max(0, finite(player.aegisWardTimer) - dt);
  if (player.aegisWardTimer <= 0) {
    player.aegisWardShield = 0;
    player.aegisWardShieldMax = 0;
    player.aegisWardDamageReduction = 0;
  }
  if (player.regen > 0 && player.hp > 0) player.hp = Math.min(player.maxHp, player.hp + player.regen * player.healingMultiplier * dt);
  if (player.shieldMax > 0 && player.shieldDelay <= 0) {
    player.shield = Math.min(player.shieldMax, player.shield + (4 + player.shieldMax * 0.035) * dt);
  }

  const stunned = player.stunTimer > 0;
  let moveX = 0;
  let moveY = 0;
  if (!stunned) {
    const rawX = (input?.right ? 1 : 0) - (input?.left ? 1 : 0);
    const rawY = (input?.down ? 1 : 0) - (input?.up ? 1 : 0);
    const moveLength = Math.hypot(rawX, rawY);
    if (Number.isFinite(moveLength) && moveLength >= 0.00001) {
      moveX = rawX / moveLength;
      moveY = rawY / moveLength;
    }
  }
  const aimDx = state.aim.x - player.x;
  const aimDy = state.aim.y - player.y;
  const aimLength = Math.hypot(aimDx, aimDy);
  const aimX = Number.isFinite(aimLength) && aimLength >= 0.00001 ? aimDx / aimLength : 1;
  const aimY = Number.isFinite(aimLength) && aimLength >= 0.00001 ? aimDy / aimLength : 0;
  player.angle = Math.atan2(aimY, aimX);
  if (!stunned && input?.dashPressed && player.dashCooldown <= 0) {
    const hasMovement = moveX !== 0 || moveY !== 0;
    player.dashX = hasMovement ? moveX : aimX;
    player.dashY = hasMovement ? moveY : aimY;
    player.dashTimer = player.dashDuration;
    player.dashCooldown = player.dashMax;
    const phaseWindow = player.dashInvulnerability + state.build.skills.dash * 0.05;
    player.invulnerability = Math.max(player.invulnerability, phaseWindow);
    emit(state, "dash", { x: player.x, y: player.y, invulnerability: phaseWindow });
  }
  if (stunned) {
    player.dashTimer = 0;
    const damping = Math.pow(0.002, dt);
    player.vx *= damping;
    player.vy *= damping;
  } else if (player.dashTimer > 0) {
    player.dashTimer = Math.max(0, player.dashTimer - dt);
    player.vx = player.dashX * player.dashSpeed;
    player.vy = player.dashY * player.dashSpeed;
  } else {
    player.vx = moveX * player.speed;
    player.vy = moveY * player.speed;
  }
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  clampPlayerToFloor(player, state.expedition);

  const moving = Math.hypot(player.vx, player.vy) > 12;
  player.moveBlend += ((moving ? 1 : 0) - player.moveBlend) * (1 - Math.exp(-dt * 12));
  player.dashBlend += (((player.dashTimer > 0 ? 1 : 0)) - player.dashBlend) * (1 - Math.exp(-dt * 18));
  if (player.dead) player.animationState = "death";
  else if (stunned) player.animationState = "stunned";
  else if (player.dashTimer > 0) player.animationState = "dash";
  else if (player.hitStun > 0) player.animationState = "hit";
  else player.animationState = moving ? "move" : "idle";
  if (player.attackTimer <= 0) player.attackState = "idle";

  const camera = state.camera;
  if (camera) {
    const targetZoom = state.phase === "boss" ? 0.78 : state.expedition ? 1.08 : 1.58;
    camera.x = player.x;
    camera.y = player.y;
    camera.zoom += (targetZoom - camera.zoom) * (1 - Math.exp(-dt * 3.5));
  }
}

function updateExpedition(state) {
  const expedition = state.expedition;
  if (!expedition || state.phase !== "swarm") return;
  const allHostilesKilled = allRouteHostilesKilled(state);
  expedition.gateUnlocked = allHostilesKilled;
  expedition.gateLocked = !allHostilesKilled;
  const maximumDistance = allHostilesKilled ? expedition.routeLength : expedition.gateLockDistance;
  expedition.distance = clamp(state.player.x - expedition.originX, 0, maximumDistance);
  expedition.progress = clamp(expedition.distance / expedition.routeLength, 0, 1);
  expedition.reachedGate = allHostilesKilled && expedition.distance >= expedition.routeLength;
  expedition.atLockedGate = !allHostilesKilled && expedition.distance >= expedition.gateLockDistance - 4;
  if (expedition.atLockedGate && !expedition.gateLockedPrompted) {
    const remainingEnemies = Math.max(0, state.enemyBudget - state.killedEnemies);
    expedition.gateLockedPrompted = true;
    emit(state, "bossGateLocked", {
      regionId: state.regionId,
      reason: "hostilesRemaining",
      title: "보스 구역 봉쇄",
      message: `잔존 적 ${remainingEnemies}기를 먼저 처치하세요.`,
      remainingEnemies,
    });
  }
  expedition.objective = expedition.clearTransition?.phase === "warning"
    ? "적 전멸 · 보스 구역 전환 준비"
    : expedition.clearTransition?.phase === "panic"
      ? "SOVEREIGN 신호 폭주 감지"
    : expedition.awaitingBossEntry
      ? `${state.bossChamber} · 자동 진입`
    : expedition.reachedGate
      ? `${state.bossChamber} READY`
    : allHostilesKilled
      ? `REACH ${state.bossChamber}`
      : expedition.distance >= EXPEDITION_GATE_LOCK_DISTANCE - 4
        ? "PURGE ALL HOSTILES · GATE SEALED"
        : state.regionObjective;

  for (const trace of expedition.traces) {
    if (trace.triggered || expedition.distance < trace.distance) continue;
    trace.triggered = true;
    expedition.checkpointIndex += 1;
    emit(state, "scenario", { beat: trace.beat, trace: trace.kind, checkpoint: expedition.checkpointIndex });
  }
}

function pushPlayerProjectile(state, projectile) {
  if (state.projectiles.length >= MAX_PROJECTILES) return false;
  projectile.id = ++state.nextEntityId;
  projectile.px = projectile.x;
  projectile.py = projectile.y;
  projectile.age = 0;
  projectile.animationState = "flight";
  projectile.dead = false;
  state.projectiles.push(projectile);
  state.stats.shots += 1;
  return true;
}

function fireBulletFan(state, kind, count, spread, speed, damage, radius, life, extra = {}) {
  const player = state.player;
  const baseAngle = player.angle;
  let emitted = 0;
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
      hitIds: extra.pierce ? [] : null,
    };
    if (pushPlayerProjectile(state, projectile)) emitted += 1;
  }
  if (emitted > 0) {
    player.recoil = Math.max(player.recoil, kind === "rail" || kind === "rocket" ? 1 : 0.55);
    player.attackState = kind;
    player.attackTimer = Math.max(player.attackTimer, kind === "rail" || kind === "rocket" ? 0.2 : 0.1);
  }
  if (emitted > 0 && state.time - state.lastShotEvent >= 0.12) {
    state.lastShotEvent = state.time;
    emit(state, "shot", { kind, count: emitted, x: player.x, y: player.y });
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
      hitIds: extra.pierce ? [] : null,
    });
  }
  player.recoil = Math.max(player.recoil, 0.75);
  player.attackState = kind;
  player.attackTimer = Math.max(player.attackTimer, 0.14);
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
  for (let index = 0; index < FIRE_TIMER_KEYS.length; index += 1) timers[FIRE_TIMER_KEYS[index]] -= dt;
  if (player.stunTimer > 0) return;

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
  const activeBuckets = state.activeSpatialBuckets;
  const bounds = state.spatialBounds;
  for (let index = 0; index < activeBuckets.length; index += 1) activeBuckets[index].length = 0;
  activeBuckets.length = 0;
  bounds.minColumn = Infinity;
  bounds.maxColumn = -Infinity;
  bounds.minRow = Infinity;
  bounds.maxRow = -Infinity;
  for (const enemy of state.enemies) {
    if (enemy.dead || finite(enemy.spawnDelay) > 0) continue;
    const column = Math.floor(enemy.x / GRID_SIZE);
    const row = Math.floor(enemy.y / GRID_SIZE);
    const key = gridKey(column, row);
    let bucket = grid.get(key);
    if (!bucket) {
      bucket = [];
      grid.set(key, bucket);
      state.spatialBuckets.push(bucket);
    }
    if (bucket.length === 0) activeBuckets.push(bucket);
    bucket.push(enemy);
    if (column < bounds.minColumn) bounds.minColumn = column;
    if (column > bounds.maxColumn) bounds.maxColumn = column;
    if (row < bounds.minRow) bounds.minRow = row;
    if (row > bounds.maxRow) bounds.maxRow = row;
  }
}

function nearbyEnemies(state, x, y, radius = 0) {
  // One shared buffer removes hundreds of short-lived arrays during projectile
  // storms. Callers must finish iterating before issuing another nearby query.
  const found = state.nearbyScratch;
  found.length = 0;
  if (state.spatialGrid.size === 0) {
    for (const enemy of state.enemies) if (!enemy.dead) found.push(enemy);
    return found;
  }
  const reach = Math.max(1, Math.ceil(radius / GRID_SIZE));
  const column = Math.floor(x / GRID_SIZE);
  const row = Math.floor(y / GRID_SIZE);
  let minColumn = column - reach;
  let maxColumn = column + reach;
  let minRow = row - reach;
  let maxRow = row + reach;
  if (reach > 2) {
    const bounds = state.spatialBounds;
    minColumn = Math.max(minColumn, bounds.minColumn);
    maxColumn = Math.min(maxColumn, bounds.maxColumn);
    minRow = Math.max(minRow, bounds.minRow);
    maxRow = Math.min(maxRow, bounds.maxRow);
  }
  for (let gridColumn = minColumn; gridColumn <= maxColumn; gridColumn += 1) {
    for (let gridRow = minRow; gridRow <= maxRow; gridRow += 1) {
      const bucket = state.spatialGrid.get(gridKey(gridColumn, gridRow));
      if (!bucket) continue;
      for (let index = 0; index < bucket.length; index += 1) found.push(bucket[index]);
    }
  }
  return found;
}

function closestEnemy(state, x, y, maxDistance = Infinity) {
  let best = null;
  let bestSq = maxDistance * maxDistance;
  if (Number.isFinite(maxDistance) && state.spatialGrid.size > 0) {
    const reach = Math.max(1, Math.ceil(maxDistance / GRID_SIZE));
    const column = Math.floor(x / GRID_SIZE);
    const row = Math.floor(y / GRID_SIZE);
    const bounds = state.spatialBounds;
    const minColumn = Math.max(column - reach, bounds.minColumn);
    const maxColumn = Math.min(column + reach, bounds.maxColumn);
    const minRow = Math.max(row - reach, bounds.minRow);
    const maxRow = Math.min(row + reach, bounds.maxRow);
    for (let gridColumn = minColumn; gridColumn <= maxColumn; gridColumn += 1) {
      for (let gridRow = minRow; gridRow <= maxRow; gridRow += 1) {
        const bucket = state.spatialGrid.get(gridKey(gridColumn, gridRow));
        if (!bucket) continue;
        for (let index = 0; index < bucket.length; index += 1) {
          const enemy = bucket[index];
          if (enemy.dead || finite(enemy.spawnDelay) > 0) continue;
          const dx = enemy.x - x;
          const dy = enemy.y - y;
          const distanceSq = dx * dx + dy * dy;
          if (distanceSq < bestSq) {
            best = enemy;
            bestSq = distanceSq;
          }
        }
      }
    }
  } else {
    for (let index = 0; index < state.enemies.length; index += 1) {
      const enemy = state.enemies[index];
      if (enemy.dead || finite(enemy.spawnDelay) > 0) continue;
      const dx = enemy.x - x;
      const dy = enemy.y - y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq < bestSq) {
        best = enemy;
        bestSq = distanceSq;
      }
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

function hasLivingEnemy(enemies) {
  for (let index = 0; index < enemies.length; index += 1) {
    if (!enemies[index].dead) return true;
  }
  return false;
}

function allRouteHostilesKilled(state) {
  return state?.spawnedEnemies >= state?.enemyBudget
    && state?.killedEnemies >= state?.enemyBudget
    && !hasLivingEnemy(state?.enemies ?? []);
}

function gainXp(state, amount) {
  const player = state.player;
  player.xp += amount * player.xpGainMultiplier;
  let gainedLevels = 0;
  while (player.xp >= player.nextXp && player.level < 99) {
    player.xp -= player.nextXp;
    player.level += 1;
    gainedLevels += 1;
    state.stats.levels = player.level;
    player.nextXp = xpRequirementForLevel(player.level);
    state.levelFlow.queuedLevels += 1;
  }
  if (gainedLevels > 0) {
    emit(state, "levelQueued", {
      levels: gainedLevels,
      queuedLevels: state.levelFlow.queuedLevels,
      level: player.level,
    });
  }
}

function updateLevelFlow(state) {
  if (state.levelupPending || state.phase !== "swarm" || state.expedition?.awaitingBossEntry) return;
  const flow = state.levelFlow;
  const player = state.player;
  if (state.rewardCycle === 0 && flow.queuedLevels === 0 && state.time >= flow.firstDeadline) {
    player.level += 1;
    state.stats.levels = player.level;
    player.nextXp = xpRequirementForLevel(player.level);
    flow.queuedLevels = 1;
    emit(state, "trainingMilestone", { level: player.level, deadline: flow.firstDeadline });
  }
  if (flow.queuedLevels <= 0 || state.time < flow.nextOfferAt) return;

  flow.batchLevels = flow.queuedLevels;
  flow.queuedLevels = 0;
  flow.lastOfferAt = state.time;
  state.levelupPending = true;
  state.rewardOptions = buildRewardOffer(state, flow.batchLevels);
  state.rewardCycle += 1;
  state.flash = Math.max(state.flash, 0.34);
  emit(state, "levelUp", {
    level: player.level,
    levels: flow.batchLevels,
    options: state.rewardOptions.map((option) => option.id),
  });
  addText(
    state,
    flow.batchLevels > 1 ? `LEVEL ${player.level} · ×${flow.batchLevels}` : `LEVEL ${player.level}`,
    player.x,
    player.y - 52,
    "#ffe371",
    1.35,
  );
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
  cancelSniperAim(state, enemy);
  enemy.selfDestructArmed = false;
  enemy.selfDestructTimer = 0;
  enemy.dead = true;
  enemy.hp = 0;
  enemy.deathTimer = enemy.elite ? 0.46 : 0.32;
  enemy.animationState = "death";
  enemy.animationTimer = enemy.deathTimer;
  enemy.attackState = "idle";
  state.killedEnemies += 1;
  state.stats.kills += 1;
  if (state.stats.kills % 25 === 0) {
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 6 * state.player.healingMultiplier);
    if (state.stats.kills % 100 === 0) {
      addText(state, "COMBAT REPAIR +6", state.player.x, state.player.y - 46, "#8dffc0", 0.88);
      burst(state, state.player.x, state.player.y, "#72f0ad", 8, 120, 0.42, 4);
    }
  }
  if (source !== "selfDestruct") spawnXpPickup(state, enemy);
  burst(state, enemy.x, enemy.y, enemy.elite ? "#ffe06b" : enemy.color, enemy.elite ? 16 : 6, enemy.elite ? 250 : 150, 0.55, enemy.elite ? 7 : 4);
  if (enemy.elite) addText(state, "ELITE DOWN", enemy.x, enemy.y - 28, "#ffe371", 0.9);
  if (state.killedEnemies % 4 === 0 || enemy.elite) emit(state, "enemyKilled", { type: enemy.type, elite: enemy.elite, source });
}

function cancelSniperAim(state, enemy) {
  if (!enemy || finite(enemy.aimTimer) <= 0) return false;
  enemy.aimTimer = 0;
  enemy.attackState = "idle";
  for (const telegraph of state.telegraphs) {
    if (telegraph.type === "sniperAim" && telegraph.ownerEnemyId === enemy.id) telegraph.life = 0;
  }
  return true;
}

function damageEnemy(state, enemy, amount, source = "weapon") {
  if (!enemy || enemy.dead || finite(enemy.spawnDelay) > 0 || amount <= 0) return 0;
  const dealt = Math.min(enemy.hp, amount * finite(state.player?.overdriveDamage, 1));
  enemy.hp -= dealt;
  enemy.hitFlash = 0.09;
  enemy.hitStun = Math.max(enemy.hitStun, 0.075);
  enemy.animationState = "hit";
  enemy.animationTimer = Math.max(enemy.animationTimer, 0.1);
  state.stats.hits += 1;
  state.stats.damageDealt += dealt;
  if (enemy.hp <= 0) killEnemy(state, enemy, source);
  return dealt;
}

function detonateSuicideDrone(state, enemy, player) {
  const blastRadius = Math.max(1, finite(
    enemy.selfDestructBlastRadius,
    enemy.elite ? SUICIDE_ELITE_BLAST_RADIUS : SUICIDE_BLAST_RADIUS,
  ));
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const collisionRadius = blastRadius + player.radius;
  const caughtInBlast = dx * dx + dy * dy <= collisionRadius * collisionRadius;
  const damage = enemy.damage;
  const hitPlayer = caughtInBlast
    ? damagePlayer(state, damage, "suicideDrone", { critical: true, invulnerability: 0.62, hitStun: 0.28 })
    : false;
  state.shockwaves.push({
    type: "enemySelfDestruct",
    enemy: true,
    x: enemy.x,
    y: enemy.y,
    maxRadius: blastRadius,
    radius: blastRadius,
    life: 0.52,
    maxLife: 0.52,
    color: "#ff405f",
    width: 12,
  });
  burst(state, enemy.x, enemy.y, "#ff5d42", enemy.elite ? 34 : 24, enemy.elite ? 420 : 340, 0.72, enemy.elite ? 9 : 7);
  state.shake = Math.max(state.shake, enemy.elite ? 20 : 15);
  emit(state, "enemySelfDestruct", {
    damage,
    elite: enemy.elite,
    x: enemy.x,
    y: enemy.y,
    blastRadius,
    caughtInBlast,
    hitPlayer,
  });
  killEnemy(state, enemy, "selfDestruct");
}

function triggerBossStage(state, stage) {
  const boss = state.boss;
  boss.stage = stage;
  if (state.expedition) boss.radius = stage === 3 ? 150 : 130;
  boss.enrage = stage === 3 ? 2.15 : 1.5;
  boss.transformTimer = boss.transformDuration;
  boss.groggy = 0;
  boss.groggyDuration = 0;
  boss.groggyMultiplier = 1;
  boss.damageMultiplier = 1;
  boss.phaseFlash = 1;
  boss.alertPulses = 2;
  boss.alertPulseTimer = 0.42;
  boss.patternCooldown = boss.transformDuration + 0.38;
  boss.activePattern = null;
  boss.animationState = "transform";
  boss.animationTimer = boss.transformDuration;
  boss.attackState = "transform";
  boss.attackTimer = boss.transformDuration;
  boss.recoil = 1.4;
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
  const multiplier = boss.groggy > 0
    ? boss.groggyMultiplier
    : boss.weakness > 0 ? 2 : 1;
  boss.damageMultiplier = multiplier;
  const dealt = Math.min(boss.hp, amount * multiplier * finite(state.player?.overdriveDamage, 1));
  boss.hp -= dealt;
  boss.hitFlash = 0.1;
  boss.hitStun = Math.max(boss.hitStun, 0.055);
  if (boss.transformTimer <= 0 && boss.animationState !== "attack") {
    boss.animationState = "hit";
    boss.animationTimer = Math.max(boss.animationTimer, 0.08);
  }
  state.stats.hits += 1;
  state.stats.damageDealt += dealt;
  if (boss.hp <= boss.maxHp * 0.7 && boss.stage === 1) triggerBossStage(state, 2);
  else if (boss.hp <= boss.maxHp * 0.38 && boss.stage === 2) triggerBossStage(state, 3);
  if (boss.hp <= 0) {
    boss.hp = 0;
    boss.dead = true;
    boss.deathTimer = 1.25;
    boss.deathDuration = 1.25;
    boss.animationState = "death";
    boss.animationTimer = boss.deathTimer;
    boss.attackState = "idle";
    boss.parryWindow = null;
    boss.bombSequence = null;
    boss.siren = null;
    state.phase = "victory";
    state.status = "victory";
    state.phaseTime = 0;
    state.shake = 26;
    state.flash = 0.75;
    burst(state, boss.x, boss.y, "#ff385d", 80, 440, 1.2, 9);
    addText(state, `${boss.name} DESTROYED`, boss.x, boss.y - 100, "#ffffff", 1.5);
    if (state.expedition) emit(state, "scenario", { beat: state.storyBeats.victory, regionId: state.regionId });
    emit(state, "win", {
      kills: state.stats.kills,
      level: state.player.level,
      regionId: state.regionId,
      chapterId: state.chapterId,
    });
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

function collidePlayerProjectile(state, projectile, enemy) {
  if (enemy.dead || projectile.dead) return false;
  if (projectile.hitIds?.includes(enemy.id)) return false;
  const dx = projectile.x - enemy.x;
  const dy = projectile.y - enemy.y;
  const collisionRadius = projectile.radius + enemy.radius;
  if (dx * dx + dy * dy > collisionRadius * collisionRadius) return false;
  damageEnemy(state, enemy, projectile.damage, projectile.kind);
  if (projectile.kind === "rocket") {
    projectile.dead = true;
    return true;
  }
  if (projectile.pierce > 0) {
    projectile.hitIds?.push(enemy.id);
    projectile.pierce -= 1;
  } else {
    projectile.dead = true;
  }
  return false;
}

function collideProjectileWithEnemyGrid(state, projectile) {
  let rocketImpact = false;
  if (state.spatialGrid.size === 0) {
    for (let index = 0; index < state.enemies.length; index += 1) {
      rocketImpact = collidePlayerProjectile(state, projectile, state.enemies[index]);
      if (rocketImpact || projectile.dead) break;
    }
    return rocketImpact;
  }
  const queryRadius = projectile.radius + 28;
  const reach = Math.max(1, Math.ceil(queryRadius / GRID_SIZE));
  const column = Math.floor(projectile.x / GRID_SIZE);
  const row = Math.floor(projectile.y / GRID_SIZE);
  collisionBuckets:
  for (let dxCell = -reach; dxCell <= reach; dxCell += 1) {
    for (let dyCell = -reach; dyCell <= reach; dyCell += 1) {
      const bucket = state.spatialGrid.get(gridKey(column + dxCell, row + dyCell));
      if (!bucket) continue;
      for (let index = 0; index < bucket.length; index += 1) {
        rocketImpact = collidePlayerProjectile(state, projectile, bucket[index]);
        if (rocketImpact || projectile.dead) break collisionBuckets;
      }
    }
  }
  return rocketImpact;
}

function updateProjectiles(state, dt) {
  const world = activeWorldSize(state);
  for (const projectile of state.projectiles) {
    if (projectile.dead) continue;
    projectile.age += dt;
    projectile.life -= dt;
    projectile.px = projectile.x;
    projectile.py = projectile.y;
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    if (projectile.life <= 0 || projectile.x < -80 || projectile.x > world.width + 80 || projectile.y < -80 || projectile.y > world.height + 80) {
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

    const rocketImpact = collideProjectileWithEnemyGrid(state, projectile);
    // Splash runs only after the direct bucket walk, so its shared AoE scratch
    // buffer cannot invalidate an in-progress projectile query.
    if (rocketImpact) explodeRocket(state, projectile);
  }
  compact(state.projectiles, keepAliveEntity);
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
    color: String(kind).includes("sniper") ? "#ff3d68" : kind === "boss" ? "#ff385d" : "#ff9f57",
    age: 0,
    animationState: "flight",
    life,
    dead: false,
  });
  return true;
}

function damagePlayer(state, amount, source, options = {}) {
  const player = state.player;
  if (player.dead
    || (!options.unavoidable && player.invulnerability > 0)
    || amount <= 0
    || state.phase === "victory"
    || state.phase === "defeat") return false;
  const rawAmount = amount;
  const wardActive = player.aegisWardTimer > 0;
  const damageReduction = wardActive ? clamp(finite(player.aegisWardDamageReduction), 0, 0.75) : 0;
  amount *= 1 - damageReduction;
  let remaining = amount;
  if (player.aegisWardShield > 0) {
    const absorbed = Math.min(player.aegisWardShield, remaining);
    player.aegisWardShield -= absorbed;
    remaining -= absorbed;
  }
  if (player.shield > 0) {
    const absorbed = Math.min(player.shield, remaining);
    player.shield -= absorbed;
    remaining -= absorbed;
  }
  if (remaining > 0) player.hp = Math.max(0, player.hp - remaining);
  player.shieldDelay = 3.5;
  player.invulnerability = Math.max(player.invulnerability, finite(options.invulnerability, 0.48));
  player.hitFlash = 0.16;
  if (!wardActive) player.hitStun = Math.max(player.hitStun, finite(options.hitStun, 0.18));
  if (!wardActive && options.stun > 0) {
    player.stunTimer = Math.max(player.stunTimer, options.stun);
    player.stunDuration = Math.max(player.stunDuration, options.stun);
    player.dashTimer = 0;
    player.animationState = "stunned";
    player.animationTimer = Math.max(player.animationTimer, options.stun);
    emit(state, "playerStunned", { duration: options.stun, source });
  }
  state.stats.damageTaken += amount;
  state.shake = Math.max(state.shake, options.critical ? 18 : 10);
  burst(state, player.x, player.y, options.critical ? "#ffcf62" : "#ff4968", options.critical ? 22 : 12, options.critical ? 320 : 220, 0.48, options.critical ? 7 : 5);
  addText(state, options.critical ? `CRITICAL -${Math.round(amount)}` : `-${Math.round(amount)}`, player.x, player.y - 34, options.critical ? "#ffe08a" : "#ff647a", options.critical ? 1.1 : 0.9);
  emit(state, "playerHit", {
    damage: amount,
    rawDamage: rawAmount,
    reducedBy: rawAmount - amount,
    source,
    critical: Boolean(options.critical),
    stun: wardActive ? 0 : options.stun || 0,
    statusImmune: wardActive,
  });
  if (player.hp <= 0) {
    player.hp = 0;
    player.dead = true;
    player.deathTimer = 0.9;
    player.deathDuration = 0.9;
    player.animationState = "death";
    player.animationTimer = player.deathTimer;
    state.phase = "defeat";
    state.status = "defeat";
    state.phaseTime = 0;
    emit(state, "loss", { reason: source, kills: state.stats.kills });
  }
  return true;
}

function updateEnemyProjectiles(state, dt) {
  const player = state.player;
  const world = activeWorldSize(state);
  for (const projectile of state.enemyProjectiles) {
    if (projectile.dead) continue;
    projectile.age += dt;
    projectile.life -= dt;
    projectile.px = projectile.x;
    projectile.py = projectile.y;
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    if (projectile.life <= 0 || projectile.x < -100 || projectile.x > world.width + 100 || projectile.y < -100 || projectile.y > world.height + 100) {
      projectile.dead = true;
      continue;
    }
    const dx = projectile.x - player.x;
    const dy = projectile.y - player.y;
    const collisionRadius = projectile.radius + player.radius;
    if (dx * dx + dy * dy <= collisionRadius * collisionRadius) {
      if (damagePlayer(state, projectile.damage, projectile.kind)) {
        if (projectile.kind === "boss") state.stats.bossPatternsHit += 1;
      }
      projectile.dead = true;
    }
  }
  compact(state.enemyProjectiles, keepAliveEntity);
}

function updateEnemies(state, dt) {
  const player = state.player;
  const arena = activeArena(state);
  let deathDamping = 0;
  const moveBlendRate = 1 - Math.exp(-dt * 10);
  const sniperLockCap = getSniperLockCap(state);
  let activeSniperLocks = 0;
  for (const enemy of state.enemies) {
    if (enemy.dead || finite(enemy.aimTimer) <= 0 || finite(enemy.disabledTimer) > 0) continue;
    const role = enemy.combatRole ?? ENEMY_DATA[enemy.type]?.role;
    const deepPursuit = Boolean(state.expedition && player.x - enemy.x > EXPEDITION_DEEP_PURSUIT_DISTANCE);
    if (role === "sniper" && !deepPursuit) activeSniperLocks += 1;
  }
  for (const enemy of state.enemies) {
    if (enemy.dead) {
      if (deathDamping === 0) deathDamping = Math.pow(0.018, dt);
      enemy.deathTimer = Math.max(0, enemy.deathTimer - dt);
      enemy.animationTimer = Math.max(0, enemy.animationTimer - dt);
      enemy.vx *= deathDamping;
      enemy.vy *= deathDamping;
      enemy.x += enemy.vx * dt;
      enemy.y += enemy.vy * dt;
      continue;
    }
    if (finite(enemy.spawnDelay) > 0) {
      enemy.spawnDelay = Math.max(0, enemy.spawnDelay - dt);
      enemy.vx = 0;
      enemy.vy = 0;
      enemy.animationState = "spawn";
      if (enemy.spawnDelay <= 0) emit(state, "enemyMaterialized", { enemy: enemy.type, gate: enemy.spawnGateId });
      continue;
    }
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    enemy.hitStun = Math.max(0, enemy.hitStun - dt);
    enemy.recoil = Math.max(0, enemy.recoil - dt * 7.5);
    enemy.attackTimer = Math.max(0, enemy.attackTimer - dt);
    enemy.animationTimer = Math.max(0, enemy.animationTimer - dt);
    enemy.attackCooldown -= dt;
    enemy.shootCooldown -= dt;
    enemy.burstTimer = Math.max(0, finite(enemy.burstTimer) - dt);
    let wasAiming = finite(enemy.aimTimer) > 0;
    enemy.aimTimer = Math.max(0, finite(enemy.aimTimer) - dt);
    enemy.slow = Math.max(0, enemy.slow - dt);
    enemy.disabledTimer = Math.max(0, finite(enemy.disabledTimer) - dt);
    enemy.orbitHitCooldown = Math.max(0, enemy.orbitHitCooldown - dt);
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const distance = Math.max(0.001, Math.hypot(dx, dy));
    const towardX = dx / distance;
    const towardY = dy / distance;
    const deepPursuit = Boolean(state.expedition && dx > EXPEDITION_DEEP_PURSUIT_DISTANCE);
    if (deepPursuit && wasAiming) {
      cancelSniperAim(state, enemy);
      activeSniperLocks = Math.max(0, activeSniperLocks - 1);
      wasAiming = false;
    }
    if (deepPursuit) enemy.burstShots = 0;
    const slowScale = enemy.slow > 0 ? 0.48 : 1;
    const role = enemy.combatRole ?? ENEMY_DATA[enemy.type]?.role ?? "rifleman";
    if (enemy.disabledTimer > 0) {
      enemy.vx = 0;
      enemy.vy = 0;
      enemy.animationState = "hit";
      enemy.attackState = "disabled";
      enemy.attackTimer = Math.max(enemy.attackTimer, enemy.disabledTimer);
      continue;
    }
    if (role === "suicideDrone" && enemy.selfDestructArmed) {
      enemy.vx = 0;
      enemy.vy = 0;
      enemy.angle = Math.atan2(dy, dx);
      enemy.moveBlend += (0 - enemy.moveBlend) * moveBlendRate;
      enemy.selfDestructTimer = Math.max(0, finite(enemy.selfDestructTimer) - dt);
      enemy.attackState = "selfDestruct";
      enemy.attackTimer = Math.max(enemy.attackTimer, enemy.selfDestructTimer);
      enemy.animationState = "attack";
      enemy.animationTimer = Math.max(enemy.animationTimer, enemy.selfDestructTimer);
      enemy.recoil = 1;
      if (enemy.selfDestructTimer <= 0) detonateSuicideDrone(state, enemy, player);
      continue;
    }
    let movement = 1;
    if (!deepPursuit && role === "rifleman" && distance < 520) movement = distance < 285 ? -0.5 : 0;
    if (!deepPursuit && role === "sniper") movement = wasAiming ? 0 : distance < 520 ? -0.62 : distance < 820 ? 0 : 1;
    const movementSpeed = deepPursuit
      ? Math.max(enemy.speed, finite(player.speed, 245) * EXPEDITION_PURSUIT_SPEED_MULTIPLIER)
      : enemy.speed;
    enemy.vx = towardX * movementSpeed * slowScale * movement;
    enemy.vy = towardY * movementSpeed * slowScale * movement;
    enemy.x = clamp(enemy.x + enemy.vx * dt, arena.left, arena.right);
    enemy.y = clamp(enemy.y + enemy.vy * dt, arena.top, arena.bottom);
    enemy.angle = wasAiming
      ? Math.atan2(enemy.lockedAimY - enemy.lockedStartY, enemy.lockedAimX - enemy.lockedStartX)
      : Math.atan2(dy, dx);
    enemy.moveBlend += (Math.min(1, Math.hypot(enemy.vx, enemy.vy) / Math.max(1, enemy.speed)) - enemy.moveBlend) * moveBlendRate;

    if (!deepPursuit && role === "rifleman" && enemy.burstShots <= 0 && distance < 610 && enemy.shootCooldown <= 0) {
      enemy.burstShots = enemy.elite ? 5 : 3;
      enemy.burstTimer = 0;
      enemy.shootCooldown = enemy.elite ? 1.18 : 1.82;
    }
    if (role === "rifleman" && enemy.burstShots > 0 && enemy.burstTimer <= 0) {
      const spread = (state.random() - 0.5) * (enemy.elite ? 0.055 : 0.085);
      pushEnemyProjectile(state, enemy.x, enemy.y, enemy.angle + spread, enemy.elite ? 590 : 520, enemy.damage, "rifleman", 4, 2.35);
      enemy.burstShots -= 1;
      enemy.burstTimer = enemy.elite ? 0.075 : 0.105;
      enemy.attackState = "shoot";
      enemy.attackTimer = 0.16;
      enemy.animationState = "attack";
      enemy.animationTimer = 0.16;
      enemy.recoil = 0.72;
      emit(state, "enemyShot", { role, kind: "rifleman", x: enemy.x, y: enemy.y });
    }
    if (role === "sniper" && wasAiming && enemy.aimTimer <= 0) {
      activeSniperLocks = Math.max(0, activeSniperLocks - 1);
      const shot = normalize(enemy.lockedAimX - enemy.lockedStartX, enemy.lockedAimY - enemy.lockedStartY);
      const shotAngle = Math.atan2(shot.y, shot.x);
      pushEnemyProjectile(state, enemy.lockedStartX, enemy.lockedStartY, shotAngle, enemy.elite ? 1120 : 980, enemy.damage, "sniper", 7, 2.2);
      enemy.shootCooldown = enemy.elite ? 2.35 : 3.15;
      enemy.attackState = "shoot";
      enemy.attackTimer = 0.32;
      enemy.animationState = "attack";
      enemy.animationTimer = 0.32;
      enemy.recoil = 1.25;
      emit(state, "enemyShot", { role, kind: "sniper", x: enemy.x, y: enemy.y });
    } else if (
      !deepPursuit
      && role === "sniper"
      && !wasAiming
      && distance < 1020
      && enemy.shootCooldown <= 0
      && activeSniperLocks < sniperLockCap
    ) {
      const lead = 0.42;
      enemy.lockedStartX = enemy.x;
      enemy.lockedStartY = enemy.y;
      enemy.lockedAimX = clamp(player.x + player.vx * lead, arena.left, arena.right);
      enemy.lockedAimY = clamp(player.y + player.vy * lead, arena.top, arena.bottom);
      enemy.aimDuration = enemy.elite ? 0.68 : 0.92;
      enemy.aimTimer = enemy.aimDuration;
      const aimAngle = Math.atan2(enemy.lockedAimY - enemy.lockedStartY, enemy.lockedAimX - enemy.lockedStartX);
      state.telegraphs.push({
        id: ++state.nextEntityId,
        type: "sniperAim",
        ownerEnemyId: enemy.id,
        enemy: true,
        life: enemy.aimDuration,
        maxLife: enemy.aimDuration,
        geometry: {
          startX: enemy.lockedStartX,
          startY: enemy.lockedStartY,
          endX: enemy.lockedAimX,
          endY: enemy.lockedAimY,
          angle: aimAngle,
          collisionHalfWidth: 7,
        },
      });
      enemy.attackState = "aim";
      enemy.attackTimer = enemy.aimDuration;
      enemy.animationState = "attack";
      enemy.animationTimer = enemy.aimDuration;
      activeSniperLocks += 1;
      emit(state, "sniperLock", { x: enemy.x, y: enemy.y, targetX: enemy.lockedAimX, targetY: enemy.lockedAimY });
    }
    const contactDx = player.x - enemy.x;
    const contactDy = player.y - enemy.y;
    const contactDistanceSq = contactDx * contactDx + contactDy * contactDy;
    const suicideTriggerRadius = Math.max(1, finite(
      enemy.selfDestructTriggerRadius,
      enemy.elite ? SUICIDE_ELITE_TRIGGER_RADIUS : SUICIDE_TRIGGER_RADIUS,
    ));
    if (role === "suicideDrone" && contactDistanceSq <= suicideTriggerRadius * suicideTriggerRadius) {
      const duration = Math.max(0.1, finite(
        enemy.selfDestructDuration,
        enemy.elite ? SUICIDE_ELITE_ARM_DURATION : SUICIDE_ARM_DURATION,
      ));
      const blastRadius = Math.max(1, finite(
        enemy.selfDestructBlastRadius,
        enemy.elite ? SUICIDE_ELITE_BLAST_RADIUS : SUICIDE_BLAST_RADIUS,
      ));
      enemy.selfDestructArmed = true;
      enemy.selfDestructTimer = duration;
      enemy.selfDestructDuration = duration;
      enemy.vx = 0;
      enemy.vy = 0;
      enemy.moveBlend = 0;
      enemy.attackState = "selfDestruct";
      enemy.attackTimer = duration;
      enemy.animationState = "attack";
      enemy.animationTimer = duration;
      enemy.recoil = 1;
      emit(state, "enemySelfDestructArmed", {
        enemyId: enemy.id,
        elite: enemy.elite,
        x: enemy.x,
        y: enemy.y,
        duration,
        blastRadius,
      });
      continue;
    }
    const contactRadius = enemy.radius + player.radius + 2;
    if (role !== "suicideDrone" && contactDistanceSq <= contactRadius * contactRadius && enemy.attackCooldown <= 0) {
      damagePlayer(state, enemy.damage, enemy.type);
      enemy.attackCooldown = enemy.elite ? 0.62 : 0.9;
      enemy.attackState = "melee";
      enemy.attackTimer = 0.2;
      enemy.animationState = "attack";
      enemy.animationTimer = 0.2;
      enemy.recoil = 0.7;
    }
    if (enemy.hitStun > 0) enemy.animationState = "hit";
    else if (enemy.animationTimer <= 0) enemy.animationState = enemy.moveBlend > 0.08 ? "move" : "idle";
    if (enemy.attackTimer <= 0) enemy.attackState = "idle";
  }
  compact(state.enemies, keepEnemyPresentation);
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
  compact(state.pickups, keepAliveEntity);
}

function updateHealingKits(state, dt) {
  const player = state.player;
  for (const kit of state.healthKits) {
    if (kit.dead) continue;
    kit.age += dt;
    const dx = player.x - kit.x;
    const dy = player.y - kit.y;
    const pickupRadius = player.radius + kit.radius + 7;
    if (dx * dx + dy * dy > pickupRadius * pickupRadius) continue;
    kit.dead = true;
    const missing = Math.max(0, player.maxHp - player.hp);
    const scaledHeal = kit.heal * player.healingMultiplier;
    const healed = Math.min(missing, scaledHeal);
    player.hp = Math.min(player.maxHp, player.hp + scaledHeal);
    player.shieldDelay = Math.min(player.shieldDelay, 0.45);
    addText(state, healed > 0 ? `FIELD REPAIR +${Math.round(healed)}` : "FIELD REPAIR FULL", player.x, player.y - 50, "#8dffc0", 0.94);
    burst(state, kit.x, kit.y, "#74f4ff", 14, 170, 0.62, 5);
    state.shockwaves.push({ type: "healthKit", x: kit.x, y: kit.y, maxRadius: 86, life: 0.5, maxLife: 0.5, color: "#74f4ff", width: 8 });
    emit(state, "healthKitPicked", { x: kit.x, y: kit.y, healed });
  }
  compact(state.healthKits, keepAliveEntity);
}

function updateOrbitWeapon(state, dt) {
  const level = state.build.weapons.orbit;
  if (level <= 0) {
    state.orbitals.length = 0;
    return;
  }
  const player = state.player;
  player.orbitAngle = (player.orbitAngle + dt * (2.4 + level * 0.16)) % TAU;
  const bladeCount = Math.min(5, 1 + level);
  const distance = 68 + level * 7;
  for (let index = 0; index < bladeCount; index += 1) {
    const angle = player.orbitAngle + (index / bladeCount) * TAU;
    const x = player.x + Math.cos(angle) * distance;
    const y = player.y + Math.sin(angle) * distance;
    let orbital = state.orbitals[index];
    if (!orbital) {
      orbital = { id: index, type: "orbitBlade", x, y, angle: angle + Math.PI * 0.5, radius: 14, level };
      state.orbitals[index] = orbital;
    } else {
      orbital.x = x;
      orbital.y = y;
      orbital.angle = angle + Math.PI * 0.5;
      orbital.level = level;
    }
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
  state.orbitals.length = bladeCount;
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
    state.chains.push({ type: "chain", points, life: 0.36, maxLife: 0.36, alpha: 1, width: level >= 3 ? 7 : 4, color: level >= 3 ? "#fff2a1" : "#8ff9ff" });
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

function triggerAirstrike(state, upgradeRank) {
  const count = (upgradeRank >= 3 ? 15 : 6 + upgradeRank * 3) + state.player.overdriveTier * 3;
  const arena = activeArena(state);
  for (let index = 0; index < count; index += 1) {
    const target = strikeTarget(state, index);
    const spread = upgradeRank >= 3 ? 72 : 34 + upgradeRank * 8;
    state.airstrikes.push({
      id: ++state.nextEntityId,
      type: "airstrike",
      phase: "warning",
      x: clamp(target.x + (state.random() - 0.5) * spread, arena.left + 26, arena.right - 26),
      y: clamp(target.y + (state.random() - 0.5) * spread, arena.top + 26, arena.bottom - 26),
      radius: 91 + upgradeRank * 15,
      damage: (223 + upgradeRank * 88) * state.player.damageMultiplier,
      life: 1.05 + index * 0.035,
      maxLife: 1.05 + index * 0.035,
    });
  }
  state.stats.ultimateCasts += 1;
  emit(state, "ultimateWarning", { skill: "airstrike", count });
}

function triggerOmegaLaser(state, upgradeRank) {
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
    width: upgradeRank >= 3 ? 116 : 72 + upgradeRank * 14,
    damage: (175 + upgradeRank * 70) * state.player.damageMultiplier,
    charge: 0.68,
    chargeMax: 0.68,
    life: upgradeRank >= 3 ? 1.95 : 1.55,
    maxLife: upgradeRank >= 3 ? 1.95 : 1.55,
    tickTimer: 0,
    color: upgradeRank >= 3 ? "#fff2a5" : "#72f7ff",
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
  compact(state.airstrikes, keepPositiveLife);
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
  compact(state.beams, keepPositiveLife);
}

function supportCooldownDuration(state, skill) {
  const rank = state.build.skills[skill] || 0;
  const overdriveCooldownScale = Math.max(0.26, state.player.overdriveHaste * 0.94);
  if (skill === "chain") return (rank >= 3 ? 1.65 : 3.2 - Math.max(1, rank) * 0.38) * overdriveCooldownScale;
  if (skill === "nova") return (rank >= 3 ? 3.8 : 6.4 - Math.max(1, rank) * 0.7) * overdriveCooldownScale;
  if (skill === "airstrike") return (rank >= 3 ? 14 : 26 - Math.max(1, rank) * 3) * overdriveCooldownScale;
  return (rank >= 3 ? 20 : 34 - Math.max(1, rank) * 4) * overdriveCooldownScale;
}

function manualAbilityCooldownDuration(_state, ability) {
  return MANUAL_ACTIVE_ABILITIES[ability]?.baseCooldown ?? 0;
}

function hasManualCombatTarget(state) {
  if (state.phase === "boss") return Boolean(state.boss.active && !state.boss.dead);
  return state.enemies.some((enemy) => !enemy.dead);
}

function manualAbilityAvailable(state, ability) {
  const entry = state.manualAbilities[ability];
  if (!entry || state.player.dead || state.player.stunTimer > 0 || entry.cooldown > 0) return false;
  return ability === "stratosRun" || ability === "helixTempest" ? hasManualCombatTarget(state) : true;
}

function rejectManualAbility(state, ability, reason) {
  const definition = MANUAL_ACTIVE_ABILITIES[ability];
  const entry = state.manualAbilities[ability];
  emit(state, "manualAbilityRejected", {
    ability,
    key: definition.key,
    reason,
    cooldown: Math.max(0, finite(entry.cooldown)),
  });
  return false;
}

function commitManualAbility(state, ability, payload = {}) {
  const definition = MANUAL_ACTIVE_ABILITIES[ability];
  const entry = state.manualAbilities[ability];
  const cooldown = manualAbilityCooldownDuration(state, ability);
  entry.cooldown = cooldown;
  entry.maxCooldown = cooldown;
  state.stats.activeAbilityCasts[ability] += 1;
  emit(state, "manualAbilityActivated", {
    ability,
    key: definition.key,
    name: definition.name,
    cooldown,
    ...payload,
  });
  return true;
}

function triggerEmpPulse(state) {
  const ability = "empPulse";
  const radius = 300;
  const visualDuration = 0.92;
  const disableDuration = 3.6;
  const arena = activeArena(state);
  const x = clamp(state.aim.x, arena.left + 24, arena.right - 24);
  const y = clamp(state.aim.y, arena.top + 24, arena.bottom - 24);
  const geometry = { kind: "circle", x, y, radius, collisionRadius: radius };
  state.empPulses.push({
    id: ++state.nextEntityId,
    type: "empPulse",
    x,
    y,
    radius,
    life: visualDuration,
    maxLife: visualDuration,
    geometry,
  });
  let affected = 0;
  let eliteAffected = 0;
  for (const enemy of state.enemies) {
    if (enemy.dead || finite(enemy.spawnDelay) > 0) continue;
    const distance = Math.hypot(enemy.x - x, enemy.y - y);
    if (distance > radius + enemy.radius) continue;
    const duration = enemy.elite ? disableDuration * 0.5 : disableDuration;
    enemy.disabledTimer = Math.max(finite(enemy.disabledTimer), duration);
    enemy.attackCooldown = Math.max(finite(enemy.attackCooldown), duration);
    enemy.shootCooldown = Math.max(finite(enemy.shootCooldown), duration);
    cancelSniperAim(state, enemy);
    enemy.burstShots = 0;
    enemy.vx = 0;
    enemy.vy = 0;
    enemy.hitFlash = Math.max(finite(enemy.hitFlash), 0.14);
    enemy.animationState = "hit";
    enemy.attackState = "disabled";
    affected += 1;
    if (enemy.elite) eliteAffected += 1;
  }
  emit(state, "empPulseActivated", {
    x,
    y,
    radius,
    visualDuration,
    disableDuration,
    affected,
    eliteAffected,
    geometry: { ...geometry },
  });
  return commitManualAbility(state, ability, { x, y, radius, disableDuration, affected });
}

function triggerAegisWard(state) {
  const ability = "aegisWard";
  const healAmount = 36;
  const shield = 96;
  const duration = 5;
  const damageReduction = 0.38;
  const previousHp = state.player.hp;
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + healAmount * state.player.healingMultiplier);
  const healed = state.player.hp - previousHp;
  state.player.aegisWardShield = Math.max(state.player.aegisWardShield, shield);
  state.player.aegisWardShieldMax = Math.max(state.player.aegisWardShieldMax, shield);
  state.player.aegisWardTimer = Math.max(state.player.aegisWardTimer, duration);
  state.player.aegisWardDuration = duration;
  state.player.aegisWardDamageReduction = damageReduction;
  const ward = {
    id: ++state.nextEntityId,
    type: "aegisWard",
    x: state.player.x,
    y: state.player.y,
    radius: 132,
    life: duration,
    maxLife: duration,
    damageReduction,
    geometry: { kind: "circle", x: state.player.x, y: state.player.y, radius: 132 },
  };
  state.aegisWards.length = 0;
  state.aegisWards.push(ward);
  emit(state, "aegisWardActivated", {
    x: ward.x,
    y: ward.y,
    radius: ward.radius,
    healed,
    shield,
    duration,
    damageReduction,
    statusImmune: true,
    geometry: { ...ward.geometry },
  });
  return commitManualAbility(state, ability, { healed, shield });
}

function createStratosLane(state, centerX, centerY, direction, offset, index) {
  const perpendicular = { x: -direction.y, y: direction.x };
  const halfLength = 1080;
  const laneX = centerX + perpendicular.x * offset;
  const laneY = centerY + perpendicular.y * offset;
  const startX = laneX - direction.x * halfLength;
  const startY = laneY - direction.y * halfLength;
  const endX = laneX + direction.x * halfLength;
  const endY = laneY + direction.y * halfLength;
  return {
    id: ++state.nextEntityId,
    type: "stratosRunLane",
    laneIndex: index,
    phase: "warning",
    warning: 0.72 + index * 0.18,
    warningMax: 0.72 + index * 0.18,
    sweepDuration: 0.68,
    progress: 0,
    damage: 190 * state.player.damageMultiplier,
    hitIds: [],
    bossHit: false,
    geometry: {
      kind: "capsule",
      startX,
      startY,
      endX,
      endY,
      angle: Math.atan2(direction.y, direction.x),
      collisionHalfWidth: 24,
      sweepProgress: 0,
      laneIndex: index,
    },
  };
}

function triggerStratosRun(state) {
  const ability = "stratosRun";
  if (!hasManualCombatTarget(state)) return rejectManualAbility(state, ability, "no-target");
  const direction = normalize(state.aim.x - state.player.x, state.aim.y - state.player.y);
  const centerX = state.aim.x;
  const centerY = state.aim.y;
  const lanes = [-112, 0, 112].map((offset, index) => createStratosLane(state, centerX, centerY, direction, offset, index));
  state.stratosRuns.push(...lanes);
  emit(state, "stratosRunWarning", {
    x: centerX,
    y: centerY,
    laneCount: lanes.length,
    lanes: lanes.map((lane) => ({ ...lane.geometry })),
  });
  return commitManualAbility(state, ability, { x: centerX, y: centerY, laneCount: lanes.length });
}

function updateHelixGeometry(tempest) {
  tempest.lances = Array.from({ length: 4 }, (_, index) => {
    const angle = tempest.angle + (index / 4) * TAU;
    return {
      kind: "capsule",
      index,
      angle,
      startX: tempest.x + Math.cos(angle) * tempest.innerRadius,
      startY: tempest.y + Math.sin(angle) * tempest.innerRadius,
      endX: tempest.x + Math.cos(angle) * tempest.radius,
      endY: tempest.y + Math.sin(angle) * tempest.radius,
      collisionHalfWidth: tempest.collisionHalfWidth,
    };
  });
}

function triggerHelixTempest(state) {
  const ability = "helixTempest";
  if (!hasManualCombatTarget(state)) return rejectManualAbility(state, ability, "no-target");
  const duration = 3.2;
  const tempest = {
    id: ++state.nextEntityId,
    type: "helixTempest",
    x: state.player.x,
    y: state.player.y,
    angle: state.player.angle,
    angularSpeed: TAU * 2.25,
    innerRadius: 38,
    radius: 570,
    collisionHalfWidth: 23,
    damage: 165 * state.player.damageMultiplier,
    life: duration,
    maxLife: duration,
    pulseTimer: 0,
    hitCooldowns: {},
    lances: [],
  };
  updateHelixGeometry(tempest);
  state.helixTempests.push(tempest);
  emit(state, "helixTempestStarted", {
    x: tempest.x,
    y: tempest.y,
    duration,
    lanceCount: tempest.lances.length,
    angularSpeed: tempest.angularSpeed,
    radius: tempest.radius,
    lances: tempest.lances.map((lance) => ({ ...lance })),
  });
  return commitManualAbility(state, ability, { duration, lanceCount: tempest.lances.length, radius: tempest.radius });
}

function updateEmpPulses(state, dt) {
  for (const pulse of state.empPulses) pulse.life -= dt;
  compact(state.empPulses, keepPositiveLife);
}

function updateAegisWards(state, dt) {
  for (const ward of state.aegisWards) {
    ward.life = Math.min(ward.life - dt, state.player.aegisWardTimer);
    ward.x = state.player.x;
    ward.y = state.player.y;
    ward.geometry.x = ward.x;
    ward.geometry.y = ward.y;
  }
  compact(state.aegisWards, keepPositiveLife);
}

function syncAegisWardGeometry(state) {
  for (const ward of state.aegisWards) {
    ward.x = state.player.x;
    ward.y = state.player.y;
    ward.geometry.x = ward.x;
    ward.geometry.y = ward.y;
  }
}

function lineProgress(x, y, geometry) {
  const dx = geometry.endX - geometry.startX;
  const dy = geometry.endY - geometry.startY;
  const lengthSq = dx * dx + dy * dy;
  return lengthSq > 0 ? clamp(((x - geometry.startX) * dx + (y - geometry.startY) * dy) / lengthSq, 0, 1) : 0;
}

function updateStratosRuns(state, dt) {
  for (const lane of state.stratosRuns) {
    if (lane.phase === "warning") {
      lane.warning -= dt;
      if (lane.warning <= 0) {
        lane.phase = "sweep";
        emit(state, "stratosRunSweep", { laneIndex: lane.laneIndex, geometry: { ...lane.geometry } });
      }
      continue;
    }
    if (lane.phase !== "sweep") continue;
    const previous = lane.progress;
    lane.progress = clamp(lane.progress + dt / lane.sweepDuration, 0, 1);
    lane.geometry.sweepProgress = lane.progress;
    const intersectsSweep = (x, y, radius) => {
      if (pointLineDistance(x, y, lane.geometry.startX, lane.geometry.startY, lane.geometry.endX, lane.geometry.endY)
        > lane.geometry.collisionHalfWidth + radius) return false;
      const progress = lineProgress(x, y, lane.geometry);
      return progress >= previous - 0.035 && progress <= lane.progress + 0.035;
    };
    if (state.phase === "boss") {
      const boss = state.boss;
      if (!lane.bossHit && boss.active && !boss.dead && intersectsSweep(boss.x, boss.y, boss.radius)) {
        damageBoss(state, lane.damage, "stratosRun");
        lane.bossHit = true;
      }
    } else {
      for (const enemy of state.enemies) {
        if (enemy.dead || lane.hitIds.includes(enemy.id) || !intersectsSweep(enemy.x, enemy.y, enemy.radius)) continue;
        damageEnemy(state, enemy, lane.damage, "stratosRun");
        lane.hitIds.push(enemy.id);
      }
    }
    if (lane.progress >= 1) lane.phase = "done";
  }
  compact(state.stratosRuns, keepIncompleteLane);
}

function updateHelixTempests(state, dt) {
  for (const tempest of state.helixTempests) {
    tempest.life -= dt;
    if (tempest.life <= 0) {
      emit(state, "helixTempestEnded", { id: tempest.id });
      continue;
    }
    tempest.x = state.player.x;
    tempest.y = state.player.y;
    tempest.angle = (tempest.angle + tempest.angularSpeed * dt) % TAU;
    updateHelixGeometry(tempest);
    for (const key of Object.keys(tempest.hitCooldowns)) {
      tempest.hitCooldowns[key] -= dt;
      if (tempest.hitCooldowns[key] <= 0) delete tempest.hitCooldowns[key];
    }
    const intersectsLance = (x, y, radius) => tempest.lances.some((lance) => (
      pointLineDistance(x, y, lance.startX, lance.startY, lance.endX, lance.endY)
      <= lance.collisionHalfWidth + radius
    ));
    if (state.phase === "boss") {
      const boss = state.boss;
      if (boss.active && !boss.dead && !tempest.hitCooldowns.boss && intersectsLance(boss.x, boss.y, boss.radius)) {
        damageBoss(state, tempest.damage, "helixTempest");
        tempest.hitCooldowns.boss = 0.22;
      }
    } else {
      for (const enemy of state.enemies) {
        if (enemy.dead || tempest.hitCooldowns[enemy.id] || !intersectsLance(enemy.x, enemy.y, enemy.radius)) continue;
        damageEnemy(state, enemy, tempest.damage, "helixTempest");
        tempest.hitCooldowns[enemy.id] = 0.22;
      }
    }
    tempest.pulseTimer -= dt;
    if (tempest.pulseTimer <= 0) {
      tempest.pulseTimer += 0.28;
      emit(state, "helixTempestPulse", {
        id: tempest.id,
        x: tempest.x,
        y: tempest.y,
        angle: tempest.angle,
        lances: tempest.lances.map((lance) => ({ ...lance })),
      });
    }
  }
  compact(state.helixTempests, keepPositiveLife);
}

function updateManualAbilityEntities(state, dt) {
  updateEmpPulses(state, dt);
  updateAegisWards(state, dt);
  updateStratosRuns(state, dt);
  updateHelixTempests(state, dt);
}

function updateManualAbilities(state, input, dt) {
  for (let index = 0; index < MANUAL_ABILITY_KEYS.length; index += 1) {
    const ability = MANUAL_ABILITY_KEYS[index];
    const entry = state.manualAbilities[ability];
    entry.cooldown = Math.max(0, finite(entry.cooldown) - dt);
    if (entry.cooldown <= 0) entry.maxCooldown = manualAbilityCooldownDuration(state, ability);
  }
  for (let index = 0; index < MANUAL_ABILITY_KEYS.length; index += 1) {
    const ability = MANUAL_ABILITY_KEYS[index];
    const active = input?.[MANUAL_INPUT_FIELDS[index]];
    if (!active) continue;
    const entry = state.manualAbilities[ability];
    if (state.player.dead) {
      rejectManualAbility(state, ability, "dead");
      continue;
    }
    if (state.player.stunTimer > 0) {
      rejectManualAbility(state, ability, "stunned");
      continue;
    }
    if (entry.cooldown > 0) {
      rejectManualAbility(state, ability, "cooldown");
      continue;
    }
    if (ability === "empPulse") triggerEmpPulse(state);
    else if (ability === "aegisWard") triggerAegisWard(state);
    else if (ability === "stratosRun") triggerStratosRun(state);
    else triggerHelixTempest(state);
  }
  updateManualAbilityEntities(state, dt);
}

function updateSupportSkills(state, dt) {
  const skills = state.build.skills;
  const support = state.support;
  support.chainCooldown -= dt;
  support.novaCooldown -= dt;
  support.airstrikeCooldown -= dt;
  support.omegaLaserCooldown -= dt;

  if (skills.chain > 0 && support.chainCooldown <= 0) {
    triggerChainLightning(state, skills.chain);
    support.chainCooldownMax = supportCooldownDuration(state, "chain");
    support.chainCooldown += support.chainCooldownMax;
  }
  if (skills.nova > 0 && support.novaCooldown <= 0) {
    triggerNova(state, skills.nova);
    support.novaCooldownMax = supportCooldownDuration(state, "nova");
    support.novaCooldown += support.novaCooldownMax;
  }
  if (skills.airstrike > 0 && support.airstrikeCooldown <= 0) {
    triggerAirstrike(state, skills.airstrike);
    support.airstrikeCooldownMax = supportCooldownDuration(state, "airstrike");
    support.airstrikeCooldown += support.airstrikeCooldownMax;
  }
  if (skills.omegaLaser > 0 && support.omegaLaserCooldown <= 0) {
    triggerOmegaLaser(state, skills.omegaLaser);
    support.omegaLaserCooldownMax = supportCooldownDuration(state, "omegaLaser");
    support.omegaLaserCooldown += support.omegaLaserCooldownMax;
  }
  updateAirstrikes(state, dt);
  updateOmegaBeams(state, dt);
}

function syncAllies(state) {
  const droneRank = state.build.allies.drone;
  const sentryRank = state.build.allies.sentry;
  const suppressorRank = state.build.allies.suppressor;
  const wantedDrones = droneRank > 0 ? Math.min(5, droneRank + 1) : 0;
  const wantedSentries = sentryRank > 0 ? Math.min(4, sentryRank + 1) : 0;
  const wantedSuppressors = suppressorRank > 0 ? Math.min(4, suppressorRank + 1) : 0;
  let drones = 0;
  let sentries = 0;
  let suppressors = 0;
  for (const ally of state.allies) {
    if (ally.type === "drone") drones += 1;
    else if (ally.type === "sentry") {
      ally.level = sentryRank;
      ally.mobileEscort = true;
      sentries += 1;
    }
    else if (ally.type === "suppressor") suppressors += 1;
  }
  for (let index = drones; index < wantedDrones; index += 1) {
    state.allies.push({
      id: ++state.nextEntityId, type: "drone", x: state.player.x, y: state.player.y,
      angle: 0, orbit: state.random() * TAU, fireCooldown: index * 0.05, pulseCooldown: 0,
      animationState: "spawn", animationTimer: 0.28, attackState: "idle", attackTimer: 0,
      recoil: 0, moveBlend: 0,
    });
  }
  for (let index = sentries; index < wantedSentries; index += 1) {
    state.allies.push({
      id: ++state.nextEntityId, type: "sentry", x: state.player.x, y: state.player.y,
      angle: 0, orbit: state.random() * TAU, fireCooldown: index * 0.05, pulseCooldown: 0,
      level: sentryRank, mobileEscort: true,
      animationState: "spawn", animationTimer: 0.28, attackState: "idle", attackTimer: 0,
      recoil: 0, moveBlend: 0,
    });
  }
  for (let index = suppressors; index < wantedSuppressors; index += 1) {
    state.allies.push({
      id: ++state.nextEntityId, type: "suppressor", x: state.player.x, y: state.player.y,
      angle: 0, orbit: state.random() * TAU, fireCooldown: 0, pulseCooldown: index * 0.08,
      animationState: "spawn", animationTimer: 0.28, attackState: "idle", attackTimer: 0,
      recoil: 0, moveBlend: 0,
    });
  }
}

function updateAllies(state, dt) {
  syncAllies(state);
  const total = Math.max(1, state.allies.length);
  for (let index = 0; index < state.allies.length; index += 1) {
    const ally = state.allies[index];
    ally.attackTimer = Math.max(0, ally.attackTimer - dt);
    ally.animationTimer = Math.max(0, ally.animationTimer - dt);
    ally.recoil = Math.max(0, ally.recoil - dt * 7);
    const orbitSpeed = ally.type === "drone" ? 0.75 : ally.type === "sentry" ? -0.42 : -0.55;
    ally.orbit += dt * orbitSpeed;
    const radius = ally.type === "drone" ? 78 : ally.type === "sentry" ? 128 : 105;
    const targetX = state.player.x + Math.cos(ally.orbit + (index / total) * TAU) * radius;
    const targetY = state.player.y + Math.sin(ally.orbit + (index / total) * TAU) * radius;
    const followRate = ally.type === "sentry" ? 8.5 : 7;
    const previousX = ally.x;
    const previousY = ally.y;
    ally.x += (targetX - ally.x) * Math.min(1, dt * followRate);
    ally.y += (targetY - ally.y) * Math.min(1, dt * followRate);
    ally.moveBlend = clamp(Math.hypot(ally.x - previousX, ally.y - previousY) / Math.max(1, dt * 260), 0, 1);
    ally.fireCooldown -= dt;
    ally.pulseCooldown -= dt;
    const targetRange = ally.type === "drone" ? 700 : ally.type === "sentry" ? 820 : 360;
    const target = closestEnemy(state, ally.x, ally.y, targetRange);
    if (target) {
      ally.angle = Math.atan2(target.y - ally.y, target.x - ally.x);
      if (ally.type === "drone" && ally.fireCooldown <= 0) {
        const droneRank = state.build.allies.drone;
        const damage = (48 + droneRank * 22) * state.player.damageMultiplier;
        pushPlayerProjectile(state, {
          kind: "drone",
          x: ally.x,
          y: ally.y,
          vx: Math.cos(ally.angle) * 940,
          vy: Math.sin(ally.angle) * 940,
          angle: ally.angle,
          radius: 4,
          damage,
          color: "#68f6ff",
          life: 1.2,
          pierce: droneRank >= 3 ? 1 : 0,
          splash: 0,
          hitIds: droneRank >= 3 ? [] : null,
        });
        ally.fireCooldown = Math.max(0.16, 0.4 - droneRank * 0.05);
        ally.attackState = "shoot";
        ally.attackTimer = 0.16;
        ally.animationState = "attack";
        ally.animationTimer = 0.16;
        ally.recoil = 1;
      }
      if (ally.type === "sentry" && ally.fireCooldown <= 0) {
        const sentryRank = state.build.allies.sentry;
        const damage = (38 + sentryRank * 18) * state.player.damageMultiplier;
        const pierce = sentryRank >= 4 ? 3 : sentryRank >= 2 ? 1 : 0;
        const spread = sentryRank >= 3 ? 0.045 : 0.032;
        for (const side of [-1, 1]) {
          const shotAngle = ally.angle + spread * side;
          const originX = ally.x - Math.sin(ally.angle) * side * 7;
          const originY = ally.y + Math.cos(ally.angle) * side * 7;
          pushPlayerProjectile(state, {
            kind: "sentry",
            x: originX,
            y: originY,
            vx: Math.cos(shotAngle) * 980,
            vy: Math.sin(shotAngle) * 980,
            angle: shotAngle,
            radius: 4,
            damage,
            color: "#ffe86d",
            life: 1.25,
            pierce,
            splash: 0,
            hitIds: pierce > 0 ? [] : null,
          });
        }
        ally.fireCooldown = Math.max(0.2, 0.42 - sentryRank * 0.05);
        ally.attackState = "shoot";
        ally.attackTimer = 0.18;
        ally.animationState = "attack";
        ally.animationTimer = 0.18;
        ally.recoil = 1;
      }
      if (ally.type === "suppressor" && ally.pulseCooldown <= 0) {
        const suppressorRank = state.build.allies.suppressor;
        const pulseRadius = 205 + suppressorRank * 20;
        for (const enemy of nearbyEnemies(state, ally.x, ally.y, pulseRadius)) {
          if (!enemy.dead && Math.hypot(enemy.x - ally.x, enemy.y - ally.y) < pulseRadius) {
            enemy.slow = Math.max(enemy.slow, 1.55);
            damageEnemy(state, enemy, (36 + suppressorRank * 18) * state.player.damageMultiplier, "suppressorAlly");
          }
        }
        ally.pulseCooldown = Math.max(0.42, 0.82 - suppressorRank * 0.08);
        state.shockwaves.push({
          type: "suppressorPulse",
          x: ally.x,
          y: ally.y,
          maxRadius: pulseRadius,
          life: 0.48,
          maxLife: 0.48,
          color: "#91f8ff",
          width: 7,
        });
        ally.attackState = "pulse";
        ally.attackTimer = 0.26;
        ally.animationState = "attack";
        ally.animationTimer = 0.26;
        ally.recoil = 0.75;
        emit(state, "allyPulse", { x: ally.x, y: ally.y, radius: pulseRadius });
      }
    }
    if (ally.animationTimer <= 0) ally.animationState = "move";
    if (ally.attackTimer <= 0) ally.attackState = "idle";
  }

}

function buildRewardOffer(state, batchLevels = 1) {
  const offer = [];
  const categories = ["weapon", "skill", "ally"];
  for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex += 1) {
    const category = categories[categoryIndex];
    const bucket = category === "weapon" ? state.build.weapons : category === "skill" ? state.build.skills : state.build.allies;
    let pool = REWARD_POOLS[category].filter((candidate) => (bucket[candidate] || 0) < (MAX_REWARD_RANK[candidate] || 5));
    if (category === "skill" && state.rewardCycle === 0) {
      const openingCombatSkills = pool.filter((candidate) => ["airstrike", "omegaLaser", "chain", "nova"].includes(candidate));
      if (openingCombatSkills.length) pool = openingCombatSkills;
    }
    if (!pool.length) pool = REWARD_POOLS[category];
    const previous = state.lastChosenByCategory[category];
    const repeatPrevious = previous && pool.includes(previous) && state.random() < 0.62;
    const offset = Math.floor(clamp(state.random(), 0, 0.999999) * pool.length);
    const id = repeatPrevious ? previous : pool[(state.rewardCycle + categoryIndex + offset) % pool.length];
    const definition = REWARD_DEFINITIONS[id];
    const currentLevel = bucket[id] || 0;
    const maxRank = MAX_REWARD_RANK[id] || 5;
    const rankGain = Math.max(1, Math.min(MAX_BATCH_REWARD_RANKS, batchLevels, maxRank - currentLevel));
    offer.push({
      ...definition,
      level: currentLevel,
      nextLevel: Math.min(maxRank, currentLevel + rankGain),
      maxRank,
      mastery: currentLevel + rankGain >= maxRank,
      rankGain,
      levelsGained: batchLevels,
      overflowLevels: Math.max(0, batchLevels - rankGain),
    });
  }
  return offer;
}

function triggerAllyRewardImpact(state, id, rank, ranksApplied) {
  const radius = id === "suppressor" ? 390 : id === "sentry" ? 250 : 220;
  const damage = (id === "suppressor" ? 130 : id === "sentry" ? 115 : 120) + rank * 55 + ranksApplied * 35;
  damageArea(state, state.player.x, state.player.y, radius, damage * state.player.damageMultiplier, `${id}Deploy`);
  if (id === "suppressor" && state.phase === "swarm") {
    for (const enemy of nearbyEnemies(state, state.player.x, state.player.y, radius)) {
      if (!enemy.dead && Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y) <= radius + enemy.radius) {
        enemy.slow = Math.max(enemy.slow, 2.4);
      }
    }
  }
  state.shockwaves.push({
    type: "allyDeploy", ally: id, x: state.player.x, y: state.player.y,
    maxRadius: radius, life: 0.62, maxLife: 0.62,
    color: id === "suppressor" ? "#bb82ff" : id === "sentry" ? "#ffe36a" : "#66f4ff",
    width: 9,
  });
  state.shake = Math.max(state.shake, 7 + ranksApplied * 2);
  emit(state, "allyDeployed", { id, rank, ranksApplied, radius, damage });
}

function applyReward(state, id, requestedRanks = 1) {
  const definition = REWARD_DEFINITIONS[id];
  if (!definition) return false;
  const bucket = definition.category === "weapon" ? state.build.weapons : definition.category === "skill" ? state.build.skills : state.build.allies;
  const currentRank = bucket[id] || 0;
  const maxRank = MAX_REWARD_RANK[id] || 5;
  if (currentRank >= maxRank) return false;
  const ranksApplied = Math.max(1, Math.min(MAX_BATCH_REWARD_RANKS, requestedRanks, maxRank - currentRank));
  const finalRank = currentRank + ranksApplied;
  if (definition.category === "weapon") {
    state.build.weapons[id] = finalRank;
  } else if (definition.category === "skill") {
    for (let level = currentRank + 1; level <= finalRank; level += 1) {
      state.build.skills[id] = level;
      if (id === "damage") state.player.damageMultiplier *= 1.25;
      if (id === "fireRate") state.player.fireRateMultiplier *= 0.84;
      if (id === "multishot") state.player.multishot = Math.min(5, state.player.multishot + 1);
      if (id === "shield") {
        state.player.shieldMax += 40;
        state.player.shield = state.player.shieldMax;
      }
      if (id === "dash") state.player.dashMax = Math.max(0.82, 2.35 - level * 0.28);
      if (id === "regen") state.player.regen += 1.8;
    }
  } else {
    state.build.allies[id] = finalRank;
    syncAllies(state);
    triggerAllyRewardImpact(state, id, finalRank, ranksApplied);
  }
  state.lastChosenByCategory[definition.category] = id;
  if (finalRank === maxRank) {
    state.stats.skillsMastered += 1;
    state.flash = Math.max(state.flash, 0.6);
    state.shake = Math.max(state.shake, 12);
    emit(state, "skillMastered", { id, category: definition.category, name: definition.name });
    addText(state, `${definition.name} · MASTER`, state.player.x, state.player.y - 72, "#fff0a6", 1.25);
  }
  return true;
}

function applyBatchOverflowBonus(state, levels) {
  if (levels <= 0) return;
  const damageBoost = 1 + levels * 0.035;
  const hullBoost = levels * 8;
  state.player.damageMultiplier *= damageBoost;
  state.player.fireRateMultiplier *= Math.pow(0.99, levels);
  state.player.maxHp += hullBoost;
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + hullBoost);
  state.stats.batchedOverflowLevels += levels;
  emit(state, "batchLevelBonus", { levels, damageBoost, hullBoost });
  addText(state, `BATCH CORE ×${levels}`, state.player.x, state.player.y - 76, "#9efcff", 0.9);
}

export function chooseLevelReward(state, id) {
  if (!state?.levelupPending || !REWARD_DEFINITIONS[id]) return false;
  if (!state.rewardOptions.some((option) => option.id === id)) return false;
  const option = state.rewardOptions.find((candidate) => candidate.id === id);
  const rankGain = option?.rankGain || 1;
  const batchLevels = state.levelFlow?.batchLevels || 1;
  if (!applyReward(state, id, rankGain)) return false;
  const overflowLevels = Math.max(0, batchLevels - rankGain);
  applyBatchOverflowBonus(state, overflowLevels);
  state.levelupPending = false;
  state.rewardOptions = [];
  state.levelFlow.batchLevels = 0;
  state.levelFlow.lastChoiceAt = state.time;
  state.levelFlow.nextOfferAt = state.time + state.levelFlow.combatInterval;
  state.stats.rewardsChosen += 1;
  state.flash = Math.max(state.flash, 0.22);
  emit(state, "rewardChosen", { id, category: REWARD_DEFINITIONS[id].category, rankGain, batchLevels, overflowLevels });
  addText(state, REWARD_DEFINITIONS[id].name, state.player.x, state.player.y - 54, "#ffe371", 1.05);
  return true;
}

function startBossPhase(state) {
  state.phase = "boss";
  state.phaseTime = 0;
  state.phaseTransition = 0;
  state.boss.active = true;
  state.boss.patternCooldown = 1.45;
  state.player.hp = Math.min(state.player.maxHp, state.player.hp + state.player.maxHp * 0.4 * state.player.healingMultiplier);
  state.player.shield = state.player.shieldMax;
  state.enemyProjectiles.length = 0;
  state.projectiles.length = 0;
  state.pickups.length = 0;
  state.healthKits.length = 0;
  state.telegraphs.length = 0;
  state.airstrikes.length = 0;
  state.spawnPortals.length = 0;
  state.beams.length = 0;
  state.chains.length = 0;
  state.flash = 0.65;
  state.shake = 18;
  if (state.expedition) {
    state.expedition.distance = state.expedition.routeLength;
    state.expedition.progress = 1;
    state.expedition.reachedGate = true;
    state.expedition.gateLocked = false;
    state.expedition.gateUnlocked = true;
    state.expedition.awaitingBossEntry = false;
    state.expedition.autoBossEntry = false;
    state.expedition.bossEntryConfirmed = true;
    state.expedition.bossRoom = true;
    state.expedition.clearTransition = null;
    state.expedition.objective = `DESTROY ${state.boss.name}`;
    state.camera.zoom = 0.78;
    state.camera.x = state.player.x;
    state.camera.y = state.player.y;
    emit(state, "scenario", { beat: state.storyBeats.encounter, regionId: state.regionId });
  }
  if (!state.expedition) addText(state, state.boss.name, GAME_WIDTH * 0.5, 132, "#ff4b63", 1.65);
  emit(state, "bossIntro", { hp: state.boss.hp, patterns: state.boss.patterns, regionId: state.regionId });
}

export function enterBossRoom(state) {
  const expedition = state?.expedition;
  const allHostilesKilled = allRouteHostilesKilled(state);
  if (!expedition
    || state.status !== "running"
    || state.phase !== "swarm"
    || !allHostilesKilled
    || !expedition.reachedGate
    || !expedition.awaitingBossEntry) return false;

  expedition.awaitingBossEntry = false;
  expedition.bossEntryConfirmed = true;
  state.player.x = 820;
  state.player.y = WORLD_HEIGHT * 0.5;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.dashTimer = 0;
  state.player.invulnerability = Math.max(state.player.invulnerability, 2.2);
  state.boss.x = 1390;
  state.boss.y = WORLD_HEIGHT * 0.5;
  state.boss.vx = 0;
  state.boss.vy = 0;
  state.aim.x = state.boss.x;
  state.aim.y = state.boss.y;
  state.aimX = state.aim.x;
  state.aimY = state.aim.y;
  startBossPhase(state);
  return true;
}

function beginRouteClearTransition(state) {
  const expedition = state.expedition;
  if (!expedition || expedition.clearTransition) return;
  expedition.gateLocked = false;
  expedition.gateUnlocked = true;
  expedition.atLockedGate = false;
  expedition.objective = "적 전멸 · 보스 구역 전환 준비";
  expedition.clearTransition = {
    phase: "warning",
    timer: ROUTE_CLEAR_WARNING_DURATION,
    duration: ROUTE_CLEAR_WARNING_DURATION,
    progress: 0,
  };
  emit(state, "swarmCleared", { kills: state.killedEnemies });
  emit(state, "routeClearWarning", {
    duration: ROUTE_CLEAR_WARNING_DURATION,
    title: "적 전멸 확인",
    message: "SOVEREIGN 방어망이 붕괴합니다.",
    kills: state.killedEnemies,
    regionId: state.regionId,
  });
  addText(state, "구역 소거 완료", state.player.x, state.player.y - 86, "#72f2ff", 1.45);
}

function updateRouteClearTransition(state, dt) {
  const expedition = state.expedition;
  const transition = expedition?.clearTransition;
  if (!transition || transition.phase === "swap") return;
  transition.timer = Math.max(0, transition.timer - dt);
  transition.progress = clamp(1 - transition.timer / Math.max(0.001, transition.duration), 0, 1);
  if (transition.timer > 0) return;

  if (transition.phase === "warning") {
    expedition.clearTransition = {
      phase: "panic",
      timer: ROUTE_CLEAR_PANIC_DURATION,
      duration: ROUTE_CLEAR_PANIC_DURATION,
      progress: 0,
    };
    expedition.objective = "SOVEREIGN 신호 폭주 감지";
    emit(state, "routeClearPanic", {
      duration: ROUTE_CLEAR_PANIC_DURATION,
      beat: "sovereign-panic",
      title: "경고 · 적 지휘망 폭주",
      message: "보스 코어가 전장을 강제로 전환합니다.",
      regionId: state.regionId,
    });
    return;
  }

  if (state.levelupPending || state.levelFlow.queuedLevels > 0) return;
  expedition.clearTransition = { phase: "swap", timer: 0, duration: 0, progress: 1 };
  expedition.distance = expedition.routeLength;
  expedition.progress = 1;
  expedition.reachedGate = true;
  expedition.entryPrompted = true;
  expedition.awaitingBossEntry = true;
  expedition.autoBossEntry = true;
  expedition.objective = `${state.bossChamber} · 자동 진입`;
  emit(state, "bossAutoTransition", {
    autoEnter: true,
    regionId: state.regionId,
    bossName: state.boss.name,
    chamber: state.bossChamber,
    title: "보스 구역 강제 연결",
    message: "전장 좌표를 동기화합니다.",
  });
}

function updateSwarmSpawning(state, dt) {
  const wave = SURGE_WAVES[state.surgeIndex];
  const triggerReached = state.expedition
    ? finite(state.expedition.progress) >= finite(wave?.progressAt, 1)
    : state.time >= finite(wave?.warnAt, Infinity);
  if (wave && !state.surgeWarning && !state.activeSurge && state.surgeQueued <= 0 && triggerReached) {
    const startAt = state.expedition ? state.time + finite(wave.warningLead, 1.25) : wave.startAt;
    state.surgeWarning = {
      index: state.surgeIndex,
      label: wave.label,
      count: wave.count,
      startAt,
      startsIn: Math.max(0, startAt - state.time),
    };
    emit(state, "surgeWarning", {
      wave: state.surgeIndex + 1,
      label: wave.label,
      count: wave.count,
      startsIn: Math.max(0, startAt - state.time),
      progressAt: state.expedition ? wave.progressAt : null,
    });
  }
  if (wave && state.surgeWarning?.index === state.surgeIndex) {
    const startAt = finite(state.surgeWarning.startAt, wave.startAt);
    state.surgeWarning.startsIn = Math.max(0, startAt - state.time);
    if (state.time >= startAt) {
      state.surgeQueued += wave.count;
      state.activeSurge = { index: state.surgeIndex, label: wave.label, count: wave.count, remaining: state.surgeQueued, rate: wave.rate };
      state.surgeWarning = null;
      state.surgeIndex += 1;
      emit(state, "surgeStart", { wave: state.surgeIndex, label: wave.label, count: wave.count });
      state.shake = Math.max(state.shake, 7);
    }
  }

  if (state.surgeQueued > 0 && state.spawnedEnemies < state.enemyBudget) {
    const rate = state.activeSurge?.rate || 20;
    const pressureCap = getEnemyPressureCap(state);
    state.surgeSpawnAccumulator = Math.min(12, state.surgeSpawnAccumulator + dt * rate);
    let spawnedThisStep = 0;
    while (state.surgeSpawnAccumulator >= 1
      && spawnedThisStep < 5
      && state.enemies.length < pressureCap
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
    if (state.expedition) {
      beginRouteClearTransition(state);
      updateRouteClearTransition(state, dt);
      return;
    }
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

function createChargeGeometry(boss, player, originX, originY, targetX, targetY) {
  return {
    kind: "capsule",
    startX: originX,
    startY: originY,
    endX: targetX,
    endY: targetY,
    currentX: originX,
    currentY: originY,
    bodyRadius: boss.radius,
    collisionRadius: boss.radius + player.radius,
    length: Math.hypot(targetX - originX, targetY - originY),
    angle: Math.atan2(targetY - originY, targetX - originX),
  };
}

function openingWrongEngineChargeAssist(state) {
  return state.regionId === "wrong-engine-core" && state.boss.stage === 1;
}

function beginBossPattern(state) {
  const boss = state.boss;
  const arena = activeArena(state);
  const patterns = boss.patterns ?? BOSS_PATTERNS;
  const type = patterns[boss.patternIndex % patterns.length];
  boss.patternIndex += 1;
  const playerAngle = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);
  const warningScale = boss.stage === 3 ? 0.68 : boss.stage === 2 ? 0.82 : 1;
  let pattern;
  if (type === "radial") {
    pattern = { type, phase: "warning", x: boss.x, y: boss.y, angle: playerAngle, radius: 120, width: 12, life: 0.95 * warningScale, maxLife: 0.95 * warningScale, fired: false };
  } else if (type === "prismLattice" || type === "refractionSweep") {
    const centerX = clamp(state.player.x + state.player.vx * 0.24, arena.left + 80, arena.right - 80);
    const centerY = clamp(state.player.y + state.player.vy * 0.24, arena.top + 80, arena.bottom - 80);
    const range = state.expedition ? 1450 : 980;
    const beamHalfWidth = 22 + boss.stage * 3;
    const collisionHalfWidth = beamHalfWidth + state.player.radius;
    const sweep = type === "refractionSweep";
    const laneOffsets = sweep ? [-170, 0, 170] : [0, 0];
    const angles = sweep
      ? [playerAngle + Math.PI * 0.5, playerAngle + Math.PI * 0.5, playerAngle + Math.PI * 0.5]
      : [playerAngle, playerAngle + Math.PI * 0.5];
    const lanes = angles.map((angle, index) => {
      const offset = laneOffsets[index];
      const normalX = -Math.sin(angle) * offset;
      const normalY = Math.cos(angle) * offset;
      return {
        index,
        angle,
        startX: centerX + normalX - Math.cos(angle) * range,
        startY: centerY + normalY - Math.sin(angle) * range,
        endX: centerX + normalX + Math.cos(angle) * range,
        endY: centerY + normalY + Math.sin(angle) * range,
        beamHalfWidth,
        collisionHalfWidth,
      };
    });
    pattern = {
      type, phase: "warning", x: centerX, y: centerY, angle: playerAngle,
      radius: 96, width: beamHalfWidth, life: (sweep ? 1.08 : 0.98) * warningScale, maxLife: (sweep ? 1.08 : 0.98) * warningScale,
      fired: false, hit: false,
      geometry: {
        kind: type,
        centerX,
        centerY,
        laneCount: lanes.length,
        beamHalfWidth,
        collisionHalfWidth,
        lanes,
      },
    };
  } else if (type === "sweep") {
    const startAngle = playerAngle - 0.9;
    const radius = state.expedition ? 1450 : 980;
    const beamHalfWidth = 28 + boss.stage * 3;
    const dual = boss.stage >= 3;
    pattern = {
      type, phase: "warning", x: boss.x, y: boss.y, angle: startAngle,
      startAngle, endAngle: playerAngle + 1.05, radius, width: beamHalfWidth,
      life: 1.1 * warningScale, maxLife: 1.1 * warningScale,
      activeLife: Math.max(0.82, 1.32 - boss.stage * 0.14), dual, fired: false, hit: false,
      geometry: {
        kind: "sweep",
        originX: boss.x,
        originY: boss.y,
        radius,
        beamHalfWidth,
        collisionHalfWidth: beamHalfWidth + state.player.radius,
        angle: startAngle,
        primaryEndX: boss.x + Math.cos(startAngle) * radius,
        primaryEndY: boss.y + Math.sin(startAngle) * radius,
        secondary: dual,
        secondaryEndX: boss.x - Math.cos(startAngle) * radius,
        secondaryEndY: boss.y - Math.sin(startAngle) * radius,
      },
    };
  } else if (type === "solarFlare" || type === "mirrorShards" || type === "archiveEcho") {
    const centerX = clamp(state.player.x + state.player.vx * 0.3, arena.left + 90, arena.right - 90);
    const centerY = clamp(state.player.y + state.player.vy * 0.3, arena.top + 90, arena.bottom - 90);
    const mirror = type === "mirrorShards";
    const echo = type === "archiveEcho";
    const count = mirror ? 5 + boss.stage : echo ? 4 + boss.stage : 3 + boss.stage;
    const targetRadius = echo ? 76 + boss.stage * 5 : 68 + boss.stage * 6;
    const targets = Array.from({ length: count }, (_, index) => {
      const orbit = echo
        ? index * 112
        : index === 0 ? 0 : 145 + (index % 2) * 78;
      const angle = echo
        ? Math.atan2(-state.player.vy || -Math.sin(playerAngle), -state.player.vx || -Math.cos(playerAngle))
        : playerAngle + index * (TAU / Math.max(1, count - 1));
      return {
        x: clamp(centerX + Math.cos(angle) * orbit, arena.left + targetRadius, arena.right - targetRadius),
        y: clamp(centerY + Math.sin(angle) * orbit, arena.top + targetRadius, arena.bottom - targetRadius),
        radius: targetRadius,
        delay: index * (echo ? 0.18 : mirror ? 0.06 : 0.08),
        hit: false,
      };
    });
    pattern = {
      type, phase: "warning", x: centerX, y: centerY, angle: playerAngle,
      radius: targetRadius, width: 6, targets,
      life: 1.08 * warningScale, maxLife: 1.08 * warningScale, fired: false, hit: false,
      geometry: {
        kind: type,
        centerX,
        centerY,
        targetCount: targets.length,
        targets,
      },
    };
  } else if (type === "bombs") {
    const targets = [];
    const count = 4 + boss.stage * 2;
    for (let index = 0; index < count; index += 1) {
      const lead = index * 0.12;
      targets.push({
        x: clamp(state.player.x + state.player.vx * lead + (state.random() - 0.5) * 210, arena.left + 50, arena.right - 50),
        y: clamp(state.player.y + state.player.vy * lead + (state.random() - 0.5) * 170, arena.top + 50, arena.bottom - 50),
        radius: 58 + boss.stage * 5,
        hit: false,
      });
    }
    pattern = { type, phase: "warning", x: boss.x, y: boss.y, angle: playerAngle, radius: 65, width: 5, targets, life: 1.15 * warningScale, maxLife: 1.15 * warningScale, fired: false };
  } else if (type === "memorySpiral") {
    const armCount = 2 + boss.stage;
    const innerRadius = boss.radius * 0.72;
    const outerRadius = state.expedition ? 1320 : 880;
    const beamHalfWidth = 18 + boss.stage * 3;
    const collisionHalfWidth = beamHalfWidth + state.player.radius;
    const baseAngle = playerAngle;
    const rotations = 0.72 + boss.stage * 0.12;
    const segments = Array.from({ length: armCount }, (_, index) => {
      const angle = baseAngle + index * TAU / armCount;
      return {
        index,
        angle,
        startX: boss.x + Math.cos(angle) * innerRadius,
        startY: boss.y + Math.sin(angle) * innerRadius,
        endX: boss.x + Math.cos(angle) * outerRadius,
        endY: boss.y + Math.sin(angle) * outerRadius,
        collisionHalfWidth,
      };
    });
    pattern = {
      type, phase: "warning", x: boss.x, y: boss.y, angle: baseAngle,
      radius: outerRadius, width: beamHalfWidth,
      life: 1.02 * warningScale, maxLife: 1.02 * warningScale,
      activeLife: Math.max(1.05, 1.62 - boss.stage * 0.12), fired: false, hit: false,
      geometry: {
        kind: "memorySpiral",
        centerX: boss.x,
        centerY: boss.y,
        armCount,
        innerRadius,
        outerRadius,
        beamHalfWidth,
        collisionHalfWidth,
        baseAngle,
        rotations,
        segments,
      },
    };
  } else if (type === "depthCollapse" || type === "undertow") {
    const undertow = type === "undertow";
    const ringCount = 3 + boss.stage;
    const bandHalfWidth = 17 + boss.stage * 2;
    const collisionHalfWidth = bandHalfWidth + state.player.radius;
    const outerRadius = state.expedition ? 940 : 550;
    const spacing = state.expedition ? 180 : 130;
    const endRadius = boss.radius * 0.62;
    const startRadii = Array.from({ length: ringCount }, (_, index) => outerRadius + index * spacing);
    pattern = {
      type, phase: "warning", x: boss.x, y: boss.y, angle: 0,
      radius: outerRadius, width: bandHalfWidth,
      life: 1.08 * warningScale, maxLife: 1.08 * warningScale,
      activeLife: Math.max(1.35, (undertow ? 2.35 : 2.05) - boss.stage * 0.13), fired: false,
      geometry: {
        kind: type,
        centerX: boss.x,
        centerY: boss.y,
        ringCount,
        bandHalfWidth,
        collisionHalfWidth,
        startRadii,
        radii: [...startRadii],
        endRadius,
        maxTravel: startRadii[startRadii.length - 1] - endRadius,
        pullStrength: undertow ? 250 + boss.stage * 55 : 0,
      },
    };
  } else if (type === "rings") {
    const rings = 2 + boss.stage * 2;
    const bandHalfWidth = 15 + boss.stage * 2;
    const startRadius = 76;
    const spacing = state.expedition ? 190 : 150;
    pattern = {
      type, phase: "warning", x: boss.x, y: boss.y, angle: 0, radius: startRadius,
      width: bandHalfWidth, life: 1.05 * warningScale, maxLife: 1.05 * warningScale,
      rings, fired: false,
      geometry: {
        kind: "rings",
        centerX: boss.x,
        centerY: boss.y,
        ringCount: rings,
        bandHalfWidth,
        collisionHalfWidth: bandHalfWidth + state.player.radius,
        startRadius,
        spacing,
        maxTravel: state.expedition ? 1250 : 830,
        radii: Array.from({ length: rings }, (_, index) => startRadius - index * spacing),
      },
    };
  } else {
    const multi = type === "multiCharge";
    const openingAssist = openingWrongEngineChargeAssist(state);
    const direction = normalize(state.player.x - boss.x, state.player.y - boss.y);
    const boundary = rayToEllipseBoundary(activeBossFloor(state), boss.x, boss.y, direction, boss.radius * 0.72);
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
      width: boss.radius,
      life: (openingAssist ? multi ? 0.92 : 1.05 : multi ? 0.66 : 0.72) * warningScale,
      maxLife: (openingAssist ? multi ? 0.92 : 1.05 : multi ? 0.66 : 0.72) * warningScale,
      activeLife: openingAssist ? multi ? 0.46 : 0.68 : multi ? 0.34 : 0.52,
      openingAssist,
      chargeCount: multi ? 2 + boss.stage : 1,
      chargeIndex: 1,
      fired: false,
      hit: false,
      reachedBoundary: false,
      geometry: createChargeGeometry(boss, state.player, boss.x, boss.y, boundary.x, boundary.y),
    };
  }
  boss.activePattern = pattern;
  boss.attackState = `windup:${type}`;
  boss.attackTimer = pattern.maxLife;
  boss.animationState = "windup";
  boss.animationTimer = pattern.maxLife;
  state.telegraphs.push(pattern);
  emit(state, "bossPatternTelegraph", { pattern: type, duration: pattern.maxLife });
}

function bossParryFrequency(boss) {
  const hpRatio = boss.maxHp > 0 ? boss.hp / boss.maxHp : 0;
  if (hpRatio <= 0.38) return 1;
  if (hpRatio <= 0.7) return 2;
  return 3;
}

function beginBossParryWindow(state, pattern) {
  const boss = state.boss;
  if (!BOSS_PARRY_ELIGIBLE.has(pattern.type) || pattern.parryOffered) return false;
  const hpRatio = boss.maxHp > 0 ? boss.hp / boss.maxHp : 1;
  if (hpRatio > 0.85) return false;
  boss.parryEligibleCount += 1;
  const frequency = bossParryFrequency(boss);
  if ((boss.parryEligibleCount - 1) % frequency !== 0) return false;
  pattern.parryOffered = true;
  pattern.phase = "parry";
  pattern.life = BOSS_PARRY_WINDOW;
  pattern.maxLife = BOSS_PARRY_WINDOW;
  boss.parryWindow = {
    pattern: pattern.type,
    life: BOSS_PARRY_WINDOW,
    duration: BOSS_PARRY_WINDOW,
    progress: 0,
    key: "Shift",
  };
  boss.attackState = `parry:${pattern.type}`;
  boss.attackTimer = BOSS_PARRY_WINDOW;
  state.flash = Math.max(state.flash, 0.28);
  state.shake = Math.max(state.shake, 5);
  emit(state, "bossParryWindow", {
    pattern: pattern.type,
    duration: BOSS_PARRY_WINDOW,
    key: "Shift",
    slowScale: BOSS_PARRY_SLOW_SCALE,
  });
  return true;
}

function resolveBossParry(state, success) {
  const boss = state.boss;
  const window = boss.parryWindow;
  if (!window) return false;
  const pattern = boss.activePattern;
  boss.parryWindow = null;
  boss.activePattern = null;
  boss.vx = 0;
  boss.vy = 0;
  state.telegraphs.length = 0;
  if (success) {
    const duration = 1.8;
    boss.weakness = Math.max(boss.weakness, duration);
    boss.damageMultiplier = 2;
    boss.patternCooldown = duration + 0.35;
    boss.hitStun = Math.max(boss.hitStun, duration);
    boss.animationState = "stagger";
    boss.animationTimer = duration;
    boss.attackState = "parried";
    boss.attackTimer = duration;
    state.enemyProjectiles.length = 0;
    state.stats.bossParries += 1;
    state.flash = Math.max(state.flash, 0.82);
    state.shake = Math.max(state.shake, 22);
    burst(state, state.player.x, state.player.y, "#d8ffff", 38, 410, 0.72, 8);
    burst(state, boss.x, boss.y, "#76f6ff", 42, 360, 0.8, 8);
    state.shockwaves.push({
      type: "bossParry",
      x: state.player.x,
      y: state.player.y,
      maxRadius: 520,
      life: 0.62,
      maxLife: 0.62,
      color: "#d7ffff",
      width: 18,
    });
    addText(state, "패링 성공 · 공격 반사", state.player.x, state.player.y - 82, "#e8ffff", 1.25);
    emit(state, "bossParrySuccess", { pattern: window.pattern, duration, multiplier: 2 });
    return true;
  }

  state.stats.bossParryFailures += 1;
  const damage = Math.max(132, state.player.maxHp * (0.3 + boss.stage * 0.03));
  damagePlayer(state, damage, `bossParryFail:${window.pattern}`, {
    unavoidable: true,
    critical: true,
    stun: 0.65,
    hitStun: 0.65,
    invulnerability: 0.9,
  });
  boss.patternCooldown = 1.05;
  state.flash = Math.max(state.flash, 0.62);
  state.shake = Math.max(state.shake, 24);
  burst(state, state.player.x, state.player.y, "#ff4e68", 34, 390, 0.74, 8);
  emit(state, "bossParryFailed", { pattern: window.pattern, damage });
  if (pattern) pattern.life = 0;
  return true;
}

function updateBossParryWindow(state, input, dt) {
  const window = state.boss.parryWindow;
  if (!window) return 1;
  if (input?.parryPressed) {
    resolveBossParry(state, true);
    return 1;
  }
  window.life = Math.max(0, window.life - dt);
  window.progress = clamp(1 - window.life / Math.max(0.001, window.duration), 0, 1);
  if (state.boss.activePattern) state.boss.activePattern.life = window.life;
  if (window.life <= 0) {
    resolveBossParry(state, false);
    return 1;
  }
  return BOSS_PARRY_SLOW_SCALE;
}

function fireBossPattern(state, pattern) {
  const boss = state.boss;
  if (beginBossParryWindow(state, pattern)) return;
  pattern.fired = true;
  boss.attackState = `attack:${pattern.type}`;
  boss.attackTimer = Math.max(0.22, pattern.activeLife || 0.28);
  boss.animationState = "attack";
  boss.animationTimer = boss.attackTimer;
  boss.recoil = pattern.type === "charge" || pattern.type === "multiCharge" ? 1.25 : 1;
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
  } else if (pattern.type === "prismLattice" || pattern.type === "refractionSweep") {
    const hitLane = pattern.geometry.lanes.find((lane) => (
      pointLineDistance(
        state.player.x,
        state.player.y,
        lane.startX,
        lane.startY,
        lane.endX,
        lane.endY,
      ) <= lane.collisionHalfWidth
    ));
    if (hitLane && damagePlayer(state, 30 + boss.stage * 6, pattern.type === "refractionSweep" ? "bossRefractionSweep" : "bossPrismLattice")) {
      pattern.hit = true;
      state.stats.bossPatternsHit += 1;
    } else {
      state.stats.bossPatternsDodged += 1;
    }
    for (const lane of pattern.geometry.lanes) {
      burst(state, (lane.startX + lane.endX) * 0.5, (lane.startY + lane.endY) * 0.5, "#8df8ff", 18, 270, 0.52, 6);
    }
    boss.activePattern = null;
  } else if (pattern.type === "sweep") {
    pattern.phase = "active";
    pattern.life = pattern.activeLife;
    pattern.maxLife = pattern.activeLife;
    pattern.angle = pattern.startAngle;
  } else if (pattern.type === "solarFlare" || pattern.type === "mirrorShards" || pattern.type === "archiveEcho") {
    pattern.phase = "active";
    pattern.elapsed = 0;
    pattern.nextTarget = 0;
    pattern.life = pattern.targets[pattern.targets.length - 1].delay + 0.12;
    pattern.maxLife = pattern.life;
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
  } else if (pattern.type === "memorySpiral") {
    pattern.phase = "active";
    pattern.life = pattern.activeLife;
    pattern.maxLife = pattern.activeLife;
    pattern.hit = false;
  } else if (pattern.type === "depthCollapse" || pattern.type === "undertow") {
    pattern.phase = "active";
    pattern.life = pattern.activeLife;
    pattern.maxLife = pattern.activeLife;
    pattern.hitRings = new Set();
  } else if (pattern.type === "rings") {
    pattern.phase = "active";
    pattern.life = Math.max(1.42, 2.38 - boss.stage * 0.28);
    pattern.maxLife = pattern.life;
    pattern.startRadius = pattern.geometry.startRadius;
    pattern.radius = pattern.geometry.startRadius;
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
  const boundary = rayToEllipseBoundary(activeBossFloor(state), boss.x, boss.y, direction, boss.radius * 0.72);
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
  pattern.width = boss.radius;
  const openingAssist = openingWrongEngineChargeAssist(state);
  pattern.life = openingAssist ? 0.46 : 0.32;
  pattern.maxLife = pattern.life;
  pattern.activeLife = openingAssist ? 0.46 : 0.34;
  pattern.openingAssist = openingAssist;
  pattern.fired = false;
  pattern.hit = false;
  pattern.geometry = createChargeGeometry(boss, state.player, boss.x, boss.y, boundary.x, boundary.y);
  boss.attackState = "windup:multiCharge";
  boss.attackTimer = pattern.maxLife;
  boss.animationState = "windup";
  boss.animationTimer = pattern.maxLife;
  emit(state, "bossPatternTelegraph", {
    pattern: "multiCharge",
    duration: pattern.maxLife,
    charge: pattern.chargeIndex,
    total: pattern.chargeCount,
  });
}

function exposeBossCore(state, pattern) {
  const boss = state.boss;
  const groggy = state.regionId === "wrong-engine-core";
  const duration = groggy ? WRONG_ENGINE_GROGGY_DURATION : 3;
  const multiplier = groggy ? WRONG_ENGINE_GROGGY_MULTIPLIER : 2;
  boss.x = pattern.targetX;
  boss.y = pattern.targetY;
  boss.vx = 0;
  boss.vy = 0;
  boss.weakness = duration;
  boss.groggy = groggy ? duration : 0;
  boss.groggyDuration = groggy ? duration : 0;
  boss.groggyMultiplier = groggy ? multiplier : 1;
  boss.damageMultiplier = multiplier;
  boss.patternCooldown = duration;
  if (groggy) {
    boss.hitStun = Math.max(boss.hitStun, duration);
    boss.animationState = "stagger";
    boss.animationTimer = duration;
    boss.attackState = "groggy";
    boss.attackTimer = duration;
  }
  pattern.reachedBoundary = true;
  pattern.life = 0;
  boss.activePattern = null;
  state.stats.bossPatternsDodged += 1;
  state.shake = Math.max(state.shake, 18);
  state.flash = Math.max(state.flash, 0.32);
  burst(state, boss.x, boss.y, "#ffe06b", 34, 310, 0.85, 7);
  state.shockwaves.push({
    type: groggy ? "bossGroggy" : "bossWeakness",
    x: boss.x,
    y: boss.y,
    maxRadius: groggy ? 310 : 260,
    life: 0.72,
    maxLife: 0.72,
    color: "#ffe06b",
    width: groggy ? 13 : 9,
  });
  addText(state, groggy ? "벽 충돌 · 그로기 ×2.5" : "CORE EXPOSED ×2", boss.x, boss.y - 92, "#ffe371", 1.3);
  if (groggy) {
    emit(state, "bossGroggy", {
      duration,
      multiplier,
      reason: "wallImpact",
      telegraph: "stagger",
      title: "보스 그로기",
      message: "벽 충돌로 코어가 노출되었습니다.",
    });
  }
  emit(state, "bossWeakness", { duration, multiplier, reason: groggy ? "wallImpact" : "coreExposure" });
}

function updateBossPattern(state, dt) {
  const boss = state.boss;
  let pattern = boss.activePattern;
  if (!pattern) {
    boss.patternCooldown -= dt;
    if (boss.patternCooldown <= 0) beginBossPattern(state);
    return;
  }
  if (pattern.phase === "parry") return;
  pattern.life -= dt;
  if (pattern.phase === "warning") {
    if (pattern.life <= 0) fireBossPattern(state, pattern);
    return;
  }
  if (pattern.type === "solarFlare" || pattern.type === "mirrorShards" || pattern.type === "archiveEcho") {
    pattern.elapsed += dt;
    while (pattern.nextTarget < pattern.targets.length
      && pattern.targets[pattern.nextTarget].delay <= pattern.elapsed) {
      const target = pattern.targets[pattern.nextTarget];
      target.detonated = true;
      if (Math.hypot(state.player.x - target.x, state.player.y - target.y) <= target.radius + state.player.radius) {
        const source = pattern.type === "mirrorShards"
          ? "bossMirrorShards"
          : pattern.type === "archiveEcho" ? "bossArchiveEcho" : "bossSolarFlare";
        if (damagePlayer(state, 24 + boss.stage * 5, source)) {
          target.hit = true;
          pattern.hit = true;
          state.stats.bossPatternsHit += 1;
        }
      }
      burst(state, target.x, target.y, "#ffd86a", 18, 280, 0.58, 7);
      pattern.nextTarget += 1;
    }
    if (pattern.life <= 0) {
      if (!pattern.hit) state.stats.bossPatternsDodged += 1;
      boss.activePattern = null;
    }
  } else if (pattern.type === "memorySpiral") {
    const progress = clamp(1 - pattern.life / pattern.maxLife, 0, 1);
    const geometry = pattern.geometry;
    geometry.centerX = boss.x;
    geometry.centerY = boss.y;
    pattern.x = boss.x;
    pattern.y = boss.y;
    pattern.angle = geometry.baseAngle + progress * TAU * geometry.rotations;
    for (const segment of geometry.segments) {
      const angle = pattern.angle + segment.index * TAU / geometry.armCount;
      segment.angle = angle;
      segment.startX = boss.x + Math.cos(angle) * geometry.innerRadius;
      segment.startY = boss.y + Math.sin(angle) * geometry.innerRadius;
      segment.endX = boss.x + Math.cos(angle) * geometry.outerRadius;
      segment.endY = boss.y + Math.sin(angle) * geometry.outerRadius;
    }
    if (!pattern.hit && geometry.segments.some((segment) => (
      pointLineDistance(
        state.player.x,
        state.player.y,
        segment.startX,
        segment.startY,
        segment.endX,
        segment.endY,
      ) <= segment.collisionHalfWidth
    ))) {
      if (damagePlayer(state, 22 + boss.stage * 5, "bossMemorySpiral")) {
        pattern.hit = true;
        state.stats.bossPatternsHit += 1;
      }
    }
    if (pattern.life <= 0) {
      if (!pattern.hit) state.stats.bossPatternsDodged += 1;
      boss.activePattern = null;
    }
  } else if (pattern.type === "depthCollapse" || pattern.type === "undertow") {
    const progress = clamp(1 - pattern.life / pattern.maxLife, 0, 1);
    const geometry = pattern.geometry;
    geometry.centerX = boss.x;
    geometry.centerY = boss.y;
    pattern.x = boss.x;
    pattern.y = boss.y;
    const playerDistance = Math.hypot(state.player.x - boss.x, state.player.y - boss.y);
    if (pattern.type === "undertow" && playerDistance > boss.radius * 0.75) {
      const pull = normalize(boss.x - state.player.x, boss.y - state.player.y);
      const pullStrength = finite(geometry.pullStrength, 300) * (0.35 + progress * 0.65);
      state.player.x += pull.x * pullStrength * dt;
      state.player.y += pull.y * pullStrength * dt;
      clampPlayerToFloor(state.player, state.expedition);
    }
    for (let ring = 0; ring < geometry.ringCount; ring += 1) {
      const radius = geometry.startRadii[ring]
        + (geometry.endRadius - geometry.startRadii[ring]) * progress;
      geometry.radii[ring] = radius;
      if (pattern.hitRings.has(ring)) continue;
      if (Math.abs(playerDistance - radius) <= geometry.collisionHalfWidth) {
        if (damagePlayer(state, 18 + boss.stage * 4, pattern.type === "undertow" ? "bossUndertow" : "bossDepthCollapse")) {
          pattern.hitRings.add(ring);
          state.stats.bossPatternsHit += 1;
        }
      }
    }
    if (pattern.life <= 0) {
      if (pattern.hitRings.size === 0) state.stats.bossPatternsDodged += 1;
      boss.activePattern = null;
    }
  } else if (pattern.type === "sweep") {
    const progress = 1 - pattern.life / pattern.maxLife;
    pattern.angle = pattern.startAngle + (pattern.endAngle - pattern.startAngle) * progress;
    const endX = boss.x + Math.cos(pattern.angle) * pattern.radius;
    const endY = boss.y + Math.sin(pattern.angle) * pattern.radius;
    pattern.geometry.originX = boss.x;
    pattern.geometry.originY = boss.y;
    pattern.geometry.angle = pattern.angle;
    pattern.geometry.primaryEndX = endX;
    pattern.geometry.primaryEndY = endY;
    const hitPrimary = pointLineDistance(state.player.x, state.player.y, boss.x, boss.y, endX, endY) <= pattern.geometry.collisionHalfWidth;
    const oppositeX = boss.x - Math.cos(pattern.angle) * pattern.radius;
    const oppositeY = boss.y - Math.sin(pattern.angle) * pattern.radius;
    pattern.geometry.secondaryEndX = oppositeX;
    pattern.geometry.secondaryEndY = oppositeY;
    const hitSecondary = pattern.dual && pointLineDistance(state.player.x, state.player.y, boss.x, boss.y, oppositeX, oppositeY) <= pattern.geometry.collisionHalfWidth;
    if (!pattern.hit && (hitPrimary || hitSecondary)) {
      if (damagePlayer(state, 24 + boss.stage * 4, "bossSweep")) pattern.hit = true;
    }
    if (pattern.life <= 0) {
      if (!pattern.hit) state.stats.bossPatternsDodged += 1;
      boss.activePattern = null;
    }
  } else if (pattern.type === "rings") {
    const progress = 1 - pattern.life / pattern.maxLife;
    const maxRadius = pattern.geometry.maxTravel;
    const spacing = pattern.geometry.spacing;
    pattern.geometry.centerX = boss.x;
    pattern.geometry.centerY = boss.y;
    pattern.x = boss.x;
    pattern.y = boss.y;
    pattern.radius = pattern.startRadius + progress * maxRadius;
    for (let ring = 0; ring < pattern.rings; ring += 1) {
      const ringRadius = pattern.radius - ring * spacing;
      pattern.geometry.radii[ring] = ringRadius;
      if (ringRadius < 0 || pattern.hitRings.has(ring)) continue;
      const distance = Math.hypot(state.player.x - boss.x, state.player.y - boss.y);
      if (Math.abs(distance - ringRadius) < pattern.geometry.collisionHalfWidth) {
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
      pattern.geometry.currentX = boss.x;
      pattern.geometry.currentY = boss.y;
      if (pointLineDistance(state.player.x, state.player.y, previousX, previousY, boss.x, boss.y) <= pattern.geometry.collisionRadius) {
        const chargeDamage = openingWrongEngineChargeAssist(state)
          ? Math.max(82, state.player.maxHp * 0.27) + 6
          : Math.max(108, state.player.maxHp * 0.36) + boss.stage * 8;
        if (damagePlayer(state, chargeDamage, "bossCharge", {
          critical: true,
          stun: BOSS_CONTACT_STUN,
          invulnerability: 0.9,
          hitStun: BOSS_CONTACT_STUN,
        })) {
          pattern.hit = true;
          pattern.life = 0;
          boss.vx = 0;
          boss.vy = 0;
          boss.activePattern = null;
          boss.patternCooldown = 1.35;
          state.stats.bossPatternsHit += 1;
          state.shake = Math.max(state.shake, 20);
          emit(state, "bossChargeHit", { damage: chargeDamage, stun: BOSS_CONTACT_STUN });
        }
      }
    }
  }
  if (!boss.activePattern && boss.patternCooldown <= 0) boss.patternCooldown = Math.max(0.48, 1.92 - boss.stage * 0.4);
}

function startBossBombSequence(state, tier) {
  const boss = state.boss;
  const arena = activeArena(state);
  const count = BOSS_BOMB_COUNTS[tier];
  const padding = 92;
  const centerX = clamp((state.player.x + boss.x) * 0.5, arena.left + 420, arena.right - 420);
  const centerY = clamp((state.player.y + boss.y) * 0.5, arena.top + 270, arena.bottom - 270);
  // Keep the complete numbered set inside the initial expanded boss camera.
  // The player still has to move between bombs, but never has to guess at an
  // off-screen order marker while the timer is running.
  const spreadX = Math.min(400, (arena.right - arena.left) * 0.28);
  const spreadY = Math.min(250, (arena.bottom - arena.top) * 0.27);
  const regionOffset = state.regionId === "glass-dune" ? 0.48 : state.regionId === "abyssal-archive" ? 0.94 : 0;
  const bombs = Array.from({ length: count }, (_, index) => {
    const angle = regionOffset + tier * 0.37 + index * TAU / count;
    const radial = index % 2 === 0 ? 1 : 0.72;
    return {
      id: ++state.nextEntityId,
      order: index + 1,
      x: clamp(centerX + Math.cos(angle) * spreadX * radial, arena.left + padding, arena.right - padding),
      y: clamp(centerY + Math.sin(angle) * spreadY * radial, arena.top + padding, arena.bottom - padding),
      radius: 66,
      state: "priming",
      defused: false,
      exploded: false,
    };
  });
  boss.bombSequenceTier = tier + 1;
  boss.bombSequence = {
    tier: tier + 1,
    phase: "siren",
    count,
    expectedOrder: 1,
    timer: BOSS_BOMB_SIREN_DURATION,
    duration: BOSS_BOMB_SIREN_DURATION,
    progress: 0,
    bombs,
  };
  boss.siren = {
    active: true,
    tier: tier + 1,
    intensity: 0.72 + tier * 0.14,
    timer: BOSS_BOMB_SIREN_DURATION,
  };
  boss.activePattern = null;
  boss.vx = 0;
  boss.vy = 0;
  state.telegraphs.length = 0;
  state.enemyProjectiles.length = 0;
  state.flash = Math.max(state.flash, 0.58);
  state.shake = Math.max(state.shake, 15);
  emit(state, "bossSiren", {
    tier: tier + 1,
    count,
    duration: BOSS_BOMB_SIREN_DURATION,
    title: "전역 폭발 경보",
    message: `시한폭탄 ${count}개를 숫자 순서대로 해제하세요.`,
  });
}

function explodeBossBombSequence(state, reason) {
  const boss = state.boss;
  const sequence = boss.bombSequence;
  if (!sequence) return false;
  for (const bomb of sequence.bombs) {
    if (bomb.defused) continue;
    bomb.exploded = true;
    bomb.state = "exploded";
    burst(state, bomb.x, bomb.y, "#ff7452", 24, 360, 0.82, 8);
    state.bossBombBursts.push({
      id: bomb.id,
      x: bomb.x,
      y: bomb.y,
      life: 0.72,
      maxLife: 0.72,
      radius: 210,
    });
    state.shockwaves.push({
      type: "bossTimedBomb",
      x: bomb.x,
      y: bomb.y,
      maxRadius: 250,
      life: 0.68,
      maxLife: 0.68,
      color: "#ff674c",
      width: 14,
    });
  }
  const damage = Math.max(150, state.player.maxHp * (0.32 + sequence.count * 0.018));
  damagePlayer(state, damage, `bossTimedBomb:${reason}`, {
    unavoidable: true,
    critical: true,
    stun: 0.85,
    hitStun: 0.85,
    invulnerability: 1,
  });
  state.stats.bossBombFailures += 1;
  boss.bombSequence = null;
  boss.siren = null;
  boss.patternCooldown = 1.35;
  state.flash = Math.max(state.flash, 0.88);
  state.shake = Math.max(state.shake, 30);
  emit(state, "bossBombSequenceFailed", { reason, count: sequence.count, damage });
  return true;
}

function completeBossBombSequence(state, sequence) {
  const boss = state.boss;
  const duration = 2.4;
  boss.bombSequence = null;
  boss.siren = null;
  boss.weakness = Math.max(boss.weakness, duration);
  boss.damageMultiplier = 2;
  boss.patternCooldown = duration + 0.4;
  boss.hitStun = Math.max(boss.hitStun, duration);
  boss.animationState = "stagger";
  boss.animationTimer = duration;
  boss.attackState = "bombs-defused";
  boss.attackTimer = duration;
  state.flash = Math.max(state.flash, 0.68);
  state.shake = Math.max(state.shake, 18);
  burst(state, boss.x, boss.y, "#82ffca", 38, 320, 0.78, 7);
  state.shockwaves.push({
    type: "bossBombDefused",
    x: boss.x,
    y: boss.y,
    maxRadius: 390,
    life: 0.7,
    maxLife: 0.7,
    color: "#72f4c2",
    width: 13,
  });
  addText(state, "폭탄 해제 완료 · 보스 회로 정지", boss.x, boss.y - 104, "#8dffd0", 1.25);
  emit(state, "bossBombSequenceCleared", { tier: sequence.tier, count: sequence.count, duration });
}

function updateBossBombSequence(state, input, dt) {
  const boss = state.boss;
  let sequence = boss.bombSequence;
  if (!sequence
    && !boss.dead
    && !boss.parryWindow
    && boss.transformTimer <= 0
    && boss.bombSequenceTier < BOSS_BOMB_THRESHOLDS.length) {
    const hpRatio = boss.maxHp > 0 ? boss.hp / boss.maxHp : 0;
    const tier = boss.bombSequenceTier;
    if (hpRatio <= BOSS_BOMB_THRESHOLDS[tier]) {
      startBossBombSequence(state, tier);
      sequence = boss.bombSequence;
    }
  }
  if (!sequence) return false;

  sequence.timer = Math.max(0, sequence.timer - dt);
  sequence.progress = clamp(1 - sequence.timer / Math.max(0.001, sequence.duration), 0, 1);
  if (boss.siren) boss.siren.timer = sequence.timer;
  if (sequence.phase === "siren") {
    if (sequence.timer <= 0) {
      sequence.phase = "armed";
      const activeDuration = BOSS_BOMB_ACTIVE_DURATIONS[Math.max(0, sequence.tier - 1)]
        ?? BOSS_BOMB_ACTIVE_DURATIONS[0];
      sequence.timer = activeDuration;
      sequence.duration = activeDuration;
      sequence.progress = 0;
      for (const bomb of sequence.bombs) bomb.state = "armed";
      emit(state, "bossBombSequenceArmed", {
        tier: sequence.tier,
        count: sequence.count,
        duration: sequence.duration,
        expectedOrder: 1,
      });
    }
    return true;
  }

  const clickX = finite(input?.bossMechanicClickX, NaN);
  const clickY = finite(input?.bossMechanicClickY, NaN);
  if (Number.isFinite(clickX) && Number.isFinite(clickY)) {
    let clicked = null;
    let closest = Infinity;
    for (const bomb of sequence.bombs) {
      if (bomb.defused || bomb.exploded) continue;
      const distance = Math.hypot(clickX - bomb.x, clickY - bomb.y);
      if (distance <= bomb.radius + 22 && distance < closest) {
        clicked = bomb;
        closest = distance;
      }
    }
    if (clicked) {
      if (clicked.order !== sequence.expectedOrder) {
        explodeBossBombSequence(state, "wrongOrder");
        return true;
      }
      clicked.defused = true;
      clicked.state = "defused";
      sequence.expectedOrder += 1;
      state.stats.bossBombsDefused += 1;
      burst(state, clicked.x, clicked.y, "#72f4c2", 18, 220, 0.48, 5);
      emit(state, "bossBombDefused", {
        tier: sequence.tier,
        order: clicked.order,
        x: clicked.x,
        y: clicked.y,
        remaining: sequence.count - clicked.order,
        nextOrder: sequence.expectedOrder <= sequence.count ? sequence.expectedOrder : null,
      });
      if (sequence.expectedOrder > sequence.count) {
        completeBossBombSequence(state, sequence);
        return true;
      }
    }
  }
  if (sequence.timer <= 0) explodeBossBombSequence(state, "timeout");
  return true;
}

function updateBoss(state, dt, input) {
  const boss = state.boss;
  boss.hitFlash = Math.max(0, boss.hitFlash - dt);
  boss.hitStun = Math.max(0, boss.hitStun - dt);
  boss.recoil = Math.max(0, boss.recoil - dt * 5.5);
  boss.attackTimer = Math.max(0, boss.attackTimer - dt);
  boss.animationTimer = Math.max(0, boss.animationTimer - dt);
  boss.contactCooldown = Math.max(0, boss.contactCooldown - dt);
  boss.orbitHitCooldown = Math.max(0, boss.orbitHitCooldown - dt);
  boss.weakness = Math.max(0, boss.weakness - dt);
  boss.groggy = Math.max(0, boss.groggy - dt);
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
  boss.damageMultiplier = boss.groggy > 0
    ? boss.groggyMultiplier
    : boss.weakness > 0 ? 2 : 1;
  const bombMechanicActive = updateBossBombSequence(state, input, dt);
  if (bombMechanicActive) {
    boss.vx = 0;
    boss.vy = 0;
    boss.angle = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);
    boss.animationState = boss.bombSequence?.phase === "siren" ? "windup" : "attack";
    boss.attackState = boss.bombSequence?.phase === "siren" ? "bomb-siren" : "timed-bombs";
    boss.moveBlend += (0 - boss.moveBlend) * (1 - Math.exp(-dt * 8));
    return;
  }
  const charging = (boss.activePattern?.type === "charge" || boss.activePattern?.type === "multiCharge")
    && boss.activePattern?.phase === "active";
  const warning = boss.activePattern?.phase === "warning";
  if (!charging && !warning && boss.weakness <= 0 && boss.transformTimer <= 0) {
    const arena = activeArena(state);
    const desiredX = (state.expedition ? WORLD_WIDTH : GAME_WIDTH) * 0.76
      + Math.sin(state.phaseTime * 0.43) * (state.expedition ? 190 : 125);
    const desiredY = (state.expedition ? WORLD_HEIGHT : GAME_HEIGHT) * 0.5
      + Math.sin(state.phaseTime * 0.71) * (state.expedition ? 265 : 190);
    boss.vx = (desiredX - boss.x) * 0.65;
    boss.vy = (desiredY - boss.y) * 0.65;
    boss.x = clamp(boss.x + boss.vx * dt, arena.left + boss.radius, arena.right - boss.radius);
    boss.y = clamp(boss.y + boss.vy * dt, arena.top + boss.radius, arena.bottom - boss.radius);
  } else if (warning || boss.weakness > 0) {
    boss.vx = 0;
    boss.vy = 0;
  }
  boss.angle = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);
  if (!charging
    && Math.hypot(state.player.x - boss.x, state.player.y - boss.y) <= state.player.radius + boss.radius
    && boss.contactCooldown <= 0) {
    const direction = normalize(state.player.x - boss.x, state.player.y - boss.y, Math.cos(boss.angle), Math.sin(boss.angle));
    const contactDamage = Math.max(150, state.player.maxHp * 0.44);
    if (damagePlayer(state, contactDamage, "bossContact", {
      critical: true,
      stun: BOSS_CONTACT_STUN,
      invulnerability: 0.92,
      hitStun: BOSS_CONTACT_STUN,
    })) {
      const separation = boss.radius + state.player.radius + 10;
      state.player.x = boss.x + direction.x * separation;
      state.player.y = boss.y + direction.y * separation;
      state.player.vx = direction.x * 150;
      state.player.vy = direction.y * 150;
      clampPlayerToFloor(state.player, state.expedition);
      boss.contactCooldown = BOSS_CONTACT_COOLDOWN;
      state.shake = Math.max(state.shake, 22);
      emit(state, "bossContactHit", { damage: contactDamage, stun: BOSS_CONTACT_STUN, cooldown: BOSS_CONTACT_COOLDOWN });
    }
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
  const speed = Math.hypot(boss.vx, boss.vy);
  boss.moveBlend += (Math.min(1, speed / 520) - boss.moveBlend) * (1 - Math.exp(-dt * 8));
  if (boss.dead) boss.animationState = "death";
  else if (boss.transformTimer > 0) boss.animationState = "transform";
  else if (boss.groggy > 0) boss.animationState = "stagger";
  else if (boss.hitStun > 0 && boss.animationState !== "attack") boss.animationState = "hit";
  else if (boss.animationTimer <= 0) boss.animationState = boss.moveBlend > 0.08 ? "move" : "idle";
  if (boss.attackTimer <= 0 && boss.transformTimer <= 0) boss.attackState = "idle";
}

function updateEffects(state, dt) {
  state.shake = Math.max(0, state.shake - dt * 28);
  state.flash = Math.max(0, state.flash - dt * 2.4);
  if (state.particles.length > 0) {
    const particleDamping = Math.pow(0.04, dt);
    for (const particle of state.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= particleDamping;
      particle.vy *= particleDamping;
    }
    compact(state.particles, keepPositiveLife);
  }
  for (const text of state.texts) {
    text.life -= dt;
    text.y += text.vy * dt;
  }
  compact(state.texts, keepPositiveLife);
  for (const chain of state.chains) {
    chain.life -= dt;
    chain.alpha = clamp(chain.life / Math.max(0.001, chain.maxLife), 0, 1);
  }
  compact(state.chains, keepPositiveLife);
  for (const shockwave of state.shockwaves) shockwave.life -= dt;
  compact(state.shockwaves, keepPositiveLife);
  for (const burstFx of state.bossBombBursts) burstFx.life -= dt;
  compact(state.bossBombBursts, keepPositiveLife);
  for (const portal of state.spawnPortals) portal.life -= dt;
  compact(state.spawnPortals, keepPositiveLife);
  for (const telegraph of state.telegraphs) {
    if (telegraph !== state.boss.activePattern) telegraph.life = finite(telegraph.life) - dt;
  }
  let write = 0;
  for (let read = 0; read < state.telegraphs.length; read += 1) {
    const telegraph = state.telegraphs[read];
    if (telegraph === state.boss.activePattern || telegraph.life > 0) state.telegraphs[write++] = telegraph;
  }
  state.telegraphs.length = write;
}

export function stepSwarm(state, input, dt) {
  if (!state || state.status !== "running") return state;
  const delta = clamp(finite(dt, 0), 0, 0.05);
  if (delta <= 0) return state;
  if (state.levelupPending) return state;
  if (state.expedition?.awaitingBossEntry) return state;

  const timeScale = state.phase === "boss" ? updateBossParryWindow(state, input, delta) : 1;
  const worldDelta = delta * timeScale;

  state.time = Math.min(state.duration, state.time + worldDelta);
  state.timeLeft = Math.max(0, state.duration - state.time);
  state.phaseTime += worldDelta;
  if (state.time >= state.duration) {
    state.phase = "defeat";
    state.status = "defeat";
    state.player.dead = true;
    emit(state, "loss", { reason: "timeout", kills: state.stats.kills });
    return state;
  }

  updatePlayer(state, input, worldDelta);
  updateExpedition(state, input, worldDelta);
  updateManualAbilities(state, input, worldDelta);
  updateOverdrive(state, worldDelta);
  updateAutoWeapons(state, worldDelta);
  updateAllies(state, worldDelta);

  if (state.phase === "swarm") {
    updateEnemies(state, worldDelta);
    rebuildEnemyGrid(state);
    updateOrbitWeapon(state, worldDelta);
    updateSupportSkills(state, worldDelta);
    updateProjectiles(state, worldDelta);
    updateEnemyProjectiles(state, worldDelta);
    updatePickups(state, worldDelta);
    updateHealingKits(state, worldDelta);
    updateSwarmSpawning(state, worldDelta);
  } else if (state.phase === "boss") {
    updateBoss(state, worldDelta, input);
    updateOrbitWeapon(state, worldDelta);
    updateSupportSkills(state, worldDelta);
    updateProjectiles(state, worldDelta);
    updateEnemyProjectiles(state, worldDelta);
  }

  syncAegisWardGeometry(state);
  updateLevelFlow(state);
  updateEffects(state, worldDelta);
  return state;
}

export function drainSwarmEvents(state) {
  if (!state?.events) return [];
  const events = state.events.slice();
  state.events.length = 0;
  return events;
}

function normalizeExpeditionMinimapPoint(state, x, y) {
  const expedition = state.expedition;
  return {
    x: clamp((finite(x) - expedition.originX) / Math.max(1, expedition.routeLength), 0, 1),
    y: clamp((finite(y, WORLD_HEIGHT * 0.5) - EXPEDITION_CORRIDOR.top)
      / Math.max(1, EXPEDITION_CORRIDOR.bottom - EXPEDITION_CORRIDOR.top), 0, 1),
  };
}

function buildExpeditionMinimap(state) {
  let liveEnemyCount = 0;
  for (let index = 0; index < state.enemies.length; index += 1) {
    const enemy = state.enemies[index];
    if (!enemy.dead && finite(enemy.spawnDelay) <= 0) liveEnemyCount += 1;
  }

  const sampleCount = Math.min(MINIMAP_ENEMY_SAMPLE_CAP, liveEnemyCount);
  const enemies = [];
  let liveIndex = 0;
  let sampleIndex = 0;
  let nextSample = sampleCount > 0 ? 0 : -1;
  for (let index = 0; index < state.enemies.length && sampleIndex < sampleCount; index += 1) {
    const enemy = state.enemies[index];
    if (enemy.dead || finite(enemy.spawnDelay) > 0) continue;
    if (liveIndex === nextSample) {
      const point = normalizeExpeditionMinimapPoint(state, enemy.x, enemy.y);
      enemies.push({ id: enemy.id, type: enemy.type, x: point.x, y: point.y, elite: Boolean(enemy.elite) });
      sampleIndex += 1;
      nextSample = sampleIndex < sampleCount
        ? Math.floor(sampleIndex * liveEnemyCount / sampleCount)
        : -1;
    }
    liveIndex += 1;
  }

  const player = state.phase === "boss"
    ? { x: 1, y: 0.5 }
    : normalizeExpeditionMinimapPoint(state, state.player.x, state.player.y);
  return {
    player,
    enemies,
    liveEnemyCount,
    sampleCap: MINIMAP_ENEMY_SAMPLE_CAP,
    bossGate: {
      x: clamp(state.expedition.bossGate / Math.max(1, state.expedition.routeLength), 0, 1),
      y: 0.5,
      locked: state.expedition.gateLocked,
    },
  };
}

export function getSwarmHud(state) {
  const player = state.player;
  const remaining = Math.max(0, state.enemyBudget - state.killedEnemies);
  const cooldownMax = (skill, current, stored) => (current > 0 && stored > 0 ? stored : supportCooldownDuration(state, skill));
  const chainMax = cooldownMax("chain", state.support.chainCooldown, state.support.chainCooldownMax);
  const novaMax = cooldownMax("nova", state.support.novaCooldown, state.support.novaCooldownMax);
  const airstrikeMax = cooldownMax("airstrike", state.support.airstrikeCooldown, state.support.airstrikeCooldownMax);
  const omegaLaserMax = cooldownMax("omegaLaser", state.support.omegaLaserCooldown, state.support.omegaLaserCooldownMax);
  const manualHud = (ability) => {
    const definition = MANUAL_ACTIVE_ABILITIES[ability];
    const entry = state.manualAbilities[ability];
    const maxCooldown = entry.cooldown > 0 ? entry.maxCooldown : manualAbilityCooldownDuration(state, ability);
    return {
      id: definition.id,
      name: definition.name,
      rank: 1,
      upgradeRank: 0,
      base: true,
      cooldown: Math.max(0, entry.cooldown),
      maxCooldown,
      cooldownMax: maxCooldown,
      ready: entry.cooldown <= 0.05,
      available: manualAbilityAvailable(state, ability),
      maxRank: 3,
      manual: true,
      ultimate: ability === "helixTempest",
      key: definition.key,
    };
  };
  return {
    regionId: state.regionId,
    chapterId: state.chapterId,
    phase: state.phase,
    status: state.status,
    time: state.time,
    timeLeft: state.timeLeft,
    remaining: state.timeLeft,
    phaseTime: state.phaseTime,
    expedition: state.expedition ? {
      distance: state.expedition.distance,
      routeLength: state.expedition.routeLength,
      bossGate: state.expedition.bossGate,
      progress: state.expedition.progress,
      checkpoint: state.expedition.checkpointIndex,
      objective: state.expedition.objective,
      reachedGate: state.expedition.reachedGate,
      gateLocked: state.expedition.gateLocked,
      gateUnlocked: state.expedition.gateUnlocked,
      atLockedGate: state.expedition.atLockedGate,
      gateNotice: state.expedition.atLockedGate && state.expedition.gateLocked ? {
        active: true,
        reason: "hostilesRemaining",
        title: "보스 구역 봉쇄",
        message: `잔존 적 ${remaining}기를 먼저 처치하세요.`,
        remainingEnemies: remaining,
      } : null,
      clearTransition: state.expedition.clearTransition
        ? { ...state.expedition.clearTransition }
        : null,
      awaitingBossEntry: state.expedition.awaitingBossEntry,
      autoBossEntry: state.expedition.autoBossEntry,
      bossEntryConfirmed: state.expedition.bossEntryConfirmed,
      bossRoom: state.expedition.bossRoom,
      minimap: buildExpeditionMinimap(state),
      traces: state.expedition.traces.map((trace) => ({
        id: trace.id,
        kind: trace.kind,
        distance: trace.distance,
        triggered: trace.triggered,
      })),
    } : null,
    enemiesRemaining: remaining,
    remainingEnemies: remaining,
    totalEnemies: state.enemyBudget,
    enemyBudget: state.enemyBudget,
    swarmProgress: state.enemyBudget > 0
      ? clamp(state.killedEnemies / state.enemyBudget, 0, 1)
      : 1,
    spawnedEnemies: state.spawnedEnemies,
    liveEnemies: state.enemies.length,
    enemyPressureCap: getEnemyPressureCap(state),
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
      aegisWardShield: player.aegisWardShield,
      aegisWardShieldMax: player.aegisWardShieldMax,
      aegisWardTimer: player.aegisWardTimer,
      aegisWardDuration: player.aegisWardDuration,
      aegisWardDamageReduction: player.aegisWardDamageReduction,
      statusImmune: player.aegisWardTimer > 0,
      dashCooldown: player.dashCooldown,
      dashMax: player.dashMax,
      dashInvulnerability: player.dashInvulnerability + state.build.skills.dash * 0.05,
      invulnerability: player.invulnerability,
      stunned: player.stunTimer > 0,
      stunTimer: player.stunTimer,
      stunDuration: player.stunDuration,
      animationState: player.animationState,
      attackState: player.attackState,
      attackTimer: player.attackTimer,
      recoil: player.recoil,
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
      groggy: state.boss.groggy,
      groggyDuration: state.boss.groggyDuration,
      groggyMultiplier: state.boss.groggyMultiplier,
      damageMultiplier: state.boss.damageMultiplier,
      enrage: state.boss.enrage,
      transforming: state.boss.transformTimer > 0,
      transformTimer: state.boss.transformTimer,
      animationState: state.boss.animationState,
      attackState: state.boss.attackState,
      attackTimer: state.boss.attackTimer,
      telegraphGeometry: state.boss.activePattern?.geometry ?? null,
      parry: state.boss.parryWindow ? { ...state.boss.parryWindow } : null,
      siren: state.boss.siren ? { ...state.boss.siren } : null,
      bombSequence: state.boss.bombSequence ? {
        tier: state.boss.bombSequence.tier,
        phase: state.boss.bombSequence.phase,
        count: state.boss.bombSequence.count,
        expectedOrder: state.boss.bombSequence.expectedOrder,
        timer: state.boss.bombSequence.timer,
        duration: state.boss.bombSequence.duration,
        progress: state.boss.bombSequence.progress,
        bombs: state.boss.bombSequence.bombs.map((bomb) => ({
          id: bomb.id,
          order: bomb.order,
          state: bomb.state,
          defused: bomb.defused,
          exploded: bomb.exploded,
        })),
      } : null,
    } : null,
    rewards: {
      pending: state.levelupPending,
      options: state.rewardOptions.map((option) => ({ ...option })),
      queuedLevels: state.levelFlow.queuedLevels,
      batchLevels: state.levelFlow.batchLevels,
      nextOfferIn: Math.max(0, state.levelFlow.nextOfferAt - state.time),
      combatInterval: state.levelFlow.combatInterval,
    },
    build: {
      weapons: { ...state.build.weapons },
      skills: { ...state.build.skills },
      allies: { ...state.build.allies },
    },
    abilities: {
      chain: { rank: state.build.skills.chain, cooldown: Math.max(0, state.support.chainCooldown), maxCooldown: chainMax, cooldownMax: chainMax, maxRank: 3 },
      nova: { rank: state.build.skills.nova, cooldown: Math.max(0, state.support.novaCooldown), maxCooldown: novaMax, cooldownMax: novaMax, maxRank: 3 },
      airstrike: { rank: state.build.skills.airstrike, cooldown: Math.max(0, state.support.airstrikeCooldown), maxCooldown: airstrikeMax, cooldownMax: airstrikeMax, maxRank: 3 },
      omegaLaser: { rank: state.build.skills.omegaLaser, cooldown: Math.max(0, state.support.omegaLaserCooldown), maxCooldown: omegaLaserMax, cooldownMax: omegaLaserMax, maxRank: 3 },
      empPulse: manualHud("empPulse"),
      aegisWard: manualHud("aegisWard"),
      stratosRun: manualHud("stratosRun"),
      helixTempest: manualHud("helixTempest"),
    },
    stats: { ...state.stats, activeAbilityCasts: { ...state.stats.activeAbilityCasts } },
  };
}

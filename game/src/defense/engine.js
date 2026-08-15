import {
  DEFAULT_DEFENSE_STAGE_ID,
  DEFENSE_TOWER_DEFINITIONS,
  DEFENSE_TOWER_IDS,
  getDefenseStage,
} from "./content.js";

export const DEFENSE_WIDTH = 1280;
export const DEFENSE_HEIGHT = 720;
export const DEFENSE_FIXED_STEP = 1 / 60;

const CORE_POSITION = Object.freeze({ x: 640, y: 590 });
const DEFENSE_PATHS = Object.freeze([
  Object.freeze([{ x: -35, y: 120 }, { x: 230, y: 195 }, { x: 360, y: 365 }, { x: 520, y: 470 }, CORE_POSITION]),
  Object.freeze([{ x: 640, y: -35 }, { x: 640, y: 185 }, { x: 640, y: 360 }, { x: 640, y: 480 }, CORE_POSITION]),
  Object.freeze([{ x: 1315, y: 120 }, { x: 1050, y: 195 }, { x: 920, y: 365 }, { x: 760, y: 470 }, CORE_POSITION]),
]);

const NODE_LAYOUT = Object.freeze([
  ["node-01", 245, 275], ["node-02", 350, 375], ["node-03", 505, 145], ["node-04", 515, 290],
  ["node-05", 775, 145], ["node-06", 765, 290], ["node-07", 1035, 275], ["node-08", 930, 375],
  ["node-09", 455, 500], ["node-10", 825, 500], ["node-11", 440, 620], ["node-12", 840, 620],
]);

const ENEMY_DEFINITIONS = Object.freeze({
  hunter: Object.freeze({ hp: 72, speed: 82, radius: 18, reward: 6, baseDamage: 1, color: "#ff526d" }),
  rifleman: Object.freeze({ hp: 150, speed: 58, radius: 22, reward: 10, baseDamage: 2, color: "#ff9b62" }),
  sniper: Object.freeze({ hp: 260, speed: 42, radius: 26, reward: 15, baseDamage: 3, color: "#c77dff" }),
  siegeWalker: Object.freeze({ hp: 2200, speed: 25, radius: 48, reward: 90, baseDamage: 8, color: "#ffdc77" }),
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distanceSquared(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function emit(state, type, payload = {}) {
  state.events.push({ type, time: state.time, ...payload });
}

function pushEffect(state, effect) {
  state.effects.push({ id: `defense-effect-${state.nextEffectId++}`, ...effect });
}

function enemyRoleFor(stage, waveIndex, enemyIndex, count) {
  const progress = waveIndex / Math.max(1, stage.waveCounts.length - 1);
  if (stage.order === 3 && waveIndex === stage.waveCounts.length - 1 && enemyIndex === count - 1) return "siegeWalker";
  if (progress < 0.24) return "hunter";
  const selector = (enemyIndex * 7 + waveIndex * 5 + stage.order) % 20;
  if (progress >= 0.64 && selector >= 16 - stage.order) return "sniper";
  if (progress >= 0.32 && selector >= 10 - stage.order) return "rifleman";
  return "hunter";
}

function createEnemy(state, role, pathIndex, sequence) {
  const definition = ENEMY_DEFINITIONS[role];
  const waveScale = 1 + state.waveIndex * 0.13;
  const hp = Math.round(definition.hp * state.stage.difficulty * waveScale);
  const path = DEFENSE_PATHS[pathIndex];
  const start = path[0];
  return {
    id: `defense-enemy-${state.nextEnemyId++}`,
    role,
    pathIndex,
    segmentIndex: 0,
    x: start.x - (sequence % 3) * 18,
    y: start.y - Math.floor(sequence / 3) * 22,
    hp,
    maxHp: hp,
    speed: definition.speed * (1 + state.waveIndex * 0.012),
    radius: definition.radius,
    reward: definition.reward,
    baseDamage: definition.baseDamage,
    color: definition.color,
    slowTimer: 0,
    slowFactor: 1,
    pathProgress: 0,
    hitFlash: 0,
  };
}

function queueWave(state) {
  const count = state.stage.waveCounts[state.waveIndex];
  const interval = Math.max(0.12, 0.52 - state.waveIndex * 0.035 - (state.stage.order - 1) * 0.04);
  state.pendingSpawns.length = 0;
  for (let index = 0; index < count; index += 1) {
    state.pendingSpawns.push({
      at: index * interval,
      role: enemyRoleFor(state.stage, state.waveIndex, index, count),
      pathIndex: (index + state.waveIndex) % DEFENSE_PATHS.length,
      sequence: index,
    });
  }
  state.waveElapsed = 0;
  state.phase = "wave";
  state.readyToStart = false;
  emit(state, "defenseWaveStarted", { wave: state.waveIndex + 1, count });
}

function towerStats(tower) {
  const rankScale = 1 + (tower.rank - 1) * 0.42;
  if (tower.type === "pulseSentry") return { range: 205 + tower.rank * 8, cooldown: 0.42 / (1 + (tower.rank - 1) * 0.18), damage: 23 * rankScale };
  if (tower.type === "arcRelay") return { range: 185 + tower.rank * 10, cooldown: 1.18 / (1 + (tower.rank - 1) * 0.12), damage: 31 * rankScale, chain: 2 + tower.rank };
  if (tower.type === "skyfireBattery") return { range: 285 + tower.rank * 14, cooldown: 1.72 / (1 + (tower.rank - 1) * 0.1), damage: 58 * rankScale, splash: 72 + tower.rank * 12 };
  return { range: 145 + tower.rank * 10, cooldown: 2.3 / (1 + (tower.rank - 1) * 0.12), damage: 16 * rankScale, slow: 0.58 - tower.rank * 0.05 };
}

function damageEnemy(state, enemy, amount, source, towerId) {
  if (!enemy || enemy.hp <= 0) return false;
  enemy.hp -= amount;
  enemy.hitFlash = 0.12;
  if (enemy.hp > 0) return false;
  state.credits += enemy.reward;
  state.kills += 1;
  emit(state, "defenseEnemyDestroyed", { enemyId: enemy.id, role: enemy.role, x: enemy.x, y: enemy.y, source, towerId, credits: enemy.reward });
  return true;
}

function acquireTarget(state, tower, range) {
  const rangeSq = range * range;
  let target = null;
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0 || distanceSquared(tower, enemy) > rangeSq) continue;
    if (!target || enemy.pathProgress > target.pathProgress) target = enemy;
  }
  return target;
}

function fireTower(state, tower) {
  const stats = towerStats(tower);
  const target = acquireTarget(state, tower, stats.range);
  if (!target) return;
  tower.cooldown = stats.cooldown;
  tower.attackTimer = 0.32;
  tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
  if (tower.type === "pulseSentry") {
    state.projectiles.push({ id: `defense-shot-${state.nextProjectileId++}`, kind: "pulse", towerId: tower.id, targetId: target.id, x: tower.x, y: tower.y, speed: 520, damage: stats.damage, radius: 7, color: 0x63efff });
  } else if (tower.type === "skyfireBattery") {
    state.projectiles.push({ id: `defense-shot-${state.nextProjectileId++}`, kind: "mortar", towerId: tower.id, targetId: target.id, x: tower.x, y: tower.y, targetX: target.x, targetY: target.y, speed: 340, damage: stats.damage, splash: stats.splash, radius: 11, color: 0xffb45f });
  } else if (tower.type === "arcRelay") {
    const struck = [target];
    damageEnemy(state, target, stats.damage, "arcRelay", tower.id);
    let current = target;
    for (let chain = 1; chain < stats.chain; chain += 1) {
      let next = null;
      for (const enemy of state.enemies) {
        if (enemy.hp <= 0 || struck.includes(enemy) || distanceSquared(current, enemy) > 145 * 145) continue;
        if (!next || distanceSquared(current, enemy) < distanceSquared(current, next)) next = enemy;
      }
      if (!next) break;
      pushEffect(state, { kind: "arc", life: 0.16, maxLife: 0.16, x1: current.x, y1: current.y, x2: next.x, y2: next.y });
      damageEnemy(state, next, stats.damage * (1 - chain * 0.13), "arcRelay", tower.id);
      struck.push(next);
      current = next;
    }
    pushEffect(state, { kind: "arc", life: 0.16, maxLife: 0.16, x1: tower.x, y1: tower.y, x2: target.x, y2: target.y });
  } else {
    let affected = 0;
    for (const enemy of state.enemies) {
      if (enemy.hp <= 0 || distanceSquared(tower, enemy) > stats.range * stats.range) continue;
      enemy.slowTimer = Math.max(enemy.slowTimer, 1.8 + tower.rank * 0.25);
      enemy.slowFactor = Math.min(enemy.slowFactor, stats.slow);
      damageEnemy(state, enemy, stats.damage, "aegisBastion", tower.id);
      affected += 1;
    }
    pushEffect(state, { kind: "bastion", life: 0.5, maxLife: 0.5, x: tower.x, y: tower.y, radius: stats.range });
    emit(state, "defenseBastionPulse", { towerId: tower.id, affected });
  }
}

function updateTowers(state, dt) {
  for (const tower of state.towers) {
    tower.cooldown = Math.max(0, tower.cooldown - dt);
    tower.attackTimer = Math.max(0, tower.attackTimer - dt);
    if (tower.cooldown <= 0) fireTower(state, tower);
  }
}

function updateProjectiles(state, dt) {
  for (let index = state.projectiles.length - 1; index >= 0; index -= 1) {
    const projectile = state.projectiles[index];
    const target = state.enemies.find((enemy) => enemy.id === projectile.targetId && enemy.hp > 0);
    if (target && projectile.kind === "pulse") {
      projectile.targetX = target.x;
      projectile.targetY = target.y;
    }
    const targetX = projectile.targetX ?? target?.x;
    const targetY = projectile.targetY ?? target?.y;
    if (!Number.isFinite(targetX) || !Number.isFinite(targetY)) {
      state.projectiles.splice(index, 1);
      continue;
    }
    const dx = targetX - projectile.x;
    const dy = targetY - projectile.y;
    const distance = Math.hypot(dx, dy);
    const step = projectile.speed * dt;
    if (distance > step + 6) {
      projectile.x += dx / Math.max(1, distance) * step;
      projectile.y += dy / Math.max(1, distance) * step;
      continue;
    }
    projectile.x = targetX;
    projectile.y = targetY;
    if (projectile.kind === "mortar") {
      for (const enemy of state.enemies) {
        if (enemy.hp > 0 && distanceSquared(projectile, enemy) <= projectile.splash * projectile.splash) damageEnemy(state, enemy, projectile.damage, "skyfireBattery", projectile.towerId);
      }
      pushEffect(state, { kind: "blast", life: 0.42, maxLife: 0.42, x: projectile.x, y: projectile.y, radius: projectile.splash });
    } else if (target) {
      damageEnemy(state, target, projectile.damage, "pulseSentry", projectile.towerId);
      pushEffect(state, { kind: "impact", life: 0.18, maxLife: 0.18, x: projectile.x, y: projectile.y, radius: 18 });
    }
    state.projectiles.splice(index, 1);
  }
}

function updateEnemies(state, dt) {
  for (let index = state.enemies.length - 1; index >= 0; index -= 1) {
    const enemy = state.enemies[index];
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    if (enemy.hp <= 0) {
      state.enemies.splice(index, 1);
      continue;
    }
    enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
    if (enemy.slowTimer <= 0) enemy.slowFactor = 1;
    const path = DEFENSE_PATHS[enemy.pathIndex];
    const nextPoint = path[enemy.segmentIndex + 1];
    if (!nextPoint) {
      state.baseHp = Math.max(0, state.baseHp - enemy.baseDamage);
      state.leaks += 1;
      emit(state, "defenseCoreHit", { role: enemy.role, damage: enemy.baseDamage, baseHp: state.baseHp });
      state.enemies.splice(index, 1);
      continue;
    }
    const dx = nextPoint.x - enemy.x;
    const dy = nextPoint.y - enemy.y;
    const distance = Math.hypot(dx, dy);
    const step = enemy.speed * enemy.slowFactor * dt;
    if (distance <= step + 1) {
      enemy.x = nextPoint.x;
      enemy.y = nextPoint.y;
      enemy.segmentIndex += 1;
    } else {
      enemy.x += dx / Math.max(1, distance) * step;
      enemy.y += dy / Math.max(1, distance) * step;
    }
    enemy.pathProgress = enemy.segmentIndex + 1 - Math.min(1, distance / 500);
  }
}

function finishWaveIfNeeded(state) {
  if (state.phase !== "wave" || state.pendingSpawns.length || state.enemies.length) return;
  if (state.waveIndex >= state.stage.waveCounts.length - 1) {
    state.phase = "victory";
    state.finished = true;
    emit(state, "defenseVictory", { stageId: state.stage.id, waves: state.stage.waveCounts.length, kills: state.kills, leaks: state.leaks, time: state.time });
    return;
  }
  state.waveIndex += 1;
  state.phase = "intermission";
  state.intermission = 5;
  state.readyToStart = true;
  emit(state, "defenseWaveCleared", { wave: state.waveIndex, nextWave: state.waveIndex + 1, credits: state.credits });
}

export function createDefenseState({ stageId = DEFAULT_DEFENSE_STAGE_ID } = {}) {
  const stage = getDefenseStage(stageId) || getDefenseStage(DEFAULT_DEFENSE_STAGE_ID);
  return {
    mode: "defense",
    stage,
    stageId: stage.id,
    time: 0,
    phase: "intermission",
    finished: false,
    waveIndex: 0,
    waveElapsed: 0,
    intermission: 0,
    readyToStart: true,
    baseHp: stage.baseHp,
    maxBaseHp: stage.baseHp,
    credits: stage.startingCredits,
    kills: 0,
    leaks: 0,
    selectedNodeId: null,
    nodes: NODE_LAYOUT.map(([id, x, y]) => ({ id, x, y })),
    towers: [],
    enemies: [],
    projectiles: [],
    effects: [],
    pendingSpawns: [],
    events: [],
    nextEnemyId: 1,
    nextTowerId: 1,
    nextProjectileId: 1,
    nextEffectId: 1,
  };
}

export function selectDefenseNode(state, nodeId) {
  if (!state.nodes.some((node) => node.id === nodeId)) return false;
  state.selectedNodeId = nodeId;
  emit(state, "defenseNodeSelected", { nodeId });
  return true;
}

export function buildDefenseTower(state, towerType) {
  if (!DEFENSE_TOWER_IDS.includes(towerType) || !state.selectedNodeId || state.finished) return false;
  const definition = DEFENSE_TOWER_DEFINITIONS[towerType];
  const node = state.nodes.find((candidate) => candidate.id === state.selectedNodeId);
  const occupied = state.towers.find((tower) => tower.nodeId === state.selectedNodeId);
  if (!node || occupied || state.credits < definition.cost) return false;
  state.credits -= definition.cost;
  state.towers.push({
    id: `defense-tower-${state.nextTowerId++}`,
    nodeId: node.id,
    type: towerType,
    rank: 1,
    x: node.x,
    y: node.y,
    angle: -Math.PI / 2,
    cooldown: 0.25,
    attackTimer: 0,
  });
  emit(state, "defenseTowerBuilt", { nodeId: node.id, towerType, cost: definition.cost });
  return true;
}

export function upgradeDefenseTower(state) {
  const tower = state.towers.find((candidate) => candidate.nodeId === state.selectedNodeId);
  if (!tower || tower.rank >= 3 || state.finished) return false;
  const baseCost = DEFENSE_TOWER_DEFINITIONS[tower.type].cost;
  const cost = Math.round(baseCost * (0.7 + tower.rank * 0.45));
  if (state.credits < cost) return false;
  state.credits -= cost;
  tower.rank += 1;
  tower.cooldown = Math.min(tower.cooldown, 0.2);
  emit(state, "defenseTowerUpgraded", { towerId: tower.id, rank: tower.rank, cost });
  return true;
}

export function startDefenseWave(state) {
  if (state.finished || state.phase !== "intermission" || !state.readyToStart) return false;
  queueWave(state);
  return true;
}

export function stepDefense(state, dt = DEFENSE_FIXED_STEP) {
  if (!state || state.finished || !Number.isFinite(dt) || dt <= 0) return state;
  const safeDt = Math.min(0.05, dt);
  state.time += safeDt;
  for (let index = state.effects.length - 1; index >= 0; index -= 1) {
    state.effects[index].life -= safeDt;
    if (state.effects[index].life <= 0) state.effects.splice(index, 1);
  }
  if (state.phase === "intermission") {
    if (state.intermission > 0) {
      state.intermission = Math.max(0, state.intermission - safeDt);
      if (state.intermission <= 0 && state.readyToStart) queueWave(state);
    }
    return state;
  }
  if (state.phase !== "wave") return state;
  state.waveElapsed += safeDt;
  while (state.pendingSpawns.length && state.pendingSpawns[0].at <= state.waveElapsed) {
    const spawn = state.pendingSpawns.shift();
    state.enemies.push(createEnemy(state, spawn.role, spawn.pathIndex, spawn.sequence));
  }
  updateTowers(state, safeDt);
  updateProjectiles(state, safeDt);
  updateEnemies(state, safeDt);
  if (state.baseHp <= 0) {
    state.phase = "defeat";
    state.finished = true;
    emit(state, "defenseDefeat", { stageId: state.stage.id, wave: state.waveIndex + 1, kills: state.kills, time: state.time });
    return state;
  }
  finishWaveIfNeeded(state);
  return state;
}

export function drainDefenseEvents(state) {
  const events = state.events.slice();
  state.events.length = 0;
  return events;
}

export function getDefenseHud(state) {
  const tower = state.towers.find((candidate) => candidate.nodeId === state.selectedNodeId) || null;
  return {
    mode: "defense",
    stageId: state.stageId,
    stageName: state.stage.name,
    phase: state.phase,
    wave: state.waveIndex + 1,
    totalWaves: state.stage.waveCounts.length,
    baseHp: state.baseHp,
    maxBaseHp: state.maxBaseHp,
    credits: state.credits,
    kills: state.kills,
    leaks: state.leaks,
    liveEnemies: state.enemies.length + state.pendingSpawns.length,
    readyToStart: state.readyToStart,
    intermission: state.intermission,
    selectedNodeId: state.selectedNodeId,
    selectedTower: tower ? { id: tower.id, type: tower.type, rank: tower.rank, maxRank: 3 } : null,
    towers: DEFENSE_TOWER_IDS.map((id) => ({ ...DEFENSE_TOWER_DEFINITIONS[id], affordable: state.credits >= DEFENSE_TOWER_DEFINITIONS[id].cost })),
  };
}

export function getDefenseResult(state) {
  return {
    mode: "defense",
    status: state.phase,
    stageId: state.stageId,
    waves: state.waveIndex + (state.phase === "victory" ? 1 : 0),
    totalWaves: state.stage.waveCounts.length,
    kills: state.kills,
    leaks: state.leaks,
    time: state.time,
    runId: `${state.stageId}-${Math.round(state.time * 1000)}-${state.kills}`,
  };
}

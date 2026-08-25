import {
  DEFAULT_DEFENSE_DOCTRINE_ID,
  DEFAULT_DEFENSE_STAGE_ID,
  DEFENSE_TOWER_DEFINITIONS,
  DEFENSE_TOWER_IDS,
  getDefenseDoctrine,
  getDefenseStage,
} from "./content.js";
import { getDefenseBattlefield, sampleDefenseRoute } from "./battlefields.js";

export const DEFENSE_WIDTH = 1280;
export const DEFENSE_HEIGHT = 720;
export const DEFENSE_FIXED_STEP = 1 / 60;
export const DEFENSE_TARGET_PRIORITIES = Object.freeze(["first", "strong", "cluster"]);

export const DEFENSE_ABILITIES = Object.freeze({
  empSweep: Object.freeze({ id: "empSweep", name: "EMP 전역 소거", cost: 35, cooldown: 22, detail: "모든 적을 3초간 정지" }),
  orbitalStrike: Object.freeze({ id: "orbitalStrike", name: "궤도 포격", cost: 50, cooldown: 18, detail: "선택 지점에 고위력 폭격" }),
  emergencyRepair: Object.freeze({ id: "emergencyRepair", name: "긴급 방벽 수리", cost: 60, cooldown: 30, detail: "방벽 내구도 6 회복" }),
});

const ENEMY_DEFINITIONS = Object.freeze({
  hunter: Object.freeze({ hp: 72, speed: 82, radius: 18, reward: 6, command: 1.4, baseDamage: 1, color: "#ff526d", label: "자폭 드론" }),
  rifleman: Object.freeze({ hp: 150, speed: 58, radius: 22, reward: 10, command: 2.2, baseDamage: 2, color: "#ff9b62", label: "장갑 소총수" }),
  sniper: Object.freeze({ hp: 260, speed: 42, radius: 26, reward: 15, command: 3.4, baseDamage: 3, color: "#c77dff", label: "저격 플랫폼" }),
  siegeWalker: Object.freeze({ hp: 2200, speed: 25, radius: 48, reward: 90, command: 18, baseDamage: 8, color: "#ffdc77", label: "공성 워커" }),
});

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function distanceSquared(a, b) { const dx = a.x - b.x; const dy = a.y - b.y; return dx * dx + dy * dy; }
function emit(state, type, payload = {}) { state.events.push({ type, time: state.time, ...payload }); }
function pushEffect(state, effect) { state.effects.push({ id: `defense-effect-${state.nextEffectId++}`, ...effect }); }

function enemyRoleFor(stage, waveIndex, enemyIndex, count) {
  const finalWave = waveIndex === stage.waveCounts.length - 1;
  if (finalWave && enemyIndex >= count - (stage.order === 3 ? 2 : 1)) return "siegeWalker";
  const progress = waveIndex / Math.max(1, stage.waveCounts.length - 1);
  const selector = (enemyIndex * 7 + waveIndex * 5 + stage.order) % 20;
  if (progress >= 0.64 && selector >= 16 - stage.order) return "sniper";
  if (progress >= 0.28 && selector >= 9 - stage.order) return "rifleman";
  return "hunter";
}

function isEliteSpawn(stage, waveIndex, enemyIndex) {
  if (waveIndex < 2) return false;
  const stride = Math.max(7, 13 - stage.order * 2 - Math.floor(waveIndex / 3));
  return enemyIndex > 0 && (enemyIndex + waveIndex * 3 + stage.order) % stride === 0;
}

function waveComposition(stage, waveIndex) {
  const count = stage.waveCounts[clamp(waveIndex, 0, stage.waveCounts.length - 1)];
  const roles = { hunter: 0, rifleman: 0, sniper: 0, siegeWalker: 0, elite: 0 };
  for (let index = 0; index < count; index += 1) {
    roles[enemyRoleFor(stage, waveIndex, index, count)] += 1;
    if (isEliteSpawn(stage, waveIndex, index)) roles.elite += 1;
  }
  return roles;
}

function createEnemy(state, role, pathIndex, sequence, elite = false) {
  const definition = ENEMY_DEFINITIONS[role];
  const waveScale = 1 + state.waveIndex * 0.13;
  const eliteScale = elite ? 1.75 : 1;
  const hp = Math.round(definition.hp * state.stage.difficulty * waveScale * eliteScale);
  const route = state.battlefield.routes[pathIndex];
  const start = sampleDefenseRoute(route, 0);
  return {
    id: `defense-enemy-${state.nextEnemyId++}`, role, pathIndex, sequence, elite,
    segmentIndex: 0, x: start.x, y: start.y, hp, maxHp: hp,
    speed: definition.speed * (1 + state.waveIndex * 0.012) * (elite ? 1.08 : 1),
    radius: definition.radius, reward: Math.round(definition.reward * (elite ? 2.2 : 1)),
    commandReward: definition.command * (elite ? 2.4 : 1) * (elite && state.stage.order === 2 ? 1.4 : 1), baseDamage: definition.baseDamage + (elite ? 1 : 0), color: definition.color,
    slowTimer: 0, slowFactor: 1, stunTimer: 0, vulnerableTimer: 0, burnTimer: 0, burnDps: 0,
    pathDistance: 0, pathProgress: 0, angle: start.angle, hitFlash: 0,
  };
}

function queueWave(state, earlyBonus = 0) {
  const count = state.stage.waveCounts[state.waveIndex];
  const interval = Math.max(0.12, 0.52 - state.waveIndex * 0.035 - (state.stage.order - 1) * 0.04);
  state.pendingSpawns.length = 0;
  for (let index = 0; index < count; index += 1) {
    state.pendingSpawns.push({
      at: index * interval,
      role: enemyRoleFor(state.stage, state.waveIndex, index, count),
      pathIndex: (index + state.waveIndex) % state.battlefield.routes.length,
      sequence: index,
      elite: isEliteSpawn(state.stage, state.waveIndex, index),
    });
  }
  state.waveElapsed = 0;
  state.waveSpawnTotal = count;
  state.phase = "wave";
  state.readyToStart = false;
  if (earlyBonus > 0) {
    state.credits += earlyBonus;
    state.earlyCallCredits += earlyBonus;
    emit(state, "defenseEarlyWaveCalled", { wave: state.waveIndex + 1, bonus: earlyBonus });
  }
  emit(state, "defenseWaveStarted", { wave: state.waveIndex + 1, count, composition: waveComposition(state.stage, state.waveIndex) });
}

export function getDefenseTowerStats(tower, doctrine = {}) {
  const rankScale = 1 + (tower.rank - 1) * 0.42;
  let stats;
  if (tower.type === "pulseSentry") stats = { range: 205 + tower.rank * 8, cooldown: 0.42 / (1 + (tower.rank - 1) * 0.18), damage: 23 * rankScale };
  else if (tower.type === "arcRelay") stats = { range: 185 + tower.rank * 10, cooldown: 1.18 / (1 + (tower.rank - 1) * 0.12), damage: 31 * rankScale, chain: 2 + tower.rank };
  else if (tower.type === "skyfireBattery") stats = { range: 285 + tower.rank * 14, cooldown: 1.72 / (1 + (tower.rank - 1) * 0.1), damage: 58 * rankScale, splash: 72 + tower.rank * 12 };
  else stats = { range: 145 + tower.rank * 10, cooldown: 2.3 / (1 + (tower.rank - 1) * 0.12), damage: 16 * rankScale, slow: 0.58 - tower.rank * 0.05 };
  stats = { ...stats, range: stats.range * (doctrine.rangeMultiplier || 1), damage: stats.damage * (doctrine.damageMultiplier || 1) };
  if (tower.specialization === "overdrive") stats.cooldown *= 0.62;
  if (tower.specialization === "cascade") stats.chain += 3;
  if (tower.specialization === "clusterWarhead") stats.splash *= 1.55;
  if (tower.specialization === "stasis") stats.slow *= 0.62;
  return stats;
}

function damageEnemy(state, enemy, amount, source, towerId, options = {}) {
  if (!enemy || enemy.hp <= 0) return false;
  let nextAmount = amount * (enemy.vulnerableTimer > 0 ? 1.24 : 1);
  if (enemy.role === "siegeWalker" && !options.armorPiercing) nextAmount *= 0.72;
  enemy.hp -= nextAmount;
  enemy.hitFlash = 0.12;
  emit(state, "defenseEnemyHit", {
    enemyId: enemy.id,
    role: enemy.role,
    x: enemy.x,
    y: enemy.y,
    source,
    towerId,
    damage: Math.max(0, nextAmount),
  });
  if (options.vulnerable) enemy.vulnerableTimer = Math.max(enemy.vulnerableTimer, options.vulnerable);
  if (enemy.hp > 0) return false;
  state.credits += enemy.reward;
  state.kills += 1;
  state.commandPoints = clamp(state.commandPoints + enemy.commandReward * (state.doctrine.commandGainMultiplier || 1), 0, state.maxCommandPoints);
  emit(state, "defenseEnemyDestroyed", { enemyId: enemy.id, role: enemy.role, elite: enemy.elite, x: enemy.x, y: enemy.y, source, towerId, credits: enemy.reward });
  return true;
}

function clusterScore(state, enemy, radius = 115) {
  const radiusSq = radius * radius;
  let count = 0;
  for (const other of state.enemies) if (other.hp > 0 && distanceSquared(enemy, other) <= radiusSq) count += 1;
  return count;
}

function acquireTarget(state, tower, range) {
  const rangeSq = range * range;
  let target = null;
  let score = -Infinity;
  for (const enemy of state.enemies) {
    if (enemy.hp <= 0 || distanceSquared(tower, enemy) > rangeSq) continue;
    let nextScore = enemy.pathProgress;
    if (tower.targetPriority === "strong") nextScore = enemy.maxHp * 0.01 + (enemy.elite ? 30 : 0) + (enemy.role === "siegeWalker" ? 50 : 0);
    if (tower.targetPriority === "cluster") nextScore = clusterScore(state, enemy) * 10 + enemy.pathProgress;
    if (nextScore > score) { score = nextScore; target = enemy; }
  }
  return target;
}

function fireTower(state, tower) {
  const stats = getDefenseTowerStats(tower, state.doctrine);
  const target = acquireTarget(state, tower, stats.range);
  if (!target) { tower.targetId = null; return; }
  tower.targetId = target.id;
  tower.cooldown = stats.cooldown;
  tower.attackTimer = 0.32;
  tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);
  emit(state, "defenseTowerFired", {
    towerId: tower.id,
    towerType: tower.type,
    targetId: target.id,
    x: tower.x,
    y: tower.y,
  });
  if (tower.type === "pulseSentry") {
    state.projectiles.push({ id: `defense-shot-${state.nextProjectileId++}`, kind: "pulse", towerId: tower.id, targetId: target.id, x: tower.x, y: tower.y, speed: 520, damage: stats.damage, armorPiercing: tower.specialization === "armorPiercer", radius: 7, color: 0x63efff });
    return;
  }
  if (tower.type === "skyfireBattery") {
    state.projectiles.push({ id: `defense-shot-${state.nextProjectileId++}`, kind: "mortar", towerId: tower.id, targetId: target.id, x: tower.x, y: tower.y, targetX: target.x, targetY: target.y, speed: 340, damage: stats.damage, splash: stats.splash, incendiary: tower.specialization === "incendiary", radius: 11, color: 0xffb45f });
    return;
  }
  if (tower.type === "arcRelay") {
    const struck = [target];
    const vulnerable = tower.specialization === "ionFracture" ? 2.4 : 0;
    damageEnemy(state, target, stats.damage, "arcRelay", tower.id, { vulnerable });
    let current = target;
    for (let chain = 1; chain < stats.chain; chain += 1) {
      let next = null;
      for (const enemy of state.enemies) {
        if (enemy.hp <= 0 || struck.includes(enemy) || distanceSquared(current, enemy) > 145 * 145) continue;
        if (!next || distanceSquared(current, enemy) < distanceSquared(current, next)) next = enemy;
      }
      if (!next) break;
      pushEffect(state, { kind: "arc", life: 0.16, maxLife: 0.16, x1: current.x, y1: current.y, x2: next.x, y2: next.y });
      damageEnemy(state, next, stats.damage * (1 - chain * 0.1), "arcRelay", tower.id, { vulnerable });
      struck.push(next); current = next;
    }
    pushEffect(state, { kind: "arc", life: 0.16, maxLife: 0.16, x1: tower.x, y1: tower.y, x2: target.x, y2: target.y });
    return;
  }
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
    if (target && projectile.kind === "pulse") { projectile.targetX = target.x; projectile.targetY = target.y; }
    const targetX = projectile.targetX ?? target?.x;
    const targetY = projectile.targetY ?? target?.y;
    if (!Number.isFinite(targetX) || !Number.isFinite(targetY)) { state.projectiles.splice(index, 1); continue; }
    const dx = targetX - projectile.x;
    const dy = targetY - projectile.y;
    const distance = Math.hypot(dx, dy);
    const step = projectile.speed * dt;
    if (distance > step + 6) { projectile.x += dx / Math.max(1, distance) * step; projectile.y += dy / Math.max(1, distance) * step; continue; }
    projectile.x = targetX; projectile.y = targetY;
    if (projectile.kind === "mortar") {
      for (const enemy of state.enemies) if (enemy.hp > 0 && distanceSquared(projectile, enemy) <= projectile.splash * projectile.splash) damageEnemy(state, enemy, projectile.damage, "skyfireBattery", projectile.towerId);
      pushEffect(state, { kind: "blast", life: 0.42, maxLife: 0.42, x: projectile.x, y: projectile.y, radius: projectile.splash });
      if (projectile.incendiary) state.hazards.push({ id: `defense-hazard-${state.nextHazardId++}`, kind: "incendiary", x: projectile.x, y: projectile.y, radius: projectile.splash * 0.86, life: 4, tick: 0 });
    } else if (target) {
      damageEnemy(state, target, projectile.damage, "pulseSentry", projectile.towerId, { armorPiercing: projectile.armorPiercing });
      pushEffect(state, { kind: "impact", life: 0.18, maxLife: 0.18, x: projectile.x, y: projectile.y, radius: 18 });
    }
    state.projectiles.splice(index, 1);
  }
}

function updateHazards(state, dt) {
  for (let index = state.hazards.length - 1; index >= 0; index -= 1) {
    const hazard = state.hazards[index];
    hazard.life -= dt; hazard.tick -= dt;
    if (hazard.tick <= 0) {
      hazard.tick = 0.3;
      for (const enemy of state.enemies) if (enemy.hp > 0 && distanceSquared(hazard, enemy) <= hazard.radius * hazard.radius) damageEnemy(state, enemy, 13, "incendiary", null);
      pushEffect(state, { kind: "incendiary", life: 0.32, maxLife: 0.32, x: hazard.x, y: hazard.y, radius: hazard.radius });
    }
    if (hazard.life <= 0) state.hazards.splice(index, 1);
  }
}

function updateEnemies(state, dt) {
  for (let index = state.enemies.length - 1; index >= 0; index -= 1) {
    const enemy = state.enemies[index];
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    enemy.vulnerableTimer = Math.max(0, enemy.vulnerableTimer - dt);
    enemy.stunTimer = Math.max(0, enemy.stunTimer - dt);
    if (enemy.hp <= 0) { state.enemies.splice(index, 1); continue; }
    enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
    if (enemy.slowTimer <= 0) enemy.slowFactor = 1;
    if (enemy.stunTimer > 0) continue;
    const route = state.battlefield.routes[enemy.pathIndex];
    enemy.pathDistance += enemy.speed * enemy.slowFactor * dt;
    if (enemy.pathDistance >= route.totalLength) {
      state.baseHp = Math.max(0, state.baseHp - enemy.baseDamage);
      state.leaks += 1;
      emit(state, "defenseCoreHit", { role: enemy.role, elite: enemy.elite, damage: enemy.baseDamage, baseHp: state.baseHp });
      state.enemies.splice(index, 1);
      continue;
    }
    const sampled = sampleDefenseRoute(route, enemy.pathDistance);
    enemy.x = sampled.x; enemy.y = sampled.y; enemy.angle = sampled.angle; enemy.pathProgress = sampled.progress;
    enemy.segmentIndex = route.segments.findIndex((segment) => enemy.pathDistance <= segment.startDistance + segment.length);
  }
}

function repairFromGuardians(state) {
  const guardians = state.towers.filter((tower) => tower.specialization === "guardian").length;
  if (!guardians || state.baseHp >= state.maxBaseHp) return;
  const amount = Math.min(guardians, state.maxBaseHp - state.baseHp);
  state.baseHp += amount;
  emit(state, "defenseCoreRepaired", { amount, source: "guardian" });
}

function finishWaveIfNeeded(state) {
  if (state.phase !== "wave" || state.pendingSpawns.length || state.enemies.length) return;
  repairFromGuardians(state);
  if (state.waveIndex >= state.stage.waveCounts.length - 1) {
    state.phase = "victory"; state.finished = true;
    emit(state, "defenseVictory", { stageId: state.stage.id, waves: state.stage.waveCounts.length, kills: state.kills, leaks: state.leaks, time: state.time });
    return;
  }
  state.waveIndex += 1;
  state.phase = "intermission";
  state.intermission = 10;
  state.readyToStart = true;
  emit(state, "defenseWaveCleared", { wave: state.waveIndex, nextWave: state.waveIndex + 1, credits: state.credits });
}

export function createDefenseState({ stageId = DEFAULT_DEFENSE_STAGE_ID, doctrineId = DEFAULT_DEFENSE_DOCTRINE_ID } = {}) {
  const stage = getDefenseStage(stageId) || getDefenseStage(DEFAULT_DEFENSE_STAGE_ID);
  const doctrine = getDefenseDoctrine(doctrineId);
  const battlefield = getDefenseBattlefield(stage.id);
  const maxBaseHp = stage.baseHp + (doctrine.baseHp || 0);
  return {
    mode: "defense", stage, stageId: stage.id, doctrine, doctrineId: doctrine.id, battlefield,
    time: 0, phase: "intermission", finished: false, waveIndex: 0, waveElapsed: 0, waveSpawnTotal: 0,
    intermission: 0, readyToStart: true, baseHp: maxBaseHp, maxBaseHp,
    credits: stage.startingCredits + (doctrine.startingCredits || 0), kills: 0, leaks: 0,
    earlyCallCredits: 0, commandPoints: 35, maxCommandPoints: 100,
    abilityCooldowns: Object.fromEntries(Object.keys(DEFENSE_ABILITIES).map((id) => [id, 0])),
    selectedNodeId: null, nodes: battlefield.nodes.map((node) => ({ ...node })), towers: [], enemies: [], projectiles: [], effects: [], hazards: [], pendingSpawns: [], events: [],
    nextEnemyId: 1, nextTowerId: 1, nextProjectileId: 1, nextEffectId: 1, nextHazardId: 1,
  };
}

export function selectDefenseNode(state, nodeId) {
  if (!state.nodes.some((node) => node.id === nodeId)) return false;
  state.selectedNodeId = nodeId; emit(state, "defenseNodeSelected", { nodeId }); return true;
}

export function buildDefenseTower(state, towerType) {
  if (!DEFENSE_TOWER_IDS.includes(towerType) || !state.selectedNodeId || state.finished) return false;
  const definition = DEFENSE_TOWER_DEFINITIONS[towerType];
  const node = state.nodes.find((candidate) => candidate.id === state.selectedNodeId);
  const occupied = state.towers.find((tower) => tower.nodeId === state.selectedNodeId);
  if (!node || occupied || state.credits < definition.cost) return false;
  state.credits -= definition.cost;
  state.towers.push({ id: `defense-tower-${state.nextTowerId++}`, nodeId: node.id, type: towerType, rank: 1, specialization: null, targetPriority: "first", invested: definition.cost, x: node.x, y: node.y, angle: -Math.PI / 2, cooldown: 0.25, attackTimer: 0, targetId: null });
  emit(state, "defenseTowerBuilt", { nodeId: node.id, towerType, cost: definition.cost });
  return true;
}

export function upgradeDefenseTower(state) {
  const tower = state.towers.find((candidate) => candidate.nodeId === state.selectedNodeId);
  if (!tower || tower.rank >= 3 || state.finished) return false;
  const baseCost = DEFENSE_TOWER_DEFINITIONS[tower.type].cost;
  const cost = Math.round(baseCost * (0.7 + tower.rank * 0.45));
  if (state.credits < cost) return false;
  state.credits -= cost; tower.invested += cost; tower.rank += 1; tower.cooldown = Math.min(tower.cooldown, 0.2);
  emit(state, "defenseTowerUpgraded", { towerId: tower.id, rank: tower.rank, cost });
  return true;
}

export function specializeDefenseTower(state, specializationId) {
  const tower = state.towers.find((candidate) => candidate.nodeId === state.selectedNodeId);
  const branches = tower ? DEFENSE_TOWER_DEFINITIONS[tower.type].branches : null;
  if (!tower || tower.rank < 2 || tower.specialization || !branches?.[specializationId] || state.finished) return false;
  tower.specialization = specializationId;
  emit(state, "defenseTowerSpecialized", { towerId: tower.id, towerType: tower.type, specializationId });
  return true;
}

export function cycleDefenseTargetPriority(state) {
  const tower = state.towers.find((candidate) => candidate.nodeId === state.selectedNodeId);
  if (!tower || state.finished) return false;
  const current = DEFENSE_TARGET_PRIORITIES.indexOf(tower.targetPriority);
  tower.targetPriority = DEFENSE_TARGET_PRIORITIES[(current + 1) % DEFENSE_TARGET_PRIORITIES.length];
  emit(state, "defenseTargetPriorityChanged", { towerId: tower.id, targetPriority: tower.targetPriority });
  return true;
}

export function sellDefenseTower(state) {
  const index = state.towers.findIndex((candidate) => candidate.nodeId === state.selectedNodeId);
  if (index < 0 || state.finished) return false;
  const tower = state.towers[index];
  const refund = Math.round(tower.invested * 0.65);
  state.credits += refund; state.towers.splice(index, 1);
  emit(state, "defenseTowerSold", { towerId: tower.id, towerType: tower.type, refund });
  return true;
}

export function activateDefenseAbility(state, abilityId) {
  const ability = DEFENSE_ABILITIES[abilityId];
  if (!ability || state.finished || state.commandPoints < ability.cost || state.abilityCooldowns[abilityId] > 0) return false;
  const node = state.nodes.find((candidate) => candidate.id === state.selectedNodeId) || state.battlefield.core;
  if (abilityId === "orbitalStrike" && !state.selectedNodeId) return false;
  if (abilityId === "empSweep") {
    for (const enemy of state.enemies) enemy.stunTimer = Math.max(enemy.stunTimer, enemy.role === "siegeWalker" ? 1.7 : 3);
    pushEffect(state, { kind: "emp", life: 0.9, maxLife: 0.9, x: state.battlefield.core.x, y: state.battlefield.core.y, radius: 680 });
  } else if (abilityId === "orbitalStrike") {
    for (const enemy of state.enemies) if (enemy.hp > 0 && distanceSquared(node, enemy) <= 195 * 195) damageEnemy(state, enemy, enemy.role === "siegeWalker" ? 650 : 900, "orbitalStrike", null, { armorPiercing: true });
    pushEffect(state, { kind: "orbital", life: 0.8, maxLife: 0.8, x: node.x, y: node.y, radius: 195 });
  } else {
    const amount = Math.min(6, state.maxBaseHp - state.baseHp);
    if (amount <= 0) return false;
    state.baseHp += amount;
    pushEffect(state, { kind: "repair", life: 0.75, maxLife: 0.75, x: state.battlefield.core.x, y: state.battlefield.core.y, radius: 120 });
    emit(state, "defenseCoreRepaired", { amount, source: "command" });
  }
  state.commandPoints -= ability.cost; state.abilityCooldowns[abilityId] = ability.cooldown;
  emit(state, "defenseAbilityActivated", { abilityId, x: node.x, y: node.y, cost: ability.cost });
  return true;
}

export function startDefenseWave(state) {
  if (state.finished || state.phase !== "intermission" || !state.readyToStart) return false;
  const earlyBonus = state.intermission > 0
    ? Math.max(1, Math.round(state.intermission * 2.2 * (state.doctrine.earlyWaveBonus || 1) * (state.stage.order === 1 ? 1.25 : 1)))
    : 0;
  queueWave(state, earlyBonus); return true;
}

export function stepDefense(state, dt = DEFENSE_FIXED_STEP) {
  if (!state || state.finished || !Number.isFinite(dt) || dt <= 0) return state;
  const safeDt = Math.min(0.05, dt); state.time += safeDt;
  for (const id of Object.keys(state.abilityCooldowns)) state.abilityCooldowns[id] = Math.max(0, state.abilityCooldowns[id] - safeDt);
  for (let index = state.effects.length - 1; index >= 0; index -= 1) { state.effects[index].life -= safeDt; if (state.effects[index].life <= 0) state.effects.splice(index, 1); }
  if (state.phase === "intermission") {
    if (state.intermission > 0) { state.intermission = Math.max(0, state.intermission - safeDt); if (state.intermission <= 0 && state.readyToStart) queueWave(state); }
    return state;
  }
  if (state.phase !== "wave") return state;
  state.waveElapsed += safeDt;
  while (state.pendingSpawns.length && state.pendingSpawns[0].at <= state.waveElapsed) {
    const spawn = state.pendingSpawns.shift(); state.enemies.push(createEnemy(state, spawn.role, spawn.pathIndex, spawn.sequence, spawn.elite));
  }
  updateTowers(state, safeDt); updateProjectiles(state, safeDt); updateHazards(state, safeDt); updateEnemies(state, safeDt);
  if (state.baseHp <= 0) {
    state.phase = "defeat"; state.finished = true;
    emit(state, "defenseDefeat", { stageId: state.stage.id, wave: state.waveIndex + 1, kills: state.kills, time: state.time });
    return state;
  }
  finishWaveIfNeeded(state); return state;
}

export function drainDefenseEvents(state) { const events = state.events.slice(); state.events.length = 0; return events; }

export function getDefenseHud(state) {
  const tower = state.towers.find((candidate) => candidate.nodeId === state.selectedNodeId) || null;
  const stats = tower ? getDefenseTowerStats(tower, state.doctrine) : null;
  const branches = tower ? Object.values(DEFENSE_TOWER_DEFINITIONS[tower.type].branches) : [];
  const currentComposition = waveComposition(state.stage, state.waveIndex);
  const nextWaveIndex = clamp(state.waveIndex + (state.phase === "wave" ? 1 : 0), 0, state.stage.waveCounts.length - 1);
  const earlyCallBonus = state.intermission > 0 ? Math.max(1, Math.round(state.intermission * 2.2 * (state.doctrine.earlyWaveBonus || 1))) : 0;
  return {
    mode: "defense", stageId: state.stageId, stageName: state.stage.name, doctrineId: state.doctrineId, doctrineName: state.doctrine.name,
    phase: state.phase, wave: state.waveIndex + 1, totalWaves: state.stage.waveCounts.length,
    waveProgress: state.phase === "wave" ? clamp(1 - (state.enemies.length + state.pendingSpawns.length) / Math.max(1, state.waveSpawnTotal), 0, 1) : 0,
    baseHp: state.baseHp, maxBaseHp: state.maxBaseHp, credits: state.credits, kills: state.kills, leaks: state.leaks,
    liveEnemies: state.enemies.length + state.pendingSpawns.length, eliteEnemies: state.enemies.filter((enemy) => enemy.elite).length,
    readyToStart: state.readyToStart, intermission: state.intermission, earlyCallBonus, selectedNodeId: state.selectedNodeId,
    commandPoints: state.commandPoints, maxCommandPoints: state.maxCommandPoints,
    abilities: Object.values(DEFENSE_ABILITIES).map((ability) => ({ ...ability, cooldownRemaining: state.abilityCooldowns[ability.id], ready: state.commandPoints >= ability.cost && state.abilityCooldowns[ability.id] <= 0 })),
    currentWave: currentComposition, nextWave: waveComposition(state.stage, nextWaveIndex),
    selectedTower: tower ? {
      id: tower.id, type: tower.type, rank: tower.rank, maxRank: 3, specialization: tower.specialization,
      targetPriority: tower.targetPriority, targetId: tower.targetId, sellRefund: Math.round(tower.invested * 0.65),
      range: Math.round(stats.range), damage: Math.round(stats.damage), cooldown: Number(stats.cooldown.toFixed(2)), branches,
    } : null,
    towers: DEFENSE_TOWER_IDS.map((id) => ({ ...DEFENSE_TOWER_DEFINITIONS[id], affordable: state.credits >= DEFENSE_TOWER_DEFINITIONS[id].cost })),
  };
}

export function getDefenseResult(state) {
  const coreRatio = state.baseHp / Math.max(1, state.maxBaseHp);
  const score = Math.max(0, Math.round(state.kills * 120 + state.earlyCallCredits * 20 + state.baseHp * 500 - state.leaks * 300));
  const rank = state.phase !== "victory" ? "D" : coreRatio >= 0.85 && state.leaks <= 1 ? "S" : coreRatio >= 0.62 ? "A" : coreRatio >= 0.35 ? "B" : "C";
  return {
    mode: "defense", status: state.phase, stageId: state.stageId, doctrineId: state.doctrineId,
    waves: state.waveIndex + (state.phase === "victory" ? 1 : 0), totalWaves: state.stage.waveCounts.length,
    kills: state.kills, leaks: state.leaks, coreHp: state.baseHp, maxCoreHp: state.maxBaseHp, earlyCallCredits: state.earlyCallCredits,
    score, rank, time: state.time, runId: `${state.stageId}-${Math.round(state.time * 1000)}-${state.kills}`,
  };
}

import {
  COUNTER_PROTOCOLS,
  ENEMY_TYPES,
  GAME_HEIGHT,
  GAME_WIDTH,
  RUN_DURATION,
  UPGRADES,
} from "./data.js";

const TAU = Math.PI * 2;
const GATE_POINTS = [
  { x: GAME_WIDTH / 2, y: 26 },
  { x: GAME_WIDTH - 35, y: GAME_HEIGHT / 2 },
  { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 25 },
  { x: 35, y: GAME_HEIGHT / 2 },
];

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function randomChoice(items, random = Math.random) {
  return items[Math.floor(random() * items.length)];
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

export function createGameState({ random = Math.random, duration = RUN_DURATION } = {}) {
  return {
    status: "running",
    random,
    duration,
    time: 0,
    timeLeft: duration,
    entityId: 0,
    player: {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2 + 112,
      vx: 0,
      vy: 0,
      angle: -Math.PI / 2,
      targetAngle: -Math.PI / 2,
      radius: 18,
      hp: 100,
      maxHp: 100,
      speed: 222,
      dashCooldown: 0,
      dashRemaining: 0,
      invulnerability: 0,
      hitFlash: 0,
      fireCooldown: 0,
      arcCooldown: 2.8,
      droneCooldown: 0,
      level: 1,
      xp: 0,
      xpNext: 9,
      scrap: 22,
      kills: 0,
      score: 0,
      upgrades: Object.fromEntries(UPGRADES.map((upgrade) => [upgrade.id, 0])),
      stats: {
        damage: 28,
        fireInterval: 0.31,
        bulletSpeed: 680,
        multishot: 1,
        pierce: 0,
        magnet: 112,
        dashCooldown: 1.6,
        sentryDamage: 17,
        sentryDuration: 28,
        repairChance: 0,
      },
    },
    enemies: [],
    projectiles: [],
    enemyShots: [],
    gems: [],
    particles: [],
    beams: [],
    towers: [],
    texts: [],
    spawnCooldown: 0.4,
    wave: 1,
    counter: COUNTER_PROTOCOLS.sampling,
    counterIndex: 0,
    nextAdaptation: 38,
    counterFlash: 0,
    bossSpawned: false,
    pendingUpgradeChoices: [],
    profile: {
      damage: { ballistic: 0, arc: 0, orbit: 0, tower: 0 },
      distance: 0,
      towerBuilds: 0,
      window: 0,
    },
    runStats: {
      damage: { ballistic: 0, arc: 0, orbit: 0, tower: 0 },
      counters: [],
      towersBuilt: 0,
      highestWave: 1,
    },
    events: [],
    shake: 0,
    dangerPulse: 0,
  };
}

export function getUpgradeChoices(state, count = 3) {
  const eligible = UPGRADES.filter((upgrade) => state.player.upgrades[upgrade.id] < upgrade.max);
  const pool = [...eligible];
  const choices = [];
  while (choices.length < count && pool.length) {
    const index = Math.floor(state.random() * pool.length);
    choices.push(pool.splice(index, 1)[0]);
  }
  return choices;
}

export function applyUpgrade(state, upgradeId) {
  const upgrade = UPGRADES.find((entry) => entry.id === upgradeId);
  if (!upgrade || state.player.upgrades[upgradeId] >= upgrade.max) return false;
  const player = state.player;
  player.upgrades[upgradeId] += 1;
  switch (upgradeId) {
    case "pulse":
      player.stats.damage *= 1.35;
      player.stats.bulletSpeed *= 1.08;
      break;
    case "multishot":
      player.stats.multishot += 1;
      break;
    case "pierce":
      player.stats.pierce += 1;
      player.stats.damage *= 1.1;
      break;
    case "firerate":
      player.stats.fireInterval *= 0.78;
      break;
    case "armor":
      player.maxHp += 25;
      player.hp = Math.min(player.maxHp, player.hp + 25);
      break;
    case "mobility":
      player.speed *= 1.11;
      player.stats.dashCooldown *= 0.9;
      break;
    case "magnet":
      player.stats.magnet += 54;
      break;
    case "repair":
      player.hp = Math.min(player.maxHp, player.hp + 18);
      player.stats.repairChance += 0.035;
      break;
    case "tower":
      player.stats.sentryDamage *= 1.3;
      player.stats.sentryDuration *= 1.3;
      break;
    default:
      break;
  }
  state.pendingUpgradeChoices = [];
  state.status = "running";
  emit(state, "upgradeApplied", { upgrade });
  return true;
}

export function analyzeBuild(profile) {
  const damageEntries = Object.entries(profile.damage);
  const total = damageEntries.reduce((sum, [, value]) => sum + value, 0) || 1;
  const [dominant, dominantValue] = damageEntries.sort((a, b) => b[1] - a[1])[0];
  if (dominant === "tower" && dominantValue / total > 0.3 || profile.towerBuilds >= 3) {
    return COUNTER_PROTOCOLS.hacker;
  }
  if (dominant === "ballistic" && dominantValue / total > 0.62) {
    return COUNTER_PROTOCOLS.armor;
  }
  const movementPerSecond = profile.distance / Math.max(1, profile.window);
  if (movementPerSecond < 72) return COUNTER_PROTOCOLS.siege;
  return COUNTER_PROTOCOLS.rush;
}

function resetProfileWindow(state) {
  state.profile.damage = { ballistic: 0, arc: 0, orbit: 0, tower: 0 };
  state.profile.distance = 0;
  state.profile.towerBuilds = 0;
  state.profile.window = 0;
}

export function spawnEnemy(state, requestedType, gateIndex) {
  let type = requestedType;
  const wave = state.wave;
  if (!type) {
    const roll = state.random();
    if (wave >= 7 && roll > 0.9) type = "brute";
    else if (state.counter.id === "hacker" && roll > 0.72) type = "hacker";
    else if ((state.counter.id === "siege" || wave >= 3) && roll > 0.68) type = "suppressor";
    else type = "hunter";
  }
  const config = ENEMY_TYPES[type];
  const point = GATE_POINTS[gateIndex ?? Math.floor(state.random() * GATE_POINTS.length)];
  const hpScale = 1 + Math.max(0, wave - 1) * 0.075;
  const elite = !config.boss && wave >= 6 && state.random() > 0.92;
  const enemy = {
    id: uid(state, "enemy"),
    type,
    x: point.x + (state.random() - 0.5) * 68,
    y: point.y + (state.random() - 0.5) * 48,
    vx: 0,
    vy: 0,
    angle: 0,
    radius: config.radius * (elite ? 1.16 : 1),
    hp: config.hp * hpScale * (elite ? 1.8 : 1),
    maxHp: config.hp * hpScale * (elite ? 1.8 : 1),
    speed: config.speed * (state.counter.id === "rush" && type === "hunter" ? 1.22 : 1),
    damage: config.damage,
    xp: config.xp * (elite ? 2 : 1),
    scrap: config.scrap * (elite ? 2 : 1),
    sprite: config.sprite,
    ranged: config.ranged,
    hacker: config.hacker,
    boss: config.boss,
    elite,
    attackCooldown: 0.4 + state.random() * 0.8,
    hitFlash: 0,
    slow: 0,
    contactCooldown: 0,
    resist: state.counter.id === "armor" && type === "hunter" && state.random() > 0.38 ? "ballistic" : null,
    dead: false,
  };
  state.enemies.push(enemy);
  return enemy;
}

function addParticles(state, x, y, color, count = 7, speed = 140) {
  for (let index = 0; index < count; index += 1) {
    const angle = state.random() * TAU;
    const velocity = speed * (0.35 + state.random() * 0.75);
    state.particles.push({
      x,
      y,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      life: 0.2 + state.random() * 0.35,
      maxLife: 0.55,
      size: 1.5 + state.random() * 3.8,
      color,
    });
  }
}

function addText(state, x, y, text, color = "#ffffff") {
  state.texts.push({ x, y, text, color, life: 0.7, maxLife: 0.7 });
}

function dealEnemyDamage(state, enemy, amount, source) {
  const multiplier = enemy.resist === source ? 0.55 : 1;
  const actual = amount * multiplier;
  enemy.hp -= actual;
  enemy.hitFlash = 0.09;
  state.profile.damage[source] += actual;
  state.runStats.damage[source] += actual;
  if (enemy.resist === source && state.random() > 0.64) addText(state, enemy.x, enemy.y - 18, "RESIST", "#ff6677");
  if (enemy.hp <= 0 && !enemy.dead) killEnemy(state, enemy);
  return actual;
}

function killEnemy(state, enemy) {
  enemy.dead = true;
  state.player.kills += 1;
  state.player.score += Math.round(enemy.maxHp * (enemy.elite ? 2 : 1));
  const gemCount = enemy.boss ? 12 : enemy.elite ? 3 : 1;
  for (let index = 0; index < gemCount; index += 1) {
    const angle = state.random() * TAU;
    state.gems.push({
      id: uid(state, "gem"),
      x: enemy.x + Math.cos(angle) * index * 5,
      y: enemy.y + Math.sin(angle) * index * 5,
      vx: Math.cos(angle) * 40,
      vy: Math.sin(angle) * 40,
      value: enemy.xp / gemCount,
      scrap: enemy.scrap / gemCount,
      age: 0,
      life: 16,
    });
  }
  if (state.random() < state.player.stats.repairChance) {
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + 4);
    addText(state, enemy.x, enemy.y, "+4 HP", "#66ffb3");
  }
  addParticles(state, enemy.x, enemy.y, enemy.boss ? "#ffb34d" : "#ff405a", enemy.boss ? 35 : 9, enemy.boss ? 300 : 160);
  state.shake = Math.max(state.shake, enemy.boss ? 0.8 : enemy.elite ? 0.25 : 0.08);
  emit(state, "enemyKilled", { enemy });
}

function nearestEnemy(state, origin, range = Infinity, filter = () => true) {
  let target = null;
  let best = range;
  for (const enemy of state.enemies) {
    if (enemy.dead || !filter(enemy)) continue;
    const current = distance(origin, enemy);
    if (current < best) {
      best = current;
      target = enemy;
    }
  }
  return target;
}

function firePlayerWeapon(state) {
  const player = state.player;
  const target = nearestEnemy(state, player, 420);
  if (!target) return;
  const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
  player.targetAngle = baseAngle;
  const count = player.stats.multishot;
  for (let index = 0; index < count; index += 1) {
    const offset = (index - (count - 1) / 2) * 0.105;
    const angle = baseAngle + offset;
    state.projectiles.push({
      id: uid(state, "shot"),
      x: player.x + Math.cos(angle) * 26,
      y: player.y + Math.sin(angle) * 26,
      vx: Math.cos(angle) * player.stats.bulletSpeed,
      vy: Math.sin(angle) * player.stats.bulletSpeed,
      angle,
      damage: player.stats.damage,
      life: 1,
      radius: 4,
      pierce: player.stats.pierce,
      hit: new Set(),
      source: "ballistic",
      color: "#71f2ff",
    });
  }
  player.fireCooldown = player.stats.fireInterval;
  emit(state, "playerShot");
}

function fireArc(state) {
  const level = state.player.upgrades.arc;
  if (!level) return;
  const first = nearestEnemy(state, state.player, 280 + level * 26);
  if (!first) return;
  const hit = new Set();
  let origin = { x: state.player.x, y: state.player.y };
  let current = first;
  const chainCount = 2 + level;
  for (let index = 0; index < chainCount && current; index += 1) {
    state.beams.push({ x1: origin.x, y1: origin.y, x2: current.x, y2: current.y, life: 0.14, color: "#8af7ff", width: 3 });
    dealEnemyDamage(state, current, 17 + level * 8, "arc");
    hit.add(current.id);
    origin = current;
    current = nearestEnemy(state, origin, 170, (enemy) => !hit.has(enemy.id));
  }
  state.player.arcCooldown = Math.max(1.35, 3.2 - level * 0.35);
  emit(state, "arc");
}

function updateOrbitBlades(state, dt) {
  const level = state.player.upgrades.orbit;
  if (!level) return;
  const bladeCount = 1 + Math.ceil(level / 2);
  for (let index = 0; index < bladeCount; index += 1) {
    const angle = state.time * (1.8 + level * 0.12) + index * (TAU / bladeCount);
    const blade = {
      x: state.player.x + Math.cos(angle) * (62 + level * 4),
      y: state.player.y + Math.sin(angle) * (62 + level * 4),
      angle,
    };
    for (const enemy of state.enemies) {
      if (enemy.dead || enemy.orbitCooldown > 0) continue;
      if (distance(blade, enemy) < enemy.radius + 14) {
        dealEnemyDamage(state, enemy, 22 + level * 10, "orbit");
        enemy.orbitCooldown = 0.38;
        addParticles(state, blade.x, blade.y, "#ffd166", 4, 110);
      }
    }
  }
}

function fireDrone(state) {
  const level = state.player.upgrades.drone;
  if (!level || state.player.droneCooldown > 0) return;
  const droneAngle = -state.time * 1.3;
  const origin = {
    x: state.player.x + Math.cos(droneAngle) * 48,
    y: state.player.y + Math.sin(droneAngle) * 48,
  };
  const target = nearestEnemy(state, origin, 420);
  if (!target) return;
  const angle = Math.atan2(target.y - origin.y, target.x - origin.x);
  state.projectiles.push({
    id: uid(state, "drone-shot"),
    x: origin.x,
    y: origin.y,
    vx: Math.cos(angle) * 570,
    vy: Math.sin(angle) * 570,
    angle,
    damage: 11 + level * 6,
    life: 0.9,
    radius: 3,
    pierce: 0,
    hit: new Set(),
    source: "arc",
    color: "#b68cff",
  });
  state.player.droneCooldown = Math.max(0.22, 0.52 - level * 0.08);
}

function deployTower(state, kind) {
  const cost = kind === "sentry" ? 18 : 28;
  const maximum = kind === "sentry" ? 4 : 2;
  if (state.player.scrap < cost || state.towers.filter((tower) => tower.kind === kind).length >= maximum) {
    emit(state, "buildDenied", { kind });
    return;
  }
  state.player.scrap -= cost;
  const angle = state.player.angle + Math.PI;
  state.towers.push({
    id: uid(state, kind),
    kind,
    x: clamp(state.player.x + Math.cos(angle) * 44, 70, GAME_WIDTH - 70),
    y: clamp(state.player.y + Math.sin(angle) * 44, 62, GAME_HEIGHT - 62),
    angle: 0,
    life: kind === "sentry" ? state.player.stats.sentryDuration : 22,
    maxLife: kind === "sentry" ? state.player.stats.sentryDuration : 22,
    cooldown: 0.15,
    disabled: 0,
    pulse: 0,
  });
  state.profile.towerBuilds += 1;
  state.runStats.towersBuilt += 1;
  addParticles(state, state.player.x, state.player.y, "#ffc857", 12, 120);
  emit(state, "build", { kind });
}

function updateTowers(state, dt) {
  for (const tower of state.towers) {
    tower.life -= dt;
    tower.cooldown -= dt;
    tower.disabled = Math.max(0, tower.disabled - dt);
    tower.pulse = Math.max(0, tower.pulse - dt);
    if (tower.disabled > 0) continue;
    if (tower.kind === "sentry") {
      const target = nearestEnemy(state, tower, 330);
      if (target) tower.angle += normalizeAngle(Math.atan2(target.y - tower.y, target.x - tower.x) - tower.angle) * Math.min(1, dt * 14);
      if (target && tower.cooldown <= 0) {
        const angle = tower.angle;
        state.projectiles.push({
          id: uid(state, "tower-shot"),
          x: tower.x + Math.cos(angle) * 18,
          y: tower.y + Math.sin(angle) * 18,
          vx: Math.cos(angle) * 590,
          vy: Math.sin(angle) * 590,
          angle,
          damage: state.player.stats.sentryDamage,
          life: 0.8,
          radius: 3,
          pierce: 0,
          hit: new Set(),
          source: "tower",
          color: "#ffc857",
        });
        tower.cooldown = 0.42;
        emit(state, "towerShot");
      }
    } else if (tower.cooldown <= 0) {
      tower.cooldown = 3.2;
      tower.pulse = 0.45;
      for (const enemy of state.enemies) {
        if (!enemy.dead && distance(tower, enemy) < 175) {
          dealEnemyDamage(state, enemy, 17, "tower");
          enemy.slow = 2.2;
        }
      }
      state.beams.push({ x1: tower.x, y1: tower.y, x2: tower.x, y2: tower.y, radius: 175, life: 0.35, color: "#ffc857", width: 4, ring: true });
      emit(state, "empPulse");
    }
  }
  state.towers = state.towers.filter((tower) => tower.life > 0);
}

function normalizeAngle(angle) {
  let value = angle;
  while (value > Math.PI) value -= TAU;
  while (value < -Math.PI) value += TAU;
  return value;
}

function updatePlayer(state, input, dt) {
  const player = state.player;
  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  player.dashRemaining = Math.max(0, player.dashRemaining - dt);
  player.invulnerability = Math.max(0, player.invulnerability - dt);
  player.hitFlash = Math.max(0, player.hitFlash - dt);
  player.fireCooldown -= dt;
  player.arcCooldown -= dt;
  player.droneCooldown -= dt;

  let moveX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let moveY = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const magnitude = Math.hypot(moveX, moveY);
  if (magnitude > 0) {
    moveX /= magnitude;
    moveY /= magnitude;
    player.targetAngle = Math.atan2(moveY, moveX);
  }
  if (input.dashPressed && player.dashCooldown <= 0) {
    const dashX = magnitude ? moveX : Math.cos(player.angle);
    const dashY = magnitude ? moveY : Math.sin(player.angle);
    player.vx = dashX * 720;
    player.vy = dashY * 720;
    player.dashRemaining = 0.16;
    player.dashCooldown = player.stats.dashCooldown;
    player.invulnerability = 0.24;
    emit(state, "dash");
  }

  if (player.dashRemaining <= 0) {
    const targetVx = moveX * player.speed;
    const targetVy = moveY * player.speed;
    const ease = 1 - Math.exp(-dt * (magnitude ? 13 : 18));
    player.vx += (targetVx - player.vx) * ease;
    player.vy += (targetVy - player.vy) * ease;
  }
  const previous = { x: player.x, y: player.y };
  player.x = clamp(player.x + player.vx * dt, 62, GAME_WIDTH - 62);
  player.y = clamp(player.y + player.vy * dt, 54, GAME_HEIGHT - 54);
  state.profile.distance += distance(previous, player);
  if (Math.hypot(player.vx, player.vy) > 18) player.targetAngle = Math.atan2(player.vy, player.vx);
  player.angle += normalizeAngle(player.targetAngle - player.angle) * Math.min(1, dt * 15);

  if (input.deploySentryPressed) deployTower(state, "sentry");
  if (input.deployEmpPressed) deployTower(state, "emp");
  if (player.fireCooldown <= 0) firePlayerWeapon(state);
  if (player.arcCooldown <= 0) fireArc(state);
  fireDrone(state);
}

function updateProjectiles(state, dt) {
  for (const projectile of state.projectiles) {
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.life -= dt;
    for (const enemy of state.enemies) {
      if (enemy.dead || projectile.hit.has(enemy.id)) continue;
      if (distance(projectile, enemy) < projectile.radius + enemy.radius) {
        projectile.hit.add(enemy.id);
        dealEnemyDamage(state, enemy, projectile.damage, projectile.source);
        addParticles(state, projectile.x, projectile.y, projectile.color, 4, 100);
        emit(state, "enemyHit", { source: projectile.source });
        if (projectile.pierce > 0) projectile.pierce -= 1;
        else {
          projectile.life = 0;
          break;
        }
      }
    }
  }
  state.projectiles = state.projectiles.filter((projectile) => projectile.life > 0 && projectile.x > 20 && projectile.x < GAME_WIDTH - 20 && projectile.y > 20 && projectile.y < GAME_HEIGHT - 20);
}

function damagePlayer(state, amount) {
  const player = state.player;
  if (player.invulnerability > 0 || state.status !== "running") return;
  player.hp -= amount;
  player.invulnerability = 0.42;
  player.hitFlash = 0.18;
  state.shake = Math.max(state.shake, 0.42);
  state.dangerPulse = 0.55;
  addParticles(state, player.x, player.y, "#ff4964", 11, 180);
  emit(state, "playerHit");
  if (player.hp <= 0) {
    player.hp = 0;
    state.status = "defeat";
    emit(state, "defeat");
  }
}

function fireEnemyShot(state, enemy, target) {
  const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
  const count = enemy.boss ? 5 : 1;
  for (let index = 0; index < count; index += 1) {
    const shotAngle = angle + (index - (count - 1) / 2) * 0.13;
    state.enemyShots.push({
      x: enemy.x + Math.cos(shotAngle) * enemy.radius,
      y: enemy.y + Math.sin(shotAngle) * enemy.radius,
      vx: Math.cos(shotAngle) * (enemy.boss ? 280 : 230),
      vy: Math.sin(shotAngle) * (enemy.boss ? 280 : 230),
      angle: shotAngle,
      radius: enemy.boss ? 7 : 5,
      damage: enemy.damage,
      life: 3,
      color: enemy.hacker ? "#bd72ff" : "#ff4964",
    });
  }
  emit(state, "enemyShot");
}

function updateEnemies(state, dt) {
  const player = state.player;
  for (let index = 0; index < state.enemies.length; index += 1) {
    const enemy = state.enemies[index];
    if (enemy.dead) continue;
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    enemy.slow = Math.max(0, enemy.slow - dt);
    enemy.contactCooldown = Math.max(0, enemy.contactCooldown - dt);
    enemy.orbitCooldown = Math.max(0, (enemy.orbitCooldown || 0) - dt);
    enemy.attackCooldown -= dt;

    let target = player;
    if (enemy.hacker && state.towers.length) {
      target = state.towers.reduce((best, tower) => distance(enemy, tower) < distance(enemy, best) ? tower : best, state.towers[0]);
      if (distance(enemy, target) < 130 && enemy.attackCooldown <= 0) {
        target.disabled = 4.8;
        enemy.attackCooldown = 3.2;
        state.beams.push({ x1: enemy.x, y1: enemy.y, x2: target.x, y2: target.y, life: 0.42, color: "#b77cff", width: 4 });
        emit(state, "towerHacked");
      }
    }
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const targetDistance = Math.hypot(dx, dy) || 1;
    const desiredAngle = Math.atan2(dy, dx);
    enemy.angle += normalizeAngle(desiredAngle - enemy.angle) * Math.min(1, dt * 7);
    let desiredSpeed = enemy.speed * (enemy.slow > 0 ? 0.48 : 1);
    if (enemy.ranged && target === player && targetDistance < (enemy.boss ? 330 : 255)) desiredSpeed *= -0.24;
    if (enemy.ranged && target === player && targetDistance > 430) desiredSpeed *= 1.1;
    let separationX = 0;
    let separationY = 0;
    for (let otherIndex = Math.max(0, index - 6); otherIndex < Math.min(state.enemies.length, index + 7); otherIndex += 1) {
      const other = state.enemies[otherIndex];
      if (other === enemy || other.dead) continue;
      const apart = distance(enemy, other);
      const minimum = enemy.radius + other.radius + 3;
      if (apart > 0 && apart < minimum) {
        separationX += (enemy.x - other.x) / apart * (minimum - apart) * 5;
        separationY += (enemy.y - other.y) / apart * (minimum - apart) * 5;
      }
    }
    const targetVx = Math.cos(desiredAngle) * desiredSpeed + separationX;
    const targetVy = Math.sin(desiredAngle) * desiredSpeed + separationY;
    const moveEase = 1 - Math.exp(-dt * 5.5);
    enemy.vx += (targetVx - enemy.vx) * moveEase;
    enemy.vy += (targetVy - enemy.vy) * moveEase;
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;

    if (enemy.ranged && target === player && targetDistance < (enemy.boss ? 520 : 410) && enemy.attackCooldown <= 0) {
      fireEnemyShot(state, enemy, player);
      enemy.attackCooldown = enemy.boss ? 1.45 : 2.1 + state.random() * 0.6;
    }
    if (target === player && targetDistance < player.radius + enemy.radius + 3 && enemy.contactCooldown <= 0) {
      damagePlayer(state, enemy.damage);
      enemy.contactCooldown = 0.85;
      enemy.vx *= -1.2;
      enemy.vy *= -1.2;
    }
  }
  state.enemies = state.enemies.filter((enemy) => !enemy.dead);
}

function updateEnemyShots(state, dt) {
  for (const shot of state.enemyShots) {
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.life -= dt;
    if (distance(shot, state.player) < shot.radius + state.player.radius) {
      damagePlayer(state, shot.damage);
      shot.life = 0;
    }
  }
  state.enemyShots = state.enemyShots.filter((shot) => shot.life > 0 && shot.x > 10 && shot.x < GAME_WIDTH - 10 && shot.y > 10 && shot.y < GAME_HEIGHT - 10);
}

function updateGems(state, dt) {
  for (const gem of state.gems) {
    gem.age += dt;
    gem.life -= dt;
    gem.vx *= Math.pow(0.02, dt);
    gem.vy *= Math.pow(0.02, dt);
    const currentDistance = distance(gem, state.player);
    const magnetRange = gem.age > 1.35 ? 2400 : state.player.stats.magnet;
    if (currentDistance < magnetRange) {
      const acceleration = gem.age > 1.35
        ? 520 + Math.min(900, currentDistance * 1.2)
        : 900 * (1 - currentDistance / magnetRange) + 240;
      gem.vx += (state.player.x - gem.x) / Math.max(1, currentDistance) * acceleration * dt;
      gem.vy += (state.player.y - gem.y) / Math.max(1, currentDistance) * acceleration * dt;
    }
    gem.x += gem.vx * dt;
    gem.y += gem.vy * dt;
    if (currentDistance < state.player.radius + 10) {
      state.player.xp += gem.value;
      state.player.scrap += gem.scrap;
      gem.life = 0;
      emit(state, "collect");
    }
  }
  state.gems = state.gems.filter((gem) => gem.life > 0);
  if (state.player.xp >= state.player.xpNext && state.status === "running") {
    state.player.xp -= state.player.xpNext;
    state.player.level += 1;
    state.player.xpNext = Math.round(state.player.xpNext * 1.26 + 4);
    state.pendingUpgradeChoices = getUpgradeChoices(state);
    if (state.pendingUpgradeChoices.length) {
      state.status = "upgrade";
      emit(state, "levelUp", { choices: state.pendingUpgradeChoices });
    }
  }
}

function updateEffects(state, dt) {
  for (const particle of state.particles) {
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= Math.pow(0.08, dt);
    particle.vy *= Math.pow(0.08, dt);
    particle.life -= dt;
  }
  state.particles = state.particles.filter((particle) => particle.life > 0);
  for (const beam of state.beams) beam.life -= dt;
  state.beams = state.beams.filter((beam) => beam.life > 0);
  for (const text of state.texts) {
    text.y -= 30 * dt;
    text.life -= dt;
  }
  state.texts = state.texts.filter((text) => text.life > 0);
  state.shake = Math.max(0, state.shake - dt * 2.8);
  state.counterFlash = Math.max(0, state.counterFlash - dt);
  state.dangerPulse = Math.max(0, state.dangerPulse - dt);
}

function updateSpawner(state, dt) {
  state.spawnCooldown -= dt;
  if (state.spawnCooldown <= 0 && !state.bossSpawned && state.enemies.length < 90) {
    const baseInterval = Math.max(0.16, 0.58 - state.time * 0.0012);
    const baseGroup = state.wave === 1 ? 1 : Math.min(6, state.wave + 1);
    const group = state.counter.id === "rush" ? baseGroup + 2 : baseGroup;
    const gate = Math.floor(state.random() * GATE_POINTS.length);
    for (let index = 0; index < group; index += 1) spawnEnemy(state, null, (gate + index) % GATE_POINTS.length);
    state.spawnCooldown = baseInterval * (0.78 + state.random() * 0.58);
  }
  if (!state.bossSpawned && state.time >= state.duration - 42) {
    state.bossSpawned = true;
    spawnEnemy(state, "boss", 0);
    emit(state, "bossSpawn");
  }
}

function updateAdaptation(state) {
  if (state.time < state.nextAdaptation) return;
  const protocol = analyzeBuild(state.profile);
  state.counter = protocol;
  state.counterIndex += 1;
  state.counterFlash = 3.8;
  state.runStats.counters.push(protocol.id);
  state.nextAdaptation += 40;
  resetProfileWindow(state);
  emit(state, "counter", { protocol });
}

export function stepGame(state, input, rawDt) {
  const dt = clamp(rawDt, 0, 0.034);
  updateEffects(state, dt);
  if (state.status !== "running") return state;
  state.time += dt;
  state.timeLeft = Math.max(0, state.duration - state.time);
  state.wave = 1 + Math.floor(state.time / 25);
  state.runStats.highestWave = Math.max(state.runStats.highestWave, state.wave);
  state.profile.window += dt;
  updatePlayer(state, input, dt);
  updateSpawner(state, dt);
  updateProjectiles(state, dt);
  updateOrbitBlades(state, dt);
  updateTowers(state, dt);
  updateEnemies(state, dt);
  updateEnemyShots(state, dt);
  updateGems(state, dt);
  updateAdaptation(state);
  if (state.time >= state.duration && state.bossSpawned && !state.enemies.some((enemy) => enemy.boss)) {
    state.status = "victory";
    emit(state, "victory");
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

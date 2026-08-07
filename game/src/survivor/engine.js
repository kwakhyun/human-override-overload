import {
  ENEMY_TYPES,
  GAME_HEIGHT,
  GAME_WIDTH,
  HERO_ARCHETYPES,
  REGIONS,
  RUN_DURATION,
  SHOP_ITEMS,
  getShopItemCost,
} from "./data.js";

const TAU = Math.PI * 2;
const ZONE_PADDING = 34;

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
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
  return {
    status: "running",
    paused: false,
    random,
    duration,
    time: 0,
    timeLeft: duration,
    wave: 1,
    entityId: 0,
    controlledZoneId: null,
    gold: 92,
    zones,
    heroes: REGIONS.map(createHero),
    enemies: [],
    projectiles: [],
    enemyShots: [],
    towers: [],
    beams: [],
    particles: [],
    texts: [],
    bossSpawnedByZone: REGIONS.map(() => false),
    runStats: {
      kills: 0,
      goldEarned: 0,
      goldSpent: 0,
      zonesLost: 0,
      invasions: 0,
      killsByZone: REGIONS.map(() => 0),
      purchases: 0,
    },
    events: [],
    shake: 0,
    dangerPulse: 0,
    invasionFlash: 0,
  };
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
  state.controlledZoneId = zoneId;
  emit(state, "focus", { zoneId });
  return true;
}

export function returnToOverview(state) {
  state.controlledZoneId = null;
  emit(state, "overview");
}

export function getHeroForZone(state, zoneId) {
  return state.heroes.find((hero) => hero.zoneId === zoneId) || null;
}

function addParticles(state, x, y, color, count = 7, speed = 110) {
  for (let index = 0; index < count; index += 1) {
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
  return state.zones[zoneId] || REGIONS[zoneId];
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
  const point = getSpawnPoint(state, zoneId, options.gateIndex);
  const waveScale = 1 + Math.max(0, state.wave - 1) * 0.095 + state.zones[targetZoneId].invasionLevel * 0.13;
  const elite = !config.boss && state.wave >= 5 && state.random() > 0.94;
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
    elite,
    attackCooldown: 0.7 + state.random() * 0.9,
    contactCooldown: 0,
    hitFlash: 0,
    slow: 0,
    dead: false,
  };
  state.enemies.push(enemy);
  return enemy;
}

function nearestEnemy(state, origin, range = Infinity, predicate = () => true) {
  let best = range;
  let target = null;
  for (const enemy of state.enemies) {
    if (enemy.dead || !predicate(enemy)) continue;
    const current = distance(origin, enemy);
    if (current < best) {
      best = current;
      target = enemy;
    }
  }
  return target;
}

function enemiesForZone(state, zoneId) {
  return state.enemies.filter((enemy) => !enemy.dead && enemy.targetZoneId === zoneId);
}

export function damageEnemy(state, enemy, amount, sourceZoneId = null, source = "weapon") {
  if (!enemy || enemy.dead) return 0;
  enemy.hp -= amount;
  enemy.hitFlash = 0.09;
  if (enemy.hp <= 0) killEnemy(state, enemy, sourceZoneId, source);
  return amount;
}

function killEnemy(state, enemy, sourceZoneId, source) {
  enemy.dead = true;
  state.gold += enemy.gold;
  state.runStats.kills += 1;
  state.runStats.goldEarned += enemy.gold;
  if (Number.isInteger(sourceZoneId) && state.heroes[sourceZoneId]) {
    state.heroes[sourceZoneId].kills += 1;
    state.runStats.killsByZone[sourceZoneId] += 1;
  }
  addText(state, enemy.x, enemy.y - enemy.radius, `+${enemy.gold}G`, "#ffd56b");
  addParticles(state, enemy.x, enemy.y, enemy.boss ? "#ffd36a" : state.zones[enemy.originZoneId].accent, enemy.boss ? 28 : 8, enemy.boss ? 240 : 130);
  state.shake = Math.max(state.shake, enemy.boss ? 0.75 : enemy.elite ? 0.2 : 0.06);
  emit(state, "enemyKilled", { enemy, gold: enemy.gold, source });
  emit(state, "goldEarned", { amount: enemy.gold });
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
    hit: new Set(),
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
    target = nearestEnemy(state, origin, 115, (enemy) => enemy.targetZoneId === hero.zoneId && !visited.has(enemy.id));
  }
  emit(state, "arc", { zoneId: hero.zoneId });
}

function fireHeroWeapon(state, hero) {
  const target = nearestEnemy(state, hero, hero.stats.range, (enemy) => enemy.targetZoneId === hero.zoneId);
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
  const target = nearestEnemy(state, origin, 230 + level * 20, (enemy) => enemy.targetZoneId === hero.zoneId);
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
      const target = nearestEnemy(state, tower, 205 + tower.level * 24, (enemy) => enemy.targetZoneId === tower.zoneId);
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
        if (!enemy.dead && enemy.targetZoneId === tower.zoneId && distance(tower, enemy) < radius) {
          damageEnemy(state, enemy, 10 + tower.level * 5, tower.ownerZoneId, "emp");
          enemy.slow = 2.1 + tower.level * 0.35;
        }
      }
      state.beams.push({ x1: tower.x, y1: tower.y, x2: tower.x, y2: tower.y, radius, ring: true, color: "#b97cff", width: 3.5, life: 0.4 });
      emit(state, "empPulse", { zoneId: tower.zoneId });
    }
  }
  state.towers = state.towers.filter((tower) => tower.life > 0 && state.zones[tower.zoneId].status === "active");
}

function getAiMovement(state, hero) {
  const zone = state.zones[hero.zoneId];
  const target = nearestEnemy(state, hero, 330, (enemy) => enemy.targetZoneId === hero.zoneId);
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
  const crowd = enemiesForZone(state, hero.zoneId).filter((enemy) => distance(hero, enemy) < 88).length;
  let forward = length > hero.stats.range * 0.72 ? 0.62 : length < 92 ? -1 : 0;
  if (crowd >= 3) forward = -1;
  const strafe = Math.sin(state.time * 1.7 + hero.zoneId * 2.2) * 0.72;
  return {
    x: dx / length * forward + -dy / length * strafe,
    y: dy / length * forward + dx / length * strafe,
    target,
    crowd,
  };
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
  hero.hp = Math.min(hero.maxHp, hero.hp + hero.stats.regen * dt);
  hero.shield = Math.max(0, hero.shield - dt * 0.7);

  const manuallyControlled = state.controlledZoneId === hero.zoneId;
  let moveX = 0;
  let moveY = 0;
  let crowd = 0;
  if (manuallyControlled) {
    moveX = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    moveY = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  } else {
    const ai = getAiMovement(state, hero);
    moveX = ai.x;
    moveY = ai.y;
    crowd = ai.crowd || 0;
  }
  const magnitude = Math.hypot(moveX, moveY);
  if (magnitude > 1) {
    moveX /= magnitude;
    moveY /= magnitude;
  }

  const wantsDash = manuallyControlled ? input.dashPressed : crowd >= 4;
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
    const threatCount = enemiesForZone(state, hero.zoneId).filter((enemy) => distance(hero, enemy) < 185).length;
    if (threatCount >= 7 && hero.upgrades.sentry && hero.sentryCooldown <= 0) deployTower(state, hero, "sentry");
    if (threatCount >= 10 && hero.upgrades.emp && hero.empCooldown <= 0) deployTower(state, hero, "emp");
  }
  if (hero.fireCooldown <= 0) fireHeroWeapon(state, hero);
  updateDrone(state, hero);
}

function updateProjectiles(state, dt) {
  for (const projectile of state.projectiles) {
    projectile.x += projectile.vx * dt;
    projectile.y += projectile.vy * dt;
    projectile.life -= dt;
    for (const enemy of state.enemies) {
      if (enemy.dead || projectile.hit.has(enemy.id)) continue;
      if (distance(projectile, enemy) <= projectile.radius + enemy.radius) {
        projectile.hit.add(enemy.id);
        damageEnemy(state, enemy, projectile.damage, projectile.ownerZoneId, projectile.source);
        addParticles(state, projectile.x, projectile.y, projectile.color, 4, 82);
        emit(state, "enemyHit", { source: projectile.source });
        if (projectile.pierce > 0) projectile.pierce -= 1;
        else {
          projectile.life = 0;
          break;
        }
      }
    }
  }
  state.projectiles = state.projectiles.filter((shot) => shot.life > 0 && shot.x > -30 && shot.x < GAME_WIDTH + 30 && shot.y > -30 && shot.y < GAME_HEIGHT + 30);
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
  if (state.controlledZoneId === zoneId) state.controlledZoneId = null;
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
  const count = enemy.boss ? 3 : 1;
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
      damage: enemy.damage,
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

function updateEnemies(state, dt) {
  for (let index = 0; index < state.enemies.length; index += 1) {
    const enemy = state.enemies[index];
    if (enemy.dead) continue;
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
    enemy.contactCooldown = Math.max(0, enemy.contactCooldown - dt);
    enemy.attackCooldown -= dt;
    enemy.slow = Math.max(0, enemy.slow - dt);
    let hero = state.heroes[enemy.targetZoneId];
    if (!hero || hero.dead) hero = retargetEnemy(state, enemy);
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
  state.enemies = state.enemies.filter((enemy) => !enemy.dead);
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
  state.enemyShots = state.enemyShots.filter((shot) => shot.life > 0 && shot.x > -40 && shot.x < GAME_WIDTH + 40 && shot.y > -40 && shot.y < GAME_HEIGHT + 40);
}

function updateSpawner(state, dt) {
  if (state.enemies.length > 128) return;
  for (const zone of state.zones) {
    zone.spawnCooldown -= dt;
    if (zone.spawnCooldown > 0) continue;
    if (zone.status === "active") {
      const group = Math.min(4, 1 + Math.floor(state.wave / 3) + Math.floor(zone.invasionLevel / 2));
      for (let index = 0; index < group; index += 1) spawnEnemy(state, null, zone.id);
      const base = Math.max(0.72, 1.45 - state.wave * 0.07 - zone.invasionLevel * 0.09);
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
  if (state.time >= state.duration - 42) {
    for (const zone of state.zones) {
      if (zone.status === "active" && !state.bossSpawnedByZone[zone.id]) {
        state.bossSpawnedByZone[zone.id] = true;
        spawnEnemy(state, "boss", zone.id);
        emit(state, "bossSpawn", { zoneId: zone.id });
      }
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
    text.y -= 24 * dt;
    text.life -= dt;
  }
  state.texts = state.texts.filter((text) => text.life > 0);
  state.shake = Math.max(0, state.shake - dt * 3);
  state.dangerPulse = Math.max(0, state.dangerPulse - dt);
  state.invasionFlash = Math.max(0, state.invasionFlash - dt);
}

function updatePressure(state) {
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
  updateEffects(state, dt);
  if (state.status !== "running") return state;
  state.time += dt;
  state.timeLeft = Math.max(0, state.duration - state.time);
  state.wave = 1 + Math.floor(state.time / 34);
  for (const hero of state.heroes) updateHero(state, hero, input, dt);
  updateSpawner(state, dt);
  updateTowers(state, dt);
  updateProjectiles(state, dt);
  updateEnemies(state, dt);
  updateEnemyShots(state, dt);
  updatePressure(state);
  if (state.time >= state.duration && livingZoneIds(state).length) {
    state.status = "victory";
    emit(state, "victory");
  }
  return state;
}

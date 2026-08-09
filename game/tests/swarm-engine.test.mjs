import assert from "node:assert/strict";
import test from "node:test";
import {
  BOSS_PATTERNS,
  GAME_HEIGHT,
  GAME_WIDTH,
  chooseLevelReward,
  clearPressedInput,
  createSwarmInput,
  createSwarmState,
  drainSwarmEvents,
  getSwarmHud,
  setSwarmAim,
  setSwarmScreenAim,
  stepSwarm,
} from "../src/swarm/engine.js";

function stepFor(state, input, seconds, beforeStep) {
  const frames = Math.ceil(seconds * 60);
  for (let frame = 0; frame < frames; frame += 1) {
    beforeStep?.(state, frame);
    stepSwarm(state, input, 1 / 60);
    clearPressedInput(input);
    if (state.status !== "running" || state.levelupPending) break;
  }
}

function forceOffer(state, id, category) {
  state.levelupPending = true;
  state.rewardOptions = [{ id, category, name: id, description: "test", level: 0, nextLevel: 1 }];
}

function createBossState(patternIndex = 0) {
  const state = createSwarmState({ random: () => 0.5 });
  state.phase = "boss";
  state.phaseTime = 0;
  state.enemies.length = 0;
  state.projectiles.length = 0;
  state.enemyProjectiles.length = 0;
  state.boss.active = true;
  state.boss.patternIndex = patternIndex;
  state.boss.patternCooldown = 0;
  state.player.x = 550;
  state.player.y = 360;
  state.player.invulnerability = 0;
  return state;
}

test("the renewed mode has one hero, no regions, and a fixed 300-unit assault", () => {
  const state = createSwarmState({ random: () => 0.5 });
  assert.equal(GAME_WIDTH, 1280);
  assert.equal(GAME_HEIGHT, 720);
  assert.equal(state.mode, "swarm");
  assert.equal(state.phase, "swarm");
  assert.equal(state.player.name, "THE TRAINER");
  assert.equal(state.enemyBudget, 300);
  assert.equal("zones" in state, false);
  assert.equal("heroes" in state, false);
});

test("the game opens with an immediately visible mass of three enemy families and elites", () => {
  const state = createSwarmState({ random: () => 0.37 });
  assert.ok(state.enemies.length >= 72);
  assert.ok(state.enemies.length <= 170);
  assert.deepEqual(new Set(state.enemies.map((enemy) => enemy.type)), new Set(["hunter", "suppressor", "brute"]));
  assert.ok(state.enemies.some((enemy) => enemy.elite));
  assert.ok(state.enemies.every((enemy) => enemy.hp > 0 && Number.isFinite(enemy.x) && Number.isFinite(enemy.y)));
});

test("every initial attacker enters through one of the map art's four open gate corridors", () => {
  const state = createSwarmState({ random: (() => {
    let value = 0;
    return () => ((value = (value + 0.137) % 1));
  })() });
  const belongsToGate = (enemy) => {
    const verticalGate = enemy.x >= 565 && enemy.x <= 715
      && (enemy.y >= 44 && enemy.y <= 68 || enemy.y >= 652 && enemy.y <= 676);
    const horizontalGate = enemy.y >= 300 && enemy.y <= 420
      && (enemy.x >= 44 && enemy.x <= 68 || enemy.x >= 1212 && enemy.x <= 1236);
    return verticalGate || horizontalGate;
  };
  assert.equal(state.enemies.length, 84);
  assert.ok(state.enemies.every(belongsToGate));
  const occupiedSides = new Set(state.enemies.map((enemy) => {
    if (enemy.y < 100) return "top";
    if (enemy.y > 620) return "bottom";
    if (enemy.x < 100) return "left";
    return "right";
  }));
  assert.deepEqual(occupiedSides, new Set(["top", "right", "bottom", "left"]));
});

test("pulse fire is automatic toward the pointer aim without a click field", () => {
  const state = createSwarmState({ random: () => 0.5 });
  const input = createSwarmInput();
  assert.equal("pointerDown" in input, false);
  setSwarmAim(state, 1100, 360);
  stepSwarm(state, input, 1 / 60);
  assert.ok(state.projectiles.some((projectile) => projectile.kind === "pulse"));
  assert.ok(state.projectiles[0].vx > 0);
  assert.ok(state.stats.shots > 0);
  assert.ok(drainSwarmEvents(state).some((event) => event.type === "shot"));
});

test("movement and dash stay on the map art's open elliptical floor", () => {
  const state = createSwarmState({ random: () => 0.5 });
  const input = createSwarmInput();
  input.up = true;
  input.right = true;
  input.dashPressed = true;
  stepSwarm(state, input, 1 / 60);
  assert.ok(state.player.dashCooldown > 0);
  clearPressedInput(input);
  stepFor(state, input, 4);
  const rx = 555 - state.player.radius;
  const ry = 292 - state.player.radius;
  const normalized = ((state.player.x - 640) ** 2) / (rx ** 2) + ((state.player.y - 360) ** 2) / (ry ** 2);
  assert.ok(normalized <= 1.000001, `player escaped floor: ${normalized}`);
});

test("phase dash grants enough invulnerability to cross the boss arena ring", () => {
  const state = createBossState(3);
  const input = createSwarmInput();
  state.player.x = state.boss.x - 104;
  state.player.y = state.boss.y;
  input.left = true;
  stepFor(state, input, 1.04);
  const hp = state.player.hp;
  input.dashPressed = true;
  stepSwarm(state, input, 1 / 60);
  assert.ok(state.player.invulnerability >= 0.42);
  clearPressedInput(input);
  stepFor(state, input, 0.5);
  assert.equal(state.player.hp, hp);
});

test("F recalls all four legacy front allies for autonomous combat", () => {
  const state = createSwarmState({ random: () => 0.5 });
  const input = createSwarmInput();
  input.supportPressed = true;
  stepSwarm(state, input, 1 / 60);
  clearPressedInput(input);
  const recalled = state.allies.filter((ally) => ally.summoned);
  assert.deepEqual(new Set(recalled.map((ally) => ally.type)), new Set(["vanguard", "gunner", "arcanist", "warden"]));
  assert.equal(recalled.length, 4);
  assert.ok(state.support.squadDuration > 11.9);
  assert.ok(state.support.squadCooldown > 29.9);
  assert.equal(state.stats.squadCalls, 1);
  assert.ok(state.projectiles.some((projectile) => ["aegisEcho", "rookScatter", "mossHeavy"].includes(projectile.kind)));
  assert.ok(drainSwarmEvents(state).some((event) => event.type === "squadSummon"));

  input.supportPressed = true;
  stepSwarm(state, input, 1 / 60);
  assert.equal(state.allies.filter((ally) => ally.summoned).length, 4);
  assert.equal(state.stats.squadCalls, 1);
  const hud = getSwarmHud(state);
  assert.equal(hud.abilities.squadRecall.key, "F");
  assert.ok(hud.abilities.squadRecall.duration > 0);
});

test("the opening grace window prevents damage for 2.4 seconds, then enemies can hurt the player", () => {
  const state = createSwarmState({ random: () => 0.5 });
  const enemy = state.enemies.find((candidate) => candidate.type === "hunter" && !candidate.elite);
  state.enemies = [enemy];
  state.spawnedEnemies = state.enemyBudget;
  enemy.x = state.player.x;
  enemy.y = state.player.y;
  enemy.speed = 0;
  enemy.hp = 999999;
  enemy.maxHp = enemy.hp;
  enemy.damage = 25;
  enemy.attackCooldown = 0;
  const initialHp = state.player.hp;
  assert.equal(initialHp, 280);
  assert.equal(state.player.invulnerability, 2.5);
  stepFor(state, createSwarmInput(), 2.4);
  assert.equal(state.player.hp, initialHp);
  stepFor(state, createSwarmInput(), 0.8);
  assert.ok(state.player.hp < initialHp);
});

test("common enemies die in one to three base pulse hits and produce collectible XP", () => {
  for (const [type, expectedMaxHits] of [["hunter", 1], ["suppressor", 2], ["brute", 3]]) {
    const state = createSwarmState({ random: () => 0.5 });
    const enemy = state.enemies.find((candidate) => candidate.type === type && !candidate.elite);
    state.enemies = [enemy];
    state.spawnedEnemies = state.enemyBudget;
    enemy.x = state.player.x + 58;
    enemy.y = state.player.y;
    enemy.speed = 0;
    setSwarmAim(state, enemy.x, enemy.y);
    stepFor(state, createSwarmInput(), expectedMaxHits * 0.18 + 0.3);
    assert.equal(enemy.dead, true, `${type} should die in <= ${expectedMaxHits} hits`);
    assert.equal(state.stats.kills, 1);
    stepFor(state, createSwarmInput(), 1.3);
    assert.ok(state.player.xp >= enemy.xp);
  }
});

test("a level-up pauses combat and always offers one weapon, skill, and ally", () => {
  const state = createSwarmState({ random: () => 0.5 });
  const enemy = state.enemies.find((candidate) => !candidate.elite);
  state.enemies = [enemy];
  state.spawnedEnemies = state.enemyBudget;
  enemy.x = state.player.x + 42;
  enemy.y = state.player.y;
  enemy.speed = 0;
  enemy.hp = 1;
  enemy.xp = state.player.nextXp;
  setSwarmAim(state, enemy.x, enemy.y);
  stepFor(state, createSwarmInput(), 1.5);
  assert.equal(state.levelupPending, true);
  assert.deepEqual(state.rewardOptions.map((option) => option.category).sort(), ["ally", "skill", "weapon"]);
  const pausedAt = state.time;
  stepSwarm(state, createSwarmInput(), 1 / 30);
  assert.equal(state.time, pausedAt);
  assert.equal(getSwarmHud(state).rewards.pending, true);
});

test("weapon rewards add real scatter, rail, rocket, and orbit combat behavior", () => {
  for (const id of ["scatter", "rail", "rocket"]) {
    const state = createSwarmState({ random: () => 0.5 });
    forceOffer(state, id, "weapon");
    assert.equal(chooseLevelReward(state, id), true);
    setSwarmAim(state, 1100, 360);
    stepSwarm(state, createSwarmInput(), 1 / 60);
    assert.ok(state.projectiles.some((projectile) => projectile.kind === id), `${id} did not fire`);
  }
  const orbitState = createSwarmState({ random: () => 0.5 });
  const target = orbitState.enemies.find((enemy) => !enemy.elite);
  orbitState.enemies = [target];
  orbitState.spawnedEnemies = orbitState.enemyBudget;
  target.x = orbitState.player.x + 68;
  target.y = orbitState.player.y;
  target.speed = 0;
  forceOffer(orbitState, "orbit", "weapon");
  chooseLevelReward(orbitState, "orbit");
  const hp = target.hp;
  stepFor(orbitState, createSwarmInput(), 0.2);
  assert.ok(target.hp < hp || target.dead, "orbit blade did not damage its contact target");
});

test("skill rewards materially change damage, fire rate, multishot, shield, dash, and regeneration", () => {
  const checks = {
    damage(state) { assert.ok(state.player.damageMultiplier > 1); },
    fireRate(state) { assert.ok(state.player.fireRateMultiplier < 1); },
    multishot(state) { assert.equal(state.player.multishot, 2); },
    shield(state) { assert.equal(state.player.shield, 40); },
    dash(state) { assert.ok(state.player.dashMax < 2.35); },
    regen(state) { assert.ok(state.player.regen > 0); },
  };
  for (const [id, check] of Object.entries(checks)) {
    const state = createSwarmState({ random: () => 0.5 });
    forceOffer(state, id, "skill");
    assert.equal(chooseLevelReward(state, id), true);
    check(state);
  }
});

test("screen-space aiming is converted through the player-following zoom camera", () => {
  const state = createSwarmState({ random: () => 0.5 });
  state.camera.x = 700;
  state.camera.y = 330;
  state.camera.zoom = 1.6;
  assert.equal(setSwarmScreenAim(state, 800, 360), true);
  assert.equal(state.aim.x, 800);
  assert.equal(state.aim.y, 330);
});

test("fixed-time mass waves warn before rapidly deploying all remaining enemies", () => {
  const state = createSwarmState({ random: () => 0.5 });
  for (const enemy of state.enemies) {
    enemy.hp = 999999;
    enemy.maxHp = enemy.hp;
    enemy.speed = 0;
    enemy.damage = 0;
  }
  drainSwarmEvents(state);
  stepFor(state, createSwarmInput(), 6.2);
  const warning = drainSwarmEvents(state).find((event) => event.type === "surgeWarning");
  assert.equal(warning.wave, 1);
  assert.equal(warning.count, 48);
  assert.ok(getSwarmHud(state).surge.warning.startsIn > 0);
  stepFor(state, createSwarmInput(), 1.5);
  const surgeEvents = drainSwarmEvents(state);
  assert.ok(surgeEvents.some((event) => event.type === "surgeStart"));
  assert.ok(state.spawnedEnemies > 84);
  assert.ok(getSwarmHud(state).surge.active || state.surgeQueued === 0);
});

test("airstrike and omega laser are long-cooldown attacks with real area damage", () => {
  const airstrike = createSwarmState({ random: () => 0.5 });
  const strikeTarget = airstrike.enemies.find((enemy) => !enemy.elite);
  airstrike.enemies = [strikeTarget];
  airstrike.spawnedEnemies = airstrike.enemyBudget;
  strikeTarget.x = airstrike.player.x + 80;
  strikeTarget.y = airstrike.player.y;
  strikeTarget.speed = 0;
  strikeTarget.hp = 9999;
  strikeTarget.maxHp = strikeTarget.hp;
  forceOffer(airstrike, "airstrike", "skill");
  chooseLevelReward(airstrike, "airstrike");
  airstrike.support.airstrikeCooldown = 0;
  const strikeHp = strikeTarget.hp;
  stepFor(airstrike, createSwarmInput(), 1.6);
  assert.ok(strikeTarget.hp < strikeHp);
  assert.ok(airstrike.support.airstrikeCooldown > 10);
  assert.ok(drainSwarmEvents(airstrike).some((event) => event.type === "ultimateImpact"));

  const laser = createSwarmState({ random: () => 0.5 });
  const laserTarget = laser.enemies.find((enemy) => !enemy.elite);
  laser.enemies = [laserTarget];
  laser.spawnedEnemies = laser.enemyBudget;
  laserTarget.x = laser.player.x + 160;
  laserTarget.y = laser.player.y;
  laserTarget.speed = 0;
  laserTarget.hp = 9999;
  laserTarget.maxHp = laserTarget.hp;
  setSwarmAim(laser, laserTarget.x, laserTarget.y);
  forceOffer(laser, "omegaLaser", "skill");
  chooseLevelReward(laser, "omegaLaser");
  laser.support.laserCooldown = 0;
  const laserHp = laserTarget.hp;
  stepFor(laser, createSwarmInput(), 1.05);
  assert.ok(laserTarget.hp < laserHp);
  assert.ok(laser.support.laserCooldown > 15);
  assert.ok(drainSwarmEvents(laser).some((event) => event.type === "ultimateFire"));
});

test("rank-three offensive skills unlock their master-scale battlefield attack", () => {
  const state = createSwarmState({ random: () => 0.5 });
  for (let rank = 0; rank < 3; rank += 1) {
    forceOffer(state, "nova", "skill");
    assert.equal(chooseLevelReward(state, "nova"), true);
  }
  assert.equal(state.build.skills.nova, 3);
  assert.equal(state.stats.skillsMastered, 1);
  assert.ok(drainSwarmEvents(state).some((event) => event.type === "skillMastered"));
  state.support.novaCooldown = 0;
  stepSwarm(state, createSwarmInput(), 1 / 60);
  assert.ok(state.shockwaves.some((wave) => wave.maxRadius >= 390));
  assert.ok(state.shockwaves.length >= 2);
});

test("ally rewards create autonomous drone, sentry, and suppressor entities", () => {
  for (const id of ["drone", "sentry", "suppressor"]) {
    const state = createSwarmState({ random: () => 0.5 });
    forceOffer(state, id, "ally");
    assert.equal(chooseLevelReward(state, id), true);
    if (id === "sentry") assert.ok(state.deployables.some((entity) => entity.type === id));
    else assert.ok(state.allies.some((entity) => entity.type === id));
  }
});

test("clearing the fixed enemy budget transitions to The Wrong Engine after two seconds", () => {
  const state = createSwarmState({ random: () => 0.5 });
  state.spawnedEnemies = state.enemyBudget;
  state.killedEnemies = state.enemyBudget;
  state.stats.kills = state.enemyBudget;
  state.enemies.length = 0;
  stepSwarm(state, createSwarmInput(), 1 / 60);
  assert.equal(state.phaseTransition, 2);
  const clearHud = getSwarmHud(state);
  assert.equal(clearHud.totalEnemies, 300);
  assert.equal(clearHud.enemiesRemaining, 0);
  assert.equal(clearHud.remainingEnemies, 0);
  assert.equal(clearHud.swarmProgress, 1);
  assert.ok(drainSwarmEvents(state).some((event) => event.type === "swarmCleared"));
  stepFor(state, createSwarmInput(), 2.2);
  assert.equal(state.phase, "boss");
  assert.equal(state.boss.active, true);
  assert.equal(getSwarmHud(state).boss.name, "THE WRONG ENGINE");
  assert.ok(drainSwarmEvents(state).some((event) => event.type === "bossIntro"));
});

test("all six boss attacks expose their named warning before firing", () => {
  for (let index = 0; index < BOSS_PATTERNS.length; index += 1) {
    const state = createBossState(index);
    stepSwarm(state, createSwarmInput(), 1 / 60);
    assert.equal(state.boss.activePattern?.type, BOSS_PATTERNS[index]);
    assert.equal(state.boss.activePattern?.phase, "warning");
    const event = drainSwarmEvents(state).find((candidate) => candidate.type === "bossPatternTelegraph");
    assert.equal(event.pattern, BOSS_PATTERNS[index]);
  }
});

test("multi-charge rapidly relocks and rushes several times before exposing the core", () => {
  const state = createBossState(BOSS_PATTERNS.indexOf("multiCharge"));
  state.player.invulnerability = 10;
  stepFor(state, createSwarmInput(), 2.8);
  const events = drainSwarmEvents(state);
  const rushes = events.filter((event) => event.type === "bossPatternFire" && event.pattern === "multiCharge");
  const relocks = events.filter((event) => event.type === "bossPatternTelegraph" && event.pattern === "multiCharge");
  assert.equal(rushes.length, 3);
  assert.equal(relocks.length, 3);
  assert.equal(state.boss.activePattern, null);
  assert.ok(state.boss.weakness > 2.4);
  assert.ok(events.some((event) => event.type === "bossWeakness"));
});

test("charge locks a line warning before the boss begins its half-second rush", () => {
  const state = createBossState(4);
  stepSwarm(state, createSwarmInput(), 1 / 60);
  const warning = state.boss.activePattern;
  const startX = warning.originX;
  const startY = warning.originY;
  assert.equal(warning.type, "charge");
  assert.equal(warning.phase, "warning");
  assert.equal(warning.maxLife, 0.72);
  assert.ok(Number.isFinite(warning.targetX) && Number.isFinite(warning.targetY));
  assert.ok(warning.width >= 40);
  stepFor(state, createSwarmInput(), 0.62);
  assert.equal(state.boss.x, startX);
  assert.equal(state.boss.y, startY);
  assert.equal(state.boss.activePattern.phase, "warning");
  stepFor(state, createSwarmInput(), 0.14);
  assert.equal(state.boss.activePattern.phase, "active");
  assert.ok(state.boss.activePattern.chargeSpeed > 1000);
});

test("dodging charge makes the boss hit the arena boundary and exposes its core", () => {
  const state = createBossState(4);
  stepSwarm(state, createSwarmInput(), 1 / 60);
  const warning = state.boss.activePattern;
  const targetX = warning.targetX;
  const targetY = warning.targetY;
  state.player.x = 640;
  state.player.y = 150;
  stepFor(state, createSwarmInput(), 1.36);
  assert.equal(state.boss.activePattern, null);
  assert.ok(Math.abs(state.boss.x - targetX) < 0.001);
  assert.ok(Math.abs(state.boss.y - targetY) < 0.001);
  assert.ok(state.boss.weakness >= 2.8 && state.boss.weakness <= 3);
  assert.equal(state.boss.damageMultiplier, 2);
  const event = drainSwarmEvents(state).find((candidate) => candidate.type === "bossWeakness");
  assert.deepEqual({ duration: event.duration, multiplier: event.multiplier }, { duration: 3, multiplier: 2 });
  assert.equal(getSwarmHud(state).boss.damageMultiplier, 2);
});

test("charge collision deals heavy damage and denies the weakness window", () => {
  const state = createBossState(4);
  const hp = state.player.hp;
  stepFor(state, createSwarmInput(), 1.3);
  assert.ok(state.player.hp <= hp - 54);
  assert.equal(state.boss.weakness, 0);
  assert.equal(state.boss.activePattern, null);
  assert.ok(drainSwarmEvents(state).some((event) => event.type === "bossChargeHit"));
});

test("core exposure doubles real boss damage exactly and expires back to normal", () => {
  function pulseDamage(weakness) {
    const state = createBossState(0);
    state.boss.activePattern = null;
    state.boss.patternCooldown = 999;
    state.boss.x = state.player.x + 100;
    state.boss.y = state.player.y;
    state.boss.hp = state.boss.maxHp;
    state.boss.weakness = weakness;
    state.boss.damageMultiplier = weakness > 0 ? 2 : 1;
    setSwarmAim(state, state.boss.x, state.boss.y);
    stepSwarm(state, createSwarmInput(), 1 / 60);
    return state.boss.maxHp - state.boss.hp;
  }
  const normalDamage = pulseDamage(0);
  const weakDamage = pulseDamage(1);
  assert.ok(normalDamage > 0);
  assert.equal(weakDamage, normalDamage * 2);

  const expiry = createBossState(0);
  expiry.boss.activePattern = null;
  expiry.boss.patternCooldown = 999;
  expiry.boss.weakness = 0.04;
  expiry.boss.damageMultiplier = 2;
  stepSwarm(expiry, createSwarmInput(), 0.05);
  assert.equal(expiry.boss.weakness, 0);
  assert.equal(expiry.boss.damageMultiplier, 1);
  assert.equal(getSwarmHud(expiry).boss.weakness, 0);
});

test("radial volley turns its warning into a damaging projectile curtain", () => {
  const state = createBossState(0);
  stepFor(state, createSwarmInput(), 1.05);
  assert.ok(state.enemyProjectiles.length >= 20);
  const projectile = state.enemyProjectiles[0];
  projectile.x = state.player.x;
  projectile.y = state.player.y;
  projectile.vx = 0;
  projectile.vy = 0;
  const hp = state.player.hp;
  stepSwarm(state, createSwarmInput(), 1 / 60);
  assert.ok(state.player.hp < hp);
});

test("sweep laser rotates through its warned lane and damages a player who stays there", () => {
  const state = createBossState(1);
  stepSwarm(state, createSwarmInput(), 1 / 60);
  const pattern = state.boss.activePattern;
  const angle = Math.atan2(state.player.y - state.boss.y, state.player.x - state.boss.x);
  pattern.startAngle = angle;
  pattern.endAngle = angle;
  const hp = state.player.hp;
  stepFor(state, createSwarmInput(), 1.25);
  assert.ok(state.player.hp < hp);
});

test("targeted bombs punish remaining inside their warning circles", () => {
  const state = createBossState(2);
  stepSwarm(state, createSwarmInput(), 1 / 60);
  const pattern = state.boss.activePattern;
  for (const target of pattern.targets) {
    target.x = state.player.x;
    target.y = state.player.y;
  }
  const hp = state.player.hp;
  stepFor(state, createSwarmInput(), 1.25);
  assert.ok(state.player.hp < hp);
});

test("expanding rings damage a player who fails to cross the warned wave", () => {
  const state = createBossState(3);
  state.player.x = state.boss.x - 102;
  state.player.y = state.boss.y;
  const hp = state.player.hp;
  stepFor(state, createSwarmInput(), 1.3);
  assert.ok(state.player.hp < hp);
});

test("boss death wins and player death loses", () => {
  const victory = createBossState(0);
  victory.boss.patternCooldown = 999;
  victory.boss.hp = 1;
  victory.boss.x = victory.player.x + 75;
  victory.boss.y = victory.player.y;
  setSwarmAim(victory, victory.boss.x, victory.boss.y);
  stepFor(victory, createSwarmInput(), 0.3);
  assert.equal(victory.phase, "victory");
  assert.ok(drainSwarmEvents(victory).some((event) => event.type === "win"));

  const defeat = createSwarmState({ random: () => 0.5 });
  defeat.player.hp = 1;
  defeat.player.invulnerability = 0;
  const enemy = defeat.enemies.find((candidate) => candidate.type === "hunter");
  defeat.enemies = [enemy];
  enemy.x = defeat.player.x;
  enemy.y = defeat.player.y;
  enemy.damage = 999;
  enemy.attackCooldown = 0;
  stepSwarm(defeat, createSwarmInput(), 1 / 60);
  assert.equal(defeat.phase, "defeat");
  assert.ok(drainSwarmEvents(defeat).some((event) => event.type === "loss"));
});

test("seeded simulations remain deterministic and finite under the live entity caps", () => {
  function seeded(seed) {
    let value = seed >>> 0;
    return () => {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 0x100000000;
    };
  }
  function run(seed) {
    const state = createSwarmState({ random: seeded(seed) });
    const input = createSwarmInput();
    for (let frame = 0; frame < 600; frame += 1) {
      const target = state.enemies[frame % Math.max(1, state.enemies.length)];
      if (target) setSwarmAim(state, target.x, target.y);
      input.right = frame % 240 < 120;
      input.left = !input.right;
      input.dashPressed = frame % 150 === 0;
      stepSwarm(state, input, 1 / 60);
      clearPressedInput(input);
      if (state.levelupPending) chooseLevelReward(state, state.rewardOptions[0].id);
    }
    const values = [state.time, state.player.x, state.player.y, state.player.hp, state.stats.damageDealt];
    assert.ok(values.every(Number.isFinite));
    assert.ok(state.enemies.length <= 170);
    assert.ok(state.projectiles.length <= 520);
    assert.ok(state.enemyProjectiles.length <= 360);
    assert.ok(state.particles.length <= 320);
    return { values, kills: state.stats.kills, spawned: state.spawnedEnemies, phase: state.phase };
  }
  assert.deepEqual(run(12345), run(12345));
});

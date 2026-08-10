import assert from "node:assert/strict";
import test from "node:test";
import {
  BOSS_PATTERNS,
  GAME_HEIGHT,
  GAME_WIDTH,
  REGION_BOSS_PATTERNS,
  REGION_ENEMY_PROFILES,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  chooseLevelReward,
  clearPressedInput,
  createSwarmInput,
  createSwarmState,
  drainSwarmEvents,
  getEnemyPressureCap,
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

function delayPlayerWeapons(state, seconds = 999) {
  for (const key of Object.keys(state.player.fireTimers)) state.player.fireTimers[key] = seconds;
}

function forceOffer(state, id, category) {
  state.levelupPending = true;
  state.rewardOptions = [{ id, category, name: id, description: "test", level: 0, nextLevel: 1 }];
}

function createBossState(patternIndex = 0, regionId = "wrong-engine-core") {
  const state = createSwarmState({ random: () => 0.5, regionId });
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

test("slot combat bonuses alter the next sortie without bypassing simulation limits", () => {
  const state = createSwarmState({
    random: () => 0.5,
    combatBonuses: {
      damageMultiplier: 1.13,
      xpGainMultiplier: 1.25,
      moveSpeedMultiplier: 1.13,
      fireRateMultiplier: 1.18,
      maxHpFlat: 140,
      healingMultiplier: 1.35,
    },
  });
  assert.equal(state.player.damageMultiplier, 1.13);
  assert.equal(state.player.fireRateMultiplier, 1.18);
  assert.equal(state.player.speed, 245 * 1.13);
  assert.equal(state.player.maxHp, 500);
  assert.equal(state.player.hp, 500);

  state.player.hp = 100;
  state.pickups = [{ id: 9001, x: state.player.x, y: state.player.y, vx: 0, vy: 0, radius: 8, value: 10, age: 0, dead: false }];
  state.healthKits = [{ id: 9002, x: state.player.x, y: state.player.y, radius: 25, heal: 100, age: 0, dead: false }];
  delayPlayerWeapons(state);
  stepSwarm(state, createSwarmInput(), 1 / 60);
  assert.equal(state.player.xp, 12.5);
  assert.equal(state.player.hp, 235);

  const clamped = createSwarmState({ combatBonuses: { damageMultiplier: 99, maxHpFlat: 9999, moveSpeedMultiplier: -4 } });
  assert.equal(clamped.player.damageMultiplier, 1.5);
  assert.equal(clamped.player.maxHp, 600);
  assert.equal(clamped.player.speed, 245);
});

function countEnemyTypes(enemies) {
  return enemies.reduce((counts, enemy) => {
    counts[enemy.type] = (counts[enemy.type] || 0) + 1;
    return counts;
  }, { hunter: 0, suppressor: 0, brute: 0 });
}

test("the renewed mode has one hero, no regions, and a fixed 1000-unit assault", () => {
  const state = createSwarmState({ random: () => 0.5 });
  assert.equal(GAME_WIDTH, 1280);
  assert.equal(GAME_HEIGHT, 720);
  assert.equal(WORLD_WIDTH, 1920);
  assert.equal(WORLD_HEIGHT, 1080);
  assert.equal(state.mode, "swarm");
  assert.equal(state.phase, "swarm");
  assert.equal(state.player.name, "THE TRAINER");
  assert.equal(state.enemyBudget, 1000);
  assert.equal("zones" in state, false);
  assert.equal("heroes" in state, false);
});

test("the expedition opens with a readable force that scales with player growth", () => {
  const state = createSwarmState({ random: () => 0.37, expedition: true });
  assert.equal(state.enemies.length, 36);
  assert.equal(getEnemyPressureCap(state), 36);
  assert.deepEqual(new Set(state.enemies.map((enemy) => enemy.type)), new Set(["hunter", "suppressor", "brute"]));
  assert.ok(state.enemies.some((enemy) => enemy.elite));
  assert.ok(state.enemies.every((enemy) => enemy.hp > 0 && Number.isFinite(enemy.x) && Number.isFinite(enemy.y)));
  state.player.level = 8;
  state.killedEnemies = 420;
  state.time = 64;
  state.expedition.progress = 0.7;
  assert.ok(getEnemyPressureCap(state) >= 155);
  assert.ok(getEnemyPressureCap(state) <= 220);
});

test("expedition pressure rises primarily with route depth and remains capped", () => {
  const state = createSwarmState({ random: () => 0.37, expedition: true, regionId: "glass-dune" });
  state.player.level = 1;
  state.killedEnemies = 0;
  state.time = 0;
  const caps = [0, 0.25, 0.5, 0.75, 1].map((progress) => {
    state.expedition.progress = progress;
    return getEnemyPressureCap(state);
  });
  assert.equal(caps[0], 36);
  assert.ok(caps.every((cap, index) => index === 0 || cap > caps[index - 1]), `expected rising caps, got ${caps}`);
  state.player.level = 20;
  state.killedEnemies = state.enemyBudget;
  state.time = 180;
  assert.equal(getEnemyPressureCap(state), 220);
});

test("each campaign region deterministically fields a distinct opening and reinforcement mix", () => {
  const regionIds = ["wrong-engine-core", "glass-dune", "abyssal-archive"];
  const openings = [];
  const reinforcements = [];
  for (const regionId of regionIds) {
    const state = createSwarmState({ random: () => 0.5, expedition: true, regionId });
    assert.equal(state.enemyBudget, regionId === "wrong-engine-core" ? 300 : 1000);
    assert.equal(state.enemies.length, 36);
    assert.equal(state.enemyProfile, REGION_ENEMY_PROFILES[regionId]);
    openings.push(countEnemyTypes(state.enemies));

    state.enemies.length = 0;
    state.spawnedEnemies = 36;
    state.killedEnemies = 500;
    state.player.level = 20;
    state.player.invulnerability = 999;
    state.surgeIndex = 4;
    state.surgeWarning = null;
    state.surgeQueued = 60;
    state.surgeSpawnAccumulator = 12;
    state.activeSurge = { index: 4, label: "PROFILE TEST", count: 60, remaining: 60, rate: 1000 };
    delayPlayerWeapons(state);
    stepFor(state, createSwarmInput(), 0.3);
    assert.equal(state.spawnedEnemies, 96);
    assert.equal(state.enemies.length, 60);
    reinforcements.push(countEnemyTypes(state.enemies));
  }
  assert.notDeepEqual(openings[0], openings[1]);
  assert.notDeepEqual(openings[0], openings[2]);
  assert.notDeepEqual(openings[1], openings[2]);
  assert.notDeepEqual(reinforcements[0], reinforcements[1]);
  assert.notDeepEqual(reinforcements[0], reinforcements[2]);
  assert.notDeepEqual(reinforcements[1], reinforcements[2]);
});

test("every expedition attacker materializes through one of five authored SOVEREIGN gates", () => {
  const state = createSwarmState({ expedition: true, random: (() => {
    let value = 0;
    return () => ((value = (value + 0.137) % 1));
  })() });
  assert.equal(state.enemies.length, 36);
  assert.deepEqual(new Set(state.enemies.map((enemy) => enemy.spawnGateId)), new Set(["east-upper", "east-lower", "north-rail", "south-rail", "rear-breach"]));
  assert.equal(state.spawnPortals.length, 5);
  assert.ok(state.enemies.every((enemy) => enemy.spawnDelay > 0));
  assert.ok(state.enemies.every((enemy) => Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y) > 430));
  const halfWidth = GAME_WIDTH / (2 * state.camera.zoom);
  const halfHeight = GAME_HEIGHT / (2 * state.camera.zoom);
  const inOpeningView = (enemy) => enemy.x >= state.camera.x - halfWidth && enemy.x <= state.camera.x + halfWidth
    && enemy.y >= state.camera.y - halfHeight && enemy.y <= state.camera.y + halfHeight;
  assert.ok(state.enemies.filter(inOpeningView).length >= 32, "the opening gates should place a meaningful force inside the 1.08 camera");
  stepSwarm(state, createSwarmInput(), 1 / 60);
  const readable = state.enemies.filter((enemy) => {
    if (!inOpeningView(enemy)) return false;
    const materialize = 1 - enemy.spawnDelay / enemy.spawnDuration;
    const alpha = Math.max(0, Math.min(1, (materialize - 0.08) / 0.72));
    return alpha >= 0.8;
  });
  assert.ok(readable.length >= 32, "deployment dialogue must not freeze an effectively invisible opening force");
});

test("basic weapons are always automatic and expose no toggle or manual-fire state", () => {
  const state = createSwarmState({ random: () => 0.5 });
  const input = createSwarmInput();
  assert.equal("pointerDown" in input, false);
  assert.equal("manualFirePressed" in input, false);
  assert.equal("autoFireTogglePressed" in input, false);
  assert.equal("autoFireEnabled" in state.player, false);
  setSwarmAim(state, 1100, 360);
  stepSwarm(state, input, 1 / 60);
  assert.ok(state.projectiles.some((projectile) => projectile.kind === "pulse"));
  assert.ok(state.projectiles[0].vx > 0);
  assert.ok(state.stats.shots > 0);
  assert.ok(drainSwarmEvents(state).some((event) => event.type === "shot"));
  assert.equal("autoFireEnabled" in getSwarmHud(state).player, false);
});

test("legacy E-toggle and pointer-click fields cannot disable or force basic fire", () => {
  const state = createSwarmState({ random: () => 0.5, expedition: true });
  const input = createSwarmInput();
  drainSwarmEvents(state);
  state.projectiles.length = 0;
  state.player.fireTimers.pulse = 1;
  input.autoFireTogglePressed = true;
  input.manualFirePressed = true;
  stepSwarm(state, input, 1 / 60);
  assert.equal(state.projectiles.length, 0);
  assert.equal("autoFireEnabled" in state.player, false);
  assert.ok(!drainSwarmEvents(state).some((event) => event.type === "autoFireToggled"));

  state.player.fireTimers.pulse = 0;
  stepSwarm(state, input, 1 / 60);
  assert.ok(state.projectiles.some((projectile) => projectile.kind === "pulse"));
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

test("Q/E/F/R expose four independent manual ability contracts and clear as input edges", () => {
  const state = createSwarmState({ random: () => 0.5 });
  const input = createSwarmInput();
  const hud = getSwarmHud(state);
  const bindings = { empPulse: "Q", aegisWard: "E", stratosRun: "F", helixTempest: "R" };
  for (const [ability, key] of Object.entries(bindings)) {
    assert.equal(hud.abilities[ability].id, ability);
    assert.equal(hud.abilities[ability].key, key);
    assert.equal(hud.abilities[ability].rank, 1);
    assert.equal(hud.abilities[ability].upgradeRank, 0);
    assert.equal(hud.abilities[ability].base, true);
    assert.equal(hud.abilities[ability].ready, true);
    assert.equal(hud.abilities[ability].available, true);
    assert.equal(hud.abilities[ability].manual, true);
  }
  assert.equal("supportPressed" in input, false);
  assert.equal("squadRecall" in hud.abilities, false);
  assert.equal("squadCooldown" in state.support, false);
  assert.equal("squadCalls" in state.stats, false);
  assert.ok(state.allies.every((ally) => !("summoned" in ally)));

  Object.assign(input, {
    dashPressed: true,
    empPulsePressed: true,
    aegisWardPressed: true,
    stratosRunPressed: true,
    helixTempestPressed: true,
  });
  clearPressedInput(input);
  for (const field of ["dashPressed", "empPulsePressed", "aegisWardPressed", "stratosRunPressed", "helixTempestPressed"]) {
    assert.equal(input[field], false);
  }
  for (const legacy of ["emp", "nanite", "skyfall"]) assert.equal(legacy in state.manualAbilities, false);
  assert.equal("omegaLaser" in state.manualAbilities, false);
});

test("EMP PULSE stops mechanical enemies in pointer geometry without pulling units or projectiles", () => {
  const state = createSwarmState({ random: () => 0.5 });
  const target = state.enemies.find((enemy) => !enemy.elite);
  state.enemies = [target];
  state.spawnedEnemies = state.enemyBudget;
  target.spawnDelay = 0;
  target.x = state.player.x + 120;
  target.y = state.player.y;
  target.speed = 0;
  target.hp = 9999;
  target.maxHp = target.hp;
  state.enemyProjectiles = [{
    id: 9901,
    kind: "rifleman",
    x: state.player.x + 220,
    y: state.player.y + 80,
    px: state.player.x + 220,
    py: state.player.y + 80,
    vx: 500,
    vy: 0,
    speed: 500,
    angle: 0,
    damage: 100,
    radius: 5,
    age: 0,
    life: 4,
    dead: false,
  }];
  setSwarmAim(state, state.player.x + 280, state.player.y);
  delayPlayerWeapons(state);
  const input = createSwarmInput();
  input.empPulsePressed = true;
  const previousX = target.x;
  stepSwarm(state, input, 1 / 60);
  assert.equal(target.x, previousX, "EMP halts the target instead of pulling it");
  assert.equal(target.hp, 9999, "EMP is a utility shutdown and deals no direct damage");
  assert.equal(target.slow, 0);
  assert.ok(target.disabledTimer > 3.5);
  assert.equal(target.attackState, "disabled");
  assert.equal(state.enemyProjectiles.length, 1);
  assert.equal(state.enemyProjectiles[0].vy, 0, "EMP does not bend projectiles");
  assert.equal(state.enemyProjectiles[0].damage, 100, "EMP does not weaken projectiles");
  assert.equal("gravitySnareWeakened" in state.enemyProjectiles[0], false);
  assert.equal(state.empPulses.length, 1);
  assert.deepEqual(state.empPulses[0].geometry, {
    kind: "circle",
    x: state.player.x + 280,
    y: state.player.y,
    radius: 300,
    collisionRadius: 300,
  });
  assert.ok(state.manualAbilities.empPulse.cooldown > 17.9);
  assert.equal(state.stats.activeAbilityCasts.empPulse, 1);
  const events = drainSwarmEvents(state);
  assert.ok(events.some((event) => event.type === "empPulseActivated" && event.disableDuration === 3.6 && event.affected === 1));
  assert.ok(events.some((event) => event.type === "manualAbilityActivated" && event.ability === "empPulse" && event.key === "Q"));

  stepSwarm(state, input, 1 / 60);
  assert.equal(state.stats.activeAbilityCasts.empPulse, 1, "a held engine edge cannot bypass the cooldown");
  assert.ok(drainSwarmEvents(state).some((event) => event.type === "manualAbilityRejected" && event.reason === "cooldown"));
  clearPressedInput(input);
});

test("AEGIS WARD follows the player and owns heal, temporary shield, reduction, and status immunity", () => {
  const state = createBossState();
  state.boss.patternCooldown = 99;
  state.boss.x = state.player.x;
  state.boss.y = state.player.y;
  state.player.hp = 210;
  state.player.invulnerability = 0;
  delayPlayerWeapons(state);
  const input = createSwarmInput();
  input.aegisWardPressed = true;
  stepSwarm(state, input, 1 / 60);
  assert.ok(state.player.hp >= 243 && state.player.hp < 245, "contact damage is reduced and mostly absorbed after the immediate heal");
  assert.equal(state.player.aegisWardShield, 0, "the dedicated ward shield absorbs before hull and can be depleted by a boss collision");
  assert.ok(state.player.aegisWardTimer > 4.9);
  assert.equal(state.player.aegisWardDamageReduction, 0.38);
  assert.equal(state.player.stunTimer, 0);
  assert.equal(state.aegisWards.length, 1);
  assert.equal(state.aegisWards[0].x, state.player.x);
  assert.equal(state.aegisWards[0].geometry.kind, "circle");
  assert.ok(state.manualAbilities.aegisWard.cooldown > 27.9);
  const events = drainSwarmEvents(state);
  assert.ok(events.some((event) => event.type === "aegisWardActivated" && event.statusImmune === true && event.duration === 5));
  assert.ok(events.some((event) => event.type === "playerHit" && event.statusImmune === true && event.reducedBy > 0));
  assert.ok(events.some((event) => event.type === "manualAbilityActivated" && event.ability === "aegisWard" && event.key === "E"));
});

test("the opening grace window prevents damage for 2.4 seconds, then enemies can hurt the player", () => {
  const state = createSwarmState({ random: () => 0.5 });
  const enemy = state.enemies.find((candidate) => candidate.type === "suppressor" && !candidate.elite);
  state.enemies = [enemy];
  state.spawnedEnemies = state.enemyBudget;
  enemy.x = state.player.x;
  enemy.y = state.player.y;
  enemy.speed = 0;
  enemy.hp = 999999;
  enemy.maxHp = enemy.hp;
  enemy.damage = 25;
  enemy.attackCooldown = 0;
  enemy.shootCooldown = 0;
  const initialHp = state.player.hp;
  assert.equal(initialHp, state.player.maxHp);
  assert.equal(state.player.invulnerability, 2.5);
  stepFor(state, createSwarmInput(), 2.4);
  assert.equal(state.player.hp, initialHp);
  stepFor(state, createSwarmInput(), 0.8);
  assert.ok(state.player.hp < initialHp);
});

test("SOVEREIGN fields suicide drones, burst riflemen, and warned long-range snipers", () => {
  const roleState = createSwarmState({ random: () => 0.5 });
  assert.equal(roleState.enemies.find((enemy) => enemy.type === "hunter").combatRole, "suicideDrone");
  assert.equal(roleState.enemies.find((enemy) => enemy.type === "suppressor").combatRole, "rifleman");
  assert.equal(roleState.enemies.find((enemy) => enemy.type === "brute").combatRole, "sniper");

  const droneState = createSwarmState({ random: () => 0.5 });
  const drone = droneState.enemies.find((enemy) => enemy.combatRole === "suicideDrone" && !enemy.elite);
  droneState.enemies = [drone];
  droneState.spawnedEnemies = droneState.enemyBudget;
  delayPlayerWeapons(droneState);
  droneState.player.invulnerability = 0;
  drone.x = droneState.player.x;
  drone.y = droneState.player.y;
  const hpBeforeDrone = droneState.player.hp;
  stepSwarm(droneState, createSwarmInput(), 1 / 60);
  assert.equal(drone.dead, true);
  assert.ok(droneState.player.hp <= hpBeforeDrone - 70);
  assert.ok(drainSwarmEvents(droneState).some((event) => event.type === "enemySelfDestruct"));

  const rifleState = createSwarmState({ random: () => 0.5 });
  const rifleman = rifleState.enemies.find((enemy) => enemy.combatRole === "rifleman" && !enemy.elite);
  rifleState.enemies = [rifleman];
  rifleState.spawnedEnemies = rifleState.enemyBudget;
  delayPlayerWeapons(rifleState);
  rifleState.player.invulnerability = 30;
  rifleman.x = rifleState.player.x + 420;
  rifleman.y = rifleState.player.y;
  rifleman.shootCooldown = 0;
  stepFor(rifleState, createSwarmInput(), 0.34);
  assert.ok(rifleState.enemyProjectiles.filter((projectile) => projectile.kind === "rifleman").length >= 3);

  const sniperState = createSwarmState({ random: () => 0.5 });
  const sniper = sniperState.enemies.find((enemy) => enemy.combatRole === "sniper" && !enemy.elite);
  sniperState.enemies = [sniper];
  sniperState.spawnedEnemies = sniperState.enemyBudget;
  delayPlayerWeapons(sniperState);
  sniperState.player.invulnerability = 30;
  sniper.x = sniperState.player.x + 720;
  sniper.y = sniperState.player.y;
  sniper.shootCooldown = 0;
  stepSwarm(sniperState, createSwarmInput(), 1 / 60);
  const warning = sniperState.telegraphs.find((telegraph) => telegraph.type === "sniperAim");
  assert.ok(warning);
  assert.equal(warning.geometry.collisionHalfWidth, 7);
  stepFor(sniperState, createSwarmInput(), 0.92);
  assert.ok(sniperState.enemyProjectiles.some((projectile) => projectile.kind === "sniper"));
  assert.ok(drainSwarmEvents(sniperState).some((event) => event.type === "enemyShot" && event.kind === "sniper"));
});

test("deterministic route healing kits repair hull on contact", () => {
  const state = createSwarmState({ expedition: true, random: () => 0.5 });
  assert.equal(state.healthKits.length, 14);
  const kit = state.healthKits[0];
  state.enemies.length = 0;
  state.spawnedEnemies = state.enemyBudget;
  state.player.hp = 100;
  state.player.x = kit.x;
  state.player.y = kit.y;
  stepSwarm(state, createSwarmInput(), 1 / 60);
  assert.equal(state.player.hp, 192);
  assert.equal(state.healthKits.length, 13);
  assert.ok(drainSwarmEvents(state).some((event) => event.type === "healthKitPicked" && event.healed === 92));
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

test("the first level-up waits for readable combat, then pauses with one weapon, skill, and ally", () => {
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
  assert.equal(state.levelupPending, false);
  assert.ok(state.levelFlow.queuedLevels >= 1);
  stepFor(state, createSwarmInput(), 4.65);
  assert.equal(state.levelupPending, false);
  stepFor(state, createSwarmInput(), 0.4);
  assert.equal(state.levelupPending, true);
  assert.ok(state.time >= 6.4 && state.time < 10);
  assert.deepEqual(state.rewardOptions.map((option) => option.category).sort(), ["ally", "skill", "weapon"]);
  const pausedAt = state.time;
  stepSwarm(state, createSwarmInput(), 1 / 30);
  assert.equal(state.time, pausedAt);
  assert.equal(getSwarmHud(state).rewards.pending, true);
});

test("queued levels collapse into one batch and cannot reopen before a five-second combat interval", () => {
  const state = createSwarmState({ random: () => 0.5 });
  state.time = 6.5;
  state.phaseTime = 6.5;
  state.levelFlow.queuedLevels = 1;
  stepSwarm(state, createSwarmInput(), 1 / 60);
  assert.equal(state.levelupPending, true);
  assert.equal(chooseLevelReward(state, state.rewardOptions[0].id), true);
  const chosenAt = state.time;
  state.levelFlow.queuedLevels = 5;
  state.player.level += 5;
  stepFor(state, createSwarmInput(), 5.2);
  assert.equal(state.levelupPending, false);
  stepFor(state, createSwarmInput(), 0.3);
  assert.equal(state.levelupPending, true);
  assert.ok(state.levelFlow.batchLevels >= 5);
  assert.ok(state.rewardOptions.every((option) => option.levelsGained === state.levelFlow.batchLevels));
  assert.ok(state.rewardOptions.every((option) => option.rankGain >= 1 && option.rankGain <= 3));
  assert.ok(state.time - chosenAt >= 5.4);
  const selected = state.rewardOptions[0];
  const overflow = state.levelFlow.batchLevels - selected.rankGain;
  assert.equal(chooseLevelReward(state, selected.id), true);
  assert.equal(state.stats.batchedOverflowLevels, overflow);
  assert.ok(drainSwarmEvents(state).some((event) => event.type === "batchLevelBonus" && event.levels === overflow));
});

test("the first reward is guaranteed before ten seconds even when no XP can be collected", () => {
  const state = createSwarmState({ random: () => 0.5 });
  state.enemyBudget = state.spawnedEnemies;
  for (const enemy of state.enemies) {
    enemy.hp = 9999999;
    enemy.maxHp = enemy.hp;
    enemy.speed = 0;
    enemy.damage = 0;
  }
  stepFor(state, createSwarmInput(), 9.8);
  assert.equal(state.levelupPending, true);
  assert.ok(state.time >= 9.6 && state.time < 10);
  assert.ok(drainSwarmEvents(state).some((event) => event.type === "trainingMilestone"));
});

test("the opening reward remains valid when every signature combat skill is already mastered", () => {
  const state = createSwarmState({ random: () => 0.5 });
  Object.assign(state.build.skills, { chain: 3, nova: 3, airstrike: 3, omegaLaser: 3 });
  state.time = 6.5;
  state.phaseTime = 6.5;
  state.levelFlow.queuedLevels = 1;
  stepSwarm(state, createSwarmInput(), 1 / 60);
  const skill = state.rewardOptions.find((option) => option.category === "skill");
  assert.ok(skill?.id);
  assert.ok(skill?.name);
  assert.ok(skill?.description);
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

test("screen-space aiming uses the renderer's clamped camera center at arena edges", () => {
  const state = createSwarmState({ random: () => 0.5 });
  state.camera.x = 0;
  state.camera.y = 0;
  state.camera.zoom = 2;
  assert.equal(setSwarmScreenAim(state, 640, 360), true);
  assert.equal(state.aim.x, 320);
  assert.equal(state.aim.y, 180);
  setSwarmScreenAim(state, 0, 0);
  assert.equal(state.aim.x, 0);
  assert.equal(state.aim.y, 0);

  state.camera.x = GAME_WIDTH;
  state.camera.y = GAME_HEIGHT;
  setSwarmScreenAim(state, 640, 360);
  assert.equal(state.aim.x, 960);
  assert.equal(state.aim.y, 540);
  setSwarmScreenAim(state, GAME_WIDTH, GAME_HEIGHT);
  assert.equal(state.aim.x, GAME_WIDTH);
  assert.equal(state.aim.y, GAME_HEIGHT);
});

test("expedition camera and pointer projection stay centered on AEGIS beyond world edges", () => {
  const state = createSwarmState({ random: () => 0.5, expedition: true });
  const input = createSwarmInput();
  assert.equal(state.camera.x, state.player.x);
  assert.equal(state.camera.y, state.player.y);
  input.right = true;
  stepSwarm(state, input, 1 / 60);
  assert.equal(state.camera.x, state.player.x);
  assert.equal(state.camera.y, state.player.y);

  state.camera.x = 120;
  state.camera.y = 140;
  state.camera.zoom = 1;
  assert.equal(setSwarmScreenAim(state, 0, 0), true);
  assert.equal(state.aim.x, 120 - GAME_WIDTH / 2);
  assert.equal(state.aim.y, 140 - GAME_HEIGHT / 2);
});

test("skill cooldown HUD exposes the exact reset duration used by combat", () => {
  const state = createSwarmState({ random: () => 0.5 });
  forceOffer(state, "chain", "skill");
  chooseLevelReward(state, "chain");
  state.support.chainCooldown = 0;
  stepSwarm(state, createSwarmInput(), 1 / 60);
  const ability = getSwarmHud(state).abilities.chain;
  assert.ok(ability.cooldown > 0);
  assert.equal(ability.maxCooldown, state.support.chainCooldownMax);
  assert.equal(ability.cooldownMax, ability.maxCooldown);
  assert.ok(ability.cooldown <= ability.maxCooldown);
  const manual = getSwarmHud(state).abilities;
  assert.deepEqual(
    Object.fromEntries(["empPulse", "aegisWard", "stratosRun", "helixTempest"].map((id) => [id, manual[id].key])),
    { empPulse: "Q", aegisWard: "E", stratosRun: "F", helixTempest: "R" },
  );
  assert.deepEqual(
    Object.fromEntries(["empPulse", "aegisWard", "stratosRun", "helixTempest"].map((id) => [id, manual[id].maxCooldown])),
    { empPulse: 18, aegisWard: 28, stratosRun: 34, helixTempest: 72 },
  );
  assert.equal("squadRecall" in manual, false);
});

test("route-paced gate waves wait for forward progress, then warn before filling only the current pressure cap", () => {
  const state = createSwarmState({ random: () => 0.5, expedition: true });
  for (const enemy of state.enemies) {
    enemy.hp = 999999;
    enemy.maxHp = enemy.hp;
    enemy.speed = 0;
    enemy.damage = 0;
  }
  state.player.invulnerability = 99;
  state.levelFlow.firstDeadline = 999;
  state.levelFlow.nextOfferAt = 999;
  drainSwarmEvents(state);
  stepFor(state, createSwarmInput(), 8.2);
  assert.equal(drainSwarmEvents(state).some((event) => event.type === "surgeWarning"), false);
  state.player.x = state.expedition.originX + state.expedition.routeLength * 0.11;
  stepSwarm(state, createSwarmInput(), 1 / 60);
  const warning = drainSwarmEvents(state).find((event) => event.type === "surgeWarning");
  assert.equal(warning.wave, 1);
  assert.equal(warning.count, 124);
  assert.equal(warning.progressAt, 0.1);
  assert.ok(getSwarmHud(state).surge.warning.startsIn > 0);
  stepFor(state, createSwarmInput(), 1.4);
  const surgeEvents = drainSwarmEvents(state);
  assert.ok(surgeEvents.some((event) => event.type === "surgeStart"));
  assert.ok(state.spawnedEnemies > 36);
  assert.ok(state.enemies.length <= getEnemyPressureCap(state));
  assert.ok(getSwarmHud(state).surge.active || state.surgeQueued === 0);
});

test("level-up airstrike and omega laser remain automatic and separate from manual Q/E/F/R state", () => {
  const state = createSwarmState({ random: () => 0.5 });
  state.build.skills.airstrike = 3;
  state.build.skills.omegaLaser = 3;
  state.levelFlow.firstDeadline = 999;
  state.levelFlow.nextOfferAt = 999;
  state.player.invulnerability = 99;
  for (const enemy of state.enemies) {
    enemy.spawnDelay = 0;
    enemy.speed = 0;
    enemy.hp = 999999;
    enemy.maxHp = enemy.hp;
  }
  delayPlayerWeapons(state);
  drainSwarmEvents(state);
  stepSwarm(state, createSwarmInput(), 1 / 60);
  assert.equal(state.airstrikes.length, 15);
  assert.equal(state.beams.length, 1);
  assert.equal(state.beams[0].type, "omegaLaser");
  assert.equal(state.stats.ultimateCasts, 2);
  assert.deepEqual(state.stats.activeAbilityCasts, {
    empPulse: 0,
    aegisWard: 0,
    stratosRun: 0,
    helixTempest: 0,
  });
  assert.equal(state.empPulses.length, 0);
  assert.equal(state.stratosRuns.length, 0);
  assert.equal(state.helixTempests.length, 0);
  assert.ok(state.support.airstrikeCooldown > 0);
  assert.ok(state.support.omegaLaserCooldown > 0);
  const events = drainSwarmEvents(state);
  assert.ok(events.some((event) => event.type === "ultimateWarning" && event.skill === "airstrike"));
  assert.ok(events.some((event) => event.type === "ultimateWarning" && event.skill === "omegaLaser"));
  assert.equal(events.some((event) => event.type === "manualAbilityActivated"), false);
});

test("STRATOS RUN creates three warned parallel sweep lanes without reusing airstrike entities or events", () => {
  const state = createSwarmState({ random: () => 0.5 });
  const targets = state.enemies.filter((enemy) => !enemy.elite).slice(0, 3);
  state.enemies = targets;
  state.spawnedEnemies = state.enemyBudget;
  const centerX = state.player.x + 420;
  for (let index = 0; index < targets.length; index += 1) {
    targets[index].x = centerX;
    targets[index].y = state.player.y + [-112, 0, 112][index];
    targets[index].spawnDelay = 0;
    targets[index].speed = 0;
    targets[index].damage = 0;
    targets[index].hp = 9999;
    targets[index].maxHp = 9999;
  }
  delayPlayerWeapons(state);
  setSwarmAim(state, centerX, state.player.y);
  drainSwarmEvents(state);
  const input = createSwarmInput();
  input.stratosRunPressed = true;
  stepSwarm(state, input, 1 / 60);
  assert.equal(state.stratosRuns.length, 3);
  assert.equal(state.airstrikes.length, 0);
  assert.deepEqual(state.stratosRuns.map((lane) => lane.geometry.laneIndex), [0, 1, 2]);
  assert.deepEqual(state.stratosRuns.map((lane) => Number(lane.warningMax.toFixed(2))), [0.72, 0.9, 1.08]);
  assert.equal(new Set(state.stratosRuns.map((lane) => lane.geometry.startY)).size, 3);
  assert.ok(state.stratosRuns.every((lane) => lane.geometry.kind === "capsule" && lane.geometry.collisionHalfWidth === 24));
  assert.ok(state.manualAbilities.stratosRun.cooldown > 33.9);
  clearPressedInput(input);
  stepFor(state, input, 1.55);
  assert.ok(targets.every((target) => target.hp < 9999));
  const events = drainSwarmEvents(state);
  assert.ok(events.some((event) => event.type === "stratosRunWarning" && event.laneCount === 3));
  const sweeps = events.filter((event) => event.type === "stratosRunSweep");
  assert.equal(sweeps.length, 3);
  assert.ok(sweeps[0].time < sweeps[1].time && sweeps[1].time < sweeps[2].time);
  assert.ok(events.some((event) => event.type === "manualAbilityActivated" && event.ability === "stratosRun" && event.key === "F"));
  assert.equal(events.some((event) => event.type === "ultimateWarning"), false);
});

test("HELIX TEMPEST owns four rotating engine lances and repeated collision without omega beam reuse", () => {
  const state = createSwarmState({ random: () => 0.5 });
  const target = state.enemies.find((enemy) => !enemy.elite);
  state.enemies = [target];
  state.spawnedEnemies = state.enemyBudget;
  target.x = state.player.x + 260;
  target.y = state.player.y;
  target.spawnDelay = 0;
  target.speed = 0;
  target.damage = 0;
  target.hp = 99999;
  target.maxHp = target.hp;
  delayPlayerWeapons(state);
  setSwarmAim(state, target.x, target.y);
  drainSwarmEvents(state);
  const input = createSwarmInput();
  input.helixTempestPressed = true;
  const previousHp = target.hp;
  stepSwarm(state, input, 1 / 60);
  assert.equal(state.helixTempests.length, 1);
  assert.equal(state.helixTempests[0].lances.length, 4);
  assert.ok(state.helixTempests[0].life > 3.1);
  assert.ok(state.helixTempests[0].angularSpeed > Math.PI * 4);
  assert.ok(state.helixTempests[0].lances.every((lance) => lance.kind === "capsule" && lance.collisionHalfWidth === 23));
  assert.equal(state.beams.length, 0);
  assert.ok(state.manualAbilities.helixTempest.cooldown > 71.9);
  clearPressedInput(input);
  stepFor(state, input, 0.85);
  assert.ok(target.hp < previousHp);
  const events = drainSwarmEvents(state);
  assert.ok(events.some((event) => event.type === "helixTempestStarted" && event.lanceCount === 4 && event.duration === 3.2));
  assert.ok(events.some((event) => event.type === "helixTempestPulse" && event.lances.length === 4));
  assert.ok(events.some((event) => event.type === "manualAbilityActivated" && event.ability === "helixTempest" && event.key === "R"));
  assert.equal(events.some((event) => event.type === "ultimateFire"), false);
  stepFor(state, input, 2.6);
  assert.equal(state.helixTempests.length, 0);
});

test("rocket splash safely reuses collision scratch after the direct-hit query completes", () => {
  const state = createSwarmState({ random: () => 0.5 });
  const targets = state.enemies.filter((enemy) => !enemy.elite).slice(0, 3);
  state.enemies = targets;
  state.spawnedEnemies = state.enemyBudget;
  for (let index = 0; index < targets.length; index += 1) {
    targets[index].x = state.player.x + 46 + index * 9;
    targets[index].y = state.player.y;
    targets[index].speed = 0;
    targets[index].hp = 1000;
    targets[index].maxHp = 1000;
  }
  forceOffer(state, "rocket", "weapon");
  chooseLevelReward(state, "rocket");
  state.player.fireTimers.pulse = 999;
  state.player.fireTimers.rocket = 0;
  setSwarmAim(state, targets[0].x, targets[0].y);
  stepSwarm(state, createSwarmInput(), 1 / 60);
  assert.ok(targets.every((enemy) => enemy.hp < 1000));
  assert.ok(drainSwarmEvents(state).some((event) => event.type === "explosion"));
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

test("late dataset progress unlocks tier-three overdrive and rapid master volleys", () => {
  const state = createSwarmState({ random: () => 0.5 });
  state.killedEnemies = 950;
  state.stats.kills = 950;
  state.player.fireTimers.pulse = 0;
  drainSwarmEvents(state);
  stepSwarm(state, createSwarmInput(), 1 / 60);
  assert.equal(state.player.overdriveTier, 3);
  assert.ok(state.player.overdriveDamage > 3.8);
  assert.ok(state.player.overdriveHaste < 0.32);
  assert.ok(state.projectiles.some((projectile) => projectile.kind === "pulseOverdrive"));
  assert.ok(drainSwarmEvents(state).some((event) => event.type === "overdrive" && event.tier === 3));
});

test("ally rewards create autonomous drone, sentry, and suppressor entities", () => {
  for (const id of ["drone", "sentry", "suppressor"]) {
    const state = createSwarmState({ random: () => 0.5 });
    const target = state.enemies.find((enemy) => !enemy.elite);
    target.x = state.player.x + 80;
    target.y = state.player.y;
    target.speed = 0;
    target.hp = 9999;
    target.maxHp = target.hp;
    const hp = target.hp;
    forceOffer(state, id, "ally");
    assert.equal(chooseLevelReward(state, id), true);
    if (id === "sentry") assert.ok(state.deployables.filter((entity) => entity.type === id).length >= 2);
    else assert.ok(state.allies.filter((entity) => entity.type === id).length >= 2);
    assert.ok(target.hp < hp, `${id} should deal an immediate deployment burst`);
    const event = drainSwarmEvents(state).find((candidate) => candidate.type === "allyDeployed");
    assert.equal(event.id, id);
    assert.ok(event.damage >= 200);
  }
});

test("ally ranks scale both formation size and autonomous firepower", () => {
  const state = createSwarmState({ random: () => 0.5 });
  for (let rank = 0; rank < 4; rank += 1) {
    forceOffer(state, "drone", "ally");
    assert.equal(chooseLevelReward(state, "drone"), true);
  }
  assert.equal(state.build.allies.drone, 4);
  assert.equal(state.allies.filter((ally) => ally.type === "drone" && !ally.summoned).length, 5);
  state.projectiles.length = 0;
  stepSwarm(state, createSwarmInput(), 1 / 60);
  const droneShot = state.projectiles.find((projectile) => projectile.kind === "drone");
  assert.ok(droneShot?.damage >= 110);
});

test("the legacy fixed-budget assault still transitions while the first boss uses its reduced hull budget", () => {
  const state = createSwarmState({ random: () => 0.5 });
  state.spawnedEnemies = state.enemyBudget;
  state.killedEnemies = state.enemyBudget;
  state.stats.kills = state.enemyBudget;
  state.enemies.length = 0;
  stepSwarm(state, createSwarmInput(), 1 / 60);
  assert.equal(state.phaseTransition, 2);
  const clearHud = getSwarmHud(state);
  assert.equal(clearHud.totalEnemies, 1000);
  assert.equal(clearHud.enemiesRemaining, 0);
  assert.equal(clearHud.remainingEnemies, 0);
  assert.equal(clearHud.swarmProgress, 1);
  assert.ok(drainSwarmEvents(state).some((event) => event.type === "swarmCleared"));
  stepFor(state, createSwarmInput(), 2.2);
  assert.equal(state.phase, "boss");
  assert.equal(state.boss.active, true);
  assert.equal(getSwarmHud(state).boss.name, "THE WRONG ENGINE");
  assert.equal(state.boss.maxHp, 560000);
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

test("regional bosses keep the core rotation and schedule two deterministic signature patterns", () => {
  assert.deepEqual(REGION_BOSS_PATTERNS["wrong-engine-core"], BOSS_PATTERNS);
  const signatures = {
    "glass-dune": ["prismLattice", "solarFlare"],
    "abyssal-archive": ["memorySpiral", "depthCollapse"],
  };
  for (const [regionId, patternTypes] of Object.entries(signatures)) {
    for (const type of patternTypes) {
      assert.ok(REGION_BOSS_PATTERNS[regionId].includes(type));
      assert.ok(!BOSS_PATTERNS.includes(type));
      const index = REGION_BOSS_PATTERNS[regionId].indexOf(type);
      const state = createBossState(index, regionId);
      stepSwarm(state, createSwarmInput(), 1 / 60);
      assert.equal(state.boss.activePattern?.type, type);
      assert.equal(state.boss.activePattern?.phase, "warning");
      assert.equal(state.boss.activePattern?.geometry?.kind, type);
      const event = drainSwarmEvents(state).find((candidate) => candidate.type === "bossPatternTelegraph");
      assert.equal(event?.pattern, type);
    }
  }
});

test("all three regional bosses own disjoint deterministic attack rotations", () => {
  const wrong = new Set(REGION_BOSS_PATTERNS["wrong-engine-core"]);
  const glass = new Set(REGION_BOSS_PATTERNS["glass-dune"]);
  const abyss = new Set(REGION_BOSS_PATTERNS["abyssal-archive"]);
  assert.deepEqual([...glass], ["prismLattice", "solarFlare", "refractionSweep", "mirrorShards"]);
  assert.deepEqual([...abyss], ["memorySpiral", "depthCollapse", "archiveEcho", "undertow"]);
  assert.equal([...wrong].some((pattern) => glass.has(pattern) || abyss.has(pattern)), false);
  assert.equal([...glass].some((pattern) => abyss.has(pattern)), false);
  for (const regionId of ["glass-dune", "abyssal-archive"]) {
    for (const [index, type] of REGION_BOSS_PATTERNS[regionId].entries()) {
      const state = createBossState(index, regionId);
      stepSwarm(state, createSwarmInput(), 1 / 60);
      assert.equal(state.boss.activePattern?.type, type);
      assert.equal(state.boss.activePattern?.geometry?.kind, type);
    }
  }
});

test("boss parry opens a one-second slow window and Shift reflects the attack", () => {
  const state = createBossState(BOSS_PATTERNS.indexOf("multiCharge"));
  delayPlayerWeapons(state);
  state.boss.hp = state.boss.maxHp * 0.8;
  const input = createSwarmInput();
  for (let frame = 0; frame < 180 && !state.boss.parryWindow; frame += 1) {
    stepSwarm(state, input, 1 / 60);
    clearPressedInput(input);
  }
  assert.equal(state.boss.activePattern?.phase, "parry");
  assert.equal(state.boss.parryWindow?.duration, 1);
  const timeBeforeSlowFrame = state.time;
  stepSwarm(state, input, 1 / 60);
  assert.ok(state.time - timeBeforeSlowFrame < 1 / 120);

  input.parryPressed = true;
  stepSwarm(state, input, 1 / 60);
  assert.equal(state.boss.parryWindow, null);
  assert.equal(state.boss.activePattern, null);
  assert.equal(state.stats.bossParries, 1);
  assert.ok(state.boss.weakness >= 1.7);
  assert.ok(drainSwarmEvents(state).some((event) => event.type === "bossParrySuccess"));
});

test("missing the boss parry window preserves the hit and low HP offers every eligible attack", () => {
  const state = createBossState(BOSS_PATTERNS.indexOf("rings"));
  delayPlayerWeapons(state);
  state.boss.stage = 3;
  state.boss.hp = state.boss.maxHp * 0.2;
  state.boss.bombSequenceTier = 3;
  const input = createSwarmInput();
  for (let frame = 0; frame < 180 && !state.boss.parryWindow; frame += 1) {
    stepSwarm(state, input, 1 / 60);
    clearPressedInput(input);
  }
  assert.ok(state.boss.parryWindow);
  const hpBefore = state.player.hp;
  stepFor(state, input, 1.08);
  assert.equal(state.boss.parryWindow, null);
  assert.ok(state.player.hp < hpBefore);
  assert.equal(state.stats.bossParryFailures, 1);
  assert.ok(drainSwarmEvents(state).some((event) => event.type === "bossParryFailed"));
});

test("low-health bosses deploy 2, 4, then 8 numbered bombs and enforce click order", () => {
  const state = createBossState(0, "glass-dune");
  delayPlayerWeapons(state);
  const input = createSwarmInput();
  const thresholds = [0.54, 0.29, 0.11];
  const counts = [2, 4, 8];
  for (let tier = 0; tier < counts.length; tier += 1) {
    state.boss.hp = state.boss.maxHp * thresholds[tier];
    state.boss.transformTimer = 0;
    stepSwarm(state, input, 1 / 60);
    assert.equal(state.boss.bombSequence?.phase, "siren");
    assert.equal(state.boss.bombSequence?.bombs.length, counts[tier]);
    stepFor(state, input, 1.2);
    assert.equal(state.boss.bombSequence?.phase, "armed");
    const bombs = [...state.boss.bombSequence.bombs];
    for (const bomb of bombs) {
      input.bossMechanicClickX = bomb.x;
      input.bossMechanicClickY = bomb.y;
      stepSwarm(state, input, 1 / 60);
      clearPressedInput(input);
    }
    assert.equal(state.boss.bombSequence, null);
  }
  assert.equal(state.stats.bossBombsDefused, 14);
  assert.equal(state.stats.bossBombFailures, 0);

  const failure = createBossState(0, "abyssal-archive");
  delayPlayerWeapons(failure);
  failure.boss.hp = failure.boss.maxHp * 0.54;
  const failureInput = createSwarmInput();
  stepSwarm(failure, failureInput, 1 / 60);
  stepFor(failure, failureInput, 1.2);
  const second = failure.boss.bombSequence.bombs[1];
  const hpBefore = failure.player.hp;
  failureInput.bossMechanicClickX = second.x;
  failureInput.bossMechanicClickY = second.y;
  stepSwarm(failure, failureInput, 1 / 60);
  assert.equal(failure.boss.bombSequence, null);
  assert.ok(failure.player.hp < hpBefore);
  assert.equal(failure.stats.bossBombFailures, 1);
  assert.ok(drainSwarmEvents(failure).some((event) => event.type === "bossBombSequenceFailed" && event.reason === "wrongOrder"));
});

test("glass-dune signature warnings use the same lane and target geometry as their damage", () => {
  const prismIndex = REGION_BOSS_PATTERNS["glass-dune"].indexOf("prismLattice");
  const prism = createBossState(prismIndex, "glass-dune");
  delayPlayerWeapons(prism);
  stepSwarm(prism, createSwarmInput(), 1 / 60);
  const lattice = prism.boss.activePattern;
  assert.equal(lattice.geometry.laneCount, lattice.geometry.lanes.length);
  assert.equal(lattice.geometry.collisionHalfWidth, lattice.width + prism.player.radius);
  const lane = lattice.geometry.lanes[0];
  prism.player.x = (lane.startX + lane.endX) * 0.5;
  prism.player.y = (lane.startY + lane.endY) * 0.5;
  prism.player.invulnerability = 0;
  const prismHp = prism.player.hp;
  stepFor(prism, createSwarmInput(), lattice.maxLife + 0.08);
  assert.ok(prism.player.hp < prismHp);
  assert.ok(drainSwarmEvents(prism).some((event) => event.type === "playerHit" && event.source === "bossPrismLattice"));

  const flareIndex = REGION_BOSS_PATTERNS["glass-dune"].indexOf("solarFlare");
  const flare = createBossState(flareIndex, "glass-dune");
  delayPlayerWeapons(flare);
  stepSwarm(flare, createSwarmInput(), 1 / 60);
  const solar = flare.boss.activePattern;
  assert.equal(solar.geometry.targetCount, solar.geometry.targets.length);
  assert.equal(solar.geometry.targets, solar.targets);
  const target = solar.geometry.targets[0];
  flare.player.x = target.x;
  flare.player.y = target.y;
  flare.player.invulnerability = 0;
  const flareHp = flare.player.hp;
  stepFor(flare, createSwarmInput(), solar.maxLife + target.delay + 0.18);
  assert.ok(flare.player.hp < flareHp);
  assert.equal(target.detonated, true);
  assert.ok(drainSwarmEvents(flare).some((event) => event.type === "playerHit" && event.source === "bossSolarFlare"));
});

test("abyssal signature warning geometry is updated in place and drives active damage", () => {
  const spiralIndex = REGION_BOSS_PATTERNS["abyssal-archive"].indexOf("memorySpiral");
  const spiral = createBossState(spiralIndex, "abyssal-archive");
  delayPlayerWeapons(spiral);
  stepSwarm(spiral, createSwarmInput(), 1 / 60);
  const memory = spiral.boss.activePattern;
  assert.equal(memory.geometry.armCount, memory.geometry.segments.length);
  assert.equal(memory.geometry.collisionHalfWidth, memory.width + spiral.player.radius);
  const segment = memory.geometry.segments[0];
  spiral.player.x = (segment.startX + segment.endX) * 0.5;
  spiral.player.y = (segment.startY + segment.endY) * 0.5;
  spiral.player.invulnerability = 0;
  const spiralHp = spiral.player.hp;
  stepFor(spiral, createSwarmInput(), memory.maxLife + 0.1);
  assert.ok(spiral.player.hp < spiralHp);
  assert.ok(drainSwarmEvents(spiral).some((event) => event.type === "playerHit" && event.source === "bossMemorySpiral"));

  const collapseIndex = REGION_BOSS_PATTERNS["abyssal-archive"].indexOf("depthCollapse");
  const collapse = createBossState(collapseIndex, "abyssal-archive");
  delayPlayerWeapons(collapse);
  stepSwarm(collapse, createSwarmInput(), 1 / 60);
  const depth = collapse.boss.activePattern;
  assert.equal(depth.geometry.ringCount, depth.geometry.radii.length);
  assert.deepEqual(depth.geometry.radii, depth.geometry.startRadii);
  const initialRadius = depth.geometry.radii[0];
  collapse.player.x = collapse.boss.x - (initialRadius - 95);
  collapse.player.y = collapse.boss.y;
  collapse.player.invulnerability = 0;
  const collapseHp = collapse.player.hp;
  stepFor(collapse, createSwarmInput(), depth.maxLife + 0.75);
  assert.ok(depth.geometry.radii[0] < initialRadius);
  assert.ok(collapse.player.hp < collapseHp);
  assert.ok(drainSwarmEvents(collapse).some((event) => event.type === "playerHit" && event.source === "bossDepthCollapse"));
});

test("sweep, ring, and charge warnings expose the exact collision geometry used by gameplay", () => {
  const sweep = createBossState(BOSS_PATTERNS.indexOf("sweep"));
  stepSwarm(sweep, createSwarmInput(), 1 / 60);
  const sweepPattern = sweep.boss.activePattern;
  assert.equal(sweepPattern.geometry.kind, "sweep");
  assert.equal(sweepPattern.geometry.collisionHalfWidth, sweepPattern.width + sweep.player.radius);
  assert.ok(Number.isFinite(sweepPattern.geometry.primaryEndX));

  const rings = createBossState(BOSS_PATTERNS.indexOf("rings"));
  stepSwarm(rings, createSwarmInput(), 1 / 60);
  const ringPattern = rings.boss.activePattern;
  assert.equal(ringPattern.geometry.kind, "rings");
  assert.equal(ringPattern.geometry.ringCount, ringPattern.rings);
  assert.equal(ringPattern.geometry.radii.length, ringPattern.rings);
  assert.equal(ringPattern.geometry.collisionHalfWidth, ringPattern.width + rings.player.radius);

  const charge = createBossState(BOSS_PATTERNS.indexOf("charge"));
  stepSwarm(charge, createSwarmInput(), 1 / 60);
  const chargePattern = charge.boss.activePattern;
  assert.equal(chargePattern.geometry.kind, "capsule");
  assert.equal(chargePattern.geometry.bodyRadius, charge.boss.radius);
  assert.equal(chargePattern.geometry.collisionRadius, charge.boss.radius + charge.player.radius);
  assert.equal(chargePattern.geometry.endX, chargePattern.targetX);
  assert.equal(chargePattern.geometry.endY, chargePattern.targetY);
});

test("direct boss body contact is critical, stuns controls, and has a retrigger cooldown", () => {
  const state = createBossState(0);
  state.boss.activePattern = null;
  state.boss.patternCooldown = 999;
  state.boss.x = state.player.x;
  state.boss.y = state.player.y;
  const hp = state.player.hp;
  drainSwarmEvents(state);
  stepSwarm(state, createSwarmInput(), 1 / 60);
  assert.ok(state.player.hp <= hp - 150);
  assert.ok(state.player.stunTimer >= 0.78);
  assert.ok(state.boss.contactCooldown >= 1.38);
  const hud = getSwarmHud(state);
  assert.equal(hud.player.stunned, true);
  assert.ok(hud.player.stunTimer > 0.7);
  const events = drainSwarmEvents(state);
  assert.ok(events.some((event) => event.type === "playerStunned" && event.source === "bossContact"));
  assert.ok(events.some((event) => event.type === "bossContactHit"));

  state.player.invulnerability = 0;
  state.player.x = state.boss.x;
  state.player.y = state.boss.y;
  const afterFirstHit = state.player.hp;
  stepSwarm(state, createSwarmInput(), 0.2);
  assert.equal(state.player.hp, afterFirstHit);
});

test("boss health thresholds lock in distinct transformations and repeat their danger warning", () => {
  const state = createBossState(0);
  state.boss.activePattern = null;
  state.boss.patternCooldown = 999;
  state.boss.x = state.player.x + 100;
  state.boss.y = state.player.y;
  state.boss.hp = state.boss.maxHp * 0.7 + 1;
  setSwarmAim(state, state.boss.x, state.boss.y);
  drainSwarmEvents(state);
  stepSwarm(state, createSwarmInput(), 1 / 60);
  assert.equal(state.boss.stage, 2);
  assert.ok(state.boss.transformTimer > 1.7);
  assert.equal(getSwarmHud(state).boss.transforming, true);
  assert.ok(drainSwarmEvents(state).some((event) => event.type === "bossStage" && event.stage === 2));
  stepFor(state, createSwarmInput(), 1.05);
  assert.ok(drainSwarmEvents(state).filter((event) => event.type === "bossStagePulse").length >= 2);

  state.boss.transformTimer = 0;
  state.boss.activePattern = null;
  state.boss.patternCooldown = 999;
  state.boss.hp = state.boss.maxHp * 0.38 + 1;
  state.player.fireTimers.pulse = 0;
  stepSwarm(state, createSwarmInput(), 1 / 60);
  assert.equal(state.boss.stage, 3);
  assert.ok(state.boss.enrage > 2);
});

test("wrong-engine phase-one charge alone has a longer warning, slower rush, and lower contact damage", () => {
  const wrong = createBossState(BOSS_PATTERNS.indexOf("charge"));
  const phaseTwo = createBossState(BOSS_PATTERNS.indexOf("charge"));
  phaseTwo.boss.stage = 2;
  for (const state of [wrong, phaseTwo]) {
    delayPlayerWeapons(state);
    stepSwarm(state, createSwarmInput(), 1 / 60);
  }
  assert.equal(wrong.boss.activePattern.openingAssist, true);
  assert.equal(wrong.boss.activePattern.maxLife, 1.05);
  assert.equal(wrong.boss.activePattern.activeLife, 0.68);
  assert.equal(phaseTwo.boss.activePattern.openingAssist, false);
  assert.equal(phaseTwo.boss.activePattern.maxLife, 0.72 * 0.82);
  assert.equal(phaseTwo.boss.activePattern.activeLife, 0.52);
  stepFor(wrong, createSwarmInput(), 1.06);
  stepFor(phaseTwo, createSwarmInput(), 0.62);
  assert.equal(wrong.boss.activePattern.phase, "active");
  assert.equal(phaseTwo.boss.activePattern.phase, "active");
  assert.ok(wrong.boss.activePattern.chargeSpeed < phaseTwo.boss.activePattern.chargeSpeed);
  stepFor(wrong, createSwarmInput(), 0.7);
  stepFor(phaseTwo, createSwarmInput(), 0.55);
  const wrongHit = drainSwarmEvents(wrong).find((event) => event.type === "bossChargeHit");
  const phaseTwoHit = drainSwarmEvents(phaseTwo).find((event) => event.type === "bossChargeHit");
  assert.ok(wrongHit && phaseTwoHit);
  assert.ok(wrongHit.damage < phaseTwoHit.damage);
});

test("multi-charge rapidly relocks and rushes several times before exposing the core", () => {
  const state = createBossState(BOSS_PATTERNS.indexOf("multiCharge"));
  state.player.invulnerability = 10;
  stepFor(state, createSwarmInput(), 3.4);
  const events = drainSwarmEvents(state);
  const rushes = events.filter((event) => event.type === "bossPatternFire" && event.pattern === "multiCharge");
  const relocks = events.filter((event) => event.type === "bossPatternTelegraph" && event.pattern === "multiCharge");
  assert.equal(rushes.length, 3);
  assert.equal(relocks.length, 3);
  assert.equal(state.boss.activePattern, null);
  assert.ok(state.boss.weakness > 2.4);
  assert.ok(events.some((event) => event.type === "bossWeakness"));
});

test("charge locks a line warning before the boss begins its eased opening rush", () => {
  const state = createBossState(4);
  stepSwarm(state, createSwarmInput(), 1 / 60);
  const warning = state.boss.activePattern;
  const startX = warning.originX;
  const startY = warning.originY;
  assert.equal(warning.type, "charge");
  assert.equal(warning.phase, "warning");
  assert.equal(warning.maxLife, 1.05);
  assert.equal(warning.openingAssist, true);
  assert.ok(Number.isFinite(warning.targetX) && Number.isFinite(warning.targetY));
  assert.ok(warning.width >= 40);
  stepFor(state, createSwarmInput(), 0.9);
  assert.equal(state.boss.x, startX);
  assert.equal(state.boss.y, startY);
  assert.equal(state.boss.activePattern.phase, "warning");
  stepFor(state, createSwarmInput(), 0.2);
  assert.equal(state.boss.activePattern.phase, "active");
  assert.ok(state.boss.activePattern.chargeSpeed > 1000);
});

test("dodging the first boss charge causes a wall-impact groggy vulnerability window", () => {
  const state = createBossState(4);
  stepSwarm(state, createSwarmInput(), 1 / 60);
  const warning = state.boss.activePattern;
  const targetX = warning.targetX;
  const targetY = warning.targetY;
  state.player.x = 640;
  state.player.y = 150;
  stepFor(state, createSwarmInput(), 1.9);
  assert.equal(state.boss.activePattern, null);
  assert.ok(Math.abs(state.boss.x - targetX) < 0.001);
  assert.ok(Math.abs(state.boss.y - targetY) < 0.001);
  assert.ok(state.boss.groggy >= 2.3 && state.boss.groggy <= 2.6);
  assert.equal(state.boss.groggyDuration, 2.6);
  assert.equal(state.boss.damageMultiplier, 2.5);
  assert.equal(state.boss.animationState, "stagger");
  const events = drainSwarmEvents(state);
  const event = events.find((candidate) => candidate.type === "bossGroggy");
  assert.deepEqual(
    { duration: event.duration, multiplier: event.multiplier, reason: event.reason, telegraph: event.telegraph },
    { duration: 2.6, multiplier: 2.5, reason: "wallImpact", telegraph: "stagger" },
  );
  const hud = getSwarmHud(state).boss;
  assert.equal(hud.damageMultiplier, 2.5);
  assert.ok(hud.groggy > 0);
  assert.equal(hud.groggyMultiplier, 2.5);
});

test("follow-up regional bosses do not inherit the wrong-engine charge rotation", () => {
  assert.equal(REGION_BOSS_PATTERNS["glass-dune"].includes("charge"), false);
  assert.equal(REGION_BOSS_PATTERNS["glass-dune"].includes("multiCharge"), false);
  assert.equal(REGION_BOSS_PATTERNS["abyssal-archive"].includes("charge"), false);
  assert.equal(REGION_BOSS_PATTERNS["abyssal-archive"].includes("multiCharge"), false);
});

test("charge collision deals heavy damage and denies the weakness window", () => {
  const state = createBossState(4);
  const hp = state.player.hp;
  stepFor(state, createSwarmInput(), 1.8);
  assert.ok(state.player.hp <= hp - 82);
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
  assert.ok(Math.abs(weakDamage - normalDamage * 2) < 0.001);

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
  assert.equal(victory.boss.deathDuration, 1.25);
  assert.ok(victory.boss.deathTimer > 0);
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
  assert.equal(defeat.player.deathDuration, 0.9);
  assert.ok(defeat.player.deathTimer > 0);
  assert.ok(drainSwarmEvents(defeat).some((event) => event.type === "loss"));
});

test("combat entities expose recoil, hit-stun, attack, movement, and death animation timers", () => {
  const state = createSwarmState({ random: () => 0.5 });
  const enemy = state.enemies.find((candidate) => candidate.type === "hunter" && !candidate.elite);
  state.enemies = [enemy];
  state.spawnedEnemies = state.enemyBudget;
  enemy.x = state.player.x + 52;
  enemy.y = state.player.y;
  enemy.speed = 0;
  enemy.hp = 1;
  setSwarmAim(state, enemy.x, enemy.y);
  stepSwarm(state, createSwarmInput(), 1 / 60);
  assert.equal(state.player.attackState, "pulse");
  assert.ok(state.player.recoil > 0);
  stepFor(state, createSwarmInput(), 0.16);
  assert.equal(enemy.dead, true);
  assert.equal(enemy.animationState, "death");
  assert.ok(enemy.deathTimer > 0);

  const boss = createBossState(BOSS_PATTERNS.indexOf("sweep"));
  stepSwarm(boss, createSwarmInput(), 1 / 60);
  assert.equal(boss.boss.animationState, "windup");
  assert.equal(boss.boss.attackState, "windup:sweep");
  assert.ok(boss.boss.attackTimer > 1);
});

test("crowd collision reuses spatial buckets and a stable nearby-enemy scratch buffer", () => {
  const state = createSwarmState({ random: () => 0.5 });
  state.spawnedEnemies = state.enemyBudget;
  for (const enemy of state.enemies) {
    enemy.hp = 9999999;
    enemy.maxHp = enemy.hp;
    enemy.speed = 0;
    enemy.damage = 0;
  }
  stepSwarm(state, createSwarmInput(), 1 / 60);
  const grid = state.spatialGrid;
  const scratch = state.nearbyScratch;
  const activeBuckets = state.activeSpatialBuckets;
  const buckets = state.spatialBuckets.slice();
  state.killedEnemies = 950;
  for (let frame = 0; frame < 180; frame += 1) stepSwarm(state, createSwarmInput(), 1 / 60);
  assert.equal(state.spatialGrid, grid);
  assert.equal(state.nearbyScratch, scratch);
  assert.equal(state.activeSpatialBuckets, activeBuckets);
  assert.ok(buckets.every((bucket) => state.spatialBuckets.includes(bucket)));
  assert.ok(state.activeSpatialBuckets.length <= state.enemies.length);
  assert.ok(state.projectiles.length <= 620);
  assert.ok(state.nearbyScratch.length <= state.enemies.length);
});

test("forward travel clears only active spatial buckets and reuses pooled route cells", () => {
  const state = createSwarmState({ random: () => 0.5, expedition: true, duration: 999 });
  const input = createSwarmInput();
  state.spawnedEnemies = state.enemyBudget;
  state.levelFlow.nextOfferAt = 999;
  state.levelFlow.firstDeadline = 999;
  delayPlayerWeapons(state);
  for (const enemy of state.enemies) {
    enemy.hp = 9999999;
    enemy.maxHp = enemy.hp;
    enemy.speed = 0;
    enemy.damage = 0;
    enemy.shootCooldown = 999;
    enemy.spawnDelay = 0;
  }
  const placeAt = (baseX) => {
    for (let index = 0; index < state.enemies.length; index += 1) {
      state.enemies[index].x = baseX + (index % 4) * 10;
      state.enemies[index].y = 180 + (index % 9) * 82;
    }
  };
  placeAt(700);
  stepSwarm(state, input, 1 / 60);
  const activeList = state.activeSpatialBuckets;
  const firstCells = activeList.slice();
  for (let segment = 1; segment <= 72; segment += 1) {
    placeAt(700 + segment * 145);
    stepSwarm(state, input, 1 / 60);
    assert.equal(state.activeSpatialBuckets, activeList);
    assert.ok(state.activeSpatialBuckets.length <= state.enemies.length);
  }
  assert.ok(state.spatialBuckets.length > state.activeSpatialBuckets.length * 6);
  placeAt(700);
  stepSwarm(state, input, 1 / 60);
  assert.ok(firstCells.every((bucket) => state.activeSpatialBuckets.includes(bucket)));
});

test("orbit blades update in place instead of allocating new render entities every tick", () => {
  const state = createSwarmState({ random: () => 0.5 });
  state.spawnedEnemies = state.enemyBudget;
  state.build.weapons.orbit = 4;
  delayPlayerWeapons(state);
  for (const enemy of state.enemies) {
    enemy.hp = 9999999;
    enemy.maxHp = enemy.hp;
    enemy.speed = 0;
    enemy.damage = 0;
  }
  stepSwarm(state, createSwarmInput(), 1 / 60);
  const orbitals = state.orbitals;
  const blades = orbitals.slice();
  for (let frame = 0; frame < 120; frame += 1) stepSwarm(state, createSwarmInput(), 1 / 60);
  assert.equal(state.orbitals, orbitals);
  assert.deepEqual(state.orbitals.map((blade) => blade.id), [0, 1, 2, 3, 4]);
  assert.ok(blades.every((blade, index) => state.orbitals[index] === blade));
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
    assert.ok(state.enemies.length <= 220);
    assert.ok(state.projectiles.length <= 620);
    assert.ok(state.enemyProjectiles.length <= 360);
    assert.ok(state.particles.length <= 320);
    return {
      values,
      kills: state.stats.kills,
      spawned: state.spawnedEnemies,
      phase: state.phase,
      nextEntityId: state.nextEntityId,
      shots: state.stats.shots,
      hits: state.stats.hits,
      projectiles: state.projectiles.length,
      enemyProjectiles: state.enemyProjectiles.length,
      rewards: state.stats.rewardsChosen,
    };
  }
  const fingerprint = run(12345);
  assert.deepEqual(fingerprint, run(12345));
  assert.deepEqual(fingerprint, {
    values: [10.000000000000076, 1089.1666666666688, 360, 134.8416416416417, 1731.5531531531535],
    kills: 35,
    spawned: 51,
    phase: "swarm",
    nextEntityId: 342,
    shots: 139,
    hits: 71,
    projectiles: 66,
    enemyProjectiles: 6,
    rewards: 1,
  });
});

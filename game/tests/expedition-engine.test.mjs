import assert from "node:assert/strict";
import test from "node:test";

import {
  createSwarmInput,
  createSwarmState,
  drainSwarmEvents,
  enterBossRoom,
  getSwarmHud,
  stepSwarm,
} from "../src/swarm/engine.js";

function seededRandom(seed = 91) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
}

test("expedition mode starts with a wave-clear objective and opening scenario", () => {
  const state = createSwarmState({ random: seededRandom(), duration: 360, expedition: true });
  const hud = getSwarmHud(state);
  const events = drainSwarmEvents(state);

  assert.equal(hud.expedition.objective, "ELIMINATE CURRENT WAVE");
  assert.equal(hud.expedition.progress, 0);
  assert.equal(hud.totalEnemies, 300);
  assert.deepEqual(hud.expedition.traces.map(({ id, distance, triggered }) => ({ id, distance, triggered })), [
    { id: "rook", distance: 4800, triggered: false },
    { id: "nyx", distance: 13200, triggered: false },
    { id: "moss", distance: 21800, triggered: false },
  ]);
  assert.equal(state.player.name, "AEGIS");
  assert.ok(events.some((event) => event.type === "scenario" && event.beat === "deployment"));
  assert.ok(state.enemies.filter((enemy) => enemy.x > state.player.x).length > state.enemies.length * 0.7);
});

test("kill progress discovers the first squad trace without moving the player", () => {
  const state = createSwarmState({ random: seededRandom(17), duration: 360, expedition: true });
  state.player.invulnerability = 99;
  state.killedEnemies = 60;
  state.stats.kills = 60;
  state.levelFlow.firstDeadline = 999;
  state.levelFlow.nextOfferAt = 999;
  for (const enemy of state.enemies) {
    enemy.damage = 0;
    enemy.hp = 999_999;
    enemy.maxHp = enemy.hp;
  }
  drainSwarmEvents(state);

  const start = { x: state.player.x, y: state.player.y };
  stepSwarm(state, createSwarmInput(), 1 / 60);
  const events = drainSwarmEvents(state);

  assert.equal(state.expedition.distance, 5000);
  assert.equal(state.expedition.progress, 0.2);
  assert.equal(state.expedition.checkpointIndex, 1);
  assert.ok(events.some((event) => event.type === "scenario" && event.beat === "rook-trace"));
  assert.deepEqual({ x: state.player.x, y: state.player.y }, start);
});

test("square-arena movement is symmetric in all four directions and long-range fire stays in world bounds", () => {
  const right = createSwarmState({ random: seededRandom(41), duration: 360, expedition: true });
  const left = createSwarmState({ random: seededRandom(41), duration: 360, expedition: true });
  const up = createSwarmState({ random: seededRandom(41), duration: 360, expedition: true });
  const down = createSwarmState({ random: seededRandom(41), duration: 360, expedition: true });
  for (const state of [right, left, up, down]) {
    state.player.invulnerability = 99;
    state.levelFlow.firstDeadline = 999;
    state.levelFlow.nextOfferAt = 999;
    for (const key of Object.keys(state.player.fireTimers)) state.player.fireTimers[key] = 999;
    for (const enemy of state.enemies) {
      enemy.damage = 0;
      enemy.speed = 0;
    }
  }
  const rightInput = createSwarmInput();
  const leftInput = createSwarmInput();
  const upInput = createSwarmInput();
  const downInput = createSwarmInput();
  rightInput.right = true;
  leftInput.left = true;
  upInput.up = true;
  downInput.down = true;
  const startX = right.player.x;
  const startY = right.player.y;
  for (let index = 0; index < 120; index += 1) {
    stepSwarm(right, rightInput, 1 / 60);
    stepSwarm(left, leftInput, 1 / 60);
    stepSwarm(up, upInput, 1 / 60);
    stepSwarm(down, downInput, 1 / 60);
  }
  assert.ok(Math.abs((right.player.x - startX) - (startX - left.player.x)) < 0.001);
  assert.ok(Math.abs((down.player.y - startY) - (startY - up.player.y)) < 0.001);
  assert.ok(right.player.x - startX > 470);
  assert.ok(down.player.y - startY > 470);
  assert.equal(right.expedition.progress, 0);

  right.player.x = 2600;
  right.camera.x = right.player.x;
  right.aim.x = 3800;
  right.aim.y = right.player.y;
  right.projectiles.length = 0;
  right.player.fireTimers.pulse = 0;
  rightInput.right = false;
  stepSwarm(right, rightInput, 1 / 60);
  for (let index = 0; index < 30; index += 1) stepSwarm(right, rightInput, 1 / 60);
  assert.ok(right.projectiles.some((projectile) => projectile.x > 2800 && !projectile.dead));
});

test("distant hostiles remain authoritative and accelerate into 360-degree pursuit", () => {
  const state = createSwarmState({ random: seededRandom(49), duration: 360, expedition: true });
  const input = createSwarmInput();
  input.right = true;
  input.down = true;
  const enemy = state.enemies.find((candidate) => candidate.combatRole === "rifleman") ?? state.enemies[0];
  state.enemies.length = 1;
  state.enemies[0] = enemy;
  enemy.type = "suppressor";
  enemy.combatRole = "rifleman";
  enemy.selfDestructArmed = false;
  enemy.selfDestructTriggerRadius = 0;
  state.player.x = 3000;
  state.player.y = 3000;
  state.camera.x = state.player.x;
  enemy.x = state.player.x - 1200;
  enemy.y = state.player.y - 1200;
  enemy.spawnDelay = 0;
  enemy.damage = 0;
  enemy.shootCooldown = 999;
  state.spawnedEnemies = state.enemyBudget;
  state.killedEnemies = state.enemyBudget - 1;
  state.stats.kills = state.killedEnemies;
  state.player.invulnerability = 999;
  state.player.fireTimers.pulse = 999;
  state.levelFlow.firstDeadline = 999;
  state.levelFlow.nextOfferAt = 999;
  const initialGap = Math.hypot(state.player.x - enemy.x, state.player.y - enemy.y);

  for (let frame = 0; frame < 600; frame += 1) stepSwarm(state, input, 1 / 60);

  const finalGap = Math.hypot(state.player.x - enemy.x, state.player.y - enemy.y);
  assert.equal(state.enemies.includes(enemy), true);
  assert.equal(enemy.dead, false);
  assert.ok(enemy.x > 2400 && enemy.y > 2400, `expected diagonal pursuit, got ${enemy.x},${enemy.y}`);
  assert.ok(finalGap < initialGap, `expected pursuit to close the gap, got ${initialGap} -> ${finalGap}`);
});

test("arena movement never substitutes for the final hostile or restores a boss-door prompt", () => {
  const state = createSwarmState({ random: seededRandom(23), duration: 360, expedition: true });
  const input = createSwarmInput();
  input.right = true;
  state.enemies.length = 0;
  state.spawnedEnemies = state.enemyBudget;
  state.killedEnemies = state.enemyBudget - 1;
  state.stats.kills = state.killedEnemies;
  state.levelFlow.nextOfferAt = 999;
  state.levelFlow.firstDeadline = 999;
  drainSwarmEvents(state);

  for (let index = 0; index < 180; index += 1) stepSwarm(state, input, 1 / 60);
  const routeEvents = drainSwarmEvents(state);

  assert.ok(state.player.x > 2_048);
  assert.equal(state.expedition.distance, state.expedition.routeLength * (299 / 300));
  assert.equal(state.expedition.progress, 299 / 300);
  assert.equal(state.expedition.reachedGate, false);
  assert.equal(state.phase, "swarm");
  assert.equal(state.boss.active, false);
  assert.equal(enterBossRoom(state), false);
  assert.equal(routeEvents.some((event) => event.type === "bossGateLocked"), false);
  assert.equal("gateNotice" in getSwarmHud(state).expedition, false);
});

test("clearing all 300 enemies resolves MOSS by kill progress before automatic boss entry", () => {
  const state = createSwarmState({ random: seededRandom(3), duration: 360, expedition: true });
  const input = createSwarmInput();
  state.enemies.length = 0;
  state.spawnedEnemies = state.enemyBudget;
  state.killedEnemies = state.enemyBudget;
  state.stats.kills = state.enemyBudget;
  state.levelFlow.nextOfferAt = 999;
  state.levelFlow.firstDeadline = 999;
  drainSwarmEvents(state);

  stepSwarm(state, input, 1 / 60);
  assert.equal(state.phase, "swarm");
  const clearEvents = drainSwarmEvents(state);
  assert.equal(state.expedition.clearTransition.phase, "warning");
  assert.equal(state.expedition.clearTransition.duration, 1.2);
  assert.equal("waitingForAdvance" in state.expedition, false);
  assert.equal("forwardLimitDistance" in state.expedition, false);
  assert.equal(state.expedition.reachedGate, false);
  assert.equal(state.expedition.traces.find((trace) => trace.id === "moss").triggered, true);
  const mossIndex = clearEvents.findIndex((event) => event.type === "scenario" && event.beat === "moss-trace");
  const warningIndex = clearEvents.findIndex((event) => event.type === "routeClearWarning");
  assert.ok(mossIndex >= 0 && warningIndex > mossIndex, "MOSS must resolve before the route-clear transition begins");

  for (let index = 0; index < 76; index += 1) stepSwarm(state, input, 1 / 60);
  assert.equal(state.expedition.clearTransition.phase, "panic");
  assert.equal(state.expedition.clearTransition.duration, 1.6);
  assert.ok(drainSwarmEvents(state).some((event) => event.type === "routeClearPanic" && event.beat === "sovereign-panic"));

  for (let index = 0; index < 98; index += 1) stepSwarm(state, input, 1 / 60);
  const transitionEvents = drainSwarmEvents(state);

  assert.equal(state.phase, "swarm");
  assert.equal(state.boss.active, false);
  assert.equal(state.expedition.awaitingBossEntry, true);
  assert.equal(state.expedition.autoBossEntry, true);
  assert.equal(state.expedition.reachedGate, true);
  assert.equal(state.expedition.clearTransition.phase, "swap");
  assert.equal(state.expedition.bossRoom, false);
  assert.ok(transitionEvents.some((event) => event.type === "bossAutoTransition" && event.autoEnter === true));
  assert.equal(transitionEvents.some((event) => event.type === "bossGatePrompt"), false);

  const pausedAt = state.time;
  for (let index = 0; index < 125; index += 1) stepSwarm(state, input, 1 / 60);
  assert.equal(state.time, pausedAt);
  assert.equal(state.phase, "swarm");

  assert.equal(enterBossRoom(state), true);
  const events = drainSwarmEvents(state);

  assert.equal(state.phase, "boss");
  assert.equal(state.expedition.bossRoom, true);
  assert.equal(state.expedition.bossEntryConfirmed, true);
  assert.equal(state.expedition.autoBossEntry, false);
  assert.equal(state.expedition.clearTransition, null);
  assert.equal(state.player.x, 820);
  assert.equal(state.boss.x, 1390);
  assert.ok(events.some((event) => event.type === "scenario" && event.beat === "engine-encounter"));
});

test("outer-frontier routes deploy every budgeted enemy, defeat a midboss, and enter their boss room", () => {
  const expectations = [
    ["neon-foundry", "PRESS WARDEN", "neon-foundry", 1100],
    ["storm-spire", "THUNDER MANTA", "storm-spire", 1150],
    ["gene-vault", "CHIMERA CUSTODIAN", "gene-vault", 1200],
  ];

  for (const [regionId, midBossName, visualSet, budget] of expectations) {
    const state = createSwarmState({ random: seededRandom(71), duration: 360, expedition: true, regionId });
    const input = createSwarmInput();
    assert.equal(state.enemyBudget, budget);
    assert.ok(state.enemies.every((enemy) => enemy.visualSet === visualSet));
    assert.equal(state.expedition.midBoss.definition.name, midBossName);

    state.enemies.length = 0;
    state.spawnedEnemies = 600;
    state.surgeIndex = 8;
    state.surgeWarning = null;
    state.surgeQueued = 0;
    state.activeSurge = null;
    state.levelFlow.firstDeadline = 999;
    state.levelFlow.nextOfferAt = 999;
    drainSwarmEvents(state);
    stepSwarm(state, input, 1 / 60);
    assert.equal(state.surgeWarning.count, budget - 600, `${regionId} terminal wave must fill the complete enemy budget`);

    state.enemies.length = 0;
    state.spawnedEnemies = state.enemyBudget;
    state.killedEnemies = state.enemyBudget;
    state.stats.kills = state.enemyBudget;
    state.levelFlow.firstDeadline = 999;
    state.levelFlow.nextOfferAt = 999;
    drainSwarmEvents(state);
    stepSwarm(state, input, 1 / 60);

    assert.equal(state.expedition.midBoss.spawned, true);
    assert.equal(state.expedition.midBoss.defeated, false);
    assert.equal(state.expedition.clearTransition, null);
    const midBoss = state.enemies.find((enemy) => enemy.isMidBoss);
    assert.ok(midBoss);
    assert.equal(midBoss.visualSet, visualSet);
    assert.ok(midBoss.radius >= 70);
    assert.ok(drainSwarmEvents(state).some((event) => event.type === "midBossEncounter" && event.name === midBossName));

    state.enemies.length = 0;
    state.expedition.midBoss.defeated = true;
    stepSwarm(state, input, 1 / 60);
    assert.equal(state.expedition.clearTransition.phase, "warning");
    assert.ok(drainSwarmEvents(state).some((event) => event.type === "routeClearWarning"));

    for (let frame = 0; frame < 190 && !state.expedition.awaitingBossEntry; frame += 1) {
      stepSwarm(state, input, 1 / 60);
    }
    assert.equal(state.expedition.clearTransition.phase, "swap");
    assert.equal(state.expedition.awaitingBossEntry, true);
    assert.ok(drainSwarmEvents(state).some((event) => event.type === "bossAutoTransition" && event.regionId === regionId));
    assert.equal(enterBossRoom(state), true);
    assert.equal(state.phase, "boss");
    assert.equal(state.regionId, regionId);
  }
});

test("outer midbosses execute three deterministic signature combat roles", () => {
  const spawnMidBoss = (regionId) => {
    const state = createSwarmState({ random: seededRandom(83), duration: 999, expedition: true, regionId });
    state.enemies.length = 0;
    state.spawnedEnemies = state.enemyBudget;
    state.killedEnemies = state.enemyBudget;
    state.stats.kills = state.enemyBudget;
    state.levelFlow.firstDeadline = 999;
    state.levelFlow.nextOfferAt = 999;
    state.player.invulnerability = 999;
    for (const key of Object.keys(state.player.fireTimers)) state.player.fireTimers[key] = 999;
    stepSwarm(state, createSwarmInput(), 1 / 60);
    const enemy = state.enemies.find((candidate) => candidate.isMidBoss);
    assert.ok(enemy);
    enemy.spawnDelay = 0;
    enemy.hp = 99_999_999;
    enemy.maxHp = enemy.hp;
    enemy.x = state.player.x + 340;
    enemy.y = state.player.y;
    enemy.specialCooldown = 0;
    drainSwarmEvents(state);
    return { state, enemy };
  };

  const press = spawnMidBoss("neon-foundry");
  assert.equal(press.enemy.combatRole, "pressWarden");
  stepSwarm(press.state, createSwarmInput(), 1 / 60);
  assert.ok(drainSwarmEvents(press.state).some((event) => event.type === "midBossTelegraph" && event.signature === "PRESS SLAM"));
  for (let frame = 0; frame < 50; frame += 1) stepSwarm(press.state, createSwarmInput(), 1 / 60);
  assert.ok(drainSwarmEvents(press.state).some((event) => event.type === "midBossAttack" && event.signature === "PRESS SLAM"));

  const manta = spawnMidBoss("storm-spire");
  assert.equal(manta.enemy.combatRole, "thunderManta");
  stepSwarm(manta.state, createSwarmInput(), 1 / 60);
  assert.equal(manta.state.enemyProjectiles.filter((projectile) => projectile.kind === "thunderArc").length, 5);
  assert.ok(drainSwarmEvents(manta.state).some((event) => event.type === "midBossAttack" && event.signature === "ARC VOLLEY"));

  const chimera = spawnMidBoss("gene-vault");
  assert.equal(chimera.enemy.combatRole, "chimeraCustodian");
  stepSwarm(chimera.state, createSwarmInput(), 1 / 60);
  assert.ok(drainSwarmEvents(chimera.state).some((event) => event.type === "midBossTelegraph" && event.signature === "CHIMERA RUSH"));
  for (let frame = 0; frame < 30; frame += 1) stepSwarm(chimera.state, createSwarmInput(), 1 / 60);
  assert.ok(drainSwarmEvents(chimera.state).some((event) => event.type === "midBossAttack" && event.signature === "CHIMERA RUSH"));
  assert.deepEqual(
    [press.enemy.combatRole, manta.enemy.combatRole, chimera.enemy.combatRole],
    ["pressWarden", "thunderManta", "chimeraCustodian"],
  );
});

test("the arena minimap exposes capped deterministic normalized player and live-enemy samples", () => {
  const create = () => {
    const state = createSwarmState({ random: seededRandom(47), duration: 360, expedition: true });
    for (const enemy of state.enemies) enemy.spawnDelay = 0;
    state.player.x = 144 + (4096 - 288) * 0.25;
    state.player.y = 2048;
    return getSwarmHud(state).expedition.minimap;
  };
  const first = create();
  const second = create();

  assert.equal(first.player.x, 0.25);
  assert.equal(first.player.y, 0.5);
  assert.equal(first.mode, "arena");
  assert.equal(first.sampleCap, 24);
  assert.equal(first.liveEnemyCount, 8);
  assert.equal(first.enemies.length, 8);
  assert.deepEqual(first, second);
  assert.ok(first.enemies.every((enemy) => enemy.x >= 0 && enemy.x <= 1 && enemy.y >= 0 && enemy.y <= 1));
  assert.equal("bossGate" in first, false);
});

test("the arena minimap exposes only bounded active materializing transit gates", () => {
  const state = createSwarmState({ random: seededRandom(59), duration: 360, expedition: true });
  const arenaPoint = (ratio) => 144 + (4096 - 288) * ratio;
  const portal = (id, xRatio, yRatio, overrides = {}) => ({
    id,
    type: "spawnGate",
    gateId: `test-gate-${id}`,
    x: arenaPoint(xRatio),
    y: arenaPoint(yRatio),
    life: 1,
    maxLife: 2,
    ...overrides,
  });
  state.spawnPortals = [
    portal(200, 0.1, 0.1),
    portal(201, 0.2, 0.2),
    portal(190, 0.3, 0.3, { life: 0 }),
    portal(191, 0.4, 0.4, { active: false }),
    portal(192, 0.5, 0.5, { type: "cosmeticPortal" }),
    portal(202, -0.2, -0.2),
    portal(203, 0.5, 0.5),
    portal(204, 1.2, 1.2),
    portal(205, 0.75, 0.25),
    portal(206, 0.9, 0.9),
  ];

  const minimap = getSwarmHud(state).expedition.minimap;
  assert.equal(minimap.gateSampleCap, 8);
  assert.equal(minimap.activeGateCount, 7);
  assert.equal(minimap.gates.length, 7);
  assert.deepEqual(minimap.gates.map((gate) => gate.id), [200, 201, 202, 203, 204, 205, 206]);
  assert.deepEqual(
    [202, 203, 204].map((id) => {
      const { x, y } = minimap.gates.find((gate) => gate.id === id);
      return { x, y };
    }),
    [{ x: 0, y: 0 }, { x: 0.5, y: 0.5 }, { x: 1, y: 1 }],
  );
  assert.ok(minimap.gates.every((gate) => (
    gate.active === true
    && gate.materializing === true
    && gate.progress === 0.5
    && gate.x >= 0 && gate.x <= 1
    && gate.y >= 0 && gate.y <= 1
  )));
  assert.equal(minimap.gates.some((gate) => [190, 191, 192].includes(gate.id)), false);
});

test("expedition navigation clamps only at the square arena perimeter", () => {
  const state = createSwarmState({ random: seededRandom(12), duration: 360, expedition: true });
  const input = createSwarmInput();
  input.down = true;
  state.enemies.length = 0;
  state.spawnedEnemies = state.enemyBudget;
  state.killedEnemies = state.enemyBudget - 1;
  state.player.invulnerability = 99;
  state.levelFlow.firstDeadline = 999;
  state.levelFlow.nextOfferAt = 999;
  for (let index = 0; index < 600; index += 1) stepSwarm(state, input, 1 / 60);

  assert.equal(state.player.y, 4096 - 144 - state.player.radius);
  assert.equal(state.player.vy, 0);
});

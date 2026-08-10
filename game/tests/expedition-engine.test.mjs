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

test("expedition mode starts with a forward objective and opening scenario", () => {
  const state = createSwarmState({ random: seededRandom(), duration: 360, expedition: true });
  const hud = getSwarmHud(state);
  const events = drainSwarmEvents(state);

  assert.equal(hud.expedition.objective, "ADVANCE TO THE ENGINE");
  assert.equal(hud.expedition.progress, 0);
  assert.equal(hud.totalEnemies, 300);
  assert.deepEqual(hud.expedition.traces.map(({ id, distance, triggered }) => ({ id, distance, triggered })), [
    { id: "rook", distance: 2200, triggered: false },
    { id: "nyx", distance: 5600, triggered: false },
    { id: "moss", distance: 8600, triggered: false },
  ]);
  assert.equal(state.player.name, "AEGIS");
  assert.ok(events.some((event) => event.type === "scenario" && event.beat === "deployment"));
  assert.ok(state.enemies.filter((enemy) => enemy.x > state.player.x).length > state.enemies.length * 0.7);
});

test("moving right advances the route and discovers the first squad trace", () => {
  const state = createSwarmState({ random: seededRandom(17), duration: 360, expedition: true });
  const input = createSwarmInput();
  input.right = true;
  state.player.invulnerability = 99;
  state.levelFlow.firstDeadline = 999;
  state.levelFlow.nextOfferAt = 999;
  drainSwarmEvents(state);

  for (let index = 0; index < 560; index += 1) stepSwarm(state, input, 1 / 60);
  const events = drainSwarmEvents(state);

  assert.ok(state.expedition.distance >= 1280);
  assert.ok(state.expedition.progress > 0);
  assert.equal(state.expedition.checkpointIndex, 1);
  assert.ok(events.some((event) => event.type === "scenario" && event.beat === "rook-trace"));
  assert.ok(state.player.y >= 140 && state.player.y <= 940);
});

test("route-space movement is symmetric and long-range rifle fire is not clipped by the old room bounds", () => {
  const right = createSwarmState({ random: seededRandom(41), duration: 360, expedition: true });
  const left = createSwarmState({ random: seededRandom(41), duration: 360, expedition: true });
  for (const state of [right, left]) {
    state.enemies.length = 0;
    state.player.invulnerability = 99;
    state.levelFlow.firstDeadline = 999;
    state.levelFlow.nextOfferAt = 999;
  }
  const rightInput = createSwarmInput();
  const leftInput = createSwarmInput();
  rightInput.right = true;
  leftInput.left = true;
  const startX = right.player.x;
  for (let index = 0; index < 120; index += 1) {
    stepSwarm(right, rightInput, 1 / 60);
    stepSwarm(left, leftInput, 1 / 60);
  }
  assert.ok(Math.abs((right.player.x - startX) - (startX - left.player.x)) < 0.001);
  assert.ok(right.expedition.distance > 470);

  right.player.x = 5000;
  right.camera.x = right.player.x;
  right.aim.x = 6200;
  right.aim.y = right.player.y;
  right.projectiles.length = 0;
  right.player.fireTimers.pulse = 0;
  rightInput.right = false;
  stepSwarm(right, rightInput, 1 / 60);
  for (let index = 0; index < 30; index += 1) stepSwarm(right, rightInput, 1 / 60);
  assert.ok(right.projectiles.some((projectile) => projectile.x > 5200 && !projectile.dead));
});

test("the engine gate hard-locks before the three-hundredth hostile is dead and warns once", () => {
  const state = createSwarmState({ random: seededRandom(23), duration: 360, expedition: true });
  const input = createSwarmInput();
  input.right = true;
  state.enemies.length = 0;
  state.spawnedEnemies = state.enemyBudget;
  state.killedEnemies = state.enemyBudget - 1;
  state.stats.kills = state.killedEnemies;
  state.player.x = state.expedition.originX + state.expedition.routeLength;
  state.levelFlow.nextOfferAt = 999;
  state.levelFlow.firstDeadline = 999;
  drainSwarmEvents(state);

  for (let index = 0; index < 180; index += 1) stepSwarm(state, input, 1 / 60);
  const gateEvents = drainSwarmEvents(state);

  assert.ok(state.expedition.distance < state.expedition.bossGate);
  assert.equal(state.expedition.gateLocked, true);
  assert.equal(state.expedition.gateUnlocked, false);
  assert.equal(state.expedition.reachedGate, false);
  assert.equal(state.phase, "swarm");
  assert.equal(state.boss.active, false);
  assert.match(state.expedition.objective, /GATE SEALED/);
  assert.equal(enterBossRoom(state), false);
  assert.equal(gateEvents.filter((event) => event.type === "bossGateLocked").length, 1);
  assert.deepEqual(getSwarmHud(state).expedition.gateNotice, {
    active: true,
    reason: "hostilesRemaining",
    title: "보스 구역 봉쇄",
    message: "잔존 적 1기를 먼저 처치하세요.",
    remainingEnemies: 1,
  });
  stepSwarm(state, input, 1 / 60);
  assert.equal(drainSwarmEvents(state).filter((event) => event.type === "bossGateLocked").length, 0);
});

test("clearing all 300 enemies runs warning and panic beats before automatic boss-room entry", () => {
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
  assert.equal(state.expedition.gateUnlocked, true);
  assert.equal(state.expedition.clearTransition.phase, "warning");
  assert.equal(state.expedition.clearTransition.duration, 1.2);
  assert.equal(state.expedition.reachedGate, false);
  assert.ok(drainSwarmEvents(state).some((event) => event.type === "routeClearWarning"));

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

test("the route minimap exposes capped deterministic normalized player and live-enemy samples", () => {
  const create = () => {
    const state = createSwarmState({ random: seededRandom(47), duration: 360, expedition: true });
    for (const enemy of state.enemies) enemy.spawnDelay = 0;
    state.player.x = state.expedition.originX + state.expedition.routeLength * 0.25;
    state.player.y = 540;
    return getSwarmHud(state).expedition.minimap;
  };
  const first = create();
  const second = create();

  assert.equal(first.player.x, 0.25);
  assert.equal(first.player.y, 0.5);
  assert.equal(first.sampleCap, 24);
  assert.equal(first.liveEnemyCount, 36);
  assert.equal(first.enemies.length, 24);
  assert.deepEqual(first, second);
  assert.ok(first.enemies.every((enemy) => enemy.x >= 0 && enemy.x <= 1 && enemy.y >= 0 && enemy.y <= 1));
  assert.deepEqual(first.bossGate, { x: 11200 / 12000, y: 0.5, locked: true });
});

test("expedition navigation blocks the lower cliff outside the authored route floor", () => {
  const state = createSwarmState({ random: seededRandom(12), duration: 360, expedition: true });
  const input = createSwarmInput();
  input.down = true;
  state.enemies.length = 0;
  state.spawnedEnemies = state.enemyBudget;
  state.killedEnemies = state.enemyBudget - 1;
  state.player.invulnerability = 99;
  state.levelFlow.firstDeadline = 999;
  state.levelFlow.nextOfferAt = 999;
  for (let index = 0; index < 360; index += 1) stepSwarm(state, input, 1 / 60);

  assert.equal(state.player.y, 930 - state.player.radius);
  assert.equal(state.player.vy, 0);
});

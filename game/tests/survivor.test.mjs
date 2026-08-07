import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeBuild,
  applyUpgrade,
  createGameState,
  createInputState,
  spawnEnemy,
  stepGame,
} from "../src/survivor/engine.js";

test("AI selects a kinetic counter when pulse damage dominates", () => {
  const protocol = analyzeBuild({
    damage: { ballistic: 900, arc: 90, orbit: 0, tower: 10 },
    distance: 5000,
    towerBuilds: 0,
    window: 40,
  });
  assert.equal(protocol.id, "armor");
});

test("AI prioritizes tower hackers when deployables dominate", () => {
  const protocol = analyzeBuild({
    damage: { ballistic: 300, arc: 0, orbit: 0, tower: 500 },
    distance: 4200,
    towerBuilds: 3,
    window: 40,
  });
  assert.equal(protocol.id, "hacker");
});

test("stationary builds trigger area denial while mobile mixed builds trigger pursuit", () => {
  const stationary = analyzeBuild({
    damage: { ballistic: 300, arc: 250, orbit: 180, tower: 50 },
    distance: 900,
    towerBuilds: 0,
    window: 40,
  });
  const mobile = analyzeBuild({
    damage: { ballistic: 300, arc: 250, orbit: 180, tower: 50 },
    distance: 5000,
    towerBuilds: 0,
    window: 40,
  });
  assert.equal(stationary.id, "siege");
  assert.equal(mobile.id, "rush");
});

test("starter pulse weapon kills a hunter in one hit", () => {
  const state = createGameState({ random: () => 0.5 });
  state.spawnCooldown = 999;
  const enemy = spawnEnemy(state, "hunter", 1);
  enemy.x = state.player.x + 115;
  enemy.y = state.player.y;
  enemy.hp = 22;
  enemy.maxHp = 22;
  const input = createInputState();
  for (let frame = 0; frame < 40 && state.enemies.length; frame += 1) stepGame(state, input, 1 / 60);
  assert.equal(state.enemies.length, 0);
  assert.equal(state.player.kills, 1);
});

test("level upgrades modify combat stats and resume the game", () => {
  const state = createGameState({ random: () => 0.5 });
  state.status = "upgrade";
  const before = state.player.stats.damage;
  assert.equal(applyUpgrade(state, "pulse"), true);
  assert.ok(state.player.stats.damage > before);
  assert.equal(state.player.upgrades.pulse, 1);
  assert.equal(state.status, "running");
});

test("sentry deployment consumes data and creates a live tower", () => {
  const state = createGameState({ random: () => 0.5 });
  state.spawnCooldown = 999;
  const input = createInputState();
  input.deploySentryPressed = true;
  const before = state.player.scrap;
  stepGame(state, input, 1 / 60);
  assert.equal(state.towers.length, 1);
  assert.equal(state.towers[0].kind, "sentry");
  assert.equal(state.player.scrap, before - 18);
});

test("held movement input accelerates smoothly and covers meaningful distance", () => {
  const state = createGameState({ random: () => 0.5 });
  state.spawnCooldown = 999;
  const input = createInputState();
  input.right = true;
  const startX = state.player.x;
  stepGame(state, input, 1 / 60);
  const firstVelocity = state.player.vx;
  for (let frame = 0; frame < 45; frame += 1) stepGame(state, input, 1 / 60);
  assert.ok(firstVelocity > 0 && firstVelocity < state.player.speed);
  assert.ok(state.player.vx > firstVelocity);
  assert.ok(state.player.x - startX > 120);
});

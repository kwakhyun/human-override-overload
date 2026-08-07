import assert from "node:assert/strict";
import test from "node:test";
import {
  createGameState,
  createInputState,
  damageEnemy,
  fallZone,
  purchaseShopItem,
  selectControlledZone,
  spawnEnemy,
  stepGame,
} from "../src/survivor/engine.js";

function stopSpawns(state) {
  for (const zone of state.zones) zone.spawnCooldown = 999;
}

test("a run starts with four distinct active fronts and one shared gold pool", () => {
  const state = createGameState({ random: () => 0.5 });
  assert.equal(state.zones.length, 4);
  assert.equal(state.heroes.length, 4);
  assert.equal(new Set(state.heroes.map((hero) => hero.archetype)).size, 4);
  assert.equal(state.zones.every((zone) => zone.status === "active"), true);
  assert.equal(typeof state.gold, "number");
  assert.equal("xp" in state.heroes[0], false);
  assert.equal("scrap" in state.heroes[0], false);
});

test("only one front is manually linked while the other front keeps moving under AI", () => {
  const state = createGameState({ random: () => 0.5 });
  stopSpawns(state);
  selectControlledZone(state, 0);
  const input = createInputState();
  input.right = true;
  const manualStart = state.heroes[0].x;
  const aiStart = { x: state.heroes[1].x, y: state.heroes[1].y };
  const enemy = spawnEnemy(state, "raider", 1);
  enemy.x = state.heroes[1].x + 54;
  enemy.y = state.heroes[1].y;
  for (let frame = 0; frame < 30; frame += 1) stepGame(state, input, 1 / 60);
  assert.ok(state.heroes[0].x > manualStart + 20);
  assert.ok(Math.hypot(state.heroes[1].x - aiStart.x, state.heroes[1].y - aiStart.y) > 4);
  assert.equal(state.controlledZoneId, 0);
});

test("starter heroes can eliminate a normal raider in one attack and earn shared gold", () => {
  const state = createGameState({ random: () => 0.5 });
  stopSpawns(state);
  const hero = state.heroes[0];
  const enemy = spawnEnemy(state, "raider", 0);
  enemy.x = hero.x + 88;
  enemy.y = hero.y;
  const beforeGold = state.gold;
  const input = createInputState();
  for (let frame = 0; frame < 45 && !enemy.dead; frame += 1) stepGame(state, input, 1 / 60);
  assert.equal(enemy.dead, true);
  assert.equal(state.gold, beforeGold + enemy.gold);
  assert.equal(state.runStats.kills, 1);
});

test("direct enemy kills also deposit gold immediately without experience drops", () => {
  const state = createGameState({ random: () => 0.5 });
  stopSpawns(state);
  const enemy = spawnEnemy(state, "shooter", 2);
  const before = state.gold;
  damageEnemy(state, enemy, enemy.maxHp + 1, 2, "test");
  assert.equal(state.gold, before + enemy.gold);
  assert.equal(state.runStats.killsByZone[2], 1);
  assert.equal("gems" in state, false);
});

test("shop purchases spend the common treasury but strengthen only the selected hero", () => {
  const state = createGameState({ random: () => 0.5 });
  state.gold = 500;
  selectControlledZone(state, 2);
  const selectedDamage = state.heroes[2].stats.damage;
  const otherDamage = state.heroes[1].stats.damage;
  const beforeGold = state.gold;
  assert.equal(purchaseShopItem(state, "arsenal"), true);
  assert.ok(state.heroes[2].stats.damage > selectedDamage);
  assert.equal(state.heroes[1].stats.damage, otherDamage);
  assert.ok(state.gold < beforeGold);
});

test("purchasing sprite-backed skills creates deployables and unlocks the combat drone", () => {
  const state = createGameState({ random: () => 0.5 });
  state.gold = 1000;
  selectControlledZone(state, 1);
  assert.equal(purchaseShopItem(state, "sentry"), true);
  assert.equal(purchaseShopItem(state, "emp"), true);
  assert.equal(purchaseShopItem(state, "drone"), true);
  assert.equal(state.towers.some((tower) => tower.kind === "sentry" && tower.zoneId === 1), true);
  assert.equal(state.towers.some((tower) => tower.kind === "emp" && tower.zoneId === 1), true);
  assert.equal(state.heroes[1].upgrades.drone, 1);
});

test("a fallen front redirects its enemies and raises invasion levels elsewhere", () => {
  const state = createGameState({ random: () => 0.5 });
  stopSpawns(state);
  selectControlledZone(state, 0);
  const invaders = [spawnEnemy(state, "raider", 0), spawnEnemy(state, "shooter", 0)];
  assert.equal(fallZone(state, 0), true);
  assert.equal(state.zones[0].status, "fallen");
  assert.equal(state.controlledZoneId, null);
  assert.equal(state.heroes[0].dead, true);
  assert.equal(state.zones.slice(1).every((zone) => zone.invasionLevel === 1), true);
  assert.equal(invaders.every((enemy) => enemy.targetZoneId !== 0 && enemy.migrating), true);
  assert.equal(state.runStats.zonesLost, 1);
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  createGameState,
  createInputState,
  damageEnemy,
  fallZone,
  getArenaGroups,
  purchaseShopItem,
  returnToOverview,
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

test("the battlefield converges from four arenas to two joined arenas and then one final arena", () => {
  const state = createGameState({ random: () => 0.5 });
  stopSpawns(state);
  assert.deepEqual(getArenaGroups(state), [[0], [1], [2], [3]]);

  state.time = 99.99;
  stepGame(state, createInputState(), 0.02);
  assert.equal(state.phaseLevel, 1);
  assert.deepEqual(getArenaGroups(state), [[0, 2], [1, 3]]);

  state.time = 209.99;
  stepGame(state, createInputState(), 0.02);
  assert.equal(state.phaseLevel, 2);
  assert.deepEqual(getArenaGroups(state), [[0, 1, 2, 3]]);
  assert.equal(state.finalBossSpawned, true);
  assert.equal(state.enemies.some((enemy) => enemy.finalBoss), true);
});

test("manual squad movement trains every hero in the selected merged arena", () => {
  const state = createGameState({ random: () => 0.5 });
  stopSpawns(state);
  state.time = 99.99;
  stepGame(state, createInputState(), 0.02);
  selectControlledZone(state, 0);
  const input = createInputState();
  input.right = true;
  const starts = [state.heroes[0].x, state.heroes[2].x];
  for (let frame = 0; frame < 90; frame += 1) stepGame(state, input, 1 / 60);
  assert.ok(state.heroes[0].x > starts[0] + 15);
  assert.ok(state.heroes[2].x > starts[1] + 15);
  assert.ok(state.heroes[0].aiProfile.training > 0);
  assert.ok(state.heroes[2].aiProfile.training > 0);
});

test("clearing a final boss pattern deals percentage damage and exposes the core", () => {
  const state = createGameState({ random: () => 0.5 });
  stopSpawns(state);
  state.enemies = [];
  state.time = 209.99;
  stepGame(state, createInputState(), 0.02);
  const boss = state.enemies.find((enemy) => enemy.finalBoss);
  assert.ok(boss);
  const initialHp = boss.hp;
  for (let frame = 0; frame < 430 && state.runStats.patternsCleared === 0; frame += 1) {
    stepGame(state, createInputState(), 1 / 60);
  }
  assert.equal(state.runStats.patternsCleared, 1);
  assert.ok(boss.hp < initialHp - boss.maxHp * 0.06);
  assert.ok(boss.weakness > 0);
});

test("autopilot safety override escapes a lethal final-boss telegraph", () => {
  const state = createGameState({ random: () => 0.5 });
  stopSpawns(state);
  state.enemies = [];
  state.time = 209.99;
  stepGame(state, createInputState(), 0.02);
  const boss = state.enemies.find((enemy) => enemy.finalBoss);
  const hero = state.heroes[0];
  hero.x = boss.x;
  hero.y = boss.y - 120;
  hero.vx = 0;
  hero.vy = 0;
  state.bossPattern = {
    type: "crossfire",
    stage: "telegraph",
    timeLeft: 1,
    total: 2,
    markers: [],
    angle: 0,
  };
  returnToOverview(state);
  const startX = hero.x;
  stepGame(state, createInputState(), 1 / 60);
  assert.equal(hero.aiProfile.safetyOverride, true);
  assert.ok(hero.x > startX);
});

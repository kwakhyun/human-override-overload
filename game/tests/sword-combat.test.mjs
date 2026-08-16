import assert from "node:assert/strict";
import test from "node:test";

import {
  SWORD_MANUAL_ACTIVE_ABILITIES,
  chooseLevelReward,
  createSwarmInput,
  createSwarmState,
  setSwarmAim,
  stepSwarm,
} from "../src/swarm/engine.js";

const SWORD_WEAPON_REWARDS = new Set(["crescentWave", "titanEdge", "flashRend", "bladeStorm"]);
const RIFLE_WEAPON_REWARDS = new Set(["scatter", "rail", "rocket", "orbit"]);

test("beam-sword manual skills use frequent combat cooldowns", () => {
  assert.deepEqual(
    Object.values(SWORD_MANUAL_ACTIVE_ABILITIES).map(({ id, baseCooldown }) => [id, baseCooldown]),
    [
      ["spectralSwordArray", 6],
      ["phantomRend", 9],
      ["imperialSwordDomain", 15],
      ["heavenfallExecution", 45],
    ],
  );
});

function isolateTarget(state, distance = 110) {
  const target = state.enemies[0];
  state.enemies = [target];
  state.spawnedEnemies = state.enemyBudget;
  target.spawnDelay = 0;
  target.x = state.player.x + distance;
  target.y = state.player.y;
  target.speed = 0;
  target.damage = 0;
  target.hp = 100000;
  target.maxHp = target.hp;
  setSwarmAim(state, state.player.x + 600, state.player.y);
  return target;
}

function grant(state, id, category = "weapon") {
  state.levelupPending = true;
  state.rewardOptions = [{ id, category, name: id, description: id, level: 0, nextLevel: 1 }];
  assert.equal(chooseLevelReward(state, id), true);
}

test("beam sword replaces pulse fire with an authoritative close-range sweep", () => {
  const state = createSwarmState({ random: () => 0.5, mainWeaponId: "beam-sword" });
  const target = isolateTarget(state);
  const before = target.hp;
  stepSwarm(state, createSwarmInput(), 1 / 60);
  assert.equal(state.player.mainWeaponId, "beam-sword");
  assert.ok(target.hp < before);
  assert.ok(state.swordEffects.some((effect) => effect.type === "swordSlash"));
  assert.equal(state.projectiles.some((projectile) => projectile.kind === "pulse"), false);
});

test("sword upgrades launch waves, giant sweeps, dash cuts, and circular storms", () => {
  const cases = [
    ["crescentWave", "wave", "crescentWave"],
    ["titanEdge", "titan", "titanEdge"],
    ["flashRend", "flash", "flashRend"],
    ["bladeStorm", "storm", "bladeStorm"],
  ];
  for (const [rewardId, timerId, effectId] of cases) {
    const state = createSwarmState({ random: () => 0.5, mainWeaponId: "beam-sword" });
    isolateTarget(state, rewardId === "flashRend" ? 230 : 105);
    grant(state, rewardId);
    for (const key of Object.keys(state.player.fireTimers)) state.player.fireTimers[key] = 999;
    state.player.fireTimers[timerId] = 0;
    const beforeX = state.player.x;
    stepSwarm(state, createSwarmInput(), 1 / 60);
    if (rewardId === "crescentWave") assert.ok(state.projectiles.some((projectile) => projectile.kind === "crescentWave"));
    else assert.ok(state.swordEffects.some((effect) => effect.type === effectId));
    if (rewardId === "flashRend") assert.ok(state.player.x > beforeX);
  }
});

test("level-up weapon and skill trees depend on the equipped main weapon", () => {
  for (const mainWeaponId of ["pulse-rifle", "beam-sword"]) {
    const state = createSwarmState({ random: () => 0.42, mainWeaponId });
    state.time = 6.5;
    state.phaseTime = 6.5;
    state.levelFlow.queuedLevels = 1;
    stepSwarm(state, createSwarmInput(), 1 / 60);
    const weapon = state.rewardOptions.find((option) => option.category === "weapon")?.id;
    const skill = state.rewardOptions.find((option) => option.category === "skill")?.id;
    assert.equal(mainWeaponId === "beam-sword" ? SWORD_WEAPON_REWARDS.has(weapon) : RIFLE_WEAPON_REWARDS.has(weapon), true);
    if (mainWeaponId === "beam-sword") {
      assert.equal(RIFLE_WEAPON_REWARDS.has(weapon), false);
      assert.ok(["edgeReach", "edgeGuard", "damage", "fireRate", "shield", "dash", "regen"].includes(skill));
    } else {
      assert.equal(SWORD_WEAPON_REWARDS.has(weapon), false);
    }
  }
});

test("base weapon bonuses apply only through the selected weapon multiplier", () => {
  const normal = createSwarmState({ random: () => 0.5, mainWeaponId: "beam-sword" });
  const boosted = createSwarmState({ random: () => 0.5, mainWeaponId: "beam-sword", combatBonuses: { swordDamageMultiplier: 1.5 } });
  const normalTarget = isolateTarget(normal);
  const boostedTarget = isolateTarget(boosted);
  stepSwarm(normal, createSwarmInput(), 1 / 60);
  stepSwarm(boosted, createSwarmInput(), 1 / 60);
  assert.ok((boostedTarget.maxHp - boostedTarget.hp) > (normalTarget.maxHp - normalTarget.hp));
  assert.equal(boosted.player.weaponDamageMultiplier, 1.5);
});

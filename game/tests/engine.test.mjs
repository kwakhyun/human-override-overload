import assert from "node:assert/strict";
import test from "node:test";
import {
  createModel,
  createRuntime,
  detectionGainPerSecond,
  determineRoute,
  getStageConfig,
  learnRoute,
  movePlayer,
  positionIsWalkable,
  readPrediction,
  samplePatrolSmooth,
} from "../src/game/engine.js";
import {
  INITIAL_LOADOUT,
  applyReward,
  createWeaponProjectiles,
  getRewardChoices,
  WEAPONS,
} from "../src/game/equipment.js";
import {
  getPlayerDirectionRow,
  resolvePlayerAnimationState,
} from "../src/game/renderer.js";

test("repeating one corridor raises the AI prediction confidence", () => {
  const once = learnRoute(createModel(), "left");
  const twice = learnRoute(once, "left");
  const prediction = readPrediction(twice);

  assert.equal(prediction.side, "left");
  assert.ok(prediction.confidence > 0.86);
  assert.ok(prediction.confidence < 0.88);
});

test("route inference follows each stage's actual branch axis", () => {
  const upperTrace = [
    { x: 175, y: 506 },
    { x: 360, y: 280 },
    { x: 800, y: 185 },
    { x: 1400, y: 190 },
  ];
  const lowerTrace = upperTrace.map((point) => ({ x: point.x, y: 1012 - point.y }));
  const westArchiveTrace = [{ x: 855, y: 875 }, { x: 500, y: 700 }, { x: 430, y: 280 }];
  const eastArchiveTrace = westArchiveTrace.map((point) => ({ x: 1800 - point.x, y: point.y }));

  assert.equal(determineRoute(upperTrace, upperTrace.at(-1), 0), "left");
  assert.equal(determineRoute(lowerTrace, lowerTrace.at(-1), 0), "right");
  assert.equal(determineRoute(westArchiveTrace, westArchiveTrace.at(-1), 1), "left");
  assert.equal(determineRoute(eastArchiveTrace, eastArchiveTrace.at(-1), 1), "right");
});

test("navigation collision blocks visible machinery and keeps authored corridors open", () => {
  assert.equal(positionIsWalkable({ x: 900, y: 506 }, 0), false);
  assert.equal(positionIsWalkable({ x: 900, y: 185 }, 0), true);
  const blocked = movePlayer({ x: 410, y: 506 }, 40, 0, 0);
  assert.equal(blocked.x, 410);

  const alongUpperRail = movePlayer({ x: 700, y: 185 }, 55, 0, 0);
  assert.equal(alongUpperRail.x, 755);
});

test("every authored stage route stays inside the same navigation geometry shown by the minimap", () => {
  for (const stageIndex of [0, 1, 2]) {
    const stage = getStageConfig(stageIndex);
    for (const side of ["left", "right"]) {
      for (const point of stage.routePaths[side]) {
        assert.equal(positionIsWalkable(point, stageIndex, 0), true, `${stage.id}:${side}`);
      }
    }
  }
});

test("player animation state prioritizes alert, dash, run, and idle", () => {
  assert.equal(resolvePlayerAnimationState({ hitPulse: 0.3, dashRemaining: 0.2, actualSpeed: 300 }), "alert");
  assert.equal(resolvePlayerAnimationState({ hitPulse: 0, dashRemaining: 0.2, actualSpeed: 300 }), "dash");
  assert.equal(resolvePlayerAnimationState({ hitPulse: 0, dashRemaining: 0, actualSpeed: 126 }), "run");
  assert.equal(resolvePlayerAnimationState({ hitPulse: 0, dashRemaining: 0, actualSpeed: 0 }), "idle");
});

test("player direction rows map north, east, south, and west without rotating sprites", () => {
  assert.equal(getPlayerDirectionRow(-Math.PI / 2), 0);
  assert.equal(getPlayerDirectionRow(0), 1);
  assert.equal(getPlayerDirectionRow(Math.PI / 2), 2);
  assert.equal(getPlayerDirectionRow(Math.PI), 3);
  assert.equal(getPlayerDirectionRow(-Math.PI), 3);
});

test("each stage has a distinct map and escalates enemy composition", () => {
  const maps = [0, 1, 2].map((index) => getStageConfig(index).mapSrc);
  assert.equal(new Set(maps).size, 3);
  assert.equal(createRuntime(0, "left").enforcers.length, 0);
  assert.equal(createRuntime(1, "left").enforcers.length, 1);
  assert.equal(createRuntime(2, "left").enforcers.length, 2);
  const areaSignatures = [0, 1, 2].map((index) =>
    getStageConfig(index).walkableAreas.map((area) => area.type).join(","));
  assert.equal(new Set(areaSignatures).size, 3);
  assert.ok(getStageConfig(0).worldWidth > 1000);
});

test("humanoid sight accumulates detection far slower than a drone lock", () => {
  const droneOnly = detectionGainPerSecond(1, 0);
  const humanoidOnly = detectionGainPerSecond(0, 1);
  assert.ok(humanoidOnly < droneOnly * 0.2);
  assert.ok(humanoidOnly <= 0.07);
});

test("smooth patrol interpolates position and facing continuously around a loop", () => {
  const path = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ];
  const before = samplePatrolSmooth(path, 0.99, 25, 0);
  const after = samplePatrolSmooth(path, 1.01, 25, 0);
  assert.ok(Math.hypot(after.x - before.x, after.y - before.y) < 3);
  assert.ok(Number.isFinite(before.facing));
  assert.ok(Number.isFinite(after.facing));
});

test("stage rewards add weapons and active abilities without losing the starter weapon", () => {
  const firstChoices = getRewardChoices(0, INITIAL_LOADOUT).map((choice) => choice.id);
  assert.deepEqual(firstChoices, ["arc", "scatter", "shield", "emp"]);
  const armed = applyReward(INITIAL_LOADOUT, "arc");
  const equipped = applyReward(armed, "shield");
  assert.deepEqual(equipped.weapons, ["pulse", "arc"]);
  assert.equal(equipped.activeWeapon, "arc");
  assert.deepEqual(equipped.abilities, ["shield"]);
});

test("scatter and rail weapon projectiles preserve their distinct behavior", () => {
  const scatter = createWeaponProjectiles("scatter", { x: 10, y: 20 }, 0);
  const rail = createWeaponProjectiles("rail", { x: 10, y: 20 }, 0);
  assert.equal(scatter.length, 3);
  assert.equal(rail.length, 1);
  assert.equal(rail[0].piercing, true);
  assert.ok(rail[0].damage > scatter[0].damage);
  assert.ok(WEAPONS.pulse.damage >= createRuntime(1, "left").enforcers[0].hp);
});

import assert from "node:assert/strict";
import test from "node:test";

const animation = await import(new URL("../src/phaser/view/animation/manualAbilityAnimation.ts", import.meta.url));

test("manual Q/E/F/R visuals own one deterministic six-by-four atlas row each", () => {
  assert.deepEqual(animation.MANUAL_ABILITY_ATLAS_LAYOUT, { columns: 6, rows: 4 });
  assert.deepEqual(animation.MANUAL_ABILITY_ROWS, {
    empPulse: 0,
    aegisWard: 1,
    stratosRun: 2,
    helixTempest: 3,
  });

  const samples = [
    animation.resolveManualAbilityAtlasFrame("empPulse", { life: 0.92, maxLife: 0.92 }),
    animation.resolveManualAbilityAtlasFrame("aegisWard", { life: 2.5, maxLife: 5 }),
    animation.resolveManualAbilityAtlasFrame("stratosRun", { phase: "warning", warningProgress: 0.8 }),
    animation.resolveManualAbilityAtlasFrame("helixTempest", { life: 2, maxLife: 3.2, angle: Math.PI }),
  ];
  assert.deepEqual(samples.map((frame) => frame.row), [0, 1, 2, 3]);
  for (const frame of samples) assert.ok(frame.column >= 0 && frame.column < 6);
});

test("field effects and stratos sweeps advance from engine lifetime and phase state", () => {
  assert.equal(animation.manualAbilityLifetimeProgress({ life: 3, maxLife: 3 }), 0);
  assert.equal(animation.manualAbilityLifetimeProgress({ life: 1.5, maxLife: 3 }), 0.5);
  assert.equal(animation.resolveManualAbilityAtlasFrame("empPulse", { life: 0.92, maxLife: 0.92 }).column, 0);
  assert.equal(animation.resolveManualAbilityAtlasFrame("empPulse", { life: 0.04, maxLife: 0.92 }).column, 5);
  assert.equal(animation.resolveManualAbilityAtlasFrame("aegisWard", { life: 0, maxLife: 5 }).column, 5);
  assert.equal(animation.resolveManualAbilityAtlasFrame("stratosRun", { phase: "warning", warningProgress: 0.2 }).column, 0);
  assert.equal(animation.resolveManualAbilityAtlasFrame("stratosRun", { phase: "warning", warningProgress: 0.8 }).column, 1);
  assert.equal(animation.resolveManualAbilityAtlasFrame("stratosRun", { phase: "sweep", sweepProgress: 0 }).column, 2);
  assert.equal(animation.resolveManualAbilityAtlasFrame("stratosRun", { phase: "sweep", sweepProgress: 0.5 }).column, 3);
  assert.equal(animation.resolveManualAbilityAtlasFrame("stratosRun", { phase: "sweep", sweepProgress: 0.96 }).column, 5);
});

test("helix rotor frames follow the engine angle and reserve the last frame for collapse", () => {
  const active = (angle) => animation.resolveManualAbilityAtlasFrame("helixTempest", {
    life: 2.4,
    maxLife: 3.2,
    angle,
  }).column;
  assert.deepEqual([active(0), active(Math.PI / 2), active(Math.PI), active(Math.PI * 1.5)], [1, 2, 3, 4]);
  assert.equal(animation.resolveManualAbilityAtlasFrame("helixTempest", { life: 0.2, maxLife: 3.2, angle: 0 }).column, 5);
});

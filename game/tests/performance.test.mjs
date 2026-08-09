import test from "node:test";
import assert from "node:assert/strict";

import {
  advanceRenderClock,
  createPerformanceGovernor,
  detectInitialQuality,
  QUALITY_PRESETS,
} from "../src/adversarial/performance.js";

test("render clock never poisons the animation loop with a non-finite accumulator", () => {
  const first = advanceRenderClock(Infinity, 16.67, 45);
  assert.equal(first.shouldRender, true);
  assert.equal(Number.isFinite(first.accumulator), true);
  const second = advanceRenderClock(first.accumulator, 16.67, 45);
  assert.equal(Number.isFinite(second.accumulator), true);
});

test("45fps pacing renders three of every four 60Hz frames", () => {
  let accumulator = 0;
  let rendered = 0;
  for (let frame = 0; frame < 12; frame += 1) {
    const clock = advanceRenderClock(accumulator, 1000 / 60, 45);
    accumulator = clock.accumulator;
    if (clock.shouldRender) rendered += 1;
  }
  assert.equal(rendered, 9);
  assert.equal(Number.isFinite(accumulator), true);
});

test("low-end and high-end devices start in sensible quality tiers", () => {
  assert.equal(detectInitialQuality({
    devicePixelRatio: 2,
    navigator: { hardwareConcurrency: 4, deviceMemory: 4 },
    matchMedia: () => ({ matches: false }),
  }), "performance");
  assert.equal(detectInitialQuality({
    devicePixelRatio: 1,
    navigator: { hardwareConcurrency: 12, deviceMemory: 16 },
    matchMedia: () => ({ matches: false }),
  }), "cinematic");
});

test("sustained slow frames downgrade quality with hysteresis", () => {
  const governor = createPerformanceGovernor({ initialQuality: "cinematic" });
  let now = 0;
  let changed = false;
  for (let frame = 0; frame < 120; frame += 1) {
    now += 40;
    changed = governor.sample(40, now) || changed;
  }
  assert.equal(changed, true);
  assert.equal(governor.preset.id, "balanced");
  assert.ok(governor.snapshot.fps < 30);
});

test("quality presets reduce expensive effects and pixel density together", () => {
  assert.ok(QUALITY_PRESETS.cinematic.dprCap > QUALITY_PRESETS.balanced.dprCap);
  assert.ok(QUALITY_PRESETS.balanced.dprCap > QUALITY_PRESETS.performance.dprCap);
  assert.ok(QUALITY_PRESETS.cinematic.maxParticles > QUALITY_PRESETS.performance.maxParticles);
  assert.ok(QUALITY_PRESETS.cinematic.renderScale > QUALITY_PRESETS.balanced.renderScale);
  assert.ok(QUALITY_PRESETS.balanced.renderScale > QUALITY_PRESETS.performance.renderScale);
  assert.ok(QUALITY_PRESETS.performance.renderFps >= 40);
  assert.equal(QUALITY_PRESETS.performance.filters, false);
  assert.equal(QUALITY_PRESETS.performance.shadows, false);
});

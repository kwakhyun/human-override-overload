import test from "node:test";
import assert from "node:assert/strict";

import {
  advanceRenderClock,
  assessDeviceCapabilities,
  createPerformanceGovernor,
  detectInitialQuality,
  getRenderBackingSize,
  QUALITY_PRESETS,
} from "../src/swarm/performance.js";
import { applyAdaptiveRenderPolicy } from "../src/phaser/performance/adaptiveRenderPolicy.ts";

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
  // Chromium reports deviceMemory in coarse buckets capped at 8 GB; a strong
  // CPU and 1x DPR must therefore still be allowed to use the top tier.
  assert.equal(detectInitialQuality({
    devicePixelRatio: 1,
    navigator: { hardwareConcurrency: 12, deviceMemory: 8 },
    matchMedia: () => ({ matches: false }),
  }), "cinematic");
});

test("reduced motion and missing hardware telemetry choose the safe tier", () => {
  assert.equal(detectInitialQuality({
    devicePixelRatio: 1,
    navigator: {},
    matchMedia: () => ({ matches: false }),
  }), "performance");
  const reduced = assessDeviceCapabilities({
    devicePixelRatio: 1,
    navigator: { hardwareConcurrency: 12, deviceMemory: 16 },
    matchMedia: () => ({ matches: true }),
  });
  assert.equal(reduced.qualityId, "performance");
  assert.ok(reduced.reasons.includes("reduced-motion"));
});

test("a high-DPR device needs weak CPU or memory evidence before forcing performance", () => {
  assert.equal(detectInitialQuality({
    devicePixelRatio: 3,
    navigator: { hardwareConcurrency: 12, deviceMemory: 16 },
    matchMedia: () => ({ matches: false }),
  }), "balanced");
  assert.equal(detectInitialQuality({
    devicePixelRatio: 3,
    navigator: { hardwareConcurrency: 8, deviceMemory: 8 },
    matchMedia: () => ({ matches: false }),
  }), "performance");
});

test("sustained slow frames downgrade twice while isolated spikes decay", () => {
  const governor = createPerformanceGovernor({ initialQuality: "cinematic" });
  let now = 0;
  let changed = false;
  for (let frame = 0; frame < 120; frame += 1) {
    now += 40;
    changed = governor.sample(40, now) || changed;
  }
  assert.equal(changed, true);
  assert.equal(governor.preset.id, "performance");
  assert.ok(governor.snapshot.fps < 30);

  const stable = createPerformanceGovernor({ initialQuality: "cinematic" });
  stable.sample(80, 80);
  for (let frame = 1; frame < 180; frame += 1) stable.sample(1000 / 60, 80 + frame * 1000 / 60);
  assert.equal(stable.preset.id, "cinematic");
});

test("hardware ceilings prevent a low-end device from self-upgrading", () => {
  const governor = createPerformanceGovernor({
    environment: {
      devicePixelRatio: 2,
      navigator: { hardwareConcurrency: 4, deviceMemory: 4 },
      matchMedia: () => ({ matches: false }),
    },
  });
  let now = 0;
  for (let frame = 0; frame < 900; frame += 1) {
    now += 1000 / 30;
    governor.sample(1000 / 30, now);
  }
  assert.equal(governor.preset.id, "performance");
  assert.equal(governor.snapshot.autoQualityCeiling, "performance");
});

test("background discontinuities and explicit pause do not poison frame history", () => {
  const governor = createPerformanceGovernor({ initialQuality: "cinematic" });
  governor.pause();
  assert.equal(governor.sample(5000, 5000), false);
  assert.equal(governor.snapshot.samples, 0);
  governor.resume(5000);
  assert.equal(governor.sample(5000, 10000), false);
  assert.equal(governor.preset.id, "cinematic");
  assert.equal(governor.snapshot.interruptions, 2);
  assert.equal(governor.snapshot.samples, 0);
});

test("quality presets reduce expensive effects and pixel density together", () => {
  assert.ok(QUALITY_PRESETS.cinematic.dprCap > QUALITY_PRESETS.balanced.dprCap);
  assert.ok(QUALITY_PRESETS.balanced.dprCap > QUALITY_PRESETS.performance.dprCap);
  assert.ok(QUALITY_PRESETS.cinematic.maxParticles > QUALITY_PRESETS.performance.maxParticles);
  assert.ok(QUALITY_PRESETS.cinematic.renderScale > QUALITY_PRESETS.balanced.renderScale);
  assert.ok(QUALITY_PRESETS.balanced.renderScale > QUALITY_PRESETS.performance.renderScale);
  assert.equal(QUALITY_PRESETS.performance.renderFps, 30);
  assert.equal(QUALITY_PRESETS.performance.filters, false);
  assert.equal(QUALITY_PRESETS.performance.shadows, false);
  const backing = getRenderBackingSize(QUALITY_PRESETS.performance);
  assert.deepEqual(backing, {
    logicalWidth: 1280,
    logicalHeight: 720,
    backingWidth: 896,
    backingHeight: 504,
    renderScale: 0.7,
  });
});

test("runtime FPS changes defer Phaser loop restart until after the active frame callback", async () => {
  const calls = [];
  const loop = {
    fpsLimit: 60,
    targetFps: 60,
    setFPSLimit(fps) {
      calls.push(fps);
      this.fpsLimit = fps;
    },
    resetDelta() {},
  };
  const game = {
    loop,
    canvas: { width: 1280, height: 720, dataset: {} },
    renderer: {},
  };
  applyAdaptiveRenderPolicy(game, QUALITY_PRESETS.performance);
  assert.deepEqual(calls, [], "setFPSLimit must not restart RAF inside the current update callback");
  await Promise.resolve();
  assert.deepEqual(calls, [30]);
  applyAdaptiveRenderPolicy(game, QUALITY_PRESETS.performance);
  await Promise.resolve();
  assert.deepEqual(calls, [30], "an unchanged tier must not restart the loop again");
});

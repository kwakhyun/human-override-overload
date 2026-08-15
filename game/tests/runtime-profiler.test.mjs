import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  resolveProfilingTargetFrameMs,
  snapshotTextureMemory,
  summarizeSamples,
} from "../src/phaser/profiling/runtimeProfiler.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("frame summaries expose stable nearest-rank p50/p95/p99 and budget pressure", () => {
  const samples = Array.from({ length: 100 }, (_, index) => index + 1);
  const summary = summarizeSamples(samples, 50);
  assert.deepEqual(summary, {
    count: 100,
    minMs: 1,
    maxMs: 100,
    meanMs: 50.5,
    p50Ms: 50,
    p95Ms: 95,
    p99Ms: 99,
    budgetMs: 50,
    overBudgetRatio: 0.5,
  });
});

test("adaptive presentation budgets follow the active render cadence", () => {
  assert.equal(Math.round(resolveProfilingTargetFrameMs(60) * 1000) / 1000, 16.667);
  assert.equal(Math.round(resolveProfilingTargetFrameMs(45) * 1000) / 1000, 22.222);
  assert.equal(Math.round(resolveProfilingTargetFrameMs(30) * 1000) / 1000, 33.333);
  assert.equal(resolveProfilingTargetFrameMs(undefined, 20), 20);
});

test("texture snapshots dedupe shared sources and retain route, boss, common, and internal keys", () => {
  const shared = { src: "http://assets.test/shared.png", naturalWidth: 64, naturalHeight: 32 };
  const boss = { src: "http://assets.test/boss.png", naturalWidth: 128, naturalHeight: 128 };
  const route = { width: 320, height: 180 };
  const textures = new Map([
    ["overload-player", { source: [{ image: shared }] }],
    ["overload-shared-fx", { source: [{ image: shared }] }],
    ["overload-sector-01", { source: [{ image: route, width: 320, height: 180 }] }],
    ["overload-boss-forms", { source: [{ image: boss }] }],
    ["__WHITE", { source: [{ image: { width: 2, height: 2 } }] }],
  ]);
  const snapshot = snapshotTextureMemory({
    getTextureKeys: () => [...textures.keys()],
    get: (key) => textures.get(key),
  });

  assert.equal(snapshot.sourceCount, 4);
  assert.equal(snapshot.textureKeyCount, 5);
  assert.equal(snapshot.loadedTextureBytes, 0);
  assert.equal(snapshot.loadedTextureBytesKnownSources, 0);
  assert.equal(snapshot.categories.common.sourceCount, 1);
  assert.deepEqual(snapshot.categories.common.keys, ["overload-player", "overload-shared-fx"]);
  assert.equal(snapshot.categories.route.decodedRgba8Bytes, 320 * 180 * 4);
  assert.equal(snapshot.categories.boss.decodedRgba8Bytes, 128 * 128 * 4);
  assert.equal(snapshot.categories.internal.decodedRgba8Bytes, 2 * 2 * 4);
  assert.equal(snapshot.decodedRgba8Bytes, 64 * 32 * 4 + 320 * 180 * 4 + 128 * 128 * 4 + 2 * 2 * 4);
});

test("the runtime exposes profiling only behind Vite DEV and tears it down with the game", async () => {
  const [createGame, profiler, fixture, harness] = await Promise.all([
    read("src/phaser/createOverloadGame.ts"),
    read("src/phaser/profiling/runtimeProfiler.ts"),
    read("src/phaser/profiling/deterministicArsenal.ts"),
    read("qa/profile-phaser-runtime.mjs"),
  ]);
  assert.match(createGame, /import\.meta\.env\.DEV\s*\? installDevRuntimeProfiler/);
  assert.match(createGame, /query\.get\("region"\)/);
  assert.match(createGame, /if \(debugRegion\) launch = \{ \.\.\.launch, regionId: debugRegion \}/);
  assert.match(createGame, /qaProfiler\?\.destroy\(\)/);
  assert.match(createGame, /bossPattern: state\?\.boss\?\.activePattern\?\.type \?\? null/);
  assert.match(createGame, /renderFps: runtime\.governor\?\.preset\?\.renderFps/);
  assert.match(profiler, /__OVERLOAD_QA__/);
  assert.match(profiler, /waitForSamples/);
  assert.match(profiler, /renderSubmitCpu/);
  assert.match(profiler, /Physical VRAM allocation is unavailable/);
  assert.match(fixture, /const ENEMY_TARGET = 220/);
  assert.match(fixture, /const PROJECTILE_TARGET = 620/);
  assert.doesNotMatch(fixture, /setQuality\?\.\("cinematic"\)/);
  assert.match(fixture, /simulation rules and campaign saves were not/i);
  assert.match(harness, /\.home-base-screen/);
  assert.match(harness, /\.base-sortie-action/);
  assert.match(harness, /\.region-sortie-launch/);
  assert.match(harness, /mobile-portrait-390x844/);
});

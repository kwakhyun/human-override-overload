import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const manifest = await import(new URL("../src/game/assets/manifest.ts", import.meta.url));

function pngDimensions(bytes) {
  assert.equal(bytes.subarray(1, 4).toString("ascii"), "PNG");
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

const PERFORMANCE_PNG_SPECS = Object.freeze([
  ["hero/performance/survivor-directional-aim-atlas.png", 768, 768],
  ["hero/performance/survivor-sword-directional-aim-atlas.png", 768, 768],
  ["enemies/motion-v2/performance/suicide-drone-motion-atlas.png", 720, 480],
  ["enemies/motion-v2/performance/rifleman-motion-atlas.png", 720, 480],
  ["enemies/motion-v2/performance/sniper-motion-atlas.png", 720, 480],
  ["allies/motion-v2/performance/hunter-drone-motion-atlas.png", 480, 384],
  ["allies/motion-v2/performance/pulse-sentry-motion-atlas.png", 480, 384],
  ["allies/motion-v2/performance/suppressor-drone-motion-atlas.png", 480, 384],
  ["vfx/performance/combat-fx-atlas.png", 512, 384],
  ["vfx/gates/performance/sovereign-gate-motion-atlas.png", 864, 144],
  ["items/performance/healing-kit-motion-atlas.png", 384, 96],
  ["campaign/performance/squad-traces-atlas.png", 576, 192],
  ["boss/performance/wrong-engine-forms-atlas.png", 768, 256],
  ["boss/motion-v2/performance/wrong-engine-motion-atlas.png", 1440, 960],
  ["regions/glass-dune/performance/boss-forms-atlas.png", 768, 256],
  ["regions/glass-dune/motion-v2/performance/mirror-tyrant-motion-atlas.png", 1440, 960],
  ["regions/abyssal-archive/performance/boss-forms-atlas.png", 768, 256],
  ["regions/abyssal-archive/motion-v2/performance/drowned-oracle-motion-atlas.png", 1440, 960],
]);

test("PERFORMANCE selects lighter paths without changing stable Phaser texture keys", async () => {
  const full = manifest.getGameAssetsForRegion("wrong-engine-core", "full");
  const performance = manifest.getGameAssetsForRegion("wrong-engine-core", "performance");
  assert.deepEqual(performance.map((asset) => asset.key), full.map((asset) => asset.key));

  const fullByKey = new Map(full.map((asset) => [asset.key, asset]));
  let variants = 0;
  for (const asset of performance) {
    const original = fullByKey.get(asset.key);
    if (!original?.performancePath) continue;
    variants += 1;
    assert.equal(asset.path, original.performancePath);
    assert.match(asset.path, /\/performance\//);
    await access(new URL(`../public/${asset.path.replace(/^\.\//, "")}`, import.meta.url));
  }
  assert.ok(variants >= 11, "route bundle must replace all dominant decoded textures");

  const fullBoss = manifest.getBossGameAssetsForRegion("wrong-engine-core", "full");
  const performanceBoss = manifest.getBossGameAssetsForRegion("wrong-engine-core", "performance");
  assert.deepEqual(performanceBoss.map((asset) => asset.key), fullBoss.map((asset) => asset.key));
  const bossPixelKeys = new Set([
    manifest.ASSET_KEYS.bossPatternCommonPixel,
    manifest.ASSET_KEYS.bossPatternRegionalPixel,
    manifest.ASSET_KEYS.bossTimedBombPixel,
  ]);
  assert.ok(performanceBoss.filter((asset) => !bossPixelKeys.has(asset.key)).every((asset) => asset.path.includes("/performance/")));
  assert.deepEqual(
    performanceBoss.filter((asset) => bossPixelKeys.has(asset.key)).map((asset) => asset.path),
    fullBoss.filter((asset) => bossPixelKeys.has(asset.key)).map((asset) => asset.path),
    "native 64px boss pixel sheets are already the low-memory profile and must not be duplicated",
  );
  assert.equal(manifest.getAllyMotionAsset("hunter-drone", "performance")?.path.includes("/performance/"), true);
});

test("generated low-memory atlases keep their authored grids and expected dimensions", async () => {
  for (const [relativePath, width, height] of PERFORMANCE_PNG_SPECS) {
    const bytes = await readFile(new URL(`../public/assets/overload/${relativePath}`, import.meta.url));
    assert.deepEqual(pngDimensions(bytes), [width, height], relativePath);
    assert.equal(bytes[25], 6, `${relativePath} must retain RGBA transparency`);
  }

  for (const relativePath of [
    "environment/performance/sector-01-shattered-approach.webp",
    "environment/performance/sector-02-flooded-memorial.webp",
    "environment/performance/sector-03-engine-causeway.webp",
    "environment/performance/boss-chamber.webp",
    "regions/glass-dune/performance/route.webp",
    "regions/glass-dune/performance/boss-room.webp",
    "regions/abyssal-archive/performance/route.webp",
    "regions/abyssal-archive/performance/boss-room.webp",
  ]) {
    const bytes = await readFile(new URL(`../public/assets/overload/${relativePath}`, import.meta.url));
    assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF", relativePath);
    assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP", relativePath);
  }
});

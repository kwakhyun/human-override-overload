import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const animation = await import(new URL("../src/phaser/view/animation/bossPatternAnimation.ts", import.meta.url));
const root = new URL("../", import.meta.url);

test("common and regional boss mechanics own stable six-frame pixel rows", () => {
  assert.deepEqual(animation.COMMON_BOSS_PATTERN_ATLAS_LAYOUT, { columns: 6, rows: 6 });
  assert.deepEqual(animation.REGIONAL_BOSS_PATTERN_ATLAS_LAYOUT, { columns: 6, rows: 4 });
  assert.deepEqual(animation.COMMON_BOSS_PATTERN_ROWS, {
    radial: 0, sweep: 1, bombs: 2, rings: 3, charge: 4, multiCharge: 5,
  });
  assert.deepEqual(animation.REGIONAL_BOSS_PATTERN_ROWS, {
    prismLattice: 0, solarFlare: 1, memorySpiral: 2, depthCollapse: 3,
  });
});

test("warning and active phases address the first and second halves of each row", () => {
  assert.deepEqual(animation.resolveBossPatternAtlasFrame("radial", { phase: "warning", life: 1, maxLife: 1 }), { atlas: "common", column: 0, row: 0 });
  assert.deepEqual(animation.resolveBossPatternAtlasFrame("bombs", { phase: "warning", life: 0.05, maxLife: 1 }), { atlas: "common", column: 2, row: 2 });
  assert.deepEqual(animation.resolveBossPatternAtlasFrame("multiCharge", { phase: "active", life: 0.52, activeLife: 0.52 }), { atlas: "common", column: 3, row: 5 });
  assert.deepEqual(animation.resolveBossPatternAtlasFrame("prismLattice", { phase: "active", life: 0.01, activeLife: 1 }), { atlas: "regional", column: 5, row: 0 });
  assert.deepEqual(animation.resolveBossPatternAtlasFrame("depth-collapse", { phase: "warning", life: 0.5, maxLife: 1 }), { atlas: "regional", column: 1, row: 3 });
  assert.equal(animation.resolveBossPatternAtlasFrame("unknown", {}), null);
});

test("both shipped sheets keep authored HD cells and RGBA transparency", async () => {
  for (const [name, width, height] of [
    ["boss-patterns.png", 1152, 1152],
    ["regional-patterns.png", 1152, 768],
  ]) {
    const png = await readFile(new URL(`public/assets/overload/quality-v3/${name}`, root));
    assert.equal(png.toString("ascii", 1, 4), "PNG");
    assert.equal(png.readUInt32BE(16), width);
    assert.equal(png.readUInt32BE(20), height);
    assert.equal(png[25], 6);
  }
});

test("BattleView layers boss pixels over, not instead of, authoritative warning geometry", async () => {
  const [view, manifest] = await Promise.all([
    readFile(new URL("src/phaser/view/BattleView.ts", root), "utf8"),
    readFile(new URL("src/game/assets/manifest.ts", root), "utf8"),
  ]);
  assert.match(view, /drawTelegraphs\(state, time, quality\);/);
  assert.match(view, /syncBossPatternSprites\(state, time, quality\);/);
  assert.match(view, /resolveBossPatternAtlasFrame/);
  assert.match(view, /bossPatternLayer/);
  assert.match(view, /const patternOffset = Math\.max\(230, bossRadius \* 2\.15\)/);
  assert.match(view, /placeOutsideBoss\(patternAngle\)/);
  assert.doesNotMatch(view, /state\.boss\.[a-zA-Z]+\s*=/);
  assert.match(manifest, /bossPatternCommonPixel/);
  assert.match(manifest, /bossPatternRegionalPixel/);
});

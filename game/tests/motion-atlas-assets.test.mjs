import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const manifest = await import(new URL("../src/game/assets/manifest.ts", import.meta.url));

const MOTION_ATLASES = [
  ["enemyHunterMotion", "public/assets/overload/enemies/motion-v2/suicide-drone-motion-atlas.png", 960, 640, 6, 4],
  ["enemyRiflemanMotion", "public/assets/overload/enemies/motion-v2/rifleman-motion-atlas.png", 960, 640, 6, 4],
  ["enemySniperMotion", "public/assets/overload/enemies/motion-v2/sniper-motion-atlas.png", 960, 640, 6, 4],
  ["droneMotion", "public/assets/overload/allies/motion-v2/hunter-drone-motion-atlas.png", 640, 512, 5, 4],
  ["sentryMotion", "public/assets/overload/allies/motion-v2/pulse-sentry-motion-atlas.png", 640, 512, 5, 4],
  ["suppressorDroneMotion", "public/assets/overload/allies/motion-v2/suppressor-drone-motion-atlas.png", 640, 512, 5, 4],
  ["bossMotion", "public/assets/overload/boss/motion-v2/wrong-engine-motion-atlas.png", 1920, 1280, 6, 4],
  ["glassDuneBossMotion", "public/assets/overload/regions/glass-dune/motion-v2/mirror-tyrant-motion-atlas.png", 1920, 1280, 6, 4],
  ["abyssalArchiveBossMotion", "public/assets/overload/regions/abyssal-archive/motion-v2/drowned-oracle-motion-atlas.png", 1920, 1280, 6, 4],
];

function pngDimensions(bytes) {
  assert.equal(bytes.subarray(1, 4).toString("ascii"), "PNG");
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

function flattenDefinitions() {
  return [
    ...manifest.COMMON_GAME_ASSETS,
    ...Object.values(manifest.ALLY_MOTION_ASSETS),
    ...Object.values(manifest.REGION_BOSS_ASSETS).flat(),
  ];
}

test("all role, ally, and regional boss motion atlases ship at the authored high-frame grids", async () => {
  const definitions = flattenDefinitions();
  let decodedRgba8Bytes = 0;

  for (const [keyName, path, width, height, columns, rows] of MOTION_ATLASES) {
    const bytes = await readFile(new URL(`../${path}`, import.meta.url));
    assert.deepEqual(pngDimensions(bytes), [width, height], path);
    assert.equal(bytes[25], 6, `${path} must retain RGBA transparency`);
    assert.equal(width / columns, height / rows, `${path} cells must remain square`);
    decodedRgba8Bytes += width * height * 4;

    const key = manifest.ASSET_KEYS[keyName];
    const definition = definitions.find((asset) => asset.key === key);
    assert.ok(definition, `${keyName} must be registered`);
    assert.equal(definition.kind, "motion");
    assert.equal(definition.columns, columns);
    assert.equal(definition.rows, rows);
    assert.equal(definition.path.replace("./", "public/"), path);
  }

  assert.equal(decodedRgba8Bytes, 40_796_160);
});

test("player skills and enemy deaths ship as crisp 64px-cell atlases while SOVEREIGN gates keep their authored row", async () => {
  const specs = [
    ["manualAbilityPixel", "public/assets/overload/vfx/pixel/manual-ability-pixel-atlas.png", 384, 256, 6, 4],
    ["enemyDeathPixel", "public/assets/overload/vfx/pixel/enemy-death-pixel-atlas.png", 384, 64, 6, 1],
    ["automaticSkillPixel", "public/assets/overload/vfx/pixel/automatic-skill-pixel-atlas.png", 384, 256, 6, 4],
    ["sovereignGateMotion", "public/assets/overload/vfx/gates/sovereign-gate-motion-atlas.png", 1152, 192, 6, 1],
  ];
  let decodedRgba8Bytes = 0;
  for (const [keyName, path, width, height, columns, rows] of specs) {
    const bytes = await readFile(new URL(`../${path}`, import.meta.url));
    assert.deepEqual(pngDimensions(bytes), [width, height], path);
    assert.equal(bytes[25], 6, `${path} must retain RGBA transparency`);
    assert.equal(width / columns, height / rows, `${path} cells must remain square`);
    if (rows === 4) assert.equal(width / columns, 64, `${path} must use authored 64px pixel cells`);
    decodedRgba8Bytes += width * height * 4;
    const definition = [
      ...manifest.COMMON_GAME_ASSETS,
      ...manifest.WEAPON_GAME_ASSETS["pulse-rifle"],
    ].find((asset) => asset.key === manifest.ASSET_KEYS[keyName]);
    assert.ok(definition, `${keyName} must be registered in its active battle bundle`);
    assert.equal(definition.kind, "atlas");
    assert.equal(definition.columns, columns);
    assert.equal(definition.rows, rows);
    assert.equal(definition.path.replace("./", "public/"), path);
  }

  assert.equal(decodedRgba8Bytes, 1_769_472, "pixel skills, enemy deaths, and the preserved gate row decoded RGBA8 budget");
  const priorSkillVfxBytes = 1152 * 768 * 4 * 2 + 1024 * 768 * 4;
  assert.equal(priorSkillVfxBytes - decodedRgba8Bytes, 8_454_144, "decoded RGBA8 reduction after adding the enemy death strip");
  const commonPaths = manifest.COMMON_GAME_ASSETS.map((asset) => asset.path).join("\n");
  assert.doesNotMatch(commonPaths, /vfx\/(?:manual\/manual-ability-motion-atlas|skill-motion-atlas|omega-laser-motion-atlas)\.png/);
  assert.equal(manifest.ASSET_KEYS.manualAbilityMotion, undefined);
  assert.equal(manifest.ASSET_KEYS.skillMotion, undefined);
  assert.equal(manifest.ASSET_KEYS.omegaLaserMotion, undefined);
});

test("AEGIS WARD ships as a dedicated high-detail smooth hard-light atlas", async () => {
  const path = "public/assets/overload/vfx/manual/aegis-ward-hd-atlas.png";
  const bytes = await readFile(new URL(`../${path}`, import.meta.url));
  assert.deepEqual(pngDimensions(bytes), [1152, 192]);
  assert.equal(bytes[25], 6, `${path} must retain RGBA transparency`);
  const definition = manifest.WEAPON_GAME_ASSETS["pulse-rifle"].find((asset) => asset.key === manifest.ASSET_KEYS.aegisWardHd);
  assert.ok(definition, "the high-detail ward atlas must be in the pulse-rifle bundle");
  assert.equal(definition.kind, "atlas");
  assert.equal(definition.columns, 6);
  assert.equal(definition.rows, 1);
  assert.equal(definition.path.replace("./", "public/"), path);
});

test("EMP PULSE ships as a dedicated high-detail smooth electromagnetic atlas", async () => {
  const path = "public/assets/overload/vfx/manual/emp-pulse-hd-atlas.png";
  const bytes = await readFile(new URL(`../${path}`, import.meta.url));
  assert.deepEqual(pngDimensions(bytes), [1152, 192]);
  assert.equal(bytes[25], 6, `${path} must retain RGBA transparency`);
  const definition = manifest.WEAPON_GAME_ASSETS["pulse-rifle"].find((asset) => asset.key === manifest.ASSET_KEYS.empPulseHd);
  assert.ok(definition, "the high-detail EMP atlas must be in the pulse-rifle bundle");
  assert.equal(definition.kind, "atlas");
  assert.equal(definition.columns, 6);
  assert.equal(definition.rows, 1);
  assert.equal(definition.path.replace("./", "public/"), path);
});

test("motion atlas residency stays staged instead of loading every ally and regional boss up front", () => {
  const commonKeys = new Set(manifest.COMMON_GAME_ASSETS.map((asset) => asset.key));
  for (const key of [
    manifest.ASSET_KEYS.enemyHunterMotion,
    manifest.ASSET_KEYS.enemyRiflemanMotion,
    manifest.ASSET_KEYS.enemySniperMotion,
  ]) assert.ok(commonKeys.has(key));

  for (const key of [
    manifest.ASSET_KEYS.droneMotion,
    manifest.ASSET_KEYS.sentryMotion,
    manifest.ASSET_KEYS.suppressorDroneMotion,
    manifest.ASSET_KEYS.bossMotion,
    manifest.ASSET_KEYS.glassDuneBossMotion,
    manifest.ASSET_KEYS.abyssalArchiveBossMotion,
  ]) assert.ok(!commonKeys.has(key), `${key} must remain lazy`);

  const routeKeys = new Set(manifest.getGameAssetsForRegion("glass-dune").map((asset) => asset.key));
  assert.ok(!routeKeys.has(manifest.ASSET_KEYS.glassDuneBossMotion));
  const glassBossKeys = manifest.getBossGameAssetsForRegion("glass-dune").map((asset) => asset.key);
  assert.ok(glassBossKeys.includes(manifest.ASSET_KEYS.glassDuneBossMotion));
  assert.ok(!glassBossKeys.includes(manifest.ASSET_KEYS.bossMotion));
  assert.ok(!glassBossKeys.includes(manifest.ASSET_KEYS.abyssalArchiveBossMotion));

  assert.equal(manifest.getAllyMotionAsset("hunter-drone")?.key, manifest.ASSET_KEYS.droneMotion);
  assert.equal(manifest.getAllyMotionAsset("pulse-sentry")?.key, manifest.ASSET_KEYS.sentryMotion);
  assert.equal(manifest.getAllyMotionAsset("suppressor")?.key, manifest.ASSET_KEYS.suppressorDroneMotion);
  assert.equal(manifest.getAllyMotionAsset("unknown"), null);

  const enemyDecodedBytes = 3 * 960 * 640 * 4;
  const allSelectedAlliesDecodedBytes = 3 * 640 * 512 * 4;
  const selectedBossDecodedBytes = 1920 * 1280 * 4;
  assert.equal(enemyDecodedBytes + allSelectedAlliesDecodedBytes + selectedBossDecodedBytes, 21_135_360);
});

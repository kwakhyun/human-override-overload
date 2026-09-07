import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const manifest = await import(new URL("../src/game/assets/manifest.ts", import.meta.url));

function pngDimensions(bytes) {
  assert.equal(bytes.subarray(1, 4).toString("ascii"), "PNG");
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}



test("PERFORMANCE selects lighter paths without changing stable Phaser texture keys", async () => {
  const full = manifest.getGameAssetsForRegion("wrong-engine-core", "full", "pulse-rifle", ["aegis", "mika"]);
  const performance = manifest.getGameAssetsForRegion("wrong-engine-core", "performance", "pulse-rifle", ["aegis", "mika"]);
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
  assert.equal(
    performance.find((asset) => asset.key === manifest.ASSET_KEYS.playerMikaDirectionalAim)?.path,
    "./assets/overload/quality-v3/performance/mika-operative.png",
    "mobile tag swaps must not keep MIKA's full 8-direction atlas resident",
  );

  const fullBoss = manifest.getBossGameAssetsForRegion("wrong-engine-core", "full");
  const performanceBoss = manifest.getBossGameAssetsForRegion("wrong-engine-core", "performance");
  assert.deepEqual(performanceBoss.map((asset) => asset.key), fullBoss.map((asset) => asset.key));
  const bossPixelKeys = new Set([
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

test("combat bundles load only unlocked operatives and the selected AEGIS weapon", () => {
  const fresh = manifest.getGameAssetsForRegion("wrong-engine-core", "full", "pulse-rifle", ["aegis"]);
  const freshKeys = new Set(fresh.map((asset) => asset.key));
  for (const key of [
    manifest.ASSET_KEYS.playerMikaDirectionalAim,
    manifest.ASSET_KEYS.playerVesperDirectionalAim,
    manifest.ASSET_KEYS.playerNoxDirectionalAim,
    manifest.ASSET_KEYS.mikaAbilityPixel,
    manifest.ASSET_KEYS.vesperAbilityHd,
    manifest.ASSET_KEYS.noxAbilityHd,
  ]) assert.equal(freshKeys.has(key), false, `${key} must stay out of a fresh-slot load`);

  const mika = new Set(manifest.getGameAssetsForRegion("wrong-engine-core", "full", "pulse-rifle", ["aegis", "mika"]).map((asset) => asset.key));
  assert.equal(mika.has(manifest.ASSET_KEYS.playerMikaDirectionalAim), true);
  assert.equal(mika.has(manifest.ASSET_KEYS.mikaAbilityPixel), true);
  assert.equal(mika.has(manifest.ASSET_KEYS.playerVesperDirectionalAim), false);
  assert.equal(mika.has(manifest.ASSET_KEYS.playerNoxDirectionalAim), false);

  const pulse = new Set(manifest.getGameAssetsForRegion("wrong-engine-core", "full", "pulse-rifle", ["aegis"]).map((asset) => asset.key));
  const sword = new Set(manifest.getGameAssetsForRegion("wrong-engine-core", "full", "beam-sword", ["aegis"]).map((asset) => asset.key));
  assert.equal(pulse.has(manifest.ASSET_KEYS.manualAbilityPixel), true);
  assert.equal(pulse.has(manifest.ASSET_KEYS.swordSkillPixel), false);
  assert.equal(sword.has(manifest.ASSET_KEYS.manualAbilityPixel), false);
  assert.equal(sword.has(manifest.ASSET_KEYS.aegisWardHd), false);
  assert.equal(sword.has(manifest.ASSET_KEYS.empPulseHd), false);
  assert.equal(sword.has(manifest.ASSET_KEYS.swordSkillPixel), true);
});

test("every active low-memory variant retains its format and authored grid", async () => {
  const assets = new Map();
  const collect = (value) => {
    if (!value || typeof value !== 'object') return;
    if (value.performancePath) assets.set(value.path, value);
    else Object.values(value).forEach(collect);
  };
  collect(manifest);
  for (const stage of ['haven-perimeter', 'relay-blackout', 'sovereign-night-siege']) collect(manifest.getDefenseGameAssets(stage));
  assert.ok(assets.size >= 50, 'exercise the full current asset registry');
  for (const asset of assets.values()) {
    const [full, low] = await Promise.all([asset.path, asset.performancePath].map(relative => readFile(new URL('../public/' + relative.slice(2), import.meta.url))));
    if (asset.path.endsWith('.png')) {
      const [w,h] = pngDimensions(full), [lw,lh] = pngDimensions(low);
      assert.equal(low[25], 6, asset.path + ' RGBA');
      assert.ok(lw <= w && lh <= h, asset.path + ' bounded low-memory dimensions');
      assert.equal(lw / w, lh / h, asset.path + ' uniform scale');
      assert.equal(lw % (asset.columns || 1), 0, asset.path + ' columns');
      assert.equal(lh % (asset.rows || 1), 0, asset.path + ' rows');
    } else {
      assert.equal(low.subarray(0,4).toString('ascii'), 'RIFF', asset.performancePath);
      assert.equal(low.subarray(8,12).toString('ascii'), 'WEBP', asset.performancePath);
    }
  }
});

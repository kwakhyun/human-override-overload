import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const manifest = await import(new URL("../src/game/assets/manifest.ts", import.meta.url));

function pngDimensions(bytes) {
  assert.equal(bytes.subarray(1, 4).toString("ascii"), "PNG");
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

test("beam sword loadout selects only its authored directional and unified skill atlases", async () => {
  const rifle = manifest.getGameAssetsForRegion("wrong-engine-core", "full", "pulse-rifle");
  const sword = manifest.getGameAssetsForRegion("wrong-engine-core", "full", "beam-sword");
  const rifleKeys = new Set(rifle.map((asset) => asset.key));
  const swordKeys = new Set(sword.map((asset) => asset.key));

  assert.equal(rifleKeys.has(manifest.ASSET_KEYS.playerDirectionalAim), true);
  assert.equal(rifleKeys.has(manifest.ASSET_KEYS.playerSwordDirectionalAim), false);
  assert.equal(rifleKeys.has(manifest.ASSET_KEYS.swordSkillPixel), false);
  assert.equal(swordKeys.has(manifest.ASSET_KEYS.playerDirectionalAim), false);
  assert.equal(swordKeys.has(manifest.ASSET_KEYS.playerSwordDirectionalAim), true);
  assert.equal(swordKeys.has(manifest.ASSET_KEYS.swordSkillPixel), true);

  const specs = [
    [
        "../public/assets/overload/quality-v3/aegis-sword-operative.png",
        1024,
        1024
    ],
    [
        "../public/assets/overload/quality-v3/performance/aegis-sword-operative.png",
        768,
        768
    ],
    [
        "../public/assets/overload/quality-v3/sword-auto-skills.png",
        1536,
        1024
    ]
];
  for (const [path, width, height] of specs) {
    const bytes = await readFile(new URL(path, import.meta.url));
    assert.deepEqual(pngDimensions(bytes), [width, height], path);
    assert.equal(bytes[25], 6, `${path} must retain RGBA transparency`);
  }
  assert.equal(sword.find((asset) => asset.key === manifest.ASSET_KEYS.playerSwordDirectionalAim).rows, 8);
});

test("BattleView uses weapon-specific hero poses and pooled quality-capped sword effects", async () => {
  const view = await readFile(new URL("../src/phaser/view/BattleView.ts", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(view, /entity\?\.mainWeaponId === "beam-sword"/);
  assert.match(view, /ASSET_KEYS\.playerSwordDirectionalAim/);
  assert.match(view, /const rifleEquipped = entity\?\.characterId !== "mika" && entity\?\.mainWeaponId !== "beam-sword"/);
  assert.match(view, /const muzzleVisible = rifleEquipped &&/);
  assert.match(view, /syncSwordEffectFx\(state, quality\)/);
  assert.match(view, /quality\.id === "performance" \? 6 : quality\.id === "cinematic" \? 16 : 10/);
  assert.match(view, /this\.swordEffectSprites\[visible\]/);
  assert.match(view, /ASSET_KEYS\.swordSkillPixel/);
  assert.match(view, /projectileKind\.includes\("crescent"\)/);
  assert.match(app, /mainWeaponId === "beam-sword" \? "포인터 방향 · 빔 소드 자동 베기" : "포인터로 조준 · 소총 자동 발사"/);
});

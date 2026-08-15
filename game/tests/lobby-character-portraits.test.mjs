import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("lobby renders the approved original AEGIS and MIKA illustrations", async () => {
  const [screens, styles, manifest, packageJson] = await Promise.all([
    readFile(new URL("src/ui/campaign/CampaignScreens.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
    readFile(new URL("src/game/assets/manifest.ts", root), "utf8"),
    readFile(new URL("package.json", root), "utf8"),
  ]);

  assert.doesNotMatch(screens, /CubismCharacter|react-live2d|data-live2d/);
  assert.doesNotMatch(packageJson, /@greenmansk\/react-live2d/);
  assert.match(screens, /data-portrait-renderer="original-illustration"/);
  assert.match(screens, /className="motion-portrait-original" src=\{assetSource\(source\)\}/);
  assert.match(manifest, /player: "\.\/assets\/overload\/hero\/survivor-portrait\.png"/);
  assert.match(manifest, /mikaPortrait: "\.\/assets\/overload\/hero\/mika-portrait\.png"/);
  assert.match(styles, /\.motion-portrait-body \{[\s\S]*overflow: hidden/);
  assert.match(styles, /\.motion-portrait-original \{[\s\S]*object-fit: contain;[\s\S]*object-position: center top/);
  assert.doesNotMatch(styles, /cubism-character|lobby-portrait-breathe/);

  for (const file of ["survivor-portrait.png", "mika-portrait.png"]) {
    const url = new URL(`public/assets/overload/hero/${file}`, root);
    const [asset, png] = await Promise.all([stat(url), readFile(url)]);
    assert.ok(asset.size > 1_500_000, `${file} should retain the approved source detail`);
    assert.equal(png.readUInt32BE(16), 941);
    assert.equal(png.readUInt32BE(20), 1672);
  }
});

test("invisible body zones retain character-specific dialogue without fake overlays", async () => {
  const [screens, styles] = await Promise.all([
    readFile(new URL("src/ui/campaign/CampaignScreens.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
  ]);

  for (const zone of ["is-head", "is-chest", "is-arm is-left", "is-arm is-right", "is-legs"]) {
    assert.match(screens, new RegExp(`portrait-zone ${zone}`));
  }
  assert.match(screens, /PORTRAIT_REACTIONS[\s\S]*머리 만지지 마[\s\S]*싫진 않지만/);
  assert.match(styles, /\.portrait-zone \{[\s\S]*background: transparent/);
  assert.match(styles, /\.portrait-zone:focus-visible \{ outline: 0; background: transparent; \}/);
  assert.match(styles, /\.motion-portrait-speech/);
  assert.doesNotMatch(screens, /motion-portrait-expression/);
  assert.doesNotMatch(styles, /motion-portrait-expression|cubism-character-canvas/);
});

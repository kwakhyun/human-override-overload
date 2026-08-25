import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("lobby uses stable static key art without the removed Live2D runtime", async () => {
  const [screens, styles, manifest, packageJson] = await Promise.all([
    readFile(new URL("src/ui/campaign/CampaignScreens.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
    readFile(new URL("src/game/assets/manifest.ts", root), "utf8"),
    readFile(new URL("package.json", root), "utf8"),
  ]);

  assert.match(screens, /data-portrait-renderer="static-key-art"/);
  assert.match(screens, /className="motion-portrait-original static-character-portrait"/);
  assert.doesNotMatch(screens, /CubismCharacter|data-motion-profile="lobby-breathing"/);
  assert.doesNotMatch(packageJson, /@greenmansk\/react-live2d/);
  assert.doesNotMatch(styles, /cubism-character/);
  assert.match(manifest, /player: "\.\/assets\/overload\/hero\/survivor-portrait\.png"/);
  assert.match(manifest, /mikaPortrait: "\.\/assets\/overload\/hero\/mika-portrait\.png"/);
  assert.match(manifest, /vesperPortrait: "\.\/assets\/overload\/hero\/vesper-portrait-v2\.png"/);
  assert.match(styles, /\.motion-portrait-body \{[\s\S]*overflow: hidden/);
  assert.match(styles, /\.motion-portrait-original \{[\s\S]*object-fit: contain;[\s\S]*object-position: center top/);

  for (const file of ["survivor-portrait.png", "mika-portrait.png", "vesper-portrait-v2.png"]) {
    const url = new URL(`public/assets/overload/hero/${file}`, root);
    const [asset, png] = await Promise.all([stat(url), readFile(url)]);
    assert.ok(asset.size > 150_000, `${file} should retain readable character detail`);
    assert.equal(png.subarray(1, 4).toString("ascii"), "PNG");
    if (file === "vesper-portrait-v2.png") {
      assert.ok(
        [4, 6].includes(png[25]),
        "Vesper production cutout must keep a real PNG alpha channel instead of a baked checkerboard",
      );
    }
  }

  await assert.rejects(access(new URL("src/ui/live2d/CubismCharacter.jsx", root)));
  await assert.rejects(access(new URL("public/vendor/live2d/live2dcubismcore.min.js", root)));
});

test("invisible body zones retain character-specific dialogue without fake overlays", async () => {
  const [screens, styles] = await Promise.all([
    readFile(new URL("src/ui/campaign/CampaignScreens.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
  ]);

  for (const zone of ["is-head", "is-chest", "is-arm is-left", "is-arm is-right", "is-legs"]) {
    assert.match(screens, new RegExp(`portrait-zone ${zone}`));
  }
  assert.match(screens, /PORTRAIT_REACTIONS[\s\S]*vesper: Object\.freeze/);
  assert.match(styles, /\.portrait-zone \{[\s\S]*background: transparent/);
  assert.match(styles, /\.portrait-zone:focus-visible \{ outline: 0; background: transparent; \}/);
  assert.match(styles, /\.motion-portrait-speech/);
  assert.doesNotMatch(screens, /motion-portrait-expression/);
});

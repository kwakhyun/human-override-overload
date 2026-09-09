import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("lobby animates the approved key art without restoring the rejected Cubism bundles", async () => {
  const [screens, styles, tacticalStyles, manifest, packageJson] = await Promise.all([
    readFile(new URL("src/ui/campaign/CampaignScreens.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
    readFile(new URL("src/styles/tactical-os.css", root), "utf8"),
    readFile(new URL("src/game/assets/manifest.ts", root), "utf8"),
    readFile(new URL("package.json", root), "utf8"),
  ]);

  assert.match(screens, /data-portrait-surface="interactive-operative"/);
  assert.match(screens, /InteractivePortrait key=\{characterId\}/);
  assert.doesNotMatch(screens, /CubismCharacter|data-motion-profile="lobby-breathing"/);
  assert.doesNotMatch(packageJson, /@greenmansk\/react-live2d/);
  assert.doesNotMatch(styles, /cubism-character/);
  assert.match(manifest, /player: "\.\/assets\/overload\/portraits\/anime-v1\/aegis\.webp"/);
  assert.match(manifest, /mikaPortrait: "\.\/assets\/overload\/portraits\/anime-v1\/mika\.webp"/);
  assert.match(manifest, /vesperPortrait: "\.\/assets\/overload\/portraits\/anime-v1\/vesper\.webp"/);
  assert.match(manifest, /noxPortrait: "\.\/assets\/overload\/portraits\/anime-v1\/nox\.webp"/);
  assert.match(styles, /\.motion-portrait-body \{[\s\S]*overflow: hidden/);
  assert.match(styles, /\.motion-portrait-original \{[\s\S]*object-fit: contain;[\s\S]*object-position: center top/);
  assert.match(tacticalStyles, /OPERATIVE PORTRAIT STAGE CONTRACT/);
  assert.match(tacticalStyles, /\.character-art-stage\.is-aegis > img,[\s\S]*\.character-art-stage\.is-nox > img/);
  assert.match(tacticalStyles, /\.home-base-screen \.base-motion-portrait\.is-aegis,[\s\S]*\.home-base-screen \.base-motion-portrait\.is-nox/);

  for (const file of ["aegis.webp", "mika.webp", "vesper.webp", "nox.webp"]) {
    const url = new URL(`public/assets/overload/portraits/anime-v1/${file}`, root);
    const [asset, webp] = await Promise.all([stat(url), readFile(url)]);
    assert.ok(asset.size > 50_000 && asset.size < 400_000, `${file} should balance detail and transfer size`);
    assert.equal(webp.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(webp.subarray(8, 12).toString("ascii"), "WEBP");
  }

  await assert.rejects(access(new URL("src/ui/live2d/CubismCharacter.jsx", root)));
  await assert.rejects(access(new URL("public/vendor/live2d/live2dcubismcore.min.js", root)));
});

test("archived pre-anime operative inputs retain their original visual contract", async () => {
  const contractUrl = new URL("reference/source-assets/overload/runtime-inputs/operative-portrait-contract.json", root);
  const contract = JSON.parse(await readFile(contractUrl, "utf8"));
  const rules = contract.rules;
  const heightRatios = [];

  assert.deepEqual(contract.canvas, [864, 1536]);
  assert.deepEqual(Object.keys(contract.portraits).sort(), ["aegis", "mika", "nox", "vesper"]);

  for (const [operativeId, metrics] of Object.entries(contract.portraits)) {
    const bytes = await readFile(new URL(`reference/source-assets/overload/runtime-inputs/pre-anime-2026-09-09/hero/${metrics.file}`, root));
    const digest = createHash("sha256").update(bytes).digest("hex");
    assert.equal(digest, metrics.sha256, `${operativeId} portrait changed without refreshing its visual contract`);
    assert.deepEqual(metrics.canvas, contract.canvas, `${operativeId} uses a different canvas`);
    assert.ok(metrics.bottomGap <= rules.maximumBottomGap, `${operativeId} floats ${metrics.bottomGap}px above the stage floor`);
    assert.ok(
      metrics.visibleHeightRatio >= rules.visibleHeightRatio[0]
        && metrics.visibleHeightRatio <= rules.visibleHeightRatio[1],
      `${operativeId} visible height ${metrics.visibleHeightRatio} is outside the authored roster range`,
    );
    assert.ok(
      metrics.centerOffsetRatio <= rules.maximumCenterOffsetRatio,
      `${operativeId} is horizontally off-center`,
    );
    heightRatios.push(metrics.visibleHeightRatio);
  }

  const spread = Math.max(...heightRatios) - Math.min(...heightRatios);
  assert.ok(
    spread <= rules.maximumRosterHeightSpread,
    `roster height spread ${spread.toFixed(4)} exceeds ${rules.maximumRosterHeightSpread}`,
  );
});

test("invisible body zones retain character-specific dialogue without fake overlays", async () => {
  const [screens, styles, portrait] = await Promise.all([
    readFile(new URL("src/ui/campaign/CampaignScreens.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
    readFile(new URL("src/ui/portrait/InteractivePortrait.jsx", root), "utf8"),
  ]);

  assert.match(portrait, /PORTRAIT_TOUCH_ZONES\[characterId\]/);
  assert.match(portrait, /createPortraitDialogue\(characterId\)/);
  assert.match(portrait, /data-portrait-zone=\{zone.key\}/);
  assert.match(portrait, /role="status" aria-live="polite"/);
  assert.doesNotMatch(screens, /터치 상호작용/);
  assert.match(styles, /\.portrait-zone \{[\s\S]*background: transparent/);
  assert.match(styles, /\.portrait-zone:focus-visible \{ outline: 0; background: transparent; \}/);
  assert.match(styles, /\.motion-portrait-speech/);
  assert.doesNotMatch(screens, /motion-portrait-expression/);
});

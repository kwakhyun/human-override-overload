import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("AEGIS and MIKA ship real Cubism model3 bundles with moc3 and 2048px textures", async () => {
  for (const id of ["aegis", "mika"]) {
    const modelUrl = new URL(`public/assets/overload/live2d/${id}/${id}.model3.json`, root);
    const model = JSON.parse(await readFile(modelUrl, "utf8"));
    assert.equal(model.Version, 3);
    assert.equal(model.FileReferences.Moc, `${id}.moc3`);
    assert.deepEqual(model.FileReferences.Textures, [`${id}.2048/texture_00.png`]);
    assert.equal(model.FileReferences.DisplayInfo, `${id}.cdi3.json`);
    assert.equal(model.FileReferences.Expressions.length, 1);
    const expression = model.FileReferences.Expressions[0];
    assert.equal(expression.Name, id === "aegis" ? "cold" : "shy");
    const expressionJson = JSON.parse(await readFile(new URL(`public/assets/overload/live2d/${id}/${expression.File}`, root), "utf8"));
    assert.equal(expressionJson.Type, "Live2D Expression");
    assert.ok(expressionJson.Parameters.length >= 5);
    const mocBytes = await readFile(new URL(`public/assets/overload/live2d/${id}/${id}.moc3`, root));
    assert.equal(mocBytes.subarray(0, 4).toString("ascii"), "MOC3");
    assert.equal(mocBytes[4], 5, `${id} must remain compatible with the bundled Cubism 5.0 Core`);
    const moc = await stat(new URL(`public/assets/overload/live2d/${id}/${id}.moc3`, root));
    const texture = await stat(new URL(`public/assets/overload/live2d/${id}/${id}.2048/texture_00.png`, root));
    assert.ok(moc.size > 20_000, `${id} moc3 should contain exported Cubism data`);
    assert.ok(texture.size > 1_000_000, `${id} texture should retain source detail`);
  }
});

test("lobby uses bundled official Cubism Core, WebGL model rendering, and click-only rig reactions", async () => {
  const [component, screens, styles, packageJson] = await Promise.all([
    readFile(new URL("src/ui/live2d/CubismCharacter.jsx", root), "utf8"),
    readFile(new URL("src/ui/campaign/CampaignScreens.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
    readFile(new URL("package.json", root), "utf8"),
  ]);
  assert.match(packageJson, /"@greenmansk\/react-live2d"/);
  assert.match(component, /CUBISM_CORE_URL = "\/vendor\/live2d\/live2dcubismcore\.min\.js"/);
  assert.match(component, /CUBISM_CORE_SOURCE_URL = "https:\/\/cubism\.live2d\.com\/sdk-web\/cubismcore\/live2dcubismcore\.min\.js"/);
  assert.match(component, /<Live2DRunner ticker=\{ticker\}>/);
  assert.match(component, /<Live2DCanvas>/);
  assert.match(component, /<Live2DModel/);
  assert.match(component, /showHitAreas=\{false\}/);
  assert.match(component, /setLookTargetRelative/);
  assert.match(component, /setBodyOrientationTargetRelative/);
  assert.match(component, /setExpression\(REACTION_EXPRESSIONS\[characterId\]\)/);
  assert.match(component, /resetExpression\(\)/);
  assert.match(component, /data-live2d-ready=\{modelReady \? "true" : "false"\}/);
  assert.match(component, /cubism-character-fallback/);
  assert.doesNotMatch(component, /mousemove|pointermove|onPointerMove/);
  assert.doesNotMatch(screens, /motion-portrait-expression/);
  assert.match(styles, /\.cubism-character-canvas[\s\S]*pointer-events: none/);
  assert.match(styles, /\.portrait-zone \{[\s\S]*background: transparent/);
  const core = await readFile(new URL("public/vendor/live2d/live2dcubismcore.min.js", root), "utf8");
  assert.match(core, /Live2D Cubism Core/);
  assert.match(core, /Redistributable Code/);
});

test("Cubism editable sources are preserved separately from browser runtime files", async () => {
  for (const id of ["aegis", "mika"]) {
    const sourceRoot = `reference/source-assets/overload/cubism/${id}/`;
    const [psd, cmo3] = await Promise.all([
      stat(new URL(`${sourceRoot}${id}-cubism-source.psd`, root)),
      stat(new URL(`${sourceRoot}${id}.cmo3`, root)),
    ]);
    assert.ok(psd.size > 1_000_000);
    assert.ok(cmo3.size > 1_000_000);
  }
});

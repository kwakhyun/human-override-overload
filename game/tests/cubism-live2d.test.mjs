import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("AEGIS and MIKA ship real Cubism model3 bundles with touch-area expressions", async () => {
  for (const id of ["aegis", "mika"]) {
    const modelUrl = new URL(`public/assets/overload/live2d/${id}/${id}.model3.json`, root);
    const model = JSON.parse(await readFile(modelUrl, "utf8"));
    assert.equal(model.Version, 3);
    assert.equal(model.FileReferences.Moc, `${id}.moc3`);
    assert.deepEqual(model.FileReferences.Textures, [`${id}.2048/texture_00.png`]);
    assert.equal(model.FileReferences.DisplayInfo, `${id}.cdi3.json`);
    assert.deepEqual(model.Groups, [{
      Target: "Parameter",
      Name: "EyeBlink",
      Ids: ["ParamEyeLOpen", "ParamEyeROpen"],
    }]);
    const expectedExpressions = id === "aegis"
      ? ["cold", "cold-idle", "cold-head", "cold-chest", "cold-arms", "cold-legs"]
      : ["shy", "bright-idle", "shy-head", "shy-chest", "shy-arms", "shy-legs"];
    assert.deepEqual(model.FileReferences.Expressions.map(({ Name }) => Name), expectedExpressions);
    for (const expression of model.FileReferences.Expressions) {
      const expressionJson = JSON.parse(await readFile(new URL(`public/assets/overload/live2d/${id}/${expression.File}`, root), "utf8"));
      assert.equal(expressionJson.Type, "Live2D Expression");
      assert.ok(expressionJson.Parameters.length >= 5);
    }
    const mocBytes = await readFile(new URL(`public/assets/overload/live2d/${id}/${id}.moc3`, root));
    assert.equal(mocBytes.subarray(0, 4).toString("ascii"), "MOC3");
    assert.equal(mocBytes[4], 5, `${id} must be exported in the Cubism 5.0 format supported by the bundled Web Core`);
    const moc = await stat(new URL(`public/assets/overload/live2d/${id}/${id}.moc3`, root));
    const texture = await stat(new URL(`public/assets/overload/live2d/${id}/${id}.2048/texture_00.png`, root));
    assert.ok(moc.size > 18_000, `${id} moc3 should contain exported Cubism data`);
    assert.ok(texture.size > 1_000_000, `${id} texture should retain source detail`);
  }
});

test("lobby uses bundled Cubism rendering with idle breathing and click-only area reactions", async () => {
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
  assert.match(component, /function ModelMotionDriver/);
  assert.match(component, /window\.requestAnimationFrame\(animate\)/);
  assert.match(component, /window\.cancelAnimationFrame\(animationFrame\)/);
  assert.match(component, /prefers-reduced-motion: reduce/);
  assert.match(component, /const breath = reducedMotion \? 0 : Math\.sin/);
  assert.match(component, /const sway = reducedMotion \? 0 : Math\.sin/);
  assert.match(component, /reactionShake = Math\.sin/);
  assert.match(component, /motionManager\.setScale\(/);
  assert.match(component, /motionManager\.setPosition\(/);
  assert.match(component, /setLookTargetRelative/);
  assert.match(component, /setBodyOrientationTargetRelative/);
  assert.match(component, /setExpression\(REACTION_EXPRESSIONS\[characterId\]\?\.\[reaction\.area\]\)/);
  assert.match(component, /idleExpression: "cold-idle"/);
  assert.match(component, /idleExpression: "bright-idle"/);
  assert.match(component, /scale: 0\.94/);
  assert.match(component, /positionY: -0\.035/);
  assert.match(component, /fallbackPath: "\/assets\/overload\/hero\/mika-live2d-fullbody\.png"/);
  assert.match(component, /Keep the model anchored/);
  assert.match(component, /resetExpression\(\)/);
  assert.match(component, /data-live2d-ready=\{modelReady \? "true" : "false"\}/);
  assert.match(component, /cubism-character-fallback/);
  assert.doesNotMatch(component, /mousemove|pointermove|onPointerMove/);
  assert.doesNotMatch(screens, /motion-portrait-expression/);
  assert.match(styles, /\.cubism-character-canvas[\s\S]*pointer-events: none/);
  assert.match(styles, /\.portrait-zone \{[\s\S]*background: transparent/);
  assert.match(styles, /\.base-motion-portrait\.is-mika \{ width: min\(33vw, 448px\); left: 26%; \}/);
  const fullBodyUrl = new URL("public/assets/overload/hero/mika-live2d-fullbody.png", root);
  const [fullBody, fullBodyPng] = await Promise.all([stat(fullBodyUrl), readFile(fullBodyUrl)]);
  assert.ok(fullBody.size > 1_000_000, "MIKA lobby fallback must retain the uncropped full-body source");
  assert.equal(fullBodyPng.readUInt32BE(16), 941);
  assert.equal(fullBodyPng.readUInt32BE(20), 1672);
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

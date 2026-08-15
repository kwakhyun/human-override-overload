import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const root = new URL("../", import.meta.url);

test("Phaser defense runtime stays behind its own deterministic bridge and guided DOM HUD", async () => {
  const [app, scene, view, manifest, screens, styles] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/phaser/scenes/DefenseScene.ts", root), "utf8"),
    readFile(new URL("src/phaser/view/DefenseView.ts", root), "utf8"),
    readFile(new URL("src/game/assets/manifest.ts", root), "utf8"),
    readFile(new URL("src/ui/campaign/CampaignScreens.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
  ]);
  assert.match(app, /import\("\.\/phaser\/createDefenseGame\.ts"\)/);
  assert.match(app, /<DefenseStageSelectScreen/);
  assert.match(app, /<DefenseArenaScreen/);
  assert.match(scene, /createDefenseState\(\{ stageId \}\)/);
  assert.match(scene, /stepDefense\(this\.state, 1 \/ 60\)/);
  assert.match(scene, /if \(this\.suspended\) return false;/);
  assert.match(view, /ASSET_KEYS\.defenseSystemsMotion/);
  assert.match(manifest, /export const DEFENSE_GAME_ASSETS/);
  assert.match(screens, /전술 관제관 · 레아/);
  assert.match(styles, /\.defense-tower-palette/);
  assert.match(app, /const DEFENSE_GUIDE_STEPS/);
  assert.match(app, /data-defense-guide-step=\{stepIndex \+ 1\}/);
  assert.match(app, /completeDefenseGuide\(campaign, activeSlotId\)/);
  assert.match(app, /showTutorial=\{activeDefenseStageId === "haven-perimeter" && !activeSlot\?\.defenseGuideSeen\}/);
  assert.match(app, /controllerRef\.current\?\.setSuspended\(tutorialActive\)/);
  assert.match(styles, /\.defense-guide-spotlight/);
  assert.match(styles, /\.defense-guide-card/);
  assert.match(styles, /@media \(max-width: 720px\) and \(orientation: portrait\)[\s\S]*\.defense-guide-card/);
  assert.match(screens, /defense-stage-card-top/);
});

test("defense art ships a 6x4 transparent motion atlas and full/performance battlefields", async () => {
  const [atlas, atlasLow, map, mapLow] = await Promise.all([
    stat(new URL("public/assets/overload/defense/defense-systems-motion-atlas.png", root)),
    stat(new URL("public/assets/overload/defense/performance/defense-systems-motion-atlas.png", root)),
    stat(new URL("public/assets/overload/defense/haven-defense-grid.webp", root)),
    stat(new URL("public/assets/overload/defense/performance/haven-defense-grid.webp", root)),
  ]);
  assert.ok(atlas.size > 1_000_000);
  assert.ok(atlasLow.size < atlas.size);
  assert.ok(map.size > mapLow.size);
});

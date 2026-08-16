import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const root = new URL("../", import.meta.url);

test("Phaser defense runtime stays behind its own deterministic bridge and guided DOM HUD", async () => {
  const [app, scene, view, manifest, screens, styles, createGame] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/phaser/scenes/DefenseScene.ts", root), "utf8"),
    readFile(new URL("src/phaser/view/DefenseView.ts", root), "utf8"),
    readFile(new URL("src/game/assets/manifest.ts", root), "utf8"),
    readFile(new URL("src/ui/campaign/CampaignScreens.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
    readFile(new URL("src/phaser/createDefenseGame.ts", root), "utf8"),
  ]);
  assert.match(app, /import\("\.\/phaser\/createDefenseGame\.ts"\)/);
  assert.match(app, /<DefenseStageSelectScreen/);
  assert.match(app, /<DefenseArenaScreen/);
  assert.match(scene, /createDefenseState\(\{ stageId \}\)/);
  assert.match(scene, /stepDefense\(this\.state, 1 \/ 60\)/);
  assert.match(scene, /if \(this\.suspended\) return false;/);
  assert.match(view, /ASSET_KEYS\.defenseSystemsMotion/);
  assert.match(view, /ASSET_KEYS\.defenseEnemyMotion/);
  assert.match(view, /ASSET_KEYS\.defenseCombatFxMotion/);
  assert.match(view, /private readonly liveEnemyIds = new Set<string>\(\)/);
  assert.match(view, /private readonly occupiedRanks = new Map<string, number>\(\)/);
  assert.match(view, /const live = this\.liveProjectileIds;\s*live\.clear\(\)/);
  assert.match(view, /if \(sprite\.frame\.name !== frameName\) sprite\.setFrame\(frameName\)/);
  assert.match(view, /sprite\.setData\("frameOffset"/);
  assert.doesNotMatch(view, /const live = new Set<string>\(\)/);
  assert.doesNotMatch(view, /new Map<string, number>\(state\.towers\.map/);
  assert.match(scene, /this\.view\?\.handleEvent\(event/);
  assert.match(createGame, /const logicalWidth = portrait \? 720 : 1280/);
  assert.match(createGame, /const logicalHeight = portrait \? 1280 : 720/);
  assert.match(createGame, /mobile\.portrait \|\| window\.innerHeight > window\.innerWidth/);
  assert.match(createGame, /quality === "performance" \|\| mobile\.touchOptimized \|\| portrait/);
  assert.match(createGame, /mode: Phaser\.Scale\.FIT/);
  assert.doesNotMatch(createGame, /Phaser\.Scale\.ENVELOP/);
  assert.match(manifest, /export function getDefenseGameAssets\(stageId\?/);
  assert.match(manifest, /battlefields-v2\/relay-blackout\/battlefield\.webp/);
  assert.match(manifest, /battlefields-v2\/sovereign-night-siege\/battlefield-portrait\.webp/);
  assert.match(createGame, /new DefenseBootScene\(stageId, assetProfile/);
  assert.match(view, /state\.battlefield\.routes/);
  assert.match(view, /state\.battlefield\.core/);
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
  assert.match(styles, /--defense-battlefield-portrait/);
  assert.match(styles, /\.defense-tower-palette \{ grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(screens, /defense-stage-card-top/);
});

test("defense art ships dedicated atlases plus three full and performance stage maps", async () => {
  const [atlas, atlasLow, enemy, enemyLow, fx, fxLow] = await Promise.all([
    stat(new URL("public/assets/overload/defense/defense-systems-motion-atlas.png", root)),
    stat(new URL("public/assets/overload/defense/performance/defense-systems-motion-atlas.png", root)),
    readFile(new URL("public/assets/overload/defense/defense-enemy-motion-atlas-v2.png", root)),
    readFile(new URL("public/assets/overload/defense/performance/defense-enemy-motion-atlas-v2.png", root)),
    readFile(new URL("public/assets/overload/defense/defense-combat-vfx-atlas-v2.png", root)),
    readFile(new URL("public/assets/overload/defense/performance/defense-combat-vfx-atlas-v2.png", root)),
  ]);
  assert.ok(atlas.size > 1_000_000);
  assert.ok(atlasLow.size < atlas.size);
  assert.deepEqual([enemy.readUInt32BE(16), enemy.readUInt32BE(20), enemy[25]], [1152, 768, 6]);
  assert.deepEqual([enemyLow.readUInt32BE(16), enemyLow.readUInt32BE(20), enemyLow[25]], [864, 576, 6]);
  assert.deepEqual([fx.readUInt32BE(16), fx.readUInt32BE(20), fx[25]], [768, 512, 6]);
  assert.deepEqual([fxLow.readUInt32BE(16), fxLow.readUInt32BE(20), fxLow[25]], [576, 384, 6]);
  assert.ok(enemyLow.byteLength < enemy.byteLength);
  assert.ok(fxLow.byteLength < fx.byteLength);
  for (const stageId of ["haven-perimeter", "relay-blackout", "sovereign-night-siege"]) {
    const [map, mapLow, portraitMap, portraitMapLow] = await Promise.all([
      stat(new URL(`public/assets/overload/defense/battlefields-v2/${stageId}/battlefield.webp`, root)),
      stat(new URL(`public/assets/overload/defense/battlefields-v2/performance/${stageId}/battlefield.webp`, root)),
      stat(new URL(`public/assets/overload/defense/battlefields-v2/${stageId}/battlefield-portrait.webp`, root)),
      stat(new URL(`public/assets/overload/defense/battlefields-v2/performance/${stageId}/battlefield-portrait.webp`, root)),
    ]);
    assert.ok(map.size > mapLow.size);
    assert.ok(portraitMap.size > portraitMapLow.size);
  }
});

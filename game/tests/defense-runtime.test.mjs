import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const root = new URL("../", import.meta.url);

test("Phaser defense runtime stays behind its own deterministic bridge and guided DOM HUD", async () => {
  const [app, scene, view, manifest, screens, styles, defenseStyles, createGame] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/phaser/scenes/DefenseScene.ts", root), "utf8"),
    readFile(new URL("src/phaser/view/DefenseView.ts", root), "utf8"),
    readFile(new URL("src/game/assets/manifest.ts", root), "utf8"),
    readFile(new URL("src/ui/campaign/CampaignScreens.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
    readFile(new URL("src/styles/defense-overhaul.css", root), "utf8"),
    readFile(new URL("src/phaser/createDefenseGame.ts", root), "utf8"),
  ]);
  assert.match(app, /import\("\.\/phaser\/createDefenseGame\.ts"\)/);
  assert.match(app, /<DefenseStageSelectScreen/);
  assert.match(app, /<DefenseArenaScreen/);
  assert.match(scene, /createDefenseState\(\{ stageId, doctrineId \}\)/);
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
  assert.match(scene, /private selectNextEmptyNode/);
  assert.match(scene, /this\.selectNextEmptyNode\(builtNodeId\)/);
  assert.match(app, /className="defense-command-actions"/);
  assert.match(app, /Boolean\(hud\?\.selectedTower\)/);
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
  assert.match(view, /getDefenseTowerStats\(selected, state\.doctrine\)/);
  assert.match(view, /enemy\.elite/);
  assert.match(screens, /전술 관제관 · 레아/);
  assert.match(screens, /Object\.values\(DEFENSE_DOCTRINES\)/);
  assert.match(screens, /onSelect\(stage\.id, selectedDoctrineId\)/);
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
  assert.match(defenseStyles, /\.defense-command-abilities/);
  assert.match(defenseStyles, /\.defense-specialization/);
  assert.match(defenseStyles, /\.defense-stage-intel/);
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

test("defense HUD keeps readable commercial command controls on desktop and portrait mobile", async () => {
  const [app, defenseStyles, main] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/styles/defense-overhaul.css", root), "utf8"),
    readFile(new URL("src/main.jsx", root), "utf8"),
  ]);
  assert.match(app, />방벽 내구도</);
  assert.match(app, /잔존 \$\{hud\?\.liveEnemies/);
  assert.match(app, /<em>\{tower\.cost\}<\/em>/);
  assert.match(app, /"공세 즉시 호출"/);
  assert.match(app, /controllerRef\.current\?\.cycleTargetPriority\(\)/);
  assert.match(app, /controllerRef\.current\?\.activateAbility\(ability\.id\)/);
  assert.match(app, /controllerRef\.current\?\.setSpeed\(2\)/);
  assert.match(defenseStyles, /height: 184px/);
  assert.match(defenseStyles, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(defenseStyles, /@media \(max-width: 820px\), \(orientation: portrait\)/);
  assert.match(defenseStyles, /grid-template-areas: "title" "palette" "console" "abilities" "actions"/);
  assert.match(defenseStyles, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(defenseStyles, /height: 358px/);
  assert.match(main, /styles\/defense-overhaul\.css/);
});

test("defense events use a dedicated procedural combat sound palette", async () => {
  const [app, sfx] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/audio/sfx.js", root), "utf8"),
  ]);
  for (const cue of ["defenseSelect", "defenseBuild", "defenseUpgrade", "defenseSell", "defenseWave", "defenseClear", "defenseBreach", "defenseAbility", "defenseRepair", "defenseEliteDown", "defenseDefeat"]) {
    assert.match(sfx, new RegExp(`case "${cue}"`));
  }
  assert.match(app, /event\.type === "defenseTowerBuilt"\) sfx\.play\("defenseBuild"\)/);
  assert.match(app, /event\.type === "defenseWaveCleared"\) sfx\.play\("defenseClear"\)/);
  assert.match(app, /event\.type === "defenseDefeat"\) sfx\.play\("defenseDefeat"\)/);
});

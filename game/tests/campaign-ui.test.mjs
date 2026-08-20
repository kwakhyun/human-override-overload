import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("App connects save slots to the base, hierarchical airship selection, return cinematic, and victory persistence", async () => {
  const app = await readFile(new URL("src/App.jsx", root), "utf8");
  assert.match(app, /<SaveSlotScreen slots=\{campaign\.slots\}/);
  assert.match(app, /<HomeBaseScreen/);
  assert.match(app, /<RegionSelectScreen/);
  assert.match(app, /createCampaignSlot\(campaign, slotId\)/);
  assert.match(app, /completeRegion\(campaign, activeSlotId, regionId/);
  assert.match(app, /saveCampaign\(completed\)/);
  assert.match(app, /createOverloadGame\(host,[\s\S]*combatBonuses: runtimeCombatBonusesRef\.current\.value[\s\S]*startSuspended: preparingRef\.current/);
  assert.match(app, /status === "victory"[\s\S]*setScreen\("result"\)/);
  assert.match(app, /nextStep === "return"[\s\S]*setScreen\("return"\)/);
  assert.match(app, /getRegionClusters\(\)/);
  assert.match(app, /completeOuterSectorBriefing\(campaign, activeSlotId\)/);
  assert.match(app, /larkAlert=\{larkAlert\}/);
  assert.match(app, /<ReturnCinematicScreen/);
  assert.match(app, /setActiveNpc\(isFreshSlot \? BASE_NPCS\.rhea : null\)/);
  assert.match(app, /setGuideReturnScreen\("base"\)[\s\S]*setScreen\("base"\)/);
});

test("region selection previews and confirms a sortie instead of launching on card click", async () => {
  const [app, screens, sounds, styles] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/ui/campaign/CampaignScreens.jsx", root), "utf8"),
    readFile(new URL("src/audio/sfx.js", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
  ]);
  assert.match(screens, /setSelectedRegionId\(region\.id\)/);
  assert.match(screens, /className="region-world-map"/);
  assert.match(screens, /className=\{`region-map-hotspot/);
  assert.match(screens, /"--map-x": `\$\{cluster\.mapPosition\?\.x \?\? 50\}%`/);
  assert.match(screens, /previewRegion\?\.assets\?\.dom\?\.thumbnail\?\.path \|\| selectedCluster\.previewPath/);
  assert.match(screens, /setSelectedClusterId\(cluster\.id\)/);
  assert.match(screens, /cluster\.rangeLabel/);
  assert.match(screens, /cluster\.comingSoon/);
  assert.match(screens, /className="region-sortie-dialog"/);
  assert.match(screens, /className="region-sortie-layout"/);
  assert.match(screens, /className="region-sortie-command-footer"/);
  assert.match(screens, /className="region-mobile-swipe-hint"/);
  assert.match(screens, /좌우로 밀어 출격 구역 선택/);
  assert.match(screens, /selectedCluster\.koreanName\}<span> · 구역 선택<\/span>/);
  assert.match(screens, /className="region-mixed-name"/);
  for (const mixedBoss of ["오답 엔진 · THE WRONG ENGINE", "거울 폭군 · MIRROR TYRANT", "침몰한 예언자 · DROWNED ORACLE"]) {
    assert.match(screens, new RegExp(mixedBoss));
  }
  assert.match(screens, /이 편성으로 출격/);
  assert.match(screens, /className="sortie-weapon-loadout"/);
  assert.match(screens, /className="sortie-character-loadout"/);
  assert.match(styles, /\.region-sortie-briefing \.region-sortie-intel \{ margin-top: 15px; grid-template-columns: 1fr; \}/);
  assert.match(screens, /전투 중 <kbd>T<\/kbd>로 두 캐릭터를 교대합니다/);
  assert.match(app, /setCampaignCharacter\(campaign, activeSlotId, characterId\)/);
  assert.match(screens, /disabled=\{!formationConfirmed\}/);
  assert.match(screens, /onClick=\{\(\) => formationConfirmed && onSelect\(selectedRegion\.id\)\}/);
  assert.match(screens, /event\.key !== "Escape"/);
  assert.match(app, /document\.addEventListener\("pointerdown", handleButtonPointer, true\)/);
  for (const cue of ["uiHover", "uiConfirm", "uiClose"]) assert.match(sounds, new RegExp(`case "${cue}"`));
});

test("strategic and outer-frontier maps are optimized, preloaded, and mapped to cluster hotspots", async () => {
  const [app, manifest, campaign] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/game/assets/manifest.ts", root), "utf8"),
    readFile(new URL("src/game/content/campaign.js", root), "utf8"),
  ]);
  for (const [key, name] of [
    ["airshipRegionMap", "strategic-world-map.webp"],
    ["innerNetworkRegionMap", "airship-region-map-v2.webp"],
    ["outerFrontierRegionMap", "outer-frontier-region-map.webp"],
  ]) {
    assert.match(manifest, new RegExp(`${key}: "\\./assets/overload/campaign/${name}"`));
    assert.match(app, new RegExp(`REGION_MAP_DOM_ASSET_KEYS[\\s\\S]*"${key}"`));
    const asset = await stat(new URL(`public/assets/overload/campaign/${name}`, root));
    assert.ok(asset.size > 100_000, `${name} should retain readable map detail`);
    assert.ok(asset.size < 1_000_000, `${name} should remain web optimized`);
  }
  assert.match(campaign, /id: "inner-network"[\s\S]*mapPosition: \{ x: 28, y: 64 \}/);
  assert.match(campaign, /id: "outer-frontier"[\s\S]*outer-frontier-region-map\.webp[\s\S]*mapPosition: \{ x: 73, y: 47 \}/);
});

test("HAVEN highlights LARK's new-route briefing and ships a skippable return-to-base cinematic", async () => {
  const screens = await readFile(new URL("src/ui/campaign/CampaignScreens.jsx", root), "utf8");
  assert.match(screens, /has-mission-alert/);
  assert.match(screens, /npc-mission-alert/);
  assert.match(screens, /라크가 신규 권역 신호를 해독했습니다/);
  assert.match(screens, /export function ReturnCinematicScreen/);
  assert.match(screens, /return-cinematic/);
  assert.match(screens, /event\.key === "Escape"/);
});

test("active campaign UI uses authored HAVEN portraits, including standalone RHEA, and contains no discarded fire toggle", async () => {
  const [app, screens] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/ui/campaign/CampaignScreens.jsx", root), "utf8"),
  ]);
  assert.match(app, /assets\?\.havenBase/);
  assert.match(app, /assets\?\.havenNpcPortraits/);
  assert.match(app, /assets\?\.rheaControlOfficer/);
  assert.match(app, /assets\?\.airshipRegionMap/);
  assert.doesNotMatch(app, /commandButtonStates|--command-button-atlas/);
  assert.match(app, /assets\?\.characterSyncChamber/);
  assert.match(screens, /backgroundSize|background-size|backgroundPosition/);
  assert.match(screens, /NPC_ICON = Object\.freeze\(\{ hana: Broadcast, ilya: Wrench, lark: User, rhea: Crosshair \}\)/);
  assert.match(screens, /portraitMode === "standalone"/);
  assert.match(screens, /npc\.interactionLabel \|\| "상호작용"/);
  assert.match(screens, /작전 권역 · 출격/);
  assert.match(screens, /BaseFacilityPanel/);
  assert.match(screens, /facility-upgrade-grid/);
  assert.match(screens, /base-motion-portrait/);
  assert.match(screens, /facility-key-art/);
  assert.match(screens, /전투원 · 강화/);
  assert.match(app, /동기화 코어/);
  assert.match(screens, /region-sortie-launch command-ui-button/);
  assert.match(app, /getCampaignCombatBonuses\(campaign, activeSlotId\)/);
  assert.match(app, /purchaseCampaignUpgrade\(campaign, activeSlotId, upgradeId\)/);
  assert.match(app, /onOpenFacility=\{openFacility\}/);
  assert.doesNotMatch(app, /toggleAutoFire|autoFireEnabled|autoFireTogglePressed|클릭 수동 사격/);
});

test("HAVEN lobby uses original character art, icon currencies, edge navigation, and authored facility backgrounds", async () => {
  const [app, screens, styles, manifest] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/ui/campaign/CampaignScreens.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
    readFile(new URL("src/game/assets/manifest.ts", root), "utf8"),
  ]);
  assert.match(screens, /function MotionPortraitStage/);
  assert.match(screens, /data-portrait-renderer="original-illustration"/);
  assert.match(screens, /className="motion-portrait-original"/);
  assert.doesNotMatch(screens, /CubismCharacter|data-live2d/);
  assert.doesNotMatch(screens, /motion-portrait-expression/);
  assert.doesNotMatch(screens, /onPointerMove|--portrait-look-x|--portrait-tilt/);
  for (const zone of ["is-head", "is-chest", "is-arm is-left", "is-arm is-right", "is-legs"]) assert.match(screens, new RegExp(`portrait-zone ${zone}`));
  assert.match(screens, /PORTRAIT_REACTIONS[\s\S]*머리 만지지 마[\s\S]*싫진 않지만/);
  assert.match(styles, /\.motion-portrait-speech/);
  assert.doesNotMatch(styles, /\.motion-portrait-expression|radial-gradient\(circle at 18% 72%/);
  assert.match(styles, /\.portrait-zone:focus-visible \{ outline: 0; background: transparent; \}/);
  assert.match(screens, /className="base-currency-rail"/);
  assert.match(screens, /className="base-lobby-navigation"/);
  assert.match(screens, /className="base-sortie-action command-ui-button"/);
  assert.match(app, /assets\?\.hanaResearchLab/);
  assert.match(app, /assets\?\.ilyaEquipmentWorkshop/);
  assert.match(app, /assets\?\.characterSyncChamber/);
  assert.match(styles, /\.base-motion-portrait/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.motion-portrait-body/);
  for (const [key, name] of [
    ["havenLobby", "haven-command-atrium.webp"],
    ["hanaResearchLab", "hana-research-lab.webp"],
    ["ilyaEquipmentWorkshop", "ilya-equipment-workshop.webp"],
    ["characterSyncChamber", "character-sync-chamber.webp"],
  ]) {
    assert.match(manifest, new RegExp(`${key}: "\\./assets/overload/campaign/lobby/${name}"`));
    const asset = await stat(new URL(`public/assets/overload/campaign/lobby/${name}`, root));
    assert.ok(asset.size > 180_000, `${name} should retain readable environment detail`);
    assert.ok(asset.size < 400_000, `${name} should remain lobby-load optimized`);
  }
});

test("MIKA unlocks on the first Wrong Engine victory and receives a one-time recruitment screen", async () => {
  const [app, characters, screens, styles] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/game/content/characters.js", root), "utf8"),
    readFile(new URL("src/ui/campaign/CampaignScreens.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
  ]);
  assert.match(characters, /unlockRegionId: "wrong-engine-core"/);
  assert.match(app, /consumePostVictoryScene\("recruit"\)/);
  assert.match(app, /getCampaignPostVictorySteps\(nextCampaign, slotId\)\[0\]/);
  assert.match(app, /setScreen\("recruit"\)/);
  assert.match(app, /<MikaRecruitScreen/);
  assert.match(screens, /export const MIKA_RECRUIT_DIALOGUE/);
  assert.match(screens, /링블레이드 전투원 미카, 지금부터 팀에 합류합니다/);
  assert.match(screens, /className="mika-recruit-stage"/);
  assert.match(screens, /mika-recruit-character is-\$\{line\.portrait\}/);
  assert.match(screens, /className="mika-recruit-dialogue-box"/);
  assert.match(screens, /assets\?\.controlOfficer[\s\S]*assets\?\.playerPortrait[\s\S]*assets\?\.mikaPortrait/);
  assert.match(screens, /event\.code !== "Space" && event\.code !== "Enter"/);
  assert.match(styles, /\.mika-recruit-character \{[\s\S]*left: 50%;[\s\S]*transform: translateX\(-50%\)/);
  assert.match(styles, /\.mika-recruit-dialogue-box \{[\s\S]*right: max\(28px[\s\S]*left: max\(28px/);
  assert.match(app, /scriptedLine\.speaker === "AEGIS" && characterId === "mika"/);
  assert.match(app, /MIKA: Object\.freeze\(\{ assetKey: "mikaPortrait"/);
});

test("Glass Dune unlocks the beam sword and opens its short-cooldown skill guide", async () => {
  const [app, weapons, screens, styles] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/game/content/weapons.js", root), "utf8"),
    readFile(new URL("src/ui/campaign/CampaignScreens.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
  ]);
  assert.match(weapons, /BEAM_SWORD_UNLOCK_REGION_ID = "glass-dune"/);
  assert.match(app, /consumePostVictoryScene\("sword-guide"\)/);
  assert.match(app, /<AbilityGuideScreen[\s\S]*guideType="sword"/);
  assert.match(screens, /SWORD_ABILITY_GUIDE[\s\S]*cooldown: 6[\s\S]*cooldown: 9[\s\S]*cooldown: 15[\s\S]*cooldown: 45/);
  assert.match(screens, /disabled=\{!weaponUnlocked\}/);
  assert.match(screens, /2구역 보스 처치 필요/);
  assert.match(styles, /\.ability-guide-sword-demo/);
  assert.match(styles, /\.sortie-weapon-card\.is-locked/);
});

test("character information presents full-height art, live stats, abilities, and persistent augmentation", async () => {
  const [app, screens, styles] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/ui/campaign/CampaignScreens.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
  ]);
  assert.match(screens, /function CharacterInformationPanel/);
  assert.match(screens, /className="character-art-stage"/);
  assert.match(screens, /className="character-data-console"/);
  assert.match(screens, /기본 정보/);
  assert.match(screens, /영구 강화/);
  assert.match(screens, /CHARACTER_ACTIVE_LOADOUTS/);
  assert.match(screens, /className="character-roster-rail"/);
  assert.match(screens, /onCharacterChange\?\.\(characterId\)/);
  assert.match(app, /portraitSource: character\.id === "mika" \? assets\?\.mikaPortrait : assets\?\.player/);
  assert.match(app, /onCharacterChange=\{selectCharacter\}/);
  assert.match(styles, /\.character-art-stage > img[\s\S]*object-fit: contain/);
  assert.match(styles, /\.character-information-panel[\s\S]*grid-template-columns: minmax\(320px, 47%\)/);
  assert.match(styles, /@media \(max-width: 900px\), \(max-height: 600px\)[\s\S]*\.character-information-panel/);
});

test("HAVEN NPC dialogue advances one line per Space press and closes on the final line", async () => {
  const [screens, styles] = await Promise.all([
    readFile(new URL("src/ui/campaign/CampaignScreens.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
  ]);
  const dialogue = screens.slice(screens.indexOf("export function NpcDialoguePanel"), screens.indexOf("export function BaseFacilityPanel"));
  assert.match(dialogue, /event\.code !== "Space" \|\| event\.repeat/);
  assert.match(dialogue, /event\.preventDefault\(\)/);
  assert.match(dialogue, /if \(final\) onClose\?\.\(\);\s*else onAdvance\?\.\(\);/);
  assert.match(dialogue, /<kbd>SPACE<\/kbd> \{final \? "대화 종료" : "다음 대사"\}/);
  assert.match(dialogue, /className="base-dialogue-actions"/);
  assert.match(dialogue, /className="base-dialogue-copy"/);
  assert.match(dialogue, /className="base-dialogue-next"/);

  const mobileDialogue = styles.slice(styles.indexOf("/* HAVEN NPC dialogue: portrait-phone bottom sheet"));
  assert.match(mobileDialogue, /@media \(max-width: 720px\) and \(orientation: portrait\)/);
  assert.match(mobileDialogue, /\.campaign-shell \.base-dialogue \{[\s\S]*right: 0;[\s\S]*bottom: 0;[\s\S]*left: 0;[\s\S]*max-height: min\(390px, 52dvh\);[\s\S]*padding: 17px 14px max\(14px, env\(safe-area-inset-bottom\)\) 158px;[\s\S]*overflow: visible/);
  assert.match(mobileDialogue, /\.campaign-shell \.base-dialogue-copy \{[\s\S]*z-index: 2;[\s\S]*overflow-y: auto/);
  assert.match(mobileDialogue, /\.campaign-shell \.base-npc-portrait \{[\s\S]*z-index: 1;[\s\S]*width: 154px;[\s\S]*height: calc\(100% \+ 96px\);[\s\S]*background-size: auto 100%/);
  assert.match(mobileDialogue, /\.campaign-shell \.base-dialogue p \{[\s\S]*font-size: 15px;[\s\S]*word-break: keep-all/);
  assert.match(mobileDialogue, /\.campaign-shell \.base-dialogue-actions button \{[\s\S]*min-height: 52px;[\s\S]*white-space: nowrap;[\s\S]*word-break: keep-all/);
  assert.match(mobileDialogue, /\.campaign-shell \.dialogue-escape-hint \{ display: none; \}/);
  assert.match(mobileDialogue, /@media \(max-width: 380px\) and \(orientation: portrait\)[\s\S]*\.campaign-shell \.base-npc-portrait \{ width: 132px; height: calc\(100% \+ 76px\); \}[\s\S]*\.campaign-shell \.base-dialogue-actions \{ grid-template-columns: 1fr; \}/);
});

test("first-sortie briefing separates automatic build skills from four new manual abilities and persists completion", async () => {
  const [app, screens, save] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/ui/campaign/CampaignScreens.jsx", root), "utf8"),
    readFile(new URL("src/game/save/campaignSave.js", root), "utf8"),
  ]);
  assert.match(app, /screen === "guide"/);
  assert.match(app, /const isFreshSlot = !existing/);
  assert.match(app, /setActiveNpc\(isFreshSlot \? BASE_NPCS\.rhea : null\)/);
  assert.doesNotMatch(app, /!nextSlot\?\.abilityGuideSeen && !debugGuideBypass/);
  assert.match(app, /new URLSearchParams\(window\.location\.search\)\.get\("debug"\) === "1"/);
  assert.match(app, /completeAbilityGuide\(campaign, activeSlotId\)/);
  assert.match(app, /completeCombatOverlay\(currentCampaign, activeSlotId\)/);
  assert.match(app, /!activeSlot\.combatOverlaySeen && !debugGuideBypass/);
  assert.match(app, /showCombatTutorial=\{Boolean/);
  assert.match(app, /function CombatAbilityTutorialOverlay/);
  assert.match(app, /tutorialAbilityId=\{combatTutorialStep >= 0/);
  assert.match(app, /onNpcInteraction=\{handleNpcInteraction\}/);
  assert.match(save, /abilityGuideSeen: Boolean\(slot\.abilityGuideSeen\)/);
  assert.match(save, /combatOverlaySeen: Boolean\(slot\.combatOverlaySeen\)/);
  assert.match(save, /"ability-guide-complete"/);
  assert.match(save, /"combat-overlay-complete"/);

  for (const [key, id, name, cooldown] of [
    ["Q", "empPulse", "EMP PULSE", 18],
    ["E", "aegisWard", "AEGIS WARD", 28],
    ["F", "stratosRun", "STRATOS RUN", 34],
    ["R", "helixTempest", "HELIX TEMPEST", 72],
  ]) {
    assert.match(screens, new RegExp(`key: "${key}"[\\s\\S]*?id: "${id}"[\\s\\S]*?name: "${name}"[\\s\\S]*?cooldown: ${cooldown}`));
  }
  assert.match(screens, /레벨업 기술/);
  assert.match(screens, /직접 사용 · 레벨업 기술과 별도/);
  assert.match(screens, /여러 바퀴 회전하며 사방을 연속 타격/);
  assert.match(screens, /실제 전투 화면/);
  assert.match(screens, /ability-example-callout/);
  for (const assetKey of ["tutorialEmpPulse", "tutorialAegisWard", "tutorialStratosRun", "tutorialHelixTempest"]) {
    assert.match(screens, new RegExp(`exampleAssetKey: "${assetKey}"`));
    assert.match(app, new RegExp(`${assetKey}: assets\\?\\.${assetKey}`));
  }
});

test("the ability briefing ships optimized real-game example crops", async () => {
  for (const name of [
    "emp-pulse-gameplay.jpg",
    "aegis-ward-gameplay.jpg",
    "stratos-run-gameplay.jpg",
    "helix-tempest-gameplay.jpg",
  ]) {
    const asset = await stat(new URL(`public/assets/overload/ui/tutorial/${name}`, root));
    assert.ok(asset.size > 50_000, `${name} should contain a readable gameplay crop`);
    assert.ok(asset.size < 150_000, `${name} should stay display-size optimized`);
  }
});

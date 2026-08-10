import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("App connects the three save slots to base, airship selection, regional Phaser launch, and victory persistence", async () => {
  const app = await readFile(new URL("src/App.jsx", root), "utf8");
  assert.match(app, /<SaveSlotScreen slots=\{campaign\.slots\}/);
  assert.match(app, /<HomeBaseScreen/);
  assert.match(app, /<RegionSelectScreen/);
  assert.match(app, /createCampaignSlot\(campaign, slotId\)/);
  assert.match(app, /completeRegion\(campaign, activeSlotId, regionId/);
  assert.match(app, /saveCampaign\(completed\)/);
  assert.match(app, /createOverloadGame\(host,[\s\S]*\}, \{ regionId, combatBonuses \}\)/);
  assert.match(app, /status === "victory"[\s\S]*setScreen\("base"\)/);
  assert.match(app, /setActiveNpc\(isFreshSlot \? BASE_NPCS\.rhea : null\)/);
  assert.match(app, /setGuideReturnScreen\("base"\)[\s\S]*setScreen\("base"\)/);
});

test("region selection previews and confirms a sortie instead of launching on card click", async () => {
  const [app, screens, sounds] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/ui/campaign/CampaignScreens.jsx", root), "utf8"),
    readFile(new URL("src/audio/sfx.js", root), "utf8"),
  ]);
  assert.match(screens, /setSelectedRegionId\(region\.id\)/);
  assert.match(screens, /className="region-sortie-dialog"/);
  assert.match(screens, /출격 준비 완료 · 작전 시작/);
  assert.match(screens, /onClick=\{\(\) => onSelect\(selectedRegion\.id\)\}/);
  assert.match(screens, /event\.key !== "Escape"/);
  assert.match(app, /document\.addEventListener\("pointerdown", handleButtonPointer, true\)/);
  for (const cue of ["uiHover", "uiConfirm", "uiClose"]) assert.match(sounds, new RegExp(`case "${cue}"`));
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
  assert.match(screens, /backgroundSize|background-size|backgroundPosition/);
  assert.match(screens, /NPC_ICON = Object\.freeze\(\{ hana: Broadcast, ilya: Wrench, lark: User, rhea: Crosshair \}\)/);
  assert.match(screens, /portraitMode === "standalone"/);
  assert.match(screens, /npc\.interactionLabel \|\| "상호작용"/);
  assert.match(screens, /구역 선택 및 출격/);
  assert.match(screens, /BaseFacilityPanel/);
  assert.match(screens, /facility-upgrade-grid/);
  assert.match(app, /getCampaignCombatBonuses\(campaign, activeSlotId\)/);
  assert.match(app, /purchaseCampaignUpgrade\(campaign, activeSlotId, upgradeId\)/);
  assert.match(app, /onOpenFacility=\{openFacility\}/);
  assert.doesNotMatch(app, /toggleAutoFire|autoFireEnabled|autoFireTogglePressed|클릭 수동 사격/);
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
  assert.match(app, /completeCombatOverlay\(campaign, activeSlotId\)/);
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
    ["Q", "gravitySnare", "NULL SNARE", 18],
    ["E", "aegisWard", "AEGIS WARD", 28],
    ["F", "stratosRun", "STRATOS RUN", 34],
    ["R", "helixTempest", "HELIX TEMPEST", 72],
  ]) {
    assert.match(screens, new RegExp(`key: "${key}"[\\s\\S]*?id: "${id}"[\\s\\S]*?name: "${name}"[\\s\\S]*?cooldown: ${cooldown}`));
  }
  assert.match(screens, /레벨업 기술/);
  assert.match(screens, /직접 눌러 사용 · 자동 기술과 완전히 별개/);
  assert.match(screens, /여러 바퀴 회전하며 사방을 연속 타격/);
  assert.match(screens, /실제 전투 화면/);
  assert.match(screens, /ability-example-callout/);
  for (const assetKey of ["tutorialNullSnare", "tutorialAegisWard", "tutorialStratosRun", "tutorialHelixTempest"]) {
    assert.match(screens, new RegExp(`exampleAssetKey: "${assetKey}"`));
    assert.match(app, new RegExp(`${assetKey}: assets\\?\\.${assetKey}`));
  }
});

test("the ability briefing ships optimized real-game example crops", async () => {
  for (const name of [
    "null-snare-gameplay.jpg",
    "aegis-ward-gameplay.jpg",
    "stratos-run-gameplay.jpg",
    "helix-tempest-gameplay.jpg",
  ]) {
    const asset = await stat(new URL(`public/assets/overload/ui/tutorial/${name}`, root));
    assert.ok(asset.size > 50_000, `${name} should contain a readable gameplay crop`);
    assert.ok(asset.size < 150_000, `${name} should stay display-size optimized`);
  }
});

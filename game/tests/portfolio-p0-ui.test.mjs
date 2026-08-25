import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

async function sources() {
  return Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/ui/campaign/CampaignScreens.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
    readFile(new URL("src/game/save/campaignSave.js", root), "utf8"),
  ]);
}

test("first sortie uses a two-step essentials briefing before contextual ability prompts", async () => {
  const [app, screens, styles] = await sources();
  const starter = screens.slice(screens.indexOf("export const STARTER_BRIEFING_GUIDE"), screens.indexOf("export const SWORD_ABILITY_GUIDE"));
  assert.equal((starter.match(/id: "starter/g) || []).length, 2);
  assert.match(starter, /이동과 자동 공격/);
  assert.match(starter, /대시와 위기 대응/);
  assert.match(app, /screen === "guide"[\s\S]*guideType="starter"/);
  assert.match(app, /tutorialAbilityId=\{combatTutorialStep >= 0 \? MANUAL_ABILITY_GUIDE/);
  assert.match(app, /openingNarrativeBeatRef\.current = event\.beat/);
  assert.match(app, /if \(!showCombatTutorial \|\| !openingNarrativeComplete/);
  assert.match(app, /dialogue\.beat === openingNarrativeBeatRef\.current/);
  assert.match(styles, /\.ability-guide-screen\.is-starter-guide \.ability-guide-tabs \{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
});

test("completing the combat tutorial keeps the active Phaser run alive", async () => {
  const [app] = await sources();
  assert.match(app, /const onFinishRef = useRef\(onFinish\)/);
  assert.match(app, /showCombatTutorialRef\.current = showCombatTutorial/);
  assert.match(app, /combatBonusesSignature = JSON\.stringify\(combatBonuses \|\| \{\}\)/);
  assert.match(app, /onFinishRef\.current\(result\)/);
  assert.match(
    app,
    /\}, \[characterId, combatBonusesSignature, mainWeaponId, mikaUnlocked, regionId, runRevision, sfx, vesperUnlocked\]\);/,
  );
  assert.doesNotMatch(app, /\[characterId, combatBonuses, mainWeaponId/);
});

test("locked MIKA is absent and a valid saved loadout is immediately launchable", async () => {
  const [app, screens, styles] = await sources();
  assert.match(app, /characters: facility\.id === "augmentation" \? playableCharacters\.map/);
  assert.match(screens, /const availableCharacters = useMemo\([\s\S]*character\?\.unlocked !== false/);
  assert.match(screens, /\{availableCharacters\.map\(\(character\) =>/);
  assert.doesNotMatch(screens, /confirmedWeaponId/);
  assert.match(screens, /const formationConfirmed = Boolean\(selectedCharacter && equippedWeaponUnlocked\)/);
  assert.match(screens, /현재 편성으로 즉시 출격할 수 있습니다/);
  assert.match(screens, /disabled=\{!formationConfirmed\}/);
  assert.match(screens, /formationConfirmed && onSelect\(selectedRegion\.id\)/);
  assert.match(styles, /\.region-sortie-dialog \.region-sortie-command-footer \{[\s\S]*position: sticky;/);
  assert.match(screens, /region-sortie-repeat-intel/);
});

test("combat aim is primed away from the previous menu click before unsuspending", async () => {
  const [app] = await sources();
  assert.match(app, /function primeCombatAim\(host\)[\s\S]*bounds\.width \* 0\.78[\s\S]*new PointerEventClass\("pointermove"/);
  assert.match(app, /if \(!preparing\) primeCombatAim\(hostRef\.current\);[\s\S]*setSuspended/);
  assert.match(app, /onReady: \(\) => \{\s*primeCombatAim\(host\);/);
});

test("every victory shows evidence and rewards before queued unlock and return scenes", async () => {
  const [app, , styles, campaignSave] = await sources();
  const finish = app.slice(app.indexOf("const finish = useCallback"), app.indexOf("const finishMikaRecruitment"));
  assert.match(finish, /campaignRewards: completedSlot\?\.lastRegionRewards/);
  assert.match(campaignSave, /pendingPostVictorySteps = \[[\s\S]*"return"/);
  assert.match(campaignSave, /pendingPostVictorySteps: sanitizePendingPostVictorySteps/);
  assert.ok(finish.indexOf("setResult({") < finish.indexOf('setScreen("result")'));
  assert.match(app, /const continuePostVictory = useCallback/);
  assert.match(app, /getCampaignPostVictorySteps\(campaign, activeSlotId\)\[0\]/);
  assert.match(app, /consumeCampaignPostVictoryStep\(sourceCampaign, activeSlotId, step\)/);
  assert.match(app, /nextStep === "recruit"/);
  assert.match(app, /nextStep === "sword-guide"/);
  assert.match(app, /className="result-evidence"/);
  assert.match(app, /stats\.projectileAccuracy/);
  assert.match(app, /패링 \{stats\.bossParries/);
  assert.match(app, /폭탄 \{stats\.bossBombsDefused/);
  assert.match(app, /className="result-rewards"/);
  assert.match(app, /region\?\.bossName \|\| region\?\.boss\?\.name/);
  assert.match(styles, /\.result-actions \.result-continue \{ grid-column: 1 \/ -1; \}/);
});

test("320px portrait result keeps evidence, rewards, and CTA in one internal scroll surface", async () => {
  const [, , styles] = await sources();
  const p0Portrait = styles.slice(styles.indexOf("/* Portfolio P0"), styles.indexOf("/* Mobile app UI v4"));
  assert.match(p0Portrait, /\.overload-result \{[\s\S]*height: 100dvh;[\s\S]*overflow: hidden;/);
  assert.match(p0Portrait, /\.overload-result \.result-card \{[\s\S]*max-height: calc\(100dvh[\s\S]*overflow-y: auto;[\s\S]*touch-action: pan-y;/);
  assert.match(p0Portrait, /\.overload-result \.result-evidence \{ margin: 0 0 12px; \}/);
  assert.match(p0Portrait, /\.overload-result \.result-actions \{ grid-template-columns: 1fr; \}/);
});

test("HANA facility exposes persisted surplus-resource exchanges", async () => {
  const [app, screens, styles] = await sources();
  assert.match(app, /getBaseResourceExchanges/);
  assert.match(app, /getCampaignResourceExchangeStatus/);
  assert.match(app, /exchangeCampaignResources\(campaign, activeSlotId, exchangeId\)/);
  assert.match(app, /saveCampaign\(exchange\.campaign\)/);
  assert.match(screens, /className="facility-exchange-panel"/);
  assert.match(screens, /onExchange\?\.\(exchange\.id\)/);
  assert.match(styles, /\.facility-exchange-panel/);
});

test("portfolio-critical campaign and portrait combat copy remains readable", async () => {
  const [, , styles] = await sources();
  const p0 = styles.slice(styles.indexOf("/* Portfolio P0"));
  const shortHeight = p0.slice(p0.indexOf("@media (min-width: 981px)"), p0.indexOf("@media (max-width: 720px)"));
  assert.match(p0, /@media \(pointer: fine\) and \(min-width: 761px\)[\s\S]*\.region-sortie-briefing > p,[\s\S]*font-size: 13px/);
  assert.match(shortHeight, /\.region-sortie-close,[\s\S]*\.region-sortie-launch strong \{ font-size: 13px; \}/);
  assert.doesNotMatch(shortHeight, /\.campaign-shell\.campaign-shell button/);
  assert.match(p0, /@media \(max-width: 720px\) and \(orientation: portrait\)[\s\S]*\.combat-dock-abilities \{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(p0, /\.combat-ability-copy strong \{[\s\S]*font-size: 11px;[\s\S]*-webkit-line-clamp: 2/);
});

test("bilingual Wrong Engine proper name is not partially re-localized", async () => {
  const [, screens] = await sources();
  assert.match(screens, /replaceAll\("THE WRONG ENGINE", protectedWrongEngine\)/);
  assert.match(screens, /replaceAll\(protectedWrongEngine, "THE WRONG ENGINE"\)/);
  assert.doesNotMatch(screens, /THE 오답 엔진/);
});

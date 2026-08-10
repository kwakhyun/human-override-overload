import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("Phaser combat dock gives HP visual priority and exposes only the five manual input slots", async () => {
  const [app, styles] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
  ]);

  for (const slot of [
    ['id: "dash", key: "SPACE"', "dash"],
    ['id: "gravitySnare", key: "Q"', "gravitySnare"],
    ['id: "aegisWard", key: "E"', "aegisWard"],
    ['id: "stratosRun", key: "F"', "stratosRun"],
    ['id: "helixTempest", key: "R"', "helixTempest"],
  ]) {
    assert.ok(app.includes(slot[0]), `${slot[1]} slot should keep its visible keyboard binding`);
  }
  const slotStart = app.indexOf("const COMBAT_DOCK_SLOTS");
  const slotEnd = app.indexOf("const REWARD_COPY", slotStart);
  const slotContract = app.slice(slotStart, slotEnd);
  assert.doesNotMatch(slotContract, /squadRecall|chain|nova|airstrike/);
  assert.doesNotMatch(app, /4-FRONT RECALL|touchRecall|\.recall\(\)/);

  assert.match(app, /function resolveCombatDockSlot\(hud, slot\)/);
  assert.match(app, /const locked = !hasAbility \|\| Boolean\(ability\.locked\) \|\| rank <= 0/);
  assert.match(app, /const targetAvailable = ability\?\.available !== false/);
  assert.match(app, /remaining > 0\.05 \? `\$\{remaining\.toFixed\(1\)\}s`[\s\S]*!targetAvailable \? "NO TARGET"/);
  assert.match(app, /ability\?\.remaining \?\? ability\?\.cooldownRemaining \?\? ability\?\.cooldown/);
  assert.match(app, /function ExpeditionCombatDock\(\{ hud, onDash, onActivateAbility, tutorialAbilityId = null, onTutorialTarget \}\)/);
  assert.match(app, /className="vital-bar"[\s\S]*aria-valuenow=\{Math\.ceil\(hp\)\}/);
  assert.match(app, /<button[\s\S]*className=\{`combat-ability-chip[\s\S]*aria-label=\{`\$\{slot\.key\} \$\{slot\.label\}\. \$\{slot\.status\}`\}/);
  assert.match(app, /if \(slot\.action === "dash"\) onDash\?\.\(\);\s*else onActivateAbility\?\.\(slot\.action\)/);
  assert.match(app, /controllerRef\.current\?\.activateAbility\?\.\(slot\)/);
  assert.match(app, /<ExpeditionCombatDock[\s\S]*hud=\{hud\}[\s\S]*onDash=\{activateDash\}[\s\S]*onActivateAbility=\{activateAbility\}[\s\S]*tutorialAbilityId=/);
  assert.match(app, /data-combat-ability=\{slot\.id\}/);
  assert.match(app, /is-tutorial-target/);

  const dockStart = styles.indexOf(".expedition-combat-dock {");
  const dockEnd = styles.indexOf("}\n", dockStart);
  const dock = styles.slice(dockStart, dockEnd);
  assert.match(dock, /bottom: max\(18px, env\(safe-area-inset-bottom\)\)/);
  assert.match(dock, /left: 50%/);
  assert.match(dock, /width: min\(760px, calc\(100% - 560px\)\)/);
  assert.match(dock, /grid-template-rows: auto auto/);
  assert.match(styles, /\.vital-cluster b \{ color: #fbfeff; font-size: 22px/);
  assert.match(styles, /\.combat-dock-abilities \{[\s\S]*grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.combat-ability-chip \{[\s\S]*pointer-events: auto;[\s\S]*cursor: pointer/);

  const mobileStart = styles.indexOf("@media (max-width: 760px), (max-height: 560px)");
  const mobileEnd = styles.indexOf("@media (prefers-reduced-motion: reduce)", mobileStart);
  const mobile = styles.slice(mobileStart, mobileEnd);
  assert.match(mobile, /\.expedition-combat-dock \{[\s\S]*top: 52px;[\s\S]*bottom: auto;[\s\S]*left: 12px;[\s\S]*width: min\(440px, calc\(100% - 190px\)\)/);
  assert.match(mobile, /\.expedition-touch-controls \{[\s\S]*right: auto;[\s\S]*bottom: 12px;[\s\S]*width: 126px;[\s\S]*background: transparent;/);
  assert.match(mobile, /\.route-minimap \{[\s\S]*top: 51px;[\s\S]*right: 12px;[\s\S]*width: 156px/);
});

test("Escape pause is guarded from modal states and supports resume, local restart, and unlocked base exit", async () => {
  const app = await readFile(new URL("src/App.jsx", root), "utf8");
  assert.match(app, /const pausedRef = useRef\(false\)/);
  assert.match(app, /const \[paused, setPaused\] = useState\(false\)/);
  assert.match(app, /const \[runRevision, setRunRevision\] = useState\(0\)/);
  assert.match(app, /controllerRef\.current\?\.setSuspended\(query\.matches \|\| pausedRef\.current \|\| combatTutorialActiveRef\.current\)/);
  assert.match(app, /if \(event\.key !== "Escape" \|\| event\.repeat\) return/);
  assert.match(app, /if \(needsLandscapeRef\.current \|\| combatTutorialActiveRef\.current \|\| dialogue \|\| bossGatePrompt \|\| rewardOpen\) return/);
  assert.match(app, /pausedRef\.current = true;\s*setPaused\(true\);\s*controllerRef\.current\?\.setSuspended\(true\)/);
  assert.match(app, /if \(needsLandscapeRef\.current \|\| combatTutorialActiveRef\.current\) return;[\s\S]*controllerRef\.current\?\.setSuspended\(false\)/);
  assert.match(app, /setRunRevision\(\(revision\) => revision \+ 1\)/);
  assert.match(app, /\[combatBonuses, onFinish, regionId, runRevision, sfx\]/);
  assert.match(app, /<PauseOverlay onResume=\{resumeCombat\} onRestart=\{restartCombat\} onBase=\{onBase \? returnToBase : null\} \/>/);
  assert.match(app, /onBase=\{activeSlot\?\.homeBaseUnlocked \? \(\) => setScreen\("base"\) : null\}/);
});

test("airstrike banner dedupe and independent manual ability SFX stay separate", async () => {
  const app = await readFile(new URL("src/App.jsx", root), "utf8");
  assert.match(app, /const airstrikeBannerShownRef = useRef\(false\)/);
  assert.match(app, /airstrikeBannerShownRef\.current = false;[\s\S]*const showBanner = \(event\) =>/);

  const showStart = app.indexOf("const showBanner = (event) =>");
  const showEnd = app.indexOf("finishReportedRef.current = false", showStart);
  const showBanner = app.slice(showStart, showEnd);
  assert.match(showBanner, /event\.type === "ultimateWarning" && event\.skill === "airstrike"/);
  assert.match(showBanner, /if \(airstrikeBannerShownRef\.current\) return;\s*airstrikeBannerShownRef\.current = true;/);

  const soundsStart = app.indexOf("const EVENT_SOUNDS");
  const soundsEnd = app.indexOf("const WEAPON_EVENT_SOUNDS", soundsStart);
  const sounds = app.slice(soundsStart, soundsEnd);
  assert.match(sounds, /gravitySnareDeployed: "emp"/);
  assert.match(sounds, /aegisWardActivated: "collect"/);
  assert.match(sounds, /stratosRunSweep: "rail"/);
  assert.match(sounds, /helixTempestStarted: "bossBreak"/);
  assert.match(sounds, /manualAbilityRejected: "alert"/);
  assert.doesNotMatch(sounds, /^\s*manualAbilityActivated:/m);

  const onEventStart = app.indexOf("onEvent: (event) =>", showEnd);
  const onEventEnd = app.indexOf("onFinish: (result) =>", onEventStart);
  const onEvent = app.slice(onEventStart, onEventEnd);
  assert.ok(onEvent.indexOf("sfx.play(sound)") < onEvent.indexOf("showBanner(event)"), "SFX must play before optional banner suppression");
});

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
    ['id: "empPulse", key: "Q"', "empPulse"],
    ['id: "aegisWard", key: "E"', "aegisWard"],
    ['id: "stratosRun", key: "F"', "stratosRun"],
    ['id: "helixTempest", key: "R"', "helixTempest"],
  ]) {
    assert.ok(app.includes(slot[0]), `${slot[1]} slot should keep its visible keyboard binding`);
  }
  const slotStart = app.indexOf("const COMBAT_DOCK_SLOTS");
  const slotEnd = app.indexOf("const REWARD_NAMES_KO", slotStart);
  const slotContract = app.slice(slotStart, slotEnd);
  assert.doesNotMatch(slotContract, /squadRecall|chain|nova|airstrike/);
  assert.doesNotMatch(app, /4-FRONT RECALL|touchRecall|\.recall\(\)/);

  assert.match(app, /function resolveCombatDockSlot\(hud, slot\)/);
  assert.match(app, /const locked = !hasAbility \|\| Boolean\(ability\.locked\) \|\| rank <= 0/);
  assert.match(app, /const targetAvailable = ability\?\.available !== false/);
  assert.match(app, /remaining > 0\.05 \? `\$\{remaining\.toFixed\(1\)\}초`[\s\S]*!targetAvailable \? "대상 없음"/);
  assert.match(app, /ability\?\.remaining \?\? ability\?\.cooldownRemaining \?\? ability\?\.cooldown/);
  assert.match(app, /function ExpeditionCombatDock\(\{ hud, onDash, onActivateAbility, tutorialAbilityId = null, onTutorialTarget \}\)/);
  assert.match(app, /className="vital-bar"[\s\S]*aria-valuenow=\{Math\.ceil\(hp\)\}/);
  assert.match(app, /<button[\s\S]*className=\{`combat-ability-chip[\s\S]*aria-label=\{`\$\{slot\.key\} \$\{slot\.label\}\. \$\{slot\.status\}`\}/);
  assert.match(app, /if \(slot\.action === "dash"\) onDash\?\.\(\);\s*else onActivateAbility\?\.\(slot\.action\)/);
  assert.match(app, /controllerRef\.current\?\.activateAbility\?\.\(slot\)/);
  assert.match(app, /<ExpeditionCombatDock[\s\S]*hud=\{hud\}[\s\S]*onDash=\{activateDash\}[\s\S]*onActivateAbility=\{activateAbility\}[\s\S]*tutorialAbilityId=/);
  assert.match(app, /data-combat-ability=\{slot\.id\}/);
  assert.match(app, /is-tutorial-target/);
  assert.match(app, /className="combat-ability-cooldown"/);
  assert.match(app, /"--cooldown-sweep": `\$\{Math\.round\(\(1 - slot\.meter\) \* 360\)\}deg`/);
  assert.match(app, /previousHpRef[\s\S]*hp < previous - 0\.01|previousHpRef[\s\S]*hp >= previous - 0\.01/);
  assert.match(app, /className="vital-damage-flash"/);

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
  assert.match(styles, /\.combat-ability-cooldown \{[\s\S]*conic-gradient\(from 0deg/);
  assert.match(styles, /@keyframes vital-damage-warning/);
  assert.match(styles, /prefers-reduced-motion: reduce[\s\S]*\.vital-damage-flash \{ opacity: 1; animation: none;/);

  const mobileStart = styles.indexOf("@media (max-width: 760px), (max-height: 560px)");
  const mobileEnd = styles.indexOf("@media (prefers-reduced-motion: reduce)", mobileStart);
  const mobile = styles.slice(mobileStart, mobileEnd);
  assert.match(mobile, /\.expedition-combat-dock \{[\s\S]*top: 52px;[\s\S]*bottom: auto;[\s\S]*left: 12px;[\s\S]*width: min\(440px, calc\(100% - 190px\)\)/);
  assert.match(mobile, /\.expedition-touch-controls \{[\s\S]*right: auto;[\s\S]*bottom: 12px;[\s\S]*width: 126px;[\s\S]*background: transparent;/);
  assert.match(mobile, /\.route-minimap \{[\s\S]*top: 51px;[\s\S]*right: 12px;[\s\S]*width: 156px/);
});

test("level-up focus starts on the dialog, not option one, until real keyboard navigation", async () => {
  const [app, styles] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
  ]);

  const overlay = app.slice(app.indexOf("function LevelUpOverlay"), app.indexOf("function ArenaScreen"));
  assert.match(overlay, /modalRef\.current\?\.focus\(\{ preventScroll: true \}\)/);
  assert.match(overlay, /className="reward-modal"[\s\S]*tabIndex="-1"/);
  assert.doesNotMatch(overlay, /firstOptionRef|firstOptionRef\.current\?\.focus/);
  assert.match(overlay, /event\.key !== "Tab"/);
  assert.match(styles, /\.reward-card:hover,[\s\S]*\.reward-card:focus-visible/);
});

test("Phaser DOM HUD consumes route gate, clear-transition, and two-dimensional minimap payloads", async () => {
  const [app, styles] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
  ]);

  assert.match(app, /function GateLockedNotice\(\{ notice \}\)/);
  assert.match(app, /hud\?\.expedition\?\.gateNotice/);
  assert.match(app, /function RouteClearTransition\(\{ transition \}\)/);
  assert.match(app, /hud\?\.expedition\?\.clearTransition/);
  assert.match(app, /CLEAR_TRANSITION_COPY[\s\S]*warning[\s\S]*panic[\s\S]*swap/);
  assert.match(app, /event\.type === "bossAutoTransition" && !autoBossEntryHandledRef\.current/);
  assert.match(app, /autoBossEntryHandledRef\.current = true;[\s\S]*controller\?\.enterBossRoom\(\)/);
  assert.doesNotMatch(app, /function BossGateOverlay|className="boss-gate-overlay"/);

  assert.match(app, /const minimap = expedition\.minimap \|\| hud\?\.minimap \|\| \{\}/);
  assert.match(app, /Array\.isArray\(minimap\.enemies\)/);
  assert.match(app, /minimap\.bossGate/);
  assert.match(app, /className=\{`route-minimap-enemy/);
  assert.match(styles, /\.route-minimap-field \{/);
  assert.match(styles, /\.route-minimap-enemy \{/);
  assert.match(styles, /\.gate-locked-notice \{/);
  assert.match(styles, /\.route-clear-transition \{/);
});

test("active HUD and HAVEN interactions expose Korean-first copy with in-world NPC figures", async () => {
  const [app, screens, styles] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/ui/campaign/CampaignScreens.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
  ]);

  assert.match(app, /const BOSS_NAME_KO/);
  assert.match(app, /function localizeObjective/);
  assert.match(app, /normalized\.includes\("GATE SEALED"\)/);
  assert.match(app, /clearPhase === "panic"/);
  assert.match(app, /\? \(expedition\?\.bossRoom \? "보스 구역 교전" : "전방 작전 계속"\)/);
  assert.match(app, /오답 엔진[\s\S]*거울 폭군[\s\S]*침몰한 예언자/);
  assert.match(app, /bossGroggy: \["보스 그로기 · 피해 2\.5배"/);
  assert.match(app, /<strong>\{REWARD_NAMES_KO\[option\.id\]/);
  assert.match(screens, /function NpcWorldFigure/);
  assert.match(screens, /<NpcWorldFigure npc=\{npc\} assets=\{assets\} \/>/);
  for (const id of ["hana", "ilya", "lark", "rhea"]) assert.match(screens, new RegExp(`${id}: Object\\.freeze`));
  assert.match(styles, /\.base-hotspot > \.base-npc-world-figure \{/);
  assert.match(styles, /background-size: auto 100%/);
});

test("Escape pause is guarded from modal states and supports resume, local restart, and unlocked base exit", async () => {
  const app = await readFile(new URL("src/App.jsx", root), "utf8");
  assert.match(app, /const pausedRef = useRef\(false\)/);
  assert.match(app, /const \[paused, setPaused\] = useState\(false\)/);
  assert.match(app, /const \[runRevision, setRunRevision\] = useState\(0\)/);
  assert.match(app, /controllerRef\.current\?\.setSuspended\(query\.matches \|\| pausedRef\.current \|\| combatTutorialActiveRef\.current\)/);
  assert.match(app, /if \(event\.key !== "Escape" \|\| event\.repeat\) return/);
  assert.match(app, /if \(needsLandscapeRef\.current \|\| combatTutorialActiveRef\.current \|\| dialogue \|\| rewardOpen\) return/);
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
  assert.match(sounds, /empPulseActivated: "emp"/);
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

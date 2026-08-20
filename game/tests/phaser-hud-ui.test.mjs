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
  assert.match(slotContract, /label: "방벽 전개"/);
  assert.match(slotContract, /label: "항공 지원"/);
  assert.match(slotContract, /label: "섬멸 모드"/);
  assert.doesNotMatch(slotContract, /squadRecall|chain|nova|airstrike/);
  assert.doesNotMatch(app, /4-FRONT RECALL|touchRecall|\.recall\(\)/);

  assert.match(app, /function resolveCombatDockSlot\(hud, slot\)/);
  assert.match(app, /const locked = !hasAbility \|\| Boolean\(ability\.locked\) \|\| rank <= 0/);
  assert.match(app, /const targetAvailable = ability\?\.available !== false/);
  assert.match(app, /remaining > 0\.05 \? `\$\{remaining\.toFixed\(1\)\}초`[\s\S]*!targetAvailable \? "대상 없음"/);
  assert.match(app, /ability\?\.remaining \?\? ability\?\.cooldownRemaining \?\? ability\?\.cooldown/);
  assert.match(app, /function ExpeditionCombatDock\(\{ hud, onDash, onTag, onActivateAbility, tutorialAbilityId = null, onTutorialTarget \}\)/);
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
  assert.match(mobile, /\.expedition-touch-controls \{[\s\S]*display: block;[\s\S]*inset: 0;[\s\S]*width: auto;[\s\S]*background: transparent;/);
  assert.match(styles, /\.floating-touch-joystick \{[\s\S]*border-radius: 50%;[\s\S]*pointer-events: none/);
  assert.match(app, /function FloatingTouchJoystick[\s\S]*surface\.addEventListener\("pointerdown", begin[\s\S]*surface\.addEventListener\("pointermove", move[\s\S]*surface\.addEventListener\("pointercancel", end/);
  assert.match(app, /event\.pointerType === "mouse"/);
  assert.match(app, /FLOATING_JOYSTICK_BLOCKED_SELECTOR/);
  assert.match(app, /controllerRef\.current\?\.setMovement\?\.\(x, y\)/);
  assert.doesNotMatch(app, /function TouchDirectionButton|<TouchDirectionButton/);
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

test("Phaser DOM HUD shows authored combat and transit cues without restoring a boss gate", async () => {
  const [app, styles] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
  ]);

  assert.doesNotMatch(app, /GateLockedNotice|gateNotice/);
  assert.match(app, /function RouteClearTransition\(\{ transition \}\)/);
  assert.match(app, /hud\?\.expedition\?\.clearTransition/);
  assert.match(app, /CLEAR_TRANSITION_COPY[\s\S]*warning[\s\S]*panic[\s\S]*swap/);
  assert.match(app, /event\.type === "bossAutoTransition" && !autoBossEntryHandledRef\.current/);
  assert.match(app, /autoBossEntryHandledRef\.current = true;[\s\S]*controller\?\.enterBossRoom\(\)/);
  assert.doesNotMatch(app, /function BossGateOverlay|className="boss-gate-overlay"/);

  assert.match(app, /const minimap = expedition\.minimap \|\| hud\?\.minimap \|\| \{\}/);
  assert.match(app, /Array\.isArray\(minimap\.enemies\)/);
  assert.doesNotMatch(app, /minimap\.bossGate|route-minimap-engine/);
  assert.match(app, /const nextWaveAnchor = Number\(expedition\.nextWaveAnchor\)/);
  assert.match(app, /const playerRouteRatio = clampMapRatio\(player\?\.x, progress\)/);
  assert.match(app, /const nextWaveRatio = !bossRoom[\s\S]*nextWaveAnchor > 0[\s\S]*nextWaveAnchor < routeLength[\s\S]*nextWaveAnchorRatio > playerRouteRatio/);
  assert.match(app, /nextWaveRatio !== null[\s\S]*className="route-minimap-next-wave"[\s\S]*left: `\$\{nextWaveRatio \* 100\}%`/);
  assert.match(app, /const gates = !bossRoom && Array\.isArray\(minimap\.gates\)[\s\S]*filter\(\(gate\) => gate\?\.active\)\.slice\(0, 5\)/);
  assert.match(app, /gates\.map\(\(gate, index\)[\s\S]*className="route-minimap-transit-gate"[\s\S]*--gate-progress/);
  assert.match(app, /className=\{`route-minimap-enemy/);
  assert.match(styles, /\.route-minimap-field \{/);
  assert.match(styles, /\.route-minimap-next-wave \{[\s\S]*top: 50%;[\s\S]*color: #ffd27a/);
  assert.match(styles, /\.route-minimap-transit-gate \{[\s\S]*width: 9px;[\s\S]*rotate\(45deg\)/);
  assert.match(styles, /\.route-minimap-enemy \{/);
  assert.doesNotMatch(styles, /\.gate-locked-notice/);
  assert.match(styles, /\.route-clear-transition \{/);
});

test("active HUD and HAVEN interactions expose Korean-first copy with NPC menu portraits", async () => {
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
  assert.match(screens, /function NpcPortrait/);
  assert.match(screens, /className=\{`base-menu-button npc-\$\{npc\.id\}/);
  for (const id of ["hana", "ilya", "lark", "rhea"]) assert.match(screens, new RegExp(`${id}: Object\\.freeze`));
  assert.match(styles, /\.base-npc-portrait \{/);
  assert.match(styles, /background-size: auto 100%/);
});

test("Escape pause is guarded from modal states and supports resume, local restart, and unlocked base exit", async () => {
  const [app, styles] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
  ]);
  assert.match(app, /const pausedRef = useRef\(false\)/);
  assert.match(app, /const \[paused, setPaused\] = useState\(false\)/);
  assert.match(app, /const \[runRevision, setRunRevision\] = useState\(0\)/);
  assert.match(app, /controllerRef\.current\?\.setSuspended\(preparingRef\.current \|\| pausedRef\.current \|\| combatTutorialActiveRef\.current\)/);
  assert.match(app, /if \(event\.key !== "Escape" \|\| event\.repeat\) return/);
  assert.match(app, /if \(combatTutorialActiveRef\.current \|\| dialogue \|\| rewardOpen\) return/);
  assert.match(app, /pausedRef\.current = true;\s*setPaused\(true\);\s*controllerRef\.current\?\.setSuspended\(true\)/);
  assert.match(app, /if \(combatTutorialActiveRef\.current\) return;[\s\S]*controllerRef\.current\?\.setSuspended\(false\)/);
  assert.match(app, /setRunRevision\(\(revision\) => revision \+ 1\)/);
  assert.match(app, /const pauseCombat = useCallback\(\(\) => \{[\s\S]*pausedRef\.current = true;[\s\S]*controllerRef\.current\?\.setSuspended\(true\)/);
  assert.match(app, /className="expedition-hud-actions"[\s\S]*className="expedition-pause-toggle"[\s\S]*onClick=\{pauseCombat\}/);
  assert.match(app, /function triggerTouchFeedback\(pattern = 12\)/);
  assert.match(styles, /\.expedition-hud-actions \{[\s\S]*pointer-events: auto/);
  assert.match(styles, /\.expedition-pause-toggle \{[\s\S]*width: 38px;[\s\S]*height: 38px/);
  assert.match(styles, /@media \(max-width: 720px\) and \(orientation: portrait\)[\s\S]*\.expedition-pause-toggle \{ width: 48px; height: 48px; \}/);
  assert.match(app, /\[characterId, combatBonusesSignature, mainWeaponId, mikaUnlocked, regionId, runRevision, sfx\]/);
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
  assert.match(sounds, /stratosRunImpact: "explosion"/);
  assert.match(sounds, /helixTempestStarted: "bossBreak"/);
  assert.match(sounds, /manualAbilityRejected: "alert"/);
  assert.doesNotMatch(sounds, /^\s*manualAbilityActivated:/m);

  const onEventStart = app.indexOf("onEvent: (event) =>", showEnd);
  const onEventEnd = app.indexOf("onFinish: (result) =>", onEventStart);
  const onEvent = app.slice(onEventStart, onEventEnd);
  assert.ok(onEvent.indexOf("sfx.play(sound)") < onEvent.indexOf("showBanner(event)"), "SFX must play before optional banner suppression");
});

test("result actions keep retry and base return as two readable responsive buttons", async () => {
  const [app, styles] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
  ]);
  const result = app.slice(app.indexOf("function ResultScreen"), app.indexOf("function App"));
  assert.match(result, /className="result-actions"/);
  assert.match(result, /같은 구역 재도전/);
  assert.match(result, /className="result-base-return"[\s\S]*헤이븐-09로 귀환[\s\S]*<HouseLine/);
  assert.match(styles, /\.result-actions \{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.result-actions \.primary-cta,[\s\S]*\.result-base-return \{[\s\S]*width: 100%;[\s\S]*min-width: 0;/);
  assert.match(styles, /@media \(max-width: 1120px\)[\s\S]*\.result-actions \{ grid-template-columns: 1fr; \}/);
});

test("phone landscape keeps rewards, defeat actions, dialogue advance, and movement controls inside the viewport", async () => {
  const [app, styles] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
  ]);
  const landscapeStart = styles.lastIndexOf("@media (max-height: 600px) and (orientation: landscape)");
  assert.ok(landscapeStart > 0);
  const landscape = styles.slice(landscapeStart);
  assert.match(landscape, /\.reward-modal \{[\s\S]*max-height: calc\(100dvh - 12px\);[\s\S]*overflow-y: auto/);
  assert.match(landscape, /\.reward-options \{ grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(landscape, /\.reward-card \{[\s\S]*height: clamp\(190px, calc\(100dvh - 154px\), 270px\);[\s\S]*min-height: 0/);
  assert.match(landscape, /\.overload-result \{[\s\S]*height: 100dvh;[\s\S]*overflow-y: auto/);
  assert.match(landscape, /\.overload-result \.result-actions \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(landscape, /\.narrative-panel \{[\s\S]*min-height: 132px/);
  assert.match(styles, /\.narrative-panel > button \{[\s\S]*min-width: 92px;[\s\S]*min-height: 58px/);
  assert.match(styles, /\.narrative-panel > button span \{ display: inline; \}/);
  assert.equal((app.match(/<TouchJoystick onMove=/g) || []).length, 1);
  assert.equal((app.match(/<FloatingTouchJoystick surfaceRef=/g) || []).length, 1);
});

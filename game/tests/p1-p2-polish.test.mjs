import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("P1 portrait combat keeps the wide lens while enlarging actors and exposing offscreen threats", async () => {
  const [app, battleView, responsiveStyles] = await Promise.all([
    read("src/App.jsx"),
    read("src/phaser/view/BattleView.ts"),
    read("src/styles/p1-p2.css"),
  ]);

  assert.match(battleView, /const portraitActorScale = this\.portraitPresentation && state\?\.phase !== "boss" \? 1\.34 : 1/);
  assert.match(battleView, /private drawPortraitThreatIndicators\(/);
  assert.match(battleView, /const ringRadius = 35 \+ pulse \* 3/);
  assert.match(battleView, /graphics\.strokeCircle\(playerX, playerY, ringRadius\)/);
  assert.match(battleView, /rendered >= 5/);
  assert.match(battleView, /enemy\?\.elite \|\| enemy\?\.isMidBoss \? COLORS\.amber : COLORS\.red/);
  assert.match(battleView, /graphics\.strokeCircle\(tipX, tipY, 13\)/);
  assert.match(battleView, /this\.drawPortraitThreatIndicators\(state, graphics, viewportWidth, viewportHeight\)/);
  assert.match(app, /"ELIMINATE CURRENT WAVE": "웨이브 적 섬멸"/);
  assert.match(responsiveStyles, /\.route-objective strong \{[\s\S]*font-size: 18px;[\s\S]*white-space: normal;[\s\S]*text-overflow: clip/);
  assert.match(responsiveStyles, /\.combat-ability-chip,[\s\S]*min-height: 62px/);
  assert.match(responsiveStyles, /\.combat-ability-copy strong,[\s\S]*font-size: 13px/);
  assert.match(responsiveStyles, /\.combat-ability-copy > b,[\s\S]*font-size: 12px/);
});

test("P1 modals trap focus, make background surfaces inert, and expose mobile carousel position", async () => {
  const [app, screens, focusTrap, responsiveStyles] = await Promise.all([
    read("src/App.jsx"),
    read("src/ui/campaign/CampaignScreens.jsx"),
    read("src/ui/useDialogFocusTrap.js"),
    read("src/styles/p1-p2.css"),
  ]);

  assert.match(focusTrap, /event\.key !== "Tab"/);
  assert.match(focusTrap, /previouslyFocused\?\.isConnected/);
  assert.match(focusTrap, /document\.addEventListener\("keydown", trapFocus, true\)/);
  assert.match(app, /useDialogFocusTrap\(modalRef, Boolean\(ability\)\)/);
  assert.match(app, /useDialogFocusTrap\(modalRef, true\)/);
  assert.match(screens, /function CarouselPosition/);
  assert.match(screens, /className="base-facility-position"/);
  assert.match(screens, /className="region-card-position"/);
  assert.match(screens, /className="home-base-surface" inert=\{modalOpen\} aria-hidden=\{modalOpen\}/);
  assert.match(screens, /inert=\{Boolean\(selectedRegion\)\}/);
  assert.match(responsiveStyles, /\.home-base-screen\.has-modal::after,[\s\S]*background: rgba\(0, 5, 8, 0\.76\)/);
  assert.match(responsiveStyles, /\.base-facility-position,[\s\S]*height: 48px/);
  assert.match(responsiveStyles, /\.base-facility-position button,[\s\S]*width: 48px;[\s\S]*height: 48px/);
});

test("P1 defense pads support keyboard and explicit previous-next navigation", async () => {
  const [app, scene, createGame, responsiveStyles] = await Promise.all([
    read("src/App.jsx"),
    read("src/phaser/scenes/DefenseScene.ts"),
    read("src/phaser/createDefenseGame.ts"),
    read("src/styles/p1-p2.css"),
  ]);

  for (const key of ["LEFT", "UP", "RIGHT", "DOWN"]) {
    assert.match(scene, new RegExp(`keydown-${key}`));
  }
  assert.match(scene, /cycleNode\(direction = 1\)/);
  assert.match(scene, /return this\.selectNode\(this\.state\.nodes\[nextIndex\]\.id\)/);
  assert.match(createGame, /cycleNode: \(direction: number\) => boolean/);
  assert.match(createGame, /cycleNode: \(direction: number\) => battle\.cycleNode\(direction\)/);
  assert.match(app, /className="defense-pad-stepper"/);
  assert.match(app, /onClick=\{\(\) => controllerRef\.current\?\.cycleNode\(-1\)\}/);
  assert.match(responsiveStyles, /\.defense-command-dock > header > \.defense-pad-stepper button \{ width: 48px; min-width: 48px; height: 48px; \}/);
});

test("P2 character details use staged disclosure and sortie videos only preload metadata", async () => {
  const [main, screens, responsiveStyles] = await Promise.all([
    read("src/main.jsx"),
    read("src/ui/campaign/CampaignScreens.jsx"),
    read("src/styles/p1-p2.css"),
  ]);

  assert.match(main, /import "\.\/styles\/p1-p2\.css"/);
  assert.match(screens, /const \[portraitCompact, setPortraitCompact\] = useState\(false\)/);
  assert.match(screens, /className=\{`character-information-panel[\s\S]*\$\{portraitCompact \? " is-portrait-compact" : ""\}`\}/);
  assert.match(screens, /className="character-portrait-toggle"/);
  assert.match(screens, /setPortraitCompact\(\(compact\) => !compact\)/);
  assert.match(screens, /preload="metadata"/);
  assert.doesNotMatch(screens, /preload="auto"/);
  assert.match(responsiveStyles, /\.character-information-panel\.is-portrait-compact \.character-art-stage \{[\s\S]*display: none/);
  assert.match(responsiveStyles, /\.character-roster-rail \{[\s\S]*position: sticky/);
  assert.match(responsiveStyles, /\.character-info-tabs \{[\s\S]*position: sticky/);
});

test("P1 and P2 polish exposes opening protection, focus HUD controls, trustworthy results, and upgrade filtering", async () => {
  const [app, engine, screens, responsiveStyles] = await Promise.all([
    read("src/App.jsx"),
    read("src/swarm/engine.js"),
    read("src/ui/campaign/CampaignScreens.jsx"),
    read("src/styles/p1-p2.css"),
  ]);

  assert.match(engine, /EXPEDITION_ENTRY_GRACE_DURATION = 4\.5/);
  assert.match(engine, /EXPEDITION_ENTRY_RAMP_END = 10/);
  assert.match(engine, /EXPEDITION_ENTRY_ADAPTIVE_CAP = 14/);
  assert.match(engine, /entryEngagedAt/);
  assert.match(engine, /openingDamageScale/);
  assert.match(engine, /environmentKills/);
  assert.match(app, /const \[hudDensityPreference, setHudDensityPreference\] = useState\("auto"\)/);
  assert.match(app, /className="expedition-focus-toggle"/);
  assert.match(app, /role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(app, /event\.type === "playerHit"[\s\S]*triggerTouchFeedback/);
  assert.match(app, /SETTINGS_STORAGE_KEY/);
  assert.match(app, /className="pause-settings-panel"/);
  assert.match(app, /compact=\{hudFocusMode\}/);
  assert.match(app, /직접 공격 명중률/);
  assert.match(app, /자폭·환경/);
  assert.match(screens, /className="character-skill-ladder"/);
  assert.match(screens, /Q E F R 스킬 해금 경로/);
  assert.match(screens, /character-skill-node is-\$\{state\}/);
  assert.match(responsiveStyles, /\.expedition-game\.is-hud-focus \.route-objective/);
  assert.match(responsiveStyles, /\.expedition-game\.is-hud-focus \.route-minimap/);
  assert.match(responsiveStyles, /\.expedition-combat-dock\.is-commercial-compact[\s\S]*grid-template-rows: 56px 84px/);
  assert.match(responsiveStyles, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(responsiveStyles, /\.pause-settings-panel input\[type="range"\]/);
  assert.match(responsiveStyles, /\.home-base-screen \.base-menu-button small \{[\s\S]*white-space: normal/);
});

test("desktop command UI preserves readable hierarchy, clear keyboard affordances, and short-window density", async () => {
  const [app, responsiveStyles] = await Promise.all([
    read("src/App.jsx"),
    read("src/styles/p1-p2.css"),
  ]);

  assert.match(app, /aria-keyshortcuts=\{slot\.key === "SPACE" \? "Space" : slot\.key\}/);
  assert.match(app, /aria-keyshortcuts="T"/);
  assert.match(app, /aria-keyshortcuts="Escape"/);
  assert.match(app, /data-tooltip=\{soundEnabled \? "사운드 끄기" : "사운드 켜기"\}/);
  assert.match(app, /data-tooltip="일시정지 · ESC"/);

  assert.match(responsiveStyles, /@media \(min-width: 901px\) \{/);
  assert.match(responsiveStyles, /\.expedition-hud \{[\s\S]*top: 0;[\s\S]*minmax\(360px, 480px\)/);
  assert.match(responsiveStyles, /\.route-objective \{[\s\S]*width: min\(480px, 100%\);[\s\S]*min-height: 0/);
  assert.match(responsiveStyles, /\.route-objective \.combat-entry-shield \{[\s\S]*grid-column: 2;[\s\S]*font-size: 9px/);
  assert.match(responsiveStyles, /\.expedition-combat-dock \{[\s\S]*bottom: 0;[\s\S]*width: min\(680px, calc\(100% - 420px\)\);[\s\S]*min-width: 410px/);
  assert.match(responsiveStyles, /\.expedition-combat-dock:not\(\.has-tag\) \.combat-dock-abilities \{[\s\S]*repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(responsiveStyles, /\.expedition-combat-dock \.combat-ability-icon kbd \{[\s\S]*inset: 0;[\s\S]*font-size: 15px/);
  assert.match(responsiveStyles, /\.route-minimap \{[\s\S]*top: auto;[\s\S]*right: 0;[\s\S]*bottom: 0/);
  assert.match(responsiveStyles, /\.home-base-screen \.base-menu-button \{[\s\S]*min-height: 68px/);
  assert.match(responsiveStyles, /@media \(min-width: 901px\) and \(max-width: 1199px\) \{[\s\S]*\.route-minimap \{ width: 184px; \}/);
  assert.match(responsiveStyles, /\.region-sortie-command-footer \.region-sortie-launch \{ min-height: 62px; \}/);
  assert.match(responsiveStyles, /\.region-select-screen:not\(\.is-cluster-map\) \.region-card > p \{ font-size: 13px/);
  assert.match(responsiveStyles, /@media \(min-width: 901px\) and \(max-height: 700px\)/);
  assert.match(responsiveStyles, /\.region-select-screen:not\(\.is-cluster-map\) \.region-threat em \{ display: none; \}/);
  assert.match(responsiveStyles, /content: attr\(data-tooltip\)/);
});

test("command menus use compact semantic vector icons and one restrained visual language", async () => {
  const [screens, responsiveStyles] = await Promise.all([
    read("src/ui/campaign/CampaignScreens.jsx"),
    read("src/styles/p1-p2.css"),
  ]);

  assert.doesNotMatch(screens, /MENU_ICON_CELLS/);
  assert.match(screens, /generated-menu-icon is-\$\{icon\}/);
  assert.match(screens, /<FallbackIcon weight="duotone"/);
  assert.match(responsiveStyles, /COMMAND SURFACE SYSTEM V2/);
  assert.match(responsiveStyles, /--command-surface: rgba\(2, 11, 16, 0\.92\)/);
  assert.match(responsiveStyles, /\.campaign-shell \.generated-menu-icon \{[\s\S]*border-radius: 4px;[\s\S]*box-shadow: inset 0 0 0 1px/);
  assert.match(responsiveStyles, /\.campaign-shell \.generated-menu-icon > svg \{ width: 62%; height: 62%; filter: none; \}/);
  assert.match(responsiveStyles, /\.generated-menu-icon:is\(\.is-equipment, \.is-equipmentCurrency\)/);
  assert.match(responsiveStyles, /\.campaign-shell :is\([\s\S]*\.save-slot-card,[\s\S]*\.base-menu-button,[\s\S]*\.facility-upgrade,[\s\S]*\.region-card,[\s\S]*\.defense-stage-card/);
  assert.match(responsiveStyles, /\.campaign-shell \.region-card:hover:not\(:disabled\)[\s\S]*translateY\(-3px\)/);
});

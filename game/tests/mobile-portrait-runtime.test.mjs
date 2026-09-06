import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("portrait touch runtime uses the native viewport, a tactical camera, and deterministic nearest-target auto aim", async () => {
  const [platform, createGame, scene, view] = await Promise.all([
    read("src/platform/mobileRuntime.ts"),
    read("src/phaser/createOverloadGame.ts"),
    read("src/phaser/scenes/OverloadScene.ts"),
    read("src/phaser/view/BattleView.ts"),
  ]);

  assert.match(platform, /touchOptimized = nativeShell \|\| touchPoints > 0 \|\| coarsePointer/);
  assert.match(platform, /autoAim: touchOptimized && portrait/);
  assert.match(createGame, /detectMobileRuntime\(window\)/);
  assert.match(createGame, /initialQuality === "performance" \|\| mobileRuntime\.touchOptimized/);
  assert.match(createGame, /Phaser\.Scale\.RESIZE : Phaser\.Scale\.FIT/);
  assert.match(createGame, /const portraitPresentation = mobileRuntime\.portrait && mobileRuntime\.touchOptimized/);
  assert.match(createGame, /new OverloadScene\([\s\S]*mobileRuntime\.autoAim, portraitPresentation, availableCharacterIds\)/);
  assert.match(scene, /private readonly mobileAutoAim: boolean/);
  assert.match(scene, /private readonly portraitPresentation: boolean/);
  assert.match(scene, /new BattleView\(this, this\.state\.regionId, this\.portraitPresentation\)/);
  assert.match(view, /resolvePortraitBossCameraFocus/);
  assert.match(view, /const safeWidth = Math\.max\(1, finite\(viewportWidth, WIDTH\) \* 0\.82\)/);
  assert.match(view, /const safeHeight = Math\.max\(1, finite\(viewportHeight, HEIGHT\) \* \(mechanicActive \? 0\.6 : 0\.68\)\)/);
  assert.match(view, /zoom: clamp\(fittedZoom, 0\.24, 0\.72\)/);
  assert.match(view, /portraitBossFocus\?\.mechanicActive/);
  assert.match(view, /const portraitMechanicScale = this\.portraitPresentation \? 1\.35 : 1/);
  assert.match(scene, /const tapRadius = Math\.max\(64, finiteNumber\(bomb\?\.radius, 66\) \* camera\.zoom \+ 26\)/);
  assert.match(scene, /const mobilePatternInput = this\.portraitPresentation/);
  assert.match(scene, /enemy\.dead \|\| enemy\.hp <= 0 \|\| enemy\.spawnDelay > 0/);
  assert.match(scene, /distanceSq = \(enemy\.x - player\.x\) \*\* 2 \+ \(enemy\.y - player\.y\) \*\* 2/);
  assert.match(scene, /if \(target\) setSwarmAim\(this\.state, target\.x, target\.y\)/);
});

test("portrait combat owns the full safe viewport and exposes a touch-anywhere floating joystick", async () => {
  const [app, styles, html, tacticalStyles] = await Promise.all([
    read("src/App.jsx"),
    read("src/styles.css"),
    read("index.html"),
    read("src/styles/tactical-os.css"),
  ]);
  const activeRuntime = app.slice(app.indexOf("function PhaserArenaScreen"), app.indexOf("function ResultScreen"));

  assert.doesNotMatch(activeRuntime, /needsLandscape|landscape-guard|가로 모드로 회전/);
  assert.match(app, /const FLOATING_JOYSTICK_BLOCKED_SELECTOR/);
  assert.match(app, /const radius = 58/);
  assert.match(app, /const deadzone = 0\.12/);
  assert.match(app, /surface\.setPointerCapture\?\.\(event\.pointerId\)/);
  assert.match(app, /onMove\(unitX \* activeMagnitude, unitY \* activeMagnitude, event\)/);
  assert.match(app, /disabled=\{mobileBossPatternActive\}/);
  assert.match(app, /onPointerDown=\{\(event\) => \{[\s\S]*controllerRef\.current\?\.parry\?\.\(\)/);
  assert.match(app, /빈 곳을 누른 채 드래그해 이동 · 가까운 적 자동 조준/);
  assert.match(html, /viewport-fit=cover/);
  assert.match(styles, /\.expedition-canvas-frame \{[\s\S]*touch-action: none;[\s\S]*overscroll-behavior: none/);

  const portrait = styles.slice(styles.indexOf("/* Portrait-mobile shell"));
  assert.match(portrait, /\.expedition-canvas-frame \{[\s\S]*width: 100vw;[\s\S]*height: 100dvh/);
  assert.match(portrait, /\.expedition-combat-dock \{[\s\S]*bottom: max\(8px, env\(safe-area-inset-bottom\)\)/);
  assert.match(tacticalStyles, /MOBILE SINGLE-VIEW COMMAND CONTRACT/);
  assert.match(tacticalStyles, /MOBILE BOSS PATTERN MODE/);
  assert.match(tacticalStyles, /\.expedition-game\.is-mobile-boss-pattern \.route-minimap/);
  assert.match(tacticalStyles, /\.expedition-game \.boss-parry-prompt \{[\s\S]*min-height: 72px/);
  assert.match(tacticalStyles, /\.reward-backdrop \.reward-options \{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(portrait, /\.narrative-panel > button \{ min-height: 50px/);
  assert.match(portrait, /\.region-sortie-command-footer \.region-sortie-launch \{ width: 100%; min-height: 62px/);
  assert.match(portrait, /Portrait-mobile interface v3/);
  assert.match(portrait, /\.intro-minimal-content h1 \{[\s\S]*font-size: clamp\(58px, 17\.5vw, 76px\)/);
  assert.match(portrait, /\.save-slot-grid \{[\s\S]*grid-template-columns: 1fr/);
  assert.match(portrait, /\.region-select-screen:not\(\.is-cluster-map\) \.region-card-grid \{[\s\S]*grid-template-columns: repeat\(3, 88vw\);[\s\S]*scroll-snap-type: x mandatory/);
  assert.match(portrait, /\.combat-ability-copy \{ display: flex/);
  assert.match(portrait, /\.intro-minimal-controls \{ display: none; \}/);
  assert.match(portrait, /\.intro-mobile-controls \{[\s\S]*display: grid;[\s\S]*min-height: 48px/);
  assert.match(portrait, /\.region-mobile-swipe-hint \{[\s\S]*display: flex;[\s\S]*min-height: 42px/);
  assert.match(portrait, /\.base-defense-action \{ grid-column: 1 \/ -1; \}/);
  assert.match(portrait, /\.base-sortie-action > svg:last-child,[\s\S]*display: none/);
  assert.match(portrait, /\.base-primary-actions b,[\s\S]*white-space: nowrap; word-break: keep-all/);
  assert.match(portrait, /\.region-select-screen \.region-select-heading h1 \{[\s\S]*word-break: keep-all/);
  assert.match(portrait, /\.region-select-screen \.region-select-heading h1 > span \{ white-space: nowrap; \}/);
  assert.match(portrait, /\.region-sortie-briefing \.region-sortie-intel \{ grid-template-columns: 1fr/);
  assert.match(portrait, /\.sortie-character-options \{ grid-template-columns: 1fr; \}/);
  assert.match(portrait, /\.region-sortie-layout \.sortie-weapon-card div em \{ display: none; \}/);
  assert.match(portrait, /\.region-sortie-command-footer \{[\s\S]*display: block/);
  assert.match(portrait, /\.region-sortie-command-footer > span \{ display: none; \}/);
  assert.match(portrait, /\.region-sortie-dialog \{ position: fixed;[\s\S]*margin-left: 0/);
  assert.match(portrait, /\.region-mobile-swipe-hint \{[\s\S]*min-width: 210px;[\s\S]*white-space: nowrap/);
  assert.match(portrait, /\.expedition-pause-toggle \{ width: 48px; height: 48px; \}/);
  assert.match(portrait, /\.expedition-pause-card button \{[\s\S]*min-height: 56px;[\s\S]*font-size: 14px/);
  assert.match(portrait, /Ability guide: portrait-phone command deck/);
  assert.match(portrait, /\.ability-guide-rhea \{[\s\S]*right: 6px;[\s\S]*left: 6px;[\s\S]*height: 88px/);
  assert.match(portrait, /\.ability-guide-console \{[\s\S]*right: 6px;[\s\S]*left: 6px;[\s\S]*width: auto;[\s\S]*grid-template-rows: auto auto auto minmax\(0, 1fr\) auto/);
  assert.match(portrait, /\.ability-guide-tabs button \{[\s\S]*min-height: 66px;[\s\S]*grid-template-columns: 1fr/);
  assert.match(portrait, /\.ability-guide-detail \{[\s\S]*display: block;[\s\S]*overflow-y: auto/);
  assert.match(portrait, /\.ability-guide-example \{[\s\S]*width: 100%;[\s\S]*height: clamp\(156px, 25dvh, 205px\)/);
  assert.match(portrait, /\.ability-guide-actions > button \{[\s\S]*min-height: 48px;[\s\S]*white-space: nowrap;[\s\S]*word-break: keep-all/);
  assert.match(portrait, /\.ability-guide-actions > button:not\(\.ability-guide-next\) \{ min-width: 64px/);
  assert.match(portrait, /Mobile app UI v4/);
  assert.match(tacticalStyles, /\.home-base-screen \.base-lobby-topbar \{[\s\S]*grid-template-columns: minmax\(0, 1fr\) 48px/);
  assert.match(tacticalStyles, /--mobile-lobby-header-height: 120px/);
  assert.match(tacticalStyles, /\.campaign-shell\.home-base-screen \.home-base-surface \{[\s\S]*height: 100%;[\s\S]*min-height: 0;[\s\S]*overflow: hidden/);
  assert.match(tacticalStyles, /\.home-base-screen \.base-motion-portrait,[\s\S]*top: var\(--mobile-lobby-header-height\)/);
  assert.match(tacticalStyles, /\.home-base-screen \.base-currency-rail \{[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(tacticalStyles, /\.home-base-screen \.base-lobby-navigation \{[\s\S]*overflow: visible;[\s\S]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(tacticalStyles, /\.home-base-screen \.base-primary-actions > \.base-defense-action \{[\s\S]*min-height: 48px;[\s\S]*grid-column: 1 \/ -1/);
  assert.match(tacticalStyles, /\.reward-backdrop \.reward-card \{[\s\S]*display: flex;[\s\S]*grid-template: none/);
  assert.match(tacticalStyles, /\.reward-backdrop \.reward-art \{[\s\S]*position: relative;[\s\S]*top: auto;[\s\S]*grid-column: auto/);
  assert.match(portrait, /\.campaign-shell \.base-facility-panel:not\(\.facility-augmentation\) \{[\s\S]*position: fixed;[\s\S]*overflow-y: auto;[\s\S]*grid-template-columns: 1fr/);
  assert.match(portrait, /\.campaign-shell \.character-information-panel \{[\s\S]*grid-template-columns: 1fr;[\s\S]*grid-template-rows: 56px minmax\(250px, 39dvh\) 68px minmax\(0, 1fr\)/);
  assert.match(portrait, /\.campaign-shell \.character-data-console \{[\s\S]*min-height: 0;[\s\S]*grid-row: 4/);
  assert.match(portrait, /\.campaign-shell \.character-active-kit > div \{[\s\S]*grid-template-columns: repeat\(2/);
  assert.match(portrait, /\.defense-command-dock \{[\s\S]*min-height: 224px;[\s\S]*grid-template-rows: 42px minmax\(0, 1fr\) 58px/);
  assert.match(portrait, /\.defense-tower-palette \{ grid-template-columns: repeat\(2/);
  assert.match(portrait, /\.defense-guide-copy p \{ font-size: 14px/);
  assert.match(portrait, /@media \(max-width: 360px\) and \(orientation: portrait\) \{[\s\S]*\.defense-command-dock > header \{[\s\S]*flex-direction: column;[\s\S]*align-items: flex-start/);
  assert.match(app, /aria-label="모바일 게임 조작"/);
  assert.match(app, /className="expedition-pause-toggle"[\s\S]*aria-label="전투 일시정지"/);
});

test("short fine-pointer desktop windows keep desktop typography instead of phone compaction", async () => {
  const styles = await read("src/styles.css");
  const desktopGuard = styles.slice(styles.indexOf("/* Fine-pointer desktop guard"));

  assert.match(desktopGuard, /@media \(min-width: 981px\) and \(max-height: 640px\) and \(pointer: fine\)/);
  assert.match(desktopGuard, /\.campaign-shell\.campaign-shell p,[\s\S]*font-size: max\(11px, 0\.72rem\)/);
  assert.match(desktopGuard, /\.campaign-back \{ min-height: 38px/);
  assert.match(desktopGuard, /\.region-sortie-close \{ min-height: 36px; font-size: 11px/);
});

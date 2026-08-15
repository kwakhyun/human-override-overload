import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("portrait touch runtime uses ENVELOP presentation, a closer camera, and deterministic nearest-target auto aim", async () => {
  const [platform, createGame, scene, view] = await Promise.all([
    read("src/platform/mobileRuntime.ts"),
    read("src/phaser/createOverloadGame.ts"),
    read("src/phaser/scenes/OverloadScene.ts"),
    read("src/phaser/view/BattleView.ts"),
  ]);

  assert.match(platform, /touchOptimized = nativeShell \|\| touchPoints > 0 \|\| coarsePointer/);
  assert.match(platform, /autoAim: touchOptimized && portrait/);
  assert.match(createGame, /detectMobileRuntime\(window\)/);
  assert.match(createGame, /Phaser\.Scale\.ENVELOP : Phaser\.Scale\.FIT/);
  assert.match(createGame, /const portraitPresentation = mobileRuntime\.portrait && mobileRuntime\.touchOptimized/);
  assert.match(createGame, /new OverloadScene\([\s\S]*mobileRuntime\.autoAim, portraitPresentation\)/);
  assert.match(scene, /private readonly mobileAutoAim: boolean/);
  assert.match(scene, /private readonly portraitPresentation: boolean/);
  assert.match(scene, /new BattleView\(this, this\.state\.regionId, this\.portraitPresentation\)/);
  assert.match(view, /const portraitZoom = this\.portraitPresentation \? \(bossStageActive \? 1\.06 : 1\.12\) : 1/);
  assert.match(scene, /enemy\.dead \|\| enemy\.hp <= 0 \|\| enemy\.spawnDelay > 0/);
  assert.match(scene, /distanceSq = \(enemy\.x - player\.x\) \*\* 2 \+ \(enemy\.y - player\.y\) \*\* 2/);
  assert.match(scene, /if \(target\) setSwarmAim\(this\.state, target\.x, target\.y\)/);
});

test("portrait combat owns the full safe viewport and exposes a touch-anywhere floating joystick", async () => {
  const [app, styles, html] = await Promise.all([read("src/App.jsx"), read("src/styles.css"), read("index.html")]);
  const activeRuntime = app.slice(app.indexOf("function PhaserArenaScreen"), app.indexOf("function ResultScreen"));

  assert.doesNotMatch(activeRuntime, /needsLandscape|landscape-guard|가로 모드로 회전/);
  assert.match(app, /const FLOATING_JOYSTICK_BLOCKED_SELECTOR/);
  assert.match(app, /const radius = 58/);
  assert.match(app, /const deadzone = 0\.12/);
  assert.match(app, /surface\.setPointerCapture\?\.\(event\.pointerId\)/);
  assert.match(app, /onMove\(unitX \* activeMagnitude, unitY \* activeMagnitude, event\)/);
  assert.match(app, /빈 곳을 누른 채 드래그해 이동 · 가까운 적 자동 조준/);
  assert.match(html, /viewport-fit=cover/);
  assert.match(styles, /\.expedition-canvas-frame \{[\s\S]*touch-action: none;[\s\S]*overscroll-behavior: none/);

  const portrait = styles.slice(styles.indexOf("/* Portrait-mobile shell"));
  assert.match(portrait, /\.expedition-canvas-frame \{[\s\S]*width: 100vw;[\s\S]*height: 100dvh/);
  assert.match(portrait, /\.expedition-combat-dock \{[\s\S]*bottom: max\(8px, env\(safe-area-inset-bottom\)\)/);
  assert.match(portrait, /\.reward-options \{ grid-template-columns: 1fr/);
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
  assert.match(portrait, /\.expedition-pause-toggle \{ width: 48px; height: 48px; \}/);
  assert.match(portrait, /\.expedition-pause-card button \{[\s\S]*min-height: 56px;[\s\S]*font-size: 14px/);
  assert.match(app, /aria-label="모바일 게임 조작"/);
  assert.match(app, /className="expedition-pause-toggle"[\s\S]*aria-label="전투 일시정지"/);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const readBytes = (path) => readFile(new URL(`../${path}`, import.meta.url));

test("the title screen is a full-bleed user key art composition with only essential actions", async () => {
  const app = await read("src/App.jsx");
  const engine = await read("src/swarm/engine.js");
  const manifest = await read("src/game/assets/manifest.ts");
  const styles = await read("src/styles.css");
  const intro = app.slice(app.indexOf("function IntroScreen"), app.indexOf("function ProgressHud"));
  assert.match(manifest, /intro: "\.\/assets\/overload\/intro\/start-screen-key-art\.webp"/);
  assert.match(intro, /className="intro-key-art"/);
  assert.match(intro, /className="intro-minimal-content"/);
  assert.match(intro, /<span>HUMAN<\/span><em>OVERRIDE<\/em><b>OVERLOAD<\/b>/);
  assert.doesNotMatch(intro, /TRAIN ME|>WRONG</);
  assert.match(intro, /게임 시작/);
  assert.match(intro, /세계를 지배한 초지능 AI의 기계 군단/);
  assert.match(engine, /const FIRST_REGION_ENEMY_BUDGET = 300/);
  assert.doesNotMatch(intro, /1,000기/);
  assert.doesNotMatch(intro, /overload-loop|threat-counter|overload-visual|intro-header|intro-footer/);
  assert.match(styles, /\.intro-key-art\s*\{[^}]*object-fit: cover/s);
  assert.match(styles, /\.intro-minimal-content\s*\{/);
});

test("the active App mounts the Phaser runtime while React owns the DOM HUD", async () => {
  const app = await read("src/App.jsx");
  const activeRuntime = app.slice(app.indexOf("function PhaserArenaScreen"), app.indexOf("function ResultScreen"));
  assert.match(app, /createOverloadGame/);
  assert.match(app, /void import\("\.\/phaser\/createOverloadGame\.ts"\)/);
  assert.match(app, /content = \(\s*<div className=\{`combat-runtime-shell[\s\S]*?<PhaserArenaScreen/);
  assert.match(activeRuntime, /className="game-canvas phaser-host"/);
  assert.match(activeRuntime, /className="expedition-hud"/);
  assert.match(activeRuntime, /<RouteMinimap hud=\{hud\}/);
  assert.match(activeRuntime, /<NarrativePanel/);
  assert.match(activeRuntime, /<GateLockedNotice notice=\{hud\?\.expedition\?\.gateNotice\}/);
  assert.match(activeRuntime, /<RouteClearTransition transition=\{hud\?\.expedition\?\.clearTransition\}/);
  assert.match(activeRuntime, /event\.type === "bossAutoTransition" && !autoBossEntryHandledRef\.current/);
  assert.match(activeRuntime, /controller\?\.enterBossRoom\(\)/);
  assert.doesNotMatch(activeRuntime, /<BossGateOverlay/);
  assert.match(activeRuntime, /className="landscape-guard"/);
  assert.match(activeRuntime, /setSuspended/);
  assert.match(activeRuntime, /<LevelUpOverlay/);
  assert.doesNotMatch(activeRuntime, /overload-command-rail|<ProgressHud/);
});

test("dialogue crops the hero to a bust and mobile play is guarded for landscape", async () => {
  const app = await read("src/App.jsx");
  const styles = await read("src/styles.css");
  const scene = await read("src/phaser/scenes/OverloadScene.ts");
  assert.match(app, /className=\{`narrative-portrait is-\$\{portrait\.variant\}`\}/);
  assert.match(app, /orientation: portrait/);
  assert.match(styles, /\.narrative-portrait\s*\{[^}]*overflow: hidden/s);
  assert.match(styles, /\.narrative-portrait img\s*\{[^}]*width: 166%/s);
  assert.match(styles, /\.landscape-guard\s*\{/);
  assert.match(scene, /externallySuspended/);
});

test("the active silver AEGIS motion sheet uses the authored 8 by 9 runtime geometry", async () => {
  const manifest = await read("src/game/assets/manifest.ts");
  const view = await read("src/phaser/view/BattleView.ts");
  const atlas = await readBytes("public/assets/overload/hero/survivor-motion-atlas-v2.png");
  assert.equal(atlas.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(atlas.readUInt32BE(16), 1536);
  assert.equal(atlas.readUInt32BE(20), 1728);
  assert.equal(atlas.readUInt32BE(16) / 8, 192);
  assert.equal(atlas.readUInt32BE(20) / 9, 192);
  assert.match(manifest, /survivor-motion-atlas-v2\.png", kind: "motion", columns: 8, rows: 9/);
  assert.match(view, /this\.prepareAtlas\(ASSET_KEYS\.playerMotion, 8, 9\)/);
  assert.match(view, /sampleActorAnimation\("hero", entity, clipElapsed\)/);
});

test("Phaser is pinned and the production build performs TypeScript validation", async () => {
  const pkg = JSON.parse(await read("package.json"));
  assert.equal(pkg.dependencies.phaser, "4.2.1");
  assert.equal(pkg.devDependencies.typescript, "5.9.3");
  assert.match(pkg.scripts.build, /npm run typecheck/);
  assert.equal(pkg.scripts.typecheck, "tsc --noEmit");
});

test("the Phaser scene keeps gameplay rules behind the deterministic simulation boundary", async () => {
  const scene = await read("src/phaser/scenes/OverloadScene.ts");
  assert.match(scene, /createSwarmState/);
  assert.match(scene, /stepSwarm/);
  assert.match(scene, /const FIXED_STEP = 1 \/ 60/);
  assert.match(scene, /camera\.getWorldPoint\(pointer\.x, pointer\.y\)/);
  assert.doesNotMatch(scene, /renderSwarm/);
});

test("adaptive low-end pacing lowers only presentation work and recovers cleanly", async () => {
  const performance = await read("src/swarm/performance.js");
  const policy = await read("src/phaser/performance/adaptiveRenderPolicy.ts");
  const scene = await read("src/phaser/scenes/OverloadScene.ts");
  assert.match(performance, /renderScale: 0\.7/);
  assert.match(performance, /renderFps: 30/);
  assert.match(performance, /hardwareConcurrency/);
  assert.match(performance, /deviceMemory/);
  assert.match(performance, /prefers-reduced-motion: reduce/);
  assert.match(performance, /slowPressure >= 18/);
  assert.match(performance, /fastFrames >= 600/);
  assert.match(policy, /canvas\.width = backingWidth/);
  assert.match(policy, /drawingContext\.width = LOGICAL_WIDTH/);
  assert.match(policy, /drawingContext\.state\.viewport = \[0, 0, backingWidth, backingHeight\]/);
  assert.match(policy, /loop\.targetFps = nextFps/);
  assert.match(policy, /queueMicrotask/);
  assert.match(scene, /const FIXED_STEP = 1 \/ 60/);
  assert.match(scene, /applyAdaptiveRenderPolicy\(this\.game, this\.governor\.preset\)/);
  assert.match(scene, /Phaser\.Core\.Events\.PAUSE/);
  assert.match(scene, /Phaser\.Core\.Events\.RESUME/);
  assert.match(scene, /Phaser\.Renderer\.Events\.LOSE_WEBGL/);
  assert.match(scene, /Phaser\.Renderer\.Events\.RESTORE_WEBGL/);
  assert.match(scene, /this\.accumulator = 0/);
  assert.match(scene, /clearPressedInput\(this\.gameInput\)/);
});

test("the gameplay camera keeps AEGIS centered in both route and boss stages", async () => {
  const engine = await read("src/swarm/engine.js");
  assert.match(engine, /const targetZoom = state\.phase === "boss" \? 0\.78/);
  assert.match(engine, /camera\.x = player\.x/);
  assert.match(engine, /camera\.y = player\.y/);
  assert.doesNotMatch(engine, /bossFocus/);
});

test("the Phaser view crossfades authored sectors and keeps engine-owned boss collision geometry", async () => {
  const view = await read("src/phaser/view/BattleView.ts");
  assert.match(view, /add\.tileSprite/);
  assert.match(view, /ASSET_KEYS\.sector1/);
  assert.match(view, /ASSET_KEYS\.sector2/);
  assert.match(view, /ASSET_KEYS\.sector3/);
  assert.match(view, /ASSET_KEYS\.bossRoom/);
  assert.match(view, /setTilePosition/);
  assert.doesNotMatch(view, /overload-minimap|drawMinimap/);
  assert.match(view, /overload-overlay/);
  assert.match(view, /geometry\.collisionHalfWidth/);
  assert.match(view, /geometry\.collisionRadius/);
  assert.match(view, /ASSET_KEYS\.bossForms/);
  assert.match(view, /const bossMapTexture = scene\.textures\.exists\(regionAssets\.bossRoom\)/);
  assert.match(view, /activateBossAssets\(\)/);
  assert.match(view, /this\.bossMap\.setTexture\(bossRoom\)/);
  assert.match(view, /\.setDisplaySize\(WORLD_WIDTH, WORLD_HEIGHT\)/);
  const cameraSync = view.slice(view.indexOf("syncCamera(state"), view.indexOf("private syncPlayer"));
  assert.doesNotMatch(cameraSync, /setTilePosition/, "static TileSprite offsets must not be reassigned every frame");
});

test("unified art and renderer-local impact effects replace legacy combat sprites", async () => {
  const manifest = await read("src/game/assets/manifest.ts");
  const view = await read("src/phaser/view/BattleView.ts");
  assert.match(manifest, /assets\/overload\/enemies\/motion-v2\/suicide-drone-motion-atlas\.png/);
  assert.match(manifest, /assets\/overload\/enemies\/motion-v2\/rifleman-motion-atlas\.png/);
  assert.match(manifest, /assets\/overload\/enemies\/motion-v2\/sniper-motion-atlas\.png/);
  assert.match(manifest, /assets\/overload\/allies\/motion-v2\/hunter-drone-motion-atlas\.png/);
  assert.match(manifest, /assets\/overload\/allies\/rook\.png/);
  assert.match(manifest, /assets\/overload\/boss\/wrong-engine-forms-atlas\.png/);
  assert.match(manifest, /assets\/overload\/vfx\/combat-fx-atlas\.png/);
  assert.match(manifest, /assets\/overload\/vfx\/pixel\/automatic-skill-pixel-atlas\.png/);
  assert.match(manifest, /assets\/overload\/vfx\/gates\/sovereign-gate-motion-atlas\.png/);
  assert.doesNotMatch(manifest, /assets\/survivor\/animation|assets\/survivor\/bosses|assets\/survivor\/skills/);
  assert.match(view, /type ViewFxKind/);
  assert.match(view, /spawnFx\("enemyBurst"/);
  assert.match(view, /spawnFx\("bossBurst"/);
  assert.match(view, /drawImpactFx/);
  assert.match(view, /projectileSprites/);
  assert.match(view, /muzzleFlash/);
  assert.match(view, /syncUltimateFx/);
  assert.match(view, /syncSpawnGates/);
});

test("PERFORMANCE rendering culls invisible work without dropping authoritative warnings", async () => {
  const view = await read("src/phaser/view/BattleView.ts");
  const render = view.slice(view.indexOf("render(state"), view.indexOf("private syncTraceProps"));
  const enemies = view.slice(view.indexOf("private syncEnemies"), view.indexOf("private syncAllies"));
  const projectiles = view.slice(view.indexOf("private drawProjectiles"), view.indexOf("private spawnFx"));
  const foreground = view.slice(view.indexOf("private drawForeground"), view.indexOf("private drawExpeditionMarkers"));
  const gates = view.slice(view.indexOf("private syncSpawnGates"), view.indexOf("private drawProjectiles"));
  const impacts = view.slice(view.indexOf("private drawImpactFx"), view.indexOf("private drawForeground"));
  assert.match(view, /private isCircleVisible/);
  assert.match(view, /private isSegmentVisible/);
  assert.match(view, /if \(image\.frame\.name !== name\) image\.setFrame\(name\)/);
  assert.match(render, /this\.drawTelegraphs\(state, time, quality\)/);
  assert.match(render, /Math\.floor\(this\.scene\.time\.now \/ \(1000 \/ 30\)\)/);
  assert.ok(render.indexOf("drawTelegraphs") < render.indexOf("cosmeticTick"), "danger warnings stay at the scene cadence");
  assert.match(enemies, /if \(!inView\)/);
  assert.match(enemies, /for \(let index = 0; index < enemies\.length; index \+= 1\)/);
  assert.doesNotMatch(enemies, /strideBucket|dangerPriority/);
  assert.doesNotMatch(enemies, /quality\.id === "performance"[^\n]*(?:continue|slice|filter)/);
  assert.doesNotMatch(enemies, /new Set/);
  assert.match(projectiles, /this\.isCircleVisible\(x, y/);
  assert.match(projectiles, /const enemySpriteCap = 360/);
  assert.doesNotMatch(projectiles, /enemyStride|visibleOrdinaryProjectile/);
  assert.match(gates, /const cap = 10/);
  assert.doesNotMatch(gates, /quality\.id === "performance"/);
  assert.doesNotMatch(foreground, /\[\.\.\.\(state\?\.beams/);
  assert.match(view, /quality\.id === "performance" \? 18/);
  assert.match(view, /const shadowStride = this\.visibleEnemyCount > 120 \? 3/);
  assert.match(projectiles, /const spriteCap = quality\.id === "performance" \? 180/);
  assert.match(impacts, /if \(enemyExplosion\) continue/);
  assert.ok(
    impacts.indexOf("if (enemyExplosion) continue") < impacts.indexOf("graphics.fillStyle(COLORS.white"),
    "pixel enemy deaths must skip the legacy procedural rings and rays",
  );
  assert.match(view, /const ghostCount = quality\.id === "performance" \? 1/);
  assert.match(view, /state\?\.aegisWards/);
  assert.match(view, /geometry\.collisionHalfWidth/);
  assert.match(view, /geometry\.collisionRadius/);
});

test("authored trace props and campaign region art are registered without restoring primitive remains", async () => {
  const manifest = await read("src/game/assets/manifest.ts");
  const view = await read("src/phaser/view/BattleView.ts");
  const traceAtlas = await readBytes("public/assets/overload/campaign/squad-traces-atlas.png");
  assert.equal(traceAtlas.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(traceAtlas.readUInt32BE(16), 1152);
  assert.equal(traceAtlas.readUInt32BE(20), 384);
  assert.match(manifest, /squad-traces-atlas\.png", kind: "atlas", columns: 3, rows: 1/);
  assert.match(manifest, /havenBase: "\.\/assets\/overload\/campaign\/haven-09-base\.webp"/);
  assert.match(manifest, /havenNpcPortraits: "\.\/assets\/overload\/ui\/npcs\/haven-npc-portraits-atlas\.png"/);
  assert.match(manifest, /airshipRegionMap: "\.\/assets\/overload\/campaign\/airship-region-map-v2\.webp"/);
  assert.match(manifest, /commandButtonStates: "\.\/assets\/overload\/ui\/buttons\/command-button-states-atlas\.png"/);
  for (const path of [
    "regions/glass-dune/route.webp",
    "regions/glass-dune/boss-room.webp",
    "regions/glass-dune/boss-forms-atlas.png",
    "regions/abyssal-archive/route.webp",
    "regions/abyssal-archive/boss-room.webp",
    "regions/abyssal-archive/boss-forms-atlas.png",
  ]) assert.match(manifest, new RegExp(path.replaceAll(".", "\\.")));
  assert.match(view, /traceSprites = new Map<string, Phaser\.GameObjects\.Image>/);
  assert.match(view, /scene\.textures\.exists\(ASSET_KEYS\.squadTraces\)/);
  assert.match(view, /\["rook", "nyx", "moss"\]\.forEach/);
  assert.match(view, /const x = originX \+ finite\(trace\.distance\)/);
  assert.match(view, /this\.worldBack\.add\(image\)/);
  assert.doesNotMatch(view, /trace\.kind === "body"|trace\.kind === "weapon"/);
});

test("Phaser launch options select region-specific routes, boss rooms, forms, and story beats", async () => {
  const createGame = await read("src/phaser/createOverloadGame.ts");
  const scene = await read("src/phaser/scenes/OverloadScene.ts");
  const view = await read("src/phaser/view/BattleView.ts");
  assert.match(createGame, /type OverloadLaunchOptions/);
  assert.match(createGame, /launch: OverloadLaunchOptions = \{\}/);
  assert.match(createGame, /const regionId = resolveRegionId\(launch\.regionId\)/);
  assert.match(createGame, /new BootScene\(regionId, assetProfile, callbacks\.onLoadProgress\)/);
  assert.match(createGame, /new OverloadScene\(bridge, regionId, launch\.combatBonuses, assetProfile\)/);
  assert.match(scene, /createSwarmState\(\{ duration: 360, expedition: true, regionId: this\.regionId, combatBonuses: this\.combatBonuses \}\)/);
  assert.match(scene, /new BattleView\(this, this\.state\.regionId\)/);
  assert.match(scene, /beat: game\.storyBeats\.victory/);
  for (const key of [
    "glassDuneRoute",
    "glassDuneBossRoom",
    "glassDuneBossForms",
    "glassDuneBossMotion",
    "abyssalArchiveRoute",
    "abyssalArchiveBossRoom",
    "abyssalArchiveBossForms",
    "abyssalArchiveBossMotion",
  ]) assert.match(view, new RegExp(`ASSET_KEYS\\.${key}`));
  assert.match(view, /activateBossAssets\(\)/);
  assert.match(view, /this\.bossMap\.setTexture\(bossRoom\)/);
  assert.match(view, /this\.boss\.setTexture\(bossTexture\)/);
  assert.match(view, /const bossTextureReady = this\.boss\.texture\.key === this\.regionAssets\.bossMotion/);
  assert.match(view, /\|\| this\.boss\.texture\.key === this\.regionAssets\.bossForms/);
  assert.match(view, /const bossMapIndex = this\.routeMapCount/);
  assert.doesNotMatch(view, /scene\.add\.image\(0, 0, ASSET_KEYS\.bossForms\)/);
});

test("BootScene registers common assets plus only the selected region with a safe fallback", async () => {
  const manifest = await import(new URL("../src/game/assets/manifest.ts", import.meta.url));
  const boot = await read("src/phaser/scenes/BootScene.ts");
  const createGame = await read("src/phaser/createOverloadGame.ts");
  const paths = (regionId) => manifest.getGameAssetsForRegion(regionId).map((asset) => asset.path);
  const glass = paths("glass-dune");
  assert.ok(glass.includes("./assets/overload/hero/survivor-motion-atlas-v2.png"));
  assert.ok(glass.includes("./assets/overload/regions/glass-dune/route.webp"));
  assert.ok(!glass.includes("./assets/overload/regions/glass-dune/boss-room.webp"));
  assert.ok(!glass.includes("./assets/overload/regions/glass-dune/boss-forms-atlas.png"));
  const glassBoss = manifest.getBossGameAssetsForRegion("glass-dune").map((asset) => asset.path);
  assert.deepEqual(glassBoss, [
    "./assets/overload/regions/glass-dune/boss-room.webp",
    "./assets/overload/regions/glass-dune/boss-forms-atlas.png",
    "./assets/overload/regions/glass-dune/motion-v2/mirror-tyrant-motion-atlas.png",
    "./assets/overload/vfx/pixel/boss-pattern-common-pixel-atlas.png",
    "./assets/overload/vfx/pixel/boss-pattern-regional-pixel-atlas.png",
    "./assets/overload/vfx/pixel/timed-bomb-pixel-atlas.png",
  ]);
  assert.ok(!glass.some((path) => path.includes("abyssal-archive")));
  assert.ok(!glass.some((path) => path.includes("sector-01-shattered-approach")));
  assert.ok(!glass.some((path) => path.includes("squad-traces-atlas")));
  const fallback = paths("not-a-region");
  assert.ok(fallback.some((path) => path.includes("sector-01-shattered-approach")));
  assert.ok(!fallback.some((path) => path.includes("wrong-engine-forms-atlas")));
  assert.ok(!fallback.some((path) => path.includes("glass-dune")));
  assert.equal(manifest.resolveRegionId("not-a-region"), "wrong-engine-core");
  assert.match(boot, /getGameAssetsForRegion\(this\.regionId, this\.assetProfile\)/);
  assert.doesNotMatch(boot, /GAME_ASSETS/);
  assert.match(createGame, /const regionId = resolveRegionId\(launch\.regionId\)/);
});

test("Vite keeps Phaser, runtime, view, and simulation in explicit non-overlapping chunks", async () => {
  const vite = await read("vite.config.mjs");
  assert.match(vite, /phaser-vendor/);
  assert.match(vite, /overload-assets/);
  assert.match(vite, /overload-runtime/);
  assert.match(vite, /overload-view/);
  assert.match(vite, /overload-simulation/);
  assert.match(vite, /output: \{ manualChunks \}/);
});

test("player skills use low-resolution pixel atlases while healing kits and gates keep dedicated art", async () => {
  const manifest = await read("src/game/assets/manifest.ts");
  const view = await read("src/phaser/view/BattleView.ts");
  const manualAtlas = await readBytes("public/assets/overload/vfx/pixel/manual-ability-pixel-atlas.png");
  const automaticAtlas = await readBytes("public/assets/overload/vfx/pixel/automatic-skill-pixel-atlas.png");
  const gateAtlas = await readBytes("public/assets/overload/vfx/gates/sovereign-gate-motion-atlas.png");
  const healingAtlas = await readBytes("public/assets/overload/items/healing-kit-motion-atlas.png");
  assert.equal(manualAtlas.subarray(1, 4).toString("ascii"), "PNG");
  assert.deepEqual([manualAtlas.readUInt32BE(16), manualAtlas.readUInt32BE(20)], [384, 256]);
  assert.deepEqual([automaticAtlas.readUInt32BE(16), automaticAtlas.readUInt32BE(20)], [384, 256]);
  assert.deepEqual([gateAtlas.readUInt32BE(16), gateAtlas.readUInt32BE(20)], [1152, 192]);
  assert.equal(healingAtlas.readUInt32BE(16), 768);
  assert.equal(healingAtlas.readUInt32BE(20), 192);
  assert.match(manifest, /manual-ability-pixel-atlas\.png", kind: "atlas", columns: 6, rows: 4/);
  assert.match(manifest, /automatic-skill-pixel-atlas\.png", kind: "atlas", columns: 6, rows: 4/);
  assert.match(manifest, /sovereign-gate-motion-atlas\.png", kind: "atlas", columns: 6, rows: 1/);
  assert.match(manifest, /healing-kit-motion-atlas\.png", kind: "atlas", columns: 4, rows: 1/);
  assert.match(view, /preparePixelAtlas\(ASSET_KEYS\.automaticSkillPixel, 6, 4\)/);
  assert.match(view, /preparePixelAtlas\(ASSET_KEYS\.manualAbilityPixel, 6, 4\)/);
  assert.match(view, /setFilter\(Phaser\.Textures\.FilterMode\.NEAREST\)/);
  assert.match(view, /syncOmegaLaserFx/);
  assert.match(view, /setAtlasFrame\(segment, 2 \+ \(\(Math\.floor\(time \* 12\) \+ index\) % 2\), 3\)/);
  assert.match(view, /setDisplaySize\(pixelSize, pixelSize\)/);
  assert.match(view, /getOmegaLaserSprite/);
  assert.match(view, /syncHealingKitFx/);
  assert.match(view, /const items = state\?\.telegraphs \?\? \[\]/);
  assert.match(view, /includes\("airstrike"\)\) continue/);
  assert.match(view, /if \(omegaBeam\) continue/);
  assert.match(view, /ASSET_KEYS\.sovereignGateMotion/);
  assert.match(view, /setAtlasFrame\(image, Math\.min\(5, Math\.floor\(progress \* 6\)\), 0\)/);
  assert.doesNotMatch(view, /setAtlasFrame\(image, Math\.min\(5, Math\.floor\(progress \* 6\)\), 3\)/);
  assert.doesNotMatch(view, /ASSET_KEYS\.(?:skillMotion|manualAbilityMotion|omegaLaserMotion)/);
  assert.doesNotMatch(view, /setDisplaySize\(segmentLength/);
  assert.doesNotMatch(manifest, /vfx\/(?:manual\/manual-ability-motion-atlas|skill-motion-atlas|omega-laser-motion-atlas)\.png/);
});

test("manual Q/E/F/R effects use their dedicated rows and engine-owned geometry", async () => {
  const view = await read("src/phaser/view/BattleView.ts");
  const start = view.indexOf("private syncManualAbilityFx");
  const end = view.indexOf("private syncHealingKitFx", start);
  const manual = view.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(view, /preparePixelAtlas\(ASSET_KEYS\.manualAbilityPixel, 6, 4\)/);
  assert.match(view, /manualAbilitySprites: Phaser\.GameObjects\.Image\[\]/);
  assert.match(view, /manualAbilityGraphics: Phaser\.GameObjects\.Graphics/);
  assert.match(view, /this\.syncManualAbilityFx\(state, time, quality\)/);
  assert.match(manual, /state\?\.empPulses/);
  assert.match(manual, /resolveManualAbilityAtlasFrame\("empPulse", pulse\)/);
  assert.match(manual, /geometry\?\.radius/);
  assert.match(manual, /setRotation\(0\)/);
  assert.match(manual, /state\?\.aegisWards/);
  assert.match(manual, /resolveManualAbilityAtlasFrame\("aegisWard", ward\)/);
  assert.match(manual, /geometry\?\.x/);
  assert.match(manual, /state\?\.stratosRuns/);
  assert.match(manual, /const offset = STRATOS_OFFSETS\[laneIndex\]/);
  assert.match(manual, /lane\?\.phase === "warning"/);
  assert.match(manual, /geometry\.sweepProgress/);
  assert.match(manual, /resolveManualAbilityAtlasFrame\("stratosRun"/);
  assert.match(manual, /const spriteSize = quality\.id === "performance" \? PIXEL_VFX_CELL \* 6/);
  assert.match(manual, /const centralLane = lanes\[1\]/);
  assert.match(manual, /this\.stratosGroupScratch/);
  assert.doesNotMatch(manual, /new Map<number, any\[\]>/);
  assert.match(manual, /const presentationProgress = presentationHasSweep \? centralSweepProgress : 0\.5/);
  assert.match(manual, /\.setDisplaySize\(spriteSize, spriteSize\)/);
  assert.doesNotMatch(manual, /\.setDisplaySize\(length,/);
  assert.match(manual, /state\?\.helixTempests/);
  assert.match(manual, /for \(const lance of Array\.isArray\(tempest\?\.lances\)/);
  assert.match(manual, /drawPixelDottedLine\([\s\S]*lance\.startX,[\s\S]*lance\.endY/);
  assert.match(manual, /resolveManualAbilityAtlasFrame\("helixTempest", tempest\)/);
  assert.match(manual, /ASSET_KEYS\.manualAbilityPixel/);
  assert.match(manual, /for \(let index = visible; index < this\.manualAbilitySprites\.length/);
  assert.doesNotMatch(manual, /state\.(?:empPulses|aegisWards|stratosRuns|helixTempests)\s*=/);
  assert.doesNotMatch(manual, /airstrikes|omegaLaserSprites|omegaLaserMotion/);
});

test("Phaser keeps basic fire automatic while Q/E/F/R share one repeat-safe active-ability edge", async () => {
  const scene = await read("src/phaser/scenes/OverloadScene.ts");
  const engine = await read("src/swarm/engine.js");
  const bridge = await read("src/phaser/adapters/sceneBridge.ts");
  const createGame = await read("src/phaser/createOverloadGame.ts");
  assert.doesNotMatch(scene, /this\.input\.on\("pointerdown"/);
  for (const [key, ability, field] of [
    ["Q", "empPulse", "empPulsePressed"],
    ["E", "aegisWard", "aegisWardPressed"],
    ["F", "stratosRun", "stratosRunPressed"],
    ["R", "helixTempest", "helixTempestPressed"],
  ]) {
    assert.match(scene, new RegExp(`KeyCodes\\.${key}`));
    assert.match(scene, new RegExp(`keydown-${key}`));
    assert.match(scene, new RegExp(`queueActiveAbility\\(\"${ability}\"\\)`));
    assert.match(scene, new RegExp(`gameInput\\.${field} = true`));
  }
  assert.ok((scene.match(/event\.repeat/g) || []).length >= 5, "Space plus all four abilities must ignore OS key repeat");
  assert.doesNotMatch(scene, /queuedManualFire|queuedAutoFireToggle/);
  assert.doesNotMatch(engine, /manualFire|autoFire/);
  assert.match(engine, /function updateAutoWeapons\(state, dt\)/);
  assert.match(engine, /empPulsePressed: false/);
  assert.match(engine, /aegisWardPressed: false/);
  assert.match(engine, /stratosRunPressed: false/);
  assert.match(engine, /helixTempestPressed: false/);
  assert.match(bridge, /export type ActiveAbility = "empPulse" \| "aegisWard" \| "stratosRun" \| "helixTempest"/);
  assert.match(bridge, /queueActiveAbility\(ability: ActiveAbility\)/);
  assert.match(createGame, /activateAbility: \(ability: ActiveAbility\)/);
  assert.doesNotMatch(scene, /queueActiveAbility\("(?:emp|nanite|skyfall|omegaLaser)"\)/);
  assert.doesNotMatch(bridge, /queueRecall|queueAutoFireToggle/);
  assert.doesNotMatch(createGame, /recall:|toggleAutoFire/);
});

test("boss parry and numbered bombs use repeat-safe Shift and authoritative world clicks", async () => {
  const scene = await read("src/phaser/scenes/OverloadScene.ts");
  const engine = await read("src/swarm/engine.js");
  const bridge = await read("src/phaser/adapters/sceneBridge.ts");
  const createGame = await read("src/phaser/createOverloadGame.ts");
  const manifest = await read("src/game/assets/manifest.ts");
  const view = await read("src/phaser/view/BattleView.ts");
  const animation = await read("src/phaser/view/animation/bossPatternAnimation.ts");
  const app = await read("src/App.jsx");
  const styles = await read("src/styles.css");
  const bombAtlas = await readBytes("public/assets/overload/vfx/pixel/timed-bomb-pixel-atlas.png");
  assert.match(scene, /SHIFT: Phaser\.Input\.Keyboard\.KeyCodes\.SHIFT/);
  assert.match(scene, /keyboard\.on\("keydown-SHIFT"/);
  assert.match(scene, /this\.gameInput\.parryPressed = true/);
  assert.match(scene, /Phaser\.Input\.Events\.POINTER_DOWN/);
  assert.match(scene, /bombSequence\?\.phase !== "armed"/);
  assert.match(scene, /this\.cameras\.main\.getWorldPoint\(pointer\.x, pointer\.y\)/);
  assert.match(engine, /bossMechanicClickX/);
  assert.match(engine, /clicked\.order !== sequence\.expectedOrder/);
  assert.match(bridge, /queueParry\(\): void/);
  assert.match(createGame, /parry: \(\) => bridge\.queueParry\(\)/);
  assert.deepEqual([bombAtlas.readUInt32BE(16), bombAtlas.readUInt32BE(20)], [384, 128]);
  assert.match(manifest, /timed-bomb-pixel-atlas\.png", kind: "atlas", columns: 6, rows: 2/);
  assert.match(view, /preparePixelAtlas\(ASSET_KEYS\.bossTimedBombPixel, 6, 2\)/);
  assert.match(view, /syncBossTimedBombSprites\(state, time\)/);
  assert.match(view, /setAtlasFrame\(image, Math\.min\(5, Math\.floor\(progress \* 6\)\), 1\)/);
  assert.match(view, /setDisplaySize\(expected \? 188 \+ pulse : 170/);
  assert.match(view, /setText\(defused \? "✓" : String\(bomb\?\.order/);
  assert.match(view, /setBackgroundColor\(defused \? "#0b4538" : expected \? "#eaffff"/);
  assert.match(animation, /id\.includes\("refractionsweep"\)/);
  assert.match(animation, /id\.includes\("undertow"\)/);
  assert.match(app, /className="boss-parry-prompt"/);
  assert.match(app, /className={`boss-bomb-directive is-\$\{bombSequence\.phase\}`}/);
  assert.match(styles, /\.is-parry-window \.phaser-host canvas[\s\S]*filter: grayscale\(1\)/);
  assert.match(styles, /\.boss-parry-prompt strong \{[^}]*white-space: nowrap;[^}]*word-break: keep-all;/);
});

test("Phaser DEV scene shortcuts require an explicit debug opt-in", async () => {
  const createGame = await read("src/phaser/createOverloadGame.ts");
  assert.match(createGame, /query\.get\("debug"\) === "1" \? query\.get\("scene"\) : null/);
  assert.doesNotMatch(createGame, /import\.meta\.env\.DEV \? new URLSearchParams/);
});

test("the compact 2D tactical minimap plots AEGIS and live enemies without restoring the old telemetry rail", async () => {
  const app = await read("src/App.jsx");
  const styles = await read("src/styles.css");
  const activeRuntime = app.slice(app.indexOf("function PhaserArenaScreen"), app.indexOf("function ResultScreen"));
  assert.match(app, /function RouteMinimap/);
  assert.match(app, /expedition\.minimap \|\| hud\?\.minimap/);
  assert.match(app, /minimap\.player/);
  assert.match(app, /minimap\.enemies/);
  assert.match(app, /route-minimap-enemy/);
  assert.match(app, /전술 지도/);
  assert.doesNotMatch(app, /ROUTE NAV|KEEP EAST/);
  assert.match(app, /expedition\.traces/);
  assert.match(styles, /\.route-minimap\s*\{/);
  assert.match(styles, /\.route-minimap-player\s*\{/);
  assert.match(styles, /\.route-minimap-enemy\s*\{/);
  assert.doesNotMatch(activeRuntime, /overload-command-rail/);
});

test("level-up cards load authored reward illustrations for every active option", async () => {
  const app = await read("src/App.jsx");
  const manifest = await read("src/game/assets/manifest.ts");
  const overlay = app.slice(app.indexOf("function LevelUpOverlay"), app.indexOf("function ArenaScreen"));
  assert.match(app, /const REWARD_ART_KEYS/);
  assert.match(app, /assets\?\.\[REWARD_ART_KEYS\[id\]\]/);
  assert.match(overlay, /modalRef\.current\?\.focus\(\{ preventScroll: true \}\)/);
  assert.match(overlay, /className=\{`reward-card is-\$\{meta\.color\}`\}/);
  assert.doesNotMatch(overlay, /autoFocus/);
  for (const id of ["scatter", "rail", "rocket", "orbit", "damage", "fireRate", "multishot", "shield", "dash", "regen", "chain", "nova", "airstrike", "omegaLaser", "drone", "sentry", "suppressor"]) {
    assert.match(manifest, new RegExp(`rewards/${id}\\.webp`));
  }
});

test("AEGIS stays upright while other strict-overhead actors retain world-heading rotation", async () => {
  const view = await read("src/phaser/view/BattleView.ts");
  const pipeline = await read("scripts/prepare-overload-art.py");
  assert.match(view, /Phaser\.Math\.Angle\.RotateTo\(record\.image\.rotation, angle/);
  assert.match(view, /\.setRotation\(actorAngle\(entity\)\)[\s\S]*?\.setFlipX\(false\)/);
  const player = view.slice(view.indexOf("private syncPlayer"), view.indexOf("private syncBoss"));
  assert.match(player, /resolveHeroAimPresentation\(entity\)/);
  assert.match(player, /\.setRotation\(0\)[\s\S]*?\.setFlipX\(presentation\.flipX\)/);
  assert.doesNotMatch(player, /Angle\.RotateTo\(this\.player\.rotation/);
  assert.match(pipeline, /parser\.add_argument\("--player", required=True\)/);
  assert.match(pipeline, /anchor: str = "center"/);
});

test("expanded expedition framing makes every hostile larger than AEGIS and stabilizes auto-fire motion", async () => {
  const app = await read("src/App.jsx");
  const engine = await read("src/swarm/engine.js");
  const view = await read("src/phaser/view/BattleView.ts");
  assert.match(engine, /export const WORLD_WIDTH = 1920/);
  assert.match(engine, /export const WORLD_HEIGHT = 1080/);
  assert.match(engine, /const EXPEDITION_ROUTE_LENGTH = 12000/);
  assert.match(engine, /export const EXPEDITION_WORLD_WIDTH = 13200/);
  assert.match(view, /const size = state\?\.phase === "boss" \? 64 : 74/);
  assert.match(view, /const baseSize = role === 2 \? 138 : role === 1 \? 108 : 92/);
  assert.match(view, /const recoil = animation\.clipId === "attack" \?/);
  assert.match(view, /setAtlasFrame\(ghost, Math\.max\(0, animation\.clipFrameIndex - index - 1\), HERO_MOTION_ROWS\.dash\)/);
  assert.match(view, /resolveHeroDirectionalAimFrame\(animation, entity\)/);
  assert.match(view, /resolveHeroMuzzleAnchor\(entity, size\)/);
  assert.match(view, /const bossSize = stage === 3 \? 640 : stage === 2 \? 560 : 480/);
  assert.match(app, /hud\?\.expedition\?\.bossRoom \? 4 : Math\.min\(3,/);
});

test("directional hero art, rifle-origin projectiles, reticle cue, and wheel zoom stay presentation-only", async () => {
  const manifest = await read("src/game/assets/manifest.ts");
  const view = await read("src/phaser/view/BattleView.ts");
  const scene = await read("src/phaser/scenes/OverloadScene.ts");
  const player = view.slice(view.indexOf("private syncPlayer"), view.indexOf("private syncBoss"));
  const projectiles = view.slice(view.indexOf("private drawProjectiles"), view.indexOf("private spawnFx"));
  const foreground = view.slice(view.indexOf("private drawForeground"), view.indexOf("private drawExpeditionMarkers"));
  const camera = view.slice(view.indexOf("adjustCameraZoom"), view.indexOf("private syncPlayer"));

  assert.match(manifest, /survivor-directional-aim-atlas\.png/);
  assert.match(manifest, /performance\/survivor-directional-aim-atlas\.png/);
  assert.match(player, /ASSET_KEYS\.playerDirectionalAim/);
  assert.match(player, /\.setPosition\(finite\(entity\?\.x\) \+ muzzle\.x, finite\(entity\?\.y\) \+ muzzle\.y\)/);
  assert.match(projectiles, /launchAge < 0\.05/);
  assert.match(projectiles, /originX = finite\(state\?\.player\?\.x\) \+ muzzle\.x/);
  assert.match(projectiles, /displayX = originX \+ \(x - originX\) \* launchBlend/);
  assert.match(foreground, /drawPixelDottedLine\([\s\S]*?COLORS\.cyan[\s\S]*?0\.32/);
  assert.match(foreground, /graphics\.strokeCircle\(aimX, aimY, 4\)/);
  assert.match(camera, /this\.userZoomFactor = clamp/);
  assert.match(camera, /bossStageActive[\s\S]*?0\.68, 0\.94[\s\S]*?0\.84, 1\.34/);
  assert.match(scene, /Phaser\.Input\.Events\.POINTER_WHEEL/);
  assert.match(scene, /addEventListener\("wheel", blockCanvasWheel, \{ passive: false \}\)/);
  assert.match(scene, /event\?\.preventDefault\?\.\(\)/);
});

test("route-clear warning phases render together without exposing the boss map off-stage", async () => {
  const view = await read("src/phaser/view/BattleView.ts");
  const camera = view.slice(view.indexOf("syncCamera(state"), view.indexOf("private syncPlayer"));
  const overlay = view.slice(view.indexOf("private drawHudOverlay"));
  assert.match(view, /type === "routeClearWarning"/);
  assert.match(view, /type === "routeClearPanic"/);
  assert.match(view, /type === "bossAutoTransition"/);
  assert.match(view, /clearTransition\?\.phase/);
  assert.match(overlay, /\["warning", "panic", "swap"\]\.includes\(clearPhase\)/);
  assert.match(overlay, /strokeCircle\(WIDTH \* 0\.5, HEIGHT \* 0\.5, ringRadius\)/);
  assert.match(camera, /const bossStageActive = Boolean\(expedition\?\.bossRoom \|\| state\?\.phase === "boss"\)/);
  assert.doesNotMatch(camera, /distance >= bossGate && gateUnlocked/);
  assert.match(camera, /nextSector = lastRouteIndex/);
});

test("route clear advances through warning, panic, and one automatic boss-room transition", async () => {
  const app = await read("src/App.jsx");
  const scene = await read("src/phaser/scenes/OverloadScene.ts");
  const bridge = await read("src/phaser/adapters/sceneBridge.ts");
  const engine = await read("src/swarm/engine.js");
  const activeRuntime = app.slice(app.indexOf("function PhaserArenaScreen"), app.indexOf("function ResultScreen"));
  assert.match(activeRuntime, /const autoBossEntryHandledRef = useRef\(false\)/);
  assert.match(activeRuntime, /autoBossEntryHandledRef\.current = false/);
  assert.match(activeRuntime, /event\.type === "bossAutoTransition" && !autoBossEntryHandledRef\.current/);
  assert.match(activeRuntime, /autoBossEntryHandledRef\.current = true;\s*controller\?\.enterBossRoom\(\)/);
  assert.doesNotMatch(activeRuntime, /boss-gate-overlay|보스방 진입/);
  assert.match(engine, /phase: "warning"/);
  assert.match(engine, /phase: "panic"/);
  assert.match(engine, /phase: "swap"/);
  assert.match(engine, /emit\(state, "routeClearWarning"/);
  assert.match(engine, /emit\(state, "routeClearPanic"/);
  assert.match(engine, /emit\(state, "bossAutoTransition"/);
  assert.doesNotMatch(engine, /emit\(state, "bossGatePrompt"/);
  assert.match(scene, /fadeOut\(240/);
  assert.match(scene, /fadeIn\(520/);
  assert.match(scene, /getBossGameAssetsForRegion\(this\.state\.regionId, this\.assetProfile\)/);
  assert.match(scene, /this\.load\.once\(Phaser\.Loader\.Events\.COMPLETE/);
  assert.match(scene, /this\.view\?\.activateBossAssets\(\)/);
  assert.match(bridge, /enterBossRoom\(\)/);
  assert.doesNotMatch(bridge, /queueAutoFireToggle\(\)/);
  assert.match(bridge, /queueActiveAbility\(ability: ActiveAbility\)/);
  assert.match(engine, /export function enterBossRoom/);
  assert.match(engine, /state\.player\.x = 820/);
  assert.match(engine, /state\.boss\.x = 1390/);
});

test("optional ally motion loads remain retryable after a Phaser file error", async () => {
  const scene = await read("src/phaser/scenes/OverloadScene.ts");
  const optionalLoader = scene.slice(
    scene.indexOf("private prepareOptionalAllyMotion"),
    scene.indexOf("setVirtualDirection", scene.indexOf("private prepareOptionalAllyMotion")),
  );
  assert.match(optionalLoader, /Phaser\.Loader\.Events\.FILE_LOAD_ERROR/);
  assert.match(optionalLoader, /file\.key !== asset\.key \|\| file\.type !== "image"/);
  assert.match(optionalLoader, /this\.optionalAssetKeysLoading\.delete\(asset\.key\)/);
  assert.match(optionalLoader, /this\.load\.off\(Phaser\.Loader\.Events\.FILE_LOAD_ERROR, clearFailedAsset\)/);
  assert.match(optionalLoader, /if \(!this\.load\.isLoading\(\)\) this\.load\.start\(\)/);
});

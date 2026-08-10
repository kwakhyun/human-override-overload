import Phaser from "phaser";
import {
  getAllyMotionAsset,
  getBossGameAssetsForRegion,
  resolveAssetProfile,
  type AssetProfile,
} from "../../game/assets/manifest";
import {
  REWARD_DEFINITIONS,
  chooseLevelReward,
  clearPressedInput,
  createSwarmInput,
  createSwarmState,
  drainSwarmEvents,
  enterBossRoom as confirmBossRoomEntry,
  getSwarmHud,
  setSwarmAim,
  stepSwarm,
} from "../../swarm/engine.js";
import { createPerformanceGovernor } from "../../swarm/performance.js";
import type { ActiveAbility, BattleSceneControls, Direction } from "../adapters/sceneBridge";
import { SceneBridge } from "../adapters/sceneBridge";
import {
  applyAdaptiveRenderPolicy,
  resetAdaptiveFrameTiming,
  type AppliedRenderPolicy,
} from "../performance/adaptiveRenderPolicy";
import { BattleView } from "../view/BattleView";

const FIXED_STEP = 1 / 60;

function isTerminal(state: any) {
  return state?.status === "victory" || state?.status === "defeat"
    || state?.phase === "victory" || state?.phase === "defeat";
}

function applyDebugScene(game: any, debugScene: string | null) {
  const sectorIndex = ["sector1", "sector2", "sector3"].indexOf(debugScene ?? "");
  if (sectorIndex >= 0 && game.expedition) {
    const distances = [1000, 5200, 9000];
    game.expedition.distance = distances[sectorIndex];
    game.player.x = game.expedition.originX + game.expedition.distance;
    game.expedition.progress = game.expedition.distance / game.expedition.routeLength;
    game.expedition.checkpointIndex = sectorIndex;
    for (let index = 0; index < game.expedition.traces.length; index += 1) {
      game.expedition.traces[index].triggered = index <= sectorIndex;
    }
    game.player.invulnerability = 30;
    game.events.length = 0;
    return;
  }
  const traceIndex = ["trace1", "trace2", "trace3"].indexOf(debugScene ?? "");
  if (traceIndex >= 0 && game.expedition) {
    const trace = game.expedition.traces[traceIndex];
    game.expedition.distance = trace.distance;
    game.player.x = game.expedition.originX + trace.distance;
    game.expedition.progress = trace.distance / game.expedition.routeLength;
    game.player.invulnerability = 30;
    return;
  }
  if (debugScene === "gateLocked" && game.expedition) {
    game.enemies.splice(1);
    game.spawnedEnemies = game.enemyBudget;
    game.killedEnemies = game.enemyBudget - 1;
    game.stats.kills = game.killedEnemies;
    game.expedition.distance = game.expedition.bossGate - 520;
    game.player.x = game.expedition.originX + game.expedition.distance;
    game.expedition.progress = game.expedition.distance / game.expedition.routeLength;
    game.expedition.gateLocked = true;
    game.expedition.gateUnlocked = false;
    game.expedition.reachedGate = false;
    game.expedition.objective = "PURGE ALL HOSTILES · GATE SEALED";
    game.expedition.checkpointIndex = game.expedition.traces.length;
    for (const trace of game.expedition.traces) trace.triggered = true;
    game.player.invulnerability = 30;
    game.events.length = 0;
    return;
  }
  if (debugScene === "arsenal") {
    game.killedEnemies = 950;
    game.stats.kills = 950;
    game.player.invulnerability = 15;
    Object.assign(game.build.weapons, { pulse: 5, scatter: 5, rail: 5, rocket: 5, orbit: 5 });
    Object.assign(game.build.skills, { chain: 3, nova: 3, airstrike: 3, omegaLaser: 3, damage: 3, fireRate: 3, multishot: 3 });
    game.player.damageMultiplier = 1.95;
    game.player.fireRateMultiplier = 0.58;
    game.player.multishot = 4;
    game.support.chainCooldown = 0;
    game.support.novaCooldown = 0;
    for (const ability of Object.values(game.manualAbilities) as any[]) ability.cooldown = 0;
    return;
  }
  if (debugScene === "sniperPressure") {
    game.player.invulnerability = 30;
    for (const key of Object.keys(game.player.fireTimers)) game.player.fireTimers[key] = 3_600;
    game.levelFlow.firstDeadline = 3_600;
    game.levelFlow.nextOfferAt = 3_600;
    for (let index = 0; index < game.enemies.length; index += 1) {
      const enemy = game.enemies[index];
      enemy.type = "brute";
      enemy.combatRole = "sniper";
      enemy.x = game.player.x + 520 + (index % 6) * 54;
      enemy.y = game.player.y - 260 + Math.floor(index / 6) * 92;
      enemy.hp = 1_000_000_000;
      enemy.maxHp = enemy.hp;
      enemy.speed = 0;
      enemy.damage = 0;
      enemy.spawnDelay = 0;
      enemy.shootCooldown = 0;
      enemy.aimTimer = 0;
      enemy.disabledTimer = 0;
    }
    game.spawnedEnemies = game.enemyBudget;
    game.events.length = 0;
    return;
  }
  if (debugScene === "laser") {
    game.player.invulnerability = 30;
    game.build.skills.omegaLaser = 3;
    game.support.omegaLaserCooldown = 0;
    game.levelFlow.firstDeadline = 999;
    game.levelFlow.nextOfferAt = 999;
    return;
  }
  if (debugScene === "airstrike") {
    game.player.invulnerability = 30;
    game.build.skills.airstrike = 3;
    game.support.airstrikeCooldown = 0;
    game.levelFlow.firstDeadline = 999;
    game.levelFlow.nextOfferAt = 999;
    return;
  }
  if (debugScene === "healing") {
    game.player.invulnerability = 30;
    game.player.hp = 120;
    game.enemies.length = 0;
    game.spawnedEnemies = game.enemyBudget;
    game.levelFlow.firstDeadline = 999;
    game.levelFlow.nextOfferAt = 999;
    const kit = game.healthKits[0];
    if (kit) {
      kit.x = game.player.x + 170;
      kit.y = game.player.y + 54;
    }
    game.events.length = 0;
    return;
  }
  if (debugScene === "enemyRoles") {
    game.player.invulnerability = 30;
    const roles = ["suicideDrone", "rifleman", "sniper"];
    game.enemies = roles.map((role: string) => game.enemies.find((enemy: any) => enemy.combatRole === role));
    game.enemies.forEach((enemy: any, index: number) => {
      enemy.spawnDelay = 0;
      enemy.x = game.player.x + [-330, 390, 590][index];
      enemy.y = game.player.y + [-150, 130, -180][index];
      enemy.shootCooldown = 0;
      if (enemy.combatRole === "suicideDrone") enemy.speed = 52;
    });
    game.spawnedEnemies = game.enemyBudget;
    game.levelFlow.firstDeadline = 999;
    game.levelFlow.nextOfferAt = 999;
    game.events.length = 0;
    return;
  }
  if (debugScene === "reward") {
    game.player.invulnerability = 30;
    game.levelupPending = true;
    game.levelFlow.batchLevels = 1;
    game.levelFlow.queuedLevels = 1;
    game.rewardOptions = (["scatter", "nova", "sentry"] as const).map((id) => ({
      ...REWARD_DEFINITIONS[id],
      level: 0,
      nextLevel: 1,
      rankGain: 1,
      mastery: false,
    }));
    game.events.length = 0;
    return;
  }
  if (!["boss", "weakness", "phase2", "phase3", "parry", "bombs", "victory"].includes(debugScene ?? "")) return;
  game.enemies.length = 0;
  game.spawnedEnemies = game.enemyBudget;
  game.killedEnemies = game.enemyBudget;
  game.stats.kills = game.enemyBudget;
  game.phaseTransition = 0.01;
  if (game.expedition) {
    game.expedition.distance = game.expedition.routeLength;
    game.expedition.progress = 1;
    game.expedition.reachedGate = true;
    game.expedition.gateLocked = false;
    game.expedition.gateUnlocked = true;
    game.expedition.entryPrompted = true;
    game.expedition.awaitingBossEntry = true;
  }
  if (debugScene === "victory") {
    game.phase = "victory";
    game.status = "victory";
    game.boss.active = true;
    game.boss.dead = true;
    game.boss.hp = 0;
    game.boss.deathTimer = 1.25;
    if (game.expedition) {
      game.expedition.awaitingBossEntry = false;
      game.expedition.bossEntryConfirmed = true;
      game.expedition.bossRoom = true;
    }
    game.events.push({ type: "scenario", beat: game.storyBeats.victory, time: game.time });
    game.events.push({ type: "win", kills: game.stats.kills, level: game.player.level, time: game.time });
    return;
  }
  confirmBossRoomEntry(game);
  if (debugScene === "parry") {
    game.boss.stage = 3;
    game.boss.hp = game.boss.maxHp * 0.2;
    game.boss.transformTimer = 0;
    game.boss.bombSequenceTier = 3;
    game.boss.patternCooldown = 30;
    game.boss.parryWindow = {
      pattern: "multiCharge",
      life: 1.5,
      duration: 1.5,
      progress: 0,
      key: "Shift",
    };
    game.boss.attackState = "parry:multiCharge";
    game.boss.attackTimer = 1.5;
    game.player.invulnerability = 30;
    game.events.length = 0;
  } else if (debugScene === "bombs") {
    game.boss.stage = 2;
    game.boss.hp = game.boss.maxHp * 0.54;
    game.boss.transformTimer = 0;
    game.boss.patternCooldown = 30;
    game.player.invulnerability = 30;
    game.events.length = 0;
  } else if (debugScene === "weakness") {
    game.boss.patternIndex = 4;
    game.player.invulnerability = 15;
  } else if (debugScene === "phase2" || debugScene === "phase3") {
    game.boss.stage = debugScene === "phase3" ? 3 : 2;
    game.boss.radius = debugScene === "phase3" ? 150 : 130;
    game.boss.hp = game.boss.maxHp * (debugScene === "phase3" ? 0.32 : 0.62);
    game.boss.enrage = debugScene === "phase3" ? 2.15 : 1.5;
    game.boss.transformTimer = 4;
    game.boss.phaseFlash = 1;
    game.boss.alertPulses = 2;
    game.boss.alertPulseTimer = 0.42;
    game.boss.patternCooldown = 0.2;
  }
}

export class OverloadScene extends Phaser.Scene implements BattleSceneControls {
  private readonly bridge: SceneBridge;
  private readonly regionId?: string;
  private readonly combatBonuses?: Readonly<Record<string, number>>;
  private readonly assetProfile: AssetProfile;
  private state: any;
  private gameInput: any;
  private view?: BattleView;
  private governor: any;
  private cursorKeys?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private accumulator = 0;
  private hudElapsed = 0;
  private lastRewardToken = "";
  private finishReported = false;
  private virtualDirections: Record<Direction, boolean> = { up: false, down: false, left: false, right: false };
  private queuedDash = false;
  private queuedParry = false;
  private queuedBossMechanicClick?: Readonly<{ x: number; y: number }>;
  private queuedActiveAbilities: Record<ActiveAbility, boolean> = {
    empPulse: false,
    aegisWard: false,
    stratosRun: false,
    helixTempest: false,
  };
  private narrativePaused = false;
  private externallySuspended = false;
  private runtimeBlurred = false;
  private runtimeHidden = false;
  private rendererContextLost = false;
  private runtimeLifecycleCleanup?: () => void;
  private renderPolicy?: AppliedRenderPolicy;
  private bossAssetsLoading = false;
  private readonly optionalAssetKeysLoading = new Set<string>();

  constructor(
    bridge: SceneBridge,
    regionId?: string,
    combatBonuses?: Readonly<Record<string, number>>,
    assetProfile: AssetProfile = "full",
  ) {
    super({ key: "OverloadBattle" });
    this.bridge = bridge;
    this.regionId = regionId;
    this.combatBonuses = combatBonuses;
    this.assetProfile = resolveAssetProfile(assetProfile);
  }

  create() {
    this.state = createSwarmState({ duration: 360, expedition: true, regionId: this.regionId, combatBonuses: this.combatBonuses });
    applyDebugScene(this.state, this.bridge.debugScene);
    this.gameInput = createSwarmInput();
    this.governor = createPerformanceGovernor({ environment: window });
    this.applyQualityLimit();
    this.view = new BattleView(this, this.state.regionId);
    if (this.state.phase === "boss" || this.state.expedition?.bossRoom || isTerminal(this.state)) {
      this.prepareBossAssets();
    }
    this.view.syncCamera(this.state);
    this.configureInput();
    this.configureRuntimeLifecycle();
    this.bridge.attach(this);
    this.refreshHud();
    this.view.render(this.state, this.governor.preset);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.bridge.detach(this));
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.bridge.detach(this));
    this.cameras.main.fadeIn(220, 2, 6, 8);
  }

  update(time: number, deltaMs: number) {
    if (!this.state || !this.view) return;
    if (this.isRuntimeInterrupted()) {
      this.accumulator = 0;
      clearPressedInput(this.gameInput);
      return;
    }
    const rawFrameMs = Math.max(0, Number(deltaMs) || 0);
    const frameMs = clampFrame(rawFrameMs);
    const qualityChanged = this.governor.sample(rawFrameMs, time);
    if (qualityChanged) this.applyQualityLimit();
    if (this.externallySuspended) {
      this.accumulator = 0;
      clearPressedInput(this.gameInput);
      return;
    }
    this.captureInput();

    if (!this.state.levelupPending && !this.narrativePaused && !isTerminal(this.state)) {
      this.accumulator = Math.min(this.accumulator + frameMs / 1000, FIXED_STEP * 5);
      let steps = 0;
      while (this.accumulator >= FIXED_STEP && steps < 5) {
        this.view.syncCamera(this.state);
        this.updateAimFromPointer();
        stepSwarm(this.state, this.gameInput, FIXED_STEP);
        this.view.syncCamera(this.state);
        this.updateAimFromPointer();
        clearPressedInput(this.gameInput);
        this.accumulator -= FIXED_STEP;
        steps += 1;
      }
    } else {
      this.accumulator = 0;
      clearPressedInput(this.gameInput);
      if (isTerminal(this.state)) this.advanceTerminalAnimation(frameMs / 1000);
    }

    this.consumeEvents();
    this.view.render(this.state, this.governor.preset);
    this.hudElapsed += frameMs;
    const token = `${Boolean(this.state.levelupPending)}:${this.state.rewardOptions?.map((option: any) => option.id).join("|") || ""}:${this.state.levelFlow?.batchLevels ?? ""}`;
    const rewardChanged = token !== this.lastRewardToken;
    if (rewardChanged || qualityChanged || (!this.state.levelupPending && this.hudElapsed >= (this.governor.preset.hudInterval || 150))) {
      this.lastRewardToken = token;
      this.hudElapsed = 0;
      this.refreshHud();
    }
    if (isTerminal(this.state) && !this.finishReported && !this.narrativePaused) {
      this.finishReported = true;
      this.refreshHud();
      this.time.delayedCall(1200, () => this.bridge.callbacks.onFinish(this.snapshot()));
    }
  }

  chooseReward(id: string) {
    if (!this.state?.levelupPending || !chooseLevelReward(this.state, id)) return false;
    this.prepareOptionalAllyMotion(id);
    this.refreshHud();
    return true;
  }

  private prepareOptionalAllyMotion(id: string) {
    const asset = getAllyMotionAsset(id, this.assetProfile);
    if (!asset || this.textures.exists(asset.key) || this.optionalAssetKeysLoading.has(asset.key)) return;
    this.optionalAssetKeysLoading.add(asset.key);
    const clearFailedAsset = (file: Phaser.Loader.File) => {
      if (file.key !== asset.key || file.type !== "image") return;
      this.optionalAssetKeysLoading.delete(asset.key);
      this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, clearFailedAsset);
    };
    this.load.image(asset.key, asset.path);
    this.load.once(`filecomplete-image-${asset.key}`, () => {
      this.optionalAssetKeysLoading.delete(asset.key);
      this.load.off(Phaser.Loader.Events.FILE_LOAD_ERROR, clearFailedAsset);
      this.view?.render(this.state, this.governor.preset);
    });
    // A failed optional request must remain retryable on a later reward. Phaser
    // completes a queue even when one file errors, so COMPLETE alone cannot
    // distinguish this case and would otherwise leave the key locked forever.
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, clearFailedAsset);
    if (!this.load.isLoading()) this.load.start();
  }

  setVirtualDirection(direction: Direction, active: boolean) {
    this.virtualDirections[direction] = active;
  }

  queueDash() {
    this.queuedDash = true;
  }

  queueParry() {
    this.queuedParry = true;
  }

  queueActiveAbility(ability: ActiveAbility) {
    this.queuedActiveAbilities[ability] = true;
  }

  enterBossRoom() {
    if (!this.state?.expedition?.awaitingBossEntry || this.bossAssetsLoading) return false;
    return this.prepareBossAssets(() => this.transitionIntoBossRoom());
  }

  private prepareBossAssets(onReady?: () => void) {
    const missingAssets = getBossGameAssetsForRegion(this.state.regionId, this.assetProfile)
      .filter((asset) => !this.textures.exists(asset.key));
    if (missingAssets.length > 0) {
      this.bossAssetsLoading = true;
      this.bridge.callbacks.onEvent({ type: "bossRoomLoading", regionId: this.state.regionId, time: this.state.time });
      for (const asset of missingAssets) this.load.image(asset.key, asset.path);
      this.load.once(Phaser.Loader.Events.COMPLETE, () => {
        this.bossAssetsLoading = false;
        if (!this.view?.activateBossAssets()) return;
        this.view.render(this.state, this.governor.preset);
        onReady?.();
      });
      this.load.start();
      return true;
    }
    if (!this.view?.activateBossAssets()) return false;
    onReady?.();
    return true;
  }

  private transitionIntoBossRoom() {
    this.cameras.main.fadeOut(240, 2, 6, 8);
    this.time.delayedCall(240, () => {
      if (!confirmBossRoomEntry(this.state)) return;
      this.accumulator = 0;
      clearPressedInput(this.gameInput);
      this.consumeEvents();
      this.refreshHud();
      this.view?.syncCamera(this.state);
      this.cameras.main.fadeIn(520, 2, 6, 8);
      this.focus();
    });
  }

  continueNarrative() {
    this.narrativePaused = false;
    this.accumulator = 0;
    this.queuedDash = false;
    this.queuedParry = false;
    this.queuedBossMechanicClick = undefined;
    this.clearQueuedActiveAbilities();
    clearPressedInput(this.gameInput);
    this.focus();
  }

  setSuspended(suspended: boolean) {
    this.externallySuspended = suspended;
    this.accumulator = 0;
    this.queuedDash = false;
    this.queuedParry = false;
    this.queuedBossMechanicClick = undefined;
    this.clearQueuedActiveAbilities();
    this.virtualDirections = { up: false, down: false, left: false, right: false };
    clearPressedInput(this.gameInput);
    if (suspended) {
      this.governor?.pause?.();
    } else if (!this.isRuntimeInterrupted()) {
      this.governor?.resume?.(this.time.now);
      resetAdaptiveFrameTiming(this.game);
      this.focus();
    }
  }

  focus() {
    this.game.canvas?.focus?.();
  }

  private configureRuntimeLifecycle() {
    const gameEvents = this.game.events;
    const renderer = this.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;
    const onBlur = () => {
      this.runtimeBlurred = true;
      this.pauseForRuntimeInterruption();
    };
    const onFocus = () => {
      this.runtimeBlurred = false;
      this.resumeFromRuntimeInterruption();
    };
    const onHidden = () => {
      this.runtimeHidden = true;
      this.pauseForRuntimeInterruption();
    };
    const onVisible = () => {
      this.runtimeHidden = false;
      this.resumeFromRuntimeInterruption();
    };
    const onContextLost = () => {
      this.rendererContextLost = true;
      this.pauseForRuntimeInterruption();
    };
    const onContextRestored = () => {
      this.rendererContextLost = false;
      this.applyQualityLimit();
      this.resumeFromRuntimeInterruption();
    };
    const onScaleResize = () => this.applyQualityLimit();

    gameEvents.on(Phaser.Core.Events.BLUR, onBlur);
    gameEvents.on(Phaser.Core.Events.FOCUS, onFocus);
    gameEvents.on(Phaser.Core.Events.PAUSE, onHidden);
    gameEvents.on(Phaser.Core.Events.RESUME, onVisible);
    this.scale.on(Phaser.Scale.Events.RESIZE, onScaleResize);
    renderer?.on?.(Phaser.Renderer.Events.LOSE_WEBGL, onContextLost);
    renderer?.on?.(Phaser.Renderer.Events.RESTORE_WEBGL, onContextRestored);

    this.runtimeLifecycleCleanup = () => {
      if (!this.runtimeLifecycleCleanup) return;
      gameEvents.off(Phaser.Core.Events.BLUR, onBlur);
      gameEvents.off(Phaser.Core.Events.FOCUS, onFocus);
      gameEvents.off(Phaser.Core.Events.PAUSE, onHidden);
      gameEvents.off(Phaser.Core.Events.RESUME, onVisible);
      this.scale.off(Phaser.Scale.Events.RESIZE, onScaleResize);
      renderer?.off?.(Phaser.Renderer.Events.LOSE_WEBGL, onContextLost);
      renderer?.off?.(Phaser.Renderer.Events.RESTORE_WEBGL, onContextRestored);
      this.runtimeLifecycleCleanup = undefined;
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.runtimeLifecycleCleanup);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.runtimeLifecycleCleanup);
  }

  private isRuntimeInterrupted() {
    return this.runtimeBlurred || this.runtimeHidden || this.rendererContextLost;
  }

  private pauseForRuntimeInterruption() {
    this.accumulator = 0;
    this.queuedDash = false;
    this.queuedParry = false;
    this.queuedBossMechanicClick = undefined;
    this.clearQueuedActiveAbilities();
    this.virtualDirections = { up: false, down: false, left: false, right: false };
    clearPressedInput(this.gameInput);
    this.governor?.pause?.();
  }

  private resumeFromRuntimeInterruption() {
    if (this.isRuntimeInterrupted()) return;
    this.accumulator = 0;
    this.queuedDash = false;
    this.clearQueuedActiveAbilities();
    clearPressedInput(this.gameInput);
    resetAdaptiveFrameTiming(this.game);
    this.applyQualityLimit();
    if (this.externallySuspended) {
      this.governor?.pause?.();
      return;
    }
    this.governor?.resume?.(this.time.now);
    this.view?.render(this.state, this.governor.preset);
    this.refreshHud();
  }

  private configureInput() {
    const onWheel = (
      _pointer: Phaser.Input.Pointer,
      _currentlyOver: Phaser.GameObjects.GameObject[],
      _deltaX: number,
      deltaY: number,
      _deltaZ: number,
      event?: WheelEvent,
    ) => {
      event?.preventDefault?.();
      if (!this.view || this.externallySuspended || this.isRuntimeInterrupted()) return;
      this.view.adjustCameraZoom(deltaY);
      this.view.syncCamera(this.state);
      this.view.render(this.state, this.governor.preset);
    };
    const blockCanvasWheel = (event: WheelEvent) => event.preventDefault();
    const onBossMechanicPointerDown = (pointer: Phaser.Input.Pointer) => {
      if (this.externallySuspended || this.isRuntimeInterrupted()) return;
      if (this.state?.boss?.bombSequence?.phase !== "armed") return;
      const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      this.queuedBossMechanicClick = { x: world.x, y: world.y };
    };
    this.input.on(Phaser.Input.Events.POINTER_WHEEL, onWheel);
    this.input.on(Phaser.Input.Events.POINTER_DOWN, onBossMechanicPointerDown);
    this.game.canvas?.addEventListener("wheel", blockCanvasWheel, { passive: false });
    let wheelCleanupPending = true;
    const cleanupWheel = () => {
      if (!wheelCleanupPending) return;
      wheelCleanupPending = false;
      this.input.off(Phaser.Input.Events.POINTER_WHEEL, onWheel);
      this.input.off(Phaser.Input.Events.POINTER_DOWN, onBossMechanicPointerDown);
      this.game.canvas?.removeEventListener("wheel", blockCanvasWheel);
    };
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanupWheel);
    this.events.once(Phaser.Scenes.Events.DESTROY, cleanupWheel);

    const keyboard = this.input.keyboard;
    if (!keyboard) return;
    this.cursorKeys = keyboard.createCursorKeys();
    this.keys = keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      Q: Phaser.Input.Keyboard.KeyCodes.Q,
      E: Phaser.Input.Keyboard.KeyCodes.E,
      F: Phaser.Input.Keyboard.KeyCodes.F,
      R: Phaser.Input.Keyboard.KeyCodes.R,
      SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
      ONE: Phaser.Input.Keyboard.KeyCodes.ONE,
      TWO: Phaser.Input.Keyboard.KeyCodes.TWO,
      THREE: Phaser.Input.Keyboard.KeyCodes.THREE,
    }) as Record<string, Phaser.Input.Keyboard.Key>;
    keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.W,
      Phaser.Input.Keyboard.KeyCodes.A,
      Phaser.Input.Keyboard.KeyCodes.S,
      Phaser.Input.Keyboard.KeyCodes.D,
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.Q,
      Phaser.Input.Keyboard.KeyCodes.E,
      Phaser.Input.Keyboard.KeyCodes.F,
      Phaser.Input.Keyboard.KeyCodes.R,
      Phaser.Input.Keyboard.KeyCodes.SHIFT,
    ]);
    // DOM-driven automation and very fast key taps can complete between two
    // render frames. Queue edge-triggered actions from the keyboard events so
    // Space and active-ability edges remain reliable even when the render FPS
    // is intentionally capped.
    keyboard.on("keydown-SPACE", (event: KeyboardEvent) => {
      if (event.repeat) return;
      this.queuedDash = true;
    });
    keyboard.on("keydown-Q", (event: KeyboardEvent) => {
      if (!event.repeat) this.queueActiveAbility("empPulse");
    });
    keyboard.on("keydown-E", (event: KeyboardEvent) => {
      if (!event.repeat) this.queueActiveAbility("aegisWard");
    });
    keyboard.on("keydown-F", (event: KeyboardEvent) => {
      if (!event.repeat) this.queueActiveAbility("stratosRun");
    });
    keyboard.on("keydown-R", (event: KeyboardEvent) => {
      if (!event.repeat) this.queueActiveAbility("helixTempest");
    });
    keyboard.on("keydown-SHIFT", (event: KeyboardEvent) => {
      if (!event.repeat) this.queueParry();
    });
    keyboard.on("keydown-ONE", () => this.chooseIndexedReward(0));
    keyboard.on("keydown-TWO", () => this.chooseIndexedReward(1));
    keyboard.on("keydown-THREE", () => this.chooseIndexedReward(2));
  }

  private captureInput() {
    const cursor = this.cursorKeys;
    this.gameInput.up = this.virtualDirections.up || Boolean(this.keys.W?.isDown || cursor?.up?.isDown);
    this.gameInput.down = this.virtualDirections.down || Boolean(this.keys.S?.isDown || cursor?.down?.isDown);
    this.gameInput.left = this.virtualDirections.left || Boolean(this.keys.A?.isDown || cursor?.left?.isDown);
    this.gameInput.right = this.virtualDirections.right || Boolean(this.keys.D?.isDown || cursor?.right?.isDown);
    if (this.queuedDash || Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.gameInput.dashPressed = true;
    if (this.queuedActiveAbilities.empPulse || Phaser.Input.Keyboard.JustDown(this.keys.Q)) this.gameInput.empPulsePressed = true;
    if (this.queuedActiveAbilities.aegisWard || Phaser.Input.Keyboard.JustDown(this.keys.E)) this.gameInput.aegisWardPressed = true;
    if (this.queuedActiveAbilities.stratosRun || Phaser.Input.Keyboard.JustDown(this.keys.F)) this.gameInput.stratosRunPressed = true;
    if (this.queuedActiveAbilities.helixTempest || Phaser.Input.Keyboard.JustDown(this.keys.R)) this.gameInput.helixTempestPressed = true;
    if (this.queuedParry || Phaser.Input.Keyboard.JustDown(this.keys.SHIFT)) this.gameInput.parryPressed = true;
    if (this.queuedBossMechanicClick) {
      this.gameInput.bossMechanicClickX = this.queuedBossMechanicClick.x;
      this.gameInput.bossMechanicClickY = this.queuedBossMechanicClick.y;
    }
    this.queuedDash = false;
    this.queuedParry = false;
    this.queuedBossMechanicClick = undefined;
    this.clearQueuedActiveAbilities();
    if (!this.state?.levelupPending) return;
    const choices = [this.keys.ONE, this.keys.TWO, this.keys.THREE];
    for (let index = 0; index < choices.length; index += 1) {
      if (!Phaser.Input.Keyboard.JustDown(choices[index])) continue;
      const reward = this.state.rewardOptions?.[index];
      if (reward) this.chooseReward(reward.id);
    }
  }

  private updateAimFromPointer() {
    const pointer = this.input.activePointer;
    const camera = this.cameras.main;
    if (!pointer || !camera) return;
    const world = camera.getWorldPoint(pointer.x, pointer.y);
    setSwarmAim(this.state, world.x, world.y);
  }

  private clearQueuedActiveAbilities() {
    this.queuedActiveAbilities.empPulse = false;
    this.queuedActiveAbilities.aegisWard = false;
    this.queuedActiveAbilities.stratosRun = false;
    this.queuedActiveAbilities.helixTempest = false;
  }

  private chooseIndexedReward(index: number) {
    if (!this.state?.levelupPending) return;
    const reward = this.state.rewardOptions?.[index];
    if (reward) this.chooseReward(reward.id);
  }

  private consumeEvents() {
    for (const event of drainSwarmEvents(this.state) || []) {
      if (event?.type === "scenario") this.narrativePaused = true;
      this.view?.impact(event);
      this.bridge.callbacks.onEvent(event);
    }
  }

  private advanceTerminalAnimation(delta: number) {
    if (this.state.player?.dead) this.state.player.deathTimer = Math.max(0, Number(this.state.player.deathTimer || 0) - delta);
    if (this.state.boss?.dead) this.state.boss.deathTimer = Math.max(0, Number(this.state.boss.deathTimer || 0) - delta);
  }

  private applyQualityLimit() {
    this.renderPolicy = applyAdaptiveRenderPolicy(this.game, this.governor.preset);
  }

  private snapshot() {
    return {
      ...getSwarmHud(this.state),
      quality: {
        ...this.governor.snapshot,
        renderPolicy: this.renderPolicy,
      },
    };
  }

  private refreshHud() {
    this.bridge.callbacks.onHud(this.snapshot());
  }
}

function clampFrame(value: number) {
  return Math.max(0, Math.min(50, Number(value) || 0));
}

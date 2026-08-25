import Phaser from "phaser";
import { resolveRegionId } from "../game/assets/manifest";
import { detectInitialQuality, QUALITY_PRESETS } from "../swarm/performance.js";
import { SceneBridge, type ActiveAbility, type Direction, type SceneCallbacks } from "./adapters/sceneBridge";
import { primeDeterministicArsenal } from "./profiling/deterministicArsenal";
import { installDevRuntimeProfiler } from "./profiling/runtimeProfiler";
import { BootScene } from "./scenes/BootScene";
import { OverloadScene } from "./scenes/OverloadScene";
import { detectMobileRuntime } from "../platform/mobileRuntime";

export type OverloadGameController = Readonly<{
  game: Phaser.Game;
  chooseReward: (id: string) => boolean;
  setDirection: (direction: Direction, active: boolean) => void;
  setMovement: (x: number, y: number) => void;
  dash: () => void;
  parry: () => void;
  tag: () => void;
  activateAbility: (ability: ActiveAbility) => void;
  enterBossRoom: () => boolean;
  continueStory: () => void;
  setSuspended: (suspended: boolean) => void;
  focus: () => void;
  destroy: () => void;
}>;

export type OverloadLaunchOptions = Readonly<{
  regionId?: string;
  combatBonuses?: Readonly<Record<string, number>>;
  mainWeaponId?: "pulse-rifle" | "beam-sword";
  characterId?: "aegis" | "mika" | "vesper";
  mikaUnlocked?: boolean;
  vesperUnlocked?: boolean;
  startSuspended?: boolean;
  qualityPreference?: "auto" | "cinematic" | "balanced" | "performance";
  screenShakeEnabled?: boolean;
}>;

export function createOverloadGame(
  parent: HTMLElement,
  callbacks: SceneCallbacks,
  launch: OverloadLaunchOptions = {},
): OverloadGameController {
  const query = new URLSearchParams(window.location.search);
  const debugScene = import.meta.env.DEV && query.get("debug") === "1" ? query.get("scene") : null;
  const debugRegion = import.meta.env.DEV && query.get("debug") === "1" ? query.get("region") : null;
  if (debugRegion) launch = { ...launch, regionId: debugRegion };
  const bridge = new SceneBridge(callbacks, debugScene);
  if (launch.startSuspended) bridge.setSuspended(true);
  const regionId = resolveRegionId(launch.regionId);
  const requestedQuality = launch.qualityPreference && launch.qualityPreference !== "auto"
    && QUALITY_PRESETS[launch.qualityPreference]
    ? launch.qualityPreference
    : null;
  const initialQuality = requestedQuality || detectInitialQuality(window);
  const mobileRuntime = detectMobileRuntime(window);
  const preset = QUALITY_PRESETS[initialQuality] ?? QUALITY_PRESETS.balanced;
  // A phone displays actors below the PERFORMANCE atlas' authored cell size,
  // so full desktop textures only increase decode/upload memory there.  Keep
  // the profile fixed for the whole scene to avoid texture churn mid-run.
  const assetProfile = initialQuality === "performance" || mobileRuntime.touchOptimized
    ? "performance"
    : "full";
  const bootScene = new BootScene(regionId, assetProfile, launch.mainWeaponId, callbacks.onLoadProgress);
  const portraitPresentation = mobileRuntime.portrait && mobileRuntime.touchOptimized;
  const presentationWidth = portraitPresentation
    ? Math.max(1, Math.round(window.visualViewport?.width || window.innerWidth || parent.clientWidth))
    : 1280;
  const presentationHeight = portraitPresentation
    ? Math.max(1, Math.round(window.visualViewport?.height || window.innerHeight || parent.clientHeight))
    : 720;
  const battleScene = new OverloadScene(bridge, regionId, launch.combatBonuses, launch.mainWeaponId, launch.characterId, launch.mikaUnlocked, launch.vesperUnlocked, assetProfile, mobileRuntime.autoAim, portraitPresentation);
  battleScene.configurePresentationSettings(initialQuality, launch.screenShakeEnabled !== false);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: presentationWidth,
    height: presentationHeight,
    backgroundColor: "#020608",
    transparent: false,
    antialias: initialQuality !== "performance",
    antialiasGL: initialQuality !== "performance",
    roundPixels: false,
    powerPreference: "high-performance",
    desynchronized: true,
    disableContextMenu: true,
    autoFocus: true,
    scene: [bootScene, battleScene],
    fps: {
      target: preset.renderFps,
      limit: preset.renderFps,
      forceSetTimeOut: false,
      smoothStep: true,
    },
    render: {
      antialias: initialQuality !== "performance",
      antialiasGL: initialQuality !== "performance",
      powerPreference: "high-performance",
      desynchronized: true,
      premultipliedAlpha: true,
      clearBeforeRender: true,
      batchSize: 8192,
      maxTextures: -1,
      skipUnreadyShaders: true,
    },
    scale: {
      // Portrait combat needs the phone's real aspect ratio. ENVELOP crops the
      // 16:9 canvas down to a narrow center strip before the battle camera is
      // applied, which hides nearby enemies even at a low world zoom.
      mode: portraitPresentation ? Phaser.Scale.RESIZE : Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: presentationWidth,
      height: presentationHeight,
      expandParent: true,
    },
    input: {
      activePointers: 3,
      smoothFactor: 0,
      windowEvents: true,
    },
    banner: false,
    audio: { noAudio: true },
  });

  let removePortraitResizeListener: (() => void) | null = null;
  if (portraitPresentation) {
    const resizePortraitRenderer = () => {
      const width = Math.max(1, Math.round(window.visualViewport?.width || window.innerWidth));
      const height = Math.max(1, Math.round(window.visualViewport?.height || window.innerHeight));
      game.scale.resize(width, height);
      game.renderer.resize(width, height);
    };
    resizePortraitRenderer();
    window.addEventListener("resize", resizePortraitRenderer, { passive: true });
    window.visualViewport?.addEventListener("resize", resizePortraitRenderer, { passive: true });
    removePortraitResizeListener = () => {
      window.removeEventListener("resize", resizePortraitRenderer);
      window.visualViewport?.removeEventListener("resize", resizePortraitRenderer);
    };
  }

  const qaProfiler = import.meta.env.DEV
    ? installDevRuntimeProfiler(game, battleScene, () => {
      const runtime = battleScene as unknown as {
        state?: any;
        view?: {
          getPresentationSnapshot?: () => {
            zoom: number;
            viewportWidth: number;
            viewportHeight: number;
            visibleWorldWidth: number;
            visibleWorldHeight: number;
            worldLeft: number;
            worldRight: number;
            worldTop: number;
            worldBottom: number;
          };
        };
        governor?: {
          preset?: { id?: string; renderFps?: number };
          snapshot?: {
            autoQualityCeiling?: string;
            deviceQuality?: string;
            deviceReasons?: readonly string[];
          };
        };
        assetProfile?: string;
      };
      const state = runtime.state;
      const qualitySnapshot = runtime.governor?.snapshot;
      const presentation = runtime.view?.getPresentationSnapshot?.();
      const visibleEnemyCount = presentation
        ? (state?.enemies ?? []).filter((enemy: any) => enemy?.spawnDelay <= 0
          && enemy?.x >= presentation.worldLeft && enemy?.x <= presentation.worldRight
          && enemy?.y >= presentation.worldTop && enemy?.y <= presentation.worldBottom).length
        : undefined;
      return {
        scene: "OverloadBattle",
        debugScene: bridge.debugScene,
        regionId: state?.regionId ?? regionId,
        phase: state?.phase,
        quality: runtime.governor?.preset?.id,
        renderFps: runtime.governor?.preset?.renderFps,
        assetProfile: runtime.assetProfile ?? assetProfile,
        autoQualityCeiling: qualitySnapshot?.autoQualityCeiling,
        deviceQuality: qualitySnapshot?.deviceQuality,
        deviceReasons: qualitySnapshot?.deviceReasons,
        liveEnemies: state?.enemies?.length ?? 0,
        playerX: state?.player?.x,
        playerY: state?.player?.y,
        playerProjectiles: state?.projectiles?.length ?? 0,
        enemyProjectiles: state?.enemyProjectiles?.length ?? 0,
        sniperLocks: state?.enemies?.filter((enemy: any) => enemy?.aimTimer > 0).length ?? 0,
        sniperTelegraphs: state?.telegraphs?.filter((telegraph: any) => telegraph?.type === "sniperAim").length ?? 0,
        bossStage: state?.boss?.stage,
        bossPattern: state?.boss?.activePattern?.type ?? null,
        mobileAutoAim: mobileRuntime.autoAim,
        portraitPresentation,
        cameraZoom: presentation?.zoom,
        cameraViewportWidth: presentation?.viewportWidth,
        cameraViewportHeight: presentation?.viewportHeight,
        visibleWorldWidth: presentation?.visibleWorldWidth,
        visibleWorldHeight: presentation?.visibleWorldHeight,
        visibleEnemyCount,
      };
    }, () => primeDeterministicArsenal(battleScene as unknown as Parameters<typeof primeDeterministicArsenal>[0]))
    : null;

  let destroyed = false;
  return Object.freeze({
    game,
    chooseReward: (id: string) => bridge.chooseReward(id),
    setDirection: (direction: Direction, active: boolean) => bridge.setVirtualDirection(direction, active),
    setMovement: (x: number, y: number) => bridge.setVirtualMovement(x, y),
    dash: () => bridge.queueDash(),
    parry: () => bridge.queueParry(),
    tag: () => bridge.queueTag(),
    activateAbility: (ability: ActiveAbility) => bridge.queueActiveAbility(ability),
    enterBossRoom: () => bridge.enterBossRoom(),
    continueStory: () => bridge.continueNarrative(),
    setSuspended: (suspended: boolean) => bridge.setSuspended(suspended),
    focus: () => bridge.focus(),
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      removePortraitResizeListener?.();
      qaProfiler?.destroy();
      game.destroy(true);
      parent.replaceChildren();
    },
  });
}

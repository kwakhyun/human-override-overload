import Phaser from "phaser";
import { resolveRegionId } from "../game/assets/manifest";
import { detectInitialQuality, QUALITY_PRESETS } from "../swarm/performance.js";
import { SceneBridge, type ActiveAbility, type Direction, type SceneCallbacks } from "./adapters/sceneBridge";
import { primeDeterministicArsenal } from "./profiling/deterministicArsenal";
import { installDevRuntimeProfiler } from "./profiling/runtimeProfiler";
import { BootScene } from "./scenes/BootScene";
import { OverloadScene } from "./scenes/OverloadScene";

export type OverloadGameController = Readonly<{
  game: Phaser.Game;
  chooseReward: (id: string) => boolean;
  setDirection: (direction: Direction, active: boolean) => void;
  setMovement: (x: number, y: number) => void;
  dash: () => void;
  parry: () => void;
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
  startSuspended?: boolean;
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
  const initialQuality = detectInitialQuality(window);
  const preset = QUALITY_PRESETS[initialQuality] ?? QUALITY_PRESETS.balanced;
  const assetProfile = initialQuality === "performance" ? "performance" : "full";
  const bootScene = new BootScene(regionId, assetProfile, launch.mainWeaponId, callbacks.onLoadProgress);
  const battleScene = new OverloadScene(bridge, regionId, launch.combatBonuses, launch.mainWeaponId, assetProfile);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: 1280,
    height: 720,
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
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 1280,
      height: 720,
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

  const qaProfiler = import.meta.env.DEV
    ? installDevRuntimeProfiler(game, battleScene, () => {
      const runtime = battleScene as unknown as {
        state?: any;
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
    activateAbility: (ability: ActiveAbility) => bridge.queueActiveAbility(ability),
    enterBossRoom: () => bridge.enterBossRoom(),
    continueStory: () => bridge.continueNarrative(),
    setSuspended: (suspended: boolean) => bridge.setSuspended(suspended),
    focus: () => bridge.focus(),
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      qaProfiler?.destroy();
      game.destroy(true);
      parent.replaceChildren();
    },
  });
}

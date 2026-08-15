import Phaser from "phaser";
import { detectInitialQuality, QUALITY_PRESETS } from "../swarm/performance.js";
import { detectMobileRuntime } from "../platform/mobileRuntime";
import { DefenseBootScene } from "./scenes/DefenseBootScene";
import { DefenseScene, type DefenseSceneCallbacks } from "./scenes/DefenseScene";

export type DefenseGameController = Readonly<{
  game: Phaser.Game;
  buildTower: (towerType: string) => boolean;
  upgradeTower: () => boolean;
  startWave: () => boolean;
  selectNode: (nodeId: string) => boolean;
  setSuspended: (suspended: boolean) => void;
  destroy: () => void;
}>;

export function createDefenseGame(parent: HTMLElement, callbacks: DefenseSceneCallbacks, stageId: string): DefenseGameController {
  const quality = detectInitialQuality(window);
  const preset = QUALITY_PRESETS[quality] ?? QUALITY_PRESETS.balanced;
  const mobile = detectMobileRuntime(window);
  // The defense battlefield owns a native portrait composition.  Use it for
  // every portrait viewport instead of relying on pointer-capability hints:
  // desktop mobile emulation and some Android WebViews report a fine pointer
  // during startup even though their usable canvas is still portrait.
  const portrait = mobile.portrait || window.innerHeight > window.innerWidth;
  const assetProfile = quality === "performance" || mobile.touchOptimized || portrait
    ? "performance"
    : "full";
  const logicalWidth = portrait ? 720 : 1280;
  const logicalHeight = portrait ? 1280 : 720;
  const boot = new DefenseBootScene(assetProfile, (callbacks as any).onLoadProgress);
  const battle = new DefenseScene(stageId, callbacks, portrait);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: logicalWidth,
    height: logicalHeight,
    backgroundColor: "#020608",
    antialias: quality !== "performance",
    antialiasGL: quality !== "performance",
    powerPreference: "high-performance",
    disableContextMenu: true,
    autoFocus: true,
    scene: [boot, battle],
    fps: { target: preset.renderFps, limit: preset.renderFps, smoothStep: true },
    render: { antialias: quality !== "performance", antialiasGL: quality !== "performance", powerPreference: "high-performance", batchSize: 4096, maxTextures: -1 },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: logicalWidth, height: logicalHeight, expandParent: true },
    input: { activePointers: 3, windowEvents: true },
    banner: false,
    audio: { noAudio: true },
  });
  let destroyed = false;
  return Object.freeze({
    game,
    buildTower: (towerType: string) => battle.buildTower(towerType),
    upgradeTower: () => battle.upgradeTower(),
    startWave: () => battle.startWave(),
    selectNode: (nodeId: string) => battle.selectNode(nodeId),
    setSuspended: (suspended: boolean) => battle.setSuspended(suspended),
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      game.destroy(true);
      parent.replaceChildren();
    },
  });
}

import Phaser from "phaser";
import { DEFENSE_GAME_ASSETS, resolveAssetProfile, type AssetProfile } from "../../game/assets/manifest";

export class DefenseBootScene extends Phaser.Scene {
  private readonly assetProfile: AssetProfile;
  private readonly onLoadProgress?: (progress: number) => void;

  constructor(assetProfile: AssetProfile = "full", onLoadProgress?: (progress: number) => void) {
    super({ key: "DefenseBoot" });
    this.assetProfile = resolveAssetProfile(assetProfile);
    this.onLoadProgress = onLoadProgress;
  }

  preload() {
    this.onLoadProgress?.(0);
    const width = this.scale.width;
    const height = this.scale.height;
    const railWidth = Math.min(420, width * 0.62);
    const railLeft = (width - railWidth) / 2;
    this.cameras.main.setBackgroundColor("#020608");
    this.add.rectangle(width / 2, height / 2, width, height, 0x020608, 1);
    this.add.text(width / 2, height / 2 - 34, "RHEA DEFENSE CONTROL", { fontFamily: "IBM Plex Mono", fontSize: width < 800 ? "16px" : "18px", color: "#dffcff", letterSpacing: 3 }).setOrigin(0.5);
    const rail = this.add.rectangle(railLeft, height / 2 + 14, 0, 6, 0x63efff, 1).setOrigin(0, 0.5);
    this.add.rectangle(width / 2, height / 2 + 14, railWidth, 6, 0x14242a, 1).setDepth(-1);
    const label = this.add.text(width / 2, height / 2 + 43, "방어 체계 동기화 중", { fontFamily: "Pretendard Variable", fontSize: "12px", color: "#7899a0" }).setOrigin(0.5);
    this.load.on("progress", (value: number) => {
      rail.setSize(railWidth * value, 6);
      label.setText(`방어 체계 동기화 · ${Math.round(value * 100)}%`);
      this.onLoadProgress?.(value);
    });
    for (const asset of DEFENSE_GAME_ASSETS) {
      const path = this.assetProfile === "performance" && asset.performancePath ? asset.performancePath : asset.path;
      this.load.image(asset.key, path);
    }
  }

  create() {
    this.onLoadProgress?.(1);
    this.scene.start("DefenseBattle");
  }
}

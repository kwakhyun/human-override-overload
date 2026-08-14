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
    this.cameras.main.setBackgroundColor("#020608");
    this.add.rectangle(640, 360, 1280, 720, 0x020608, 1);
    this.add.text(640, 326, "RHEA DEFENSE CONTROL", { fontFamily: "IBM Plex Mono", fontSize: "18px", color: "#dffcff", letterSpacing: 3 }).setOrigin(0.5);
    const rail = this.add.rectangle(460, 374, 0, 6, 0x63efff, 1).setOrigin(0, 0.5);
    this.add.rectangle(640, 374, 360, 6, 0x14242a, 1).setDepth(-1);
    const label = this.add.text(640, 403, "방어 체계 동기화 중", { fontFamily: "Pretendard Variable", fontSize: "12px", color: "#7899a0" }).setOrigin(0.5);
    this.load.on("progress", (value: number) => {
      rail.setSize(360 * value, 6);
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

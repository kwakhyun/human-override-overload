import Phaser from "phaser";
import {
  getGameAssetsForRegion,
  resolveAssetProfile,
  resolveRegionId,
  type AssetProfile,
  type RegionId,
} from "../../game/assets/manifest";

export class BootScene extends Phaser.Scene {
  private readonly regionId: RegionId;
  private readonly assetProfile: AssetProfile;
  private progressFill?: Phaser.GameObjects.Rectangle;
  private progressLabel?: Phaser.GameObjects.Text;

  constructor(regionId?: string, assetProfile: AssetProfile = "full") {
    super({ key: "OverloadBoot" });
    this.regionId = resolveRegionId(regionId);
    this.assetProfile = resolveAssetProfile(assetProfile);
  }

  preload() {
    this.cameras.main.setBackgroundColor("#020608");
    this.add.rectangle(640, 360, 1280, 720, 0x020608, 1);
    this.add.rectangle(640, 360, 470, 118, 0x061116, 0.96).setStrokeStyle(1, 0x63efff, 0.32);
    this.add.text(640, 325, "PHASER 4 · COMBAT RUNTIME", {
      fontFamily: "IBM Plex Mono",
      fontSize: "15px",
      color: "#dffcff",
      letterSpacing: 3,
    }).setOrigin(0.5);
    this.add.rectangle(640, 370, 360, 6, 0x14242a, 1);
    this.progressFill = this.add.rectangle(460, 370, 0, 6, 0x63efff, 1).setOrigin(0, 0.5);
    this.progressLabel = this.add.text(640, 398, "INITIALIZING WEBGL BATTLESPACE", {
      fontFamily: "IBM Plex Mono",
      fontSize: "10px",
      color: "#7899a0",
      letterSpacing: 2,
    }).setOrigin(0.5);

    this.load.on("progress", (value: number) => {
      this.progressFill?.setSize(360 * value, 6);
      this.progressLabel?.setText(`LOADING AUTHORED ASSETS · ${Math.round(value * 100)}%`);
    });
    for (const asset of getGameAssetsForRegion(this.regionId, this.assetProfile)) this.load.image(asset.key, asset.path);
  }

  create() {
    this.cameras.main.fadeOut(180, 2, 6, 8);
    this.time.delayedCall(190, () => this.scene.start("OverloadBattle"));
  }
}

import Phaser from "phaser";
import { ASSET_KEYS } from "../../game/assets/manifest";

type DefenseState = any;

const ENEMY_TEXTURES: Readonly<Record<string, string>> = Object.freeze({
  hunter: ASSET_KEYS.enemyHunter,
  rifleman: ASSET_KEYS.enemyRifleman,
  sniper: ASSET_KEYS.enemySniper,
  siegeWalker: ASSET_KEYS.enemySniper,
});

export class DefenseView {
  private readonly scene: Phaser.Scene;
  private readonly towerSprites = new Map<string, Phaser.GameObjects.Sprite>();
  private readonly enemySprites = new Map<string, Phaser.GameObjects.Image>();
  private readonly nodeZones = new Map<string, Phaser.GameObjects.Arc>();
  private readonly projectileGraphics: Phaser.GameObjects.Graphics;
  private readonly effectGraphics: Phaser.GameObjects.Graphics;
  private readonly healthGraphics: Phaser.GameObjects.Graphics;
  private readonly coreGlow: Phaser.GameObjects.Arc;
  private selectedNodeId: string | null = null;

  constructor(scene: Phaser.Scene, state: DefenseState, onSelectNode: (nodeId: string) => void) {
    this.scene = scene;
    scene.add.image(640, 360, ASSET_KEYS.defenseBattlefield).setDisplaySize(1280, 720).setDepth(-20);
    this.coreGlow = scene.add.circle(640, 590, 54, 0x63efff, 0.12).setStrokeStyle(3, 0x9bfbff, 0.86).setDepth(-3);
    this.effectGraphics = scene.add.graphics().setDepth(7);
    this.projectileGraphics = scene.add.graphics().setDepth(8);
    this.healthGraphics = scene.add.graphics().setDepth(9);
    this.ensureTowerFrames();

    for (const node of state.nodes) {
      const zone = scene.add.circle(node.x, node.y, 34, 0x061116, 0.2)
        .setStrokeStyle(2, 0x63efff, 0.48)
        .setDepth(1)
        .setInteractive({ useHandCursor: true });
      zone.on("pointerdown", () => onSelectNode(node.id));
      this.nodeZones.set(node.id, zone);
    }
  }

  private ensureTowerFrames() {
    const texture = this.scene.textures.get(ASSET_KEYS.defenseSystemsMotion);
    const source = texture.getSourceImage() as HTMLImageElement;
    const frameWidth = Math.floor(source.width / 6);
    const frameHeight = Math.floor(source.height / 4);
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 6; column += 1) {
        const name = `defense-${row}-${column}`;
        if (!texture.has(name)) texture.add(name, 0, column * frameWidth, row * frameHeight, frameWidth, frameHeight);
      }
    }
  }

  private syncTowers(state: DefenseState) {
    const live = new Set<string>();
    for (const tower of state.towers) {
      live.add(tower.id);
      let sprite = this.towerSprites.get(tower.id);
      if (!sprite) {
        sprite = this.scene.add.sprite(tower.x, tower.y, ASSET_KEYS.defenseSystemsMotion).setDepth(4);
        this.towerSprites.set(tower.id, sprite);
      }
      const row = tower.type === "pulseSentry" ? 0 : tower.type === "arcRelay" ? 1 : tower.type === "skyfireBattery" ? 2 : 3;
      const progress = tower.attackTimer > 0 ? 1 - tower.attackTimer / 0.32 : 0;
      const column = tower.attackTimer > 0 ? Math.min(5, 2 + Math.floor(progress * 4)) : Math.floor(state.time * 2.4 + tower.rank) % 2;
      sprite.setFrame(`defense-${row}-${column}`);
      sprite.setPosition(tower.x, tower.y);
      sprite.setDisplaySize(84 + tower.rank * 7, 84 + tower.rank * 7);
      sprite.setTint(tower.nodeId === state.selectedNodeId ? 0xffffff : 0xd7f8ff);
    }
    for (const [id, sprite] of this.towerSprites) {
      if (live.has(id)) continue;
      sprite.destroy();
      this.towerSprites.delete(id);
    }
  }

  private syncEnemies(state: DefenseState) {
    const live = new Set<string>();
    for (const enemy of state.enemies) {
      live.add(enemy.id);
      let sprite = this.enemySprites.get(enemy.id);
      if (!sprite) {
        sprite = this.scene.add.image(enemy.x, enemy.y, ENEMY_TEXTURES[enemy.role] || ASSET_KEYS.enemyHunter).setDepth(3);
        this.enemySprites.set(enemy.id, sprite);
      }
      const size = enemy.role === "siegeWalker" ? 116 : enemy.radius * 2.65;
      sprite.setPosition(enemy.x, enemy.y).setDisplaySize(size, size).setRotation(0);
      sprite.setTint(enemy.hitFlash > 0 ? 0xffffff : enemy.slowTimer > 0 ? 0x9ab7ff : 0xffffff);
    }
    for (const [id, sprite] of this.enemySprites) {
      if (live.has(id)) continue;
      sprite.destroy();
      this.enemySprites.delete(id);
    }
  }

  private drawWorldFx(state: DefenseState) {
    this.projectileGraphics.clear();
    for (const projectile of state.projectiles) {
      this.projectileGraphics.fillStyle(projectile.color || 0x63efff, 1);
      this.projectileGraphics.fillCircle(projectile.x, projectile.y, projectile.radius || 7);
      this.projectileGraphics.lineStyle(2, projectile.color || 0x63efff, 0.5);
      this.projectileGraphics.strokeCircle(projectile.x, projectile.y, (projectile.radius || 7) + 4);
    }

    this.effectGraphics.clear();
    for (const effect of state.effects) {
      const alpha = Math.max(0, effect.life / effect.maxLife);
      if (effect.kind === "arc") {
        this.effectGraphics.lineStyle(5, 0xb789ff, alpha * 0.85);
        this.effectGraphics.lineBetween(effect.x1, effect.y1, effect.x2, effect.y2);
        this.effectGraphics.lineStyle(2, 0xffffff, alpha);
        this.effectGraphics.lineBetween(effect.x1, effect.y1, effect.x2, effect.y2);
      } else {
        const color = effect.kind === "blast" ? 0xffa24f : effect.kind === "bastion" ? 0x63efff : 0xffffff;
        const radius = (effect.radius || 24) * (1.15 - alpha * 0.15);
        this.effectGraphics.lineStyle(effect.kind === "bastion" ? 5 : 3, color, alpha * 0.9);
        this.effectGraphics.strokeCircle(effect.x, effect.y, radius);
      }
    }

    this.healthGraphics.clear();
    for (const enemy of state.enemies) {
      if (enemy.hp >= enemy.maxHp || enemy.hp <= 0) continue;
      const width = enemy.role === "siegeWalker" ? 88 : 38;
      const ratio = Math.max(0, enemy.hp / enemy.maxHp);
      this.healthGraphics.fillStyle(0x020608, 0.88).fillRect(enemy.x - width / 2, enemy.y - enemy.radius - 14, width, 5);
      this.healthGraphics.fillStyle(0xff526d, 1).fillRect(enemy.x - width / 2 + 1, enemy.y - enemy.radius - 13, (width - 2) * ratio, 3);
    }
  }

  render(state: DefenseState) {
    this.coreGlow.setAlpha(state.baseHp / Math.max(1, state.maxBaseHp) * 0.28 + 0.08);
    this.coreGlow.setScale(1 + Math.sin(state.time * 3) * 0.04);
    if (this.selectedNodeId !== state.selectedNodeId) {
      this.selectedNodeId = state.selectedNodeId;
      for (const [id, zone] of this.nodeZones) {
        zone.setFillStyle(id === state.selectedNodeId ? 0x63efff : 0x061116, id === state.selectedNodeId ? 0.28 : 0.18);
        zone.setStrokeStyle(id === state.selectedNodeId ? 4 : 2, id === state.selectedNodeId ? 0xffffff : 0x63efff, id === state.selectedNodeId ? 0.95 : 0.45);
      }
    }
    this.syncTowers(state);
    this.syncEnemies(state);
    this.drawWorldFx(state);
  }

  destroy() {
    for (const sprite of this.towerSprites.values()) sprite.destroy();
    for (const sprite of this.enemySprites.values()) sprite.destroy();
    for (const zone of this.nodeZones.values()) zone.destroy();
    this.projectileGraphics.destroy();
    this.effectGraphics.destroy();
    this.healthGraphics.destroy();
    this.coreGlow.destroy();
  }
}

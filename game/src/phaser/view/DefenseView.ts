import Phaser from "phaser";
import { ASSET_KEYS } from "../../game/assets/manifest";

type DefenseState = any;
type DefenseEvent = Readonly<Record<string, unknown>>;
type WorldPoint = Readonly<{ x: number; y: number }>;

const ENEMY_ROWS: Readonly<Record<string, number>> = Object.freeze({
  hunter: 0,
  rifleman: 1,
  sniper: 2,
  siegeWalker: 3,
});

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export class DefenseView {
  private readonly scene: Phaser.Scene;
  private readonly portrait: boolean;
  private readonly towerSprites = new Map<string, Phaser.GameObjects.Sprite>();
  private readonly enemySprites = new Map<string, Phaser.GameObjects.Sprite>();
  private readonly projectileSprites = new Map<string, Phaser.GameObjects.Sprite>();
  private readonly effectSprites = new Map<string, Phaser.GameObjects.Sprite>();
  // Reuse hot-loop scratch collections. Defense waves can keep hundreds of
  // actors alive, so allocating four Sets and a Map every render creates
  // avoidable garbage-collector spikes on mobile browsers.
  private readonly liveTowerIds = new Set<string>();
  private readonly liveEnemyIds = new Set<string>();
  private readonly liveProjectileIds = new Set<string>();
  private readonly liveEffectIds = new Set<string>();
  private readonly occupiedRanks = new Map<string, number>();
  private readonly deathSprites: Phaser.GameObjects.Sprite[] = [];
  private readonly nodeZones = new Map<string, Phaser.GameObjects.Arc>();
  private readonly nodeLabels = new Map<string, Phaser.GameObjects.Text>();
  private readonly routeGraphics: Phaser.GameObjects.Graphics;
  private readonly effectGraphics: Phaser.GameObjects.Graphics;
  private readonly healthGraphics: Phaser.GameObjects.Graphics;
  private readonly coreGlow: Phaser.GameObjects.Arc;
  private readonly coreLabel: Phaser.GameObjects.Text;
  private selectedNodeId: string | null = null;

  constructor(scene: Phaser.Scene, state: DefenseState, onSelectNode: (nodeId: string) => void, portrait = false) {
    this.scene = scene;
    this.portrait = portrait;
    const width = portrait ? 720 : 1280;
    const height = portrait ? 1280 : 720;
    const backgroundKey = portrait ? ASSET_KEYS.defenseBattlefieldPortrait : ASSET_KEYS.defenseBattlefield;
    scene.add.image(width / 2, height / 2, backgroundKey).setDisplaySize(width, height).setDepth(-20);
    this.routeGraphics = scene.add.graphics().setDepth(-4);
    const routeColor = Phaser.Display.Color.HexStringToColor(String(state.battlefield?.routeColor || "#63efff")).color;
    for (const route of state.battlefield.routes) {
      const points = route.points.map(({ x, y }: WorldPoint) => {
        const point = this.toDisplay(x, y);
        return new Phaser.Math.Vector2(point.x, point.y);
      });
      this.routeGraphics.lineStyle(portrait ? 10 : 12, routeColor, 0.08).strokePoints(points, false, false);
      this.routeGraphics.lineStyle(2, routeColor, portrait ? 0.34 : 0.42).strokePoints(points, false, false);
    }
    const core = this.toDisplay(state.battlefield.core.x, state.battlefield.core.y);
    const coreRadius = portrait ? 46 : 54;
    this.coreGlow = scene.add.circle(core.x, core.y, coreRadius, 0x63efff, 0.12).setStrokeStyle(3, 0x9bfbff, 0.86).setDepth(-3);
    this.coreLabel = scene.add.text(core.x, core.y, "헤이븐\n코어", {
      align: "center",
      color: "#c9fbff",
      fontFamily: "Pretendard Variable, Arial, sans-serif",
      fontSize: portrait ? "13px" : "12px",
      fontStyle: "bold",
      lineSpacing: 1,
    }).setOrigin(0.5).setDepth(0).setAlpha(0.9);
    this.effectGraphics = scene.add.graphics().setDepth(7);
    this.healthGraphics = scene.add.graphics().setDepth(9);
    this.ensureAtlasFrames(ASSET_KEYS.defenseSystemsMotion, "defense-system", 6, 4);
    this.ensureAtlasFrames(ASSET_KEYS.defenseEnemyMotion, "defense-enemy", 6, 4);
    this.ensureAtlasFrames(ASSET_KEYS.defenseCombatFxMotion, "defense-fx", 6, 4);

    for (const node of state.nodes) {
      const point = this.toDisplay(node.x, node.y);
      const zone = scene.add.circle(point.x, point.y, portrait ? 31 : 34, 0x061116, 0.24)
        .setStrokeStyle(2, 0x63efff, 0.58)
        .setDepth(1)
        .setInteractive({ useHandCursor: true });
      zone.on("pointerdown", () => onSelectNode(node.id));
      zone.on("pointerover", () => zone.setScale(1.08));
      zone.on("pointerout", () => zone.setScale(1));
      this.nodeZones.set(node.id, zone);
      const label = scene.add.text(point.x, point.y, "+", {
        color: "#b9f8ff",
        fontFamily: "Pretendard Variable, Arial, sans-serif",
        fontSize: portrait ? "20px" : "22px",
        fontStyle: "bold",
      }).setOrigin(0.5).setDepth(2).setAlpha(0.82);
      this.nodeLabels.set(node.id, label);
    }
  }

  private toDisplay(x: number, y: number): WorldPoint {
    if (!this.portrait) return { x, y };
    return { x: 40 + (x / 1280) * 640, y: 80 + (y / 720) * 1180 };
  }

  private ensureAtlasFrames(textureKey: string, prefix: string, columns: number, rows: number) {
    const texture = this.scene.textures.get(textureKey);
    const source = texture.getSourceImage() as { width: number; height: number };
    const frameWidth = Math.floor(source.width / columns);
    const frameHeight = Math.floor(source.height / rows);
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const name = `${prefix}-${row}-${column}`;
        if (!texture.has(name)) texture.add(name, 0, column * frameWidth, row * frameHeight, frameWidth, frameHeight);
      }
    }
  }

  private enemySize(role: string) {
    const sizes: Readonly<Record<string, number>> = this.portrait
      ? { hunter: 56, rifleman: 66, sniper: 76, siegeWalker: 118 }
      : { hunter: 62, rifleman: 74, sniper: 84, siegeWalker: 136 };
    return sizes[role] || sizes.hunter;
  }

  private syncTowers(state: DefenseState) {
    const live = this.liveTowerIds;
    live.clear();
    for (const tower of state.towers) {
      live.add(tower.id);
      let sprite = this.towerSprites.get(tower.id);
      const point = this.toDisplay(tower.x, tower.y);
      if (!sprite) {
        sprite = this.scene.add.sprite(point.x, point.y, ASSET_KEYS.defenseSystemsMotion).setDepth(4);
        this.towerSprites.set(tower.id, sprite);
      }
      const row = tower.type === "pulseSentry" ? 0 : tower.type === "arcRelay" ? 1 : tower.type === "skyfireBattery" ? 2 : 3;
      const progress = tower.attackTimer > 0 ? 1 - tower.attackTimer / 0.32 : 0;
      const column = tower.attackTimer > 0 ? Math.min(5, 2 + Math.floor(progress * 4)) : Math.floor(state.time * 2.4 + tower.rank) % 2;
      const frameName = `defense-system-${row}-${column}`;
      if (sprite.frame.name !== frameName) sprite.setFrame(frameName);
      sprite.setPosition(point.x, point.y);
      const baseSize = this.portrait ? 78 : 88;
      sprite.setDisplaySize(baseSize + tower.rank * 7, baseSize + tower.rank * 7);
      sprite.setTint(tower.nodeId === state.selectedNodeId ? 0xffffff : 0xd7f8ff);
    }
    for (const [id, sprite] of this.towerSprites) {
      if (live.has(id)) continue;
      sprite.destroy();
      this.towerSprites.delete(id);
    }
  }

  private syncEnemies(state: DefenseState) {
    const live = this.liveEnemyIds;
    live.clear();
    for (const enemy of state.enemies) {
      live.add(enemy.id);
      const point = this.toDisplay(enemy.x, enemy.y);
      let sprite = this.enemySprites.get(enemy.id);
      if (!sprite) {
        sprite = this.scene.add.sprite(point.x, point.y, ASSET_KEYS.defenseEnemyMotion).setDepth(3);
        sprite.setData("previousX", point.x);
        sprite.setData("frameOffset", Number(String(enemy.id).split("-").at(-1)) || 0);
        this.enemySprites.set(enemy.id, sprite);
      }
      const row = ENEMY_ROWS[enemy.role] ?? 0;
      const frameOffset = Number(sprite.getData("frameOffset")) || 0;
      let column = Math.floor(state.time * (enemy.role === "siegeWalker" ? 4.5 : 7) + frameOffset) % 3;
      if (enemy.role === "hunter" && enemy.pathProgress > 0.78) column = 3 + Math.floor(state.time * 8) % 2;
      if (enemy.hitFlash > 0) column = enemy.role === "siegeWalker" ? 2 : 4;
      const frameName = `defense-enemy-${row}-${column}`;
      if (sprite.frame.name !== frameName) sprite.setFrame(frameName);
      const previousX = Number(sprite.getData("previousX") ?? point.x);
      if (Math.abs(point.x - previousX) > 0.15) sprite.setFlipX(point.x < previousX);
      sprite.setData("previousX", point.x);
      const size = this.enemySize(enemy.role);
      sprite.setPosition(point.x, point.y).setDisplaySize(size, size);
      sprite.setTint(enemy.hitFlash > 0 ? 0xffffff : enemy.slowTimer > 0 ? 0x9ab7ff : 0xffffff);
    }
    for (const [id, sprite] of this.enemySprites) {
      if (live.has(id)) continue;
      sprite.destroy();
      this.enemySprites.delete(id);
    }
  }

  private syncProjectiles(state: DefenseState) {
    const live = this.liveProjectileIds;
    live.clear();
    for (const projectile of state.projectiles) {
      live.add(projectile.id);
      const point = this.toDisplay(projectile.x, projectile.y);
      let sprite = this.projectileSprites.get(projectile.id);
      if (!sprite) {
        sprite = this.scene.add.sprite(point.x, point.y, ASSET_KEYS.defenseCombatFxMotion).setDepth(8);
        this.projectileSprites.set(projectile.id, sprite);
      }
      const row = projectile.kind === "mortar" ? 2 : 0;
      const column = projectile.kind === "mortar" ? 1 : 1 + Math.floor(state.time * 18) % 2;
      const frameName = `defense-fx-${row}-${column}`;
      if (sprite.frame.name !== frameName) sprite.setFrame(frameName);
      sprite.setPosition(point.x, point.y);
      const size = projectile.kind === "mortar" ? (this.portrait ? 38 : 44) : (this.portrait ? 30 : 36);
      sprite.setDisplaySize(size, size);
      if (Number.isFinite(projectile.targetX) && Number.isFinite(projectile.targetY)) {
        const target = this.toDisplay(projectile.targetX, projectile.targetY);
        sprite.setRotation(Math.atan2(target.y - point.y, target.x - point.x));
      }
    }
    for (const [id, sprite] of this.projectileSprites) {
      if (live.has(id)) continue;
      sprite.destroy();
      this.projectileSprites.delete(id);
    }
  }

  private syncEffects(state: DefenseState) {
    this.effectGraphics.clear();
    const live = this.liveEffectIds;
    live.clear();
    for (const effect of state.effects) {
      live.add(effect.id);
      const progress = clamp01(1 - effect.life / Math.max(0.001, effect.maxLife));
      let row = 0;
      let column = Math.min(5, Math.floor(progress * 6));
      let x = effect.x;
      let y = effect.y;
      let size = this.portrait ? 62 : 72;
      if (effect.kind === "arc") {
        row = 1;
        const start = this.toDisplay(effect.x1, effect.y1);
        const end = this.toDisplay(effect.x2, effect.y2);
        x = (effect.x1 + effect.x2) * 0.5;
        y = (effect.y1 + effect.y2) * 0.5;
        this.effectGraphics.lineStyle(this.portrait ? 3 : 5, 0xb789ff, (1 - progress) * 0.78);
        this.effectGraphics.lineBetween(start.x, start.y, end.x, end.y);
        this.effectGraphics.lineStyle(1, 0xffffff, 1 - progress);
        this.effectGraphics.lineBetween(start.x, start.y, end.x, end.y);
      } else if (effect.kind === "blast") {
        row = 2;
        column = Math.min(5, 2 + Math.floor(progress * 4));
        size = Math.max(this.portrait ? 92 : 120, (effect.radius || 72) * (this.portrait ? 1.28 : 2));
      } else if (effect.kind === "bastion") {
        row = 3;
        size = (effect.radius || 145) * (this.portrait ? 1.18 : 2);
      } else {
        row = 0;
        column = Math.min(5, 3 + Math.floor(progress * 3));
        size = this.portrait ? 54 : 64;
      }
      const point = this.toDisplay(x, y);
      let sprite = this.effectSprites.get(effect.id);
      if (!sprite) {
        sprite = this.scene.add.sprite(point.x, point.y, ASSET_KEYS.defenseCombatFxMotion).setDepth(effect.kind === "bastion" ? 2 : 7);
        this.effectSprites.set(effect.id, sprite);
      }
      const frameName = `defense-fx-${row}-${column}`;
      if (sprite.frame.name !== frameName) sprite.setFrame(frameName);
      sprite.setPosition(point.x, point.y).setDisplaySize(size, size).setAlpha(0.92 - progress * 0.24);
    }
    for (const [id, sprite] of this.effectSprites) {
      if (live.has(id)) continue;
      sprite.destroy();
      this.effectSprites.delete(id);
    }
  }

  private drawHealth(state: DefenseState) {
    this.healthGraphics.clear();
    for (const enemy of state.enemies) {
      if (enemy.hp >= enemy.maxHp || enemy.hp <= 0) continue;
      const point = this.toDisplay(enemy.x, enemy.y);
      const width = enemy.role === "siegeWalker" ? (this.portrait ? 82 : 96) : (this.portrait ? 38 : 44);
      const ratio = clamp01(enemy.hp / enemy.maxHp);
      const y = point.y - this.enemySize(enemy.role) * 0.48 - 10;
      this.healthGraphics.fillStyle(0x020608, 0.9).fillRoundedRect(point.x - width / 2, y, width, 6, 2);
      this.healthGraphics.fillStyle(0xff5876, 1).fillRoundedRect(point.x - width / 2 + 1, y + 1, (width - 2) * ratio, 4, 1);
    }
  }

  handleEvent(event: DefenseEvent) {
    if (event.type !== "defenseEnemyDestroyed") return;
    const role = String(event.role || "hunter");
    const point = this.toDisplay(Number(event.x) || 0, Number(event.y) || 0);
    const sprite = this.scene.add.sprite(point.x, point.y, ASSET_KEYS.defenseEnemyMotion, `defense-enemy-${ENEMY_ROWS[role] ?? 0}-5`)
      .setDepth(6)
      .setDisplaySize(this.enemySize(role) * 1.08, this.enemySize(role) * 1.08);
    this.deathSprites.push(sprite);
    while (this.deathSprites.length > 28) this.deathSprites.shift()?.destroy();
    this.scene.tweens.add({
      targets: sprite,
      alpha: 0,
      scaleX: sprite.scaleX * 1.18,
      scaleY: sprite.scaleY * 1.18,
      angle: sprite.angle + ((Number(String(event.enemyId || "0").split("-").at(-1)) || 0) % 2 ? 8 : -8),
      duration: 360,
      ease: "Quad.easeOut",
      onComplete: () => {
        const index = this.deathSprites.indexOf(sprite);
        if (index >= 0) this.deathSprites.splice(index, 1);
        sprite.destroy();
      },
    });
  }

  render(state: DefenseState) {
    this.coreGlow.setAlpha(state.baseHp / Math.max(1, state.maxBaseHp) * 0.28 + 0.08);
    this.coreGlow.setScale(1 + Math.sin(state.time * 3) * 0.04);
    if (this.selectedNodeId !== state.selectedNodeId) {
      this.selectedNodeId = state.selectedNodeId;
      for (const [id, zone] of this.nodeZones) {
        zone.setFillStyle(id === state.selectedNodeId ? 0x63efff : 0x061116, id === state.selectedNodeId ? 0.28 : 0.18);
        zone.setStrokeStyle(id === state.selectedNodeId ? 4 : 2, id === state.selectedNodeId ? 0xffffff : 0x63efff, id === state.selectedNodeId ? 0.95 : 0.52);
      }
    }
    const occupiedRanks = this.occupiedRanks;
    occupiedRanks.clear();
    for (const tower of state.towers) occupiedRanks.set(tower.nodeId, tower.rank);
    const pulse = 0.72 + Math.sin(state.time * 3.2) * 0.16;
    for (const [id, zone] of this.nodeZones) {
      const rank = occupiedRanks.get(id);
      const selected = id === state.selectedNodeId;
      zone.setAlpha(rank ? (selected ? 0.92 : 0.38) : selected ? 1 : pulse);
      const label = this.nodeLabels.get(id);
      if (!label) continue;
      const nextLabel = rank ? `L${rank}` : "+";
      if (label.text !== nextLabel) label.setText(nextLabel);
      label.setColor(selected ? "#ffffff" : rank ? "#8eeeff" : "#b9f8ff");
      label.setAlpha(rank ? 0.72 : pulse);
    }
    this.syncTowers(state);
    this.syncEnemies(state);
    this.syncProjectiles(state);
    this.syncEffects(state);
    this.drawHealth(state);
  }

  destroy() {
    for (const sprite of this.towerSprites.values()) sprite.destroy();
    for (const sprite of this.enemySprites.values()) sprite.destroy();
    for (const sprite of this.projectileSprites.values()) sprite.destroy();
    for (const sprite of this.effectSprites.values()) sprite.destroy();
    for (const sprite of this.deathSprites) sprite.destroy();
    for (const zone of this.nodeZones.values()) zone.destroy();
    for (const label of this.nodeLabels.values()) label.destroy();
    this.routeGraphics.destroy();
    this.effectGraphics.destroy();
    this.healthGraphics.destroy();
    this.coreGlow.destroy();
    this.coreLabel.destroy();
  }
}

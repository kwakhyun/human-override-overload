import Phaser from "phaser";
import { ASSET_KEYS } from "../../game/assets/manifest";
import { EXPEDITION_WORLD_WIDTH, WORLD_HEIGHT, WORLD_WIDTH } from "../../swarm/engine.js";
import {
  ACTOR_ANIMATION_PROFILES,
  HERO_MOTION_ROWS,
  getActorAnimationProfile,
  resolveBossClipElapsedSeconds,
  resolveDedicatedAtlasFrame,
  resolveHeroAimPresentation,
  resolveHeroClipElapsedSeconds,
  resolveHeroDirectionalAimFrame,
  resolveHeroMuzzleAnchor,
  sampleActorAnimation,
  selectActorClip,
  type ActorClipId,
} from "./animation/actorAnimation";
import { resolveManualAbilityAtlasFrame } from "./animation/manualAbilityAnimation";
import { resolveBossPatternAtlasFrame } from "./animation/bossPatternAnimation";

const WIDTH = 1280;
const HEIGHT = 720;
const TAU = Math.PI * 2;
const PIXEL_VFX_CELL = 64;
const STRATOS_OFFSETS = Object.freeze([-112, 0, 112]);

const COLORS = Object.freeze({
  cyan: 0x68efff,
  cyanSoft: 0x2ebed4,
  red: 0xff405f,
  redDark: 0x7d142c,
  amber: 0xffc75d,
  violet: 0xb67cff,
  green: 0x78f3ac,
  white: 0xeffcff,
  black: 0x020608,
});

type QualityPreset = Readonly<{
  id?: string;
  shadows?: boolean;
  filters?: boolean;
  particleScale?: number;
  maxParticles?: number;
}>;

type SpriteRecord = {
  image: Phaser.GameObjects.Image;
  seen: boolean;
  live: boolean;
  wasHit: boolean;
  wasDead: boolean;
  currentClipId: ActorClipId;
  clipStartedAt: number;
  animationTick: number;
  frameColumn: number;
  frameRow: number;
  roleIndex: number;
};

type ViewFxKind = "armorHit" | "enemyBurst" | "playerHit" | "bossHit" | "bossBurst" | "phaseBreak" | "weaponBlast";

type ViewFx = {
  kind: ViewFxKind;
  x: number;
  y: number;
  born: number;
  duration: number;
  color: number;
  scale: number;
  seed: number;
};

type StratosGroupScratch = {
  id: number;
  lanes: [any | null, any | null, any | null];
};

type RegionVisualAssets = Readonly<{
  route: readonly string[];
  routeSourceWidth: number;
  routeSourceHeight: number;
  bossRoom: string;
  bossForms: string;
  bossMotion: string;
}>;

const REGION_VISUAL_ASSETS: Readonly<Record<string, RegionVisualAssets>> = Object.freeze({
  "wrong-engine-core": Object.freeze({
    route: Object.freeze([ASSET_KEYS.sector1, ASSET_KEYS.sector2, ASSET_KEYS.sector3]),
    routeSourceWidth: 1600,
    routeSourceHeight: 900,
    bossRoom: ASSET_KEYS.bossRoom,
    bossForms: ASSET_KEYS.bossForms,
    bossMotion: ASSET_KEYS.bossMotion,
  }),
  "glass-dune": Object.freeze({
    route: Object.freeze([ASSET_KEYS.glassDuneRoute]),
    routeSourceWidth: 1920,
    routeSourceHeight: 1080,
    bossRoom: ASSET_KEYS.glassDuneBossRoom,
    bossForms: ASSET_KEYS.glassDuneBossForms,
    bossMotion: ASSET_KEYS.glassDuneBossMotion,
  }),
  "abyssal-archive": Object.freeze({
    route: Object.freeze([ASSET_KEYS.abyssalArchiveRoute]),
    routeSourceWidth: 1920,
    routeSourceHeight: 1080,
    bossRoom: ASSET_KEYS.abyssalArchiveBossRoom,
    bossForms: ASSET_KEYS.abyssalArchiveBossForms,
    bossMotion: ASSET_KEYS.abyssalArchiveBossMotion,
  }),
});

function getRegionVisualAssets(regionId?: string) {
  return REGION_VISUAL_ASSETS[String(regionId ?? "")] ?? REGION_VISUAL_ASSETS["wrong-engine-core"];
}

function finite(value: unknown, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, finite(value, min)));
}

function clamp01(value: number) {
  return clamp(value, 0, 1);
}

function ratio(entity: any) {
  return clamp01(finite(entity?.hp, 1) / Math.max(1, finite(entity?.maxHp, 1)));
}

function colorNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().replace(/^#/, "");
  const parsed = Number.parseInt(normalized.slice(0, 6), 16);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function frameName(key: string, column: number, row: number) {
  return `${key}:${row}:${column}`;
}

function ensureAtlasFrames(scene: Phaser.Scene, key: string, columns: number, rows: number) {
  const texture = scene.textures.get(key);
  const source = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
  const width = finite((source as HTMLImageElement)?.naturalWidth, finite(source?.width, 1));
  const height = finite((source as HTMLImageElement)?.naturalHeight, finite(source?.height, 1));
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const name = frameName(key, column, row);
      if (texture.has(name)) continue;
      const x = Math.round(column * width / columns);
      const y = Math.round(row * height / rows);
      const right = Math.round((column + 1) * width / columns);
      const bottom = Math.round((row + 1) * height / rows);
      texture.add(name, 0, x, y, Math.max(1, right - x), Math.max(1, bottom - y));
    }
  }
}

function setAtlasFrame(image: Phaser.GameObjects.Image, column: number, row: number) {
  const name = frameName(image.texture.key, column, row);
  if (image.frame.name !== name) image.setFrame(name);
}

function snapPixelSize(value: number, minimum = PIXEL_VFX_CELL, maximum = PIXEL_VFX_CELL * 12) {
  const snapped = Math.round(finite(value, minimum) / PIXEL_VFX_CELL) * PIXEL_VFX_CELL;
  return clamp(snapped, minimum, maximum);
}

function drawPixelDottedLine(
  graphics: Phaser.GameObjects.Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: number,
  alpha: number,
  spacing = 24,
  pixelSize = 4,
  startProgress = 0,
  endProgress = 1,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.max(1, Math.hypot(dx, dy));
  const count = Math.max(1, Math.floor(length / Math.max(4, spacing)));
  const from = clamp01(startProgress);
  const to = Math.max(from, clamp01(endProgress));
  graphics.fillStyle(color, clamp01(alpha));
  for (let index = 0; index <= count; index += 1) {
    const progress = index / count;
    if (progress < from || progress > to) continue;
    const x = Math.round(x1 + dx * progress - pixelSize * 0.5);
    const y = Math.round(y1 + dy * progress - pixelSize * 0.5);
    graphics.fillRect(x, y, pixelSize, pixelSize);
  }
}

function drawPixelDottedCircle(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  color: number,
  alpha: number,
  spacing = 22,
  pixelSize = 4,
) {
  const circumference = TAU * Math.max(1, radius);
  const count = Math.max(12, Math.round(circumference / Math.max(5, spacing)));
  graphics.fillStyle(color, clamp01(alpha));
  for (let index = 0; index < count; index += 1) {
    const angle = index / count * TAU;
    graphics.fillRect(
      Math.round(x + Math.cos(angle) * radius - pixelSize * 0.5),
      Math.round(y + Math.sin(angle) * radius - pixelSize * 0.5),
      pixelSize,
      pixelSize,
    );
  }
}

function actorAngle(entity: any) {
  if (Number.isFinite(entity?.angle)) return entity.angle;
  if (Math.hypot(finite(entity?.vx), finite(entity?.vy)) > 1) return Math.atan2(entity.vy, entity.vx);
  return 0;
}

function enemyRoleIndex(enemy: any) {
  const type = String(enemy?.type ?? "hunter").toLowerCase();
  const combatRole = String(enemy?.combatRole ?? "").toLowerCase();
  if (type.includes("brute") || combatRole.includes("sniper")) return 2;
  if (type.includes("suppress") || combatRole.includes("rifle")) return 1;
  return 0;
}

function enemyMotionTexture(enemy: any) {
  const role = enemyRoleIndex(enemy);
  return role === 2 ? ASSET_KEYS.enemySniperMotion : role === 1 ? ASSET_KEYS.enemyRiflemanMotion : ASSET_KEYS.enemyHunterMotion;
}

function enemyFallbackTexture(enemy: any) {
  const role = enemyRoleIndex(enemy);
  return role === 2 ? ASSET_KEYS.enemySniper : role === 1 ? ASSET_KEYS.enemyRifleman : ASSET_KEYS.enemyHunter;
}

function updateClipClock(record: SpriteRecord, clipId: ActorClipId, time: number) {
  if (record.currentClipId !== clipId) {
    record.currentClipId = clipId;
    record.clipStartedAt = time;
    record.animationTick = -1;
  }
  return Math.max(0, time - record.clipStartedAt);
}

function allyFallbackTexture(ally: any) {
  const type = String(ally?.type ?? ally?.kind ?? "drone").toLowerCase();
  if (type.includes("sentry")) return ASSET_KEYS.sentry;
  if (type.includes("emp")) return ASSET_KEYS.emp;
  if (type.includes("gunner")) return ASSET_KEYS.rook;
  if (type.includes("arcanist")) return ASSET_KEYS.nyx;
  if (type.includes("warden")) return ASSET_KEYS.moss;
  if (type.includes("vanguard")) return ASSET_KEYS.aegisEcho;
  if (type.includes("suppress")) return ASSET_KEYS.suppressorDrone;
  return ASSET_KEYS.drone;
}

function allyMotionTexture(ally: any) {
  const type = String(ally?.type ?? ally?.kind ?? "").toLowerCase();
  if (type.includes("sentry")) return ASSET_KEYS.sentryMotion;
  if (type.includes("suppress")) return ASSET_KEYS.suppressorDroneMotion;
  if (type.includes("drone") || type.includes("hunter")) return ASSET_KEYS.droneMotion;
  return null;
}

function projectileArt(projectile: any) {
  const type = String(projectile?.kind ?? "pulse").toLowerCase();
  if (type.includes("rail") || type.includes("omega")) return { column: 2, row: 0, width: 118, height: 34 };
  if (type.includes("rocket") || type.includes("missile")) return { column: 3, row: 0, width: 68, height: 30 };
  if (type.includes("scatter") || type.includes("fork")) return { column: 1, row: 0, width: 58, height: 34 };
  if (type.includes("orbit")) return { column: 2, row: 2, width: 54, height: 54 };
  if (type.includes("heavy") || type.includes("sentry")) return { column: 0, row: 0, width: 72, height: 25 };
  return { column: 0, row: 0, width: type.includes("overdrive") ? 76 : 56, height: type.includes("overdrive") ? 26 : 20 };
}

export class BattleView {
  private readonly scene: Phaser.Scene;
  private readonly mainCamera: Phaser.Cameras.Scene2D.Camera;
  private readonly hudCamera: Phaser.Cameras.Scene2D.Camera;
  private readonly regionAssets: RegionVisualAssets;
  private readonly maps: Array<Phaser.GameObjects.TileSprite | Phaser.GameObjects.Image>;
  private readonly bossMap: Phaser.GameObjects.Image;
  private readonly routeMapCount: number;
  private readonly worldBack: Phaser.GameObjects.Container;
  private readonly actors: Phaser.GameObjects.Container;
  private readonly worldFront: Phaser.GameObjects.Container;
  private readonly bossPatternLayer: Phaser.GameObjects.Container;
  private readonly hudLayer: Phaser.GameObjects.Container;
  private readonly shadowGraphics: Phaser.GameObjects.Graphics;
  private readonly telegraphGraphics: Phaser.GameObjects.Graphics;
  private readonly effectGraphics: Phaser.GameObjects.Graphics;
  private readonly manualAbilityGraphics: Phaser.GameObjects.Graphics;
  private readonly projectileGraphics: Phaser.GameObjects.Graphics;
  private readonly foregroundGraphics: Phaser.GameObjects.Graphics;
  private readonly impactGraphics: Phaser.GameObjects.Graphics;
  private readonly hudGraphics: Phaser.GameObjects.Graphics;
  private readonly player: Phaser.GameObjects.Image;
  private readonly boss: Phaser.GameObjects.Image;
  private readonly bossPhaseArt: Phaser.GameObjects.Image;
  private readonly playerGhosts: Phaser.GameObjects.Image[];
  private readonly muzzleFlash: Phaser.GameObjects.Image;
  private readonly projectileSprites: Phaser.GameObjects.Image[] = [];
  private readonly enemyProjectileSprites: Phaser.GameObjects.Image[] = [];
  private readonly skillFxSprites: Phaser.GameObjects.Image[] = [];
  private readonly ultimateFxSprites: Phaser.GameObjects.Image[] = [];
  private readonly omegaLaserSprites: Phaser.GameObjects.Image[] = [];
  private readonly healingKitSprites: Phaser.GameObjects.Image[] = [];
  private readonly manualAbilitySprites: Phaser.GameObjects.Image[] = [];
  private readonly spawnGateSprites: Phaser.GameObjects.Image[] = [];
  private readonly bossPatternSprites: Phaser.GameObjects.Image[] = [];
  private readonly bossTimedBombSprites: Phaser.GameObjects.Image[] = [];
  private readonly bossTimedBombLabels: Phaser.GameObjects.Text[] = [];
  private readonly impactSprites: Phaser.GameObjects.Image[] = [];
  private readonly traceSprites = new Map<string, Phaser.GameObjects.Image>();
  private readonly enemySprites = new Map<number, SpriteRecord>();
  private readonly allySprites = new Map<number, SpriteRecord>();
  private readonly enemyPool: Phaser.GameObjects.Image[] = [];
  private readonly allyPool: Phaser.GameObjects.Image[] = [];
  private readonly damageTexts: Phaser.GameObjects.Text[];
  private readonly viewFx: ViewFx[] = [];
  private visibleEnemyCount = 0;
  private readonly preparedAtlases = new Set<string>();
  private readonly stratosGroupScratch: StratosGroupScratch[] = Array.from(
    { length: 3 },
    () => ({ id: 0, lanes: [null, null, null] }),
  );
  private currentQualityId = "balanced";
  private lastCosmeticTick = -1;
  private playerClipId: ActorClipId = "idle";
  private playerClipStartedAt = 0;
  private playerWasHit = false;
  private bossClipId: ActorClipId = "idle";
  private bossClipStartedAt = 0;
  private bossVisualScale = 1;
  private bossWasHit = false;
  private bossWasDead = false;
  private lastPhase = 1;
  private bossRevealStartedAt = -1;
  private bossRevealFromZoom = 1.08;
  private userZoomFactor = 1;

  constructor(scene: Phaser.Scene, regionId = "wrong-engine-core") {
    this.scene = scene;
    const regionAssets = getRegionVisualAssets(regionId);
    this.regionAssets = regionAssets;
    this.prepareAtlas(ASSET_KEYS.playerMotion, 8, 9);
    this.prepareAtlas(ASSET_KEYS.playerDirectionalAim, 8, 3);
    this.prepareAtlas(ASSET_KEYS.enemyHunterMotion, 6, 4);
    this.prepareAtlas(ASSET_KEYS.enemyRiflemanMotion, 6, 4);
    this.prepareAtlas(ASSET_KEYS.enemySniperMotion, 6, 4);
    if (scene.textures.exists(regionAssets.bossForms)) ensureAtlasFrames(scene, regionAssets.bossForms, 3, 1);
    ensureAtlasFrames(scene, ASSET_KEYS.combatFx, 4, 3);
    this.preparePixelAtlas(ASSET_KEYS.automaticSkillPixel, 6, 4);
    this.prepareAtlas(ASSET_KEYS.sovereignGateMotion, 6, 1);
    ensureAtlasFrames(scene, ASSET_KEYS.healingKitMotion, 4, 1);
    this.preparePixelAtlas(ASSET_KEYS.manualAbilityPixel, 6, 4);
    this.preparePixelAtlas(ASSET_KEYS.enemyDeathPixel, 6, 1);
    const hasSquadTraces = scene.textures.exists(ASSET_KEYS.squadTraces);
    if (hasSquadTraces) ensureAtlasFrames(scene, ASSET_KEYS.squadTraces, 3, 1);
    this.mainCamera = scene.cameras.main;
    this.mainCamera.setBackgroundColor("#020608");

    const routeBackdropHeight = WORLD_HEIGHT + 360;
    const routeMaps = regionAssets.route.map((key, index) => {
      const source = scene.textures.get(key).getSourceImage() as { width?: number; height?: number };
      const sourceWidth = Math.max(1, finite(source?.width, regionAssets.routeSourceWidth));
      const sourceHeight = Math.max(1, finite(source?.height, regionAssets.routeSourceHeight));
      return scene.add.tileSprite(
        EXPEDITION_WORLD_WIDTH / 2,
        WORLD_HEIGHT / 2,
        EXPEDITION_WORLD_WIDTH + WIDTH * 2,
        routeBackdropHeight,
        key,
      )
        // PERFORMANCE paths keep the authored world pattern size while using
        // half-resolution source pixels; full-resolution assets remain 1:1.
        .setTileScale(
          regionAssets.routeSourceWidth / sourceWidth,
          routeBackdropHeight / WORLD_HEIGHT * regionAssets.routeSourceHeight / sourceHeight,
        )
        .setTilePosition(-WIDTH + index * 83, 0)
        .setAlpha(index === 0 ? 1 : 0);
    });
    this.routeMapCount = routeMaps.length;
    const bossFallbackTexture = regionAssets.route[0];
    const bossMapTexture = scene.textures.exists(regionAssets.bossRoom) ? regionAssets.bossRoom : bossFallbackTexture;
    const bossMap = scene.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, bossMapTexture)
      .setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT)
      .setAlpha(0);
    this.bossMap = bossMap;
    this.maps = [...routeMaps, bossMap];
    this.worldBack = scene.add.container(0, 0);
    this.actors = scene.add.container(0, 0);
    this.worldFront = scene.add.container(0, 0);
    this.hudLayer = scene.add.container(0, 0);
    this.bossPatternLayer = scene.add.container(0, 0);

    if (hasSquadTraces) {
      ["rook", "nyx", "moss"].forEach((id, column) => {
        const image = scene.add.image(0, 0, ASSET_KEYS.squadTraces).setVisible(false);
        setAtlasFrame(image, column, 0);
        this.traceSprites.set(id, image);
        this.worldBack.add(image);
      });
    }

    this.shadowGraphics = scene.add.graphics();
    this.telegraphGraphics = scene.add.graphics();
    this.effectGraphics = scene.add.graphics();
    this.manualAbilityGraphics = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    this.projectileGraphics = scene.add.graphics();
    this.impactGraphics = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    this.foregroundGraphics = scene.add.graphics();
    this.hudGraphics = scene.add.graphics();
    this.worldBack.add([this.shadowGraphics, this.telegraphGraphics, this.bossPatternLayer, this.effectGraphics, this.manualAbilityGraphics]);
    this.worldFront.add([this.projectileGraphics, this.impactGraphics, this.foregroundGraphics]);
    this.hudLayer.add(this.hudGraphics);

    this.muzzleFlash = scene.add.image(0, 0, ASSET_KEYS.combatFx)
      .setVisible(false)
      .setBlendMode(Phaser.BlendModes.ADD);
    setAtlasFrame(this.muzzleFlash, 0, 1);
    this.worldFront.add(this.muzzleFlash);

    this.playerGhosts = Array.from({ length: 3 }, () => {
      const ghost = scene.add.image(0, 0, ASSET_KEYS.playerMotion).setVisible(false).setBlendMode(Phaser.BlendModes.ADD);
      this.actors.add(ghost);
      return ghost;
    });
    this.player = scene.add.image(WIDTH / 2, HEIGHT / 2, ASSET_KEYS.playerMotion);
    const bossFormsTexture = scene.textures.exists(regionAssets.bossForms) ? regionAssets.bossForms : ASSET_KEYS.playerMotion;
    this.boss = scene.add.image(0, 0, bossFormsTexture).setVisible(false);
    this.bossPhaseArt = scene.add.image(0, 0, bossFormsTexture).setVisible(false).setBlendMode(Phaser.BlendModes.ADD);
    this.actors.add([this.player, this.boss, this.bossPhaseArt]);

    this.damageTexts = Array.from({ length: 42 }, () => {
      const text = scene.add.text(0, 0, "", {
        fontFamily: "IBM Plex Mono",
        fontSize: "15px",
        fontStyle: "bold",
        color: "#effcff",
        stroke: "#010508",
        strokeThickness: 4,
      }).setOrigin(0.5).setVisible(false);
      this.worldFront.add(text);
      return text;
    });

    this.hudCamera = scene.cameras.add(0, 0, WIDTH, HEIGHT, false, "overload-overlay");
    this.hudCamera.ignore([...this.maps, this.worldBack, this.actors, this.worldFront]);
    this.mainCamera.ignore([this.hudLayer]);
  }

  private prepareAtlas(key: string, columns: number, rows: number) {
    if (this.preparedAtlases.has(key)) return true;
    if (!this.scene.textures.exists(key)) return false;
    ensureAtlasFrames(this.scene, key, columns, rows);
    this.preparedAtlases.add(key);
    return true;
  }

  private preparePixelAtlas(key: string, columns: number, rows: number) {
    if (!this.prepareAtlas(key, columns, rows)) return false;
    this.scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    return true;
  }

  private isCircleVisible(x: number, y: number, radius = 0, margin = 0) {
    const view = this.mainCamera.worldView;
    const reach = Math.max(0, finite(radius)) + Math.max(0, finite(margin));
    return x + reach >= view.left && x - reach <= view.right
      && y + reach >= view.top && y - reach <= view.bottom;
  }

  private isSegmentVisible(x1: number, y1: number, x2: number, y2: number, margin = 0) {
    const view = this.mainCamera.worldView;
    const reach = Math.max(0, finite(margin));
    return Math.max(x1, x2) + reach >= view.left && Math.min(x1, x2) - reach <= view.right
      && Math.max(y1, y2) + reach >= view.top && Math.min(y1, y2) - reach <= view.bottom;
  }

  activateBossAssets() {
    const { bossRoom, bossForms, bossMotion } = this.regionAssets;
    if (!this.scene.textures.exists(bossRoom) || !this.scene.textures.exists(bossForms)) return false;
    ensureAtlasFrames(this.scene, bossForms, 3, 1);
    const hasMotion = this.prepareAtlas(bossMotion, 6, 4);
    const hasCommonPatterns = this.preparePixelAtlas(ASSET_KEYS.bossPatternCommonPixel, 6, 6);
    const hasRegionalPatterns = this.preparePixelAtlas(ASSET_KEYS.bossPatternRegionalPixel, 6, 4);
    const hasTimedBombs = this.preparePixelAtlas(ASSET_KEYS.bossTimedBombPixel, 6, 2);
    if (hasCommonPatterns && hasRegionalPatterns && this.bossPatternSprites.length === 0) {
      for (let index = 0; index < 16; index += 1) {
        const image = this.scene.add.image(0, 0, ASSET_KEYS.bossPatternCommonPixel)
          .setVisible(false)
          .setBlendMode(Phaser.BlendModes.ADD);
        this.bossPatternSprites.push(image);
        this.bossPatternLayer.add(image);
      }
    }
    if (hasTimedBombs && this.bossTimedBombSprites.length === 0) {
      for (let index = 0; index < 8; index += 1) {
        const image = this.scene.add.image(0, 0, ASSET_KEYS.bossTimedBombPixel)
          .setVisible(false)
          .setBlendMode(Phaser.BlendModes.NORMAL);
        const label = this.scene.add.text(0, 0, "", {
          fontFamily: "IBM Plex Mono, Consolas, monospace",
          fontSize: "30px",
          fontStyle: "bold",
          color: "#ffffff",
          stroke: "#020609",
          strokeThickness: 8,
        }).setOrigin(0.5).setVisible(false);
        this.bossTimedBombSprites.push(image);
        this.bossTimedBombLabels.push(label);
        this.bossPatternLayer.add([image, label]);
      }
    }
    const bossTexture = hasMotion ? bossMotion : bossForms;
    this.bossMap.setTexture(bossRoom).setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT);
    this.boss.setTexture(bossTexture);
    this.bossPhaseArt.setTexture(bossTexture);
    return true;
  }

  impact(event: any) {
    const type = String(event?.type ?? "");
    if (type === "bossIntro") {
      this.bossRevealStartedAt = this.scene.time.now;
      this.bossRevealFromZoom = this.mainCamera.zoom;
    } else if (["bossContact", "bossContactHit", "playerStunned"].includes(type)) {
      this.mainCamera.shake(170, 0.0085);
      this.hudCamera.flash(90, 255, 42, 68, false);
      this.spawnFx("playerHit", this.player.x, this.player.y, COLORS.red, 1.2);
    } else if (["bossStage", "bossStagePulse", "overdrive", "skillMastered"].includes(type)) {
      this.mainCamera.shake(250, type === "bossStage" ? 0.012 : 0.006);
      this.hudCamera.flash(120, type === "overdrive" ? 88 : 255, type === "overdrive" ? 242 : 70, type === "overdrive" ? 255 : 80, false);
      if (type === "bossStage") this.spawnFx("phaseBreak", this.boss.x, this.boss.y, COLORS.red, 2.25);
    } else if (type === "dash") {
      this.mainCamera.shake(90, 0.0025);
    } else if (type === "bossPatternFire" || type === "bossRageBurst") {
      this.spawnFx("weaponBlast", this.boss.x, this.boss.y, COLORS.red, type === "bossRageBurst" ? 1.8 : 1.25);
    } else if (type === "bossParryWindow") {
      this.mainCamera.shake(150, 0.0035);
      this.hudCamera.flash(85, 225, 246, 255, false);
    } else if (type === "bossParrySuccess") {
      this.mainCamera.shake(320, 0.014);
      this.hudCamera.flash(150, 190, 255, 255, false);
      this.spawnFx("phaseBreak", this.player.x, this.player.y, COLORS.cyan, 1.8);
      this.spawnFx("bossBurst", this.boss.x, this.boss.y, COLORS.white, 2.1);
    } else if (type === "bossParryFailed" || type === "bossBombSequenceFailed") {
      this.mainCamera.shake(380, 0.018);
      this.hudCamera.flash(180, 255, 42, 68, false);
      this.spawnFx("playerHit", this.player.x, this.player.y, COLORS.red, 1.7);
    } else if (type === "bossSiren") {
      this.mainCamera.shake(460, 0.0065);
      this.hudCamera.flash(130, 255, 32, 55, false);
    } else if (type === "bossBombDefused" || type === "bossBombSequenceCleared") {
      this.spawnFx("weaponBlast", type === "bossBombDefused" ? finite(event?.x, this.player.x) : this.boss.x, type === "bossBombDefused" ? finite(event?.y, this.player.y) : this.boss.y, COLORS.green, type === "bossBombDefused" ? 0.8 : 1.9);
    } else if (type === "enemySelfDestruct") {
      this.mainCamera.shake(180, event?.elite ? 0.011 : 0.0075);
    } else if (type === "healthKitPicked") {
      this.spawnFx("weaponBlast", finite(event?.x), finite(event?.y), COLORS.green, 0.95);
    } else if (type === "routeClearWarning") {
      this.mainCamera.shake(260, 0.006);
      this.hudCamera.flash(120, 255, 190, 72, false);
      this.spawnFx("weaponBlast", this.player.x, this.player.y, COLORS.amber, 1.35);
    } else if (type === "routeClearPanic") {
      this.mainCamera.shake(420, 0.009);
      this.hudCamera.flash(150, 255, 50, 82, false);
      this.spawnFx("playerHit", this.player.x, this.player.y, COLORS.red, 1.3);
    } else if (type === "bossAutoTransition") {
      this.hudCamera.flash(180, 104, 239, 255, false);
    }
  }

  render(state: any, quality: QualityPreset) {
    const time = finite(state?.time);
    this.currentQualityId = quality.id ?? "balanced";
    this.syncCamera(state);
    this.syncTraceProps(state);

    this.syncPlayer(state, time, quality);
    this.syncBoss(state, time);
    this.syncEnemies(state, time, quality);
    this.syncAllies(state, time, quality);
    this.drawShadows(state, quality);
    this.drawTelegraphs(state, time, quality);
    this.syncBossPatternSprites(state, time, quality);
    this.syncBossTimedBombSprites(state, time);
    // PERFORMANCE keeps authoritative danger geometry and actor movement at
    // the scene cadence, while retaining cosmetic Graphics/sprite state for a
    // bounded 30 Hz update. This halves the busiest VFX rebuild path without
    // making telegraphs, the player, enemies, or the boss less responsive.
    const cosmeticTick = this.currentQualityId === "performance"
      ? Math.floor(this.scene.time.now / (1000 / 30))
      : Math.floor(this.scene.time.now);
    if (cosmeticTick !== this.lastCosmeticTick) {
      this.lastCosmeticTick = cosmeticTick;
      this.drawWorldEffects(state, time, quality);
    }
    this.drawProjectiles(state, quality);
    this.drawImpactFx(this.scene.time.now / 1000, quality);
    this.drawForeground(state, time, quality);
    this.drawDamageTexts(state, quality);
    this.drawHudOverlay(state, time);
  }

  private syncTraceProps(state: any) {
    for (const image of this.traceSprites.values()) image.setVisible(false);
    const expedition = state?.expedition;
    if (!expedition || expedition?.bossRoom || state?.phase === "boss") return;
    const view = this.mainCamera.worldView;
    const distance = finite(expedition.distance);
    const originX = finite(expedition.originX);
    for (const trace of expedition.traces ?? []) {
      const image = this.traceSprites.get(String(trace?.id ?? ""));
      if (!image) continue;
      const x = originX + finite(trace.distance);
      const y = finite(trace.y, HEIGHT * 0.5);
      if (x < view.left - 180 || x > view.right + 180 || distance > finite(trace.distance) + 430) continue;
      const size = trace.id === "moss" ? 62 : trace.id === "rook" ? 54 : 58;
      image
        .setVisible(true)
        .setPosition(x, y)
        .setDisplaySize(size, size)
        .setAlpha(trace.triggered ? 0.78 : 1)
        .setTint(trace.triggered ? 0xbad1d5 : 0xffffff);
    }
  }

  adjustCameraZoom(deltaY: number) {
    const wheel = clamp(finite(deltaY), -240, 240);
    if (Math.abs(wheel) < 0.01) return this.userZoomFactor;
    this.userZoomFactor = clamp(this.userZoomFactor * Math.exp(-wheel * 0.0014), 0.78, 1.24);
    return this.userZoomFactor;
  }

  syncCamera(state: any) {
    const camera = state?.camera ?? { x: WIDTH / 2, y: HEIGHT / 2, zoom: 1.46 };
    const expedition = state?.expedition;
    const distance = Math.max(0, finite(expedition?.distance));
    const bossGate = Math.max(1, finite(expedition?.bossGate, 6000));
    const bossMapIndex = this.routeMapCount;
    const lastRouteIndex = Math.max(0, this.routeMapCount - 1);
    const segmentLength = bossGate / Math.max(1, this.routeMapCount);
    let sector = clamp(Math.floor(distance / segmentLength), 0, lastRouteIndex);
    let nextSector = sector;
    let blend = 0;
    const bossStageActive = Boolean(expedition?.bossRoom || state?.phase === "boss");
    if (bossStageActive) {
      sector = bossMapIndex;
    } else if (sector < lastRouteIndex) {
      const localProgress = (distance - sector * segmentLength) / segmentLength;
      nextSector = sector + 1;
      const linear = clamp01((localProgress - 0.82) / 0.18);
      blend = linear * linear * (3 - 2 * linear);
    } else {
      // Keep the authored final route texture visible through the clear and
      // entry decision. Crossfading the 1,920px boss room while the camera is
      // still near x=10,680 exposes the camera background as a black void.
      nextSector = lastRouteIndex;
      blend = 0;
    }
    for (let index = 0; index < this.maps.length; index += 1) {
      const alpha = index === sector ? 1 - blend : index === nextSector ? blend : 0;
      const map = this.maps[index];
      map
        .setVisible(alpha > 0.001)
        .setAlpha(alpha);
    }
    const engineZoom = finite(camera.zoom, 1.08);
    const targetZoom = bossStageActive
      ? clamp(engineZoom * this.userZoomFactor, 0.68, 0.94)
      : clamp(engineZoom * this.userZoomFactor, 0.84, 1.34);
    const targetX = finite(camera.x, WORLD_WIDTH / 2);
    const targetY = finite(camera.y, WORLD_HEIGHT / 2);
    if (this.bossRevealStartedAt >= 0) {
      const linear = clamp01((this.scene.time.now - this.bossRevealStartedAt) / 1100);
      const eased = linear * linear * (3 - 2 * linear);
      this.mainCamera.setZoom(this.bossRevealFromZoom + (targetZoom - this.bossRevealFromZoom) * eased);
      this.mainCamera.centerOn(targetX, targetY);
      if (linear >= 1) this.bossRevealStartedAt = -1;
    } else {
      this.mainCamera.setZoom(targetZoom);
      this.mainCamera.centerOn(targetX, targetY);
    }
  }

  private syncPlayer(state: any, time: number, quality: QualityPreset) {
    const entity = state.player;
    const isHit = finite(entity?.hitFlash) > 0.03 || finite(entity?.hitStun) > 0.02 || finite(entity?.stunTimer) > 0.03;
    if (isHit && !this.playerWasHit) this.spawnFx("playerHit", finite(entity?.x), finite(entity?.y), COLORS.red, 1);
    this.playerWasHit = isHit;
    const selectedClip = selectActorClip(ACTOR_ANIMATION_PROFILES.hero, entity);
    if (selectedClip.id !== this.playerClipId) {
      this.playerClipId = selectedClip.id;
      this.playerClipStartedAt = time;
    }
    const clipElapsed = resolveHeroClipElapsedSeconds(selectedClip.id, entity, time - this.playerClipStartedAt);
    const animation = sampleActorAnimation("hero", entity, clipElapsed);
    const directionalFrame = resolveHeroDirectionalAimFrame(animation, entity);
    const usesDirectionalAtlas = Boolean(directionalFrame && this.preparedAtlases.has(ASSET_KEYS.playerDirectionalAim));
    const playerTexture = usesDirectionalAtlas ? ASSET_KEYS.playerDirectionalAim : ASSET_KEYS.playerMotion;
    if (this.player.texture.key !== playerTexture) this.player.setTexture(playerTexture);
    const playerFrame = directionalFrame ?? animation.fallbackAtlasFrame;
    setAtlasFrame(this.player, playerFrame.column, playerFrame.row);
    const size = state?.phase === "boss" ? 64 : 74;
    const recoil = animation.clipId === "attack" ? clamp(finite(entity?.recoil) * 0.55, 0, 2) : 0;
    const angle = actorAngle(entity);
    const presentation = resolveHeroAimPresentation(entity);
    const muzzle = resolveHeroMuzzleAnchor(entity, size);
    const panicActive = String(state?.expedition?.clearTransition?.phase ?? "") === "panic";
    const panicClock = this.scene.time.now / 1000;
    const panicX = panicActive ? Math.sin(panicClock * 57) * 2.1 : 0;
    const panicY = panicActive ? Math.cos(panicClock * 49) * 1.6 : 0;
    this.player
      .setPosition(
        finite(entity?.x) - Math.cos(muzzle.angle) * recoil + panicX,
        finite(entity?.y) - Math.sin(muzzle.angle) * recoil + panicY,
      )
      .setRotation(0)
      .setFlipX(presentation.flipX)
      .setDisplaySize(size, size)
      .setAlpha(entity?.dead ? clamp01(finite(entity?.deathTimer) / 0.9) : 1)
      .setVisible(true)
      .setTint(
        finite(entity?.hitFlash) > 0.03
          ? COLORS.white
          : panicActive && Math.sin(panicClock * 26) > 0
            ? 0xff8da2
            : 0xffffff,
      );

    const muzzleVisible = finite(entity?.attackTimer) > 0.055 && !entity?.dead && finite(entity?.stunTimer) <= 0;
    this.muzzleFlash
      .setVisible(muzzleVisible)
      .setPosition(finite(entity?.x) + muzzle.x, finite(entity?.y) + muzzle.y)
      .setRotation(muzzle.angle)
      .setDisplaySize(38, 22)
      .setAlpha(clamp(0.55 + finite(entity?.attackTimer) * 2.4, 0.55, 1));

    const dash = animation.clipId === "dash";
    const motionAngle = Math.hypot(finite(entity?.vx), finite(entity?.vy)) > 1
      ? Math.atan2(finite(entity?.vy), finite(entity?.vx))
      : angle;
    const ghostCount = quality.id === "performance" ? 1 : quality.id === "cinematic" ? 3 : 2;
    for (let index = 0; index < this.playerGhosts.length; index += 1) {
      const ghost = this.playerGhosts[index];
      if (!dash || index >= ghostCount) {
        ghost.setVisible(false);
        continue;
      }
      if (ghost.texture.key !== ASSET_KEYS.playerMotion) ghost.setTexture(ASSET_KEYS.playerMotion);
      setAtlasFrame(ghost, Math.max(0, animation.clipFrameIndex - index - 1), HERO_MOTION_ROWS.dash);
      const distance = 22 + index * 20;
      ghost
        .setVisible(true)
        .setPosition(entity.x - Math.cos(motionAngle) * distance, entity.y - Math.sin(motionAngle) * distance)
        .setRotation(0)
        .setFlipX(presentation.flipX)
        .setDisplaySize(size * (0.94 - index * 0.08), size * (0.94 - index * 0.08))
        .setAlpha(0.2 - index * 0.045)
        .setTint(COLORS.cyan);
    }
  }

  private syncBoss(state: any, time: number) {
    const entity = state.boss;
    // Boss art is intentionally lazy-loaded after the entry confirmation. The
    // constructor uses the hero atlas only as a valid Phaser texture handle;
    // never expose that placeholder as a giant boss while a debug/terminal
    // scene is waiting for its regional bundle.
    const bossTextureReady = this.boss.texture.key === this.regionAssets.bossMotion
      || this.boss.texture.key === this.regionAssets.bossForms;
    const visible = Boolean(entity?.active || entity?.dead) && bossTextureReady;
    this.boss.setVisible(visible);
    this.bossPhaseArt.setVisible(false);
    if (!visible) return;
    const stage = clamp(Math.floor(finite(entity?.stage, 1)), 1, 3);
    const selectedClip = selectActorClip(ACTOR_ANIMATION_PROFILES.boss, entity);
    if (selectedClip.id !== this.bossClipId) {
      this.bossClipId = selectedClip.id;
      this.bossClipStartedAt = time;
    }
    const clipElapsed = resolveBossClipElapsedSeconds(
      selectedClip.id,
      entity,
      Math.max(0, time - this.bossClipStartedAt),
    );
    const animation = sampleActorAnimation("boss", entity, clipElapsed);
    const usesDedicatedMotion = this.boss.texture.key === this.regionAssets.bossMotion;
    const bossFrame = usesDedicatedMotion
      ? resolveDedicatedAtlasFrame("boss", animation, entity)
      : animation.fallbackAtlasFrame;
    setAtlasFrame(this.boss, bossFrame.column, bossFrame.row);
    setAtlasFrame(this.bossPhaseArt, bossFrame.column, bossFrame.row);
    const isHit = finite(entity?.hitFlash) > 0.04;
    if (isHit && !this.bossWasHit) this.spawnFx("bossHit", finite(entity?.x), finite(entity?.y), COLORS.red, 1.45);
    if (entity?.dead && !this.bossWasDead) this.spawnFx("bossBurst", finite(entity?.x), finite(entity?.y), COLORS.amber, 3.1);
    if (stage !== this.lastPhase) this.spawnFx("phaseBreak", finite(entity?.x), finite(entity?.y), COLORS.red, 2.35);
    this.bossWasHit = isHit;
    this.bossWasDead = Boolean(entity?.dead);
    const clipProgress = animation.clip.frameCount > 1
      ? animation.clipFrameIndex / (animation.clip.frameCount - 1)
      : 0;
    const signalWave = 0.5 + Math.sin(clipElapsed * Math.PI * 2 * 3.5) * 0.5;
    let targetScale = 1;
    let recoilDistance = 0;
    let rotationPulse = 0;
    if (animation.clipId === "windup") {
      targetScale = 1 + clipProgress * 0.04 + signalWave * 0.018;
      rotationPulse = Math.sin(clipElapsed * 12) * 0.012;
    } else if (animation.clipId === "attack") {
      targetScale = 1 + signalWave * 0.035;
      recoilDistance = clamp(finite(entity?.recoil), 0, 2) * 11;
      rotationPulse = Math.sin(clipElapsed * 18) * 0.016;
    } else if (animation.clipId === "transform") {
      targetScale = 1 + Math.sin(time * 22) * 0.055;
      rotationPulse = Math.sin(clipElapsed * 10) * 0.022;
    } else if (animation.clipId === "hit") {
      targetScale = 0.965 + clipProgress * 0.035;
      recoilDistance = 4 * (1 - clipProgress);
      rotationPulse = Math.sin(clipElapsed * 34) * 0.018 * (1 - clipProgress);
    } else if (animation.clipId === "death") {
      targetScale = 1 - clipProgress * 0.09;
      rotationPulse = Math.sin(clipElapsed * 7) * 0.01 * (1 - clipProgress);
    } else if (animation.clipId === "idle") {
      targetScale = 1 + Math.sin(time * 2.4) * 0.008;
    }
    this.bossVisualScale += (targetScale - this.bossVisualScale) * 0.18;
    const alpha = entity?.dead ? clamp01(finite(entity?.deathTimer) / Math.max(0.01, finite(entity?.deathDuration, 1.25))) : 1;
    const bossSize = stage === 3 ? 640 : stage === 2 ? 560 : 480;
    const angle = actorAngle(entity);
    const rotationStep = animation.clipId === "windup" ? 0.035 : animation.clipId === "attack" ? 0.065 : 0.09;
    const visualAngle = Phaser.Math.Angle.RotateTo(this.boss.rotation, angle, rotationStep) + rotationPulse;
    this.boss
      .setPosition(
        finite(entity?.x) - Math.cos(angle) * recoilDistance,
        finite(entity?.y) - Math.sin(angle) * recoilDistance,
      )
      .setRotation(visualAngle)
      .setDisplaySize(bossSize * this.bossVisualScale, bossSize * this.bossVisualScale)
      .setAlpha(alpha)
      .setTint(finite(entity?.hitFlash) > 0.04 ? COLORS.white : 0xffffff);

    if (stage !== this.lastPhase || finite(entity?.transformTimer) > 0) {
      this.bossPhaseArt
        .setVisible(true)
        .setPosition(entity.x, entity.y)
        .setRotation(visualAngle)
        .setDisplaySize((bossSize + 26) * this.bossVisualScale, (bossSize + 26) * this.bossVisualScale)
        .setAlpha(clamp01(finite(entity?.transformTimer) / Math.max(0.01, finite(entity?.transformDuration, 1.8))) * 0.74)
        .setTint(stage >= 3 ? COLORS.amber : COLORS.white);
    }
    this.lastPhase = stage;
  }

  private syncEnemies(state: any, time: number, quality: QualityPreset) {
    for (const record of this.enemySprites.values()) {
      record.seen = false;
      record.live = false;
    }
    const enemies = Array.isArray(state?.enemies) ? state.enemies : [];
    const view = this.mainCamera.worldView;
    const margin = 120;
    const animationHz = quality.id === "performance" ? 10 : quality.id === "cinematic" ? 24 : 16;
    let visibleEnemyCount = 0;
    for (let index = 0; index < enemies.length; index += 1) {
      const entity = enemies[index];
      const id = finite(entity?.id, index + 1);
      let record = this.enemySprites.get(id);
      if (record) record.live = true;
      const x = finite(entity?.x);
      const y = finite(entity?.y);
      const inView = x >= view.left - margin && x <= view.right + margin
        && y >= view.top - margin && y <= view.bottom + margin;
      const isHit = finite(entity?.hitFlash) > 0.04;
      const isDead = Boolean(entity?.dead);
      const role = record?.roleIndex ?? enemyRoleIndex(entity);
      if (!inView) {
        if (record) {
          record.image.setVisible(false);
          record.wasHit = isHit;
          record.wasDead = isDead;
        }
        continue;
      }
      visibleEnemyCount += 1;
      const profile = getActorAnimationProfile("enemy", entity);
      const selectedClip = selectActorClip(profile, entity);
      if (!record) {
        const motionTexture = enemyMotionTexture(entity);
        const texture = this.scene.textures.exists(motionTexture) ? motionTexture : enemyFallbackTexture(entity);
        const image = this.enemyPool.pop() ?? this.scene.add.image(0, 0, texture);
        if (!image.parentContainer) this.actors.add(image);
        image.setTexture(texture);
        record = {
          image,
          seen: false,
          live: true,
          wasHit: isHit,
          wasDead: isDead,
          currentClipId: selectedClip.id,
          clipStartedAt: time,
          animationTick: -1,
          frameColumn: 0,
          frameRow: 0,
          roleIndex: role,
        };
        this.enemySprites.set(id, record);
      }
      record.seen = true;
      record.live = true;
      const image = record.image;
      const clipElapsed = updateClipClock(record, selectedClip.id, time);
      const phaseOffset = selectedClip.loop ? Math.abs(Math.trunc(id * 3.17)) % selectedClip.frameCount : 0;
      const motionTexture = enemyMotionTexture(entity);
      const usesDedicatedMotion = this.preparedAtlases.has(motionTexture);
      const texture = usesDedicatedMotion ? motionTexture : enemyFallbackTexture(entity);
      if (image.texture.key !== texture) image.setTexture(texture);
      if (isHit && !record.wasHit) this.spawnFx("armorHit", x, y, entity?.elite ? COLORS.amber : COLORS.red, entity?.elite ? 1.3 : 0.85);
      if (isDead && !record.wasDead) this.spawnFx("enemyBurst", x, y, entity?.elite ? COLORS.amber : COLORS.red, entity?.elite ? 1.55 : 0.9);
      record.wasHit = isHit;
      record.wasDead = isDead;
      if (usesDedicatedMotion) {
        const animationTick = Math.floor(clipElapsed * animationHz);
        if (record.animationTick !== animationTick) {
          const animation = sampleActorAnimation("enemy", entity, clipElapsed, phaseOffset);
          const frame = resolveDedicatedAtlasFrame("enemy", animation, entity);
          record.animationTick = animationTick;
          record.frameColumn = frame.column;
          record.frameRow = frame.row;
        }
        setAtlasFrame(image, record.frameColumn, record.frameRow);
      }
      const baseSize = role === 2 ? 138 : role === 1 ? 108 : 92;
      const materialize = finite(entity?.spawnDuration) > 0
        ? clamp01(1 - finite(entity?.spawnDelay) / Math.max(0.01, finite(entity?.spawnDuration)))
        : 1;
      const size = baseSize * (entity?.elite ? 1.16 : 1) * (0.72 + materialize * 0.28);
      const alpha = (entity?.dead ? clamp01(finite(entity?.deathTimer) / (entity?.elite ? 0.46 : 0.32)) : 1)
        * clamp01((materialize - 0.08) / 0.72);
      image
        .setVisible(true)
        .setPosition(x, y)
        .setRotation(actorAngle(entity))
        .setFlipX(false)
        .setDisplaySize(size, size)
        .setAlpha(alpha)
        .setTint(entity?.elite ? COLORS.amber : finite(entity?.hitFlash) > 0.04 ? COLORS.white : 0xffffff);
    }
    for (const [id, record] of this.enemySprites) {
      if (record.live) {
        if (!record.seen) record.image.setVisible(false);
        continue;
      }
      record.image.setVisible(false);
      this.enemyPool.push(record.image);
      this.enemySprites.delete(id);
    }
    this.visibleEnemyCount = visibleEnemyCount;
  }

  private syncAllies(state: any, time: number, quality: QualityPreset) {
    for (const record of this.allySprites.values()) record.seen = false;
    const animationHz = quality.id === "performance" ? 10 : quality.id === "cinematic" ? 24 : 16;
    let fallbackId = -1;
    for (let collectionIndex = 0; collectionIndex < 2; collectionIndex += 1) {
      const collection = collectionIndex === 0 ? state?.allies : state?.deployables;
      if (!Array.isArray(collection)) continue;
      for (const entity of collection) {
        const id = finite(entity?.id, fallbackId--);
        const x = finite(entity?.x);
        const y = finite(entity?.y);
        if (!this.isCircleVisible(x, y, 96, 80)) continue;
        let record = this.allySprites.get(id);
        const motionTexture = allyMotionTexture(entity);
        const usesDedicatedMotion = Boolean(motionTexture && this.prepareAtlas(motionTexture, 5, 4));
        const texture = usesDedicatedMotion && motionTexture ? motionTexture : allyFallbackTexture(entity);
        const selectedClip = selectActorClip(ACTOR_ANIMATION_PROFILES.ally, entity);
        if (!record) {
          const image = this.allyPool.pop() ?? this.scene.add.image(0, 0, texture);
          if (!image.parentContainer) this.actors.add(image);
          image.setTexture(texture);
          record = {
            image,
            seen: false,
            live: true,
            wasHit: false,
            wasDead: false,
            currentClipId: selectedClip.id,
            clipStartedAt: time,
            animationTick: -1,
            frameColumn: 0,
            frameRow: 0,
            roleIndex: -1,
          };
          this.allySprites.set(id, record);
        } else if (record.image.texture.key !== texture) record.image.setTexture(texture);
        record.seen = true;
        const clipElapsed = updateClipClock(record, selectedClip.id, time);
        const phaseOffset = selectedClip.loop ? Math.abs(Math.trunc(id * 2.41)) % selectedClip.frameCount : 0;
        if (usesDedicatedMotion) {
          const animationTick = Math.floor(clipElapsed * animationHz);
          if (record.animationTick !== animationTick) {
            const animation = sampleActorAnimation("ally", entity, clipElapsed, phaseOffset);
            const frame = resolveDedicatedAtlasFrame("ally", animation, entity);
            record.animationTick = animationTick;
            record.frameColumn = frame.column;
            record.frameRow = frame.row;
          }
          setAtlasFrame(record.image, record.frameColumn, record.frameRow);
        }
        const type = String(entity?.type ?? "").toLowerCase();
        const humanoid = ["gunner", "arcanist", "warden", "vanguard"].some((token) => type.includes(token));
        const size = type.includes("sentry") ? 58 : type.includes("emp") ? 58 : humanoid ? 64 : 48;
        const angle = actorAngle(entity);
        const stationary = type.includes("sentry") || type.includes("emp");
        const moveBlend = clamp01(finite(entity?.moveBlend));
        const spawnLinear = selectedClip.id === "spawn" ? clamp01(clipElapsed / 0.28) : 1;
        const spawnEase = 1 - Math.pow(1 - spawnLinear, 3);
        const spawnScale = 0.62 + spawnEase * 0.38;
        const attackActive = selectedClip.id === "attack" || finite(entity?.attackTimer) > 0;
        const recoil = attackActive ? clamp01(finite(entity?.recoil)) : 0;
        const pulseAttack = String(entity?.attackState ?? "").includes("pulse");
        const pulse = attackActive ? (0.5 + Math.sin(clipElapsed * (pulseAttack ? 30 : 38)) * 0.5) : 0;
        const attackScale = 1 + pulse * (pulseAttack ? 0.085 : 0.035) + recoil * 0.025;
        const hover = stationary ? 0 : Math.sin(time * 4 + id) * 1.2 * (1 - moveBlend);
        const recoilDistance = recoil * (humanoid ? 3.2 : 2.2);
        const visualAngle = Phaser.Math.Angle.RotateTo(record.image.rotation, angle, stationary ? 0.2 : 0.16);
        record.image
          .setVisible(true)
          .setPosition(
            x - Math.cos(angle) * recoilDistance,
            y - Math.sin(angle) * recoilDistance + hover,
          )
          .setRotation(visualAngle)
          .setFlipX(false)
          .setDisplaySize(size * spawnScale * attackScale, size * spawnScale * attackScale)
          .setAlpha(clamp01(finite(entity?.alpha, 1)) * (0.42 + spawnEase * 0.58))
          .setTint(pulseAttack && attackActive ? 0xc8fbff : entity?.summoned ? COLORS.violet : 0xffffff);
      }
    }
    for (const [id, record] of this.allySprites) {
      if (record.seen) continue;
      record.image.setVisible(false);
      this.allyPool.push(record.image);
      this.allySprites.delete(id);
    }
  }

  private drawShadows(state: any, quality: QualityPreset) {
    const graphics = this.shadowGraphics;
    graphics.clear();
    if (quality.shadows === false) return;
    graphics.fillStyle(0x000000, 0.34);
    const enemies = state?.enemies ?? [];
    const shadowStride = this.visibleEnemyCount > 120 ? 3 : this.visibleEnemyCount > 72 ? 2 : 1;
    for (let index = 0; index < enemies.length; index += shadowStride) {
      const enemy = enemies[index];
      if (enemy?.dead || finite(enemy?.spawnDelay) > 0) continue;
      const x = finite(enemy.x);
      const y = finite(enemy.y);
      const radius = finite(enemy.radius, 16);
      if (!this.isCircleVisible(x, y, radius * 1.4, 48)) continue;
      graphics.fillEllipse(x + 4, y + 10, radius * 2.6, radius * 0.85);
    }
    const player = state?.player;
    graphics.fillEllipse(finite(player?.x) + 4, finite(player?.y) + 13, 66, 20);
    if (state?.boss?.active) graphics.fillEllipse(finite(state.boss.x) + 8, finite(state.boss.y) + 34, 238, 72);
  }

  private placeBossPatternSprite(
    index: number,
    texture: string,
    frame: Readonly<{ column: number; row: number }>,
    x: number,
    y: number,
    size: number,
    rotation: number,
    alpha: number,
  ) {
    const image = this.bossPatternSprites[index];
    if (!image) return index;
    if (image.texture.key !== texture) image.setTexture(texture);
    setAtlasFrame(image, frame.column, frame.row);
    image
      .setPosition(x, y)
      .setDisplaySize(size, size)
      .setRotation(rotation)
      .setAlpha(alpha)
      .setVisible(true);
    return index + 1;
  }

  private syncBossPatternSprites(state: any, time: number, quality: QualityPreset) {
    let cursor = 0;
    const pattern = state?.boss?.activePattern;
    const resolved = resolveBossPatternAtlasFrame(pattern?.type, pattern ?? {});
    const cap = quality.id === "performance" ? 8 : this.bossPatternSprites.length;
    if (pattern && resolved && cap > 0) {
      const type = String(pattern.type ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase();
      const geometry = pattern.geometry ?? {};
      const texture = resolved.atlas === "regional"
        ? ASSET_KEYS.bossPatternRegionalPixel
        : ASSET_KEYS.bossPatternCommonPixel;
      const active = String(pattern.phase ?? "warning").toLowerCase() === "active";
      const alpha = active ? 0.9 : 0.7 + Math.sin(time * 12) * 0.12;
      const targetPattern = type.includes("bomb")
        || type.includes("solarflare")
        || type.includes("mirrorshards")
        || type.includes("archiveecho");

      if (targetPattern && Array.isArray(pattern.targets)) {
        for (const target of pattern.targets) {
          if (cursor >= cap) break;
          if (target?.detonated) continue;
          const radius = finite(target?.radius, finite(pattern.radius, 72));
          cursor = this.placeBossPatternSprite(
            cursor,
            texture,
            resolved,
            finite(target?.x),
            finite(target?.y),
            clamp(radius * 1.55, 88, 154),
            0,
            alpha,
          );
        }
      } else {
        let x = finite(geometry.centerX, finite(geometry.originX, finite(pattern.x, finite(state?.boss?.x))));
        let y = finite(geometry.centerY, finite(geometry.originY, finite(pattern.y, finite(state?.boss?.y))));
        let size = 132;
        let rotation = 0;
        const bossX = finite(state?.boss?.x, x);
        const bossY = finite(state?.boss?.y, y);
        const bossRadius = Math.max(72, finite(state?.boss?.radius, 120));
        const pointerAngle = Math.atan2(finite(state?.player?.y) - bossY, finite(state?.player?.x) - bossX);
        const patternAngle = finite(geometry.baseAngle, finite(geometry.angle, finite(pattern.angle, pointerAngle)));
        const patternOffset = Math.max(230, bossRadius * 2.15);
        const placeOutsideBoss = (angle: number) => {
          x = bossX + Math.cos(angle) * patternOffset;
          y = bossY + Math.sin(angle) * patternOffset;
        };
        if (type.includes("charge")) {
          placeOutsideBoss(patternAngle);
          size = 104;
          rotation = patternAngle;
        } else if (type.includes("sweep")) {
          placeOutsideBoss(patternAngle);
          size = 116;
          rotation = patternAngle;
        } else if (type.includes("prismlattice")) {
          size = 158;
        } else if (type.includes("memoryspiral")) {
          placeOutsideBoss(patternAngle + time * 0.18);
          size = 166;
          rotation = patternAngle + time * 0.55;
        } else if (type.includes("depthcollapse") || type.includes("ring")) {
          placeOutsideBoss(pointerAngle);
          size = 172;
        } else if (type.includes("radial")) {
          placeOutsideBoss(patternAngle);
          size = 148;
          rotation = patternAngle + time * 0.18;
        }
        cursor = this.placeBossPatternSprite(cursor, texture, resolved, x, y, size, rotation, alpha);
      }
    }
    for (let index = cursor; index < this.bossPatternSprites.length; index += 1) {
      this.bossPatternSprites[index].setVisible(false);
    }
  }

  private syncBossTimedBombSprites(state: any, time: number) {
    let cursor = 0;
    const sequence = state?.boss?.bombSequence;
    if (sequence && Array.isArray(sequence.bombs)) {
      const phase = String(sequence.phase ?? "siren");
      const urgency = clamp01(1 - finite(sequence.timer) / Math.max(0.001, finite(sequence.duration, 1)));
      for (const bomb of sequence.bombs) {
        if (cursor >= this.bossTimedBombSprites.length || bomb?.exploded) break;
        const image = this.bossTimedBombSprites[cursor];
        const label = this.bossTimedBombLabels[cursor];
        const defused = Boolean(bomb?.defused);
        let column = defused ? 4 : 0;
        if (!defused && phase === "siren") column = Math.min(3, Math.floor(clamp01(finite(sequence.progress)) * 4));
        if (!defused && phase === "armed") {
          const blink = Math.floor(time * (urgency > 0.66 ? 12 : 7)) % 2;
          column = urgency > 0.72 ? 3 - blink : 1 + blink;
        }
        setAtlasFrame(image, column, 0);
        image
          .setPosition(finite(bomb?.x), finite(bomb?.y))
          .setDisplaySize(112, 112)
          .setAlpha(defused ? 0.62 : 1)
          .setVisible(true)
          .clearTint();
        label
          .setPosition(finite(bomb?.x), finite(bomb?.y) - 2)
          .setText(defused ? "✓" : String(bomb?.order ?? cursor + 1))
          .setColor(defused ? "#8dffd0" : urgency > 0.72 ? "#fff1d0" : "#ffffff")
          .setAlpha(defused ? 0.74 : 1)
          .setVisible(true);
        cursor += 1;
      }
    } else {
      const bursts = Array.isArray(state?.bossBombBursts) ? state.bossBombBursts : [];
      for (const burstFx of bursts) {
        if (cursor >= this.bossTimedBombSprites.length) break;
        const image = this.bossTimedBombSprites[cursor];
        const progress = clamp01(1 - finite(burstFx?.life) / Math.max(0.001, finite(burstFx?.maxLife, 0.72)));
        setAtlasFrame(image, Math.min(5, Math.floor(progress * 6)), 1);
        image
          .setPosition(finite(burstFx?.x), finite(burstFx?.y))
          .setDisplaySize(150 + progress * 180, 150 + progress * 180)
          .setAlpha(clamp01(1 - Math.max(0, progress - 0.72) / 0.28))
          .setVisible(true)
          .clearTint();
        this.bossTimedBombLabels[cursor].setVisible(false);
        cursor += 1;
      }
    }
    for (let index = cursor; index < this.bossTimedBombSprites.length; index += 1) {
      this.bossTimedBombSprites[index].setVisible(false);
      this.bossTimedBombLabels[index].setVisible(false);
    }
  }

  private drawTelegraphs(state: any, time: number, quality: QualityPreset) {
    const graphics = this.telegraphGraphics;
    graphics.clear();
    const reducedDecoration = quality.id === "performance";
    // Friendly ultimates own their complete warning/impact presentation in the
    // authored motion atlas. Keeping them out of this primitive pass prevents
    // the old amber circle fallback from sitting on top of the real animation.
    const items = state?.telegraphs ?? [];
    for (const item of items) {
      if (!item) continue;
      const type = String(item.type ?? item.kind ?? "circle").toLowerCase();
      const progress = clamp01(1 - finite(item.life) / Math.max(0.001, finite(item.maxLife, 1)));
      const pulse = 0.58 + Math.sin(time * 18 + finite(item.x)) * 0.22;
      const geometry = item.geometry;
      if ((type.includes("prismlattice") || type.includes("refractionsweep")) && Array.isArray(geometry?.lanes)) {
        for (const lane of geometry.lanes) {
          const width = Math.max(8, finite(lane.beamHalfWidth, 24) * 2);
          graphics.lineStyle(width * 1.45, COLORS.cyan, 0.055 + progress * 0.09);
          graphics.lineBetween(lane.startX, lane.startY, lane.endX, lane.endY);
          graphics.lineStyle(Math.max(3, width * 0.12), progress > 0.72 ? COLORS.white : COLORS.cyan, 0.72 + pulse * 0.22);
          graphics.lineBetween(lane.startX, lane.startY, lane.endX, lane.endY);
          if (!reducedDecoration || Math.abs(Math.trunc(finite(lane.index))) % 2 === 0) {
            const travel = (time * 0.9 + finite(lane.index) * 0.31) % 1;
            const markerX = lane.startX + (lane.endX - lane.startX) * travel;
            const markerY = lane.startY + (lane.endY - lane.startY) * travel;
            graphics.fillStyle(COLORS.white, 0.86);
            graphics.fillCircle(markerX, markerY, 4 + progress * 3);
          }
        }
        graphics.lineStyle(2, COLORS.white, 0.7 + pulse * 0.22);
        const diamond = 34 - progress * 12;
        graphics.lineBetween(geometry.centerX, geometry.centerY - diamond, geometry.centerX + diamond, geometry.centerY);
        graphics.lineBetween(geometry.centerX + diamond, geometry.centerY, geometry.centerX, geometry.centerY + diamond);
        graphics.lineBetween(geometry.centerX, geometry.centerY + diamond, geometry.centerX - diamond, geometry.centerY);
        graphics.lineBetween(geometry.centerX - diamond, geometry.centerY, geometry.centerX, geometry.centerY - diamond);
        continue;
      }
      if (type.includes("memoryspiral") && Array.isArray(geometry?.segments)) {
        for (const segment of geometry.segments) {
          const width = Math.max(7, finite(geometry.beamHalfWidth, 22) * 2);
          graphics.lineStyle(width * 1.35, COLORS.violet, 0.06 + progress * 0.08);
          graphics.lineBetween(segment.startX, segment.startY, segment.endX, segment.endY);
          graphics.lineStyle(Math.max(2, width * 0.1), progress > 0.78 ? COLORS.white : COLORS.violet, 0.7 + pulse * 0.18);
          graphics.lineBetween(segment.startX, segment.startY, segment.endX, segment.endY);
          const nodeCount = reducedDecoration ? 2 : 4;
          for (let node = 1; node <= nodeCount; node += 1) {
            const t = ((node / (nodeCount + 1)) + time * 0.24) % 1;
            const x = segment.startX + (segment.endX - segment.startX) * t;
            const y = segment.startY + (segment.endY - segment.startY) * t;
            graphics.fillStyle(node % 2 ? COLORS.cyan : COLORS.violet, 0.48 + pulse * 0.25);
            graphics.fillCircle(x, y, 3 + node * 0.55);
          }
        }
        graphics.lineStyle(3, COLORS.violet, 0.72);
        graphics.strokeCircle(geometry.centerX, geometry.centerY, Math.max(24, finite(geometry.innerRadius, 48)));
        continue;
      }
      if ((type.includes("depthcollapse") || type.includes("undertow")) && Array.isArray(geometry?.radii)) {
        for (let ring = 0; ring < geometry.radii.length; ring += 1) {
          const radius = finite(geometry.radii[ring]);
          if (radius <= 0) continue;
          const width = Math.max(7, finite(geometry.bandHalfWidth, 20) * 2);
          graphics.lineStyle(width * 1.35, COLORS.violet, 0.055 + progress * 0.085);
          graphics.strokeCircle(geometry.centerX, geometry.centerY, radius);
          graphics.lineStyle(2.5, ring % 2 ? COLORS.cyan : COLORS.violet, 0.68 + pulse * 0.2);
          graphics.strokeCircle(geometry.centerX, geometry.centerY, radius);
          const notchAngle = time * (ring % 2 ? -1.4 : 1.2) + ring * 0.8;
          const notchX = geometry.centerX + Math.cos(notchAngle) * radius;
          const notchY = geometry.centerY + Math.sin(notchAngle) * radius;
          graphics.fillStyle(COLORS.white, 0.84);
          graphics.fillCircle(notchX, notchY, 4);
        }
        continue;
      }
      if ((type.includes("solarflare") || type.includes("mirrorshards") || type.includes("archiveecho")) && Array.isArray(item.targets)) {
        for (let index = 0; index < item.targets.length; index += 1) {
          const target = item.targets[index];
          if (target.detonated) continue;
          const radius = finite(target.radius, finite(item.radius, 72));
          const sequence = clamp01(progress * item.targets.length - index + 1);
          graphics.fillStyle(COLORS.amber, 0.045 + sequence * 0.11);
          graphics.fillCircle(finite(target.x), finite(target.y), radius);
          graphics.lineStyle(4, sequence > 0.72 ? COLORS.white : COLORS.amber, 0.58 + pulse * 0.24);
          graphics.strokeCircle(target.x, target.y, radius);
          graphics.lineStyle(2, COLORS.amber, 0.84);
          graphics.strokeCircle(target.x, target.y, Math.max(7, radius * (1 - sequence * 0.78)));
          graphics.lineBetween(target.x - radius * 0.55, target.y, target.x + radius * 0.55, target.y);
          graphics.lineBetween(target.x, target.y - radius * 0.55, target.x, target.y + radius * 0.55);
        }
        continue;
      }
      if (type.includes("sniper") && geometry) {
        const halfWidth = Math.max(4, finite(geometry.collisionHalfWidth, 7));
        graphics.lineStyle(halfWidth * 4.2, COLORS.red, 0.045 + progress * 0.055);
        graphics.lineBetween(geometry.startX, geometry.startY, geometry.endX, geometry.endY);
        graphics.lineStyle(Math.max(1.5, halfWidth * 0.32), progress > 0.72 ? COLORS.white : COLORS.red, 0.66 + pulse * 0.24);
        graphics.lineBetween(geometry.startX, geometry.startY, geometry.endX, geometry.endY);
        const reticleRadius = 18 - progress * 8;
        graphics.lineStyle(2, progress > 0.72 ? COLORS.white : COLORS.red, 0.88);
        graphics.strokeCircle(geometry.endX, geometry.endY, reticleRadius);
        graphics.lineBetween(geometry.endX - reticleRadius - 9, geometry.endY, geometry.endX - reticleRadius + 4, geometry.endY);
        graphics.lineBetween(geometry.endX + reticleRadius - 4, geometry.endY, geometry.endX + reticleRadius + 9, geometry.endY);
        continue;
      }
      if (type.includes("bomb") || type.includes("airstrike") || Array.isArray(item.targets)) {
        const targets = Array.isArray(item.targets) ? item.targets : [item];
        const friendlyStrike = type.includes("airstrike");
        const warningColor = friendlyStrike ? COLORS.amber : COLORS.red;
        for (const target of targets) {
          const radius = finite(target.radius, finite(item.radius, 65));
          graphics.fillStyle(warningColor, 0.055 + progress * 0.08);
          graphics.fillCircle(finite(target.x), finite(target.y), radius);
          graphics.lineStyle(3, progress > 0.72 ? COLORS.white : warningColor, pulse);
          graphics.strokeCircle(target.x, target.y, radius);
          graphics.lineStyle(1, COLORS.amber, 0.72);
          graphics.strokeCircle(target.x, target.y, Math.max(8, radius * progress));
        }
        continue;
      }
      if (type.includes("sweep") && geometry) {
        const drawLane = (x2: number, y2: number) => {
          graphics.lineStyle(Math.max(4, finite(geometry.collisionHalfWidth, 42) * 2), COLORS.red, 0.11 + progress * 0.08);
          graphics.lineBetween(geometry.originX, geometry.originY, x2, y2);
          graphics.lineStyle(3, progress > 0.7 ? COLORS.white : COLORS.amber, 0.76);
          graphics.lineBetween(geometry.originX, geometry.originY, x2, y2);
        };
        drawLane(geometry.primaryEndX, geometry.primaryEndY);
        if (geometry.secondary) drawLane(geometry.secondaryEndX, geometry.secondaryEndY);
        continue;
      }
      if (type.includes("ring") && geometry) {
        for (const radius of geometry.radii ?? []) {
          if (radius <= 0) continue;
          graphics.lineStyle(Math.max(3, finite(geometry.collisionHalfWidth, 30) * 2), COLORS.red, 0.08 + progress * 0.08);
          graphics.strokeCircle(geometry.centerX, geometry.centerY, radius);
          graphics.lineStyle(2, COLORS.amber, 0.72);
          graphics.strokeCircle(geometry.centerX, geometry.centerY, radius);
        }
        continue;
      }
      if ((type.includes("charge") || type.includes("rush")) && geometry) {
        graphics.lineStyle(Math.max(6, finite(geometry.collisionRadius, 88) * 2), COLORS.red, 0.1 + progress * 0.08);
        graphics.lineBetween(geometry.startX, geometry.startY, geometry.endX, geometry.endY);
        graphics.lineStyle(3, progress > 0.72 ? COLORS.white : COLORS.amber, 0.84);
        graphics.lineBetween(geometry.startX, geometry.startY, geometry.endX, geometry.endY);
        const segments = reducedDecoration ? 5 : 9;
        for (let index = 1; index < segments; index += 1) {
          const t = index / segments;
          const x = geometry.startX + (geometry.endX - geometry.startX) * t;
          const y = geometry.startY + (geometry.endY - geometry.startY) * t;
          graphics.fillStyle(COLORS.amber, 0.45 + ((index + Math.floor(time * 12)) % 3) * 0.16);
          graphics.fillTriangle(x + Math.cos(geometry.angle) * 13, y + Math.sin(geometry.angle) * 13, x + Math.cos(geometry.angle + 2.5) * 11, y + Math.sin(geometry.angle + 2.5) * 11, x + Math.cos(geometry.angle - 2.5) * 11, y + Math.sin(geometry.angle - 2.5) * 11);
        }
        continue;
      }
      const radius = finite(item.radius, 120);
      graphics.fillStyle(COLORS.red, 0.05 + progress * 0.08);
      graphics.fillCircle(finite(item.x), finite(item.y), radius);
      graphics.lineStyle(3, progress > 0.72 ? COLORS.white : COLORS.red, pulse);
      graphics.strokeCircle(finite(item.x), finite(item.y), radius);
      if (type.includes("radial")) {
        const rayCount = reducedDecoration ? 8 : 16;
        for (let ray = 0; ray < rayCount; ray += 1) {
          const angle = finite(item.angle) + ray / rayCount * TAU;
          graphics.lineStyle(1, COLORS.red, 0.45);
          graphics.lineBetween(item.x + Math.cos(angle) * 38, item.y + Math.sin(angle) * 38, item.x + Math.cos(angle) * radius, item.y + Math.sin(angle) * radius);
        }
      }
    }
  }

  private drawWorldEffects(state: any, time: number, quality: QualityPreset) {
    const graphics = this.effectGraphics;
    graphics.clear();
    for (const pickup of state?.pickups ?? []) {
      const x = finite(pickup.x);
      const yBase = finite(pickup.y);
      if (!this.isCircleVisible(x, yBase, 20, 56)) continue;
      const bob = Math.sin(time * 6 + finite(pickup.id)) * 3;
      const y = yBase + bob;
      graphics.fillStyle(COLORS.cyan, 0.22);
      graphics.fillCircle(x, y, 14);
      graphics.fillStyle(COLORS.white, 0.95);
      graphics.fillTriangle(x, y - 7, x + 6, y, x, y + 7);
      graphics.fillTriangle(x, y - 7, x - 6, y, x, y + 7);
    }
    for (const wave of state?.shockwaves ?? []) {
      if (String(wave?.type ?? "").toLowerCase().includes("airstrike")) continue;
      const x = finite(wave.x);
      const y = finite(wave.y);
      const radius = finite(wave.radius, 60);
      if (!this.isCircleVisible(x, y, radius, 32)) continue;
      const alpha = clamp01(finite(wave.life) / Math.max(0.001, finite(wave.maxLife, 1)));
      graphics.lineStyle(Math.max(2, finite(wave.width, 7)), colorNumber(wave.color, wave.enemy ? COLORS.red : COLORS.cyan), alpha);
      graphics.strokeCircle(x, y, radius);
    }
    const particleCap = Math.floor(Math.max(30, finite(quality.maxParticles, 220)) * finite(quality.particleScale, 1));
    const particles = state?.particles ?? [];
    const start = Math.max(0, particles.length - particleCap);
    for (let index = start; index < particles.length; index += 1) {
      const particle = particles[index];
      const x = finite(particle.x);
      const y = finite(particle.y);
      if (!this.isCircleVisible(x, y, finite(particle.size, 3), 32)) continue;
      const alpha = clamp01(finite(particle.life) / Math.max(0.001, finite(particle.maxLife, 1)));
      const size = clamp(finite(particle.size, 3), 1, 18);
      const color = colorNumber(particle.color, COLORS.white);
      const vx = finite(particle.vx);
      const vy = finite(particle.vy);
      const speedSquared = vx * vx + vy * vy;
      if (speedSquared > 250 * 250) {
        const magnitude = Math.max(1, Math.sqrt(speedSquared));
        graphics.lineStyle(Math.max(1, size * 0.6), color, alpha);
        graphics.lineBetween(x, y, x - vx / magnitude * size * 4, y - vy / magnitude * size * 4);
      } else {
        graphics.fillStyle(color, alpha);
        graphics.fillCircle(x, y, size);
      }
    }
    this.syncManualAbilityFx(state, time, quality);
    this.syncSkillFx(state, time, quality);
    this.syncUltimateFx(state, quality);
    this.syncOmegaLaserFx(state, time, quality);
    this.syncHealingKitFx(state, time, quality);
    this.syncSpawnGates(state, quality);
  }

  private syncManualAbilityFx(state: any, time: number, quality: QualityPreset) {
    const graphics = this.manualAbilityGraphics;
    graphics.clear();
    // Six slots keep Q, E, the grouped F presentation, and the R rotor visible
    // together while leaving bounded headroom for overlapping field casts.
    const spriteCap = quality.id === "performance" ? 6 : quality.id === "cinematic" ? 16 : 10;
    let visible = 0;

    const pulses = Array.isArray(state?.empPulses) ? state.empPulses : [];
    const pulseCap = quality.id === "performance" ? 1 : quality.id === "cinematic" ? 3 : 2;
    for (let index = Math.max(0, pulses.length - pulseCap); index < pulses.length && visible < spriteCap; index += 1) {
      const pulse = pulses[index];
      const geometry = pulse?.geometry ?? pulse;
      const x = finite(geometry?.x, finite(pulse?.x));
      const y = finite(geometry?.y, finite(pulse?.y));
      const radius = Math.max(24, finite(geometry?.radius, finite(pulse?.radius, 300)));
      if (!this.isCircleVisible(x, y, radius, 48)) continue;
      const remaining = clamp01(finite(pulse?.life) / Math.max(0.001, finite(pulse?.maxLife, 0.92)));
      const frame = resolveManualAbilityAtlasFrame("empPulse", pulse);
      const image = this.getManualAbilitySprite(visible++);
      setAtlasFrame(image, frame.column, frame.row);
      image
        .setBlendMode(Phaser.BlendModes.ADD)
        .setOrigin(0.5)
        .setVisible(true)
        .setPosition(x, y)
        .setRotation(0)
        // The dotted circumference carries the exact 300px collision radius;
        // the authored core stays compact enough to keep enemies readable.
        .setDisplaySize(snapPixelSize(radius * 1.42), snapPixelSize(radius * 1.42))
        .setAlpha(0.9 * clamp01(remaining / 0.12))
        .clearTint();
      drawPixelDottedCircle(graphics, x, y, radius, COLORS.cyan, 0.42 + remaining * 0.24, 28, 4);
      drawPixelDottedCircle(
        graphics,
        x,
        y,
        radius * (0.72 + Math.sin(time * 9.2) * 0.018),
        COLORS.white,
        0.2 + remaining * 0.1,
        20,
        2,
      );
    }

    const wards = Array.isArray(state?.aegisWards) ? state.aegisWards : [];
    if (wards.length > 0 && visible < spriteCap) {
      const ward = wards[wards.length - 1];
      const geometry = ward?.geometry ?? ward;
      const x = finite(geometry?.x, finite(ward?.x, finite(state?.player?.x)));
      const y = finite(geometry?.y, finite(ward?.y, finite(state?.player?.y)));
      const radius = Math.max(20, finite(geometry?.radius, finite(ward?.radius, 132)));
      const remaining = clamp01(finite(ward?.life) / Math.max(0.001, finite(ward?.maxLife, 5)));
      const frame = resolveManualAbilityAtlasFrame("aegisWard", ward);
      const image = this.getManualAbilitySprite(visible++);
      setAtlasFrame(image, frame.column, frame.row);
      image
        .setBlendMode(Phaser.BlendModes.NORMAL)
        .setOrigin(0.5)
        .setVisible(true)
        .setPosition(x, y)
        .setRotation(0)
        .setDisplaySize(snapPixelSize(radius * 2.18), snapPixelSize(radius * 2.18))
        .setAlpha(0.94 * clamp01(remaining / 0.1))
        .clearTint();
      drawPixelDottedCircle(graphics, x, y, radius, COLORS.cyan, 0.44 + remaining * 0.28, 18, 5);
    }

    const stratosRuns = Array.isArray(state?.stratosRuns) ? state.stratosRuns : [];
    const stratosGroupCap = quality.id === "performance" ? 1 : quality.id === "cinematic" ? 3 : 2;
    for (const group of this.stratosGroupScratch) {
      group.id = 0;
      group.lanes[0] = null;
      group.lanes[1] = null;
      group.lanes[2] = null;
    }
    let stratosGroupCount = 0;
    for (let index = 0; index < stratosRuns.length; index += 1) {
      const lane = stratosRuns[index];
      const laneIndex = clamp(Math.floor(finite(lane?.geometry?.laneIndex, finite(lane?.laneIndex))), 0, 2);
      const laneGeometry = lane?.geometry;
      if (laneGeometry && !this.isSegmentVisible(
        finite(laneGeometry.startX),
        finite(laneGeometry.startY),
        finite(laneGeometry.endX),
        finite(laneGeometry.endY),
        finite(laneGeometry.collisionHalfWidth, 24) + 48,
      )) continue;
      const groupId = Math.trunc(finite(lane?.id, index + 1) - laneIndex);
      let groupIndex = -1;
      for (let candidate = 0; candidate < stratosGroupCount; candidate += 1) {
        if (this.stratosGroupScratch[candidate].id === groupId) {
          groupIndex = candidate;
          break;
        }
      }
      if (groupIndex < 0) {
        if (stratosGroupCount >= stratosGroupCap) continue;
        groupIndex = stratosGroupCount++;
        this.stratosGroupScratch[groupIndex].id = groupId;
      }
      this.stratosGroupScratch[groupIndex].lanes[laneIndex] = lane;
    }
    for (let groupIndex = 0; groupIndex < stratosGroupCount && visible < spriteCap; groupIndex += 1) {
      const lanes = this.stratosGroupScratch[groupIndex].lanes;
      let reference: any = null;
      let groupVisible = false;
      for (let laneIndex = 0; laneIndex < 3; laneIndex += 1) {
        const geometry = lanes[laneIndex]?.geometry;
        if (!geometry) continue;
        reference ??= lanes[laneIndex];
        if (this.isSegmentVisible(
          finite(geometry.startX),
          finite(geometry.startY),
          finite(geometry.endX),
          finite(geometry.endY),
          finite(geometry.collisionHalfWidth, 24) + 48,
        )) groupVisible = true;
      }
      if (!reference || !groupVisible) continue;
      let warningProgress = 0;
      let sweepProgress = 0;
      let hasSweep = false;
      for (const lane of lanes) {
        if (!lane) continue;
        const geometry = lane?.geometry;
        if (!geometry) continue;
        const halfWidth = Math.max(2, finite(geometry.collisionHalfWidth, 24));
        if (lane?.phase === "warning") {
          const laneWarning = clamp01(1 - finite(lane?.warning) / Math.max(0.001, finite(lane?.warningMax, 1)));
          warningProgress = Math.max(warningProgress, laneWarning);
          drawPixelDottedLine(
            graphics,
            geometry.startX,
            geometry.startY,
            geometry.endX,
            geometry.endY,
            laneWarning > 0.78 ? COLORS.white : COLORS.cyan,
            0.42 + laneWarning * 0.42,
            Math.max(16, halfWidth * 1.15),
            laneWarning > 0.78 ? 6 : 4,
          );
          continue;
        }
        hasSweep = true;
        const laneSweep = clamp01(finite(geometry.sweepProgress, finite(lane?.progress)));
        sweepProgress = Math.max(sweepProgress, laneSweep);
        const trailProgress = Math.max(0, laneSweep - 0.13);
        const trailX = geometry.startX + (geometry.endX - geometry.startX) * trailProgress;
        const trailY = geometry.startY + (geometry.endY - geometry.startY) * trailProgress;
        const headX = geometry.startX + (geometry.endX - geometry.startX) * laneSweep;
        const headY = geometry.startY + (geometry.endY - geometry.startY) * laneSweep;
        drawPixelDottedLine(
          graphics,
          geometry.startX,
          geometry.startY,
          geometry.endX,
          geometry.endY,
          COLORS.cyan,
          0.2,
          Math.max(18, halfWidth * 1.35),
          4,
        );
        drawPixelDottedLine(
          graphics,
          trailX,
          trailY,
          headX,
          headY,
          COLORS.white,
          0.96,
          12,
          6,
        );
      }

      const geometry = reference.geometry;
      const laneIndex = clamp(Math.floor(finite(geometry.laneIndex, finite(reference.laneIndex))), 0, 2);
      const angle = Number.isFinite(geometry.angle)
        ? finite(geometry.angle)
        : Math.atan2(geometry.endY - geometry.startY, geometry.endX - geometry.startX);
      const offset = STRATOS_OFFSETS[laneIndex];
      const perpendicularX = -Math.sin(angle);
      const perpendicularY = Math.cos(angle);
      const centerStartX = finite(geometry.startX) - perpendicularX * offset;
      const centerStartY = finite(geometry.startY) - perpendicularY * offset;
      const centerEndX = finite(geometry.endX) - perpendicularX * offset;
      const centerEndY = finite(geometry.endY) - perpendicularY * offset;
      const centralLane = lanes[1];
      const centralWarningProgress = centralLane?.phase === "warning"
        ? clamp01(1 - finite(centralLane?.warning) / Math.max(0.001, finite(centralLane?.warningMax, 1)))
        : warningProgress;
      const centralSweepProgress = centralLane?.phase === "sweep"
        ? clamp01(finite(centralLane?.geometry?.sweepProgress, finite(centralLane?.progress)))
        : sweepProgress;
      const presentationHasSweep = centralLane ? centralLane.phase === "sweep" : hasSweep;
      const presentationProgress = presentationHasSweep ? centralSweepProgress : 0.5;
      const x = centerStartX + (centerEndX - centerStartX) * presentationProgress;
      const y = centerStartY + (centerEndY - centerStartY) * presentationProgress;
      const frame = resolveManualAbilityAtlasFrame("stratosRun", {
        phase: presentationHasSweep ? "sweep" : "warning",
        warningProgress: centralWarningProgress,
        sweepProgress: centralSweepProgress,
      });
      const image = this.getManualAbilitySprite(visible++);
      const spriteSize = quality.id === "performance" ? PIXEL_VFX_CELL * 6 : quality.id === "cinematic" ? PIXEL_VFX_CELL * 10 : PIXEL_VFX_CELL * 8;
      setAtlasFrame(image, frame.column, frame.row);
      image
        // The authored cell stays square; the exact full-length collision lanes
        // remain the three Graphics paths above, avoiding a stretched texture.
        .setBlendMode(Phaser.BlendModes.ADD)
        .setOrigin(0.5)
        .setVisible(true)
        .setPosition(x, y)
        .setRotation(angle)
        .setDisplaySize(spriteSize, spriteSize)
        .setAlpha(presentationHasSweep ? 0.94 : 0.52 + centralWarningProgress * 0.28)
        .clearTint();
    }

    const tempests = Array.isArray(state?.helixTempests) ? state.helixTempests : [];
    const tempestCap = quality.id === "cinematic" ? 2 : 1;
    for (let index = Math.max(0, tempests.length - tempestCap); index < tempests.length && visible < spriteCap; index += 1) {
      const tempest = tempests[index];
      const x = finite(tempest?.x);
      const y = finite(tempest?.y);
      const remaining = clamp01(finite(tempest?.life) / Math.max(0.001, finite(tempest?.maxLife, 3.2)));
      for (const lance of Array.isArray(tempest?.lances) ? tempest.lances : []) {
        const halfWidth = Math.max(2, finite(lance?.collisionHalfWidth, finite(tempest?.collisionHalfWidth, 23)));
        drawPixelDottedLine(
          graphics,
          lance.startX,
          lance.startY,
          lance.endX,
          lance.endY,
          COLORS.violet,
          0.5 * clamp01(remaining / 0.1),
          Math.max(14, halfWidth * 0.9),
          6,
        );
        drawPixelDottedLine(
          graphics,
          lance.startX,
          lance.startY,
          lance.endX,
          lance.endY,
          COLORS.white,
          0.92 * clamp01(remaining / 0.08),
          Math.max(28, halfWidth * 1.6),
          4,
        );
      }
      const frame = resolveManualAbilityAtlasFrame("helixTempest", tempest);
      const image = this.getManualAbilitySprite(visible++);
      const rotorSize = snapPixelSize(finite(tempest?.innerRadius, 38) * 5.4, PIXEL_VFX_CELL * 3, PIXEL_VFX_CELL * 5);
      setAtlasFrame(image, frame.column, frame.row);
      image
        .setBlendMode(Phaser.BlendModes.ADD)
        .setOrigin(0.5)
        .setVisible(true)
        .setPosition(x, y)
        .setRotation(finite(tempest?.angle))
        .setDisplaySize(rotorSize, rotorSize)
        .setAlpha(0.98 * clamp01(remaining / 0.1))
        .clearTint();
    }

    for (let index = visible; index < this.manualAbilitySprites.length; index += 1) {
      this.manualAbilitySprites[index].setVisible(false);
    }
  }

  private getManualAbilitySprite(index: number) {
    let image = this.manualAbilitySprites[index];
    if (!image) {
      image = this.scene.add.image(0, 0, ASSET_KEYS.manualAbilityPixel);
      this.worldBack.add(image);
      this.manualAbilitySprites.push(image);
    }
    return image;
  }

  private syncHealingKitFx(state: any, time: number, quality: QualityPreset) {
    const kits = state?.healthKits ?? [];
    const cap = quality.id === "performance" ? 10 : 18;
    const view = this.mainCamera.worldView;
    let visible = 0;
    for (const kit of kits) {
      if (visible >= cap) break;
      if (kit?.dead) continue;
      const x = finite(kit?.x);
      const y = finite(kit?.y);
      if (x < view.left - 80 || x > view.right + 80 || y < view.top - 80 || y > view.bottom + 80) continue;
      let image = this.healingKitSprites[visible];
      if (!image) {
        image = this.scene.add.image(0, 0, ASSET_KEYS.healingKitMotion);
        this.worldFront.add(image);
        this.healingKitSprites.push(image);
      }
      const frame = Math.floor(time * 4.8 + finite(kit?.id) * 0.37) % 4;
      const pulse = 1 + Math.sin(time * 5.4 + finite(kit?.id)) * 0.055;
      setAtlasFrame(image, frame, 0);
      image
        .setVisible(true)
        .setPosition(x, y + Math.sin(time * 3.8 + finite(kit?.id)) * 3)
        .setRotation(0)
        .setDisplaySize(66 * pulse, 50 * pulse)
        .setAlpha(0.98)
        .clearTint();
      visible += 1;
    }
    for (let index = visible; index < this.healingKitSprites.length; index += 1) this.healingKitSprites[index].setVisible(false);
  }

  private syncSkillFx(state: any, time: number, quality: QualityPreset) {
    const waves = state?.shockwaves ?? [];
    const cap = quality.id === "performance" ? 8 : quality.id === "cinematic" ? 18 : 12;
    let visible = 0;
    for (let waveIndex = Math.max(0, waves.length - cap * 2); waveIndex < waves.length && visible < cap; waveIndex += 1) {
      const wave = waves[waveIndex];
      if (wave?.enemy) continue;
      const type = String(wave?.type ?? "nova").toLowerCase();
      if (type.includes("airstrike") || type.includes("suppressor")) continue;
      const x = finite(wave?.x);
      const y = finite(wave?.y);
      const pixelNova = type.includes("nova") || type.includes("zero");
      const progress = clamp01(1 - finite(wave?.life) / Math.max(0.001, finite(wave?.maxLife, 1)));
      const maxRadius = Math.max(42, finite(wave?.maxRadius, 110));
      const rawSize = clamp(42 + maxRadius * 2 * progress, 48, 360);
      if (!this.isCircleVisible(x, y, rawSize * 0.5, 48)) continue;
      const texture = pixelNova ? ASSET_KEYS.automaticSkillPixel : ASSET_KEYS.combatFx;
      let image = this.skillFxSprites[visible];
      if (!image) {
        image = this.scene.add.image(0, 0, texture).setBlendMode(Phaser.BlendModes.ADD);
        this.worldFront.add(image);
        this.skillFxSprites.push(image);
      }
      if (image.texture.key !== texture) image.setTexture(texture);
      const size = pixelNova ? snapPixelSize(rawSize, PIXEL_VFX_CELL, PIXEL_VFX_CELL * 6) : rawSize;
      const frame = pixelNova ? { column: Math.min(5, Math.floor(progress * 6)), row: 2 }
        : type.includes("orbit") ? { column: 2, row: 2 }
          : type.includes("squad") || type.includes("ally") ? { column: 2, row: 1 }
            : { column: 3, row: 1 };
      setAtlasFrame(image, frame.column, frame.row);
      image
        .setVisible(true)
        .setPosition(x, y)
        .setRotation(pixelNova ? 0 : time * 0.72 + visible * 0.41)
        .setDisplaySize(size, size)
        .setAlpha((1 - progress) * 0.62);
      visible += 1;
    }
    for (let index = visible; index < this.skillFxSprites.length; index += 1) this.skillFxSprites[index].setVisible(false);
  }

  private syncUltimateFx(state: any, quality: QualityPreset) {
    const cap = quality.id === "performance" ? 9 : quality.id === "cinematic" ? 30 : 18;
    let visible = 0;
    const airstrikes = state?.airstrikes ?? [];
    const strikeStride = Math.max(1, Math.ceil(airstrikes.length / Math.max(1, cap - 2)));
    for (let index = 0; index < airstrikes.length && visible < cap; index += strikeStride) {
      const strike = airstrikes[index];
      const x = finite(strike?.x);
      const y = finite(strike?.y);
      const strikeRadius = finite(strike?.radius, 90);
      if (!this.isCircleVisible(x, y, strikeRadius * 1.4, 64)) continue;
      const progress = clamp01(1 - finite(strike?.life) / Math.max(0.001, finite(strike?.maxLife, 1)));
      const frame = strike?.phase === "warning"
        ? Math.min(1, Math.floor(progress * 2))
        : 2 + Math.min(3, Math.floor(progress * 4));
      const image = this.getUltimateFxSprite(visible++);
      setAtlasFrame(image, frame, 0);
      const size = snapPixelSize(
        strikeRadius * (strike?.phase === "warning" ? 1.8 : 2.5),
        PIXEL_VFX_CELL * 2,
        PIXEL_VFX_CELL * 5,
      );
      image
        .setOrigin(0.5)
        .setVisible(true)
        .setPosition(x, y)
        .setRotation(0)
        .setDisplaySize(size, size)
        .setAlpha(strike?.phase === "warning" ? 0.78 + progress * 0.2 : 1 - progress * 0.36)
        .clearTint();
    }

    for (const chain of state?.chains ?? []) {
      if (visible >= cap) break;
      const points = chain?.points ?? chain?.links;
      if (!Array.isArray(points) || points.length < 2) continue;
      const progress = clamp01(1 - finite(chain?.life) / Math.max(0.001, finite(chain?.maxLife, 0.36)));
      const frame = Math.min(5, Math.floor(progress * 6));
      const focus = points[Math.floor(points.length / 2)];
      if (!this.isCircleVisible(finite(focus?.x), finite(focus?.y), 210, 72)) continue;
      const image = this.getUltimateFxSprite(visible++);
      setAtlasFrame(image, frame, 1);
      const size = snapPixelSize(150 + points.length * 20, PIXEL_VFX_CELL * 2, PIXEL_VFX_CELL * 5);
      image
        .setOrigin(0.5)
        .setVisible(true)
        .setPosition(finite(focus?.x), finite(focus?.y))
        .setRotation(0)
        .setDisplaySize(size, size)
        .setAlpha(clamp(finite(chain?.alpha, 1), 0.28, 1))
        .clearTint();
    }

    for (const pulse of state?.shockwaves ?? []) {
      if (visible >= cap || !String(pulse?.type ?? "").toLowerCase().includes("suppressor")) continue;
      const x = finite(pulse?.x);
      const y = finite(pulse?.y);
      const maxRadius = finite(pulse?.maxRadius, 220);
      if (!this.isCircleVisible(x, y, maxRadius, 48)) continue;
      const progress = clamp01(1 - finite(pulse?.life) / Math.max(0.001, finite(pulse?.maxLife, 0.48)));
      const image = this.getUltimateFxSprite(visible++);
      setAtlasFrame(image, Math.min(5, Math.floor(progress * 6)), 1);
      const size = snapPixelSize(maxRadius * 1.45, PIXEL_VFX_CELL * 3, PIXEL_VFX_CELL * 6);
      image
        .setOrigin(0.5)
        .setVisible(true)
        .setPosition(x, y)
        .setRotation(0)
        .setDisplaySize(size, size)
        .setAlpha(clamp01(1 - progress * 0.42))
        .clearTint();
    }
    for (let index = visible; index < this.ultimateFxSprites.length; index += 1) this.ultimateFxSprites[index].setVisible(false);
  }

  private syncOmegaLaserFx(state: any, time: number, quality: QualityPreset) {
    const beams = state?.beams ?? [];
    const spriteCap = quality.id === "performance" ? 12 : quality.id === "cinematic" ? 28 : 20;
    let visible = 0;
    for (const beam of beams) {
      if (!String(beam?.type ?? "").toLowerCase().includes("omega")) continue;
      const x1 = finite(beam?.x1);
      const y1 = finite(beam?.y1);
      const x2 = finite(beam?.x2);
      const y2 = finite(beam?.y2);
      if (!this.isSegmentVisible(x1, y1, x2, y2, 180)) continue;
      const angle = Number.isFinite(beam?.angle) ? finite(beam.angle) : Math.atan2(y2 - y1, x2 - x1);
      const directionX = Math.cos(angle);
      const directionY = Math.sin(angle);
      const beamLength = Math.max(1, Math.hypot(x2 - x1, y2 - y1));
      const charging = beam?.phase === "charge";
      const chargeProgress = clamp01(1 - finite(beam?.charge) / Math.max(0.001, finite(beam?.chargeMax, 0.68)));
      const activeDuration = Math.max(0.2, finite(beam?.maxLife, 1.55) - finite(beam?.chargeMax, 0.68));
      const activeProgress = clamp01(1 - finite(beam?.life) / activeDuration);
      const beamAlpha = charging ? 0.06 + chargeProgress * 0.2 : clamp(finite(beam?.alpha, 1), 0.34, 1);
      const pixelSize = quality.id === "performance"
        ? PIXEL_VFX_CELL * 2
        : snapPixelSize(finite(beam?.width, 82) * 2.1, PIXEL_VFX_CELL * 2, PIXEL_VFX_CELL * 3);

      drawPixelDottedLine(
        this.manualAbilityGraphics,
        x1 + directionX * PIXEL_VFX_CELL,
        y1 + directionY * PIXEL_VFX_CELL,
        x2 - directionX * PIXEL_VFX_CELL,
        y2 - directionY * PIXEL_VFX_CELL,
        charging ? COLORS.cyan : COLORS.white,
        charging ? 0.2 + chargeProgress * 0.36 : 0.34,
        charging ? 30 : 52,
        charging ? 4 : 5,
      );

      if (visible < spriteCap) {
        const emitter = this.getOmegaLaserSprite(visible++);
        setAtlasFrame(emitter, charging ? Math.min(1, Math.floor(chargeProgress * 2)) : 1, 3);
        emitter
          .setBlendMode(Phaser.BlendModes.NORMAL)
          .setOrigin(0.5)
          .setVisible(true)
          .setPosition(x1 + directionX * 8, y1 + directionY * 8)
          .setRotation(angle)
          .setDisplaySize(pixelSize, pixelSize)
          .setAlpha(charging ? 0.78 + chargeProgress * 0.2 : beamAlpha)
          .clearTint();
      }

      if (!charging) {
        const segmentStart = PIXEL_VFX_CELL * 0.9;
        const segmentEnd = Math.max(segmentStart, beamLength - PIXEL_VFX_CELL * 0.8);
        const tileStep = Math.max(48, Math.round(pixelSize * 0.64));
        const segmentCount = Math.max(1, Math.ceil((segmentEnd - segmentStart) / tileStep));
        for (let index = 0; index <= segmentCount && visible < spriteCap; index += 1) {
          const midpoint = Math.min(segmentEnd, segmentStart + index * tileStep);
          const segment = this.getOmegaLaserSprite(visible++);
          setAtlasFrame(segment, 2 + ((Math.floor(time * 12) + index) % 2), 3);
          segment
            .setBlendMode(Phaser.BlendModes.ADD)
            .setOrigin(0.5)
            .setVisible(true)
            .setPosition(Math.round(x1 + directionX * midpoint), Math.round(y1 + directionY * midpoint))
            .setRotation(angle)
            // One square 64px beam module is repeated along engine geometry;
            // no cannon, impact, or atlas cell is stretched into the full beam.
            .setDisplaySize(pixelSize, pixelSize)
            .setAlpha(beamAlpha)
            .clearTint();
        }
      }

      if (visible < spriteCap) {
        const impact = this.getOmegaLaserSprite(visible++);
        const frame = charging ? 4 : 4 + ((Math.floor(time * 12) + Math.floor(activeProgress * 4)) % 2);
        const impactSize = charging ? PIXEL_VFX_CELL * 2 : pixelSize;
        setAtlasFrame(impact, frame, 3);
        impact
          .setBlendMode(Phaser.BlendModes.ADD)
          .setOrigin(0.5)
          .setVisible(true)
          .setPosition(x2, y2)
          .setRotation(angle)
          .setDisplaySize(impactSize, impactSize)
          .setAlpha(charging ? 0.14 + chargeProgress * 0.18 : beamAlpha)
          .clearTint();
      }
    }
    for (let index = visible; index < this.omegaLaserSprites.length; index += 1) this.omegaLaserSprites[index].setVisible(false);
  }

  private getOmegaLaserSprite(index: number) {
    let image = this.omegaLaserSprites[index];
    if (!image) {
      image = this.scene.add.image(0, 0, ASSET_KEYS.automaticSkillPixel);
      this.worldFront.add(image);
      this.omegaLaserSprites.push(image);
    }
    return image;
  }

  private getUltimateFxSprite(index: number) {
    let image = this.ultimateFxSprites[index];
    if (!image) {
      image = this.scene.add.image(0, 0, ASSET_KEYS.automaticSkillPixel).setBlendMode(Phaser.BlendModes.NORMAL);
      this.worldFront.add(image);
      this.ultimateFxSprites.push(image);
    }
    return image;
  }

  private syncSpawnGates(state: any, quality: QualityPreset) {
    const gates = state?.spawnPortals ?? [];
    // A route owns five authored gates and a fading gate can briefly overlap
    // its replacement. Keep every bounded gate visible so no enemy appears
    // from empty space, even in PERFORMANCE.
    const cap = 10;
    let visible = 0;
    for (let index = Math.max(0, gates.length - cap); index < gates.length && visible < cap; index += 1) {
      const gate = gates[index];
      const x = finite(gate?.x);
      const y = finite(gate?.y);
      if (!this.isCircleVisible(x, y, 112, 72)) continue;
      let image = this.spawnGateSprites[visible];
      if (!image) {
        image = this.scene.add.image(0, 0, ASSET_KEYS.sovereignGateMotion).setBlendMode(Phaser.BlendModes.NORMAL);
        this.worldBack.add(image);
        this.spawnGateSprites.push(image);
      }
      const progress = clamp01(1 - finite(gate?.life) / Math.max(0.001, finite(gate?.maxLife, 1.35)));
      setAtlasFrame(image, Math.min(5, Math.floor(progress * 6)), 0);
      image
        .setOrigin(0.5)
        .setVisible(true)
        .setPosition(x, y)
        .setRotation(0)
        .setDisplaySize(224, 224)
        .setAlpha(progress > 0.84 ? clamp01((1 - progress) / 0.16) : 1)
        .clearTint();
      visible += 1;
    }
    for (let index = visible; index < this.spawnGateSprites.length; index += 1) this.spawnGateSprites[index].setVisible(false);
  }

  private drawProjectiles(state: any, quality: QualityPreset) {
    const graphics = this.projectileGraphics;
    graphics.clear();
    const playerProjectiles = state?.projectiles ?? [];
    // Friendly bullets are already represented by muzzle flashes, hit sparks,
    // and impact state. Sample only their flight sprites under extreme volume;
    // hostile projectiles below remain unsampled because they deal damage.
    const spriteCap = quality.id === "performance" ? 180 : quality.id === "cinematic" ? 480 : 320;
    const stride = Math.max(1, Math.ceil(playerProjectiles.length / spriteCap));
    let visibleProjectiles = 0;
    for (let index = 0; index < playerProjectiles.length; index += stride) {
      const projectile = playerProjectiles[index];
      const x = finite(projectile?.x);
      const y = finite(projectile?.y);
      if (!this.isCircleVisible(x, y, 72, 32)) continue;
      let image = this.projectileSprites[visibleProjectiles];
      if (!image) {
        image = this.scene.add.image(0, 0, ASSET_KEYS.combatFx).setBlendMode(Phaser.BlendModes.ADD);
        this.worldFront.add(image);
        this.projectileSprites.push(image);
      }
      const art = projectileArt(projectile);
      const angle = Number.isFinite(projectile?.angle) ? projectile.angle : Math.atan2(finite(projectile?.vy), finite(projectile?.vx));
      const projectileKind = String(projectile?.kind ?? "pulse").toLowerCase();
      const launchesFromRifle = !projectileKind.includes("overdrive") && !projectileKind.includes("orbit");
      const launchAge = finite(projectile?.age, 1);
      let displayX = x;
      let displayY = y;
      if (launchesFromRifle && launchAge < 0.05) {
        const muzzle = resolveHeroMuzzleAnchor(state?.player, state?.phase === "boss" ? 64 : 74);
        const originX = finite(state?.player?.x) + muzzle.x;
        const originY = finite(state?.player?.y) + muzzle.y;
        const launchBlend = clamp01(launchAge / 0.05);
        displayX = originX + (x - originX) * launchBlend;
        displayY = originY + (y - originY) * launchBlend;
      }
      setAtlasFrame(image, art.column, art.row);
      image
        .setVisible(true)
        .setPosition(displayX, displayY)
        .setRotation(angle)
        .setDisplaySize(art.width, art.height)
        .setAlpha(0.96)
        .setTint(colorNumber(projectile?.color, 0xffffff));
      visibleProjectiles += 1;
    }
    for (let index = visibleProjectiles; index < this.projectileSprites.length; index += 1) this.projectileSprites[index].setVisible(false);
    const enemyProjectiles = state?.enemyProjectiles ?? [];
    // Enemy projectiles are authoritative incoming danger (engine cap: 360),
    // so only offscreen culling is allowed. Sampling them would create
    // invisible damage even when their collision path is inside the camera.
    const enemySpriteCap = 360;
    let visibleEnemyProjectiles = 0;
    for (let index = 0; index < enemyProjectiles.length && visibleEnemyProjectiles < enemySpriteCap; index += 1) {
      const projectile = enemyProjectiles[index];
      const x = finite(projectile?.x);
      const y = finite(projectile?.y);
      if (!this.isCircleVisible(x, y, 142, 48)) continue;
      const kind = String(projectile?.kind ?? "enemy").toLowerCase();
      const sniper = kind.includes("sniper");
      let image = this.enemyProjectileSprites[visibleEnemyProjectiles];
      if (!image) {
        image = this.scene.add.image(0, 0, ASSET_KEYS.combatFx).setBlendMode(Phaser.BlendModes.ADD);
        this.worldFront.add(image);
        this.enemyProjectileSprites.push(image);
      }
      const angle = Number.isFinite(projectile?.angle) ? projectile.angle : Math.atan2(finite(projectile?.vy), finite(projectile?.vx));
      setAtlasFrame(image, sniper ? 2 : 0, 0);
      image
        .setVisible(true)
        .setPosition(x, y)
        .setRotation(angle)
        .setDisplaySize(sniper ? 142 : 54, sniper ? 28 : 18)
        .setAlpha(sniper ? 1 : 0.94)
        .setTint(colorNumber(projectile?.color, COLORS.red));
      if (sniper) {
        graphics.lineStyle(4, COLORS.red, 0.2);
        graphics.lineBetween(x - Math.cos(angle) * 112, y - Math.sin(angle) * 112, x, y);
      }
      visibleEnemyProjectiles += 1;
    }
    for (let index = visibleEnemyProjectiles; index < this.enemyProjectileSprites.length; index += 1) this.enemyProjectileSprites[index].setVisible(false);
  }

  private spawnFx(kind: ViewFxKind, x: number, y: number, color: number, scale = 1) {
    const duration = kind === "bossBurst" ? 1.25
      : kind === "phaseBreak" ? 0.95
        : kind === "enemyBurst" ? 0.52
          : kind === "weaponBlast" ? 0.38
            : 0.28;
    this.viewFx.push({
      kind,
      x: finite(x),
      y: finite(y),
      born: this.scene.time.now / 1000,
      duration,
      color,
      scale: Math.max(0.25, finite(scale, 1)),
      seed: (this.viewFx.length * 97 + Math.floor(finite(x) * 13 + finite(y) * 7)) & 0xffff,
    });
    const fxCap = this.currentQualityId === "performance" ? 36 : this.currentQualityId === "cinematic" ? 88 : 60;
    if (this.viewFx.length > fxCap) this.viewFx.splice(0, this.viewFx.length - fxCap);
  }

  private drawImpactFx(time: number, quality: QualityPreset) {
    const graphics = this.impactGraphics;
    graphics.clear();
    const maxVisible = quality.id === "performance" ? 18 : quality.id === "cinematic" ? 64 : 40;
    const start = Math.max(0, this.viewFx.length - maxVisible);
    let write = 0;
    let spriteCount = 0;
    for (let index = 0; index < this.viewFx.length; index += 1) {
      const fx = this.viewFx[index];
      const progress = (time - fx.born) / fx.duration;
      if (progress >= 1) continue;
      this.viewFx[write++] = fx;
      if (index < start || progress < 0) continue;
      const alpha = (1 - clamp01(progress)) ** 2;
      const scale = fx.scale;
      const hit = fx.kind === "armorHit" || fx.kind === "playerHit" || fx.kind === "bossHit";
      const bossScale = fx.kind === "bossBurst" || fx.kind === "phaseBreak" ? 2.4 : 1;
      const radius = (hit ? 5 + progress * 24 : 12 + progress * 48) * scale * bossScale;
      if (!this.isCircleVisible(fx.x, fx.y, radius * 2.1, 40)) continue;
      const enemyExplosion = fx.kind === "enemyBurst";

      const impactSpriteCap = quality.id === "performance" ? 12 : quality.id === "cinematic" ? 48 : 30;
      if (spriteCount < impactSpriteCap) {
        let image = this.impactSprites[spriteCount];
        if (!image) {
          image = this.scene.add.image(0, 0, ASSET_KEYS.combatFx).setBlendMode(Phaser.BlendModes.ADD);
          this.worldFront.add(image);
          this.impactSprites.push(image);
        }
        const explosion = enemyExplosion || fx.kind === "bossBurst" || fx.kind === "phaseBreak";
        if (enemyExplosion) {
          image.setTexture(ASSET_KEYS.enemyDeathPixel);
          setAtlasFrame(image, Math.min(5, Math.floor(clamp01(progress) * 6)), 0);
        } else {
          image.setTexture(ASSET_KEYS.combatFx);
          setAtlasFrame(image, explosion ? 3 : 1, explosion ? 2 : 1);
        }
        image
          .setVisible(true)
          .setPosition(fx.x, fx.y)
          .setRotation(enemyExplosion ? 0 : progress * 0.9 + fx.seed * 0.001)
          .setDisplaySize(
            enemyExplosion ? Math.max(46, 104 * scale) : Math.max(28, radius * (explosion ? 2.4 : 1.8)),
            enemyExplosion ? Math.max(46, 104 * scale) : Math.max(28, radius * (explosion ? 2.4 : 1.8)),
          )
          .setAlpha(enemyExplosion ? Math.min(1, alpha * 1.42) : alpha * (explosion ? 0.78 : 0.88))
          .setTint(enemyExplosion ? 0xffffff : fx.color);
        spriteCount += 1;
      }

      // Enemy deaths own a six-frame pixel explosion. Drawing the legacy
      // circles and twelve procedural rays on top both muddied that authored
      // animation and multiplied Graphics tessellation during mass kills.
      if (enemyExplosion) continue;

      graphics.fillStyle(COLORS.white, alpha * (hit ? 0.85 : 0.62));
      graphics.fillCircle(fx.x, fx.y, Math.max(2, (hit ? 7 : 13) * scale * (1 - progress)));
      graphics.fillStyle(fx.color, alpha * 0.34);
      graphics.fillCircle(fx.x, fx.y, Math.max(4, radius * (hit ? 0.55 : 0.72)));
      graphics.lineStyle(Math.max(1.5, 3.2 * scale * (1 - progress * 0.4)), fx.color, alpha);
      graphics.strokeCircle(fx.x, fx.y, radius);
      graphics.lineStyle(Math.max(1, 1.3 * scale), COLORS.white, alpha * 0.8);
      graphics.strokeCircle(fx.x, fx.y, radius * 0.62);

      const baseRays = hit ? 6 : fx.kind === "bossBurst" || fx.kind === "phaseBreak" ? 24 : 12;
      const rays = quality.id === "performance" ? Math.ceil(baseRays * 0.4) : baseRays;
      for (let ray = 0; ray < rays; ray += 1) {
        const noise = Math.sin((fx.seed + ray * 31) * 12.9898) * 43758.5453;
        const random = noise - Math.floor(noise);
        const angle = ray / rays * TAU + random * 0.22;
        const inner = radius * (hit ? 0.18 : 0.28);
        const outer = radius * (1.08 + random * (hit ? 0.75 : 1.3));
        graphics.lineStyle(Math.max(1, (hit ? 2.2 : 3.4) * scale * (1 - progress)), ray % 3 === 0 ? COLORS.white : fx.color, alpha * (0.65 + random * 0.35));
        graphics.lineBetween(
          fx.x + Math.cos(angle) * inner,
          fx.y + Math.sin(angle) * inner,
          fx.x + Math.cos(angle) * outer,
          fx.y + Math.sin(angle) * outer,
        );
      }

      if (fx.kind === "bossBurst" || fx.kind === "phaseBreak") {
        graphics.lineStyle(Math.max(2, 5 * scale * (1 - progress)), COLORS.amber, alpha * 0.7);
        graphics.strokeCircle(fx.x, fx.y, radius * 1.45);
        graphics.lineStyle(Math.max(1, 2 * scale), COLORS.white, alpha * 0.58);
        graphics.strokeCircle(fx.x, fx.y, radius * 1.86);
      }
    }
    this.viewFx.length = write;
    for (let index = spriteCount; index < this.impactSprites.length; index += 1) this.impactSprites[index].setVisible(false);
  }

  private drawForeground(state: any, time: number, quality: QualityPreset) {
    const graphics = this.foregroundGraphics;
    graphics.clear();
    this.drawExpeditionMarkers(state, time, graphics);
    for (const orbital of state?.orbitals ?? []) {
      if (!this.isCircleVisible(finite(orbital.x), finite(orbital.y), 20, 40)) continue;
      graphics.lineStyle(2, COLORS.cyan, 0.5);
      graphics.strokeCircle(finite(orbital.x), finite(orbital.y), 12);
      graphics.lineStyle(5, COLORS.white, 0.84);
      const angle = finite(orbital.angle, time * 3);
      graphics.lineBetween(orbital.x - Math.cos(angle) * 15, orbital.y - Math.sin(angle) * 15, orbital.x + Math.cos(angle) * 15, orbital.y + Math.sin(angle) * 15);
    }
    for (let beamCollectionIndex = 0; beamCollectionIndex < 2; beamCollectionIndex += 1) {
      const beamCollection = beamCollectionIndex === 0 ? state?.beams : state?.chains;
      if (!Array.isArray(beamCollection)) continue;
      for (const beam of beamCollection) {
        const points = beam?.points ?? beam?.links;
        const alpha = clamp01(finite(beam?.alpha, 0.9));
        if (Array.isArray(points) && points.length > 1) {
          let visiblePath = false;
          for (let index = 1; index < points.length; index += 1) {
            if (this.isSegmentVisible(
              finite(points[index - 1]?.x),
              finite(points[index - 1]?.y),
              finite(points[index]?.x),
              finite(points[index]?.y),
              32,
            )) {
              visiblePath = true;
              break;
            }
          }
          if (!visiblePath) continue;
        const pixelArc = String(beam?.type ?? "").toLowerCase().includes("chain") || Array.isArray(beam?.links);
        if (pixelArc) {
          for (let index = 1; index < points.length; index += 1) {
            drawPixelDottedLine(
              graphics,
              finite(points[index - 1]?.x),
              finite(points[index - 1]?.y),
              finite(points[index]?.x),
              finite(points[index]?.y),
              index % 2 === 0 ? COLORS.white : COLORS.cyan,
              alpha,
              12,
              index % 2 === 0 ? 5 : 4,
            );
          }
        } else {
          graphics.lineStyle(Math.max(2, finite(beam?.width, 2.2) * 3), COLORS.cyan, alpha * 0.2);
          graphics.beginPath();
          graphics.moveTo(points[0].x, points[0].y);
          for (let index = 1; index < points.length; index += 1) {
            const jitter = index === points.length - 1 ? 0 : Math.sin(time * 31 + index * 9) * 3;
            graphics.lineTo(points[index].x + jitter, points[index].y - jitter);
          }
          graphics.strokePath();
          graphics.lineStyle(Math.max(1, finite(beam?.width, 2.2)), COLORS.white, alpha);
          graphics.strokePath();
        }
        } else {
          const omegaBeam = String(beam?.type ?? "").toLowerCase().includes("omega");
          // OMEGA LASER is rendered only by repeated square pixel modules in
          // syncOmegaLaserFx; this geometry branch must not add a stretched beam.
          if (omegaBeam) continue;
          const x1 = finite(beam?.x1, finite(beam?.x));
          const y1 = finite(beam?.y1, finite(beam?.y));
          const x2 = finite(beam?.x2, finite(beam?.targetX, x1 + Math.cos(finite(beam?.angle)) * finite(beam?.length, 500)));
          const y2 = finite(beam?.y2, finite(beam?.targetY, y1 + Math.sin(finite(beam?.angle)) * finite(beam?.length, 500)));
          const width = clamp(finite(beam?.width, 6), 1, 160);
          if (!this.isSegmentVisible(x1, y1, x2, y2, width * 2)) continue;
          const color = colorNumber(beam?.color, COLORS.cyan);
          graphics.lineStyle(width * 3.1, color, alpha * 0.24);
          graphics.lineBetween(x1, y1, x2, y2);
          graphics.lineStyle(Math.max(1.5, width * 0.36), COLORS.white, alpha);
          graphics.lineBetween(x1, y1, x2, y2);
        }
      }
    }
    const aim = state?.aim;
    if (aim) {
      const aimX = finite(aim.x);
      const aimY = finite(aim.y);
      const player = state?.player;
      const muzzle = resolveHeroMuzzleAnchor(player, state?.phase === "boss" ? 64 : 74);
      const muzzleX = finite(player?.x) + muzzle.x;
      const muzzleY = finite(player?.y) + muzzle.y;
      const dx = aimX - muzzleX;
      const dy = aimY - muzzleY;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const ux = dx / distance;
      const uy = dy / distance;
      const cueEnd = Math.max(0, distance - 24);
      graphics.lineStyle(5, COLORS.black, 0.36);
      graphics.lineBetween(muzzleX, muzzleY, muzzleX + ux * cueEnd, muzzleY + uy * cueEnd);
      drawPixelDottedLine(
        graphics,
        muzzleX,
        muzzleY,
        muzzleX + ux * cueEnd,
        muzzleY + uy * cueEnd,
        COLORS.cyan,
        0.32,
        34,
        3,
      );

      const radius = 14 + Math.sin(time * 6) * 1.2;
      graphics.lineStyle(6, COLORS.black, 0.78);
      graphics.strokeCircle(aimX, aimY, radius + 1);
      graphics.lineStyle(2.5, COLORS.cyan, 0.96);
      graphics.strokeCircle(aimX, aimY, radius);
      graphics.lineStyle(2, COLORS.white, 0.98);
      graphics.strokeCircle(aimX, aimY, 4);
      const bracket = radius + 11;
      const notch = radius - 3;
      graphics.lineStyle(5, COLORS.black, 0.7);
      graphics.lineBetween(aimX - bracket, aimY, aimX - notch, aimY);
      graphics.lineBetween(aimX + notch, aimY, aimX + bracket, aimY);
      graphics.lineBetween(aimX, aimY - bracket, aimX, aimY - notch);
      graphics.lineBetween(aimX, aimY + notch, aimX, aimY + bracket);
      graphics.lineStyle(2, COLORS.white, 0.96);
      graphics.lineBetween(aimX - bracket, aimY, aimX - notch, aimY);
      graphics.lineBetween(aimX + notch, aimY, aimX + bracket, aimY);
      graphics.lineBetween(aimX, aimY - bracket, aimX, aimY - notch);
      graphics.lineBetween(aimX, aimY + notch, aimX, aimY + bracket);
    }
    if (quality.filters !== false && state?.boss?.active) {
      graphics.lineStyle(1, COLORS.red, 0.08);
      graphics.strokeCircle(finite(state.boss.x), finite(state.boss.y), 145 + Math.sin(time * 4) * 6);
    }
  }

  private drawExpeditionMarkers(state: any, time: number, graphics: Phaser.GameObjects.Graphics) {
    const expedition = state?.expedition;
    if (!expedition) return;
    const playerX = finite(state?.player?.x, WIDTH * 0.5);
    const originX = finite(expedition.originX);
    const view = this.mainCamera.worldView;
    for (const trace of expedition.traces ?? []) {
      const x = originX + finite(trace.distance);
      const y = finite(trace.y, HEIGHT * 0.5);
      if (x < view.left - 160 || x > view.right + 160 || finite(expedition.distance) > finite(trace.distance) + 430) continue;
      const pulse = 0.46 + Math.sin(time * 5 + finite(trace.distance) * 0.01) * 0.14;
      graphics.lineStyle(2, COLORS.cyan, pulse);
      graphics.strokeCircle(x, y - 12, 18 + pulse * 5);
      graphics.lineStyle(1, trace.triggered ? COLORS.red : COLORS.cyan, 0.72);
      graphics.lineBetween(x, y - 31, x, y - 66);
      graphics.fillStyle(trace.triggered ? COLORS.red : COLORS.cyan, 0.92);
      graphics.fillCircle(x, y - 70, 4);
    }

    const gateX = playerX + finite(expedition.bossGate) - finite(expedition.distance);
    if (expedition.gateLocked && gateX > view.left - 120 && gateX < view.right + 160) {
      const alpha = 0.32 + Math.sin(time * 7) * 0.1;
      graphics.fillStyle(COLORS.redDark, alpha);
      graphics.fillRect(gateX - 32, 126, 64, WORLD_HEIGHT - 252);
      graphics.lineStyle(5, COLORS.red, 0.72);
      graphics.lineBetween(gateX, 126, gateX, WORLD_HEIGHT - 126);
      for (let y = 152; y < WORLD_HEIGHT - 136; y += 68) {
        graphics.lineStyle(2, COLORS.amber, 0.7);
        graphics.lineBetween(gateX - 34, y, gateX + 34, y + 30);
      }
    }
  }

  private drawDamageTexts(state: any, quality: QualityPreset) {
    const source = state?.texts ?? [];
    const cap = quality.id === "performance" ? 18 : quality.id === "cinematic" ? this.damageTexts.length : 30;
    const start = Math.max(0, source.length - cap);
    let slot = 0;
    for (let index = start; index < source.length && slot < cap; index += 1) {
      const item = source[index];
      const x = finite(item?.x);
      const y = finite(item?.y);
      if (!this.isCircleVisible(x, y, 32, 48)) continue;
      const text = this.damageTexts[slot];
      text
        .setVisible(true)
        .setText(String(item?.text ?? item?.value ?? ""))
        .setPosition(x, y)
        .setColor(typeof item?.color === "string" ? item.color : "#effcff")
        .setAlpha(clamp01(finite(item?.life) / Math.max(0.001, finite(item?.maxLife, 1))))
        .setScale(clamp(finite(item?.scale, 1), 0.65, 1.45));
      slot += 1;
    }
    for (; slot < this.damageTexts.length; slot += 1) this.damageTexts[slot].setVisible(false);
  }

  private drawHudOverlay(state: any, time: number) {
    const graphics = this.hudGraphics;
    graphics.clear();
    const clearTransition = state?.expedition?.clearTransition;
    const clearPhase = String(clearTransition?.phase ?? "");
    if (["warning", "panic", "swap"].includes(clearPhase)) {
      const wallTime = this.scene.time.now / 1000;
      const explicitProgress = finite(clearTransition?.progress, Number.NaN);
      const timerProgress = 1 - finite(clearTransition?.timer) / Math.max(0.001, finite(clearTransition?.duration, 1));
      const progress = clamp01(Number.isFinite(explicitProgress) ? explicitProgress : timerProgress);
      const panic = clearPhase === "panic";
      const color = panic ? COLORS.red : clearPhase === "swap" ? COLORS.cyan : COLORS.amber;
      const pulse = 0.52 + Math.sin(wallTime * (panic ? 18 : 11)) * 0.16;
      graphics.fillStyle(color, panic ? 0.055 + pulse * 0.035 : 0.025);
      graphics.fillRect(0, 0, WIDTH, HEIGHT);
      graphics.lineStyle(panic ? 12 : 7, COLORS.black, 0.72);
      graphics.strokeRect(8, 8, WIDTH - 16, HEIGHT - 16);
      graphics.lineStyle(panic ? 7 : 4, color, pulse);
      graphics.strokeRect(11, 11, WIDTH - 22, HEIGHT - 22);
      const ringRadius = 42 + progress * 78 + Math.sin(wallTime * 14) * 4;
      graphics.lineStyle(8, COLORS.black, 0.64);
      graphics.strokeCircle(WIDTH * 0.5, HEIGHT * 0.5, ringRadius);
      graphics.lineStyle(panic ? 4 : 3, color, 0.86 - progress * 0.34);
      graphics.strokeCircle(WIDTH * 0.5, HEIGHT * 0.5, ringRadius);
      for (let index = 0; index < 4; index += 1) {
        const angle = index * Math.PI * 0.5 + Math.PI * 0.25;
        const inner = 58 + Math.sin(wallTime * 10 + index) * 4;
        const outer = inner + (panic ? 34 : 22);
        graphics.lineStyle(panic ? 7 : 4, COLORS.black, 0.76);
        graphics.lineBetween(
          WIDTH * 0.5 + Math.cos(angle) * inner,
          HEIGHT * 0.5 + Math.sin(angle) * inner,
          WIDTH * 0.5 + Math.cos(angle) * outer,
          HEIGHT * 0.5 + Math.sin(angle) * outer,
        );
        graphics.lineStyle(panic ? 3 : 2, color, 0.96);
        graphics.lineBetween(
          WIDTH * 0.5 + Math.cos(angle) * inner,
          HEIGHT * 0.5 + Math.sin(angle) * inner,
          WIDTH * 0.5 + Math.cos(angle) * outer,
          HEIGHT * 0.5 + Math.sin(angle) * outer,
        );
      }
    }
    if (state?.surgeWarning || state?.activeSurge) {
      const pulse = 0.38 + Math.sin(time * 14) * 0.16;
      graphics.lineStyle(state?.surgeWarning ? 12 : 6, COLORS.red, pulse);
      graphics.strokeRect(5, 5, WIDTH - 10, HEIGHT - 10);
    }
    const flash = clamp01(finite(state?.flash));
    if (flash > 0) {
      graphics.fillStyle(COLORS.white, flash * 0.12);
      graphics.fillRect(0, 0, WIDTH, HEIGHT);
    }
    const phaseFlash = clamp01(finite(state?.boss?.phaseFlash));
    if (phaseFlash > 0) {
      graphics.fillStyle(COLORS.red, phaseFlash * 0.12);
      graphics.fillRect(0, 0, WIDTH, HEIGHT);
      graphics.lineStyle(6, COLORS.white, phaseFlash);
      graphics.strokeRect(12, 12, WIDTH - 24, HEIGHT - 24);
    }
  }
}

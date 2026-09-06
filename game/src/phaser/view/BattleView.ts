import Phaser from "phaser";
import { ASSET_KEYS } from "../../game/assets/manifest";
import { EXPEDITION_WORLD_HEIGHT, EXPEDITION_WORLD_WIDTH, WORLD_HEIGHT, WORLD_WIDTH } from "../../swarm/engine.js";
import {
  ACTOR_ANIMATION_PROFILES,
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
import { resolveActorFacing } from "./animation/actorFacing";
import { resolveRegionalEnemyFrame, resolveExpandedBossFrame } from "./animation/regionalActorAnimation";

const WIDTH = 1280;
const HEIGHT = 720;
const TAU = Math.PI * 2;
const PIXEL_VFX_CELL = 64;
const STRATOS_OFFSETS = Object.freeze([-112, 0, 112]);
const ENEMY_HEALTH_BAR_HOLD_MS = 2000;
const MAX_ENEMY_HEALTH_BAR_CANDIDATES = 30;
const ENEMY_HEALTH_BAR_CAPS = Object.freeze({
  cinematic: 30,
  balanced: 24,
  performance: 18,
});

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
  lastHp: number;
  healthBarUntil: number;
};

type EnemyHealthBarCandidate = {
  entity: any | null;
  record: SpriteRecord | null;
  priority: number;
  distanceSq: number;
  roleIndex: number;
  persistent: boolean;
};

type ViewFxKind = "armorHit" | "enemyBurst" | "playerHit" | "bossHit" | "bossBurst" | "phaseBreak" | "weaponBlast" | "stratosBlast";

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
  bossMotion?: string;
  expandedBossMotion?: boolean;
  enemyForms?: string;
}>;

const REGION_VISUAL_ASSETS: Readonly<Record<string, RegionVisualAssets>> = Object.freeze({
  "wrong-engine-core": Object.freeze({
    route: Object.freeze([ASSET_KEYS.wrongEngineArena]),
    routeSourceWidth: 1254,
    routeSourceHeight: 1254,
    bossRoom: ASSET_KEYS.bossRoom,
    bossForms: ASSET_KEYS.bossForms,
    bossMotion: ASSET_KEYS.bossMotion,
  }),
  "glass-dune": Object.freeze({
    route: Object.freeze([ASSET_KEYS.glassDuneArena]),
    routeSourceWidth: 1254,
    routeSourceHeight: 1254,
    bossRoom: ASSET_KEYS.glassDuneBossRoom,
    bossForms: ASSET_KEYS.glassDuneBossForms,
    bossMotion: ASSET_KEYS.glassDuneBossMotion,
  }),
  "abyssal-archive": Object.freeze({
    route: Object.freeze([ASSET_KEYS.abyssalArchiveArena]),
    routeSourceWidth: 1254,
    routeSourceHeight: 1254,
    bossRoom: ASSET_KEYS.abyssalArchiveBossRoom,
    bossForms: ASSET_KEYS.abyssalArchiveBossForms,
    bossMotion: ASSET_KEYS.abyssalArchiveBossMotion,
  }),
  "neon-foundry": Object.freeze({
    route: Object.freeze([ASSET_KEYS.neonFoundryArena]),
    routeSourceWidth: 1254,
    routeSourceHeight: 1254,
    bossRoom: ASSET_KEYS.neonFoundryArena,
    bossForms: ASSET_KEYS.neonFoundryBossForms,
    enemyForms: ASSET_KEYS.neonFoundryEnemyForms,
    bossMotion: ASSET_KEYS.neonFoundryBossMotion,
    expandedBossMotion: true,
  }),
  "storm-spire": Object.freeze({
    route: Object.freeze([ASSET_KEYS.stormSpireArena]),
    routeSourceWidth: 1254,
    routeSourceHeight: 1254,
    bossRoom: ASSET_KEYS.stormSpireArena,
    bossForms: ASSET_KEYS.stormSpireBossForms,
    enemyForms: ASSET_KEYS.stormSpireEnemyForms,
    bossMotion: ASSET_KEYS.stormSpireBossMotion,
    expandedBossMotion: true,
  }),
  "gene-vault": Object.freeze({
    route: Object.freeze([ASSET_KEYS.geneVaultArena]),
    routeSourceWidth: 1254,
    routeSourceHeight: 1254,
    bossRoom: ASSET_KEYS.geneVaultArena,
    bossForms: ASSET_KEYS.geneVaultBossForms,
    enemyForms: ASSET_KEYS.geneVaultEnemyForms,
    bossMotion: ASSET_KEYS.geneVaultBossMotion,
    expandedBossMotion: true,
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

type PortraitBossCameraFocus = Readonly<{
  x: number;
  y: number;
  zoom: number;
  mechanicActive: boolean;
}>;

function resolvePortraitBossCameraFocus(
  state: any,
  viewportWidth: number,
  viewportHeight: number,
  userZoomFactor: number,
): PortraitBossCameraFocus | null {
  const player = state?.player;
  const boss = state?.boss;
  if (!player || !boss) return null;

  let minX = finite(player.x) - 96;
  let maxX = finite(player.x) + 96;
  let minY = finite(player.y) - 96;
  let maxY = finite(player.y) + 96;
  const expand = (x: number, y: number, radius: number) => {
    minX = Math.min(minX, x - radius);
    maxX = Math.max(maxX, x + radius);
    minY = Math.min(minY, y - radius);
    maxY = Math.max(maxY, y + radius);
  };

  const bossStage = clamp(Math.floor(finite(boss.stage, 1)), 1, 3);
  const bossVisualRadius = (bossStage === 3 ? 640 : bossStage === 2 ? 560 : 480) * 0.5 + 72;
  expand(finite(boss.x), finite(boss.y), bossVisualRadius);

  const bombSequence = boss?.bombSequence;
  const bombPhase = String(bombSequence?.phase ?? "");
  const bombsActive = ["siren", "armed", "retaliation"].includes(bombPhase);
  if (bombsActive && Array.isArray(bombSequence?.bombs)) {
    for (const bomb of bombSequence.bombs) {
      if (bomb?.exploded) continue;
      expand(finite(bomb?.x), finite(bomb?.y), Math.max(104, finite(bomb?.radius, 66) + 38));
    }
  }

  const parryActive = finite(boss?.parry?.life) > 0;
  const mechanicActive = parryActive || bombsActive;
  const safeWidth = Math.max(1, finite(viewportWidth, WIDTH) * 0.82);
  const safeHeight = Math.max(1, finite(viewportHeight, HEIGHT) * (mechanicActive ? 0.6 : 0.68));
  const focusWidth = Math.max(360, maxX - minX);
  const focusHeight = Math.max(520, maxY - minY);
  const baseZoom = 0.66 * userZoomFactor;
  const fittedZoom = Math.min(baseZoom, safeWidth / focusWidth, safeHeight / focusHeight);
  return {
    x: clamp((minX + maxX) * 0.5, 0, WORLD_WIDTH),
    y: clamp((minY + maxY) * 0.5, 0, WORLD_HEIGHT),
    zoom: clamp(fittedZoom, 0.24, 0.72),
    mechanicActive,
  };
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
  if (type.includes("siegewalker") || combatRole.includes("siegewalker")) return 3;
  if (type.includes("brute") || combatRole.includes("sniper")) return 2;
  if (type.includes("suppress") || combatRole.includes("rifle")) return 1;
  return 0;
}

function enemyMotionTexture(enemy: any) {
  const role = enemyRoleIndex(enemy);
  return role === 3
    ? ASSET_KEYS.enemySiegeWalkerMotion
    : role === 2
      ? ASSET_KEYS.enemySniperMotion
      : role === 1
        ? ASSET_KEYS.enemyRiflemanMotion
        : ASSET_KEYS.enemyHunterMotion;
}

function regionalEnemyTexture(enemy: any) {
  switch (String(enemy?.visualSet ?? "")) {
    case "neon-foundry": return ASSET_KEYS.neonFoundryEnemyForms;
    case "storm-spire": return ASSET_KEYS.stormSpireEnemyForms;
    case "gene-vault": return ASSET_KEYS.geneVaultEnemyForms;
    default: return null;
  }
}

function enemyFallbackTexture(enemy: any) {
  const role = enemyRoleIndex(enemy);
  if (role === 3) return ASSET_KEYS.enemySniper;
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
  if (type.includes("noxwarrant")) return { column: 2, row: 0, width: 96, height: 18 };
  if (type.includes("vesperlocklance")) return { column: 2, row: 0, width: 128, height: 22 };
  if (type.includes("vespervectorcorona")) return { column: 1, row: 0, width: 58, height: 18 };
  if (type.includes("vespervectorneedle")) return { column: 0, row: 0, width: 82, height: 16 };
  if (type.includes("mikahalo")) return { column: 2, row: 2, width: 72, height: 72 };
  if (type.includes("crescent")) return { column: 0, row: 1, width: 76, height: 76 };
  if (type.includes("rail") || type.includes("omega")) return { column: 2, row: 0, width: 132, height: 40 };
  if (type.includes("rocket") || type.includes("missile")) return { column: 3, row: 0, width: 76, height: 36 };
  if (type.includes("scatter") || type.includes("fork")) return { column: 1, row: 0, width: 70, height: 40 };
  if (type.includes("orbit")) return { column: 2, row: 2, width: 54, height: 54 };
  if (type.includes("heavy") || type.includes("sentry")) return { column: 0, row: 0, width: 82, height: 30 };
  return { column: 0, row: 0, width: type.includes("overdrive") ? 88 : 72, height: type.includes("overdrive") ? 32 : 28 };
}

export class BattleView {
  private readonly scene: Phaser.Scene;
  private readonly mainCamera: Phaser.Cameras.Scene2D.Camera;
  private readonly portraitPresentation: boolean;
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
  private readonly omegaLaserGraphics: Phaser.GameObjects.Graphics;
  private readonly projectileGraphics: Phaser.GameObjects.Graphics;
  private readonly foregroundGraphics: Phaser.GameObjects.Graphics;
  private readonly enemyHealthGraphics: Phaser.GameObjects.Graphics;
  private readonly impactGraphics: Phaser.GameObjects.Graphics;
  private readonly hudGraphics: Phaser.GameObjects.Graphics;
  private readonly player: Phaser.GameObjects.Image;
  private readonly playerDirectionalTexture: string;
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
  private readonly swordEffectSprites: Phaser.GameObjects.Image[] = [];
  private readonly swordManualAbilitySprites: Phaser.GameObjects.Image[] = [];
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
  private readonly enemyHealthBarScratch: EnemyHealthBarCandidate[] = Array.from(
    { length: MAX_ENEMY_HEALTH_BAR_CANDIDATES },
    () => ({ entity: null, record: null, priority: 0, distanceSq: 0, roleIndex: 0, persistent: false }),
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
  private lastBossHp = Number.NaN;
  private lastImpactShakeAt = -1000;
  private lastPhase = 1;
  private bossRevealStartedAt = -1;
  private bossRevealFromZoom = 1.08;
  private userZoomFactor = 1;
  private screenShakeEnabled = true;

  constructor(scene: Phaser.Scene, regionId = "wrong-engine-core", portraitPresentation = false) {
    this.scene = scene;
    const regionAssets = getRegionVisualAssets(regionId);
    this.regionAssets = regionAssets;
    this.playerDirectionalTexture = scene.textures.exists(ASSET_KEYS.playerSwordDirectionalAim)
      ? ASSET_KEYS.playerSwordDirectionalAim
      : ASSET_KEYS.playerDirectionalAim;
    this.prepareAtlas(this.playerDirectionalTexture, 8, 8);
    this.prepareAtlas(ASSET_KEYS.playerMikaDirectionalAim, 8, 8);
    this.prepareAtlas(ASSET_KEYS.playerVesperDirectionalAim, 8, 8);
    this.prepareAtlas(ASSET_KEYS.playerNoxDirectionalAim, 8, 8);
    this.prepareAtlas(ASSET_KEYS.enemyHunterMotion, 6, 4);
    this.prepareAtlas(ASSET_KEYS.enemyRiflemanMotion, 6, 4);
    this.prepareAtlas(ASSET_KEYS.enemySniperMotion, 6, 4);
    this.prepareAtlas(ASSET_KEYS.enemySiegeWalkerMotion, 6, 4);
    if (regionAssets.enemyForms) this.prepareAtlas(regionAssets.enemyForms, 6, 4);
    if (scene.textures.exists(regionAssets.bossForms)) ensureAtlasFrames(scene, regionAssets.bossForms, 3, 1);
    ensureAtlasFrames(scene, ASSET_KEYS.combatFx, 4, 3);
    this.prepareAtlas(ASSET_KEYS.automaticSkillPixel, 6, 4);
    this.prepareAtlas(ASSET_KEYS.sovereignGateMotion, 6, 1);
    ensureAtlasFrames(scene, ASSET_KEYS.healingKitMotion, 4, 1);
    this.prepareAtlas(ASSET_KEYS.manualAbilityPixel, 6, 4);
    this.prepareAtlas(ASSET_KEYS.aegisWardHd, 6, 1);
    this.prepareAtlas(ASSET_KEYS.empPulseHd, 6, 1);
    if (scene.textures.exists(ASSET_KEYS.swordSkillPixel)) this.prepareAtlas(ASSET_KEYS.swordSkillPixel, 6, 4);
    if (scene.textures.exists(ASSET_KEYS.swordManualAbilityPixel)) this.prepareAtlas(ASSET_KEYS.swordManualAbilityPixel, 6, 4);
    this.prepareAtlas(ASSET_KEYS.mikaAbilityPixel, 6, 4);
    this.prepareAtlas(ASSET_KEYS.vesperAbilityHd, 6, 4);
    this.prepareAtlas(ASSET_KEYS.noxAbilityHd, 6, 4);
    this.preparePixelAtlas(ASSET_KEYS.enemyDeathPixel, 6, 1);
    const hasSquadTraces = scene.textures.exists(ASSET_KEYS.squadTraces);
    if (hasSquadTraces) ensureAtlasFrames(scene, ASSET_KEYS.squadTraces, 3, 1);
    this.mainCamera = scene.cameras.main;
    this.portraitPresentation = portraitPresentation;
    this.mainCamera.setBackgroundColor("#020608");

    const routeMaps = regionAssets.route.map((key, index) => scene.add.image(
      EXPEDITION_WORLD_WIDTH * 0.5,
      EXPEDITION_WORLD_HEIGHT * 0.5,
      key,
    )
      .setDisplaySize(EXPEDITION_WORLD_WIDTH, EXPEDITION_WORLD_HEIGHT)
      .setAlpha(index === 0 ? 1 : 0));
    this.routeMapCount = routeMaps.length;
    const bossFallbackTexture = regionAssets.route[0];
    const bossMapTexture = scene.textures.exists(regionAssets.bossRoom) ? regionAssets.bossRoom : bossFallbackTexture;
    const bossBackdropHeight = this.portraitPresentation ? WORLD_HEIGHT + 360 : WORLD_HEIGHT;
    const bossMap = scene.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, bossMapTexture)
      .setDisplaySize(this.portraitPresentation ? bossBackdropHeight * (16 / 9) : WORLD_WIDTH, bossBackdropHeight)
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
    this.omegaLaserGraphics = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    this.projectileGraphics = scene.add.graphics();
    this.impactGraphics = scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    this.foregroundGraphics = scene.add.graphics();
    this.enemyHealthGraphics = scene.add.graphics();
    this.hudGraphics = scene.add.graphics();
    this.worldBack.add([this.shadowGraphics, this.telegraphGraphics, this.bossPatternLayer, this.effectGraphics, this.manualAbilityGraphics]);
    this.worldFront.add([this.projectileGraphics, this.impactGraphics, this.enemyHealthGraphics, this.omegaLaserGraphics, this.foregroundGraphics]);
    this.hudLayer.add(this.hudGraphics);

    this.muzzleFlash = scene.add.image(0, 0, ASSET_KEYS.combatFx)
      .setVisible(false)
      .setBlendMode(Phaser.BlendModes.ADD);
    setAtlasFrame(this.muzzleFlash, 0, 1);
    this.worldFront.add(this.muzzleFlash);

    this.playerGhosts = Array.from({ length: 3 }, () => {
      const ghost = scene.add.image(0, 0, this.playerDirectionalTexture).setVisible(false).setBlendMode(Phaser.BlendModes.ADD);
      this.actors.add(ghost);
      return ghost;
    });
    this.player = scene.add.image(WIDTH / 2, HEIGHT / 2, this.playerDirectionalTexture);
    const bossFormsTexture = scene.textures.exists(regionAssets.bossForms) ? regionAssets.bossForms : this.playerDirectionalTexture;
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
    this.syncPresentationViewport();
  }

  setScreenShakeEnabled(enabled: boolean) {
    this.screenShakeEnabled = enabled;
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
    const hasMotion = bossMotion ? this.prepareAtlas(bossMotion, this.regionAssets.expandedBossMotion ? 8 : 6, 4) : false;
    const hasCommonPatterns = this.prepareAtlas(ASSET_KEYS.bossPatternCommonPixel, 6, 6);
    const hasRegionalPatterns = this.prepareAtlas(ASSET_KEYS.bossPatternRegionalPixel, 6, 4);
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
          fontSize: "42px",
          fontStyle: "bold",
          color: "#ffffff",
          stroke: "#020609",
          strokeThickness: 10,
          backgroundColor: "#19050a",
          padding: { x: 10, y: 4 },
        }).setOrigin(0.5).setVisible(false);
        this.bossTimedBombSprites.push(image);
        this.bossTimedBombLabels.push(label);
        // Timed bombs are an interactive boss mechanic, so keep them above
        // actors and combat particles instead of burying them in the warning
        // layer behind the boss.
        this.worldFront.add([image, label]);
      }
    }
    const bossTexture = hasMotion && bossMotion ? bossMotion : bossForms;
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
      this.shakeCamera(170, 0.0085);
      this.hudCamera.flash(90, 255, 42, 68, false);
      this.spawnFx("playerHit", this.player.x, this.player.y, COLORS.red, 1.2);
    } else if (["bossStage", "bossStagePulse", "overdrive", "skillMastered"].includes(type)) {
      this.shakeCamera(250, type === "bossStage" ? 0.012 : 0.006);
      this.hudCamera.flash(120, type === "overdrive" ? 88 : 255, type === "overdrive" ? 242 : 70, type === "overdrive" ? 255 : 80, false);
      if (type === "bossStage") this.spawnFx("phaseBreak", this.boss.x, this.boss.y, COLORS.red, 2.25);
    } else if (type === "dash") {
      this.shakeCamera(90, 0.0025);
    } else if (type === "empPulseActivated") {
      this.shakeImpact(120, 0.0045, 90);
      this.spawnFx("weaponBlast", finite(event?.x, this.player.x), finite(event?.y, this.player.y), COLORS.cyan, 1.55);
    } else if (type === "aegisWardActivated") {
      this.spawnFx("weaponBlast", finite(event?.x, this.player.x), finite(event?.y, this.player.y), COLORS.green, 1.25);
    } else if (type === "stratosRunImpact") {
      this.spawnFx("stratosBlast", finite(event?.x, this.player.x), finite(event?.y, this.player.y), COLORS.amber, 1.12);
    } else if (type === "skillAttack" || type === "masterAttack") {
      const skill = String(event?.skill ?? "");
      const color = skill.includes("nova") || skill.includes("orbit") ? COLORS.violet : COLORS.cyan;
      const scale = type === "masterAttack" ? 1.8 : 1.15;
      this.shakeImpact(type === "masterAttack" ? 180 : 100, type === "masterAttack" ? 0.006 : 0.0028, 100);
      this.spawnFx("weaponBlast", finite(event?.x, this.player.x), finite(event?.y, this.player.y), color, scale);
    } else if (type === "stratosRunSweep") {
      this.shakeImpact(95, 0.0032, 80);
    } else if (type === "helixTempestPulse") {
      this.shakeImpact(75, 0.0018, 130);
    } else if (type === "ultimateFire") {
      this.shakeImpact(260, 0.0085, 130);
      this.spawnFx("weaponBlast", this.player.x, this.player.y, COLORS.cyan, 2.1);
    } else if (type === "ultimateImpact" || type === "explosion") {
      this.shakeImpact(type === "ultimateImpact" ? 150 : 125, type === "ultimateImpact" ? 0.0055 : 0.0042, 75);
      this.spawnFx("weaponBlast", finite(event?.x, this.player.x), finite(event?.y, this.player.y), COLORS.amber, type === "ultimateImpact" ? 1.85 : 1.45);
    } else if (type === "bossPatternFire" || type === "bossRageBurst") {
      this.spawnFx("weaponBlast", this.boss.x, this.boss.y, COLORS.red, type === "bossRageBurst" ? 1.8 : 1.25);
    } else if (type === "bossParryWindow") {
      this.shakeCamera(150, 0.0035);
      this.hudCamera.flash(85, 225, 246, 255, false);
    } else if (type === "bossParrySuccess") {
      this.shakeCamera(320, 0.014);
      this.hudCamera.flash(150, 190, 255, 255, false);
      this.spawnFx("phaseBreak", this.player.x, this.player.y, COLORS.cyan, 1.8);
      this.spawnFx("bossBurst", this.boss.x, this.boss.y, COLORS.white, 2.1);
    } else if (type === "bossBombRetaliation") {
      this.shakeCamera(220, 0.009);
      this.hudCamera.flash(100, 255, 48, 66, false);
    } else if (type === "bossParryFailed" || type === "bossBombSequenceFailed") {
      this.shakeCamera(380, 0.018);
      this.hudCamera.flash(180, 255, 42, 68, false);
      this.spawnFx("playerHit", this.player.x, this.player.y, COLORS.red, 1.7);
    } else if (type === "bossSiren") {
      this.shakeCamera(460, 0.0065);
      this.hudCamera.flash(130, 255, 32, 55, false);
    } else if (type === "bossBombDefused" || type === "bossBombSequenceCleared") {
      this.spawnFx("weaponBlast", type === "bossBombDefused" ? finite(event?.x, this.player.x) : this.boss.x, type === "bossBombDefused" ? finite(event?.y, this.player.y) : this.boss.y, COLORS.green, type === "bossBombDefused" ? 0.8 : 1.9);
    } else if (type === "enemySelfDestruct") {
      this.shakeCamera(180, event?.elite ? 0.011 : 0.0075);
    } else if (type === "healthKitPicked") {
      this.spawnFx("weaponBlast", finite(event?.x), finite(event?.y), COLORS.green, 0.95);
    } else if (type === "routeClearWarning") {
      this.shakeCamera(260, 0.006);
      this.hudCamera.flash(120, 255, 190, 72, false);
      this.spawnFx("weaponBlast", this.player.x, this.player.y, COLORS.amber, 1.35);
    } else if (type === "routeClearPanic") {
      this.shakeCamera(420, 0.009);
      this.hudCamera.flash(150, 255, 50, 82, false);
      this.spawnFx("playerHit", this.player.x, this.player.y, COLORS.red, 1.3);
    } else if (type === "bossAutoTransition") {
      this.hudCamera.flash(180, 104, 239, 255, false);
    }
  }

  private shakeCamera(duration: number, intensity: number) {
    if (!this.screenShakeEnabled) return;
    this.mainCamera.shake(duration, intensity);
  }

  private shakeImpact(duration: number, intensity: number, minimumGap = 70) {
    if (!this.screenShakeEnabled) return;
    const now = this.scene.time.now;
    if (now - this.lastImpactShakeAt < minimumGap) return;
    this.lastImpactShakeAt = now;
    this.shakeCamera(duration, intensity);
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
    this.drawTelegraphs(state, time, quality);
    this.syncBossPatternSprites(state, time, quality);
    this.syncBossTimedBombSprites(state, time);
    // Keep authoritative danger geometry and actor movement at scene cadence,
    // but rebuild pooled cosmetic graphics at a bounded rate. Large waves used
    // to clear/redraw health bars, shadows and damage text every display frame.
    const cosmeticHz = this.currentQualityId === "performance" ? 20 : this.currentQualityId === "cinematic" ? 60 : 30;
    const cosmeticTick = Math.floor(this.scene.time.now / (1000 / cosmeticHz));
    if (cosmeticTick !== this.lastCosmeticTick) {
      this.lastCosmeticTick = cosmeticTick;
      this.drawEnemyHealthBars(state, quality);
      this.drawShadows(state, quality);
      this.drawWorldEffects(state, time, quality);
      this.drawImpactFx(this.scene.time.now / 1000, quality);
      this.drawForeground(state, time, quality);
      this.drawDamageTexts(state, quality);
    }
    this.drawProjectiles(state, quality);
    this.drawHudOverlay(state, time);
  }

  private syncTraceProps(state: any) {
    for (const image of this.traceSprites.values()) image.setVisible(false);
    const expedition = state?.expedition;
    if (!expedition || expedition?.bossRoom || state?.phase === "boss") return;
    const view = this.mainCamera.worldView;
    for (const trace of expedition.traces ?? []) {
      const image = this.traceSprites.get(String(trace?.id ?? ""));
      if (!image) continue;
      const triggered = Boolean(trace.triggered);
      const x = finite(trace.x, EXPEDITION_WORLD_WIDTH * 0.5);
      const y = finite(trace.y, EXPEDITION_WORLD_HEIGHT * 0.5);
      if (x < view.left - 180 || x > view.right + 180 || y < view.top - 180 || y > view.bottom + 180) continue;
      const size = trace.id === "moss" ? 62 : trace.id === "rook" ? 54 : 58;
      image
        .setVisible(true)
        .setPosition(x, y)
        .setDisplaySize(triggered ? size * 1.12 : size, triggered ? size * 1.12 : size)
        .setAlpha(triggered ? 0.92 : 1)
        .setTint(triggered ? 0xd8fbff : 0xffffff);
    }
  }

  adjustCameraZoom(deltaY: number) {
    const wheel = clamp(finite(deltaY), -240, 240);
    if (Math.abs(wheel) < 0.01) return this.userZoomFactor;
    this.userZoomFactor = clamp(this.userZoomFactor * Math.exp(-wheel * 0.0014), 0.78, 1.24);
    return this.userZoomFactor;
  }

  syncPresentationViewport() {
    const width = Math.max(1, finite(this.scene.scale.gameSize.width, WIDTH));
    const height = Math.max(1, finite(this.scene.scale.gameSize.height, HEIGHT));
    this.hudCamera.setSize(width, height);
  }

  getPresentationSnapshot() {
    const zoom = Math.max(0.001, finite(this.mainCamera.zoom, 1));
    const worldView = this.mainCamera.worldView;
    return {
      zoom,
      viewportWidth: this.mainCamera.width,
      viewportHeight: this.mainCamera.height,
      visibleWorldWidth: this.mainCamera.width / zoom,
      visibleWorldHeight: this.mainCamera.height / zoom,
      worldLeft: worldView.left,
      worldRight: worldView.right,
      worldTop: worldView.top,
      worldBottom: worldView.bottom,
    };
  }

  syncCamera(state: any) {
    const camera = state?.camera ?? { x: WIDTH / 2, y: HEIGHT / 2, zoom: 1.46 };
    const expedition = state?.expedition;
    const bossMapIndex = this.routeMapCount;
    const bossStageActive = Boolean(expedition?.bossRoom || state?.phase === "boss");
    this.mainCamera.setBounds(
      0,
      0,
      bossStageActive ? WORLD_WIDTH : EXPEDITION_WORLD_WIDTH,
      bossStageActive ? WORLD_HEIGHT : EXPEDITION_WORLD_HEIGHT,
    );
    for (let index = 0; index < this.maps.length; index += 1) {
      const alpha = bossStageActive ? Number(index === bossMapIndex) : Number(index === 0);
      const map = this.maps[index];
      map
        .setVisible(alpha > 0.001)
        .setAlpha(alpha);
    }
    const engineZoom = finite(camera.zoom, 1.08);
    // The simulation still owns the camera target, but portrait phones use a
    // presentation-only tactical lens. With a native portrait viewport these
    // values reveal roughly 1,060x2,480 world units in a 360×844 arena view.
    // Boss rooms dynamically fit the player, boss silhouette, and every live
    // mechanic target rather than magnifying the center of a 16:9 crop.
    const portraitBossFocus = this.portraitPresentation && bossStageActive
      ? resolvePortraitBossCameraFocus(
        state,
        Math.max(1, this.mainCamera.width),
        Math.max(1, this.mainCamera.height),
        this.userZoomFactor,
      )
      : null;
    const targetZoom = this.portraitPresentation
      ? bossStageActive
        ? portraitBossFocus?.zoom ?? clamp(0.66 * this.userZoomFactor, 0.6, 0.78)
        : clamp(0.34 * this.userZoomFactor, 0.3, 0.48)
      : bossStageActive
        ? clamp(engineZoom * this.userZoomFactor, 0.68, 0.98)
        : clamp(engineZoom * this.userZoomFactor, 0.84, 1.42);
    const targetX = portraitBossFocus?.x
      ?? finite(camera.x, bossStageActive ? WORLD_WIDTH / 2 : EXPEDITION_WORLD_WIDTH / 2);
    const targetY = portraitBossFocus?.y
      ?? finite(camera.y, bossStageActive ? WORLD_HEIGHT / 2 : EXPEDITION_WORLD_HEIGHT / 2);
    if (portraitBossFocus?.mechanicActive) this.bossRevealStartedAt = -1;
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
    const directionalTexture = entity?.characterId === "mika"
      ? ASSET_KEYS.playerMikaDirectionalAim
      : entity?.characterId === "vesper"
        ? ASSET_KEYS.playerVesperDirectionalAim
      : entity?.characterId === "nox"
        ? ASSET_KEYS.playerNoxDirectionalAim
      : entity?.mainWeaponId === "beam-sword"
      ? ASSET_KEYS.playerSwordDirectionalAim
      : ASSET_KEYS.playerDirectionalAim;
    const playerTexture = this.preparedAtlases.has(directionalTexture) ? directionalTexture : this.playerDirectionalTexture;
    if (this.player.texture.key !== playerTexture) this.player.setTexture(playerTexture);
    setAtlasFrame(this.player, directionalFrame.column, directionalFrame.row);
    const size = state?.phase === "boss" ? 64 : 74;
    const portraitActorScale = this.portraitPresentation && state?.phase !== "boss" ? 1.34 : 1;
    const displaySize = size * portraitActorScale;
    const rifleEquipped = entity?.characterId !== "mika" && entity?.mainWeaponId !== "beam-sword";
    const recoil = rifleEquipped && animation.clipId === "attack" ? clamp(finite(entity?.recoil) * 0.55, 0, 2) : 0;
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
      .setFlipX(false)
      .setDisplaySize(displaySize, displaySize)
      .setAlpha(entity?.dead ? clamp01(finite(entity?.deathTimer) / 0.9) : 1)
      .setVisible(true)
      .setTint(
        finite(entity?.hitFlash) > 0.03
          ? COLORS.white
          : panicActive && Math.sin(panicClock * 26) > 0
            ? 0xff8da2
            : 0xffffff,
      );

    const muzzleVisible = rifleEquipped && finite(entity?.attackTimer) > 0.055 && !entity?.dead && finite(entity?.stunTimer) <= 0;
    const muzzlePulse = 0.5 + Math.sin(this.scene.time.now * 0.085) * 0.5;
    this.muzzleFlash
      .setVisible(muzzleVisible)
      .setPosition(finite(entity?.x) + muzzle.x, finite(entity?.y) + muzzle.y)
      .setRotation(muzzle.angle)
      .setDisplaySize((42 + muzzlePulse * 8) * portraitActorScale, (24 + muzzlePulse * 5) * portraitActorScale)
      .setAlpha(clamp(0.7 + finite(entity?.attackTimer) * 2.8, 0.7, 1))
      .setTint(muzzlePulse > 0.62 ? COLORS.white : COLORS.cyan);

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
      if (ghost.texture.key !== playerTexture) ghost.setTexture(playerTexture);
      setAtlasFrame(ghost, Math.max(0, directionalFrame.column - index - 1), presentation.row);
      const distance = 22 + index * 20;
      ghost
        .setVisible(true)
        .setPosition(entity.x - Math.cos(motionAngle) * distance, entity.y - Math.sin(motionAngle) * distance)
        .setRotation(0)
        .setFlipX(false)
        .setDisplaySize(displaySize * (0.94 - index * 0.08), displaySize * (0.94 - index * 0.08))
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
    const bossHp = finite(entity?.hp);
    const bossDamage = Number.isFinite(this.lastBossHp) ? Math.max(0, this.lastBossHp - bossHp) : 0;
    this.lastBossHp = bossHp;
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
      ? this.regionAssets.expandedBossMotion ? resolveExpandedBossFrame(animation, entity) : resolveDedicatedAtlasFrame("boss", animation, entity)
      : animation.fallbackAtlasFrame;
    setAtlasFrame(this.boss, bossFrame.column, bossFrame.row);
    setAtlasFrame(this.bossPhaseArt, bossFrame.column, bossFrame.row);
    const isHit = finite(entity?.hitFlash) > 0.04;
    if (isHit && !this.bossWasHit) {
      this.spawnFx("bossHit", finite(entity?.x), finite(entity?.y), COLORS.red, clamp(1.35 + bossDamage / 260, 1.35, 2.35));
      if (bossDamage >= 120) this.shakeImpact(90, 0.0022, 80);
    }
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
    if (animation.clipId === "windup") {
      targetScale = 1 + clipProgress * 0.04 + signalWave * 0.018;
    } else if (animation.clipId === "attack") {
      targetScale = 1 + signalWave * 0.035;
      recoilDistance = clamp(finite(entity?.recoil), 0, 2) * 11;
    } else if (animation.clipId === "transform") {
      targetScale = 1 + Math.sin(time * 22) * 0.055;
    } else if (animation.clipId === "hit") {
      targetScale = 0.965 + clipProgress * 0.035;
      recoilDistance = 4 * (1 - clipProgress);
    } else if (animation.clipId === "death") {
      targetScale = 1 - clipProgress * 0.09;
    } else if (animation.clipId === "idle") {
      targetScale = 1 + Math.sin(time * 2.4) * 0.008;
    }
    this.bossVisualScale += (targetScale - this.bossVisualScale) * 0.18;
    const alpha = entity?.dead ? clamp01(finite(entity?.deathTimer) / Math.max(0.01, finite(entity?.deathDuration, 1.25))) : 1;
    const bossSize = stage === 3 ? 640 : stage === 2 ? 560 : 480;
    const angle = actorAngle(entity);
    const visualAngle = resolveActorFacing("boss", entity).rotation;
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
    const portraitActorScale = this.portraitPresentation && state?.phase !== "boss" ? 1.34 : 1;
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
      const hp = finite(entity?.hp);
      const hitDamage = record ? Math.max(0, record.lastHp - hp) : 0;
      if (record) {
        if (hp < record.lastHp - 0.01 || (isHit && !record.wasHit)) {
          record.healthBarUntil = this.scene.time.now + ENEMY_HEALTH_BAR_HOLD_MS;
        }
        record.lastHp = hp;
      }
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
        const regionalTexture = regionalEnemyTexture(entity);
        const motionTexture = enemyMotionTexture(entity);
        const texture = regionalTexture && this.preparedAtlases.has(regionalTexture)
          ? regionalTexture
          : this.scene.textures.exists(motionTexture) ? motionTexture : enemyFallbackTexture(entity);
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
          lastHp: hp,
          healthBarUntil: isHit ? this.scene.time.now + ENEMY_HEALTH_BAR_HOLD_MS : 0,
        };
        this.enemySprites.set(id, record);
      }
      record.seen = true;
      record.live = true;
      const image = record.image;
      const clipElapsed = updateClipClock(record, selectedClip.id, time);
      const phaseOffset = selectedClip.loop ? Math.abs(Math.trunc(id * 3.17)) % selectedClip.frameCount : 0;
      const motionTexture = enemyMotionTexture(entity);
      const regionalTexture = regionalEnemyTexture(entity);
      const usesRegionalForms = Boolean(regionalTexture && this.preparedAtlases.has(regionalTexture));
      const usesDedicatedMotion = !usesRegionalForms && this.preparedAtlases.has(motionTexture);
      const texture = usesRegionalForms && regionalTexture ? regionalTexture : usesDedicatedMotion ? motionTexture : enemyFallbackTexture(entity);
      if (image.texture.key !== texture) image.setTexture(texture);
      if (isHit && !record.wasHit) {
        const impactScale = clamp((entity?.elite ? 1.18 : 0.78) + hitDamage / 92, 0.78, entity?.elite ? 1.9 : 1.5);
        this.spawnFx("armorHit", x, y, entity?.elite ? COLORS.amber : COLORS.red, impactScale);
        if (hitDamage >= (entity?.elite ? 38 : 52)) {
          this.spawnFx("weaponBlast", x, y, entity?.elite ? COLORS.amber : COLORS.cyan, impactScale * 0.72);
          this.shakeImpact(70, 0.0018, 85);
        }
      }
      if (isDead && !record.wasDead) this.spawnFx("enemyBurst", x, y, entity?.elite ? COLORS.amber : COLORS.red, entity?.elite ? 1.55 : 0.9);
      record.wasHit = isHit;
      record.wasDead = isDead;
      if (usesRegionalForms) {
        const animation = sampleActorAnimation("enemy", entity, clipElapsed, phaseOffset);
        const frame = resolveRegionalEnemyFrame(role, animation, Boolean(entity?.isMidBoss));
        setAtlasFrame(image, frame.column, frame.row);
      } else if (usesDedicatedMotion) {
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
      const baseSize = entity?.isMidBoss ? 248 : role === 3 ? 196 : role === 2 ? 138 : role === 1 ? 108 : 92;
      const materialize = finite(entity?.spawnDuration) > 0
        ? clamp01(1 - finite(entity?.spawnDelay) / Math.max(0.01, finite(entity?.spawnDuration)))
        : 1;
      const selfDestructArmed = role === 0 && Boolean(entity?.selfDestructArmed);
      const selfDestructProgress = selfDestructArmed
        ? clamp01(1 - finite(entity?.selfDestructTimer) / Math.max(0.01, finite(entity?.selfDestructDuration, 0.95)))
        : 0;
      const selfDestructFlash = selfDestructArmed
        && Math.sin(time * (18 + selfDestructProgress * 44) + id * 0.37) > -0.08;
      const armedScale = selfDestructArmed
        ? 1 + selfDestructProgress * 0.08 + Math.max(0, Math.sin(time * 26 + id)) * 0.035
        : 1;
      const size = baseSize * (entity?.elite ? 1.16 : 1) * (0.72 + materialize * 0.28) * armedScale * portraitActorScale;
      const alpha = (entity?.dead ? clamp01(finite(entity?.deathTimer) / (entity?.elite ? 0.46 : 0.32)) : 1)
        * clamp01((materialize - 0.08) / 0.72);
      const tint = selfDestructFlash
        ? COLORS.white
        : selfDestructArmed
          ? COLORS.red
          : entity?.elite
            ? COLORS.amber
            : finite(entity?.hitFlash) > 0.04
              ? COLORS.white
              : 0xffffff;
      image
        .setVisible(true)
        .setPosition(x, y)
        .setRotation(resolveActorFacing("enemy", entity).rotation)
        .setFlipX(resolveActorFacing("enemy", entity).flipX)
        .setDisplaySize(size, size)
        .setAlpha(alpha)
        .setTint(tint);
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

  private drawEnemyHealthBars(state: any, quality: QualityPreset) {
    const graphics = this.enemyHealthGraphics;
    graphics.clear();
    const enemies = Array.isArray(state?.enemies) ? state.enemies : [];
    if (enemies.length === 0 || state?.phase === "boss") return;

    const qualityId = String(quality.id ?? "balanced");
    const cap = qualityId === "performance"
      ? ENEMY_HEALTH_BAR_CAPS.performance
      : qualityId === "cinematic"
        ? ENEMY_HEALTH_BAR_CAPS.cinematic
        : ENEMY_HEALTH_BAR_CAPS.balanced;
    const now = this.scene.time.now;
    const playerX = finite(state?.player?.x);
    const playerY = finite(state?.player?.y);
    const playerRadius = Math.max(1, finite(state?.player?.radius, 20));
    const aimAngle = actorAngle(state?.player);
    const aimCos = Math.cos(aimAngle);
    const aimSin = Math.sin(aimAngle);
    let candidateCount = 0;

    for (let index = 0; index < enemies.length; index += 1) {
      const entity = enemies[index];
      if (entity?.dead || finite(entity?.spawnDelay) > 0) continue;
      const id = finite(entity?.id, index + 1);
      const record = this.enemySprites.get(id);
      if (!record?.image.visible || record.image.alpha < 0.55) continue;
      const hpRatio = ratio(entity);
      if (hpRatio <= 0) continue;

      const dx = finite(entity?.x) - playerX;
      const dy = finite(entity?.y) - playerY;
      const distanceSq = dx * dx + dy * dy;
      const roleIndex = record.roleIndex;
      const recentlyDamaged = now <= record.healthBarUntil;
      const elite = Boolean(entity?.elite);
      const nearPlayer = distanceSq <= 330 * 330;
      const sniperEngaged = roleIndex === 2 && (finite(entity?.aimTimer) > 0 || finite(entity?.attackTimer) > 0.01);
      const rifleEngaged = roleIndex === 1 && (finite(entity?.burstShots) > 0 || finite(entity?.attackTimer) > 0.01);
      const selfDestructArmed = roleIndex === 0 && Boolean(entity?.selfDestructArmed);
      const suicideDanger = roleIndex === 0 && (selfDestructArmed || distanceSq <= 460 * 460);
      const aimDepth = dx * aimCos + dy * aimSin;
      const aimLateral = Math.abs(dx * aimSin - dy * aimCos);
      const aimTargeted = aimDepth > 0
        && aimDepth <= 760
        && aimLateral <= Math.max(34, finite(entity?.radius, 22) + 18);
      if (!recentlyDamaged && !elite && !nearPlayer && !sniperEngaged && !rifleEngaged && !suicideDanger && !aimTargeted) continue;

      const warranted = Boolean(entity?.noxWarranted);
      const persistent = roleIndex === 3 || elite || nearPlayer || sniperEngaged || rifleEngaged || suicideDanger || aimTargeted || warranted;
      const proximityBonus = Math.max(0, 360 * 360 - distanceSq) / (360 * 360) * 100;
      const priority = (recentlyDamaged ? 1000 : 0)
        + (selfDestructArmed ? 1200 : 0)
        + (elite ? 900 : 0)
        + (sniperEngaged ? 850 : 0)
        + (suicideDanger ? 800 : 0)
        + (aimTargeted ? 750 : 0)
        + (warranted ? 1100 : 0)
        + (rifleEngaged ? 650 : 0)
        + (nearPlayer ? 600 : 0)
        + proximityBonus;

      let slot = candidateCount;
      if (candidateCount < cap) {
        candidateCount += 1;
      } else {
        slot = 0;
        let lowestPriority = this.enemyHealthBarScratch[0].priority;
        for (let candidateIndex = 1; candidateIndex < cap; candidateIndex += 1) {
          const candidatePriority = this.enemyHealthBarScratch[candidateIndex].priority;
          if (candidatePriority >= lowestPriority) continue;
          lowestPriority = candidatePriority;
          slot = candidateIndex;
        }
        if (priority <= lowestPriority) continue;
      }

      const candidate = this.enemyHealthBarScratch[slot];
      candidate.entity = entity;
      candidate.record = record;
      candidate.priority = priority;
      candidate.distanceSq = distanceSq;
      candidate.roleIndex = roleIndex;
      candidate.persistent = persistent;
    }

    const zoom = Math.max(0.68, finite(this.mainCamera.zoom, 1));
    for (let index = 0; index < candidateCount; index += 1) {
      const candidate = this.enemyHealthBarScratch[index];
      const entity = candidate.entity;
      const record = candidate.record;
      if (!entity || !record) continue;
      const image = record.image;
      const hpRatio = ratio(entity);
      const holdAlpha = clamp01((record.healthBarUntil - now) / 350);
      const alpha = Math.min(image.alpha, candidate.persistent ? 0.96 : holdAlpha * 0.96);
      if (alpha <= 0.02) continue;

      const screenWidth = entity?.isMidBoss ? 190 : (candidate.roleIndex === 3 ? 104 : candidate.roleIndex === 2 ? 72 : candidate.roleIndex === 1 ? 64 : 54)
        + (entity?.elite ? 8 : 0);
      const width = screenWidth / zoom;
      const height = (entity?.isMidBoss ? 11 : entity?.elite ? 7 : 6) / zoom;
      const border = 1.25 / zoom;
      const left = image.x - width * 0.5;
      const top = image.y - image.displayHeight * 0.56 - 10 / zoom;
      const healthColor = COLORS.red;
      const outlineColor = finite(entity?.hitFlash) > 0.04 ? COLORS.white : 0xb77a84;

      graphics.fillStyle(COLORS.black, alpha * 0.9);
      graphics.fillRect(left - border, top - border, width + border * 2, height + border * 2);
      graphics.fillStyle(0x17252a, alpha * 0.92);
      graphics.fillRect(left, top, width, height);
      graphics.fillStyle(healthColor, alpha);
      graphics.fillRect(left, top, Math.max(0, width * hpRatio), height);
      graphics.lineStyle(border, outlineColor, alpha * 0.9);
      graphics.strokeRect(left - border * 0.5, top - border * 0.5, width + border, height + border);

      const statusTop = top + height + 2.5 / zoom;
      if (finite(entity?.disabledTimer) > 0) {
        graphics.fillStyle(COLORS.black, alpha * 0.82);
        graphics.fillRect(left, statusTop, 12 / zoom, 3 / zoom);
        graphics.fillStyle(COLORS.cyan, alpha);
        graphics.fillRect(left + 1 / zoom, statusTop + 1 / zoom, 10 / zoom, 1 / zoom);
      }
      if (entity?.noxWarranted) {
        const markerRadius = 9 / zoom;
        const markerX = image.x + width * 0.5 - markerRadius * 0.4;
        const markerY = top - markerRadius * 0.72;
        graphics.lineStyle(2 / zoom, 0xff455d, alpha);
        graphics.strokeCircle(markerX, markerY, markerRadius);
        graphics.lineBetween(markerX - markerRadius * 0.8, markerY, markerX + markerRadius * 0.8, markerY);
        graphics.lineBetween(markerX, markerY - markerRadius * 0.8, markerX, markerY + markerRadius * 0.8);
      }
      if (candidate.roleIndex === 0) {
        const distance = Math.sqrt(candidate.distanceSq);
        const contactDistance = Math.max(1, finite(entity?.radius, 22) + playerRadius + 4);
        const danger = entity?.selfDestructArmed
          ? clamp01(1 - finite(entity?.selfDestructTimer) / Math.max(0.01, finite(entity?.selfDestructDuration, 0.95)))
          : clamp01(1 - (distance - contactDistance) / Math.max(1, 460 - contactDistance));
        if (danger > 0.02) {
          const dangerWidth = width * danger;
          const dangerTop = statusTop + (finite(entity?.disabledTimer) > 0 ? 4 / zoom : 0);
          graphics.fillStyle(COLORS.redDark, alpha * 0.9);
          graphics.fillRect(left, dangerTop, width, 3 / zoom);
          graphics.fillStyle(COLORS.red, alpha);
          graphics.fillRect(left, dangerTop, dangerWidth, 3 / zoom);
        }
      }
    }
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
            lastHp: finite(entity?.hp),
            healthBarUntil: 0,
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
        const size = type.includes("sentry") ? 58 : type.includes("emp") ? 64 : humanoid ? 70 : 52;
        const angle = actorAngle(entity);
        const stationary = (type.includes("sentry") && !entity?.mobileEscort) || type.includes("emp");
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
        const visualAngle = resolveActorFacing("ally", entity).rotation;
        record.image
          .setVisible(true)
          .setPosition(
            x - Math.cos(angle) * recoilDistance,
            y - Math.sin(angle) * recoilDistance + hover,
          )
          .setRotation(visualAngle)
          .setFlipX(resolveActorFacing("ally", entity).flipX)
          .setDisplaySize(size * spawnScale * attackScale, size * spawnScale * attackScale)
          .setAlpha(clamp01(finite(entity?.alpha, 1)) * (0.42 + spawnEase * 0.58))
          .setTint(pulseAttack && attackActive ? 0xc8fbff : 0xffffff);
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
    const player = state?.player;
    if (this.portraitPresentation && state?.phase !== "boss" && !player?.dead) {
      const playerX = finite(player?.x);
      const playerY = finite(player?.y);
      const pulse = (Math.sin(this.scene.time.now * 0.008) + 1) * 0.5;
      const ringRadius = 35 + pulse * 3;
      graphics.fillStyle(COLORS.cyan, 0.08 + pulse * 0.03);
      graphics.fillCircle(playerX, playerY, ringRadius + 9);
      graphics.lineStyle(7, COLORS.black, 0.78);
      graphics.strokeCircle(playerX, playerY, ringRadius);
      graphics.lineStyle(3, COLORS.cyan, 0.9);
      graphics.strokeCircle(playerX, playerY, ringRadius);

      const aimX = finite(state?.aim?.x, finite(state?.aimX, playerX + 1));
      const aimY = finite(state?.aim?.y, finite(state?.aimY, playerY));
      const aimAngle = Math.atan2(aimY - playerY, aimX - playerX);
      const directionX = Math.cos(aimAngle);
      const directionY = Math.sin(aimAngle);
      const tipX = playerX + directionX * (ringRadius + 13);
      const tipY = playerY + directionY * (ringRadius + 13);
      const baseX = playerX + directionX * (ringRadius + 2);
      const baseY = playerY + directionY * (ringRadius + 2);
      const perpendicularX = -directionY * 6;
      const perpendicularY = directionX * 6;
      graphics.fillStyle(COLORS.black, 0.86);
      graphics.fillTriangle(
        tipX + directionX * 3,
        tipY + directionY * 3,
        baseX + perpendicularX,
        baseY + perpendicularY,
        baseX - perpendicularX,
        baseY - perpendicularY,
      );
      graphics.fillStyle(COLORS.cyan, 0.96);
      graphics.fillTriangle(tipX, tipY, baseX + perpendicularX * 0.72, baseY + perpendicularY * 0.72, baseX - perpendicularX * 0.72, baseY - perpendicularY * 0.72);
    }
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
        if (cursor >= this.bossTimedBombSprites.length) break;
        if (bomb?.exploded) continue;
        const image = this.bossTimedBombSprites[cursor];
        const label = this.bossTimedBombLabels[cursor];
        const defused = Boolean(bomb?.defused);
        const retaliating = !defused && phase === "retaliation";
        const expected = !defused && finite(bomb?.order) === finite(sequence.expectedOrder, 1);
        const pulse = Math.round((Math.sin(time * 10 + cursor) * 0.5 + 0.5) * 10);
        let column = defused ? 4 : 0;
        if (!defused && phase === "siren") column = Math.min(3, Math.floor(clamp01(finite(sequence.progress)) * 4));
        if (!defused && phase === "armed") {
          const blink = Math.floor(time * (urgency > 0.66 ? 12 : 7)) % 2;
          column = urgency > 0.72 ? 3 - blink : 1 + blink;
        }
        if (retaliating) column = 5;
        const portraitMechanicScale = this.portraitPresentation ? 1.35 : 1;
        const bombSize = (retaliating ? 196 + pulse : expected ? 188 + pulse : 170) * portraitMechanicScale;
        setAtlasFrame(image, column, 0);
        image
          .setPosition(finite(bomb?.x), finite(bomb?.y))
          .setDisplaySize(bombSize, bombSize)
          .setRotation(retaliating
            ? Math.atan2(finite(state?.player?.y) - finite(bomb?.y), finite(state?.player?.x) - finite(bomb?.x)) + Math.PI * 0.5
            : 0)
          .setAlpha(defused ? 0.62 : 1)
          .setVisible(true)
          .clearTint();
        label
          .setPosition(finite(bomb?.x), finite(bomb?.y) - 2)
          .setText(defused ? "✓" : retaliating ? "!" : String(bomb?.order ?? cursor + 1))
          .setColor(defused ? "#cffff0" : expected ? "#031014" : "#ffffff")
          .setBackgroundColor(defused ? "#0b4538" : expected ? "#eaffff" : retaliating ? "#ff263f" : "#25060d")
          .setStroke(defused ? "#05221c" : expected ? "#ffffff" : "#020609", expected ? 4 : 10)
          .setScale(this.portraitPresentation ? 1.32 : 1)
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
    for (const enemy of state?.enemies ?? []) {
      if (enemy?.dead || !enemy?.selfDestructArmed || finite(enemy?.spawnDelay) > 0) continue;
      const x = finite(enemy?.x);
      const y = finite(enemy?.y);
      const radius = Math.max(48, finite(enemy?.selfDestructBlastRadius, 210));
      if (!this.isCircleVisible(x, y, radius, 24)) continue;
      const remaining = clamp01(
        finite(enemy?.selfDestructTimer) / Math.max(0.01, finite(enemy?.selfDestructDuration, 0.95)),
      );
      const progress = 1 - remaining;
      const pulse = 0.5 + Math.sin(time * (20 + progress * 34) + finite(enemy?.id)) * 0.5;
      graphics.fillStyle(COLORS.red, 0.025 + progress * 0.045);
      graphics.fillCircle(x, y, radius);
      graphics.lineStyle(3.5, pulse > 0.46 ? COLORS.white : COLORS.red, 0.72 + pulse * 0.24);
      graphics.strokeCircle(x, y, radius);
      graphics.lineStyle(2, COLORS.red, 0.78);
      graphics.strokeCircle(x, y, Math.max(14, radius * remaining));
      const bracketReach = radius + 12;
      const bracketInset = radius - 14;
      for (let bracket = 0; bracket < 4; bracket += 1) {
        const angle = bracket * Math.PI * 0.5;
        graphics.lineStyle(4, pulse > 0.62 ? COLORS.white : COLORS.red, 0.84);
        graphics.lineBetween(
          x + Math.cos(angle) * bracketInset,
          y + Math.sin(angle) * bracketInset,
          x + Math.cos(angle) * bracketReach,
          y + Math.sin(angle) * bracketReach,
        );
      }
    }
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
    this.syncSwordEffectFx(state, quality);
    this.syncSwordManualAbilityFx(state, quality);
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
      const progress = clamp01(1 - remaining);
      const frame = Math.min(5, Math.floor(progress * 6));
      const image = this.getManualAbilitySprite(visible++);
      image.setTexture(ASSET_KEYS.empPulseHd);
      setAtlasFrame(image, frame, 0);
      image
        .setBlendMode(Phaser.BlendModes.ADD)
        .setOrigin(0.5)
        .setVisible(true)
        .setPosition(x, y)
        .setRotation(0)
        // The authored wave fills a square cell without crossing it. A 2.2x
        // diameter keeps its bright outer ring aligned with the engine radius.
        .setDisplaySize(radius * 2.2, radius * 2.2)
        .setAlpha(0.94 * clamp01(remaining / 0.12))
        .clearTint();
      graphics.lineStyle(3, COLORS.cyan, 0.34 + remaining * 0.24);
      graphics.strokeCircle(x, y, radius);
      if (quality.id !== "performance") {
        graphics.lineStyle(1, COLORS.white, 0.18 + remaining * 0.12);
        graphics.strokeCircle(x, y, radius * (0.72 + Math.sin(time * 9.2) * 0.018));
      }
    }

    const wards = Array.isArray(state?.aegisWards) ? state.aegisWards : [];
    if (wards.length > 0 && visible < spriteCap) {
      const ward = wards[wards.length - 1];
      const geometry = ward?.geometry ?? ward;
      const x = finite(geometry?.x, finite(ward?.x, finite(state?.player?.x)));
      const y = finite(geometry?.y, finite(ward?.y, finite(state?.player?.y)));
      const radius = Math.max(20, finite(geometry?.radius, finite(ward?.radius, 132)));
      const remaining = clamp01(finite(ward?.life) / Math.max(0.001, finite(ward?.maxLife, 5)));
      const progress = clamp01(1 - remaining);
      const wardColumn = progress < 0.12
        ? Math.min(2, Math.floor(progress / 0.04))
        : remaining < 0.18 ? 5 : Math.floor(time * 4.5) % 2 === 0 ? 2 : 3;
      const image = this.getManualAbilitySprite(visible++);
      image.setTexture(ASSET_KEYS.aegisWardHd);
      setAtlasFrame(image, wardColumn, 0);
      image
        .setBlendMode(Phaser.BlendModes.ADD)
        .setOrigin(0.5)
        .setVisible(true)
        .setPosition(x, y)
        .setRotation(0)
        .setDisplaySize(radius * 2.5, radius * 2.5)
        .setAlpha(0.9 * clamp01(remaining / 0.08))
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
        .setRotation(angle + Math.PI / 2)
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
    if (image.texture.key !== ASSET_KEYS.manualAbilityPixel) image.setTexture(ASSET_KEYS.manualAbilityPixel);
    return image;
  }

  private syncSwordEffectFx(state: any, quality: QualityPreset) {
    const effects = Array.isArray(state?.swordEffects) ? state.swordEffects : [];
    const cap = quality.id === "performance" ? 6 : quality.id === "cinematic" ? 16 : 10;
    let visible = 0;
    for (let index = Math.max(0, effects.length - cap); index < effects.length && visible < cap; index += 1) {
      const effect = effects[index];
      const x = finite(effect?.x);
      const y = finite(effect?.y);
      const radius = Math.max(48, finite(effect?.radius, 150));
      if (!this.isCircleVisible(x, y, radius, 48)) continue;
      let image = this.swordEffectSprites[visible];
      if (!image) {
        image = this.scene.add.image(0, 0, ASSET_KEYS.swordSkillPixel).setBlendMode(Phaser.BlendModes.ADD);
        this.worldFront.add(image);
        this.swordEffectSprites.push(image);
      }
      const type = String(effect?.type ?? "swordSlash");
      const row = type === "crescentWave" ? 1 : type === "titanEdge" ? 2 : type === "flashRend" ? 3 : 0;
      const progress = 1 - clamp01(finite(effect?.life) / Math.max(0.001, finite(effect?.maxLife, 0.3)));
      const frame = Math.min(5, Math.floor(progress * 6));
      const size = type === "titanEdge"
        ? Math.min(620, radius * 2.05)
        : type === "flashRend" ? Math.min(420, radius * 1.35) : Math.min(460, radius * 1.75);
      setAtlasFrame(image, frame, row);
      image
        .setVisible(true)
        .setPosition(x, y)
        .setRotation(finite(effect?.angle))
        .setDisplaySize(size, size)
        .setAlpha(0.96 * clamp01(finite(effect?.life) / Math.max(0.08, finite(effect?.maxLife, 0.3) * 0.24)))
        .clearTint();
      visible += 1;
    }
    for (let index = visible; index < this.swordEffectSprites.length; index += 1) this.swordEffectSprites[index].setVisible(false);
  }

  private syncSwordManualAbilityFx(state: any, quality: QualityPreset) {
    const effects = Array.isArray(state?.swordManualAbilities) ? state.swordManualAbilities : [];
    const cap = quality.id === "performance" ? 4 : 8;
    let visible = 0;
    for (let index = Math.max(0, effects.length - cap); index < effects.length && visible < cap; index += 1) {
      const effect = effects[index];
      const x = finite(effect?.x);
      const y = finite(effect?.y);
      const radius = Math.max(80, finite(effect?.radius, 320));
      if (!this.isCircleVisible(x, y, radius, 96)) continue;
      let image = this.swordManualAbilitySprites[visible];
      const vesperEffect = effect?.atlas === "vesper";
      const noxEffect = effect?.atlas === "nox";
      const texture = effect?.atlas === "mika"
        ? ASSET_KEYS.mikaAbilityPixel
        : vesperEffect
          ? ASSET_KEYS.vesperAbilityHd
          : noxEffect ? ASSET_KEYS.noxAbilityHd : ASSET_KEYS.swordManualAbilityPixel;
      if (!image) {
        image = this.scene.add.image(0, 0, texture).setBlendMode(Phaser.BlendModes.ADD);
        this.worldFront.add(image);
        this.swordManualAbilitySprites.push(image);
      }
      if (image.texture.key !== texture) image.setTexture(texture);
      const type = String(effect?.type ?? "spectralSwordArray");
      const row = noxEffect
        ? type === "nullAppeal" ? 1 : type === "redWarrant" ? 2 : type === "finalDecree" ? 3 : 0
        : vesperEffect
        ? type === "zeroMark" ? 1 : type === "railBurst" ? 2 : type === "deadline" ? 3 : 0
        : type === "phantomRend" || type === "ribbonVortex"
          ? 1
          : type === "imperialSwordDomain" || type === "cometDuet"
            ? 2
            : type === "heavenfallExecution" || type === "heartbeatCarnival" ? 3 : 0;
      const progress = 1 - clamp01(finite(effect?.life) / Math.max(0.001, finite(effect?.maxLife, 1)));
      const visualProgress = type === "heavenfallExecution" && !effect?.detonated
        ? 1 - clamp01(finite(effect?.warning) / Math.max(0.001, finite(effect?.warningMax, 0.68)))
        : progress;
      const frame = Math.min(5, Math.floor(visualProgress * 6));
      const size = type === "heavenfallExecution" || type === "heartbeatCarnival"
        ? Math.min(960, radius * 1.34)
        : type === "imperialSwordDomain" || type === "cometDuet" ? Math.min(780, radius * 1.4) : Math.min(620, radius * 1.62);
      setAtlasFrame(image, frame, row);
      image
        .setVisible(true)
        .setPosition(x, y)
        .setRotation(finite(effect?.angle))
        .setDisplaySize(size, size)
        .setAlpha((0.86 / (1 + Math.max(0, Math.min(4, effects.length) - 1) * 0.2))
          * clamp01(finite(effect?.life) / Math.max(0.12, finite(effect?.maxLife, 1) * 0.16)))
        .clearTint();
      if (vesperEffect || noxEffect) image.setBlendMode(Phaser.BlendModes.ADD);
      visible += 1;
    }
    for (let index = visible; index < this.swordManualAbilitySprites.length; index += 1) {
      this.swordManualAbilitySprites[index].setVisible(false);
    }
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
    const graphics = this.omegaLaserGraphics;
    graphics.clear();
    const spriteCap = quality.id === "performance" ? 6 : quality.id === "cinematic" ? 16 : 10;
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
      const normalX = -directionY;
      const normalY = directionX;
      const beamLength = Math.max(1, Math.hypot(x2 - x1, y2 - y1));
      const charging = beam?.phase === "charge";
      const chargeProgress = clamp01(1 - finite(beam?.charge) / Math.max(0.001, finite(beam?.chargeMax, 0.68)));
      const activeDuration = Math.max(0.2, finite(beam?.maxLife, 1.55) - finite(beam?.chargeMax, 0.68));
      const activeProgress = clamp01(1 - finite(beam?.life) / activeDuration);
      const beamAlpha = charging ? 0.06 + chargeProgress * 0.2 : clamp(finite(beam?.alpha, 1), 0.34, 1);
      const beamWidth = clamp(finite(beam?.width, 82), 28, 140);
      const pixelSize = quality.id === "performance"
        ? PIXEL_VFX_CELL * 2
        : snapPixelSize(finite(beam?.width, 82) * 2.1, PIXEL_VFX_CELL * 2, PIXEL_VFX_CELL * 3);

      if (charging) {
        const chargeWidth = 1.5 + chargeProgress * 3.5;
        graphics.lineStyle(chargeWidth * 3.4, COLORS.cyan, 0.04 + chargeProgress * 0.08);
        graphics.lineBetween(x1, y1, x2, y2);
        graphics.lineStyle(chargeWidth, COLORS.white, 0.28 + chargeProgress * 0.5);
        graphics.lineBetween(x1, y1, x2, y2);
        graphics.fillStyle(COLORS.cyan, 0.18 + chargeProgress * 0.24);
        graphics.fillCircle(x1, y1, 14 + chargeProgress * 20);
      } else {
        // A single Graphics path follows the authoritative beam endpoints.
        // Layered rails, halo, and core stay continuous at any world length,
        // avoiding the visible seams from repeating square atlas modules.
        graphics.lineStyle(beamWidth * 1.7, COLORS.violet, 0.09 * beamAlpha);
        graphics.lineBetween(x1, y1, x2, y2);
        graphics.lineStyle(beamWidth * 1.16, COLORS.cyan, 0.18 * beamAlpha);
        graphics.lineBetween(x1, y1, x2, y2);
        const railOffset = beamWidth * 0.3;
        graphics.lineStyle(Math.max(2, beamWidth * 0.075), COLORS.violet, 0.58 * beamAlpha);
        graphics.lineBetween(x1 + normalX * railOffset, y1 + normalY * railOffset, x2 + normalX * railOffset, y2 + normalY * railOffset);
        graphics.lineBetween(x1 - normalX * railOffset, y1 - normalY * railOffset, x2 - normalX * railOffset, y2 - normalY * railOffset);
        graphics.lineStyle(Math.max(8, beamWidth * 0.5), COLORS.cyan, 0.76 * beamAlpha);
        graphics.lineBetween(x1, y1, x2, y2);
        graphics.lineStyle(Math.max(3, beamWidth * 0.17), COLORS.white, 0.98 * beamAlpha);
        graphics.lineBetween(x1, y1, x2, y2);

        const pulseCount = quality.id === "performance" ? 3 : quality.id === "cinematic" ? 8 : 5;
        const pulseLength = clamp(beamLength * 0.035, 22, 70);
        graphics.lineStyle(Math.max(2, beamWidth * 0.1), COLORS.white, 0.72 * beamAlpha);
        for (let index = 0; index < pulseCount; index += 1) {
          const head = ((time * 2.9 + index / pulseCount) % 1) * beamLength;
          const tail = Math.max(0, head - pulseLength);
          graphics.lineBetween(
            x1 + directionX * tail,
            y1 + directionY * tail,
            x1 + directionX * head,
            y1 + directionY * head,
          );
        }
        graphics.fillStyle(COLORS.white, 0.72 * beamAlpha);
        graphics.fillCircle(x2, y2, beamWidth * 0.3);
        graphics.fillStyle(COLORS.cyan, 0.24 * beamAlpha);
        graphics.fillCircle(x2, y2, beamWidth * 0.72);
      }

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
      const noxWarrant = projectileKind.includes("noxwarrant");
      const swordWave = projectileKind.includes("crescent");
      const vesperNeedle = projectileKind.includes("vesper");
      const vesperLockLance = projectileKind.includes("vesperlocklance");
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
      const projectileTexture = swordWave ? ASSET_KEYS.swordSkillPixel : ASSET_KEYS.combatFx;
      if (image.texture.key !== projectileTexture) image.setTexture(projectileTexture);
      if (swordWave) {
        const swordFrame = Math.min(5, Math.floor(clamp01(finite(projectile?.age) / 0.48) * 6));
        setAtlasFrame(image, swordFrame, 1);
      } else {
        setAtlasFrame(image, art.column, art.row);
      }
      image
        .setVisible(true)
        .setPosition(displayX, displayY)
        .setRotation(angle)
        .setDisplaySize(art.width, art.height)
        .setAlpha(0.96)
        .setTint(colorNumber(projectile?.color, 0xffffff));
      if (!projectileKind.includes("orbit") && launchAge > 0.012) {
        const trailLength = noxWarrant
          ? 92
          : vesperLockLance
          ? 112
          : vesperNeedle
            ? 62
            : projectileKind.includes("rail") || projectileKind.includes("overdrive")
              ? 86
          : projectileKind.includes("rocket") || projectileKind.includes("sentry")
            ? 52
            : 34;
        const trailColor = colorNumber(projectile?.color, COLORS.cyan);
        if (noxWarrant) {
          const normalX = -Math.sin(angle);
          const normalY = Math.cos(angle);
          const trailStartX = displayX - Math.cos(angle) * trailLength;
          const trailStartY = displayY - Math.sin(angle) * trailLength;
          graphics.lineStyle(5, trailColor, 0.24);
          graphics.lineBetween(trailStartX, trailStartY, displayX, displayY);
          graphics.lineStyle(1.8, 0xfff1f3, 0.92);
          graphics.lineBetween(trailStartX + normalX * 3, trailStartY + normalY * 3, displayX, displayY);
          graphics.lineBetween(trailStartX - normalX * 3, trailStartY - normalY * 3, displayX, displayY);
        } else if (vesperNeedle) {
          const normalX = -Math.sin(angle);
          const normalY = Math.cos(angle);
          const gap = vesperLockLance ? 4.5 : 2.5;
          const trailStartX = displayX - Math.cos(angle) * trailLength;
          const trailStartY = displayY - Math.sin(angle) * trailLength;
          const trailEndX = displayX - Math.cos(angle) * art.width * 0.18;
          const trailEndY = displayY - Math.sin(angle) * art.width * 0.18;
          graphics.lineStyle(vesperLockLance ? 3.2 : 2.2, trailColor, vesperLockLance ? 0.88 : 0.76);
          graphics.lineBetween(trailStartX + normalX * gap, trailStartY + normalY * gap, trailEndX + normalX * gap, trailEndY + normalY * gap);
          graphics.lineBetween(trailStartX - normalX * gap, trailStartY - normalY * gap, trailEndX - normalX * gap, trailEndY - normalY * gap);
          graphics.lineStyle(1.25, 0x8ff4ff, 0.7);
          graphics.lineBetween(trailStartX, trailStartY, trailEndX, trailEndY);
          const finX = displayX - Math.cos(angle) * 12;
          const finY = displayY - Math.sin(angle) * 12;
          graphics.lineStyle(1.8, 0xfff1a6, 0.9);
          graphics.lineBetween(finX + normalX * 7, finY + normalY * 7, displayX - Math.cos(angle) * 2, displayY - Math.sin(angle) * 2);
          graphics.lineBetween(finX - normalX * 7, finY - normalY * 7, displayX - Math.cos(angle) * 2, displayY - Math.sin(angle) * 2);
        } else {
          graphics.lineStyle(projectileKind.includes("rail") ? 5.5 : 3.5, trailColor, projectileKind.includes("rail") ? 0.72 : 0.56);
          graphics.lineBetween(
            displayX - Math.cos(angle) * trailLength,
            displayY - Math.sin(angle) * trailLength,
            displayX - Math.cos(angle) * art.width * 0.18,
            displayY - Math.sin(angle) * art.width * 0.18,
          );
        }
      }
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
        .setDisplaySize(sniper ? 154 : 68, sniper ? 34 : 24)
        .setAlpha(sniper ? 1 : 0.94)
        .setTint(colorNumber(projectile?.color, COLORS.red));
      if (sniper) {
        graphics.lineStyle(5, COLORS.red, 0.26);
        graphics.lineBetween(x - Math.cos(angle) * 112, y - Math.sin(angle) * 112, x, y);
      } else {
        graphics.lineStyle(3.5, COLORS.red, 0.34);
        graphics.lineBetween(x - Math.cos(angle) * 46, y - Math.sin(angle) * 46, x, y);
      }
      visibleEnemyProjectiles += 1;
    }
    for (let index = visibleEnemyProjectiles; index < this.enemyProjectileSprites.length; index += 1) this.enemyProjectileSprites[index].setVisible(false);
  }

  private spawnFx(kind: ViewFxKind, x: number, y: number, color: number, scale = 1) {
    const duration = kind === "bossBurst" ? 1.25
      : kind === "phaseBreak" ? 0.95
        : kind === "enemyBurst" ? 0.52
          : kind === "stratosBlast" ? 0.62
          : kind === "weaponBlast" ? 0.38
            : kind === "armorHit" || kind === "bossHit" ? 0.34
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
      const stratosBlast = fx.kind === "stratosBlast";
      const radius = (hit ? 6 + progress * 30 : stratosBlast ? 22 + progress * 82 : 12 + progress * 48) * scale * bossScale;
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
        const explosion = enemyExplosion || stratosBlast || fx.kind === "bossBurst" || fx.kind === "phaseBreak";
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
          .setRotation(enemyExplosion || stratosBlast ? 0 : progress * 0.9 + fx.seed * 0.001)
          .setDisplaySize(
            enemyExplosion ? Math.max(46, 104 * scale) : Math.max(28, radius * (explosion ? 2.4 : 1.8)),
            enemyExplosion ? Math.max(46, 104 * scale) : Math.max(28, radius * (explosion ? 2.4 : 1.8)),
          )
          .setAlpha(enemyExplosion ? Math.min(1, alpha * 1.42) : stratosBlast ? Math.min(1, alpha * 1.2) : alpha * (explosion ? 0.78 : 0.88))
          .setTint(enemyExplosion || stratosBlast ? 0xffffff : fx.color);
        spriteCount += 1;
      }

      // Enemy deaths own a six-frame pixel explosion. Drawing the legacy
      // circles and twelve procedural rays on top both muddied that authored
      // animation and multiplied Graphics tessellation during mass kills.
      if (enemyExplosion) continue;

      graphics.fillStyle(COLORS.white, alpha * (hit ? 0.96 : 0.62));
      graphics.fillCircle(fx.x, fx.y, Math.max(2, (hit ? 9 : 13) * scale * (1 - progress)));
      graphics.fillStyle(fx.color, alpha * 0.34);
      graphics.fillCircle(fx.x, fx.y, Math.max(4, radius * (hit ? 0.55 : 0.72)));
      graphics.lineStyle(Math.max(1.5, 3.2 * scale * (1 - progress * 0.4)), fx.color, alpha);
      graphics.strokeCircle(fx.x, fx.y, radius);
      graphics.lineStyle(Math.max(1, 1.3 * scale), COLORS.white, alpha * 0.8);
      graphics.strokeCircle(fx.x, fx.y, radius * 0.62);

      const baseRays = hit ? 8 : fx.kind === "bossBurst" || fx.kind === "phaseBreak" ? 24 : stratosBlast ? 18 : 12;
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
    const bombSequence = state?.boss?.bombSequence;
    if (bombSequence && Array.isArray(bombSequence.bombs)) {
      const retaliating = bombSequence.phase === "retaliation";
      for (const bomb of bombSequence.bombs) {
        if (bomb?.defused || bomb?.exploded) continue;
        const x = finite(bomb?.x);
        const y = finite(bomb?.y);
        if (retaliating) {
          const targetX = finite(state?.player?.x);
          const targetY = finite(state?.player?.y);
          graphics.lineStyle(13, COLORS.black, 0.72);
          graphics.lineBetween(x, y, targetX, targetY);
          graphics.lineStyle(4, COLORS.red, 0.96);
          graphics.lineBetween(x, y, targetX, targetY);
          graphics.lineStyle(3, COLORS.white, 0.94);
          graphics.strokeCircle(targetX, targetY, 32 + Math.sin(time * 18) * 4);
          continue;
        }
        const expected = finite(bomb?.order) === finite(bombSequence.expectedOrder, 1);
        const pulse = Math.sin(time * (expected ? 12 : 7) + finite(bomb?.order)) * 5;
        const radius = (expected ? 92 : 84) + pulse;
        graphics.lineStyle(12, COLORS.black, 0.82);
        graphics.strokeCircle(x, y, radius);
        graphics.lineStyle(expected ? 5 : 3, expected ? COLORS.white : COLORS.red, expected ? 0.98 : 0.82);
        graphics.strokeCircle(x, y, radius);
        for (let index = 0; index < 4; index += 1) {
          const angle = index * Math.PI * 0.5;
          graphics.lineStyle(7, COLORS.black, 0.86);
          graphics.lineBetween(
            x + Math.cos(angle) * (radius + 4),
            y + Math.sin(angle) * (radius + 4),
            x + Math.cos(angle) * (radius + 25),
            y + Math.sin(angle) * (radius + 25),
          );
          graphics.lineStyle(3, expected ? COLORS.cyan : COLORS.red, 0.98);
          graphics.lineBetween(
            x + Math.cos(angle) * (radius + 4),
            y + Math.sin(angle) * (radius + 4),
            x + Math.cos(angle) * (radius + 25),
            y + Math.sin(angle) * (radius + 25),
          );
        }
      }
    }
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

      const bombTargeting = state?.boss?.bombSequence?.phase === "armed";
      const radius = bombTargeting ? 32 + Math.sin(time * 9) * 2.8 : 14 + Math.sin(time * 6) * 1.2;
      graphics.lineStyle(6, COLORS.black, 0.78);
      graphics.strokeCircle(aimX, aimY, radius + 1);
      graphics.lineStyle(bombTargeting ? 5 : 2.5, bombTargeting ? COLORS.amber : COLORS.cyan, 0.98);
      graphics.strokeCircle(aimX, aimY, radius);
      graphics.lineStyle(bombTargeting ? 4 : 2, COLORS.white, 0.98);
      graphics.strokeCircle(aimX, aimY, bombTargeting ? 8 : 4);
      const bracket = radius + (bombTargeting ? 18 : 11);
      const notch = radius - (bombTargeting ? 8 : 3);
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
    const view = this.mainCamera.worldView;
    for (const trace of expedition.traces ?? []) {
      const triggered = Boolean(trace.triggered);
      const x = finite(trace.x, EXPEDITION_WORLD_WIDTH * 0.5);
      const y = finite(trace.y, EXPEDITION_WORLD_HEIGHT * 0.5);
      if (x < view.left - 160 || x > view.right + 160 || y < view.top - 160 || y > view.bottom + 160) continue;
      const pulse = 0.5 + Math.sin(time * (triggered ? 7 : 5) + finite(trace.distance) * 0.01) * 0.16;
      graphics.lineStyle(triggered ? 4 : 2, triggered ? COLORS.white : COLORS.cyan, pulse);
      graphics.strokeCircle(x, y - 12, (triggered ? 24 : 18) + pulse * 5);
      graphics.lineStyle(triggered ? 2 : 1, triggered ? COLORS.cyan : COLORS.cyan, 0.82);
      graphics.lineBetween(x, y - 31, x, y - 66);
      graphics.fillStyle(triggered ? COLORS.white : COLORS.cyan, 0.96);
      graphics.fillCircle(x, y - 70, 4);
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

  private drawPortraitThreatIndicators(state: any, graphics: Phaser.GameObjects.Graphics, viewportWidth: number, viewportHeight: number) {
    if (!this.portraitPresentation || state?.phase === "boss") return;
    const playerX = finite(state?.player?.x);
    const playerY = finite(state?.player?.y);
    const view = this.mainCamera.worldView;
    const centerX = viewportWidth * 0.5;
    const centerY = viewportHeight * 0.5;
    const horizontalReach = Math.max(32, centerX - 24);
    const verticalReach = Math.max(32, centerY - 28);
    let rendered = 0;
    for (const enemy of state?.enemies ?? []) {
      if (rendered >= 5 || enemy?.dead || finite(enemy?.spawnDelay) > 0) continue;
      const enemyX = finite(enemy?.x);
      const enemyY = finite(enemy?.y);
      const visible = enemyX >= view.left && enemyX <= view.right && enemyY >= view.top && enemyY <= view.bottom;
      if (visible) continue;
      const deltaX = enemyX - playerX;
      const deltaY = enemyY - playerY;
      const distance = Math.hypot(deltaX, deltaY);
      if (distance < 1) continue;
      const directionX = deltaX / distance;
      const directionY = deltaY / distance;
      const edgeScale = Math.min(
        horizontalReach / Math.max(0.001, Math.abs(directionX)),
        verticalReach / Math.max(0.001, Math.abs(directionY)),
      );
      const tipX = centerX + directionX * edgeScale;
      const tipY = centerY + directionY * edgeScale;
      const baseX = tipX - directionX * 18;
      const baseY = tipY - directionY * 18;
      const perpendicularX = -directionY * 8;
      const perpendicularY = directionX * 8;
      const color = enemy?.elite || enemy?.isMidBoss ? COLORS.amber : COLORS.red;
      graphics.fillStyle(COLORS.black, 0.78);
      graphics.fillTriangle(
        tipX + directionX * 3,
        tipY + directionY * 3,
        baseX + perpendicularX * 1.3,
        baseY + perpendicularY * 1.3,
        baseX - perpendicularX * 1.3,
        baseY - perpendicularY * 1.3,
      );
      graphics.fillStyle(color, 0.72 + Math.sin(this.scene.time.now * 0.012 + rendered) * 0.16);
      graphics.fillTriangle(
        tipX,
        tipY,
        baseX + perpendicularX,
        baseY + perpendicularY,
        baseX - perpendicularX,
        baseY - perpendicularY,
      );
      if (enemy?.elite || enemy?.isMidBoss) {
        graphics.lineStyle(5, COLORS.black, 0.84);
        graphics.strokeCircle(tipX, tipY, 13);
        graphics.lineStyle(2, COLORS.amber, 0.96);
        graphics.strokeCircle(tipX, tipY, 13);
        graphics.fillStyle(COLORS.amber, 0.96);
        graphics.fillCircle(tipX, tipY, 3);
      }
      rendered += 1;
    }
  }

  private drawHudOverlay(state: any, time: number) {
    const graphics = this.hudGraphics;
    const viewportWidth = this.hudCamera.width;
    const viewportHeight = this.hudCamera.height;
    graphics.clear();
    const clearTransition = state?.expedition?.clearTransition;
    this.drawPortraitThreatIndicators(state, graphics, viewportWidth, viewportHeight);
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
      graphics.fillRect(0, 0, viewportWidth, viewportHeight);
      graphics.lineStyle(panic ? 12 : 7, COLORS.black, 0.72);
      graphics.strokeRect(8, 8, viewportWidth - 16, viewportHeight - 16);
      graphics.lineStyle(panic ? 7 : 4, color, pulse);
      graphics.strokeRect(11, 11, viewportWidth - 22, viewportHeight - 22);
      const ringRadius = 42 + progress * 78 + Math.sin(wallTime * 14) * 4;
      graphics.lineStyle(8, COLORS.black, 0.64);
      graphics.strokeCircle(viewportWidth * 0.5, viewportHeight * 0.5, ringRadius);
      graphics.lineStyle(panic ? 4 : 3, color, 0.86 - progress * 0.34);
      graphics.strokeCircle(viewportWidth * 0.5, viewportHeight * 0.5, ringRadius);
      for (let index = 0; index < 4; index += 1) {
        const angle = index * Math.PI * 0.5 + Math.PI * 0.25;
        const inner = 58 + Math.sin(wallTime * 10 + index) * 4;
        const outer = inner + (panic ? 34 : 22);
        graphics.lineStyle(panic ? 7 : 4, COLORS.black, 0.76);
        graphics.lineBetween(
          viewportWidth * 0.5 + Math.cos(angle) * inner,
          viewportHeight * 0.5 + Math.sin(angle) * inner,
          viewportWidth * 0.5 + Math.cos(angle) * outer,
          viewportHeight * 0.5 + Math.sin(angle) * outer,
        );
        graphics.lineStyle(panic ? 3 : 2, color, 0.96);
        graphics.lineBetween(
          viewportWidth * 0.5 + Math.cos(angle) * inner,
          viewportHeight * 0.5 + Math.sin(angle) * inner,
          viewportWidth * 0.5 + Math.cos(angle) * outer,
          viewportHeight * 0.5 + Math.sin(angle) * outer,
        );
      }
    }
    if (state?.surgeWarning || state?.activeSurge) {
      const pulse = 0.38 + Math.sin(time * 14) * 0.16;
      graphics.lineStyle(state?.surgeWarning ? 12 : 6, COLORS.red, pulse);
      graphics.strokeRect(5, 5, viewportWidth - 10, viewportHeight - 10);
    }
    const flash = clamp01(finite(state?.flash));
    if (flash > 0) {
      graphics.fillStyle(COLORS.white, flash * 0.12);
      graphics.fillRect(0, 0, viewportWidth, viewportHeight);
    }
    const phaseFlash = clamp01(finite(state?.boss?.phaseFlash));
    if (phaseFlash > 0) {
      graphics.fillStyle(COLORS.red, phaseFlash * 0.12);
      graphics.fillRect(0, 0, viewportWidth, viewportHeight);
      graphics.lineStyle(6, COLORS.white, phaseFlash);
      graphics.strokeRect(12, 12, viewportWidth - 24, viewportHeight - 24);
    }
  }
}

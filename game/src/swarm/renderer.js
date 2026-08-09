const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const TAU = Math.PI * 2;

const DEFAULT_QUALITY = Object.freeze({
  shadows: true,
  scanlines: true,
  detailScale: 1,
  particleScale: 1,
  maxParticles: 190,
  maxDamageTexts: 40,
});

const COLORS = Object.freeze({
  player: "#68efff",
  playerSoft: "rgba(104,239,255,.34)",
  ally: "#7fffc0",
  enemy: "#ff4e68",
  enemySoft: "rgba(255,78,104,.24)",
  elite: "#ffbd55",
  boss: "#ff3155",
  warning: "#ffcc61",
  xp: "#78f7ff",
  white: "#effcff",
});

let fallbackMapLayer = null;
let overlayLayer = null;
let surgeWarningLayer = null;
let shadowTexture = null;
const glowTextures = Object.create(null);
const tintedSprites = new WeakMap();
let activeViewport = null;
let cachedQualityInput = null;
let cachedQuality = DEFAULT_QUALITY;
let crowdRenderPressure = false;
const fullViewport = Object.freeze({ left: 0, top: 0, right: GAME_WIDTH, bottom: GAME_HEIGHT });
const viewportScratch = { left: 0, top: 0, right: GAME_WIDTH, bottom: GAME_HEIGHT };
const collectionScratch = [];
const collectionSeen = [];
const collectionPairPool = Array.from({ length: 16 }, () => ({ key: "", collection: null }));
const entitySeen = new Set();
const particleScratch = [];
const damageTextScratch = [];
const bossProxy = { id: 0, x: 0, y: 0, vx: 0, vy: 0, angle: 0, alpha: 1, hitFlash: 0 };
const bossOldProxy = { id: -1, x: 0, y: 0, vx: 0, vy: 0, angle: 0, alpha: 1, hitFlash: 0 };
const playerGhostProxy = { id: -2, x: 0, y: 0, vx: 0, vy: 0, angle: 0, alpha: 1, hitFlash: 0 };
const ENEMY_DRAW_OPTIONS = Object.freeze([
  Object.freeze({ shadowAlpha: 0.26, fallback: COLORS.enemy, role: "enemy" }),
  Object.freeze({ shadowAlpha: 0.2, fallback: COLORS.enemy, role: "enemy" }),
  Object.freeze({ shadowAlpha: 0.26, fallback: COLORS.elite, role: "enemy" }),
  Object.freeze({ shadowAlpha: 0.2, fallback: COLORS.elite, role: "enemy" }),
]);
const ENEMY_MOTION_DRAW_OPTIONS = Object.freeze([
  Object.freeze({ shadowAlpha: 0.26, fallback: COLORS.enemy, role: "enemy", motionAtlas: "enemy" }),
  Object.freeze({ shadowAlpha: 0.2, fallback: COLORS.enemy, role: "enemy", motionAtlas: "enemy" }),
  Object.freeze({ shadowAlpha: 0.26, fallback: COLORS.elite, role: "enemy", motionAtlas: "enemy" }),
  Object.freeze({ shadowAlpha: 0.2, fallback: COLORS.elite, role: "enemy", motionAtlas: "enemy" }),
]);
const ALLY_DRAW_OPTIONS = Object.freeze({ shadowAlpha: 0.31, fallback: COLORS.ally, role: "ally" });
const PLAYER_DRAW_OPTIONS = Object.freeze({ shadowAlpha: 0.48, fallback: COLORS.player, role: "player" });
const PLAYER_MOTION_DRAW_OPTIONS = Object.freeze({ shadowAlpha: 0.48, fallback: COLORS.player, role: "player", motionAtlas: "player" });
const PLAYER_GHOST_OPTIONS = Object.freeze({ shadowAlpha: 0, fallback: COLORS.player, role: "player", ghost: true });
const PLAYER_MOTION_GHOST_OPTIONS = Object.freeze({ shadowAlpha: 0, fallback: COLORS.player, role: "player", motionAtlas: "player", ghost: true });
const BOSS_DRAW_OPTIONS = Object.freeze({ shadowAlpha: 0.6, fallback: COLORS.boss, role: "boss" });
const BOSS_LAYER_OPTIONS = Object.freeze({ shadowAlpha: 0, fallback: COLORS.boss, role: "boss" });
const BOSS_MOTION_DRAW_OPTIONS = Object.freeze({ shadowAlpha: 0.6, fallback: COLORS.boss, role: "boss", motionAtlas: "boss" });
const BOSS_MOTION_LAYER_OPTIONS = Object.freeze({ shadowAlpha: 0, fallback: COLORS.boss, role: "boss", motionAtlas: "boss" });
const PLAYER_ATLAS = Object.freeze({ columns: 3, rows: 3 });
const BOSS_ATLAS = Object.freeze({ columns: 3, rows: 2 });
// Optional authored motion sheet: 5 frames across, with locomotion, attack,
// and hit/recovery rows. Static sprites keep the same procedural fallback.
const PLAYER_MOTION_ATLAS = Object.freeze({ columns: 5, rows: 3 });
const ENEMY_MOTION_ATLAS = Object.freeze({ columns: 5, rows: 3 });
const BOSS_MOTION_ATLAS = Object.freeze({ columns: 5, rows: 3 });
const inferredTelegraphScratch = { type: "charge", x: 0, y: 0, targetX: 0, targetY: 0, angle: 0, radius: 0, width: 0, progress: 0 };
const motionScratch = { motion: 0, hit: 0, stun: 0, death: 0, anticipation: 0, attack: 0, recovery: 0, dash: 0, row: 0, column: 0, lean: 0, recoil: 0 };

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, finite(value, min)));
}

function clamp01(value) {
  return clamp(value, 0, 1);
}

function timeOf(state) {
  return finite(state?.time, finite(state?.elapsed, finite(state?.runTime, 0)));
}

function createLayer(width, height) {
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  return null;
}

function imageReady(image) {
  if (!image) return false;
  if (typeof image.complete === "boolean" && !image.complete) return false;
  if ("naturalWidth" in image && image.naturalWidth === 0) return false;
  return true;
}

function drawAtlasSprite(ctx, image, atlas, column, row, x, y, width, height, angle = 0, alpha = 1) {
  if (!imageReady(image)) return false;
  const sourceWidth = finite(image.naturalWidth, finite(image.width));
  const sourceHeight = finite(image.naturalHeight, finite(image.height));
  if (sourceWidth <= 0 || sourceHeight <= 0) return false;
  const cellWidth = sourceWidth / atlas.columns;
  const cellHeight = sourceHeight / atlas.rows;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = clamp01(alpha);
  ctx.drawImage(
    image,
    column * cellWidth,
    row * cellHeight,
    cellWidth,
    cellHeight,
    -width * 0.5,
    -height * 0.5,
    width,
    height,
  );
  ctx.restore();
  return true;
}

function playerAtlasCell(type) {
  if (type.includes("rocket") || type.includes("missile")) return 3;
  if (type.includes("orbit")) return 4;
  if (type.includes("chain") || type.includes("arc")) return 5;
  if (type.includes("nova")) return 6;
  if (type.includes("airstrike") || type.includes("skyfall")) return 7;
  if (type.includes("omega") || type.includes("laser")) return 8;
  if (type.includes("rail") || type.includes("heavy")) return 2;
  if (type.includes("scatter") || type.includes("rook")) return 1;
  return 0;
}

function bossAtlasCell(type) {
  if (type.includes("multicharge")) return 5;
  if (type.includes("charge") || type.includes("rush")) return 4;
  if (type.includes("ring")) return 3;
  if (type.includes("bomb")) return 2;
  if (type.includes("sweep") || type.includes("laser")) return 1;
  return 0;
}

function arraysFrom(source, keys) {
  collectionScratch.length = 0;
  collectionSeen.length = 0;
  for (const key of keys) {
    const collection = source?.[key];
    if (!Array.isArray(collection) || collectionSeen.includes(collection)) continue;
    collectionSeen.push(collection);
    const pair = collectionPairPool[collectionScratch.length];
    pair.key = key;
    pair.collection = collection;
    collectionScratch.push(pair);
  }
  return collectionScratch;
}

function isAlive(entity) {
  return Boolean(entity) && !entity.dead && entity.active !== false && finite(entity.hp, 1) > 0;
}

function visible(entity, padding = 100) {
  const x = finite(entity?.x, -10000);
  const y = finite(entity?.y, -10000);
  const radius = finite(entity?.radius, finite(entity?.size, 30) * 0.5);
  const view = activeViewport || fullViewport;
  return x + radius >= view.left - padding && x - radius <= view.right + padding
    && y + radius >= view.top - padding && y - radius <= view.bottom + padding;
}

function entitySeed(entity, fallback = 0) {
  if (Number.isFinite(entity?.seed)) return entity.seed;
  if (Number.isFinite(entity?.id)) return entity.id;
  const text = String(entity?.id ?? entity?.type ?? fallback);
  let value = fallback | 0;
  for (let index = 0; index < text.length; index += 1) value = (value * 31 + text.charCodeAt(index)) | 0;
  return value;
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, Math.abs(width) * 0.5, Math.abs(height) * 0.5));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function buildFallbackMap() {
  if (fallbackMapLayer) return fallbackMapLayer;
  fallbackMapLayer = createLayer(GAME_WIDTH, GAME_HEIGHT);
  const ctx = fallbackMapLayer?.getContext("2d", { alpha: false });
  if (!ctx) return null;

  ctx.fillStyle = "#03080d";
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  const floor = ctx.createRadialGradient(640, 350, 60, 640, 350, 730);
  floor.addColorStop(0, "#10242a");
  floor.addColorStop(0.5, "#071319");
  floor.addColorStop(1, "#020509");
  ctx.fillStyle = floor;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.strokeStyle = "rgba(100,228,245,.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= GAME_WIDTH; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, GAME_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= GAME_HEIGHT; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(GAME_WIDTH, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(101,232,249,.15)";
  ctx.lineWidth = 7;
  ctx.setLineDash([31, 18]);
  ctx.beginPath();
  ctx.ellipse(640, 360, 555, 292, 0, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "rgba(5,15,19,.78)";
  ctx.fillRect(82, 80, 258, 72);
  ctx.fillRect(940, 568, 258, 72);
  ctx.fillStyle = "rgba(183,235,242,.24)";
  ctx.font = "600 12px monospace";
  ctx.fillText("CONTAINMENT FLOOR // 07", 104, 110);
  ctx.fillText("NO STATIC OBSTRUCTIONS", 104, 131);
  ctx.fillText("SWARM INGRESS", 1028, 600);
  ctx.fillText("PATHING: ELLIPTIC", 1030, 620);
  return fallbackMapLayer;
}

function buildOverlay() {
  if (overlayLayer) return overlayLayer;
  overlayLayer = createLayer(GAME_WIDTH, GAME_HEIGHT);
  const ctx = overlayLayer?.getContext("2d");
  if (!ctx) return null;
  const vignette = ctx.createRadialGradient(640, 350, 190, 640, 350, 760);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(0.68, "rgba(0,0,0,.025)");
  vignette.addColorStop(1, "rgba(0,0,0,.48)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ctx.fillStyle = "rgba(130,238,248,.026)";
  for (let y = 0; y < GAME_HEIGHT; y += 4) ctx.fillRect(0, y, GAME_WIDTH, 1);
  return overlayLayer;
}

function buildSurgeWarningLayer() {
  if (surgeWarningLayer) return surgeWarningLayer;
  surgeWarningLayer = createLayer(GAME_WIDTH, 120);
  const ctx = surgeWarningLayer?.getContext("2d");
  if (!ctx) return null;
  const gradient = ctx.createLinearGradient(0, 0, 0, 110);
  gradient.addColorStop(0, "rgba(255,25,55,.24)");
  gradient.addColorStop(1, "rgba(255,25,55,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GAME_WIDTH, 120);
  return surgeWarningLayer;
}

function getShadowTexture() {
  if (shadowTexture) return shadowTexture;
  shadowTexture = createLayer(144, 72);
  const ctx = shadowTexture?.getContext("2d");
  if (!ctx) return null;
  const gradient = ctx.createRadialGradient(72, 38, 2, 72, 38, 62);
  gradient.addColorStop(0, "rgba(0,0,0,.75)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 144, 72);
  return shadowTexture;
}

function getGlowTexture(kind = "cyan") {
  if (glowTextures[kind]) return glowTextures[kind];
  const palette = {
    cyan: [88, 232, 255],
    red: [255, 48, 82],
    amber: [255, 190, 73],
    green: [93, 255, 177],
    violet: [190, 113, 255],
    white: [235, 255, 255],
  };
  const [red, green, blue] = palette[kind] || palette.white;
  const layer = createLayer(128, 128);
  const ctx = layer?.getContext("2d");
  if (!ctx) return null;
  const gradient = ctx.createRadialGradient(64, 64, 2, 64, 64, 61);
  gradient.addColorStop(0, `rgba(${red},${green},${blue},.62)`);
  gradient.addColorStop(0.28, `rgba(${red},${green},${blue},.2)`);
  gradient.addColorStop(1, `rgba(${red},${green},${blue},0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  glowTextures[kind] = layer;
  return layer;
}

function getTintedSprite(image, tint = "white") {
  if (!imageReady(image) || (typeof image !== "object" && typeof image !== "function")) return null;
  let variants = tintedSprites.get(image);
  if (!variants) {
    variants = Object.create(null);
    tintedSprites.set(image, variants);
  }
  if (variants[tint]) return variants[tint];
  const sourceWidth = Math.max(1, finite(image.naturalWidth, finite(image.width, 128)));
  const sourceHeight = Math.max(1, finite(image.naturalHeight, finite(image.height, 128)));
  const scale = Math.min(1, 512 / sourceWidth, 512 / sourceHeight);
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const layer = createLayer(width, height);
  const ctx = layer?.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0, width, height);
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = tint === "red" ? "rgba(255,70,80,.92)" : "rgba(244,255,255,.94)";
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "source-over";
  variants[tint] = layer;
  return layer;
}

function drawGlow(ctx, kind, x, y, size, alpha = 1) {
  const texture = getGlowTexture(kind);
  if (!texture || alpha <= 0) return;
  ctx.globalAlpha = clamp01(alpha);
  ctx.drawImage(texture, x - size * 0.5, y - size * 0.5, size, size);
  ctx.globalAlpha = 1;
}

function drawShadow(ctx, x, y, size, alpha, quality) {
  if (!quality.shadows || alpha <= 0) return;
  const texture = getShadowTexture();
  if (!texture) return;
  ctx.globalAlpha = clamp01(alpha);
  ctx.drawImage(texture, x - size * 0.55, y - size * 0.08, size * 1.1, size * 0.55);
  ctx.globalAlpha = 1;
}

function spriteAngle(entity, fallback = 0) {
  if (Number.isFinite(entity?.angle)) return entity.angle;
  if (Number.isFinite(entity?.rotation)) return entity.rotation;
  const vx = finite(entity?.vx);
  const vy = finite(entity?.vy);
  return Math.abs(vx) + Math.abs(vy) > 0.01 ? Math.atan2(vy, vx) : fallback;
}

function drawFallbackActor(ctx, size, color, alpha, death = 0) {
  ctx.globalAlpha = alpha * (1 - death);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(size * 0.46, 0);
  ctx.lineTo(-size * 0.35, size * 0.32);
  ctx.lineTo(-size * 0.24, 0);
  ctx.lineTo(-size * 0.35, -size * 0.32);
  ctx.closePath();
  ctx.fill();
}

function actorDeathProgress(entity) {
  if (Number.isFinite(entity?.deathProgress)) return clamp01(entity.deathProgress);
  if (Number.isFinite(entity?.deathTimer) && (entity?.dead || Number.isFinite(entity?.deathDuration))) {
    const bossLike = entity?.boss || entity?.finalBoss || finite(entity?.radius) >= 55 || String(entity?.name).toLowerCase().includes("engine");
    const duration = finite(entity?.deathDuration, bossLike ? 1.25 : entity?.elite ? 0.46 : 0.32);
    return clamp01(1 - entity.deathTimer / Math.max(0.001, duration));
  }
  if (Number.isFinite(entity?.deathLife) && Number.isFinite(entity?.deathMaxLife)) {
    return clamp01(1 - entity.deathLife / Math.max(0.001, entity.deathMaxLife));
  }
  return entity?.dead ? 1 : 0;
}

function resolveActorMotion(entity, state, role, time, seed, motionSpeed) {
  const motion = motionScratch;
  const vx = finite(entity?.vx);
  const vy = finite(entity?.vy);
  const speed = Math.hypot(vx, vy);
  const facing = spriteAngle(entity);
  const velocityAngle = speed > 0.01 ? Math.atan2(vy, vx) : facing;
  motion.motion = clamp01(speed / Math.max(1, motionSpeed));
  motion.hit = clamp01(Math.max(
    finite(entity?.hitFlash) * 7,
    finite(entity?.flash) * 5,
    finite(entity?.hitStun) / 0.1,
    String(entity?.animationState).toLowerCase() === "hit" ? 0.72 : 0,
  ));
  motion.stun = clamp01(Math.max(
    finite(entity?.stunProgress),
    finite(entity?.stunTimer) / Math.max(0.18, finite(entity?.stunDuration, 0.7)),
    entity?.stunned ? 1 : 0,
  ));
  motion.death = actorDeathProgress(entity);
  motion.anticipation = 0;
  motion.attack = 0;
  motion.recovery = 0;
  motion.dash = clamp01(finite(entity?.dashTimer) / Math.max(0.001, finite(entity?.dashDuration, 0.16)));
  motion.row = 0;
  motion.column = Math.floor(time * (4.5 + motion.motion * 5) + seed) % PLAYER_MOTION_ATLAS.columns;

  if (motion.dash > 0) {
    motion.row = 2;
    motion.column = clamp(Math.floor((1 - motion.dash) * 3), 0, 2);
  } else if (motion.stun > 0 || motion.hit > 0) {
    motion.row = 2;
    motion.column = 3 + (Math.floor(time * 15 + seed) & 1);
  } else if (role === "boss" && entity?.activePattern) {
    const pattern = entity.activePattern;
    if (pattern.phase === "warning") motion.anticipation = telegraphProgress(pattern);
    else motion.attack = clamp01(1 - finite(pattern.life) / Math.max(0.001, finite(pattern.maxLife, 1)));
  } else {
    let cooldown = NaN;
    let cycle = 0.9;
    const explicitAttack = finite(entity?.attackTimer);
    if (explicitAttack > 0 || (entity?.attackState && entity.attackState !== "idle")) {
      const heavy = String(entity?.attackState).toLowerCase().includes("rail") || String(entity?.attackState).toLowerCase().includes("rocket");
      const duration = heavy ? 0.2 : role === "enemy" ? 0.24 : 0.1;
      const explicitProgress = clamp01(1 - explicitAttack / duration);
      if (explicitProgress < 0.34) motion.attack = 1 - explicitProgress * 0.45;
      else motion.recovery = 1 - (explicitProgress - 0.34) / 0.66;
      motion.row = 1;
      motion.column = explicitProgress < 0.3 ? 2 : explicitProgress < 0.64 ? 3 : 4;
    }
    if (role === "player" && entity?.fireTimers) {
      cooldown = finite(entity.fireTimers.pulse);
      const pulseRank = Math.max(1, finite(state?.build?.weapons?.pulse, 1));
      cycle = Math.max(0.028, 0.145 * Math.max(0.16, finite(entity.fireRateMultiplier, 1) * finite(entity.overdriveHaste, 1)) / (1 + (pulseRank - 1) * 0.08));
    } else if (role === "enemy") {
      const ranged = String(entity?.type ?? entity?.kind ?? "").toLowerCase().includes("suppress");
      cooldown = ranged ? finite(entity?.shootCooldown) : finite(entity?.attackCooldown);
      cycle = ranged ? (entity?.elite ? 1.05 : 1.65) : (entity?.elite ? 0.62 : 0.9);
    } else if (Number.isFinite(entity?.fireCooldown)) {
      cooldown = entity.fireCooldown;
      cycle = 0.84;
    }
    if (Number.isFinite(cooldown) && explicitAttack <= 0) {
      const cycleProgress = clamp01(1 - Math.max(0, cooldown) / Math.max(0.025, cycle));
      if (cycleProgress < 0.13) {
        motion.attack = 1 - cycleProgress / 0.13;
        motion.row = 1;
        motion.column = 2;
      } else if (cycleProgress < 0.42) {
        motion.recovery = 1 - (cycleProgress - 0.13) / 0.29;
        motion.row = 1;
        motion.column = cycleProgress < 0.25 ? 3 : 4;
      } else if (cycleProgress > 0.76) {
        motion.anticipation = clamp01((cycleProgress - 0.76) / 0.24);
        motion.row = 1;
        motion.column = cycleProgress > 0.91 ? 1 : 0;
      }
    }
  }

  if (role === "boss" && finite(entity?.weakness) > 0) motion.recovery = clamp01(finite(entity.weakness) / 3);
  motion.lean = Math.sin(velocityAngle - facing) * motion.motion * 0.095;
  motion.recoil = clamp(finite(entity?.recoil, finite(entity?.recoilTime) * 7), 0, 9) + motion.attack * (role === "boss" ? 5 : 3.5);
  return motion;
}

function drawSpriteFrame(ctx, image, size, motion, atlasKind, alpha, death, seed, simpleDeath = false) {
  const sourceWidth = finite(image.naturalWidth, finite(image.width));
  const sourceHeight = finite(image.naturalHeight, finite(image.height));
  if (sourceWidth <= 0 || sourceHeight <= 0) return;
  const atlas = atlasKind === "enemy" ? ENEMY_MOTION_ATLAS : atlasKind === "boss" ? BOSS_MOTION_ATLAS : PLAYER_MOTION_ATLAS;
  const atlasEnabled = Boolean(atlasKind);
  const cellWidth = atlasEnabled ? sourceWidth / atlas.columns : sourceWidth;
  const cellHeight = atlasEnabled ? sourceHeight / atlas.rows : sourceHeight;
  const sourceX = atlasEnabled ? motion.column * cellWidth : 0;
  const sourceY = atlasEnabled ? motion.row * cellHeight : 0;

  if (death <= 0 || simpleDeath) {
    ctx.globalAlpha = alpha * (1 - death);
    ctx.drawImage(image, sourceX, sourceY, cellWidth, cellHeight, -size * 0.5, -size * 0.5, size, size);
    return;
  }

  // Canvas-safe dissolve: split the authored frame into drifting strips, then
  // add deterministic fragments. It works for both static sprites and atlases.
  const slices = 6;
  const sourceSlice = cellHeight / slices;
  const destinationSlice = size / slices + 0.5;
  const eased = death * death;
  for (let slice = 0; slice < slices; slice += 1) {
    const direction = ((slice + seed) & 1) ? 1 : -1;
    ctx.globalAlpha = alpha * (1 - death) * (0.72 + slice * 0.045);
    ctx.drawImage(
      image,
      sourceX,
      sourceY + sourceSlice * slice,
      cellWidth,
      sourceSlice,
      -size * 0.5 + direction * eased * size * (0.04 + slice * 0.012),
      -size * 0.5 + destinationSlice * slice - eased * size * 0.08,
      size,
      destinationSlice,
    );
  }
  ctx.globalAlpha = alpha * (1 - death);
  ctx.fillStyle = "rgba(210,251,255,.82)";
  for (let part = 0; part < 4; part += 1) {
    const partAngle = seed * 0.73 + part * 1.71;
    const distance = eased * size * (0.38 + part * 0.09);
    ctx.fillRect(Math.cos(partAngle) * distance - 2, Math.sin(partAngle) * distance - 2, 4 + part, 3 + part * 0.5);
  }
}

function drawActorSprite(ctx, image, entity, size, state, quality, options = {}) {
  if (!visible(entity, size)) return;
  const time = timeOf(state);
  const seed = entitySeed(entity, options.seed || 0);
  const speed = Math.hypot(finite(entity.vx), finite(entity.vy));
  const motion = resolveActorMotion(entity, state, options.role || "enemy", time, seed, finite(options.motionSpeed, 190));
  if (options.motionAtlas === "enemy") {
    const enemyType = String(entity?.type ?? entity?.kind ?? "hunter").toLowerCase();
    motion.row = enemyType.includes("brute") || enemyType.includes("tank") || enemyType.includes("charger") ? 2
      : enemyType.includes("suppress") || enemyType.includes("shoot") || enemyType.includes("sniper") ? 1 : 0;
    motion.column = motion.hit > 0 || motion.stun > 0 ? 4
      : motion.attack > 0 || motion.recovery > 0.58 ? 3
        : motion.anticipation > 0 ? 2
          : Math.floor(time * (4.5 + motion.motion * 4) + seed) & 1;
  } else if (options.motionAtlas === "boss") {
    motion.row = clamp(Math.floor(finite(entity?.stage, finite(entity?.phase, 1))) - 1, 0, 2);
    // Pattern readability wins over the continuously refreshed hit flash. The
    // white additive tint still communicates damage while the authored windup
    // and release frames remain visible under late-game automatic fire.
    motion.column = finite(entity?.transformTimer) > 0 || finite(entity?.weakness) > 0 || entity?.coreExposed ? 2
      : motion.anticipation > 0 ? 1
        : motion.attack > 0 || motion.recovery > 0.58 ? 3
          : motion.hit > 0 || motion.stun > 0 ? 4 : 0;
  }
  const bob = Math.sin(time * (motion.motion > 0.1 ? 10.5 : 3.2) + seed * 0.73) * (0.45 + motion.motion * 1.35);
  const baseAngle = spriteAngle(entity, finite(options.angle));
  const angle = baseAngle + motion.lean + Math.sin(time * 49 + seed) * (motion.hit * 0.045 + motion.stun * 0.075);
  const x = finite(entity.x) - Math.cos(baseAngle) * motion.recoil + Math.sin(time * 58 + seed) * motion.stun * 2.2;
  const y = finite(entity.y) - Math.sin(baseAngle) * motion.recoil + bob + Math.cos(time * 51 + seed) * motion.stun * 1.5;
  const alpha = clamp01(options.alpha ?? entity.alpha ?? 1) * (options.ghost ? 0.9 : 1);
  const breathe = Math.sin(time * 3.5 + seed) * (1 - motion.motion) * 0.014;
  const stretch = motion.motion * 0.035 + motion.attack * 0.12 - motion.anticipation * 0.06 - motion.hit * 0.1;
  const squash = -motion.motion * 0.02 - motion.attack * 0.08 + motion.anticipation * 0.1 + motion.hit * 0.13;
  const simpleDeath = options.role === "enemy" && crowdRenderPressure && motion.death > 0;
  const scaleX = (1 + breathe + stretch) * (simpleDeath ? 1 - motion.death * 0.22 : 1);
  const scaleY = (1 - breathe + squash) * (simpleDeath ? 1 - motion.death * 0.1 : 1);
  const fallbackColor = options.fallback || COLORS.enemy;

  if (motion.death < 0.94) drawShadow(ctx, finite(entity.x), finite(entity.y), size * (1 - motion.death * 0.35), (options.shadowAlpha ?? 0.35) * alpha * (1 - motion.death), quality);

  const flash = finite(entity.hitFlash, finite(entity.flash));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scaleX, scaleY);
  if (options.flipY) ctx.scale(1, -1);
  if (!imageReady(image)) drawFallbackActor(ctx, size, fallbackColor, alpha, motion.death);
  else drawSpriteFrame(ctx, image, size, motion, options.motionAtlas, alpha, motion.death, seed, simpleDeath);
  if (imageReady(image) && flash > 0 && motion.death <= 0) {
    const tint = getTintedSprite(image, flash > 0.09 ? "white" : "red");
    if (tint) {
      ctx.globalAlpha = alpha * clamp(0.12 + flash * 2.2, 0.12, 0.4);
      drawSpriteFrame(ctx, tint, size, motion, options.motionAtlas, ctx.globalAlpha, 0, seed);
    }
  }
  ctx.restore();

  if (motion.stun > 0) {
    ctx.globalAlpha = 0.45 + motion.stun * 0.45;
    ctx.strokeStyle = COLORS.warning;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.ellipse(finite(entity.x), finite(entity.y) - size * 0.58, size * 0.28, size * 0.09, time * 2.8, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
}

function ratioOf(entity, valueKey = "hp", maxKey = "maxHp") {
  const value = finite(entity?.[valueKey], 1);
  const maxValue = Math.max(1, finite(entity?.[maxKey], value));
  return clamp01(value / maxValue);
}

function drawHealthBar(ctx, entity, width, offset, color, force = false) {
  if (!entity || (!force && finite(entity.hp, 1) >= finite(entity.maxHp, 1))) return;
  const ratio = ratioOf(entity);
  const x = finite(entity.x) - width * 0.5;
  const y = finite(entity.y) - offset;
  ctx.fillStyle = "rgba(2,5,8,.9)";
  roundedRect(ctx, x - 2, y - 2, width + 4, 8, 4);
  ctx.fill();
  if (ratio > 0) {
    ctx.fillStyle = ratio < 0.28 ? COLORS.enemy : color;
    roundedRect(ctx, x, y, width * ratio, 4, 2);
    ctx.fill();
  }
}

function drawMap(ctx, assets) {
  const view = activeViewport || fullViewport;
  const padding = 12;
  const left = clamp(view.left - padding, 0, GAME_WIDTH);
  const top = clamp(view.top - padding, 0, GAME_HEIGHT);
  const right = clamp(view.right + padding, 0, GAME_WIDTH);
  const bottom = clamp(view.bottom + padding, 0, GAME_HEIGHT);
  const width = Math.max(1, right - left);
  const height = Math.max(1, bottom - top);
  ctx.fillStyle = "#020508";
  ctx.fillRect(left, top, width, height);
  if (imageReady(assets?.map)) {
    // The bitmap and simulation share the exact 1280x720 arena coordinate space.
    const sourceWidth = finite(assets.map.naturalWidth, finite(assets.map.width, GAME_WIDTH));
    const sourceHeight = finite(assets.map.naturalHeight, finite(assets.map.height, GAME_HEIGHT));
    ctx.drawImage(
      assets.map,
      left / GAME_WIDTH * sourceWidth,
      top / GAME_HEIGHT * sourceHeight,
      width / GAME_WIDTH * sourceWidth,
      height / GAME_HEIGHT * sourceHeight,
      left,
      top,
      width,
      height,
    );
    return;
  }
  const fallback = buildFallbackMap();
  if (fallback) ctx.drawImage(fallback, left, top, width, height, left, top, width, height);
}

function drawArenaBoundary(ctx) {
  // Matches the engine clamp and the dedicated map's visible containment ring.
  ctx.strokeStyle = "rgba(117,236,249,.13)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([20, 14]);
  ctx.beginPath();
  ctx.ellipse(640, 360, 555, 292, 0, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
}

function telegraphProgress(item) {
  if (Number.isFinite(item?.progress)) return clamp01(item.progress);
  if (Number.isFinite(item?.elapsed) && Number.isFinite(item?.duration)) return clamp01(item.elapsed / Math.max(0.001, item.duration));
  if (Number.isFinite(item?.life) && Number.isFinite(item?.maxLife)) return clamp01(1 - item.life / Math.max(0.001, item.maxLife));
  if (Number.isFinite(item?.timer) && Number.isFinite(item?.maxTimer)) return clamp01(1 - item.timer / Math.max(0.001, item.maxTimer));
  if (Number.isFinite(item?.timeLeft) && Number.isFinite(item?.duration)) return clamp01(1 - item.timeLeft / Math.max(0.001, item.duration));
  return 0.5;
}

function telegraphAlpha(item) {
  return clamp01(item?.alpha ?? Math.max(0.18, 0.35 + telegraphProgress(item) * 0.45));
}

function drawCircleTelegraph(ctx, item, time, kind, overrideX = NaN, overrideY = NaN, overrideRadius = NaN) {
  const x = finite(overrideX, finite(item.x, finite(item.targetX, GAME_WIDTH * 0.5)));
  const y = finite(overrideY, finite(item.y, finite(item.targetY, GAME_HEIGHT * 0.5)));
  const radius = Math.max(12, finite(overrideRadius, finite(item.radius, kind === "bomb" ? 76 : 118)));
  const progress = telegraphProgress(item);
  const pulse = 1 + Math.sin(time * 11 + x * 0.02) * 0.025;
  const friendly = kind === "friendly" || item?.friendly === true || item?.team === "player";
  ctx.globalAlpha = telegraphAlpha(item);
  ctx.fillStyle = friendly ? "rgba(82,229,255,.1)" : kind === "bomb" ? "rgba(255,71,89,.11)" : "rgba(255,66,94,.09)";
  ctx.beginPath();
  ctx.arc(x, y, radius * pulse, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = friendly ? "#72ecff" : kind === "bomb" ? COLORS.warning : COLORS.enemy;
  ctx.lineWidth = 2.5;
  ctx.setLineDash(kind === "bomb" ? [9, 7] : [18, 9]);
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(x, y, radius - 7, -Math.PI / 2, -Math.PI / 2 + TAU * progress);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 10, y);
  ctx.lineTo(x + 10, y);
  ctx.moveTo(x, y - 10);
  ctx.lineTo(x, y + 10);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawSweepTelegraph(ctx, item, time, overrideAngle = NaN) {
  const geometry = item?.geometry;
  const x = finite(geometry?.originX, finite(item.x, finite(item.originX, GAME_WIDTH * 0.5)));
  const y = finite(geometry?.originY, finite(item.y, finite(item.originY, GAME_HEIGHT * 0.5)));
  const angle = finite(overrideAngle, finite(geometry?.angle, finite(item.angle, finite(item.rotation))));
  const length = Math.max(120, finite(geometry?.radius, finite(item.length, finite(item.radius, 920))));
  // The engine publishes the exact player-center collision band. Drawing that
  // value makes every lit pixel in the capsule a genuinely dangerous region.
  const halfWidth = Math.max(8, finite(geometry?.collisionHalfWidth, finite(item.width, 36)));
  const visualWidth = halfWidth * 2;
  const progress = telegraphProgress(item);
  if (item.phase === "warning" && Number.isFinite(item.startAngle) && Number.isFinite(item.endAngle) && !Number.isFinite(overrideAngle)) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = telegraphAlpha(item) * 0.24;
    ctx.fillStyle = "rgba(255,52,82,.16)";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, length, item.startAngle, item.endAngle);
    ctx.closePath();
    ctx.fill();
    if (item.dual) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, length, item.startAngle + Math.PI, item.endAngle + Math.PI);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = telegraphAlpha(item) * 0.72;
    ctx.strokeStyle = COLORS.warning;
    ctx.lineWidth = 2;
    ctx.setLineDash([13, 12]);
    ctx.beginPath();
    ctx.arc(0, 0, length, item.startAngle, item.endAngle);
    ctx.moveTo(Math.cos(item.endAngle) * halfWidth, Math.sin(item.endAngle) * halfWidth);
    ctx.lineTo(Math.cos(item.endAngle) * length, Math.sin(item.endAngle) * length);
    if (item.dual) {
      ctx.moveTo(Math.cos(item.endAngle + Math.PI) * halfWidth, Math.sin(item.endAngle + Math.PI) * halfWidth);
      ctx.lineTo(Math.cos(item.endAngle + Math.PI) * length, Math.sin(item.endAngle + Math.PI) * length);
      ctx.arc(0, 0, length, item.startAngle + Math.PI, item.endAngle + Math.PI);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = telegraphAlpha(item);
  ctx.strokeStyle = "rgba(255,48,78,.12)";
  ctx.lineWidth = visualWidth;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(length, 0);
  ctx.stroke();
  ctx.strokeStyle = Math.sin(time * 14) > 0 ? COLORS.warning : COLORS.enemy;
  ctx.lineWidth = 2;
  ctx.setLineDash([17, 11]);
  ctx.beginPath();
  ctx.moveTo(0, -halfWidth);
  ctx.lineTo(length, -halfWidth);
  ctx.arc(length, 0, halfWidth, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.lineTo(0, halfWidth);
  ctx.arc(0, 0, halfWidth, Math.PI * 0.5, Math.PI * 1.5);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255,205,96,.48)";
  ctx.fillRect(0, -2, length * progress, 4);
  ctx.restore();
}

function drawRingTelegraph(ctx, item, time) {
  const geometry = item?.geometry;
  const x = finite(geometry?.centerX, finite(item.x, finite(item.targetX, GAME_WIDTH * 0.5)));
  const y = finite(geometry?.centerY, finite(item.y, finite(item.targetY, GAME_HEIGHT * 0.5)));
  const outer = Math.max(24, finite(item.radius, finite(item.outerRadius, 230)));
  const halfWidth = Math.max(4, finite(geometry?.collisionHalfWidth, finite(item.thickness, finite(item.width, 18))));
  const ringCount = clamp(Math.floor(finite(geometry?.ringCount, finite(item.rings, 1))), 1, 10);
  const spacing = Math.max(24, finite(geometry?.spacing, finite(item.spacing, 150)));
  const progress = telegraphProgress(item);
  const active = item.phase === "active" || Number.isFinite(item.startRadius);
  const current = active ? outer : outer;
  if (!active && geometry) {
    const maxTravel = Math.max(0, finite(geometry.maxTravel, 830));
    ctx.globalAlpha = telegraphAlpha(item) * 0.34;
    ctx.strokeStyle = "rgba(255,204,97,.72)";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 14]);
    for (let ring = 0; ring < ringCount; ring += 1) {
      const futureRadius = finite(geometry.startRadius, outer) + maxTravel - ring * spacing;
      if (futureRadius <= halfWidth) continue;
      ctx.beginPath();
      ctx.arc(x, y, futureRadius, 0, TAU);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = telegraphAlpha(item) * (0.45 + progress * 0.25);
    ctx.fillStyle = COLORS.warning;
    for (let arrow = 0; arrow < 4; arrow += 1) {
      const arrowAngle = arrow * Math.PI * 0.5 + time * 0.12;
      const arrowRadius = outer + progress * Math.min(180, maxTravel * 0.3);
      const ax = x + Math.cos(arrowAngle) * arrowRadius;
      const ay = y + Math.sin(arrowAngle) * arrowRadius;
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(arrowAngle);
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-5, -5);
      ctx.lineTo(-5, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.globalAlpha = telegraphAlpha(item);
  ctx.strokeStyle = active ? "rgba(255,67,92,.33)" : "rgba(255,204,97,.24)";
  ctx.lineWidth = halfWidth * 2;
  for (let ring = 0; ring < ringCount; ring += 1) {
    const ringRadius = active && Array.isArray(geometry?.radii) ? finite(geometry.radii[ring], current - ring * spacing) : current - ring * spacing;
    if (ringRadius <= halfWidth) continue;
    ctx.beginPath();
    ctx.arc(x, y, ringRadius, 0, TAU);
    ctx.stroke();
  }
  ctx.strokeStyle = COLORS.enemy;
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 9]);
  for (let ring = 0; ring < ringCount; ring += 1) {
    const ringRadius = active && Array.isArray(geometry?.radii) ? finite(geometry.radii[ring], current - ring * spacing) : current - ring * spacing;
    if (ringRadius <= halfWidth) continue;
    ctx.beginPath();
    ctx.arc(x, y, ringRadius + Math.sin(time * 8 + ring) * 2, 0, TAU);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

function drawChargeTelegraph(ctx, item, time, bossCollisionRadius = 0) {
  const geometry = item?.geometry;
  const x = finite(geometry?.startX, finite(item.x, finite(item.originX, GAME_WIDTH * 0.5)));
  const y = finite(geometry?.startY, finite(item.y, finite(item.originY, GAME_HEIGHT * 0.5)));
  const targetX = finite(geometry?.endX, finite(item.targetX, x + Math.cos(finite(item.angle)) * 700));
  const targetY = finite(geometry?.endY, finite(item.targetY, y + Math.sin(finite(item.angle)) * 700));
  const angle = Math.atan2(targetY - y, targetX - x);
  const length = Math.hypot(targetX - x, targetY - y);
  // Charge collision is swept with the boss radius. Prefer an explicit radius
  // when supplied and otherwise use the live boss radius from drawTelegraphs.
  const halfWidth = Math.max(22, finite(geometry?.collisionRadius, finite(item.collisionRadius, finite(item.bossRadius, bossCollisionRadius))), finite(item.width, 46));
  const visualWidth = halfWidth * 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = telegraphAlpha(item);
  ctx.strokeStyle = "rgba(255,52,82,.13)";
  ctx.lineWidth = visualWidth;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(length, 0);
  ctx.stroke();
  ctx.strokeStyle = Math.sin(time * 16) > 0 ? COLORS.warning : COLORS.enemy;
  ctx.lineWidth = 3.5;
  ctx.setLineDash([22, 10]);
  ctx.beginPath();
  ctx.moveTo(0, -halfWidth);
  ctx.lineTo(length, -halfWidth);
  ctx.arc(length, 0, halfWidth, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.lineTo(0, halfWidth);
  ctx.arc(0, 0, halfWidth, Math.PI * 0.5, Math.PI * 1.5);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = Math.min(1, telegraphAlpha(item) + 0.18);
  ctx.strokeStyle = "rgba(255,232,171,.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -halfWidth);
  ctx.lineTo(length, -halfWidth);
  ctx.moveTo(0, halfWidth);
  ctx.lineTo(length, halfWidth);
  ctx.stroke();
  ctx.globalAlpha = telegraphAlpha(item);
  ctx.strokeStyle = COLORS.warning;
  ctx.lineWidth = 2;
  const markerOffset = (time * 150) % 54;
  for (let marker = markerOffset; marker < length; marker += 54) {
    ctx.beginPath();
    ctx.moveTo(marker - 13, -10);
    ctx.lineTo(marker, 0);
    ctx.lineTo(marker - 13, 10);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(length - 25, -14);
  ctx.lineTo(length, 0);
  ctx.lineTo(length - 25, 14);
  ctx.stroke();
  ctx.restore();
}

function drawTelegraphSprite(ctx, item, type, time, assets, overrideX = NaN, overrideY = NaN, overrideAngle = NaN) {
  const progress = telegraphProgress(item);
  const alpha = 0.42 + progress * 0.48;
  const x = finite(overrideX, finite(item.x, finite(item.targetX, GAME_WIDTH * 0.5)));
  const y = finite(overrideY, finite(item.y, finite(item.targetY, GAME_HEIGHT * 0.5)));
  if (type.includes("airstrike") || type.includes("skyfall")) {
    const missileY = y - (1 - progress) * 92;
    drawGlow(ctx, "amber", x, missileY, 74, 0.28 + progress * 0.2);
    drawAtlasSprite(ctx, assets?.playerOrdnance, PLAYER_ATLAS, 1, 2, x, missileY, 62, 62, Math.PI, alpha);
    return;
  }
  if (!imageReady(assets?.bossPatterns)) return;
  const atlasCell = bossAtlasCell(type);
  const column = atlasCell % BOSS_ATLAS.columns;
  const row = Math.floor(atlasCell / BOSS_ATLAS.columns);
  const angle = finite(overrideAngle, finite(item.angle, finite(item.rotation)));
  const elongated = type.includes("sweep") || type.includes("charge") || type.includes("rush");
  const size = elongated ? 118 : type.includes("ring") ? 92 : 72;
  drawGlow(ctx, "red", x, y, size * 1.15, 0.2 + progress * 0.22);
  drawAtlasSprite(ctx, assets.bossPatterns, BOSS_ATLAS, column, row, x, y, size, elongated ? 76 : size, angle + time * (elongated ? 0 : 0.35), alpha);
}

function drawTelegraph(ctx, item, time, assets, bossCollisionRadius = 0, playerCollisionRadius = 0) {
  if (!item || item.active === false || item.expired) return;
  const type = String(item.type ?? item.kind ?? item.pattern ?? "circle").toLowerCase();
  if (Array.isArray(item.targets) && item.targets.length > 0 && (type.includes("bomb") || type.includes("radial"))) {
    for (const target of item.targets) {
      const targetX = Array.isArray(target) ? target[0] : target?.x;
      const targetY = Array.isArray(target) ? target[1] : target?.y;
      const targetRadius = Array.isArray(target) ? NaN : finite(target?.radius, finite(item.radius, 65)) + playerCollisionRadius;
      drawCircleTelegraph(ctx, item, time, type.includes("bomb") ? "bomb" : "radial", targetX, targetY, targetRadius);
      drawTelegraphSprite(ctx, item, type, time, assets, targetX, targetY);
    }
    return;
  }
  if (type.includes("sweep") || type.includes("laser") || type.includes("beam")) {
    drawSweepTelegraph(ctx, item, time);
    if (item.dual) {
      const oppositeAngle = finite(item.angle) + Math.PI;
      drawSweepTelegraph(ctx, item, time, oppositeAngle);
      drawTelegraphSprite(ctx, item, type, time, assets, NaN, NaN, oppositeAngle);
    }
  }
  else if (type.includes("ring") || type.includes("nova")) drawRingTelegraph(ctx, item, time);
  else if (type.includes("charge") || type.includes("rush") || type.includes("dash")) drawChargeTelegraph(ctx, item, time, bossCollisionRadius);
  else if (type.includes("airstrike") || type.includes("skyfall") || item.friendly === true || item.team === "player") drawCircleTelegraph(ctx, item, time, "friendly");
  else drawCircleTelegraph(ctx, item, time, type.includes("bomb") || type.includes("meteor") ? "bomb" : "radial");
  drawTelegraphSprite(ctx, item, type, time, assets);
}

function inferredBossTelegraph(boss, state) {
  const chargeSource = boss?.chargeTelegraph ?? (typeof boss?.charge === "object" ? boss.charge : null);
  const patternSource = chargeSource
    ?? boss?.pattern
    ?? boss?.attackPattern
    ?? state?.bossPattern
    ?? ((boss?.charging || boss?.isCharging || boss?.chargeActive) ? { type: "charge" } : null);
  if (!patternSource || patternSource === "idle") return null;
  const pattern = typeof patternSource === "object" ? patternSource : null;
  const inferred = inferredTelegraphScratch;
  inferred.type = String(pattern?.type ?? patternSource);
  inferred.x = finite(pattern?.x, finite(boss.x, GAME_WIDTH * 0.5));
  inferred.y = finite(pattern?.y, finite(boss.y, GAME_HEIGHT * 0.5));
  inferred.targetX = finite(pattern?.targetX, finite(pattern?.target?.x, finite(boss.chargeTargetX, finite(boss.targetX, finite(state?.player?.x, GAME_WIDTH * 0.5)))));
  inferred.targetY = finite(pattern?.targetY, finite(pattern?.target?.y, finite(boss.chargeTargetY, finite(boss.targetY, finite(state?.player?.y, GAME_HEIGHT * 0.5)))));
  inferred.angle = finite(pattern?.angle, finite(boss.patternAngle, finite(boss.angle)));
  inferred.radius = finite(pattern?.radius, finite(boss.patternRadius, 160));
  inferred.width = finite(pattern?.width, finite(boss.patternWidth, 78));
  inferred.progress = finite(pattern?.progress, finite(boss.chargeProgress, finite(boss.patternProgress, finite(boss.attackProgress, 0.45))));
  return inferred;
}

function drawTelegraphs(ctx, state, time, assets) {
  let explicitCount = 0;
  const bossRadius = finite(state?.boss?.radius, 0);
  const playerRadius = finite(state?.player?.radius, 0);
  for (const { collection } of arraysFrom(state, ["telegraphs", "warnings", "attackZones", "dangerZones", "airstrikes"])) {
    for (const item of collection) {
      drawTelegraph(ctx, item, time, assets, bossRadius, playerRadius);
      explicitCount += 1;
    }
  }
  const boss = state?.boss;
  for (const { collection } of arraysFrom(boss, ["telegraphs", "warnings", "attackZones"])) {
    for (const item of collection) {
      drawTelegraph(ctx, item, time, assets, bossRadius, playerRadius);
      explicitCount += 1;
    }
  }
  if (explicitCount === 0 && isAlive(boss)) {
    const inferred = inferredBossTelegraph(boss, state);
    if (inferred) drawTelegraph(ctx, inferred, time, assets, bossRadius, playerRadius);
  }
}

function drawPickups(ctx, state, quality, time) {
  let index = 0;
  for (const { collection } of arraysFrom(state, ["pickups", "xpPickups", "xpOrbs", "gems", "loot"])) {
    for (const pickup of collection) {
      if (!pickup || pickup.collected || pickup.active === false || !visible(pickup, 32)) continue;
      const x = finite(pickup.x);
      const y = finite(pickup.y);
      const rare = pickup.rare || pickup.value >= 5 || pickup.kind === "chest";
      const size = rare ? 14 : 9;
      const bob = Math.sin(time * 5 + index * 1.71) * 3;
      if (rare && quality.detailScale > 0.7) drawGlow(ctx, "amber", x, y + bob, 58, 0.55);
      ctx.save();
      ctx.translate(x, y + bob);
      ctx.rotate(time * 1.7 + index);
      ctx.fillStyle = rare ? COLORS.warning : COLORS.xp;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.72, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(-size * 0.72, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(239,255,255,.8)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      index += 1;
    }
  }
}

function enemyImage(enemy, assets) {
  const key = String(enemy?.sprite ?? enemy?.type ?? enemy?.kind ?? "hunter").toLowerCase();
  if (key.includes("suppress") || key.includes("shoot") || key.includes("sniper")) return assets?.suppressor;
  if (key.includes("brute") || key.includes("tank") || key.includes("charger")) return assets?.brute;
  if (key.includes("boss") || key.includes("wrong") || enemy?.boss) return assets?.boss;
  return assets?.hunter;
}

function enemySize(enemy) {
  if (enemy?.boss || enemy?.finalBoss) return clamp(finite(enemy.size, finite(enemy.radius) * 2 || 210), 150, 280);
  const type = String(enemy?.type ?? enemy?.kind ?? "").toLowerCase();
  const base = type.includes("brute") || type.includes("tank") ? 66
    : type.includes("shoot") || type.includes("suppress") ? 52
      : 44;
  return clamp(finite(enemy?.size, finite(enemy?.radius) * 2 || base) * (enemy?.elite ? 1.14 : 1), 30, 96);
}

function drawEnemies(ctx, state, assets, quality) {
  const drawn = entitySeen;
  drawn.clear();
  let visibleIndex = 0;
  const motionImage = imageReady(assets?.enemyMotion) ? assets.enemyMotion : null;
  let regularBarBudget = quality?.id === "performance" ? 2 : crowdRenderPressure ? 4 : 8;
  const playerX = finite(state?.player?.x, GAME_WIDTH * 0.5);
  const playerY = finite(state?.player?.y, GAME_HEIGHT * 0.5);
  for (const { collection } of arraysFrom(state, ["enemies", "mobs", "enemyUnits", "units"])) {
    for (const enemy of collection) {
      const death = actorDeathProgress(enemy);
      if ((!isAlive(enemy) && death >= 1) || enemy === state?.boss || enemy.player || enemy.team === "player" || drawn.has(enemy)) continue;
      drawn.add(enemy);
      if (!visible(enemy, 80)) continue;
      const size = enemySize(enemy);
      const elite = Boolean(enemy.elite || enemy.isElite);
      if (elite && quality.detailScale > 0.55) drawGlow(ctx, "amber", finite(enemy.x), finite(enemy.y), size * 1.65, 0.34);
      const optionIndex = (elite ? 2 : 0) + (visibleIndex % 2);
      drawActorSprite(ctx, motionImage || enemyImage(enemy, assets), enemy, size, state, quality, motionImage ? ENEMY_MOTION_DRAW_OPTIONS[optionIndex] : ENEMY_DRAW_OPTIONS[optionIndex]);
      const healthRatio = ratioOf(enemy);
      const dx = finite(enemy.x) - playerX;
      const dy = finite(enemy.y) - playerY;
      const showRegularBar = regularBarBudget > 0 && (finite(enemy.hitFlash) > 0 || healthRatio < 0.3) && dx * dx + dy * dy < 360 * 360;
      if (isAlive(enemy) && (elite || showRegularBar)) {
        drawHealthBar(ctx, enemy, Math.max(28, size * 0.68), size * 0.62, elite ? COLORS.elite : COLORS.enemy);
        if (!elite) regularBarBudget -= 1;
      }
      visibleIndex += 1;
    }
  }
}

function allyImage(ally, assets) {
  const key = String(ally?.sprite ?? ally?.type ?? ally?.kind ?? "drone").toLowerCase();
  if (key.includes("sentry") || key.includes("turret")) return assets?.sentry;
  if (key.includes("emp") || key.includes("pylon")) return assets?.emp;
  if (key.includes("suppress") || key.includes("gunner") || key.includes("rook")) return assets?.suppressor;
  if (key.includes("arcanist") || key.includes("nyx")) return assets?.hunter;
  if (key.includes("warden") || key.includes("moss")) return assets?.brute;
  if (key.includes("vanguard") || key.includes("aegis") || key.includes("player") || key.includes("merc") || key.includes("wingman")) return assets?.player;
  return assets?.drone;
}

function allySize(ally) {
  const key = String(ally?.type ?? ally?.kind ?? "").toLowerCase();
  const fallback = key.includes("sentry") ? 52 : key.includes("emp") ? 56 : key.includes("drone") ? 38 : 50;
  return clamp(finite(ally?.size, finite(ally?.radius) * 2 || fallback), 28, 78);
}

function drawAllies(ctx, state, assets, quality) {
  const drawn = entitySeen;
  drawn.clear();
  for (const { collection } of arraysFrom(state, ["deployables", "towers", "allies", "companions", "drones"])) {
    for (const ally of collection) {
      if (!isAlive(ally) || drawn.has(ally) || !visible(ally, 80)) continue;
      drawn.add(ally);
      const size = allySize(ally);
      if (ally.summoned && quality.detailScale > 0.45) drawGlow(ctx, "violet", finite(ally.x), finite(ally.y), size * 1.55, 0.34 * finite(ally.alpha, 1));
      drawActorSprite(ctx, allyImage(ally, assets), ally, size, state, quality, ALLY_DRAW_OPTIONS);
      if (ally.kind === "emp" || ally.type === "emp" || ally.pulseRadius) {
        ctx.globalAlpha = 0.34;
        ctx.strokeStyle = "#b879ff";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 7]);
        ctx.beginPath();
        ctx.arc(finite(ally.x), finite(ally.y), finite(ally.pulseRadius, 30) + Math.sin(timeOf(state) * 3) * 2, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }
      drawHealthBar(ctx, ally, Math.max(30, size * 0.72), size * 0.62, COLORS.ally);
    }
  }
}

function bossCoreIsExposed(boss, state) {
  return Boolean(
    boss?.coreExposed
    || boss?.weak
    || finite(boss?.weakness) > 0
    || finite(boss?.weaknessTimer) > 0
    || finite(boss?.weakTimer) > 0
    || state?.bossCoreExposed,
  );
}

function drawBossCore(ctx, boss, state, x, y, size, time) {
  if (!bossCoreIsExposed(boss, state)) return;
  const pulse = 0.5 + Math.sin(time * 8.5) * 0.5;
  const coreRadius = size * (0.105 + pulse * 0.012);
  const ringRadius = size * (0.19 + pulse * 0.018);
  const accent = Math.sin(time * 5) > -0.15 ? COLORS.warning : COLORS.player;

  // Keep this local to the center so the underlying boss raster remains legible.
  drawGlow(ctx, pulse > 0.46 ? "amber" : "cyan", x, y, size * 0.52, 0.68 + pulse * 0.18);
  ctx.globalAlpha = 0.18 + pulse * 0.08;
  ctx.fillStyle = COLORS.warning;
  ctx.beginPath();
  ctx.arc(x, y, coreRadius, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(x, y, coreRadius, 0, TAU);
  ctx.stroke();
  ctx.globalAlpha = 0.72;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(x, y, ringRadius, time * 1.8, time * 1.8 + TAU);
  ctx.stroke();
  ctx.setLineDash([]);

  const bracket = ringRadius + 9;
  const arm = 10;
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x - bracket, y - arm);
  ctx.lineTo(x - bracket, y);
  ctx.lineTo(x - bracket + arm, y);
  ctx.moveTo(x + bracket, y - arm);
  ctx.lineTo(x + bracket, y);
  ctx.lineTo(x + bracket - arm, y);
  ctx.moveTo(x - bracket, y + arm);
  ctx.lineTo(x - bracket, y);
  ctx.moveTo(x + bracket, y + arm);
  ctx.lineTo(x + bracket, y);
  ctx.stroke();

  const labelY = y + size * 0.46;
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = "rgba(3,8,11,.84)";
  roundedRect(ctx, x - 57, labelY - 12, 114, 24, 4);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = COLORS.white;
  ctx.font = "800 11px 'IBM Plex Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CORE EXPOSED", x, labelY + 0.5);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.globalAlpha = 1;
}

function drawBoss(ctx, state, assets, quality) {
  const boss = state?.boss;
  if (!boss || (boss.active === false && !boss.dead) || (!isAlive(boss) && actorDeathProgress(boss) >= 1) || !visible(boss, 280)) return;
  const time = timeOf(state);
  const size = clamp(finite(boss.size, finite(boss.radius) * 2 || 224), 170, 300);
  const entrance = clamp01(boss.entrance ?? boss.entranceProgress ?? state.bossEntranceProgress ?? 1);
  const phase = Math.max(1, finite(boss.stage, finite(boss.phase, finite(state.bossPhase, 1))));
  const phaseFlash = clamp01(boss.phaseFlash ?? boss.transitionFlash ?? state.phaseFlash ?? 0);
  const x = finite(boss.x, GAME_WIDTH * 0.72);
  const y = finite(boss.y, GAME_HEIGHT * 0.5);
  const coreExposed = bossCoreIsExposed(boss, state);
  const transforming = finite(boss.transformTimer) > 0;
  const transformPulse = transforming ? 0.5 + Math.sin(time * 21) * 0.5 : 0;
  const transformProgress = transforming ? clamp01(1 - finite(boss.transformTimer) / Math.max(0.001, finite(boss.transformDuration, 1.8))) : 1;
  const bossMotionImage = imageReady(assets?.bossMotion) ? assets.bossMotion : null;
  const bossImage = bossMotionImage || (phase >= 3 ? (assets?.bossPhase3 || assets?.boss)
    : phase >= 2 ? (assets?.bossPhase2 || assets?.boss)
      : assets?.boss);
  const previousBossImage = bossMotionImage || (phase >= 3 ? (assets?.bossPhase2 || assets?.boss)
    : phase >= 2 ? assets?.boss
      : null);
  const bossDrawOptions = bossMotionImage ? BOSS_MOTION_DRAW_OPTIONS : BOSS_DRAW_OPTIONS;
  const bossLayerOptions = bossMotionImage ? BOSS_MOTION_LAYER_OPTIONS : BOSS_LAYER_OPTIONS;

  drawGlow(ctx, phase >= 3 ? "amber" : "red", x, y, size * (1.55 + phaseFlash * 0.3 + transformPulse * 0.22), 0.62 + phaseFlash * 0.25);
  if (coreExposed) drawGlow(ctx, "amber", x, y, size * 0.92, 0.48);
  ctx.globalAlpha = 0.55 + phaseFlash * 0.4;
  ctx.strokeStyle = phaseFlash > 0 ? COLORS.white : COLORS.boss;
  ctx.lineWidth = phaseFlash > 0 ? 6 : 2.5;
  ctx.setLineDash([18, 13]);
  ctx.beginPath();
  ctx.arc(x, y, size * 0.52 + Math.sin(time * 3.6) * 5, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  if (entrance < 1) {
    const ring = 45 + entrance * 260;
    ctx.globalAlpha = 1 - entrance;
    ctx.strokeStyle = COLORS.white;
    ctx.lineWidth = 8 * (1 - entrance) + 2;
    ctx.beginPath();
    ctx.arc(x, y, ring, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  const entranceScale = 0.42 + entrance * 0.58;
  bossProxy.id = boss.id;
  bossProxy.x = x;
  bossProxy.y = y;
  bossProxy.vx = boss.vx;
  bossProxy.vy = boss.vy;
  bossProxy.angle = boss.angle;
  bossProxy.alpha = clamp01(entrance * 1.35);
  bossProxy.hitFlash = boss.hitFlash;
  bossProxy.dead = boss.dead;
  bossProxy.deathTimer = boss.deathTimer;
  bossProxy.deathDuration = boss.deathDuration;
  bossProxy.hitStun = boss.hitStun;
  bossProxy.recoil = boss.recoil;
  bossProxy.attackTimer = boss.attackTimer;
  bossProxy.attackState = boss.attackState;
  bossProxy.animationState = boss.animationState;
  bossProxy.activePattern = boss.activePattern;
  bossProxy.weakness = boss.weakness;
  bossProxy.coreExposed = coreExposed;
  bossProxy.stage = phase;
  bossProxy.transformTimer = boss.transformTimer;
  bossProxy.transformDuration = boss.transformDuration;
  if (transforming && imageReady(previousBossImage) && (bossMotionImage || previousBossImage !== bossImage)) {
    bossOldProxy.id = finite(boss.id, 0) - 1;
    bossOldProxy.x = x;
    bossOldProxy.y = y;
    bossOldProxy.vx = boss.vx;
    bossOldProxy.vy = boss.vy;
    bossOldProxy.angle = boss.angle;
    bossOldProxy.alpha = clamp01(entrance * (1 - transformProgress));
    bossOldProxy.hitFlash = boss.hitFlash;
    bossOldProxy.dead = boss.dead;
    bossOldProxy.deathTimer = boss.deathTimer;
    bossOldProxy.deathDuration = boss.deathDuration;
    bossOldProxy.hitStun = boss.hitStun;
    bossOldProxy.recoil = boss.recoil;
    bossOldProxy.attackTimer = boss.attackTimer;
    bossOldProxy.attackState = boss.attackState;
    bossOldProxy.animationState = boss.animationState;
    bossOldProxy.activePattern = boss.activePattern;
    bossOldProxy.weakness = boss.weakness;
    bossOldProxy.coreExposed = coreExposed;
    bossOldProxy.stage = Math.max(1, phase - 1);
    bossOldProxy.transformTimer = boss.transformTimer;
    bossOldProxy.transformDuration = boss.transformDuration;
    drawActorSprite(ctx, previousBossImage, bossOldProxy, size * entranceScale * (1.05 - transformProgress * 0.08), state, quality, bossLayerOptions);
    bossProxy.alpha *= clamp01(0.18 + transformProgress * 1.08);
  }
  drawActorSprite(ctx, bossImage, bossProxy, size * entranceScale * (1 + transformPulse * 0.07), state, quality, bossDrawOptions);
  if (transforming) {
    ctx.globalAlpha = 0.38 + transformPulse * 0.35;
    ctx.strokeStyle = phase >= 3 ? "#ffd56e" : COLORS.white;
    ctx.lineWidth = 5 + transformPulse * 5;
    for (let ring = 0; ring < 3; ring += 1) {
      ctx.beginPath();
      ctx.arc(x, y, size * (0.42 + ring * 0.13) + transformPulse * 14, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  drawBossCore(ctx, boss, state, x, y, size * entranceScale, time);
  if (isAlive(boss)) drawHealthBar(ctx, boss, Math.min(160, size * 0.72), size * 0.62, phase >= 3 ? COLORS.warning : COLORS.boss, true);
}

function drawPlayer(ctx, state, assets, quality) {
  const player = state?.player ?? state?.hero;
  if (!player || (player.dead && actorDeathProgress(player) >= 1) || !visible(player, 110)) return;
  const time = timeOf(state);
  const size = clamp(finite(player.size, finite(player.radius) * 2 || 64), 48, 84);
  const speed = Math.hypot(finite(player.vx), finite(player.vy));
  const dashRaw = finite(player.dashTime, finite(player.dashRemaining, finite(player.dashTimer, speed > 410 ? finite(player.dashDuration, 0.16) : 0)));
  const dash = clamp01(dashRaw / Math.max(0.001, finite(player.dashDuration, 0.16)));
  const velocityAngle = speed > 1 ? Math.atan2(finite(player.vy), finite(player.vx)) : spriteAngle(player);
  const playerMotionImage = imageReady(assets?.playerMotion) ? assets.playerMotion : null;
  const playerImage = playerMotionImage || assets?.player;
  const playerOptions = playerMotionImage ? PLAYER_MOTION_DRAW_OPTIONS : PLAYER_DRAW_OPTIONS;
  const ghostOptions = playerMotionImage ? PLAYER_MOTION_GHOST_OPTIONS : PLAYER_GHOST_OPTIONS;

  if (dash > 0 || player.dashing) {
    const distance = clamp(speed * 0.07, 14, 42);
    for (let index = 3; index >= 1; index -= 1) {
      playerGhostProxy.id = finite(player.id, 1) - index;
      playerGhostProxy.x = finite(player.x) - Math.cos(velocityAngle) * distance * index;
      playerGhostProxy.y = finite(player.y) - Math.sin(velocityAngle) * distance * index;
      playerGhostProxy.vx = player.vx;
      playerGhostProxy.vy = player.vy;
      playerGhostProxy.angle = player.angle;
      playerGhostProxy.alpha = (0.09 + index * 0.04) * (dash || 1);
      playerGhostProxy.hitFlash = 0;
      playerGhostProxy.hitStun = 0;
      playerGhostProxy.stunTimer = 0;
      playerGhostProxy.recoil = player.recoil;
      playerGhostProxy.attackTimer = player.attackTimer;
      playerGhostProxy.attackState = player.attackState;
      playerGhostProxy.animationState = "dash";
      playerGhostProxy.dashTimer = player.dashTimer;
      playerGhostProxy.dashDuration = player.dashDuration;
      playerGhostProxy.fireTimers = player.fireTimers;
      playerGhostProxy.fireRateMultiplier = player.fireRateMultiplier;
      playerGhostProxy.overdriveHaste = player.overdriveHaste;
      drawActorSprite(ctx, playerImage, playerGhostProxy, size * (1 - index * 0.035), state, quality, ghostOptions);
    }
  }

  drawGlow(ctx, "cyan", finite(player.x), finite(player.y), size * 1.7, 0.38 + dash * 0.35);
  drawActorSprite(ctx, playerImage, player, size, state, quality, playerOptions);
  if (!player.dead) drawHealthBar(ctx, player, Math.max(48, size * 0.82), size * 0.66, COLORS.player, true);
  if (finite(player.shield) > 0) {
    const width = Math.max(48, size * 0.82);
    const shieldRatio = clamp01(player.shield / Math.max(1, finite(player.maxShield, finite(player.maxHp, player.shield))));
    ctx.fillStyle = "rgba(3,8,12,.86)";
    ctx.fillRect(finite(player.x) - width * 0.5, finite(player.y) - size * 0.66 + 7, width, 3);
    ctx.fillStyle = "#b286ff";
    ctx.fillRect(finite(player.x) - width * 0.5, finite(player.y) - size * 0.66 + 7, width * shieldRatio, 3);
  }

  const invulnerable = finite(player.invulnerability, finite(player.invulnerable, finite(player.invulnTimer)));
  if (invulnerable > 0) {
    ctx.globalAlpha = 0.45 + Math.sin(time * 18) * 0.16;
    ctx.strokeStyle = COLORS.white;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(finite(player.x), finite(player.y), size * 0.54, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function projectileAngle(projectile) {
  if (Number.isFinite(projectile?.angle)) return projectile.angle;
  return Math.atan2(finite(projectile?.vy), finite(projectile?.vx));
}

function isHeavyProjectileType(type) {
  return type.includes("rail") || type.includes("rocket") || type.includes("missile")
    || type.includes("heavy") || type.includes("moss") || type.includes("omega");
}

function drawMuzzleFlash(ctx, projectile, enemy, type, angle, quality) {
  const age = finite(projectile?.age, 1);
  if (age > 0.075 || quality?.reducedMotion) return;
  const alpha = clamp01(1 - age / 0.075);
  const radius = clamp(finite(projectile?.radius, 5), 2, 18);
  const heavy = isHeavyProjectileType(type);
  const x = finite(projectile?.x) - Math.cos(angle) * (radius * 1.8 + 8);
  const y = finite(projectile?.y) - Math.sin(angle) * (radius * 1.8 + 8);
  ctx.save();
  ctx.globalCompositeOperation = quality?.id === "performance" ? "source-over" : "lighter";
  ctx.globalAlpha = alpha * (heavy ? 0.88 : 0.58);
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = enemy ? "#ff506d" : heavy ? "#ffe176" : "#a6f9ff";
  ctx.beginPath();
  ctx.moveTo(radius * (heavy ? 6.5 : 4.2), 0);
  ctx.lineTo(-radius * 0.9, -radius * (heavy ? 2.2 : 1.35));
  ctx.lineTo(-radius * 0.35, 0);
  ctx.lineTo(-radius * 0.9, radius * (heavy ? 2.2 : 1.35));
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha *= 0.68;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = Math.max(1, radius * 0.42);
  for (let ray = -1; ray <= 1; ray += 1) {
    ctx.beginPath();
    ctx.moveTo(0, ray * radius * 0.5);
    ctx.lineTo(radius * (heavy ? 7.5 : 5), ray * radius * 1.8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawWorldDecals(ctx, state, time, quality) {
  const pairs = arraysFrom(state, ["decals", "groundEffects"]);
  for (const { collection } of pairs) {
    for (const decal of collection) {
      if (!decal || decal.active === false || !visible(decal, 120)) continue;
      const ratio = particleRatio(decal);
      const type = String(decal.type ?? decal.kind ?? "impact").toLowerCase();
      const size = clamp(finite(decal.radius, finite(decal.size, 36)), 8, 180);
      ctx.globalAlpha = ratio * (quality?.id === "performance" ? 0.18 : 0.32);
      ctx.fillStyle = type.includes("burn") || type.includes("rocket") ? "rgba(78,18,13,.55)" : "rgba(25,90,101,.35)";
      ctx.beginPath();
      ctx.ellipse(finite(decal.x), finite(decal.y), size, size * 0.34, finite(decal.angle, time * 0.02), 0, TAU);
      ctx.fill();
      ctx.strokeStyle = type.includes("enemy") ? "rgba(255,68,88,.34)" : "rgba(111,241,255,.27)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  ctx.globalAlpha = 1;
}

function drawTypedCombatVfx(ctx, state, time, assets, quality) {
  const pairs = arraysFrom(state, ["impacts", "muzzles", "vfx"]);
  const performance = quality?.id === "performance";
  ctx.save();
  ctx.globalCompositeOperation = performance ? "source-over" : "lighter";
  for (const { key, collection } of pairs) {
    const stride = performance && collection.length > 50 ? 2 : 1;
    for (let index = 0; index < collection.length; index += stride) {
      const effect = collection[index];
      if (!effect || effect.active === false || !visible(effect, 100)) continue;
      const type = String(effect.type ?? effect.kind ?? key).toLowerCase();
      const ratio = particleRatio(effect);
      const progress = 1 - ratio;
      const x = finite(effect.x);
      const y = finite(effect.y);
      const angle = finite(effect.angle, Math.atan2(finite(effect.vy), finite(effect.vx)));
      const enemy = effect.enemy || type.includes("boss") || type.includes("enemy");
      const heavy = isHeavyProjectileType(type) || type.includes("explosion") || type.includes("nova");
      const radius = clamp(finite(effect.radius, finite(effect.size, heavy ? 38 : 18)), 5, 150);
      const color = effect.color || (enemy ? COLORS.enemy : heavy ? COLORS.warning : COLORS.player);
      ctx.globalAlpha = ratio * (heavy ? 0.8 : 0.62);
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1.5, radius * 0.12 * ratio);
      ctx.beginPath();
      ctx.arc(x, y, radius * (0.35 + progress * 1.15), 0, TAU);
      ctx.stroke();
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      for (let ray = 0; ray < (performance ? 3 : heavy ? 9 : 5); ray += 1) {
        const rayAngle = ray / (performance ? 3 : heavy ? 9 : 5) * TAU;
        const length = radius * (0.7 + ((ray * 37) % 5) * 0.13) * ratio;
        ctx.beginPath();
        ctx.moveTo(Math.cos(rayAngle) * radius * 0.2, Math.sin(rayAngle) * radius * 0.2);
        ctx.lineTo(Math.cos(rayAngle) * length, Math.sin(rayAngle) * length);
        ctx.stroke();
      }
      ctx.restore();
      if (!performance && heavy) {
        const atlas = enemy ? assets?.bossPatterns : assets?.playerOrdnance;
        const atlasDefinition = enemy ? BOSS_ATLAS : PLAYER_ATLAS;
        const cell = enemy ? bossAtlasCell(type) : playerAtlasCell(type);
        drawAtlasSprite(ctx, atlas, atlasDefinition, cell % atlasDefinition.columns, Math.floor(cell / atlasDefinition.columns), x, y, radius * 2.2, radius * 2.2, time * 0.8, ratio * 0.55);
      }
    }
  }
  ctx.restore();
}

function isEnemyProjectile(projectile, collectionKey = "") {
  if (collectionKey.toLowerCase().includes("enemy") || collectionKey.toLowerCase().includes("boss")) return true;
  const team = String(projectile?.team ?? projectile?.owner ?? projectile?.source ?? "").toLowerCase();
  return team.includes("enemy") || team.includes("boss") || projectile?.hostile === true;
}

function drawBullet(ctx, projectile, enemy, quality, assets) {
  if (!visible(projectile, 60)) return;
  const x = finite(projectile.x);
  const y = finite(projectile.y);
  const radius = clamp(finite(projectile.radius, finite(projectile.size, 5)), 2, 18);
  const angle = projectileAngle(projectile);
  const color = projectile.color || (enemy ? COLORS.enemy : COLORS.player);
  const type = String(projectile.type ?? projectile.kind ?? "bullet").toLowerCase();
  const performance = quality?.id === "performance";
  const heavy = isHeavyProjectileType(type);

  drawMuzzleFlash(ctx, projectile, enemy, type, angle, quality);

  const atlasImage = enemy && type.includes("boss") ? assets?.bossPatterns : (!enemy ? assets?.playerOrdnance : null);
  if (imageReady(atlasImage)) {
    const atlasDefinition = enemy ? BOSS_ATLAS : PLAYER_ATLAS;
    const atlasCell = enemy ? bossAtlasCell(type) : playerAtlasCell(type);
    const column = atlasCell % atlasDefinition.columns;
    const row = Math.floor(atlasCell / atlasDefinition.columns);
    const width = enemy ? radius * 6.6 : radius * (heavy ? 9.5 : 7.2);
    const height = enemy ? radius * 6.6 : radius * (heavy ? 5.8 : 6.2);
    if (!performance && quality.detailScale > 0.42) drawGlow(ctx, enemy ? "red" : (type.includes("rocket") ? "amber" : "cyan"), x, y, Math.max(width, height) * 1.15, 0.32);
    ctx.save();
    ctx.globalAlpha = 0.34;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.5, radius * 1.15);
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(angle) * Math.min(48, width), y - Math.sin(angle) * Math.min(48, width));
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();
    if (!performance && (heavy || (entitySeed(projectile) & 3) === 0)) {
      drawAtlasSprite(
        ctx,
        atlasImage,
        atlasDefinition,
        column,
        row,
        x - Math.cos(angle) * Math.min(34, width * 0.7),
        y - Math.sin(angle) * Math.min(34, width * 0.7),
        width * 0.82,
        height * 0.82,
        angle,
        heavy ? 0.2 : 0.11,
      );
    }
    drawAtlasSprite(ctx, atlasImage, atlasDefinition, column, row, x, y, width, height, angle, 1);
    return;
  }

  if (type.includes("orbit")) {
    if (!performance && quality.detailScale > 0.45) drawGlow(ctx, enemy ? "red" : "cyan", x, y, radius * 7, 0.45);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.55, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = COLORS.white;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(2, radius * 0.72), 0, TAU);
    ctx.fill();
    return;
  }

  if (type.includes("chain") || type.includes("lightning")) {
    const targetX = finite(projectile.targetX, finite(projectile.target?.x, x + Math.cos(angle) * 80));
    const targetY = finite(projectile.targetY, finite(projectile.target?.y, y + Math.sin(angle) * 80));
    ctx.globalAlpha = clamp01(projectile.alpha ?? 0.9);
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1.5, radius * 0.6);
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let step = 1; step < 5; step += 1) {
      const progress = step / 5;
      const jitter = Math.sin((finite(projectile.id, x + y) + step * 17) * 1.7) * radius;
      ctx.lineTo(x + (targetX - x) * progress - Math.sin(angle) * jitter, y + (targetY - y) * progress + Math.cos(angle) * jitter);
    }
    ctx.lineTo(targetX, targetY);
    ctx.stroke();
    ctx.globalAlpha = 1;
    return;
  }

  if (type.includes("rocket") || type.includes("missile")) {
    if (!performance && quality.detailScale > 0.5) drawGlow(ctx, enemy ? "red" : "amber", x, y, radius * 6, 0.38);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = enemy ? "#ff6b63" : "#ffd364";
    ctx.fillRect(-radius * 1.4, -radius * 0.52, radius * 2.8, radius * 1.04);
    ctx.fillStyle = "#eafcff";
    ctx.beginPath();
    ctx.moveTo(radius * 2, 0);
    ctx.lineTo(radius, -radius * 0.66);
    ctx.lineTo(radius, radius * 0.66);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,152,43,.8)";
    ctx.beginPath();
    ctx.moveTo(-radius * 1.4, 0);
    ctx.lineTo(-radius * 3.4, -radius * 0.65);
    ctx.lineTo(-radius * 3.4, radius * 0.65);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return;
  }

  if (type.includes("rail")) {
    const length = clamp(finite(projectile.length, 62), 20, 150);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = color;
    ctx.lineWidth = radius * 3;
    ctx.beginPath();
    ctx.moveTo(-length, 0);
    ctx.lineTo(length * 0.32, 0);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = COLORS.white;
    ctx.lineWidth = Math.max(1.5, radius * 0.65);
    ctx.beginPath();
    ctx.moveTo(-length * 0.8, 0);
    ctx.lineTo(length * 0.36, 0);
    ctx.stroke();
    ctx.restore();
    return;
  }

  const speed = Math.hypot(finite(projectile.vx), finite(projectile.vy));
  const trail = clamp(finite(projectile.trail, speed * 0.035), 7, 30);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = 0.34;
  ctx.strokeStyle = color;
  ctx.lineWidth = radius * 1.5;
  ctx.beginPath();
  if (Number.isFinite(projectile.px) && Number.isFinite(projectile.py)) {
    const previousDistance = Math.hypot(x - projectile.px, y - projectile.py);
    ctx.moveTo(-clamp(previousDistance, 3, 52), 0);
  } else ctx.moveTo(-trail, 0);
  ctx.lineTo(0, 0);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, TAU);
  ctx.fill();
  ctx.fillStyle = COLORS.white;
  ctx.beginPath();
  ctx.arc(radius * 0.18, -radius * 0.18, Math.max(1, radius * 0.34), 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawProjectiles(ctx, state, assets, quality) {
  const drawn = entitySeen;
  drawn.clear();
  const pairs = arraysFrom(state, [
    "projectiles", "bullets", "playerBullets", "enemyProjectiles", "enemyBullets", "bossBullets", "rockets", "orbitals", "orbs",
  ]);
  let density = 0;
  for (const pair of pairs) density += pair.collection.length;
  const playerStride = quality?.id === "performance" ? (density > 520 ? 4 : density > 300 ? 3 : density > 170 ? 2 : 1)
    : quality?.detailScale < 0.7 && density > 480 ? 2 : 1;
  for (const { key, collection } of pairs) {
    for (const projectile of collection) {
      if (!projectile || projectile.dead || projectile.active === false || drawn.has(projectile)) continue;
      drawn.add(projectile);
      const enemy = isEnemyProjectile(projectile, key);
      const type = String(projectile.type ?? projectile.kind ?? "bullet").toLowerCase();
      if (!enemy && playerStride > 1 && !isHeavyProjectileType(type) && Math.abs(entitySeed(projectile)) % playerStride !== 0) continue;
      drawBullet(ctx, projectile, enemy, quality, assets);
    }
  }
}

function drawBeam(ctx, beam, enemy, time, assets) {
  if (!beam || beam.active === false) return;
  const x1 = finite(beam.x1, finite(beam.x, finite(beam.fromX)));
  const y1 = finite(beam.y1, finite(beam.y, finite(beam.fromY)));
  let x2 = finite(beam.x2, finite(beam.toX, finite(beam.targetX, NaN)));
  let y2 = finite(beam.y2, finite(beam.toY, finite(beam.targetY, NaN)));
  if (!Number.isFinite(x2) || !Number.isFinite(y2)) {
    const angle = finite(beam.angle);
    const length = finite(beam.length, 500);
    x2 = x1 + Math.cos(angle) * length;
    y2 = y1 + Math.sin(angle) * length;
  }
  const alpha = clamp01(beam.alpha ?? beam.lifeRatio ?? 1);
  const width = clamp(finite(beam.width, 6), 1, 160);
  const color = beam.color || (enemy ? COLORS.enemy : COLORS.player);
  const charging = beam.phase === "charge" || finite(beam.charge) > 0;
  const beamType = String(beam.type ?? beam.kind ?? "beam").toLowerCase();
  const beamAngle = Math.atan2(y2 - y1, x2 - x1);
  if (!enemy && beamType.includes("omega")) {
    drawGlow(ctx, "cyan", x1, y1, 160, charging ? 0.35 : 0.72);
    drawAtlasSprite(ctx, assets?.playerOrdnance, PLAYER_ATLAS, 2, 2, x1 + Math.cos(beamAngle) * 26, y1 + Math.sin(beamAngle) * 26, 132, 94, beamAngle, clamp01(beam.alpha ?? 1));
  }
  if (charging) {
    ctx.save();
    ctx.globalAlpha = 0.35 + Math.sin(time * 20) * 0.12;
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, width * 0.16);
    ctx.setLineDash([18, 12]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    return;
  }
  ctx.globalAlpha = alpha * 0.28;
  ctx.strokeStyle = color;
  ctx.lineWidth = width * 3.4;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = Math.sin(time * 20) > -0.65 ? COLORS.white : color;
  ctx.lineWidth = Math.max(1, width * 0.45);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawChainsAndBeams(ctx, state, time, assets) {
  for (const { key, collection } of arraysFrom(state, ["beams", "lasers", "rails", "chains", "lightning"])) {
    for (const beam of collection) {
      const points = beam?.points ?? beam?.links;
      if (Array.isArray(points) && points.length > 1) {
        ctx.globalAlpha = clamp01(beam.alpha ?? 0.88);
        ctx.strokeStyle = beam.color || (isEnemyProjectile(beam, key) ? COLORS.enemy : "#bbfaff");
        ctx.lineWidth = finite(beam.width, 2.2);
        ctx.beginPath();
        ctx.moveTo(finite(points[0].x), finite(points[0].y));
        for (let index = 1; index < points.length; index += 1) {
          const point = points[index];
          const jitter = index === points.length - 1 ? 0 : Math.sin(time * 31 + index * 9) * 3;
          ctx.lineTo(finite(point.x) + jitter, finite(point.y) - jitter);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        const endpoint = points[points.length - 1];
        drawAtlasSprite(ctx, assets?.playerOrdnance, PLAYER_ATLAS, 2, 1, finite(endpoint.x), finite(endpoint.y), 42, 42, time * 2.4, clamp01(beam.alpha ?? 0.9));
      } else drawBeam(ctx, beam, isEnemyProjectile(beam, key), time, assets);
    }
  }
}

function drawOrbitLinks(ctx, state, time, assets, quality) {
  const orbitals = state?.orbitals;
  if (!Array.isArray(orbitals) || orbitals.length === 0) return;
  ctx.globalAlpha = 0.28 + Math.sin(time * 6) * 0.06;
  ctx.strokeStyle = COLORS.player;
  ctx.lineWidth = 1;
  ctx.beginPath();
  let started = false;
  for (const orbital of orbitals) {
    if (!visible(orbital, 30)) continue;
    if (!started) {
      ctx.moveTo(finite(orbital.x), finite(orbital.y));
      started = true;
    } else ctx.lineTo(finite(orbital.x), finite(orbital.y));
  }
  if (started) ctx.stroke();
  ctx.globalAlpha = 1;
  for (const orbital of orbitals) {
    if (!visible(orbital, 40)) continue;
    if (quality?.id !== "performance" && quality.detailScale > 0.4) drawGlow(ctx, "cyan", finite(orbital.x), finite(orbital.y), 58, 0.3);
    if (!drawAtlasSprite(ctx, assets?.playerOrdnance, PLAYER_ATLAS, 1, 1, finite(orbital.x), finite(orbital.y), 50, 50, finite(orbital.angle, time * 3), 1)) {
      ctx.strokeStyle = COLORS.player;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(finite(orbital.x), finite(orbital.y), 12, 0, TAU);
      ctx.stroke();
    }
  }
}

function particleRatio(particle) {
  if (Number.isFinite(particle?.alpha)) return clamp01(particle.alpha);
  if (Number.isFinite(particle?.life) && Number.isFinite(particle?.maxLife)) return clamp01(particle.life / Math.max(0.001, particle.maxLife));
  if (Number.isFinite(particle?.ttl) && Number.isFinite(particle?.duration)) return clamp01(particle.ttl / Math.max(0.001, particle.duration));
  return 0.8;
}

function particleColor(particle) {
  if (particle?.color) return particle.color;
  const kind = String(particle?.type ?? particle?.kind ?? "").toLowerCase();
  if (kind.includes("xp") || kind.includes("player")) return COLORS.player;
  if (kind.includes("heal")) return COLORS.ally;
  if (kind.includes("boss") || kind.includes("enemy") || kind.includes("blood")) return COLORS.enemy;
  if (kind.includes("fire") || kind.includes("spark")) return COLORS.warning;
  return COLORS.white;
}

function drawParticles(ctx, state, quality) {
  const particles = particleScratch;
  particles.length = 0;
  for (const { collection } of arraysFrom(state, ["particles", "effects", "debris", "sparks"])) {
    for (const particle of collection) if (particle && visible(particle, 50)) particles.push(particle);
  }
  const cap = Math.max(24, Math.floor(finite(quality.maxParticles, 190) * finite(quality.particleScale, 1)));
  const start = Math.max(0, particles.length - cap);
  const performance = quality?.id === "performance";
  ctx.save();
  ctx.globalCompositeOperation = performance ? "source-over" : "lighter";
  for (let index = start; index < particles.length; index += 1) {
    const particle = particles[index];
    const alpha = particleRatio(particle);
    const size = clamp(finite(particle.size, finite(particle.radius, 3)), 1, 24);
    const color = particleColor(particle);
    const kind = String(particle.type ?? particle.kind ?? "spark").toLowerCase();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    if (!performance && (kind.includes("smoke") || kind.includes("dust"))) ctx.globalCompositeOperation = "source-over";
    if (particle.line || particle.streak || Math.hypot(finite(particle.vx), finite(particle.vy)) > 260) {
      const vx = finite(particle.vx);
      const vy = finite(particle.vy);
      const magnitude = Math.max(1, Math.hypot(vx, vy));
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, size * 0.65);
      ctx.beginPath();
      ctx.moveTo(finite(particle.x), finite(particle.y));
      ctx.lineTo(finite(particle.x) - vx / magnitude * size * 4, finite(particle.y) - vy / magnitude * size * 4);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(finite(particle.x), finite(particle.y), size, 0, TAU);
      ctx.fill();
    }
    if (!performance && (kind.includes("smoke") || kind.includes("dust"))) ctx.globalCompositeOperation = "lighter";
  }
  ctx.restore();
}

function drawShockwaves(ctx, state, time, assets) {
  for (const { collection } of arraysFrom(state, ["shockwaves", "rings", "explosions"])) {
    for (const effect of collection) {
      if (!effect || effect.active === false || !visible(effect, 240)) continue;
      const progress = telegraphProgress(effect);
      const radius = finite(effect.radius, finite(effect.maxRadius, 130) * progress);
      ctx.globalAlpha = clamp01(effect.alpha ?? (1 - progress));
      ctx.strokeStyle = effect.color || (effect.enemy ? COLORS.enemy : COLORS.warning);
      ctx.lineWidth = Math.max(1, finite(effect.width, 7) * (1 - progress * 0.6));
      ctx.beginPath();
      ctx.arc(finite(effect.x), finite(effect.y), radius, 0, TAU);
      ctx.stroke();
      const type = String(effect.type ?? effect.kind ?? "").toLowerCase();
      if (type.includes("nova") || type.includes("orbitmaster")) {
        const spriteSize = clamp(72 + progress * 170, 72, 242);
        drawAtlasSprite(ctx, assets?.playerOrdnance, PLAYER_ATLAS, 0, 2, finite(effect.x), finite(effect.y), spriteSize, spriteSize, time * 0.45, (1 - progress) * 0.78);
      } else if (type.includes("bosstransform")) {
        const spriteSize = clamp(90 + progress * 160, 90, 250);
        drawAtlasSprite(ctx, assets?.bossPatterns, BOSS_ATLAS, 0, 0, finite(effect.x), finite(effect.y), spriteSize, spriteSize, -time * 0.5, (1 - progress) * 0.68);
      }
    }
  }
  ctx.globalAlpha = 1;

  const phaseFlash = clamp01(state?.phaseFlash ?? state?.boss?.phaseFlash ?? 0);
  if (phaseFlash > 0) {
    ctx.fillStyle = `rgba(255,66,89,${phaseFlash * 0.16})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.globalAlpha = phaseFlash;
    ctx.strokeStyle = COLORS.white;
    ctx.lineWidth = 5;
    ctx.strokeRect(12, 12, GAME_WIDTH - 24, GAME_HEIGHT - 24);
    ctx.globalAlpha = 1;
  }
}

function drawDamageTexts(ctx, state, quality) {
  const texts = damageTextScratch;
  texts.length = 0;
  for (const { collection } of arraysFrom(state, ["damageTexts", "texts", "floatingTexts", "combatTexts"])) {
    for (const item of collection) if (item && visible(item, 80)) texts.push(item);
  }
  const cap = Math.max(12, finite(quality.maxDamageTexts, 40));
  const start = Math.max(0, texts.length - cap);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let index = start; index < texts.length; index += 1) {
    const item = texts[index];
    const alpha = particleRatio(item);
    const critical = item.critical || item.crit;
    const value = item.text ?? item.value ?? item.damage ?? "";
    if (value === "") continue;
    ctx.globalAlpha = alpha;
    ctx.font = `${critical ? 800 : 700} ${critical ? 22 : 15}px 'IBM Plex Mono', monospace`;
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(1,5,8,.88)";
    ctx.strokeText(String(value), finite(item.x), finite(item.y));
    ctx.fillStyle = item.color || (critical ? COLORS.warning : COLORS.white);
    ctx.fillText(String(value), finite(item.x), finite(item.y));
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function aimPoint(state) {
  const aim = state?.aim ?? state?.input?.aim ?? state?.pointer;
  if (Number.isFinite(aim?.x) && Number.isFinite(aim?.y)) return aim;
  if (Number.isFinite(state?.aimX) && Number.isFinite(state?.aimY)) return { x: state.aimX, y: state.aimY };
  const player = state?.player ?? state?.hero;
  if (!player) return null;
  const angle = spriteAngle(player);
  return { x: finite(player.x) + Math.cos(angle) * 100, y: finite(player.y) + Math.sin(angle) * 100 };
}

function drawAim(ctx, state, time) {
  const aim = aimPoint(state);
  if (!aim || !visible(aim, 20)) return;
  const radius = 10 + Math.sin(time * 6) * 1.4;
  ctx.strokeStyle = "rgba(224,254,255,.78)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(aim.x, aim.y, radius, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(aim.x - radius - 7, aim.y);
  ctx.lineTo(aim.x - radius + 2, aim.y);
  ctx.moveTo(aim.x + radius - 2, aim.y);
  ctx.lineTo(aim.x + radius + 7, aim.y);
  ctx.moveTo(aim.x, aim.y - radius - 7);
  ctx.lineTo(aim.x, aim.y - radius + 2);
  ctx.moveTo(aim.x, aim.y + radius - 2);
  ctx.lineTo(aim.x, aim.y + radius + 7);
  ctx.stroke();
}

function drawScreenOverlay(ctx, state, quality) {
  const overlay = buildOverlay();
  if (overlay) {
    ctx.globalAlpha = quality.scanlines === false ? 0.72 : 1;
    ctx.drawImage(overlay, 0, 0);
    ctx.globalAlpha = 1;
  }
  const damage = clamp01(state?.screenDamage ?? state?.damageFlash ?? state?.player?.damageFlash ?? 0);
  if (damage > 0) {
    ctx.fillStyle = `rgba(255,28,57,${damage * 0.18})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.strokeStyle = `rgba(255,74,94,${damage * 0.72})`;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, GAME_WIDTH - 10, GAME_HEIGHT - 10);
  }
  const flash = clamp01(state?.flash);
  if (flash > 0) {
    ctx.fillStyle = `rgba(224,253,255,${flash * 0.16})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }
}

function drawMinimap(ctx, state, assets, cameraView) {
  const x = 1050;
  const y = 548;
  const width = 208;
  const height = 148;
  const innerX = x + 8;
  const innerY = y + 22;
  const innerWidth = width - 16;
  const innerHeight = height - 30;
  ctx.save();
  ctx.fillStyle = "rgba(1,6,9,.92)";
  ctx.strokeStyle = state?.surgeWarning ? "rgba(255,72,94,.9)" : "rgba(98,224,245,.42)";
  ctx.lineWidth = state?.surgeWarning ? 2 : 1;
  roundedRect(ctx, x, y, width, height, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = state?.surgeWarning ? "#ff7185" : "#8aefff";
  ctx.font = "700 9px 'IBM Plex Mono', monospace";
  ctx.fillText(state?.surgeWarning ? "MINIMAP · MASS WAVE" : "MINIMAP · OMEGA", x + 9, y + 14);
  roundedRect(ctx, innerX, innerY, innerWidth, innerHeight, 2);
  ctx.clip();
  ctx.globalAlpha = 0.52;
  if (imageReady(assets?.map)) ctx.drawImage(assets.map, innerX, innerY, innerWidth, innerHeight);
  else {
    ctx.fillStyle = "#071419";
    ctx.fillRect(innerX, innerY, innerWidth, innerHeight);
  }
  ctx.globalAlpha = 1;
  const mapX = (worldX) => innerX + clamp(worldX / GAME_WIDTH, 0, 1) * innerWidth;
  const mapY = (worldY) => innerY + clamp(worldY / GAME_HEIGHT, 0, 1) * innerHeight;
  const enemies = state?.enemies || [];
  ctx.fillStyle = "rgba(255,66,91,.82)";
  const stride = enemies.length > 120 ? 2 : 1;
  for (let index = 0; index < enemies.length; index += stride) {
    const enemy = enemies[index];
    if (!isAlive(enemy)) continue;
    ctx.fillRect(mapX(enemy.x) - 1, mapY(enemy.y) - 1, enemy.elite ? 3 : 2, enemy.elite ? 3 : 2);
  }
  if (isAlive(state?.boss)) {
    ctx.fillStyle = COLORS.warning;
    ctx.beginPath();
    ctx.arc(mapX(state.boss.x), mapY(state.boss.y), 4, 0, TAU);
    ctx.fill();
  }
  const player = state?.player;
  if (player) {
    ctx.fillStyle = COLORS.white;
    ctx.beginPath();
    ctx.arc(mapX(player.x), mapY(player.y), 3.8, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = COLORS.player;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(mapX(player.x), mapY(player.y), 6.2, 0, TAU);
    ctx.stroke();
  }
  if (cameraView) {
    ctx.strokeStyle = "rgba(194,250,255,.46)";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      mapX(cameraView.left),
      mapY(cameraView.top),
      Math.max(2, innerWidth * (cameraView.right - cameraView.left) / GAME_WIDTH),
      Math.max(2, innerHeight * (cameraView.bottom - cameraView.top) / GAME_HEIGHT),
    );
  }
  ctx.restore();
}

function drawSurgeOverlay(ctx, state, time) {
  const warning = state?.surgeWarning;
  const active = state?.activeSurge;
  if (!warning && !active) return;
  const urgent = Boolean(warning);
  const pulse = 0.55 + Math.sin(time * (urgent ? 14 : 8)) * 0.22;
  ctx.save();
  ctx.strokeStyle = `rgba(255,45,72,${urgent ? pulse : pulse * 0.45})`;
  ctx.lineWidth = urgent ? 10 : 5;
  ctx.strokeRect(5, 5, GAME_WIDTH - 10, GAME_HEIGHT - 10);
  if (urgent) {
    const warning = buildSurgeWarningLayer();
    if (warning) {
      ctx.globalAlpha = pulse;
      ctx.drawImage(warning, 0, 0);
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}

/**
 * Renders the single-arena swarm and boss encounter in logical 1280x720 space.
 * The map bitmap is intentionally drawn 1:1 to the simulation bounds; there are
 * no decorative collision obstacles that could disagree with gameplay pathing.
 */
export function renderSwarm(ctx, state = {}, assets = {}, qualityInput = DEFAULT_QUALITY) {
  if (!ctx) return;
  if (qualityInput !== cachedQualityInput) {
    cachedQualityInput = qualityInput;
    cachedQuality = { ...DEFAULT_QUALITY, ...(qualityInput || {}) };
  }
  const quality = cachedQuality;
  const time = timeOf(state);
  crowdRenderPressure = quality?.id === "performance"
    || finite(state?.enemies?.length) > 120
    || finite(state?.projectiles?.length) + finite(state?.enemyProjectiles?.length) > 360;
  const shake = finite(state.cameraShake, finite(state.shake));
  const shakeX = shake > 0 ? Math.sin(time * 91) * Math.min(8, shake) : 0;
  const shakeY = shake > 0 ? Math.cos(time * 77) * Math.min(6, shake) : 0;

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ctx.fillStyle = "#020508";
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  const zoom = clamp(finite(state?.camera?.zoom, state?.phase === "boss" ? 1.36 : 1.58), 1, 1.72);
  const halfWidth = GAME_WIDTH / (2 * zoom);
  const halfHeight = GAME_HEIGHT / (2 * zoom);
  const cameraX = clamp(finite(state?.camera?.x, finite(state?.player?.x, GAME_WIDTH * 0.5)), halfWidth, GAME_WIDTH - halfWidth);
  const cameraY = clamp(finite(state?.camera?.y, finite(state?.player?.y, GAME_HEIGHT * 0.5)), halfHeight, GAME_HEIGHT - halfHeight);
  viewportScratch.left = cameraX - halfWidth;
  viewportScratch.top = cameraY - halfHeight;
  viewportScratch.right = cameraX + halfWidth;
  viewportScratch.bottom = cameraY + halfHeight;
  activeViewport = viewportScratch;
  ctx.translate(GAME_WIDTH * 0.5 + shakeX, GAME_HEIGHT * 0.5 + shakeY);
  ctx.scale(zoom, zoom);
  ctx.translate(-cameraX, -cameraY);

  drawMap(ctx, assets);
  drawArenaBoundary(ctx);
  drawWorldDecals(ctx, state, time, quality);
  drawPickups(ctx, state, quality, time);
  drawTelegraphs(ctx, state, time, assets);
  drawAllies(ctx, state, assets, quality);
  drawEnemies(ctx, state, assets, quality);
  drawBoss(ctx, state, assets, quality);
  drawPlayer(ctx, state, assets, quality);
  drawOrbitLinks(ctx, state, time, assets, quality);
  drawProjectiles(ctx, state, assets, quality);
  drawChainsAndBeams(ctx, state, time, assets);
  drawParticles(ctx, state, quality);
  drawTypedCombatVfx(ctx, state, time, assets, quality);
  drawShockwaves(ctx, state, time, assets);
  drawDamageTexts(ctx, state, quality);
  drawAim(ctx, state, time);
  ctx.restore();
  const cameraView = activeViewport;
  activeViewport = null;
  ctx.save();
  drawMinimap(ctx, state, assets, cameraView);
  drawSurgeOverlay(ctx, state, time);
  drawScreenOverlay(ctx, state, quality);
  ctx.restore();
}

export { GAME_HEIGHT, GAME_WIDTH };

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
let shadowTexture = null;
const glowTextures = Object.create(null);
const tintedSprites = new WeakMap();
let activeViewport = null;

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

function arraysFrom(source, keys) {
  const result = [];
  const seen = new Set();
  for (const key of keys) {
    const collection = source?.[key];
    if (!Array.isArray(collection) || seen.has(collection)) continue;
    seen.add(collection);
    result.push({ key, collection });
  }
  return result;
}

function isAlive(entity) {
  return Boolean(entity) && !entity.dead && entity.active !== false && finite(entity.hp, 1) > 0;
}

function visible(entity, padding = 100) {
  const x = finite(entity?.x, -10000);
  const y = finite(entity?.y, -10000);
  const radius = finite(entity?.radius, finite(entity?.size, 30) * 0.5);
  const view = activeViewport || { left: 0, top: 0, right: GAME_WIDTH, bottom: GAME_HEIGHT };
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
  const width = clamp(finite(image.naturalWidth, finite(image.width, 128)), 1, 512);
  const height = clamp(finite(image.naturalHeight, finite(image.height, 128)), 1, 512);
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

function drawFallbackActor(ctx, x, y, size, color, angle, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(size * 0.46, 0);
  ctx.lineTo(-size * 0.35, size * 0.32);
  ctx.lineTo(-size * 0.24, 0);
  ctx.lineTo(-size * 0.35, -size * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawActorSprite(ctx, image, entity, size, state, quality, options = {}) {
  if (!visible(entity, size)) return;
  const time = timeOf(state);
  const seed = entitySeed(entity, options.seed || 0);
  const speed = Math.hypot(finite(entity.vx), finite(entity.vy));
  const motion = clamp01(speed / finite(options.motionSpeed, 190));
  const bob = Math.sin(time * 11 + seed * 0.73) * (0.55 + motion * 1.25);
  const angle = spriteAngle(entity, finite(options.angle));
  const recoil = clamp(finite(entity.recoil, finite(entity.recoilTime) * 7), 0, 8);
  const x = finite(entity.x) - Math.cos(angle) * recoil;
  const y = finite(entity.y) - Math.sin(angle) * recoil + bob;
  const alpha = clamp01(options.alpha ?? entity.alpha ?? 1);
  const scalePulse = 1 + Math.sin(time * 13 + seed) * motion * 0.018;
  const fallbackColor = options.fallback || COLORS.enemy;

  drawShadow(ctx, finite(entity.x), finite(entity.y), size, (options.shadowAlpha ?? 0.35) * alpha, quality);
  if (!imageReady(image)) {
    drawFallbackActor(ctx, x, y, size, fallbackColor, angle, alpha);
    return;
  }

  const flash = finite(entity.hitFlash, finite(entity.flash));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scalePulse, 1 / scalePulse);
  if (options.flipY) ctx.scale(1, -1);
  // Preserve raster detail during sustained automatic fire: the original image
  // remains fully visible and the cached hit tint is only a restrained overlay.
  ctx.drawImage(image, -size * 0.5, -size * 0.5, size, size);
  if (flash > 0) {
    const tint = getTintedSprite(image, flash > 0.09 ? "white" : "red");
    if (tint) {
      ctx.globalAlpha = alpha * clamp(0.12 + flash * 2.2, 0.12, 0.4);
      ctx.drawImage(tint, -size * 0.5, -size * 0.5, size, size);
    }
  }
  ctx.restore();
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
  ctx.fillStyle = "#020508";
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  if (imageReady(assets?.map)) {
    // The bitmap and simulation share the exact 1280x720 arena coordinate space.
    ctx.drawImage(assets.map, 0, 0, GAME_WIDTH, GAME_HEIGHT);
    return;
  }
  const fallback = buildFallbackMap();
  if (fallback) ctx.drawImage(fallback, 0, 0);
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

function drawCircleTelegraph(ctx, item, time, kind) {
  const x = finite(item.x, finite(item.targetX, GAME_WIDTH * 0.5));
  const y = finite(item.y, finite(item.targetY, GAME_HEIGHT * 0.5));
  const radius = Math.max(12, finite(item.radius, kind === "bomb" ? 76 : 118));
  const progress = telegraphProgress(item);
  const pulse = 1 + Math.sin(time * 11 + x * 0.02) * 0.025;
  ctx.globalAlpha = telegraphAlpha(item);
  ctx.fillStyle = kind === "bomb" ? "rgba(255,71,89,.11)" : "rgba(255,66,94,.09)";
  ctx.beginPath();
  ctx.arc(x, y, radius * pulse, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = kind === "bomb" ? COLORS.warning : COLORS.enemy;
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

function drawSweepTelegraph(ctx, item, time) {
  const x = finite(item.x, finite(item.originX, GAME_WIDTH * 0.5));
  const y = finite(item.y, finite(item.originY, GAME_HEIGHT * 0.5));
  const angle = finite(item.angle, finite(item.rotation));
  const length = Math.max(120, finite(item.length, 920));
  const width = Math.max(16, finite(item.width, 72));
  const progress = telegraphProgress(item);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = telegraphAlpha(item);
  ctx.fillStyle = "rgba(255,48,78,.12)";
  ctx.fillRect(0, -width * 0.5, length, width);
  ctx.strokeStyle = Math.sin(time * 14) > 0 ? COLORS.warning : COLORS.enemy;
  ctx.lineWidth = 2;
  ctx.setLineDash([17, 11]);
  ctx.strokeRect(0, -width * 0.5, length, width);
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255,205,96,.48)";
  ctx.fillRect(0, -2, length * progress, 4);
  ctx.restore();
}

function drawRingTelegraph(ctx, item, time) {
  const x = finite(item.x, finite(item.targetX, GAME_WIDTH * 0.5));
  const y = finite(item.y, finite(item.targetY, GAME_HEIGHT * 0.5));
  const outer = Math.max(24, finite(item.radius, finite(item.outerRadius, 230)));
  const thickness = Math.max(8, finite(item.thickness, finite(item.width, 36)));
  const progress = telegraphProgress(item);
  const current = item.contracting === false ? outer * progress : outer * (1 - progress * 0.72);
  ctx.globalAlpha = telegraphAlpha(item);
  ctx.strokeStyle = COLORS.warning;
  ctx.lineWidth = thickness;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(thickness, current), 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = COLORS.enemy;
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 9]);
  ctx.beginPath();
  ctx.arc(x, y, outer + Math.sin(time * 8) * 3, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

function drawChargeTelegraph(ctx, item, time) {
  const x = finite(item.x, finite(item.originX, GAME_WIDTH * 0.5));
  const y = finite(item.y, finite(item.originY, GAME_HEIGHT * 0.5));
  const targetX = finite(item.targetX, x + Math.cos(finite(item.angle)) * 700);
  const targetY = finite(item.targetY, y + Math.sin(finite(item.angle)) * 700);
  const angle = Math.atan2(targetY - y, targetX - x);
  const length = Math.hypot(targetX - x, targetY - y);
  const width = Math.max(34, finite(item.width, 92));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = telegraphAlpha(item);
  ctx.fillStyle = "rgba(255,52,82,.13)";
  ctx.fillRect(0, -width * 0.5, length, width);
  ctx.strokeStyle = Math.sin(time * 16) > 0 ? COLORS.warning : COLORS.enemy;
  ctx.lineWidth = 3.5;
  ctx.setLineDash([22, 10]);
  ctx.strokeRect(0, -width * 0.5, length, width);
  ctx.setLineDash([]);
  ctx.globalAlpha = Math.min(1, telegraphAlpha(item) + 0.18);
  ctx.strokeStyle = "rgba(255,232,171,.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -width * 0.5);
  ctx.lineTo(length, -width * 0.5);
  ctx.moveTo(0, width * 0.5);
  ctx.lineTo(length, width * 0.5);
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

function drawTelegraph(ctx, item, time) {
  if (!item || item.active === false || item.expired) return;
  const type = String(item.type ?? item.kind ?? item.pattern ?? "circle").toLowerCase();
  if (Array.isArray(item.targets) && item.targets.length > 0 && (type.includes("bomb") || type.includes("radial"))) {
    for (const target of item.targets) {
      const targetX = Array.isArray(target) ? target[0] : target?.x;
      const targetY = Array.isArray(target) ? target[1] : target?.y;
      drawCircleTelegraph(ctx, { ...item, targets: null, x: targetX, y: targetY }, time, type.includes("bomb") ? "bomb" : "radial");
    }
    return;
  }
  if (type.includes("sweep") || type.includes("laser") || type.includes("beam")) drawSweepTelegraph(ctx, item, time);
  else if (type.includes("ring") || type.includes("nova")) drawRingTelegraph(ctx, item, time);
  else if (type.includes("charge") || type.includes("rush") || type.includes("dash")) drawChargeTelegraph(ctx, item, time);
  else drawCircleTelegraph(ctx, item, time, type.includes("bomb") || type.includes("meteor") ? "bomb" : "radial");
}

function inferredBossTelegraph(boss, state) {
  const chargeSource = boss?.chargeTelegraph ?? (typeof boss?.charge === "object" ? boss.charge : null);
  const patternSource = chargeSource
    ?? boss?.pattern
    ?? boss?.attackPattern
    ?? state?.bossPattern
    ?? ((boss?.charging || boss?.isCharging || boss?.chargeActive) ? { type: "charge" } : null);
  if (!patternSource || patternSource === "idle") return null;
  const pattern = typeof patternSource === "object" ? patternSource : { type: patternSource };
  return {
    ...pattern,
    x: finite(pattern.x, finite(boss.x, GAME_WIDTH * 0.5)),
    y: finite(pattern.y, finite(boss.y, GAME_HEIGHT * 0.5)),
    targetX: finite(pattern.targetX, finite(pattern.target?.x, finite(boss.chargeTargetX, finite(boss.targetX, finite(state?.player?.x, GAME_WIDTH * 0.5))))),
    targetY: finite(pattern.targetY, finite(pattern.target?.y, finite(boss.chargeTargetY, finite(boss.targetY, finite(state?.player?.y, GAME_HEIGHT * 0.5))))),
    angle: finite(pattern.angle, finite(boss.patternAngle, finite(boss.angle))),
    radius: finite(pattern.radius, finite(boss.patternRadius, 160)),
    width: finite(pattern.width, finite(boss.patternWidth, 78)),
    progress: finite(pattern.progress, finite(boss.chargeProgress, finite(boss.patternProgress, finite(boss.attackProgress, 0.45)))),
  };
}

function drawTelegraphs(ctx, state, time) {
  let explicitCount = 0;
  for (const { collection } of arraysFrom(state, ["telegraphs", "warnings", "attackZones", "dangerZones", "airstrikes"])) {
    for (const item of collection) {
      drawTelegraph(ctx, item, time);
      explicitCount += 1;
    }
  }
  const boss = state?.boss;
  for (const { collection } of arraysFrom(boss, ["telegraphs", "warnings", "attackZones"])) {
    for (const item of collection) {
      drawTelegraph(ctx, item, time);
      explicitCount += 1;
    }
  }
  if (explicitCount === 0 && isAlive(boss)) {
    const inferred = inferredBossTelegraph(boss, state);
    if (inferred) drawTelegraph(ctx, inferred, time);
  }
}

function pickupPosition(pickup) {
  return { x: finite(pickup?.x), y: finite(pickup?.y) };
}

function drawPickups(ctx, state, quality, time) {
  let index = 0;
  for (const { collection } of arraysFrom(state, ["pickups", "xpPickups", "xpOrbs", "gems", "loot"])) {
    for (const pickup of collection) {
      if (!pickup || pickup.collected || pickup.active === false || !visible(pickup, 32)) continue;
      const { x, y } = pickupPosition(pickup);
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
  const drawn = new Set();
  let visibleIndex = 0;
  for (const { collection } of arraysFrom(state, ["enemies", "mobs", "enemyUnits", "units"])) {
    for (const enemy of collection) {
      if (!isAlive(enemy) || enemy === state?.boss || enemy.player || enemy.team === "player" || drawn.has(enemy)) continue;
      drawn.add(enemy);
      if (!visible(enemy, 80)) continue;
      const size = enemySize(enemy);
      const elite = Boolean(enemy.elite || enemy.isElite);
      if (elite && quality.detailScale > 0.55) drawGlow(ctx, "amber", finite(enemy.x), finite(enemy.y), size * 1.65, 0.34);
      drawActorSprite(ctx, enemyImage(enemy, assets), enemy, size, state, quality, {
        seed: visibleIndex,
        shadowAlpha: visibleIndex % 2 === 0 ? 0.26 : 0.2,
        fallback: elite ? COLORS.elite : COLORS.enemy,
      });
      if (elite || finite(enemy.hp, 1) < finite(enemy.maxHp, 1) * 0.76) {
        drawHealthBar(ctx, enemy, Math.max(28, size * 0.68), size * 0.62, elite ? COLORS.elite : COLORS.enemy);
      }
      visibleIndex += 1;
    }
  }
}

function allyImage(ally, assets) {
  const key = String(ally?.sprite ?? ally?.type ?? ally?.kind ?? "drone").toLowerCase();
  if (key.includes("sentry") || key.includes("turret")) return assets?.sentry;
  if (key.includes("emp") || key.includes("pylon")) return assets?.emp;
  if (key.includes("suppress") || key.includes("gunner")) return assets?.suppressor;
  if (key.includes("player") || key.includes("merc") || key.includes("wingman")) return assets?.player;
  return assets?.drone;
}

function allySize(ally) {
  const key = String(ally?.type ?? ally?.kind ?? "").toLowerCase();
  const fallback = key.includes("sentry") ? 52 : key.includes("emp") ? 56 : key.includes("drone") ? 38 : 50;
  return clamp(finite(ally?.size, finite(ally?.radius) * 2 || fallback), 28, 78);
}

function drawAllies(ctx, state, assets, quality) {
  const drawn = new Set();
  for (const { collection } of arraysFrom(state, ["deployables", "towers", "allies", "companions", "drones"])) {
    for (const ally of collection) {
      if (!isAlive(ally) || drawn.has(ally) || !visible(ally, 80)) continue;
      drawn.add(ally);
      const size = allySize(ally);
      drawActorSprite(ctx, allyImage(ally, assets), ally, size, state, quality, {
        shadowAlpha: 0.31,
        fallback: COLORS.ally,
      });
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
  if (!isAlive(boss) || !visible(boss, 280)) return;
  const time = timeOf(state);
  const size = clamp(finite(boss.size, finite(boss.radius) * 2 || 224), 170, 300);
  const entrance = clamp01(boss.entrance ?? boss.entranceProgress ?? state.bossEntranceProgress ?? 1);
  const phase = Math.max(1, finite(boss.stage, finite(boss.phase, finite(state.bossPhase, 1))));
  const phaseFlash = clamp01(boss.phaseFlash ?? boss.transitionFlash ?? state.phaseFlash ?? 0);
  const x = finite(boss.x, GAME_WIDTH * 0.72);
  const y = finite(boss.y, GAME_HEIGHT * 0.5);
  const coreExposed = bossCoreIsExposed(boss, state);

  drawGlow(ctx, phase >= 3 ? "amber" : "red", x, y, size * (1.55 + phaseFlash * 0.3), 0.62 + phaseFlash * 0.25);
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
  const proxy = { ...boss, x, y, alpha: clamp01(entrance * 1.35) };
  drawActorSprite(ctx, assets?.boss, proxy, size * entranceScale, state, quality, {
    shadowAlpha: 0.6,
    fallback: COLORS.boss,
  });
  drawBossCore(ctx, boss, state, x, y, size * entranceScale, time);
  drawHealthBar(ctx, boss, Math.min(160, size * 0.72), size * 0.62, phase >= 3 ? COLORS.warning : COLORS.boss, true);
}

function drawPlayer(ctx, state, assets, quality) {
  const player = state?.player ?? state?.hero;
  if (!player || player.dead || !visible(player, 110)) return;
  const time = timeOf(state);
  const size = clamp(finite(player.size, finite(player.radius) * 2 || 64), 48, 84);
  const speed = Math.hypot(finite(player.vx), finite(player.vy));
  const dash = clamp01(player.dashTime ?? player.dashRemaining ?? player.dashTimer ?? (speed > 410 ? 1 : 0));
  const velocityAngle = speed > 1 ? Math.atan2(finite(player.vy), finite(player.vx)) : spriteAngle(player);

  if (dash > 0 || player.dashing) {
    const distance = clamp(speed * 0.07, 14, 42);
    for (let index = 3; index >= 1; index -= 1) {
      const ghost = {
        ...player,
        x: finite(player.x) - Math.cos(velocityAngle) * distance * index,
        y: finite(player.y) - Math.sin(velocityAngle) * distance * index,
        alpha: (0.09 + index * 0.04) * (dash || 1),
        hitFlash: 0,
      };
      drawActorSprite(ctx, assets?.player, ghost, size * (1 - index * 0.035), state, { ...quality, shadows: false }, {
        shadowAlpha: 0,
        fallback: COLORS.player,
      });
    }
  }

  drawGlow(ctx, "cyan", finite(player.x), finite(player.y), size * 1.7, 0.38 + dash * 0.35);
  drawActorSprite(ctx, assets?.player, player, size, state, quality, {
    shadowAlpha: 0.48,
    fallback: COLORS.player,
  });
  drawHealthBar(ctx, player, Math.max(48, size * 0.82), size * 0.66, COLORS.player, true);
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

function isEnemyProjectile(projectile, collectionKey = "") {
  if (collectionKey.toLowerCase().includes("enemy") || collectionKey.toLowerCase().includes("boss")) return true;
  const team = String(projectile?.team ?? projectile?.owner ?? projectile?.source ?? "").toLowerCase();
  return team.includes("enemy") || team.includes("boss") || projectile?.hostile === true;
}

function drawBullet(ctx, projectile, enemy, quality) {
  if (!visible(projectile, 60)) return;
  const x = finite(projectile.x);
  const y = finite(projectile.y);
  const radius = clamp(finite(projectile.radius, finite(projectile.size, 5)), 2, 18);
  const angle = projectileAngle(projectile);
  const color = projectile.color || (enemy ? COLORS.enemy : COLORS.player);
  const type = String(projectile.type ?? projectile.kind ?? "bullet").toLowerCase();

  if (type.includes("orbit")) {
    if (quality.detailScale > 0.45) drawGlow(ctx, enemy ? "red" : "cyan", x, y, radius * 7, 0.45);
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
    if (quality.detailScale > 0.5) drawGlow(ctx, enemy ? "red" : "amber", x, y, radius * 6, 0.38);
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

function drawProjectiles(ctx, state, quality) {
  const drawn = new Set();
  for (const { key, collection } of arraysFrom(state, [
    "projectiles", "bullets", "playerBullets", "enemyProjectiles", "enemyBullets", "bossBullets", "rockets", "orbitals", "orbs",
  ])) {
    for (const projectile of collection) {
      if (!projectile || projectile.dead || projectile.active === false || drawn.has(projectile)) continue;
      drawn.add(projectile);
      drawBullet(ctx, projectile, isEnemyProjectile(projectile, key), quality);
    }
  }
}

function drawBeam(ctx, beam, enemy, time) {
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

function drawChainsAndBeams(ctx, state, time) {
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
      } else drawBeam(ctx, beam, isEnemyProjectile(beam, key), time);
    }
  }
}

function drawOrbitLinks(ctx, state, time) {
  const orbitals = state?.orbitals;
  if (!Array.isArray(orbitals) || orbitals.length < 2) return;
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
  const particles = [];
  for (const { collection } of arraysFrom(state, ["particles", "effects", "debris", "sparks"])) {
    for (const particle of collection) if (particle && visible(particle, 50)) particles.push(particle);
  }
  const cap = Math.max(24, Math.floor(finite(quality.maxParticles, 190) * finite(quality.particleScale, 1)));
  const start = Math.max(0, particles.length - cap);
  for (let index = start; index < particles.length; index += 1) {
    const particle = particles[index];
    const alpha = particleRatio(particle);
    const size = clamp(finite(particle.size, finite(particle.radius, 3)), 1, 24);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particleColor(particle);
    if (particle.line || particle.streak || Math.hypot(finite(particle.vx), finite(particle.vy)) > 260) {
      const vx = finite(particle.vx);
      const vy = finite(particle.vy);
      const magnitude = Math.max(1, Math.hypot(vx, vy));
      ctx.strokeStyle = particleColor(particle);
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
  }
  ctx.globalAlpha = 1;
}

function drawShockwaves(ctx, state, time) {
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
  const texts = [];
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
    const gradient = ctx.createLinearGradient(0, 0, 0, 110);
    gradient.addColorStop(0, `rgba(255,25,55,${pulse * 0.24})`);
    gradient.addColorStop(1, "rgba(255,25,55,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_WIDTH, 120);
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
  const quality = { ...DEFAULT_QUALITY, ...(qualityInput || {}) };
  const time = timeOf(state);
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
  activeViewport = { left: cameraX - halfWidth, top: cameraY - halfHeight, right: cameraX + halfWidth, bottom: cameraY + halfHeight };
  ctx.translate(GAME_WIDTH * 0.5 + shakeX, GAME_HEIGHT * 0.5 + shakeY);
  ctx.scale(zoom, zoom);
  ctx.translate(-cameraX, -cameraY);

  drawMap(ctx, assets);
  drawArenaBoundary(ctx);
  drawPickups(ctx, state, quality, time);
  drawTelegraphs(ctx, state, time);
  drawAllies(ctx, state, assets, quality);
  drawEnemies(ctx, state, assets, quality);
  drawBoss(ctx, state, assets, quality);
  drawPlayer(ctx, state, assets, quality);
  drawOrbitLinks(ctx, state, time);
  drawProjectiles(ctx, state, quality);
  drawChainsAndBeams(ctx, state, time);
  drawParticles(ctx, state, quality);
  drawShockwaves(ctx, state, time);
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

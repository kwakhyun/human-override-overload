const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const TAU = Math.PI * 2;

const CYAN = "#67efff";
const CYAN_SOFT = "rgba(103,239,255,.42)";
const RED = "#ff405f";
const RED_SOFT = "rgba(255,64,95,.42)";
const AMBER = "#ffc45b";
const AMBER_SOFT = "rgba(255,196,91,.42)";
const WHITE = "#edfaff";

const DEFAULT_QUALITY = Object.freeze({
  filters: true,
  shadows: true,
  scanlines: true,
  maxParticles: 180,
  particleScale: 1,
  detailScale: 1,
});

const OBSERVER_PODS = Object.freeze([
  Object.freeze({ key: "hunter", x: 112, y: 109, size: 50, angle: 0.18 }),
  Object.freeze({ key: "suppressor", x: 174, y: 101, size: 54, angle: 0.08 }),
  Object.freeze({ key: "brute", x: 242, y: 104, size: 60, angle: -0.08 }),
  Object.freeze({ key: "drone", x: 1147, y: 104, size: 43, angle: -0.2 }),
]);

let arenaLayer = null;
let overlayLayer = null;
let shadowTexture = null;
const glowTextures = Object.create(null);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function clamp01(value) {
  return clamp(value, 0, 1);
}

function finite(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function gameTime(state) {
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

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
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

function drawPanel(ctx, x, y, width, height, accent = "rgba(103,239,255,.16)") {
  ctx.fillStyle = "rgba(5,13,19,.84)";
  ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "rgba(165,214,224,.13)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
  ctx.fillStyle = accent;
  ctx.fillRect(x + 1, y + 1, 3, height - 2);
  ctx.fillStyle = "rgba(199,235,242,.2)";
  ctx.fillRect(x + 9, y + 8, 2, 2);
  ctx.fillRect(x + width - 11, y + 8, 2, 2);
  ctx.fillRect(x + 9, y + height - 10, 2, 2);
  ctx.fillRect(x + width - 11, y + height - 10, 2, 2);
}

function buildArenaLayer() {
  if (arenaLayer) return arenaLayer;
  arenaLayer = createLayer(GAME_WIDTH, GAME_HEIGHT);
  const ctx = arenaLayer?.getContext("2d", { alpha: false });
  if (!ctx) return null;

  ctx.fillStyle = "#02060a";
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  const floorGlow = ctx.createRadialGradient(640, 360, 60, 640, 360, 720);
  floorGlow.addColorStop(0, "#102a32");
  floorGlow.addColorStop(0.44, "#081820");
  floorGlow.addColorStop(1, "#02070b");
  ctx.fillStyle = floorGlow;
  ctx.fillRect(24, 24, GAME_WIDTH - 48, GAME_HEIGHT - 48);

  ctx.fillStyle = "rgba(8,25,31,.9)";
  ctx.beginPath();
  ctx.moveTo(25, 211);
  ctx.lineTo(232, 75);
  ctx.lineTo(1045, 75);
  ctx.lineTo(1255, 211);
  ctx.lineTo(1255, 507);
  ctx.lineTo(1047, 645);
  ctx.lineTo(230, 645);
  ctx.lineTo(25, 507);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(117,215,232,.13)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.strokeStyle = "rgba(111,207,224,.075)";
  ctx.lineWidth = 1;
  for (let x = 45; x <= 1235; x += 58) {
    ctx.beginPath();
    ctx.moveTo(x, 92);
    ctx.lineTo(x, 628);
    ctx.stroke();
  }
  for (let y = 94; y <= 628; y += 53) {
    ctx.beginPath();
    ctx.moveTo(42, y);
    ctx.lineTo(1238, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(170,233,241,.08)";
  ctx.lineWidth = 2;
  for (let x = 79; x < 1230; x += 174) {
    ctx.strokeRect(x, 130, 126, 124);
    ctx.strokeRect(x + 34, 468, 126, 124);
  }

  ctx.fillStyle = "rgba(1,5,8,.62)";
  ctx.beginPath();
  ctx.ellipse(919, 360, 246, 236, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,69,94,.22)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(919, 360, 222, 212, 0, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,69,94,.1)";
  ctx.lineWidth = 15;
  ctx.setLineDash([44, 22]);
  ctx.beginPath();
  ctx.ellipse(919, 360, 201, 191, 0, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = "rgba(102,234,255,.12)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(330, 360, 126, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(330, 360, 103, 0, TAU);
  ctx.stroke();

  for (let index = 0; index < 22; index += 1) {
    const angle = (index / 22) * TAU;
    const x = 919 + Math.cos(angle) * 232;
    const y = 360 + Math.sin(angle) * 221;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = index % 2 ? "rgba(255,159,57,.11)" : "rgba(9,14,18,.88)";
    ctx.fillRect(-16, -5, 32, 10);
    ctx.restore();
  }

  drawPanel(ctx, 55, 45, 222, 82, "rgba(103,239,255,.16)");
  drawPanel(ctx, 1019, 45, 206, 82, "rgba(255,64,95,.16)");
  drawPanel(ctx, 62, 598, 288, 63, "rgba(103,239,255,.12)");
  drawPanel(ctx, 932, 598, 286, 63, "rgba(255,196,91,.12)");

  ctx.fillStyle = "rgba(207,245,250,.28)";
  ctx.font = "600 9px 'IBM Plex Mono', monospace";
  ctx.textAlign = "left";
  ctx.fillText("ARCHIVED COMBAT MODELS", 72, 63);
  ctx.fillText("PLAYER INFERENCE NODE", 79, 618);
  ctx.fillText("PREDICTION EXECUTION CORE", 1037, 63);
  ctx.fillText("ADVERSARIAL TEST CHAMBER // LIVE", 950, 618);
  ctx.fillStyle = "rgba(103,239,255,.22)";
  ctx.fillRect(79, 630, 180, 2);
  ctx.fillStyle = "rgba(255,196,91,.24)";
  ctx.fillRect(950, 630, 210, 2);

  ctx.strokeStyle = "rgba(88,218,239,.25)";
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 14, GAME_WIDTH - 28, GAME_HEIGHT - 28);
  ctx.strokeStyle = "rgba(255,255,255,.06)";
  ctx.lineWidth = 1;
  ctx.strokeRect(21, 21, GAME_WIDTH - 42, GAME_HEIGHT - 42);
  return arenaLayer;
}

function buildOverlayLayer() {
  if (overlayLayer) return overlayLayer;
  overlayLayer = createLayer(GAME_WIDTH, GAME_HEIGHT);
  const ctx = overlayLayer?.getContext("2d");
  if (!ctx) return null;
  const vignette = ctx.createRadialGradient(640, 350, 180, 640, 360, 765);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(0.66, "rgba(0,0,0,.035)");
  vignette.addColorStop(1, "rgba(0,0,0,.57)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ctx.fillStyle = "rgba(130,235,247,.028)";
  for (let y = 0; y < GAME_HEIGHT; y += 4) ctx.fillRect(0, y, GAME_WIDTH, 1);
  return overlayLayer;
}

function getShadowTexture() {
  if (shadowTexture) return shadowTexture;
  shadowTexture = createLayer(160, 88);
  const ctx = shadowTexture?.getContext("2d");
  if (!ctx) return null;
  const gradient = ctx.createRadialGradient(80, 43, 4, 80, 43, 70);
  gradient.addColorStop(0, "rgba(0,0,0,.75)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 160, 88);
  return shadowTexture;
}

function getGlowTexture(kind) {
  if (glowTextures[kind]) return glowTextures[kind];
  const colors = {
    cyan: "rgba(72,228,255,.52)",
    red: "rgba(255,42,75,.58)",
    amber: "rgba(255,185,68,.58)",
    white: "rgba(238,255,255,.55)",
  };
  const layer = createLayer(192, 192);
  const ctx = layer?.getContext("2d");
  if (!ctx) return null;
  const gradient = ctx.createRadialGradient(96, 96, 3, 96, 96, 92);
  gradient.addColorStop(0, colors[kind] || colors.white);
  gradient.addColorStop(0.22, (colors[kind] || colors.white).replace(/\.[0-9]+\)$/, ".24)"));
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 192, 192);
  glowTextures[kind] = layer;
  return layer;
}

function imageReady(image) {
  if (!image) return false;
  if (typeof image.complete === "boolean" && !image.complete) return false;
  return Boolean(image.naturalWidth || image.videoWidth || image.width);
}

function drawGlow(ctx, kind, x, y, size, alpha = 1) {
  const texture = getGlowTexture(kind);
  if (!texture || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = "lighter";
  ctx.drawImage(texture, x - size / 2, y - size / 2, size, size);
  ctx.restore();
}

function drawShadow(ctx, x, y, width, alpha, quality) {
  if (quality.shadows === false || alpha <= 0) return;
  const texture = getShadowTexture();
  if (!texture) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(texture, x - width / 2, y - width * 0.13, width, width * 0.55);
  ctx.restore();
}

function drawFallback(ctx, x, y, size, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.32, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.72)";
  ctx.lineWidth = Math.max(1, size * 0.025);
  ctx.beginPath();
  ctx.arc(x, y, size * 0.22, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

function drawAsset(ctx, image, x, y, size, angle, alpha, fallbackColor, hitFlash = 0) {
  if (!imageReady(image)) {
    drawFallback(ctx, x, y, size, fallbackColor, alpha);
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(finite(angle));
  ctx.globalAlpha = alpha;
  if (hitFlash > 0) ctx.globalCompositeOperation = "lighter";
  ctx.drawImage(image, -size / 2, -size / 2, size, size);
  if (hitFlash > 0) {
    ctx.globalAlpha = Math.min(0.46, hitFlash * 0.46);
    ctx.globalCompositeOperation = "screen";
    ctx.drawImage(image, -size / 2, -size / 2, size, size);
  }
  ctx.restore();
}

function drawObserverDeck(ctx, assets, time, quality) {
  const detail = finite(quality.detailScale, 1);
  if (detail < 0.55) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(55, 66, 222, 61);
  ctx.clip();
  for (let index = 0; index < OBSERVER_PODS.length; index += 1) {
    const pod = OBSERVER_PODS[index];
    const bob = Math.sin(time * 1.7 + index * 1.8) * 1.5;
    drawAsset(ctx, assets?.[pod.key], pod.x, pod.y + bob, pod.size, pod.angle, 0.18, "#2d6671");
  }
  ctx.restore();

  const drone = OBSERVER_PODS[3];
  drawAsset(ctx, assets?.drone, drone.x, drone.y + Math.sin(time * 2.3) * 3, drone.size, time * 0.32, 0.28, RED);
  ctx.strokeStyle = "rgba(255,72,98,.16)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(drone.x, drone.y, 28 + Math.sin(time * 2) * 2, 0, TAU);
  ctx.stroke();
}

function drawBar(ctx, x, y, width, height, ratio, color, border = "rgba(210,245,250,.25)") {
  const safeRatio = clamp01(ratio);
  roundedRect(ctx, x, y, width, height, height / 2);
  ctx.fillStyle = "rgba(0,4,8,.84)";
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.stroke();
  if (safeRatio <= 0) return;
  roundedRect(ctx, x + 2, y + 2, Math.max(2, (width - 4) * safeRatio), height - 4, Math.max(1, height / 2 - 2));
  ctx.fillStyle = color;
  ctx.fill();
}

function drawPlayer(ctx, state, assets, quality, time) {
  const player = state.player;
  if (!player) return;
  const x = finite(player.x, 260);
  const y = finite(player.y, 360);
  const vx = finite(player.vx);
  const vy = finite(player.vy);
  const speed = Math.hypot(vx, vy);
  const moving = clamp01(speed / 220);
  const size = finite(player.size, finite(player.radius, 28) * 2.65);
  const angle = finite(player.angle, Math.atan2(vy, vx));
  const bob = Math.sin(time * 14) * moving * 1.8;
  const dash = Math.max(0, finite(player.dashRemaining, finite(player.dash, 0)));

  if (dash > 0) {
    const trailX = speed > 1 ? vx / speed : Math.cos(angle);
    const trailY = speed > 1 ? vy / speed : Math.sin(angle);
    for (let index = 3; index >= 1; index -= 1) {
      drawAsset(
        ctx,
        assets?.player,
        x - trailX * index * 17,
        y - trailY * index * 17 + bob,
        size,
        angle,
        0.065 + index * 0.035,
        CYAN,
      );
    }
    drawGlow(ctx, "cyan", x, y, size * 2.4, 0.28);
  }

  drawShadow(ctx, x, y, size * 1.1, 0.7, quality);
  if (quality.filters !== false) drawGlow(ctx, "cyan", x, y, size * 1.75, 0.18);
  drawAsset(ctx, assets?.player, x, y + bob, size, angle, 1, CYAN, finite(player.hitFlash));

  const maxHp = Math.max(1, finite(player.maxHp, 100));
  const hp = clamp(finite(player.hp, maxHp), 0, maxHp);
  drawBar(ctx, x - 42, y - size * 0.61 - 16, 84, 8, hp / maxHp, hp / maxHp < 0.3 ? RED : CYAN);
  ctx.fillStyle = "rgba(235,252,255,.68)";
  ctx.font = "700 8px 'IBM Plex Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText("SUBJECT 01", x, y - size * 0.61 - 21);
}

function predictionTarget(prediction) {
  if (!prediction) return null;
  const ghost = prediction.ghost;
  const x = finite(prediction.targetX, finite(prediction.x, finite(ghost?.x, Number.NaN)));
  const y = finite(prediction.targetY, finite(prediction.y, finite(ghost?.y, Number.NaN)));
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
}

function predictionConfidence(prediction) {
  if (!prediction) return 0;
  if (Number.isFinite(prediction.confidence)) return clamp01(prediction.confidence);
  const probabilities = prediction.probabilities;
  if (!probabilities?.length) return 0;
  let maximum = 0;
  for (let index = 0; index < probabilities.length; index += 1) maximum = Math.max(maximum, finite(probabilities[index]));
  return clamp01(maximum);
}

function drawGhostAt(ctx, assets, x, y, angle, alpha, confidence, time, label) {
  drawGlow(ctx, "amber", x, y, 132, 0.18 + confidence * 0.2);
  drawAsset(ctx, assets?.player, x, y, 76, angle, alpha, AMBER);
  ctx.save();
  ctx.strokeStyle = `rgba(255,196,91,${0.38 + confidence * 0.5})`;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 7]);
  ctx.beginPath();
  ctx.arc(x, y, 43 + Math.sin(time * 8) * 3, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = AMBER;
  ctx.font = "800 9px 'IBM Plex Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(label, x, y - 53);
  ctx.restore();
}

function drawPrediction(ctx, state, assets, quality, time) {
  const prediction = state.prediction;
  const target = predictionTarget(prediction);
  if (!prediction || !target || !state.player) return;
  if (prediction.resolved && state.ghost?.active === false) return;
  const confidence = predictionConfidence(prediction);
  const angle = finite(prediction.angle, finite(state.player.angle));
  const px = finite(state.player.x);
  const py = finite(state.player.y);

  ctx.save();
  ctx.strokeStyle = `rgba(255,196,91,${0.15 + confidence * 0.34})`;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 8]);
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  const branches = prediction.branches || prediction.ghosts || state.ghost?.branches;
  if (branches?.length && finite(quality.detailScale, 1) >= 0.7) {
    const limit = Math.min(3, branches.length);
    for (let index = 0; index < limit; index += 1) {
      const ghost = branches[index];
      if (!Number.isFinite(ghost?.x) || !Number.isFinite(ghost?.y)) continue;
      drawGhostAt(ctx, assets, ghost.x, ghost.y, finite(ghost.angle, angle), 0.1, confidence * 0.65, time + index, `BRANCH ${index + 1}`);
    }
  }

  const timeToImpact = clamp(finite(prediction.timeToImpact, 0.8), 0, 0.8);

  drawGhostAt(
    ctx,
    assets,
    target.x,
    target.y,
    angle,
    0.18 + confidence * 0.2,
    confidence,
    time,
    `t + ${timeToImpact.toFixed(1)}s  //  ${Math.round(confidence * 100)}%`,
  );
}

function drawPredictionLock(ctx, state, time) {
  const prediction = state.prediction;
  const target = predictionTarget(prediction);
  const boss = state.boss;
  if (!boss || !target || prediction?.resolved) return;
  const confidence = predictionConfidence(prediction);
  const locked = Boolean(prediction.locked || prediction.isLocked || prediction.status === "locked" || confidence >= 0.52);
  if (!locked) return;
  const bx = finite(boss.x, 920);
  const by = finite(boss.y, 360);
  const pulse = 0.5 + Math.sin(time * 13) * 0.5;

  ctx.save();
  ctx.strokeStyle = `rgba(255,72,96,${0.32 + confidence * 0.4})`;
  ctx.lineWidth = 2 + confidence * 2;
  ctx.setLineDash([14, 9]);
  ctx.lineDashOffset = -time * 44;
  ctx.beginPath();
  ctx.moveTo(bx, by);
  ctx.lineTo(target.x, target.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = `rgba(255,196,91,${0.34 + pulse * 0.36})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(target.x, target.y, 54 - pulse * 8, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(target.x - 19, target.y);
  ctx.lineTo(target.x + 19, target.y);
  ctx.moveTo(target.x, target.y - 19);
  ctx.lineTo(target.x, target.y + 19);
  ctx.stroke();
  ctx.restore();
}

function drawBoss(ctx, state, assets, quality, time) {
  const boss = state.boss;
  if (!boss) return;
  const x = finite(boss.x, 920);
  const y = finite(boss.y, 360);
  const angle = finite(boss.angle);
  const size = finite(boss.size, finite(boss.radius, 92) * 2.62);
  const weak = Math.max(0, finite(boss.weakRemaining, finite(boss.weakness, finite(boss.weaknessRemaining, 0))));
  const weakRatio = clamp01(weak / Math.max(1, finite(boss.weakDuration, 2.5)));
  const coreColor = weak > 0 ? AMBER : RED;
  const glowKind = weak > 0 ? "amber" : "red";
  const pulse = 1 + Math.sin(time * (weak > 0 ? 12 : 5.5)) * 0.045;

  drawShadow(ctx, x, y, size * 1.05, 0.85, quality);
  drawGlow(ctx, glowKind, x, y, size * 1.52, weak > 0 ? 0.56 : 0.29);
  if (quality.filters !== false) drawGlow(ctx, glowKind, x, y, size * 2.05, weak > 0 ? 0.22 : 0.1);
  drawAsset(ctx, assets?.boss, x, y, size * pulse, angle, 1, RED, finite(boss.hitFlash));

  ctx.save();
  ctx.strokeStyle = weak > 0 ? "rgba(255,224,122,.9)" : "rgba(255,66,94,.56)";
  ctx.lineWidth = weak > 0 ? 5 : 2;
  ctx.setLineDash(weak > 0 ? [17, 8] : [7, 12]);
  ctx.lineDashOffset = time * (weak > 0 ? 54 : -22);
  ctx.beginPath();
  ctx.arc(x, y, size * 0.45 + Math.sin(time * 4) * 4, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = coreColor;
  ctx.globalAlpha = weak > 0 ? 0.7 + Math.sin(time * 16) * 0.2 : 0.42;
  ctx.beginPath();
  ctx.arc(x, y, size * (weak > 0 ? 0.075 : 0.052), 0, TAU);
  ctx.fill();
  ctx.restore();

  const maxHp = Math.max(1, finite(boss.maxHp, 1000));
  const hp = clamp(finite(boss.hp, maxHp), 0, maxHp);
  drawBar(ctx, x - 100, y - size * 0.55 - 17, 200, 10, hp / maxHp, weak > 0 ? AMBER : RED, weak > 0 ? AMBER_SOFT : RED_SOFT);
  ctx.fillStyle = weak > 0 ? AMBER : "rgba(255,230,234,.72)";
  ctx.font = "800 9px 'IBM Plex Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(weak > 0 ? `CORE EXPOSED  ${weak.toFixed(1)}s` : `WRONG ENGINE  //  STAGE ${finite(boss.stage, 1)}`, x, y - size * 0.55 - 23);
  if (weakRatio > 0) {
    ctx.strokeStyle = AMBER;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.35, -Math.PI / 2, -Math.PI / 2 + TAU * weakRatio);
    ctx.stroke();
  }
}

function forEachItem(collection, callback) {
  if (!collection) return;
  if (Array.isArray(collection)) {
    for (let index = 0; index < collection.length; index += 1) callback(collection[index], index);
  } else if (typeof collection === "object") callback(collection, 0);
}

function itemAlpha(item, fallback = 1) {
  if (Number.isFinite(item?.alpha)) return clamp01(item.alpha);
  if (Number.isFinite(item?.life) && Number.isFinite(item?.maxLife) && item.maxLife > 0) return clamp01(item.life / item.maxLife);
  if (Number.isFinite(item?.ttl) && Number.isFinite(item?.duration) && item.duration > 0) return clamp01(item.ttl / item.duration);
  return fallback;
}

function drawTelegraph(ctx, item, time) {
  if (!item) return;
  const x = finite(item.x, finite(item.x2, finite(item.targetX, 640)));
  const y = finite(item.y, finite(item.y2, finite(item.targetY, 360)));
  const originX = finite(item.x1, finite(item.originX, finite(item.fromX, x)));
  const originY = finite(item.y1, finite(item.originY, finite(item.fromY, y)));
  const targetX = finite(item.targetX, finite(item.x2, finite(item.toX, x)));
  const targetY = finite(item.targetY, finite(item.y2, finite(item.toY, y)));
  const radius = Math.max(8, finite(item.radius, finite(item.r, 70)));
  const alpha = itemAlpha(item, 0.66);
  const urgency = 1 - alpha;
  const kind = item.shape || item.type || "ring";
  const color = item.color || RED;
  ctx.save();
  ctx.globalAlpha = (0.55 + urgency * 0.4) * (0.82 + Math.sin(time * 11) * 0.12);
  ctx.strokeStyle = color;
  ctx.fillStyle = item.fill || "rgba(255,42,72,.1)";
  ctx.lineWidth = Math.max(1, finite(item.lineWidth, finite(item.width, 3)));
  ctx.setLineDash([12, 8]);
  ctx.lineDashOffset = -time * 34;
  if (kind === "beam" || kind === "line" || kind === "laser") {
    const dx = targetX - originX;
    const dy = targetY - originY;
    const length = Math.hypot(dx, dy) || 1;
    const endX = originX + (dx / length) * 1500;
    const endY = originY + (dy / length) * 1500;
    ctx.save();
    ctx.globalAlpha = 0.07 + urgency * 0.12;
    ctx.strokeStyle = RED;
    ctx.lineWidth = 112;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 50 - urgency * 13, 0, TAU);
    ctx.stroke();
  } else if (kind === "bombardment") {
    const impactRadius = finite(item.radius, 104);
    ctx.globalAlpha = 0.14 + urgency * 0.14;
    ctx.beginPath();
    ctx.arc(x, y, impactRadius, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.72 + urgency * 0.25;
    ctx.beginPath();
    ctx.arc(x, y, impactRadius * (0.46 + alpha * 0.54), 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 24, y);
    ctx.lineTo(x + 24, y);
    ctx.moveTo(x, y - 24);
    ctx.lineTo(x, y + 24);
    ctx.stroke();
  } else if (kind === "compression") {
    const horizontal = Math.abs(x - originX) > Math.abs(y - originY);
    const startX = horizontal ? 54 : x;
    const startY = horizontal ? y : 54;
    const endX = horizontal ? 1226 : x;
    const endY = horizontal ? y : 666;
    ctx.save();
    ctx.globalAlpha = 0.08 + urgency * 0.14;
    ctx.strokeStyle = RED;
    ctx.lineWidth = 124;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();
    if (horizontal) {
      ctx.moveTo(startX, y - 62);
      ctx.lineTo(endX, y - 62);
      ctx.moveTo(startX, y + 62);
      ctx.lineTo(endX, y + 62);
    } else {
      ctx.moveTo(x - 62, startY);
      ctx.lineTo(x - 62, endY);
      ctx.moveTo(x + 62, startY);
      ctx.lineTo(x + 62, endY);
    }
    ctx.stroke();
  } else if (kind === "cone" || kind === "sweep") {
    const angle = finite(item.angle, Math.atan2(targetY - y, targetX - x));
    const spread = finite(item.spread, finite(item.arc, 0.62));
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, radius, angle - spread, angle + spread);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - radius * 0.32, y);
    ctx.lineTo(x + radius * 0.32, y);
    ctx.moveTo(x, y - radius * 0.32);
    ctx.lineTo(x, y + radius * 0.32);
    ctx.stroke();
  }
  const branches = item.branches;
  if (branches?.length) {
    const branchLimit = Math.min(3, branches.length);
    for (let index = 0; index < branchLimit; index += 1) {
      const branch = branches[index];
      if (!Number.isFinite(branch?.x) || !Number.isFinite(branch?.y)) continue;
      ctx.beginPath();
      ctx.arc(branch.x, branch.y, 34 - urgency * 8, 0, TAU);
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);
  ctx.restore();
}

function drawTelegraphs(ctx, state, time) {
  forEachItem(state.telegraphs, (item) => drawTelegraph(ctx, item, time));
  if (state.attack?.telegraph) drawTelegraph(ctx, state.attack.telegraph, time);
  if (state.bossAttack?.telegraph) drawTelegraph(ctx, state.bossAttack.telegraph, time);
}

function drawBeam(ctx, beam, time, quality) {
  if (!beam) return;
  const x1 = finite(beam.x1, finite(beam.fromX, finite(beam.x, 0)));
  const y1 = finite(beam.y1, finite(beam.fromY, finite(beam.y, 0)));
  const x2 = finite(beam.x2, finite(beam.toX, finite(beam.targetX, x1)));
  const y2 = finite(beam.y2, finite(beam.toY, finite(beam.targetY, y1)));
  const color = beam.color || (beam.enemy === false ? CYAN : RED);
  const alpha = itemAlpha(beam, 0.9);
  const beamWidth = Math.max(2, finite(beam.width, 3));
  const isCompression = beam.type === "compression";
  ctx.save();
  ctx.globalAlpha = alpha;
  if (quality.filters !== false || isCompression) {
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha * (isCompression ? 0.22 : 0.17);
    ctx.lineWidth = beamWidth * (isCompression ? 2.05 : 2.55);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.globalAlpha = alpha;
  }
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha * (isCompression ? 0.52 : 0.7);
  ctx.lineWidth = beamWidth * (isCompression ? 1.68 : 1.9);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  const jitter = isCompression ? 0 : Math.sin(time * 48 + x1 * 0.01) * Math.min(4, finite(beam.jitter, 2.4));
  ctx.lineTo(x1 + dx * 0.5 + nx * jitter, y1 + dy * 0.5 + ny * jitter);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "rgba(255,244,235,.86)";
  ctx.lineWidth = isCompression ? 3 : 5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  if (isCompression) {
    const edge = beamWidth * 0.84;
    ctx.strokeStyle = RED;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1 + nx * edge, y1 + ny * edge);
    ctx.lineTo(x2 + nx * edge, y2 + ny * edge);
    ctx.moveTo(x1 - nx * edge, y1 - ny * edge);
    ctx.lineTo(x2 - nx * edge, y2 - ny * edge);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBeams(ctx, state, time, quality) {
  forEachItem(state.beams, (beam) => drawBeam(ctx, beam, time, quality));
  forEachItem(state.attacks, (attack) => {
    const type = attack?.type || attack?.shape;
    if (type === "beam" || type === "laser" || type === "line") drawBeam(ctx, attack, time, quality);
    else if (type === "ring" || type === "shockwave" || type === "blast") {
      const alpha = itemAlpha(attack, 0.9);
      const x = finite(attack.x, finite(attack.x1, 640));
      const y = finite(attack.y, finite(attack.y1, 360));
      const radius = Math.max(1, finite(attack.radius, finite(attack.r, 60)));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = attack.color || RED;
      ctx.lineWidth = Math.max(2, finite(attack.width, 6) * alpha);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  });
}

function drawBulletCollection(ctx, collection, enemy, quality) {
  forEachItem(collection, (bullet) => {
    if (!bullet || bullet.dead) return;
    const x = finite(bullet.x);
    const y = finite(bullet.y);
    const vx = finite(bullet.vx);
    const vy = finite(bullet.vy);
    const speed = Math.hypot(vx, vy) || 1;
    const color = bullet.color || (enemy ? RED : CYAN);
    const size = Math.max(2, finite(bullet.radius, finite(bullet.size, enemy ? 5 : 4)));
    const trail = Math.max(9, Math.min(36, speed * 0.045));
    const nx = vx / speed;
    const ny = vy / speed;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    if (quality.filters !== false) {
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = size * 3.2;
      ctx.beginPath();
      ctx.moveTo(x - nx * trail, y - ny * trail);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.lineWidth = size;
    ctx.beginPath();
    ctx.moveTo(x - nx * trail, y - ny * trail);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(1.5, size * 0.35), 0, TAU);
    ctx.fill();
    ctx.restore();
  });
}

function drawProjectiles(ctx, state, quality) {
  drawBulletCollection(ctx, state.bullets || state.projectiles, false, quality);
  drawBulletCollection(ctx, state.enemyBullets || state.enemyShots, true, quality);
}

function drawParticles(ctx, state, quality) {
  const particles = state.particles;
  if (!particles?.length) return;
  const configuredMax = Math.max(0, finite(quality.maxParticles, DEFAULT_QUALITY.maxParticles));
  const particleScale = Math.max(0.3, finite(quality.particleScale, 1));
  const start = Math.max(0, particles.length - configuredMax);
  for (let index = start; index < particles.length; index += 1) {
    const particle = particles[index];
    if (!particle) continue;
    const x = finite(particle.x);
    const y = finite(particle.y);
    const alpha = itemAlpha(particle, 0.8);
    const size = Math.max(1, finite(particle.size, 3) * particleScale);
    const color = particle.color || AMBER;
    const type = particle.type || particle.kind || "spark";
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    if (type === "ring" || type === "shockwave") {
      ctx.lineWidth = Math.max(1, size * alpha);
      ctx.beginPath();
      ctx.arc(x, y, Math.max(size, finite(particle.radius, size * 5)), 0, TAU);
      ctx.stroke();
    } else if (type === "shard" || type === "debris") {
      ctx.translate(x, y);
      ctx.rotate(finite(particle.angle));
      ctx.fillRect(-size * 1.7, -size * 0.38, size * 3.4, size * 0.76);
    } else {
      const vx = finite(particle.vx);
      const vy = finite(particle.vy);
      ctx.lineWidth = Math.max(1, size * 0.7);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - vx * 0.025, y - vy * 0.025);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawModelBreakShockwave(ctx, state) {
  const flash = clamp01(state.flash);
  if (flash <= 0 || !state.boss) return;
  const progress = 1 - flash;
  const bossX = finite(state.boss.x, 920);
  const bossY = finite(state.boss.y, 360);
  ctx.save();
  ctx.globalAlpha = flash * 0.9;
  ctx.strokeStyle = progress < 0.38 ? WHITE : CYAN;
  ctx.lineWidth = 7 - progress * 5;
  ctx.beginPath();
  ctx.arc(bossX, bossY, 28 + progress * 330, 0, TAU);
  ctx.stroke();
  ctx.globalAlpha = flash * 0.38;
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(bossX, bossY, 16 + progress * 255, 0, TAU);
  ctx.stroke();
  const prediction = state.prediction;
  if (prediction?.broken) {
    const ghostX = finite(prediction.ghostX, finite(prediction.targetX, bossX));
    const ghostY = finite(prediction.ghostY, finite(prediction.targetY, bossY));
    ctx.globalAlpha = flash * 0.72;
    ctx.strokeStyle = CYAN;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ghostX, ghostY, 14 + progress * 135, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTexts(ctx, state) {
  const texts = state.texts;
  if (!texts?.length) return;
  ctx.save();
  ctx.textAlign = "center";
  for (let index = 0; index < texts.length; index += 1) {
    const item = texts[index];
    if (!item) continue;
    ctx.globalAlpha = itemAlpha(item, 1);
    ctx.fillStyle = item.color || WHITE;
    const scaledSize = 15 * Math.max(0.55, finite(item.scale, 1));
    ctx.font = `${item.bold === false ? 600 : 800} ${Math.max(9, finite(item.size, scaledSize))}px 'IBM Plex Mono', monospace`;
    ctx.fillText(String(item.text ?? item.label ?? ""), finite(item.x, 640), finite(item.y, 360));
  }
  ctx.restore();
}

function aimPoint(state) {
  const player = state.player;
  const aim = state.aim || state.pointer || state.cursor || player?.aim;
  const x = finite(aim?.x, finite(state.aimX, finite(player?.aimX, Number.NaN)));
  const y = finite(aim?.y, finite(state.aimY, finite(player?.aimY, Number.NaN)));
  if (Number.isFinite(x) && Number.isFinite(y)) return { x, y };
  if (!player) return null;
  const angle = finite(player.angle);
  return { x: finite(player.x) + Math.cos(angle) * 155, y: finite(player.y) + Math.sin(angle) * 155 };
}

function drawAim(ctx, state, time) {
  const aim = aimPoint(state);
  if (!aim || !state.player) return;
  const px = finite(state.player.x);
  const py = finite(state.player.y);
  const pulse = 1 + Math.sin(time * 9) * 0.12;
  ctx.save();
  ctx.strokeStyle = "rgba(103,239,255,.14)";
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 8]);
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(aim.x, aim.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.translate(aim.x, aim.y);
  ctx.strokeStyle = CYAN;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(0, 0, 11 * pulse, 0, TAU);
  ctx.moveTo(-21, 0);
  ctx.lineTo(-7, 0);
  ctx.moveTo(21, 0);
  ctx.lineTo(7, 0);
  ctx.moveTo(0, -21);
  ctx.lineTo(0, -7);
  ctx.moveTo(0, 21);
  ctx.lineTo(0, 7);
  ctx.stroke();
  ctx.fillStyle = WHITE;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

function drawBossHud(ctx, state) {
  const boss = state.boss;
  if (!boss) return;
  const maxHp = Math.max(1, finite(boss.maxHp, 1000));
  const hp = clamp(finite(boss.hp, maxHp), 0, maxHp);
  const weak = Math.max(0, finite(boss.weakRemaining, finite(boss.weakness, 0)));
  const width = 520;
  const x = (GAME_WIDTH - width) / 2;
  const y = 34;
  ctx.save();
  ctx.fillStyle = "rgba(2,6,10,.84)";
  roundedRect(ctx, x - 18, y - 15, width + 36, 48, 7);
  ctx.fill();
  ctx.strokeStyle = weak > 0 ? AMBER_SOFT : RED_SOFT;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = WHITE;
  ctx.font = "800 10px 'IBM Plex Mono', monospace";
  ctx.textAlign = "left";
  ctx.fillText("PREDICTIVE COMBAT MODEL // WRONG ENGINE", x, y - 2);
  ctx.textAlign = "right";
  ctx.fillStyle = weak > 0 ? AMBER : "rgba(255,222,228,.7)";
  ctx.fillText(weak > 0 ? "MODEL BROKEN" : `${Math.ceil(hp).toLocaleString()} HP`, x + width, y - 2);
  drawBar(ctx, x, y + 7, width, 10, hp / maxHp, weak > 0 ? AMBER : RED, weak > 0 ? AMBER_SOFT : RED_SOFT);
  ctx.restore();
}

function drawScreenEffects(ctx, state, quality) {
  if (quality.scanlines !== false) {
    const overlay = buildOverlayLayer();
    if (overlay) ctx.drawImage(overlay, 0, 0);
  }
  const flash = state.screenFlash ?? state.flash ?? state.dangerPulse ?? 0;
  const rawAmount = typeof flash === "number" ? clamp01(flash) : itemAlpha(flash, 0);
  const amount = quality.reducedMotion ? rawAmount * 0.22 : rawAmount;
  if (amount > 0) {
    const isModelBreakFlash = typeof state.flash === "number" && state.flash > 0 && state.screenFlash == null;
    const color = typeof flash === "object" && flash?.color
      ? flash.color
      : isModelBreakFlash ? "218,252,255" : "255,54,82";
    ctx.save();
    ctx.globalAlpha = amount * 0.19;
    ctx.fillStyle = String(color).startsWith("#") || String(color).startsWith("rgb") ? color : `rgb(${color})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    ctx.restore();
  }
}

export function renderAdversarial(ctx, state, assets = {}, qualityInput = DEFAULT_QUALITY) {
  if (!ctx || !state) return;
  const quality = qualityInput || DEFAULT_QUALITY;
  const time = quality.reducedMotion ? 0 : gameTime(state);
  const shake = quality.reducedMotion ? 0 : Math.max(0, finite(state.shake, finite(state.cameraShake, 0)));
  const shakeX = shake > 0 ? Math.sin(time * 83.17) * shake * 3.2 : 0;
  const shakeY = shake > 0 ? Math.cos(time * 67.31) * shake * 2.4 : 0;

  ctx.save();
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  ctx.translate(shakeX, shakeY);
  const background = buildArenaLayer();
  if (background) ctx.drawImage(background, 0, 0);
  else {
    ctx.fillStyle = "#040b10";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  drawObserverDeck(ctx, assets, time, quality);
  drawPrediction(ctx, state, assets, quality, time);
  drawTelegraphs(ctx, state, time);
  drawPredictionLock(ctx, state, time);
  drawBeams(ctx, state, time, quality);
  drawBoss(ctx, state, assets, quality, time);
  drawPlayer(ctx, state, assets, quality, time);
  drawProjectiles(ctx, state, quality);
  drawModelBreakShockwave(ctx, state);
  drawParticles(ctx, state, quality);
  drawTexts(ctx, state);
  drawAim(ctx, state, time);
  ctx.restore();

  drawScreenEffects(ctx, state, quality);
}

export { GAME_HEIGHT, GAME_WIDTH };

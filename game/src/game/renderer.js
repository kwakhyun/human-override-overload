import {
  GAME_HEIGHT,
  GAME_WIDTH,
  getStageConfig,
} from "./engine.js";

function drawPolyline(context, points, color, width, dash = []) {
  if (!points || points.length < 2) return;
  context.save();
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) {
    context.lineTo(points[index].x, points[index].y);
  }
  context.strokeStyle = color;
  context.lineWidth = width;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.setLineDash(dash);
  context.shadowColor = color;
  context.shadowBlur = 9;
  context.stroke();
  context.restore();
}

function drawPulse(context, position, color, elapsed, radius = 18) {
  const wave = (Math.sin(elapsed * 4) + 1) / 2;
  context.save();
  context.translate(position.x, position.y);
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.globalAlpha = 0.82 - wave * 0.36;
  context.shadowColor = color;
  context.shadowBlur = 12;
  context.beginPath();
  context.arc(0, 0, radius + wave * 11, 0, Math.PI * 2);
  context.stroke();
  context.globalAlpha = 0.85;
  context.beginPath();
  context.arc(0, 0, radius * 0.58, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function drawTarget(context, runtime, roundIndex) {
  const stage = getStageConfig(roundIndex);
  if (!runtime.coreTaken) {
    drawPulse(context, stage.core, stage.accent, runtime.runElapsed, 20);
    context.save();
    context.translate(stage.core.x, stage.core.y - 37);
    context.rotate(Math.PI / 4);
    context.fillStyle = "rgba(8, 22, 31, 0.9)";
    context.strokeStyle = stage.accent;
    context.lineWidth = 2;
    context.fillRect(-7, -7, 14, 14);
    context.strokeRect(-7, -7, 14, 14);
    context.restore();
  }

  if (roundIndex === 2 && runtime.coreTaken) {
    drawPulse(context, stage.extraction, "#56ffbd", runtime.runElapsed, 24);
    context.save();
    context.translate(stage.extraction.x, stage.extraction.y);
    context.fillStyle = "rgba(86, 255, 189, 0.14)";
    context.beginPath();
    context.arc(0, 0, 31, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}

function drawScanCone(context, drone) {
  const range = 168;
  const spread = 0.48;
  context.save();
  context.translate(drone.x, drone.y);
  context.rotate(drone.facing);
  context.beginPath();
  context.moveTo(7, 0);
  context.arc(0, 0, range, -spread, spread);
  context.closePath();
  context.fillStyle = "rgba(255, 38, 63, 0.13)";
  context.fill();
  context.strokeStyle = "rgba(255, 72, 88, 0.38)";
  context.lineWidth = 1.2;
  context.setLineDash([8, 8]);
  context.stroke();
  context.restore();
}

function traceNavigationArea(context, area) {
  if (area.type === "rect") {
    context.rect(area.x, area.y, area.width, area.height);
    return;
  }
  if (area.type === "ring") {
    context.arc(area.cx, area.cy, area.outerRadius, 0, Math.PI * 2);
    context.moveTo(area.cx + area.innerRadius, area.cy);
    context.arc(area.cx, area.cy, area.innerRadius, 0, Math.PI * 2, true);
    return;
  }
  if (area.type === "segment") {
    context.moveTo(area.start.x, area.start.y);
    context.lineTo(area.end.x, area.end.y);
  }
}

function drawMiniMap(context, runtime, stage) {
  const panel = { x: 18, y: 170, width: 190, height: 116 };
  const map = { x: panel.x + 9, y: panel.y + 22, width: panel.width - 18, height: panel.height - 31 };
  const scaleX = map.width / stage.worldWidth;
  const scaleY = map.height / stage.worldHeight;

  context.save();
  context.fillStyle = "rgba(2, 8, 12, 0.9)";
  context.strokeStyle = "rgba(74, 220, 238, 0.32)";
  context.lineWidth = 1;
  context.fillRect(panel.x, panel.y, panel.width, panel.height);
  context.strokeRect(panel.x + 0.5, panel.y + 0.5, panel.width - 1, panel.height - 1);
  context.fillStyle = "rgba(143, 195, 205, 0.68)";
  context.font = "7px IBM Plex Mono, monospace";
  context.fillText("TACTICAL MAP / LIVE NAVMESH", panel.x + 9, panel.y + 14);

  context.save();
  context.beginPath();
  context.rect(map.x, map.y, map.width, map.height);
  context.clip();
  context.translate(map.x, map.y);
  context.scale(scaleX, scaleY);
  for (const area of stage.walkableAreas) {
    context.beginPath();
    traceNavigationArea(context, area);
    if (area.type === "segment") {
      context.strokeStyle = "rgba(87, 164, 175, 0.46)";
      context.lineWidth = area.width;
      context.lineCap = "round";
      context.stroke();
    } else {
      context.fillStyle = "rgba(87, 164, 175, 0.46)";
      context.fill("evenodd");
    }
  }
  context.lineWidth = 9;
  context.strokeStyle = "rgba(255, 255, 255, 0.5)";
  context.strokeRect(runtime.camera.x, runtime.camera.y, GAME_WIDTH, GAME_HEIGHT);
  context.fillStyle = stage.accent;
  context.beginPath();
  context.arc(stage.core.x, stage.core.y, 22, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#4ef3ff";
  context.beginPath();
  context.arc(runtime.player.x, runtime.player.y, 26, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ff4058";
  for (const enemy of [...runtime.drones, ...(runtime.enforcers ?? [])]) {
    context.beginPath();
    context.arc(enemy.x, enemy.y, 16, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
  context.restore();
}

function drawScreenVignette(context, runtime) {
  const gradient = context.createRadialGradient(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    170,
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    600,
  );
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(1, runtime.seenBy > 0 ? "rgba(80, 0, 9, 0.36)" : "rgba(0, 4, 7, 0.54)");
  context.save();
  context.fillStyle = gradient;
  context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  context.restore();
}

function drawSprite(context, image, position, angle, size, glowColor, opacity = 1, hover = 0) {
  if (!image?.complete || image.naturalWidth === 0) return;
  context.save();
  context.translate(position.x, position.y + hover);
  context.rotate(angle + Math.PI / 2);
  context.globalAlpha = opacity;
  context.shadowColor = glowColor;
  context.shadowBlur = 13;
  context.drawImage(image, -size / 2, -size / 2, size, size);
  context.restore();
}

function drawEnforcerFrame(context, image, enforcer, elapsed) {
  if (!image?.complete || image.naturalWidth === 0) return;
  const sourceWidth = image.naturalWidth / 4;
  const sourceHeight = image.naturalHeight / 4;
  const row = getPlayerDirectionRow(enforcer.facing);
  const column = enforcer.firePulse > 0.13 ? 2 : enforcer.visible ? 1 : Math.floor(elapsed * 2) % 2 === 0 ? 0 : 3;
  const size = 61;
  drawGroundingShadow(context, enforcer, enforcer.facing, 0.86);
  context.save();
  context.translate(enforcer.x, enforcer.y + Math.sin(elapsed * 4 + enforcer.x) * 0.7);
  context.shadowColor = enforcer.firePulse > 0 ? "#ff324e" : "rgba(255, 45, 69, 0.6)";
  context.shadowBlur = enforcer.firePulse > 0 ? 20 : 9;
  context.drawImage(
    image,
    column * sourceWidth,
    row * sourceHeight,
    sourceWidth,
    sourceHeight,
    -size / 2,
    -size / 2,
    size,
    size,
  );
  context.restore();

  context.save();
  context.translate(enforcer.x, enforcer.y - 34);
  context.fillStyle = "rgba(0, 0, 0, 0.7)";
  context.fillRect(-18, 0, 36, 3);
  context.fillStyle = "#ff4058";
  context.fillRect(-18, 0, 36 * Math.max(0, enforcer.hp / enforcer.maxHp), 3);
  context.restore();
}

function drawProjectiles(context, projectiles, enemy = false) {
  for (const projectile of projectiles) {
    const angle = Math.atan2(projectile.velocityY, projectile.velocityX);
    const length = enemy ? 10 : projectile.piercing ? 22 : 13;
    const color = enemy ? "#ff334f" : projectile.color;
    context.save();
    context.translate(projectile.x, projectile.y);
    context.rotate(angle);
    context.strokeStyle = color;
    context.lineWidth = enemy ? 3 : projectile.size;
    context.lineCap = "round";
    context.shadowColor = color;
    context.shadowBlur = 14;
    context.beginPath();
    context.moveTo(-length, 0);
    context.lineTo(length * 0.4, 0);
    context.stroke();
    context.restore();
  }
}

const PLAYER_ANIMATIONS = {
  idle: { fps: 4.5, size: 54 },
  run: { fps: 10.5, size: 58 },
  dash: { fps: 15, size: 63 },
  alert: { fps: 11, size: 59 },
};

export function resolvePlayerAnimationState(runtime) {
  if (runtime.hitPulse > 0) return "alert";
  if (runtime.dashRemaining > 0) return "dash";
  if (runtime.actualSpeed > 10) return "run";
  return "idle";
}

export function getPlayerDirectionRow(angle) {
  const quarterTurn = Math.PI / 2;
  const rawRow = Math.round((angle + quarterTurn) / quarterTurn);
  return ((rawRow % 4) + 4) % 4;
}

function drawGroundingShadow(context, position, angle, intensity = 1) {
  context.save();
  context.translate(position.x, position.y + 8);
  context.rotate(angle);
  context.scale(1, 0.5);
  context.globalAlpha = 0.3 * intensity;
  context.fillStyle = "#00060a";
  context.filter = "blur(3px)";
  context.beginPath();
  context.arc(0, 0, 18, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawPlayerFrame(
  context,
  spriteSheets,
  position,
  angle,
  animationState,
  animationElapsed,
  glowColor,
  opacity = 1,
  frameOverride,
) {
  const image = spriteSheets?.[animationState] ?? spriteSheets?.idle;
  if (!image?.complete || image.naturalWidth === 0) return;
  const animation = PLAYER_ANIMATIONS[animationState] ?? PLAYER_ANIMATIONS.idle;
  const frame = frameOverride ?? Math.floor(animationElapsed * animation.fps) % 4;
  const sourceWidth = image.naturalWidth / 4;
  const sourceHeight = image.naturalHeight / 4;
  const directionRow = getPlayerDirectionRow(angle);
  const destinationWidth = animation.size;
  const destinationHeight = animation.size;
  const idleBreath = animationState === "idle" ? Math.sin(animationElapsed * Math.PI * 2) * 0.7 : 0;
  const runBob = animationState === "run" ? Math.sin(animationElapsed * Math.PI * animation.fps) * 1.2 : 0;

  context.save();
  context.translate(position.x, position.y + idleBreath + runBob);
  context.globalAlpha = opacity;
  context.shadowColor = glowColor;
  context.shadowBlur = animationState === "dash" ? 22 : 13;
  if (animationState === "dash") {
    context.scale(1, 0.92);
  }
  context.drawImage(
    image,
    frame * sourceWidth,
    directionRow * sourceHeight,
    sourceWidth,
    sourceHeight,
    -destinationWidth / 2,
    -destinationHeight / 2,
    destinationWidth,
    destinationHeight,
  );
  context.restore();
}

function drawDashAfterimages(context, runtime, playerSprites) {
  for (const afterimage of runtime.afterimages) {
    const progress = afterimage.life / afterimage.maxLife;
    drawPlayerFrame(
      context,
      playerSprites,
      afterimage,
      afterimage.facing,
      "dash",
      0,
      "#30efff",
      progress * 0.2,
      afterimage.frame,
    );
  }
}

function drawTraceHeat(context, trace) {
  if (trace.length < 2) return;
  const recent = trace.slice(-150);
  drawPolyline(context, recent, "rgba(57, 235, 255, 0.76)", 2.2, [7, 8]);

  context.save();
  for (let index = 0; index < recent.length; index += 8) {
    const point = recent[index];
    const intensity = 0.06 + (index / recent.length) * 0.08;
    context.fillStyle = `rgba(45, 236, 255, ${intensity})`;
    context.beginPath();
    context.arc(point.x, point.y, 13, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

export function renderGame(context, runtime, options) {
  const { assets, phase, prediction, roundIndex } = options;
  const stage = getStageConfig(roundIndex);
  context.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  context.fillStyle = "#010305";
  context.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  context.save();
  context.translate(-runtime.camera.x, -runtime.camera.y);
  const mapImage = assets.maps?.[stage.id];
  if (mapImage?.complete && mapImage.naturalWidth > 0) {
    context.drawImage(mapImage, 0, 0, stage.worldWidth, stage.worldHeight);
  }

  if (roundIndex > 0 && prediction?.side) {
    drawPolyline(
      context,
      stage.routePaths[prediction.side],
      "rgba(255, 44, 67, 0.64)",
      2.6,
      [10, 9],
    );
  }

  drawTraceHeat(context, runtime.trace);
  drawTarget(context, runtime, roundIndex);

  for (const drone of runtime.drones) {
    drawScanCone(context, drone);
  }

  for (const enforcer of runtime.enforcers ?? []) {
    if (enforcer.visible) {
      context.save();
      context.strokeStyle = "rgba(255, 52, 77, 0.16)";
      context.setLineDash([5, 9]);
      context.beginPath();
      context.moveTo(enforcer.x, enforcer.y);
      context.lineTo(runtime.player.x, runtime.player.y);
      context.stroke();
      context.restore();
    }
  }

  if (runtime.decoy) {
    drawPulse(context, runtime.decoy, "#ffb347", runtime.runElapsed, 15);
    drawPlayerFrame(
      context,
      assets.playerSprites,
      runtime.decoy,
      runtime.facing,
      "idle",
      runtime.runElapsed * 1.7,
      "#ff9f43",
      0.58,
    );
  }

  for (const drone of runtime.drones) {
    const hover = Math.sin(runtime.runElapsed * 3.2 + drone.definition.phase * 9) * 2.1;
    drawGroundingShadow(context, { x: drone.x, y: drone.y + 4 }, drone.facing, 0.7);
    drawSprite(context, assets.drone, drone, drone.facing, 55, "#ff263f", runtime.empRemaining > 0 ? 0.48 : 1, hover);
  }


  for (const enforcer of runtime.enforcers ?? []) {
    drawEnforcerFrame(context, assets.enforcer, enforcer, runtime.runElapsed);
  }

  drawProjectiles(context, runtime.enemyProjectiles ?? [], true);
  drawProjectiles(context, runtime.playerProjectiles ?? [], false);

  drawDashAfterimages(context, runtime, assets.playerSprites);
  drawGroundingShadow(context, runtime.player, runtime.facing, runtime.dashRemaining > 0 ? 0.55 : 1);
  drawPlayerFrame(
    context,
    assets.playerSprites,
    runtime.player,
    runtime.facing,
    runtime.animationState ?? resolvePlayerAnimationState(runtime),
    runtime.animationElapsed ?? runtime.runElapsed,
    runtime.seenBy > 0 ? "#ff4257" : "#31efff",
  );

  if (runtime.shieldRemaining > 0) {
    context.save();
    context.translate(runtime.player.x, runtime.player.y);
    context.strokeStyle = "rgba(78, 243, 255, 0.9)";
    context.fillStyle = "rgba(78, 243, 255, 0.08)";
    context.lineWidth = 2;
    context.shadowColor = "#4ef3ff";
    context.shadowBlur = 17;
    context.beginPath();
    context.arc(0, 0, 31 + Math.sin(runtime.runElapsed * 8) * 1.7, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.restore();
  }

  if (runtime.empRemaining > 0) {
    const progress = 1 - runtime.empRemaining / 3;
    context.save();
    context.translate(runtime.player.x, runtime.player.y);
    context.strokeStyle = `rgba(160, 126, 255, ${Math.max(0, 0.7 - progress * 0.6)})`;
    context.lineWidth = 3;
    context.shadowColor = "#9f72ff";
    context.shadowBlur = 18;
    context.beginPath();
    context.arc(0, 0, 35 + progress * 260, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }

  if (runtime.seenBy > 0 && phase === "playing") {
    context.save();
    context.translate(runtime.player.x, runtime.player.y);
    context.strokeStyle = "rgba(255, 47, 72, 0.9)";
    context.lineWidth = 2;
    context.setLineDash([3, 5]);
    context.beginPath();
    context.arc(0, 0, 35 + Math.sin(runtime.runElapsed * 10) * 4, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }

  context.restore();
  drawScreenVignette(context, runtime);
  drawMiniMap(context, runtime, stage);
}

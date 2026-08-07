import { GAME_HEIGHT, GAME_WIDTH } from "./data.js";

const TAU = Math.PI * 2;

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawShadow(ctx, x, y, radius, alpha = 0.35) {
  const gradient = ctx.createRadialGradient(x, y, 2, x, y, radius);
  gradient.addColorStop(0, `rgba(0, 0, 0, ${alpha})`);
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(x, y + 6, radius, radius * 0.48, 0, 0, TAU);
  ctx.fill();
}

function drawSprite(ctx, image, entity, size, options = {}) {
  if (!image) return;
  const speed = Math.hypot(entity.vx || 0, entity.vy || 0);
  const motion = Math.min(1, speed / 170);
  const bob = Math.sin((options.time || 0) * 13 + (options.seed || 0)) * motion * 2;
  const recoil = options.recoil || 0;
  drawShadow(ctx, entity.x, entity.y, size * 0.34, options.shadowAlpha ?? 0.38);
  ctx.save();
  ctx.translate(entity.x - Math.cos(entity.angle) * recoil, entity.y + bob - Math.sin(entity.angle) * recoil);
  ctx.rotate(entity.angle || 0);
  const squash = 1 + Math.sin((options.time || 0) * 16 + (options.seed || 0)) * motion * 0.025;
  ctx.scale(squash, 1 / squash);
  if (options.filter) ctx.filter = options.filter;
  if (entity.hitFlash > 0) ctx.filter = "brightness(2.7) saturate(0.3)";
  ctx.globalAlpha = options.alpha ?? 1;
  ctx.drawImage(image, -size / 2, -size / 2, size, size);
  ctx.restore();
}

function drawArenaLighting(ctx, state) {
  const pulse = (Math.sin(state.time * 2.1) + 1) / 2;
  const core = ctx.createRadialGradient(GAME_WIDTH / 2, GAME_HEIGHT / 2, 8, GAME_WIDTH / 2, GAME_HEIGHT / 2, 150);
  core.addColorStop(0, `rgba(80, 236, 255, ${0.11 + pulse * 0.04})`);
  core.addColorStop(0.45, "rgba(38, 175, 215, 0.035)");
  core.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  if (state.counter.id !== "sampling") {
    const danger = ctx.createRadialGradient(GAME_WIDTH / 2, GAME_HEIGHT / 2, 190, GAME_WIDTH / 2, GAME_HEIGHT / 2, 670);
    danger.addColorStop(0, "rgba(255, 40, 70, 0)");
    danger.addColorStop(1, `rgba(255, 28, 58, ${0.075 + pulse * 0.025})`);
    ctx.fillStyle = danger;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }
}

function drawGateSignals(ctx, state) {
  const gates = [
    [GAME_WIDTH / 2, 24, 0],
    [GAME_WIDTH - 28, GAME_HEIGHT / 2, Math.PI / 2],
    [GAME_WIDTH / 2, GAME_HEIGHT - 23, Math.PI],
    [28, GAME_HEIGHT / 2, -Math.PI / 2],
  ];
  for (let index = 0; index < gates.length; index += 1) {
    const [x, y, angle] = gates[index];
    const active = Math.floor(state.time / 2 + index) % 4 === 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = active ? 0.9 : 0.36;
    ctx.strokeStyle = state.counter.color;
    ctx.lineWidth = active ? 3 : 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, 25 + Math.sin(state.time * 4 + index) * 4, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    ctx.restore();
  }
}

function drawGems(ctx, state) {
  for (const gem of state.gems) {
    const pulse = 1 + Math.sin(state.time * 8 + gem.x) * 0.16;
    ctx.save();
    ctx.translate(gem.x, gem.y);
    ctx.rotate(state.time * 2.3 + gem.y);
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#53ecff";
    ctx.fillStyle = "#73f3ff";
    ctx.beginPath();
    ctx.moveTo(0, -6 * pulse);
    ctx.lineTo(4.5 * pulse, 0);
    ctx.lineTo(0, 6 * pulse);
    ctx.lineTo(-4.5 * pulse, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function drawTowers(ctx, state) {
  for (const tower of state.towers) {
    const lifeRatio = Math.max(0, tower.life / tower.maxLife);
    drawShadow(ctx, tower.x, tower.y, 25, 0.5);
    ctx.save();
    ctx.translate(tower.x, tower.y);
    if (tower.disabled > 0) ctx.globalAlpha = 0.48 + Math.sin(state.time * 20) * 0.18;
    ctx.rotate(tower.angle || 0);
    ctx.shadowBlur = 14;
    ctx.shadowColor = tower.disabled > 0 ? "#b77cff" : "#ffc857";
    ctx.strokeStyle = tower.disabled > 0 ? "#b77cff" : "#ffc857";
    ctx.fillStyle = "rgba(8, 15, 20, 0.96)";
    ctx.lineWidth = 2;
    if (tower.kind === "sentry") {
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = tower.disabled > 0 ? "#b77cff" : "#ffc857";
      ctx.fillRect(-2, -3, 27, 6);
      ctx.fillRect(-10, -10, 7, 20);
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, TAU);
      ctx.fill();
    } else {
      ctx.beginPath();
      for (let index = 0; index < 6; index += 1) {
        const angle = index * TAU / 6;
        const radius = index % 2 ? 11 : 18;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = tower.disabled > 0 ? "#b77cff" : "#ffc857";
      ctx.beginPath();
      ctx.arc(0, 0, 6 + Math.sin(state.time * 6) * 2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = `rgba(255, 200, 87, ${0.25 + lifeRatio * 0.45})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, 24, -Math.PI / 2, -Math.PI / 2 + TAU * lifeRatio);
    ctx.stroke();
  }
}

function drawOrbitals(ctx, state) {
  const level = state.player.upgrades.orbit;
  if (level) {
    const count = 1 + Math.ceil(level / 2);
    for (let index = 0; index < count; index += 1) {
      const angle = state.time * (1.8 + level * 0.12) + index * TAU / count;
      const x = state.player.x + Math.cos(angle) * (62 + level * 4);
      const y = state.player.y + Math.sin(angle) * (62 + level * 4);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI / 2);
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#ffd166";
      ctx.fillStyle = "#fff3b0";
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(4, 8);
      ctx.lineTo(0, 13);
      ctx.lineTo(-4, 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  const droneLevel = state.player.upgrades.drone;
  if (droneLevel) {
    const angle = -state.time * 1.3;
    const x = state.player.x + Math.cos(angle) * 48;
    const y = state.player.y + Math.sin(angle) * 48;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle - Math.PI / 2);
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#b68cff";
    ctx.fillStyle = "#171027";
    ctx.strokeStyle = "#c69bff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(10, 8);
    ctx.lineTo(0, 5);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawProjectiles(ctx, state) {
  ctx.lineCap = "round";
  for (const projectile of state.projectiles) {
    ctx.strokeStyle = projectile.color;
    ctx.shadowBlur = 11;
    ctx.shadowColor = projectile.color;
    ctx.lineWidth = projectile.source === "tower" ? 2.2 : 3.2;
    ctx.beginPath();
    ctx.moveTo(projectile.x - projectile.vx * 0.025, projectile.y - projectile.vy * 0.025);
    ctx.lineTo(projectile.x, projectile.y);
    ctx.stroke();
  }
  for (const shot of state.enemyShots) {
    ctx.strokeStyle = shot.color;
    ctx.shadowBlur = 14;
    ctx.shadowColor = shot.color;
    ctx.lineWidth = shot.radius * 1.1;
    ctx.beginPath();
    ctx.moveTo(shot.x - shot.vx * 0.04, shot.y - shot.vy * 0.04);
    ctx.lineTo(shot.x, shot.y);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}

function drawBeams(ctx, state) {
  for (const beam of state.beams) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, beam.life * 6);
    ctx.strokeStyle = beam.color;
    ctx.shadowBlur = 16;
    ctx.shadowColor = beam.color;
    ctx.lineWidth = beam.width;
    if (beam.ring) {
      ctx.beginPath();
      ctx.arc(beam.x1, beam.y1, beam.radius * (1 - beam.life / 0.35), 0, TAU);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(beam.x1, beam.y1);
      const dx = beam.x2 - beam.x1;
      const dy = beam.y2 - beam.y1;
      const length = Math.hypot(dx, dy);
      const nx = length ? -dy / length : 0;
      const ny = length ? dx / length : 0;
      for (let index = 1; index < 5; index += 1) {
        const amount = index / 5;
        const jitter = Math.sin(index * 8.3 + beam.life * 100) * 5;
        ctx.lineTo(beam.x1 + dx * amount + nx * jitter, beam.y1 + dy * amount + ny * jitter);
      }
      ctx.lineTo(beam.x2, beam.y2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawEnemies(ctx, state, assets) {
  const sorted = [...state.enemies].sort((a, b) => a.y - b.y);
  for (const enemy of sorted) {
    let size = enemy.type === "hunter" ? 68 : enemy.type === "suppressor" || enemy.type === "hacker" ? 78 : 104;
    if (enemy.elite) size *= 1.16;
    if (enemy.boss) size = 154;
    const image = assets?.[enemy.sprite];
    const filter = enemy.hacker ? "hue-rotate(235deg) saturate(1.4)" : enemy.resist ? "brightness(1.08) contrast(1.1)" : "none";
    drawSprite(ctx, image, enemy, size, { time: state.time, seed: Number(enemy.id.split("-").at(-1)), filter });
    if (enemy.resist) {
      ctx.strokeStyle = "rgba(255, 82, 104, 0.75)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius + 8, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (enemy.elite || enemy.boss || enemy.hp < enemy.maxHp * 0.78) {
      const width = enemy.boss ? 110 : enemy.radius * 2.2;
      const y = enemy.y - enemy.radius - (enemy.boss ? 42 : 18);
      roundedRect(ctx, enemy.x - width / 2, y, width, 5, 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
      ctx.fill();
      roundedRect(ctx, enemy.x - width / 2, y, width * Math.max(0, enemy.hp / enemy.maxHp), 5, 2);
      ctx.fillStyle = enemy.boss ? "#ffb14a" : "#ff465e";
      ctx.fill();
    }
  }
}

function drawPlayer(ctx, state, assets) {
  const player = state.player;
  if (player.dashRemaining > 0) {
    for (let index = 3; index >= 1; index -= 1) {
      drawSprite(ctx, assets?.player, {
        ...player,
        x: player.x - Math.cos(player.angle) * index * 17,
        y: player.y - Math.sin(player.angle) * index * 17,
      }, 82, { time: state.time - index * 0.04, alpha: 0.12 * (4 - index), shadowAlpha: 0 });
    }
  }
  const recoil = Math.max(0, player.fireCooldown > player.stats.fireInterval - 0.08 ? 4 : 0);
  drawSprite(ctx, assets?.player, player, 86, { time: state.time, seed: 1, recoil, filter: player.hitFlash > 0 ? "brightness(2.6)" : "drop-shadow(0 0 7px rgba(74,232,255,.55))" });
  if (player.invulnerability > 0) {
    ctx.strokeStyle = `rgba(99, 238, 255, ${0.25 + Math.sin(state.time * 30) * 0.2})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 29, 0, TAU);
    ctx.stroke();
  }
  if (player.dashCooldown <= 0) {
    ctx.strokeStyle = "rgba(103, 242, 255, 0.48)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 34 + Math.sin(state.time * 4) * 2, 0, TAU);
    ctx.stroke();
  }
}

function drawParticles(ctx, state) {
  for (const particle of state.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.shadowBlur = 9;
    ctx.shadowColor = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * (particle.life / particle.maxLife), 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.font = "600 12px 'IBM Plex Mono', monospace";
  ctx.textAlign = "center";
  for (const text of state.texts) {
    ctx.globalAlpha = Math.max(0, text.life / text.maxLife);
    ctx.fillStyle = text.color;
    ctx.fillText(text.text, text.x, text.y);
  }
  ctx.globalAlpha = 1;
}

function drawScreenEffects(ctx, state) {
  const vignette = ctx.createRadialGradient(GAME_WIDTH / 2, GAME_HEIGHT / 2, 170, GAME_WIDTH / 2, GAME_HEIGHT / 2, 720);
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(0.68, "rgba(0, 0, 0, 0.03)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.62)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  if (state.dangerPulse > 0) {
    ctx.fillStyle = `rgba(255, 30, 60, ${state.dangerPulse * 0.17})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }
  ctx.globalAlpha = 0.055;
  ctx.fillStyle = "#8deeff";
  for (let y = 0; y < GAME_HEIGHT; y += 4) ctx.fillRect(0, y, GAME_WIDTH, 1);
  ctx.globalAlpha = 1;
}

export function renderGame(ctx, state, assets) {
  if (!ctx || !state) return;
  ctx.save();
  const shake = state.shake > 0 ? state.shake * 7 : 0;
  ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  ctx.clearRect(-10, -10, GAME_WIDTH + 20, GAME_HEIGHT + 20);
  if (assets?.arena) ctx.drawImage(assets.arena, 0, 0, GAME_WIDTH, GAME_HEIGHT);
  else {
    ctx.fillStyle = "#071018";
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }
  drawArenaLighting(ctx, state);
  drawGateSignals(ctx, state);
  drawGems(ctx, state);
  drawTowers(ctx, state);
  drawBeams(ctx, state);
  drawEnemies(ctx, state, assets);
  drawOrbitals(ctx, state);
  drawPlayer(ctx, state, assets);
  drawProjectiles(ctx, state);
  drawParticles(ctx, state);
  drawScreenEffects(ctx, state);
  ctx.restore();
}


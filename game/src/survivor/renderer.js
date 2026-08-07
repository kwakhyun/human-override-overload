import { GAME_HEIGHT, GAME_WIDTH, REGIONS } from "./data.js";

const TAU = Math.PI * 2;

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function drawShadow(ctx, x, y, radius, alpha = 0.34) {
  const gradient = ctx.createRadialGradient(x, y + 3, 1, x, y + 3, radius);
  gradient.addColorStop(0, `rgba(0,0,0,${alpha})`);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(x, y + 5, radius, radius * 0.42, 0, 0, TAU);
  ctx.fill();
}

function drawSprite(ctx, image, entity, size, state, options = {}) {
  if (!image) return;
  const speed = Math.hypot(entity.vx || 0, entity.vy || 0);
  const motion = Math.min(1, speed / 150);
  const bob = Math.sin(state.time * 12 + (options.seed || 0)) * motion * 1.2;
  drawShadow(ctx, entity.x, entity.y, size * 0.32, options.shadowAlpha ?? 0.35);
  ctx.save();
  ctx.translate(entity.x, entity.y + bob);
  ctx.rotate(entity.angle || 0);
  const squash = 1 + Math.sin(state.time * 15 + (options.seed || 0)) * motion * 0.018;
  ctx.scale(squash, 1 / squash);
  if (options.filter) ctx.filter = options.filter;
  if (entity.hitFlash > 0) ctx.filter = "brightness(2.8) saturate(.35)";
  ctx.globalAlpha = options.alpha ?? 1;
  ctx.drawImage(image, -size / 2, -size / 2, size, size);
  ctx.restore();
}

function drawGridMotif(ctx, region) {
  ctx.strokeStyle = "rgba(104,226,255,.11)";
  ctx.lineWidth = 1;
  for (let x = region.x + 20; x < region.x + region.width; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, region.y);
    ctx.lineTo(x, region.y + region.height);
    ctx.stroke();
  }
  for (let y = region.y + 18; y < region.y + region.height; y += 36) {
    ctx.beginPath();
    ctx.moveTo(region.x, y);
    ctx.lineTo(region.x + region.width, y);
    ctx.stroke();
  }
}

function drawForgeMotif(ctx, region, time) {
  ctx.fillStyle = "rgba(255,157,52,.085)";
  for (let index = 0; index < 8; index += 1) {
    const x = region.x + 42 + index * 76;
    ctx.fillRect(x, region.y + 38, 25, region.height - 76);
    ctx.fillStyle = index % 2 ? "rgba(255,205,103,.08)" : "rgba(255,105,35,.07)";
  }
  ctx.strokeStyle = `rgba(255,155,48,${0.12 + Math.sin(time * 2) * 0.025})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(region.x + region.width / 2, region.y + region.height / 2, 92, 0, TAU);
  ctx.stroke();
}

function drawArchiveMotif(ctx, region, time) {
  ctx.strokeStyle = "rgba(187,125,255,.12)";
  ctx.lineWidth = 1.2;
  for (let index = 0; index < 11; index += 1) {
    const y = region.y + 25 + index * 29;
    const offset = Math.sin(time * 0.45 + index) * 7;
    ctx.beginPath();
    ctx.moveTo(region.x + 24 + offset, y);
    ctx.lineTo(region.x + region.width - 24 + offset, y);
    ctx.stroke();
  }
  for (let index = 0; index < 5; index += 1) {
    ctx.strokeRect(region.x + 64 + index * 108, region.y + 74, 54, 208);
  }
}

function drawBioMotif(ctx, region, time) {
  ctx.strokeStyle = "rgba(111,242,155,.12)";
  ctx.lineWidth = 2;
  for (let index = 0; index < 7; index += 1) {
    const x = region.x + 56 + index * 86;
    const y = region.y + region.height / 2 + Math.sin(time + index) * 7;
    ctx.beginPath();
    ctx.arc(x, y, 26 + (index % 3) * 9, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, TAU);
    ctx.stroke();
  }
}

function drawRegionGround(ctx, state, region) {
  const gradient = ctx.createRadialGradient(
    region.x + region.width / 2,
    region.y + region.height / 2,
    25,
    region.x + region.width / 2,
    region.y + region.height / 2,
    region.width * 0.62,
  );
  gradient.addColorStop(0, region.glow);
  gradient.addColorStop(0.55, region.dark);
  gradient.addColorStop(1, "#03070b");
  ctx.fillStyle = gradient;
  ctx.fillRect(region.x, region.y, region.width, region.height);
  ctx.save();
  ctx.beginPath();
  ctx.rect(region.x, region.y, region.width, region.height);
  ctx.clip();
  if (region.motif === "grid") drawGridMotif(ctx, region);
  else if (region.motif === "forge") drawForgeMotif(ctx, region, state.time);
  else if (region.motif === "archive") drawArchiveMotif(ctx, region, state.time);
  else drawBioMotif(ctx, region, state.time);

  const core = ctx.createRadialGradient(
    region.x + region.width / 2,
    region.y + region.height / 2,
    8,
    region.x + region.width / 2,
    region.y + region.height / 2,
    105,
  );
  core.addColorStop(0, region.glow);
  core.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = core;
  ctx.fillRect(region.x, region.y, region.width, region.height);
  ctx.restore();
}

function drawHealthBar(ctx, entity, width, yOffset, color, options = {}) {
  const ratio = Math.max(0, Math.min(1, entity.hp / Math.max(1, entity.maxHp)));
  const x = entity.x - width / 2;
  const y = entity.y - yOffset;
  roundedRect(ctx, x - 1, y - 1, width + 2, 7, 3);
  ctx.fillStyle = "rgba(0,3,7,.88)";
  ctx.fill();
  roundedRect(ctx, x, y, width * ratio, 5, 2);
  ctx.fillStyle = ratio < 0.3 ? "#ff5268" : color;
  ctx.fill();
  if (options.shield > 0) {
    const shieldRatio = Math.min(1, options.shield / Math.max(1, entity.maxHp));
    ctx.fillStyle = "#89eaff";
    ctx.fillRect(x, y + 6, width * shieldRatio, 2);
  }
}

function drawTowers(ctx, state, assets) {
  for (const tower of state.towers) {
    const image = tower.kind === "sentry" ? assets?.sentry : assets?.emp;
    const size = tower.kind === "sentry" ? 47 : 50;
    drawSprite(ctx, image, tower, size, state, { seed: Number(tower.id.split("-").at(-1)), shadowAlpha: 0.45 });
    const lifeRatio = Math.max(0, tower.life / tower.maxLife);
    ctx.strokeStyle = tower.kind === "sentry" ? "rgba(255,193,86,.72)" : "rgba(190,124,255,.75)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, size * 0.38, -Math.PI / 2, -Math.PI / 2 + TAU * lifeRatio);
    ctx.stroke();
  }
}

function drawDrones(ctx, state, assets) {
  for (const hero of state.heroes) {
    if (hero.dead || !hero.upgrades.drone) continue;
    const angle = state.time * (1.28 + hero.upgrades.drone * 0.08) + hero.zoneId * 1.7;
    const drone = {
      x: hero.x + Math.cos(angle) * 34,
      y: hero.y + Math.sin(angle) * 34,
      angle: angle + Math.PI / 2,
      vx: 0,
      vy: 0,
    };
    drawSprite(ctx, assets?.drone, drone, 35 + hero.upgrades.drone * 2, state, { seed: hero.zoneId + 20, shadowAlpha: 0.24 });
  }
}

function drawEnemies(ctx, state, assets) {
  const sorted = [...state.enemies].sort((a, b) => a.y - b.y);
  for (const enemy of sorted) {
    let size = enemy.type === "raider" ? 42 : enemy.type === "shooter" ? 49 : 63;
    if (enemy.elite) size *= 1.12;
    if (enemy.boss) size = 88;
    const region = state.zones[enemy.originZoneId];
    const hue = [0, 42, 122, 215][enemy.originZoneId] || 0;
    const filter = enemy.hitFlash > 0 ? "brightness(2.7)" : `hue-rotate(${hue}deg) saturate(1.12)`;
    drawSprite(ctx, assets?.[enemy.sprite], enemy, size, state, { seed: Number(enemy.id.split("-").at(-1)), filter });
    if (enemy.migrating) {
      ctx.strokeStyle = region.accent;
      ctx.setLineDash([3, 4]);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius + 5, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (enemy.boss || enemy.elite || enemy.hp < enemy.maxHp) {
      drawHealthBar(ctx, enemy, enemy.boss ? 70 : Math.max(26, enemy.radius * 2), enemy.boss ? 47 : enemy.radius + 15, enemy.boss ? "#ffd066" : "#ff596d");
    }
  }
}

function drawHeroes(ctx, state, assets) {
  for (const hero of state.heroes) {
    if (hero.dead) continue;
    if (hero.dashRemaining > 0) {
      for (let index = 3; index >= 1; index -= 1) {
        drawSprite(ctx, assets?.[hero.sprite], {
          ...hero,
          x: hero.x - Math.cos(hero.angle) * index * 11,
          y: hero.y - Math.sin(hero.angle) * index * 11,
        }, hero.radius > 20 ? 61 : 53, state, { alpha: 0.09 * (4 - index), shadowAlpha: 0 });
      }
    }
    const filter = hero.hitFlash > 0 ? "brightness(2.7)" : `drop-shadow(0 0 5px ${hero.color})`;
    drawSprite(ctx, assets?.[hero.sprite], hero, hero.radius > 20 ? 63 : 54, state, { seed: hero.zoneId + 1, filter });
    drawHealthBar(ctx, hero, hero.radius > 20 ? 56 : 48, hero.radius + 22, hero.color, { shield: hero.shield });
    if (state.controlledZoneId === hero.zoneId) {
      ctx.strokeStyle = hero.color;
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.arc(hero.x, hero.y, hero.radius + 11 + Math.sin(state.time * 5) * 1.8, 0, TAU);
      ctx.stroke();
    }
  }
}

function drawProjectiles(ctx, state) {
  ctx.lineCap = "round";
  for (const shot of state.projectiles) {
    ctx.strokeStyle = shot.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = shot.color;
    ctx.lineWidth = shot.radius * 0.8 + 1;
    ctx.beginPath();
    ctx.moveTo(shot.x - shot.vx * 0.025, shot.y - shot.vy * 0.025);
    ctx.lineTo(shot.x, shot.y);
    ctx.stroke();
  }
  for (const shot of state.enemyShots) {
    ctx.strokeStyle = shot.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = shot.color;
    ctx.lineWidth = shot.radius;
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
    ctx.globalAlpha = Math.min(1, beam.life * 7);
    ctx.strokeStyle = beam.color;
    ctx.shadowBlur = 12;
    ctx.shadowColor = beam.color;
    ctx.lineWidth = beam.width;
    if (beam.ring) {
      const progress = 1 - beam.life / 0.4;
      ctx.beginPath();
      ctx.arc(beam.x1, beam.y1, beam.radius * progress, 0, TAU);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(beam.x1, beam.y1);
      const dx = beam.x2 - beam.x1;
      const dy = beam.y2 - beam.y1;
      const length = Math.hypot(dx, dy) || 1;
      const nx = -dy / length;
      const ny = dx / length;
      for (let index = 1; index < 4; index += 1) {
        const t = index / 4;
        const jitter = Math.sin(index * 6.7 + state.time * 41) * 3.2;
        ctx.lineTo(beam.x1 + dx * t + nx * jitter, beam.y1 + dy * t + ny * jitter);
      }
      ctx.lineTo(beam.x2, beam.y2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawEffects(ctx, state) {
  for (const particle of state.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.shadowBlur = 7;
    ctx.shadowColor = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size * particle.life / particle.maxLife, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.font = "600 9px 'IBM Plex Mono', monospace";
  ctx.textAlign = "center";
  for (const text of state.texts) {
    ctx.globalAlpha = Math.max(0, text.life / text.maxLife);
    ctx.fillStyle = text.color;
    ctx.fillText(text.text, text.x, text.y);
  }
  ctx.globalAlpha = 1;
}

function drawZoneState(ctx, state, zone) {
  const hero = state.heroes[zone.id];
  ctx.save();
  if (zone.status === "fallen") {
    ctx.fillStyle = "rgba(18,0,5,.68)";
    ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
    ctx.strokeStyle = "rgba(255,68,91,.38)";
    ctx.lineWidth = 7;
    for (let offset = -zone.height; offset < zone.width; offset += 48) {
      ctx.beginPath();
      ctx.moveTo(zone.x + offset, zone.y);
      ctx.lineTo(zone.x + offset + zone.height, zone.y + zone.height);
      ctx.stroke();
    }
    ctx.fillStyle = "#ff536a";
    ctx.font = "800 25px 'Rajdhani', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SECTOR BREACHED", zone.x + zone.width / 2, zone.y + zone.height / 2 - 4);
    ctx.font = "600 10px 'IBM Plex Mono', monospace";
    ctx.fillText("HOSTILES REDIRECTED TO SURVIVING FRONTS", zone.x + zone.width / 2, zone.y + zone.height / 2 + 18);
  } else {
    const pressureColor = zone.pressure > 0.72 ? "#ff5268" : zone.accent;
    ctx.fillStyle = "rgba(2,7,12,.74)";
    roundedRect(ctx, zone.x + 12, zone.y + 12, 196, 32, 5);
    ctx.fill();
    ctx.fillStyle = pressureColor;
    ctx.fillRect(zone.x + 12, zone.y + 12, 3, 32);
    ctx.textAlign = "left";
    ctx.fillStyle = "#edfaff";
    ctx.font = "700 11px 'IBM Plex Mono', monospace";
    ctx.fillText(`${zone.code} / ${zone.name}`, zone.x + 24, zone.y + 27);
    ctx.fillStyle = "rgba(216,238,244,.58)";
    ctx.font = "600 8px 'IBM Plex Mono', monospace";
    ctx.fillText(`${hero.name} · ${state.controlledZoneId === zone.id ? "MANUAL CONTROL" : "AI AUTOPILOT"}`, zone.x + 24, zone.y + 38);
  }
  ctx.restore();
}

function drawZoneDividers(ctx, state) {
  ctx.fillStyle = "#02060a";
  ctx.fillRect(GAME_WIDTH / 2 - 5, 0, 10, GAME_HEIGHT);
  ctx.fillRect(0, GAME_HEIGHT / 2 - 5, GAME_WIDTH, 10);
  for (const zone of state.zones) {
    ctx.strokeStyle = state.controlledZoneId === zone.id ? zone.accent : "rgba(139,213,228,.2)";
    ctx.lineWidth = state.controlledZoneId === zone.id ? 3 : 1;
    ctx.strokeRect(zone.x + 5, zone.y + 5, zone.width - 10, zone.height - 10);
  }
  ctx.fillStyle = "#0a1720";
  ctx.beginPath();
  ctx.arc(GAME_WIDTH / 2, GAME_HEIGHT / 2, 22, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = state.invasionFlash > 0 ? "#ff536a" : "#5eeaff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(GAME_WIDTH / 2, GAME_HEIGHT / 2, 14 + Math.sin(state.time * 4) * 2, 0, TAU);
  ctx.stroke();
}

function drawVignette(ctx, state) {
  const vignette = ctx.createRadialGradient(GAME_WIDTH / 2, GAME_HEIGHT / 2, 150, GAME_WIDTH / 2, GAME_HEIGHT / 2, 760);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(0.72, "rgba(0,0,0,.03)");
  vignette.addColorStop(1, "rgba(0,0,0,.46)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  if (state.dangerPulse > 0) {
    ctx.fillStyle = `rgba(255,35,65,${state.dangerPulse * 0.1})`;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }
  ctx.globalAlpha = 0.035;
  ctx.fillStyle = "#a5f4ff";
  for (let y = 0; y < GAME_HEIGHT; y += 4) ctx.fillRect(0, y, GAME_WIDTH, 1);
  ctx.globalAlpha = 1;
}

export function renderGame(ctx, state, assets) {
  if (!ctx || !state) return;
  ctx.save();
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  const focused = Number.isInteger(state.controlledZoneId);
  if (focused) {
    const zone = state.zones[state.controlledZoneId];
    ctx.scale(2, 2);
    ctx.translate(-zone.x, -zone.y);
  }
  const shake = state.shake > 0 ? state.shake * 3 : 0;
  ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  for (const region of REGIONS) drawRegionGround(ctx, state, region);
  drawTowers(ctx, state, assets);
  drawBeams(ctx, state);
  drawEnemies(ctx, state, assets);
  drawDrones(ctx, state, assets);
  drawHeroes(ctx, state, assets);
  drawProjectiles(ctx, state);
  drawEffects(ctx, state);
  for (const zone of state.zones) drawZoneState(ctx, state, zone);
  if (!focused) drawZoneDividers(ctx, state);
  ctx.restore();
  drawVignette(ctx, state);
}

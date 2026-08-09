import {
  ACTIONS,
  createPredictor,
  getMetrics,
  predict,
  train,
} from "./predictor.js";

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

const TAU = Math.PI * 2;
const ARENA = Object.freeze({ left: 54, right: 1226, top: 54, bottom: 666 });
const TRAIN_INTERVAL = 0.1;
const FORECAST_HORIZON = 0.8;
const MODEL_BREAK_CONFIDENCE = 0.7;
const MODEL_BREAK_DAMAGE = 0.18;
const WEAKNESS_DURATION = 2.5;
const WEAKNESS_MULTIPLIER = 8;
const BOSS_ARMOR = 0.2;
const PATTERNS = Object.freeze(["laser", "bombardment", "compression"]);
const ACTION_LABELS = Object.freeze({
  LEFT: "STRAFE LEFT",
  RIGHT: "STRAFE RIGHT",
  APPROACH: "RUSH CORE",
  RETREAT: "FALL BACK",
  DASH_LEFT: "DASH LEFT",
  DASH_RIGHT: "DASH RIGHT",
});
const MUTATION_OPTIONS = Object.freeze([
  Object.freeze({
    id: "labelFlip",
    name: "LABEL FLIP",
    description: "Invert the next training label and poison the model's certainty.",
  }),
  Object.freeze({
    id: "ghostBranch",
    name: "GHOST BRANCH",
    description: "Fork the next forecast and amplify its model-break payload.",
  }),
  Object.freeze({
    id: "gradientFreeze",
    name: "GRADIENT FREEZE",
    description: "Freeze online learning for five seconds and preserve the current bias.",
  }),
]);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function compact(array, keep) {
  let write = 0;
  for (let read = 0; read < array.length; read += 1) {
    const value = array[read];
    if (keep(value)) array[write++] = value;
  }
  array.length = write;
}

function emit(state, type, payload = {}) {
  state.events.push({ type, time: state.time, ...payload });
}

function actionIndex(action) {
  return Math.max(0, ACTIONS.indexOf(action));
}

function flippedAction(index) {
  const pairs = [1, 0, 3, 2, 5, 4];
  return pairs[index] ?? index;
}

function normalize(x, y, fallbackX = 1, fallbackY = 0) {
  const length = Math.hypot(x, y);
  if (length < 0.0001) return { x: fallbackX, y: fallbackY };
  return { x: x / length, y: y / length };
}

function bossBasis(state) {
  const toward = normalize(
    state.boss.x - state.player.x,
    state.boss.y - state.player.y,
  );
  return {
    toward,
    left: { x: toward.y, y: -toward.x },
  };
}

function movementVector(input) {
  const x = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const y = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  return normalize(x, y, 0, 0);
}

function classifyAction(state) {
  const { toward, left } = bossBasis(state);
  const player = state.player;
  const velocity = normalize(player.vx, player.vy, player.recentX, player.recentY);
  const lateral = velocity.x * left.x + velocity.y * left.y;
  const radial = velocity.x * toward.x + velocity.y * toward.y;

  if (player.dashActionTimer > 0) {
    return actionIndex(lateral >= 0 ? "DASH_LEFT" : "DASH_RIGHT");
  }
  if (Math.abs(lateral) > Math.abs(radial) * 0.78) {
    return actionIndex(lateral >= 0 ? "LEFT" : "RIGHT");
  }
  return actionIndex(radial >= 0 ? "APPROACH" : "RETREAT");
}

function buildFeatures(state) {
  const player = state.player;
  const boss = state.boss;
  const features = state.learning.features;
  features[0] = 1;
  features[1] = clamp((player.x / GAME_WIDTH) * 2 - 1, -1, 1);
  features[2] = clamp((player.y / GAME_HEIGHT) * 2 - 1, -1, 1);
  features[3] = clamp(player.vx / player.dashSpeed, -1, 1);
  features[4] = clamp(player.vy / player.dashSpeed, -1, 1);
  features[5] = clamp((boss.x - player.x) / GAME_WIDTH, -1, 1);
  features[6] = clamp((boss.y - player.y) / GAME_HEIGHT, -1, 1);
  features[7] = clamp(Math.hypot(boss.x - player.x, boss.y - player.y) / 900, 0, 1);
  features[8] = clamp(player.recentX, -1, 1);
  features[9] = clamp(player.recentY, -1, 1);
  features[10] = player.dashCooldown <= 0 ? 1 : 0;
  features[11] = clamp(player.hp / player.maxHp, 0, 1);
  features[12] = clamp(Math.min(player.x - ARENA.left, ARENA.right - player.x) / 220, 0, 1);
  features[13] = clamp(Math.min(player.y - ARENA.top, ARENA.bottom - player.y) / 180, 0, 1);
  return features;
}

function pointToLineDistance(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const denominator = dx * dx + dy * dy;
  if (denominator < 0.0001) return Math.hypot(point.x - start.x, point.y - start.y);
  const t = Math.max(0, ((point.x - start.x) * dx + (point.y - start.y) * dy) / denominator);
  const px = start.x + dx * t;
  const py = start.y + dy * t;
  return Math.hypot(point.x - px, point.y - py);
}

function forecastPosition(state, action, branchOffset = 0) {
  const { toward, left } = bossBasis(state);
  let canonical = toward;
  if (action === "RETREAT") canonical = { x: -toward.x, y: -toward.y };
  if (action === "LEFT" || action === "DASH_LEFT") canonical = left;
  if (action === "RIGHT" || action === "DASH_RIGHT") canonical = { x: -left.x, y: -left.y };
  const observedSpeed = Math.hypot(state.player.vx, state.player.vy);
  let direction = observedSpeed >= 45
    ? normalize(state.player.vx, state.player.vy, canonical.x, canonical.y)
    : canonical;
  let distance = Math.max(state.player.speed * 0.72, observedSpeed) * FORECAST_HORIZON;
  if (action.startsWith("DASH")) distance = state.player.dashSpeed * 0.48;
  if (branchOffset) {
    direction = normalize(
      direction.x + toward.x * branchOffset,
      direction.y + toward.y * branchOffset,
    );
  }
  return {
    x: clamp(state.player.x + direction.x * distance, ARENA.left + 24, ARENA.right - 24),
    y: clamp(state.player.y + direction.y * distance, ARENA.top + 24, ARENA.bottom - 24),
  };
}

function addParticle(state, x, y, color, speed = 180, life = 0.5, size = 4) {
  if (state.particles.length >= 260) return;
  const angle = state.random() * TAU;
  const velocity = speed * (0.35 + state.random() * 0.65);
  state.particles.push({
    x,
    y,
    vx: Math.cos(angle) * velocity,
    vy: Math.sin(angle) * velocity,
    color,
    size: size * (0.6 + state.random() * 0.8),
    life,
    maxLife: life,
  });
}

function burst(state, x, y, color, count, speed = 220, life = 0.65, size = 5) {
  for (let index = 0; index < count; index += 1) {
    addParticle(state, x, y, color, speed, life * (0.65 + state.random() * 0.5), size);
  }
}

function addText(state, text, x, y, color = "#f8f4e8", scale = 1) {
  state.texts.push({ text, x, y, color, scale, life: 1.15, maxLife: 1.15, vy: -32 });
}

function setBossStage(state) {
  const boss = state.boss;
  const ratio = boss.hp / boss.maxHp;
  const nextStage = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
  if (nextStage === boss.stage) return;
  boss.stage = nextStage;
  state.patternCooldown = Math.min(state.patternCooldown, 0.75);
  state.shake = Math.max(state.shake, 12);
  addText(state, `MODEL PHASE ${nextStage}`, boss.x, boss.y - 112, "#ff4b5f", 1.2);
  emit(state, "phase", { stage: nextStage });
}

function finishRun(state, status) {
  if (state.status !== "running") return;
  state.status = status;
  state.timeLeft = Math.max(0, state.duration - state.time);
  state.mutationPending = null;
  emit(state, status === "victory" ? "win" : "loss", {
    reason: status,
    breaks: state.breaks,
  });
}

function damageBoss(state, amount, source = "bullet", bypassArmor = false) {
  const boss = state.boss;
  if (boss.dead || amount <= 0) return 0;
  const scale = bypassArmor
    ? 1
    : BOSS_ARMOR * (boss.weakness > 0 ? WEAKNESS_MULTIPLIER : 1);
  const dealt = Math.min(boss.hp, amount * scale);
  boss.hp -= dealt;
  if (source === "bullet") state.stats.hits += 1;
  boss.hitFlash = 0.1;
  emit(state, "bossHit", { damage: dealt, source, weakness: boss.weakness > 0 });
  if (boss.hp <= 0) {
    boss.hp = 0;
    boss.dead = true;
    state.hitStop = Math.max(state.hitStop, 0.22);
    state.shake = 24;
    burst(state, boss.x, boss.y, "#ff3655", 70, 420, 1.25, 8);
    addText(state, "THE MODEL IS WRONG", boss.x, boss.y - 104, "#ffffff", 1.55);
    finishRun(state, "victory");
  } else {
    setBossStage(state);
  }
  return dealt;
}

function damagePlayer(state, amount, source) {
  const player = state.player;
  if (state.time < state.graceDuration || player.invulnerability > 0 || player.dead || amount <= 0) return false;
  player.hp = Math.max(0, player.hp - amount);
  player.invulnerability = 0.72;
  player.hitFlash = 0.18;
  state.shake = Math.max(state.shake, 10);
  burst(state, player.x, player.y, "#ff4b5f", 15, 230, 0.5, 5);
  addText(state, `-${Math.round(amount)}`, player.x, player.y - 36, "#ff5e70", 0.9);
  emit(state, "playerHit", { damage: amount, source });
  if (player.hp <= 0) {
    player.dead = true;
    finishRun(state, "defeat");
  }
  return true;
}

function updateLearning(state, dt) {
  const learning = state.learning;
  learning.accumulator += dt;
  while (learning.accumulator >= TRAIN_INTERVAL) {
    learning.accumulator -= TRAIN_INTERVAL;
    if (Math.hypot(state.player.vx, state.player.vy) < 45 && state.player.dashActionTimer <= 0) {
      learning.streak = 0;
      continue;
    }
    const features = buildFeatures(state);
    let actualIndex = classifyAction(state);
    const actualAction = ACTIONS[actualIndex];

    if (actualAction === learning.lastAction) learning.streak += 1;
    else {
      learning.lastAction = actualAction;
      learning.streak = 1;
    }
    learning.actualActionIndex = actualIndex;
    learning.actualAction = actualAction;

    if (state.time < state.mutations.gradientFreezeUntil) {
      learning.frozen = true;
      continue;
    }
    learning.frozen = false;
    if (state.mutations.labelFlipCharges > 0) {
      const originalIndex = actualIndex;
      actualIndex = flippedAction(actualIndex);
      state.mutations.labelFlipCharges -= 1;
      emit(state, "mutationTriggered", {
        id: "labelFlip",
        from: ACTIONS[originalIndex],
        to: ACTIONS[actualIndex],
      });
    }
    train(learning.model, features, actualIndex);
    learning.metrics = getMetrics(learning.model);
  }
}

function updatePlayer(state, input, dt) {
  const player = state.player;
  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  player.dashRemaining = Math.max(0, player.dashRemaining - dt);
  player.dashActionTimer = Math.max(0, player.dashActionTimer - dt);
  player.invulnerability = Math.max(0, player.invulnerability - dt);
  player.hitFlash = Math.max(0, player.hitFlash - dt);
  player.fireCooldown = Math.max(0, player.fireCooldown - dt);

  const move = movementVector(input);
  const hasMovement = Math.hypot(move.x, move.y) > 0.5;
  if (input.dashPressed && player.dashCooldown <= 0) {
    const fallback = normalize(state.aim.x - player.x, state.aim.y - player.y, 1, 0);
    player.dashX = hasMovement ? move.x : fallback.x;
    player.dashY = hasMovement ? move.y : fallback.y;
    player.dashRemaining = 0.2;
    player.dashActionTimer = 0.16;
    player.dashCooldown = 1.15;
    player.invulnerability = Math.max(player.invulnerability, 0.24);
    state.shake = Math.max(state.shake, 4);
    burst(state, player.x, player.y, "#6ff7ff", 12, 160, 0.35, 4);
    emit(state, "dash");
  }

  let targetVx = hasMovement ? move.x * player.speed : 0;
  let targetVy = hasMovement ? move.y * player.speed : 0;
  if (player.dashRemaining > 0) {
    targetVx = player.dashX * player.dashSpeed;
    targetVy = player.dashY * player.dashSpeed;
  }
  const acceleration = player.dashRemaining > 0 ? 28 : 13;
  const blend = 1 - Math.exp(-acceleration * dt);
  player.vx += (targetVx - player.vx) * blend;
  player.vy += (targetVy - player.vy) * blend;
  player.x = clamp(player.x + player.vx * dt, ARENA.left + player.radius, ARENA.right - player.radius);
  player.y = clamp(player.y + player.vy * dt, ARENA.top + player.radius, ARENA.bottom - player.radius);
  player.recentX += ((hasMovement ? move.x : 0) - player.recentX) * (1 - Math.exp(-5 * dt));
  player.recentY += ((hasMovement ? move.y : 0) - player.recentY) * (1 - Math.exp(-5 * dt));
  player.angle = Math.atan2(state.aim.y - player.y, state.aim.x - player.x);

  if (input.pointerDown && player.fireCooldown <= 0) {
    const direction = normalize(state.aim.x - player.x, state.aim.y - player.y, 1, 0);
    player.fireCooldown = player.fireInterval;
    state.bullets.push({
      x: player.x + direction.x * 24,
      y: player.y + direction.y * 24,
      previousX: player.x,
      previousY: player.y,
      vx: direction.x * 980,
      vy: direction.y * 980,
      radius: 4,
      damage: player.damage,
      life: 1.4,
    });
    state.stats.shots += 1;
    emit(state, "shot", { x: player.x, y: player.y });
  }
}

function updateBullets(state, dt) {
  const boss = state.boss;
  for (const bullet of state.bullets) {
    bullet.life -= dt;
    bullet.previousX = bullet.x;
    bullet.previousY = bullet.y;
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    if (bullet.life <= 0 || boss.dead) continue;
    if (Math.hypot(bullet.x - boss.x, bullet.y - boss.y) <= boss.radius + bullet.radius) {
      bullet.life = 0;
      damageBoss(state, bullet.damage, "bullet");
      burst(state, bullet.x, bullet.y, boss.weakness > 0 ? "#fff19a" : "#ff4b5f", 4, 100, 0.22, 3);
    }
  }
  compact(state.bullets, (bullet) => (
    bullet.life > 0
    && bullet.x > -40 && bullet.x < GAME_WIDTH + 40
    && bullet.y > -40 && bullet.y < GAME_HEIGHT + 40
  ));
}

function attackWouldHit(state, prediction) {
  const player = state.player;
  const pattern = prediction.pattern;
  if (pattern === "bombardment") {
    return Math.hypot(player.x - prediction.ghostX, player.y - prediction.ghostY) < 104;
  }
  if (pattern === "compression") {
    const horizontal = Math.abs(prediction.ghostX - prediction.originX)
      > Math.abs(prediction.ghostY - prediction.originY);
    return horizontal
      ? Math.abs(player.y - prediction.ghostY) < 62
      : Math.abs(player.x - prediction.ghostX) < 62;
  }
  const direction = normalize(
    prediction.ghostX - prediction.originX,
    prediction.ghostY - prediction.originY,
  );
  const end = {
    x: prediction.originX + direction.x * 1500,
    y: prediction.originY + direction.y * 1500,
  };
  return pointToLineDistance(
    player,
    { x: prediction.originX, y: prediction.originY },
    end,
  ) < 56;
}

function commitPattern(state) {
  const features = buildFeatures(state);
  const result = predict(state.learning.model, features, state.learning.probabilities);
  const pattern = PATTERNS[state.patternIndex % PATTERNS.length];
  state.patternIndex += 1;
  const ghost = forecastPosition(state, result.action);
  state.stats.bestConfidence = Math.max(state.stats.bestConfidence, result.confidence);
  const branches = [];
  if (state.mutations.ghostBranchCharges > 0) {
    branches.push(forecastPosition(state, result.action, -0.75));
    branches.push(forecastPosition(state, result.action, 0.75));
  }
  state.prediction = {
    pattern,
    actionIndex: result.actionIndex,
    action: result.action,
    label: ACTION_LABELS[result.action],
    confidence: result.confidence,
    originX: state.boss.x,
    originY: state.boss.y,
    startX: state.player.x,
    startY: state.player.y,
    ghostX: ghost.x,
    ghostY: ghost.y,
    targetX: ghost.x,
    targetY: ghost.y,
    probabilities: Array.from(result.probabilities),
    locked: result.confidence >= 0.55,
    branches,
    committedAt: state.time,
    resolvesAt: state.time + FORECAST_HORIZON,
    timeToImpact: FORECAST_HORIZON,
    stableSamples: state.learning.streak,
    resolved: false,
    broken: false,
  };
  state.ghost = {
    active: true,
    x: ghost.x,
    y: ghost.y,
    branches,
    action: result.action,
    confidence: result.confidence,
    life: FORECAST_HORIZON,
    maxLife: FORECAST_HORIZON,
  };
  state.telegraphs.push({
    type: pattern,
    x: ghost.x,
    y: ghost.y,
    originX: state.boss.x,
    originY: state.boss.y,
    x1: state.boss.x,
    y1: state.boss.y,
    x2: ghost.x,
    y2: ghost.y,
    branches,
    life: FORECAST_HORIZON,
    maxLife: FORECAST_HORIZON,
    confidence: result.confidence,
  });
  emit(state, "patternCommit", {
    pattern,
    action: result.action,
    confidence: result.confidence,
    ghostX: ghost.x,
    ghostY: ghost.y,
  });
}

function triggerModelBreak(state, prediction) {
  prediction.broken = true;
  state.breaks += 1;
  const branched = state.mutations.ghostBranchCharges > 0;
  const damageRatio = MODEL_BREAK_DAMAGE + (branched ? 0.06 : 0);
  if (branched) state.mutations.ghostBranchCharges -= 1;
  const dealt = damageBoss(state, state.boss.maxHp * damageRatio, "modelBreak", true);
  state.stats.modelBreakDamage += dealt;
  state.boss.weakness = Math.max(state.boss.weakness, WEAKNESS_DURATION);
  state.hitStop = Math.max(state.hitStop, 0.14);
  state.shake = Math.max(state.shake, 21);
  state.flash = Math.max(state.flash, 1);
  burst(state, state.boss.x, state.boss.y, "#ff3655", 46, 390, 1, 8);
  burst(state, prediction.ghostX, prediction.ghostY, "#6ff7ff", 24, 280, 0.7, 6);
  addText(state, "MODEL BREAK", state.boss.x, state.boss.y - 118, "#ffffff", 1.55);
  addText(state, `${Math.round(prediction.confidence * 100)}% CONFIDENTLY WRONG`, prediction.ghostX, prediction.ghostY - 52, "#6ff7ff", 0.95);
  emit(state, "modelBreak", {
    breakNumber: state.breaks,
    damage: dealt,
    damageRatio,
    confidence: prediction.confidence,
    predicted: prediction.action,
    actual: state.learning.actualAction,
  });
  emit(state, "weakness", { duration: WEAKNESS_DURATION, multiplier: WEAKNESS_MULTIPLIER });

  if (state.status === "running" && state.mutationOffersUsed < 3) {
    state.mutationOffersUsed += 1;
    state.mutationPending = {
      breakNumber: state.breaks,
      options: MUTATION_OPTIONS.map((option) => ({ ...option })),
    };
    emit(state, "mutationOffered", { breakNumber: state.breaks });
  }
}

function strikePattern(state) {
  const prediction = state.prediction;
  if (!prediction || prediction.resolved) return;
  prediction.resolved = true;
  const actualIndex = classifyAction(state);
  const actualAction = ACTIONS[actualIndex];
  const attackHits = attackWouldHit(state, prediction);
  const movedFromCommit = Math.hypot(
    state.player.x - prediction.startX,
    state.player.y - prediction.startY,
  );
  const canBreak = prediction.confidence >= MODEL_BREAK_CONFIDENCE
    && prediction.stableSamples >= 5
    && actualIndex !== prediction.actionIndex
    && movedFromCommit >= 34
    && !attackHits;

  if (canBreak) {
    triggerModelBreak(state, prediction);
  } else {
    const damage = 17 + state.boss.stage * 4;
    if (attackHits) damagePlayer(state, damage, prediction.pattern);
  }

  if (prediction.pattern === "laser") {
    const direction = normalize(
      prediction.ghostX - prediction.originX,
      prediction.ghostY - prediction.originY,
    );
    state.beams.push({
      type: "laser",
      x1: prediction.originX,
      y1: prediction.originY,
      x2: prediction.originX + direction.x * 1500,
      y2: prediction.originY + direction.y * 1500,
      width: 58,
      life: 0.34,
      maxLife: 0.34,
    });
  } else if (prediction.pattern === "compression") {
    const horizontal = Math.abs(prediction.ghostX - prediction.originX)
      > Math.abs(prediction.ghostY - prediction.originY);
    state.beams.push({
      type: "compression",
      horizontal,
      x1: horizontal ? ARENA.left : prediction.ghostX,
      y1: horizontal ? prediction.ghostY : ARENA.top,
      x2: horizontal ? ARENA.right : prediction.ghostX,
      y2: horizontal ? prediction.ghostY : ARENA.bottom,
      width: 74,
      life: 0.3,
      maxLife: 0.3,
    });
  } else {
    burst(state, prediction.ghostX, prediction.ghostY, "#ff3655", 28, 320, 0.65, 7);
  }
  state.ghost.active = false;
  emit(state, "patternStrike", {
    pattern: prediction.pattern,
    hit: attackHits && !canBreak,
    brokeModel: canBreak,
    predicted: prediction.action,
    actual: actualAction,
  });
}

function updatePattern(state, dt) {
  if (state.prediction && !state.prediction.resolved) {
    state.prediction.timeToImpact = Math.max(0, state.prediction.resolvesAt - state.time);
    if (state.time >= state.prediction.resolvesAt) strikePattern(state);
    return;
  }
  state.patternCooldown -= dt;
  if (state.patternCooldown <= 0) {
    commitPattern(state);
    state.patternCooldown = Math.max(0.75, 1.55 - state.boss.stage * 0.16);
  }
}

function updateBoss(state, dt) {
  const boss = state.boss;
  boss.hitFlash = Math.max(0, boss.hitFlash - dt);
  boss.weakness = Math.max(0, boss.weakness - dt);
  if (boss.dead) return;
  const intensity = 1 + (boss.stage - 1) * 0.3;
  boss.targetX = 966 + Math.sin(state.time * 0.37) * 58 * intensity;
  boss.targetY = 360 + Math.sin(state.time * 0.61 + 0.8) * 116 * intensity;
  const blend = 1 - Math.exp(-1.5 * dt);
  boss.x += (boss.targetX - boss.x) * blend;
  boss.y += (boss.targetY - boss.y) * blend;
  boss.angle += dt * (0.38 + boss.stage * 0.08);
}

function updateEffects(state, dt) {
  for (const particle of state.particles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= Math.exp(-3.2 * dt);
    particle.vy *= Math.exp(-3.2 * dt);
  }
  compact(state.particles, (particle) => particle.life > 0);
  for (const beam of state.beams) beam.life -= dt;
  compact(state.beams, (beam) => beam.life > 0);
  for (const telegraph of state.telegraphs) telegraph.life -= dt;
  compact(state.telegraphs, (telegraph) => telegraph.life > 0);
  for (const text of state.texts) {
    text.life -= dt;
    text.y += text.vy * dt;
  }
  compact(state.texts, (text) => text.life > 0);
  if (state.ghost.active) state.ghost.life = Math.max(0, state.ghost.life - dt);
  state.flash = Math.max(0, state.flash - dt * 3.6);
  state.shake *= Math.exp(-9 * dt);
}

function fixedStep(state, input, dt) {
  if (state.status !== "running" || state.mutationPending) return;
  if (state.hitStop > 0) {
    state.hitStop = Math.max(0, state.hitStop - dt);
    updateEffects(state, dt * 0.22);
    return;
  }

  state.time += dt;
  state.timeLeft = Math.max(0, state.duration - state.time);
  if (state.time >= state.duration) {
    state.time = state.duration;
    state.timeLeft = 0;
    finishRun(state, "timeout");
    return;
  }
  updatePlayer(state, input, dt);
  updateLearning(state, dt);
  updateBoss(state, dt);
  updateBullets(state, dt);
  updatePattern(state, dt);
  updateEffects(state, dt);
}

export function createAdversarialState({ random = Math.random, duration = 150 } = {}) {
  const state = {
    mode: "adversarial",
    status: "running",
    random,
    duration,
    graceDuration: 7.5,
    time: 0,
    timeLeft: duration,
    player: {
      id: "player",
      name: "THE TRAINER",
      sprite: "/assets/survivor/player.png",
      x: 400,
      y: 360,
      vx: 0,
      vy: 0,
      recentX: 0,
      recentY: -1,
      angle: 0,
      radius: 21,
      hp: 100,
      maxHp: 100,
      speed: 260,
      dashSpeed: 830,
      dashX: 1,
      dashY: 0,
      dashRemaining: 0,
      dashActionTimer: 0,
      dashCooldown: 0,
      invulnerability: 0,
      hitFlash: 0,
      fireCooldown: 0,
      fireInterval: 0.115,
      damage: 3,
      dead: false,
    },
    boss: {
      id: "wrong-engine",
      name: "THE WRONG ENGINE",
      sprite: "/assets/survivor/bosses/wrong-engine.png",
      x: 966,
      y: 360,
      targetX: 966,
      targetY: 360,
      angle: 0,
      radius: 88,
      hp: 1200,
      maxHp: 1200,
      stage: 1,
      weakness: 0,
      hitFlash: 0,
      dead: false,
    },
    aim: { x: 966, y: 360 },
    aimX: 966,
    aimY: 360,
    bullets: [],
    particles: [],
    beams: [],
    telegraphs: [],
    texts: [],
    prediction: null,
    ghost: {
      active: false,
      x: 0,
      y: 0,
      branches: [],
      action: null,
      confidence: 0,
      life: 0,
      maxLife: FORECAST_HORIZON,
    },
    learning: {
      model: createPredictor({ seed: 0x54524d57 }),
      features: new Float32Array(14),
      probabilities: new Float32Array(ACTIONS.length),
      accumulator: 0,
      lastAction: "RETREAT",
      actualAction: "RETREAT",
      actualActionIndex: actionIndex("RETREAT"),
      streak: 0,
      frozen: false,
      metrics: null,
    },
    mutations: {
      labelFlipCharges: 0,
      ghostBranchCharges: 0,
      gradientFreezeUntil: 0,
      chosen: [],
    },
    mutationPending: null,
    mutationOffersUsed: 0,
    breaks: 0,
    stats: {
      shots: 0,
      hits: 0,
      bestConfidence: 0,
      modelBreakDamage: 0,
    },
    patternIndex: 0,
    patternCooldown: 1.35,
    hitStop: 0,
    shake: 0,
    flash: 0,
    events: [],
  };
  state.learning.metrics = getMetrics(state.learning.model);
  emit(state, "runStart", { duration });
  return state;
}

export function createAdversarialInput() {
  return {
    up: false,
    down: false,
    left: false,
    right: false,
    dashPressed: false,
    pointerDown: false,
  };
}

export function clearPressedInput(input) {
  input.dashPressed = false;
}

export function setAim(state, x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  state.aim.x = clamp(x, 0, GAME_WIDTH);
  state.aim.y = clamp(y, 0, GAME_HEIGHT);
  state.aimX = state.aim.x;
  state.aimY = state.aim.y;
  return true;
}

export function chooseMutation(state, id) {
  const pending = state.mutationPending;
  if (!pending || state.status !== "running") return false;
  const option = pending.options.find((candidate) => candidate.id === id);
  if (!option) return false;
  if (id === "labelFlip") state.mutations.labelFlipCharges += 1;
  if (id === "ghostBranch") state.mutations.ghostBranchCharges += 1;
  if (id === "gradientFreeze") state.mutations.gradientFreezeUntil = state.time + 5;
  state.mutations.chosen.push(id);
  state.mutationPending = null;
  emit(state, "mutationChosen", { id, name: option.name });
  return true;
}

export function drainAdversarialEvents(state) {
  return state.events.splice(0, state.events.length);
}

export function stepAdversarial(state, input, dt) {
  if (!Number.isFinite(dt) || dt <= 0) return state;
  let remaining = dt;
  while (remaining > 0.000001) {
    const step = Math.min(remaining, 1 / 30);
    fixedStep(state, input, step);
    remaining -= step;
    if (state.status !== "running" || state.mutationPending) break;
  }
  return state;
}

export function getAdversarialHud(state) {
  const metrics = state.learning.metrics || getMetrics(state.learning.model);
  const prediction = state.prediction;
  return {
    status: state.status,
    time: state.time,
    timeLeft: state.timeLeft,
    duration: state.duration,
    graceRemaining: Math.max(0, state.graceDuration - state.time),
    player: {
      hp: state.player.hp,
      maxHp: state.player.maxHp,
      dashCooldown: state.player.dashCooldown,
    },
    boss: {
      hp: state.boss.hp,
      maxHp: state.boss.maxHp,
      stage: state.boss.stage,
      weakness: state.boss.weakness,
    },
    prediction: prediction ? {
      action: prediction.action,
      label: prediction.label,
      confidence: prediction.confidence,
      ghostX: prediction.ghostX,
      ghostY: prediction.ghostY,
      targetX: prediction.targetX,
      targetY: prediction.targetY,
      timeToImpact: prediction.timeToImpact,
      pattern: prediction.pattern,
      resolved: prediction.resolved,
      locked: prediction.locked,
      probabilities: [...prediction.probabilities],
    } : null,
    model: {
      architecture: metrics.architecture,
      parameterCount: metrics.parameterCount,
      samples: metrics.samples,
      trainSteps: metrics.trainSteps,
      replayCount: metrics.replayCount,
      loss: metrics.loss,
      accuracy: metrics.accuracy,
      confidence: metrics.confidence,
      classDiversity: metrics.classDiversity,
      frozen: state.time < state.mutations.gradientFreezeUntil,
      freezeRemaining: Math.max(0, state.mutations.gradientFreezeUntil - state.time),
    },
    breaks: state.breaks,
    damageMultiplier: state.boss.weakness > 0 ? WEAKNESS_MULTIPLIER : BOSS_ARMOR,
    mutationPending: state.mutationPending,
    mutations: {
      labelFlipCharges: state.mutations.labelFlipCharges,
      ghostBranchCharges: state.mutations.ghostBranchCharges,
      chosen: [...state.mutations.chosen],
    },
    stats: { ...state.stats },
  };
}

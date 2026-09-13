import { terminalShapeHits } from './terminalObjectives.js';

export const TERMINAL_PATTERN_LABELS = Object.freeze({
  eclipseShelter: ['일식 심판', '청록 피난 원 안으로 이동'],
  relayCrossfire: ['중계 교차 포격', '가로·세로 공격선 사이로 이동'],
  solarSweep: ['태양 추적 광선', '회전 광선 뒤쪽으로 이동'],
  railBarrage: ['궤도 열차포', '숫자 순서대로 터지는 선로 밖으로 이동'],
  wakeMines: ['잔향 기뢰', '방금 지나온 붉은 원으로 돌아가지 않기'],
  gravityWake: ['중력 파문', '고리의 열린 틈으로 통과'],
  verdictGrid: ['반전 판결', '첫 폭발 뒤 반대 칸으로 이동'],
  memoryReplay: ['경로 재판', '기록된 이동 경로에서 벗어나기'],
  throneCollapse: ['왕좌 붕괴', '차례로 나타나는 피난 원으로 이동'],
});
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const circle = (x, y, radius) => ({ kind: 'circle', x, y, radius });
const line = (x, y, x2, y2, width) => ({ kind: 'line', x, y, x2, y2, width });

export function recordTerminalBossHistory(state, dt) {
  const boss = state.boss;
  boss.historyTimer = (boss.historyTimer || 0) - dt;
  if (boss.historyTimer > 0) return;
  boss.historyTimer = .5;
  boss.terminalHistory ??= [];
  boss.terminalHistory.push({ x: state.player.x, y: state.player.y });
  if (boss.terminalHistory.length > 7) boss.terminalHistory.shift();
}

export function beginTerminalBossPattern(state, emit) {
  const boss = state.boss, player = state.player;
  const type = boss.patterns[boss.patternIndex++ % boss.patterns.length];
  const stage = boss.stage, zones = [];
  const warning = stage === 3 ? 1.8 : stage === 2 ? 2.1 : 2.5;
  const add = (shape, start = 0, lead = warning, duration = .7, damage = 78) => zones.push({
    shape, start, warning: lead, duration, damage, hit: false, fired: false,
  });
  const history = boss.terminalHistory?.length ? boss.terminalHistory : [{ x: player.x, y: player.y }];
  if (type === 'eclipseShelter') {
    const x = clamp(player.x + (player.x < 960 ? 320 : -320), 540, 1360), y = clamp(player.y, 310, 770);
    add({ kind: 'outside', x, y, radius: 215 }, 0, 3.1, .85, 110);
    if (stage >= 2) add({ kind: 'outside', x: 1920 - x, y: 1080 - y, radius: 215 }, 4.2, 2.8, .8, 110);
  } else if (type === 'relayCrossfire') {
    for (const dx of [-250, 0, 250]) add(line(clamp(player.x + dx, 280, 1640), 80, clamp(player.x + dx, 280, 1640), 1000, 86));
    for (const dy of [-200, 200]) add(line(80, clamp(player.y + dy, 180, 900), 1840, clamp(player.y + dy, 180, 900), 86), 2.9, 1.9);
  } else if (type === 'solarSweep') {
    const angle = Math.atan2(player.y - boss.y, player.x - boss.x) - .9;
    add({ ...line(boss.x, boss.y, boss.x + Math.cos(angle) * 1800, boss.y + Math.sin(angle) * 1800, 82), angle, sweep: 1.8 }, 0, 2.5, 3, 95);
  } else if (type === 'railBarrage') {
    const ys = [clamp(player.y, 220, 860), 250, 830, 540].slice(0, stage + 1);
    ys.forEach((y, i) => add(line(70, y, 1850, y, 165), i * .8, 2.3, .7, 92));
  } else if (type === 'wakeMines') {
    history.slice(-(3 + stage)).forEach((p, i) => add(circle(p.x, p.y, 125), i * .38, 2.2, .65, 86));
  } else if (type === 'gravityWake') {
    const angle = Math.atan2(player.y - 540, player.x - 1050);
    for (let i = 0; i < stage + 1; i++) add({ kind: 'ring', x: 1050, y: 540, radius: 150, width: 64,
      gap: angle + i * .45, gapWidth: .62, expand: 1100 }, i * 1.2, 1.9, 3.5, 80);
  } else if (type === 'verdictGrid') {
    for (let phase = 0; phase < 2; phase++) for (let col = 0; col < 5; col++) for (let row = 0; row < 3; row++) {
      if ((col + row + phase) % 2 !== boss.patternIndex % 2) continue;
      add({ kind: 'rect', x: 320 + col * 320, y: 270 + row * 270, w: 304, h: 254 }, phase * 3.6, phase ? 1.8 : 2.6, .75, 105);
    }
  } else if (type === 'memoryReplay') {
    history.forEach((p, i) => {
      add(circle(p.x, p.y, 130), i * .32, 2.3, .7, 90);
      if (i && stage >= 2) add(line(history[i - 1].x, history[i - 1].y, p.x, p.y, 100), i * .32, 2.3, .7, 90);
    });
  } else if (type === 'throneCollapse') {
    const x = player.x < 960 ? 720 : 1200;
    for (let i = 0; i < (stage >= 3 ? 3 : 2); i++) add({ kind: 'outside', x: i % 2 ? 1920 - x : x,
      y: i % 2 ? 700 : 380, radius: 220 }, i * 3.8, 2.8, .75, 120);
  }
  const duration = Math.max(...zones.map(z => z.start + z.warning + z.duration));
  const pattern = { terminal: true, type, phase: 'warning', elapsed: 0, zones, duration, life: duration, maxLife: duration,
    x: boss.x, y: boss.y, label: TERMINAL_PATTERN_LABELS[type][0], advice: TERMINAL_PATTERN_LABELS[type][1], hit: false };
  boss.activePattern = pattern;
  boss.animationState = 'windup'; boss.animationTimer = warning; boss.attackTimer = warning;
  emit('bossPatternTelegraph', { pattern: type, title: pattern.label, message: pattern.advice, stage });
}

export function stepTerminalBossPattern(state, dt, damage, emit) {
  const boss = state.boss, p = boss.activePattern;
  if (!p?.terminal) return;
  p.elapsed += dt; p.life = Math.max(0, p.duration - p.elapsed);
  let active = false;
  for (const z of p.zones) {
    const age = p.elapsed - z.start - z.warning;
    if (age < 0 || age > z.duration) continue;
    active = true;
    if (!z.fired) { z.fired = true; emit('bossPatternFire', { pattern: p.type }); }
    const shape = z.shape;
    if (shape.sweep) {
      const angle = shape.angle + shape.sweep * clamp(age / z.duration, 0, 1);
      shape.x2 = shape.x + Math.cos(angle) * 1800; shape.y2 = shape.y + Math.sin(angle) * 1800;
    }
    if (shape.expand) shape.radius = 150 + shape.expand * clamp(age / z.duration, 0, 1);
    if (!z.hit && terminalShapeHits(shape, state.player) && damage(z.damage, `boss:${p.type}`)) {
      z.hit = true; p.hit = true; state.stats.bossPatternsHit++;
    }
  }
  p.phase = active ? 'active' : 'warning';
  boss.animationState = active ? 'attack' : 'windup'; boss.animationTimer = .2; boss.attackTimer = .2;
  if (p.elapsed >= p.duration) {
    if (!p.hit) state.stats.bossPatternsDodged++;
    boss.activePattern = null;
    boss.weakness = p.hit ? 1.8 : 3.2;
    boss.patternCooldown = boss.weakness + .7;
    emit('objectiveCheckpoint', { text: p.hit ? '코어 노출 · 반격 기회' : '완전 회피 · 코어 장시간 노출' });
  }
}

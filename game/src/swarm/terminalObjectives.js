import { TERMINAL_CAMPAIGN } from '../game/content/terminalCampaign.js';

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const center = Object.freeze({ x: 2048, y: 2048 });
const point = (id, label, x, y, radius = 145) => ({ id, label, x, y, radius, charge: 0, complete: false });
const nearEnemies = (state, target, range) => state.enemies.filter(e => !e.dead && !(e.spawnDelay > 0) && distance(e, target) < range);

export function createTerminalObjective(regionId) {
  const definition = TERMINAL_CAMPAIGN[regionId];
  if (!definition) return null;
  const kind = definition.missionKind;
  return {
    kind, title: definition.koreanName, elapsed: 0, complete: false, failed: false,
    progress: 0, deposited: 0, carrying: null, channel: 0, nextHazard: 12, nextSpawn: 4,
    hazards: [], serial: 0, milestones: [], route: null, checkpoint: 0, message: '',
    nodes: kind === 'relays' ? [point('a', '서부 중계기', 1300, 1530), point('b', '동부 중계기', 2790, 1510), point('c', '남부 중계기', 2048, 2860)]
      : kind === 'keys' ? [point('a', '기록 인증고', 1300, 1370), point('b', '생존 인증고', 2820, 1490), point('c', '판결 인증고', 2420, 2900)] : [],
    hub: point('hub', kind === 'relays' ? '중앙 송신대' : '중앙 접속대', center.x, center.y, 170),
    ark: kind === 'escort' ? { x: 1450, y: 2048, hp: 720, maxHp: 720, radius: 84, moving: false } : null,
    routeChoices: [point('fast', '고속 항로 · 포격 증가', 2160, 1660, 170), point('safe', '정비 항로 · 선체 수리', 2160, 2440, 170)],
    waypoints: [{ x: 1970, y: 2048 }],
  };
}

function milestone(m, text) { m.milestones.push(text); }
function finish(m) { m.complete = true; m.progress = 1; m.hazards.length = 0; m.message = '작전 목표 달성 · 보스 구역 연결'; }

// A single geometry representation owns both hit testing and the warning art.
export function terminalShapeHits(shape, player) {
  const r = player.radius || 0;
  if (shape.kind === 'circle') return distance(shape, player) <= shape.radius + r;
  if (shape.kind === 'outside') return distance(shape, player) > Math.max(0, shape.radius - r);
  if (shape.kind === 'rect') return Math.abs(player.x - shape.x) <= shape.w / 2 + r && Math.abs(player.y - shape.y) <= shape.h / 2 + r;
  if (shape.kind === 'line') {
    const dx = shape.x2 - shape.x, dy = shape.y2 - shape.y;
    const t = Math.max(0, Math.min(1, ((player.x - shape.x) * dx + (player.y - shape.y) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(player.x - shape.x - dx * t, player.y - shape.y - dy * t) <= shape.width / 2 + r;
  }
  if (shape.kind === 'ring') {
    const angle = Math.atan2(player.y - shape.y, player.x - shape.x);
    const diff = Math.atan2(Math.sin(angle - shape.gap), Math.cos(angle - shape.gap));
    return Math.abs(distance(shape, player) - shape.radius) <= shape.width / 2 + r && Math.abs(diff) > shape.gapWidth;
  }
  return false;
}

function updateHazards(state, m, dt, damage) {
  for (const h of m.hazards) {
    h.elapsed += dt;
    if (!h.fired && h.elapsed >= h.warning) {
      h.fired = true;
      if (terminalShapeHits(h.shape, state.player)) damage(44, 'orbitalStrike');
      if (m.ark && terminalShapeHits(h.shape, m.ark)) m.ark.hp = Math.max(0, m.ark.hp - 36);
    }
  }
  m.hazards = m.hazards.filter(h => h.elapsed < h.warning + .65);
  m.nextHazard -= dt;
  if (m.nextHazard > 0) return;
  m.nextHazard = m.kind === 'escort' ? (m.route === 'fast' ? 4.8 : 10) : m.carrying ? 4.8 : 9;
  const target = m.kind === 'escort' && m.route === 'fast' && m.serial % 2 === 0 ? m.ark : state.player;
  m.hazards.push({ id: ++m.serial, elapsed: 0, warning: 2.4, fired: false,
    shape: { kind: 'circle', x: target.x, y: target.y, radius: m.kind === 'escort' ? 122 : 150 } });
}

export function stepTerminalObjective(state, dt, damage) {
  const m = state.expedition?.mission;
  if (!m || m.complete || m.failed || state.phase !== 'swarm') return;
  m.elapsed += dt;
  updateHazards(state, m, dt, damage);
  const player = state.player;
  if (m.kind === 'relays') {
    for (const node of m.nodes) {
      if (node.complete || distance(player, node) > node.radius) continue;
      const jammed = nearEnemies(state, node, 185).length > 0;
      m.message = jammed ? '중계기 근처 적을 처치하면 점령이 이어집니다' : `${node.label} 연결 중`;
      if (!jammed) node.charge = Math.min(10, node.charge + dt);
      if (node.charge >= 10) { node.complete = true; milestone(m, `${node.label} 확보`); }
    }
    const captured = m.nodes.filter(n => n.complete).length;
    if (captured === 3) {
      m.message = '중앙 송신대 원 안에서 연결을 유지하세요';
      if (distance(player, m.hub) <= m.hub.radius && !nearEnemies(state, m.hub, 160).length) m.channel += dt;
      if (m.channel >= 14) finish(m);
    } else if (!m.nodes.some(n => !n.complete && distance(player, n) <= n.radius)) m.message = `중계기 ${captured}/3 · 원 안에서 점령`;
    m.progress = Math.min(1, (captured + m.nodes.filter(n => !n.complete).reduce((s, n) => s + n.charge / 10, 0)) / 4 + m.channel / 56);
  } else if (m.kind === 'escort') {
    const ark = m.ark;
    const blockers = nearEnemies(state, ark, 195);
    const escorting = distance(player, ark) <= 310;
    ark.moving = false;
    ark.hp = Math.max(0, ark.hp - Math.min(3, blockers.length) * 5 * dt);
    if (m.checkpoint === 1 && !m.route) {
      m.message = '방주 정지 · 위쪽 고속 / 아래쪽 정비 항로로 이동해 선택';
      const choice = m.routeChoices.find(n => distance(player, n) < n.radius);
      if (choice) {
        m.route = choice.id;
        m.waypoints.push(...(choice.id === 'fast' ? [{ x: 2590, y: 1670 }, { x: 3270, y: 2048 }]
          : [{ x: 2300, y: 2700 }, { x: 2980, y: 2700 }, { x: 3270, y: 2048 }]));
        milestone(m, choice.id === 'fast' ? '고속 항로 선택' : '정비 항로 선택');
      }
    } else {
      const target = m.waypoints[m.checkpoint];
      m.message = blockers.length ? '방주 주변 적을 처치하세요 · 선체 손상 중' : !escorting ? '방주 곁으로 돌아가세요 · 호위 범위 310m' : '방주 호송 중 · 포격 경고에서 벗어나세요';
      if (target && escorting && !blockers.length) {
        const d = distance(ark, target), move = Math.min(d, (m.route === 'fast' ? 102 : 84) * dt);
        if (d > 0) { ark.x += (target.x - ark.x) / d * move; ark.y += (target.y - ark.y) / d * move; ark.moving = true; }
        if (d <= 6) {
          m.checkpoint++;
          milestone(m, '방주 항로 체크포인트 통과');
          if (m.checkpoint >= m.waypoints.length && m.route) finish(m);
        }
        if (m.route === 'safe') ark.hp = Math.min(ark.maxHp, ark.hp + 2.5 * dt);
      }
    }
    m.progress = m.complete ? 1 : Math.min(.95, .18 * m.checkpoint + Math.max(0, ark.x - 1450) / 10000);
    if (ark.hp <= 0) { m.failed = true; m.message = '방주 선체 파괴 · 호송 실패'; }
  } else {
    if (!m.carrying) {
      for (const node of m.nodes) {
        if (node.complete || distance(player, node) > node.radius) continue;
        node.charge = Math.min(6, node.charge + dt);
        if (node.charge >= 6) { m.carrying = node.id; node.complete = true; milestone(m, `${node.label} 키 회수`); break; }
      }
    } else if (distance(player, m.hub) <= m.hub.radius) {
      m.carrying = null; m.deposited++; milestone(m, `인증 키 ${m.deposited}/3 전달`);
    }
    m.message = m.carrying ? '인증 키 운반 중 · 중앙 접속대로 복귀' : `인증 키 ${m.deposited}/3 · 인증고의 원 안에서 회수`;
    if (m.deposited === 3) {
      m.message = '최종 접속 · 중앙의 원 안에서 16초 유지';
      if (distance(player, m.hub) <= m.hub.radius) m.channel += dt;
      if (m.channel >= 16) finish(m);
    }
    m.progress = Math.min(1, m.deposited / 4 + (m.carrying ? .1 : 0) + m.channel / 64);
  }
  if (m.complete) { m.progress = 1; m.message = '작전 목표 달성 · 보스 구역 연결'; }
}

export function getTerminalTargets(m) {
  if (!m || m.complete) return [];
  if (m.kind === 'escort') return m.checkpoint === 1 && !m.route ? m.routeChoices : [{ ...m.ark, id: 'ark', label: '생존자 방주', radius: 310 }];
  if (m.kind === 'relays') return m.nodes.every(n => n.complete) ? [m.hub] : m.nodes.filter(n => !n.complete);
  return m.carrying || m.deposited === 3 ? [m.hub] : m.nodes.filter(n => !n.complete);
}

export function getTerminalHud(state) {
  const m = state.expedition?.mission;
  if (!m) return null;
  const targets = getTerminalTargets(m).map(n => ({ id: n.id, label: n.label, x: n.x, y: n.y, radius: n.radius,
    distance: Math.round(distance(n, state.player)), angle: Math.atan2(n.y - state.player.y, n.x - state.player.x),
    progress: n.id === 'hub' ? m.channel / (m.kind === 'keys' ? 16 : 14) : n.charge / (m.kind === 'keys' ? 6 : 10) || 0,
  })).sort((a, b) => a.distance - b.distance);
  return { kind: m.kind, title: m.title, message: m.message, progress: m.progress, complete: m.complete,
    captured: m.nodes.filter(n => n.complete).length, deposited: m.deposited, carrying: Boolean(m.carrying),
    channel: m.channel, route: m.route, ark: m.ark ? { hp: m.ark.hp, maxHp: m.ark.maxHp, moving: m.ark.moving } : null, targets };
}

export const GAME_WIDTH = 1000;
export const GAME_HEIGHT = 562;
export const WORLD_WIDTH = 1800;
export const WORLD_HEIGHT = 1012;
export const PLAYER_RADIUS = 13;

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function rect(x, y, width, height) {
  return { type: "rect", x, y, width, height };
}

function ring(cx, cy, innerRadius, outerRadius) {
  return { type: "ring", cx, cy, innerRadius, outerRadius };
}

function segment(start, end, width) {
  return { type: "segment", start, end, width };
}

const SWITCHYARD_AREAS = [
  rect(65, 338, 345, 340),
  rect(280, 95, 1260, 185),
  rect(280, 735, 1260, 190),
  rect(270, 170, 175, 680),
  rect(1370, 170, 175, 680),
  rect(1395, 325, 345, 365),
];

const ARCHIVE_AREAS = [
  rect(710, 785, 310, 180),
  rect(650, 680, 260, 225),
  rect(190, 625, 500, 260),
  rect(370, 420, 250, 300),
  rect(190, 355, 450, 260),
  rect(365, 185, 270, 270),
  rect(190, 105, 500, 235),
  rect(560, 80, 500, 250),
  rect(900, 120, 370, 180),
  rect(1130, 35, 390, 900),
  rect(900, 690, 430, 170),
];

const REACTOR_CENTER = { x: 900, y: 506 };
const REACTOR_AREAS = [
  ring(REACTOR_CENTER.x, REACTOR_CENTER.y, 330, 545),
  ring(REACTOR_CENTER.x, REACTOR_CENTER.y, 145, 285),
  segment({ x: 345, y: 506 }, { x: 630, y: 506 }, 150),
  segment({ x: 1170, y: 506 }, { x: 1460, y: 506 }, 150),
  segment({ x: 520, y: 180 }, { x: 700, y: 340 }, 125),
  segment({ x: 520, y: 830 }, { x: 700, y: 670 }, 125),
  segment({ x: 1100, y: 340 }, { x: 1280, y: 180 }, 125),
  segment({ x: 1100, y: 670 }, { x: 1280, y: 830 }, 125),
  rect(55, 405, 365, 205),
  rect(1400, 330, 345, 350),
];

const STAGE_ROUTE_PATHS = [
  {
    left: [
      { x: 180, y: 506 }, { x: 350, y: 420 }, { x: 365, y: 190 },
      { x: 900, y: 185 }, { x: 1440, y: 190 }, { x: 1460, y: 500 },
      { x: 1605, y: 506 },
    ],
    right: [
      { x: 180, y: 506 }, { x: 350, y: 610 }, { x: 365, y: 825 },
      { x: 900, y: 825 }, { x: 1440, y: 825 }, { x: 1460, y: 520 },
      { x: 1605, y: 506 },
    ],
  },
  {
    left: [
      { x: 860, y: 875 }, { x: 610, y: 755 }, { x: 430, y: 755 },
      { x: 500, y: 510 }, { x: 430, y: 245 }, { x: 680, y: 185 },
      { x: 850, y: 160 },
    ],
    right: [
      { x: 860, y: 875 }, { x: 1100, y: 770 }, { x: 1300, y: 770 },
      { x: 1330, y: 500 }, { x: 1320, y: 190 }, { x: 1040, y: 190 },
      { x: 850, y: 160 },
    ],
  },
  {
    left: [
      { x: 160, y: 506 }, { x: 390, y: 475 }, { x: 500, y: 230 },
      { x: 900, y: 95 }, { x: 1300, y: 230 }, { x: 1420, y: 480 },
      { x: 1620, y: 506 },
    ],
    right: [
      { x: 160, y: 506 }, { x: 390, y: 540 }, { x: 500, y: 785 },
      { x: 900, y: 920 }, { x: 1300, y: 785 }, { x: 1420, y: 535 },
      { x: 1620, y: 506 },
    ],
  },
];

export const STAGE_CONFIGS = [
  {
    id: "switchyard",
    eyebrow: "STAGE 01",
    code: "CALIBRATION NEXUS",
    title: "화물 교차장",
    mapSrc: "./assets/generated/facility-map-switchyard-v3.png",
    accent: "#42efff",
    timeLimit: 78,
    worldWidth: WORLD_WIDTH,
    worldHeight: WORLD_HEIGHT,
    start: { x: 175, y: 506 },
    core: { x: 1605, y: 506 },
    extraction: { x: 175, y: 506 },
    walkableAreas: SWITCHYARD_AREAS,
    routeAxis: "y",
    routeLabels: { left: "UPPER / 상부 레일", right: "LOWER / 하부 터널" },
    routePaths: STAGE_ROUTE_PATHS[0],
  },
  {
    id: "archive-maze",
    eyebrow: "STAGE 02",
    code: "POISONED ARCHIVES",
    title: "기록 보관 미로",
    mapSrc: "./assets/generated/facility-map-archive-maze-v2.png",
    accent: "#9f72ff",
    timeLimit: 98,
    worldWidth: WORLD_WIDTH,
    worldHeight: WORLD_HEIGHT,
    start: { x: 855, y: 875 },
    core: { x: 850, y: 155 },
    extraction: { x: 855, y: 875 },
    walkableAreas: ARCHIVE_AREAS,
    routeAxis: "x",
    routeLabels: { left: "WEST / 서쪽 미로", right: "EAST / 서버 협곡" },
    routePaths: STAGE_ROUTE_PATHS[1],
  },
  {
    id: "reactor-ring",
    eyebrow: "STAGE 03",
    code: "BETRAYAL REACTOR",
    title: "반응로 링 금고",
    mapSrc: "./assets/generated/facility-map-reactor-ring-v2.png",
    accent: "#ff4b63",
    timeLimit: 118,
    worldWidth: WORLD_WIDTH,
    worldHeight: WORLD_HEIGHT,
    start: { x: 155, y: 506 },
    core: { x: 1615, y: 506 },
    extraction: { x: 155, y: 506 },
    walkableAreas: REACTOR_AREAS,
    routeAxis: "y",
    routeLabels: { left: "NORTH / 북쪽 링", right: "SOUTH / 남쪽 링" },
    routePaths: STAGE_ROUTE_PATHS[2],
  },
];

export const START_POSITION = STAGE_CONFIGS[0].start;
export const CORE_POSITION = STAGE_CONFIGS[0].core;
export const EXTRACTION_POSITION = STAGE_CONFIGS[0].extraction;
export const FACILITY_BOUNDS = { minX: 0, minY: 0, maxX: WORLD_WIDTH, maxY: WORLD_HEIGHT };
export const WALLS = [];
export const ROUTE_PATHS = STAGE_ROUTE_PATHS[0];

export function getStageConfig(stageIndex = 0) {
  return STAGE_CONFIGS[clamp(stageIndex, 0, STAGE_CONFIGS.length - 1)];
}

function pointSegmentDistance(point, start, end) {
  const lengthSquared = (end.x - start.x) ** 2 + (end.y - start.y) ** 2;
  if (lengthSquared === 0) return distance(point, start);
  const amount = clamp(
    ((point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y)) / lengthSquared,
    0,
    1,
  );
  return distance(point, {
    x: start.x + (end.x - start.x) * amount,
    y: start.y + (end.y - start.y) * amount,
  });
}

function areaContainsPoint(area, point, radius = 0) {
  if (area.type === "rect") {
    return point.x >= area.x + radius
      && point.x <= area.x + area.width - radius
      && point.y >= area.y + radius
      && point.y <= area.y + area.height - radius;
  }
  if (area.type === "ring") {
    const radialDistance = Math.hypot(point.x - area.cx, point.y - area.cy);
    return radialDistance >= area.innerRadius + radius
      && radialDistance <= area.outerRadius - radius;
  }
  if (area.type === "segment") {
    return pointSegmentDistance(point, area.start, area.end) <= area.width / 2 - radius;
  }
  return false;
}

export function positionIsWalkable(point, stageIndex = 0, radius = PLAYER_RADIUS) {
  return getStageConfig(stageIndex).walkableAreas.some((area) => areaContainsPoint(area, point, radius));
}

export function movePlayer(position, deltaX, deltaY, stageIndex = 0) {
  const nextX = { x: position.x + deltaX, y: position.y };
  if (!positionIsWalkable(nextX, stageIndex)) nextX.x = position.x;
  const nextY = { x: nextX.x, y: position.y + deltaY };
  if (!positionIsWalkable(nextY, stageIndex)) nextY.y = position.y;
  return nextY;
}

export function segmentIsBlocked(start, end, stageIndex = 0) {
  const samples = Math.max(8, Math.ceil(distance(start, end) / 12));
  for (let index = 1; index < samples; index += 1) {
    const amount = index / samples;
    const point = {
      x: start.x + (end.x - start.x) * amount,
      y: start.y + (end.y - start.y) * amount,
    };
    if (!positionIsWalkable(point, stageIndex, 0)) return true;
  }
  return false;
}

export function normalizeAngle(angle) {
  let normalized = angle;
  while (normalized > Math.PI) normalized -= Math.PI * 2;
  while (normalized < -Math.PI) normalized += Math.PI * 2;
  return normalized;
}

export function playerIsVisible(drone, player, stageIndex = 0, visibilityMultiplier = 1) {
  const range = distance(drone, player);
  if (range > 168 * visibilityMultiplier || segmentIsBlocked(drone, player, stageIndex)) return false;
  const playerAngle = Math.atan2(player.y - drone.y, player.x - drone.x);
  return Math.abs(normalizeAngle(playerAngle - drone.facing)) < 0.48;
}

export function detectionGainPerSecond(droneObservers, enforcerObservers, ghostActive = false) {
  const droneGain = droneObservers > 0 ? 0.32 + droneObservers * 0.12 : 0;
  const enforcerGain = enforcerObservers * 0.065;
  return (droneGain + enforcerGain) * (ghostActive ? 0.66 : 1);
}

function pathLength(path) {
  let length = 0;
  for (let index = 0; index < path.length; index += 1) {
    length += distance(path[index], path[(index + 1) % path.length]);
  }
  return length;
}

export function samplePatrol(path, elapsed, speed, phase = 0) {
  const totalLength = pathLength(path);
  let cursor = (elapsed * speed + totalLength * phase) % totalLength;
  for (let index = 0; index < path.length; index += 1) {
    const start = path[index];
    const end = path[(index + 1) % path.length];
    const segmentLength = distance(start, end);
    if (cursor <= segmentLength) {
      const amount = cursor / Math.max(segmentLength, 1);
      return {
        x: start.x + (end.x - start.x) * amount,
        y: start.y + (end.y - start.y) * amount,
        facing: Math.atan2(end.y - start.y, end.x - start.x),
      };
    }
    cursor -= segmentLength;
  }
  return { ...path[0], facing: 0 };
}

function catmullRom(previous, start, end, next, amount) {
  const amount2 = amount * amount;
  const amount3 = amount2 * amount;
  return {
    x: 0.5 * ((2 * start.x) + (-previous.x + end.x) * amount
      + (2 * previous.x - 5 * start.x + 4 * end.x - next.x) * amount2
      + (-previous.x + 3 * start.x - 3 * end.x + next.x) * amount3),
    y: 0.5 * ((2 * start.y) + (-previous.y + end.y) * amount
      + (2 * previous.y - 5 * start.y + 4 * end.y - next.y) * amount2
      + (-previous.y + 3 * start.y - 3 * end.y + next.y) * amount3),
  };
}

export function samplePatrolSmooth(path, elapsed, speed, phase = 0) {
  if (path.length < 3) return samplePatrol(path, elapsed, speed, phase);
  const averageSegmentLength = pathLength(path) / path.length;
  const progress = (elapsed * speed) / Math.max(averageSegmentLength, 1) + path.length * phase;
  const segmentIndex = Math.floor(progress) % path.length;
  const amount = progress - Math.floor(progress);
  const previous = path[(segmentIndex - 1 + path.length) % path.length];
  const start = path[segmentIndex];
  const end = path[(segmentIndex + 1) % path.length];
  const next = path[(segmentIndex + 2) % path.length];
  const position = catmullRom(previous, start, end, next, amount);
  const future = catmullRom(previous, start, end, next, Math.min(1, amount + 0.018));
  return { ...position, facing: Math.atan2(future.y - position.y, future.x - position.x) };
}

function createRingPath(radius, phase = 0) {
  return Array.from({ length: 16 }, (_, index) => {
    const angle = phase + (index / 16) * Math.PI * 2;
    return {
      x: REACTOR_CENTER.x + Math.cos(angle) * radius,
      y: REACTOR_CENTER.y + Math.sin(angle) * radius,
    };
  });
}

const SWITCHYARD_PATROL = [
  { x: 370, y: 205 }, { x: 780, y: 185 }, { x: 1230, y: 185 },
  { x: 1450, y: 260 }, { x: 1460, y: 510 }, { x: 1450, y: 770 },
  { x: 1200, y: 830 }, { x: 760, y: 830 }, { x: 370, y: 805 }, { x: 350, y: 500 },
];

const ARCHIVE_LEFT_PATROL = [
  { x: 520, y: 760 }, { x: 470, y: 560 }, { x: 450, y: 260 },
  { x: 650, y: 180 }, { x: 520, y: 275 }, { x: 500, y: 540 },
];

const ARCHIVE_RIGHT_PATROL = [
  { x: 1210, y: 780 }, { x: 1340, y: 760 }, { x: 1340, y: 490 },
  { x: 1310, y: 190 }, { x: 1160, y: 210 }, { x: 1240, y: 500 },
];

export function getDroneDefinitions(stageIndex, predictedSide) {
  if (stageIndex === 0) {
    return [{ path: SWITCHYARD_PATROL, speed: 58, phase: predictedSide === "left" ? 0.08 : 0.58, type: "sentinel" }];
  }
  if (stageIndex === 1) {
    return [
      { path: predictedSide === "left" ? ARCHIVE_LEFT_PATROL : ARCHIVE_RIGHT_PATROL, speed: 60, phase: 0.22, type: "hunter" },
      { path: predictedSide === "left" ? ARCHIVE_RIGHT_PATROL : ARCHIVE_LEFT_PATROL, speed: 48, phase: 0.64, type: "gate" },
    ];
  }
  return [
    { path: createRingPath(455), speed: 66, phase: predictedSide === "left" ? 0.62 : 0.12, type: "hunter" },
    { path: createRingPath(225, Math.PI / 8), speed: 52, phase: 0.36, type: "sentinel" },
    { path: createRingPath(430, Math.PI / 16), speed: 58, phase: 0.7, type: "gate" },
  ];
}

export function getEnforcerDefinitions(stageIndex, predictedSide) {
  if (stageIndex === 0) return [];
  if (stageIndex === 1) {
    return [{
      path: predictedSide === "left" ? ARCHIVE_LEFT_PATROL : ARCHIVE_RIGHT_PATROL,
      speed: 38, phase: 0.52, hp: 2, type: "rifle",
    }];
  }
  return [
    { path: createRingPath(475), speed: 40, phase: predictedSide === "left" ? 0.62 : 0.12, hp: 3, type: "rifle" },
    { path: createRingPath(405, Math.PI / 16), speed: 38, phase: predictedSide === "left" ? 0.12 : 0.62, hp: 3, type: "rifle" },
  ];
}

export function createModel() {
  return { left: 1, right: 1 };
}

export function determineRoute(trace, fallbackPosition, stageIndex = 0) {
  const stage = getStageConfig(stageIndex);
  const fallback = fallbackPosition ?? stage.start;
  let leftSignal = 0;
  let rightSignal = 0;
  for (const point of trace) {
    if (stage.routeAxis === "x") {
      if (point.x < WORLD_WIDTH * 0.43) leftSignal += (WORLD_WIDTH * 0.43 - point.x) / 220 + 0.2;
      if (point.x > WORLD_WIDTH * 0.57) rightSignal += (point.x - WORLD_WIDTH * 0.57) / 220 + 0.2;
    } else {
      if (point.y < WORLD_HEIGHT * 0.43) leftSignal += (WORLD_HEIGHT * 0.43 - point.y) / 170 + 0.2;
      if (point.y > WORLD_HEIGHT * 0.57) rightSignal += (point.y - WORLD_HEIGHT * 0.57) / 170 + 0.2;
    }
  }
  if (Math.abs(leftSignal - rightSignal) < 0.2) {
    return stage.routeAxis === "x"
      ? fallback.x < WORLD_WIDTH / 2 ? "left" : "right"
      : fallback.y < WORLD_HEIGHT / 2 ? "left" : "right";
  }
  return leftSignal > rightSignal ? "left" : "right";
}

export function learnRoute(model, side) {
  const next = { ...model };
  next[side] += 4;
  next[side === "left" ? "right" : "left"] += 0.2;
  return next;
}

export function readPrediction(model) {
  const total = model.left + model.right;
  const side = model.left >= model.right ? "left" : "right";
  return { side, confidence: model[side] / total };
}

export function createRuntime(stageIndex, predictedSide) {
  const stage = getStageConfig(stageIndex);
  const camera = {
    x: clamp(stage.start.x - GAME_WIDTH / 2, 0, stage.worldWidth - GAME_WIDTH),
    y: clamp(stage.start.y - GAME_HEIGHT / 2, 0, stage.worldHeight - GAME_HEIGHT),
  };
  return {
    player: { ...stage.start },
    camera,
    moveTarget: null,
    facing: stageIndex === 1 ? -Math.PI / 2 : 0,
    trace: [{ ...stage.start }],
    drones: getDroneDefinitions(stageIndex, predictedSide).map((definition) => ({
      ...samplePatrolSmooth(definition.path, 0, definition.speed, definition.phase), definition,
    })),
    enforcers: getEnforcerDefinitions(stageIndex, predictedSide).map((definition, index) => ({
      ...samplePatrolSmooth(definition.path, 0, definition.speed, definition.phase),
      definition,
      id: `enforcer-${stageIndex}-${index}`,
      hp: definition.hp,
      maxHp: definition.hp,
      fireCooldown: 0.9 + index * 0.42,
      firePulse: 0,
      visible: false,
      targetingDecoy: false,
    })),
    playerProjectiles: [],
    enemyProjectiles: [],
    playerHealth: 5,
    maxPlayerHealth: 5,
    damageInvulnerability: 0,
    weaponCooldown: 0,
    shieldRemaining: 0,
    empRemaining: 0,
    abilityCooldowns: { shield: 0, emp: 0 },
    runElapsed: 0,
    sampleElapsed: 0,
    hudElapsed: 0,
    timeLeft: stage.timeLimit,
    detection: 0,
    detectionBand: 0,
    droneObservers: 0,
    enforcerObservers: 0,
    dashCooldown: 0,
    dashRemaining: 0,
    dashDirection: { x: stageIndex === 1 ? 0 : 1, y: stageIndex === 1 ? -1 : 0 },
    dashAfterimageElapsed: 0,
    afterimages: [],
    velocity: { x: 0, y: 0 },
    actualSpeed: 0,
    animationState: "idle",
    animationElapsed: 0,
    hitPulse: 0,
    decoy: null,
    decoyAvailable: true,
    coreTaken: false,
    seenBy: 0,
  };
}

import rawBattlefields from "./battlefields.json" with { type: "json" };

const DEFAULT_BATTLEFIELD_ID = "haven-perimeter";

function freezePoint(point) {
  return Object.freeze({ x: Number(point.x), y: Number(point.y) });
}

function buildRoute(points) {
  const routePoints = Object.freeze(points.map(freezePoint));
  const segments = [];
  let totalLength = 0;
  for (let index = 0; index < routePoints.length - 1; index += 1) {
    const start = routePoints[index];
    const end = routePoints[index + 1];
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    segments.push(Object.freeze({ start, end, length, startDistance: totalLength }));
    totalLength += length;
  }
  return Object.freeze({ points: routePoints, segments: Object.freeze(segments), totalLength });
}

export const DEFENSE_BATTLEFIELDS = Object.freeze(Object.fromEntries(
  Object.entries(rawBattlefields).map(([stageId, source]) => [stageId, Object.freeze({
    id: stageId,
    assetSlug: source.assetSlug,
    routeColor: source.routeColor,
    core: freezePoint(source.core),
    routes: Object.freeze(source.routes.map(buildRoute)),
    nodes: Object.freeze(source.nodes.map((node) => Object.freeze({ id: node.id, x: Number(node.x), y: Number(node.y) }))),
  })]),
));

export function getDefenseBattlefield(stageId = DEFAULT_BATTLEFIELD_ID) {
  return DEFENSE_BATTLEFIELDS[stageId] || DEFENSE_BATTLEFIELDS[DEFAULT_BATTLEFIELD_ID];
}

export function sampleDefenseRoute(route, distance) {
  if (!route?.segments?.length) return Object.freeze({ x: 0, y: 0, angle: 0, progress: 0 });
  const clampedDistance = Math.max(0, Math.min(route.totalLength, Number(distance) || 0));
  let segment = route.segments[route.segments.length - 1];
  for (const candidate of route.segments) {
    if (clampedDistance <= candidate.startDistance + candidate.length) {
      segment = candidate;
      break;
    }
  }
  const localDistance = clampedDistance - segment.startDistance;
  const ratio = segment.length > 0 ? Math.max(0, Math.min(1, localDistance / segment.length)) : 0;
  const dx = segment.end.x - segment.start.x;
  const dy = segment.end.y - segment.start.y;
  return {
    x: segment.start.x + dx * ratio,
    y: segment.start.y + dy * ratio,
    angle: Math.atan2(dy, dx),
    progress: route.totalLength > 0 ? clampedDistance / route.totalLength : 1,
  };
}

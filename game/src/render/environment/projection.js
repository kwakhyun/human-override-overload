export const FLOOR_PITCH = Math.PI * 0.31;
export const FLOOR_SIN = Math.sin(FLOOR_PITCH);
export const FLOOR_COS = Math.cos(FLOOR_PITCH);

// Stretch depth before orthographic projection so the ground is exactly the
// existing simulation plane. An actor and an aim marker keep the same pixels.
export function toTerrainPosition(x, y, height = 0) {
  return { x, y: height, z: y / FLOOR_SIN };
}
export function projectedGroundPosition(x, y, height = 0) {
  return { x, y: y - height * FLOOR_COS };
}

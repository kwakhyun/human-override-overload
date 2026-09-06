// Compatibility exports for the original Sector 01 checks.
export { SECTOR_ONE_STRUCTURES } from './sectorOneStructures.js';
export { terrainContact, constrainTerrainActor, steerTerrainEnemy } from './regionalTerrain.js';
export function hasSectorOneTerrain(state) {
  return Boolean(state?.expedition && state.regionId === 'wrong-engine-core'
    && state.phase === 'swarm' && !state.expedition.bossRoom);
}

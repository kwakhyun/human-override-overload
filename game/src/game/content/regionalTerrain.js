// Shared authority for route geometry, collision, destruction and minimaps.
import { SECTOR_ONE_STRUCTURES } from './sectorOneStructures.js';
const sites = (prefix, rows) => Object.freeze(rows.map(([kind, x, y, radius, height, maxHp = 0], index) =>
  Object.freeze({ id: `${prefix}-${index}`, kind, x, y, radius, height, maxHp })));

export const REGIONAL_TERRAIN = Object.freeze({
  'wrong-engine-core': { style: 'transit', label: '01 // TRANSIT ARRAY', bossLabel: 'WRONG ENGINE // CORE',
    floor: 0x6b7d88, steel: 0x566871, dark: 0x192b34, trim: 0x839598, accent: 0x4bd1dc, secondary: 0xdb8643,
    sky: 0x061014, structures: SECTOR_ONE_STRUCTURES },
  'glass-dune': { style: 'glass', label: '02 // HELIOGLASS EXPANSE', bossLabel: 'PRISM // SOLAR CHAMBER',
    floor: 0x7e6851, steel: 0x706150, dark: 0x352b29, trim: 0xb6b1a1, accent: 0x68b5ce, secondary: 0xb99766,
    sky: 0x211d1a, structures: sites('glass', [
      ['crystal',1490,1780,96,185,240], ['mirror',2680,1750,106,230],
      ['mirror',1350,2500,110,240], ['crystal',2560,2500,100,200,240],
      ['crystal',1990,1100,110,230,300], ['mirror',2130,3100,100,225],
      ['mirror',810,910,118,240], ['crystal',3320,960,110,210,280],
      ['crystal',850,3240,118,220,280], ['mirror',3280,3260,120,235],
    ]) },
  'abyssal-archive': { style: 'archive', label: '03 // SUBMERGED RECORDS', bossLabel: 'ARCHIVE // MEMORY WELL',
    floor: 0x344553, steel: 0x4e6576, dark: 0x101e31, trim: 0x82949a, accent: 0x438da7, secondary: 0x8885be,
    sky: 0x050f1d, structures: sites('archive', [
      ['server',1430,1730,92,205,360], ['archive',2650,1790,106,255],
      ['archive',1470,2530,110,250], ['server',2660,2520,94,205,360],
      ['archive',2050,1010,115,270], ['server',2070,3160,106,225,400],
      ['server',790,860,106,220,400], ['archive',3280,910,118,260],
      ['archive',780,3270,112,255], ['server',3310,3200,104,225,400],
    ]) },
  'neon-foundry': { style: 'foundry', label: '04 // NEON CASTING LINE', bossLabel: 'FOUNDRY // PRESSURE CORE',
    floor: 0x554348, steel: 0x69565d, dark: 0x251b26, trim: 0x968182, accent: 0x9b4d87, secondary: 0xd37936,
    sky: 0x170d19, structures: sites('foundry', [
      ['furnace',1510,1720,96,155,340], ['press',2690,1760,110,235],
      ['press',1380,2560,116,240], ['furnace',2560,2530,96,160,340],
      ['press',2110,980,116,250], ['furnace',1950,3160,112,170,400],
      ['furnace',830,930,108,180,400], ['press',3290,850,118,255],
      ['press',780,3210,120,255], ['furnace',3250,3300,108,175,400],
    ]) },
  'storm-spire': { style: 'storm', label: '05 // STRATOSPHERE RELAY', bossLabel: 'SPIRE // STORM EYE',
    floor: 0x475266, steel: 0x697b90, dark: 0x20293d, trim: 0xa3acb8, accent: 0x608fc8, secondary: 0x9a85c8,
    sky: 0x141d31, structures: sites('storm', [
      ['capacitor',1480,1780,90,185,300], ['coil',2630,1700,100,270],
      ['coil',1510,2500,105,275], ['capacitor',2740,2500,90,190,300],
      ['coil',1980,1080,110,285], ['capacitor',2150,3100,110,205,360],
      ['capacitor',770,920,105,195,360], ['coil',3290,840,112,290],
      ['coil',850,3260,112,280], ['capacitor',3310,3230,104,200,360],
    ]) },
  'gene-vault': { style: 'gene', label: '06 // GENETIC CONTAINMENT', bossLabel: 'VAULT // CHIMERA NURSERY',
    floor: 0x495b4c, steel: 0x728677, dark: 0x1c2b24, trim: 0xa5afa0, accent: 0x84a85a, secondary: 0x638e8b,
    sky: 0x0a1912, structures: sites('gene', [
      ['pod',1430,1760,92,205,320], ['rib',2710,1800,112,240],
      ['rib',1390,2480,116,245], ['pod',2630,2540,96,210,320],
      ['rib',2110,1000,120,255], ['pod',1970,3160,106,225,380],
      ['pod',830,880,108,230,380], ['rib',3310,950,120,250],
      ['rib',820,3300,118,260], ['pod',3270,3240,106,230,380],
    ]) },
});

export function getRegionalTerrain(regionId) { return REGIONAL_TERRAIN[regionId] ?? null; }
export function createTerrainState(regionId, enabled = true) {
  const definition = enabled && getRegionalTerrain(regionId);
  const sites = definition ? definition.structures.map(site => ({ ...site, hp: site.maxHp, destroyedAt: null, hitAt: -100 })) : [];
  return { sites, active: [...sites], revision: 0 };
}
export function hasRegionalTerrain(state) {
  return Boolean(state?.expedition && getRegionalTerrain(state.regionId)
    && state.phase === 'swarm' && !state.expedition.bossRoom);
}
export function activeTerrainSites(state) {
  return state.terrain?.active ?? getRegionalTerrain(state.regionId)?.structures ?? [];
}

// Debris consumes the simulation timestamp, never collision or reward authority.
export function damageTerrainStructure(state, site, amount) {
  if (!hasRegionalTerrain(state) || !site.maxHp || site.destroyedAt !== null || !Number.isFinite(amount) || amount <= 0) return false;
  site.hp = Math.max(0, site.hp - amount); site.hitAt = state.time;
  if (site.hp > 0) return false;
  site.destroyedAt = state.time;
  state.terrain.active = state.terrain.active.filter(active => active.id !== site.id);
  state.terrain.revision++;
  return true;
}

// Earliest contact on a swept segment: fast shots and dashes cannot tunnel.
export function terrainContact(x1, y1, x2, y2, padding = 0, structures = SECTOR_ONE_STRUCTURES) {
  let contact = null;
  const dx = x2 - x1, dy = y2 - y1, a = dx * dx + dy * dy;
  for (const obstacle of structures) {
    const ox = x1 - obstacle.x, oy = y1 - obstacle.y, radius = obstacle.radius + padding;
    const c = ox * ox + oy * oy - radius * radius;
    let t = 0;
    if (c > 0) {
      if (a < 1e-8) continue;
      const b = 2 * (ox * dx + oy * dy), discriminant = b * b - 4 * a * c;
      if (discriminant < 0) continue;
      t = (-b - Math.sqrt(discriminant)) / (2 * a);
      if (t < 0 || t > 1) continue;
    }
    if (!contact || t < contact.t) contact = { t, obstacle };
  }
  return contact;
}

export function constrainTerrainActor(state, actor, fromX = actor.x, fromY = actor.y) {
  if (!hasRegionalTerrain(state) || actor.dead) return;
  const radius = Math.max(0, actor.radius || 0), structures = activeTerrainSites(state);
  const hit = terrainContact(fromX, fromY, actor.x, actor.y, radius, structures);
  if (hit && hit.t > 0) {
    // Retain tangential travel along the circular surface.
    const hx = fromX + (actor.x - fromX) * hit.t, hy = fromY + (actor.y - fromY) * hit.t;
    const length = Math.hypot(hx - hit.obstacle.x, hy - hit.obstacle.y) || 1;
    const nx = (hx - hit.obstacle.x) / length, ny = (hy - hit.obstacle.y) / length;
    const rx = actor.x - hx, ry = actor.y - hy, inward = Math.min(0, rx * nx + ry * ny);
    actor.x = hx + rx - inward * nx + nx * .05;
    actor.y = hy + ry - inward * ny + ny * .05;
  }
  for (const obstacle of structures) {
    const dx = actor.x - obstacle.x, dy = actor.y - obstacle.y, length = Math.hypot(dx, dy);
    const limit = obstacle.radius + radius + .05;
    if (length >= limit) continue;
    const nx = length > .001 ? dx / length : 1, ny = length > .001 ? dy / length : 0;
    actor.x = obstacle.x + nx * limit;
    actor.y = obstacle.y + ny * limit;
    const inward = Math.min(0, (actor.vx || 0) * nx + (actor.vy || 0) * ny);
    actor.vx = (actor.vx || 0) - inward * nx; actor.vy = (actor.vy || 0) - inward * ny;
  }
}

export function steerTerrainEnemy(state, enemy) {
  if (!hasRegionalTerrain(state)) return;
  const speed = Math.hypot(enemy.vx, enemy.vy);
  if (speed < .01) return;
  const look = Math.max(100, (enemy.radius || 20) + 90);
  const hit = terrainContact(enemy.x, enemy.y, enemy.x + enemy.vx / speed * look,
    enemy.y + enemy.vy / speed * look, (enemy.radius || 20) + 12, activeTerrainSites(state));
  if (!hit) return;
  const dx = enemy.x - hit.obstacle.x, dy = enemy.y - hit.obstacle.y, length = Math.hypot(dx, dy) || 1;
  const side = Math.sign(-dy * enemy.vx + dx * enemy.vy) || (enemy.id % 2 ? 1 : -1);
  enemy.vx = (-dy / length * side + dx / length * .25) * speed;
  enemy.vy = (dx / length * side + dy / length * .25) * speed;
}

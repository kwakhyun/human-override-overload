// Shared physical footprints for the authored WRONG ENGINE transport yard.
// Rendering and deterministic movement use the same circles, in game units.
export const SECTOR_ONE_STRUCTURES = Object.freeze([
  { id: 'coolant-west', x: 1480, y: 1750, radius: 86, height: 185, kind: 'coolant' },
  { id: 'coolant-east', x: 2630, y: 1770, radius: 86, height: 185, kind: 'coolant' },
  { id: 'turbine-west', x: 1480, y: 2420, radius: 100, height: 135, kind: 'turbine' },
  { id: 'turbine-east', x: 2630, y: 2420, radius: 100, height: 135, kind: 'turbine' },
  { id: 'relay-north', x: 2048, y: 1010, radius: 92, height: 225, kind: 'relay' },
  { id: 'relay-south', x: 2048, y: 3100, radius: 92, height: 225, kind: 'relay' },
  { id: 'coolant-nw', x: 770, y: 880, radius: 110, height: 210, kind: 'coolant' },
  { id: 'coolant-ne', x: 3300, y: 880, radius: 110, height: 210, kind: 'coolant' },
  { id: 'turbine-sw', x: 800, y: 3240, radius: 115, height: 150, kind: 'turbine' },
  { id: 'turbine-se', x: 3300, y: 3240, radius: 115, height: 150, kind: 'turbine' },
].map(site => Object.freeze({ ...site, maxHp: site.kind === 'coolant' ? 320 : 0 })));

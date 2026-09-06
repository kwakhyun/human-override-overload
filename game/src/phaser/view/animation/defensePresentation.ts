/** Four authored perspective pairs: south, east, north, west. */
export function resolveDefenseDirection(dx: number, dy: number, previous = 0): number {
  if (Math.hypot(dx, dy) < 0.15) return previous;
  return Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 1 : 3 : dy > 0 ? 0 : 2;
}

export const DEFENSE_SPECIALIZATION_STYLE: Readonly<Record<string, { color: number; shape: 'rails' | 'nodes' | 'shield' }>> = Object.freeze({
  overdrive: { color: 0x66f4ff, shape: 'nodes' },
  armorPiercer: { color: 0xffd58a, shape: 'rails' },
  cascade: { color: 0xb4a2ff, shape: 'nodes' },
  ionFracture: { color: 0xff8bd1, shape: 'rails' },
  clusterWarhead: { color: 0xffd58a, shape: 'nodes' },
  incendiary: { color: 0xff8966, shape: 'rails' },
  stasis: { color: 0xa7aaff, shape: 'nodes' },
  guardian: { color: 0x91ffe0, shape: 'shield' },
});

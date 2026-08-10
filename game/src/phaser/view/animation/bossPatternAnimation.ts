export const COMMON_BOSS_PATTERN_ATLAS_LAYOUT = Object.freeze({ columns: 6, rows: 6 });
export const REGIONAL_BOSS_PATTERN_ATLAS_LAYOUT = Object.freeze({ columns: 6, rows: 4 });

export const COMMON_BOSS_PATTERN_ROWS = Object.freeze({
  radial: 0,
  sweep: 1,
  bombs: 2,
  rings: 3,
  charge: 4,
  multiCharge: 5,
});

export const REGIONAL_BOSS_PATTERN_ROWS = Object.freeze({
  prismLattice: 0,
  solarFlare: 1,
  memorySpiral: 2,
  depthCollapse: 3,
});

export type BossPatternAtlasId = "common" | "regional";

export type BossPatternFrame = Readonly<{
  atlas: BossPatternAtlasId;
  column: number;
  row: number;
}>;

type BossPatternState = Readonly<{
  phase?: string;
  life?: number;
  maxLife?: number;
  activeLife?: number;
}>;

function finite(value: unknown, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function clamp01(value: unknown) {
  return Math.max(0, Math.min(1, finite(value)));
}

function normalizedPatternId(type: unknown) {
  return String(type ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function resolvePatternRow(type: unknown): Readonly<{ atlas: BossPatternAtlasId; row: number }> | null {
  const id = normalizedPatternId(type);
  if (id.includes("prismlattice")) return { atlas: "regional", row: REGIONAL_BOSS_PATTERN_ROWS.prismLattice };
  if (id.includes("solarflare")) return { atlas: "regional", row: REGIONAL_BOSS_PATTERN_ROWS.solarFlare };
  if (id.includes("memoryspiral")) return { atlas: "regional", row: REGIONAL_BOSS_PATTERN_ROWS.memorySpiral };
  if (id.includes("depthcollapse")) return { atlas: "regional", row: REGIONAL_BOSS_PATTERN_ROWS.depthCollapse };
  if (id.includes("multicharge")) return { atlas: "common", row: COMMON_BOSS_PATTERN_ROWS.multiCharge };
  if (id.includes("charge") || id.includes("rush")) return { atlas: "common", row: COMMON_BOSS_PATTERN_ROWS.charge };
  if (id.includes("bomb")) return { atlas: "common", row: COMMON_BOSS_PATTERN_ROWS.bombs };
  if (id.includes("ring")) return { atlas: "common", row: COMMON_BOSS_PATTERN_ROWS.rings };
  if (id.includes("sweep") || id.includes("laser")) return { atlas: "common", row: COMMON_BOSS_PATTERN_ROWS.sweep };
  if (id.includes("radial")) return { atlas: "common", row: COMMON_BOSS_PATTERN_ROWS.radial };
  return null;
}

export function bossPatternLifetimeProgress(state: BossPatternState = {}) {
  const phase = String(state.phase ?? "warning").toLowerCase();
  const duration = phase === "active"
    ? Math.max(0.001, finite(state.activeLife, finite(state.maxLife, 1)))
    : Math.max(0.001, finite(state.maxLife, 1));
  return clamp01(1 - finite(state.life, duration) / duration);
}

export function resolveBossPatternAtlasFrame(type: unknown, state: BossPatternState = {}): BossPatternFrame | null {
  const row = resolvePatternRow(type);
  if (!row) return null;
  const progress = bossPatternLifetimeProgress(state);
  const active = String(state.phase ?? "warning").toLowerCase() === "active";
  const column = active
    ? 3 + Math.min(2, Math.floor(progress * 3))
    : Math.min(2, Math.floor(progress * 3));
  return { atlas: row.atlas, column, row: row.row };
}

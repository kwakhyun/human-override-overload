export const MANUAL_ABILITY_ATLAS_LAYOUT = Object.freeze({ columns: 6, rows: 4 });

export const MANUAL_ABILITY_ROWS = Object.freeze({
  empPulse: 0,
  aegisWard: 1,
  stratosRun: 2,
  helixTempest: 3,
} as const);

export type ManualAbilityVisual = keyof typeof MANUAL_ABILITY_ROWS;

export type ManualAbilityFrameState = Readonly<{
  life?: number;
  maxLife?: number;
  angle?: number;
  phase?: string;
  warningProgress?: number;
  sweepProgress?: number;
}>;

export type ManualAbilityAtlasFrame = Readonly<{
  column: number;
  row: number;
}>;

const TAU = Math.PI * 2;

function finite(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function clamp01(value: unknown) {
  return Math.max(0, Math.min(1, finite(value)));
}

export function manualAbilityLifetimeProgress(state: ManualAbilityFrameState) {
  const maxLife = Math.max(1 / 120, finite(state.maxLife, 1));
  return clamp01(1 - finite(state.life, maxLife) / maxLife);
}

function resolveFieldFrame(state: ManualAbilityFrameState) {
  const progress = manualAbilityLifetimeProgress(state);
  if (progress < 0.18) return Math.min(2, Math.floor(progress / 0.18 * 3));
  if (progress >= 0.86) return 5;
  return 2 + Math.min(2, Math.floor((progress - 0.18) / 0.68 * 3));
}

/**
 * Maps engine-owned life/phase/angle state to one authored atlas cell. This is
 * deliberately presentation-only: collision geometry remains in the engine.
 */
export function resolveManualAbilityAtlasFrame(
  ability: ManualAbilityVisual,
  state: ManualAbilityFrameState,
): ManualAbilityAtlasFrame {
  const row = MANUAL_ABILITY_ROWS[ability];
  if (ability === "empPulse" || ability === "aegisWard") {
    return Object.freeze({ column: resolveFieldFrame(state), row });
  }
  if (ability === "stratosRun") {
    const phase = String(state.phase ?? "warning").toLowerCase();
    if (phase === "warning") {
      return Object.freeze({ column: Math.min(1, Math.floor(clamp01(state.warningProgress) * 2)), row });
    }
    const sweepProgress = clamp01(state.sweepProgress);
    const column = sweepProgress >= 0.92 ? 5 : 2 + Math.min(2, Math.floor(sweepProgress * 3));
    return Object.freeze({ column, row });
  }

  const progress = manualAbilityLifetimeProgress(state);
  if (progress >= 0.9) return Object.freeze({ column: 5, row });
  if (progress < 0.08) return Object.freeze({ column: Math.min(1, Math.floor(progress / 0.08 * 2)), row });
  const normalizedAngle = ((finite(state.angle) % TAU) + TAU) % TAU;
  return Object.freeze({ column: 1 + Math.floor(normalizedAngle / TAU * 4) % 4, row });
}

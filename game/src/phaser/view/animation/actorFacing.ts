/** Painted perspective never inherits the simulation's free combat rotation. */
export function resolveActorFacing(kind: "enemy" | "ally" | "boss", entity: {
  angle?: number; vx?: number; vy?: number; combatRole?: string;
  type?: string; visualSet?: string; isMidBoss?: boolean;
}) {
  const angle = Number.isFinite(entity.angle) ? Number(entity.angle)
    : Math.atan2(Number(entity.vy) || 0, Number(entity.vx) || 0);
  const role = `${entity.combatRole ?? ""} ${entity.type ?? ""}`.toLowerCase();
  if (kind === "boss") return { rotation: 0, flipX: false };
  const flying = kind === "ally" ? /drone|hunter|suppress/.test(role)
    : !entity.isMidBoss && (entity.visualSet === "storm-spire" || /suicide|hunter/.test(role));
  // The inner-network drone's red nose faces RIGHT in its source atlas.
  // Only the authored outer-region plates have a north-facing source axis.
  const northFacingPlate = ['neon-foundry', 'storm-spire', 'gene-vault'].includes(entity.visualSet ?? '');
  if (flying) return {
    rotation: angle + (kind === "enemy" && northFacingPlate ? Math.PI / 2 : 0), flipX: false,
  };
  // A horizontal mirror can change a side-facing gunner's aim without turning
  // its feet upward. Frontal walkers preserve their asymmetric body instead.
  return { rotation: 0, flipX: !entity.isMidBoss && !/siege|walker|emp/.test(role) && Math.cos(angle) < -0.15 };
}

import type { ActorAnimationSample, ActorAnimationState } from "./actorAnimation";

/** Regional rows own identities; columns own motion, unlike common enemy sheets. */
export function resolveRegionalEnemyFrame(role: number, sample: ActorAnimationSample, midBoss = false) {
  const clip = sample.clipId;
  const column = clip === "death" || clip === "hit" ? 5
    : clip === "windup" ? 3
    : clip === "attack" ? 4
    : clip === "move" ? [0, 1, 0, 2][sample.clipFrameIndex % 4] : 0;
  return { column, row: midBoss ? 3 : Math.min(2, Math.max(0, role)) };
}

export function resolveExpandedBossFrame(sample: ActorAnimationSample, state: ActorAnimationState) {
  const index = sample.clipFrameIndex;
  if (sample.clipId === "transform") return { column: Math.min(3, Math.floor(index * 4 / sample.clip.frameCount)), row: 3 };
  if (sample.clipId === "death") return { column: 4 + Math.min(3, Math.floor(index * 4 / sample.clip.frameCount)), row: 3 };
  const row = Math.max(0, Math.min(2, Math.trunc(Number(state.stage) || 1) - 1));
  if (sample.clipId === "hit") return { column: 7, row };
  if (sample.clipId === "windup") return { column: 3 + index % 2, row };
  if (sample.clipId === "attack") return { column: 5 + index % 3, row };
  return { column: [0, 1, 2, 1][index % 4], row };
}

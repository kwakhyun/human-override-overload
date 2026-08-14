export type ActorRole = "hero" | "enemy" | "ally" | "boss";

export type ActorAnimationProfileId =
  | "hero"
  | "enemy-hunter"
  | "enemy-suppressor"
  | "enemy-brute"
  | "ally"
  | "boss";

export type ActorClipId =
  | "idle"
  | "spawn"
  | "move"
  | "windup"
  | "attack"
  | "dash"
  | "hit"
  | "transform"
  | "death";

export type AtlasFrameCoordinate = Readonly<{
  column: number;
  row: number;
}>;

export type HeroAimDirection =
  | "south"
  | "southeast"
  | "east"
  | "northeast"
  | "north"
  | "northwest"
  | "west"
  | "southwest";

export type HeroAimPresentation = Readonly<{
  direction: HeroAimDirection;
  row: number;
  angle: number;
}>;

export type HeroMuzzleAnchor = Readonly<{
  x: number;
  y: number;
  angle: number;
}>;

export type ActorAtlasLayout = Readonly<{
  columns: number;
  rows: number;
}>;

export type ActorClipMetadata = Readonly<{
  id: ActorClipId;
  frameCount: number;
  fps: number;
  loop: boolean;
  priority: number;
  /** Coordinates used until a dedicated per-clip atlas is available. */
  fallbackFrames: readonly AtlasFrameCoordinate[];
}>;

export type ActorAnimationProfile = Readonly<{
  id: ActorAnimationProfileId;
  fallbackSource: "hero-eight-direction-8x8" | "legacy-5x3" | "static-image" | "boss-form-strip";
  fallbackLayout: ActorAtlasLayout;
  clips: Readonly<Partial<Record<ActorClipId, ActorClipMetadata>>>;
  /** The current boss strip stores one static form in each stage column. */
  fallbackStageColumns?: readonly number[];
}>;

export type ActorAnimationState = Readonly<{
  id?: number;
  type?: string;
  kind?: string;
  combatRole?: string;
  stage?: number;
  angle?: number;
  vx?: number;
  vy?: number;
  moveBlend?: number;
  dead?: boolean;
  spawnDelay?: number;
  animationState?: string;
  animationTimer?: number;
  attackState?: string;
  attackTimer?: number;
  dashTimer?: number;
  dashDuration?: number;
  hitFlash?: number;
  hitStun?: number;
  stunTimer?: number;
  transformTimer?: number;
  transformDuration?: number;
  weakness?: number;
  deathTimer?: number;
  deathDuration?: number;
  activePattern?: Readonly<{ phase?: string }> | null;
}>;

export type ActorAnimationSample = Readonly<{
  profileId: ActorAnimationProfileId;
  clipId: ActorClipId;
  clip: ActorClipMetadata;
  clipFrameIndex: number;
  fallbackAtlasFrame: AtlasFrameCoordinate;
}>;

export const LEGACY_FIVE_BY_THREE_LAYOUT: ActorAtlasLayout = Object.freeze({ columns: 5, rows: 3 });
export const HERO_DIRECTIONAL_AIM_LAYOUT: ActorAtlasLayout = Object.freeze({ columns: 8, rows: 8 });
export const ENEMY_MOTION_V2_LAYOUT: ActorAtlasLayout = Object.freeze({ columns: 6, rows: 4 });
export const ALLY_MOTION_V2_LAYOUT: ActorAtlasLayout = Object.freeze({ columns: 5, rows: 4 });
export const BOSS_MOTION_V2_LAYOUT: ActorAtlasLayout = Object.freeze({ columns: 6, rows: 4 });
export const STATIC_ACTOR_LAYOUT: ActorAtlasLayout = Object.freeze({ columns: 1, rows: 1 });
export const LEGACY_BOSS_FORM_LAYOUT: ActorAtlasLayout = Object.freeze({ columns: 3, rows: 1 });

export const HERO_DIRECTIONAL_AIM_ROWS = Object.freeze({
  south: 0,
  southeast: 1,
  east: 2,
  northeast: 3,
  north: 4,
  northwest: 5,
  west: 6,
  southwest: 7,
} as const);

const HERO_DIRECTION_BY_OCTANT = Object.freeze([
  "east",
  "southeast",
  "south",
  "southwest",
  "west",
  "northwest",
  "north",
  "northeast",
] as const satisfies readonly HeroAimDirection[]);

const HERO_DIRECTION_ANGLE = Object.freeze({
  east: 0,
  southeast: Math.PI / 4,
  south: Math.PI / 2,
  southwest: Math.PI * 3 / 4,
  west: Math.PI,
  northwest: -Math.PI * 3 / 4,
  north: -Math.PI / 2,
  northeast: -Math.PI / 4,
} satisfies Record<HeroAimDirection, number>);

const CLIP_PRIORITY = Object.freeze({
  idle: 0,
  move: 10,
  attack: 40,
  windup: 50,
  spawn: 60,
  dash: 70,
  hit: 80,
  transform: 90,
  death: 100,
} satisfies Record<ActorClipId, number>);

function atlasFrame(column: number, row: number): AtlasFrameCoordinate {
  return Object.freeze({ column, row });
}

function atlasRow(row: number, columns: readonly number[]): readonly AtlasFrameCoordinate[] {
  return Object.freeze(columns.map((column) => atlasFrame(column, row)));
}

function defineClip(
  id: ActorClipId,
  frameCount: number,
  fps: number,
  loop: boolean,
  fallbackFrames: readonly AtlasFrameCoordinate[],
  priority = CLIP_PRIORITY[id],
): ActorClipMetadata {
  if (frameCount < 1 || fallbackFrames.length < 1) throw new Error(`Actor clip ${id} requires frames`);
  return Object.freeze({
    id,
    frameCount: Math.floor(frameCount),
    fps,
    loop,
    priority,
    fallbackFrames: Object.freeze([...fallbackFrames]),
  });
}

function defineProfile(
  id: ActorAnimationProfileId,
  fallbackSource: ActorAnimationProfile["fallbackSource"],
  fallbackLayout: ActorAtlasLayout,
  clips: ActorAnimationProfile["clips"],
  fallbackStageColumns?: readonly number[],
): ActorAnimationProfile {
  return Object.freeze({
    id,
    fallbackSource,
    fallbackLayout,
    clips: Object.freeze({ ...clips }),
    fallbackStageColumns: fallbackStageColumns ? Object.freeze([...fallbackStageColumns]) : undefined,
  });
}

function enemyClips(row: number, timing: Readonly<{ move: number; windup: number; attack: number; death: number }>) {
  return Object.freeze({
    idle: defineClip("idle", 6, Math.max(4, timing.move * 0.5), true, atlasRow(row, [0])),
    spawn: defineClip("spawn", 6, 15, false, atlasRow(row, [0, 1])),
    move: defineClip("move", 6, timing.move, true, atlasRow(row, [0, 1])),
    windup: defineClip("windup", 6, timing.windup, false, atlasRow(row, [2])),
    attack: defineClip("attack", 6, timing.attack, false, atlasRow(row, [3])),
    // Enemy hit-stun is only 75 ms. A 60 fps visual clip exposes the authored
    // reaction sequence across the available render frames instead of holding
    // almost exclusively on column zero.
    hit: defineClip("hit", 6, 60, false, atlasRow(row, [4])),
    death: defineClip("death", 6, timing.death, false, atlasRow(row, [4])),
  } satisfies ActorAnimationProfile["clips"]);
}

const STATIC_FRAME = Object.freeze([atlasFrame(0, 0)]);

export const ACTOR_ANIMATION_PROFILES: Readonly<Record<ActorAnimationProfileId, ActorAnimationProfile>> = Object.freeze({
  hero: defineProfile("hero", "hero-eight-direction-8x8", HERO_DIRECTIONAL_AIM_LAYOUT, {
    idle: defineClip("idle", 8, 8, true, atlasRow(HERO_DIRECTIONAL_AIM_ROWS.east, [0, 1, 2, 3])),
    move: defineClip("move", 8, 12, true, atlasRow(HERO_DIRECTIONAL_AIM_ROWS.east, [0, 1, 2, 3]), CLIP_PRIORITY.attack + 5),
    attack: defineClip("attack", 8, 24, true, atlasRow(HERO_DIRECTIONAL_AIM_ROWS.east, [4, 5, 6, 7])),
    dash: defineClip("dash", 8, 8 / 0.16, false, atlasRow(HERO_DIRECTIONAL_AIM_ROWS.east, [0, 1, 2, 3])),
    hit: defineClip("hit", 8, 20, false, atlasRow(HERO_DIRECTIONAL_AIM_ROWS.east, [6, 7])),
    death: defineClip("death", 8, 8 / 0.9, false, atlasRow(HERO_DIRECTIONAL_AIM_ROWS.east, [7])),
  }),
  "enemy-hunter": defineProfile(
    "enemy-hunter",
    "legacy-5x3",
    LEGACY_FIVE_BY_THREE_LAYOUT,
    enemyClips(0, { move: 12, windup: 14, attack: 30, death: 18 }),
  ),
  "enemy-suppressor": defineProfile(
    "enemy-suppressor",
    "legacy-5x3",
    LEGACY_FIVE_BY_THREE_LAYOUT,
    enemyClips(1, { move: 9, windup: 12, attack: 36, death: 18 }),
  ),
  "enemy-brute": defineProfile(
    "enemy-brute",
    "legacy-5x3",
    LEGACY_FIVE_BY_THREE_LAYOUT,
    enemyClips(2, { move: 7, windup: 10, attack: 18, death: 18 }),
  ),
  ally: defineProfile("ally", "static-image", STATIC_ACTOR_LAYOUT, {
    idle: defineClip("idle", 5, 8, true, STATIC_FRAME),
    spawn: defineClip("spawn", 5, 16, false, STATIC_FRAME),
    move: defineClip("move", 5, 10, true, STATIC_FRAME),
    attack: defineClip("attack", 5, 30, false, STATIC_FRAME),
    hit: defineClip("hit", 5, 16, false, STATIC_FRAME),
    death: defineClip("death", 5, 10, false, STATIC_FRAME),
  }),
  boss: defineProfile("boss", "boss-form-strip", LEGACY_BOSS_FORM_LAYOUT, {
    idle: defineClip("idle", 12, 6, true, STATIC_FRAME),
    move: defineClip("move", 10, 8, true, STATIC_FRAME),
    windup: defineClip("windup", 12, 10, false, STATIC_FRAME),
    attack: defineClip("attack", 16, 14, false, STATIC_FRAME),
    hit: defineClip("hit", 6, 14, false, STATIC_FRAME),
    transform: defineClip("transform", 18, 12, false, STATIC_FRAME),
    death: defineClip("death", 20, 12, false, STATIC_FRAME),
  }, [0, 1, 2]),
});

function finite(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalized(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/**
 * Gameplay headings remain continuous while the authored hero artwork is
 * quantized to the nearest of eight compass views. Every view has its own row:
 * lower directions expose the face, upper directions expose the back of her
 * head, and no runtime mirror or whole-body rotation is required.
 */
export function resolveHeroAimPresentation(state: ActorAnimationState): HeroAimPresentation {
  const angle = typeof state.angle === "number" && Number.isFinite(state.angle) ? state.angle : 0;
  const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const octant = Math.round(normalizedAngle / (Math.PI / 4)) % 8;
  const direction = HERO_DIRECTION_BY_OCTANT[octant];
  return Object.freeze({
    direction,
    row: HERO_DIRECTIONAL_AIM_ROWS[direction],
    angle: HERO_DIRECTION_ANGLE[direction],
  });
}

export function resolveHeroMuzzleAnchor(state: ActorAnimationState, displaySize = 74): HeroMuzzleAnchor {
  const presentation = resolveHeroAimPresentation(state);
  const size = Math.max(1, finite(displaySize, 74));
  const radius = presentation.direction.length > 5 && presentation.direction !== "north" && presentation.direction !== "south"
    ? 0.39
    : 0.42;
  return Object.freeze({
    x: Math.cos(presentation.angle) * size * radius,
    y: Math.sin(presentation.angle) * size * radius,
    angle: presentation.angle,
  });
}

/**
 * Every direction row reserves columns 0–3 for ready/locomotion and 4–7 for
 * firing or attack beats. Dash, hit and death remain inside the same 8×8
 * directional texture so the retired single-facing atlas is never exposed.
 */
export function resolveHeroDirectionalAimFrame(
  sample: ActorAnimationSample,
  state: ActorAnimationState = {},
): AtlasFrameCoordinate {
  const presentation = resolveHeroAimPresentation(state);
  const startColumn = sample.clipId === "attack" || sample.clipId === "hit" || sample.clipId === "death" ? 4 : 0;
  return atlasFrame(
    remapFrame(sample.clipFrameIndex, sample.clip.frameCount, startColumn, 4),
    presentation.row,
  );
}

function isMoving(state: ActorAnimationState) {
  const animationState = normalized(state.animationState);
  if (animationState === "move" || animationState === "walk" || animationState === "run") return true;
  return Math.hypot(finite(state.vx), finite(state.vy)) > 12 || finite(state.moveBlend) > 0.12;
}

function candidateClips(state: ActorAnimationState): readonly ActorClipId[] {
  const animationState = normalized(state.animationState);
  const attackState = normalized(state.attackState);
  const patternPhase = normalized(state.activePattern?.phase);
  const windup = patternPhase === "warning" || attackState === "aim" || attackState.startsWith("windup");
  const attack = finite(state.attackTimer) > 0
    || animationState === "attack"
    || patternPhase === "active"
    || (!["", "idle", "aim", "spawn", "move", "hit", "death", "transform", "dash"].includes(attackState)
      && !attackState.startsWith("windup"));

  const candidates: ActorClipId[] = ["idle"];
  if (isMoving(state)) candidates.push("move");
  if (attack) candidates.push("attack");
  if (windup) candidates.push("windup");
  if (finite(state.spawnDelay) > 0 || animationState === "spawn") candidates.push("spawn");
  if (finite(state.dashTimer) > 0 || animationState === "dash") candidates.push("dash");
  if (finite(state.hitFlash) > 0.03 || finite(state.hitStun) > 0.02 || finite(state.stunTimer) > 0.02 || animationState === "hit") {
    candidates.push("hit");
  }
  if (finite(state.transformTimer) > 0 || finite(state.weakness) > 0 || animationState === "transform") candidates.push("transform");
  if (state.dead || animationState === "death") candidates.push("death");
  return candidates;
}

export function resolveActorAnimationProfileId(
  role: ActorRole,
  state: ActorAnimationState = {},
): ActorAnimationProfileId {
  if (role !== "enemy") return role;
  const actorType = `${normalized(state.type)} ${normalized(state.kind)}`;
  if (actorType.includes("brute")) return "enemy-brute";
  if (actorType.includes("suppress")) return "enemy-suppressor";
  if (actorType.includes("hunter")) return "enemy-hunter";
  const combatRole = normalized(state.combatRole);
  if (combatRole.includes("siegewalker")) return "enemy-brute";
  if (combatRole.includes("sniper")) return "enemy-brute";
  if (combatRole.includes("rifle")) return "enemy-suppressor";
  return "enemy-hunter";
}

export function getActorAnimationProfile(
  role: ActorRole,
  state: ActorAnimationState = {},
): ActorAnimationProfile {
  return ACTOR_ANIMATION_PROFILES[resolveActorAnimationProfileId(role, state)];
}

export function selectActorClip(
  profile: ActorAnimationProfile,
  state: ActorAnimationState = {},
): ActorClipMetadata {
  const idle = profile.clips.idle;
  if (!idle) throw new Error(`Actor animation profile ${profile.id} requires an idle clip`);
  let selected = idle;
  for (const clipId of candidateClips(state)) {
    const candidate = profile.clips[clipId];
    if (candidate && candidate.priority > selected.priority) selected = candidate;
  }
  return selected;
}

export function calculateClipFrame(
  clip: ActorClipMetadata,
  elapsedSeconds: number,
  phaseOffsetFrames = 0,
): number {
  const elapsed = Math.max(0, finite(elapsedSeconds));
  const advanced = Math.floor(elapsed * Math.max(0, finite(clip.fps))) + Math.trunc(finite(phaseOffsetFrames));
  if (!clip.loop) return Math.max(0, Math.min(clip.frameCount - 1, advanced));
  return ((advanced % clip.frameCount) + clip.frameCount) % clip.frameCount;
}

export function resolveFallbackAtlasFrame(
  profile: ActorAnimationProfile,
  clip: ActorClipMetadata,
  clipFrameIndex: number,
  state: ActorAnimationState = {},
): AtlasFrameCoordinate {
  const safeIndex = Math.max(0, Math.min(clip.frameCount - 1, Math.trunc(finite(clipFrameIndex))));
  const fallbackIndex = Math.min(
    clip.fallbackFrames.length - 1,
    Math.floor(safeIndex * clip.fallbackFrames.length / clip.frameCount),
  );
  const fallback = clip.fallbackFrames[fallbackIndex] ?? clip.fallbackFrames[0];
  if (profile.id === "hero") return atlasFrame(fallback.column, resolveHeroAimPresentation(state).row);
  const stageColumns = profile.fallbackStageColumns;
  if (!stageColumns?.length) return fallback;
  const stageIndex = Math.max(0, Math.min(stageColumns.length - 1, Math.floor(finite(state.stage, 1)) - 1));
  return atlasFrame(stageColumns[stageIndex], fallback.row);
}

export function resolveHeroClipElapsedSeconds(
  clipId: ActorClipId,
  state: ActorAnimationState,
  timelineElapsedSeconds: number,
): number {
  if (clipId === "dash") {
    const duration = Math.max(1 / 120, finite(state.dashDuration, 0.16));
    return Math.max(0, Math.min(duration, duration - finite(state.dashTimer, duration)));
  }
  if (clipId === "death") {
    const duration = Math.max(1 / 120, finite(state.deathDuration, 0.9));
    return Math.max(0, Math.min(duration, duration - finite(state.deathTimer, duration)));
  }
  return Math.max(0, finite(timelineElapsedSeconds));
}

/**
 * Boss terminal rendering continues after the deterministic simulation has
 * entered victory and stopped advancing state.time. Countdown-owned one-shots
 * therefore derive their visual elapsed time from the same engine timers.
 */
export function resolveBossClipElapsedSeconds(
  clipId: ActorClipId,
  state: ActorAnimationState,
  timelineElapsedSeconds: number,
): number {
  if (clipId === "death") {
    const duration = Math.max(1 / 120, finite(state.deathDuration, 1.25));
    return Math.max(0, Math.min(duration, duration - finite(state.deathTimer, duration)));
  }
  if (clipId === "transform" && finite(state.transformTimer) > 0) {
    const duration = Math.max(1 / 120, finite(state.transformDuration, 1.8));
    return Math.max(0, Math.min(duration, duration - finite(state.transformTimer, duration)));
  }
  return Math.max(0, finite(timelineElapsedSeconds));
}

export function sampleActorAnimation(
  role: ActorRole,
  state: ActorAnimationState,
  clipElapsedSeconds: number,
  phaseOffsetFrames = 0,
): ActorAnimationSample {
  const profile = getActorAnimationProfile(role, state);
  const clip = selectActorClip(profile, state);
  const clipFrameIndex = calculateClipFrame(clip, clipElapsedSeconds, phaseOffsetFrames);
  return Object.freeze({
    profileId: profile.id,
    clipId: clip.id,
    clip,
    clipFrameIndex,
    fallbackAtlasFrame: resolveFallbackAtlasFrame(profile, clip, clipFrameIndex, state),
  });
}

function remapFrame(frameIndex: number, logicalFrameCount: number, startColumn: number, columnCount: number) {
  const safeLogicalCount = Math.max(1, Math.trunc(finite(logicalFrameCount, 1)));
  const safeIndex = Math.max(0, Math.min(safeLogicalCount - 1, Math.trunc(finite(frameIndex))));
  return startColumn + Math.min(columnCount - 1, Math.floor(safeIndex * columnCount / safeLogicalCount));
}

/**
 * Maps semantic clips to the versioned high-frame atlases. The simulation owns
 * action timing; this helper only chooses a renderer frame. Static/legacy art
 * remains a safe fallback when an optional atlas has not loaded.
 */
export function resolveDedicatedAtlasFrame(
  role: ActorRole,
  sample: ActorAnimationSample,
  state: ActorAnimationState = {},
): AtlasFrameCoordinate {
  const clipId = sample.clipId;
  if (role === "enemy") {
    const row = clipId === "attack" || clipId === "windup"
      ? 1
      : clipId === "hit"
        ? 2
        : clipId === "death"
          ? 3
          : 0;
    return atlasFrame(remapFrame(sample.clipFrameIndex, sample.clip.frameCount, 0, 6), row);
  }
  if (role === "ally") {
    const row = clipId === "spawn"
      ? 0
      : clipId === "attack" || clipId === "windup"
        ? 2
        : clipId === "hit" || clipId === "death"
          ? 3
          : 1;
    return atlasFrame(remapFrame(sample.clipFrameIndex, sample.clip.frameCount, 0, 5), row);
  }
  if (role === "boss") {
    if (clipId === "transform") {
      return atlasFrame(remapFrame(sample.clipFrameIndex, sample.clip.frameCount, 0, 3), 3);
    }
    if (clipId === "hit") return atlasFrame(2, 3);
    if (clipId === "death") {
      return atlasFrame(remapFrame(sample.clipFrameIndex, sample.clip.frameCount, 3, 3), 3);
    }
    const stageRow = Math.max(0, Math.min(2, Math.floor(finite(state.stage, 1)) - 1));
    if (clipId === "windup") {
      // Windup and attack only have authored A/B poses per stage. Cycling the
      // two physical frames keeps both poses visible inside short boss attacks
      // (some fire windows last just 220 ms); proportional remapping across the
      // larger logical clip left the B pose unreachable in those windows.
      return atlasFrame(2 + sample.clipFrameIndex % 2, stageRow);
    }
    if (clipId === "attack") {
      return atlasFrame(4 + sample.clipFrameIndex % 2, stageRow);
    }
    return atlasFrame(sample.clipFrameIndex % 2, stageRow);
  }
  return sample.fallbackAtlasFrame;
}

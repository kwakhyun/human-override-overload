type DebugSceneLike = {
  state?: any;
  governor?: {
    setQuality?: (quality: string) => boolean;
  };
  applyQualityLimit?: () => void;
  prepareOptionalAllyMotion?: (id: string) => void;
};

const ENEMY_TARGET = 220;
const PROJECTILE_TARGET = 620;

function nextId(state: any) {
  state.nextEntityId = Math.max(0, Number(state.nextEntityId) || 0) + 1;
  return state.nextEntityId;
}

function enemyPosition(player: any, index: number) {
  const columns = 20;
  const column = index % columns;
  const row = Math.floor(index / columns);
  return {
    x: Number(player?.x || 0) + (column - (columns - 1) * 0.5) * 49,
    y: Number(player?.y || 0) + (row - 5) * 51,
  };
}

function projectilePosition(player: any, index: number) {
  const columns = 31;
  const column = index % columns;
  const row = Math.floor(index / columns);
  return {
    x: Number(player?.x || 0) + (column - (columns - 1) * 0.5) * 31,
    y: Number(player?.y || 0) + (row - 9.5) * 27,
  };
}

/**
 * DEV-only browser profiling fixture. It mutates only the current debug run,
 * never the simulation module or persistent campaign data.
 */
export function primeDeterministicArsenal(scene: DebugSceneLike) {
  const state = scene.state;
  if (!state?.player || !Array.isArray(state.enemies) || !Array.isArray(state.projectiles)) {
    throw new Error("OverloadBattle is not ready for deterministic profiling.");
  }

  const templates = state.enemies.length > 0 ? state.enemies : [{ type: "hunter", combatRole: "suicideDrone", radius: 20 }];
  state.enemies = Array.from({ length: ENEMY_TARGET }, (_, index) => {
    const template = templates[index % templates.length];
    const position = enemyPosition(state.player, index);
    return {
      ...template,
      ...position,
      id: nextId(state),
      combatRole: "profileTarget",
      vx: 0,
      vy: 0,
      hp: 1_000_000_000,
      maxHp: 1_000_000_000,
      speed: 0,
      damage: 0,
      dead: false,
      hitFlash: 0,
      hitStun: 0,
      deathTimer: 0,
      spawnDelay: 0,
      spawnDuration: 0,
      shootCooldown: 3_600,
      attackCooldown: 3_600,
      burstShots: 0,
      burstTimer: 0,
      aimTimer: 0,
      attackState: "idle",
      attackTimer: 0,
      animationState: "move",
      moveBlend: 1,
    };
  });

  const projectileKinds = ["pulse", "scatter", "rail"];
  state.projectiles = Array.from({ length: PROJECTILE_TARGET }, (_, index) => {
    const position = projectilePosition(state.player, index);
    const angle = (index % 24) / 24 * Math.PI * 2;
    return {
      id: nextId(state),
      kind: projectileKinds[index % projectileKinds.length],
      ...position,
      px: position.x - Math.cos(angle) * 12,
      py: position.y - Math.sin(angle) * 12,
      vx: 0,
      vy: 0,
      angle,
      radius: 0.1,
      damage: 0,
      color: index % 3 === 2 ? "#ffffff" : "#62eaff",
      life: 3_600,
      age: 0,
      pierce: 1_000_000,
      splash: 0,
      hitIds: [],
      animationState: "flight",
      dead: false,
    };
  });

  state.enemyProjectiles = [];
  state.spawnedEnemies = Math.max(Number(state.enemyBudget) || 0, Number(state.spawnedEnemies) || 0);
  state.surgeQueued = 0;
  state.surgeWarning = null;
  state.activeSurge = null;
  state.player.invulnerability = Math.max(Number(state.player.invulnerability) || 0, 3_600);
  state.levelFlow.firstDeadline = 3_600;
  state.levelFlow.nextOfferAt = 3_600;
  state.events.length = 0;

  // Preserve the device-selected presentation tier. The fixture exists to
  // make entity pressure deterministic; forcing CINEMATIC here made low-end
  // profiles silently measure the wrong backing buffer and frame cadence.
  for (const allyId of ["drone", "sentry", "suppressor"]) scene.prepareOptionalAllyMotion?.(allyId);

  return Object.freeze({
    liveEnemies: state.enemies.length,
    playerProjectiles: state.projectiles.length,
    enemyProjectiles: state.enemyProjectiles.length,
    note: "DEV-only deterministic fixture; current debug runtime state was mutated and all three optional ally atlases were requested. Simulation rules and campaign saves were not changed.",
  });
}

export const DETERMINISTIC_ARSENAL_TARGET = Object.freeze({
  enemies: ENEMY_TARGET,
  projectiles: PROJECTILE_TARGET,
});

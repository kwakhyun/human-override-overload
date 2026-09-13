export type AssetKind = "image" | "motion" | "atlas";

export type AssetDefinition = Readonly<{
  key: string;
  path: string;
  performancePath?: string;
  kind: AssetKind;
  columns?: number;
  rows?: number;
}>;

export const ASSET_KEYS = Object.freeze({
  sector1: "overload-sector-01",
  sector2: "overload-sector-02",
  sector3: "overload-sector-03",
  sector4Expanded: "overload-sector-04-expanded",
  bossRoom: "overload-boss-chamber",
  playerDirectionalAim: "survivor-directional-aim-atlas",
  playerSwordDirectionalAim: "survivor-sword-directional-aim-atlas",
  playerMikaDirectionalAim: "mika-directional-aim-atlas",
  playerVesperDirectionalAim: "vesper-directional-aim-atlas",
  playerNoxDirectionalAim: "nox-directional-aim-atlas",
  enemyMotion: "overload-enemy-motion-atlas",
  enemyHunter: "overload-enemy-hunter-static",
  enemyRifleman: "overload-enemy-rifleman-static",
  enemySniper: "overload-enemy-sniper-static",
  enemyHunterMotion: "overload-enemy-hunter-motion-v2",
  enemyRiflemanMotion: "overload-enemy-rifleman-motion-v2",
  enemySniperMotion: "overload-enemy-sniper-motion-v2",
  enemySiegeWalkerMotion: "overload-enemy-siege-walker-motion-v3",
  bossForms: "overload-wrong-engine-forms",
  bossMotion: "overload-wrong-engine-motion-v2",
  combatFx: "overload-combat-fx-atlas",
  manualAbilityPixel: "overload-manual-ability-pixel-atlas",
  aegisWardHd: "overload-aegis-ward-hd-atlas",
  empPulseHd: "overload-emp-pulse-hd-atlas",
  enemyDeathPixel: "overload-enemy-death-pixel-atlas",
  bossPatternCommonPixel: "overload-boss-pattern-common-pixel-atlas",
  bossPatternRegionalPixel: "overload-boss-pattern-regional-pixel-atlas",
  bossTimedBombPixel: "overload-boss-timed-bomb-pixel-atlas",
  automaticSkillPixel: "overload-automatic-skill-pixel-atlas",
  swordSkillPixel: "overload-sword-skill-pixel-atlas",
  swordManualAbilityPixel: "overload-sword-manual-ability-pixel-atlas",
  mikaAbilityPixel: "overload-mika-ability-pixel-atlas",
  vesperAbilityHd: "overload-vesper-ability-hd-atlas",
  noxAbilityHd: "overload-nox-ability-hd-atlas",
  sovereignGateMotion: "overload-sovereign-gate-motion-atlas",
  healingKitMotion: "overload-healing-kit-motion-atlas",
  squadTraces: "overload-squad-traces-atlas",
  rook: "overload-ally-rook",
  nyx: "overload-ally-nyx",
  moss: "overload-ally-moss",
  aegisEcho: "overload-ally-aegis-echo",
  drone: "overload-ally-hunter-drone",
  droneMotion: "overload-ally-hunter-drone-motion-v2",
  suppressorDrone: "overload-ally-suppressor-drone",
  suppressorDroneMotion: "overload-ally-suppressor-drone-motion-v2",
  sentry: "overload-ally-pulse-sentry",
  sentryMotion: "overload-ally-pulse-sentry-motion-v2",
  emp: "overload-ally-emp-pylon",
  wrongEngineArena: "overload-wrong-engine-arena-square-v1",
  glassDuneRoute: "overload-glass-dune-route",
  glassDuneRouteExpanded: "overload-glass-dune-route-expanded-v2",
  glassDuneArena: "overload-glass-dune-arena-square-v1",
  glassDuneBossRoom: "overload-glass-dune-boss-room",
  glassDuneBossForms: "overload-glass-dune-boss-forms",
  glassDuneBossMotion: "overload-glass-dune-boss-motion-v2",
  abyssalArchiveRoute: "overload-abyssal-archive-route",
  abyssalArchiveRouteExpanded: "overload-abyssal-archive-route-expanded-v2",
  abyssalArchiveArena: "overload-abyssal-archive-arena-square-v1",
  abyssalArchiveBossRoom: "overload-abyssal-archive-boss-room",
  abyssalArchiveBossForms: "overload-abyssal-archive-boss-forms",
  abyssalArchiveBossMotion: "overload-abyssal-archive-boss-motion-v2",
  neonFoundryRoute: "overload-neon-foundry-route",
  neonFoundryRouteExpanded: "overload-neon-foundry-route-expanded-v2",
  neonFoundryArena: "overload-neon-foundry-arena-square-v1",
  neonFoundryEnemyForms: "overload-neon-foundry-enemy-forms",
  neonFoundryBossForms: "overload-neon-foundry-boss-forms",
  neonFoundryBossMotion: "overload-neon-foundry-boss-motion-v3",
  stormSpireRoute: "overload-storm-spire-route",
  stormSpireRouteExpanded: "overload-storm-spire-route-expanded-v2",
  stormSpireArena: "overload-storm-spire-arena-square-v1",
  stormSpireEnemyForms: "overload-storm-spire-enemy-forms",
  stormSpireBossForms: "overload-storm-spire-boss-forms",
  stormSpireBossMotion: "overload-storm-spire-boss-motion-v3",
  geneVaultRoute: "overload-gene-vault-route",
  geneVaultRouteExpanded: "overload-gene-vault-route-expanded-v2",
  geneVaultArena: "overload-gene-vault-arena-square-v1",
  geneVaultEnemyForms: "overload-gene-vault-enemy-forms",
  geneVaultBossForms: "overload-gene-vault-boss-forms",
  geneVaultBossMotion: "overload-gene-vault-boss-motion-v3",
  defenseBattlefield: "overload-haven-defense-grid",
  defenseBattlefieldPortrait: "overload-haven-defense-grid-portrait",
  defenseSystemsMotion: "overload-defense-systems-motion-atlas",
  defenseEnemyDirections: "overload-defense-enemy-directions-v3",
  defenseEnemyMotion: "overload-defense-enemy-motion-atlas-v2",
  defenseCombatFxMotion: "overload-defense-combat-vfx-atlas-v2",
} as const);

export const DEFAULT_REGION_ID = "wrong-engine-core" as const;
export const TERMINAL_REGION_IDS = Object.freeze(['eclipse-relay', 'ark-transit', 'sovereign-throne'] as const);
export const REGION_IDS = Object.freeze([DEFAULT_REGION_ID, "glass-dune", "abyssal-archive", "neon-foundry", "storm-spire", "gene-vault", ...TERMINAL_REGION_IDS] as const);
export type RegionId = (typeof REGION_IDS)[number];
export type AssetProfile = "full" | "performance";
export type MainWeaponId = "pulse-rifle" | "beam-sword";
export type PlayableCharacterId = "aegis" | "mika" | "vesper" | "nox";
export type DefenseStageId = "haven-perimeter" | "relay-blackout" | "sovereign-night-siege";

export const PLAYABLE_CHARACTER_IDS = Object.freeze(["aegis", "mika", "vesper", "nox"] as const);

export function resolveAssetProfile(profile?: string): AssetProfile {
  return profile === "performance" ? "performance" : "full";
}

function selectAssetProfile(asset: AssetDefinition, profile?: string): AssetDefinition {
  if (resolveAssetProfile(profile) !== "performance" || !asset.performancePath) return asset;
  return Object.freeze({ ...asset, path: asset.performancePath });
}

function selectAssetProfiles(assets: readonly AssetDefinition[], profile?: string): readonly AssetDefinition[] {
  return Object.freeze(assets.map((asset) => selectAssetProfile(asset, profile)));
}

export function resolveRegionId(regionId?: string): RegionId {
  if (REGION_IDS.includes(regionId as RegionId)) return regionId as RegionId;
  return DEFAULT_REGION_ID;
}

export const COMMON_GAME_ASSETS: readonly AssetDefinition[] = Object.freeze([
  { key: ASSET_KEYS.enemyHunter, path: "./assets/overload/enemies/hunter.png", kind: "image" },
  { key: ASSET_KEYS.enemyRifleman, path: "./assets/overload/enemies/suppressor.png", kind: "image" },
  { key: ASSET_KEYS.enemySniper, path: "./assets/overload/enemies/brute.png", kind: "image" },
  { key: ASSET_KEYS.enemyHunterMotion, path: "./assets/overload/enemies/motion-v2/suicide-drone-motion-atlas.png", performancePath: "./assets/overload/enemies/motion-v2/performance/suicide-drone-motion-atlas.png", kind: "motion", columns: 6, rows: 4 },
  { key: ASSET_KEYS.enemyRiflemanMotion, path: "./assets/overload/quality-v3/rifleman.png", performancePath: "./assets/overload/quality-v3/performance/rifleman.png", kind: "motion", columns: 6, rows: 4 },
  { key: ASSET_KEYS.enemySniperMotion, path: "./assets/overload/quality-v3/sniper.png", performancePath: "./assets/overload/quality-v3/performance/sniper.png", kind: "motion", columns: 6, rows: 4 },
  { key: ASSET_KEYS.enemySiegeWalkerMotion, path: "./assets/overload/quality-v3/siege-walker.png", performancePath: "./assets/overload/quality-v3/performance/siege-walker.png", kind: "motion", columns: 6, rows: 4 },
  { key: ASSET_KEYS.combatFx, path: "./assets/overload/vfx/combat-fx-atlas.png", performancePath: "./assets/overload/vfx/performance/combat-fx-atlas.png", kind: "atlas", columns: 4, rows: 3 },
  { key: ASSET_KEYS.enemyDeathPixel, path: "./assets/overload/vfx/pixel/enemy-death-pixel-atlas.png", kind: "atlas", columns: 6, rows: 1 },
  { key: ASSET_KEYS.automaticSkillPixel, path: "./assets/overload/quality-v3/automatic-skills.png", performancePath: "./assets/overload/quality-v3/performance/automatic-skills.png", kind: "atlas", columns: 6, rows: 4 },
  { key: ASSET_KEYS.sovereignGateMotion, path: "./assets/overload/vfx/gates/sovereign-gate-motion-atlas.png", performancePath: "./assets/overload/vfx/gates/performance/sovereign-gate-motion-atlas.png", kind: "atlas", columns: 6, rows: 1 },
  { key: ASSET_KEYS.healingKitMotion, path: "./assets/overload/items/healing-kit-motion-atlas.png", performancePath: "./assets/overload/items/performance/healing-kit-motion-atlas.png", kind: "atlas", columns: 4, rows: 1 },
  { key: ASSET_KEYS.rook, path: "./assets/overload/allies/rook.png", kind: "image" },
  { key: ASSET_KEYS.nyx, path: "./assets/overload/allies/nyx.png", kind: "image" },
  { key: ASSET_KEYS.moss, path: "./assets/overload/allies/moss.png", kind: "image" },
  { key: ASSET_KEYS.aegisEcho, path: "./assets/overload/allies/aegis-echo.png", kind: "image" },
  { key: ASSET_KEYS.drone, path: "./assets/overload/allies/hunter-drone.png", kind: "image" },
  { key: ASSET_KEYS.suppressorDrone, path: "./assets/overload/allies/suppressor-drone.png", kind: "image" },
  { key: ASSET_KEYS.sentry, path: "./assets/overload/allies/pulse-sentry.png", kind: "image" },
  { key: ASSET_KEYS.emp, path: "./assets/overload/allies/emp-pylon.png", kind: "image" },
]);

const DEFENSE_STAGE_BATTLEFIELD_ASSETS: Readonly<Record<DefenseStageId, readonly AssetDefinition[]>> = Object.freeze({
  "haven-perimeter": Object.freeze([
    { key: ASSET_KEYS.defenseBattlefield, path: "./assets/overload/defense/battlefields-v2/haven-perimeter/battlefield.webp", performancePath: "./assets/overload/defense/battlefields-v2/performance/haven-perimeter/battlefield.webp", kind: "image" as const },
    { key: ASSET_KEYS.defenseBattlefieldPortrait, path: "./assets/overload/defense/battlefields-v2/haven-perimeter/battlefield-portrait.webp", performancePath: "./assets/overload/defense/battlefields-v2/performance/haven-perimeter/battlefield-portrait.webp", kind: "image" as const },
  ]),
  "relay-blackout": Object.freeze([
    { key: ASSET_KEYS.defenseBattlefield, path: "./assets/overload/defense/battlefields-v2/relay-blackout/battlefield.webp", performancePath: "./assets/overload/defense/battlefields-v2/performance/relay-blackout/battlefield.webp", kind: "image" as const },
    { key: ASSET_KEYS.defenseBattlefieldPortrait, path: "./assets/overload/defense/battlefields-v2/relay-blackout/battlefield-portrait.webp", performancePath: "./assets/overload/defense/battlefields-v2/performance/relay-blackout/battlefield-portrait.webp", kind: "image" as const },
  ]),
  "sovereign-night-siege": Object.freeze([
    { key: ASSET_KEYS.defenseBattlefield, path: "./assets/overload/defense/battlefields-v2/sovereign-night-siege/battlefield.webp", performancePath: "./assets/overload/defense/battlefields-v2/performance/sovereign-night-siege/battlefield.webp", kind: "image" as const },
    { key: ASSET_KEYS.defenseBattlefieldPortrait, path: "./assets/overload/defense/battlefields-v2/sovereign-night-siege/battlefield-portrait.webp", performancePath: "./assets/overload/defense/battlefields-v2/performance/sovereign-night-siege/battlefield-portrait.webp", kind: "image" as const },
  ]),
});

const DEFENSE_SHARED_ASSETS: readonly AssetDefinition[] = Object.freeze([
  { key: ASSET_KEYS.defenseEnemyDirections, path: "./assets/overload/quality-v3/defense-directions.png", performancePath: "./assets/overload/quality-v3/performance/defense-directions.png", kind: "motion", columns: 8, rows: 4 },
  { key: ASSET_KEYS.defenseSystemsMotion, path: "./assets/overload/quality-v3/defense-towers.png", performancePath: "./assets/overload/quality-v3/performance/defense-towers.png", kind: "motion", columns: 6, rows: 4 },
  { key: ASSET_KEYS.defenseEnemyMotion, path: "./assets/overload/defense/defense-enemy-motion-atlas-v2.png", performancePath: "./assets/overload/defense/performance/defense-enemy-motion-atlas-v2.png", kind: "motion", columns: 6, rows: 4 },
  { key: ASSET_KEYS.defenseCombatFxMotion, path: "./assets/overload/defense/defense-combat-vfx-atlas-v2.png", performancePath: "./assets/overload/defense/performance/defense-combat-vfx-atlas-v2.png", kind: "motion", columns: 6, rows: 4 },
]);

export function resolveDefenseStageId(stageId?: string): DefenseStageId {
  if (stageId === "relay-blackout" || stageId === "sovereign-night-siege") return stageId;
  return "haven-perimeter";
}

export function getDefenseGameAssets(stageId?: string): readonly AssetDefinition[] {
  return Object.freeze([...DEFENSE_STAGE_BATTLEFIELD_ASSETS[resolveDefenseStageId(stageId)], ...DEFENSE_SHARED_ASSETS]);
}

export const DEFENSE_GAME_ASSETS: readonly AssetDefinition[] = getDefenseGameAssets("haven-perimeter");

export const WEAPON_GAME_ASSETS: Readonly<Record<MainWeaponId, readonly AssetDefinition[]>> = Object.freeze({
  "pulse-rifle": Object.freeze([
    { key: ASSET_KEYS.playerDirectionalAim, path: "./assets/overload/quality-v3/aegis-operative.png", performancePath: "./assets/overload/quality-v3/performance/aegis-operative.png", kind: "motion" as const, columns: 8, rows: 8 },
    { key: ASSET_KEYS.manualAbilityPixel, path: "./assets/overload/quality-v3/aegis-skills.png", performancePath: "./assets/overload/quality-v3/performance/aegis-skills.png", kind: "atlas" as const, columns: 6, rows: 4 },
    { key: ASSET_KEYS.aegisWardHd, path: "./assets/overload/quality-v3/aegis-ward.png", performancePath: "./assets/overload/quality-v3/performance/aegis-ward.png", kind: "atlas" as const, columns: 6, rows: 1 },
    { key: ASSET_KEYS.empPulseHd, path: "./assets/overload/quality-v3/emp-pulse.png", performancePath: "./assets/overload/quality-v3/performance/emp-pulse.png", kind: "atlas" as const, columns: 6, rows: 1 },
  ]),
  "beam-sword": Object.freeze([
    { key: ASSET_KEYS.playerSwordDirectionalAim, path: "./assets/overload/quality-v3/aegis-sword-operative.png", performancePath: "./assets/overload/quality-v3/performance/aegis-sword-operative.png", kind: "motion" as const, columns: 8, rows: 8 },
    { key: ASSET_KEYS.swordSkillPixel, path: "./assets/overload/quality-v3/sword-auto-skills.png", performancePath: "./assets/overload/quality-v3/performance/sword-auto-skills.png", kind: "atlas" as const, columns: 6, rows: 4 },
    { key: ASSET_KEYS.swordManualAbilityPixel, path: "./assets/overload/quality-v3/sword-manual-skills.png", performancePath: "./assets/overload/quality-v3/performance/sword-manual-skills.png", kind: "atlas" as const, columns: 6, rows: 4 },
  ]),
});

export const OPERATIVE_GAME_ASSETS: Readonly<Record<PlayableCharacterId, readonly AssetDefinition[]>> = Object.freeze({
  aegis: Object.freeze([]),
  mika: Object.freeze([
    { key: ASSET_KEYS.playerMikaDirectionalAim, path: "./assets/overload/quality-v3/mika-operative.png", performancePath: "./assets/overload/quality-v3/performance/mika-operative.png", kind: "motion" as const, columns: 8, rows: 8 },
    { key: ASSET_KEYS.mikaAbilityPixel, path: "./assets/overload/quality-v3/mika-skills.png", performancePath: "./assets/overload/quality-v3/performance/mika-skills.png", kind: "atlas" as const, columns: 6, rows: 4 },
  ]),
  vesper: Object.freeze([
    { key: ASSET_KEYS.playerVesperDirectionalAim, path: "./assets/overload/quality-v3/vesper-operative.png", performancePath: "./assets/overload/quality-v3/performance/vesper-operative.png", kind: "motion" as const, columns: 8, rows: 8 },
    { key: ASSET_KEYS.vesperAbilityHd, path: "./assets/overload/quality-v3/vesper-skills.png", performancePath: "./assets/overload/quality-v3/performance/vesper-skills.png", kind: "atlas" as const, columns: 6, rows: 4 },
  ]),
  nox: Object.freeze([
    { key: ASSET_KEYS.playerNoxDirectionalAim, path: "./assets/overload/quality-v3/nox-operative.png", performancePath: "./assets/overload/quality-v3/performance/nox-operative.png", kind: "motion" as const, columns: 8, rows: 8 },
    { key: ASSET_KEYS.noxAbilityHd, path: "./assets/overload/quality-v3/nox-skills.png", performancePath: "./assets/overload/quality-v3/performance/nox-skills.png", kind: "atlas" as const, columns: 6, rows: 4 },
  ]),
});

export function resolveMainWeaponId(value?: string): MainWeaponId {
  return value === "beam-sword" ? "beam-sword" : "pulse-rifle";
}

export const ALLY_MOTION_ASSETS: Readonly<Record<string, AssetDefinition>> = Object.freeze({
  drone: Object.freeze({
    key: ASSET_KEYS.droneMotion,
    path: "./assets/overload/allies/motion-v2/hunter-drone-motion-atlas.png",
    kind: "motion",
    columns: 5,
    rows: 4,
    performancePath: "./assets/overload/allies/motion-v2/performance/hunter-drone-motion-atlas.png",
  }),
  sentry: Object.freeze({
    key: ASSET_KEYS.sentryMotion,
    path: "./assets/overload/allies/motion-v2/pulse-sentry-motion-atlas.png",
    kind: "motion",
    columns: 5,
    rows: 4,
    performancePath: "./assets/overload/allies/motion-v2/performance/pulse-sentry-motion-atlas.png",
  }),
  suppressor: Object.freeze({
    key: ASSET_KEYS.suppressorDroneMotion,
    path: "./assets/overload/allies/motion-v2/suppressor-drone-motion-atlas.png",
    kind: "motion",
    columns: 5,
    rows: 4,
    performancePath: "./assets/overload/allies/motion-v2/performance/suppressor-drone-motion-atlas.png",
  }),
});

export function getAllyMotionAsset(allyId?: string, profile: AssetProfile = "full"): AssetDefinition | null {
  const normalized = String(allyId ?? "").toLowerCase();
  if (normalized.includes("sentry")) return selectAssetProfile(ALLY_MOTION_ASSETS.sentry, profile);
  if (normalized.includes("suppress")) return selectAssetProfile(ALLY_MOTION_ASSETS.suppressor, profile);
  if (normalized.includes("drone") || normalized.includes("hunter")) return selectAssetProfile(ALLY_MOTION_ASSETS.drone, profile);
  return null;
}

function freezeAssets(assets: readonly AssetDefinition[]): readonly AssetDefinition[] {
  return Object.freeze(assets);
}

export const REGION_ROUTE_ASSETS: Readonly<Record<RegionId, readonly AssetDefinition[]>> = Object.freeze({
  ...Object.fromEntries(TERMINAL_REGION_IDS.map(id => [id, freezeAssets([
    { key: `${id}-floor`, path: `./assets/overload/terminal-orbit/${id}/floor.webp`, kind: 'image' },
  ])])) as Record<(typeof TERMINAL_REGION_IDS)[number], readonly AssetDefinition[]>,
  "wrong-engine-core": freezeAssets([
    { key: ASSET_KEYS.wrongEngineArena, path: "./assets/overload/regions/wrong-engine-core/arena-square-v1.webp", performancePath: "./assets/overload/regions/wrong-engine-core/performance/arena-square-v1.webp", kind: "image" },
    { key: ASSET_KEYS.squadTraces, path: "./assets/overload/campaign/squad-traces-atlas.png", performancePath: "./assets/overload/campaign/performance/squad-traces-atlas.png", kind: "atlas", columns: 3, rows: 1 },
  ]),
  "glass-dune": freezeAssets([
    { key: ASSET_KEYS.glassDuneArena, path: "./assets/overload/regions/glass-dune/arena-square-v1.webp", performancePath: "./assets/overload/regions/glass-dune/performance/arena-square-v1.webp", kind: "image" },
  ]),
  "abyssal-archive": freezeAssets([
    { key: ASSET_KEYS.abyssalArchiveArena, path: "./assets/overload/regions/abyssal-archive/arena-square-v1.webp", performancePath: "./assets/overload/regions/abyssal-archive/performance/arena-square-v1.webp", kind: "image" },
  ]),
  "neon-foundry": freezeAssets([
    { key: ASSET_KEYS.neonFoundryArena, path: "./assets/overload/regions/neon-foundry/arena-square-v1.webp", performancePath: "./assets/overload/regions/neon-foundry/performance/arena-square-v1.webp", kind: "image" },
    { key: ASSET_KEYS.neonFoundryEnemyForms, path: "./assets/overload/quality-v3/neon-foundry-enemies.png", performancePath: "./assets/overload/quality-v3/performance/neon-foundry-enemies.png", kind: "motion", columns: 6, rows: 4 },
  ]),
  "storm-spire": freezeAssets([
    { key: ASSET_KEYS.stormSpireArena, path: "./assets/overload/regions/storm-spire/arena-square-v1.webp", performancePath: "./assets/overload/regions/storm-spire/performance/arena-square-v1.webp", kind: "image" },
    { key: ASSET_KEYS.stormSpireEnemyForms, path: "./assets/overload/quality-v3/storm-spire-enemies.png", performancePath: "./assets/overload/quality-v3/performance/storm-spire-enemies.png", kind: "motion", columns: 6, rows: 4 },
  ]),
  "gene-vault": freezeAssets([
    { key: ASSET_KEYS.geneVaultArena, path: "./assets/overload/regions/gene-vault/arena-square-v1.webp", performancePath: "./assets/overload/regions/gene-vault/performance/arena-square-v1.webp", kind: "image" },
    { key: ASSET_KEYS.geneVaultEnemyForms, path: "./assets/overload/quality-v3/gene-vault-enemies.png", performancePath: "./assets/overload/quality-v3/performance/gene-vault-enemies.png", kind: "motion", columns: 6, rows: 4 },
  ]),
});

export const REGION_BOSS_ASSETS: Readonly<Record<RegionId, readonly AssetDefinition[]>> = Object.freeze({
  ...Object.fromEntries(TERMINAL_REGION_IDS.map(id => [id, freezeAssets([
    { key: `${id}-forms`, path: `./assets/overload/terminal-orbit/${id}/boss-forms.png`, kind: 'atlas', columns: 3, rows: 1 },
    { key: `${id}-motion`, path: `./assets/overload/terminal-orbit/${id}/boss-motion.png`,
      performancePath: `./assets/overload/terminal-orbit/${id}/boss-motion-small.png`, kind: 'motion', columns: 4, rows: 2 },
  ])])) as Record<(typeof TERMINAL_REGION_IDS)[number], readonly AssetDefinition[]>,
  "wrong-engine-core": freezeAssets([
    { key: ASSET_KEYS.bossRoom, path: "./assets/overload/environment/boss-chamber.webp", performancePath: "./assets/overload/environment/performance/boss-chamber.webp", kind: "image" },
    { key: ASSET_KEYS.bossForms, path: "./assets/overload/boss/wrong-engine-forms-atlas.png", performancePath: "./assets/overload/boss/performance/wrong-engine-forms-atlas.png", kind: "atlas", columns: 3, rows: 1 },
    { key: ASSET_KEYS.bossMotion, path: "./assets/overload/quality-v3/wrong-engine-core-boss.png", performancePath: "./assets/overload/quality-v3/performance/wrong-engine-core-boss.png", kind: "motion", columns: 6, rows: 4 },
    { key: ASSET_KEYS.bossPatternCommonPixel, path: "./assets/overload/quality-v3/boss-patterns.png", performancePath: "./assets/overload/quality-v3/performance/boss-patterns.png", kind: "atlas", columns: 6, rows: 6 },
    { key: ASSET_KEYS.bossPatternRegionalPixel, path: "./assets/overload/quality-v3/regional-patterns.png", performancePath: "./assets/overload/quality-v3/performance/regional-patterns.png", kind: "atlas", columns: 6, rows: 4 },
    { key: ASSET_KEYS.bossTimedBombPixel, path: "./assets/overload/vfx/pixel/timed-bomb-pixel-atlas.png", kind: "atlas", columns: 6, rows: 2 },
  ]),
  "glass-dune": freezeAssets([
    { key: ASSET_KEYS.glassDuneBossRoom, path: "./assets/overload/regions/glass-dune/boss-room.webp", performancePath: "./assets/overload/regions/glass-dune/performance/boss-room.webp", kind: "image" },
    { key: ASSET_KEYS.glassDuneBossForms, path: "./assets/overload/regions/glass-dune/boss-forms-atlas.png", performancePath: "./assets/overload/regions/glass-dune/performance/boss-forms-atlas.png", kind: "atlas", columns: 3, rows: 1 },
    { key: ASSET_KEYS.glassDuneBossMotion, path: "./assets/overload/quality-v3/glass-dune-boss.png", performancePath: "./assets/overload/quality-v3/performance/glass-dune-boss.png", kind: "motion", columns: 6, rows: 4 },
    { key: ASSET_KEYS.bossPatternCommonPixel, path: "./assets/overload/quality-v3/boss-patterns.png", performancePath: "./assets/overload/quality-v3/performance/boss-patterns.png", kind: "atlas", columns: 6, rows: 6 },
    { key: ASSET_KEYS.bossPatternRegionalPixel, path: "./assets/overload/quality-v3/regional-patterns.png", performancePath: "./assets/overload/quality-v3/performance/regional-patterns.png", kind: "atlas", columns: 6, rows: 4 },
    { key: ASSET_KEYS.bossTimedBombPixel, path: "./assets/overload/vfx/pixel/timed-bomb-pixel-atlas.png", kind: "atlas", columns: 6, rows: 2 },
  ]),
  "abyssal-archive": freezeAssets([
    { key: ASSET_KEYS.abyssalArchiveBossRoom, path: "./assets/overload/regions/abyssal-archive/boss-room.webp", performancePath: "./assets/overload/regions/abyssal-archive/performance/boss-room.webp", kind: "image" },
    { key: ASSET_KEYS.abyssalArchiveBossForms, path: "./assets/overload/regions/abyssal-archive/boss-forms-atlas.png", performancePath: "./assets/overload/regions/abyssal-archive/performance/boss-forms-atlas.png", kind: "atlas", columns: 3, rows: 1 },
    { key: ASSET_KEYS.abyssalArchiveBossMotion, path: "./assets/overload/quality-v3/abyssal-archive-boss.png", performancePath: "./assets/overload/quality-v3/performance/abyssal-archive-boss.png", kind: "motion", columns: 6, rows: 4 },
    { key: ASSET_KEYS.bossPatternCommonPixel, path: "./assets/overload/quality-v3/boss-patterns.png", performancePath: "./assets/overload/quality-v3/performance/boss-patterns.png", kind: "atlas", columns: 6, rows: 6 },
    { key: ASSET_KEYS.bossPatternRegionalPixel, path: "./assets/overload/quality-v3/regional-patterns.png", performancePath: "./assets/overload/quality-v3/performance/regional-patterns.png", kind: "atlas", columns: 6, rows: 4 },
    { key: ASSET_KEYS.bossTimedBombPixel, path: "./assets/overload/vfx/pixel/timed-bomb-pixel-atlas.png", kind: "atlas", columns: 6, rows: 2 },
  ]),
  "neon-foundry": freezeAssets([
    { key: ASSET_KEYS.neonFoundryBossForms, path: "./assets/overload/regions/neon-foundry/boss-forms-atlas.png", performancePath: "./assets/overload/regions/neon-foundry/performance/boss-forms-atlas.png", kind: "atlas", columns: 3, rows: 1 },
    { key: ASSET_KEYS.neonFoundryBossMotion, path: "./assets/overload/quality-v3/neon-foundry-boss.png", performancePath: "./assets/overload/quality-v3/performance/neon-foundry-boss.png", kind: "motion", columns: 8, rows: 4 },
    { key: ASSET_KEYS.bossPatternCommonPixel, path: "./assets/overload/quality-v3/boss-patterns.png", performancePath: "./assets/overload/quality-v3/performance/boss-patterns.png", kind: "atlas", columns: 6, rows: 6 },
    { key: ASSET_KEYS.bossPatternRegionalPixel, path: "./assets/overload/quality-v3/regional-patterns.png", performancePath: "./assets/overload/quality-v3/performance/regional-patterns.png", kind: "atlas", columns: 6, rows: 4 },
    { key: ASSET_KEYS.bossTimedBombPixel, path: "./assets/overload/vfx/pixel/timed-bomb-pixel-atlas.png", kind: "atlas", columns: 6, rows: 2 },
  ]),
  "storm-spire": freezeAssets([
    { key: ASSET_KEYS.stormSpireBossForms, path: "./assets/overload/regions/storm-spire/boss-forms-atlas.png", performancePath: "./assets/overload/regions/storm-spire/performance/boss-forms-atlas.png", kind: "atlas", columns: 3, rows: 1 },
    { key: ASSET_KEYS.stormSpireBossMotion, path: "./assets/overload/quality-v3/storm-spire-boss.png", performancePath: "./assets/overload/quality-v3/performance/storm-spire-boss.png", kind: "motion", columns: 8, rows: 4 },
    { key: ASSET_KEYS.bossPatternCommonPixel, path: "./assets/overload/quality-v3/boss-patterns.png", performancePath: "./assets/overload/quality-v3/performance/boss-patterns.png", kind: "atlas", columns: 6, rows: 6 },
    { key: ASSET_KEYS.bossPatternRegionalPixel, path: "./assets/overload/quality-v3/regional-patterns.png", performancePath: "./assets/overload/quality-v3/performance/regional-patterns.png", kind: "atlas", columns: 6, rows: 4 },
    { key: ASSET_KEYS.bossTimedBombPixel, path: "./assets/overload/vfx/pixel/timed-bomb-pixel-atlas.png", kind: "atlas", columns: 6, rows: 2 },
  ]),
  "gene-vault": freezeAssets([
    { key: ASSET_KEYS.geneVaultBossForms, path: "./assets/overload/regions/gene-vault/boss-forms-atlas.png", performancePath: "./assets/overload/regions/gene-vault/performance/boss-forms-atlas.png", kind: "atlas", columns: 3, rows: 1 },
    { key: ASSET_KEYS.geneVaultBossMotion, path: "./assets/overload/quality-v3/gene-vault-boss.png", performancePath: "./assets/overload/quality-v3/performance/gene-vault-boss.png", kind: "motion", columns: 8, rows: 4 },
    { key: ASSET_KEYS.bossPatternCommonPixel, path: "./assets/overload/quality-v3/boss-patterns.png", performancePath: "./assets/overload/quality-v3/performance/boss-patterns.png", kind: "atlas", columns: 6, rows: 6 },
    { key: ASSET_KEYS.bossPatternRegionalPixel, path: "./assets/overload/quality-v3/regional-patterns.png", performancePath: "./assets/overload/quality-v3/performance/regional-patterns.png", kind: "atlas", columns: 6, rows: 4 },
    { key: ASSET_KEYS.bossTimedBombPixel, path: "./assets/overload/vfx/pixel/timed-bomb-pixel-atlas.png", kind: "atlas", columns: 6, rows: 2 },
  ]),
});

export const REGION_GAME_ASSETS: Readonly<Record<RegionId, readonly AssetDefinition[]>> = Object.freeze(Object.fromEntries(
  REGION_IDS.map((regionId) => [regionId, freezeAssets([...REGION_ROUTE_ASSETS[regionId], ...REGION_BOSS_ASSETS[regionId]])]),
) as Record<RegionId, readonly AssetDefinition[]>);

export function getRegionArenaAsset(regionId?: string, profile: AssetProfile = "full"): AssetDefinition {
  return selectAssetProfile(REGION_ROUTE_ASSETS[resolveRegionId(regionId)][0], profile);
}

export function getOperativeGameAssets(characterIds: readonly string[] = PLAYABLE_CHARACTER_IDS, profile: AssetProfile = "full"): readonly AssetDefinition[] {
  const requested = new Set(characterIds.filter((id): id is PlayableCharacterId => PLAYABLE_CHARACTER_IDS.includes(id as PlayableCharacterId)));
  requested.add("aegis");
  return selectAssetProfiles(PLAYABLE_CHARACTER_IDS.flatMap((id) => requested.has(id) ? OPERATIVE_GAME_ASSETS[id] : []), profile);
}

export function getGameAssetsForRegion(
  regionId?: string,
  profile: AssetProfile = "full",
  mainWeaponId: MainWeaponId = "pulse-rifle",
  availableCharacterIds: readonly string[] = PLAYABLE_CHARACTER_IDS,
): readonly AssetDefinition[] {
  const resolved = resolveRegionId(regionId);
  const weapon = resolveMainWeaponId(mainWeaponId);
  return Object.freeze([
    ...selectAssetProfiles([...COMMON_GAME_ASSETS, ...WEAPON_GAME_ASSETS[weapon], ...REGION_ROUTE_ASSETS[resolved]], profile),
    ...getOperativeGameAssets(availableCharacterIds, profile),
  ]);
}

export function getBossGameAssetsForRegion(regionId?: string, profile: AssetProfile = "full"): readonly AssetDefinition[] {
  return selectAssetProfiles(REGION_BOSS_ASSETS[resolveRegionId(regionId)], profile);
}

export const DOM_PREVIEW_ASSET_PATHS = Object.freeze({
  intro: "./assets/overload/intro/start-screen-anime-v1.webp",
  map: "./assets/overload/environment/sector-01-shattered-approach.webp",
  player: "./assets/overload/portraits/anime-v1/aegis.webp",
  portrait: "./assets/overload/portraits/anime-v1/aegis.webp",
  mikaPortrait: "./assets/overload/portraits/anime-v1/mika.webp",
  vesperPortrait: "./assets/overload/portraits/anime-v1/vesper.webp",
  noxPortrait: "./assets/overload/portraits/anime-v1/nox.webp",
  hunter: "./assets/overload/enemies/hunter.png",
  suppressor: "./assets/overload/enemies/suppressor.png",
  brute: "./assets/overload/enemies/brute.png",
  boss: "./assets/overload/boss/wrong-engine-phase1.png",
  bossPhase2: "./assets/overload/boss/wrong-engine-phase2.png",
  bossPhase3: "./assets/overload/boss/wrong-engine-phase3.png",
  enemyMotion: "./assets/overload/enemies/enemy-motion-atlas.png",
  bossMotion: "./assets/overload/boss/wrong-engine-forms-atlas.png",
  sentry: "./assets/overload/allies/pulse-sentry.png",
  emp: "./assets/overload/allies/emp-pylon.png",
  havenBase: "./assets/overload/campaign/haven-09-base.webp",
  havenLobby: "./assets/overload/campaign/lobby/haven-command-atrium.webp",
  hanaResearchLab: "./assets/overload/campaign/lobby/hana-research-lab.webp",
  ilyaEquipmentWorkshop: "./assets/overload/campaign/lobby/ilya-equipment-workshop.webp",
  characterSyncChamber: "./assets/overload/campaign/lobby/character-sync-chamber.webp",
  mobileMenuIconAtlas: "./assets/overload/ui/campaign/command-menu-icons-v2.webp",
  augmentationCoreVisual: "./assets/overload/ui/campaign/augmentation-core-visual-v1.webp",
  hanaPortrait: "./assets/overload/portraits/anime-v1/hana.webp",
  ilyaPortrait: "./assets/overload/portraits/anime-v1/ilya.webp",
  nightjarPilot: "./assets/overload/portraits/anime-v1/sera.webp",
  rheaControlOfficer: "./assets/overload/portraits/anime-v1/rhea.webp",
  tutorialEmpPulse: "./assets/overload/ui/tutorial/emp-pulse-gameplay.jpg",
  tutorialAegisWard: "./assets/overload/ui/tutorial/aegis-ward-gameplay.jpg",
  tutorialStratosRun: "./assets/overload/ui/tutorial/stratos-run-gameplay.jpg",
  tutorialHelixTempest: "./assets/overload/ui/tutorial/helix-tempest-gameplay.jpg",
  airshipRegionMap: "./assets/overload/campaign/strategic-world-map.webp",
  innerNetworkRegionMap: "./assets/overload/campaign/airship-region-map-v2.webp",
  outerFrontierRegionMap: "./assets/overload/campaign/outer-frontier-region-map.webp",
  returnToHaven: "./assets/overload/campaign/return-to-haven.webp",
  characterEnhancement: "./assets/overload/campaign/character-enhancement.webp",
  defenseBattlefield: "./assets/overload/defense/battlefields-v2/haven-perimeter/battlefield.webp",
  defenseBattlefieldPortrait: "./assets/overload/defense/battlefields-v2/haven-perimeter/battlefield-portrait.webp",
  sortieWrongEngine: "./assets/overload/campaign/sortie/wrong-engine-sortie.mp4",
  sortieGlassDune: "./assets/overload/campaign/sortie/glass-dune-sortie.mp4",
  sortieAbyssalArchive: "./assets/overload/campaign/sortie/abyssal-archive-sortie.mp4",
  drone: "./assets/overload/allies/hunter-drone.png",
  rewardScatter: "./assets/overload/ui/rewards/scatter.webp",
  rewardRail: "./assets/overload/ui/rewards/rail.webp",
  rewardRocket: "./assets/overload/ui/rewards/rocket.webp",
  rewardOrbit: "./assets/overload/ui/rewards/orbit.webp",
  rewardPulse: "./assets/overload/ui/rewards/pulse.webp",
  rewardDamage: "./assets/overload/ui/rewards/damage.webp",
  rewardFireRate: "./assets/overload/ui/rewards/fireRate.webp",
  rewardMultishot: "./assets/overload/ui/rewards/multishot.webp",
  rewardShield: "./assets/overload/ui/rewards/shield.webp",
  rewardDash: "./assets/overload/ui/rewards/dash.webp",
  rewardRegen: "./assets/overload/ui/rewards/regen.webp",
  rewardChain: "./assets/overload/ui/rewards/chain.webp",
  rewardNova: "./assets/overload/ui/rewards/nova.webp",
  rewardAirstrike: "./assets/overload/ui/rewards/airstrike.webp",
  rewardOmegaLaser: "./assets/overload/ui/rewards/omegaLaser.webp",
  rewardDrone: "./assets/overload/ui/rewards/drone.webp",
  rewardSentry: "./assets/overload/ui/rewards/sentry.webp",
  rewardSuppressor: "./assets/overload/ui/rewards/suppressor.webp",
  rewardSquadRecall: "./assets/overload/ui/rewards/squadRecall.webp",
  rewardAiCore: "./assets/overload/ui/rewards/aiCore.webp",
});

export const TITLE_BGM_PATH = "./assets/audio/under-ashen-skies-title.mp3";
export const BASE_BGM_PATH = "./assets/audio/last-light-in-haven-09.mp3";
export const DEFENSE_BGM_PATH = "./assets/audio/haven-defense.mp3";
export const RECRUITMENT_BGM_PATH = "./assets/audio/recruitment-sync.mp3";
export const REGION_BGM_PATHS = Object.freeze({
  "wrong-engine-core": "./assets/audio/overload-main-theme.mp3",
  "glass-dune": "./assets/audio/refraction-war-glass-dune.mp3",
  "abyssal-archive": "./assets/audio/memory-below-pressure-abyssal-archive.mp3",
  "neon-foundry": "./assets/audio/neon-foundry.mp3",
  "storm-spire": "./assets/audio/storm-spire.mp3",
  "gene-vault": "./assets/audio/gene-vault.mp3",
  'eclipse-relay': './assets/audio/storm-spire.mp3',
  'ark-transit': './assets/audio/refraction-war-glass-dune.mp3',
  'sovereign-throne': './assets/audio/memory-below-pressure-abyssal-archive.mp3',
});

export const AGENT_VOICE_PATHS = Object.freeze({
  stratosRun: "./assets/audio/agent/stratos-run-v2.mp3",
  helixTempest: "./assets/audio/agent/helix-tempest-start.mp3",
});

export function frameCrop(
  sourceWidth: number,
  sourceHeight: number,
  columns: number,
  rows: number,
  column: number,
  row: number,
) {
  const width = sourceWidth / columns;
  const height = sourceHeight / rows;
  return {
    x: width * Math.max(0, Math.min(columns - 1, column)),
    y: height * Math.max(0, Math.min(rows - 1, row)),
    width,
    height,
  };
}

// Lazy-loaded lobby/profile models; never part of combat preload.
export const CUBISM_PORTRAITS = {
  "aegis": {
    "core": "./assets/overload/live2d/anime-v2/live2dcubismcore.min.js",
    "moc": "./assets/overload/live2d/anime-v2/aegis/aegis-anime-v2.moc3",
    "layout": "./assets/overload/live2d/anime-v2/aegis/runtime-textures.json",
    "textures": [
      "./assets/overload/live2d/anime-v2/aegis/runtime-texture-0.png"
    ]
  },
  "mika": {
    "core": "./assets/overload/live2d/anime-v2/live2dcubismcore.min.js",
    "moc": "./assets/overload/live2d/anime-v2/mika/mika-anime-v2.moc3",
    "layout": "./assets/overload/live2d/anime-v2/mika/runtime-textures.json",
    "textures": [
      "./assets/overload/live2d/anime-v2/mika/runtime-texture-0.png",
      "./assets/overload/live2d/anime-v2/mika/runtime-texture-1.png"
    ]
  },
  "vesper": {
    "core": "./assets/overload/live2d/anime-v2/live2dcubismcore.min.js",
    "moc": "./assets/overload/live2d/anime-v2/vesper/vesper-anime-v2.moc3",
    "layout": "./assets/overload/live2d/anime-v2/vesper/runtime-textures.json",
    "textures": [
      "./assets/overload/live2d/anime-v2/vesper/runtime-texture-0.png"
    ]
  },
  "nox": {
    "core": "./assets/overload/live2d/anime-v2/live2dcubismcore.min.js",
    "moc": "./assets/overload/live2d/anime-v2/nox/nox-anime-v2.moc3",
    "layout": "./assets/overload/live2d/anime-v2/nox/runtime-textures.json",
    "textures": [
      "./assets/overload/live2d/anime-v2/nox/runtime-texture-0.png",
      "./assets/overload/live2d/anime-v2/nox/runtime-texture-1.png"
    ]
  }
} as const;

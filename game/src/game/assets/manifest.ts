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
  bossRoom: "overload-boss-chamber",
  playerDirectionalAim: "survivor-directional-aim-atlas",
  playerSwordDirectionalAim: "survivor-sword-directional-aim-atlas",
  enemyMotion: "overload-enemy-motion-atlas",
  enemyHunter: "overload-enemy-hunter-static",
  enemyRifleman: "overload-enemy-rifleman-static",
  enemySniper: "overload-enemy-sniper-static",
  enemyHunterMotion: "overload-enemy-hunter-motion-v2",
  enemyRiflemanMotion: "overload-enemy-rifleman-motion-v2",
  enemySniperMotion: "overload-enemy-sniper-motion-v2",
  bossForms: "overload-wrong-engine-forms",
  bossMotion: "overload-wrong-engine-motion-v2",
  combatFx: "overload-combat-fx-atlas",
  manualAbilityPixel: "overload-manual-ability-pixel-atlas",
  enemyDeathPixel: "overload-enemy-death-pixel-atlas",
  bossPatternCommonPixel: "overload-boss-pattern-common-pixel-atlas",
  bossPatternRegionalPixel: "overload-boss-pattern-regional-pixel-atlas",
  bossTimedBombPixel: "overload-boss-timed-bomb-pixel-atlas",
  automaticSkillPixel: "overload-automatic-skill-pixel-atlas",
  swordSkillPixel: "overload-sword-skill-pixel-atlas",
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
  glassDuneRoute: "overload-glass-dune-route",
  glassDuneBossRoom: "overload-glass-dune-boss-room",
  glassDuneBossForms: "overload-glass-dune-boss-forms",
  glassDuneBossMotion: "overload-glass-dune-boss-motion-v2",
  abyssalArchiveRoute: "overload-abyssal-archive-route",
  abyssalArchiveBossRoom: "overload-abyssal-archive-boss-room",
  abyssalArchiveBossForms: "overload-abyssal-archive-boss-forms",
  abyssalArchiveBossMotion: "overload-abyssal-archive-boss-motion-v2",
  neonFoundryRoute: "overload-neon-foundry-route",
  neonFoundryEnemyForms: "overload-neon-foundry-enemy-forms",
  neonFoundryBossForms: "overload-neon-foundry-boss-forms",
  stormSpireRoute: "overload-storm-spire-route",
  stormSpireEnemyForms: "overload-storm-spire-enemy-forms",
  stormSpireBossForms: "overload-storm-spire-boss-forms",
  geneVaultRoute: "overload-gene-vault-route",
  geneVaultEnemyForms: "overload-gene-vault-enemy-forms",
  geneVaultBossForms: "overload-gene-vault-boss-forms",
} as const);

export const DEFAULT_REGION_ID = "wrong-engine-core" as const;
export const REGION_IDS = Object.freeze([DEFAULT_REGION_ID, "glass-dune", "abyssal-archive", "neon-foundry", "storm-spire", "gene-vault"] as const);
export type RegionId = (typeof REGION_IDS)[number];
export type AssetProfile = "full" | "performance";
export type MainWeaponId = "pulse-rifle" | "beam-sword";

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
  { key: ASSET_KEYS.enemyRiflemanMotion, path: "./assets/overload/enemies/motion-v2/rifleman-motion-atlas.png", performancePath: "./assets/overload/enemies/motion-v2/performance/rifleman-motion-atlas.png", kind: "motion", columns: 6, rows: 4 },
  { key: ASSET_KEYS.enemySniperMotion, path: "./assets/overload/enemies/motion-v2/sniper-motion-atlas.png", performancePath: "./assets/overload/enemies/motion-v2/performance/sniper-motion-atlas.png", kind: "motion", columns: 6, rows: 4 },
  { key: ASSET_KEYS.combatFx, path: "./assets/overload/vfx/combat-fx-atlas.png", performancePath: "./assets/overload/vfx/performance/combat-fx-atlas.png", kind: "atlas", columns: 4, rows: 3 },
  { key: ASSET_KEYS.manualAbilityPixel, path: "./assets/overload/vfx/pixel/manual-ability-pixel-atlas.png", kind: "atlas", columns: 6, rows: 4 },
  { key: ASSET_KEYS.enemyDeathPixel, path: "./assets/overload/vfx/pixel/enemy-death-pixel-atlas.png", kind: "atlas", columns: 6, rows: 1 },
  { key: ASSET_KEYS.automaticSkillPixel, path: "./assets/overload/vfx/pixel/automatic-skill-pixel-atlas.png", kind: "atlas", columns: 6, rows: 4 },
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

export const WEAPON_GAME_ASSETS: Readonly<Record<MainWeaponId, readonly AssetDefinition[]>> = Object.freeze({
  "pulse-rifle": Object.freeze([
    { key: ASSET_KEYS.playerDirectionalAim, path: "./assets/overload/hero/survivor-directional-aim-atlas.png", performancePath: "./assets/overload/hero/performance/survivor-directional-aim-atlas.png", kind: "motion" as const, columns: 8, rows: 8 },
  ]),
  "beam-sword": Object.freeze([
    { key: ASSET_KEYS.playerSwordDirectionalAim, path: "./assets/overload/hero/survivor-sword-directional-aim-atlas.png", performancePath: "./assets/overload/hero/performance/survivor-sword-directional-aim-atlas.png", kind: "motion" as const, columns: 8, rows: 8 },
    { key: ASSET_KEYS.swordSkillPixel, path: "./assets/overload/vfx/pixel/sword-skill-pixel-atlas.png", kind: "atlas" as const, columns: 6, rows: 4 },
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
  "wrong-engine-core": freezeAssets([
    { key: ASSET_KEYS.sector1, path: "./assets/overload/environment/sector-01-shattered-approach.webp", performancePath: "./assets/overload/environment/performance/sector-01-shattered-approach.webp", kind: "image" },
    { key: ASSET_KEYS.sector2, path: "./assets/overload/environment/sector-02-flooded-memorial.webp", performancePath: "./assets/overload/environment/performance/sector-02-flooded-memorial.webp", kind: "image" },
    { key: ASSET_KEYS.sector3, path: "./assets/overload/environment/sector-03-engine-causeway.webp", performancePath: "./assets/overload/environment/performance/sector-03-engine-causeway.webp", kind: "image" },
    { key: ASSET_KEYS.squadTraces, path: "./assets/overload/campaign/squad-traces-atlas.png", performancePath: "./assets/overload/campaign/performance/squad-traces-atlas.png", kind: "atlas", columns: 3, rows: 1 },
  ]),
  "glass-dune": freezeAssets([
    { key: ASSET_KEYS.glassDuneRoute, path: "./assets/overload/regions/glass-dune/route.webp", performancePath: "./assets/overload/regions/glass-dune/performance/route.webp", kind: "image" },
  ]),
  "abyssal-archive": freezeAssets([
    { key: ASSET_KEYS.abyssalArchiveRoute, path: "./assets/overload/regions/abyssal-archive/route.webp", performancePath: "./assets/overload/regions/abyssal-archive/performance/route.webp", kind: "image" },
  ]),
  "neon-foundry": freezeAssets([
    { key: ASSET_KEYS.neonFoundryRoute, path: "./assets/overload/regions/neon-foundry/route.webp", performancePath: "./assets/overload/regions/neon-foundry/performance/route.webp", kind: "image" },
    { key: ASSET_KEYS.neonFoundryEnemyForms, path: "./assets/overload/regions/neon-foundry/enemy-forms-atlas.png", performancePath: "./assets/overload/regions/neon-foundry/performance/enemy-forms-atlas.png", kind: "atlas", columns: 4, rows: 1 },
  ]),
  "storm-spire": freezeAssets([
    { key: ASSET_KEYS.stormSpireRoute, path: "./assets/overload/regions/storm-spire/route.webp", performancePath: "./assets/overload/regions/storm-spire/performance/route.webp", kind: "image" },
    { key: ASSET_KEYS.stormSpireEnemyForms, path: "./assets/overload/regions/storm-spire/enemy-forms-atlas.png", performancePath: "./assets/overload/regions/storm-spire/performance/enemy-forms-atlas.png", kind: "atlas", columns: 4, rows: 1 },
  ]),
  "gene-vault": freezeAssets([
    { key: ASSET_KEYS.geneVaultRoute, path: "./assets/overload/regions/gene-vault/route.webp", performancePath: "./assets/overload/regions/gene-vault/performance/route.webp", kind: "image" },
    { key: ASSET_KEYS.geneVaultEnemyForms, path: "./assets/overload/regions/gene-vault/enemy-forms-atlas.png", performancePath: "./assets/overload/regions/gene-vault/performance/enemy-forms-atlas.png", kind: "atlas", columns: 4, rows: 1 },
  ]),
});

export const REGION_BOSS_ASSETS: Readonly<Record<RegionId, readonly AssetDefinition[]>> = Object.freeze({
  "wrong-engine-core": freezeAssets([
    { key: ASSET_KEYS.bossRoom, path: "./assets/overload/environment/boss-chamber.webp", performancePath: "./assets/overload/environment/performance/boss-chamber.webp", kind: "image" },
    { key: ASSET_KEYS.bossForms, path: "./assets/overload/boss/wrong-engine-forms-atlas.png", performancePath: "./assets/overload/boss/performance/wrong-engine-forms-atlas.png", kind: "atlas", columns: 3, rows: 1 },
    { key: ASSET_KEYS.bossMotion, path: "./assets/overload/boss/motion-v2/wrong-engine-motion-atlas.png", performancePath: "./assets/overload/boss/motion-v2/performance/wrong-engine-motion-atlas.png", kind: "motion", columns: 6, rows: 4 },
    { key: ASSET_KEYS.bossPatternCommonPixel, path: "./assets/overload/vfx/pixel/boss-pattern-common-pixel-atlas.png", kind: "atlas", columns: 6, rows: 6 },
    { key: ASSET_KEYS.bossPatternRegionalPixel, path: "./assets/overload/vfx/pixel/boss-pattern-regional-pixel-atlas.png", kind: "atlas", columns: 6, rows: 4 },
    { key: ASSET_KEYS.bossTimedBombPixel, path: "./assets/overload/vfx/pixel/timed-bomb-pixel-atlas.png", kind: "atlas", columns: 6, rows: 2 },
  ]),
  "glass-dune": freezeAssets([
    { key: ASSET_KEYS.glassDuneBossRoom, path: "./assets/overload/regions/glass-dune/boss-room.webp", performancePath: "./assets/overload/regions/glass-dune/performance/boss-room.webp", kind: "image" },
    { key: ASSET_KEYS.glassDuneBossForms, path: "./assets/overload/regions/glass-dune/boss-forms-atlas.png", performancePath: "./assets/overload/regions/glass-dune/performance/boss-forms-atlas.png", kind: "atlas", columns: 3, rows: 1 },
    { key: ASSET_KEYS.glassDuneBossMotion, path: "./assets/overload/regions/glass-dune/motion-v2/mirror-tyrant-motion-atlas.png", performancePath: "./assets/overload/regions/glass-dune/motion-v2/performance/mirror-tyrant-motion-atlas.png", kind: "motion", columns: 6, rows: 4 },
    { key: ASSET_KEYS.bossPatternCommonPixel, path: "./assets/overload/vfx/pixel/boss-pattern-common-pixel-atlas.png", kind: "atlas", columns: 6, rows: 6 },
    { key: ASSET_KEYS.bossPatternRegionalPixel, path: "./assets/overload/vfx/pixel/boss-pattern-regional-pixel-atlas.png", kind: "atlas", columns: 6, rows: 4 },
    { key: ASSET_KEYS.bossTimedBombPixel, path: "./assets/overload/vfx/pixel/timed-bomb-pixel-atlas.png", kind: "atlas", columns: 6, rows: 2 },
  ]),
  "abyssal-archive": freezeAssets([
    { key: ASSET_KEYS.abyssalArchiveBossRoom, path: "./assets/overload/regions/abyssal-archive/boss-room.webp", performancePath: "./assets/overload/regions/abyssal-archive/performance/boss-room.webp", kind: "image" },
    { key: ASSET_KEYS.abyssalArchiveBossForms, path: "./assets/overload/regions/abyssal-archive/boss-forms-atlas.png", performancePath: "./assets/overload/regions/abyssal-archive/performance/boss-forms-atlas.png", kind: "atlas", columns: 3, rows: 1 },
    { key: ASSET_KEYS.abyssalArchiveBossMotion, path: "./assets/overload/regions/abyssal-archive/motion-v2/drowned-oracle-motion-atlas.png", performancePath: "./assets/overload/regions/abyssal-archive/motion-v2/performance/drowned-oracle-motion-atlas.png", kind: "motion", columns: 6, rows: 4 },
    { key: ASSET_KEYS.bossPatternCommonPixel, path: "./assets/overload/vfx/pixel/boss-pattern-common-pixel-atlas.png", kind: "atlas", columns: 6, rows: 6 },
    { key: ASSET_KEYS.bossPatternRegionalPixel, path: "./assets/overload/vfx/pixel/boss-pattern-regional-pixel-atlas.png", kind: "atlas", columns: 6, rows: 4 },
    { key: ASSET_KEYS.bossTimedBombPixel, path: "./assets/overload/vfx/pixel/timed-bomb-pixel-atlas.png", kind: "atlas", columns: 6, rows: 2 },
  ]),
  "neon-foundry": freezeAssets([
    { key: ASSET_KEYS.neonFoundryBossForms, path: "./assets/overload/regions/neon-foundry/boss-forms-atlas.png", performancePath: "./assets/overload/regions/neon-foundry/performance/boss-forms-atlas.png", kind: "atlas", columns: 3, rows: 1 },
    { key: ASSET_KEYS.bossPatternCommonPixel, path: "./assets/overload/vfx/pixel/boss-pattern-common-pixel-atlas.png", kind: "atlas", columns: 6, rows: 6 },
    { key: ASSET_KEYS.bossPatternRegionalPixel, path: "./assets/overload/vfx/pixel/boss-pattern-regional-pixel-atlas.png", kind: "atlas", columns: 6, rows: 4 },
    { key: ASSET_KEYS.bossTimedBombPixel, path: "./assets/overload/vfx/pixel/timed-bomb-pixel-atlas.png", kind: "atlas", columns: 6, rows: 2 },
  ]),
  "storm-spire": freezeAssets([
    { key: ASSET_KEYS.stormSpireBossForms, path: "./assets/overload/regions/storm-spire/boss-forms-atlas.png", performancePath: "./assets/overload/regions/storm-spire/performance/boss-forms-atlas.png", kind: "atlas", columns: 3, rows: 1 },
    { key: ASSET_KEYS.bossPatternCommonPixel, path: "./assets/overload/vfx/pixel/boss-pattern-common-pixel-atlas.png", kind: "atlas", columns: 6, rows: 6 },
    { key: ASSET_KEYS.bossPatternRegionalPixel, path: "./assets/overload/vfx/pixel/boss-pattern-regional-pixel-atlas.png", kind: "atlas", columns: 6, rows: 4 },
    { key: ASSET_KEYS.bossTimedBombPixel, path: "./assets/overload/vfx/pixel/timed-bomb-pixel-atlas.png", kind: "atlas", columns: 6, rows: 2 },
  ]),
  "gene-vault": freezeAssets([
    { key: ASSET_KEYS.geneVaultBossForms, path: "./assets/overload/regions/gene-vault/boss-forms-atlas.png", performancePath: "./assets/overload/regions/gene-vault/performance/boss-forms-atlas.png", kind: "atlas", columns: 3, rows: 1 },
    { key: ASSET_KEYS.bossPatternCommonPixel, path: "./assets/overload/vfx/pixel/boss-pattern-common-pixel-atlas.png", kind: "atlas", columns: 6, rows: 6 },
    { key: ASSET_KEYS.bossPatternRegionalPixel, path: "./assets/overload/vfx/pixel/boss-pattern-regional-pixel-atlas.png", kind: "atlas", columns: 6, rows: 4 },
    { key: ASSET_KEYS.bossTimedBombPixel, path: "./assets/overload/vfx/pixel/timed-bomb-pixel-atlas.png", kind: "atlas", columns: 6, rows: 2 },
  ]),
});

export const REGION_GAME_ASSETS: Readonly<Record<RegionId, readonly AssetDefinition[]>> = Object.freeze(Object.fromEntries(
  REGION_IDS.map((regionId) => [regionId, freezeAssets([...REGION_ROUTE_ASSETS[regionId], ...REGION_BOSS_ASSETS[regionId]])]),
) as Record<RegionId, readonly AssetDefinition[]>);

export function getGameAssetsForRegion(regionId?: string, profile: AssetProfile = "full", mainWeaponId: MainWeaponId = "pulse-rifle"): readonly AssetDefinition[] {
  const resolved = resolveRegionId(regionId);
  const weapon = resolveMainWeaponId(mainWeaponId);
  return selectAssetProfiles([...COMMON_GAME_ASSETS, ...WEAPON_GAME_ASSETS[weapon], ...REGION_ROUTE_ASSETS[resolved]], profile);
}

export function getBossGameAssetsForRegion(regionId?: string, profile: AssetProfile = "full"): readonly AssetDefinition[] {
  return selectAssetProfiles(REGION_BOSS_ASSETS[resolveRegionId(regionId)], profile);
}

export const DOM_PREVIEW_ASSET_PATHS = Object.freeze({
  intro: "./assets/overload/intro/start-screen-key-art.webp",
  map: "./assets/overload/environment/sector-01-shattered-approach.webp",
  player: "./assets/overload/hero/survivor-portrait.png",
  portrait: "./assets/overload/hero/survivor-portrait.png",
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
  havenNpcPortraits: "./assets/overload/ui/npcs/haven-npc-portraits-atlas.png",
  rheaControlOfficer: "./assets/overload/ui/npcs/rhea-control-officer.png",
  tutorialEmpPulse: "./assets/overload/ui/tutorial/emp-pulse-gameplay.jpg",
  tutorialAegisWard: "./assets/overload/ui/tutorial/aegis-ward-gameplay.jpg",
  tutorialStratosRun: "./assets/overload/ui/tutorial/stratos-run-gameplay.jpg",
  tutorialHelixTempest: "./assets/overload/ui/tutorial/helix-tempest-gameplay.jpg",
  airshipRegionMap: "./assets/overload/campaign/strategic-world-map.webp",
  innerNetworkRegionMap: "./assets/overload/campaign/airship-region-map-v2.webp",
  outerFrontierRegionMap: "./assets/overload/campaign/outer-frontier-region-map.webp",
  returnToHaven: "./assets/overload/campaign/return-to-haven.webp",
  commandButtonStates: "./assets/overload/ui/buttons/command-button-states-atlas.png",
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
export const REGION_BGM_PATHS = Object.freeze({
  "wrong-engine-core": "./assets/audio/overload-main-theme.mp3",
  "glass-dune": "./assets/audio/refraction-war-glass-dune.mp3",
  "abyssal-archive": "./assets/audio/memory-below-pressure-abyssal-archive.mp3",
});

export const AGENT_VOICE_PATHS = Object.freeze({
  empPulse: "./assets/audio/agent/emp-pulse-online.mp3",
  aegisWard: "./assets/audio/agent/aegis-ward-online.mp3",
  stratosRun: "./assets/audio/agent/stratos-run-confirmed.mp3",
  helixTempest: "./assets/audio/agent/helix-tempest-authorized.mp3",
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

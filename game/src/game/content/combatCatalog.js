import { TERMINAL_PATTERNS } from './terminalCampaign.js';
export const BOSS_PATTERNS = Object.freeze([
  "radial",
  "sweep",
  "bombs",
  "rings",
  "charge",
  "multiCharge",
]);

export const REGION_BOSS_PATTERNS = Object.freeze({
  ...TERMINAL_PATTERNS,
  "wrong-engine-core": BOSS_PATTERNS,
  "glass-dune": Object.freeze(["prismLattice", "solarFlare", "refractionSweep", "mirrorShards"]),
  "abyssal-archive": Object.freeze(["memorySpiral", "depthCollapse", "archiveEcho", "undertow"]),
  "neon-foundry": Object.freeze(["solarFlare", "sweep", "bombs", "multiCharge"]),
  "storm-spire": Object.freeze(["memorySpiral", "prismLattice", "rings", "multiCharge"]),
  "gene-vault": Object.freeze(["depthCollapse", "radial", "bombs", "undertow"]),
});

export const REGION_MID_BOSS_PROFILES = Object.freeze({
  "neon-foundry": Object.freeze({
    id: "press-warden",
    name: "PRESS WARDEN",
    koreanName: "프레스 감시관",
    maxHp: 52000,
    combatRole: "pressWarden",
    signature: "PRESS SLAM",
  }),
  "storm-spire": Object.freeze({
    id: "thunder-manta",
    name: "THUNDER MANTA",
    koreanName: "천둥 가오리",
    maxHp: 56000,
    combatRole: "thunderManta",
    signature: "ARC VOLLEY",
  }),
  "gene-vault": Object.freeze({
    id: "chimera-custodian",
    name: "CHIMERA CUSTODIAN",
    koreanName: "키메라 수문장",
    maxHp: 60000,
    combatRole: "chimeraCustodian",
    signature: "CHIMERA RUSH",
  }),
});

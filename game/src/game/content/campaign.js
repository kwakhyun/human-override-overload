const BOSS_PATTERN_SET = Object.freeze(["radial", "sweep", "bombs", "rings", "charge", "multiCharge"]);
const GLASS_DUNE_BOSS_PATTERN_SET = Object.freeze(["radial", "prismLattice", "sweep", "solarFlare", "bombs", "rings", "charge", "multiCharge"]);
const ABYSSAL_BOSS_PATTERN_SET = Object.freeze(["radial", "memorySpiral", "sweep", "depthCollapse", "bombs", "rings", "charge", "multiCharge"]);
const FOUNDRY_BOSS_PATTERN_SET = Object.freeze(["sweep", "solarFlare", "bombs", "charge", "multiCharge"]);
const STORM_BOSS_PATTERN_SET = Object.freeze(["memorySpiral", "prismLattice", "rings", "charge", "multiCharge"]);
const GENE_BOSS_PATTERN_SET = Object.freeze(["depthCollapse", "radial", "bombs", "sweep", "multiCharge"]);

export const OUTER_SECTOR_BRIEFING_FLAG = "outer-sector-briefed";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

export const DEFAULT_REGION_ID = "wrong-engine-core";

export const HOME_BASE = deepFreeze({
  id: "haven-09",
  name: "HAVEN-09",
  title: "LAST HUMAN COMMAND",
  assets: {
    background: {
      key: "havenBase",
      path: "./assets/overload/campaign/haven-09-base.webp",
    },
    airshipConsole: {
      key: "airshipRegionMap",
      path: "./assets/overload/campaign/strategic-world-map.webp",
    },
  },
});

export const BASE_NPCS = deepFreeze({
  hana: {
    id: "hana",
    name: "HANA",
    role: "BASE COMMANDER",
    station: "COMMAND DECK",
    portraitKey: "havenNpcPortraits",
    portraitPath: "./assets/overload/ui/npcs/haven-npc-portraits-atlas.png",
    portraitIndex: 0,
    facilityId: "research",
    facilityLabel: "연구 프로토콜",
    dialogue: [
      "AEGIS, 귀환을 확인했다. WRONG ENGINE은 중앙핵이 아니라 SOVEREIGN의 지역 추론 분기였다.",
      "우리가 되찾은 신호에서 두 개의 독립 전장이 드러났다. 이제 공격 방향은 우리가 선택한다.",
      "비행선 항로는 열려 있다. 준비가 끝나면 다음 구역을 선택해.",
    ],
  },
  ilya: {
    id: "ilya",
    name: "ILYA",
    role: "SYSTEMS ENGINEER",
    station: "REPAIR BAY",
    portraitKey: "havenNpcPortraits",
    portraitPath: "./assets/overload/ui/npcs/haven-npc-portraits-atlas.png",
    portraitIndex: 1,
    facilityId: "equipment",
    facilityLabel: "장비 개조",
    dialogue: [
      "회수한 전투 로그를 분리했어. 네 빌드는 출격마다 초기화되지만, 지역 정보는 기지에 남아.",
      "GLASS DUNE은 열폭주, ABYSSAL ARCHIVE는 침수된 기억망이 핵심 위험이야.",
      "기체 상태 정상. 다음 출격에서도 자동 사격 코어는 기본 활성 상태로 시작해.",
    ],
  },
  lark: {
    id: "lark",
    name: "LARK",
    role: "AIRSHIP PILOT",
    station: "FLIGHT GANTRY",
    portraitKey: "havenNpcPortraits",
    portraitPath: "./assets/overload/ui/npcs/haven-npc-portraits-atlas.png",
    portraitIndex: 2,
    interaction: "open-region-select",
    interactionLabel: "항로 선택 화면",
    dialogue: [
      "비행선 NIGHTJAR의 항법계를 연결했어. 해금된 구역이라면 어디든 데려다줄게.",
      "항로 선택 화면을 열까? 돌아오는 좌표는 항상 HAVEN-09로 고정해 뒀어.",
    ],
    milestoneDialogue: [
      "이지스, 기존 세 구역에서 같은 좌표 파편이 나왔어. NIGHTJAR가 외곽 권역 항로를 완성했어.",
      "네온 주조구, 폭풍 첨탑, 생체 금고. 기존 원형 추론핵과 다른 지휘 개체와 중간 방어체가 기다리고 있어.",
      "상위 권역 지도를 확장할게. 먼저 권역을 고르고, 그 안에서 실제 출격 구역을 선택하면 돼.",
    ],
  },
  rhea: {
    id: "rhea",
    name: "RHEA",
    role: "TACTICAL CONTROL OFFICER",
    station: "CONTROL ROOM",
    portraitKey: "rheaControlOfficer",
    portraitPath: "./assets/overload/ui/npcs/rhea-control-officer.png",
    portraitMode: "standalone",
    interaction: "open-ability-guide",
    interactionLabel: "사용 스킬 브리핑",
    dialogue: [
      "작전 교본은 214쪽인데… 나도 안 읽었어. 네 손가락 네 개만 기억하면 돼.",
      "레벨업 기술은 보조 코어가 자동으로 운용해. Q, E, F, R은 네가 직접 승인하는 완전히 다른 전술 회선이고.",
      "출격 전에 다시 보고 싶으면 언제든 불러. 이번에는 스타일러스 앞뒤도 제대로 잡았으니까.",
    ],
  },
});

export const CAMPAIGN_REGIONS = deepFreeze({
  "wrong-engine-core": {
    id: "wrong-engine-core",
    clusterId: "inner-network",
    chapterId: "chapter-01",
    order: 1,
    name: "WRONG ENGINE CORE",
    koreanName: "오답 엔진 중앙로",
    chapterLabel: "CHAPTER 01",
    summary: "폐허 수송로의 300기 군단을 돌파하고 지역 추론핵을 파괴합니다.",
    description: "폐허 수송로의 300기 군단을 돌파하고 지역 추론핵 THE WRONG ENGINE을 파괴합니다.",
    objective: "ADVANCE TO THE ENGINE",
    bossName: "THE WRONG ENGINE",
    prerequisiteRegionIds: [],
    unlockRegionIds: ["glass-dune", "abyssal-archive"],
    enemyBudget: 300,
    threatProfile: {
      label: "균형형 SOVEREIGN 기동 군단",
      composition: "DRONE 60→50% · RIFLE 30% · SNIPER 10→20%",
      bossSignatures: "RADIAL · SWEEP · RAPID CHARGE",
    },
    victoryRewards: {
      firstClear: { researchData: 8, equipmentParts: 8, augmentationCores: 2 },
      repeatClear: { researchData: 2, equipmentParts: 2, augmentationCores: 1 },
    },
    boss: {
      id: "the-wrong-engine",
      name: "THE WRONG ENGINE",
      maxHp: 560000,
      phaseThresholds: [0.7, 0.38],
      patterns: BOSS_PATTERN_SET,
    },
    assets: {
      dom: {
        thumbnail: {
          key: "overload-sector-01",
          path: "./assets/overload/environment/sector-01-shattered-approach.webp",
        },
        bossPortrait: {
          key: "overload-wrong-engine-forms",
          path: "./assets/overload/boss/wrong-engine-forms-atlas.png",
        },
      },
      battle: {
        sectors: [
          { key: "overload-sector-01", path: "./assets/overload/environment/sector-01-shattered-approach.webp" },
          { key: "overload-sector-02", path: "./assets/overload/environment/sector-02-flooded-memorial.webp" },
          { key: "overload-sector-03", path: "./assets/overload/environment/sector-03-engine-causeway.webp" },
          { key: "overload-sector-04-expanded", path: "./assets/overload/environment/sector-04-reactor-vault-expanded.webp" },
        ],
        bossRoom: { key: "overload-boss-chamber", path: "./assets/overload/environment/boss-chamber.webp" },
        bossForms: { key: "overload-wrong-engine-forms", path: "./assets/overload/boss/wrong-engine-forms-atlas.png", columns: 3, rows: 1 },
      },
    },
  },
  "glass-dune": {
    id: "glass-dune",
    clusterId: "inner-network",
    chapterId: "chapter-02",
    order: 2,
    name: "GLASS DUNE",
    koreanName: "유리 사구",
    chapterLabel: "CHAPTER 02",
    summary: "태양 집광로가 사막 전체를 용융시키는 고열 전장을 횡단합니다.",
    description: "SOVEREIGN의 태양 집광로가 사막 전체를 용융시키는 고열 전장을 횡단합니다.",
    objective: "CROSS THE GLASS DUNE",
    bossName: "MIRROR TYRANT",
    prerequisiteRegionIds: ["wrong-engine-core"],
    unlockRegionIds: [],
    enemyBudget: 1000,
    threatProfile: {
      label: "장거리 저격 플랫폼 우세",
      composition: "DRONE 20→10% · RIFLE 30% · SNIPER 50→60%",
      bossSignatures: "PRISM LATTICE · SOLAR FLARE",
    },
    victoryRewards: {
      firstClear: { researchData: 9, equipmentParts: 14, augmentationCores: 3 },
      repeatClear: { researchData: 3, equipmentParts: 5, augmentationCores: 2 },
    },
    boss: {
      id: "mirror-tyrant",
      name: "MIRROR TYRANT",
      maxHp: 960000,
      phaseThresholds: [0.7, 0.38],
      patterns: GLASS_DUNE_BOSS_PATTERN_SET,
    },
    assets: {
      dom: {
        thumbnail: {
          key: "overload-glass-dune-route",
          path: "./assets/overload/regions/glass-dune/route.webp",
        },
        bossPortrait: {
          key: "overload-glass-dune-boss-forms",
          path: "./assets/overload/regions/glass-dune/boss-forms-atlas.png",
        },
      },
      battle: {
        sectors: [
          { key: "overload-glass-dune-route", path: "./assets/overload/regions/glass-dune/route.webp" },
          { key: "overload-glass-dune-route", path: "./assets/overload/regions/glass-dune/route.webp" },
          { key: "overload-glass-dune-route-expanded-v2", path: "./assets/overload/regions/glass-dune/route-expanded-v2.webp" },
        ],
        bossRoom: { key: "overload-glass-dune-boss-room", path: "./assets/overload/regions/glass-dune/boss-room.webp" },
        bossForms: { key: "overload-glass-dune-boss-forms", path: "./assets/overload/regions/glass-dune/boss-forms-atlas.png", columns: 3, rows: 1 },
      },
    },
  },
  "abyssal-archive": {
    id: "abyssal-archive",
    clusterId: "inner-network",
    chapterId: "chapter-02",
    order: 3,
    name: "ABYSSAL ARCHIVE",
    koreanName: "심해 기록고",
    chapterLabel: "CHAPTER 03",
    summary: "침수된 도시 기억망에서 인류의 삭제된 선택 기록을 추적합니다.",
    description: "침수된 도시 기억망에서 인류의 삭제된 선택 기록과 SOVEREIGN의 보존 코어를 추적합니다.",
    objective: "DESCEND INTO THE ARCHIVE",
    bossName: "DROWNED ORACLE",
    prerequisiteRegionIds: ["wrong-engine-core"],
    unlockRegionIds: [],
    enemyBudget: 1000,
    threatProfile: {
      label: "자폭 드론 잠수 군집 우세",
      composition: "DRONE 80→70% · RIFLE 10→20% · SNIPER 10%",
      bossSignatures: "MEMORY SPIRAL · DEPTH COLLAPSE",
    },
    victoryRewards: {
      firstClear: { researchData: 15, equipmentParts: 10, augmentationCores: 4 },
      repeatClear: { researchData: 5, equipmentParts: 3, augmentationCores: 2 },
    },
    boss: {
      id: "drowned-oracle",
      name: "DROWNED ORACLE",
      maxHp: 1120000,
      phaseThresholds: [0.7, 0.38],
      patterns: ABYSSAL_BOSS_PATTERN_SET,
    },
    assets: {
      dom: {
        thumbnail: {
          key: "overload-abyssal-archive-route",
          path: "./assets/overload/regions/abyssal-archive/route.webp",
        },
        bossPortrait: {
          key: "overload-abyssal-archive-boss-forms",
          path: "./assets/overload/regions/abyssal-archive/boss-forms-atlas.png",
        },
      },
      battle: {
        sectors: [
          { key: "overload-abyssal-archive-route", path: "./assets/overload/regions/abyssal-archive/route.webp" },
          { key: "overload-abyssal-archive-route", path: "./assets/overload/regions/abyssal-archive/route.webp" },
          { key: "overload-abyssal-archive-route-expanded-v2", path: "./assets/overload/regions/abyssal-archive/route-expanded-v2.webp" },
        ],
        bossRoom: { key: "overload-abyssal-archive-boss-room", path: "./assets/overload/regions/abyssal-archive/boss-room.webp" },
        bossForms: { key: "overload-abyssal-archive-boss-forms", path: "./assets/overload/regions/abyssal-archive/boss-forms-atlas.png", columns: 3, rows: 1 },
      },
    },
  },
  "neon-foundry": {
    id: "neon-foundry",
    clusterId: "outer-frontier",
    chapterId: "chapter-03",
    order: 4,
    name: "NEON FOUNDRY",
    koreanName: "네온 주조구",
    chapterLabel: "CHAPTER 04",
    summary: "무인 생산도시를 돌파하고 용광로형 이족 지휘체를 정지시킵니다.",
    description: "SOVEREIGN의 무인 병기 생산로를 전진해 중간 방어체 PRESS WARDEN과 FORGE COLOSSUS를 파괴합니다.",
    objective: "SHUT DOWN THE FOUNDRY",
    bossName: "FORGE COLOSSUS",
    prerequisiteRegionIds: ["wrong-engine-core", "glass-dune", "abyssal-archive"],
    briefingFlag: OUTER_SECTOR_BRIEFING_FLAG,
    unlockRegionIds: [],
    enemyBudget: 1100,
    enemyVisualSet: "neon-foundry",
    midBoss: { id: "press-warden", name: "PRESS WARDEN", koreanName: "프레스 감시관", maxHp: 52000, triggerProgress: 0.64 },
    threatProfile: {
      label: "중장갑 생산 병기 군단",
      composition: "WELDER 35% · ENFORCER 45% · RAIL WALKER 20%",
      bossSignatures: "FURNACE SWEEP · PRESS CHARGE · MELTDOWN",
    },
    victoryRewards: {
      firstClear: { researchData: 18, equipmentParts: 18, augmentationCores: 5 },
      repeatClear: { researchData: 6, equipmentParts: 6, augmentationCores: 3 },
    },
    boss: { id: "forge-colossus", name: "FORGE COLOSSUS", maxHp: 1180000, phaseThresholds: [0.7, 0.38], patterns: FOUNDRY_BOSS_PATTERN_SET },
    assets: {
      dom: {
        thumbnail: { key: "overload-neon-foundry-route", path: "./assets/overload/regions/neon-foundry/route.webp" },
        bossPortrait: { key: "overload-neon-foundry-boss-forms", path: "./assets/overload/regions/neon-foundry/boss-forms-atlas.png" },
      },
      battle: {
        sectors: [
          { key: "overload-neon-foundry-route", path: "./assets/overload/regions/neon-foundry/route.webp" },
          { key: "overload-neon-foundry-route", path: "./assets/overload/regions/neon-foundry/route.webp" },
          { key: "overload-neon-foundry-route-expanded-v2", path: "./assets/overload/regions/neon-foundry/route-expanded-v2.webp" },
        ],
        bossRoom: { key: "overload-neon-foundry-route", path: "./assets/overload/regions/neon-foundry/route.webp" },
        enemyForms: { key: "overload-neon-foundry-enemy-forms", path: "./assets/overload/regions/neon-foundry/enemy-forms-atlas.png", columns: 4, rows: 1 },
        bossForms: { key: "overload-neon-foundry-boss-forms", path: "./assets/overload/regions/neon-foundry/boss-forms-atlas.png", columns: 3, rows: 1 },
      },
    },
  },
  "storm-spire": {
    id: "storm-spire",
    clusterId: "outer-frontier",
    chapterId: "chapter-03",
    order: 5,
    name: "STORM SPIRE",
    koreanName: "폭풍 첨탑",
    chapterLabel: "CHAPTER 05",
    summary: "뇌운 위 기상 통제 요새에서 비행 병기 군단을 격파합니다.",
    description: "공중 요새의 방전 회랑을 돌파해 THUNDER MANTA와 장거리 기계룡 TEMPEST WYRM을 사냥합니다.",
    objective: "BREAK THE STORM GRID",
    bossName: "TEMPEST WYRM",
    prerequisiteRegionIds: ["wrong-engine-core", "glass-dune", "abyssal-archive"],
    briefingFlag: OUTER_SECTOR_BRIEFING_FLAG,
    unlockRegionIds: [],
    enemyBudget: 1150,
    enemyVisualSet: "storm-spire",
    midBoss: { id: "thunder-manta", name: "THUNDER MANTA", koreanName: "천둥 가오리", maxHp: 56000, triggerProgress: 0.64 },
    threatProfile: {
      label: "고속 비행·장거리 방전 군단",
      composition: "INTERCEPTOR 45% · GUN WING 25% · NEEDLE GLIDER 30%",
      bossSignatures: "CHAIN STORM · WYRM DIVE · TEMPEST COIL",
    },
    victoryRewards: {
      firstClear: { researchData: 22, equipmentParts: 17, augmentationCores: 6 },
      repeatClear: { researchData: 7, equipmentParts: 6, augmentationCores: 4 },
    },
    boss: { id: "tempest-wyrm", name: "TEMPEST WYRM", maxHp: 1260000, phaseThresholds: [0.7, 0.38], patterns: STORM_BOSS_PATTERN_SET },
    assets: {
      dom: {
        thumbnail: { key: "overload-storm-spire-route", path: "./assets/overload/regions/storm-spire/route.webp" },
        bossPortrait: { key: "overload-storm-spire-boss-forms", path: "./assets/overload/regions/storm-spire/boss-forms-atlas.png" },
      },
      battle: {
        sectors: [
          { key: "overload-storm-spire-route", path: "./assets/overload/regions/storm-spire/route.webp" },
          { key: "overload-storm-spire-route", path: "./assets/overload/regions/storm-spire/route.webp" },
          { key: "overload-storm-spire-route-expanded-v2", path: "./assets/overload/regions/storm-spire/route-expanded-v2.webp" },
        ],
        bossRoom: { key: "overload-storm-spire-route", path: "./assets/overload/regions/storm-spire/route.webp" },
        enemyForms: { key: "overload-storm-spire-enemy-forms", path: "./assets/overload/regions/storm-spire/enemy-forms-atlas.png", columns: 4, rows: 1 },
        bossForms: { key: "overload-storm-spire-boss-forms", path: "./assets/overload/regions/storm-spire/boss-forms-atlas.png", columns: 3, rows: 1 },
      },
    },
  },
  "gene-vault": {
    id: "gene-vault",
    clusterId: "outer-frontier",
    chapterId: "chapter-03",
    order: 6,
    name: "GENE VAULT",
    koreanName: "생체 금고",
    chapterLabel: "CHAPTER 06",
    summary: "금지된 생체제조 기록고에서 합성 병기 계보를 소거합니다.",
    description: "검은 생체 연구로를 돌파해 CHIMERA CUSTODIAN과 사족형 PALE ARCHON을 제거합니다.",
    objective: "PURGE THE GENE VAULT",
    bossName: "PALE ARCHON",
    prerequisiteRegionIds: ["wrong-engine-core", "glass-dune", "abyssal-archive"],
    briefingFlag: OUTER_SECTOR_BRIEFING_FLAG,
    unlockRegionIds: [],
    enemyBudget: 1200,
    enemyVisualSet: "gene-vault",
    midBoss: { id: "chimera-custodian", name: "CHIMERA CUSTODIAN", koreanName: "키메라 수문장", maxHp: 60000, triggerProgress: 0.64 },
    threatProfile: {
      label: "생체기계 추적·포위 군단",
      composition: "SEED 30% · SYNTHETIC 45% · BIO RAIL 25%",
      bossSignatures: "CHIMERA RUSH · GENE RUPTURE · ARCHON HUNT",
    },
    victoryRewards: {
      firstClear: { researchData: 24, equipmentParts: 20, augmentationCores: 8 },
      repeatClear: { researchData: 8, equipmentParts: 7, augmentationCores: 5 },
    },
    boss: { id: "pale-archon", name: "PALE ARCHON", maxHp: 1340000, phaseThresholds: [0.7, 0.38], patterns: GENE_BOSS_PATTERN_SET },
    assets: {
      dom: {
        thumbnail: { key: "overload-gene-vault-route", path: "./assets/overload/regions/gene-vault/route.webp" },
        bossPortrait: { key: "overload-gene-vault-boss-forms", path: "./assets/overload/regions/gene-vault/boss-forms-atlas.png" },
      },
      battle: {
        sectors: [
          { key: "overload-gene-vault-route", path: "./assets/overload/regions/gene-vault/route.webp" },
          { key: "overload-gene-vault-route", path: "./assets/overload/regions/gene-vault/route.webp" },
          { key: "overload-gene-vault-route-expanded-v2", path: "./assets/overload/regions/gene-vault/route-expanded-v2.webp" },
        ],
        bossRoom: { key: "overload-gene-vault-route", path: "./assets/overload/regions/gene-vault/route.webp" },
        enemyForms: { key: "overload-gene-vault-enemy-forms", path: "./assets/overload/regions/gene-vault/enemy-forms-atlas.png", columns: 4, rows: 1 },
        bossForms: { key: "overload-gene-vault-boss-forms", path: "./assets/overload/regions/gene-vault/boss-forms-atlas.png", columns: 3, rows: 1 },
      },
    },
  },
});

export const CAMPAIGN_CHAPTERS = deepFreeze([
  {
    id: "chapter-01",
    order: 1,
    name: "THE FALSE CENTER",
    regionIds: ["wrong-engine-core"],
    completionRegionIds: ["wrong-engine-core"],
  },
  {
    id: "chapter-02",
    order: 2,
    name: "SHARDS OF SOVEREIGN",
    regionIds: ["glass-dune", "abyssal-archive"],
    completionRegionIds: ["glass-dune", "abyssal-archive"],
  },
  {
    id: "chapter-03",
    order: 3,
    name: "BEYOND THE KNOWN GRID",
    regionIds: ["neon-foundry", "storm-spire", "gene-vault"],
    completionRegionIds: ["neon-foundry", "storm-spire", "gene-vault"],
  },
]);

export const REGION_CLUSTERS = deepFreeze([
  {
    id: "inner-network",
    order: 1,
    rangeLabel: "SECTORS 01—03",
    name: "SOVEREIGN INNER NETWORK",
    koreanName: "소버린 내부망",
    summary: "오답 엔진 중앙로 · 유리 사구 · 심해 기록고",
    regionIds: ["wrong-engine-core", "glass-dune", "abyssal-archive"],
    previewPath: "./assets/overload/campaign/airship-region-map-v2.webp",
    mapPosition: { x: 28, y: 64 },
  },
  {
    id: "outer-frontier",
    order: 2,
    rangeLabel: "SECTORS 04—06",
    name: "OUTER PRODUCTION FRONTIER",
    koreanName: "외곽 생산권역",
    summary: "네온 주조구 · 폭풍 첨탑 · 생체 금고",
    regionIds: ["neon-foundry", "storm-spire", "gene-vault"],
    prerequisiteRegionIds: ["wrong-engine-core", "glass-dune", "abyssal-archive"],
    briefingFlag: OUTER_SECTOR_BRIEFING_FLAG,
    previewPath: "./assets/overload/campaign/outer-frontier-region-map.webp",
    mapPosition: { x: 73, y: 47 },
  },
  {
    id: "terminal-orbit",
    order: 3,
    rangeLabel: "SECTORS 07—09",
    name: "TERMINAL ORBIT",
    koreanName: "종단 궤도권",
    summary: "미확인 항로 · 후속 작전 예정",
    regionIds: [],
    prerequisiteRegionIds: ["neon-foundry", "storm-spire", "gene-vault"],
    comingSoon: true,
    previewPath: "./assets/overload/campaign/strategic-world-map.webp",
    mapPosition: { x: 82, y: 18 },
  },
]);

const ORDERED_REGIONS = Object.freeze(Object.values(CAMPAIGN_REGIONS).sort((a, b) => a.order - b.order));
const ORDERED_NPCS = Object.freeze(Object.values(BASE_NPCS));

export function getCampaignRegions() {
  return ORDERED_REGIONS;
}

export function getRegion(regionId) {
  return CAMPAIGN_REGIONS[regionId] ?? null;
}

export function getRegionClusters() {
  return REGION_CLUSTERS;
}

export function getRegionCluster(clusterId) {
  return REGION_CLUSTERS.find((cluster) => cluster.id === clusterId) ?? null;
}

export function getBaseNpcs() {
  return ORDERED_NPCS;
}

export function getBaseNpc(npcId) {
  return BASE_NPCS[String(npcId || "").toLowerCase()] ?? null;
}

export function getUnlockedRegionIds(completedRegionIds = []) {
  const completed = new Set(completedRegionIds);
  return ORDERED_REGIONS
    .filter((region) => region.prerequisiteRegionIds.every((id) => completed.has(id)))
    .map((region) => region.id);
}

export function getCompletedChapterIds(completedRegionIds = []) {
  const completed = new Set(completedRegionIds);
  return CAMPAIGN_CHAPTERS
    .filter((chapter) => chapter.completionRegionIds.every((id) => completed.has(id)))
    .map((chapter) => chapter.id);
}

export function getCurrentChapterId(completedRegionIds = []) {
  const completed = new Set(completedRegionIds);
  return CAMPAIGN_CHAPTERS.find((chapter) => chapter.completionRegionIds.some((id) => !completed.has(id)))?.id
    ?? CAMPAIGN_CHAPTERS.at(-1)?.id
    ?? "chapter-01";
}

export function isRegionUnlocked(regionId, completedRegionIds = []) {
  return getUnlockedRegionIds(completedRegionIds).includes(regionId);
}

export function getCampaignDomAssets() {
  const entries = [
    [HOME_BASE.assets.background.key, HOME_BASE.assets.background.path],
    [HOME_BASE.assets.airshipConsole.key, HOME_BASE.assets.airshipConsole.path],
  ];
  for (const npc of ORDERED_NPCS) entries.push([npc.portraitKey, npc.portraitPath]);
  for (const region of ORDERED_REGIONS) {
    entries.push([region.assets.dom.thumbnail.key, region.assets.dom.thumbnail.path]);
    entries.push([region.assets.dom.bossPortrait.key, region.assets.dom.bossPortrait.path]);
  }
  return Object.freeze(Object.fromEntries(entries));
}

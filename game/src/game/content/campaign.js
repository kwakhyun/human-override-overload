const BOSS_PATTERN_SET = Object.freeze(["radial", "sweep", "bombs", "rings", "charge", "multiCharge"]);
const GLASS_DUNE_BOSS_PATTERN_SET = Object.freeze(["radial", "prismLattice", "sweep", "solarFlare", "bombs", "rings", "charge", "multiCharge"]);
const ABYSSAL_BOSS_PATTERN_SET = Object.freeze(["radial", "memorySpiral", "sweep", "depthCollapse", "bombs", "rings", "charge", "multiCharge"]);

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
      path: "./assets/overload/campaign/airship-region-map-v2.webp",
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
      firstClear: { researchData: 8, equipmentParts: 8 },
      repeatClear: { researchData: 2, equipmentParts: 2 },
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
        ],
        bossRoom: { key: "overload-boss-chamber", path: "./assets/overload/environment/boss-chamber.webp" },
        bossForms: { key: "overload-wrong-engine-forms", path: "./assets/overload/boss/wrong-engine-forms-atlas.png", columns: 3, rows: 1 },
      },
    },
  },
  "glass-dune": {
    id: "glass-dune",
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
      firstClear: { researchData: 9, equipmentParts: 14 },
      repeatClear: { researchData: 3, equipmentParts: 5 },
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
          { key: "overload-glass-dune-route", path: "./assets/overload/regions/glass-dune/route.webp" },
        ],
        bossRoom: { key: "overload-glass-dune-boss-room", path: "./assets/overload/regions/glass-dune/boss-room.webp" },
        bossForms: { key: "overload-glass-dune-boss-forms", path: "./assets/overload/regions/glass-dune/boss-forms-atlas.png", columns: 3, rows: 1 },
      },
    },
  },
  "abyssal-archive": {
    id: "abyssal-archive",
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
      firstClear: { researchData: 15, equipmentParts: 10 },
      repeatClear: { researchData: 5, equipmentParts: 3 },
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
          { key: "overload-abyssal-archive-route", path: "./assets/overload/regions/abyssal-archive/route.webp" },
        ],
        bossRoom: { key: "overload-abyssal-archive-boss-room", path: "./assets/overload/regions/abyssal-archive/boss-room.webp" },
        bossForms: { key: "overload-abyssal-archive-boss-forms", path: "./assets/overload/regions/abyssal-archive/boss-forms-atlas.png", columns: 3, rows: 1 },
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
]);

const ORDERED_REGIONS = Object.freeze(Object.values(CAMPAIGN_REGIONS).sort((a, b) => a.order - b.order));
const ORDERED_NPCS = Object.freeze(Object.values(BASE_NPCS));

export function getCampaignRegions() {
  return ORDERED_REGIONS;
}

export function getRegion(regionId) {
  return CAMPAIGN_REGIONS[regionId] ?? null;
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

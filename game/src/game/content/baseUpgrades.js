function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

export const BASE_CURRENCIES = deepFreeze({
  researchData: {
    id: "researchData",
    name: "RESEARCH DATA",
    koreanName: "연구 자료",
    ownerId: "hana",
  },
  equipmentParts: {
    id: "equipmentParts",
    name: "EQUIPMENT PARTS",
    koreanName: "장비 부품",
    ownerId: "ilya",
  },
});

const HANA_RESEARCH_LINES = {
  "hana-combat-forecast": {
    id: "hana-combat-forecast",
    ownerId: "hana",
    category: "research",
    currencyId: "researchData",
    name: "COMBAT FORECAST",
    koreanName: "전투 예측 모델",
    description: "SOVEREIGN의 대응 패턴을 선행 분석해 모든 공격 피해를 높입니다.",
    ranks: [
      { rank: 1, cost: 3, requiresCompletedRegions: 1, bonuses: { damageMultiplier: 0.04 } },
      { rank: 2, cost: 6, requiresCompletedRegions: 2, bonuses: { damageMultiplier: 0.04 } },
      { rank: 3, cost: 10, requiresCompletedRegions: 3, bonuses: { damageMultiplier: 0.05 } },
    ],
  },
  "hana-adaptive-learning": {
    id: "hana-adaptive-learning",
    ownerId: "hana",
    category: "research",
    currencyId: "researchData",
    name: "ADAPTIVE LEARNING",
    koreanName: "적응 학습 회로",
    description: "전투 데이터를 더 빠르게 해석해 출격 중 경험치 획득량을 높입니다.",
    ranks: [
      { rank: 1, cost: 2, requiresCompletedRegions: 1, bonuses: { xpGainMultiplier: 0.08 } },
      { rank: 2, cost: 5, requiresCompletedRegions: 2, bonuses: { xpGainMultiplier: 0.08 } },
      { rank: 3, cost: 9, requiresCompletedRegions: 3, bonuses: { xpGainMultiplier: 0.09 } },
    ],
  },
  "hana-threat-cartography": {
    id: "hana-threat-cartography",
    ownerId: "hana",
    category: "research",
    currencyId: "researchData",
    name: "THREAT CARTOGRAPHY",
    koreanName: "위협 지도화",
    description: "실시간 안전 경로를 계산해 AEGIS의 기본 이동 속도를 높입니다.",
    ranks: [
      { rank: 1, cost: 2, requiresCompletedRegions: 1, bonuses: { moveSpeedMultiplier: 0.04 } },
      { rank: 2, cost: 4, requiresCompletedRegions: 2, bonuses: { moveSpeedMultiplier: 0.04 } },
      { rank: 3, cost: 8, requiresCompletedRegions: 3, bonuses: { moveSpeedMultiplier: 0.05 } },
    ],
  },
};

const ILYA_EQUIPMENT_LINES = {
  "ilya-accelerator-coil": {
    id: "ilya-accelerator-coil",
    ownerId: "ilya",
    category: "equipment",
    currencyId: "equipmentParts",
    name: "ACCELERATOR COIL",
    koreanName: "가속 코일",
    description: "소총 구동계를 교체해 기본 무기와 획득 무기의 발사 속도를 높입니다.",
    ranks: [
      { rank: 1, cost: 3, requiresCompletedRegions: 1, bonuses: { fireRateMultiplier: 0.05 } },
      { rank: 2, cost: 7, requiresCompletedRegions: 2, bonuses: { fireRateMultiplier: 0.06 } },
      { rank: 3, cost: 12, requiresCompletedRegions: 3, bonuses: { fireRateMultiplier: 0.07 } },
    ],
  },
  "ilya-reactive-plating": {
    id: "ilya-reactive-plating",
    ownerId: "ilya",
    category: "equipment",
    currencyId: "equipmentParts",
    name: "REACTIVE PLATING",
    koreanName: "반응 장갑",
    description: "충격 분산 장갑판을 증설해 출격 시 최대 내구도를 영구적으로 높입니다.",
    ranks: [
      { rank: 1, cost: 3, requiresCompletedRegions: 1, bonuses: { maxHpFlat: 35 } },
      { rank: 2, cost: 6, requiresCompletedRegions: 2, bonuses: { maxHpFlat: 45 } },
      { rank: 3, cost: 11, requiresCompletedRegions: 3, bonuses: { maxHpFlat: 60 } },
    ],
  },
  "ilya-nanite-injector": {
    id: "ilya-nanite-injector",
    ownerId: "ilya",
    category: "equipment",
    currencyId: "equipmentParts",
    name: "NANITE INJECTOR",
    koreanName: "나나이트 주입기",
    description: "회복 키트와 전투 중 복구 프로토콜의 회복 효율을 높입니다.",
    ranks: [
      { rank: 1, cost: 2, requiresCompletedRegions: 1, bonuses: { healingMultiplier: 0.1 } },
      { rank: 2, cost: 5, requiresCompletedRegions: 2, bonuses: { healingMultiplier: 0.12 } },
      { rank: 3, cost: 10, requiresCompletedRegions: 3, bonuses: { healingMultiplier: 0.13 } },
    ],
  },
};

export const HANA_RESEARCH_UPGRADES = deepFreeze(HANA_RESEARCH_LINES);
export const ILYA_EQUIPMENT_UPGRADES = deepFreeze(ILYA_EQUIPMENT_LINES);
export const BASE_UPGRADE_LINES = deepFreeze({
  ...HANA_RESEARCH_LINES,
  ...ILYA_EQUIPMENT_LINES,
});

export const BASE_FACILITIES = deepFreeze({
  research: {
    id: "research",
    npcId: "hana",
    name: "HANA RESEARCH",
    koreanName: "HANA 연구실",
    currencyId: "researchData",
    upgradeIds: Object.keys(HANA_RESEARCH_LINES),
  },
  equipment: {
    id: "equipment",
    npcId: "ilya",
    name: "ILYA EQUIPMENT",
    koreanName: "ILYA 장비고",
    currencyId: "equipmentParts",
    upgradeIds: Object.keys(ILYA_EQUIPMENT_LINES),
  },
});

const ORDERED_UPGRADES = Object.freeze(Object.values(BASE_UPGRADE_LINES));
const ORDERED_FACILITIES = Object.freeze(Object.values(BASE_FACILITIES));

export function getBaseUpgrade(upgradeId) {
  return BASE_UPGRADE_LINES[upgradeId] ?? null;
}

export function getBaseUpgrades(ownerId = null) {
  if (!ownerId) return ORDERED_UPGRADES;
  return Object.freeze(ORDERED_UPGRADES.filter((upgrade) => upgrade.ownerId === ownerId));
}

export function getBaseFacility(facilityId) {
  return BASE_FACILITIES[facilityId] ?? null;
}

export function getBaseFacilities() {
  return ORDERED_FACILITIES;
}

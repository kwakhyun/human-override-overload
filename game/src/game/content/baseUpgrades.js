import { CHARACTER_SKILL_PROGRESSION_LINES } from "./characterSkills.js";

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
  augmentationCores: {
    id: "augmentationCores",
    name: "AUGMENTATION CORES",
    koreanName: "동기화 코어",
    ownerId: "aegis",
  },
});

export const BASE_RESOURCE_EXCHANGES = deepFreeze({
  "research-to-parts": {
    id: "research-to-parts",
    ownerId: "hana",
    name: "APPLIED MATERIAL SYNTHESIS",
    koreanName: "응용 재료 합성",
    description: "남는 전투 연구 자료를 장비 제작에 쓸 수 있는 규격 부품으로 전환합니다.",
    requiresCompletedRegions: 2,
    costs: { researchData: 6 },
    rewards: { equipmentParts: 3 },
  },
  "field-core-fabrication": {
    id: "field-core-fabrication",
    ownerId: "hana",
    name: "FIELD CORE FABRICATION",
    koreanName: "현장 코어 제작",
    description: "연구 자료와 장비 부품을 소모해 고난도 동기화에 필요한 코어를 제작합니다.",
    requiresCompletedRegions: 4,
    costs: { researchData: 12, equipmentParts: 8 },
    rewards: { augmentationCores: 1 },
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
    description: "SOVEREIGN의 대응 패턴을 미리 분석해 모든 공격의 피해를 높입니다.",
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
    description: "전투 데이터를 빠르게 분석해 출격 중 얻는 경험치를 늘립니다.",
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
    description: "안전한 경로를 실시간으로 계산해 AEGIS의 이동 속도를 높입니다.",
    ranks: [
      { rank: 1, cost: 2, requiresCompletedRegions: 1, bonuses: { moveSpeedMultiplier: 0.04 } },
      { rank: 2, cost: 4, requiresCompletedRegions: 2, bonuses: { moveSpeedMultiplier: 0.04 } },
      { rank: 3, cost: 8, requiresCompletedRegions: 3, bonuses: { moveSpeedMultiplier: 0.05 } },
    ],
  },
};

const ILYA_EQUIPMENT_LINES = {
  "ilya-rifle-emitter": {
    id: "ilya-rifle-emitter",
    ownerId: "ilya",
    category: "equipment",
    currencyId: "equipmentParts",
    name: "PULSE EMITTER",
    koreanName: "펄스 소총 방출기",
    description: "펄스 소총과 사격 계열 증강의 피해를 영구적으로 높입니다.",
    ranks: [
      { rank: 1, cost: 2, requiresCompletedRegions: 0, bonuses: { rifleDamageMultiplier: 0.08 } },
      { rank: 2, cost: 6, requiresCompletedRegions: 1, bonuses: { rifleDamageMultiplier: 0.1 } },
      { rank: 3, cost: 11, requiresCompletedRegions: 2, bonuses: { rifleDamageMultiplier: 0.12 } },
    ],
  },
  "ilya-sword-resonator": {
    id: "ilya-sword-resonator",
    ownerId: "ilya",
    category: "equipment",
    currencyId: "equipmentParts",
    name: "EDGE RESONATOR",
    koreanName: "빔 소드 공명기",
    description: "빔 소드의 기본 베기와 모든 검술 증강의 피해를 영구적으로 높입니다.",
    ranks: [
      { rank: 1, cost: 2, requiresCompletedRegions: 0, bonuses: { swordDamageMultiplier: 0.1 } },
      { rank: 2, cost: 6, requiresCompletedRegions: 1, bonuses: { swordDamageMultiplier: 0.12 } },
      { rank: 3, cost: 11, requiresCompletedRegions: 2, bonuses: { swordDamageMultiplier: 0.14 } },
    ],
  },
  "ilya-accelerator-coil": {
    id: "ilya-accelerator-coil",
    ownerId: "ilya",
    category: "equipment",
    currencyId: "equipmentParts",
    name: "ACCELERATOR COIL",
    koreanName: "가속 코일",
    description: "소총 구동계를 교체해 기본 사격과 사격 증강의 발사 속도를 높입니다.",
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
    description: "충격 분산 장갑판을 보강해 출격 시 최대 내구도를 영구적으로 늘립니다.",
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
    description: "회복 키트와 전투 중 복구 효과를 강화합니다.",
    ranks: [
      { rank: 1, cost: 2, requiresCompletedRegions: 1, bonuses: { healingMultiplier: 0.1 } },
      { rank: 2, cost: 5, requiresCompletedRegions: 2, bonuses: { healingMultiplier: 0.12 } },
      { rank: 3, cost: 10, requiresCompletedRegions: 3, bonuses: { healingMultiplier: 0.13 } },
    ],
  },
};

const LEGACY_AEGIS_AUGMENTATION_LINES = {
  "aegis-assault-sync": {
    id: "aegis-assault-sync", ownerId: "aegis", category: "augmentation", currencyId: "augmentationCores",
    name: "ASSAULT SYNCHRONIZATION", koreanName: "공격 동기화", description: "전투 신경과 주무기 코어의 반응을 맞춰 모든 공격의 피해를 영구적으로 높입니다.",
    ranks: [
      { rank: 1, cost: 2, requiresCompletedRegions: 1, bonuses: { damageMultiplier: 0.06 } },
      { rank: 2, cost: 5, requiresCompletedRegions: 3, bonuses: { damageMultiplier: 0.08 } },
      { rank: 3, cost: 9, requiresCompletedRegions: 5, bonuses: { damageMultiplier: 0.11 } },
    ],
  },
  "aegis-vital-frame": {
    id: "aegis-vital-frame", ownerId: "aegis", category: "augmentation", currencyId: "augmentationCores",
    name: "VITAL FRAME", koreanName: "생존 프레임", description: "신체 보조 프레임과 충격 분산층을 강화해 최대 내구도를 크게 늘립니다.",
    ranks: [
      { rank: 1, cost: 2, requiresCompletedRegions: 1, bonuses: { maxHpFlat: 55 } },
      { rank: 2, cost: 5, requiresCompletedRegions: 3, bonuses: { maxHpFlat: 75 } },
      { rank: 3, cost: 9, requiresCompletedRegions: 5, bonuses: { maxHpFlat: 110 } },
    ],
  },
  "aegis-reflex-drive": {
    id: "aegis-reflex-drive", ownerId: "aegis", category: "augmentation", currencyId: "augmentationCores",
    name: "REFLEX DRIVE", koreanName: "반응 가속", description: "시각·운동 보조 장치의 반응을 높여 이동과 기본 공격을 모두 빠르게 만듭니다.",
    ranks: [
      { rank: 1, cost: 2, requiresCompletedRegions: 1, bonuses: { moveSpeedMultiplier: 0.04, fireRateMultiplier: 0.04 } },
      { rank: 2, cost: 5, requiresCompletedRegions: 3, bonuses: { moveSpeedMultiplier: 0.05, fireRateMultiplier: 0.05 } },
      { rank: 3, cost: 9, requiresCompletedRegions: 5, bonuses: { moveSpeedMultiplier: 0.06, fireRateMultiplier: 0.07 } },
    ],
  },
};

// Kept above only as a readable record for old-save migration. Runtime
// progression now unlocks character skills instead of duplicating the combat
// stat bonuses already provided by Hana and Ilya.
void LEGACY_AEGIS_AUGMENTATION_LINES;
const AEGIS_AUGMENTATION_LINES = CHARACTER_SKILL_PROGRESSION_LINES;

export const HANA_RESEARCH_UPGRADES = deepFreeze(HANA_RESEARCH_LINES);
export const ILYA_EQUIPMENT_UPGRADES = deepFreeze(ILYA_EQUIPMENT_LINES);
export const AEGIS_AUGMENTATION_UPGRADES = deepFreeze(AEGIS_AUGMENTATION_LINES);
export const BASE_UPGRADE_LINES = deepFreeze({
  ...HANA_RESEARCH_LINES,
  ...ILYA_EQUIPMENT_LINES,
  ...AEGIS_AUGMENTATION_LINES,
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
  augmentation: {
    id: "augmentation",
    npcId: "aegis",
    name: "AEGIS AUGMENTATION",
    koreanName: "인물 동기화",
    currencyId: "augmentationCores",
    upgradeIds: Object.keys(AEGIS_AUGMENTATION_LINES),
  },
});

const ORDERED_UPGRADES = Object.freeze(Object.values(BASE_UPGRADE_LINES));
const ORDERED_FACILITIES = Object.freeze(Object.values(BASE_FACILITIES));
const ORDERED_EXCHANGES = Object.freeze(Object.values(BASE_RESOURCE_EXCHANGES));

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

export function getBaseResourceExchange(exchangeId) {
  return BASE_RESOURCE_EXCHANGES[exchangeId] ?? null;
}

export function getBaseResourceExchanges(ownerId = null) {
  if (!ownerId) return ORDERED_EXCHANGES;
  return Object.freeze(ORDERED_EXCHANGES.filter((exchange) => exchange.ownerId === ownerId));
}

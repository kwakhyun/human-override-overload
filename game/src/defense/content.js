export const DEFAULT_DEFENSE_STAGE_ID = "haven-perimeter";

export const DEFENSE_TOWER_DEFINITIONS = Object.freeze({
  pulseSentry: Object.freeze({
    id: "pulseSentry",
    name: "펄스 센트리",
    role: "고속 단일 화력",
    description: "가장 앞선 적을 빠르게 추적해 펄스 탄을 연사합니다.",
    cost: 70,
    color: "#63efff",
    atlasRow: 0,
  }),
  arcRelay: Object.freeze({
    id: "arcRelay",
    name: "아크 릴레이",
    role: "연쇄 전격",
    description: "밀집한 기계 유닛 사이로 전격을 연쇄 전도합니다.",
    cost: 95,
    color: "#b789ff",
    atlasRow: 1,
  }),
  skyfireBattery: Object.freeze({
    id: "skyfireBattery",
    name: "스카이파이어 포대",
    role: "장거리 범위 포격",
    description: "멀리 있는 적 무리를 미리 조준해 넓은 범위를 포격합니다.",
    cost: 125,
    color: "#ffb45f",
    atlasRow: 2,
  }),
  aegisBastion: Object.freeze({
    id: "aegisBastion",
    name: "이지스 바스티온",
    role: "감속 방어장",
    description: "주기적으로 방어장을 펼쳐 접근하는 적에게 피해를 주고 속도를 늦춥니다.",
    cost: 110,
    color: "#7ff7ff",
    atlasRow: 3,
  }),
});

export const DEFENSE_TOWER_IDS = Object.freeze(Object.keys(DEFENSE_TOWER_DEFINITIONS));

export const DEFENSE_STAGES = Object.freeze([
  Object.freeze({
    id: "haven-perimeter",
    order: 1,
    name: "헤이븐 외곽선",
    subtitle: "HAVEN PERIMETER",
    description: "레아의 관제 아래 세 침투로를 동시에 봉쇄하는 기초 방어 작전입니다.",
    waveCounts: Object.freeze([8, 12, 17, 23, 31, 42]),
    startingCredits: 270,
    baseHp: 24,
    difficulty: 1,
    prerequisite: null,
    rewards: Object.freeze({
      firstClear: Object.freeze({ researchData: 8, equipmentParts: 10, augmentationCores: 1 }),
      repeatClear: Object.freeze({ researchData: 4, equipmentParts: 6, augmentationCores: 0 }),
    }),
  }),
  Object.freeze({
    id: "relay-blackout",
    order: 2,
    name: "중계망 정전",
    subtitle: "RELAY BLACKOUT",
    description: "여러 침투로에서 동시에 밀려오는 장갑 소총수와 저격 플랫폼을 막아냅니다.",
    waveCounts: Object.freeze([10, 15, 22, 30, 40, 52, 66, 82]),
    startingCredits: 245,
    baseHp: 22,
    difficulty: 1.34,
    prerequisite: "haven-perimeter",
    rewards: Object.freeze({
      firstClear: Object.freeze({ researchData: 13, equipmentParts: 16, augmentationCores: 2 }),
      repeatClear: Object.freeze({ researchData: 7, equipmentParts: 9, augmentationCores: 1 }),
    }),
  }),
  Object.freeze({
    id: "sovereign-night-siege",
    order: 3,
    name: "소버린 야간 공성",
    subtitle: "SOVEREIGN NIGHT SIEGE",
    description: "최정예 군단과 거대 공성 워커가 헤이븐의 추론핵을 직접 노립니다.",
    waveCounts: Object.freeze([12, 18, 26, 36, 48, 62, 80, 100, 124, 150]),
    startingCredits: 225,
    baseHp: 20,
    difficulty: 1.72,
    prerequisite: "relay-blackout",
    rewards: Object.freeze({
      firstClear: Object.freeze({ researchData: 20, equipmentParts: 24, augmentationCores: 3 }),
      repeatClear: Object.freeze({ researchData: 10, equipmentParts: 13, augmentationCores: 1 }),
    }),
  }),
]);

export function getDefenseStages() {
  return DEFENSE_STAGES;
}

export function getDefenseStage(stageId) {
  return DEFENSE_STAGES.find((stage) => stage.id === stageId) || null;
}

export function getUnlockedDefenseStageIds(completedStageIds = []) {
  const completed = new Set(Array.isArray(completedStageIds) ? completedStageIds : []);
  return DEFENSE_STAGES
    .filter((stage) => !stage.prerequisite || completed.has(stage.prerequisite))
    .map((stage) => stage.id);
}

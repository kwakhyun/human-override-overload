export const DEFAULT_DEFENSE_STAGE_ID = "haven-perimeter";
export const DEFAULT_DEFENSE_DOCTRINE_ID = "rapidDeployment";

export const DEFENSE_DOCTRINES = Object.freeze({
  rapidDeployment: Object.freeze({
    id: "rapidDeployment",
    name: "선제 배치",
    callSign: "FIRST CONTACT",
    description: "초기 자원과 조기 웨이브 현상금을 확보해 빠르게 전선을 완성합니다.",
    accent: "#c9ff4a",
    startingCredits: 65,
    earlyWaveBonus: 1.35,
  }),
  fireControl: Object.freeze({
    id: "fireControl",
    name: "화력 관제",
    callSign: "KILL CHAIN",
    description: "전 타워의 사거리와 공격력을 끌어올려 정예 표적을 우선 제거합니다.",
    accent: "#63efff",
    rangeMultiplier: 1.09,
    damageMultiplier: 1.08,
  }),
  lastBastion: Object.freeze({
    id: "lastBastion",
    name: "최후 방벽",
    callSign: "HOLD THE LINE",
    description: "방벽 내구도와 지휘 충전 효율을 높여 장기전에 대비합니다.",
    accent: "#ffb45f",
    baseHp: 6,
    commandGainMultiplier: 1.22,
  }),
});

export const DEFENSE_TOWER_DEFINITIONS = Object.freeze({
  pulseSentry: Object.freeze({
    id: "pulseSentry",
    name: "펄스 센트리",
    role: "고속 단일 화력",
    description: "가장 위험한 선두 표적을 빠르게 추적하는 범용 요격 포대입니다.",
    cost: 70,
    color: "#63efff",
    atlasRow: 0,
    branches: Object.freeze({
      armorPiercer: Object.freeze({ id: "armorPiercer", name: "관통자 탄심", detail: "중장갑 대상 피해 +70%", accent: "#ffcf73" }),
      overdrive: Object.freeze({ id: "overdrive", name: "오버드라이브", detail: "공격 속도 +38%", accent: "#63efff" }),
    }),
  }),
  arcRelay: Object.freeze({
    id: "arcRelay",
    name: "아크 릴레이",
    role: "연쇄 제압",
    description: "밀집한 적 사이로 전류를 연쇄 방출해 다수의 진격을 끊습니다.",
    cost: 95,
    color: "#b789ff",
    atlasRow: 1,
    branches: Object.freeze({
      cascade: Object.freeze({ id: "cascade", name: "캐스케이드", detail: "연쇄 대상 +3", accent: "#cda8ff" }),
      ionFracture: Object.freeze({ id: "ionFracture", name: "이온 파쇄", detail: "피격 적 2.4초 취약", accent: "#ff73c8" }),
    }),
  }),
  skyfireBattery: Object.freeze({
    id: "skyfireBattery",
    name: "스카이파이어 포대",
    role: "장거리 범위 폭격",
    description: "후방에서 고폭탄을 투사해 밀집 병력과 중장갑을 동시에 타격합니다.",
    cost: 125,
    color: "#ffb45f",
    atlasRow: 2,
    branches: Object.freeze({
      clusterWarhead: Object.freeze({ id: "clusterWarhead", name: "집속 탄두", detail: "폭발 범위 +55%", accent: "#ffb45f" }),
      incendiary: Object.freeze({ id: "incendiary", name: "소이 탄막", detail: "4초 지속 피해 지대", accent: "#ff6d5a" }),
    }),
  }),
  aegisBastion: Object.freeze({
    id: "aegisBastion",
    name: "이지스 바스티온",
    role: "감속·방벽 지원",
    description: "광역 역장을 방출해 적을 늦추고 방어선을 유지하는 지원 장치입니다.",
    cost: 110,
    color: "#7ff7ff",
    atlasRow: 3,
    branches: Object.freeze({
      stasis: Object.freeze({ id: "stasis", name: "정지장", detail: "감속 효과 강화", accent: "#83a8ff" }),
      guardian: Object.freeze({ id: "guardian", name: "가디언 링크", detail: "웨이브 종료 시 방벽 수리", accent: "#73ffd0" }),
    }),
  }),
});

export const DEFENSE_TOWER_IDS = Object.freeze(Object.keys(DEFENSE_TOWER_DEFINITIONS));

const REWARDS = Object.freeze({
  haven: Object.freeze({ firstClear: Object.freeze({ researchData: 8, equipmentParts: 10, augmentationCores: 1 }), repeatClear: Object.freeze({ researchData: 4, equipmentParts: 6, augmentationCores: 0 }) }),
  relay: Object.freeze({ firstClear: Object.freeze({ researchData: 13, equipmentParts: 16, augmentationCores: 2 }), repeatClear: Object.freeze({ researchData: 7, equipmentParts: 9, augmentationCores: 1 }) }),
  siege: Object.freeze({ firstClear: Object.freeze({ researchData: 20, equipmentParts: 24, augmentationCores: 3 }), repeatClear: Object.freeze({ researchData: 10, equipmentParts: 13, augmentationCores: 1 }) }),
});

export const DEFENSE_STAGES = Object.freeze([
  Object.freeze({
    id: "haven-perimeter", order: 1, name: "헤이븐 외곽선", subtitle: "HAVEN PERIMETER",
    previewPath: "./assets/overload/defense/battlefields-v2/performance/haven-perimeter/battlefield.webp",
    description: "세 침투로가 방벽 코어로 합류합니다. 초반 속공과 마지막 공성 워커를 저지하세요.",
    missionTag: "기초 방어전", threat: "기동 군집", mutator: "조기 호출 현상금 +25%",
    waveCounts: Object.freeze([8, 12, 17, 23, 31, 42]), startingCredits: 270, baseHp: 24, difficulty: 1, prerequisite: null, rewards: REWARDS.haven,
  }),
  Object.freeze({
    id: "relay-blackout", order: 2, name: "중계망 정전", subtitle: "RELAY BLACKOUT",
    previewPath: "./assets/overload/defense/battlefields-v2/performance/relay-blackout/battlefield.webp",
    description: "다중 침투로에서 장갑 소총수와 저격 플랫폼이 교차 진입합니다. 사거리 설계가 핵심입니다.",
    missionTag: "교차 화망", threat: "장갑·저격 혼성", mutator: "정예 유닛 지휘 충전 +40%",
    waveCounts: Object.freeze([10, 15, 22, 30, 40, 52, 66, 82]), startingCredits: 245, baseHp: 22, difficulty: 1.34, prerequisite: "haven-perimeter", rewards: REWARDS.relay,
  }),
  Object.freeze({
    id: "sovereign-night-siege", order: 3, name: "소버린 야간 공성", subtitle: "SOVEREIGN NIGHT SIEGE",
    previewPath: "./assets/overload/defense/battlefields-v2/performance/sovereign-night-siege/battlefield.webp",
    description: "정예 군단과 거대 공성 워커가 연속 압박합니다. 전술 명령을 아껴 결정적 파동을 끊어내세요.",
    missionTag: "최종 공성전", threat: "정예·중장갑", mutator: "공성 워커 2기 동시 진입",
    waveCounts: Object.freeze([12, 18, 26, 36, 48, 62, 80, 100, 124, 150]), startingCredits: 225, baseHp: 20, difficulty: 1.72, prerequisite: "relay-blackout", rewards: REWARDS.siege,
  }),
]);

export function getDefenseStages() { return DEFENSE_STAGES; }
export function getDefenseStage(stageId) { return DEFENSE_STAGES.find((stage) => stage.id === stageId) || null; }
export function getDefenseDoctrine(doctrineId) { return DEFENSE_DOCTRINES[doctrineId] || DEFENSE_DOCTRINES[DEFAULT_DEFENSE_DOCTRINE_ID]; }
export function getUnlockedDefenseStageIds(completedStageIds = []) {
  const completed = new Set(Array.isArray(completedStageIds) ? completedStageIds : []);
  return DEFENSE_STAGES.filter((stage) => !stage.prerequisite || completed.has(stage.prerequisite)).map((stage) => stage.id);
}

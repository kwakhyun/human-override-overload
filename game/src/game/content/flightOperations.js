function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

export const DEFAULT_FLIGHT_PLAN_ID = "night-veil";

export const LARK_FLIGHT_PLANS = deepFreeze({
  "night-veil": {
    id: "night-veil",
    order: 1,
    callSign: "NIGHT VEIL",
    koreanName: "무광 침투 항로",
    category: "STEALTH INSERTION",
    summary: "레이더 음영과 폐쇄 수송로를 연결해 교전권 안쪽까지 빠르게 침투합니다.",
    pilotQuote: "길이 험할수록 추적은 늦어져. 먼저 들어가서 사선을 찢자.",
    unlockClears: 0,
    routeCode: "NV-01",
    accent: "#c7ff4a",
    bonuses: {
      moveSpeedMultiplier: 0.08,
      fireRateMultiplier: 0.04,
    },
    effects: [
      { label: "기동 속도", value: "+8%" },
      { label: "발사 속도", value: "+4%" },
    ],
  },
  "lifeline-corridor": {
    id: "lifeline-corridor",
    order: 2,
    callSign: "LIFELINE",
    koreanName: "구호 보급 회랑",
    category: "FIELD SUSTAINMENT",
    summary: "나이트자 보급 포드를 안전 회랑에 선행 투하해 장기 교전 생존성을 높입니다.",
    pilotQuote: "돌아올 연료와 살아남을 여유까지 계산했어. 이번엔 오래 버틸 수 있어.",
    unlockClears: 1,
    routeCode: "LC-07",
    accent: "#62eaff",
    bonuses: {
      maxHpFlat: 45,
      healingMultiplier: 0.15,
    },
    effects: [
      { label: "최대 내구도", value: "+45" },
      { label: "회복 효율", value: "+15%" },
    ],
  },
  "raptor-escort": {
    id: "raptor-escort",
    order: 3,
    callSign: "RAPTOR ESCORT",
    koreanName: "랩터 호위 편대",
    category: "STRIKE COORDINATION",
    summary: "함재 요격기의 선행 타격과 정찰 데이터를 동기화해 고위협 표적을 압박합니다.",
    pilotQuote: "표적 좌표는 내가 열어 둘게. 네가 방아쇠를 당기면 편대가 빈틈을 넓혀.",
    unlockClears: 3,
    routeCode: "RE-13",
    accent: "#ff6687",
    bonuses: {
      damageMultiplier: 0.07,
      xpGainMultiplier: 0.06,
    },
    effects: [
      { label: "공격 피해", value: "+7%" },
      { label: "전투 경험", value: "+6%" },
    ],
  },
});

const KNOWN_FLIGHT_PLAN_IDS = new Set(Object.keys(LARK_FLIGHT_PLANS));

function finiteInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
}

export function getFlightPlans() {
  return Object.values(LARK_FLIGHT_PLANS).sort((a, b) => a.order - b.order);
}

export function getFlightPlan(planId) {
  return LARK_FLIGHT_PLANS[String(planId || "")] || null;
}

export function isFlightPlanUnlocked(planId, completedRegionIds = []) {
  const plan = getFlightPlan(planId);
  if (!plan) return false;
  return (Array.isArray(completedRegionIds) ? completedRegionIds.length : 0) >= plan.unlockClears;
}

export function sanitizeFlightPlanId(planId, completedRegionIds = []) {
  return isFlightPlanUnlocked(planId, completedRegionIds) ? planId : DEFAULT_FLIGHT_PLAN_ID;
}

export function createFlightOperations() {
  return {
    activePlanId: DEFAULT_FLIGHT_PLAN_ID,
    completedSorties: 0,
    planSorties: Object.fromEntries(getFlightPlans().map((plan) => [plan.id, 0])),
  };
}

export function sanitizeFlightOperations(value, completedRegionIds = []) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const sourcePlanSorties = source.planSorties && typeof source.planSorties === "object" && !Array.isArray(source.planSorties)
    ? source.planSorties
    : {};
  return {
    activePlanId: sanitizeFlightPlanId(source.activePlanId, completedRegionIds),
    completedSorties: finiteInteger(source.completedSorties, 0),
    planSorties: Object.fromEntries(getFlightPlans().map((plan) => [
      plan.id,
      finiteInteger(sourcePlanSorties[plan.id], 0),
    ])),
  };
}

export function recordFlightOperationSortie(value, completedRegionIds = []) {
  const operations = sanitizeFlightOperations(value, completedRegionIds);
  const activePlanId = KNOWN_FLIGHT_PLAN_IDS.has(operations.activePlanId)
    ? operations.activePlanId
    : DEFAULT_FLIGHT_PLAN_ID;
  return {
    ...operations,
    completedSorties: operations.completedSorties + 1,
    planSorties: {
      ...operations.planSorties,
      [activePlanId]: operations.planSorties[activePlanId] + 1,
    },
  };
}

export function applyFlightPlanBonuses(combatBonuses, planId) {
  const plan = getFlightPlan(planId) || getFlightPlan(DEFAULT_FLIGHT_PLAN_ID);
  const merged = { ...(combatBonuses || {}) };
  for (const [field, value] of Object.entries(plan.bonuses)) {
    merged[field] = Math.round(((merged[field] ?? (field === "maxHpFlat" ? 0 : 1)) + value) * 1_000_000) / 1_000_000;
  }
  return Object.freeze(merged);
}

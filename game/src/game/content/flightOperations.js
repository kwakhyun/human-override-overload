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
    callSign: "PATHFINDER",
    koreanName: "선행 정찰 지원",
    category: "FORWARD RECON",
    summary: "세라가 전투 구역을 먼저 정찰해 안전한 진입각과 사격 지점을 표시합니다.",
    pilotQuote: "진입로 확인했어. 내가 먼저 시야를 열 테니, 지휘관은 교전에만 집중해.",
    unlockClears: 0,
    routeCode: "FC-01",
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
    callSign: "SAFEGUARD",
    koreanName: "긴급 보급 지원",
    category: "EMERGENCY SUPPLY",
    summary: "전투 구역에 회복 키트와 예비 장갑을 선행 투하해 장기전 생존력을 높입니다.",
    pilotQuote: "보급 지점까지 확보했어. 무리해도 된다는 뜻은 아니지만, 버틸 여유는 늘었어.",
    unlockClears: 1,
    routeCode: "FC-02",
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
    callSign: "INTERCEPTOR",
    koreanName: "요격기 엄호 지원",
    category: "AIR COVER",
    summary: "나이트자의 요격 편대가 고위협 표적을 선제 압박하고 실시간 표적 정보를 공유합니다.",
    pilotQuote: "요격 편대가 네 사격선에 맞춰 움직일 거야. 표적만 정해, 빈틈은 우리가 만들게.",
    unlockClears: 3,
    routeCode: "FC-03",
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

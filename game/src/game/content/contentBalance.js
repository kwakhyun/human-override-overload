import { DEFENSE_STAGES } from "../../defense/content.js";
import { BASE_RESOURCE_EXCHANGES, BASE_UPGRADE_LINES } from "./baseUpgrades.js";
import { getCampaignRegions } from "./campaign.js";

export const CONTENT_KPI_DEFINITIONS = Object.freeze([
  Object.freeze({ id: "first-reward-time", label: "첫 성장 선택 시간", unit: "seconds", source: "run.telemetry.firstRewardAt", decision: "초반 전투 보상 리듬" }),
  Object.freeze({ id: "route-end-dwell", label: "종점 정체 시간", unit: "seconds", source: "run.telemetry.routeEndDwell", decision: "공간 진행과 웨이브 진행의 결합" }),
  Object.freeze({ id: "clear-time", label: "지역 클리어 시간", unit: "seconds", source: "result.time", decision: "세션 길이와 지역 난이도" }),
  Object.freeze({ id: "boss-ttk", label: "보스 전투 시간", unit: "seconds", source: "run.telemetry.bossDuration", decision: "보스 체력·패턴 반복 횟수" }),
  Object.freeze({ id: "damage-taken", label: "피격 원인별 피해", unit: "damage", source: "result.stats.damageTakenBySource", decision: "불공정 패턴과 난이도 급등 탐지" }),
  Object.freeze({ id: "pattern-mastery", label: "패링·폭탄 성공률", unit: "percent", source: "result.stats.bossMechanics", decision: "학습 가능성과 숙련 보상" }),
  Object.freeze({ id: "build-share", label: "빌드 선택·피해 점유율", unit: "percent", source: "result.buildSnapshot", decision: "지배적 선택과 무효 선택 탐지" }),
  Object.freeze({ id: "currency-balance", label: "재화 획득·소비·잔고", unit: "currency", source: "campaign.progression", decision: "영구 성장 속도와 죽은 재화 탐지" }),
]);

// These are design hypotheses, not claims about validated player behavior. Replace
// them with external-playtest confidence intervals before portfolio submission.
export const CONTENT_BALANCE_TARGETS = Object.freeze({
  validationStatus: "hypothesis",
  minimumExternalPlaytesters: 5,
  firstRewardSeconds: Object.freeze({ min: 6, max: 10 }),
  routeEndDwellSeconds: Object.freeze({ max: 20 }),
  bossTtkSeconds: Object.freeze({ min: 45, max: 120 }),
  clearTimeSecondsByRegion: Object.freeze({
    "wrong-engine-core": Object.freeze({ medianMin: 150, medianMax: 270, p90Max: 360 }),
    "glass-dune": Object.freeze({ medianMin: 240, medianMax: 390, p90Max: 510 }),
    "abyssal-archive": Object.freeze({ medianMin: 270, medianMax: 420, p90Max: 540 }),
    "neon-foundry": Object.freeze({ medianMin: 300, medianMax: 450, p90Max: 570 }),
    "storm-spire": Object.freeze({ medianMin: 315, medianMax: 480, p90Max: 600 }),
    "gene-vault": Object.freeze({ medianMin: 330, medianMax: 510, p90Max: 630 }),
  }),
});

function addCurrency(target, source) {
  for (const currencyId of ["researchData", "equipmentParts", "augmentationCores"]) {
    target[currencyId] += Number(source?.[currencyId] || 0);
  }
  return target;
}

function emptyCurrencyTotals() {
  return { researchData: 0, equipmentParts: 0, augmentationCores: 0 };
}

export function summarizeStaticContentBalance() {
  const regions = getCampaignRegions();
  const campaignFirstClear = emptyCurrencyTotals();
  const campaignRepeatClear = emptyCurrencyTotals();
  for (const region of regions) {
    addCurrency(campaignFirstClear, region.victoryRewards?.firstClear);
    addCurrency(campaignRepeatClear, region.victoryRewards?.repeatClear);
  }

  const defenseFirstClear = emptyCurrencyTotals();
  const defenseRepeatClear = emptyCurrencyTotals();
  for (const stage of DEFENSE_STAGES) {
    addCurrency(defenseFirstClear, stage.rewards?.firstClear);
    addCurrency(defenseRepeatClear, stage.rewards?.repeatClear);
  }

  const upgradeCosts = emptyCurrencyTotals();
  for (const upgrade of Object.values(BASE_UPGRADE_LINES)) {
    for (const rank of upgrade.ranks) upgradeCosts[upgrade.currencyId] += rank.cost;
  }

  const totalFirstClear = addCurrency({ ...campaignFirstClear }, defenseFirstClear);
  const totalRepeatClear = addCurrency({ ...campaignRepeatClear }, defenseRepeatClear);
  const firstClearSurplus = Object.fromEntries(Object.keys(totalFirstClear).map((currencyId) => [
    currencyId,
    totalFirstClear[currencyId] - upgradeCosts[currencyId],
  ]));

  return Object.freeze({
    generatedFrom: Object.freeze({ regions: regions.length, defenseStages: DEFENSE_STAGES.length, upgradeLines: Object.keys(BASE_UPGRADE_LINES).length }),
    campaignFirstClear: Object.freeze(campaignFirstClear),
    defenseFirstClear: Object.freeze(defenseFirstClear),
    totalFirstClear: Object.freeze(totalFirstClear),
    totalRepeatClear: Object.freeze(totalRepeatClear),
    upgradeCosts: Object.freeze(upgradeCosts),
    firstClearSurplus: Object.freeze(firstClearSurplus),
    resourceExchanges: Object.freeze(Object.values(BASE_RESOURCE_EXCHANGES).map((exchange) => Object.freeze({
      id: exchange.id,
      unlockAfterRegions: exchange.requiresCompletedRegions,
      costs: exchange.costs,
      rewards: exchange.rewards,
    }))),
  });
}

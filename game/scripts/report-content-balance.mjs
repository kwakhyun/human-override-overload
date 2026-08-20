import {
  CONTENT_BALANCE_TARGETS,
  CONTENT_KPI_DEFINITIONS,
  summarizeStaticContentBalance,
} from "../src/game/content/contentBalance.js";

const summary = summarizeStaticContentBalance();
const json = process.argv.includes("--json");

if (json) {
  process.stdout.write(`${JSON.stringify({ targets: CONTENT_BALANCE_TARGETS, metrics: CONTENT_KPI_DEFINITIONS, summary }, null, 2)}\n`);
  process.exit(0);
}

const currencyLabels = {
  researchData: "연구 자료",
  equipmentParts: "장비 부품",
  augmentationCores: "동기화 코어",
};

const rows = Object.keys(currencyLabels).map((currencyId) => ({
  currency: currencyLabels[currencyId],
  first: summary.totalFirstClear[currencyId],
  repeat: summary.totalRepeatClear[currencyId],
  sink: summary.upgradeCosts[currencyId],
  surplus: summary.firstClearSurplus[currencyId],
}));

console.log("# HUMAN OVERRIDE: OVERLOAD · 콘텐츠 밸런스 기준선");
console.log("");
console.log(`데이터 기준: 지역 ${summary.generatedFrom.regions}개 · 방어전 ${summary.generatedFrom.defenseStages}개 · 영구 강화 ${summary.generatedFrom.upgradeLines}개`);
console.log("");
console.log("| 재화 | 전체 초회 공급 | 전체 1회 반복 공급 | 영구 강화 총비용 | 초회 잔여 |");
console.log("|---|---:|---:|---:|---:|");
for (const row of rows) console.log(`| ${row.currency} | ${row.first} | ${row.repeat} | ${row.sink} | ${row.surplus >= 0 ? "+" : ""}${row.surplus} |`);
console.log("");
console.log("## 설계 가설과 검증 지표");
console.log("");
console.log(`- 외부 테스터 최소 표본: ${CONTENT_BALANCE_TARGETS.minimumExternalPlaytesters}명`);
console.log(`- 첫 성장 선택: ${CONTENT_BALANCE_TARGETS.firstRewardSeconds.min}–${CONTENT_BALANCE_TARGETS.firstRewardSeconds.max}초`);
console.log(`- 종점 정체: ${CONTENT_BALANCE_TARGETS.routeEndDwellSeconds.max}초 이하`);
console.log(`- 보스 TTK: ${CONTENT_BALANCE_TARGETS.bossTtkSeconds.min}–${CONTENT_BALANCE_TARGETS.bossTtkSeconds.max}초`);
for (const metric of CONTENT_KPI_DEFINITIONS) console.log(`- ${metric.label}: ${metric.source} → ${metric.decision}`);
console.log("");
console.log("주의: 위 시간 목표는 플레이테스트 전 설계 가설이며, 제출본에는 실제 중앙값/P90과 함께 표기해야 합니다.");

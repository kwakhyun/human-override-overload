import assert from "node:assert/strict";
import test from "node:test";

import {
  CONTENT_BALANCE_TARGETS,
  CONTENT_KPI_DEFINITIONS,
  summarizeStaticContentBalance,
} from "../src/game/content/contentBalance.js";

test("content balance baseline derives supply and sinks from active content data", () => {
  const summary = summarizeStaticContentBalance();
  assert.deepEqual(summary.generatedFrom, { regions: 6, defenseStages: 3, upgradeLines: 12 });
  assert.deepEqual(summary.totalFirstClear, { researchData: 137, equipmentParts: 137, augmentationCores: 34 });
  assert.deepEqual(summary.totalRepeatClear, { researchData: 52, equipmentParts: 57, augmentationCores: 19 });
  assert.deepEqual(summary.upgradeCosts, { researchData: 49, equipmentParts: 97, augmentationCores: 24 });
  assert.deepEqual(summary.firstClearSurplus, { researchData: 88, equipmentParts: 40, augmentationCores: 10 });
  assert.deepEqual(summary.resourceExchanges.map((exchange) => exchange.id), ["research-to-parts", "field-core-fabrication"]);
});

test("portfolio KPI definitions distinguish design hypotheses from validated results", () => {
  assert.equal(CONTENT_BALANCE_TARGETS.validationStatus, "hypothesis");
  assert.ok(CONTENT_BALANCE_TARGETS.minimumExternalPlaytesters >= 5);
  assert.deepEqual(CONTENT_BALANCE_TARGETS.firstRewardSeconds, { min: 6, max: 10 });
  assert.ok(CONTENT_BALANCE_TARGETS.routeEndDwellSeconds.max <= 20);
  assert.ok(CONTENT_KPI_DEFINITIONS.some((metric) => metric.id === "pattern-mastery"));
  assert.ok(CONTENT_KPI_DEFINITIONS.some((metric) => metric.id === "currency-balance"));
});

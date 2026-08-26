import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_FLIGHT_PLAN_ID,
  getFlightPlan,
  getFlightPlans,
  isFlightPlanUnlocked,
  sanitizeFlightOperations,
} from "../src/game/content/flightOperations.js";
import {
  completeRegion,
  createCampaignSlot,
  createEmptyCampaign,
  getCampaignCombatBonuses,
  getCampaignFlightOperations,
  getCampaignFlightPlan,
  getCampaignSlot,
  setCampaignFlightPlan,
} from "../src/game/save/campaignSave.js";

const NOW = "2026-08-25T09:00:00.000Z";

test("SERA owns three unlockable flight doctrines instead of duplicating region selection", () => {
  const plans = getFlightPlans();
  assert.deepEqual(plans.map((plan) => plan.id), ["night-veil", "lifeline-corridor", "raptor-escort"]);
  assert.deepEqual(plans.map((plan) => plan.koreanName), ["선행 정찰 지원", "긴급 보급 지원", "요격기 엄호 지원"]);
  assert.deepEqual(plans.map((plan) => plan.callSign), ["PATHFINDER", "SAFEGUARD", "INTERCEPTOR"]);
  assert.equal(DEFAULT_FLIGHT_PLAN_ID, "night-veil");
  assert.deepEqual(plans.map((plan) => plan.unlockClears), [0, 1, 3]);
  assert.equal(isFlightPlanUnlocked("night-veil", []), true);
  assert.equal(isFlightPlanUnlocked("lifeline-corridor", []), false);
  assert.equal(isFlightPlanUnlocked("lifeline-corridor", ["wrong-engine-core"]), true);
  assert.equal(isFlightPlanUnlocked("raptor-escort", ["wrong-engine-core", "glass-dune"]), false);
  assert.equal(Object.isFrozen(getFlightPlan("raptor-escort")), true);
});

test("a new slot starts with Pathfinder support and its mobility bonus reaches the combat runtime", () => {
  const campaign = createCampaignSlot(createEmptyCampaign(), "slot-1", { now: NOW });
  const slot = getCampaignSlot(campaign, "slot-1");
  assert.equal(slot.flightOperations.activePlanId, "night-veil");
  assert.equal(slot.flightOperations.completedSorties, 0);
  assert.deepEqual(slot.flightOperations.planSorties, {
    "night-veil": 0,
    "lifeline-corridor": 0,
    "raptor-escort": 0,
  });
  assert.equal(getCampaignFlightPlan(campaign, "slot-1").id, "night-veil");
  assert.deepEqual(getCampaignCombatBonuses(campaign, "slot-1"), {
    damageMultiplier: 1,
    xpGainMultiplier: 1,
    moveSpeedMultiplier: 1.08,
    fireRateMultiplier: 1.04,
    rifleDamageMultiplier: 1,
    swordDamageMultiplier: 1,
    maxHpFlat: 0,
    healingMultiplier: 1,
  });
});

test("locked plans cannot be equipped, while cleared regions unlock persistent support doctrines", () => {
  const initial = createCampaignSlot(createEmptyCampaign(), "slot-1", { now: NOW });
  assert.deepEqual(setCampaignFlightPlan(initial, "slot-1", "lifeline-corridor", { now: NOW }), initial);

  const cleared = completeRegion(initial, "slot-1", "wrong-engine-core", {
    status: "victory",
    runId: "flight-run-001",
  }, { now: NOW });
  const equipped = setCampaignFlightPlan(cleared, "slot-1", "lifeline-corridor", { now: "2026-08-25T09:05:00.000Z" });
  const operations = getCampaignFlightOperations(equipped, "slot-1");
  assert.equal(operations.activePlanId, "lifeline-corridor");
  assert.equal(operations.completedSorties, 1);
  assert.equal(operations.planSorties["night-veil"], 1);
  assert.deepEqual(getCampaignCombatBonuses(equipped, "slot-1"), {
    damageMultiplier: 1,
    xpGainMultiplier: 1,
    moveSpeedMultiplier: 1,
    fireRateMultiplier: 1,
    rifleDamageMultiplier: 1,
    swordDamageMultiplier: 1,
    maxHpFlat: 45,
    healingMultiplier: 1.15,
  });
});

test("flight-operation sortie records follow the equipped doctrine without double-counting callbacks", () => {
  let campaign = createCampaignSlot(createEmptyCampaign(), "slot-1", { now: NOW });
  campaign = completeRegion(campaign, "slot-1", "wrong-engine-core", { status: "victory", runId: "flight-run-101" }, { now: NOW });
  campaign = completeRegion(campaign, "slot-1", "glass-dune", { status: "victory", runId: "flight-run-102" }, { now: NOW });
  campaign = completeRegion(campaign, "slot-1", "abyssal-archive", { status: "victory", runId: "flight-run-103" }, { now: NOW });
  campaign = setCampaignFlightPlan(campaign, "slot-1", "raptor-escort", { now: NOW });
  campaign = completeRegion(campaign, "slot-1", "wrong-engine-core", { status: "victory", runId: "flight-run-104" }, { now: NOW });
  const duplicate = completeRegion(campaign, "slot-1", "wrong-engine-core", { status: "victory", runId: "flight-run-104" }, { now: NOW });
  const operations = getCampaignFlightOperations(duplicate, "slot-1");
  assert.equal(operations.completedSorties, 4);
  assert.equal(operations.planSorties["night-veil"], 3);
  assert.equal(operations.planSorties["raptor-escort"], 1);
  assert.equal(getCampaignCombatBonuses(duplicate, "slot-1").damageMultiplier, 1.07);
  assert.equal(getCampaignCombatBonuses(duplicate, "slot-1").xpGainMultiplier, 1.06);
});

test("legacy and malformed flight-operation data sanitizes to a usable default", () => {
  assert.deepEqual(sanitizeFlightOperations({
    activePlanId: "unknown-route",
    completedSorties: -9,
    planSorties: { "night-veil": "3", "lifeline-corridor": -1 },
  }, []), {
    activePlanId: "night-veil",
    completedSorties: 0,
    planSorties: {
      "night-veil": 3,
      "lifeline-corridor": 0,
      "raptor-escort": 0,
    },
  });
});

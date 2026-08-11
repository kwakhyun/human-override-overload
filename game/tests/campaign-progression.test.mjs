import assert from "node:assert/strict";
import test from "node:test";

import {
  BASE_FACILITIES,
  BASE_UPGRADE_LINES,
  getBaseFacilities,
  getBaseFacility,
  getBaseUpgrade,
  getBaseUpgrades,
} from "../src/game/content/baseUpgrades.js";
import { BASE_NPCS } from "../src/game/content/campaign.js";
import {
  DEFAULT_COMBAT_BONUSES,
  PROGRESSION_CURRENCY_FIELDS,
  calculateCombatBonuses,
  createEmptyBaseProgression,
  getProgressionResources,
  getRegionVictoryRewards,
  getUpgradeStatus,
  grantRegionVictoryRewards,
  purchaseProgressionUpgrade,
  sanitizeBaseProgression,
} from "../src/game/progression/baseProgression.js";
import {
  CAMPAIGN_SAVE_KEY,
  CAMPAIGN_SAVE_VERSION,
  LEGACY_CAMPAIGN_SAVE_KEY,
  completeRegion,
  createCampaignSlot,
  createEmptyCampaign,
  getCampaignCombatBonuses,
  getCampaignProgression,
  getCampaignSlot,
  getCampaignUpgradeStatus,
  loadCampaign,
  purchaseCampaignUpgrade,
  saveCampaign,
  sanitizeCampaign,
} from "../src/game/save/campaignSave.js";

class MemoryStorage {
  values = new Map();

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }
}

const NOW = "2026-08-10T08:00:00.000Z";
const FULL_CONTEXT = {
  homeBaseUnlocked: true,
  completedRegionIds: ["wrong-engine-core", "glass-dune", "abyssal-archive"],
};

test("HANA research and ILYA weapon/equipment lines each expose three ranks", () => {
  assert.equal(getBaseUpgrades("hana").length, 3);
  assert.equal(getBaseUpgrades("ilya").length, 5);
  assert.equal(Object.keys(BASE_UPGRADE_LINES).length, 8);
  assert.deepEqual(getBaseFacilities().map((facility) => facility.id), ["research", "equipment"]);
  assert.equal(getBaseFacility("research").npcId, "hana");
  assert.equal(getBaseFacility("equipment").npcId, "ilya");
  assert.equal(getBaseFacility("missing"), null);
  assert.equal(BASE_NPCS.hana.facilityId, "research");
  assert.equal(BASE_NPCS.ilya.facilityId, "equipment");
  assert.equal(BASE_FACILITIES.research.upgradeIds.length, 3);

  for (const upgrade of Object.values(BASE_UPGRADE_LINES)) {
    assert.equal(upgrade.ranks.length, 3);
    assert.deepEqual(upgrade.ranks.map((rank) => rank.rank), [1, 2, 3]);
    const weaponLine = upgrade.id === "ilya-rifle-emitter" || upgrade.id === "ilya-sword-resonator";
    assert.deepEqual(upgrade.ranks.map((rank) => rank.requiresCompletedRegions), weaponLine ? [0, 1, 2] : [1, 2, 3]);
    assert.ok(upgrade.ranks[0].cost < upgrade.ranks[2].cost);
    assert.equal(getBaseUpgrade(upgrade.id), upgrade);
  }
});

test("base progression has explicit currencies and sanitized research/equipment rank maps", () => {
  assert.deepEqual(PROGRESSION_CURRENCY_FIELDS, ["researchData", "equipmentParts"]);
  const empty = createEmptyBaseProgression();
  assert.deepEqual(getProgressionResources(empty), { researchData: 0, equipmentParts: 0 });
  assert.equal(Object.keys(empty.researchRanks).length, 3);
  assert.equal(Object.keys(empty.equipmentRanks).length, 5);

  const sanitized = sanitizeBaseProgression({
    researchData: -4,
    equipmentParts: 7.9,
    researchRanks: { "hana-combat-forecast": 99, forged: 2 },
    equipmentRanks: { "ilya-reactive-plating": -2 },
  });
  assert.equal(sanitized.researchData, 0);
  assert.equal(sanitized.equipmentParts, 7);
  assert.equal(sanitized.researchRanks["hana-combat-forecast"], 3);
  assert.equal("forged" in sanitized.researchRanks, false);
  assert.equal(sanitized.equipmentRanks["ilya-reactive-plating"], 0);
});

test("first and repeat regional victories grant distinct research and equipment rewards", () => {
  assert.deepEqual(getRegionVictoryRewards("wrong-engine-core", true), { researchData: 8, equipmentParts: 8 });
  assert.deepEqual(getRegionVictoryRewards("wrong-engine-core", false), { researchData: 2, equipmentParts: 2 });
  assert.deepEqual(getRegionVictoryRewards("glass-dune", true), { researchData: 9, equipmentParts: 14 });
  assert.deepEqual(getRegionVictoryRewards("abyssal-archive", true), { researchData: 15, equipmentParts: 10 });

  const first = grantRegionVictoryRewards(createEmptyBaseProgression(), "glass-dune", { firstClear: true });
  const repeat = grantRegionVictoryRewards(first.progression, "glass-dune", { firstClear: false });
  assert.deepEqual(getProgressionResources(repeat.progression), { researchData: 12, equipmentParts: 19 });
});

test("v1 slots migrate to v2 without losing progress and receive retroactive first-clear resources", () => {
  const legacy = {
    version: 1,
    slots: [{
      id: "slot-1",
      createdAt: NOW,
      updatedAt: NOW,
      completedRegionIds: ["wrong-engine-core", "glass-dune"],
      storyFlags: ["legacy-flag"],
      regionRecords: {
        "wrong-engine-core": { clears: 1, bestTime: 180, highestLevel: 12, mostKills: 1000 },
      },
    }, null, null],
  };
  const migrated = sanitizeCampaign(legacy);
  const slot = getCampaignSlot(migrated, "slot-1");
  assert.equal(migrated.version, CAMPAIGN_SAVE_VERSION);
  assert.deepEqual(slot.completedRegionIds, ["wrong-engine-core", "glass-dune"]);
  assert.ok(slot.storyFlags.includes("legacy-flag"));
  assert.deepEqual(getProgressionResources(slot.progression), { researchData: 17, equipmentParts: 22 });
  assert.equal(slot.regionRecords["wrong-engine-core"].bestTime, 180);

  const storage = new MemoryStorage();
  storage.values.set(LEGACY_CAMPAIGN_SAVE_KEY, JSON.stringify(legacy));
  assert.deepEqual(loadCampaign(storage), migrated);
  assert.equal(saveCampaign(migrated, storage), true);
  assert.ok(storage.values.has(CAMPAIGN_SAVE_KEY));
});

test("campaign victories award once per run ID and distinguish first from repeat clears", () => {
  let campaign = completeRegion(createEmptyCampaign(), "slot-1", "wrong-engine-core", {
    status: "victory",
    runId: "clear-1",
  }, { now: NOW });
  let slot = getCampaignSlot(campaign, "slot-1");
  assert.deepEqual(getProgressionResources(slot.progression), { researchData: 8, equipmentParts: 8 });
  assert.deepEqual(slot.lastRegionRewards, {
    regionId: "wrong-engine-core",
    firstClear: true,
    researchData: 8,
    equipmentParts: 8,
    grantedAt: NOW,
    runId: "clear-1",
  });

  campaign = completeRegion(campaign, "slot-1", "wrong-engine-core", {
    status: "victory",
    runId: "clear-2",
  }, { now: NOW });
  slot = getCampaignSlot(campaign, "slot-1");
  assert.deepEqual(getProgressionResources(slot.progression), { researchData: 10, equipmentParts: 10 });
  assert.equal(slot.lastRegionRewards.firstClear, false);

  campaign = completeRegion(campaign, "slot-1", "wrong-engine-core", {
    status: "victory",
    runId: "clear-2",
  }, { now: NOW });
  assert.deepEqual(getProgressionResources(getCampaignSlot(campaign, "slot-1").progression), { researchData: 10, equipmentParts: 10 });
});

test("purchase validation covers base lock, rank lock, cost, unknown IDs, and max rank", () => {
  const empty = createEmptyBaseProgression();
  assert.equal(getUpgradeStatus(empty, { homeBaseUnlocked: false, completedRegionIds: [] }, "hana-adaptive-learning").reason, "base-locked");
  assert.equal(getUpgradeStatus(empty, { homeBaseUnlocked: true, completedRegionIds: ["wrong-engine-core"] }, "hana-adaptive-learning").reason, "insufficient-funds");
  assert.equal(getUpgradeStatus(empty, FULL_CONTEXT, "missing-upgrade").reason, "unknown-upgrade");

  let progression = sanitizeBaseProgression({ researchData: 100, equipmentParts: 100 });
  let purchase = purchaseProgressionUpgrade(progression, { homeBaseUnlocked: true, completedRegionIds: ["wrong-engine-core"] }, "hana-adaptive-learning");
  assert.equal(purchase.ok, true);
  progression = purchase.progression;
  assert.equal(purchaseProgressionUpgrade(progression, { homeBaseUnlocked: true, completedRegionIds: ["wrong-engine-core"] }, "hana-adaptive-learning").reason, "rank-locked");

  progression = sanitizeBaseProgression({ ...progression, researchData: 100 });
  for (let index = 1; index < 3; index += 1) {
    purchase = purchaseProgressionUpgrade(progression, FULL_CONTEXT, "hana-adaptive-learning");
    assert.equal(purchase.ok, true);
    progression = purchase.progression;
  }
  assert.equal(purchaseProgressionUpgrade(progression, FULL_CONTEXT, "hana-adaptive-learning").reason, "max-rank");
});

test("campaign purchase API deducts the correct currency and keeps slots isolated", () => {
  let campaign = completeRegion(createEmptyCampaign(), "slot-1", "wrong-engine-core", { status: "victory", runId: "run-a" }, { now: NOW });
  campaign = createCampaignSlot(campaign, "slot-2", { now: NOW });
  assert.equal(getCampaignUpgradeStatus(campaign, "slot-1", "ilya-nanite-injector").purchasable, true);
  const equipmentPurchase = purchaseCampaignUpgrade(campaign, "slot-1", "ilya-nanite-injector", { now: NOW });
  assert.equal(equipmentPurchase.ok, true);
  assert.equal(equipmentPurchase.rank, 1);
  const researchPurchase = purchaseCampaignUpgrade(equipmentPurchase.campaign, "slot-1", "hana-adaptive-learning", { now: NOW });
  assert.equal(researchPurchase.ok, true);
  const firstProgression = getCampaignProgression(researchPurchase.campaign, "slot-1");
  assert.equal(firstProgression.equipmentParts, 6);
  assert.equal(firstProgression.researchData, 6);
  assert.equal(firstProgression.equipmentRanks["ilya-nanite-injector"], 1);
  assert.equal(firstProgression.researchRanks["hana-adaptive-learning"], 1);
  assert.equal(getCampaignProgression(researchPurchase.campaign, "slot-2").equipmentParts, 0);
  assert.equal(getCampaignUpgradeStatus(researchPurchase.campaign, "missing-slot", "ilya-nanite-injector").reason, "invalid-slot");

  const storage = new MemoryStorage();
  assert.equal(saveCampaign(researchPurchase.campaign, storage), true);
  assert.deepEqual(getCampaignProgression(loadCampaign(storage), "slot-1"), firstProgression);
});

test("calculated combat bonuses are a flat createSwarmState-ready object", () => {
  const progression = sanitizeBaseProgression({
    researchData: 99,
    equipmentParts: 99,
    researchRanks: {
      "hana-combat-forecast": 3,
      "hana-adaptive-learning": 2,
      "hana-threat-cartography": 1,
    },
    equipmentRanks: {
      "ilya-accelerator-coil": 3,
      "ilya-reactive-plating": 2,
      "ilya-nanite-injector": 3,
    },
  });
  assert.deepEqual(calculateCombatBonuses(createEmptyBaseProgression()), DEFAULT_COMBAT_BONUSES);
  assert.deepEqual(calculateCombatBonuses(progression), {
    damageMultiplier: 1.13,
    xpGainMultiplier: 1.16,
    moveSpeedMultiplier: 1.04,
    fireRateMultiplier: 1.18,
    rifleDamageMultiplier: 1,
    swordDamageMultiplier: 1,
    maxHpFlat: 80,
    healingMultiplier: 1.35,
  });

  const campaign = createCampaignSlot(createEmptyCampaign(), "slot-1", { now: NOW });
  assert.deepEqual(getCampaignCombatBonuses(campaign, "slot-1"), DEFAULT_COMBAT_BONUSES);
});

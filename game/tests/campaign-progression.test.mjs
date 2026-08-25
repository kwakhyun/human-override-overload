import assert from "node:assert/strict";
import test from "node:test";

import {
  BASE_FACILITIES,
  BASE_RESOURCE_EXCHANGES,
  BASE_UPGRADE_LINES,
  getBaseFacilities,
  getBaseFacility,
  getBaseResourceExchange,
  getBaseResourceExchanges,
  getBaseUpgrade,
  getBaseUpgrades,
} from "../src/game/content/baseUpgrades.js";
import { BASE_NPCS } from "../src/game/content/campaign.js";
import {
  CHARACTER_SKILL_LOADOUTS,
  getCharacterSkillRanks,
} from "../src/game/content/characterSkills.js";
import {
  DEFAULT_COMBAT_BONUSES,
  PROGRESSION_CURRENCY_FIELDS,
  calculateCombatBonuses,
  createEmptyBaseProgression,
  exchangeProgressionResources,
  getProgressionResources,
  getResourceExchangeStatus,
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
  exchangeCampaignResources,
  getCampaignCombatBonuses,
  getCampaignCharacter,
  getCampaignProgression,
  getCampaignResourceExchangeStatus,
  getCampaignSlot,
  getCampaignUpgradeStatus,
  loadCampaign,
  purchaseCampaignUpgrade,
  saveCampaign,
  setCampaignCharacter,
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

test("HANA, ILYA, and character skill-link progression lines each expose three ranks", () => {
  assert.equal(getBaseUpgrades("hana").length, 3);
  assert.equal(getBaseUpgrades("ilya").length, 5);
  assert.equal(getBaseUpgrades("aegis").length, 3);
  assert.equal(Object.keys(BASE_UPGRADE_LINES).length, 11);
  assert.deepEqual(getBaseFacilities().map((facility) => facility.id), ["research", "equipment", "augmentation"]);
  assert.equal(getBaseFacility("research").npcId, "hana");
  assert.equal(getBaseFacility("equipment").npcId, "ilya");
  assert.equal(getBaseFacility("augmentation").npcId, "aegis");
  assert.equal(getBaseFacility("missing"), null);
  assert.equal(BASE_NPCS.hana.facilityId, "research");
  assert.equal(BASE_NPCS.ilya.facilityId, "equipment");
  assert.equal(BASE_FACILITIES.research.upgradeIds.length, 3);

  for (const upgrade of Object.values(BASE_UPGRADE_LINES)) {
    assert.equal(upgrade.ranks.length, 3);
    assert.deepEqual(upgrade.ranks.map((rank) => rank.rank), [1, 2, 3]);
    const weaponLine = upgrade.id === "ilya-rifle-emitter" || upgrade.id === "ilya-sword-resonator";
    const expectedUnlocks = upgrade.category === "augmentation" ? [1, 2, 3] : weaponLine ? [0, 1, 2] : [1, 2, 3];
    assert.deepEqual(upgrade.ranks.map((rank) => rank.requiresCompletedRegions), expectedUnlocks);
    assert.ok(upgrade.ranks[0].cost < upgrade.ranks[2].cost);
    assert.equal(getBaseUpgrade(upgrade.id), upgrade);
  }
});

test("character skill links are data-driven and migrate legacy AEGIS augments once with a core refund", () => {
  assert.deepEqual(Object.keys(CHARACTER_SKILL_LOADOUTS), ["aegis", "mika", "vesper"]);
  for (const loadout of Object.values(CHARACTER_SKILL_LOADOUTS)) {
    assert.deepEqual(loadout.skills.map((skill) => skill.slot), ["Q", "E", "F", "R"]);
    assert.deepEqual(loadout.skills.map((skill) => skill.requiredGrade), [0, 1, 2, 3]);
    const upgrade = getBaseUpgrade(loadout.progressionId);
    assert.equal(upgrade.characterId, loadout.characterId);
    assert.deepEqual(upgrade.ranks.map((rank) => rank.unlockSlot), ["E", "F", "R"]);
  }

  const migrated = sanitizeBaseProgression({
    augmentationCores: 4,
    augmentationRanks: {
      "aegis-assault-sync": 3,
      "aegis-vital-frame": 1,
      "aegis-reflex-drive": 0,
    },
  });
  assert.deepEqual(getCharacterSkillRanks(migrated), { aegis: 3, mika: 0, vesper: 0 });
  assert.equal(migrated.augmentationCores, 16, "18 legacy cores minus the 6-core skill grade cost refunds 12 once");
  assert.equal("aegis-assault-sync" in migrated.augmentationRanks, false);

  const sanitizedAgain = sanitizeBaseProgression(migrated);
  assert.equal(sanitizedAgain.augmentationCores, 16, "the explicit new skill-link key makes migration idempotent");
  assert.deepEqual(getCharacterSkillRanks(sanitizedAgain), { aegis: 3, mika: 0, vesper: 0 });

  const mixed = sanitizeBaseProgression({
    augmentationCores: 4,
    augmentationRanks: {
      "aegis-skill-link": 0,
      "aegis-assault-sync": 2,
      "aegis-vital-frame": 1,
    },
  });
  assert.deepEqual(getCharacterSkillRanks(mixed), { aegis: 3, mika: 0, vesper: 0 });
  assert.equal(mixed.augmentationCores, 7, "a pre-created zero-valued skill key cannot discard legacy ranks or their refund");
  assert.equal(sanitizeBaseProgression(mixed).augmentationCores, 7, "the persisted migration version prevents a second refund");
});

test("base progression has explicit currencies and sanitized rank maps", () => {
  assert.deepEqual(PROGRESSION_CURRENCY_FIELDS, ["researchData", "equipmentParts", "augmentationCores"]);
  const empty = createEmptyBaseProgression();
  assert.deepEqual(getProgressionResources(empty), { researchData: 0, equipmentParts: 0, augmentationCores: 0 });
  assert.equal(Object.keys(empty.researchRanks).length, 3);
  assert.equal(Object.keys(empty.equipmentRanks).length, 5);
  assert.equal(Object.keys(empty.augmentationRanks).length, 3);

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

test("resource exchanges consume surplus currencies behind authored progression gates", () => {
  assert.equal(Object.keys(BASE_RESOURCE_EXCHANGES).length, 2);
  assert.deepEqual(getBaseResourceExchanges("hana").map((exchange) => exchange.id), [
    "research-to-parts",
    "field-core-fabrication",
  ]);
  assert.equal(getBaseResourceExchange("missing"), null);

  const stocked = sanitizeBaseProgression({ researchData: 30, equipmentParts: 10 });
  assert.equal(getResourceExchangeStatus(stocked, { homeBaseUnlocked: false, completedRegionIds: [] }, "research-to-parts").reason, "base-locked");
  assert.equal(getResourceExchangeStatus(stocked, { homeBaseUnlocked: true, completedRegionIds: ["wrong-engine-core"] }, "research-to-parts").reason, "exchange-locked");
  const context = { homeBaseUnlocked: true, completedRegionIds: ["wrong-engine-core", "glass-dune", "abyssal-archive", "glass-dune"] };
  const synthesis = exchangeProgressionResources(stocked, context, "research-to-parts", 2);
  assert.equal(synthesis.ok, true);
  assert.deepEqual(getProgressionResources(synthesis.progression), { researchData: 18, equipmentParts: 16, augmentationCores: 0 });
  const core = exchangeProgressionResources(synthesis.progression, context, "field-core-fabrication");
  assert.equal(core.ok, true);
  assert.deepEqual(getProgressionResources(core.progression), { researchData: 6, equipmentParts: 8, augmentationCores: 1 });
  assert.equal(exchangeProgressionResources(core.progression, context, "field-core-fabrication").reason, "insufficient-funds");
});

test("first and repeat regional victories grant distinct research and equipment rewards", () => {
  assert.deepEqual(getRegionVictoryRewards("wrong-engine-core", true), { researchData: 8, equipmentParts: 8, augmentationCores: 2 });
  assert.deepEqual(getRegionVictoryRewards("wrong-engine-core", false), { researchData: 2, equipmentParts: 2, augmentationCores: 1 });
  assert.deepEqual(getRegionVictoryRewards("glass-dune", true), { researchData: 9, equipmentParts: 14, augmentationCores: 3 });
  assert.deepEqual(getRegionVictoryRewards("abyssal-archive", true), { researchData: 15, equipmentParts: 10, augmentationCores: 4 });

  const first = grantRegionVictoryRewards(createEmptyBaseProgression(), "glass-dune", { firstClear: true });
  const repeat = grantRegionVictoryRewards(first.progression, "glass-dune", { firstClear: false });
  assert.deepEqual(getProgressionResources(repeat.progression), { researchData: 12, equipmentParts: 19, augmentationCores: 5 });
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
  assert.deepEqual(getProgressionResources(slot.progression), { researchData: 17, equipmentParts: 22, augmentationCores: 5 });
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
  assert.deepEqual(getProgressionResources(slot.progression), { researchData: 8, equipmentParts: 8, augmentationCores: 2 });
  assert.deepEqual(slot.lastRegionRewards, {
    regionId: "wrong-engine-core",
    firstClear: true,
    researchData: 8,
    equipmentParts: 8,
    augmentationCores: 2,
    grantedAt: NOW,
    runId: "clear-1",
  });

  campaign = completeRegion(campaign, "slot-1", "wrong-engine-core", {
    status: "victory",
    runId: "clear-2",
  }, { now: NOW });
  slot = getCampaignSlot(campaign, "slot-1");
  assert.deepEqual(getProgressionResources(slot.progression), { researchData: 10, equipmentParts: 10, augmentationCores: 3 });
  assert.equal(slot.lastRegionRewards.firstClear, false);

  campaign = completeRegion(campaign, "slot-1", "wrong-engine-core", {
    status: "victory",
    runId: "clear-2",
  }, { now: NOW });
  assert.deepEqual(getProgressionResources(getCampaignSlot(campaign, "slot-1").progression), { researchData: 10, equipmentParts: 10, augmentationCores: 3 });
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

test("campaign resource exchange persists per slot without mutating another slot", () => {
  let campaign = createCampaignSlot(createEmptyCampaign(), "slot-1", { now: NOW });
  campaign = createCampaignSlot(campaign, "slot-2", { now: NOW });
  for (const [index, regionId] of ["wrong-engine-core", "glass-dune", "abyssal-archive"].entries()) {
    campaign = completeRegion(campaign, "slot-1", regionId, { status: "victory", runId: `exchange-${index}` }, { now: NOW });
  }
  assert.equal(getCampaignResourceExchangeStatus(campaign, "slot-1", "research-to-parts").exchangeable, true);
  const beforeSecond = getCampaignProgression(campaign, "slot-2");
  const result = exchangeCampaignResources(campaign, "slot-1", "research-to-parts", 2, { now: NOW });
  assert.equal(result.ok, true);
  assert.equal(getCampaignProgression(result.campaign, "slot-1").researchData, 20);
  assert.deepEqual(getCampaignProgression(result.campaign, "slot-2"), beforeSecond);
  assert.equal(getCampaignResourceExchangeStatus(result.campaign, "missing-slot", "research-to-parts").reason, "invalid-slot");
});

test("campaign loadout persists the selected lead character independently per slot", () => {
  let campaign = createCampaignSlot(createEmptyCampaign(), "slot-1", { now: NOW });
  campaign = createCampaignSlot(campaign, "slot-2", { now: NOW });
  assert.equal(getCampaignCharacter(campaign, "slot-1"), "aegis");
  campaign = setCampaignCharacter(campaign, "slot-1", "mika", { now: NOW });
  assert.equal(getCampaignCharacter(campaign, "slot-1"), "aegis", "MIKA stays locked before the first regional clear");
  campaign = completeRegion(campaign, "slot-1", "wrong-engine-core", { status: "victory", runId: "mika-unlock" }, { now: NOW });
  assert.ok(getCampaignSlot(campaign, "slot-1").storyFlags.includes("mika-unlocked"));
  campaign = setCampaignCharacter(campaign, "slot-1", "mika", { now: NOW });
  assert.equal(getCampaignCharacter(campaign, "slot-1"), "mika");
  assert.equal(getCampaignCharacter(campaign, "slot-2"), "aegis");
  assert.equal(getCampaignCharacter(setCampaignCharacter(campaign, "slot-1", "unknown"), "slot-1"), "aegis");
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
  assert.deepEqual(getCampaignCombatBonuses(campaign, "slot-1"), {
    ...DEFAULT_COMBAT_BONUSES,
    moveSpeedMultiplier: 1.08,
    fireRateMultiplier: 1.04,
  });
});

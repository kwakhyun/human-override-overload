import {
  BASE_UPGRADE_LINES,
  getBaseResourceExchange,
  getBaseUpgrade,
} from "../content/baseUpgrades.js";
import { getRegion } from "../content/campaign.js";

export const PROGRESSION_CURRENCY_FIELDS = Object.freeze(["researchData", "equipmentParts", "augmentationCores"]);
export const PROGRESSION_RANK_FIELDS = Object.freeze(["researchRanks", "equipmentRanks", "augmentationRanks"]);

export const DEFAULT_COMBAT_BONUSES = Object.freeze({
  damageMultiplier: 1,
  xpGainMultiplier: 1,
  moveSpeedMultiplier: 1,
  fireRateMultiplier: 1,
  rifleDamageMultiplier: 1,
  swordDamageMultiplier: 1,
  maxHpFlat: 0,
  healingMultiplier: 1,
});

const RESEARCH_IDS = Object.freeze(Object.values(BASE_UPGRADE_LINES)
  .filter((upgrade) => upgrade.category === "research")
  .map((upgrade) => upgrade.id));
const EQUIPMENT_IDS = Object.freeze(Object.values(BASE_UPGRADE_LINES)
  .filter((upgrade) => upgrade.category === "equipment")
  .map((upgrade) => upgrade.id));
const AUGMENTATION_IDS = Object.freeze(Object.values(BASE_UPGRADE_LINES)
  .filter((upgrade) => upgrade.category === "augmentation")
  .map((upgrade) => upgrade.id));

function finiteInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
}

function createRankMap(ids) {
  return Object.fromEntries(ids.map((id) => [id, 0]));
}

function sanitizeRankMap(value, ids) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return Object.fromEntries(ids.map((id) => {
    const maxRank = getBaseUpgrade(id)?.ranks.length ?? 0;
    return [id, Math.min(maxRank, finiteInteger(source[id], 0))];
  }));
}

function rankFieldFor(upgrade) {
  if (upgrade?.category === "equipment") return "equipmentRanks";
  if (upgrade?.category === "augmentation") return "augmentationRanks";
  return "researchRanks";
}

function round(value) {
  return Math.round(value * 1000000) / 1000000;
}

export function createEmptyBaseProgression() {
  return {
    researchData: 0,
    equipmentParts: 0,
    augmentationCores: 0,
    researchRanks: createRankMap(RESEARCH_IDS),
    equipmentRanks: createRankMap(EQUIPMENT_IDS),
    augmentationRanks: createRankMap(AUGMENTATION_IDS),
  };
}

export function sanitizeBaseProgression(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    researchData: finiteInteger(source.researchData, 0),
    equipmentParts: finiteInteger(source.equipmentParts, 0),
    augmentationCores: finiteInteger(source.augmentationCores, 0),
    researchRanks: sanitizeRankMap(source.researchRanks, RESEARCH_IDS),
    equipmentRanks: sanitizeRankMap(source.equipmentRanks, EQUIPMENT_IDS),
    augmentationRanks: sanitizeRankMap(source.augmentationRanks, AUGMENTATION_IDS),
  };
}

export function getProgressionResources(progression) {
  const safe = sanitizeBaseProgression(progression);
  return Object.freeze({
    researchData: safe.researchData,
    equipmentParts: safe.equipmentParts,
    augmentationCores: safe.augmentationCores,
  });
}

export function getUpgradeRank(progression, upgradeId) {
  const upgrade = getBaseUpgrade(upgradeId);
  if (!upgrade) return 0;
  const safe = sanitizeBaseProgression(progression);
  return safe[rankFieldFor(upgrade)][upgrade.id] ?? 0;
}

export function getUpgradeStatus(progression, context, upgradeId) {
  const upgrade = getBaseUpgrade(upgradeId);
  if (!upgrade) return {
    upgradeId,
    exists: false,
    purchasable: false,
    reason: "unknown-upgrade",
  };

  const safe = sanitizeBaseProgression(progression);
  const rank = safe[rankFieldFor(upgrade)][upgrade.id] ?? 0;
  const maxRank = upgrade.ranks.length;
  if (rank >= maxRank) return {
    upgradeId,
    exists: true,
    rank,
    maxRank,
    nextRank: null,
    cost: null,
    currencyId: upgrade.currencyId,
    balance: safe[upgrade.currencyId],
    purchasable: false,
    reason: "max-rank",
  };

  const nextRank = upgrade.ranks[rank];
  const completedRegions = Array.isArray(context?.completedRegionIds) ? context.completedRegionIds.length : 0;
  const baseUnlocked = Boolean(context?.homeBaseUnlocked ?? context?.baseUnlocked);
  let reason = null;
  if (!baseUnlocked) reason = "base-locked";
  else if (completedRegions < nextRank.requiresCompletedRegions) reason = "rank-locked";
  else if (safe[upgrade.currencyId] < nextRank.cost) reason = "insufficient-funds";
  return {
    upgradeId,
    exists: true,
    rank,
    maxRank,
    nextRank: nextRank.rank,
    cost: nextRank.cost,
    currencyId: upgrade.currencyId,
    balance: safe[upgrade.currencyId],
    requiredCompletedRegions: nextRank.requiresCompletedRegions,
    purchasable: reason === null,
    reason,
  };
}

export function purchaseProgressionUpgrade(progression, context, upgradeId) {
  const safe = sanitizeBaseProgression(progression);
  const status = getUpgradeStatus(safe, context, upgradeId);
  if (!status.purchasable) return {
    ok: false,
    reason: status.reason,
    progression: safe,
    status,
  };

  const upgrade = getBaseUpgrade(upgradeId);
  const rankField = rankFieldFor(upgrade);
  const next = {
    ...safe,
    [upgrade.currencyId]: safe[upgrade.currencyId] - status.cost,
    [rankField]: {
      ...safe[rankField],
      [upgradeId]: status.nextRank,
    },
  };
  return {
    ok: true,
    reason: null,
    progression: next,
    upgradeId,
    rank: status.nextRank,
    cost: status.cost,
    currencyId: upgrade.currencyId,
    status: getUpgradeStatus(next, context, upgradeId),
  };
}

function scaledCurrencyMap(values, quantity) {
  return Object.fromEntries(Object.entries(values || {}).map(([currencyId, amount]) => [
    currencyId,
    finiteInteger(amount, 0) * quantity,
  ]));
}

export function getResourceExchangeStatus(progression, context, exchangeId, quantity = 1) {
  const exchange = getBaseResourceExchange(exchangeId);
  const safeQuantity = Math.max(1, finiteInteger(quantity, 1));
  if (!exchange) return {
    exchangeId,
    exists: false,
    quantity: safeQuantity,
    exchangeable: false,
    reason: "unknown-exchange",
  };

  const safe = sanitizeBaseProgression(progression);
  const completedRegions = Array.isArray(context?.completedRegionIds) ? context.completedRegionIds.length : 0;
  const costs = scaledCurrencyMap(exchange.costs, safeQuantity);
  const rewards = scaledCurrencyMap(exchange.rewards, safeQuantity);
  let reason = null;
  if (!Boolean(context?.homeBaseUnlocked ?? context?.baseUnlocked)) reason = "base-locked";
  else if (completedRegions < exchange.requiresCompletedRegions) reason = "exchange-locked";
  else if (Object.entries(costs).some(([currencyId, amount]) => safe[currencyId] < amount)) reason = "insufficient-funds";

  return {
    exchangeId,
    exists: true,
    quantity: safeQuantity,
    costs,
    rewards,
    requiredCompletedRegions: exchange.requiresCompletedRegions,
    exchangeable: reason === null,
    reason,
  };
}

export function exchangeProgressionResources(progression, context, exchangeId, quantity = 1) {
  const safe = sanitizeBaseProgression(progression);
  const status = getResourceExchangeStatus(safe, context, exchangeId, quantity);
  if (!status.exchangeable) return {
    ok: false,
    reason: status.reason,
    progression: safe,
    status,
  };

  const next = { ...safe };
  for (const [currencyId, amount] of Object.entries(status.costs)) next[currencyId] -= amount;
  for (const [currencyId, amount] of Object.entries(status.rewards)) next[currencyId] += amount;
  return {
    ok: true,
    reason: null,
    progression: next,
    exchangeId,
    quantity: status.quantity,
    costs: status.costs,
    rewards: status.rewards,
    status: getResourceExchangeStatus(next, context, exchangeId, quantity),
  };
}

export function getRegionVictoryRewards(regionId, firstClear = true) {
  const region = getRegion(regionId);
  const reward = firstClear ? region?.victoryRewards?.firstClear : region?.victoryRewards?.repeatClear;
  return Object.freeze({
    researchData: finiteInteger(reward?.researchData, 0),
    equipmentParts: finiteInteger(reward?.equipmentParts, 0),
    augmentationCores: finiteInteger(reward?.augmentationCores, 0),
  });
}

export function grantRegionVictoryRewards(progression, regionId, options = {}) {
  const safe = sanitizeBaseProgression(progression);
  const firstClear = options.firstClear !== false;
  const rewards = getRegionVictoryRewards(regionId, firstClear);
  return {
    progression: {
      ...safe,
      researchData: safe.researchData + rewards.researchData,
      equipmentParts: safe.equipmentParts + rewards.equipmentParts,
      augmentationCores: safe.augmentationCores + rewards.augmentationCores,
    },
    rewards,
    firstClear,
  };
}

export function calculateCombatBonuses(progression) {
  const safe = sanitizeBaseProgression(progression);
  const bonuses = { ...DEFAULT_COMBAT_BONUSES };
  for (const upgrade of Object.values(BASE_UPGRADE_LINES)) {
    const purchasedRanks = safe[rankFieldFor(upgrade)][upgrade.id] ?? 0;
    for (let index = 0; index < purchasedRanks; index += 1) {
      for (const [field, value] of Object.entries(upgrade.ranks[index].bonuses)) {
        bonuses[field] = round((bonuses[field] ?? 0) + value);
      }
    }
  }
  return Object.freeze(bonuses);
}

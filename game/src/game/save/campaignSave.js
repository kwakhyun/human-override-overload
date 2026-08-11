import {
  CAMPAIGN_CHAPTERS,
  DEFAULT_REGION_ID,
  getCampaignRegions,
  getCompletedChapterIds,
  getCurrentChapterId,
  getRegion,
  getUnlockedRegionIds,
} from "../content/campaign.js";
import {
  calculateCombatBonuses,
  createEmptyBaseProgression,
  getUpgradeStatus,
  grantRegionVictoryRewards,
  purchaseProgressionUpgrade,
  sanitizeBaseProgression,
} from "../progression/baseProgression.js";
import { DEFAULT_MAIN_WEAPON_ID, sanitizeMainWeaponId } from "../content/weapons.js";

export const CAMPAIGN_SAVE_VERSION = 2;
export const CAMPAIGN_SAVE_KEY = "train-me-wrong.overload.campaign.v2";
export const LEGACY_CAMPAIGN_SAVE_KEY = "train-me-wrong.overload.campaign.v1";
export const CAMPAIGN_SAVE_SLOT_COUNT = 3;
export const CAMPAIGN_SLOT_PROGRESSION_FIELD = "progression";

const KNOWN_REGION_IDS = new Set(getCampaignRegions().map((region) => region.id));
const KNOWN_CHAPTER_IDS = new Set(CAMPAIGN_CHAPTERS.map((chapter) => chapter.id));

function resolveBrowserStorage() {
  try {
    return globalThis?.localStorage ?? null;
  } catch {
    return null;
  }
}

function resolveNow(now) {
  const input = typeof now === "function" ? now() : now;
  const date = input instanceof Date ? input : new Date(input ?? Date.now());
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date(0).toISOString();
}

function finiteNonNegative(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function uniqueKnown(values, known) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((value) => typeof value === "string" && known.has(value)))];
}

function uniqueStrings(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter((value) => typeof value === "string" && value.length > 0))].slice(0, 64);
}

function normalizeSlotIndex(slotId) {
  if (Number.isInteger(slotId) && slotId >= 0 && slotId < CAMPAIGN_SAVE_SLOT_COUNT) return slotId;
  const match = /^slot-([1-3])$/.exec(String(slotId || ""));
  return match ? Number(match[1]) - 1 : -1;
}

function slotIdForIndex(index) {
  return `slot-${index + 1}`;
}

function sanitizeRegionRecord(record) {
  if (!record || typeof record !== "object") return null;
  const bestTime = finiteNonNegative(record.bestTime, 0);
  return {
    clears: Math.max(1, Math.floor(finiteNonNegative(record.clears, 1))),
    bestTime: bestTime > 0 ? bestTime : null,
    highestLevel: Math.max(1, Math.floor(finiteNonNegative(record.highestLevel, 1))),
    mostKills: Math.floor(finiteNonNegative(record.mostKills, 0)),
    lastClearedAt: typeof record.lastClearedAt === "string" ? record.lastClearedAt : null,
    lastRunId: typeof record.lastRunId === "string" ? record.lastRunId : null,
  };
}

function sanitizeRegionRecords(records) {
  if (!records || typeof records !== "object" || Array.isArray(records)) return {};
  const sanitized = {};
  for (const regionId of KNOWN_REGION_IDS) {
    const record = sanitizeRegionRecord(records[regionId]);
    if (record) sanitized[regionId] = record;
  }
  return sanitized;
}

function migrateLegacyProgression(slot, completedRegionIds) {
  if (slot?.progression) return sanitizeBaseProgression(slot.progression);
  let progression = createEmptyBaseProgression();
  for (const regionId of completedRegionIds) {
    progression = grantRegionVictoryRewards(progression, regionId, { firstClear: true }).progression;
  }
  return progression;
}

function sanitizeLastRegionRewards(value) {
  if (!value || typeof value !== "object" || !KNOWN_REGION_IDS.has(value.regionId)) return null;
  return {
    regionId: value.regionId,
    firstClear: Boolean(value.firstClear),
    researchData: Math.floor(finiteNonNegative(value.researchData, 0)),
    equipmentParts: Math.floor(finiteNonNegative(value.equipmentParts, 0)),
    grantedAt: typeof value.grantedAt === "string" ? value.grantedAt : null,
    runId: typeof value.runId === "string" ? value.runId : null,
  };
}

function deriveStoryFlags(completedRegionIds, inputFlags = []) {
  const flags = new Set(uniqueStrings(inputFlags));
  const completedChapters = getCompletedChapterIds(completedRegionIds);
  if (completedRegionIds.includes(DEFAULT_REGION_ID)) flags.add("home-base-unlocked");
  for (const chapterId of completedChapters) flags.add(`${chapterId}-cleared`);
  return [...flags];
}

function sanitizeSlot(slot, index, sourceVersion = CAMPAIGN_SAVE_VERSION) {
  if (!slot || typeof slot !== "object" || Array.isArray(slot)) return null;
  const completedRegionIds = uniqueKnown(slot.completedRegionIds, KNOWN_REGION_IDS);
  const completedChapterIds = getCompletedChapterIds(completedRegionIds).filter((id) => KNOWN_CHAPTER_IDS.has(id));
  const unlockedRegionIds = getUnlockedRegionIds(completedRegionIds);
  const currentChapterId = getCurrentChapterId(completedRegionIds);
  const progression = sourceVersion === 1
    ? migrateLegacyProgression(slot, completedRegionIds)
    : sanitizeBaseProgression(slot.progression);
  const fallbackDate = new Date(0).toISOString();
  // HAVEN-09 is the campaign's opening hub. Chapter 1 completion still owns
  // the regional unlock milestone, but a fresh slot must be able to brief,
  // research and board the airship before its first sortie.
  const homeBaseUnlocked = true;
  return {
    id: slotIdForIndex(index),
    createdAt: typeof slot.createdAt === "string" ? slot.createdAt : fallbackDate,
    updatedAt: typeof slot.updatedAt === "string" ? slot.updatedAt : fallbackDate,
    currentChapterId,
    completedChapterIds,
    completedRegionIds,
    unlockedRegionIds,
    homeBaseUnlocked,
    baseUnlocked: homeBaseUnlocked,
    abilityGuideSeen: Boolean(slot.abilityGuideSeen),
    combatOverlaySeen: Boolean(slot.combatOverlaySeen),
    loadout: {
      mainWeaponId: sanitizeMainWeaponId(slot.loadout?.mainWeaponId ?? slot.mainWeaponId),
    },
    storyFlags: deriveStoryFlags(completedRegionIds, slot.storyFlags),
    regionRecords: sanitizeRegionRecords(slot.regionRecords),
    progression,
    lastRegionRewards: sanitizeLastRegionRewards(slot.lastRegionRewards),
    lastRegionId: KNOWN_REGION_IDS.has(slot.lastRegionId) ? slot.lastRegionId : null,
    lastCheckpoint: "home-base",
  };
}

export function createEmptyCampaign() {
  return {
    version: CAMPAIGN_SAVE_VERSION,
    slots: Array.from({ length: CAMPAIGN_SAVE_SLOT_COUNT }, () => null),
  };
}

export function sanitizeCampaign(value) {
  if (!value || typeof value !== "object" || ![1, CAMPAIGN_SAVE_VERSION].includes(value.version) || !Array.isArray(value.slots)) {
    return createEmptyCampaign();
  }
  const sourceVersion = value.version;
  return {
    version: CAMPAIGN_SAVE_VERSION,
    slots: Array.from({ length: CAMPAIGN_SAVE_SLOT_COUNT }, (_, index) => sanitizeSlot(value.slots[index], index, sourceVersion)),
  };
}

export function loadCampaign(storage = resolveBrowserStorage()) {
  if (!storage || typeof storage.getItem !== "function") return createEmptyCampaign();
  try {
    const serialized = storage.getItem(CAMPAIGN_SAVE_KEY) ?? storage.getItem(LEGACY_CAMPAIGN_SAVE_KEY);
    if (!serialized) return createEmptyCampaign();
    return sanitizeCampaign(JSON.parse(serialized));
  } catch {
    return createEmptyCampaign();
  }
}

export function saveCampaign(campaign, storage = resolveBrowserStorage()) {
  if (!storage || typeof storage.setItem !== "function") return false;
  try {
    storage.setItem(CAMPAIGN_SAVE_KEY, JSON.stringify(sanitizeCampaign(campaign)));
    return true;
  } catch {
    return false;
  }
}

export function getCampaignSlot(campaign, slotId) {
  const index = normalizeSlotIndex(slotId);
  if (index < 0) return null;
  return sanitizeCampaign(campaign).slots[index];
}

export function createCampaignSlot(campaign, slotId, options = {}) {
  const index = normalizeSlotIndex(slotId);
  const sanitized = sanitizeCampaign(campaign);
  if (index < 0 || sanitized.slots[index]) return sanitized;
  const now = resolveNow(options.now);
  const slot = sanitizeSlot({
    id: slotIdForIndex(index),
    createdAt: now,
    updatedAt: now,
    completedRegionIds: [],
    storyFlags: [],
    regionRecords: {},
    progression: createEmptyBaseProgression(),
  }, index);
  const slots = sanitized.slots.slice();
  slots[index] = slot;
  return { version: CAMPAIGN_SAVE_VERSION, slots };
}

export function clearCampaignSlot(campaign, slotId) {
  const index = normalizeSlotIndex(slotId);
  const sanitized = sanitizeCampaign(campaign);
  if (index < 0 || !sanitized.slots[index]) return sanitized;
  const slots = sanitized.slots.slice();
  slots[index] = null;
  return { version: CAMPAIGN_SAVE_VERSION, slots };
}

export function completeAbilityGuide(campaign, slotId, options = {}) {
  const sanitized = sanitizeCampaign(campaign);
  const index = normalizeSlotIndex(slotId);
  const slot = index >= 0 ? sanitized.slots[index] : null;
  if (!slot) return sanitized;
  if (slot.abilityGuideSeen && slot.storyFlags.includes("ability-guide-complete")) return sanitized;

  const nextSlot = sanitizeSlot({
    ...slot,
    updatedAt: resolveNow(options.now),
    abilityGuideSeen: true,
    storyFlags: [...slot.storyFlags, "ability-guide-complete"],
  }, index);
  const slots = sanitized.slots.slice();
  slots[index] = nextSlot;
  return { version: CAMPAIGN_SAVE_VERSION, slots };
}

export function completeCombatOverlay(campaign, slotId, options = {}) {
  const sanitized = sanitizeCampaign(campaign);
  const index = normalizeSlotIndex(slotId);
  const slot = index >= 0 ? sanitized.slots[index] : null;
  if (!slot) return sanitized;
  if (slot.combatOverlaySeen && slot.storyFlags.includes("combat-overlay-complete")) return sanitized;

  const nextSlot = sanitizeSlot({
    ...slot,
    updatedAt: resolveNow(options.now),
    combatOverlaySeen: true,
    storyFlags: [...slot.storyFlags, "combat-overlay-complete"],
  }, index);
  const slots = sanitized.slots.slice();
  slots[index] = nextSlot;
  return { version: CAMPAIGN_SAVE_VERSION, slots };
}

export function setCampaignMainWeapon(campaign, slotId, mainWeaponId, options = {}) {
  const sanitized = sanitizeCampaign(campaign);
  const index = normalizeSlotIndex(slotId);
  const slot = index >= 0 ? sanitized.slots[index] : null;
  if (!slot) return sanitized;
  const nextWeaponId = sanitizeMainWeaponId(mainWeaponId);
  if ((slot.loadout?.mainWeaponId || DEFAULT_MAIN_WEAPON_ID) === nextWeaponId) return sanitized;
  const nextSlot = sanitizeSlot({
    ...slot,
    updatedAt: resolveNow(options.now),
    loadout: { ...slot.loadout, mainWeaponId: nextWeaponId },
  }, index);
  const slots = sanitized.slots.slice();
  slots[index] = nextSlot;
  return { version: CAMPAIGN_SAVE_VERSION, slots };
}

export function getCampaignMainWeapon(campaign, slotId) {
  return getCampaignSlot(campaign, slotId)?.loadout?.mainWeaponId || DEFAULT_MAIN_WEAPON_ID;
}

export function canLaunchRegion(slot, regionId) {
  if (!getRegion(regionId) || !slot) return false;
  const sanitized = sanitizeSlot(slot, Math.max(0, normalizeSlotIndex(slot.id)));
  return Boolean(sanitized?.unlockedRegionIds.includes(regionId));
}

function nextRegionRecord(previous, result, now) {
  const safe = sanitizeRegionRecord(previous) ?? {
    clears: 0,
    bestTime: null,
    highestLevel: 1,
    mostKills: 0,
    lastClearedAt: null,
    lastRunId: null,
  };
  const runId = typeof result?.runId === "string" ? result.runId : null;
  if (runId && safe.lastRunId === runId) return safe;
  const runTime = finiteNonNegative(result?.time, 0);
  return {
    clears: safe.clears + 1,
    bestTime: runTime > 0 && (!safe.bestTime || runTime < safe.bestTime) ? runTime : safe.bestTime,
    highestLevel: Math.max(safe.highestLevel, Math.floor(finiteNonNegative(result?.level, 1))),
    mostKills: Math.max(safe.mostKills, Math.floor(finiteNonNegative(result?.kills ?? result?.stats?.kills, 0))),
    lastClearedAt: now,
    lastRunId: runId,
  };
}

export function completeRegion(campaign, slotId, regionId, result = {}, options = {}) {
  if (!getRegion(regionId) || (result?.status && result.status !== "victory")) return sanitizeCampaign(campaign);
  const index = normalizeSlotIndex(slotId);
  if (index < 0) return sanitizeCampaign(campaign);

  let nextCampaign = createCampaignSlot(campaign, slotId, options);
  const slot = nextCampaign.slots[index];
  if (!canLaunchRegion(slot, regionId)) return nextCampaign;

  const now = resolveNow(options.now);
  const runId = typeof result?.runId === "string" ? result.runId : null;
  const previousRecord = slot.regionRecords[regionId];
  if (runId && previousRecord?.lastRunId === runId) return nextCampaign;
  const firstClear = !slot.completedRegionIds.includes(regionId);
  const rewardGrant = grantRegionVictoryRewards(slot.progression, regionId, { firstClear });
  const completedRegionIds = [...new Set([...slot.completedRegionIds, regionId])];
  const regionRecords = {
    ...slot.regionRecords,
    [regionId]: nextRegionRecord(slot.regionRecords[regionId], result, now),
  };
  const nextSlot = sanitizeSlot({
    ...slot,
    updatedAt: now,
    completedRegionIds,
    storyFlags: deriveStoryFlags(completedRegionIds, slot.storyFlags),
    regionRecords,
    progression: rewardGrant.progression,
    lastRegionRewards: {
      regionId,
      firstClear,
      researchData: rewardGrant.rewards.researchData,
      equipmentParts: rewardGrant.rewards.equipmentParts,
      grantedAt: now,
      runId,
    },
    lastRegionId: regionId,
    lastCheckpoint: "home-base",
  }, index);
  const slots = nextCampaign.slots.slice();
  slots[index] = nextSlot;
  nextCampaign = { version: CAMPAIGN_SAVE_VERSION, slots };
  return nextCampaign;
}

export const recordRegionVictory = completeRegion;

export function getCampaignProgression(campaign, slotId) {
  return getCampaignSlot(campaign, slotId)?.progression ?? createEmptyBaseProgression();
}

export function getCampaignUpgradeStatus(campaign, slotId, upgradeId) {
  const slot = getCampaignSlot(campaign, slotId);
  if (!slot) return {
    upgradeId,
    exists: false,
    purchasable: false,
    reason: "invalid-slot",
  };
  return getUpgradeStatus(slot.progression, slot, upgradeId);
}

export function purchaseCampaignUpgrade(campaign, slotId, upgradeId, options = {}) {
  const sanitized = sanitizeCampaign(campaign);
  const index = normalizeSlotIndex(slotId);
  const slot = index >= 0 ? sanitized.slots[index] : null;
  if (!slot) return {
    ok: false,
    reason: "invalid-slot",
    campaign: sanitized,
    slot: null,
  };
  const purchase = purchaseProgressionUpgrade(slot.progression, slot, upgradeId);
  if (!purchase.ok) return {
    ...purchase,
    campaign: sanitized,
    slot,
  };
  const now = resolveNow(options.now);
  const nextSlot = sanitizeSlot({
    ...slot,
    updatedAt: now,
    progression: purchase.progression,
  }, index);
  const slots = sanitized.slots.slice();
  slots[index] = nextSlot;
  const nextCampaign = { version: CAMPAIGN_SAVE_VERSION, slots };
  return {
    ...purchase,
    campaign: nextCampaign,
    slot: nextSlot,
  };
}

export const purchaseUpgrade = purchaseCampaignUpgrade;

export function getCampaignCombatBonuses(campaign, slotId) {
  return calculateCombatBonuses(getCampaignProgression(campaign, slotId));
}

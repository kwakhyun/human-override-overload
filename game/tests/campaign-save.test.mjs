import assert from "node:assert/strict";
import test from "node:test";

import {
  CAMPAIGN_SAVE_KEY,
  CAMPAIGN_SAVE_SLOT_COUNT,
  CAMPAIGN_SAVE_VERSION,
  canLaunchRegion,
  clearCampaignSlot,
  completeAbilityGuide,
  completeCombatOverlay,
  completeRegion,
  createCampaignSlot,
  createEmptyCampaign,
  getCampaignSlot,
  loadCampaign,
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

const NOW = "2026-08-10T06:00:00.000Z";

test("an empty campaign is versioned and always contains exactly three slots", () => {
  const campaign = createEmptyCampaign();
  assert.equal(campaign.version, CAMPAIGN_SAVE_VERSION);
  assert.equal(campaign.slots.length, CAMPAIGN_SAVE_SLOT_COUNT);
  assert.deepEqual(campaign.slots, [null, null, null]);

  const created = createCampaignSlot(campaign, "slot-1", { now: NOW });
  const slot = getCampaignSlot(created, "slot-1");
  assert.equal(slot.id, "slot-1");
  assert.equal(slot.currentChapterId, "chapter-01");
  assert.deepEqual(slot.unlockedRegionIds, ["wrong-engine-core"]);
  assert.equal(slot.homeBaseUnlocked, false);
  assert.equal(slot.abilityGuideSeen, false);
  assert.equal(slot.combatOverlaySeen, false);
  assert.equal(campaign.slots[0], null, "slot creation must not mutate the previous campaign");
});

test("the first-sortie ability guide persists per slot while legacy slots default to unseen", () => {
  const created = createCampaignSlot(createEmptyCampaign(), "slot-1", { now: NOW });
  const completed = completeAbilityGuide(created, "slot-1", { now: "2026-08-10T06:05:00.000Z" });
  const slot = getCampaignSlot(completed, "slot-1");
  assert.equal(slot.abilityGuideSeen, true);
  assert.equal(slot.combatOverlaySeen, false);
  assert.ok(slot.storyFlags.includes("ability-guide-complete"));
  assert.equal(slot.updatedAt, "2026-08-10T06:05:00.000Z");
  assert.equal(getCampaignSlot(completed, "slot-2"), null);

  const repeated = completeAbilityGuide(completed, "slot-1", { now: "2026-08-10T07:00:00.000Z" });
  assert.deepEqual(repeated, completed, "reopening the briefing must not rewrite an already completed record");

  const legacy = sanitizeCampaign({
    version: 1,
    slots: [{ completedRegionIds: ["wrong-engine-core"] }, null, null],
  });
  assert.equal(getCampaignSlot(legacy, "slot-1").abilityGuideSeen, false);
  assert.equal(getCampaignSlot(legacy, "slot-1").combatOverlaySeen, false);
});

test("the first live-combat interface overlay persists independently from the briefing", () => {
  const created = completeAbilityGuide(createCampaignSlot(createEmptyCampaign(), "slot-1", { now: NOW }), "slot-1", { now: NOW });
  const completed = completeCombatOverlay(created, "slot-1", { now: "2026-08-10T06:06:00.000Z" });
  const slot = getCampaignSlot(completed, "slot-1");
  assert.equal(slot.abilityGuideSeen, true);
  assert.equal(slot.combatOverlaySeen, true);
  assert.ok(slot.storyFlags.includes("combat-overlay-complete"));
  assert.equal(slot.updatedAt, "2026-08-10T06:06:00.000Z");

  const repeated = completeCombatOverlay(completed, "slot-1", { now: "2026-08-10T07:00:00.000Z" });
  assert.deepEqual(repeated, completed);
});

test("save and load round-trip while corrupt, missing, and future data recover safely", () => {
  const storage = new MemoryStorage();
  const campaign = createCampaignSlot(createEmptyCampaign(), "slot-2", { now: NOW });
  assert.equal(saveCampaign(campaign, storage), true);
  assert.deepEqual(loadCampaign(storage), campaign);

  storage.values.set(CAMPAIGN_SAVE_KEY, "{not-json");
  assert.deepEqual(loadCampaign(storage), createEmptyCampaign());
  storage.values.set(CAMPAIGN_SAVE_KEY, JSON.stringify({ version: 999, slots: [{ id: "slot-1" }] }));
  assert.deepEqual(loadCampaign(storage), createEmptyCampaign());
  assert.deepEqual(loadCampaign(null), createEmptyCampaign());
});

test("quota and storage access failures never escape into the game", () => {
  const throwingStorage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("quota exceeded");
    },
  };
  assert.deepEqual(loadCampaign(throwingStorage), createEmptyCampaign());
  assert.equal(saveCampaign(createEmptyCampaign(), throwingStorage), false);
  assert.equal(saveCampaign(createEmptyCampaign(), null), false);
});

test("a Chapter 1 victory unlocks HAVEN-09 and both selectable Chapter 2 regions", () => {
  const initial = createCampaignSlot(createEmptyCampaign(), "slot-1", { now: NOW });
  assert.equal(canLaunchRegion(getCampaignSlot(initial, "slot-1"), "glass-dune"), false);

  const completed = completeRegion(initial, "slot-1", "wrong-engine-core", {
    status: "victory",
    runId: "run-001",
    time: 142.5,
    level: 18,
    kills: 1000,
  }, { now: "2026-08-10T06:10:00.000Z" });
  const slot = getCampaignSlot(completed, "slot-1");
  assert.deepEqual(slot.completedRegionIds, ["wrong-engine-core"]);
  assert.deepEqual(slot.completedChapterIds, ["chapter-01"]);
  assert.deepEqual(slot.unlockedRegionIds, ["wrong-engine-core", "glass-dune", "abyssal-archive"]);
  assert.equal(slot.currentChapterId, "chapter-02");
  assert.equal(slot.homeBaseUnlocked, true);
  assert.equal(slot.baseUnlocked, true);
  assert.equal(slot.lastCheckpoint, "home-base");
  assert.ok(slot.storyFlags.includes("home-base-unlocked"));
  assert.ok(slot.storyFlags.includes("chapter-01-cleared"));
  assert.deepEqual(slot.regionRecords["wrong-engine-core"], {
    clears: 1,
    bestTime: 142.5,
    highestLevel: 18,
    mostKills: 1000,
    lastClearedAt: "2026-08-10T06:10:00.000Z",
    lastRunId: "run-001",
  });
});

test("locked regions and defeats do not advance progress", () => {
  const initial = createCampaignSlot(createEmptyCampaign(), "slot-1", { now: NOW });
  const lockedAttempt = completeRegion(initial, "slot-1", "glass-dune", { status: "victory" }, { now: NOW });
  assert.deepEqual(getCampaignSlot(lockedAttempt, "slot-1").completedRegionIds, []);

  const defeat = completeRegion(initial, "slot-1", "wrong-engine-core", { status: "defeat" }, { now: NOW });
  assert.deepEqual(getCampaignSlot(defeat, "slot-1").completedRegionIds, []);
  const unknown = completeRegion(initial, "slot-1", "not-a-region", { status: "victory" }, { now: NOW });
  assert.deepEqual(getCampaignSlot(unknown, "slot-1").completedRegionIds, []);
});

test("slots remain isolated and completing both routes closes Chapter 2", () => {
  let campaign = completeRegion(createEmptyCampaign(), "slot-1", "wrong-engine-core", { status: "victory" }, { now: NOW });
  campaign = completeRegion(campaign, "slot-1", "glass-dune", { status: "victory" }, { now: NOW });
  campaign = completeRegion(campaign, "slot-1", "abyssal-archive", { status: "victory" }, { now: NOW });
  const first = getCampaignSlot(campaign, "slot-1");
  assert.deepEqual(first.completedChapterIds, ["chapter-01", "chapter-02"]);
  assert.ok(first.storyFlags.includes("chapter-02-cleared"));
  assert.equal(getCampaignSlot(campaign, "slot-2"), null);

  const secondCreated = createCampaignSlot(campaign, "slot-2", { now: NOW });
  assert.deepEqual(getCampaignSlot(secondCreated, "slot-2").completedRegionIds, []);
  assert.deepEqual(getCampaignSlot(secondCreated, "slot-1").completedRegionIds, first.completedRegionIds);
});

test("duplicate run IDs are idempotent and sanitization rejects forged unlocks", () => {
  let campaign = completeRegion(createEmptyCampaign(), "slot-1", "wrong-engine-core", {
    status: "victory",
    runId: "same-run",
    time: 180,
  }, { now: NOW });
  campaign = completeRegion(campaign, "slot-1", "wrong-engine-core", {
    status: "victory",
    runId: "same-run",
    time: 10,
  }, { now: "2026-08-10T07:00:00.000Z" });
  assert.equal(getCampaignSlot(campaign, "slot-1").regionRecords["wrong-engine-core"].clears, 1);
  assert.equal(getCampaignSlot(campaign, "slot-1").regionRecords["wrong-engine-core"].bestTime, 180);

  const forged = sanitizeCampaign({
    version: CAMPAIGN_SAVE_VERSION,
    slots: [{
      completedRegionIds: ["unknown"],
      unlockedRegionIds: ["glass-dune", "unknown"],
      completedChapterIds: ["chapter-02"],
    }],
  });
  assert.deepEqual(getCampaignSlot(forged, "slot-1").completedRegionIds, []);
  assert.deepEqual(getCampaignSlot(forged, "slot-1").unlockedRegionIds, ["wrong-engine-core"]);

  assert.equal(getCampaignSlot(clearCampaignSlot(campaign, "slot-1"), "slot-1"), null);
});

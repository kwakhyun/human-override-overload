import assert from "node:assert/strict";
import test from "node:test";

import {
  CAMPAIGN_SAVE_KEY,
  CAMPAIGN_SAVE_SLOT_COUNT,
  CAMPAIGN_SAVE_VERSION,
  canLaunchRegion,
  clearCampaignSlot,
  consumeCampaignPostVictoryStep,
  completeAbilityGuide,
  completeCombatOverlay,
  completeDefenseGuide,
  completeOuterSectorBriefing,
  completeRegion,
  completeSwordAbilityGuide,
  createCampaignSlot,
  createEmptyCampaign,
  getCampaignSlot,
  getCampaignPostVictorySteps,
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
  assert.equal(slot.homeBaseUnlocked, true);
  assert.equal(slot.lastCheckpoint, "home-base");
  assert.equal(slot.abilityGuideSeen, false);
  assert.equal(slot.combatOverlaySeen, false);
  assert.equal(slot.defenseGuideSeen, false);
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

test("the first defense spotlight guide persists independently per save slot", () => {
  const created = createCampaignSlot(createEmptyCampaign(), "slot-1", { now: NOW });
  const completed = completeDefenseGuide(created, "slot-1", { now: "2026-08-10T06:07:00.000Z" });
  const slot = getCampaignSlot(completed, "slot-1");
  assert.equal(slot.defenseGuideSeen, true);
  assert.equal(slot.combatOverlaySeen, false);
  assert.ok(slot.storyFlags.includes("defense-guide-complete"));
  assert.equal(slot.updatedAt, "2026-08-10T06:07:00.000Z");

  const repeated = completeDefenseGuide(completed, "slot-1", { now: "2026-08-10T07:00:00.000Z" });
  assert.deepEqual(repeated, completed);
  const legacy = sanitizeCampaign({ version: 1, slots: [{ completedRegionIds: [] }, null, null] });
  assert.equal(getCampaignSlot(legacy, "slot-1").defenseGuideSeen, false);
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

test("first-victory follow-up scenes survive reload and consume without duplicating rewards", () => {
  const storage = new MemoryStorage();
  const initial = createCampaignSlot(createEmptyCampaign(), "slot-1", { now: NOW });
  const victory = completeRegion(initial, "slot-1", "wrong-engine-core", {
    status: "victory",
    runId: "reload-run-001",
    time: 135,
    level: 17,
    kills: 1000,
  }, { now: "2026-08-10T06:20:00.000Z" });
  const awardedProgression = getCampaignSlot(victory, "slot-1").progression;

  assert.deepEqual(getCampaignPostVictorySteps(victory, "slot-1"), ["recruit", "return"]);
  assert.equal(saveCampaign(victory, storage), true);
  const reloaded = loadCampaign(storage);
  assert.deepEqual(getCampaignPostVictorySteps(reloaded, "slot-1"), ["recruit", "return"]);
  assert.deepEqual(getCampaignSlot(reloaded, "slot-1").progression, awardedProgression);

  const recruited = consumeCampaignPostVictoryStep(reloaded, "slot-1", "recruit", { now: "2026-08-10T06:21:00.000Z" });
  assert.deepEqual(getCampaignPostVictorySteps(recruited, "slot-1"), ["return"]);
  assert.ok(getCampaignSlot(recruited, "slot-1").storyFlags.includes("mika-recruit-seen"));
  assert.deepEqual(getCampaignSlot(recruited, "slot-1").progression, awardedProgression);

  const returned = consumeCampaignPostVictoryStep(recruited, "slot-1", "return", { now: "2026-08-10T06:22:00.000Z" });
  assert.deepEqual(getCampaignPostVictorySteps(returned, "slot-1"), []);
  const duplicateFinish = completeRegion(returned, "slot-1", "wrong-engine-core", {
    status: "victory",
    runId: "reload-run-001",
    time: 135,
    level: 17,
    kills: 1000,
  }, { now: "2026-08-10T06:23:00.000Z" });
  assert.deepEqual(duplicateFinish, returned, "replaying the terminal callback must not restore steps or grant rewards twice");
});

test("the beam-sword guide can only be completed after the Glass Dune clear", () => {
  const initial = createCampaignSlot(createEmptyCampaign(), "slot-1", { now: NOW });
  assert.deepEqual(completeSwordAbilityGuide(initial, "slot-1", { now: NOW }), initial);

  let campaign = completeRegion(initial, "slot-1", "wrong-engine-core", { status: "victory" }, { now: NOW });
  campaign = completeRegion(campaign, "slot-1", "glass-dune", { status: "victory" }, { now: NOW });
  assert.deepEqual(getCampaignPostVictorySteps(campaign, "slot-1"), ["sword-guide", "return"]);
  const completed = completeSwordAbilityGuide(campaign, "slot-1", { now: "2026-08-10T07:30:00.000Z" });
  const slot = getCampaignSlot(completed, "slot-1");
  assert.ok(slot.storyFlags.includes("beam-sword-unlocked"));
  assert.ok(slot.storyFlags.includes("beam-sword-guide-complete"));
  assert.deepEqual(getCampaignPostVictorySteps(completed, "slot-1"), ["return"]);
  assert.equal(slot.updatedAt, "2026-08-10T07:30:00.000Z");
  assert.deepEqual(completeSwordAbilityGuide(completed, "slot-1", { now: "2026-08-10T08:00:00.000Z" }), completed);
});

test("the first Abyssal Archive clear queues the one-time Vesper recruitment scene", () => {
  let campaign = createCampaignSlot(createEmptyCampaign(), "slot-1", { now: NOW });
  campaign = completeRegion(campaign, "slot-1", "wrong-engine-core", { status: "victory" }, { now: NOW });
  campaign = consumeCampaignPostVictoryStep(campaign, "slot-1", "recruit", { now: NOW });
  campaign = consumeCampaignPostVictoryStep(campaign, "slot-1", "return", { now: NOW });
  campaign = completeRegion(campaign, "slot-1", "glass-dune", { status: "victory" }, { now: NOW });
  campaign = completeSwordAbilityGuide(campaign, "slot-1", { now: NOW });
  campaign = consumeCampaignPostVictoryStep(campaign, "slot-1", "return", { now: NOW });
  campaign = completeRegion(campaign, "slot-1", "abyssal-archive", { status: "victory" }, { now: NOW });

  assert.deepEqual(getCampaignPostVictorySteps(campaign, "slot-1"), ["vesper-recruit", "return"]);
  assert.ok(getCampaignSlot(campaign, "slot-1").storyFlags.includes("vesper-unlocked"));

  campaign = consumeCampaignPostVictoryStep(campaign, "slot-1", "vesper-recruit", { now: NOW });
  assert.ok(getCampaignSlot(campaign, "slot-1").storyFlags.includes("vesper-recruit-seen"));
  assert.deepEqual(getCampaignPostVictorySteps(campaign, "slot-1"), ["return"]);
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

test("clearing sectors 1—3 automatically unlocks sorties 4—6 before optional briefing", () => {
  let campaign = completeRegion(createEmptyCampaign(), "slot-1", "wrong-engine-core", { status: "victory" }, { now: NOW });
  campaign = completeRegion(campaign, "slot-1", "glass-dune", { status: "victory" }, { now: NOW });
  campaign = completeRegion(campaign, "slot-1", "abyssal-archive", { status: "victory" }, { now: NOW });
  let slot = getCampaignSlot(campaign, "slot-1");

  assert.ok(slot.unlockedRegionIds.includes("neon-foundry"));
  assert.equal(canLaunchRegion(slot, "neon-foundry"), true);
  assert.equal(canLaunchRegion(slot, "storm-spire"), true);
  assert.equal(canLaunchRegion(slot, "gene-vault"), true);
  assert.equal(slot.storyFlags.includes("outer-sector-briefed"), false);

  campaign = completeOuterSectorBriefing(campaign, "slot-1", { now: "2026-08-10T08:00:00.000Z" });
  slot = getCampaignSlot(campaign, "slot-1");
  assert.ok(slot.storyFlags.includes("outer-sector-briefed"));
  assert.equal(canLaunchRegion(slot, "neon-foundry"), true);
  assert.equal(canLaunchRegion(slot, "storm-spire"), true);
  assert.equal(canLaunchRegion(slot, "gene-vault"), true);

  const beforeMilestone = createCampaignSlot(createEmptyCampaign(), "slot-2", { now: NOW });
  assert.deepEqual(completeOuterSectorBriefing(beforeMilestone, "slot-2", { now: NOW }), beforeMilestone);
});

test("legacy clear-only slots unlock outer sorties without briefing but incomplete slots stay locked", () => {
  const base = getCampaignSlot(createCampaignSlot(createEmptyCampaign(), "slot-1", { now: NOW }), "slot-1");
  const ids = ["wrong-engine-core", "glass-dune", "abyssal-archive"];
  const legacy = { ...base, completedRegionIds: ids, unlockedRegionIds: ["wrong-engine-core"], storyFlags: [] };
  for (const regionId of ["neon-foundry", "storm-spire", "gene-vault"]) {
    assert.equal(canLaunchRegion(legacy, regionId), true);
    for (const missing of ids) assert.equal(canLaunchRegion({ ...legacy,
      completedRegionIds: ids.filter(id => id !== missing),
      unlockedRegionIds: [regionId], storyFlags: ["outer-sector-briefed"],
    }, regionId), false, `Missing ${missing} must still block ${regionId}`);
  }
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

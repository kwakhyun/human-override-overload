import assert from "node:assert/strict";
import test from "node:test";
import { mergeCampaignDocuments } from "../src/game/save/cloudCampaignSync.js";

function campaignWithSlots(firstUpdatedAt, secondUpdatedAt) {
  return {
    version: 2,
    slots: [
      firstUpdatedAt ? { updatedAt: firstUpdatedAt, completedRegionIds: [] } : null,
      secondUpdatedAt ? { updatedAt: secondUpdatedAt, completedRegionIds: [] } : null,
      null,
    ],
  };
}

test("cloud campaign merge keeps the newest version of each independent save slot", () => {
  const local = campaignWithSlots("2026-08-29T02:00:00.000Z", "2026-08-29T01:00:00.000Z");
  const remote = campaignWithSlots("2026-08-29T01:00:00.000Z", "2026-08-29T03:00:00.000Z");
  const merged = mergeCampaignDocuments(local, remote);

  assert.equal(merged.slots[0].updatedAt, "2026-08-29T02:00:00.000Z");
  assert.equal(merged.slots[1].updatedAt, "2026-08-29T03:00:00.000Z");
});

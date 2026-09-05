import assert from "node:assert/strict";
import test from "node:test";
import { getCampaignDirective } from "../src/game/progression/campaignDirective.js";
import { getCampaignRegions, OUTER_SECTOR_BRIEFING_FLAG } from "../src/game/content/campaign.js";
import { createCampaignSlot, createEmptyCampaign, getCampaignSlot } from "../src/game/save/campaignSave.js";

const regionIds = getCampaignRegions().map((region) => region.id);
test("new profile points to its first launchable mission", () => {
  const campaign = createCampaignSlot(createEmptyCampaign(), 0);
  const directive = getCampaignDirective(getCampaignSlot(campaign, 0));
  assert.equal(directive.regionId, regionIds[0]);
  assert.equal(directive.cleared, 0);
});
test("guidance skips cleared and locked regions", () => {
  const directive = getCampaignDirective({ completedRegionIds: [regionIds[0]], unlockedRegionIds: [regionIds[0], regionIds[2]] });
  assert.equal(directive.regionId, regionIds[2]);
});
test("inner-network completion directs to the outer region without requiring dialogue", () => {
  const slot = { completedRegionIds: regionIds.slice(0, 3), unlockedRegionIds: regionIds, storyFlags: [] };
  assert.equal(getCampaignDirective(slot).target, "regions");
  assert.equal(getCampaignDirective(slot).regionId, regionIds[3]);
  slot.storyFlags = [OUTER_SECTOR_BRIEFING_FLAG];
  assert.equal(getCampaignDirective(slot).regionId, regionIds[3]);
});
test("complete and malformed profiles never show a nonexistent seventh operation", () => {
  const directive = getCampaignDirective({ completedRegionIds: [...regionIds, regionIds[0], "unknown"] });
  assert.equal(directive.cleared, 6);
  assert.equal(directive.title, "모든 권역 해방 완료");
  assert.equal(getCampaignDirective(null).regionId, null);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { STORY_ART, STORY_EPISODES, availableStoryEpisodes } from '../src/game/content/storyEpisodes.js';
import { createEmptyCampaign, createCampaignSlot, getCampaignSlot, sanitizeCampaign, completeRegion, consumeCampaignPostVictoryStep, getCampaignPostVictorySteps } from '../src/game/save/campaignSave.js';

const now = {now:'2026-09-09T05:00:00Z'};
test('new slots open prologue once; migration never injects a new interruption',()=>{
  let campaign = createCampaignSlot(createEmptyCampaign(),'slot-1',now);
  assert.deepEqual(getCampaignPostVictorySteps(campaign,'slot-1'),['prologue']);
  const old = structuredClone(campaign);delete old.slots[0].pendingPostVictorySteps;
  assert.deepEqual(getCampaignPostVictorySteps(sanitizeCampaign(old),'slot-1'),[]);
  campaign = consumeCampaignPostVictoryStep(campaign,'slot-1','prologue',now);
  assert.ok(getCampaignSlot(campaign,'slot-1').storyFlags.includes('story-prologue-seen'));
  assert.deepEqual(getCampaignPostVictorySteps(campaign,'slot-1'),[]);
  assert.deepEqual(consumeCampaignPostVictoryStep(campaign,'slot-1','prologue',now),campaign);
});
test('story checkpoints survive serialization; out-of-order completion cannot grant or consume anything',()=>{
  let campaign = completeRegion(createEmptyCampaign(),'slot-1','wrong-engine-core',{status:'victory',runId:'story-first'},now);
  const granted = structuredClone(campaign.slots[0].progression);
  assert.deepEqual(consumeCampaignPostVictoryStep(campaign,'slot-1','recruit',now),campaign);
  campaign = sanitizeCampaign(JSON.parse(JSON.stringify(campaign)));
  campaign = consumeCampaignPostVictoryStep(campaign,'slot-1','core-fragment',now);
  assert.deepEqual(getCampaignPostVictorySteps(campaign,'slot-1'),['recruit','return']);
  campaign = consumeCampaignPostVictoryStep(campaign,'slot-1','recruit',now);
  assert.deepEqual(campaign.slots[0].progression,granted);
  assert.deepEqual(campaign.slots[0].regionRecords['wrong-engine-core'].clears,1);
});
test('pending stories survive a later victory and outer scene never grants the optional briefing flag',()=>{
  let campaign = createEmptyCampaign();
  for(const id of ['wrong-engine-core','glass-dune','abyssal-archive']) campaign=completeRegion(campaign,'slot-1',id,{status:'victory',runId:id},now);
  const pending=getCampaignPostVictorySteps(campaign,'slot-1');
  assert.ok(pending.includes('core-fragment'));assert.ok(pending.includes('recruit'));assert.ok(pending.includes('outer-signal'));
  for(const step of pending)campaign=consumeCampaignPostVictoryStep(campaign,'slot-1',step,now);
  assert.ok(!campaign.slots[0].storyFlags.includes('outer-sector-briefed'));
  campaign=completeRegion(campaign,'slot-1','abyssal-archive',{status:'victory',runId:'repeat'},now);
  assert.deepEqual(getCampaignPostVictorySteps(campaign,'slot-1'),['return']);
});
test('archive only exposes earned chapters and querying it never mutates progression',()=>{
  const ids=['wrong-engine-core'];const copy=structuredClone(ids);
  assert.deepEqual(availableStoryEpisodes(ids).map(([id])=>id),['prologue','core-fragment','recruit']);
  assert.deepEqual(ids,copy);
  assert.deepEqual(availableStoryEpisodes([]).map(([id])=>id),['prologue']);
  const used=new Set(Object.values(STORY_EPISODES).flatMap(e=>e.lines.map(l=>l.art)));
  assert.deepEqual([...used].sort(),Object.keys(STORY_ART).sort());
});
test('all new portraits preserve actual RGBA masters and owned optimized WebP outputs',async()=>{
  const root=new URL('../',import.meta.url);
  const manifest=JSON.parse(await readFile(new URL('docs/art/anime-2026-09-09.json',root),'utf8'));
  assert.equal(manifest.portraits.length,8);
  for(const portrait of manifest.portraits){
    const [png,source,webp]=await Promise.all([portrait.transparentPng,portrait.source,portrait.runtime].map(p=>readFile(new URL(p,root))));
    assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],[960,1280]);
    assert.equal(png[25],6,'PNG must contain real RGBA, not a painted grid');
    assert.ok(portrait.transparentPixels>100_000);
    assert.equal(createHash('sha256').update(source).digest('hex'),portrait.sourceSha256);
    assert.equal(webp.subarray(8,12).toString(),'WEBP');
    assert.ok(webp.length<400_000);
  }
});

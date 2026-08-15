import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDefenseTower,
  createDefenseState,
  drainDefenseEvents,
  getDefenseHud,
  selectDefenseNode,
  startDefenseWave,
  stepDefense,
  upgradeDefenseTower,
} from "../src/defense/engine.js";
import { DEFENSE_STAGES, DEFENSE_TOWER_DEFINITIONS, getUnlockedDefenseStageIds } from "../src/defense/content.js";
import {
  canLaunchDefenseStage,
  completeDefenseStage,
  createCampaignSlot,
  createEmptyCampaign,
  getCampaignSlot,
} from "../src/game/save/campaignSave.js";

function stepFor(state, seconds) {
  for (let elapsed = 0; elapsed < seconds; elapsed += 1 / 60) stepDefense(state, 1 / 60);
}

test("defense content provides four distinct systems and three escalating stages", () => {
  assert.deepEqual(Object.keys(DEFENSE_TOWER_DEFINITIONS), ["pulseSentry", "arcRelay", "skyfireBattery", "aegisBastion"]);
  assert.equal(DEFENSE_STAGES.length, 3);
  for (const stage of DEFENSE_STAGES) {
    assert.ok(stage.waveCounts.every((count, index) => index === 0 || count > stage.waveCounts[index - 1]));
  }
  assert.deepEqual(getUnlockedDefenseStageIds([]), ["haven-perimeter"]);
  assert.deepEqual(getUnlockedDefenseStageIds(["haven-perimeter"]), ["haven-perimeter", "relay-blackout"]);
});

test("defense placement spends run credits, rejects overlap, and upgrades to rank three", () => {
  const state = createDefenseState({ stageId: "haven-perimeter" });
  assert.equal(state.nodes.length, 12);
  assert.equal(selectDefenseNode(state, "node-01"), true);
  assert.equal(buildDefenseTower(state, "pulseSentry"), true);
  assert.equal(state.credits, state.stage.startingCredits - DEFENSE_TOWER_DEFINITIONS.pulseSentry.cost);
  assert.equal(buildDefenseTower(state, "arcRelay"), false, "an occupied defense pad cannot stack another system");
  state.credits = 999;
  assert.equal(upgradeDefenseTower(state), true);
  assert.equal(upgradeDefenseTower(state), true);
  assert.equal(upgradeDefenseTower(state), false);
  assert.equal(state.towers[0].rank, 3);
});

test("later defense waves schedule more and stronger roles while towers fight deterministically", () => {
  const state = createDefenseState({ stageId: "relay-blackout" });
  state.credits = 99999;
  const towerTypes = Object.keys(DEFENSE_TOWER_DEFINITIONS);
  state.nodes.forEach((node, index) => {
    selectDefenseNode(state, node.id);
    assert.equal(buildDefenseTower(state, towerTypes[index % towerTypes.length]), true);
    upgradeDefenseTower(state);
    upgradeDefenseTower(state);
  });
  assert.equal(startDefenseWave(state), true);
  const firstCount = state.pendingSpawns.length;
  assert.equal(firstCount, state.stage.waveCounts[0]);
  stepFor(state, 20);
  assert.ok(state.kills > 0);
  assert.ok(state.baseHp > 0);
  const events = drainDefenseEvents(state);
  assert.ok(events.some((event) => event.type === "defenseEnemyDestroyed"));
  const hud = getDefenseHud(state);
  assert.equal(hud.mode, "defense");
  assert.equal(hud.totalWaves, 8);

  const late = createDefenseState({ stageId: "relay-blackout" });
  late.waveIndex = late.stage.waveCounts.length - 1;
  assert.equal(startDefenseWave(late), true);
  assert.ok(late.pendingSpawns.length > firstCount);
  assert.ok(late.pendingSpawns.some((spawn) => spawn.role === "sniper"));
});

test("defense presentation effects expose stable ids without changing combat authority", () => {
  const state = createDefenseState({ stageId: "haven-perimeter" });
  state.credits = 999;
  selectDefenseNode(state, "node-03");
  assert.equal(buildDefenseTower(state, "skyfireBattery"), true);
  assert.equal(startDefenseWave(state), true);
  let observed = false;
  for (let frame = 0; frame < 900 && !observed; frame += 1) {
    stepDefense(state, 1 / 60);
    if (!state.effects.length) continue;
    observed = true;
    assert.ok(state.effects.every((effect) => /^defense-effect-\d+$/.test(effect.id)));
    assert.equal(new Set(state.effects.map((effect) => effect.id)).size, state.effects.length);
  }
  assert.equal(observed, true);
});

test("defense victories grant first and repeat rewards and unlock stages sequentially", () => {
  let campaign = createCampaignSlot(createEmptyCampaign(), "slot-1", { now: "2026-08-15T00:00:00.000Z" });
  let slot = getCampaignSlot(campaign, "slot-1");
  assert.equal(canLaunchDefenseStage(slot, "haven-perimeter"), true);
  assert.equal(canLaunchDefenseStage(slot, "relay-blackout"), false);

  const forged = completeDefenseStage(campaign, "slot-1", "haven-perimeter", { runId: "missing-victory-status" });
  assert.equal(getCampaignSlot(forged, "slot-1").completedDefenseStageIds.length, 0);

  campaign = completeDefenseStage(campaign, "slot-1", "haven-perimeter", { status: "victory", runId: "defense-1", waves: 6, kills: 100, time: 90 }, { now: "2026-08-15T00:02:00.000Z" });
  slot = getCampaignSlot(campaign, "slot-1");
  assert.deepEqual(slot.completedDefenseStageIds, ["haven-perimeter"]);
  assert.equal(slot.progression.researchData, 8);
  assert.equal(slot.progression.equipmentParts, 10);
  assert.equal(slot.progression.augmentationCores, 1);
  assert.equal(canLaunchDefenseStage(slot, "relay-blackout"), true);
  assert.equal(canLaunchDefenseStage(slot, "sovereign-night-siege"), false);

  const duplicate = completeDefenseStage(campaign, "slot-1", "haven-perimeter", { status: "victory", runId: "defense-1", waves: 6, kills: 100, time: 90 });
  assert.deepEqual(getCampaignSlot(duplicate, "slot-1").progression, slot.progression, "a repeated run id cannot duplicate currency");

  campaign = completeDefenseStage(campaign, "slot-1", "haven-perimeter", { status: "victory", runId: "defense-2", waves: 6, kills: 110, time: 84 });
  slot = getCampaignSlot(campaign, "slot-1");
  assert.equal(slot.progression.researchData, 12);
  assert.equal(slot.defenseStageRecords["haven-perimeter"].clears, 2);
});

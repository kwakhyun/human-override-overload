import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  BEAM_SWORD_UNLOCK_REGION_ID,
  getMainWeapons,
  isMainWeaponUnlocked,
} from "../src/game/content/weapons.js";
import { calculateCombatBonuses, sanitizeBaseProgression } from "../src/game/progression/baseProgression.js";
import {
  createCampaignSlot,
  createEmptyCampaign,
  completeRegion,
  getCampaignMainWeapon,
  sanitizeCampaign,
  setCampaignMainWeapon,
} from "../src/game/save/campaignSave.js";

test("beam sword stays locked until the Glass Dune boss is cleared", () => {
  const weapons = getMainWeapons();
  assert.deepEqual(weapons.map((weapon) => weapon.id), ["pulse-rifle", "beam-sword"]);
  assert.equal(BEAM_SWORD_UNLOCK_REGION_ID, "glass-dune");
  assert.equal(isMainWeaponUnlocked("beam-sword", []), false);
  const fresh = createCampaignSlot(createEmptyCampaign(), "slot-1");
  assert.equal(getCampaignMainWeapon(fresh, "slot-1"), "pulse-rifle");
  const rejected = setCampaignMainWeapon(fresh, "slot-1", "beam-sword", { now: 0 });
  assert.equal(getCampaignMainWeapon(rejected, "slot-1"), "pulse-rifle");

  let cleared = completeRegion(fresh, "slot-1", "wrong-engine-core", { status: "victory" });
  cleared = completeRegion(cleared, "slot-1", "glass-dune", { status: "victory" });
  assert.equal(isMainWeaponUnlocked("beam-sword", cleared.slots[0].completedRegionIds), true);
  const sword = setCampaignMainWeapon(cleared, "slot-1", "beam-sword", { now: 0 });
  assert.equal(getCampaignMainWeapon(sword, "slot-1"), "beam-sword");
  const corrupted = sanitizeCampaign({ ...sword, slots: [{ ...sword.slots[0], loadout: { mainWeaponId: "debug-cannon" } }, null, null] });
  assert.equal(getCampaignMainWeapon(corrupted, "slot-1"), "pulse-rifle");

  const forgedSword = sanitizeCampaign({
    version: sword.version,
    slots: [{ ...fresh.slots[0], loadout: { mainWeaponId: "beam-sword" } }, null, null],
  });
  assert.equal(getCampaignMainWeapon(forgedSword, "slot-1"), "pulse-rifle");
});

test("ILYA weapon upgrades calculate independent rifle and sword bonuses", () => {
  const progression = sanitizeBaseProgression({
    equipmentRanks: {
      "ilya-rifle-emitter": 2,
      "ilya-sword-resonator": 3,
    },
  });
  const bonuses = calculateCombatBonuses(progression);
  assert.equal(bonuses.rifleDamageMultiplier, 1.18);
  assert.equal(bonuses.swordDamageMultiplier, 1.36);
});

test("character management owns weapon selection and region confirmation stays concise", async () => {
  const campaignScreens = await readFile(new URL("../src/ui/campaign/CampaignScreens.jsx", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(campaignScreens, /className="character-weapon-management"/);
  assert.match(campaignScreens, /출격 전 이 화면에서 장비와 증강 트리를 확정합니다/);
  assert.match(campaignScreens, /onWeaponChange\?\.\(weapon\.id\)/);
  assert.match(campaignScreens, /유리 사구 최초 클리어 필요/);
  assert.doesNotMatch(campaignScreens, /className="sortie-equipment-summary"/);
  assert.doesNotMatch(campaignScreens, /className="sortie-weapon-loadout"/);
  assert.match(campaignScreens, /guideType === "sword" \? SWORD_ABILITY_GUIDE/);
  assert.match(app, /setCampaignMainWeapon\(campaign, activeSlotId, mainWeaponId\)/);
  assert.match(app, /mainWeaponId=\{activeMainWeaponId\}/);
  assert.match(app, /nextStep === "sword-guide"[\s\S]*setScreen\("sword-guide"\)/);
  assert.match(app, /consumePostVictoryScene\("sword-guide"\)/);
});

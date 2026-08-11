import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { getMainWeapons } from "../src/game/content/weapons.js";
import { calculateCombatBonuses, sanitizeBaseProgression } from "../src/game/progression/baseProgression.js";
import {
  createCampaignSlot,
  createEmptyCampaign,
  getCampaignMainWeapon,
  sanitizeCampaign,
  setCampaignMainWeapon,
} from "../src/game/save/campaignSave.js";

test("campaign slots persist a safe rifle or beam-sword sortie loadout", () => {
  const weapons = getMainWeapons();
  assert.deepEqual(weapons.map((weapon) => weapon.id), ["pulse-rifle", "beam-sword"]);
  const fresh = createCampaignSlot(createEmptyCampaign(), "slot-1");
  assert.equal(getCampaignMainWeapon(fresh, "slot-1"), "pulse-rifle");
  const sword = setCampaignMainWeapon(fresh, "slot-1", "beam-sword", { now: 0 });
  assert.equal(getCampaignMainWeapon(sword, "slot-1"), "beam-sword");
  const corrupted = sanitizeCampaign({ ...sword, slots: [{ ...sword.slots[0], loadout: { mainWeaponId: "debug-cannon" } }, null, null] });
  assert.equal(getCampaignMainWeapon(corrupted, "slot-1"), "pulse-rifle");
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

test("region confirmation exposes two main-weapon cards before launch", async () => {
  const campaignScreens = await readFile(new URL("../src/ui/campaign/CampaignScreens.jsx", import.meta.url), "utf8");
  const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
  assert.match(campaignScreens, /className="sortie-weapon-loadout"/);
  assert.match(campaignScreens, /무기에 따라 레벨업 증강 트리가 변경됩니다/);
  assert.match(campaignScreens, /onWeaponChange\?\.\(weapon\.id\)/);
  assert.match(app, /setCampaignMainWeapon\(campaign, activeSlotId, mainWeaponId\)/);
  assert.match(app, /mainWeaponId=\{activeMainWeaponId\}/);
});

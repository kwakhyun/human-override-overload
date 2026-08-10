import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

import {
  BASE_NPCS,
  CAMPAIGN_CHAPTERS,
  CAMPAIGN_REGIONS,
  DEFAULT_REGION_ID,
  HOME_BASE,
  getBaseNpc,
  getBaseNpcs,
  getCampaignDomAssets,
  getCampaignRegions,
  getCompletedChapterIds,
  getCurrentChapterId,
  getRegion,
  getUnlockedRegionIds,
  isRegionUnlocked,
} from "../src/game/content/campaign.js";

test("campaign content defines the current stage and two coherent follow-up regions", () => {
  assert.equal(DEFAULT_REGION_ID, "wrong-engine-core");
  assert.deepEqual(getCampaignRegions().map((region) => region.id), [
    "wrong-engine-core",
    "glass-dune",
    "abyssal-archive",
  ]);
  assert.equal(Object.keys(CAMPAIGN_REGIONS).length, 3);
  assert.equal(getRegion("wrong-engine-core").boss.name, "THE WRONG ENGINE");
  assert.equal(getRegion("wrong-engine-core").boss.maxHp, 840000);
  assert.equal(getRegion("wrong-engine-core").enemyBudget, 1000);
  assert.equal(getRegion("glass-dune").boss.name, "MIRROR TYRANT");
  assert.equal(getRegion("glass-dune").boss.maxHp, 960000);
  assert.equal(getRegion("abyssal-archive").boss.name, "DROWNED ORACLE");
  assert.equal(getRegion("abyssal-archive").boss.maxHp, 1120000);
  assert.ok(getRegion("glass-dune").boss.patterns.includes("prismLattice"));
  assert.ok(getRegion("glass-dune").boss.patterns.includes("solarFlare"));
  assert.ok(getRegion("abyssal-archive").boss.patterns.includes("memorySpiral"));
  assert.ok(getRegion("abyssal-archive").boss.patterns.includes("depthCollapse"));
  assert.notEqual(getRegion("glass-dune").threatProfile.composition, getRegion("abyssal-archive").threatProfile.composition);
  assert.equal(getRegion("missing-region"), null);
});

test("every region exposes manifest-aligned existing assets with three route descriptors", async () => {
  const pathsByKey = new Map();
  for (const region of getCampaignRegions()) {
    assert.equal(region.assets.battle.sectors.length, 3);
    assert.equal(region.assets.battle.bossForms.columns, 3);
    assert.equal(region.assets.battle.bossForms.rows, 1);
    for (const asset of [
      region.assets.dom.thumbnail,
      region.assets.dom.bossPortrait,
      ...region.assets.battle.sectors,
      region.assets.battle.bossRoom,
      region.assets.battle.bossForms,
    ]) {
      assert.ok(asset.key.length > 0);
      assert.match(asset.path, /^\.\/assets\/overload\//);
      assert.ok(!pathsByKey.has(asset.key) || pathsByKey.get(asset.key) === asset.path, `asset key ${asset.key} points to conflicting paths`);
      pathsByKey.set(asset.key, asset.path);
      await access(new URL(`../public/${asset.path.replace(/^\.\//, "")}`, import.meta.url));
    }
  }
  assert.match(getRegion("wrong-engine-core").assets.battle.sectors[0].path, /sector-01-shattered-approach\.webp$/);
  assert.deepEqual(new Set(getRegion("glass-dune").assets.battle.sectors.map((asset) => asset.key)), new Set(["overload-glass-dune-route"]));
  assert.deepEqual(new Set(getRegion("glass-dune").assets.battle.sectors.map((asset) => asset.path)), new Set(["./assets/overload/regions/glass-dune/route.webp"]));
  assert.equal(getRegion("glass-dune").assets.battle.bossRoom.key, "overload-glass-dune-boss-room");
  assert.equal(getRegion("abyssal-archive").assets.battle.bossForms.key, "overload-abyssal-archive-boss-forms");
});

test("the base has HANA, ILYA, LARK, and RHEA with authored portraits and interactions", () => {
  assert.equal(HOME_BASE.id, "haven-09");
  assert.equal(HOME_BASE.assets.background.path, "./assets/overload/campaign/haven-09-base.webp");
  assert.equal(HOME_BASE.assets.airshipConsole.path, "./assets/overload/campaign/airship-region-map.webp");
  assert.deepEqual(getBaseNpcs().map((npc) => npc.name), ["HANA", "ILYA", "LARK", "RHEA"]);
  assert.deepEqual(getBaseNpcs().slice(0, 3).map((npc) => npc.portraitIndex), [0, 1, 2]);
  assert.equal(Object.keys(BASE_NPCS).length, 4);
  for (const npc of getBaseNpcs().slice(0, 3)) {
    assert.equal(npc.portraitPath, "./assets/overload/ui/npcs/haven-npc-portraits-atlas.png");
    assert.equal(npc.portraitKey, "havenNpcPortraits");
    assert.ok(npc.dialogue.length > 0);
  }
  assert.equal(BASE_NPCS.rhea.portraitMode, "standalone");
  assert.equal(BASE_NPCS.rhea.portraitKey, "rheaControlOfficer");
  assert.equal(BASE_NPCS.rhea.portraitPath, "./assets/overload/ui/npcs/rhea-control-officer.png");
  assert.equal(BASE_NPCS.rhea.interaction, "open-ability-guide");
  assert.equal(BASE_NPCS.rhea.interactionLabel, "사용 스킬 브리핑");
  assert.ok(BASE_NPCS.rhea.dialogue.length > 0);
  assert.equal(getBaseNpc("LARK").interaction, "open-region-select");
  assert.equal(getBaseNpc("missing"), null);
});

test("region and chapter progression derives only from completed regions", () => {
  assert.deepEqual(getUnlockedRegionIds([]), ["wrong-engine-core"]);
  assert.equal(isRegionUnlocked("glass-dune", []), false);
  assert.deepEqual(getUnlockedRegionIds(["wrong-engine-core"]), [
    "wrong-engine-core",
    "glass-dune",
    "abyssal-archive",
  ]);
  assert.deepEqual(getCompletedChapterIds(["wrong-engine-core"]), ["chapter-01"]);
  assert.equal(getCurrentChapterId(["wrong-engine-core"]), "chapter-02");
  assert.deepEqual(getCompletedChapterIds(["wrong-engine-core", "glass-dune", "abyssal-archive"]), [
    "chapter-01",
    "chapter-02",
  ]);
  assert.equal(CAMPAIGN_CHAPTERS.length, 2);
});

test("campaign content is immutable and exports one flat DOM preload map of existing files", async () => {
  assert.equal(Object.isFrozen(CAMPAIGN_REGIONS), true);
  assert.equal(Object.isFrozen(getRegion("glass-dune").assets), true);
  assert.equal(Object.isFrozen(BASE_NPCS), true);
  const assets = getCampaignDomAssets();
  assert.equal(Object.isFrozen(assets), true);
  assert.equal(Object.keys(assets).length, 10);
  assert.equal(assets.havenBase, "./assets/overload/campaign/haven-09-base.webp");
  assert.equal(assets.havenNpcPortraits, BASE_NPCS.hana.portraitPath);
  assert.equal(assets.rheaControlOfficer, BASE_NPCS.rhea.portraitPath);
  assert.equal(assets["overload-abyssal-archive-route"], CAMPAIGN_REGIONS["abyssal-archive"].assets.dom.thumbnail.path);
  assert.ok(Object.values(assets).every((path) => !path.includes("/ui/regions/") && !path.includes("/base/npc/")));
  await Promise.all(Object.values(assets).map((path) => access(new URL(`../public/${path.replace(/^\.\//, "")}`, import.meta.url))));
});

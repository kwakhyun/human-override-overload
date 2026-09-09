import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";

import {
  REGION_BOSS_PATTERNS,
  REGION_MID_BOSS_PROFILES,
} from "../src/game/content/combatCatalog.js";

import {
  BASE_NPCS,
  CAMPAIGN_CHAPTERS,
  CAMPAIGN_REGIONS,
  DEFAULT_REGION_ID,
  HOME_BASE,
  OUTER_SECTOR_BRIEFING_FLAG,
  REGION_CLUSTERS,
  getBaseNpc,
  getBaseNpcs,
  getCampaignDomAssets,
  getCampaignRegions,
  getRegionCluster,
  getRegionClusters,
  getCompletedChapterIds,
  getCurrentChapterId,
  getRegion,
  getUnlockedRegionIds,
  isRegionUnlocked,
} from "../src/game/content/campaign.js";

test("campaign content defines six sectors across the inner network and outer frontier", () => {
  assert.equal(DEFAULT_REGION_ID, "wrong-engine-core");
  assert.deepEqual(getCampaignRegions().map((region) => region.id), [
    "wrong-engine-core",
    "glass-dune",
    "abyssal-archive",
    "neon-foundry",
    "storm-spire",
    "gene-vault",
  ]);
  assert.equal(Object.keys(CAMPAIGN_REGIONS).length, 6);
  assert.equal(getRegion("wrong-engine-core").boss.name, "THE WRONG ENGINE");
  assert.equal(getRegion("wrong-engine-core").boss.maxHp, 560000);
  assert.equal(getRegion("wrong-engine-core").enemyBudget, 300);
  assert.equal(getRegion("glass-dune").boss.name, "MIRROR TYRANT");
  assert.equal(getRegion("glass-dune").boss.maxHp, 960000);
  assert.equal(getRegion("abyssal-archive").boss.name, "DROWNED ORACLE");
  assert.equal(getRegion("abyssal-archive").boss.maxHp, 1120000);
  assert.ok(getRegion("glass-dune").boss.patterns.includes("prismLattice"));
  assert.ok(getRegion("glass-dune").boss.patterns.includes("solarFlare"));
  assert.ok(getRegion("abyssal-archive").boss.patterns.includes("memorySpiral"));
  assert.ok(getRegion("abyssal-archive").boss.patterns.includes("depthCollapse"));
  assert.notEqual(getRegion("glass-dune").threatProfile.composition, getRegion("abyssal-archive").threatProfile.composition);
  assert.equal(getRegion("neon-foundry").midBoss.name, "PRESS WARDEN");
  assert.equal(getRegion("storm-spire").boss.name, "TEMPEST WYRM");
  assert.equal(getRegion("gene-vault").boss.name, "PALE ARCHON");
  for (const id of ["neon-foundry", "storm-spire", "gene-vault"]) {
    const region = getRegion(id);
    assert.equal(region.clusterId, "outer-frontier");
    assert.equal(region.briefingFlag, undefined);
    assert.equal(region.assets.battle.enemyForms.columns, 4);
    assert.equal(region.assets.battle.bossForms.columns, 3);
    assert.ok(region.midBoss.maxHp >= 52_000);
  }
  assert.equal(getRegion("missing-region"), null);
});

test("campaign boss rotations and outer midboss identities share the runtime combat catalog", () => {
  for (const [regionId, patterns] of Object.entries(REGION_BOSS_PATTERNS)) {
    assert.equal(getRegion(regionId).boss.patterns, patterns);
  }
  for (const [regionId, profile] of Object.entries(REGION_MID_BOSS_PROFILES)) {
    const midBoss = getRegion(regionId).midBoss;
    assert.equal(midBoss.id, profile.id);
    assert.equal(midBoss.combatRole, profile.combatRole);
    assert.equal(midBoss.signature, profile.signature);
    assert.equal(midBoss.trigger, "route-budget-cleared");
    assert.equal("triggerProgress" in midBoss, false);
  }
});

test("region clusters expose a two-step 1—3, 4—6, and future 7—9 hierarchy", () => {
  assert.deepEqual(getRegionClusters().map((cluster) => cluster.id), [
    "inner-network",
    "outer-frontier",
    "terminal-orbit",
  ]);
  assert.deepEqual(getRegionCluster("inner-network").regionIds, ["wrong-engine-core", "glass-dune", "abyssal-archive"]);
  assert.deepEqual(getRegionCluster("outer-frontier").regionIds, ["neon-foundry", "storm-spire", "gene-vault"]);
  assert.equal(getRegionCluster("outer-frontier").briefingFlag, undefined);
  assert.equal(getRegionCluster("terminal-orbit").comingSoon, true);
  assert.deepEqual(getRegionCluster("terminal-orbit").regionIds, []);
  assert.equal(getRegionCluster("missing-cluster"), null);
  assert.equal(Object.isFrozen(REGION_CLUSTERS), true);
});

test("every region exposes one manifest-aligned square arena descriptor", async () => {
  const pathsByKey = new Map();
  for (const region of getCampaignRegions()) {
    assert.equal(region.assets.battle.sectors.length, 1);
    assert.equal(region.assets.battle.bossForms.columns, 3);
    assert.equal(region.assets.battle.bossForms.rows, 1);
    assert.match(region.assets.battle.sectors[0].key, /-arena-square-v1$/);
    assert.match(region.assets.battle.sectors[0].path, /\/arena-square-v1\.webp$/);
    for (const asset of [
      region.assets.dom.thumbnail,
      region.assets.dom.bossPortrait,
      ...region.assets.battle.sectors,
      region.assets.battle.bossRoom,
      ...(region.assets.battle.enemyForms ? [region.assets.battle.enemyForms] : []),
      region.assets.battle.bossForms,
    ]) {
      assert.ok(asset.key.length > 0);
      assert.match(asset.path, /^\.\/assets\/overload\//);
      assert.ok(!pathsByKey.has(asset.key) || pathsByKey.get(asset.key) === asset.path, `asset key ${asset.key} points to conflicting paths`);
      pathsByKey.set(asset.key, asset.path);
      await access(new URL(`../public/${asset.path.replace(/^\.\//, "")}`, import.meta.url));
    }
  }
  assert.equal(getRegion("wrong-engine-core").assets.battle.sectors[0].path, "./assets/overload/regions/wrong-engine-core/arena-square-v1.webp");
  assert.equal(getRegion("glass-dune").assets.battle.sectors[0].key, "overload-glass-dune-arena-square-v1");
  assert.equal(getRegion("glass-dune").assets.battle.sectors[0].path, "./assets/overload/regions/glass-dune/arena-square-v1.webp");
  assert.equal(getRegion("glass-dune").assets.battle.bossRoom.key, "overload-glass-dune-boss-room");
  assert.equal(getRegion("abyssal-archive").assets.battle.bossForms.key, "overload-abyssal-archive-boss-forms");
});

test("the base has HANA, ILYA, SERA, and RHEA with authored portraits and interactions", () => {
  assert.equal(HOME_BASE.id, "haven-09");
  assert.equal(HOME_BASE.assets.background.path, "./assets/overload/campaign/haven-09-base.webp");
  assert.equal(HOME_BASE.assets.airshipConsole.path, "./assets/overload/campaign/strategic-world-map.webp");
  assert.deepEqual(getBaseNpcs().map((npc) => npc.name), ["HANA", "ILYA", "SERA", "RHEA"]);
  assert.equal(BASE_NPCS.hana.portraitMode, "standalone");
  assert.equal(Object.keys(BASE_NPCS).length, 4);
  assert.equal(BASE_NPCS.hana.portraitPath, "./assets/overload/portraits/anime-v1/hana.webp");
  assert.equal(BASE_NPCS.hana.portraitKey, "hanaPortrait");
  assert.equal(BASE_NPCS.ilya.portraitMode, "standalone");
  assert.equal(BASE_NPCS.ilya.portraitKey, "ilyaPortrait");
  assert.equal(BASE_NPCS.ilya.portraitPath, "./assets/overload/portraits/anime-v1/ilya.webp");
  assert.ok(getBaseNpcs().slice(0, 2).every((npc) => npc.dialogue.length > 0));
  assert.equal(BASE_NPCS.lark.name, "SERA");
  assert.equal(BASE_NPCS.lark.portraitMode, "standalone");
  assert.equal(BASE_NPCS.lark.portraitKey, "nightjarPilot");
  assert.equal(BASE_NPCS.lark.portraitPath, "./assets/overload/portraits/anime-v1/sera.webp");
  assert.equal(BASE_NPCS.rhea.portraitMode, "standalone");
  assert.equal(BASE_NPCS.rhea.portraitKey, "rheaControlOfficer");
  assert.equal(BASE_NPCS.rhea.portraitPath, "./assets/overload/portraits/anime-v1/rhea.webp");
  assert.equal(BASE_NPCS.rhea.interaction, "open-ability-guide");
  assert.equal(BASE_NPCS.rhea.interactionLabel, "사용 스킬 브리핑");
  assert.ok(BASE_NPCS.rhea.dialogue.length > 0);
  assert.equal(getBaseNpc("LARK").interaction, "open-flight-operations");
  assert.equal(getBaseNpc("LARK").interactionLabel, "항공 지원 전술");
  assert.ok(getBaseNpc("LARK").milestoneDialogue.some((line) => line.includes("외곽 권역")));
  assert.ok(getBaseNpcs().every((npc) => npc.portraitDialogue.length > 0));
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
  assert.deepEqual(getUnlockedRegionIds(["wrong-engine-core", "glass-dune", "abyssal-archive"]), [
    "wrong-engine-core",
    "glass-dune",
    "abyssal-archive",
    "neon-foundry",
    "storm-spire",
    "gene-vault",
  ]);
  assert.equal(getCurrentChapterId(["wrong-engine-core", "glass-dune", "abyssal-archive"]), "chapter-03");
  assert.equal(CAMPAIGN_CHAPTERS.length, 3);
});

test("campaign content is immutable and exports one flat DOM preload map of existing files", async () => {
  assert.equal(Object.isFrozen(CAMPAIGN_REGIONS), true);
  assert.equal(Object.isFrozen(getRegion("glass-dune").assets), true);
  assert.equal(Object.isFrozen(BASE_NPCS), true);
  const assets = getCampaignDomAssets();
  assert.equal(Object.isFrozen(assets), true);
  assert.equal(Object.keys(assets).length, 18);
  assert.equal(assets.havenBase, "./assets/overload/campaign/haven-09-base.webp");
  assert.equal(assets.hanaPortrait, BASE_NPCS.hana.portraitPath);
  assert.equal(assets.ilyaPortrait, BASE_NPCS.ilya.portraitPath);
  assert.equal(assets.nightjarPilot, BASE_NPCS.lark.portraitPath);
  assert.equal(assets.rheaControlOfficer, BASE_NPCS.rhea.portraitPath);
  assert.equal(assets["overload-abyssal-archive-route"], CAMPAIGN_REGIONS["abyssal-archive"].assets.dom.thumbnail.path);
  assert.equal(assets["overload-neon-foundry-route"], CAMPAIGN_REGIONS["neon-foundry"].assets.dom.thumbnail.path);
  assert.ok(Object.values(assets).every((path) => !path.includes("/ui/regions/") && !path.includes("/base/npc/")));
  await Promise.all(Object.values(assets).map((path) => access(new URL(`../public/${path.replace(/^\.\//, "")}`, import.meta.url))));
});

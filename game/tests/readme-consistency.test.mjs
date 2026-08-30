import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const rootReadmeUrl = new URL("../../README.md", import.meta.url);
const gameReadmeUrl = new URL("../README.md", import.meta.url);
const architectureUrl = new URL("../docs/service-architecture-ko.md", import.meta.url);

test("README character, campaign, and flight-operation summaries match active content", async () => {
  const [{ getPlayableCharacters }, { getCampaignRegions }, { getFlightPlans }, rootReadme, gameReadme] = await Promise.all([
    import(new URL("../src/game/content/characters.js", import.meta.url)),
    import(new URL("../src/game/content/campaign.js", import.meta.url)),
    import(new URL("../src/game/content/flightOperations.js", import.meta.url)),
    readFile(rootReadmeUrl, "utf8"),
    readFile(gameReadmeUrl, "utf8"),
  ]);

  const characters = getPlayableCharacters();
  const regions = getCampaignRegions();
  const plans = getFlightPlans();
  assert.equal(characters.length, 4);
  assert.equal(regions.length, 6);
  for (const character of characters) {
    assert.match(rootReadme, new RegExp(`\\*\\*${character.name}:\\*\\*`));
    assert.match(gameReadme, new RegExp(character.name));
  }
  for (const plan of plans) assert.match(rootReadme + gameReadme, new RegExp(plan.koreanName));
  assert.match(gameReadme, /4명/);
  assert.match(gameReadme, /8곳/);
  assert.doesNotMatch(gameReadme, /3명|vesper-portrait-v2|전송 게이트 다섯 곳|SERA는 허벅지/);
});

test("README project tree and managed Sites boundaries point to real implementation paths", async () => {
  const [rootReadme, gameReadme, architecture] = await Promise.all([
    readFile(rootReadmeUrl, "utf8"),
    readFile(gameReadmeUrl, "utf8"),
    readFile(architectureUrl, "utf8"),
  ]);
  const documentedPaths = [
    "src/App.jsx",
    "src/ui/campaign/CampaignScreens.jsx",
    "src/ui/combat/combatPresentation.js",
    "src/ui/defense/DefenseScreens.jsx",
    "src/swarm/engine.js",
    "src/defense/engine.js",
    "worker/index.js",
    "db/schema.ts",
    "scripts/production-asset-policy.mjs",
  ];
  for (const relativePath of documentedPaths) {
    assert.match(rootReadme + gameReadme, new RegExp(relativePath.replaceAll("/", "\\/")));
    await access(new URL(`../${relativePath}`, import.meta.url));
  }
  assert.match(rootReadme + gameReadme, /npm run analyze:assets/);
  assert.match(architecture, /ChatGPT Sites 관리형 Worker/);
  assert.match(architecture, /D1과 R2는 개인 Cloudflare 계정에 직접 만든 자원이 아니라/);
  assert.doesNotMatch(architecture, /Cloudflare Cache API/);
});

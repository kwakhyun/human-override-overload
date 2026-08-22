import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/82105/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const qaDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(qaDir, "../tmp/portfolio-p0");
const baseUrl = process.env.OVERLOAD_QA_BASE_URL || "http://127.0.0.1:4174/";
const campaignKey = "train-me-wrong.overload.campaign.v2";

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  args: ["--disable-gpu-sandbox"],
});

function captureErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("requestfailed", (request) => {
    const reason = request.failure()?.errorText || "failed";
    if (reason === "net::ERR_ABORTED" && request.url().includes("/assets/audio/")) return;
    errors.push(`request: ${request.url()} ${reason}`);
  });
  return errors;
}

async function enterFreshBase(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(".initial-asset-loading").waitFor({ state: "detached", timeout: 30_000 });
  await page.locator(".intro-start:not([disabled])").click();
  await page.locator(".save-slot-card").first().click();
  await page.locator(".home-base-screen").waitFor({ state: "visible", timeout: 20_000 });
  if (await page.locator(".base-dialogue:visible").count()) await page.keyboard.press("Escape");
}

const freshContext = await browser.newContext({ viewport: { width: 1440, height: 810 } });
const freshPage = await freshContext.newPage();
const freshErrors = captureErrors(freshPage);
await enterFreshBase(freshPage);

await freshPage.locator(".base-character-action").click();
await freshPage.locator(".character-information-panel").waitFor({ state: "visible" });
assert.equal(await freshPage.locator(".character-roster-rail button").count(), 1, "locked MIKA must be absent from a fresh slot");
assert.doesNotMatch(await freshPage.locator(".character-information-panel").innerText(), /미카|미해금/);
await freshPage.locator(".facility-close").click();

await freshPage.locator(".base-sortie-action").click();
await freshPage.locator(".region-map-hotspot").first().click();
await freshPage.locator(".region-card").first().click();
const launch = freshPage.locator(".region-sortie-launch");
assert.equal(await launch.isEnabled(), true, "the saved valid loadout should launch without a redundant confirmation tap");
await freshPage.screenshot({ path: path.join(outputDir, "desktop-sortie-ready.png"), fullPage: false });
await launch.click();

await freshPage.locator(".ability-guide-screen").waitFor({ state: "visible", timeout: 20_000 });
assert.equal(await freshPage.locator(".ability-guide-tabs button").count(), 2, "first briefing should teach only movement and survival essentials");
while (await freshPage.locator(".ability-guide-next:visible").count()) {
  await freshPage.locator(".ability-guide-next:visible").click();
  await freshPage.waitForTimeout(100);
}
await freshPage.locator("canvas").waitFor({ state: "visible", timeout: 30_000 });
const fallback = freshPage.locator(".sortie-play-fallback:visible");
if (await fallback.count()) await fallback.click();
await freshPage.locator(".combat-runtime-shell.is-live").waitFor({ state: "visible", timeout: 30_000 });
await freshPage.waitForFunction(() => document.querySelector(".narrative-panel") || document.querySelector(".combat-tutorial-layer"), null, { timeout: 15_000 });
assert.equal(await freshPage.locator(".narrative-panel:visible").count(), 1, "mission context must appear before the contextual ability tutorial");
assert.equal(await freshPage.locator(".combat-tutorial-layer:visible").count(), 0);
while (await freshPage.locator(".narrative-panel button:visible").count()) {
  await freshPage.locator(".narrative-panel button:visible").click();
  await freshPage.waitForTimeout(100);
}
await freshPage.locator(".combat-tutorial-layer").waitFor({ state: "visible", timeout: 10_000 });
await freshPage.screenshot({ path: path.join(outputDir, "desktop-contextual-tutorial.png"), fullPage: false });
await freshPage.locator("canvas").evaluate((canvas) => { canvas.dataset.qaRunIdentity = "original"; });
await freshPage.locator(".combat-tutorial-skip").click();
await freshPage.locator(".combat-tutorial-layer").waitFor({ state: "detached", timeout: 10_000 });
await freshPage.waitForTimeout(1_200);
assert.equal(await freshPage.locator('canvas[data-qa-run-identity="original"]').count(), 1, "tutorial persistence must not recreate the Phaser controller");
assert.equal(await freshPage.locator(".narrative-panel:visible").count(), 0, "deployment narrative must not replay after tutorial completion");
assert.equal(await freshPage.evaluate(({ key }) => JSON.parse(localStorage.getItem(key)).slots[0].combatOverlaySeen, { key: campaignKey }), true);
assert.deepEqual(freshErrors, []);
await freshContext.close();

const exchangeContext = await browser.newContext({ viewport: { width: 1440, height: 810 } });
const exchangePage = await exchangeContext.newPage();
const exchangeErrors = captureErrors(exchangePage);
await enterFreshBase(exchangePage);
await exchangePage.evaluate(({ key }) => {
  const campaign = JSON.parse(localStorage.getItem(key));
  const slot = campaign.slots[0];
  slot.completedRegionIds = ["wrong-engine-core", "glass-dune", "abyssal-archive", "neon-foundry"];
  slot.storyFlags = [...new Set([...(slot.storyFlags || []), "home-base-unlocked", "ability-guide-complete", "combat-overlay-complete", "outer-sector-briefed", "mika-unlocked"])];
  slot.homeBaseUnlocked = true;
  slot.progression = { ...(slot.progression || {}), researchData: 40, equipmentParts: 20, augmentationCores: 0 };
  localStorage.setItem(key, JSON.stringify(campaign));
}, { key: campaignKey });
await exchangePage.reload({ waitUntil: "domcontentloaded" });
await exchangePage.locator(".initial-asset-loading").waitFor({ state: "detached", timeout: 30_000 });
await exchangePage.locator(".intro-start:not([disabled])").click();
await exchangePage.locator(".save-slot-card").first().click();
await exchangePage.locator(".home-base-screen").waitFor({ state: "visible", timeout: 20_000 });
if (await exchangePage.locator(".base-dialogue:visible").count()) await exchangePage.keyboard.press("Escape");
await exchangePage.locator(".base-currency-rail button").first().click();
await exchangePage.locator(".facility-exchange-panel").waitFor({ state: "visible" });
assert.equal(await exchangePage.locator(".facility-exchange-panel article").count(), 2);
await exchangePage.locator(".facility-exchange-panel article").first().locator("button").click();
const exchanged = await exchangePage.evaluate(({ key }) => JSON.parse(localStorage.getItem(key)).slots[0].progression, { key: campaignKey });
assert.equal(exchanged.researchData, 34);
assert.equal(exchanged.equipmentParts, 23);
await exchangePage.screenshot({ path: path.join(outputDir, "desktop-resource-exchange.png"), fullPage: false });
assert.deepEqual(exchangeErrors, []);
await exchangeContext.close();

const repeatContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const repeatPage = await repeatContext.newPage();
const repeatErrors = captureErrors(repeatPage);
await enterFreshBase(repeatPage);
await repeatPage.evaluate(({ key }) => {
  const campaign = JSON.parse(localStorage.getItem(key));
  const slot = campaign.slots[0];
  slot.completedRegionIds = ["wrong-engine-core"];
  slot.storyFlags = [...new Set([...(slot.storyFlags || []), "home-base-unlocked", "ability-guide-complete", "combat-overlay-complete", "mika-unlocked"] )];
  slot.homeBaseUnlocked = true;
  slot.abilityGuideSeen = true;
  slot.combatOverlaySeen = true;
  slot.pendingPostVictorySteps = [];
  localStorage.setItem(key, JSON.stringify(campaign));
}, { key: campaignKey });
await repeatPage.reload({ waitUntil: "domcontentloaded" });
await repeatPage.locator(".initial-asset-loading").waitFor({ state: "detached", timeout: 30_000 });
await repeatPage.locator(".intro-start:not([disabled])").click();
await repeatPage.locator(".save-slot-card").first().click();
await repeatPage.locator(".home-base-screen").waitFor({ state: "visible", timeout: 20_000 });
if (await repeatPage.locator(".base-dialogue:visible").count()) await repeatPage.keyboard.press("Escape");
await repeatPage.locator(".base-sortie-action").click();
await repeatPage.locator(".region-map-hotspot").first().click();
await repeatPage.locator(".region-card").first().click();
assert.equal(await repeatPage.locator(".region-sortie-repeat-intel").getAttribute("open"), null, "repeat intel should start collapsed");
await repeatPage.locator(".region-sortie-launch").click();
await repeatPage.locator(".sortie-cinematic.is-repeat-sortie").waitFor({ state: "visible", timeout: 20_000 });
assert.equal(await repeatPage.locator(".sortie-cinematic.is-repeat-sortie video").count(), 0, "repeat sortie should use the poster instead of replaying video");
await repeatPage.locator(".combat-runtime-shell.is-live").waitFor({ state: "visible", timeout: 30_000 });
await repeatPage.waitForTimeout(500);
assert.equal(await repeatPage.locator(".narrative-panel:visible").count(), 0, "repeat sortie should skip only the opening deployment panel");
assert.deepEqual(repeatErrors, []);
await repeatContext.close();

await browser.close();
process.stdout.write(`${JSON.stringify({ result: "pass", freshFlow: true, narrativeBeforeContextualTutorial: true, controllerPreservedAfterTutorial: true, repeatSortieSkipsOpeningMediaAndDialogue: true, exchange: { researchData: 34, equipmentParts: 23 }, errors: [] }, null, 2)}\n`);

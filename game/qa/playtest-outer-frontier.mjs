import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/82105/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const qaDir = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = "http://127.0.0.1:4174/";
const campaignKey = "train-me-wrong.overload.campaign.v2";

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
});
const page = await browser.newPage({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1 });
const errors = [];
const assetResponses = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
page.on("requestfailed", (request) => errors.push(`request: ${request.url()} ${request.failure()?.errorText || "failed"}`));
page.on("response", (response) => {
  if (response.url().includes("/assets/overload/regions/")) assetResponses.push({ url: response.url(), status: response.status() });
});

await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
await page.evaluate(({ key }) => {
  localStorage.setItem(key, JSON.stringify({
    version: 2,
    slots: [{
      id: "slot-1",
      createdAt: "2026-08-12T00:00:00.000Z",
      updatedAt: "2026-08-12T00:00:00.000Z",
      completedRegionIds: ["wrong-engine-core", "glass-dune", "abyssal-archive"],
      storyFlags: [
        "home-base-unlocked",
        "chapter-01-cleared",
        "chapter-02-cleared",
        "ability-guide-complete",
        "combat-overlay-complete",
      ],
      abilityGuideSeen: true,
      combatOverlaySeen: true,
      regionRecords: {},
    }, null, null],
  }));
}, { key: campaignKey });
await page.reload({ waitUntil: "domcontentloaded" });
await page.locator(".intro-start").click();
await page.locator(".save-slot-card").first().click();
await page.locator(".home-base-screen").waitFor({ state: "visible", timeout: 15_000 });

const lark = page.locator(".npc-lark.has-mission-alert");
await lark.waitFor({ state: "visible" });
assert.equal(await page.locator(".npc-mission-alert").count(), 1);
assert.match(await page.locator(".base-objective").innerText(), /라크가 신규 권역 신호를 해독했습니다/);
await page.screenshot({ path: path.join(qaDir, "outer-frontier-lark-alert.png"), fullPage: true });

await lark.click();
const dialogue = page.locator(".base-dialogue");
await dialogue.waitFor({ state: "visible" });
assert.match(await dialogue.innerText(), /외곽 권역 항로|외곽 권역/);
await page.getByRole("button", { name: /^다음/ }).click();
await page.getByRole("button", { name: /^다음/ }).click();
assert.match(await dialogue.innerText(), /상위 권역 지도를 확장/);
await page.locator(".base-interaction-cta").click();

await page.locator(".region-cluster-grid").waitFor({ state: "visible", timeout: 15_000 });
assert.equal(await page.locator(".region-cluster-card").count(), 3);
assert.equal(await page.locator(".cluster-outer-frontier:enabled").count(), 1);
assert.equal(await page.locator(".cluster-terminal-orbit:disabled").count(), 1);
assert.match(await page.locator(".cluster-outer-frontier").innerText(), /SECTORS 04—06[\s\S]*외곽 생산권역/);
await page.screenshot({ path: path.join(qaDir, "outer-frontier-cluster-map.png"), fullPage: true });

await page.locator(".cluster-outer-frontier").click();
await page.locator(".region-card-grid").waitFor({ state: "visible" });
assert.equal(await page.locator(".region-card").count(), 3);
const regionCopy = await page.locator(".region-card-grid").innerText();
for (const name of ["네온 주조구", "폭풍 첨탑", "생체 금고"]) assert.match(regionCopy, new RegExp(name));
await page.screenshot({ path: path.join(qaDir, "outer-frontier-region-detail.png"), fullPage: true });

await page.setViewportSize({ width: 844, height: 390 });
await page.waitForTimeout(250);
const viewportMetrics = await page.evaluate(() => ({
  clientWidth: document.documentElement.clientWidth,
  scrollWidth: document.documentElement.scrollWidth,
  bodyScrollWidth: document.body.scrollWidth,
}));
assert.ok(viewportMetrics.scrollWidth <= viewportMetrics.clientWidth + 1, JSON.stringify(viewportMetrics));
assert.ok(viewportMetrics.bodyScrollWidth <= viewportMetrics.clientWidth + 1, JSON.stringify(viewportMetrics));
await page.screenshot({ path: path.join(qaDir, "outer-frontier-mobile-landscape.png"), fullPage: false });

await page.setViewportSize({ width: 1440, height: 810 });
await page.locator(".region-card").first().click();
const sortieDialog = page.locator(".region-sortie-dialog");
await sortieDialog.waitFor({ state: "visible" });
assert.match(await sortieDialog.innerText(), /프레스 감시관[\s\S]*용광로 거신/);
await page.locator(".region-sortie-launch").click();
await page.locator("canvas").waitFor({ state: "visible", timeout: 30_000 });
await page.locator(".combat-runtime-shell.is-live").waitFor({ state: "visible", timeout: 30_000 });
for (let index = 0; index < 6; index += 1) {
  const next = page.locator(".narrative-panel button:visible");
  if (!(await next.count())) break;
  await next.click();
  await page.waitForTimeout(120);
}
await page.waitForTimeout(1_200);
const runtimeSnapshot = await page.evaluate(() => window.__OVERLOAD_QA__?.getSnapshot?.());
assert.equal(runtimeSnapshot?.context?.regionId, "neon-foundry");
assert.ok(runtimeSnapshot?.context?.liveEnemies > 0);
assert.ok(Object.values(runtimeSnapshot?.textureMemory?.categories || {}).some((category) => category.keys?.includes("overload-neon-foundry-enemy-forms")));
assert.ok(assetResponses.some(({ url, status }) => status === 200 && url.includes("/neon-foundry/enemy-forms-atlas.png")));
assert.ok(assetResponses.some(({ url, status }) => status === 200 && url.includes("/neon-foundry/route.webp")));
await page.screenshot({ path: path.join(qaDir, "outer-frontier-neon-foundry-smoke.png"), fullPage: false });

const saved = JSON.parse(await page.evaluate((key) => localStorage.getItem(key), campaignKey));
assert.ok(saved.slots[0].storyFlags.includes("outer-sector-briefed"));
assert.deepEqual(errors, []);

console.log(JSON.stringify({
  result: "pass",
  larkAlert: true,
  clusters: 3,
  outerRegions: 3,
  neonFoundryCombat: true,
  briefingPersisted: true,
  viewportMetrics,
  errors,
}, null, 2));

await browser.close();

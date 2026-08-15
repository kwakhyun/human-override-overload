import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/82105/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const qaDir = path.dirname(fileURLToPath(import.meta.url));
const errors = [];
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 810 } });
const page = await context.newPage();

page.on("pageerror", (error) => errors.push(`page:${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console:${message.text()}`);
});
page.on("response", (response) => {
  if (response.status() >= 400) errors.push(`http:${response.status()}:${response.url()}`);
});

await page.goto("http://127.0.0.1:4174/", { waitUntil: "domcontentloaded" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "domcontentloaded" });
await page.locator(".intro-start").click();
await page.locator(".save-slot-card").first().click();
await page.locator(".home-base-screen").waitFor({ state: "visible", timeout: 15_000 });
if (await page.locator(".base-dialogue:visible").count()) await page.keyboard.press("Escape");

await page.locator(".base-defense-action").click();
await page.locator(".defense-stage-select-screen").waitFor({ state: "visible" });
assert.equal(await page.locator(".defense-stage-card").count(), 3);
assert.equal(await page.locator(".defense-stage-card:enabled").count(), 1);
await page.screenshot({ path: path.join(qaDir, "defense-stage-select.png"), fullPage: true });
await page.locator(".defense-stage-card:enabled").click();

const canvas = page.locator(".defense-runtime-screen canvas");
await canvas.waitFor({ state: "visible", timeout: 30_000 });
await page.locator(".defense-load-chip").waitFor({ state: "detached", timeout: 30_000 });
assert.match(await page.locator(".defense-rhea-chip").innerText(), /배치 준비[\s\S]*헤이븐 외곽선/);
assert.match(await page.locator(".defense-core-status").innerText(), /24 \/ 24/);

const guide = page.locator(".defense-guide-overlay");
await guide.waitFor({ state: "visible" });
assert.equal(await guide.getAttribute("data-defense-guide-step"), "1");
await page.screenshot({ path: path.join(qaDir, "defense-guide-01-core.png"), fullPage: true });
await page.keyboard.press("Space");
assert.equal(await guide.getAttribute("data-defense-guide-step"), "2");
assert.match(await page.locator(".defense-wave-status").innerText(), /현장 적\s*0/);
await page.screenshot({ path: path.join(qaDir, "defense-guide-02-pads.png"), fullPage: true });
await page.locator(".defense-guide-next").click();
assert.equal(await guide.getAttribute("data-defense-guide-step"), "3");
await page.screenshot({ path: path.join(qaDir, "defense-guide-03-towers.png"), fullPage: true });
await page.locator(".defense-guide-next").click();
assert.equal(await guide.getAttribute("data-defense-guide-step"), "4");
await page.screenshot({ path: path.join(qaDir, "defense-guide-04-wave.png"), fullPage: true });
await page.locator(".defense-guide-next").click();
await guide.waitFor({ state: "detached" });
assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("train-me-wrong.overload.campaign.v2")).slots[0].defenseGuideSeen), true);

const box = await canvas.boundingBox();
assert.ok(box);
await canvas.click({ position: { x: box.width * 245 / 1280, y: box.height * 275 / 720 } });
const sentry = page.locator(".defense-tower-palette button").first();
await sentry.waitFor({ state: "visible" });
assert.equal(await sentry.isEnabled(), true);
await sentry.click();
assert.match(await page.locator(".defense-command-dock").innerText(), /강화 단계 1 \/ 3[\s\S]*펄스 센트리/);

const wave = page.locator(".defense-wave-button");
await wave.waitFor({ state: "visible" });
assert.equal(await wave.isEnabled(), true);
await wave.click();
await page.waitForFunction(() => {
  const text = document.querySelector(".defense-wave-status")?.textContent || "";
  return /현장 적\s*[1-9]/.test(text);
}, null, { timeout: 10_000 });
await page.screenshot({ path: path.join(qaDir, "defense-mode-smoke.png"), fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(500);
const mobileBounds = await page.evaluate(() => {
  const viewport = { width: innerWidth, height: innerHeight };
  const selectors = [".defense-core-status", ".defense-wave-status", ".defense-command-dock", ".defense-exit"];
  return selectors.map((selector) => {
    const box = document.querySelector(selector)?.getBoundingClientRect();
    return { selector, left: box?.left, top: box?.top, right: box?.right, bottom: box?.bottom, viewport };
  });
});
for (const item of mobileBounds) {
  assert.ok(item.left >= -1 && item.top >= -1 && item.right <= item.viewport.width + 1 && item.bottom <= item.viewport.height + 1, `${item.selector} must remain inside the mobile portrait viewport`);
}
await page.screenshot({ path: path.join(qaDir, "defense-mode-mobile-portrait.png"), fullPage: true });

const mobileGuideContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mobileGuidePage = await mobileGuideContext.newPage();
mobileGuidePage.on("pageerror", (error) => errors.push(`mobile-page:${error.message}`));
mobileGuidePage.on("console", (message) => {
  if (message.type() === "error") errors.push(`mobile-console:${message.text()}`);
});
await mobileGuidePage.goto("http://127.0.0.1:4174/", { waitUntil: "domcontentloaded" });
await mobileGuidePage.evaluate(() => localStorage.clear());
await mobileGuidePage.reload({ waitUntil: "domcontentloaded" });
await mobileGuidePage.locator(".intro-start").click();
await mobileGuidePage.locator(".save-slot-card").first().click();
await mobileGuidePage.locator(".home-base-screen").waitFor({ state: "visible", timeout: 15_000 });
if (await mobileGuidePage.locator(".base-dialogue:visible").count()) await mobileGuidePage.keyboard.press("Escape");
await mobileGuidePage.locator(".base-defense-action").click();
await mobileGuidePage.locator(".defense-stage-card:enabled").click();
await mobileGuidePage.locator(".defense-load-chip").waitFor({ state: "detached", timeout: 30_000 });
const mobileGuide = mobileGuidePage.locator(".defense-guide-overlay");
await mobileGuide.waitFor({ state: "visible" });
assert.equal(await mobileGuide.getAttribute("data-defense-guide-step"), "1");
const mobileGuideCard = await mobileGuidePage.locator(".defense-guide-card").boundingBox();
assert.ok(mobileGuideCard && mobileGuideCard.x >= 0 && mobileGuideCard.y >= 0 && mobileGuideCard.x + mobileGuideCard.width <= 390 && mobileGuideCard.y + mobileGuideCard.height <= 844);
await mobileGuidePage.screenshot({ path: path.join(qaDir, "defense-guide-mobile-portrait.png"), fullPage: true });
await mobileGuideContext.close();

assert.deepEqual(errors, []);
console.log(JSON.stringify({ result: "pass", stages: 3, guideSteps: 4, guidePersisted: true, mobileGuideFits: true, towerBuilt: "pulseSentry", waveStarted: true, mobileBounds, errors }, null, 2));
await browser.close();

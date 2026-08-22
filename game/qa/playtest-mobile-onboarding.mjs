import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/82105/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const qaDir = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = "http://127.0.0.1:4174/";
const errors = [];

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  args: ["--disable-gpu-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
page.on("requestfailed", (request) => {
  const reason = request.failure()?.errorText || "failed";
  if (reason === "net::ERR_ABORTED" && request.url().includes("/assets/audio/")) return;
  errors.push(`request: ${request.url()} ${reason}`);
});

try {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(".initial-asset-loading").waitFor({ state: "detached", timeout: 30_000 });
  await page.locator(".intro-start:not([disabled])").tap();
  await page.locator(".save-slot-card").first().tap();
  await page.locator(".home-base-screen").waitFor({ state: "visible", timeout: 20_000 });
  if (await page.locator(".base-dialogue:visible").count()) await page.keyboard.press("Escape");

  await page.locator(".base-sortie-action").tap();
  await page.locator(".region-map-hotspot").first().tap();
  await page.locator(".region-card").first().tap();
  assert.equal(await page.locator(".region-sortie-launch").isEnabled(), true, "saved loadout should already be confirmed");
  await page.locator(".region-sortie-launch").tap();
  await page.locator(".ability-guide-screen").waitFor({ state: "visible", timeout: 20_000 });

  const metrics = await page.evaluate(() => {
    const rect = (selector) => {
      const box = document.querySelector(selector)?.getBoundingClientRect();
      return box ? { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height } : null;
    };
    const font = (selector) => Number.parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
    return {
      viewport: { width: innerWidth, height: innerHeight },
      console: rect(".ability-guide-console"),
      heading: font(".ability-guide-console > header h1"),
      tabButtons: [...document.querySelectorAll(".ability-guide-tabs button")].map((button) => ({
        height: button.getBoundingClientRect().height,
        name: Number.parseFloat(getComputedStyle(button.querySelector("b")).fontSize),
      })),
      detailHeading: font(".ability-guide-copy h2"),
      body: font(".ability-guide-copy p"),
      list: font(".ability-guide-copy li"),
      actions: [...document.querySelectorAll(".ability-guide-actions > button")].map((button) => ({
        height: button.getBoundingClientRect().height,
        font: Number.parseFloat(getComputedStyle(button).fontSize),
      })),
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  assert.ok(metrics.console && metrics.console.left >= 0 && metrics.console.top >= 0 && metrics.console.right <= 390 && metrics.console.bottom <= 844, JSON.stringify(metrics));
  assert.ok(metrics.heading >= 28 && metrics.detailHeading >= 27 && metrics.body >= 16 && metrics.list >= 14, JSON.stringify(metrics));
  assert.ok(metrics.tabButtons.every((button) => button.height >= 72 && button.name >= 13), JSON.stringify(metrics));
  assert.ok(metrics.actions.every((button) => button.height >= 56 && button.font >= 14), JSON.stringify(metrics));
  assert.ok(metrics.horizontalOverflow <= 1, JSON.stringify(metrics));
  assert.deepEqual(errors, []);
  await page.screenshot({ path: path.join(qaDir, "mobile-portrait-ability-guide-390x844.png"), fullPage: false });
  console.log(JSON.stringify({ result: "pass", metrics, errors }, null, 2));
} finally {
  await browser.close();
}

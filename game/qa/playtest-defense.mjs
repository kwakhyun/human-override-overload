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
await page.locator(".defense-stage-card:enabled").click();

const canvas = page.locator(".defense-runtime-screen canvas");
await canvas.waitFor({ state: "visible", timeout: 30_000 });
await page.locator(".defense-load-chip").waitFor({ state: "detached", timeout: 30_000 });
assert.match(await page.locator(".defense-rhea-chip").innerText(), /레아 관제[\s\S]*헤이븐 외곽선/);
assert.match(await page.locator(".defense-core-status").innerText(), /24 \/ 24/);

const box = await canvas.boundingBox();
assert.ok(box);
await canvas.click({ position: { x: box.width * 245 / 1280, y: box.height * 275 / 720 } });
const sentry = page.locator(".defense-tower-palette button").first();
await sentry.waitFor({ state: "visible" });
assert.equal(await sentry.isEnabled(), true);
await sentry.click();
assert.match(await page.locator(".defense-command-dock").innerText(), /LV\.1 \/ 3[\s\S]*펄스 센트리/);

const wave = page.locator(".defense-wave-button");
await wave.waitFor({ state: "visible" });
assert.equal(await wave.isEnabled(), true);
await wave.click();
await page.waitForFunction(() => {
  const text = document.querySelector(".defense-wave-status")?.textContent || "";
  return /잔존 적\s*[1-9]/.test(text);
}, null, { timeout: 10_000 });
await page.screenshot({ path: path.join(qaDir, "defense-mode-smoke.png"), fullPage: true });

assert.deepEqual(errors, []);
console.log(JSON.stringify({ result: "pass", stages: 3, towerBuilt: "pulseSentry", waveStarted: true, errors }, null, 2));
await browser.close();

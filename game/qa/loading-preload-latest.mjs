import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/82105/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const qaDir = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = "http://127.0.0.1:4174/?debug=1";
const report = { errors: [], initial: {}, sortie: {} };

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
});
const context = await browser.newContext({ viewport: { width: 1440, height: 810 } });
const page = await context.newPage();
page.on("console", (message) => {
  if (["error", "warning"].includes(message.type())) report.errors.push(`console:${message.type()}: ${message.text()}`);
});
page.on("pageerror", (error) => report.errors.push(`pageerror: ${error.message}`));

let delayedIntro = false;
await page.route("**/assets/overload/intro/start-screen-key-art.webp", async (route) => {
  if (!delayedIntro) {
    delayedIntro = true;
    await new Promise((resolve) => setTimeout(resolve, 350));
  }
  await route.continue();
});

await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "domcontentloaded" });
report.initial.loaderVisibleDuringColdDecode = await page.locator(".initial-asset-loading").isVisible();
await page.locator(".intro-cinematic").waitFor({ state: "visible", timeout: 15_000 });
report.initial = {
  ...report.initial,
  introComplete: await page.locator(".intro-key-art").evaluate((image) => image.complete && image.naturalWidth > 0),
  introNaturalWidth: await page.locator(".intro-key-art").evaluate((image) => image.naturalWidth),
  blankLoaderRemaining: await page.locator(".initial-asset-loading").count(),
};

await page.locator(".intro-start").click();
await page.locator(".save-slot-card").first().click();
await page.locator(".home-base-screen").waitFor({ state: "visible", timeout: 15_000 });
if (await page.locator(".base-dialogue:visible").count()) await page.keyboard.press("Escape");
await page.locator(".base-sortie-action").click();
await page.locator(".region-select-screen").waitFor({ state: "visible", timeout: 15_000 });
await page.locator(".region-map-hotspot").first().click();
await page.locator(".region-card").first().click();
await page.locator(".region-sortie-launch").click();
await page.locator(".sortie-cinematic").waitFor({ state: "visible", timeout: 15_000 });
if (await page.locator(".sortie-play-fallback:visible").count()) await page.locator(".sortie-play-fallback:visible").click();

await page.locator(".combat-runtime-shell.is-preparing canvas").waitFor({ state: "attached", timeout: 15_000 });
await page.locator(".combat-runtime-shell.is-preparing canvas").evaluate((canvas) => { canvas.dataset.preloadIdentity = "selected-runtime"; });
await page.waitForFunction(() => document.querySelector(".sortie-flight-status b")?.textContent?.includes("전장 준비 완료"), null, { timeout: 15_000 });
await page.waitForFunction(() => document.querySelector(".sortie-cinematic-video")?.currentTime >= 1, null, { timeout: 15_000 });

report.sortie.beforeVideoEnd = await page.evaluate(() => {
  const runtime = document.querySelector(".combat-runtime-shell");
  const stage = document.querySelector(".expedition-game");
  const resourceNames = performance.getEntriesByType("resource").map((entry) => entry.name);
  return {
    preparing: runtime?.classList.contains("is-preparing") || false,
    canvasCount: runtime?.querySelectorAll("canvas").length || 0,
    stageOpacity: stage ? getComputedStyle(stage).opacity : null,
    loadLabel: document.querySelector(".sortie-flight-status b")?.textContent?.trim() || "",
    routeTextureLoaded: resourceNames.some((name) => name.includes("sector-01-shattered-approach")),
    heroTextureLoaded: resourceNames.some((name) => name.includes("survivor-directional-aim-atlas")),
    bossRoomLoadedEarly: resourceNames.some((name) => name.includes("boss-chamber.webp")),
  };
});
await page.screenshot({ path: path.join(qaDir, "latest-loading-preload-sortie.png"), fullPage: true });

await page.locator(".combat-runtime-shell.is-live canvas").waitFor({ state: "visible", timeout: 15_000 });
report.sortie.afterVideoEnd = await page.evaluate(() => ({
  sameCanvas: document.querySelector(".combat-runtime-shell.is-live canvas")?.dataset.preloadIdentity === "selected-runtime",
  liveRuntime: document.querySelector(".combat-runtime-shell")?.classList.contains("is-live") || false,
  videoRemoved: !document.querySelector(".sortie-cinematic-video"),
  canvasWidth: document.querySelector("canvas")?.width || 0,
}));
await page.screenshot({ path: path.join(qaDir, "latest-loading-preload-combat.png"), fullPage: true });

if (!report.initial.loaderVisibleDuringColdDecode) report.errors.push("cold-load screen was not visible while the title image was delayed");
if (!report.initial.introComplete || report.initial.blankLoaderRemaining !== 0) report.errors.push("title art was exposed before decode completed");
if (!report.sortie.beforeVideoEnd.preparing || report.sortie.beforeVideoEnd.canvasCount !== 1) report.errors.push("selected Phaser runtime was not mounted behind the sortie video");
if (report.sortie.beforeVideoEnd.stageOpacity !== "0") report.errors.push("preparing runtime was visually exposed");
if (!report.sortie.beforeVideoEnd.routeTextureLoaded || !report.sortie.beforeVideoEnd.heroTextureLoaded) report.errors.push("selected route/common textures were not loaded during the video");
if (report.sortie.beforeVideoEnd.bossRoomLoadedEarly) report.errors.push("boss room loaded before route clear");
if (!report.sortie.afterVideoEnd.sameCanvas || !report.sortie.afterVideoEnd.liveRuntime || !report.sortie.afterVideoEnd.videoRemoved) report.errors.push("video completion recreated or failed to reveal the prepared runtime");

await writeFile(path.join(qaDir, "loading-preload-latest.json"), `${JSON.stringify(report, null, 2)}\n`);
await browser.close();

if (report.errors.length) {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}

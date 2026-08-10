import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/82105/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const qaDir = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = "http://127.0.0.1:4174/?debug=1";
const regions = Object.freeze([
  { id: "wrong-engine-core", index: 0, source: "wrong-engine-sortie.mp4", screenshot: "latest-sortie-wrong-engine-desktop-1440x810.png" },
  { id: "glass-dune", index: 1, source: "glass-dune-sortie.mp4", screenshot: "latest-sortie-glass-dune-desktop-1440x810.png" },
  { id: "abyssal-archive", index: 2, source: "abyssal-archive-sortie.mp4", screenshot: "latest-sortie-abyssal-archive-desktop-1440x810.png" },
]);

async function seedUnlockedCampaign(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(".intro-start").click();
  await page.locator(".save-slot-card").first().click();
  await page.locator(".home-base-screen").waitFor({ state: "visible", timeout: 15_000 });
  await page.evaluate(() => {
    const key = "train-me-wrong.overload.campaign.v2";
    const campaign = JSON.parse(localStorage.getItem(key));
    const slot = campaign.slots[0];
    slot.completedRegionIds = ["wrong-engine-core"];
    slot.homeBaseUnlocked = true;
    slot.baseUnlocked = true;
    slot.abilityGuideSeen = true;
    slot.combatOverlaySeen = true;
    slot.storyFlags = Array.from(new Set([
      ...(slot.storyFlags || []),
      "home-base-unlocked",
      "chapter-01-cleared",
      "ability-guide-complete",
      "combat-overlay-complete",
    ]));
    localStorage.setItem(key, JSON.stringify(campaign));
  });
}

async function openRegionDetail(page, index) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.locator(".intro-start").click();
  await page.locator(".save-slot-card").first().click();
  await page.locator(".home-base-screen").waitFor({ state: "visible", timeout: 15_000 });
  if (await page.locator(".base-dialogue:visible").count()) await page.keyboard.press("Escape");
  await page.locator(".airship-hotspot").click();
  await page.locator(".region-card").nth(index).click();
  await page.locator(".region-sortie-dialog").waitFor({ state: "visible" });
}

async function installTransitionProbe(page) {
  await page.evaluate(() => {
    const state = window.__sortieQa = {
      attachedAt: 0,
      metadataAt: 0,
      playingAt: 0,
      endedAt: 0,
      canvasAt: 0,
      duration: 0,
      width: 0,
      height: 0,
      source: "",
    };
    const attachVideo = (video) => {
      if (video.dataset.qaAttached) return;
      video.dataset.qaAttached = "1";
      state.attachedAt = performance.now();
      const readMetadata = () => {
        state.metadataAt = performance.now();
        state.duration = video.duration;
        state.width = video.videoWidth;
        state.height = video.videoHeight;
        state.source = video.currentSrc;
      };
      video.addEventListener("loadedmetadata", readMetadata, { once: true });
      video.addEventListener("playing", () => { state.playingAt = performance.now(); }, { once: true });
      video.addEventListener("ended", () => { state.endedAt = performance.now(); }, { once: true });
      if (video.readyState >= 1) readMetadata();
    };
    const scan = () => {
      const video = document.querySelector(".sortie-cinematic-video");
      if (video) attachVideo(video);
      if (!state.canvasAt && document.querySelector("canvas")) state.canvasAt = performance.now();
    };
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
    scan();
  });
}

async function runDesktopRegion(page, spec, errors) {
  await openRegionDetail(page, spec.index);
  await installTransitionProbe(page);
  const clickedAt = await page.evaluate(() => performance.now());
  await page.locator(".region-sortie-launch").click();
  const cinematic = page.locator(".sortie-cinematic");
  await cinematic.waitFor({ state: "visible", timeout: 10_000 });
  const fallback = page.locator(".sortie-play-fallback:visible");
  if (await fallback.count()) await fallback.click();
  await page.waitForFunction(() => window.__sortieQa?.playingAt > 0, null, { timeout: 10_000 });
  await page.waitForFunction(() => document.querySelector(".sortie-cinematic-video")?.currentTime >= 2, null, { timeout: 10_000 });
  const canvasBeforeEnded = await page.locator("canvas").count();
  await page.screenshot({ path: path.join(qaDir, spec.screenshot), fullPage: true });
  await page.locator("canvas").waitFor({ state: "visible", timeout: 15_000 });
  const probe = await page.evaluate(() => window.__sortieQa);
  const clickToCanvasMs = probe.canvasAt - clickedAt;
  const playbackMs = probe.endedAt - probe.playingAt;
  if (!probe.source.endsWith(spec.source)) errors.push(`${spec.id}: wrong source ${probe.source}`);
  if (Math.abs(probe.duration - 6) > 0.05) errors.push(`${spec.id}: duration ${probe.duration}`);
  if (probe.width !== 1264 || probe.height !== 720) errors.push(`${spec.id}: dimensions ${probe.width}x${probe.height}`);
  if (canvasBeforeEnded !== 0) errors.push(`${spec.id}: Phaser canvas mounted before cinematic ended`);
  if (playbackMs < 5_800 || playbackMs > 6_350) errors.push(`${spec.id}: playback ${playbackMs.toFixed(1)}ms`);
  if (clickToCanvasMs < 5_800 || clickToCanvasMs > 9_000) errors.push(`${spec.id}: click-to-canvas ${clickToCanvasMs.toFixed(1)}ms`);
  return { ...probe, clickToCanvasMs, playbackMs, canvasBeforeEnded };
}

async function verifyFirstSortieGuide(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 810 } });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4174/", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(".intro-start").click();
  await page.locator(".save-slot-card").first().click();
  await page.locator(".home-base-screen").waitFor({ state: "visible", timeout: 15_000 });
  if (await page.locator(".base-dialogue:visible").count()) await page.keyboard.press("Escape");
  await page.locator(".airship-hotspot").click();
  await page.locator(".region-card").first().click();
  await page.locator(".region-sortie-launch").click();
  await page.locator(".ability-guide-screen").waitFor({ state: "visible", timeout: 10_000 });
  const beforeBriefingComplete = {
    guide: await page.locator(".ability-guide-screen").count(),
    video: await page.locator(".sortie-cinematic-video").count(),
    canvas: await page.locator("canvas").count(),
  };
  for (let index = 0; index < 5 && await page.locator(".ability-guide-next:visible").count(); index += 1) {
    await page.locator(".ability-guide-next:visible").click();
    await page.waitForTimeout(100);
  }
  await page.locator(".sortie-cinematic-video").waitFor({ state: "visible", timeout: 10_000 });
  const afterBriefingComplete = {
    guide: await page.locator(".ability-guide-screen").count(),
    video: await page.locator(".sortie-cinematic-video").count(),
    canvas: await page.locator("canvas").count(),
    source: await page.locator(".sortie-cinematic-video").evaluate((video) => video.currentSrc),
  };
  await context.close();
  return { beforeBriefingComplete, afterBriefingComplete };
}

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
});
const pageErrors = [];
const failedResponses = [];
const errors = [];
const report = { desktop: {}, mobile: {}, pageErrors, failedResponses, errors };
try {
  report.firstSortie = await verifyFirstSortieGuide(browser);
  if (report.firstSortie.beforeBriefingComplete.guide !== 1
    || report.firstSortie.beforeBriefingComplete.video !== 0
    || report.firstSortie.beforeBriefingComplete.canvas !== 0) {
    errors.push("first-sortie: briefing must precede both video and Phaser");
  }
  if (report.firstSortie.afterBriefingComplete.guide !== 0
    || report.firstSortie.afterBriefingComplete.video !== 1
    || report.firstSortie.afterBriefingComplete.canvas !== 0
    || !report.firstSortie.afterBriefingComplete.source.endsWith("wrong-engine-sortie.mp4")) {
    errors.push("first-sortie: briefing completion must start region video before Phaser");
  }
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 810 } });
  const desktopPage = await desktop.newPage();
  desktopPage.on("pageerror", (error) => pageErrors.push(String(error)));
  desktopPage.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });
  desktopPage.on("console", (message) => {
    const location = message.location().url || "unknown";
    if (message.type() === "error" && !location.endsWith("/favicon.ico")) {
      pageErrors.push(`console:${message.text()} @ ${location}`);
    }
  });
  await seedUnlockedCampaign(desktopPage);
  for (const spec of regions) report.desktop[spec.id] = await runDesktopRegion(desktopPage, spec, errors);
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 812, height: 375 }, isMobile: true, hasTouch: true });
  const mobilePage = await mobile.newPage();
  mobilePage.on("pageerror", (error) => pageErrors.push(String(error)));
  mobilePage.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
  });
  await seedUnlockedCampaign(mobilePage);
  await openRegionDetail(mobilePage, 0);
  await mobilePage.locator(".region-sortie-launch").tap();
  await mobilePage.locator(".sortie-cinematic-video").waitFor({ state: "visible", timeout: 10_000 });
  if (await mobilePage.locator(".sortie-play-fallback:visible").count()) await mobilePage.locator(".sortie-play-fallback:visible").tap();
  await mobilePage.waitForFunction(() => document.querySelector(".sortie-cinematic-video")?.currentTime >= 2, null, { timeout: 10_000 });
  await mobilePage.screenshot({ path: path.join(qaDir, "latest-sortie-wrong-engine-mobile-812x375.png"), fullPage: true });
  report.mobile = await mobilePage.evaluate(() => {
    const rect = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    };
    return {
      viewport: { width: innerWidth, height: innerHeight },
      video: rect(".sortie-cinematic-video"),
      heading: rect(".sortie-cinematic-heading"),
      status: rect(".sortie-flight-status"),
    };
  });
  await mobile.close();
} finally {
  await browser.close();
}

if (pageErrors.length) errors.push(...pageErrors);
if (failedResponses.length) errors.push(...failedResponses);
await writeFile(path.join(qaDir, "sortie-cinematic-latest.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;

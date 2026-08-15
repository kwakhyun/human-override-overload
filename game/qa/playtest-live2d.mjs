import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/82105/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const qaDir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  args: ["--disable-gpu-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error" || message.type() === "warning") errors.push(`${message.type()}: ${message.text()}`);
});
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

async function openBase() {
  await page.goto("http://127.0.0.1:4174/", { waitUntil: "domcontentloaded" });
  await page.locator(".intro-start").click();
  await page.locator(".save-slot-card").first().click();
  await page.locator(".home-base-screen").waitFor({ state: "visible", timeout: 15_000 });
  if (await page.locator(".base-dialogue:visible").count()) await page.keyboard.press("Escape");
}

async function sampleMotion(canvas, sampleCount = 8, interval = 560) {
  const frames = [];
  for (let index = 0; index < sampleCount; index += 1) {
    frames.push(await canvas.screenshot());
    await page.waitForTimeout(interval);
  }
  return frames.some((frame, index) => index > 0 && !frame.equals(frames[0]));
}

async function sampleTouchAreas(canvas) {
  const selectors = [
    ".portrait-zone.is-head",
    ".portrait-zone.is-chest",
    ".portrait-zone.is-arm.is-left",
    ".portrait-zone.is-legs",
  ];
  const frames = [];
  for (const selector of selectors) {
    await page.locator(selector).click();
    await page.locator(".motion-portrait-speech").waitFor({ state: "visible" });
    await page.waitForTimeout(240);
    frames.push(await canvas.screenshot());
  }
  return new Set(frames.map((frame) => frame.toString("base64"))).size;
}

await openBase();
try {
  await page.locator('[data-live2d-ready="true"]').waitFor({ state: "attached", timeout: 8_000 });
} catch (error) {
  await page.screenshot({ path: path.join(qaDir, "live2d-load-failure.png"), fullPage: true });
  console.error(JSON.stringify({ errors, state: await page.locator(".cubism-character").getAttribute("class"), core: await page.evaluate(() => ({ loaded: Boolean(window.Live2DCubismCore), version: window.Live2DCubismCore?.Version?.csmGetVersion?.(), latestMoc: window.Live2DCubismCore?.Version?.csmGetLatestMocVersion?.() })) }, null, 2));
  throw error;
}
const aegisCanvas = page.locator('.cubism-character-canvas');
const aegisIdleMotionObserved = await sampleMotion(aegisCanvas);
const aegisBeforeReaction = await aegisCanvas.screenshot();
await page.locator(".portrait-zone.is-head").click();
await page.locator(".motion-portrait-speech").waitFor({ state: "visible" });
await page.waitForTimeout(240);
const aegisReactionFrame = await aegisCanvas.screenshot();
const aegisDistinctTouchFrames = await sampleTouchAreas(aegisCanvas);
await page.screenshot({ path: path.join(qaDir, "live2d-aegis.png"), fullPage: true });
const aegis = await page.locator(".cubism-character").evaluate((element) => ({
  ready: element.dataset.live2dReady,
  model: element.dataset.live2dModel,
  canvas: Boolean(element.querySelector("canvas")),
  canvasSize: element.querySelector("canvas") ? [element.querySelector("canvas").width, element.querySelector("canvas").height] : null,
  fallbackOpacity: element.querySelector("img") ? getComputedStyle(element.querySelector("img")).opacity : null,
  bounds: element.getBoundingClientRect().toJSON(),
}));
aegis.idleFramesDiffer = aegisIdleMotionObserved;
aegis.reactionFrameDiffers = !aegisBeforeReaction.equals(aegisReactionFrame);
aegis.distinctTouchFrames = aegisDistinctTouchFrames;

await page.evaluate(() => {
  const key = "train-me-wrong.overload.campaign.v2";
  const campaign = JSON.parse(localStorage.getItem(key));
  campaign.slots[0].completedRegionIds = Array.from(new Set([...(campaign.slots[0].completedRegionIds || []), "wrong-engine-core"]));
  campaign.slots[0].loadout = { ...(campaign.slots[0].loadout || {}), characterId: "mika" };
  localStorage.setItem(key, JSON.stringify(campaign));
});
await openBase();
await page.locator('[data-live2d-model="mika"][data-live2d-ready="true"]').waitFor({ state: "attached", timeout: 45_000 });
const mikaCanvas = page.locator('.cubism-character-canvas');
const mikaIdleMotionObserved = await sampleMotion(mikaCanvas);
const mikaBeforeReaction = await mikaCanvas.screenshot();
await page.locator(".portrait-zone.is-chest").click();
await page.locator(".motion-portrait-speech").waitFor({ state: "visible" });
await page.waitForTimeout(240);
const mikaReactionFrame = await mikaCanvas.screenshot();
const mikaDistinctTouchFrames = await sampleTouchAreas(mikaCanvas);
await page.screenshot({ path: path.join(qaDir, "live2d-mika.png"), fullPage: true });
const mika = await page.locator(".cubism-character").evaluate((element) => ({
  ready: element.dataset.live2dReady,
  model: element.dataset.live2dModel,
  canvas: Boolean(element.querySelector("canvas")),
  canvasSize: element.querySelector("canvas") ? [element.querySelector("canvas").width, element.querySelector("canvas").height] : null,
  fallbackOpacity: element.querySelector("img") ? getComputedStyle(element.querySelector("img")).opacity : null,
  bounds: element.getBoundingClientRect().toJSON(),
}));
mika.idleFramesDiffer = mikaIdleMotionObserved;
mika.reactionFrameDiffers = !mikaBeforeReaction.equals(mikaReactionFrame);
mika.distinctTouchFrames = mikaDistinctTouchFrames;

if (!aegis.idleFramesDiffer || !aegis.reactionFrameDiffers || aegis.distinctTouchFrames < 4) {
  throw new Error(`AEGIS Cubism interaction regression: ${JSON.stringify(aegis)}`);
}
if (!mika.idleFramesDiffer || !mika.reactionFrameDiffers || mika.distinctTouchFrames < 4) {
  throw new Error(`MIKA Cubism interaction regression: ${JSON.stringify(mika)}`);
}

console.log(JSON.stringify({ errors, aegis, mika }, null, 2));
await browser.close();

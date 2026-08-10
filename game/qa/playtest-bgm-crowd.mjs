import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/82105/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const qaDir = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = process.env.OVERLOAD_QA_URL || "http://127.0.0.1:4174/";
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH
  || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const errors = [];
const audioResponses = [];

const browser = await chromium.launch({ headless: true, executablePath });
const context = await browser.newContext({ viewport: { width: 1440, height: 810 } });
const page = await context.newPage();
page.on("console", (message) => {
  if (["error", "warning"].includes(message.type())) {
    const location = message.location();
    errors.push(`console:${message.type()}:${message.text()}:${location.url || "unknown"}:${location.lineNumber ?? 0}`);
  }
});
page.on("pageerror", (error) => errors.push(`page:${error.message}`));
page.on("response", (response) => {
  if (response.status() >= 400) errors.push(`http:${response.status()}:${response.url()}`);
  if (!response.url().toLowerCase().endsWith(".mp3")) return;
  audioResponses.push({
    url: response.url(),
    status: response.status(),
    contentType: response.headers()["content-type"] || "",
  });
});

async function unlockCampaign() {
  await page.evaluate(() => {
    const key = "train-me-wrong.overload.campaign.v2";
    const campaign = JSON.parse(localStorage.getItem(key) || '{"version":2,"slots":[null,null,null]}');
    const slot = campaign.slots?.[0];
    if (!slot) return;
    slot.completedRegionIds = Array.from(new Set([...(slot.completedRegionIds || []), "wrong-engine-core"]));
    slot.homeBaseUnlocked = true;
    slot.abilityGuideSeen = true;
    slot.combatOverlaySeen = true;
    slot.storyFlags = Array.from(new Set([...(slot.storyFlags || []), "home-base-unlocked", "chapter-01-cleared", "ability-guide-complete", "combat-overlay-complete"]));
    localStorage.setItem(key, JSON.stringify(campaign));
  });
}

async function enterBase() {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.locator(".intro-start").click();
  await page.locator(".save-slot-card").first().click();
  await page.locator(".home-base-screen").waitFor({ state: "visible", timeout: 15_000 });
  if (await page.locator(".base-dialogue:visible").count()) await page.keyboard.press("Escape");
}

async function readPlayingAudio(expectedFile) {
  await page.waitForFunction((file) => {
    const audio = document.querySelector("audio");
    return Boolean(audio?.currentSrc.includes(file) && audio.readyState >= 1);
  }, expectedFile, { timeout: 15_000 });
  await page.waitForTimeout(1_200);
  return page.locator("audio").evaluate((audio) => ({
    src: audio.currentSrc,
    paused: audio.paused,
    currentTime: audio.currentTime,
    duration: audio.duration,
    readyState: audio.readyState,
  }));
}

await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
await page.evaluate(() => localStorage.clear());
await enterBase();
const baseAudio = await readPlayingAudio("last-light-in-haven-09.mp3");
await page.screenshot({ path: path.join(qaDir, "latest-bgm-haven-09.png"), fullPage: true });
await unlockCampaign();

async function launchRegion(regionIndex, expectedFile, screenshotName) {
  await enterBase();
  await page.locator(".airship-hotspot").click();
  await page.locator(".region-card").nth(regionIndex).click();
  await page.locator(".region-sortie-launch").click();
  await page.locator("canvas").waitFor({ state: "visible", timeout: 30_000 });
  for (let index = 0; index < 10; index += 1) {
    const next = page.locator(".narrative-panel button:visible");
    if (!(await next.count())) break;
    await next.click();
    await page.waitForTimeout(120);
  }
  const audio = await readPlayingAudio(expectedFile);
  const hud = await page.locator(".expedition-hud").evaluate((element) => ({
    text: element.textContent,
    rect: element.getBoundingClientRect().toJSON(),
  }));
  await page.screenshot({ path: path.join(qaDir, screenshotName), fullPage: true });
  return { audio, hud };
}

const glassDune = await launchRegion(1, "refraction-war-glass-dune.mp3", "latest-bgm-glass-dune.png");
const abyssalArchive = await launchRegion(2, "memory-below-pressure-abyssal-archive.mp3", "latest-bgm-abyssal-archive.png");

const requiredAudioFiles = [
  "last-light-in-haven-09.mp3",
  "refraction-war-glass-dune.mp3",
  "memory-below-pressure-abyssal-archive.mp3",
];
for (const file of requiredAudioFiles) {
  if (!audioResponses.some((response) => response.url.includes(file) && [200, 206].includes(response.status))) {
    errors.push(`audio-response:${file}`);
  }
}
for (const [id, audio] of Object.entries({ base: baseAudio, glassDune: glassDune.audio, abyssalArchive: abyssalArchive.audio })) {
  if (audio.paused || audio.currentTime <= 0 || audio.readyState < 1) errors.push(`audio-not-playing:${id}:${JSON.stringify(audio)}`);
}

const report = {
  generatedAt: new Date().toISOString(),
  errors,
  baseAudio,
  glassDune,
  abyssalArchive,
  audioResponses,
};
await writeFile(path.join(qaDir, "playtest-bgm-crowd-latest.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
await browser.close();
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;

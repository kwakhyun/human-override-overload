import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/82105/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const qaDir = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = "http://127.0.0.1:4174/?debug=1";
const expected = [
  "emp-pulse-online.mp3",
  "aegis-ward-online.mp3",
  "stratos-run-confirmed.mp3",
  "helix-tempest-authorized.mp3",
];

const errors = [];
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 810 } });
const page = await context.newPage();

page.on("console", (message) => {
  if (message.type() === "error" && !message.text().includes("Failed to load resource")) errors.push(`console:${message.text()}`);
});
page.on("pageerror", (error) => errors.push(`page:${error.message}`));
page.on("response", (response) => {
  if (response.status() >= 400) errors.push(`http:${response.status()}:${response.url()}`);
});

await page.addInitScript(() => {
  const calls = [];
  const NativeAudio = globalThis.Audio;
  globalThis.Audio = function InstrumentedAudio(...args) {
    const audio = new NativeAudio(...args);
    const originalPlay = audio.play.bind(audio);
    audio.play = (...playArgs) => {
      if (audio.src.includes("/assets/audio/agent/")) calls.push({ src: audio.src, at: performance.now() });
      return originalPlay(...playArgs);
    };
    return audio;
  };
  globalThis.Audio.prototype = NativeAudio.prototype;
  globalThis.__agentVoiceQa = calls;
});

await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "domcontentloaded" });
await page.locator(".intro-start").click();
await page.locator(".save-slot-card").first().click();
await page.locator(".home-base-screen").waitFor({ state: "visible", timeout: 15_000 });
if (await page.locator(".base-dialogue:visible").count()) await page.keyboard.press("Escape");
await page.locator(".airship-hotspot").click();
await page.locator(".region-card").first().click();
await page.locator(".region-sortie-launch").click();
for (let step = 0; step < 5; step += 1) {
  const next = page.locator(".ability-guide-next:visible");
  if (!(await next.count())) break;
  await next.click();
  await page.waitForTimeout(80);
}
await page.locator("canvas").waitFor({ state: "visible", timeout: 30_000 });
await page.waitForTimeout(3_500);
const modalDeadline = Date.now() + 15_000;
let quietSince = 0;
while (Date.now() < modalDeadline) {
  const dialogue = page.locator(".narrative-panel button:visible");
  if (await dialogue.count()) {
    quietSince = 0;
    await dialogue.click();
    await page.waitForTimeout(120);
    continue;
  }
  const tutorialSkip = page.locator(".combat-tutorial-skip:visible");
  if (await tutorialSkip.count()) {
    quietSince = 0;
    await tutorialSkip.click();
    await page.waitForTimeout(120);
    continue;
  }
  if (!quietSince) quietSince = Date.now();
  if (Date.now() - quietSince > 900) break;
  await page.waitForTimeout(100);
}
await page.waitForTimeout(500);

const requestedAbilities = ["empPulse", "aegisWard", "stratosRun", "helixTempest"];
const abilityKeys = { empPulse: "KeyQ", aegisWard: "KeyE", stratosRun: "KeyF", helixTempest: "KeyR" };
const buttonLabelsBefore = {};
const buttonLabelsAfter = {};
await page.locator("canvas").click({ position: { x: 720, y: 405 } });
for (const ability of requestedAbilities) {
  const button = page.locator(`[data-combat-ability="${ability}"]`);
  await button.waitFor({ state: "visible", timeout: 10_000 });
  buttonLabelsBefore[ability] = await button.getAttribute("aria-label");
  await page.keyboard.press(abilityKeys[ability]);
  await page.waitForTimeout(260);
  buttonLabelsAfter[ability] = await button.getAttribute("aria-label");
}
await page.waitForTimeout(900);

const calls = await page.evaluate(() => globalThis.__agentVoiceQa || []);
const resourceEntriesBeforeFetch = await page.evaluate(() => performance.getEntriesByType("resource")
  .filter((entry) => entry.name.includes("/assets/audio/agent/"))
  .map((entry) => ({ name: entry.name.split("/").at(-1), transferSize: entry.transferSize, decodedBodySize: entry.decodedBodySize })));
const loaded = await page.evaluate(async (names) => Promise.all(names.map(async (name) => {
  const url = `/assets/audio/agent/${name}`;
  const response = await fetch(url);
  const bytes = await response.arrayBuffer();
  return { name, status: response.status, bytes: bytes.byteLength, contentType: response.headers.get("content-type") };
})), expected);
const metadata = await page.evaluate(async (names) => Promise.all(names.map((name) => new Promise((resolve) => {
  const audio = new Audio(`/assets/audio/agent/${name}`);
  audio.preload = "metadata";
  audio.addEventListener("loadedmetadata", () => resolve({ name, duration: audio.duration }), { once: true });
  audio.addEventListener("error", () => resolve({ name, duration: null }), { once: true });
}))), expected);
const playedNames = calls.map((entry) => entry.src.split("/").at(-1));
for (const name of expected) {
  if (!playedNames.includes(name)) errors.push(`missing-play:${name}`);
}
for (const asset of loaded) {
  if (asset.status !== 200 || asset.bytes <= 0 || !String(asset.contentType).includes("audio")) errors.push(`bad-asset:${JSON.stringify(asset)}`);
}
for (const asset of metadata) {
  if (!Number.isFinite(asset.duration) || asset.duration <= 0 || asset.duration > 6) errors.push(`bad-metadata:${JSON.stringify(asset)}`);
}

await page.screenshot({ path: path.join(qaDir, "agent-voice-latest.png"), fullPage: true });

const report = {
  generatedAt: new Date().toISOString(),
  url: page.url(),
  requestedAbilities,
  buttonLabelsBefore,
  buttonLabelsAfter,
  playedNames,
  resourceEntriesBeforeFetch,
  loaded,
  metadata,
  errors,
};
await writeFile(path.join(qaDir, "agent-voice-latest.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
await browser.close();
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;

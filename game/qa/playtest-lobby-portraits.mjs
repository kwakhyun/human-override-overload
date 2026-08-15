import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/82105/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const qaDir = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = process.env.OVERLOAD_QA_BASE_URL || "http://127.0.0.1:4174/";
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
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.locator(".intro-start").click();
  await page.locator(".save-slot-card").first().click();
  await page.locator(".home-base-screen").waitFor({ state: "visible", timeout: 15_000 });
  if (await page.locator(".base-dialogue:visible").count()) await page.keyboard.press("Escape");
}

async function inspectPortrait(characterId, expectedFile) {
  const stage = page.locator(`[data-portrait-renderer="original-illustration"].is-${characterId}`);
  await stage.waitFor({ state: "visible", timeout: 10_000 });
  const image = stage.locator(".motion-portrait-original");
  await page.waitForFunction(
    (selector) => {
      const element = document.querySelector(selector);
      return element?.complete && element.naturalWidth > 0;
    },
    `[data-portrait-renderer="original-illustration"].is-${characterId} .motion-portrait-original`,
  );
  const info = await stage.evaluate((element) => {
    const imageElement = element.querySelector(".motion-portrait-original");
    const stageBounds = element.getBoundingClientRect();
    const imageBounds = imageElement.getBoundingClientRect();
    return {
      renderer: element.dataset.portraitRenderer,
      source: imageElement.currentSrc,
      naturalSize: [imageElement.naturalWidth, imageElement.naturalHeight],
      hasCanvas: Boolean(element.querySelector("canvas")),
      stageBounds: stageBounds.toJSON(),
      imageBounds: imageBounds.toJSON(),
    };
  });
  if (!info.source.endsWith(expectedFile)) throw new Error(`${characterId} source mismatch: ${info.source}`);
  if (info.naturalSize[0] !== 941 || info.naturalSize[1] !== 1672) throw new Error(`${characterId} source dimensions changed`);
  if (info.hasCanvas) throw new Error(`${characterId} still mounts the rejected Cubism canvas`);

  await page.locator(".portrait-zone.is-head").click();
  await page.locator(".motion-portrait-speech").waitFor({ state: "visible" });
  const speech = await page.locator(".motion-portrait-speech").innerText();
  if (!speech.includes(characterId === "mika" ? "미카" : "이지스")) throw new Error(`${characterId} touch dialogue did not open`);
  return { ...info, speech };
}

await openBase();
const aegis = await inspectPortrait("aegis", "survivor-portrait.png");
await page.screenshot({ path: path.join(qaDir, "lobby-portrait-aegis.png"), fullPage: true });

await page.evaluate(() => {
  const key = "train-me-wrong.overload.campaign.v2";
  const campaign = JSON.parse(localStorage.getItem(key));
  campaign.slots[0].completedRegionIds = Array.from(new Set([...(campaign.slots[0].completedRegionIds || []), "wrong-engine-core"]));
  campaign.slots[0].loadout = { ...(campaign.slots[0].loadout || {}), characterId: "mika" };
  localStorage.setItem(key, JSON.stringify(campaign));
});
await openBase();
const mika = await inspectPortrait("mika", "mika-portrait.png");
await page.screenshot({ path: path.join(qaDir, "lobby-portrait-mika.png"), fullPage: true });

if (errors.length) throw new Error(`Lobby portrait browser errors: ${JSON.stringify(errors)}`);
console.log(JSON.stringify({ errors, aegis, mika }, null, 2));
await browser.close();

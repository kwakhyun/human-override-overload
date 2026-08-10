import { createRequire } from "node:module";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/82105/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const qaDir = path.dirname(fileURLToPath(import.meta.url));
const errors = [];
const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  args: ["--autoplay-policy=user-gesture-required"],
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    const location = message.location()?.url || "";
    if (message.type() === "error" && !location.includes("favicon")) {
      errors.push(`console: ${message.text()} @ ${location || "unknown"}`);
    }
  });
  await page.goto("http://127.0.0.1:4174/", { waitUntil: "domcontentloaded" });
  await page.locator(".intro-music-toggle").waitFor({ state: "visible" });
  const before = await page.locator("audio").evaluate((audio) => ({
    source: audio.getAttribute("src"),
    paused: audio.paused,
    duration: audio.duration,
  }));
  await page.locator(".intro-music-toggle").click();
  await page.waitForFunction(() => {
    const audio = document.querySelector("audio");
    return audio && !audio.paused && audio.currentTime > 0.08;
  }, null, { timeout: 10_000 });
  await page.screenshot({ path: path.join(qaDir, "latest-title-music-desktop-1440x810.png"), fullPage: true });
  const playing = await page.locator("audio").evaluate((audio) => ({
    source: audio.getAttribute("src"),
    paused: audio.paused,
    currentTime: audio.currentTime,
    duration: audio.duration,
    volume: audio.volume,
    muted: audio.muted,
  }));
  await page.locator(".intro-start").click();
  await page.locator(".save-slot-screen").waitFor({ state: "visible" });
  const afterLeave = await page.locator("audio").evaluate((audio) => ({
    source: audio.getAttribute("src"),
    paused: audio.paused,
    currentTime: audio.currentTime,
  }));
  if (!String(before.source).endsWith("under-ashen-skies-title.mp3")) errors.push("wrong title source");
  if (playing.paused || playing.currentTime <= 0 || playing.muted) errors.push("title music did not play after gesture");
  if (afterLeave.source !== null || !afterLeave.paused) errors.push("title music leaked beyond intro");
  const report = { before, playing, afterLeave, errors };
  await writeFile(path.join(qaDir, "title-music-latest.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}

if (errors.length) process.exitCode = 1;

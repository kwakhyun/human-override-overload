import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/82105/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const qaDir = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(qaDir, "runtime-profile-screenshots");
const baseUrl = process.env.OVERLOAD_QA_URL || "http://127.0.0.1:4174/";
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH
  || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const sampleFrames = Math.max(60, Number(process.env.OVERLOAD_QA_SAMPLE_FRAMES) || 240);
const outputTag = (process.env.OVERLOAD_QA_OUTPUT_TAG || "latest").replace(/[^a-z0-9_-]+/gi, "-");
const emulateLowEnd = process.env.OVERLOAD_QA_LOW_END === "1";
const cpuThrottleRate = Math.max(1, Number(process.env.OVERLOAD_QA_CPU_THROTTLE) || 1);
const activePlayerVfxKeys = Object.freeze([
  "overload-manual-ability-pixel-atlas",
  "overload-automatic-skill-pixel-atlas",
  "overload-sovereign-gate-motion-atlas",
]);
const retiredPlayerVfxKeys = Object.freeze([
  "overload-manual-ability-motion-atlas",
  "overload-skill-motion-atlas",
  "overload-omega-laser-motion-atlas",
]);

const requestedViewports = new Set((process.env.OVERLOAD_QA_VIEWPORTS || "").split(",").filter(Boolean));
const requestedScenarios = new Set((process.env.OVERLOAD_QA_SCENARIOS || "").split(",").filter(Boolean));

const viewports = [
  { id: "desktop-1440x810", viewport: { width: 1440, height: 810 }, mobile: false },
  { id: "mobile-landscape-812x375", viewport: { width: 812, height: 375 }, mobile: true },
].filter((viewport) => requestedViewports.size === 0 || requestedViewports.has(viewport.id));

const scenarios = [
  { id: "wrong-engine-route-220x620", scene: "arsenal", region: "wrong-engine-core", prime: true },
  { id: "wrong-engine-boss", scene: "boss", region: "wrong-engine-core", prime: false },
  { id: "glass-dune-boss", scene: "boss", region: "glass-dune", prime: false },
  { id: "abyssal-archive-boss", scene: "boss", region: "abyssal-archive", prime: false },
].filter((scenario) => requestedScenarios.size === 0 || requestedScenarios.has(scenario.id));

function mib(bytes) {
  return Math.round(bytes / 1024 / 1024 * 1000) / 1000;
}

async function startFreshRun(page, scene, region) {
  const url = new URL(baseUrl);
  url.searchParams.set("debug", "1");
  url.searchParams.set("scene", scene);
  url.searchParams.set("region", region);
  await page.goto(url.href, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "게임 시작" }).waitFor({ state: "visible", timeout: 30_000 });
  await page.getByRole("button", { name: "게임 시작" }).click();
  await page.locator(".save-slot-card").first().click();
  await page.locator(".home-base-screen").waitFor({ state: "visible", timeout: 15_000 });
  if (await page.locator(".base-dialogue:visible").count()) await page.keyboard.press("Escape");
  await page.locator(".airship-hotspot").click();
  const regionIndex = region === "glass-dune" ? 1 : region === "abyssal-archive" ? 2 : 0;
  await page.locator(".region-card").nth(regionIndex).click();
  await page.locator(".region-sortie-launch").click();
  await page.locator("canvas").waitFor({ state: "visible", timeout: 30_000 });
  await page.waitForFunction(() => Boolean(window.__OVERLOAD_QA__), null, { timeout: 30_000 });
  await page.waitForTimeout(2_000);

  for (let index = 0; index < 12; index += 1) {
    const next = page.locator(".narrative-panel button:visible");
    if (!(await next.count())) break;
    await next.click();
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(800);
}

async function profileScenario(page, viewportId, scenario) {
  await startFreshRun(page, scenario.scene, scenario.region);
  let fixture = null;
  if (scenario.prime) {
    fixture = await page.evaluate(() => window.__OVERLOAD_QA__?.primeDeterministicArsenal());
    if (fixture?.liveEnemies !== 220 || fixture?.playerProjectiles !== 620) {
      throw new Error(`Deterministic arsenal failed: ${JSON.stringify(fixture)}`);
    }
    await page.waitForFunction(() => {
      const keys = window.__OVERLOAD_QA__?.getSnapshot().textureMemory.sources.flatMap((source) => source.keys) ?? [];
      return [
        "overload-ally-hunter-drone-motion-v2",
        "overload-ally-pulse-sentry-motion-v2",
        "overload-ally-suppressor-drone-motion-v2",
      ].every((key) => keys.includes(key));
    }, null, { timeout: 30_000 });
    await page.waitForTimeout(500);
  }

  await page.evaluate(() => window.__OVERLOAD_QA__?.reset());
  const snapshot = await page.evaluate(
    ({ minimum }) => window.__OVERLOAD_QA__?.waitForSamples(minimum, 30_000),
    { minimum: sampleFrames },
  );
  if (!snapshot || snapshot.frames.scene.count < sampleFrames) {
    throw new Error(`Insufficient scene samples for ${viewportId}/${scenario.id}`);
  }
  if (scenario.prime && (snapshot.context.liveEnemies !== 220 || snapshot.context.playerProjectiles !== 620)) {
    throw new Error(`Observed arsenal counts drifted: ${JSON.stringify(snapshot.context)}`);
  }
  const playerVfxSources = activePlayerVfxKeys.map((key) => {
    const source = snapshot.textureMemory.sources.find((entry) => entry.keys.includes(key));
    if (!source) throw new Error(`${key} is missing from TextureManager in ${viewportId}/${scenario.id}`);
    return { key, width: source.width, height: source.height, decodedRgba8Bytes: source.decodedRgba8Bytes };
  });
  const loadedKeys = snapshot.textureMemory.sources.flatMap((source) => source.keys);
  const retiredLoaded = retiredPlayerVfxKeys.filter((key) => loadedKeys.includes(key));
  if (retiredLoaded.length) throw new Error(`Retired VFX textures are still resident: ${retiredLoaded.join(", ")}`);

  const screenshot = path.join(screenshotDir, `${viewportId}-${scenario.id}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  return {
    id: `${viewportId}/${scenario.id}`,
    viewport: viewportId,
    scenario: scenario.id,
    fixture,
    playerVfxTextures: playerVfxSources,
    screenshot: path.relative(qaDir, screenshot).replaceAll("\\", "/"),
    snapshot,
  };
}

function markdownReport(report) {
  const lines = [
    "# Phaser runtime profile",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `Samples per scenario: ${report.sampleFrames}`,
    "",
    `Low-end emulation: ${report.emulateLowEnd ? `enabled (2 cores / 2 GiB / DPR 2, CPU ×${report.cpuThrottleRate})` : "disabled"}.`,
    "",
    `Active pixel-skill + dedicated gate textures present: ${report.results.filter((result) => result.playerVfxTextures?.length === activePlayerVfxKeys.length).length}/${report.results.length} scenarios (${activePlayerVfxKeys.join(", ")}).`,
    "",
    `Retired high-resolution skill textures resident: 0/${retiredPlayerVfxKeys.length} (${retiredPlayerVfxKeys.join(", ")}).`,
    "",
    "The 220-enemy / 620-projectile route fixture also requests all three optional ally motion atlases before sampling.",
    "",
    "| Viewport / scenario | Quality | Observed actors | scene P95 | rAF P95 | render-submit P95 | dropped scene | loaded texture | decoded RGBA8 | route | boss |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
  ];
  for (const result of report.results) {
    const snapshot = result.snapshot;
    const actors = `${snapshot.context.liveEnemies ?? 0}E / ${snapshot.context.playerProjectiles ?? 0}P`;
    lines.push(`| ${result.id} | ${snapshot.context.quality || "?"} | ${actors} | ${snapshot.frames.scene.p95Ms} ms | ${snapshot.frames.raf.p95Ms} ms | ${snapshot.frames.renderSubmitCpu.p95Ms} ms | ${(snapshot.frames.scene.droppedFrameRatio * 100).toFixed(1)}% | ${mib(snapshot.textureMemory.loadedTextureBytes)} MiB | ${mib(snapshot.textureMemory.decodedRgba8Bytes)} MiB | ${mib(snapshot.textureMemory.categories.route.decodedRgba8Bytes)} MiB | ${mib(snapshot.textureMemory.categories.boss.decodedRgba8Bytes)} MiB |`);
  }
  lines.push(
    "",
    "## Measurement limits",
    "",
    "- `loaded texture` is the deduplicated Resource Timing encoded-body size for same-document image assets; it can include DOM preview images as well as Phaser textures.",
    "- `decoded RGBA8` is the deduplicated `width × height × 4` footprint of sources registered in Phaser TextureManager.",
    "- Normal browser JavaScript cannot read physical VRAM allocation, driver padding, mipmap copies, render targets, compositor copies, or image-cache residency.",
    "- `render-submit` measures CPU wall time between Phaser pre-render and post-render events; it does not wait for GPU completion.",
    "- Headless Edge performance and GPU identity may differ from a visible browser.",
    "",
  );
  return `${lines.join("\n")}\n`;
}

await mkdir(screenshotDir, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath,
  args: [
    "--disable-gpu-sandbox",
    "--enable-gpu-rasterization",
    "--ignore-gpu-blocklist",
  ],
});

const errors = [];
const results = [];
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: viewport.viewport,
      deviceScaleFactor: emulateLowEnd ? 2 : 1,
      isMobile: viewport.mobile,
      hasTouch: viewport.mobile,
    });
    const page = await context.newPage();
    if (emulateLowEnd) {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "hardwareConcurrency", { configurable: true, get: () => 2 });
        Object.defineProperty(navigator, "deviceMemory", { configurable: true, get: () => 2 });
      });
    }
    if (cpuThrottleRate > 1) {
      const cdp = await context.newCDPSession(page);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpuThrottleRate });
    }
    page.on("console", (message) => {
      if (message.type() === "error" && !message.text().includes("Failed to load resource")) {
        errors.push(`${viewport.id}:console:${message.text()}`);
      }
    });
    page.on("pageerror", (error) => errors.push(`${viewport.id}:page:${error.message}`));
    for (const scenario of scenarios) results.push(await profileScenario(page, viewport.id, scenario));
    await context.close();
  }
} finally {
  await browser.close();
}

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  executablePath,
  sampleFrames,
  emulateLowEnd,
  cpuThrottleRate,
  results,
  errors,
};
await writeFile(path.join(qaDir, `runtime-profile-${outputTag}.json`), `${JSON.stringify(report, null, 2)}\n`, "utf8");
await writeFile(path.join(qaDir, `runtime-profile-${outputTag}.md`), markdownReport(report), "utf8");
process.stdout.write(`${JSON.stringify({
  generatedAt: report.generatedAt,
  sampleFrames,
  errors,
  results: results.map((result) => ({
    id: result.id,
    context: result.snapshot.context,
    renderer: result.snapshot.renderer,
    scene: result.snapshot.frames.scene,
    raf: result.snapshot.frames.raf,
    renderSubmitCpu: result.snapshot.frames.renderSubmitCpu,
    playerVfxTextures: result.playerVfxTextures,
    loadedTextureMiB: mib(result.snapshot.textureMemory.loadedTextureBytes),
    loadedTextureKnownSources: result.snapshot.textureMemory.loadedTextureBytesKnownSources,
    decodedRgba8MiB: mib(result.snapshot.textureMemory.decodedRgba8Bytes),
    routeRgba8MiB: mib(result.snapshot.textureMemory.categories.route.decodedRgba8Bytes),
    bossRgba8MiB: mib(result.snapshot.textureMemory.categories.boss.decodedRgba8Bytes),
  })),
}, null, 2)}\n`);
if (errors.length) process.exitCode = 1;

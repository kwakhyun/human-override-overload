import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/82105/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const qaDir = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = "http://127.0.0.1:4174/";

async function startFreshRun(page, scene = "") {
  const url = scene ? `${baseUrl}?debug=1&scene=${encodeURIComponent(scene)}` : baseUrl;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "게임 시작" }).waitFor({ state: "visible" });
  await page.getByRole("button", { name: "게임 시작" }).click();
  await page.locator(".save-slot-card").first().click();
  await page.locator("canvas").waitFor({ state: "visible", timeout: 30_000 });
  await page.waitForTimeout(3_500);
  for (let index = 0; index < 10; index += 1) {
    const next = page.locator(".narrative-panel button:visible");
    if (!(await next.count())) break;
    await next.click();
    await page.waitForTimeout(180);
  }
  await page.waitForTimeout(700);
}

async function openFirstSortieGuide(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "게임 시작" }).click();
  await page.locator(".save-slot-card").first().click();
  await page.locator(".ability-guide-screen").waitFor({ state: "visible", timeout: 15_000 });
}

async function enterFirstCombatTutorial(page) {
  for (let step = 0; step < 4; step += 1) {
    const next = page.locator(".ability-guide-next:visible");
    if (!(await next.count())) break;
    await next.click();
    await page.waitForTimeout(120);
  }
  await page.locator("canvas").waitFor({ state: "visible", timeout: 30_000 });
  await page.waitForTimeout(800);
  for (let line = 0; line < 10; line += 1) {
    const nextDialogue = page.locator(".narrative-panel button:visible");
    if (!(await nextDialogue.count())) break;
    await nextDialogue.click();
    await page.waitForTimeout(140);
  }
  await page.locator(".combat-tutorial-layer").waitFor({ state: "visible", timeout: 15_000 });
}

function watchPage(page, label, errors) {
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("Failed to load resource")) {
      errors.push(`${label}:console:${message.text()}`);
    }
  });
  page.on("pageerror", (error) => errors.push(`${label}:page:${error.message}`));
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`${label}:http:${response.status()}:${response.url()}`);
  });
}

async function box(page, selector) {
  const locator = page.locator(selector).first();
  return (await locator.count()) ? locator.boundingBox() : null;
}

function overlaps(a, b) {
  if (!a || !b) return false;
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  args: ["--disable-gpu-sandbox"],
});

const errors = [];
const report = {};

try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 1 });
  const desktopPage = await desktop.newPage();
  watchPage(desktopPage, "desktop", errors);
  await startFreshRun(desktopPage, "trace1");

  const canvas = await box(desktopPage, "canvas");
  if (canvas) {
    await desktopPage.mouse.move(canvas.x + canvas.width * 0.82, canvas.y + canvas.height * 0.34);
    await desktopPage.keyboard.down("KeyW");
    await desktopPage.keyboard.down("KeyD");
    await desktopPage.waitForTimeout(500);
    await desktopPage.keyboard.up("KeyD");
    await desktopPage.keyboard.up("KeyW");
  }
  await desktopPage.waitForTimeout(300);
  await desktopPage.screenshot({ path: path.join(qaDir, "latest-combat-desktop-1440x810.png"), fullPage: true });

  const dock = await box(desktopPage, ".expedition-combat-dock");
  const minimap = await box(desktopPage, ".route-minimap");
  const progress = await box(desktopPage, ".progress-hud");
  const buttons = await desktopPage.locator(".combat-ability-chip").evaluateAll((items) => items.map((item) => ({
    label: item.getAttribute("aria-label"),
    text: item.textContent?.replace(/\s+/g, " ").trim(),
  })));
  report.desktop = {
    dock,
    minimap,
    progress,
    dockOverlapsMinimap: overlaps(dock, minimap),
    dockOverlapsProgress: overlaps(dock, progress),
    buttons,
  };

  await desktopPage.keyboard.press("Escape");
  await desktopPage.getByRole("heading", { name: "PAUSED" }).waitFor();
  await desktopPage.screenshot({ path: path.join(qaDir, "latest-pause-desktop-1440x810.png"), fullPage: true });
  await desktopPage.getByRole("button", { name: /계속/ }).click();
  await desktopPage.locator(".expedition-pause").waitFor({ state: "hidden" });

  await desktopPage.keyboard.press("KeyQ");
  await desktopPage.waitForTimeout(180);
  await desktopPage.screenshot({ path: path.join(qaDir, "latest-null-snare-desktop-1440x810.png"), fullPage: true });

  await startFreshRun(desktopPage, "trace1");
  await desktopPage.keyboard.press("KeyE");
  await desktopPage.waitForTimeout(180);
  await desktopPage.screenshot({ path: path.join(qaDir, "latest-aegis-ward-desktop-1440x810.png"), fullPage: true });
  report.desktop.afterKeyboardActives = await desktopPage.locator(".combat-ability-chip").evaluateAll((items) => items.map((item) => item.getAttribute("aria-label")));

  await startFreshRun(desktopPage, "trace1");
  const stratosCanvas = await box(desktopPage, "canvas");
  if (stratosCanvas) await desktopPage.mouse.move(stratosCanvas.x + stratosCanvas.width * 0.78, stratosCanvas.y + stratosCanvas.height * 0.45);
  const stratos = desktopPage.locator('.combat-ability-chip[aria-label^="F STRATOS RUN"]');
  await stratos.click();
  await desktopPage.waitForTimeout(860);
  await desktopPage.screenshot({ path: path.join(qaDir, "latest-stratos-run-desktop-1440x810.png"), fullPage: true });
  report.desktop.stratosAfterClick = await stratos.getAttribute("aria-label");

  await startFreshRun(desktopPage, "trace1");
  await desktopPage.keyboard.press("KeyR");
  await desktopPage.waitForTimeout(320);
  await desktopPage.screenshot({ path: path.join(qaDir, "latest-helix-tempest-desktop-1440x810.png"), fullPage: true });
  report.desktop.helixAfterKeyboard = await desktopPage.locator('.combat-ability-chip[aria-label^="R HELIX TEMPEST"]').getAttribute("aria-label");

  await startFreshRun(desktopPage, "weakness");
  await desktopPage.waitForTimeout(2_200);
  await desktopPage.screenshot({ path: path.join(qaDir, "latest-boss-charge-desktop-1440x810.png"), fullPage: true });
  report.desktop.bossPhaseText = await desktopPage.locator(".route-objective").first().innerText().catch(() => "");

  await openFirstSortieGuide(desktopPage);
  report.desktop.guideTabs = await desktopPage.locator(".ability-guide-tabs button").evaluateAll((items) => items.map((item) => item.textContent?.replace(/\s+/g, " ").trim()));
  await desktopPage.locator(".ability-guide-tabs button").last().click();
  await desktopPage.screenshot({ path: path.join(qaDir, "latest-rhea-guide-desktop-1440x810.png"), fullPage: true });
  report.desktop.guideSeparation = await desktopPage.locator(".ability-circuit-separation").innerText();
  report.desktop.guideTypography = await desktopPage.locator(".ability-guide-copy > p").evaluate((element) => {
    const style = getComputedStyle(element);
    return { fontSize: style.fontSize, lineHeight: style.lineHeight };
  });
  await enterFirstCombatTutorial(desktopPage);
  await desktopPage.screenshot({ path: path.join(qaDir, "latest-combat-tutorial-desktop-1440x810.png"), fullPage: true });
  report.desktop.combatTutorial = {
    card: await box(desktopPage, ".combat-tutorial-card"),
    target: await box(desktopPage, ".combat-ability-chip.is-tutorial-target"),
    targetLabel: await desktopPage.locator(".combat-ability-chip.is-tutorial-target").getAttribute("aria-label"),
  };
  await desktop.close();

  const mobile = await browser.newContext({
    viewport: { width: 812, height: 375 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobile.newPage();
  watchPage(mobilePage, "mobile", errors);
  await openFirstSortieGuide(mobilePage);
  await mobilePage.locator(".ability-guide-tabs button").last().tap();
  await mobilePage.screenshot({ path: path.join(qaDir, "latest-rhea-guide-mobile-812x375.png"), fullPage: true });
  report.mobileGuide = {
    tabCount: await mobilePage.locator(".ability-guide-tabs button").count(),
    portrait: await box(mobilePage, ".ability-guide-rhea"),
    console: await box(mobilePage, ".ability-guide-console"),
  };
  await enterFirstCombatTutorial(mobilePage);
  await mobilePage.screenshot({ path: path.join(qaDir, "latest-combat-tutorial-mobile-812x375.png"), fullPage: true });
  report.mobileGuide.combatTutorial = {
    card: await box(mobilePage, ".combat-tutorial-card"),
    target: await box(mobilePage, ".combat-ability-chip.is-tutorial-target"),
    targetLabel: await mobilePage.locator(".combat-ability-chip.is-tutorial-target").getAttribute("aria-label"),
  };
  await startFreshRun(mobilePage, "trace1");
  await mobilePage.screenshot({ path: path.join(qaDir, "latest-combat-mobile-812x375.png"), fullPage: true });
  const mobileDock = await box(mobilePage, ".expedition-combat-dock");
  const mobileMap = await box(mobilePage, ".route-minimap");
  const mobileDpad = await box(mobilePage, ".touch-dpad");
  report.mobile = {
    dock: mobileDock,
    minimap: mobileMap,
    dpad: mobileDpad,
    dockOverlapsMinimap: overlaps(mobileDock, mobileMap),
    dockOverlapsDpad: overlaps(mobileDock, mobileDpad),
    landscapeGuardVisible: await mobilePage.locator(".landscape-guard:visible").count(),
    buttonCount: await mobilePage.locator(".combat-ability-chip").count(),
  };

  const mobileSnare = mobilePage.locator('.combat-ability-chip[aria-label^="Q NULL SNARE"]');
  await mobileSnare.tap();
  await mobilePage.waitForTimeout(180);
  report.mobile.snareAfterTap = await mobileSnare.getAttribute("aria-label");

  await mobilePage.keyboard.press("Escape");
  await mobilePage.getByRole("heading", { name: "PAUSED" }).waitFor();
  await mobilePage.screenshot({ path: path.join(qaDir, "latest-pause-mobile-812x375.png"), fullPage: true });
  await mobile.close();
} finally {
  await browser.close();
}

report.errors = errors;
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (errors.length) process.exitCode = 1;

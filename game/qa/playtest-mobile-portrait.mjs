import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/82105/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const qaDir = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = "http://127.0.0.1:4174/?debug=1";
const campaignKey = "train-me-wrong.overload.campaign.v2";

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  args: ["--disable-gpu-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
page.on("requestfailed", (request) => {
  const reason = request.failure()?.errorText || "failed";
  if (reason === "net::ERR_ABORTED" && request.url().includes("/assets/audio/")) return;
  errors.push(`request: ${request.url()} ${reason}`);
});

try {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(({ key }) => {
    localStorage.setItem(key, JSON.stringify({
      version: 2,
      slots: [{
        id: "slot-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedRegionIds: [],
        storyFlags: ["home-base-unlocked", "ability-guide-complete", "combat-overlay-complete"],
        homeBaseUnlocked: true,
        abilityGuideSeen: true,
        combatOverlaySeen: true,
        regionRecords: {},
      }, null, null],
    }));
  }, { key: campaignKey });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(".initial-asset-loading").waitFor({ state: "detached", timeout: 30_000 });
  await page.locator(".intro-start:not([disabled])").waitFor({ state: "visible", timeout: 30_000 });
  await page.screenshot({ path: path.join(qaDir, "mobile-portrait-title-390x844.png"), fullPage: false });
  const introMetrics = await page.evaluate(() => {
    const title = document.querySelector(".intro-minimal-content h1");
    const start = document.querySelector(".intro-start")?.getBoundingClientRect();
    const mobileControls = document.querySelector(".intro-mobile-controls");
    const desktopControls = document.querySelector(".intro-minimal-controls");
    return {
      titleFont: title ? Number.parseFloat(getComputedStyle(title).fontSize) : 0,
      startHeight: start?.height || 0,
      startWidth: start?.width || 0,
      mobileControlsDisplay: mobileControls ? getComputedStyle(mobileControls).display : "missing",
      desktopControlsDisplay: desktopControls ? getComputedStyle(desktopControls).display : "missing",
      mobileControlHeights: mobileControls ? [...mobileControls.children].map((node) => node.getBoundingClientRect().height) : [],
    };
  });
  assert.ok(introMetrics.titleFont >= 58, JSON.stringify(introMetrics));
  assert.ok(introMetrics.startHeight >= 56 && introMetrics.startWidth >= 300, JSON.stringify(introMetrics));
  assert.equal(introMetrics.mobileControlsDisplay, "grid", JSON.stringify(introMetrics));
  assert.equal(introMetrics.desktopControlsDisplay, "none", JSON.stringify(introMetrics));
  assert.ok(introMetrics.mobileControlHeights.every((height) => height >= 42), JSON.stringify(introMetrics));
  await page.locator(".intro-start").tap();
  await page.locator(".save-slot-screen").waitFor({ state: "visible" });
  await page.screenshot({ path: path.join(qaDir, "mobile-portrait-save-slots-390x844.png"), fullPage: false });
  const slotMetrics = await page.locator(".save-slot-card").evaluateAll((cards) => cards.map((card) => {
    const box = card.getBoundingClientRect();
    return { left: box.left, top: box.top, width: box.width, height: box.height, font: Number.parseFloat(getComputedStyle(card.querySelector("strong")).fontSize) };
  }));
  assert.equal(slotMetrics.length, 3);
  assert.ok(slotMetrics.every((slot) => slot.width >= 350 && slot.height >= 170 && slot.font >= 18), JSON.stringify(slotMetrics));
  assert.ok(slotMetrics[1].top > slotMetrics[0].top + slotMetrics[0].height - 1, JSON.stringify(slotMetrics));
  await page.locator(".save-slot-card").first().tap();
  await page.locator(".home-base-screen").waitFor({ state: "visible", timeout: 20_000 });
  if (await page.locator(".base-dialogue:visible").count()) await page.keyboard.press("Escape");
  await page.screenshot({ path: path.join(qaDir, "mobile-portrait-home-390x844.png"), fullPage: false });

  const homeMetrics = await page.evaluate(() => {
    const currency = document.querySelector(".base-currency-rail")?.getBoundingClientRect();
    const actions = document.querySelector(".base-primary-actions")?.getBoundingClientRect();
    return {
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      currency: currency && { left: currency.left, right: currency.right, top: currency.top, bottom: currency.bottom },
      actions: actions && { left: actions.left, right: actions.right, top: actions.top, bottom: actions.bottom },
    };
  });
  assert.ok(homeMetrics.scrollWidth <= homeMetrics.width + 1, JSON.stringify(homeMetrics));
  assert.ok(homeMetrics.currency && homeMetrics.currency.left >= 0 && homeMetrics.currency.right <= 390);
  assert.ok(homeMetrics.actions && homeMetrics.actions.left >= 0 && homeMetrics.actions.right <= 390 && homeMetrics.actions.bottom <= 844);

  await page.locator(".base-sortie-action").tap();
  await page.locator(".region-world-map").waitFor({ state: "visible" });
  await page.screenshot({ path: path.join(qaDir, "mobile-portrait-world-map-390x844.png"), fullPage: false });
  const hotspotMetrics = await page.locator(".region-map-hotspot").first().evaluate((node) => {
    const box = node.getBoundingClientRect();
    return { left: box.left, right: box.right, width: box.width, height: box.height, nameFont: Number.parseFloat(getComputedStyle(node.querySelector("strong")).fontSize) };
  });
  assert.ok(hotspotMetrics.left >= 0 && hotspotMetrics.right <= 390 && hotspotMetrics.width >= 250 && hotspotMetrics.height >= 84 && hotspotMetrics.nameFont >= 18, JSON.stringify(hotspotMetrics));
  await page.locator(".region-map-hotspot").first().tap();
  await page.locator(".region-card").first().waitFor({ state: "visible" });
  const regionCard = await page.locator(".region-card").first().boundingBox();
  assert.ok(regionCard && regionCard.width >= 300, JSON.stringify(regionCard));
  const swipeHint = await page.locator(".region-mobile-swipe-hint").boundingBox();
  assert.ok(swipeHint && swipeHint.height >= 40 && swipeHint.x >= 0 && swipeHint.x + swipeHint.width <= 390, JSON.stringify(swipeHint));
  await page.screenshot({ path: path.join(qaDir, "mobile-portrait-region-list-390x844.png"), fullPage: false });
  await page.locator(".region-card").first().tap();
  await page.locator(".region-sortie-dialog").waitFor({ state: "visible" });
  await page.screenshot({ path: path.join(qaDir, "mobile-portrait-sortie-390x844.png"), fullPage: false });
  const launch = page.locator(".region-sortie-launch");
  await launch.scrollIntoViewIfNeeded();
  await launch.tap();
  await page.locator("canvas").waitFor({ state: "visible", timeout: 30_000 });
  await page.locator(".combat-runtime-shell.is-live").waitFor({ state: "visible", timeout: 30_000 });
  await page.locator(".narrative-panel").waitFor({ state: "visible", timeout: 10_000 });
  for (let index = 0; index < 8; index += 1) {
    const next = page.locator(".narrative-panel button:visible");
    if (!(await next.count())) break;
    await next.tap();
    await page.waitForTimeout(120);
  }
  await page.waitForFunction(() => Boolean(window.__OVERLOAD_QA__?.getSnapshot?.()), null, { timeout: 20_000 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(qaDir, "mobile-portrait-combat-390x844.png"), fullPage: false });

  const before = await page.evaluate(() => window.__OVERLOAD_QA__.getSnapshot().context);
  assert.equal(before.mobileAutoAim, true);
  assert.equal(before.portraitPresentation, true);
  assert.ok(before.liveEnemies > 0);
  assert.equal(await page.locator(".landscape-guard").count(), 0);

  const frame = await page.locator(".expedition-canvas-frame").boundingBox();
  assert.ok(frame && frame.width >= 389 && frame.height >= 843, JSON.stringify(frame));
  const pauseButton = page.locator(".expedition-pause-toggle");
  const pauseButtonMetrics = await pauseButton.evaluate((node) => {
    const box = node.getBoundingClientRect();
    return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height };
  });
  assert.ok(
    pauseButtonMetrics.width >= 47 && pauseButtonMetrics.height >= 47
      && pauseButtonMetrics.left >= 0 && pauseButtonMetrics.right <= 390
      && pauseButtonMetrics.top >= 0 && pauseButtonMetrics.bottom <= 844,
    JSON.stringify(pauseButtonMetrics),
  );
  await pauseButton.tap();
  await page.locator(".expedition-pause").waitFor({ state: "visible" });
  const pauseMetrics = await page.evaluate(() => ({
    titleFont: Number.parseFloat(getComputedStyle(document.querySelector(".expedition-pause-card h2")).fontSize),
    buttons: [...document.querySelectorAll(".expedition-pause-card button")].map((button) => ({
      height: button.getBoundingClientRect().height,
      font: Number.parseFloat(getComputedStyle(button).fontSize),
    })),
  }));
  assert.ok(pauseMetrics.titleFont >= 35, JSON.stringify(pauseMetrics));
  assert.ok(pauseMetrics.buttons.every((button) => button.height >= 55 && button.font >= 13), JSON.stringify(pauseMetrics));
  await page.screenshot({ path: path.join(qaDir, "mobile-portrait-pause-390x844.png"), fullPage: false });
  await page.locator(".pause-resume").tap();
  await page.locator(".expedition-pause").waitFor({ state: "detached" });
  const start = { x: frame.x + 105, y: frame.y + 430 };
  const finish = { x: start.x + 82, y: start.y };
  const session = await context.newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: start.x, y: start.y, id: 7, radiusX: 1, radiusY: 1, force: 1 }] });
  for (const progress of [0.35, 0.7, 1]) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: start.x + (finish.x - start.x) * progress, y: finish.y, id: 7, radiusX: 1, radiusY: 1, force: 1 }],
    });
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(750);
  assert.equal(await page.locator(".floating-touch-joystick.is-active").count(), 1);
  await page.screenshot({ path: path.join(qaDir, "mobile-portrait-joystick-390x844.png"), fullPage: false });
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(180);
  const after = await page.evaluate(() => window.__OVERLOAD_QA__.getSnapshot().context);
  assert.ok(after.playerX > before.playerX + 8, `player should move right: ${before.playerX} -> ${after.playerX}`);
  assert.equal(await page.locator(".floating-touch-joystick.is-active").count(), 0);

  const layout = await page.evaluate(() => {
    const rect = (selector) => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const box = node.getBoundingClientRect();
      return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height };
    };
    return {
      viewport: { width: innerWidth, height: innerHeight },
      dock: rect(".expedition-combat-dock"),
      minimap: rect(".route-minimap"),
      objective: rect(".route-objective"),
      objectiveFont: Number.parseFloat(getComputedStyle(document.querySelector(".route-objective strong")).fontSize),
      abilityLabelFont: Number.parseFloat(getComputedStyle(document.querySelector(".combat-ability-copy strong")).fontSize),
      abilityLabelDisplay: getComputedStyle(document.querySelector(".combat-ability-copy")).display,
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  for (const [name, box] of Object.entries({ dock: layout.dock, minimap: layout.minimap, objective: layout.objective })) {
    assert.ok(box && box.left >= -1 && box.top >= -1 && box.right <= layout.viewport.width + 1 && box.bottom <= layout.viewport.height + 1, `${name}: ${JSON.stringify(box)}`);
  }
  assert.ok(layout.objectiveFont >= 16 && layout.abilityLabelFont >= 10 && layout.abilityLabelDisplay !== "none", JSON.stringify(layout));
  assert.ok(layout.horizontalOverflow <= 1, JSON.stringify(layout));
  assert.deepEqual(errors, []);

  console.log(JSON.stringify({ result: "pass", introMetrics, slotMetrics, homeMetrics, hotspotMetrics, pauseButtonMetrics, pauseMetrics, runtime: after, layout, errors }, null, 2));
} finally {
  await browser.close();
}

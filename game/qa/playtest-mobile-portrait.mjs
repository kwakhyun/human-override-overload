import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/82105/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const qaDir = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = "http://127.0.0.1:4174/?debug=1";
const campaignKey = "train-me-wrong.overload.campaign.v2";
const viewport = {
  width: Number.parseInt(process.argv[2] || "390", 10),
  height: Number.parseInt(process.argv[3] || "844", 10),
};
const screenshotSuffix = `${viewport.width}x${viewport.height}`;

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  args: ["--disable-gpu-sandbox"],
});
const context = await browser.newContext({
  viewport,
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
  await page.screenshot({ path: path.join(qaDir, `mobile-portrait-title-${screenshotSuffix}.png`), fullPage: false });
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
  assert.ok(introMetrics.startHeight >= 56 && introMetrics.startWidth >= viewport.width - 90, JSON.stringify(introMetrics));
  assert.equal(introMetrics.mobileControlsDisplay, "grid", JSON.stringify(introMetrics));
  assert.equal(introMetrics.desktopControlsDisplay, "none", JSON.stringify(introMetrics));
  assert.ok(introMetrics.mobileControlHeights.every((height) => height >= 52), JSON.stringify(introMetrics));
  await page.locator(".intro-start").tap();
  await page.locator(".save-slot-screen").waitFor({ state: "visible" });
  await page.screenshot({ path: path.join(qaDir, `mobile-portrait-save-slots-${screenshotSuffix}.png`), fullPage: false });
  const slotMetrics = await page.locator(".save-slot-card").evaluateAll((cards) => cards.map((card) => {
    const box = card.getBoundingClientRect();
    return { left: box.left, top: box.top, width: box.width, height: box.height, font: Number.parseFloat(getComputedStyle(card.querySelector("strong")).fontSize) };
  }));
  assert.equal(slotMetrics.length, 3);
  assert.ok(slotMetrics.every((slot) => slot.width >= viewport.width - 40 && slot.height >= 196 && slot.font >= 22), JSON.stringify(slotMetrics));
  assert.ok(slotMetrics[1].top > slotMetrics[0].top + slotMetrics[0].height - 1, JSON.stringify(slotMetrics));
  await page.locator(".save-slot-card").first().tap();
  await page.locator(".home-base-screen").waitFor({ state: "visible", timeout: 20_000 });
  if (await page.locator(".base-dialogue:visible").count()) await page.keyboard.press("Escape");
  await page.screenshot({ path: path.join(qaDir, `mobile-portrait-home-${screenshotSuffix}.png`), fullPage: false });

  const homeMetrics = await page.evaluate(() => {
    const currency = document.querySelector(".base-currency-rail")?.getBoundingClientRect();
    const actions = document.querySelector(".base-primary-actions")?.getBoundingClientRect();
    const number = (node, property = "fontSize") => node ? Number.parseFloat(getComputedStyle(node)[property]) : 0;
    return {
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      currency: currency && { left: currency.left, right: currency.right, top: currency.top, bottom: currency.bottom },
      actions: actions && { left: actions.left, right: actions.right, top: actions.top, bottom: actions.bottom },
      identityFont: number(document.querySelector(".base-identity strong")),
      currencyButtons: [...document.querySelectorAll(".base-currency-rail button")].map((button) => ({
        height: button.getBoundingClientRect().height,
        label: number(button.querySelector("small")),
        value: number(button.querySelector("b")),
      })),
      menuButtons: [...document.querySelectorAll(".base-menu-button")].map((button) => ({
        height: button.getBoundingClientRect().height,
        name: number(button.querySelector("b")),
      })),
      actionButtons: [...document.querySelectorAll(".base-primary-actions > button")].map((button) => ({
        height: button.getBoundingClientRect().height,
        name: number(button.querySelector("b")),
      })),
    };
  });
  assert.ok(homeMetrics.scrollWidth <= homeMetrics.width + 1, JSON.stringify(homeMetrics));
  assert.ok(homeMetrics.currency && homeMetrics.currency.left >= 0 && homeMetrics.currency.right <= viewport.width);
  assert.ok(homeMetrics.actions && homeMetrics.actions.left >= 0 && homeMetrics.actions.right <= viewport.width && homeMetrics.actions.bottom <= viewport.height);
  assert.ok(homeMetrics.identityFont >= 27, JSON.stringify(homeMetrics));
  assert.ok(homeMetrics.currencyButtons.every((button) => button.height >= 64 && button.label >= 12 && button.value >= 20), JSON.stringify(homeMetrics));
  assert.ok(homeMetrics.menuButtons.every((button) => button.height >= 76 && button.name >= 16), JSON.stringify(homeMetrics));
  assert.ok(homeMetrics.actionButtons.every((button) => button.height >= 62 && button.name >= 17), JSON.stringify(homeMetrics));

  await page.locator(".base-menu-button").first().tap();
  await page.locator(".base-dialogue").waitFor({ state: "visible" });
  const dialogueMetrics = await page.evaluate(() => ({
    heading: Number.parseFloat(getComputedStyle(document.querySelector(".base-dialogue-copy h2")).fontSize),
    body: Number.parseFloat(getComputedStyle(document.querySelector(".base-dialogue-copy p")).fontSize),
    actions: [...document.querySelectorAll(".base-dialogue-actions button")].map((button) => ({
      height: button.getBoundingClientRect().height,
      font: Number.parseFloat(getComputedStyle(button).fontSize),
    })),
  }));
  assert.ok(dialogueMetrics.heading >= 27 && dialogueMetrics.body >= 16, JSON.stringify(dialogueMetrics));
  assert.ok(dialogueMetrics.actions.every((button) => button.height >= 56 && button.font >= 15), JSON.stringify(dialogueMetrics));
  await page.screenshot({ path: path.join(qaDir, `mobile-portrait-dialogue-${screenshotSuffix}.png`), fullPage: false });

  await page.locator(".base-facility-cta").tap();
  await page.locator(".base-facility-panel").waitFor({ state: "visible" });
  const facilityMetrics = await page.evaluate(() => {
    const upgrade = document.querySelector(".facility-upgrade");
    const action = upgrade?.querySelector("button")?.getBoundingClientRect();
    return {
      heading: Number.parseFloat(getComputedStyle(document.querySelector(".base-facility-panel > header h2")).fontSize),
      description: Number.parseFloat(getComputedStyle(document.querySelector(".base-facility-panel > header p")).fontSize),
      upgradeTitle: Number.parseFloat(getComputedStyle(upgrade.querySelector("h3")).fontSize),
      upgradeBody: Number.parseFloat(getComputedStyle(upgrade.querySelector("p")).fontSize),
      actionHeight: action?.height || 0,
      actionFont: Number.parseFloat(getComputedStyle(upgrade.querySelector("button")).fontSize),
    };
  });
  assert.ok(facilityMetrics.heading >= 29 && facilityMetrics.description >= 15, JSON.stringify(facilityMetrics));
  assert.ok(facilityMetrics.upgradeTitle >= 19 && facilityMetrics.upgradeBody >= 15, JSON.stringify(facilityMetrics));
  assert.ok(facilityMetrics.actionHeight >= 56 && facilityMetrics.actionFont >= 15, JSON.stringify(facilityMetrics));
  await page.screenshot({ path: path.join(qaDir, `mobile-portrait-facility-${screenshotSuffix}.png`), fullPage: false });
  await page.locator(".base-facility-panel .facility-close").tap();
  await page.locator(".base-facility-panel").waitFor({ state: "detached" });

  await page.locator(".base-character-action").tap();
  await page.locator(".character-information-panel").waitFor({ state: "visible" });
  const characterMetrics = await page.evaluate(() => {
    const kit = document.querySelector(".character-active-kit article");
    return {
      title: Number.parseFloat(getComputedStyle(document.querySelector(".character-profile-content h3")).fontSize),
      body: Number.parseFloat(getComputedStyle(document.querySelector(".character-profile-content > p")).fontSize),
      tabs: [...document.querySelectorAll(".character-info-tabs button")].map((button) => ({ height: button.getBoundingClientRect().height, font: Number.parseFloat(getComputedStyle(button).fontSize) })),
      kitHeight: kit?.getBoundingClientRect().height || 0,
      kitName: Number.parseFloat(getComputedStyle(kit.querySelector("b")).fontSize),
    };
  });
  assert.ok(characterMetrics.title >= 23 && characterMetrics.body >= 15, JSON.stringify(characterMetrics));
  assert.ok(characterMetrics.tabs.every((tab) => tab.height >= 56 && tab.font >= 15), JSON.stringify(characterMetrics));
  assert.ok(characterMetrics.kitHeight >= 84 && characterMetrics.kitName >= 14, JSON.stringify(characterMetrics));
  await page.screenshot({ path: path.join(qaDir, `mobile-portrait-character-${screenshotSuffix}.png`), fullPage: false });
  await page.locator(".character-info-tabs button").nth(1).tap();
  await page.locator(".augmentation-core-module").waitFor({ state: "visible" });
  const augmentationMetrics = await page.evaluate(() => {
    const module = document.querySelector(".augmentation-core-module");
    const art = document.querySelector(".augmentation-core-art");
    const image = document.querySelector(".augmentation-core-art img");
    return {
      moduleHeight: module?.getBoundingClientRect().height || 0,
      artWidth: art?.getBoundingClientRect().width || 0,
      imageLoaded: Boolean(image?.complete && image?.naturalWidth > 0),
      animation: image ? getComputedStyle(image).animationName : "none",
    };
  });
  assert.ok(augmentationMetrics.moduleHeight >= 150 && augmentationMetrics.artWidth >= 96, JSON.stringify(augmentationMetrics));
  assert.equal(augmentationMetrics.imageLoaded, true, JSON.stringify(augmentationMetrics));
  assert.notEqual(augmentationMetrics.animation, "none", JSON.stringify(augmentationMetrics));
  await page.screenshot({ path: path.join(qaDir, `mobile-portrait-augmentation-${screenshotSuffix}.png`), fullPage: false });
  await page.locator(".character-information-panel .facility-close").tap();
  await page.locator(".character-information-panel").waitFor({ state: "detached" });

  await page.locator(".base-defense-action").tap();
  await page.locator(".defense-stage-select-screen").waitFor({ state: "visible" });
  const defenseSelectMetrics = await page.evaluate(() => {
    const card = document.querySelector(".defense-stage-card");
    return {
      heading: Number.parseFloat(getComputedStyle(document.querySelector(".defense-select-heading h1")).fontSize),
      body: Number.parseFloat(getComputedStyle(document.querySelector(".defense-select-heading p")).fontSize),
      cardHeight: card?.getBoundingClientRect().height || 0,
      cardTitle: Number.parseFloat(getComputedStyle(card.querySelector(":scope > strong")).fontSize),
      cardBody: Number.parseFloat(getComputedStyle(card.querySelector(":scope > p")).fontSize),
    };
  });
  assert.ok(defenseSelectMetrics.heading >= 40 && defenseSelectMetrics.body >= 16, JSON.stringify(defenseSelectMetrics));
  assert.ok(defenseSelectMetrics.cardHeight >= 280 && defenseSelectMetrics.cardTitle >= 28 && defenseSelectMetrics.cardBody >= 15, JSON.stringify(defenseSelectMetrics));
  await page.screenshot({ path: path.join(qaDir, `mobile-portrait-defense-select-${screenshotSuffix}.png`), fullPage: false });
  await page.locator(".defense-stage-select-screen .campaign-back").tap();
  await page.locator(".home-base-screen").waitFor({ state: "visible" });

  await page.locator(".base-sortie-action").tap();
  await page.locator(".region-world-map").waitFor({ state: "visible" });
  await page.screenshot({ path: path.join(qaDir, `mobile-portrait-world-map-${screenshotSuffix}.png`), fullPage: false });
  const hotspotMetrics = await page.locator(".region-map-hotspot").first().evaluate((node) => {
    const box = node.getBoundingClientRect();
    return { left: box.left, right: box.right, width: box.width, height: box.height, nameFont: Number.parseFloat(getComputedStyle(node.querySelector("strong")).fontSize) };
  });
  assert.ok(hotspotMetrics.left >= 0 && hotspotMetrics.right <= viewport.width && hotspotMetrics.width >= 290 && hotspotMetrics.height >= 100 && hotspotMetrics.nameFont >= 21, JSON.stringify(hotspotMetrics));
  await page.locator(".region-map-hotspot").first().tap();
  await page.locator(".region-card").first().waitFor({ state: "visible" });
  const regionCard = await page.locator(".region-card").first().boundingBox();
  assert.ok(regionCard && regionCard.width >= 300, JSON.stringify(regionCard));
  const swipeHint = await page.locator(".region-mobile-swipe-hint").boundingBox();
  assert.ok(swipeHint && swipeHint.height >= 40 && swipeHint.x >= 0 && swipeHint.x + swipeHint.width <= viewport.width, JSON.stringify(swipeHint));
  await page.screenshot({ path: path.join(qaDir, `mobile-portrait-region-list-${screenshotSuffix}.png`), fullPage: false });
  await page.locator(".region-card").first().tap();
  await page.locator(".region-sortie-dialog").waitFor({ state: "visible" });
  await page.waitForTimeout(250);
  const sortieMetrics = await page.evaluate(() => {
    const dialog = document.querySelector(".region-sortie-dialog")?.getBoundingClientRect();
    const weapon = document.querySelector(".sortie-weapon-card");
    const launchButton = document.querySelector(".region-sortie-launch");
    return {
      dialog: dialog && { left: dialog.left, top: dialog.top, right: dialog.right, bottom: dialog.bottom },
      heading: Number.parseFloat(getComputedStyle(document.querySelector(".region-sortie-briefing h2")).fontSize),
      body: Number.parseFloat(getComputedStyle(document.querySelector(".region-sortie-briefing > p")).fontSize),
      weaponHeight: weapon?.getBoundingClientRect().height || 0,
      weaponName: Number.parseFloat(getComputedStyle(weapon.querySelector("b")).fontSize),
      launchHeight: launchButton?.getBoundingClientRect().height || 0,
      launchFont: Number.parseFloat(getComputedStyle(launchButton).fontSize),
    };
  });
  assert.ok(sortieMetrics.dialog && sortieMetrics.dialog.left >= 0 && sortieMetrics.dialog.top >= 0 && sortieMetrics.dialog.right <= viewport.width && sortieMetrics.dialog.bottom <= viewport.height, JSON.stringify(sortieMetrics));
  assert.ok(sortieMetrics.heading >= 40 && sortieMetrics.body >= 16, JSON.stringify(sortieMetrics));
  assert.ok(sortieMetrics.weaponHeight >= 116 && sortieMetrics.weaponName >= 17, JSON.stringify(sortieMetrics));
  assert.ok(sortieMetrics.launchHeight >= 68 && sortieMetrics.launchFont >= 17, JSON.stringify(sortieMetrics));
  await page.screenshot({ path: path.join(qaDir, `mobile-portrait-sortie-${screenshotSuffix}.png`), fullPage: false });
  const launch = page.locator(".region-sortie-launch");
  assert.equal(await launch.isDisabled(), true, "sortie requires explicit equipment confirmation");
  await page.locator(".sortie-weapon-card.is-equipped").tap();
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
  await page.screenshot({ path: path.join(qaDir, `mobile-portrait-combat-${screenshotSuffix}.png`), fullPage: false });

  const before = await page.evaluate(() => window.__OVERLOAD_QA__.getSnapshot().context);
  assert.equal(before.mobileAutoAim, true);
  assert.equal(before.portraitPresentation, true);
  assert.ok(before.liveEnemies > 0);
  assert.ok(before.cameraZoom >= 0.3 && before.cameraZoom <= 0.4, JSON.stringify(before));
  assert.ok(before.visibleWorldWidth >= viewport.width / 0.36, JSON.stringify(before));
  assert.ok(before.visibleWorldHeight >= viewport.height / 0.36, JSON.stringify(before));
  assert.ok(before.visibleEnemyCount >= 2, JSON.stringify(before));
  assert.ok(Math.abs(before.cameraViewportWidth - viewport.width) <= 2, JSON.stringify(before));
  assert.ok(Math.abs(before.cameraViewportHeight - viewport.height) <= 2, JSON.stringify(before));
  assert.equal(await page.locator(".landscape-guard").count(), 0);

  const frame = await page.locator(".expedition-canvas-frame").boundingBox();
  assert.ok(frame && frame.width >= viewport.width - 1 && frame.height >= viewport.height - 1, JSON.stringify(frame));
  const pauseButton = page.locator(".expedition-pause-toggle");
  const pauseButtonMetrics = await pauseButton.evaluate((node) => {
    const box = node.getBoundingClientRect();
    return { left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height };
  });
  assert.ok(
    pauseButtonMetrics.width >= 52 && pauseButtonMetrics.height >= 52
      && pauseButtonMetrics.left >= 0 && pauseButtonMetrics.right <= viewport.width
      && pauseButtonMetrics.top >= 0 && pauseButtonMetrics.bottom <= viewport.height,
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
  assert.ok(pauseMetrics.titleFont >= 40, JSON.stringify(pauseMetrics));
  assert.ok(pauseMetrics.buttons.every((button) => button.height >= 60 && button.font >= 15), JSON.stringify(pauseMetrics));
  await page.screenshot({ path: path.join(qaDir, `mobile-portrait-pause-${screenshotSuffix}.png`), fullPage: false });
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
  await page.screenshot({ path: path.join(qaDir, `mobile-portrait-joystick-${screenshotSuffix}.png`), fullPage: false });
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(180);
  const afterRight = await page.evaluate(() => window.__OVERLOAD_QA__.getSnapshot().context);
  assert.ok(afterRight.playerX > before.playerX + 8, `player should move right: ${before.playerX} -> ${afterRight.playerX}`);
  assert.equal(await page.locator(".floating-touch-joystick.is-active").count(), 0);

  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: start.x, y: start.y, id: 8, radiusX: 1, radiusY: 1, force: 1 }] });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: start.x, y: start.y + 82, id: 8, radiusX: 1, radiusY: 1, force: 1 }],
  });
  await page.waitForTimeout(750);
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(180);
  const after = await page.evaluate(() => window.__OVERLOAD_QA__.getSnapshot().context);
  assert.ok(after.playerY > afterRight.playerY + 8, `player should move down: ${afterRight.playerY} -> ${after.playerY}`);

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
      actions: rect(".expedition-hud-actions"),
      xp: rect(".expedition-xp"),
      canvas: (() => {
        const node = document.querySelector(".phaser-host canvas");
        const box = node?.getBoundingClientRect();
        return node && box ? { width: box.width, height: box.height, bufferWidth: node.width, bufferHeight: node.height } : null;
      })(),
      objectiveFont: Number.parseFloat(getComputedStyle(document.querySelector(".route-objective strong")).fontSize),
      abilityLabelFont: Number.parseFloat(getComputedStyle(document.querySelector(".combat-ability-copy strong")).fontSize),
      abilityLabelDisplay: getComputedStyle(document.querySelector(".combat-ability-copy")).display,
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  for (const [name, box] of Object.entries({ dock: layout.dock, minimap: layout.minimap, objective: layout.objective })) {
    assert.ok(box && box.left >= -1 && box.top >= -1 && box.right <= layout.viewport.width + 1 && box.bottom <= layout.viewport.height + 1, `${name}: ${JSON.stringify(box)}`);
  }
  const intersects = (a, b) => Boolean(a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);
  assert.equal(intersects(layout.objective, layout.actions), false, JSON.stringify(layout));
  assert.equal(intersects(layout.objective, layout.minimap), false, JSON.stringify(layout));
  assert.equal(intersects(layout.minimap, layout.dock), false, JSON.stringify(layout));
  assert.ok(layout.canvas && Math.abs(layout.canvas.width - viewport.width) <= 1 && Math.abs(layout.canvas.height - viewport.height) <= 1, JSON.stringify(layout));
  assert.ok(layout.canvas && Math.abs(layout.canvas.bufferWidth / layout.canvas.bufferHeight - viewport.width / viewport.height) <= 0.02, JSON.stringify(layout));
  assert.ok(layout.objectiveFont >= 18 && layout.abilityLabelFont >= 13 && layout.abilityLabelDisplay !== "none", JSON.stringify(layout));
  assert.ok(layout.horizontalOverflow <= 1, JSON.stringify(layout));
  assert.deepEqual(errors, []);

  console.log(JSON.stringify({ result: "pass", introMetrics, slotMetrics, homeMetrics, dialogueMetrics, facilityMetrics, characterMetrics, augmentationMetrics, defenseSelectMetrics, hotspotMetrics, sortieMetrics, pauseButtonMetrics, pauseMetrics, runtime: after, layout, errors }, null, 2));
} finally {
  await browser.close();
}

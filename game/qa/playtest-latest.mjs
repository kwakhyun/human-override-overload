import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/82105/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const qaDir = path.dirname(fileURLToPath(import.meta.url));
const baseUrl = "http://127.0.0.1:4174/";

async function startFreshRun(page, scene = "", options = {}) {
  const query = new URLSearchParams();
  if (options.debug) query.set("debug", "1");
  if (scene) {
    query.set("debug", "1");
    query.set("scene", scene);
  }
  if (options.region) {
    query.set("debug", "1");
    query.set("region", options.region);
  }
  const url = query.size ? `${baseUrl}?${query}` : baseUrl;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  if (options.region && options.region !== "wrong-engine-core") {
    await page.evaluate(() => {
      const key = "train-me-wrong.overload.campaign.v2";
      const campaign = JSON.parse(localStorage.getItem(key) || '{"version":2,"slots":[null,null,null]}');
      if (campaign.slots?.[0]) {
        campaign.slots[0].completedRegionIds = Array.from(new Set([...(campaign.slots[0].completedRegionIds || []), "wrong-engine-core"]));
        campaign.slots[0].homeBaseUnlocked = true;
        campaign.slots[0].storyFlags = Array.from(new Set([...(campaign.slots[0].storyFlags || []), "home-base-unlocked", "chapter-01-cleared"]));
        localStorage.setItem(key, JSON.stringify(campaign));
      }
    });
    await page.reload({ waitUntil: "domcontentloaded" });
  }
  await page.locator(".intro-start").waitFor({ state: "visible" });
  await page.locator(".intro-start").click();
  await page.locator(".save-slot-card").first().click();
  await page.locator(".home-base-screen").waitFor({ state: "visible", timeout: 15_000 });
  if (await page.locator(".base-dialogue:visible").count()) await page.keyboard.press("Escape");
  await page.locator(".airship-hotspot").click();
  const regionIndex = options.region === "glass-dune" ? 1 : options.region === "abyssal-archive" ? 2 : 0;
  await page.locator(".region-card").nth(regionIndex).click();
  await page.locator(".region-sortie-launch").click();
  for (let step = 0; step < 5; step += 1) {
    const next = page.locator(".ability-guide-next:visible");
    if (!(await next.count())) break;
    await next.click();
    await page.waitForTimeout(100);
  }
  await page.locator("canvas").waitFor({ state: "visible", timeout: 30_000 });
  await page.waitForTimeout(3_500);
  const initialObjective = await page.locator(".route-objective").first().innerText().catch(() => "");
  if (options.beforeDialogueScreenshot) {
    await page.screenshot({ path: path.join(qaDir, options.beforeDialogueScreenshot), fullPage: true });
  }
  const openingNarrative = {};
  if (options.captureOpeningNarrative) {
    const panel = page.locator(".narrative-panel");
    await panel.waitFor({ state: "visible", timeout: 10_000 });
    openingNarrative.first = await readNarrativeState(page);
    if (options.captureOpeningNarrative.firstScreenshot) {
      await page.screenshot({
        path: path.join(qaDir, options.captureOpeningNarrative.firstScreenshot),
        fullPage: true,
      });
    }
    await panel.locator("button").click();
    await page.waitForTimeout(220);
    openingNarrative.second = await readNarrativeState(page);
    if (options.captureOpeningNarrative.secondScreenshot) {
      await page.screenshot({
        path: path.join(qaDir, options.captureOpeningNarrative.secondScreenshot),
        fullPage: true,
      });
    }
  }
  for (let index = 0; index < 10; index += 1) {
    const next = page.locator(".narrative-panel button:visible");
    if (!(await next.count())) break;
    await next.click();
    await page.waitForTimeout(180);
  }
  await page.waitForTimeout(700);
  return {
    initialObjective,
    openingNarrative,
    speechProbe: await readSpeechProbe(page),
  };
}

async function openFirstSortieGuide(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(".intro-start").click();
  await page.locator(".save-slot-card").first().click();
  await page.locator(".home-base-screen").waitFor({ state: "visible", timeout: 15_000 });
  if (await page.locator(".base-dialogue:visible").count()) await page.keyboard.press("Escape");
  await page.locator(".airship-hotspot").click();
  await page.locator(".region-card").first().click();
  await page.locator(".region-sortie-launch").click();
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
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    if (await page.locator(".combat-tutorial-layer:visible").count()) return;
    const nextDialogue = page.locator(".narrative-panel button:visible");
    if (await nextDialogue.count()) {
      await nextDialogue.click();
      await page.waitForTimeout(140);
      continue;
    }
    await page.waitForTimeout(120);
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

async function installSpeechProbe(page) {
  await page.addInitScript(() => {
    const accesses = [];
    let speechSynthesisValue;
    let utteranceValue;
    try { speechSynthesisValue = globalThis.speechSynthesis; } catch { speechSynthesisValue = undefined; }
    try { utteranceValue = globalThis.SpeechSynthesisUtterance; } catch { utteranceValue = undefined; }
    const instrumented = { speechSynthesis: false, SpeechSynthesisUtterance: false };
    try {
      Object.defineProperty(globalThis, "speechSynthesis", {
        configurable: true,
        get() {
          accesses.push("speechSynthesis");
          return speechSynthesisValue;
        },
      });
      instrumented.speechSynthesis = true;
    } catch {
      // Some engines expose a non-configurable host property; static tests still cover it.
    }
    try {
      Object.defineProperty(globalThis, "SpeechSynthesisUtterance", {
        configurable: true,
        get() {
          accesses.push("SpeechSynthesisUtterance");
          return utteranceValue;
        },
      });
      instrumented.SpeechSynthesisUtterance = true;
    } catch {
      // Same fallback as above.
    }
    globalThis.__overloadSpeechQa = { accesses, instrumented };
  });
}

async function readSpeechProbe(page) {
  return page.evaluate(() => globalThis.__overloadSpeechQa || { accesses: ["probe-missing"], instrumented: {} });
}

function insideViewport(rect, viewport, tolerance = 1) {
  if (!rect || !viewport) return false;
  return rect.x >= -tolerance
    && rect.y >= -tolerance
    && rect.x + rect.width <= viewport.width + tolerance
    && rect.y + rect.height <= viewport.height + tolerance;
}

async function readNarrativeState(page) {
  return page.locator(".narrative-panel").evaluate((panel) => {
    const portrait = panel.querySelector(".narrative-portrait");
    const frame = portrait?.querySelector(".narrative-portrait-frame");
    const image = portrait?.querySelector("img");
    const copy = panel.querySelector(".narrative-copy");
    const line = copy?.querySelector("p");
    const speaker = copy?.querySelector("strong");
    const button = panel.querySelector("button");
    const rect = (element) => {
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    };
    const lineStyle = line ? getComputedStyle(line) : null;
    const bodyStyle = getComputedStyle(document.body);
    return {
      speaker: speaker?.textContent?.trim() || "",
      text: line?.textContent?.trim() || "",
      portraitClass: portrait?.className || "",
      imageUrl: image?.currentSrc || image?.src || "",
      imageAlt: image?.alt || "",
      backgroundImage: frame ? getComputedStyle(frame).backgroundImage : "",
      backgroundPosition: frame ? getComputedStyle(frame).backgroundPosition : "",
      frameLabel: frame?.getAttribute("aria-label") || "",
      typography: {
        dialogueFontFamily: lineStyle?.fontFamily || "",
        dialogueFontSize: lineStyle?.fontSize || "",
        dialogueLineHeight: lineStyle?.lineHeight || "",
        bodyFontFamily: bodyStyle.fontFamily || "",
      },
      viewport: { width: innerWidth, height: innerHeight },
      panel: rect(panel),
      portrait: rect(portrait),
      copy: rect(copy),
      line: rect(line),
      button: rect(button),
    };
  });
}

function firstFontFamily(value) {
  return String(value || "").split(",")[0].trim().replace(/^['"]|['"]$/g, "");
}

function recordCheck(condition, label, errors) {
  if (!condition) errors.push(`assert:${label}`);
}

function checkKoreanTypography(snapshot, label, errors) {
  const allowed = new Set([
    "pretendard variable",
    "pretendard",
    "noto sans kr",
    "apple sd gothic neo",
    "malgun gothic",
    "맑은 고딕",
    "system-ui",
  ]);
  for (const [surface, family] of Object.entries({
    dialogue: snapshot?.typography?.dialogueFontFamily,
    body: snapshot?.typography?.bodyFontFamily,
  })) {
    const first = firstFontFamily(family).toLowerCase();
    recordCheck(allowed.has(first), `${label}:${surface}:Korean-first-font:${first || "missing"}`, errors);
    recordCheck(!["rajdhani", "ibm plex mono"].includes(first), `${label}:${surface}:not-Latin-only-font`, errors);
  }
}

function checkNarrativeLayout(snapshot, label, errors) {
  recordCheck(insideViewport(snapshot?.panel, snapshot?.viewport), `${label}:panel-inside-viewport`, errors);
  recordCheck(insideViewport(snapshot?.portrait, snapshot?.viewport), `${label}:portrait-inside-viewport`, errors);
  recordCheck(insideViewport(snapshot?.copy, snapshot?.viewport), `${label}:copy-inside-viewport`, errors);
  recordCheck(insideViewport(snapshot?.line, snapshot?.viewport), `${label}:line-inside-viewport`, errors);
  recordCheck(insideViewport(snapshot?.button, snapshot?.viewport), `${label}:button-inside-viewport`, errors);
}

function checkNarrativePortrait(snapshot, expected, label, errors) {
  recordCheck(snapshot?.portraitClass?.includes(`is-${expected.variant}`), `${label}:variant-${expected.variant}`, errors);
  const source = `${snapshot?.imageUrl || ""} ${snapshot?.backgroundImage || ""}`;
  recordCheck(source.includes(expected.sourceToken), `${label}:source-${expected.sourceToken}`, errors);
  recordCheck(Boolean(snapshot?.text), `${label}:dialogue-copy-present`, errors);
  checkKoreanTypography(snapshot, label, errors);
  checkNarrativeLayout(snapshot, label, errors);
}

async function openSeededBase(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    const timestamp = "2026-08-10T00:00:00.000Z";
    localStorage.setItem("train-me-wrong.overload.campaign.v2", JSON.stringify({
      version: 2,
      slots: [{
        id: "slot-1",
        createdAt: timestamp,
        updatedAt: timestamp,
        completedRegionIds: ["wrong-engine-core"],
        storyFlags: ["home-base-unlocked", "chapter-01-cleared", "ability-guide-complete", "combat-overlay-complete"],
        regionRecords: {
          "wrong-engine-core": {
            clears: 1,
            bestTime: 120,
            highestLevel: 8,
            mostKills: 300,
            lastClearedAt: timestamp,
            lastRunId: "qa-base-unlock",
          },
        },
        progression: {},
        abilityGuideSeen: true,
        combatOverlaySeen: true,
        lastRegionId: "wrong-engine-core",
      }, null, null],
    }));
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(".intro-start").click();
  await page.locator(".save-slot-card").first().click();
  await page.locator(".home-base-screen").waitFor({ state: "visible", timeout: 15_000 });
}

async function inspectBaseNpcPortrait(page, npc, screenshot) {
  await page.getByRole("button", { name: `${npc.name}와 대화` }).click();
  const panel = page.locator(".base-dialogue");
  await panel.waitFor({ state: "visible", timeout: 10_000 });
  const state = await panel.evaluate((dialogue) => {
    const portrait = dialogue.querySelector(".base-npc-portrait");
    const copy = dialogue.querySelector("p");
    const panelBox = dialogue.getBoundingClientRect();
    const portraitBox = portrait?.getBoundingClientRect();
    const copyBox = copy?.getBoundingClientRect();
    const style = portrait ? getComputedStyle(portrait) : null;
    const copyStyle = copy ? getComputedStyle(copy) : null;
    return {
      name: dialogue.querySelector("h2")?.textContent?.trim() || "",
      backgroundImage: style?.backgroundImage || "",
      backgroundPosition: style?.backgroundPosition || "",
      fontFamily: copyStyle?.fontFamily || "",
      viewport: { width: innerWidth, height: innerHeight },
      panel: panelBox ? { x: panelBox.x, y: panelBox.y, width: panelBox.width, height: panelBox.height } : null,
      portrait: portraitBox ? { x: portraitBox.x, y: portraitBox.y, width: portraitBox.width, height: portraitBox.height } : null,
      copy: copyBox ? { x: copyBox.x, y: copyBox.y, width: copyBox.width, height: copyBox.height } : null,
    };
  });
  await page.screenshot({ path: path.join(qaDir, screenshot), fullPage: true });
  for (let index = 0; index < 5 && await panel.count(); index += 1) {
    await panel.locator("footer button").last().click();
    await page.waitForTimeout(100);
  }
  return state;
}

async function box(page, selector) {
  const locator = page.locator(selector).first();
  return (await locator.count()) ? locator.boundingBox() : null;
}

function overlaps(a, b) {
  if (!a || !b) return false;
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

async function captureAimPose(page, canvas, name, xRatio, yRatio) {
  if (!canvas) return null;
  const point = {
    x: canvas.x + canvas.width * xRatio,
    y: canvas.y + canvas.height * yRatio,
  };
  await page.mouse.move(point.x, point.y);
  await page.waitForTimeout(260);
  await page.screenshot({ path: path.join(qaDir, `latest-aim-${name}-desktop-1440x810.png`), fullPage: true });
  return point;
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
  await installSpeechProbe(desktopPage);
  const initialRun = await startFreshRun(desktopPage, "", {
    debug: true,
    beforeDialogueScreenshot: "latest-first-region-300-hud-desktop-1440x810.png",
    captureOpeningNarrative: {
      firstScreenshot: "latest-dialogue-operator-desktop-1440x810.png",
      secondScreenshot: "latest-dialogue-aegis-desktop-1440x810.png",
    },
  });
  checkNarrativePortrait(initialRun.openingNarrative.first, {
    variant: "operator",
    sourceToken: "rhea-control-officer.png",
  }, "desktop:deployment:operator", errors);
  checkNarrativePortrait(initialRun.openingNarrative.second, {
    variant: "hero",
    sourceToken: "survivor-portrait.png",
  }, "desktop:deployment:aegis", errors);
  recordCheck(initialRun.openingNarrative.first?.speaker === "관제관", "desktop:deployment:operator-name", errors);
  recordCheck(initialRun.openingNarrative.second?.speaker === "이지스", "desktop:deployment:aegis-name", errors);
  recordCheck(initialRun.speechProbe?.accesses?.length === 0, "desktop:no-Web-Speech-runtime-access", errors);

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

  const aimPoses = {
    right: await captureAimPose(desktopPage, canvas, "right", 0.84, 0.50),
    upper: await captureAimPose(desktopPage, canvas, "upper", 0.52, 0.15),
    leftLower: await captureAimPose(desktopPage, canvas, "left-lower", 0.16, 0.78),
  };

  const dock = await box(desktopPage, ".expedition-combat-dock");
  const minimap = await box(desktopPage, ".route-minimap");
  const progress = await box(desktopPage, ".progress-hud");
  const buttons = await desktopPage.locator(".combat-ability-chip").evaluateAll((items) => items.map((item) => ({
    label: item.getAttribute("aria-label"),
    text: item.textContent?.replace(/\s+/g, " ").trim(),
  })));
  report.desktop = {
    firstRegionInitialObjective: initialRun.initialObjective,
    openingNarrative: initialRun.openingNarrative,
    speechProbe: initialRun.speechProbe,
    dock,
    minimap,
    progress,
    aimPoses,
    dockOverlapsMinimap: overlaps(dock, minimap),
    dockOverlapsProgress: overlaps(dock, progress),
    buttons,
    minimapState: {
      label: await desktopPage.locator(".route-minimap").getAttribute("aria-label"),
      enemies: await desktopPage.locator(".route-minimap-enemy").count(),
      player: await desktopPage.locator(".route-minimap-player").count(),
      gate: await desktopPage.locator(".route-minimap-engine").count(),
    },
  };
  if (await desktopPage.locator(".route-minimap").count()) {
    await desktopPage.locator(".route-minimap").screenshot({ path: path.join(qaDir, "latest-tactical-minimap-desktop.png") });
  }

  if (canvas) {
    await desktopPage.mouse.move(canvas.x + canvas.width * 0.5, canvas.y + canvas.height * 0.5);
    const scrollBefore = await desktopPage.evaluate(() => window.scrollY);
    await desktopPage.mouse.wheel(0, -520);
    await desktopPage.waitForTimeout(320);
    const scrollAfter = await desktopPage.evaluate(() => window.scrollY);
    report.desktop.wheelZoom = { scrollBefore, scrollAfter, pageScrollPrevented: scrollBefore === scrollAfter };
    await desktopPage.screenshot({ path: path.join(qaDir, "latest-wheel-zoom-desktop-1440x810.png"), fullPage: true });
  }

  await desktopPage.keyboard.press("Escape");
  await desktopPage.getByRole("heading", { name: "일시 정지" }).waitFor();
  await desktopPage.screenshot({ path: path.join(qaDir, "latest-pause-desktop-1440x810.png"), fullPage: true });
  await desktopPage.getByRole("button", { name: /계속/ }).click();
  await desktopPage.locator(".expedition-pause").waitFor({ state: "hidden" });

  await desktopPage.keyboard.press("KeyQ");
  await desktopPage.waitForTimeout(180);
  await desktopPage.screenshot({ path: path.join(qaDir, "latest-emp-pulse-desktop-1440x810.png"), fullPage: true });

  await startFreshRun(desktopPage, "trace1");
  await desktopPage.keyboard.press("KeyE");
  await desktopPage.waitForTimeout(180);
  await desktopPage.screenshot({ path: path.join(qaDir, "latest-aegis-ward-desktop-1440x810.png"), fullPage: true });
  report.desktop.afterKeyboardActives = await desktopPage.locator(".combat-ability-chip").evaluateAll((items) => items.map((item) => item.getAttribute("aria-label")));

  await startFreshRun(desktopPage, "trace1");
  const stratosCanvas = await box(desktopPage, "canvas");
  if (stratosCanvas) await desktopPage.mouse.move(stratosCanvas.x + stratosCanvas.width * 0.78, stratosCanvas.y + stratosCanvas.height * 0.45);
  const stratos = desktopPage.locator('[data-combat-ability="stratosRun"]');
  await stratos.click();
  await desktopPage.waitForTimeout(860);
  await desktopPage.screenshot({ path: path.join(qaDir, "latest-air-support-desktop-1440x810.png"), fullPage: true });
  report.desktop.airSupportAfterClick = await stratos.getAttribute("aria-label");

  await startFreshRun(desktopPage, "trace1");
  await desktopPage.keyboard.press("KeyR");
  await desktopPage.waitForTimeout(320);
  await desktopPage.screenshot({ path: path.join(qaDir, "latest-helix-tempest-desktop-1440x810.png"), fullPage: true });
  report.desktop.ultimateAfterKeyboard = await desktopPage.locator('[data-combat-ability="helixTempest"]').getAttribute("aria-label");

  await startFreshRun(desktopPage, "reward");
  await desktopPage.mouse.move(1, 1);
  await desktopPage.locator(".reward-backdrop").waitFor({ state: "visible", timeout: 10_000 });
  await desktopPage.waitForTimeout(180);
  report.desktop.rewardDefaultFocus = {
    activeElement: await desktopPage.evaluate(() => ({
      tag: document.activeElement?.tagName || "",
      className: document.activeElement?.className || "",
    })),
    focusedCards: await desktopPage.locator(".reward-card:focus").count(),
    hoveredCards: await desktopPage.locator(".reward-card:hover").count(),
  };
  await desktopPage.screenshot({ path: path.join(qaDir, "latest-reward-neutral-focus-desktop-1440x810.png"), fullPage: true });

  await startFreshRun(desktopPage, "weakness");
  await desktopPage.waitForTimeout(2_200);
  await desktopPage.screenshot({ path: path.join(qaDir, "latest-boss-charge-desktop-1440x810.png"), fullPage: true });
  report.desktop.bossPhaseText = await desktopPage.locator(".route-objective").first().innerText().catch(() => "");
  report.desktop.hpFlashVisualDebug = "전용 피격 디버그 장면이 없어 정적 계약 테스트로 대체";
  report.desktop.routeClearVisualDebug = "전용 전멸 전환 디버그 장면이 없어 정적 계약 테스트로 대체";

  const bossNarrative = await startFreshRun(desktopPage, "boss", {
    region: "glass-dune",
    captureOpeningNarrative: {
      firstScreenshot: "latest-dialogue-mirror-tyrant-desktop-1440x810.png",
      secondScreenshot: "latest-dialogue-aegis-boss-desktop-1440x810.png",
    },
  });
  checkNarrativePortrait(bossNarrative.openingNarrative.first, {
    variant: "hostile",
    sourceToken: "regions/glass-dune/boss-forms-atlas.png",
  }, "desktop:glass-dune:hostile", errors);
  checkNarrativePortrait(bossNarrative.openingNarrative.second, {
    variant: "hero",
    sourceToken: "survivor-portrait.png",
  }, "desktop:glass-dune:aegis", errors);
  recordCheck(bossNarrative.openingNarrative.first?.speaker === "거울 폭군 · MIRROR TYRANT", "desktop:glass-dune:boss-name", errors);
  recordCheck(bossNarrative.speechProbe?.accesses?.length === 0, "desktop:boss:no-Web-Speech-runtime-access", errors);
  await desktopPage.waitForFunction(
    () => window.__OVERLOAD_QA__?.getSnapshot().context.bossPattern === "prismLattice",
    null,
    { timeout: 15_000 },
  );
  const bossPatternTextureKeys = await desktopPage.evaluate(() => (
    window.__OVERLOAD_QA__?.getSnapshot().textureMemory.sources.flatMap((source) => source.keys) ?? []
  ));
  recordCheck(
    bossPatternTextureKeys.includes("overload-boss-pattern-common-pixel-atlas"),
    "desktop:boss-pattern:common-texture-loaded",
    errors,
  );
  recordCheck(
    bossPatternTextureKeys.includes("overload-boss-pattern-regional-pixel-atlas"),
    "desktop:boss-pattern:regional-texture-loaded",
    errors,
  );
  await desktopPage.screenshot({
    path: path.join(qaDir, "latest-boss-pattern-prism-lattice-desktop-1440x810.png"),
    fullPage: true,
  });
  report.desktop.bossPattern = await desktopPage.evaluate(() => window.__OVERLOAD_QA__?.getSnapshot().context.bossPattern);
  report.desktop.bossPatternTextures = bossPatternTextureKeys.filter((key) => key.includes("boss-pattern"));
  report.desktop.bossNarrative = bossNarrative;

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

  await openSeededBase(desktopPage);
  const basePortraitCases = [
    { id: "hana", name: "하나", position: "0%", source: "haven-npc-portraits-atlas.png" },
    { id: "ilya", name: "일리야", position: "50%", source: "haven-npc-portraits-atlas.png" },
    { id: "lark", name: "라크", position: "100%", source: "haven-npc-portraits-atlas.png" },
    { id: "rhea", name: "레아", position: "50%", source: "rhea-control-officer.png" },
  ];
  report.desktop.baseNpcPortraits = {};
  for (const npc of basePortraitCases) {
    const state = await inspectBaseNpcPortrait(
      desktopPage,
      npc,
      `latest-base-dialogue-${npc.id}-desktop-1440x810.png`,
    );
    report.desktop.baseNpcPortraits[npc.id] = state;
    recordCheck(state.name === npc.name, `desktop:base:${npc.id}:speaker-name`, errors);
    recordCheck(state.backgroundImage.includes(npc.source), `desktop:base:${npc.id}:portrait-source`, errors);
    recordCheck(state.backgroundPosition.startsWith(npc.position), `desktop:base:${npc.id}:atlas-position-${npc.position}`, errors);
    recordCheck(insideViewport(state.panel, state.viewport), `desktop:base:${npc.id}:panel-inside-viewport`, errors);
    recordCheck(insideViewport(state.portrait, state.viewport), `desktop:base:${npc.id}:portrait-inside-viewport`, errors);
    recordCheck(insideViewport(state.copy, state.viewport), `desktop:base:${npc.id}:copy-inside-viewport`, errors);
    const firstFont = firstFontFamily(state.fontFamily).toLowerCase();
    recordCheck(firstFont === "pretendard variable", `desktop:base:${npc.id}:Korean-first-font:${firstFont}`, errors);
    recordCheck(!["rajdhani", "ibm plex mono"].includes(firstFont), `desktop:base:${npc.id}:not-Latin-only-font`, errors);
  }
  await desktop.close();

  const mobile = await browser.newContext({
    viewport: { width: 812, height: 375 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobile.newPage();
  watchPage(mobilePage, "mobile", errors);
  await installSpeechProbe(mobilePage);
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
  const mobileNarrative = await startFreshRun(mobilePage, "", {
    debug: true,
    captureOpeningNarrative: {
      firstScreenshot: "latest-dialogue-operator-mobile-812x375.png",
      secondScreenshot: "latest-dialogue-aegis-mobile-812x375.png",
    },
  });
  checkNarrativePortrait(mobileNarrative.openingNarrative.first, {
    variant: "operator",
    sourceToken: "rhea-control-officer.png",
  }, "mobile:deployment:operator", errors);
  checkNarrativePortrait(mobileNarrative.openingNarrative.second, {
    variant: "hero",
    sourceToken: "survivor-portrait.png",
  }, "mobile:deployment:aegis", errors);
  recordCheck(mobileNarrative.speechProbe?.accesses?.length === 0, "mobile:no-Web-Speech-runtime-access", errors);
  await mobilePage.screenshot({ path: path.join(qaDir, "latest-combat-mobile-812x375.png"), fullPage: true });
  const mobileDock = await box(mobilePage, ".expedition-combat-dock");
  const mobileMap = await box(mobilePage, ".route-minimap");
  const mobileDpad = await box(mobilePage, ".touch-dpad");
  report.mobile = {
    openingNarrative: mobileNarrative.openingNarrative,
    speechProbe: mobileNarrative.speechProbe,
    dock: mobileDock,
    minimap: mobileMap,
    dpad: mobileDpad,
    dockOverlapsMinimap: overlaps(mobileDock, mobileMap),
    dockOverlapsDpad: overlaps(mobileDock, mobileDpad),
    landscapeGuardVisible: await mobilePage.locator(".landscape-guard:visible").count(),
    buttonCount: await mobilePage.locator(".combat-ability-chip").count(),
  };

  const mobileEmp = mobilePage.locator('[data-combat-ability="empPulse"]');
  await mobileEmp.tap();
  await mobilePage.waitForTimeout(180);
  report.mobile.empPulseAfterTap = await mobileEmp.getAttribute("aria-label");

  await mobilePage.keyboard.press("Escape");
  await mobilePage.getByRole("heading", { name: "일시 정지" }).waitFor();
  await mobilePage.screenshot({ path: path.join(qaDir, "latest-pause-mobile-812x375.png"), fullPage: true });
  await mobile.close();
} finally {
  await browser.close();
}

report.errors = errors;
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (errors.length) process.exitCode = 1;

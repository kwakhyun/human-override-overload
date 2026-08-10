export const QUALITY_PRESETS = Object.freeze({
  cinematic: Object.freeze({
    id: "cinematic",
    label: "CINEMATIC",
    dprCap: 1.5,
    renderScale: 1,
    renderFps: 60,
    hudInterval: 150,
    particleScale: 1,
    maxParticles: 220,
    filters: true,
    shadows: true,
    scanlines: true,
    antialias: true,
  }),
  balanced: Object.freeze({
    id: "balanced",
    label: "BALANCED",
    dprCap: 1.25,
    renderScale: 0.82,
    renderFps: 45,
    hudInterval: 190,
    particleScale: 0.7,
    maxParticles: 140,
    filters: false,
    shadows: true,
    scanlines: false,
    antialias: true,
  }),
  performance: Object.freeze({
    id: "performance",
    label: "PERFORMANCE",
    dprCap: 1,
    renderScale: 0.7,
    renderFps: 30,
    hudInterval: 300,
    particleScale: 0.32,
    maxParticles: 64,
    filters: false,
    shadows: false,
    scanlines: false,
    antialias: false,
  }),
});

const QUALITY_ORDER = Object.freeze(["performance", "balanced", "cinematic"]);
const DOWNGRADE_COOLDOWN_MS = 1500;
const UPGRADE_COOLDOWN_MS = 12000;
const DISCONTINUITY_MS = 250;

function finitePositive(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function qualityRank(id) {
  return Math.max(0, QUALITY_ORDER.indexOf(id));
}

function clampQualityToCeiling(id, ceiling) {
  return QUALITY_ORDER[Math.min(qualityRank(id), qualityRank(ceiling))];
}

/**
 * Produces a conservative hardware recommendation before the Phaser chunk is
 * constructed. Missing both memory and core signals is treated as low-end;
 * browsers which hide only one signal can still use the remaining evidence.
 */
export function assessDeviceCapabilities(environment = globalThis) {
  const navigator = environment?.navigator || {};
  const coreValue = finitePositive(navigator.hardwareConcurrency);
  const memoryValue = finitePositive(navigator.deviceMemory);
  const coresKnown = coreValue !== null;
  const memoryKnown = memoryValue !== null;
  const cores = coreValue ?? 4;
  const memory = memoryValue ?? 4;
  const dpr = finitePositive(environment?.devicePixelRatio) ?? 1;
  const reducedMotion = Boolean(environment?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  const reasons = [];

  if (reducedMotion) reasons.push("reduced-motion");
  if (!coresKnown) reasons.push("cores-unreported");
  else if (cores <= 4) reasons.push(`cores-${cores}`);
  if (!memoryKnown) reasons.push("memory-unreported");
  else if (memory <= 4) reasons.push(`memory-${memory}gb`);
  if (dpr >= 2.75) reasons.push(`dpr-${dpr}`);

  const lowEnd = reducedMotion
    || (coresKnown && cores <= 4)
    || (memoryKnown && memory <= 4)
    || (!coresKnown && !memoryKnown)
    || (dpr >= 2.75 && cores <= 8);
  const midRange = lowEnd
    || cores <= 8
    || (memoryKnown && memory < 8)
    || dpr >= 2;
  const qualityId = lowEnd ? "performance" : midRange ? "balanced" : "cinematic";

  return Object.freeze({
    qualityId,
    cores,
    memory,
    dpr,
    reducedMotion,
    coresKnown,
    memoryKnown,
    reasons: Object.freeze(reasons),
  });
}

export function detectInitialQuality(environment = globalThis) {
  return assessDeviceCapabilities(environment).qualityId;
}

export function getRenderBackingSize(preset, width = 1280, height = 720) {
  const logicalWidth = Math.max(1, Math.round(Number(width) || 1280));
  const logicalHeight = Math.max(1, Math.round(Number(height) || 720));
  const scale = Math.max(0.5, Math.min(1, Number(preset?.renderScale) || 1));
  const backingWidth = Math.max(2, Math.round(logicalWidth * scale / 2) * 2);
  const backingHeight = Math.max(2, Math.round(logicalHeight * scale / 2) * 2);
  return Object.freeze({
    logicalWidth,
    logicalHeight,
    backingWidth,
    backingHeight,
    renderScale: scale,
  });
}

export function advanceRenderClock(accumulator, frameMs, renderFps, force = false) {
  const safeFps = Math.max(1, Number(renderFps) || 60);
  const interval = 1000 / safeFps;
  const safeAccumulator = Number.isFinite(accumulator) ? Math.max(0, accumulator) : interval;
  const total = safeAccumulator + Math.max(0, Number(frameMs) || 0);
  const shouldRender = force || total >= interval;
  return {
    shouldRender,
    accumulator: shouldRender ? (force ? 0 : total % interval) : total,
    interval,
  };
}

export function createPerformanceGovernor(options = {}) {
  const device = assessDeviceCapabilities(options.environment);
  const explicitInitialQuality = QUALITY_PRESETS[options.initialQuality] ? options.initialQuality : null;
  let qualityId = explicitInitialQuality || device.qualityId;
  const requestedCeiling = QUALITY_PRESETS[options.maxAutoQuality] ? options.maxAutoQuality : null;
  const autoQualityCeiling = requestedCeiling || (explicitInitialQuality ? "cinematic" : device.qualityId);
  qualityId = explicitInitialQuality ? qualityId : clampQualityToCeiling(qualityId, autoQualityCeiling);

  let expectedMs = 1000 / QUALITY_PRESETS[qualityId].renderFps;
  let emaMs = expectedMs;
  let totalSamples = 0;
  let samplesSinceReset = 0;
  let slowPressure = 0;
  let fastFrames = 0;
  let lastChange = -DOWNGRADE_COOLDOWN_MS;
  let jankCount = 0;
  let elapsed = 0;
  let suspended = false;
  let interruptions = 0;
  let ignoreNextDiscontinuity = false;

  function resetWindow(now = elapsed, changeGrace = false) {
    expectedMs = 1000 / QUALITY_PRESETS[qualityId].renderFps;
    emaMs = expectedMs;
    samplesSinceReset = 0;
    slowPressure = 0;
    fastFrames = 0;
    if (changeGrace) lastChange = now;
  }

  function changeQuality(direction, now) {
    const index = qualityRank(qualityId);
    let next = QUALITY_ORDER[Math.max(0, Math.min(QUALITY_ORDER.length - 1, index + direction))];
    if (direction > 0) next = clampQualityToCeiling(next, autoQualityCeiling);
    if (next === qualityId) {
      if (direction > 0) fastFrames = 0;
      return false;
    }
    qualityId = next;
    elapsed = now;
    resetWindow(now, true);
    return true;
  }

  return {
    sample(frameMs, now = elapsed + frameMs) {
      if (suspended || !Number.isFinite(frameMs) || frameMs <= 0) return false;
      elapsed = Number.isFinite(now) ? now : elapsed + frameMs;
      const ignoredResumeDelta = ignoreNextDiscontinuity && frameMs > DISCONTINUITY_MS;
      ignoreNextDiscontinuity = false;
      if (ignoredResumeDelta) {
        interruptions += 1;
        resetWindow(elapsed, true);
        return false;
      }

      totalSamples += 1;
      samplesSinceReset += 1;
      const cappedFrameMs = Math.min(frameMs, expectedMs * 4);
      const weight = samplesSinceReset < 24 ? 0.18 : 0.075;
      emaMs += (cappedFrameMs - emaMs) * weight;
      const frameRatio = frameMs / expectedMs;
      const emaRatio = emaMs / expectedMs;

      if (frameRatio > 1.5) jankCount += 1;
      if (frameRatio > 1.8) slowPressure += 4;
      else if (frameRatio > 1.34 || emaRatio > 1.16) slowPressure += 1;
      else slowPressure = Math.max(0, slowPressure - 2);

      if (frameRatio <= 1.1 && emaRatio <= 1.07) fastFrames += 1;
      else fastFrames = Math.max(0, fastFrames - 3);

      if (samplesSinceReset < 12) return false;
      if (slowPressure >= 18 && elapsed - lastChange >= DOWNGRADE_COOLDOWN_MS) {
        return changeQuality(-1, elapsed);
      }
      if (fastFrames >= 600 && elapsed - lastChange >= UPGRADE_COOLDOWN_MS) {
        return changeQuality(1, elapsed);
      }
      return false;
    },
    pause() {
      if (suspended) return;
      suspended = true;
      slowPressure = 0;
      fastFrames = 0;
    },
    resume(now = elapsed) {
      elapsed = Number.isFinite(now) ? now : elapsed;
      suspended = false;
      interruptions += 1;
      ignoreNextDiscontinuity = true;
      resetWindow(elapsed, true);
    },
    resetTiming(now = elapsed) {
      elapsed = Number.isFinite(now) ? now : elapsed;
      ignoreNextDiscontinuity = true;
      resetWindow(elapsed, true);
    },
    setQuality(nextQuality, now = elapsed) {
      if (!QUALITY_PRESETS[nextQuality] || nextQuality === qualityId) return false;
      qualityId = nextQuality;
      elapsed = Number.isFinite(now) ? now : elapsed;
      resetWindow(elapsed, true);
      return true;
    },
    get preset() {
      return QUALITY_PRESETS[qualityId];
    },
    get snapshot() {
      return {
        qualityId,
        qualityLabel: QUALITY_PRESETS[qualityId].label,
        autoQualityCeiling,
        deviceQuality: device.qualityId,
        deviceReasons: device.reasons,
        frameMs: emaMs,
        fps: Math.round(1000 / Math.max(1, emaMs)),
        jank: totalSamples ? jankCount / totalSamples : 0,
        samples: totalSamples,
        interruptions,
        suspended,
      };
    },
  };
}

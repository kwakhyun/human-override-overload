export const QUALITY_PRESETS = Object.freeze({
  cinematic: Object.freeze({
    id: "cinematic",
    label: "CINEMATIC",
    dprCap: 1.5,
    renderFps: 60,
    hudInterval: 150,
    particleScale: 1,
    maxParticles: 220,
    filters: true,
    shadows: true,
    scanlines: true,
  }),
  balanced: Object.freeze({
    id: "balanced",
    label: "BALANCED",
    dprCap: 1.25,
    renderFps: 45,
    hudInterval: 190,
    particleScale: 0.7,
    maxParticles: 140,
    filters: false,
    shadows: true,
    scanlines: false,
  }),
  performance: Object.freeze({
    id: "performance",
    label: "PERFORMANCE",
    dprCap: 1,
    renderFps: 30,
    hudInterval: 250,
    particleScale: 0.4,
    maxParticles: 80,
    filters: false,
    shadows: false,
    scanlines: false,
  }),
});

const QUALITY_ORDER = ["performance", "balanced", "cinematic"];

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

export function detectInitialQuality(environment = globalThis) {
  const navigator = environment?.navigator || {};
  const reducedMotion = Boolean(environment?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  const cores = Number(navigator.hardwareConcurrency || 4);
  const reportedMemory = Number(navigator.deviceMemory);
  const memory = Number.isFinite(reportedMemory) && reportedMemory > 0 ? reportedMemory : 8;
  const dpr = Number(environment?.devicePixelRatio || 1);
  if (reducedMotion || cores <= 4 || memory <= 4 || dpr >= 2.5) return "performance";
  if (cores <= 8 || memory <= 8 || dpr >= 2) return "balanced";
  return "cinematic";
}

export function createPerformanceGovernor(options = {}) {
  let qualityId = options.initialQuality || detectInitialQuality(options.environment);
  if (!QUALITY_PRESETS[qualityId]) qualityId = "balanced";
  let emaMs = 16.7;
  let samples = 0;
  let slowFrames = 0;
  let fastFrames = 0;
  let lastChange = 0;
  let jankCount = 0;
  let elapsed = 0;

  function changeQuality(direction, now) {
    const index = QUALITY_ORDER.indexOf(qualityId);
    const next = QUALITY_ORDER[Math.max(0, Math.min(QUALITY_ORDER.length - 1, index + direction))];
    if (next === qualityId) return false;
    qualityId = next;
    lastChange = now;
    slowFrames = 0;
    fastFrames = 0;
    return true;
  }

  return {
    sample(frameMs, now = elapsed + frameMs) {
      if (!Number.isFinite(frameMs) || frameMs <= 0) return false;
      elapsed = now;
      samples += 1;
      const weight = samples < 30 ? 0.12 : 0.045;
      emaMs += (Math.min(frameMs, 100) - emaMs) * weight;
      if (frameMs > 36) jankCount += 1;
      slowFrames = emaMs > 23 || frameMs > 42 ? slowFrames + 1 : Math.max(0, slowFrames - 2);
      fastFrames = emaMs < 15.8 && frameMs < 19 ? fastFrames + 1 : Math.max(0, fastFrames - 1);
      if (now - lastChange < 3500 || samples < 45) return false;
      if (slowFrames >= 18) return changeQuality(-1, now);
      if (fastFrames >= 420) return changeQuality(1, now);
      return false;
    },
    setQuality(nextQuality, now = elapsed) {
      if (!QUALITY_PRESETS[nextQuality] || nextQuality === qualityId) return false;
      qualityId = nextQuality;
      lastChange = now;
      slowFrames = 0;
      fastFrames = 0;
      return true;
    },
    get preset() {
      return QUALITY_PRESETS[qualityId];
    },
    get snapshot() {
      return {
        qualityId,
        qualityLabel: QUALITY_PRESETS[qualityId].label,
        frameMs: emaMs,
        fps: Math.round(1000 / Math.max(1, emaMs)),
        jank: samples ? jankCount / samples : 0,
        samples,
      };
    },
  };
}

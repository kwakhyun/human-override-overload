import type Phaser from "phaser";

const DEFAULT_SAMPLE_LIMIT = 900;
const DEFAULT_TARGET_FRAME_MS = 1000 / 60;
const INTERNAL_TEXTURE_KEYS = new Set(["__DEFAULT", "__MISSING", "__NORMAL", "__WHITE"]);

export type ProfilingContext = Readonly<{
  scene?: string;
  debugScene?: string | null;
  regionId?: string;
  phase?: string;
  quality?: string;
  assetProfile?: string;
  autoQualityCeiling?: string;
  deviceQuality?: string;
  deviceReasons?: readonly string[];
  liveEnemies?: number;
  playerProjectiles?: number;
  enemyProjectiles?: number;
  bossStage?: number;
  bossPattern?: string | null;
}>;

export type SampleSummary = Readonly<{
  count: number;
  minMs: number;
  maxMs: number;
  meanMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  budgetMs: number;
  overBudgetRatio: number;
}>;

type TextureCategory = "route" | "boss" | "common" | "internal";

type TextureSourceLike = {
  width?: number;
  height?: number;
  image?: unknown;
  source?: unknown;
};

type TextureLike = {
  source?: TextureSourceLike[];
  getSourceImage?: () => unknown;
};

type TextureManagerLike = {
  getTextureKeys?: () => string[];
  get?: (key: string) => TextureLike;
};

type QaWindow = Window & typeof globalThis & {
  __OVERLOAD_QA__?: OverloadQaApi;
};

export type TextureSourceSnapshot = Readonly<{
  id: string;
  width: number;
  height: number;
  decodedRgba8Bytes: number;
  loadedTextureBytes: number | null;
  category: TextureCategory;
  keys: readonly string[];
  url: string | null;
}>;

export type TextureMemorySnapshot = Readonly<{
  method: "texture-source-rgba8-estimate";
  loadedTextureScope: "same-document-asset-image-resource-timing";
  loadedTextureBytes: number;
  loadedTextureBytesKnownSources: number;
  decodedRgba8Bytes: number;
  sourceCount: number;
  textureKeyCount: number;
  categories: Readonly<Record<TextureCategory, Readonly<{
    loadedTextureBytes: number;
    decodedRgba8Bytes: number;
    sourceCount: number;
    keys: readonly string[];
  }>>>;
  sources: readonly TextureSourceSnapshot[];
  loadedResources: readonly Readonly<{
    url: string;
    loadedTextureBytes: number;
    category: TextureCategory;
  }>[];
  limitation: string;
}>;

export type RuntimeProfileSnapshot = Readonly<{
  version: 1;
  generatedAt: string;
  context: ProfilingContext;
  renderer: Readonly<{
    kind: string;
    width: number;
    height: number;
    resolution: number;
    maxTextureSize: number | null;
    gpuVendor: string | null;
    gpuRenderer: string | null;
  }>;
  frames: Readonly<{
    targetFrameMs: number;
    raf: SampleSummary & Readonly<{ droppedFrameRatio: number }>;
    scene: SampleSummary & Readonly<{ droppedFrameRatio: number }>;
    phaserDelta: SampleSummary & Readonly<{ droppedFrameRatio: number }>;
    sceneUpdateCpu: SampleSummary;
    renderSubmitCpu: SampleSummary;
  }>;
  textureMemory: TextureMemorySnapshot;
  limitations: readonly string[];
}>;

export type OverloadQaApi = Readonly<{
  version: 1;
  getSnapshot: () => RuntimeProfileSnapshot;
  reset: () => void;
  waitForSamples: (minimumSceneFrames?: number, timeoutMs?: number) => Promise<RuntimeProfileSnapshot>;
  primeDeterministicArsenal: () => Readonly<{
    liveEnemies: number;
    playerProjectiles: number;
    enemyProjectiles: number;
    note: string;
  }>;
}>;

function finite(value: unknown, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function rounded(value: number) {
  return Math.round(value * 1000) / 1000;
}

function percentile(sorted: readonly number[], quantile: number) {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * quantile) - 1));
  return sorted[index];
}

export function summarizeSamples(samples: readonly number[], budgetMs = DEFAULT_TARGET_FRAME_MS): SampleSummary {
  const clean = samples.filter((value) => Number.isFinite(value) && value >= 0).map(Number).sort((a, b) => a - b);
  if (clean.length === 0) {
    return Object.freeze({
      count: 0,
      minMs: 0,
      maxMs: 0,
      meanMs: 0,
      p50Ms: 0,
      p95Ms: 0,
      p99Ms: 0,
      budgetMs: rounded(budgetMs),
      overBudgetRatio: 0,
    });
  }
  const total = clean.reduce((sum, value) => sum + value, 0);
  const overBudget = clean.reduce((count, value) => count + Number(value > budgetMs), 0);
  return Object.freeze({
    count: clean.length,
    minMs: rounded(clean[0]),
    maxMs: rounded(clean.at(-1) ?? 0),
    meanMs: rounded(total / clean.length),
    p50Ms: rounded(percentile(clean, 0.5)),
    p95Ms: rounded(percentile(clean, 0.95)),
    p99Ms: rounded(percentile(clean, 0.99)),
    budgetMs: rounded(budgetMs),
    overBudgetRatio: rounded(overBudget / clean.length),
  });
}

function textureCategory(key: string): TextureCategory {
  if (INTERNAL_TEXTURE_KEYS.has(key) || key.startsWith("__")) return "internal";
  const normalized = key.toLowerCase();
  if (normalized.includes("boss") || normalized.includes("wrong-engine") || normalized.includes("tyrant") || normalized.includes("oracle")) return "boss";
  if (normalized.includes("sector") || normalized.includes("route") || normalized.includes("squad-trace")) return "route";
  return "common";
}

function imageUrl(image: unknown) {
  if (!image || typeof image !== "object") return null;
  const record = image as { currentSrc?: unknown; src?: unknown };
  const candidate = typeof record.currentSrc === "string" && record.currentSrc ? record.currentSrc : record.src;
  return typeof candidate === "string" && candidate ? candidate : null;
}

function imageDimensions(source: TextureSourceLike, image: unknown) {
  const record = image && typeof image === "object"
    ? image as { naturalWidth?: unknown; naturalHeight?: unknown; videoWidth?: unknown; videoHeight?: unknown; width?: unknown; height?: unknown }
    : {};
  return {
    width: Math.max(0, Math.round(finite(source.width, finite(record.naturalWidth, finite(record.videoWidth, finite(record.width)))))),
    height: Math.max(0, Math.round(finite(source.height, finite(record.naturalHeight, finite(record.videoHeight, finite(record.height)))))),
  };
}

function categoryPriority(category: TextureCategory) {
  return category === "boss" ? 4 : category === "route" ? 3 : category === "common" ? 2 : 1;
}

function resourceTimingBytes() {
  const bytes = new Map<string, number>();
  if (typeof performance === "undefined" || typeof performance.getEntriesByType !== "function") return bytes;
  for (const entry of performance.getEntriesByType("resource") as PerformanceResourceTiming[]) {
    const size = Math.max(0, finite(entry.encodedBodySize, finite(entry.decodedBodySize, finite(entry.transferSize))));
    if (!entry.name || size <= 0) continue;
    bytes.set(entry.name, Math.max(bytes.get(entry.name) ?? 0, size));
  }
  return bytes;
}

function loadedTextureResources(bytesByUrl: ReadonlyMap<string, number>) {
  return [...bytesByUrl.entries()]
    .filter(([url]) => {
      try {
        const pathname = new URL(url, typeof location === "undefined" ? "http://localhost/" : location.href).pathname.toLowerCase();
        return pathname.includes("/assets/") && /\.(?:avif|gif|jpe?g|png|webp)$/.test(pathname);
      } catch {
        return false;
      }
    })
    .map(([url, loadedTextureBytes]) => Object.freeze({
      url,
      loadedTextureBytes,
      category: textureCategory(url),
    }))
    .sort((a, b) => b.loadedTextureBytes - a.loadedTextureBytes || a.url.localeCompare(b.url));
}

export function snapshotTextureMemory(textures: TextureManagerLike): TextureMemorySnapshot {
  const keys = [...new Set(textures.getTextureKeys?.() ?? [])].sort();
  const loadedBytesByUrl = resourceTimingBytes();
  const loadedResources = loadedTextureResources(loadedBytesByUrl);
  const objectIds = new WeakMap<object, number>();
  let nextObjectId = 1;
  const sources = new Map<string, {
    width: number;
    height: number;
    url: string | null;
    loadedTextureBytes: number | null;
    keys: Set<string>;
    category: TextureCategory;
  }>();

  const identityFor = (image: unknown, url: string | null, key: string, sourceIndex: number) => {
    if (url) return `url:${url}`;
    if (image && typeof image === "object") {
      let id = objectIds.get(image);
      if (!id) {
        id = nextObjectId++;
        objectIds.set(image, id);
      }
      return `object:${id}`;
    }
    return `texture:${key}:${sourceIndex}`;
  };

  for (const key of keys) {
    const texture = textures.get?.(key);
    if (!texture) continue;
    const sourceList = Array.isArray(texture.source) && texture.source.length > 0
      ? texture.source
      : [{ image: texture.getSourceImage?.() }];
    sourceList.forEach((source, sourceIndex) => {
      const image = source.image ?? source.source ?? texture.getSourceImage?.();
      const url = imageUrl(image);
      const identity = identityFor(image, url, key, sourceIndex);
      const dimensions = imageDimensions(source, image);
      const category = textureCategory(key);
      const loadedTextureBytes = url ? loadedBytesByUrl.get(url) ?? null : null;
      const previous = sources.get(identity);
      if (previous) {
        previous.keys.add(key);
        previous.width = Math.max(previous.width, dimensions.width);
        previous.height = Math.max(previous.height, dimensions.height);
        if (loadedTextureBytes !== null) previous.loadedTextureBytes = Math.max(previous.loadedTextureBytes ?? 0, loadedTextureBytes);
        if (categoryPriority(category) > categoryPriority(previous.category)) previous.category = category;
      } else {
        sources.set(identity, {
          ...dimensions,
          url,
          loadedTextureBytes,
          keys: new Set([key]),
          category,
        });
      }
    });
  }

  const rows: TextureSourceSnapshot[] = [...sources.entries()].map(([id, source]) => Object.freeze({
    id,
    width: source.width,
    height: source.height,
    decodedRgba8Bytes: source.width * source.height * 4,
    loadedTextureBytes: source.loadedTextureBytes,
    category: source.category,
    keys: Object.freeze([...source.keys].sort()),
    url: source.url,
  })).sort((a, b) => b.decodedRgba8Bytes - a.decodedRgba8Bytes || a.id.localeCompare(b.id));

  const categoryRows = (Object.keys({ route: 1, boss: 1, common: 1, internal: 1 }) as TextureCategory[])
    .map((category) => {
      const matches = rows.filter((row) => row.category === category);
      const resourceMatches = loadedResources.filter((row) => row.category === category);
      return [category, Object.freeze({
        loadedTextureBytes: resourceMatches.reduce((sum, row) => sum + row.loadedTextureBytes, 0),
        decodedRgba8Bytes: matches.reduce((sum, row) => sum + row.decodedRgba8Bytes, 0),
        sourceCount: matches.length,
        keys: Object.freeze([...new Set(matches.flatMap((row) => row.keys))].sort()),
      })] as const;
    });

  return Object.freeze({
    method: "texture-source-rgba8-estimate",
    loadedTextureScope: "same-document-asset-image-resource-timing",
    loadedTextureBytes: loadedResources.reduce((sum, row) => sum + row.loadedTextureBytes, 0),
    loadedTextureBytesKnownSources: loadedResources.length,
    decodedRgba8Bytes: rows.reduce((sum, row) => sum + row.decodedRgba8Bytes, 0),
    sourceCount: rows.length,
    textureKeyCount: keys.length,
    categories: Object.freeze(Object.fromEntries(categoryRows)) as TextureMemorySnapshot["categories"],
    sources: Object.freeze(rows),
    loadedResources: Object.freeze(loadedResources),
    limitation: "loadedTextureBytes uses Resource Timing encoded body sizes for same-document image assets and can include DOM preview images as well as Phaser-loaded images. RGBA8 source dimensions are TextureManager-only and deduplicated by URL/object identity. Browser APIs do not expose physical GPU allocation, driver padding, mipmaps, render targets, compositor copies, or decoded-image cache residency.",
  });
}

function pushRolling(target: number[], value: number, limit: number) {
  if (!Number.isFinite(value) || value < 0) return;
  target.push(value);
  if (target.length > limit) target.splice(0, target.length - limit);
}

function readRenderer(game: Phaser.Game) {
  const renderer = game.renderer as unknown as {
    constructor?: { name?: string };
    width?: number;
    height?: number;
    resolution?: number;
    gl?: WebGLRenderingContext | WebGL2RenderingContext;
  };
  const gl = renderer.gl;
  let maxTextureSize: number | null = null;
  let gpuVendor: string | null = null;
  let gpuRenderer: string | null = null;
  if (gl) {
    maxTextureSize = finite(gl.getParameter(gl.MAX_TEXTURE_SIZE), 0) || null;
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      gpuVendor = String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || "") || null;
      gpuRenderer = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "") || null;
    }
  }
  return Object.freeze({
    kind: renderer.constructor?.name || (gl ? "WebGLRenderer" : "CanvasRenderer"),
    width: finite(renderer.width, game.canvas?.width ?? 0),
    height: finite(renderer.height, game.canvas?.height ?? 0),
    resolution: finite(renderer.resolution, window.devicePixelRatio || 1),
    maxTextureSize,
    gpuVendor,
    gpuRenderer,
  });
}

export class PhaserRuntimeProfiler {
  private readonly game: Phaser.Game;
  private readonly contextProvider: () => ProfilingContext;
  private readonly sampleLimit: number;
  private readonly targetFrameMs: number;
  private readonly rafSamples: number[] = [];
  private readonly sceneSamples: number[] = [];
  private readonly phaserDeltaSamples: number[] = [];
  private readonly sceneUpdateCpuSamples: number[] = [];
  private readonly renderCpuSamples: number[] = [];
  private lastRafAt = 0;
  private lastSceneAt = 0;
  private renderStartedAt = 0;
  private rafId = 0;
  private destroyed = false;

  constructor(game: Phaser.Game, contextProvider: () => ProfilingContext, sampleLimit = DEFAULT_SAMPLE_LIMIT) {
    this.game = game;
    this.contextProvider = contextProvider;
    this.sampleLimit = Math.max(60, Math.floor(sampleLimit));
    this.targetFrameMs = 1000 / Math.max(1, finite((game.loop as { targetFps?: number })?.targetFps, 60));
    game.events.on("prerender", this.onPreRender, this);
    game.events.on("postrender", this.onPostRender, this);
    requestAnimationFrame(this.onAnimationFrame);
  }

  private readonly onAnimationFrame = (time: number) => {
    if (this.destroyed) return;
    if (this.lastRafAt > 0) pushRolling(this.rafSamples, time - this.lastRafAt, this.sampleLimit);
    this.lastRafAt = time;
    this.rafId = requestAnimationFrame(this.onAnimationFrame);
  };

  private readonly onPreRender = () => {
    this.renderStartedAt = performance.now();
  };

  private readonly onPostRender = () => {
    if (this.renderStartedAt <= 0) return;
    pushRolling(this.renderCpuSamples, performance.now() - this.renderStartedAt, this.sampleLimit);
    this.renderStartedAt = 0;
  };

  recordSceneUpdate(phaserDeltaMs: number, sceneUpdateCpuMs: number, now = performance.now()) {
    if (this.lastSceneAt > 0) pushRolling(this.sceneSamples, now - this.lastSceneAt, this.sampleLimit);
    this.lastSceneAt = now;
    pushRolling(this.phaserDeltaSamples, phaserDeltaMs, this.sampleLimit);
    pushRolling(this.sceneUpdateCpuSamples, sceneUpdateCpuMs, this.sampleLimit);
  }

  reset() {
    this.rafSamples.length = 0;
    this.sceneSamples.length = 0;
    this.phaserDeltaSamples.length = 0;
    this.sceneUpdateCpuSamples.length = 0;
    this.renderCpuSamples.length = 0;
    this.lastRafAt = 0;
    this.lastSceneAt = 0;
    this.renderStartedAt = 0;
  }

  snapshot(): RuntimeProfileSnapshot {
    const raf = summarizeSamples(this.rafSamples, this.targetFrameMs * 1.5);
    const scene = summarizeSamples(this.sceneSamples, this.targetFrameMs * 1.5);
    const phaserDelta = summarizeSamples(this.phaserDeltaSamples, this.targetFrameMs * 1.5);
    return Object.freeze({
      version: 1,
      generatedAt: new Date().toISOString(),
      context: Object.freeze({ ...this.contextProvider() }),
      renderer: readRenderer(this.game),
      frames: Object.freeze({
        targetFrameMs: rounded(this.targetFrameMs),
        raf: Object.freeze({ ...raf, droppedFrameRatio: raf.overBudgetRatio }),
        scene: Object.freeze({ ...scene, droppedFrameRatio: scene.overBudgetRatio }),
        phaserDelta: Object.freeze({ ...phaserDelta, droppedFrameRatio: phaserDelta.overBudgetRatio }),
        sceneUpdateCpu: summarizeSamples(this.sceneUpdateCpuSamples, this.targetFrameMs),
        renderSubmitCpu: summarizeSamples(this.renderCpuSamples, this.targetFrameMs),
      }),
      textureMemory: snapshotTextureMemory(this.game.textures as unknown as TextureManagerLike),
      limitations: Object.freeze([
        "Frame timings are wall-clock CPU observations. renderSubmitCpu ends after command submission and does not wait for GPU completion.",
        "Physical VRAM allocation is unavailable to normal browser JavaScript; textureMemory is a deduplicated decoded RGBA8 source estimate.",
        "Headless browser GPU identity and performance can differ from a visible browser on the same device.",
      ]),
    });
  }

  async waitForSamples(minimumSceneFrames = 180, timeoutMs = 20_000) {
    const minimum = Math.max(1, Math.floor(minimumSceneFrames));
    const deadline = performance.now() + Math.max(1, timeoutMs);
    while (this.sceneSamples.length < minimum && performance.now() < deadline) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, 50));
    }
    return this.snapshot();
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    cancelAnimationFrame(this.rafId);
    this.game.events.off("prerender", this.onPreRender, this);
    this.game.events.off("postrender", this.onPostRender, this);
  }
}

export function installDevRuntimeProfiler(
  game: Phaser.Game,
  scene: Phaser.Scene,
  contextProvider: () => ProfilingContext,
  primeDeterministicArsenal: OverloadQaApi["primeDeterministicArsenal"],
) {
  const profiler = new PhaserRuntimeProfiler(game, contextProvider);
  let sceneUpdateStartedAt = 0;
  let sceneEventsAttached = false;
  let attachRaf = 0;
  let destroyed = false;
  const onPreUpdate = (_time: number, deltaMs: number) => {
    sceneUpdateStartedAt = performance.now();
    (onPreUpdate as unknown as { deltaMs?: number }).deltaMs = deltaMs;
  };
  const onPostUpdate = () => {
    if (sceneUpdateStartedAt <= 0) return;
    const deltaMs = finite((onPreUpdate as unknown as { deltaMs?: number }).deltaMs);
    profiler.recordSceneUpdate(deltaMs, performance.now() - sceneUpdateStartedAt);
    sceneUpdateStartedAt = 0;
  };
  const attachSceneEvents = () => {
    if (destroyed || sceneEventsAttached) return;
    const events = (scene as unknown as { events?: Phaser.Events.EventEmitter }).events;
    if (!events) {
      attachRaf = requestAnimationFrame(attachSceneEvents);
      return;
    }
    events.on("preupdate", onPreUpdate);
    events.on("postupdate", onPostUpdate);
    sceneEventsAttached = true;
  };
  attachSceneEvents();

  const api: OverloadQaApi = Object.freeze({
    version: 1,
    getSnapshot: () => profiler.snapshot(),
    reset: () => profiler.reset(),
    waitForSamples: (minimumSceneFrames, timeoutMs) => profiler.waitForSamples(minimumSceneFrames, timeoutMs),
    primeDeterministicArsenal,
  });
  const qaWindow = window as QaWindow;
  qaWindow.__OVERLOAD_QA__ = api;

  return Object.freeze({
    profiler,
    api,
    destroy: () => {
      destroyed = true;
      cancelAnimationFrame(attachRaf);
      if (sceneEventsAttached) {
        scene.events.off("preupdate", onPreUpdate);
        scene.events.off("postupdate", onPostUpdate);
      }
      profiler.destroy();
      if (qaWindow.__OVERLOAD_QA__ === api) delete qaWindow.__OVERLOAD_QA__;
    },
  });
}

declare global {
  interface Window {
    __OVERLOAD_QA__?: OverloadQaApi;
  }
}

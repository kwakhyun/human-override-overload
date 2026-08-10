import type Phaser from "phaser";
import { getRenderBackingSize } from "../../swarm/performance.js";

const LOGICAL_WIDTH = 1280;
const LOGICAL_HEIGHT = 720;

type AdaptivePreset = Readonly<{
  id?: string;
  renderFps?: number;
  renderScale?: number;
}>;

type MutableTimeStep = Phaser.Core.TimeStep & {
  _target?: number;
  targetFps?: number;
  actualFps?: number;
  setFPSLimit?: (fps: number) => Phaser.Core.TimeStep;
  resetDelta?: () => void;
};

const pendingFrameRates = new WeakMap<object, number>();
const scheduledFrameRateUpdates = new WeakSet<object>();

type WebGLDrawingContext = {
  width: number;
  height: number;
  state: {
    viewport: number[];
    scissor: { box: number[] };
  };
};

type AdaptiveWebGLRenderer = {
  gl?: WebGLRenderingContext;
  baseDrawingContext?: WebGLDrawingContext;
  drawingBufferHeight?: number;
  resolution?: number;
};

export type AppliedRenderPolicy = Readonly<{
  changed: boolean;
  webgl: boolean;
  renderFps: number;
  requestedRenderScale: number;
  renderScale: number;
  logicalWidth: number;
  logicalHeight: number;
  backingWidth: number;
  backingHeight: number;
}>;

function applyFramePacing(game: Phaser.Game, fps: number) {
  const loop = game.loop as MutableTimeStep;
  const pendingFps = pendingFrameRates.get(loop as object);
  const changed = pendingFps === undefined
    ? loop.fpsLimit !== fps || loop.targetFps !== fps
    : pendingFps !== fps;
  if (!changed) return false;

  pendingFrameRates.set(loop as object, fps);
  if (scheduledFrameRateUpdates.has(loop as object)) return true;
  scheduledFrameRateUpdates.add(loop as object);

  // Phaser 4.2 setFPSLimit stops and restarts RequestAnimationFrame. Calling
  // it from inside the current TimeStep callback lets the old wrapper schedule
  // a second RAF chain after the callback returns. A microtask runs after that
  // wrapper has scheduled, so setFPSLimit cancels the old request and leaves
  // exactly one newly configured chain. Multiple quality changes coalesce.
  queueMicrotask(() => {
    scheduledFrameRateUpdates.delete(loop as object);
    const nextFps = pendingFrameRates.get(loop as object);
    pendingFrameRates.delete(loop as object);
    if (!nextFps) return;
    loop.targetFps = nextFps;
    loop._target = 1000 / nextFps;
    loop.actualFps = nextFps;
    loop.setFPSLimit?.(nextFps);
    loop.resetDelta?.();
  });
  return true;
}

function applyWebGLBackingScale(game: Phaser.Game, requested: ReturnType<typeof getRenderBackingSize>) {
  const canvas = game.canvas;
  const renderer = game.renderer as unknown as AdaptiveWebGLRenderer;
  const drawingContext = renderer?.baseDrawingContext;
  const gl = renderer?.gl;
  if (!canvas || !gl || !drawingContext) {
    return {
      changed: false,
      webgl: false,
      backingWidth: LOGICAL_WIDTH,
      backingHeight: LOGICAL_HEIGHT,
      renderScale: 1,
    };
  }

  const backingWidth = requested.backingWidth;
  const backingHeight = requested.backingHeight;
  const changed = canvas.width !== backingWidth || canvas.height !== backingHeight;
  if (changed) {
    // CSS remains 100% of the fixed 16:9 host. Only the WebGL drawing buffer is
    // reduced, while the camera and pointer coordinate system stay 1280x720.
    canvas.width = backingWidth;
    canvas.height = backingHeight;
  }

  // Phaser's base DrawingContext supplies the shader projection as well as the
  // GL viewport. Preserve logical projection dimensions, but rasterize into the
  // smaller physical viewport. Camera clones inherit this separation.
  drawingContext.width = LOGICAL_WIDTH;
  drawingContext.height = LOGICAL_HEIGHT;
  drawingContext.state.viewport = [0, 0, backingWidth, backingHeight];
  drawingContext.state.scissor.box = [0, 0, backingWidth, backingHeight];
  renderer.drawingBufferHeight = gl.drawingBufferHeight;
  renderer.resolution = requested.renderScale;
  canvas.dataset.qualityRenderScale = String(requested.renderScale);
  canvas.dataset.backingSize = `${backingWidth}x${backingHeight}`;

  return {
    changed,
    webgl: true,
    backingWidth,
    backingHeight,
    renderScale: requested.renderScale,
  };
}

/**
 * Applies presentation-only pacing and backing-buffer changes. Simulation
 * authority stays in OverloadScene's 60 Hz fixed-step accumulator.
 */
export function applyAdaptiveRenderPolicy(game: Phaser.Game, preset: AdaptivePreset): AppliedRenderPolicy {
  const renderFps = Math.max(30, Math.min(60, Math.round(Number(preset?.renderFps) || 60)));
  const requested = getRenderBackingSize(preset, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  const pacingChanged = applyFramePacing(game, renderFps);
  const backing = applyWebGLBackingScale(game, requested);
  return Object.freeze({
    changed: pacingChanged || backing.changed,
    webgl: backing.webgl,
    renderFps,
    requestedRenderScale: requested.renderScale,
    renderScale: backing.renderScale,
    logicalWidth: LOGICAL_WIDTH,
    logicalHeight: LOGICAL_HEIGHT,
    backingWidth: backing.backingWidth,
    backingHeight: backing.backingHeight,
  });
}

export function resetAdaptiveFrameTiming(game: Phaser.Game) {
  const loop = game.loop as MutableTimeStep;
  loop.resetDelta?.();
}

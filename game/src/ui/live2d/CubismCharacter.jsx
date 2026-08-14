import { useCallback, useEffect, useRef, useState } from "react";
import {
  Live2DCanvas,
  Live2DCanvasContext,
  Live2DModel,
  Live2DRunner,
  useLive2DModelContext,
  useTicker,
} from "@greenmansk/react-live2d";

export const CUBISM_CORE_URL = "/vendor/live2d/live2dcubismcore.min.js";
export const CUBISM_CORE_SOURCE_URL = "https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js";

const CUBISM_MODELS = Object.freeze({
  aegis: Object.freeze({
    modelJsonPath: "/assets/overload/live2d/aegis/aegis.model3.json",
    scale: 1,
    positionX: 0,
    positionY: -0.03,
  }),
  mika: Object.freeze({
    modelJsonPath: "/assets/overload/live2d/mika/mika.model3.json",
    scale: 1,
    positionX: 0,
    positionY: -0.03,
  }),
});

const REACTION_TARGETS = Object.freeze({
  aegis: Object.freeze({
    head: Object.freeze({ x: -0.24, y: 0.18, bodyX: -0.08, bodyY: 0.03 }),
    chest: Object.freeze({ x: 0.18, y: -0.08, bodyX: 0.1, bodyY: -0.08 }),
    arms: Object.freeze({ x: -0.2, y: 0, bodyX: -0.18, bodyY: 0 }),
    legs: Object.freeze({ x: 0.12, y: -0.22, bodyX: 0.08, bodyY: -0.12 }),
  }),
  mika: Object.freeze({
    head: Object.freeze({ x: 0.28, y: 0.2, bodyX: 0.14, bodyY: 0.04 }),
    chest: Object.freeze({ x: -0.3, y: -0.08, bodyX: -0.18, bodyY: -0.08 }),
    arms: Object.freeze({ x: 0.24, y: 0.02, bodyX: 0.2, bodyY: 0 }),
    legs: Object.freeze({ x: -0.18, y: -0.24, bodyX: -0.12, bodyY: -0.13 }),
  }),
});

const REACTION_EXPRESSIONS = Object.freeze({
  aegis: "cold",
  mika: "shy",
});

let cubismCorePromise;

export function loadCubismCore() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("Cubism Core requires a browser environment."));
  }
  if (window.Live2DCubismCore) return Promise.resolve(window.Live2DCubismCore);
  if (cubismCorePromise) return cubismCorePromise;

  cubismCorePromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-cubism-core="bundled"]');
    const script = existing || document.createElement("script");
    const resolveCore = () => {
      if (window.Live2DCubismCore) resolve(window.Live2DCubismCore);
      else reject(new Error("Cubism Core loaded without exposing Live2DCubismCore."));
    };
    const rejectCore = () => reject(new Error("Cubism Core could not be loaded."));

    script.addEventListener("load", resolveCore, { once: true });
    script.addEventListener("error", rejectCore, { once: true });
    if (!existing) {
      script.src = CUBISM_CORE_URL;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.dataset.cubismCore = "bundled";
      document.head.appendChild(script);
    }
  }).catch((error) => {
    cubismCorePromise = undefined;
    throw error;
  });

  return cubismCorePromise;
}

function ModelReactionDriver({ characterId, reaction }) {
  const { motionManager } = useLive2DModelContext();

  useEffect(() => {
    if (!motionManager || !reaction?.area) return undefined;
    const target = REACTION_TARGETS[characterId]?.[reaction.area];
    if (!target) return undefined;

    motionManager.setLookTargetRelative(target.x, target.y, 5.8);
    motionManager.setBodyOrientationTargetRelative(target.bodyX, target.bodyY, 3.8);
    motionManager.setExpression(REACTION_EXPRESSIONS[characterId]);
    const resetTimer = window.setTimeout(() => {
      motionManager.setLookTargetRelative(0, 0, 2.6);
      motionManager.setBodyOrientationTargetRelative(0, 0, 2.2);
      motionManager.resetExpression();
    }, characterId === "mika" ? 1050 : 760);
    return () => window.clearTimeout(resetTimer);
  }, [characterId, motionManager, reaction?.area, reaction?.token]);

  return null;
}

export function CubismCharacter({ characterId, fallbackSource, name, reaction }) {
  const ticker = useTicker();
  const model = CUBISM_MODELS[characterId] || CUBISM_MODELS.aegis;
  const hostRef = useRef(null);
  const canvasRef = useRef(null);
  const [coreReady, setCoreReady] = useState(Boolean(globalThis.Live2DCubismCore));
  const [modelReady, setModelReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    loadCubismCore()
      .then(() => active && setCoreReady(true))
      .catch(() => active && setFailed(true));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!coreReady || failed || !hostRef.current || !canvasRef.current) return undefined;
    const resize = () => {
      const host = hostRef.current;
      const canvas = canvasRef.current;
      if (!host || !canvas) return;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(host.clientWidth * pixelRatio));
      canvas.height = Math.max(1, Math.round(host.clientHeight * pixelRatio));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(hostRef.current);
    return () => observer.disconnect();
  }, [coreReady, failed]);

  const connectCanvas = useCallback((element, setCanvas) => {
    canvasRef.current = element;
    setCanvas(element);
  }, []);

  return (
    <span
      ref={hostRef}
      className={`motion-portrait-body cubism-character${modelReady ? " is-ready" : ""}${failed ? " is-fallback" : ""}`}
      data-live2d-ready={modelReady ? "true" : "false"}
      data-live2d-model={characterId}
    >
      {fallbackSource && (
        <img
          className="cubism-character-fallback"
          src={fallbackSource}
          alt={`${name} 로비 전신 일러스트`}
          aria-hidden={modelReady ? "true" : undefined}
        />
      )}
      {coreReady && !failed && (
        <Live2DRunner ticker={ticker}>
          <Live2DCanvas>
            <Live2DCanvasContext.Consumer>
              {({ setCanvas }) => (
                <canvas
                  className="cubism-character-canvas"
                  aria-label={`${name} Cubism Live2D 모델`}
                  ref={(element) => connectCanvas(element, setCanvas)}
                />
              )}
            </Live2DCanvasContext.Consumer>
            <Live2DModel
              modelJsonPath={model.modelJsonPath}
              scale={model.scale}
              positionX={model.positionX}
              positionY={model.positionY}
              showHitAreas={false}
              onLoad={() => setModelReady(true)}
              onError={() => setFailed(true)}
            >
              <ModelReactionDriver characterId={characterId} reaction={reaction} />
            </Live2DModel>
          </Live2DCanvas>
        </Live2DRunner>
      )}
    </span>
  );
}

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
    scale: 0.94,
    positionX: 0,
    positionY: 0.025,
    idlePeriod: 5_400,
    idlePhase: 0.35,
    idleExpression: "cold-idle",
    idleMotionCadence: 10_800,
  }),
  mika: Object.freeze({
    modelJsonPath: "/assets/overload/live2d/mika/mika.model3.json",
    fallbackPath: "/assets/overload/hero/mika-live2d-fullbody.png",
    scale: 0.94,
    positionX: 0,
    positionY: -0.035,
    idlePeriod: 4_600,
    idlePhase: 1.6,
    idleExpression: "bright-idle",
    idleMotionCadence: 8_600,
  }),
});

const REACTION_TARGETS = Object.freeze({
  aegis: Object.freeze({
    head: Object.freeze({ x: -0.3, y: 0.2, bodyX: -0.13, bodyY: 0.04, shake: 0.2, shakePeriod: 72, duration: 980 }),
    chest: Object.freeze({ x: 0.24, y: -0.1, bodyX: 0.18, bodyY: -0.1, shake: 0.14, shakePeriod: 88, duration: 920 }),
    arms: Object.freeze({ x: -0.26, y: 0.02, bodyX: -0.24, bodyY: 0.02, shake: 0.28, shakePeriod: 66, duration: 900 }),
    legs: Object.freeze({ x: 0.16, y: -0.25, bodyX: 0.12, bodyY: -0.16, shake: 0.16, shakePeriod: 92, duration: 960 }),
  }),
  mika: Object.freeze({
    head: Object.freeze({ x: 0.34, y: 0.24, bodyX: 0.19, bodyY: 0.05, shake: 0.24, shakePeriod: 76, duration: 1_280 }),
    chest: Object.freeze({ x: -0.36, y: -0.12, bodyX: -0.25, bodyY: -0.12, shake: 0.2, shakePeriod: 84, duration: 1_360 }),
    arms: Object.freeze({ x: 0.3, y: 0.04, bodyX: 0.26, bodyY: 0.02, shake: 0.32, shakePeriod: 64, duration: 1_180 }),
    legs: Object.freeze({ x: -0.22, y: -0.28, bodyX: -0.16, bodyY: -0.18, shake: 0.2, shakePeriod: 90, duration: 1_240 }),
  }),
});

const REACTION_EXPRESSIONS = Object.freeze({
  aegis: Object.freeze({ head: "cold-head", chest: "cold-chest", arms: "cold-arms", legs: "cold-legs" }),
  mika: Object.freeze({ head: "shy-head", chest: "shy-chest", arms: "shy-arms", legs: "shy-legs" }),
});

const REACTION_MOTIONS = Object.freeze({
  head: "TouchHead",
  chest: "TouchChest",
  arms: "TouchArms",
  legs: "TouchLegs",
});

function supportsMotionGroup(motionManager, group) {
  const groups = motionManager?.getMotionGroups?.();
  return Boolean(groups?.has?.(group) && groups.get(group) > 0);
}

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

function reactionEnvelope(elapsed, duration) {
  const attack = Math.min(1, elapsed / 150);
  const release = Math.min(1, Math.max(0, duration - elapsed) / 260);
  return Math.sin(Math.min(1, attack) * Math.PI * 0.5) * release;
}

function ModelMotionDriver({ characterId, reaction }) {
  const { motionManager } = useLive2DModelContext();
  const model = CUBISM_MODELS[characterId] || CUBISM_MODELS.aegis;
  const reactionRef = useRef(null);
  const expressionOwnerRef = useRef("none");
  const idleVariantRef = useRef(1);

  const startBaseIdle = useCallback(() => {
    if (supportsMotionGroup(motionManager, "Idle")) {
      motionManager.setMotion("Idle", 0, 1);
    }
  }, [motionManager]);

  useEffect(() => {
    if (!motionManager || !reaction?.area) return undefined;
    const target = REACTION_TARGETS[characterId]?.[reaction.area];
    if (!target) return undefined;

    reactionRef.current = { target, startedAt: performance.now(), token: reaction.token };
    expressionOwnerRef.current = "reaction";
    motionManager.setExpression(REACTION_EXPRESSIONS[characterId]?.[reaction.area]);
    const motionGroup = REACTION_MOTIONS[reaction.area];
    if (supportsMotionGroup(motionManager, motionGroup)) {
      const reactionToken = reaction.token;
      motionManager.setMotion(motionGroup, 0, 3, () => {
        if (reactionRef.current?.token === reactionToken) {
          reactionRef.current = null;
        }
        startBaseIdle();
      });
    }
    return undefined;
  }, [characterId, motionManager, reaction?.area, reaction?.token, startBaseIdle]);

  useEffect(() => {
    if (!motionManager) return undefined;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    let animationFrame = 0;
    let disposed = false;
    let nextIdleExpressionAt = performance.now() + 2_100 + model.idlePhase * 420;
    let idleExpressionResetAt = 0;
    let nextIdleMotionAt = performance.now() + model.idleMotionCadence * 0.72;

    if (!reducedMotion) startBaseIdle();

    const animate = (now) => {
      if (disposed) return;
      const time = now / model.idlePeriod + model.idlePhase;
      const breath = reducedMotion ? 0 : Math.sin(time * Math.PI * 2);
      const sway = reducedMotion ? 0 : Math.sin(time * Math.PI * 1.12 + 0.8);
      const activeReaction = reactionRef.current;
      let reactionMix = 0;
      let reactionShake = 0;
      let target = null;

      if (activeReaction) {
        const elapsed = now - activeReaction.startedAt;
        target = activeReaction.target;
        if (elapsed < target.duration) {
          reactionMix = reactionEnvelope(elapsed, target.duration);
          reactionShake = Math.sin(elapsed / target.shakePeriod * Math.PI * 2) * target.shake * reactionMix;
        }
        else {
          reactionRef.current = null;
          if (expressionOwnerRef.current === "reaction") {
            motionManager.resetExpression();
            expressionOwnerRef.current = "none";
          }
          nextIdleExpressionAt = now + 3_200;
        }
      }

      // Keep the model anchored. All visible movement is driven through Cubism
      // parameters, so a touch bends the rigged body/hair instead of sliding the
      // entire portrait around the lobby.
      motionManager.setLookTargetRelative(
        sway * 0.075 + (target?.x || 0) * reactionMix + reactionShake,
        breath * 0.045 + (target?.y || 0) * reactionMix,
        reactionMix > 0 ? 8.2 : 1.35,
      );
      motionManager.setBodyOrientationTargetRelative(
        sway * 0.085 + (target?.bodyX || 0) * reactionMix + reactionShake * 0.72,
        breath * 0.04 + (target?.bodyY || 0) * reactionMix,
        reactionMix > 0 ? 7.4 : 1.1,
      );

      if (!activeReaction && !reducedMotion && now >= nextIdleExpressionAt) {
        motionManager.setExpression(model.idleExpression);
        expressionOwnerRef.current = "idle";
        idleExpressionResetAt = now + (characterId === "mika" ? 920 : 720);
        nextIdleExpressionAt = now + model.idlePeriod * 0.92;
      } else if (!activeReaction && expressionOwnerRef.current === "idle" && now >= idleExpressionResetAt) {
        motionManager.resetExpression();
        expressionOwnerRef.current = "none";
      }

      if (!activeReaction && !reducedMotion && now >= nextIdleMotionAt && supportsMotionGroup(motionManager, "Idle")) {
        const idleVariant = idleVariantRef.current;
        idleVariantRef.current = idleVariant === 1 ? 2 : 1;
        motionManager.setMotion("Idle", idleVariant, 2, startBaseIdle);
        nextIdleMotionAt = now + model.idleMotionCadence;
      }

      animationFrame = window.requestAnimationFrame(animate);
    };

    motionManager.setScale(model.scale);
    motionManager.setPosition(model.positionX, model.positionY);
    animationFrame = window.requestAnimationFrame(animate);
    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      motionManager.resetExpression();
      motionManager.setScale(model.scale);
      motionManager.setPosition(model.positionX, model.positionY);
    };
  }, [characterId, model, motionManager, startBaseIdle]);

  return null;
}

export function CubismCharacter({ characterId, fallbackSource, name, reaction }) {
  const ticker = useTicker();
  const model = CUBISM_MODELS[characterId] || CUBISM_MODELS.aegis;
  const resolvedFallbackSource = model.fallbackPath || fallbackSource;
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
      data-live2d-rig="premium-motion-v2"
    >
      {resolvedFallbackSource && (
        <img
          className="cubism-character-fallback"
          src={resolvedFallbackSource}
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
              <ModelMotionDriver characterId={characterId} reaction={reaction} />
            </Live2DModel>
          </Live2DCanvas>
        </Live2DRunner>
      )}
    </span>
  );
}

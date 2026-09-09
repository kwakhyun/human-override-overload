import { useEffect, useRef, useState } from 'react';
import { createCubismMotion } from './cubismMotion.js';
import { CUBISM_PORTRAITS } from '../../game/assets/manifest.ts';
import { applyPortraitFit, portraitFit } from './portraitFraming.js';
import { PORTRAIT_TOUCH_ZONES, createPortraitDialogue } from './portraitInteractions.js';
import './portrait.css';

// Mount with a character key: artwork, timers, gaze and GPU resources have one owner.
export function InteractivePortrait({ source, characterId, name, onReact, presentation = 'profile' }) {
  const rootRef = useRef(null), imageRef = useRef(null), canvasRef = useRef(null);
  const engineRef = useRef(null), callbackRef = useRef(onReact);
  const [ready, setReady] = useState(false);
  const [speech, setSpeech] = useState(null);
  const speechTimer = useRef(null), dialogueRef = useRef(null), speechToken = useRef(0);
  useEffect(() => {
    dialogueRef.current = createPortraitDialogue(characterId);
    setSpeech(null);
    return () => clearTimeout(speechTimer.current);
  }, [characterId]);
  useEffect(() => { callbackRef.current = onReact; }, [onReact]);
  useEffect(() => {
    const root = rootRef.current, img = imageRef.current, canvas = canvasRef.current;
    const assets = CUBISM_PORTRAITS[characterId];
    if (!assets) return;
    setReady(false);
    const motion = createCubismMotion(characterId);
    const abort = new AbortController();
    engineRef.current = motion;
    let renderer, loading = false, disposed = false, failed = false, raf = 0, previous = 0, visible = true;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduced = () => preference.matches || document.documentElement.classList.contains('game-reduced-motion');
    const canAnimate = () => !disposed && !failed && renderer && visible && !document.hidden && !root.closest('[inert]');
    const fail = () => {
      failed = true; cancelAnimationFrame(raf); raf = 0; previous = 0;
      abort.abort();
      renderer?.destroy(); renderer = undefined;
      if (!disposed) setReady(false);
    };
    const resize = () => {
      const { width, height } = root.getBoundingClientRect();
      const fit = renderer?.resize(width,height,window.devicePixelRatio) || portraitFit(width,height,characterId,presentation);
      applyPortraitFit(root,fit);
      root.style.setProperty('--portrait-speech-top', `${fit.top + 575 * fit.height / 1280}px`);
      if (renderer) { try { renderer.draw(motion.update(0,reduced())); } catch { fail(); } }
    };
    const frame = (time) => {
      raf = 0;
      if (!canAnimate()) { previous = 0; return; }
      try { renderer.draw(motion.update(previous ? (time-previous)/1000 : 0,reduced())); } catch { fail(); return; }
      previous = time;
      if (!reduced()) raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (!canAnimate()) { cancelAnimationFrame(raf); raf = 0; previous = 0; return; }
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const begin = async () => {
      if (renderer || loading || disposed || failed || !img.naturalWidth) return;
      loading = true;
      try {
        const { createCubismRenderer } = await import('./cubismRenderer.js');
        if (disposed || renderer) return;
        const created = await createCubismRenderer(canvas,assets,characterId,presentation,abort.signal);
        if (disposed || failed) { created.destroy(); return; }
        renderer = created;
        resize();
        if (failed) return;
        setReady(true);
        wake();
      } catch { fail(); }
    };
    const contextLost = (event) => {
      event.preventDefault(); fail();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(root);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; wake(); });
    intersection.observe(root);
    const attributes = new MutationObserver(wake);
    attributes.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
    attributes.observe(document.body,{attributes:true,subtree:true,attributeFilter:['inert']});
    document.addEventListener('visibilitychange',wake);
    preference.addEventListener('change',wake);
    img.addEventListener('load',begin);
    canvas.addEventListener('webglcontextlost',contextLost);
    if (img.complete) begin();
    resize();
    return () => {
      disposed = true; abort.abort(); engineRef.current = null;
      cancelAnimationFrame(raf); observer.disconnect(); intersection.disconnect(); attributes.disconnect();
      document.removeEventListener('visibilitychange',wake);
      preference.removeEventListener('change',wake); img.removeEventListener('load',begin);
      canvas.removeEventListener('webglcontextlost',contextLost);
      renderer?.destroy();
    };
  }, [source, characterId, presentation]);
  const react = (zone) => {
    engineRef.current?.react(zone.motion);
    const text = dialogueRef.current?.(zone.key);
    if (text) {
      clearTimeout(speechTimer.current);
      setSpeech({ text, token: ++speechToken.current, area: zone.key });
      speechTimer.current = setTimeout(() => setSpeech(null), 5200);
    }
    callbackRef.current?.(zone.key);
  };
  return (
    <div ref={rootRef} className={`interactive-portrait${ready ? ' is-rendered' : ''}`} data-portrait-renderer={ready ? 'cubism' : 'static-fallback'}
      onPointerMove={(event) => {
        if (event.pointerType !== 'mouse') return;
        const box = event.currentTarget.getBoundingClientRect();
        engineRef.current?.look((event.clientX-box.left)/box.width*2-1,(event.clientY-box.top)/box.height*2-1);
      }} onPointerLeave={() => engineRef.current?.look(0,0)}>
      <img ref={imageRef} className="portrait-source" src={source} alt={`${name} 상반신 일러스트`} draggable="false" decoding="async" />
      <canvas ref={canvasRef} className="portrait-mesh" aria-hidden="true" />
      <div className={`portrait-touch-map is-${characterId}`} aria-label={`${name} 부위별 반응`}>
        {(PORTRAIT_TOUCH_ZONES[characterId] || []).map(zone => <button key={zone.key} type="button" className={`portrait-touch-zone is-${zone.key}`} data-portrait-zone={zone.key}
          style={{left:`${zone.bounds[0]/9.6}%`,top:`${zone.bounds[1]/12.8}%`,width:`${zone.bounds[2]/9.6}%`,height:`${zone.bounds[3]/12.8}%`}}
          data-ui-sound="click" onClick={() => react(zone)} aria-label={`${name} ${zone.label} 반응 보기`} />)}
      </div>
      {speech && <aside className="portrait-reaction-speech" key={speech.token} data-reaction-area={speech.area} role="status" aria-live="polite" aria-atomic="true"><strong>{name}</strong><p>{speech.text}</p></aside>}
    </div>
  );
}

// Dialogue shares the camera frame without allocating GPU resources or input.
export function OperativePortraitImage({ source, characterId, alt }) {
  const rootRef = useRef(null);
  useEffect(() => {
    const root = rootRef.current;
    const resize = () => {
      const { width, height } = root.getBoundingClientRect();
      applyPortraitFit(root,portraitFit(width,height,characterId));
    };
    const observer = new ResizeObserver(resize);
    observer.observe(root);resize();
    return () => observer.disconnect();
  }, [characterId]);
  return <span ref={rootRef} className="operative-portrait-image"><img className="portrait-source" src={source} alt={alt} draggable="false" decoding="async" /></span>;
}

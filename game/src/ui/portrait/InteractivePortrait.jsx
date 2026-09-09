import { useEffect, useRef, useState } from 'react';
import { createPortraitMotion, PORTRAIT_RIGS, portraitFit } from './portraitMotion.js';
import { applyPortraitFit } from './portraitFraming.js';
import './portrait.css';

const ZONES = [
  ['head', '머리'], ['chest', '상체'], ['armLeft', '왼팔'], ['armRight', '오른팔'], ['legs', '장비'],
];

// Mount with a character key: artwork, timers, gaze and GPU resources have one owner.
export function InteractivePortrait({ source, characterId, name, onReact }) {
  const rootRef = useRef(null), imageRef = useRef(null), canvasRef = useRef(null);
  const engineRef = useRef(null), callbackRef = useRef(onReact);
  const [ready, setReady] = useState(false);
  useEffect(() => { callbackRef.current = onReact; }, [onReact]);
  useEffect(() => {
    const root = rootRef.current, img = imageRef.current, canvas = canvasRef.current;
    if (!PORTRAIT_RIGS[characterId]) return;
    const motion = createPortraitMotion(characterId);
    engineRef.current = motion;
    let renderer, disposed = false, failed = false, raf = 0, previous = 0, visible = true;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const reduced = () => preference.matches || document.documentElement.classList.contains('game-reduced-motion');
    const canAnimate = () => !disposed && !failed && renderer && visible && !document.hidden && !root.closest('[inert]');
    const resize = () => {
      const { width, height } = root.getBoundingClientRect();
      const fit = renderer?.resize(width,height,window.devicePixelRatio) || portraitFit(width,height,characterId);
      applyPortraitFit(root,fit);
      if (renderer) renderer.draw(motion.update(0,reduced()));
    };
    const frame = (time) => {
      raf = 0;
      if (!canAnimate()) { previous = 0; return; }
      renderer.draw(motion.update(previous ? (time-previous)/1000 : 0,reduced()));
      previous = time;
      if (!reduced()) raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (!canAnimate()) { cancelAnimationFrame(raf); raf = 0; previous = 0; return; }
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const begin = async () => {
      if (renderer || disposed || failed || !img.naturalWidth) return;
      try {
        const { createPortraitRenderer } = await import('./portraitRenderer.js');
        if (disposed || renderer) return;
        renderer = createPortraitRenderer(canvas,img,characterId);
        resize();
        setReady(true);
        wake();
      } catch { failed = true; if (!disposed) setReady(false); }
    };
    const contextLost = (event) => {
      event.preventDefault(); failed = true;
      cancelAnimationFrame(raf); raf = 0;
      if (!disposed) setReady(false);
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
      disposed = true; engineRef.current = null;
      cancelAnimationFrame(raf); observer.disconnect(); intersection.disconnect(); attributes.disconnect();
      document.removeEventListener('visibilitychange',wake);
      preference.removeEventListener('change',wake); img.removeEventListener('load',begin);
      canvas.removeEventListener('webglcontextlost',contextLost);
      renderer?.destroy();
    };
  }, [source, characterId]);
  const react = (zone) => {
    engineRef.current?.react(zone);
    callbackRef.current?.(zone.startsWith('arm') ? 'arms' : zone,zone);
  };
  return (
    <div ref={rootRef} className={`interactive-portrait${ready ? ' is-rendered' : ''}`} data-portrait-renderer={ready ? 'artwork-mesh' : 'static-fallback'}
      onPointerMove={(event) => {
        if (event.pointerType !== 'mouse') return;
        const box = event.currentTarget.getBoundingClientRect();
        engineRef.current?.look((event.clientX-box.left)/box.width*2-1,(event.clientY-box.top)/box.height*2-1);
      }} onPointerLeave={() => engineRef.current?.look(0,0)}>
      <img ref={imageRef} className="portrait-source" src={source} alt={`${name} 상반신 일러스트`} draggable="false" decoding="async" />
      <canvas ref={canvasRef} className="portrait-mesh" aria-hidden="true" />
      <div className={`portrait-touch-map is-${characterId}`} aria-label={`${name} 터치 상호작용`}>
        {ZONES.map(([zone,label]) => <button key={zone} type="button" className={`portrait-touch-zone is-${zone}`} data-ui-sound="click" onClick={() => react(zone)} aria-label={`${name} ${label} 반응 보기`} />)}
      </div>
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

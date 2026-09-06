import { useLayoutEffect, useRef } from 'react';
import { npcPortraitFit } from './npcPortraitFraming.js';

// One anatomical camera for every NPC surface, independent of source padding.
export function NpcPortraitImage({ source, npcId, alt = '' }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const root = ref.current;
    const resize = () => {
      const fit = npcPortraitFit(root.clientWidth, root.clientHeight, npcId);
      for (const [key, value] of Object.entries(fit)) root.style.setProperty(`--npc-${key}`, `${value}px`);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(root);
    resize();
    return () => observer.disconnect();
  }, [npcId]);
  return <span className="npc-portrait-camera" data-npc={npcId} ref={ref}>
    <span className="npc-portrait-crop">
      <img src={source} alt={alt} draggable="false" decoding="async" />
    </span>
  </span>;
}

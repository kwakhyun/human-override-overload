import { useCallback, useEffect, useRef, useState } from 'react';
import { STORY_ART, STORY_EPISODES, availableStoryEpisodes } from '../../game/content/storyEpisodes.js';
import { useDialogFocusTrap } from '../useDialogFocusTrap.js';
import './story.css';

export function StorySceneScreen({ episodeId, onComplete, replay = false }) {
  const episode = STORY_EPISODES[episodeId];
  const [index, setIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const root = useRef(null), completed = useRef(false), lastAction = useRef(-Infinity);
  useDialogFocusTrap(root);
  const finish = useCallback(() => {
    if (completed.current) return;
    completed.current = true;
    onComplete();
  }, [onComplete]);
  const advance = useCallback(() => {
    // Rapid taps and held keys must not skip dialogue or consume two chapters.
    const now = performance.now();
    if (completed.current || now - lastAction.current < 180) return;
    lastAction.current = now;
    if (index < episode.lines.length - 1) setIndex(index + 1);
    else finish();
  }, [index, episode, finish]);
  useEffect(() => {
    const handler = event => {
      if (![' ', 'Enter'].includes(event.key)) return;
      // Let focused previous/skip buttons retain their native keyboard behavior.
      if (event.target.closest?.('button:not([data-story-next])')) return;
      event.preventDefault();
      if (!event.repeat) advance();
    };
    const node = root.current;
    node.addEventListener('keydown', handler);
    return () => node.removeEventListener('keydown', handler);
  }, [advance]);
  const current = episode.lines[index];
  useEffect(() => { setImageFailed(false); }, [current.art]);
  // Warm the next scene only. The complete art collection is not an app-start dependency.
  useEffect(() => {
    const next = episode.lines.slice(index + 1).find(item => item.art !== current.art);
    if (next) { const img = new Image(); img.src = STORY_ART[next.art]; }
  }, [episode, index, current.art]);
  return <main className="story-screen" ref={root} tabIndex={-1} role="dialog" aria-modal="true" aria-label={episode.title}>
    <div className="story-atmosphere" style={{ backgroundImage: `url("${STORY_ART[current.art]}")` }} aria-hidden="true" />
    <header className="story-header"><div><span>{episode.subtitle}</span><h1>{episode.title}</h1></div>
      <button type="button" onClick={finish}>{replay ? '기록으로 돌아가기' : '장면 건너뛰기'}</button></header>
    <figure className="story-stage">
      <img key={current.art} src={STORY_ART[current.art]} alt={`${episode.title} · ${current.art.toUpperCase()} 장면 일러스트`} onError={() => setImageFailed(true)} />
      {imageFailed && <figcaption>장면 이미지를 불러오지 못했습니다. 대사는 계속 읽을 수 있습니다.</figcaption>}
    </figure>
    <section className="story-dialogue">
      <div className="story-speaker"><strong>{current.speaker}</strong><span>{String(index + 1).padStart(2, '0')} / {String(episode.lines.length).padStart(2, '0')}</span></div>
      <p aria-live="polite" aria-atomic="true">{current.text}</p>
      <footer><button type="button" disabled={index === 0} onClick={() => setIndex(value => Math.max(0, value - 1))}>이전 대사</button>
        <span className="story-key-hint">SPACE / ENTER</span>
        <button type="button" data-story-next data-dialog-initial-focus onClick={advance}>{index === episode.lines.length - 1 ? (replay ? '기록으로' : '계속하기') : '다음 대사'} <span aria-hidden="true">→</span></button></footer>
    </section>
  </main>;
}

export function StoryArchiveScreen({ completedRegionIds, onReplay, onBack }) {
  const root = useRef(null);
  useDialogFocusTrap(root);
  useEffect(() => {
    const handler = event => { if (event.key === 'Escape' && !event.repeat) onBack(); };
    const node = root.current;
    node.addEventListener('keydown', handler);
    return () => node.removeEventListener('keydown', handler);
  }, [onBack]);
  return <main ref={root} className="story-archive" tabIndex={-1}>
    <header><div><span>HAVEN-09 · ARCHIVE</span><h1>작전 기록</h1><p>함께 돌아온 사람들, 지워지지 않은 순간들.</p></div><button type="button" onClick={onBack}>헤이븐으로</button></header>
    <div className="story-archive-grid">{availableStoryEpisodes(completedRegionIds).map(([id, episode]) => <button type="button" key={id} onClick={() => onReplay(id)}>
      <img loading="lazy" src={STORY_ART[episode.lines[0].art]} alt="" /><span>{episode.subtitle}</span><strong>{episode.title}</strong><small>다시 보기 →</small>
    </button>)}</div>
    <p className="story-archive-note">구역을 처음 클리어하면 새로운 기록이 열립니다. 다시 보기는 보상과 작전 진행에 영향을 주지 않습니다.</p>
  </main>;
}

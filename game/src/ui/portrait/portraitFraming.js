// Anime upper-body masters: 960 x 1280, calibrated by skull crown and chin.
// The lower cut stays behind the screen/panel while every face shares a scale.
export const PORTRAIT_FRAME = Object.freeze({ width: 960, height: 1280, crown: 80, headHeight: 400 });
export const PORTRAIT_LANDMARKS = Object.freeze({
  aegis: Object.freeze({ crown: 127, chin: 467 }),
  mika: Object.freeze({ crown: 140, chin: 488 }),
  vesper: Object.freeze({ crown: 85, chin: 459 }),
  nox: Object.freeze({ crown: 81, chin: 446 }),
});

export function portraitFit(width, height, characterId = 'aegis', presentation = 'dialogue') {
  const head = PORTRAIT_LANDMARKS[characterId] || PORTRAIT_LANDMARKS.aegis;
  const frame = PORTRAIT_FRAME;
  const unit = Math.max(0, Math.min(width / frame.width, height / frame.height));
  const zoom = presentation === 'lobby' ? .8 : presentation === 'profile' ? .82 : 1;
  const headHeight = unit * frame.headHeight * zoom;
  const scale = headHeight / (head.chin - head.crown);
  // Share a crown line and face size, even though the painted lower cuts differ.
  // Anchoring the shortest crown-to-cut distance hides every source cut below
  // the panel; scaling about the center would leave the bust floating in space.
  const crownToCut = Math.min(...Object.values(PORTRAIT_LANDMARKS).map(
    landmark => (frame.height - landmark.crown) / (landmark.chin - landmark.crown),
  )) * headHeight;
  const crown = presentation === 'dialogue'
    ? height - frame.height * unit + frame.crown * unit
    : height - crownToCut;
  return {
    width: 960 * scale, height: 1280 * scale,
    left: (width - 960 * scale) / 2,
    top: crown - head.crown * scale,
  };
}

export function applyPortraitFit(element, fit) {
  for (const key of ['width', 'height', 'left', 'top']) {
    element.style.setProperty(`--portrait-${key}`, `${fit[key]}px`);
  }
}

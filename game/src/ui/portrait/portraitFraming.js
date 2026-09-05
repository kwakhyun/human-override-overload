// Calibrate the approved 864 x 1536 art by crown-to-chin length, excluding
// twin tails, halos and equipment. One camera frame preserves anatomical
// scale, crown height and original aspect ratio across all operatives.
export const PORTRAIT_FRAME = Object.freeze({ width: 960, height: 1280, crown: 80, headHeight: 280 });
export const PORTRAIT_LANDMARKS = Object.freeze({
  aegis: Object.freeze({ crown: 76, chin: 369 }),
  mika: Object.freeze({ crown: 183, chin: 496 }),
  vesper: Object.freeze({ crown: 95, chin: 349 }),
  nox: Object.freeze({ crown: 148, chin: 422 }),
});

export function portraitFit(width, height, characterId = 'aegis') {
  const head = PORTRAIT_LANDMARKS[characterId] || PORTRAIT_LANDMARKS.aegis;
  const frame = PORTRAIT_FRAME;
  const unit = Math.max(0, Math.min(width / frame.width, height / frame.height));
  const scale = unit * frame.headHeight / (head.chin - head.crown);
  return {
    width: 864 * scale, height: 1536 * scale,
    left: (width - 864 * scale) / 2,
    top: height - frame.height * unit + frame.crown * unit - head.crown * scale,
  };
}

export function applyPortraitFit(element, fit) {
  for (const key of ['width', 'height', 'left', 'top']) {
    element.style.setProperty(`--portrait-${key}`, `${fit[key]}px`);
  }
}

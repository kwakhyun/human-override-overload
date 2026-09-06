// Source coordinates are the approved 864 x 1536 portrait canvas. This is a
// local artwork mesh, not a Cubism model or a replacement for authored moc3 rigs.
export const PORTRAIT_RIGS = Object.freeze({
  aegis: { neck: [438, 367], head: [451, 223, 192, 220], chest: [487, 644], arms: [[238, 889], [723, 1040]], hair: [[232, 613], [582, 467]], eyes: [[449, 252, 24, 10, .18], [522, 275, 20, 9, .23]], energy: .8, tempo: 1, phase: .2 },
  mika: { neck: [445, 490], head: [449, 319, 165, 197], chest: [487, 748], arms: [[193, 1054], [705, 693]], hair: [[191, 515], [665, 506]], eyes: [[419, 366, 24, 13, .22], [510, 398, 23, 12, .21]], energy: 1.12, tempo: 1.13, phase: 1.7 },
  vesper: { neck: [426, 353], head: [429, 222, 150, 162], chest: [481, 576], arms: [[227, 606], [639, 758]], hair: [[355, 267], [519, 269]], eyes: [[418, 245, 22, 10, .22], [482, 269, 18, 9, .28]], energy: .72, tempo: .94, phase: 3.1 },
  nox: { neck: [446, 421], head: [438, 278, 156, 178], chest: [399, 638], arms: [[161, 793], [638, 925]], hair: [[302, 606], [631, 643]], eyes: [[380, 344, 21, 8, -.2], [455, 324, 23, 9, -.29]], energy: .66, tempo: .86, phase: 4.5 },
});

export const TOUCH_AREAS = Object.freeze(['head', 'chest', 'armLeft', 'armRight', 'legs']);
// Head XY, head roll, torso lean, shoulder response L/R, hip shift, expression.
const CLIPS = {
  head: [0, 0, 0, 0, 0, 0, 0, .5],
  chest: [-7, -3, .025, -7, 5, -4, 1, 1],
  armLeft: [-9, 2, -.027, -3, -15, 0, 1, .3],
  armRight: [9, 2, .027, 3, 0, 15, -1, .3],
  legs: [3, 9, -.018, 4, 3, -3, -5, .7],
};

const ease = (t) => t * t * t * (t * (t * 6 - 15) + 10);
export function reactionEnvelope(seconds) {
  const keys = [[0, 0], [.12, -.1], [.48, 1], [1.02, .68], [1.65, .82], [2.9, 0]];
  if (seconds <= 0 || seconds >= 2.9) return 0;
  for (let i = 1; i < keys.length; i++) {
    if (seconds <= keys[i][0]) {
      const [start, a] = keys[i - 1], [end, b] = keys[i];
      return a + (b - a) * ease((seconds - start) / (end - start));
    }
  }
  return 0;
}

export { portraitFit } from './portraitFraming.js';

export function createPortraitMotion(characterId) {
  const rig = PORTRAIT_RIGS[characterId];
  if (!rig) throw new Error(`Unknown portrait: ${characterId}`);
  const pose = new Float32Array(8), velocity = new Float32Array(8);
  let clock = 0, started = -10, clip = null, variant = 0;
  let gazeX = 0, gazeY = 0;
  const output = { pose, breath: 0, hair: 0, blink: 0 };
  return {
    output,
    react(area) {
      if (!CLIPS[area]) return false;
      clip = CLIPS[area];
      started = clock;
      variant = (variant + 1) % 2;
      return true;
    },
    look(x, y) { gazeX = Math.max(-1, Math.min(1, x)); gazeY = Math.max(-1, Math.min(1, y)); },
    reset() { pose.fill(0); velocity.fill(0); clip = null; gazeX = gazeY = 0; output.breath = output.hair = output.blink = 0; },
    update(delta, reduced = false) {
      if (reduced) { this.reset(); return output; }
      // Semi-implicit spring integration at <= 120 Hz prevents refresh-rate
      // dependence and preserves position/velocity when a click interrupts.
      const dt = Math.min(.05, Math.max(0, Number.isFinite(delta) ? delta : 0));
      const steps = Math.max(1, Math.ceil(dt * 120)), step = dt / steps;
      for (let s = 0; s < steps; s++) {
        clock += step;
        const age = (clock - started) * rig.tempo;
        const amount = reactionEnvelope(age) * rig.energy * (variant ? 1 : .9);
        for (let i = 0; i < pose.length; i++) {
          // Painted heads remain attached: no isolated translation or roll,
          // including idle sway, pointer following and other touch reactions.
          if (i < 3) { pose[i] = 0; velocity[i] = 0; continue; }
          let target = (clip?.[i] || 0) * amount;
          velocity[i] += ((target - pose[i]) * 100 - velocity[i] * 19) * step;
          pose[i] += velocity[i] * step;
        }
      }
      output.breath = (Math.sin(clock * 1.55 + rig.phase) * .5 + .5) * rig.energy;
      output.hair = Math.sin(clock * 1.18 + rig.phase) * rig.energy * 1.7 + pose[2] * 50;
      const cycle = (clock + rig.phase) % 6.7;
      output.blink = cycle < .24 ? Math.sin(cycle / .24 * Math.PI) ** 2 : 0;
      return output;
    },
  };
}

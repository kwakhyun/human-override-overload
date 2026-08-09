import assert from "node:assert/strict";
import test from "node:test";
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  chooseMutation,
  clearPressedInput,
  createAdversarialInput,
  createAdversarialState,
  drainAdversarialEvents,
  getAdversarialHud,
  setAim,
  stepAdversarial,
} from "../src/adversarial/engine.js";

function stepFor(state, input, seconds) {
  const frames = Math.ceil(seconds * 60);
  for (let frame = 0; frame < frames; frame += 1) {
    stepAdversarial(state, input, 1 / 60);
    if (state.status !== "running" || state.mutationPending) break;
  }
}

function teachLeftThenBreak(state) {
  const input = createAdversarialInput();
  input.up = true;
  stepFor(state, input, 1.47);
  assert.equal(state.prediction?.action, "LEFT");
  assert.ok(state.prediction.confidence >= 0.7);
  input.up = false;
  input.down = true;
  stepFor(state, input, 1);
  return input;
}

test("the renewed run contains one controllable hero and only The Wrong Engine", () => {
  const state = createAdversarialState({ random: () => 0.5 });
  assert.equal(GAME_WIDTH, 1280);
  assert.equal(GAME_HEIGHT, 720);
  assert.equal(state.mode, "adversarial");
  assert.equal(state.player.name, "THE TRAINER");
  assert.equal(state.boss.name, "THE WRONG ENGINE");
  assert.equal(state.duration, 150);
  assert.equal("zones" in state, false);
  assert.equal("heroes" in state, false);
  assert.equal("gold" in state, false);
  assert.equal("enemies" in state, false);
});

test("WASD movement, pointer aiming, dash, and manual fire drive the single hero", () => {
  const state = createAdversarialState({ random: () => 0.5 });
  state.patternCooldown = 999;
  const input = createAdversarialInput();
  const startX = state.player.x;
  input.right = true;
  input.dashPressed = true;
  input.pointerDown = true;
  const aimX = state.boss.x;
  const aimY = state.boss.y;
  assert.equal(setAim(state, aimX, aimY), true);
  stepAdversarial(state, input, 1 / 30);
  clearPressedInput(input);
  stepFor(state, input, 0.25);
  assert.ok(state.player.x > startX + 60);
  assert.ok(state.player.dashCooldown > 0);
  assert.ok(state.bullets.length > 0);
  assert.equal(input.dashPressed, false);
  assert.equal(state.aimX, aimX);
  assert.equal(state.aimY, aimY);
});

test("the browser-local predictor receives real online labels at 10 Hz", () => {
  const state = createAdversarialState({ random: () => 0.5 });
  state.patternCooldown = 999;
  const input = createAdversarialInput();
  input.up = true;
  stepFor(state, input, 1);
  const hud = getAdversarialHud(state);
  assert.ok(hud.model.samples >= 9 && hud.model.samples <= 10, `${hud.model.samples} samples`);
  assert.equal(hud.model.architecture, "14→16→6");
  assert.equal(hud.model.parameterCount, 342);
  assert.ok(hud.model.loss < Math.log(6));
});

test("standing still does not fabricate a directional training label", () => {
  const state = createAdversarialState({ random: () => 0.5 });
  state.patternCooldown = 999;
  stepFor(state, createAdversarialInput(), 1.2);
  const hud = getAdversarialHud(state);
  assert.equal(hud.model.samples, 0);
  assert.equal(hud.model.confidence, 1 / 6);
});

test("the boss commits a visible 0.8-second attack to its predicted ghost", () => {
  const state = createAdversarialState({ random: () => 0.5 });
  state.graceDuration = 0;
  const input = createAdversarialInput();
  input.up = true;
  stepFor(state, input, 1.5);
  assert.ok(state.prediction);
  assert.equal(state.prediction.action, "LEFT");
  assert.equal(state.prediction.locked, true);
  assert.equal(state.telegraphs.length, 1);
  assert.equal(state.telegraphs[0].maxLife, 0.8);
  assert.equal(state.prediction.targetX, state.prediction.ghostX);
  assert.equal(state.prediction.targetY, state.prediction.ghostY);
  assert.equal(state.prediction.probabilities.length, 6);
  stepFor(state, input, 0.8);
  const events = drainAdversarialEvents(state);
  assert.ok(events.some((event) => event.type === "patternCommit"));
  assert.ok(events.some((event) => event.type === "patternStrike"));
  assert.ok(state.beams.length > 0 || state.particles.length > 0);
  assert.ok(state.player.hp < state.player.maxHp);
});

test("repetition followed by a reversal breaks a confident model and exposes x8 weakness", () => {
  const state = createAdversarialState({ random: () => 0.5 });
  const initialHp = state.boss.hp;
  teachLeftThenBreak(state);
  assert.ok(state.time < 20, `first model break arrived at ${state.time.toFixed(2)}s`);
  assert.equal(state.breaks, 1);
  assert.equal(state.boss.hp, initialHp - state.boss.maxHp * 0.18);
  assert.equal(state.boss.weakness, 2.5);
  assert.ok(state.hitStop > 0);
  assert.equal(state.mutationPending?.breakNumber, 1);
  assert.equal(state.mutationPending?.options.length, 3);
  const events = drainAdversarialEvents(state);
  const modelBreak = events.find((event) => event.type === "modelBreak");
  assert.ok(modelBreak);
  assert.equal(modelBreak.predicted, "LEFT");
  assert.equal(modelBreak.actual, "RIGHT");
  assert.ok(events.some((event) => event.type === "weakness" && event.multiplier === 8));
});

test("run statistics record shots, hits, model certainty, and break damage", () => {
  const state = createAdversarialState({ random: () => 0.5 });
  const input = createAdversarialInput();
  setAim(state, state.boss.x, state.boss.y);
  input.pointerDown = true;
  stepFor(state, input, 0.9);
  assert.ok(state.stats.shots > 0);
  assert.ok(state.stats.hits > 0);
  const breakState = createAdversarialState({ random: () => 0.5 });
  teachLeftThenBreak(breakState);
  assert.ok(breakState.stats.bestConfidence >= 0.7);
  assert.equal(breakState.stats.modelBreakDamage, breakState.boss.maxHp * 0.18);
  assert.deepEqual(getAdversarialHud(breakState).stats, breakState.stats);
});

test("label flip poisons exactly the next 10 Hz training label", () => {
  const state = createAdversarialState({ random: () => 0.5 });
  const input = teachLeftThenBreak(state);
  assert.equal(chooseMutation(state, "labelFlip"), true);
  assert.equal(state.mutations.labelFlipCharges, 1);
  stepFor(state, input, 0.4);
  assert.equal(state.mutations.labelFlipCharges, 0);
  const event = drainAdversarialEvents(state).find((candidate) => candidate.type === "mutationTriggered");
  assert.ok(event);
  assert.equal(event.from, "RIGHT");
  assert.equal(event.to, "LEFT");
});

test("gradient freeze stops training for five seconds without stopping observation", () => {
  const state = createAdversarialState({ random: () => 0.5 });
  teachLeftThenBreak(state);
  assert.equal(chooseMutation(state, "gradientFreeze"), true);
  const input = createAdversarialInput();
  input.left = true;
  const samples = state.learning.metrics.samples;
  stepFor(state, input, 1);
  assert.equal(state.learning.metrics.samples, samples);
  assert.equal(state.learning.frozen, true);
  assert.ok(state.learning.streak > 0);
  state.patternCooldown = 999;
  stepFor(state, input, 4.3);
  assert.ok(state.learning.metrics.samples > samples);
});

test("ghost branch forks the next forecast and primes enhanced break damage", () => {
  const state = createAdversarialState({ random: () => 0.5 });
  const input = teachLeftThenBreak(state);
  assert.equal(chooseMutation(state, "ghostBranch"), true);
  assert.equal(state.mutations.ghostBranchCharges, 1);
  const firstCommit = state.prediction.committedAt;
  for (let frame = 0; frame < 240; frame += 1) {
    stepAdversarial(state, input, 1 / 60);
    if (state.prediction && !state.prediction.resolved && state.prediction.committedAt > firstCommit) break;
  }
  assert.equal(state.prediction.branches.length, 2);
  assert.equal(state.ghost.branches.length, 2);
});

test("the default 150-second run ends deterministically", () => {
  const state = createAdversarialState({ random: () => 0.5 });
  const input = createAdversarialInput();
  state.patternCooldown = 999;
  state.time = 149.95;
  state.timeLeft = 0.05;
  stepAdversarial(state, input, 0.1);
  assert.equal(state.status, "timeout");
  assert.equal(state.time, 150);
  assert.equal(state.timeLeft, 0);
  assert.ok(drainAdversarialEvents(state).some((event) => event.type === "loss" && event.reason === "timeout"));
});

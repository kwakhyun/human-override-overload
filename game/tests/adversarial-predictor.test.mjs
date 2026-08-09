import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTIONS,
  INPUT_SIZE,
  PARAMETER_COUNT,
  createPredictor,
  getMetrics,
  predict,
  train,
} from "../src/adversarial/predictor.js";

function features(overrides = {}) {
  const value = new Float32Array(INPUT_SIZE);
  value[0] = 1;
  value[1] = overrides.positionX ?? 0.25;
  value[2] = overrides.positionY ?? -0.15;
  value[3] = overrides.velocityX ?? 0;
  value[4] = overrides.velocityY ?? 0;
  value[5] = overrides.bossRelativeX ?? -0.4;
  value[6] = overrides.bossRelativeY ?? 0.2;
  value[7] = overrides.distance ?? 0.55;
  value[8] = overrides.recentX ?? 0;
  value[9] = overrides.recentY ?? 0;
  value[10] = overrides.dashReady ?? 1;
  value[11] = overrides.hp ?? 0.8;
  value[12] = overrides.edgeX ?? 0;
  value[13] = overrides.edgeY ?? 0;
  return value;
}

function probabilityCopy(model, input) {
  return Array.from(predict(model, input).probabilities);
}

test("creates a deterministic Float32 14→16→6 classifier", () => {
  const first = createPredictor({ seed: 2026 });
  const second = createPredictor({ seed: 2026 });
  const different = createPredictor({ seed: 2027 });

  assert.deepEqual(ACTIONS, [
    "LEFT",
    "RIGHT",
    "APPROACH",
    "RETREAT",
    "DASH_LEFT",
    "DASH_RIGHT",
  ]);
  assert.equal(INPUT_SIZE, 14);
  assert.equal(PARAMETER_COUNT, 342);
  assert.equal(first.parameterCount, PARAMETER_COUNT);
  assert.equal(
    first.w1.length + first.b1.length + first.w2.length + first.b2.length,
    PARAMETER_COUNT,
  );
  assert.ok(first.w1 instanceof Float32Array);
  assert.ok(first.w2 instanceof Float32Array);
  assert.deepEqual(first.w1, second.w1);
  assert.notDeepEqual(first.w1, different.w1);
  assert.deepEqual(probabilityCopy(first, features()), probabilityCopy(second, features()));
});

test("predict returns normalized probabilities, argmax, and confidence", () => {
  const model = createPredictor({ seed: 11 });
  const result = predict(model, features());
  const total = result.probabilities.reduce((sum, value) => sum + value, 0);
  const maximum = Math.max(...result.probabilities);

  assert.ok(result.probabilities instanceof Float32Array);
  assert.equal(result.probabilities.length, ACTIONS.length);
  assert.ok(Math.abs(total - 1) < 1e-6, `probability total ${total}`);
  assert.equal(result.action, ACTIONS[result.actionIndex]);
  assert.equal(result.confidence, maximum);
  assert.ok(result.probabilities.every((value) => value >= 0 && value <= 1));
});

test("caller-owned output buffers avoid result allocation", () => {
  const model = createPredictor({ seed: 12 });
  const input = features();
  const probabilityBuffer = new Float32Array(ACTIONS.length);
  const first = predict(model, input, probabilityBuffer);
  const second = predict(model, input, probabilityBuffer);

  assert.strictEqual(first, second);
  assert.strictEqual(first.probabilities, probabilityBuffer);

  const output = {
    probabilities: new Float32Array(ACTIONS.length),
    actionIndex: -1,
    action: "",
    confidence: 0,
  };
  assert.strictEqual(predict(model, input, output), output);
  assert.equal(output.action, ACTIONS[output.actionIndex]);
});

test("repeated behavior reaches decisive confidence within 30 to 50 samples", () => {
  for (const seed of [1, 7, 42, 2026]) {
    const model = createPredictor({ seed });
    const input = features({ recentX: -0.8, velocityX: -0.4 });
    for (let sample = 0; sample < 40; sample += 1) {
      train(model, input, ACTIONS.indexOf("LEFT"));
    }
    const result = predict(model, input);
    assert.equal(result.action, "LEFT", `seed ${seed}`);
    assert.ok(result.confidence >= 0.7, `seed ${seed} confidence ${result.confidence}`);
  }
});

test("recent contradictory demonstrations reverse the prediction", () => {
  const model = createPredictor({ seed: 31415 });
  const input = features({ recentX: -1, velocityX: -0.5 });
  const left = ACTIONS.indexOf("LEFT");
  const right = ACTIONS.indexOf("RIGHT");

  for (let sample = 0; sample < 40; sample += 1) train(model, input, left);
  const learnedLeft = predict(model, input);
  assert.equal(learnedLeft.action, "LEFT");
  assert.ok(learnedLeft.confidence > 0.7);

  for (let sample = 0; sample < 40; sample += 1) train(model, input, right);
  const learnedRight = predict(model, input);
  assert.equal(learnedRight.action, "RIGHT");
  assert.ok(learnedRight.confidence > 0.7, `right confidence ${learnedRight.confidence}`);
});

test("the replay memory is a bounded 128-sample ring", () => {
  const model = createPredictor({ seed: 77 });
  const input = features();
  for (let sample = 0; sample < 300; sample += 1) {
    train(model, input, sample % ACTIONS.length);
  }
  const metrics = getMetrics(model);
  assert.equal(metrics.samples, 300);
  assert.equal(metrics.replayCapacity, 128);
  assert.equal(metrics.replayCount, 128);
  assert.equal(model.replayFeatures.length, 128 * INPUT_SIZE);
  assert.equal(model.replayActions.length, 128);
  assert.deepEqual(metrics.classCounts, [50, 50, 50, 50, 50, 50]);
});

test("momentum SGD with global clipping remains finite under extreme telemetry", () => {
  const model = createPredictor({ seed: 99, learningRate: 0.09, gradientClip: 0.6 });
  for (let sample = 0; sample < 2500; sample += 1) {
    const sign = sample % 2 ? 1 : -1;
    const input = features({
      positionX: sign * 1000,
      positionY: -sign * 1000,
      velocityX: sign * 1000,
      velocityY: -sign * 1000,
      bossRelativeX: -sign * 1000,
      bossRelativeY: sign * 1000,
      distance: 1000,
      edgeX: sign * 1000,
      edgeY: -sign * 1000,
    });
    train(model, input, sample % ACTIONS.length);
  }

  const result = predict(model, features());
  assert.ok(result.probabilities.every(Number.isFinite));
  assert.ok([...model.w1, ...model.b1, ...model.w2, ...model.b2].every(Number.isFinite));
  assert.ok([...model.vw1, ...model.vb1, ...model.vw2, ...model.vb2].every(Number.isFinite));
  assert.ok(Number.isFinite(getMetrics(model).loss));
});

test("invalid features, labels, and output buffers fail explicitly", () => {
  const model = createPredictor();
  assert.throws(() => predict(model, new Float32Array(INPUT_SIZE - 1)), /exactly 14/);
  const invalid = features();
  invalid[4] = Number.NaN;
  assert.throws(() => train(model, invalid, 0), /must be finite/);
  assert.throws(() => train(model, features(), ACTIONS.length), /actionIndex/);
  assert.throws(() => predict(model, features(), new Float32Array(5)), /Float32Array\(6\)/);
});

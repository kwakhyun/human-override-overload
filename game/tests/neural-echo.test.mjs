import test from "node:test";
import assert from "node:assert/strict";
import {
  NEURAL_ECHO_INPUTS,
  NEURAL_ECHO_OUTPUTS,
  NEURAL_ECHO_PARAMETER_COUNT,
  createNeuralEcho,
  deserializeNeuralEcho,
  getNeuralEchoConfidence,
  getNeuralEchoMetrics,
  neuralEchoStateBin,
  predictNeuralEcho,
  serializeNeuralEcho,
  trainNeuralEcho,
} from "../src/survivor/neuralEcho.js";

function featureVector(overrides = {}) {
  const features = new Float32Array(NEURAL_ECHO_INPUTS);
  features[0] = overrides.rangeError ?? 0.45;
  features[1] = overrides.tooClose ?? 0;
  features[2] = overrides.nearCrowd ?? 0.1;
  features[3] = overrides.midCrowd ?? 0.2;
  features[4] = overrides.hpDeficit ?? 0.1;
  features[5] = overrides.dashReady ?? 1;
  features[6] = overrides.sentryReady ?? 0;
  features[7] = overrides.empReady ?? 0;
  features[8] = overrides.projectileRisk ?? 0;
  features[9] = overrides.hazardRadial ?? 0;
  features[10] = overrides.hazardTangent ?? 0;
  features[11] = overrides.edgeRadial ?? 0;
  features[12] = overrides.edgeTangent ?? 0;
  features[13] = overrides.velocityRadial ?? 0;
  features[14] = overrides.velocityTangent ?? 0;
  features[15] = overrides.bossDanger ?? 0;
  features[16] = overrides.noTarget ?? 0;
  return features;
}

function outputCopy(model, features) {
  return Array.from(predictNeuralEcho(model, features, new Float32Array(NEURAL_ECHO_OUTPUTS)));
}

test("creates a deterministic 17-12-5 typed-array model", () => {
  const first = createNeuralEcho({ seed: 42 });
  const second = createNeuralEcho({ seed: 42 });
  const different = createNeuralEcho({ seed: 43 });
  assert.equal(first.parameterCount, 281);
  assert.equal(first.parameterCount, NEURAL_ECHO_PARAMETER_COUNT);
  assert.ok(first.w1 instanceof Float32Array);
  assert.deepEqual(first.w1, second.w1);
  assert.notDeepEqual(first.w1, different.w1);
  assert.deepEqual(outputCopy(first, featureVector()), outputCopy(second, featureVector()));
});

test("online behavior cloning lowers error and learns movement direction", () => {
  const model = createNeuralEcho({ seed: 7 });
  const features = featureVector({ rangeError: 0.7, nearCrowd: 0.15 });
  const target = new Float32Array([0.92, -0.58, 0, 0, 0]);
  const before = outputCopy(model, features);
  const beforeError = Math.hypot(before[0] - target[0], before[1] - target[1]);
  for (let sample = 0; sample < 140; sample += 1) trainNeuralEcho(model, features, target);
  const after = outputCopy(model, features);
  const afterError = Math.hypot(after[0] - target[0], after[1] - target[1]);
  assert.ok(after[0] > 0.78, `expected forward imitation, received ${after[0]}`);
  assert.ok(after[1] < -0.42, `expected left strafe imitation, received ${after[1]}`);
  assert.ok(afterError < beforeError * 0.3, `expected error reduction: ${beforeError} -> ${afterError}`);
  assert.ok(getNeuralEchoConfidence(model, neuralEchoStateBin(features)) > 0.55);
});

test("idle demonstrations are learned instead of discarded", () => {
  const model = createNeuralEcho({ seed: 19 });
  const features = featureVector({ rangeError: 0.15, nearCrowd: 0 });
  const move = new Float32Array([0.9, 0.5, 0, 0, 0]);
  for (let sample = 0; sample < 70; sample += 1) trainNeuralEcho(model, features, move);
  const movingMagnitude = Math.hypot(...outputCopy(model, features).slice(0, 2));
  const idle = new Float32Array([0, 0, 0, 0, 0]);
  for (let sample = 0; sample < 180; sample += 1) trainNeuralEcho(model, features, idle);
  const idleMagnitude = Math.hypot(...outputCopy(model, features).slice(0, 2));
  assert.ok(idleMagnitude < movingMagnitude * 0.45, `${movingMagnitude} -> ${idleMagnitude}`);
});

test("dash probability becomes conditioned on dangerous states", () => {
  const model = createNeuralEcho({ seed: 88 });
  const danger = featureVector({ rangeError: -0.3, nearCrowd: 0.95, projectileRisk: 0.9, dashReady: 1 });
  const safe = featureVector({ rangeError: 0.2, nearCrowd: 0, projectileRisk: 0, dashReady: 1 });
  const dash = new Float32Array([0, 1, 1, 0, 0]);
  const noDash = new Float32Array([0.2, 0, 0, 0, 0]);
  for (let sample = 0; sample < 120; sample += 1) {
    trainNeuralEcho(model, danger, dash);
    trainNeuralEcho(model, safe, noDash);
  }
  const dangerProbability = outputCopy(model, danger)[2];
  const safeProbability = outputCopy(model, safe)[2];
  assert.ok(dangerProbability > 0.75, `danger dash probability ${dangerProbability}`);
  assert.ok(dangerProbability > safeProbability + 0.35, `${dangerProbability} vs ${safeProbability}`);
});

test("output masks keep unavailable skill heads unchanged", () => {
  const model = createNeuralEcho({ seed: 91, replaySteps: 0 });
  const features = featureVector({ sentryReady: 0, empReady: 0 });
  const before = outputCopy(model, features);
  const target = new Float32Array([0.8, 0, 0, 1, 1]);
  const mask = new Float32Array([1, 1, 1, 0, 0]);
  for (let sample = 0; sample < 80; sample += 1) {
    trainNeuralEcho(model, features, target, { mask });
  }
  const after = outputCopy(model, features);
  assert.ok(Math.abs(after[3] - before[3]) < 0.08, `${before[3]} -> ${after[3]}`);
  assert.ok(Math.abs(after[4] - before[4]) < 0.08, `${before[4]} -> ${after[4]}`);
});

test("unseen state bins receive a confidence penalty", () => {
  const model = createNeuralEcho({ seed: 123 });
  const learned = featureVector({ rangeError: 0.6, projectileRisk: 0 });
  const target = new Float32Array([0.8, 0.2, 0, 0, 0]);
  const learnedBin = neuralEchoStateBin(learned);
  for (let sample = 0; sample < 90; sample += 1) trainNeuralEcho(model, learned, target);
  const unseenBin = learnedBin === 0 ? 5 : 0;
  const knownConfidence = getNeuralEchoConfidence(model, learnedBin);
  const unseenConfidence = getNeuralEchoConfidence(model, unseenBin);
  assert.ok(knownConfidence > unseenConfidence * 4.5, `${knownConfidence} vs ${unseenConfidence}`);
  const metrics = getNeuralEchoMetrics(model, learnedBin);
  assert.equal(metrics.architecture, "17-12-5");
  assert.equal(metrics.samples, 90);
  assert.ok(metrics.coverage > 0);
});

test("models learn independently from opposite teachers", () => {
  const aggressive = createNeuralEcho({ seed: 5 });
  const evasive = createNeuralEcho({ seed: 5 });
  const features = featureVector({ rangeError: 0.35, nearCrowd: 0.4 });
  for (let sample = 0; sample < 100; sample += 1) {
    trainNeuralEcho(aggressive, features, new Float32Array([1, 0.2, 0, 0, 0]));
    trainNeuralEcho(evasive, features, new Float32Array([-0.9, -0.8, 0, 0, 0]));
  }
  const aggressiveOutput = outputCopy(aggressive, features);
  const evasiveOutput = outputCopy(evasive, features);
  assert.ok(aggressiveOutput[0] > 0.75);
  assert.ok(evasiveOutput[0] < -0.65);
  assert.ok(aggressiveOutput[1] > evasiveOutput[1] + 0.5);
});

test("serialization preserves predictions, metrics, replay, and deterministic continuation", () => {
  const model = createNeuralEcho({ seed: 2026 });
  const first = featureVector({ rangeError: 0.65, nearCrowd: 0.2 });
  const second = featureVector({ rangeError: -0.35, nearCrowd: 0.8, projectileRisk: 0.7 });
  for (let sample = 0; sample < 75; sample += 1) {
    const features = sample % 2 ? first : second;
    const target = sample % 2
      ? new Float32Array([0.8, 0.35, 0, 0, 0])
      : new Float32Array([-0.7, -0.8, 1, 0, 0]);
    trainNeuralEcho(model, features, target);
  }
  const json = JSON.stringify(serializeNeuralEcho(model));
  const restored = deserializeNeuralEcho(JSON.parse(json));
  assert.deepEqual(outputCopy(restored, first), outputCopy(model, first));
  assert.deepEqual(getNeuralEchoMetrics(restored), getNeuralEchoMetrics(model));
  assert.equal(restored.replayCount, model.replayCount);

  const continuationTarget = new Float32Array([0.1, 0.95, 0, 1, 0]);
  trainNeuralEcho(model, first, continuationTarget);
  trainNeuralEcho(restored, first, continuationTarget);
  assert.deepEqual(outputCopy(restored, second), outputCopy(model, second));
});

test("long adversarial training remains finite and bounded", () => {
  const model = createNeuralEcho({ seed: 404 });
  for (let sample = 0; sample < 3000; sample += 1) {
    const sign = sample % 2 ? 1 : -1;
    const features = featureVector({
      rangeError: sign,
      nearCrowd: sample % 3 ? 1 : 0,
      projectileRisk: sample % 5 ? 0 : 1,
      hazardTangent: sign,
      edgeRadial: -sign,
    });
    trainNeuralEcho(model, features, new Float32Array([sign, -sign, sample % 7 === 0 ? 1 : 0, 0, 0]));
  }
  const output = outputCopy(model, featureVector());
  assert.ok(output.every(Number.isFinite));
  assert.ok(output[0] >= -1 && output[0] <= 1);
  assert.ok(output[1] >= -1 && output[1] <= 1);
  assert.ok(output.slice(2).every((value) => value >= 0 && value <= 1));
  assert.ok([...model.w1, ...model.w2].every(Number.isFinite));
});

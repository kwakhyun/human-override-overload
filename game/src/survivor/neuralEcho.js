export const NEURAL_ECHO_VERSION = 1;
export const NEURAL_ECHO_INPUTS = 17;
export const NEURAL_ECHO_HIDDEN = 12;
export const NEURAL_ECHO_OUTPUTS = 5;
export const NEURAL_ECHO_STATE_BINS = 6;
export const NEURAL_ECHO_PARAMETER_COUNT =
  NEURAL_ECHO_INPUTS * NEURAL_ECHO_HIDDEN
  + NEURAL_ECHO_HIDDEN
  + NEURAL_ECHO_HIDDEN * NEURAL_ECHO_OUTPUTS
  + NEURAL_ECHO_OUTPUTS;

const DEFAULT_REPLAY_CAPACITY = 96;
const DEFAULT_REPLAY_STEPS = 2;
const DEFAULT_OUTPUT_MASK = new Float32Array(NEURAL_ECHO_OUTPUTS).fill(1);
const MOVE_OUTPUTS = 2;
const DISCRETE_POSITIVE_WEIGHTS = [0, 0, 5, 8, 8];
const DISCRETE_NEGATIVE_WEIGHTS = [0, 0, 0.15, 0.05, 0.05];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sigmoid(value) {
  if (value >= 0) {
    const exp = Math.exp(-value);
    return 1 / (1 + exp);
  }
  const exp = Math.exp(value);
  return exp / (1 + exp);
}

function makeRandom(seed) {
  let state = (Number(seed) >>> 0) || 0x9e3779b9;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

function fillXavier(target, fanIn, fanOut, random) {
  const limit = Math.sqrt(6 / (fanIn + fanOut));
  for (let index = 0; index < target.length; index += 1) {
    target[index] = (random() * 2 - 1) * limit;
  }
}

function assertVector(name, value, length) {
  if (!value || value.length !== length) {
    throw new TypeError(`${name} must contain exactly ${length} values`);
  }
}

function assertFiniteVector(name, value, length) {
  assertVector(name, value, length);
  for (let index = 0; index < length; index += 1) {
    if (!Number.isFinite(value[index])) throw new TypeError(`${name}[${index}] must be finite`);
  }
}

function copyInto(target, source, name) {
  assertFiniteVector(name, source, target.length);
  target.set(source);
}

function popcount(value) {
  let bits = value >>> 0;
  let count = 0;
  while (bits) {
    bits &= bits - 1;
    count += 1;
  }
  return count;
}

function outputLoss(output, target, mask) {
  const moving = Math.abs(target[0]) + Math.abs(target[1]) > 0.12;
  const movementWeight = moving ? 1 : 0.28;
  let loss = 0;
  let weight = 0;
  for (let index = 0; index < MOVE_OUTPUTS; index += 1) {
    if (!mask[index]) continue;
    const error = output[index] - clamp(target[index], -1, 1);
    loss += 0.5 * movementWeight * error * error;
    weight += movementWeight;
  }
  for (let index = MOVE_OUTPUTS; index < NEURAL_ECHO_OUTPUTS; index += 1) {
    if (!mask[index]) continue;
    const label = target[index] >= 0.5 ? 1 : 0;
    const classWeight = label ? DISCRETE_POSITIVE_WEIGHTS[index] : DISCRETE_NEGATIVE_WEIGHTS[index];
    const probability = clamp(output[index], 1e-6, 1 - 1e-6);
    loss -= classWeight * (label * Math.log(probability) + (1 - label) * Math.log(1 - probability));
    weight += classWeight;
  }
  return weight > 0 ? loss / weight : 0;
}

function applyMomentum(parameter, velocity, index, gradient, model) {
  const clipped = clamp(gradient + model.l2 * parameter[index], -model.gradientClip, model.gradientClip);
  velocity[index] = model.momentum * velocity[index] - model.learningRate * clipped;
  parameter[index] += velocity[index];
}

function trainStoredSample(model, features, target, mask, sampleWeight = 1) {
  const output = predictNeuralEcho(model, features, model.outputScratch);
  const hidden = model.hiddenScratch;
  const moving = Math.abs(target[0]) + Math.abs(target[1]) > 0.12;
  const movementWeight = moving ? 1 : 0.28;

  for (let index = 0; index < NEURAL_ECHO_OUTPUTS; index += 1) {
    if (!mask[index]) {
      model.outputGradient[index] = 0;
      continue;
    }
    if (index < MOVE_OUTPUTS) {
      const label = clamp(target[index], -1, 1);
      const prediction = output[index];
      model.outputGradient[index] = sampleWeight * movementWeight
        * (prediction - label) * (1 - prediction * prediction);
    } else {
      const label = target[index] >= 0.5 ? 1 : 0;
      const classWeight = label ? DISCRETE_POSITIVE_WEIGHTS[index] : DISCRETE_NEGATIVE_WEIGHTS[index];
      model.outputGradient[index] = sampleWeight * classWeight * (output[index] - label);
    }
  }

  for (let hiddenIndex = 0; hiddenIndex < NEURAL_ECHO_HIDDEN; hiddenIndex += 1) {
    let gradient = 0;
    for (let outputIndex = 0; outputIndex < NEURAL_ECHO_OUTPUTS; outputIndex += 1) {
      gradient += model.w2[outputIndex * NEURAL_ECHO_HIDDEN + hiddenIndex]
        * model.outputGradient[outputIndex];
    }
    model.hiddenGradient[hiddenIndex] = gradient * (1 - hidden[hiddenIndex] * hidden[hiddenIndex]);
  }

  for (let outputIndex = 0; outputIndex < NEURAL_ECHO_OUTPUTS; outputIndex += 1) {
    const outputGradient = model.outputGradient[outputIndex];
    for (let hiddenIndex = 0; hiddenIndex < NEURAL_ECHO_HIDDEN; hiddenIndex += 1) {
      const index = outputIndex * NEURAL_ECHO_HIDDEN + hiddenIndex;
      applyMomentum(model.w2, model.vw2, index, outputGradient * hidden[hiddenIndex], model);
    }
    applyMomentum(model.b2, model.vb2, outputIndex, outputGradient, model);
  }

  for (let hiddenIndex = 0; hiddenIndex < NEURAL_ECHO_HIDDEN; hiddenIndex += 1) {
    const hiddenGradient = model.hiddenGradient[hiddenIndex];
    for (let inputIndex = 0; inputIndex < NEURAL_ECHO_INPUTS; inputIndex += 1) {
      const index = hiddenIndex * NEURAL_ECHO_INPUTS + inputIndex;
      applyMomentum(model.w1, model.vw1, index, hiddenGradient * features[inputIndex], model);
    }
    applyMomentum(model.b1, model.vb1, hiddenIndex, hiddenGradient, model);
  }

  return outputLoss(output, target, mask);
}

function replaySample(model, slot) {
  const featureOffset = slot * NEURAL_ECHO_INPUTS;
  const targetOffset = slot * NEURAL_ECHO_OUTPUTS;
  for (let index = 0; index < NEURAL_ECHO_INPUTS; index += 1) {
    model.featureScratch[index] = model.replayFeatures[featureOffset + index];
  }
  for (let index = 0; index < NEURAL_ECHO_OUTPUTS; index += 1) {
    model.targetScratch[index] = model.replayTargets[targetOffset + index];
    model.maskScratch[index] = model.replayMasks[targetOffset + index];
  }
  trainStoredSample(model, model.featureScratch, model.targetScratch, model.maskScratch, 0.65);
}

function storeReplay(model, features, target, mask, stateBin) {
  const slot = model.replayHead;
  const featureOffset = slot * NEURAL_ECHO_INPUTS;
  const targetOffset = slot * NEURAL_ECHO_OUTPUTS;
  for (let index = 0; index < NEURAL_ECHO_INPUTS; index += 1) {
    model.replayFeatures[featureOffset + index] = features[index];
  }
  for (let index = 0; index < NEURAL_ECHO_OUTPUTS; index += 1) {
    model.replayTargets[targetOffset + index] = target[index];
    model.replayMasks[targetOffset + index] = mask[index] ? 1 : 0;
  }
  model.replayBins[slot] = stateBin;
  model.replayHead = (slot + 1) % model.replayCapacity;
  model.replayCount = Math.min(model.replayCapacity, model.replayCount + 1);
}

function restoreArray(serialized, key, length, Type = Float32Array) {
  const value = serialized[key];
  assertFiniteVector(key, value, length);
  return Type.from(value);
}

export function createNeuralEcho(options = {}) {
  const seed = Number(options.seed ?? 0x544d57) >>> 0;
  const replayCapacity = Math.max(8, Math.floor(options.replayCapacity ?? DEFAULT_REPLAY_CAPACITY));
  const random = makeRandom(seed);
  const model = {
    version: NEURAL_ECHO_VERSION,
    seed,
    inputSize: NEURAL_ECHO_INPUTS,
    hiddenSize: NEURAL_ECHO_HIDDEN,
    outputSize: NEURAL_ECHO_OUTPUTS,
    parameterCount: NEURAL_ECHO_PARAMETER_COUNT,
    learningRate: Number(options.learningRate ?? 0.02),
    momentum: Number(options.momentum ?? 0.85),
    l2: Number(options.l2 ?? 1e-5),
    gradientClip: Number(options.gradientClip ?? 1),
    replayCapacity,
    replaySteps: Math.max(0, Math.floor(options.replaySteps ?? DEFAULT_REPLAY_STEPS)),
    w1: new Float32Array(NEURAL_ECHO_INPUTS * NEURAL_ECHO_HIDDEN),
    b1: new Float32Array(NEURAL_ECHO_HIDDEN),
    w2: new Float32Array(NEURAL_ECHO_HIDDEN * NEURAL_ECHO_OUTPUTS),
    b2: new Float32Array(NEURAL_ECHO_OUTPUTS),
    vw1: new Float32Array(NEURAL_ECHO_INPUTS * NEURAL_ECHO_HIDDEN),
    vb1: new Float32Array(NEURAL_ECHO_HIDDEN),
    vw2: new Float32Array(NEURAL_ECHO_HIDDEN * NEURAL_ECHO_OUTPUTS),
    vb2: new Float32Array(NEURAL_ECHO_OUTPUTS),
    replayFeatures: new Float32Array(replayCapacity * NEURAL_ECHO_INPUTS),
    replayTargets: new Float32Array(replayCapacity * NEURAL_ECHO_OUTPUTS),
    replayMasks: new Uint8Array(replayCapacity * NEURAL_ECHO_OUTPUTS),
    replayBins: new Uint8Array(replayCapacity),
    replayHead: 0,
    replayCount: 0,
    replayCursor: 0,
    samples: 0,
    effectiveSamples: 0,
    trainSteps: 0,
    lossEma: 1,
    coverageMask: 0,
    lastStateBin: 0,
    hiddenScratch: new Float32Array(NEURAL_ECHO_HIDDEN),
    outputScratch: new Float32Array(NEURAL_ECHO_OUTPUTS),
    outputGradient: new Float32Array(NEURAL_ECHO_OUTPUTS),
    hiddenGradient: new Float32Array(NEURAL_ECHO_HIDDEN),
    featureScratch: new Float32Array(NEURAL_ECHO_INPUTS),
    targetScratch: new Float32Array(NEURAL_ECHO_OUTPUTS),
    maskScratch: new Float32Array(NEURAL_ECHO_OUTPUTS),
  };
  fillXavier(model.w1, NEURAL_ECHO_INPUTS, NEURAL_ECHO_HIDDEN, random);
  fillXavier(model.w2, NEURAL_ECHO_HIDDEN, NEURAL_ECHO_OUTPUTS, random);
  model.b2[2] = -3.5;
  model.b2[3] = -4;
  model.b2[4] = -4;
  return model;
}

export function neuralEchoStateBin(features) {
  assertFiniteVector("features", features, NEURAL_ECHO_INPUTS);
  const rangeError = features[0];
  const distanceBucket = rangeError < -0.15 ? 0 : rangeError > 0.3 ? 2 : 1;
  const danger = Math.max(features[2], features[8], features[15]) > 0.35 ? 1 : 0;
  return distanceBucket * 2 + danger;
}

export function predictNeuralEcho(model, features, output = model.outputScratch) {
  assertFiniteVector("features", features, NEURAL_ECHO_INPUTS);
  assertVector("output", output, NEURAL_ECHO_OUTPUTS);
  const hidden = model.hiddenScratch;
  for (let hiddenIndex = 0; hiddenIndex < NEURAL_ECHO_HIDDEN; hiddenIndex += 1) {
    let sum = model.b1[hiddenIndex];
    const offset = hiddenIndex * NEURAL_ECHO_INPUTS;
    for (let inputIndex = 0; inputIndex < NEURAL_ECHO_INPUTS; inputIndex += 1) {
      sum += model.w1[offset + inputIndex] * features[inputIndex];
    }
    hidden[hiddenIndex] = Math.tanh(sum);
  }
  for (let outputIndex = 0; outputIndex < NEURAL_ECHO_OUTPUTS; outputIndex += 1) {
    let sum = model.b2[outputIndex];
    const offset = outputIndex * NEURAL_ECHO_HIDDEN;
    for (let hiddenIndex = 0; hiddenIndex < NEURAL_ECHO_HIDDEN; hiddenIndex += 1) {
      sum += model.w2[offset + hiddenIndex] * hidden[hiddenIndex];
    }
    output[outputIndex] = outputIndex < MOVE_OUTPUTS ? Math.tanh(sum) : sigmoid(sum);
  }
  return output;
}

export function trainNeuralEcho(model, features, target, options = {}) {
  assertFiniteVector("features", features, NEURAL_ECHO_INPUTS);
  assertFiniteVector("target", target, NEURAL_ECHO_OUTPUTS);
  const mask = options.mask || DEFAULT_OUTPUT_MASK;
  assertVector("mask", mask, NEURAL_ECHO_OUTPUTS);
  const sampleWeight = clamp(Number(options.sampleWeight ?? 1), 0, 8);
  const stateBin = Number.isInteger(options.stateBin)
    ? clamp(options.stateBin, 0, NEURAL_ECHO_STATE_BINS - 1)
    : neuralEchoStateBin(features);

  const preUpdateOutput = predictNeuralEcho(model, features, model.outputScratch);
  const liveLoss = outputLoss(preUpdateOutput, target, mask);
  trainStoredSample(model, features, target, mask, sampleWeight);
  storeReplay(model, features, target, mask, stateBin);

  model.samples += 1;
  model.effectiveSamples += sampleWeight;
  model.trainSteps += 1;
  model.lastStateBin = stateBin;
  model.coverageMask |= 1 << stateBin;
  const lossAlpha = model.samples < 12 ? 0.16 : 0.045;
  model.lossEma += (liveLoss - model.lossEma) * lossAlpha;

  const replaySteps = Math.min(
    model.replayCount,
    Math.max(0, Math.floor(options.replaySteps ?? model.replaySteps)),
  );
  for (let step = 0; step < replaySteps; step += 1) {
    model.replayCursor = (model.replayCursor + 17 + step * 6) % model.replayCount;
    replaySample(model, model.replayCursor);
  }

  return {
    loss: liveLoss,
    lossEma: model.lossEma,
    confidence: getNeuralEchoConfidence(model, stateBin),
    stateBin,
    samples: model.samples,
  };
}

export function getNeuralEchoConfidence(model, stateBin = model.lastStateBin) {
  const sampleFactor = 1 - Math.exp(-model.effectiveSamples / 35);
  const covered = popcount(model.coverageMask & ((1 << NEURAL_ECHO_STATE_BINS) - 1));
  const coverageFactor = 0.55 + 0.45 * covered / NEURAL_ECHO_STATE_BINS;
  const quality = clamp(1 - model.lossEma / 0.65, 0, 1);
  let confidence = sampleFactor * coverageFactor * (0.35 + 0.65 * quality);
  if (Number.isInteger(stateBin) && stateBin >= 0 && stateBin < NEURAL_ECHO_STATE_BINS) {
    if ((model.coverageMask & (1 << stateBin)) === 0) confidence *= 0.2;
  }
  return clamp(confidence, 0, 1);
}

export function getNeuralEchoMetrics(model, stateBin = model.lastStateBin) {
  return {
    version: model.version,
    architecture: `${NEURAL_ECHO_INPUTS}-${NEURAL_ECHO_HIDDEN}-${NEURAL_ECHO_OUTPUTS}`,
    parameters: NEURAL_ECHO_PARAMETER_COUNT,
    samples: model.samples,
    effectiveSamples: model.effectiveSamples,
    replaySamples: model.replayCount,
    loss: model.lossEma,
    confidence: getNeuralEchoConfidence(model, stateBin),
    coverage: popcount(model.coverageMask & ((1 << NEURAL_ECHO_STATE_BINS) - 1)) / NEURAL_ECHO_STATE_BINS,
    coverageMask: model.coverageMask,
    stateBin,
  };
}

export function serializeNeuralEcho(model, options = {}) {
  const includeReplay = options.includeReplay !== false;
  const serialized = {
    version: NEURAL_ECHO_VERSION,
    seed: model.seed,
    config: {
      learningRate: model.learningRate,
      momentum: model.momentum,
      l2: model.l2,
      gradientClip: model.gradientClip,
      replayCapacity: model.replayCapacity,
      replaySteps: model.replaySteps,
    },
    stats: {
      replayHead: includeReplay ? model.replayHead : 0,
      replayCount: includeReplay ? model.replayCount : 0,
      replayCursor: includeReplay ? model.replayCursor : 0,
      samples: model.samples,
      effectiveSamples: model.effectiveSamples,
      trainSteps: model.trainSteps,
      lossEma: model.lossEma,
      coverageMask: model.coverageMask,
      lastStateBin: model.lastStateBin,
    },
    weights: {
      w1: Array.from(model.w1),
      b1: Array.from(model.b1),
      w2: Array.from(model.w2),
      b2: Array.from(model.b2),
      vw1: Array.from(model.vw1),
      vb1: Array.from(model.vb1),
      vw2: Array.from(model.vw2),
      vb2: Array.from(model.vb2),
    },
  };
  if (includeReplay) {
    serialized.replay = {
      features: Array.from(model.replayFeatures),
      targets: Array.from(model.replayTargets),
      masks: Array.from(model.replayMasks),
      bins: Array.from(model.replayBins),
    };
  }
  return serialized;
}

export function deserializeNeuralEcho(serialized) {
  if (!serialized || serialized.version !== NEURAL_ECHO_VERSION) {
    throw new TypeError(`Unsupported Neural Echo model version: ${serialized?.version}`);
  }
  const config = serialized.config || {};
  const model = createNeuralEcho({
    seed: serialized.seed,
    learningRate: config.learningRate,
    momentum: config.momentum,
    l2: config.l2,
    gradientClip: config.gradientClip,
    replayCapacity: config.replayCapacity,
    replaySteps: config.replaySteps,
  });
  const weights = serialized.weights || {};
  copyInto(model.w1, weights.w1, "weights.w1");
  copyInto(model.b1, weights.b1, "weights.b1");
  copyInto(model.w2, weights.w2, "weights.w2");
  copyInto(model.b2, weights.b2, "weights.b2");
  copyInto(model.vw1, weights.vw1, "weights.vw1");
  copyInto(model.vb1, weights.vb1, "weights.vb1");
  copyInto(model.vw2, weights.vw2, "weights.vw2");
  copyInto(model.vb2, weights.vb2, "weights.vb2");

  const stats = serialized.stats || {};
  model.samples = Math.max(0, Number(stats.samples) || 0);
  model.effectiveSamples = Math.max(0, Number(stats.effectiveSamples) || 0);
  model.trainSteps = Math.max(0, Number(stats.trainSteps) || 0);
  model.lossEma = clamp(Number(stats.lossEma) || 0, 0, Number.MAX_VALUE);
  model.coverageMask = Number(stats.coverageMask) >>> 0;
  model.lastStateBin = clamp(Number(stats.lastStateBin) || 0, 0, NEURAL_ECHO_STATE_BINS - 1);

  if (serialized.replay) {
    const replay = serialized.replay;
    model.replayFeatures = restoreArray(
      replay,
      "features",
      model.replayCapacity * NEURAL_ECHO_INPUTS,
    );
    model.replayTargets = restoreArray(
      replay,
      "targets",
      model.replayCapacity * NEURAL_ECHO_OUTPUTS,
    );
    model.replayMasks = restoreArray(
      replay,
      "masks",
      model.replayCapacity * NEURAL_ECHO_OUTPUTS,
      Uint8Array,
    );
    model.replayBins = restoreArray(replay, "bins", model.replayCapacity, Uint8Array);
    model.replayCount = clamp(Number(stats.replayCount) || 0, 0, model.replayCapacity);
    model.replayHead = clamp(Number(stats.replayHead) || 0, 0, model.replayCapacity - 1);
    model.replayCursor = model.replayCount
      ? clamp(Number(stats.replayCursor) || 0, 0, model.replayCount - 1)
      : 0;
  }
  return model;
}

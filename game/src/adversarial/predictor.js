export const ACTIONS = Object.freeze([
  "LEFT",
  "RIGHT",
  "APPROACH",
  "RETREAT",
  "DASH_LEFT",
  "DASH_RIGHT",
]);

export const INPUT_SIZE = 14;
export const PARAMETER_COUNT = 342;

const HIDDEN_SIZE = 16;
const OUTPUT_SIZE = ACTIONS.length;
const DEFAULT_REPLAY_CAPACITY = 128;
const DEFAULT_REPLAY_STEPS = 2;
const DEFAULT_RECENT_REPLAY_WINDOW = 48;
const LOG_OUTPUTS = false;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function makeRandom(seed) {
  let state = (Number(seed) >>> 0) || 0x6d2b79f5;
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

function assertFeatures(features) {
  if (!features || features.length !== INPUT_SIZE) {
    throw new TypeError(`features must contain exactly ${INPUT_SIZE} values`);
  }
  for (let index = 0; index < INPUT_SIZE; index += 1) {
    if (!Number.isFinite(features[index])) {
      throw new TypeError(`features[${index}] must be finite`);
    }
  }
}

function assertActionIndex(actionIndex) {
  if (!Number.isInteger(actionIndex) || actionIndex < 0 || actionIndex >= OUTPUT_SIZE) {
    throw new RangeError(`actionIndex must be an integer from 0 to ${OUTPUT_SIZE - 1}`);
  }
}

function assertProbabilityBuffer(buffer) {
  if (!(buffer instanceof Float32Array) || buffer.length !== OUTPUT_SIZE) {
    throw new TypeError(`output probabilities must be a Float32Array(${OUTPUT_SIZE})`);
  }
}

function featureAt(features, index) {
  // Inputs normally live in [-1, 1]. The wider guard keeps malformed gameplay
  // telemetry from exploding gradients without flattening legitimate signals.
  return clamp(features[index], -4, 4);
}

function forward(model, features, probabilities) {
  const hidden = model.hiddenScratch;
  const logits = model.logitScratch;

  for (let hiddenIndex = 0; hiddenIndex < HIDDEN_SIZE; hiddenIndex += 1) {
    const offset = hiddenIndex * INPUT_SIZE;
    let sum = model.b1[hiddenIndex];
    for (let inputIndex = 0; inputIndex < INPUT_SIZE; inputIndex += 1) {
      sum += model.w1[offset + inputIndex] * featureAt(features, inputIndex);
    }
    hidden[hiddenIndex] = Math.tanh(sum);
  }

  let maxLogit = -Infinity;
  for (let outputIndex = 0; outputIndex < OUTPUT_SIZE; outputIndex += 1) {
    const offset = outputIndex * HIDDEN_SIZE;
    let sum = model.b2[outputIndex];
    for (let hiddenIndex = 0; hiddenIndex < HIDDEN_SIZE; hiddenIndex += 1) {
      sum += model.w2[offset + hiddenIndex] * hidden[hiddenIndex];
    }
    logits[outputIndex] = sum;
    maxLogit = Math.max(maxLogit, sum);
  }

  let normalizer = 0;
  for (let outputIndex = 0; outputIndex < OUTPUT_SIZE; outputIndex += 1) {
    const value = Math.exp(logits[outputIndex] - maxLogit);
    probabilities[outputIndex] = value;
    normalizer += value;
  }
  const inverseNormalizer = 1 / normalizer;
  for (let outputIndex = 0; outputIndex < OUTPUT_SIZE; outputIndex += 1) {
    probabilities[outputIndex] *= inverseNormalizer;
  }

  return probabilities;
}

function classify(probabilities) {
  let actionIndex = 0;
  let confidence = probabilities[0];
  for (let index = 1; index < OUTPUT_SIZE; index += 1) {
    if (probabilities[index] > confidence) {
      actionIndex = index;
      confidence = probabilities[index];
    }
  }
  return actionIndex;
}

function updateParameter(parameter, velocity, index, gradient, model) {
  const regularized = gradient + model.l2 * parameter[index];
  velocity[index] = model.momentum * velocity[index] - model.learningRate * regularized;
  parameter[index] += velocity[index];
}

function trainOne(model, features, actionIndex, sampleWeight) {
  const probabilities = forward(model, features, model.probabilityScratch);
  const hidden = model.hiddenScratch;
  const outputGradient = model.outputGradient;
  const hiddenGradient = model.hiddenGradient;
  const targetProbability = clamp(probabilities[actionIndex], 1e-7, 1);
  const loss = -Math.log(targetProbability);

  for (let outputIndex = 0; outputIndex < OUTPUT_SIZE; outputIndex += 1) {
    outputGradient[outputIndex] = sampleWeight
      * (probabilities[outputIndex] - (outputIndex === actionIndex ? 1 : 0));
  }

  // Hidden gradients must use the pre-update second layer weights.
  for (let hiddenIndex = 0; hiddenIndex < HIDDEN_SIZE; hiddenIndex += 1) {
    let gradient = 0;
    for (let outputIndex = 0; outputIndex < OUTPUT_SIZE; outputIndex += 1) {
      gradient += model.w2[outputIndex * HIDDEN_SIZE + hiddenIndex]
        * outputGradient[outputIndex];
    }
    hiddenGradient[hiddenIndex] = gradient * (1 - hidden[hiddenIndex] * hidden[hiddenIndex]);
  }

  // Clip the global gradient norm instead of clipping individual parameters.
  // This preserves its direction, which makes rapid online adaptation stable.
  let squaredNorm = 0;
  for (let outputIndex = 0; outputIndex < OUTPUT_SIZE; outputIndex += 1) {
    const gradient = outputGradient[outputIndex];
    squaredNorm += gradient * gradient;
    for (let hiddenIndex = 0; hiddenIndex < HIDDEN_SIZE; hiddenIndex += 1) {
      const weightGradient = gradient * hidden[hiddenIndex];
      squaredNorm += weightGradient * weightGradient;
    }
  }
  for (let hiddenIndex = 0; hiddenIndex < HIDDEN_SIZE; hiddenIndex += 1) {
    const gradient = hiddenGradient[hiddenIndex];
    squaredNorm += gradient * gradient;
    for (let inputIndex = 0; inputIndex < INPUT_SIZE; inputIndex += 1) {
      const weightGradient = gradient * featureAt(features, inputIndex);
      squaredNorm += weightGradient * weightGradient;
    }
  }
  const norm = Math.sqrt(squaredNorm);
  const gradientScale = norm > model.gradientClip ? model.gradientClip / norm : 1;

  for (let outputIndex = 0; outputIndex < OUTPUT_SIZE; outputIndex += 1) {
    const gradient = outputGradient[outputIndex] * gradientScale;
    const offset = outputIndex * HIDDEN_SIZE;
    for (let hiddenIndex = 0; hiddenIndex < HIDDEN_SIZE; hiddenIndex += 1) {
      updateParameter(
        model.w2,
        model.vw2,
        offset + hiddenIndex,
        gradient * hidden[hiddenIndex],
        model,
      );
    }
    updateParameter(model.b2, model.vb2, outputIndex, gradient, model);
  }

  for (let hiddenIndex = 0; hiddenIndex < HIDDEN_SIZE; hiddenIndex += 1) {
    const gradient = hiddenGradient[hiddenIndex] * gradientScale;
    const offset = hiddenIndex * INPUT_SIZE;
    for (let inputIndex = 0; inputIndex < INPUT_SIZE; inputIndex += 1) {
      updateParameter(
        model.w1,
        model.vw1,
        offset + inputIndex,
        gradient * featureAt(features, inputIndex),
        model,
      );
    }
    updateParameter(model.b1, model.vb1, hiddenIndex, gradient, model);
  }

  return loss;
}

function storeReplay(model, features, actionIndex) {
  const slot = model.replayHead;
  const offset = slot * INPUT_SIZE;
  for (let index = 0; index < INPUT_SIZE; index += 1) {
    model.replayFeatures[offset + index] = features[index];
  }
  model.replayActions[slot] = actionIndex;
  model.replayHead = (slot + 1) % model.replayCapacity;
  model.replayCount = Math.min(model.replayCapacity, model.replayCount + 1);
}

function trainReplaySample(model, slot, sampleWeight) {
  const offset = slot * INPUT_SIZE;
  for (let index = 0; index < INPUT_SIZE; index += 1) {
    model.featureScratch[index] = model.replayFeatures[offset + index];
  }
  trainOne(model, model.featureScratch, model.replayActions[slot], sampleWeight);
}

function updateLastPrediction(model, probabilities) {
  const actionIndex = classify(probabilities);
  const confidence = probabilities[actionIndex];
  model.lastActionIndex = actionIndex;
  model.lastConfidence = confidence;
  return actionIndex;
}

export function createPredictor(options = {}) {
  const seed = Number(options.seed ?? 0x54524d57) >>> 0;
  const random = makeRandom(seed);
  const replayCapacity = Math.max(8, Math.floor(
    options.replayCapacity ?? DEFAULT_REPLAY_CAPACITY,
  ));
  const model = {
    seed,
    architecture: `${INPUT_SIZE}→${HIDDEN_SIZE}→${OUTPUT_SIZE}`,
    inputSize: INPUT_SIZE,
    hiddenSize: HIDDEN_SIZE,
    outputSize: OUTPUT_SIZE,
    parameterCount: PARAMETER_COUNT,
    learningRate: clamp(Number(options.learningRate ?? 0.055), 0.0001, 0.5),
    momentum: clamp(Number(options.momentum ?? 0.82), 0, 0.99),
    gradientClip: clamp(Number(options.gradientClip ?? 1.5), 0.01, 100),
    l2: clamp(Number(options.l2 ?? 1e-5), 0, 0.1),
    replayCapacity,
    replaySteps: Math.max(0, Math.floor(options.replaySteps ?? DEFAULT_REPLAY_STEPS)),
    replayWeight: clamp(Number(options.replayWeight ?? 0.28), 0, 2),
    recentReplayWindow: Math.max(1, Math.floor(
      options.recentReplayWindow ?? DEFAULT_RECENT_REPLAY_WINDOW,
    )),
    w1: new Float32Array(INPUT_SIZE * HIDDEN_SIZE),
    b1: new Float32Array(HIDDEN_SIZE),
    w2: new Float32Array(HIDDEN_SIZE * OUTPUT_SIZE),
    b2: new Float32Array(OUTPUT_SIZE),
    vw1: new Float32Array(INPUT_SIZE * HIDDEN_SIZE),
    vb1: new Float32Array(HIDDEN_SIZE),
    vw2: new Float32Array(HIDDEN_SIZE * OUTPUT_SIZE),
    vb2: new Float32Array(OUTPUT_SIZE),
    replayFeatures: new Float32Array(replayCapacity * INPUT_SIZE),
    replayActions: new Uint8Array(replayCapacity),
    replayHead: 0,
    replayCount: 0,
    replayCursor: 0,
    samples: 0,
    trainSteps: 0,
    lossEma: Math.log(OUTPUT_SIZE),
    accuracyEma: 0,
    lastConfidence: 1 / OUTPUT_SIZE,
    lastActionIndex: 0,
    classCounts: new Uint32Array(OUTPUT_SIZE),
    hiddenScratch: new Float32Array(HIDDEN_SIZE),
    logitScratch: new Float32Array(OUTPUT_SIZE),
    probabilityScratch: new Float32Array(OUTPUT_SIZE),
    outputGradient: new Float32Array(OUTPUT_SIZE),
    hiddenGradient: new Float32Array(HIDDEN_SIZE),
    featureScratch: new Float32Array(INPUT_SIZE),
    resultScratch: {
      probabilities: new Float32Array(OUTPUT_SIZE),
      actionIndex: 0,
      action: ACTIONS[0],
      confidence: 0,
    },
    trainResultScratch: {
      samples: 0,
      loss: Math.log(OUTPUT_SIZE),
      accuracy: 0,
      actionIndex: 0,
      action: ACTIONS[0],
      confidence: 1 / OUTPUT_SIZE,
    },
  };

  fillXavier(model.w1, INPUT_SIZE, HIDDEN_SIZE, random);
  fillXavier(model.w2, HIDDEN_SIZE, OUTPUT_SIZE, random);
  return model;
}

export function predict(model, features, output) {
  assertFeatures(features);
  let result;
  let probabilities;
  if (output === undefined) {
    probabilities = new Float32Array(OUTPUT_SIZE);
    result = {
      probabilities,
      actionIndex: 0,
      action: ACTIONS[0],
      confidence: 0,
    };
  } else if (output instanceof Float32Array) {
    assertProbabilityBuffer(output);
    probabilities = output;
    result = model.resultScratch;
    result.probabilities = output;
  } else if (typeof output === "object" && output !== null) {
    assertProbabilityBuffer(output.probabilities);
    probabilities = output.probabilities;
    result = output;
  } else {
    throw new TypeError("output must be a Float32Array(6) or an object with a probabilities buffer");
  }
  forward(model, features, probabilities);
  const actionIndex = updateLastPrediction(model, probabilities);
  result.actionIndex = actionIndex;
  result.action = ACTIONS[actionIndex];
  result.confidence = probabilities[actionIndex];
  return result;
}

export function train(model, features, actionIndex, options = {}) {
  assertFeatures(features);
  assertActionIndex(actionIndex);
  const sampleWeight = clamp(Number(options.sampleWeight ?? 1), 0.01, 8);
  const liveProbabilities = forward(model, features, model.probabilityScratch);
  const preUpdateAction = classify(liveProbabilities);
  const liveLoss = trainOne(model, features, actionIndex, sampleWeight);

  storeReplay(model, features, actionIndex);
  model.samples += 1;
  model.trainSteps += 1;
  model.classCounts[actionIndex] += 1;
  const metricAlpha = model.samples < 12 ? 0.18 : 0.065;
  model.lossEma += (liveLoss - model.lossEma) * metricAlpha;
  model.accuracyEma += ((preUpdateAction === actionIndex ? 1 : 0) - model.accuracyEma)
    * metricAlpha;

  const replaySteps = Math.min(
    model.replayCount,
    Math.max(0, Math.floor(options.replaySteps ?? model.replaySteps)),
  );
  const recentWindow = Math.min(model.replayCount, model.recentReplayWindow);
  for (let step = 0; step < replaySteps; step += 1) {
    const age = (model.replayCursor * 29 + step * 17) % recentWindow;
    const slot = (model.replayHead - 1 - age + model.replayCapacity) % model.replayCapacity;
    trainReplaySample(model, slot, model.replayWeight);
    model.replayCursor += 1;
    model.trainSteps += 1;
  }

  const after = forward(model, features, model.probabilityScratch);
  const classifiedAction = updateLastPrediction(model, after);
  const result = model.trainResultScratch;
  result.samples = model.samples;
  result.loss = model.lossEma;
  result.accuracy = model.accuracyEma;
  result.actionIndex = classifiedAction;
  result.action = ACTIONS[classifiedAction];
  result.confidence = after[classifiedAction];
  return result;
}

export function getMetrics(model) {
  const diversity = model.samples > 0
    ? model.classCounts.reduce((count, value) => count + (value > 0 ? 1 : 0), 0)
    : 0;
  return {
    architecture: model.architecture,
    parameterCount: model.parameterCount,
    samples: model.samples,
    trainSteps: model.trainSteps,
    replayCount: model.replayCount,
    replayCapacity: model.replayCapacity,
    loss: model.lossEma,
    accuracy: model.accuracyEma,
    confidence: model.lastConfidence,
    lastActionIndex: model.lastActionIndex,
    lastAction: ACTIONS[model.lastActionIndex],
    classDiversity: diversity,
    classCounts: Array.from(model.classCounts),
  };
}

if (LOG_OUTPUTS) {
  // Retained as a compile-time debugging hook; false in production builds.
  console.info("adversarial predictor outputs", ACTIONS);
}

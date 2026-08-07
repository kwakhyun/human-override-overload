function safeAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  return AudioContext ? new AudioContext() : null;
}

export function createSfxEngine() {
  let context = null;
  let enabled = true;
  let master = null;
  let reverb = null;

  function ensureContext() {
    if (!context) {
      context = safeAudioContext();
      if (context) {
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -18;
        compressor.knee.value = 15;
        compressor.ratio.value = 8;
        compressor.attack.value = 0.002;
        compressor.release.value = 0.16;
        master = context.createGain();
        master.gain.value = 0.78;
        master.connect(compressor).connect(context.destination);

        const impulse = context.createBuffer(2, context.sampleRate * 0.72, context.sampleRate);
        for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
          const data = impulse.getChannelData(channel);
          for (let index = 0; index < data.length; index += 1) {
            const progress = index / data.length;
            data[index] = (Math.random() * 2 - 1) * (1 - progress) ** 3.2;
          }
        }
        const convolver = context.createConvolver();
        convolver.buffer = impulse;
        const wet = context.createGain();
        wet.gain.value = 0.18;
        convolver.connect(wet).connect(master);
        reverb = convolver;
      }
    }
    if (context?.state === "suspended") context.resume();
    return context;
  }

  function route(node, wetAmount = 0) {
    node.connect(master);
    if (reverb && wetAmount > 0) {
      const send = context.createGain();
      send.gain.value = wetAmount;
      node.connect(send).connect(reverb);
    }
  }

  function tone({
    frequency = 440,
    endFrequency = frequency,
    duration = 0.12,
    type = "sine",
    volume = 0.06,
    delay = 0,
    attack = 0.006,
    filterFrequency = 9000,
    filterType = "lowpass",
    wet = 0,
  }) {
    if (!enabled) return;
    const audio = ensureContext();
    if (!audio) return;
    const start = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(20, frequency), start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
    filter.type = filterType;
    filter.frequency.value = filterFrequency;
    filter.Q.value = 0.7;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + Math.max(0.002, attack));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(filter).connect(gain);
    route(gain, wet);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.03);
  }

  function noise({
    duration = 0.1,
    volume = 0.025,
    delay = 0,
    filterType = "bandpass",
    filterFrequency = 1500,
    q = 0.8,
    attack = 0.002,
    wet = 0,
  } = {}) {
    if (!enabled) return;
    const audio = ensureContext();
    if (!audio) return;
    const frameCount = Math.max(1, Math.floor(audio.sampleRate * duration));
    const buffer = audio.createBuffer(1, frameCount, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < frameCount; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    const start = audio.currentTime + delay;
    filter.type = filterType;
    filter.frequency.value = filterFrequency;
    filter.Q.value = q;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.buffer = buffer;
    source.connect(filter).connect(gain);
    route(gain, wet);
    source.start(start);
  }

  function weaponCrack({ body = 150, snap = 2400, volume = 0.05, tail = 0.18 } = {}) {
    noise({ duration: 0.035, volume: volume * 1.15, filterType: "highpass", filterFrequency: snap, q: 0.3 });
    noise({ duration: tail, volume: volume * 0.48, delay: 0.012, filterFrequency: 1100, q: 0.75, wet: 0.42 });
    tone({ frequency: body * 1.8, endFrequency: body, duration: 0.075, type: "square", volume, filterFrequency: 1800, wet: 0.12 });
    tone({ frequency: 2500, endFrequency: 740, duration: 0.045, type: "sawtooth", volume: volume * 0.32, filterFrequency: 4200 });
  }

  function play(name) {
    if (!enabled) return;
    switch (name) {
      case "start":
        tone({ frequency: 150, endFrequency: 320, duration: 0.3, volume: 0.045, wet: 0.3 });
        tone({ frequency: 360, endFrequency: 880, duration: 0.2, delay: 0.14, volume: 0.03, wet: 0.25 });
        break;
      case "dash":
        noise({ duration: 0.17, volume: 0.038, filterType: "bandpass", filterFrequency: 1200, q: 0.55, wet: 0.15 });
        tone({ frequency: 180, endFrequency: 820, duration: 0.15, type: "sawtooth", volume: 0.03, filterFrequency: 2800 });
        break;
      case "decoy":
        tone({ frequency: 980, endFrequency: 330, duration: 0.22, type: "square", volume: 0.026, wet: 0.4 });
        tone({ frequency: 520, endFrequency: 1280, duration: 0.2, delay: 0.07, volume: 0.019, wet: 0.35 });
        break;
      case "shoot":
        weaponCrack({ body: 175, snap: 2600, volume: 0.052, tail: 0.16 });
        break;
      case "towerShot":
        weaponCrack({ body: 125, snap: 3200, volume: 0.034, tail: 0.1 });
        break;
      case "kill":
        noise({ duration: 0.075, volume: 0.03, filterFrequency: 1380, q: 1.3, wet: 0.18 });
        tone({ frequency: 310, endFrequency: 82, duration: 0.12, type: "square", volume: 0.024, filterFrequency: 1550 });
        break;
      case "rail":
        noise({ duration: 0.055, volume: 0.07, filterType: "highpass", filterFrequency: 1900 });
        noise({ duration: 0.34, volume: 0.035, delay: 0.018, filterFrequency: 760, q: 0.55, wet: 0.7 });
        tone({ frequency: 2100, endFrequency: 76, duration: 0.32, type: "sawtooth", volume: 0.055, filterFrequency: 4600, wet: 0.35 });
        tone({ frequency: 92, endFrequency: 48, duration: 0.28, type: "sine", volume: 0.065, delay: 0.025 });
        break;
      case "enemyShot":
        weaponCrack({ body: 105, snap: 1800, volume: 0.038, tail: 0.21 });
        break;
      case "enemyHit":
        noise({ duration: 0.09, volume: 0.042, filterFrequency: 1150, q: 1.2, wet: 0.28 });
        tone({ frequency: 240, endFrequency: 68, duration: 0.11, type: "square", volume: 0.028, filterFrequency: 1300 });
        break;
      case "playerHit":
        noise({ duration: 0.22, volume: 0.065, filterFrequency: 720, q: 0.65, wet: 0.18 });
        tone({ frequency: 130, endFrequency: 42, duration: 0.34, type: "sawtooth", volume: 0.055, filterFrequency: 980 });
        break;
      case "shieldHit":
        noise({ duration: 0.1, volume: 0.03, filterType: "highpass", filterFrequency: 3200, wet: 0.4 });
        tone({ frequency: 1500, endFrequency: 360, duration: 0.2, volume: 0.036, wet: 0.55 });
        break;
      case "shield":
        tone({ frequency: 280, endFrequency: 980, duration: 0.32, volume: 0.04, wet: 0.5 });
        noise({ duration: 0.24, volume: 0.018, filterType: "highpass", filterFrequency: 2500, wet: 0.45 });
        break;
      case "emp":
        noise({ duration: 0.36, volume: 0.05, filterFrequency: 620, q: 0.35, wet: 0.55 });
        tone({ frequency: 1300, endFrequency: 45, duration: 0.46, type: "sawtooth", volume: 0.043, filterFrequency: 2400, wet: 0.42 });
        break;
      case "arc":
        noise({ duration: 0.17, volume: 0.033, filterType: "highpass", filterFrequency: 2900, wet: 0.5 });
        tone({ frequency: 1850, endFrequency: 430, duration: 0.19, type: "sawtooth", volume: 0.036, filterFrequency: 3600, wet: 0.45 });
        break;
      case "build":
        tone({ frequency: 180, endFrequency: 560, duration: 0.16, type: "square", volume: 0.032, wet: 0.25 });
        tone({ frequency: 520, endFrequency: 920, duration: 0.2, delay: 0.08, volume: 0.024, wet: 0.3 });
        break;
      case "denied":
        tone({ frequency: 170, endFrequency: 105, duration: 0.14, type: "square", volume: 0.026, filterFrequency: 900 });
        tone({ frequency: 150, endFrequency: 90, duration: 0.13, delay: 0.15, type: "square", volume: 0.022, filterFrequency: 800 });
        break;
      case "hacked":
        noise({ duration: 0.25, volume: 0.03, filterType: "highpass", filterFrequency: 2100, wet: 0.42 });
        [920, 610, 370].forEach((frequency, index) => tone({ frequency, endFrequency: frequency * 0.7, duration: 0.09, delay: index * 0.07, type: "square", volume: 0.024, wet: 0.28 }));
        break;
      case "counter":
        noise({ duration: 0.42, volume: 0.04, filterFrequency: 520, q: 0.55, wet: 0.5 });
        tone({ frequency: 96, endFrequency: 42, duration: 0.55, type: "sawtooth", volume: 0.06, filterFrequency: 860, wet: 0.34 });
        tone({ frequency: 740, endFrequency: 510, duration: 0.11, type: "square", volume: 0.035, delay: 0.05, filterFrequency: 1700 });
        tone({ frequency: 740, endFrequency: 510, duration: 0.11, type: "square", volume: 0.035, delay: 0.24, filterFrequency: 1700 });
        break;
      case "boss":
        noise({ duration: 0.85, volume: 0.055, filterFrequency: 280, q: 0.35, wet: 0.65 });
        tone({ frequency: 78, endFrequency: 35, duration: 0.92, type: "sawtooth", volume: 0.07, filterFrequency: 720, wet: 0.48 });
        tone({ frequency: 410, endFrequency: 190, duration: 0.46, delay: 0.24, type: "square", volume: 0.032, wet: 0.5 });
        break;
      case "enemyAlert":
        tone({ frequency: 620, endFrequency: 780, duration: 0.09, type: "square", volume: 0.026, filterFrequency: 1700, wet: 0.2 });
        tone({ frequency: 420, endFrequency: 360, duration: 0.13, delay: 0.11, type: "square", volume: 0.022, filterFrequency: 1400, wet: 0.22 });
        break;
      case "detectionTick":
        tone({ frequency: 880, endFrequency: 620, duration: 0.07, type: "square", volume: 0.026, filterFrequency: 1900 });
        noise({ duration: 0.045, volume: 0.012, filterType: "highpass", filterFrequency: 3300 });
        break;
      case "alert":
        tone({ frequency: 760, endFrequency: 520, duration: 0.12, type: "square", volume: 0.042, filterFrequency: 2100, wet: 0.28 });
        tone({ frequency: 510, endFrequency: 710, duration: 0.13, type: "square", volume: 0.04, delay: 0.12, filterFrequency: 1900, wet: 0.28 });
        break;
      case "core":
        tone({ frequency: 180, endFrequency: 980, duration: 0.48, volume: 0.05, wet: 0.55 });
        tone({ frequency: 470, endFrequency: 1420, duration: 0.36, delay: 0.11, type: "triangle", volume: 0.026, wet: 0.48 });
        break;
      case "capture":
        noise({ duration: 0.32, volume: 0.065, filterFrequency: 480, q: 0.5, wet: 0.3 });
        tone({ frequency: 260, endFrequency: 38, duration: 0.52, type: "sawtooth", volume: 0.06, filterFrequency: 950, wet: 0.25 });
        break;
      case "analysis":
        tone({ frequency: 320, endFrequency: 510, duration: 0.18, volume: 0.032, wet: 0.3 });
        tone({ frequency: 510, endFrequency: 790, duration: 0.2, volume: 0.032, delay: 0.12, wet: 0.3 });
        break;
      case "reward":
        [392, 523, 659].forEach((frequency, index) => {
          tone({ frequency, endFrequency: frequency * 1.08, duration: 0.25, delay: index * 0.08, volume: 0.032, wet: 0.48 });
        });
        break;
      case "upgrade":
        [330, 494, 659, 988].forEach((frequency, index) => {
          tone({ frequency, endFrequency: frequency * 1.04, duration: 0.16, delay: index * 0.045, volume: 0.022, wet: 0.32 });
        });
        break;
      case "victory":
        [261, 329, 392, 523].forEach((frequency, index) => {
          tone({ frequency, endFrequency: frequency * 1.01, duration: 0.34, delay: index * 0.1, volume: 0.042, wet: 0.52 });
        });
        break;
      case "click":
      default:
        tone({ frequency: 520, endFrequency: 610, duration: 0.07, volume: 0.02 });
    }
  }

  return {
    start() {
      ensureContext();
    },
    setEnabled(value) {
      enabled = value;
    },
    play,
  };
}

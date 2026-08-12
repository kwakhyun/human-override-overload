import { AGENT_VOICE_PATHS } from "../game/assets/manifest.ts";

const ABILITY_PRIORITY = Object.freeze({
  empPulse: 1,
  aegisWard: 2,
  stratosRun: 3,
  helixTempest: 4,
});

function stopAudio(audio) {
  if (!audio) return;
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch {
    // A partially initialized media element may reject seeking during teardown.
  }
}

export function createAgentVoice({
  AudioCtor = globalThis.Audio,
  paths = AGENT_VOICE_PATHS,
  volume = 0.78,
} = {}) {
  const clips = new Map();
  let enabled = true;
  let disposed = false;
  let current = null;
  let currentPriority = 0;

  const ensureClip = (ability) => {
    if (disposed || typeof AudioCtor !== "function" || !paths[ability]) return null;
    if (clips.has(ability)) return clips.get(ability);
    const audio = new AudioCtor(paths[ability]);
    audio.preload = "auto";
    audio.volume = volume;
    // Request the media pipeline immediately when combat mounts. Creating an
    // Audio element alone does not guarantee that Chromium starts fetching or
    // decoding it before the first key press.
    audio.load?.();
    audio.onended = () => {
      if (current !== audio) return;
      current = null;
      currentPriority = 0;
    };
    clips.set(ability, audio);
    return audio;
  };

  const stop = () => {
    stopAudio(current);
    current = null;
    currentPriority = 0;
  };

  return {
    preload() {
      if (disposed) return;
      Object.keys(paths).forEach(ensureClip);
    },
    setEnabled(nextEnabled) {
      enabled = Boolean(nextEnabled);
      if (!enabled) stop();
    },
    play(ability) {
      if (!enabled || disposed) return false;
      const priority = ABILITY_PRIORITY[ability] || 0;
      const audio = ensureClip(ability);
      // Only the ultimate owns an interruption lock. Q/E/F are short tactical
      // acknowledgements and a fresh key press must answer immediately rather
      // than waiting behind another ordinary callout.
      if (!audio || !priority || (current && currentPriority === 4 && priority < 4)) return false;
      stop();
      current = audio;
      currentPriority = priority;
      try {
        audio.currentTime = 0;
        const playback = audio.play();
        playback?.catch?.(() => {
          if (current === audio) {
            current = null;
            currentPriority = 0;
          }
        });
        return true;
      } catch {
        current = null;
        currentPriority = 0;
        return false;
      }
    },
    stop,
    dispose() {
      if (disposed) return;
      stop();
      for (const audio of clips.values()) {
        audio.onended = null;
        stopAudio(audio);
      }
      clips.clear();
      disposed = true;
    },
  };
}

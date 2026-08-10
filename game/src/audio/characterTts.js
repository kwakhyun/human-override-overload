const DEFAULT_LANGUAGE = "ko-KR";
const MAX_DIALOGUE_LENGTH = 280;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * These profiles shape whatever voice the browser/OS makes available. They are
 * deliberately small variations, not claims that the browser voice belongs to
 * an actor or is a bespoke character performance.
 */
export const CHARACTER_TTS_PROFILES = Object.freeze({
  AEGIS: Object.freeze({ pitch: 1.04, rate: 0.98, volume: 0.92, voiceSlot: 0 }),
  RHEA: Object.freeze({ pitch: 1.1, rate: 1.06, volume: 0.9, voiceSlot: 1 }),
  HANA: Object.freeze({ pitch: 0.97, rate: 0.94, volume: 0.9, voiceSlot: 2 }),
  ILYA: Object.freeze({ pitch: 0.9, rate: 0.91, volume: 0.92, voiceSlot: 3 }),
  LARK: Object.freeze({ pitch: 1.01, rate: 1.02, volume: 0.88, voiceSlot: 4 }),
  OPERATOR: Object.freeze({ pitch: 0.96, rate: 0.98, volume: 0.88, voiceSlot: 0 }),
  WRONG_ENGINE: Object.freeze({ pitch: 0.56, rate: 0.73, volume: 1, voiceSlot: 1 }),
  MIRROR_TYRANT: Object.freeze({ pitch: 0.64, rate: 0.81, volume: 1, voiceSlot: 2 }),
  DROWNED_ORACLE: Object.freeze({ pitch: 0.71, rate: 0.76, volume: 1, voiceSlot: 3 }),
  BOSS: Object.freeze({ pitch: 0.61, rate: 0.77, volume: 1, voiceSlot: 0 }),
});

const SPEAKER_ALIASES = Object.freeze({
  PLAYER: "AEGIS",
  HERO: "AEGIS",
  THE_WRONG_ENGINE: "WRONG_ENGINE",
  WRONGENGINE: "WRONG_ENGINE",
  ENGINE: "WRONG_ENGINE",
  MIRRORTYRANT: "MIRROR_TYRANT",
  DROWNEDORACLE: "DROWNED_ORACLE",
  SOVEREIGN: "BOSS",
});

const PRIORITY_LEVELS = Object.freeze({
  ambient: 0,
  normal: 1,
  important: 2,
  critical: 3,
});

function canonicalSpeaker(value) {
  const normalized = String(value || "OPERATOR")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const aliased = SPEAKER_ALIASES[normalized] || normalized;
  return CHARACTER_TTS_PROFILES[aliased] ? aliased : "OPERATOR";
}

function normalizePriority(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return clamp(Math.round(value), 0, 3);
  }
  return PRIORITY_LEVELS[String(value || "normal").toLowerCase()] ?? PRIORITY_LEVELS.normal;
}

function normalizeDialogue(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_DIALOGUE_LENGTH);
}

function voiceLanguageRank(voice) {
  const language = String(voice?.lang || "").toLowerCase();
  if (language === "ko-kr") return 0;
  if (language.startsWith("ko")) return 1;
  return 2;
}

function stableVoices(synthesis) {
  let voices = [];
  try {
    voices = synthesis?.getVoices?.() || [];
  } catch {
    return [];
  }
  return [...voices].sort((left, right) => {
    const languageDifference = voiceLanguageRank(left) - voiceLanguageRank(right);
    if (languageDifference) return languageDifference;
    const localDifference = Number(right?.localService === true) - Number(left?.localService === true);
    if (localDifference) return localDifference;
    return `${left?.lang || ""}\u0000${left?.name || ""}`.localeCompare(
      `${right?.lang || ""}\u0000${right?.name || ""}`,
      "en",
    );
  });
}

function selectVoice(voices, profile) {
  if (!voices.length) return null;
  const korean = voices.filter((voice) => voiceLanguageRank(voice) < 2);
  const candidates = korean.length ? korean : voices;
  return candidates[profile.voiceSlot % candidates.length] || candidates[0] || null;
}

/**
 * Browser-native, network-free dialogue speech. The first activation must be
 * called synchronously from a click/key/touch handler; speech is never queued
 * for a later autoplay attempt. Callers should pass authored scenario dialogue,
 * not HUD labels or button captions.
 */
export function createCharacterTts({
  enabled = true,
  synthesis = globalThis?.speechSynthesis,
  Utterance = globalThis?.SpeechSynthesisUtterance,
} = {}) {
  const supported = Boolean(
    synthesis
      && typeof synthesis.speak === "function"
      && typeof synthesis.cancel === "function"
      && typeof Utterance === "function",
  );
  let isEnabled = Boolean(enabled);
  let activated = false;
  let disposed = false;
  let current = null;
  let utteranceGeneration = 0;

  function cancel() {
    utteranceGeneration += 1;
    current = null;
    if (!supported) return false;
    try {
      synthesis.cancel();
      return true;
    } catch {
      return false;
    }
  }

  function setEnabled(value) {
    isEnabled = Boolean(value);
    if (!isEnabled) cancel();
    return isEnabled;
  }

  function activateFromUserGesture() {
    if (disposed || !supported || !isEnabled) return false;
    activated = true;
    return true;
  }

  function speak({ speaker = "OPERATOR", text = "", priority = "normal" } = {}) {
    const dialogue = normalizeDialogue(text);
    if (disposed || !supported || !isEnabled || !activated || !dialogue) return false;

    const nextPriority = normalizePriority(priority);
    if (current && nextPriority < current.priority) return false;

    const speakerId = canonicalSpeaker(speaker);
    const profile = CHARACTER_TTS_PROFILES[speakerId];
    const voices = stableVoices(synthesis);
    const voice = selectVoice(voices, profile);
    cancel();

    const generation = utteranceGeneration;
    let utterance;
    try {
      utterance = new Utterance(dialogue);
      utterance.lang = voice?.lang || DEFAULT_LANGUAGE;
      utterance.voice = voice;
      utterance.pitch = clamp(profile.pitch, 0.5, 2);
      utterance.rate = clamp(profile.rate, 0.5, 2);
      utterance.volume = clamp(profile.volume, 0, 1);
      utterance.onend = utterance.onerror = () => {
        if (generation === utteranceGeneration) current = null;
      };
      current = { generation, priority: nextPriority, speaker: speakerId, utterance };
      synthesis.speak(utterance);
      return true;
    } catch {
      if (generation === utteranceGeneration) current = null;
      return false;
    }
  }

  function getDiagnostics() {
    const voices = supported ? stableVoices(synthesis) : [];
    const koreanVoices = voices.filter((voice) => voiceLanguageRank(voice) < 2);
    return {
      supported,
      enabled: isEnabled,
      activated,
      disposed,
      speaking: Boolean(current),
      speaker: current?.speaker || null,
      voiceCount: voices.length,
      koreanVoiceCount: koreanVoices.length,
      preferredLanguage: DEFAULT_LANGUAGE,
      selectedVoices: Object.fromEntries(
        Object.entries(CHARACTER_TTS_PROFILES).map(([speaker, profile]) => [
          speaker,
          selectVoice(voices, profile)?.name || null,
        ]),
      ),
      mode: supported ? "browser-web-speech" : "unavailable",
    };
  }

  function dispose() {
    if (disposed) return;
    cancel();
    disposed = true;
    activated = false;
  }

  return {
    isSupported: () => supported,
    activateFromUserGesture,
    setEnabled,
    speak,
    cancel,
    dispose,
    getDiagnostics,
  };
}

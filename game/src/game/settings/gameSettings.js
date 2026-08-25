export const GAME_SETTINGS_STORAGE_KEY = "human-override.overload.settings.v1";

export const GRAPHICS_QUALITY_IDS = Object.freeze(["auto", "cinematic", "balanced", "performance"]);

export const DEFAULT_GAME_SETTINGS = Object.freeze({
  masterSoundEnabled: true,
  musicVolume: 1,
  sfxVolume: 0.78,
  voiceVolume: 0.78,
  hapticsEnabled: true,
  graphicsQuality: "auto",
  combatHintsEnabled: true,
  screenShakeEnabled: true,
  reducedMotion: false,
  highContrast: false,
});

function clampVolume(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(1, number));
}

function booleanSetting(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}

export function sanitizeGameSettings(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  return {
    masterSoundEnabled: booleanSetting(source.masterSoundEnabled, DEFAULT_GAME_SETTINGS.masterSoundEnabled),
    musicVolume: clampVolume(source.musicVolume, DEFAULT_GAME_SETTINGS.musicVolume),
    sfxVolume: clampVolume(source.sfxVolume, DEFAULT_GAME_SETTINGS.sfxVolume),
    voiceVolume: clampVolume(source.voiceVolume, DEFAULT_GAME_SETTINGS.voiceVolume),
    hapticsEnabled: booleanSetting(source.hapticsEnabled, DEFAULT_GAME_SETTINGS.hapticsEnabled),
    graphicsQuality: GRAPHICS_QUALITY_IDS.includes(source.graphicsQuality)
      ? source.graphicsQuality
      : DEFAULT_GAME_SETTINGS.graphicsQuality,
    combatHintsEnabled: booleanSetting(source.combatHintsEnabled, DEFAULT_GAME_SETTINGS.combatHintsEnabled),
    screenShakeEnabled: booleanSetting(source.screenShakeEnabled, DEFAULT_GAME_SETTINGS.screenShakeEnabled),
    reducedMotion: booleanSetting(source.reducedMotion, DEFAULT_GAME_SETTINGS.reducedMotion),
    highContrast: booleanSetting(source.highContrast, DEFAULT_GAME_SETTINGS.highContrast),
  };
}

export function mergeGameSettings(current, patch) {
  return sanitizeGameSettings({ ...(current || {}), ...(patch || {}) });
}

export function loadGameSettings(storage = typeof window !== "undefined" ? window.localStorage : null) {
  if (!storage?.getItem) return { ...DEFAULT_GAME_SETTINGS };
  try {
    const stored = JSON.parse(storage.getItem(GAME_SETTINGS_STORAGE_KEY) || "null");
    return sanitizeGameSettings(stored || {});
  } catch {
    return { ...DEFAULT_GAME_SETTINGS };
  }
}

export function saveGameSettings(settings, storage = typeof window !== "undefined" ? window.localStorage : null) {
  const sanitized = sanitizeGameSettings(settings);
  try {
    storage?.setItem?.(GAME_SETTINGS_STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // Storage denial keeps the sanitized settings available for this session.
  }
  return sanitized;
}

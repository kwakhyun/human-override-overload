import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  DEFAULT_GAME_SETTINGS,
  GAME_SETTINGS_STORAGE_KEY,
  loadGameSettings,
  mergeGameSettings,
  sanitizeGameSettings,
  saveGameSettings,
} from "../src/game/settings/gameSettings.js";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

function createStorage(initialValue = null) {
  let value = initialValue;
  return {
    getItem(key) {
      return key === GAME_SETTINGS_STORAGE_KEY ? value : null;
    },
    setItem(key, nextValue) {
      if (key === GAME_SETTINGS_STORAGE_KEY) value = nextValue;
    },
    snapshot() {
      return value;
    },
  };
}

test("game settings migrate legacy audio values and fill commercial defaults", () => {
  const storage = createStorage(JSON.stringify({ musicVolume: 0.42, hapticsEnabled: false }));
  const settings = loadGameSettings(storage);

  assert.equal(settings.musicVolume, 0.42);
  assert.equal(settings.hapticsEnabled, false);
  assert.equal(settings.masterSoundEnabled, true);
  assert.equal(settings.graphicsQuality, "auto");
  assert.equal(settings.screenShakeEnabled, true);
  assert.equal(settings.combatHintsEnabled, true);
});

test("game settings sanitize malformed values and persist a complete profile", () => {
  const sanitized = sanitizeGameSettings({
    musicVolume: 4,
    sfxVolume: -2,
    voiceVolume: "invalid",
    graphicsQuality: "ultra-impossible",
    reducedMotion: true,
  });

  assert.equal(sanitized.musicVolume, 1);
  assert.equal(sanitized.sfxVolume, 0);
  assert.equal(sanitized.voiceVolume, DEFAULT_GAME_SETTINGS.voiceVolume);
  assert.equal(sanitized.graphicsQuality, "auto");
  assert.equal(sanitized.reducedMotion, true);

  const storage = createStorage();
  saveGameSettings(sanitized, storage);
  assert.deepEqual(JSON.parse(storage.snapshot()), sanitized);
});

test("game settings merge patches without dropping unrelated preferences", () => {
  const current = { ...DEFAULT_GAME_SETTINGS, musicVolume: 0.25, highContrast: true };
  const next = mergeGameSettings(current, { screenShakeEnabled: false });

  assert.equal(next.musicVolume, 0.25);
  assert.equal(next.highContrast, true);
  assert.equal(next.screenShakeEnabled, false);
});

test("title settings UI is focus-managed, responsive, and wired to runtime options", async () => {
  const [app, overlay, styles, main, createGame, scene, battleView] = await Promise.all([
    read("src/App.jsx"),
    read("src/ui/settings/GameSettingsOverlay.jsx"),
    read("src/styles/settings.css"),
    read("src/main.jsx"),
    read("src/phaser/createOverloadGame.ts"),
    read("src/phaser/scenes/OverloadScene.ts"),
    read("src/phaser/view/BattleView.ts"),
  ]);

  assert.match(app, /className="intro-settings-toggle"/);
  assert.match(app, /<GameSettingsOverlay/);
  assert.match(app, /saveGameSettings\(audioSettings\)/);
  assert.match(app, /qualityPreference: audioSettings\?\.graphicsQuality/);
  assert.match(app, /audioSettings\.combatHintsEnabled !== false/);
  assert.match(overlay, /useDialogFocusTrap\(modalRef, true\)/);
  assert.match(overlay, /requestFullscreen/);
  for (const tab of ["general", "audio", "graphics", "controls"]) {
    assert.match(overlay, new RegExp(`id: "${tab}"`));
  }
  assert.match(styles, /\.game-settings-console/);
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(main, /import "\.\/styles\/settings\.css"/);
  assert.match(createGame, /qualityPreference\?: "auto" \| "cinematic" \| "balanced" \| "performance"/);
  assert.match(scene, /maxAutoQuality: this\.initialQuality/);
  assert.match(battleView, /if \(!this\.screenShakeEnabled\) return/);
});

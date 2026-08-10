import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  CHARACTER_TTS_PROFILES,
  createCharacterTts,
} from "../src/audio/characterTts.js";

class MockUtterance {
  constructor(text) {
    this.text = text;
  }
}

function createMockSynthesis(voices = []) {
  return {
    voices,
    spoken: [],
    cancelCount: 0,
    getVoices() {
      return this.voices;
    },
    speak(utterance) {
      this.spoken.push(utterance);
    },
    cancel() {
      this.cancelCount += 1;
    },
  };
}

test("character speech waits for a user gesture and gracefully no-ops when unsupported", () => {
  const unsupported = createCharacterTts({ synthesis: null, Utterance: null });
  assert.equal(unsupported.isSupported(), false);
  assert.equal(unsupported.activateFromUserGesture(), false);
  assert.equal(unsupported.speak({ speaker: "AEGIS", text: "진입한다." }), false);
  assert.equal(unsupported.getDiagnostics().mode, "unavailable");

  const synthesis = createMockSynthesis();
  const tts = createCharacterTts({ synthesis, Utterance: MockUtterance });
  assert.equal(tts.speak({ speaker: "AEGIS", text: "진입한다." }), false);
  assert.equal(synthesis.spoken.length, 0, "creation must never autoplay dialogue");
  assert.equal(tts.activateFromUserGesture(), true);
  assert.equal(tts.speak({ speaker: "AEGIS", text: "진입한다." }), true);
  assert.equal(synthesis.spoken.length, 1);
});

test("Korean voices are selected deterministically per speaker and profiles shape delivery", () => {
  const synthesis = createMockSynthesis([
    { name: "English A", lang: "en-US", localService: true },
    { name: "Korean Z", lang: "ko-KR", localService: false },
    { name: "Korean A", lang: "ko-KR", localService: true },
    { name: "Korean B", lang: "ko", localService: true },
  ]);
  const tts = createCharacterTts({ synthesis, Utterance: MockUtterance });
  tts.activateFromUserGesture();

  assert.equal(tts.speak({ speaker: "RHEA", text: "  <b>Q는</b> 적을 묶어.  " }), true);
  const rhea = synthesis.spoken.at(-1);
  assert.equal(rhea.text, "Q는 적을 묶어.");
  assert.equal(rhea.voice.name, "Korean Z");
  assert.equal(rhea.lang, "ko-KR");
  assert.equal(rhea.pitch, CHARACTER_TTS_PROFILES.RHEA.pitch);
  assert.equal(rhea.rate, CHARACTER_TTS_PROFILES.RHEA.rate);
  assert.equal(rhea.volume, CHARACTER_TTS_PROFILES.RHEA.volume);

  assert.equal(tts.speak({ speaker: "THE WRONG ENGINE", text: "오류를 정정한다." }), true);
  const boss = synthesis.spoken.at(-1);
  assert.equal(boss.pitch, CHARACTER_TTS_PROFILES.WRONG_ENGINE.pitch);
  assert.equal(boss.rate, CHARACTER_TTS_PROFILES.WRONG_ENGINE.rate);
  assert.equal(tts.getDiagnostics().koreanVoiceCount, 3);
  assert.equal(tts.getDiagnostics().selectedVoices.RHEA, "Korean Z");
});

test("one line speaks at a time: equal or higher priority replaces while lower priority waits", () => {
  const synthesis = createMockSynthesis([{ name: "Korean", lang: "ko-KR", localService: true }]);
  const tts = createCharacterTts({ synthesis, Utterance: MockUtterance });
  tts.activateFromUserGesture();

  assert.equal(tts.speak({ speaker: "RHEA", text: "긴급 브리핑.", priority: "important" }), true);
  assert.equal(tts.speak({ speaker: "LARK", text: "잡담.", priority: "ambient" }), false);
  assert.equal(synthesis.spoken.length, 1);
  assert.equal(tts.speak({ speaker: "AEGIS", text: "경고 확인.", priority: "critical" }), true);
  assert.equal(synthesis.spoken.length, 2);
  assert.equal(synthesis.cancelCount, 2, "each accepted line clears any previous page utterance");

  synthesis.spoken.at(-1).onend();
  assert.equal(tts.getDiagnostics().speaking, false);
});

test("the enabled gate, explicit cancel, and dispose stop speech safely", () => {
  const synthesis = createMockSynthesis([{ name: "Korean", lang: "ko-KR" }]);
  const tts = createCharacterTts({ enabled: true, synthesis, Utterance: MockUtterance });
  tts.activateFromUserGesture();
  tts.speak({ speaker: "HANA", text: "연구 결과를 확인해." });
  assert.equal(tts.getDiagnostics().speaking, true);

  assert.equal(tts.setEnabled(false), false);
  assert.equal(tts.getDiagnostics().speaking, false);
  assert.equal(tts.speak({ speaker: "HANA", text: "들리면 안 돼." }), false);
  assert.equal(tts.setEnabled(true), true);
  assert.equal(tts.speak({ speaker: "ILYA", text: "정비 시작." }), true);
  assert.equal(tts.cancel(), true);
  assert.equal(tts.getDiagnostics().speaking, false);

  tts.dispose();
  assert.equal(tts.getDiagnostics().disposed, true);
  assert.equal(tts.speak({ speaker: "LARK", text: "폐기 후 발화." }), false);
  tts.dispose();
});

test("every authored character and regional boss has a bounded deterministic profile", () => {
  const expected = [
    "AEGIS",
    "RHEA",
    "HANA",
    "ILYA",
    "LARK",
    "OPERATOR",
    "WRONG_ENGINE",
    "MIRROR_TYRANT",
    "DROWNED_ORACLE",
    "BOSS",
  ];
  assert.deepEqual(Object.keys(CHARACTER_TTS_PROFILES), expected);
  for (const profile of Object.values(CHARACTER_TTS_PROFILES)) {
    assert.ok(profile.pitch >= 0.5 && profile.pitch <= 2);
    assert.ok(profile.rate >= 0.5 && profile.rate <= 2);
    assert.ok(profile.volume >= 0 && profile.volume <= 1);
    assert.ok(Number.isInteger(profile.voiceSlot));
  }
});

test("React dialogue surfaces activate, narrate, cancel, and mute the shared character TTS", async () => {
  const [app, campaignUi] = await Promise.all([
    readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/ui/campaign/CampaignScreens.jsx", import.meta.url), "utf8"),
  ]);

  assert.match(app, /createCharacterTts\(\{ enabled: true \}\)/);
  assert.match(app, /tts\.activateFromUserGesture\(\)/);
  assert.match(app, /useEffect\(\(\) => \{\s*tts\.setEnabled\(soundEnabled\);\s*\}, \[soundEnabled, tts\]\)/);
  assert.doesNotMatch(app, /useEffect\(\(\) => tts\.setEnabled/);
  assert.match(app, /kind: "scenario-dialogue"/);
  assert.match(app, /kind: "combat-overlay"/);
  assert.match(app, /speaker: "RHEA"/);
  assert.match(app, /onNarration=\{narrate\}/);
  assert.match(app, /if \(request\.cancel\) return tts\.cancel\(\)/);
  assert.match(campaignUi, /kind: "npc-dialogue"/);
  assert.match(campaignUi, /kind: "ability-guide"/);
  assert.match(campaignUi, /return \(\) => onNarration\(\{ id, cancel: true \}\)/);
});

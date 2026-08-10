import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const { createAgentVoice } = await import(new URL("../src/audio/agentVoice.js", import.meta.url));
const manifestSource = await readFile(new URL("../src/game/assets/manifest.ts", import.meta.url), "utf8");
const appSource = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

class FakeAudio {
  static instances = [];

  constructor(src) {
    this.src = src;
    this.currentTime = 0;
    this.pauseCount = 0;
    this.playCount = 0;
    FakeAudio.instances.push(this);
  }

  play() {
    this.playCount += 1;
    return Promise.resolve();
  }

  pause() {
    this.pauseCount += 1;
  }
}

test("Google Chirp ability callouts use stable manifest paths and shipped MP3 files", async () => {
  const expected = [
    ["empPulse", "emp-pulse-online.mp3", 16512],
    ["aegisWard", "aegis-ward-online.mp3", 19104],
    ["stratosRun", "stratos-run-confirmed.mp3", 20736],
    ["helixTempest", "helix-tempest-authorized.mp3", 19392],
  ];
  for (const [ability, filename, bytes] of expected) {
    assert.match(manifestSource, new RegExp(`${ability}: "\\./assets/audio/agent/${filename.replaceAll(".", "\\.")}"`));
    const file = await stat(new URL(`../public/assets/audio/agent/${filename}`, import.meta.url));
    assert.equal(file.size, bytes);
  }
});

test("agent voice preloads only in combat, follows the sound toggle, and protects ultimate priority", () => {
  FakeAudio.instances = [];
  const voice = createAgentVoice({
    AudioCtor: FakeAudio,
    paths: {
      empPulse: "q.mp3",
      aegisWard: "e.mp3",
      stratosRun: "f.mp3",
      helixTempest: "r.mp3",
    },
  });
  assert.equal(FakeAudio.instances.length, 0);
  voice.preload();
  assert.equal(FakeAudio.instances.length, 4);
  assert.ok(FakeAudio.instances.every((audio) => audio.preload === "auto" && audio.volume === 0.78));

  assert.equal(voice.play("helixTempest"), true);
  assert.equal(voice.play("empPulse"), false);
  assert.equal(FakeAudio.instances.find((audio) => audio.src === "r.mp3").playCount, 1);
  assert.equal(FakeAudio.instances.find((audio) => audio.src === "q.mp3").playCount, 0);

  voice.setEnabled(false);
  assert.equal(voice.play("aegisWard"), false);
  voice.setEnabled(true);
  assert.equal(voice.play("aegisWard"), true);
  voice.dispose();
  assert.ok(FakeAudio.instances.every((audio) => audio.onended === null));
});

test("runtime plays voice only after a successful manual ability activation", () => {
  const runtime = appSource.slice(appSource.indexOf("function PhaserArenaScreen"), appSource.indexOf("function ResultScreen"));
  assert.match(runtime, /event\.type === "manualAbilityActivated"[^\n]+agentVoiceRef\.current\?\.play\(event\.ability\)/);
  assert.doesNotMatch(runtime, /manualAbilityRejected[^\n]+agentVoiceRef\.current\?\.play/);
  assert.match(runtime, /voice\?\.setEnabled\(soundEnabled\)/);
  assert.match(runtime, /voice\.dispose\(\)/);
  assert.match(runtime, /const voice = createAgentVoice\(\);[\s\S]+agentVoiceRef\.current = voice/);
});

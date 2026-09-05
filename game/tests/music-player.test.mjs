import assert from "node:assert/strict";
import test from "node:test";
import { createMusicPlayer } from "../src/audio/musicPlayer.js";
import { resolveMusicTrack } from "../src/audio/music.js";

class AudioProbe extends EventTarget {
  paused = true;
  currentTime = 0;
  duration = 180;
  sources = [];
  plays = 0;
  set src(value) { this.sources.push(value); this.currentTime = 0; }
  play() { this.plays++; this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
  metadata() { this.dispatchEvent(new Event("loadedmetadata")); }
}

test("lobby, facility loading, region selection and help share uninterrupted playback", () => {
  const audio = new AudioProbe(), player = createMusicPlayer(audio);
  player.update({ track: resolveMusicTrack("base") });
  audio.currentTime = 42;
  for (const screen of ["loading", "base", "loading", "regions", "guide", "regions", "flight-operations", "defense-select", "base"]) {
    player.update({ track: resolveMusicTrack(screen) });
    assert.equal(audio.currentTime, 42, screen);
    assert.equal(audio.paused, false, screen);
  }
  assert.equal(audio.sources.length, 1);
  assert.equal(audio.plays, 1);
});

test("cinematic silence, loading and settings changes preserve position", () => {
  const audio = new AudioProbe(), player = createMusicPlayer(audio);
  player.update({ track: "lobby.mp3" }); audio.currentTime = 37;
  player.update({ track: null }); player.update({ track: undefined });
  assert.equal(audio.paused, true); assert.equal(audio.currentTime, 37);
  player.update({ track: "lobby.mp3" });
  assert.equal(audio.paused, false); assert.equal(audio.currentTime, 37);
  player.update({ enabled: false }); player.update({ volume: .2 });
  assert.equal(audio.paused, true);
  player.update({ enabled: true });
  assert.equal(audio.currentTime, 37); assert.equal(audio.volume, .2);
  assert.deepEqual(audio.sources, ["lobby.mp3"]);
});

test("returning from a different song seeks only after metadata and resumes", () => {
  const audio = new AudioProbe(), player = createMusicPlayer(audio);
  player.update({ track: "lobby.mp3" }); audio.currentTime = 48;
  player.update({ track: "battle.mp3" }); audio.currentTime = 19;
  player.update({ track: "lobby.mp3" });
  assert.equal(audio.paused, true);
  audio.metadata(); assert.equal(audio.currentTime, 48); assert.equal(audio.paused, false);
  player.update({ track: "battle.mp3" }); audio.metadata(); assert.equal(audio.currentTime, 19);
});

test("interrupted restoration keeps bookmarks and cannot restart muted/disposed audio", () => {
  const audio = new AudioProbe(), player = createMusicPlayer(audio);
  player.update({ track: "lobby.mp3" }); audio.currentTime = 52;
  player.update({ track: "battle.mp3" });
  player.update({ track: "lobby.mp3" }); player.update({ track: "battle.mp3" });
  player.update({ track: "lobby.mp3", enabled: false });
  audio.metadata(); assert.equal(audio.currentTime, 52); assert.equal(audio.paused, true);
  player.update({ enabled: true }); assert.equal(audio.currentTime, 52);
  player.dispose(); audio.metadata(); player.update({ track: "other.mp3" });
  assert.equal(audio.paused, true); assert.equal(audio.sources.at(-1), "lobby.mp3");
});

test("autoplay denial can be retried without reloading the song", async () => {
  const audio = new AudioProbe(), player = createMusicPlayer(audio);
  audio.play = () => Promise.reject(new Error("NotAllowedError"));
  player.update({ track: "lobby.mp3" });
  await new Promise(resolve => setTimeout(resolve, 0));
  audio.play = AudioProbe.prototype.play;
  player.update({ enabled: true });
  assert.equal(audio.paused, false); assert.equal(audio.sources.length, 1);
});

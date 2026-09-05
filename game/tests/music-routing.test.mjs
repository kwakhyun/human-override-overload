import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import test from "node:test";

const music = await import(new URL("../src/audio/music.js", import.meta.url));

test("title and regional music stay isolated by screen and region", () => {
  assert.equal(music.resolveMusicTrack("intro", "wrong-engine-core"), "./assets/audio/under-ashen-skies-title.mp3");
  assert.equal(music.resolveMusicTrack("save", "wrong-engine-core"), null);
  assert.equal(music.resolveMusicTrack("base", "wrong-engine-core"), "./assets/audio/last-light-in-haven-09.mp3");
  assert.equal(music.resolveMusicTrack("regions", "wrong-engine-core"), music.resolveMusicTrack("base"));
  for (const screen of ["loading", "guide", "sword-guide"]) assert.equal(music.resolveMusicTrack(screen), undefined);
  assert.equal(music.resolveMusicTrack("sortie", "wrong-engine-core"), null);
  assert.equal(music.resolveMusicTrack("game", "wrong-engine-core"), "./assets/audio/overload-main-theme.mp3");
  assert.equal(music.resolveMusicTrack("game", "glass-dune"), "./assets/audio/refraction-war-glass-dune.mp3");
  assert.equal(music.resolveMusicTrack("game", "abyssal-archive"), "./assets/audio/memory-below-pressure-abyssal-archive.mp3");
});

test("all supplied screen and regional tracks are real bundled MP3 files", async () => {
  const paths = [
    "under-ashen-skies-title.mp3",
    "last-light-in-haven-09.mp3",
    "overload-main-theme.mp3",
    "refraction-war-glass-dune.mp3",
    "memory-below-pressure-abyssal-archive.mp3",
    "haven-defense.mp3",
    "recruitment-sync.mp3",
    "neon-foundry.mp3",
    "storm-spire.mp3",
    "gene-vault.mp3",
  ];
  for (const path of paths) {
    const file = await stat(new URL(`../public/assets/audio/${path}`, import.meta.url));
    assert.ok(file.size > 100_000, `${path} should contain an audio asset; decoding is verified in browser QA`);
  }
});

test("new music is confined to defense, recruitment and its own combat region", () => {
  assert.equal(music.resolveMusicTrack("defense"), "./assets/audio/haven-defense.mp3");
  for (const screen of ["recruit", "vesper-recruit", "nox-recruit"]) {
    assert.equal(music.resolveMusicTrack(screen), "./assets/audio/recruitment-sync.mp3");
  }
  for (const region of ["neon-foundry", "storm-spire", "gene-vault"]) {
    assert.equal(music.resolveMusicTrack("game", region), `./assets/audio/${region}.mp3`);
    assert.equal(music.resolveMusicTrack("regions", region), music.resolveMusicTrack("base"));
    assert.equal(music.resolveMusicTrack("sortie", region), null);
  }
  assert.equal(music.resolveMusicTrack("return"), null);
  assert.equal(music.resolveMusicTrack("defense-select"), music.resolveMusicTrack("base"));
  assert.equal(music.resolveMusicTrack("defense-result"), music.resolveMusicTrack("base"));
  assert.equal(music.musicTrackGain(music.resolveMusicTrack("recruit")), .30);
  assert.equal(music.musicTrackGain(music.resolveMusicTrack("game", "neon-foundry")), .36);
});

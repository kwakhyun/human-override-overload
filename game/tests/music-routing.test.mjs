import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import test from "node:test";

const music = await import(new URL("../src/audio/music.js", import.meta.url));

test("title and regional music stay isolated by screen and region", () => {
  assert.equal(music.resolveMusicTrack("intro", "wrong-engine-core"), "./assets/audio/under-ashen-skies-title.mp3");
  assert.equal(music.resolveMusicTrack("save", "wrong-engine-core"), null);
  assert.equal(music.resolveMusicTrack("base", "wrong-engine-core"), "./assets/audio/last-light-in-haven-09.mp3");
  assert.equal(music.resolveMusicTrack("regions", "wrong-engine-core"), null);
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
  ];
  for (const path of paths) {
    const file = await stat(new URL(`../public/assets/audio/${path}`, import.meta.url));
    assert.ok(file.size > 1_000_000, `${path} should contain a complete MP3`);
  }
});

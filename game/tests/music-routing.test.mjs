import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import test from "node:test";

const music = await import(new URL("../src/audio/music.js", import.meta.url));

test("title and regional music stay isolated by screen and region", () => {
  assert.equal(music.resolveMusicTrack("intro", "wrong-engine-core"), "./assets/audio/under-ashen-skies-title.mp3");
  assert.equal(music.resolveMusicTrack("save", "wrong-engine-core"), null);
  assert.equal(music.resolveMusicTrack("base", "wrong-engine-core"), null);
  assert.equal(music.resolveMusicTrack("regions", "wrong-engine-core"), null);
  assert.equal(music.resolveMusicTrack("sortie", "wrong-engine-core"), null);
  assert.equal(music.resolveMusicTrack("game", "wrong-engine-core"), "./assets/audio/overload-main-theme.mp3");
  assert.equal(music.resolveMusicTrack("game", "glass-dune"), null);
  assert.equal(music.resolveMusicTrack("game", "abyssal-archive"), null);
});

test("the supplied title track is a real bundled MP3", async () => {
  const file = await stat(new URL("../public/assets/audio/under-ashen-skies-title.mp3", import.meta.url));
  assert.ok(file.size > 1_000_000);
});

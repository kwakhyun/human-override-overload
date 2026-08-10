import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const APP_URL = new URL("../src/App.jsx", import.meta.url);

test("DOM art stays URL-backed and does not eagerly duplicate Phaser texture decoding", async () => {
  const source = await readFile(APP_URL, "utf8");

  assert.match(source, /const DOM_ASSET_REFS = Object\.freeze\(Object\.fromEntries/);
  assert.match(source, /Object\.freeze\(\{ src: source \}\)/);
  assert.match(source, /return \{ assets: DOM_ASSET_REFS, error: false \};/);
  assert.doesNotMatch(source, /new Image\(\)/);
  assert.doesNotMatch(source, /Promise\.all\(Object\.entries\(ASSET_PATHS\)/);
  assert.match(source, /<audio[^>]+preload="metadata"/);
});

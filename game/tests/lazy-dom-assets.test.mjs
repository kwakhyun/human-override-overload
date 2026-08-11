import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const APP_URL = new URL("../src/App.jsx", import.meta.url);

test("DOM art uses scoped decode warmups without mirroring Phaser texture groups", async () => {
  const [source, preloader, index] = await Promise.all([
    readFile(APP_URL, "utf8"),
    readFile(new URL("../src/game/assets/domPreloader.js", import.meta.url), "utf8"),
    readFile(new URL("../index.html", import.meta.url), "utf8"),
  ]);

  assert.match(source, /const DOM_ASSET_REFS = Object\.freeze\(Object\.fromEntries/);
  assert.match(source, /Object\.freeze\(\{ src: source \}\)/);
  assert.match(source, /INITIAL_DOM_ASSET_KEYS = Object\.freeze\(\["intro", "commandButtonStates"\]\)/);
  assert.match(source, /scheduleDomImagePreload\(\[/);
  assert.match(source, /preloadDomImages\(domAssetSources\(COMBAT_DOM_ASSET_KEYS\)\)/);
  assert.doesNotMatch(source, /Promise\.all\(Object\.entries\(ASSET_PATHS\)/);
  assert.doesNotMatch(source, /getGameAssetsForRegion|COMMON_GAME_ASSETS/);
  assert.match(preloader, /const preloadCache = new Map\(\)/);
  assert.match(preloader, /const image = new Image\(\)/);
  assert.match(preloader, /await image\.decode\?\.\(\)/);
  assert.match(index, /rel="preload" as="image"[^>]+start-screen-key-art\.webp[^>]+fetchpriority="high"/);
  assert.match(source, /<audio[^>]+preload="metadata"/);
});

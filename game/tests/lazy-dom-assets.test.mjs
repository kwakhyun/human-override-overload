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
  assert.match(source, /INITIAL_DOM_ASSET_KEYS = Object\.freeze\(\["intro"\]\)/);
  assert.doesNotMatch(source, /commandButtonStates/);
  assert.match(source, /scheduleDomImagePreload\(domAssetSources\(baseSurfaceAssetKeys\(activeCharacterId\)\)\)/);
  assert.match(source, /function baseSurfaceAssetKeys\(characterId\)/);
  assert.doesNotMatch(source, /scheduleDomImagePreload\(\[[\s\S]*regionPreviewSources/);
  assert.match(source, /const availableCombatPortraitKeys = new Set\(\["player", "rheaControlOfficer", characterPortraitAssetKey\(characterId\)\]\)/);
  assert.match(source, /preloadDomImages\(domAssetSources\(\[\.\.\.availableCombatPortraitKeys\]\)\)/);
  assert.match(source, /scheduleDomImagePreload\(domAssetSources\(COMBAT_REWARD_DOM_ASSET_KEYS\)\)/);
  assert.ok(source.indexOf("scheduleDomImagePreload(domAssetSources(COMBAT_REWARD_DOM_ASSET_KEYS))") > source.indexOf("onRuntimeReadyRef.current?.()"));
  assert.doesNotMatch(source, /Promise\.all\(Object\.entries\(ASSET_PATHS\)/);
  assert.doesNotMatch(source, /getGameAssetsForRegion|COMMON_GAME_ASSETS/);
  assert.match(source, /setActiveFacilityId\(facilityId\);\s*setScreen\("base"\);/);
  assert.match(preloader, /const preloadCache = new Map\(\)/);
  assert.match(preloader, /const image = new Image\(\)/);
  assert.match(preloader, /Promise\.race\(\[/);
  assert.match(preloader, /IMAGE_DECODE_TIMEOUT_MS/);
  assert.match(index, /rel="preload" as="image"[^>]+start-screen-anime-v1\.webp[^>]+fetchpriority="high"/);
  assert.match(source, /<audio[^>]+preload="metadata"/);
});

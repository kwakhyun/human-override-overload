import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const videoSpecs = Object.freeze([
  ["sortieWrongEngine", "wrong-engine-sortie.mp4"],
  ["sortieGlassDune", "glass-dune-sortie.mp4"],
  ["sortieAbyssalArchive", "abyssal-archive-sortie.mp4"],
]);

function findBox(bytes, type, start = 0, end = bytes.length) {
  let offset = start;
  while (offset + 8 <= end) {
    let size = bytes.readUInt32BE(offset);
    const name = bytes.toString("ascii", offset + 4, offset + 8);
    let header = 8;
    if (size === 1 && offset + 16 <= end) {
      size = Number(bytes.readBigUInt64BE(offset + 8));
      header = 16;
    } else if (size === 0) {
      size = end - offset;
    }
    if (size < header || offset + size > end) break;
    if (name === type) return { data: offset + header };
    if (["moov", "trak", "mdia"].includes(name)) {
      const nested = findBox(bytes, type, offset + header, offset + size);
      if (nested) return nested;
    }
    offset += size;
  }
  return null;
}

function movieDurationSeconds(bytes) {
  const mvhd = findBox(bytes, "mvhd");
  assert.ok(mvhd, "MP4 must contain a movie header");
  const version = bytes[mvhd.data];
  if (version === 1) {
    const timescale = bytes.readUInt32BE(mvhd.data + 20);
    return Number(bytes.readBigUInt64BE(mvhd.data + 24)) / timescale;
  }
  const timescale = bytes.readUInt32BE(mvhd.data + 12);
  return bytes.readUInt32BE(mvhd.data + 16) / timescale;
}

test("all three region sortie videos are valid six-second MP4 assets", async () => {
  const manifest = await readFile(new URL("src/game/assets/manifest.ts", root), "utf8");
  for (const [assetKey, filename] of videoSpecs) {
    const relative = `assets/overload/campaign/sortie/${filename}`;
    assert.ok(manifest.includes(`${assetKey}: "./${relative}"`));
    const bytes = await readFile(new URL(`public/${relative}`, root));
    assert.equal(bytes.toString("ascii", 4, 8), "ftyp", filename);
    assert.ok(bytes.length > 1_000_000, `${filename} must contain the supplied cinematic`);
    assert.ok(Math.abs(movieDurationSeconds(bytes) - 6) < 0.05, `${filename} must end at six seconds`);
  }
});

test("sortie cinematic defers Phaser texture upload until video decode completes", async () => {
  const [app, screens, styles, createGame, bootScene, bridge] = await Promise.all([
    readFile(new URL("src/App.jsx", root), "utf8"),
    readFile(new URL("src/ui/campaign/CampaignScreens.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
    readFile(new URL("src/phaser/createOverloadGame.ts", root), "utf8"),
    readFile(new URL("src/phaser/scenes/BootScene.ts", root), "utf8"),
    readFile(new URL("src/phaser/adapters/sceneBridge.ts", root), "utf8"),
  ]);
  for (const id of ["wrong-engine-core", "glass-dune", "abyssal-archive"]) {
    assert.match(app, new RegExp(`"${id}": assets\\?\\.sortie`));
  }
  assert.match(app, /setGuideReturnScreen\("sortie"\)/);
  assert.match(app, /beginSortieCinematic\(regionId\)/);
  assert.match(app, /screen === "sortie" \|\| screen === "game"/);
  assert.match(app, /className=\{`combat-runtime-shell/);
  assert.match(app, /\{\(screen === "game" \|\| sortieVideoComplete\) && \([\s\S]*?<PhaserArenaScreen[\s\S]*?preparing=\{screen === "sortie"\}/);
  assert.match(app, /<SortieCinematicScreen[\s\S]*?combatLoadProgress=\{combatLoadProgress\}/);
  assert.match(app, /repeatSortie=\{repeatSortie\}/);
  assert.match(app, /activeSlot\?\.completedRegionIds\?\.includes\(regionId\)/);
  assert.match(app, /skipOpeningNarrative=\{repeatSortie\}/);
  assert.match(app, /onComplete=\{enterCombat\}/);
  assert.match(screens, /<video[\s\S]*?poster=\{assetSource\(posterSource\)\}[\s\S]*?autoPlay[\s\S]*?playsInline[\s\S]*?preload="metadata"/);
  assert.match(screens, /전장 불러오는 중/);
  assert.match(screens, /onEnded=\{complete\}/);
  assert.match(screens, /video\.duration - video\.currentTime <= 0\.08/);
  assert.match(screens, /onTimeUpdate=\{handleTimeUpdate\}/);
  assert.match(screens, /window\.setInterval\(\(\) => \{[\s\S]*?videoRef\.current[\s\S]*?complete\(\);[\s\S]*?\}, 100\)/);
  assert.match(
    screens,
    /if \(repeatSortie \|\| assetSource\(videoSource\)\) return undefined;[\s\S]*?window\.setTimeout\(complete, 2400\)/,
    "only a first-run no-video poster fallback may use a timeout; supplied or repeat sorties complete directly",
  );
  assert.match(screens, /if \(repeatSortie\) \{[\s\S]*complete\(\);/);
  assert.match(styles, /\.combat-runtime-shell\.is-preparing > \.expedition-game/);
  assert.match(styles, /\.combat-runtime-shell > \.sortie-cinematic/);
  assert.match(createGame, /startSuspended\?: boolean/);
  assert.match(createGame, /if \(launch\.startSuspended\) bridge\.setSuspended\(true\)/);
  assert.match(bootScene, /onLoadProgress\?\.\(value\)/);
  assert.match(bridge, /controls\.setSuspended\(this\.suspended\)/);
});

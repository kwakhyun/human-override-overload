import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("campaign UI ships the authored NIGHTJAR map and transparent three-state command button atlas", async () => {
  const [map, atlas, manifest, styles] = await Promise.all([
    stat(new URL("public/assets/overload/campaign/airship-region-map-v2.webp", root)),
    readFile(new URL("public/assets/overload/ui/buttons/command-button-states-atlas.png", root)),
    readFile(new URL("src/game/assets/manifest.ts", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
  ]);
  assert.ok(map.size > 250_000 && map.size < 700_000, "campaign map should retain detail without becoming a multi-megabyte preload");
  assert.equal(atlas.toString("ascii", 1, 4), "PNG");
  assert.equal(atlas.readUInt32BE(16), 1536);
  assert.equal(atlas.readUInt32BE(20), 160);
  assert.equal(atlas[25], 6, "button atlas must retain RGBA transparency");
  assert.match(manifest, /commandButtonStates: "\.\/assets\/overload\/ui\/buttons\/command-button-states-atlas\.png"/);
  assert.match(styles, /\.command-ui-button[\s\S]*background-size: 300% 100%/);
  assert.match(styles, /background-position: 50% 50%/);
  assert.match(styles, /background-position: 100% 50%/);
  assert.match(styles, /\.base-npc-portrait[\s\S]*background-size: 300% auto/);
  assert.match(styles, /\.region-mixed-name/);
});

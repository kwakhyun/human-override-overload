import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("campaign UI ships the authored NIGHTJAR map and lightweight CSS command buttons", async () => {
  const [map, manifest, styles] = await Promise.all([
    stat(new URL("public/assets/overload/campaign/airship-region-map-v2.webp", root)),
    readFile(new URL("src/game/assets/manifest.ts", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
  ]);
  assert.ok(map.size > 250_000 && map.size < 700_000, "campaign map should retain detail without becoming a multi-megabyte preload");
  assert.doesNotMatch(manifest, /commandButtonStates|command-button-states-atlas/);
  assert.match(styles, /\.command-ui-button[\s\S]*background: linear-gradient/);
  assert.doesNotMatch(styles, /--command-button-atlas/);
  const commandButtonCss = styles.slice(styles.indexOf(".command-ui-button"), styles.indexOf(".intro-minimal-content"));
  assert.doesNotMatch(commandButtonCss, /background-image|background-size: 300% 100%/);
  assert.match(styles, /\.base-npc-portrait > img[\s\S]*object-fit: contain/);
  assert.doesNotMatch(styles, /\.base-npc-portrait[\s\S]*background-size: 300% auto/);
  assert.match(styles, /\.region-mixed-name/);
});

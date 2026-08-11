import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const screens = await readFile(new URL("../src/ui/campaign/CampaignScreens.jsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("region hover and selection keep the authored landscape readable", () => {
  assert.match(screens, /const previewRegionId = selectedRegionId \|\| hoveredRegionId \|\| firstUnlockedId/);
  assert.match(screens, /className=\{`region-focus-background region-focus-\$\{previewRegion\?\.id\}\$\{selectedRegion \? " is-selected" : ""\}`\}/);
  assert.match(styles, /\.region-focus-background \{[\s\S]*?opacity: 0\.88;[\s\S]*?brightness\(0\.94\)/);
  assert.match(styles, /\.region-focus-background\.is-selected \{[\s\S]*?opacity: 0\.97;[\s\S]*?brightness\(0\.84\)/);
  assert.match(styles, /\.region-focus-background\.region-focus-wrong-engine-core \{[\s\S]*?opacity: 1;[\s\S]*?brightness\(1\.42\)/);
  assert.match(styles, /\.region-focus-background\.region-focus-glass-dune \{[\s\S]*?brightness\(1\.06\)/);
  assert.match(styles, /\.region-focus-background\.region-focus-abyssal-archive \{[\s\S]*?brightness\(1\.16\)/);
  assert.match(styles, /\.region-card:hover:not\(:disabled\),[\s\S]*?transform: translateY\(-9px\) scale\(1\.025\)/);
  assert.doesNotMatch(styles, /\.region-focus-background[\s\S]{0,220}brightness\(0\.5\)/);
});

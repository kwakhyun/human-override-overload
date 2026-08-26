import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const screen = fs.readFileSync(new URL("../src/ui/campaign/CampaignScreens.jsx", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../src/styles/save-profiles.css", import.meta.url), "utf8");
const entry = fs.readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");

test("save profiles use one bounded icon system for saved and new slots", () => {
  assert.match(screen, /save-slot-icon-wrapper is-saved[\s\S]*FloppyDisk weight="duotone"/);
  assert.match(screen, /save-slot-icon-wrapper is-new[\s\S]*Plus weight="regular"/);
  assert.match(styles, /\.save-slot-icon-wrapper svg \{[\s\S]*width: 28px;[\s\S]*height: 28px;/);
});

test("save profile grid has explicit desktop tablet mobile and short-window contracts", () => {
  assert.match(entry, /import "\.\/styles\/save-profiles\.css";/);
  assert.match(styles, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width: 1080px\)[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width: 1080px\)[\s\S]*\.save-slot-card:nth-child\(3\)/);
  assert.match(styles, /@media \(max-width: 720px\)[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(styles, /@media \(min-width: 900px\) and \(max-height: 760px\)/);
});

test("all profile cards share the same outer geometry and do not jump on hover", () => {
  assert.match(styles, /\.save-slot-card,[\s\S]*\.save-slot-card:first-child[\s\S]*min-height: clamp\(330px, 39vh, 390px\)/);
  assert.match(styles, /\.save-slot-card:hover,[\s\S]*transform: none;/);
});

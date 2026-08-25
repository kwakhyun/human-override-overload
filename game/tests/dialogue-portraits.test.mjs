import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { BASE_NPCS, getRegion } from "../src/game/content/campaign.js";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const readBytes = (path) => readFile(new URL(path, root));

function pngDimensions(bytes) {
  assert.equal(bytes.subarray(1, 4).toString("ascii"), "PNG");
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

test("combat dialogue reuses authored standalone portraits and exact shared atlases", async () => {
  assert.deepEqual(
    pngDimensions(await readBytes("public/assets/overload/hero/survivor-portrait.png")),
    [941, 1672],
  );
  assert.deepEqual(
    pngDimensions(await readBytes("public/assets/overload/ui/npcs/rhea-control-officer.png")),
    [640, 640],
  );
  assert.deepEqual(
    pngDimensions(await readBytes("public/assets/overload/ui/npcs/haven-npc-portraits-atlas.png")),
    [1536, 512],
  );
  assert.deepEqual(
    pngDimensions(await readBytes("public/assets/overload/ui/npcs/ilya-mechanic-v2.png")),
    [941, 1672],
  );
  assert.deepEqual(
    pngDimensions(await readBytes("public/assets/overload/ui/npcs/sera-nightjar-pilot-v2.png")),
    [842, 1869],
  );

  for (const [npcId, frameIndex] of [["hana", 0]]) {
    assert.equal(BASE_NPCS[npcId].portraitKey, "havenNpcPortraits");
    assert.equal(BASE_NPCS[npcId].portraitIndex, frameIndex);
  }
  assert.equal(BASE_NPCS.ilya.portraitMode, "standalone");
  assert.equal(BASE_NPCS.ilya.portraitKey, "ilyaPortrait");
  assert.equal(BASE_NPCS.lark.name, "SERA");
  assert.equal(BASE_NPCS.lark.portraitMode, "standalone");
  assert.equal(BASE_NPCS.lark.portraitKey, "nightjarPilot");
  assert.equal(BASE_NPCS.lark.portraitPath, "./assets/overload/ui/npcs/sera-nightjar-pilot-v2.png");

  for (const [regionId, path] of [
    ["wrong-engine-core", "public/assets/overload/boss/wrong-engine-forms-atlas.png"],
    ["glass-dune", "public/assets/overload/regions/glass-dune/boss-forms-atlas.png"],
    ["abyssal-archive", "public/assets/overload/regions/abyssal-archive/boss-forms-atlas.png"],
  ]) {
    assert.deepEqual(pngDimensions(await readBytes(path)), [1536, 512]);
    assert.equal(getRegion(regionId).assets.dom.bossPortrait.path, `./assets/overload/${path.split("assets/overload/")[1]}`);
  }
});

test("the active narrative panel resolves the actual speaker without misleading squad fallbacks", async () => {
  const app = await read("src/App.jsx");
  const styles = await read("src/styles.css");
  const screens = await read("src/ui/campaign/CampaignScreens.jsx");
  const mapping = app.slice(
    app.indexOf("const NARRATIVE_STANDALONE_PORTRAITS"),
    app.indexOf("const CATEGORY_META"),
  );

  assert.match(mapping, /AEGIS:[\s\S]*?assetKey: "portrait"[\s\S]*?variant: "hero"/);
  assert.match(mapping, /OPERATOR:[\s\S]*?assetKey: "rheaControlOfficer"[\s\S]*?variant: "operator"/);
  assert.match(mapping, /RHEA:[\s\S]*?assetKey: "rheaControlOfficer"[\s\S]*?variant: "operator"/);
  assert.match(mapping, /HANA: "hana"/);
  assert.match(mapping, /ILYA: "ilya"/);
  assert.match(mapping, /LARK: "lark"/);
  assert.match(mapping, /"THE WRONG ENGINE": "wrong-engine-core"/);
  assert.match(mapping, /"MIRROR TYRANT": "glass-dune"/);
  assert.match(mapping, /"DROWNED ORACLE": "abyssal-archive"/);
  assert.doesNotMatch(mapping, /\b(?:ROOK|NYX|MOSS)\b/);

  assert.match(mapping, /bossRegion\?\.assets\?\.dom\?\.bossPortrait\?\.path/);
  assert.match(mapping, /frameIndex: Math\.max\(0, Math\.min\(2/);
  assert.doesNotMatch(mapping, /new Image\(|Promise\.all/);
  assert.match(app, /<NarrativePortrait portrait=\{portrait\} \/>/);
  assert.match(app, /<NarrativePanel dialogue=\{dialogue\} assets=\{assets\} region=\{region\} bossStage=\{hud\?\.boss\?\.stage\}/);

  assert.match(styles, /\.narrative-portrait-frame\s*\{[\s\S]*?aspect-ratio: 1;[\s\S]*?background-position: var\(--portrait-frame-position, 0%\) center;[\s\S]*?background-size: 300% 100%;/);
  assert.match(styles, /\.narrative-portrait\.is-operator img\s*\{[\s\S]*?height: 112%;/);
  assert.match(styles, /\.narrative-portrait\.is-hostile \.narrative-portrait-frame\s*\{[\s\S]*?height: 92%;/);
  assert.match(screens, /backgroundPosition: standalone \? "center bottom" : `\$\{\(npc\.portraitIndex \|\| 0\) \* 50\}% center`/);
});

import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

import { BASE_NPCS, getRegion } from "../src/game/content/campaign.js";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const readBytes = (path) => readFile(new URL(path, root));

function pngDimensions(bytes) {
  assert.equal(bytes.subarray(1, 4).toString("ascii"), "PNG");
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

test("combat dialogue uses independent optimized portraits while bosses retain authored atlases", async () => {
  const portraitPaths = [
    "./assets/overload/hero/survivor-portrait-v2.webp",
    "./assets/overload/hero/mika-portrait-v2.webp",
    "./assets/overload/hero/vesper-portrait-v7.webp",
    ...["hana", "ilya", "lark", "rhea"].map((npcId) => BASE_NPCS[npcId].portraitPath),
  ];
  assert.equal(new Set(portraitPaths).size, portraitPaths.length);
  for (const portraitPath of portraitPaths) {
    const filePath = `public/${portraitPath.replace(/^\.\//, "")}`;
    const [bytes, metadata] = await Promise.all([readBytes(filePath), stat(new URL(filePath, root))]);
    assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP");
    assert.ok(metadata.size < 400_000, `${portraitPath} should remain display-size optimized`);
  }
  await assert.rejects(access(new URL("public/assets/overload/ui/npcs/haven-npc-portraits-atlas.png", root)));

  assert.equal(BASE_NPCS.hana.portraitMode, "standalone");
  assert.equal(BASE_NPCS.hana.portraitKey, "hanaPortrait");
  assert.equal(BASE_NPCS.ilya.portraitMode, "standalone");
  assert.equal(BASE_NPCS.ilya.portraitKey, "ilyaPortrait");
  assert.equal(BASE_NPCS.lark.name, "SERA");
  assert.equal(BASE_NPCS.lark.portraitMode, "standalone");
  assert.equal(BASE_NPCS.lark.portraitKey, "nightjarPilot");
  assert.equal(BASE_NPCS.lark.portraitPath, "./assets/overload/ui/npcs/sera-nightjar-pilot-v4.webp");

  for (const [regionId, path] of [
    ["wrong-engine-core", "public/assets/overload/boss/wrong-engine-forms-atlas.png"],
    ["glass-dune", "public/assets/overload/regions/glass-dune/boss-forms-atlas.png"],
    ["abyssal-archive", "public/assets/overload/regions/abyssal-archive/boss-forms-atlas.png"],
  ]) {
    assert.deepEqual(pngDimensions(await readBytes(path)), [1536, 512]);
    assert.equal(getRegion(regionId).assets.dom.bossPortrait.path, `./assets/overload/${path.split("assets/overload/")[1]}`);
  }
});

test("NPC portrait build preserves ILYA headroom and normalizes SERA to an upper-body crop", async () => {
  const buildScript = await read("scripts/build-runtime-portraits.py");
  const tacticalStyles = await read("src/styles/tactical-os.css");

  assert.match(
    buildScript,
    /ilya-upper-v4-chroma\.png"\s*,\s*"ilya-mechanic-v4\.webp"\s*,\s*42\s*,\s*12\s*,\s*0\.0/,
  );
  assert.match(
    buildScript,
    /sera-upper-v4-chroma\.png"\s*,\s*"sera-nightjar-pilot-v4\.webp"\s*,\s*20\s*,\s*16\s*,\s*0\.12/,
  );
  assert.match(buildScript, /trim_bottom_ratio/);
  assert.doesNotMatch(
    tacticalStyles,
    /\.campaign-shell \.base-npc-portrait\.is-ilya > img\s*\{/,
  );
  assert.match(
    tacticalStyles,
    /\.campaign-shell \.base-npc-portrait > img\s*\{[\s\S]*?object-position: center bottom;[\s\S]*?transform: none;/,
  );
});

test("the active narrative panel resolves the actual speaker without misleading squad fallbacks", async () => {
  const app = await read("src/App.jsx");
  const combatPresentation = await read("src/ui/combat/combatPresentation.js");
  const styles = await read("src/styles.css");
  const screens = await read("src/ui/campaign/CampaignScreens.jsx");
  const mapping = combatPresentation.slice(
    combatPresentation.indexOf("const NARRATIVE_STANDALONE_PORTRAITS"),
    combatPresentation.indexOf("export function resolveEventSound"),
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
  assert.match(mapping, /const frameIndex = Math\.max\(0, Math\.min\(2/);
  assert.doesNotMatch(mapping, /new Image\(|Promise\.all/);
  assert.match(app, /<NarrativePortrait portrait=\{portrait\} \/>/);
  assert.match(app, /<NarrativePanel dialogue=\{dialogue\} assets=\{assets\} region=\{region\} bossStage=\{hud\?\.boss\?\.stage\}/);

  assert.match(styles, /\.narrative-portrait-frame\s*\{[\s\S]*?aspect-ratio: 1;[\s\S]*?background-position: var\(--portrait-frame-position, 0%\) center;[\s\S]*?background-size: 300% 100%;/);
  assert.match(styles, /\.narrative-portrait\.is-operator img\s*\{[\s\S]*?height: 112%;/);
  assert.match(styles, /\.narrative-portrait\.is-hostile \.narrative-portrait-frame\s*\{[\s\S]*?height: 92%;/);
  assert.match(screens, /className=\{`base-npc-portrait is-standalone is-\$\{npc\.id\}`\}/);
  assert.match(screens, /<NpcPortraitImage source=\{portrait\} npcId=\{npc.id\}/);
  assert.doesNotMatch(screens, /npc\.portraitIndex|assets\?\.npcPortraits/);
});

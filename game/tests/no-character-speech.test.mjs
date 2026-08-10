import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourceRoot = fileURLToPath(new URL("../src/", import.meta.url));

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(entryPath);
    return /\.(?:js|jsx|ts|tsx)$/.test(entry.name) ? [entryPath] : [];
  }));
  return nested.flat();
}

test("active source has no character TTS or Web Speech runtime contract", async () => {
  const files = await collectSourceFiles(sourceRoot);
  const forbidden = [
    /characterTts/i,
    /createCharacterTts/,
    /speechSynthesis/,
    /SpeechSynthesisUtterance/,
    /onNarration/,
  ];

  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const pattern of forbidden) {
      assert.doesNotMatch(source, pattern, `${path.relative(sourceRoot, file)} still contains ${pattern}`);
    }
  }
});

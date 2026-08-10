import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("Korean-first UI uses the network-free system stack and Latin-only bundled subsets", async () => {
  const [main, styles] = await Promise.all([
    readFile(new URL("src/main.jsx", root), "utf8"),
    readFile(new URL("src/styles.css", root), "utf8"),
  ]);

  for (const source of [
    "@fontsource/rajdhani/latin-500.css",
    "@fontsource/rajdhani/latin-600.css",
    "@fontsource/rajdhani/latin-700.css",
    "@fontsource/ibm-plex-mono/latin-400.css",
    "@fontsource/ibm-plex-mono/latin-600.css",
  ]) {
    assert.ok(main.includes(`import \"${source}\";`), `${source} should be imported explicitly`);
  }
  assert.doesNotMatch(main, /@fontsource\/(?:rajdhani|ibm-plex-mono)\/(?:400|500|600|700)\.css/);

  assert.match(styles, /--font-ui:\s*"Pretendard Variable", Pretendard, "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", "맑은 고딕", system-ui/);
  assert.match(styles, /--font-brand:\s*"Rajdhani", var\(--font-ui\)/);
  assert.match(styles, /--font-mono:\s*"IBM Plex Mono"/);
  assert.match(styles, /:root \{[\s\S]*?font-family:\s*var\(--font-ui\)/);
  assert.match(styles, /body \{[\s\S]*?font-family:\s*var\(--font-ui\)/);
  assert.doesNotMatch(styles, /font-family:\s*"IBM Plex Mono"/);
});

test("Korean combat, campaign, dialogue, and guide copy avoid Latin display faces", async () => {
  const styles = await readFile(new URL("src/styles.css", root), "utf8");
  const contractStart = styles.indexOf("/* Korean-first typography");
  const monoStart = styles.indexOf("\nkbd,", contractStart);
  const koreanContract = styles.slice(contractStart, monoStart);

  assert.ok(contractStart >= 0 && monoStart > contractStart, "Korean and mono type contracts should be explicit");
  for (const selector of [
    ".route-objective",
    ".expedition-combat-dock",
    ".gate-locked-notice",
    ".narrative-copy",
    ".base-dialogue",
    ".ability-guide-copy",
    ".combat-tutorial-copy",
    ".reward-kicker",
  ]) {
    assert.ok(koreanContract.includes(selector), `${selector} should be covered by the Korean type contract`);
  }
  assert.match(koreanContract, /font-family:\s*var\(--font-ui\)/);
  assert.doesNotMatch(koreanContract, /font-family:\s*var\(--font-mono\)/);
  assert.match(koreanContract, /letter-spacing:\s*0\.01em/);
  assert.match(koreanContract, /word-break:\s*keep-all/);
  assert.match(koreanContract, /overflow-wrap:\s*anywhere/);
  assert.match(styles, /kbd,[\s\S]*font-family:\s*var\(--font-mono\)/);
  assert.match(styles, /\.intro-minimal-content h1[\s\S]*font-family:\s*var\(--font-brand\)/);
});

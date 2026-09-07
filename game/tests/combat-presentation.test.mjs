import assert from "node:assert/strict";
import test from "node:test";

import {
  localizeBossName,
  localizeObjective,
  localizeSpeakerName,
  resolveEventSound,
  resolveNarrativePortrait,
} from "../src/ui/combat/combatPresentation.js";

test("combat presentation localizes authored HUD identifiers without touching simulation state", () => {
  assert.equal(localizeBossName("MIRROR TYRANT"), "거울 폭군 · MIRROR TYRANT");
  assert.equal(localizeSpeakerName("LARK"), "세라");
  assert.equal(
    localizeObjective("PURGE ALL HOSTILES", { enemiesRemaining: 3, expedition: {} }),
    "현재 공세의 적 3기 전멸",
  );
  assert.equal(
    localizeObjective("ADVANCE", { expedition: { clearTransition: { phase: "panic" } } }),
    "소버린 비상 신호 · 보스 추론핵 추격",
  );
});

test("combat presentation resolves character portraits and event sounds from declarative mappings", () => {
  assert.deepEqual(
    resolveNarrativePortrait("MIKA", { mikaPortrait: { src: "/mika.webp" } }, null, 1),
    {
      assetKey: "mikaPortrait",
      variant: "mika",
      alt: "미카 상반신 일러스트",
      source: "/mika.webp",
      mode: "standalone",
    },
  );
  assert.equal(resolveEventSound({ type: "shot", kind: "vesperVectorNeedle" }), "rail");
  assert.equal(resolveEventSound({ type: "bossPatternFire", pattern: "depthCollapse" }), "emp");
});

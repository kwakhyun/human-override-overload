import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const view = await readFile(new URL("../src/phaser/view/BattleView.ts", import.meta.url), "utf8");

test("combat feedback layers stay renderer-owned and quality bounded", () => {
  assert.match(view, /private shakeImpact\(duration: number, intensity: number, minimumGap = 70\)/);
  assert.match(view, /now - this\.lastImpactShakeAt < minimumGap/);
  assert.match(view, /type === "empPulseActivated"/);
  assert.match(view, /type === "skillAttack" \|\| type === "masterAttack"/);
  assert.match(view, /type === "ultimateImpact" \|\| type === "explosion"/);
  assert.match(view, /const hitDamage = record \? Math\.max\(0, record\.lastHp - hp\) : 0/);
  assert.match(view, /const impactScale = clamp/);
  assert.match(view, /const trailLength = projectileKind\.includes\("rail"\)/);
  assert.match(view, /const fxCap = this\.currentQualityId === "performance" \? 36/);
});

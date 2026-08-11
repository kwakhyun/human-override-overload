import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const battleView = await readFile(new URL("../src/phaser/view/BattleView.ts", import.meta.url), "utf8");

test("player and hostile rounds keep readable combat-scale silhouettes", () => {
  assert.match(battleView, /width: type\.includes\("overdrive"\) \? 88 : 72/);
  assert.match(battleView, /height: type\.includes\("overdrive"\) \? 32 : 28/);
  assert.match(battleView, /setDisplaySize\(sniper \? 154 : 68, sniper \? 34 : 24\)/);
  assert.match(battleView, /lineStyle\(projectileKind\.includes\("rail"\) \? 5\.5 : 3\.5/);
  assert.match(battleView, /lineStyle\(3\.5, COLORS\.red, 0\.34\)/);
});

test("incoming enemy rounds are still never stride sampled", () => {
  assert.match(battleView, /const enemySpriteCap = 360/);
  assert.doesNotMatch(battleView, /enemyProjectiles\.length\s*\/\s*enemySpriteCap/);
});

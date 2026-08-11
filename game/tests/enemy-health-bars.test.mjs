import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const battleViewPath = new URL("../src/phaser/view/BattleView.ts", import.meta.url);

test("enemy health bars stay conditional, bounded, and batched", async () => {
  const source = await readFile(battleViewPath, "utf8");
  const method = source.slice(
    source.indexOf("private drawEnemyHealthBars"),
    source.indexOf("private syncAllies"),
  );

  assert.match(source, /ENEMY_HEALTH_BAR_HOLD_MS = 2000/);
  assert.match(source, /cinematic:\s*30[\s\S]*balanced:\s*24[\s\S]*performance:\s*18/);
  assert.match(source, /enemyHealthBarScratch:[\s\S]*Array\.from/);
  assert.match(source, /enemyHealthGraphics = scene\.add\.graphics\(\)/);
  assert.match(source, /worldFront\.add\(\[this\.projectileGraphics, this\.impactGraphics, this\.enemyHealthGraphics/);
  assert.match(method, /recentlyDamaged/);
  assert.match(method, /aimTargeted/);
  assert.match(method, /sniperEngaged/);
  assert.match(method, /suicideDanger/);
  assert.match(method, /disabledTimer/);
  assert.match(method, /record\?\.image\.visible/);
  assert.doesNotMatch(method, /scene\.add\.(?:graphics|rectangle|text|image)/);
  assert.doesNotMatch(method, /\.sort\(/);
});

test("enemy sprite records retain the renderer-only two-second damage window", async () => {
  const source = await readFile(battleViewPath, "utf8");
  assert.match(source, /healthBarUntil:\s*number/);
  assert.match(source, /lastHp:\s*number/);
  assert.match(source, /hp < record\.lastHp - 0\.01/);
  assert.match(source, /record\.healthBarUntil = this\.scene\.time\.now \+ ENEMY_HEALTH_BAR_HOLD_MS/);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const engineSource = await readFile(new URL("../src/swarm/engine.js", import.meta.url), "utf8");
const battleViewSource = await readFile(new URL("../src/phaser/view/BattleView.ts", import.meta.url), "utf8");
const appSource = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");

test("suicide arming and blast resolution remain simulation-owned", () => {
  assert.match(engineSource, /selfDestructArmed: false/);
  assert.match(engineSource, /emit\(state, "enemySelfDestructArmed"/);
  assert.match(engineSource, /function detonateSuicideDrone\(state, enemy, player\)/);
  assert.match(engineSource, /caughtInBlast/);
  assert.match(engineSource, /enemy\.vx = 0;\s*enemy\.vy = 0;[\s\S]*?enemy\.selfDestructTimer/);
});

test("Phaser presents the arming state without owning its countdown", () => {
  assert.match(battleViewSource, /const selfDestructFlash = selfDestructArmed/);
  assert.match(battleViewSource, /finite\(enemy\?\.selfDestructBlastRadius, 210\)/);
  assert.match(battleViewSource, /graphics\.strokeCircle\(x, y, radius\)/);
  assert.match(appSource, /enemySelfDestructArmed: "enemyAlert"/);
});

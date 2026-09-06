import test from "node:test";
import assert from "node:assert/strict";
import { resolveActorFacing } from "../src/phaser/view/animation/actorFacing.ts";

test("grounded enemies and all bosses retain feet-down artwork at every aim angle", () => {
  for (let angle = -Math.PI; angle <= Math.PI; angle += Math.PI / 8) {
    for (const combatRole of ["rifleman", "sniper", "siegeWalker"]) {
      assert.equal(resolveActorFacing("enemy", { combatRole, angle }).rotation, 0);
    }
    for (const visualSet of ["neon-foundry", "storm-spire", "gene-vault"]) {
      assert.equal(resolveActorFacing("enemy", { visualSet, isMidBoss: true, angle }).rotation, 0);
    }
    assert.deepEqual(resolveActorFacing("boss", { angle }), { rotation: 0, flipX: false });
  }
});

test("flight follows heading while gun carriers only mirror horizontally", () => {
  assert.equal(resolveActorFacing("enemy", { combatRole: "suicideDrone", angle: 1 }).rotation, 1);
  assert.equal(resolveActorFacing("enemy", { visualSet: "storm-spire", angle: -Math.PI / 2 }).rotation, 0);
  assert.equal(resolveActorFacing("enemy", { combatRole: "rifleman", angle: Math.PI }).flipX, true);
  assert.equal(resolveActorFacing("enemy", { combatRole: "siegeWalker", angle: Math.PI }).flipX, false);
  assert.equal(resolveActorFacing("ally", { type: "gunner", angle: Math.PI }).rotation, 0);
});

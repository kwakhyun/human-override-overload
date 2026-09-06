import assert from 'node:assert/strict';
import test from 'node:test';
import { cooldownPresentation, formatCooldown } from '../src/ui/combat/cooldownPresentation.js';

test('cooldowns never display zero or readiness before the engine timer reaches zero', () => {
  for (const [remaining, text] of [[18.01,'19'], [10,'10'], [9.99,'10.0'], [5.11,'5.2'], [0.049,'0.1'], [0.001,'0.1']]) {
    assert.equal(formatCooldown(remaining), text);
    const ui = cooldownPresentation({ remaining, cooldownMax: 18, ready: true, available: false });
    assert.equal(ui.state, 'cooling');
    assert.equal(ui.ready, false);
    assert.notEqual(ui.status, '대상 없음');
  }
  assert.equal(cooldownPresentation({remaining: 0}).state, 'ready');
});

test('locked, incapacitated and target-required actions stay distinct from recharge', () => {
  assert.equal(cooldownPresentation({locked: true, available: false}).status, '잠김');
  assert.equal(cooldownPresentation({blocked: true, available: false}).status, '행동 불가');
  assert.equal(cooldownPresentation({available: false}).status, '대상 없음');
  assert.equal(cooldownPresentation({ready: false}).state, 'waiting');
  assert.equal(cooldownPresentation({remaining: 4, cooldownMax: 8}).meter, .5);
  assert.equal(cooldownPresentation({remaining: 0, locked: true}).meter, 0);
  assert.equal(cooldownPresentation({remaining: 30, cooldownMax: 8}).meter, 0);
  // A reset / tag snapshot must be displayed immediately, without local interpolation.
  assert.equal(cooldownPresentation({remaining: 0, cooldownMax: 8}).meter, 1);
  assert.equal(cooldownPresentation({remaining: 8, cooldownMax: 8}).meter, 0);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveSortieRoster } from '../src/game/content/sortieFormation.js';
import { createSwarmState, createSwarmInput, stepSwarm, drainSwarmEvents, getSwarmHud } from '../src/swarm/engine.js';

const unlocked = { mikaUnlocked: true, vesperUnlocked: true, noxUnlocked: true };
const ids = ['aegis', 'mika', 'vesper', 'nox'];

test('explicit sortie parties reject locked, duplicate and extra characters', () => {
  assert.deepEqual(resolveSortieRoster({ ...unlocked, characterId: 'nox', partyCharacterIds: ['nox', 'mika', 'vesper', 'aegis'] }), ['nox', 'mika']);
  assert.deepEqual(resolveSortieRoster({ characterId: 'vesper', partyCharacterIds: ['vesper', 'nox', 'aegis', 'aegis'] }), ['aegis']);
  assert.deepEqual(resolveSortieRoster({ ...unlocked, partyCharacterIds: [] }), ['aegis']);
  assert.deepEqual(resolveSortieRoster({ ...unlocked, characterId: 'mika', partyCharacterIds: ['mika', 'mika', 'unknown'] }), ['mika']);
});

test('every selected pair alternates exclusively, retaining cooldown and actor skill banks', () => {
  for (const lead of ids) for (const reserve of ids.filter(id => id !== lead)) {
    const state = createSwarmState({ ...unlocked, characterId: lead, partyCharacterIds: [lead, reserve], random: () => .5, expedition: true });
    state.enemies = []; state.player.invulnerability = 999;
    const input = createSwarmInput(); input.tagPressed = true;
    for (let i = 0; i < 6; i++) {
      state.player.tagCooldown = 0;
      stepSwarm(state, input, 1 / 60);
      assert.equal(state.player.characterId, i % 2 === 0 ? reserve : lead);
      assert.equal(state.player.reserveCharacterId, i % 2 === 0 ? lead : reserve);
      assert.equal(state.manualAbilities, state.manualAbilityBanks[state.player.characterId]);
      const current = state.player.characterId;
      stepSwarm(state, input, 1 / 60);
      assert.equal(state.player.characterId, current, 'cooldown must reject a second immediate tag');
    }
    assert.deepEqual(state.player.tagRoster, [lead, reserve]);
  }
});

test('solo sorties cannot tag even when every other operative is unlocked', () => {
  for (const characterId of ids) {
    const state = createSwarmState({ ...unlocked, characterId, partyCharacterIds: [characterId] });
    drainSwarmEvents(state);
    const input = createSwarmInput(); input.tagPressed = true;
    stepSwarm(state, input, 1 / 60);
    assert.equal(state.player.characterId, characterId);
    assert.equal(state.player.reserveCharacterId, null);
    assert.equal(getSwarmHud(state).player.tagReady, false);
    assert.ok(!drainSwarmEvents(state).some(event => event.type === 'characterTagged'));
  }
});

export const MAX_SORTIE_CHARACTERS = 2;

export function defaultSortieParty(characterId, availableIds = []) {
  const ids = [...new Set(availableIds)];
  const lead = ids.includes(characterId) ? characterId : ids[0];
  return lead ? [lead, ...ids.filter(id => id !== lead)].slice(0, MAX_SORTIE_CHARACTERS) : [];
}

// The same allow-list drives simulation and texture loading. Unlocks alone
// never add a third operative to an explicitly selected sortie.
export function resolveSortieRoster({ characterId = 'aegis', partyCharacterIds = /** @type {readonly string[] | undefined} */ (undefined),
  mikaUnlocked = false, vesperUnlocked = false, noxUnlocked = false } = {}) {
  const unlocked = ['aegis', ...(mikaUnlocked ? ['mika'] : []),
    ...(vesperUnlocked ? ['vesper'] : []), ...(noxUnlocked ? ['nox'] : [])];
  const lead = unlocked.includes(characterId) ? characterId : 'aegis';
  const requested = Array.isArray(partyCharacterIds) ? partyCharacterIds : unlocked;
  return [...new Set([lead, ...requested.filter(id => unlocked.includes(id))])].slice(0, MAX_SORTIE_CHARACTERS);
}

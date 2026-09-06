import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getPlayableCharacter, getPlayableCharacters, isCharacterUnlocked } from "../src/game/content/characters.js";
import { getCharacterSkillLoadout } from "../src/game/content/characterSkills.js";
import {
  createSwarmInput,
  createSwarmState,
  drainSwarmEvents,
  setSwarmAim,
  stepSwarm,
  NOX_MANUAL_ACTIVE_ABILITIES,
} from "../src/swarm/engine.js";

test("NOX remains previewable and unlocks after the Neon Foundry first clear", () => {
  const nox = getPlayableCharacter("nox");
  assert.equal(nox.name, "NOX");
  assert.equal(nox.unlockRegionId, "neon-foundry");
  assert.equal(nox.portraitAssetKey, "noxPortrait");
  assert.ok(getPlayableCharacters().some((character) => character.id === "nox"));
  assert.equal(isCharacterUnlocked("nox", ["wrong-engine-core", "glass-dune", "abyssal-archive"]), false);
  assert.equal(isCharacterUnlocked("nox", ["wrong-engine-core", "glass-dune", "abyssal-archive", "neon-foundry"]), true);
});

test("NOX launch gating and combat identity are authoritative in the simulation", () => {
  const locked = createSwarmState({ characterId: "nox", noxUnlocked: false });
  assert.equal(locked.player.characterId, "aegis");

  const unlocked = createSwarmState({
    characterId: "nox",
    noxUnlocked: true,
    mikaUnlocked: true,
    vesperUnlocked: true,
  });
  assert.equal(unlocked.player.characterId, "nox");
  assert.equal(unlocked.player.name, "NOX");
  assert.equal(unlocked.player.mainWeaponId, "pulse-rifle");
  assert.deepEqual(unlocked.player.tagRoster, ["nox", "aegis"]);
  assert.equal(unlocked.player.reserveCharacterId, "aegis");
  assert.equal(unlocked.player.maxHp, 338);
  assert.equal(unlocked.player.speed, 245 * 1.06);
  assert.equal(unlocked.player.fireRateMultiplier, 1.03);
  assert.equal(unlocked.player.weaponDamageMultiplier, 1.11);
  assert.equal(unlocked.manualAbilities, unlocked.manualAbilityBanks.nox);
});

test("NOX Q/E/F/R content and runtime effects share one progression contract", () => {
  const loadout = getCharacterSkillLoadout("nox");
  assert.deepEqual(
    loadout.skills.map(({ slot, runtimeKey, name }) => ({ slot, runtimeKey, name })),
    Object.entries(NOX_MANUAL_ACTIVE_ABILITIES).map(([runtimeKey, ability]) => ({
      slot: ability.key,
      runtimeKey,
      name: ability.name,
    })),
  );

  const bindings = [
    ["empPulsePressed", "censorGrid", (state) => state.shockwaves.some((effect) => effect.type === "censorGrid")],
    ["aegisWardPressed", "nullAppeal", (state) => state.player.shield > 0 && state.player.invulnerability > 0],
    ["stratosRunPressed", "redWarrant", (state) => state.swordManualAbilities.some((effect) => effect.type === "redWarrant" && effect.atlas === "nox")],
    ["helixTempestPressed", "finalDecree", (state) => state.shockwaves.some((effect) => effect.type === "finalDecree")],
  ];
  for (const [inputField, abilityId, hasDistinctEffect] of bindings) {
    const state = createSwarmState({
      random: () => 0.5,
      duration: 999,
      characterId: "nox",
      noxUnlocked: true,
      characterSkillRanks: { nox: 3 },
    });
    state.phase = "boss";
    state.boss.active = true;
    state.boss.dead = false;
    setSwarmAim(state, state.boss.x, state.boss.y);
    const input = createSwarmInput();
    input[inputField] = true;
    stepSwarm(state, input, 1 / 60);
    const events = drainSwarmEvents(state);
    assert.ok(events.some((event) => event.type === "noxManualAbility" && event.ability === abilityId));
    assert.ok(events.some((event) => event.type === "manualAbilityActivated" && event.ability === abilityId));
    assert.ok(hasDistinctEffect(state), `${abilityId} must leave its NOX-specific simulation effect`);
  }
});

test("NOX basic fire uses a unique warrant thread instead of AEGIS pulse fire", () => {
  const state = createSwarmState({
    random: () => 0.5,
    duration: 999,
    expedition: true,
    characterId: "nox",
    noxUnlocked: true,
  });
  const input = createSwarmInput();
  setSwarmAim(state, state.player.x + 900, state.player.y);
  drainSwarmEvents(state);

  stepSwarm(state, input, 1 / 60);
  const warrant = state.projectiles.find((projectile) => projectile.kind === "noxWarrantThread");
  assert.ok(warrant);
  assert.equal(state.projectiles.some((projectile) => projectile.kind === "pulse"), false);
  assert.equal(warrant.color, "#ff455d");
  assert.ok(Object.prototype.hasOwnProperty.call(warrant, "warrantTargetId"));
  assert.ok(Number.isFinite(state.player.fireTimers.warrant) && state.player.fireTimers.warrant > 0);
  const events = drainSwarmEvents(state);
  assert.ok(events.some((event) => event.type === "noxWarrantAttack"));
});

test("NOX ships dedicated portrait, sprite, skill VFX, recruitment, and HUD integration", async () => {
  const [manifest, battleView, app, screens, dialogue] = await Promise.all([
    readFile(new URL("../src/game/assets/manifest.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/phaser/view/BattleView.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/ui/campaign/CampaignScreens.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/game/content/characterDialogue.js", import.meta.url), "utf8"),
  ]);
  assert.match(manifest, /noxPortrait: "\.\/assets\/overload\/hero\/nox-portrait-v1\.webp"/);
  assert.match(manifest, /path: "\.\/assets\/overload\/quality-v3\/nox-operative\.png"/);
  assert.match(manifest, /path: "\.\/assets\/overload\/quality-v3\/nox-skills\.png"/);
  assert.match(battleView, /characterId === "nox"/);
  assert.match(battleView, /projectileKind\.includes\("noxwarrant"\)/);
  assert.match(app, /NoxRecruitScreen/);
  assert.match(app, /noxUnlocked/);
  assert.match(screens, /NOX_RECRUIT_DIALOGUE/);
  assert.match(dialogue, /characterId === "nox"/);
});

test("NOX asset contract declares the authored top-down 8-direction order", async () => {
  const contract = JSON.parse(
    await readFile(new URL("../docs/project/operatives/nox-character-contract.json", import.meta.url), "utf8"),
  );
  assert.equal(contract.assets.directionalAtlasLayout.camera, "top-down-three-quarter");
  assert.deepEqual(contract.assets.directionalAtlasLayout.directionOrder, [
    "south",
    "southeast",
    "east",
    "northeast",
    "north",
    "northwest",
    "west",
    "southwest",
  ]);
  assert.deepEqual(contract.assets.directionalAtlasLayout.columnPhases, [
    "locomotion-1",
    "locomotion-2",
    "locomotion-3",
    "locomotion-4",
    "attack-anticipation",
    "attack-release",
    "attack-follow-through",
    "attack-recovery",
  ]);
});

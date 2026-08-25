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
  VESPER_MANUAL_ACTIVE_ABILITIES,
} from "../src/swarm/engine.js";

test("VESPER remains previewable but unlocks only after clearing Abyssal Archive", () => {
  const vesper = getPlayableCharacter("vesper");
  assert.equal(vesper.koreanName, "베스퍼");
  assert.equal(vesper.unlockRegionId, "abyssal-archive");
  assert.equal(vesper.portraitAssetKey, "vesperPortrait");
  assert.ok(getPlayableCharacters().some((character) => character.id === "vesper"));
  assert.equal(isCharacterUnlocked("vesper", ["wrong-engine-core", "glass-dune"]), false);
  assert.equal(isCharacterUnlocked("vesper", ["wrong-engine-core", "glass-dune", "abyssal-archive"]), true);
});

test("VESPER launch gating and combat identity are authoritative in the simulation", () => {
  const locked = createSwarmState({ characterId: "vesper", vesperUnlocked: false, mikaUnlocked: true });
  assert.equal(locked.player.characterId, "aegis");

  const unlocked = createSwarmState({ characterId: "vesper", vesperUnlocked: true, mikaUnlocked: true });
  assert.equal(unlocked.player.characterId, "vesper");
  assert.equal(unlocked.player.name, "VESPER");
  assert.equal(unlocked.player.mainWeaponId, "pulse-rifle");
  assert.equal(unlocked.player.reserveCharacterId, "mika");
  assert.equal(unlocked.player.maxHp, 320);
  assert.equal(unlocked.player.speed, 245 * 1.12);
  assert.equal(unlocked.player.fireRateMultiplier, 1.08);
  assert.equal(unlocked.player.weaponDamageMultiplier, 1.16);
  assert.equal(unlocked.manualAbilities, unlocked.manualAbilityBanks.vesper);
  assert.equal(VESPER_MANUAL_ACTIVE_ABILITIES.empPulse.nameKo, "벡터 스텝");
  assert.equal(VESPER_MANUAL_ACTIVE_ABILITIES.helixTempest.id, "deadline");
});

test("VESPER Q/E/F/R names and runtime effects share one progression contract", () => {
  const loadout = getCharacterSkillLoadout("vesper");
  assert.deepEqual(
    loadout.skills.map(({ slot, runtimeKey, name, koreanName }) => ({ slot, runtimeKey, name, koreanName })),
    Object.entries(VESPER_MANUAL_ACTIVE_ABILITIES).map(([runtimeKey, ability]) => ({
      slot: ability.key,
      runtimeKey,
      name: ability.name,
      koreanName: ability.nameKo,
    })),
  );

  const bindings = [
    ["empPulsePressed", "vectorStep", (state) => state.player.invulnerability > 0 && state.swordManualAbilities.some((effect) => effect.atlas === "vesper")],
    ["aegisWardPressed", "zeroMark", (state) => state.empPulses.some((effect) => effect.type === "zeroMark")],
    ["stratosRunPressed", "railBurst", (state) => state.stratosRuns.some((lane) => lane.source === "railBurst")],
    ["helixTempestPressed", "deadline", (state) => state.shockwaves.some((effect) => effect.type === "deadline")],
  ];
  for (const [inputField, abilityId, hasDistinctEffect] of bindings) {
    const state = createSwarmState({
      random: () => 0.5,
      duration: 999,
      characterId: "vesper",
      vesperUnlocked: true,
      characterSkillRanks: { vesper: 3 },
    });
    if (abilityId === "deadline") {
      state.phase = "boss";
      state.boss.active = true;
      state.boss.dead = false;
    }
    const input = createSwarmInput();
    input[inputField] = true;
    stepSwarm(state, input, 1 / 60);
    const events = drainSwarmEvents(state);
    assert.ok(events.some((event) => event.type === "vesperManualAbility" && event.ability === abilityId));
    assert.ok(events.some((event) => event.type === "manualAbilityActivated" && event.ability === abilityId));
    assert.ok(hasDistinctEffect(state), `${abilityId} must leave its VESPER-specific simulation effect`);
  }
});

test("VESPER basic fire uses its own twin vector needles and periodic piercing lock lance", () => {
  const state = createSwarmState({
    random: () => 0.5,
    duration: 999,
    expedition: true,
    characterId: "vesper",
    vesperUnlocked: true,
  });
  const input = createSwarmInput();
  setSwarmAim(state, state.player.x + 900, state.player.y);
  drainSwarmEvents(state);

  stepSwarm(state, input, 1 / 60);
  const baselineNeedles = state.projectiles.filter((projectile) => projectile.kind === "vesperVectorNeedle");
  assert.equal(baselineNeedles.length, 2);
  assert.equal(state.projectiles.some((projectile) => projectile.kind === "pulse"), false);
  assert.ok(baselineNeedles[0].y < baselineNeedles[1].y, "the twin firing lanes must remain visually separate");
  assert.ok(baselineNeedles.every((projectile) => projectile.pierce === 1));
  assert.ok(baselineNeedles.every((projectile) => Math.abs(Math.hypot(projectile.vx, projectile.vy) - 1104) < 0.0001));
  assert.ok(Number.isFinite(state.player.fireTimers.vector) && state.player.fireTimers.vector > 0);
  let events = drainSwarmEvents(state);
  assert.ok(events.some((event) => event.type === "vesperNeedleAttack" && event.count === 2 && event.lockLance === false));

  for (let volley = 0; volley < 3; volley += 1) {
    state.player.fireTimers.vector = 0;
    stepSwarm(state, input, 1 / 60);
    events = drainSwarmEvents(state);
  }
  assert.ok(events.some((event) => event.type === "vesperNeedleAttack" && event.lockLance === true));
  const lockLance = state.projectiles.find((projectile) => projectile.kind === "vesperLockLance");
  assert.ok(lockLance);
  assert.equal(lockLance.pierce, 5);
  assert.ok(lockLance.damage > baselineNeedles[0].damage);
  assert.ok(Math.hypot(lockLance.vx, lockLance.vy) > Math.hypot(baselineNeedles[0].vx, baselineNeedles[0].vy));
});

test("VESPER vector projectiles have dedicated Phaser trails and sound identity", async () => {
  const [battleView, app] = await Promise.all([
    readFile(new URL("../src/phaser/view/BattleView.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
  ]);
  assert.match(battleView, /type\.includes\("vespervectorneedle"\)/);
  assert.match(battleView, /type\.includes\("vesperlocklance"\)/);
  assert.match(battleView, /const vesperNeedle = projectileKind\.includes\("vesper"\)/);
  assert.match(battleView, /graphics\.lineStyle\(1\.25, 0x8ff4ff, 0\.7\)/);
  assert.match(app, /vesperVectorNeedle: "rail"/);
  assert.match(app, /vesperVectorCorona: "emp"/);
});

test("VESPER locked skill input is rejected before creating its effect", () => {
  const state = createSwarmState({
    random: () => 0.5,
    characterId: "vesper",
    vesperUnlocked: true,
    characterSkillRanks: { vesper: 0 },
  });
  const input = createSwarmInput();
  input.aegisWardPressed = true;
  stepSwarm(state, input, 1 / 60);
  const events = drainSwarmEvents(state);
  assert.ok(events.some((event) => event.type === "manualAbilityRejected" && event.ability === "zeroMark" && event.reason === "locked"));
  assert.equal(state.empPulses.some((effect) => effect.type === "zeroMark"), false);
});

test("character management exposes locked art previews and lobby settings", async () => {
  const [app, screens, manifest] = await Promise.all([
    readFile(new URL("../src/App.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/ui/campaign/CampaignScreens.jsx", import.meta.url), "utf8"),
    readFile(new URL("../src/game/assets/manifest.ts", import.meta.url), "utf8"),
  ]);
  assert.match(app, /characters: facility\.id === "augmentation" \? playableCharacters\.map/);
  assert.match(screens, /className="character-lock-banner"/);
  assert.match(screens, /profile\?\.id === "vesper" \? 320/);
  assert.match(screens, /Math\.round\(baseDamageOutput \* 1\.16\)/);
  assert.match(screens, /Math\.round\(baseFireRate \* 1\.08\)/);
  assert.match(screens, /if \(selected\.unlocked\) onCharacterChange\?\.\(characterId\)/);
  assert.match(screens, /className="base-settings-button"/);
  assert.match(app, /onOpenSettings=\{\(\) => setSettingsOpen\(true\)\}/);
  assert.match(app, /\{settingsOpen && \(/);
  assert.match(app, /status\.reason === "insufficient-funds" \? `\$\{currency\?\.koreanName \|\| "재화"\} 부족`/);
  assert.match(manifest, /vesperPortrait: "\.\/assets\/overload\/hero\/vesper-portrait-v6\.webp"/);
});

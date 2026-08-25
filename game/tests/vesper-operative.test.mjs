import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getPlayableCharacter, getPlayableCharacters, isCharacterUnlocked } from "../src/game/content/characters.js";
import { createSwarmState, VESPER_MANUAL_ACTIVE_ABILITIES } from "../src/swarm/engine.js";

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
  assert.match(manifest, /vesperPortrait: "\.\/assets\/overload\/hero\/vesper-portrait-v1\.png"/);
});

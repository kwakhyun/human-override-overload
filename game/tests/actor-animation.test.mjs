import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const animation = await import(new URL("../src/phaser/view/animation/actorAnimation.ts", import.meta.url));
const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("actor clip catalog covers the hero, three enemy silhouettes, allies, and boss", () => {
  const expectedProfiles = ["hero", "enemy-hunter", "enemy-suppressor", "enemy-brute", "ally", "boss"];
  assert.deepEqual(Object.keys(animation.ACTOR_ANIMATION_PROFILES), expectedProfiles);

  for (const profile of Object.values(animation.ACTOR_ANIMATION_PROFILES)) {
    assert.ok(profile.clips.idle, `${profile.id} needs an idle fallback`);
    for (const clip of Object.values(profile.clips)) {
      assert.ok(clip.frameCount > 0, `${profile.id}/${clip.id} frameCount`);
      assert.ok(clip.fps > 0, `${profile.id}/${clip.id} fps`);
      assert.equal(typeof clip.loop, "boolean");
      assert.ok(Number.isFinite(clip.priority));
      assert.ok(clip.fallbackFrames.length > 0);
      for (const frame of clip.fallbackFrames) {
        assert.ok(frame.column >= 0 && frame.column < profile.fallbackLayout.columns);
        assert.ok(frame.row >= 0 && frame.row < profile.fallbackLayout.rows);
      }
    }
  }

  assert.equal(animation.ACTOR_ANIMATION_PROFILES.hero.fallbackSource, "hero-v2-8x9");
  assert.deepEqual(animation.ACTOR_ANIMATION_PROFILES.hero.fallbackLayout, { columns: 8, rows: 9 });
  for (const id of ["enemy-hunter", "enemy-suppressor", "enemy-brute"]) {
    assert.equal(animation.ACTOR_ANIMATION_PROFILES[id].fallbackSource, "legacy-5x3");
    assert.deepEqual(animation.ACTOR_ANIMATION_PROFILES[id].fallbackLayout, { columns: 5, rows: 3 });
  }
  assert.equal(animation.ACTOR_ANIMATION_PROFILES.ally.fallbackSource, "static-image");
  assert.equal(animation.ACTOR_ANIMATION_PROFILES.boss.fallbackSource, "boss-form-strip");
});

test("enemy profile routing preserves the three active atlas rows", () => {
  assert.equal(animation.resolveActorAnimationProfileId("enemy", { type: "hunter", combatRole: "suicideDrone" }), "enemy-hunter");
  assert.equal(animation.resolveActorAnimationProfileId("enemy", { type: "suppressor", combatRole: "rifleman" }), "enemy-suppressor");
  assert.equal(animation.resolveActorAnimationProfileId("enemy", { type: "brute", combatRole: "rifleman" }), "enemy-brute");
  assert.equal(animation.resolveActorAnimationProfileId("enemy", { combatRole: "suicideDrone" }), "enemy-hunter");
  assert.equal(animation.resolveActorAnimationProfileId("enemy", { combatRole: "rifleman" }), "enemy-suppressor");
  assert.equal(animation.resolveActorAnimationProfileId("enemy", { combatRole: "sniper" }), "enemy-brute");
  assert.equal(animation.resolveActorAnimationProfileId("enemy", { type: "unknown" }), "enemy-hunter");
});

test("state selection follows clip priority instead of renderer branch order", () => {
  const hero = animation.ACTOR_ANIMATION_PROFILES.hero;
  assert.equal(animation.selectActorClip(hero, {}).id, "idle");
  assert.equal(animation.selectActorClip(hero, { vx: 18 }).id, "move");
  assert.equal(animation.selectActorClip(hero, { attackTimer: 0.1 }).id, "attack");
  assert.equal(animation.selectActorClip(hero, { attackTimer: 0.1, vx: 18 }).id, "move");
  assert.equal(animation.selectActorClip(hero, { dashTimer: 0.1, attackTimer: 0.1 }).id, "dash");
  assert.equal(animation.selectActorClip(hero, { hitStun: 0.1, dashTimer: 0.1 }).id, "hit");
  assert.equal(animation.selectActorClip(hero, { dead: true, hitStun: 0.1 }).id, "death");

  const suppressor = animation.ACTOR_ANIMATION_PROFILES["enemy-suppressor"];
  assert.equal(animation.selectActorClip(suppressor, { attackState: "aim" }).id, "windup");
  assert.equal(animation.selectActorClip(suppressor, { attackState: "shoot", attackTimer: 0.1 }).id, "attack");
  assert.equal(animation.selectActorClip(suppressor, { animationState: "spawn", attackState: "shoot" }).id, "spawn");

  const boss = animation.ACTOR_ANIMATION_PROFILES.boss;
  assert.equal(animation.selectActorClip(boss, { activePattern: { phase: "warning" } }).id, "windup");
  assert.equal(animation.selectActorClip(boss, { activePattern: { phase: "active" } }).id, "attack");
  assert.equal(animation.selectActorClip(boss, { transformTimer: 1, hitFlash: 1 }).id, "transform");
  assert.equal(animation.selectActorClip(boss, { dead: true, transformTimer: 1 }).id, "death");

  const ally = animation.ACTOR_ANIMATION_PROFILES.ally;
  assert.equal(animation.selectActorClip(ally, { animationState: "move" }).id, "move");
  assert.equal(animation.selectActorClip(ally, { attackState: "shoot" }).id, "attack");
  assert.equal(animation.selectActorClip(ally, { animationState: "spawn", attackState: "shoot" }).id, "spawn");
});

test("frame sampling is deterministic for looping and one-shot clips", () => {
  const hero = animation.ACTOR_ANIMATION_PROFILES.hero;
  const move = hero.clips.move;
  const death = hero.clips.death;

  assert.equal(animation.calculateClipFrame(move, 0), 0);
  assert.equal(animation.calculateClipFrame(move, 0.25), 3);
  assert.equal(animation.calculateClipFrame(move, 0.25), 3);
  assert.equal(animation.calculateClipFrame(move, move.frameCount / move.fps), 0);
  assert.equal(animation.calculateClipFrame(move, Number.NaN), 0);
  assert.equal(animation.calculateClipFrame(move, 0, -1), move.frameCount - 1);
  assert.equal(animation.calculateClipFrame(death, 99), death.frameCount - 1);
  assert.equal(animation.calculateClipFrame(death, -4), 0);
});

test("hero v2 fallback keeps aim-relative movement rows", () => {
  assert.equal(animation.resolveHeroMovementRow({ angle: 0, vx: 100, vy: 0 }), animation.HERO_MOTION_ROWS.forward);
  assert.equal(animation.resolveHeroMovementRow({ angle: 0, vx: -100, vy: 0 }), animation.HERO_MOTION_ROWS.backward);
  assert.equal(animation.resolveHeroMovementRow({ angle: 0, vx: 0, vy: -100 }), animation.HERO_MOTION_ROWS.strafeUp);
  assert.equal(animation.resolveHeroMovementRow({ angle: 0, vx: 0, vy: 100 }), animation.HERO_MOTION_ROWS.strafeDown);
  assert.equal(animation.resolveHeroMovementRow({ angle: Math.PI / 2, vx: 0, vy: 100 }), animation.HERO_MOTION_ROWS.forward);

  const movingFire = animation.sampleActorAnimation("hero", { angle: 0, vx: 0, vy: -100, attackTimer: 0.1 }, 0.25);
  assert.equal(movingFire.clipId, "move");
  assert.equal(movingFire.fallbackAtlasFrame.row, animation.HERO_MOTION_ROWS.strafeUp);
});

test("upright hero presentation selects upper, level, and lower aim rows with left-side mirroring", () => {
  assert.deepEqual(animation.HERO_DIRECTIONAL_AIM_LAYOUT, { columns: 8, rows: 3 });
  assert.deepEqual(animation.resolveHeroAimPresentation({ angle: -Math.PI / 2 }), {
    band: "upper", row: animation.HERO_DIRECTIONAL_AIM_ROWS.upper, flipX: false,
  });
  assert.deepEqual(animation.resolveHeroAimPresentation({ angle: 0 }), {
    band: "level", row: animation.HERO_DIRECTIONAL_AIM_ROWS.level, flipX: false,
  });
  assert.deepEqual(animation.resolveHeroAimPresentation({ angle: Math.PI / 2 }), {
    band: "lower", row: animation.HERO_DIRECTIONAL_AIM_ROWS.lower, flipX: false,
  });
  assert.deepEqual(animation.resolveHeroAimPresentation({ angle: -Math.PI * 0.75 }), {
    band: "upper", row: animation.HERO_DIRECTIONAL_AIM_ROWS.upper, flipX: true,
  });
  assert.deepEqual(animation.resolveHeroAimPresentation({ angle: Math.PI * 0.75 }), {
    band: "lower", row: animation.HERO_DIRECTIONAL_AIM_ROWS.lower, flipX: true,
  });

  const upperMove = animation.sampleActorAnimation("hero", { angle: -Math.PI / 2, vx: 80 }, 0.25);
  const lowerFire = animation.sampleActorAnimation("hero", { angle: Math.PI / 2, attackTimer: 0.1 }, 0.2);
  assert.equal(animation.resolveHeroDirectionalAimFrame(upperMove, { angle: -Math.PI / 2 }).row, 0);
  assert.ok(animation.resolveHeroDirectionalAimFrame(upperMove, { angle: -Math.PI / 2 }).column < 4);
  assert.equal(animation.resolveHeroDirectionalAimFrame(lowerFire, { angle: Math.PI / 2 }).row, 2);
  assert.ok(animation.resolveHeroDirectionalAimFrame(lowerFire, { angle: Math.PI / 2 }).column >= 4);
  const dash = animation.sampleActorAnimation("hero", { angle: 0, dashTimer: 0.1 }, 0.04);
  assert.equal(animation.resolveHeroDirectionalAimFrame(dash, { angle: 0 }), null);
});

test("directional rifle muzzle anchors follow every row and horizontal flip", () => {
  const upperRight = animation.resolveHeroMuzzleAnchor({ angle: -Math.PI / 2 }, 100);
  const levelRight = animation.resolveHeroMuzzleAnchor({ angle: 0 }, 100);
  const lowerRight = animation.resolveHeroMuzzleAnchor({ angle: Math.PI / 2 }, 100);
  const upperLeft = animation.resolveHeroMuzzleAnchor({ angle: -Math.PI * 0.75 }, 100);
  const levelLeft = animation.resolveHeroMuzzleAnchor({ angle: Math.PI }, 100);
  const lowerLeft = animation.resolveHeroMuzzleAnchor({ angle: Math.PI * 0.75 }, 100);

  assert.ok(upperRight.x > 0 && upperRight.y < 0 && upperRight.angle < 0);
  assert.ok(levelRight.x > upperRight.x && Math.abs(levelRight.y) < 4 && levelRight.angle === 0);
  assert.ok(lowerRight.x > 0 && lowerRight.y > 0 && lowerRight.angle > 0);
  assert.ok(upperLeft.x < 0 && upperLeft.y < 0 && upperLeft.angle > Math.PI);
  assert.ok(levelLeft.x < 0 && Math.abs(levelLeft.y) < 4 && levelLeft.angle === Math.PI);
  assert.ok(lowerLeft.x < 0 && lowerLeft.y > 0 && lowerLeft.angle > Math.PI / 2);
  assert.equal(Math.abs(upperLeft.x), Math.abs(upperRight.x));
  assert.equal(Math.abs(lowerLeft.x), Math.abs(lowerRight.x));
});

test("hero dash and death frames follow their engine countdowns", () => {
  const hero = animation.ACTOR_ANIMATION_PROFILES.hero;
  for (const clip of Object.values(hero.clips)) assert.equal(clip.frameCount, 8);

  const dashStart = animation.resolveHeroClipElapsedSeconds("dash", { dashTimer: 0.16, dashDuration: 0.16 }, 99);
  const dashMiddle = animation.resolveHeroClipElapsedSeconds("dash", { dashTimer: 0.08, dashDuration: 0.16 }, 99);
  const dashEnd = animation.resolveHeroClipElapsedSeconds("dash", { dashTimer: 0, dashDuration: 0.16 }, 99);
  assert.equal(animation.calculateClipFrame(hero.clips.dash, dashStart), 0);
  assert.equal(animation.calculateClipFrame(hero.clips.dash, dashMiddle), 4);
  assert.equal(animation.calculateClipFrame(hero.clips.dash, dashEnd), 7);

  const deathStart = animation.resolveHeroClipElapsedSeconds("death", { deathTimer: 0.9 }, 99);
  const deathMiddle = animation.resolveHeroClipElapsedSeconds("death", { deathTimer: 0.45 }, 99);
  const deathEnd = animation.resolveHeroClipElapsedSeconds("death", { deathTimer: 0 }, 99);
  assert.equal(animation.calculateClipFrame(hero.clips.death, deathStart), 0);
  assert.equal(animation.calculateClipFrame(hero.clips.death, deathMiddle), 4);
  assert.equal(animation.calculateClipFrame(hero.clips.death, deathEnd), 7);
});

test("boss death frames continue after terminal state freezes the simulation clock", () => {
  const boss = animation.ACTOR_ANIMATION_PROFILES.boss;
  const start = animation.resolveBossClipElapsedSeconds("death", { deathTimer: 1.25, deathDuration: 1.25 }, 0);
  const middle = animation.resolveBossClipElapsedSeconds("death", { deathTimer: 0.625, deathDuration: 1.25 }, 0);
  const end = animation.resolveBossClipElapsedSeconds("death", { deathTimer: 0, deathDuration: 1.25 }, 0);
  const frame = (elapsed) => animation.resolveDedicatedAtlasFrame(
    "boss",
    animation.sampleActorAnimation("boss", { stage: 3, dead: true }, elapsed),
    { stage: 3, dead: true },
  );
  assert.deepEqual(frame(start), { column: 3, row: 3 });
  assert.deepEqual(frame(middle), { column: 4, row: 3 });
  assert.deepEqual(frame(end), { column: 5, row: 3 });
  assert.ok(boss.clips.death.frameCount > 3);
});

test("short enemy and ally fire windows reach their authored final attack frames", () => {
  const rifle = animation.ACTOR_ANIMATION_PROFILES["enemy-suppressor"].clips.attack;
  const sniper = animation.ACTOR_ANIMATION_PROFILES["enemy-brute"].clips.attack;
  const enemyDeath = animation.ACTOR_ANIMATION_PROFILES["enemy-hunter"].clips.death;
  const allyAttack = animation.ACTOR_ANIMATION_PROFILES.ally.clips.attack;
  assert.equal(animation.calculateClipFrame(rifle, 0.15), 5);
  assert.equal(animation.calculateClipFrame(sniper, 0.3), 5);
  assert.equal(animation.calculateClipFrame(enemyDeath, 0.3), 5);
  assert.equal(animation.calculateClipFrame(allyAttack, 0.14), 4);
});

test("hero v2 frames and legacy enemy/boss fallbacks remain independently addressable", () => {
  const hero = animation.ACTOR_ANIMATION_PROFILES.hero;
  const earlyMove = animation.resolveFallbackAtlasFrame(hero, hero.clips.move, 0, { angle: 0, vx: 1, vy: 0 });
  const lateMove = animation.resolveFallbackAtlasFrame(hero, hero.clips.move, hero.clips.move.frameCount - 1, { angle: 0, vx: 1, vy: 0 });
  assert.deepEqual(earlyMove, { column: 0, row: 0 });
  assert.deepEqual(lateMove, { column: 7, row: 0 });

  const attackStart = animation.sampleActorAnimation("hero", { attackTimer: 0.1 }, 0);
  const attackEnd = animation.sampleActorAnimation("hero", { attackTimer: 0.1 }, 7 / 24);
  assert.deepEqual(attackStart.fallbackAtlasFrame, { column: 0, row: 5 });
  assert.deepEqual(attackEnd.fallbackAtlasFrame, { column: 7, row: 5 });

  for (const stage of [1, 2, 3]) {
    const boss = animation.sampleActorAnimation("boss", { stage }, 0);
    assert.deepEqual(boss.fallbackAtlasFrame, { column: stage - 1, row: 0 });
  }
  const clampedBoss = animation.sampleActorAnimation("boss", { stage: 99 }, 0);
  assert.deepEqual(clampedBoss.fallbackAtlasFrame, { column: 2, row: 0 });
});

test("dedicated v2 actor sheets map semantic clips without changing simulation timing", () => {
  assert.deepEqual(animation.ENEMY_MOTION_V2_LAYOUT, { columns: 6, rows: 4 });
  assert.deepEqual(animation.ALLY_MOTION_V2_LAYOUT, { columns: 5, rows: 4 });
  assert.deepEqual(animation.BOSS_MOTION_V2_LAYOUT, { columns: 6, rows: 4 });

  const enemyMove = animation.sampleActorAnimation("enemy", { combatRole: "rifleman", vx: 80 }, 0.22);
  const enemyAttack = animation.sampleActorAnimation("enemy", { combatRole: "rifleman", attackTimer: 0.2 }, 0.16);
  const enemyHit = animation.sampleActorAnimation("enemy", { combatRole: "sniper", hitStun: 0.2 }, 0.1);
  const enemyDeath = animation.sampleActorAnimation("enemy", { combatRole: "suicideDrone", dead: true }, 0.2);
  assert.equal(animation.resolveDedicatedAtlasFrame("enemy", enemyMove, {}).row, 0);
  assert.equal(animation.resolveDedicatedAtlasFrame("enemy", enemyAttack, {}).row, 1);
  assert.equal(animation.resolveDedicatedAtlasFrame("enemy", enemyHit, {}).row, 2);
  assert.equal(animation.resolveDedicatedAtlasFrame("enemy", enemyDeath, {}).row, 3);

  const allySpawn = animation.sampleActorAnimation("ally", { animationState: "spawn", spawnDelay: 0.2 }, 0.08);
  const allyMove = animation.sampleActorAnimation("ally", { animationState: "move", vx: 20 }, 0.12);
  const allyAttack = animation.sampleActorAnimation("ally", { attackTimer: 0.2 }, 0.12);
  assert.equal(animation.resolveDedicatedAtlasFrame("ally", allySpawn, {}).row, 0);
  assert.equal(animation.resolveDedicatedAtlasFrame("ally", allyMove, {}).row, 1);
  assert.equal(animation.resolveDedicatedAtlasFrame("ally", allyAttack, {}).row, 2);

  const bossIdle = animation.sampleActorAnimation("boss", { stage: 2 }, 0.2);
  const bossWindup = animation.sampleActorAnimation("boss", { stage: 3, activePattern: { phase: "warning" } }, 0.2);
  const bossAttack = animation.sampleActorAnimation("boss", { stage: 1, activePattern: { phase: "active" } }, 0.2);
  const bossDeath = animation.sampleActorAnimation("boss", { stage: 3, dead: true }, 99);
  assert.equal(animation.resolveDedicatedAtlasFrame("boss", bossIdle, { stage: 2 }).row, 1);
  assert.deepEqual(animation.resolveDedicatedAtlasFrame("boss", bossWindup, { stage: 3 }), { column: 2, row: 2 });
  assert.deepEqual(animation.resolveDedicatedAtlasFrame("boss", bossAttack, { stage: 1 }), { column: 4, row: 0 });
  assert.deepEqual(animation.resolveDedicatedAtlasFrame("boss", bossDeath, { stage: 3 }), { column: 5, row: 3 });

  // A live attack can be as short as 220 ms. Both authored A/B frames must be
  // reachable during that window instead of waiting for half of a 16-frame
  // logical clip to elapse.
  const bossAttackB = animation.sampleActorAnimation("boss", { stage: 1, activePattern: { phase: "active" } }, 0.08);
  const bossWindupB = animation.sampleActorAnimation("boss", { stage: 2, activePattern: { phase: "warning" } }, 0.11);
  assert.deepEqual(animation.resolveDedicatedAtlasFrame("boss", bossAttackB, { stage: 1 }), { column: 5, row: 0 });
  assert.deepEqual(animation.resolveDedicatedAtlasFrame("boss", bossWindupB, { stage: 2 }), { column: 3, row: 1 });
});

test("enemy director samples expose every active legacy 5x3 combat signal", () => {
  const spawn = animation.sampleActorAnimation("enemy", { type: "hunter", animationState: "spawn", spawnDelay: 0.2 }, 0);
  const move = animation.sampleActorAnimation("enemy", { type: "hunter", animationState: "move", vx: 80 }, 0.2);
  const windup = animation.sampleActorAnimation("enemy", { type: "brute", combatRole: "sniper", animationState: "attack", attackState: "aim" }, 0.1);
  const attack = animation.sampleActorAnimation("enemy", { type: "suppressor", animationState: "attack", attackState: "shoot", attackTimer: 0.1 }, 0.1);
  const hit = animation.sampleActorAnimation("enemy", { type: "brute", animationState: "hit", hitStun: 0.08 }, 0.04);
  const death = animation.sampleActorAnimation("enemy", { type: "hunter", animationState: "death", dead: true }, 0.2);

  assert.deepEqual([spawn.clipId, move.clipId, windup.clipId, attack.clipId, hit.clipId, death.clipId], [
    "spawn", "move", "windup", "attack", "hit", "death",
  ]);
  assert.deepEqual(windup.fallbackAtlasFrame, { column: 2, row: 2 });
  assert.deepEqual(attack.fallbackAtlasFrame, { column: 3, row: 1 });
  assert.deepEqual(hit.fallbackAtlasFrame, { column: 4, row: 2 });
  assert.deepEqual(death.fallbackAtlasFrame, { column: 4, row: 0 });
});

test("BattleView connects director clocks to dedicated atlases with static fallbacks and allocation-free live tracking", async () => {
  const view = await read("src/phaser/view/BattleView.ts");
  const enemies = view.slice(view.indexOf("private syncEnemies"), view.indexOf("private syncAllies"));
  const allies = view.slice(view.indexOf("private syncAllies"), view.indexOf("private drawShadows"));
  const boss = view.slice(view.indexOf("private syncBoss"), view.indexOf("private syncEnemies"));

  assert.match(view, /currentClipId: ActorClipId/);
  assert.match(view, /clipStartedAt: number/);
  assert.match(enemies, /sampleActorAnimation\("enemy", entity, clipElapsed, phaseOffset\)/);
  assert.match(enemies, /record\.live = false/);
  assert.match(enemies, /if \(record\) record\.live = true/);
  assert.doesNotMatch(enemies, /new Set<number>/);
  assert.doesNotMatch(enemies, /strideBucket|dangerPriority/);
  assert.match(enemies, /if \(record\.live\)/);
  assert.match(enemies, /const animationHz = quality\.id === "performance" \? 10/);
  assert.match(enemies, /if \(!inView\)/);
  assert.match(enemies, /this\.preparedAtlases\.has\(motionTexture\)/);
  assert.match(enemies, /enemyMotionTexture\(entity\)/);
  assert.match(enemies, /resolveDedicatedAtlasFrame\("enemy", animation, entity\)/);
  assert.doesNotMatch(enemies, /enemyMotionColumn/);

  assert.match(allies, /selectActorClip\(ACTOR_ANIMATION_PROFILES\.ally, entity\)/);
  assert.match(allies, /spawnScale = 0\.62/);
  assert.match(allies, /moveBlend/);
  assert.match(allies, /attackTimer/);
  assert.match(allies, /recoilDistance/);
  assert.match(allies, /allyMotionTexture\(entity\)/);
  assert.match(allies, /resolveDedicatedAtlasFrame\("ally", animation, entity\)/);
  assert.match(allies, /allyFallbackTexture\(entity\)/);

  assert.match(boss, /sampleActorAnimation\("boss", entity, clipElapsed\)/);
  assert.match(boss, /animation\.clipId === "windup"/);
  assert.match(boss, /animation\.clipId === "attack"/);
  assert.match(boss, /animation\.clipId === "transform"/);
  assert.match(boss, /animation\.clipId === "hit"/);
  assert.match(boss, /animation\.clipId === "death"/);
  assert.match(boss, /this\.bossVisualScale \+=/);
  assert.match(boss, /resolveDedicatedAtlasFrame\("boss", animation, entity\)/);
  assert.doesNotMatch(boss, /\.geometry\s*=|state\.boss\.[a-zA-Z]+\s*=/);
});

test("authored ally traces remain smaller than the 74px route hero", async () => {
  const view = await read("src/phaser/view/BattleView.ts");
  const sizes = view.match(/trace\.id === "moss" \? (\d+) : trace\.id === "rook" \? (\d+) : (\d+)/);
  assert.ok(sizes);
  const [moss, rook, nyx] = sizes.slice(1).map(Number);
  assert.deepEqual({ rook, nyx, moss }, { rook: 54, nyx: 58, moss: 62 });
  for (const size of [rook, nyx, moss]) assert.ok(size < 74);
});

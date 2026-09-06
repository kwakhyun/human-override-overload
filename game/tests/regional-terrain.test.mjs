import assert from 'node:assert/strict';
import test from 'node:test';
import { REGIONAL_TERRAIN, terrainContact, constrainTerrainActor, steerTerrainEnemy, hasRegionalTerrain,
  damageTerrainStructure, activeTerrainSites } from '../src/game/content/regionalTerrain.js';
import { createSwarmState, createSwarmInput, stepSwarm, getSwarmHud } from '../src/swarm/engine.js';

for (const regionId of Object.keys(REGIONAL_TERRAIN)) {
  const fresh = (options = {}) => createSwarmState({ expedition: true, regionId, random: () => .5, ...options });
  test(`${regionId}: route footprints are bounded, separated, and leave staging space`, () => {
    const s = fresh(), sites = activeTerrainSites(s);
    assert.equal(hasRegionalTerrain(s), true); assert.equal(sites.length, 10);
    assert.equal(terrainContact(2048, 2048, 2048, 2048, 175, sites), null);
    for (const site of sites) {
      assert.ok(site.x - site.radius > 144 && site.x + site.radius < 3952);
      assert.ok(site.y - site.radius > 144 && site.y + site.radius < 3952);
      for (const other of sites) if (other !== site) assert.ok(Math.hypot(other.x - site.x, other.y - site.y) > site.radius + other.radius + 170);
    }
    s.phase = 'boss'; assert.equal(hasRegionalTerrain(s), false);
    assert.deepEqual(getSwarmHud(s).expedition.minimap.structures, []);
    assert.equal(hasRegionalTerrain(fresh({ expedition: false })), false);
  });
  test(`${regionId}: destruction opens movement, shots and minimap without kills or persistent damage`, () => {
    const s = fresh(), site = s.terrain.active.find(site => site.maxHp > 0), kills = s.killedEnemies;
    const contact = () => terrainContact(site.x - 200, site.y, site.x + 200, site.y, 6, s.terrain.active);
    assert.equal(contact().obstacle.id, site.id);
    damageTerrainStructure(s, site, site.maxHp - 1); assert.equal(site.hp, 1); assert.equal(s.terrain.revision, 0);
    assert.equal(damageTerrainStructure(s, site, 1), true); assert.equal(site.destroyedAt, 0);
    assert.equal(damageTerrainStructure(s, site, 999), false); assert.equal(s.terrain.revision, 1);
    assert.equal(contact(), null); assert.equal(s.killedEnemies, kills);
    const actor = { x: site.x + 200, y: site.y, radius: 22 };
    constrainTerrainActor(s, actor, site.x - 200, site.y); assert.equal(actor.x, site.x + 200);
    assert.ok(!getSwarmHud(s).expedition.minimap.structures.some(entry => entry.id === site.id));
    const reset = fresh().terrain.sites.find(entry => entry.id === site.id);
    assert.equal(reset.hp, reset.maxHp); assert.equal(reset.destroyedAt, null);
    const solid = s.terrain.active.find(site => !site.maxHp);
    assert.equal(damageTerrainStructure(s, solid, 999999), false); assert.ok(s.terrain.active.includes(solid));
  });
  test(`${regionId}: actual friendly and enemy bullets destroy a prop exactly once`, () => {
    const s = fresh(); s.enemies = [];
    const site = s.terrain.active.find(site => site.maxHp > 0);
    const shot = { id: 990, x: site.x - 180, y: site.y, vx: 18000, vy: 0, radius: 4,
      life: 2, age: 0, damage: site.maxHp / 2, kind: 'pulse', pierce: 0, dead: false };
    const friendly = { ...shot }, enemy = { ...shot, id: 991 };
    s.projectiles.push(friendly); s.enemyProjectiles.push(enemy);
    stepSwarm(s, createSwarmInput(), 1 / 60);
    assert.ok(friendly.dead && enemy.dead); assert.equal(site.hp, 0);
    assert.equal(s.events.filter(event => event.type === 'terrainDestroyed').length, 1);
    assert.equal(s.terrain.revision, 1);
  });
  test(`${regionId}: enemies can route around each surviving solid footprint`, () => {
    const s = fresh();
    for (const site of s.terrain.active) {
      const e = { id: 1, x: site.x - site.radius - 140, y: site.y, radius: 28, vx: 0, vy: 0 };
      const target = { x: site.x + site.radius + 140, y: site.y };
      for (let i = 0; i < 950; i++) {
        const d = Math.hypot(target.x - e.x, target.y - e.y); if (d < 10) break;
        e.vx = (target.x - e.x) / d * 115; e.vy = (target.y - e.y) / d * 115;
        steerTerrainEnemy(s, e); const x = e.x, y = e.y; e.x += e.vx / 60; e.y += e.vy / 60;
        constrainTerrainActor(s, e, x, y);
      }
      assert.ok(Math.hypot(target.x - e.x, target.y - e.y) < 12, site.id);
    }
  });
}

test('beam-sword arcs damage only destructible props within the aimed arc', () => {
  const s = createSwarmState({ expedition: true, regionId: 'glass-dune', mainWeaponId: 'beam-sword', random: () => .5 });
  const site = s.terrain.active[0]; s.enemies = [];
  s.player.x = site.x - site.radius - 35; s.player.y = site.y;
  const behind = { ...site, id: 'behind-test', x: s.player.x - site.radius - 35 };
  s.terrain.active.push(behind); s.terrain.sites.push(behind);
  const input = createSwarmInput(); input.aimX = site.x; input.aimY = site.y;
  s.aim.x = site.x; s.aim.y = site.y; s.aimX = site.x; s.aimY = site.y;
  for (let i = 0; i < 180 && site.hp === site.maxHp; i++) stepSwarm(s, input, 1 / 60);
  assert.ok(site.hp < site.maxHp);
  assert.equal(behind.hp, behind.maxHp);
});

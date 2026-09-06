import assert from 'node:assert/strict';
import test from 'node:test';
import { SECTOR_ONE_STRUCTURES, terrainContact, constrainTerrainActor, steerTerrainEnemy, hasSectorOneTerrain } from '../src/game/content/sectorOneTerrain.js';
import { FLOOR_SIN, FLOOR_COS, toTerrainPosition, projectedGroundPosition } from '../src/render/sectorOne/projection.js';
import { createSwarmState, createSwarmInput, stepSwarm } from '../src/swarm/engine.js';

const state = () => createSwarmState({ expedition: true, regionId: 'wrong-engine-core', random: () => .5 });
const tank = SECTOR_ONE_STRUCTURES[0];

test('3D floor projects exactly onto simulation coordinates at every ground point', () => {
  for (const x of [0, 144, 1480, 2048, 4096]) for (const y of [0, 144, 1750, 2048, 4096]) {
    const p = toTerrainPosition(x, y);
    assert.ok(Math.abs(p.z * FLOOR_SIN - p.y * FLOOR_COS - y) < 1e-9);
    assert.deepEqual(projectedGroundPosition(x, y), { x, y });
    assert.ok(projectedGroundPosition(x, y, 100).y < y);
  }
});

test('legacy Sector 01 predicate stays scoped and the original center spawn stays clear', () => {
  const s = state(); assert.equal(hasSectorOneTerrain(s), true);
  assert.equal(terrainContact(2048, 2048, 2048, 2048, 170), null);
  for (const site of SECTOR_ONE_STRUCTURES) {
    assert.ok(site.x - site.radius > 144 && site.x + site.radius < 3952);
    assert.ok(site.y - site.radius > 144 && site.y + site.radius < 3952);
  }
  for (const patch of [{ regionId: 'glass-dune' }, { phase: 'boss' }, { expedition: null }]) assert.equal(hasSectorOneTerrain({ ...s, ...patch }), false);
});

test('fast swept movement cannot cross a tank, glancing travel slides, embedded drops are rescued', () => {
  const s = state(), startX = tank.x - 250;
  const actor = { x: tank.x + 250, y: tank.y, radius: 20, vx: 500, vy: 0 };
  constrainTerrainActor(s, actor, startX, tank.y);
  assert.ok(actor.x < tank.x - tank.radius);
  const drop = { x: tank.x, y: tank.y, radius: 8 };
  constrainTerrainActor(s, drop); assert.ok(Math.hypot(drop.x - tank.x, drop.y - tank.y) > tank.radius + 8);
  const slide = { x: tank.x - 60, y: tank.y - 85, radius: 20, vx: 300, vy: -100 };
  constrainTerrainActor(s, slide, tank.x - 150, tank.y - 50);
  assert.ok(Math.hypot(slide.x - tank.x, slide.y - tank.y) >= tank.radius + 20);
  assert.ok(slide.y < tank.y - 50);
});

test('approaching enemies steer around a tank and keep making progress', () => {
  const s = state(), enemy = { id: 1, x: tank.x - 210, y: tank.y, radius: 22, vx: 0, vy: 0 };
  const target = { x: tank.x + 250, y: tank.y };
  for (let i = 0; i < 700; i++) {
    const d = Math.hypot(target.x - enemy.x, target.y - enemy.y);
    if (d < 10) break;
    enemy.vx = (target.x - enemy.x) / d * 110; enemy.vy = (target.y - enemy.y) / d * 110;
    steerTerrainEnemy(s, enemy);
    const x = enemy.x, y = enemy.y; enemy.x += enemy.vx / 60; enemy.y += enemy.vy / 60;
    constrainTerrainActor(s, enemy, x, y);
    assert.ok(Math.hypot(enemy.x - tank.x, enemy.y - tank.y) >= tank.radius + enemy.radius - .01);
  }
  assert.ok(Math.hypot(target.x - enemy.x, target.y - enemy.y) < 12);
});

test('both sides high-speed bullets hit the same solid footprint in the live simulation', () => {
  const s = state(); s.enemies = [];
  const shot = { id: 990, x: tank.x - 180, y: tank.y, vx: 20000, vy: 0, radius: 4, life: 2, age: 0, damage: 4, kind: 'pulse', pierce: 0, dead: false };
  const friendly = { ...shot }, hostile = { ...shot, id: 991 };
  s.projectiles.push(friendly); s.enemyProjectiles.push(hostile);
  stepSwarm(s, createSwarmInput(), 1 / 60);
  assert.equal(friendly.dead, true); assert.equal(hostile.dead, true);
});

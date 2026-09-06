import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDefenseDirection } from '../src/phaser/view/animation/defensePresentation.ts';
import { sampleActorAnimation } from '../src/phaser/view/animation/actorAnimation.ts';
import { resolveExpandedBossFrame, resolveRegionalEnemyFrame } from '../src/phaser/view/animation/regionalActorAnimation.ts';

test('defense uses front/back/side pairs, retaining facing while stopped', () => {
  assert.equal(resolveDefenseDirection(0, 3), 0);
  assert.equal(resolveDefenseDirection(4, 1), 1);
  assert.equal(resolveDefenseDirection(0, -4), 2);
  assert.equal(resolveDefenseDirection(-4, 1), 3);
  assert.equal(resolveDefenseDirection(0, 0, 3), 3);
});

test('regional rows preserve unit identity through move, attack, hit and death', () => {
  for (const state of [{vx:10,moveBlend:1},{attackTimer:0.2},{hitFlash:0.2},{dead:true}]) {
    for (let time=0; time<2; time+=0.04) {
      const sample=sampleActorAnimation('enemy',state,time);
      assert.equal(resolveRegionalEnemyFrame(1,sample).row,1);
      assert.equal(resolveRegionalEnemyFrame(0,sample,true).row,3);
      assert.ok(resolveRegionalEnemyFrame(0,sample).column<6);
    }
  }
});

test('expanded boss clips address only the correct phase and transition rows', () => {
  const transforming = { stage: 2, transformTimer: 1 };
  assert.equal(resolveExpandedBossFrame(sampleActorAnimation('boss', transforming, 0.25), transforming).column, 0);
  assert.equal(resolveExpandedBossFrame(sampleActorAnimation('boss', transforming, 0.75), transforming).column, 2);
  for(const stage of [1,2,3]) {
    for(const state of [{stage},{stage,attackTimer:0.2},{stage,activePattern:{phase:'windup'}},{stage,dead:true},{stage,transformTimer:1}]) {
      for(let time=0;time<3;time+=0.04) {
        const sample=sampleActorAnimation('boss',state,time);
        const frame=resolveExpandedBossFrame(sample,state);
        assert.ok(frame.column>=0 && frame.column<8);
        assert.equal(frame.row, ['transform','death'].includes(sample.clipId)?3:stage-1);
      }
    }
  }
});

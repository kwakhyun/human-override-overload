import assert from 'node:assert/strict';
import test from 'node:test';
import { createPortraitMotion, portraitFit, PORTRAIT_RIGS, reactionEnvelope, TOUCH_AREAS } from '../src/ui/portrait/portraitMotion.js';
import { getPlayableCharacters } from '../src/game/content/characters.js';
import { PORTRAIT_LANDMARKS } from '../src/ui/portrait/portraitFraming.js';

test('every current operative has a calibrated portrait rig and five distinct reactions',()=>{
  assert.deepEqual(Object.keys(PORTRAIT_RIGS).sort(),getPlayableCharacters().map(c=>c.id).sort());
  for(const id of Object.keys(PORTRAIT_RIGS)) {
    const poses=[];
    for(const area of TOUCH_AREAS){
      const motion=createPortraitMotion(id);assert.equal(motion.react(area),true);
      for(let i=0;i<48;i++)motion.update(1/60);
      assert.ok([...motion.output.pose].every(Number.isFinite));
      poses.push([...motion.output.pose].map(n=>n.toFixed(4)).join(','));
    }
    assert.equal(new Set(poses).size,5);
  }
});

test('click interruption preserves the current pose and returns to idle without runaway motion',()=>{
  const motion=createPortraitMotion('mika');motion.react('head');
  for(let i=0;i<40;i++)motion.update(1/60);
  const before=[...motion.output.pose];
  motion.react('armRight');assert.deepEqual([...motion.output.pose],before);
  motion.update(1/120);
  assert.ok(motion.output.pose.every((n,i)=>Math.abs(n-before[i])<1));
  for(let i=0;i<2000;i++){if(i%3===0)motion.react(TOUCH_AREAS[i%5]);motion.update(1/60);}
  assert.ok(motion.output.pose.every(n=>Number.isFinite(n)&&Math.abs(n)<30));
  for(let i=0;i<600;i++)motion.update(1/60);
  for(const i of [3,4,5,6,7])assert.ok(Math.abs(motion.output.pose[i])<.001);
});

test('motion is stable across display refresh rates and ignores suspension catch-up',()=>{
  const samples=[30,60,144].map(rate=>{
    const motion=createPortraitMotion('aegis');motion.react('chest');
    for(let i=0;i<rate;i++)motion.update(1/rate);
    return [...motion.output.pose];
  });
  samples.slice(1).forEach(pose=>pose.forEach((v,i)=>assert.ok(Math.abs(v-samples[0][i])<.08)));
  const motion=createPortraitMotion('nox');motion.react('legs');motion.update(120);
  assert.ok(motion.output.pose.every(n=>Number.isFinite(n)&&Math.abs(n)<1));
  motion.update(Number.NaN);assert.ok(motion.output.pose.every(Number.isFinite));
});

test('reduced motion returns all deformation channels to the exact source pose',()=>{
  const motion=createPortraitMotion('vesper');motion.react('chest');
  for(let i=0;i<50;i++)motion.update(1/60);
  motion.update(1/60,true);
  assert.deepEqual([...motion.output.pose],Array(8).fill(0));
  assert.equal(motion.output.blink,0);assert.equal(motion.output.breath,0);assert.equal(motion.output.hair,0);
});

test('head translation and rotation stay neutral during clicks, idle and pointer tracking',()=>{
  for (const id of Object.keys(PORTRAIT_RIGS)) {
    const motion = createPortraitMotion(id);
    for (const area of TOUCH_AREAS) {
      motion.look(1, -1); motion.react(area);
      for (let i = 0; i < 200; i++) {
        motion.update(1 / 60);
        assert.deepEqual([...motion.output.pose.slice(0, 3)], [0, 0, 0]);
      }
    }
    assert.ok(motion.output.breath > 0, 'breathing remains active');
  }
});

test('operative framing equalizes head scale and crown height without stretching the source',()=>{
  for(const [w,h] of [[650,820],[380,720],[200,100],[800,280]]){
    const heads=[];
    for(const [id,head] of Object.entries(PORTRAIT_LANDMARKS)) {
      const fit=portraitFit(w,h,id),scale=fit.height/1280;
      assert.ok(Math.abs(fit.width/fit.height-960/1280)<1e-10);
      assert.ok(Math.abs(fit.left*2+fit.width-w)<1e-10);
      assert.ok(fit.top+fit.height>=h,'Source cut edge must remain below the display frame');
      heads.push([fit.top+head.crown*scale,(head.chin-head.crown)*scale]);
    }
    heads.forEach(head=>head.forEach((value,i)=>assert.ok(Math.abs(value-heads[0][i])<1e-8)));
  }
  assert.equal(reactionEnvelope(0),0);assert.equal(reactionEnvelope(3),0);
  assert.ok(Math.abs(reactionEnvelope(2.9-1e-4))<1e-8);
});

test('lobby and profile reduce the artwork while preserving aligned faces and concealed lower cuts',()=>{
  for (const [w,h] of [[650,820],[460,762],[390,420],[200,100],[800,280]]) {
    for (const [presentation,ratio] of [['lobby',.8],['profile',.82]]) {
      const crowns=[];
      for (const [id,head] of Object.entries(PORTRAIT_LANDMARKS)) {
        const original=portraitFit(w,h,id),fit=portraitFit(w,h,id,presentation);
        assert.ok(Math.abs(fit.width/original.width-ratio)<1e-10);
        assert.ok(Math.abs(fit.width/fit.height-.75)<1e-10);
        assert.ok(Math.abs(fit.left*2+fit.width-w)<1e-8);
        assert.ok(fit.top+fit.height>=h-1e-8);
        const crown=fit.top+head.crown*fit.height/1280;
        assert.ok(crown>=0 && crown<h);
        crowns.push(crown);
      }
      crowns.forEach(crown=>assert.ok(Math.abs(crown-crowns[0])<1e-8));
    }
  }
});

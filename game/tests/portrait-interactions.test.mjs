import test from 'node:test';
import assert from 'node:assert/strict';
import {PORTRAIT_TOUCH_ZONES,PORTRAIT_REACTIONS,createPortraitDialogue} from '../src/ui/portrait/portraitInteractions.js';
import {createCubismMotion} from '../src/ui/portrait/cubismMotion.js';
import {getPlayableCharacters} from '../src/game/content/characters.js';

test('each operative has eleven distinct non-overlapping source-space touch areas with authored dialogue',()=>{
  for(const {id} of getPlayableCharacters()){
    const zones=PORTRAIT_TOUCH_ZONES[id];assert.equal(zones.length,11);
    const lines=[];
    for(const z of zones){
      const [x,y,w,h]=z.bounds;assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=960&&y+h<=1280);
      assert.equal(createCubismMotion(id).react(z.motion),true);
      assert.equal(PORTRAIT_REACTIONS[id][z.key].length,2);lines.push(...PORTRAIT_REACTIONS[id][z.key]);
      for(const other of zones.filter(o=>o!==z)){
        const [a,b,c,d]=other.bounds;
        assert.ok(x+w<=a||a+c<=x||y+h<=b||b+d<=y,`${id}: ${z.key} overlaps ${other.key}`);
      }
    }
    assert.equal(new Set(lines).size,22);
  }
});
test('dialogue alternates per body area and a new portrait starts with its own first line',()=>{
  for(const id of Object.keys(PORTRAIT_TOUCH_ZONES)){
    const next=createPortraitDialogue(id),expected=PORTRAIT_REACTIONS[id];
    assert.equal(next('hair'),expected.hair[0]);
    assert.equal(next('face'),expected.face[0]);
    assert.equal(next('hair'),expected.hair[1]);
    assert.equal(next('hair'),expected.hair[0]);
    assert.equal(next('face'),expected.face[1]);
    assert.equal(next('invalid'),null);
    assert.equal(createPortraitDialogue(id)('hair'),expected.hair[0]);
  }
});

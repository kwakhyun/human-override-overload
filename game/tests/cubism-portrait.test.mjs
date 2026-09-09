import test from 'node:test';
import assert from 'node:assert/strict';
import { createCubismMotion } from '../src/ui/portrait/cubismMotion.js';
import { remapCubismUVs } from '../src/ui/portrait/cubismRenderer.js';

test('Cubism motion remains bounded and keeps the head neutral through repeated interactions',()=>{
  for(const id of ['aegis','mika','vesper','nox']){
    const motion=createCubismMotion(id);let closed=false,opened=false;
    for(let n=0;n<2400;n++){
      if(n%7===0)motion.react(['head','chest','armLeft','armRight','legs'][n%5]);
      motion.look(n%2?1:-1);const p=motion.update(1/60);
      assert.ok(Object.values(p).every(v=>Number.isFinite(v)&&Math.abs(v)<=1));
      assert.deepEqual([p.ParamAngleX,p.ParamAngleY,p.ParamAngleZ],[0,0,0]);
      closed ||= p.ParamEyeLOpen===0;opened ||= p.ParamEyeLOpen===1;
    }
    assert.ok(closed&&opened);
    const p=motion.update(120,true);
    for(const [key,value] of Object.entries(p))assert.equal(value,key.includes('Eye')?1:0);
    assert.equal(motion.react('head'),false);
  }
});

test('left arm reaction is independent and refresh-rate integration is stable',()=>{
  const baseline=createCubismMotion('mika'), touched=createCubismMotion('mika');
  touched.react('armLeft');
  for(let i=0;i<20;i++){baseline.update(1/60);touched.update(1/60);}
  assert.equal(baseline.output.ParamArmR,touched.output.ParamArmR);
  assert.ok(Math.abs(baseline.output.ParamArmL-touched.output.ParamArmL)>.01);
  const samples=[30,60,144].map(rate=>{
    const m=createCubismMotion('nox');m.react('head');
    for(let i=0;i<rate*2;i++)m.update(1/rate);return {...m.output};
  });
  for(const p of samples.slice(1))for(const key of Object.keys(p))assert.ok(Math.abs(p[key]-samples[0][key])<.01,key);
});

test('UV compilation preserves source coordinates across pages and rejects missing materials',()=>{
  const model={canvasinfo:{PixelsPerUnit:100,CanvasOriginX:50,CanvasOriginY:80},drawables:{count:1,ids:['Eye'],vertexPositions:[new Float32Array([-.3,.5,.1,.1])]}};
  const layout={size:256,meshes:{Eye:{page:1,source:[20,30,60,70],atlas:[16,24,40,40]}}};
  const [result]=remapCubismUVs(model,layout);
  assert.equal(result.page,1);
  [16/256,24/256,56/256,64/256].forEach((v,i)=>assert.ok(Math.abs(v-result.uv[i])<1e-7));
  assert.throws(()=>remapCubismUVs(model,{...layout,meshes:{}}),/Missing Cubism material/);
});

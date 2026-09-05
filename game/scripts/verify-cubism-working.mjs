// Verifies the Editor-authored working model, not production rig completeness.
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const out='qa/cubism-editor-2026-09-05';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:1080}});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
try{
  await page.goto('http://localhost:4174/tools/cubism-editor-review.html');
  await page.waitForFunction(()=>document.body.dataset.ready||document.body.dataset.error);
  assert.equal(await page.evaluate(()=>document.body.dataset.error),undefined);
  await page.locator('#neutral').click();
  const report=await page.evaluate(()=>{
    const r=window.__cubismReview;
    const neutral=r.snapshot(0,0),breath=r.snapshot(1,0),left=r.snapshot(0,-30),right=r.snapshot(0,30),returned=r.snapshot(0,0);
    const delta=sample=>{
      let max=0,lowerMax=0,changed=0;
      neutral.forEach((v,j)=>v.forEach((x,i)=>{
        const d=Math.abs(sample[j][i]-x);max=Math.max(max,d);if(d>1e-6)changed++;
        if(v[Math.floor(i/2)*2+1]<-.3)lowerMax=Math.max(lowerMax,d);
      }));return {max,lowerMax,changed};
    };
    return {artMeshes:r.model.drawables.count,parameters:r.model.parameters.ids,mocVersion:r.mocVersion,canvas:r.model.canvasinfo,breath:delta(breath),left:delta(left),right:delta(right),returned:delta(returned),finite:[neutral,breath,left,right].flat(2).every(Number.isFinite)};
  });
  assert.ok(report.finite);
  for(const key of ['breath','left','right'])assert.ok(report[key].max>1e-4,`${key} has no authored deformation`);
  assert.ok(report.returned.max<1e-6,'Neutral shape does not return exactly');
  assert.ok(report.breath.lowerMax<1e-5,'Breath moves lower-body anchor');
  await page.screenshot({path:`${out}/neutral.png`});
  await page.locator('#head').fill('30');
  await page.waitForTimeout(80);
  await page.screenshot({path:`${out}/head-right.png`});
  await page.locator('#neutral').click();
  await page.locator('#idle').check();
  const a=await page.evaluate(()=>Array.from(window.__cubismReview.model.drawables.vertexPositions[0]));
  await page.waitForTimeout(1200);
  const b=await page.evaluate(()=>Array.from(window.__cubismReview.model.drawables.vertexPositions[0]));
  report.idleChanges=a.some((x,i)=>Math.abs(x-b[i])>1e-5);
  assert.ok(report.idleChanges,'Idle does not drive breathing');
  await page.locator('#portrait').click();
  await page.waitForTimeout(500);
  report.clickHead=await page.evaluate(()=>{const p=window.__cubismReview.model.parameters;return p.values[p.ids.indexOf('ParamAngleZ')];});
  assert.ok(Math.abs(report.clickHead)>2,'Click does not drive head keyform');
  await page.waitForTimeout(1900);
  report.clickRecovered=await page.evaluate(()=>{const p=window.__cubismReview.model.parameters;return p.values[p.ids.indexOf('ParamAngleZ')];});
  assert.ok(Math.abs(report.clickRecovered)<.01);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForTimeout(100);
  report.reduced=await page.evaluate(()=>{const p=window.__cubismReview.model.parameters;return ['ParamBreath','ParamAngleZ'].map(id=>p.values[p.ids.indexOf(id)]);});
  assert.deepEqual(report.reduced,[0,0]);
  assert.deepEqual(errors,[]);
  report.errors=errors;report.scope='AEGIS single-art working model only; not a production quality certificate';
  await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}

// Actual Cubism Core export verification, including source-alpha seam audit.
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('playwright');
const out='qa/cubism-parts-v2-2026-09-06';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1180,height:1100}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:4174/tools/cubism-parts-v2-review.html');
 await page.waitForFunction(()=>document.body.dataset.ready||document.body.dataset.error);
 assert.equal(await page.getAttribute('body','data-error'),null);
 await page.locator('#neutral').click();
 const report=await page.evaluate(async()=>{
  const {model,snapshot,pixels}=window.__cubismReview,d=model.drawables;
  const n=snapshot(0,0,0);
  const samples=[['breath',1,0,0],['front-positive',0,1,0],['front-negative',0,-1,0],['back-positive',0,0,1],['back-negative',0,0,-1],['arm-positive',0,0,0,1],['arm-negative',0,0,0,-1],['combined',.78,.7,-.7,.8]].map(([name,...v])=>{
   const x=snapshot(...v);return {name,changes:x.map((p,i)=>({id:d.ids[i],maxDelta:Math.max(...p.map((a,j)=>Math.abs(a-n[i][j])))})).filter(a=>a.maxDelta>1e-6),invalidVertices:x.flat().filter(a=>!Number.isFinite(a)).length};
  });
  const restored=snapshot(0,0,0),rgba=pixels();
  const image=new Image();image.src='/reference/source-assets/overload/runtime-inputs/pre-anime-2026-09-09/hero/survivor-portrait-v2.webp';await image.decode();
  const c=document.createElement('canvas');c.width=864;c.height=1536;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);const source=ctx.getImageData(0,0,864,1536).data;
  let opaqueInterior=0,alphaHoles=0;const holeSamples=[];
  for(let y=3;y<1533;y++)for(let x=3;x<861;x++){
   let interior=true;for(let dy=-2;dy<=2&&interior;dy++)for(let dx=-2;dx<=2;dx++)if(source[((y+dy)*864+x+dx)*4+3]!==255){interior=false;break;}
   if(!interior)continue;opaqueInterior++;const a=rgba[((1535-y)*864+x)*4+3];if(a<240){alphaHoles++;if(holeSamples.length<20)holeSamples.push({x,y,alpha:a});}
  }
  const jointCoverage=[];
  for(const breath of [0,.78,1])for(const arm of [-1,1]){
   snapshot(breath,0,0,arm);const frame=pixels();let tested=0,holes=0;
   // Only the elbow's deeply opaque overlap interior; outer silhouette may move.
   for(let y=780;y<845;y++)for(let x=205;x<270;x++){
    let inside=true;for(let dy=-5;dy<=5&&inside;dy++)for(let dx=-5;dx<=5;dx++)if(source[((y+dy)*864+x+dx)*4+3]!==255){inside=false;break;}
    if(inside){tested++;if(frame[((1535-y)*864+x)*4+3]<240)holes++;}
   }jointCoverage.push({breath,arm,tested,holes});
  }
  snapshot(0,0,0,0);
  return {status:'Technical and seam audit; not a full production-art approval',drawables:d.count,parameters:[...model.parameters.ids],samples,jointCoverage,restoredDelta:Math.max(...restored.flatMap((p,i)=>p.map((a,j)=>Math.abs(a-n[i][j])))),invalidUVs:d.vertexUvs.flatMap(v=>[...v]).filter(n=>!Number.isFinite(n)||n<0||n>1).length,opaqueInterior,alphaHoles,holeSamples};
 });
 assert.equal(report.drawables,24);assert.equal(report.invalidUVs,0);assert.equal(report.restoredDelta,0);
 assert.equal(report.alphaHoles,0,'Neutral opaque interior must remain covered');
 for(const s of report.jointCoverage){assert.ok(s.tested>1000);assert.equal(s.holes,0,`Elbow gap at breath ${s.breath}, arm ${s.arm}`);}
 for(const s of report.samples.filter(s=>s.name.startsWith('arm-')))assert.deepEqual(s.changes.map(x=>x.id).sort(),['Cuff_ScreenL','Forearm_ScreenL','Hand_ScreenL']);
 for(const s of report.samples){assert.equal(s.invalidVertices,0);assert.ok(s.changes.length>0,`${s.name} has no authored deformation`);if(s.name.startsWith('front-'))assert.deepEqual(s.changes.map(x=>x.id),['Hair_Fringe_Center']);if(s.name.startsWith('back-'))assert.deepEqual(s.changes.map(x=>x.id),['Hair_Back_ScreenL']);}
 await page.screenshot({path:out+'/neutral.png',fullPage:true});
 await page.locator('#compare').click();assert.equal(await page.locator('.stage').getAttribute('data-source'),'true');
 await page.locator('#compare').click();assert.equal(await page.locator('.stage').getAttribute('data-source'),'false');
 await page.locator('#arm').fill('1');await page.locator('#arm').dispatchEvent('input');
 await page.waitForFunction(()=>document.getElementById('armValue').value==='1.00');await page.screenshot({path:out+'/arm-positive.png',fullPage:true});
 await page.locator('#arm').fill('-1');await page.locator('#arm').dispatchEvent('input');
 await page.waitForFunction(()=>document.getElementById('armValue').value==='-1.00');await page.screenshot({path:out+'/arm-negative.png',fullPage:true});
 await page.locator('#neutral').click();
 const zoneIsolation=await page.evaluate(()=>{const r=window.__cubismReview;r.kick('arm');const a=r.motionState();document.getElementById('neutral').click();r.kick('head');const h=r.motionState();document.getElementById('neutral').click();return a.front.v===0&&a.rear.v===0&&a.elbow.v!==0&&h.elbow.v===0&&h.front.v!==0;});assert.ok(zoneIsolation);
 await page.locator('#idle').check();
 await page.waitForFunction(()=>Number(document.getElementById('breathValue').value)>.4);
 await page.screenshot({path:out+'/idle.png',fullPage:true});
 await page.locator('#neutral').click();await page.locator('#react').click();
 await page.waitForFunction(()=>Math.abs(Number(document.getElementById('headValue').value))>.05);
 const continuous=await page.evaluate(()=>{const r=window.__cubismReview,before=r.motionState();r.kick();const after=r.motionState();return ['front','rear','elbow'].every(k=>before[k].x===after[k].x);});assert.ok(continuous,'Repeated clicks must preserve current position');
 await page.waitForFunction(()=>Math.abs(Number(document.getElementById('headValue').value))<.01&&Math.abs(Number(document.getElementById('backValue').value))<.01,null,{timeout:6000});
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#react').click();
 assert.equal(await page.locator('#armValue').textContent(),'0.00');
 assert.equal(await page.locator('#headValue').textContent(),'0.00');assert.equal(await page.locator('#breathValue').textContent(),'0.00');assert.deepEqual(errors,[]);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:out+'/mobile.png',fullPage:true});
 await writeFile(out+'/report.json',JSON.stringify({...report,clickRecovery:true,clickPositionContinuity:continuous,zoneIsolation,reducedMotion:true,errors},null,2));
 console.log(JSON.stringify(report));
}finally{await browser.close();}

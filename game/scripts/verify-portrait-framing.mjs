// Focused browser check for shared operative scale and source/hit-map alignment.
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('playwright');
const output='qa/portrait-framing-2026-09-05';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:960},reducedMotion:'reduce'});
const errors=[],report={};page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto('http://localhost:4174/');
 await page.getByRole('button',{name:'게임 시작 · 헤이븐-09',exact:true}).click();
 await page.getByRole('button',{name:/SLOT 01 신규/}).click();
 await page.locator('.interactive-portrait.is-rendered').waitFor();await page.keyboard.press('Escape');
 for(const [screen,viewport] of [['desktop',{width:1440,height:960}],['mobile',{width:390,height:844}]]){
  await page.setViewportSize(viewport);
  await page.screenshot({path:`${output}/${screen}-lobby.png`});
  await page.locator('.base-character-action').click();
  report[screen]=[];
  for(const [id,name] of [['aegis','이지스'],['mika','미카'],['vesper','베스퍼'],['nox','녹스']]){
   if(id!=='aegis')await page.getByRole('button',{name:new RegExp(`${name} 미리보기`)}).click();
   await page.locator('.character-art-stage .interactive-portrait.is-rendered').waitFor();
   // ResizeObserver must settle after a character remount before sampling.
   await page.waitForTimeout(60);
   const metrics=await page.evaluate(async id=>{
    const {PORTRAIT_LANDMARKS}=await import('/src/ui/portrait/portraitFraming.js');
    const root=document.querySelector('.character-art-stage .interactive-portrait');
    const img=root.querySelector('img').getBoundingClientRect(),hit=root.querySelector('.portrait-touch-map').getBoundingClientRect(),stage=root.getBoundingClientRect();
    const head=PORTRAIT_LANDMARKS[id],scale=img.height/1536;
    return {id,crown:img.top-stage.top+head.crown*scale,headHeight:(head.chin-head.crown)*scale,
     source:[img.x,img.y,img.width,img.height],hit:[hit.x,hit.y,hit.width,hit.height],stage:[stage.width,stage.height]};
   },id);
   metrics.source.forEach((value,i)=>assert.ok(Math.abs(value-metrics.hit[i])<.1,`${id}: hit map drift`));
   report[screen].push(metrics);
   await page.screenshot({path:`${output}/${screen}-${id}.png`});
  }
  for(const metrics of report[screen]){
   assert.ok(Math.abs(metrics.headHeight-report[screen][0].headHeight)<.1,'Head scale differs');
   assert.ok(Math.abs(metrics.crown-report[screen][0].crown)<.1,'Crown alignment differs');
  }
  await page.evaluate(()=>document.querySelector('.character-art-stage canvas').getContext('webgl').getExtension('WEBGL_lose_context').loseContext());
  await page.locator('.character-art-stage [data-portrait-renderer="static-fallback"]').waitFor();
  await page.screenshot({path:`${output}/${screen}-fallback.png`});
  await page.getByRole('button',{name:'전투원 정보 닫기'}).click();
 }
 assert.deepEqual(errors,[]);report.errors=errors;
 await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}

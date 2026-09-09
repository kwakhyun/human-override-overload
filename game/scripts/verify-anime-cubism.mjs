// Run against a local dev server. Uses a new browser profile and synthetic save.
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createEmptyCampaign,completeRegion,consumeCampaignPostVictoryStep,getCampaignPostVictorySteps,CAMPAIGN_SAVE_KEY } from '../src/game/save/campaignSave.js';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,...(process.env.EDGE_EXECUTABLE?{executablePath:process.env.EDGE_EXECUTABLE}:{})});
const root=process.env.QA_BASE_URL||'http://127.0.0.1:4174';
const output=process.env.QA_OUTPUT||'qa/cubism-anime-2026-09-09';await mkdir(output,{recursive:true});
const names=[['aegis','이지스'],['mika','미카'],['vesper','베스퍼'],['nox','녹스']];
let campaign=createEmptyCampaign();
for(const id of ['wrong-engine-core','glass-dune','abyssal-archive','neon-foundry','storm-spire','gene-vault']){
  campaign=completeRegion(campaign,'slot-1',id,{status:'victory',runId:'cubism-qa-'+id});
  for(const step of getCampaignPostVictorySteps(campaign,'slot-1'))campaign=consumeCampaignPostVictoryStep(campaign,'slot-1',step);
}
const context=await browser.newContext({viewport:{width:1440,height:900}});
await context.addInitScript(({key,value})=>{
  localStorage.setItem(key,JSON.stringify(value));
  const getContext=HTMLCanvasElement.prototype.getContext;
  window.__rigGPU=[];
  HTMLCanvasElement.prototype.getContext=function(...args){
    const gl=getContext.apply(this,args);
    if(gl&&args[0]==='webgl'&&!gl.__tracked){
      gl.__tracked=true;const stats={draws:0,buffers:0,textures:0,uploads:0};Object.defineProperty(stats,'connected',{enumerable:true,get:()=>this.isConnected});window.__rigGPU.push(stats);
      for(const [method,field,amount] of [['drawElements','draws',1],['createBuffer','buffers',1],['deleteBuffer','buffers',-1],['createTexture','textures',1],['deleteTexture','textures',-1],['texImage2D','uploads',1]]){
        const original=gl[method].bind(gl);gl[method]=(...a)=>{stats[field]+=amount;return original(...a);};
      }
    }return gl;
  };
},{key:CAMPAIGN_SAVE_KEY,value:campaign});
const page=await context.newPage(),errors=[],reports=[];
page.on('pageerror',e=>errors.push(e.message));
const stats=()=>page.evaluate(()=>window.__rigGPU.map(s=>({...s})));
const wait=ms=>page.waitForTimeout(ms);
try{
  await page.goto(root);await page.locator('.intro-start:not([disabled])').click();
  await page.locator('.save-slot-card').first().click();await page.locator('.home-base-screen').waitFor();await page.keyboard.press('Escape');
  await page.locator('[data-portrait-renderer=cubism]').waitFor();
  assert.equal(await page.getByText('터치 상호작용',{exact:true}).count(),0);
  await page.locator('.home-base-screen [data-portrait-zone=face]').click();
  assert.equal(await page.locator('.home-base-screen .portrait-reaction-speech').getAttribute('data-reaction-area'),'face');
  await page.screenshot({path:output+'/lobby-desktop.png'});
  await page.locator('.motion-portrait-caption').click();
  for(const [id,name] of names){
    await page.getByRole('button',{name:name+' 정보 보기',exact:true}).click();
    await page.locator('.character-art-stage [data-portrait-renderer=cubism]').waitFor();
    const before=await stats();await wait(300);const after=await stats();
    assert.ok(after.at(-1).draws>before.at(-1).draws,'Active model renders');
    assert.equal(after.at(-1).uploads,before.at(-1).uploads,'No per-frame texture uploads');
    for(const s of after.filter(s=>!s.connected))assert.equal(s.buffers+s.textures,0,'Retired profile resources released');
    for(const zone of ['hair','face','collar','shoulderLeft','shoulderRight','chest','armLeft','armRight','handLeft','handRight','gear']) {
      await page.locator('.character-art-stage [data-portrait-zone='+zone+']').click();
      assert.equal(await page.locator('.character-art-stage .portrait-reaction-speech').getAttribute('data-reaction-area'),zone);
    }
    await page.emulateMedia({reducedMotion:'reduce'});await wait(100);const stopped=await stats();await wait(200);assert.equal((await stats()).at(-1).draws,stopped.at(-1).draws);
    await page.screenshot({path:output+'/profile-'+id+'-desktop.png'});
    for(const [width,height,label] of [[390,844,'portrait'],[844,390,'landscape']]){
      await page.setViewportSize({width,height});await wait(100);
      const rect=await page.locator('.character-art-stage canvas').boundingBox();assert.ok(rect.width>0&&rect.height>0);
      await page.locator('.character-art-stage [data-portrait-zone=face]').click();
      assert.equal(await page.locator('.character-art-stage .portrait-reaction-speech').getAttribute('data-reaction-area'),'face');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
      await page.screenshot({path:output+'/profile-'+id+'-'+label+'.png'});
    }
    await page.setViewportSize({width:1440,height:900});await page.emulateMedia({reducedMotion:'no-preference'});
    reports.push({id,touchAreas:11,mobileFaceTouch:true,texturePages:after.at(-1).textures,activeDraws:true,reducedMotion:true,viewports:3});
  }
  await page.locator('.character-art-stage canvas').evaluate(c=>c.getContext('webgl').getExtension('WEBGL_lose_context').loseContext());
  await page.locator('.character-art-stage [data-portrait-renderer=static-fallback]').waitFor();
  assert.equal((await stats()).at(-1).buffers+(await stats()).at(-1).textures,0);
  assert.ok(await page.locator('.character-art-stage .portrait-source').evaluate(e=>e.complete&&e.naturalWidth===960));
  await page.route('**/vesper-anime-v2.moc3',route=>route.abort());
  await page.getByRole('button',{name:'베스퍼 정보 보기',exact:true}).click();
  await wait(500);
  assert.equal(await page.locator('.character-art-stage [data-portrait-renderer]').getAttribute('data-portrait-renderer'),'static-fallback');
  assert.ok(await page.locator('.character-art-stage .portrait-source').evaluate(e=>e.complete&&e.naturalWidth===960));
  assert.deepEqual(errors,[]);
  await writeFile(output+'/browser-report.json',JSON.stringify({reports,errors,contextLossFallback:true,assetFailureFallback:true,gpuCleanup:true},null,2));
  console.log(JSON.stringify({reports,errors,contextLossFallback:true,assetFailureFallback:true,gpuCleanup:true}));
}finally{await browser.close();}

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH || 'C:/Users/82105/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.SFX_TEST_URL || 'http://127.0.0.1:4174';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',args:['--autoplay-policy=no-user-gesture-required']});
const out=new URL('../qa/sfx-samples/',import.meta.url);
await mkdir(out,{recursive:true});
const errors=[],requests=[],report={};
try {
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().includes('/audio/sfx/'))requests.push({url:r.url(),status:r.status()});});
 await page.addInitScript(()=>{
   const bytes=new WeakMap(),buffers=new WeakMap();
   window.__sfxPlayed=[];
   const fetchOriginal=window.fetch;
   window.fetch=async(...args)=>{
     const response=await fetchOriginal(...args);
     if(String(args[0]).includes('/audio/sfx/')){
       const read=response.arrayBuffer.bind(response);
       response.arrayBuffer=async()=>{const result=await read();bytes.set(result,String(args[0]));return result;};
     }
     return response;
   };
   const decode=BaseAudioContext.prototype.decodeAudioData;
   BaseAudioContext.prototype.decodeAudioData=function(data,...args){
     const path=bytes.get(data);
     const result=decode.call(this,data,...args);
     return result.then(buffer=>{if(path)buffers.set(buffer,path);return buffer;});
   };
   const start=AudioBufferSourceNode.prototype.start;
   AudioBufferSourceNode.prototype.start=function(...args){
     const path=buffers.get(this.buffer);
     if(path)window.__sfxPlayed.push({path,time:performance.now(),state:this.context.state});
     return start.apply(this,args);
   };
 });
 await page.goto(base+'/?debug=1&scene=sector1');
 await page.locator('.intro-start:not([disabled])').waitFor({timeout:45000});
 report.bank=await page.evaluate(async()=>{
   const {createSfxEngine}=await import('/src/audio/sfx.js');
   const {SFX_SAMPLES}=await import('/src/audio/sfxSamples.js');
   const engine=createSfxEngine();await engine.start();
   const ready=engine.getDiagnostics();
   for(const name of Object.keys(SFX_SAMPLES)){
     engine.play(name);
     await new Promise(resolve=>setTimeout(resolve,90));
   }
   await new Promise(resolve=>setTimeout(resolve,2100));
   const after=engine.getDiagnostics();engine.dispose();
   return {ready,after,events:Object.keys(SFX_SAMPLES).length};
 });
 assert.equal(report.bank.ready.ready,38);assert.equal(report.bank.ready.failures,0);
 assert.equal(report.bank.after.samplePlays,report.bank.events);
 assert.equal(report.bank.after.activeVoices,0);
 await page.locator('.intro-start:not([disabled])').click();
 await page.locator('.save-slot-card').first().click();
 await page.locator('.home-base-screen').waitFor();
 await page.evaluate(()=>{
   const key='train-me-wrong.overload.campaign.v2',campaign=JSON.parse(localStorage.getItem(key));
   campaign.slots[0].completedRegionIds=['wrong-engine-core','glass-dune','abyssal-archive','neon-foundry'];
   campaign.slots[0].progression.augmentationRanks={...campaign.slots[0].progression.augmentationRanks,'aegis-skill-link':3};
   localStorage.setItem(key,JSON.stringify(campaign));
 });
 await page.reload();
 await page.locator('.intro-start:not([disabled])').click({timeout:45000});
 await page.locator('.save-slot-card').first().click();
 await page.locator('.home-base-screen').waitFor();
 if(await page.locator('.base-dialogue:visible').count())await page.keyboard.press('Escape');
 await page.locator('.base-sortie-action').click();
 await page.locator('.region-map-hotspot').first().click();
 await page.locator('.region-card').first().click();
 await page.locator('.region-sortie-launch').click();
 const q=page.locator('[data-combat-ability="empPulse"]');
 await q.waitFor({timeout:30000}).catch(async error=>{
   await page.screenshot({path:new URL('blocked.png',out).pathname.replace(/^\/([A-Z]:)/,'$1')});
   console.log(JSON.stringify({body:(await page.locator('body').innerText()).slice(-2500),errors,bank:report.bank}));
   throw error;
 });
 await page.waitForFunction(()=>document.querySelector('[data-combat-ability="empPulse"]')?.dataset.skillState==='ready',{},{timeout:60000});
 await page.mouse.move(750,220);
 await page.waitForFunction(()=>window.__sfxPlayed.some(item=>item.path.includes('pulse-')));
 await page.locator('[data-combat-ability="dash"]').click();
 await q.click();
 await page.locator('[data-combat-ability="aegisWard"]').click();
 await page.waitForFunction(()=>['pulse-','dash.wav','emp.wav','shield.wav'].every(part=>window.__sfxPlayed.some(item=>item.path.includes(part))),{},{timeout:20000}).catch(async error=>{
   await page.screenshot({path:new URL('audio-blocked.png',out).pathname.replace(/^\/([A-Z]:)/,'$1')});
   console.log(JSON.stringify({played:await page.evaluate(()=>[...new Set(window.__sfxPlayed.map(item=>item.path))]),body:(await page.locator('body').innerText()).slice(-1800),errors,bank:report.bank}));
   throw error;
 });
 await page.keyboard.press('Escape');
 const count=await page.evaluate(()=>window.__sfxPlayed.filter(i=>i.path.includes('pulse-')).length);
 await page.waitForTimeout(1200);
 assert.equal(await page.evaluate(()=>window.__sfxPlayed.filter(i=>i.path.includes('pulse-')).length),count,'pause must stop automatic shots');
 await page.keyboard.press('Escape');
 await page.screenshot({path:new URL('desktop.png',out).pathname.replace(/^\/([A-Z]:)/,'$1')});
 report.combat=await page.evaluate(()=>({played:window.__sfxPlayed.length,paths:[...new Set(window.__sfxPlayed.map(i=>i.path))],contexts:[...new Set(window.__sfxPlayed.map(i=>i.state))]}));
 await page.setViewportSize({width:390,height:844});
 await page.waitForTimeout(250);
 await page.screenshot({path:new URL('portrait.png',out).pathname.replace(/^\/([A-Z]:)/,'$1')});
 report.errors=errors;report.failedSampleRequests=requests.filter(r=>r.status!==200);
 assert.deepEqual(errors,[]);assert.deepEqual(report.failedSampleRequests,[]);
 await writeFile(new URL('report.json',out),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}

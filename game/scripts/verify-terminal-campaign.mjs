import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createEmptyCampaign, completeRegion, getCampaignPostVictorySteps, consumeCampaignPostVictoryStep, CAMPAIGN_SAVE_KEY } from '../src/game/save/campaignSave.js';
import { getCampaignRegions } from '../src/game/content/campaign.js';
import { terminalQaProgression } from './simulate-terminal-campaign.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH || 'C:/Users/82105/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.TERMINAL_QA_URL || 'http://127.0.0.1:4174';
const screensOnly=process.argv.includes('--screens-only');
const out=new URL('../qa/terminal-orbit/browser/',import.meta.url);await mkdir(out,{recursive:true});
let seed=createEmptyCampaign();
for(const r of getCampaignRegions().slice(0,6))seed=completeRegion(seed,'slot-1',r.id,{status:'victory',runId:`qa-${r.id}`});
if(screensOnly)for(const id of ['eclipse-relay','ark-transit'])seed=completeRegion(seed,'slot-1',id,{status:'victory',runId:`qa-${id}`});
for(const step of getCampaignPostVictorySteps(seed,'slot-1'))seed=consumeCampaignPostVictoryStep(seed,'slot-1',step);
seed.slots[0].progression=terminalQaProgression();seed.slots[0].abilityGuideSeen=true;seed.slots[0].combatOverlaySeen=true;
const botSource=(await readFile(new URL('./simulate-terminal-campaign.mjs',import.meta.url),'utf8'))
  .replace(/^import .* from 'node:.*';\r?\n/gm,'').split('if(import.meta.url===')[0].replaceAll("'../src/","'/src/");
const browser=await chromium.launch({headless:true,executablePath:process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const errors=[],evidence=[];
async function shot(page,name){await page.screenshot({path:fileURLToPath(new URL(`${name}.png`,out))});}
async function advanceDialogue(page){
  for(let i=0;i<15;i++){
    const button=page.locator('.narrative-panel button');
    if(!await button.count())break;
    await button.click();await page.waitForTimeout(35);
  }
}
async function launch(page,index){
  if(await page.locator('.base-dialogue:visible').count())await page.keyboard.press('Escape');
  await page.locator('.base-sortie-action').click();
  await page.locator('.region-map-hotspot').nth(2).click();
  await page.locator('.region-card').nth(index).click();
  await page.locator('.region-sortie-repeat-intel summary').click();
  await page.waitForTimeout(250);
  await shot(page,`${page.viewportSize().width<600?'portrait':'desktop'}-${index+7}-briefing`);
  await page.locator('.region-sortie-launch').click();
  await page.waitForFunction(()=>window.__terminalScene?.state?.expedition?.mission && window.__terminalScene.view,{timeout:60000});
  await page.waitForTimeout(800);await advanceDialogue(page);
}
try{
  for(const mobile of [false,true]){
    const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile});
    // This accessor exists only in the intercepted test response, never in the shipped application.
    await context.route('**/src/phaser/createOverloadGame.ts*',async route=>{
      const response=await route.fetch();const body=await response.text();
      assert.ok(body.includes('let destroyed = false;'));
      await route.fulfill({response,body:body.replace('let destroyed = false;','window.__terminalScene = battleScene; window.__terminalBridge = bridge; let destroyed = false;')});
    });
    await context.route('**/terminal-qa-bot.js',route=>route.fulfill({contentType:'text/javascript',body:botSource}));
    await context.addInitScript(({key,seed})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(seed));},{key:CAMPAIGN_SAVE_KEY,seed});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))errors.push(`${r.status()} ${r.url()}`);});
    await page.goto(`${base}/?debug=1&scene=sector1`);
    await page.locator('.intro-start:not([disabled])').click({timeout:60000});
    await page.locator('.save-slot-card').first().click();await page.locator('.home-base-screen').waitFor();
    const name=mobile?'portrait':'desktop';
    const runs=mobile&&!screensOnly?[0]:[0,1,2];
    for(const index of runs){
      await launch(page,index);await shot(page,`${name}-${index+7}-objective`);
      assert.equal(await page.locator('.terminal-mission-readout').count(),1);
      if(screensOnly){
        const dock=await page.locator('.skill-readiness').evaluate(el=>({bounds:el.getBoundingClientRect().toJSON(),cards:[...el.querySelectorAll('.combat-ability-chip,.combat-tag-switch')].map(c=>c.getBoundingClientRect().toJSON())}));
        for(const card of dock.cards)assert.ok(card.bottom<=page.viewportSize().height+1&&card.right<=page.viewportSize().width+1,JSON.stringify(dock));
        if(mobile){
          const before=await page.evaluate(()=>({x:window.__terminalScene.state.player.x,y:window.__terminalScene.state.player.y}));
          const cdp=await context.newCDPSession(page);
          await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:75,y:480}]});
          await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:140,y:480}]});
          await page.waitForTimeout(350);
          await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
          const after=await page.evaluate(()=>({x:window.__terminalScene.state.player.x,y:window.__terminalScene.state.player.y}));
          assert.ok(Math.hypot(after.x-before.x,after.y-before.y)>10,'touch drag must move the operative');
          await cdp.detach();
        }
        const bounds=await page.locator('.route-objective').evaluate(el=>({outer:el.getBoundingClientRect().toJSON(),children:[...el.children].filter(n=>getComputedStyle(n).display!=='none').map(n=>({text:n.textContent,rect:n.getBoundingClientRect().toJSON()}))}));
        await writeFile(new URL(`${name}-${index+7}-bounds.json`,out),JSON.stringify(bounds,null,2));
        for(const child of bounds.children){assert.ok(child.rect.left>=bounds.outer.left-1&&child.rect.right<=bounds.outer.right+1,JSON.stringify(bounds));}
        await page.reload();await page.locator('.intro-start:not([disabled])').click({timeout:60000});await page.locator('.save-slot-card').first().click();await page.locator('.home-base-screen').waitFor();
        continue;
      }
      const original=await page.evaluate(()=>({x:window.__terminalScene.state.player.x,y:window.__terminalScene.state.player.y}));
      if(mobile){
        await page.dispatchEvent('.expedition-game','pointerdown',{pointerId:17,pointerType:'touch',clientX:80,clientY:500,bubbles:true});
        await page.dispatchEvent('.expedition-game','pointermove',{pointerId:17,pointerType:'touch',clientX:125,clientY:500,bubbles:true});
        await page.waitForTimeout(350);
        await page.dispatchEvent('.expedition-game','pointerup',{pointerId:17,pointerType:'touch',clientX:125,clientY:500,bubbles:true});
      }else{await page.keyboard.down('d');await page.waitForTimeout(350);await page.keyboard.up('d');}
      const moved=await page.evaluate(()=>({x:window.__terminalScene.state.player.x,y:window.__terminalScene.state.player.y}));
      if(!mobile)assert.ok(Math.hypot(moved.x-original.x,moved.y-original.y)>10);
      await page.keyboard.press('Escape');await page.waitForTimeout(200);
      const paused=await page.evaluate(()=>window.__terminalScene.state.time);await page.waitForTimeout(300);
      assert.equal(await page.evaluate(()=>window.__terminalScene.state.time),paused);
      await page.keyboard.press('Escape');
      await page.evaluate(async()=>{window.__terminalBot=await import('/terminal-qa-bot.js');window.__terminalEngine=await import('/src/swarm/engine.js');});
      const patterns=new Set(),stages=new Set();let outcome;
      for(let iteration=0;iteration<700;iteration++){
        await advanceDialogue(page);
        outcome=await page.evaluate(({branch})=>{
          const scene=window.__terminalScene,s=scene.state;
          if(s.levelupPending){window.__terminalBot.chooseQaReward(s);scene.refreshHud();return {reward:true};}
          if(!scene.narrativePaused&&!scene.externallySuspended&&s.status==='running'&&!s.expedition.awaitingBossEntry){
            let input;
            // Only time is accelerated. All motion, damage and objective progress come from real inputs and the engine.
            for(let frame=0;frame<90&&!s.levelupPending&&s.status==='running'&&!s.expedition.awaitingBossEntry;frame++){
              if(frame%6===0)input=window.__terminalBot.terminalQaInput(s,branch);
              window.__terminalEngine.stepSwarm(s,input,1/60);
              if(frame%6!==0)for(const key of Object.keys(input))if(key.endsWith('Pressed'))input[key]=false;
            }
            scene.consumeEvents();scene.refreshHud();scene.view.render(s,scene.governor.preset);
          }
          return {time:s.time,status:s.status,phase:s.phase,stage:s.boss.stage,pattern:s.boss.activePattern?.type,mission:s.expedition.mission.progress,hp:s.player.hp,arkHp:s.expedition.mission.ark?.hp};
        },{branch:'safe'});
        if(outcome.phase==='boss'){
          if(!stages.has(outcome.stage)){stages.add(outcome.stage);await shot(page,`${name}-${index+7}-boss-stage-${outcome.stage}`);}
          if(outcome.pattern&&!patterns.has(outcome.pattern)){patterns.add(outcome.pattern);await shot(page,`${name}-${index+7}-${outcome.pattern}`);}
        }
        if(outcome.status==='defeat')throw new Error(`Browser run lost: ${JSON.stringify(outcome)}`);
        if(outcome.status==='victory')break;
        await page.waitForTimeout(35);
      }
      assert.equal(outcome.status,'victory',JSON.stringify(outcome));
      await advanceDialogue(page);await page.waitForTimeout(2200);await shot(page,`${name}-${index+7}-victory`);
      const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),CAMPAIGN_SAVE_KEY);
      const id=getCampaignRegions()[index+6].id;
      assert.ok(saved.slots[0].completedRegionIds.includes(id),`actual App onFinish must persist ${id}`);
      evidence.push({name,region:id,...outcome,patterns:[...patterns],stages:[...stages],savedRegions:saved.slots[0].completedRegionIds});
      console.log(JSON.stringify(evidence.at(-1)));
      // Reload verifies persistence and the next region's real unlock path.
      await page.reload();await page.locator('.intro-start:not([disabled])').click({timeout:60000});
      await page.locator('.save-slot-card').first().click();
      // Complete the post-victory story via its visible controls before the next launch.
      for(let i=0;i<45&&!await page.locator('.home-base-screen').count();i++){
        await page.keyboard.press('Space');await page.waitForTimeout(180);
      }
      await page.locator('.home-base-screen').waitFor({timeout:20000});
    }
    if(mobile){
      await launch(page,1);await page.setViewportSize({width:844,height:390});await page.waitForTimeout(800);await shot(page,'landscape-8-objective');
    }
    await context.close();
  }
  assert.deepEqual(errors,[]);await writeFile(new URL(screensOnly?'screen-evidence.json':'evidence.json',out),JSON.stringify({errors,evidence},null,2));
}finally{await browser.close();}

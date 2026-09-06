import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/82105/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = process.env.SPRITE_QA_URL || 'http://localhost:4174';
const output = new URL('../qa/sprite-quality-v3/', import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1');
await mkdir(output,{recursive:true});
const browser = await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const evidence=[]; const errors=[];
async function pageFor(mobile=false){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:720},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().includes('/assets/'))errors.push(`${r.status()} ${r.url()}`)});
  return page;
}
async function mount(page,regionId,characterId='aegis',weapon='pulse-rifle',debug='sector1'){
  await page.goto(base+'/?debug=1&scene='+debug);
  await page.evaluate(async({regionId,characterId,weapon})=>{
    document.querySelector('#root')?.remove();document.querySelectorAll('style,link[rel=stylesheet]').forEach(e=>e.remove());document.body.style.cssText='margin:0;width:100vw;height:100vh;overflow:hidden';
    const host=document.createElement('div');host.style.cssText='width:100vw;height:100vh';document.body.append(host);const qaStyle=document.createElement('style');qaStyle.textContent='canvas{width:100%!important;height:100%!important;display:block}';document.head.append(qaStyle);
    const {createOverloadGame}=await import('/src/phaser/createOverloadGame.ts');
    window.ready=false;
    window.audit=createOverloadGame(host,{onHud(){},onFinish(){},onEvent(e){if(e.type==='scenario')setTimeout(()=>window.audit?.continueStory(),0)},onReady(){window.ready=true}},
      {regionId,characterId,mainWeaponId:weapon,mikaUnlocked:true,vesperUnlocked:true,noxUnlocked:true,characterSkillRanks:{aegis:3,mika:3,vesper:3,nox:3},screenShakeEnabled:false,qualityPreference:innerWidth<500?'performance':'balanced'});
  },{regionId,characterId,weapon});
  await page.waitForFunction(()=>window.ready,{timeout:30000});
  await page.waitForTimeout(300);
  await page.evaluate(()=>{for(let i=0;i<12;i++)window.audit.continueStory()});
}
try {
  const page=await pageFor();
  await page.goto(base+'/tools/combat-sprite-review.html');
  await page.waitForFunction(()=>document.querySelectorAll('canvas').length>20);
  await page.waitForTimeout(1800);
  await page.waitForFunction(()=>window.__spriteReview?.getFrames().length===28&&window.__spriteReview.getFrames().every(x=>x.ready));
  for (const [id, frame] of [['storm-spire-boss',21],['gene-vault-boss',21],['neon-foundry-boss',16],['defense-directions',19],['sword-manual-skills',21]]) {
    await page.evaluate(({id,frame})=>window.__spriteReview.setFrame(id,frame),{id,frame});
    await page.waitForTimeout(80);
    await page.locator(`[data-sprite="${id}"]`).screenshot({path:output+`/fixed-${id}.png`});
  }
  await page.screenshot({path:output+'/gallery.png',fullPage:true});
  for(const region of ['wrong-engine-core','glass-dune','abyssal-archive','neon-foundry','storm-spire','gene-vault']){
    await mount(page,region,'aegis','pulse-rifle','phase3');
    await page.evaluate(()=>{const s=window.audit.game.scene.getScene('OverloadBattle');if(s.state.expedition?.midBoss)s.state.expedition.midBoss.defeated=true;window.audit.enterBossRoom();for(let i=0;i<12;i++)window.audit.continueStory()});
    await page.waitForFunction(()=>{const s=window.audit.game.scene.getScene('OverloadBattle');return s.state.phase==='boss'&&s.view?.boss?.visible&&s.view.boss.texture.key.includes('motion')},{timeout:30000});
    await page.waitForTimeout(650);
    await page.evaluate(()=>{const s=window.audit.game.scene.getScene('OverloadBattle');window.audit.setSuspended(true);s.state.boss.x=s.state.player.x+350;s.state.boss.y=s.state.player.y;s.state.boss.stage=1;s.state.boss.transformTimer=0;s.state.boss.attackTimer=0;s.state.boss.activePattern=null;s.state.boss.animationState='idle';s.state.boss.animationTimer=0;s.state.boss.hitFlash=0;s.state.boss.angle=Math.PI;s.view.render(s.state,s.governor.preset);s.cameras.main.resetFX();s.cameras.main.setZoom(0.75).centerOn(s.state.player.x+220,s.state.player.y);s.view.bossPhaseArt.setVisible(false)});
    await page.waitForTimeout(120);
    const sample=await page.evaluate(()=>{const s=window.audit.game.scene.getScene('OverloadBattle');return {phase:s.state.phase,texture:s.view.boss.texture.key,rotation:s.view.boss.rotation,frame:s.view.boss.frame.name,profile:s.assetProfile}});
    assert.equal(sample.rotation,0,region+' boss perspective');
    await page.screenshot({path:output+`/boss-${region}.png`});evidence.push({region,...sample});
    console.log('boss',region,sample.frame);
    const attackFrame=await page.evaluate(()=>{
      const s=window.audit.game.scene.getScene('OverloadBattle');
      Object.assign(s.state.boss,{stage:3,animationState:'attack',animationTimer:.4,attackTimer:.4,transformTimer:0,hitFlash:0,activePattern:{phase:'attack'}});
      s.state.time+=.4;s.view.render(s.state,s.governor.preset);s.view.bossPhaseArt.setVisible(false);
      return s.view.boss.frame.name;
    });
    assert.ok(attackFrame.includes(':2:'),region+' phase-three frame must be rendered');
    await page.waitForTimeout(100);
    await page.screenshot({path:output+`/boss-${region}-phase3.png`});
    evidence.push({region,attackFrame});
  }
  for(const character of ['aegis','mika','vesper','nox']){
    await mount(page,'neon-foundry',character);
    const cast=await page.evaluate(()=>['empPulse','aegisWard','stratosRun','helixTempest'].map(key=>({key,queued:window.audit.activateAbility(key)})));
    await page.waitForTimeout(350);
    await page.screenshot({path:output+`/skills-${character}.png`});
    const effects=await page.evaluate(()=>{const s=window.audit.game.scene.getScene('OverloadBattle');return {manual:s.state.swordManualAbilities?.length,emp:s.state.empPulses?.length,ward:s.state.aegisWards?.length,phase:s.state.phase,visible:s.view.swordManualAbilitySprites?.filter(x=>x.visible).length,cooldowns:s.state.manualAbilities}});
    assert.ok(Object.values(effects.cooldowns).every(v=>v.cooldown>0),character+' all four skills must actually fire');if(character==='mika'||character==='nox')assert.ok(effects.visible>0,character+' effects must reach renderer');evidence.push({character,cast,effects});console.log('skills',character,JSON.stringify(cast));
  }
  const mobile=await pageFor(true);await mount(mobile,'gene-vault','mika');
  await mobile.waitForTimeout(1200);await mobile.screenshot({path:output+'/mobile-route.png'});
  const profile=await mobile.evaluate(()=>window.__OVERLOAD_QA__?.getSnapshot()?.context);evidence.push({mobile:profile});
  await page.goto(base+'/');
  await page.evaluate(async()=>{
    document.querySelector('#root')?.remove();const host=document.createElement('div');host.style.cssText='width:100vw;height:100vh';document.body.append(host);const qaStyle=document.createElement('style');qaStyle.textContent='canvas{width:100%!important;height:100%!important;display:block}';document.head.append(qaStyle);
    const {createDefenseGame}=await import('/src/phaser/createDefenseGame.ts');window.ready=false;
    window.defense=createDefenseGame(host,{onHud(){},onEvent(){},onFinish(){},onReady(){window.ready=true}},'haven-perimeter');
  });
  await page.waitForFunction(()=>window.ready);
  await page.evaluate(()=>{const s=window.defense.game.scene.getScene('DefenseBattle');s.state.credits=100000;s.state.scrap=100000;s.state.currency=100000;const types=['pulseSentry','arcRelay','skyfireBattery','aegisBastion'];for(let i=0;i<4;i++){window.defense.selectNode(s.state.nodes[i].id);window.defense.buildTower(types[i]);}s.state.towers.forEach((t,i)=>{t.rank=3;t.specialization=['armorPiercer','cascade','incendiary','guardian'][i]});window.defense.startWave();});
  await page.waitForTimeout(5000);await page.screenshot({path:output+'/defense.png'});
  evidence.push({defense:await page.evaluate(()=>{const s=window.defense.game.scene.getScene('DefenseBattle');return {towers:s.state.towers.length,enemies:s.state.enemies.length,frames:[...s.view.enemySprites.values()].map(x=>x.frame.name),rotations:[...s.view.enemySprites.values()].map(x=>x.rotation)}})});
  assert.deepEqual(errors,[]);
  await writeFile(output+'/runtime-report.json',JSON.stringify({evidence,errors},null,2));
}finally{await browser.close()}

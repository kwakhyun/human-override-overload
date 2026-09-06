import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/82105/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const out = new URL('../qa/skill-readiness/', import.meta.url);
await mkdir(out, {recursive:true});
const errors = [], evidence = [];
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile});
    const page = await context.newPage();
    page.on('pageerror', e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4174/?debug=1&scene=sector1');
    await page.locator('.intro-start:not([disabled])').click({timeout:40000});
    await page.locator('.save-slot-card').first().click();
    await page.locator('.home-base-screen').waitFor();
    // Preserve a fresh Q-only case on desktop; exercise a full pair on touch.
    if (mobile) {
      await page.evaluate(()=>{
        const key='train-me-wrong.overload.campaign.v2';
        const campaign=JSON.parse(localStorage.getItem(key));
        campaign.slots[0].completedRegionIds=['wrong-engine-core','glass-dune','abyssal-archive','neon-foundry'];
        campaign.slots[0].progression.augmentationRanks={...(campaign.slots[0].progression.augmentationRanks||{}),'aegis-skill-link':3,'mika-skill-link':3};
        localStorage.setItem(key,JSON.stringify(campaign));
      });
      await page.reload();
      await page.locator('.intro-start:not([disabled])').click({timeout:40000});
      await page.locator('.save-slot-card').first().click();
      await page.locator('.home-base-screen').waitFor();
    }
    if (await page.locator('.base-dialogue:visible').count()) await page.keyboard.press('Escape');
    await page.locator('.base-sortie-action').click();
    await page.locator('.region-map-hotspot').first().click();
    await page.locator('.region-card').first().click();
    await page.locator('.region-sortie-launch').click();
    const q=page.locator('[data-combat-ability="empPulse"]');
    await q.waitFor({timeout:60000});
    await page.waitForFunction(()=>document.querySelector('[data-combat-ability="empPulse"]')?.dataset.skillState==='ready');
    const name=mobile?'portrait':'desktop';
    if(mobile) assert.equal(await page.locator('[data-combat-ability="aegisWard"]').getAttribute('data-skill-state'),'ready');
    await page.screenshot({path:new URL(`${name}-ready.png`,out).pathname.replace(/^\/([A-Z]:)/,'$1')});
    await q.click();
    await page.waitForFunction(()=>document.querySelector('[data-combat-ability="empPulse"]')?.dataset.skillState==='cooling');
    assert.equal(await q.getAttribute('aria-disabled'),'true');
    if(!mobile) assert.equal(await page.locator('[data-combat-ability="aegisWard"]').getAttribute('data-skill-state'),'locked');
    await page.screenshot({path:new URL(`${name}-cooldown.png`,out).pathname.replace(/^\/([A-Z]:)/,'$1')});
    const stats=await page.locator('.skill-readiness').evaluate(dock=>({
      bounds: dock.getBoundingClientRect().toJSON(),
      cards:[...dock.querySelectorAll('.combat-ability-chip')].map(el=>({state:el.dataset.skillState, bounds:el.getBoundingClientRect().toJSON(), status:el.querySelector('.combat-skill-status').textContent, statusSize:getComputedStyle(el.querySelector('.combat-skill-status')).fontSize, nameVisible:getComputedStyle(el.querySelector('.combat-ability-copy')).display !== 'none'})),
    }));
    assert.ok(stats.cards.every(x=>x.nameVisible));
    assert.ok(stats.cards.every(x=>parseFloat(x.statusSize)>=12));
    assert.ok(stats.bounds.bottom <= (mobile?844:900)+1);
    assert.ok(stats.cards.every(x=>x.bounds.bottom<=(mobile?844:900)),JSON.stringify(stats));
    assert.ok(stats.cards.every(x=>x.bounds.bottom<=stats.bounds.bottom));
    evidence.push({name,...stats});
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    const pausedTime=await q.locator('.combat-skill-status').textContent();
    await page.waitForTimeout(350);
    assert.equal(await q.locator('.combat-skill-status').textContent(),pausedTime,'paused cooldown must not tick independently');
    await page.keyboard.press('Escape');
    // Dash finishes quickly enough to verify the real cooldown -> ready transition.
    const dash=page.locator('[data-combat-ability="dash"]');
    await dash.click();
    await page.waitForFunction(()=>document.querySelector('[data-combat-ability="dash"]')?.dataset.skillState==='cooling');
    await page.waitForFunction(()=>document.querySelector('[data-combat-ability="dash"]')?.dataset.skillState==='ready',null,{timeout:12000});
    if(mobile){
      const tag=page.locator('.combat-tag-switch');
      assert.equal(await tag.count(),1);
      await tag.click();
      await page.waitForTimeout(1300);
      await page.screenshot({path:new URL('portrait-tagged.png',out).pathname.replace(/^\/([A-Z]:)/,'$1')});
      await page.setViewportSize({width:844,height:390});
      await page.waitForTimeout(200);
      const landscape=await page.locator('.skill-readiness').boundingBox();
      assert.ok(landscape.height<120,JSON.stringify(landscape));
      assert.ok(landscape.y+landscape.height<=391);
      await page.screenshot({path:new URL('landscape.png',out).pathname.replace(/^\/([A-Z]:)/,'$1')});
      await page.emulateMedia({reducedMotion:'reduce'});
      assert.equal(await page.locator('.combat-ability-chip.is-ready').first().evaluate(el=>getComputedStyle(el).animationName),'none');
    }
    console.log(name,JSON.stringify(stats));
    await context.close();
  }
  assert.deepEqual(errors,[]);
  await writeFile(new URL('evidence.json',out),JSON.stringify(evidence,null,2));
} finally {await browser.close();}

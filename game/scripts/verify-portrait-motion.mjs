// Focused local browser QA. Run with Playwright + sharp available via NODE_PATH.
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const sharp = require('sharp');
const output = path.resolve('qa/portrait-motion-2026-09-05');
await mkdir(output,{recursive:true});
const browser = await chromium.launch({headless:true});
const context = await browser.newContext({viewport:{width:1440,height:960}});
const page = await context.newPage();
const errors=[];page.on('pageerror',error=>errors.push(error.message));
const report={reactionPixels:{},game:[],errors};
async function changed(a,b){
 const first=await sharp(a).ensureAlpha().raw().toBuffer(),second=await sharp(b).ensureAlpha().raw().toBuffer();
 let pixels=0;for(let i=0;i<first.length;i+=4)if(Math.max(Math.abs(first[i]-second[i]),Math.abs(first[i+1]-second[i+1]),Math.abs(first[i+2]-second[i+2]))>10)pixels++;
 return pixels/(first.length/4);
}
try {
 if(!process.argv.includes('--game-only')) {
 await page.goto('http://localhost:4174/tools/portrait-motion-review.html');
 await page.getByText('4명 렌더링 완료').waitFor();
 await page.getByRole('button',{name:'원본 자세',exact:true}).click();
 const figures=page.locator('figure'),baseline=[];
 for(let i=0;i<4;i++)baseline.push(await figures.nth(i).screenshot());
 await page.screenshot({path:path.join(output,'neutral.png')});
 for(const [action,label] of [['head','머리'],['chest','상체'],['armLeft','왼팔'],['armRight','오른팔'],['legs','다리']]){
  await page.getByRole('button',{name:label,exact:true}).click();
  await page.getByRole('button',{name:'반응 순간 정지',exact:true}).click();
  const values=[];
  for(let i=0;i<4;i++)values.push(await changed(baseline[i],await figures.nth(i).screenshot()));
  values.forEach(value=>assert.ok(value>.008,`${action}: no visible movement (${value})`));
  report.reactionPixels[action]=values;
  await page.screenshot({path:path.join(output,`${action}.png`)});
 }
 await page.getByRole('button',{name:'눈 감기 검수'}).click();
 await page.screenshot({path:path.join(output,'blink.png')});
 }
 await page.goto('http://localhost:4174/');
 await page.getByRole('button',{name:'게임 시작 · 헤이븐-09',exact:true}).click();
 await page.getByRole('button',{name:/SLOT 01 신규/}).click();
 await page.locator('.interactive-portrait.is-rendered').waitFor();
 await page.keyboard.press('Escape');
 for(const label of ['머리','상체','왼팔','오른팔','다리']){
  await page.getByRole('button',{name:`이지스 ${label} 반응 보기`,exact:true}).click();
  assert.ok(await page.locator('.motion-portrait-speech').isVisible());
 }
 report.game.push('Five lobby reactions keep dialogue');
 await page.getByRole('button',{name:'이지스 전투원 정보 열기'}).click();
 for(const name of ['미카','베스퍼','녹스']){
  await page.getByRole('button',{name:new RegExp(`${name} 미리보기`)}).click();
  await page.locator('.character-art-stage .interactive-portrait.is-rendered').waitFor();
  for(const label of ['머리','상체','왼팔','오른팔','다리'])await page.getByRole('button',{name:`${name} ${label} 반응 보기`,exact:true}).click();
 }
 report.game.push('Locked roster previews render all operatives and accept five reactions');
 await page.getByRole('button',{name:'전투원 정보 닫기'}).click();
 await page.setViewportSize({width:390,height:844});
 for(const label of ['머리','상체','왼팔','오른팔'])await page.getByRole('button',{name:`이지스 ${label} 반응 보기`,exact:true}).click();
 await page.screenshot({path:path.join(output,'mobile-lobby.png')});
 report.game.push('390 x 844 touch targets work');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForTimeout(150);
 // DOM image remains the accessible source while the neutral mesh is rendered.
 const portrait=page.locator('.interactive-portrait');
 const reducedFirst=await portrait.screenshot();await page.waitForTimeout(250);
 const reducedSecond=await portrait.screenshot();
 assert.ok(await changed(reducedFirst,reducedSecond)<.001);
 report.game.push('OS reduced motion freezes the portrait');
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.setViewportSize({width:1440,height:960});
 await page.getByRole('button',{name:'게임 설정 열기',exact:true}).click();
 await page.getByRole('tab',{name:/일반/}).click();
 const reduce=page.getByRole('button',{name:/모션 최소화/});
 await reduce.click();
 await page.getByRole('button',{name:/설정 닫기/}).click();
 await page.waitForTimeout(150);
 const gameReducedFirst=await portrait.screenshot();await page.waitForTimeout(250);
 assert.ok(await changed(gameReducedFirst,await portrait.screenshot())<.001);
 report.game.push('In-game reduced motion freezes the portrait');
 await page.evaluate(()=>document.querySelector('.portrait-mesh').getContext('webgl').getExtension('WEBGL_lose_context').loseContext());
 await page.locator('[data-portrait-renderer="static-fallback"]').waitFor();
 assert.equal(await page.locator('.portrait-source').evaluate(el=>getComputedStyle(el).opacity),'1');
 report.game.push('WebGL context loss immediately restores approved source art');
 assert.deepEqual(errors,[]);
} catch(error) {
 await page.screenshot({path:path.join(output,'failure.png')});
 await writeFile(path.join(output,'failure-dom.txt'),await page.locator('body').innerText());
 report.failure=error.message;throw error;
} finally {
 await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));await browser.close();
}

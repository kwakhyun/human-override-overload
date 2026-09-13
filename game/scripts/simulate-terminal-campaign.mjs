import { pathToFileURL } from 'node:url';
import { writeFileSync, mkdirSync } from 'node:fs';
import { createSwarmState, createSwarmInput, stepSwarm, setSwarmAim, chooseLevelReward, enterBossRoom, drainSwarmEvents, isManualAbilityUnlocked } from '../src/swarm/engine.js';
import { getTerminalTargets, terminalShapeHits } from '../src/swarm/terminalObjectives.js';
import { calculateCombatBonuses, createEmptyBaseProgression } from '../src/game/progression/baseProgression.js';
import { BASE_UPGRADE_LINES } from '../src/game/content/baseUpgrades.js';

export function terminalQaProgression(rank=3) {
  const p=createEmptyBaseProgression();
  for(const u of Object.values(BASE_UPGRADE_LINES))p[`${u.category}Ranks`][u.id]=Math.min(rank,u.ranks.length);
  return p;
}
export function seededRandom(seed=37) {return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
export function chooseQaReward(state) {
  const priorities=['pulse','scatter','rail','rocket','drone','sentry','damage','attackSpeed','regen','maxHp','nova','chainLightning'];
  const score=r=>{const i=priorities.indexOf(r.id);return i<0?99:i;};
  const reward=[...state.rewardOptions].sort((a,b)=>score(a)-score(b))[0];
  if(reward)chooseLevelReward(state,reward.id);
}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function terminalQaInput(s, branch='safe') {
  const input=createSwarmInput(),p=s.player,m=s.expedition.mission;
  const enemies=s.enemies.filter(e=>!e.dead&&!(e.spawnDelay>0));
  let target;
  if(s.phase==='boss') target={x:s.boss.x-490,y:540};
  else if(m.kind==='escort')target=m.checkpoint===1&&!m.route?m.routeChoices.find(n=>n.id===branch):{x:m.ark.x-120,y:m.ark.y+100};
  else target=getTerminalTargets(m).sort((a,b)=>dist(a,p)-dist(b,p))[0]||p;
  if (p.hp < p.maxHp * .55 && s.phase === 'swarm') {
    const kit=s.healthKits.filter(k=>!k.collected).sort((a,b)=>dist(a,p)-dist(b,p))[0];
    if(kit && dist(kit,p)<650)target=kit;
  }
  const hazards=[];
  if(s.phase==='swarm')for(const h of m.hazards)if(h.elapsed<h.warning+.1&&h.elapsed>h.warning-1.15)hazards.push(h.shape);
  const pattern=s.boss.activePattern;
  if(pattern?.terminal)for(const z of pattern.zones){const age=pattern.elapsed-z.start;if(age>=Math.max(0,z.warning-1.3)&&age<z.warning+z.duration)hazards.push(z.shape);}
  // Candidate steering uses live telegraphs and projectiles, with no health,
  // damage, position or objective-state mutations.
  let best=target,bestScore=Infinity;
  const candidates=[target,{x:p.x,y:p.y}];
  if(s.phase==='boss')for(let x=400;x<=1520;x+=140)for(let y=240;y<=840;y+=100){
    if(((x-960)/850)**2+((y-540)/430)**2<.95)candidates.push({x,y});
  }else for(let i=0;i<16;i++){const a=i*Math.PI/8;for(const r of [90,180,290])candidates.push({x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r});}
  for(const c of candidates){
    let score=dist(c,target)*.6+dist(c,p)*.2;
    for(const h of hazards)if(terminalShapeHits(h,{...c,radius:p.radius+22}))score+=6000;
    if(s.phase==='boss'){
      const d=dist(c,s.boss);if(d<320)score+=(320-d)*20;if(d>900)score+=(d-900)*3;
    }
    for(const e of enemies)if(dist(c,e)<120)score+=(120-dist(c,e))*8;
    for(const b of s.enemyProjectiles.slice(-140)){
      const future={x:b.x+(b.vx||0)*.25,y:b.y+(b.vy||0)*.25};
      if(dist(c,future)<60)score+=(60-dist(c,future))*5;
    }
    if(score<bestScore){bestScore=score;best=c;}
  }
  const length=dist(best,p);
  input.moveX=length>12?(best.x-p.x)/length:0;input.moveY=length>12?(best.y-p.y)/length:0;
  const enemy=enemies.sort((a,b)=>dist(a,p)-dist(b,p))[0];
  const aim=s.phase==='boss'?s.boss:enemy||target;
  setSwarmAim(s,aim.x,aim.y);
  if(hazards.some(h=>terminalShapeHits(h,p))&&length>150&&p.dashCooldown<=0)input.dashPressed=true;
  for(const key of ['empPulse','aegisWard','stratosRun','helixTempest']) {
    const ready=key==='aegisWard'?p.hp<p.maxHp*.85:key==='empPulse'?(s.phase==='boss'||enemies.some(e=>dist(e,p)<440)):
      key==='helixTempest'?(s.phase==='boss'||enemies.filter(e=>dist(e,p)<650).length>=6):(s.phase==='boss'||enemies.length>=6);
    if(ready&&s.manualAbilities[key]?.cooldown<=0&&isManualAbilityUnlocked(s,key))input[`${key}Pressed`]=true;
  }
  return input;
}

export function simulateTerminal(regionId,branch='safe',seed=37) {
  const s=createSwarmState({regionId,expedition:true,duration:600,random:seededRandom(seed),
    combatBonuses:calculateCombatBonuses(terminalQaProgression()),characterSkillRanks:{aegis:3,mika:3,vesper:3,nox:3},partyCharacterIds:['aegis','mika']});
  let bossAt=null,inputs=0;const checkpoints=[];let input=createSwarmInput();
  for(let frame=0;frame<600*60+2000&&s.status==='running';frame++){
    if(s.levelupPending){chooseQaReward(s);continue;}
    if(s.expedition.awaitingBossEntry){enterBossRoom(s);bossAt=s.time;}
    if(frame%6===0){input=terminalQaInput(s,branch);inputs++;}
    stepSwarm(s,input,1/60);
    if(frame%6!==0)for(const key of Object.keys(input))if(key.endsWith('Pressed'))input[key]=false;
    for(const e of drainSwarmEvents(s))if(e.type==='objectiveCheckpoint')checkpoints.push({time:Math.round(s.time),text:e.text});
  }
  return {regionId,branch,seed,status:s.status,time:s.time,bossAt,bossSeconds:bossAt?s.time-bossAt:null,
    bossHp:s.boss.hp,hp:s.player.hp,level:s.player.level,kills:s.killedEnemies,progress:s.expedition.mission.progress,
    arkHp:s.expedition.mission.ark?.hp,inputs,checkpoints,damageTaken:s.stats.damageTaken,patternsHit:s.stats.bossPatternsHit,patternsDodged:s.stats.bossPatternsDodged};
}
if(import.meta.url===pathToFileURL(process.argv[1]).href){
  const results=[];
  for(const [region,branch] of [['eclipse-relay','safe'],['ark-transit','safe'],['ark-transit','fast'],['sovereign-throne','safe']]){
    const r=simulateTerminal(region,branch);results.push(r);console.log(JSON.stringify(r));
  }
  mkdirSync('qa/terminal-orbit',{recursive:true});writeFileSync('qa/terminal-orbit/simulation.json',JSON.stringify(results,null,2));
}

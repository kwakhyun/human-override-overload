import test from 'node:test';
import assert from 'node:assert/strict';
import { createSwarmState, createSwarmInput, stepSwarm, getSwarmHud, enterBossRoom, chooseLevelReward } from '../src/swarm/engine.js';
import { createTerminalObjective, stepTerminalObjective, terminalShapeHits } from '../src/swarm/terminalObjectives.js';
import { beginTerminalBossPattern, stepTerminalBossPattern } from '../src/swarm/terminalBossPatterns.js';
import { TERMINAL_CAMPAIGN, TERMINAL_PATTERNS } from '../src/game/content/terminalCampaign.js';
import { completeRegion, createEmptyCampaign, getCampaignSlot, sanitizeCampaign, getCampaignPostVictorySteps, consumeCampaignPostVictoryStep } from '../src/game/save/campaignSave.js';
import { getCampaignRegions, getUnlockedRegionIds } from '../src/game/content/campaign.js';
const oldIds=getCampaignRegions().slice(0,6).map(r=>r.id);
test('terminal occupation begins with mixed guards rather than the old hunter-only tutorial',()=>{
  const s=createSwarmState({regionId:'eclipse-relay',expedition:true,duration:600});
  assert.equal(s.enemies.length,8);
  assert.ok(s.enemies.some(e=>e.type==='suppressor'));
  assert.ok(s.enemies.some(e=>e.type==='brute'));
});
function objectiveState(id) { return {phase:'swarm',player:{x:2048,y:2048,radius:18}, enemies:[], expedition:{mission:createTerminalObjective(id)}}; }
function tick(state,seconds) { for(let i=0;i<Math.ceil(seconds*60);i++)stepTerminalObjective(state,1/60,()=>{}); }

test('terminal campaign unlocks sequentially for existing six-region saves and persists finale rewards once',()=>{
  let c=createEmptyCampaign();
  for(const id of oldIds)c=completeRegion(c,'slot-1',id,{status:'victory',runId:id});
  assert.ok(getCampaignSlot(c,'slot-1').unlockedRegionIds.includes('eclipse-relay'));
  assert.ok(!getCampaignSlot(c,'slot-1').unlockedRegionIds.includes('ark-transit'));
  assert.deepEqual(completeRegion(c,'slot-1','ark-transit',{status:'victory'}),c);
  for(const [id,episode] of [['eclipse-relay','orbit-signal'],['ark-transit','ark-arrival'],['sovereign-throne','human-verdict']]) {
    c=completeRegion(c,'slot-1',id,{status:'victory',runId:id});
    c=sanitizeCampaign(JSON.parse(JSON.stringify(c)));
    assert.ok(getCampaignPostVictorySteps(c,'slot-1').includes(episode));
    const before=JSON.stringify(getCampaignSlot(c,'slot-1').progression);
    for(const step of getCampaignPostVictorySteps(c,'slot-1')) c=consumeCampaignPostVictoryStep(c,'slot-1',step);
    c=completeRegion(c,'slot-1',id,{status:'victory',runId:id});
    assert.equal(JSON.stringify(getCampaignSlot(c,'slot-1').progression),before);
    assert.ok(!getCampaignPostVictorySteps(c,'slot-1').includes(episode));
  }
  assert.equal(getCampaignSlot(c,'slot-1').completedRegionIds.length,9);
  assert.ok(getCampaignSlot(c,'slot-1').completedChapterIds.includes('chapter-04'));
  assert.ok(Object.isFrozen(TERMINAL_CAMPAIGN['ark-transit'].assets));
});

test('kills never complete a terminal objective and reward menus freeze its clock',()=>{
  const s=createSwarmState({regionId:'eclipse-relay',expedition:true,duration:600});
  s.enemies=[];s.killedEnemies=s.enemyBudget;s.spawnedEnemies=s.enemyBudget;
  stepSwarm(s,createSwarmInput(),.05);
  assert.equal(s.expedition.clearTransition,null);
  s.levelupPending=true;const time=s.expedition.mission.elapsed;
  stepSwarm(s,createSwarmInput(),.05);
  assert.equal(s.expedition.mission.elapsed,time);
  assert.equal(enterBossRoom(s),false);
});

test('relay capture stops under contest, preserves charge, and requires the final central broadcast',()=>{
  const s=objectiveState('eclipse-relay'),m=s.expedition.mission;
  Object.assign(s.player,m.nodes[1]);tick(s,3);
  const charge=m.nodes[1].charge;
  s.enemies=[{x:s.player.x,y:s.player.y,dead:false,spawnDelay:0}];tick(s,2);
  assert.equal(m.nodes[1].charge,charge);s.enemies=[];
  for(const n of [m.nodes[1],m.nodes[2],m.nodes[0]]){Object.assign(s.player,{x:n.x,y:n.y});tick(s,11);}
  assert.ok(m.nodes.every(n=>n.complete));assert.equal(m.complete,false);
  Object.assign(s.player,m.hub);tick(s,15);assert.ok(m.complete);assert.equal(m.progress,1);
});

for(const branch of ['fast','safe'])test(`ark escort ${branch} route pauses out of range, chooses at the fork, and can dock`,()=>{
  const s=objectiveState('ark-transit'),m=s.expedition.mission;
  tick(s,8);assert.equal(m.ark.x,1450);
  for(let i=0;i<8000&&!m.complete;i++){
    const target=m.checkpoint===1&&!m.route?m.routeChoices.find(n=>n.id===branch):m.ark;
    Object.assign(s.player,{x:target.x,y:target.y});stepTerminalObjective(s,1/60,()=>{});
  }
  assert.equal(m.route,branch);assert.ok(m.complete);assert.ok(m.ark.hp>0);
});
test('an unprotected ark can be destroyed and a retry restores its pristine state',()=>{
  const s=createSwarmState({regionId:'ark-transit',expedition:true,duration:600});
  s.expedition.mission.ark.hp=.1;
  s.enemies=[{...s.enemies[0],x:1450,y:2048,spawnDelay:0}];
  stepSwarm(s,createSwarmInput(),.05);assert.equal(s.status,'defeat');
  const retry=createSwarmState({regionId:'ark-transit',expedition:true});
  assert.equal(retry.expedition.mission.ark.hp,720);assert.equal(retry.expedition.mission.route,null);
});
test('keys are carried one at a time; visiting vaults without returning cannot unlock the boss',()=>{
  const s=objectiveState('sovereign-throne'),m=s.expedition.mission;
  Object.assign(s.player,m.nodes[0]);tick(s,7);assert.equal(m.carrying,'a');
  Object.assign(s.player,m.nodes[1]);tick(s,7);assert.equal(m.nodes[1].complete,false);
  assert.equal(m.deposited,0);
  Object.assign(s.player,m.hub);tick(s,.1);
  for(const n of m.nodes.slice(1)){Object.assign(s.player,n);tick(s,7);Object.assign(s.player,m.hub);tick(s,.1);}
  assert.equal(m.deposited,3);assert.equal(m.complete,false);tick(s,17);assert.ok(m.complete);
});

test('objective completion transitions to the boss without a fabricated kill count',()=>{
  const s=createSwarmState({regionId:'sovereign-throne',expedition:true,duration:600});
  s.expedition.mission.complete=true;
  for(let i=0;i<800&&!s.expedition.awaitingBossEntry;i++)stepSwarm(s,createSwarmInput(),1/60);
  assert.ok(s.expedition.awaitingBossEntry);assert.equal(s.killedEnemies,0);
  assert.ok(enterBossRoom(s));assert.equal(s.phase,'boss');assert.equal(getSwarmHud(s).expedition.mission.complete,true);
});

for(const [id,patterns] of Object.entries(TERMINAL_PATTERNS))for(const type of new Set(patterns))test(`${id}: ${type} has fair warnings, authoritative shapes and a finite counterattack window`,()=>{
  for(const stage of [1,2,3]){
    const s=createSwarmState({regionId:id,expedition:true,duration:600});s.phase='boss';
    Object.assign(s.boss,{active:true,stage,x:1350,y:540,patterns:[type],patternIndex:0});
    Object.assign(s.player,{x:760,y:540});let hits=0;
    beginTerminalBossPattern(s,()=>{});
    const p=s.boss.activePattern;
    assert.ok(p.zones.length);assert.ok(p.zones.every(z=>z.warning>=1.8));
    stepTerminalBossPattern(s,.5,()=>{hits++;return true;},()=>{});assert.equal(hits,0);
    // This isolates lifecycle from player AI; it is not a real-play clear claim.
    for(let i=0;i<1400&&s.boss.activePattern;i++)stepTerminalBossPattern(s,1/60,()=>true,()=>{});
    assert.equal(s.boss.activePattern,null);assert.ok(s.boss.weakness>=1.8);assert.ok(s.boss.patternCooldown>s.boss.weakness);
  }
});
test('warning and collision shapes agree at safe bubbles, beam edges and open ring gaps',()=>{
  assert.equal(terminalShapeHits({kind:'outside',x:500,y:500,radius:200},{x:500,y:500,radius:18}),false);
  assert.equal(terminalShapeHits({kind:'outside',x:500,y:500,radius:200},{x:690,y:500,radius:18}),true);
  const line={kind:'line',x:0,y:0,x2:1000,y2:0,width:80};
  assert.equal(terminalShapeHits(line,{x:500,y:59,radius:18}),false);
  assert.equal(terminalShapeHits(line,{x:500,y:57,radius:18}),true);
  const ring={kind:'ring',x:0,y:0,radius:200,width:60,gap:0,gapWidth:.6};
  assert.equal(terminalShapeHits(ring,{x:200,y:0,radius:18}),false);
  assert.equal(terminalShapeHits(ring,{x:-200,y:0,radius:18}),true);
});

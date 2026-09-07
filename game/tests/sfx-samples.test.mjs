import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createSfxEngine } from '../src/audio/sfx.js';
import { createSfxSampleBank } from '../src/audio/sfxSampleBank.js';
import { SFX_SAMPLE_PATHS, SFX_SAMPLES } from '../src/audio/sfxSamples.js';
import { resolveEventSound } from '../src/ui/combat/combatPresentation.js';

class FakeContext {
  constructor() { this.state = 'running'; this.sampleRate = 8000; this.currentTime = 0; this.destination = this.node(); this.started = []; this.gains = []; }
  node() {
    const param = () => ({value:0, setValueAtTime(v){this.value=v;}, exponentialRampToValueAtTime(v){this.value=v;}, setTargetAtTime(v){this.value=v;}});
    const node = {connect(other){return other;},disconnect(){this.disconnected=true;},start:()=>this.started.push(node),stop(){},
      gain:param(),frequency:param(),Q:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param()};
    return node;
  }
  createDynamicsCompressor(){return this.node();}
  createGain(){const n=this.node();this.gains.push(n);return n;}
  createConvolver(){return this.node();}
  createBiquadFilter(){return this.node();}
  createBufferSource(){return this.node();}
  createOscillator(){return this.node();}
  createBuffer(channels,length,rate){return {duration:length/rate,numberOfChannels:channels,getChannelData:()=>new Float32Array(length)};}
  decodeAudioData(bytes){return Promise.resolve({duration:.2,sample:new TextDecoder().decode(bytes)});}
  resume(){return Promise.resolve();}
  close(){this.state='closed';return Promise.resolve();}
}
const response = path => ({ok:true,arrayBuffer:async()=>new TextEncoder().encode(path).buffer});
async function withEngine(run, fetcher = async path => response(path)) {
  const old = {window:globalThis.window,fetch:globalThis.fetch,performance:globalThis.performance};
  let time = 1000, context;
  globalThis.window={AudioContext:class extends FakeContext {constructor(){super();context=this;}}};
  globalThis.fetch=fetcher;
  globalThis.performance={now:()=>time};
  const engine=createSfxEngine();
  try { await run(engine,()=>context,()=>{time+=1000;}); }
  finally {engine.dispose();Object.assign(globalThis,old);}
}
test('selected CC0 files match provenance hashes and bounded mono PCM WAV headers',async()=>{
  const provenance=JSON.parse(await readFile(new URL('../docs/audio/sfx-sources.json',import.meta.url),'utf8'));
  assert.equal(provenance.assets.length,SFX_SAMPLE_PATHS.length);
  let bytes=0;
  for(const asset of provenance.assets){
    assert.equal(asset.license,'CC0-1.0');
    assert.ok(SFX_SAMPLE_PATHS.includes('./'+asset.path));
    const file=await readFile(new URL('../public/'+asset.path,import.meta.url));
    assert.equal(file.toString('ascii',0,4),'RIFF');
    assert.equal(file.toString('ascii',8,12),'WAVE');
    assert.equal(file.readUInt16LE(20),1);assert.equal(file.readUInt16LE(22),1);
    assert.equal(file.readUInt16LE(34),16);
    assert.equal(createHash('sha256').update(file).digest('hex'),asset.sha256);
    const source=await readFile(new URL('../'+asset.sourcePath,import.meta.url));
    assert.equal(createHash('sha256').update(source).digest('hex'),asset.sourceSha256);
    assert.ok(asset.durationSeconds<=asset.maxDuration+.001);
    assert.ok(asset.peak<=.751);
    bytes+=(await stat(new URL('../public/'+asset.path,import.meta.url))).size;
  }
  assert.ok(bytes<2*1024*1024);
});
test('bank bounds concurrency, caches requests and catches unavailable or invalid audio',async()=>{
  let inFlight=0,max=0,calls=0;
  const context=new FakeContext();
  const bank=createSfxSampleBank(context,async path=>{
    inFlight++;max=Math.max(max,inFlight);calls++;
    await new Promise(resolve=>setImmediate(resolve));inFlight--;
    if(path===SFX_SAMPLE_PATHS[0])return {ok:false};
    if(path===SFX_SAMPLE_PATHS[1])throw new Error('offline');
    return response(path);
  });
  await Promise.all([bank.preload(),bank.preload()]);
  assert.equal(calls,SFX_SAMPLE_PATHS.length);assert.equal(max,4);
  assert.equal(bank.stats().failures,2);
  assert.equal(bank.stats().ready,SFX_SAMPLE_PATHS.length-2);
  bank.dispose();assert.equal(bank.stats().ready,0);
});
test('dispose aborts requests and late decodes cannot repopulate the bank',async()=>{
  let release;let signal;
  const decode=new Promise(resolve=>{release=resolve;});
  const context=new FakeContext();context.decodeAudioData=()=>decode;
  const bank=createSfxSampleBank(context,async(path,opts)=>{signal=opts.signal;return response(path);});
  const pending=bank.preload();await new Promise(resolve=>setImmediate(resolve));
  bank.dispose();release({duration:1});
  await pending;assert.equal(signal.aborted,true);assert.equal(bank.stats().ready,0);
});
test('unloaded effects use immediate synthesis, are never replayed on load, then use alternating samples',async()=>{
  let release;const gate=new Promise(resolve=>{release=resolve;});
  await withEngine(async(engine,getContext,tick)=>{
    const ready=engine.start();engine.play('shoot');
    assert.equal(engine.getDiagnostics().samplePlays,0);
    assert.equal(engine.getDiagnostics().fallbackPlays,1);
    release();await ready;
    assert.equal(engine.getDiagnostics().samplePlays,0,'loading must not replay the old shot');
    for(const node of getContext().started)node.onended?.();
    tick();engine.play('shoot');tick();engine.play('shoot');
    const samples=getContext().started.filter(n=>n.buffer?.sample).map(n=>n.buffer.sample);
    assert.deepEqual(samples,SFX_SAMPLES.shoot.paths);
    assert.equal(engine.getDiagnostics().fallbackPlays,1);
  },async path=>{await gate;return response(path);});
});
test('decode failure keeps synthesis playable without retry storms',async()=>{
  await withEngine(async(engine,getContext)=>{
    const ready=engine.start();getContext().decodeAudioData=async()=>{throw new Error('codec');};
    await ready;engine.play('sword');
    assert.equal(engine.getDiagnostics().ready,0);
    assert.equal(engine.getDiagnostics().failures,SFX_SAMPLE_PATHS.length);
    assert.equal(engine.getDiagnostics().fallbackPlays,1);
    assert.ok(getContext().started.length>0);
  });
});
test('offline menu interactions use short non-tonal clicks instead of bright oscillator sweeps',async()=>{
  await withEngine(async(engine,getContext,tick)=>{
    await engine.start();
    for(const cue of ['click','uiHover','uiConfirm','uiClose','start','upgrade','defenseSelect']){
      tick();const first=getContext().started.length;engine.play(cue);
      const voices=getContext().started.slice(first);
      assert.equal(voices.length,1);
      assert.ok(voices.every(n=>n.buffer),'menu fallback must use noise, never pitched oscillators');
      voices.forEach(n=>n.onended?.());
    }
  },async()=>({ok:false}));
});
test('mute affects active voices, volume persists, cooldowns and normal/priority caps remain bounded',async()=>{
  await withEngine(async(engine,getContext,tick)=>{
    await engine.start();engine.play('shoot');engine.play('shoot');
    assert.equal(engine.getDiagnostics().samplePlays,1);
    engine.setVolume(.3);engine.setEnabled(false);
    assert.equal(getContext().gains[0].gain.value,0);
    tick();engine.play('dash');assert.equal(engine.getDiagnostics().samplePlays,1);
    engine.setVolume(.6);assert.equal(getContext().gains[0].gain.value,0);
    engine.setEnabled(true);assert.equal(getContext().gains[0].gain.value,.6);
    for(let i=0;i<30;i++){tick();engine.play('shoot');}
    assert.equal(engine.getDiagnostics().activeVoices,16);
    for(let i=0;i<20;i++){tick();engine.play('bossTelegraph');}
    assert.equal(engine.getDiagnostics().activeVoices,24);
    for(const node of getContext().started)node.onended?.();
    assert.equal(engine.getDiagnostics().activeVoices,0);
  });
});
test('dispose and restart keep old voice endings out of the new context',async()=>{
  await withEngine(async(engine,getContext,tick)=>{
    await engine.start();engine.play('shoot');const oldNode=getContext().started[0];
    engine.dispose();await engine.start();tick();engine.play('shoot');
    oldNode.onended?.();assert.equal(engine.getDiagnostics().activeVoices,1);
    assert.equal(engine.getDiagnostics().ready,SFX_SAMPLE_PATHS.length);
  });
});
test('each operative launch, sword and shield have distinct cues, projectile impacts remain hits',()=>{
  for(const [kind,cue] of Object.entries({pulse:'shoot',mikaHaloBlade:'mikaShot',vesperVectorNeedle:'vesperShot',noxWarrantThread:'noxShot'})){
    assert.equal(resolveEventSound({type:'shot',kind}),cue);
    assert.equal(resolveEventSound({type:'projectileHit',kind}),'enemyHit');
  }
  assert.equal(resolveEventSound({type:'swordAttack'}),'sword');
  assert.equal(resolveEventSound({type:'aegisWardActivated'}),'shield');
  assert.equal(resolveEventSound({type:'vesperNeedleAttack'}),undefined,'secondary telemetry must not double-trigger shots');
});

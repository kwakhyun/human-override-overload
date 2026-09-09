// Host-side secondary motion for authored Cubism parameters. No head rotation.
const PROFILES = {
  aegis: { tempo:1, energy:.8, phase:.2 },
  mika: { tempo:1.13, energy:1, phase:1.7 },
  vesper: { tempo:.94, energy:.65, phase:3.1 },
  nox: { tempo:.86, energy:.6, phase:4.5 },
};
const smooth = t => t*t*t*(t*(t*6-15)+10);
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
export function createCubismMotion(id) {
  const profile=PROFILES[id];
  if (!profile) throw new Error('Unknown Cubism portrait');
  const springs = Object.fromEntries(['front','side','back','armL','armR','coatL','coatR'].map(k=>[k,{x:0,v:0}]));
  const output={ParamAngleX:0,ParamAngleY:0,ParamAngleZ:0,ParamBreath:0,ParamEyeLOpen:1,ParamEyeROpen:1,ParamHairFront:0,ParamHairSide:0,ParamHairBack:0,ParamArmL:0,ParamArmR:0,ParamCoatL:0,ParamCoatR:0};
  let clock=profile.phase, direction=1, gaze=0, disabled=false;
  const reset=()=>{
    Object.values(springs).forEach(s=>{s.x=s.v=0;});
    Object.keys(output).forEach(k=>{output[k]=k.includes('Eye')?1:0;}); gaze=0;
  };
  return {
    output,
    reset,
    look(x) { gaze=Number.isFinite(x)?clamp(x,-1,1):0; },
    react(zone) {
      if(disabled || !['head','chest','armLeft','armRight','legs'].includes(zone))return false;
      direction*=-1;
      const kick=(key,amount)=>{springs[key].v=clamp(springs[key].v+amount*direction,-3,3);};
      if(zone==='head'){kick('front',2.4);kick('side',1.8);kick('back',1.4);}
      if(zone==='armLeft')kick('armL',2.2);
      if(zone==='armRight')kick('armR',2.2);
      if(zone==='chest'){kick('armL',1);kick('armR',-.8);kick('coatL',1.5);kick('coatR',-1.2);}
      if(zone==='legs'){kick('coatL',2);kick('coatR',-1.7);}
      return true;
    },
    update(delta,reduced=false) {
      disabled=reduced;
      if(reduced){reset();return output;}
      const dt=Number.isFinite(delta)?clamp(delta,0,.05):0;
      const steps=Math.max(1,Math.ceil(dt*120)), step=dt/steps;
      for(let s=0;s<steps;s++){
        clock+=step*profile.tempo;
        const targets={
          front:.32*Math.sin(clock*1.3)+gaze*.08,
          side:.35*Math.sin(clock*1.07-.5),
          back:.42*Math.sin(clock*.91-.8),
          armL:.22*Math.sin(clock*1.16-.9),armR:.18*Math.sin(clock*1.16+.3),
          coatL:.32*Math.sin(clock*.96-1.2),coatR:.28*Math.sin(clock*.96-.1),
        };
        for(const [key,spring] of Object.entries(springs)){
          const stiffness=key==='back'?12:key.startsWith('coat')?14:24;
          const damping=key==='back'?5:key.startsWith('coat')?6:8;
          spring.v+=(stiffness*(targets[key]*profile.energy-spring.x)-damping*spring.v)*step;
          spring.x+=spring.v*step;
          if(Math.abs(spring.x)>1){spring.x=Math.sign(spring.x);spring.v=0;}
        }
      }
      const cycle=clock%5.4;
      output.ParamBreath=(cycle<2.1?smooth(cycle/2.1):1-smooth((cycle-2.1)/3.3))*.8;
      // Fast closure, short hold, slower opening; occasional double blink.
      const blink=(clock%11.9), age=blink<.22?blink:blink>5.6&&blink<5.82?blink-5.6:blink>5.94&&blink<6.16?blink-5.94:-1;
      const eye=age<0?1:age<.065?1-smooth(age/.065):age<.095?0:smooth(clamp((age-.095)/.125,0,1));
      output.ParamEyeLOpen=output.ParamEyeROpen=eye;
      for(const [key,param] of Object.entries({front:'ParamHairFront',side:'ParamHairSide',back:'ParamHairBack',armL:'ParamArmL',armR:'ParamArmR',coatL:'ParamCoatL',coatR:'ParamCoatR'}))output[param]=springs[key].x;
      return output;
    },
  };
}

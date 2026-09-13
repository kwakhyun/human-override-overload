import Phaser from 'phaser';
import { getTerminalTargets } from '../../swarm/terminalObjectives.js';

// Disposable display adapter: every position, radius and warning phase comes
// from simulation. No visual-only collision approximations or second clock.
export class TerminalBattleView {
  private graphics: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  private scene: Phaser.Scene;
  private parent: Phaser.GameObjects.Container;
  private labelCursor = 0;
  constructor(scene: Phaser.Scene, parent: Phaser.GameObjects.Container) {
    this.scene = scene; this.parent = parent;
    this.graphics = scene.add.graphics(); parent.add(this.graphics);
  }
  private label(x: number, y: number, text: string, color = '#b9fff3') {
    let label = this.labels[this.labelCursor];
    if (!label) {
      label = this.scene.add.text(0, 0, '', { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold',
        color, stroke: '#06131e', strokeThickness: 5, align: 'center' }).setOrigin(.5);
      this.labels.push(label); this.parent.add(label);
    }
    label.setPosition(x, y).setText(text).setColor(color).setVisible(true); this.labelCursor++;
  }
  private shape(s: any, charge: number, active: boolean) {
    const g = this.graphics, color = active ? 0xffddae : 0xff667f;
    const alpha = active ? .28 : .06 + charge * .09;
    g.fillStyle(color, alpha); g.lineStyle(active ? 7 : 3, color, .9);
    if (s.kind === 'circle') {
      g.fillCircle(s.x, s.y, s.radius); g.strokeCircle(s.x, s.y, s.radius);
      g.lineStyle(2, 0xffeed1, .65); g.strokeCircle(s.x, s.y, Math.max(4, s.radius * (1 - charge)));
      if (active) { g.lineStyle(13, color, .08); g.strokeCircle(s.x, s.y, s.radius * 1.1); }
    } else if (s.kind === 'outside') {
      // Safe bubble remains clear; the surrounding dashed rays identify the
      // dangerous exterior without hiding combat behind an opaque full-screen fill.
      g.fillStyle(0x79f7d1, active ? .12 : .065); g.fillCircle(s.x, s.y, s.radius);
      g.lineStyle(5, 0x79f7d1, 1); g.strokeCircle(s.x, s.y, s.radius);
      g.lineStyle(2, 0xff667f, active ? .72 : .28);
      for (let i = 0; i < 40; i++) {
        const a = i / 40 * Math.PI * 2;
        g.lineBetween(s.x + Math.cos(a) * (s.radius + 18), s.y + Math.sin(a) * (s.radius + 18), s.x + Math.cos(a) * 1900, s.y + Math.sin(a) * 1900);
      }
      this.label(s.x, s.y, '피난 구역', '#b5ffe1');
    } else if (s.kind === 'rect') {
      g.fillRect(s.x-s.w/2, s.y-s.h/2, s.w, s.h); g.strokeRect(s.x-s.w/2, s.y-s.h/2, s.w, s.h);
      g.lineStyle(2, color, .45); g.lineBetween(s.x-25, s.y-25, s.x+25, s.y+25); g.lineBetween(s.x+25, s.y-25, s.x-25, s.y+25);
    } else if (s.kind === 'line') {
      g.lineStyle(s.width, color, alpha); g.lineBetween(s.x, s.y, s.x2, s.y2);
      const angle = Math.atan2(s.y2-s.y, s.x2-s.x), dx = -Math.sin(angle) * s.width/2, dy = Math.cos(angle) * s.width/2;
      g.lineStyle(3, color, .85);
      g.lineBetween(s.x+dx,s.y+dy,s.x2+dx,s.y2+dy); g.lineBetween(s.x-dx,s.y-dy,s.x2-dx,s.y2-dy);
      if (active) { g.lineStyle(s.width*.16, 0xfff9ea, .85); g.lineBetween(s.x,s.y,s.x2,s.y2); }
    } else if (s.kind === 'ring') {
      g.lineStyle(s.width, color, alpha+.1); g.beginPath(); g.arc(s.x,s.y,s.radius,s.gap+s.gapWidth,s.gap+Math.PI*2-s.gapWidth); g.strokePath();
      g.lineStyle(3, color, .95); g.beginPath(); g.arc(s.x,s.y,s.radius,s.gap+s.gapWidth,s.gap+Math.PI*2-s.gapWidth); g.strokePath();
      const x=s.x+Math.cos(s.gap)*s.radius, y=s.y+Math.sin(s.gap)*s.radius;
      this.label(x,y,'통과', '#b5ffe1');
    }
  }
  update(state: any) {
    const g=this.graphics; g.clear(); this.labelCursor=0;
    const m=state.expedition?.mission;
    if (m && state.phase==='swarm' && !m.complete) {
      if (m.kind==='escort') {
        const paths = m.route ? [m.waypoints] : [[{x:1970,y:2048},{x:2160,y:1660},{x:2590,y:1670},{x:3270,y:2048}], [{x:1970,y:2048},{x:2160,y:2440},{x:2300,y:2700},{x:2980,y:2700},{x:3270,y:2048}]];
        paths.forEach((path: any[], index: number)=>{
          g.lineStyle(6,index===0 && m.route!=='safe'?0xe6b574:0x72dfe8,.24);
          for(let i=1;i<path.length;i++) g.lineBetween(path[i-1].x,path[i-1].y,path[i].x,path[i].y);
        });
        const {x,y,hp,maxHp}=m.ark;
        g.fillStyle(0x000000,.24); g.fillEllipse(x,y+34,200,90);
        g.lineStyle(2,0x83efff,.9); g.fillStyle(0x253c52,1); g.fillRoundedRect(x-103,y-56,206,105,20); g.strokeRoundedRect(x-103,y-56,206,105,20);
        g.fillStyle(0xaab8c5,1); g.fillRoundedRect(x-92,y-51,180,79,15);
        g.fillStyle(0x132432,1); g.fillRoundedRect(x+39,y-44,38,65,12);
        for(let i=0;i<4;i++) { g.fillStyle(0x4cdaef,1); g.fillRect(x-77+i*27,y-34,18,44); }
        g.fillStyle(0xfbd095,1); g.fillRect(x+82,y-35,8,14); g.fillRect(x+82,y+15,8,14);
        g.fillStyle(0x12242c,1); g.fillRect(x-90,y-84,180,10); g.fillStyle(hp/maxHp>.3?0x7cedc5:0xff687c,1); g.fillRect(x-90,y-84,180*hp/maxHp,10);
        this.label(x,y-109,`방주 ${Math.ceil(hp/maxHp*100)}%`);
      } else {
        for(const node of [...m.nodes,m.hub]) {
          const active = getTerminalTargets(m).some((n: any)=>n.id===node.id);
          const color=node.complete?0x77f0c1:active?0x88e9ff:0x72698d;
          g.fillStyle(0x09121e,.9); g.fillEllipse(node.x,node.y+20,110,75);
          g.lineStyle(2,color,.9); g.strokeEllipse(node.x,node.y+20,110,75);
          g.fillStyle(color,.12); g.fillTriangle(node.x,node.y-78,node.x-36,node.y+18,node.x+36,node.y+18);
          g.lineStyle(4,color,.9); g.strokeTriangle(node.x,node.y-78,node.x-36,node.y+18,node.x+36,node.y+18);
          g.fillStyle(color,.9); g.fillCircle(node.x,node.y-25,node.id==='hub'?15:9);
          if(node.complete) this.label(node.x,node.y+65,'확보', '#a4ffcf');
        }
        if(m.carrying) { g.lineStyle(2,0xe8c5ff,.9); g.strokeCircle(state.player.x,state.player.y,45); }
      }
      for(const target of getTerminalTargets(m)) {
        g.lineStyle(3,target.id==='fast'?0xf6c273:0x6be5db,.7); g.strokeCircle(target.x,target.y,target.radius);
        const p=target.id==='hub'?m.channel/(m.kind==='keys'?16:14):(target.charge||0)/(m.kind==='keys'?6:10);
        if(p>0) { g.lineStyle(8,0xabffe0,1); g.beginPath(); g.arc(target.x,target.y,target.radius,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,p));g.strokePath(); }
        if(target.id!=='ark') this.label(target.x,target.y+target.radius+25,target.label);
      }
      for(const h of m.hazards) this.shape(h.shape,Math.min(1,h.elapsed/h.warning),h.fired);
    }
    const p=state.phase === 'boss' ? state.boss?.activePattern : null;
    if(p?.terminal) for(const z of p.zones) {
      const elapsed=p.elapsed-z.start;
      if(elapsed<0||elapsed>z.warning+z.duration) continue;
      this.shape(z.shape,Math.min(1,elapsed/z.warning),elapsed>=z.warning);
    }
    for(let i=this.labelCursor;i<this.labels.length;i++) this.labels[i].setVisible(false);
  }
}

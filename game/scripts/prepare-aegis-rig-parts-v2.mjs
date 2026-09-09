// Editable material revision. Exact source pixels remain the visible authority.
// This packs masks/overlap and an ImageGen concealed underpaint, not a finished rig.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
const require=createRequire(import.meta.url),sharp=require('sharp');
const {writePsdBuffer}=require('../reference/source-assets/overload/live2d-production/tools/node_modules/ag-psd');
const W=864,H=1536,N=W*H;
const root=path.resolve('reference/source-assets/overload/live2d-production/aegis');
const out=path.join(root,'parts-v2');await mkdir(out,{recursive:true});
const src=await sharp('reference/source-assets/overload/runtime-inputs/pre-anime-2026-09-09/hero/survivor-portrait-v2.webp').ensureAlpha().raw().toBuffer();
const old=JSON.parse(await readFile(path.resolve('reference/source-assets/overload/runtime-inputs/aegis-part-segmentation.json'),'utf8'));
const removed=/^(Eye_|Brow_|Mouth$|Seam_Residual$)/;
let regions=old.layers.filter(l=>!removed.test(l.name)).map(l=>({name:l.name,group:l.group,points:l.points}));
function set(name,points){regions.find(r=>r.name===name).points=points;}
// Follow the narrow cheek lock instead of cutting out a broad skin wedge.
set('Hair_Side_ScreenL',[[401,237],[398,269],[402,302],[408,332],[412,360],[416,383],[414,397],[409,383],[402,361],[393,332],[386,296],[382,270],[388,244]]);
set('Hair_Side_ScreenR',[[557,282],[568,269],[575,288],[570,318],[557,346],[550,375],[558,411],[571,435],[564,437],[548,417],[537,400],[535,366],[541,335]]);
set('Hair_Fringe_ScreenL',[[494,121],[471,124],[449,140],[428,165],[408,194],[395,222],[387,249],[386,275],[394,297],[408,311],[420,316],[406,301],[402,282],[408,257],[420,224],[441,207],[458,183],[479,151]]);
set('Hair_Fringe_Center',[[492,120],[512,133],[526,157],[531,186],[525,211],[513,234],[500,248],[481,261],[470,266],[484,251],[497,230],[484,243],[474,248],[485,228],[491,205],[489,181],[482,163],[482,142]]);
set('Hair_Fringe_ScreenR',[[518,136],[541,153],[562,185],[579,219],[585,254],[580,285],[566,313],[550,332],[535,343],[550,322],[558,300],[555,280],[551,263],[548,238],[544,211],[535,182]]);
set('Face_Neck',[[351,219],[381,203],[420,177],[468,155],[522,172],[558,223],[558,285],[540,324],[516,350],[484,370],[474,399],[444,407],[416,386],[394,358],[378,317],[353,287]]);
set('Hair_Back_ScreenR',[[641,639],[660,656],[678,682],[691,707],[710,734],[717,764],[714,796],[704,819],[691,833],[693,810],[699,787],[692,762],[678,740],[670,716],[657,692],[647,668]]);
// The exposed far-side hair lies in front of the far arm silhouette.
const farHair=regions.splice(regions.findIndex(r=>r.name==='Hair_Back_ScreenR'),1)[0];regions.unshift(farHair);
const face=regions.splice(regions.findIndex(r=>r.name==='Face_Neck'),1)[0];regions.splice(regions.findIndex(r=>r.name==='Hair_Crown'),0,face);
const owner=new Int16Array(N).fill(-1);
function inside(x,y,p){let v=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])v=!v;}return v;}
for(let k=0;k<regions.length;k++){
 const p=regions[k].points;const minY=Math.max(0,Math.floor(Math.min(...p.map(a=>a[1])))),maxY=Math.min(H,Math.ceil(Math.max(...p.map(a=>a[1]))));
 for(let y=minY;y<maxY;y++)for(let x=0;x<W;x++){const i=y*W+x;if(owner[i]<0&&src[i*4+3]&&inside(x+.5,y+.5,p))owner[i]=k;}
}
// Assign remaining boundary pixels to their nearest semantic neighbour;
// never export a body-wide floating residual mesh.
const queue=new Int32Array(N);let head=0,tail=0,unassigned=0;
for(let i=0;i<N;i++)if(owner[i]>=0)queue[tail++]=i;else if(src[i*4+3])unassigned++;
while(head<tail){const i=queue[head++],x=i%W;for(const j of [x?i-1:-1,x<W-1?i+1:-1,i-W,i+W])if(j>=0&&j<N&&owner[j]<0&&src[j*4+3]){owner[j]=owner[i];queue[tail++]=j;}}
// Tiny disconnected source-alpha wisps inherit the nearest named polygon.
let disconnected=0;for(let i=0;i<N;i++)if(src[i*4+3]&&owner[i]<0){const x=i%W,y=Math.floor(i/W);let best=Infinity,k=0;regions.forEach((r,n)=>r.points.forEach(p=>{const d=(p[0]-x)**2+(p[1]-y)**2;if(d<best){best=d;k=n;}}));owner[i]=k;disconnected++;}
const hiddenSource=path.join(root,'head-underpaint-v2.png');
const under=await sharp(hiddenSource).resize(340,430,{fit:'fill'}).ensureAlpha().raw().toBuffer();
const faceIndex=regions.findIndex(r=>r.name==='Face_Neck');
const hairIndices=new Set(regions.map((r,i)=>/^Hair_(Side|Fringe)_/.test(r.name)?i:-1).filter(i=>i>=0));
const layers=[],manifest=[];let hiddenPixels=0;
for(let k=0;k<regions.length;k++){
 const r=regions[k],mask=new Uint8Array(N),data=Buffer.alloc(N*4);let overlap=0;
 for(let i=0;i<N;i++)if(owner[i]===k)mask[i]=1;
 // Four source pixels of concealed overlap behind higher layers prevent
 // filter sampling from exposing adjoining disjoint-alpha edges.
 for(let pass=0;pass<4;pass++){
  const next=mask.slice();for(let i=0;i<N;i++)if(mask[i]){const x=i%W;for(const j of [x?i-1:-1,x<W-1?i+1:-1,i-W,i+W])if(j>=0&&j<N&&owner[j]<k&&src[j*4+3]===255&&!mask[j])next[j]=1;}mask.set(next);
 }
 for(let i=0;i<N;i++)if(mask[i]){src.copy(data,i*4,i*4,i*4+4);if(owner[i]!==k)overlap++;}
 // Only covered pixels inside the original opaque silhouette use generated
 // paint. No generated eye, lip, silhouette, or baked backdrop is visible
 // at neutral. Top/side hair motion can reveal this concealed face surface.
 if(k===faceIndex)for(let y=155;y<400;y++)for(let x=374;x<559;x++){
  const i=y*W+x;if(!hairIndices.has(owner[i])||src[i*4+3]!==255||!inside(x,y,r.points))continue;
  const u=((y-65)*340+x-270)*4;under.copy(data,i*4,u,u+3);data[i*4+3]=255;hiddenPixels++;
 }
 let left=W,top=H,right=0,bottom=0,pixels=0;for(let i=0;i<N;i++)if(data[i*4+3]){const x=i%W,y=Math.floor(i/W);left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);pixels++;}
 const w=right-left,h=bottom-top,crop=await sharp(data,{raw:{width:W,height:H,channels:4}}).extract({left,top,width:w,height:h}).raw().toBuffer();
 await sharp(crop,{raw:{width:w,height:h,channels:4}}).png().toFile(path.join(out,r.name+'.png'));
 layers.push({name:r.name,left,top,right,bottom,imageData:{width:w,height:h,data:new Uint8ClampedArray(crop)},full:data});
 manifest.push({...r,pixels,overlap,bounds:[left,top,right,bottom]});
}
const neutral=Buffer.alloc(N*4);
for(const l of [...layers].reverse())for(let i=0;i<N;i++){const o=i*4,a=l.full[o+3]/255;if(!a)continue;const ba=neutral[o+3]/255,oa=a+ba*(1-a);for(let c=0;c<3;c++)neutral[o+c]=Math.round((l.full[o+c]*a+neutral[o+c]*ba*(1-a))/oa);neutral[o+3]=Math.round(oa*255);}
let differences=0;for(let i=0;i<N;i++)for(let c=0;c<4;c++)if((c===3||src[i*4+3])&&neutral[i*4+c]!==src[i*4+c])differences++;
if(differences){const sample=[];for(let i=0;i<N&&sample.length<20;i++)if([0,1,2,3].some(c=>(c===3||src[i*4+3])&&neutral[i*4+c]!==src[i*4+c]))sample.push({x:i%W,y:Math.floor(i/W),owner:regions[owner[i]]?.name,source:[...src.subarray(i*4,i*4+4)],output:[...neutral.subarray(i*4,i*4+4)]});throw new Error(`Visible source changed in ${differences} channels: ${JSON.stringify(sample)}`);}
await writeFile(path.join(out,'aegis-parts-v2.psd'),writePsdBuffer({width:W,height:H,imageData:{width:W,height:H,data:new Uint8ClampedArray(neutral)},children:[...layers].reverse().map(({full,...l})=>l)}));
await sharp(neutral,{raw:{width:W,height:H,channels:4}}).png().toFile(path.join(out,'neutral-reconstruction.png'));
await writeFile(path.join(out,'parts.json'),JSON.stringify({status:'WIP: concealed face paint and overlap revision; not production-approved',canvas:[W,H],neutralPixelDifferences:differences,reassignedBoundaryPixels:unassigned,disconnectedPixels:disconnected,hiddenFacePixels:hiddenPixels,layers:manifest},null,2));
console.log(JSON.stringify({output:out,layers:layers.length,neutralPixelDifferences:differences,hiddenFacePixels:hiddenPixels,overlapPixels:manifest.reduce((n,r)=>n+r.overlap,0),productionApproved:false}));

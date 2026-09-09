import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
// Authoring dependencies are isolated from the shipped game bundle.
const require=createRequire(path.resolve('tmp/cubism-tools/package.json'));
const sharp=require('sharp'),{writePsdBuffer}=require('ag-psd');
const root=path.resolve('reference/source-assets/overload/live2d-production/anime-v2');
for(const id of ['aegis','mika','vesper','nox']) {
 const dir=path.join(root,id),manifest=JSON.parse(await readFile(path.join(dir,'parts.json'),'utf8'));
 const children=[];
 for(const layer of [...manifest.layers].reverse()) {
  const [left,top,right,bottom]=layer.bounds;
  const data=await sharp(path.join(dir,layer.name+'.png')).ensureAlpha().raw().toBuffer();
  children.push({name:layer.name,left,top,right,bottom,opacity:(layer.defaultOpacity??100)/100,imageData:{width:right-left,height:bottom-top,data:new Uint8ClampedArray(data)}});
 }
 for(const layer of manifest.layers) {
  const [left,top,right,bottom]=layer.pivotBounds;
  const data=await sharp(path.join(dir,'Pivot_'+layer.name+'.png')).ensureAlpha().raw().toBuffer();
  children.push({name:'Pivot_'+layer.name,left,top,right,bottom,hidden:true,imageData:{width:4,height:4,data:new Uint8ClampedArray(data)}});
 }
 const neutral=await sharp(path.join(dir,'neutral.png')).ensureAlpha().raw().toBuffer();
 await writeFile(path.join(dir,id+'-anime-v2.psd'),writePsdBuffer({width:960,height:1280,children,imageData:{width:960,height:1280,data:new Uint8ClampedArray(neutral)}}));
 console.log(id,children.length,'editable layers');
}

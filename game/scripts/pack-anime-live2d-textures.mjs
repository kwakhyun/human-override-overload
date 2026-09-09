// Rebuild non-overlapping runtime atlases from the preserved PSD part pixels.
// Cubism 5.4 alpha polygon packing can overlap disconnected mesh islands.
// Geometry and keys remain in the original MOC3; the renderer remaps only UVs
// from its neutral source coordinates using this audited rectangular layout.
import { createRequire } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const require = createRequire(path.resolve('tmp/cubism-tools/package.json'));
const sharp = require('sharp');
const root = path.resolve('reference/source-assets/overload/live2d-production/anime-v2');
const size = 2048, padding = 24;
for (const id of ['aegis', 'mika', 'vesper', 'nox']) {
  const dir = path.join(root, id);
  const parts = JSON.parse(await readFile(path.join(dir, 'parts.json'), 'utf8'));
  const sorted = [...parts.layers].sort((a,b) => (b.bounds[3]-b.bounds[1])-(a.bounds[3]-a.bounds[1]) || a.name.localeCompare(b.name));
  let x = padding, y = padding, rowHeight = 0, page = 0;
  const pages = [[]], meshes = {};
  for (const layer of sorted) {
    const [left, top, right, bottom] = layer.bounds, width = right-left, height = bottom-top;
    if (width + padding*2 > size || height + padding*2 > size) throw new Error('Part exceeds atlas: '+layer.name);
    if (x + width + padding > size) { x = padding; y += rowHeight + padding*2; rowHeight = 0; }
    if (y + height + padding > size) { x = y = padding; rowHeight = 0; pages.push([]); page++; }
    const input = await readFile(path.join(dir, layer.name+'.png'));
    const metadata = await sharp(input).metadata();
    if (metadata.width !== width || metadata.height !== height) throw new Error('Part bounds mismatch');
    pages[page].push({input,left:x,top:y});
    meshes[layer.name] = { page, source:layer.bounds, atlas:[x,y,width,height], sha256:createHash('sha256').update(input).digest('hex') };
    x += width + padding*2; rowHeight = Math.max(rowHeight,height);
  }
  const textures = [];
  for (const [index, composites] of pages.entries()) {
    const name = `runtime-texture-${index}.png`;
    await sharp({create:{width:size,height:size,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(composites).png().toFile(path.join(dir,name));
    textures.push(name);
  }
  await writeFile(path.join(dir,'runtime-textures.json'), JSON.stringify({version:1,canvas:parts.canvas,size,padding,textures,meshes},null,2)+'\n');
  console.log(id, sorted.length, 'parts;', textures.length, 'non-overlapping 2048px atlas pages');
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { getGameAssetsForRegion, getBossGameAssetsForRegion, getDefenseGameAssets, REGION_IDS } from '../src/game/assets/manifest.ts';

test('every active quality atlas has RGBA square-cell full and mobile grids', async () => {
  const definitions=new Map();
  for(const region of REGION_IDS)for(const profile of ['full','performance']) {
    for(const asset of [...getGameAssetsForRegion(region,profile),...getGameAssetsForRegion(region,profile,'beam-sword'),...getBossGameAssetsForRegion(region,profile)]) definitions.set(asset.path,asset);
  }
  for(const asset of getDefenseGameAssets())for(const path of [asset.path,asset.performancePath].filter(Boolean))definitions.set(path,{...asset,path});
  let inspected=0;
  for(const asset of definitions.values()) {
    if(!asset.path.includes('/quality-v3/'))continue;
    const bytes=await readFile(new URL('../public/'+asset.path.replace(/^\.\//,''),import.meta.url));
    const w=bytes.readUInt32BE(16),h=bytes.readUInt32BE(20);
    assert.equal(bytes[25],6,asset.path+' must retain RGBA');
    assert.equal(w/asset.columns,h/asset.rows,asset.path+' must have square cells');
    assert.equal(w%asset.columns,0);assert.equal(h%asset.rows,0);
    assert.ok(w<=2048 && h<=1536,asset.path+' decoded texture limit');
    if(asset.columns===8&&asset.rows===8)assert.equal(w/8,asset.path.includes('/performance/')?96:128);
    inspected++;
  }
  assert.ok(inspected>=60,'all new effects, actors, and both tiers must be exercised');
});

test('review metadata matches runtime grids and current image bytes', async () => {
  const index=JSON.parse(await readFile(new URL('../public/tools/combat-sprite-index.json',import.meta.url),'utf8'));
  const assets=REGION_IDS.flatMap(r=>[...getGameAssetsForRegion(r),...getGameAssetsForRegion(r,'full','beam-sword'),...getBossGameAssetsForRegion(r)]).concat(getDefenseGameAssets());
  assert.equal(index.length,28);
  for(const item of index){
    const asset=assets.find(a=>a.path.endsWith('/quality-v3/'+item.id+'.png'));
    assert.ok(asset,item.id+' must be connected to the game');
    assert.equal(item.columns,asset.columns,item.id+' review columns');
    assert.equal(item.rows,asset.rows,item.id+' review rows');
    const bytes=await readFile(new URL('../public/'+asset.path.replace(/^\.\//,''),import.meta.url));
    assert.equal(item.version,createHash('sha256').update(bytes).digest('hex').slice(0,16),item.id+' cache version');
  }
});

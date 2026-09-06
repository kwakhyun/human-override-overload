"""Suggest whitespace separators; emit sheets for human review, never publish art."""
import importlib.util
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('packer', ROOT/'scripts/build-sprite-quality-assets.py')
packer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(packer)

def separators(mask, count, axis):
    projection = mask.sum(axis=axis)
    length = len(projection)
    cuts = [0]
    for index in range(1, count):
        expected = length * index / count
        radius = length/count * .38
        lo, hi = round(expected-radius), round(expected+radius)
        # Prefer a broad empty corridor, not a single hole through a subject.
        values = projection[lo:hi]
        minimum = values.min()
        candidates = np.flatnonzero(values <= minimum)
        groups = np.split(candidates, np.flatnonzero(np.diff(candidates)>1)+1)
        best = max(groups, key=lambda g: (len(g), -abs(lo+g.mean()-expected)))
        cuts.append(lo + int(round(best.mean())))
    return cuts+[length]

def main():
    jobs=json.loads((ROOT/'scripts/sprite-quality-recipes.json').read_text(encoding='utf-8'))
    out=ROOT/'qa/sprite-quality-v3/source-cuts';out.mkdir(parents=True,exist_ok=True)
    suggestions=[]
    for job in jobs:
        if job.get('hero'): continue
        raw=Image.open(packer.SOURCE/job.get('sourceFile',job['id']+'.png'))
        rgba=packer.matte(raw,job['matte'])
        if job['id']=='gene-vault-enemies':
            draw=ImageDraw.Draw(rgba)
            for x in range(256,1536,256):draw.rectangle((x-2,0,x+2,1023),fill=(0,0,0,0))
            for y in range(256,1024,256):draw.rectangle((0,y-2,1535,y+2),fill=(0,0,0,0))
        mask=np.asarray(rgba)[...,3]>32
        rows=separators(mask,job['rows'],1)
        cols=[separators(mask[t:b,:job.get('sourceRowWidths',[raw.width]*job['rows'])[r]],job.get('sourceColumnsByRow',[job.get('sourceColumns',job['columns'])]*job['rows'])[r],0) for r,(t,b) in enumerate(zip(rows,rows[1:]))]
        counts=[int(mask[max(0,y-1):y+1].sum()) for y in rows[1:-1]]
        counts += [int(mask[t:b,max(0,x-1):x+1].sum()) for (t,b),xs in zip(zip(rows,rows[1:]),cols) for x in xs[1:-1]]
        rects=[]
        for r,(t,b) in enumerate(zip(rows,rows[1:])):
            rects.append([])
            for l,right in zip(cols[r],cols[r][1:]):
                local_rows=separators(mask[:,l:right],job['rows'],1)
                rects[r].append([l,local_rows[r],right,local_rows[r+1]])
        bad=[]
        for r,line in enumerate(rects):
            for c,(l,t,right,b) in enumerate(line):
                a=np.asarray(rgba)[t:b,l:right,3]
                border=np.concatenate([a[0],a[-1],a[:,0],a[:,-1]])
                if np.any(border>32):bad.append([r,c,int((border>32).sum()),int(border.max())])
        suggestions.append(dict(id=job['id'],rowCuts=rows,columnCuts=cols,sourceFrames=rects,crossingPixels=sum(counts),bad=bad))
        preview=Image.new('RGB',raw.size,'#283444');preview.paste(rgba,mask=rgba.getchannel('A'))
        draw=ImageDraw.Draw(preview)
        for y in rows[1:-1]:draw.line((0,y,raw.width,y),fill='#ff3555',width=2)
        for r,(t,b) in enumerate(zip(rows,rows[1:])):
            for c,(l,right) in enumerate(zip(cols[r],cols[r][1:])):
                draw.line((l,t,l,b),fill='#ff3555',width=2)
                draw.text((l+5,t+5),f'{r}/{c}',fill='white')
        preview.save(out/(job['id']+'.png'))
        print(job['id'],raw.size,'bad',bad)
    (out/'suggestions.json').write_text(json.dumps(suggestions,indent=2),encoding='utf-8')

if __name__=='__main__':main()

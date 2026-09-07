"""Pack reviewed ImageGen plates into frame-safe runtime atlases (no art synthesis).

Keep sources under reference/source-assets/overload/sprite-quality-v3. The JSON
recipe records the actual generated grid, not the grid originally requested.
Every resize is per-cell; one scale per clip preserves pose and effect timing.
"""
from pathlib import Path
import argparse
import json
import shutil
import hashlib
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'reference/source-assets/overload/sprite-quality-v3'
OUT = ROOT / 'public/assets/overload/quality-v3'
RECIPE = ROOT / 'scripts/sprite-quality-recipes.json'
LAYOUTS = ROOT / 'scripts/sprite-source-layouts.json'


def source_cells(raw, job, layout):
    """Crop reviewed source rectangles before any resize; reject cut artwork."""
    rgba = matte(raw, job['matte'])
    guides = layout.get('guides', {})
    draw = ImageDraw.Draw(rgba)
    for x in guides.get('columns', []):
        draw.rectangle((x-2, 0, x+2, raw.height-1), fill=(0,0,0,0))
    for y in guides.get('rows', []):
        draw.rectangle((0, y-2, raw.width-1, y+2), fill=(0,0,0,0))
    cells = []
    anchors = []
    for r, rects in enumerate(layout['frames']):
        line = []; points = []
        for c, (left, top, right, bottom) in enumerate(rects):
            if not (0 <= left < right <= raw.width and 0 <= top < bottom <= raw.height):
                raise ValueError(f'Invalid source rectangle {job["id"]} {r}/{c}')
            cell = rgba.crop((left, top, right, bottom))
            alpha = np.asarray(cell)[..., 3]
            border = np.concatenate((alpha[0], alpha[-1], alpha[:,0], alpha[:,-1]))
            if np.any(border > 32):
                raise ValueError(f'Source artwork crosses frame boundary {job["id"]} {r}/{c}')
            bbox = cell.getchannel('A').point(lambda a: 255 if a > 32 else 0).getbbox()
            if not bbox: raise ValueError(f'Empty source frame {job["id"]} {r}/{c}')
            mode = layout.get('anchor', 'grid')
            if mode == 'center': point = ((bbox[0]+bbox[2])/2, (bbox[1]+bbox[3])/2)
            elif mode == 'feet': point = ((bbox[0]+bbox[2])/2, bbox[3])
            else:
                # Keep the original effect origin; an expanding effect must not
                # be re-centered on its changing visible bounds every frame.
                point = ((c+.5)*raw.width/len(rects)-left, (top+bottom)/2-top)
            line.append(cell); points.append(point)
        cells.append(line); anchors.append(points)
    return cells, anchors


def matte(image, mode):
    rgb = np.asarray(image.convert('RGB'), dtype=np.float32)
    if mode == 'alpha':
        return image.convert('RGBA')
    if mode == 'black':
        # Undo the black matte, retaining its original radiance under ADD.
        alpha = np.max(rgb, axis=2) / 255
        alpha[alpha < 0.022] = 0
        color = rgb / np.maximum(alpha[..., None], 1 / 255)
    else:
        key = 1 if mode == 'green' else 2
        others = [i for i in range(3) if i != key]
        other = np.max(rgb[..., others], axis=2)
        alpha = 1 - np.clip((rgb[..., key] - other) / 238, 0, 1)
        alpha[rgb[..., key] > other * 2.5 + 12] = 0
        alpha[alpha < 0.12] = 0
        color = rgb.copy()
        color[..., key] = np.maximum(0, color[..., key] - (1-alpha)*255)
        color /= np.maximum(alpha[..., None], 1 / 255)
    rgba = np.concatenate([np.clip(color, 0, 255), alpha[..., None]*255], axis=2).astype('uint8')
    rgba[rgba[..., 3] == 0] = 0
    return Image.fromarray(rgba)


def split(image, cols, rows, mode, cuts=None):
    cells = []
    for row in range(rows):
        line = []
        for col in range(cols):
            top = cuts[row] if cuts else row*image.height/rows
            bottom = cuts[row+1] if cuts else (row+1)*image.height/rows
            box = tuple(round(v) for v in (col*image.width/cols, top,
                (col+1)*image.width/cols, bottom))
            cell = matte(image.crop(box), mode)
            if mode not in ('black', 'alpha'):
                # Generated guide lines are outside the reviewed body silhouette.
                ImageDraw.Draw(cell).rectangle((0, 0, cell.width-1, cell.height-1), outline=(0,0,0,0), width=3)
            line.append(cell)
        cells.append(line)
    return cells


def pack(job):
    source = SOURCE / job.get('sourceFile', job['id'] + '.png')
    raw = Image.open(source)
    rows = job['rows']; columns = job['columns']; size = job['cell']
    layouts = json.loads(LAYOUTS.read_text(encoding='utf-8')) if LAYOUTS.exists() else {}
    layout = layouts.get(job['id'])
    source_anchors = None
    if layout:
        if list(raw.size) != layout['sourceSize'] or hashlib.sha256(source.read_bytes()).hexdigest() != layout['sourceSha256']:
            raise ValueError(f'Source layout requires review after source change: {job["id"]}')
        cells, source_anchors = source_cells(raw, job, layout)
    else:
        if not job.get('hero'):
            raise ValueError(f'Missing reviewed source layout: {job["id"]}')
        source_cells(raw, job, {'frames':[
            [[c*raw.width//columns,r*raw.height//rows,(c+1)*raw.width//columns,(r+1)*raw.height//rows]
             for c in range(columns)] for r in range(rows)]})
        cells = split(raw, job.get('sourceColumns', columns), rows, job['matte'], job.get('rowCuts'))
    if 'columnMap' in job:
        cells = [[line[c] for c in job['columnMap'][str(r) if str(r) in job['columnMap'] else 'default']]
                 for r, line in enumerate(cells)]
        if source_anchors:
            source_anchors = [[line[c] for c in job['columnMap'].get(str(r), job['columnMap']['default'])]
                              for r, line in enumerate(source_anchors)]
    if 'flipRows' in job:
        for r in job['flipRows']:
            cells[r] = [c.transpose(Image.Transpose.FLIP_LEFT_RIGHT) for c in cells[r]]
            if source_anchors:
                source_anchors[r] = [(cell.width-x,y) for cell,(x,y) in zip(cells[r],source_anchors[r])]
    anchors = []; hero_fit = None
    if job.get('hero'):
        heights = []; extents = []
        for line in cells:
            boxes = [c.getchannel('A').point(lambda a:255 if a>40 else 0).getbbox() for c in line]
            neutral = boxes[:4]
            x = float(np.median([(b[0]+b[2])/2 for b in neutral]))
            y = float(np.median([b[3] for b in neutral]))
            anchors.append((x,y))
            heights.extend([b[3]-b[1] for b in neutral])
            extents.extend([(max(x-b[0],b[2]-x), y-b[1], max(0,b[3]-y)) for b in boxes])
        hero_fit = min(size*0.70/float(np.median(heights)),
            size*0.44/max(e[0] for e in extents), size*0.78/max(e[1] for e in extents),
            size*0.09/max(1,max(e[2] for e in extents)))
        hero_fit *= job.get('bodyScale', 1)
    layout_fit = None
    if source_anchors:
        target_y = .86 if layout.get('anchor') == 'feet' else .5
        extents = []
        for line, points in zip(cells, source_anchors):
            for cell, (x,y) in zip(line, points):
                box = cell.getchannel('A').getbbox()
                extents.append((x-box[0], box[2]-x, y-box[1], box[3]-y))
        margin = size*.08
        # One scale for the entire plate. Wide attacks reserve space instead of
        # shrinking independently, so animation scale and effect growth survive.
        layout_fit = min((size*.5-margin)/max(1,max(e[0] for e in extents)),
                         (size*.5-margin)/max(1,max(e[1] for e in extents)),
                         (size*target_y-margin)/max(1,max(e[2] for e in extents)),
                         (size*(1-target_y)-margin)/max(1,max(e[3] for e in extents)))
    sheet = Image.new('RGBA', (columns*size, rows*size))
    for r, line in enumerate(cells):
        for c, cell in enumerate(line):
            # Shared grid-origin and scale, never individually fit each VFX frame.
            shrink = job.get('occupancy', 0.86)
            fit = layout_fit or hero_fit or min(size/cell.width, size/cell.height)*shrink
            rendered = cell.resize((round(cell.width*fit), round(cell.height*fit)), Image.Resampling.LANCZOS)
            frame = Image.new('RGBA', (size,size))
            offset = (round(size*0.5-anchors[r][0]*fit), round(size*0.86-anchors[r][1]*fit)) if hero_fit else ((size-rendered.width)//2, (size-rendered.height)//2)
            if source_anchors:
                ax, ay = source_anchors[r][c]
                offset = (round(size*.5-ax*fit), round(size*target_y-ay*fit))
            frame.alpha_composite(rendered, offset)
            sheet.alpha_composite(frame, (c*size,r*size))
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / (job['id'] + '.png'); sheet.save(path, optimize=True)
    perf_size = job.get('performanceCell', round(size*0.75))
    perf = Image.new('RGBA', (columns*perf_size, rows*perf_size))
    bounds = []
    for r in range(rows):
        for c in range(columns):
            frame = sheet.crop((c*size,r*size,(c+1)*size,(r+1)*size))
            bbox = frame.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox()
            if not bbox: raise ValueError(f'Empty frame {job["id"]} {c}/{r}')
            if min(bbox[0],bbox[1],size-bbox[2],size-bbox[3]) < 4:
                raise ValueError(f'Unsafe gutter {job["id"]} {c}/{r}: {bbox}')
            bounds.append(bbox)
            perf.alpha_composite(frame.resize((perf_size,perf_size), Image.Resampling.LANCZOS), (c*perf_size,r*perf_size))
    (OUT/'performance').mkdir(exist_ok=True)
    perf.save(OUT/'performance'/path.name, optimize=True)
    if job.get('extractRows'):
        for name, row in job['extractRows'].items():
            sheet.crop((0,row*size,columns*size,(row+1)*size)).save(OUT/(name+'.png'), optimize=True)
            perf.crop((0,row*perf_size,columns*perf_size,(row+1)*perf_size)).save(OUT/'performance'/(name+'.png'), optimize=True)
    return dict(id=job['id'], sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),
        sourceSize=raw.size, size=sheet.size, performanceSize=perf.size, frames=len(bounds), bounds=bounds,
        sourceBoundaryChecked=True, sharedSourceScale=layout_fit)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--import-dir', type=Path)
    parser.add_argument('--only', nargs='*')
    args = parser.parse_args()
    jobs = json.loads(RECIPE.read_text(encoding='utf-8'))
    SOURCE.mkdir(parents=True, exist_ok=True)
    reports = []
    for job in jobs:
        if args.only and job['id'] not in args.only: continue
        if args.import_dir:
            candidate = ROOT / job['sourcePath'] if job.get('sourcePath') else args.import_dir / job['generatedFile']
            if not candidate.exists(): raise FileNotFoundError(candidate)
            shutil.copy2(candidate, SOURCE/job.get('sourceFile',job['id']+'.png'))
        reports.append(pack(job))
        print(job['id'], reports[-1]['size'], reports[-1]['frames'])
    qa = ROOT / 'qa/sprite-quality-v3'; qa.mkdir(parents=True, exist_ok=True)
    (qa/'packing-report.json').write_text(json.dumps(reports, indent=2), encoding='utf-8')
    review = ROOT/'tools/combat-sprite-index.json'
    review.parent.mkdir(parents=True,exist_ok=True)
    review.write_text(json.dumps([dict(id=j['id'],columns=j['columns'],rows=j['rows'],
        version=hashlib.sha256((OUT/(j['id']+'.png')).read_bytes()).hexdigest()[:16])
        for j in jobs],indent=2),encoding='utf-8')


if __name__ == '__main__': main()

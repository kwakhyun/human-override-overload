"""User-authorized green-matte extraction and runtime encoding; no generative edits.
Run once with --import-inputs tmp/production-art-inputs.json; then run without it
to reproduce outputs from the archived source manifest. Requires Pillow, numpy.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
INPUTS = ROOT / 'reference/source-assets/overload/runtime-inputs/anime-2026-09-09'
DOC = ROOT / 'docs/art/anime-2026-09-09.json'
OUT = ROOT / 'public/assets/overload'

def relative(path):
    return path.relative_to(ROOT).as_posix()

def cutout(path):
    rgb = np.asarray(Image.open(path).convert('RGB'), dtype=np.float32)
    excess = rgb[:, :, 1] - np.maximum(rgb[:, :, 0], rgb[:, :, 2])
    alpha = np.clip(1 - (excess - 20) / 140, 0, 1)
    # Restrict despill to the keyed boundary; opaque cyan/skin/cloth are intact.
    edge = alpha < 1
    rgb[:, :, 1][edge] = np.minimum(rgb[:, :, 1], np.maximum(rgb[:, :, 0], rgb[:, :, 2]))[edge]
    rgb[alpha == 0] = 0
    rgba = Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), 'RGBA')
    # Common 3:4 canvas; headroom added without inventing missing painted pixels.
    rgba = rgba.resize((912, 1216), Image.Resampling.LANCZOS)
    master = Image.new('RGBA', (960, 1280))
    master.alpha_composite(rgba, (24, 64))
    return master

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--import-inputs', type=Path)
    args = parser.parse_args()
    if args.import_inputs:
        manifest = json.loads(args.import_inputs.read_text(encoding='utf-8'))
        for group, records in [('portraits', manifest['portraits']), ('scenes', manifest['scenes']), ('title', [manifest['title']])]:
            for record in records:
                source = Path(record['source'])
                target = INPUTS / group / f"{record.get('name', 'title')}.png"
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source, target)
                record['source'] = relative(target)
                record['sourceSha256'] = hashlib.sha256(target.read_bytes()).hexdigest()
                record.pop('reference', None)
        DOC.parent.mkdir(parents=True, exist_ok=True)
        DOC.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    manifest = json.loads(DOC.read_text(encoding='utf-8'))
    preview = Image.new('RGB', (1280, 960), '#12202c')
    draw = ImageDraw.Draw(preview)
    for i, item in enumerate(manifest['portraits']):
        image = cutout(ROOT / item['source'])
        master = INPUTS / 'transparent' / f"{item['name']}.png"
        runtime = OUT / 'portraits/anime-v1' / f"{item['name']}.webp"
        master.parent.mkdir(parents=True, exist_ok=True)
        runtime.parent.mkdir(parents=True, exist_ok=True)
        image.save(master)
        image.save(runtime, quality=91, method=6, exact=True)
        item['transparentPng'] = relative(master)
        item['runtime'] = relative(runtime)
        item['canvas'] = [960, 1280]
        item['transparentPixels'] = int(np.count_nonzero(np.asarray(image)[:, :, 3] == 0))
        tile = image.resize((320, 427), Image.Resampling.LANCZOS)
        x, y = (i % 4) * 320, (i // 4) * 480
        preview.paste(tile, (x, y + 35), tile)
        draw.text((x + 16, y + 12), item['name'].upper(), fill='#d7f3fa')
    for item in manifest['scenes']:
        name = 'citadel' if item['name'] == 'title' else item['name']
        runtime = OUT / 'story/awakening' / f'{name}.webp'
        runtime.parent.mkdir(parents=True, exist_ok=True)
        image = Image.open(ROOT / item['source']).convert('RGB')
        image.thumbnail((1672, 1536), Image.Resampling.LANCZOS)
        image.save(runtime, quality=87, method=6)
        item['runtime'] = relative(runtime)
    title = OUT / 'intro/start-screen-anime-v1.webp'
    Image.open(ROOT / manifest['title']['source']).convert('RGB').save(title, quality=90, method=6)
    manifest['title']['runtime'] = relative(title)
    DOC.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    qa = ROOT / 'qa/anime-2026-09-09'
    qa.mkdir(parents=True, exist_ok=True)
    preview.save(qa / 'portraits-dark.png')
    print(json.dumps({'portraits': len(manifest['portraits']), 'scenes': len(manifest['scenes']), 'preview': str(qa / 'portraits-dark.png')}))

if __name__ == '__main__':
    main()

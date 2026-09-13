"""Reproduce Terminal Orbit art from private image_gen masters.

Eight independently generated poses per boss; no synthetic frame multiplication.
The user authorized Python postprocessing. Keep masters and alpha intact.
Floor fallback textures are authored procedural deck inlays, not AI paintings.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import hashlib, json, math

ROOT = Path(__file__).resolve().parents[1]
IDS = ['eclipse-relay', 'ark-transit', 'sovereign-throne']
PALETTES = [(27, 36, 46, '#dcb879'), (20, 37, 52, '#67c6e1'), (33, 27, 45, '#a785cc')]
report = []
for region, palette in zip(IDS, PALETTES):
    source = ROOT / 'reference/source-assets/overload/terminal-orbit' / region
    target = ROOT / 'public/assets/overload/terminal-orbit' / region
    target.mkdir(parents=True, exist_ok=True)
    scene = Image.open(source / 'scene.png').convert('RGB')
    scene.thumbnail((1536, 1024), Image.Resampling.LANCZOS)
    scene.save(target / 'scene.webp', quality=87, method=6)
    raw = Image.open(source / 'boss.png').convert('RGBA')
    if raw.getextrema()[3][0] == 255:
        raise ValueError(f'{region}: missing alpha; review extraction before use')
    cw, ch = raw.width / 4, raw.height / 2
    frames, bounds = [], []
    # Exact isolated source cells: preserve the shared raw registration and scale.
    # Transparent gutters are added around each whole cell; no neighbor fragments.
    for row in range(2):
        for col in range(4):
            box = tuple(round(v) for v in (col*cw, row*ch, (col+1)*cw, (row+1)*ch))
            crop = raw.crop(box)
            bounds.append({'cell': [col, row], 'sourceRect': list(box), 'foreground': crop.getchannel('A').getbbox()})
            crop.thumbnail((284, 284), Image.Resampling.LANCZOS)
            frame = Image.new('RGBA', (320, 320))
            frame.alpha_composite(crop, ((320-crop.width)//2, (320-crop.height)//2))
            frames.append(frame)
    sheet = Image.new('RGBA', (1280, 640))
    for i, frame in enumerate(frames): sheet.alpha_composite(frame, ((i%4)*320, (i//4)*320))
    sheet.save(target / 'boss-motion.png', optimize=True)
    sheet.resize((768, 384), Image.Resampling.LANCZOS).save(target / 'boss-motion-small.png', optimize=True)
    forms = Image.new('RGBA', (960, 320))
    for i, idx in enumerate([0, 3, 6]): forms.alpha_composite(frames[idx], (i*320, 0))
    forms.save(target / 'boss-forms.png', optimize=True)
    # Low-overdraw, top-down fallback deck, matching the native 3D color family.
    floor = Image.new('RGB', (1024, 1024), palette[:3]); d = ImageDraw.Draw(floor)
    for y in range(32, 1024, 64):
        for x in range(32, 1024, 64):
            d.rounded_rectangle((x+2, y+2, x+61, y+61), 3, fill=tuple(c+8 for c in palette[:3]), outline=tuple(c+17 for c in palette[:3]))
            for sx in (x+7, x+56): d.ellipse((sx, y+7, sx+2, y+9), fill='#58616d')
    d.rectangle((36, 36, 988, 988), outline=palette[3], width=3)
    if region == 'ark-transit':
        for y in (435, 460, 560, 585): d.line((40, y, 984, y), fill=palette[3], width=3)
    else:
        for radius in (180, 330, 450): d.ellipse((512-radius,512-radius,512+radius,512+radius), outline=palette[3], width=2)
    floor.save(target / 'floor.webp', quality=88, method=6)
    report.append({'id': region, 'independentPoses': 8, 'motionGrid': [4, 2], 'runtimeCell': 320,
        'sourceSha256': {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in source.glob('*.png')},
        'sourceCells': bounds,
        'outputs': {p.name: {'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in target.iterdir() if p.is_file()}})
(ROOT / 'docs/art/terminal-orbit-assets.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps([{'id': r['id'], 'bytes': sum(p['bytes'] for p in r['outputs'].values())} for r in report]))

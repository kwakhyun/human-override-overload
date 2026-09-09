"""Build new anime-v1 Cubism materials from authored contours, not legacy masks.

Python image postprocessing was explicitly authorized by the user. Generated
face paint is used only behind separated opaque artwork. The neutral visible
composite must reproduce the approved input exactly before a PSD is exported.
"""
import json
import hashlib
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt, binary_dilation
from scipy.sparse import lil_matrix
from scipy.sparse.linalg import spsolve

ROOT = Path(__file__).resolve().parents[1]
SPEC = json.loads((ROOT / 'docs/live2d/anime-v1-parts.json').read_text('utf-8'))
EYES = json.loads((ROOT / 'docs/live2d/anime-v1-eyes.json').read_text('utf-8'))
W, H = SPEC['canvas']
INPUT = ROOT / 'reference/source-assets/overload/live2d-production/anime-v1'
OUT = ROOT / 'reference/source-assets/overload/live2d-production/anime-v2'
SOURCE = ROOT / 'reference/source-assets/overload/runtime-inputs/anime-2026-09-09/transparent'
yy, xx = np.mgrid[:H, :W]


def polygon(points):
    img = Image.new('L', (W, H))
    ImageDraw.Draw(img).polygon([tuple(p) for p in points], fill=255)
    return np.asarray(img) > 0


def ellipse(cx, cy, rx, ry, tilt=0):
    return ((xx-cx)/rx)**2 + ((yy-cy-(xx-cx)*tilt)/ry)**2 <= 1


def skin_backing(src, area):
    """Harmonic fill constrained by the original skin at every boundary pixel."""
    coords=np.argwhere(area)
    lookup=np.full(area.shape,-1,dtype=np.int32)
    lookup[area]=np.arange(len(coords))
    matrix=lil_matrix((len(coords),len(coords)),dtype=float)
    rhs=np.zeros((len(coords),3))
    rgb=src[:,:,:3].astype(int)
    clean=(rgb[:,:,0]>185)&(rgb[:,:,1]>140)&(rgb[:,:,0]-rgb[:,:,2]>18)&(rgb[:,:,0]-rgb[:,:,1]>5)&~area
    nearby=binary_dilation(area,iterations=22)&clean
    if not nearby.any(): raise ValueError('No clean nearby skin')
    _,nearest=distance_transform_edt(~nearby,return_indices=True)
    for index,(y,x) in enumerate(coords):
        matrix[index,index]=4
        for dy,dx in [(0,1),(0,-1),(1,0),(-1,0)]:
            neighbor=lookup[y+dy,x+dx]
            if neighbor>=0: matrix[index,neighbor]=-1
            else:
                sy,sx=y+dy,x+dx
                if not clean[sy,sx]: sy,sx=nearest[:,sy,sx]
                rhs[index]+=src[sy,sx,:3]
    return np.clip(spsolve(matrix.tocsr(),rhs),0,255).astype(np.uint8)


def build(name, spec):
    output = OUT / name
    output.mkdir(parents=True, exist_ok=True)
    source_file = SOURCE / f'{name}.png'
    src = np.array(Image.open(source_file).convert('RGBA'))
    opaque = src[:, :, 3] == 255
    parts = []
    for part, pivot, points in spec['parts']:
        if part.startswith('Hair_Fringe') or part.startswith('Hair_Side'):
            parts.append(dict(name=part, pivot=pivot, mask=polygon(points)))
    for side, eye in zip(['L', 'R'], spec['eyes']):
        points = EYES[name][0 if side == 'L' else 1]
        parts.append(dict(name=f'Eye_{side}', pivot=eye[:2], mask=binary_dilation(polygon(points),iterations=10)))
    mouth = spec['mouth']
    parts.append(dict(name='Mouth', pivot=mouth[:2], mask=ellipse(*mouth)))
    for part, pivot, points in spec['parts']:
        if not part.startswith('Hair_Fringe') and not part.startswith('Hair_Side'):
            parts.append(dict(name=part, pivot=pivot, mask=polygon(points)))
    parts.append(dict(name='Hair_Crown', pivot=[480,150], mask=polygon([[220,0],[760,0],[760,300],[600,295],[480,190],[330,295],[220,330]])))
    parts.append(dict(name='Torso', pivot=[480,1240], mask=np.ones((H,W), dtype=bool)))
    owner = np.full((H, W), -1, dtype=np.int16)
    for i, part in enumerate(parts):
        owner[(owner < 0) & part['mask'] & (src[:,:,3] > 0)] = i
    crop = spec['headCrop']
    face_paint = np.array(Image.open(INPUT / f'{name}-face-underpaint.png').convert('RGBA').resize((crop[2]-crop[0],crop[3]-crop[1]),Image.Resampling.LANCZOS))
    under = np.zeros_like(src)
    under[crop[1]:crop[3],crop[0]:crop[2]] = face_paint
    face_mask = polygon(spec['face'])
    metadata = []
    layers = []
    for i, part in enumerate(parts):
        owned = owner == i
        if not owned.any():
            continue
        data = np.zeros_like(src)
        data[owned] = src[owned]
        # Material-colored concealed margins instead of copying foreground
        # hair/garment pixels into the backing layer and leaving a ghost edge.
        overlap = binary_dilation(owned, iterations=2 if part['name'].startswith('Eye_') else 10) & (owner < i) & opaque
        if overlap.any():
            _, nearest = distance_transform_edt(~owned, return_indices=True)
            data[overlap] = src[nearest[0][overlap],nearest[1][overlap]]
            data[overlap,3] = 255
        hidden = np.zeros((H,W),dtype=bool)
        if part['name'] == 'Face_Neck':
            front_ids = [j for j,p in enumerate(parts) if p['name'].startswith(('Hair_Fringe','Hair_Side'))]
            hidden = face_mask & np.isin(owner, front_ids) & opaque
            # Never use generated transparency/backdrop: only interior skin.
            skin = (under[:,:,0].astype(int) > under[:,:,2].astype(int)+6) & (under[:,:,0] > 120)
            hidden &= skin
            data[hidden,:3] = under[hidden,:3]
            data[hidden,3] = 255
            # Eye backing samples the approved cheek itself. Generated face paint
            # drifts in tone and is unsuitable for exposed eyelid closures.
            for side, eye in zip(['L','R'], spec['eyes']):
                eye_id = next(j for j,p in enumerate(parts) if p['name']==f'Eye_{side}')
                area = owner == eye_id
                data[area,:3] = skin_backing(src,area)
                data[area,3] = 255
        image = Image.fromarray(data)
        bounds = image.getbbox()
        image.crop(bounds).save(output / f"{part['name']}.png")
        layers.append(data)
        metadata.append(dict(name=part['name'], pivot=part['pivot'], bounds=list(bounds), overlapPixels=int(overlap.sum()), concealedFacePixels=int(hidden.sum())))
    neutral = Image.new('RGBA',(W,H))
    for data in reversed(layers):
        neutral = Image.alpha_composite(neutral, Image.fromarray(data))
    result = np.array(neutral)
    visible = src[:,:,3] > 0
    differences = int(np.count_nonzero(result[visible] != src[visible]))
    if differences:
        raise ValueError(f'{name}: neutral composite changed {differences} visible channels')
    neutral.save(output / 'neutral.png')
    # Separately painted eyelids provide a proper closed-eye silhouette.
    # They are invisible at neutral and never replace the approved face.
    closed_crop=np.array(Image.open(OUT/f'{name}-closed-source.png').convert('RGBA').resize((crop[2]-crop[0],crop[3]-crop[1]),Image.Resampling.LANCZOS))
    closed_src=np.zeros_like(src)
    closed_src[crop[1]:crop[3],crop[0]:crop[2]]=closed_crop
    closed_preview=neutral.copy()
    for side,eye in zip(['L','R'],spec['eyes']):
        area=binary_dilation(polygon(EYES[name][0 if side=='L' else 1]),iterations=12)&opaque
        alpha=np.clip(distance_transform_edt(area)/6,0,1)
        data=closed_src.copy()
        data[:,:,3]=(alpha*255).astype(np.uint8)
        image=Image.fromarray(data)
        bounds=image.getbbox()
        part_name=f'ClosedEye_{side}'
        image.crop(bounds).save(output/f'{part_name}.png')
        metadata.insert(0,dict(name=part_name,pivot=eye[:2],bounds=list(bounds),defaultOpacity=0))
        closed_preview=Image.alpha_composite(closed_preview,image)
    closed_preview.crop(crop).save(output/'closed-painted-preflight.png')
    # Markers are authoring-only pivot locators. Set their ArtMesh opacity to 0
    # before export; the SDK rig never displays these helper pixels.
    for part in metadata:
        px,py = map(int,part['pivot'])
        Image.new('RGBA',(4,4),(255,255,255,255)).save(output/f"Pivot_{part['name']}.png")
        part['pivotBounds'] = [px-2,py-2,px+2,py+2]
    manifest = dict(character=name, canvas=[W,H], source=source_file.relative_to(ROOT).as_posix(), sourceSha256=hashlib.sha256(source_file.read_bytes()).hexdigest(), neutralPixelDifferences=differences, status='Separated material; rig and deformation QA pending',layers=metadata)
    (output/'parts.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),'utf-8')
    print(json.dumps(dict(character=name,layers=len(metadata),neutralPixelDifferences=differences)))


if __name__ == '__main__':
    for name, spec in SPEC['characters'].items():
        build(name,spec)

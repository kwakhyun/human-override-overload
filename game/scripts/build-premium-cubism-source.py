"""Build character-specific, high-density Cubism import PSDs.

The original lobby models were assembled from ten coarse raster pieces.  This
pipeline partitions the approved neutral ImageGen rig sources into semantic
face, hair, accessory, limb and body layers while preserving the neutral
composite pixel-for-pixel.  The PSDs remain editable source material; Cubism
Editor is still the authority that creates meshes, deformers, physics and the
runtime ``.moc3`` bundle.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Iterable

from PIL import Image, ImageChops, ImageDraw, ImageFilter
from psd_tools import PSDImage
from psd_tools.api.layers import Group, PixelLayer


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "reference" / "source-assets" / "overload" / "cubism-v2"


@dataclass(frozen=True)
class CharacterRigSpec:
    character_id: str
    hair_mode: str
    regions: tuple[tuple[str, tuple[tuple[int, int], ...]], ...]
    feature_boxes: tuple[tuple[str, tuple[int, int, int, int]], ...]


AEGIS_REGIONS = (
    ("Hair_Outer_L", ((170, 65), (395, 45), (415, 790), (170, 790))),
    ("Hair_Inner_L", ((320, 55), (462, 45), (462, 660), (315, 660))),
    ("Hair_Inner_R", ((478, 45), (620, 55), (625, 660), (478, 660))),
    ("Hair_Outer_R", ((545, 45), (770, 65), (770, 790), (525, 790))),
    ("Coat_Tail_L", ((130, 330), (390, 320), (365, 1420), (120, 1420))),
    ("Coat_Tail_R", ((550, 320), (810, 330), (820, 1420), (575, 1420))),
    ("Hand_L", ((145, 755), (250, 755), (245, 955), (135, 955))),
    ("Hand_R", ((690, 755), (795, 755), (805, 955), (695, 955))),
    ("Forearm_L", ((170, 535), (325, 530), (270, 810), (150, 815))),
    ("Forearm_R", ((615, 530), (770, 535), (790, 815), (670, 810))),
    ("UpperArm_L", ((245, 285), (405, 290), (345, 610), (205, 600))),
    ("UpperArm_R", ((535, 290), (695, 285), (735, 600), (595, 610))),
    ("Boot_L", ((270, 1335), (435, 1335), (410, 1645), (275, 1645))),
    ("Boot_R", ((505, 1335), (670, 1335), (665, 1645), (530, 1645))),
    ("Shin_L", ((255, 1030), (450, 1030), (430, 1425), (270, 1425))),
    ("Shin_R", ((490, 1030), (685, 1030), (670, 1425), (510, 1425))),
    ("Thigh_L", ((250, 735), (470, 735), (450, 1110), (245, 1110))),
    ("Thigh_R", ((470, 735), (690, 735), (695, 1110), (490, 1110))),
    ("Pelvis", ((315, 610), (630, 610), (665, 830), (280, 830))),
    ("Waist", ((335, 455), (610, 455), (640, 690), (305, 690))),
    ("Torso", ((300, 275), (640, 275), (625, 545), (315, 545))),
)

MIKA_REGIONS = (
    ("Ring_L", ((120, 115), (315, 115), (315, 405), (120, 405))),
    ("Ring_R", ((625, 115), (820, 115), (820, 405), (625, 405))),
    ("TwinTail_Outer_L", ((140, 75), (390, 70), (430, 600), (130, 600))),
    ("TwinTail_Inner_L", ((315, 80), (470, 75), (470, 590), (285, 590))),
    ("TwinTail_Inner_R", ((470, 75), (625, 80), (655, 590), (470, 590))),
    ("TwinTail_Outer_R", ((550, 70), (800, 75), (810, 600), (510, 600))),
    ("Hand_L", ((165, 745), (285, 745), (275, 930), (150, 930))),
    ("Hand_R", ((655, 745), (775, 745), (790, 930), (665, 930))),
    ("Forearm_L", ((180, 565), (355, 560), (300, 805), (160, 805))),
    ("Forearm_R", ((585, 560), (760, 565), (780, 805), (640, 805))),
    ("UpperArm_L", ((260, 325), (420, 325), (370, 640), (215, 625))),
    ("UpperArm_R", ((520, 325), (680, 325), (725, 625), (570, 640))),
    ("Boot_L", ((270, 1325), (455, 1325), (445, 1635), (270, 1635))),
    ("Boot_R", ((485, 1325), (670, 1325), (670, 1635), (495, 1635))),
    ("Shin_L", ((270, 930), (465, 930), (450, 1410), (270, 1410))),
    ("Shin_R", ((475, 930), (670, 930), (670, 1410), (490, 1410))),
    ("Thigh_L", ((275, 785), (470, 785), (465, 1030), (270, 1030))),
    ("Thigh_R", ((470, 785), (665, 785), (670, 1030), (475, 1030))),
    ("Pelvis", ((315, 625), (625, 625), (670, 855), (270, 855))),
    ("Waist", ((335, 470), (605, 470), (635, 700), (305, 700))),
    ("Torso", ((300, 300), (640, 300), (625, 535), (315, 535))),
)


SPECS = (
    CharacterRigSpec(
        "aegis",
        "silver",
        AEGIS_REGIONS,
        (
            ("Eye_L", (392, 157, 466, 205)),
            ("Eye_R", (478, 157, 552, 205)),
            ("Brow_L", (390, 140, 465, 172)),
            ("Brow_R", (478, 140, 553, 172)),
            ("Mouth", (432, 205, 512, 245)),
            ("Face_Base", (365, 115, 580, 260)),
        ),
    ),
    CharacterRigSpec(
        "mika",
        "pink",
        MIKA_REGIONS,
        (
            ("Eye_L", (404, 218, 468, 258)),
            ("Eye_R", (480, 218, 544, 258)),
            ("Brow_L", (400, 200, 468, 229)),
            ("Brow_R", (480, 200, 548, 229)),
            ("Mouth", (438, 270, 512, 310)),
            ("Face_Base", (375, 165, 570, 320)),
        ),
    ),
)


def polygon_mask(size: tuple[int, int], points: Iterable[tuple[int, int]], feather: float = 0.0) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).polygon(tuple(points), fill=255)
    return mask.filter(ImageFilter.GaussianBlur(feather)) if feather else mask


def rectangle_mask(size: tuple[int, int], box: tuple[int, int, int, int], feather: float = 0.0) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rectangle(box, fill=255)
    return mask.filter(ImageFilter.GaussianBlur(feather)) if feather else mask


def hair_mask(source: Image.Image, mode: str) -> Image.Image:
    rgb = source.convert("RGB")
    alpha = source.getchannel("A")
    pixels = rgb.load()
    out = Image.new("L", source.size, 0)
    target = out.load()
    for y in range(source.height):
        for x in range(source.width):
            if alpha.getpixel((x, y)) < 12:
                continue
            r, g, b = pixels[x, y]
            if mode == "pink":
                keep = r > 105 and r > g * 1.16 and r > b * 1.01 and y < 640
            else:
                spread = max(r, g, b) - min(r, g, b)
                keep = r > 82 and g > 82 and b > 92 and spread < 105 and y < 810
            if keep:
                target[x, y] = 255
    return out.filter(ImageFilter.MaxFilter(5)).point(lambda value: 255 if value >= 128 else 0)


def white_coat_mask(source: Image.Image) -> Image.Image:
    rgb = source.convert("RGB")
    alpha = source.getchannel("A")
    pixels = rgb.load()
    out = Image.new("L", source.size, 0)
    target = out.load()
    for y in range(source.height):
        for x in range(source.width):
            if alpha.getpixel((x, y)) < 12:
                continue
            r, g, b = pixels[x, y]
            if min(r, g, b) > 92 and max(r, g, b) - min(r, g, b) < 92:
                target[x, y] = 255
    return out.filter(ImageFilter.MaxFilter(3)).point(lambda value: 255 if value >= 128 else 0)


def add_layer(parent: Group, canvas: Image.Image, name: str) -> None:
    bbox = canvas.getchannel("A").getbbox()
    if bbox is None:
        return
    left, top, right, bottom = bbox
    PixelLayer.frompil(canvas.crop(bbox), parent, name=name, top=top, left=left)


def extract(source: Image.Image, remaining: Image.Image, mask: Image.Image) -> tuple[Image.Image, Image.Image]:
    effective = ImageChops.multiply(remaining, mask)
    layer = Image.new("RGBA", source.size, (0, 0, 0, 0))
    layer.paste(source, (0, 0), effective)
    return layer, ImageChops.subtract(remaining, effective)


def split_colored_region(
    source: Image.Image,
    remaining: Image.Image,
    region: Image.Image,
    predicate: Image.Image,
) -> tuple[Image.Image, Image.Image]:
    return extract(source, remaining, ImageChops.multiply(region, predicate))


def build_character(spec: CharacterRigSpec) -> Path:
    target_dir = SOURCE_ROOT / spec.character_id
    source_path = target_dir / f"{spec.character_id}-rig-source-alpha.png"
    source = Image.open(source_path).convert("RGBA")
    remaining = source.getchannel("A")
    layers: list[tuple[str, Image.Image]] = []

    # Small facial elements are extracted first so brows/eyes/mouth stay
    # independently addressable even where the broad face mask overlaps them.
    for name, box in spec.feature_boxes[:-1]:
        layer, remaining = extract(source, remaining, rectangle_mask(source.size, box))
        layers.append((name, layer))

    hair = hair_mask(source, spec.hair_mode)
    coat = white_coat_mask(source)

    # Character-specific accessories and hair masses use colour-constrained
    # region masks.  This avoids swallowing nearby black armor into hair parts.
    for name, points in spec.regions:
        region = polygon_mask(source.size, points)
        if name.startswith(("Hair_", "TwinTail_")):
            layer, remaining = split_colored_region(source, remaining, region, hair)
        elif name.startswith("Coat_Tail_"):
            layer, remaining = split_colored_region(source, remaining, region, coat)
        else:
            layer, remaining = extract(source, remaining, region)
        layers.append((name, layer))

    face_name, face_box = spec.feature_boxes[-1]
    face_layer, remaining = extract(source, remaining, rectangle_mask(source.size, face_box))
    layers.append((face_name, face_layer))

    # Keep unresolved highlights and micro-accessories in a stable core layer;
    # the union of all layers exactly reproduces the approved neutral source.
    core = source.copy()
    core.putalpha(remaining)
    layers.append(("Body_Core_Detail", core))

    psd = PSDImage.new("RGBA", source.size, color=(0, 0, 0, 0))
    root_group = Group.new(psd, name=f"{spec.character_id.upper()}_PREMIUM_CUBISM_SOURCE")
    for name, layer in reversed(layers):
        group = Group.new(root_group, name=f"{name}_Part")
        add_layer(group, layer, name)

    output = target_dir / f"{spec.character_id}-premium-cubism-source.psd"
    psd.save(output)
    psd.composite().save(target_dir / f"{spec.character_id}-premium-cubism-preview.png")
    print(f"{spec.character_id}: {sum(1 for _, layer in layers if layer.getchannel('A').getbbox())} layers -> {output}")
    return output


def main() -> None:
    for spec in SPECS:
        build_character(spec)


if __name__ == "__main__":
    main()

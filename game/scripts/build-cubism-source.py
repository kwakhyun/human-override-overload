"""Build layered Cubism Editor import PSDs from the approved character portraits.

This script does not fabricate a `.moc3`. It prepares editable PSD material that
Cubism Editor can import. The binary runtime model must still be exported by the
licensed Editor after its ArtMeshes and parameters are rigged.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter
from psd_tools import PSDImage
from psd_tools.api.layers import Group, PixelLayer


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public" / "assets" / "overload" / "hero"
OUTPUT = ROOT / "reference" / "source-assets" / "overload" / "cubism"


@dataclass(frozen=True)
class Feature:
    name: str
    box: tuple[int, int, int, int]
    feather: int = 3
    underpaint_offset_y: int = 34


@dataclass(frozen=True)
class CharacterSpec:
    character_id: str
    source_name: str
    face_box: tuple[int, int, int, int]
    features: tuple[Feature, ...]
    segment_polygons: tuple[tuple[str, tuple[tuple[int, int], ...]], ...]
    hair_mode: str


SPECS = (
    CharacterSpec(
        character_id="aegis",
        source_name="survivor-portrait.png",
        face_box=(320, 120, 690, 440),
        features=(
            Feature("Eye_L", (438, 247, 514, 303), underpaint_offset_y=45),
            Feature("Eye_R", (531, 260, 607, 316), underpaint_offset_y=43),
            Feature("Mouth", (502, 334, 572, 380), underpaint_offset_y=-34),
        ),
        segment_polygons=(
            ("Arm_L", ((62, 710), (245, 472), (400, 515), (332, 1370), (95, 1505))),
            ("Arm_R", ((555, 455), (710, 492), (864, 1210), (750, 1355), (598, 950))),
            ("Lower_Body", ((235, 1015), (710, 1015), (820, 1672), (155, 1672))),
        ),
        hair_mode="silver",
    ),
    CharacterSpec(
        character_id="mika",
        source_name="mika-live2d-fullbody.png",
        face_box=(315, 130, 660, 445),
        features=(
            Feature("Eye_L", (420, 244, 493, 298), underpaint_offset_y=42),
            Feature("Eye_R", (526, 249, 598, 304), underpaint_offset_y=40),
            Feature("Mouth", (482, 328, 554, 375), underpaint_offset_y=-32),
        ),
        segment_polygons=(
            ("Arm_L", ((185, 495), (340, 390), (425, 560), (330, 925), (170, 910))),
            ("Arm_R", ((585, 300), (750, 325), (820, 690), (675, 730), (555, 535))),
            ("Lower_Body", ((300, 755), (650, 755), (690, 1645), (300, 1645))),
        ),
        hair_mode="pink",
    ),
)


def ellipse_mask(size: tuple[int, int], box: tuple[int, int, int, int], feather: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).ellipse(box, fill=255)
    if feather:
        mask = mask.filter(ImageFilter.GaussianBlur(feather))
    return mask


def feature_layer(source: Image.Image, feature: Feature) -> Image.Image:
    mask = ellipse_mask(source.size, feature.box, feature.feather)
    layer = Image.new("RGBA", source.size, (0, 0, 0, 0))
    layer.paste(source, (0, 0), mask)
    return layer


def polygon_mask(size: tuple[int, int], points: tuple[tuple[int, int], ...], feather: int = 3) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).polygon(points, fill=255)
    if feather:
        mask = mask.filter(ImageFilter.GaussianBlur(feather))
    return mask


def alpha_intersection(source: Image.Image, mask: Image.Image) -> Image.Image:
    return ImageChops.multiply(source.getchannel("A"), mask)


def masked_layer(source: Image.Image, mask: Image.Image) -> Image.Image:
    layer = Image.new("RGBA", source.size, (0, 0, 0, 0))
    layer.paste(source, (0, 0), alpha_intersection(source, mask))
    return layer


def color_hair_mask(source: Image.Image, mode: str) -> Image.Image:
    """Extract a conservative hair core; soft region masks supply the loose tips."""
    rgb = source.convert("RGB")
    pixels = rgb.load()
    out = Image.new("L", source.size, 0)
    target = out.load()
    for y in range(source.height):
        for x in range(source.width):
            r, g, b = pixels[x, y]
            if mode == "pink":
                keep = r > 125 and r > g * 1.12 and r > b * 1.02 and y < 790
            else:
                spread = max(r, g, b) - min(r, g, b)
                keep = r > 95 and g > 95 and b > 105 and spread < 92 and y < 1180
            if keep:
                target[x, y] = 255
    return out.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(2.2))


def build_segment_masks(spec: CharacterSpec, source: Image.Image) -> list[tuple[str, Image.Image]]:
    masks: list[tuple[str, Image.Image]] = []
    hair = color_hair_mask(source, spec.hair_mode)
    width, height = source.size
    if spec.hair_mode == "pink":
        front_region = polygon_mask(source.size, ((270, 80), (665, 80), (675, 440), (285, 455)), 8)
        left_region = polygon_mask(source.size, ((105, 80), (455, 70), (470, 825), (135, 825)), 8)
        right_region = polygon_mask(source.size, ((485, 75), (820, 75), (825, 800), (475, 800)), 8)
    else:
        front_region = polygon_mask(source.size, ((245, 55), (690, 55), (690, 525), (245, 540)), 8)
        left_region = polygon_mask(source.size, ((20, 70), (475, 65), (455, 1230), (15, 1230)), 8)
        right_region = polygon_mask(source.size, ((470, 65), (875, 70), (900, 1160), (455, 1160)), 8)
    masks.extend((
        ("Hair_Back_L", ImageChops.multiply(hair, left_region)),
        ("Hair_Back_R", ImageChops.multiply(hair, right_region)),
        ("Hair_Front", ImageChops.multiply(hair, front_region)),
    ))
    for name, points in spec.segment_polygons:
        masks.append((name, polygon_mask((width, height), points)))
    return masks


def subtract_masks(source: Image.Image, masks: list[Image.Image]) -> Image.Image:
    remaining = source.getchannel("A")
    combined = Image.new("L", source.size, 0)
    for mask in masks:
        combined = ImageChops.lighter(combined, mask)
    remaining = ImageChops.subtract(remaining, combined)
    base = source.copy()
    base.putalpha(remaining)
    return base


def add_trimmed_layer(parent: Group, image: Image.Image, name: str) -> PixelLayer:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        raise ValueError(f"Cubism source layer {name} is empty")
    left, top, right, bottom = bbox
    return PixelLayer.frompil(image.crop(bbox), parent, name=name, top=top, left=left)


def underpaint_feature(base: Image.Image, feature: Feature) -> None:
    left, top, right, bottom = feature.box
    dy = feature.underpaint_offset_y
    src_top = max(0, min(base.height - (bottom - top), top + dy))
    patch = base.crop((left, src_top, right, src_top + (bottom - top)))
    patch = patch.filter(ImageFilter.GaussianBlur(2.2))
    mask = ellipse_mask(base.size, feature.box, feature.feather + 2).crop(feature.box)
    base.paste(patch, (left, top), mask)


def build_psd(spec: CharacterSpec) -> Path:
    source_path = PUBLIC / spec.source_name
    source = Image.open(source_path).convert("RGBA")
    segments = build_segment_masks(spec, source)
    feature_masks = [ellipse_mask(source.size, feature.box, feature.feather) for feature in spec.features]
    base = subtract_masks(source, [mask for _, mask in segments] + feature_masks)
    for feature in spec.features:
        underpaint_feature(base, feature)

    psd = PSDImage.new("RGBA", source.size, color=(0, 0, 0, 0))
    model = Group.new(psd, name=f"{spec.character_id.upper()}_CUBISM_SOURCE")
    face_base = Group.new(model, name="Body_Base_Part")
    add_trimmed_layer(face_base, base, "Body_Base")
    for segment_name, segment_mask in reversed(segments):
        segment_part = Group.new(model, name=f"{segment_name}_Part")
        add_trimmed_layer(segment_part, masked_layer(source, segment_mask), segment_name)
    for feature in spec.features:
        feature_part = Group.new(model, name=f"{feature.name}_Part")
        add_trimmed_layer(feature_part, feature_layer(source, feature), feature.name)

    target_dir = OUTPUT / spec.character_id
    target_dir.mkdir(parents=True, exist_ok=True)
    output_path = target_dir / f"{spec.character_id}-cubism-source.psd"
    psd.save(output_path)

    composite = psd.composite()
    composite.save(target_dir / f"{spec.character_id}-cubism-source-preview.png")
    return output_path


def build_coordinate_preview(spec: CharacterSpec) -> Path:
    source = Image.open(PUBLIC / spec.source_name).convert("RGBA")
    canvas = Image.new("RGBA", source.size, (18, 24, 30, 255))
    canvas.alpha_composite(source)
    draw = ImageDraw.Draw(canvas)
    step = 50
    for x in range(0, source.width, step):
        draw.line((x, 0, x, source.height), fill=(0, 235, 255, 90), width=1)
        draw.text((x + 2, 2), str(x), fill=(180, 250, 255, 210))
    for y in range(0, source.height, step):
        draw.line((0, y, source.width, y), fill=(0, 235, 255, 90), width=1)
        draw.text((2, y + 2), str(y), fill=(180, 250, 255, 210))
    draw.rectangle(spec.face_box, outline=(255, 197, 65, 255), width=3)
    for feature in spec.features:
        draw.rectangle(feature.box, outline=(255, 65, 145, 255), width=2)

    target_dir = OUTPUT / spec.character_id
    target_dir.mkdir(parents=True, exist_ok=True)
    path = target_dir / f"{spec.character_id}-coordinates.png"
    canvas.crop(spec.face_box).save(path)
    return path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--coordinates", action="store_true", help="write face coordinate previews")
    args = parser.parse_args()
    for spec in SPECS:
        result = build_coordinate_preview(spec) if args.coordinates else build_psd(spec)
        print(result)


if __name__ == "__main__":
    main()

"""Build layered Cubism Editor import PSDs from the approved character portraits.

This script does not fabricate a `.moc3`. It prepares editable PSD material that
Cubism Editor can import. The binary runtime model must still be exported by the
licensed Editor after its ArtMeshes and parameters are rigged.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter
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
    ),
    CharacterSpec(
        character_id="mika",
        source_name="mika-portrait.png",
        face_box=(305, 160, 665, 535),
        features=(
            Feature("Eye_L", (425, 333, 501, 395), underpaint_offset_y=48),
            Feature("Eye_R", (536, 340, 611, 402), underpaint_offset_y=46),
            Feature("Mouth", (482, 428, 560, 478), underpaint_offset_y=-38),
        ),
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
    base = source.copy()
    for feature in spec.features:
        underpaint_feature(base, feature)

    psd = PSDImage.new("RGBA", source.size, color=(0, 0, 0, 0))
    model = Group.new(psd, name=f"{spec.character_id.upper()}_CUBISM_SOURCE")
    face_base = Group.new(model, name="Face_Base_Part")
    PixelLayer.frompil(base, face_base, name="Face_Body_Base")
    for feature in spec.features:
        feature_part = Group.new(model, name=f"{feature.name}_Part")
        PixelLayer.frompil(feature_layer(source, feature), feature_part, name=feature.name)

    guide = Group.new(model, name="GUIDE_HIDDEN")
    PixelLayer.frompil(source, guide, name="Approved_Composite_Reference", opacity=0)

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

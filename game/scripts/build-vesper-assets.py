"""Normalize regenerated VESPER portrait and 8-direction atlas assets."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw

from operative_portrait_contract import write_contract


ROOT = Path(__file__).resolve().parents[1]


def clear_hidden_rgb(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = bytearray(rgba.tobytes())
    for index in range(0, len(pixels), 4):
        if pixels[index + 3] == 0:
            pixels[index:index + 4] = b"\x00\x00\x00\x00"
    return Image.frombytes("RGBA", rgba.size, bytes(pixels))


def remove_chroma_green(image: Image.Image) -> Image.Image:
    """Key the generated green plate with soft alpha and edge despill."""

    rgba = image.convert("RGBA")
    pixels = bytearray(rgba.tobytes())
    for index in range(0, len(pixels), 4):
        red, green, blue, source_alpha = pixels[index:index + 4]
        dominance = green - max(red, blue)
        if green >= 86 and dominance >= 70:
            alpha = 0
        elif green >= 58 and dominance >= 16:
            alpha = round(255 * (70 - dominance) / 54)
            alpha = max(0, min(255, alpha))
        else:
            alpha = 255
        alpha = min(source_alpha, alpha)
        if alpha == 0:
            pixels[index:index + 4] = b"\x00\x00\x00\x00"
        else:
            pixels[index + 1] = min(green, max(red, blue) + 10)
            pixels[index + 3] = alpha
    return clear_hidden_rgb(Image.frombytes("RGBA", rgba.size, bytes(pixels)))


def premultiplied_resize(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return image.convert("RGBa").resize(size, Image.Resampling.LANCZOS).convert("RGBA")


def normalize_portrait(source: Image.Image) -> Image.Image:
    source = remove_chroma_green(source)
    bounds = source.getchannel("A").getbbox()
    if bounds is None:
        raise SystemExit("VESPER portrait is empty after chroma removal")
    subject = source.crop(bounds)
    # Operative key art shares one floor-anchored 9:16 stage. VESPER's cape is
    # capped by the same 16px side safety used by the roster contract, while
    # her authored tall stature is preserved within the shared height range.
    scale = min(832 / subject.width, 1464 / subject.height)
    subject = premultiplied_resize(subject, (round(subject.width * scale), round(subject.height * scale)))
    canvas = Image.new("RGBA", (864, 1536), (0, 0, 0, 0))
    canvas.alpha_composite(subject, ((864 - subject.width) // 2, 1536 - subject.height))
    return clear_hidden_rgb(canvas)


def normalize_directional_atlas(source: Image.Image) -> Image.Image:
    source = source.convert("RGB").resize((1024, 1024), Image.Resampling.LANCZOS)
    frames: list[Image.Image] = []
    for row in range(8):
        for column in range(8):
            frame = remove_chroma_green(
                source.crop((column * 128, row * 128, (column + 1) * 128, (row + 1) * 128))
            )
            alpha = frame.getchannel("A").point(lambda value: 255 if value > 8 else 0)
            bounds = alpha.getbbox()
            if bounds is None:
                raise SystemExit(f"VESPER atlas frame {row},{column} is empty")
            frames.append(frame.crop(bounds))

    max_width = max(frame.width for frame in frames)
    max_height = max(frame.height for frame in frames)
    shared_scale = min(116 / max_width, 116 / max_height)
    atlas = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        width = max(1, round(frame.width * shared_scale))
        height = max(1, round(frame.height * shared_scale))
        frame = premultiplied_resize(frame, (width, height))
        x = (index % 8) * 128 + (128 - width) // 2
        y = (index // 8) * 128 + 122 - height
        atlas.alpha_composite(frame, (x, y))
    return clear_hidden_rgb(atlas)


def checker_preview(image: Image.Image, tile: int = 20) -> Image.Image:
    preview = Image.new("RGBA", image.size, (226, 231, 236, 255))
    draw = ImageDraw.Draw(preview)
    for top in range(0, preview.height, tile):
        for left in range(0, preview.width, tile):
            color = (244, 247, 249, 255) if (left // tile + top // tile) % 2 == 0 else (219, 225, 230, 255)
            draw.rectangle((left, top, left + tile, top + tile), fill=color)
    preview.alpha_composite(image)
    return preview


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--portrait", required=True, type=Path)
    parser.add_argument("--atlas", required=True, type=Path)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    portrait_chroma = Image.open(args.portrait).convert("RGB")
    atlas_chroma = Image.open(args.atlas).convert("RGB")
    portrait = normalize_portrait(portrait_chroma)
    atlas = normalize_directional_atlas(atlas_chroma)

    portrait_chroma_path = ROOT / "reference/source-assets/overload/portraits/chroma/vesper-mid-thigh-v7-chroma.png"
    portrait_master_path = ROOT / "reference/source-assets/overload/hero/vesper-portrait-v7-master.png"
    atlas_chroma_path = ROOT / "reference/source-assets/overload/hero/vesper-directional-aim-v7-chroma.png"
    atlas_master_path = ROOT / "reference/source-assets/overload/hero/vesper-directional-aim-v7-alpha.png"
    runtime_portrait_path = ROOT / "public/assets/overload/hero/vesper-portrait-v7.webp"
    runtime_atlas_path = ROOT / "public/assets/overload/hero/vesper-directional-aim-atlas.png"
    performance_atlas_path = ROOT / "public/assets/overload/hero/performance/vesper-directional-aim-atlas.png"
    preview_dir = ROOT / "tmp/character-factory/vesper"

    for path in (
        portrait_chroma_path,
        portrait_master_path,
        atlas_chroma_path,
        atlas_master_path,
        runtime_portrait_path,
        runtime_atlas_path,
        performance_atlas_path,
    ):
        path.parent.mkdir(parents=True, exist_ok=True)
    preview_dir.mkdir(parents=True, exist_ok=True)

    portrait_chroma.save(portrait_chroma_path, optimize=True)
    atlas_chroma.save(atlas_chroma_path, optimize=True)
    portrait.save(portrait_master_path, optimize=True)
    atlas.save(atlas_master_path, optimize=True)
    portrait.save(runtime_portrait_path, "WEBP", quality=94, method=6, exact=True)
    atlas.save(runtime_atlas_path, optimize=True)
    # HUMAN OVERRIDE keeps performance atlases on the shared 768px roster
    # baseline. Runtime sampling still uses the same 8x8/96px-cell contract,
    # while the full 1024px atlas remains available for high-quality mode.
    premultiplied_resize(atlas, (768, 768)).save(performance_atlas_path, optimize=True)
    checker_preview(portrait).resize((432, 768), Image.Resampling.LANCZOS).save(
        preview_dir / "portrait-checker.png", optimize=True
    )
    checker_preview(atlas).save(preview_dir / "atlas-checker.png", optimize=True)

    write_contract()

    print(f"portrait={portrait.size} alpha={portrait.getchannel('A').getextrema()} bbox={portrait.getchannel('A').getbbox()}")
    print(f"atlas={atlas.size} alpha={atlas.getchannel('A').getextrema()} bbox={atlas.getchannel('A').getbbox()}")
    print(f"performance={(768, 768)}")


if __name__ == "__main__":
    main()

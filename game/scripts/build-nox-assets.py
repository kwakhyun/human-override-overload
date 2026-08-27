"""Normalize generated NOX art into the HUMAN OVERRIDE shipping contracts."""

from __future__ import annotations

import argparse
from collections import Counter
from pathlib import Path

from PIL import Image, ImageDraw

from operative_portrait_contract import write_contract


ROOT = Path(__file__).resolve().parents[1]


def is_light_matte(pixel: tuple[int, int, int]) -> bool:
    red, green, blue = pixel
    return min(red, green, blue) >= 205 and max(red, green, blue) - min(red, green, blue) <= 24


def remove_connected_light_matte(image: Image.Image) -> Image.Image:
    """Remove a generated white/checker matte without punching costume whites."""

    rgb = image.convert("RGB")
    width, height = rgb.size
    pixels = rgb.load()
    visited = bytearray(width * height)
    from collections import deque

    queue: deque[tuple[int, int]] = deque()

    def enqueue(x: int, y: int) -> None:
        index = y * width + x
        if visited[index] or not is_light_matte(pixels[x, y]):
            return
        visited[index] = 1
        queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        for next_x, next_y in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= next_x < width and 0 <= next_y < height:
                enqueue(next_x, next_y)

    alpha_values = [0 if value else 255 for value in visited]
    alpha = Image.new("L", (width, height))
    alpha.putdata(alpha_values)
    rgba = rgb.convert("RGBA")
    rgba.putalpha(alpha)
    return clear_hidden_rgb(rgba)


def remove_chroma_green(image: Image.Image) -> Image.Image:
    """Key generated #00ff00 plates while preserving antialiased edge alpha.

    NOX has no green identity colors, so a dominance key is safer than trying
    to infer transparency from generated white/checkerboard pixels. The soft
    transition also suppresses green spill around hair and monowire edges.
    """

    rgba = image.convert("RGBA")
    data = bytearray(rgba.tobytes())
    for index in range(0, len(data), 4):
        red, green, blue, source_alpha = data[index:index + 4]
        dominance = green - max(red, blue)
        if green >= 90 and dominance >= 72:
            alpha = 0
        elif green >= 64 and dominance >= 20:
            alpha = round(255 * (72 - dominance) / 52)
            alpha = max(0, min(255, alpha))
        else:
            alpha = 255
        alpha = min(source_alpha, alpha)
        if alpha == 0:
            data[index:index + 4] = b"\x00\x00\x00\x00"
        else:
            # Neutralize residual green contamination on antialiased edges.
            data[index + 1] = min(green, max(red, blue) + 12)
            data[index + 3] = alpha
    return Image.frombytes("RGBA", rgba.size, bytes(data))


def remove_generated_background(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    alpha_min, _ = rgba.getchannel("A").getextrema()
    if alpha_min < 255:
        return clear_hidden_rgb(rgba)
    sample = rgba.resize((64, 64), Image.Resampling.BILINEAR).convert("RGB")
    green_pixels = sum(
        green >= 90 and green - max(red, blue) >= 50
        for red, green, blue in sample.get_flattened_data()
    )
    if green_pixels >= 64:
        return remove_chroma_green(rgba)
    return remove_connected_light_matte(rgba)


def remove_residual_white_matte(image: Image.Image) -> Image.Image:
    """Clear bright scan-line remnants left inside generated atlas cells."""

    rgba = image.convert("RGBA")
    data = bytearray(rgba.tobytes())
    for index in range(0, len(data), 4):
        red, green, blue = data[index], data[index + 1], data[index + 2]
        if min(red, green, blue) >= 238 and max(red, green, blue) - min(red, green, blue) <= 18:
            data[index] = data[index + 1] = data[index + 2] = data[index + 3] = 0
    return Image.frombytes("RGBA", rgba.size, bytes(data))


def clear_hidden_rgb(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    data = bytearray(rgba.tobytes())
    for index in range(0, len(data), 4):
        if data[index + 3] == 0:
            data[index] = data[index + 1] = data[index + 2] = 0
    return Image.frombytes("RGBA", rgba.size, bytes(data))


def premultiplied_resize(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return image.convert("RGBa").resize(size, Image.Resampling.LANCZOS).convert("RGBA")


def normalize_portrait(source: Image.Image) -> Image.Image:
    source = remove_generated_background(source)
    bounds = source.getchannel("A").getbbox()
    if bounds is None:
        raise SystemExit("NOX portrait is empty after background removal")
    source = source.crop(bounds)
    scale = min(832 / source.width, 1504 / source.height)
    source = premultiplied_resize(source, (round(source.width * scale), round(source.height * scale)))
    canvas = Image.new("RGBA", (864, 1536), (0, 0, 0, 0))
    # Lobby/detail stages anchor operative art to their lower edge. Keep the
    # authored 16px safety margin, but put it below the subject so transparent
    # source padding cannot make NOX appear to float above the stage floor.
    canvas.alpha_composite(source, ((864 - source.width) // 2, 1536 - source.height - 16))
    return clear_hidden_rgb(canvas)


def normalize_directional_atlas(source: Image.Image) -> Image.Image:
    source = source.convert("RGB").resize((1024, 1024), Image.Resampling.LANCZOS)
    frames: list[Image.Image] = []
    for row in range(8):
        for column in range(8):
            frame = remove_generated_background(
                source.crop((column * 128, row * 128, (column + 1) * 128, (row + 1) * 128))
            )
            alpha = frame.getchannel("A").point(lambda value: 255 if value > 8 else 0)
            bounds = alpha.getbbox()
            if bounds is None:
                raise SystemExit(f"NOX atlas frame {row},{column} is empty")
            frames.append(frame.crop(bounds))

    max_width = max(frame.width for frame in frames)
    max_height = max(frame.height for frame in frames)
    scale = min(116 / max_width, 116 / max_height)
    atlas = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        width = max(1, round(frame.width * scale))
        height = max(1, round(frame.height * scale))
        frame = premultiplied_resize(frame, (width, height))
        x = (index % 8) * 128 + (128 - width) // 2
        y = (index // 8) * 128 + 122 - height
        atlas.alpha_composite(frame, (x, y))
    return clear_hidden_rgb(atlas)


def normalize_vfx_atlas(source: Image.Image) -> Image.Image:
    source = source.convert("RGB")
    if source.size != (1536, 1024):
        source = source.resize((1536, 1024), Image.Resampling.LANCZOS)
    # VFX rings can completely enclose checker tiles, so an edge-only flood is
    # insufficient. Remove the two dominant low-chroma matte colors globally;
    # authored red/charcoal effect pixels remain intact.
    dominant = [
        color for color, _ in Counter(source.get_flattened_data()).most_common(12)
        if is_light_matte(color)
    ][:4]
    rgba = source.convert("RGBA")
    data = bytearray(rgba.tobytes())
    for index in range(0, len(data), 4):
        color = (data[index], data[index + 1], data[index + 2])
        if is_light_matte(color) and any(max(abs(color[channel] - matte[channel]) for channel in range(3)) <= 10 for matte in dominant):
            data[index + 3] = 0
            data[index] = data[index + 1] = data[index + 2] = 0
    source = Image.frombytes("RGBA", rgba.size, bytes(data))
    alpha = source.getchannel("A")
    draw = ImageDraw.Draw(alpha)
    for column in range(7):
        x = min(1535, column * 256)
        draw.rectangle((max(0, x - 2), 0, min(1535, x + 2), 1023), fill=0)
    for row in range(5):
        y = min(1023, row * 256)
        draw.rectangle((0, max(0, y - 2), 1535, min(1023, y + 2)), fill=0)
    source.putalpha(alpha)
    return clear_hidden_rgb(source)


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
    parser.add_argument("--atlas", type=Path)
    parser.add_argument("--vfx", type=Path)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    portrait = normalize_portrait(Image.open(args.portrait))
    atlas = normalize_directional_atlas(Image.open(args.atlas)) if args.atlas else None
    vfx = normalize_vfx_atlas(Image.open(args.vfx)) if args.vfx else None

    source_master = ROOT / "reference/source-assets/nox-portrait-master.png"
    runtime_portrait = ROOT / "public/assets/overload/hero/nox-portrait-v1.webp"
    atlas_path = ROOT / "public/assets/overload/hero/nox-directional-aim-atlas.png"
    performance_path = ROOT / "public/assets/overload/hero/performance/nox-directional-aim-atlas.png"
    vfx_path = ROOT / "public/assets/overload/vfx/manual/nox-ability-hd-atlas.png"
    preview_dir = ROOT / "tmp/character-factory/nox"
    output_paths = [source_master, runtime_portrait]
    if atlas is not None:
        output_paths.extend((atlas_path, performance_path))
    if vfx is not None:
        output_paths.append(vfx_path)
    for path in output_paths:
        path.parent.mkdir(parents=True, exist_ok=True)
    preview_dir.mkdir(parents=True, exist_ok=True)

    portrait.save(source_master, optimize=True)
    portrait.save(runtime_portrait, "WEBP", quality=92, method=6, exact=True)
    if atlas is not None:
        atlas.save(atlas_path, optimize=True)
        premultiplied_resize(atlas, (768, 768)).save(performance_path, optimize=True)
    if vfx is not None:
        vfx.save(vfx_path, optimize=True)
    checker_preview(portrait).resize((432, 768), Image.Resampling.LANCZOS).save(preview_dir / "portrait-checker.png", optimize=True)
    if atlas is not None:
        checker_preview(atlas).save(preview_dir / "atlas-checker.png", optimize=True)
    if vfx is not None:
        checker_preview(vfx).resize((768, 512), Image.Resampling.LANCZOS).save(preview_dir / "vfx-checker.png", optimize=True)
    write_contract()
    print("NOX assets normalized")
    print(f"portrait={portrait.size} alpha={portrait.getchannel('A').getextrema()}")
    if atlas is not None:
        print(f"atlas={atlas.size} alpha={atlas.getchannel('A').getextrema()}")
    if vfx is not None:
        print(f"vfx={vfx.size} alpha={vfx.getchannel('A').getextrema()}")


if __name__ == "__main__":
    main()

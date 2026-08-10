"""Normalize a transparent dialogue portrait into a square runtime sprite."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--preview")
    parser.add_argument("--size", type=int, default=640)
    parser.add_argument("--padding", type=int, default=18)
    parser.add_argument("--alpha-threshold", type=int, default=8)
    return parser.parse_args()


def checkerboard(size: int) -> Image.Image:
    output = Image.new("RGBA", (size, size), (230, 234, 238, 255))
    draw = ImageDraw.Draw(output)
    tile = 20
    for top in range(0, size, tile):
        for left in range(0, size, tile):
            if (left // tile + top // tile) % 2:
                draw.rectangle((left, top, left + tile, top + tile), fill=(207, 214, 221, 255))
    return output


def main() -> None:
    args = parse_args()
    image = Image.open(args.input).convert("RGBA")
    alpha = image.getchannel("A").point(lambda value: 255 if value > args.alpha_threshold else 0)
    bounds = alpha.getbbox()
    if bounds is None:
        raise SystemExit("No visible portrait content detected")
    portrait = image.crop(bounds)
    maximum = max(1, args.size - args.padding * 2)
    scale = min(maximum / portrait.width, maximum / portrait.height)
    width = max(1, round(portrait.width * scale))
    height = max(1, round(portrait.height * scale))
    portrait = portrait.resize((width, height), Image.Resampling.LANCZOS)
    output = Image.new("RGBA", (args.size, args.size), (0, 0, 0, 0))
    output.alpha_composite(portrait, ((args.size - width) // 2, args.size - args.padding - height))

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    output.save(out_path, optimize=True)
    if args.preview:
        preview = checkerboard(args.size)
        preview.alpha_composite(output)
        preview_path = Path(args.preview)
        preview_path.parent.mkdir(parents=True, exist_ok=True)
        preview.save(preview_path, optimize=True)


if __name__ == "__main__":
    main()

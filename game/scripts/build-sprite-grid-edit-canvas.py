"""Build a chroma-key grid canvas with an approved sprite in the first slot."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--columns", type=int, required=True)
    parser.add_argument("--rows", type=int, required=True)
    parser.add_argument("--slot-size", type=int, default=256)
    parser.add_argument("--padding", type=int, default=24)
    parser.add_argument("--key", default="ff00ff")
    return parser.parse_args()


def parse_key(value: str) -> tuple[int, int, int, int]:
    normalized = value.strip().removeprefix("#")
    if len(normalized) != 6:
        raise SystemExit("--key must be a six-digit RGB hex color")
    return tuple(int(normalized[index:index + 2], 16) for index in (0, 2, 4)) + (255,)


def alpha_crop(image: Image.Image) -> Image.Image:
    bounds = image.getchannel("A").point(lambda value: 255 if value > 8 else 0).getbbox()
    if bounds is None:
        raise SystemExit("No visible sprite content found in --seed")
    return image.crop(bounds)


def main() -> None:
    args = parse_args()
    if args.columns < 1 or args.rows < 1 or args.slot_size < 1:
        raise SystemExit("columns, rows and slot-size must be positive")
    if args.padding < 0 or args.padding * 2 >= args.slot_size:
        raise SystemExit("padding must leave visible room inside each slot")

    seed = alpha_crop(Image.open(args.seed).convert("RGBA"))
    usable = args.slot_size - args.padding * 2
    scale = min(usable / seed.width, usable / seed.height)
    size = (max(1, round(seed.width * scale)), max(1, round(seed.height * scale)))
    seed = seed.resize(size, Image.Resampling.LANCZOS)

    canvas = Image.new(
        "RGBA",
        (args.columns * args.slot_size, args.rows * args.slot_size),
        parse_key(args.key),
    )
    left = (args.slot_size - seed.width) // 2
    top = (args.slot_size - seed.height) // 2
    canvas.alpha_composite(seed, (left, top))

    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output, optimize=True)
    print(f"Wrote {output} ({args.columns}x{args.rows}, {canvas.width}x{canvas.height}px)")


if __name__ == "__main__":
    main()

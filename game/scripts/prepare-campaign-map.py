"""Prepare a generated 16:9 campaign map as a browser-sized WebP."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--width", type=int, default=1920)
    parser.add_argument("--height", type=int, default=1080)
    parser.add_argument("--quality", type=int, default=86)
    args = parser.parse_args()

    source = Image.open(args.input).convert("RGB")
    target_ratio = args.width / args.height
    source_ratio = source.width / source.height
    if source_ratio > target_ratio:
        crop_width = round(source.height * target_ratio)
        left = (source.width - crop_width) // 2
        source = source.crop((left, 0, left + crop_width, source.height))
    elif source_ratio < target_ratio:
        crop_height = round(source.width / target_ratio)
        top = (source.height - crop_height) // 2
        source = source.crop((0, top, source.width, top + crop_height))
    source = source.resize((args.width, args.height), Image.Resampling.LANCZOS)

    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    source.save(output, "WEBP", quality=args.quality, method=6)
    print(f"Wrote {output} ({args.width}x{args.height}, WebP quality {args.quality})")


if __name__ == "__main__":
    main()

"""Extract one exact cell from a regular sprite atlas."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--columns", type=int, required=True)
    parser.add_argument("--rows", type=int, required=True)
    parser.add_argument("--column", type=int, default=0)
    parser.add_argument("--row", type=int, default=0)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.columns < 1 or args.rows < 1:
        raise SystemExit("columns and rows must be positive")
    if not 0 <= args.column < args.columns or not 0 <= args.row < args.rows:
        raise SystemExit("requested cell is outside the atlas")

    image = Image.open(args.input).convert("RGBA")
    left = round(args.column * image.width / args.columns)
    top = round(args.row * image.height / args.rows)
    right = round((args.column + 1) * image.width / args.columns)
    bottom = round((args.row + 1) * image.height / args.rows)

    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    image.crop((left, top, right, bottom)).save(output, optimize=True)
    print(f"Wrote {output} ({right - left}x{bottom - top}px)")


if __name__ == "__main__":
    main()

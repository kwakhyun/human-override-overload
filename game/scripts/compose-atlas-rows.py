"""Compose selected rows from normalized grid atlases into one runtime atlas."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--row",
        action="append",
        required=True,
        help="Row selector in PATH:INDEX form; repeat in output order",
    )
    parser.add_argument("--columns", type=int, default=8)
    parser.add_argument("--frame-size", type=int, default=192)
    parser.add_argument("--out", required=True)
    return parser.parse_args()


def parse_row(value: str) -> tuple[Path, int]:
    path_text, separator, row_text = value.rpartition(":")
    if not separator:
        raise SystemExit(f"Invalid row selector {value!r}; expected PATH:INDEX")
    try:
        row = int(row_text)
    except ValueError as error:
        raise SystemExit(f"Invalid row index in {value!r}") from error
    return Path(path_text), row


def main() -> None:
    args = parse_args()
    if args.columns < 1 or args.frame_size < 1:
        raise SystemExit("columns and frame-size must be positive")
    width = args.columns * args.frame_size
    row_height = args.frame_size
    rows: list[Image.Image] = []
    for selector in args.row:
        path, row_index = parse_row(selector)
        source = Image.open(path).convert("RGBA")
        if source.width != width or source.height % row_height != 0:
            raise SystemExit(
                f"{path} must be {width}px wide and use {row_height}px rows; got {source.size}"
            )
        row_count = source.height // row_height
        if row_index < 0 or row_index >= row_count:
            raise SystemExit(f"Row {row_index} is outside {path} ({row_count} rows)")
        rows.append(source.crop((0, row_index * row_height, width, (row_index + 1) * row_height)))

    atlas = Image.new("RGBA", (width, len(rows) * row_height), (0, 0, 0, 0))
    for row_index, row in enumerate(rows):
        atlas.alpha_composite(row, (0, row_index * row_height))
    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output, optimize=True)
    print(f"Wrote {output} ({args.columns}x{len(rows)} frames, {atlas.width}x{atlas.height}px)")


if __name__ == "__main__":
    main()

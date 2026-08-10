"""Compose normalized sprite-frame directories into one transparent atlas."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--row", action="append", required=True, help="Directory containing ordered PNG frames")
    parser.add_argument("--out", required=True, help="Output atlas PNG")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    rows = []
    for row_path in args.row:
        paths = sorted(Path(row_path).glob("*.png"))
        if not paths:
            raise SystemExit(f"No PNG frames found in {row_path}")
        rows.append([Image.open(path).convert("RGBA") for path in paths])

    columns = len(rows[0])
    if any(len(row) != columns for row in rows):
        raise SystemExit("Every atlas row must contain the same number of frames")

    frame_width, frame_height = rows[0][0].size
    if any(frame.size != (frame_width, frame_height) for row in rows for frame in row):
        raise SystemExit("Every atlas frame must use the same dimensions")

    atlas = Image.new("RGBA", (frame_width * columns, frame_height * len(rows)), (0, 0, 0, 0))
    for row_index, row in enumerate(rows):
        for column_index, frame in enumerate(row):
            atlas.alpha_composite(frame, (column_index * frame_width, row_index * frame_height))

    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output, optimize=True)
    print(f"Wrote {output} ({columns}x{len(rows)} frames, {atlas.width}x{atlas.height}px)")


if __name__ == "__main__":
    main()

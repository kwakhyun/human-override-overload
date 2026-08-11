"""Finalize the authored 8-way AEGIS atlas with exact left-side views.

Image generation supplies independently authored south through northwest rows.
The west and southwest rows are deterministic reflections of the approved east
and southeast rows so the weapon heading cannot drift back toward screen-right.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw


COLUMNS = 8
ROWS = 8
WEST_ROW = 6
SOUTHWEST_ROW = 7
EAST_ROW = 2
SOUTHEAST_ROW = 1


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--preview")
    return parser.parse_args()


def checker_preview(atlas: Image.Image, cell: int) -> Image.Image:
    preview = Image.new("RGBA", atlas.size, (225, 230, 235, 255))
    draw = ImageDraw.Draw(preview)
    tile = 16
    for top in range(0, preview.height, tile):
        for left in range(0, preview.width, tile):
            color = (240, 243, 246, 255) if (left // tile + top // tile) % 2 == 0 else (220, 226, 231, 255)
            draw.rectangle((left, top, left + tile, top + tile), fill=color)
    preview.alpha_composite(atlas)
    for index in range(1, COLUMNS):
        draw.line((index * cell, 0, index * cell, atlas.height), fill=(95, 115, 122, 140), width=1)
    for index in range(1, ROWS):
        draw.line((0, index * cell, atlas.width, index * cell), fill=(95, 115, 122, 140), width=1)
    return preview


def main() -> None:
    args = parse_args()
    source = Image.open(args.input).convert("RGBA")
    if source.width != source.height or source.width % COLUMNS:
        raise SystemExit(f"Expected a square 8x8 atlas; got {source.size}")
    cell = source.width // COLUMNS
    atlas = source.copy()
    for destination, source_row in ((WEST_ROW, EAST_ROW), (SOUTHWEST_ROW, SOUTHEAST_ROW)):
        row = source.crop((0, source_row * cell, source.width, (source_row + 1) * cell))
        mirrored = row.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        atlas.paste(mirrored, (0, destination * cell))

    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output, optimize=True)
    if args.preview:
        preview = Path(args.preview)
        preview.parent.mkdir(parents=True, exist_ok=True)
        checker_preview(atlas, cell).save(preview, optimize=True)
    print(f"Wrote {output} (8x8, {atlas.width}x{atlas.height}px; west rows direction-locked)")


if __name__ == "__main__":
    main()

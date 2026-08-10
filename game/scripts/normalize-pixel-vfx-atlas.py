"""Normalize an authored chroma-key VFX grid into a crisp low-color pixel atlas."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--preview")
    parser.add_argument("--columns", type=int, default=6)
    parser.add_argument("--rows", type=int, default=4)
    parser.add_argument("--cell-size", type=int, default=64)
    parser.add_argument("--colors", type=int, default=32)
    parser.add_argument("--border", type=int, default=2)
    return parser.parse_args()


def quantize_alpha(alpha: Image.Image) -> Image.Image:
    return alpha.point(lambda value: 0 if value <= 16 else 80 if value < 112 else 176 if value < 224 else 255)


def clear_cell_borders(atlas: Image.Image, columns: int, rows: int, size: int, border: int) -> None:
    alpha = atlas.getchannel("A")
    draw = ImageDraw.Draw(alpha)
    for row in range(rows):
        for column in range(columns):
            left = column * size
            top = row * size
            right = left + size - 1
            bottom = top + size - 1
            draw.rectangle((left, top, right, top + border - 1), fill=0)
            draw.rectangle((left, bottom - border + 1, right, bottom), fill=0)
            draw.rectangle((left, top, left + border - 1, bottom), fill=0)
            draw.rectangle((right - border + 1, top, right, bottom), fill=0)
    atlas.putalpha(alpha)


def checker_preview(atlas: Image.Image, columns: int, rows: int, size: int) -> Image.Image:
    scale = 4
    enlarged = atlas.resize((atlas.width * scale, atlas.height * scale), Image.Resampling.NEAREST)
    preview = Image.new("RGBA", enlarged.size, (16, 22, 28, 255))
    draw = ImageDraw.Draw(preview)
    tile = 16
    for top in range(0, preview.height, tile):
        for left in range(0, preview.width, tile):
            color = (24, 32, 40, 255) if (left // tile + top // tile) % 2 == 0 else (12, 18, 24, 255)
            draw.rectangle((left, top, left + tile - 1, top + tile - 1), fill=color)
    preview.alpha_composite(enlarged)
    for column in range(1, columns):
        x = column * size * scale
        draw.line((x, 0, x, preview.height), fill=(104, 239, 255, 100), width=1)
    for row in range(1, rows):
        y = row * size * scale
        draw.line((0, y, preview.width, y), fill=(104, 239, 255, 100), width=1)
    return preview


def main() -> None:
    args = parse_args()
    if min(args.columns, args.rows, args.cell_size, args.colors, args.border) < 1:
        raise SystemExit("grid, cell, color, and border values must be positive")
    if args.border * 2 >= args.cell_size:
        raise SystemExit("border must leave visible room inside every cell")

    source = Image.open(args.input).convert("RGBA")
    target_size = (args.columns * args.cell_size, args.rows * args.cell_size)
    atlas = source.resize(target_size, Image.Resampling.NEAREST)

    alpha = quantize_alpha(atlas.getchannel("A"))
    flattened = Image.new("RGB", atlas.size, (2, 6, 10))
    flattened.paste(atlas.convert("RGB"), mask=alpha)
    palette = flattened.quantize(
        colors=args.colors,
        method=Image.Quantize.FASTOCTREE,
        dither=Image.Dither.NONE,
    ).convert("RGB")
    atlas = palette.convert("RGBA")
    atlas.putalpha(alpha)
    clear_cell_borders(atlas, args.columns, args.rows, args.cell_size, args.border)

    cell_coverage: list[int] = []
    final_alpha = atlas.getchannel("A")
    for row in range(args.rows):
        for column in range(args.columns):
            cell = final_alpha.crop((
                column * args.cell_size,
                row * args.cell_size,
                (column + 1) * args.cell_size,
                (row + 1) * args.cell_size,
            ))
            coverage = sum(1 for value in cell.get_flattened_data() if value > 0)
            if coverage == 0:
                raise SystemExit(f"cell {row}:{column} is empty")
            cell_coverage.append(coverage)

    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output, optimize=True)
    if args.preview:
        preview_path = Path(args.preview)
        preview_path.parent.mkdir(parents=True, exist_ok=True)
        checker_preview(atlas, args.columns, args.rows, args.cell_size).save(preview_path, optimize=True)
    decoded = atlas.width * atlas.height * 4
    print(
        f"Wrote {output} {atlas.width}x{atlas.height} RGBA8={decoded} bytes; "
        f"cell coverage min={min(cell_coverage)} max={max(cell_coverage)}; "
        f"nearest-neighbor, {args.colors}-color RGB palette"
    )


if __name__ == "__main__":
    main()

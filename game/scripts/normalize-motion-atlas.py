"""Normalize a transparent grid atlas with one shared scale and center pivot."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--preview")
    parser.add_argument("--columns", type=int, default=5)
    parser.add_argument("--rows", type=int, default=3)
    parser.add_argument("--frame-size", type=int, default=256)
    parser.add_argument("--padding", type=int, default=12)
    parser.add_argument("--alpha-threshold", type=int, default=8)
    return parser.parse_args()


def crop_content(image: Image.Image, threshold: int) -> Image.Image:
    alpha = image.getchannel("A").point(lambda value: 255 if value > threshold else 0)
    bounds = alpha.getbbox()
    if bounds is None:
        raise SystemExit("Every atlas slot must contain visible sprite content")
    return image.crop(bounds)


def split_grid(image: Image.Image, columns: int, rows: int, threshold: int) -> list[Image.Image]:
    frames: list[Image.Image] = []
    for row in range(rows):
        for column in range(columns):
            left = round(column * image.width / columns)
            top = round(row * image.height / rows)
            right = round((column + 1) * image.width / columns)
            bottom = round((row + 1) * image.height / rows)
            frames.append(crop_content(image.crop((left, top, right, bottom)), threshold))
    return frames


def normalize(frames: list[Image.Image], size: int, padding: int) -> list[Image.Image]:
    max_width = max(frame.width for frame in frames)
    max_height = max(frame.height for frame in frames)
    scale = min((size - padding * 2) / max_width, (size - padding * 2) / max_height)
    normalized: list[Image.Image] = []
    for frame in frames:
        width = max(1, round(frame.width * scale))
        height = max(1, round(frame.height * scale))
        resized = frame.resize((width, height), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        canvas.alpha_composite(resized, ((size - width) // 2, (size - height) // 2))
        normalized.append(canvas)
    return normalized


def compose(frames: list[Image.Image], columns: int, rows: int, size: int) -> Image.Image:
    atlas = Image.new("RGBA", (columns * size, rows * size), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        atlas.alpha_composite(frame, ((index % columns) * size, (index // columns) * size))
    return atlas


def preview(atlas: Image.Image, columns: int, rows: int, size: int) -> Image.Image:
    sheet = Image.new("RGBA", atlas.size, (225, 230, 235, 255))
    draw = ImageDraw.Draw(sheet)
    tile = 16
    for top in range(0, sheet.height, tile):
        for left in range(0, sheet.width, tile):
            color = (240, 243, 246, 255) if (left // tile + top // tile) % 2 == 0 else (220, 226, 231, 255)
            draw.rectangle((left, top, left + tile, top + tile), fill=color)
    sheet.alpha_composite(atlas)
    for column in range(1, columns):
        draw.line((column * size, 0, column * size, rows * size), fill=(95, 115, 122, 120), width=1)
    for row in range(1, rows):
        draw.line((0, row * size, columns * size, row * size), fill=(95, 115, 122, 120), width=1)
    return sheet


def main() -> None:
    args = parse_args()
    if args.columns < 1 or args.rows < 1 or args.frame_size < 1:
        raise SystemExit("columns, rows, and frame-size must be positive")
    source = Image.open(args.input).convert("RGBA")
    frames = split_grid(source, args.columns, args.rows, args.alpha_threshold)
    normalized = normalize(frames, args.frame_size, args.padding)
    atlas = compose(normalized, args.columns, args.rows, args.frame_size)
    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output, optimize=True)
    if args.preview:
        preview_path = Path(args.preview)
        preview_path.parent.mkdir(parents=True, exist_ok=True)
        preview(atlas, args.columns, args.rows, args.frame_size).save(preview_path, optimize=True)
    print(f"Wrote {output} ({args.columns}x{args.rows}, {atlas.width}x{atlas.height}px)")


if __name__ == "__main__":
    main()

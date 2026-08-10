"""Normalize a transparent 3-state wide button sheet into fixed DOM frames."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--preview")
    parser.add_argument("--frame-width", type=int, default=512)
    parser.add_argument("--frame-height", type=int, default=160)
    parser.add_argument("--padding", type=int, default=6)
    parser.add_argument("--alpha-threshold", type=int, default=10)
    parser.add_argument("--fit", choices=("contain", "stretch"), default="contain")
    return parser.parse_args()


def crop_visible(frame: Image.Image, threshold: int) -> Image.Image:
    alpha = frame.getchannel("A").point(lambda value: 255 if value > threshold else 0)
    bounds = alpha.getbbox()
    if bounds is None:
        raise SystemExit("Every button state must contain visible pixels")
    return frame.crop(bounds)


def main() -> None:
    args = parse_args()
    if min(args.frame_width, args.frame_height) <= args.padding * 2:
        raise SystemExit("Frame dimensions must exceed twice the padding")

    source = Image.open(args.input).convert("RGBA")
    frames: list[Image.Image] = []
    for column in range(3):
        left = round(column * source.width / 3)
        right = round((column + 1) * source.width / 3)
        frames.append(crop_visible(source.crop((left, 0, right, source.height)), args.alpha_threshold))

    max_width = max(frame.width for frame in frames)
    max_height = max(frame.height for frame in frames)
    scale = min(
        (args.frame_width - args.padding * 2) / max_width,
        (args.frame_height - args.padding * 2) / max_height,
    )
    atlas = Image.new("RGBA", (args.frame_width * 3, args.frame_height), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        size = (
            (args.frame_width - args.padding * 2, args.frame_height - args.padding * 2)
            if args.fit == "stretch"
            else (max(1, round(frame.width * scale)), max(1, round(frame.height * scale)))
        )
        resized = frame.resize(size, Image.Resampling.LANCZOS)
        x = index * args.frame_width + (args.frame_width - resized.width) // 2
        y = (args.frame_height - resized.height) // 2
        atlas.alpha_composite(resized, (x, y))

    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output, optimize=True)
    if args.preview:
        preview = Image.new("RGBA", atlas.size, (4, 10, 14, 255))
        preview.alpha_composite(atlas)
        preview_path = Path(args.preview)
        preview_path.parent.mkdir(parents=True, exist_ok=True)
        preview.save(preview_path, optimize=True)

    alpha = atlas.getchannel("A")
    corners = [alpha.getpixel((0, 0)), alpha.getpixel((atlas.width - 1, 0)), alpha.getpixel((0, atlas.height - 1)), alpha.getpixel((atlas.width - 1, atlas.height - 1))]
    if max(corners) != 0:
        raise SystemExit("Atlas corners must remain transparent")
    print(f"Wrote {output} (3x1, {atlas.width}x{atlas.height}px, transparent corners)")


if __name__ == "__main__":
    main()

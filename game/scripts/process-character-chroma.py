from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageFilter


def extract_chroma(source: Path, destination: Path) -> tuple[int, int]:
    image = Image.open(source).convert("RGBA")
    pixels = image.load()
    width, height = image.size
    alpha = Image.new("L", image.size, 255)
    alpha_pixels = alpha.load()

    for y in range(height):
        for x in range(width):
            red, green, blue, _ = pixels[x, y]
            dominance = green - max(red, blue)
            green_ratio = green / (red + blue + 1)
            if dominance >= 42 and green_ratio >= 0.78:
                alpha_pixels[x, y] = 0
            elif dominance >= 20 and green_ratio >= 0.56:
                alpha_pixels[x, y] = max(0, min(255, int(255 * (42 - dominance) / 22)))

    image.putalpha(alpha.filter(ImageFilter.GaussianBlur(0.45)))
    bounds = image.getbbox()
    if bounds:
        left, top, right, bottom = bounds
        image = image.crop((
            max(0, left - 8),
            max(0, top - 8),
            min(width, right + 8),
            min(height, bottom + 8),
        ))
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, optimize=True)
    return image.size


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert a flat green character render into a transparent PNG.")
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    size = extract_chroma(args.source, args.destination)
    print(f"saved {args.destination} ({size[0]}x{size[1]})")


if __name__ == "__main__":
    main()

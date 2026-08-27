"""Normalize generated character/VFX sheets into RGBA shipping assets.

Image generators sometimes bake a checkerboard or a black matte into an RGB
file even when transparency was requested. This utility removes only the
background connected to the outer edge, so enclosed costume highlights and
effect cores stay intact.
"""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

from PIL import Image


def _is_background(pixel: tuple[int, int, int], mode: str) -> bool:
    red, green, blue = pixel
    if mode == "dark":
        return max(red, green, blue) <= 18
    if mode == "checker-light":
        # Image generators frequently return a flattened white/light-gray
        # transparency checker. Both tiles need to be traversable by the edge
        # flood or alternating squares survive as a baked matte.
        return min(red, green, blue) >= 205 and max(red, green, blue) - min(red, green, blue) <= 24
    return min(red, green, blue) >= 236 and max(red, green, blue) - min(red, green, blue) <= 18


def remove_edge_matte(image: Image.Image, mode: str) -> Image.Image:
    rgb = image.convert("RGB")
    width, height = rgb.size
    pixels = rgb.load()
    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def enqueue(x: int, y: int) -> None:
        index = y * width + x
        if visited[index] or not _is_background(pixels[x, y], mode):
            return
        visited[index] = 1
        queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        for next_x, next_y in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= next_x < width and 0 <= next_y < height:
                enqueue(next_x, next_y)

    rgba = rgb.convert("RGBA")
    alpha = Image.new("L", (width, height), 255)
    alpha.putdata([0 if value else 255 for value in visited])
    rgba.putalpha(alpha)
    return rgba


def parse_size(value: str | None) -> tuple[int, int] | None:
    if not value:
        return None
    width, height = value.lower().split("x", 1)
    return int(width), int(height)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("path", type=Path)
    parser.add_argument("--mode", choices=("light", "checker-light", "dark"), required=True)
    parser.add_argument("--resize", type=str)
    args = parser.parse_args()

    image = remove_edge_matte(Image.open(args.path), args.mode)
    size = parse_size(args.resize)
    if size:
        image = image.resize(size, Image.Resampling.LANCZOS)
    image.save(args.path, optimize=True)


if __name__ == "__main__":
    main()

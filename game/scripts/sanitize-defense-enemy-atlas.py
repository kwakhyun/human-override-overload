"""Keep the authored actor silhouette and remove cross-cell ImageGen fragments."""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


def components(mask: np.ndarray) -> list[list[tuple[int, int]]]:
    height, width = mask.shape
    seen = np.zeros_like(mask, dtype=np.bool_)
    result: list[list[tuple[int, int]]] = []
    for start_y, start_x in np.argwhere(mask):
        if seen[start_y, start_x]:
            continue
        queue: deque[tuple[int, int]] = deque([(int(start_x), int(start_y))])
        seen[start_y, start_x] = True
        pixels: list[tuple[int, int]] = []
        while queue:
            x, y = queue.popleft()
            pixels.append((x, y))
            for next_y in range(max(0, y - 1), min(height, y + 2)):
                for next_x in range(max(0, x - 1), min(width, x + 2)):
                    if mask[next_y, next_x] and not seen[next_y, next_x]:
                        seen[next_y, next_x] = True
                        queue.append((next_x, next_y))
        result.append(pixels)
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    image = Image.open(args.input).convert("RGBA")
    if image.width % 6 or image.height % 4:
        raise SystemExit("Expected an exact 6x4 atlas")
    pixels = np.asarray(image).copy()
    cell_width = image.width // 6
    cell_height = image.height // 4
    # Runtime motion uses columns 0..4.  Image generation can leave tiny pieces
    # of a neighboring pose at a cell edge, so retain only the dominant,
    # connected actor/effect silhouette in those cells.  Column 5 is a debris
    # animation by design and intentionally keeps its separated fragments.
    for row in range(4):
        row_top = row * cell_height
        for column in range(5):
            left = column * cell_width
            frame = pixels[row_top:row_top + cell_height, left:left + cell_width]
            groups = components(frame[:, :, 3] > 8)
            if not groups:
                raise SystemExit(f"Missing defense actor in row {row}, column {column}")
            dominant = max(groups, key=len)
            keep = np.zeros((cell_height, cell_width), dtype=np.bool_)
            for x, y in dominant:
                keep[y, x] = True
            frame[~keep] = 0
    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(pixels, mode="RGBA").save(output, optimize=True)
    print(f"Wrote {output} ({image.width}x{image.height}px)")


if __name__ == "__main__":
    main()

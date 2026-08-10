"""Recover overflowing sprite cells by connected-component segmentation.

Image generators sometimes preserve the requested grid while allowing a rifle or
coat tail to cross a nominal cell boundary. Splitting that sheet by coordinates
would duplicate and clip those pixels. This helper finds the dominant actor in
each slot first, then normalizes the recovered actors into isolated cells.
"""

from __future__ import annotations

import argparse
from collections import deque
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


@dataclass(frozen=True)
class Component:
    area: int
    left: int
    top: int
    right: int
    bottom: int
    center_x: float
    center_y: float


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--preview")
    parser.add_argument("--columns", type=int, required=True)
    parser.add_argument("--output-columns", type=int)
    parser.add_argument("--rows", type=int, required=True)
    parser.add_argument("--frame-size", type=int, default=192)
    parser.add_argument("--padding", type=int, default=10)
    parser.add_argument("--alpha-threshold", type=int, default=12)
    parser.add_argument("--bridge-radius", type=int, default=1)
    parser.add_argument("--bounds-padding", type=int, default=3)
    return parser.parse_args()


def dilate(mask: np.ndarray, radius: int) -> np.ndarray:
    if radius <= 0:
        return mask
    result = mask.copy()
    height, width = mask.shape
    for dy in range(-radius, radius + 1):
        for dx in range(-radius, radius + 1):
            if dx == 0 and dy == 0:
                continue
            source_y0 = max(0, -dy)
            source_y1 = min(height, height - dy)
            source_x0 = max(0, -dx)
            source_x1 = min(width, width - dx)
            target_y0 = source_y0 + dy
            target_y1 = source_y1 + dy
            target_x0 = source_x0 + dx
            target_x1 = source_x1 + dx
            result[target_y0:target_y1, target_x0:target_x1] |= mask[source_y0:source_y1, source_x0:source_x1]
    return result


def find_components(mask: np.ndarray) -> list[Component]:
    height, width = mask.shape
    seen = np.zeros_like(mask, dtype=np.bool_)
    components: list[Component] = []
    for start_y, start_x in np.argwhere(mask):
        if seen[start_y, start_x]:
            continue
        queue: deque[tuple[int, int]] = deque([(int(start_x), int(start_y))])
        seen[start_y, start_x] = True
        area = 0
        left = right = int(start_x)
        top = bottom = int(start_y)
        sum_x = 0
        sum_y = 0
        while queue:
            x, y = queue.popleft()
            area += 1
            sum_x += x
            sum_y += y
            left = min(left, x)
            right = max(right, x)
            top = min(top, y)
            bottom = max(bottom, y)
            for ny in range(max(0, y - 1), min(height, y + 2)):
                for nx in range(max(0, x - 1), min(width, x + 2)):
                    if mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        queue.append((nx, ny))
        components.append(Component(area, left, top, right + 1, bottom + 1, sum_x / area, sum_y / area))
    return components


def dominant_grid_components(
    components: list[Component], columns: int, rows: int, width: int, height: int
) -> list[Component]:
    del width, height
    actor_count = columns * rows
    if len(components) < actor_count:
        raise SystemExit(f"Expected {actor_count} actors but found only {len(components)} components")
    # Generated sheets often omit literal guide lines and slightly offset their
    # nominal cells. The dominant components are the actors; row clustering by
    # centroid is more reliable than slicing the input canvas mathematically.
    actors = sorted(components, key=lambda component: component.area, reverse=True)[:actor_count]
    actors.sort(key=lambda component: component.center_y)
    ordered: list[Component] = []
    for row in range(rows):
        row_actors = actors[row * columns:(row + 1) * columns]
        ordered.extend(sorted(row_actors, key=lambda component: component.center_x))
    return ordered


def recover_frames(
    source: Image.Image, components: list[Component], bounds_padding: int
) -> list[Image.Image]:
    frames: list[Image.Image] = []
    for component in components:
        box = (
            max(0, component.left - bounds_padding),
            max(0, component.top - bounds_padding),
            min(source.width, component.right + bounds_padding),
            min(source.height, component.bottom + bounds_padding),
        )
        frames.append(source.crop(box))
    return frames


def normalize(frames: list[Image.Image], size: int, padding: int) -> list[Image.Image]:
    max_width = max(frame.width for frame in frames)
    max_height = max(frame.height for frame in frames)
    scale = min((size - padding * 2) / max_width, (size - padding * 2) / max_height)
    output: list[Image.Image] = []
    for frame in frames:
        width = max(1, round(frame.width * scale))
        height = max(1, round(frame.height * scale))
        resized = frame.resize((width, height), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        canvas.alpha_composite(resized, ((size - width) // 2, (size - height) // 2))
        output.append(canvas)
    return output


def compose(frames: list[Image.Image], columns: int, rows: int, size: int) -> Image.Image:
    atlas = Image.new("RGBA", (columns * size, rows * size), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        atlas.alpha_composite(frame, ((index % columns) * size, (index // columns) * size))
    return atlas


def resample_rows(
    frames: list[Image.Image], source_columns: int, output_columns: int, rows: int
) -> list[Image.Image]:
    if output_columns == source_columns:
        return frames
    output: list[Image.Image] = []
    for row in range(rows):
        row_frames = frames[row * source_columns:(row + 1) * source_columns]
        if output_columns == source_columns + 1:
            # The repeated contact pose closes an ImageGen seven-beat loop without
            # inventing a blended/ghosted gameplay frame.
            output.extend([*row_frames, row_frames[0]])
            continue
        for index in range(output_columns):
            source_index = min(source_columns - 1, int(index * source_columns / output_columns))
            output.append(row_frames[source_index])
    return output


def make_preview(atlas: Image.Image, columns: int, rows: int, size: int) -> Image.Image:
    result = Image.new("RGBA", atlas.size, (225, 230, 235, 255))
    draw = ImageDraw.Draw(result)
    tile = 16
    for top in range(0, result.height, tile):
        for left in range(0, result.width, tile):
            color = (240, 243, 246, 255) if (left // tile + top // tile) % 2 == 0 else (220, 226, 231, 255)
            draw.rectangle((left, top, left + tile, top + tile), fill=color)
    result.alpha_composite(atlas)
    for column in range(1, columns):
        draw.line((column * size, 0, column * size, rows * size), fill=(95, 115, 122, 140), width=1)
    for row in range(1, rows):
        draw.line((0, row * size, columns * size, row * size), fill=(95, 115, 122, 140), width=1)
    return result


def main() -> None:
    args = parse_args()
    output_columns = args.output_columns or args.columns
    if min(args.columns, output_columns, args.rows, args.frame_size) < 1:
        raise SystemExit("columns, rows, and frame-size must be positive")
    source = Image.open(args.input).convert("RGBA")
    alpha = np.asarray(source.getchannel("A")) > args.alpha_threshold
    connected = find_components(dilate(alpha, args.bridge_radius))
    dominant = dominant_grid_components(connected, args.columns, args.rows, source.width, source.height)
    normalized = normalize(recover_frames(source, dominant, args.bounds_padding), args.frame_size, args.padding)
    output_frames = resample_rows(normalized, args.columns, output_columns, args.rows)
    atlas = compose(output_frames, output_columns, args.rows, args.frame_size)
    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(output, optimize=True)
    if args.preview:
        preview = Path(args.preview)
        preview.parent.mkdir(parents=True, exist_ok=True)
        make_preview(atlas, output_columns, args.rows, args.frame_size).save(preview, optimize=True)
    print(
        f"Wrote {output} ({output_columns}x{args.rows}, {atlas.width}x{atlas.height}px); "
        f"selected {len(dominant)} actors from {len(connected)} components"
    )


if __name__ == "__main__":
    main()

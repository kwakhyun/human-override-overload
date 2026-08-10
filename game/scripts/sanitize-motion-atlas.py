"""Clear per-cell safety borders and validate a transparent motion atlas."""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--columns", type=int, required=True)
    parser.add_argument("--rows", type=int, required=True)
    parser.add_argument("--frame-size", type=int, required=True)
    parser.add_argument("--border", type=int, default=4)
    parser.add_argument("--alpha-threshold", type=int, default=8)
    parser.add_argument("--remove-components-below", type=int, default=0)
    parser.add_argument("--remove-left-edge-components", type=int, default=0)
    parser.add_argument("--preview")
    return parser.parse_args()


def clear_cell_borders(image: Image.Image, columns: int, rows: int, size: int, border: int) -> None:
    alpha = image.getchannel("A")
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
    image.putalpha(alpha)


def component_areas(mask: np.ndarray) -> list[int]:
    height, width = mask.shape
    seen = np.zeros_like(mask, dtype=np.bool_)
    areas: list[int] = []
    for start_y, start_x in np.argwhere(mask):
        if seen[start_y, start_x]:
            continue
        queue: deque[tuple[int, int]] = deque([(int(start_x), int(start_y))])
        seen[start_y, start_x] = True
        area = 0
        while queue:
            x, y = queue.popleft()
            area += 1
            for next_y in range(max(0, y - 1), min(height, y + 2)):
                for next_x in range(max(0, x - 1), min(width, x + 2)):
                    if mask[next_y, next_x] and not seen[next_y, next_x]:
                        seen[next_y, next_x] = True
                        queue.append((next_x, next_y))
        areas.append(area)
    return sorted(areas, reverse=True)


def remove_small_components(frame: np.ndarray, threshold: int, minimum_area: int) -> int:
    """Clear isolated generator debris while keeping the dominant sprite intact."""
    if minimum_area <= 0:
        return 0
    mask = frame > threshold
    height, width = mask.shape
    seen = np.zeros_like(mask, dtype=np.bool_)
    removed = 0
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
        if len(pixels) >= minimum_area:
            continue
        left = max(0, min(x for x, _ in pixels) - 1)
        right = min(width, max(x for x, _ in pixels) + 2)
        top = max(0, min(y for _, y in pixels) - 1)
        bottom = min(height, max(y for _, y in pixels) + 2)
        frame[top:bottom, left:right] = 0
        removed += 1
    return removed


def remove_left_edge_components(frame: np.ndarray, threshold: int, edge_zone: int) -> int:
    """Remove disconnected overflow fragments inherited from the preceding cell."""
    if edge_zone <= 0:
        return 0
    mask = frame > threshold
    height, width = mask.shape
    seen = np.zeros_like(mask, dtype=np.bool_)
    components: list[list[tuple[int, int]]] = []
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
        components.append(pixels)
    if not components:
        return 0
    main = max(components, key=len)
    removed = 0
    for pixels in components:
        if pixels is main or max(x for x, _ in pixels) >= edge_zone:
            continue
        left = max(0, min(x for x, _ in pixels) - 1)
        right = min(width, max(x for x, _ in pixels) + 2)
        top = max(0, min(y for _, y in pixels) - 1)
        bottom = min(height, max(y for _, y in pixels) + 2)
        frame[top:bottom, left:right] = 0
        removed += 1
    return removed


def checker_preview(atlas: Image.Image, columns: int, rows: int, size: int) -> Image.Image:
    preview = Image.new("RGBA", atlas.size, (225, 230, 235, 255))
    draw = ImageDraw.Draw(preview)
    tile = 16
    for top in range(0, preview.height, tile):
        for left in range(0, preview.width, tile):
            color = (240, 243, 246, 255) if (left // tile + top // tile) % 2 == 0 else (220, 226, 231, 255)
            draw.rectangle((left, top, left + tile, top + tile), fill=color)
    preview.alpha_composite(atlas)
    for column in range(1, columns):
        draw.line((column * size, 0, column * size, rows * size), fill=(95, 115, 122, 140), width=1)
    for row in range(1, rows):
        draw.line((0, row * size, columns * size, row * size), fill=(95, 115, 122, 140), width=1)
    return preview


def main() -> None:
    args = parse_args()
    path = Path(args.input)
    atlas = Image.open(path).convert("RGBA")
    expected = (args.columns * args.frame_size, args.rows * args.frame_size)
    if atlas.size != expected:
        raise SystemExit(f"Expected {expected}, got {atlas.size}")
    if args.border < 1 or args.border * 2 >= args.frame_size:
        raise SystemExit("--border must leave visible room in every frame")

    clear_cell_borders(atlas, args.columns, args.rows, args.frame_size, args.border)
    alpha = np.asarray(atlas.getchannel("A")).copy()
    removed_components = 0
    for row in range(args.rows):
        for column in range(args.columns):
            left = column * args.frame_size
            top = row * args.frame_size
            frame = alpha[top:top + args.frame_size, left:left + args.frame_size]
            removed_components += remove_small_components(
                frame, args.alpha_threshold, args.remove_components_below
            )
            removed_components += remove_left_edge_components(
                frame, args.alpha_threshold, args.remove_left_edge_components
            )
    atlas.putalpha(Image.fromarray(alpha, mode="L"))
    atlas.save(path, optimize=True)

    reports: list[str] = []
    for row in range(args.rows):
        for column in range(args.columns):
            left = column * args.frame_size
            top = row * args.frame_size
            frame = alpha[top:top + args.frame_size, left:left + args.frame_size]
            border_pixels = np.concatenate(
                (
                    frame[:args.border].ravel(),
                    frame[-args.border:].ravel(),
                    frame[:, :args.border].ravel(),
                    frame[:, -args.border:].ravel(),
                )
            )
            if np.any(border_pixels):
                raise SystemExit(f"Frame {row},{column} has non-transparent border pixels")
            areas = component_areas(frame > args.alpha_threshold)
            if not areas:
                raise SystemExit(f"Frame {row},{column} is empty")
            reports.append(f"{row}:{column}=main{areas[0]}/components{len(areas)}")

    if args.preview:
        preview_path = Path(args.preview)
        preview_path.parent.mkdir(parents=True, exist_ok=True)
        checker_preview(atlas, args.columns, args.rows, args.frame_size).save(preview_path, optimize=True)
    print(
        f"Validated {path} {atlas.width}x{atlas.height}; "
        f"removed {removed_components} small components: " + ", ".join(reports)
    )


if __name__ == "__main__":
    main()

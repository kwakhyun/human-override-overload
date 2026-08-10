"""Validate shipped motion atlases and report decoded texture memory.

This checks the deterministic parts of the sprite pipeline: exact dimensions,
non-empty cells, transparent safety borders, chroma-key residue, and logical
RGBA8 residency. It deliberately reports (rather than rejects) alpha-bounds
center drift because some attacks extend weapons asymmetrically.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image


SPECS = {
    "enemy-suicide-drone": ("public/assets/overload/enemies/motion-v2/suicide-drone-motion-atlas.png", 6, 4, 160),
    "enemy-rifleman": ("public/assets/overload/enemies/motion-v2/rifleman-motion-atlas.png", 6, 4, 160),
    "enemy-sniper": ("public/assets/overload/enemies/motion-v2/sniper-motion-atlas.png", 6, 4, 160),
    "ally-hunter-drone": ("public/assets/overload/allies/motion-v2/hunter-drone-motion-atlas.png", 5, 4, 128),
    "ally-pulse-sentry": ("public/assets/overload/allies/motion-v2/pulse-sentry-motion-atlas.png", 5, 4, 128),
    "ally-suppressor-drone": ("public/assets/overload/allies/motion-v2/suppressor-drone-motion-atlas.png", 5, 4, 128),
    "boss-wrong-engine": ("public/assets/overload/boss/motion-v2/wrong-engine-motion-atlas.png", 6, 4, 320),
    "boss-mirror-tyrant": ("public/assets/overload/regions/glass-dune/motion-v2/mirror-tyrant-motion-atlas.png", 6, 4, 320),
    "boss-drowned-oracle": ("public/assets/overload/regions/abyssal-archive/motion-v2/drowned-oracle-motion-atlas.png", 6, 4, 320),
}


def pixels(image: Image.Image):
    """Use Pillow's current flattened iterator while retaining older runtime support."""
    flattened = getattr(image, "get_flattened_data", None)
    return flattened() if flattened else image.getdata()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=Path(__file__).resolve().parents[1])
    parser.add_argument("--json", action="store_true")
    return parser.parse_args()


def alpha_bounds(alpha: Image.Image) -> tuple[int, int, int, int] | None:
    return alpha.point(lambda value: 255 if value > 12 else 0).getbbox()


def border_is_clear(alpha: Image.Image, border: int = 4) -> bool:
    width, height = alpha.size
    strips = (
        alpha.crop((0, 0, width, border)),
        alpha.crop((0, height - border, width, height)),
        alpha.crop((0, 0, border, height)),
        alpha.crop((width - border, 0, width, height)),
    )
    return all(strip.getextrema()[1] <= 4 for strip in strips)


def chroma_residue(image: Image.Image) -> int:
    residue = 0
    for red, green, blue, alpha in pixels(image):
        if alpha <= 12:
            continue
        magenta = red > 235 and blue > 235 and green < 36
        green_key = green > 235 and red < 36 and blue < 36
        if magenta or green_key:
            residue += 1
    return residue


def inspect(root: Path, name: str, spec: tuple[str, int, int, int]) -> tuple[dict, list[str]]:
    relative, columns, rows, cell = spec
    path = root / relative
    errors: list[str] = []
    if not path.exists():
        return {"name": name, "path": relative, "missing": True}, [f"{name}: missing {relative}"]
    source = Image.open(path).convert("RGBA")
    expected = (columns * cell, rows * cell)
    if source.size != expected:
        errors.append(f"{name}: expected {expected}, got {source.size}")
    centers: list[tuple[float, float]] = []
    coverage: list[float] = []
    clear_borders = 0
    empty_cells = 0
    for row in range(rows):
        for column in range(columns):
            frame = source.crop((column * cell, row * cell, (column + 1) * cell, (row + 1) * cell))
            alpha = frame.getchannel("A")
            bounds = alpha_bounds(alpha)
            if bounds is None:
                empty_cells += 1
                continue
            left, top, right, bottom = bounds
            centers.append(((left + right) / 2, (top + bottom) / 2))
            visible = sum(1 for value in pixels(alpha) if value > 12)
            coverage.append(visible / (cell * cell))
            if border_is_clear(alpha):
                clear_borders += 1
    expected_cells = columns * rows
    if empty_cells:
        errors.append(f"{name}: {empty_cells} empty cells")
    if clear_borders != expected_cells:
        errors.append(f"{name}: only {clear_borders}/{expected_cells} cells have clear 4px borders")
    residue = chroma_residue(source)
    if residue:
        errors.append(f"{name}: {residue} opaque chroma-key pixels remain")
    center_drift = 0.0
    if centers:
        center_drift = max(max(abs(x - cell / 2), abs(y - cell / 2)) for x, y in centers)
    return {
        "name": name,
        "path": relative,
        "dimensions": list(source.size),
        "grid": [columns, rows],
        "cell": cell,
        "fileBytes": path.stat().st_size,
        "decodedRgba8Bytes": source.width * source.height * 4,
        "cells": expected_cells,
        "emptyCells": empty_cells,
        "clearBorderCells": clear_borders,
        "coverageMin": min(coverage, default=0),
        "coverageMax": max(coverage, default=0),
        "alphaBoundsCenterDriftPx": center_drift,
        "opaqueChromaResiduePixels": residue,
    }, errors


def main() -> None:
    args = parse_args()
    root = Path(args.root).resolve()
    reports: list[dict] = []
    errors: list[str] = []
    for name, spec in SPECS.items():
        report, failures = inspect(root, name, spec)
        reports.append(report)
        errors.extend(failures)
    totals = {
        "fileBytes": sum(report.get("fileBytes", 0) for report in reports),
        "decodedRgba8Bytes": sum(report.get("decodedRgba8Bytes", 0) for report in reports),
    }
    output = {"atlases": reports, "totals": totals, "errors": errors}
    if args.json:
        print(json.dumps(output, indent=2))
    else:
        for report in reports:
            print(
                f"{report['name']}: {report.get('dimensions', 'MISSING')} "
                f"decoded={report.get('decodedRgba8Bytes', 0) / 1048576:.2f}MiB "
                f"borders={report.get('clearBorderCells', 0)}/{report.get('cells', 0)}"
            )
        print(f"total decoded RGBA8={totals['decodedRgba8Bytes'] / 1048576:.2f}MiB")
        for error in errors:
            print(f"ERROR: {error}")
    raise SystemExit(1 if errors else 0)


if __name__ == "__main__":
    main()

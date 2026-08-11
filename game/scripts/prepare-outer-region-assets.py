"""Prepare ImageGen route art and seven-subject unit sheets for regions 04-06.

The unit source contract is: drone, rifleman, sniper, midboss, boss phase 1-3.
Subjects are recovered by connected components before enemy and boss groups are
normalized independently, preserving readable enemy scale without shrinking the
three much larger boss forms into the same cell budget.
"""

from __future__ import annotations

import argparse
import importlib.util
from pathlib import Path
import sys

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parent


def load_grid_helpers():
    path = ROOT / "normalize-overflow-grid-atlas.py"
    spec = importlib.util.spec_from_file_location("overflow_grid", path)
    if spec is None or spec.loader is None:
        raise SystemExit(f"Unable to load {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def cover_resize(image: Image.Image, width: int, height: int) -> Image.Image:
    scale = max(width / image.width, height / image.height)
    resized = image.resize(
        (round(image.width * scale), round(image.height * scale)),
        Image.Resampling.LANCZOS,
    )
    left = max(0, (resized.width - width) // 2)
    top = max(0, (resized.height - height) // 2)
    return resized.crop((left, top, left + width, top + height))


def save_route(source: Path, output_dir: Path) -> None:
    image = Image.open(source).convert("RGB")
    cover_resize(image, 1920, 1080).save(output_dir / "route.webp", "WEBP", quality=90, method=6)
    performance = output_dir / "performance"
    performance.mkdir(parents=True, exist_ok=True)
    cover_resize(image, 960, 540).save(performance / "route.webp", "WEBP", quality=82, method=6)


def save_unit_atlases(source: Path, output_dir: Path, preview_dir: Path) -> None:
    helpers = load_grid_helpers()
    image = Image.open(source).convert("RGBA")
    alpha = np.asarray(image.getchannel("A")) > 12
    components = helpers.find_components(helpers.dilate(alpha, 2))
    significant = sorted((item for item in components if item.area >= 1_000), key=lambda item: item.center_x)
    if len(significant) == 6:
        # Occasionally ImageGen lets the final two phase silhouettes touch.
        # Recover the first five actors normally, then bisect only the joined
        # rightmost component instead of mistaking alpha noise for actor seven.
        recovered = helpers.recover_frames(image, significant[:5], 3)
        joined = significant[-1]
        split_x = round((joined.left + joined.right) / 2)
        recovered.extend([
            image.crop((max(0, joined.left - 3), max(0, joined.top - 3), split_x, min(image.height, joined.bottom + 3))),
            image.crop((split_x, max(0, joined.top - 3), min(image.width, joined.right + 3), min(image.height, joined.bottom + 3))),
        ])
    else:
        actors = helpers.dominant_grid_components(components, 7, 1, image.width, image.height)
        recovered = helpers.recover_frames(image, actors, 3)

    groups = (
        ("enemy-forms-atlas.png", recovered[:4], 256, 4),
        ("boss-forms-atlas.png", recovered[4:], 512, 3),
    )
    performance = output_dir / "performance"
    performance.mkdir(parents=True, exist_ok=True)
    preview_dir.mkdir(parents=True, exist_ok=True)
    for name, frames, size, columns in groups:
        normalized = helpers.normalize(frames, size, 14)
        atlas = helpers.compose(normalized, columns, 1, size)
        atlas.save(output_dir / name, optimize=True)
        atlas.resize((atlas.width * 3 // 4, atlas.height * 3 // 4), Image.Resampling.LANCZOS).save(
            performance / name,
            optimize=True,
        )
        helpers.make_preview(atlas, columns, 1, size).save(preview_dir / name, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--route", required=True, type=Path)
    parser.add_argument("--units-alpha", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    parser.add_argument("--preview", required=True, type=Path)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    save_route(args.route, args.out)
    save_unit_atlases(args.units_alpha, args.out, args.preview)
    print(f"Prepared outer-region assets in {args.out}")


if __name__ == "__main__":
    main()

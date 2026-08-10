"""Normalize generated OVERLOAD art into display-sized runtime assets."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


ALLY_NAMES = (
    "rook",
    "nyx",
    "moss",
    "aegis-echo",
    "hunter-drone",
    "suppressor-drone",
    "pulse-sentry",
    "emp-pylon",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--player", required=True)
    parser.add_argument("--enemy", required=True)
    parser.add_argument("--allies", required=True)
    parser.add_argument("--boss", required=True)
    parser.add_argument("--sector-1", required=True)
    parser.add_argument("--sector-2", required=True)
    parser.add_argument("--sector-3", required=True)
    parser.add_argument("--boss-room", required=True)
    parser.add_argument("--out-root", required=True)
    return parser.parse_args()


def alpha_crop(image: Image.Image, threshold: int = 8) -> Image.Image:
    alpha = image.getchannel("A").point(lambda value: 255 if value > threshold else 0)
    bounds = alpha.getbbox()
    if bounds is None:
        raise SystemExit("No visible sprite content detected")
    return image.crop(bounds)


def split_grid(image: Image.Image, columns: int, rows: int) -> list[list[Image.Image]]:
    result: list[list[Image.Image]] = []
    for row in range(rows):
        row_images: list[Image.Image] = []
        for column in range(columns):
            left = round(column * image.width / columns)
            top = round(row * image.height / rows)
            right = round((column + 1) * image.width / columns)
            bottom = round((row + 1) * image.height / rows)
            row_images.append(alpha_crop(image.crop((left, top, right, bottom))))
        result.append(row_images)
    return result


def normalize_group(
    images: list[Image.Image],
    size: int,
    padding: int,
    anchor: str = "center",
) -> list[Image.Image]:
    max_width = max(image.width for image in images)
    max_height = max(image.height for image in images)
    scale = min((size - padding * 2) / max_width, (size - padding * 2) / max_height)
    output: list[Image.Image] = []
    for image in images:
        width = max(1, round(image.width * scale))
        height = max(1, round(image.height * scale))
        resized = image.resize((width, height), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        if anchor == "bottom":
            position = ((size - width) // 2, size - padding - height)
        else:
            position = ((size - width) // 2, (size - height) // 2)
        canvas.alpha_composite(resized, position)
        output.append(canvas)
    return output


def save_png(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, optimize=True)


def compose_atlas(rows: list[list[Image.Image]]) -> Image.Image:
    frame_width, frame_height = rows[0][0].size
    atlas = Image.new(
        "RGBA",
        (frame_width * len(rows[0]), frame_height * len(rows)),
        (0, 0, 0, 0),
    )
    for row_index, row in enumerate(rows):
        for column_index, frame in enumerate(row):
            atlas.alpha_composite(frame, (column_index * frame_width, row_index * frame_height))
    return atlas


def center_crop_ratio(image: Image.Image, width_ratio: int, height_ratio: int) -> Image.Image:
    target_ratio = width_ratio / height_ratio
    current_ratio = image.width / image.height
    if current_ratio > target_ratio:
        width = round(image.height * target_ratio)
        left = (image.width - width) // 2
        return image.crop((left, 0, left + width, image.height))
    height = round(image.width / target_ratio)
    top = (image.height - height) // 2
    return image.crop((0, top, image.width, top + height))


def save_environment(source: str, path: Path) -> None:
    image = Image.open(source).convert("RGB")
    image = center_crop_ratio(image, 16, 9)
    image = image.resize((1600, 900), Image.Resampling.LANCZOS)
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "WEBP", quality=84, method=6)


def main() -> None:
    args = parse_args()
    root = Path(args.out_root)

    player = Image.open(args.player).convert("RGBA")
    player_rows = split_grid(player, 5, 3)
    normalized_player_rows = [normalize_group(row, 256, 12) for row in player_rows]
    save_png(compose_atlas(normalized_player_rows), root / "hero" / "survivor-motion-atlas.png")

    enemy = Image.open(args.enemy).convert("RGBA")
    enemy_rows = split_grid(enemy, 5, 3)
    normalized_enemy_rows = [normalize_group(row, 256, 12) for row in enemy_rows]
    save_png(compose_atlas(normalized_enemy_rows), root / "enemies" / "enemy-motion-atlas.png")
    for name, row in zip(("hunter", "suppressor", "brute"), normalized_enemy_rows, strict=True):
        save_png(row[0], root / "enemies" / f"{name}.png")

    allies = Image.open(args.allies).convert("RGBA")
    ally_rows = split_grid(allies, 4, 2)
    normalized_allies = normalize_group(ally_rows[0], 256, 14) + normalize_group(ally_rows[1], 256, 18)
    for name, image in zip(ALLY_NAMES, normalized_allies, strict=True):
        save_png(image, root / "allies" / f"{name}.png")

    boss = Image.open(args.boss).convert("RGBA")
    boss_frames = normalize_group(split_grid(boss, 3, 1)[0], 512, 18)
    save_png(compose_atlas([boss_frames]), root / "boss" / "wrong-engine-forms-atlas.png")
    for index, image in enumerate(boss_frames, start=1):
        save_png(image, root / "boss" / f"wrong-engine-phase{index}.png")

    environments = (
        (args.sector_1, "sector-01-shattered-approach.webp"),
        (args.sector_2, "sector-02-flooded-memorial.webp"),
        (args.sector_3, "sector-03-engine-causeway.webp"),
        (args.boss_room, "boss-chamber.webp"),
    )
    for source, filename in environments:
        save_environment(source, root / "environment" / filename)

    print(f"Prepared unified runtime art under {root}")


if __name__ == "__main__":
    main()

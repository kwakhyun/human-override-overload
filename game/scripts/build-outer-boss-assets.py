"""Build Region 04-06 true-nadir midboss and boss runtime atlases.

Each source is a 2x2 chroma sheet:
  top-left  = regional midboss
  top-right = boss phase 1
  bottom-left = boss phase 2
  bottom-right = boss phase 3

The first three regional enemy cells remain unchanged. Only the named
midboss cell is replaced, while the dedicated three-form boss atlas is fully
rebuilt at the established full/performance contracts.
"""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
REGIONS = ("neon-foundry", "storm-spire", "gene-vault")


def is_plate_green(pixel: tuple[int, int, int, int]) -> bool:
    red, green, blue, alpha = pixel
    return alpha > 0 and green >= 82 and green - max(red, blue) >= 34


def clear_hidden_rgb(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    data = bytearray(rgba.tobytes())
    for index in range(0, len(data), 4):
        if data[index + 3] == 0:
            data[index:index + 4] = b"\x00\x00\x00\x00"
    return Image.frombytes("RGBA", rgba.size, bytes(data))


def remove_connected_green(image: Image.Image, preserve_authored_green: bool) -> Image.Image:
    """Flood only the connected plate so authored green reactors survive."""

    rgba = image.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()
    plate_color = pixels[0, 0]
    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def enqueue(x: int, y: int) -> None:
        offset = y * width + x
        if visited[offset] or not is_plate_green(pixels[x, y]):
            return
        visited[offset] = 1
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

    data = bytearray(rgba.tobytes())
    for y in range(height):
        for x in range(width):
            offset = y * width + x
            byte_index = offset * 4
            color = tuple(data[byte_index:byte_index + 4])
            if max(abs(color[channel] - plate_color[channel]) for channel in range(3)) <= 18:
                data[byte_index:byte_index + 4] = b"\x00\x00\x00\x00"
                continue
            if visited[offset]:
                data[byte_index:byte_index + 4] = b"\x00\x00\x00\x00"
                continue
            red, green, blue, source_alpha = data[byte_index:byte_index + 4]
            if not preserve_authored_green and green >= 72 and green - max(red, blue) >= 28:
                data[byte_index:byte_index + 4] = b"\x00\x00\x00\x00"
                continue
            if green - max(red, blue) < 18:
                continue
            touches_plate = any(
                0 <= next_x < width
                and 0 <= next_y < height
                and visited[next_y * width + next_x]
                for next_x, next_y in (
                    (x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1),
                    (x - 2, y), (x + 2, y), (x, y - 2), (x, y + 2),
                )
            )
            if touches_plate:
                dominance = green - max(red, blue)
                alpha = max(0, min(source_alpha, round(255 * (54 - dominance) / 36)))
                data[byte_index + 1] = min(green, max(red, blue) + 10)
                data[byte_index + 3] = alpha
    return clear_hidden_rgb(Image.frombytes("RGBA", rgba.size, bytes(data)))


def premultiplied_resize(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return image.convert("RGBa").resize(size, Image.Resampling.LANCZOS).convert("RGBA")


def extract_quadrants(sheet: Image.Image, preserve_authored_green: bool) -> list[Image.Image]:
    sheet = sheet.convert("RGBA")
    half_width, half_height = sheet.width // 2, sheet.height // 2
    boxes = (
        (0, 0, half_width, half_height),
        (half_width, 0, sheet.width, half_height),
        (0, half_height, half_width, sheet.height),
        (half_width, half_height, sheet.width, sheet.height),
    )
    subjects: list[Image.Image] = []
    for index, box in enumerate(boxes):
        subject = remove_connected_green(sheet.crop(box), preserve_authored_green)
        bounds = subject.getchannel("A").point(lambda value: 255 if value > 8 else 0).getbbox()
        if bounds is None:
            raise SystemExit(f"generated boss quadrant {index} is empty")
        subjects.append(subject.crop(bounds))
    return subjects


def fit_subject(subject: Image.Image, cell_size: int, max_size: int) -> Image.Image:
    scale = min(max_size / subject.width, max_size / subject.height)
    width = max(1, round(subject.width * scale))
    height = max(1, round(subject.height * scale))
    subject = premultiplied_resize(subject, (width, height))
    cell = Image.new("RGBA", (cell_size, cell_size), (0, 0, 0, 0))
    cell.alpha_composite(subject, ((cell_size - width) // 2, (cell_size - height) // 2))
    return clear_hidden_rgb(cell)


def build_region(region: str, source_path: Path) -> None:
    region_dir = ROOT / "public/assets/overload/regions" / region
    reference_dir = ROOT / "reference/source-assets/overload/regions" / region
    preview_dir = ROOT / "tmp/boss-assets" / region
    reference_dir.mkdir(parents=True, exist_ok=True)
    preview_dir.mkdir(parents=True, exist_ok=True)

    source_sheet = Image.open(source_path).convert("RGBA")
    source_sheet.save(reference_dir / "topdown-boss-source-v2.png", optimize=True)
    midboss, phase_one, phase_two, phase_three = extract_quadrants(
        source_sheet,
        preserve_authored_green=region == "gene-vault",
    )

    enemy_path = region_dir / "enemy-forms-atlas.png"
    enemy_atlas = Image.open(enemy_path).convert("RGBA")
    enemy_cell_size = enemy_atlas.height
    enemy_output = Image.new("RGBA", enemy_atlas.size, (0, 0, 0, 0))
    enemy_output.alpha_composite(enemy_atlas.crop((0, 0, enemy_cell_size * 3, enemy_cell_size)), (0, 0))
    enemy_output.alpha_composite(fit_subject(midboss, enemy_cell_size, 224), (enemy_cell_size * 3, 0))
    enemy_output = clear_hidden_rgb(enemy_output)
    enemy_output.save(enemy_path, optimize=True)
    premultiplied_resize(enemy_output, (768, 192)).save(region_dir / "performance/enemy-forms-atlas.png", optimize=True)

    boss_cell_size = 512
    boss_output = Image.new("RGBA", (boss_cell_size * 3, boss_cell_size), (0, 0, 0, 0))
    for index, phase in enumerate((phase_one, phase_two, phase_three)):
        boss_output.alpha_composite(fit_subject(phase, boss_cell_size, 456), (index * boss_cell_size, 0))
    boss_output = clear_hidden_rgb(boss_output)
    boss_output.save(region_dir / "boss-forms-atlas.png", optimize=True)
    premultiplied_resize(boss_output, (1152, 384)).save(region_dir / "performance/boss-forms-atlas.png", optimize=True)

    preview = Image.new("RGBA", (1024, 512), (12, 19, 24, 255))
    preview.alpha_composite(premultiplied_resize(enemy_output.crop((enemy_cell_size * 3, 0, enemy_cell_size * 4, enemy_cell_size)), (256, 256)), (0, 128))
    preview.alpha_composite(premultiplied_resize(boss_output, (768, 256)), (256, 128))
    draw = ImageDraw.Draw(preview)
    draw.text((20, 20), f"{region.upper()} // MIDBOSS + BOSS PHASES 1-3", fill=(137, 248, 255, 255))
    preview.save(preview_dir / "atlas-preview.png", optimize=True)

    print(f"{region}: enemy={enemy_output.size} boss={boss_output.size}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    for region in REGIONS:
        parser.add_argument(f"--{region}", required=True, type=Path)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    for region in REGIONS:
        build_region(region, getattr(args, region.replace("-", "_")))


if __name__ == "__main__":
    main()

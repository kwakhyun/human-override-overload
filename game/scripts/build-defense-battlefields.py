from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "reference" / "source-assets" / "overload" / "defense" / "battlefields-v2"
OUTPUT_ROOT = ROOT / "public" / "assets" / "overload" / "defense" / "battlefields-v2"
SPECS = json.loads((ROOT / "src" / "defense" / "battlefields.json").read_text(encoding="utf-8"))

SOURCE_FILES = {
    "haven-perimeter": "haven-perimeter-base.png",
    "relay-blackout": "relay-blackout-base.png",
    "sovereign-night-siege": "sovereign-night-siege-base.png",
}

STAGE_COLORS = {
    "haven-perimeter": ((17, 45, 54), (99, 239, 255), (198, 252, 255)),
    "relay-blackout": ((31, 24, 61), (169, 135, 255), (220, 209, 255)),
    "sovereign-night-siege": ((61, 20, 27), (255, 98, 111), (255, 205, 161)),
}


def fit_cover(source: Image.Image, size: tuple[int, int]) -> Image.Image:
    target_ratio = size[0] / size[1]
    source_ratio = source.width / source.height
    if source_ratio > target_ratio:
        crop_width = round(source.height * target_ratio)
        left = (source.width - crop_width) // 2
        source = source.crop((left, 0, left + crop_width, source.height))
    else:
        crop_height = round(source.width / target_ratio)
        top = max(0, round((source.height - crop_height) * 0.44))
        source = source.crop((0, top, source.width, min(source.height, top + crop_height)))
    return source.resize(size, Image.Resampling.LANCZOS)


def transform_point(point: dict, size: tuple[int, int], portrait: bool) -> tuple[float, float]:
    if portrait:
        return 40 + point["x"] / 1280 * 640, 80 + point["y"] / 720 * 1180
    return point["x"] / 1280 * size[0], point["y"] / 720 * size[1]


def sample_polyline(points: list[tuple[float, float]], spacing: float) -> list[tuple[float, float, float]]:
    result: list[tuple[float, float, float]] = []
    for start, end in zip(points, points[1:]):
        dx, dy = end[0] - start[0], end[1] - start[1]
        length = max(1.0, math.hypot(dx, dy))
        steps = max(1, int(length / spacing))
        angle = math.atan2(dy, dx)
        for step in range(steps):
            ratio = step / steps
            result.append((start[0] + dx * ratio, start[1] + dy * ratio, angle))
    return result


def draw_routes(base: Image.Image, stage_id: str, spec: dict, portrait: bool) -> Image.Image:
    size = base.size
    scale = size[0] / (720 if portrait else 1280)
    lane_width = max(25, round((54 if portrait else 64) * scale))
    outer_width = max(lane_width + 10, round((70 if portrait else 82) * scale))
    shadow_width = outer_width + max(8, round(12 * scale))
    floor, accent, highlight = STAGE_COLORS[stage_id]
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    for route_index, route in enumerate(spec["routes"]):
        points = [transform_point(point, size, portrait) for point in route]
        draw.line(points, fill=(0, 0, 0, 132), width=shadow_width, joint="curve")
        draw.line(points, fill=(*accent, 136), width=outer_width, joint="curve")
        draw.line(points, fill=(*floor, 184), width=lane_width, joint="curve")
        draw.line(points, fill=(*highlight, 75), width=max(2, round(2 * scale)), joint="curve")
        samples = sample_polyline(points, max(24, 34 * scale))
        for sample_index, (x, y, angle) in enumerate(samples):
            if (sample_index + route_index) % 2:
                continue
            length = 6 * scale
            dx, dy = math.cos(angle) * length, math.sin(angle) * length
            draw.line((x - dx, y - dy, x + dx, y + dy), fill=(*highlight, 132), width=max(1, round(2 * scale)))

    pad_radius = (28 if portrait else 31) * scale
    for node in spec["nodes"]:
        x, y = transform_point(node, size, portrait)
        draw.ellipse((x - pad_radius - 5 * scale, y - pad_radius - 5 * scale, x + pad_radius + 5 * scale, y + pad_radius + 5 * scale), fill=(0, 0, 0, 172))
        draw.ellipse((x - pad_radius, y - pad_radius, x + pad_radius, y + pad_radius), fill=(*floor, 190), outline=(*accent, 235), width=max(2, round(3 * scale)))
        inner = pad_radius * 0.58
        draw.ellipse((x - inner, y - inner, x + inner, y + inner), outline=(*highlight, 155), width=max(1, round(2 * scale)))

    core = transform_point(spec["core"], size, portrait)
    core_radius = (47 if portrait else 54) * scale
    draw.ellipse((core[0] - core_radius * 1.32, core[1] - core_radius * 1.32, core[0] + core_radius * 1.32, core[1] + core_radius * 1.32), fill=(0, 0, 0, 205))
    draw.ellipse((core[0] - core_radius, core[1] - core_radius, core[0] + core_radius, core[1] + core_radius), fill=(*floor, 225), outline=(*highlight, 245), width=max(3, round(4 * scale)))
    inner = core_radius * 0.54
    draw.ellipse((core[0] - inner, core[1] - inner, core[0] + inner, core[1] + inner), fill=(*accent, 210), outline=(235, 255, 255, 245), width=max(2, round(3 * scale)))

    glow = layer.filter(ImageFilter.GaussianBlur(max(5, round(8 * scale))))
    composed = Image.alpha_composite(base.convert("RGBA"), glow)
    return Image.alpha_composite(composed, layer).convert("RGB")


def make_stage(stage_id: str, spec: dict) -> None:
    source = Image.open(SOURCE_ROOT / SOURCE_FILES[stage_id]).convert("RGB")
    stage_dir = OUTPUT_ROOT / stage_id
    performance_dir = OUTPUT_ROOT / "performance" / stage_id
    stage_dir.mkdir(parents=True, exist_ok=True)
    performance_dir.mkdir(parents=True, exist_ok=True)

    landscape = fit_cover(source, (1920, 1080))
    portrait_source = ImageEnhance.Brightness(fit_cover(source, (720, 1280))).enhance(0.9)
    authored_landscape = draw_routes(landscape, stage_id, spec, False)
    authored_portrait = draw_routes(portrait_source, stage_id, spec, True)

    authored_landscape.save(stage_dir / "battlefield.webp", "WEBP", quality=90, method=6)
    authored_portrait.save(stage_dir / "battlefield-portrait.webp", "WEBP", quality=90, method=6)
    authored_landscape.resize((960, 540), Image.Resampling.LANCZOS).save(performance_dir / "battlefield.webp", "WEBP", quality=82, method=6)
    authored_portrait.resize((360, 640), Image.Resampling.LANCZOS).save(performance_dir / "battlefield-portrait.webp", "WEBP", quality=82, method=6)


def main() -> None:
    for stage_id, spec in SPECS.items():
        make_stage(stage_id, spec)


if __name__ == "__main__":
    main()

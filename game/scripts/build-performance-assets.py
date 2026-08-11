"""Build frame-safe low-memory raster variants for the PERFORMANCE tier.

The source art remains authoritative. Atlases are resized cell-by-cell so
neighboring animation frames never bleed across gutters during resampling.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets" / "overload"


@dataclass(frozen=True)
class Job:
    source: str
    target: str
    scale: float
    columns: int = 1
    rows: int = 1


JOBS = (
    Job("hero/survivor-directional-aim-atlas.png", "hero/performance/survivor-directional-aim-atlas.png", 0.75, 8, 8),
    Job("hero/survivor-sword-directional-aim-atlas.png", "hero/performance/survivor-sword-directional-aim-atlas.png", 0.75, 8, 8),
    Job("enemies/motion-v2/suicide-drone-motion-atlas.png", "enemies/motion-v2/performance/suicide-drone-motion-atlas.png", 0.75, 6, 4),
    Job("enemies/motion-v2/rifleman-motion-atlas.png", "enemies/motion-v2/performance/rifleman-motion-atlas.png", 0.75, 6, 4),
    Job("enemies/motion-v2/sniper-motion-atlas.png", "enemies/motion-v2/performance/sniper-motion-atlas.png", 0.75, 6, 4),
    Job("allies/motion-v2/hunter-drone-motion-atlas.png", "allies/motion-v2/performance/hunter-drone-motion-atlas.png", 0.75, 5, 4),
    Job("allies/motion-v2/pulse-sentry-motion-atlas.png", "allies/motion-v2/performance/pulse-sentry-motion-atlas.png", 0.75, 5, 4),
    Job("allies/motion-v2/suppressor-drone-motion-atlas.png", "allies/motion-v2/performance/suppressor-drone-motion-atlas.png", 0.75, 5, 4),
    Job("vfx/combat-fx-atlas.png", "vfx/performance/combat-fx-atlas.png", 0.5, 4, 3),
    Job("vfx/gates/sovereign-gate-motion-atlas.png", "vfx/gates/performance/sovereign-gate-motion-atlas.png", 0.75, 6, 1),
    Job("items/healing-kit-motion-atlas.png", "items/performance/healing-kit-motion-atlas.png", 0.5, 4, 1),
    Job("campaign/squad-traces-atlas.png", "campaign/performance/squad-traces-atlas.png", 0.5, 3, 1),
    Job("environment/sector-01-shattered-approach.webp", "environment/performance/sector-01-shattered-approach.webp", 0.5),
    Job("environment/sector-02-flooded-memorial.webp", "environment/performance/sector-02-flooded-memorial.webp", 0.5),
    Job("environment/sector-03-engine-causeway.webp", "environment/performance/sector-03-engine-causeway.webp", 0.5),
    Job("environment/boss-chamber.webp", "environment/performance/boss-chamber.webp", 0.5),
    Job("boss/wrong-engine-forms-atlas.png", "boss/performance/wrong-engine-forms-atlas.png", 0.5, 3, 1),
    Job("boss/motion-v2/wrong-engine-motion-atlas.png", "boss/motion-v2/performance/wrong-engine-motion-atlas.png", 0.75, 6, 4),
    Job("regions/glass-dune/route.webp", "regions/glass-dune/performance/route.webp", 0.5),
    Job("regions/glass-dune/boss-room.webp", "regions/glass-dune/performance/boss-room.webp", 0.5),
    Job("regions/glass-dune/boss-forms-atlas.png", "regions/glass-dune/performance/boss-forms-atlas.png", 0.5, 3, 1),
    Job("regions/glass-dune/motion-v2/mirror-tyrant-motion-atlas.png", "regions/glass-dune/motion-v2/performance/mirror-tyrant-motion-atlas.png", 0.75, 6, 4),
    Job("regions/abyssal-archive/route.webp", "regions/abyssal-archive/performance/route.webp", 0.5),
    Job("regions/abyssal-archive/boss-room.webp", "regions/abyssal-archive/performance/boss-room.webp", 0.5),
    Job("regions/abyssal-archive/boss-forms-atlas.png", "regions/abyssal-archive/performance/boss-forms-atlas.png", 0.5, 3, 1),
    Job("regions/abyssal-archive/motion-v2/drowned-oracle-motion-atlas.png", "regions/abyssal-archive/motion-v2/performance/drowned-oracle-motion-atlas.png", 0.75, 6, 4),
)


def resize_job(job: Job) -> tuple[Path, tuple[int, int]]:
    source_path = ASSETS / job.source
    target_path = ASSETS / job.target
    with Image.open(source_path) as opened:
        image = opened.convert("RGBA")
    if image.width % job.columns or image.height % job.rows:
        raise ValueError(f"Atlas grid does not divide source: {source_path}")

    source_cell = (image.width // job.columns, image.height // job.rows)
    target_cell = (
        max(1, round(source_cell[0] * job.scale)),
        max(1, round(source_cell[1] * job.scale)),
    )
    output = Image.new("RGBA", (target_cell[0] * job.columns, target_cell[1] * job.rows))
    for row in range(job.rows):
        for column in range(job.columns):
            left = column * source_cell[0]
            top = row * source_cell[1]
            frame = image.crop((left, top, left + source_cell[0], top + source_cell[1]))
            frame = frame.resize(target_cell, Image.Resampling.LANCZOS)
            output.alpha_composite(frame, (column * target_cell[0], row * target_cell[1]))

    target_path.parent.mkdir(parents=True, exist_ok=True)
    if target_path.suffix.lower() == ".webp":
        output.convert("RGB").save(target_path, "WEBP", quality=82, method=6)
    else:
        output.save(target_path, "PNG", optimize=True, compress_level=9)
    return target_path, output.size


def main() -> None:
    decoded_before = 0
    decoded_after = 0
    for job in JOBS:
        with Image.open(ASSETS / job.source) as source:
            decoded_before += source.width * source.height * 4
        target, size = resize_job(job)
        decoded_after += size[0] * size[1] * 4
        print(f"{target.relative_to(ROOT)} {size[0]}x{size[1]}")
    saved = decoded_before - decoded_after
    print(f"decoded RGBA8: {decoded_before / 1048576:.3f} -> {decoded_after / 1048576:.3f} MiB")
    print(f"saved: {saved / 1048576:.3f} MiB ({saved / decoded_before * 100:.1f}%)")


if __name__ == "__main__":
    main()

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "reference" / "source-assets" / "overload" / "regions"
OUTPUT_ROOT = ROOT / "public" / "assets" / "overload" / "regions"
REGION_IDS = (
    "wrong-engine-core",
    "glass-dune",
    "abyssal-archive",
    "neon-foundry",
    "storm-spire",
    "gene-vault",
)


def save_webp(source: Image.Image, destination: Path, size: int, quality: int) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    resized = source.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(destination, "WEBP", quality=quality, method=6)


def main() -> None:
    for region_id in REGION_IDS:
        source_path = SOURCE_ROOT / region_id / "arena-square-v1.png"
        if not source_path.is_file():
            raise FileNotFoundError(f"Missing arena source: {source_path}")
        with Image.open(source_path) as image:
            image = image.convert("RGB")
            if image.width != image.height:
                raise ValueError(f"Arena source must be square: {source_path} ({image.size})")
            save_webp(image, OUTPUT_ROOT / region_id / "arena-square-v1.webp", 1254, 88)
            save_webp(image, OUTPUT_ROOT / region_id / "performance" / "arena-square-v1.webp", 768, 82)


if __name__ == "__main__":
    main()

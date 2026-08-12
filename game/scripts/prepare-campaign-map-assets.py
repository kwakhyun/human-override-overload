from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = ROOT / "reference" / "source-assets" / "overload" / "campaign" / "strategic-maps"
TARGET_ROOT = ROOT / "public" / "assets" / "overload" / "campaign"

ASSETS = {
    "strategic-world-map.webp": SOURCE_ROOT / "strategic-world-map-imagegen.png",
    "outer-frontier-region-map.webp": SOURCE_ROOT / "outer-frontier-region-map-imagegen.png",
}


def main():
    TARGET_ROOT.mkdir(parents=True, exist_ok=True)
    for name, source in ASSETS.items():
        with Image.open(source) as image:
            image = image.convert("RGB").resize((1920, 1080), Image.Resampling.LANCZOS)
            target = TARGET_ROOT / name
            image.save(target, "WEBP", quality=88, method=6)
            print(f"{target.relative_to(ROOT)} {target.stat().st_size} bytes")


if __name__ == "__main__":
    main()

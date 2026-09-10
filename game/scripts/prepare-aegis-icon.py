"""Encode the approved generated icon for browser metadata. Source art stays private."""
from pathlib import Path
import hashlib
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "reference/source-assets/overload/icons/aegis-anime-v2/source.png"
OUT = ROOT / "public/assets/overload/hero"

image = Image.open(SOURCE).convert("RGB")
if image.width != image.height:
    raise ValueError("The approved icon source must be square; do not crop a different image silently")
OUT.mkdir(parents=True, exist_ok=True)
outputs = []
for filename, size, options in [
    ("aegis-anime-v2-icon.webp", 512, {"quality": 92, "method": 6}),
    ("aegis-anime-v2-favicon-32.png", 32, {"optimize": True}),
    ("aegis-anime-v2-apple-touch-180.png", 180, {"optimize": True}),
]:
    target = OUT / filename
    image.resize((size, size), Image.Resampling.LANCZOS).save(target, **options)
    outputs.append({"path": target.relative_to(ROOT).as_posix(), "width": size, "height": size,
                    "bytes": target.stat().st_size, "sha256": hashlib.sha256(target.read_bytes()).hexdigest()})
metadata_path = ROOT / "docs/art/aegis-icon-anime-v2.json"
metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
metadata.update({"source": SOURCE.relative_to(ROOT).as_posix(),
                 "sourceSha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(), "outputs": outputs})
metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(outputs, ensure_ascii=False))

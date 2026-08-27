"""Audit HUMAN OVERRIDE operative portraits against one visual-stage contract.

The lobby, character dossier, dialogue, recruit, and tag-cutscene surfaces all
reuse the same 9:16 key art.  A transparent canvas can have the right pixel
dimensions while still making a subject float or appear arbitrarily larger
than another operative, so this audit records and validates the visible alpha
bounds as well as the file hash.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
HERO_DIR = ROOT / "public/assets/overload/hero"
CONTRACT_PATH = HERO_DIR / "operative-portrait-contract.json"
CANVAS = (864, 1536)
PORTRAITS = {
    "aegis": "survivor-portrait-v2.webp",
    "mika": "mika-portrait-v2.webp",
    "vesper": "vesper-portrait-v7.webp",
    "nox": "nox-portrait-v1.webp",
}


def portrait_metrics(path: Path) -> dict[str, object]:
    with Image.open(path) as opened:
        image = opened.convert("RGBA")
        bounds = image.getchannel("A").getbbox()
        if bounds is None:
            raise ValueError(f"{path.name}: portrait has no visible pixels")
        left, top, right, bottom = bounds
        width, height = image.size
        return {
            "file": path.name,
            "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "canvas": [width, height],
            "alphaBounds": [left, top, right, bottom],
            "visibleWidthRatio": round((right - left) / width, 4),
            "visibleHeightRatio": round((bottom - top) / height, 4),
            "bottomGap": height - bottom,
            "centerOffsetRatio": round(abs(((left + right) / 2) - (width / 2)) / width, 4),
        }


def collect_contract() -> dict[str, object]:
    return {
        "version": 1,
        "canvas": list(CANVAS),
        "rules": {
            "maximumBottomGap": 16,
            "visibleHeightRatio": [0.88, 0.97],
            "maximumRosterHeightSpread": 0.07,
            "maximumCenterOffsetRatio": 0.04,
        },
        "portraits": {
            operative_id: portrait_metrics(HERO_DIR / filename)
            for operative_id, filename in PORTRAITS.items()
        },
    }


def validate_contract(contract: dict[str, object]) -> None:
    rules = contract["rules"]
    portraits = contract["portraits"]
    height_ratios: list[float] = []
    failures: list[str] = []
    for operative_id, metrics in portraits.items():
        if metrics["canvas"] != list(CANVAS):
            failures.append(f"{operative_id}: canvas {metrics['canvas']} != {list(CANVAS)}")
        if metrics["bottomGap"] > rules["maximumBottomGap"]:
            failures.append(f"{operative_id}: bottom gap {metrics['bottomGap']}px makes the subject float")
        height_ratio = metrics["visibleHeightRatio"]
        height_ratios.append(height_ratio)
        minimum, maximum = rules["visibleHeightRatio"]
        if not minimum <= height_ratio <= maximum:
            failures.append(f"{operative_id}: visible height ratio {height_ratio} outside {minimum}-{maximum}")
        if metrics["centerOffsetRatio"] > rules["maximumCenterOffsetRatio"]:
            failures.append(f"{operative_id}: horizontal center offset {metrics['centerOffsetRatio']} is excessive")
    spread = max(height_ratios) - min(height_ratios)
    if spread > rules["maximumRosterHeightSpread"]:
        failures.append(
            f"roster visible-height spread {spread:.4f} exceeds {rules['maximumRosterHeightSpread']}; "
            "only authored stature differences are allowed"
        )
    if failures:
        raise ValueError("\n".join(failures))


def write_contract() -> dict[str, object]:
    contract = collect_contract()
    validate_contract(contract)
    CONTRACT_PATH.write_text(json.dumps(contract, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return contract


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="validate current assets without rewriting the manifest")
    args = parser.parse_args()
    contract = collect_contract()
    validate_contract(contract)
    if args.check:
        recorded = json.loads(CONTRACT_PATH.read_text(encoding="utf-8"))
        if recorded != contract:
            raise SystemExit("operative portrait contract is stale; rebuild the portrait assets")
    else:
        CONTRACT_PATH.write_text(json.dumps(contract, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(contract, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

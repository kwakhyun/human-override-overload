"""Build display-size, true-alpha runtime portraits from project-owned sources.

NPC dialogue art is authored on one shared square upper-body canvas.  Chroma
sources are kept under ``reference/source-assets`` and keyed here so the public
runtime never ships painted green/white mattes or mismatched source canvases.
Operative lobby art uses the same 9:16 contract as AEGIS and MIKA.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
NPC_DIR = ROOT / "public/assets/overload/ui/npcs"
HERO_DIR = ROOT / "public/assets/overload/hero"
SOURCE_CAMPAIGN_DIR = ROOT / "reference/source-assets/overload/campaign"
CHROMA_SOURCE_DIR = ROOT / "reference/source-assets/overload/portraits/chroma"


def normalize_alpha(image: Image.Image) -> Image.Image:
    """Clear hidden matte RGB so transparent edges cannot flash white."""

    rgba = image.convert("RGBA")
    pixels = bytearray(rgba.tobytes())
    for index in range(0, len(pixels), 4):
        if pixels[index + 3] == 0:
            pixels[index] = pixels[index + 1] = pixels[index + 2] = 0
    return Image.frombytes("RGBA", rgba.size, bytes(pixels))


def remove_green_chroma(image: Image.Image) -> Image.Image:
    """Create a soft alpha edge and remove green spill from generated sources."""

    rgba = image.convert("RGBA")
    pixels = bytearray(rgba.tobytes())
    for index in range(0, len(pixels), 4):
        red, green, blue, original_alpha = pixels[index : index + 4]
        strongest_non_green = max(red, blue)
        dominance = green - strongest_non_green

        if green > 72 and dominance > 8:
            if dominance >= 82:
                keyed_alpha = 0
            else:
                keyed_alpha = round(255 * (82 - dominance) / 74)
            pixels[index + 3] = min(original_alpha, keyed_alpha)

            if pixels[index + 3] > 0:
                # Suppress chroma spill without desaturating cyan costume light.
                pixels[index + 1] = min(green, strongest_non_green + 2)

        # Generated key plates can leave a dark-green antialias line whose
        # dominance is too small for the transparency threshold above.
        if pixels[index + 3] > 0 and pixels[index + 1] > max(pixels[index], pixels[index + 2]):
            pixels[index + 1] = max(pixels[index], pixels[index + 2])

        if pixels[index + 3] < 6:
            pixels[index + 3] = 0

        if pixels[index + 3] == 0:
            pixels[index] = pixels[index + 1] = pixels[index + 2] = 0

    return Image.frombytes("RGBA", rgba.size, bytes(pixels))


def place_on_canvas(
    image: Image.Image,
    size: tuple[int, int],
    *,
    top: int,
    side_padding: int,
    bottom_padding: int = 0,
) -> Image.Image:
    """Trim transparent padding and place art with a stable top/side contract."""

    alpha_bounds = image.getchannel("A").getbbox()
    if alpha_bounds is None:
        raise ValueError("portrait source has no visible pixels")
    subject = image.crop(alpha_bounds)
    max_width = size[0] - side_padding * 2
    max_height = size[1] - top - bottom_padding
    if max_height <= 0:
        raise ValueError("portrait canvas padding leaves no visible height")
    scale = min(max_width / subject.width, max_height / subject.height)
    target = (
        max(1, round(subject.width * scale)),
        max(1, round(subject.height * scale)),
    )
    # Premultiplied resize prevents bright or dark color fringes at alpha edges.
    subject = subject.convert("RGBa").resize(target, Image.Resampling.LANCZOS).convert("RGBA")
    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    x = (size[0] - target[0]) // 2
    canvas.alpha_composite(subject, (x, top))
    return normalize_alpha(remove_green_chroma(canvas))


def save_chroma_runtime(
    source: Path,
    destination: Path,
    *,
    size: tuple[int, int],
    top: int,
    side_padding: int,
    bottom_padding: int = 0,
) -> None:
    with Image.open(source) as opened:
        image = remove_green_chroma(opened)
        image = place_on_canvas(
            image,
            size,
            top=top,
            side_padding=side_padding,
            bottom_padding=bottom_padding,
        )
        destination.parent.mkdir(parents=True, exist_ok=True)
        # The second despill pass leaves transparent RGB black before encoding,
        # allowing a high-quality WebP without the former green/white matte.
        image.save(destination, "WEBP", quality=94, method=6, exact=True)


def fit_height(image: Image.Image, max_height: int) -> Image.Image:
    if image.height <= max_height:
        return image
    width = round(image.width * max_height / image.height)
    return image.resize((width, max_height), Image.Resampling.LANCZOS)


def save_runtime(source: Path, destination: Path, *, max_height: int, crop=None) -> None:
    with Image.open(source) as opened:
        image = opened.convert("RGBA")
        if crop is not None:
            image = image.crop(crop)
        image = normalize_alpha(fit_height(image, max_height))
        destination.parent.mkdir(parents=True, exist_ok=True)
        image.save(destination, "WEBP", quality=90, method=6, exact=True)


def main() -> None:
    save_runtime(
        HERO_DIR / "survivor-portrait.png",
        HERO_DIR / "survivor-portrait-v2.webp",
        max_height=1536,
    )
    save_runtime(
        HERO_DIR / "mika-portrait.png",
        HERO_DIR / "mika-portrait-v2.webp",
        max_height=1536,
    )
    npc_specs = (
        ("hana-upper-v2-chroma.png", "hana-research-director-v2.webp", 12, 16),
        # ILYA is intentionally framed a little larger than the female NPCs.
        ("ilya-upper-v4-chroma.png", "ilya-mechanic-v4.webp", 8, 6),
        ("sera-upper-v4-chroma.png", "sera-nightjar-pilot-v4.webp", 12, 16),
        ("rhea-upper-v3-chroma.png", "rhea-control-officer-v3.webp", 12, 16),
    )
    for source_name, destination_name, top, side_padding in npc_specs:
        save_chroma_runtime(
            CHROMA_SOURCE_DIR / source_name,
            NPC_DIR / destination_name,
            size=(768, 768),
            top=top,
            side_padding=side_padding,
        )

    save_chroma_runtime(
        CHROMA_SOURCE_DIR / "vesper-mid-thigh-v5-chroma.png",
        HERO_DIR / "vesper-portrait-v6.webp",
        size=(864, 1536),
        # VESPER's broader cape and armor made the subject read 20% larger than
        # AEGIS/MIKA even on the same canvas. Keep lower UI-safe space for
        # lobby captions and dialogue decks without a surface-specific zoom.
        top=72,
        side_padding=100,
        bottom_padding=292,
    )


if __name__ == "__main__":
    main()

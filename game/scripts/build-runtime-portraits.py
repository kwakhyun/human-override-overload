"""Build display-size, true-alpha runtime portraits from project-owned sources.

NPC dialogue art is authored on one shared square upper-body canvas.  Chroma
sources are kept under ``reference/source-assets`` and keyed here so the public
runtime never ships painted green/white mattes or mismatched source canvases.
Operative lobby art uses the same 9:16 contract as AEGIS and MIKA.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

from operative_portrait_contract import write_contract


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
    trim_bottom_ratio: float = 0.0,
) -> Image.Image:
    """Trim transparent padding and place art with a stable upper-body contract.

    ``trim_bottom_ratio`` removes authored lower-body framing before scaling.
    This keeps head and shoulder scale consistent when a source contains more
    torso than the other NPC masters, without adding per-screen CSS zooms.
    """

    alpha_bounds = image.getchannel("A").getbbox()
    if alpha_bounds is None:
        raise ValueError("portrait source has no visible pixels")
    subject = image.crop(alpha_bounds)
    if trim_bottom_ratio:
        retained_height = round(subject.height * (1 - trim_bottom_ratio))
        if retained_height <= 0:
            raise ValueError("portrait bottom trim removes the whole subject")
        subject = subject.crop((0, 0, subject.width, retained_height))
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
    trim_bottom_ratio: float = 0.0,
) -> None:
    with Image.open(source) as opened:
        image = remove_green_chroma(opened)
        image = place_on_canvas(
            image,
            size,
            top=top,
            side_padding=side_padding,
            bottom_padding=bottom_padding,
            trim_bottom_ratio=trim_bottom_ratio,
        )
        destination.parent.mkdir(parents=True, exist_ok=True)
        # The second despill pass leaves transparent RGB black before encoding,
        # allowing a high-quality WebP without the former green/white matte.
        image.save(destination, "WEBP", quality=94, method=6, exact=True)


def save_operative_runtime(
    source: Path,
    destination: Path,
    *,
    visible_height: int,
    side_padding: int = 16,
    chroma_key: bool = False,
) -> None:
    """Place one operative on the shared 9:16 floor-anchored stage.

    ``visible_height`` expresses authored stature.  Width is capped uniformly,
    while the alpha silhouette—not the source canvas—is anchored to the lower
    edge. This prevents transparent source padding from making a character
    float or appear arbitrarily smaller than the rest of the roster.
    """

    with Image.open(source) as opened:
        image = opened.convert("RGBA")
        if chroma_key:
            image = remove_green_chroma(image)
        bounds = image.getchannel("A").getbbox()
        if bounds is None:
            raise ValueError(f"{source.name}: operative portrait has no visible pixels")
        subject = image.crop(bounds)
        max_width = 864 - side_padding * 2
        scale = min(max_width / subject.width, visible_height / subject.height)
        target = (round(subject.width * scale), round(subject.height * scale))
        subject = subject.convert("RGBa").resize(target, Image.Resampling.LANCZOS).convert("RGBA")
        image = Image.new("RGBA", (864, 1536), (0, 0, 0, 0))
        image.alpha_composite(subject, ((864 - target[0]) // 2, 1536 - target[1]))
        image = normalize_alpha(image)
        destination.parent.mkdir(parents=True, exist_ok=True)
        image.save(destination, "WEBP", quality=94, method=6, exact=True)


def main() -> None:
    save_operative_runtime(
        HERO_DIR / "survivor-portrait.png",
        HERO_DIR / "survivor-portrait-v2.webp",
        visible_height=1464,
    )
    save_operative_runtime(
        HERO_DIR / "mika-portrait.png",
        HERO_DIR / "mika-portrait-v2.webp",
        # MIKA is canonically shorter than AEGIS; the restrained 5% difference
        # preserves that identity without the former arbitrary oversized read.
        visible_height=1392,
    )
    npc_specs = (
        ("hana-upper-v2-chroma.png", "hana-research-director-v2.webp", 20, 16, 0.0),
        # ILYA's swept hair needs a real asset-level safe area. Do not recover
        # stature later with a CSS zoom because that clips the same headroom.
        ("ilya-upper-v4-chroma.png", "ilya-mechanic-v4.webp", 42, 12, 0.0),
        # SERA's source includes substantially more lower torso. Crop it at
        # authoring time so her face/shoulder scale matches HANA and RHEA.
        ("sera-upper-v4-chroma.png", "sera-nightjar-pilot-v4.webp", 20, 16, 0.12),
        ("rhea-upper-v3-chroma.png", "rhea-control-officer-v3.webp", 20, 16, 0.0),
    )
    for source_name, destination_name, top, side_padding, trim_bottom_ratio in npc_specs:
        save_chroma_runtime(
            CHROMA_SOURCE_DIR / source_name,
            NPC_DIR / destination_name,
            size=(768, 768),
            top=top,
            side_padding=side_padding,
            trim_bottom_ratio=trim_bottom_ratio,
        )

    save_operative_runtime(
        CHROMA_SOURCE_DIR / "vesper-mid-thigh-v7-chroma.png",
        HERO_DIR / "vesper-portrait-v7.webp",
        visible_height=1464,
        chroma_key=True,
    )
    write_contract()


if __name__ == "__main__":
    main()

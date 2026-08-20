#!/usr/bin/env python3
"""Build the standalone Korean content-design portfolio for the Neople application."""

from __future__ import annotations

import hashlib
import re
from pathlib import Path

from PIL import Image as PILImage
from PIL import ImageOps
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "곽현_네오플_게임콘텐츠기획_포트폴리오.pdf"
TMP = ROOT / "tmp" / "pdfs" / "content-planner-portfolio"

FONT_REGULAR = Path(r"C:\Windows\Fonts\malgun.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\malgunbd.ttf")

PAGE = landscape(A4)
PW, PH = PAGE
TOTAL_PAGES = 17
MARGIN_X = 18 * mm
CONTENT_TOP = PH - 34 * mm
CONTENT_BOTTOM = 16 * mm

# Read-at-100%-zoom layout tokens. Supporting copy never drops below 9.5 pt.
SPACE_XS = 8
SPACE_SM = 12
SPACE_MD = 18
CARD_PAD = 15
CARD_RADIUS = 3

BG = colors.HexColor("#090B0E")
PANEL = colors.HexColor("#11151A")
PANEL_2 = colors.HexColor("#171C22")
PANEL_3 = colors.HexColor("#0D1014")
INK = colors.HexColor("#F3F0E9")
MUTED = colors.HexColor("#A5A9AF")
MUTED_2 = colors.HexColor("#7D848D")
CYAN = colors.HexColor("#6BE4E8")
CYAN_DARK = colors.HexColor("#1D7D82")
CYAN_PALE = colors.HexColor("#D8FAF8")
AMBER = colors.HexColor("#F4C55C")
MAGENTA = colors.HexColor("#DE6BC2")
RED = colors.HexColor("#FF4A5C")
GREEN = colors.HexColor("#7EE3A6")
LIME = colors.HexColor("#B5F05A")
GRID = colors.HexColor("#293038")
WHITE = colors.white


ASSETS = {
    "cover": ROOT / "public" / "assets" / "overload" / "intro" / "start-screen-key-art.webp",
    "haven": ROOT / "qa" / "responsive-desktop-home-1440x810.png",
    "regions": ROOT / "qa" / "desktop-final-regions.png",
    "sortie": ROOT / "qa" / "korean-copy-desktop-sortie.png",
    "route": ROOT / "docs" / "project" / "media" / "route-combat.png",
    "combat_guide": ROOT / "docs" / "project" / "media" / "combat-guide.png",
    "boss": ROOT / "qa" / "latest-boss-pattern-prism-lattice-desktop-1440x810.png",
    "reward": ROOT / "qa" / "latest-reward-neutral-focus-desktop-1440x810.png",
    "aegis": ROOT / "qa" / "character-information-desktop.png",
    "mika": ROOT / "qa" / "character-information-mika.png",
    "research": ROOT / "qa" / "haven-research-facility-1569x912.png",
    "mobile_world": ROOT / "qa" / "mobile-portrait-world-map-390x844.png",
    "mobile_combat": ROOT / "qa" / "mobile-portrait-combat-390x844.png",
    "defense": ROOT / "qa" / "defense-mode-smoke.png",
    "hunter": ROOT / "public" / "assets" / "overload" / "enemies" / "hunter.png",
    "suppressor": ROOT / "public" / "assets" / "overload" / "enemies" / "suppressor.png",
    "brute": ROOT / "public" / "assets" / "overload" / "enemies" / "brute.png",
    "siege_atlas": ROOT / "public" / "assets" / "overload" / "enemies" / "motion-v3" / "siege-walker-motion-atlas.png",
}


def register_fonts() -> None:
    if not FONT_REGULAR.exists() or not FONT_BOLD.exists():
        raise FileNotFoundError("Malgun Gothic is required for Korean PDF rendering")
    pdfmetrics.registerFont(TTFont("Portfolio-Regular", str(FONT_REGULAR)))
    pdfmetrics.registerFont(TTFont("Portfolio-Bold", str(FONT_BOLD)))
    pdfmetrics.registerFontFamily(
        "Portfolio", normal="Portfolio-Regular", bold="Portfolio-Bold"
    )


def style(
    name: str,
    size: float,
    leading: float | None = None,
    color=INK,
    bold: bool = False,
    align: int = TA_LEFT,
) -> ParagraphStyle:
    return ParagraphStyle(
        name,
        fontName="Portfolio-Bold" if bold else "Portfolio-Regular",
        fontSize=size,
        leading=leading or size * 1.42,
        textColor=color,
        alignment=align,
        wordWrap="CJK",
        splitLongWords=True,
    )


STYLES = {
    "title": style("title", 28, 34, INK, True),
    "subtitle": style("subtitle", 12.2, 17.5, MUTED),
    "h2": style("h2", 18, 23, INK, True),
    "h3": style("h3", 13, 18, CYAN, True),
    "body": style("body", 12, 17.5, INK),
    "body_small": style("body_small", 10.8, 16, MUTED),
    "body_bold": style("body_bold", 12.2, 17, INK, True),
    "metric": style("metric", 27, 31, INK, True),
    "metric_small": style("metric_small", 18, 22, INK, True),
    "caption": style("caption", 10.5, 15, MUTED),
    "center": style("center", 10.8, 15.5, INK, False, TA_CENTER),
    "center_bold": style("center_bold", 11.5, 16, INK, True, TA_CENTER),
    "table": style("table", 10.5, 14.8, INK),
    "table_head": style("table_head", 10.7, 15, INK, True, TA_CENTER),
    "overview_caption": style("overview_caption", 10.8, 15.8, INK),
}


def esc(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def para(
    c: canvas.Canvas,
    text: str,
    x: float,
    top: float,
    width: float,
    paragraph_style: ParagraphStyle | None = None,
    max_height: float = 500,
) -> float:
    paragraph_style = paragraph_style or STYLES["body"]
    p = Paragraph(text, paragraph_style)
    _, height = p.wrap(width, max_height)
    p.drawOn(c, x, top - height)
    return height


def rounded_panel(
    c: canvas.Canvas,
    x: float,
    y: float,
    w: float,
    h: float,
    fill=PANEL,
    stroke=GRID,
    radius: float = CARD_RADIUS,
    alpha: float = 1,
) -> None:
    c.saveState()
    c.setFillAlpha(alpha)
    c.setStrokeAlpha(min(0.72, alpha + 0.04))
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.setLineWidth(0.45)
    c.roundRect(x, y, w, h, min(radius, CARD_RADIUS), fill=1, stroke=1)
    c.restoreState()


def rule(c: canvas.Canvas, x1: float, y: float, x2: float, color=GRID, width=0.7) -> None:
    c.saveState()
    c.setStrokeColor(color)
    c.setLineWidth(width)
    c.line(x1, y, x2, y)
    c.restoreState()


def tag(c: canvas.Canvas, text: str, x: float, y: float, color=CYAN) -> float:
    label = esc(text)
    width = max(68, pdfmetrics.stringWidth(text, "Portfolio-Bold", 10) + 30)
    c.saveState()
    c.setFillAlpha(0.96)
    c.setFillColor(PANEL_2)
    c.setStrokeColor(color)
    c.setLineWidth(0.65)
    c.rect(x, y, width, 24, fill=1, stroke=1)
    c.setFillColor(color)
    c.rect(x, y, 3, 24, fill=1, stroke=0)
    c.setFillAlpha(1)
    c.setFillColor(INK)
    c.setFont("Portfolio-Bold", 10)
    c.drawString(x + 11, y + 7, label)
    c.restoreState()
    return width


def status_tags(c: canvas.Canvas, labels: list[tuple[str, colors.Color]], x: float, y: float) -> None:
    cursor = x
    for text, color in labels:
        cursor += tag(c, text, cursor, y, color) + SPACE_XS


def accent_for_page(page_no: int):
    if page_no <= 5:
        return CYAN
    if page_no <= 9:
        return RED
    if page_no <= 15:
        return AMBER
    return LIME


def background_grid(c: canvas.Canvas, accent) -> None:
    c.saveState()
    c.setFillColor(accent)
    c.setFillAlpha(0.018)
    c.rect(PW - 62 * mm, 0, 62 * mm, PH, fill=1, stroke=0)
    c.setStrokeColor(GRID)
    c.setStrokeAlpha(0.16)
    c.setLineWidth(0.35)
    c.line(MARGIN_X, 16 * mm, MARGIN_X, PH - 15 * mm)
    c.line(PW - MARGIN_X, 16 * mm, PW - MARGIN_X, PH - 15 * mm)
    c.restoreState()


def fade_rect(c: canvas.Canvas, x: float, y: float, w: float, h: float, color=BG, max_alpha: float = 0.92, horizontal: bool = True, reverse: bool = False, steps: int = 28) -> None:
    c.saveState()
    for index in range(steps):
        ratio = index / max(1, steps - 1)
        alpha = max_alpha * ((1 - ratio) if reverse else ratio)
        c.setFillColor(color)
        c.setFillAlpha(alpha)
        if horizontal:
            strip = w / steps
            c.rect(x + index * strip, y, strip + 0.5, h, fill=1, stroke=0)
        else:
            strip = h / steps
            c.rect(x, y + index * strip, w, strip + 0.5, fill=1, stroke=0)
    c.restoreState()


def image_window(c: canvas.Canvas, path: Path, x: float, y: float, w: float, h: float, focus=(0.5, 0.5), accent=CYAN, label: str = "") -> None:
    draw_crop(c, path, x, y, w, h, focus=focus, border=False)
    c.saveState()
    c.setStrokeColor(GRID)
    c.setLineWidth(0.65)
    c.rect(x, y, w, h, fill=0, stroke=1)
    c.setFillColor(accent)
    c.rect(x, y, w, 2.5, fill=1, stroke=0)
    c.restoreState()
    if label:
        tag(c, label, x + 8, y + 8, accent)


def frame(c: canvas.Canvas, page_no: int, section: str, title: str, subtitle: str = "") -> None:
    accent = accent_for_page(page_no)
    c.setFillColor(BG)
    c.rect(0, 0, PW, PH, fill=1, stroke=0)
    background_grid(c, accent)
    c.setFillColor(accent)
    c.rect(MARGIN_X - 5 * mm, PH - 45 * mm, 1.5 * mm, 25 * mm, fill=1, stroke=0)
    c.rect(MARGIN_X, PH - 14.5 * mm, 18 * mm, 1.3 * mm, fill=1, stroke=0)
    c.setFont("Portfolio-Regular", 9.7)
    c.setFillColor(MUTED)
    c.drawString(MARGIN_X, PH - 10.5 * mm, section)
    c.setFillColor(MUTED_2)
    c.drawRightString(PW - MARGIN_X, PH - 10.5 * mm, f"{page_no:02d} / {TOTAL_PAGES:02d}")
    para(c, title, MARGIN_X, PH - 20 * mm, PW - 2 * MARGIN_X - 18 * mm, STYLES["title"])
    if subtitle:
        para(c, subtitle, MARGIN_X, PH - 30 * mm, PW - 2 * MARGIN_X, STYLES["subtitle"])
    rule(c, MARGIN_X, 13 * mm, PW - MARGIN_X, GRID, 0.4)
    c.setFont("Portfolio-Regular", 9.5)
    c.setFillColor(MUTED_2)
    c.drawString(MARGIN_X, 7.5 * mm, "곽현 · 게임 콘텐츠 기획")


def section_divider(
    c: canvas.Canvas,
    page_no: int,
    section_no: str,
    title: str,
    claim: str,
    detail: str,
    topics: str,
    image_path: Path,
    accent,
    focus=(0.5, 0.5),
) -> None:
    draw_crop(c, image_path, 0, 0, PW, PH, focus=focus, border=False)
    c.saveState()
    c.setFillColor(colors.black)
    c.setFillAlpha(0.34)
    c.rect(0, 0, PW, PH, fill=1, stroke=0)
    c.setFillAlpha(0.9)
    c.rect(0, 0, PW * 0.59, PH, fill=1, stroke=0)
    c.setFillAlpha(1)
    c.setFillColor(accent)
    c.rect(0, 0, 5, PH, fill=1, stroke=0)
    c.restoreState()

    c.setFillColor(accent)
    c.setFont("Portfolio-Bold", 9.5)
    c.drawString(MARGIN_X, PH - 21 * mm, f"SECTION {section_no}  /  {title.upper()}")
    c.saveState()
    c.setFillColor(accent)
    c.setFillAlpha(0.18)
    c.setFont("Portfolio-Bold", 92)
    c.drawString(MARGIN_X, PH - 66 * mm, section_no)
    c.restoreState()
    para(c, f"<b>{esc(title)}</b>", MARGIN_X, PH - 75 * mm, 132 * mm, style(f"section_title_{section_no}", 33, 40, INK, True))
    c.setFillColor(accent)
    c.rect(MARGIN_X, PH - 93 * mm, 28 * mm, 2.5, fill=1, stroke=0)
    para(c, esc(claim), MARGIN_X, PH - 103 * mm, 128 * mm, style(f"section_claim_{section_no}", 16, 23, INK, True))
    para(c, esc(detail), MARGIN_X, PH - 128 * mm, 128 * mm, STYLES["body_small"])
    para(c, f"<font color='{accent.hexval()}'><b>{esc(topics)}</b></font>", MARGIN_X, 37 * mm, 138 * mm, STYLES["caption"])
    rule(c, MARGIN_X, 25 * mm, MARGIN_X + 138 * mm, GRID, 0.5)
    c.setFillColor(MUTED)
    c.setFont("Portfolio-Regular", 9.5)
    c.drawString(MARGIN_X, 18 * mm, "KWAK HYUN  ·  GAME CONTENT DESIGN")
    c.drawRightString(PW - MARGIN_X, 18 * mm, f"{page_no:02d}/{TOTAL_PAGES:02d}")


def cached_crop(path: Path, box: tuple[float, float], focus=(0.5, 0.5), quality=88) -> Path:
    if not path.exists():
        raise FileNotFoundError(path)
    width_pt, height_pt = box
    width_px = max(320, round(width_pt / 72 * 155))
    height_px = max(200, round(height_pt / 72 * 155))
    digest = hashlib.sha1(
        f"{path.resolve()}|{path.stat().st_mtime_ns}|{width_px}|{height_px}|{focus}".encode("utf-8")
    ).hexdigest()[:12]
    output = TMP / f"crop-{path.stem}-{digest}.jpg"
    if output.exists():
        return output
    with PILImage.open(path) as src:
        image = src.convert("RGB")
        fitted = ImageOps.fit(
            image,
            (width_px, height_px),
            method=PILImage.Resampling.LANCZOS,
            centering=focus,
        )
        fitted.save(output, "JPEG", quality=quality, optimize=True, progressive=True)
    return output


def cached_contain(path: Path, max_box: tuple[float, float], quality=88) -> tuple[Path, float]:
    if not path.exists():
        raise FileNotFoundError(path)
    width_pt, height_pt = max_box
    with PILImage.open(path) as src:
        ratio = src.width / src.height
        target_ratio = width_pt / height_pt
        if ratio >= target_ratio:
            draw_w = width_pt
            draw_h = width_pt / ratio
        else:
            draw_h = height_pt
            draw_w = height_pt * ratio
        width_px = max(320, round(draw_w / 72 * 155))
        height_px = max(200, round(draw_h / 72 * 155))
        digest = hashlib.sha1(
            f"{path.resolve()}|{path.stat().st_mtime_ns}|{width_px}|{height_px}".encode("utf-8")
        ).hexdigest()[:12]
        output = TMP / f"contain-{path.stem}-{digest}.jpg"
        if not output.exists():
            image = src.convert("RGB")
            image.thumbnail((width_px, height_px), PILImage.Resampling.LANCZOS)
            image.save(output, "JPEG", quality=quality, optimize=True, progressive=True)
    return output, draw_w / draw_h


def draw_crop(
    c: canvas.Canvas,
    path: Path,
    x: float,
    y: float,
    w: float,
    h: float,
    focus=(0.5, 0.5),
    border=True,
) -> None:
    prepared = cached_crop(path, (w, h), focus)
    c.drawImage(str(prepared), x, y, w, h, preserveAspectRatio=False, mask="auto")
    if border:
        c.saveState()
        c.setStrokeColor(GRID)
        c.setLineWidth(0.8)
        c.rect(x, y, w, h, fill=0, stroke=1)
        c.restoreState()


def draw_contain(c: canvas.Canvas, path: Path, x: float, y: float, w: float, h: float) -> None:
    prepared, ratio = cached_contain(path, (w, h))
    target_ratio = w / h
    if ratio >= target_ratio:
        draw_w = w
        draw_h = w / ratio
    else:
        draw_h = h
        draw_w = h * ratio
    c.drawImage(
        str(prepared), x + (w - draw_w) / 2, y + (h - draw_h) / 2,
        draw_w, draw_h, preserveAspectRatio=True, mask="auto"
    )


def crop_atlas_cell(path: Path, columns: int, rows: int, column: int, row: int) -> Path:
    digest = hashlib.sha1(
        f"{path.resolve()}|{path.stat().st_mtime_ns}|{columns}|{rows}|{column}|{row}".encode("utf-8")
    ).hexdigest()[:12]
    output = TMP / f"cell-{path.stem}-{digest}.png"
    if output.exists():
        return output
    with PILImage.open(path) as image:
        cell_w = image.width // columns
        cell_h = image.height // rows
        cell = image.crop((column * cell_w, row * cell_h, (column + 1) * cell_w, (row + 1) * cell_h))
        cell.save(output, "PNG", optimize=True)
    return output


def draw_sprite(c: canvas.Canvas, path: Path, x: float, y: float, size: float) -> None:
    c.drawImage(str(path), x, y, size, size, preserveAspectRatio=True, anchor="c", mask="auto")


def metric_card(
    c: canvas.Canvas,
    x: float,
    y: float,
    w: float,
    h: float,
    value: str,
    label: str,
    note: str = "",
    accent=CYAN,
) -> None:
    rounded_panel(c, x, y, w, h, PANEL, accent, 5)
    c.setFillColor(accent)
    c.rect(x, y + h - 3, w, 3, fill=1, stroke=0)
    para(c, value, x + 10, y + h - 12, w - 20, STYLES["metric"])
    para(c, label, x + 10, y + h - 43, w - 20, STYLES["body_bold"])
    if note:
        para(c, note, x + 10, y + 20, w - 20, STYLES["caption"])


def content_card(
    c: canvas.Canvas,
    x: float,
    y: float,
    w: float,
    h: float,
    eyebrow: str,
    title: str,
    body: str,
    accent=CYAN,
    number: str | None = None,
) -> None:
    rounded_panel(c, x, y, w, h, PANEL, GRID, 5)
    if number:
        c.setFillColor(colors.Color(accent.red, accent.green, accent.blue, alpha=0.12))
        c.circle(x + 18, y + h - 20, 10, fill=1, stroke=0)
        c.setFillColor(accent)
        c.setFont("Portfolio-Bold", 10.5)
        c.drawCentredString(x + 18, y + h - 23, number)
        text_x = x + 35
    else:
        text_x = x + 12
    para(c, esc(eyebrow), text_x, y + h - 12, w - (text_x - x) - 10, STYLES["caption"])
    para(c, esc(title), text_x, y + h - 27, w - (text_x - x) - 10, STYLES["h3"])
    para(c, body, x + 12, y + h - 51, w - 24, STYLES["body_small"])


def draw_arrow(c: canvas.Canvas, x1: float, y1: float, x2: float, y2: float, color=CYAN) -> None:
    c.saveState()
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(1.2)
    c.line(x1, y1, x2, y2)
    angle = 5
    if abs(x2 - x1) >= abs(y2 - y1):
        direction = 1 if x2 >= x1 else -1
        c.line(x2, y2, x2 - direction * angle, y2 + angle * 0.55)
        c.line(x2, y2, x2 - direction * angle, y2 - angle * 0.55)
    else:
        direction = 1 if y2 >= y1 else -1
        c.line(x2, y2, x2 + angle * 0.55, y2 - direction * angle)
        c.line(x2, y2, x2 - angle * 0.55, y2 - direction * angle)
    c.restoreState()


def draw_table(c: canvas.Canvas, rows: list[list[str]], x: float, top: float, widths: list[float]) -> float:
    data = []
    for row_index, row in enumerate(rows):
        row_style = STYLES["table_head"] if row_index == 0 else STYLES["table"]
        data.append([Paragraph(cell, row_style) for cell in row])
    table = Table(data, colWidths=widths, repeatRows=1)
    commands = [
        ("BACKGROUND", (0, 0), (-1, 0), PANEL_2),
        ("LINEBELOW", (0, 0), (-1, 0), 1.15, CYAN),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("TEXTCOLOR", (0, 1), (-1, -1), INK),
    ]
    for index in range(1, len(data)):
        commands.append(("BACKGROUND", (0, index), (-1, index), PANEL if index % 2 else PANEL_3))
        commands.append(("LINEBELOW", (0, index), (-1, index), 0.35, GRID))
    table.setStyle(TableStyle(commands))
    _, height = table.wrap(sum(widths), PH)
    table.drawOn(c, x, top - height)
    return height


def stat_row(c: canvas.Canvas, x: float, top: float, w: float, value: str, label: str, detail: str, accent) -> None:
    c.setFillColor(accent)
    c.setFont("Portfolio-Bold", 29)
    c.drawString(x, top - 23, value)
    para(c, f"<b>{esc(label)}</b><br/><font color='#A6B1BE'>{esc(detail)}</font>", x + 38 * mm, top - 2, w - 38 * mm, STYLES["body"])
    rule(c, x, top - 31, x + w, GRID, 0.5)


def loop_track(c: canvas.Canvas, y: float, number: str, title: str, cadence: str, steps: list[str], accent) -> None:
    h = 35 * mm
    rounded_panel(c, MARGIN_X, y, PW - 2 * MARGIN_X, h, PANEL, GRID, 8, 0.9)
    c.saveState()
    c.setFillColor(accent)
    c.setFillAlpha(0.08)
    c.rect(MARGIN_X, y, 82 * mm, h, fill=1, stroke=0)
    c.restoreState()
    c.setFillColor(accent)
    c.setFont("Portfolio-Bold", 29)
    c.drawString(MARGIN_X + 8, y + 10 * mm, number)
    para(c, f"<b>{esc(title)}</b><br/><font color='#A6B1BE'>{esc(cadence)}</font>", MARGIN_X + 31 * mm, y + 25 * mm, 45 * mm, STYLES["body"])
    start = MARGIN_X + 89 * mm
    end = PW - MARGIN_X - 9
    baseline = y + 17 * mm
    c.setStrokeColor(accent)
    c.setStrokeAlpha(0.72)
    c.setLineWidth(1.2)
    c.line(start, baseline, end, baseline)
    segment = (end - start) / (len(steps) - 1)
    for index, step in enumerate(steps):
        px = start + index * segment
        c.setFillColor(accent)
        c.circle(px, baseline, 4.2, fill=1, stroke=0)
        label_w = 44 * mm
        label_x = min(px - label_w / 2, PW - MARGIN_X - label_w)
        para(c, esc(step), label_x, baseline + 16, label_w, STYLES["center_bold"])


def metric_strip(c: canvas.Canvas, x: float, y: float, w: float, h: float, items: list[tuple[str, str, colors.Color]]) -> None:
    rounded_panel(c, x, y, w, h, PANEL_3, GRID, 7)
    each = w / len(items)
    for index, (value, label, accent) in enumerate(items):
        if index:
            c.setStrokeColor(GRID)
            c.setLineWidth(0.45)
            c.line(x + index * each, y + 7, x + index * each, y + h - 7)
        para(c, f"<font color='{accent.hexval()}'><b>{esc(value)}</b></font><br/><font color='#A6B1BE'>{esc(label)}</font>", x + index * each + 5, y + h - 7, each - 10, STYLES["center"])


def region_tile(c: canvas.Canvas, x: float, y: float, w: float, h: float, item: tuple[str, str, str, str, str, str], accent) -> None:
    number, name, budget, identity, signature, boss = item
    rounded_panel(c, x, y, w, h, PANEL, GRID, CARD_RADIUS)
    c.setFillColor(accent)
    c.rect(x, y + h - 3, w, 3, fill=1, stroke=0)
    c.saveState()
    c.setFillColor(accent)
    c.setFillAlpha(0.08)
    c.setFont("Portfolio-Bold", 42)
    c.drawRightString(x + w - CARD_PAD, y + h - 36, number)
    c.restoreState()
    para(c, f"<b>{esc(name)}</b>", x + CARD_PAD, y + h - CARD_PAD, w - 2 * CARD_PAD, STYLES["h3"])
    para(c, f"<font color='{accent.hexval()}'><b>적 예산 {esc(budget)}</b></font> · {esc(identity)}", x + CARD_PAD, y + h - 38, w - 2 * CARD_PAD, STYLES["body_small"])
    rule(c, x + CARD_PAD, y + h - 70, x + w - CARD_PAD, GRID)
    if signature == "-":
        pattern_copy = "<font color='#8C959F'><b>중간 보스</b></font>  별도 배치 없음"
    else:
        pattern_copy = f"<font color='#8C959F'><b>고유 패턴</b></font>  {esc(signature)}"
    para(c, pattern_copy, x + CARD_PAD, y + h - 79, w - 2 * CARD_PAD, STYLES["body_small"])
    para(c, f"<font color='#8C959F'><b>최종 보스</b></font><br/><font color='#F4F7FA'><b>{esc(boss)}</b></font>", x + CARD_PAD, y + 34, w - 2 * CARD_PAD, STYLES["body_small"])


def slide_01(c: canvas.Canvas) -> None:
    draw_crop(c, ASSETS["cover"], 0, 0, PW, PH, focus=(0.5, 0.5), border=False)
    c.saveState()
    c.setFillColor(colors.black)
    c.setFillAlpha(0.28)
    c.rect(0, 0, PW, PH, fill=1, stroke=0)
    c.restoreState()
    fade_rect(c, 0, 0, PW * 0.72, PH, colors.black, 0.96, True, True)
    c.saveState()
    c.setFillColor(CYAN)
    c.setFillAlpha(0.82)
    c.rect(0, 0, 4, PH, fill=1, stroke=0)
    c.restoreState()
    c.setFillColor(CYAN)
    c.setFont("Portfolio-Bold", 9.5)
    c.drawString(MARGIN_X, PH - 23 * mm, "게임 콘텐츠 기획 · 플레이 가능 프로젝트")
    c.setFillColor(INK)
    c.setFont("Portfolio-Bold", 31)
    c.drawString(MARGIN_X, PH - 55 * mm, "HUMAN OVERRIDE:")
    c.setFillColor(RED)
    c.setFont("Portfolio-Bold", 41)
    c.drawString(MARGIN_X, PH - 75 * mm, "OVERLOAD")
    c.setFillColor(CYAN)
    c.rect(MARGIN_X, PH - 86 * mm, 34 * mm, 2, fill=1, stroke=0)
    para(c, "<b>전투를 해결할수록<br/>다음 공간이 열립니다</b>", MARGIN_X, PH - 97 * mm, 112 * mm, style("cover_claim_v2", 18, 25, INK, True))
    para(c, "전진형 던전 · 보스 학습 · 빌드 성장 설계 사례", MARGIN_X, PH - 123 * mm, 126 * mm, style("cover_desc_v2", 12, 17.5, CYAN_PALE))
    para(c, "<font color='#63ECF7'><b>개인 프로젝트</b></font> · 콘텐츠/시스템 기획 · PC/모바일", MARGIN_X, PH - 136 * mm, 126 * mm, STYLES["body_small"])
    rounded_panel(c, MARGIN_X, 18 * mm, 128 * mm, 29 * mm, PANEL_3, GRID, 7, 0.88)
    para(c, "<b>곽현 · 게임 콘텐츠 기획</b><br/><font color='#A6B1BE'>실행 링크는 지원서의 별도 링크 항목에 기재합니다.</font>", MARGIN_X + 11, 40 * mm, 106 * mm, STYLES["body"])
    c.setFillColor(CYAN)
    c.rect(0, 0, PW, 3, fill=1, stroke=0)


def slide_02(c: canvas.Canvas) -> None:
    frame(c, 2, "프로젝트 개요", "6개 지역의 전투·성장·보상을<br/>하나의 콘텐츠 구조로 설계했습니다")
    left_w = 98 * mm
    image_x = MARGIN_X + 108 * mm
    image_w = PW - MARGIN_X - image_x
    image_window(c, ASSETS["haven"], image_x, 74 * mm, image_w, 86 * mm, (0.58, 0.5), CYAN)
    rounded_panel(c, image_x, 39 * mm, image_w, 28 * mm, PANEL_3, GRID, CARD_RADIUS)
    para(c, "<font color='#6BE4E8'><b>HAVEN-09 · 캠페인 허브</b></font><br/>출격·성장·방어 작전을 선택하고, 지역별 전투 규칙과 보상을 하나의 캠페인 흐름으로 연결했습니다.", image_x + CARD_PAD, 61 * mm, image_w - 2 * CARD_PAD, STYLES["overview_caption"])
    para(c, "기획 의도를 문서와 데이터에 반영하고, 실제 플레이 화면까지 구현했습니다.", MARGIN_X, 160 * mm, left_w, style("overview_intro", 12, 17.5, MUTED, True))
    stat_row(c, MARGIN_X, 137 * mm, left_w, "06", "캠페인 지역", "지역별 적 예산 · 후반 조합", CYAN)
    stat_row(c, MARGIN_X, 106 * mm, left_w, "06", "최종 보스", "독립 패턴 운용 · 3단계 변형", RED)
    stat_row(c, MARGIN_X, 75 * mm, left_w, "3+3", "중간 보스·별도 모드", "중간 보스 3종 · 디펜스 3단계", AMBER)
    rounded_panel(c, MARGIN_X, 18 * mm, left_w, 42 * mm, PANEL_3, GRID)
    para(c, "<font color='#63ECF7'><b>담당 범위</b></font>  목표 경험, 전투 구간, 적·보스 규칙과 수치 가설의 우선순위를 정하고 최종 검수했습니다.", MARGIN_X + CARD_PAD, 54 * mm, left_w - 2 * CARD_PAD, STYLES["body_small"])
    para(c, "<font color='#F5C768'><b>플레이 피드백</b></font>  지인 5명의 반복 플레이에서 확인한 플레이 시간·난이도·무기·캐릭터 균형·보상 문제를 개선 우선순위에 반영했습니다.", MARGIN_X + CARD_PAD, 37 * mm, left_w - 2 * CARD_PAD, STYLES["body_small"])


def slide_role_fit(c: canvas.Canvas) -> None:
    frame(c, 3, "개선 과정", "5명의 플레이 피드백을<br/>문제·가설·변경 항목으로 구조화했습니다")
    full_w = PW - 2 * MARGIN_X
    rounded_panel(c, MARGIN_X, 130 * mm, full_w, 30 * mm, PANEL_3, CYAN, CARD_RADIUS)
    para(
        c,
        "<font color='#63ECF7'><b>의견을 기능 목록으로 옮기지 않았습니다.</b></font>  반복해서 나온 문제를 플레이 시간·난이도, 전투 균형, 반복 동기의 세 축으로 묶고, 원인을 해결하는 규칙과 콘텐츠를 우선순위에 따라 반영했습니다.",
        MARGIN_X + CARD_PAD,
        154 * mm,
        full_w - 2 * CARD_PAD,
        STYLES["body"],
    )
    gap = 7 * mm
    card_w = (full_w - gap) / 2
    cards = [
        ("플레이 시간", "짧은 런", "지역과 공세 규모를 확장하고 중간·최종 보스를 배치해 한 번의 플레이에 학습과 절정을 만들었습니다.", RED),
        ("난이도", "낮은 긴장감", "후반 혼성 적 조합과 역할별 압박, 단계형 보스 패턴을 추가해 대응 판단을 늘렸습니다.", CYAN),
        ("전투 균형", "무기·캐릭터 격차", "선택 풀·스킬·성장 효과·재사용 대기시간을 분리해 각 전투 정체성을 조정했습니다.", AMBER),
        ("반복 동기", "다음 목표 부족", "공통 재화를 파밍하는 독립 디펜스 모드와 초회 보상·영구 강화·교환 구조를 추가했습니다.", LIME),
    ]
    positions = [
        (MARGIN_X, 80 * mm),
        (MARGIN_X + card_w + gap, 80 * mm),
        (MARGIN_X, 31 * mm),
        (MARGIN_X + card_w + gap, 31 * mm),
    ]
    for index, ((eyebrow, title, body, accent), (x, y)) in enumerate(zip(cards, positions)):
        content_card(c, x, y, card_w, 42 * mm, eyebrow, title, body, accent, f"0{index + 1}")


def slide_03(c: canvas.Canvas) -> None:
    frame(c, 4, "경험 목표", "자동 공격으로 판단의 여유를 만들고<br/>핵심 대응은 플레이어가 직접 선택하도록 했습니다")
    image_x = PW - MARGIN_X - 111 * mm
    image_window(c, ASSETS["reward"], image_x, 34 * mm, 111 * mm, 126 * mm, (0.5, 0.5), CYAN)
    left_w = image_x - MARGIN_X - 10 * mm
    para(c, "기본 공격은 자동화하되, <b>이동·조준·대시·수동 스킬·태그·패턴 대응</b>은 플레이어가 직접 결정하도록 역할을 구분했습니다.", MARGIN_X, 160 * mm, left_w, style("goal_claim", 13.2, 19, CYAN_PALE, True))
    items = [
        ("01", "전투하며 전진합니다", "전투를 해결할 때마다 다음 공간이 열립니다. 단순히 전진하는 것만으로는 남은 적을 건너뛸 수 없습니다.", CYAN),
        ("02", "선택이 전투를 바꿉니다", "성장 선택 이후 공격 범위·빈도·동료·화면 장악력이 실제 전투 양상에 반영됩니다.", AMBER),
        ("03", "패턴을 익힐수록 대응이 정교해집니다", "전조와 판정 영역을 일치시키고, 패링·폭탄·그로기 대응을 화력 기회로 전환합니다.", RED),
    ]
    y = 121 * mm
    for number, title, body, accent in items:
        c.setFillColor(accent)
        c.rect(MARGIN_X, y - 25 * mm, 2.2, 25 * mm, fill=1, stroke=0)
        c.saveState()
        c.setFillColor(accent)
        c.setFillAlpha(0.18)
        c.setFont("Portfolio-Bold", 28)
        c.drawString(MARGIN_X + 8, y - 21, number)
        c.restoreState()
        para(c, f"<b>{esc(title)}</b><br/><font color='#A6B1BE'>{esc(body)}</font>", MARGIN_X + 34 * mm, y - 1, left_w - 37 * mm, STYLES["body"])
        y -= 34 * mm
    rounded_panel(c, image_x, 18 * mm, 111 * mm, 16 * mm, PANEL_3, GRID, 6)
    para(c, "<b>설계에서 제외한 요소</b><br/>방치형 성장 · 무한 생존 · 예고 없는 피해", image_x + 12, 31 * mm, 89 * mm, STYLES["caption"])


def slide_04(c: canvas.Canvas) -> None:
    frame(c, 5, "핵심 루프", "순간 판단·지역 런·메타 성장의 세 루프가<br/>다음 선택으로 이어집니다")
    loop_track(c, 119 * mm, "01", "순간 루프", "약 1~15초", ["위협 탐지", "위치·조준", "스킬·회피", "처치·XP"], CYAN)
    loop_track(c, 77 * mm, "02", "지역 런", "약 3~9분 · 가설", ["출격", "교전 밴드", "성장 선택", "보스·결과"], AMBER)
    loop_track(c, 35 * mm, "03", "메타 루프", "여러 런", ["재화 획득", "강화·교환", "해금", "다른 빌드"], MAGENTA)
    return_x = PW - MARGIN_X - 7
    c.setStrokeColor(MUTED_2)
    c.setLineWidth(0.8)
    c.line(return_x, 52 * mm, return_x, 151 * mm)
    c.setFillColor(CYAN)
    c.circle(return_x, 151 * mm, 3.5, fill=1, stroke=0)
    para(c, "다음 출격", return_x - 67, 161 * mm, 60, STYLES["caption"])


def section_01(c: canvas.Canvas) -> None:
    section_divider(
        c,
        5,
        "01",
        "MISSION DESIGN",
        "전투를 해결하고 전진할수록 던전의 다음 장면이 열립니다.",
        "웨이브를 단순 수량이 아니라 위치·적 역할·서사 정지점·보스 학습이 이어지는 하나의 임무 흐름으로 구성했습니다.",
        "PACE  /  ENCOUNTER  /  ENEMY  /  BOSS",
        ASSETS["route"],
        RED,
        (0.55, 0.5),
    )


def slide_05(c: canvas.Canvas) -> None:
    frame(c, 6, "던전 페이싱", "처치와 전진을 함께 요구해<br/>공세 건너뛰기와 종점 대기를 줄였습니다")
    image_w = 163 * mm
    image_window(c, ASSETS["route"], MARGIN_X, 54 * mm, image_w, 106 * mm, (0.52, 0.52), RED)
    right_x = MARGIN_X + image_w + 9 * mm
    right_w = PW - MARGIN_X - right_x
    rounded_panel(c, right_x, 98 * mm, right_w, 62 * mm, PANEL, GRID, 8)
    tag(c, "다음 공세", right_x + CARD_PAD, 145 * mm, RED)
    para(c, "<b>남은 적 0기</b>", right_x + CARD_PAD, 134 * mm, 34 * mm, style("gate_a", 15, 18, CYAN, True))
    para(c, "<b>+</b>", right_x + 40 * mm, 134 * mm, 8 * mm, style("gate_plus", 16, 18, MUTED_2, True, TA_CENTER))
    para(c, "<b>목표 지점 도달</b>", right_x + 50 * mm, 134 * mm, right_w - 60 * mm, style("gate_b", 14.5, 18, AMBER, True))
    rule(c, right_x + CARD_PAD, 116 * mm, right_x + right_w - CARD_PAD, GRID)
    para(c, "두 조건을 모두 충족하면 다음 전투 지점에서 공세가 시작됩니다.", right_x + CARD_PAD, 110 * mm, right_w - 2 * CARD_PAD, STYLES["body"])
    rounded_panel(c, right_x, 54 * mm, right_w, 36 * mm, PANEL_3, GRID, 7)
    para(c, "<font color='#FF5E72'><b>해결한 문제</b></font><br/>전진만으로 전투를 건너뛸 수 없도록 했습니다. 종점 대기를 막고, 최종 공세는 종점 전에 배치했으며, 동시 활성 적은 최대 220기로 제한했습니다.", right_x + CARD_PAD, 83 * mm, right_w - 2 * CARD_PAD, STYLES["body_small"])
    quantities = [8, 14, 22, 34, 52, 79, 120, 180, 220]
    total_w = PW - 2 * MARGIN_X
    base_y = 18 * mm
    step_w = total_w / len(quantities)
    max_value = max(quantities)
    for index, value in enumerate(quantities):
        x = MARGIN_X + index * step_w
        bar_h = 5 * mm + 14 * mm * value / max_value
        c.saveState()
        c.setFillColor(RED if index >= 6 else CYAN)
        c.setFillAlpha(0.22 + index * 0.055)
        c.rect(x + 4, base_y, step_w - 8, bar_h, fill=1, stroke=0)
        c.restoreState()
        para(c, f"<b>{value}</b>", x, base_y + bar_h + 5 * mm, step_w, STYLES["center_bold"])
    para(c, "첫 교전 8기부터 공세 규모를 단계적으로 늘렸으며, 지역 예산을 초과하는 값은 남은 수량에 맞춰 조정했습니다.", MARGIN_X, 50 * mm, total_w, STYLES["caption"])


def slide_06(c: canvas.Canvas) -> None:
    frame(c, 7, "조우 설계", "첫 지역의 적 300기를 9개 구간에 배치해<br/>학습·성장·서사를 구성했습니다")
    c.setFillColor(RED)
    c.setFont("Portfolio-Bold", 42)
    c.drawString(MARGIN_X, 137 * mm, "300")
    para(c, "<b>8 + 14 + 22 + 34 + 52 + 79 + 91 = 300</b><br/><font color='#A6B1BE'>적 300기를 모두 처치하고 MOSS를 확인해야 보스전으로 전환됩니다.</font>", MARGIN_X + 47 * mm, 154 * mm, 178 * mm, style("equation_v2", 13, 19, INK, True))
    nodes = [
        ("출격", "시작", "목표·조작권"), ("도입", "8기", "근접형만"), ("W I", "14기", "첫 성장 가설"),
        ("W II", "18% · 22기", "ROOK 19.2%"), ("W III", "36% · 34기", "혼성 교전"),
        ("W IV", "54% · 52기", "NYX 52.8%"), ("W V", "70% · 79기", "광역 점검"),
        ("FINAL", "82% · 91기", "MOSS 87.2%"), ("전환", "1.2s + 1.6s", "독립 보스전"),
    ]
    left = MARGIN_X + 4
    right = PW - MARGIN_X - 4
    baseline = 86 * mm
    c.setStrokeColor(GRID)
    c.setLineWidth(5)
    c.line(left, baseline, right, baseline)
    c.setStrokeColor(RED)
    c.setLineWidth(1.4)
    c.line(left, baseline, right, baseline)
    segment = (right - left) / (len(nodes) - 1)
    for index, (name, qty, intent) in enumerate(nodes):
        x = left + segment * index
        accent = RED if name == "전환" else AMBER if "MOSS" in intent else CYAN
        c.setFillColor(accent)
        c.circle(x, baseline, 5.2, fill=1, stroke=0)
        top = 119 * mm if index % 2 == 0 else 72 * mm
        c.setStrokeColor(GRID)
        c.setLineWidth(0.5)
        c.line(x, baseline + (5 if index % 2 == 0 else -5), x, top - (22 if index % 2 == 0 else -4))
        para(c, f"<font color='{accent.hexval()}'><b>{esc(name)}</b></font><br/>{esc(qty)}<br/><font color='#8C959F'>{esc(intent)}</font>", x - 15 * mm, top, 30 * mm, STYLES["center"])
    rounded_panel(c, MARGIN_X, 20 * mm, PW - 2 * MARGIN_X, 24 * mm, PANEL_3, GRID, 6)
    para(c, "<b>서사 단서</b>  ROOK → NYX → MOSS를 전투 사이에 배치했습니다. 플레이어가 전진하며 단서를 발견하도록 유도했고, 전투 예산과 단서 확인 조건을 모두 충족해야 보스전으로 이동합니다.", MARGIN_X + CARD_PAD, 38 * mm, PW - 2 * MARGIN_X - 2 * CARD_PAD, STYLES["body"])


def slide_07(c: canvas.Canvas) -> None:
    frame(c, 8, "적 역할", "서로 다른 역할의 적을 순차적으로 조합해<br/>타깃 우선순위를 학습하도록 설계했습니다")
    siege = crop_atlas_cell(ASSETS["siege_atlas"], 6, 4, 0, 0)
    roles = [
        ("01", "자폭 드론", "근접 추적", "0.95초 뒤 폭발", "반경 밖으로 이탈", ASSETS["hunter"], CYAN),
        ("02", "소총수", "중거리 점사", "3~5발 점사 후 재조준", "사선 이탈·우선 처치", ASSETS["suppressor"], AMBER),
        ("03", "저격 플랫폼", "장거리 압박", "판정선과 같은 위치에 경고", "경고선 확인 후 이동", ASSETS["brute"], RED),
        ("04", "공성 워커", "후반 대형 위협", "전투 후반부터 중포 압박", "완성 빌드 화력 점검", siege, MAGENTA),
    ]
    gap_x = 6 * mm
    gap_y = 5 * mm
    card_w = (PW - 2 * MARGIN_X - gap_x) / 2
    card_h = 49 * mm
    for index, (number, name, role, telegraph, response, image_path, accent) in enumerate(roles):
        col = index % 2
        row = index // 2
        x = MARGIN_X + col * (card_w + gap_x)
        y = 111 * mm - row * (card_h + gap_y)
        rounded_panel(c, x, y, card_w, card_h, PANEL if index % 2 == 0 else PANEL_3, GRID, CARD_RADIUS)
        c.saveState()
        c.setFillColor(accent)
        c.setFillAlpha(0.09)
        c.setFont("Portfolio-Bold", 38)
        c.drawString(x + CARD_PAD, y + card_h - 37, number)
        c.restoreState()
        c.setFillColor(PANEL_2)
        c.setStrokeColor(accent)
        c.setLineWidth(0.9)
        sprite_x = x + 27 * mm
        sprite_y = y + card_h / 2
        c.circle(sprite_x, sprite_y, 29, fill=1, stroke=1)
        draw_sprite(c, image_path, sprite_x - 31, sprite_y - 31, 62)
        text_x = x + 52 * mm
        text_w = card_w - 52 * mm - CARD_PAD
        para(c, f"<b>{esc(name)}</b><br/><font color='{accent.hexval()}'>{esc(role)}</font>", text_x, y + card_h - 11, text_w, STYLES["body_bold"])
        rule(c, text_x, y + card_h - 20 * mm, x + card_w - CARD_PAD, GRID)
        para(c, f"<font color='#8C959F'><b>전조</b></font>  {esc(telegraph)}", text_x, y + card_h - 23 * mm, text_w, STYLES["body_small"])
        para(c, f"<font color='#8C959F'><b>대응</b></font>  {esc(response)}", text_x, y + card_h - 36 * mm, text_w, STYLES["body_small"])
    rounded_panel(c, MARGIN_X, 27 * mm, PW - 2 * MARGIN_X, 25 * mm, PANEL_3, GRID, CARD_RADIUS)
    para(c, "<font color='#FF5E72'><b>외곽 권역 고유 패턴</b></font><br/>기본 역할에 중간 보스의 고유 패턴을 더했습니다.", MARGIN_X + CARD_PAD, 46 * mm, 69 * mm, STYLES["body_small"])
    signatures = [("PRESS SLAM", "근접 권위"), ("ARC VOLLEY", "다방향 탄막"), ("CHIMERA RUSH", "돌진 압박")]
    start_x = MARGIN_X + 78 * mm
    each = (PW - MARGIN_X - start_x - 10) / 3
    for index, (skill, role) in enumerate(signatures):
        x = start_x + index * each
        para(c, f"<b>{skill}</b><br/><font color='#A6B1BE'>{role}</font>", x, 46 * mm, each - 9, STYLES["center"])
        if index < 2:
            c.setStrokeColor(GRID)
            c.line(x + each - 5, 32 * mm, x + each - 5, 48 * mm)


def slide_08(c: canvas.Canvas) -> None:
    frame(c, 9, "보스 학습", "보스전은 전조 → 대응 → 화력 기회를 반복하며<br/>패턴을 학습하도록 설계했습니다")
    image_w = 165 * mm
    image_window(c, ASSETS["boss"], MARGIN_X, 62 * mm, image_w, 98 * mm, (0.55, 0.48), RED, "MIRROR TYRANT / PRISM LATTICE")
    right_x = MARGIN_X + image_w + 9 * mm
    right_w = PW - MARGIN_X - right_x
    para(c, "<font color='#FF5E72'><b>파악</b></font>  →  <font color='#F5C768'><b>대응</b></font>  →  <font color='#83F0AE'><b>반격</b></font>", right_x, 158 * mm, right_w, style("boss_loop", 12.5, 18, INK, True))
    stages = [
        ("100~70%", "기본 패턴 소개", "선·원·돌진 경로 파악", CYAN),
        ("70~38%", "2단계 변형", "밀도 상승 · 패링 선택", AMBER),
        ("38~0%", "3단계 변형", "짧은 대응 · 화력 집중", RED),
    ]
    top = 137 * mm
    stage_body = style("boss_stage_body", 10.8, 15.5, MUTED)
    for threshold, title, body, accent in stages:
        c.setFillColor(accent)
        c.rect(right_x, top - 25 * mm, 2.5, 23 * mm, fill=1, stroke=0)
        para(c, f"<font color='{accent.hexval()}'><b>{threshold}</b></font>", right_x + 9, top, 27 * mm, STYLES["body_bold"])
        para(c, f"<b>{esc(title)}</b>", right_x + 33 * mm, top, right_w - 33 * mm, STYLES["body_bold"])
        para(c, esc(body), right_x + 33 * mm, top - 7 * mm, right_w - 33 * mm, stage_body)
        top -= 32 * mm
    metric_strip(c, MARGIN_X, 20 * mm, PW - 2 * MARGIN_X, 26 * mm, [
        ("1.5초", "패턴 인지·입력 여유 가설", CYAN), ("1.8초", "반격 기회 · 피해 2배", GREEN),
        ("55/30/12%", "단계 상승 · 폭탄 2/3/4개", AMBER), ("2.6초", "위치 활용 보상 · 피해 2.5배", RED),
    ])
    para(c, "구현한 수치는 최종 균형값이 아니라 검증 가설이며, 패턴 성공률과 단계별 사망 원인을 다음 플레이테스트에서 확인합니다.", MARGIN_X, 54 * mm, PW - 2 * MARGIN_X, STYLES["caption"])


def section_02(c: canvas.Canvas) -> None:
    section_divider(
        c,
        10,
        "02",
        "BUILD & GROWTH",
        "캐릭터와 무기 선택이 성장 규칙과 수동 스킬 운용을 바꿉니다.",
        "전용 선택 풀, 독립 쿨다운, 메타 재화 교환, 첫 출격 안내를 하나의 선택 구조로 연결했습니다.",
        "CHARACTER  /  SKILL  /  ECONOMY  /  ONBOARDING",
        ASSETS["aegis"],
        AMBER,
        (0.48, 0.5),
    )


def slide_09(c: canvas.Canvas) -> None:
    frame(c, 10, "캐릭터 설계", "캐릭터마다 공격 방식과 성장 조건을 달리해<br/>선택에 따라 전투 판단이 달라지도록 했습니다")
    gap = 6 * mm
    image_w = (PW - 2 * MARGIN_X - gap) / 2
    right_x = MARGIN_X + image_w + gap
    image_window(c, ASSETS["aegis"], MARGIN_X, 91 * mm, image_w, 69 * mm, (0.5, 0.5), CYAN, "AEGIS / RIFLE + SWORD")
    image_window(c, ASSETS["mika"], right_x, 91 * mm, image_w, 69 * mm, (0.5, 0.5), MAGENTA, "MIKA / RINGBLADE")
    rounded_panel(c, MARGIN_X, 28 * mm, image_w, 52 * mm, PANEL, GRID, CARD_RADIUS)
    para(c, "<font color='#63ECF7'><b>AEGIS · 무기 전환형</b></font>", MARGIN_X + CARD_PAD, 72 * mm, image_w - 2 * CARD_PAD, STYLES["h2"])
    para(c, "<b>펄스 소총</b>은 연속 투사체와 지원 화력을 확장합니다.<br/><b>빔 소드</b>는 120° 자동 베기와 검기·돌진 참격으로 근거리 대응을 강화합니다.", MARGIN_X + CARD_PAD, 60 * mm, image_w - 2 * CARD_PAD, STYLES["body_small"])
    rounded_panel(c, right_x, 28 * mm, image_w, 52 * mm, PANEL_3, GRID, CARD_RADIUS)
    para(c, "<font color='#E86ACB'><b>MIKA · 적중 연계형</b></font>", right_x + CARD_PAD, 72 * mm, image_w - 2 * CARD_PAD, STYLES["h2"])
    para(c, "링블레이드가 일정 시간 유지되며 다수의 적을 압박합니다.<br/><b>PRISM TEMPO</b>는 적중할 때마다 재사용 대기시간을 줄이고, <b>HEART GUARD</b>는 수동 스킬 적중을 보호막으로 전환합니다.", right_x + CARD_PAD, 60 * mm, image_w - 2 * CARD_PAD, STYLES["body_small"])


def slide_10(c: canvas.Canvas) -> None:
    frame(c, 11, "스킬 체계", "무기와 태그를 바꿔도 각 캐릭터의<br/>고유한 전투 방식이 유지되도록 설계했습니다")
    rows = [
        ["구분", "AEGIS · 펄스 소총", "AEGIS · 빔 소드", "MIKA · 링블레이드"],
        ["기본 공격", "연속 원거리 투사체", "120° 근거리 자동 베기", "일정 시간 유지되는 프리즘 링"],
        ["선택 풀", "산탄·레일·로켓·지원", "검기·거대 검신·돌진 참격", "소총 전용 보상 제외"],
        ["전용 성장", "투사체·지원 화력", "EDGE RESONANCE · PARRY SHEATH", "PRISM TEMPO · HEART GUARD"],
        ["수동 스킬", "Q/E/F/R 재사용 대기시간 개별 관리", "무기별 스킬 세트 분리", "태그 후에도 캐릭터별 대기시간 유지"],
    ]
    widths = [29 * mm, 76 * mm, 76 * mm, 76 * mm]
    draw_table(c, rows, MARGIN_X, 154 * mm, widths)
    gap = 6 * mm
    card_w = (PW - 2 * MARGIN_X - gap) / 2
    rounded_panel(c, MARGIN_X, 50 * mm, card_w, 40 * mm, PANEL_3, GRID, CARD_RADIUS)
    para(c, "<font color='#63ECF7'><b>재사용 대기시간 분리</b></font>", MARGIN_X + CARD_PAD, 83 * mm, card_w - 2 * CARD_PAD, STYLES["h3"])
    para(c, "태그 전환 후에도 AEGIS와 MIKA의 Q/E/F/R 재사용 대기시간을 각각 보존해, 캐릭터 전환으로 대기 시간을 우회할 수 없도록 했습니다.", MARGIN_X + CARD_PAD, 72 * mm, card_w - 2 * CARD_PAD, STYLES["body_small"])
    right_x = MARGIN_X + card_w + gap
    rounded_panel(c, right_x, 50 * mm, card_w, 40 * mm, PANEL_3, GRID, CARD_RADIUS)
    para(c, "<font color='#E86ACB'><b>전용 성장 연동</b></font>", right_x + CARD_PAD, 83 * mm, card_w - 2 * CARD_PAD, STYLES["h3"])
    para(c, "PRISM TEMPO는 MIKA의 재사용 대기시간만 줄이고, HEART GUARD는 MIKA의 수동 스킬 적중에만 반응하도록 적용 범위를 분리했습니다.", right_x + CARD_PAD, 72 * mm, card_w - 2 * CARD_PAD, STYLES["body_small"])


def slide_11(c: canvas.Canvas) -> None:
    frame(c, 12, "메타 경제", "메타 경제의 공급·소비·교환이<br/>실제 선택으로 이어지도록 설계했습니다")
    image_w = 79 * mm
    image_x = PW - MARGIN_X - image_w
    image_window(c, ASSETS["research"], image_x, 39 * mm, image_w, 121 * mm, (0.5, 0.48), AMBER, "기지 연구")
    left_w = image_x - MARGIN_X - 10 * mm
    para(c, "표의 공급량은 6개 지역과 디펜스 3단계의 초회 보상만 합산했습니다. 디펜스 반복 보상은 공통 재화 파밍 경로이며, 일회성 공급 총량에서는 제외했습니다.", MARGIN_X, 158 * mm, left_w, STYLES["body"])
    resources = [
        ("연구 자료", "137", "49", "+88", CYAN),
        ("장비 부품", "137", "97", "+40", AMBER),
        ("동기화 코어", "34", "48", "-14", MAGENTA),
    ]
    top = 133 * mm
    for name, supply, sink, diff, accent in resources:
        rounded_panel(c, MARGIN_X, top - 22 * mm, left_w, 22 * mm, PANEL, GRID, CARD_RADIUS)
        c.setFillColor(accent)
        c.rect(MARGIN_X, top - 22 * mm, 3, 22 * mm, fill=1, stroke=0)
        para(c, f"<b>{esc(name)}</b>", MARGIN_X + CARD_PAD, top - 8, 34 * mm, STYLES["body_bold"])
        para(c, f"<font color='{accent.hexval()}'><b>{supply}</b></font><br/><font color='#8C959F'>초회 공급</font>", MARGIN_X + 49 * mm, top - 5, 32 * mm, STYLES["center"])
        para(c, f"<b>{sink}</b><br/><font color='#8C959F'>강화 소비</font>", MARGIN_X + 85 * mm, top - 5, 32 * mm, STYLES["center"])
        para(c, f"<b>{diff}</b><br/><font color='#8C959F'>차이</font>", MARGIN_X + 121 * mm, top - 5, 28 * mm, STYLES["center"])
        draw_arrow(c, MARGIN_X + 79 * mm, top - 14 * mm, MARGIN_X + 83 * mm, top - 14 * mm, accent)
        top -= 27 * mm
    rounded_panel(c, MARGIN_X, 20 * mm, left_w, 29 * mm, PANEL_3, GRID, CARD_RADIUS)
    para(c, "<font color='#F5C768'><b>교환 해금</b></font>", MARGIN_X + CARD_PAD, 43 * mm, 36 * mm, STYLES["h3"])
    para(c, "<b>2개 지역</b><br/>연구 6 → 부품 3", MARGIN_X + 49 * mm, 45 * mm, 50 * mm, STYLES["body_small"])
    para(c, "<b>4개 지역</b><br/>연구 12 + 부품 8 → 코어 1", MARGIN_X + 103 * mm, 45 * mm, left_w - 109 * mm, STYLES["body_small"])


def slide_12(c: canvas.Canvas) -> None:
    frame(c, 13, "초반 경험", "첫 출격과 첫 승리 이후에<br/>막히기 쉬운 지점을 우선 개선했습니다")
    image_w = 132 * mm
    image_window(c, ASSETS["combat_guide"], MARGIN_X, 86 * mm, image_w, 74 * mm, (0.5, 0.5), AMBER)
    rounded_panel(c, MARGIN_X, 51 * mm, image_w, 27 * mm, PANEL_3, GRID, CARD_RADIUS)
    para(c, "<font color='#F4C55C'><b>상황별 안내 · 첫 출격</b></font><br/>팝업·전투 HUD·기본 조준점을 함께 보여 전체 흐름을 한눈에 확인할 수 있습니다.", MARGIN_X + CARD_PAD, 72 * mm, image_w - 2 * CARD_PAD, STYLES["overview_caption"])
    right_x = MARGIN_X + image_w + 13 * mm
    right_w = PW - MARGIN_X - right_x
    line_x = right_x + 9
    c.setStrokeColor(GRID)
    c.setLineWidth(1.2)
    c.line(line_x, 52 * mm, line_x, 146 * mm)
    flows = [
        ("01", "출격 전", "장비를 확인한 뒤 출격하도록 했습니다.", "메뉴 선택 뒤에도 전투 조준이 자연스럽게 이어지도록 기본 조준점을 오른쪽에 배치했습니다.", CYAN, 138 * mm),
        ("02", "첫 전투", "핵심 조작 두 가지만 먼저 안내합니다.", "배치 서사 뒤 Q/E/F/R 안내를 상황별로 보여주고, 종료 뒤 전투가 다시 시작되지 않도록 했습니다.", AMBER, 103 * mm),
        ("03", "첫 승리", "결과 → 합류 → 귀환 순서로 안내합니다.", "후속 장면을 저장해 새로고침 뒤에도 1회성 장면을 이어서 볼 수 있도록 했습니다.", MAGENTA, 68 * mm),
    ]
    for number, phase, title, body, accent, y in flows:
        c.setFillColor(accent)
        c.circle(line_x, y, 5.2, fill=1, stroke=0)
        tag(c, f"{number} {phase}", right_x + 18, y + 11, accent)
        para(c, f"<b>{esc(title)}</b><br/><font color='#A6B1BE'>{esc(body)}</font>", right_x + 18, y + 5, right_w - 18, STYLES["body"])
    rounded_panel(c, right_x, 22 * mm, right_w, 26 * mm, PANEL_3, GRID, CARD_RADIUS)
    para(c, "<font color='#F5C768'><b>모바일 결과 화면</b></font><br/>320×700에서도 결과 근거·보상·주요 버튼을 내부 스크롤로 확인할 수 있도록 했습니다.", right_x + CARD_PAD, 42 * mm, right_w - 2 * CARD_PAD, STYLES["body_small"])


def slide_13(c: canvas.Canvas) -> None:
    frame(c, 14, "지역 설계", "공통 전투 구조 위에 예산·적 조합·보스를 달리해<br/>6개 지역의 플레이 리듬을 구분했습니다")
    regions = [
        ("01", "WRONG ENGINE", "300", "흔적·학습", "-", "THE WRONG ENGINE"),
        ("02", "GLASS DUNE", "1,000", "저격 60%", "-", "MIRROR TYRANT"),
        ("03", "ABYSSAL", "1,000", "자폭 70%", "-", "DROWNED ORACLE"),
        ("04", "NEON", "1,100", "외곽 적 혼합", "PRESS SLAM", "FORGE COLOSSUS"),
        ("05", "STORM", "1,150", "외곽 적 혼합", "ARC VOLLEY", "TEMPEST WYRM"),
        ("06", "GENE", "1,200", "외곽 적 혼합", "CHIMERA RUSH", "PALE ARCHON"),
    ]
    gap_x = 5 * mm
    gap_y = 8 * mm
    tile_w = (PW - 2 * MARGIN_X - 2 * gap_x) / 3
    tile_h = 54 * mm
    accents = [CYAN, CYAN, CYAN, AMBER, RED, MAGENTA]
    for index, item in enumerate(regions):
        col = index % 3
        row = index // 3
        x = MARGIN_X + col * (tile_w + gap_x)
        y = 103 * mm - row * (tile_h + gap_y)
        region_tile(c, x, y, tile_w, tile_h, item, accents[index])


def slide_14(c: canvas.Canvas) -> None:
    frame(c, 15, "모드 확장", "플레이 방식은 분리하고, 획득 재화는<br/>하나의 메타 성장으로 연결했습니다")
    gap = 7 * mm
    image_w = (PW - 2 * MARGIN_X - gap) / 2
    right_x = MARGIN_X + image_w + gap
    image_window(c, ASSETS["regions"], MARGIN_X, 95 * mm, image_w, 65 * mm, (0.5, 0.52), AMBER, "캠페인 전진 원정")
    image_window(c, ASSETS["defense"], right_x, 95 * mm, image_w, 65 * mm, (0.5, 0.52), MAGENTA, "독립 디펜스 모드")
    card_gap = 5 * mm
    card_w = (PW - 2 * MARGIN_X - 2 * card_gap) / 3
    cards = [
        ("캠페인", "전진 원정", "처치·전진 조건과 지역별 조우, 보스 학습을 중심으로 한 캠페인 모드입니다.", CYAN),
        ("지역", "지역별 고유 요소", "적 조합과 중간·최종 보스 패턴을 지역 데이터로 분리합니다.", AMBER),
        ("별도 모드", "디펜스 작전", "설치·방어 규칙을 사용하는 독립 게임 모드입니다. 3개 단계의 초회·반복 보상으로 공통 재화를 파밍합니다.", MAGENTA),
    ]
    for index, (eyebrow, title, body, accent) in enumerate(cards):
        x = MARGIN_X + index * (card_w + card_gap)
        content_card(c, x, 37 * mm, card_w, 40 * mm, eyebrow, title, body, accent, f"0{index + 1}")


def section_03(c: canvas.Canvas) -> None:
    section_divider(
        c,
        17,
        "03",
        "PROOF & NEXT",
        "관찰한 문제와 설계 결정을 분리하고, 반복 개선의 근거부터 확인합니다.",
        "5명의 정성 피드백을 개선 우선순위로 변환하고, 확인한 내용과 남은 검증을 구분했습니다.",
        "PLAYTEST  /  ITERATION  /  OWNERSHIP",
        ASSETS["boss"],
        LIME,
        (0.56, 0.48),
    )


def slide_15(c: canvas.Canvas) -> None:
    frame(c, 16, "플레이테스트", "5명의 반복 플레이 피드백을<br/>관찰·설계 결정·다음 검증으로 연결했습니다")
    cases = [
        ("01", "시간·난이도", "플레이가 짧고 쉬워 후반까지 긴장이 이어지지 않았습니다.", "지역·공세 규모와 중간·최종 보스, 후반 혼성 적 조합을 추가했습니다. 다음에는 클리어 시간과 사망 구간을 확인합니다.", RED),
        ("02", "무기·캐릭터 균형", "무기·캐릭터별 체감 성능 차이가 커 선택의 신뢰도가 낮았습니다.", "선택 풀·스킬·성장 효과·재사용 대기시간을 분리했습니다. 다음에는 무기·캐릭터별 클리어 시간과 피해 기여도를 비교합니다.", AMBER),
        ("03", "반복 동기·보상", "전투 뒤 이어갈 목표와 원하는 재화의 선택지가 부족했습니다.", "공통 재화를 파밍하는 독립 디펜스 모드와 초회 보상·영구 강화·교환을 추가했습니다. 다음에는 모드 선택률과 재화 흐름을 확인합니다.", MAGENTA),
    ]
    row_h = 31 * mm
    row_ys = [115 * mm, 79 * mm, 43 * mm]
    for index, (number, title, feedback, improvement, accent) in enumerate(cases):
        y = row_ys[index]
        w = PW - 2 * MARGIN_X
        rounded_panel(c, MARGIN_X, y, w, row_h, PANEL if index % 2 == 0 else PANEL_3, GRID, CARD_RADIUS)
        c.setFillColor(accent)
        c.rect(MARGIN_X, y, 3, row_h, fill=1, stroke=0)
        c.setFont("Portfolio-Bold", 28)
        c.drawString(MARGIN_X + CARD_PAD, y + 10 * mm, number)
        para(c, f"<font color='{accent.hexval()}'><b>{esc(title)}</b></font>", MARGIN_X + 27 * mm, y + 21 * mm, 36 * mm, STYLES["h3"])
        feedback_x = MARGIN_X + 67 * mm
        fix_x = MARGIN_X + 147 * mm
        c.setStrokeColor(GRID)
        c.setLineWidth(0.6)
        c.line(feedback_x - 4 * mm, y + 5 * mm, feedback_x - 4 * mm, y + row_h - 5 * mm)
        c.line(fix_x - 4 * mm, y + 5 * mm, fix_x - 4 * mm, y + row_h - 5 * mm)
        para(c, f"<font color='#FF8190'><b>받은 피드백</b></font><br/>{esc(feedback)}", feedback_x, y + 23 * mm, 72 * mm, STYLES["body_small"])
        para(c, f"<font color='#83F0AE'><b>반영한 개선</b></font><br/>{esc(improvement)}", fix_x, y + 23 * mm, w - 147 * mm - CARD_PAD, STYLES["body_small"])
    rounded_panel(c, MARGIN_X, 16 * mm, PW - 2 * MARGIN_X, 23 * mm, PANEL_3, LIME, CARD_RADIUS)
    para(c, "<font color='#B9F66B'><b>검증 범위</b></font>  지인·친구 5명이 반복적으로 참여한 정성 피드백입니다. 문제 발견과 개선 방향만 근거로 사용하며, 정량 성과나 최종 균형 달성은 주장하지 않습니다.", MARGIN_X + CARD_PAD, 34 * mm, PW - 2 * MARGIN_X - 2 * CARD_PAD, STYLES["body"])


def slide_16(c: canvas.Canvas) -> None:
    frame(c, 17, "검증과 기여", "무엇을 확인했고 누가 결정했는지<br/>산출물 단위로 구분했습니다")
    left_w = 144 * mm
    right_x = MARGIN_X + left_w + 8 * mm
    right_w = PW - MARGIN_X - right_x
    para(c, "<font color='#B9F66B'><b>반복 개선 근거</b></font>", MARGIN_X, 154 * mm, left_w, STYLES["h2"])
    para(c, "5명의 반복 플레이에서 발견한 문제를 세 가지 개선 축과 두 가지 게임 모드로 연결했습니다.", MARGIN_X, 141 * mm, left_w, STYLES["body"])
    metrics = [
        ("5명", "반복 플레이 참여자", GREEN),
        ("5개", "핵심 피드백 주제", RED),
        ("3축", "개선 우선순위", CYAN),
        ("2종", "플레이 가능한 게임 모드", MAGENTA),
    ]
    metric_w = (left_w - 5 * mm) / 2
    for index, (value, label, accent) in enumerate(metrics):
        col = index % 2
        row = index // 2
        x = MARGIN_X + col * (metric_w + 5 * mm)
        y = 103 * mm - row * 30 * mm
        metric_card(c, x, y, metric_w, 24 * mm, value, label, "", accent)
    rounded_panel(c, MARGIN_X, 24 * mm, left_w, 41 * mm, PANEL_3, GRID, CARD_RADIUS)
    para(c, "<font color='#B9F66B'><b>확인한 내용과 남은 검증</b></font>", MARGIN_X + CARD_PAD, 59 * mm, left_w - 2 * CARD_PAD, STYLES["h3"])
    para(c, "확인한 내용은 피드백에서 발견한 문제를 실제 콘텐츠 규칙으로 변경하고 플레이 가능한 결과물에 반영했다는 점입니다. 완료율·보스전 시간·잔존율 같은 정량 성과는 주장하지 않습니다. 다음에는 이해관계가 없는 참여자와 구조화된 기록으로 검증하겠습니다.", MARGIN_X + CARD_PAD, 50 * mm, left_w - 2 * CARD_PAD, STYLES["body_small"])
    rounded_panel(c, right_x, 80 * mm, right_w, 80 * mm, PANEL, GRID)
    para(c, "<b>산출물별 책임</b>", right_x + CARD_PAD, 151 * mm, right_w - 2 * CARD_PAD, STYLES["h2"])
    responsibilities = [
        ("본인", "테스트 질문과 문제 정의, 우선순위, 최종 수치·규칙과 반영 여부를 결정했습니다.", CYAN, 132 * mm),
        ("참여자 5명", "난이도·균형·보상에 대한 체감 의견을 제공했으며 기획 결정에는 참여하지 않았습니다.", GREEN, 111 * mm),
        ("AI", "문서 구성과 구현·검사 작업을 보조했으며 최종 기획 판단은 맡지 않았습니다.", AMBER, 90 * mm),
    ]
    for label, body, accent, y in responsibilities:
        para(c, f"<font color='{accent.hexval()}'><b>{esc(label)}</b></font>  {esc(body)}", right_x + CARD_PAD, y, right_w - 2 * CARD_PAD, STYLES["body_small"])
    rounded_panel(c, right_x, 24 * mm, right_w, 48 * mm, PANEL_3, LIME)
    para(c, "<font color='#B9F66B'><b>핵심 설계 결과</b></font>", right_x + CARD_PAD, 65 * mm, right_w - 2 * CARD_PAD, STYLES["h3"])
    para(c, "짧고 쉬운 플레이는 단계형 조우로, 전투 격차는 독립 전투 체계로, 다음 목표 부족은 공통 재화 파밍이 가능한 디펜스 모드로 해결했습니다.", right_x + CARD_PAD, 55 * mm, right_w - 2 * CARD_PAD, style("closing_v4", 12, 18, INK, True))
    para(c, "실행 링크는 지원서의 별도 링크 항목에 기재합니다.", right_x + CARD_PAD, 35 * mm, right_w - 2 * CARD_PAD, STYLES["body_small"])


SLIDES = [
    slide_01,
    slide_02,
    slide_role_fit,
    slide_03,
    slide_04,
    slide_05,
    slide_06,
    slide_07,
    slide_08,
    slide_09,
    slide_10,
    slide_11,
    slide_12,
    slide_13,
    slide_14,
    slide_15,
    slide_16,
]


REQUIRED_TEXT = (
    "게임 콘텐츠 기획",
    "처치와 전진을 함께 요구해",
    "8 + 14 + 22 + 34 + 52 + 79 + 91 = 300",
    "PRISM TEMPO",
    "지인 5명",
    "공통 재화 파밍",
    "독립 게임 모드",
    "정성 피드백",
    "정량 성과는 주장하지 않습니다",
    "최종 기획 판단은 맡지 않았습니다",
    "실행 링크는 지원서의 별도 링크 항목",
)

BANNED_TEXT = (
    "http://",
    "https://",
    "khyun97",
    "kwakhyun",
    "Suno",
    "Private GitHub",
    "269/269",
    "165/165",
    "집중 회귀 테스트",
    "TypeScript·정적 분석",
    "지인 3명",
    "3명의 반복",
    "보조 콘텐츠",
)


def build() -> None:
    register_fonts()
    for path in ASSETS.values():
        if not path.exists():
            raise FileNotFoundError(path)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(
        str(OUTPUT),
        pagesize=PAGE,
        pageCompression=1,
        initialFontName="Portfolio-Regular",
        initialFontSize=12,
        initialLeading=14,
    )
    pdf.setTitle("HUMAN OVERRIDE: OVERLOAD - 게임 콘텐츠 기획 포트폴리오")
    pdf.setAuthor("곽현")
    pdf.setSubject("네오플 게임 콘텐츠 기획 직무 지원 포트폴리오")
    pdf.setCreator("ReportLab")
    for index, slide in enumerate(SLIDES):
        slide(pdf)
        if index < len(SLIDES) - 1:
            pdf.showPage()
    pdf.save()

    reader = PdfReader(str(OUTPUT))
    if reader.is_encrypted:
        raise ValueError("Portfolio PDF must not be encrypted")
    root = reader.trailer["/Root"].get_object()
    names = root.get("/Names")
    names = names.get_object() if names else None
    if root.get("/JavaScript") or (names and names.get("/JavaScript")):
        raise ValueError("Portfolio PDF must not contain JavaScript")
    if root.get("/AF") or (names and names.get("/EmbeddedFiles")):
        raise ValueError("Portfolio PDF must not contain embedded files")
    if any(page.get("/Annots") for page in reader.pages):
        raise ValueError("Portfolio PDF must not contain link or media annotations")
    if len(reader.pages) != len(SLIDES):
        raise ValueError(f"Expected {len(SLIDES)} pages, got {len(reader.pages)}")
    embedded_korean_fonts: set[str] = set()
    unembedded_korean_fonts: set[str] = set()
    for page in reader.pages:
        resources = page.get("/Resources")
        resources = resources.get_object() if resources else None
        font_map = resources.get("/Font") if resources else None
        font_map = font_map.get_object() if font_map else {}
        for font_ref in font_map.values():
            font = font_ref.get_object()
            base_font = str(font.get("/BaseFont", ""))
            if not any(name in base_font for name in ("MalgunGothic", "NotoSansKR")):
                continue
            descriptor = font.get("/FontDescriptor")
            descriptor = descriptor.get_object() if descriptor else None
            embedded = descriptor and any(
                descriptor.get(key) for key in ("/FontFile", "/FontFile2", "/FontFile3")
            )
            target = embedded_korean_fonts if embedded else unembedded_korean_fonts
            target.add(base_font)
    if not embedded_korean_fonts or unembedded_korean_fonts:
        raise ValueError(
            f"Korean fonts must be embedded; missing={sorted(unembedded_korean_fonts)}"
        )
    page_text = [(page.extract_text() or "").strip() for page in reader.pages]
    if any(len(text) < 80 for text in page_text):
        raise ValueError("A portfolio page is unexpectedly sparse or blank")
    extracted = "\n".join(page_text)
    compact = re.sub(r"\s+", "", extracted)
    for required in REQUIRED_TEXT:
        if re.sub(r"\s+", "", required) not in compact:
            raise ValueError(f"Required portfolio text missing: {required}")
    for banned in BANNED_TEXT:
        if banned.lower() in extracted.lower():
            raise ValueError(f"Banned portfolio text present: {banned}")
    if OUTPUT.stat().st_size >= 100 * 1024 * 1024:
        raise ValueError("Portfolio exceeds the 100MB application limit")
    print(f"{OUTPUT} | pages={len(reader.pages)} | bytes={OUTPUT.stat().st_size}")


if __name__ == "__main__":
    build()

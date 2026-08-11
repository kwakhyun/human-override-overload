#!/usr/bin/env python3
"""Build the two Korean HUMAN OVERRIDE project PDFs from Markdown sources."""

from __future__ import annotations

import argparse
import html
import re
from pathlib import Path

from PIL import Image as PILImage
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    Image,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
    XPreformatted,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "docs" / "project"
OUTPUT_DIR = ROOT / "output" / "pdf"
TMP_DIR = ROOT / "tmp" / "pdfs"
FONT_REGULAR = Path(r"C:\Windows\Fonts\malgun.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\malgunbd.ttf")

INK = colors.HexColor("#0B1820")
MUTED = colors.HexColor("#566B76")
CYAN = colors.HexColor("#00A8C5")
CYAN_DARK = colors.HexColor("#08788D")
CYAN_PALE = colors.HexColor("#E9F8FA")
RED = colors.HexColor("#E83B5B")
AMBER = colors.HexColor("#B87812")
PAPER = colors.HexColor("#F8FBFC")
GRID = colors.HexColor("#C9D9DE")


DOCS = (
    {
        "source": SOURCE_DIR / "game-guide-ko.md",
        "output": OUTPUT_DIR / "HUMAN_OVERRIDE_OVERLOAD_Game_Guide_KO.pdf",
        "kind": "GAME GUIDE",
        "required": ("HUMAN OVERRIDE: OVERLOAD", "플레이 흐름", "조작 방법", "실행 방법"),
    },
    {
        "source": SOURCE_DIR / "ai-usage-report-ko.md",
        "output": OUTPUT_DIR / "HUMAN_OVERRIDE_OVERLOAD_AI_Technical_Report_KO.pdf",
        "kind": "AI TECHNICAL REPORT",
        "required": ("OpenAI Codex Desktop", "Grok", "Suno AI", "Google Gemini", "실제 프롬프트"),
    },
)


def register_fonts() -> None:
    if not FONT_REGULAR.exists() or not FONT_BOLD.exists():
        raise FileNotFoundError("Malgun Gothic fonts are required to render Korean text")
    pdfmetrics.registerFont(TTFont("Malgun", str(FONT_REGULAR)))
    pdfmetrics.registerFont(TTFont("Malgun-Bold", str(FONT_BOLD)))
    pdfmetrics.registerFontFamily("Malgun", normal="Malgun", bold="Malgun-Bold")


def styles() -> dict[str, ParagraphStyle]:
    sample = getSampleStyleSheet()
    return {
        "cover_kicker": ParagraphStyle(
            "cover_kicker", parent=sample["Normal"], fontName="Malgun-Bold", fontSize=9.5,
            leading=13, textColor=CYAN_DARK, tracking=0.6, spaceAfter=4,
        ),
        "cover_title": ParagraphStyle(
            "cover_title", parent=sample["Title"], fontName="Malgun-Bold", fontSize=29,
            leading=34, textColor=INK, alignment=TA_LEFT, spaceAfter=4,
        ),
        "cover_subtitle": ParagraphStyle(
            "cover_subtitle", parent=sample["Normal"], fontName="Malgun-Bold", fontSize=14,
            leading=20, textColor=MUTED, spaceAfter=11,
        ),
        "cover_meta": ParagraphStyle(
            "cover_meta", parent=sample["Normal"], fontName="Malgun", fontSize=9,
            leading=14, textColor=MUTED, spaceAfter=2,
        ),
        "h1": ParagraphStyle(
            "h1", parent=sample["Heading1"], fontName="Malgun-Bold", fontSize=20,
            leading=27, textColor=INK, spaceBefore=3, spaceAfter=10, keepWithNext=True,
        ),
        "h2": ParagraphStyle(
            "h2", parent=sample["Heading2"], fontName="Malgun-Bold", fontSize=15,
            leading=21, textColor=CYAN_DARK, spaceBefore=11, spaceAfter=7, keepWithNext=True,
        ),
        "h3": ParagraphStyle(
            "h3", parent=sample["Heading3"], fontName="Malgun-Bold", fontSize=11.5,
            leading=17, textColor=INK, spaceBefore=8, spaceAfter=4, keepWithNext=True,
        ),
        "body": ParagraphStyle(
            "body", parent=sample["BodyText"], fontName="Malgun", fontSize=9.25,
            leading=15.2, textColor=INK, alignment=TA_LEFT, wordWrap="CJK", spaceAfter=5.3,
            splitLongWords=True,
        ),
        "bullet": ParagraphStyle(
            "bullet", parent=sample["BodyText"], fontName="Malgun", fontSize=9.1,
            leading=14.6, textColor=INK, leftIndent=12, firstLineIndent=-7,
            bulletIndent=2, wordWrap="CJK", spaceAfter=2.7,
        ),
        "quote": ParagraphStyle(
            "quote", parent=sample["BodyText"], fontName="Malgun", fontSize=9.2,
            leading=15.2, textColor=colors.HexColor("#183842"), leftIndent=14,
            rightIndent=7, borderColor=CYAN, borderWidth=1.8, borderPadding=(7, 10, 7, 10),
            backColor=CYAN_PALE, wordWrap="CJK", spaceBefore=3, spaceAfter=8,
        ),
        "caption": ParagraphStyle(
            "caption", parent=sample["Normal"], fontName="Malgun", fontSize=7.8,
            leading=11.5, textColor=MUTED, alignment=TA_CENTER, spaceBefore=3, spaceAfter=9,
        ),
        "code": ParagraphStyle(
            "code", parent=sample["Code"], fontName="Courier", fontSize=7.6,
            leading=11, textColor=colors.HexColor("#D8F7FA"), backColor=INK,
            borderPadding=8, leftIndent=4, rightIndent=4, spaceBefore=3, spaceAfter=8,
        ),
        "table": ParagraphStyle(
            "table", parent=sample["BodyText"], fontName="Malgun", fontSize=7.9,
            leading=11.5, textColor=INK, wordWrap="CJK",
        ),
        "table_head": ParagraphStyle(
            "table_head", parent=sample["BodyText"], fontName="Malgun-Bold", fontSize=8,
            leading=11.5, textColor=colors.white, wordWrap="CJK",
        ),
    }


def inline_markup(text: str) -> str:
    tokens: list[str] = []

    def hold(value: str) -> str:
        tokens.append(value)
        return f"@@TOKEN{len(tokens) - 1}@@"

    text = re.sub(
        r"\[([^\]]+)\]\((https?://[^)]+)\)",
        lambda m: hold(f'<link href="{html.escape(m.group(2), quote=True)}" color="#08788D"><u>{html.escape(m.group(1))}</u></link>'),
        text,
    )
    text = re.sub(r"`([^`]+)`", lambda m: hold(f'<font name="Courier">{html.escape(m.group(1))}</font>'), text)
    escaped = html.escape(text)
    escaped = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", escaped)
    for index, token in enumerate(tokens):
        escaped = escaped.replace(f"@@TOKEN{index}@@", token)
    return escaped


def parse_cover(lines: list[str], sheet: dict[str, ParagraphStyle], kind: str) -> tuple[list, int]:
    title = next((line[2:].strip() for line in lines if line.startswith("# ")), "HUMAN OVERRIDE: OVERLOAD")
    subtitle = next((line[3:].strip() for line in lines if line.startswith("## ")), "")
    divider = lines.index("[PAGEBREAK]") if "[PAGEBREAK]" in lines else min(12, len(lines))
    meta_lines = [line.strip() for line in lines[:divider] if line.strip() and not line.startswith("#") and not line.startswith(">")]
    quote = next((line[1:].strip() for line in lines[:divider] if line.startswith(">")), "")

    cover_image = ROOT / "public" / "assets" / "overload" / "intro" / "start-screen-key-art.webp"
    flow: list = [Spacer(1, 3 * mm)]
    if cover_image.exists():
        flow.extend([scaled_image(cover_image, 174 * mm, 98 * mm), Spacer(1, 7 * mm)])
    flow.append(Paragraph(kind, sheet["cover_kicker"]))
    title_markup = inline_markup(title).replace("OVERLOAD", '<font color="#E83B5B">OVERLOAD</font>')
    flow.append(Paragraph(title_markup, sheet["cover_title"]))
    flow.append(Paragraph(inline_markup(subtitle), sheet["cover_subtitle"]))
    flow.append(HRFlowable(width="100%", thickness=1.2, color=CYAN, spaceBefore=1, spaceAfter=7))
    if quote:
        flow.append(Paragraph(inline_markup(quote), sheet["quote"]))
    for line in meta_lines:
        flow.append(Paragraph(inline_markup(line.replace("  ", " · ")), sheet["cover_meta"]))
    flow.append(PageBreak())
    return flow, divider + 1


def scaled_image(path: Path, max_width: float, max_height: float) -> Image:
    with PILImage.open(path) as img:
        width, height = img.size
    ratio = min(max_width / width, max_height / height)
    return Image(str(path), width=width * ratio, height=height * ratio)


def table_flow(rows: list[list[str]], sheet: dict[str, ParagraphStyle]) -> Table:
    if not rows:
        raise ValueError("table requires at least one row")
    columns = max(len(row) for row in rows)
    normalized = [row + [""] * (columns - len(row)) for row in rows]
    data = []
    for row_index, row in enumerate(normalized):
        style = sheet["table_head"] if row_index == 0 else sheet["table"]
        data.append([Paragraph(inline_markup(cell.strip()), style) for cell in row])
    width = 174 * mm
    col_widths = [width / columns] * columns
    table = Table(data, colWidths=col_widths, repeatRows=1, hAlign="LEFT")
    commands = [
        ("BACKGROUND", (0, 0), (-1, 0), CYAN_DARK),
        ("GRID", (0, 0), (-1, -1), 0.45, GRID),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    for index in range(1, len(data)):
        commands.append(("BACKGROUND", (0, index), (-1, index), PAPER if index % 2 else colors.white))
    table.setStyle(TableStyle(commands))
    return table


def markdown_flows(source: Path, sheet: dict[str, ParagraphStyle], kind: str) -> list:
    lines = source.read_text(encoding="utf-8").splitlines()
    flows, index = parse_cover(lines, sheet, kind)
    paragraph: list[str] = []
    code: list[str] | None = None

    def flush_paragraph() -> None:
        if paragraph:
            flows.append(Paragraph(inline_markup(" ".join(part.strip() for part in paragraph)), sheet["body"]))
            paragraph.clear()

    while index < len(lines):
        line = lines[index]
        stripped = line.strip()
        if code is not None:
            if stripped.startswith("```"):
                flows.append(XPreformatted("\n".join(code), sheet["code"]))
                code = None
            else:
                code.append(line)
            index += 1
            continue
        if stripped.startswith("```"):
            flush_paragraph()
            code = []
            index += 1
            continue
        if not stripped:
            flush_paragraph()
            index += 1
            continue
        if stripped == "[PAGEBREAK]":
            flush_paragraph()
            flows.append(PageBreak())
            index += 1
            continue
        image_match = re.match(r"!\[([^\]]*)\]\(([^)]+)\)", stripped)
        if image_match:
            flush_paragraph()
            image_path = (source.parent / image_match.group(2)).resolve()
            if not image_path.exists():
                raise FileNotFoundError(f"missing document image: {image_path}")
            flows.append(KeepTogether([
                scaled_image(image_path, 174 * mm, 101 * mm),
                Paragraph(inline_markup(image_match.group(1)), sheet["caption"]),
            ]))
            index += 1
            continue
        if stripped.startswith("|" ) and stripped.endswith("|"):
            flush_paragraph()
            raw_rows: list[list[str]] = []
            while index < len(lines):
                current = lines[index].strip()
                if not (current.startswith("|") and current.endswith("|")):
                    break
                cells = [cell.strip() for cell in current.strip("|").split("|")]
                if not all(re.fullmatch(r":?-{3,}:?", cell) for cell in cells):
                    raw_rows.append(cells)
                index += 1
            flows.extend([table_flow(raw_rows, sheet), Spacer(1, 4 * mm)])
            continue
        if stripped.startswith("### "):
            flush_paragraph()
            flows.append(Paragraph(inline_markup(stripped[4:]), sheet["h3"]))
            index += 1
            continue
        if stripped.startswith("## "):
            flush_paragraph()
            flows.append(Paragraph(inline_markup(stripped[3:]), sheet["h2"]))
            index += 1
            continue
        if stripped.startswith("# "):
            flush_paragraph()
            flows.append(Paragraph(inline_markup(stripped[2:]), sheet["h1"]))
            index += 1
            continue
        if stripped.startswith(">"):
            flush_paragraph()
            quote_lines = []
            while index < len(lines) and lines[index].strip().startswith(">"):
                quote_lines.append(lines[index].strip()[1:].strip())
                index += 1
            flows.append(Paragraph(inline_markup(" ".join(quote_lines)), sheet["quote"]))
            continue
        bullet = re.match(r"^[-*]\s+(.+)$", stripped)
        numbered = re.match(r"^(\d+)\.\s+(.+)$", stripped)
        if bullet or numbered:
            flush_paragraph()
            marker = "•" if bullet else f"{numbered.group(1)}."
            content = bullet.group(1) if bullet else numbered.group(2)
            flows.append(Paragraph(inline_markup(content), sheet["bullet"], bulletText=marker))
            index += 1
            continue
        paragraph.append(stripped)
        index += 1
    flush_paragraph()
    if code is not None:
        flows.append(XPreformatted("\n".join(code), sheet["code"]))
    return flows


def draw_page(canvas, doc) -> None:
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, width, height, fill=1, stroke=0)
    canvas.setFillColor(INK)
    canvas.rect(0, height - 8 * mm, width, 8 * mm, fill=1, stroke=0)
    canvas.setFillColor(CYAN)
    canvas.rect(0, height - 8.7 * mm, width, 0.7 * mm, fill=1, stroke=0)
    canvas.setFont("Malgun-Bold", 6.8)
    canvas.setFillColor(colors.HexColor("#D7F5F8"))
    canvas.drawString(18 * mm, height - 5.3 * mm, "HUMAN OVERRIDE: OVERLOAD · PROJECT DOCUMENTATION")
    canvas.setFont("Malgun", 7.2)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(width - 18 * mm, 10 * mm, f"{doc.page}")
    canvas.setStrokeColor(GRID)
    canvas.setLineWidth(0.4)
    canvas.line(18 * mm, 14 * mm, width - 18 * mm, 14 * mm)
    canvas.restoreState()


def build_one(config: dict, sheet: dict[str, ParagraphStyle]) -> None:
    source: Path = config["source"]
    output: Path = config["output"]
    if not source.exists():
        raise FileNotFoundError(source)
    output.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(output), pagesize=A4, rightMargin=18 * mm, leftMargin=18 * mm,
        topMargin=16 * mm, bottomMargin=18 * mm, title="HUMAN OVERRIDE: OVERLOAD",
        author="kwakhyun", subject=config["kind"],
    )
    doc.build(markdown_flows(source, sheet, config["kind"]), onFirstPage=draw_page, onLaterPages=draw_page)
    reader = PdfReader(str(output))
    extracted = "\n".join(page.extract_text() or "" for page in reader.pages)
    for required in config["required"]:
        if required not in extracted:
            raise ValueError(f"required text missing from {output.name}: {required}")
    if len(reader.pages) < 4:
        raise ValueError(f"unexpectedly short PDF: {output.name}")
    print(f"{output} | pages={len(reader.pages)} | bytes={output.stat().st_size}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", choices=("game", "ai"), help="Build only one PDF")
    args = parser.parse_args()
    register_fonts()
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    sheet = styles()
    selected = DOCS
    if args.only == "game":
        selected = (DOCS[0],)
    elif args.only == "ai":
        selected = (DOCS[1],)
    for config in selected:
        build_one(config, sheet)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Praetorians sprite pipeline.

Two stages, both deterministic:

  build    assets/sprites/base/<id>.png  ->  assets/sprites/sheets/<id>.png
           Keys the generated character out of its magenta background, normalises
           it into a fixed cell, derives four standing-still "breathing" frames
           (scale and micro-bob anchored at the feet) and composes them into a
           magenta (#FF00FF) sprite sheet, four cells wide.

  extract  assets/sprites/sheets/<id>.png  ->  assets/sprites/<id>.png
           Re-keys the magenta out of every sheet cell (soft alpha, no fringe),
           slices the sheet into frames and writes a transparent strip, then
           regenerates js/sprite-manifest.js for the game to read.

Usage:
  python3 tools/sprite_pipeline.py build
  python3 tools/sprite_pipeline.py extract
  python3 tools/sprite_pipeline.py all
Requires Pillow (pip install pillow).
"""

import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
BASE_DIR = ROOT / "assets" / "sprites" / "base"
SHEET_DIR = ROOT / "assets" / "sprites" / "sheets"
STRIP_DIR = ROOT / "assets" / "sprites"
MANIFEST = ROOT / "js" / "sprite-manifest.js"

CELL_W, CELL_H = 112, 144
FEET_MARGIN = 4          # px of empty space below the feet
MAX_H = CELL_H - FEET_MARGIN - 4
MAX_W = CELL_W - 6
MAGENTA = (255, 0, 255)

# Breathing cycle: scale factor and vertical bob (px, negative = up) per frame.
# Frames play as a ping-pong loop: 0, 1, 2, 1 (see the CSS keyframes).
BREATH = [
    (1.000, 0),
    (1.018, -1),
    (1.032, -2),
    (1.012, -1),
]

# Ten characters: id, label used in the UI, and where they appear.
CHARACTERS = [
    ("emperor", "The Emperor"),
    ("guard", "Praetorian Guard"),
    ("captain", "Guard Captain"),
    ("courtier", "Courtier"),
    ("senator", "Senator"),
    ("herald", "Herald"),
    ("advisor", "Court Advisor"),
    ("cheesemonger", "Cheesemonger"),
    ("baker", "Baker"),
    ("goose", "The Goose"),
]

# Ten emperors from js/data.js. Ids match the emperor ids, so the game can look a
# sprite up directly. Anserus (a goose), Bartholomew (a potato), Cassia (a ghost)
# and Magnus keep their procedural portraits.
EMPEROR_SPRITES = [
    ("little_boots", "Little Boots"),
    ("lucia", "Lucia Vexmarch"),
    ("dorcas", "Dorcas of Ostia"),
    ("octavia", "Octavia Minor"),
    ("pompeius", "Pompeius the Retired"),
    ("tiberius", "Tiberius, Mildly Disappointed"),
    ("severus", "Severus the Cheesemonger"),
    ("claudius", "Claudius (Backwards)"),
    ("brutus", "Brutus the Pragmatist"),
    ("helena", "Helena the Lyre-Strummer"),
]

# Every sprite the pipeline builds, with its group: "court" figures or "emperor" figures.
ALL_SPRITES = (
    [(cid, label, "court") for cid, label in CHARACTERS]
    + [(cid, label, "emperor") for cid, label in EMPEROR_SPRITES]
)


def magenta_mix(r, g, b):
    """How magenta a pixel is: the smaller of red and blue, minus green."""
    return min(r, b) - g


def key_alpha(r, g, b):
    """Soft key. 0 = background magenta, 255 = character."""
    m = magenta_mix(r, g, b)
    if m >= 150:
        return 0
    if m <= 90:
        return 255
    return int(round(255 * (150 - m) / 60))


def key_out(img):
    """Return an RGBA copy of img with the magenta background removed."""
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, _ = px[x, y]
            a = key_alpha(r, g, b)
            if a == 0:
                px[x, y] = (0, 0, 0, 0)
            else:
                # Despill: pull red/blue down toward the green so no magenta halo remains.
                if a < 255:
                    cap = g + 40
                    r = min(r, cap)
                    b = min(b, cap)
                px[x, y] = (r, g, b, a)
    return rgba


def binarise_alpha(rgba, threshold=128):
    """Crisp pixel-art edges: alpha becomes fully on or fully off."""
    r, g, b, a = rgba.split()
    a = a.point(lambda v: 255 if v >= threshold else 0)
    out = Image.merge("RGBA", (r, g, b, a))
    return out


def fit_character(char_rgba):
    """Crop to the visible pixels and scale to fit the cell, keeping the aspect ratio."""
    bbox = char_rgba.getbbox()
    if bbox is None:
        raise SystemExit("no character pixels found after keying")
    char = char_rgba.crop(bbox)
    w, h = char.size
    scale = min(MAX_H / h, MAX_W / w)
    nw, nh = max(1, round(w * scale)), max(1, round(h * scale))
    return char.resize((nw, nh), Image.BOX)


def breath_frame(char, scale, bob):
    """One standing frame: scale the figure, anchored at its feet, then bob it."""
    w, h = char.size
    nh = max(1, round(h * scale))
    scaled = char.resize((round(w * scale), nh), Image.BOX) if scale != 1.0 else char
    cell = Image.new("RGBA", (CELL_W, CELL_H), MAGENTA + (255,))
    x = (CELL_W - scaled.size[0]) // 2
    y = CELL_H - FEET_MARGIN - scaled.size[1] + bob
    cell.alpha_composite(binarise_alpha(scaled), (x, y))
    return cell


def build_sheet(char_id):
    src = BASE_DIR / f"{char_id}.png"
    if not src.exists():
        raise SystemExit(f"missing base image: {src}")
    char = fit_character(binarise_alpha(key_out(Image.open(src))))
    sheet = Image.new("RGB", (CELL_W * len(BREATH), CELL_H), MAGENTA)
    for i, (scale, bob) in enumerate(BREATH):
        frame = breath_frame(char, scale, bob).convert("RGB")
        sheet.paste(frame, (i * CELL_W, 0))
    SHEET_DIR.mkdir(parents=True, exist_ok=True)
    out = SHEET_DIR / f"{char_id}.png"
    sheet.save(out, optimize=True)
    return out


def extract_sheet(char_id):
    src = SHEET_DIR / f"{char_id}.png"
    if not src.exists():
        raise SystemExit(f"missing sheet: {src}")
    sheet = Image.open(src).convert("RGB")
    n = sheet.size[0] // CELL_W
    if sheet.size[0] % CELL_W or sheet.size[1] != CELL_H:
        raise SystemExit(f"{src.name}: expected {CELL_W}x{CELL_H} cells, got {sheet.size}")
    strip = Image.new("RGBA", (CELL_W * n, CELL_H), (0, 0, 0, 0))
    fringe = 0
    opaque = 0
    for i in range(n):
        cell = sheet.crop((i * CELL_W, 0, (i + 1) * CELL_W, CELL_H))
        keyed = binarise_alpha(key_out(cell))
        px = keyed.load()
        for y in range(CELL_H):
            for x in range(CELL_W):
                if px[x, y][3]:
                    opaque += 1
                    if magenta_mix(*px[x, y][:3]) > 60:
                        fringe += 1
        strip.paste(keyed, (i * CELL_W, 0))
    out = STRIP_DIR / f"{char_id}.png"
    strip.save(out, optimize=True)
    return {"file": out, "frames": n, "opaque": opaque, "fringe": fringe}


def write_manifest(entries):
    lines = [
        "// Generated by tools/sprite_pipeline.py extract. Do not edit by hand.",
        "export const SPRITE_CELL = { w: %d, h: %d };" % (CELL_W, CELL_H),
        "export const SPRITES = {",
    ]
    for char_id, label, group in ALL_SPRITES:
        e = entries[char_id]
        rel = e["file"].relative_to(ROOT).as_posix()
        lines.append(
            "  %s: { src: %s, label: %s, frames: %d, group: %s }," % (
                json.dumps(char_id), json.dumps(rel), json.dumps(label), e["frames"], json.dumps(group))
        )
    lines.append("};")
    MANIFEST.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main(argv):
    mode = argv[1] if len(argv) > 1 else "all"
    if mode in ("build", "all"):
        for char_id, _, _ in ALL_SPRITES:
            out = build_sheet(char_id)
            print(f"sheet   {out.relative_to(ROOT)}")
    if mode in ("extract", "all"):
        entries = {}
        for char_id, _, _ in ALL_SPRITES:
            e = extract_sheet(char_id)
            entries[char_id] = e
            print(f"strip   {e['file'].relative_to(ROOT)}  frames={e['frames']} "
                  f"opaque={e['opaque']} fringe={e['fringe']}")
        write_manifest(entries)
        print(f"manifest {MANIFEST.relative_to(ROOT)}")
    if mode not in ("build", "extract", "all"):
        raise SystemExit(__doc__)


if __name__ == "__main__":
    main(sys.argv)

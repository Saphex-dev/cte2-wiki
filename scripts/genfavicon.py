"""Generate public/favicon.svg from the real Press Start 2P glyph bitmaps.

The bitmaps below were read out of the font by rendering each glyph to a canvas
in the browser and downsampling to the face's native 8px grid, so these are the
actual letterforms rather than a redraw.

Layout is the compact CTE2 mark stacked 2x2, because four glyphs in a row at
16px would be four pixels each and unreadable. Stacked, each glyph gets half
the icon.

Colours use the same ramp as Wordmark.astro: hold brand violet for the first
55%, ease to magenta over the remaining 45%. For four glyphs that yields
#844dec #844dec #9545ec #c730ed -- identical to the compact CTE2 lockup in the
original wordmark study.
"""

GLYPHS = {
    "C": (0, ["0011110", "0110011", "1100000", "1100000", "1100000", "0110011", "0011110"]),
    "T": (1, ["111111", "001100", "001100", "001100", "001100", "001100", "001100"]),
    "E": (0, ["1111111", "1100000", "1100000", "1111110", "1100000", "1100000", "1111111"]),
    "2": (0, ["0111110", "1100011", "0000111", "0011110", "0111100", "1110000", "1111111"]),
}

VIOLET = (0x84, 0x4D, 0xEC)
MAGENTA = (0xC7, 0x30, 0xED)
HOLD, SPAN = 0.55, 0.45
GROUND = "#211533"   # stroke-dark, the outline colour of the mark
CELL, PAD, GAP = 7, 2, 2
SIZE = PAD * 2 + CELL * 2 + GAP  # 20


def tint(t):
    e = min(1.0, max(0.0, (t - HOLD) / SPAN))
    c = [round(v + e * (m - v)) for v, m in zip(VIOLET, MAGENTA)]
    return "#%02x%02x%02x" % tuple(c)


def runs(row):
    """Consecutive spans of ink, as (start, length) — fewer rects than per-pixel."""
    out, i = [], 0
    while i < len(row):
        if row[i] == "1":
            j = i
            while j < len(row) and row[j] == "1":
                j += 1
            out.append((i, j - i))
            i = j
        else:
            i += 1
    return out


order = ["C", "T", "E", "2"]
parts = [
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}" '
    f'shape-rendering="crispEdges">',
    f'<rect width="{SIZE}" height="{SIZE}" fill="{GROUND}"/>',
]

for i, ch in enumerate(order):
    dx, rows = GLYPHS[ch]
    cx = PAD + (i % 2) * (CELL + GAP) + dx
    cy = PAD + (i // 2) * (CELL + GAP)
    rects = []
    for y, row in enumerate(rows):
        for x, w in runs(row):
            rects.append(f'<rect x="{cx + x}" y="{cy + y}" width="{w}" height="1"/>')
    parts.append(f'<g fill="{tint(i / 3)}">' + "".join(rects) + "</g>")

parts.append("</svg>")
svg = "".join(parts)

with open("public/favicon.svg", "w", encoding="utf-8", newline="\n") as f:
    f.write(svg + "\n")

print(f"wrote public/favicon.svg  {len(svg)} bytes  viewBox 0 0 {SIZE} {SIZE}")
for i, ch in enumerate(order):
    print(f"  {ch}  {tint(i / 3)}")

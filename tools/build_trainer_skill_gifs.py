"""Build the short animated examples used by the public trainer help panels.

Run from any directory with Python 3 and Pillow. DejaVu Sans is used for
Cyrillic and mathematical notation. Use --group to rebuild one set of examples.
"""

import argparse
import importlib
import json
import math
from pathlib import Path
import sys

from PIL import Image, ImageDraw, ImageFont

sys.dont_write_bytecode = True
WIDTH, HEIGHT = 640, 360
OUT = Path(__file__).resolve().parent.parent / 'assets' / 'trainer-skill-gifs'
COLORS = {
    'ink': '#183630', 'accent': '#0a624c', 'blue': '#245898',
    'amber': '#9d531b', 'muted': '#475f58', 'paper': '#f8fbf7',
    'white': '#ffffff', 'edge': '#bcd3c8', 'red': '#9b3030',
    'soft': '#e5f2e9', 'grid': '#d9e6df',
}


def color(value):
    return COLORS.get(value, value)


class Card:
    def __init__(self):
        self.image = Image.new('RGB', (WIDTH, HEIGHT), COLORS['paper'])
        self.draw = ImageDraw.Draw(self.image)

    @staticmethod
    def font(size, bold=False):
        name = 'DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf'
        return ImageFont.truetype(name, size)

    def text(self, x, y, text, size=26, fill='ink', bold=False, anchor='lt'):
        self.draw.text((x, y), text, font=self.font(size, bold), fill=color(fill), anchor=anchor)

    def line(self, points, fill='ink', width=3, dashed=False):
        if not dashed:
            self.draw.line(points, fill=color(fill), width=width, joint='curve')
            return
        for (ax, ay), (bx, by) in zip(points, points[1:]):
            distance = math.hypot(bx - ax, by - ay)
            if not distance:
                continue
            for offset in range(0, math.ceil(distance), 13):
                end = min(offset + 7, distance)
                segment = [(ax + (bx - ax) * t / distance, ay + (by - ay) * t / distance)
                           for t in (offset, end)]
                self.line(segment, fill, width)

    def arrow(self, start, end, fill='accent', width=4):
        self.line([start, end], fill, width)
        x, y = end
        angle = math.atan2(y - start[1], x - start[0])
        head = 12 + width
        points = [(x, y)] + [(x - head * math.cos(angle + d), y - head * math.sin(angle + d))
                             for d in (-0.47, 0.47)]
        self.polygon(points, fill)

    def rect(self, box, fill='white', outline=None, width=1, radius=0):
        self.draw.rounded_rectangle(box, radius=radius, fill=color(fill), outline=color(outline), width=width)

    def circle(self, x, y, r, fill='accent', outline=None, width=1):
        self.draw.ellipse((x - r, y - r, x + r, y + r), fill=color(fill), outline=color(outline), width=width)

    def polygon(self, points, fill='soft', outline=None, width=1):
        self.draw.polygon(points, fill=color(fill), outline=color(outline), width=width)


def wrap(draw, text, font, max_width):
    lines = ['']
    for word in text.split():
        candidate = f'{lines[-1]} {word}'.strip()
        if draw.textlength(candidate, font=font) <= max_width:
            lines[-1] = candidate
        else:
            lines.append(word)
    return lines


def render(title, steps, draw, index):
    card = Card()
    card.rect((0, 0, WIDTH, 73), fill='soft')
    title_size = 24
    while card.draw.textlength(title, font=card.font(title_size, True)) > WIDTH - 144:
        title_size -= 1
    card.text(24, 24, title, title_size, bold=True)
    card.text(614, 26, f'{index + 1} / {len(steps)}', 20, 'muted', anchor='rt')
    card.rect((24, 62, 616, 66), fill='edge', radius=2)
    card.rect((24, 62, 24 + (592 * (index + 1)) // len(steps), 66), fill='accent', radius=2)
    draw(card, index)
    card.line([(24, 276), (616, 276)], fill='edge', width=1)
    lines = wrap(card.draw, steps[index], card.font(19), WIDTH - 48)
    if len(lines) > 2:
        raise ValueError(f'Caption needs more than two lines: {title}, {steps[index]}')
    for row, line in enumerate(lines):
        card.text(24, 292 + 25 * row, line, 19, 'ink')
    return card.image


def main():
    groups = ('arithmetic', 'oge', 'profile', 'entries', 'downloads')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--group', choices=groups)
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    index = OUT / 'index.json'
    metadata = json.loads(index.read_text(encoding='utf-8')) if args.group else {}
    built = set()

    def build(slug, title, steps, draw):
        if slug in built or not 4 <= len(steps) <= 5:
            raise ValueError(f'Invalid example or frame count: {slug}')
        built.add(slug)
        frames = [render(title, steps, draw, i) for i in range(len(steps))]
        indexed = [frame.quantize(colors=96) for frame in frames]
        indexed[0].save(OUT / f'{slug}.gif', save_all=True, append_images=indexed[1:],
                        duration=[1500] * (len(frames) - 1) + [2600], loop=0,
                        disposal=2, optimize=True)
        sheet = Image.new('RGB', (WIDTH, HEIGHT * len(frames)))
        for i, frame in enumerate(frames):
            sheet.paste(frame, (0, HEIGHT * i))
        sheet.quantize(colors=128).save(OUT / f'{slug}.png', optimize=True)
        metadata[slug] = {'title': title, 'steps': list(steps)}
        print(f'{slug}: {len(frames)} frames')

    for group in ([args.group] if args.group else groups):
        importlib.import_module(f'trainer_gif_{group}').build_all(build)
    index.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main()

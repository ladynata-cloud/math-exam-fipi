#!/usr/bin/env python3
"""Reproduce textbook regions from the owner's exact source; PDF stays external.

Usage: python tools/peterson6-source.py --pdf /path/to/first-volume.pdf
Requires PyMuPDF and Pillow. Generated assets are committed; CI needs no PDF.
"""
import argparse
import hashlib
import io
import json
import re
from pathlib import Path

import fitz
from PIL import Image

SOURCE_SHA = '852f8db30a68cb9f5d42fe7e02d28eb87a46fdff6aa4707902595e3761cf1d92'
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'school/peterson6/textbook'


def spans(page):
    return [s for b in page.get_text('dict')['blocks']
            for line in b.get('lines', []) for s in line['spans']]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--pdf', required=True, type=Path)
    args = parser.parse_args()
    if hashlib.sha256(args.pdf.read_bytes()).hexdigest() != SOURCE_SHA:
        raise SystemExit('Wrong source edition or bytes; do not reuse these regions.')
    pdf = fitz.open(args.pdf)
    source_map = json.loads((ROOT / 'school/peterson6/source-map.json').read_text())
    topics = [{**t, 'kind': 'topic'} for t in source_map['topics']]
    topics += [{**t, 'kind': 'review', 'startPage': t['page'], 'endPage': t['page']}
               for t in source_map['selfChecks']]
    topics.sort(key=lambda t: t['firstExercise'])
    marks = []
    headings = {}
    for i, page in enumerate(pdf):
        for span in spans(page):
            value = span['text'].strip()
            if span['font'] == 'NewtonC' and abs(span['size'] - 16) < .1 and value.isdigit():
                n = int(value)
                if 1 <= n <= 497:
                    marks.append({'number': n, 'page': i + 1, 'bbox': list(span['bbox'])})
            # New section theory is not part of the preceding exercise.
            if span['font'] == 'SchoolBookC-Bold' and abs(span['size'] - 14) < .1:
                if re.match(r'^\d\.\s', value) or value.startswith('Задачи для самопроверки'):
                    headings.setdefault(i + 1, []).append(span['bbox'][1])
    marks.sort(key=lambda x: x['number'])
    assert [m['number'] for m in marks] == list(range(1, 498)), 'Missing/duplicate source number'
    # A number may align with the centre of a tall fraction. Its text bbox
    # alone is not the top of the condition (e.g. 183 on page 48). Include the
    # first text/math block and its outline that cross the number's centre.
    for mark in marks:
        pg = pdf[mark['page'] - 1]
        centre = (mark['bbox'][1] + mark['bbox'][3]) / 2
        tops = [mark['bbox'][1] - 2]
        for block in pg.get_text('dict')['blocks']:
            for line in block.get('lines', []):
                r = fitz.Rect(line['bbox'])
                if r.x1 > mark['bbox'][2] + 15 and r.y0 <= centre <= r.y1:
                    tops.append(r.y0 - 1)
        for drawing in pg.get_drawings():
            r = drawing['rect']
            color = drawing.get('color')
            pink_outline = color and color[0] > .8 and color[1] < .1
            if pink_outline and r.width > 40 and r.height < 300 and r.x0 > mark['bbox'][0] and r.y0 <= centre <= r.y1:
                tops.append(r.y0 - 1)
        mark['top'] = max(58, min(tops))
    (OUT / 'pages').mkdir(parents=True, exist_ok=True)
    items, used_pages = [], set()
    for index, mark in enumerate(marks):
        n = mark['number']
        topic = next(t for t in topics if t['firstExercise'] <= n <= t['lastExercise'])
        nxt = marks[index + 1] if index + 1 < len(marks) else None
        same_topic = nxt is not None and nxt['number'] <= topic['lastExercise']
        last_page = nxt['page'] if same_topic else mark['page']
        regions = []
        for pno in range(mark['page'], last_page + 1):
            page = pdf[pno - 1]
            top = mark['top'] if pno == mark['page'] else 60
            # A half-point shared margin retains stroke caps and denominator
            # descenders without including the following number's ink.
            bottom = min(700, nxt['top'] + .5 if same_topic and pno == nxt['page'] else 700)
            following_headers = [y for y in headings.get(pno, []) if y > top + 20]
            if not same_topic and following_headers:
                bottom = min(bottom, min(following_headers) - 5)
            if bottom - top < 12:
                continue  # The next page starts with the next numbered exercise.
            left, right = (36, 520) if pno % 2 else (66, 550)
            rect = fitz.Rect(left, top, right, bottom)
            # Trim trailing whitespace, retaining vector drawings/tables as well
            # as text. Keep original region bounds when any drawing spans it.
            # Text blocks sometimes combine two numbered exercises (9 and 10
            # share one block). Trim using lines, never the shared block's top.
            content_rects = []
            for block in page.get_text('dict')['blocks']:
                if 'lines' in block:
                    content_rects.extend(fitz.Rect(line['bbox']) for line in block['lines'])
                else:
                    content_rects.append(fitz.Rect(block['bbox']))
            blocks = [r for r in content_rects if r.intersects(rect)]
            drawings = [d['rect'] for d in page.get_drawings()
                        if d['rect'].intersects(rect) and d['rect'].height < 620
                        and d['rect'].y0 >= top - 8]
            ends = [min(b.y1, bottom) for b in blocks + drawings if b.y0 < bottom]
            # Clipping is conservative: the whole original page is available
            # from every region, so continuation and crowded fraction rows can
            # always be inspected at original resolution.
            if ends:
                bottom = min(bottom, max(ends) + 4)
            if bottom - top < 12:
                continue
            region = {'page': pno, 'x': left, 'y': round(top, 3),
                      'width': right - left, 'height': round(bottom - top, 3)}
            regions.append(region)
            used_pages.add(pno)
        assert regions, f'No source region for {n}'
        items.append({'number': n, 'topic': topic['id'], 'page': mark['page'],
                      'regions': regions})
    assets = []
    for pno in sorted(used_pages):
        page = pdf[pno - 1]
        pix = page.get_pixmap(matrix=fitz.Matrix(2.5, 2.5), alpha=False)
        img = Image.open(io.BytesIO(pix.tobytes('png')))
        path = OUT / 'pages' / f'{pno:03}.webp'
        output = io.BytesIO()
        img.save(output, format='WEBP', lossless=True, method=6)
        temporary = path.with_suffix('.webp.tmp')
        temporary.write_bytes(output.getvalue())
        temporary.replace(path)
        assets.append({'page': pno, 'path': f'pages/{pno:03}.webp',
                       'width': round(page.rect.width, 3),
                       'height': round(page.rect.height, 3),
                       'pixelWidth': img.width, 'pixelHeight': img.height,
                       'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    data = {'schema': 1, 'source': {**source_map['source'], 'sha256': SOURCE_SHA},
            'topics': topics, 'exercises': items, 'pages': assets}
    (OUT / 'source-index.json').write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'sourceNumbers': len(items), 'pageAssets': len(assets),
                      'regions': sum(len(i['regions']) for i in items),
                      'bytes': sum((OUT / a['path']).stat().st_size for a in assets)}))


if __name__ == '__main__':
    main()

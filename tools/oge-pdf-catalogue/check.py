#!/usr/bin/env python3
"""Verify the restored catalogue and actual PDFs, without generating material."""
import argparse
from collections import Counter
from fractions import Fraction
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
import xml.etree.ElementTree as ET

import fitz

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / 'oge/variants/2027'
KINDS = ('variant', 'otvety', 'reshenie')
COLLECTIONS = dict(zip(KINDS, (
    'OGE_2027_vse_104_varianta.pdf',
    'OGE_2027_otvety_104_varianta.pdf',
    'OGE_2027_resheniya_104_varianta.pdf',
)))
FAMILIES = ('tires', 'plot', 'flat', 'roads_grid', 'roads_schema',
            'furnace', 'tariffs', 'paper')


class Catalogue(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.cards, self.pdfs, self.links = [], [], []
        self.card = None
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'article' and 'card' in attrs.get('class', '').split():
            self.card = {'number': int(attrs['data-number']),
                         'type': attrs['data-type'], 'links': []}
            self.cards.append(self.card)
        if tag == 'a':
            href = attrs.get('href', '')
            self.links.append(href)
            if href.endswith('.pdf'):
                self.pdfs.append(href)
                assert attrs.get('type') == 'application/pdf', href
                if self.card is not None:
                    assert attrs.get('aria-label'), href
                    self.card['links'].append(href)

    def handle_endtag(self, tag):
        if tag == 'article':
            self.card = None


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def sitemap_urls(text):
    return {x.text for x in ET.fromstring(text).iter()
            if x.tag.endswith('}loc')}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path,
                        help='Optional recovered author archive; never modified')
    parser.add_argument('--base', help='Previously fetched base for sitemap parity')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    manifest = json.loads((PUBLIC / 'manifest.json').read_text())
    catalogue = Catalogue((PUBLIC / 'index.html').read_text())
    assert manifest['total'] == len(manifest['variants']) == len(catalogue.cards) == 104
    assert [v['number'] for v in manifest['variants']] == list(range(1, 105))
    assert Counter(v['type'] for v in manifest['variants']) == Counter({k: 13 for k in FAMILIES})
    assert manifest['family_counts'] == {k: 13 for k in FAMILIES}
    expected = {f'collections/{name}' for name in COLLECTIONS.values()}
    pages, headings, student_tasks, printed_answers = Counter(), 0, 0, 0
    source_matches = 0
    rows = []
    source_bank = None
    if args.source:
        source_bank = json.loads((args.source / 'materials/bank.json').read_text())
        assert [v['number'] for v in source_bank['variants']] == list(range(1, 105))
        assert sha(PUBLIC / 'manifest.json') == sha(args.source / 'publication/oge/variants/2027/manifest.json')

    for variant, card in zip(manifest['variants'], catalogue.cards):
        number = variant['number']
        assert card['number'] == number and card['type'] == variant['type']
        assert set(variant['files']) == set(KINDS)
        assert card['links'] == [f'files/OGE_2027_{number:03d}_{k}.pdf' for k in KINDS]
        for kind in KINDS:
            meta = variant['files'][kind]
            rel = f'files/OGE_2027_{number:03d}_{kind}.pdf'
            assert meta['path'] == rel
            expected.add(rel)
            path = PUBLIC / rel
            assert path.read_bytes().startswith(b'%PDF-'), rel
            assert path.stat().st_size == meta['bytes'] and sha(path) == meta['sha256'], rel
            if args.source:
                assert sha(path) == sha(args.source / 'publication/oge/variants/2027' / rel), rel
                source_matches += 1
            with fitz.open(path) as document:
                assert not document.is_encrypted and len(document) == meta['pages'], rel
                pages[kind] += len(document)
                task_numbers = []
                text = '\n'.join(page.get_text() for page in document)
                for page in document:
                    header = page.get_text(clip=fitz.Rect(0, 0, page.rect.width, 70))
                    numbers_in_header = re.findall(r'Вариант\s+(\d+)', header)
                    assert numbers_in_header and set(numbers_in_header) == {f'{number:02d}'}, (rel, header)
                    assert page.get_text().strip(), rel
                    for block in page.get_text('dict')['blocks']:
                        for line in block.get('lines', []):
                            for span in line['spans']:
                                value = span['text']
                                assert '\ufffd' not in value and '\x00' not in value, rel
                                x0, y0, x1, y1 = span['bbox']
                                if value.strip():
                                    assert x0 >= 18 and y0 >= 7 and x1 <= page.rect.width - 18 and y1 <= page.rect.height - 7, (rel, value, span['bbox'])
                                if kind == 'variant' and 45 < x0 < 70 and 'Bold' in span['font'] and span['size'] > 10 and re.fullmatch(r'\d{1,2}', value.strip()):
                                    task_numbers.append(int(value.strip()))
                if kind == 'variant':
                    assert task_numbers == list(range(1, 26)), (rel, task_numbers)
                    student_tasks += len(task_numbers)
                if kind == 'reshenie':
                    numbers = [int(n) for n in re.findall(r'Задание\s+(\d+)', text)]
                    assert numbers == list(range(1, 26)), (rel, numbers)
                    headings += len(numbers)
                if kind == 'otvety':
                    assert len(document) == 1
                    words = document[0].get_text('words')
                    labels = [w for w in words if 80 < w[0] < 102 and w[4].isdigit() and 150 < w[1] < 760]
                    assert [int(w[4]) for w in labels] == list(range(1, 26)), rel
                    if source_bank:
                        tasks = source_bank['variants'][number - 1]['tasks']
                        for label, task in zip(labels[:19], tasks[:19]):
                            pieces = [w for w in words if w[0] > 108 and abs(w[1] - label[1]) < 3]
                            actual = ''.join(w[4] for w in sorted(pieces, key=lambda w: w[0])).replace('−', '-').replace(',', '.')
                            assert Fraction(actual) == Fraction(str(task['answer']).replace(',', '.')), (number, task['number'])
                            printed_answers += 1
            rows.append({'path': rel, 'sha256': meta['sha256'], 'bytes': meta['bytes'], 'pages': meta['pages']})

    comparisons = 0
    for kind, name in COLLECTIONS.items():
        path = PUBLIC / 'collections' / name
        if args.source:
            assert sha(path) == sha(args.source / name), name
            source_matches += 1
        with fitz.open(path) as collection:
            assert len(collection) == pages[kind]
            offset = 0
            for variant in manifest['variants']:
                with fitz.open(PUBLIC / variant['files'][kind]['path']) as individual:
                    for page in individual:
                        other = collection[offset]
                        assert page.rect == other.rect
                        assert page.get_text() == other.get_text(), (name, offset)
                        assert page.get_pixmap(matrix=fitz.Matrix(.5, .5), alpha=False).samples == other.get_pixmap(matrix=fitz.Matrix(.5, .5), alpha=False).samples, (name, offset, 'render')
                        offset += 1
                        comparisons += 1
        rows.append({'path': 'collections/' + name, 'sha256': sha(path), 'bytes': path.stat().st_size, 'pages': pages[kind]})

    assert len(catalogue.pdfs) == len(set(catalogue.pdfs)) == 315
    assert set(catalogue.pdfs) == expected == {p.relative_to(PUBLIC).as_posix() for p in PUBLIC.rglob('*.pdf')}
    target = 'https://mathexam.space/oge/variants/2027/'
    sitemap = (ROOT / 'sitemap.xml').read_text()
    assert sitemap.count(f'<loc>{target}</loc>') == 1
    if args.base:
        previous = subprocess.check_output(['git', 'show', f'{args.base}:sitemap.xml'], cwd=ROOT, text=True)
        assert sitemap_urls(previous).issubset(sitemap_urls(sitemap))
        assert sitemap_urls(sitemap) - sitemap_urls(previous) <= {target}
    for entry in ('index.html', 'oge/index.html'):
        links = Catalogue((ROOT / entry).read_text()).links
        assert '/oge/variants/2027/' in links, entry
    assert '/trainers/oge-2027-analogue-1.html' in catalogue.links
    for href in catalogue.links:
        if href.startswith('/') and not href.startswith('//'):
            local = ROOT / href.lstrip('/')
            if href.endswith('/'):
                local /= 'index.html'
            assert local.is_file(), href

    report = {'status': 'PASS', 'gate': 'OGE_104_PDF_PAIRING_OK', 'variants': 104,
              'family_counts': manifest['family_counts'], 'pdfs': 315,
              'individual_pages': dict(pages), 'student_tasks': student_tasks,
              'solution_headings': headings, 'collection_page_text_and_render_pairs': comparisons,
              'source_identical_pdfs': source_matches if args.source else None,
              'printed_short_answers_compared_to_source': printed_answers if args.source else None,
              'sitemap_urls': len(sitemap_urls(sitemap)), 'files': rows}
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: v for k, v in report.items() if k != 'files'}, ensure_ascii=False))


if __name__ == '__main__':
    main()

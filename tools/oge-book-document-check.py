"""Verify placed book hyperlinks and QR codes in a DOCX/PDF candidate.

The output contains only URL, position and checksum evidence. All pages still
require visual layout review. Image decoding does not prove physical scanning.
Requires PyMuPDF, Pillow, lxml and zxing-cpp (read-only processing).
"""
import argparse
from collections import defaultdict
import datetime
import hashlib
import io
import json
from pathlib import Path
import re
import zipfile
import posixpath

import fitz
from lxml import etree
from PIL import Image
import zxingcpp

NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
      'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'}


def read_qr(data):
    try:
        image = Image.open(io.BytesIO(data)).convert('RGB')
    except Exception:
        return []
    return [item.text for item in zxingcpp.read_barcodes(image)
            if str(item.format) == 'QR Code']


def checksum(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def require(condition, message):
    if not condition:
        raise ValueError(message)


def normalized_text_urls(text):
    pattern = r'(?:https?://)?mathexam\.space(?:/[^\s<>]*)?'
    values = []
    for match in re.finditer(pattern, text):
        raw = match.group().rstrip('.,;:!?)')
        value = raw if raw.startswith('http') else 'https://' + raw
        values.append(value + '/' if value == 'https://mathexam.space' else value)
    return values


def check_pdf_qr_placements(inventory_rows, actual_rows, replacement):
    expected_by_page, actual_by_page = defaultdict(list), defaultdict(list)
    for row in inventory_rows:
        expected_by_page[row['page']].append(row)
    for row in actual_rows:
        actual_by_page[row['page']].append(row)
    require(set(expected_by_page) == set(actual_by_page), 'QR page assignment changed; inspect actual reflow before approving')
    position = lambda row: (row['rect'][1], row['rect'][0])
    for page in sorted(expected_by_page):
        expected = sorted(expected_by_page[page], key=position)
        actual = sorted(actual_by_page[page], key=position)
        require(len(expected) == len(actual), f'PDF QR count changed on page {page}; inspect actual reflow')
        for order, (before, after) in enumerate(zip(expected, actual), 1):
            target = replacement[before['normalized_url']]
            require(after['url'] == target, f'PDF QR placement mismatch: page {page}, top-to-bottom position {order}')
            after['source_page'] = page
            after['source_order'] = order
            after['expected_url'] = target
            after['source_placement_matches'] = True


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--docx', required=True)
    p.add_argument('--pdf', required=True)
    p.add_argument('--source-docx', required=True)
    p.add_argument('--mapping', default='scripts/oge-book-edition/urls.json')
    p.add_argument('--inventory', required=True)
    p.add_argument('--output', required=True)
    args = p.parse_args()
    output = Path(args.output)
    inputs = [Path(value).resolve() for value in (args.docx, args.pdf, args.source_docx, args.mapping, args.inventory)]
    require(output.resolve() not in inputs, 'Output must not overwrite an input')
    # A failed rerun must not leave a previous successful report at this path.
    output.unlink(missing_ok=True)
    mapping = json.loads(Path(args.mapping).read_text())
    inventory = json.loads(Path(args.inventory).read_text())
    recorded_source = [row for row in inventory['sources']
                       if row['name'] == Path(args.source_docx).name]
    require(len(recorded_source) == 1 and recorded_source[0]['sha256'] == checksum(args.source_docx), 'Source DOCX does not match the inventory checksum')
    require({row['sourceUrl'] for row in mapping} == {row['url'] for row in inventory['urls']}, 'Mapping source URLs differ from the extracted inventory')
    expected_links = {row['bookUrl'] for row in mapping}
    map_by_old = {row['sourceUrl']: row['bookUrl'] for row in mapping}
    require(len(map_by_old) == len(expected_links) == len(mapping), 'Mapping contains duplicate source or destination URLs')
    expected_qrs = {map_by_old[row['normalized_url']]
                    for row in inventory['docx']['qr_placements']}
    require(all(row['part'] == 'word/document.xml' for row in inventory['docx']['qr_placements']), 'This source has QR codes outside the reviewed main document part')
    require(all(row['part'] == 'word/document.xml' for row in inventory['docx']['hyperlinks']), 'This source has hyperlinks outside the reviewed main document part')
    expected_docx_qrs = {(row['paragraph'], row['drawing_index'], row['rid'], row['media']): map_by_old[row['normalized_url']]
                         for row in inventory['docx']['qr_placements']}
    require(len(expected_docx_qrs) == len(inventory['docx']['qr_placements']), 'Source QR placement identities are duplicated')
    expected_docx_links = {(row['paragraph'], row['hyperlink_index'], row['rid']): map_by_old[row['normalized_url']]
                          for row in inventory['docx']['hyperlinks']}
    expected_displayed = defaultdict(list)
    for row in inventory['docx']['text_url_matches']:
        require(row['part'] == 'word/document.xml', 'Visible URL outside the reviewed main document part')
        expected_displayed[row['paragraph']].append(map_by_old[row['normalized_url']])
    with zipfile.ZipFile(args.docx) as z:
        xml = etree.fromstring(z.read('word/document.xml'))
        rels = {r.get('Id'): r.get('Target') for r in etree.fromstring(z.read('word/_rels/document.xml.rels'))}
        docx_links, docx_link_placements, docx_qrs, displayed = [], [], [], []
        found_qr_keys, found_link_keys = set(), set()
        for paragraph_index, paragraph in enumerate(xml.xpath('//w:p', namespaces=NS), 1):
            paragraph_text = ''.join(paragraph.xpath('.//w:t/text()', namespaces=NS))
            visible_urls = normalized_text_urls(paragraph_text)
            require(visible_urls == expected_displayed.get(paragraph_index, []), f'Visible URL placement mismatch in paragraph {paragraph_index}')
            displayed.extend({'paragraph': paragraph_index, 'url': value} for value in visible_urls)
            for link_index, hyperlink in enumerate(paragraph.xpath('.//w:hyperlink[@r:id]', namespaces=NS), 1):
                rid = hyperlink.get('{'+NS['r']+'}id')
                key = (paragraph_index, link_index, rid)
                value = rels[rid]
                require(expected_docx_links.get(key) == value, f'DOCX hyperlink placement mismatch in paragraph {paragraph_index}, link {link_index}')
                found_link_keys.add(key)
                docx_links.append(value)
                docx_link_placements.append({'paragraph': paragraph_index, 'hyperlink_index': link_index, 'rid': rid, 'url': value, 'source_placement_matches': True})
            for drawing_index, drawing in enumerate(paragraph.xpath('.//w:drawing', namespaces=NS), 1):
                for blip in drawing.xpath('.//a:blip', namespaces=NS):
                    rid = blip.get('{'+NS['r']+'}embed')
                    if not rid:
                        continue
                    media = posixpath.normpath(posixpath.join('word', rels[rid]))
                    values = read_qr(z.read(media))
                    key = (paragraph_index, drawing_index, rid, media)
                    if key in expected_docx_qrs:
                        require(values == [expected_docx_qrs[key]], f'DOCX QR placement mismatch in paragraph {paragraph_index}, drawing {drawing_index}, media {media}')
                        found_qr_keys.add(key)
                    else:
                        require(not values, f'Unexpected QR placement in paragraph {paragraph_index}, drawing {drawing_index}')
                    for value in values:
                        docx_qrs.append({'paragraph': paragraph_index, 'drawing_index': drawing_index, 'rid': rid, 'media': media, 'url': value, 'expected_url': expected_docx_qrs[key], 'source_placement_matches': True})
        require(found_qr_keys == set(expected_docx_qrs), 'A source DOCX QR placement is missing')
        require(found_link_keys == set(expected_docx_links), 'A source DOCX hyperlink placement is missing')
        with zipfile.ZipFile(args.source_docx) as src:
            original_names = set(src.namelist())
            require(set(z.namelist()) == original_names, 'Unrelated package structure changed')
            changed = [name for name in original_names if src.read(name) != z.read(name)]
            permitted_media = {r['media'] for r in inventory['docx']['qr_placements']}
            require(set(changed) <= permitted_media | {'word/document.xml', 'word/_rels/document.xml.rels'}, 'Unrelated DOCX parts changed: ' + repr(changed))
            source_xml = etree.fromstring(src.read('word/document.xml'))
            # Paragraph boundaries are material: concatenating across them can
            # make a URL regex swallow the next paragraph after a trailing '/'.
            source_text = '\n'.join(''.join(p.xpath('.//w:t/text()', namespaces=NS))
                                    for p in source_xml.xpath('//w:p', namespaces=NS))
            candidate_text = '\n'.join(''.join(p.xpath('.//w:t/text()', namespaces=NS))
                                       for p in xml.xpath('//w:p', namespaces=NS))
            pattern = r'(?:https?://)?mathexam\.space(?:/[^\s<>]*)?'
            require(re.sub(pattern, '', source_text) == re.sub(pattern, '', candidate_text), 'Non-URL book text changed')
    pdf = fitz.open(args.pdf)
    pdf_links = []
    pdf_qrs = []
    decoded_images = {}
    for number, page in enumerate(pdf, 1):
        page_links = [item['uri'] for item in page.get_links() if 'uri' in item]
        pdf_links.extend({'page': number, 'url': u} for u in page_links)
        for info in page.get_image_info(xrefs=True):
            xref = info['xref']
            if not xref:
                continue
            if xref not in decoded_images:
                decoded_images[xref] = read_qr(pdf.extract_image(xref)['image'])
            for value in decoded_images[xref]:
                bounds = fitz.Rect(info['bbox'])
                checks = {}
                for dpi in (150, 300):
                    crop = page.get_pixmap(matrix=fitz.Matrix(dpi / 72, dpi / 72),
                                          clip=bounds + (-1, -1, 1, 1), alpha=False)
                    checks[str(dpi)] = value in read_qr(crop.tobytes('png'))
                pdf_qrs.append({'page': number, 'url': value, 'rect': list(bounds),
                                'printed_width_mm': round(bounds.width * 25.4 / 72, 2),
                                'same_page_link': value in page_links,
                                'rendered_crop_decode_dpi': checks})
    require(set(docx_links) == expected_links, 'DOCX destination set differs from mapping')
    require({row['url'] for row in pdf_links} == expected_links, 'PDF destination set differs from mapping')
    require(len(docx_qrs) == len(pdf_qrs) == len(inventory['docx']['qr_placements']), 'Placed QR count differs from source inventory')
    require({row['url'] for row in docx_qrs} == {row['url'] for row in pdf_qrs} == expected_qrs, 'QR payload set differs from mapped source targets')
    check_pdf_qr_placements(inventory['pdf']['qr_placements'], pdf_qrs, map_by_old)
    require(all(row['same_page_link'] for row in pdf_qrs), 'PDF QR has no corresponding link on its page')
    require(all(all(row['rendered_crop_decode_dpi'].values()) for row in pdf_qrs), 'A rendered PDF QR crop failed decoding')
    report = {'status': 'passed', 'scope': 'placed targets and image decoding; not physical camera scanning',
              'checked_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'source_docx_sha256': checksum(args.source_docx),
              'source_inventory_sha256': checksum(args.inventory),
              'mapping_sha256': checksum(args.mapping),
              'docx_name': Path(args.docx).name, 'docx_sha256': checksum(args.docx),
              'pdf_name': Path(args.pdf).name, 'pdf_sha256': checksum(args.pdf),
              'pages': len(pdf), 'unique_urls': len(expected_links),
              'docx_hyperlink_placements': len(docx_links), 'pdf_hyperlink_annotations': len(pdf_links),
              'docx_placed_qr': len(docx_qrs), 'pdf_placed_qr': len(pdf_qrs),
              'all_non_url_text_unchanged': True, 'all_non_qr_images_unchanged': True,
              'all_qr_source_placements_match': True, 'all_docx_link_source_placements_match': True,
              'visible_url_occurrences_checked': len(displayed),
              'docx_qr': docx_qrs, 'pdf_qr': pdf_qrs, 'pdf_links': pdf_links,
              'docx_link_placements': docx_link_placements, 'docx_visible_urls': displayed}
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: v for k, v in report.items() if k not in ('docx_qr', 'pdf_qr', 'pdf_links', 'docx_link_placements', 'docx_visible_urls')}, ensure_ascii=False))


if __name__ == '__main__':
    main()

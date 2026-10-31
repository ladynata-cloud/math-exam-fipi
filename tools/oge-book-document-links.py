"""Prepare a separate OGE book candidate with fixed links and placed QR codes.

Only hyperlink destinations, displayed URL text, and placed QR images change.
The book itself is supplied privately at execution time and never committed.
Render the resulting DOCX and verify every page before publication.
"""
import argparse
import hashlib
import io
import json
from pathlib import Path
import re
import zipfile

from lxml import etree
import qrcode

NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
      'pr': 'http://schemas.openxmlformats.org/package/2006/relationships'}
URL = re.compile(r'(?:https?://)?mathexam\.space(?:/[^\s<>]*)?')


def normalize(value):
    if value == 'https://mathexam.space':
        return value + '/'
    return value


def replace_spanning_text(paragraph, replacements):
    nodes = paragraph.xpath('.//w:t', namespaces=NS)
    text = ''.join(node.text or '' for node in nodes)
    edits = []
    for match in URL.finditer(text):
        raw = match.group().rstrip('.,;:!?)')
        full = raw if raw.startswith('http') else 'https://' + raw
        full = normalize(full)
        if full in replacements:
            new = replacements[full]
            if not raw.startswith('http'):
                new = new.removeprefix('https://')
            edits.append((match.start(), match.start() + len(raw), new))
    for start, end, value in reversed(edits):
        offset = 0
        parts = []
        for node in nodes:
            node_text = node.text or ''
            parts.append((node, offset, offset + len(node_text), node_text))
            offset += len(node_text)
        inserted = False
        for node, left, right, old in parts:
            if right <= start or left >= end:
                continue
            prefix = old[:max(0, start - left)]
            suffix = old[max(0, end - left):]
            node.text = prefix + (value if not inserted else '') + suffix
            node.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')
            inserted = True
    return len(edits)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--docx', required=True)
    parser.add_argument('--inventory', required=True)
    parser.add_argument('--mapping', default='scripts/oge-book-edition/urls.json')
    parser.add_argument('--output', required=True)
    parser.add_argument('--report', required=True)
    args = parser.parse_args()
    source = Path(args.docx)
    inventory = json.loads(Path(args.inventory).read_text())
    mapping = json.loads(Path(args.mapping).read_text())
    if isinstance(mapping, dict):
        mapping = mapping.get('urls', mapping.get('entries'))
    replacement = {row['sourceUrl']: row['bookUrl'] for row in mapping}
    actual = {row['url'] for row in inventory['urls']}
    assert set(replacement) == actual, 'Mapping must exactly cover extracted placed URLs'
    with zipfile.ZipFile(source) as z:
        originals = {info.filename: z.read(info.filename) for info in z.infolist()}
    files = dict(originals)
    changed_rels = 0
    changed_visible = 0
    placed_rids = {}
    for row in inventory['docx']['hyperlinks']:
        placed_rids.setdefault(row['part'], set()).add(row['rid'])
    for name in list(files):
        if name.endswith('.xml') and name.startswith('word/'):
            root = etree.fromstring(files[name])
            changed = sum(replace_spanning_text(p, replacement)
                          for p in root.xpath('//w:p', namespaces=NS))
            if changed:
                files[name] = etree.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)
                changed_visible += changed
        if name.endswith('.rels'):
            root = etree.fromstring(files[name])
            changed = 0
            for rel in root:
                target = normalize(rel.get('Target', ''))
                if rel.get('Type', '').endswith('/hyperlink') and target in replacement:
                    rel.set('Target', replacement[target])
                    changed += 1
            if changed:
                files[name] = etree.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)
                changed_rels += changed
    placed_qrs = {}
    for row in inventory['docx']['qr_placements']:
        media = row['media']
        target = replacement[row['normalized_url']]
        if media in placed_qrs and placed_qrs[media] != target:
            raise ValueError('A shared QR image has conflicting targets')
        placed_qrs[media] = target
    qr_meta = []
    qr_dir = Path(args.output).parent / 'QR_book_v1'
    qr_dir.mkdir(parents=True, exist_ok=True)
    for media, target in placed_qrs.items():
        qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_Q,
                           box_size=12, border=4)
        qr.add_data(target)
        qr.make(fit=True)
        image = qr.make_image(fill_color='black', back_color='white')
        data = io.BytesIO()
        image.save(data, format='PNG')
        files[media] = data.getvalue()
        row = next(row for row in mapping if row['bookUrl'] == target)
        qr_name = row['id'] + '.png'
        (qr_dir / qr_name).write_bytes(files[media])
        qr_meta.append({'id': row['id'], 'url': target, 'media': media,
                        'file': qr_name, 'modules': qr.modules_count,
                        'quiet_zone_modules': 4, 'error_correction': 'Q',
                        'sha256': hashlib.sha256(files[media]).hexdigest()})
    target = Path(args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as z:
        for name, data in files.items():
            z.writestr(name, data)
    report = {'source_name': source.name,
              'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
              'candidate_name': target.name,
              'candidate_sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
              'status': 'release-candidate; fixed destinations not yet published',
              'hyperlink_relationships_updated': changed_rels,
              'visible_url_occurrences_updated': changed_visible,
              'placed_qr_images_updated': len(placed_qrs),
              'changed_zip_parts': [name for name in files if files[name] != originals[name]],
              'qr': qr_meta}
    Path(args.report).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({key: value for key, value in report.items()
                      if key not in ('qr', 'changed_zip_parts')}, ensure_ascii=False))


if __name__ == '__main__':
    main()

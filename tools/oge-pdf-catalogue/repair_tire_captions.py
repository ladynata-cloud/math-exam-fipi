"""Remove the clipped full exam page behind the two captions of the tire figure.

Run on a restored catalogue after building PDFs, or pass --figure to clean the
original assets/context/fipi_tires_clean.pdf before compiling future editions.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
from tempfile import TemporaryDirectory

import fitz


# Identity of the original two-page spread embedded under each caption.
SPREAD_SHA256 = '500748b40f6062c04fda9d392a765c7db1782169047a585009b797a35e0257e0'
CAPTION_OPERATORS = re.compile(
    rb'/TT1 1 Tf\s+0 -9\.6501 9\.6501 0 300\.691 (?:302\.6948|142\.0449)'
    rb' Tm\s+-\.0005 Tc\s+<[0-9a-fA-F]+>Tj'
)
COLLECTION = 'collections/OGE_2027_vse_104_varianta.pdf'


def caption_text(page):
    # Unlike get_text(), the trace also visits text outside a nested form's clip.
    return ''.join(chr(char[0]) for span in page.get_texttrace() for char in span['chars'])


def verify_captions(page):
    text = ''.join(caption_text(page).split())
    if ('Демонстрационныйвариант' in text
            or any(text.count(label) != 1 for label in ('Рис.1', 'Рис.2'))):
        raise ValueError(f'Unexpected extracted tire captions on page {page.number + 1}')


def ref(doc, obj, key):
    kind, value = doc.xref_get_key(obj, key)
    if kind != 'xref':
        raise ValueError(f'Expected PDF object reference for {key}')
    return int(value.split()[0])


def repair_page(page):
    doc = page.parent
    forms = page.get_xobjects()
    spread = next((obj for obj, _, _, _ in forms
                   if hashlib.sha256(doc.xref_stream(obj)).hexdigest() == SPREAD_SHA256), None)
    if spread is None:
        verify_captions(page)
        return False
    # Keep just each caption's original text matrix, font, spacing and glyphs.
    # The shared imported page rotates the coordinate system by 90 degrees.
    commands = CAPTION_OPERATORS.findall(doc.xref_stream(spread))
    if len(commands) != 2:
        raise ValueError('The source spread no longer contains the expected two captions.')
    font = ref(doc, spread, 'Resources/Font/TT1')
    figure, = (parent for _, name, parent, _ in forms if name == 'fzFrm1')
    captions = {name: obj for obj, name, parent, _ in forms if parent == figure}
    for name, command in zip(('fzFrm0', 'fzFrm1'), commands):
        wrapper = captions[name]
        doc.xref_set_key(wrapper, 'Resources', f'<< /Font << /TT1 {font} 0 R >> >>')
        doc.update_stream(wrapper, b'q 0 1 -1 0 842 0 cm BT 0 g 0 Tw ' + command + b' ET Q')
    return True


def stage_pdf(source, output, pages):
    with fitz.open(source) as doc:
        changed = False
        for number in pages:
            changed |= repair_page(doc[number])
        if not changed:
            return False
        doc.save(output, garbage=3, deflate=True, no_new_id=True)
    with fitz.open(output) as doc:
        for number in pages:
            verify_captions(doc[number])
    return True


def repair_catalogue(root):
    manifest = root / 'manifest.json'
    catalogue = json.loads(manifest.read_text())
    collection = root / COLLECTION
    variants = [item for item in catalogue['variants'] if item['type'] == 'tires']
    with fitz.open(collection) as doc:
        bookmarks = {title: page - 1 for _, title, page in doc.get_toc()}
    pages = [bookmarks[f'Вариант {item["number"]:02d}'] for item in variants]
    with TemporaryDirectory(dir=root) as temp:
        staging = Path(temp)
        outputs = {}
        for item in variants:
            record = item['files']['variant']
            source = root / record['path']
            target = staging / source.name
            if stage_pdf(source, target, [0]):
                record['sha256'] = hashlib.sha256(target.read_bytes()).hexdigest()
                record['bytes'] = target.stat().st_size
                outputs[target] = source
        target = staging / collection.name
        if stage_pdf(collection, target, pages):
            outputs[target] = collection
        if outputs:
            updated = staging / manifest.name
            updated.write_text(json.dumps(catalogue, ensure_ascii=False, indent=2))
            outputs[updated] = manifest
            for staged, destination in outputs.items():
                staged.replace(destination)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('catalogue', type=Path, nargs='?')
    parser.add_argument('--figure', type=Path, help='Repair the shared source figure in place')
    args = parser.parse_args()
    if bool(args.figure) == bool(args.catalogue):
        parser.error('Pass either the catalogue directory or --figure FILE')
    if args.figure:
        with TemporaryDirectory(dir=args.figure.parent) as temp:
            output = Path(temp) / args.figure.name
            if stage_pdf(args.figure, output, [0]):
                output.replace(args.figure)
    else:
        repair_catalogue(args.catalogue)

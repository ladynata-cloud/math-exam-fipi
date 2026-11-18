#!/usr/bin/env python3
"""Rebuild reviewed print replacements from a copy of the 104-variant archive."""

import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import subprocess
import sys

import fitz


PATCH = Path(__file__).with_name('author-replacements-20261117')
THEMATIC = Path(__file__).with_name('thematic-replacements-20261117')
EXPECTED_POSITIONS = {(variant, task) for variant in (1, 6) for task in (7, 11, 13)}
THEMATIC_POSITIONS = {(11, 10), (11, 14), (11, 16), (12, 14), (12, 22)}


def load_bank(archive):
    bank_file = archive / 'materials/bank.json'
    original = bank_file.read_bytes()
    patch = json.loads((PATCH / 'replacements.json').read_text())
    if hashlib.sha256(original).hexdigest() != patch['bank_sha256']:
        raise ValueError('Use a fresh copy of the original 104-variant source archive.')
    bank = json.loads(original)
    thematic = json.loads((THEMATIC / 'replacements.json').read_text())
    for folder, rows, expected in (
        (PATCH, patch['replacements'], EXPECTED_POSITIONS),
        (THEMATIC, thematic, THEMATIC_POSITIONS),
    ):
        positions = [(row['variant'], row['task']) for row in rows]
        if len(positions) != len(expected) or set(positions) != expected:
            raise ValueError(f'Unexpected replacement positions in {folder.name}.')
        for row in rows:
            variant = bank['variants'][row['variant'] - 1]
            index = row['task'] - 1
            old = variant['tasks'][index]
            new = row['replacement']
            if (variant['number'], variant['id'], old['number'], new['number']) != (
                row['variant'], row['variant_id'], row['task'], row['task']
            ) or any(old[key] != value for key, value in row['expected'].items()):
                raise ValueError(f'Unexpected original task {row["variant"]}.{row["task"]}.')
            if (new['part'], new['points']) != (old['part'], old['points']):
                raise ValueError(f'Changed format at {row["variant"]}.{row["task"]}.')
            if new.get('figure_asset'):
                asset = Path(new['figure_asset'])
                if asset.parent != Path('assets/part1_a') or asset.suffix != '.pdf':
                    raise ValueError(f'Unexpected asset path {asset}.')
                with fitz.open(folder / asset.with_suffix('.svg').name) as figure:
                    (archive / asset).write_bytes(figure.convert_to_pdf())
            variant['tasks'][index] = new
    bank_file.write_text(json.dumps(bank, ensure_ascii=False, indent=2) + '\n')
    return bank


def rebuild(archive):
    bank = load_bank(archive)
    sys.path.insert(0, str(archive / 'source'))
    from build_materials import (
        COLLECTION_NAMES, LAYOUT, compile_pdf, learner, merge_pdfs, single_answers, solutions,
    )

    specs = []
    revised_variants = sorted({variant for variant, _ in EXPECTED_POSITIONS | THEMATIC_POSITIONS})
    LAYOUT['continue_part2_after_task19'].extend([1, 6])
    for number in revised_variants:
        variant = bank['variants'][number - 1]
        prefix = f'OGE_2027_{number:03d}'
        specs.extend((
            (prefix + '_variant', learner_source(learner(variant), number)),
            (prefix + '_otvety', single_answers(variant)),
            (prefix + '_reshenie', solutions({'variants': [variant]})),
        ))
    with ThreadPoolExecutor(max_workers=3) as pool:
        results = list(pool.map(lambda spec: compile_pdf(*spec), specs))
    if any(row['warnings'] for row in results):
        raise ValueError(json.dumps(results, ensure_ascii=False))

    for kind, label in (('variant', 'Вариант'), ('otvety', 'Ответы'), ('reshenie', 'Решение')):
        numbers = [variant['number'] for variant in bank['variants']]
        paths = [archive / 'pdf' / f'OGE_2027_{number:03d}_{kind}.pdf' for number in numbers]
        titles = [f'{label} {number:02d}' for number in numbers]
        collection = archive / COLLECTION_NAMES[kind]
        results.append(merge_pdfs(paths, collection, titles))
        if kind == 'variant':
            compact_collection(collection)
    subprocess.run([sys.executable, str(archive / 'source/build_site.py')], check=True)
    manifest = archive / 'publication/oge/variants/2027/manifest.json'
    catalogue = json.loads(manifest.read_text())
    catalogue.update(edition='2027-104-v2', date='2026-11-17')
    manifest.write_text(json.dumps(catalogue, ensure_ascii=False, indent=2))
    print(json.dumps(results, ensure_ascii=False, indent=2))


def compact_collection(collection):
    """Remove duplicate PDF objects without resampling figures or fonts."""
    temporary = collection.with_suffix('.compact.pdf')
    with fitz.open(collection) as original:
        outline = original.get_toc()
        original.save(temporary, garbage=4, deflate=True, use_objstms=1)
    with fitz.open(temporary) as compact:
        if compact.get_toc() != outline:
            raise ValueError('Compaction changed the collection bookmarks.')
    temporary.replace(collection)


def learner_source(content, number):
    if number != 11:
        return content
    # Keep the reminder with the directions when the revised part 2 fills its page.
    notice = r'\textit{Проверьте, что все ответы перенесены в лист записи ответов.}'
    directions = r'Калькулятор не используется.\par'
    if content.count(r'\vfill' + notice) != 1 or content.count(directions) != 1:
        raise ValueError('Unexpected layout for the answer reminder in variant 11.')
    return content.replace(r'\vfill' + notice, '').replace(directions, directions + notice + r'\par')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path, help='Writable copy of the restored source archive')
    rebuild(parser.parse_args().archive.resolve())

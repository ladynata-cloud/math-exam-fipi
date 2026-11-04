#!/usr/bin/env python3
"""Build the student catalog from source metadata and authored lesson records.

Raw textbook extracts are deliberately not a build input. The source index contains
number/page metadata only. Reviewed flags are a content-review decision, never
assigned by this builder. Existing generic task families do not count as exercises.
"""
import argparse
import json
from pathlib import Path


def identity(source):
    collection = source['collection']
    local_chapter = source.get('chapter') if collection in ('selfcheck', 'example') else None
    return (collection, source.get('examTask'), local_chapter,
            source.get('exercise'), source.get('point'))


def build(source_index, lessons):
    sources = {identity(entry['source']): entry for entry in source_index['entries']}
    if len(sources) != len(source_index['entries']):
        raise ValueError('Duplicate source number/point')
    grouped = {}
    ids = set()
    for lesson in lessons:
        if lesson['id'] in ids:
            raise ValueError('Duplicate lesson id: ' + lesson['id'])
        ids.add(lesson['id'])
        key = identity(lesson['source'])
        original = sources.get(key)
        if original is None:
            raise ValueError('Lesson is not in the source index: ' + lesson['id'])
        if lesson['source']['bookId'] != source_index['book']['id']:
            raise ValueError('Wrong book identity')
        if not set(lesson['source']['printedPages']).issubset(original['source']['printedPages']):
            raise ValueError('Authored page is outside the source range: ' + lesson['id'])
        grouped.setdefault(key, []).append(lesson)
    entries = []
    for original in source_index['entries']:
        authored = grouped.get(identity(original['source']), [])
        if authored:
            expected_parts = original.get('requiredParts')
            if not isinstance(expected_parts, list) or not expected_parts:
                raise ValueError('Source completeness contract has not been reviewed: ' + original['id'])
            if len(set(expected_parts)) != len(expected_parts):
                raise ValueError('Duplicate required source part: ' + original['id'])
            for lesson in authored:
                if lesson['source'].get('subpart') not in expected_parts:
                    raise ValueError('Authored part is not in the reviewed source contract: ' + lesson['id'])
                entries.append({key: lesson[key] for key in
                                ('id', 'revision', 'kind', 'title', 'status', 'source')})
            # This includes unlettered questions and theorem components. A checked
            # part is never evidence that the whole source exercise/point is ready.
            present = {x['source'].get('subpart') for x in authored}
            for index, part in enumerate(expected_parts):
                if part not in present:
                    source = {**original['source']}
                    if part is not None:
                        source['subpart'] = part
                    entries.append({'id': original['id'] + '-part-' + str(index + 1),
                                    'revision': 1, 'kind': original['kind'],
                                    'title': original['title'] + ' · готовится часть разбора',
                                    'status': 'draft', 'source': source})
        else:
            entries.append({**{key: original[key] for key in
                               ('id', 'kind', 'title', 'source')},
                            'revision': 1, 'status': 'draft'})
    return {'catalog': {'schemaVersion': 1, 'book': source_index['book'],
                        'inventoryComplete': source_index['inventoryComplete'],
                        'entries': entries}, 'lessons': lessons}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[2])
    args = parser.parse_args()
    course = args.root / 'stereo-course/textbook'
    source_index = json.loads((course / 'source-index.json').read_text())
    lessons = [json.loads(path.read_text()) for path in sorted((course / 'lessons').glob('*.json'))]
    result = build(source_index, lessons)
    target = course / 'data/course.json'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(json.dumps({'sourcePositions': len(source_index['entries']),
                      'authoredCards': len(lessons),
                      'reviewedCards': sum(x['status'] == 'reviewed' for x in lessons),
                      'bytes': target.stat().st_size}))


if __name__ == '__main__':
    main()

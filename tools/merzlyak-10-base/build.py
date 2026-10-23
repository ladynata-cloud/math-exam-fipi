#!/usr/bin/env python3
"""Build Merzlyak's isolated course using the retained source-coverage contract.

This builder does not author solutions, infer missing subparts or promote reviews.
The full uploaded PDF and OCR files are deliberately not build inputs.
"""
import argparse
import copy
import importlib.util
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[2])
    args = parser.parse_args()
    root = args.root.resolve()
    shared = root / 'tools/stereo-textbook/build_textbook.py'
    spec = importlib.util.spec_from_file_location('retained_textbook_builder', shared)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    course = root / 'stereo-course/merzlyak-10-base'
    source_index = json.loads((course / 'source-index.json').read_text(encoding='utf-8'))
    if source_index['book']['id'] != 'merzlyak-2022-10-base':
        raise ValueError('Wrong source book for this isolated course')
    lessons = [json.loads(path.read_text(encoding='utf-8'))
               for path in sorted((course / 'lessons').glob('*.json'))]
    # Keep bibliographic and inventory-only metadata in the source files. The
    # retained runtime contract accepts only its explicit book/source fields.
    # No review, condition, step or completeness flag is inferred here.
    schema = json.loads((root / 'stereo-course/textbook/schema/catalog.schema.json')
                        .read_text(encoding='utf-8'))
    book_keys = set(schema['properties']['book']['properties'])
    source_keys = set(schema['$defs']['source']['properties'])

    def canonical_source(source):
        return {key: value for key, value in source.items() if key in source_keys}

    canonical_index = copy.deepcopy(source_index)
    canonical_index['book'] = {key: value for key, value in source_index['book'].items()
                               if key in book_keys}
    for entry in canonical_index['entries']:
        entry['source'] = canonical_source(entry['source'])
    canonical_lessons = copy.deepcopy(lessons)
    for lesson in canonical_lessons:
        lesson['source'] = canonical_source(lesson['source'])
        for step in lesson.get('steps', []):
            for justification in step.get('justifications', []):
                if 'source' in justification:
                    justification['source'] = canonical_source(justification['source'])
    result = module.build(canonical_index, canonical_lessons)
    target = course / 'data/course.json'
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n',
                      encoding='utf-8')
    print(json.dumps({'sourcePositions': len(source_index['entries']),
                      'authoredCards': len(lessons),
                      'reviewedCards': sum(lesson['status'] == 'reviewed' for lesson in lessons),
                      'catalogEntries': len(result['catalog']['entries'])}))


if __name__ == '__main__':
    main()

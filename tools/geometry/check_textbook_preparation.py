#!/usr/bin/env python3
"""Validate an authoring handoff, without treating drafts as published lessons."""
import json
import hashlib
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
COURSE = ROOT / 'geometry-course' / 'textbook'


def require(condition, message):
    if not condition:
        raise ValueError(message)


def nonempty(value):
    return isinstance(value, str) and bool(value.strip())


def check_chapter(chapter):
    require(chapter['bookId'] == 'atanasyan-2023-7-9', 'Wrong source edition')
    require(chapter['status'] == 'draft-content-preparation', 'Draft status lost')
    require(chapter['source']['pageOffset'] == 1, 'Wrong PDF page offset')
    exercises = chapter['exercises']
    numbers = [item['number'] for item in exercises]
    require(numbers == list(range(1, 92)), 'Expected each chapter I number 1–91 once, in order')
    count = 0
    unresolved = []
    source_unchecked = []
    for item in exercises:
        number = item['number']
        pages = item['printedPages']
        require(isinstance(pages, list) and pages, f'{number}: missing source pages')
        require(all(type(p) is int and 5 <= p <= 28 for p in pages), f'{number}: outside chapter I')
        require(len(pages) == len(set(pages)), f'{number}: duplicate page')
        require(item['pdfPages'] == [p + 1 for p in pages], f'{number}: mismatched PDF pages')
        parts = item['parts']
        require(isinstance(parts, list) and parts, f'{number}: missing parts')
        keys = [p['part'] for p in parts]
        require(all(nonempty(p) for p in keys) and len(keys) == len(set(keys)), f'{number}: invalid/duplicate part')
        for part in parts:
            key = f"{number}:{part['part']}"
            count += 1
            for field in ('conditionSummary', 'answer'):
                require(nonempty(part[field]), f'{key}: missing {field}')
            require(isinstance(part['steps'], list) and part['steps'] and
                    all(nonempty(x) for x in part['steps']), f'{key}: missing authored steps')
            visual = part['visual']
            require(nonempty(visual['initial']), f'{key}: missing task-specific visual plan')
            require(isinstance(visual['stepChanges'], list), f'{key}: invalid step changes')
            require(isinstance(visual['cases'], list), f'{key}: invalid case views')
            for field in ('sourceVerified', 'mathVerified'):
                require(type(part[field]) is bool, f'{key}: invalid author self-check flag')
            if not part['sourceVerified']:
                source_unchecked.append(key)
            if not part['mathVerified']:
                unresolved.append(key)
    return {'preparedNumbers': len(exercises), 'preparedParts': count,
            'authorSourceUncheckedParts': source_unchecked,
            'authorMathematicsUnresolvedParts': unresolved,
            'implementedInteractiveModels': 0, 'publishedNewNumbers': 0,
            'readyToPublish': False}


def check_inventory(inventory):
    book = inventory['book']
    require(book['id'] == 'atanasyan-2023-7-9', 'Inventory edition mismatch')
    require(book['pdfPageOffset'] == 1 and book['pdfPageCount'] == 417 and
            book['printedPageCount'] == 416, 'Inventory pagination mismatch')
    require(book['sourceSha256'] == '3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72',
            'Source fingerprint changed; rescan the source instead of reusing this inventory')
    require([x['chapter'] for x in inventory['chapters']] == list(range(1, 16)),
            'Expected chapters I–XV exactly once')
    numbers = []
    for item in inventory['chapters'] + inventory['advanced']:
        first, last = item['exerciseNumbers']
        require(item['numberCount'] == last - first + 1, 'Section count mismatch')
        numbers.extend(range(first, last + 1))
        lo, hi = item['printedPages']
        require(5 <= lo <= hi <= 364, 'Section page range invalid')
    require(sorted(numbers) == list(range(1, 1432)), 'Number ranges overlap or omit exercises')
    review_count = sum(x['reviewQuestions']['count'] for x in inventory['chapters'])
    require(review_count == 315 == inventory['summary']['reviewQuestionCount'],
            'Review-question counts disagree')
    namespaces = [x['reviewQuestions']['namespace'] for x in inventory['chapters']]
    namespaces += [x['namespace'] for x in inventory['research']]
    require(len(namespaces) == len(set(namespaces)), 'Repeated numbering namespaces')
    research_count = sum(x['numbers'][1] - x['numbers'][0] + 1 for x in inventory['research'])
    require(research_count == 14, 'Research count mismatch')
    require(sum(inventory['complexTasks']['subpartCounts']) == 24 and
            inventory['complexTasks']['labelledOGE'] is False, 'Complex-task metadata mismatch')
    for field in ('everyExerciseSourcePageVerified', 'subpartInventoryComplete',
                  'solutionsComplete', 'fullCourseReady', 'appendixTaskInventoryComplete',
                  'theoryWorkedExampleInventoryComplete'):
        require(inventory['status'][field] is False, f'Unsupported completeness claim: {field}')
    return {'sourceContinuousNumbers': len(numbers), 'sourceChapterCount': 15,
            'sourceReviewQuestions': review_count, 'sourceResearchTasks': research_count}


def main():
    content_path = COURSE / 'preparation/chapter-01.json'
    chapter = json.loads(content_path.read_text())
    report = check_chapter(chapter)
    inventory = json.loads((COURSE / 'source-inventory.json').read_text())
    report.update(check_inventory(inventory))
    review = json.loads((COURSE / 'preparation/chapter-01-review.json').read_text())
    require(review['contentSHA256'] == hashlib.sha256(content_path.read_bytes()).hexdigest(),
            'Independent review is for a different content version')
    require(review['sourceSHA256'] == inventory['book']['sourceSha256'], 'Review source mismatch')
    require(review['publicationApproved'] is False, 'Preparation is not publication approval')
    checks = review['exerciseChecks']
    require([x['number'] for x in checks] == list(range(1, 92)), 'Incomplete independent-review ledger')
    for item, checked in zip(chapter['exercises'], checks):
        require(checked['partsReviewed'] == [p['part'] for p in item['parts']],
                f"{item['number']}: independent review part mismatch")
        require(checked['printedPages'] == item['printedPages'], 'Independent review page mismatch')
        require(checked['executableModel'] == 'not-reviewed-not-implemented',
                'Textual review cannot stand in for a model review')
    require([x['number'] for x in checks if x['mathematics'] != 'passed'] == [9, 10, 44],
            'Interpretation flags were lost or changed; review again')
    report['independentlyReviewedDraftParts'] = sum(len(x['partsReviewed']) for x in checks)
    # Passing this gate only validates the preparation handoff. The raw author's
    # flags are not independent review and are never promoted to reviewed status.
    print(json.dumps({'gate': 'ATANASYAN_7_9_PREPARATION_STRUCTURE_OK', **report},
                     ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Compose the exact-edition geometry course, without manufacturing review approval.

The previously reviewed preparation remains frozen. Independently reviewed source
corrections and task-specific scenes are separate inputs. Each chapter requires
its own review manifest tied to its normalized authored-content SHA256 and the
shared runtime SHA256; adding a chapter cannot approve it implicitly.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
COURSE = ROOT / 'geometry-course/textbook'


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True,
                                     separators=(',', ':')).encode()).hexdigest()


CHAPTER_LABELS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII',
                  'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV']


def key(chapter, collection, number, part='single'):
    return (chapter, collection, int(number), part)


def identifier(collection, number, index, chapter=1):
    # Main exercises and theory points are numbered across the book. Review
    # questions restart in each chapter; retain the already published I IDs.
    namespace = f'{collection}-chapter-{chapter}' if collection == 'selfcheck' and chapter != 1 else collection
    return f'atanasyan-7-9-{namespace}-{number}-part-{index}'


def preparations(course, inventory):
    """Read one complete preparation or explicitly split authoring fragments."""
    files = {}
    for path in sorted((course / 'preparation').glob('chapter-*.json')):
        match = re.fullmatch(r'chapter-(\d{2})(?:-([a-z]))?\.json', path.name)
        if match:
            files.setdefault(int(match[1]), []).append(path)
    known = {item['chapter']: item for item in inventory['chapters']}
    chapters = {}
    for chapter, paths in sorted(files.items()):
        if chapter not in known:
            raise ValueError(f'Unknown source chapter {chapter}')
        if len(paths) > 1 and any(path.name == f'chapter-{chapter:02d}.json' for path in paths):
            raise ValueError(f'Mixed complete and fragmented preparation for chapter {chapter}')
        exercises = []
        for path in paths:
            data = read(path)
            if data.get('chapter') != chapter or data.get('bookId') != inventory['book']['id']:
                raise ValueError(f'Preparation belongs to another edition or chapter: {path.name}')
            exercises.extend(data['exercises'])
        exercises.sort(key=lambda item: int(item['number']))
        first, last = known[chapter]['exerciseNumbers']
        if [int(item['number']) for item in exercises] != list(range(first, last + 1)):
            raise ValueError(f'Chapter {chapter} must contain every exercise {first}–{last} exactly once')
        for exercise in exercises:
            parts = [item['part'] for item in exercise['parts']]
            if not parts or len(set(parts)) != len(parts):
                raise ValueError(f'Empty/duplicate exercise parts: {chapter}/{exercise["number"]}')
        theory_path = course / f'preparation/chapter-{chapter:02d}-theory.json'
        theory = read(theory_path) if theory_path.exists() else {'theory': [], 'selfchecks': []}
        if theory_path.exists() and (theory.get('chapter') != chapter or theory.get('bookId') != inventory['book']['id']):
            raise ValueError(f'Theory belongs to another edition or chapter: {theory_path.name}')
        first, last = known[chapter]['reviewQuestions']['numbers']
        if [int(item['number']) for item in theory['selfchecks']] != list(range(first, last + 1)):
            raise ValueError(f'Chapter {chapter} must contain every selfcheck {first}–{last} exactly once')
        if not theory['theory']:
            raise ValueError(f'Chapter {chapter} is missing theory')
        chapters[chapter] = dict(exercises=exercises, **theory)
    if not chapters:
        raise ValueError('No authored chapters')
    return chapters


def compose(course=COURSE):
    inventory = read(course / 'source-inventory.json')
    chapters = preparations(course, inventory)
    models = {}
    for path in sorted((course / 'models').glob('chapter-*.json')):
        match = re.fullmatch(r'chapter-(\d{2})-[a-z]+\.json', path.name)
        if not match:
            raise ValueError(f'Unexpected model filename: {path.name}')
        chapter = int(match[1])
        data = read(path)
        if data.get('chapter', chapter) != chapter:
            raise ValueError(f'Model chapter disagrees with filename: {path.name}')
        for item in data['models']:
            if item.get('chapter', chapter) != chapter:
                raise ValueError(f'Model item chapter disagrees with filename: {path.name}')
            identity = key(chapter, item.get('collection', 'main'), item['number'], item.get('part', 'single'))
            if identity in models:
                raise ValueError(f'Duplicate model {identity}')
            models[identity] = item
    corrections = {}
    for chapter in chapters:
        corrections_path = course / f'preparation/chapter-{chapter:02d}-corrections.json'
        if not corrections_path.exists():
            continue
        corrections_raw = read(corrections_path)
        if corrections_raw.get('bookId') != inventory['book']['id'] or corrections_raw.get('chapter') != chapter:
            raise ValueError('Corrections belong to another edition or chapter')
        prep_path = course / f'preparation/chapter-{chapter:02d}.json'
        if not prep_path.exists() or corrections_raw.get('preparationSha256') != hashlib.sha256(prep_path.read_bytes()).hexdigest():
            raise ValueError('Corrections are for a different preparation version')
        for item in corrections_raw.get('corrections', []):
            identity = key(chapter, item.get('collection', 'main'), item['number'], item.get('part', 'single'))
            if identity in corrections:
                raise ValueError(f'Duplicate correction {identity}')
            corrections[identity] = item
    book = {k: inventory['book'][k] for k in ('id', 'title', 'pdfPageCount', 'pdfPageOffset')}
    book['edition'] = 'Атанасян и др. · 7–9 классы · 14-е переработанное издание, 2023'
    book['title'] = 'Геометрия 7–9 · задачи учебника Атанасяна'
    entries, lessons, used = [], [], set()
    theory_ids = {}
    for chapter, prep in chapters.items():
        for item in prep['theory']:
            number = int(item['number'])
            if number in theory_ids:
                raise ValueError(f'Duplicate theory point {number}')
            theory_ids[number] = identifier('theory', number, 1, chapter)

    def card(chapter, collection, number, index, part, item, pages):
        identity = key(chapter, collection, number, part)
        ident = identifier(collection, number, index, chapter)
        source = dict(bookId=book['id'], collection=collection, chapter=CHAPTER_LABELS[chapter],
                      printedPages=pages, pdfPages=[p + 1 for p in pages])
        source['point' if collection == 'theory' else 'exercise'] = str(number)
        if part != 'single':
            source['subpart'] = part
        title = ('Пункт ' + str(number) + ' · ' + item.get('title', '') if collection == 'theory'
                 else 'Вопрос ' + str(number) if collection == 'selfcheck'
                 else 'Задача ' + str(number) + ('' if part == 'single' else ' · ' + part))
        entry = dict(id=ident, revision=1, kind='theory' if collection == 'theory' else 'exercise',
                     title=title, status='draft', source=source)
        entries.append(entry)
        if identity not in models:
            raise ValueError(f'Missing authored model: {identity}')
        used.add(identity)
        model_item = models[identity]
        correction = corrections.get(identity, {})
        if correction and (not correction.get('sourcePages') or not set(correction['sourcePages']).issubset(pages)):
            raise ValueError(f'Correction source pages disagree: {identity}')
        statement = correction.get('statementOverride', item.get('conditionSummary', item.get('statement', '')))
        answer = correction.get('answerOverride', item.get('answer', ''))
        explanations = correction.get('stepsOverride', item['steps'])
        didactics = model_item.get('didactics', item.get('didactics', {})).get('steps', [])
        if len(didactics) != len(explanations):
            raise ValueError(f'Missing authored didactics: {identity}: {len(didactics)}/{len(explanations)}')
        views = model_item['model']['views']
        steps, related = [], set()
        for i, (explanation, teaching) in enumerate(zip(explanations, didactics), 1):
            view = 'step-' + str(i)
            if view not in views:
                raise ValueError(f'Missing step scene {identity}: {view}')
            reason = teaching['justification']
            missing_points = set(teaching.get('theoryPoints', [])) - set(theory_ids)
            if missing_points:
                raise ValueError(f'Unknown theory reference {identity}: {sorted(missing_points)}')
            point_ids = [theory_ids[p] for p in teaching.get('theoryPoints', [])
                         if p in theory_ids and theory_ids[p] != ident]
            related.update(point_ids)
            justification = dict(kind=teaching.get('kind', 'reason'), text=reason)
            if point_ids:
                justification['theoryId'] = point_ids[0]
            steps.append(dict(id=f'step-{i}', title=f'Шаг {i}', prompt=teaching['prompt'],
                              explanation=explanation, view=view, justifications=[justification]))
        givens = list(dict.fromkeys(model_item.get('statementGivens', []) + correction.get('statementGivens', [])))
        goal = ('Рассмотри чертёж, ответь на вопрос каждого шага и проверь своё объяснение.' if collection == 'theory'
                else 'Сначала предложи своё решение. Подсказки и разбор можно открыть рядом.')
        statement_data = dict(text=statement, goal=goal)
        if givens:
            statement_data['givens'] = givens
        help_items = []
        if related:
            help_items.append(dict(id='recall-theory', question='Какие определения и свойства пригодятся?',
                                   text='Открой нужное объяснение и вернись к своему решению.',
                                   theoryIds=sorted(related)))
        if answer:
            help_items.append(dict(id='compare-result', question='Сверить итог рассуждения', text=answer))
        lesson = dict(schemaVersion=1, **entry, statement=statement_data,
                      visualization=dict(type='scene3d', caption='Чертёж помогает рассуждать. Измерение на экране не заменяет доказательство.', model=model_item['model']),
                      help=help_items, steps=steps)
        if collection != 'theory':
            lesson['answer'] = dict(mode='manual', prompt='Запиши ответ и объясни, как ты его получил.')
        lessons.append(lesson)

    for chapter, prep in chapters.items():
        for exercise in prep['exercises']:
            for i, part in enumerate(exercise['parts'], 1):
                card(chapter, 'main', exercise['number'], i, part['part'], part, exercise['printedPages'])
        for collection, items in [('theory', prep['theory']), ('selfcheck', prep['selfchecks'])]:
            for item in items:
                card(chapter, collection, item['number'], 1, 'single', item, item['printedPages'])
    if set(models) - used:
        raise ValueError(f'Models without matching source: {set(models) - used}')
    if set(corrections) - used:
        raise ValueError(f'Corrections without matching source: {set(corrections) - used}')
    content_hash = digest(lessons)
    implementation_files = ['index.html', 'assets/engine.js', 'assets/planar-viewer.js', 'assets/style.css', 'assets/math-text.js']
    implementation_hashes = {name: hashlib.sha256((course / name).read_bytes()).hexdigest()
                             for name in implementation_files if (course / name).exists()}
    implementation_hash = digest(implementation_hashes)
    chapter_builds = []
    for chapter, prep in chapters.items():
        chapter_lessons = [lesson for lesson in lessons if lesson['source']['chapter'] == CHAPTER_LABELS[chapter]]
        chapter_hash = digest(chapter_lessons)
        # The original manifest remains bound to exactly its published chapter.
        # A later chapter can neither inherit nor invalidate its content review.
        review_file = 'release-review.json' if chapter == 1 else f'release-review-chapter-{chapter:02d}.json'
        review_path = course / review_file
        review = read(review_path) if review_path.exists() else {}
        approved = (review.get('status') == 'passed' and review.get('authoredContentSha256') == chapter_hash
                    and review.get('implementationSha256') == implementation_hash
                    and review.get('scope', {}).get('chapter') == CHAPTER_LABELS[chapter]
                    and all(review.get(k) == 'passed' for k in ('source', 'mathematics', 'models', 'pedagogy', 'browser'))
                    and bool(review.get('reviewer')) and bool(review.get('at')))
        chapter_builds.append(dict(chapter=chapter, chapterLabel=CHAPTER_LABELS[chapter],
                                  authoredContentSha256=chapter_hash, publicationReviewMatches=approved,
                                  reviewFile=review_file, authoredCards=len(chapter_lessons),
                                  numberedExercises=len(prep['exercises']), theoryPoints=len(prep['theory']),
                                  selfcheckQuestions=len(prep['selfchecks'])))
        for lesson in chapter_lessons:
            lesson['status'] = 'reviewed' if approved else 'in-review'
            lesson['review'] = dict(source='passed' if approved else 'pending',
                                mathematics='passed' if approved else 'pending',
                                pedagogy='passed' if approved else 'pending',
                                reviewer=review.get('reviewer', '') if approved else '',
                                at=review.get('at', '') if approved else '')
    by_id = {lesson['id']: lesson for lesson in lessons}
    for entry in entries:
        if entry['id'] in by_id:
            entry['status'] = by_id[entry['id']]['status']
    return dict(catalog=dict(schemaVersion=1, book=book, inventoryComplete=False, entries=entries),
                lessons=lessons, sourceInventory=inventory,
                build=dict(authoredContentSha256=content_hash,
                           publicationReviewMatches=all(item['publicationReviewMatches'] for item in chapter_builds),
                           implementationSha256=implementation_hash, implementationFiles=implementation_hashes,
                           authoredCards=len(lessons), numberedExercises=sum(len(prep['exercises']) for prep in chapters.values()),
                           chapters=chapter_builds,
                           fullTextbookComplete=False))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    bundle = compose()
    serialized = json.dumps(bundle, ensure_ascii=False, separators=(',', ':')) + '\n'
    target = COURSE / 'data/course.json'
    if args.check:
        if not target.exists() or target.read_text() != serialized:
            raise SystemExit('Generated course differs; run build_course.py')
    else:
        target.parent.mkdir(exist_ok=True)
        target.write_text(serialized)
    print(json.dumps(bundle['build'], ensure_ascii=False))


if __name__ == '__main__':
    main()

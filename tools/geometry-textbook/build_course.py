#!/usr/bin/env python3
"""Compose the exact-edition geometry course, without manufacturing review approval.

The previously reviewed preparation remains frozen. Independently reviewed source
corrections and task-specific scenes are separate inputs. Publication requires a
review manifest tied to the complete normalized authored-content SHA256.
"""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
COURSE = ROOT / 'geometry-course/textbook'


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True,
                                     separators=(',', ':')).encode()).hexdigest()


def key(collection, number, part='single'):
    return (collection, int(number), part)


def identifier(collection, number, index):
    return f'atanasyan-7-9-{collection}-{number}-part-{index}'


def compose(course=COURSE):
    inventory = read(course / 'source-inventory.json')
    prep = read(course / 'preparation/chapter-01.json')
    theory_path = course / 'preparation/chapter-01-theory.json'
    theory = read(theory_path) if theory_path.exists() else {'theory': [], 'selfchecks': []}
    models = {}
    for path in sorted((course / 'models').glob('chapter-01-*.json')):
        for item in read(path)['models']:
            identity = key(item.get('collection', 'main'), item['number'], item.get('part', 'single'))
            if identity in models:
                raise ValueError(f'Duplicate model {identity}')
            models[identity] = item
    corrections_path = course / 'preparation/chapter-01-corrections.json'
    corrections_raw = read(corrections_path) if corrections_path.exists() else {'corrections': []}
    if corrections_path.exists():
        if corrections_raw.get('bookId') != inventory['book']['id'] or corrections_raw.get('chapter') != 1:
            raise ValueError('Corrections belong to another edition or chapter')
        if corrections_raw.get('preparationSha256') != hashlib.sha256((course / 'preparation/chapter-01.json').read_bytes()).hexdigest():
            raise ValueError('Corrections are for a different preparation version')
    corrections = {}
    for item in corrections_raw.get('corrections', []):
        identity = key(item.get('collection', 'main'), item['number'], item.get('part', 'single'))
        if identity in corrections:
            raise ValueError(f'Duplicate correction {identity}')
        corrections[identity] = item
    book = {k: inventory['book'][k] for k in ('id', 'title', 'pdfPageCount', 'pdfPageOffset')}
    book['edition'] = 'Атанасян и др. · 7–9 классы · 14-е переработанное издание, 2023'
    book['title'] = 'Геометрия 7–9 · задачи учебника Атанасяна'
    entries, lessons, used = [], [], set()
    theory_ids = {int(item['number']): identifier('theory', item['number'], 1) for item in theory['theory']}

    def card(collection, number, index, part, item, pages):
        identity = key(collection, number, part)
        ident = identifier(collection, number, index)
        source = dict(bookId=book['id'], collection=collection, chapter='I',
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
            return
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

    for exercise in prep['exercises']:
        for i, part in enumerate(exercise['parts'], 1):
            card('main', exercise['number'], i, part['part'], part, exercise['printedPages'])
    for collection, items in [('theory', theory['theory']), ('selfcheck', theory['selfchecks'])]:
        for item in items:
            card(collection, item['number'], 1, 'single', item, item['printedPages'])
    if set(models) - used:
        raise ValueError(f'Models without matching source: {set(models) - used}')
    if set(corrections) - used:
        raise ValueError(f'Corrections without matching source: {set(corrections) - used}')
    content_hash = digest(lessons)
    implementation_files = ['index.html', 'assets/engine.js', 'assets/planar-viewer.js', 'assets/style.css', 'assets/math-text.js']
    implementation_hashes = {name: hashlib.sha256((course / name).read_bytes()).hexdigest()
                             for name in implementation_files if (course / name).exists()}
    implementation_hash = digest(implementation_hashes)
    review_path = course / 'release-review.json'
    review = read(review_path) if review_path.exists() else {}
    approved = (review.get('status') == 'passed' and review.get('authoredContentSha256') == content_hash
                and review.get('implementationSha256') == implementation_hash
                and all(review.get(k) == 'passed' for k in ('source', 'mathematics', 'models', 'pedagogy', 'browser'))
                and bool(review.get('reviewer')) and bool(review.get('at')))
    for lesson in lessons:
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
                build=dict(authoredContentSha256=content_hash, publicationReviewMatches=approved,
                           implementationSha256=implementation_hash, implementationFiles=implementation_hashes,
                           authoredCards=len(lessons), numberedExercises=len(prep['exercises']),
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

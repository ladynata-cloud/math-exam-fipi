"""Admit only the independently reviewed 18-card supplement, preserving all1407.

The normal builder never creates approval. Missing, stale or incomplete receipts
leave the new cards in-review. Release validation additionally checks the exact
previous bundle and rejects an unreviewed supplement before publication.
"""
from copy import deepcopy
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PREFIX = 'geometry-course/textbook/'
KEY = '8-advanced-824-841'
LABEL = '8 класс · повышенная трудность'
SOURCE_FILE = 'preparation/grade-08-advanced-824-841.json'
REVIEW_FILE = 'release-review-advanced-08-824-841.json'
SOURCE_PDF_SHA = '3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72'
BASE_BUNDLE_SHA = '84563ef900b15174be7f4dcb03bd450254bcce7789a90a364ae4b9ddf2de4911'
BASE_SCOPE_SHA = 'f896cf49c71c28043ea37e8acb249e3e48edd3fc21f9561e52f09295ededf5ee'
SCOPE = dict(key=KEY, label=LABEL, exerciseNumbers=[824, 841], mainParts=18, cards=18)
REVIEW_SCOPE = dict(key=KEY, grade=8, exerciseNumbers=[824, 841], cards=18,
                    solutionSteps=72, views=94, geometricClaims=220,
                    fullTextbookComplete=False)
RUNTIME = ('index.html', 'assets/engine.js', 'assets/planar-viewer.js',
           'assets/style.css', 'assets/math-text.js', 'source-inventory.json',
           'assets/board-adapter.js')
IMPLEMENTATION = ('tools/geometry-textbook/build_course.py',
                  'tools/geometry-textbook/advanced8_release.py')
MATH_EVIDENCE = 'docs/reviews/ATANASYAN_8_824_841_INDEPENDENT_REVIEW.md'
NUMERIC_EVIDENCE = 'docs/reviews/ATANASYAN_8_824_841_INDEPENDENT_NUMERIC.json'
VISUAL_EVIDENCE = 'docs/reviews/ATANASYAN_8_824_841_SOURCE_VISUAL_REVIEW.json'
EVIDENCE = (MATH_EVIDENCE, NUMERIC_EVIDENCE, VISUAL_EVIDENCE)


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def read(path):
    return json.loads(Path(path).read_bytes())


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def encoded(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()


def serialized(value):
    return (json.dumps(value, ensure_ascii=False, separators=(',', ':')) + '\n').encode()


def digest(value):
    return sha(json.dumps(value, ensure_ascii=False, sort_keys=True,
                          separators=(',', ':')).encode())


def draft_rows(rows):
    result = deepcopy(rows)
    for row in result:
        row.pop('review', None)
        row['status'] = 'draft'
    return result


def has_supplement(bundle=None, scope=None):
    return bool((scope and any(x.get('key') == KEY for x in scope.get('supplements', [])))
                or (bundle and (any(x.get('key') == KEY for x in bundle['build'].get('supplements', []))
                    or any(x['source'].get('advancedGrade') == 8 for x in bundle['lessons']))))


def previous_scope(scope):
    """Remove only the exact18-card suffix; preserve every earlier scope byte."""
    if not any(x.get('key') == KEY for x in scope.get('supplements', [])):
        return deepcopy(scope)
    require(scope['supplements'][-1:] == [SCOPE] and scope['totalCards'] == 1425,
            'Wrong advanced8 release scope')
    old = deepcopy(scope)
    old['supplements'].pop()
    old['totalCards'] -= 18
    require(sha(encoded(old)) == BASE_SCOPE_SHA, 'Previous1407 release scope changed')
    return old


def validate_source(source):
    if (source.get('schemaVersion') != 1 or source.get('bookId') != 'atanasyan-2023-7-9'
            or source.get('grade') != 8 or source.get('source', {}).get('sha256') != SOURCE_PDF_SHA
            or source['source'].get('printedPages') != [214, 215]
            or source['source'].get('pdfPages') != [215, 216]):
        raise ValueError('Wrong advanced8 exact source edition/pages')
    cards = source['cards']
    if [c['number'] for c in cards] != list(range(824, 842)):
        raise ValueError('Advanced8 must contain every exercise824-841 exactly once')
    if (sum(len(c['steps']) for c in cards) != 72
            or sum(len(c['model']['views']) for c in cards) != 94
            or sum(len(c['model']['checks']) for c in cards) != 220):
        raise ValueError('Advanced8 prepared step/view/claim scope changed')
    for c in cards:
        page = 214 if c['number'] <= 834 else 215
        if (c.get('part') != 'single' or c['printedPages'] != [page]
                or c['pdfPages'] != [page + 1]
                or c['sourceFigures'] != ([274] if c['number'] == 837 else [])):
            raise ValueError('Advanced8 source part/page/figure mismatch')
        if not c['condition'].strip() or not c['answer'].strip():
            raise ValueError('Advanced8 condition and answer are required')
        if 'neutral' not in c['model']['views']:
            raise ValueError('Missing authored model neutral view')
        for i, step in enumerate(c['steps'], 1):
            if f'step-{i}' not in c['model']['views']:
                raise ValueError('Missing authored model step')
            if not all(step.get(k, '').strip() for k in ('prompt', 'explanation', 'justification')):
                raise ValueError('Missing advanced8 explanation')
    return source


def authored_rows(base, source):
    """The same stable identities and teaching as the explicit reviewed preview."""
    validate_source(source)
    theory = {int(row['source']['point']): row['id'] for row in base['lessons']
              if row['source']['collection'] == 'theory'}
    rows = []
    for c in source['cards']:
        number = c['number']
        ident = f'atanasyan-7-9-main-{number}-part-1'
        origin = dict(bookId=source['bookId'], collection='main', chapter=LABEL,
                      advancedGrade=8, relatedChapters=[6], exercise=str(number),
                      printedPages=c['printedPages'], pdfPages=c['pdfPages'])
        entry = dict(id=ident, revision=1, kind='exercise', title=f'Задача {number}',
                     status='draft', source=origin)
        steps, related = [], set()
        for i, step in enumerate(c['steps'], 1):
            if not set(step['theoryPoints']) <= set(theory):
                raise ValueError('Unknown advanced8 theory reference')
            refs = [theory[p] for p in step['theoryPoints']]
            related.update(refs)
            reason = dict(kind='reason', text=step['justification'])
            if refs:
                reason['theoryId'] = refs[0]
            steps.append(dict(id=f'step-{i}', title=f'Шаг {i}', prompt=step['prompt'],
                              explanation=step['explanation'], view=f'step-{i}',
                              justifications=[reason]))
        help_items = []
        if related:
            help_items.append(dict(id='recall-theory',
                                   question='Какие определения и свойства пригодятся?',
                                   text='Открой нужное объяснение и вернись к своему решению.',
                                   theoryIds=sorted(related)))
        help_items.append(dict(id='compare-result', question='Сверить итог рассуждения',
                               text=c['answer']))
        rows.append(dict(schemaVersion=1, **entry,
                         statement=dict(text=c['condition'],
                                        goal='Сначала предложи своё решение. Подсказки и разбор можно открыть рядом.'),
                         visualization=dict(type='scene3d',
                                            caption='Измерение на чертеже не заменяет доказательство.',
                                            model=deepcopy(c['model'])),
                         help=help_items, steps=steps,
                         answer=dict(mode='manual', prompt='Запиши ответ и объясни рассуждение.')))
    if set(row['id'] for row in rows) & set(row['id'] for row in base['lessons']):
        raise ValueError('Advanced8 duplicates a published lesson identity')
    return rows


def binding_fields(base, root=ROOT, course=None):
    """Return hashes only. This function never supplies a verdict or reviewer."""
    root = Path(root)
    course = Path(course or root / PREFIX)
    raw = (course / SOURCE_FILE).read_bytes()
    source = read(course / SOURCE_FILE)
    rows = authored_rows(base, source)
    return dict(schemaVersion=1, scope=REVIEW_SCOPE,
                authoredContentSha256=digest(rows),
                implementationSha256=base['build']['implementationSha256'],
                sourceFile=dict(path=PREFIX + SOURCE_FILE, sha256=sha(raw)),
                sourceEdition=dict(pdfSha256=SOURCE_PDF_SHA, printedPages=[214, 215],
                                   pdfPages=[215, 216], figure=274),
                runtimeFiles={name: sha((course / name).read_bytes()) for name in RUNTIME},
                implementationFiles={name: sha((root / name).read_bytes()) for name in IMPLEMENTATION},
                evidence=[dict(path=name, sha256=sha((root / name).read_bytes())) for name in EVIDENCE])


def matching_review(base, root=ROOT, course=None):
    root = Path(root)
    course = Path(course or root / PREFIX)
    try:
        require(sha(serialized(base)) == BASE_BUNDLE_SHA,
                'Advanced8 predecessor is not the exact independently reviewed1407 bundle')
        review = read(course / REVIEW_FILE)
        expected = binding_fields(base, root, course)
        require(all(review.get(k) == v for k, v in expected.items()), 'Stale advanced8 review binding')
        require(review.get('status') == 'passed'
                and all(review.get(k) == 'passed' for k in
                        ('source', 'mathematics', 'models', 'pedagogy', 'browser')),
                'Advanced8 independent review is incomplete')
        require(bool(review.get('reviewer')) and bool(review.get('at')),
                'Advanced8 review lacks provenance')
        numeric = read(root / NUMERIC_EVIDENCE)
        require(numeric.get('mathematics') == numeric.get('pedagogy') == 'passed'
                and numeric.get('authoredFileSha256') == expected['sourceFile']['sha256']
                and numeric.get('independentReviewer') is True
                and numeric.get('modelAudit', {}).get('failures') == [],
                'Advanced8 mathematical review does not match the source')
        visual = read(root / VISUAL_EVIDENCE)
        source = read(course / SOURCE_FILE)
        pairs = sorted(f'atanasyan-7-9-main-{c["number"]}-part-1/{view}/{width}'
                       for c in source['cards'] for view in c['model']['views'] for width in (320, 1280))
        require(all(visual.get(k) == 'passed' for k in ('source', 'models', 'browser'))
                and bool(visual.get('reviewer')) and bool(visual.get('at'))
                and visual.get('independentReviewer') is True
                and visual.get('authoredFileSha256') == expected['sourceFile']['sha256']
                and visual.get('runtimeFiles') == expected['runtimeFiles']
                and visual.get('widths') == [320, 1280]
                and visual.get('views') == 94 and visual.get('viewWidthPairs') == 188
                and visual.get('sourcePages') == [214, 215] and visual.get('sourceFigure') == 274
                and sorted(visual.get('inspectedViewPairs', [])) == pairs,
                'Advanced8 source/visual review is missing, partial or stale')
        return review
    except (AssertionError, OSError, ValueError, KeyError, TypeError):
        return None


def append_release(base, root=ROOT, course=None, scope=None):
    root = Path(root)
    course = Path(course or root / PREFIX)
    scope = scope or read(root / 'tools/geometry-textbook/release-scope.json')
    if not has_supplement(scope=scope):
        return base
    previous_scope(scope)
    require(len(base['lessons']) == len(base['catalog']['entries']) == 1407,
            'Advanced8 requires the complete1407-card base')
    rows = authored_rows(base, read(course / SOURCE_FILE))
    content_hash = digest(rows)
    review = matching_review(base, root, course)
    approved = review is not None
    for row in rows:
        row['status'] = 'reviewed' if approved else 'in-review'
        row['review'] = dict(source='passed' if approved else 'pending',
                             mathematics='passed' if approved else 'pending',
                             pedagogy='passed' if approved else 'pending',
                             reviewer=review['reviewer'] if approved else '',
                             at=review['at'] if approved else '')
    bundle = deepcopy(base)
    bundle['lessons'].extend(rows)
    bundle['catalog']['entries'].extend(
        {k: deepcopy(row[k]) for k in ('id', 'revision', 'kind', 'title', 'status', 'source')}
        for row in rows)
    bundle['build']['supplements'].append(
        dict(key=KEY, label=LABEL, authoredContentSha256=content_hash,
             publicationReviewMatches=approved, reviewFile=REVIEW_FILE,
             authoredCards=18, numberedExercises=18, theoryPoints=0, selfcheckQuestions=0))
    bundle['build']['authoredCards'] += 18
    bundle['build']['numberedExercises'] += 18
    bundle['build']['authoredContentSha256'] = digest(draft_rows(bundle['lessons']))
    bundle['build']['publicationReviewMatches'] = bool(base['build']['publicationReviewMatches'] and approved)
    return bundle


def _project_previous(bundle, scope):
    old = deepcopy(bundle)
    require([row['id'] for row in old['lessons'][-18:]] ==
            [f'atanasyan-7-9-main-{n}-part-1' for n in range(824, 842)],
            'Advanced8 is not the exact18-card lesson suffix')
    require([row['id'] for row in old['catalog']['entries'][-18:]] ==
            [f'atanasyan-7-9-main-{n}-part-1' for n in range(824, 842)],
            'Advanced8 is not the exact18-card catalog suffix')
    require(old['build']['supplements'][-1].get('key') == KEY,
            'Advanced8 is not the final supplement')
    old['lessons'] = old['lessons'][:-18]
    old['catalog']['entries'] = old['catalog']['entries'][:-18]
    old['build']['supplements'].pop()
    old['build']['authoredCards'] -= 18
    old['build']['numberedExercises'] -= 18
    old['build']['authoredContentSha256'] = digest(draft_rows(old['lessons']))
    previous_sections = old['build']['chapters'] + old['build']['supplements']
    require(all(isinstance(row, dict)
                and isinstance(row.get('publicationReviewMatches'), bool)
                for row in previous_sections),
            'Malformed previous chapter/supplement publication metadata')
    old['build']['publicationReviewMatches'] = all(
        row['publicationReviewMatches'] for row in previous_sections)
    return old, previous_scope(scope)


def validate_release(bundle, root=ROOT, course=None, require_review=True, scope=None):
    root = Path(root)
    course = Path(course or root / PREFIX)
    scope = scope or read(root / 'tools/geometry-textbook/release-scope.json')
    require(has_supplement(bundle, scope), 'Advanced8 release is not present')
    old, old_scope = _project_previous(bundle, scope)
    require(sha(serialized(old)) == BASE_BUNDLE_SHA,
            'Previous1407 lesson/catalog/order/review/revision or bundle metadata changed')
    require(sha(encoded(old_scope)) == BASE_SCOPE_SHA, 'Previous1407 scope changed')
    require(len(bundle['lessons']) == len(bundle['catalog']['entries']) ==
            bundle['build']['authoredCards'] == scope['totalCards'] == 1425,
            'Wrong1425 release union')
    require(bundle == append_release(old, root, course, scope),
            'Advanced8 bundle differs from its exact source, bindings or review')
    from chapter09_release import validate_release as validate_previous
    validate_previous(old, root, course, True, old_scope)
    if require_review:
        require(bundle['build']['publicationReviewMatches'] is True,
                'Advanced8 independent content/visual review incomplete')
    return True


def historical_ix_projection(bundle, scope, root=ROOT, course=None, require_review=None):
    """Project an explicitly known suffix for historical tests.

    This function is not an admission gate. Full release validators pass an
    explicit require_review flag, validating the entire union before projection.
    Plain projection also supports isolated negative tests of older receipts.
    """
    if not has_supplement(bundle, scope):
        return deepcopy(bundle), deepcopy(scope)
    if require_review is not None:
        validate_release(bundle, root, course, require_review, scope)
    elif not has_supplement(bundle=bundle):
        return deepcopy(bundle), previous_scope(scope)
    return _project_previous(bundle, scope)

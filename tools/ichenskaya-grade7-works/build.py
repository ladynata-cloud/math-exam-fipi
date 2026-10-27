#!/usr/bin/env python3
"""Compile reviewed, source-specific work cards; never copy the supplied scan."""
from pathlib import Path
import argparse, copy, hashlib, json, math, re

ROOT = Path(__file__).resolve().parents[2]
AREA = ROOT / 'learning/ichenskaya-grade7-works'
PDF_SHA = 'f3124410a12eeb8cb79a7282d63b3dc0b106871dc74ded526788ddaee23d877e'
COURSE = 'ichenskaya-grade7-works'
PRIMITIVES = ('segments', 'lines', 'rays', 'dashSegments', 'highlightSegments', 'circles',
              'rightAngles', 'angleArcs', 'equalSegments', 'polygons')

def digest(data): return hashlib.sha256(data).hexdigest()
def encoded(value): return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()
def require(value, message):
    if not value: raise ValueError(message)

def authored():
    files = sorted((AREA / 'content').glob('*.json'))
    cards, fingerprint = [], hashlib.sha256()
    for file in files:
        raw = file.read_bytes()
        fingerprint.update(file.name.encode() + b'\0' + raw + b'\0')
        data = json.loads(raw)
        cards.extend(data if isinstance(data, list) else data['cards'])
    return cards, fingerprint.hexdigest(), files

def model_for(card):
    drawing = card['drawing']
    points = drawing['points']
    require(points and all(isinstance(p, list) and len(p) in (2, 3)
            and all(isinstance(x, (int, float)) and math.isfinite(x) for x in p)
            and (len(p) == 2 or p[2] == 0) for p in points.values()), card['id'] + ': invalid point')
    require(all(re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]*', p) for p in points), card['id'] + ': point name')
    all_views = [drawing, *drawing.get('views', {}).values(),
                 *(step['drawing'] for step in card['steps'] if 'drawing' in step)]
    xs, ys = [p[0] for p in points.values()], [p[1] for p in points.values()]
    for view in all_views:
        for circle in view.get('circles', []):
            c, p = points[circle['center']], points[circle['through']]
            radius = math.dist(c[:2], p[:2])
            require(radius > 0, card['id'] + ': zero circle')
            xs.extend([c[0] - radius, c[0] + radius]); ys.extend([c[1] - radius, c[1] + radius])
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    scale = min(80 / max(x1-x0, .001), 44 / max(y1-y0, .001))
    if x1 == x0: scale = 44 / max(y1-y0, .001)
    if y1 == y0: scale = 80 / max(x1-x0, .001)
    cx, cy = (x0+x1)/2, (y0+y1)/2
    transformed = {key: [round(50 + (p[0]-cx)*scale, 10), round(35 + (p[1]-cy)*scale, 10), 0]
                   for key, p in points.items()}
    hidden = set(drawing.get('hiddenPoints', []))
    require(hidden <= set(points), card['id'] + ': unknown hidden point')
    base = {'points': [key for key in points if key not in hidden]}
    for key in PRIMITIVES:
        if key in drawing: base[key] = copy.deepcopy(drawing[key])
    def view(overrides, label):
        result = copy.deepcopy(base); result.update(copy.deepcopy(overrides)); result['label'] = result.get('label') or label
        result.pop('hiddenPoints', None)
        require(all(p in points for p in result.get('points', [])), card['id'] + ': view point')
        return result
    source_views = drawing.get('views', {})
    views = {'neutral': view(source_views.get('neutral', {}), 'Условие')}
    for i, step in enumerate(card['steps'], 1):
        overrides = copy.deepcopy(source_views.get(f'step-{i}', {}))
        overrides.update(copy.deepcopy(step.get('drawing', {})))
        views[f'step-{i}'] = view(overrides, f'Шаг {i}')
    for key, item in source_views.items():
        if key == 'neutral' or key.startswith('step-'): continue
        require(re.fullmatch(r'case-[1-9]\d*', key), card['id'] + ': invalid case view')
        views[key] = view(item, item.get('label', 'Случай'))
    return {'points': transformed, 'edges': [], 'planar': True, 'bounds': [0, 0, 100, 70],
            'labels': copy.deepcopy(drawing.get('labels', {})),
            'labelOffsets': copy.deepcopy(drawing.get('labelOffsets', {})),
            'labelOnly': copy.deepcopy(drawing.get('labelOnly', [])),
            'views': views, 'checks': [],
            'description': drawing.get('description', 'Схема условия; размеры определяются данными задачи.')}

def compile_course(allow_draft=False):
    manifest_bytes = (AREA/'source-manifest.json').read_bytes()
    manifest, source_hash = json.loads(manifest_bytes), digest(manifest_bytes)
    require(manifest['courseId'] == COURSE and manifest['counts']['cards'] == 110
            and manifest['counts']['works'] == 23, 'Unexpected source scope')
    require(manifest['source']['sha256'] == PDF_SHA, 'Wrong source file identity')
    cards, content_hash, files = authored()
    require(len(files) == 23 and len(cards) == 110, 'All 23 works and 110 numbered cards are required')
    by_id = {card['id']: card for card in cards}
    require(len(by_id) == 110 and set(by_id) == {e['id'] for e in manifest['entries']}, 'Card set differs from inventory')
    review_file = AREA/'content-review.json'
    review = json.loads(review_file.read_text()) if review_file.exists() else {}
    reviewed = review.get('authoredSha256') == content_hash and review.get('manifestSha256') == source_hash \
        and review.get('source') == 'passed' and review.get('mathematics') == 'passed' and review.get('pedagogy') == 'passed'
    require(allow_draft or reviewed, 'Source/proof review is missing or stale; do not mark draft content reviewed')
    lessons = []
    for entry in manifest['entries']:
        card = by_id[entry['id']]
        require(card['source'] == entry['source'], card['id'] + ': source mapping changed')
        require(isinstance(card['condition'], str) and 1 <= len(card['condition']) <= 1000, card['id'] + ': condition')
        require(isinstance(card['answer'], str) and card['answer'].strip(), card['id'] + ': answer missing')
        require(2 <= len(card['steps']) <= 12, card['id'] + ': step count')
        steps=[]
        for i, step in enumerate(card['steps'], 1):
            require(all(isinstance(step.get(key), str) and step[key].strip() for key in ('prompt', 'explanation', 'reason')),
                    card['id'] + ': incomplete reasoning step')
            require(len(step['prompt']) <= 600 and len(step['explanation']) <= 1200 and len(step['reason']) <= 600,
                    card['id'] + ': assistant text budget')
            steps.append({'id': f'step-{i}', 'title': f'Шаг {i}', 'prompt': step['prompt'],
                          'explanation': step['explanation'], 'view': f'step-{i}',
                          'justifications': [{'kind': 'reason', 'text': step['reason']}]})
        lessons.append({'schemaVersion': 1, 'id': card['id'], 'revision': 1, 'kind': 'exercise',
                        'title': card['title'], 'status': 'reviewed' if reviewed else 'draft', 'source': entry['source'],
                        'withinPrimaryScope': entry['withinPrimaryScope'], 'textbookPointSpan': entry['textbookPointSpan'],
                        'statement': {'text': card['condition'], 'goal': 'Сначала предложи своё решение. Обоснуй каждый переход.'},
                        'answer': {'mode': 'manual', 'text': card['answer'], 'explanation': card['answer']},
                        'visualization': {'type': 'scene3d', 'caption': 'Схема помогает рассуждать; измерение не заменяет доказательство.',
                                          'model': model_for(card)},
                        'help': [{'id': 'compare-result', 'text': card['answer']}], 'steps': steps,
                        'review': {key: 'passed' if reviewed else 'pending' for key in ('source', 'mathematics', 'pedagogy')}})
    sections=[]
    for work in manifest['works']:
        pages=work['printedPages']
        sections.append({'id': work['id'], 'title': ('С-' if work['collection']=='sr' else 'К-')+str(work['work'])+' · '+work['title'],
                         'withinPrimaryScope': work['withinPrimaryScope'], 'textbookPointSpan': work['textbookPointSpan'],
                         'printedPages': [min(pages),max(pages)] if len(pages)>1 else pages,
                         'lessonIds': work['lessonIds']})
    ordered=[id for section in sections for id in section['lessonIds']]
    require(ordered == [lesson['id'] for lesson in lessons], 'Manifest task and section order differ')
    book=copy.deepcopy(manifest['book'])
    book['edition']='М. А. Иченская. Геометрия. Самостоятельные и контрольные работы. 7 класс. Просвещение, 2018. ISBN 978-5-09-037118-6.'
    bundle={'schemaVersion':1,'id':COURSE,'title':book['title'],
            'description':'Позадачный учебный разбор самостоятельных и контрольных работ с сохранением записей.',
            'book':book,'source':{'sha256':PDF_SHA,'bookSha256':PDF_SHA,'manifestSha256':source_hash,
                                 'authoredSha256':content_hash,'manifestPath':'learning/ichenskaya-grade7-works/source-manifest.json'},
            'boundaries':manifest['boundaries'],'counters':{**manifest['counts'],'steps':sum(len(l['steps']) for l in lessons)},
            'sections':sections,'displayOverrides':{},'catalog':{'book':book,'entries':[{'id':l['id'],'kind':'exercise','source':l['source'],'title':l['title']} for l in lessons]},
            'lessons':lessons}
    return bundle, {'sourceSha256':PDF_SHA,'manifestSha256':source_hash,'authoredSha256':content_hash,
                    'cards':110,'works':23,'steps':bundle['counters']['steps'],'reviewed':reviewed}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');parser.add_argument('--draft',action='store_true')
    args=parser.parse_args();bundle,meta=compile_course(args.draft);data=encoded(bundle)
    target=AREA/'course.json'
    if args.check: require(target.exists() and target.read_bytes()==data, 'Generated course differs; rebuild deliberately')
    else: target.write_bytes(data)
    print(json.dumps({'gate':'ICHENSKAYA_COURSE_SOURCE_OK' if meta['reviewed'] else 'ICHENSKAYA_DRAFT_ONLY',
                      'checkOnly':args.check,'courseSha256':digest(data),**meta}))
if __name__=='__main__':main()

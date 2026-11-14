"""Verify one source-bound, closed optional summary without changing math pins."""
import hashlib
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
PINS = json.loads((ROOT / 'tools/fixtures/oge-video-models-native-bytes.json').read_text())
UPDATES = json.loads((ROOT / 'tools/fixtures/oge-worked-steps-native-bytes.json').read_text())
LABEL = 'Разобраться на модели'
SUMMARY_HTML = '<summary data-ovm-open="">' + LABEL + '</summary>'
ASSETS = ['/trainers/oge-video-models.css', '/trainers/oge-video-graphs.js',
          '/trainers/oge-video-geometry.js', '/trainers/oge-video-models.js']
DOWNLOAD_HEAD = (b'<link rel="stylesheet" href="/assets/download-panel.css">\n'
                 b'<link rel="stylesheet" href="/assets/download-adaptation.css">\n'
                 b'<script defer src="/assets/download-adaptation.js"></script>\n')
DOWNLOAD_PAGES = {row['sourceHtml'][1:]: row['slug'] for row in
                  json.loads((ROOT / 'downloads/trainers-manifest.json').read_text())['trainers']
                  if row.get('adaptation')}


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def without_download_controls(file, raw):
    slug = DOWNLOAD_PAGES.get(file)
    if not slug or b'data-trainer-download' not in raw:
        return raw
    marker = slug.encode()
    start = b'<!-- download-panel:start:' + marker + b' -->\n'
    end = b'<!-- download-panel:end:' + marker + b' -->\n'
    panels = re.findall(re.escape(start) + rb'[\s\S]*?' + re.escape(end), raw)
    if (len(panels) != 1 or raw.count(DOWNLOAD_HEAD) != 1 or
            DOWNLOAD_HEAD + b'</head>' not in raw or panels[0] + b'</body>' not in raw):
        raise ValueError('Unexpected download controls')
    return raw.replace(DOWNLOAD_HEAD, b'', 1).replace(panels[0], b'', 1)


def verified_context(record):
    """Return original text/geometry, or None for any excess allowance."""
    context = record.get('videoModelContext')
    if context is None:
        return record['initialVisibleText'], record.get('visibleSvgLabels', [])
    try:
        expected_keys = {'kind', 'route', 'bookId', 'task', 'sourceBase', 'sourceSha256',
                         'nativeSha256', 'closed', 'summaryHtml', 'label', 'offsetCodePoints',
                         'beforeText', 'afterText', 'assets', 'closedSvg'}
        if set(context) != expected_keys or record['prefix'] != '': return None
        navigation = record.get('publicWayfinding')
        if not navigation or navigation.get('kind') != 'oge-return-v1': return None
        if navigation.get('visibleText') != '← Все темы ОГЭ Главная': return None
        if record.get('unfilteredInitialVisibleText') != navigation['visibleText']+' '+record['initialVisibleText']: return None
        route = context['route']
        if not isinstance(route, str) or not route.startswith('/'): return None
        file = route[1:]
        pin = PINS['pages'].get(file)
        if not pin or not pin['bookId']: return None
        pin = dict(pin, sourceCommit=PINS['baseCommit']) | UPDATES['pages'].get(file, {})
        if record['route'] != route or record['finalPath'] != route: return None
        if record['id'] != pin['bookId'] or context['bookId'] != pin['bookId']: return None
        if context['task'] != pin['task'] or context['sourceBase'] != pin['sourceCommit']: return None
        if context['kind'] != 'oge-video-models-closed-v1' or context['closed'] is not True: return None
        if context['label'] != LABEL or context['summaryHtml'] != SUMMARY_HTML: return None
        raw = (ROOT / file).read_bytes()
        teaching = without_download_controls(file, raw)
        block = ('<!-- OGE video-model investigations: standalone practice -->\n'
                 '<link rel="stylesheet" href="oge-video-models.css">\n'
                 '<script defer src="oge-video-graphs.js"></script>\n'
                 '<script defer src="oge-video-geometry.js"></script>\n'
                 f'<script defer src="oge-video-models.js" data-oge-video-task="{pin["task"]}"></script>\n').encode()
        if teaching.count(block) != 1 or block + b'</head>' not in teaching: return None
        native = teaching.replace(block, b'', 1)
        graph_scale = PINS['graphScale']
        if file == graph_scale['file'] and native.count(graph_scale['after'].encode()) == 1:
            native = native.replace(graph_scale['after'].encode(), graph_scale['before'].encode(), 1)
        if sha(native) != pin['sha256'] or context['nativeSha256'] != pin['sha256']: return None
        if sha(raw) != context['sourceSha256']: return None
        if record['resources'][route]['sha256'] != context['sourceSha256']: return None
        if set(context['assets']) != set(ASSETS): return None
        for asset in ASSETS:
            expected = sha((ROOT / asset[1:]).read_bytes())
            if context['assets'][asset] != expected or record['resources'][asset]['sha256'] != expected: return None
            if record['resources'][asset]['status'] != 200: return None
        text = record['initialVisibleText']
        before, after, offset = context['beforeText'], context['afterText'], context['offsetCodePoints']
        if not isinstance(before, str) or not isinstance(after, str) or type(offset) is not int: return None
        if offset != len(before) or before + LABEL + after != text or text.count(LABEL) != 1: return None
        if (before and not before.endswith(' ')) or (after and not after.startswith(' ')): return None
        preview = PINS['closedPreview']
        raw_svgs, hidden = record.get('visibleSvgLabels', []), context['closedSvg']
        if not isinstance(raw_svgs, list) or not isinstance(hidden, list): return None
        if len(hidden) != (1 if pin['task'] in preview['tasks'] else 0): return None
        excluded = set()
        for item in hidden:
            index = item['index']
            if type(index) is not int or index < 0 or index >= len(raw_svgs): return None
            expected = dict(index=index, selector=preview['selector'], lesson=preview['lesson'],
                            stage=preview['stage'], closed=True, hidden=True, svgSha256=preview['svgSha256'])
            if item != expected or sha(raw_svgs[index]['svg'].encode()) != preview['svgSha256']: return None
            excluded.add(index)
        native_svgs = [svg for index, svg in enumerate(raw_svgs) if index not in excluded]
        # Remove only the adjoining separator introduced by this one element;
        # every other native character, including whitespace, remains sealed.
        if before and after: text = before[:-1] + after
        elif before: text = before[:-1]
        elif after: text = after[1:]
        else: text = ''
        return text, native_svgs
    except (KeyError, IndexError, TypeError, ValueError, OSError):
        return None


def without_closed_video_summary(record):
    result = verified_context(record)
    return result[0] if result is not None else None


def without_closed_video_geometry(record):
    result = verified_context(record)
    return result[1] if result is not None else None

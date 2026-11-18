"""Verify one source-bound, closed optional summary without changing math pins."""
import hashlib
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
PINS = json.loads((ROOT / 'tools/fixtures/oge-video-models-native-bytes.json').read_text())
UPDATES = json.loads((ROOT / 'tools/fixtures/oge-worked-steps-native-bytes.json').read_text())
V3 = json.loads((ROOT / 'tools/fixtures/oge-book-v3-context.json').read_text())
GRAPH_INTERSECTIONS = json.loads((ROOT / 'tools/fixtures/oge22-intersections-display.json').read_text())
LABEL = 'Разобраться на модели'
SUMMARY_HTML = '<summary data-ovm-open="">' + LABEL + '</summary>'
ASSETS = ['/trainers/oge-video-models.css', '/trainers/oge-video-graphs.js',
          '/trainers/oge-video-geometry.js', '/trainers/oge-video-models.js']
WAYFINDING_LABEL = '← Все темы ОГЭ Главная'
FROZEN_WAYFINDING_HTML = ('<nav class="oge-wayfinding" aria-label="Навигация ОГЭ"><a href="' +
                         V3['prefix'] + '/trainers/oge-course/">← Все темы ОГЭ</a><a href="' +
                         V3['prefix'] + '/">Главная</a></nav>')
DOWNLOAD_HEAD = (b'<link rel="stylesheet" href="/assets/download-panel.css">\n'
                 b'<link rel="stylesheet" href="/assets/download-adaptation.css">\n'
                 b'<script defer src="/assets/download-adaptation.js"></script>\n')
DOWNLOAD_PAGES = {row['sourceHtml'][1:]: row['slug'] for row in
                  json.loads((ROOT / 'downloads/trainers-manifest.json').read_text())['trainers']
                  if row.get('adaptation')}


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def source_pin(file):
    """Keep frozen receipts while binding the exact later public-source composition."""
    pin = PINS['pages'].get(file)
    if not pin:
        return None
    pin = dict(pin, sourceCommit=PINS['baseCommit']) | UPDATES['pages'].get(file, {})
    if file in V3['publicSourceOverrides']:
        pin |= dict(sourceCommit=V3['sourceCommit'], sha256=V3['videoPages'][file]['nativeSha256'])
    pin |= V3['publicSourceCompositions'].get(file, {})
    return pin


def verified_v3_files(record, files=()):
    """Bind one frozen route and its loaded resources to the full pinned manifest.

    No public file is read as authority for a frozen copy. Both the manifest and
    actual served bytes must match; a mutually edited manifest/file pair fails.
    """
    try:
        if record['prefix'] != V3['prefix']:
            return False
        raw = (ROOT / V3['prefix'][1:] / 'manifest.json').read_bytes()
        if sha(raw) != V3['manifestSha256']:
            return False
        manifest = json.loads(raw)
        if (manifest['schema'] != 1 or manifest['edition'] != V3['edition'] or
                manifest['prefix'] != V3['prefix'][1:] + '/' or manifest['sourceBase'] != V3['sourceBase']):
            return False
        route = record['route']
        # Keep the existing single task-13 redirect exact; no other route may move.
        served_route = ('/trainers/oge13-inequalities-series.html' if record['id'] == '56' and
                        route == '/trainers/oge-task13-inequalities.html' else route)
        target = V3['prefix'] + served_route
        if record['finalPath'] != target:
            return False
        entries = [row for row in manifest['entries'] if row['id'] == record['id']]
        if (len(entries) != 1 or entries[0]['sourceUrl'] != 'https://mathexam.space' + route or
                entries[0]['frozenUrl'] != 'https://mathexam.space' + V3['prefix'] + route):
            return False
        for file in set([route, served_route, '/edition-assets/bootstrap.js', '/edition-assets/edition.css', *files]):
            if not isinstance(file, str) or not file.startswith('/') or '..' in file.split('/'):
                return False
            target = V3['prefix'] + file
            rows = [row for row in manifest['files'] if row['path'] == target[1:]]
            if len(rows) != 1:
                return False
            payload = (ROOT / target[1:]).read_bytes()
            loaded = record['resources'][target]
            if (len(payload) != rows[0]['bytes'] or sha(payload) != rows[0]['sha256'] or
                    loaded['status'] != 200 or loaded['sha256'] != rows[0]['sha256']):
                return False
            expected = V3['sourceFiles'].get(file[1:])
            if expected:
                sources = [row for row in manifest['sourceFiles'] if row['path'] == file[1:]]
                if len(sources) != 1 or sources[0]['sha256'] != expected:
                    return False
        return True
    except (KeyError, IndexError, TypeError, ValueError, OSError):
        return False


def verified_v3_wayfinding(record):
    """Check the exact frozen two-link bar without excusing other visible text."""
    if not verified_v3_files(record) or record.get('publicWayfinding') is not None:
        return False
    try:
        raw = (ROOT / record['finalPath'][1:]).read_bytes()
        navigation = record.get('frozenWayfinding')
        if b'<nav class="oge-wayfinding"' not in raw:
            return navigation is None and 'unfilteredInitialVisibleText' not in record
        if not verified_v3_files(record, ('/assets/oge-wayfinding.css', '/assets/oge-wayfinding.js')):
            return False
        if raw.count(FROZEN_WAYFINDING_HTML.encode()) != 1:
            return False
        expected = dict(kind='oge-frozen-return-v3', visibleText=WAYFINDING_LABEL,
                        servedHtmlSha256=sha(raw), manifestSha256=V3['manifestSha256'])
        return (navigation == expected and record.get('unfilteredInitialVisibleText') ==
                WAYFINDING_LABEL + ' ' + record['initialVisibleText'])
    except (KeyError, TypeError, OSError):
        return False


def restore_graph_intersections(file, raw):
    """Invert all three exact display fragments; original engine pins stay sealed."""
    if file != GRAPH_INTERSECTIONS['file']:
        return raw
    fragments = GRAPH_INTERSECTIONS['fragments']
    if not all(raw.count(fragment['after'].encode()) == 1 for fragment in fragments):
        return raw
    for fragment in fragments:
        raw = raw.replace(fragment['after'].encode(), fragment['before'].encode(), 1)
    return raw


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
        prefix = record['prefix']
        if prefix not in ('', V3['prefix']): return None
        frozen = prefix == V3['prefix']
        if frozen: expected_keys.add('manifestSha256')
        if set(context) != expected_keys: return None
        if frozen:
            if context['manifestSha256'] != V3['manifestSha256']: return None
            if not verified_v3_wayfinding(record) or not verified_v3_files(record, ASSETS): return None
        else:
            navigation = record.get('publicWayfinding')
            if not navigation or navigation.get('kind') != 'oge-return-v1': return None
            if navigation.get('visibleText') != WAYFINDING_LABEL: return None
            if record.get('unfilteredInitialVisibleText') != navigation['visibleText']+' '+record['initialVisibleText']: return None
        route = context['route']
        if not isinstance(route, str) or not route.startswith('/'): return None
        file = route[1:]
        pin = V3['videoPages'].get(file) if frozen else source_pin(file)
        if not pin or not pin['bookId']: return None
        if frozen: pin = dict(pin, sourceCommit=V3['sourceCommit'], sha256=pin['nativeSha256'])
        if record['route'] != route or record['finalPath'] != prefix + route: return None
        if record['id'] != pin['bookId'] or context['bookId'] != pin['bookId']: return None
        if context['task'] != pin['task'] or context['sourceBase'] != pin['sourceCommit']: return None
        if context['kind'] != ('oge-video-models-closed-v3' if frozen else 'oge-video-models-closed-v1') or context['closed'] is not True: return None
        if context['label'] != LABEL or context['summaryHtml'] != SUMMARY_HTML: return None
        raw = (ROOT / (prefix + route)[1:]).read_bytes()
        if not frozen:
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
                native = restore_graph_intersections(file, native)
            if sha(native) != pin['sha256']: return None
        if context['nativeSha256'] != pin['sha256']: return None
        if sha(raw) != context['sourceSha256']: return None
        if record['resources'][prefix + route]['sha256'] != context['sourceSha256']: return None
        if record['resources'][prefix + route]['status'] != 200: return None
        if set(context['assets']) != {prefix + asset for asset in ASSETS}: return None
        for asset in [prefix + asset for asset in ASSETS]:
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

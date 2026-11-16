"""Package the recordings for one existing lesson without changing its teaching content.

Each standalone lesson contains only its own active recordings. GIF decoding starts
on request; the static frames and text remain available without any network request.
The optional compatibility recording is activated when the topic runtime is present.
"""
from __future__ import annotations

import base64
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets/geometry-experiment-gifs'
CONFIG = re.compile(r'(<script>\s*window\.COURSE_CONFIG=)(.*?)(;\s*</script>)', re.S)
GUIDE_TAG = re.compile(r'<(script|style)\b[^>]*\bdata-geometry-experiment-gifs(?:="[^"]*")?[^>]*>.*?</\1>\s*', re.S)


def _script(source: str) -> str:
    return source.replace('</script', '<\\/script')


def _uri(name: str) -> str:
    path = ASSETS / name
    if path.parent != ASSETS or path.suffix not in ('.png', '.gif'):
        raise ValueError('Unexpected recording resource: ' + name)
    mime = 'image/gif' if path.suffix == '.gif' else 'image/png'
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode('ascii')


def page_config(relative: str, *, inline: bool = True, harmonized: bool = False) -> dict | None:
    catalogue = json.loads((ASSETS / 'catalog.json').read_text())
    page = catalogue['pages'].get(relative)
    if page is None:
        return None
    if harmonized and page.get('investigations'):
        # A later change to controls or layout invalidates their recorded instructions.
        source_ref = catalogue['compatibility']['pendingHead']
        for relative_source in ('geometry-course/assets/investigations.js', 'geometry-course/assets/course.css'):
            expected = catalogue['sources'][source_ref + ':' + relative_source]
            actual = hashlib.sha256((ROOT / relative_source).read_bytes()).hexdigest()
            if actual != expected:
                raise ValueError('Re-record changed topic interface before activating GIFs: ' + relative_source)
    media = json.loads((ASSETS / 'media.json').read_text())['clips']
    result = {key: page.get(key, []) for key in ('manual', 'experiments', 'investigations')}
    result.update(unitId=page['unitId'], clips=[])
    active = set(result['manual'] + result['experiments'] + (result['investigations'] if harmonized else []))
    ids = list(dict.fromkeys(result['manual'] + result['experiments'] + result['investigations']))
    for clip_id in ids:
        source, recording = catalogue['clips'][clip_id], media[clip_id]
        materialized = {key: source[key] for key in ('id', 'title', 'note') if key in source}
        materialized['steps'] = [{'caption': step['caption']} for step in source['steps']]
        materialized['width'] = recording['width']
        materialized['height'] = recording['height']
        # Future topic recordings stay shared until that runtime is actually adopted.
        def asset(name: str) -> str:
            return _uri(name) if inline and clip_id in active else '/assets/geometry-experiment-gifs/' + name
        materialized['gif'] = asset(recording['gif'])
        materialized['poster'] = asset(recording['poster'])
        materialized['frames'] = [asset(name) for name in recording['frames']]
        result['clips'].append(materialized)
    return result


def with_guides(relative: str, html: str, *, refresh_sources: bool = False) -> str:
    """Retain the exact existing head/navigation/proofs; inject this page's guide."""
    course = relative.split('/')[0]
    lesson_source = (ROOT / course / 'assets/lesson.js').read_text()
    conf = page_config(relative, inline=course == 'geometry-course',
                       harmonized='GeoInvestigations.mount' in lesson_source)
    if conf is None:
        return html
    html = GUIDE_TAG.sub('', html)
    match = CONFIG.search(html)
    if not match:
        raise ValueError('Missing course configuration: ' + relative)
    unit = json.loads(match[2])
    unit['experimentGuides'] = conf
    value = json.dumps(unit, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
    html = html[:match.start(2)] + value + html[match.end(2):]
    if refresh_sources and course == 'geometry-course':
        lab = (ROOT / course / 'assets/lab.js').read_text()
        replacements = {'lab': 0}
        def refresh(m: re.Match) -> str:
            body = m[1]
            if re.search(r'root\.GeoLab\s*=\s*\{\s*mount\s*\}', body):
                replacements['lab'] += 1
                return '<script>' + _script(lab) + '</script>'
            return m[0]
        html = re.sub(r'<script>(.*?)</script>', refresh, html, flags=re.S)
        if replacements['lab'] != 1:
            raise ValueError('Expected one embedded lab: ' + relative)
    css = (ASSETS / 'guide.css').read_text()
    html = html.replace('</head>', '<style data-geometry-experiment-gifs="style">' + css + '</style></head>', 1)
    script = _script((ASSETS / 'guide.js').read_text())
    boot = ('\nwindow.MathExamGeometryExperimentGifs.attach(document.getElementById("lesson"),'
            'window.COURSE_CONFIG.experimentGuides);\n')
    # Insert immediately after config, before either existing lesson renderer runs.
    match = CONFIG.search(html)
    html = html[:match.end()] + '<script data-geometry-experiment-gifs="runtime">' + script + boot + '</script>' + html[match.end():]
    if course == 'geometry-pogorelov':
        html = re.sub(r'(<script src="\.\./assets/lab\.js)(?:\?[^"<>]*)?("[^>]*>)', r'\1?v=20261116-gifs\2', html)
    return html


def refresh_course(course: str) -> None:
    catalogue = json.loads((ASSETS / 'catalog.json').read_text())
    paths = [name for name in catalogue['pages'] if name.startswith(course + '/')]
    if not paths:
        raise ValueError('No scoped lessons for ' + course)
    for relative in paths:
        path = ROOT / relative
        path.write_text(with_guides(relative, path.read_text(), refresh_sources=True))
    print('Packaged GIF instructions for', len(paths), 'existing lessons in', course)

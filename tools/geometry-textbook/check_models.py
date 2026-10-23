#!/usr/bin/env python3
"""Check geometric claims in every authored scene, including hidden later views."""
import json
import math
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
COURSE = ROOT / 'geometry-course/textbook'
EPS = 1e-5


def validate(model):
    problems = []
    points = model['points']
    if not points or model.get('edges') != [] or model.get('planar') is not True:
        problems.append('A separate planar scene requires points, empty base edges, planar=true')
    for name, point in points.items():
        if (not isinstance(name, str) or len(point) != 3
                or any(not isinstance(n, (float, int)) or not math.isfinite(n) for n in point)
                or abs(point[2]) > EPS):
            problems.append(f'Invalid planar point {name}')
    def p(name):
        if name not in points:
            raise ValueError(f'Unknown point {name}')
        return points[name][:2]
    def vec(a, b):
        pa, pb = p(a), p(b)
        return (pb[0] - pa[0], pb[1] - pa[1])
    def norm(v):
        return math.hypot(*v)
    def cross(a, b):
        return a[0] * b[1] - a[1] * b[0]
    def dot(a, b):
        return a[0] * b[0] + a[1] * b[1]
    def length(pair):
        return norm(vec(*pair))
    def close(a, b):
        return abs(a - b) <= EPS * max(1, abs(a), abs(b))
    def angle(a, o, b):
        u, v = vec(o, a), vec(o, b)
        den = norm(u) * norm(v)
        if den < EPS:
            raise ValueError('Angle has a zero-length side')
        return math.degrees(math.acos(max(-1, min(1, dot(u, v) / den))))
    if 'neutral' not in model['views']:
        problems.append('Missing neutral scene')
    for name, view in model['views'].items():
        try:
            if not view.get('label'):
                raise ValueError('Missing scene label')
            if len(set(view.get('points', []))) != len(view.get('points', [])):
                raise ValueError('Duplicate displayed point')
            for point in view.get('points', []):
                p(point)
            for primitive in ('segments', 'lines', 'rays', 'dashSegments', 'highlightSegments'):
                for pair in view.get(primitive, []):
                    if len(pair) != 2 or length(pair) < EPS:
                        raise ValueError(f'Degenerate {primitive}: {pair}')
            for mark in view.get('rightAngles', []):
                if not close(angle(mark['a'], mark['vertex'], mark['b']), 90):
                    raise ValueError(f'False right-angle marker: {mark}')
            groups = defaultdict(list)
            for mark in view.get('equalSegments', []):
                groups[mark.get('marks', 1)].append(length([mark['a'], mark['b']]))
            for mark, lengths in groups.items():
                if mark not in (1, 2, 3) or any(not close(d, lengths[0]) for d in lengths):
                    raise ValueError(f'False equal-length marks: {mark}: {lengths}')
            angle_groups = defaultdict(list)
            for arc in view.get('angleArcs', []):
                degrees = angle(arc['from'], arc['vertex'], arc['to'])
                if arc.get('reflex'):
                    degrees = 360 - degrees
                if arc.get('marks', 0):
                    angle_groups[arc['marks']].append(degrees)
                if not 0 < arc.get('radius', 8) <= 100:
                    raise ValueError('Invalid angle arc radius')
            for mark, degrees in angle_groups.items():
                if mark not in (1, 2, 3) or any(not close(d, degrees[0]) for d in degrees):
                    raise ValueError(f'False equal-angle marks: {mark}: {degrees}')
            for circle in view.get('circles', []):
                radius = length([circle['center'], circle['through']])
                if radius < EPS:
                    raise ValueError('Degenerate circle')
                bounds = model.get('bounds')
                if bounds:
                    x, y = p(circle['center'])
                    if (x - radius < bounds[0] - EPS or y - radius < bounds[1] - EPS
                            or x + radius > bounds[2] + EPS or y + radius > bounds[3] + EPS):
                        raise ValueError('Circle is clipped by the authored bounds')
            for polygon in view.get('polygons', []):
                if len(polygon) < 3:
                    raise ValueError('Invalid polygon')
                for vertex in polygon:
                    p(vertex)
        except (ValueError, KeyError, TypeError, IndexError) as exc:
            problems.append(f'{name}: {exc}')
    for check in model.get('checks', []):
        try:
            kind = check['type']
            if kind == 'collinear':
                a, b, *rest = check['points']
                u = vec(a, b)
                ok = norm(u) > EPS and all(abs(cross(u, vec(a, c))) <= EPS * norm(u) * max(1, norm(vec(a, c))) for c in rest)
            elif kind in ('perpendicular', 'parallel'):
                u, v = [vec(*pair) for pair in check['segments']]
                den = norm(u) * norm(v)
                ok = den > EPS and abs(dot(u, v) if kind == 'perpendicular' else cross(u, v)) <= EPS * den
            elif kind == 'equalLength':
                lengths = [length(pair) for pair in check['segments']]
                ok = bool(lengths) and all(close(d, lengths[0]) for d in lengths)
            elif kind == 'distanceRatio':
                a, b = [length(pair) for pair in check['segments']]
                ok = b > EPS and close(a / b, check['ratio'])
            elif kind == 'angle':
                ok = close(angle(*check['points']), check['degrees'])
            else:
                raise ValueError(f'Unknown geometric check {kind}')
            if not ok:
                raise ValueError(f'Geometric claim is false: {check}')
        except (ValueError, KeyError, TypeError, IndexError) as exc:
            problems.append(str(exc))
    return problems


def main():
    models, views, claims, errors = 0, 0, 0, []
    identities = set()
    for path in sorted((COURSE / 'models').glob('*.json')):
        chapter = int(re.fullmatch(r'chapter-(\d{2})-[a-z]+\.json', path.name)[1])
        data = json.loads(path.read_text())
        if data.get('chapter', chapter) != chapter:
            errors.append(f'Model chapter disagrees with filename: {path.name}')
        for item in data['models']:
            if item.get('chapter', chapter) != chapter:
                errors.append(f'Model item chapter disagrees with filename: {path.name}')
            identity = (chapter, item.get('collection', 'main'), item['number'], item.get('part', 'single'))
            if identity in identities:
                errors.append(f'Duplicate identity {identity}')
            identities.add(identity)
            model = item['model']
            models += 1
            views += len(model['views'])
            claims += len(model.get('checks', []))
            for problem in validate(model):
                errors.append(f'{path.name} {identity}: {problem}')
    if errors:
        raise SystemExit('\n'.join(errors))
    print(json.dumps(dict(gate='ATANASYAN_7_9_MODEL_GEOMETRY_OK', models=models, views=views, coordinateClaims=claims)))


if __name__ == '__main__':
    main()

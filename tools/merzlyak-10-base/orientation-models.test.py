#!/usr/bin/env python3
"""Independent regressions for four repaired initial scene orientations.

Baselines were captured independently before the integration author rotated
points. Do not import the author generator or its orientation-adjustments file.
Checks preserve all non-coordinate educational content, proper Z isometry,
pairwise lengths and readable projected geometry at a conservative280px width.
The shared viewer/default camera is unchanged; this is projected-geometry
pedagogy evidence, not a substitute for browser accessibility inspection.
"""
import copy
import hashlib
import itertools
import json
import math
from pathlib import Path
from review_state import assert_review_state, content_sha

ROOT = Path(__file__).resolve().parents[2]
LESSONS = ROOT / 'stereo-course/merzlyak-10-base/lessons'
BASELINES = {'ex-16-010': {'points': {'A': [0.0, 0.0, 0.0],
                          'B': [12.0, 0.0, 0.0],
                          'C': [6.0, 10.392304845413264, 0.0],
                          'A1': [0.0, 0.0, 7.0],
                          'B1': [12.0, 0.0, 7.0],
                          'C1': [6.0, 10.392304845413264, 7.0],
                          'D': [3.0, 5.196152422706632, 0.0],
                          'E': [9.0, 5.196152422706632, 0.0],
                          'F': [6.0, 10.392304845413264, 3.0],
                          'H': [6.0, 5.196152422706632, 0.0]},
               'nonCoordinateSha256': 'b5a946769fdea379aef3d03192f1b8d45a13a4bd15a93a7db2b3e392a44c8be1',
               'rotationDegrees': 165},
 'ex-16-021': {'points': {'A': [0.0, 0.0, 0.0],
                          'B': [3.0, 0.0, 0.0],
                          'C': [4.5, 2.598076211353316, 0.0],
                          'D': [1.5000000000000004, 2.598076211353316, 0.0],
                          'A1': [0.0, 0.0, 3.0],
                          'B1': [3.0, 0.0, 3.0],
                          'C1': [4.5, 2.598076211353316, 3.0],
                          'D1': [1.5000000000000004, 2.598076211353316, 3.0]},
               'nonCoordinateSha256': '2db927eef6e57e883fff27dc3cf6fc8bab57bcea775c2fe9a18dbbd1393dfb4a',
               'rotationDegrees': 330},
 'ex-16-027': {'points': {'A': [-3.0, 0.0, 0.0],
                          'B': [0.0, 1.7320508075688772, 0.0],
                          'C': [3.0, 0.0, 0.0],
                          'D': [0.0, -1.7320508075688772, 0.0],
                          'A1': [-3.0, 0.0, 3.0],
                          'B1': [0.0, 1.7320508075688772, 3.0],
                          'C1': [3.0, 0.0, 3.0],
                          'D1': [0.0, -1.7320508075688772, 3.0],
                          'O': [0.0, 0.0, 0.0]},
               'nonCoordinateSha256': '42723277da3ece14c0fe438e16ac6460a5bc37138811d724e825d35994b6cf8c',
               'rotationDegrees': 90},
 'ex-17-027': {'points': {'A': [0.0, 0.0, 0.0],
                          'B': [0.0, 8.0, 0.0],
                          'C': [8.0, 8.0, 0.0],
                          'D': [8.0, 0.0, 0.0],
                          'A1': [0.0, 4.0, 6.928203230275509],
                          'B1': [0.0, 12.0, 6.928203230275509],
                          'C1': [8.0, 12.0, 6.928203230275509],
                          'D1': [8.0, 4.0, 6.928203230275509]},
               'nonCoordinateSha256': '87df16a60eca1a12c6a72b9d4b88d801ee87c1e6d926e8468be5cf578fa873d5',
               'rotationDegrees': 180}}
WIDTH = 280
YAW, PITCH = -.62, .43
EPS = 2e-9


def canonical_sha(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True,
                                     separators=(',', ':')).encode()).hexdigest()


def close(a, b):
    assert abs(a-b) <= EPS * max(1, abs(a), abs(b)), (a, b)


def unchanged_noncoordinates(lesson, baseline):
    stripped = copy.deepcopy(lesson)
    stripped['visualization']['model'].pop('points')
    stripped.pop('status')
    stripped.pop('review')
    assert canonical_sha(stripped) == baseline['nonCoordinateSha256'], 'non-coordinate content changed'


def proper_rotation(points, baseline):
    before = baseline['points']
    assert points.keys() == before.keys(), 'named points changed'
    angle = math.radians(baseline['rotationDegrees'])
    c, s = math.cos(angle), math.sin(angle)
    close(c*c+s*s, 1)  # orthogonal2x2 matrix, determinant+1
    for name, (x, y, z) in before.items():
        now = points[name]
        assert len(now) == 3 and all(math.isfinite(v) for v in now)
        close(now[0], c*x-s*y)
        close(now[1], s*x+c*y)
        assert now[2] == z, (name, 'z changed')
    pairs = 0
    for a, b in itertools.combinations(before, 2):
        close(math.dist(points[a], points[b]), math.dist(before[a], before[b]))
        pairs += 1
    return pairs


def project(points):
    # Orthographic projection onto the two screen axes of the unchanged viewer.
    center = [(min(p[i] for p in points.values()) + max(p[i] for p in points.values())) / 2
              for i in range(3)]
    radius = max(math.dist(p, center) for p in points.values())
    assert radius > 0
    # At280px width the real responsive viewer has height360px, hence min=280.
    scale = WIDTH * .36 / radius
    screen = {}
    for name, p in points.items():
        x, y, z = [p[i]-center[i] for i in range(3)]
        screen[name] = ((x*math.cos(YAW)-y*math.sin(YAW))*scale,
                        (z*math.cos(PITCH)-(x*math.sin(YAW)+y*math.cos(YAW))*math.sin(PITCH))*scale)
    return screen


def polygon_metrics(screen, names):
    points = [screen[name] for name in names]
    area = abs(sum(a[0]*b[1]-a[1]*b[0] for a,b in zip(points, points[1:]+points[:1]))) / 2
    widths = []
    for a,b in zip(points, points[1:]+points[:1]):
        dx,dy = b[0]-a[0],b[1]-a[1]
        length = math.hypot(dx,dy)
        assert length > 0
        values = [(-dy*x+dx*y)/length for x,y in points]
        widths.append(max(values)-min(values))
    # For a triangle this is its minimum altitude; for a convex polygon its
    # minimum width over edge normals. Both detect a nearly edge-on figure.
    return {'areaPx2':area, 'minWidthPx':min(widths)}


def readable(lesson_id, points, views):
    screen = project(points)
    metrics = {}
    for name, view in views.items():
        polygon = view.get('polygon')
        # A view may draw a highlighted triangle using its three side segments.
        segments = view.get('segments', [])
        if not polygon and len(segments) == 3:
            names = list(dict.fromkeys(n for edge in segments for n in edge))
            if len(names) == 3 and all(sum(n in edge for edge in segments) == 2 for n in names):
                polygon = names
        if polygon:
            metric = polygon_metrics(screen, polygon)
            assert metric['minWidthPx'] > 20, (lesson_id, name, metric)
            metrics[name] = metric
    if lesson_id == 'ex-17-027':
        gap = math.dist(screen['D'],screen['B1'])
        assert gap > 20, ('D and B1 overlap in the initial projection',gap)
        metrics['D-B1'] = {'gapPx':gap}
    return metrics


def rejected(callback):
    try:
        callback()
    except AssertionError:
        return
    raise AssertionError('negative regression was accepted')


def main():
    rows=[]
    for lesson_id, baseline in BASELINES.items():
        path = LESSONS / (lesson_id+'.json')
        raw=path.read_bytes();lesson=json.loads(raw)
        assert_review_state(lesson)
        unchanged_noncoordinates(lesson, baseline)
        points=lesson['visualization']['model']['points']
        pairs=proper_rotation(points, baseline)
        metrics=readable(lesson_id, points, lesson['visualization']['model']['views'])
        rows.append({'lessonId':lesson_id,'sha256':hashlib.sha256(raw).hexdigest(),
                     'contentSha256':content_sha(lesson),'rotationDegrees':baseline['rotationDegrees'],
                     'preservedPairDistances':pairs,'projectedGeometry':metrics})
    first=json.loads((LESSONS/'ex-16-010.json').read_text());baseline=BASELINES['ex-16-010']
    distorted=copy.deepcopy(first['visualization']['model']['points']);distorted['F'][0]+=.1
    rejected(lambda: proper_rotation(distorted,baseline))
    reflected={n:[-p[0],p[1],p[2]] for n,p in first['visualization']['model']['points'].items()}
    rejected(lambda: proper_rotation(reflected,baseline))
    changed=copy.deepcopy(first);changed['statement']['goal']+=' changed'
    rejected(lambda: unchanged_noncoordinates(changed,baseline))
    rejected(lambda: readable('ex-16-010',baseline['points'],first['visualization']['model']['views']))
    fourth=json.loads((LESSONS/'ex-17-027.json').read_text())
    rejected(lambda: readable('ex-17-027',BASELINES['ex-17-027']['points'],fourth['visualization']['model']['views']))
    print(json.dumps({'result':'PASS','independent':True,'sceneWidthPx':WIDTH,
                      'negativeRegressions':5,'rows':rows},ensure_ascii=False))


if __name__ == '__main__':
    main()

"""Measure the unrolled circles, sample the arc, and compare the colored area in each review view."""
import json
from math import atan2, cos, dist, isclose, pi, radians, sin, sqrt
from circle_measure_review import OUT


def close(actual, expected, tolerance=1e-6):
    return isclose(actual, expected, abs_tol=1e-7, rel_tol=tolerance)


def area(vertices):
    return abs(sum(p[0]*q[1]-q[0]*p[1]
                   for p, q in zip(vertices, vertices[1:]+vertices[:1])))/2


def turn(center, start, end):
    a, b = [(p[0]-center[0], p[1]-center[1]) for p in (start, end)]
    return abs(atan2(a[0]*b[1]-a[1]*b[0], a[0]*b[0]+a[1]*b[1]))


arc_examples = {
    10: [(3,60), (3,240), (8,45)],
    11: [(2,180/pi), (2,60), (5,180/pi)],
    12: [(3,90), (3,120), (4,270)],
    13: [(1,360/pi), (3,360/pi), (8,90)],
}
lessons = json.loads(OUT.read_bytes())['lessons']
assert len(lessons) == 9
count = 0
for number, card in enumerate(lessons, 8):
    page = 310 if number <= 14 else 311
    src = card['source']
    assert card['id'] == f'atanasyan-7-9-selfcheck-chapter-13-{number}-part-1'
    assert src['collection'] == 'selfcheck' and src['chapter'] == 'XIII'
    assert src['printedPages'] == [page] and src['pdfPages'] == [page+1]
    assert card['answer']['mode'] == 'manual' and sum('input' in s for s in card['steps']) == 2
    model = card['visualization']['model']
    coords = model['points']
    for key, view in model['views'].items():
        idx = int(key[-1])-1 if key[-1].isdigit() else 0
        ids = {alias: k for k in view['points'] for alias in model['labels'][k].split('=')}
        def point(label):
            return coords[ids[label]][:2]
        def length(a, b):
            return dist(point(a), point(b))
        center = point('T')
        unit = length('U', 'V' if number <= 9 else 'W')
        radius = length('T','A')/unit
        if number <= 9:
            expected = ([2,2,5] if number == 8 else [1,2,5])[idx]
            assert close(radius, expected) and close(length('A','B')/unit, 2*radius)
            if number == 8 and idx == 1:
                assert close(turn(center, point('A'), point('D')), pi/2)
            else:
                assert close(length('P','E')/length('A','B'),pi)
        elif number in arc_examples:
            expected_radius, angle = arc_examples[number][idx]
            segments = view['highlightSegments']
            assert close(radius,expected_radius) and len(segments) == 24
            assert segments[0][0] == ids['A'] and segments[-1][1] == ids['B']
            assert all(last == next_first for (_,last),(next_first,_) in zip(segments,segments[1:]))
            for first, last in segments:
                assert close(dist(center,coords[last][:2])/unit,radius)
                assert close(turn(center,coords[first],coords[last]),radians(angle)/24)
        else:
            polygon, = view['polygons']
            measured = area([coords[k] for k in polygon])/unit**2
            if number == 14:
                n, r = [(6,3),(12,3),(24,5)][idx]
                assert len(polygon) == n and close(radius,r)
                assert close(length('T','H')/unit,r*cos(pi/n))
                assert close(measured,n*r**2*sin(2*pi/n)/2)
            else:
                areas = [1.5*pi,7.5*pi,4*pi] if number == 15 else [4*pi,4*pi-8,2*pi/3-sqrt(3)]
                lengths = [3,3,4] if number == 15 else [4,4,2]
                assert close(radius,lengths[idx]) and close(measured,areas[idx],.01)
                is_segment = number == 16 and idx > 0
                assert (ids['T'] not in polygon) == is_segment
                if is_segment:
                    assert any(set(pair) == {ids['A'],ids['B']} for pair in view['segments'])
                assert bool(view.get('rightAngles')) == (idx == 2 if number == 15 else idx < 2)
        count += 1
assert count == 63
print('CIRCLE_MEASURE_REVIEW_OK: nine source questions, arcs and 63 verified geometric views.')

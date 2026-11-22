"""Verify the registered, transformed SVG geometry independently in its displayed unit."""
import json
from math import acos, degrees, dist, isclose, pi, radians, sin

from sector_areas import OUT

cards = json.loads(OUT.read_bytes())['lessons']
# Each row holds the expected R, central arc measure, and multiple of the unit disk area.
expected = {
    '121': [(4,90,1/4), (4,90,1/4-1/(2*pi)), (3,120,1/3)],
    '1217': [(10,60,1/6), (10,60,5/6), (6,120,2/3)],
    '1218': [(5,72,1/5), (5,72,1/5), (6,90,1/4)],
    '1220': [(4,90,1/4), (4,90,1/4), (2,270,3/4)],
}


def polygon_area(points):
    return abs(sum(x[0]*y[1]-x[1]*y[0] for x,y in zip(points,points[1:]+points[:1],strict=True)))/2


views = 0
for c in cards:
    src = c['source']
    n = src.get('exercise', src.get('point'))
    pages = [306,307] if n == '121' else [309] if n == '1217' else [310]
    assert src['chapter'] == 'XIII' and src['printedPages'] == pages
    assert src['pdfPages'] == [p+1 for p in pages]
    if n == '1219':
        assert c['answer']['mode'] == 'exact' and 'πa²/4' in c['answer']['accepted']
        assert all('4−π' not in answer for answer in c['answer']['accepted'])
        assert 'белую середину' in c['answer']['feedback'] and '402' in c['answer']['feedback']
    model = c['visualization']['model']
    for key, view in model['views'].items():
        idx = int(key[-1])-1 if key[-1].isdigit() else 0
        ids = {name:k for k in view['points'] for name in model['labels'][k].split('=')}
        coords = model['points']
        p = lambda name: coords[ids[name]][:2]
        unit = dist(p('U'),p('W'))
        area = sum(polygon_area([coords[k] for k in poly]) for poly in view['polygons']) / unit**2
        if n == '1219':
            side = 4 if idx == 2 else 8
            for a,b in zip('ABCD','BCDA',strict=True):
                assert isclose(dist(p(a),p(b))/unit,side)
            for first,last,mid in zip('ABCD','BCDA','EFGH',strict=True):
                assert dist(p(mid),tuple((x+y)/2 for x,y in zip(p(first),p(last)))) < 1e-8
            assert len(view['rightAngles']) == 1 and len(view['polygons']) == (4 if idx == 1 else 1)
            exact = [pi*side**2/16,pi*side**2/4,side**2-pi*side**2/4][idx]
            assert isclose(area, exact, rel_tol=.006), (key,area,exact)
            if idx == 2:
                assert not set(ids[k] for k in 'ABCD').intersection(view['polygons'][0])
            else:
                assert all(sum(ids[k] in poly for k in 'ABCD') == 1 for poly in view['polygons'])
        else:
            radius, angle, fraction = expected[n][idx]
            assert all(isclose(dist(p('T'),p(k))/unit,radius) for k in ('A','B'))
            a = [(x-y)/unit for x,y in zip(p('A'),p('T'))]
            b = [(x-y)/unit for x,y in zip(p('B'),p('T'))]
            small = degrees(acos(max(-1,min(1,sum(x*y for x,y in zip(a,b))/radius**2))))
            assert isclose(small,min(angle,360-angle))
            assert len(view['polygons']) == 1 and len(view['circles']) == 1
            for k in view['polygons'][0]:
                if k != ids['T']:
                    assert isclose(dist(coords[k][:2],p('T'))/unit,radius,abs_tol=.00001)
            assert isclose(area,pi*radius**2*fraction,rel_tol=.005), (n,key,area,fraction)
            if n == '121' and idx == 1:
                assert ids['T'] not in view['polygons'][0]
                assert any({ids['A'],ids['B']}==set(pair) for pair in view['segments'])
            if angle == 90:
                assert len(view['rightAngles']) == 1
        views += 1
assert views == 35
assert isclose(250*pi/3,262,abs_tol=.5)
print('SECTOR_AREAS_OK: 35 measured SVG states, printed regions and radii, complementary key 1219 and angle units.')

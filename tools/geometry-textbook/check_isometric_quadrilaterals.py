"""Check the defining properties in every actual rendered scene of printed exercise 1245."""
import json
from itertools import combinations
from math import dist, isclose
from isometric_quadrilaterals import OUT


def vector(a,b):
    return b[0]-a[0], b[1]-a[1]


def cross(u,v):
    return u[0]*v[1] - u[1]*v[0]


def close(a,b):
    return isclose(a,b,rel_tol=1e-6,abs_tol=1e-6)


lessons = json.loads(OUT.read_bytes())['lessons']
parts = [('а',[318]), ('б',[318,319]), ('в',[319]), ('г',[319])]
for (part,pages), item in zip(parts, lessons, strict=True):
    src = item['source']
    assert (src['exercise'],src['subpart'],src['chapter'],src['printedPages'],src['pdfPages']) == ('1245',part,'XIV',pages,[n+1 for n in pages])
    assert item['answer']['mode'] == 'manual'
    assert [s['input']['accepted'][0] for s in item['steps'] if 'input' in s] == {'а':['2','16'],'б':['1','6'],'в':['20','52'],'г':['4','16']}[part]
    model = item['visualization']['model']
    assert len(model['views']) == 7
    for view_name, scene in model['views'].items():
        idx = int(view_name[-1])-1 if view_name[-1].isdigit() else 0
        labels = {n:k for k in scene['points'] for n in model['labels'][k].split('=')}
        def p(name):
            return model['points'][labels[name]][:2]
        unit = dist(p('U'),p('W'))
        for a,b in combinations('ABCD',2):
            assert close(dist(p(a),p(b)),dist(p(a+'′'),p(b+'′')))
        for suffix in ['', '′']:
            a,b,c,d = [p(n+suffix) for n in 'ABCD']
            ab,bc,cd,ad = vector(a,b),vector(b,c),vector(c,d),vector(a,d)
            assert close(cross(ab,cd),0) and not close(cross(ab,ad),0)
            assert close(cross(ad,bc),0) == (part != 'б')
            lengths = [dist(a,b)/unit,dist(b,c)/unit,dist(c,d)/unit,dist(d,a)/unit]
            if part == 'а' and idx == 2:
                assert close(sum(lengths),16)
            if part == 'б':
                if idx == 1:
                    z = p('P'+suffix)
                    assert close(cross(vector(a,z),ad),0) and close(cross(vector(b,z),bc),0)
                    assert dist(a,z)>dist(a,d) and dist(b,z)>dist(b,c)
                if idx == 2:
                    assert close(lengths[0],8) and close(lengths[2],4)
            if part == 'в':
                assert all(close(x,[5,5,13][idx]) for x in lengths)
            if part == 'г':
                assert len(scene['rightAngles']) == 8
                for mark in scene['rightAngles']:
                    t,v,w = [model['points'][mark[key]] for key in ('a','vertex','b')]
                    assert close((t[0]-v[0])*(w[0]-v[0])+(t[1]-v[1])*(w[1]-v[1]),0)
                assert close(lengths[0], [5,3,4][idx]) and close(lengths[1],[2,3,4][idx])
print('ISOMETRIC_QUADRILATERALS_OK: 4 printed subparts, 28 measured scenes, 5 classes of quadrilaterals.')

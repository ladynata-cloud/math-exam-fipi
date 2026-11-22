"""Measure all seven rendered views per exercise, including the degenerate angle."""
from itertools import combinations
import json
from math import acos, degrees, dist, isclose
from isometry_invariants import OUT

lessons = json.loads(OUT.read_bytes())['lessons']
assert [c['source']['exercise'] for c in lessons] == ['1242', '1243', '1244']


def cross(a, b, c):
    return (b[0]-a[0])*(c[1]-a[1]) - (b[1]-a[1])*(c[0]-a[0])


def close(a, b):
    return isclose(a, b, rel_tol=1e-6, abs_tol=1e-6)


for item in lessons:
    n = item['source']['exercise']
    assert item['source']['printedPages'] == [318] and item['source']['pdfPages'] == [319]
    assert item['source']['chapter'] == 'XIV' and 'subpart' not in item['source']
    assert item['answer']['mode'] == 'manual'
    assert [s['input']['accepted'][0] for s in item['steps'] if 'input' in s] == {
        '1242': ['180', '135'], '1243': ['4', '2'], '1244': ['0', '2']}[n]
    model = item['visualization']['model']
    assert len(model['views']) == 7
    for name, view in model['views'].items():
        i = int(name[-1])-1 if name[-1].isdigit() else 0
        labels = {label: point for point in view['points'] for label in model['labels'][point].split('=')}
        def pos(label):
            return model['points'][labels[label]][:2]
        length = dist(pos('U'), pos('W'))
        def measure(a, b):
            return dist(pos(a), pos(b)) / length
        expected_marks = {('1242',0): 2, ('1243',0): 8, ('1244',2): 4}
        assert len(view['rightAngles']) == expected_marks.get((n,i),0)
        for mark in view['rightAngles']:
            a,v,b = [model['points'][mark[key]] for key in ('a','vertex','b')]
            assert close((a[0]-v[0])*(b[0]-v[0]) + (a[1]-v[1])*(b[1]-v[1]), 0)
        vertices = 'AVB' if n == '1242' else 'ABCD'
        for a,b in combinations(vertices, 2):
            assert close(measure(a,b), measure(a+'′', b+'′'))
        if n == '1242':
            VA, VB, AB = measure('V','A'), measure('V','B'), measure('A','B')
            cosine = (VA*VA+VB*VB-AB*AB)/(2*VA*VB)
            assert close(degrees(acos(max(-1,min(1,cosine)))), [90,180,135][i])
        elif n == '1243':
            assert close(measure('A','B'), 4)
            for suffix in ['', '′']:
                poly = [pos(v+suffix) for v in vertices]
                signs = [cross(poly[j-1], poly[j], poly[(j+1)%4])>0 for j in range(4)]
                assert (len(set(signs)) == 2) == (i == 2)
                for j in [0,1]:
                    a,b,c,d = [poly[(k+j)%4] for k in range(4)]
                    assert cross(a,b,c)*cross(a,b,d)>0 or cross(c,d,a)*cross(c,d,b)>0
        else:
            for suffix in ['', '′']:
                A,B,C,D = [pos(v+suffix) for v in vertices]
                assert close(cross(A,B,C), cross(A,B,D))
                assert not close(cross(A,B,C),0)
                assert close(abs(cross(A,B,C))/dist(A,B)/length, [3,3,2][i])
print('ISOMETRY_INVARIANTS_OK: 3 proofs and 21 measured figures, including a straight angle and a concave quadrilateral.')

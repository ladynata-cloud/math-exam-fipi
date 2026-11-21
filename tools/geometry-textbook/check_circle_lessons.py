"""Check the published models, source subdivisions, full circles and staged right angles."""
import json
from math import acos, degrees, dist, isclose
from pathlib import Path

DATA = Path(__file__).resolve().parents[2] / 'geometry-course/textbook/data/circle-lessons.json'


def near(a, b):
    assert isclose(a, b, abs_tol=1e-6, rel_tol=1e-8), (a, b)


def vector(a, b):
    return (b[0] - a[0], b[1] - a[1])


def dot(a, b):
    return a[0]*b[0] + a[1]*b[1]


def cross(a, b):
    return a[0]*b[1] - a[1]*b[0]


def verify(item):
    source = item['source']
    number = int(source['exercise'])
    page = 221 if number <= 902 else 222
    assert source['bookId'] == 'atanasyan-2023-7-9'
    assert source['printedPages'] == [page] and source['pdfPages'] == [page + 1]
    assert source['relatedChapters'] == [9] and source['advancedGrade'] == 8
    inputs = [step['input'] for step in item['steps'] if 'input' in step]
    assert len(inputs) == 2 and inputs[0]['prompt'] != inputs[1]['prompt']
    model = item['visualization']['model']
    points = model['points']
    for view in model['views'].values():
        for circle in view.get('circles', []):
            c, t = points[circle['center']][:2], points[circle['through']][:2]
            r = dist(c, t)
            assert r > 0
            assert c[0] - r > 0 and c[0] + r < 100
            assert c[1] - r > 0 and c[1] + r < 70
        for mark in view.get('rightAngles', []):
            vertex, a, b = [mark[k] for k in ('vertex', 'a', 'b')]
            for end in (a, b):
                assert any(set(edge) == {vertex, end} for edge in view['segments'])
            u, v = vector(points[vertex], points[a]), vector(points[vertex], points[b])
            assert dot(u, u) > 0 and dot(v, v) > 0
            near(dot(u,v), 0)
    p = {key.split('__')[0]: val[:2] for key, val in points.items() if key.endswith('__v0')}
    def length(a,b):
        return dist(p[a],p[b])
    def direction(a,b):
        return vector(p[a],p[b])
    def collinear(a,b,c):
        near(cross(direction(a,b),direction(a,c)),0)
    def angle(a,b,c):
        cosine = dot(direction(b,a),direction(b,c))/(length(b,a)*length(b,c))
        return degrees(acos(max(-1,min(1,cosine))))
    if number == 900:
        collinear('O','M','Q')
        collinear('A','M','B')
        collinear('X','M','Y')
        near(length('O','A'),length('O','M'))
        near(length('Q','Y'),length('Q','M'))
        near(cross(direction('A','X'),direction('B','Y')),0)
        near(length('A','X')/length('B','Y'),length('O','M')/length('Q','M'))
    elif number == 901:
        near(length('O','A'),length('O','D'))
        near(length('Q','B'),length('Q','C'))
        near(cross(direction('A','D'),direction('B','C')),0)
        near(length('A','B')**2,length('A','D')*length('B','C'))
        near((length('B','D')/length('A','C'))**2,length('A','D')/length('B','C'))
    elif number == 902:
        for name in 'BCXY':
            near(length('O','A'),length('O',name))
        near(length('A','X'),length('X','B'))
        near(length('A','Y'),length('Y','C'))
        near(length('A','M'),length('A','N'))
    elif number == 903:
        near(length('A','B'),length('C','D'))
        near(length('A','U'),length('U','B'))
        near(length('P','U'),length('P','V'))
        for left,right in zip(sorted(length('P',k) for k in 'AB'),sorted(length('P',k) for k in 'CD')):
            near(left,right)
    elif number == 904:
        near(length('A','B')**2/length('A','D'),2*length('O','B'))
    elif number == 905:
        near(length('B','C'),2*length('U','V'))
        projection=abs(dot(direction('O','Q'),direction('B','C')))/length('B','C')
        near(projection,length('U','V'))
    elif number == 906:
        near(length('O','P'),length('M','H'))
        near(length('I','P'),length('O','U')/2)
        near(length('O','J'),length('O','V')/2)
    elif number == 907:
        for names,expected in [('BMC',30),('BMA',17),('BAM',146),('BCM',107)]:
            near(angle(*names),expected)
    elif number == 908:
        for a,b,c,e in [('B','A','C','U'),('A','B','C','V'),('A','C','B','W')]:
            near(angle(a,b,e),angle(e,b,c))
    elif number == 909:
        for name in 'BCXY':
            near(length('O',name),length('O','A'))
        near(length('A','Y'),2*length('O','A'))
        near(length('U','H'),length('U','X'))
        near(length('M','H'),length('M','Y'))


if __name__ == '__main__':
    lessons = json.loads(DATA.read_text())['lessons']
    parts = [(int(l['source']['exercise']), l['source'].get('subpart')) for l in lessons]
    assert parts == [(900,None),(901,'а'),(901,'б'),(901,'в')] + [(n,None) for n in range(902,910)]
    for item in lessons:
        try:
            verify(item)
        except AssertionError as exc:
            raise AssertionError(item['id']) from exc
    print('ATANASYAN_CIRCLE_MODELS_OK 10 номеров, 12 авторских решений, 24 числовые проверки')

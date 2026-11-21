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
    page = 221 if number <= 902 else 222 if number <= 913 else 223
    assert source['bookId'] == 'atanasyan-2023-7-9'
    assert source['printedPages'] == [page] and source['pdfPages'] == [page + 1]
    assert source['relatedChapters'] == [9] and source['advancedGrade'] == 8
    inputs = [step['input'] for step in item['steps'] if 'input' in step]
    assert len(inputs) == 2 and inputs[0]['prompt'] != inputs[1]['prompt']
    model = item['visualization']['model']
    points = model['points']
    for index, step in enumerate(item['steps'], 1):
        assert step['view'] == f'step-{index}' and step['view'] in model['views']
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


    elif number == 910:
        near(length('A','B')/length('B','C'),length('A','D')/length('D','C'))
        near(length('B','D')**2,length('A','B')*length('B','C')-length('A','D')*length('D','C'))
        v = {key.split('__')[0]: val[:2] for key,val in points.items() if key.endswith('__v3')}
        near(dist(v['B'],v['D'])*dist(v['D'],v['E']),dist(v['A'],v['D'])*dist(v['D'],v['C']))
    elif number == 911:
        near(length('E','A'),length('E','C'))
        near(length('O','B'),length('O','E'))
        near(angle('O','B','E'),angle('E','B','H'))
    elif number == 912:
        near(length('A','X'),length('B','X')+length('C','X'))
        v = {key.split('__')[0]: val[:2] for key,val in points.items() if key.endswith('__v3')}
        near(dist(v['A'],v['Y']),dist(v['C'],v['X']))
        near(dist(v['Y'],v['X']),dist(v['B'],v['X']))
    elif number == 913:
        diameter=2*length('O','A')
        for a,b,c,d in [('A','B','C','D'),('B','C','D','A')]:
            near(length(a,b)**2+length(c,d)**2,diameter**2)


    elif number == 914:
        collinear('C','P','D')
        near(angle('D','A','P'),angle('P','A','B'))
        near(angle('A','B','P'),angle('P','B','C'))
        near(length('D','C'),length('A','D')+length('B','C'))
        for name in 'BCD':
            near(length('O',name),length('O','A'))
    elif number == 915:
        near((length('A','B')+length('C','D'))*length('A','D')/2,length('A','B')*length('C','D'))
        for a,b in [('A','B'),('B','C'),('C','D'),('D','A')]:
            near(abs(cross(direction(a,b),direction(a,'O')))/length(a,b),length('O','U'))
    elif number == 916:
        near(length('A','C')*length('B','D'),length('A','B')*length('C','D')+length('A','D')*length('B','C'))
        v={key.split('__')[0]:val[:2] for key,val in points.items() if key.endswith('__v3')}
        near(dist(v['A'],v['K'])*dist(v['B'],v['D']),dist(v['A'],v['B'])*dist(v['C'],v['D']))
    elif number == 917:
        v={key.split('__')[0]:val[:2] for key,val in points.items() if key.endswith('__v2')}
        R=dist(v['O'],v['A']);r=dist(v['I'],v['T'])
        near(dist(v['O'],v['I'])**2,R**2-2*R*r)
        near(dist(v['I'],v['M']),dist(v['B'],v['M']))
        near(dist(v['A'],v['I'])*dist(v['I'],v['M']),2*R*r)
    elif number == 918:
        assert model['views']['case-all-nine']['availableFromStep']==3
        v={key.split('__')[0]:val[:2] for key,val in points.items() if key.endswith('__v4')}
        for name in 'UVWFGKDEJ':
            near(dist(v['Q'],v[name]),dist(v['O'],v['A'])/2)
    elif number == 919:
        collinear('P','Q','R')
        for a,b,f in [('A','B','P'),('B','C','Q'),('C','A','R')]:
            near(dot(direction(a,b),direction(f,'X')),0)
            collinear(a,f,b)
        near(length('O','A'),length('O','X'))


    elif number == 920:
        for j,sign in [(1,1),(2,-1)]:
            v={key.split('__')[0]:val[:2] for key,val in points.items() if key.endswith(f'__v{j}')}
            near(dist(v['O'],v['X']),dist(v['O'],v['U']))
            near(dist(v['Q'],v['Y']),dist(v['Q'],v['V']))
            near(dist(v['O'],v['T']),dist(v['O'],v['U'])-sign*dist(v['Q'],v['V']))
            near(cross(vector(v['O'],v['X']),vector(v['Q'],v['Y'])),0)
            assert sign*dot(vector(v['O'],v['X']),vector(v['Q'],v['Y']))>0
    elif number == 921:
        near(length('O','A'),length('O','B'))
        near(length('A','H'),length('H','B'))
        near(length('O','A')**2,length('A','H')**2+length('O','H')**2)
    elif number == 922:
        v={key.split('__')[0]:val[:2] for key,val in points.items() if key.endswith('__v2')}
        near(dist(v['X'],v['Y']),2*(dist(v['O'],v['X'])**2-dist(v['O'],v['P'])**2)**.5)
        assert dist(v['X'],v['Y'])<dist(v['A'],v['B'])
    elif number == 923:
        if source['subpart']=='а':
            v={key.split('__')[0]:val[:2] for key,val in points.items() if key.endswith('__v3')}
            near(dist(v['A'],v['O']),dist(v['K'],v['O']))
            near(v['A'][1],v['K'][1])
            near(dist(v['A'],v['B']),dist(v['K'],v['C']))
        else:
            from math import radians,tan
            per=sum(length(a,b) for a,b in [('A','B'),('B','C'),('C','A')])
            h=length('A','H');q=h/tan(radians(angle('B','A','C')/2))
            near(length('B','C'),per**2/(2*(per+q)))
    elif number == 924:
        v={key.split('__')[0]:val[:2] for key,val in points.items() if key.endswith('__v3')}
        for name in 'BMXYZ':
            near(dist(v['O'],v[name]),dist(v['O'],v['A']))
        near(cross(vector(v['X'],v['M']),vector(v['X'],v['T'])),0)
        near(cross(vector(v['X'],v['A']),vector(v['O'],v['B'])),0)
        near(dist(v['T'],v['Y']),dist(v['T'],v['Z']))
        near(dist(v['B'],v['Y']),dist(v['B'],v['Z']))
    elif number == 925:
        v={key.split('__')[0]:val[:2] for key,val in points.items() if key.endswith('__v3')}
        for f,a,b,c,d in [('P','I','U','V','W'),('Q','I','V','U','W'),('R','I','W','U','V')]:
            near(cross(vector(v[a],v[b]),vector(v[a],v[f])),0)
            near(cross(vector(v[c],v[d]),vector(v[c],v[f])),0)
            near(dot(vector(v[a],v[b]),vector(v[c],v[d])),0)


if __name__ == '__main__':
    lessons = json.loads(DATA.read_text())['lessons']
    parts = [(int(l['source']['exercise']), l['source'].get('subpart')) for l in lessons]
    assert parts == [(900,None),(901,'а'),(901,'б'),(901,'в')] + [(n,None) for n in range(902,923)] + [(923,'а'),(923,'б'),(924,None),(925,None)]
    for item in lessons:
        try:
            verify(item)
        except AssertionError as exc:
            raise AssertionError(item['id']) from exc
    print('ATANASYAN_CIRCLE_MODELS_OK 26 номеров, 29 авторских решений, 58 числовых проверок')

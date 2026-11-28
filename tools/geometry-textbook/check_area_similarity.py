"""Check the actual published drawing coordinates against the mathematical results."""
import json
from math import acos, degrees, dist, isclose, sqrt
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'geometry-course/textbook/data/area-similarity-lessons.json'


def difference(a, b):
    return (a[0]-b[0], a[1]-b[1])


def dot(a,b):
    return a[0]*b[0]+a[1]*b[1]


def determinant(a,b):
    return a[0]*b[1]-a[1]*b[0]


def near(a,b):
    assert isclose(a,b,rel_tol=1e-8,abs_tol=1e-7), (a,b)


def check_model(record):
    number=int(record['source']['exercise'])
    model=record['visualization']['model']
    for view in model['views'].values():
        for item in view.get('rightAngles',[]):
            vertex=model['points'][item['vertex']]
            u=difference(model['points'][item['a']],vertex)
            v=difference(model['points'][item['b']],vertex)
            near(dot(u,v),0)
    p={k.split('__')[0]:v[:2] for k,v in model['points'].items() if k.endswith('__v0')}
    def length(a,b):return dist(p[a],p[b])
    def area(names):
        points=[p[x] for x in names]
        return abs(sum(determinant(a,b) for a,b in zip(points,points[1:]+points[:1])))/2
    def vector(a,b):return difference(p[b],p[a])
    def angle(a,b,c):
        cosine=dot(vector(b,a),vector(b,c))/(length(a,b)*length(b,c))
        return degrees(acos(max(-1,min(1,cosine))))
    def parallel(a,b,c,d):near(determinant(vector(a,b),vector(c,d)),0)
    def perpendicular(a,b,c,d):near(dot(vector(a,b),vector(c,d)),0)
    def middle(x,y,z):
        for axis in [0,1]:near(2*p[y][axis],p[x][axis]+p[z][axis])
    if number==854:
        near(area('ABCD'),2*sqrt(area('KBC')*area('CDM')))
    elif number==855:
        parallel('B','E','C','T')
        near(length('O','M')/length('O','K'),length('O','E')/length('O','C'))
        for a,b,c in [('A','E','C'),('B','T','D')]:near(length(a,c),length(a,b)+length(b,c))
    elif number==856:
        near(length('A','C'),length('A','D'))
        near(area('BDM'),area('BCK'))
        near(angle('B','K','M'),angle('B','A','C')/2)
    elif number==857:
        near(length('A','M')**2+length('C','M')**2,length('B','M')**2+length('D','M')**2)
    elif number==858:
        near(length('D','C'),length('A','K'));near(length('A','D'),length('C','M'))
        near(length('M','B'),length('K','B'))
    elif number==859:
        near(area('ABO'),area('BCO'));near(area('BCO'),area('CAO'))
        near(length('O','A')**2+length('O','B')**2,5*length('O','C')**2)
    elif number==860:
        near(angle('A','F','E'),108)
        near(length('D','A')*length('A','F'),length('D','F')**2)
    elif number==861:
        middle('B','M','C');middle('D','M','F')
        near(length('B','D'),length('C','E'))
    elif number==862:
        for apex,h1,h2,h3 in [('A','F','D','E'),('B','D','E','F'),('C','E','F','D')]:
            near(angle(h1,h2,apex),angle(apex,h2,h3))
    elif number==863:
        near(length('A','E'),length('F','B'));middle('A','M','B')
        parallel('E','K','A','C');parallel('F','K','B','C')
        near(length('M','K')+length('K','C'),length('M','C'))
    elif number==864:
        near(length('A','B'),length('A','V'));middle('A','O','U')
        near(length('C','O'),(length('A','C')+length('B','C'))/sqrt(2))
    elif number==865:
        near(angle('B','A','C'),180/7);near(angle('A','B','C'),360/7)
        near(1/length('B','C'),1/length('A','C')+1/length('A','B'))
        near(angle('W','B','T'),angle('A','B','C'))
        near(length('W','T')*length('A','B'),length('W','B')*length('A','C'))
    elif number==866:
        perpendicular('R','S','O','M')
    elif number==867:
        middle('A','D','C');middle('D','M','H');perpendicular('B','M','A','H')
    elif number==868:
        h,w,ae,bf=length('C','D'),length('A','B'),length('A','E'),length('B','F')
        near(h**3,w*ae*bf);near(ae**2+bf**2+3*h**2,w**2)
        near(ae**(2/3)+bf**(2/3),w**(2/3))
    elif number==869:
        near(length('A','D'),length('B','D'));near(length('B','D'),length('C','D'))
        for names,value in zip(['DAB','ABC','BCD','CDA'],[75,135,60,90]):near(angle(*names),value)
        near(length('A','B')**2,length('B','P')*length('B','D'))
    elif number==870:
        for names in ['MAN','NBP','PCQ','QDM']:middle(*names)
    elif number==871:
        middle('A','M','D');middle('B','N','C');middle('A','O','C')
        assert length('M','N')<(length('A','B')+length('C','D'))/2


if __name__=='__main__':
    lessons=json.loads(DATA.read_text())['lessons']
    keys=[(int(l['source']['exercise']),l['source'].get('subpart')) for l in lessons]
    expected=[(n,part) for n in range(854,872) for part in {860:['а','б'],868:['а','б','в'],869:['а','б']}.get(n,[None])]
    assert keys==expected and len({l['id'] for l in lessons})==len(expected)
    for lesson in lessons:
        assert len(lesson['steps'])==3 and sum('input' in s for s in lesson['steps'])==1
        assert len(lesson['visualization']['model']['views'])==4
        try:check_model(lesson)
        except AssertionError as error:raise AssertionError(lesson['id']) from error
    print(f'{len(lessons)} source-matched diagrams and their results verified for exercises 854–871')

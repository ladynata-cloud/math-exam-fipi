"""Independent metric checks for the three triangle laws, the three constructions and the two survey problems."""
import json
from math import acos, cos, degrees, hypot, isclose, radians, sin, sqrt
from triangle_review import OUT

def delta(a,b):
    return tuple(x-y for x,y in zip(a,b,strict=True))

def dot(a,b):
    return a[0]*b[0]+a[1]*b[1]

def angle(a,b,c):
    u,v=delta(a,b),delta(c,b)
    return degrees(acos(max(-1,min(1,dot(u,v)/(hypot(*u)*hypot(*v))))))

def distance(a,b):
    return hypot(*delta(a,b))

def near(x,y):
    return isclose(x,y,abs_tol=.001)

records=json.loads(OUT.read_bytes())['lessons'];assert len(records)==6
scenes=0
for n,e in enumerate(records,8):
    s=e['source'];assert e['id']==f'atanasyan-7-9-selfcheck-chapter-12-{n}-part-1'
    assert e['answer']['mode']=='manual' and s['collection']=='selfcheck' and s['exercise']==str(n)
    assert s['chapter']=='XII' and s['printedPages']==[291] and s['pdfPages']==[292]
    assert len([item for item in e['steps'] if 'input' in item])==2
    m=e['visualization']['model'];raw=m['points']
    for key,v in m['views'].items():
        i=2 if key in ('step-3','case-3') else 1 if key in ('step-2','case-2') else 0
        suffix='__v'+v['points'][0].split('__v')[1];o=raw['O'+suffix];unit=raw['_unitX'+suffix][0]-o[0]
        assert unit>0 and near(raw['_unitY'+suffix][1]-o[1],unit)
        p={name:tuple((raw[j][k]-o[k])/unit for k in (0,1)) for j in v['points'] for name in m['labels'][j].split('=')}
        scenes+=1
        if n==12:
            h=distance(p['H'],p['T']);xn=distance(p['H'],p['N']);xf=distance(p['H'],p['F'])
            d=distance(p['F'],p['N']);assert near(xf-xn,d)
            assert near(h,[6,6,12][i]) and near(xn,[4,6,8][i]) and near(xf,[10,12,20][i])
            tan1,tan2=h/xn,h/xf
            assert near(d*tan1*tan2/(tan1-tan2),h)
            continue
        a,b,c=[p[j] for j in 'ABC']
        lengths=distance(b,c),distance(a,c),distance(a,b)
        angles=angle(b,a,c),angle(c,b,a),angle(a,c,b)
        area=abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2
        assert near(sum(angles),180)
        assert near(area,.5*lengths[1]*lengths[2]*sin(radians(angles[0])))
        if n==8:
            assert near(area,[12,12,10][i]) and near(angles[0],[30,150,90][i])
        elif n==9:
            assert all(near(side/sin(radians(phi)),10 if i==2 else 5) for side,phi in zip(lengths,angles))
            if i:assert all(near(distance(p['K'],vtx),5 if i==2 else 2.5) for vtx in (a,b,c)) and len(v['circles'])==1
        elif n==10:
            assert near(lengths[0]**2,[19,49,34][i]) and near(angles[0],[60,120,90][i])
        elif n==11:
            if i==0:assert all(near(x,y) for x,y in zip(lengths,[5,3,4]))
            elif i==1:assert near(lengths[0]**2,13) and near(angles[0],60)
            else:assert all(near(x,y) for x,y in zip(angles,[30,60,90])) and near(lengths[0],3)
        elif n==13:
            assert near(lengths[2],[10,10,12][i]) and near(lengths[1],[10,5*sqrt(3),6][i])
            assert near(angles[0],[60,30,60][i]) and near(angles[1],[60,60,30][i])
tests=0
for hn in range(1,36):
    for d in range(1,25):
        for h in range(1,18):
            a,b=h/hn,h/(hn+d)
            assert near(d*a*b/(a-b),h);tests+=1
print(f'TRIANGLE_REVIEW_OK {len(records)} source questions, {scenes} metric triangle scenes, {tests} independent inaccessible-base checks.')

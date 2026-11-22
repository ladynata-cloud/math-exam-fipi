"""Measure all compass-constructed lengths and tangent lines actually shown in each authored view."""
import json
from math import cos, dist, hypot, isclose, pi
from regular_compass_finale import OUT


def near(a,b):return isclose(a,b,abs_tol=1e-6,rel_tol=1e-6)
def sub(a,b):return (a[0]-b[0],a[1]-b[1])
def dot(a,b):return a[0]*b[0]+a[1]*b[1]
def det(a,b):return a[0]*b[1]-a[1]*b[0]


lessons=json.loads(OUT.read_bytes())['lessons']
assert len(lessons)==6
count=0
for e in lessons:
    src=e['source'];n=int(src['exercise']);part=int(e['id'].split('-')[-1])
    assert src['chapter']=='XIII' and src['printedPages']==[312] and src['pdfPages']==[313] and e['answer']['mode']=='manual'
    m=e['visualization']['model'];raw=m['points']
    for key,v in m['views'].items():
        ix=int(key[-1])-1 if key[-1].isdigit() else 0
        ids={name:k for k in v['points'] for name in m['labels'][k].split('=')}
        suf=ids['U'][ids['U'].index('__v'):]
        p=lambda k:raw[ids[k] if k in ids else k+suf][:2];u=dist(p('U'),p('W'));d=lambda a,b:dist(p(a),p(b))/u
        radii=[dist(raw[r['center']][:2],raw[r['through']][:2])/u for r in v.get('circles',[])]
        if n==1236:
            a=4 if ix==2 else 3
            assert near(d('A','B'),a) and near(d('A','M'),a/2) and near(d('T','A'),d('T','B'))
            assert abs(dot(sub(p('A'),p('M')),sub(p('T'),p('M'))))<1e-5
            q=sub(p('A'),p('T'));r=sub(p('B'),p('T'))
            assert near(dot(q,r)/(hypot(*q)*hypot(*r)),cos(pi/4))
            assert len(radii)==int(ix!=0)
            if ix==2:assert all(near(d(i,j),4) for i,j in zip('ABCDEFGH','BCDEFGHA',strict=True))
        elif n==1237:
            if ix==0: assert near(radii[0],3) and near(radii[1],4)
            else:
                a,b=(5,12) if ix==2 else (3,4)
                assert near(d('A','B'),a) and near(d('A','C'),b) and near(d('B','C')**2,a*a+b*b)
                assert len(v['rightAngles'])==1 and len(radii)==int(ix==2)
                if ix==2:assert near(radii[0],13)
        else:
            sides={(1238,1):3,(1238,2):6,(1239,1):4,(1239,2):8}[(n,part)]
            expect=3 if ix!=2 else {(1238,1):4,(1238,2):5,(1239,1):2,(1239,2):4}[(n,part)]
            assert len(radii)==1 and near(radii[0],expect)
            touch=['A','B',*['_touch'+str(i) for i in range(2,sides)]]
            vs=['P','Q',*['_vertex'+str(i) for i in range(2,sides)]]
            assert all(near(d('T',k),expect) for k in (touch[:2] if ix==1 else touch))
            if ix:
                assert len(v['rightAngles'])==2
                for i in range(sides if ix==2 else 2):
                    P,Q,H=p(vs[i]),p(vs[(i+1)%sides]),p(touch[i]);T=p('T')
                    assert abs(dot(sub(T,H),sub(P,Q)))<1e-5
                    assert near(dist(P,H),dist(Q,H))
                if ix==2:
                    length=d(vs[0],vs[1])
                    assert all(near(d(vs[i],vs[(i+1)%sides]),length) for i in range(sides))
        count+=1
assert count==42
print('REGULAR_COMPASS_FINALE_OK: all six source constructions, 42 measured states, chord closure, Pythagorean areas and tangency.')

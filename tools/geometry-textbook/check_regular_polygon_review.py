"""Check the examples, counterexamples, radii, apothems, areas and turning angles in the seven review questions."""
import json
from math import acos, cos, degrees, dist, hypot, isclose, pi, sin, sqrt
from regular_polygon_review import OUT

def v(a,b):return (a[0]-b[0],a[1]-b[1])
def dot(a,b):return a[0]*b[0]+a[1]*b[1]
def near(a,b):return isclose(a,b,rel_tol=1e-6,abs_tol=1e-6)


q=json.loads(OUT.read_bytes())['lessons'];count=0
assert len(q)==7
for n,c in enumerate(q,1):
    src=c['source'];assert c['id']==f'atanasyan-7-9-selfcheck-chapter-13-{n}-part-1'
    assert src['collection']=='selfcheck' and src['chapter']=='XIII' and src['printedPages']==[310] and src['pdfPages']==[311]
    assert c['answer']['mode']=='manual' and len([s for s in c['steps'] if 'input' in s])==2
    m=c['visualization']['model'];p0=m['points']
    for key,s in m['views'].items():
        idx=int(key[-1])-1 if key[-1].isdigit() else 0
        ids={l:k for k in s['points'] for l in m['labels'][k].split('=')};p=lambda name:p0[ids[name]][:2];d=lambda a,b:dist(p(a),p(b))
        if n==1:
            if idx==0: assert near(d('A','B')/d('B','C'),2) and near(dot(v(p('A'),p('B')),v(p('C'),p('B'))),0)
            elif idx==1:assert near(d('A','B'),d('B','C')) and not near(dot(v(p('A'),p('B')),v(p('C'),p('B'))),0)
            else:assert near(d('A','B'),d('B','C')) and near(d('B','C'),d('A','C'))
        if n==2:
            if idx<2: assert len(s['segments'])>=2*[5,8][idx]-3
            else:
                a,b=v(p('E'),p('A')),v(p('B'),p('A'))
                assert near(degrees(acos(dot(a,b)/(hypot(*a)*hypot(*b)))),40)
        if n==3:
            rad=s['circles'][0];r=dist(p0[rad['center']][:2],p0[rad['through']][:2])
            assert all(near(d('T',k),r) for k in 'ABV')
        if n==4:
            rad=s['circles'][0];r=dist(p0[rad['center']][:2],p0[rad['through']][:2])
            assert near(d('T','H'),r) and near(d('T','K'),r) and d('T','A')>r
        if n>=5:
            unit=d('U','W');arr={5:([6,6,4],[4,4,3*sqrt(2)]),6:([6,6,4],[4,4,4]),7:([3,4,6],[2,2,5])}
            ns,rs=arr[n];sides,r=ns[idx],rs[idx];a=d('A','B')/unit;h=d('T','H')/unit
            assert near(d('T','A')/unit,r) and near(h,r*cos(pi/sides)) and near(a,2*r*sin(pi/sides))
            if n==5 and idx==2:assert near(sides*a*h/2,36)
        count+=1
assert count==49
print('REGULAR_POLYGON_REVIEW_OK: all first seven printed review questions, 49 independently measured diagrams.')

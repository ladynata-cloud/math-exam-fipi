"""Measure all source and transfer figures without reusing either triangle-center constructor."""
import json
from math import hypot,isclose,pi,sqrt

from inscribed_circle_lengths import OUT


def dist(a,b):return hypot(a[0]-b[0],a[1]-b[1])
def near(a,b):return isclose(a,b,abs_tol=.00012)
def delta(a,b):return a[0]-b[0],a[1]-b[1]
def dot(a,b):return a[0]*b[0]+a[1]*b[1]
def det(a,b):return a[0]*b[1]-a[1]*b[0]


records=json.loads(OUT.read_bytes())['lessons']
# Diameter derived directly from the printed data and from independently chosen transfers.
diameters=[(4*sqrt(3),6*sqrt(3)),(5,13),(25/4,25/3),(5,sqrt(68)),(8,4),(6,10),
           (6-3*sqrt(2),10-5*sqrt(2)),(2,4),(3,8/3)]
counts=[3,3,3,4,6,4,3,3,3]
expected=['2πa√3/3','π√(a²+b²)','2πb²/√(4b²−a²)','πa/sin(α/2)','8π','πa','πc(√2−1)','πc(sinα+cosα−1)','2πh·tg(α/2)·ctgα']
circles=tangencies=0
for i,c in enumerate(records):
    n=1193 if i<5 else 1194;part=i if i<5 else i-5;s=c['source']
    assert s['printedPages']==[307] and s['pdfPages']==[308] and s['chapter']=='XIII'
    assert s['exercise']==str(n) and s['subpart']=='абвгд'[part]
    assert c['id']==f'atanasyan-7-9-main-{n}-part-{part+1}' and c['answer']['accepted'][0]==expected[i]
    assert len(c['steps'])==3 and len(c['help'])>=2
    m=c['visualization']['model'];allp=m['points']
    for key,v in m['views'].items():
        names={name:k for k in v['points'] for name in m['labels'][k].split('=')}
        p=lambda name:allp[names[name]]
        unit=dist(p('U'),p('W'));T=p('T')
        circle,=v['circles'];R=dist(allp[circle['through']],allp[circle['center']])/unit
        assert dist(T,allp[circle['center']])<.00001
        assert near(2*R,diameters[i][int(key.endswith('3'))]),(c['id'],key,R)
        vertices=list('ABCDEF'[:counts[i]])
        if n==1193:
            assert all(near(dist(T,p(k))/unit,R) for k in vertices)
            if i==2 and key.endswith('3'):assert det(delta(p('B'),p('A')),delta(p('C'),p('A')))*det(delta(p('B'),p('A')),delta(T,p('A')))<0
        else:
            for a,b in zip(vertices,vertices[1:]+vertices[:1],strict=True):
                u=delta(p(b),p(a));w=delta(T,p(a));foot=dot(u,w)/dot(u,u)
                assert 0<foot<1 and near(abs(det(u,w))/dist(p(a),p(b))/unit,R)
                tangencies+=1
            assert len(v['rightAngles'])==(2 if i==5 else 3)
            for mark in v['rightAngles']:
                vertex=allp[mark['vertex']];assert near(dot(delta(T,vertex),delta(allp[mark['b']],vertex))/unit**2,0)
        circles+=1
assert len(records)==9 and circles==63
print(f'INSCRIBED_CIRCLE_LENGTHS_OK nine original parts, {circles} measured circles, {tangencies} interior tangencies and both diagonal/bisector constructions.')

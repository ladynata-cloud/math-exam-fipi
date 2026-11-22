"""Derive radii, heights, circumferences, perimeter, areas and travelled distances from the final views."""
from math import dist, isclose, pi, radians, sin, sqrt
import json
from arc_routes_and_incircles import OUT


def delta(p,q):return (p[0]-q[0],p[1]-q[1])
def det(p,q):return p[0]*q[1]-p[1]*q[0]
def near(a,b):return isclose(a,b,rel_tol=1e-6,abs_tol=1e-6)


cards=json.loads(OUT.read_bytes())['lessons'];count=0
assert len(cards)==5
for c in cards:
    n=int(c['source']['exercise']);part=int(c['id'].split('-')[-1]);source=c['source']
    assert source['chapter']=='XIII' and source['printedPages']==[312] and source['pdfPages']==[313]
    assert c['answer']['mode']==('manual' if n==1232 else 'exact')
    m=c['visualization']['model'];coords=m['points']
    for key,v in m['views'].items():
        idx=int(key[-1])-1 if key[-1].isdigit() else 0
        ids={l:k for k in v['points'] for l in m['labels'][k].split('=')}
        p=lambda k:coords[ids[k]][:2];unit=dist(p('U'),p('V' if n==1231 else 'W'))
        d=lambda a,b:dist(p(a),p(b))/unit
        radii=[dist(coords[t['center']][:2],coords[t['through']][:2])/unit for t in v['circles']]
        if n==1229:
            assert len(radii)==2 and near(radii[0]*1600,6370)
            coeff=[3.14,pi,3.14][idx]
            cir=radii[1]*1600*2*coeff
            assert near(cir,[42076,42076,43960][idx])
            assert round(d('A','B')*1600)==[330,327,630][idx]
        elif n==1230:
            r,=radii;a=d('A','B');other=d('B','C')
            assert near(a,other) and near(d('T','H'),r) and len(v['rightAngles'])==2
            for x,y in zip('ABCD','BCDA',strict=True):
                assert near(abs(det(delta(p('T'),p(x)),delta(p(y),p(x))))/(dist(p(x),p(y))*unit),r)
            S=d('A','C')*d('B','D')/2
            assert near(S,2*a*r)
            if part==1:
                assert near(a,10 if idx==2 else 5) and near(2*r,9.6 if idx==2 else 4.8)
            else:
                target=60 if idx==2 else 30
                assert near(a,6 if idx==2 else 4) and near(2*r,a*sin(radians(target)))
        elif n==1231:
            R,=radii;diff=6 if idx==2 else 3
            assert near(2*pi*R-d('A','B'),diff)
            if idx:assert near(d('P','E'),2*pi*R)
            assert round(2*pi*R,1)==(8.8 if idx==2 else 4.4)
        else:
            R,=radii;nvert=[3,6,4][idx];P=nvert*d('A','B')
            assert near(R,3) and near(d('T','H'),R)
            names='ABCDEF'[:nvert];points=[p(x) for x in names]
            S=abs(sum(det(a,b) for a,b in zip(points,points[1:]+points[:1],strict=True)))/(2*unit**2)
            assert near(pi*R**2/S,2*pi*R/P)
            if idx==2:assert near(P,24)
        count+=1
assert count==35
print('ARC_ROUTES_AND_INCIRCLES_OK: 35 measured scenes, both approximations of pi, rhombus tangencies, unrolled routes and perimeter ratios.')

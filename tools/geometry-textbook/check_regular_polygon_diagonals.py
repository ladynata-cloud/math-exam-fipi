"""Measure geometry from the retained scene, including the equality and ordering claims."""
from math import acos, degrees, dist, hypot, isclose, sqrt
import json
from regular_polygon_diagonals import OUT, vertex


def near(a,b):return isclose(a,b,rel_tol=1e-6,abs_tol=1e-6)
def v(x,y):return x[0]-y[0],x[1]-y[1]
def dot(a,b):return a[0]*b[0]+a[1]*b[1]
def angle(x,y,z):
    a,b=v(x,y),v(z,y)
    return degrees(acos(max(-1,min(1,dot(a,b)/(hypot(*a)*hypot(*b))))))
def shoelace(p):
    return abs(sum(a[0]*b[1]-a[1]*b[0] for a,b in zip(p,p[1:]+p[:1],strict=True)))/2

entries=json.loads(OUT.read_bytes())['lessons']
assert len(entries)==7
count=0
for e in entries:
    n=int(e['source']['exercise']);m=e['visualization']['model'];source=e['source'];assert source['printedPages']==[311] and source['pdfPages']==[312]
    assert e['answer']['mode']==('exact' if n==1227 else 'manual')
    for name,view in m['views'].items():
        ids={l:k for k in view['points'] for l in m['labels'][k].split('=')}
        pts=m['points'];p=lambda s:pts[ids[s]][:2];u=dist(p('U'),p('W'))
        d=lambda a,b:dist(p(a),p(b))/u
        idx=int(name[-1])-1 if name[-1].isdigit() else 0
        if n in (1225,1226):
            A,C,X,Y=[vertex(i) for i in ((1,6,2,9) if n==1225 else (1,4,2,7))]
            assert near(d(A,'B')+d('B',C),d(A,C)) and near(d(X,'B')+d('B',Y),d(X,Y))
            if n==1225:
                for tri in [(A,X,'B'),(C,Y,'B')]:
                    sides=[d(a,b) for a,b in zip(tri,tri[1:]+tri[:1],strict=True)]
                    assert all(near(x,sides[0]) for x in sides)
                assert near(d(A,C),2*d('T','H'))
                assert near(angle(p('T'),p('H'),p(A)),90)
                assert any(mark['vertex']==ids['H'] for mark in view['rightAngles'])
                if e['id'].endswith('part-2') and idx==2: assert near(d(A,C),12)
            else:
                assert near(d(X,Y),2*d('T',X)) and near(d(X,'T')+d('T',Y),d(X,Y))
                for tri in [(X,A,'B'),('B',C,'T')]:
                    assert near(angle(p(tri[0]),p(tri[1]),p(tri[2])),36)
                    assert near(d(tri[0],tri[1]),d(tri[1],tri[2]))
                assert near(d(A,C)-d(A,X),d('T',C))
                if idx==2:assert near(d('T',C),7)
        elif n==1227:
            r=2 if idx==2 else 6
            assert near(d('A','B'),r) and near(d('T','A'),r)
            assert near(shoelace([p(k) for k in 'ABCDEF'])/u**2,3*sqrt(3)*r**2/2)
        else:
            poly=['B₁','C₃','B₂','C₄','B₃','C₁','B₄','C₂'];R=2 if idx==2 else 4
            for i,(a,b) in enumerate(zip(poly,poly[1:]+poly[:1],strict=True)):
                assert near(d(a,b),(2-sqrt(2))*R)
                assert near(angle(p(poly[i-1]),p(a),p(b)),135)
            for j in '₁₂₃₄':
                assert near(d('A'+j,'B'+j),R) and near(d('A'+j,'C'+j),R)
            assert near(shoelace([p(k) for k in poly])/u**2,4*(sqrt(2)-1)*R**2)
            if idx==2:assert view['polygons']==[[ids[k] for k in poly]]
        count+=1
assert count==49
print('REGULAR_POLYGON_DIAGONALS_OK: 49 measured source figures, 2 chord crossings, apothem and all 8 ordered octagon vertices.')

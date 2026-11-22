"""Independent metric checks of the measured diagrams for exercises 1281–1285."""
import json
from math import acos,atan2,degrees,dist,isclose
from motion_applications import OUT


def near(a,b):return isclose(a,b,abs_tol=3e-6,rel_tol=3e-6)
def vector(p,q):return [y-x for x,y in zip(p,q,strict=True)]
def dot(a,b):return a[0]*b[0]+a[1]*b[1]
def cross(a,b):return a[0]*b[1]-a[1]*b[0]
def norm(p):return dot(p,p)**.5
def line_dist(p,a,b):return abs(cross(vector(a,b),vector(a,p)))/dist(a,b)
def signed_angle(u,v):return degrees(atan2(cross(u,v),dot(u,v)))

answers=[('6','32'),('7','60'),('5','60'),('6','8'),('6','4')]
for c,n,ans in zip(json.loads(OUT.read_text())['lessons'],range(1281,1286),answers,strict=True):
    s=c['source'];assert (s['exercise'],s['chapter'],s['printedPages'],s['pdfPages'])==(str(n),'XIV',[328],[329])
    assert c['answer']['mode']=='manual' and tuple(p['input']['accepted'][0] for p in c['steps'] if 'input' in p)==ans
    m=c['visualization']['model'];assert len(m['views'])==7
    for name,v in m['views'].items():
        k=int(name[-1])-1 if name[-1].isdigit() else 0
        xyz={label:m['points'][i][:2] for i in v['points'] for label in m['labels'][i].split('=')}
        unit=dist(xyz['U'],xyz['W'])
        V=lambda a,b:vector(xyz[a],xyz[b])
        L=lambda a,b:dist(xyz[a],xyz[b])/unit
        if n in (1281,1284,1285):
            coords=[xyz[s] for s in 'KLPQ']
            sides=[dist(coords[i],coords[(i+1)%4])/unit for i in range(4)]
            assert all(near(sides[0],t) for t in sides)
            assert near(dot(V('K','L'),V('L','P')),0)
            assert all(near(x+y,2*z) for a,b in [('K','P'),('L','Q')] for x,y,z in zip(xyz[a],xyz[b],xyz['T'],strict=True))
        if n==1281:
            assert near(L('A','C'),L('B','D')) and near(dot(V('A','C'),V('B','D')),0)
            assert all(near(min(line_dist(xyz[s],coords[i],coords[(i+1)%4]) for i in range(4)),0) for s in 'ABCD')
            assert near(signed_angle(V('T','A'),V('T','B')),90)
            if k==1:assert near(L('B','D'),6)
            if k==2:assert near(L('A','C')**2,32)
        if n in (1282,1283):
            for p,q,r in ('ABM','BCN'):
                assert near(L(p,q),L(q,r)) and near(L(p,q),L(r,p))
            ang=signed_angle(V('B','A'),V('B','M'))
            assert near(abs(ang),60) and near(ang,signed_angle(V('B','N'),V('B','C')))
            assert near(L('A','N'),L('M','C')) and near(ang,signed_angle(V('A','N'),V('M','C')))
            if n==1282:
                assert near(cross(V('A','B'),V('A','C')),0) and dot(V('B','A'),V('B','C'))<0
                assert cross(V('A','C'),V('A','M'))*cross(V('A','C'),V('A','N'))>0
            else:
                assert cross(V('A','B'),V('A','M'))*cross(V('A','B'),V('A','C'))<0
                assert cross(V('B','C'),V('B','N'))*cross(V('B','C'),V('B','A'))<0
            if k==1:assert near(L('M','C'),7 if n==1282 else 5)
        if n in (1284,1285):
            lines=[[m['points'][i][:2],m['points'][j][:2]] for i,j in v['highlightSegments']]
            a,b=lines[0]
            assert near(line_dist(xyz['F'],a,b),0) and near(dot(vector(a,b),V('T','F')),0)
            assert near(sides[0],2*L('T','F'))
            if n==1285:
                assert all(near(x+y,2*z) for x,y,z in zip(xyz['B'],xyz['B′'],xyz['T'],strict=True))
                assert all(near(line_dist(xyz[p],a,b),0) for p in ['A','B′'])
                assert near(line_dist(xyz['B'],*lines[1]),0)
                if k==2:
                    assert near(L('A','B′'),0) and len(lines)==6
                    for p,q in lines[2:]:assert near(dist(p,q)/unit,4) and near(line_dist(xyz['T'],p,q)/unit,2)
print('MOTION_APPLICATIONS_OK: 35 measured views tested for true square sections, directed 60-degree images, exterior equilateral triangles, square recovery and exceptional centers.')

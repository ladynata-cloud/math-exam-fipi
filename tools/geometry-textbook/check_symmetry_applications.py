"""Verify the displayed symmetry axes, generated ornaments, and three worked problems."""
import json
from math import hypot,isclose,cos,sin,pi
from symmetry_applications import OUT


def near(a,b):
    return isclose(a,b,abs_tol=3e-6,rel_tol=3e-6)


def same(a,b):
    return all(near(u,v) for u,v in zip(a,b))


def pairkey(a,b):
    return tuple(sorted(tuple(round(v,5) for v in p) for p in (a,b)))


rows=[(127,[323,324],['7','3']),(128,[324,325],['60','4']),(129,[326,327],['10','2'])]
for c,(n,pages,values) in zip(json.loads(OUT.read_text())['lessons'],rows,strict=True):
    s=c['source'];m=c['visualization']['model']
    assert (s['point'],s['printedPages'],s['pdfPages'],s['chapter'])==(str(n),pages,[v+1 for v in pages],'XIV')
    assert c['kind']=='theory' and 'answer' not in c
    assert [step['input']['accepted'][0] for step in c['steps'] if 'input' in step]==values
    assert len(m['views'])==(8 if n<129 else 7)
    for name,v in m['views'].items():
        case=int(name[-1]) if name[-1].isdigit() else 1
        ids={label:k for k in v['points'] for label in m['labels'][k].split('=')}
        def native(key):return m['points'][key][:2]
        unit=hypot(*(a-b for a,b in zip(native(ids['W']),native(ids['U']))))
        def xy(k):return tuple(x/unit for x in native(k))
        def p(label):return xy(ids[label])
        def vec(a,b):return tuple(y-x for x,y in zip(p(a),p(b)))
        def length(a,b):return hypot(*vec(a,b))
        def dot(a,b):return sum(x*y for x,y in zip(a,b))
        def det(a,b):return a[0]*b[1]-a[1]*b[0]
        if n==127 and case<3:
            polygon='ABC' if case==1 else 'ABCD'
            assert len(v['highlightSegments'])==len(polygon)
            for a,b in v['highlightSegments']:
                x,y=xy(a);dx,dy=(u-w for u,w in zip(xy(b),xy(a)));norm=dx*dx+dy*dy
                for letter in polygon:
                    px,py=p(letter);t=((px-x)*dx+(py-y)*dy)/norm
                    reflected=(2*(x+t*dx)-px,2*(y+t*dy)-py)
                    assert any(same(reflected,p(k)) for k in polygon)
        elif n==127 and case==3:
            assert near(length('A','A′'),3) and ids['B']==ids['A′']
            assert len(v['highlightSegments'])==2
            assert all(near(xy(a)[1],xy(b)[1]) for a,b in v['highlightSegments'])
            assert near(abs(xy(v['highlightSegments'][0][0])[1]-xy(v['highlightSegments'][1][0])[1]),2)
        elif n==127:
            assert v['circles']==[dict(center=ids['T'],through=ids['A'])]
            for a,b in v['highlightSegments']:
                u=tuple(y-x for x,y in zip(p('T'),xy(a)))
                w=tuple(y-x for x,y in zip(p('T'),xy(b)))
                assert near(det(u,w),0) and dot(u,w)<0
        elif n==128:
            edges=[(xy(a),xy(b)) for a,b in v['segments'] if set((a,b))!={ids['U'],ids['W']}]
            if case==1:
                assert len(edges)==12 and near(length('A','A′'),2)
                for i,(a,b) in enumerate(edges[:-3]):
                    assert same((a[0]+2,a[1]),edges[i+3][0]) and same((b[0]+2,b[1]),edges[i+3][1])
            elif case in (2,4):
                count=6 if case==2 else 8
                assert len(edges)==3*count
                theta=2*pi/count;cx,cy=p('T')
                def turn(q):
                    x,y=q[0]-cx,q[1]-cy
                    return cx+x*cos(theta)-y*sin(theta),cy+x*sin(theta)+y*cos(theta)
                assert {pairkey(a,b) for a,b in edges}=={pairkey(turn(a),turn(b)) for a,b in edges}
            else:
                xx=sorted(xy1[0] for xy1,xy2 in edges if near(xy1[0],xy2[0]))
                yy=sorted(xy1[1] for xy1,xy2 in edges if near(xy1[1],xy2[1]))
                assert len(edges)==8 and len(xx)==len(yy)==4
                assert all(near(y-x,2) for x,y in zip(xx,xx[1:])) and all(near(y-x,1) for x,y in zip(yy,yy[1:]))
                assert same(p('T'),(xx[1],yy[1]))
        elif case==1:
            for names in ('ACDH','BCEF'):
                sides=[vec(names[i],names[(i+1)%4]) for i in range(4)]
                assert all(near(hypot(*v),hypot(*sides[0])) for v in sides) and near(dot(sides[0],sides[1]),0)
            u=vec('A','E');w=vec('D','B');assert same((u[1],-u[0]),w)
        elif case==2:
            assert near(length('A','M')+length('M','B'),10) and near(length('A','B′'),10)
            assert length('A','K')+length('K','B')>10 and near(length('K','B'),length('K','B′'))
        else:
            assert near(length('M','N'),2) and near(length('A','B'),8) and near(length('P','Q'),4)
            for l,r,z in [('A','C','M'),('B','C','N'),('P','R','M'),('Q','R','N')]:
                assert near(det(vec(l,r),vec(l,z)),0) and near(length(l,z)+length(z,r),length(l,r))
print('SYMMETRY_APPLICATIONS_OK: 23 measured views; axes, periodic motifs, square rotation, broken line minimisation and equal sections.')

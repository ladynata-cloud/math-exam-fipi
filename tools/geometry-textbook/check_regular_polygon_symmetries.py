"""Infer the isometry groups from distances and verify each physical axis or signed arc."""
import json
from itertools import combinations
from math import atan2,degrees,hypot,isclose
from regular_polygon_symmetries import OUT


def near(a,b):
    return isclose(a,b,rel_tol=2e-6,abs_tol=2e-6)


def dist(p,q):
    return hypot(q[0]-p[0],q[1]-p[1])


def arg(a,b):
    return degrees(atan2(a[0]*b[1]-a[1]*b[0],a[0]*b[0]+a[1]*b[1]))


rows=[('1272',None,[5,6,7],['3','7']),('1273','а',[5,5,5],['144','9']),
      ('1273','б',[6,6,6],['60','11']),('1273','в',[4,7,9],['6','17'])]
for c,(exercise,part,counts,answers) in zip(json.loads(OUT.read_text())['lessons'],rows,strict=True):
    s=c['source']
    assert (s['exercise'],s.get('subpart'),s['chapter'],s['printedPages'],s['pdfPages'])==(exercise,part,'XIV',[327],[328])
    assert c['answer']['mode']=='manual' and [r['input']['accepted'][0] for r in c['steps'] if 'input' in r]==answers
    m=c['visualization']['model'];assert len(m['views'])==7
    for name,v in m['views'].items():
        case=int(name[-1]) if name[-1].isdigit() else 1
        n=counts[case-1]
        ids={n:k for k in v['points'] for n in m['labels'][k].split('=')}
        def xy(k):return m['points'][k][:2]
        center=xy(ids['T'])
        def ray(k):return tuple(x-y for x,y in zip(xy(k),center))
        boundary=v['segments'][:n]
        assert len(boundary)==n and all(b==boundary[(i+1)%n][0] for i,(a,b) in enumerate(boundary))
        vertex=[xy(a) for a,b in boundary]
        radius=dist(vertex[0],center)
        assert all(near(dist(p,center),radius) for p in vertex)
        assert all(near(arg(ray(a),ray(b)),360/n) for a,b in boundary)
        # Adjacency forces an isometry's permutation to have one of these two cyclic orders.
        classes={}
        for slope in (1,-1):
            for offset in range(n):
                perm=tuple((offset+slope*i)%n for i in range(n))
                assert all(near(dist(vertex[i],vertex[j]),dist(vertex[perm[i]],vertex[perm[j]])) for i,j in combinations(range(n),2))
                classes[perm]=slope
        assert len(classes)==2*n
        if exercise=='1272' or case==1:
            guides=v['highlightSegments'];assert len(guides)==n
            marked=set();vertices_on_axis=[]
            for a,b in guides:
                x,y=xy(a);u,w=xy(b);dx,dy=u-x,w-y;norm=dx*dx+dy*dy
                perm=[]
                for px,py in vertex:
                    t=((px-x)*dx+(py-y)*dy)/norm
                    reflected=(2*(x+t*dx)-px,2*(y+t*dy)-py)
                    perm.append(next(i for i,p in enumerate(vertex) if near(dist(p,reflected),0)))
                perm=tuple(perm);assert classes[perm]==-1;marked.add(perm)
                vertices_on_axis.append(sum(i==j for i,j in enumerate(perm)))
            assert len(marked)==n
            if n%2:assert vertices_on_axis==[1]*n
            else:assert sorted(vertices_on_axis)==[0]*(n//2)+[2]*(n//2)
            if exercise=='1272' and case==2:assert vertices_on_axis.count(0)==int(answers[0])
            if exercise=='1272' and case==3:assert len(marked)==int(answers[1])
        else:
            assert len(v['highlightSegments'])==20
            arc=v['highlightSegments'][:18];theta=sum(arg(ray(a),ray(b)) for a,b in arc)
            measured=arg(ray(ids['A']),ray(ids['E']))
            assert near((theta-measured)%360,0) or near((theta-measured)%360,360)
            assert near(theta/(360/n),round(theta/(360/n)))
            if case==2 and part in 'аб':assert near(theta,int(answers[0]))
            if case==2 and part=='в':assert len([k for k,slope in classes.items() if slope==1])-1==int(answers[0])
            if case==3:assert len(classes)-1==int(answers[1])
print('REGULAR_POLYGON_SYMMETRIES_OK: 28 measured figures, all 2n distance-preserving vertex actions, odd/even reflection axes and rotation angles.')

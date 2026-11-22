"""Enumerate all 24 vertex correspondences in every actual displayed quadrilateral."""
import json
from itertools import combinations,permutations
from math import hypot,isclose
from quadrilateral_symmetries import OUT


def near(a,b):
    return isclose(a,b,abs_tol=2e-6,rel_tol=2e-6)


def distance(p,q):
    return hypot(q[0]-p[0],q[1]-p[1])


def determinant(a,b,c):
    return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])


for c,part,answers in zip(json.loads(OUT.read_text())['lessons'],'абвг',[['1','7'],['2','4'],['2','7'],['2','1']],strict=True):
    s=c['source']
    assert (s['exercise'],s['subpart'],s['chapter'],s['printedPages'],s['pdfPages'])==('1271',part,'XIV',[327],[328])
    assert c['answer']['mode']=='manual' and [p['input']['accepted'][0] for p in c['steps'] if 'input' in p]==answers
    m=c['visualization']['model'];assert len(m['views'])==7
    for name,v in m['views'].items():
        case=int(name[-1]) if name[-1].isdigit() else 1
        ids={m['labels'][k]:k for k in v['points']}
        def coord(k):return m['points'][k][:2]
        xy=[coord(ids[s]) for s in 'ABCD']
        unit=distance(coord(ids['U']),coord(ids['W']))
        positive=[];negative=[]
        for perm in permutations(range(4)):
            if not all(near(distance(xy[i],xy[j]),distance(xy[perm[i]],xy[perm[j]])) for i,j in combinations(range(4),2)):
                continue
            target=positive if determinant(*xy[:3])*determinant(*(xy[i] for i in perm[:3]))>0 else negative
            target.append(perm)
        expected=(7,4) if case==3 and part!='г' else {'а':(1,0),'б':(3,2),'в':(3,2),'г':(1,1)}[part]
        total=len(positive)+len(negative)-1
        assert (total,len(negative))==expected
        marked=v['highlightSegments'];axes=marked if part=='г' else marked[:-20]
        assert len(axes)==len(negative)
        images=[]
        for a,b in axes:
            x,y=coord(a);bx,by=coord(b);u,vv=bx-x,by-y;length=u*u+vv*vv
            perm=[]
            for px,py in xy:
                t=((px-x)*u+(py-y)*vv)/length
                reflection=(2*(x+t*u)-px,2*(y+t*vv)-py)
                perm.append(next(i for i,p in enumerate(xy) if near(distance(p,reflection),0)))
            images.append(tuple(perm))
        assert set(images)==set(negative)
        if part=='г' and case==2:
            overhang=(distance(xy[0],xy[1])-distance(xy[2],xy[3]))/(2*unit)
            assert near(overhang,2)
        if part=='г':assert all(any(abs(x-y)>.00001 for x,y in zip(xy[k],xy[(k+1)%4])) for k in range(4))
        if part!='г':
            t=coord(ids['T'])
            assert all(near(x+y,2*z) for x,y,z in zip(xy[0],xy[2],t))
            assert all(near(x+y,2*z) for x,y,z in zip(xy[1],xy[3],t))
print('QUADRILATERAL_SYMMETRIES_OK: all 24 vertex permutations in 28 views, every realized reflection axis and half-turn center verified.')

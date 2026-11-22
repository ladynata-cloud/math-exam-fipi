"""Check angle preservation, reciprocal and compound ratios, and the conforming line pairs."""
import json
from itertools import combinations
from math import acos,degrees,dist,isclose
from similarity_laws import OUT


def near(a,b):return isclose(a,b,abs_tol=8e-6,rel_tol=8e-6)
def vec(a,b):return [x-y for x,y in zip(a,b)]
def angle(a,o,b):
    c=sum(x*y for x,y in zip(vec(a,o),vec(b,o)))/(dist(a,o)*dist(b,o))
    return degrees(acos(max(-1,min(1,c))))
def cross(a,b):return a[0]*b[1]-a[1]*b[0]


rows=[(1315,None,['60','120']),(1316,None,['1','2']),(1317,None,['3','2']),(1318,None,['6','6']),
      (1319,None,['6','2']),(1320,'а',['10','2']),(1320,'б',['150','135'])]
for c,(n,part,ans) in zip(json.loads(OUT.read_text())['lessons'],rows,strict=True):
    s=c['source'];page=346 if n==1320 else 345
    assert (s['chapter'],s['exercise'],s.get('subpart'),s['printedPages'],s['pdfPages'])==('XV',str(n),part,[page],[page+1])
    assert [t['input']['accepted'][0] for t in c['steps'] if 'input' in t]==ans
    m=c['visualization']['model'];assert len(m['views'])==7
    for name,v in m['views'].items():
        i=int(name[-1])-1 if name[-1].isdigit() else 0
        p={n:m['points'][key][:2] for key in v['points'] for n in m['labels'][key].split('=')}
        unit=dist(p['U'],p['W']);L=lambda a,b:dist(p[a],p[b])/unit
        if n==1315:
            k=[2,-2,-.5][i];letters='VAB'
            for key in letters:
                assert all(near(b,k*a) for a,b in zip(vec(p[key],p['T']),vec(p[key+'′'],p['T'])))
            for s in ('','′'):assert near(angle(p['A'+s],p['V'+s],p['B'+s]),120 if i==2 else 60)
        elif n in (1316,1317):
            group='ABCD' if i==1 else 'ABCDE';scale=1 if n==1316 else [2,3,.5][i]
            assert all(near(L(a+'′',b+'′')/L(a,b),scale) for a,b in combinations(group,2))
            if n==1316 and i==2:assert near(L('A′','B′'),2)
        elif n==1318:
            k,z=[(1.5,1.4),(2,3),(.5,4)][i]
            for a,b in combinations('ABCD',2):
                x,y,w=[L(a+suffix,b+suffix) for suffix in ('','′','″')]
                assert near(y/x,k) and near(w/y,z) and near(w/x,k*z)
            if i==2:assert near(L('A″','B″'),6)
        elif n==1319:
            k=-2 if i==2 else -3
            for key in ('MNPQ' if i==1 else 'ABC'):
                assert all(near(y,k*x) for x,y in zip(vec(p[key],p['T']),vec(p[key+'′'],p['T'])))
            if i==1:assert near(L('M′','N′'),6)
        elif part=='а':
            for suffix in ('','′'):
                a,b,c,d=[p[z+suffix] for z in 'ABCD']
                assert near(cross(vec(a,d),vec(b,c)),0) and not near(cross(vec(a,b),vec(c,d)),0)
            if i==1:assert near(L('A′','D′'),10)
        else:
            assert len(v['highlightSegments'])==4
            for suffix in ('','′'):assert near(angle(p['P'+suffix],p['V'+suffix],p['Q'+suffix]),45 if i==2 else 30)
            for j,edge in enumerate(v['highlightSegments']):
                key='V′' if j%2 else 'V';a,b=[m['points'][z][:2] for z in edge]
                assert near(cross(vec(a,p[key]),vec(b,p[key])),0)
print('SIMILARITY_LAWS_OK: 49 views, preserved angles, reciprocal and product scales and two intersecting line pairs.')

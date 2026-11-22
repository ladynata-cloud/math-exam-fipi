"""Measure figures 387–389; keep incompatible pentagon length and angle data separate."""
import json
from itertools import combinations
from math import acos,cos,degrees,dist,isclose,radians,sin
from similarity_figure_reading import OUT


def near(a,b):return isclose(a,b,abs_tol=5e-6,rel_tol=5e-6)
def angle(a,b,c):
    d=(sum((x-y)*(z-y) for x,y,z in zip(a,b,c,strict=True)))/(dist(a,b)*dist(b,c))
    return degrees(acos(max(-1,min(1,d))))


rows=[(1299,'а',['2','3']),(1299,'б',['100','105']),(1299,'в',['5','12']),(1300,None,['25','70']),
      (1301,'а',['2','2']),(1301,'б',['60','3']),(1301,'в',['5','1'])]
for c,(n,part,ans) in zip(json.loads(OUT.read_text())['lessons'],rows,strict=True):
    s=c['source'];assert (s['exercise'],s.get('subpart'),s['printedPages'],s['pdfPages'],s['chapter'])==(str(n),part,[338],[339],'XV')
    assert c['answer']['mode']=='manual' and [t['input']['accepted'][0] for t in c['steps'] if 'input' in t]==ans
    m=c['visualization']['model'];assert len(m['views'])==7
    for name,v in m['views'].items():
        k=int(name[-1])-1 if name[-1].isdigit() else 0
        p={lab:m['points'][key][:2] for key in v['points'] for lab in m['labels'][key].split('=')}
        unit=dist(p['U'],p['W']);L=lambda a,b:dist(p[a],p[b])/unit
        names='ABCDE' if n==1300 else 'ABC' if n==1301 and part=='б' else 'ABCD'
        if n==1301 and part=='в':
            for g in ('ABCD','EFGHK'):
                orientation=[]
                for i,key in enumerate(g):
                    a,b,c=p[g[i-1]],p[key],p[g[(i+1)%len(g)]]
                    orientation.append((b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]))
                assert min(orientation)>0 or max(orientation)<0
            assert len(v['segments'])==4+5+1
            continue
        ratios=[L(a+'′',b+'′')/L(a,b) for a,b in combinations(names,2)]
        if n==1301 and part=='а' and k<2:
            assert not all(near(ratios[0],v) for v in ratios)
        else:assert all(near(ratios[0],z) for z in ratios)
        if n==1299:
            assert near(L('A','D'),6) and near(L('A','B'),4) and near(L('C','D'),5)
            assert near(angle(p['D'],p['A'],p['B']),90)
            assert near(angle(p['B'],p['C'],p['D']),105 if k==2 else 100)
            assert near(ratios[0],3 if k==2 else 2)
        if n==1300:
            assert near(angle(p['A'],p['E'],p['D']),145) and near(angle(p['C'],p['D'],p['E']),90)
            if k<2:
                assert near(ratios[0],5/3)
                for a,b,small,large in [('A','B',5.4,9),('B','C',4,20/3),('C','D',5,25/3),('D','E',3,5),('E','A',4.2,7)]:
                    assert near(L(a,b),small) and near(L(a+'′',b+'′'),large)
            else:
                assert near(angle(p['E'],p['A'],p['B']),70)
                # Keeping the other four sides, right angle, 70° and 145° would force BC to this length.
                A=(4.2*cos(radians(145)),4.2*sin(radians(145)))
                B=(A[0]+5.4*cos(radians(35)),A[1]+5.4*sin(radians(35)))
                assert near(L('B','C'),dist(B,(3,5))) and near(L('B','C'),2.0795994062)
        if n==1301 and part=='а':
            if k in (0,1):assert near(L('A','B'),5) and near(L('A′','B′'),5) and near(L('B','C'),2) and near(L('B′','C′'),1)
            else:assert near(ratios[0],2)
        if n==1301 and part=='б':
            assert near(angle(p['B'],p['A'],p['C']),90) and near(angle(p['A'],p['B'],p['C']),30)
            if k==2:assert near(L('A′','C′'),3)
print('SIMILARITY_FIGURE_READING_OK: 49 views, exact 387 inputs, measured 388 side/angle models, all three comparisons from 389.')

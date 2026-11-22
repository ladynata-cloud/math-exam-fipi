"""Independently verify all signed vector constructions and the circle/line models."""
import json
from itertools import combinations
from math import dist,isclose
from homothety_centers import OUT


def near(a,b):return isclose(a,b,abs_tol=7e-6,rel_tol=7e-6)


records=[(133,None,[340,341],['3','8']),(134,None,[341,342],['6','4']),(135,None,[342,343,344],['2','6']),
         (1309,'а',[344],['4','6']),(1309,'б',[344],['6','9']),(1310,'а',[344],['2','3']),(1310,'б',[344],['3','9'])]
for c,(n,part,pp,expected) in zip(json.loads(OUT.read_text())['lessons'],records,strict=True):
    s=c['source'];assert s['chapter']=='XV' and s['printedPages']==pp and s['pdfPages']==[z+1 for z in pp]
    assert str(s.get('point',s.get('exercise')))==str(n) and s.get('subpart')==part
    assert [v['input']['accepted'][0] for v in c['steps'] if 'input'in v]==expected
    m=c['visualization']['model'];assert len(m['views'])==7
    for name,v in m['views'].items():
        i=int(name[-1])-1 if name[-1].isdigit() else 0
        p={n:m['points'][key][:2] for key in v['points'] for n in m['labels'][key].split('=')};unit=dist(p['U'],p['W'])
        L=lambda a,b:dist(p[a],p[b])/unit
        if n==135:
            names='ABCD' if i==1 else 'ABCDE'
            scale=[1.5,2,6][i];assert all(near(L(a+'′',b+'′')/L(a,b),scale) for a,b in combinations(names,2))
            continue
        if n==133:k=[2,-.5,-1][i];names='M'
        elif n==134:k=[2,-2,-2][i];names='CR' if i==2 else 'AB'
        elif n==1309:k=2 if part=='а' else -3;names='ABCD'
        else:k=3 if part=='а' else [-2,1,1/3][i];names='ABC'
        for letter in names:
            for axis in (0,1):
                assert near(p[letter+'′'][axis]-p['T'][axis],k*(p[letter][axis]-p['T'][axis]))
        if n==133 and i==1:assert near(L('T','M′'),3)
        if n==133 and i==2:assert near(L('M','M′'),8)
        if n==134:
            if i==0:
                assert len(v['highlightSegments'])==2
                assert near(p['A'][1],p['B'][1]) and near(p['A′'][1],p['B′'][1]) and not near(p['A'][1],p['A′'][1])
            elif i==1:assert near(L('A′','B′'),6)
            else:
                assert len(v['highlightSegments'])==80 and near(L('C','R'),1) and near(L('C′','R′'),2)
                for j,edge in enumerate(v['highlightSegments']):
                    for key in edge:assert near(dist(m['points'][key][:2],p['C' if j<40 else 'C′'])/unit,1 if j<40 else 2)
        if n==1309 and i==1:assert near(L('T','B′'),2*abs(k))
        if n==1309 and i==2:assert near(L('T','A′'),3*abs(k))
        if n==1310 and part=='а' and i==1:assert near(L('T','A'),2)
        if n==1310 and part=='а' and i==2:assert near(L('T','C'),3)
        if n==1310 and part=='б' and i==1:assert p['A']==p['A′'] and p['B']==p['B′'] and p['C']==p['C′']
        if n==1310 and part=='б' and i==2:assert near(L('T','A'),9)
print('HOMOTHETY_CENTERS_OK: 49 calibrated views, each signed map and inverse, fixed points, line, segment and circle.')

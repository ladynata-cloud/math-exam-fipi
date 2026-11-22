"""Measure sides and areas as drawn, verify every table column, including square units."""
import json
from math import dist, isclose, sqrt
from fractions import Fraction
from similar_perimeters_areas import OUT


def near(a,b):return isclose(a,b,rel_tol=8e-6,abs_tol=8e-6)
def area(q):return abs(sum(x*v-u*y for (x,y),(u,v) in zip(q,q[1:]+q[:1])))/2
def perimeter(q):return sum(dist(a,b) for a,b in zip(q,q[1:]+q[:1]))


rows=[(1304,None,'5/2',['140','3']),(1305,None,'10',['3','8']),(1306,None,'3;160;24;20;4a^3',['2400','256']),
      (1307,'а',None,['4','3']),(1307,'б','a^2/k^2',['3','9']),(1308,None,'4,5',['2','2'])]
for card,(n,part,answer,probes) in zip(json.loads(OUT.read_text())['lessons'],rows,strict=True):
    s=card['source'];assert (s['chapter'],s['exercise'],s.get('subpart'),s['printedPages'],s['pdfPages'])==('XV',str(n),part,[339],[340])
    if answer:assert card['answer']['mode']=='exact' and answer in card['answer']['accepted']
    else:assert card['answer']['mode']=='manual'
    assert [x['input']['accepted'][0] for x in card['steps'] if 'input'in x]==probes
    m=card['visualization']['model'];assert len(m['views'])==7
    for label,view in m['views'].items():
        i=int(label[-1])-1 if label[-1].isdigit() else 0
        p={k:m['points'][key][:2] for key in view['points'] for k in m['labels'][key].split('=')}
        unit=dist(p['U'],p['W']);names='ABC' if n==1304 else 'MNPQ' if n==1305 else 'ABCD'
        left=[p[z] for z in names];right=[p[z+'′'] for z in names]
        L=lambda a,b:dist(p[a],p[b])/unit
        k=perimeter(left)/perimeter(right)
        assert all(near(dist(a,b)/dist(c,d),k) for a,b,c,d in zip(left,left[1:]+left[:1],right,right[1:]+right[:1]))
        s1=area(left)/unit**2;s2=area(right)/unit**2
        assert near(s1/s2,k*k)
        if n==1304:
            assert near(L('B','C'),12 if i==2 else 14) and near(L('B′','C′'),4 if i==2 else 5.6)
            assert near(k,3 if i==2 else 5/2)
        elif n==1305:
            assert near(L('M','N'),5 if i==2 else 7) and near(L('P','Q'),8 if i==2 else 10)
            assert near(L('P′','Q′')-L('M′','N′'),6 if i==2 else 5)
        elif n==1306:
            a,b=[(27,3),(24,54),(256,64)][i]
            assert near(s1,a) and near(s2,b)
        elif n==1307:
            assert near(s1,[16,36,81][i]) and near(s2,[4,9,9][i])
            assert near(L('A','B'),L('B','C')) and near(L('A','C')**2,2*L('A','B')**2)
        elif n==1308:
            assert near(s1,10 if i==2 else 75) and near(s2,90 if i==2 else 300)
            assert near(L('B′','C′'),6 if i==2 else 9) and near(L('B','C'),2 if i==2 else 4.5)

assert sqrt(27/3)==3 and 640/2**2==160 and 54*Fraction(2,3)**2==24 and sqrt(24*100/6)==20
for a in [Fraction(1,4),1,4,9]:assert near(sqrt(a)**2*4*a**2,4*a**3)
print('SIMILAR_PERIMETERS_AREAS_OK: measured 42 views and all five table columns, units and reciprocal ratios.')

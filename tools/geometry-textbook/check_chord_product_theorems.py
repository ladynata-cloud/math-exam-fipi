"""Measure every chord, tangent, supporting circle, midpoint and pair of angle solutions."""
import json
from math import dist,isclose,sqrt
from chord_product_theorems import OUT


def near(a,b):return isclose(a,b,abs_tol=1e-5,rel_tol=1e-5)
def diff(a,b):return [x-y for x,y in zip(a,b)]
def dot(a,b):return sum(x*y for x,y in zip(a,b))


rows=[(136,None,[347,348,349],['12','9']),(137,None,[349,350,351],['2','5']),(1325,'а',[351],['10','9']),
      (1325,'б',[351],['144','10']),(1325,'в',[351],['1','6']),(1326,None,[351],['32','12'])]
for card,(n,part,pp,answers) in zip(json.loads(OUT.read_text())['lessons'],rows,strict=True):
    s=card['source'];assert s['chapter']=='XV' and s['printedPages']==pp and s['pdfPages']==[a+1 for a in pp]
    assert str(s.get('point',s.get('exercise')))==str(n) and s.get('subpart')==part
    assert [t['input']['accepted'][0] for t in card['steps'] if 'input'in t]==answers
    m=card['visualization']['model'];assert len(m['views'])==7
    for name,v in m['views'].items():
        i=int(name[-1])-1 if name[-1].isdigit() else 0
        p={n:m['points'][key][:2] for key in v['points'] for n in m['labels'][key].split('=')}
        u=dist(p['U'],p['W']);factor=.1 if (n,part)==(1325,'в') else 1
        L=lambda a,b:dist(p[a],p[b])/u*factor
        assert len(v['circles'])==(2 if n==137 else 1)
        if n==137:
            if i==0:
                assert all(near(L('C',z),4) for z in 'AP') and all(near(L('H',z),2) for z in 'AN')
                assert all(near(z,(y+x)/2) for z,y,x in zip(p['N'],p['A'],p['P']))
            else:
                for center,label1,label2 in [('C','K','L'),('D','H','J')]:
                    r=([1,5] if i==1 else [5,13])['CD'.index(center)]
                    assert all(near(L(center,z),r) for z in ('A',label1,label2))
                    assert near(dot(diff(p[center],p[label1]),diff(p['T'],p[label1])),0)
                    assert near(dot(diff(p[center],p[label2]),diff(p['T'],p[label2])),0)
            continue
        if n==136 and i==1:
            assert all(near(L('S',z),5) for z in 'ABK')
            assert near(dot(diff(p['S'],p['K']),diff(p['M'],p['K'])),0)
            assert near(L('M','K'),12) and near(L('M','K')**2,L('M','A')*L('M','B'))
        elif n==1326:
            assert near(L('S','A'),L('S','B')) and near(L('S','A'),L('S','B′')) and near(L('S','A'),L('S','A′'))
            assert near(dot(diff(p['B'],p['B′']),diff(p['A'],p['A′'])),0)
            assert near(L('C','B'),L('C','B′')) and near(L('C','A')*L('C','A′'),L('C','B')**2)
            assert near(L('B','B′'),12 if i==2 else 8*sqrt(2))
        else:
            o='M' if n==136 else 'E'
            assert all(near(L('S','A'),L('S',z)) for z in 'BCD')
            assert near(L(o,'A')*L(o,'B'),L(o,'C')*L(o,'D'))
            if n==136 and i==2:assert near(L('M','B'),12) and near(L('M','A'),3) and near(L('M','C'),4) and near(L('M','D'),9)
            if n==1325:
                expected={'а':[(5,2,2.5,4),(6,3,2,9)],'б':[(16,9,12,12),(25,4,10,10)],'в':[(.2,.5,.4,.25),(.3,.6,.3,.6)]}
                assert all(near(L(o,z),v) for z,v in zip('ABCD',expected[part][i==2]))
                if part=='в':assert '0,1 исходной единицы' in card['visualization']['caption']
    if n==1325:assert {'а':'4','б':'12','в':'1/4'}[part] in card['answer']['accepted']
    if n==1326:assert '8sqrt(2)' in card['answer']['accepted']
print('CHORD_PRODUCT_THEOREMS_OK: 42 views, three power identities, two angle solutions, all chords, exact circle radii and both diameter halves.')

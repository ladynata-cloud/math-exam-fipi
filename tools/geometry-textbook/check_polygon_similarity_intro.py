"""Verify every drawn length, angle, area and correspondence in the XV opening."""
import json
from itertools import combinations
from math import acos,degrees,dist,isclose
from polygon_similarity_intro import OUT


def near(a,b):return isclose(a,b,abs_tol=4e-6,rel_tol=4e-6)
def area(p):return abs(sum(x*v-u*y for (x,y),(u,v) in zip(p,p[1:]+p[:1])))/2
def length(p):return sum(dist(x,y) for x,y in zip(p,p[1:]+p[:1]))
def angle(a,b,c):
    u=[x-y for x,y in zip(a,b)];v=[x-y for x,y in zip(c,b)]
    return degrees(acos(max(-1,min(1,sum(x*y for x,y in zip(u,v))/(dist(a,b)*dist(c,b))))))


entries=[(130,None,[332,333],['4','6']),(131,None,[333,334,335],['2','1']),(132,None,[336,337],['20','54']),
         (1296,None,[337],['135','3']),(1297,None,[338],['5','14']),(1298,'а',[338],['5','13']),(1298,'б',[338],['120','20'])]
for c,(n,part,pages,answers) in zip(json.loads(OUT.read_text())['lessons'],entries,strict=True):
    s=c['source'];theory=n<1000
    assert (s['chapter'],s['printedPages'],s['pdfPages'])==('XV',pages,[x+1 for x in pages])
    assert c['kind']==('theory' if theory else 'exercise')
    assert s.get('subpart')==part and str(s.get('point') if theory else s['exercise'])==str(n)
    assert [t['input']['accepted'][0] for t in c['steps'] if 'input' in t]==answers
    m=c['visualization']['model'];assert len(m['views'])==7
    for name,v in m['views'].items():
        i=int(name[-1])-1 if name[-1].isdigit() else 0
        q={key:m['points'][t][:2] for t in v['points'] for key in m['labels'][t].split('=')}
        unit=dist(q['U'],q['W']);L=lambda a,b:dist(q[a],q[b])/unit
        names='ABCDEF' if n==1296 else 'ABCDE' if n==130 or (n==132 and i==0) else 'ABC' if n==1298 and part=='а' else 'ABCD'
        images=list('GHKLMN') if n==1296 else [z+'′' for z in names]
        a=[q[z] for z in names];b=[q[z] for z in images]
        ratios=[dist(b[j],b[k])/dist(a[j],a[k]) for j,k in combinations(range(len(a)),2)]
        common=all(near(ratios[0],z) for z in ratios)
        if (n,i)==(130,1) or (n,i)==(131,2) or (n,part)==(1298,'б'):
            assert not common
        else:
            assert common and near(area(b)/area(a),ratios[0]**2) and near(length(b)/length(a),ratios[0])
        if n==130 and i==1:assert near(L('A′','B′'),4) and near(max(y for x,y in a)-min(y for x,y in a),max(y for x,y in b)-min(y for x,y in b))
        if n==130 and i==2:assert near(L('A′','B′'),6)
        if n==131 and i==1:assert near(ratios[0],2)
        if n==131 and i==2:assert near(L('B','C'),L('B′','C′'))
        if n==132:
            assert len(v['highlightSegments'])==2*(len(a)-3)
            if i==1:assert near(length(b)/unit,20)
            if i==2:assert near(area(b)/unit**2,54)
        if n==1296:
            assert near(angle(q['B'],q['C'],q['D']),135) and near(angle(q['H'],q['K'],q['L']),135)
            assert len(v['highlightSegments'])==2*6*9
            for j,k in enumerate(names):assert near(angle(a[j-1],a[j],a[(j+1)%6]),angle(b[j-1],b[j],b[(j+1)%6]))
            if i==2:assert near(L('G','H'),3)
        if n==1297:
            assert all(near(angle(a[j-1],a[j],a[(j+1)%4]),90) for j in range(4))
            if i==1:assert near(L('A','C'),5)
            if i==2:assert near(length(b)/unit,14)
        if n==1298:
            if part=='а' and i:assert near(L('B′','C′'),[5,13][i-1])
            if part=='б':
                assert all(near(dist(b[j],b[(j+1)%4]),dist(a[0],a[1])) for j in range(4))
                if i==1:assert near(angle(*b[:3]),120)
                if i==2:assert near(length(b)/unit,20)
print('POLYGON_SIMILARITY_INTRO_OK: 49 models, all pairwise distances, matching angles and scale-squared areas, figure 386 and equality counterexamples.')

"""Measure all five constructions after school-model fitting and label conversion."""
import json
from itertools import combinations,permutations
from math import dist,isclose
from bounded_symmetries import OUT


def close(a,b):
    return isclose(a,b,abs_tol=2e-6,rel_tol=2e-6)


def same(a,b):
    return all(close(k,l) for k,l in zip(a,b,strict=True))


def mid(a,b):
    return [(x+y)/2 for x,y in zip(a,b,strict=True)]


for c,n,ans in zip(json.loads(OUT.read_text())['lessons'],range(1274,1279),
                   [('13','0'),('8','6'),('2','3'),('6','8'),('6','8')],strict=True):
    s=c['source'];assert (s['exercise'],s['printedPages'],s['pdfPages'],s['chapter'])==(str(n),[328],[329],'XIV')
    assert c['answer']['mode']=='manual' and tuple(p['input']['accepted'][0] for p in c['steps'] if 'input' in p)==ans
    m=c['visualization']['model'];assert len(m['views'])==7
    for name,v in m['views'].items():
        case=int(name[-1]) if name[-1].isdigit() else 1
        q={m['labels'][key]:m['points'][key][:2] for key in v['points']}
        unit=dist(q['U'],q['W'])
        L=lambda a,b:dist(q[a],q[b])/unit
        if n==1274:
            sides=[L('A','B'),L('A','C'),L('B','C')]
            assert same(sides,[(4,3,5),(12,5,13),(8,6,10)][case-1])
            sym=[p for p in permutations('ABC') if all(close(L(i,j),L(p['ABC'.index(i)],p['ABC'.index(j)])) for i,j in combinations('ABC',2))]
            assert sym==[('A','B','C')]
        if n==1275:
            assert same(mid(q['A'],q['C']),q['T']) and same(mid(q['B'],q['D']),q['T'])
            assert len(v['highlightSegments'])==2
            if case==2:assert close(L('A','C'),8)
            if case==3:assert close(L('B','D'),6)
        if n==1276:
            assert same(q['T'],mid(q['A'],q['A′']))
            lines=[[m['points'][i][:2],m['points'][j][:2]] for i,j in v['highlightSegments']]
            assert len(lines)==(1 if case==1 else 3)
            assert all(close(a[1],b[1]) for a,b in lines)
            ys=sorted(set(round(a[1]/unit,6) for a,b in lines))
            assert close(ys[-1]-ys[0],[0,4,6][case-1])
            assert close(q['T'][1]/unit,(ys[-1]+ys[0])/2)
        if n>=1277:
            assert close(L('T','S'),[2,3,4][case-1]) and close(L('A','C'),2*L('T','S'))
            if n==1277:
                assert same(q['T'],mid(q['A'],q['B'])) and same(q['S'],mid(q['B'],q['C']))
            else:
                lines=[[m['points'][i][:2],m['points'][j][:2]] for i,j in v['highlightSegments']]
                for (p,r),a,b,t in zip(lines,'AB','BC','TS',strict=True):
                    assert close(p[0],r[0]) and close(p[0],q[t][0]) and close(mid(q[a],q[b])[0],q[t][0]) and close(q[a][1],q[b][1])
print('BOUNDED_SYMMETRIES_OK: 35 measured models, scalene permutations, common midpoints, infinite strip and both double-motion translations.')

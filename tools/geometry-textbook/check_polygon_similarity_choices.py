"""Independently measure all angles of figure 390 and test the six logical cases."""
import json
from itertools import combinations
from math import acos, degrees, dist, isclose
from polygon_similarity_choices import OUT


def near(a,b):
    return isclose(a,b,abs_tol=6e-6,rel_tol=6e-6)


def angles(points):
    angles=[]
    for i,b in enumerate(points):
        a,c=points[i-1],points[(i+1)%len(points)]
        cosine=sum((x-y)*(z-y) for x,y,z in zip(a,b,c))/(dist(a,b)*dist(c,b))
        angles.append(degrees(acos(max(-1,min(1,cosine)))))
    return angles


expected=[(1302,None,['105','8']),(1303,'а',['0','60']),(1303,'б',['60','6']),(1303,'в',['2','6']),
          (1303,'г',['1','3']),(1303,'д',['1','5']),(1303,'е',['1','6'])]
for c,(n,part,answers) in zip(json.loads(OUT.read_text())['lessons'],expected,strict=True):
    s=c['source']
    assert (s['chapter'],s['exercise'],s.get('subpart'),s['printedPages'],s['pdfPages'])==('XV',str(n),part,[339],[340])
    assert c['answer']['mode']=='manual' and [t['input']['accepted'][0] for t in c['steps'] if 'input'in t]==answers
    m=c['visualization']['model']
    assert len(m['views'])==7
    for name,v in m['views'].items():
        i=int(name[-1])-1 if name[-1].isdigit() else 0
        p={k:m['points'][key][:2] for key in v['points'] for k in m['labels'][key].split('=')}
        unit=dist(p['U'],p['W']);L=lambda a,b:dist(p[a],p[b])/unit
        a=[p[k] for k in sorted(p) if len(k)==1 and k not in 'UW']
        b=[p[k] for k in sorted(p) if k.endswith('′')]
        assert len(v['segments'])==len(a)+len(b)+1
        if len(a)!=len(b):
            assert part=='е' and i<2 and (len(a),len(b))==(6,5)
            continue
        ratios=[dist(b[j],b[k])/dist(a[j],a[k]) for j,k in combinations(range(len(a)),2)]
        similar=all(near(ratios[0],r) for r in ratios)
        aa,ab=angles(a),angles(b)
        assert similar==(part is None or part=='е' or i==2 or (part in ('в','г','д') and i==0)),(n,part,name)
        if n==1302:
            assert all(near(u,v) for u,v in zip(aa,[80,85,90,105])) and all(near(u,v) for u,v in zip(aa,ab))
            assert near(ratios[0],2 if i==2 else 1.5) and near(L('A','B'),4)
        elif part=='а':
            assert all(near(a,60) for a in aa) and (near(ab[2],60) if i==2 else ab[2]>90)
        elif part=='б':
            assert all(near(a,60) for a in aa)
            assert near(L('A′','B′'),6) if i==2 else near(ab[2],90) and near(L('A′','C′'),L('B′','C′'))
        elif part in ('в','г'):
            assert all(near(x,90) for x in aa+ab)
            if part=='в' and i==1:assert near(L('A','B')/L('B','C'),2)
            if part=='в' and i==2:assert near(L('A′','B′'),6)
            if part=='г' and i==1:assert near(L('B′','C′')/L('B','C'),1)
            if part=='г' and i==2:assert near(ratios[0],3)
        elif part=='д':
            assert len(a)==5
            if i==1:assert near(L('B′','C′')/L('B','C'),1)
            if i==2:assert all(near(a,108) for a in aa+ab)
        else:
            assert i==2 and len(a)==6 and all(near(x,120) for x in aa+ab)
print('POLYGON_SIMILARITY_CHOICES_OK: figure 390 angles, all six existence problems, 49 measurable views.')

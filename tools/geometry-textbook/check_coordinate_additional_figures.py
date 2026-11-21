"""Verify every drawn length, source subpart, shape classification and all fourth vertices."""
from itertools import permutations,product
import json
from math import isclose
from coordinate_additional_figures import OUT

cs=json.loads(OUT.read_bytes())['lessons'];d=lambda p,q:sum((a-b)**2 for a,b in zip(p,q,strict=True))
eq=lambda a,b:isclose(a,b,abs_tol=.0005)
table=[(1079,None,73,13),(1080,None,289,13),(1081,'а',25,3),(1081,'б',100,5),(1082,None,65,2),(1083,'а',6,1),(1083,'б',50,32),(1083,'в',4,3),(1084,None,36,25),(1085,None,58,24),(1086,None,3,6)]
seen=0;D=set();freshD=set()
for c,(n,part,first,last) in zip(cs,table,strict=True):
    s=c['source'];assert (s['collection'],s['chapter'],s['exercise'],s.get('subpart'),s['printedPages'],s['pdfPages'])==('main','XI',str(n),part,[269],[270])
    assert [k['input']['accepted'][0] for k in c['steps'] if 'input' in k]==[str(first),str(last)]
    if n in (1079,1080,1081,1084,1085):assert c['answer']['mode']=='manual'
    if n==1086:
        assert all(';'.join('('+s+')' for s in perm) in c['answer']['accepted'] for perm in permutations(('-2;2','0;8','-8;0')))
        assert '3' not in c['answer']['accepted'] and '(-2;2);(0;8)' not in c['answer']['accepted']
    m=c['visualization']['model'];raw=m['points']
    for key,v in m['views'].items():
        seen+=1;suf='__v'+v['points'][0].split('__v')[-1];origin=raw['O'+suf];unit=raw['_unitX'+suf][0]-origin[0]
        assert eq(raw['_unitY'+suf][1]-origin[1],unit)
        pts={m['labels'][nm]:tuple(round((raw[nm][j]-origin[j])*2/unit,4) for j in range(2)) for nm in v['points']}
        dist=lambda a,b:d(pts[a],pts[b])
        different=key in ('case-3','step-3');a,b,p=(pts.get(k) for k in 'ABC')
        if n==1079:
            assert eq(dist('A','B'),dist('A','C')) and eq(dist('B','C'),2*dist('A','B'))
        if n==1080:
            assert eq(dist('A','B'),dist('B','C')) and not eq(dist('A','B'),dist('A','C'))
        if n==1081:
            for name in 'ABC':assert eq(dist('D',name),last*last if different else first)
        if n==1082 and 'P' in pts:
            assert eq(pts['P'][1],0) and eq(dist('P','A'),dist('P','B')) and eq(pts['P'][0],2 if different else 5)
        if n==1083:
            for k,a,b in ('KAB','LBC','MCA'):assert all(eq(2*pts[k][j],pts[a][j]+pts[b][j]) for j in range(2))
            if part=='б':assert eq(dist('B','M'),32 if different else 50)
            if part=='в':
                for a,b,x,y in ('LMAB','MKBC','KLCA'):assert eq(4*dist(a,b),dist(x,y))
        if n in (1084,1085):
            assert all(eq(dist(x,y),dist('A','B')) for x,y in ('BC','CD','DA'))
            if n==1084:assert eq(dist('A','C'),dist('A','B')+dist('B','C'))
            else:assert eq(dist('A','C')*dist('B','D'),4*(24 if different else 40)**2)
        if n==1086:
            A,B,C,Z=(pts[k] for k in 'ABCD')
            candidates={tuple(x+y-z for x,y,z in zip(a,b,c,strict=True)) for a,b,c in permutations((A,B,C))}
            assert Z in candidates and len(candidates)==3
            (D if A==(-4,4) else freshD).add(Z)
assert D=={(-2,2),(-8,0),(0,8)} and freshD=={(6,4),(4,-2),(-2,4)}
checks=0
for a,b,c,e in product(range(-4,5),repeat=4):
    if a*e==b*c:continue
    P=(0,0);Q=(a,b);R=(c,e);S=(a+c,b+e)
    assert d(P,Q)==d(R,S) and d(P,R)==d(Q,S)
    assert tuple((q+r)/2 for q,r in zip(Q,R))==tuple((p+s)/2 for p,s in zip(P,S));checks+=1
print(f'COORDINATE_ADDITIONAL_FIGURES_OK {len(cs)} individual source cards, {seen} measured scenes, {checks} nondegenerate parallelograms.')

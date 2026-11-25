"""Source ranges, every model, degenerate locations of M, and independent coordinate identities."""
import json
from itertools import product
from math import dist,isclose
from coordinate_proof_method import ROOT

cards=json.loads((ROOT/'geometry-course/textbook/data/coordinate-proof-method.json').read_bytes())['lessons']
probes=[['3','5'],['20','56'],['60','90'],['12','3'],['8','0'],['32','0'],['25','45']]
def eq(x,y):return isclose(x,y,abs_tol=1e-6)
def same(a,b):return all(eq(x,y) for x,y in zip(a,b,strict=True))
def ds(a,b):return sum((x-y)**2 for x,y in zip(a,b,strict=True))
def mid(a,b):return tuple((x+y)/2 for x,y in zip(a,b,strict=True))
views=marks=0;special=set()
for n,(c,inputs) in enumerate(zip(cards,probes,strict=True),1038):
    s=c['source'];p=[259] if n==1038 else [259,260] if n==1039 else [260]
    assert s['bookId']=='atanasyan-2023-7-9' and s['chapter']=='XI' and s['collection']=='main' and s['exercise']==str(n) and not s.get('subpart') and s['printedPages']==p and s['pdfPages']==[x+1 for x in p]
    assert [step['input']['accepted'][0] for step in c['steps'] if 'input' in step]==inputs
    if n in (1040,1041):assert c['answer']['accepted'][0]==('100' if n==1040 else '13')
    else:assert c['answer']['mode']=='manual'
    natural=20 if n==1040 else 2 if n==1041 else 1;model=c['visualization']['model']
    cases=[v['label'] for k,v in model['views'].items() if k.startswith('case-')];assert len(cases)==len(set(cases))
    for k,v in model['views'].items():
        views+=1;raw=model['points'];suffix='__v'+v['points'][0].split('__v')[-1];origin=raw['O'+suffix];unit=raw['_unitX'+suffix][0]-origin[0];assert unit>0 and eq(raw['_unitY'+suffix][1]-origin[1],unit)
        xy=lambda key:tuple((x-y)*natural/unit for x,y in zip(raw[key][:2],origin[:2],strict=True))
        pts={name:xy(key) for key in v['points'] for name in model['labels'][key].split('=')}
        for m in v['rightAngles']:
            a,b,o=[xy(m[key]) for key in ('a','b','vertex')];assert sum((x-z)*(y-z) for x,y,z in zip(a,b,o,strict=True))**2<1e-7 and ds(a,o)>1e-5 and ds(b,o)>1e-5;marks+=1
        if n==1038:
            assert same(pts['M'],mid(pts['A'],pts['B'])) and eq(dist(pts['M'],pts['A']),dist(pts['M'],pts['C']))
            if k=='case-3':assert eq(dist(pts['M'],pts['C']),5)
        if n==1039:
            a,b,c0,d=[pts[key] for key in 'ABCD'];assert same(mid(a,c0),mid(b,d));assert eq(ds(a,b)+ds(b,c0)+ds(c0,d)+ds(d,a),ds(a,c0)+ds(b,d))
        if n==1040:
            if 'K' in pts:assert same(pts['K'],mid(pts['A'],pts['C']))
            if 'L' in pts:assert same(pts['L'],mid(pts['B'],pts['C']))
            if k!='case-3':
                assert eq(dist(pts['A'],pts['B']),80) and eq(dist(pts['O'],pts['C']),160)
                if 'K'in pts:assert eq(dist(pts['B'],pts['K']),100)
            else:assert eq(abs(pts['B'][0]-pts['K'][0]),90)
        if n==1041:
            if 'M' in pts:assert same(pts['M'],mid(pts['B'],pts['C']))
            if k!='case-3':
                assert eq(dist(pts['A'],pts['O']),10) and eq(dist(pts['B'],pts['O']),4) and eq(dist(pts['C'],pts['O']),10)
                if 'M' in pts:assert eq(dist(pts['A'],pts['M']),13)
        if n in (1042,1043,1044):
            a,b,c0,d=[pts[key] for key in 'ABCD'];diag=eq(ds(a,c0),ds(b,d));legs=eq(ds(a,b),ds(d,c0))
            if n==1042:assert legs==diag and eq(a[1],d[1]) and eq(b[1],c0[1]) and not eq(a[0]-d[0],b[0]-c0[0]);special.add(('trapezoid',legs))
            if n==1043:assert same(mid(a,c0),mid(b,d)) and (eq(a[0],d[0])==diag);special.add(('parallelogram',diag))
            if n==1044:
                m=pts['M'];assert eq(ds(a,m)+ds(c0,m),ds(b,m)+ds(d,m))
                if k.startswith('case-'):special.add(('point',tuple(round(t) for t in m)))
assert {('trapezoid',True),('trapezoid',False),('parallelogram',True),('parallelogram',False),('point',(2,1)),('point',(8,-2)),('point',(4,0)),('point',(0,0))}<=special
traps=points=parallels=0
for a,b,h,t in product(range(1,6),range(1,6),range(1,5),range(-4,5)):
    if a==b:continue
    A,B,C,D=(-a,0),(t-b,h),(t+b,h),(a,0)
    assert ds(A,B)-ds(C,D)==4*t*(a-b) and ds(A,C)-ds(B,D)==4*t*(a+b)
    assert (ds(A,B)==ds(C,D))==(ds(A,C)==ds(B,D))==(t==0);traps+=1
for a,b,x,y in product(range(1,6),range(1,6),range(-4,8),range(-4,8)):
    A,B,C,D,M=(0,0),(a,0),(a,b),(0,b),(x,y);assert ds(A,M)+ds(C,M)==ds(B,M)+ds(D,M);points+=1
for a,p,q in product(range(1,7),range(-5,6),[-3,-2,-1,1,2,3]):
    A,B,C,D=(-a,0),(p,q),(a,0),(-p,-q)
    assert ds(A,B)+ds(B,C)+ds(C,D)+ds(D,A)==ds(A,C)+ds(B,D);parallels+=1
print(f'COORDINATE_PROOF_METHOD_OK {len(cards)} full lessons, {views} measured views, {marks} right-angle marks, {traps} forward/converse trapezoids, {points} interior/exterior/extreme point distances, {parallels} parallelogram proofs. XI §2 now ends at 1044.')

"""Verify both implications and boundary cases by exact substitution, then remeasure every rendered locus."""
import json
from fractions import Fraction as F
from itertools import product
from math import hypot,isclose
from coordinate_loci import ROOT

cards=json.loads((ROOT/'geometry-course/textbook/data/coordinate-loci.json').read_bytes())['lessons']
expected=[(1069,None,['4','4']),(1070,'а',['4','1']),(1070,'б',['1/3','2/3']),(1071,None,['1','2']),(1072,None,['3','0']),(1073,None,['-2','-3']),(1074,None,['32','2']),(1075,None,['-3','-2'])]
count=circles=lines=0
for c,(n,part,steps) in zip(cards,expected,strict=True):
    s=c['source'];key=(n,part) if part else n;pages=[265,266,267] if n==1069 else [267]
    assert s['bookId']=='atanasyan-2023-7-9' and s['chapter']=='XI' and s['printedPages']==pages and s['pdfPages']==[p+1 for p in pages] and int(s['exercise'])==n and s.get('subpart')==part
    assert [a['input']['accepted'][0] for a in c['steps'] if 'input' in a]==steps
    model=c['visualization']['model'];raw=model['points']
    for k,v in model['views'].items():
        count+=1;suf='__v'+v['points'][0].split('__v')[-1];o=raw['O'+suf];unit=raw['_unitX'+suf][0]-o[0];assert unit>0 and isclose(raw['_unitY'+suf][1]-o[1],unit,abs_tol=2e-5)
        factor=1/3 if key==(1070,'б') else 1;get=lambda name:tuple((raw[name][j]-o[j])/unit*factor for j in (0,1));vertices={label:get(name) for name in v['points'] for label in model['labels'][name].split('=')};near=lambda x,y:all(isclose(a,b,abs_tol=.0003) for a,b in zip(x,y,strict=True));d=lambda x,y:sum((a-b)**2 for a,b in zip(x,y,strict=True))
        for cc in v['circles']:
            center=get(cc['center']);aux=get(cc['through']);r=hypot(center[0]-aux[0],center[1]-aux[1]);circles+=1
            if n==1069:ab=vertices['B'][0];assert near(center,(4*ab/3,0)) and isclose(r,2*ab/3,abs_tol=.0003) and isclose(d(vertices['M'],vertices['A']),4*d(vertices['M'],vertices['B']),abs_tol=.0005)
            if n==1070:
                if part=='а':assert near(center,(0,0)) and isclose(r,4,abs_tol=.0003)
                else:assert near(center,(1/3,0)) and isclose(r,2/3 if k in ('case-3','step-3') else 1/3,abs_tol=.0003)
                M=vertices['M'];A,B,C=(vertices[p] for p in 'ABC');total=d(A,M)+(2 if part=='б' else 1)*d(B,M)+(3 if part=='б' else 1)*d(C,M);assert isclose(total,50 if part=='а' else 6 if k in ('step-3','case-3') else 4,abs_tol=.0005)
            if n==1071:assert near(center,(0,0)) and isclose(r,abs(vertices['B'][0]),abs_tol=.0003)
        for seg in v['highlightSegments']:
            points=[get(i) for i in seg];lines+=1;assert not near(*points)
            if n==1069:assert k=='case-4' and all(isclose(x,2,abs_tol=.0003) for x,y in points)
            if n==1072:
                target=0 if k in ('step-3','case-3') else -1 if k=='case-4' else 2 if k=='case-5' else 3
                assert all(isclose(x,target,abs_tol=.0003) for x,y in points)
            if n==1073:
                ab=vertices['B'][0];assert all(isclose(x,-ab/2,abs_tol=.0003) for x,y in points)
            if n==1074:
                ab=vertices['B'][0];assert all(isclose(x,ab,abs_tol=.0003) for x,y in points)
            if n==1075:
                a,b=vertices['C'][0],vertices['B'][1];assert all(abs(a*x+b*y)<.0005 for x,y in points)
        if n==1071 and k in ('case-3','case-4'):assert not v['circles'] and ('M' in vertices)==(k=='case-3')
    if n in (1071,1072,1073,1075):assert c['answer']['mode']!='exact'
checks=0
for a,b,i,j in product(range(1,7),range(1,6),range(-8,9),range(-7,8)):
    x,y=F(i,2),F(j,2);dist=lambda u,v:(x-u)**2+(y-v)**2
    dA=dist(0,0);dB=dist(a,0)
    assert (dA==4*dB)==((x-F(4*a,3))**2+y*y==F(4*a*a,9));assert dA-dB==2*a*x-a*a
    assert (dB-dA==2*a*a)==(x==-F(a,2));assert (dist(0,0)+dist(0,b)-dist(a,0)-dist(a,b)==2*a*a)==(x==a)
    assert (dist(-a,0)+dist(0,-b)==dist(0,b)+dist(a,0))==(a*x+b*y==0)
    assert dist(-a,0)+dist(a,0)==2*(x*x+y*y)+2*a*a
    weighted=dist(-1,0)+2*dist(0,0)+3*dist(1,0);assert (weighted==4)==((x-F(1,3))**2+y*y==F(1,9))
    assert (dist(-1,0)+dist(0,0)+dist(1,0)==50)==(x*x+y*y==16);checks+=1
print(f'COORDINATE_LOCI_OK {len(cards)} source lessons including both parts of 1070, {count} measured models, {circles} circle and {lines} line views, {checks*8} exact bidirectional and parametric substitutions.')

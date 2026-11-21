"""Independently recover all distances and line/circle equations from the native figures on p. 270."""
import json
from fractions import Fraction as F
from itertools import product
from math import hypot,isclose
from coordinate_additional_curves import ROOT

cs=[]
for file in ('coordinate-additional-curves','coordinate-additional-applications'):
    cs+=json.loads((ROOT/f'geometry-course/textbook/data/{file}.json').read_bytes())['lessons']
answers=[
 (1087,'а',25,3),(1087,'б',1,2),(1087,'в',-20,2),(1087,'г',25,1),(1087,'д',4,3),(1088,None,5,8),(1089,'а',F(5,2),5),(1089,'б',-2,4),
 (1090,'а',16,2),(1090,'б',-4,1),(1090,'в',-17,2),(1091,None,2,3),(1092,'а',2,3),(1092,'б',3,-2),(1092,'в',3,15),
 (1093,None,709,97),(1094,None,3,1),(1095,None,10,-10),(1096,None,20,97),(1097,'а',-2,6),(1097,'б',1,20)]
eq=lambda a,b:isclose(a,b,abs_tol=.001)
approx=lambda p,q:all(eq(a,b) for a,b in zip(p,q,strict=True))
dist=lambda p,q:sum((a-b)**2 for a,b in zip(p,q,strict=True))
orig={('а'):((1,-2),25),'б':((0,-7),1),'в':((-4,2),-20),'г':((1,-2),25),'д':((2,1),4)}
src_lines={'а':[(5,-3,16),(1,2,-6),(6,-1,10)],'б':[(3,5,-4),(2,-1,-7),(1,6,-23)],'в':[(3,5,-17),(2,-1,6),(1,6,-10)]}
fresh_lines={'а':[(1,0,-2),(2,-1,-3),(0,1,-1)],'б':[(0,1,0),(1,2,-4),(1,0,0)],'в':[(0,1,-1),(1,2,-2),(1,0,-2)]}
count=lines=circles=0
for c,(n,part,first,last) in zip(cs,answers,strict=True):
    src=c['source'];assert (src['bookId'],src['collection'],src['chapter'],src['exercise'],src.get('subpart'),src['printedPages'],src['pdfPages'])==('atanasyan-2023-7-9','main','XI',str(n),part,[270],[271])
    assert [s['input']['accepted'][0] for s in c['steps'] if 'input' in s]==[str(first),str(last)]
    if n==1090:assert len(c['answer']['accepted'])>1 and '1;0;0' not in c['answer']['accepted']
    if n==1097 and part=='б':assert '2/3;16/9' not in c['answer']['accepted'] and '1/2;5/4' in c['answer']['accepted']
    m=c['visualization']['model'];raw=m['points']
    for key,v in m['views'].items():
        count+=1;suf='__v'+v['points'][0].split('__v')[-1];o=raw['O'+suf];u=raw['_unitX'+suf][0]-o[0]
        scale=4 if n==1093 else 5 if n==1092 and part=='в' else 1
        xy=lambda id:tuple((raw[id][j]-o[j])*scale/u for j in range(2))
        assert u>0 and eq(u,raw['_unitY'+suf][1]-o[1])
        pts={name:xy(id) for id in v['points'] for name in m['labels'][id].split('=')}
        ls=[tuple(xy(id) for id in l) for l in v['highlightSegments']];lines+=len(ls)
        cspec=[(xy(z['center']),dist(xy(z['center']),xy(z['through']))) for z in v.get('circles',[])];circles+=len(cspec)
        changed=key in ('case-3','step-3');k=int(key.split('-')[1]) if '-' in key else 1
        if n==1087:
            if k==2 and orig[part][1]>0:center,q=cspec[0];assert approx(center,orig[part][0]) and eq(q,orig[part][1]) and eq(dist(center,pts['P']),q)
            if part=='в' and not changed:assert not cspec
            if changed:center,q=cspec[0];assert eq(dist(center,pts['U']),q) and eq(q,last**2)
        if n in (1088,1089):
            if cspec:
                center,q=cspec[0]
                for name in 'ABC':
                    if name in pts:assert eq(dist(center,pts[name]),q)
                if changed:assert eq(q,last)
            if ls:
                center=(3,5) if n==1088 else (-3.5,2.5) if part=='а' else (3,-2)
                for a,b in ls:assert eq((b[0]-a[0])*(center[1]-a[1]),(b[1]-a[1])*(center[0]-a[0]))
        if n==1090:
            expected=(fresh_lines if changed else src_lines)[part]
            assert len(ls)==(1 if k==1 else 3)
            for actual,(a,b,z) in zip(ls,expected):
                for x,y in actual:assert eq(a*x+b*y+z,0)
        if n==1091:
            slopes=[(q[1]-p[1])/(q[0]-p[0]) for p,q in ls]
            assert all(eq(x,1 if changed else 2) for x in slopes)
            if len(ls)==2:
                intercepts=[p[1]-k*p[0] for (p,q),k in zip(ls,slopes)];assert eq(abs(intercepts[1]-intercepts[0]),3 if changed else 11/3)
        if n==1092:
            a,b=ls[0];test=lambda p:(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0])
            for name in 'ABC':
                if name in pts:assert eq(test(pts[name]),0)
            if 'T' in pts:assert not eq(test(pts['T']),0)
        if n==1093:
            B=pts['B'];C=pts['C'];A=pts['A'];a=pts['K'];b=pts['L'];z=pts['M']
            for mid,point1,point2 in [(a,A,B),(b,A,C),(z,B,C)]:assert approx(mid,tuple((i+j)/2 for i,j in zip(point1,point2)))
            if eq(B[0],28):
                assert eq(dist(A,C),289) and eq(abs(C[1]),15)
                expected=(F(39,2)**2,F(2529,4),261) if C[0]>0 else (F(25,2)**2,F(4321,4),709)
                assert all(eq(x,y) for x,y in zip((dist(A,z),dist(B,b),dist(C,a)),expected))
            else:assert eq(dist(C,a),25 if C[0]>0 else 97)
        if n==1094:
            A,B,C,D,M,N=(pts[v] for v in 'ABCDMN');assert eq(M[1],N[1]) and eq(4*dist(M,N),(D[0]-A[0]-(C[0]-B[0]))**2)
        if n==1095:
            A,B,C,D,M=(pts[v] for v in 'ABCDM');total=dist(A,M)+dist(C,M)-dist(B,M)-dist(D,M)
            assert eq(total,(dist(A,C)-dist(B,D))/2) and eq(total,-10 if changed else 10)
        if n==1096:
            A,B,C=(pts[v] for v in 'ABC')
            if 'H' in pts:assert eq(4*dist(A,pts['H']),2*dist(A,B)+2*dist(A,C)-dist(B,C))
            if 'U' in pts:assert eq(dist(A,pts['U']),dist(B,pts['V'])) and eq(4*dist(A,pts['U']),97)
        if n==1097 and cspec:
            A,B=(pts[v] for v in 'AB');center,r2=cspec[0];a=B[0]-A[0]
            if 'M' in pts:
                M=pts['M'];assert eq(dist(M,center),r2)
                if part=='а':assert eq(2*dist(M,A)-dist(M,B),2*a*a) and eq(r2,4*a*a) and approx(center,(-a,0))
                else:assert eq(2*dist(M,A)+2*dist(M,B),6*a*a) and eq(r2,5*a*a/4) and approx(center,(a/2,0))
            if 'P' in pts:
                P=pts['P'];assert eq(dist(P,center),r2) and eq(dist(P,A)+2*dist(P,B),6*a*a) and not eq(2*dist(P,A)+2*dist(P,B),6*a*a)
                assert eq(r2,16*a*a/9) and approx(center,(2*a/3,0))
checks=0
for a,i,j in product(range(1,9),range(-30,31),range(-18,19)):
    x,y=F(i,3),F(j,3);da=x*x+y*y;db=(x-a)**2+y*y
    assert (2*da-db==2*a*a)==((x+a)**2+y*y==4*a*a)
    assert (2*da+2*db==6*a*a)==((x-F(a,2))**2+y*y==F(5*a*a,4))
    assert (da+2*db==6*a*a)==((x-F(2*a,3))**2+y*y==F(16*a*a,9))
    checks+=3
print(f'COORDINATE_END_XI_OK {len(cs)} source cards, {count} measured diagrams, {lines} drawn lines, {circles} circles, {checks} exact source/key substitutions.')

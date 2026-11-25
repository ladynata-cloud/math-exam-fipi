"""Independent coordinate measurements, all four collinearity equations and radical lengths."""
import json
from fractions import Fraction as F
from itertools import product
from math import hypot,isclose
from coordinate_additional_vectors import OUT

cards=json.loads(OUT.read_bytes())['lessons']
data=[(1076,'а','-1','-2/3'),(1076,'б','-1','2'),(1076,'в','1','3'),(1076,'г','2','-4'),
      (1077,'а','-1','125'),(1077,'б','4','100'),(1077,'в','5','205'),(1077,'г','-18','180'),(1078,None,'6','4')]
pts=[(-8,-1),(14,4),(-21,5),(6,-18)]
fresh=[(-2,11),(-8,6),(6,13),(-6,-12)]
roots=['√65','2√53','√466','6√10']
probes=[(2,-1,1,None),(None,-1,1,None),(1,None,1,-2),(2,1,None,1)]
solutions=[F(-1,2),None,F(-2),F(2)]
scenes=0
for i,(c,(n,part,first,last)) in enumerate(zip(cards,data,strict=True)):
    src=c['source'];assert (src['bookId'],src['collection'],src['chapter'],src['exercise'],src.get('subpart'),src['printedPages'],src['pdfPages'])==('atanasyan-2023-7-9','main','XI',str(n),part,[269],[270])
    assert [step['input']['accepted'][0] for step in c['steps'] if 'input' in step]==[first,last]
    if n==1077:
        index=i-4;x,y=pts[index];assert f'{x};{y};{roots[index]}' in c['answer']['accepted']
        assert str(x)+';'+str(y) not in c['answer']['accepted'] and roots[index] not in c['answer']['accepted']
    m=c['visualization']['model'];raw=m['points']
    for key,v in m['views'].items():
        scenes+=1;suffix='__v'+v['points'][0].split('__v')[-1];o=raw['O'+suffix];unit=raw['_unitX'+suffix][0]-o[0]
        assert unit>0 and isclose(raw['_unitY'+suffix][1]-o[1],unit,abs_tol=.0005)
        tr=[1,2,3,3][i-4] if n==1077 else 1
        pp={m['labels'][name]:tuple((raw[name][j]-o[j])*tr/unit for j in range(2)) for name in v['points']}
        xy=lambda label:tuple(round(x,4) for x in pp[label])
        if n==1076:
            p=pp['P'];q=pp.get('Q',p);det=p[0]*q[1]-p[1]*q[0]
            if key in ('case-2','step-2'):assert isclose(det,0,abs_tol=.0005)==(i!=1)
            if key in ('case-3','step-3'):assert isclose(det,0,abs_tol=.0005)
        if n==1077:
            if 'P' in pp:assert xy('P')==pts[i-4]
            if 'Q' in pp:assert xy('Q')==fresh[i-4]
        if n==1078:
            a,b=pp['A'],pp['B'];assert isclose(a[1],0,abs_tol=.0005) and isclose(b[1],0,abs_tol=.0005)
            target=4 if key in ('case-3','step-3') else 6 if key in ('case-2','step-2') else 5
            assert isclose(abs(a[0]-b[0]),target,abs_tol=.0005)
tested=0
for i,coeff in enumerate(probes):
    for numerator,denominator in product(range(-21,22),range(1,8)):
        x=F(numerator,denominator);a,b,c,d=(x if t is None else t for t in coeff)
        for u,v in [((2,1),(-1,3)),((-3,2),(1,1)),((1,0),(0,1))]:
            p=(a*u[0]+b*v[0],a*u[1]+b*v[1]);q=(c*u[0]+d*v[0],c*u[1]+d*v[1])
            assert (p[0]*q[1]==p[1]*q[0])==(x==solutions[i]);tested+=1
for u,v in product(range(-25,26),repeat=2):assert hypot(u-v,0)==abs(v-u);tested+=1
print(f'COORDINATE_ADDITIONAL_VECTORS_OK 9 source cards, {scenes} measured scenes, {tested} exact basis and distance checks.')

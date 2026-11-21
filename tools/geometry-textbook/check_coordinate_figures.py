"""Verify the data, roots, measured coordinate figures and geometric proofs, not only the final numbers."""
import json
from fractions import Fraction
from itertools import product
from math import dist,isclose
from coordinate_figures import ROOT

cards=json.loads((ROOT/'geometry-course/textbook/data/coordinate-figures.json').read_bytes())['lessons']
expected=[(1030,None,['5','10']),(1031,None,['18','41']),(1032,'а',['0','-3']),(1032,'б',['3','-3']),
          (1033,'а',['26','2,5']),(1033,'б',['13','10']),(1034,'а',['25','20']),(1034,'б',['8','20']),
          (1035,'а',['8','6']),(1035,'б',['17','6'])]
vertices=[None,None,None,None,[(0,1),(1,-4),(5,2)],[(-4,1),(-2,4),(0,1)],[(1,1),(6,1),(7,4),(2,4)],
          [(-5,1),(-4,4),(-1,5),(-2,2)],[(-3,-1),(1,-1),(1,-3),(-3,-3)],[(4,1),(3,5),(-1,4),(0,0)]]
def equal(a,b):return all(isclose(x,y,abs_tol=1e-6) for x,y in zip(a,b,strict=True))
def minus(a,b):return tuple(x-y for x,y in zip(a,b,strict=True))
def cross(a,b):return a[0]*b[1]-a[1]*b[0]
views=markers=0
for i,(card,(n,part,probes)) in enumerate(zip(cards,expected,strict=True)):
    s=card['source'];assert s['bookId']=='atanasyan-2023-7-9' and s['chapter']=='XI' and s['printedPages']==[257] and s['pdfPages']==[258]
    assert int(s['exercise'])==n and s.get('subpart')==part
    assert [step['input']['accepted'][0] for step in card['steps'] if 'input' in step]==probes
    assert card['answer']['mode']==('exact' if n==1032 else 'manual')
    model=card['visualization']['model'];cases=[v['label'] for k,v in model['views'].items() if k.startswith('case-')];assert len(cases)==len(set(cases))
    for key,v in model['views'].items():
        views+=1;raw=model['points'];suffix='__v'+v['points'][0].split('__v')[-1];o=raw['O'+suffix];unit=raw['_unitX'+suffix][0]-o[0];assert unit>0 and isclose(raw['_unitY'+suffix][1]-o[1],unit)
        xy=lambda name:tuple((x-y)/unit for x,y in zip(raw[name][:2],o[:2],strict=True))
        pts={name:xy(k) for k in v['points'] for name in model['labels'][k].split('=')}
        for m in v['rightAngles']:
            u,w=minus(xy(m['a']),xy(m['vertex'])),minus(xy(m['b']),xy(m['vertex']));assert isclose(sum(x*y for x,y in zip(u,w,strict=True)),0,abs_tol=1e-7);assert any(abs(x)>1e-6 for x in u) and any(abs(x)>1e-6 for x in w);markers+=1
        if n==1030:
            if 'C' in pts:assert isclose(pts['C'][0],0) and pts['C'][1]>0
            if 'A' in pts:assert pts['A'][0]<0 and isclose(pts['A'][1],0)
            if 'B' in pts:assert pts['B'][0]>0 and isclose(pts['B'][1],0)
            if key=='case-3':assert isclose(dist(pts['B'],pts['C']),10)
        if n==1031:
            a,b,c,d=pts['A'][0],pts['B'][0],pts['B'][1],pts['C'][0]-pts['B'][0]
            assert d>0 and isclose(pts['A'][1],0) and isclose(pts['C'][1],c)
            assert isclose(dist(pts['A'],pts['C'])**2,(b+d-a)**2+c*c) and isclose(dist(pts['O'],pts['C'])**2,(b+d)**2+c*c)
        if n==1032 and part=='б':
            x=pts['A'][1];assert equal(pts['A'],(-1,x)) and equal(pts['B'],(2*x,3))
            if key in ('case-2','step-2'):assert isclose(x,3) and isclose(dist(pts['A'],pts['B']),7)
            if key in ('case-3','step-3'):assert isclose(x,-2.6) and isclose(dist(pts['A'],pts['B']),7)
        if vertices[i] and key=='neutral':
            names='MNPQ' if n==1034 else 'ABC' if n==1033 else 'ABCD'
            assert all(equal(pts[k],p) for k,p in zip(names,vertices[i],strict=True))
            if n==1033:
                a,b,c=[pts[k] for k in 'ABC'];eq_pair=(dist(a,b),dist(a,c) if part=='а' else dist(b,c))
                assert isclose(*eq_pair) and isclose(abs(cross(minus(b,a),minus(c,a)))/2,13 if part=='а' else 6)
            else:
                a,b,c,d=[pts[k] for k in names];u,w=minus(b,a),minus(c,b);assert equal(u,minus(c,d)) and equal(w,minus(d,a))
                if n==1034:
                    assert isclose(dist(a,c)**2,45 if part=='а' else 32) and isclose(dist(b,d)**2,25 if part=='а' else 8)
                else:assert isclose(u[0]*w[0]+u[1]*w[1],0,abs_tol=1e-7) and isclose(abs(cross(u,w)),8 if part=='а' else 17)
roots=set()
for denom in range(1,10):
    for numerator in range(-100,101):
        x=Fraction(numerator,denom);q=(2*x+1)**2+(3-x)**2
        assert q-49==(x-3)*(5*x+13)
        if q==49:roots.add(x)
assert roots=={Fraction(3),Fraction(-13,5)}
trapezoids=0
for a,b,c,d in product(range(1,6),range(-4,5),[-3,-2,-1,1,2,3],range(1,6)):
    ac=dist((a,0),(b+d,c));oc=dist((0,0),(b+d,c));assert isclose(ac*ac,(b+d-a)**2+c*c) and isclose(oc*oc,(b+d)**2+c*c);trapezoids+=1
print(f'COORDINATE_FIGURES_OK {len(cards)} source lessons, {views} diagrams, {markers} shown orthogonal angles, {trapezoids} general trapezoids, 1809 exact rational substitutions, all six proof configurations.')

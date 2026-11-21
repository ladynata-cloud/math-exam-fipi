"""Check every vertex, covering radius, tangent and midpoint construction independently of the lesson generator."""
import json
from math import atan2, cos, degrees, hypot, isclose, pi, sqrt
from polygon_circle_applications import OUT

def near(a,b):return isclose(a,b,abs_tol=.0002,rel_tol=1e-7)
def delta(a,b):return a[0]-b[0],a[1]-b[1]
def distance(a,b):return hypot(*delta(a,b))
def dot(a,b):return a[0]*b[0]+a[1]*b[1]
def det(a,b):return a[0]*b[1]-a[1]*b[0]


data=json.loads(OUT.read_bytes())['lessons'];models=mapped=0
for e,n in zip(data,[117,1178,1179,1180,1181,1182],strict=True):
    theory=n==117;pg=[298,299] if theory else [301];s=e['source']
    assert s['chapter']=='XIII' and s['printedPages']==pg and s['pdfPages']==[x+1 for x in pg] and not s.get('subpart')
    assert e['id']==f'atanasyan-7-9-{"theory" if theory else "main"}-{n}-part-1' and len([s for s in e['steps'] if 'input' in s])==2
    if n in (1178,1179,1180,1181):assert ['2√6','2√3','6','32√3'][n-1178] in e['answer']['accepted']
    m=e['visualization']['model'];raw=m['points']
    for key,v in m['views'].items():
        k=2 if key in ('case-3','step-3') else 1 if key in ('case-2','step-2') else 0
        models+=1;suf='__v'+v['points'][0].split('__v')[1];o=raw['O'+suf];scale=raw['_unitX'+suf][0]-o[0]
        def coord(ref):return tuple((raw[ref][i]-o[i])/scale for i in (0,1))
        p={name:coord(ref) for ref in v['points'] for name in m['labels'][ref].split('=')}
        def pt(name):return p[name] if name in p else coord(name+suf)
        def side(a,b):return distance(pt(a),pt(b))
        def tangent(a,b):
            return abs(det(delta(center,pt(a)),delta(pt(b),pt(a))))/side(a,b)
        circle,=v['circles'];center=coord(circle['center']);rad=distance(center,coord(circle['through']))
        if n==117:
            assert near(rad,4)
            if k==0:
                for i,x in enumerate('ABCDEF'):assert near(side(x,'ABCDEF'[(i+1)%6]),4)
            else:
                count=6 if k==1 else 4;old=['A','B',*['_old'+str(i) for i in range(2,count)]];new=['K',*['_new'+str(i) for i in range(1,count)]]
                cycle=[nm for pair in zip(old,new) for nm in pair]
                for i,x in enumerate(cycle):
                    a,b=delta(pt(x),center),delta(pt(cycle[(i+1)%len(cycle)]),center)
                    assert near(degrees(atan2(det(a,b),dot(a,b))),180/count)
                    assert near(hypot(*a),rad);mapped+=1
                assert near(side('H','A'),side('H','B')) and near(side('K','A'),side('K','B'))
                assert near(dot(delta(pt('K'),pt('T')),delta(pt('B'),pt('A'))),0)
        elif n==1178:
            factor=2 if k==2 else 1;assert near(rad,2*sqrt(3)*factor)
            assert near(side('A','B'),6*factor)
            if k:
                for i,x in enumerate('KLMN'):
                    assert near(distance(pt(x),center),rad) and near(side(x,'KLMN'[(i+1)%4]),2*sqrt(6)*factor)
        elif n==1179:
            factor=2 if k==2 else 1;assert near(side('A','B'),3*factor)
            assert near(rad,sqrt(3)*factor);squares=[distance(p[x],center)**2 for x in 'ABC']
            assert near(sum(squares)/3,side('T','A')**2+distance(p['T'],center)**2)
            assert (max(squares)>rad**2+.01)==(k==1)
        elif n==1180:
            distances=[tangent(a,b) for a,b in zip('ABCD','BCDA')]
            assert near(2*rad,4 if k==2 else 6) and near(side('H','K'),4 if k==2 else 6)
            assert (min(distances)<rad-.001)==(k==1)
            if k==0:assert all(near(d,rad) for d in distances)
            if k==2:assert sum(near(d,rad) for d in distances)==2
        elif n==1181:
            f=.5 if k==2 else 1;assert near(rad,4*sqrt(3)*f)
            for a,b in zip('ABCDEF','BCDEFA'):assert near(tangent(a,b),rad) and near(side(a,b),8*f)
            if k:
                for a,b in zip('KLMN','LMNK'):assert near(tangent(a,b),rad) and near(side(a,b),8*sqrt(3)*f)
        else:
            R=side('T','A');r=side('T','H')
            assert near(R,6 if k==2 else 4) and near(R,2*r)
            assert near(rad,R if k==0 else r)
            assert near(tangent('A','B'),r) and near(side('A','H'),side('B','H'))
# The valve result needs a bound for every possible center, not just the drawn shift.
pts=[(1,0),(-.5,sqrt(3)/2),(-.5,-sqrt(3)/2)]
trials=0
for i in range(-20,21):
    for j in range(-20,21):
        q=(i/7,j/9);vals=[distance(x,q)**2 for x in pts]
        assert near(sum(vals)/3,1+dot(q,q)) and (max(vals)>1+1e-8)==bool(i or j);trials+=1
print(f'POLYGON_CIRCLE_APPLICATIONS_OK {len(data)} source entries, {models} verified metric diagrams, {mapped} compass half-arcs, {trials} independent candidate centers.')

"""Check textbook numbers 967–971, including two printed answer-key discrepancies."""
from itertools import product
from math import hypot
from pathlib import Path
import json
from vector_model_measurements import close, determinant, dot, eq, measurements, minus, plus

root=Path(__file__).resolve().parents[2]
cards=json.loads((root/'geometry-course/textbook/data/scalar-problems.json').read_text())['lessons']


def scaled(k,v):return (k*v[0],k*v[1])


def linear(a,b,k,l):return plus(scaled(k,a),scaled(l,b))


source=[];count=0;cases=0
for card in cards:
    s=card['source'];n=int(s['exercise']);part=s.get('subpart','')
    source.append((n,part))
    assert s['printedPages']==[241] and s['pdfPages']==[242] and s['chapter']=='X' and s['bookId']=='atanasyan-2023-7-9'
    assert len([x for x in card['steps'] if x.get('input')])==2
    m=card['visualization']['model']
    for name in m['views']:
        count+=len(measurements(m,name)[1]);cases+=name.startswith('case-')
    def shown(i,label,want):
        v,edges=measurements(m,'case-'+str(i))
        assert label in edges and eq(v(label),want),(n,part,i,label,want,edges)
    def total(i,want):
        v,edges=measurements(m,'case-'+str(i));assert any(e[0]=='P' and eq(v(e),want) for e in edges),(i,edges,want)
    if n==967:
        for i,k in enumerate([1/3,-1/3,1/6,-2/3,2],1):
            v,_=measurements(m,'case-'+str(i))
            p=v('OP');shown(i,'OT',scaled(k,p))
            assert close(hypot(*v('OT')),abs(k)*hypot(*p))
            assert (dot(v('OT'),p)>0)==(k>0) and close(determinant(v('OT'),p),0)
    elif n==968:
        v,edges=measurements(m,'case-1');shown(1,'PT',scaled(1 if part=='а' else -1,v('OA')))
        _,edges=measurements(m,'case-2');assert not edges
    elif n==969:
        v,edges=measurements(m,'neutral');mm,nn=v('OM'),v('ON');x,y=v('OX'),v('OY')
        assert eq(x,plus(mm,nn)) and eq(y,minus(mm,nn))
        k,l={'а':(2,-2),'б':(2,.5),'в':(-1,-1/3)}[part]
        answer=linear(x,y,k,l)
        total(1,answer);total(2,answer)
        if part=='в':
            total(3,(0,-4))
            assert not eq(linear((0,0),(0,6),-4/3,-3/2),(0,-4))
    elif n==970:
        v,_=measurements(m,'neutral');a,b=v('DC'),v('BC')
        assert eq(v('AE'),v('ED')) and eq(v('BG'),v('GC'))
        true=plus(a,scaled(.5,b));wrong=minus(a,scaled(.5,b))
        shown(1,'EC',true);shown(2,'AG',true);shown(3,'EC',true);shown(3,'AG',true)
        assert not eq(true,wrong)
    elif n==971:
        v,_=measurements(m,'neutral');a,b=v('AD'),v('AB')
        assert eq(v('BM'),scaled(3,v('MC')))
        am=linear(a,b,.75,1);md=linear(a,b,.25,-1)
        shown(1,'AM',am);shown(2,'MD',md);shown(3,'AD',plus(am,md))
assert source==[(967,''),(968,'а'),(968,'б'),(969,'а'),(969,'б'),(969,'в'),(970,''),(971,'')]
points=list(product(range(-2,3),repeat=2))
for m,n in product(points,repeat=2):
    x,y=plus(m,n),minus(m,n)
    assert eq(linear(x,y,2,-2),scaled(4,n))
    assert eq(linear(x,y,2,.5),linear(m,n,2.5,1.5))
    assert eq(linear(x,y,-1,-1/3),linear(m,n,-4/3,-2/3))
    if determinant(m,n):
        A=(0,0);B=m;C=plus(m,n);D=n
        E=scaled(.5,D);G=scaled(.5,plus(B,C))
        assert eq(minus(C,E),plus(m,scaled(.5,n))) and eq(minus(G,A),minus(C,E))
        assert not eq(minus(C,E),minus(m,scaled(.5,n)))
print(f'SCALAR_PROBLEMS_OK {len(cards)} cards, {count} arrows, {cases} model cases, {len(points)**2} basis pairs, two independent printed-key counterexamples.')

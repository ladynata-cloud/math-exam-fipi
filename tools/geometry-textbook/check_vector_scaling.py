"""Verify each source case against physical arrows and independent vector identities."""
from itertools import combinations, product
from math import hypot
from pathlib import Path
import json
from vector_model_measurements import close, determinant, eq, measurements, plus

root=Path(__file__).resolve().parents[2]
cards=json.loads((root/'geometry-course/textbook/data/vector-scaling.json').read_text())['lessons']


def mult(k,v):return tuple(k*x for x in v)


def combination(factors,vectors):
    return tuple(sum(k*v[i] for k,v in zip(factors,vectors,strict=True)) for i in (0,1))


source=[];arrows=0;case_count=0
for card in cards:
    s=card['source'];n=int(s.get('point') or s['exercise']);part=s.get('subpart','');source.append((n,part))
    pages={91:[237,238],92:[239,240]}.get(n,[241])
    assert (s['bookId'],s['chapter'],s['printedPages'],s['pdfPages'])==('atanasyan-2023-7-9','X',pages,[x+1 for x in pages])
    m=card['visualization']['model']
    for name in m['views']:
        arrows+=len(measurements(m,name)[1]);case_count+=name.startswith('case-')
    def want(i,arrow,expected):
        v,edges=measurements(m,'case-'+str(i))
        assert arrow in edges and eq(v(arrow),expected),(n,part,i,arrow,expected)
    def resultant(i,factors,basis):
        v,edges=measurements(m,'case-'+str(i));expected=combination(factors,basis)
        if eq(expected,(0,0)):
            assert edges and edges[0][0]==edges[-1][1]=='P'
        else:
            assert any(e[0]=='P' and eq(v(e),expected) for e in edges),(n,part,i,expected,edges)
    steps=[step['input']['accepted'][0] for step in card['steps'] if 'input' in step];assert len(steps)==2
    if n==91:
        want(1,'OB',(4,2));want(2,'OC',(-3,-1.5))
        v,edges=measurements(m,'case-3');assert not edges
        v,_=measurements(m,'case-4')
        for short,long in [('OA','OC'),('AB','CD'),('OB','OD')]:want(4,long,mult(2,v(short)))
        assert eq(v('OD'),plus(v('OC'),v('CD')))
    elif n==92:
        v,_=measurements(m,'case-1')
        want(1,'OC',mult(.5,plus(v('OA'),v('OB'))))
        v,_=measurements(m,'case-2')
        want(2,'ON',mult(2,v('OM')))
        for small,big in [('OB','OA'),('OC','OD')]:assert eq(mult(2,v(small)),v(big))
        v,_=measurements(m,'case-3')
        want(3,'MN',mult(.5,plus(v('AD'),v('BC'))))
        assert close(determinant(v('MN'),v('BC')),0) and close(hypot(*v('MN')),5)
        assert eq(v('AM'),v('MB')) and eq(v('CN'),v('ND'))
    elif n==963:
        v,edges=measurements(m,'case-1');assert edges==['AB','CD']
        assert not eq(v('AC'),(0,0)) and abs(determinant(v('AB'),v('CD')))>1
        for i in [2,3]:want(i,'OE',mult(2,v('AB')));want(i,'OF',mult(.5,v('CD')))
    elif n==964:
        xy=((2,2),(2,-2));same=((2,0),(4,0));reverse=((2,0),(-4,0))
        k={'а':(1,2),'б':(1,.5),'в':(3,.5),'г':(1.5,-3),'д':(0,4),'е':(-2,0)}[part]
        assert determinant(*xy)!=0 and determinant(*same)==determinant(*reverse)==0
        for i,basis in enumerate([xy,same,reverse],1):resultant(i,k,basis)
        assert eq(list(map(float,steps)),[combination(k,xy)[0],combination(k,((0,4),(0,-4)))[1]])
    elif n==965:
        v,_=measurements(m,'neutral');basis=[v('AB'),v('CD')]
        assert not eq(v('AC'),(0,0)) and determinant(*basis)!=0
        for i,k in enumerate([(2,-.5),(1,3),(-2,-.5),(-1,2/3)],1):resultant(i,k,basis)
        assert eq(list(map(float,steps)),[combination((-2,-.5),basis)[1],(2/3)*12-(-2)])
    elif n==966:
        v,_=measurements(m,'neutral');basis=[v('OA'),v('OB'),v('OC')]
        assert all(abs(determinant(x,y))>1 for x,y in combinations(basis,2))
        k=(2,3,-4) if part=='а' else (.5,-1,1/3)
        resultant(1,k[:2],basis[:2]);resultant(2,k,basis);resultant(3,k,basis)
        assert eq(list(map(float,steps)),[combination(k,basis)[0],combination(k,((0,4),(0,1),(0,-3)))[1]])
assert source==[(91,''),(92,''),(963,'')]+[(964,p) for p in 'абвгде']+[(965,''),(966,'а'),(966,'б')]
vecs=list(product(range(-2,3),repeat=2));ks=[-2,-.5,0,.5,2]
for a,b,k,l in product(vecs,vecs,ks,ks):
    assert eq(mult(k,mult(l,a)),mult(k*l,a))
    assert eq(mult(k+l,a),plus(mult(k,a),mult(l,a)))
    assert eq(mult(k,plus(a,b)),plus(mult(k,a),mult(k,b)))
print(f'VECTOR_SCALING_OK {len(cards)} cards, {arrows} oriented arrows, {case_count} model cases, {len(vecs)**2*len(ks)**2} configurations of three scalar laws.')

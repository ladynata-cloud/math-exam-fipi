"""Verify every named vector against the drawing of the corresponding source subpart."""
from itertools import product
from pathlib import Path
import json
from vector_model_measurements import determinant, eq, measurements, minus, plus

root=Path(__file__).resolve().parents[2]
cards=json.loads((root/'geometry-course/textbook/data/vector-midpoint-proofs.json').read_text())['lessons']


def times(k,v):return (k*v[0],k*v[1])


def combination(x,y,k,l):return plus(times(k,x),times(l,y))


source=[];arrows=0;cases=0
for card in cards:
    s=card['source'];n=int(s['exercise']);part=s.get('subpart','');source.append((n,part))
    pages=[241,242] if n==972 else [242]
    assert (s['printedPages'],s['pdfPages'],s['chapter'],s['bookId'])==(pages,[p+1 for p in pages],'X','atanasyan-2023-7-9')
    assert len([x for x in card['steps'] if x.get('input')])==2
    m=card['visualization']['model']
    for name in m['views']:
        arrows+=len(measurements(m,name)[1]);cases+=name.startswith('case-')
    def expect(index,edge,value):
        v,seen=measurements(m,'case-'+str(index));assert edge in seen and eq(v(edge),value),(n,part,index,edge,value,seen)
    v,_=measurements(m,'neutral')
    if n==972:
        x,y=v('AD'),v('AB')
        assert eq(v('AM'),times(.5,v('MD'))) and eq(v('AO'),v('OC')) and eq(v('BO'),v('OD'))
        answers=[('AC',1,1),('AO',.5,.5),('CO',-.5,-.5),('DO',-.5,.5),('AT',2,0),('OD',.5,-.5),('CA',-1,-1)] if part=='а' else [
            ('AM',1/3,0),('MC',2/3,1),('BM',1/3,-1),('OM',-1/6,-.5)]
        for i,(edge,k,l) in enumerate(answers,1):expect(i,edge,combination(x,y,k,l))
        if part=='а':
            assert eq(plus(v('AD'),v('CO')),v('OD')) and eq(plus(v('CO'),v('OA')),v('CA'))
            expect(5,'DT',v('BC'))
    elif n==973:
        for i in [1,2,3]:
            v,_=measurements(m,'case-'+str(i))
            assert eq(v('AM'),v('MC')) and eq(v('BN'),v('ND'))
            expect(i,'MN',times(.5,plus(v('AD'),v('CB'))))
            signs=[determinant(v(a),v(b)) for a,b in [('AB','BC'),('BC','CD'),('CD','DA'),('DA','AB')]]
            assert (min(signs)<0<max(signs))==(i==3)
    elif n==974:
        a,b=v('AC'),v('AB')
        assert eq(v('BA₁'),v('A₁C')) and eq(v('AB₁'),v('B₁C')) and eq(v('AC₁'),v('C₁B'))
        aa=combination(a,b,.5,.5);bb=combination(a,b,.5,-1);cc=combination(a,b,-1,.5)
        for i,(edge,value) in enumerate([('AA₁',aa),('BB₁',bb),('CC₁',cc)],1):expect(i,edge,value)
        assert eq(plus(plus(aa,bb),cc),(0,0))
    elif n==975:
        a,b=v('ED'),v('EF');assert eq(v('DG'),v('GF')) and eq(v('EO'),v('OG'))
        expect(1,'EG',combination(a,b,.5,.5));expect(2,'EO',combination(a,b,.25,.25));expect(3,'DO',combination(a,b,-.75,.25))
assert source==[(972,'а'),(972,'б'),(973,''),(974,''),(975,'')]
points=list(product(range(-1,2),repeat=2))
for A,B,C,D in product(points,repeat=4):
    M=times(.5,plus(A,C));N=times(.5,plus(B,D))
    assert eq(minus(N,M),times(.5,plus(minus(D,A),minus(B,C))))
print(f'VECTOR_MIDPOINT_PROOFS_OK {len(cards)} cards, {arrows} arrows, {cases} model cases, {len(points)**4} quadrilaterals.')

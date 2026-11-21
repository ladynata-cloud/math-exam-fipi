"""Verify actual directed strokes, incidence and the exceptional exterior construction in №977."""
from itertools import product
from math import hypot
from pathlib import Path
import json
from vector_model_measurements import close,determinant,eq,measurements,minus,plus

root=Path(__file__).resolve().parents[2]
cards=json.loads((root/'geometry-course/textbook/data/vector-applications.json').read_text())['lessons']


def scale(k,v):return tuple(k*x for x in v)


def total(vectors):
    result=(0,0)
    for v in vectors:result=plus(result,v)
    return result


assert [int(c['source']['exercise']) for c in cards]==list(range(976,981))
counts={'arrows':0,'cases':0}
for card in cards:
    src=card['source'];n=int(src['exercise']);pages=[242 if n<=977 else 243]
    assert (src['bookId'],src['chapter'],src['printedPages'],src['pdfPages'])==('atanasyan-2023-7-9','X',pages,[pages[0]+1])
    assert len([s for s in card['steps'] if s.get('input')])==2
    model=card['visualization']['model']
    for name in model['views']:
        counts['arrows']+=len(measurements(model,name)[1]);counts['cases']+=name.startswith('case-')
    def use(i):return measurements(model,'case-'+str(i))
    if n==976:
        v,seen=use(1);w,chain=use(2)
        assert seen==['AA₁','BB₁','CC₁'] and chain==['PQ','QR','RP']
        medians=[v(pair) for pair in seen];assert eq(total(medians),(0,0)) and not close(determinant(*medians[:2]),0)
        assert all(eq(x,w(edge)) for x,edge in zip(medians,chain,strict=True))
        for edge,(p,q) in zip(seen,[('AB','AC'),('BC','BA'),('CA','CB')],strict=True):assert eq(v(edge),scale(.5,plus(v(p),v(q))))
    elif n==977:
        for i,flat in [(1,False),(3,True)]:
            v,edges=use(i);w,chain=use(i+1)
            assert edges==['A₁A₂','B₁B₂','C₁C₂'] and chain==['PQ','QR','RP']
            u,z,h=v('AA₂'),v('BB₂'),v('AA₁')
            assert eq(u,v('BB₁')) and eq(z,v('CC₁')) and eq(h,v('CC₂'))
            # Signed cross-products put all three parallelograms in their proper exterior half planes.
            assert determinant(v('AB'),u)*determinant(v('AB'),v('AC'))<0
            assert determinant(v('BC'),z)*determinant(v('BC'),v('BA'))<0
            assert determinant(v('AC'),h)*determinant(v('AC'),v('AB'))<0
            target=[minus(u,h),minus(z,u),minus(h,z)]
            for a,b,t in zip(edges,chain,target,strict=True):assert eq(v(a),t) and eq(w(b),t)
            assert eq(total(target),(0,0)) and close(determinant(*target[:2]),0)==flat
            if flat:assert close(hypot(*target[0])+hypot(*target[1]),hypot(*target[2]))
    elif n==978:
        for i,dx in [(1,2),(2,-2)]:
            v,edges=use(i);assert edges==['AD','CB','MN']
            assert eq(v('AM'),v('MC')) and eq(v('BN'),v('ND'))
            assert eq(v('MN'),scale(.5,plus(v('AD'),v('CB')))) and eq(v('MN'),(dx,0))
    elif n==979:
        for i in (1,2,3):
            v,_=use(i)
            for a,b in [('AE','EB'),('BF','FC'),('CG','GD'),('DH','HA'),('ET','TG'),('FT','TH')]:assert eq(v(a),v(b))
            signs=[determinant(v(a),v(b)) for a,b in [('AB','BC'),('BC','CD'),('CD','DA'),('DA','AB')]]
            assert (min(signs)<0<max(signs))==(i==3)
    elif n==980:
        v,edges=use(3);assert edges==['MN','BC'] and eq(v('MN'),scale(.5,v('BC')))
        assert eq(v('AM'),v('MB')) and eq(v('AN'),v('NC'))
points=list(product(range(-1,2),repeat=2));triangles=0
for a,b,c in product(points,repeat=3):
    if determinant(minus(b,a),minus(c,a))==0:continue
    ma=minus(scale(.5,plus(b,c)),a);mb=minus(scale(.5,plus(c,a)),b);mc=minus(scale(.5,plus(a,b)),c)
    assert eq(total([ma,mb,mc]),(0,0)) and not close(determinant(ma,mb),0)
    triangles+=1
print(f'VECTOR_APPLICATIONS_OK {len(cards)} cards, {counts["arrows"]} arrows, {counts["cases"]} model cases, {triangles} nondegenerate median triangles, exterior counterexample separately checked.')

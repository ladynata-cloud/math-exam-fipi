"""Measure full diagrams, tangent projections, source magnitudes and geometric bounds."""
from itertools import product
from math import acos,degrees,hypot
from pathlib import Path
import json
from vector_model_measurements import close,determinant,dot,eq,measurements,plus

root=Path(__file__).resolve().parents[2]
cards=json.loads((root/'geometry-course/textbook/data/vector-length-problems.json').read_text())['lessons']
assert [int(card['source']['exercise']) for card in cards]==list(range(981,988))
arrows=0;circles=0
exact={981:'10',983:'30',984:'16',987:'7'}
for entry in cards:
    s=entry['source'];n=int(s['exercise'])
    assert (s['bookId'],s['chapter'],s['printedPages'],s['pdfPages'])==('atanasyan-2023-7-9','X',[243],[244])
    assert len([step for step in entry['steps'] if step.get('input')])==2
    if n in exact:
        assert entry['answer']['mode']=='exact' and entry['answer']['accepted']==[exact[n]+suffix for suffix in ['',',0','.0',',00','.00',' см','см']] and entry['answer']['feedback']
    else:assert entry['answer']['mode']=='manual'
    model=entry['visualization']['model']
    for name,obj in model['views'].items():
        v,edges=measurements(model,name);arrows+=len(edges)
        def length(pair):return hypot(*v(pair))
        if n in (983,984):
            assert len(obj['circles'])==len(obj['rightAngles'])==1
            circle=obj['circles'][0]
            assert circle['center'].split('__v')[0]=='O' and circle['through'].split('__v')[0]=='C'
            drawing=model['points'];ox,oy,_=drawing[circle['center']];px,py,_=drawing[circle['through']]
            r=hypot(ox-px,oy-py)
            assert ox-r>=0 and ox+r<=100 and oy-r>=0 and oy+r<=70
            assert all(close(length(pair),length('OT')) for pair in ['OC','OD'])
            assert eq(v('CO'),v('OD')) and close(length('CD'),length('CC₁')+length('DD₁'))
            assert all(close(dot(v(pair),v('C₁D₁')),0) for pair in ['OT','CC₁','DD₁'])
            assert all(close(length(k),x) for k,x in zip(['CC₁','DD₁','CD'],[18,12,30] if n==983 else [11,16,27],strict=True))
            circles+=1
        elif n==981:
            assert close(length('AB'),13) and close(length('CD'),15)
            assert close(sum(length(e) for e in ['AB','BC','CD','DA']),48)
            assert close(length('MN'),10) and close(length('MN'),.5*(length('AD')+length('BC')))
        elif n==982:
            assert all(close(length(e),length('AB')/4) for e in ['AD','DE','EF','FB'])
            for e,factor in [('DK',1),('EL',2),('FM',3)]:assert close(length(e),3.4*factor) and close(determinant(v(e),v('BC')),0)
        elif n==985:
            for x,y in [('AM','MB'),('CN','ND'),('AP','PC'),('BQ','QD')]:assert eq(v(x),v(y))
            assert close(determinant(v('MP'),v('MN')),0) and close(determinant(v('MQ'),v('MN')),0)
            assert length('MP')+length('PN')-length('MN')<1e-6 and length('MQ')+length('QN')-length('MN')<1e-6
        elif n==986:
            for edge,value in [('AB',48),('CD',48),('AH',24),('MP',11),('PN',35),('AD',70),('BC',22)]:assert close(length(edge),value)
            angle=degrees(acos(dot(v('AB'),v('AH'))/(length('AB')*length('AH'))));assert close(angle,60)
        elif n==987:
            assert close(length('AH'),3) and close(length('HD'),7) and close(length('MN'),length('HD'))
            assert close(length('AB'),length('CD')) and close(dot(v('BH'),v('AD')),0)
tests=0
for large,small in product(range(2,31),range(1,30)):
    if large<=small:continue
    a=(large-small)/2;b=(large+small)/2
    assert a+b==large and b>a and a+small==b
    tests+=1
print(f'VECTOR_LENGTHS_OK {len(cards)} cards, {len(exact)} exact totals, {arrows} arrows, {circles} actual tangent circles and {tests} isosceles base pairs.')

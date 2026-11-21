"""Verify the 20 printed review questions, their probes and measured example diagrams."""
import json
from itertools import product
from math import hypot
from pathlib import Path
from vector_model_measurements import close,determinant,eq,measurements,minus,plus
from vector_extra_problems import ROOT
from vector_scaling import scale

chapter=json.loads((ROOT/'geometry-course/textbook/data/vector-chapter-review.json').read_bytes())['lessons']
assert len(chapter)==21
units=list(range(1,16))+list(range(15,21))
assert [int(entry['source']['exercise']) for entry in chapter]==units
assert [e['source'].get('subpart') for e in chapter if e['source']['exercise']=='15']==['а','б']
expected=[(7,0),(-3,0),(5,13),(2,5),(2,4),(4,6),(2,3),(3,8),(2,3),(4,-2),(3,-5),(3,-3),(-3,3),(-3,2),(0,12),(0,5),(-3,0),(-6,6),(-2,14),(5,7),(6,15)]
arrows=views=0
for entry,probes in zip(chapter,expected,strict=True):
    s=entry['source'];n=int(s['exercise']);page=243 if n<6 else 244
    assert (s['collection'],s['chapter'],s['printedPages'],s['pdfPages'])==('selfcheck','X',[page],[page+1])
    assert entry['id']==f"atanasyan-7-9-selfcheck-chapter-10-{n}-part-{2 if s.get('subpart')=='б' else 1}"
    assert entry['answer']['mode']=='manual' and entry['status']=='reviewed'
    assert [step['input']['accepted'] for step in entry['steps'] if 'input' in step]==[[str(a)] for a in probes]
    assert len(entry['steps'])==3 and len(entry['help'])==3
    m=entry['visualization']['model']
    for name,picture in m['views'].items():
        v,edges=measurements(m,name)
        labels={p.split('__v')[0] for p in picture['points']}
        views+=1;arrows+=len(edges)
        if n in (1,2,3):
            if 'C' in labels:
                assert close(hypot(*v('AC')),5) and close(hypot(*v('AB'))+hypot(*v('BC')),7)
            else: assert not edges
        elif n==4:
            assert close(determinant(v('AB'),v('CD')),0) and close(determinant(v('AB'),v('EF')),0)
            assert v('AB')[0]*v('CD')[0]>0 and v('AB')[0]*v('EF')[0]<0 and determinant(v('AB'),v('AC'))!=0
        elif n==5:
            assert eq(v('AB'),v('CD')) and not eq(v('AB'),v('EF'))
            assert close(hypot(*v('AB')),hypot(*v('EF')))
        elif n==6:
            assert eq(v('AB'),v('CD')) and not eq(v('CD'),v('CE'))
        elif n in (7,8):
            if 'C' in labels:assert eq(plus(v('AB'),v('BC')),v('AC'))
            else: assert len(labels)==3 and not edges
        elif n in (9,10) and 'O' in labels:
            assert eq(v('OA'),v('BC')) and eq(v('OB'),v('AC')) and eq(plus(v('OA'),v('OB')),v('OC'))
        elif n in (9,11,17) and 'P' in labels and ('R' in labels or 'S' in labels):
            last='S' if 'S' in labels else 'R'
            total=plus(v('PQ'),v('QR'))
            if last=='S':total=plus(total,v('RS'))
            assert eq(total,v('P'+last))
        elif n in (12,13):
            assert eq(minus(v('OA'),v('OB')),v('BA')) and eq(v('OD'),scale(-1,v('OB')))
            assert eq(v('OC'),plus(v('OA'),v('OD')))
        elif n in (14,15,16,17) and 'A' in labels and 'B' in labels:
            assert eq(v('OB'),scale(2,v('OA'))) and eq(v('OC'),scale(-1.5,v('OA'))) and eq(v('OD'),scale(.5,v('OA')))
        elif n==18:
            assert eq(v('AM'),v('MB')) and eq(v('AN'),v('NC')) and eq(v('MN'),scale(.5,v('BC')))
        elif n in (19,20):
            assert eq(v('AM'),v('MB')) and eq(v('DN'),v('NC')) and eq(v('AP'),v('PC'))
            assert eq(v('MN'),plus(v('MP'),v('PN'))) and eq(v('MP'),scale(.5,v('BC'))) and eq(v('PN'),scale(.5,v('AD')))
            assert close(hypot(*v('MN')),6)
laws=0
for k,l,x,y,u,v in product(range(-2,3),repeat=6):
    a,b=(x,y),(u,v)
    assert eq(scale(k*l,a),scale(k,scale(l,a)))
    assert eq(scale(k+l,a),plus(scale(k,a),scale(l,a)))
    assert eq(scale(k,plus(a,b)),plus(scale(k,a),scale(k,b)))
    laws+=1
print(f'VECTOR_REVIEW_OK {len(set(units))} source questions, {len(chapter)} independent cards, {len(expected)*2} probes, {views} views, {arrows} measured arrows, {laws} triple-law cases.')

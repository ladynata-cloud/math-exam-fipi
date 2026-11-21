"""Independent coefficient identities and measurements of every chapter XI comparison drawing."""
import json
import re
from fractions import Fraction
from itertools import product
from coordinate_relations import ROOT
from vector_model_measurements import close,determinant,eq,measurements,plus
from vector_scaling import scale

cards=json.loads((ROOT/'geometry-course/textbook/data/coordinate-relations.json').read_bytes())['lessons']
assert [(int(c['source']['exercise']),c['source'].get('subpart')) for c in cards]==[(1000,'а'),(1000,'б'),(1001,'а'),(1001,'б'),(1001,'в'),(1002,None),(1003,'а'),(1003,'б'),(1003,'в'),(1003,'г')]
systems={'а':(lambda x,y:(3-y,-x-1),(-1,3)),'б':(lambda x,y:(4-x,5+y),(4,-5)),
         'в':(lambda x,y:(x,3-y),(0,3)),'г':(lambda x,y:(1-3*y,1+x),(-1,Fraction(1,3)))}
combinations={'а':((1,1),(1,-1)),'б':((2,-1),(1,1)),'в':((1,1),(1,3))}
count=arrows=0
for card in cards:
    source=card['source'];n=int(source['exercise']);part=source.get('subpart')
    assert (source['chapter'],source['printedPages'],source['pdfPages'])==('XI',[251],[252])
    assert len(card['steps'])==3 and len([s for s in card['steps'] if s.get('input')])==2
    assert (card['answer']['mode']=='exact')==(n==1003)
    if n==1003:
        residual,solution=systems[part]
        assert tuple(map(Fraction,card['answer']['accepted'][0].split(';')))==solution and residual(*solution)==(0,0)
    m=card['visualization']['model']
    for key,picture in m['views'].items():
        v,heads=measurements(m,key);arrows+=len(heads);count+=1
        labels={p.split('__v')[0] for p in picture['points']}
        if n==1000:
            if 'A' not in labels:
                assert set(heads)=={'OB'}
            else:
                t=v('QB')[0];k=1+3*t if part=='а' else t-2
                if 'S' in labels:assert eq(v('RS'),scale(k,v('OA')))
                else:assert close(k,0)
        elif n==1001:
            c,d=combinations[part];a,b=v('OA'),v('OB')
            assert not close(determinant(a,b),0)
            assert eq(v('OH'),plus(scale(c[0],a),scale(c[1],b))) and eq(v('OP'),plus(scale(d[0],a),scale(d[1],b)))
            assert not close(determinant(v('OH'),v('OP')),0)
        elif n==1002:
            assert eq(v('AM'),scale(4,v('MC')))
            assert eq(v('AM'),scale(.8,plus(v('AB'),v('AD'))))
        elif n==1003:
            match=re.search(r'x=([-/0-9]+), y=([-/0-9]+)',picture['label']);assert match
            x,y=map(Fraction,match.groups());u,w=residual(x,y)
            assert eq(v('XA'),(1,0)) and eq(v('XB'),(0,1))
            suffix='P' if 'P' in labels else 'H' if 'H' in labels else 'O'
            assert eq(v('O'+suffix),(float(u),float(w)))
            if key in ('step-3','case-3'):assert (u,w)==(0,0)
            elif key in ('step-2','case-2'):assert (u==0)!=(w==0)
            else:assert u!=0 and w!=0
bases=0
for ax,ay,bx,by in product(range(-3,4),repeat=4):
    a,b=(ax,ay),(bx,by);delta=determinant(a,b)
    if not delta:continue
    for c,d in combinations.values():
        u=plus(scale(c[0],a),scale(c[1],b));w=plus(scale(d[0],a),scale(d[1],b))
        assert determinant(u,w)==determinant(c,d)*delta!=0
    bases+=1
for t in range(-40,41):
    a=(2,-3);b=scale(t,a)
    assert determinant(plus(a,scale(3,b)),a)==0 and determinant(plus(b,scale(-2,a)),a)==0
print(f'COORDINATE_RELATIONS_OK {len(cards)} source cards, {count} views, {arrows} arrows, 4 unique parameter pairs, {bases} independently varied bases.')

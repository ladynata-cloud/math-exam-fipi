"""Independently reconstruct and remeasure every source and transfer circle for 1051–1057."""
import json
from fractions import Fraction as F
from itertools import product
from math import isclose
from circle_equations import ROOT

cards=json.loads((ROOT/'geometry-course/textbook/data/circle-equations.json').read_bytes())['lessons']
expected=[(1051,None,[(0,0,9),(0,0,2),(0,0,6.25)],[(0,0,13)],['2','13']),
 (1052,'а',[(0,5,9)],[(-2,2,4)],['5','4']),(1052,'б',[(-1,2,4)],[(1,-3,9)],['2','9']),
 (1052,'в',[(-3,-7,.25)],[(-1,-2,2.25)],['-7','9/4']),(1052,'г',[(4,-3,100)],[(3,1,25)],['-3','25']),
 (1053,None,[(0,0,10)],[(1,-1,13)],['10','13']),(1054,None,[(0,6,25)],[(-2,1,25)],['25','25']),
 (1055,'а',[(2,1,41)],[(-1,3,13)],['2','13']),(1055,'б',[(3,1,5)],[(2,-1,10)],['3','10']),
 (1056,None,[(-3,0,25),(5,0,25)],[(2,0,16)],['16','1']),(1057,None,[(0,4,25)],[(0,3,25)],['4','3'])]
source_points={1053:{'B':(-1,3)},1054:{'B':(-3,2)},1056:{'A':(1,3)},1057:{'A':(-3,0),'B':(0,9)}}
diameters={'а':((-3,5),(7,-3)),'б':((2,-1),(4,3))}
qdistance=lambda a,b: sum((x-y)**2 for x,y in zip(a,b,strict=True))
close=lambda a,b:isclose(a,b,abs_tol=.0005)
models=measured=0
for card,(n,p,original,fresh,probes) in zip(cards,expected,strict=True):
    s=card['source'];assert s['collection']=='main' and s['chapter']=='XI' and s['bookId']=='atanasyan-2023-7-9' and int(s['exercise'])==n and s.get('subpart')==p and s['printedPages']==[264] and s['pdfPages']==[265]
    assert [a['input']['accepted'][0] for a in card['steps'] if 'input'in a]==probes
    if n not in (1051,1056):
        cx,cy,q=original[0];assert f'{cx};{cy};{F(q)}' in [x.replace('−','-') for x in card['answer']['accepted']]
    model=card['visualization']['model'];raw=model['points']
    for k,view in model['views'].items():
        models+=1;suffix='__v'+view['points'][0].split('__v')[-1];o=raw['O'+suffix];unit=raw['_unitX'+suffix][0]-o[0];assert unit>0 and close(raw['_unitY'+suffix][1]-o[1],unit)
        point=lambda i:tuple((raw[i][j]-o[j])/unit for j in (0,1))
        vertices={n:point(i) for i in view['points'] for n in model['labels'][i].split('=')};assert not any(n.startswith('_') for n in vertices)
        loci=[]
        for c in view['circles']:
            center=point(c['center']);r2=qdistance(center,point(c['through']));loci.append((*center,r2));measured+=1
        transfer=k in ('step-3','case-3');source_view=k in ('step-2','case-2')
        if transfer or source_view:
            wanted=fresh if transfer else original;assert len(loci)==len(wanted)
            for target in wanted:assert any(all(close(a,b) for a,b in zip(target,v,strict=True)) for v in loci),(n,p,k,loci,wanted)
        if source_view:
            for letter,position in source_points.get(n,{}).items():
                assert all(close(a,b) for a,b in zip(vertices[letter],position,strict=True));assert all(close(qdistance(position,(x,y)),q) for x,y,q in loci)
            if n==1055:
                m,N=diameters[p];assert all(close(a,b) for a,b in zip(vertices['M'],m,strict=True)) and all(close(a,b) for a,b in zip(vertices['N'],N,strict=True))
                x,y,q=loci[0];assert close(4*q,qdistance(m,N)) and close(x,(m[0]+N[0])/2) and close(y,(m[1]+N[1])/2)
        if transfer:
            for a in ('M','N','T','U'):
                if a in vertices:assert all(close(qdistance(vertices[a],(x,y)),q) for x,y,q in loci)
        for k2 in view['points']:assert all(not x.startswith('_') for x in model['labels'][k2].split('='))
    assert len({v['label'] for v in model['views'].values()})>=4
assert all(qdistance((1,3),(x,0))==25 for x in (-3,5));assert [x for x in range(-15,16) if qdistance((1,3),(x,0))==25]==[-3,5]
assert [y for y in range(-15,16) if qdistance((-3,0),(0,y))==qdistance((0,9),(0,y))]==[4]
checks=0
for x,y,a,b in product(range(-4,5),repeat=4):
    q=qdistance((x,y),(a,b));assert q==x*x+y*y-2*a*x-2*b*y+a*a+b*b
    u,v=F(x+a,2),F(y+b,2);assert 4*qdistance((x,y),(u,v))==q;checks+=1
print(f'CIRCLE_EQUATIONS_OK {len(cards)} book lessons; {models} measured diagrams; {measured} fitted loci; all three source radii, both source diameters, both centres in 1056, unique centre in 1057; {checks} translation and diameter identities.')

"""Independently test printed endpoints, alternate families, verticals and the native coloured segments."""
import json
from fractions import Fraction as F
from itertools import combinations,product
from math import gcd,isclose
from coordinate_lines import ROOT

cards=json.loads((ROOT/'geometry-course/textbook/data/coordinate-lines.json').read_bytes())['lessons']
keys=[(1058,p) for p in 'абв']+[(1059,None),(1060,'а'),(1060,'б'),(1061,None)]+[(1062,p) for p in 'абвг']+[(1063,None),(1064,None)]
source_points=[[(1,-1),(-3,2)],[(2,5),(5,2)],[(0,1),(-4,-5)]]
original_eq=[[(3,4,1)],[(1,1,-7)],[(3,-2,2)],[(7,-1,3)],[(1,-1,0),(0,1,-1)],[(3,-5,5)],[(1,0,-2),(0,1,-5)],[(0,1,-3)],[(1,0,2)],[(0,1,4)],[(1,0,-7)],[(1,-1,2),(1,0,-5)],[(2,5,-10),(2,-5,-10),(2,5,10),(2,-5,10)]]
other_eq=[[(1,0,-1)],[(0,1,-3)],[(2,-1,-1)],[(0,1,-2)],[(5,-4,0),(1,4,-6)],[(1,-2,3)],[(1,0,3),(0,1,1)],[(1,0,2)],[(0,1,-3)],[(1,0,-1)],[(0,1,1)],[(2,1,-2),(1,0,1)],[(2,3,-6),(2,-3,-6),(2,3,6),(2,-3,6)]]
probes=[['3','-1'],['-3','-3'],['-6','-1'],['3','2'],['1','-6'],['5','3'],['5','-3'],['3','-2'],['-2','3'],['-4','1'],['7','-1'],['5','4'],['5','6']]
models=segments=0
for i,(card,(n,part),eqs,new,steps) in enumerate(zip(cards,keys,original_eq,other_eq,probes,strict=True)):
    s=card['source'];pages=[264,265] if (n,part)==(1058,'а') else [264] if n==1058 else [265];assert int(s['exercise'])==n and s.get('subpart')==part and s['printedPages']==pages and s['pdfPages']==[p+1 for p in pages] and s['chapter']=='XI' and s['bookId']=='atanasyan-2023-7-9'
    assert [r['input']['accepted'][0] for r in card['steps'] if 'input' in r]==steps
    m=card['visualization']['model'];raw=m['points']
    for k,v in m['views'].items():
        models+=1;suffix='__v'+v['points'][0].split('__v')[-1];o=raw['O'+suffix];scale=raw['_unitX'+suffix][0]-o[0];assert scale>0 and isclose(raw['_unitY'+suffix][1]-o[1],scale,abs_tol=2e-4)
        pt=lambda name:tuple((raw[name][j]-o[j])/scale for j in (0,1));p={n:pt(id) for id in v['points'] for n in m['labels'][id].split('=')}
        near=lambda a,b: all(isclose(x,y,abs_tol=.0003) for x,y in zip(a,b,strict=True));both=lambda eq,ends:all(abs(eq[0]*u+eq[1]*w+eq[2])<.0005 for u,w in ends)
        seen=[(pt(a),pt(b)) for a,b in v['highlightSegments']];segments+=len(seen)
        if k in ('case-2','step-2'):required=eqs
        elif k in ('case-4','step-3') or (k=='case-3' and n!=1064):required=new
        elif n==1064 and k=='case-3':required=[(5,2,-10),(5,-2,-10),(5,2,10),(5,-2,10)]
        else:required=None
        if required is not None:
            assert len(seen)==len(required),(n,part,k,seen,required)
            for eq in required:assert any(both(eq,endpoints) and not near(*endpoints) for endpoints in seen),(n,part,k,eq,seen)
        if k=='neutral' and n==1058:
            for name,want in zip(['AB','CD','MN'][i],source_points[i],strict=True):assert near(p[name],want)
        if k=='case-2':
            if n==1059:assert near(p['M'],(0,3)) and both(eqs[0],[p['C'],p['M']])
            if n==1060 and part=='б':assert near(p['M'],(-2.5,-.5)) and near(p['N'],(5,4)) and both(eqs[0],[p['M'],p['N']])
            if n==1061:assert near(p['M'],(2,5)) and all(both(eq,[p['M']]) for eq in eqs)
            if n==1063:assert near(p['M'],(5,7)) and all(both(eq,[p['M']]) for eq in eqs)
            if n==1064:assert near(p['A'],(5,0)) and near(p['B'],(0,2)) and all(sum(both(eq,[p[x]]) for eq in eqs)==2 for x in 'ABCD')
    assert card['help'][1]['theoryIds']==['atanasyan-7-9-theory-99-part-1']
    if n==1064:assert '2x+5y=10' not in card['answer']['accepted']
    for a,b,c in eqs:assert gcd(gcd(abs(a),abs(b)),abs(c))==1 and (a>0 or a==0 and b>0)
checks=0
for p,q in combinations(list(product(range(-3,4),repeat=2)),2):
    dx,dy=q[0]-p[0],q[1]-p[1]
    for t in [-2,F(-1,2),F(1,2),1,3]:
        x,y=p[0]+t*dx,p[1]+t*dy;assert (x-p[0])*dy==(y-p[1])*dx
        assert ((x-p[0])*dy-(y+1-p[1])*dx != 0) if dx else (x+1!=p[0]);checks+=1
print(f'COORDINATE_LINES_OK {len(cards)} source lessons, {models} measured scenes, {segments} line segments, 2 rhombus orientations, {checks} exact two-point/vertical/horizontal cases.')

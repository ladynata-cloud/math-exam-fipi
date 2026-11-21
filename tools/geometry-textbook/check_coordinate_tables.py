"""Read the diagrams unsigned, restore point identities, and compare with each original column."""
import json
from itertools import product
from math import isclose
from coordinate_tables import ROOT

cards=json.loads((ROOT/'geometry-course/textbook/data/coordinate-tables.json').read_bytes())['lessons']
subparts=['а','б','в','г',None,None]
source_vectors=[((2,7),(-2,7)),((-5,1),(-5,27)),((-3,0),(0,4)),((0,3),(-4,0))]
column_vectors=[((0,0),(1,1)),((-3,-3),(2,-7)),((6,1.5),(3,1)),((-2,1),(1,3)),((1,2),(1,2)),((2,-4),(-1,2))]
column_midpoints=[((2,-3),(-3,1),(-.5,-1)),((-10,-11),(4,7),(-3,-2)),((0,1),(6,-11),(3,-5)),
    ((0,0),(-3,7),(-1.5,3.5)),((2,-1),(-4,5),(-1,2)),((3,5),(3,8),(3,6.5)),((5,7),(7,-7),(6,0)),((1,3),(-1,-3),(0,0)),((-4,1),(2,5),(-1,3))]
probes=[['-4','0'],['0','-10'],['3','4'],['-4','-2'],['1','-3','1,5','3','2','6'],['-0,5','-11','6','3,5','-4','6,5','2','-3','3']]
def close(a,b):return all(isclose(x,y,abs_tol=1e-6) for x,y in zip(a,b,strict=True))
def minus(a,b):return tuple(x-y for x,y in zip(a,b,strict=True))
views=arrows=0
for i,(c,part,expected_probes) in enumerate(zip(cards,subparts,probes,strict=True)):
    s=c['source'];n=int(s['exercise']);assert n==([1021]*4+[1022,1023])[i]
    assert s['bookId']=='atanasyan-2023-7-9' and s['printedPages']==[256] and s['pdfPages']==[257] and s['chapter']=='XI' and s.get('subpart')==part
    model=c['visualization']['model'];unit=5 if i==1 else 2 if n==1023 else 1
    assert [step['input']['accepted'][0] for step in c['steps'] if 'input' in step]==expected_probes
    if n==1021:
        a,b=source_vectors[i];answer=tuple(map(int,c['answer']['accepted'][0].split(';')));assert answer==minus(b,a)
    else:
        assert c['answer']['mode']=='manual';assert len(c['statement']['givens'])==(5 if n==1022 else 8)
    cases=[v['label'] for key,v in model['views'].items() if key.startswith('case-')]
    assert len(cases)==len(set(cases))
    for key,v in model['views'].items():
        views+=1;raw=model['points'];suffix='__v'+v['points'][0].split('__v')[-1];o=raw['O'+suffix];u=raw['_unitX'+suffix][0]-o[0]
        assert u>0 and isclose(raw['_unitY'+suffix][1]-o[1],u)
        def measured(k):return tuple((b-a)*unit/u for a,b in zip(o[:2],raw[k][:2],strict=True))
        pts={name:measured(k) for k in v['points'] for name in model['labels'][k].split('=')}
        assert 'A' in pts and 'B' in pts
        shafts=[(a,b) for a,b in v['highlightSegments'] if not b.startswith('head_')];assert len(v['highlightSegments'])==3*len(shafts);arrows+=len(shafts)
        if n==1023:
            assert not shafts and 'M' in pts and close(minus(pts['M'],pts['A']),minus(pts['B'],pts['M']))
        elif close(pts['A'],pts['B']):assert not shafts
        else:
            assert len(shafts)==1
            first,last=shafts[0];forward=close(measured(first),pts['A']) and close(measured(last),pts['B']);reverse=close(measured(first),pts['B']) and close(measured(last),pts['A'])
            assert reverse if n==1021 and key in ('case-2','step-3') else forward
        if key.startswith('case-'):
            j=int(key.split('-')[-1])-1
            if n==1023: required=dict(zip('ABM',column_midpoints[j],strict=True))
            elif n==1022:required=dict(zip('AB',column_vectors[j],strict=True))
            elif j<2:required=dict(zip('AB',source_vectors[i],strict=True))
            else:continue
            assert all(close(pts[k],q) for k,q in required.items()),(c['id'],key,pts,required)

count=0
for a,b,c,d in product(range(-3,4),repeat=4):
    # Symbolic columns 4 and 5 use different meanings for the letters a,b,c,d.
    end=(a+c,b+d);assert minus(end,(a,b))==(c,d)
    other=(2*a-c,2*b-d);assert (other[0]+c,other[1]+d)==(2*a,2*b);count+=1
for t in range(-100,101):
    first,last=(3*t+5,7),(t+7,-7);assert ((first[0]+last[0])/2,(first[1]+last[1])/2)==(2*t+6,0)
print(f'COORDINATE_TABLES_OK {len(cards)} original lessons, four 1021 subparts, 5+8 source table columns, {views} measured diagrams, {arrows} signed vector drawings, {count} general vector/midpoint cases, 201 parameter substitutions.')

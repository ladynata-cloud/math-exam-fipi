"""Source-order, physical arrowhead geometry, necessity/converse and degeneracy checks for §1."""
import json
from itertools import product
from math import dist, isclose
from pathlib import Path

root=Path(__file__).resolve().parents[2]
cards=json.loads((root/'geometry-course/textbook/data/vector-conclusions.json').read_text())['lessons']


def near(x,y):
    assert isclose(x,y,rel_tol=1e-8,abs_tol=1e-8),(x,y)


def sub(a,b):
    return tuple(x-y for x,y in zip(a,b))


def equal(a,b):
    return all(isclose(x,y,abs_tol=1e-8) for x,y in zip(a,b))


def cross(a,b):
    return a[0]*b[1]-a[1]*b[0]


def midpoint(a,b):
    return tuple((x+y)/2 for x,y in zip(a,b))


identities=[]
arrow_count=0
for card in cards:
    source=card['source']
    n=int(source['exercise'])
    part=source.get('subpart','')
    identities.append((n,part))
    assert source['bookId']=='atanasyan-2023-7-9' and source['chapter']=='X' and source['collection']=='main'
    assert source['printedPages']==[229] and source['pdfPages']==[230]
    assert len([s for s in card['steps'] if 'input' in s])==2
    assert len(card['steps'])==3
    m=card['visualization']['model'];coords=m['points']
    for view in m['views'].values():
        pairs=view['segments']
        heads=[(a,b) for a,b in pairs if b.startswith('head_') and b.endswith('_l')]
        shafts=[(a,b) for a,b in pairs if not b.startswith('head_')][-len(heads):] if heads else []
        for (tip,left),(base,end) in zip(heads,shafts,strict=True):
            assert end==tip
            right=left[:-1]+'r'
            assert [tip,right] in pairs and left not in view['points'] and right not in view['points']
            u=sub(coords[tip],coords[base]);v=sub(coords[left],coords[tip]);w=sub(coords[right],coords[tip])
            d=lambda a,b:a[0]*b[0]+a[1]*b[1]
            near(d(u,v),d(u,w));near(cross(u,v),-cross(u,w))
            assert d(u,v)<0 and abs(cross(u,v))>1e-8
            arrow_count+=1
    def point(k,i):return coords[f'{k}__v{i}'][:2]
    def vector(pair,i):return sub(point(pair[1],i),point(pair[0],i))
    def length(pair,i):return dist(point(pair[0],i),point(pair[1],i))
    if n==937:
        x,y={'а':('NL','KL'),'б':('MS','SN'),'в':('MN','KL'),'г':('TS','KM'),'д':('TL','KT')}[part]
        for i in range(6):
            assert equal(point('S',i),midpoint(point('M',i),point('N',i)))
            assert equal(point('T',i),midpoint(point('L',i),point('K',i)))
            near(length('MN',i),length('KL',i))
            assert equal(vector(x,i),vector(y,i))==(part in 'бд')
            near(length('TS',i),(length('NL',i)+length('KM',i))/2)
        assert length('KM',4)>length('NL',4) and length('KM',5)<length('NL',5)
    elif n==938:
        for i in range(6):
            assert equal(vector('AB',i),vector('CD',i))
            center=midpoint(point('A',i),point('D',i))
            assert equal(center,midpoint(point('B',i),point('C',i)))
            if i:assert equal(point('O',i),center)
        assert abs(cross(vector('AB',4),vector('AC',4)))>1
        near(cross(vector('AB',5),vector('AC',5)),0)
    elif n==939 and part=='а':
        for i in range(6):
            near(length('AB',i),length('BC',i));near(length('AB',i),length('CD',i))
            unit=length('AB',i)/5
            wanted=89 if i in [0,1,4] else 25
            near((length('DA',i)/unit)**2,wanted)
            assert equal(vector('AB',i),vector('DC',i))==(wanted==25)
            slopes=[vector(side,i) for side in ['AB','BC','CD','DA']]
            assert all(cross(a,b)>0 for a,b in zip(slopes,slopes[1:]+slopes[:1]))
        assert 'без стрелок' in card['statement']['text']
    elif n==939:
        for i in range(4):
            near(cross(vector('AB',i),vector('DC',i)),0)
            assert vector('AB',i)[0]*vector('DC',i)[0]>0
            assert abs(cross(vector('AD',i),vector('BC',i)))>1
    elif part in 'абвг':
        expected={'а':[True]*4,'б':[True]*4,'в':[True,True,False,True],'г':[False,False,False,True]}[part]
        for i,wanted in enumerate(expected):
            a,b=vector('AB',i),vector('CD',i)
            assert equal(a,b)==wanted
            near(cross(a,b),0)
            assert (a[0]*b[0]<0)==(part=='в' and i==2)
    else:
        assert m['views']['step-1']['segments']==[] and len(m['views']['step-1']['points'])==1
        assert m['views']['step-3']['segments']==[] and len(m['views']['step-3']['points'])==2
        assert length('CD',2)>0

assert identities==[(937,p) for p in 'абвгд']+[(938,'')]+[(939,p) for p in 'аб']+[(940,p) for p in 'абвгд']
# Verify the two logical implications even for collinear points, duplicate points,
# an arbitrary fourth point, and equal zero vectors. Both outcomes must occur.
cases=list(product(range(3),repeat=2))
truth_values={True:0,False:0}
for a,b,c,d in product(cases,repeat=4):
    condition=sub(b,a)==sub(d,c)
    assert condition==(midpoint(a,d)==midpoint(b,c))
    truth_values[condition]+=1
assert min(truth_values.values())>0
print(f'VECTOR_SECTION_1_COMPLETE: {len(cards)} source cards, {arrow_count} measured arrows and {sum(truth_values.values())} midpoint equivalences.')

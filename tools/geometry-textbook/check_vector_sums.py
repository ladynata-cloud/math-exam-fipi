"""Read the rendered geometry, in units UV, independently of the exercise generator."""
from itertools import combinations, product
from math import isclose
from pathlib import Path
import json

cards=json.loads((Path(__file__).resolve().parents[2]/'geometry-course/textbook/data/vector-sums.json').read_text())['lessons']


def near(a,b):
    return isclose(a,b,rel_tol=1e-8,abs_tol=1e-7)


def equal(a,b):
    return all(near(x,y) for x,y in zip(a,b,strict=True))


def delta(a,b):
    return tuple(y-x for x,y in zip(a,b,strict=True))


def cross(a,b):return a[0]*b[1]-a[1]*b[0]


counts={'arrows':0,'cases':0}
identities=[]
for card in cards:
    source=card['source'];k='point' if card['kind']=='theory' else 'exercise'
    n=int(source[k]);part=source.get('subpart','')
    identities.append((n,part))
    assert source['chapter']=='X' and source['bookId']=='atanasyan-2023-7-9'
    assert source['printedPages']=={87:[230,231],88:[231,232],89:[232,233],90:[233,234]}.get(n,[235])
    assert source['pdfPages']==[p+1 for p in source['printedPages']]
    assert len([s for s in card['steps'] if s.get('input')])==2
    model=card['visualization']['model'];raw=model['points'];views=model['views']
    def members(name):
        view=views[name];i=view['points'][0].split('__v')[-1]
        p={n.split('__v')[0]:raw[n][:2] for n in view['points']}
        unit=p['V'][0]-p['U'][0];assert unit>0 and near(p['V'][1],p['U'][1])
        def arrow(pair):return tuple(v/unit for v in delta(p[pair[0]],p[pair[1]]))
        heads=[(a,b) for a,b in view['segments'] if b.startswith('head_') and b.endswith('_l')]
        shafts=[(a,b) for a,b in view['segments'] if not b.startswith('head_')][-len(heads):] if heads else []
        for (tip,left),(start,end) in zip(heads,shafts,strict=True):
            assert tip==end and [tip,left[:-1]+'r'] in view['segments']
            u=delta(raw[start][:2],raw[tip][:2]);v=delta(raw[tip][:2],raw[left][:2]);w=delta(raw[tip][:2],raw[left[:-1]+'r'][:2])
            assert near(cross(u,v),-cross(u,w)) and abs(cross(u,v))>1e-8
            assert u[0]*v[0]+u[1]*v[1]<0
        return p,arrow,[(a.split('__v')[0],b.split('__v')[0]) for a,b in shafts]
    def want_arrow(name,pair,xy):
        _,measurement,segments=members(name)
        assert tuple(pair) in segments,(n,name,pair,segments)
        assert equal(measurement(pair),xy),(n,name,pair,measurement(pair),xy)
    def resultant(name,xy,start='P'):
        p,measurement,segments=members(name)
        if xy!=(0,0):
            assert any(a==start and equal(measurement((a,b)),xy) for a,b in segments),(n,name,xy,segments)
        else:
            # Every displayed arrow is a real non-zero leg. Their ordered sum closes.
            assert segments and segments[0][0]==start and segments[-1][1]==start
            assert all(segments[j][1]==segments[j+1][0] for j in range(len(segments)-1))
            for dim in (0,1):assert near(sum(measurement(pair)[dim] for pair in segments),0)
    for name in views:
        counts['arrows']+=len(members(name)[2])
        if name.startswith('case-'):counts['cases']+=1
    if n==87:
        for pair in ['AB','PQ']:want_arrow('step-2',pair,(3,0))
        for pair in ['BC','QR']:want_arrow('step-2',pair,(1,2))
        for pair in ['AC','PR']:want_arrow('step-2',pair,(4,2))
        resultant('case-1',(5,0),'A');resultant('case-2',(0,0),'A')
    elif n==88:
        for no in [1,2]:
            want_arrow('case-'+str(no),'OC',(4,2))
        for no in [3,4]:
            want_arrow('case-'+str(no),'OD',(3,4))
        want_arrow('case-3','OC',(4,2));want_arrow('case-4','AD',(0,4))
    elif n==89:
        resultant('case-1',(1,2));resultant('case-2',(0,0))
    elif n==90:
        want_arrow('case-1','BA',(3,-2));want_arrow('case-2','AB',(-3,2));resultant('case-3',(0,0))
    elif n==941:
        want_arrow('step-2','AB',(2,0));want_arrow('step-2','BC',(3,0))
        resultant('case-1',(5,0),'A');resultant('case-2',(-1,0),'A')
    elif n==942 or n==944:
        p,measure,_=members('neutral')
        vectors=[measure(('O',s)) for s in 'XYZ']
        assert all(abs(cross(a,b))>1e-6 for a,b in combinations(vectors,2))
        targets=[(3,2),(2,1),(-1,3)] if n==942 else [(3,-2),(-1,-1),(4,-1),(-3,0),(0,-2),(1,-1)]
        for i,xy in enumerate(targets,1):resultant('case-'+str(i),xy)
    elif n==943:
        _,measure,_=members('neutral')
        vectors=[measure(('O',s)) for s in 'ABCDE']
        assert all(abs(cross(a,b))>1e-6 for a,b in combinations(vectors,2))
        for pair,v in zip(['PQ','QR','RS','ST','TW'],vectors,strict=True):want_arrow('step-2',pair,v)
        resultant('case-1',(5,0));resultant('case-2',(0,0))
    elif n==945:
        for i,x in enumerate((6,5,1,-2,0),1):resultant('case-'+str(i),(x,0))
    elif n==946:
        assert len([name for name in views if name.startswith('case-')])==6
        for i,(a,b) in enumerate([(5,2),(5,-2),(2,5),(2,-5),(5,5),(5,-5)],1):
            x=a-b if part=='а' else b-a
            resultant('case-'+str(i),(x,0))

assert identities==[(n,'') for n in (87,88,89,90,941,942,943,944,945)]+[(946,c) for c in 'абв']
# Independent vector identities include zero inputs and opposite collinear vectors.
coords=list(product(range(-2,3),repeat=2))
for a,b,c in product(coords,repeat=3):
    add=lambda x,y:tuple(i+j for i,j in zip(x,y))
    minus=lambda x,y:tuple(i-j for i,j in zip(x,y))
    assert add(a,b)==add(b,a)
    assert add(add(a,b),c)==add(a,add(b,c))
    assert add(b,minus(a,b))==a
print(f'VECTOR_SUMS_PRACTICE_OK {len(cards)} cards, {counts["arrows"]} arrows, {counts["cases"]} selectable cases, {len(coords)**3} triples.')

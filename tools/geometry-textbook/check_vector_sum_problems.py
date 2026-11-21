"""Independent source subpart and model checks for exercises 947–952, including all signs."""
from itertools import combinations, product
from math import hypot, isclose
from pathlib import Path
import json

root=Path(__file__).resolve().parents[2]
cards=json.loads((root/'geometry-course/textbook/data/vector-sum-problems.json').read_text())['lessons']
identities=[]
measured=0


def close(a,b):return isclose(a,b,rel_tol=1e-8,abs_tol=1e-7)


def vec(a,b):return tuple(y-x for x,y in zip(a,b))


def plus(a,b):return tuple(x+y for x,y in zip(a,b))


def eq(a,b):return all(close(x,y) for x,y in zip(a,b))


def determinant(a,b):return a[0]*b[1]-a[1]*b[0]


for card in cards:
    s=card['source'];n=int(s['exercise']);part=s.get('subpart','')
    identities.append((n,part))
    assert s['printedPages']==[235] and s['pdfPages']==[236] and s['bookId']=='atanasyan-2023-7-9' and s['chapter']=='X'
    assert sum('input' in step for step in card['steps'])==2
    m=card['visualization']['model'];data=m['points']
    def inspect(name):
        view=m['views'][name]
        p={key.split('__v')[0]:data[key][:2] for key in view['points']}
        unit=vec(p['U'],p['V'])
        assert unit[0]>0 and close(unit[1],0)
        aim=lambda pair:tuple(c/unit[0] for c in vec(p[pair[0]],p[pair[1]]))
        heads=[(a,b) for a,b in view['segments'] if b.startswith('head_') and b.endswith('_l')]
        shafts=[(a,b) for a,b in view['segments'] if not b.startswith('head_')][-len(heads):] if heads else []
        for (tip,left),(start,end) in zip(heads,shafts,strict=True):
            right=left[:-1]+'r'
            assert tip==end and [tip,right] in view['segments']
            u=vec(data[start][:2],data[tip][:2]);v=vec(data[tip][:2],data[left][:2]);w=vec(data[tip][:2],data[right][:2])
            assert close(determinant(u,v),-determinant(u,w)) and abs(determinant(u,v))>1e-7
            assert u[0]*v[0]+u[1]*v[1]<0
        return p,aim,[(a.split('__v')[0],b.split('__v')[0]) for a,b in shafts]
    def present(name,pair):
        p,v,shafts=inspect(name)
        assert tuple(pair) in shafts,(n,part,name,pair,shafts)
        return v(pair)
    for name in m['views']:measured+=len(inspect(name)[2])
    if n==947:
        a,b,v=('N','P','Q') if part=='а' else ('N','Q','P')
        for j,via in enumerate((a,b,b),1):
            name=f'case-{j}'
            x,y=present(name,'M'+via),present(name,via+v)
            assert eq(plus(x,y),present(name,'M'+v))
        p,_,_=inspect('case-3')
        turns=[determinant(vec(p[a],p[b]),vec(p[b],p[c])) for a,b,c in ['MNP','NPQ','PQM','QMN']]
        assert min(turns)<0<max(turns)
    elif n==948:
        x,y=present('case-1','AB'),present('case-1','BC');q=present('case-1','AC')
        assert abs(determinant(x,y))>0 and close(hypot(*q),5) and close(hypot(*x)+hypot(*y),7)
        assert eq(present('case-2','AC'),(7,0))
    elif n==949:
        for name in ['case-1','case-2','case-3']:
            p,v,chain=inspect(name);assert chain[0][0]==chain[-1][1]=='A'
            assert all(a[1]==b[0] for a,b in zip(chain,chain[1:]))
            total=(0,0)
            for edge in chain:total=plus(total,v(edge))
            assert eq(total,(0,0))
        assert len(inspect('case-3')[2])==3
    elif n==950:
        _,v,_=inspect('neutral')
        assert close(hypot(*v('AB')),2) and close(hypot(*v('BC')),2) and close(hypot(*v('CA')),2)
        if part in 'бв':
            vresult=present('case-1','AT' if part=='б' else 'TB')
            assert close(hypot(*vresult)**2,12)
        else:
            vresult=present('case-1',{'а':'AC','г':'CA','д':'CB'}[part])
        chain=present('case-2','PR')
        assert eq(vresult,chain)
        assert close(hypot(*chain)**2,12 if part in 'бв' else 4)
    elif n==951:
        first,second,sign={'а':('BA','BC',-1),'б':('AB','BC',1),'в':('BA','BC',1),'г':('AB','BC',-1)}[part]
        _,v,_=inspect('neutral')
        a,b=v(first),v(second)
        assert close(a[0]*b[0]+a[1]*b[1],0)
        assert close(hypot(*a)+sign*hypot(*b),-2 if part in 'аг' else 14)
        total=present('case-2','PR')
        assert eq(total,plus(a,tuple(sign*x for x in b))) and close(hypot(*total),10)
    elif n==952:
        _,v,_=inspect('case-3')
        first=present('case-1','AB' if part=='а' else 'AC')
        def chain_sum(name):
            _,v,pairs=inspect(name);total=(0,0)
            for pair in pairs:total=plus(total,v(pair))
            return total
        a,b=chain_sum('case-1'),chain_sum('case-2')
        if part=='б':b=tuple(-x for x in b)
        assert eq(plus(a,b),present('case-3','AK' if part=='а' else 'AM'))

assert identities==[(947,x) for x in 'аб']+[(948,''),(949,'')]+[(950,x) for x in 'абвгд']+[(951,x) for x in 'абвг']+[(952,x) for x in 'аб']
vectors=list(product(range(-3,4),repeat=2));noncollinear=0
for x,y in product(vectors,repeat=2):
    if determinant(x,y):
        assert hypot(*plus(x,y))<hypot(*x)+hypot(*y)
        noncollinear+=1
print(f'VECTOR_PROBLEMS_OK {len(cards)} cards, {measured} physical arrows, {noncollinear} strict triangle inequalities.')

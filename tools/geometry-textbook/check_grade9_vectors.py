"""Independent measurements and source identities for the introductory vector unit."""
from math import dist,isclose
from pathlib import Path
import json

root=Path(__file__).resolve().parents[2]
cards=json.loads((root/'geometry-course/textbook/data/grade9-vectors.json').read_text())['lessons']
expected=[('theory',84,''),('theory',85,''),('theory',86,''),('main',926,''),('main',927,''),
          ('main',928,'а'),('main',928,'б')]+[('main',929,s) for s in 'абвг']+[('main',930,s) for s in 'абв']+[('main',n,'') for n in (931,932,933,934)]+[('main',935,s) for s in 'абв']+[('main',936,s) for s in 'абвг']
identities=[]
heads=0


def near(a,b):
    assert isclose(a,b,rel_tol=1e-8,abs_tol=1e-7),(a,b)


def delta(a,b):
    return (b[0]-a[0],b[1]-a[1])


for card in cards:
    src=card['source'];collection=src['collection'];n=int(src.get('point',src.get('exercise')))
    part=src.get('subpart','');identities.append((collection,n,part))
    assert src['chapter']=='X' and src['bookId']=='atanasyan-2023-7-9'
    assert src['printedPages']=={84:[224,225],85:[226,227],86:[227,228]}.get(n,[229] if n>=930 else [228])
    assert src['pdfPages']==[p+1 for p in src['printedPages']]
    assert len([s for s in card['steps'] if s.get('input')])==2
    m=card['visualization']['model'];points=m['points']
    for name,view in m['views'].items():
        pairs=view['segments']
        left_heads=[(a,b) for a,b in pairs if b.startswith('head_') and b.endswith('_l')]
        shafts=[(a,b) for a,b in pairs if not b.startswith('head_')][-len(left_heads):] if left_heads else []
        for (tip,left),(shaft,shaft_tip) in zip(left_heads,shafts):
            right=left[:-1]+'r'
            assert [tip,right] in pairs and left not in view['points'] and right not in view['points']
            assert shaft_tip==tip
            u=delta(points[shaft],points[tip]);v=delta(points[tip],points[left]);w=delta(points[tip],points[right])
            near(v[0]*u[0]+v[1]*u[1],w[0]*u[0]+w[1]*u[1])
            near(v[0]*u[1]-v[1]*u[0],-(w[0]*u[1]-w[1]*u[0]))
            assert v[0]*u[0]+v[1]*u[1]<0
            assert abs(v[0]*u[1]-v[1]*u[0])>0
            heads+=1
    def point(k,i=3):return points[k+f'__v{i}'][:2]
    def vector(a,b,i=3):return delta(point(a,i),point(b,i))
    def length(a,b,i=3):return dist(point(a,i),point(b,i))
    if n==84:
        assert vector('C','D')[0]>0 and vector('C','D')[1]==0
    elif n==85:
        for x,y in zip(vector('A','B'),vector('C','D')):near(x,y)
        for x,y in zip(vector('E','F',2),vector('A','B',2)):near(x,-y)
    elif n==86:
        for x,y in zip(vector('A','B',2),vector('M','N',2)):near(x,y)
        for x,y in zip(vector('A','B'),vector('K','L')):near(x,y)
    elif n==926:
        arrows=[]
        for j,start in enumerate('ABC',1):
            v=m['views'][f'case-{j}']
            for a,b in v['segments']:
                if not b.startswith('head_'):
                    aa,bb=a.split('__')[0],b.split('__')[0]
                    assert aa==start;arrows.append(aa+bb)
        assert sorted(arrows)==sorted(['AB','AC','BA','BC','CA','CB'])
    elif n==927:
        ab=vector('A','B');bc=vector('B','C');ac=vector('A','C')
        near(ab[0],0);near(bc[1],0);assert ab[1]<0<bc[0]
        near(length('A','B')/length('B','C'),3/5)
        near(ac[0],ab[0]+bc[0]);near(ac[1],ab[1]+bc[1])
    elif n==928:
        lengths=[length(*pair) for pair in ['AB','CD','EF']]
        stated=[1,2.5,4.5] if part=='а' else [3,1.5,1]
        for measured,given in zip(lengths,stated):near(measured/lengths[0],given/stated[0])
        ab,cd,ef=[vector(*pair) for pair in ['AB','CD','EF']]
        near(ab[0]*ef[1]-ab[1]*ef[0],0)
        if part=='а':near(ab[0]*cd[1]-ab[1]*cd[0],0)
        else:assert abs(ab[0]*cd[1]-ab[1]*cd[0])>1
    elif n==929:
        src=vector('A','B') if part in 'аг' else vector('C','D')
        for pair in ['PM','QN']:
            v=vector(*pair)
            near(src[0]*v[1]-src[1]*v[0],0)
            assert (src[0]*v[0]+src[1]*v[1]>0)==(part in 'аб')

    elif n==930:
        a,b=vector('A','B'),vector('C','D')
        near(length('A','B'),length('C','D'))
        determinant=a[0]*b[1]-a[1]*b[0]
        if part=='а':
            assert abs(determinant)>1
        else:
            near(determinant,0)
            assert (a[0]*b[0]+a[1]*b[1]>0)==(part=='б')
    elif n==931:
        base=vector('P','Q')
        assert base[0]>0 and base[1]>0
        near(base[0]/base[1],2)
        for start,end in ('AD','BE','CF'):
            for x,y in zip(vector(start,end),base): near(x,y)
    elif n==932:
        a,b,f=vector('A','B'),vector('C','D'),vector('P','Q')
        for x,y in zip(a,b):near(x,-y)
        assert a[0]>0 and f[1]>0
        near(a[1],0);near(f[0],0)
    elif n==933:
        relations=['AB','BC','DC','MC','MA','CB','AC']
        expected_lengths=[3,4,3,73**.5/2,1.5,4,5]
        assert {f'case-{i}' for i in range(1,8)} <= set(m['views'])
        for j,(pair,size) in enumerate(zip(relations,expected_lengths),1):
            view_index=3+j
            view=m['views'][f'case-{j}']
            start,end=pair
            assert [f'{start}__v{view_index}',f'{end}__v{view_index}'] in view['segments']
            # The scene independently rescales each frame; infer that frame's unit from AB.
            near(length(start,end,view_index)/length('A','B',view_index),size/3)
            for x,y,t in zip(point('A',view_index),point('B',view_index),point('M',view_index)):near((x+y)/2,t)
        near(3**2+4**2,5**2)
        near((3/2)**2+4**2,73/4)

    elif n==934:
        unit=length('A','D')/12
        for ab,want in [('AB',5),('DH',5),('AH',7),('CH',5),('BD',13),('CD',50**.5),('AC',74**.5)]:
            near(length(*ab)/unit,want)
        near(vector('A','D')[1],0);near(vector('C','H')[0],0)
        assert len(m['views']['step-1']['rightAngles'])==2
        near(9**2+6**2,117)
    elif n==935:
        from itertools import combinations
        vertices={'а':'MNPQ','б':'ABCD','в':'FGH'}[part]
        arrow_pairs=[]
        for a,b in zip(vertices,vertices[1:]+vertices[0]):
            arrow_pairs.extend([(a,b),(b,a)])
        same=[];opposite=[]
        for (a,b),(c,d) in combinations(arrow_pairs,2):
            u,v=vector(a,b),vector(c,d)
            if abs(u[0]*v[1]-u[1]*v[0])<1e-6:
                target=same if u[0]*v[0]+u[1]*v[1]>0 else opposite
                target.append((a+'→'+b,c+'→'+d))
        assert (len(same),len(opposite))=={'а':(4,8),'б':(2,6),'в':(0,3)}[part]
        result=card['help'][-1]['text']
        for a,b in same+opposite:assert a+' и '+b in result or b+' и '+a in result
        assert len([view for view in m['views'] if view.startswith('case-')])==len(vertices)
    elif n==936:
        x,y={'а':('AB','DC'),'б':('BC','DA'),'в':('AO','OC'),'г':('AC','BD')}[part]
        u,v=vector(*x),vector(*y)
        assert all(isclose(a,b,rel_tol=1e-8,abs_tol=1e-7) for a,b in zip(u,v))==(part in 'ав')
        if part=='б':
            for a,b in zip(u,v):near(a,-b)
        if part=='г':assert abs(u[0]*v[1]-u[1]*v[0])>1
        for a,b in [('A','C'),('B','D')]:
            for i,j,k in zip(point(a),point(b),point('O')):near((i+j)/2,k)

assert identities==expected and heads>0
print('GRADE9_NUMBERED_VECTORS_OK',len(cards),'карточек. Проверено стрелок',heads)

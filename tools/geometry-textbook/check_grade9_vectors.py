"""Independent measurements and source identities for the introductory vector unit."""
from math import dist,isclose
from pathlib import Path
import json

root=Path(__file__).resolve().parents[2]
cards=json.loads((root/'geometry-course/textbook/data/grade9-vectors.json').read_text())['lessons']
expected=[('theory',84,''),('theory',85,''),('theory',86,''),('main',926,''),('main',927,''),
          ('main',928,'а'),('main',928,'б')]+[('main',929,s) for s in 'абвг']
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
    assert src['printedPages']=={84:[224,225],85:[226,227],86:[227,228]}.get(n,[228])
    assert src['pdfPages']==[p+1 for p in src['printedPages']]
    assert len([s for s in card['steps'] if s.get('input')])==2
    m=card['visualization']['model'];points=m['points']
    for name,view in m['views'].items():
        pairs=view['segments']
        for tip,left in [(a,b) for a,b in pairs if b.startswith('head_') and b.endswith('_l')]:
            right=left[:-1]+'r'
            assert [tip,right] in pairs and left not in view['points'] and right not in view['points']
            shaft=next((a for a,b in reversed(pairs) if b==tip and not a.startswith('head_')),None)
            assert shaft
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

assert identities==expected and heads>0
print('GRADE9_NUMBERED_VECTORS_OK',len(cards),'карточек. Проверено стрелок',heads)

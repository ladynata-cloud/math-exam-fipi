"""Check every review question against the printed numbering, the drawn coordinates and new answers."""
import json
from fractions import Fraction
from itertools import product
from math import dist, hypot, isclose
from coordinate_chapter_review import OUT

cards=json.loads(OUT.read_bytes())['lessons']
answers=[(-2,3),(2,-1),(3,-2),(-3,-4),(1,-2),(-2,-1),(2,-2),(-1,-7),(-4,3),(-3,-5),(4,-1),(25,13),(5,100),(15,43),(5,-2),(9,5),(5,25),(1,3),(-2,3),(0,-1),(3,4),(0,1),(2,1),(8,-1)]
close=lambda a,b:isclose(a,b,abs_tol=.0005)
near=lambda a,b:all(close(k,v) for k,v in zip(a,b,strict=True))
minus=lambda a,b:(a[0]-b[0],a[1]-b[1])
times=lambda k,a:(k*a[0],k*a[1])
dot=lambda a,b:a[0]*b[0]+a[1]*b[1]
scenes=circles=lines=0

def validate_vectors(n,k,p):
    if n==1: assert near(p['V'],times(3 if k==3 else -2,p['U']))
    if n==2: assert near(p['W'],(3,-2) if k==3 else (3,2))
    if n==3: assert near(p['W'],(-3,1) if k==3 else (5,3))
    if n==4: assert near(p['B'],(2,-4)) if k==3 else near(p['A'],(-3,2))
    if n==5: assert near(p['W'],(3,-2)) if k==3 else near(p['I'],(1,0))
    if n==6: assert near(p['V'],(4,-1)) if k==3 else near(p['U'],(-2,3))
    if n==7:
        if k==1:assert close(dot(p['I'],p['J']),0)
        else:assert near(minus(p['B'],p['A']),minus(p['D'],p['C']))
    if n==8: assert near(p['W'],[(2,3),(4,-1),(3,-7)][k-1])
    if n==9:
        if k==3:assert near(p['B'],(2,-3))
        else:assert near(p['A'],(-4,3))
        if k==2:assert near(p['A'],minus(p['Q'],p['P']))
    if n==10:assert near(minus(p['B'],p['A']),(-5,5) if k==3 else (5,-3))
    if n==11:assert near(minus(p['M'],p['A']),minus(p['B'],p['M']))
    if n==12:assert close(hypot(*p[['U','V','W'][k-1]]),[5,4,13][k-1])
    if n==13:assert close(dist(p['A'],p['B']),10 if k==3 else 5)
    if n==14:
        expected=43 if k==3 else 15;m=p['M']
        assert close(dist(m,p['B'])**2+dist(m,p['D'])**2,expected)
        assert close(hypot(*m)**2+dist(m,p['C'])**2,expected)


def test_figure(n,k,p,drawn,straight):
    if n==15:
        if k==3:assert close(p['A'][0],-2) and not close(p['C'][0],-2)
        else:
            for name in ('A','B') if k==1 else ('P','U','V'):assert close(p[name][1]-p[name][0],1)
            if k==1:assert not close(p['C'][1]-p['C'][0],1)
    if n in (16,17):
        center,r=drawn[0]
        expected=(5 if k==3 else 3) if n==16 else (5 if k==3 else 5**.5)
        assert close(r,expected)
        for name in ('P','Q','T'):
            if name in p:assert close(dist(p[name],center),r)
        if 'H' in p:assert dist(p['H'],center)<r
    if n==18:
        for a,b in straight:
            for x,y in (a,b):
                assert close(dist((x,y),p['A']),dist((x,y),p['B']))
    if n==19:
        slopes=[]
        for a,b in straight:
            dx,dy=minus(a,b);slopes.append(None if close(dx,0) else dy/dx)
        assert any(close(v,.5 if k==3 else -2) for v in slopes if v is not None)
        if k==3:assert None in slopes
    if n==20:
        coeffs=[(a[1]-b[1])/(a[0]-b[0]) for a,b in straight];assert len(coeffs)==2
        assert close(*coeffs)==(k!=2)
        if k!=2:assert not close(*(a[1]-v*a[0] for (a,b),v in zip(straight,coeffs,strict=True)))
    if n==21 or n==22:
        for a,b in straight:
            vertical=close(a[0],b[0]);assert vertical or close(a[1],b[1])
            value=a[0] if vertical else a[1]
            assert close(value,0 if n==22 else (4 if k==3 else -2) if vertical else (-1 if k==3 else 3))
    if n==23:
        (a,r),(b,s)=drawn;d=dist(a,b)
        if close(d,0) and close(r,s):number=float('inf')
        elif d>r+s+.0005 or d<abs(r-s)-.0005:number=0
        elif close(d,r+s) or close(d,abs(r-s)):number=1
        else:number=2
        assert number==[0,1,2,1,0,0,float('inf'),1][k-1]
        for name in ('P','A','B'):
            if name in p:assert close(dist(p[name],a),r) and close(dist(p[name],b),s)
    if n==24:
        if k==1:
            assert close(dist(p['A'],p['B']),8)
            assert all(close(dist(p[name],drawn[0][0]),drawn[0][1]) for name in ('A','B'))
        if k==2:
            for a,b in straight:
                for coord in (a,b):assert close(dist(coord,p['A']),dist(coord,p['B']))
        if k==3:assert close(dist(drawn[0][0],p['P']),drawn[0][1]) and near(p['P'],(3,-1))

assert len(cards)==24
for n,(card,expected) in enumerate(zip(cards,answers,strict=True),1):
    src=card['source'];page=267 if n<=4 else 268
    assert (src['bookId'],src['collection'],src['chapter'],src['exercise'],src['printedPages'],src['pdfPages'])==('atanasyan-2023-7-9','selfcheck','XI',str(n),[page],[page+1])
    assert card['id']==f'atanasyan-7-9-selfcheck-chapter-11-{n}-part-1' and card['title'].startswith(f'Вопрос {n}.')
    assert card['status']=='reviewed' and card['answer']['mode']=='manual'
    assert [s['input']['accepted'] for s in card['steps'] if 'input' in s]==[[str(v)] for v in expected]
    assert all(s['input']['feedback'] for s in card['steps'] if 'input' in s)
    assert len(card['help'])==3 and len(card['steps'])==3 and card['help'][1]['theoryIds']
    model=card['visualization']['model'];raw=model['points']
    for key,v in model['views'].items():
        scenes+=1
        suffix='__v'+v['points'][0].split('__v')[-1];o=raw['O'+suffix]
        unit=raw['_unitX'+suffix][0]-o[0]
        assert unit>0 and close(raw['_unitY'+suffix][1]-o[1],unit)
        get=lambda name:tuple((raw[name][j]-o[j])/unit for j in (0,1))
        vertices={label:get(name) for name in v['points'] for label in model['labels'][name].split('=')}
        drawn=[(get(c['center']),dist(get(c['center']),get(c['through']))) for c in v.get('circles',[])]
        straight=[(get(a),get(b)) for a,b in v.get('highlightSegments',[])];circles+=len(drawn)
        if n>=15:lines+=len(straight)
        if key.startswith('case-'):k=int(key[5:])
        elif n==23:k={'base':3,'main':3,'step-1':3,'step-2':4,'step-3':8}.get(key,3)
        else:k={'step-2':2,'step-3':3}.get(key,1)
        if n<15:validate_vectors(n,k,vertices)
        else:test_figure(n,k,vertices,drawn,straight)

substitutions=0
for a,b,x,y in product(range(1,6),range(1,6),range(-7,8),range(-7,8)):
    A=(-a,0);B=(a,2*b);q=lambda p:(x-p[0])**2+(y-p[1])**2
    assert (q(A)==q(B))==(a*x+b*y-b*b==0)
    assert q((0,0))+q((a,b))==q((a,0))+q((0,b))
    assert (Fraction(x+a,2)-x)==-(Fraction(x+a,2)-a)
    substitutions+=3
print(f'COORDINATE_CHAPTER_REVIEW_OK {len(cards)} source questions, {scenes} measured diagrams, {circles} circles, {lines} straight lines, {substitutions} exact general substitutions.')

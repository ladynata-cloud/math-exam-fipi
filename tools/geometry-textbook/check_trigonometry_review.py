"""Trace the actual semicircle, reflected point, unit radius and scaled ray in every review view."""
import json
from math import acos, cos, degrees, hypot, isclose, radians, sin, sqrt
from trigonometry_review import OUT

def near(a,b):
    return isclose(a,b,abs_tol=.0006)

data=json.loads(OUT.read_bytes())['lessons']
assert len(data)==7
scenes=edges=0
pairs=[(2,1),(-1,-1),(90,-1),(2,0),(16,12),(1,0),(-2,3)]
for n,c in enumerate(data,1):
    assert c['id']==f'atanasyan-7-9-selfcheck-chapter-12-{n}-part-1'
    src=c['source'];assert src['printedPages']==[290] and src['pdfPages']==[291] and src['chapter']=='XII' and src['collection']=='selfcheck' and src['exercise']==str(n)
    assert c['answer']['mode']=='manual' and c['help'][1]['theoryIds']
    assert [int(s['input']['accepted'][0]) for s in c['steps'] if 'input'in s]==list(pairs[n-1])
    m=c['visualization']['model'];p=m['points']
    for key,v in m['views'].items():
        suffix='__v'+v['points'][0].split('__v')[1];o=p['O'+suffix];unit=p['_unitX'+suffix][0]-o[0]
        assert near(p['_unitY'+suffix][1]-o[1],unit) and unit>0
        def coord(k):return tuple((p[k][j]-o[j])/unit/(1 if n==7 else 4) for j in (0,1))
        pts={alias:coord(q) for q in v['points'] for alias in m['labels'][q].split('=')}
        radius=v['highlightSegments'][:36];assert len(radius)==36
        for i,(a,b) in enumerate(radius):
            for j,q in enumerate((a,b)):
                x,y=coord(q);phi=radians((i+j)*5)
                assert near(x,cos(phi)) and near(y,sin(phi)) and near(hypot(x,y),1)
            edges+=1
        which=2 if key in ('case-3','step-3') else 1 if key in ('case-2','step-2') else 0
        if 'M' in pts:
            angle={1:[None,60,135],2:[30,150,None],3:[45,None,135],4:[45,None,None],
                   5:[degrees(acos(.6)),180-degrees(acos(.6)),degrees(acos(5/13))],
                   6:[30,30,45],7:[60,120,150]}[n][which]
            assert angle is not None
            for val,fn in zip(pts['M'],(cos,sin)):assert near(val,fn(radians(angle)))
        if n==6:
            x,y=pts['M'];u,w=pts['N']
            assert near(u,y) and near(w,x) if which==0 else near(u,-x) and near(w,y)
        if n==7:
            r=[4,4,6][which]
            assert near(hypot(*pts['A']),r) and all(near(a,r*b) for a,b in zip(pts['A'],pts['M']))
        scenes+=1
trials=0
for i in range(1801):
    angle=radians(i/10);x,y=cos(angle),sin(angle)
    assert near(x*x+y*y,1) and near(sin(radians(180)-angle),y) and near(cos(radians(180)-angle),-x)
    if i<=900:assert near(sin(radians(90)-angle),x) and near(cos(radians(90)-angle),y)
    for r in (.5,2,5):assert near(hypot(r*x,r*y),r);trials+=1
print(f'TRIGONOMETRY_REVIEW_OK {len(data)} source questions, {scenes} scenes, {edges} independently measured arc segments and {trials} radius transfers.')

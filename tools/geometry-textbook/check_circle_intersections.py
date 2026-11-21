"""Independently substitute source pairs, measure the marks and count tangent/missing cases."""
import json
from itertools import product
from math import isclose
from circle_intersections import ROOT

cards=json.loads((ROOT/'geometry-course/textbook/data/circle-intersections.json').read_bytes())['lessons']
expected=[(1047,p,'13',q) for p,q in zip('абв',('2','9','10'),strict=True)]+[(1048,None,'25','18'),(1049,'а','9','2'),(1049,'б','16','1'),(1050,'а','25','0'),(1050,'б','25','-6')]
centers={(1049,'а'):(0,0),(1049,'б'):(0,0),(1050,'а'):(3,5),(1050,'б'):(3,5)}
answers={(1049,'а'):{(-4,-3),(-4,3)},(1049,'б'):{(-4,3),(4,3)},(1050,'а'):{(3,0),(3,10)},(1050,'б'):{(-2,5),(8,5)}}
new={(1049,'а'):((1,-2),5,0,4,{(4,-6),(4,2)}),(1049,'б'):((1,-2),5,1,3,{(1,3)}),(1050,'а'):((-2,1),3,0,2,set()),(1050,'б'):((-2,1),5,1,4,{(-6,4),(2,4)})}
count=circles=stacks=0
for card,(n,part,a,b) in zip(cards,expected,strict=True):
    s=card['source'];assert s['collection']=='main' and int(s['exercise'])==n and s.get('subpart')==part and s['chapter']=='XI' and s['bookId']=='atanasyan-2023-7-9' and s['printedPages']==[264] and s['pdfPages']==[265]
    assert [st['input']['accepted'][0] for st in card['steps'] if 'input'in st]==[a,b]
    model=card['visualization']['model'];raw=model['points']
    for k,v in model['views'].items():
        count+=1;suffix='__v'+v['points'][0].split('__v')[-1];o=raw['O'+suffix];scale=raw['_unitX'+suffix][0]-o[0];assert scale>0 and isclose(raw['_unitY'+suffix][1]-o[1],scale,abs_tol=2e-5)
        xy=lambda i:tuple(round((raw[i][j]-o[j])/scale,5) for j in (0,1))
        pts={name:xy(i) for i in v['points'] for name in model['labels'][i].split('=')}
        circle,=v['circles'];center=xy(circle['center']);through=xy(circle['through']);r2=sum((x-c)**2 for x,c in zip(through,center,strict=True));circles+=1
        variant=k in ('case-3','step-3')
        eq=lambda x,y:isclose(x,y,abs_tol=.0005)
        near=lambda p,q:all(eq(x,y) for x,y in zip(p,q,strict=True))
        d=lambda p,c:sum((x-y)**2 for x,y in zip(p,c,strict=True))
        if n==1047:
            c=(1,-1) if variant else (-5,1);assert near(center,c) and eq(r2,9 if variant else 16)
            using={'M':((2,0),2),'N':((1,2),9),'P':((4,0),10)} if variant else {'A':((-2,4),18),'B':((-5,-3),16),'C':((-7,-2),13),'D':((1,5),52)}
            for name,(p,q) in using.items():
                if name in pts:assert near(pts[name],p) and eq(d(pts[name],c),q)
            if k=='neutral':assert set(using)<=set(pts)
            if k=='case-2':assert set('ABCD').intersection(pts)==set({'а':'C','б':'B','в':'AD'}[part])
        elif n==1048:
            c=(2,-1) if variant else (0,0);assert near(center,c) and eq(r2,25)
            if variant:assert eq(d(pts['N'],c),25) and eq(d(pts['M'],c),25) and eq(d(pts['K'],c),18)
            else:assert eq(d(pts['A'],c),25) and eq(d(pts['B'],c),25) and pts['A']!=pts['B']
            if k=='case-2':assert any({a.split('__')[0],b.split('__')[0]}=={'A','B'} for a,b in v['segments'])
            assert card['answer']['mode']!='exact'
        else:
            key=n,part;base=answers[key];j=0 if part=='а' else 1
            c,r,axis,fixed,points=new[key] if variant else (centers[key],5,j,next(iter(base))[j],base)
            assert near(c,center) and eq(r2,r*r)
            if k not in ('neutral','step-1') or k=='case-1':
                pair,=v['highlightSegments'];u,w=map(xy,pair);assert eq(u[axis],fixed) and eq(w[axis],fixed) and abs(u[1-axis]-w[1-axis])>=2*r
            if k in ('step-2','case-2','step-3','case-3'):
                displayed={p for name,p in pts.items() if name in ('M','N')};assert len(displayed)==len(points) and all(any(near(p,q) for p in points) for q in displayed)
                for p in displayed:assert eq(d(p,c),r*r) and eq(p[axis],fixed)
            if k=='neutral':
                assert all(pair in card['answer']['accepted'] for pair in [', '.join(f'({x};{y})' for x,y in order) for order in (sorted(base),sorted(base,reverse=True))]);stacks+=1
cases=0
for cx,cy,r,axis,offset in product(range(-3,4),range(-3,4),range(1,8),range(2),range(-8,9)):
    center=(cx,cy);dist=r*r-offset*offset;one=dist==0;count_expected=0 if abs(offset)>r else 1 if abs(offset)==r else 2
    if dist<0:actual=[]
    else:
        a=dist**.5;values={center[1-axis]-a,center[1-axis]+a};actual=[(center[axis]+offset,t) if axis==0 else (t,center[axis]+offset) for t in values]
        assert all(isclose(sum((p[j]-center[j])**2 for j in (0,1)),r*r) for p in actual)
    assert len(actual)==count_expected;cases+=1
print(f'CIRCLE_INTERSECTIONS_OK {len(cards)} original lessons, {count} measured scenes, {circles} fitted source circles, {stacks} unordered pairs, {cases} tangent / empty / two-point sections.')

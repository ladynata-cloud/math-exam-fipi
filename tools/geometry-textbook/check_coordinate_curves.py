"""Remeasure the actual circles and both sampled branches; substitute into the unaltered print equation."""
import json
from itertools import product
from math import isclose,sqrt
from coordinate_curves import ROOT

cards=json.loads((ROOT/'geometry-course/textbook/data/coordinate-curves.json').read_bytes())['lessons']
expected=[(97,None,[260,261]),(98,None,[261,262]),(99,None,[262,263])]+[(1045,k,[263]) for k in 'абвгд']+[(1046,k,[263]) for k in 'абв']
probes=[['-2','-1'],['9','5'],['1','4'],['0','0'],['-2','-2'],['3','-4'],['0','3'],['-2','2'],['2','4'],['1','1'],['2','2']]
center_data=[((0,0),9),((1,-2),4),((-5,3),25),((1,0),4),((0,-2),2)]
transfer_data=[((-2,1),4,(0,1)),((2,1),9,(2,-2)),((-2,2),4,(-4,2)),((2,0),9,(2,3)),((0,1),5,(2,2))]
source_pts={'A':(3,-4),'B':(1,0),'C':(0,5),'D':(0,0),'E':(0,1)}
source_func=[lambda x,y:x*x+y*y,lambda x,y:(x-1)**2+(y+3)**2,lambda x,y:(x-.5)**2-y*y]
views=circles=curve_segments=0
for i,(card,(n,part,pages),values) in enumerate(zip(cards,expected,probes,strict=True)):
    s=card['source'];kind='theory' if n<100 else 'main';assert s['bookId']=='atanasyan-2023-7-9' and s['collection']==kind and s['chapter']=='XI' and s['printedPages']==pages and s['pdfPages']==[x+1 for x in pages] and s.get('subpart')==part and int(s['point' if n<100 else 'exercise'])==n
    assert [st['input']['accepted'][0] for st in card['steps'] if 'input'in st]==values
    model=card['visualization']['model'];cases=[v['label'] for k,v in model['views'].items() if k.startswith('case-')];assert len(cases)==len(set(cases))
    eq=lambda a,b:isclose(a,b,abs_tol=1e-5)
    if n==1045:
        ix='абвгд'.index(part);center,q=center_data[ix];got=card['answer']['accepted'][0].split(';');assert tuple(map(int,got[:2]))==center and (got[2]=='√2' if q==2 else int(got[2])**2==q)
    if n==1046:
        ix='абв'.index(part);target=(25,9,.25)[ix];actual=[name for name,(x,y) in source_pts.items() if eq(source_func[ix](x,y),target)]
        assert actual==[list('AC'),['B'],list('BD')][ix] and ','.join(actual)==card['answer']['accepted'][0]
    for key,v in model['views'].items():
        views+=1;raw=model['points'];suffix='__v'+v['points'][0].split('__v')[-1];o=raw['O'+suffix];unit=raw['_unitX'+suffix][0]-o[0];assert unit>0 and eq(raw['_unitY'+suffix][1]-o[1],unit)
        xy=lambda k:tuple((x-y)/unit for x,y in zip(raw[k][:2],o[:2],strict=True))
        pts={name:xy(k) for k in v['points'] for name in model['labels'][k].split('=')}
        for circle in v.get('circles',[]):
            c,r=map(xy,(circle['center'],circle['through']));r2=sum((x-y)**2 for x,y in zip(c,r,strict=True));circles+=1
            assert r2>0 and eq(c[1],r[1]);
            if n==1045:
                idx='абвгд'.index(part);center,q=center_data[idx] if key not in ('step-3','case-3') else transfer_data[idx][:2]
                assert all(eq(a,b) for a,b in zip(c,center,strict=True)) and eq(r2,q),(n,part,key,c,r,r2,q)
                assert eq(sum((a-b)**2 for a,b in zip(pts['T'],center,strict=True)),q)
            if n==1046 and key not in ('step-3','case-4'):
                center,q=((0,0),25) if part=='а' else ((1,-3),9)
                assert all(eq(a,b) for a,b in zip(c,center,strict=True)) and eq(r2,q)
        if n==1046 and part=='в':
            assert not v.get('circles'), 'the actual print equation is not a circle'
            curve=v['highlightSegments'];assert len(curve)==96
            for a,b in curve:
                p,q=xy(a),xy(b);assert (p[0]-.5)*(q[0]-.5)>0, 'the two branches must never be connected';curve_segments+=1
                assert isclose(q[1]-p[1],.2,abs_tol=1e-5)
                for x,y in (p,q):assert abs((x-.5)**2-y*y-.25)<2e-5,(key,x,y)
            if key in ('step-3','case-4'):
                x,y=pts['U'];assert eq((x-.5)**2-y*y,.25) and eq((x-.5)**2+y*y,4.25)
        if n==1046 and key=='neutral':
            for name,p in source_pts.items():assert all(eq(a,b) for a,b in zip(pts[name],p,strict=True))
        if n==97 and key=='case-3':assert eq(pts['A'][0],-1) and eq(pts['B'][0],-1) and not eq(pts['N'][0],-1)
        if n==99 and key in ('case-3','case-4'):
            for a,b in v['highlightSegments']:
                x,y=xy(a);z,w=xy(b)
                if key=='case-3':assert eq((w-y)/(z-x),1)
                else:assert eq(x,2) and eq(z,2)
checks=0
for a,b,x,y in product(range(-2,3),repeat=4):
    expanded=x*x+y*y-2*a*x-2*b*y+a*a+b*b
    assert expanded==(x-a)**2+(y-b)**2;checks+=1
print(f'COORDINATE_CURVES_OK {len(cards)} source lessons, {views} measured views, {circles} actual circle loci, {curve_segments} segments across the two separate branches of printed 1046в, 15 literal source substitutions, {checks} translations.')

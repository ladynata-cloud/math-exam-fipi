"""Source numbering and physical measurements of every arc and ray in the opening of chapter XII."""
import json
from math import cos,sin,tan,pi,hypot,isclose,sqrt
from upper_semicircle import OUT

cards=json.loads(OUT.read_bytes())['lessons']
ids=['theory-100','theory-101','theory-102','theory-103','main-1098','main-1098','main-1099']
expected=[([271,272,273],None,1,-1),([273],None,1,-1),([273,274],None,1,-2),([274],None,1,135),([275],'а',3,0),([275],'б',2,1),([275],None,1,1)]
eq=lambda a,b:isclose(a,b,abs_tol=.00055)
scenes=arcs=lines=0
for c,key,(pages,part,u,v) in zip(cards,ids,expected,strict=True):
    n=int(key.split('-')[-1]);s=c['source']
    assert c['id']=='atanasyan-7-9-'+key+'-part-'+('2' if part=='б' else '1')
    assert s['collection']==key.split('-')[0] and s['chapter']=='XII' and s['printedPages']==pages and s['pdfPages']==[pg+1 for pg in pages] and s.get('subpart')==part
    assert [step['input']['accepted'][0] for step in c['steps'] if 'input' in step]==[str(u),str(v)]
    if n==1098:assert c['answer']['accepted'][0]==('1;2;3' if part=='а' else '1;2')
    m=c['visualization']['model'];raw=m['points']
    for scope,view in m['views'].items():
        scenes+=1;suffix='__v'+view['points'][0].split('__v')[-1];o=raw['O'+suffix];unit=raw['_unitX'+suffix][0]-o[0]
        assert unit>0 and eq(raw['_unitY'+suffix][1]-o[1],unit)
        get=lambda p:tuple((raw[p][j]-o[j])/unit/(1 if n==103 else 4) for j in (0,1))
        data={nm:get(p) for p in view['points'] for nm in m['labels'][p].split('=')}
        edges=[(get(a),get(b)) for a,b in view['highlightSegments']]
        if n==103:
            assert len(edges)==1;line=edges[0];(x,y),(xx,yy)=line
            slope=(yy-y)/(xx-x);expected_slope=-1 if scope in ('step-3','case-3') else sqrt(3) if scope in ('step-2','case-2') else 1
            assert eq(slope,expected_slope);lines+=1;continue
        assert len(edges)>=36
        for k,(a,b) in enumerate(edges[:36]):
            for j,pt in enumerate((a,b)):
                theta=(k+j)*5*pi/180
                assert eq(pt[0],cos(theta)) and eq(pt[1],sin(theta)) and eq(hypot(*pt),1) and pt[1]>-.00055
            if k:assert all(eq(u,v) for u,v in zip(edges[k-1][1],a))
        arcs+=1
        for nm in ['M','M₁','M₂','M₃','M₄','N']:
            if nm in data:assert eq(hypot(*data[nm]),1) and data[nm][1]>=-.00055
        if n==102 and 'P' in data:
            x,y=data['P'];r=4 if scope in ('step-3','case-3') else 2;assert eq(hypot(x,y),r)
            assert all(eq(data['M'][z]*r,data['P'][z]) for z in (0,1))
        if n==1098 and part=='а':
            if scope in ('case-5','case-6'):
                x=5/3 if scope=='case-5' else -2.8;assert all(eq(pt[0],x) for pt in edges[-1]) and abs(x)>1
        if n==1098 and part=='б' and 'M' in data and 'N' in data:
            assert eq(data['M'][1],data['N'][1]) and eq(data['M'][0],-data['N'][0])
        if n==1098 and part=='б' and scope in ('case-5','case-6'):
            y=7 if scope=='case-5' else 1.002
            assert all(eq(pt[1],y) for pt in edges[-1]) and y>1
        if n==1099:
            samples={'M₁':90,'M₂':60,'M₃':45,'M₄':150,'N':30}
            for nm,angle in samples.items():
                if nm in data:assert eq(data[nm][0],cos(angle*pi/180)) and eq(data[nm][1],sin(angle*pi/180))
checks=0
for half_degree in range(361):
    angle=half_degree*pi/360;x,y=cos(angle),sin(angle)
    assert eq(x*x+y*y,1) and -1<=x<=1 and -.000001<=y<=1
    assert eq(cos(pi-angle),-x) and eq(sin(pi-angle),y)
    if half_degree!=180:assert eq(y/x,tan(angle))
    if half_degree<=180:assert eq(sin(pi/2-angle),x) and eq(cos(pi/2-angle),y)
    for r in [0,.5,1,3,11]:assert eq(hypot(r*x,r*y),r);checks+=1
print(f'UPPER_SEMICIRCLE_OK {len(cards)} source cards, {scenes} measured scenes, {arcs} upper arcs, {36*arcs} checked curved segments, {lines} slope diagrams and {checks} polar distances.')

"""Independently measure every captured source/transfer secant, tangent, circle and marked point."""
import json
from itertools import product
from math import hypot,isclose,sqrt
from circle_line_positions import ROOT

cards=json.loads((ROOT/'geometry-course/textbook/data/circle-line-positions.json').read_bytes())['lessons']
expected=[(1065,None,['8','1'],[(0,2,3)],[(0,2,3)]),(1066,None,['-3','0'],[(0,2,3)],[(0,2,3)]),
          (1067,'а',['0','4'],[(0,0,3),(0,0,2)],[(0,0,2),(0,0,2)]),(1067,'б',['1','0'],[(1,0,1),(0,0,2)],[(1,0,2),(0,0,4)]),
          (1068,'а',['2','1'],[(-2,0,1),(0,0,2)],[(-1,0,1),(0,0,2)]),(1068,'б',['3','0'],[(-3,0,1),(0,0,2)],[(-4,0,1),(0,0,2)])]
marks={1065:((2-sqrt(2)/2,-sqrt(2)/2),(2+sqrt(2)/2,sqrt(2)/2)),1066:((-3,2),(0,5)),(1067,'а'):(),(1067,'б'):((2,0),),(1068,'а'):((-1.75,sqrt(15)/4),(-1.75,-sqrt(15)/4)),(1068,'б'):((-2,0),)}
new_marks={1065:((3,2),),1066:(),(1067,'а'):((0,2),),(1067,'б'):(),(1068,'а'):((-2,0),),(1068,'б'):()}
scene_count=curve_count=segments=0
for c,(n,p,answers,source,new) in zip(cards,expected,strict=True):
    src=c['source'];assert src['bookId']=='atanasyan-2023-7-9' and int(src['exercise'])==n and src.get('subpart')==p and src['printedPages']==[265] and src['pdfPages']==[266] and src['chapter']=='XI'
    assert [s['input']['accepted'][0] for s in c['steps'] if 'input' in s]==answers
    m=c['visualization']['model'];raw=m['points'];key=n if p is None else (n,p)
    for k,v in m['views'].items():
        scene_count+=1;suf='__v'+v['points'][0].split('__v')[-1];o=raw['O'+suf];scale=raw['_unitX'+suf][0]-o[0];assert scale>0 and isclose(raw['_unitY'+suf][1]-o[1],scale,abs_tol=2e-5)
        get=lambda i:tuple((raw[i][j]-o[j])/scale for j in (0,1));near=lambda a,b:all(isclose(x,y,abs_tol=.0004) for x,y in zip(a,b,strict=True));pts={name:get(i) for i in v['points'] for name in m['labels'][i].split('=')};transfer=k in ('step-3','case-3');rules=new if transfer else source
        assert len(v['circles'])==len(rules)
        for curve,(x,y,r) in zip(v['circles'],rules,strict=True):
            center=get(curve['center']);aux=get(curve['through']);assert near(center,(x,y)) and isclose(hypot(aux[0]-x,aux[1]-y),r,abs_tol=.0004);curve_count+=1
        if n in (1065,1066):
            eq=(1,0,-3) if transfer and n==1065 else (1,-1,8) if transfer else (1,-1,-2) if n==1065 else (1,-1,5)
            seg,=v['highlightSegments'];segments+=1;a,b,d=eq
            assert all(abs(a*x+b*y+d)<.0004 for x,y in map(get,seg));assert not near(get(seg[0]),get(seg[1]));
            if 'H' in pts:
                hx,hy=pts['H'];assert abs(a*hx+b*hy+d)<.0004 and abs(b*(hx-0)-a*(hy-2))<.0004
        if k in ('step-2','case-2','step-3','case-3'):
            wanted=(new_marks if transfer else marks)[key];given=[val for name,val in pts.items() if name in 'ABPT' and name!='T' or name=='T' and n==1065 and transfer]
            for want in wanted:
                assert any(near(want,p) for p in given+([pts['T']] if 'T' in pts else [])),(n,p,k,want,given)
                assert all(isclose(hypot(want[0]-x,want[1]-y),r,abs_tol=.0004) for x,y,r in rules)
                if n in (1065,1066):assert abs(a*want[0]+b*want[1]+d)<.0004
    assert c['help'][1]['theoryIds']==['atanasyan-7-9-theory-98-part-1','atanasyan-7-9-theory-99-part-1']
checks=0
for r,R,d in product(range(1,9),range(1,9),range(1,18)):
    t=(R*R-r*r+d*d)/(2*d);h=R*R-t*t
    by_height=2 if h>1e-8 else 1 if abs(h)<=1e-8 else 0
    assert by_height==(2 if abs(R-r)<d<R+r else 1 if d in (abs(R-r),R+r) else 0);checks+=1
print(f'CIRCLE_LINE_POSITIONS_OK {len(cards)} source lessons, {scene_count} measured scenes, {curve_count} exact loci, {segments} tested line sections, {checks} independent two-centre classifications.')

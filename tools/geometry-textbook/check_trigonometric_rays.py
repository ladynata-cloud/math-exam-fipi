"""Verify the actual displayed rays and angles against the issued book, including each alternative model."""
import json
from math import acos, asin, atan2, cos, degrees, hypot, isclose, pi, sin, sqrt, tan
from upper_semicircle import ROOT

DATA = ROOT / 'geometry-course/textbook/data'
files = ['trigonometric-signs','trigonometric-rays','slope-and-reflection']
cards = [card for name in files for card in json.loads((DATA/(name+'.json')).read_bytes())['lessons']]
parts = {1100:'абв',1101:'абв',1102:'абвг',1103:'',1104:'абв',1105:'абвгд',1106:'абвг',1107:'абвгд',1108:''}
ordered = [(n,part or None) for n,ps in parts.items() for part in (ps or [None])]
def close(a,b):return isclose(a,b,abs_tol=.001)
def near(a,b):return all(close(i,j) for i,j in zip(a,b,strict=True))
def radians(degree):return pi*degree/180

source_x=[.5,-2/3,-1]
new_x=[.6,-.8,1]
source_y=[sqrt(3)/2,.25,0]
new_y=[.8,.6,1]
tangent_angles=[0,150,45,degrees(acos(-.8))]
tangent_new=[90,degrees(acos(-.6)),135,degrees(acos(.8))]
construction_y_or_x=[2/3,.75,-.4]
construction_new=[1,-.75,.4]
polar=[(3,45),(1.5,90),(5,150),(1,180),(2,30)]
normal=[(2,2),(0,3),(-sqrt(3),1),(-2*sqrt(2),2*sqrt(2))]
slope=[(1,1,45),(-1,2,135),(sqrt(3)/3,4,30),(-sqrt(3)/3,5,150),(-sqrt(3),-2,120)]
count=arcs=optical=0
for card,(n,part) in zip(cards,ordered,strict=True):
    s=card['source'];i=parts[n].index(part) if part else 0
    assert card['id']==f'atanasyan-7-9-main-{n}-part-{i+1}'
    assert s['chapter']=='XII' and int(s['exercise'])==n and s.get('subpart')==part
    page=276 if n>=1107 else 275
    assert s['printedPages']==[page] and s['pdfPages']==[page+1]
    assert len([step for step in card['steps'] if 'input' in step])==2
    assert card['help'][1]['theoryIds'] and (card['answer']['mode']=='manual')==(n==1104)
    if n==1101:
        allowed=card['answer']['accepted'];a=['1/2','√15/4','1'][i]
        assert '±'+a in allowed and '-'+a+';'+a in allowed and a+';-'+a in allowed and a not in allowed and '-'+a not in allowed
    if n==1103:assert len(card['answer']['accepted'][0].split(';'))==9
    if n==1108:assert card['answer']['accepted'][0]=='1;-5;-1;5;-10;15'
    model=card['visualization']['model']
    for key,v in model['views'].items():
        count+=1
        suffix='__v'+v['points'][0].split('__v')[1];pts=model['points'];o=pts['O'+suffix]
        unit=pts['_unitX'+suffix][0]-o[0];assert unit>0 and close(pts['_unitY'+suffix][1]-o[1],unit)
        def read(idx):return tuple((pts[idx][j]-o[j])/unit/(4 if n<1107 else 1) for j in (0,1))
        labels={lab:read(idx) for idx in v['points'] for lab in model['labels'][idx].split('=')}
        lines=[(read(a),read(b)) for a,b in v['highlightSegments']]
        new=key in ('step-3','case-3');second=key in ('step-2','case-2')
        if n<1107:
            assert len(lines)>=36
            for k,(a,b) in enumerate(lines[:36]):
                for j,pt in enumerate((a,b)):
                    th=radians(5*(k+j))
                    assert near(pt,(cos(th),sin(th))) and close(hypot(*pt),1)
            for name in ('M','N'):
                if name in labels:assert close(hypot(*labels[name]),1) and labels[name][1]>=-.001
            arcs+=1
        if n==1100:
            x=(new_x if new else source_x)[i]
            assert near(labels['M'],(x,sqrt(1-x*x)))
        elif n==1101:
            y=(new_y if new else source_y)[i]
            assert near(labels['M'],(sqrt(1-y*y),y))
            if new or second:assert near(labels['N'],(-sqrt(1-y*y),y)) and all(close(pt[1],y) for pt in lines[-1])
        elif n==1102:
            th=radians((tangent_new if new else tangent_angles)[i])
            assert near(labels['M'],(cos(th),sin(th)))
            if not close(cos(th),0):assert close(labels['M'][1]/labels['M'][0],tan(th))
        elif n==1103:
            th=radians(30 if key=='case-4' else 150 if new else 135 if second else 120)
            assert near(labels['M'],(cos(th),sin(th))) and close(labels['M'][1]/labels['M'][0],tan(th))
        elif n==1104:
            val=(construction_new if new else construction_y_or_x)[i];axis=1 if i==0 else 0
            assert close(labels['M'][axis],val) and all(close(pt[axis],val) for pt in lines[-1])
            if i==0:assert close(labels['N'][1],val) and close(labels['M'][0],-labels['N'][0])
        elif n==1105:
            r,angle=polar[i];r*=2 if new else 1;th=radians(angle)
            assert near(labels['A'],(r*cos(th),r*sin(th))) and close(hypot(*labels['A']),r)
            if new or second:assert near(labels['H'],(labels['A'][0],0))
        elif n==1106:
            x,y=normal[i]
            if new:
                if i==1:y*=2
                else:x=-x
            assert near(labels['A'],(x,y)) and close(degrees(atan2(y,x)),degrees(atan2(*reversed(labels['A']))))
        elif n==1107:
            k,d,angle=slope[i]
            if new:k=-k;angle=180-angle
            if second:d+=2
            assert close(tan(radians(angle)),k) and len(lines)==1
            for pt in (labels['P'],labels['Q'],*lines[0]):assert close(pt[1],k*pt[0]+d)
        elif n==1108:
            m=(4,2) if new else (8,3);hit=m[0]-m[1];screen=-3 if new else -10
            assert near(labels['M'],m) and near(labels['K'],(hit,0)) and near(lines[0][0],m) and near(lines[0][1],(hit,0))
            if new or second:
                assert near(labels['P'],(screen,hit-screen)) and near(labels['B'],(screen,0))
                a,b=lines[1];assert near(a,labels['K']) and near(b,labels['P']) and b[0]<a[0] and b[1]>a[1]
                assert all(close(pt[0],screen) for pt in lines[2]);optical+=1
for quarter in range(721):
    alpha=quarter*pi/720;x=cos(alpha);y=sin(alpha)
    assert close(x*x+y*y,1) and near((-x,y),(cos(pi-alpha),sin(pi-alpha)))
    for r in [.5,1,2,3,7]:
        p=(r*x,r*y)
        assert close(hypot(*p),r) and close(atan2(p[1],p[0]),alpha)
print(f'TRIG_RAYS_OK {len(cards)} numbered source entries, {count} measured scenes, {36*arcs} arc segments, {optical} reflected-ray screen checks and 3605 polar transfers.')

"""Reconstruct the printed configurations from all 70 SVG model views, including both readings of 1159."""
import json
from math import acos, cos, degrees, hypot, isclose, radians, sin, sqrt
from chapter_twelve_finale import OUT


def near(x,y):
    return isclose(x,y,abs_tol=.0001,rel_tol=1e-7)


def sub(u,v):
    return u[0]-v[0],u[1]-v[1]


def dot(u,v):
    return u[0]*v[0]+u[1]*v[1]


def det(u,v):
    return u[0]*v[1]-u[1]*v[0]


def angle(u,v):
    return degrees(acos(max(-1,min(1,dot(u,v)/(hypot(*u)*hypot(*v))))))


def length(a,b):
    return hypot(*sub(a,b))


def area(p,order):
    return abs(sum(det(p[a],p[b]) for a,b in zip(order,order[1:]+order[:1])))/2


def line_dist(x,a,b):
    return abs(det(sub(x,a),sub(b,a)))/length(a,b)


parts=[(1159,None),(1160,None),(1161,None),(1162,None),(1163,None),(1164,'а'),(1164,'б'),(1165,None),(1166,'а'),(1166,'б')]
cards=json.loads(OUT.read_bytes())['lessons']
views=circles=0
for (n,part),e in zip(parts,cards,strict=True):
    s=e['source'];pg=292 if n<=1161 else 293
    assert s['chapter']=='XII' and s['printedPages']==[pg] and s['pdfPages']==[pg+1] and s.get('subpart')==part
    assert e['id']==f'atanasyan-7-9-main-{n}-part-{2 if part=="б" else 1}'
    assert e['answer']['mode']==('exact' if n in (1160,1161,1163) else 'manual') and len([st for st in e['steps'] if 'input' in st])==2
    m=e['visualization']['model'];raw=m['points']
    for key,v in m['views'].items():
        k=2 if key in ('case-3','step-3') else 1 if key in ('case-2','step-2') else 0
        views+=1;su='__v'+v['points'][0].split('__v')[1];o=raw['O'+su];scale=raw['_unitX'+su][0]-o[0]
        assert scale>0 and near(raw['_unitY'+su][1]-o[1],scale)
        def coord(j):return tuple((raw[j][i]-o[i])/scale for i in (0,1))
        p={name:coord(j) for j in v['points'] for name in m['labels'][j].split('=')}
        def u(a):return sub(p[a[1]],p[a[0]])
        def d(a):return length(p[a[0]],p[a[1]])
        if n==1159:
            assert near(det(u('AD'),u('BC')),0) and near(angle(u('DA'),u('DC')),60)
            assert near(d('AD'),8 if k==2 else 16) and near(d('BC'),4 if k==2 else 8)
            assert near(d('CD' if k==1 else 'AB'),(2 if k==2 else 4)*sqrt(7))
            assert near(2*area(p,'DCK'),area(p,'ABCD')) and near(d('DK'),6 if k==2 else 12)
            target=[(72*sqrt(3),12),(24*sqrt(21),sqrt(256-48*sqrt(7))),(18*sqrt(3),6)][k]
            assert near(area(p,'ABCD'),target[0]) and near(d('CK'),target[1])
            assert near(dot(u('CH'),u('AD')),0) and near(det(u('DK'),u('DA')),0)
        elif n==1160:
            assert near(angle(u('AB'),u('AC')),[30,150,90][k])
            assert near(area(p,'ABC'),12*2 if k==2 else 3*sqrt(3))
            assert near(d('BC')**2,[21,93,100][k])
        elif n==1161:
            alpha=[15,22.5,30][k]
            assert near(angle(u('MN'),u('MQ')),4*alpha)
            assert near(d('QM'),d('MN')) and near(d('NP'),d('MN')) and near(d('PQ'),d('MN'))
            assert near(angle(u('MF'),u('MQ')),alpha) and near(angle(u('MP'),u('MF')),alpha) and near(angle(u('FM'),u('FQ')),3*alpha)
            assert near(d('FQ'),1) and near(d('PF')+d('FQ'),d('PQ'))
            side=sin(radians(3*alpha))/sin(radians(alpha))
            assert near(side,d('MQ')) and near(area(p,'MNPQ'),side**2*sin(radians(4*alpha)))
        elif n==1162:
            weight=[2,0,1][k]
            assert near(d('BM'),weight*d('MC')) and near(d('BM')+d('MC'),d('BC'))
            assert near((1+weight)**2*d('AM')**2,d('AB')**2+weight**2*d('AC')**2+2*weight*dot(u('AB'),u('AC')))
            assert near(d('AM')**2,[8,16,8.5][k])
        elif n==1163:
            assert near(det(u('AD'),u('BC')),0)==(k!=2)
            assert not near(det(u('AB'),u('DC')),0)
            assert near(area(p,'ABCD'),[12,48,14][k]) and near(area(p,'ABC')+area(p,'ACD'),area(p,'ABCD'))
        elif n==1164:
            a=angle(u('AB'),u('AC'));b=d('AC');c=d('AB')
            assert near(d('BM'),d('MC')) and near(angle(u('AB'),u('AD')),a/2) and near(d('BD')/d('DC'),c/b)
            assert near(d('AD'),2*b*c*sqrt((1+cos(radians(a)))/2)/(b+c))
            assert near(4*d('AM')**2,b*b+c*c+2*dot(u('AB'),u('AC')))
            assert near(4*d('AM')**2,[27,36,32][k]) and near(d('AD')**2,[4,9,8][k])
        elif n==1165:
            assert near(dot(u('AC'),u('DB')),d('AB')**2-d('AD')**2) and near(dot(u('AC'),u('DB')),[0,0,12][k])
            assert near(d('AB'),d('CD')) and near(d('AD'),d('BC')) and near(d('AB'),d('AD'))==(k!=2)
        if n in (1160,1166):
            circle,=v['circles'];center=coord(circle['center']);r=length(center,coord(circle['through']));circles+=1
            inscribed=n==1166 and part=='б'
            expected=([1,2,4-2*sqrt(2)] if inscribed else [2.5,5,2*sqrt(2)]) if n==1166 else [sqrt(21),sqrt(93),5]
            assert near(expected[k],r)
            if inscribed:
                for a,b in ('AB','BC','CA'):assert near(line_dist(center,p[a],p[b]),r)
                assert near(d('TH'),r) and near(dot(u('TH'),u('AB')),0)
            else:
                for a in 'ABC':assert near(length(center,p[a]),r)
trials=0
for alpha in range(1,45):
    for numerator in range(1,26):
        a=numerator/3;t=radians(alpha);s=a*sin(3*t)/sin(t)
        p={'M':(0,0),'N':(s*cos(4*t),s*sin(4*t)),'Q':(s,0),'P':(s*(1+cos(4*t)),s*sin(4*t))}
        assert near(area(p,'MNPQ'),a*a*sin(3*t)**2*sin(4*t)/sin(t)**2)
        trials+=1
print(f'CHAPTER_TWELVE_FINALE_OK {len(cards)} verified exercise parts, {views} measured scenes, {circles} exact circle checks, {trials} area trials.')

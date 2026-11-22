"""Independently measure arcs, rolling distances, gear spacing, equatorial/orbital radii and the units."""
import json
from math import atan2,hypot,isclose,pi

from circle_length_applications import OUT


def near(x,y):
    return isclose(x,y,abs_tol=.0001)


def dist(p,q):
    return hypot(p[0]-q[0],p[1]-q[1])


cards=json.loads(OUT.read_bytes())['lessons']
numbers=[1195,1196,1197,1198,1198,1198,1198,1199]
totals={'scenes':0,'ticks':0,'arcs':0}
for i,c in enumerate(cards):
    s=c['source'];num=numbers[i]
    assert s['exercise']==str(num) and s['chapter']=='XIII' and s['printedPages']==[308] and s['pdfPages']==[309]
    assert s.get('subpart')==('абвг'[i-3] if num==1198 else None)
    if num==1195:assert round(989/500/pi*100)==round(989/500/3.14*100)==int(c['answer']['accepted'][0])==63
    if num==1196:assert set(c['answer']['accepted'][:2])=={str(round(40000/v)) for v in (pi,3.14)}
    if num==1197:assert set(c['answer']['accepted'][:2])=={str(round(2*v*(6370+320))) for v in (pi,3.14)}
    if num==1199:assert near(3.14*450/47.1,30) and near(3.14*450/70.65,20)
    m=c['visualization']['model'];allp=m['points']
    for key,v in m['views'].items():
        current=3 if key.endswith('3') else 2 if key.endswith('2') else 1
        totals['scenes']+=1
        ids={name:k for k in v['points'] for name in m['labels'][k].split('=')}
        p=lambda name:allp[ids[name]]
        unit=dist(p('U'),p('V' if num<=1196 else 'W'));T=p('T')
        rs=[dist(allp[x['center']],allp[x['through']])/unit for x in v['circles']]
        if num<=1196:
            assert near(dist(p('A'),p('B'))/unit,2*rs[0])
            if 'P' in ids:assert near(dist(p('P'),p('E'))/unit,2*pi*rs[0])
            if current==3:assert near(rs[0],2*.6/(989/500/pi) if num==1195 else 1)
            continue
        if num==1197:
            assert near(rs[0]*1600,6370) and near(rs[1]*1600,7000 if current==3 else 6690)
            assert near(dist(p('A'),p('B'))/unit*1600,630 if current==3 else 320)
            continue
        expected=[30,45,60,90][i-3] if num==1198 else 12
        if current==3:expected=[120,90,120,180][i-3] if num==1198 else 18
        arc=v['highlightSegments'];assert len(arc)==24 and arc[0][0]==ids['A'] and arc[-1][-1]==ids['B']
        pts=[allp[arc[0][0]]]+[allp[b] for _,b in arc]
        angles=[atan2(x[1]-T[1],x[0]-T[0]) for x in pts]
        # At 180° the sampled endpoint has y=0, which can be represented as either sign.
        angles[-1]=abs(angles[-1])
        assert all(near(dist(T,q)/unit,rs[0]) for q in pts)
        assert all(near((b-a)*180/pi,expected/24) for a,b in zip(angles,angles[1:]))
        totals['arcs']+=len(arc)
        if num==1198:
            if current<3:assert near(rs[0],6) and near(rs[0]*expected/180,[1,1.5,2,3][i-3])
            else:assert near(rs[0]*expected/180,[2,2,6,4][i-3])
        else:
            teeth=[(a,b) for a,b in v['segments'] if '_toothInner' in a and '_toothOuter' in b]
            assert len(teeth)==360//expected
            assert near(2*rs[0]*75,450)
            for a,b in teeth:
                assert near(dist(allp[a],T)/unit,.94*rs[0]) and near(dist(allp[b],T)/unit,1.06*rs[0])
            totals['ticks']+=len(teeth)
assert len(cards)==8 and totals['scenes']==56
print('CIRCLE_LENGTH_APPLICATIONS_OK',totals,'both terrestrial/orbital approximation policies checked.')

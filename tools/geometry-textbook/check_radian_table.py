"""Convert all original angular cells and measure the actual sweep, including 240° and the 1° inset."""
import json
from math import atan2,hypot,isclose,pi

from radian_table import OUT


def near(x,y):return isclose(x,y,abs_tol=.00015)
def dist(p,q):return hypot(p[0]-q[0],p[1]-q[1])


cards=json.loads(OUT.read_bytes())['lessons']
angles=[180,1,90,60,36,45,30,135,120,150,120,90]
fresh=[90,2,60,120,72,135,150,45,60,30,60,45]
values=['180','π/180','π/2','60','36','π/4','π/6','135','120','5π/6','πn/180','180φ/π']
pieces=count=0
for i,c in enumerate(cards):
    theory=not i;s=c['source']
    assert s['chapter']=='XIII' and s['printedPages']==([304,305] if theory else [308])
    assert s['pdfPages']==[p+1 for p in s['printedPages']]
    if theory:assert s['point']=='119'
    else:
        assert c['answer']['accepted'][0]==values[i-1] and s['exercise']=='1203'
        assert s['subpart']==f'столбец {i+1}' and c['title'].endswith(s['subpart']) and c['id']==f'atanasyan-7-9-main-1203-part-{i}'
        assert '1 рад соответствует (180/π)°' in c['statement']['text']
    m=c['visualization']['model'];raw=m['points']
    for key,v in m['views'].items():
        idx=3 if key.endswith('3') else 2 if key.endswith('2') else 1
        ids={name:ref for ref in v['points'] for name in m['labels'][ref].split('=')}
        coord=lambda name:raw[ids[name]]
        line=v['highlightSegments'];pts=[raw[line[0][0]]]+[raw[b] for _,b in line]
        unit=dist(coord('U'),coord('W'))
        T=(pts[0][0],pts[0][1]+150*unit) if i==2 and idx==2 else coord('T')
        R=dist(pts[0],T)/unit
        assert all(near(dist(T,p)/unit,R) for p in pts)
        assert dist(pts[0],coord('A'))<.0001 and dist(pts[-1],coord('B'))<.0001
        a=[atan2(q[1]-T[1],q[0]-T[0]) for q in pts]
        delta=[(b-a+pi)%(2*pi)-pi for a,b in zip(a,a[1:])]
        phi=sum(delta)
        assert min(delta)>0 and all(near(x,delta[0]) for x in delta)
        measured=phi*180/pi
        if theory:
            assert near(phi,1 if idx<3 else 4*pi/3)
            assert near(phi*R,R if idx<3 else 4*pi)
        else:assert near(measured,(fresh if idx==3 else angles)[i-1]),(i,key,measured)
        pieces+=len(delta);count+=1
assert len(cards)==13 and count==91
print('RADIAN_TABLE_OK one completed printed example and all 12 actual missing cells,',count,'drawings,',pieces,'measured arc increments.')

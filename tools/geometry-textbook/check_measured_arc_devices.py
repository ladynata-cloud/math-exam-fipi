"""Independently measure the uncovered edge, symmetric bob positions and the short, nearly flat track."""
import json
from math import atan2,hypot,isclose,pi

from measured_arc_devices import OUT


def near(x,y):return isclose(x,y,abs_tol=.00015)
def dist(p,q):return hypot(p[0]-q[0],p[1]-q[1])
def det(p,q):return p[0]*q[1]-p[1]*q[0]


cards=json.loads(OUT.read_bytes())['lessons']
scene_count=arc_measurements=0
for i,c in enumerate(cards):
    n=1200+i;s=c['source'];assert s['chapter']=='XIII' and s['printedPages']==[308] and s['pdfPages']==[309] and s['exercise']==str(n)
    assert c['answer']['accepted'][0]==['59,2','36,2','4°35′'][i]
    m=c['visualization']['model'];p=m['points']
    for key,v in m['views'].items():
        k=3 if key.endswith('3') else 2 if key.endswith('2') else 1
        ids={name:ref for ref in v['points'] for name in m['labels'][ref].split('=')};source=lambda name:p[ids[name]]
        ref=dist(source('U'),source('W'))
        curve=v['highlightSegments'];points=[p[curve[0][0]]]+[p[b] for _,b in curve]
        assert all(b==d for (_,b),(d,_) in zip(curve,curve[1:]))
        assert dist(points[0],source('A'))<1e-6 and dist(points[-1],source('B'))<1e-6
        if n==1202 and k==2:
            T=(points[0][0],points[0][1]+50*ref)
        else:T=source('T')
        r=dist(T,points[0])/ref
        assert all(near(dist(T,q)/ref,r) for q in points)
        angles=[atan2(q[1]-T[1],q[0]-T[0]) for q in points]
        diffs=[(b-a+pi)%(2*pi)-pi for a,b in zip(angles,angles[1:])]
        assert min(diffs)>0 and all(near(x,diffs[0]) for x in diffs)
        alpha=sum(diffs);scene_count+=1;arc_measurements+=len(diffs)
        if n==1200:
            deg=90 if k==3 else 117;assert near(alpha*180/pi,deg) and near(r*10,20 if k==3 else 29)
            assert near(r*10*alpha,10*pi if k==3 else 18.85*pi)
            poly,=v['polygons'];assert len(poly)==98
            outer=[p[q] for q in poly[:49]];inner=[p[q] for q in poly[49:]];assert all(near(dist(T,q)/ref,r+.38) for q in outer) and all(near(dist(T,q)/ref,r) for q in inner)
            for contour,sign in [(outer,1),(inner,-1)]:
                a=[atan2(q[1]-T[1],q[0]-T[0]) for q in contour]
                covered=sum((y-x+pi)%(2*pi)-pi for x,y in zip(a,a[1:]))
                assert near(sign*covered+alpha,2*pi)
        if n==1201:
            assert near(alpha*180/pi,60 if k==3 else 38) and near(r*10*alpha,10*pi if k==3 else 24)
            assert near(dist(T,source('M'))/ref,r) and near(source('A')[1],source('B')[1])
            assert not v.get('circles') and not v.get('polygons')
        if n==1202:
            meters_per_unit=100 if k==2 else 1000
            assert near(r*meters_per_unit,2000 if k==3 else 5000) and near(r*meters_per_unit*alpha,1000*pi/3 if k==3 else 400)
            if k<3:assert round((alpha*180/pi-4)*60)==35
assert len(cards)==3 and scene_count==21
print('MEASURED_ARC_DEVICES_OK',scene_count,'measured scenes,',arc_measurements,'arc pieces; full protective annulus, true pendulum and magnified original track verified.')

"""Measure every finalized polygon, circle, common side and angle in 1221–1224."""
import json
from math import acos, degrees, dist, hypot, isclose, sqrt

from additional_regular_perimeters import OUT

lessons=json.loads(OUT.read_bytes())['lessons']
assert len(lessons)==8
count=0


def delta(a,b):return (a[0]-b[0],a[1]-b[1])
def dot(a,b):return a[0]*b[0]+a[1]*b[1]
def length(v):return hypot(*v)
def cross(a,b):return a[0]*b[1]-a[1]*b[0]
def near(a,b):return isclose(a,b,rel_tol=.00001,abs_tol=.00001)


for c in lessons:
    src=c['source'];number=int(src['exercise']);part=int(c['id'].split('-')[-1])
    assert src['chapter']=='XIII' and src['printedPages']==[311] and src['pdfPages']==[312]
    assert c['answer']['mode']=='exact'
    model=c['visualization']['model'];coords=model['points']
    for key,v in model['views'].items():
        idx=int(key[-1])-1 if key[-1].isdigit() else 0
        ids={name:k for k in v['points'] for name in model['labels'][k].split('=')}
        p=lambda name:coords[ids[name]][:2]
        d=lambda a,b:dist(p(a),p(b))
        if number==1221:
            target=([24,30,45,90] if idx==2 else [18,40,72,60])[part-1]
            if idx==1:
                ta,tb=delta(p('A'),p('T')),delta(p('B'),p('T'))
                assert near(length(ta),length(tb))
                incident=sum(ids['T'] in pair for pair in v['segments'])
                assert incident==360//target
            else:
                va=delta(p('A'),p('V'));ae=delta(p('E'),p('A'));ab=delta(p('B'),p('A'))
                assert near(cross(va,ae),0) and dot(va,ae)>0
                ta,tb=ae,ab
            angle=degrees(acos(dot(ta,tb)/(length(ta)*length(tb))))
            assert near(angle,target)
        else:
            u=d('U','W')
            circle=v['circles'][0];center=coords[circle['center']][:2]
            radius=dist(center,coords[circle['through']][:2])/u
            if number==1222:
                R=6 if idx==2 else 3;a=R*sqrt(3)
                assert all(near(d(x,y)/u,a) for x,y in [('A','B'),('B','C'),('C','A'),('A','E'),('B','D'),('D','E')])
                assert near(d('T','K')/u,a/2+R/2) and near(d('E','B')/u,a*sqrt(2))
                assert len(v['rightAngles'])==1
                for name in ('ABC' if idx==0 else 'ABDE'):
                    assert near(dist(p(name),center)/u,radius)
                assert near(radius,R if idx==0 else a/sqrt(2))
            elif number==1223:
                diameter=5 if idx==2 else 2.24
                assert near(d('A','D')/u,diameter) and near(radius*2,diameter)
                perimeter=sum(d(x,y)/u for x,y in zip('ABCDEF','BCDEFA',strict=True))
                assert near(perimeter,3*diameter)
            elif number==1224:
                assert near(radius,4 if idx==2 else 2)
                for names in ['ABC']+(['KLMN'] if idx>0 else []):
                    for a,b in zip(names,names[1:]+names[:1],strict=True):
                        r=(dist(p(a),center) if part==1 else
                           abs(cross(delta(center,p(a)),delta(p(b),p(a))))/d(a,b))
                        assert near(r/u,radius)
                if idx>0:
                    ratio=3*d('A','B')/(4*d('K','L'))
                    assert near(ratio,3*sqrt(6)/8 if part==1 else 3*sqrt(3)/4)
        count+=1
assert count==56
print('ADDITIONAL_REGULAR_PERIMETERS_OK: 56 geometric states; all 4 turns, two centers, hexagon diameter, both circle roles.')

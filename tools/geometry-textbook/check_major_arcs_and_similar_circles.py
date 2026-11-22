"""Validate both actual major-arc paths, all trapezoid vertices, incircle tangencies and similarity."""
import json
from math import acos, degrees, dist, hypot, isclose, pi, sqrt
from major_arcs_and_similar_circles import OUT


def near(a,b):return isclose(a,b,abs_tol=1e-5,rel_tol=1e-5)
def sub(a,b):return (a[0]-b[0],a[1]-b[1])
def det(a,b):return a[0]*b[1]-a[1]*b[0]


cards=json.loads(OUT.read_bytes())['lessons'];count=0
for c in cards:
    source=c['source'];number=int(source['exercise'])
    assert source['printedPages']==[312] and source['pdfPages']==[313] and source['chapter']=='XIII'
    assert c['answer']['mode']==('manual' if number==1235 else 'exact')
    m=c['visualization']['model'];raw=m['points']
    for name,v in m['views'].items():
        ids={label:k for k in v['points'] for label in m['labels'][k].split('=')}
        p=lambda label:raw[ids[label]][:2];unit=dist(p('U'),p('W'))
        d=lambda a,b:dist(p(a),p(b))/unit
        index=int(name[-1])-1 if name[-1].isdigit() else 0;fac=2 if index==2 else 1
        if number==1233:
            c=6*fac;assert near(d('A','B'),c)
            L=0
            for start,center,radius,arc_angle in [('upper','J',c/sqrt(2),270),('lower','K',c,300)]:
                arc=[p('A'),*[raw[q][:2] for q in sorted([q for q in raw if q.startswith('_'+start) and q.endswith(ids['J'][ids['J'].index('__v'):])],key=lambda s:int(s.split('__')[0][len(start)+1:]))],p('B')]
                assert all(near(dist(point,p(center))/unit,radius) for point in arc)
                sweep=0
                for a,b in zip(arc,arc[1:]):
                    x,y=sub(a,p(center)),sub(b,p(center))
                    sweep+=acos(max(-1,min(1,sum(i*j for i,j in zip(x,y))/(hypot(*x)*hypot(*y)))))
                assert near(degrees(sweep),arc_angle);L+=sweep*radius
            assert near(L,fac*pi*(20+9*sqrt(2))/2)
            assert len(v['rightAngles'])==1
        elif number==1234:
            r,=v['circles'];R=dist(raw[r['center']][:2],raw[r['through']][:2])/unit
            assert near(R,65*fac/8) and all(near(d('T',name),R) for name in 'ABCD')
            assert near(d('A','B'),14*fac) and near(d('D','C'),4*fac)
            assert near(d('D','H'),12*fac) and near(d('D','B'),15*fac)
            s=d('A','B')*d('D','H')/2
            assert near(d('A','D')*d('D','B')*d('A','B')/(4*s),R)
        else:
            assert len(v['circles'])==2 and len(v['rightAngles'])==4
            a,b=(5,12) if index==2 else (3,4)
            assert near(d('A','C'),a) and near(d('B','C'),b)
            radii=[]
            for g,names,label in zip(v['circles'],['ACH','BCH'],['I','J'],strict=True):
                q=raw[g['center']][:2];r=dist(q,raw[g['through']][:2])/unit
                assert dist(p(label),q)<1e-5
                for x,y in zip(names,names[1:]+names[:1],strict=True):
                    assert near(abs(det(sub(q,p(x)),sub(p(y),p(x))))/(dist(p(x),p(y))*unit),r)
                radii.append(r)
            assert near(radii[0]/radii[1],a/b)
        count+=1
assert count==21
print('MAJOR_ARCS_AND_SIMILAR_CIRCLES_OK: 21 measured scenes, actual 270/300 degree sweeps and both tangent circles.')

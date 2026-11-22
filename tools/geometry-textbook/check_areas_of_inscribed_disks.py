"""Test disk radii against independently measured areas and disprove 1207в's printed numerator."""
import json
from math import hypot,isclose,pi,sin,sqrt

from areas_of_inscribed_disks import OUT


def near(x,y):return isclose(x,y,abs_tol=.00018)
def diff(p,q):return p[0]-q[0],p[1]-q[1]
def dist(p,q):return hypot(*diff(p,q))
def det(p,q):return p[0]*q[1]-p[1]*q[0]
def dot(p,q):return p[0]*q[0]+p[1]*q[1]


cards=json.loads(OUT.read_bytes())['lessons'];squares=[(25/4,17),(25/4,169/4),(625/64,625/36),(3,12),(1,4),(9/4,16/9),(4,100/9)]
forms=['π(a²+b²)/4','πa²/(4sin²α)','π(a²+4h²)²/(64h²)','πa²/12','πa²sin²α/(sinα+cosα+1)²','πa²sin²α/(4(1+sin(α/2))²)','πa²tg²(α/2)/4']
sides=0;scenes=0
for i,c in enumerate(cards):
    n=1207 if i<3 else 1208;s=c['source'];assert s['chapter']=='XIII' and s['printedPages']==[309] and s['pdfPages']==[310]
    assert s['exercise']==str(n) and s['subpart']=='абвг'[i if i<3 else i-3] and c['answer']['accepted'][0]==forms[i]
    m=c['visualization']['model'];raw=m['points']
    for key,v in m['views'].items():
        names={name:k for k in v['points'] for name in m['labels'][k].split('=')};p=lambda name:raw[names[name]]
        unit=dist(p('U'),p('W'));T=p('T')
        ring,=v['circles'];R=dist(raw[ring['through']],raw[ring['center']])/unit
        assert near(R**2,squares[i][int(key.endswith('3'))]),(i,key,R)
        disk,=v['polygons'];pts=[tuple(x/unit for x in diff(raw[k],T)) for k in disk]
        assert len(disk)==72 and all(near(hypot(*q),R) for q in pts)
        S=abs(sum(det(a,b) for a,b in zip(pts,pts[1:]+pts[:1],strict=True)))/2
        assert .998< S/(pi*R*R)<1 and near(S,36*R**2*sin(pi/36))
        polygon='ABCD' if i in (0,6) else 'ABC'
        if i<3:assert all(near(dist(T,p(a))/unit,R) for a in polygon)
        else:
            for a,b in zip(polygon,polygon[1:]+polygon[:1],strict=True):
                line=diff(p(b),p(a));off=diff(T,p(a));ratio=dot(line,off)/dot(line,line)
                assert 0<ratio<1 and near(abs(det(line,off))/dist(p(b),p(a))/unit,R)
        if i==2:
            a=dist(p('A'),p('B'))/unit;h=dist(p('C'),p('H'))/unit
            assert near((a*a+4*h*h)**2/(64*h*h),R*R)
            assert not near((a*a+4*h*h)/(64*h*h),R*R)
        sides+=len(polygon);scenes+=1
e=cards[2];wrong='π(a²+4h²)/(64h²)'
assert wrong in e['answer']['feedback'] and wrong not in e['answer']['accepted'] and 'с. 401' in e['statement']['text']
# General discriminating test: the printed answer is invariant under similarity. Area is not.
for a in range(1,31):
    for h in range(1,26):
        def correct(k):return (((k*a)**2+4*(k*h)**2)/(8*k*h))**2
        def printed(k):return ((k*a)**2+4*(k*h)**2)/(64*(k*h)**2)
        assert near(correct(2)/correct(1),4) and near(printed(2)/printed(1),1)
assert scenes==49
print('AREAS_OF_INSCRIBED_DISKS_OK',scenes,'full disk scenes,',sides,'edge/vertex checks, 750 scale tests for the missing square in 1207в.')

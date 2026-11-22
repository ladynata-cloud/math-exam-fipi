"""Reconstruct the shaded disk/ring area and material thickness from each source drawing."""
import json
from math import hypot,isclose,pi,sin,sqrt

from disks_and_annuli import OUT


def near(a,b):return isclose(a,b,abs_tol=.0002)
def dist(p,q):return hypot(p[0]-q[0],p[1]-q[1])
def det(p,q):return p[0]*q[1]-p[1]*q[0]


cards=json.loads(OUT.read_bytes())['lessons']
expected=[[(3.3,0),(3.3,0),(2,0)],[(41/(2*pi),0),(41/(2*pi),0),(5,0)],
          [(2.5,1.5),(2.5,1.5),(4,2)],[(10,0),(10,9.25),(6,5)],[(4,3),(4,3),(5,3)]]
count=parts=0
for i,c in enumerate(cards):
    n=1209+i;s=c['source'];assert s['chapter']=='XIII' and s['exercise']==str(n) and s['printedPages']==[309] and s['pdfPages']==[310]
    forms=c['answer']['accepted']
    if n==1209:assert round((6.6/2)**2*pi,1)==float(forms[0].replace(',','.'))==34.2
    if n==1210:
        for p in (pi,3.14):
            assert f'{41/p:.2f};{1681/(4*p):.2f}'.replace('.',',') in forms
    if n==1211:assert near(2.5**2-1.5**2,4) and forms[0]=='π(R₂²−R₁²);4π'
    if n==1212:assert near(sqrt(314/3.14)-18.5/2,float(forms[0].replace(',','.'))) and round(sqrt(314/pi)-18.5/2,2)==.75
    if n==1213:assert near(.8*((3+1)**2-3**2),5.6) and round(5.6*pi,1)==17.6
    m=c['visualization']['model'];raw=m['points']
    for key,v in m['views'].items():
        idx=2 if key.endswith('3') else 1 if key.endswith('2') else 0
        names={name:k for k in v['points'] for name in m['labels'][k].split('=')};p=lambda name:raw[names[name]]
        unit=dist(p('U'),p('W'))/(2 if n==1212 else 1);T=p('T')
        rings=[dist(raw[x['center']],raw[x['through']])/unit for x in v['circles']]
        R,r=expected[i][idx];assert near(rings[0],R)
        if r:
            assert near(rings[1],r) and near(dist(p('H'),p('A'))/unit,R-r)
            assert len(v['polygons'])==72
        else:assert len(v['polygons'])==1 and len(rings)==1
        calculated=0
        for piece in v['polygons']:
            coords=[((raw[k][0]-T[0])/unit,(raw[k][1]-T[1])/unit) for k in piece]
            if r:
                assert len(coords)==4
                assert all(near(hypot(*pt),wanted) for pt,wanted in zip(coords,[R,R,r,r],strict=True))
            calculated+=abs(sum(det(a,b) for a,b in zip(coords,coords[1:]+coords[:1],strict=True)))/2
            parts+=1
        assert near(calculated,36*sin(pi/36)*(R*R-r*r))
        count+=1
assert len(cards)==5 and count==35
print('DISKS_AND_ANNULI_OK',count,'source/transfer scenes,',parts,'shaded pieces checked; diameter, layer and sand units validated independently.')

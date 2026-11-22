"""Use polygon coordinates, tangent distances and circle radii to check every original and transfer area."""
import json
from math import cos,hypot,isclose,pi,sin,sqrt

from disk_area_table import OUT


def near(a,b):return isclose(a,b,abs_tol=.00015)
def dist(a,b):return hypot(a[0]-b[0],a[1]-b[1])
def det(p,q):return p[0]*q[1]-p[1]*q[0]


rows=json.loads(OUT.read_bytes())['lessons']
given=[('R',2),('R',5),('S',9),('R',2/7),('S',49*pi),('R',54.3),('R',sqrt(3)),('S',6.25)]
rechecks=['50,24','314','3,39','1,03','14','37033,03','37,68','2,82']
figs=0;area_checks=0
for i,c in enumerate(rows):
    s=c['source'];theory=i==0;table=1<=i<=8
    assert s['chapter']=='XIII'
    assert s['printedPages']==([305,306] if theory else [308,309] if table else [309])
    assert s['pdfPages']==[p+1 for p in s['printedPages']]
    if table:
        assert s['exercise']=='1205' and s['subpart']==f'столбец {i}' and c['title'].endswith(s['subpart'])
        v=given[i-1][1];inverse=given[i-1][0]=='S'
        source=7 if i==5 else sqrt(v/3.14) if inverse else 3.14*v*v
        changed=14 if i==5 else sqrt(4*v/3.14) if inverse else 3.14*4*v*v
        assert abs(float(c['answer']['accepted'][0].replace(',','.'))-source)<=.005000001
        q=c['steps'][-1]['input']['accepted'][0];assert q==rechecks[i-1] and abs(float(q.replace(',','.'))-changed)<=.005000001
    elif not theory:assert s['exercise']=='1206' and c['answer']['accepted'][0]==('k²' if i==9 else '1/k²')
    m=c['visualization']['model'];p=m['points'];ref_areas=[]
    for key,view in m['views'].items():
        ids={name:k for k in view['points'] for name in m['labels'][k].split('=')}
        unit=dist(p[ids['U']],p[ids['W']]);T=p[ids['T']]
        r=dist(T,p[ids['A']])/unit;shape,=view['polygons']
        pts=[[(p[k][j]-T[j])/unit for j in (0,1)] for k in shape];n=len(pts)
        assert all(near(hypot(*v),r) for v in pts)
        sides=[dist(a,b) for a,b in zip(pts,pts[1:]+pts[:1],strict=True)]
        assert all(near(x,2*r*sin(pi/n)) for x in sides)
        measured=abs(sum(det(a,b) for a,b in zip(pts,pts[1:]+pts[:1],strict=True)))/2
        if theory:
            assert n==(24 if key.endswith('3') else 12 if key.endswith('2') else 6)
            d=dist(T,p[ids['H']])/unit;assert near(d,r*cos(pi/n))
            assert pi*d*d<measured<pi*r*r and near(measured,sum(sides)*d/2)
            assert len(view['circles'])==2
        else:
            assert n==72 and len(view['circles'])==1 and measured<pi*r*r and measured/(pi*r*r)>.998
            if key.startswith('case-'):ref_areas.append(pi*r*r)
        figs+=1;area_checks+=n
    if table:assert near(ref_areas[2]/ref_areas[0],4)
    if i>=9:
        assert near(ref_areas[1]/ref_areas[0],9 if i==9 else 1/9)
        assert near(ref_areas[2]/ref_areas[0],4 if i==9 else 1/4)
assert len(rows)==11 and figs==77
print('DISK_AREA_TABLE_OK eight source cells, symbolic increase/decrease,',figs,'disk areas and',area_checks,'measured polygon edges.')

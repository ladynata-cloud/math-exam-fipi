"""Measure the 1146 heights, independently recompute both 1147 areas and sum all four 1148 pieces."""
import json
from math import acos, cos, degrees, hypot, isclose, radians, sin, sqrt
from additional_triangle_area import OUT


def sub(a,b):return a[0]-b[0],a[1]-b[1]
def d(a,b):return hypot(*sub(a,b))
def dot(a,b):return a[0]*b[0]+a[1]*b[1]
def det(a,b):return a[0]*b[1]-a[1]*b[0]
def area(a,b,c):return abs(det(sub(b,a),sub(c,a)))/2
def near(a,b):return isclose(a,b,rel_tol=1e-7,abs_tol=.0005)
def ang(a,b,c):
    x,y=sub(a,b),sub(c,b)
    return degrees(acos(max(-1,min(1,dot(x,y)/(hypot(*x)*hypot(*y))))))
data=json.loads(OUT.read_bytes())['lessons']
count=0
for e,(n,part,i) in zip(data,[(1146,None,1),(1147,'а',1),(1147,'б',2),(1148,None,1)],strict=True):
    s=e['source'];assert s['chapter']=='XII' and s['printedPages']==[291] and s['pdfPages']==[292] and s.get('subpart')==part
    assert e['id']==f'atanasyan-7-9-main-{n}-part-{i}' and len([s for s in e['steps'] if 'input' in s])==2
    m=e['visualization']['model'];raw=m['points']
    for key,v in m['views'].items():
        k=2 if key in ('case-3','step-3') else 1 if key in ('case-2','step-2') else 0
        count+=1;suffix='__v'+v['points'][0].split('__v')[1];o=raw['O'+suffix];unit=raw['_unitX'+suffix][0]-o[0]
        assert unit>0 and near(raw['_unitY'+suffix][1]-o[1],unit)
        p={name:tuple((raw[j][z]-o[z])/unit for z in (0,1)) for j in v['points'] for name in m['labels'][j].split('=')}
        if n==1146:
            a,b,c,h,y=(p[t] for t in 'ABCDE')
            side=d(a,b)
            assert near(side,d(a,c)) and near(d(b,h),d(h,c)) and near(ang(b,a,c),60 if k==2 else 30)
            assert near(dot(sub(b,y),sub(c,a)),0) and near(dot(sub(a,h),sub(c,b)),0)
            orig=[.5,sqrt(2+sqrt(3))/2,sqrt(3)/2,(2-sqrt(3))/2,sqrt(2-sqrt(3))]
            xyz=[sqrt(3)/2,sqrt(3)/2,.5,.5,1] if k==2 else orig
            assert all(near(ans,val/side) for ans,val in zip(xyz,[d(b,y),d(a,h),d(a,y),d(y,c),d(b,c)]))
            assert len(v['rightAngles'])==2
        if n==1147:
            a,b,c=(p[t] for t in 'ABC')
            scale=1000 if part=='б' and k!=2 else 1
            side=scale*d(b,c);A=ang(b,a,c);B=ang(a,b,c);C=ang(a,c,b)
            assert near(side,3 if k==2 else [4.125,4100][i-1]*(2 if k==1 else 1))
            assert near(A,90 if k==2 else [64,32][i-1]) and near(B,45 if k==2 else [44,28][i-1]) and near(C,45 if k==2 else [72,120][i-1])
            measured=area(a,b,c)*scale**2
            expected=2.25 if k==2 else [6.253675208435765,6448637.02803842][i-1]*(4 if k==1 else 1)
            assert near(measured,expected) and near(measured,d(b,c)*d(a,p['H'])*scale**2/2)
            lengths=[scale*d(x,y) for x,y in ((a,b),(b,c),(c,a))]
            sem=sum(lengths)/2
            assert near(measured,sqrt(sem*(sem-lengths[0])*(sem-lengths[1])*(sem-lengths[2])))
            if part=='б':assert '6449073' not in e['answer']['accepted'] and '6 449 073' in str(e['steps'])
        if n==1148:
            a,b,c,h,o=(p[t] for t in 'ABCDK')
            measure=sum(area(x,o,y) for x,y in ((a,b),(b,c),(c,h),(h,a)))
            assert near(d(a,c),6) and near(d(b,h),8)
            assert near(measure,24 if k==2 else 12)
            assert near(measure,d(a,c)*d(b,h)*sin(radians(ang(a,o,b)))/2)
trials=0
for alpha in range(5,175,5):
    for v in range(1,9):
        for y in range(1,9):
            A=(v,0);C=(-2,0);B=(y*cos(radians(alpha)),y*sin(radians(alpha)));D=(-3*cos(radians(alpha)),-3*sin(radians(alpha)))
            poly=abs(det(A,B)+det(B,C)+det(C,D)+det(D,A))/2
            assert near(poly,(v+2)*(y+3)*sin(radians(alpha))/2)
            trials+=1
print(f'ADDITIONAL_TRIANGLE_AREA_OK {len(data)} source entries, {count} measured scenes, both original areas independently verified by Heron and the height, {trials} convex quadrilaterals.')

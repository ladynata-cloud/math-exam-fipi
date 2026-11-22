"""Verify retained segments, disjoint concentric rings and outward, true semicircles, including filled areas."""
import json
from math import hypot,isclose,pi,sin

from cut_disks_and_semicircles import OUT


def near(a,b):return isclose(a,b,abs_tol=.0003)
def dist(p,q):return hypot(p[0]-q[0],p[1]-q[1])
def sub(p,q):return p[0]-q[0],p[1]-q[1]
def det(p,q):return p[0]*q[1]-p[1]*q[0]
def area(pts):return abs(sum(det(a,b) for a,b in zip(pts,pts[1:]+pts[:1],strict=True)))/2


cards=json.loads(OUT.read_bytes())['lessons'];scenes=parts=0
for i,c in enumerate(cards):
    n=1214+i;s=c['source'];assert s['chapter']=='XIII' and s['printedPages']==[309] and s['pdfPages']==[310] and s['exercise']==str(n)
    assert c['answer']['mode']==('manual' if n==1216 else 'exact')
    m=c['visualization']['model'];raw=m['points']
    for key,v in m['views'].items():
        ids={name:k for k in v['points'] for name in m['labels'][k].split('=')};origin=raw[ids['A']];u=dist(raw[ids['U']],raw[ids['W']])
        rc=lambda k:tuple(x/u for x in sub(raw[k],origin));p=lambda name:rc(ids[name])
        polys=[[rc(k) for k in loop] for loop in v['polygons']]
        total=sum(area(q) for q in polys);parts+=len(polys);scenes+=1
        if n==1214:
            assert len(polys)==4;R=dist(p('T'),p('A'));assert near(R,2 if key.endswith('3') else 4)
            for ns in polys:assert len(ns)==20 and all(near(dist(p('T'),q),R) for q in ns)
            assert near(total,38*R*R*sin(pi/38)-2*R*R) and 0< (pi-2)*R*R-total<.07
            assert near(area([p(k) for k in 'ABCD']),2*R*R)
        if n==1215:
            rs=[dist(p('T'),p(k)) for k in 'ABCD'];f=2 if key.endswith('3') else 1
            assert all(near(r,f*j) for j,r in enumerate(rs,1)) and len(v['circles'])==4
            idx=1 if key=='case-4' else 2 if key=='case-5' else 3 if key.endswith(('2','3')) else 0
            assert len(polys)==(1 if idx==0 else 64)
            exact_coeff=(2*idx+1)*f*f
            assert near(total,32*sin(pi/32)*exact_coeff)
        if n==1216:
            assert len(v['rightAngles'])==1 and not v.get('circles')
            sides=[('A','B','H','C'),('B','C','K','A'),('C','A','L','B')]
            cap=[]
            cs=3 if key.endswith('3') else 2 if key.endswith('2') else 1
            for j,(a,b,k,opposite) in enumerate(sides):
                first,last,center=p(a),p(b),p(k);r=dist(first,last)/2
                assert near(dist(first,center),r) and near(dist(last,center),r)
                suffix=ids['A'].split('__v')[1];inter=[rc(f'_arc{j}_{l}__v{suffix}') for l in range(1,32)]
                assert all(near(dist(center,q),r) for q in inter)
                side=det(sub(last,first),sub(p(opposite),first));assert all(side*det(sub(last,first),sub(q,first))<0 for q in inter)
                cap.append(pi*r*r/2)
            assert near(cap[0]+cap[2],cap[1]);want=sum(cap[j] for j in ([0,2] if cs==1 else [1] if cs==2 else [0,1,2]))
            assert near(total/want,sin(pi/32)/(pi/32))
assert scenes==23
print('CUT_DISKS_AND_SEMICIRCLES_OK',scenes,'measured source figures,',parts,'independently integrated pieces including three outward semicircles.')

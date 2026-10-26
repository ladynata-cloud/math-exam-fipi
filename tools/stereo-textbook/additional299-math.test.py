"""Independent geometric oracles for the actual Atanasyan 299–314 tasks.

Cross products, orthogonal projections and convex-edge intersections verify
the authored models independently of the school-geometric written proofs.
The printed answer for309 conflicts with its condition; the condition gives20.
This is checked numerically and geometrically, not copied from an answer key.
"""
import itertools
import json
import math
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
IDS = ['0299','0300','0301','0302','0303','0304','0305','0306',
       '0307-a','0307-b','0308','0309','0310','0311-a','0311-b','0312','0313','0314']
CARDS = {k: json.loads((ROOT/f'stereo-course/textbook/lessons/ex-main-{k}.json').read_text()) for k in IDS}

def close(a,b,msg):
    assert np.allclose(a,b,rtol=1e-8,atol=1e-8),(msg,a,b)
def length(v): return float(np.linalg.norm(v))
def unit(v):
    assert length(v)>1e-10,'nonzero direction'
    return v/length(v)
def normal(a,b,c): return unit(np.cross(b-a,c-a))
def perp(a,b,msg): close(np.dot(unit(a),unit(b)),0,msg)
def angle(a,b): return math.acos(float(np.clip(np.dot(unit(a),unit(b)),-1,1)))
def foot(p,a,b): return a+np.dot(p-a,b-a)/np.dot(b-a,b-a)*(b-a)
def line_distance(p,a,b): return length(p-foot(p,a,b))
def plane_distance(p,a,b,c): return abs(float(np.dot(p-a,normal(a,b,c))))
def triangle(a,b,c): return length(np.cross(b-a,c-a))/2
def area(vertices):
    ps=np.array(vertices);o=ps.mean(axis=0);n=normal(ps[0],ps[1],ps[2])
    for p in ps: close(np.dot(p-ps[0],n),0,'planar section')
    x=unit(ps[0]-o);y=np.cross(n,x)
    ps=sorted(ps,key=lambda p:math.atan2(np.dot(p-o,y),np.dot(p-o,x)))
    return sum(triangle(o,ps[i],ps[(i+1)%len(ps)]) for i in range(len(ps)))
def same_points(got,want,msg):
    assert len(got)==len(want),msg
    assert all(any(np.allclose(p,q,rtol=1e-8,atol=1e-8) for q in want) for p in got),msg
def section(vertices,edges,p,n):
    found=[]
    def add(q):
        if not any(np.allclose(q,r,rtol=1e-8,atol=1e-8) for r in found):found.append(q)
    for i,j in edges:
        a,b=vertices[i],vertices[j];da=float(np.dot(a-p,n));db=float(np.dot(b-p,n))
        if abs(da)<1e-8:add(a)
        if abs(db)<1e-8:add(b)
        if da*db<0:add(a+da/(da-db)*(b-a))
    return found
def dihedral(u,v,x,y):
    # Interior half-plane rays, not abs(normal dot normal), preserve obtuse angles.
    w=unit(v-u);px=x-u-np.dot(x-u,w)*w;py=y-u-np.dot(y-u,w)*w
    return angle(px,py)
def regular(p,names,tip):
    vs=[p[k] for k in names];o=np.mean(vs,axis=0);s=length(vs[1]-vs[0]);n=normal(*vs[:3])
    close([length(vs[(i+1)%len(vs)]-vs[i]) for i in range(len(vs))],[s]*len(vs),'regular base sides')
    close([length(v-o) for v in vs],[length(vs[0]-o)]*len(vs),'regular base radii')
    close(np.cross(p[tip]-o,n),[0,0,0],'apex above centre');h=length(p[tip]-o);assert h>0
    return o,s,h,length(p[tip]-vs[0])
def side_area(p,names,tip): return sum(triangle(p[tip],p[names[i]],p[names[(i+1)%len(names)]]) for i in range(len(names)))
def pts(k): return {name:np.array(x,dtype=float) for name,x in CARDS[k]['visualization']['model']['points'].items()}
def tri_pyramid(a,h,tip='S'):
    r=a/math.sqrt(3)
    p={k:np.array([r*math.cos(2*math.pi*i/3),r*math.sin(2*math.pi*i/3),0.]) for i,k in enumerate('ABC')}
    p[tip]=np.array([0.,0.,h]);return p
def square_pyramid(a,h,tip='S'):
    p={k:np.array(x,dtype=float) for k,x in zip('ABCD',[[-a/2,-a/2,0],[a/2,-a/2,0],[a/2,a/2,0],[-a/2,a/2,0]])}
    p[tip]=np.array([0.,0.,h]);return p

def check299(p):
    o,a,h,b=regular(p,'ABC','S');sb=triangle(p['A'],p['B'],p['C']);sl=side_area(p,'ABC','S')
    close(sl,2*sb,'299 given area ratio');close(h,a/2,'299 height')
    if 'O'in p:close(p['O'],o,'299 centre')
    if 'M'in p:close(p['M'],(p['B']+p['C'])/2,'299 apothem foot')
def check300(p):
    o,a,h,b=regular(p,'ABC','D');e=(p['B']+p['C'])/2;f=(p['A']+p['B'])/2;r=(p['A']+p['D'])/2;q=(p['D']+p['C'])/2
    for name,want in [('E',e),('F',f),('P',r),('Q',q)]:
        if name in p:close(p[name],want,'300 midpoint '+name)
    if 'M'in p:close(p['M'],(p['A']+p['C'])/2,'300 opposite-edge normal-plane midpoint')
    if 'O'in p:close(p['O'],o,'300 centre')
    cut=section(p,list(itertools.combinations('ABCD',2)),e,normal(e,f,r));same_points(cut,[e,f,r,q],'300 exact four edge intersections')
    perp(e-f,r-f,'300 rectangle');close(area(cut),a*b/4,'300 section area');assert b>a/math.sqrt(3)
def check301(p):
    o,a,h,b=regular(p,'ABC','D');k=foot(p['B'],p['A'],p['D']);d=length(p['B']-k)
    close(foot(p['C'],p['A'],p['D']),k,'301 common perpendicular foot')
    close(dihedral(p['A'],p['D'],p['B'],p['C']),2*math.pi/3,'301 interior120 not acute60')
    t=float(np.dot(k-p['A'],p['D']-p['A'])/b**2);close(t,4/3,'301 foot beyond apex D');assert t>1
    if 'K'in p:close(p['K'],k,'301 authored external foot')
    for name,want in [('M',(p['B']+p['C'])/2),('N',(p['A']+p['B'])/2),('O',o)]:
        if name in p:close(p[name],want,'301 helper '+name)
    apothem=length(p['D']-(p['B']+p['C'])/2)
    close(a,d*math.sqrt(3),'301 base side');close(b,d*3*math.sqrt(2)/4,'301 lateral edge')
    close(apothem,d*math.sqrt(6)/4,'301 apothem from supporting-line distance')
    close(h,d*math.sqrt(2)/4,'301 positive height');assert apothem>h
def check302(p):
    a,b,c,d,s=(p[k] for k in 'ABCDS');close(a+c,b+d,'302 parallelogram');o=(a+c)/2
    sides=sorted([length(b-a),length(d-a)]);scale=sides[0]/3;close(sides,[3*scale,7*scale],'302 sides3and7')
    ds=sorted([length(c-a),length(d-b)]);close(ds,[6*scale,4*math.sqrt(5)*scale],'302 diagonals')
    close(np.cross(s-o,normal(a,b,c)),[0,0,0],'302 height through diagonal intersection');close(length(s-o),4*scale,'302 height4')
    close(sorted(length(s-x) for x in [a,b,c,d]),[5*scale,5*scale,6*scale,6*scale],'302 lateral edges')
    if 'O'in p:close(p['O'],o,'302 centre')
def check303(p):
    a,b,c,d,s=(p[k] for k in 'ABCDS');base=[a,b,c,d];edge=length(b-a);h=length(s-a)
    close(a+c,b+d,'303 rhombus parallelogram');close([length(base[(i+1)%4]-base[i]) for i in range(4)],[edge]*4,'303 rhombus sides')
    close(np.cross(s-a,normal(a,b,c)),[0,0,0],'303 vertical edge SA')
    close(dihedral(a,s,b,d),2*math.pi/3,'303 internal120')
    for u,v in [(b,c),(c,d)]:
        f=foot(a,u,v);perp(s-f,v-u,'303 inclined face altitude');close(angle(s-f,a-f),math.pi/6,'303 inclined30')
    close(edge,2*h,'303 side from height');total=area(base)+side_area(p,'ABCD','S')
    close(total,2*h*h*(3+math.sqrt(3)),'303 full surface')
    if 'K'in p:close(p['K'],foot(a,b,c),'303 K foot')
    if 'L'in p:close(p['L'],foot(a,c,d),'303 L foot')
def check304(p):
    o,a,h,b=regular(p,'ABCD','S');close(b,a,'304 equilateral lateral faces')
    m=(p['A']+p['B'])/2;t=(p['S']+p['A'])/2
    theta=angle(p['S']-m,o-m);phi=dihedral(p['S'],p['A'],p['B'],p['D'])
    close(math.cos(theta),1/math.sqrt(3),'304 base dihedral cosine');close(math.cos(phi),-1/3,'304 signed lateral cosine')
    assert phi>math.pi/2;close(phi,2*theta,'304 requested double angle')
    if 'T'in p:close(p['T'],t,'304 midpoint lateral edge')
    if 'O'in p:close(p['O'],o,'304 centre')
    if 'M'in p:close(p['M'],m,'304 apothem foot')
    perp(p['B']-t,p['S']-p['A'],'304 normal section');perp(p['D']-t,p['S']-p['A'],'304 normal section')
def check305(p):
    o,a,h,b=regular(p,'ABCD','S');alpha=angle(p['A']-p['S'],p['B']-p['S'])
    assert 0<alpha<math.pi/2;close(h*h,b*b*math.cos(alpha),'305 exact existence relation')
    close(side_area(p,'ABCD','S'),2*h*h*math.tan(alpha),'305 lateral area')
    if 'O'in p:close(p['O'],o,'305 centre')
    if 'M'in p:close(p['M'],(p['A']+p['B'])/2,'305 apothem foot')
def check306(p):
    o,a,h,b=regular(p,'ABCD','S');m=(p['A']+p['B'])/2;nf=normal(p['S'],p['A'],p['B'])
    phi=math.asin(abs(float(np.dot(unit(o-p['S']),nf))))
    close(phi,angle(o-p['S'],m-p['S']),'306 height-to-face angle');assert 0<phi<math.pi/2
    if 'O'in p:close(p['O'],o,'306 centre')
    if 'M'in p:close(p['M'],m,'306 apothem foot')
    if 'Q'in p:
        q=foot(o,p['S'],m);close(p['Q'],q,'306 actual projection Q');close(np.cross(o-q,nf),[0,0,0],'306 perpendicular to entire face')
    total=a*a+side_area(p,'ABCD','S');close(total,4*h*h*math.sin(phi)/(1-math.sin(phi)),'306 full surface')
def check307(p):
    o,a,h,b=regular(p,'ABCD','M');n=unit(np.cross(p['D']-p['B'],p['A']-p['M']));k=(p['M']+p['C'])/2
    edges=[('A','B'),('B','C'),('C','D'),('D','A')]+[('M',x) for x in 'ABCD']
    cut=section(p,edges,p['B'],n);same_points(cut,[p['B'],p['D'],k],'307 exact triangular section')
    close(area(cut),a*b*math.sqrt(2)/4,'307 section area')
    close(plane_distance(p['M'],p['B'],p['D'],k),plane_distance(p['C'],p['B'],p['D'],k),'307 equal distances')
    assert np.dot(p['M']-p['B'],n)*np.dot(p['C']-p['B'],n)<0,'307 vertices on opposite sides'
    if 'K'in p:close(p['K'],k,'307 actual midpoint K')
    if 'O'in p:close(p['O'],o,'307 centre')
    if 'H'in p:
        hh=foot(p['M'],o,k);tt=foot(p['C'],o,k)
        close(p['H'],hh,'307 actual foot H');close(p['T'],tt,'307 actual foot T')
        close(hh+tt,2*k,'307 symmetric feet including coincident special case')
def check308(p):
    base=[p[k] for k in 'ABCD'];o=sum(base)/4;s=p['M'];scale=length(base[1]-base[0])/5
    close(base[0]+base[2],base[1]+base[3],'308 rhombus');close([length(base[(i+1)%4]-base[i]) for i in range(4)],[5*scale]*4,'308 sides5')
    close(sorted([length(base[2]-base[0]),length(base[3]-base[1])]),[6*scale,8*scale],'308 diagonals6and8')
    close(np.cross(s-o,normal(*base[:3])),[0,0,0],'308 height centre');close(length(s-o),3.2*scale,'308 height3.2')
    if 'O'in p:close(p['O'],o,'308 centre')
    close([line_distance(s,base[i],base[(i+1)%4]) for i in range(4)],[4*scale]*4,'308 all four lateral altitudes')
    for i,name in enumerate('EFGH'):
        if name in p:close(p[name],foot(s,base[i],base[(i+1)%4]),'308 actual face-altitude foot '+name)
def check309(p,source=True):
    a,b,c,s=(p[k] for k in 'ABCM');u=length(b-a);v=length(c-a);perp(b-a,c-a,'309 right triangle')
    assert u<v;close([length(s-a),length(s-b),length(s-c)],[length(s-a)]*3,'309 equal lateral edges')
    o=(b+c)/2;h=length(s-o);close(np.cross(s-o,normal(a,b,c)),[0,0,0],'309 height foot circumcentre')
    t=(s+o)/2;n=normal(a,b,t);cut=section(p,list(itertools.combinations('ABCM',2)),a,n);k=(2*s+c)/3
    # From S toward C, the section intersects at parameter1/3.
    same_points(cut,[a,b,k],'309 section through smaller leg and mid-height')
    for name,want in [('O',o),('P',t),('K',k),('T',(s+2*c)/3),('R',(2*o+c)/3)]:
        if name in p:close(p[name],want,'309 authored auxiliary point '+name)
    if 'Q'in p:close(p['Q'],foot(k,a,b),'309 actual altitude foot Q')
    expected=u*math.sqrt(v*v+h*h)/3;close(area(cut),expected,'309 direct geometric section area')
    if source:
        scale=u/6;close(v,8*scale,'309 source longer leg8');close(h,6*scale,'309 source height6');close(area(cut),20*scale*scale,'309 condition gives20, not printed80/3')
        assert not math.isclose(area(cut),80/3*scale*scale),'309 printed answer is not silently accepted'
def check310(p):
    a,b,c,d=(p[k] for k in 'ABCD');scale=length(d-a)/8;close(np.cross(d-a,normal(a,b,c)),[0,0,0],'310 perpendicular lateral edge')
    close([length(b-a),length(c-a),length(c-b)],[25*scale,25*scale,40*scale],'310 given base')
    close(side_area(p,'ABC','D'),540*scale*scale,'310 lateral surface')
    if 'K'in p:close(p['K'],(b+c)/2,'310 face altitude foot')
def check311(p):
    a,b,c,d=(p[k] for k in 'ABCD');scale=length(d-a)/9;close(np.cross(d-a,normal(a,b,c)),[0,0,0],'311 perpendicular lateral edge')
    close([length(c-a),length(b-a),length(c-b)],[13*scale,15*scale,14*scale],'311 source triangle')
    h=foot(a,b,c);close(length(a-h),12*scale,'311 base altitude');close(length(d-h),15*scale,'311 face altitude')
    k=foot(a,d,h);close(np.cross(a-k,normal(b,d,c)),[0,0,0],'311 foot on altitude is normal to face')
    close(length(a-k),7.2*scale,'311 perpendicular length');t=np.dot(k-h,d-h)/np.dot(d-h,d-h);close(t,16/25,'311 foot inside altitude')
    if 'H'in p:close(p['H'],h,'311 authored altitude foot')
    if 'K'in p:close(p['K'],k,'311 authored perpendicular foot')
    if 'L'in p:
        close(p['L'],d+(1-t)*(b-d),'311 L lies on DB at correct height')
        close(np.cross(p['L']-k,b-c),[0,0,0],'311 KL parallel BC')
    close(triangle(a,b,c)+side_area(p,'ABC','D'),315*scale*scale,'311 total surface')
def check312(p,names):
    o,a,h,b=regular(p,names,'S');m=(p[names[0]]+p[names[1]])/2;r=length(m-o);r_big=length(p[names[0]]-o)
    phi=math.atan2(h,r);theta=math.atan2(h,r_big);n=len(names)
    close(r/r_big,math.cos(math.pi/n),'312 inradius/circumradius');close(math.tan(theta),math.tan(phi)*math.cos(math.pi/n),'312 arbitrary n formula')
    if 'O'in p:close(p['O'],o,'312 centre')
    if 'M'in p:close(p['M'],m,'312 apothem foot')
def frustum(p,names):
    lo=[p[k] for k in names];hi=[p[k+'1'] for k in names];o=np.mean(lo,axis=0);o1=np.mean(hi,axis=0);n=normal(*lo[:3]);h=length(o1-o)
    close(np.cross(o1-o,n),[0,0,0],'frustum centred parallel bases');assert h>0
    a=length(lo[1]-lo[0]);b=length(hi[1]-hi[0]);assert a>b>0
    for i in range(len(names)):
        close(hi[i]-o1,(b/a)*(lo[i]-o),'corresponding homothety radii')
        close(length(lo[(i+1)%len(names)]-lo[i]),a,'regular lower edges')
    if 'O'in p:close(p['O'],o,'frustum lower centre')
    if 'O1'in p:close(p['O1'],o1,'frustum upper centre')
    index=1 if len(names)==3 else 0
    mm=(lo[index]+lo[index+1])/2;nn=(hi[index]+hi[index+1])/2
    for name,want in [('M',mm),('N',nn),('H',nn-(o1-o))]:
        if name in p:close(p[name],want,'frustum auxiliary '+name)
    area_side=sum(area([lo[i],lo[(i+1)%len(names)],hi[(i+1)%len(names)],hi[i]]) for i in range(len(names)))
    l=length((lo[0]+lo[1]-hi[0]-hi[1])/2)
    close(area_side,len(names)*(a+b)*l/2,'frustum true trapezoid area')
    close(l*l,h*h+((a-b)/(2*math.tan(math.pi/len(names))))**2,'frustum apothem from inradius difference')
    return a,b,h,l,area_side
def check313(p):
    a,b,h,l,s=frustum(p,'ABC');scale=a/12;close([b,h,l,s],[6*scale,scale,2*scale,54*scale*scale],'313 exact source frustum')
def check314(p):
    a,b,h,l,s=frustum(p,'ABCD');scale=h/63;close([l,a/b,a,b],[65*scale,7/3,56*scale,24*scale],'314 apothem-height-ratio solve')

# Every authored view must use finite, nondegenerate, planar geometric data.
polygons=segments=0
for key in IDS:
    m=CARDS[key]['visualization']['model'];p=pts(key)
    for seq in [m['edges']]+[v.get('segments',[]) for v in m['views'].values()]:
        for a,b in seq:assert length(p[a]-p[b])>1e-8;segments+=1
    for poly in m.get('faces',[])+[v['polygon'] for v in m['views'].values() if 'polygon'in v]:
        vertices=[p[x] for x in poly];assert area(vertices)>1e-8
        n=normal(*vertices[:3])
        # Respect the authored cyclic order; sorting for area must not hide a
        # bow-tie or a concave/misordered highlighted quadrilateral.
        turns=[float(np.dot(np.cross(vertices[(i+1)%len(poly)]-vertices[i],vertices[(i+2)%len(poly)]-vertices[(i+1)%len(poly)]),n)) for i in range(len(poly))]
        assert all(t>1e-8 for t in turns),'convex polygon in authored cyclic order'
        polygons+=1

for key,fn in [('0299',check299),('0300',check300),('0301',check301),('0302',check302),('0303',check303),('0304',check304),('0305',check305),('0306',check306),('0307-a',check307),('0307-b',check307),('0308',check308),('0309',check309),('0310',check310),('0311-a',check311),('0311-b',check311),('0313',check313),('0314',check314)]:fn(pts(key))
check312(pts('0312'),'ABCDE')

# Numeric models described as exact must also preserve the source scale.
# The303 illustration explicitly uses scale1:6; its shape is checked above.
close(line_distance(pts('0301')['B'],pts('0301')['A'],pts('0301')['D']),16,'301 exact source scale')
close(length(pts('0302')['S']-pts('0302')['O']),4,'302 exact source scale')
close(length(pts('0308')['M']-pts('0308')['O']),3.2,'308 exact source scale')
close(length(pts('0309')['M']-pts('0309')['O']),6,'309 exact source scale')
close(length(pts('0310')['D']-pts('0310')['A']),8,'310 exact source scale')
for key in ['0311-a','0311-b']:close(length(pts(key)['D']-pts(key)['A']),9,'311 exact source scale')
close(length(pts('0313')['O1']-pts('0313')['O']),1,'313 exact source scale')
close(length(pts('0314')['O1']-pts('0314')['O']),63,'314 exact source scale')

# General families vary sizes, heights, base shape and polygon count. Fixed
# source configurations are tested at multiple scales; free-angle problems
# use non-special values rather than regular-tetrahedron/cube assumptions.
rng=np.random.default_rng(299314)
for _ in range(160):
    a,h=rng.uniform(.4,15,size=2)
    check299(tri_pyramid(a,a/2));check300(tri_pyramid(a,h,'D'))
    d=rng.uniform(.4,20);check301(tri_pyramid(d*math.sqrt(3),d*math.sqrt(2)/4,'D'))
    k=rng.uniform(.2,4)
    check302({n:np.array(x)*k for n,x in {'A':[-3,0,0],'B':[-10/3,4*math.sqrt(5)/3,0],'C':[3,0,0],'D':[10/3,-4*math.sqrt(5)/3,0],'S':[0,0,4]}.items()})
    check303({n:np.array(x)*k for n,x in {'A':[0,0,0],'B':[24,0,0],'C':[12,12*math.sqrt(3),0],'D':[-12,12*math.sqrt(3),0],'S':[0,0,12]}.items()})
    check304(square_pyramid(a,a/math.sqrt(2)));check305(square_pyramid(a,h));check306(square_pyramid(a,h));check307(square_pyramid(a,h,'M'))
    check308({n:np.array(x)*k for n,x in {'A':[3,0,0],'B':[0,4,0],'C':[-3,0,0],'D':[0,-4,0],'M':[0,0,3.2]}.items()})
    u,v=sorted(rng.uniform(.5,20,size=2));hh=float(rng.uniform(.5,20))
    check309({'A':np.array([0.,0,0]),'B':np.array([u,0.,0]),'C':np.array([0.,v,0]),'M':np.array([u/2,v/2,hh])},False)
    check310({n:np.array(x)*k for n,x in {'A':[0,15,0],'B':[-20,0,0],'C':[20,0,0],'D':[0,15,8]}.items()})
    check311({n:np.array(x)*k for n,x in {'A':[5,12,0],'B':[14,0,0],'C':[0,0,0],'D':[5,12,9]}.items()})
    for n in range(3,13):
        names=[str(i) for i in range(n)];p={name:np.array([a*math.cos(2*math.pi*i/n),a*math.sin(2*math.pi*i/n),0.]) for i,name in enumerate(names)};p['S']=np.array([0.,0.,h]);check312(p,names)
    for n,aa,bb,hh in [(3,12*k,6*k,k),(4,56*k,24*k,63*k)]:
        names='ABCD'[:n];r=aa/(2*math.sin(math.pi/n));p={name:np.array([r*math.cos(2*math.pi*i/n),r*math.sin(2*math.pi*i/n),0.]) for i,name in enumerate(names)}
        p.update({name+'1':p[name]*(bb/aa)+np.array([0.,0.,hh]) for name in names})
        (check313 if n==3 else check314)(p)

for a in [.1,1,20]:
    # Boundary height0 is excluded even when a planar triangle exists.
    close((a/math.sqrt(3))**2-a*a/3,0,'300 degenerate bound');close((a/math.sqrt(2))**2-a*a/2,0,'307 degenerate bound')
    # The normal-foot symmetry proof must include b=a, when H=T=K.
    p=square_pyramid(a,a/math.sqrt(2),'M');o=np.zeros(3);k=(p['M']+p['C'])/2
    p.update({'O':o,'K':k,'H':k.copy(),'T':k.copy()});check307(p)
print(f'ATANASYAN_ADDITIONAL_299_314_MATH_OK: 18 actual models; 160 parameter families; n3–12; signed internal301/304 dihedrals; exact sections300/307/309; {polygons} planar polygons; {segments} nonzero segments')

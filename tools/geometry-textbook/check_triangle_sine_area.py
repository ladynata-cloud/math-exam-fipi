"""Independent measurements of printed examples, alternative triangles, heights, slopes and observation angles."""
import json
from math import acos, atan2, cos, degrees, hypot, isclose, pi, radians, sin, sqrt
from triangle_sine_area import ROOT

DATA=ROOT/'geometry-course/textbook/data'
cards=[c for name in ['triangle-sine-area','triangle-relations'] for c in json.loads((DATA/(name+'.json')).read_bytes())['lessons']]
pages={104:[276],105:[277],106:[277,278],107:[278,279,280],108:[280,281]}
near=lambda a,b:isclose(a,b,abs_tol=.003)
def displacement(a,b):return b[0]-a[0],b[1]-a[1]
def length(a,b):return hypot(*displacement(a,b))
def cross(a,b):return a[0]*b[1]-a[1]*b[0]
def dot(a,b):return a[0]*b[0]+a[1]*b[1]
def signed_area(a,b,c):return cross(displacement(a,b),displacement(a,c))/2
def angle(a,b,c):
    u=displacement(b,a);v=displacement(b,c)
    return degrees(acos(max(-1,min(1,dot(u,v)/(hypot(*u)*hypot(*v))))))
expected_ids=[(104,None),(1109,'а'),(1109,'б'),(1109,'в'),(1110,None),(1111,None),(1112,None),(1113,'а'),(1113,'б'),(105,None),(106,None),(107,None),(108,None)]
count=0
for entry,(n,part) in zip(cards,expected_ids,strict=True):
    s=entry['source'];ii='абв'.index(part) if part else 0
    assert entry['id']==f'atanasyan-7-9-{"theory" if n<1000 else "main"}-{n}-part-{ii+1}'
    pp=pages.get(n,[281]);assert s['printedPages']==pp and s['pdfPages']==[page+1 for page in pp]
    assert s['chapter']=='XII' and s.get('subpart')==part
    m=entry['visualization']['model']
    for key,view in m['views'].items():
        count+=1
        suf='__v'+view['points'][0].split('__v')[1];src=m['points'];o=src['O'+suf];unit=src['_unitX'+suf][0]-o[0]
        assert unit>0 and near(src['_unitY'+suf][1]-o[1],unit)
        def xy(p):return ((src[p][0]-o[0])/unit,(src[p][1]-o[1])/unit)
        p={lab:xy(idx) for idx in view['points'] for lab in m['labels'][idx].split('=')}
        fresh=key in ('step-3','case-3');middle=key in ('step-2','case-2')
        if all(name in p for name in 'ABC'):
            A,B,C=(p[name] for name in 'ABC')
            measured=abs(signed_area(A,B,C))
            a,b,c=length(B,C),length(A,C),length(A,B)
            assert near(measured,.5*b*c*sin(radians(angle(B,A,C))))
        if n==104:
            assert near(a,5 if fresh else 6) and near(b,3 if fresh else 4) and near(angle(A,C,B),90 if fresh else 120 if middle else 30)
            assert near(length(A,p['H']),b*sin(radians(angle(A,C,B))))
        if n==105:
            assert near(a,10 if fresh else 5)
            for label,side,opposite in [('A',a,angle(B,A,C)),('B',b,angle(A,B,C)),('C',c,angle(A,C,B))]:
                assert near(side/sin(radians(opposite)),a)
            if fresh or middle:assert all(near(length(p['K'],p[t]),a/2) for t in 'ABC') and len(view['circles'])==1
        if n==106:
            assert near(c*c,25 if fresh else 37 if middle else 13)
        if n==107 and key=='case-4':
            assert near(a,7) and near(b,24) and near(c,23) and near(cos(radians(angle(B,A,C))),22/23)
        if n==108 and fresh:assert near(c,8) and near(angle(B,A,C),45) and near(b,4*sqrt(2))
        if n==108 and not fresh:assert near(length(p['H'],p['A']),4) and near(length(p['H'],p['B']),4)
        if n==1109:
            names=['ABC','BCA','CBA'][ii];v,u,t=(p[name] for name in names)
            assert near(length(v,u),[6*sqrt(8),3,7][ii]) and near(length(v,t),[4,18*sqrt(2),14][ii]*(2 if fresh else 1))
            assert near(angle(u,v,t),[60,45,48][ii]) and near(measured,[12*sqrt(6),27,49*sin(radians(48))][ii]*(2 if fresh else 1))
        if n==1110:
            D=p['D'];assert near(abs(signed_area(A,B,D))+abs(signed_area(B,C,D)),12) and near(length(D,p['H']),2)
        if n==1111:assert near(measured,30 if fresh else 60) and near(length(A,B),8 if fresh else 16)
        if n==1112:
            D,K=p['D'],p['K'];d=8 if fresh else 10;target=32 if fresh else 25
            assert near(length(A,C),d) and near(length(B,D),d) and all(near(length(K,p[t]),d/2) for t in 'ABCD')
            assert near(2*measured,target) and near(min(angle(A,K,B),180-angle(A,K,B)),90 if fresh else 30)
        if n==1113:
            H=p['H']
            assert near(dot(displacement(A,C),displacement(B,H)),0)
            if 'K' in p:assert near(dot(displacement(A,B),displacement(C,p['K'])),0)
            hb=length(B,H);hc=2*measured/length(A,B);alpha,beta=map(radians,(angle(B,A,C),angle(C,B,A)))
            assert near(measured,hb*hc/(2*sin(alpha))) and near(measured,hb*hb*sin(beta)/(2*sin(alpha)*sin(alpha+beta)))
            assert near(measured,(6 if fresh else 12) if ii==0 else (8 if fresh else 3*sqrt(3)))
checks=0
for a in (1,2,3,5,8):
    for b in (1,3,4,7):
        for k in range(1,180):
            th=radians(k);A=(0,0);B=(a,0);C=(b*cos(th),b*sin(th))
            S=abs(signed_area(A,B,C));c=length(B,C)
            assert near(2*S,a*b*sin(th)) and near(c*c,a*a+b*b-2*a*b*cos(th))
            checks+=1
print(f'TRIANGLE_SINE_AREA_OK {len(cards)} source entries, {count} measured scenes and {checks} independent triangles.')

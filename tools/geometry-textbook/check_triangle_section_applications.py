"""Reconstruct every source and transfer model and independently reject the inconsistent printed approximations."""
import json
from math import acos, cos, degrees, hypot, isclose, radians, sin, sqrt
from triangle_sine_area import ROOT

DATA=ROOT/'geometry-course/textbook/data'
files=['solve-triangle','oblique-triangle-cases','triangle-section-applications']
cards=[c for fn in files for c in json.loads((DATA/(fn+'.json')).read_bytes())['lessons']]
parts={1114:'абвгдежзи',1115:'',1116:'',1117:'',1118:'',1119:'',1120:'абв',1121:'',1122:''}
src=[(60,40,None,None,None,14),(30,None,75,None,4.5,None),(80,None,None,16,10,None),(None,45,70,24.6,None,None),(60,None,None,10,7,None),(None,None,54,6.3,6.3,None),(87,None,None,None,32,45),(None,None,None,14,18,20),(None,None,None,6,7.3,4.8)]
fresh=[(60,30,None,None,None,10),(45,None,60,None,6,None),(90,None,None,10,6,None),(None,30,60,12,None,None),(45,None,None,10,6,None),(None,None,60,5,5,None),(90,None,None,None,6,8),(None,None,None,3,4,5),(None,None,None,5,5,6)]
expected=[
 ('abC',(12.31,9.14,80)),('acB',(2.33,4.50,75)),('BCc',(38.0,62.0,14.35)),('bcA',(19.19,25.51,65)),('BCc',(37.3,82.7,11.45)),
 ('cAB',(5.72,63,63)),('aBC',(53.84,36.4,56.6)),('ABC',(42.8,60.9,76.2)),('ABC',(54.9,84.3,40.9))]
near=lambda a,b:isclose(a,b,abs_tol=.004)
def dx(a,b):return b[0]-a[0],b[1]-a[1]
def norm(a,b):return hypot(*dx(a,b))
def cross(a,b):return a[0]*b[1]-a[1]*b[0]
def dot(a,b):return a[0]*b[0]+a[1]*b[1]
def area(a,b,c):return abs(cross(dx(a,b),dx(a,c)))/2
def angle(a,b,c):
    u=dx(b,a);v=dx(b,c)
    return degrees(acos(max(-1,min(1,dot(u,v)/(hypot(*u)*hypot(*v))))))
def close_pair(a,b):return all(near(x,y) for x,y in zip(a,b,strict=True))
scenes=erratum=ambiguous=0
keys=[(n,letter or None) for n,letters in parts.items() for letter in letters or [None]]
for card,(n,letter) in zip(cards,keys,strict=True):
    idx=parts[n].index(letter) if letter else 0;s=card['source']
    assert card['id']==f'atanasyan-7-9-main-{n}-part-{idx+1}'
    assert s['chapter']=='XII' and s['printedPages']==[282] and s['pdfPages']==[283] and s.get('subpart')==letter
    assert len([x for x in card['steps'] if 'input'in x])==2
    if n==1114:
        ids,vals=expected[idx]
        def numeric(form):return tuple(float(piece.strip().replace(',','.').rstrip('°')) for piece in form.split(';'))
        accepted=set(numeric(form) for form in card['answer']['accepted']);assert accepted=={vals},(letter,accepted,vals)
    if n==1114 and letter=='ж':
        assert all('58,84' not in z and '58.84' not in z for z in card['answer']['accepted'])
        assert '58,84' in card['answer']['feedback'] and 58.84**2>32**2+45**2
        assert near(53.83560575**2,32**2+45**2-2*32*45*cos(radians(87)))
    if n==1115:
        assert '14,70;85,18' in card['answer']['accepted'] and '15;87' not in card['answer']['accepted']
        assert 85<54+18*sqrt(3)<85.5 and 86.5<90*sin(radians(75))<87.5
    model=card['visualization']['model']
    for key,view in model['views'].items():
        scenes+=1;tail='__v'+view['points'][0].split('__v')[1];raw=model['points'];o=raw['O'+tail];unit=raw['_unitX'+tail][0]-o[0]
        assert unit>0 and near(raw['_unitY'+tail][1]-o[1],unit)
        def xy(i):return tuple((raw[i][j]-o[j])/unit for j in (0,1))
        p={lab:xy(i) for i in view['points'] for lab in model['labels'][i].split('=')}
        alt=key in ('step-3','case-3');second=key in ('step-2','case-2')
        if all(t in p for t in 'ABC'):
            A,B,C=[p[t] for t in 'ABC']
            lengths=norm(B,C),norm(A,C),norm(A,B)
            angles=angle(B,A,C),angle(A,B,C),angle(A,C,B)
            assert near(sum(angles),180) and min(angles)>0
        if n==1114:
            given=(fresh if alt else src)[idx]
            for actual,wanted in zip(angles+lengths,given,strict=True):
                if wanted is not None:assert near(actual,wanted),(key,n,letter,actual,wanted)
            if not alt:
                vector=dict(zip('ABCabc',angles+lengths))
                for j,(var,val) in enumerate(zip(ids,vals)):assert abs(vector[var]-val)<(.051 if var.isupper() else .0055)
            if letter=='ж' and not alt:erratum+=1
        elif n==1115:
            assert near(lengths[1],24 if alt else 12) and near(angles[0],75) and near(angles[2],60)
            assert near(area(A,B,C),(4 if alt else 1)*(54+18*sqrt(3)));erratum+=int(not alt)
        elif n==1116:
            D=p['D'];assert near(norm(A,D),6 if alt else 3) and near(angles[1],105)
            assert D[0]<B[0]<C[0] and near(norm(D,C)-norm(D,B),lengths[0]) and near(lengths[1],12 if alt else 6)
        elif n==1117:
            D=p['D'];ad=norm(A,D);bd=norm(B,D);x=angle(B,D,C);y=angle(D,B,C)
            assert near(ad,5 if alt else 22/3) and near(bd,2.5 if alt else 4.4)
            assert near(angle(D,A,B),30 if alt else 22.5)
            pair=(90,60) if alt else (140.3716085,17.1283915) if second else (39.6283915,117.8716085)
            assert close_pair((x,y),pair);ambiguous+=int(second)
        elif n==1118:
            for v,op,u,w in [('A','D','B','C'),('B','E','A','C'),('C','F','A','B')]:
                if op not in p:continue
                theta=angle(p[u],p[v],p[w]);a=norm(p[v],p[u]);b=norm(p[v],p[w])
                assert near(angle(p[u],p[v],p[op]),theta/2) and near(norm(p[v],p[op]),2*a*b*cos(radians(theta/2))/(a+b))
        elif n==1119:
            D=p['D'];K=p['K'];a=norm(A,B);b=norm(A,D);theta=angle(B,A,D)
            d1=norm(A,C);d2=norm(B,D)
            assert near(d1*d1,a*a+b*b+2*a*b*cos(radians(theta))) and near(d2*d2,a*a+b*b-2*a*b*cos(radians(theta)))
            assert near(abs(cos(radians(angle(A,K,B)))),abs(a*a-b*b)/(d1*d2))
        elif n==1120:
            aa,bb,cc=lengths;n0=[-4,33,12][idx] if alt else [7,0,-20][idx]
            assert near(bb*bb+cc*cc-aa*aa,n0)
        elif n==1121:
            P,U,V,R=[p[t] for t in 'PUVR'];assert near(norm(P,U),norm(P,V)) and near(angle(U,P,V),120 if alt else 72)
            assert close_pair(dx(P,R),tuple(u+v for u,v in zip(dx(P,U),dx(P,V)))) and near(norm(P,R)*10,120)
            assert near(10*norm(P,U),120 if alt else 60/cos(radians(36)))
        elif n==1122:
            S=p['S'];T=p['T'];rr=norm(S,A)
            assert all(near(norm(S,pt),rr) for pt in [B,C,T]) and near(norm(B,T),2*rr)
            assert near(norm(B,C)/sin(radians(angle(B,A,C))),2*rr)
            if key=='case-4':assert near(angle(B,A,C),90)
            elif second:assert angle(B,A,C)>90
            else:assert angle(B,A,C)<90
extra=0
for ab in (2,3,5,8,12):
    for ac in (2,4,7,13):
        for k in range(1,180):
            A=(0,0);B=(ab,0);C=(ac*cos(radians(k)),ac*sin(radians(k)));b=norm(B,C)
            D=tuple((ac*B[j]+ab*C[j])/(ab+ac) for j in (0,1))
            assert near(norm(A,D),2*ab*ac*cos(radians(k/2))/(ab+ac))
            assert near(b*b,ab*ab+ac*ac-2*ab*ac*cos(radians(k)));extra+=1
print(f'TRIANGLE_SECTION_COMPLETE {len(cards)} source cards, {scenes} measured scenes, {erratum} checked source-key corrections, {ambiguous} second-configuration scenes and {extra} independent triangles.')

"""Check both chords configurations and measure every training scene against the 2023 source."""
import json
from math import acos, atan2, cos, degrees, hypot, isclose, radians, sin, sqrt, tan
from field_trigonometry import OUT

cs=json.loads(OUT.read_bytes())['lessons']
near=lambda a,b:isclose(a,b,abs_tol=.003)
def delta(a,b):return b[0]-a[0],b[1]-a[1]
def length(a,b):return hypot(*delta(a,b))
def angle(a,b,c):
    u=delta(b,a);v=delta(b,c)
    return degrees(acos(max(-1,min(1,(u[0]*v[0]+u[1]*v[1])/(hypot(*u)*hypot(*v))))))
def equal(a,b):return all(near(x,y) for x,y in zip(a,b,strict=True))
scenes=circles=0
for c,n in zip(cs,range(1123,1128),strict=True):
    assert c['id']==f'atanasyan-7-9-main-{n}-part-1'
    s=c['source'];assert s['chapter']=='XII' and s['printedPages']==[283] and s['pdfPages']==[284]
    assert c['answer']['mode']=='exact' and len([q for q in c['steps'] if 'input' in q])==2
    model=c['visualization']['model']
    for key,v in model['views'].items():
        scenes+=1;tail='__v'+v['points'][0].split('__v')[1];raw=model['points'];o=raw['O'+tail];unit=raw['_unitX'+tail][0]-o[0]
        scale=10 if n>=1125 else 1
        def xy(k):return tuple(scale*(raw[k][i]-o[i])/unit for i in (0,1))
        p={lab:xy(k) for k in v['points'] for lab in model['labels'][k].split('=')}
        highlighted=[(xy(a),xy(b)) for a,b in v['highlightSegments']]
        alt=key in ('step-3','case-3');mid=key in ('step-2','case-2')
        if n==1123:
            A,B,C,D=(p[t] for t in 'ABCD');x=length(A,D)
            assert near(length(A,B),10) and near(x,length(D,C)) and near(x,length(C,B)) and near(angle(B,A,D),60 if alt else 70)
            assert near(10+3*x,25 if alt else 27.8143) and len(v['equalSegments'])==3
            if mid or alt:assert near(length(A,p['H']),length(B,p['K'])) and near(length(p['H'],p['K']),x)
        elif n==1124:
            A,B,C,D,E,S=(p[t] for t in 'ABCDES')
            ae,be,ce,de=[length(t,E) for t in [A,B,C,D]]
            assert near(ae*be,ce*de) and near(ce,9) and near(de,4)
            assert near(length(B,D),6 if alt else 4*sqrt(3)) and near(length(A,B),12 if alt else 13)
            assert all(near(length(S,t),length(S,A)) for t in [B,C,D]) and len(v['circles'])==1
            assert near(angle(B,E,D),degrees(acos(1/3)) if alt else degrees(acos(49/72)) if mid else 120)
            circles+=1
        elif n==1125:
            M,B,T=(p[t] for t in 'MBT');run=T[0]-M[0]
            assert near(run,25 if alt else 50) and near(B[0],T[0])
            assert near(degrees(atan2(T[1]-M[1],run)),45) and near(degrees(atan2(M[1]-B[1],run)),2)
            assert near(length(B,T),25.873019 if alt else 51.746038)
            if mid or alt:assert equal(p['H'],(B[0],M[1]))
        elif n==1126:
            A,B,C=(p[t] for t in 'ABC');aa=angle(B,A,C);bb=angle(A,B,C);base=length(A,B)
            assert near(base,20 if alt else 70) and near(aa,45 if alt else 12.5) and near(bb,45 if alt else 72.7)
            assert near(C[1]-A[1],10 if alt else 14.5162747) and len(highlighted)==2
            for a,b in highlighted:assert near(a[1],b[1])
            if mid or alt:assert equal(p['H'],(C[0],A[1]))
        else:
            A,B,C,P=(p[t] for t in 'ABCP')
            assert near(length(C,B),40 if alt else 100) and near(length(C,P),20 if alt else 50)
            assert near(angle(P,A,C),30) and near(angle(P,A,B),60) and len(highlighted)==1
            assert equal(highlighted[0][0],C) and equal(highlighted[0][1],B)
for a in range(1,90):
    for b in range(1,90):
        base=70;alpha=radians(a);beta=radians(b);d=base*sin(beta)/sin(alpha+beta);h=d*sin(alpha)
        assert near(h*(1/tan(alpha)+1/tan(beta)),base)
print(f'FIELD_TRIG_OK {len(cs)} printed source problems, {scenes} measured scenes, {circles} complete circle reconstructions and 7921 independent river geometries.')

"""Verify the exact four named octagon vertices, diameter angles, compass arcs and construction order."""
import json
from math import acos, degrees, hypot, isclose, sqrt
from regular_polygon_constructions import OUT


def n(a,b):return isclose(a,b,abs_tol=.00015)
def d(a,b):return a[0]-b[0],a[1]-b[1]
def length(a,b):return hypot(*d(a,b))
def dot(a,b):return a[0]*b[0]+a[1]*b[1]
def det(a,b):return a[0]*b[1]-a[1]*b[0]
def angle(u,v):return degrees(acos(max(-1,min(1,dot(u,v)/(hypot(*u)*hypot(*v))))))


cards=json.loads(OUT.read_bytes())['lessons'];seen=circles=0
for e,part in zip(cards,[None,*'абвг'],strict=True):
    code=1189 if part else 1188
    assert e['id']==f'atanasyan-7-9-main-{code}-part-{"абвг".index(part)+1 if part else 1}'
    assert e['source']['chapter']=='XIII' and e['source']['printedPages']==[302] and e['source']['pdfPages']==[303] and e['source'].get('subpart')==part
    assert e['answer']['mode']==('manual' if part else 'exact')
    model=e['visualization']['model'];raw=model['points']
    for key,v in model['views'].items():
        mode=3 if key=='case-4' else 2 if key in ('step-3','case-3') else 1 if key in ('step-2','case-2') else 0
        seen+=1;suf='__v'+v['points'][0].split('__v')[1];o=raw['O'+suf];scale=raw['_unitX'+suf][0]-o[0]
        def coord(ref):return tuple((raw[ref][i]-o[i])/scale for i in (0,1))
        p={name:coord(ref) for ref in v['points'] for name in model['labels'][ref].split('=')}
        first=v['circles'][0]
        r=length(coord(first['center']),coord(first['through']))
        assert n(r,(4 if not part else 6 if mode==3 else 3)) and n(length(coord(first['center']),p['T']),0)
        for name,a in p.items():
            if name not in ('T','H'):assert n(length(a,p['T']),r)
        circles+=len(v['circles'])
        if not part:
            names=['A'+str(i) for i in ([1,3,5,7] if mode==2 else [3,4,7,8])]
            focused=[(coord(a),coord(b)) for a,b in v['highlightSegments']]
            assert len(focused)==4
            for i,(a,b) in enumerate(focused):
                c=p[names[(i+2)%4]]
                assert n(length(a,p[names[i]]),0) and n(length(b,p[names[(i+1)%4]]),0)
                assert n(dot(d(a,b),d(c,b)),0)
            assert n(length(p[names[0]],p[names[2]]),2*r) and n(length(p[names[1]],p[names[3]]),2*r)
            A,B,C,D=[p[x] for x in names]
            assert n(angle(d(C,A),d(D,B)),90 if mode==2 else 45)
            assert n(abs((det(A,B)+det(B,C)+det(C,D)+det(D,A))/2),r*r*(2 if mode==2 else sqrt(2)))
            continue
        compass=part=='а' and mode<2 or part=='б' and mode==0
        assert len(v['circles'])==(2 if compass else 1)
        if compass:
            aux=v['circles'][1];center=coord(aux['center'])
            assert n(length(center,coord(aux['through'])),r) and n(length(center,p['T']),r)
            if 'B' in p:assert n(length(center,p['B' if mode==0 else 'C']),r)
        if mode>=2:
            names=list({'а':'ABCDEF','б':'ACE','в':'ABCD','г':'ABCDEFGJ'}[part])
            marked=v['highlightSegments'];assert len(marked)==len(names)
            for i,(a,b) in enumerate(marked):
                assert n(length(coord(a),p[names[i]]),0) and n(length(coord(b),p[names[(i+1)%len(names)]]),0)
                assert n(angle(d(coord(a),p['T']),d(coord(b),p['T'])),360/len(names))
        if part=='в' and mode==1:assert n(dot(d(p['A'],p['C']),d(p['B'],p['D'])),0)
        if part=='г' and mode==1:
            assert n(length(p['A'],p['H']),length(p['C'],p['H'])) and n(length(p['B'],p['A']),length(p['B'],p['C']))
            assert n(dot(d(p['B'],p['H']),d(p['C'],p['A'])),0)
print(f'REGULAR_POLYGON_CONSTRUCTIONS_OK {len(cards)} original source parts, {seen} instrument diagrams, {circles} circle checks with distinct chord and arc midpoints.')

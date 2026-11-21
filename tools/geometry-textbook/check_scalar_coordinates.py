"""Independently check each displayed coordinate pair, tracked arrow, right-angle mark and degree-minute answer."""
import json
from math import acos, degrees, hypot, isclose, sqrt
from scalar_coordinates import OUT

def diff(a,b):
    return a[0]-b[0],a[1]-b[1]

def dot(a,b):
    return a[0]*b[0]+a[1]*b[1]

def close(x,y):
    return isclose(x,y,abs_tol=.00001)

def cosine(a,b,c):
    u=diff(a,b);v=diff(c,b)
    return dot(u,v)/(hypot(*u)*hypot(*v))

parts={1133:'абв',1134:'',1135:'',1136:'абв',1137:'',1138:''}
tasks=[(n,i,p or None) for n,ps in parts.items() for i,p in enumerate(ps or [None])]
cards=json.loads(OUT.read_bytes())['lessons']
count=marks=0
for entry,(n,idx,part) in zip(cards,tasks,strict=True):
    assert entry['id']==f'atanasyan-7-9-main-{n}-part-{idx+1}'
    s=entry['source']
    assert s['exercise']==str(n) and s['chapter']=='XII' and s['printedPages']==[289] and s['pdfPages']==[290] and s.get('subpart')==part
    assert len([step for step in entry['steps'] if 'input' in step])==2
    ans=entry['answer']
    assert ans['mode']==('manual' if n in (1134,1135) else 'exact')
    m=entry['visualization']['model']
    for key,view in m['views'].items():
        end=key in ('step-3','case-3');mid=key in ('step-2','case-2');count+=1
        raw=m['points'];suffix='__v'+view['points'][0].split('__v')[1];origin=raw['O'+suffix]
        scale=raw['_unitX'+suffix][0]-origin[0]
        assert scale>0 and close(raw['_unitY'+suffix][1]-origin[1],scale)
        pt={m['labels'][j]:tuple((v-t)/scale for v,t in zip(raw[j][:2],origin[:2],strict=True)) for j in view['points']}
        shafts=[(a,b) for a,b in view['highlightSegments'] if not b.startswith('head_')]
        assert len(shafts)==2 and len(view['highlightSegments'])==6
        for mark in view['rightAngles']:
            v=raw[mark['vertex']];a=diff(raw[mark['a']],v);b=diff(raw[mark['b']],v)
            assert close(dot(a,b),0) and hypot(*a)>0 and hypot(*b)>0
            marks+=1
        if n<=1136:
            start=pt['S'] if 'S' in pt else pt['O']
            a=diff(pt['A'],start);b=diff(pt['B'],start)
            if n==1133:
                assert all(close(v,u) for v,u in zip(a,[(.25,-1),(-5,6),(1.5,2)][idx]))
                expected=[(-2,3),(6,-5),(-4,-.5)] if end else [(2,3),(6,5),(4,-.5)]
                assert all(close(v,u) for v,u in zip(b,expected[idx]))
                assert close(dot(a,b),[-3.5,-60,-7][idx] if end else [-2.5,0,5][idx])
            elif n in (1134,1135):
                assert close(dot(a,b),(4 if n==1134 else -3) if end else 0)
                if n==1134 and not end:assert close(a[0],b[1]) and close(a[1],-b[0])
            else:
                assert close(dot(a,b),0 if mid or end else [-30,-2,-3][idx])
                if mid or end:
                    source=[7.5,2/3,0];new=[5,1,0]
                    assert close([b[0],a[0],b[1]][idx],(new if end else source)[idx])
        else:
            a,b,c=(pt[k] for k in 'ABC')
            cosines=[cosine(b,a,c),cosine(c,b,a),cosine(a,c,b)]
            if n==1137:
                if end:assert close(cosines[0],-1/sqrt(50))
                else:assert all(close(got,want) for got,want in zip(cosines,[.6,0,.8]))
            elif end:
                assert all(close(got,want) for got,want in zip(cosines,[.5,sqrt(3)/2,0]))
            else:
                assert all(close(got,want) for got,want in zip(cosines,[.5,13/14,-1/7]))
                assert [round(degrees(acos(x))*60) for x in cosines]==[3600,21*60+47,98*60+13]
pairs=0
for x in range(-32,33):
    for y in range(-32,33):
        if not (x or y):continue
        a=(x,y);b=(-y,x)
        assert dot(a,b)==0 and hypot(*a)==hypot(*b) and dot(a,(y,x))==2*x*y
        pairs+=1
print(f'SCALAR_COORDINATES_OK {len(cards)} source entries, {count} measured drawings, {marks} checked right-angle marks, {pairs} independent quarter-turns.')

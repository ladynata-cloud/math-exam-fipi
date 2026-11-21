"""Measure area by the shoelace formula and the actual displayed apothems, chords and across-flat widths."""
import json
from math import cos, hypot, isclose, pi, sqrt
from regular_polygon_areas import OUT


def near(a,b):return isclose(a,b,abs_tol=.00025,rel_tol=1e-7)
def delta(a,b):return a[0]-b[0],a[1]-b[1]
def det(a,b):return a[0]*b[1]-a[1]*b[0]
def dot(a,b):return a[0]*b[0]+a[1]*b[1]
def dist(a,b):return hypot(*delta(a,b))


entries=json.loads(OUT.read_bytes())['lessons']
tasks=[(1183,c) for c in 'абвг']+[(i,None) for i in (1184,1185,1186)]+[(1187,c) for c in 'аб']
total=0
for e,(n,part) in zip(entries,tasks,strict=True):
    tag=e['source'];assert tag['printedPages']==[301] and tag['pdfPages']==[302] and tag['chapter']=='XIII' and tag.get('subpart')==part
    assert e['id']==f'atanasyan-7-9-main-{n}-part-{1 if part is None else "абвг".index(part)+1}'
    assert e['answer']['mode']=='exact' and len([s for s in e['steps'] if 'input' in s])==2
    m=e['visualization']['model']
    for key,v in m['views'].items():
        k=3 if key=='case-4' else 2 if key in ('step-3','case-3') else 1 if key in ('step-2','case-2') else 0
        count=([4,3,6,8]['абвг'.index(part)] if n==1183 else 6 if n in (1184,1186) else [3,4,6,6][k] if n==1185 else 3)
        names=list('ABCDEF')[:count]+['_vertex'+str(i) for i in range(6,count)]
        total+=1;suf='__v'+v['points'][0].split('__v')[1];raw=m['points'];o=raw['O'+suf];unit=raw['_unitX'+suf][0]-o[0]
        def point(id_):return tuple((raw[id_][i]-o[i])/unit for i in (0,1))
        pts={name:point(ref) for ref in v['points'] for name in m['labels'][ref].split('=')}
        def p(name):return pts[name] if name in pts else point(name+suf)
        def area(names):return abs(sum(det(p(a),p(b)) for a,b in zip(names,names[1:]+names[:1])))/2
        def length(a,b):return dist(p(a),p(b))
        actual=area(names);a=length('A','B');R=length('T','A');r=length('T','H');P=count*a
        for x,y in zip(names,names[1:]+names[:1]):
            assert near(length('T',x),R) and near(length(x,y),a)
            assert near(abs(det(delta(p('T'),p(x)),delta(p(y),p(x))))/a,r)
        assert near(length('U','W'),1) and near(actual,P*r/2)
        circle,=v['circles'];given=dist(point(circle['center']),point(circle['through']))
        if n==1183:
            idx='абвг'.index(part);linear=[2,.5,1/3,1/sqrt(3)][idx] if k==2 else 1
            assert near([R,P,r,r][idx],[3*sqrt(2),24,9,5*sqrt(3)][idx]*linear)
            assert near(actual,[36,16*sqrt(3),162*sqrt(3),600*(sqrt(2)-1)][idx]*linear**2)
            assert near(given,R if idx==0 and k==0 else r)
            if idx==3 and k!=2:
                assert f'{actual:.2f}'=='248.53' and '248.52' not in e['answer']['accepted']
                assert near(600*(1.4142-1),248.52)
        elif n==1184:
            assert near(length('H','K'),3 if k==2 else 1.5) and near(length('H','K'),2*r)
            assert near(dot(delta(p('A'),p('B')),delta(p('H'),p('K'))),0) and near(actual,9*sqrt(3)/8*(4 if k==2 else 1))
        elif n==1185:
            assert near(a,4 if k==3 else 2)
            assert near(actual,[sqrt(3),4,6*sqrt(3),24*sqrt(3)][k])
        elif n==1186:
            assert near(given,6 if k==2 else 3)
            if k:
                inner=list('LMNPQV')
                assert all(near(length('T',x),r) and near(length(x,y),r) for x,y in zip(inner,inner[1:]+inner[:1]))
                assert near(area(inner)/actual,.75)
        else:
            assert near(r,2 if k==2 else 1) and near(R,2*r)
            assert near(a,2*sqrt(3)*r) and near(P,3*sqrt(3)*R) and near(actual,3*sqrt(3)*R*R/4)
print(f'REGULAR_POLYGON_AREAS_OK {len(entries)} original parts, {total} measured diagrams, exact 1183г retained before final hundredth rounding.')

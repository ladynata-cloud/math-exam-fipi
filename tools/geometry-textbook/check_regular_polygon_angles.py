"""Measure every marked arc, straight continuation, radius and side in the source and practice diagrams."""
import json
from math import acos, atan2, degrees, hypot, isclose, pi
from regular_polygon_angles import OUT


def delta(a,b):return a[0]-b[0],a[1]-b[1]
def dot(a,b):return a[0]*b[0]+a[1]*b[1]
def det(a,b):return a[0]*b[1]-a[1]*b[0]
def near(x,y):return isclose(x,y,abs_tol=.0002)
def length(a,b):return hypot(*delta(a,b))
def angle(a,o,b):
    u,v=delta(a,o),delta(b,o)
    return degrees(acos(max(-1,min(1,dot(u,v)/(hypot(*u)*hypot(*v))))))

entries=json.loads(OUT.read_bytes())['lessons']
tasks=[(114,None,[5,6,3],['circle']*3)]
tasks += [(1170,p,[n,n,m],['interior','exterior','interior']) for p,n,m in zip('абвгд',[3,5,6,10,18],[4,10,12,5,9])]
tasks.append((1171,None,[4,6,12],['exterior']*3))
tasks += [(1172,p,[n,n,m],['interior','exterior','interior']) for p,n,m in zip('абвг',[3,4,8,12],[6,5,10,18])]
tasks += [(1173,p,[n,n,m],['sector','circle','sector']) for p,n,m in zip('абвгде',[6,12,4,10,20,5],[4,6,8,5,12,10])]
views=bits=boundaries=0
for e,(number,part,ns,modes) in zip(entries,tasks,strict=True):
    theory=number==114;pg=[294,295] if theory else [300]
    assert e['source']['chapter']=='XIII' and e['source']['printedPages']==pg and e['source']['pdfPages']==[n+1 for n in pg] and e['source'].get('subpart')==part
    assert e['id']==f'atanasyan-7-9-{"theory" if theory else "main"}-{number}-part-{1 if part is None else "абвгде".index(part)+1}'
    if not theory:
        result=180-360//ns[0] if number==1170 else 360 if number==1171 else ns[0]
        assert e['answer']['mode']=='exact' and str(result) in e['answer']['accepted']
    model=e['visualization']['model'];raw=model['points']
    for key,v in model['views'].items():
        k=2 if key in ('case-3','step-3') else 1 if key in ('case-2','step-2') else 0
        n=ns[k];mode=modes[k];views+=1
        suf='__v'+v['points'][0].split('__v')[1]
        origin=raw['O'+suf];scale=raw['_unitX'+suf][0]-origin[0]
        def c(name):return tuple((raw[name+suf][i]-origin[i])/scale for i in (0,1))
        names=['A','B',*['_poly'+str(i) for i in range(2,n-1)],'V']
        pts=[c(name) for name in names]
        theta=360/n
        for i in range(n):
            assert near(hypot(*pts[i]),4)
            assert near(angle(pts[i-1],pts[i],pts[(i+1)%n]),180-theta)
            assert near(length(pts[i-1],pts[i]),length(pts[i],pts[(i+1)%n]))
            assert [names[i]+suf,names[(i+1)%n]+suf] in v['segments']
            boundaries+=1
        visible=[model['labels'][name] for name in v['points']]
        assert {'V','A','B'}.issubset(visible)
        if mode in ('circle','sector'):
            circle,=v['circles'];assert 'T' in visible
            assert near(hypot(*c(circle['center'].split('__v')[0])),0)
            assert near(hypot(*c(circle['through'].split('__v')[0])),4)
            assert near(angle(c('A'),(0,0),c('B')),theta)
        if mode=='circle':continue
        if mode=='exterior':
            assert 'E' in visible
            side=delta(c('A'),c('V'));ext=delta(c('E'),c('A'))
            assert near(det(side,ext),0) and dot(side,ext)>0
        center=(0,0) if mode=='sector' else c('A')
        target=theta if mode in ('exterior','sector') else 180-theta
        arc=[c('_angle'+str(i)) for i in range(13)]
        steps=[]
        for i in range(12):
            assert ['_angle'+str(i)+suf,'_angle'+str(i+1)+suf] in v['highlightSegments']
            a,b=delta(arc[i],center),delta(arc[i+1],center)
            assert near(hypot(*a),hypot(*b))
            steps.append(degrees(atan2(det(a,b),dot(a,b))));bits+=1
        assert all(q>0 for q in steps) and near(sum(steps),target)
        ends={'exterior':('E','B'),'sector':('A','B'),'interior':('B','V')}[mode]
        for a,name in zip((arc[0],arc[-1]),ends):
            direction=delta(c(name),center);ray=delta(a,center)
            assert near(det(direction,ray),0) and dot(direction,ray)>0
print(f'REGULAR_POLYGON_ANGLES_OK {len(entries)} source parts, {views} measured figures, {boundaries} verified polygon sides, {bits} directly measured arc increments.')

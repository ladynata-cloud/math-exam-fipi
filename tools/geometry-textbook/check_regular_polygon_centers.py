"""Measure both circle radii, every tangent, and the different/identical lines for each selected pair."""
import json
from math import cos, hypot, isclose, pi
from regular_polygon_centers import OUT


def v(a,b):return a[0]-b[0],a[1]-b[1]
def dot(a,b):return a[0]*b[0]+a[1]*b[1]
def det(a,b):return a[0]*b[1]-a[1]*b[0]
def norm(a):return hypot(*a)
def near(x,y):return isclose(x,y,abs_tol=.0001)
def bisects(origin,end,left,right):
    ray=v(end,origin);a=v(left,origin);b=v(right,origin)
    return near(dot(ray,a)/norm(a),dot(ray,b)/norm(b)) and dot(ray,a)>0 and dot(ray,b)>0


data=json.loads(OUT.read_bytes())['lessons'];count=tangencies=axes=0
for n,e in zip((115,1174,1175),data,strict=True):
    pages=[295,296,297] if n==115 else [300]
    assert e['source']['printedPages']==pages and e['source']['pdfPages']==[i+1 for i in pages] and e['source']['chapter']=='XIII'
    assert e['id']==f'atanasyan-7-9-{"theory" if n==115 else "main"}-{n}-part-1'
    m=e['visualization']['model'];raw=m['points']
    for key,view in m['views'].items():
        count+=1;k=2 if key in ('case-3','step-3') else 1 if key in ('case-2','step-2') else 0
        num=[5,6,4][k];j=[2,3,1][k];suf='__v'+view['points'][0].split('__v')[1];o=raw['O'+suf];scale=raw['_unitX'+suf][0]-o[0]
        def coord(name):return tuple((raw[name][i]-o[i])/scale for i in (0,1))
        p={name:coord(ref) for ref in view['points'] for name in m['labels'][ref].split('=')};t=p['T']
        names=['_poly'+str(i) for i in range(num)]
        for index,name in [(0,'A'),(1,'B'),(j,'C'),((j+1)%num,'D')]:
            if names[index].startswith('_'):names[index]=name
        vertices=[coord(x+suf) for x in names]
        circum=4;inrad=circum*cos(pi/num)
        circles=view['circles'];assert len(circles)==2
        for mark,expected in zip(circles,[inrad,circum],strict=True):
            assert near(norm(v(coord(mark['center']),t)),0) and near(norm(v(coord(mark['center']),coord(mark['through']))),expected)
        for i,x in enumerate(vertices):
            y=vertices[(i+1)%num];side=v(y,x);midx=((x[0]+y[0])/2,(x[1]+y[1])/2)
            assert near(norm(v(x,t)),circum) and near(norm(v(midx,t)),inrad)
            assert near(dot(side,v(midx,t)),0) and near(abs(det(v(t,x),side))/norm(side),inrad)
            if i in (0,j):assert near(norm(v(midx,p['H' if i==0 else 'K'])),0)
            tangencies+=1
        lines=[(coord(a),coord(b)) for a,b in view['highlightSegments']];assert len(lines)==(1 if k==1 else 2)
        for a,b in lines:assert near(det(v(t,a),v(b,a)),0)
        axes+=len(lines)
        for i in (0,j):
            a,b=lines[0 if i==0 or k==1 else 1];ray=v(b,a)
            if n==1175:
                assert near(det(v(vertices[i],a),ray),0)
                assert bisects(vertices[i],t,vertices[i-1],vertices[(i+1)%num])
            else:
                assert near(dot(v(vertices[(i+1)%num],vertices[i]),ray),0)
                assert near(det(v(p['H' if i==0 else 'K'],a),ray),0)
        if k==2:
            assert near(dot(v(*lines[0]),v(*lines[1])),0)
print(f'REGULAR_POLYGON_CENTERS_OK {len(data)} complete source entries, {count} concentric-circle models, {tangencies} measured equal radii and perpendiculars at tangencies, {axes} checked axes.')

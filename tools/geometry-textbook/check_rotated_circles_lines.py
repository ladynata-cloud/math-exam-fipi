"""Check serialized circle radii, signed rotations, tangent feet and full lines."""
import json
from math import atan2,cos,sin,radians,degrees,hypot,isclose
from rotated_circles_lines import OUT


def near(a,b):
    return isclose(a,b,rel_tol=2e-6,abs_tol=2e-6)


def turn(u,v):
    return degrees(atan2(u[0]*v[1]-u[1]*v[0],u[0]*v[0]+u[1]*v[1]))


rows=[('1267','а',[322],['6','4']),('1267','б',[322],['6','2']),
      ('1268','а',[322,323],['3','4']),('1268','б',[322,323],['120','4']),('1269',None,[323],['45','65'])]
for c,(n,part,pages,answers) in zip(json.loads(OUT.read_text())['lessons'],rows,strict=True):
    s=c['source']
    assert (s['exercise'],s.get('subpart'),s['chapter'],s['printedPages'],s['pdfPages'])==(n,part,'XIV',pages,[x+1 for x in pages])
    assert [step['input']['accepted'][0] for step in c['steps'] if 'input' in step]==answers
    assert c['answer']['mode']=='manual' and isinstance(c['help'][-1]['text'],str)
    m=c['visualization']['model'];assert len(m['views'])==7
    for name,v in m['views'].items():
        case=int(name[-1]) if name[-1].isdigit() else 1
        angle=60 if n=='1267' else -60 if n=='1268' else (30,135,65)[case-1]
        ids={l:k for k in v['points'] for l in m['labels'][k].split('=')}
        if part=='б':
            same=('C','C′') if n=='1267' else ('H','H′')
            # The legend names the shared centre. The diagram displays only T at that position.
            assert all(label not in ids for label in same)
            ids.update({label:ids['T'] for label in same})
        def xy(k):return m['points'][k][:2]
        def distance(u,w):return hypot(*(x-y for x,y in zip(xy(u),xy(w))))
        unit=distance(ids['U'],ids['W'])
        def ray(k):return tuple((x-y)/unit for x,y in zip(xy(k),xy(ids['T'])))
        def length(a,b):return distance(ids[a],ids[b])/unit
        def segments_through(a,b):
            ax,ay=xy(ids[a]);bx,by=xy(ids[b]);dx,dy=bx-ax,by-ay
            def t(k):
                x,y=xy(k); x-=ax;y-=ay
                return x*dy-y*dx,(x*dx+y*dy)/(dx*dx+dy*dy)
            return any(near(t(i)[0],0) and near(t(j)[0],0) and min(t(i)[1],t(j)[1])<0 and max(t(i)[1],t(j)[1])>1
                       for i,j in v['segments'])
        for label in ('CA' if n=='1267' else 'HA' if n=='1268' else 'A'):
            u=ray(ids[label]);w=ray(ids[label+'′']);co=cos(radians(angle));si=sin(radians(angle))
            assert near(u[0]*co-u[1]*si,w[0]) and near(u[0]*si+u[1]*co,w[1])
        if n=='1267':
            circles=[dict(center=ids['C'],through=ids['A'])]
            if part=='а':
                circles.append(dict(center=ids['C′'],through=ids['A′']))
                assert length('T','C')>0
            else:assert ids['C']==ids['T']==ids['C′'] and ids['A']!=ids['A′']
            assert v['circles']==circles and near(length('C','A'),length('C′','A′'))
            if case==2:assert near(2*length('C′','A′'),6)
            if case==3:assert near(length('T','C′') if part=='а' else length('T','A′'),int(answers[1]))
        elif n=='1268':
            if part=='а':
                for suffix in ('','′'):
                    h,a=ids['H'+suffix],ids['A'+suffix]
                    v1=tuple(x-y for x,y in zip(xy(a),xy(h)))
                    v2=tuple(x-y for x,y in zip(xy(ids['T']),xy(h)))
                    assert near(sum(x*y for x,y in zip(v1,v2)),0)
                    assert any(mark['vertex']==h for mark in v['rightAngles'])
                if case==2:assert near(length('T','H′'),3)
                if case==3:assert near(length('H′','A′'),4)
            else:
                assert ids['T']==ids['H']==ids['H′']
                if case==2:assert near(180-abs(turn(ray(ids['A']),ray(ids['A′']))),120)
                if case==3:assert near(length('T','A′'),4)
            for suffix in ('','′'):assert segments_through('H'+suffix,'A'+suffix)
        else:
            for suffix in ('','′'):assert segments_through('T','A'+suffix)
            measured=abs(turn(ray(ids['A']),ray(ids['A′'])))
            if case>=2:assert near(min(measured,180-measured),int(answers[case-2]))
        curve=v['highlightSegments'][-20:-2]
        assert len(curve)==18 and near(sum(turn(ray(a),ray(b)) for a,b in curve),angle)
        assert all(a==curve[-1][1] for a,b in v['highlightSegments'][-2:])
print('ROTATED_CIRCLES_LINES_OK: 35 measured views with complete circles/lines, directed arrows, tangent feet and supplementary angles.')

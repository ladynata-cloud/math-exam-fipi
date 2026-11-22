"""Measure signed rotations and arrow direction in every displayed view."""
import json
from math import atan2,cos,degrees,hypot,isclose,radians,sin
from rotation_constructions import OUT


def near(a,b):
    return isclose(a,b,rel_tol=2e-6,abs_tol=2e-6)


def arg(u,v):
    return degrees(atan2(u[0]*v[1]-u[1]*v[0],u[0]*v[0]+u[1]*v[1]))


rows=[('1263','а',-120,['4','5']),('1263','б',75,['15','5']),('1263','в',180,['8','5']),
      ('1264',None,150,['4','5']),('1265',None,120,['120','3']),('1266',None,90,['8','4'])]
for card,(n,part,turn,answers) in zip(json.loads(OUT.read_text())['lessons'],rows,strict=True):
    src=card['source']
    assert (src['exercise'],src.get('subpart'),src['printedPages'],src['pdfPages'],src['chapter'])==(n,part,[322],[323],'XIV')
    assert card['answer']['mode']=='manual' and [s['input']['accepted'][0] for s in card['steps'] if 'input' in s]==answers
    m=card['visualization']['model']
    assert len(m['views'])==7
    for name,v in m['views'].items():
        case=int(name[-1]) if name[-1].isdigit() else 1
        center='A' if n=='1264' else 'D' if n=='1265' else 'T'
        pivot='B' if n=='1264' else 'A'
        angle=-turn if n in ('1265','1266') and case==3 else turn
        ids={label:k for k in v['points'] for label in m['labels'][k].split('=')}
        center_xy=m['points'][ids[center]][:2]
        unit=hypot(*(a-b for a,b in zip(m['points'][ids['U']],m['points'][ids['W']])))
        def ray(key):return tuple((a-b)/unit for a,b in zip(m['points'][key][:2],center_xy))
        def leg(a,b):return hypot(*(x-y for x,y in zip(ray(ids[a]),ray(ids[b]))))
        def edge(a,b):return [ids[a],ids[b]] in v['segments'] or [ids[b],ids[a]] in v['segments']
        def mapped(source,target):
            u=ray(ids[source]);w=ray(ids[target]);rad=radians(angle)
            expected=(u[0]*cos(rad)-u[1]*sin(rad),u[0]*sin(rad)+u[1]*cos(rad))
            assert all(near(x,y) for x,y in zip(w,expected)),(n,part,case,source,target)
        assert edge('U','W')
        if n in ('1263','1264'):
            for l in 'AB' if n=='1263' else 'ABC':mapped(l,l+'′')
            assert near(leg('A','B'),leg('A′','B′')) and edge('A','B') and edge('A′','B′')
            if n=='1264':
                assert ids['A']==ids['A′']
                for l in ('A','B'):assert edge(l,'C') and edge(l+'′','C′')
            if case==2:
                if n=='1264':assert near(leg('A','B′'),4)
                elif part=='в':assert near(leg('A','A′'),8)
                elif part=='б':assert near(90-arg(ray(ids['A']),ray(ids['A′'])),15)
                else:assert near(leg('T','A′'),4)
            if case==3:assert near(leg('B′','C′') if n=='1264' else leg('A′','B′'),5)
        else:
            polygon='ABC' if n=='1265' else 'ABCD'
            lengths=[];radii=[]
            for i,l in enumerate(polygon):
                next_point=polygon[(i+1)%len(polygon)]
                mapped(l,polygon[(i+(1 if angle>0 else -1))%len(polygon)])
                assert edge(l,next_point) and edge(center,l)
                lengths.append(leg(l,next_point));radii.append(leg(center,l))
            assert all(near(x,lengths[0]) for x in lengths)
            assert all(near(x,radii[0]) for x in radii)
            if n=='1266' and case==2:assert near(leg('A','C'),8)
            if case==3:assert near(abs(360/angle),int(answers[-1]))
        # The colored artwork contains an ordered arc with an actual tip in its direction.
        marks=v['highlightSegments'];curve=marks[:-2]
        assert len(curve)==18 and all(b==a for (_,b),(a,_) in zip(curve,curve[1:]))
        angles=[arg(ray(a),ray(b)) for a,b in curve]
        assert all(x*angle>0 for x in angles) and near(sum(angles),angle)
        start=ray(curve[0][0]); end=ray(curve[-1][1]);radius=hypot(*start)
        assert near(arg(ray(ids[pivot]),start),0)
        for a,b in curve:assert near(hypot(*ray(a)),radius) and near(hypot(*ray(b)),radius)
        assert all(a==curve[-1][1] for a,b in marks[-2:])
        tangent=(-end[1],end[0]) if angle>0 else (end[1],-end[0])
        for _,b in marks[-2:]:
            vx,vy=ray(b)
            assert (vx-end[0])*tangent[0]+(vy-end[1])*tangent[1]<0
print('ROTATION_CONSTRUCTIONS_OK: 42 directed and measured rotations; angle, radius, arrow tip and fixed polygons verified.')

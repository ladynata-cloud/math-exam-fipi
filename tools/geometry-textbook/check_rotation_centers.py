"""Check the center against both directed endpoint correspondences in the shown models."""
import json
from math import sin,cos,atan2,radians,degrees,hypot,isclose
from rotation_centers import OUT


def near(a,b):
    return isclose(a,b,abs_tol=2e-6,rel_tol=2e-6)


def arg(a,b):
    return degrees(atan2(a[0]*b[1]-a[1]*b[0],a[0]*b[0]+a[1]*b[1]))


for card,(part,answers) in zip(json.loads(OUT.read_text())['lessons'],[('а',['4','3']),('б',['60','4'])],strict=True):
    s=card['source']
    assert (s['exercise'],s.get('subpart'),s['printedPages'],s['pdfPages'],s['chapter'])==('1270',part,[323],[324],'XIV')
    assert card['answer']['mode']=='manual' and [p['input']['accepted'][0] for p in card['steps'] if 'input' in p]==answers
    m=card['visualization']['model'];assert len(m['views'])==7
    for name,v in m['views'].items():
        case=int(name[-1]) if name[-1].isdigit() else 1
        ids={n:k for k in v['points'] for n in m['labels'][k].split('=')}
        def xy(k):return m['points'][k][:2]
        unit=hypot(*(u-w for u,w in zip(xy(ids['W']),xy(ids['U']))))
        def vec(a,b):return tuple((w-u)/unit for u,w in zip(xy(ids[a]),xy(ids[b])))
        def same(a,b):return all(near(x,y) for x,y in zip(a,b))
        angle=180 if part=='а' else [90,60,90][case-1]
        ab,cd=vec('A','B'),vec('A′','B′')
        assert near(hypot(*ab),hypot(*cd)) and near(abs(arg(ab,cd)),angle)
        for a in 'AB':
            u,w=vec('T',a),vec('T',a+'′');r=radians(angle)
            assert same((u[0]*cos(r)-u[1]*sin(r),u[0]*sin(r)+u[1]*cos(r)),w)
        if part=='а':
            for k in 'AB':assert same(vec(k,'T'),vec('T',k+'′'))
            if case==2:assert near(vec('A','T')[0],4)
            if case==3:assert near(hypot(*vec('A','T')),3) and near(vec('A','A′')[1],0)
        elif case<3:
            alpha=abs(arg(vec('T','A'),vec('T','A′')))
            beta=abs(arg(vec('A','T'),vec('A','A′')))
            assert near(alpha+2*beta,180)
            if case==2:assert near(beta,60)
        else:assert ids['A']==ids['T']==ids['A′'] and near(hypot(*vec('T','B′')),4)
        def ray(k):return tuple(y-x for x,y in zip(xy(ids['T']),xy(k)))
        arc=v['highlightSegments'][:-2]
        assert len(arc)==18 and near(sum(arg(ray(a),ray(b)) for a,b in arc),angle)
print('ROTATION_CENTERS_OK: 14 views, two corresponding endpoints, common midpoint, signed chord construction and fixed endpoint.')

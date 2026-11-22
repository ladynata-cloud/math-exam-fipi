"""Measure the radius, unrolled circumference, bounding polygon and arcs independently."""
import json
from math import atan2, hypot, isclose, pi, sqrt

from circumference_lengths import OUT


def near(a,b):
    return isclose(a,b,abs_tol=.00015)


def dist(p,q):
    return hypot(p[0]-q[0],p[1]-q[1])


cards=json.loads(OUT.read_bytes())['lessons']
rows=[('R',4),('R',3),('C',82),('C',18*pi),('R',.7),('C',6.28),('R',101.5),('R',7/3),('C',2*sqrt(2))]
traces=outlines=0
for i,card in enumerate(cards):
    theory=i==0
    table=1<=i<=9
    s=card['source']
    assert s['chapter']=='XIII' and s['printedPages']==([302,303] if theory else [307])
    assert s['pdfPages']==[p+1 for p in s['printedPages']]
    n=118 if theory else 1190 if table else 1191 if i<14 else 1192
    assert s.get('point',s.get('exercise'))==str(n)
    if table:
        given,v=rows[i-1];expected=2*3.14*v if given=='R' else 9 if i==4 else v/6.28
        assert abs(float(card['answer']['accepted'][0].replace(',','.'))-expected)<=.0050001
        assert s['subpart']==f'столбец {i}' and card['title'].endswith(s['subpart'])
        assert card['steps'][-1]['input']['accepted'][0]==['50,24','56,52','26,11','18','13,19','2','1274,84','43,96','0,90'][i-1]
    if i>=10:
        assert s['subpart']=='абвг'[i-10] if i<14 else s['subpart']=='аб'[i-14]
        assert card['answer']['accepted'][0]==['3','1/2','k','1/k','k','1/k'][i-10]
    m=card['visualization']['model'];points=m['points']
    rs=[]
    for key,v in m['views'].items():
        suffix='__v'+v['points'][0].split('__v')[1]
        names={name:p for p in v['points'] for name in m['labels'][p].split('=')}
        assert not any('_' in name for name in names),names
        p=lambda n:points[names[n]]
        unit=dist(p('U'),p('V'))
        R=dist(p('T'),p('A'))/unit
        if key.startswith('case-'):rs.append(R)
        circles=v['circles'];assert len(circles)==1
        assert near(R,dist(points[circles[0]['center']],points[circles[0]['through']])/unit)
        assert near(2*R,dist(p('A'),p('B'))/unit)
        outlines+=1
        case=3 if key.endswith('3') else 2 if key.endswith('2') else 1
        if 'P' in names:
            assert near(dist(p('P'),p('E'))/unit,2*pi*R)
            assert p('P')[1]==p('E')[1] and ['P'+suffix,'E'+suffix] in v['segments']
            traces+=1
        elif not theory:
            assert table and case==1
        elif case<3:
            edges=[(a,b) for a,b in v['segments'] if '_polygon' in a or '_polygon' in b]
            assert len(edges)==(6 if case==1 else 12)
            perimeter=sum(dist(points[a],points[b])/unit for a,b in edges)
            assert 11.999<perimeter<2*pi*R
            if case==2:assert perimeter>12.4
        else:
            segments=v['highlightSegments']
            assert len(segments)==20 and segments[0][0]==names['A'] and segments[-1][-1]==names['D']
            ts=[points[segments[0][0]]]+[points[b] for _,b in segments]
            assert all(near(dist(q,p('T'))/unit,R) for q in ts)
            assert all(a[1]==b[0] for a,b in zip(segments,segments[1:]))
            angles=[atan2(q[1]-p('T')[1],q[0]-p('T')[0]) for q in ts]
            assert all(near(b-a,pi/40) for a,b in zip(angles,angles[1:]))
    factor=[3,.5,4,.2,3,.25][i-10] if i>=10 else None
    if table:assert near(rs[2]/rs[0],3 if i in (2,5,8) else 2)
    if factor:assert near(rs[1]/rs[0],factor)
assert len(cards)==16 and outlines==112
print(f'CIRCUMFERENCE_LENGTHS_OK {len(cards)} source entries, all nine original cells, {outlines} measured circles, {traces} independently measured circumferences.')

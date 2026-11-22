"""Measure both motion laws and every construction shown in the released diagrams."""
import json
from math import isclose,hypot
from translations_and_rotations import OUT


def near(a,b):
    return isclose(a,b,rel_tol=1e-6,abs_tol=1e-6)


def cross(u,v):
    return u[0]*v[1]-u[1]*v[0]


items=[
 ('1257','а',320,['1','6']),('1257','б',320,['5','3']),
 ('125',None,320,['5','0']),('126',None,321,['4','6']),
 ('1258',None,322,['-1','5']),('1259','а',322,['-1','-2']),('1259','б',322,['1','7'])]
for card,(n,part,page,answers) in zip(json.loads(OUT.read_text())['lessons'],items,strict=True):
    source=card['source']
    assert source.get('exercise',source.get('point'))==n and source.get('subpart')==part
    assert source['printedPages']==[page] and source['pdfPages']==[page+1] and source['chapter']=='XIV'
    assert card['kind']==('theory' if len(n)==3 else 'exercise')
    if card['kind']=='exercise':assert card['answer']['mode']=='manual'
    assert [s['input']['accepted'][0] for s in card['steps'] if 'input' in s]==answers
    m=card['visualization']['model']
    assert len(m['views'])==7
    for name,view in m['views'].items():
        case=int(name[-1]) if name[-1].isdigit() else 1
        ids={label:k for k in view['points'] for label in m['labels'][k].split('=')}
        def p(label):return m['points'][ids[label]][:2]
        def v(a,b):
            x,y=p(a);u,w=p(b)
            return (u-x)/unit,(w-y)/unit
        def edge(a,b):return [ids[a],ids[b]] in view['segments'] or [ids[b],ids[a]] in view['segments']
        unit=hypot(p('U')[0]-p('W')[0],p('U')[1]-p('W')[1])
        assert unit>0 and edge('U','W') and edge('A','B') and edge('A′','B′')
        assert near(hypot(*v('A','B')),hypot(*v('A′','B′')))
        if n=='1257':
            if part=='а':
                assert all(near(x,y) for x,y in zip(v('A','A′'),v('B','B′')))
                if case==2:assert near(5-v('A','A′')[0],1)
                if case==3:assert near(hypot(*v('A′','B′')),6)
            else:
                assert edge('A″','B″') and near(hypot(*v('A','B')),hypot(*v('A″','B″')))
                if case>=2:assert near(hypot(*v('A','B')),int(answers[case-2]))
            continue
        if n=='126':
            for point in 'AB':
                radius=v('T',point);image=v('T',point+'′')
                assert near(hypot(*radius),hypot(*image))
                if case==1:assert near(image[0],-radius[1]) and near(image[1],radius[0])
                if case==2:assert near(image[0],radius[1]) and near(image[1],-radius[0])
                if case==3:assert near(image[0],-radius[0]) and near(image[1],-radius[1])
            if case==2:assert near(hypot(*v('T','A′')),4)
            if case==3:assert near(hypot(*v('A','A′')),6)
            continue
        delta=v('M','N')
        for point in 'ABC' if n=='1259' else 'AB':
            assert all(near(a,b) for a,b in zip(delta,v(point,point+'′')))
        if n=='125' and case==3:
            assert ids['M']==ids['N'] and ids['A']==ids['A′'] and ids['B']==ids['B′']
            continue
        # An actual two-stroke arrowhead must converge at the vector's terminal point.
        def has_head(mark):
            end=ids[mark]
            return sum(end in pair for pair in view['highlightSegments'])==2
        assert edge('M','N') and has_head('N')
        if n=='125' and case==2:assert near(hypot(*v('A′','B′')),5)
        if n=='1258' and case==2:assert near(3+delta[0],-1)
        if n=='1258' and case==3:assert near(hypot(*v('A′','B′')),5)
        if n=='1259':
            other=v('K','L')
            assert edge('K','L') and has_head('L')
            for a,b in [('A','B'),('B','C'),('C','A')]:
                assert edge(a,b) and edge(a+'′',b+'′')
                assert near(hypot(*v(a,b)),hypot(*v(a+'′',b+'′')))
                assert not near(cross(delta if part=='а' else other,v(a,b)),0)
            assert near(cross(other if part=='а' else delta,v('A','C')),0)
            if case==2:assert near((2 if part=='а' else 4)+delta[0],int(answers[0]))
            if case==3:assert near(delta[1] if part=='а' else 2+delta[0],int(answers[1]))
print('TRANSLATIONS_AND_ROTATIONS_OK: all 49 views, direction, scale, congruence and source subparts.')

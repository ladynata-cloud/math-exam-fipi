"""Independently validate the model behind each proof and counterexample in ch. XIV."""
import json
from math import dist, isclose
from motion_composition import OUT


def near(a,b):
    return isclose(a,b,abs_tol=1e-6,rel_tol=1e-6)


def mid(a,b):
    return tuple((x+y)/2 for x,y in zip(a,b))


def same(a,b):
    return all(near(x,y) for x,y in zip(a,b))


checks=[('1253','а',['8','6']),('1253','б',['6','0']),('1253','в',['4','9']),
        ('1254',None,['3','0']),('1255',None,['5','6']),('1256',None,['5','4'])]
for card,(number,part,answers) in zip(json.loads(OUT.read_text())['lessons'],checks,strict=True):
    s=card['source']
    assert (s['exercise'],s.get('subpart'),s['printedPages'],s['pdfPages'],s['chapter'])==(number,part,[319],[320],'XIV')
    assert card['answer']['mode']=='manual'
    assert [step['input']['accepted'][0] for step in card['steps'] if 'input' in step]==answers
    model=card['visualization']['model']
    assert len(model['views'])==7
    for view_name,v in model['views'].items():
        case=int(view_name[-1]) if view_name[-1].isdigit() else 1
        ids={label:k for k in v['points'] for label in model['labels'][k].split('=')}
        def p(label):return model['points'][ids[label]][:2]
        unit=dist(p('U'),p('W'))
        def length(a,b):return dist(p(a),p(b))/unit
        def drawn(a,b):return [ids[a],ids[b]] in v['segments'] or [ids[b],ids[a]] in v['segments']
        def midpoint(a,b):return mid(p(a),p(b))
        if part=='а':
            for label in 'AB':
                assert same(midpoint(label,label+'′'),p('T'))
            if case>=2:assert near(length('A','A′'),int(answers[case-2]))
        elif part=='б':
            assert near(p('K')[0],p('L')[0])
            for label in 'AB':
                x,y=p(label);rx,ry=p(label+'′')
                assert near(y,ry) and near((x+rx)/2,p('K')[0])
            assert ids['H'] in {a['vertex'] for a in v['rightAngles']}
            if case==2:assert near(length('A','A′'),6)
            if case==3:assert ids['B']==ids['B′']
        elif part=='в':
            for a,b in [('A','B'),('B','C'),('C','A')]:
                assert near(length(a,b),length(a+'′',b+'′'))
                assert drawn(a,b) and drawn(a+'′',b+'′')
            assert len({round(length(a,b),6) for a,b in [('A','B'),('B','C'),('C','A')]})==3
            # The labelled, scalene vertices uniquely determine correspondence even for unlabelled triangles.
            axes=[]
            for vertex in 'AB':
                assert near(p(vertex)[1],p(vertex+'′')[1])
                x=midpoint(vertex,vertex+'′')[0]
                assert any(near(model['points'][a][0],x) and near(model['points'][b][0],x)
                           and not near(model['points'][a][1],model['points'][b][1]) for a,b in v['segments'])
                axes.append(x)
            assert not near(*axes)
            if case==2:assert near(abs(axes[0]-p('A')[0])/unit,4)
            if case==3:assert near(abs(axes[1]-p('A')[0])/unit,9)
        elif number=='1254':
            if case==1:
                t=p('T');a=p('A');b=p('A′');d=p('D')
                assert near(length('T','A'),length('T','A′'))
                assert near(sum((x-z)*(y-z) for x,y,z in zip(a,b,t)),0)
                assert near(dist(a,d),dist(b,d))
            if case==2:
                assert same(midpoint('A','A′'),p('H')) and near(length('A','H'),2)
                assert near(p('K')[1],p('H')[1]) and near(p('L')[1],p('H')[1])
                assert ids['H'] in {mark['vertex'] for mark in v['rightAngles']}
            if case==3:assert ids['A']==ids['A′'] and ids['B']==ids['B′']
        else:
            length0=length('A','B')
            for suffix in ('','′','″'):
                assert drawn('A'+suffix,'B'+suffix)
                assert near(length0,length('A'+suffix,'B'+suffix))
            if case>=2:assert near(length0,int(answers[case-2]))
            if number=='1256':
                for label in 'AB':
                    assert near(p(label)[1],p(label+'′')[1])
                    assert near(midpoint(label,label+'′')[0],p('K')[0])
                    assert same(midpoint(label,label+'″'),p('T'))
print('MOTION_COMPOSITION_OK: 42 measured diagrams; six proofs and counterexample checks.')

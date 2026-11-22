"""Verify the actual translated objects, directed vectors and intersection construction."""
import json
from math import isclose,hypot
from parallel_translation_constructions import OUT


def near(a,b):
    return isclose(a,b,abs_tol=1e-6,rel_tol=1e-6)


def det(a,b):
    return a[0]*b[1]-a[1]*b[0]


items=[('1260','а',['4','5']),('1260','б',['5','8']),('1261',None,['5','4']),('1262',None,['3','4'])]
for card,(n,part,answers) in zip(json.loads(OUT.read_text())['lessons'],items,strict=True):
    src=card['source']
    assert (src['exercise'],src.get('subpart'),src['chapter'],src['printedPages'],src['pdfPages'])==(n,part,'XIV',[322],[323])
    assert [s['input']['accepted'][0] for s in card['steps'] if 'input' in s]==answers
    assert card['answer']['mode']=='manual'
    model=card['visualization']['model']
    assert len(model['views'])==7
    for name,v in model['views'].items():
        case=int(name[-1]) if name[-1].isdigit() else 1
        ids={s:k for k in v['points'] for s in model['labels'][k].split('=')}
        def p(n):return model['points'][ids[n]][:2]
        unit=hypot(p('W')[0]-p('U')[0],p('W')[1]-p('U')[1])
        def vector(a,b):return tuple((x-y)/unit for x,y in zip(p(b),p(a)))
        def length(a,b):return hypot(*vector(a,b))
        def edge(a,b):return [ids[a],ids[b]] in v['segments'] or [ids[b],ids[a]] in v['segments']
        def same(u,w):return all(near(x,y) for x,y in zip(u,w))
        assert edge('U','W')
        if n=='1260':
            assert near(length('A','B'),length('B','C')) and near(length('A','C')+length('C','D'),length('A','D'))
            assert same(vector('B','B′'),vector('C','D')) and same(vector('B','C'),vector('B′','D'))
            assert all(edge(a,b) for a,b in [('A','B'),('B','C'),('B','B′'),('B′','D')])
            assert near(det(vector('A','D'),vector('B','B′')),0) and not near(det(vector('A','B'),vector('D','B′')),0)
            if case>=2:
                measured=length('B','B′') if part=='а' else length('B′','D') if case==2 else length('A','D')-length('B','B′')
                assert near(measured,int(answers[case-2]))
        elif n=='1261':
            assert same(vector('M','N'),(5,2))
            for s in ('ABC' if case==1 else 'ABCD' if case==2 else 'TA'):
                assert same(vector(s,s+'′'),vector('M','N'))
            if case<=2:
                rows='ABCA' if case==1 else 'ABCDA'
                for a,b in zip(rows,rows[1:]):
                    assert edge(a,b) and edge(a+'′',b+'′') and near(length(a,b),length(a+'′',b+'′'))
                if case==2:assert near(length('A′','D′'),5)
            else:
                assert v['circles']==[dict(center=ids['T'+s],through=ids['A'+s]) for s in ('','′')]
                assert near(2*length('T','A'),4) and near(length('T','A'),length('T′','A′'))
        else:
            u,w=vector('P','A'),vector('P','B')
            assert not near(det(u,w),0)
            assert same(u,vector('Q','A′')) and same(w,vector('Q','B′'))
            assert edge('P','Q')
            delta=vector('P','Q')
            if case>=2:assert near(delta[case-2],int(answers[case-2]))
            # Check all four full guide lines really pass through the labelled origins.
            for origin,way in [('P','A'),('P','B'),('Q','A′'),('Q','B′')]:
                ox,oy=p(origin);dx,dy=vector(origin,way)
                def side(k):
                    x,y=model['points'][k][:2]
                    return det((x-ox,y-oy),(dx,dy)),(x-ox)*dx+(y-oy)*dy
                assert any(near(side(a)[0],0) and near(side(b)[0],0) and side(a)[1]*side(b)[1]<0
                           for a,b in v['highlightSegments'])
print('PARALLEL_TRANSLATION_CONSTRUCTIONS_OK: 28 figures checked, including full lines and exact circles.')

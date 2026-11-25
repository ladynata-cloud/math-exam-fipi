"""Measure the diagrams themselves and independently check chapter X's final general claims."""
import json
from itertools import product
from math import acos, degrees, hypot
from pathlib import Path
from vector_model_measurements import close, determinant, dot, eq, measurements, minus, plus

root = Path(__file__).resolve().parents[2]
cards = json.loads((root/'geometry-course/textbook/data/vector-extra-problems.json').read_text())['lessons']
assert [int(card['source']['exercise']) for card in cards] == list(range(988,998))
view_count = arrow_count = 0


def scale(v, k):
    return tuple(x*k for x in v)


def norm(v):
    return hypot(*v)


def distance(point, line):
    return abs(determinant(point, line))/norm(line)


for entry in cards:
    source = entry['source']
    n = int(source['exercise'])
    page = 244 if n <= 990 else 245
    assert (source['bookId'],source['chapter'],source['printedPages'],source['pdfPages']) == ('atanasyan-2023-7-9','X',[page],[page+1])
    assert entry['answer']['mode'] == 'manual'
    assert len([step for step in entry['steps'] if step.get('input')]) == 2
    model = entry['visualization']['model']
    for key, view in model['views'].items():
        v, arrows = measurements(model,key)
        arrow_count += len(arrows)
        view_count += 1
        points = {name.split('__v')[0] for name in view['points']}
        if n == 988 or n == 989 and 'P' in points:
            if 'R' not in points:
                assert n == 988 and close(norm(v('PQ')),4) and eq(plus(v('PQ'),v('QP')),(0,0))
            else:
                x,y = v('PQ'),v('QR')
                assert close(determinant(x,y),0) and close(norm(x),5) and close(norm(y),3)
                assert close(norm(v('PR')),norm(x)+(1 if dot(x,y)>0 else -1)*norm(y))
        elif n == 989:
            assert [round(norm(v(pair)),6) for pair in ['OA','AB','OB']] == [3,4,5]
            assert eq(plus(v('OA'),v('AB')),v('OB')) and eq(plus(v('OB'),v('BA')),v('OA'))
        elif n == 990:
            assert eq(v('BN'),scale(v('NC'),2))
            assert eq(v('AN'),minus(scale(v('BC'),2/3),v('BA')))
        elif n == 991:
            assert eq(v('MX'),scale(v('XN'),1.5)) and eq(v('NY'),scale(v('YP'),1.5))
            assert eq(v('XY'),minus(scale(v('NP'),3/5),scale(v('NM'),2/5)))
            assert eq(v('MP'),minus(v('NP'),v('NM')))
        elif n == 992:
            a,b = v('BA'),v('CD')
            assert eq(v('AD'),scale(v('BC'),3)) and eq(v('AK'),v('BC'))
            assert eq(v('CK'),a) and eq(v('KD'),minus(b,a)) and eq(v('BC'),scale(minus(b,a),.5))
        elif n == 993:
            assert eq(v('BC'),scale(v('AB'),.5))
            assert eq(v('OB'),scale(plus(v('OA'),scale(v('OC'),2)),1/3))
        elif n == 994:
            m,n_parts = (3,1) if key in ('step-3','case-3') else (1,2)
            assert eq(scale(v('AC'),n_parts),scale(v('CB'),m))
            assert eq(v('OC'),scale(plus(scale(v('OA'),n_parts),scale(v('OB'),m)),1/(m+n_parts)))
        elif n == 995:
            for start,middle,end in ['KAL','LBM','MCN','NDK']:
                assert eq(v(start+middle),v(middle+end))
            assert eq(plus(v('OA'),v('OC')),plus(v('OB'),v('OD')))
        elif n == 996:
            assert close(dot(v('AB'),v('AD')),0) and close(determinant(v('BC'),v('AD')),0)
            assert close(degrees(acos(dot(v('CB'),v('CD'))/(norm(v('CB'))*norm(v('CD'))))),120)
            assert close(norm(v('AC')),norm(v('CD'))) and norm(v('AC'))<norm(v('BD'))
            assert close(norm(v('AH')),norm(v('HD'))) and close(norm(v('MN')),.75*norm(v('CD')))
        elif n == 997:
            xx,yy=zip(*(model['points'][name][:2] for name in view['points']))
            assert max(xx)-min(xx)>=36 and max(yy)-min(yy)>=36, 'the complete model must occupy the mobile drawing area'
            assert eq(v('AM'),v('MB')) and eq(v('CN'),v('ND'))
            assert close(determinant(v('MN'),v('MP')),0)
            for vertex,side,perpendicular in [('A','AD','PH'),('A','AB','PS'),('B','BC','PK')]:
                assert close(distance(v(vertex+'P'),v(side)),2)
                if perpendicular[-1] in points:
                    assert close(norm(v(perpendicular)),2) and close(dot(v(perpendicular),v(side)),0)
            if key in ('step-3','case-3'):
                assert dot(v('NP'),v('MN'))>0 and norm(v('NP'))>1
                positions=[model['points'][name] for name in view['points']]
                assert len({tuple(p) for p in positions})==len(positions), 'distinct labels in the extension view'
            else:
                assert dot(v('NP'),v('MN'))<0

inequalities=ratios=0
for a,b,c,d in product(range(-3,4),repeat=4):
    x,y = (a,b),(c,d)
    joined = plus(x,y)
    assert norm(x)-norm(y)-1e-12 <= norm(joined) <= norm(x)+norm(y)+1e-12
    inequalities+=1
for a,b,m,n in product(range(-5,6),range(-5,6),range(1,5),range(1,5)):
    c=(n*a+m*b)/(m+n)
    assert close((c-a)*n,(b-c)*m)
    ratios+=1
print(f'VECTOR_EXTRA_OK {len(cards)} source problems, {view_count} views, {arrow_count} measured arrows, {inequalities} length estimates, {ratios} segment divisions.')

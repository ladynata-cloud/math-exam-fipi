"""Check the exact book's unit conversions and each of the nine directed diagonal relations."""
import json
from fractions import Fraction
from itertools import product
from math import hypot,sqrt
from vector_model_measurements import close,determinant,eq,measurements,plus
from vector_scaling import ROOT,scale

cards=json.loads((ROOT/'geometry-course/textbook/data/coordinate-coefficients.json').read_bytes())['lessons']
assert [e['source'].get('point') for e in cards[:2]]==['93','94']
assert [e['source'].get('subpart') for e in cards[2:6]]==list('абвг')
assert [e['source'].get('subpart') for e in cards[6:]]==list('абвгдежзи')
ratios=[-2/.5,24*10/12,-4*100/400,sqrt(50)/sqrt(2)]
directed=['AC AO','BO BD','OC CA','AB DC','BC DA','AM CA','MC AM','AC CM','AO BD']
expected=[Fraction(2),Fraction(1,2),Fraction(-1,2),Fraction(1),Fraction(-1),Fraction(-1,4),Fraction(3),Fraction(-4,3),None]
names='абвгдежзи';views=arrows=0
for entry in cards:
    source=entry['source']
    n=int(source.get('exercise',source.get('point')))
    page={93:[246,247,248],94:[248,249,250]}.get(n,[251])
    assert (source['bookId'],source['chapter'],source['printedPages'],source['pdfPages'])==('atanasyan-2023-7-9','XI',page,[k+1 for k in page])
    assert len([s for s in entry['steps'] if s.get('input')])==2
    m=entry['visualization']['model']
    if n>94:
        index=names.index(source['subpart'])
        answer=entry['answer']
        if n==998:assert close(float(Fraction(answer['accepted'][0])),ratios[index])
        elif index<8:assert Fraction(answer['accepted'][0])==expected[index]
        else:assert answer['mode']=='manual'
    for key,item in m['views'].items():
        v,edges=measurements(m,key);views+=1;arrows+=len(edges)
        points={pt.split('__v')[0] for pt in item['points']}
        if n==93:
            assert not close(determinant(v('OA'),v('OB')),0)
            if 'K' in points:
                assert eq(v('OK'),scale(2,v('OA'))) and eq(v('KP'),scale(3,v('OB')))
                assert eq(plus(v('OK'),v('KP')),v('OP'))
            else:assert eq(v('OP'),scale(-2,v('OB')))
        elif n==94:
            if 'I' in points:
                assert eq(v('OI'),(1,0)) and eq(v('OJ'),(0,1))
                assert eq(v('OP'),(3,-2)) and eq(v('OP'),plus(v('OH'),v('HP')))
            else:assert eq(v('OB'),(5,-1)) and eq(v('OB'),plus(v('OA'),v('AB')))
        elif n==998:
            if 'C' in points:assert eq(v('BC'),scale(ratios[index],v('OA')))
            elif 'A' in points:assert eq(v('OA'),(1,0))
            else:assert eq(v('RS'),scale(-ratios[index],v('PQ')))
        else:
            left,right=directed[index].split()
            assert eq(v('AO'),v('OC')) and eq(v('AM'),v('MO')) and eq(v('BO'),v('OD'))
            k=expected[index]
            if k is None:assert not close(determinant(v(left),v(right)),0)
            else:assert eq(v(left),scale(float(k),v(right)))
checks=0
for ax,ay,bx,by in product(range(-2,3),repeat=4):
    a,b=(ax,ay),(bx,by);det=determinant(a,b)
    if det==0:continue
    for x,y in product(range(-2,3),repeat=2):
        p=plus(scale(x,a),scale(y,b))
        assert determinant(p,b)/det==x and determinant(a,p)/det==y
        checks+=1
print(f'COORDINATE_COEFFICIENTS_OK {len(cards)} source cards, 4 unit conversions, 9 diagonal relations, {views} views, {arrows} measured arrows and {checks} independent coefficients.')

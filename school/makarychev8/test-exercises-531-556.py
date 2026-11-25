"""Makarychev 2024, exact printed exercise/answer comparison (pp. 125–128 and 308–309)."""
from collections import Counter
from pathlib import Path
import json
import re
import sympy as S

directory=Path(__file__).resolve().parent
new=json.loads((directory/'exercises-531-556.json').read_text())
old=json.loads((directory/'ch3.json').read_text())[1]['tasks']
card={q['source']['reference'][2:]:q for q in new+old if q['source']['type']=='textbook'}
count={531:4,532:8,533:6,534:6,535:4,536:2,537:8,538:8,539:8,540:8,541:6,542:4,543:8,544:4,545:8,546:6,547:3,548:4,549:6,550:4,551:2,552:6,553:4,554:1,555:2,556:4}
assert len(card)==134 and len(new)==132 and sum(len(q['steps']) for q in new)==272
assert Counter(int(r[:3]) for r in card)==count
assert all(q['source']['page']==(125 if int(r[:3])<=539 else 126 if int(r[:3])<=546 else 127 if int(r[:3])<=553 else 128) for r,q in card.items())
symbol={c:S.symbols(c,real=True) for c in 'xyatpmdnz'}
def exact(s):
    s=s.replace('−','-').replace(',','.').replace('√(','sqrt(')
    s=re.sub(r'√(\d+)',r'sqrt(\1)',s)
    s=re.sub(r'(\d)(?=sqrt)',r'\1*',s)
    return S.sympify(s,locals=symbol,rational=True)
def numset(s):
    if s.lower() in ['нет','корней нет','нет корней','none']:return S.EmptySet
    return S.FiniteSet(*(exact(a) for a in s.split(';')))
def expr(t):
    if isinstance(t,str):return exact(t)
    op,*branches=t;v=[expr(u) for u in branches]
    return {'+':lambda:v[0]+v[1],'-':lambda:v[0]-v[1],'=':lambda:v[0]-v[1],'*':lambda:v[0]*v[1],'/':lambda:v[0]/v[1],'^':lambda:v[0]**v[1],'neg':lambda:-v[0],'sqrt':lambda:S.sqrt(v[0])}[op]()
# Answer-key values, written independently of the course constructor.
printed={
532:['1;4/3','3/5;1','2;7/3','2;5/2','1/5;1','-3;11/4','-2;12','-10;9'],
533:['-1/7;1/2','(3-sqrt(29))/2;(3+sqrt(29))/2','none','1/9','-8;19','none'],
534:['1/5;2','-6;5/2','5/3','-1/5;1/7','(1-sqrt(41))/4;(1+sqrt(41))/4','1/4'],
535:['5;6','(7-sqrt(41))/2;(7+sqrt(41))/2','0;3','-1;1'],536:['2;9','1/2;2'],
537:['2;8/3','1/5;3','-10;8','-1;23','7/2;11/2','-1;37/15','(10-sqrt(2))/7;(10+sqrt(2))/7','5-5*sqrt(2);5+5*sqrt(2)'],
538:['1/2;5/4','-3/2;1/6','-1/2','-6;14','-3-2*sqrt(7);-3+2*sqrt(7)','-6;4/5','17','-20/3;-4'],
539:['-1/2;3','1;5/3','-1;-4/5','1/6','none','-11;2','4;8','7/10;9/10'],
540:['-1/5;2','-7;2','3-3*sqrt(2);3+3*sqrt(2)','-4;5','16;36','-1;37/15','1/5','-5/4;1'],
541:['1;25','-10;1/3','-8;12','1/3;3','20-10*sqrt(5);20+10*sqrt(5)','none'],
542:['-1/5;17/10','(7-sqrt(13))/6;(7+sqrt(13))/6','5-sqrt(5);5+sqrt(5)','-4;1/2'],
543:['-8;3','7/4;4','-8/3;-2','1/15','-91;87','-59;53','0;2','-2;3'],
544:['-1;23','2;7/3','1/26;1','-5;-3'],
549:['-1;20/7','-7;5','-1/5;9/5','none','25','-9;3'],
550:['7','3/5;2','-3/4;5/2','-1/2;2/3'],
551:['-1/15;2/5','1;3/2']}
for n,row in printed.items():
    for part,expected in zip('абвгдежз',row):
        r=str(n)+part
        assert numset(card[r]['answer'])==numset(expected),(r,card[r]['answer'],expected)
round_key={'545а':[-.36,.56],'545б':[-2.78,-.72],'545в':[-1.26,1.59],'545г':[-9.20,1.20],'548а':[1.35,6.65],'548б':[.78,3.22]}
for r,values in round_key.items():
    assert list(map(float,card[r+', округление']['answer'].split(';')))==values,r
    assert sorted(round(float(v),2) for v in numset(card[r]['answer']))==values,r
for r,q in card.items():
    if q['kind']!='quadratic-roots':continue
    equation=expr(q['mathExpression']);variable=next(iter(equation.free_symbols))
    expected=S.solveset(equation,variable,domain=S.Reals)
    assert expected==numset(q['answer']),r
    if q.get('quadraticCoefficients'):
        p=S.Poly(equation,variable).monic()
        a,b,c=q['quadraticCoefficients']
        assert S.Poly(a*variable**2+b*variable+c,variable).monic()==p,r
        assert q['steps'][0]['answer']==';'.join(map(str,(a,b,c)))
        if r.startswith('537'):
            k=b//2;assert int(q['steps'][1]['answer'])==k and int(q['steps'][2]['answer'])==k*k-a*c
for r,d,n in [('531а',1,2),('531б',-15,0),('531в',0,1),('531г',49,2)]:
    assert list(map(int,card[r]['answer'].split(';')))==[d,n]
for r in ('546а','546б','547'):
    draw=card[r+', построение'];square,line=draw['graph']['curves']
    assert square['kind']=='square' and line['kind']=='line'
    ys=[S.Rational(x*x) for x in square['xs']]+[S.Rational(str(line['k']))*x+line['b'] for x in line['xs']]
    assert ys==list(map(S.Rational,draw['answer'].split(';')))
    graph=card[r+', оценка по графику'];sol=numset(card[r]['answer'])
    assert sorted(map(float,sol))==sorted(graph['rootValues'])
    assert all(abs(float(y)-z)<=graph['tolerance'] for y,z in zip(graph['answer'].split(';'),sorted(map(float,sol))))
for part in 'аб':
    vals=[numset(card['552'+part+', '+s]['answer']) for s in ['первое','второе']]
    assert {1/v for v in vals[0]}==set(vals[1])
assert card['552, доказательство']['answer']=='3;1;2;4'
a,x,y=S.symbols('a x y',real=True)
D=S.discriminant(x*x-a*x+a-4,x);assert D.expand()==((a-2)**2+12).expand()
assert [card['553'+p]['answer'] for p in 'абв']==['Нет таких a','Нет таких a','Подходит любое действительное a']
assert expr(card['554']['mathExpression']).subs(a,S.Rational(-3,2))==S.Rational(15,2)==exact(card['554']['answer'])
for ref,answer in [('555а',S.sqrt(3)+S.sqrt(2)),('555б',2+3*S.sqrt(5))]:
    assert S.simplify(expr(card[ref]['mathExpression'])-answer)==0 and S.simplify(exact(card[ref]['answer'])-answer)==0
for p,expected in zip('абвг',[(S.Rational(1,5),S.Rational(2,5)),(5,4),(-3,-7),(1,3)]):
    q=card['556'+p];coords=tuple(map(S.Rational,q['answer'].split(';')));assert coords==expected
    assert all(coords[1]==k*coords[0]+b for k,b in q['graph']['lines'])
print('PASS 26 source exercises, 134 cards with two preserved, 272 new steps, exact discriminants, rounded pairs, reciprocal proof, parameter and graph models')

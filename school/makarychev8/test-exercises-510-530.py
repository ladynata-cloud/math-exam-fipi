"""Independent source and answer checks for Makarychev 8, print pages 118–120 (2024)."""
import json
import re
from collections import Counter
from pathlib import Path
import sympy as S

base = Path(__file__).resolve().parent
new = json.loads((base / 'exercises-510-530.json').read_text())
original = json.loads((base / 'ch3.json').read_text())[0]['tasks']
cards = {task['source']['reference'][2:]: task for task in new + original if task['source']['type'] == 'textbook'}
assert len(new) == 68 and len(cards) == 70 and sum(len(task['steps']) for task in new) == 146
# The 21 source numbers include both existing cards and each secondary question.
counts = {510:6,511:7,512:3,513:6,514:6,515:6,516:6,517:3,518:2,519:4,520:4,521:4,522:1,523:1,524:1,525:1,526:1,527:1,528:2,529:3,530:2}
assert Counter(int(key[:3]) for key in cards) == counts
assert all(ques['source']['page'] == (118 if int(key[:3]) <= 515 else 119 if int(key[:3]) <= 526 else 120) for key,ques in cards.items())

# Independent transcription in the book's order. Use the rational form of every
# printed decimal, including 1 2/3 and 4,5 in exercise 520.
x,y,t,a,p,m,v,z,u=S.symbols('x y t a p m v z u',real=True)
vars_by_name={s.name:s for s in [x,y,t,a,p,m,v,z,u]}
def exact(text):
    return S.sympify(text.replace('^','**'),locals=vars_by_name,rational=True)
source={
510:['37/10*x^2-5*x+1','48*x^2-x^3-9','21/10*x^2+2*x-2/3','x+x^2-1','7*x^2-13','-x^2'],
511:['5*x^2-9*x+4','x^2+3*x-10','-x^2-8*x+1','x^2+5*x','6*x^2-30','9*x^2'],
513:['4*x^2-9','-x^2+3','-x^2/10+10','y^2-1/9','6*v^2+24','3*m^2-1'],
514:['2*x^2-17','3*t^2-36/5','-p^2+63/5'],515:['3*x^2-4*x','-5*x^2+6*x','10*x^2+7*x','4*a^2-3*a','6*z^2-z','2*y+y^2'],
516:['2*x^2+3*x','3*x^2-2','5*u^2-4*u','7*a-14*a^2','1-4*y^2','2*x^2-6'],
517:['x^2-19','x^2+19','x^2+19*x'],518:['5*a^2+5*a-6-24','a*(a-4)-60'],
519:['4*x^2-3*x+7-(2*x^2+x+7)','-5*y^2+8*y+8-(8*y+3)','10-3*x^2-(x^2+10-x)','1-2*y+3*y^2-(y^2-2*y+1)'],
520:['(x+3)*(x-4)+12','5*t/3+(2*t+1)*(t/3-1)','3*x*(2*x+3)-2*x*(x+9/2)-2','(x-1)*(x+1)-2*(x^2-3)'],
521:['x^2-5-(x+5)*(2*x-1)','2*x-(x+1)^2-(3*x^2-6)','6*a^2-(a+2)^2+4*(a-4)','(5*y+2)*(y-3)+13*(2+y)']}
def from_tree(tree):
    if isinstance(tree,str):return exact(tree)
    op,*children=tree
    vals=list(map(from_tree,children))
    return {'=':lambda:vals[0]-vals[1],'+':lambda:sum(vals),'-':lambda:vals[0]-vals[1],
            '*':lambda:vals[0]*vals[1],'/':lambda:vals[0]/vals[1],'^':lambda:vals[0]**vals[1],
            'sqrt':lambda:S.sqrt(vals[0]),'neg':lambda:-vals[0]}[op]()
def value(symbol):
    s=re.sub(r'(\d)√',r'\1*√',symbol)
    return exact(re.sub(r'√(\d+)',r'sqrt(\1)',s))
for num,parts in source.items():
    for letter,expression in zip('абвгде',parts):
        ref=str(num)+letter
        q=cards[ref]; equation=exact(expression); var=next(iter(equation.free_symbols))
        if ref not in ('513а','515а'):
            assert S.simplify(from_tree(q['mathExpression'])-equation)==0,ref
        if num==510:assert (q['answer']=='Да, квадратное')==(S.degree(equation,var)==2)
        elif num==511:assert list(map(int,q['answer'].split(';')))==S.Poly(equation,var).all_coeffs()
        elif num==517:assert (q['answer']=='Да, верно')==(S.solveset(equation,var,domain=S.Reals)==S.EmptySet)
        else:
            real=S.solveset(equation,var,domain=S.Reals); given=q['answer']
            assert real==(S.EmptySet if given=='нет' else S.FiniteSet(*map(value,given.split(';')))),ref
            if num==514:
                rounded=cards[ref+', округление']
                assert sorted(round(float(elem),1) for elem in real)==sorted(map(float,rounded['answer'].split(';')))
assert cards['511, приведённые']['answer']=='б и г'
n=S.symbols('n',integer=True)
candidates=S.solve(n*(n+1)-S.Rational(3,2)*n**2,n)
assert [(i,i+1) for i in candidates if i*(i+1)>i**2]==[(2,3)] and cards['522']['answer']=='2 и 3'
length,width=map(int,cards['523']['answer'].split(';'));assert length*width==800 and length==2*width
assert int(cards['524']['answer'])**2==59+85
assert S.simplify(value(cards['525']['accepts'][0])-16/S.sqrt(41))==0 and round(float(16/S.sqrt(41)),1)==float(cards['525']['answer'])
assert 10*int(cards['526']['answer'])**2/2==80
assert int(cards['527']['answer'])==2*(1+S.Rational(3,4))*S.sqrt(4800/S.Rational(3,4))
L,W=map(int,cards['528, дюймы']['answer'].split(';'));assert L*L+W*W==625 and L*3==W*4
assert list(map(S.Rational,cards['528, сантиметры']['answer'].split(';')))==[v*S.Rational(254,100) for v in (L,W)]
for suffix,k in zip('абв',[1-S.sqrt(2),4-S.sqrt(15),S.sqrt(35)-S.Rational(57,10)]):
    q=cards['529'+suffix]; assert S.simplify(from_tree(q['mathExpression'])-(y-k*x))==0
    assert q['answer']==('I и III' if k>0 else 'II и IV')
for suffix,arg in [('первое значение',S.Rational(36,100)),('второе значение',49)]:
    q=cards['530, '+suffix]; original=(9+6*x+x*x)/(x+3)+S.sqrt(x)
    assert S.simplify(from_tree(q['mathExpression'])-original)==0
    assert original.subs(x,arg)==S.Rational(q['answer'])
print('PASS 21 source numbers, 70 cards including two preserved, 146 new steps, real root sets, exact and rounded roots, models, units and graph quadrants')

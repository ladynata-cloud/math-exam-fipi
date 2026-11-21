"""Printed pp. 129–131 and source keys on p. 309, checked separately from the cards."""
import json
from pathlib import Path
from fractions import Fraction as F
from itertools import combinations

root = Path(__file__).resolve().parent
topic = next(x for x in json.loads((root/'ch3.json').read_text()) if x['id'] == 'p22')
cards = [*topic['tasks'][:2],*json.loads((root/'exercises-557-577.json').read_text())]
def answer(n):
    return next(c['answer'] for c in cards if c['source']['reference'] == '№ '+str(n))
def vals(s):
    return [F(v) for v in s.split(';')]
def factors(p):
    return [(i,p//i) for i in range(1,p+1) if p%i==0 and i<=p//i]
def check_set(n, values):
    assert set(vals(answer(n))) == set(values),n
assert [c['source']['page'] for c in cards] == [129 if int(c['source']['reference'].split()[1][:3])<=558 else 130 if int(c['source']['reference'].split()[1][:3])<=569 else 131 for c in cards]
assert len({c['source']['reference'] for c in cards})==29
check_set(557,next((a,b) for a,b in factors(187) if b-a==6))
for n,area,diff in [(558,60,4),(559,1200,10)]:
    a,b=next((a,b) for a,b in factors(area) if b-a==diff)
    assert int(answer(n))==2*(a+b)
check_set(560,next((a,b) for a,b in factors(210) if a+b==31))
check_set(561,next((a,b) for a,b in factors(120) if a+b==23))
x=next(x for x in range(1,110) if x*(x+1)-(2*x+1)==109)
check_set(562,[x,x+1])
assert int(answer(563)) == next(a for a,b in factors(4500) if b-a==120)
check_set(564,[n for n in range(1,13) if (26-2*n)*n==80])
for w in [5,8]:
    total,a,b,h=vals(answer('564, чертёж '+str(w)+' см'))
    assert 2*total==26 and 2*h==w and a==h and total-b==h and 4*(b-a)*h==80
assert int(answer(565)) == next(h for h in range(7,100) if h*h==(h-3)**2+(h-6)**2)
assert int(answer(566)) == next(a for a,b in factors(884) if b-a==8)
check_set(567,[x for x in range(1,100) if (F(x,8))**2+12==x])
assert int(answer(568))==next(x for x in range(15,150) if (F(x,5)-3)**2+1==x)
assert (F(5,5)-3)**2+1==5 and (F(5,5)-3)<0
assert int(answer(569))==next(n for n in range(3,30) if len(list(combinations(range(n),2)))-n==n+25)
for n,g in [(570,36),(571,45)]:
    assert int(answer(n))==next(n for n in range(2,20) if len(list(combinations(range(n),2)))==g)
assert int(answer(572))==next(x for x in range(1,20) if (60-2*x)*(40-2*x)==800)
triples=[(t-1,t,t+1) for t in range(-30,31) if sum(s*s for s in (t-1,t,t+1))==869]
check_set(573,[t[1] for t in triples])
check_set('573, отрицательная тройка',triples[0])
check_set('573, положительная тройка',triples[1])
for a in range(-9,9):
    f=F(8*a**3-27,9-12*a+4*a*a)
    assert f==F(4*a*a+6*a+9,2*a-3)
    for x in range(-9,9):
        if a!=2 and x!=3:
            assert F(a*x-2*x-4*a+8,3*a-6-a*x+2*x)==F(x-4,3-x)
assert int(answer(575))==1 and 5==2*2+1
for part,solutions,expr in [
    ('а',[0,6],lambda x:x*(x-3)/6-x/2),
    ('б',[F(-7,4),0],lambda x:x*(x+1)/3+(8+x)/4-2),
    ('в',[4],lambda x:2*x/5+(9-x)/4+(9-x)/6-3-F(41,60)),
    ('г',[21],lambda x:1+(x-F(7,2))/5+F(1,2)-x/F(7,2)+1)]:
    check_set('576'+part,solutions)
    assert all(expr(F(x))==0 for x in solutions)
x1,y1,x2,y2=vals(answer(577))
assert y1==x2==0 and y1==13*x1-F(26,10) and y2==13*x2-F(26,10)
print('PASS source 557–577, all required answers, contextual rejection and both scale drawings')

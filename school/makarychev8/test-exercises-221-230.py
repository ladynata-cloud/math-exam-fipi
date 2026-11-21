"""Independent algebra on Makarychev 2024 pp. 57–58, including the separate proof cases."""
from collections import Counter
from fractions import Fraction
import json
from math import gcd
from pathlib import Path
import re
import subprocess
import sympy as S
from sympy.parsing.sympy_parser import parse_expr,standard_transformations,implicit_multiplication_application,rationalize

base=Path(__file__).resolve().parent
topics=json.loads((base/'exercises-221-230.json').read_text())['topics']
cards={q['title'][2:]:q for tasks in topics.values() for q in tasks}
assert Counter(int(s[:3]) for s in cards)==dict(zip(range(221,231),[1,4,1,4,4,1,3,4,4,4]))
assert sum(len(q['steps']) for q in cards.values())==61
assert all(q['source']['page']==(57 if int(s[:3])<=226 else 58) for s,q in cards.items())
assert all(q['source']['paragraph']==(1 if int(s[:3])<=223 else 2) for s,q in cards.items())
a,b,c,k,n,r,x,y=S.symbols('a b c k n r x y',real=True)
def parse(t):
    t=re.sub('[⁰¹²³⁴⁵⁶⁷⁸⁹]+',lambda m:'**'+m[0].translate(str.maketrans('⁰¹²³⁴⁵⁶⁷⁸⁹','0123456789')),t)
    return parse_expr(t.replace('−','-').replace('^','**'),local_dict={v.name:v for v in (a,b,c,k,n,r,x,y)},transformations=standard_transformations+(implicit_multiplication_application,rationalize))
def source(q):
    return [(parse(u),parse(v)) for u,v in re.findall(r'\{\{frac:([^:}]+):([^}]+)\}\}',q['prompt'])]
def eq(one,two):
    assert S.cancel(one-two)==0,(one,two)

# Check both source fractions and the actual sign between them before simplifying.
cases={
 '224а':(x*x-2*x,x-3,-1,4*x-9,x-3),'224б':(y*y-10,y-8,-1,54,y-8),
 '224в':(a*a,a*a-b*b,1,b*b,b*b-a*a),'224г':(x*x-2*x,x*x-y*y,-1,2*y-y*y,y*y-x*x),
 '225а':((y-b)**2,y-b+1,1,y-b,y-b+1),'225б':((a+x)**2,a+x-2,-1,2*a+2*x,a+x-2),
 '225в':(x*x-y*y,x-y-1,1,x+y,y-x+1),'225г':(b*b-9*c*c,b+3*c-2,1,2*(b-3*c),2-b-3*c),
 '230а':(3*b*b-5*b-1,b*b*y,1,5*b-3,b*y),'230б':(a*a-a+1,a**3*x,-1,x*x-1,a*x**3),
 '230в':(1+c,c**3*y**4,-1,c**3+y**4,c*c*y**8),'230г':(c*c+x*x,c*c*x**5,-1,c+x,c**3*x**3)}
for key,(first,den,sgn,second,den2) in cases.items():
    q=cards[key];terms=source(q)
    assert len(terms)==2 and ('}} + {{frac:' if sgn==1 else '}} − {{frac:') in q['prompt']
    for actual,expect in zip((*terms[0],*terms[1]),(first,den,second,den2)):eq(actual,expect)
    eq(parse(q['answer']),first/den+sgn*second/den2)
for letter,(u,v) in zip('абвг',[(36,(a-b)**2),(108,(b-a)**2),((5*a-5*b)**2,45),(a*a+a*b+b*b,a**3-b**3)]):
    task=cards['222'+letter];(u1,v1),=source(task);eq(u1,u);eq(v1,v);eq((S.sympify(u)/v).subs(a,b+9),parse(task['answer']))
for no,ratio,parts in [(228,5,[(x+y,y),(x-y,y),(y,x),(x+2*y,x)]),(229,2,[(x,y),(y,x+y),(x-y,y),(y,x)])]:
    for letter,(u,v) in zip('абвг',parts):
        q=cards[str(no)+letter];(u1,v1),=source(q);eq(u1,u);eq(v1,v);eq((u/v).subs(x,ratio*y),parse(q['answer']))
for l,(u,v) in zip('абв',[(n+6,n),(5*n-12,n),(36-n*n,n*n)]):
    q=cards['227'+l];(u1,v1),=source(q);eq(u1,u);eq(v1,v);eq(parse(q['steps'][0]['answer']),u/v)
    # n | 6, n | 12, or n² | 36 bounds all integral cases by 36.
    solutions={j for j in range(1,37) if (S.sympify(u)/v).subs(n,j).is_integer and (u/v).subs(n,j)>0}
    assert set(map(int,q['answer'].split(';')))==solutions
(u,v),=source(cards['221'])
eq(u,x*x-2*y*y);eq(v,3*y*y+5*x*y);eq(u.subs({x:k*x,y:k*y},simultaneous=True),k*k*u);eq(v.subs({x:k*x,y:k*y},simultaneous=True),k*k*v)
eq((a/b)*(b/c)*(c/a),S.Integer(1));assert S.solveset(r**3-1,r,domain=S.Reals)==S.FiniteSet(1)
assert all(gcd(den,num)==gcd(den,den-num) for den in range(2,90) for num in range(1,den))
checks="""
const C=require('./check.js'),assert=require('node:assert/strict');const t=JSON.parse(require('node:fs').readFileSync(0,'utf8'));
for(const [reference,good,bad] of [['221',['2;5;3','5→2→3'],['2;3;5','2;5;5','2;5;3;4']],['223',['3;1;5;2'],['1;3;5;2','3;1;6;2']],['226',['4;1;2'],['4;3;2','4;1;5']]]){
 for(const answer of good)assert(C.check(answer,t[reference]),reference+' '+answer);
 for(const answer of bad)assert(!C.check(answer,t[reference]),reference+' '+answer);
}
assert(!C.check('(n+6)/n',t['227а'].steps[0]));assert(C.check('6/n+1',t['227а'].steps[0]));
"""
subprocess.run(['node','-e',checks],cwd=base,input=json.dumps(cards),text=True,check=True)
print('PASS all 30 source cards on pp. 57–58, 61 steps, proof dependencies, operations/signs, divisors and original domains')

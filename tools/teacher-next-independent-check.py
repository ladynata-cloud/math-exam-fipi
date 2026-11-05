#!/usr/bin/env python3
"""Independent second-release review from displayed questions/answers only.

No use of a task's check metadata or the factory's numerical parameters.
This is intentionally scoped to the 22 reviewed algebra/probability topics;
wording changes require a deliberate parser update, rather than silent skipping.
"""
from pathlib import Path
from fractions import Fraction as F
from itertools import permutations, combinations, product
from collections import Counter
import importlib.util
import re
import sympy as s
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application

ROOT = Path(__file__).resolve().parents[1]
x,y,a,b,n = s.symbols('x y a b n', real=True)
TRANS = standard_transformations + (implicit_multiplication_application,)
LOCAL = {'x':x,'y':y,'a':a,'b':b,'n':n,'sin':s.sin,'cos':s.cos,'sqrt':s.sqrt,'log':s.log,'pi':s.pi}

def module(name):
    spec=importlib.util.spec_from_file_location(name,ROOT/f'tools/teacher-banks/{name}.py')
    m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

def clean(t):
    return t.replace('−','-').replace('·','*').replace('π','pi').replace('²','**2').replace('³','**3').replace('^','**').strip().rstrip('.')

def expression(t, evaluate=True):
    t=clean(t)
    t=re.sub(r'√x\b','sqrt(x)',t)
    t=re.sub(r'\b(sin|cos) ([xy])',r'\1(\2)',t)
    t=re.sub(r'log_(\d+)\(([^()]*)\)',lambda m:f'log({m[2]},{m[1]})',t)
    return parse_expr(t,local_dict=LOCAL,transformations=TRANS,evaluate=evaluate)

def eq(left,right):
    assert s.simplify(s.trigsimp(left-right))==0,(left,right)

def numbers(t):
    return [int(z) for z in re.findall(r'-?\d+',clean(t))]

def answer_number(t):
    return expression(re.match(r'[-−]?\d+(?:/\d+)?',t)[0])

def relation(left,op,right):
    return {'<':s.Lt,'>':s.Gt,'≤':s.Le,'≥':s.Ge}[op](left,right)

def solution_set(t):
    t=t.split('; ОДЗ')[0].strip().rstrip('.')
    if '∞' in t or '∪' in t or (t[0] in '[(' and ';' in t):
        intervals=[]
        for part in t.split('∪'):
            part=part.strip();lo,hi=part[1:-1].split(';')
            p=lambda z: -s.oo if z.strip()=='−∞' else s.oo if z.strip()=='+∞' else expression(z)
            intervals.append(s.Interval(p(lo),p(hi),left_open=part[0]=='(',right_open=part[-1]==')'))
        return s.Union(*intervals)
    terms=re.split(r'([<>≤≥])',t)
    result=s.S.Reals
    for i in range(1,len(terms),2):
        result &= s.solve_univariate_inequality(relation(expression(terms[i-1]),terms[i],expression(terms[i+1])),x,relational=False)
    return result

def roots_answer(t):
    if t=='Решений нет.':return s.S.EmptySet
    return s.FiniteSet(*(expression(v) for v in t.removeprefix('x = ').rstrip('.').split(';')))

def algebra_check(pid,i,q,ans,sol):
    if pid=='piecewise-functions':
        first,second,z=re.fullmatch(r'f\(x\) = (.*?) при x < 0; f\(x\) = (.*?) при x ≥ 0\. Найдите f\((-?\d+)\)\.',q).groups()
        eq(expression(first if int(z)<0 else second).subs(x,int(z)),expression(ans))
    elif pid=='cube-formulas':
        eq(expression(q.split(': ')[1]),expression(ans))
    elif pid=='inverse-function':
        c=int(re.search(r'y = (\d+)/x',q)[1])
        if i==0:eq(c/s.Integer(re.search(r'при x = (\d+)',q)[1]),expression(ans))
        elif i==1:
            value=int(re.search(r'если y = (\d+)',q)[1]);assert roots_answer(ans)==s.FiniteSet(s.Rational(c,value))
        elif i==2:assert ans=='Все действительные x, кроме 0.'
        elif i==3:
            px,py=map(int,re.search(r'точка \((\d+); (\d+)\)',q).groups());assert (px!=0 and s.Rational(c,px)==py)==(ans=='Да.')
        else:
            u,v=map(int,re.search(r'при x = (\d+) и x = (\d+)',q).groups());aa,bb=map(int,re.findall(r'= (\d+)',ans));eq(aa,s.Rational(c,u));eq(bb,s.Rational(c,v));assert aa>bb
    elif pid=='sqrt-function':
        if i==0:eq(s.sqrt(int(re.search(r'x = (\d+)',q)[1])),expression(ans))
        elif i==1:assert roots_answer(ans)==s.FiniteSet(int(re.search(r'равна (\d+)',q)[1])**2)
        elif i==2:
            px,py=map(int,re.search(r'A\((\d+); (\d+)\)',q).groups());assert s.sqrt(px)==py and ans=='Только A.' and py>0
        elif i==3:
            u,v=map(int,re.findall(r'x = (\d+)',q));aa,bb=map(int,re.findall(r'\d+',ans));eq(aa,s.sqrt(u));eq(bb,s.sqrt(v));assert aa<bb
        else:
            upper=int(re.search(r'x ≤ (\d+)',q)[1]);assert solution_set(ans)==s.Interval(0,s.sqrt(upper))
    elif pid=='rational-equations':
        left,right=q.removeprefix('Решите ').split('. Укажите')[0].split(' = ')
        le,ri=expression(left,False),expression(right,False)
        poles=s.S.EmptySet
        for term in s.preorder_traversal(le-ri):
            if term.is_Pow and term.exp.is_negative:
                poles |= s.solveset(term.base,x,domain=s.S.Reals)
        actual=s.solveset(s.together(le-ri).as_numer_denom()[0],x,domain=s.S.Reals)-poles
        assert actual==roots_answer(ans),(actual,ans)
        shown=s.FiniteSet(*(expression(z) for z in re.findall(r'x ≠ ([^,.]+)',sol)))
        assert shown==poles,(shown,poles)
    elif pid=='quadratic-word-problems':
        if i in (0,3):
            diff,area=map(int,re.search(r'на (\d+) см.*?(?:площадь|площадь) (\d+) см',q,re.I).groups())
            r=[z for z in s.solve(x*(x+diff)-area,x) if z>0][0]
            expected=[r,r+diff] if i==0 else [2*(2*r+diff)]
        elif i==1:
            value=int(re.search(r'равно (\d+)',q)[1]);r=[z for z in s.solve(x*(x+1)-value,x) if z>0][0];expected=[r,r+1]
        elif i==2:
            value=int(re.search(r'на (\d+) меньше',q)[1]);expected=[z for z in s.solve(x*x-x-value,x) if z>0]
        else:
            diff=int(re.search(r'на (\d+) см',q)[1]);area=int(re.search(r'прямоугольника (\d+) см',q)[1]);expected=[z for z in s.solve(x*(x+diff)-area,x) if z>0]
        assert numbers(ans)==expected,(numbers(ans),expected)
    elif pid=='numerical-inequalities':
        if i in (0,1):
            lhs,op,rhs=re.split('([<>])',ans.rstrip('.'))
            c=int(re.search(r'(?:\+ |−)(\d+)',q)[1])
            eq(expression(lhs)-expression(rhs),(a-b)*(1 if i==0 else -c));assert op==('<' if i==0 else '>')
        else:
            lo,hi=map(int,re.search(r'(\d+) < a < (\d+)',q).groups());aa,mid,bb=re.split('<',ans.rstrip('.'))
            if i==2:
                coeff=int(re.search(r'Оцените (\d+)a',q)[1]);expected=(lo*coeff,hi*coeff);eq(expression(mid),coeff*a)
            else:
                lb,hb=map(int,re.search(r'(\d+) < b < (\d+)',q).groups());expected=(lo+lb,hi+hb) if i==3 else (lo*lb,hi*hb);eq(expression(mid),a+b if i==3 else a*b);assert lo>0 and lb>0
            assert (int(aa),int(bb))==expected
    elif pid=='rational-inequalities':
        formula=q.removeprefix('Решите ').rstrip('.');le,op,ri=re.split(r'([<>≤≥])',formula)
        expected=s.solve_univariate_inequality(relation(expression(le),op,expression(ri)),x,relational=False)
        assert expected==solution_set(ans),(expected,ans)
    elif pid=='recursive-sequences':
        initial=int(re.search(r'₁ = (\d+)',q)[1]);sym=q[0];target=int(re.search(r'Найдите .([₃₄])',q)[1].translate(str.maketrans('₃₄','34')))
        if sym=='e':
            second=int(re.search(r'₂ = (\d+)',q)[1]);seq=[initial,second]
            while len(seq)<target:seq.append(seq[-1]+seq[-2])
        else:
            recurrence=re.search(r'ₙ₊₁ = (.*?) при n',q)[1].replace(sym+'ₙ','x');formula=expression(recurrence);seq=[initial]
            for k in range(1,target):seq.append(formula.subs({x:seq[-1],n:k}))
        eq(seq[-1],expression(ans))
    elif pid=='exponential-inequalities':
        body=q.removeprefix('Решите ').rstrip('.');le,op,ri=re.split(r'([<>≤≥])',body);le,ri=expression(le,False),expression(ri,False)
        base=le.base;assert base==ri.base and base>0 and base!=1
        if base<1:op={'<':'>','>':'<','≤':'≥','≥':'≤'}[op]
        expected=s.solve_univariate_inequality(relation(le.exp,op,ri.exp),x,relational=False);assert expected==solution_set(ans),(expected,ans)
    elif pid=='log-inequalities':
        base,arg,op,rhs=re.search(r'log_(\d+|\([^)]*\))\(([^)]*)\) ([<>≤≥]) ([−-]?\d+)',q).groups();base=expression(base);arg=expression(arg)
        domain=s.solve_univariate_inequality(arg>0,x,relational=False)
        if base<1:op={'<':'>','>':'<','≤':'≥','≥':'≤'}[op]
        expected=domain&s.solve_univariate_inequality(relation(arg,op,base**expression(rhs)),x,relational=False)
        assert expected==solution_set(ans),(expected,ans)
        assert 'ОДЗ' in sol
    elif pid=='log-properties':
        body=q.split('выразите ')[1].split(' через ')[0] if 'выразите' in q else q.split('упростите ')[1] if 'упростите' in q else q.removeprefix('Вычислите ')
        xp=s.Symbol('x',positive=True)
        eq(s.expand_log(expression(body).subs(x,xp),force=False),s.expand_log(expression(ans).subs(x,xp),force=False))
    elif pid=='trig-addition':
        eq(expression(q.split(': ')[1] if ': ' in q else q.removeprefix('Вычислите ')),expression(ans))
    elif pid=='derivative-rules':
        f=expression(q.split('f(x) = ')[1].split(', x')[0]);shown=expression(ans.split(' = ')[1].split(', x')[0]);eq(s.diff(f,x),shown)
    elif pid=='tangent-equation':
        formula,point=re.search(r'к y = (.*?) при x₀ = (-?\d+)',q).groups();f=expression(formula);p=int(point);line=expression(ans.removeprefix('y = '));eq(line.subs(x,p),f.subs(x,p));eq(s.diff(line,x),s.diff(f,x).subs(x,p));assert s.diff(line,x,2)==0
    elif pid=='area-between-graphs':
        upper,lower,lo,hi=re.search(r'между y = (.*?) и y = (.*?) при (\d+) ≤ x ≤ (\d+)',q).groups();lo,hi=int(lo),int(hi);u,l=expression(upper),expression(lower);eq(s.integrate(s.Abs(u-l),(x,lo,hi)),answer_number(ans));primitive=expression(re.search(r'F\(x\) = (.*?)\.',sol)[1]);eq(s.diff(primitive,x),u-l)
    else:raise AssertionError('Unknown algebra topic '+pid)


def probability_check(pid,i,q,ans):
    z=numbers(q)
    if pid=='frequency':
        if i==0:expected=F(z[1],z[0])
        elif i==1:expected=z[0]*F(*z[1:]) if len(z)==3 else z[0]*z[1]
        elif i==2:expected=F(100*z[1],z[0]);assert ans.endswith('%')
        elif i==3:expected=F(z[1]+z[3],z[0]+z[2])
        else:expected=F(z[0]-z[1],z[0])
    elif pid=='data-variance':
        if i==1:expected=z[1]-z[0]
        else:
            values=numbers(q.split(': ')[1]);mean=F(sum(values),len(values));expected=mean if i==0 else sum((F(v)-mean)**2 for v in values)/len(values)
    elif pid=='counting-product':
        if i==0:expected=len(list(product(range(z[0]),range(z[1]))))
        elif i==1:expected=len(list(product(*(range(v) for v in z))))
        elif i in (2,3):
            digits=numbers(q.split('набора ')[1].split('.')[0]);expected=len(list(product(digits,repeat=2))) if i==2 else len(list(permutations(digits,2)))
        else:expected=len(list(product(range(z[0]),range(z[1]))))
    elif pid=='permutations':
        if i in (0,1):expected=len(list(permutations(range(z[0]))))
        elif i==2:expected=len(list(permutations(range(z[0]-1))))
        elif i==3:expected=F(1,len(list(permutations(range(z[1])))))
        else:expected=F(1,z[0])
    elif pid=='combinations':
        if i in (0,4):expected=len(list(combinations(range(z[0]),2 if i==0 else 3)))
        elif i==1:expected=len(list(combinations(range(z[0]),z[1])))
        elif i==2:expected=len(list(product(range(z[0]),range(z[1]))))
        else:expected=F(1,len(list(combinations(range(z[0]),2))))
    elif pid=='geometric':
        if i==0:expected=F(z[3]-z[2],z[1]-z[0]);assert z[0]<=z[2]<=z[3]<=z[1]
        elif i==1:
            width,height,strip,length=z;assert length==height and 0<strip<=width;expected=F(strip*length,width*height)
        elif i==2:expected=F(z[2]-z[0],z[1]-z[0])
        elif i==3:expected=F(z[0],360)
        else:expected=F(z[2]**2,z[0]*z[1]);assert z[2]<=min(z[0],z[1])
    else:raise AssertionError('Unknown probability topic '+pid)
    eq(s.Rational(expected),answer_number(ans))


def main():
    alg=module('algebra');prob=module('probability');ids={'alg-'+item[0] for item in alg.NEXT_SPECS};ids|={'prob-'+n for n in ('frequency','data-variance','counting-product','permutations','combinations','geometric')}
    counts=Counter()
    for p in alg.build()+prob.build():
        if p['id'] not in ids:continue
        for v in p['variants']:
            for kind in ('sr','kr'):
                for i,t in enumerate(v[kind]):
                    try:
                        if p['id'].startswith('alg-'):algebra_check(p['id'][4:],i,t['q'],t['a'],t['solution'])
                        else:probability_check(p['id'][5:],i,t['q'],t['a'])
                    except Exception as error:raise AssertionError((p['id'],v['name'],kind,i+1,t['q'],t['a'],str(error))) from error
                    counts[p['id']]+=1
    assert len(counts)==22 and set(counts.values())=={36},counts
    print(f'TEACHER_NEXT_INDEPENDENT_OK: {sum(counts.values())} displayed questions/answers; {len(counts)} packs; no check metadata read.')
    print(dict(counts))

if __name__=='__main__':main()

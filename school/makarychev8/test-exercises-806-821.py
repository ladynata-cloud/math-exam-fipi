import sympy as s
x=s.Symbol('x'); Q=s.Rational
equations=[
450/x-450/(x+15)-Q(3,2),14/(x-1)-18/(x+1)-Q(1,2),120/x-120/(x+10)-Q(2,5),560/x+240/(x-20)-11,
25/x-25/(12-x)-10,35/(10-x)+18/(9-x)-8,20/x-20/(x+12)-Q(16,3),6/(Q(27,5)-x)+6/x-Q(9,2),
17/x-27/(12-x)-Q(8,3),(225-Q(3,2)*x)/x-(225-Q(3,2)*x)/(x+10)-Q(1,2),
(120-Q(3,4)*x)/x-(120-Q(3,4)*x)/(x+5)-Q(1,4),
(400-2*x)/x-(400-2*x)/(x+10)-Q(1,3),100/x+(4*x-100)/(x-10)-Q(9,2),
(10*x-100)/x-150/(x+10)-Q(9,2),(6*(x+2)-40)/(x+2)+(6*(x+2)-40)/(x-2)-9,
36/x+(5*x-36)/(x+3)-Q(19,4)]
import json
from pathlib import Path
cards=json.loads(Path(__file__).with_name('exercises-806-821.json').read_text())
def evaluate(v):
 if isinstance(v,str):return x if v=='x' else Q(v)
 a,b=map(evaluate,v[1:]);return {'+':lambda:a+b,'-':lambda:a-b,'*':lambda:a*b,'/':lambda:a/b}[v[0]]()
def final(n,v):
 return {806:600/v,807:Q(25,2)/v+18/(v+1)+14/(v-1),809:v-20,817:400/v-Q(1,3),818:4*v,819:10*v+50}.get(n,v)
assert len(cards)==len(equations)==16
for n,(card,original) in enumerate(zip(cards,equations),806):
 graph=card['graph'];assert card['source']['page']==(181 if n<=812 else 182 if n<=820 else 183)
 constraint=evaluate(graph['timeComparison'])-Q(graph['target'])
 assert s.cancel(constraint-original)==0,(n,'source model')
 assert s.cancel(s.sympify(card['steps'][1]['answer'],locals={'x':x},rational=True)-Q(graph['target'])-original)==0
 valid={v for v in s.solve(original,x) if v>0 and all(evaluate(row[key]).subs(x,v)>0 for row in graph['legs'] for key in ('distance','speed'))}
 assert valid==set(map(Q,card['steps'][2]['answer'].split(';'))),(n,valid)
 assert {final(n,v) for v in valid}==set(map(Q,card['answer'].split(';'))),(n,valid,card['answer'])
print('PASS 16 independent source travel equations, physical bounds, individual answer units and all three double solutions')

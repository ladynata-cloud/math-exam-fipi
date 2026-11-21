"""Independent source equations, printed pp. 183–184. Variable definitions follow the guided step."""
from pathlib import Path
import json
import sympy as S
x=S.Symbol('x',real=True);Q=S.Rational
original=[
 24000/(x-20)-24000/x-100,120/x-160/(x+10)-4,5*x+(768/x-6)*(x+6)-844,
 6/x-Q(18,5)/(60-x)-Q(3,20),(x-6)/x-(x-6)/(x+13)-Q(13,50),
 4/x+4/(x+5)-Q(2,3),1/(x+9)+1/(x+4)-1/x,1/(x+9)+1/(x+16)-1/x,
 5/(x+5)+4/x-Q(2,5),1/x+1/(25-x)-Q(1,6)]
answers=['80;60','10','32','24;36','12;25','10;15','15;10','12','25;20','10;15']
def evaluate(t):
 if isinstance(t,str):return x if t=='x'else Q(t)
 a,b=map(evaluate,t[1:]);return {'+':lambda:a+b,'-':lambda:a-b,'*':lambda:a*b,'/':lambda:a/b}[t[0]]()
cards=json.loads(Path(__file__).with_name('exercises-822-831.json').read_text());assert len(cards)==10
for n,(t,e,answer)in enumerate(zip(cards,original,answers),822):
 g=t['graph'];assert t['answer']==answer and t['source']['page']==(183 if n<=829 else 184)
 modeled=evaluate(g['comparison'])-Q(g['target']);scale={828:x,829:x,831:6}.get(n,1)
 assert S.cancel(modeled-scale*e)==0,(n,modeled,e)
 assert S.cancel(S.sympify(t['steps'][1]['answer'],locals={'x':x},rational=True)-Q(g['target'])-modeled)==0
 def physical(v):
  if v<=0:return False
  for row in g['rows']:
   z=evaluate(row['formula']).subs(x,v)
   if z<=0 or row['domain']=='integer' and not z.is_integer or row['domain']=='fraction'and z>1:return False
  return True
 assert {v for v in S.solve(e,x)if physical(v)}==set(map(Q,t['steps'][2]['answer'].split(';'))),n
print('PASS 10 source equations, exact mass shares, production, both alloy masses and ordering of workers')

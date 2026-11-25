"""Check the opening Chapter III supplementary questions against the printed equations, pp. 174–175."""
from pathlib import Path
import json,re,collections
import sympy as s
x=s.symbols('x',real=True)
ts=json.loads(Path(__file__).with_name('exercises-743-752.json').read_text())
counts=collections.Counter(int(re.search(r'№ (\d+)',t['title']).group(1))for t in ts)
assert counts=={743:4,744:9,745:6,746:2,747:8,748:8,749:6,750:4,751:2,752:1}
def calc(v):
 if isinstance(v,str):return x if v in 'xymacpb' else s.Rational(v)
 op,a,b=v
 return {'+':lambda a,b:a+b,'-':lambda a,b:a-b,'*':lambda a,b:a*b,'/':lambda a,b:a/b,'^':lambda a,b:a**b,'=':lambda a,b:a-b}[op](calc(a),calc(b))
known={743:[(2,-2,0),(5,-34,0),(25,0,-36),(16,0,0)],747:[(4,7,3),(1,1,-56),(1,-1,-56),(5,-18,16),(8,1,-75),(3,-11,-14),(3,11,-34),(1,-1,-1)],748:[(25,25,-6),(9,57,70),(6,-40,64),(11,36,25),(25,25,6),(16,0,-16),(12,0,-75),(0,0,0)],749:[(1,-2,-5),(1,4,1),(3,-4,-2),(5,-7,1),(2,11,10),(4,-9,-2)],750:[(1,-2,-2),(1,5,3),(3,-7,3),(5,31,20)]}
letters='абвгдежз'
for t in ts:
 n=int(re.search(r'№ (\d+)',t['title']).group(1))
 assert t['source']['section']=='additional-3' and t['source']['paragraph']==7 and t['source']['page']==(174 if n<745 else 175)
 if n in known:
  raw=calc(t['mathExpression']);a,b,c=known[n][letters.index(t['title'][-1])]
  polynomial=a*x*x+b*x+c
  assert s.expand(raw*(5 if t['title']=='№ 743г'else 1)-polynomial)==0,t['title']
  if polynomial==0:assert t['answer']=='Любое действительное число';continue
  solved=s.solve(polynomial,x)
  if n==750:assert sorted(round(float(v),2)for v in solved)==sorted(map(float,t['answer'].split(';')))
  else:
   actual=[s.sympify(v.replace('√','sqrt'))for v in t['answer'].split(';')]
   assert len(actual)==len(solved) and all(any(s.simplify(v-z)==0 for v in actual)for z in solved),t['title']
 elif n==745:
  triples=list(map(int,t['answer'].split(';')));parts=[]
  for i in range(0,len(triples),3):
   k,h,r=triples[i:i+3];assert k>0 and r>0;parts.append(k*(x-h)**2+r)
  if len(parts)==2: proof=parts[0]/parts[1]
  elif t['title']=='№ 745б':proof=parts[0]/19
  else:proof=parts[0]
  assert s.cancel(proof-calc(t['mathExpression']))==0,t['title']
 elif n==746:
  h,r=map(int,t['answer'].split(';'));assert s.expand(calc(t['mathExpression'])-(x-h)**2-r)==0
 elif n==751:
  _,L,R=t['mathExpression'];pairs=[tuple(map(int,z))for z in re.findall(r'\((-?\d+);(-?\d+)\)',t['answer'])]
  assert {a for a,b in pairs}==set(s.solve(calc(L)-calc(R),x))
  for a,b in pairs:assert calc(L).subs(x,a)==b and calc(R).subs(x,a)==b
 elif n==752:
  a,r=map(s.Rational,t['answer'].split(';'));assert s.factor(a*x*x-3*x-5)==(x-1)*(8*x+5)and s.expand(a*r*r-3*r-5)==0
print('PASS original equations, six positivity certificates, rounded values, equality ordinates and source order in 50 cards')

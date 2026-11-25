"""Independent identities from printed pp. 188–190, including every paired comparison."""
from pathlib import Path
import json,collections,re
import sympy as S
p=Path(__file__).parent;ts=json.loads((p/'exercises-846-859.json').read_text());by={t['title']:t for t in ts}
a,b,c,x,k,s=S.symbols('a b c x k s',real=True)
def ex(t):
 if isinstance(t,str):return S.Rational(t)if re.fullmatch(r'[+-]?(?:[0-9.]+|[0-9]+/[0-9]+)',t)else S.Symbol(t,real=True)
 op=t[0];u=ex(t[1])
 if op=='neg':return -u
 v=ex(t[2]);return {'+':lambda:u+v,'-':lambda:u-v,'*':lambda:u*v,'/':lambda:u/v,'^':lambda:u**v}[op]()
counts=collections.Counter(int(re.search(r'№ (\d+)',t['title'])[1])for t in ts);assert counts=={846:3,847:1,848:1,849:2,850:2,851:5,852:6,853:1,854:1,855:1,856:1,857:1,858:2,859:2}
signed={'846':(b-a)/(b*(b+1)),'847':(a-2)**2/(2*a),'848':(x-1)**2/x,'849а':(c-1)**2/2,'849б':(c-1)**2/(2*(c*c+1)),'850а':(a-3)**2+5,'850б':(b-8)**2+6,'851а':(a-1)**2+2,'851б':(a-2)**2+2,'851в':(a-2)**2,'851г':(a-4)**2+54,'853':-(a-b)**2/4,'854':(a+b)*(a-b)**2,'855':-2,'856':-s/495}
for t in ts:
 name=t['title'][2:].split(',')[0];n=int(re.match(r'\d+',name)[0]);g=t['graph'];assert t['source']['page']==(188 if n==846 else 189 if n<=853 else 190)
 if name in signed:assert S.cancel(ex(g['left'])-ex(g['right'])-signed[name])==0,name
 if g['type']=='radical-comparison' and t['kind']=='choice'and t['answer']in['<','>']:
  f,se=(S.sqrt(r)+sign*S.sqrt(z)for r,z,sign in g['pairs']);assert bool(f<se if t['answer']=='<'else f>se)
 if n==858:
  assert S.cancel(ex(g['original'])-ex(g['reduced']))==0;hole=S.Rational(t['steps'][1]['answer']);assert ex(g['original'][2]).subs(x,hole)==0
 if n==859:
  eq=(5/x-2+3/(x-2))if name=='859а'else 3/(2*x-1)-(5*x-9);assert set(S.solve(eq,x))==set(map(S.Rational,t['answer'].split(';')))
assert ((x*x-6*x+3)/(x+2)).subs(x,S.Rational(-1,3))==S.Rational(by['№ 857']['answer'])
print('PASS 29 source exercises, paired examples, four exact radical comparisons, fractions and both rational equations')

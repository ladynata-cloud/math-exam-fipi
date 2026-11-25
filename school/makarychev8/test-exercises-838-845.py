"""Printed p.188, independent algebraic differences and universal/counterexample conditions."""
import json,collections,re
from pathlib import Path
import sympy as S
p=Path(__file__).parent;ts=json.loads((p/'exercises-838-845.json').read_text());x,a,b,c,m,n,y=S.symbols('x a b c m n y',real=True);pvar=S.Symbol('p',real=True)
def ex(t):
 if isinstance(t,str):return S.Rational(t)if re.fullmatch(r'[+-]?(?:[0-9.]+|[0-9]+/[0-9]+)',t)else S.Symbol(t,real=True)
 op=t[0];first=ex(t[1])
 if op=='neg':return -first
 second=ex(t[2]);return {'+':lambda:first+second,'-':lambda:first-second,'*':lambda:first*second,'^':lambda:first**second}[op]()
counts=collections.Counter(int(re.search(r'№ (\d+)',t['title'])[1])for t in ts);assert counts=={838:3,839:3,840:4,841:4,842:2,843:4,844:4,845:6}
cert={'842в':4,'842г':3,'843а':1,'843б':-3,'843в':pvar**2+1,'843г':-(y**2+64),'844а':x+9,'844б':-3,'844в':6*x**2+64,'844г':x,'845а':a**2,'845б':(m-n)**2,'845в':(3*a-1)**2,'845г':-(b-c)**2,'845д':(a-b)**2,'845е':-(7*a-1)**2}
for t in ts:
 assert t['source']['page']==188;g=t['graph'];l,r=ex(g['left']),ex(g['right']);label=t['title'].replace('№ ','');v=label.split(',')[0]
 if v in cert:assert S.expand(l-r-cert[v])==0,(label,l-r,cert[v])
 if v in ['840','841']:assert S.expand(l-r-(-24 if v=='840' else 6*b+56))==0
 if g['mode']=='given':
  val=S.Rational(g['given']);sub={S.Symbol(g['symbols'][0],real=True):val};f=l.subs(sub);s=r.subs(sub);assert t['answer']==('<'if f<s else'>'if f>s else'=');assert [Q['answer']for Q in t['steps']]==[str(f),str(s)]
 if g['mode']=='counter':
  sub={S.Symbol(g['symbols'][0],real=True):S.Rational(t['answer'])};assert not bool((l>r if g['operator']=='>'else l<r).subs(sub))
 if t['kind']=='proof-chain':
  claims=[t['proofClaims'][int(k)-1]for k in t['answer'].split(';')];assert claims[0].startswith('Сначала вычислим')and claims[-1].startswith('Это доказывает')
old=json.loads((p/'ch4-6.json').read_text());bank=json.dumps(old,ensure_ascii=False);assert 'p34-t01' in bank and 'p34-t02' in bank
print('PASS 30 added source cases, signs for all numbers and variables, equality boundaries, and retained 842а/б')

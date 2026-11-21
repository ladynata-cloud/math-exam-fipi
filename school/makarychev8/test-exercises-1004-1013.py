"""Source pp. 226–227: exact differences, equality, and positive travel delay."""
import json
from fractions import Fraction as F
from itertools import product
from pathlib import Path
from decimal import Decimal as D, localcontext
p=Path(__file__).parent;ts=json.loads((p/'exercises-1004-1013.json').read_text())
expect={1005:2,1006:2,1007:2,1008:1,1009:1,1010:1,1011:1,1012:1,1013:1}
for n,k in expect.items():assert sum(t['title'].startswith('№ '+str(n))for t in ts)==k
old=next(l for l in json.loads((p/'ch4-6.json').read_text())if l['id']=='p41')['tasks'];assert [t['source']['reference']for t in old[:2]]==['№1004а','№1004б']
assert all(t['source']['page']==(226 if int(t['title'][2:6])<=1010 else 227)for t in ts)
points=[F(i,j)for i,j in [(1,5),(1,2),(1,1),(5,4),(2,1),(3,1),(4,1),(5,1),(25,4),(9,1)]]
count=0
for a,b in product(points,repeat=2):
 cert=(a+b)*(a-b)**2
 assert (a/b**2+b/a**2-1/a-1/b)*a*a*b*b==cert
 assert (a*a/b+b*b/a-a-b)*a*b==cert
 d=(a+b)*(a*b+16)-16*a*b;assert d>=0 and (d==0)==(a==b==4)
 d=(a*a+4*b)*(4*b+25)-80*a*b;assert d>=0 and (d==0)==(a==5 and b==F(25,4))
 assert (a**3+b**3)/2-((a+b)/2)**3==3*cert/8
 c=9/(a*b);assert (1+a)*(1+b)*(1+c)>24
 assert 4*(a-F(1,2))**2+(b-2)**2+3==4*a*a+b*b-4*(a+b-2)
 if a>2:assert b/(a-2)+b/(a+2)-2*b/a==8*b/(a*(a*a-4))>0
 count+=8
for a,b,c in product(points,repeat=3):
 assert (a+b)/c+(b+c)/a+(a+c)/b>=6
 assert F(3)/(a+b+c)<1/(a+b)+1/(b+c)+1/(c+a)
 count+=2
with localcontext()as ctx:
 ctx.prec=48;dec=lambda q:D(q.numerator)/D(q.denominator);tol=D('1e-40')
 for a,b,c,d in product(points[:5],repeat=4):
  l=dec((a+c)*(b+d)).sqrt();r=dec(a*b).sqrt()+dec(c*d).sqrt()
  assert l+tol>=r;assert(abs(l-r)<tol)==(a*d==b*c);count+=1
 for a in points:
  if a>1:
   x=dec(a);assert 1/x.sqrt()<(x+1).sqrt()-(x-1).sqrt();count+=1
 for i,j in product(range(-4,25),repeat=2):
  x,y=F(i,16),F(j,16);z=1-x-y
  if min(x,y,z)<F(-1,4):continue
  assert sum(dec(1+4*t).sqrt()for t in [x,y,z])<5
  assert all((1+2*t)**2-(1+4*t)==4*t*t for t in [x,y,z]);count+=1
print('PASS printed proof forms, equality conditions and strict signs;',count,'independent algebraic and high-precision checks')

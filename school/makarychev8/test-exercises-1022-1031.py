"""Printed pp. 228–229. Independent exact algebra and endpoint tests."""
from collections import Counter
from fractions import Fraction as F
from itertools import product
from pathlib import Path
import json,re
tasks=json.loads(Path(__file__).with_name('exercises-1022-1031.json').read_text())
number=lambda t:int(re.search(r'№ (\d+)',t['title'])[1])
assert Counter(map(number,tasks))=={1022:1,1023:1,1024:2,1025:2,1026:2,1027:2,1028:3,1029:2,1030:1,1031:1}
assert all(t['source']['page']==(228 if number(t)<=1025 else 229) and t['source']['paragraph']==11 for t in tasks)
count=0
pos=[F(n,d) for n in range(1,9)for d in [1,3]]
for a,b in product(pos,repeat=2):
 assert ((a+b)/2)**2-a*b==(a-b)**2/4>=0
 assert (a+b)*(1/a+1/b)-4==(a-b)**2/(a*b)>=0
 assert a/b**2+b/a**2-1/a-1/b==(a+b)*(a-b)**2/(a*a*b*b)>=0;count+=3
 for sign in [-1,1]:
  for x in [a,-a]:
   assert x*x+sign*x*b+b*b==(x+sign*b/2)**2+3*b*b/4>=0;count+=1
 for c in pos:
  if max(a,b,c)*2<a+b+c:assert (a+b+c)/2>max(a,b,c);count+=1
  assert (a*c+b/c)**2-4*a*b==(a*c-b/c)**2>=0
  u,v,w=a*a/(b*c),b*b/(a*c),c*c/(a*b);assert u*v*w==1 and (1+u)*(1+v)*(1+w)>=8;count+=2
  if a>=max(b,c):
   d=b*c/a;delta=a+d-b-c;assert delta==(a-b)*(a-c)/a>=0 and (delta==0)==(a==b or a==c);count+=1
ranges=[('[',F(-8),F(-6)),('[',F(10),F(18)),('[',F(33,16),F(25,12)),('(',F(-6),F(-3)),('(',F(-23,2),F(-9)),('(',F(26,5),F(21,4)),('[',F(24,5),F(49,10))]
for t,(br,lo,hi) in zip(tasks[-7:],ranges,strict=True):
 assert t['answer']==br+str(lo)+';'+str(hi)+(']'if br=='[' else')')
 g=t['graph'];bounds=[[F(x),F(y)] for x,y,_ in g['bounds']];c,d=map(F,g['coef']);calc=lambda x:c*x[0]+d if g['operation']=='affine' else c/x[0]+d if g['operation']=='reciprocal'else c*x[0]+d*x[1]
 corners=list(map(calc,product(*bounds)));assert min(corners)==lo and max(corners)==hi
 for sample in product(*[[a+F(i,11)*(b-a) for i in range(1,11)]for a,b in bounds]):assert lo<calc(sample)<hi;count+=1
print(f'PASS {count} rational identities, admissible cases and interior measurements')

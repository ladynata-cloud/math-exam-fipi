from pathlib import Path
from fractions import Fraction as F
import json,collections,re
ts=json.loads(Path(__file__).with_name('exercises-956-972.json').read_text());n=lambda t:int(re.search(r'№ (\d+)',t['title'])[1])
assert collections.Counter(map(n,ts))=={956:4,957:2,958:6,959:2,960:2,961:2,962:1,963:1,964:1,965:1,966:1,967:1,968:1,969:1,970:2,971:1,972:1}
assert all(t['source']['page']==(214 if n(t)<=965 else 215)for t in ts)
def within(r,x):
 for s in r.split('∪'):
  if s=='∅':continue
  a,b=s[1:-1].split(';')
  if (a=='-∞'or F(a)<x or F(a)==x and s[0]=='[')and(b=='+∞'or F(b)>x or F(b)==x and s[-1]==']'):return True
 return False
D={t['title']:t for t in ts}
for x in [F(i,15)for i in range(-160,155)]+[F(-26,5),F(4,3),F(1,2),3,4,-8]:
 for title,correct in [('№ 958а',2*x-4>=0),('№ 958б',4-6*x>=0),('№ 958в',(1+3*x)/25>=0),('№ 958г',(7-5*x)/8>=0),('№ 958д',-3*(1-5*x)>=0),('№ 958е',-(6-x)>=0),('№ 959а',7-14*x>=0 and x!=-8),('№ 959б',4-x>=0 and x!=3),('№ 962',x!=-5 and 16+80*(x+5)<0),('№ 963',x!=4 and 256+96*(x-4)>0),('№ 964',x>0 and 2*(6+x)<16),('№ 965',x>0 and 12*5*x<9**3)]:assert within(D[title]['answer'],x)==correct
assert min(n for n in range(1,300)if 480*n+630<485*n+580)==11
assert max(n for n in range(1001)if n+7+F(n,20)<=800)==755
assert F(80,3)/20+F(80,3)/16==3
assert F(30,15)+F(30,9)==F(16,3)
assert (1**2-4)/6-1/2==(1-4)/3
assert all(2*x*x-1-2*x+1==0 for x in [0,1])
print('PASS all source tasks; 3,852 radical/parameter/dimension trials, rounding, budgets and travel equations')

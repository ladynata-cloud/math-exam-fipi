"""Source pp. 229–230. Verify witnesses, set descriptions, extrema and source groups."""
import json,re
from fractions import Fraction as F
from collections import Counter
from pathlib import Path
t=json.loads(Path(__file__).with_name('exercises-1032-1038.json').read_text())
num=lambda q:int(re.search(r'№ (\d+)',q['title'])[1])
assert Counter(map(num,t))=={1032:2,1033:2,1034:4,1035:4,1036:4,1037:1,1038:1}
assert all(q['source']['page']==(229 if num(q)<=1035 else 230)and q['source']['paragraph']==12 for q in t)
count=0
for n,lo,hi in [(1032,F('40.9'),F(41)),(1033,F(7),F('7.01'))]:
 q=next(z for z in t if z['title']==f'№ {n}а')
 assert lo<F(q['answer'].replace(',','.'))<hi
 for k in range(1,48):assert lo<lo+(hi-lo)*F(k,48)<hi;count+=1
for n,root,edge in [(1037,19,5),(1038,11,3)]:
 q=next(z for z in t if num(z)==n);x=F(q['answer']);assert (x*x>root and x<edge) if n==1037 else(x*x<root and x>edge)
 for den in range(1,40):
  for m in range(0,7*den):
   v=F(m,den);exact=(v*v>root and v<edge) if n==1037 else(v*v<root and v>edge)
   assert exact==(m*m>root*den*den and m<edge*den if n==1037 else m*m<root*den*den and m>edge*den);count+=1
assert [q['answer']for q in t if num(q)==1034]==['12;37','8;нет','нет;нет','нет;19']
assert [q['answer']for q in t if num(q)==1035]==['верно','неверно','верно','верно']
assert [q['answer']for q in t if num(q)==1036]==['положительные целые','все целые и все положительные действительные','нечётные простые числа','все нечётные натуральные и число 2']
print('PASS',count,'exact middle points, rational square comparisons, endpoints and infinite-set descriptions')

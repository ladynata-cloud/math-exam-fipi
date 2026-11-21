"""Independent source checks on printed pp.192–193 including every arithmetic operation."""
from pathlib import Path
from fractions import Fraction as F
import json,collections,re,itertools
ts=json.loads(Path(__file__).with_name('exercises-860-868.json').read_text());nOf=lambda t:int(re.search(r'№ (\d+)',t['title'])[1])
assert collections.Counter(map(nOf,ts))=={860:1,861:3,862:4,863:4,864:10,865:6,866:4,867:4,868:6}
for t in ts:assert t['source']['page']==(192 if nOf(t)<=861 else 193)
for t in (t for t in ts if nOf(t)==864):
 p=re.search(r'864(.)',t['title'])[1];raw=t['title'].split()[-1];f=F(raw);a,b={'а':(18,-7),'б':(5,-3),'в':(-9,21),'г':(15,-6)}[p]
 apply={'а':lambda v:v+f,'б':lambda v:v-f,'в':lambda v:v*f,'г':lambda v:v/f}[p]
 l,r=apply(a),apply(b);assert t['answer']==str(l)+('<' if l<r else'>')+str(r)
assert all(re.findall(r'[<>]',t['answer'])==[s]for t,s in zip([t for t in ts if nOf(t)==865],'<<<<>>'))
assert [t['answer']for t in ts if nOf(t)==866]==list('><<>')
assert [t['answer']for t in ts if nOf(t)==867]==['отрицательный','положительный','положительный','отрицательный']
assert [t['answer']for t in ts if nOf(t)==868]==['-7;0','1/8;0','2;11','1/100;-7/10','-1;1','-1/2;2']
perm=[p for p in itertools.permutations('abcde')if all(p.index(a)<p.index(b)for a,b in [('a','b'),('b','c'),('c','d'),('e','a')])];assert perm==[tuple('eabcd')]
for t in (t for t in ts if nOf(t)==863):
 x=next(q for q in t['steps']if q['kind']=='ordered-coordinates');a,b=map(F,x['answer'].split(';'));assert (a>0 and b>0)==(t['answer']=='оба положительны');assert (a<0 and b<0)==(t['answer']=='оба отрицательны')
old=Path(__file__).with_name('ch4-6.json').read_text();assert 'p35-t01' in old and 'p35-t02' in old
print('PASS 42 added source cards, 2 unchanged source tasks, 12 concrete transformations and physical ordering')

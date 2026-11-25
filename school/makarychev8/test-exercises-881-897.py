from pathlib import Path
import collections,re,json
from fractions import Fraction as F
ts=json.loads(Path(__file__).with_name('exercises-881-897.json').read_text());n=lambda t:int(re.search(r'№ (\d+)',t['title'])[1])
assert collections.Counter(map(n,ts))=={881:1,882:1,883:2,884:4,885:4,886:2,887:2,888:1,889:2,890:1,891:1,892:4,893:1,894:2,895:1,896:1,897:2}
assert all(t['source']['page']==(197 if n(t)<=884 else 198 if n(t)<=892 else 199)for t in ts)
def fn(op,a,b):
 return {'sum':lambda:a+b,'difference':lambda:a-b,'product':lambda:a*b,'quotient':lambda:a/b,'iso-perimeter':lambda:a+2*b,'perimeter':lambda:2*(a+b),'third-angle':lambda:180-a-b}[op]()
for t in ts:
 g=t['graph']
 if g['type']=='combined-intervals':
  xs,ys=([F(v)for v in r]for r in g['ranges']);z=[fn(g['operation'],x,y)for x in xs for y in ys];lo,hi=map(F,t['answer'][1:-1].split(';'));assert [min(z),max(z)]==[lo,hi]
  corner=list(map(F,t['steps'][0]['answer'].split(';')));assert fn(g['operation'],*corner)==lo;assert (t['answer'][0]=='[')==(n(t)in(888,891))
assert [t['answer']for t in ts if n(t)in(881,882)]==['-9<-2','2<5']
assert [t['answer']for t in ts if n(t)in(888,889,891)]==['[108;114]','(18;92/5)','(486/25;407/20)','[18;20]']
# Substitute directly into the two assigned rational expressions, without their simplifications.
for x in map(F,[-3,-1,1,2,3,4]):
 assert (8*x/(16-9*x*x)+x/(3*x-4))/(1-(4-3*x)/(4+3*x))==F(1,6)
assert {F(-4,3),F(4,3),0}==set(map(F,next(t for t in ts if n(t)==896)['steps'][0]['answer'].split(';')))
for a in map(F,[1,F(1,3),F(3,2),6]): assert 9*a+1/a>=6 and (9*a+1/a==6)==(a==F(1,3))
for b in map(F,[-1,F(-1,5),F(-3,2),-6]): assert 25*b+1/b<=-10 and (25*b+1/b==-10)==(b==F(-1,5))
assert 6*(6-5)==6 and 6>5
print('PASS all 17 source numbers, 16 two-variable estimates against four corners, signed proofs, equation and expression restrictions')


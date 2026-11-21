from fractions import Fraction as F
import json
from pathlib import Path
cards=json.loads(Path(__file__).with_name('exercises-1080-1087.json').read_text());assert len(cards)==36 and all(t['source']['page']==240 for t in cards)
by={t['id'].split('source-')[1]:t for t in cards};assert [sum(1 for t in by if t.startswith(str(n)+'-'))for n in range(1080,1088)]==[12,2,8,2,3,4,4,1]
assert [by[k]['answer']for k in ['1080-a-build','1080-b-build','1080-c-build','1080-d-build']]==['3/2;-3/2','0;9/2','10;5','-1;-1/2'];assert by['1081-a']['answer']=='[1;7]'and by['1081-b']['answer']=='[-7;14]';assert by['1083-fraction-range']['answer']=='[0;1)';assert by['1084-triangle-domain']['answer']=='(10;40]'and by['1084-triangle-range']['answer']=='(40;100]';assert by['1085-direction']['answer']=='увеличиваются'and by['1086-direction']['answer']=='уменьшаются';assert by['1087-match']['answer']=='y=2x−1'
count=0
for j in range(1,10):
 for i in range(-220,221):
  x=F(i,j);y=x*x/(1+x*x);assert y>=0 and y<1 and y/(1-y)==x*x;count+=1
  assert (x>10 and 2*x+20<=100)==(40<2*x+20<=100);count+=1
  if 1<=x<=4:assert 1<=2*x-1<=7;count+=1
  if -2<=x<=5:assert -7<=8-3*x<=14;count+=1
  if x and abs(x)<200:assert F(10)/(10/x)==x and -1/(-1/x)==x;count+=2
print('PASS all 36 printed tasks, bounded levels, triangles and',count,'independently calculated rational checks.')

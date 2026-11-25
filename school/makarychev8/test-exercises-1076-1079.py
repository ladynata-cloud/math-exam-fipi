from fractions import Fraction as F
from pathlib import Path
import json
cards=json.loads(Path(__file__).with_name('exercises-1076-1079.json').read_text());by={t['id'].split('source-')[1]:t for t in cards};assert len(by)==21
for suffix,answer in [('area',72),('diagonal',16)]:
 t=by['1076-'+suffix];assert t['source']['type']=='authored' and t['source']['originalNumber']==1076 and t['source']['correspondence']=='author-alternative';assert F(t['answer'])==answer
assert F(12)**2/2==72 and F(16)**2/2==128
for key in ('1077-a','1077-b','1077-c','1077-d','1077-review'):assert by[key]['source']['page']==238
assert by['1077-review']['source']['endPage']==239
for k,v in [('1078-a-neg4','-3'),('1078-a-neg1','-2'),('1078-a-one','3'),('1078-a-five','3'),('1078-b-level4','1.5;4.5'),('1078-b-level-min','-3'),('1078-b-level0','-5;0'),('1078-c-max','6'),('1078-c-min','-4'),('1078-d','[-4;6]'),('1079-a-may2','747'),('1079-a-may5','751'),('1079-a-may9','752'),('1079-b','4')]:assert by[k]['answer']==v and by[k]['source']['page']==239
count=0
for d in range(1,9):
 for n in range(-200,201):
  x=F(n,d);assert (abs(2-x)-3*x>=0)==(x<=F(1,2));assert (abs(x)-1>=0)==(x<=-1 or x>=1);assert (abs(x)-2!=0)==(x not in (-2,2));assert abs(x+1)+4>0;count+=4
print('PASS exact original locations, graph readings and',count,'absolute-value trial checks; two authored tile tasks classified separately.')

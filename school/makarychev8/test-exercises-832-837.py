"""Verify the complete supplementary §10 on printed page 184 independently."""
from pathlib import Path
from fractions import Fraction as Q
import json
tasks=json.loads(Path(__file__).with_name('exercises-832-837.json').read_text())
by={t['title']:t for t in tasks};assert len(by)==13 and all(t['source']['page']==184 for t in tasks)
assert by['№ 832']['answer']=='-2;2' and -3*(-2)+3==9 and 2*(-2)-2*3==-10
source=[[[3,-6,5],[2,3,7]],[[4,-3,12],['1/3','-1/4',1]],[['1/2',2,'4/5'],['5/2',10,6]],[[2,'-3/10',1],[4,'3/5',1]]]
for label,rows in zip('абвг',source):
 t=by['№ 833'+label];assert rows==t['graph']['lines'];(a,b,c),(d,e,f)=([Q(v)for v in r]for r in rows)
 det=a*e-b*d;assert Q(t['steps'][0]['answer'])==det;assert t['answer']==('одно' if det else 'бесконечно много' if a*f==c*d and b*f==e*c else 'нет')
assert by['№ 835а']['answer']=='6' and by['№ 835б']['excluded']=='6'
points=[[[-1,3],[2,-2]],[[4,1],[-3,-1]],[[0,5],[4,0]],[[-3,0],[0,-6]]]
for label,pts in zip('абвг',points):
 t=by['№ 836'+label];assert t['graph']['points']==pts
 (x,y),(u,v)=pts;k=Q(v-y,u-x);b=y-k*x;assert Q(t['steps'][0]['answer'])==k and Q(t['steps'][1]['answer'])==b
t=by['№ 837'];x,y=map(Q,t['steps'][0]['answer'].split(';'));assert 3*x-2*y==16 and 4*x+3*y==-7 and Q(y-5,x+2)==Q(-5,2) and y+Q(5,2)*x==0
print('PASS both original lines and every subpart, determinant, intersection and rational slope in 832–837')

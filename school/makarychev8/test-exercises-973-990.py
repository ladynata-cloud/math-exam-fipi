"""Exact independent checks for the printed systems, pp. 218–221, including boundary points."""
import json,re
from fractions import Fraction as F
from pathlib import Path

root=Path(__file__).parent
tasks=json.loads((root/'exercises-973-990.json').read_text())
book={973:[lambda x:6*x-1>x and 4*x-32<3*x,lambda x:7*x<5*x+7 and 3*x-1>5-x,lambda x:5*x+4<20 and 3-2*x>-1],974:[lambda x:3*x-22<0 and 2*x-1>3],
975:[lambda x:x>17 and x>12,lambda x:x<1 and x<5,lambda x:0<x<6,lambda x:x<F('-3.5') and x>8,lambda x:-1<=x<=3,lambda x:8<x<=20],
976:[lambda x:2*x-12>0 and 3*x>9,lambda x:4*x< -4 and 5-x>0,lambda x:3*x<10 and x>0,lambda x:6*x>=42 and 4*x+12<=0],
977:[lambda x:x>F('.8') and -5*x<10,lambda x:2<=x<=4,lambda x:1>3*x and 5*x>1,lambda x:10*x<2 and x>F('.1')],
978:[lambda x:4*x<=10 and 23*x>=46,lambda x:7*x<21 and 2*x>3,lambda x:3*x>40 and 2*x<50,lambda x:5*x<=60 and 9*x<=4],
979:[lambda x:6*x+72>0 and 52>=26*x,lambda x:15*x+45<=0 and x>=9,lambda x:2*x<30 and x>0,lambda x:4*x<13 and x<-3],
980:[lambda x:2*x-1<F('1.4')-x and 3*x-2>x-4,lambda x:5*x+6<=x and 3*x+12<=x+17,lambda x:17*x-2>12*x-1 and 3-9*x<1-x,lambda x:25-6*x<=4+x and 3*x+F('7.7')>1+4*x],
981:[lambda x:57-7*x>3*x-2 and 22*x-1<2*x+47,lambda x:1-12*x<3*x+1 and 2-6*x>4+4*x,lambda x:102-73*x>2*x+2 and 81+11*x>=1+x,lambda x:60+62*x>=120-18*x and 20-10*x>=35-20*x],
982:[lambda x:min(3-2*x,1-x)>=0,lambda x:min(x,3*x-1)>=0,lambda x:min(6-x,3*x-9)>=0,lambda x:min(2*x+2,6-4*x)>=0],
983:[lambda x:min(x+6,2*x-5)>=0 and x+6!=2*x-5,lambda x:min(2*x-1,x+1)>=0 and 2*x-1!=x+1],
984:[lambda x:5*(x-2)-x>2 and 1-3*(x-1)<-2,lambda x:2*x-(x-4)<6 and x>3*(2*x-1)+18,lambda x:7*x+3>=5*(x-4)+1 and 4*x+1<=43-3*(7+x),lambda x:3*(2-3*x)-2*(3-2*x)>x and 6<x*x-x*(x-8)],
985:[lambda x:2*(x-1)-3*(x-2)<x and 6*x-3<17-(x-5),lambda x:33-3*(12-50*x)>6*(10*x+1) and 16-45*(4*x-1)<20*x+261,lambda x:58*(1-x)-18*(6-x)<50 and 8-4*(2-5*x)>-(5*x+6),lambda x:x*(x-1)-(x*x-10)<1-6*x and 35-(10*x-15)<60-40*x],
986:[lambda x:3-2*x<13 and 5*x<17,lambda x:12-6*x<=0 and 3*x+1<=25-x,lambda x:2-6*x<14 and 1<21-5*x,lambda x:3-4*x<15 and 1-2*x>0],
987:[lambda x:x>=0 and 72-10*x>=40,lambda x:12*x-37>0 and 6*x<=42,lambda x:6-4*x>0 and 3*x-1>0,lambda x:3-18*x<0 and 2-x>0],
988:[lambda x:25*x-5*(8-x)<10*x+16 and 15*(2*x-1)-20*x<10*x+29,lambda x:7*(5*x+1)-5*(1+x)<30*x and 20*x-(10*x-17)>67],
989:[lambda x:7*x<84 and x<6,lambda x:2*x-(x-1)>2 and x<15,lambda x:3*x-1-2*x<=4 and 6*x-x>=3,lambda x:10*x-(x-2)>20 and 4*x-x<=48],
990:[lambda x:3*(x-1)-2*(x-3)<12 and 13*x-1>0,lambda x:3*x+1<-2 and x-2<2*x,lambda x:12-(x-1)>=3*x and 7*x-1>=48,lambda x:5*x+8-3*x>=6*x and 4-(6-15*x)>=4*x]}
def intervals(raw,x):
 if raw=='∅':return False
 for part in raw.split('∪'):
  lo,hi=part[1:-1].split(';');left=lo=='-∞'or (x>F(lo) if part.startswith('(')else x>=F(lo));right=hi=='+∞'or(x<F(hi)if part.endswith(')')else x<=F(hi))
  if left and right:return True
 return False
complete=set()
tests=0
for t in tasks:
 n,letter=re.search(r'№ (\d+)([абвгде]?)',t['title']).groups();n=int(n);i='абвгде'.index(letter)if letter else 0;fun=book[n][i];complete.add((n,i));g=t['graph']
 grid={F(j,k)for k in [1,2,3,5,7,11]for j in range(-37,53)}
 for r in g['rows']:
  z=F(r['threshold']);grid.update([z,z+F(1,997),z-F(1,997)])
 grid.update(map(F,g['holes']));ans=t['answer']
 if n==973:assert(ans=='да')==fun(F(3))
 elif n==974:assert set(map(F,ans.split(';')))=={F(x)for x in [-2,0,5,6]if fun(F(x))}
 elif t['kind']=='system-examples':assert len(set(ans.split(';')))==2 and all(fun(F(z))for z in ans.split(';'))
 elif t['kind']=='rational-axis-list':assert set(map(F,ans.split(';')))=={F(x)for x in range(-100,101)if fun(F(x))}
 else:
  for x in grid:
   assert intervals(ans,x)==fun(x),(t['id'],x,ans);tests+=1
expected={(n,i)for n,rows in book.items()for i in range(len(rows))}
assert complete|{(975,4),(976,3)}==expected
old=json.loads((root/'ch4-6.json').read_text());tasks40=next(l for l in old if l['id']=='p40')['tasks'];assert tasks40[0]['answer']=='[-1;3]' and tasks40[1]['answer']=='нет решений'
assert len(tasks)==76 and len({t['id']for t in tasks})==76
print('PASS',len(tasks),'new cards, all printed subparts,',tests,'exact membership tests')

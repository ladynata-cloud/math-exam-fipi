"""Solve the printed applied exercises independently, including inadmissible and negative roots."""
from pathlib import Path
import json,re
from fractions import Fraction as F
import sympy as s
cards=json.loads(Path(__file__).with_name('exercises-753-763.json').read_text())
by={int(c['title'][2:]):c for c in cards}
assert set(by)==set(range(753,764))
for n,t in by.items():assert t['source']['page']==(175 if n==753 else 176) and t['source']['section']=='additional-3'
x=s.symbols('x',real=True)
problems={753:x**2+(x+1)**2+(x+2)**2-(x+3)**2-(x+4)**2,754:x**2+(x+2)**2-(x+4)**2,755:(2*x+1)**2-x**2-(x+1)**2-112,756:x**2+(14-x)**2-116,757:(12+2*x)*(18+2*x)-280,758:s.Rational(45,4)-(s.Rational(9,2)-2*x)*(s.Rational(5,2)-2*x)-s.Rational(13,4),759:x-x*x/100-24,760:3*x-2*x*x-s.Rational(27,25),761:8*(x-16)*(3*x/2-16)-6080,762:(x+1)**3-x**3-919,763:(x+2)**3-x**3-866}
results={n:s.solve(eq,x) for n,eq in problems.items()}
for n in [753,754]:
 size,stride=(5,1)if n==753 else(3,2);runs=[list(map(int,g.split(';')))for g in re.findall(r'\(([^()]+)\)',by[n]['answer'])]
 assert runs==[[r+i*stride for i in range(size)]for r in results[n]]
for n,stride in [(755,1),(762,1),(763,2)]:
 r=next(v for v in results[n]if v>0);assert list(map(int,by[n]['answer'].split(';')))==[r,r+stride]
assert set(results[756])==set(map(int,by[756]['answer'].split(';')))
for n,ok in [(757,lambda v:v>0),(758,lambda v:0<v<s.Rational(5,4))]:
 assert [r for r in results[n]if ok(r)]==[s.Rational(by[n]['answer'])]
assert results[759]==list(map(int,by[759]['answer'].split(';')))
assert set(v*v for v in results[760]if v>0)==set(map(s.Rational,by[760]['answer'].split(';')))
width=next(r for r in results[761]if r>16);assert list(map(int,by[761]['answer'].split(';')))==[3*width/2,width]
print('PASS eleven independently solved supplementary stories, both prices, volumes, signed runs and valid frame widths')

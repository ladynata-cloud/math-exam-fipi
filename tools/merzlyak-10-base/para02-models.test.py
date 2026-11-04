#!/usr/bin/env python3
"""Independent incidence/metric checks for the authored §2 diagrams."""
import json
import math
from pathlib import Path

COURSE = Path(__file__).resolve().parents[2] / 'stereo-course/merzlyak-10-base/lessons'
def points(n):
    return json.loads((COURSE/f'ex-02-{n:03}.json').read_text())['visualization']['model']['points']
def sub(a,b): return [x-y for x,y in zip(a,b)]
def cross(a,b): return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def norm(a): return math.sqrt(sum(x*x for x in a))
def collinear(p,a,b,c): return norm(cross(sub(p[b],p[a]),sub(p[c],p[a]))) < 1e-8
def distance(p,a,b): return norm(sub(p[a],p[b]))
def area(p,a,b,c): return norm(cross(sub(p[b],p[a]),sub(p[c],p[a])))/2

for n in [4,5]:
    p=points(n)
    for name in [k for k in p if k.startswith('_r')]:
        assert abs(distance(p,'O',name)-2)<1e-9
    end='B' if n==4 else 'C'
    assert collinear(p,'A','O',end)
    outside='C' if n==4 else 'B'
    assert p[outside][2] != 0
    assert all(p[k][2]==0 for k in p if k.startswith('_p'))

p=points(9)
assert collinear(p,'D','E','X') and collinear(p,'B','C','X')
assert p['A'][2]!=0 and all(p[k][2]==0 for k in ['B','C','D','E','X'])
p=points(10)
for names in [('A','B','D'),('B','C','E'),('D','E','X'),('A','C','X')]: assert collinear(p,*names)
assert p['B'][2]!=0 and all(p[k][2]==0 for k in ['A','C','X'])
p=points(14)
for names in [('A','B','E'),('B','C','F'),('E','D','F')]: assert collinear(p,*names)
assert all(p[k][2]>0 for k in ['A','B','C'])
assert all(p[k][2]==0 for k in ['D','E','F'])
p=points(15)
for names in [('A','B','C'),('B','E','P'),('C','E','K'),('F','P','M'),('F','K','M'),('F','E','D'),('A','D','M')]: assert collinear(p,*names)
assert all(abs(p[k][2])<1e-9 for k in ['A','D','M'])
p=points(18)
for names in [('A','B','Q'),('B','C','P'),('A','C','E'),('M','K','P'),('M','N','E'),('K','N','Q')]: assert collinear(p,*names)
assert not collinear(p,'E','P','Q')
# PQ crosses AC beyond C, unlike E, which is beyond A.
t=-p['Q'][1]/(p['P'][1]-p['Q'][1]);x=p['Q'][0]+t*(p['P'][0]-p['Q'][0])
assert p['E'][0]<p['A'][0]<p['C'][0]<x
p=points(19)
assert collinear(p,'B','M','C')
assert abs(area(p,'A','M','D')-16)<1e-8
assert abs(area(p,'A','B','C')+area(p,'A','C','D')-32)<1e-8
p=points(20)
assert collinear(p,'A','E','B') and collinear(p,'C','E','D')
assert norm(cross(sub(p['D'],p['A']),sub(p['C'],p['B'])))<1e-8
for a,b,value in [('A','E',10),('C','E',3),('D','E',6),('B','E',5)]: assert abs(distance(p,a,b)-value)<1e-8
print('MERZLYAK_PARA02_INCIDENCE_AND_METRICS_OK')

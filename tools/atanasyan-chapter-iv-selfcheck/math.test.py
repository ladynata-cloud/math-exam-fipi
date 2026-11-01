#!/usr/bin/env python3
"""Author-side numeric/coordinate checks, explicitly not a second reviewer."""
import json, math, random
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
FOLDER=ROOT/'content-drafts/atanasyan-chapter-iv-selfcheck'
cards={p.stem:json.loads(p.read_text()) for p in FOLDER.glob('ex-*.json')}
def get(s):return cards['ex-selfcheck-iv-'+s]
def points(s):return get(s)['visualization']['model']['points']
def sub(a,b):return [x-y for x,y in zip(a,b)]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def norm2(a):return dot(a,a)
def distance(a,b):return math.sqrt(norm2(sub(a,b)))
def near(a,b):assert math.isclose(a,b,rel_tol=1e-10,abs_tol=1e-10),(a,b)
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]

# Actual authored points, not a disconnected replica of the diagrams.
p=points('01'); vertical=sub(p['A1'],p['A']); near(dot(vertical,sub(p['B'],p['A'])),0); assert vertical[2]!=0
p=points('02'); near(dot(sub(p['B'],p['A']),sub(p['A1'],p['A'])),0)
near(distance(p['A'],p['B']),distance(p['A1'],p['B1']));near(distance(p['T'],[0,0,0]),2);assert p['U'][0]>2
for s in ['03-a','03-b','03-c']:
 p=points(s)
 for k in ['A','B','C','D']:near(p[k][0]**2+p[k][1]**2,4)
 assert p['A'][2]==p['B'][2]==0 and p['C'][2]==p['D'][2]==3
 assert norm2(cross(sub(p['B'],p['A']),sub(p['D'],p['C'])))>0
p=points('03-a');near(distance(p['M'],p['N']),3)
p=points('03-b');near(distance(p['B'],p['C'])**2,9+2*(1.8-math.sqrt(.76))**2);assert distance(p['B'],p['C'])>3
# The endpoint pair is the minimum: x-gap and y-gap have these separate lower bounds.
assert p['A'][0]==p['B'][0]<min(p['C'][0],p['D'][0]);assert min(p['C'][1],p['D'][1])>max(p['A'][1],p['B'][1])
p=points('03-c');near(distance(p['P'],p['Q'])**2,9+distance(p['P'],p['H'])**2)
p=points('04');r1=distance(p['O1'],p['A1']);r2=distance(p['O2'],p['A2']);h1=distance(p['O1'],p['T1']);h2=distance(p['O2'],p['T2'])
near(r2,2*r1);near(h1,2*h2);near(r1*h1,r2*h2);assert 2*math.pi*(r2*h2+r2*r2)>2*math.pi*(r1*h1+r1*r1)
for s in ['05-a','05-b','06']:
 p=points(s);near(distance(p['S'],p['A']),distance(p['S'],p['B']));near(dot(sub(p['S'],p['O']),sub(p['A'],p['O'])),0)
p=points('06');near(distance(p['S'],p['C']),math.sqrt(13));assert all(p[k][2]==p['S'][2] for k in ['U','V','W','Z'])
p=points('07');assert norm2(p['A'])<9 and norm2(p['B'])<9;near(norm2(p['C']),9);near(norm2(p['D']),9);near(dot(p['H'],sub(p['B'],p['A'])),0)
for i in range(101):assert norm2([(1-i/100)*a+i/100*b for a,b in zip(p['A'],p['B'])])<=9
p=points('08');near(distance(p['A'],p['B']),4);near(distance(p['A'],p['C']),2*math.sqrt(2));near(dot(sub(p['B'],p['A']),sub(p['C'],p['A'])),0)
radius=get('08')['visualization']['model']['spheres'][0]['radius'];near(radius,math.sqrt(5));near(distance(p['B'],p['C']),2*math.sqrt(6));assert distance(p['B'],p['C'])>2*radius
assert '√5' in get('08')['statement']['text'];assert '2√2' in get('08')['statement']['text']
assert 'отдельно' in get('08')['visualization']['model']['note']
ss=get('09')['visualization']['model']['spheres'];assert ss[0]['center']==ss[1]['center'];assert ss[0]['radius']!=ss[1]['radius'];p=points('09');near(distance(p['O'],p['H']),ss[1]['radius'])
p=points('10');near(distance(p['O'],p['A']),2);near(distance(p['O'],p['B']),2);near(dot(sub(p['A'],p['M']),sub(p['B'],p['M'])),0)
for k,v in p.items():
 if k.startswith('_locus'):near(norm2(v),4)
assert get('10')['visualization']['model']['edges']==[['A','B']], 'locus hidden initially'
assert 'обе точки исключаются' in get('10')['steps'][-1]['explanation']

# General identities and boundary counterchecks, across reproducible parameters.
rng=random.Random(20261102); cases=0
for _ in range(250):
 R=rng.uniform(.1,20);h=rng.uniform(.1,30);offset=rng.uniform(-.999,.999)*R
 chord=2*math.sqrt(R*R-offset*offset);assert 0<chord<=2*R
 x,y=[rng.uniform(-R,R) for _ in range(2)];assert math.sqrt(h*h+x*x+y*y)>=h
 near(2*math.pi*(R*h*2+4*R*R)-2*math.pi*(R*2*h+R*R),6*math.pi*R*R)
 near(math.atan2(h,R)+math.atan2(R,h),math.pi/2)
 # Ball segment: independently generate points inside a ball, then interpolate.
 a=[rng.gauss(0,1) for _ in range(3)];b=[rng.gauss(0,1) for _ in range(3)]
 a=[v*R*rng.random()/max(math.sqrt(norm2(a)),1e-9) for v in a]
 b=[v*R*rng.random()/max(math.sqrt(norm2(b)),1e-9) for v in b]
 t=rng.random();assert norm2([(1-t)*u+t*v for u,v in zip(a,b)])<=R*R+1e-9
 # Thales sphere: dot((M-A),(M-B)) = |M|²-R²; off-sphere samples must fail.
 v=[rng.gauss(0,1) for _ in range(3)];v=[x*R/math.sqrt(norm2(v)) for x in v]
 near(dot(sub(v,[-R,0,0]),sub(v,[R,0,0])),0)
 w=[.7*x for x in v];assert dot(sub(w,[-R,0,0]),sub(w,[R,0,0]))<0
 cases+=6
print(f'ATANASYAN_IV_SELFCHECK_MATH_OK: all 13 actual models; {cases} parameter cases; radical and endpoint negative controls')

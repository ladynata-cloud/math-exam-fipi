"""Coordinate/source-constraint author verification; no course writes."""
import math, importlib.util
from pathlib import Path
P=Path(__file__).with_name('section-1-4-b.py')
spec=importlib.util.spec_from_file_location('s14b',P);mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
N=0

def ck(x,msg='assertion'):
 global N
 N+=1
 assert x,msg

def close(a,b):ck(abs(a-b)<1e-7*max(1,abs(a),abs(b)),f'{a} != {b}')
def sub(a,b):return [x-y for x,y in zip(a,b)]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def norm(v):return math.sqrt(dot(v,v))
def dist(p,a,b):return norm(sub(p[a],p[b]))
def ang(p,a,b,c):
 u=sub(p[a],p[b]);v=sub(p[c],p[b]);return math.degrees(math.acos(max(-1,min(1,dot(u,v)/norm(u)/norm(v)))))
def area(p,names):return abs(sum(p[a][0]*p[b][1]-p[b][0]*p[a][1] for a,b in zip(names,names[1:]+names[:1])))/2

def parallel(p,a,b,c,d):
 u=sub(p[b],p[a]);v=sub(p[d],p[c]);close(u[0]*v[1]-u[1]*v[0],0)
def online(p,k,a,b,t):
 for i in range(3):close(p[k][i],p[a][i]+t*(p[b][i]-p[a][i]))
def perpendicular(p,a,b,c,d):close(dot(sub(p[b],p[a]),sub(p[d],p[c])),0)
def answer(c,v):
 expr=c['answer']['accepted'][0].replace(':','/')
 close(eval(expr,{'__builtins__':{}},{'sqrt':math.sqrt}),v)

ck(len(mod.lessons)==34)
for c in mod.lessons:
 n,part=c['number'],c['part'];a=part=='a';m=c['model'];p=m['points'];d=lambda x,y:dist(p,x,y);S=lambda names:area(p,list(names))
 ck(len(c['steps'])>=3);ck(c['section']=='1.4' and c['level']=='B')
 for k,point in p.items():ck(len(point)==3 and all(math.isfinite(v) for v in point))
 for x,y in m['edges']:ck(x in p and y in p);ck(d(x,y)>1e-9)
 for k in m['labelNames']:ck(k in p)
 for s in c['steps']:ck(s['view'] in m['views']);ck(bool(s['explanation']) and bool(s['reason']))
 for v in m['views'].values():
  for k in v.get('points',[])+v.get('polygon',[]):ck(k in p)
  for x,y in v.get('segments',[]):ck(x in p and y in p);ck(d(x,y)>1e-9)
  if v.get('polygon'):ck(area(p,v['polygon'])>1e-9)
 if n==1:
  close(d('B','C'),math.sqrt(7) if a else 4*math.sqrt(3));close(d('A','C'),3*math.sqrt(7) if a else 8*math.sqrt(3));close(ang(p,'A','C','_ext'),120);val=d('A','B')
 elif n==3:
  close(d('B','C'),12 if a else 21);close(math.sin(math.radians(ang(p,'B','A','C'))),2/3 if a else .25);close(ang(p,'A','C','_ext'),150);val=d('A','B')
  # Both roots of the SSA quadratic; negative length is not a triangle.
  aa=12 if a else 21;cc=9 if a else 42;roots=[aa*math.cos(math.pi/6)+s*math.sqrt(cc*cc-aa*aa/4) for s in [-1,1]]
  ck(sum(v>0 for v in roots)==(2 if a else 1))
  for bb in roots:
   if bb>0:
    q={'A':(bb*math.cos(math.pi/6),bb/2,0),'B':(aa,0,0),'C':(0,0,0)};close(d('A','B'),dist(q,'A','B'))
 elif n==4:
  parallel(p,'K','M','A','C');close(d('B','K')/d('K','A'),2/5 if a else 3/4);close(d('A','C') if a else d('K','M'),21 if a else 18);val=d('K','M') if a else d('A','C')
 elif n==5:
  parallel(p,'M','N','A','C');close(d('M','N'),18 if a else 13);close(d('A','C'),54 if a else 52);close(d('N','C'),32 if a else 36);val=d('B','N') if a else d('B','C')
 elif n==6:
  close(ang(p,'B','M','N'),ang(p,'B','C','A'));close(d('A','B'),42 if a else 52);close(d('A','C'),48 if a else 36);close(d('B','N') if a else d('M','N'),28 if a else 27);val=d('M','N') if a else d('B','N')
 elif n==7:
  close(S('AKB')/S('APB'),2/5 if a else 3/4);parallel(p,'M','P','M','K');ck(p['P'][1]*p['K'][1]>0);val=d('M','K')/d('K','P')
 elif n==8:
  close(d('A','B'),32 if a else 24)
  if a:close(d('B','C'),24);close(d('A','H'),16);perpendicular(p,'A','H','B','C');perpendicular(p,'C','K','A','B');val=d('C','K')
  else:close(d('C','H'),9);close(d('B','K'),12);perpendicular(p,'C','H','A','B');perpendicular(p,'B','K','A','C');val=d('A','C')
 elif n==9:
  close(ang(p,'A','B','C'),120 if a else 135);close(ang(p,'B','A','C') if a else ang(p,'B','C','A'),45 if a else 30);close(d('B','C') if a else d('A','B'),12 if a else 21*math.sqrt(2));val=d('A','C')
 elif n==11:
  close(ang(p,'B','A','C'),64 if a else 48);close(ang(p,'A','B','C'),24 if a else 76);close(ang(p,'A','C','D'),ang(p,'D','C','B'));perpendicular(p,'C','H','A','B');val=ang(p,'H','C','D')
 elif n==12:
  for x,y,w in [('A','B',24 if a else 16),('A','C',10 if a else 12),('B','C',26 if a else 20)]:close(d(x,y),w)
  small=min(ang(p,'B','A','C'),ang(p,'A','B','C'),ang(p,'A','C','B'));val=math.tan(math.radians(small)) if a else math.cos(math.radians(small))
 elif n==13:
  online(p,'M','B','A',.5);online(p,'K','B','C',4/5 if a else 10/13);val=S('ABC')/S('MBK')
 elif n==14:
  online(p,'M','A','C',.5);online(p,'K','A','B',1/3 if a else 1/7);close(S('AMK'),5 if a else 2);val=S('ABC')
 elif n==15:
  online(p,'M','A','B' if a else 'C',.5);online(p,'N','B','C',.5);close(S('MBN') if a else S('ABC'),32 if a else 76);val=S('ABC') if a else S('MCN')
 elif n==16:
  parallel(p,'A','C','A','M');close(d('B','K')/d('K','M'),7/5 if a else 4/9);close(S('AKC') if a else S('ABC'),48 if a else 39);val=S('ABCK')
 elif n==17:
  close(d('A','M')/d('M','B'),2 if a else .5);close(d('B','K')/d('K','C'),3/2 if a else 2/3);close(d('C','P')/d('P','A'),3 if a else 1/3);close(S('ABC'),90 if a else 60);val=S('MPK')
 elif n==18:
  expected={'A':[0,0,0],'B':[6,3,0] if a else [4,1,0],'C':[4,4,0] if a else [0,4,0]}
  ck(all(p[k]==v for k,v in expected.items()),'source grid coordinates')
  if a:close(ang(p,'A','B','D'),ang(p,'D','B','C'));parallel(p,'A','C','A','D');val=d('B','D')
  else:perpendicular(p,'C','H','A','B');parallel(p,'A','H','A','B');val=d('C','H')
 elif n==19:
  expected={'A':[0,5,0],'B':[3,6,0] if a else [3,2,0],'C':[0,0,0] if a else [1,0,0]}
  ck(all(p[k]==v for k,v in expected.items()),'source grid coordinates');angles=[ang(p,'B','A','C'),ang(p,'A','B','C'),ang(p,'A','C','B')];val=angles[0]+angles[2] if a else max(angles)
 answer(c,val)
 # Named auxiliary construction points are absent initially; source-given ones visible.
 v=m['views']['neutral'];visible=set(m['labelNames']+v.get('points',[])+v.get('polygon',[])+[n for e in v.get('segments',[]) for n in e])
 for k in ({7:['H','R'],16:['H','N'],18:['D'] if a else ['H']}.get(n,[])):ck(k not in visible)
 for k in ({4:['K','M'],5:['M','N'],6:['M','N'],7:['K','P','M'],8:['H'] if a else ['H','K'],11:['D','H'],13:['M','K'],14:['M','K'],15:['M','N'],16:['M','K'],17:['M','K','P']}.get(n,[])):ck(k in visible)
print(f'§1.4 B: 34 numerical answers, source constraints and initial/auxiliary visibility passed ({N} assertions).')

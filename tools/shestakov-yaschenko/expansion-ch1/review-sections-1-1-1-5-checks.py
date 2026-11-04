"""Independent review of all 36 §1.1/§1.5 additions, read-only."""
import math, json, re, runpy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[3]
MODULE=Path(__file__).with_name('sections-1-1-1-5.py')
cards=runpy.run_path(str(MODULE))['lessons'];N=0

def ck(x,msg='check'):
 global N
 N+=1
 assert x,msg

def close(a,b,msg='numeric'):
 ck(abs(a-b)<1e-8*max(1,abs(a),abs(b)),f'{msg}: {a} != {b}')
def sub(a,b):return [x-y for x,y in zip(a,b)]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def norm(v):return math.sqrt(dot(v,v))
def distance(p,a,b):return norm(sub(p[a],p[b]))
def angle(p,a,b,c):
 u=sub(p[a],p[b]);v=sub(p[c],p[b]);return math.degrees(math.acos(max(-1,min(1,dot(u,v)/norm(u)/norm(v)))))
def area(p,names):return abs(sum(p[a][0]*p[b][1]-p[b][0]*p[a][1] for a,b in zip(names,names[1:]+names[:1])))/2

def midpoint(p,m,a,b):
 for i in range(3):close(p[m][i],(p[a][i]+p[b][i])/2)
def parallel(p,a,b,c,d):
 u=sub(p[b],p[a]);v=sub(p[d],p[c]);close(u[0]*v[1]-u[1]*v[0],0)
def perp(p,a,b,c,d):close(dot(sub(p[b],p[a]),sub(p[d],p[c])),0)
def val(s):
 s=s.replace('−','-').replace(',','.').replace(' ','').replace('·','*')
 s=re.sub(r'√(\d+)',r'sqrt(\1)',s).replace('√(','sqrt(')
 s=re.sub(r'(\d)(sqrt)',r'\1*\2',s)
 return eval(s,{'__builtins__':{}},{'sqrt':math.sqrt})
def aliases(c,expected):
 if not isinstance(expected,(tuple,list)):expected=[expected]
 for alias in c['answer']['accepted']:
  raw=alias
  if ';' in raw and raw.startswith('(') and raw.endswith(')'):raw=raw[1:-1]
  parts=raw.split(';');ck(len(parts)==len(expected),(c['section'],c['number'],c['part'],alias))
  for expr,e in zip(parts,expected):close(val(expr),e,'answer alias')

expected_pairs={'1.1':{'A':[3,4,5,6,7,10,11,12],'B':[3,4]},'1.5':{'A':[1,2,3,7],'B':[1,3],'C':[1,3]}}
expected={(sec,lev,n,p) for sec,levels in expected_pairs.items() for lev,nums in levels.items() for n in nums for p in ['a','b']}
ck(len(cards)==36);ck({(c['section'],c['level'],c['number'],c['part']) for c in cards}==expected)
source=json.loads((ROOT/'stereo-course/shestakov-yaschenko-10-11/data/source-index.json').read_text());by_source={t['id']:t for t in source['tasks']}
# Original grid positions independently read from full-resolution PDF pages5,6,9.
grid={
('A',3,'a'):{'A':(5,5),'B':(2,2),'C':(8,2)},('A',3,'b'):{'A':(2,2),'B':(8,5),'C':(8,1)},
('A',4,'a'):{'A':(2,2),'B':(6,4),'C':(2,6)},('A',4,'b'):{'A':(2,4),'B':(4,7),'C':(8,1)},
('A',5,'a'):{'A':(2,2),'B':(6,4),'C':(4,6)},('A',5,'b'):{'A':(2,1),'B':(8,7),'C':(2,4)},
('B',4,'a'):{'O':(2,1),'P':(3,4),'Q':(6,3)},('B',4,'b'):{'O':(4,2),'P':(2,3),'Q':(7,3)}}
coord_figures={
(1,'a'):{'A':(1,6),'B':(9,6),'C':(9,9)},(1,'b'):{'A':(1,6),'B':(10,6),'C':(1,8)},
(2,'a'):{'A':(1,6),'B':(9,6),'C':(7,9)},(2,'b'):{'A':(1,6),'B':(10,6),'C':(3,8)},
(3,'a'):{'A':(1,7),'B':(3,7),'C':(5,9)},(3,'b'):{'A':(1,7),'B':(5,7),'C':(9,9)}}
for c in cards:
 sec,lev,n,part=c['section'],c['level'],c['number'],c['part'];a=part=='a';m=c['model'];p=m['points'];d=lambda x,y:distance(p,x,y)
 ck(len(c['steps'])>=3);ck(m['planar']);src=by_source[f'{sec}-{lev}{n}'];ck(part in src['variants'])
 for page in c['pages']:ck(src['pdfPage']<=page<=src['endPdfPage'])
 for xyz in p.values():ck(len(xyz)==3 and all(math.isfinite(v) for v in xyz));close(xyz[2],0)
 for u,v in m['edges']+m.get('arrows',[]):ck(u in p and v in p);ck(d(u,v)>1e-9)
 for name in m['labelNames']:ck(name in p)
 for k,v in m['views'].items():
  for name in v.get('points',[])+v.get('polygon',[]):ck(name in p)
  for u,w in v.get('segments',[]):ck(u in p and w in p);ck(d(u,w)>1e-9)
  if v.get('polygon'):ck(area(p,v['polygon'])>1e-9)
 for step in c['steps']:ck(step['view'] in m['views']);ck(bool(step['reason']) and bool(step['explanation']))
 if sec=='1.1':
  if (lev,n,part) in grid:
   for name,xy in grid[(lev,n,part)].items():close(p[name][0],xy[0]);close(p[name][1],xy[1])
  if lev=='A' and n==3:
   parallel(p,'B','C','B','H');perp(p,'A','H','B','C');ans=d('A','H')
  elif lev=='A' and n==4:
   parallel(p,'A','D','A','C');close(angle(p,'A','B','D'),angle(p,'D','B','C'));ans=d('B','D')
  elif lev=='A' and n==5:midpoint(p,'M','A','B');ans=d('C','M')
  elif lev=='A' and n==6:
   close(angle(p,'_a1','O','_b1'),17 if a else 45);close(angle(p,'_a1','O','_c1'),33 if a else 30);ans=angle(p,'_b1','O','_c1');ck(ans<33 if a else ans>45)
  elif lev=='A' and n==7:
   parallel(p,'_a0','_a1','_b0','_b1');parallel(p,'K','L','_c0','_c1');u=sub(p['_c1'],p['_c0']);theta=math.degrees(math.atan2(u[1],u[0]));close(theta,35);ans=theta if a else 180-theta
  elif lev=='A' and n==10:
   close(angle(p,'K','O','C'),28);close(angle(p,'A','O','L'),angle(p,'L','O','C'));close(angle(p,'C','O','K'),angle(p,'K','O','B'));close(angle(p,'L','O','C')+angle(p,'K','O','C'),90)
   if a:ck(c['answer']['mode']=='manual');continue
   ans=angle(p,'A','O','C')
  elif lev=='A' and n==11:
   close(angle(p,'A','O','C'),53);close(angle(p,'B','O','C'),23);close(angle(p,'B','O','D'),56);angles=[math.degrees(math.atan2(p[k][1],p[k][0])) for k in 'ABCD'];ck(angles==sorted(angles,reverse=True));ans=angle(p,'C' if a else 'A','O','D')
  elif lev=='A' and n==12:
   ck(c['answer']['mode']=='manual');parallel(p,'A','B','C','D');close(angle(p,'C','L','M'),angle(p,'M','L','K'));close(angle(p,'L','K','N'),angle(p,'N','K','B'));parallel(p,'L','M','K','N');close(angle(p,'K','M','L'),angle(p,'K','N','L'));continue
  elif lev=='B' and n==3:
   close(d('A','B'),14 if a else 17);close(d('D','C'),42 if a else 51);close(d('A','C'),56 if a else 64);parallel(p,'A','B','D','C');parallel(p,'A','M','M','C');parallel(p,'B','M','M','D');close(d('A','M')+d('M','C'),d('A','C'));ans=d('M','C')
  elif lev=='B' and n==4:
   parallel(p,'O','P','O','_p');parallel(p,'O','Q','O','_q');u=sub(p['P'],p['O']);v=sub(p['Q'],p['O']);cross=abs(u[0]*v[1]-u[1]*v[0]);ans=cross/dot(u,v);ck(angle(p,'P','O','Q')<90 if a else angle(p,'P','O','Q')>90)
 else:
  if lev=='A' and n in [1,2,3]:
   for name,xy in coord_figures[(n,part)].items():close(p[name][0],xy[0]);close(p[name][1],xy[1])
   if n>1:parallel(p,'A','B','A','H');perp(p,'C','H','A','B')
   ans=area(p,list('ABC'))
  elif lev=='A' and n==7:
   sourcea=(-3,5) if a else (5,3);sourceb=(0,-1) if a else (-2,-3)
   for i in range(2):close(p['P'][i]-p['O'][i],sourcea[i]);close(p['Q'][i]-p['O'][i],sourceb[i]);close(p['R'][i]-p['O'][i],sourcea[i]+sourceb[i])
   ck(['O','P'] in m['arrows'] and ['O','Q'] in m['arrows']);ans=[sourcea[i]+sourceb[i] for i in range(2)]
  elif lev=='B' and n==1:
   xyA=(7,10) if a else (9,10);xyB=(10,7) if a else (10,9)
   for name,xy in [('O',(0,0)),('A',xyA),('B',xyB)]:close(p[name][0],xy[0]);close(p[name][1],xy[1])
   ans=area(p,['O','A','B']);close(area(p,['O','P','Q','R']),100);close(ans+area(p,['O','P','A'])+area(p,['A','Q','B'])+area(p,['B','R','O']),100)
  elif lev=='B' and n==3:
   xy={'A':(2,5),'B':(0,0),'C':(4,3)} if a else {'A':(-3,-2),'B':(-6,2),'C':(0,0)}
   for name,pos in xy.items():close(p[name][0],pos[0]);close(p[name][1],pos[1])
   midpoint(p,'M' if a else 'P','A','C' if a else 'B');ans=d('B','M') if a else d('C','P')
  elif lev=='C' and n==1:
   close(d('A','B'),10 if a else 16);close(d('B','C'),5 if a else 8);perp(p,'B','A','B','C');parallel(p,'A','M','A','C');close(d('A','M')/d('M','C'),2/3 if a else 3/5);aa,bb=(3/5,2/5) if a else (5/8,3/8)
   for i in range(3):close(p['M'][i]-p['B'][i],aa*(p['A'][i]-p['B'][i])+bb*(p['C'][i]-p['B'][i]))
   ck(all(edge in m.get('arrows',[]) for edge in [['B','A'],['B','C'],['B','M']]),'given vector arrows');ans=[aa,bb,d('B','M')]
  elif lev=='C' and n==3:
   pa,pb=((4,4),(6,-4)) if a else ((-3,2),(2,6))
   for name,xy in [('A',pa),('B',pb)]:close(p[name][0],xy[0]);close(p[name][1],xy[1])
   axis=0 if a else 1;close(p['M'][axis],0);close(p['Aprime'][axis],-p['A'][axis]);close(p['Aprime'][1-axis],p['A'][1-axis]);parallel(p,'Aprime','M','Aprime','B');close(d('Aprime','M')+d('M','B'),d('Aprime','B'));close(d('A','M'),d('Aprime','M'));ans=p['M'][:2]
   for t in [-20,-5,0,2,10,30]:
    q=(0,t,0) if a else (t,0,0);ck(norm(sub(q,p['A']))+norm(sub(q,p['B']))>=d('A','M')+d('M','B')-1e-9)
 aliases(c,ans)
 neutral=m['views']['neutral'];visible=set(m['labelNames']+neutral.get('points',[])+neutral.get('polygon',[])+[k for e in neutral.get('segments',[]) for k in e])
 forbidden=[]
 if sec=='1.1' and lev=='A' and n==3:forbidden=['H']
 if sec=='1.1' and lev=='B' and n==4:forbidden=['H','K']
 if sec=='1.5' and lev=='A' and n in [2,3]:forbidden=['H']
 if sec=='1.5' and lev=='A' and n==7:forbidden=['R']
 if sec=='1.5' and lev=='B' and n==1:forbidden=['P','Q','R']
 if sec=='1.5' and lev=='C' and n==3:forbidden=['Aprime','M']
 for name in forbidden:ck(name not in visible,'auxiliary hidden initially')
 for name in set('ABC')&set(p):
  if name!='C' or sec!='1.5' or lev!='C' or n!=3:ck(name in visible,'given point visible')
print(f'Independent §1.1/§1.5 review: all36 cards, all exact aliases and all model/source constraints pass; {N} assertions.')

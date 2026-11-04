#!/usr/bin/env python3
"""Independent reviewer geometry checks. Does not import author generator."""
import json, math
from pathlib import Path
from collections import defaultdict
ROOT=Path(__file__).resolve().parents[2]
data=json.loads((ROOT/'stereo-course/shestakov-yaschenko-10-11/chapters/ch4.json').read_text())
N=0

def ck(test,msg='check'):
 global N
 N+=1
 assert test,msg

def close(a,b,msg='numeric'):
 ck(abs(a-b)<1e-7*max(1,abs(a),abs(b)),f'{msg}: {a} != {b}')
def sub(a,b):return [x-y for x,y in zip(a,b)]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def norm(a):return math.sqrt(dot(a,a))
def area(p,names):
 v=[0.,0.,0.]
 for a,b in zip(names,names[1:]+names[:1]):v=[x+y for x,y in zip(v,cross(p[a],p[b]))]
 return norm(v)/2

def shell_volume(p,faces):
 edges=defaultdict(list)
 for i,f in enumerate(faces):
  for a,b in zip(f,f[1:]+f[:1]):edges[tuple(sorted((a,b)))].append((i,1 if a<b else -1))
 ck(all(len(e)==2 for e in edges.values()),'closed two-manifold shell')
 adj=defaultdict(list)
 for pair in edges.values():
  (i,s),(j,t)=pair;adj[i].append((j,-s*t));adj[j].append((i,-s*t))
 signs={0:1};todo=[0]
 while todo:
  i=todo.pop()
  for j,rel in adj[i]:
   if j in signs:ck(signs[j]==signs[i]*rel,'orientable shell')
   else:signs[j]=signs[i]*rel;todo.append(j)
 ck(len(signs)==len(faces),'connected shell')
 return abs(sum(signs[i]*dot(p[f[0]],cross(p[f[j]],p[f[j+1]]))/6 for i,f in enumerate(faces) for j in range(1,len(f)-1)))

def plane_distance(p,target,plane):
 a,b,c=[p[k] for k in plane];normal=cross(sub(b,a),sub(c,a));return abs(dot(sub(p[target],a),normal))/norm(normal)
def linecos(p,a,b,c,d):
 u=sub(p[b],p[a]);v=sub(p[d],p[c]);return abs(dot(u,v))/(norm(u)*norm(v))
def lineplane_sin(p,a,b,pl):
 x,y,z=[p[k] for k in pl];n=cross(sub(y,x),sub(z,x));v=sub(p[b],p[a]);return abs(dot(n,v))/norm(n)/norm(v)
def planecos(p,f,g):
 a,b,c=[p[k] for k in f];d,e,f=[p[k] for k in g];u=cross(sub(b,a),sub(c,a));v=cross(sub(e,d),sub(f,d));return abs(dot(u,v))/norm(u)/norm(v)

def accepted(card,value):
 raw=card['answer']['accepted'][0].replace(',','.').replace(':','/')
 close(eval(raw,{'__builtins__':{}},{'sqrt':math.sqrt,'arcsin':math.asin,'arccos':math.acos}),value,card['section']+card['level']+str(card['number'])+card['part'])

ck(len(data['lessons'])==72);ck(len(data['theory'])==6)
for sec in ['4.1','4.2','4.3','4.4','4.5','4.6']:
 ck(sum(l['section']==sec for l in data['lessons'])==12)
 ck(sum(l['section']==sec for l in data['theory'])==1)
for card in data['lessons']+data['theory']:
 m=card['model'];p=m['points'];key=card['section']+str(card.get('number','theory'))+card.get('part','')
 ck('neutral' in m['views'])
 for a in p.values():ck(len(a)==3 and all(math.isfinite(v) for v in a))
 for a,b in m['edges']:ck(a in p and b in p);ck(norm(sub(p[a],p[b]))>1e-9,key+' nonzero edge')
 for name in m.get('labelNames',[]):ck(name in p)
 for view in m['views'].values():
  for a,b in view.get('segments',[]):ck(a in p and b in p);ck(norm(sub(p[a],p[b]))>1e-9)
  for a in view.get('points',[]):ck(a in p)
  for a in view.get('polygon',[]):ck(a in p)
 for f in m.get('faces',[])+[v['polygon'] for v in m['views'].values() if 'polygon' in v]:
  ck(len(f)>=3);ck(area(p,f)>1e-9,key+' nondegenerate polygon')
  normal=None
  for i in range(1,len(f)-1):
   n=cross(sub(p[f[i]],p[f[0]]),sub(p[f[i+1]],p[f[0]]))
   if norm(n)>1e-9:normal=n;break
  ck(normal is not None)
  for name in f:close(dot(sub(p[name],p[f[0]]),normal)/norm(normal),0,key+' planar face')
 for s in card['steps']:ck(s['view'] in m['views']);ck(bool(s['explanation']) and bool(s['reason']))
 if 'answer' not in card:continue
 sec,level,num,part=card['section'],card['level'],card['number'],card['part'];a=part=='a'
 dist=lambda u,v:norm(sub(p[u],p[v]))
 faces=m.get('faces',[])
 if sec=='4.1':
  if level=='A' and num==1:ans=math.degrees(math.acos(linecos(p,'A','A1','B' if a else 'C','A1')))
  elif level=='A' and num==15:ans=sum(area(p,f) for f in faces[2:])
  elif level=='A' and num==18:ans=area(p,['M','N','N1','M1'])
  elif level=='B':ans=plane_distance(p,('A' if a else 'C1') if num==1 else ('K' if a else 'P'),['B','M','C'])
  else:ans=plane_distance(p,'F' if a else 'O',['B','M','E'])
 elif sec=='4.2':
  if level=='A' and num==1:ans=math.degrees(math.acos(linecos(p,*(['A','A1','B','C1'] if a else ['B','A1','D','C1']))))
  elif level=='A' and num==8:
   ans=dist('A','B');close(6*(ans+1)**2-6*ans**2,30 if a else 90)
  elif level=='A' and num==10:ans=sum(area(p,f) for f in faces)
  elif level=='B' and num==1:close(plane_distance(p,'E',['A','M','N']),0);ans=dist('B1' if a else 'C1','E')
  elif level=='B':ans=plane_distance(p,'A' if a else 'B1',['D1','M','N'])
  else:ans=plane_distance(p,'P' if a else 'F',['A','D1','B1'])
 elif sec=='4.3':
  if level=='A' and num==9:ans=dist('A1','C') if a else dist('B','D1')
  elif level=='A' and num==10:ans=sum(area(p,f) for f in faces)
  elif level=='A':ans=area(p,['A','C','C1','A1'])
  elif level=='B' and num==1:ans=math.asin(lineplane_sin(p,'A1','B1' if a else 'D1',['A','B1','D1']))
  elif level=='B':
   close(plane_distance(p,'Q',['E','T','D1']),0);close(dist('A1','E')/dist('E','A'),1/4 if a else 1/2);close(dist('B1','T')/dist('T','C1'),1/2 if a else 1/4);ans=dist('B1','Q')/dist('Q','B')
  else:close(planecos(p,['B','A1','D'],['A','B','D']),.5);ans=shell_volume(p,faces)
 elif sec=='4.4':
  if level=='A' and num==2:ans=dist('A','A1');close(sum(area(p,f) for f in faces),800 if a else 476)
  elif level=='A' and num==3:ans=sum(area(p,f) for f in faces)
  elif level=='A':ans=shell_volume(p,faces)
  elif level=='B' and num==1:
   close(dot(sub(p['B1'],p['H']),sub(p['D'],p['A1'])),0);close(norm(cross(sub(p['H'],p['A1']),sub(p['D'],p['A1']))),0);ans=norm(cross(sub(p['B1'],p['A1']),sub(p['D'],p['A1'])))/dist('A1','D')
  elif level=='B':
   cos=math.sqrt(1-lineplane_sin(p,'A','A1',['A','B','D'])**2) if a else planecos(p,['A','B','D'],['A','B','A1']);ans=math.sqrt(1-cos*cos)/cos
  else:
   close(dist('A','B'),4 if a else 3);close(dist('A','A1'),2 if a else 1.5);ans=plane_distance(p,'B1' if a else 'B',['K','U','V'])
   n=cross(sub(p['U'],p['K']),sub(p['V'],p['K']));u=sub(p['O'],p['B' if a else 'B1']);v=sub(p['A' if a else 'A1'],p['D1' if a else 'D']);close(dot(n,u),0);close(dot(n,v),0)
 elif sec=='4.5':
  if level=='A' and num==1:ans=math.degrees(math.acos(linecos(p,'E1','B','E1','E'))) if a else dist('D','D1')/dist('D','A')
  elif level=='A' and num==6:ans=sum(area(p,f) for f in faces[2:])
  elif level=='A':ans=shell_volume(p,faces)
  elif level=='B' and num==4:ans=dist('D','F1') if a else dist('A','E1')
  elif level=='B':ans=area(p,['A','C','E'] if a else ['B','C','E'])*dist('A','A1')
  else:ans=plane_distance(p,'D1' if a else 'D',['M','B1','F1'])
 elif sec=='4.6':
  if level=='A':ans=shell_volume(p,faces)
  elif level=='B':
   ck(card['answer']['mode']=='manual');close(planecos(p,['A','B','C'],['A','B','C1']),.5);close(planecos(p,['A','B','C'],['A','B','C2']),.5);close(linecos(p,'A','C','B','D1'),1/5);close(linecos(p,'A','C','B','D2'),3/5);continue
  else:
   close(dist('A','E'),dist('B','E'));close(dist('C','P'),dist('D','P'));close(dot(sub(p['P'],p['E']),sub(p['B'],p['A'])),0);close(dot(sub(p['P'],p['E']),sub(p['D'],p['C'])),0);close(linecos(p,'A','B','C','D'),math.sqrt(35)/10 if a else math.sqrt(15)/10);close(linecos(p,'C','A','C','B'),math.sqrt(3/40) if a else 2*math.sqrt(15)/15);ans=dist('E','P')
 accepted(card,ans)
source=json.loads((ROOT/'stereo-course/shestakov-yaschenko-10-11/data/source-index.json').read_text())
source_by_id={t['id']:t for t in source['tasks']}
seen=set()
for card in data['lessons']:
 key=f"{card['section']}-{card['level']}{card['number']}"
 ck(key in source_by_id)
 ck((key,card['part']) not in seen)
 seen.add((key,card['part']))
 src=source_by_id[key]
 ck(card['part'] in src['variants'])
 for page in card['pages']:ck(src['pdfPage']<=page<=src['endPdfPage'])
print(f'Chapter 4: 72 variants + 6 theory, {N} independent assertions passed.')

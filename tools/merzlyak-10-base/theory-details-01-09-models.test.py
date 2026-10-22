#!/usr/bin/env python3
"""Semantic invariants of the concrete proof/section/projection scenes."""
import json, math, hashlib,itertools
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'stereo-course/merzlyak-10-base/lessons';N=0

def chk(x,msg):
 global N;N+=1
 assert x,msg

def eq(x,y,msg):chk(abs(x-y)<1e-8*max(1,abs(x),abs(y)),msg)
def sub(a,b):return [x-y for x,y in zip(a,b)]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def norm(a):return math.sqrt(dot(a,a))
def pts(p,n):return json.loads((D/f'theory-{p:02}-detail-{n:02}.json').read_text())['visualization']['model']['points']
def length(p,a,b):return norm(sub(p[a],p[b]))
def par(p,a,b,c,d):eq(norm(cross(sub(p[b],p[a]),sub(p[d],p[c]))),0,f'{a}{b} parallel {c}{d}')
def perp(p,a,b,c,d):eq(dot(sub(p[b],p[a]),sub(p[d],p[c])),0,f'{a}{b} perpendicular {c}{d}')
def online(p,k,a,b):eq(norm(cross(sub(p[k],p[a]),sub(p[b],p[a]))),0,f'{k} on {a}{b}')
def plane(p,keys):
 a,b,c=map(p.get,keys[:3]);normal=cross(sub(b,a),sub(c,a));chk(norm(normal)>1e-8, f'plane{keys}')
 for k in keys[3:]:eq(dot(sub(p[k],a),normal),0,f'{k} coplanar {keys}')
def inside(p,k,a,b):
 online(p,k,a,b);u=sub(p[b],p[a]);t=dot(sub(p[k],p[a]),u)/dot(u,u);chk(0<t<1,f'{k} internal {a}{b}')
def mid(p,k,a,b):
 for x,y,z in zip(p[k],p[a],p[b]):eq(x,(y+z)/2,f'{k} midpoint')

p=pts(2,1);plane(p,['M','A','B','C']);chk(norm(cross(sub(p['A'],p['M']),sub(p['B'],p['M'])))>0,'intersecting distinct lines')
p=pts(3,1);chk(len(p)==6,'pentagonal pyramid six vertices');plane(p,list('ABCDE'));chk(p['F'][2]>0,'apex outside base')
p=pts(3,2);inside(p,'M','A','A1');inside(p,'N','D','D1');online(p,'X','M','N');online(p,'X','A','D');chk(length(p,'A','M')!=length(p,'D','N'),'unequal heights')
p=pts(3,3)
for k,a,b in [('M','A','D'),('N','B','D'),('K','A','C'),('P','B','C')]:inside(p,k,a,b)
plane(p,['K','M','N','P']);online(p,'X','M','N');online(p,'X','A','B');online(p,'P','K','X')
p=pts(3,4)
for k,a,b in [('K','A','A1'),('M','B','B1'),('N','C','C1')]:inside(p,k,a,b)
online(p,'X','A','B');online(p,'X','M','K');online(p,'Y','B','C');online(p,'Y','M','N');plane(p,['K','M','N','X','Y'])
p=pts(4,1);par(p,'P','Q','C','B');online(p,'A','C','B');plane(p,['P','Q','B','C'])
p=pts(4,2)
for a,b in [('C','D'),('E','F')]:par(p,'A','B',a,b)
online(p,'M','P','Q');online(p,'M','C','D');plane(p,['A','B','M','P','Q'])
for j in [1,2,3]:
 p=pts(5,j);par(p,'A','B','C','D');par(p,'A','B','P','Q');plane(p,['P','Q','B','A']);plane(p,['P','Q','D','C'])
 if j==3:par(p,'E','F','P','Q');chk(p['E'][1]!=0 and p['E'][2]!=0,'line outside both planes')
p=pts(5,4);inside(p,'M','A1','B1');inside(p,'N','B1','C1');par(p,'M','N','A','C');plane(p,['A','M','N','C'])
p=pts(5,5);mid(p,'M','A','D');mid(p,'N','B','D');par(p,'M','N','A','B');par(p,'P','K','A','B');inside(p,'P','B','C');inside(p,'K','A','C');plane(p,['K','M','N','P'])
p=pts(6,1);par(p,'O','A','O1','A1');par(p,'O','B','O1','B1');plane(p,['O','A','C','B']);plane(p,['O1','A1','C1','B1']);chk(p['O1'][2]!=0,'external point')
p=pts(6,2)
for k,a,b in [('M','E','C'),('N','B','C'),('P','A','D'),('K','D','E')]:inside(p,k,a,b)
par(p,'M','N','B','E');par(p,'N','P','A','B');par(p,'P','K','A','E');plane(p,['M','N','P','K']);chk(norm(cross(cross(sub(p['B'],p['A']),sub(p['E'],p['A'])),cross(sub(p['N'],p['P']),sub(p['M'],p['P']))))<1e-8,'section parallel face')
# Regression: a general convex quadrilateral can yield a triangular section.
q={'A':[0,0,0],'B':[4,0,0],'C':[3,3,0],'D':[0,1,0],'E':[1,1,4],'M':[2.5,2.5,1],'N':[3.25,2.25,0],'T':[1.875,2.25,0]}
inside(q,'M','E','C');inside(q,'N','B','C');inside(q,'T','C','D');par(q,'M','N','B','E');par(q,'N','T','A','B');chk(q['N'][1]>q['D'][1],'trace misses AD segment')
lesson=json.loads((D/'theory-06-detail-02.json').read_text());chk('MNT' in lesson['steps'][-1]['explanation'] and 'MND' in lesson['steps'][-1]['explanation'],'triangle and boundary cases explained')
for pn,nn,labels in [(3,2,['M','N','X']),(3,3,['M','N','K','P','X']),(3,4,['K','M','N','X','Y']),(5,4,['M','N']),(5,5,['K','M','N','P'])]:
 scene=json.loads((D/f'theory-{pn:02}-detail-{nn:02}.json').read_text())['visualization']['model'];chk(set(labels)<=set(scene['labelNames']),'construction labels visible')
p=pts(7,1);mid(p,'O','A','A1');mid(p,'O','B','B1');eq(length(p,'A','B'),length(p,'A1','B1'),'central symmetry distance')
p=pts(7,2)
for k in 'ABCD':par(p,k,k+'1','E','F');eq(p[k+'1'][2],0,'image plane')
perp(p,'A','B','A','D');chk(abs(dot(sub(p['B1'],p['A1']),sub(p['D1'],p['A1'])))>1e-8,'projected rectangle is not rectangular');online(p,'E1','E','F')
p=pts(7,3);mid(p,'X','A','B');mid(p,'X1','A1','B1');par(p,'A','A1','B','B1');par(p,'A','A1','X','X1');plane(p,['A','B','B1','A1','X','X1'])
p=pts(7,4);par(p,'A','B','C','D');par(p,'A1','B1','C1','D1')
for k in 'BCD':par(p,'A','A1',k,k+'1')
p=pts(7,5);par(p,'A','B','C','D');online(p,'O','A','D');online(p,'O','B','C');online(p,'O1','A1','D1');online(p,'O1','B1','C1');eq(length(p,'A','B')/length(p,'C','D'),.5,'source ratio');eq(length(p,'A1','B1')/length(p,'C1','D1'),.5,'image ratio');eq(length(p,'A','O')/length(p,'O','D'),.5,'cross-transversal ratio')
p=pts(7,6);eq(length(p,'A','B'),length(p,'C','D'),'isosceles trapezoid');par(p,'B','C','A','D');perp(p,'B','K','A','D');mid(p,'M','A','D');mid(p,'N','B','C');mid(p,'M1','A1','D1');mid(p,'N1','B1','C1');par(p,'B1','K1','M1','N1');online(p,'K1','A1','D1');chk(abs(dot(sub(p['K1'],p['B1']),sub(p['D1'],p['A1'])))>1e-8,'height image not perpendicular')
p=pts(7,7);red=['A','D','C','C1'];blue=['B','A1','B1','D1'];chk(len({tuple(x) for x in p.values()})==8,'eight distinct projections')
expected=[(('A','D','C'),'B'),(('A','D','C1'),'B1'),(('A','C','C1'),'A1'),(('D','C','C1'),'D1'),(('B','A1','B1'),'A'),(('B','A1','D1'),'C'),(('B','B1','D1'),'D'),(('A1','B1','D1'),'C1')]
for triple,other in expected:
 found=False
 for a,b,c in itertools.permutations(triple):
  if norm(sub([p[a][i]+p[b][i]-p[c][i] for i in range(3)],p[other]))<1e-8:
   chk(norm(cross(sub(p[a],p[c]),sub(p[b],p[c])))>1e-8,'nondegenerate coloured parallelogram');found=True;break
 chk(found,f'colour triple {triple} + {other}')
p=pts(7,8);names=list('ABCDE');side=length(p,'A','B')
for i in range(5):eq(length(p,names[i],names[(i+1)%5]),side,'regular pentagon side')
chk(abs(length(p,'A1','B1')-length(p,'B1','C1'))>1e-5,'projection irregular')
def cross2(a,b):return a[0]*b[1]-a[1]*b[0]
def param(a,b,c,d):
 u=sub(b,a);w=sub(d,c);return cross2(sub(c,a),w)/cross2(u,w)
for suffix in ['', '1']:
 for i in range(5):
  a=p[names[i]+suffix];b=p[names[(i+2)%5]+suffix];ts=[]
  for j in range(5):
   endpoints={j,(j+2)%5}
   if endpoints & {i,(i+2)%5}:continue
   t=param(a,b,p[names[j]+suffix],p[names[(j+2)%5]+suffix]);
   if 0<t<1:ts.append(t)
  ts.sort();chk(len(ts)==2,'two diagonal intersections');eq(ts[0],1-ts[1],'equal outer parts');eq((ts[1]-ts[0])/ts[0],(math.sqrt(5)-1)/2,'all diagonal ratios1:lambda:1')
p=pts(7,9);eq(length(p,'A','B'),length(p,'A','D'),'equilateral target');eq(length(p,'A','B'),length(p,'B','D'),'equilateral target2')
for k in 'KLMNOPGUVWX':par(p,k,k+'1','C','D')
for a,b in [('K','N'),('L','O'),('M','P')]:online(p,'G',a,b);online(p,'G1',a+'1',b+'1')
for k,line1,line2 in [('K',('B','X'),('C','Y')),('L',('A','V'),('C','Y')),('M',('A','V'),('B','W')),('N',('B','W'),('C','Z')),('O',('A','U'),('C','Z')),('P',('A','U'),('B','X'))]:
 online(p,k,*line1);online(p,k,*line2)
for a,b,c in [('U','B','C'),('V','C','B'),('W','C','A'),('X','A','C'),('Y','A','B'),('Z','B','A')]:eq(length(p,b,a)/length(p,b,c),1/3,'trisection')
p=pts(8,1)
for a,b in [('M','A'),('M','B'),('A','B')]:eq(length(p,a,b),length(p,a+'1',b+'1'),'three equal triangle sides');par(p,a,b,a+'1',b+'1')
p=pts(8,2);par(p,'A1','B','D1','C');eq(length(p,'A1','B'),length(p,'A1','D'),'cube diagonal1');eq(length(p,'A1','B'),length(p,'B','D'),'cube diagonal2');u=sub(p['D'],p['A1']);w=sub(p['C'],p['D1']);eq(abs(dot(u,w))/norm(u)/norm(w),.5,'60 degree angle')
p=pts(9,1);mid(p,'O','M','N');perp(p,'M','N','O','A');perp(p,'M','N','O','B');inside(p,'X','A','B')
for k in ['A','B','X']:eq(length(p,k,'M'),length(p,k,'N'),f'{k} equidistant')
perp(p,'M','N','O','X')
p=pts(9,2);par(p,'A','A1','B','M');perp(p,'B','M','B','C');chk(abs(dot(sub(p['M'],p['C']),sub(p['C'],p['B'])))>1e-8,'second candidate is not perpendicular')

coverage=json.loads((R/'tools/merzlyak-10-base/coverage-theory-01-09.json').read_text());chk(coverage['newDraftLessonCount']==27,'27 cards')
for entry in coverage['paragraphs']:
 ov=entry['overview'];chk(hashlib.sha256((R/ov['file']).read_bytes()).hexdigest()==ov['sha256'],'overview hash')
 for card in entry['addedLessons']:
  path=R/card['file'];lesson=json.loads(path.read_text());chk(hashlib.sha256(path.read_bytes()).hexdigest()==card['sha256'],'detail hash');chk(lesson['status']=='draft' and set(lesson['review'].values())=={'pending'},'no promoted reviews');chk(card['part'] in entry['requiredParts'],'exact part contract')
  for s in lesson['steps']:chk(s['view'] in lesson['visualization']['model']['views'],'step view exists')
print(f'PASS: 27 theory-detail scenes, {N} semantic and coverage assertions.')

#!/usr/bin/env python3
"""Independent read-only geometry checks on the 97 self-check answer models."""
import json
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
LESSONS=ROOT/'stereo-course/merzlyak-10-base/lessons'
CHECKS=0

def check(condition, message):
 global CHECKS
 CHECKS+=1
 assert bool(condition),message

def near(a,b=0):check(np.linalg.norm(np.asarray(a)-np.asarray(b))<1e-8,f'{a} != {b}')
def vector(p,a,b):return p[b]-p[a]
def length(p,a,b):return np.linalg.norm(vector(p,a,b))
def normal(p,a,b,c):return np.cross(vector(p,a,b),vector(p,a,c))
def perpendicular(p,a,b,c,d):near(np.dot(vector(p,a,b),vector(p,c,d)))
def parallel(p,a,b,c,d):near(np.cross(vector(p,a,b),vector(p,c,d)))
def midpoint(p,m,a,b):near(p[m],(p[a]+p[b])/2)
def outside(p,d,a,b,c):check(abs(np.dot(p[d]-p[a],normal(p,a,b,c)))>1e-8,'point must be outside plane')
def line(p,x,a,b):near(np.cross(p[x]-p[a],p[b]-p[a]))
def skew(p,a,b,c,d):check(abs(np.dot(p[c]-p[a],np.cross(p[b]-p[a],p[d]-p[c])))>1e-8,'lines must be skew')
def polygon(p,poly):
 check(len(poly)>=3,'polygon has fewer than 3 points')
 pts=[p[k] for k in poly];n=next((np.cross(pts[i]-pts[0],pts[j]-pts[0]) for i in range(1,len(pts)) for j in range(i+1,len(pts)) if np.linalg.norm(np.cross(pts[i]-pts[0],pts[j]-pts[0]))>1e-8),None)
 check(n is not None,'degenerate polygon')
 for x in pts:near(np.dot(x-pts[0],n))
def model_relations(n,q,p):
 if n==1:outside(p,'D','A','B','C')
 elif n==2:check(np.linalg.norm(normal(p,'A','B','C'))>1e-8,'plane must be defined')
 elif n==3:outside(p,'S','A','B','C')
 elif n==4:parallel(p,'A','B','D','C');skew(p,'A','B','C','C1')
 elif n==5 or (n,q)==(10,5):
  parallel(p,'E','F','A','B');outside(p,'E','A','B','C');perpendicular(p,'E','A','A','B');perpendicular(p,'E','A','A','D')
 elif n==6 or (n,q) in [(10,6),(13,6)]:
  parallel(p,'A','B','A1','B1');parallel(p,'A','C','A1','C1');outside(p,'A1','A','B','C')
  perpendicular(p,'A','A1','A','B');perpendicular(p,'A','A1','A','C')
 elif n==7:
  if q==3:
   for a in ['A','B','C']:midpoint(p,'O',a,a+'1')
  elif q in [2,4,5]:
   for a in ['B','C']:near(vector(p,a,a+'1'),vector(p,'A','A1'))
   for a,b in [('A','B'),('B','C'),('C','A')]:near(length(p,a,b),length(p,a+'1',b+'1'))
  else:
   parallel(p,'A','A1','B','B1');parallel(p,'A','A1','C','C1');midpoint(p,'M','A','B');midpoint(p,'M1','A1','B1')
 elif n==8:
  skew(p,'A','B','C','D');parallel(p,'A','E','C','D');near(np.dot(vector(p,'A','B'),vector(p,'A','E'))/(length(p,'A','B')*length(p,'A','E')),.5)
 elif n==9:
  perpendicular(p,'M','O','O','A');perpendicular(p,'M','O','O','B');parallel(p,'M','O','N','Q');midpoint(p,'O','M','M1')
 elif n==10 and q in [7,8]:
  skew(p,'A','B','C','D');line(p,'O','A','B');line(p,'O1','C','D');perpendicular(p,'O','O1','A','B');perpendicular(p,'O','O1','C','D')
 elif n==10:
  perpendicular(p,'M','O','O','A');perpendicular(p,'M','O','O','B');near(np.dot(p['O']-p['A'],normal(p,'A','B','C')));check(length(p,'M','A')>length(p,'M','O'),'inclined segment must exceed perpendicular')
 elif n==11:
  perpendicular(p,'A','B','B','C');perpendicular(p,'A','B','D','E');perpendicular(p,'D','E','B','C');perpendicular(p,'D','E','A','C')
 elif n==12:
  perpendicular(p,'M','O','O','A');near(np.dot(vector(p,'A','M'),vector(p,'A','O'))/(length(p,'A','M')*length(p,'A','O')),np.sqrt(3)/2)
 elif n==13:
  line(p,'O','L','R');perpendicular(p,'L','R','O','A');perpendicular(p,'L','R','O','B');outside(p,'B','L','R','A')
 elif n==14:
  perpendicular(p,'L','R','O','A');perpendicular(p,'L','R','O','B');perpendicular(p,'O','A','O','B')
 elif n==15:
  perpendicular(p,'B','B1','A','C');perpendicular(p,'B','B1','D','B1');near(np.linalg.norm(normal(p,'A','B1','C'))/np.linalg.norm(normal(p,'A','B','C')),.5)
 elif n==16 and q!=9:
  for a in ['A','B','C']:near(vector(p,a,a+'1'),vector(p,'A','A1'))
  perpendicular(p,'A','A1','A','B');perpendicular(p,'A','A1','A','C')
  if q==8:check(abs(length(p,'A','B')-length(p,'B','C'))>1e-8,'this model intentionally illustrates a nonregular base')
 elif n==17 or (n,q)==(16,9):
  for a,b,c,d in [('A','B','A','D'),('A','B','A','A1'),('A','D','A','A1')]:perpendicular(p,a,b,c,d)
  midpoint(p,'O','A','C1');midpoint(p,'O','B','D1');midpoint(p,'O','C','A1');midpoint(p,'O','D','B1')
  near(length(p,'A','C1')**2,length(p,'A','B')**2+length(p,'A','D')**2+length(p,'A','A1')**2)
 elif n==18:
  midpoint(p,'O','A','C');midpoint(p,'O','B','D');midpoint(p,'M','A','B')
  perpendicular(p,'S','O','A','B');perpendicular(p,'S','O','A','D');perpendicular(p,'S','M','A','B')
  near(length(p,'A','B'),length(p,'A','D'))
 elif n==19:
  for a in ['A','B','C','D']:near(p[a+'1']-(p['O1']),.5*(p[a]-p['O']))
  midpoint(p,'M','A','B');midpoint(p,'M1','A1','B1');perpendicular(p,'M','M1','A','B');perpendicular(p,'O','O1','A','B');perpendicular(p,'O','O1','A','D')

files=sorted(LESSONS.glob('question-*.json'));check(len(files)==97,'expected 97 self-check cards')
for file in files:
 d=json.loads(file.read_text());n,q=map(int,d['source']['exercise'].split('.'));m=d['visualization']['model'];p={k:np.array(v,dtype=float) for k,v in m['points'].items()}
 check(d['source']['collection']=='selfcheck','wrong collection');check(d['source']['printedPages']==[x-1 for x in d['source']['pdfPages']],'wrong page mapping')
 for a,b in m.get('edges',[]):check(a in p and b in p and length(p,a,b)>1e-8,'invalid edge')
 for poly in m.get('faces',[]):polygon(p,poly)
 for view in m.get('views',{}).values():
  for a,b in view.get('segments',[]):check(a in p and b in p and length(p,a,b)>1e-8,'invalid highlighted segment')
  if 'polygon'in view:polygon(p,view['polygon'])
  for a in view.get('points',[]):check(a in p,'invalid view point')
 for s in d['steps']:check(s['view'] in m['views'],'step uses missing view')
 model_relations(n,q,p)
print(f'SELFCHECK_MODELS_OK 97 cards, {CHECKS} independent numerical/structural checks')

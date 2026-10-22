"""Source-constraint regression checks for the 13 supplementary drafts.

Python 3 + NumPy. Loads JSON directly; does not import the authoring generator.
"""
from pathlib import Path
import json, math, unittest
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
LESSONS=ROOT/'stereo-course/merzlyak-10-base/lessons'
EPS=2e-7

def load(group,n):return json.loads((LESSONS/f'research-{group}-{n:03d}.json').read_text())
def scene(group,n):return load(group,n)['visualization']['model']
def points(m):return {n:np.array(p,float) for n,p in m['points'].items()}
def near(a,b=0):return np.linalg.norm(np.asarray(a)-np.asarray(b))<EPS
def col(p,a,b,c):return near(np.cross(p[b]-p[a],p[c]-p[a]))
def plane(p,names):return np.linalg.matrix_rank([p[n]-p[names[0]] for n in names[1:]],tol=EPS)<=2
def dist(p,a,b):return np.linalg.norm(p[b]-p[a])
def par(p,a,b,c,d):return near(np.cross(p[b]-p[a],p[d]-p[c]))
def skew(p,a,b,c,d):return abs(np.dot(p[c]-p[a],np.cross(p[b]-p[a],p[d]-p[c])))>EPS

def line_distance(a,b,c,d):
 u=b-a;v=d-c;n=np.cross(u,v);return abs(np.dot(c-a,n))/np.linalg.norm(n)

class SupplementaryModels(unittest.TestCase):
 def test_all_metadata_views_and_planarity(self):
  cov=json.loads((ROOT/'tools/merzlyak-10-base/coverage-supplementary.json').read_text());self.assertEqual(len(cov['entries']),13)
  for group,total in [('sections',6),('skew-lines',7)]:
   for n in range(1,total+1):
    d=load(group,n);m=d['visualization']['model'];p=points(m)
    with self.subTest(group=group,n=n):
     self.assertEqual(d['status'],'draft');self.assertEqual(d['review'],dict(source='pending',mathematics='pending',pedagogy='pending'))
     self.assertEqual(d['source']['exercise'],f'{group}-{n}');self.assertEqual(d['source']['collection'],'research')
     self.assertEqual(d['source']['printedPages'],[30 if group=='sections' else 142]);self.assertEqual(d['source']['pdfPages'],[31 if group=='sections' else 143])
     for q in p.values():self.assertTrue(q.shape==(3,) and np.isfinite(q).all())
     for ns in m.get('faces',[]):self.assertTrue(plane(p,ns))
     for v in m['views'].values():
      names=set(v.get('points',[])+v.get('polygon',[]))
      for ns in v.get('segments',[]):names.update(ns)
      self.assertTrue(names<=set(p));self.assertLessEqual(len([x for x in names if not x.startswith('_')]),8)
      if 'polygon' in v:
       self.assertTrue(plane(p,v['polygon']))
       self.assertEqual(np.linalg.matrix_rank([p[n]-p[v['polygon'][0]] for n in v['polygon'][1:]],tol=EPS),2)
     for s in d['steps']:self.assertIn(s.get('view','neutral'),m['views'])

 def test_sections_incidence_and_ratios(self):
  p=points(scene('sections',1))
  for x,a,b in [('M','A','D'),('N','A','C'),('K','C','B'),('X','N','M'),('X','C','D'),('Y','N','K'),('Y','A','B'),('Z','X','K'),('Z','M','Y'),('Z','B','D')]:self.assertTrue(col(p,a,b,x),(1,x,a,b))
  m=scene('sections',2);p=points(m)
  for x,a,b in [('M','A','B'),('N','B','C'),('P','C','C1'),('Q','C1','D1'),('R','D1','A1'),('S','A1','A')]:self.assertTrue(near(p[x],(p[a]+p[b])/2))
  self.assertTrue(plane(p,list('MNPQRS')))
  for a,b in [('M','Q'),('N','R'),('P','S')]:self.assertTrue(near(p['O'],(p[a]+p[b])/2))
  self.assertTrue(par(p,'M','N','O','P'))
  for n in 'MNPQRS':self.assertTrue(near(np.dot(p[n],[1,-1,1]),.5))
  p=points(scene('sections',3));self.assertTrue(near(dist(p,'A','X')/dist(p,'X','A1'),dist(p,'B','Y')/dist(p,'Y','B1')));self.assertTrue(par(p,'X','Y','A','B'));self.assertTrue(par(p,'U','V','A','B'))
  for x,a,b,c,d in [('U','C1','X','A','C'),('V','C1','Y','B','C')]:self.assertTrue(col(p,a,b,x) and col(p,c,d,x))
  p=points(scene('sections',4));self.assertTrue(near(dist(p,'A','X'),2*dist(p,'X','B')));self.assertTrue(near(p['T'],(p['A1']+p['D1'])/2))
  self.assertTrue(near(dist(p,'A','Y')/dist(p,'Y','A1'),2/3));self.assertTrue(near(dist(p,'A','V')/dist(p,'V','A1'),1/3))
  self.assertTrue(plane(p,['X','Y','C1','T']));self.assertTrue(plane(p,['X','V','E1','T']))
  self.assertTrue(col(p,'F','T','E1') and col(p,'F','X','V'));self.assertTrue(near(dist(p,'A1','F'),2*dist(p,'A','B')))
  self.assertTrue(near(p['E'],[2,1,0]));self.assertTrue(near(p['E1']-p['E'],p['A1']-p['A']))
  p=points(scene('sections',5));self.assertTrue(near(p['M'],(p['A1']+p['D1'])/2));self.assertTrue(near(p['N'],(p['C']+p['C1'])/2));self.assertTrue(near(dist(p,'B','P')/dist(p,'P','C'),3))
  self.assertTrue(col(p,'D1','C1','U') and par(p,'T','U','A1','D1'));self.assertTrue(near(dist(p,'Q','C1'),1/3));self.assertTrue(near(dist(p,'C','R'),1/3))
  for x,a,b,c,d in [('T','A','N','A1','C1'),('Q','M','T','C1','D1'),('R','N','Q','C','D'),('P','A','R','B','C')]:self.assertTrue(col(p,a,b,x) and col(p,c,d,x))
  p=points(scene('sections',6));self.assertTrue(near(dist(p,'A','C'),12));self.assertTrue(near(p['K'],(p['B']+p['C'])/2));self.assertTrue(near(p['E'],(p['A']+p['K'])/2));self.assertTrue(near(p['F'],(p['D']+p['K'])/2));self.assertTrue(near(p['G'],(p['A']+p['B']+p['D'])/3))
  self.assertTrue(plane(p,['C','P','Q','E','F','G']));self.assertTrue(col(p,'C','P','E'));self.assertTrue(col(p,'C','Q','F'));self.assertTrue(near(dist(p,'A','P')/dist(p,'P','B'),.5))

 def test_complete_plane_cuts(self):
  cases=[(2,['M','N','P'],'section',None),(4,['X','Y','C1'],'section','neutral'),(4,['X','V','E1'],'second-section','trapezoid'),(5,['A','M','N'],'section',None),(6,['E','F','G'],'section',None)]
  for n,abc,view,edgesview in cases:
   m=scene('sections',n);p=points(m);a,b,c=[p[x] for x in abc];normal=np.cross(b-a,c-a);normal/=np.linalg.norm(normal)
   actual=[];edges=m['views'][edgesview]['segments'] if edgesview else m['edges']
   for u,v in edges:
    x,y=p[u],p[v];sx,sy=np.dot(normal,x-a),np.dot(normal,y-a)
    hits=([x] if abs(sx)<EPS else [])+([y] if abs(sy)<EPS else [])
    if sx*sy < -EPS:hits.append(x+sx/(sx-sy)*(y-x))
    for z in hits:
     if not any(near(z,w) for w in actual):actual.append(z)
   verts=[p[x] for x in m['views'][view]['polygon']]
   self.assertEqual(len(actual),len(verts),(n,view));self.assertTrue(all(any(near(z,w) for w in actual) for z in verts))
   turns=[np.dot(np.cross(verts[(i+1)%len(verts)]-verts[i],verts[(i+2)%len(verts)]-verts[(i+1)%len(verts)]),normal) for i in range(len(verts))]
   self.assertTrue(all(t>EPS for t in turns) or all(t<-EPS for t in turns))

 def test_skew_constraints_and_answers(self):
  p=points(scene('skew-lines',1));self.assertTrue(skew(p,'A','C1','A1','B'));self.assertTrue(near(np.dot(p['C1']-p['A'],p['B']-p['A1'])));self.assertTrue(near(np.dot(p['B1']-p['A'],p['B']-p['A1'])));self.assertTrue(near(np.dot(p['H']-p['O'],p['B']-p['A1'])))
  p=points(scene('skew-lines',2));self.assertTrue(skew(p,'A','B','C','D'));self.assertTrue(near(p['P'][2]));self.assertFalse(col(p,'A','B','P'));self.assertGreater(p['C'][2],0);self.assertTrue(near((p['D']-p['C'])[2]))
  p=points(scene('skew-lines',3))
  for a,b,c,d in [('A','B','C','D'),('A','B','E','F'),('C','D','E','F')]:self.assertTrue(skew(p,a,b,c,d))
  self.assertEqual(np.linalg.matrix_rank([p['B']-p['A'],p['D']-p['C'],p['F']-p['E']],tol=EPS),3)
  self.assertTrue(col(p,'A','B','P') and col(p,'C','D','Q') and par(p,'P','Q','E','F'))
  p=points(scene('skew-lines',4))
  for a,b,c,d in [('A','B','A1','D1'),('A','B','C','C1'),('A1','D1','C','C1')]:self.assertTrue(skew(p,a,b,c,d))
  self.assertEqual(np.linalg.matrix_rank([p['B']-p['A'],p['D1']-p['A1'],p['C1']-p['C']],tol=EPS),3)
  for n in 'ABCD':self.assertTrue(near(p[n+'1']-p[n],p['C1']-p['C']))
  p=points(scene('skew-lines',5));self.assertTrue(near(p['M'],(p['D']+p['B'])/2));self.assertTrue(near(p['N'],(p['A']+p['B'])/2));self.assertTrue(near(dist(p,'C','K')/dist(p,'K','D'),.5));self.assertTrue(near(p['P']+p['Q'],2*p['C']))
  self.assertTrue(col(p,'P','R','K'));self.assertTrue(near(dist(p,'C','H'),dist(p,'C','J')))
  d1=line_distance(p['C'],p['N'],p['A'],p['M']);d2=line_distance(p['C'],p['N'],p['B'],p['K']);self.assertTrue(near(d1,d2));self.assertTrue(near(d1,dist(p,'C','H')))
  # Additional asymmetric bases check that the claim is not tied to an isosceles scene.
  for A,B,h in [(np.array([-2.,1,0]),np.array([4.,2,0]),3),(np.array([1.,3,0]),np.array([-4.,2,0]),7),(np.array([-3.,-1,0]),np.array([1.,5,0]),2)]:
   C=np.zeros(3);D=np.array([0.,0,h]);N=(A+B)/2;M=(D+B)/2;K=D/3
   self.assertTrue(near(line_distance(C,N,A,M),line_distance(C,N,B,K)))
  p=points(scene('skew-lines',6));self.assertTrue(col(p,'A','C1','H') and col(p,'A1','B','O'));self.assertTrue(near(np.dot(p['H']-p['O'],p['C1']-p['A'])));self.assertTrue(near(np.dot(p['H']-p['O'],p['B']-p['A1'])));self.assertTrue(near(dist(p,'O','H'),math.sqrt(6)/6))
  m=scene('skew-lines',7);p=points(m)
  for a,b in m['edges']:self.assertTrue(near(dist(p,a,b),2))
  self.assertTrue(near(np.dot(p['N']-p['M'],p['B']-p['A'])));self.assertTrue(near(np.dot(p['N']-p['M'],p['D']-p['C'])));self.assertTrue(near(dist(p,'M','N'),math.sqrt(2)))

if __name__=='__main__':unittest.main()

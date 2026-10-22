#!/usr/bin/env python3
"""Independent read-only review checks for computer activities and five project guides."""
import json,math,unittest
from pathlib import Path
from collections import Counter
import numpy as np
ROOT=Path(__file__).resolve().parents[2];DIR=ROOT/'stereo-course/merzlyak-10-base/lessons'
FILES=sorted(DIR.glob('computer-*.json'))+sorted(DIR.glob('project-*.json'))
DATA={p.name:json.loads(p.read_text())for p in FILES}
def model(name):return DATA[name]['visualization']['model']
def points(name):return {k:np.array(v,dtype=float)for k,v in model(name)['points'].items()}
def norm(v):return np.linalg.norm(v)
def angle(a,b):return math.degrees(math.acos(np.clip(np.dot(a,b)/(norm(a)*norm(b)),-1,1)))
class Review(unittest.TestCase):
 def near(self,a,b=0):self.assertLess(norm(np.asarray(a)-np.asarray(b)),2e-7)
 def test_all_geometry_and_metadata(self):
  self.assertEqual(len(FILES),44)
  for name,d in DATA.items():
   with self.subTest(name=name):
    p=points(name);m=model(name);self.assertEqual(d['source']['printedPages'],[x-1 for x in d['source']['pdfPages']]);self.assertEqual(d['status'],'draft');self.assertEqual(set(d['review'].values()),{'pending'})
    for v in p.values():self.assertEqual(v.shape,(3,));self.assertTrue(np.isfinite(v).all())
    for edge in m.get('edges',[]):self.assertGreater(norm(p[edge[1]]-p[edge[0]]),1e-8)
    polygons=list(m.get('faces',[]))
    for view in m['views'].values():
     self.assertTrue(set(view)<={'label','segments','polygon','points'},'unsupported view key')
     for a,b in view.get('segments',[]):self.assertGreater(norm(p[b]-p[a]),1e-8)
     for x in view.get('points',[]):self.assertIn(x,p)
     if 'polygon'in view:polygons.append(view['polygon'])
    for poly in polygons:
     self.assertGreaterEqual(len(poly),3);q=[p[x]for x in poly];n=next((np.cross(q[i]-q[0],q[j]-q[0])for i in range(1,len(q))for j in range(i+1,len(q))if norm(np.cross(q[i]-q[0],q[j]-q[0]))>1e-8),None);self.assertIsNotNone(n)
     for x in q:self.near(np.dot(x-q[0],n))
    for s in d['steps']:self.assertIn(s['view'],m['views'])
 def test_copied_exercise_models(self):
  cases=[('computer-01-%02d.json'%(q+1),'ex-01-%03d.json'%q)for q in range(1,5)]+[('computer-03-%02d.json'%(q-2),'ex-03-%03d.json'%q)for q in [3,4,5]]+[('computer-09-%02d.json'%q,'ex-09-019-%d.json'%q)for q in range(1,7)]
  for computer,main in cases:
   old=json.loads((DIR/main).read_text());self.assertEqual(DATA[computer]['visualization'],old['visualization'])
   for a,b in zip(DATA[computer]['steps'][1:-1],old['steps']):self.assertEqual((a['explanation'],a['view']),(b['explanation'],b['view']))
  for name in ['computer-09-01.json','computer-09-02.json']:
   p=points(name);self.near(p['O'],(p['A']+p['B'])/2)
  p=points('computer-09-06.json');self.near(norm(p['B']-p['A']),norm(p['C']-p['B']));self.near(np.dot(p['B']-p['A'],p['C']-p['B']))
 def test_projection_models_and_claims(self):
  p=points('computer-08-01.json');self.near(np.dot(p['U']-p['O'],p['V']-p['O']));self.near(p['U'][:2],p['V'][:2]);self.near(p['H'],[1,0,0])
  for name,cone in [('computer-07-02.json',False),('computer-07-03.json',True),('computer-10-01.json',False),('computer-10-02.json',True),('project-4.json',True)]:
   p=points(name);self.near(p['O'],[0,0,0]);self.near(p['H'],[0,0,3])
   for i in range(16):self.near(norm(p['B'+str(i)][:2]),2);self.near(p['B'+str(i)][2],0)
   if not cone:
    for i in range(16):self.near(p['T'+str(i)]-p['B'+str(i)],[0,0,3])
  # Independent reconstruction of the two inverse-projection examples at phi=60°.
  square=np.array([[0.,0.],[1,0],[1,1],[0,1]]);rect=square@np.diag([1,2]);r=np.array([[1,-1],[1,1]])/math.sqrt(2);inverse=r@np.diag([1,2])@r.T;rhomb=square@inverse
  side=[rhomb[(i+1)%4]-rhomb[i]for i in range(4)]
  for x in side:self.near(norm(x),math.sqrt(2.5))
  self.assertGreater(abs(np.dot(side[0],side[1])),1e-8);self.near(norm(rect[1]-rect[0]),1);self.near(norm(rect[2]-rect[1]),2)
  for name in ['computer-16-02.json','computer-17-02.json']:
   p=points(name);self.near(p['A1'][:2],p['H'][:2]);self.near(p['H'][2],0);self.assertGreater(norm(p['A1']-p['A']),norm(p['A1']-p['H']))
 def test_all_five_exact_cube_sections(self):
  cuts={'triangle':([1,1,1],.5,3),'square':([0,0,1],.5,4),'diagonal':([1,-1,0],0,4),'pentagon':([1,1,2],1.5,5),'hexagon':([1,1,1],1.5,6)}
  for filename in ['computer-03-04.json','computer-16-03.json']:
   p=points(filename);m=model(filename)
   for a,b in m['edges']:self.near(norm(p[b]-p[a]),1)
   for view,(normal,d,count)in cuts.items():
    n=np.array(normal,dtype=float);actual=[]
    for u,v in m['edges']:
     x,y=p[u],p[v];sx=np.dot(n,x)-d;sy=np.dot(n,y)-d;hits=[]
     if abs(sx)<1e-9:hits.append(x)
     if abs(sy)<1e-9:hits.append(y)
     if sx*sy<0:hits.append(x+sx/(sx-sy)*(y-x))
     for hit in hits:
      if not any(norm(hit-q)<1e-8 for q in actual):actual.append(hit)
    names=m['views'][view]['polygon'];verts=[p[x]for x in names];self.assertEqual(len(verts),count);self.assertEqual(len(actual),count)
    for x in verts:self.near(np.dot(n,x),d);self.assertTrue(any(norm(x-q)<1e-8 for q in actual));self.assertTrue(np.all(x>=-1e-9)and np.all(x<=1+1e-9))
    turns=[np.dot(n,np.cross(verts[(i+1)%count]-verts[i],verts[(i+2)%count]-verts[(i+1)%count]))for i in range(count)]
    self.assertTrue(all(t>1e-8 for t in turns)or all(t< -1e-8 for t in turns))
 def test_lattice_and_regular_tetrahedron(self):
  p=points('project-1.json');self.assertEqual(len(p),27);shell=Counter(round(float(np.dot(v,v)),8)for v in p.values());self.assertEqual(shell,Counter({0:1,1:6,2:12,3:8}))
  for a,b in model('project-1.json')['edges']:self.near(norm(p[b]-p[a]),1)
  p=points('project-2.json')
  for a,b in [('A','B'),('B','C'),('C','A'),('S','A'),('S','B'),('S','C')]:self.near(norm(p[b]-p[a]),1)
  self.near(p['M'],(p['A']+p['B'])/2);self.near(np.dot(p['S']-p['O'],p['B']-p['A']));self.near(np.dot(p['S']-p['O'],p['C']-p['A']))
  u=p['S']-p['M'];v=p['O']-p['M'];self.near(np.dot(u,v)/(norm(u)*norm(v)),1/3)
  volume=abs(np.dot(p['S']-p['A'],np.cross(p['B']-p['A'],p['C']-p['A'])))/6;self.near(volume,math.sqrt(2)/12)
 def test_trihedral_full_proof_model(self):
  p=points('project-3.json')
  for a,b,deg in [('A','B',100),('A','C',80),('B','C',70)]:self.near(angle(p[a]-p['O'],p[b]-p['O']),deg)
  self.near(np.cross(p['D']-p['A'],p['B']-p['A']));self.near(norm(p['C']-p['O']),norm(p['D']-p['O']));self.near(angle(p['A'],p['D']),80);self.near(norm(p['A']-p['C']),norm(p['A']-p['D']))
  self.assertLess(norm(p['B']-p['D']),norm(p['B']-p['C']));self.assertGreater(abs(np.dot(p['C'],np.cross(p['A'],p['B']))),1e-8)
  sums=0
  for x,y,z in [('A','B','C'),('B','C','A'),('C','A','B')]:
   t=angle(p['O']-p[x],p[y]-p[x])+angle(p['O']-p[x],p[z]-p[x]);self.assertGreater(t,angle(p[y]-p[x],p[z]-p[x]));sums+=t
  self.near(sums+100+80+70,540);self.assertGreater(sums,180)
 def test_regular_polyhedron_and_truncation_counts(self):
  p=points('project-5.json');m=model('project-5.json');self.assertEqual((len(p),len(m['edges']),len(m['faces'])),(6,12,8));counts=Counter()
  for face in m['faces']:
   for a,b in zip(face,face[1:]+face[:1]):self.near(norm(p[a]-p[b]),math.sqrt(2));counts[tuple(sorted((a,b)))]+=1
  self.assertEqual(set(counts.values()),{2});self.assertEqual(len(p)-len(counts)+len(m['faces']),2)
  regular=points('project-2.json');base=list('ABCS');new={a+b:(2*regular[a]+regular[b])/3 for a in base for b in base if a!=b};self.assertEqual(len(new),12)
  for a in base:
   triangle=[a+b for b in base if b!=a]
   for x,y in zip(triangle,triangle[1:]+triangle[:1]):self.near(norm(new[x]-new[y]),1/3)
  for face in ['ABC','ABS','BCS','CAS']:
   a,b,c=face;hexagon=[a+b,b+a,b+c,c+b,c+a,a+c]
   for x,y in zip(hexagon,hexagon[1:]+hexagon[:1]):self.near(norm(new[x]-new[y]),1/3)
  self.assertEqual(12-18+8,2)
if __name__=='__main__':unittest.main(verbosity=2)

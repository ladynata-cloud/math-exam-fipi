#!/usr/bin/env python3
"""Author checks for all 27 new §§10–19 theory models; no release-status changes."""
import json, math, unittest
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[2]; DIR=ROOT/'stereo-course/merzlyak-10-base/lessons'
COVER=json.loads((ROOT/'tools/merzlyak-10-base/coverage-theory-10-19.json').read_text())
CARDS={tuple(map(int,(d['source']['point'],p.stem.split('-')[-1]))):d for p in DIR.glob('theory-*-detail-*.json') if 10<=int(p.stem.split('-')[1])<=19 for d in [json.loads(p.read_text())]}
def pts(n,k):return {name:np.array(x,dtype=float)for name,x in CARDS[n,k]['visualization']['model']['points'].items()}
def vec(p,a,b):return p[b]-p[a]
def length(p,a,b):return np.linalg.norm(vec(p,a,b))
def cross(p,a,b,c):return np.cross(vec(p,a,b),vec(p,a,c))
def area(p,names):return np.linalg.norm(sum((np.cross(p[a],p[b])for a,b in zip(names,names[1:]+names[:1])),np.zeros(3)))/2
def cosangle(p,a,o,b):return np.dot(vec(p,o,a),vec(p,o,b))/(length(p,o,a)*length(p,o,b))
class Models(unittest.TestCase):
 def near(self,a,b=0):self.assertLess(np.linalg.norm(np.asarray(a)-np.asarray(b)),1e-8)
 def perp(self,p,a,b,c,d):self.near(np.dot(vec(p,a,b),vec(p,c,d)))
 def parallel(self,p,a,b,c,d):self.near(np.cross(vec(p,a,b),vec(p,c,d)))
 def polygon(self,p,names):
  self.assertGreaterEqual(len(names),3);self.assertEqual(len(set(names)),len(names))
  n=next((cross(p,names[0],names[i],names[j])for i in range(1,len(names))for j in range(i+1,len(names))if np.linalg.norm(cross(p,names[0],names[i],names[j]))>1e-8),None)
  self.assertIsNotNone(n)
  for name in names:self.near(np.dot(p[name]-p[names[0]],n))
  self.assertGreater(area(p,names),1e-8)
 def test_all_references_geometry_and_coverage(self):
  self.assertEqual(len(CARDS),27);self.assertEqual(COVER['counts']['newDetailCards'],27)
  for (n,k),d in CARDS.items():
   with self.subTest(n=n,k=k):
    m=d['visualization']['model'];p=pts(n,k);self.assertEqual(d['status'],'draft');self.assertEqual(set(d['review'].values()),{'pending'})
    self.assertEqual(d['source']['printedPages'],[x-1 for x in d['source']['pdfPages']]);self.assertEqual(d['source']['collection'],'theory');self.assertEqual(d['source']['chapter'],'Глава 3. Перпендикулярность в пространстве' if n<16 else 'Глава 4. Многогранники')
    for x in p.values():self.assertEqual(x.shape,(3,));self.assertTrue(np.all(np.isfinite(x)))
    for a,b in m['edges']:self.assertGreater(length(p,a,b),1e-8)
    for face in m['faces']:self.polygon(p,face)
    for view in m['views'].values():
     for a,b in view.get('segments',[]):self.assertGreater(length(p,a,b),1e-8)
     if 'polygon'in view:self.polygon(p,view['polygon'])
     for x in view.get('points',[]):self.assertIn(x,p)
     self.assertLessEqual(len(set(m.get('labelNames',[])+view.get('points',[]))),8)
    for step in d['steps']:self.assertIn(step['view'],m['views'])
  for entry in COVER['entries']:
   self.assertEqual(len(entry['requiredParts']),1+len(entry['newLessonFiles']))
   for filename in entry['newLessonFiles']:self.assertTrue((ROOT/filename).is_file())
  for unit in COVER['units']:
   self.assertTrue(unit['coveredBy'])
   for ref in unit['coveredBy']:self.assertTrue((ROOT/ref['lessonFile']).is_file())
 def test_projection_and_distances(self):
  p=pts(10,1);self.perp(p,'A','D','A','A1');self.perp(p,'A','D','C','D');self.near(length(p,'A','D'),3)
  p=pts(10,2)
  for a in 'ABC':self.near(length(p,'O',a),3);self.near(length(p,'M',a),math.sqrt(13))
  p=pts(10,3)
  for a in 'ABC':self.near(vec(p,a,a+'1'),[0,0,-2])
  p=pts(10,4);self.near(np.cross(p['M']-p['L'],vec(p,'L','R')));self.near(np.cross(p['N']-p['A'],vec(p,'A','B')));self.perp(p,'M','N','L','R');self.perp(p,'M','N','A','B');self.near(length(p,'M','N'),2)
  self.assertGreater(abs(np.dot(p['A']-p['L'],np.cross(vec(p,'L','R'),vec(p,'A','B')))),1e-8)
  for n,k,apex in [(11,1,'M'),(18,2,'D')]:
   p=pts(n,k)
   for foot,a,b in [('N','A','B'),('K','B','C'),('E','C','A')]:
    self.near(np.cross(p[foot]-p[a],p[b]-p[a]));self.perp(p,'O',foot,a,b);self.perp(p,apex,foot,a,b);self.near(length(p,'O',foot),1);self.near(length(p,apex,foot),math.sqrt(5))
  p=pts(12,1);self.near(cosangle(p,'B1','A','B'),math.sqrt(.5))
  p=pts(12,2);self.near(length(p,'O','A'),length(p,'O','B'));self.near(cosangle(p,'M','A','O'),cosangle(p,'M','B','O'))
 def test_dihedral_and_perpendicular_planes(self):
  p=pts(13,1)
  for a,o in [('A','O'),('B','O'),('A1','O1'),('B1','O1')]:self.perp(p,o,a,'L','R')
  self.near(vec(p,'O','A'),vec(p,'O1','A1'));self.near(vec(p,'O','B'),vec(p,'O1','B1'));self.near(cosangle(p,'A','O','B'),-.5)
  p=pts(13,2);self.perp(p,'D','A','D','D1');self.perp(p,'D','C','D','D1');self.near(cosangle(p,'A','D','C'),0)
  p=pts(13,3)
  for a,b,value in [('A','B',16),('A','D',17),('B','D',17),('A','C',10),('B','C',10),('C','D',3*math.sqrt(39)),('C','M',6),('D','M',15)]:self.near(length(p,a,b),value)
  self.near(cosangle(p,'C','M','D'),-.5)
  p=pts(13,4);self.near(length(p,'M','B'),4);self.near(length(p,'A','C'),6);self.near(length(p,'M','C'),10);self.near(length(p,'A','M'),8);self.near(cosangle(p,'M','A','B'),math.sqrt(3)/2);self.perp(p,'A','M','A','C')
  p=pts(14,1);self.perp(p,'A','A1','A','B');self.perp(p,'A','A1','A','D')
  p=pts(14,2);self.perp(p,'O','A','L','R');self.perp(p,'O','A','O','B');self.perp(p,'L','R','O','B')
  p=pts(14,3)
  for a,b,value in [('A','D',20),('C','D',13),('B','D',12),('A','B',16),('B','C',5),('A','C',19),('B','E',40*math.sqrt(3)/19)]:self.near(length(p,a,b),value)
  self.near(cosangle(p,'A','B','C'),-.5);self.perp(p,'B','E','A','C');self.perp(p,'B','E','B','D');self.near(area(p,['A','B','C']),20*math.sqrt(3))
 def test_area_projection_and_polyhedra(self):
  p=pts(15,1)
  for a in 'ABCM':self.near(p[a+'1'][:2],p[a][:2]);self.near(p[a+'1'][2],0)
  self.near(np.cross(p['M']-p['B'],p['C']-p['B']));self.near(vec(p,'A','M')[1:],0);self.near(area(p,['A1','B1','C1'])/area(p,['A','B','C']),1/math.sqrt(2))
  self.near(area(p,['A','B','C']),area(p,['A','B','M'])+area(p,['A','M','C']))
  p=pts(16,1);self.assertGreater(abs(np.dot(p['C1']-p['A'],cross(p,'A','B','C'))),1e-8)
  p=pts(16,2);self.near(p['X'],(p['A']+p['I'])/2);self.assertGreater(abs(p['X'][0]),1)
  faces=CARDS[16,2]['visualization']['model']['faces'];self.assertEqual(len(faces),10);counts={}
  for face in faces:
   for a,b in zip(face,face[1:]+face[:1]):key=tuple(sorted((a,b)));counts[key]=counts.get(key,0)+1
   normals=[np.cross(p[face[(i+1)%4]]-p[face[i]],p[face[(i+2)%4]]-p[face[(i+1)%4]])for i in range(4)]
   for normal in normals[1:]:self.assertGreater(np.dot(normals[0],normal),0)
  self.assertEqual(set(counts.values()),{2});self.assertLess((p['A'][1]+p['A'][2]+1)*(p['K'][1]+p['K'][2]+1),0)
  p=pts(16,3);self.near(vec(p,'A','A1'),vec(p,'C','C1'));self.near(vec(p,'A','C'),vec(p,'A1','C1'))
  p=pts(16,4);w=vec(p,'A','A1');side_area=sum(area(p,f)for f in CARDS[16,4]['visualization']['model']['faces'][2:])
  for a,name in [('A','M'),('B','P'),('C','N')]:
   t=np.dot(p[name]-p[a],w)/np.dot(w,w);self.assertGreater(t,0);self.assertLess(t,1);self.near(p[name],p[a]+t*w)
  self.perp(p,'A','A1','M','P');self.perp(p,'A','A1','P','N');perim=sum(length(p,a,b)for a,b in [('M','P'),('P','N'),('N','M')]);self.near(side_area,np.linalg.norm(w)*perim)
  for k,names in [(5,list('ABC')),(6,list('ABCDEF'))]:
   p=pts(16,k);sides=[length(p,a,b)for a,b in zip(names,names[1:]+names[:1])]
   for x in sides:self.near(x,sides[0])
   for a in names:self.near(vec(p,a,a+'1'),[0,0,3])
   angles=[cosangle(p,names[i-1],names[i],names[(i+1)%len(names)])for i in range(len(names))]
   for x in angles:self.near(x,angles[0])
 def test_centres_pyramids_and_frustum(self):
  p=pts(17,1)
  for a,b in [('A','C1'),('B','D1'),('C','A1'),('D','B1')]:self.near(p['O'],(p[a]+p[b])/2)
  self.near(vec(p,'A','D'),vec(p,'B1','C1'));self.near(vec(p,'A','B1'),vec(p,'D','C1'))
  p=pts(18,1)
  for a in 'ABC':self.near(length(p,'D',a),math.sqrt(9+16/3))
  for foot,a,b in [('M','B','C'),('N','C','A'),('K','A','B')]:self.near(p[foot],(p[a]+p[b])/2);self.perp(p,'D',foot,a,b);self.near(length(p,'D',foot),math.sqrt(9+4/3))
  p=pts(18,2);base=area(p,list('ABC'));lateral=sum(area(p,['D',a,b])for a,b in [('A','B'),('B','C'),('C','A')]);self.near(lateral,base*math.sqrt(5))
  p=pts(18,3);self.perp(p,'S','O','A','B');self.perp(p,'S','O','A','D');self.assertGreater(p['O'][0],2);self.polygon(p,['S','A','C'])
  p=pts(18,4)
  for a,b in [('A','B'),('B','C'),('C','A'),('S','A'),('S','B'),('S','C')]:self.near(length(p,a,b),2)
  p=pts(19,1)
  for a in 'ABCD':self.near(p[a+'1'],p['S']+.5*(p[a]-p['S']))
  self.near(length(p,'M','M1'),length(p,'N','N1'));self.near(length(p,'S','M')-length(p,'S','M1'),length(p,'M','M1'));self.perp(p,'M','M1','A','B')
  lateral=sum(area(p,f)for f in CARDS[19,1]['visualization']['model']['faces'][2:]);self.near(lateral,(16+8)*math.sqrt(5)/2)
if __name__=='__main__':unittest.main(verbosity=2)

#!/usr/bin/env python3
"""Read-only checks of the thirteen supplemental-article models and coverage."""
import json,math,unittest
from review_state import assert_review_state
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'stereo-course/merzlyak-10-base/lessons'

def card(n,k):return json.loads((OUT/f'theory-{n:02}-detail-{k:02}.json').read_text())
def model(n,k):
 m=card(n,k)['visualization']['model'];return m,{a:np.array(v,float)for a,v in m['points'].items()}
def line(p,q,a,b):return np.cross(p[q]-p[a],p[b]-p[a])
class Articles(unittest.TestCase):
 def near(self,a,b=0):self.assertLess(np.linalg.norm(np.asarray(a)-np.asarray(b)),1e-7)
 def test_all_thirteen_models_and_manifest(self):
  coverage=json.loads((ROOT/'tools/merzlyak-10-base/coverage-theory-articles.json').read_text());self.assertEqual(coverage['counts']['newCards'],13)
  for n,ks in[(15,range(2,6)),(19,range(2,11))]:
   for k in ks:
    c=card(n,k);m,p=model(n,k)
    with self.subTest(card=c['id']):
     self.assertEqual(c['source']['pdfPages'],[i+1 for i in c['source']['printedPages']]);assert_review_state(c)
     for q in p.values():self.assertTrue(q.shape==(3,)and np.isfinite(q).all())
     for a,b in m['edges']:self.assertGreater(np.linalg.norm(p[a]-p[b]),1e-8)
     for v in m['views'].values():
      self.assertTrue(set(v)<={'label','segments','polygon','points'})
      names=set(v.get('points',[])+v.get('polygon',[]))
      for a,b in v.get('segments',[]):names.update([a,b]);self.assertGreater(np.linalg.norm(p[a]-p[b]),1e-8)
      self.assertTrue(names<=p.keys());self.assertLessEqual(len([a for a in names if not a.startswith('_')]),8)
     for face in m['faces']+[v['polygon']for v in m['views'].values()if'polygon'in v]:
      a,b,d=[p[x]for x in face[:3]];normal=np.cross(b-a,d-a);self.assertGreater(np.linalg.norm(normal),1e-8)
      for x in face:self.near(np.dot(p[x]-a,normal))
     for s in c['steps']:self.assertIn(s['view'],m['views'])
  ids=set()
  for unit in coverage['units']:
   self.assertNotIn(unit['unitId'],ids);ids.add(unit['unitId'])
   for ref in unit['coveredBy']:
    d=json.loads((ROOT/ref['lessonFile']).read_text());self.assertEqual(d['id'],ref['lessonId'])
  for entry in coverage['entries']:
   n=entry['paragraph'];parts=[json.loads(f.read_text())['source']['subpart']for f in sorted(OUT.glob(f'theory-{n:02}-detail-*.json'))]
   self.assertEqual(entry['requiredParts'],['обзор']+parts)
   self.assertEqual(len(entry['lessonFiles']),len(entry['requiredParts']))
   self.assertEqual(entry['sourcePdfPages'],sorted({page for file in entry['lessonFiles']for page in json.loads((ROOT/file).read_text())['source']['pdfPages']}))
 def test_midpoint_inverse_construction(self):
  _,p=model(15,2)
  for mid,a,b in[('C0','A0','B0'),('U','A','B0'),('V','A0','B'),('C','A','B'),('C2','A2','B2')]:self.near(p[mid],(p[a]+p[b])/2)
  self.near(p['C0']+p['C'],p['U']+p['V'])
  self.near(line(p,'A0','A','A2'));self.near(line(p,'B0','B','B2'))
  for a in['C','C2','C0','U','V']:self.near(p[a][2],1)
  for u in[-3,.2,2,7]:
   for v in[-2,0,1,9]:
    a=np.array([2*u,0,2.]);b=np.array([0,2*v,0.]);self.near((a+b)/2,[u,v,1])
 def test_minimum_and_cube_two_solutions(self):
  _,p=model(15,3);self.near(np.linalg.norm(p['M']-p['N']),2);self.near(np.linalg.norm(p['P']-p['H']),2)
  self.assertGreater(np.linalg.norm(p['P']-p['Q']),2)
  _,p=model(15,4);diagonal=p['D1']-p['B']
  for x,t in[('P',1/3),('Q',2/3)]:self.near(p[x],p['B']+t*diagonal)
  self.near(line(p,'P','N','C'));self.near(line(p,'Q','A1','M'))
  for face in[['A','C','B1'],['A1','C1','D']]:
   for a,b in zip(face,face[1:]):self.near(np.dot(diagonal,p[b]-p[a]))
  self.near(np.linalg.norm(p['P']-p['Q']),math.sqrt(3))
  _,p=model(15,5);self.near(line(p,'P','B1','C'));self.near(line(p,'Q','A1','C1'))
  for a,b in[('B1','C'),('A1','C1')]:self.near(np.dot(p['Q']-p['P'],p[b]-p[a]))
  self.near(np.linalg.norm(p['P']-p['Q']),math.sqrt(3));self.near(np.linalg.norm(p['K']-p['H']),math.sqrt(3));self.near(np.dot(p['K']-p['H'],p['C1']-p['M']))
  self.near(np.linalg.norm(p['M']-p['C1']),3*math.sqrt(6)/2)
 def test_topological_model_witnesses_and_radius_margins(self):
  _,p=model(19,7);self.near(np.linalg.norm(p['X']-p['O']),2)
  self.assertLess(np.linalg.norm(p['X']-p['O'])+.5,3)
  self.assertGreater(np.linalg.norm(line(p,'Z','A','B')),0)
  for q in[p[k]for k in p if k.startswith('_inner_')]:self.near(np.linalg.norm(q-p['X']),.5);self.assertLess(np.linalg.norm(q-p['O']),3)
  _,p=model(19,8);self.near(np.linalg.norm(p['A']-p['O']),5)
  for q in[p[k]for k in p if k.startswith('_outside_')]:self.near(np.linalg.norm(q-p['A']),1);self.assertGreater(np.linalg.norm(q-p['O']),3)
  self.near(line(p,'X','P','Q'));self.assertTrue(p['P'][0]<p['X'][0]<p['Q'][0])
  _,p=model(19,9);self.near(np.linalg.norm(p['O1']-p['O']),4);self.near(np.linalg.norm(p['A']-p['O']),1)
  self.assertLess(np.linalg.norm(p['I']-p['O']),1);self.assertGreater(np.linalg.norm(p['E']-p['O']),1)
  _,p=model(19,10);self.near(np.linalg.norm(p['A']-p['O']),1);self.near(np.linalg.norm(p['B']-p['O1']),1)
  self.near(line(p,'X','A','B'));self.assertGreater(np.linalg.norm(line(p,'Y','A','B')),0)
  for center in['O','O1']:self.assertGreater(np.linalg.norm(p['Y']-p[center]),1)
if __name__=='__main__':unittest.main()

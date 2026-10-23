"""Independent numerical checks of §3 source constraints and plane sections.

Uses only the authored JSON and Python's standard library; does not import the
authoring generator. These checks do not replace source/pedagogical review.
"""
import json
import math
from pathlib import Path
import unittest
from collections import Counter
from review_state import assert_review_state

ROOT=Path(__file__).resolve().parents[2]
LESSONS=ROOT/'stereo-course/merzlyak-10-base/lessons'
EPS=2e-7
def sub(a,b):return [x-y for x,y in zip(a,b)]
def add(a,b):return [x+y for x,y in zip(a,b)]
def scale(a,s):return [x*s for x in a]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def norm(a):return math.sqrt(dot(a,a))
def distance(a,b):return norm(sub(a,b))
def load(suffix):return json.loads((LESSONS/f'ex-03-{suffix}.json').read_text())
def scene(suffix):return load(suffix)['visualization']['model']
def on_line(p,a,b):return norm(cross(sub(p,a),sub(b,a)))<=EPS*max(1,norm(sub(b,a)))
def in_plane(p,a,b,c):return abs(dot(cross(sub(b,a),sub(c,a)),sub(p,a)))<=EPS*max(1,norm(cross(sub(b,a),sub(c,a))))
def area(a,b,c):return norm(cross(sub(b,a),sub(c,a)))/2

class ParagraphThree(unittest.TestCase):
    def test_all_cards_and_references(self):
        files=list(LESSONS.glob('ex-03-*.json'))
        self.assertEqual(len(files),36)
        for path in files:
            d=json.loads(path.read_text());m=d['visualization']['model'];p=m['points']
            with self.subTest(file=path.name):
                assert_review_state(d)
                self.assertEqual(d['source']['chapter'],'Глава 1. Введение в стереометрию')
                self.assertEqual(d['source']['pdfPages'],[x+1 for x in d['source']['printedPages']])
                for q in p.values():self.assertTrue(len(q)==3 and all(math.isfinite(x) for x in q))
                for collection in ('edges','faces','arrows'):
                    for group in m.get(collection,[]):self.assertTrue(set(group)<=set(p))
                for v in m['views'].values():
                    names=set(v.get('points',[])+v.get('polygon',[]))
                    for seg in v.get('segments',[]):names.update(seg)
                    self.assertTrue(names<=set(p))
                    self.assertLessEqual(len([n for n in names if not n.startswith('_')]),8)
                for step in d['steps']:self.assertIn(step.get('view','neutral'),m['views'])
        self.assertEqual([load('007-'+s)['source']['subpart'] for s in ('a','b')],['1','2'])
        self.assertEqual([load('009-'+s)['source']['subpart'] for s in ('a','b','c','d')],['а','б','в','г'])

    def test_sections_are_complete_plane_cuts(self):
        cases={
          '003':('A','S','D'),'004':('S','M','D'),
          '007-a':('A','C','B1'),'007-b':('B','D','C1'),'008':('A','B','C1'),
          '009-a':('E','F','M'),'009-b':('E','F','M'),'009-c':('E','F','M'),'009-d':('E','F','M'),
          '010':('D','E','C1'),'011':('A','E','D'),
          '019':('E','F','M'),'020':('E','B1','F'),'021':('E','F','K'),
          '022':('M','N','K'),'023':('M','N','K'),'026':('E','F','K'),
          '027':('B','A1','E'),'029':('M','N','K')}
        for suffix,three in cases.items():
            m=scene(suffix);p=m['points'];a,b,c=[p[n] for n in three];normal=cross(sub(b,a),sub(c,a))
            with self.subTest(exercise=suffix):
                self.assertGreater(norm(normal),EPS)
                cut=[]
                for u,v in m['edges']:
                    x,y=p[u],p[v];sx,sy=dot(normal,sub(x,a)),dot(normal,sub(y,a))
                    if abs(sx)<EPS:cut.append(x)
                    if abs(sy)<EPS:cut.append(y)
                    if sx*sy < -EPS:cut.append(add(x,scale(sub(y,x),sx/(sx-sy))))
                unique=[]
                for x in cut:
                    if not any(distance(x,y)<EPS for y in unique):unique.append(x)
                polygon=[p[n] for n in m['views']['section']['polygon']]
                self.assertEqual(len(unique),len(polygon))
                for x in polygon:
                    self.assertTrue(any(distance(x,y)<EPS for y in unique))
                    self.assertTrue(in_plane(x,a,b,c))
                # Each consecutive side belongs to an actual solid face.
                for i,x in enumerate(polygon):
                    y=polygon[(i+1)%len(polygon)]
                    self.assertTrue(any(in_plane(x,*[p[n] for n in f[:3]]) and in_plane(y,*[p[n] for n in f[:3]]) for f in m['faces']))

    def test_auxiliary_intersections(self):
        cases={
          '005':[('X','M','K','A','B')], '006':[('X','M','K','A','C')],
          '010':[('X','D','E','A','B'),('H','D','C1','A','A1')],
          '011':[('H','E','D','B1','C1'),('J','A','D','A1','C1')],
          '012':[('U','S','M','A','B'),('V','S','K','B','C'),('X','M','K','U','V')],
          '013':[('U','S','M','A','B'),('V','S','K','C','D'),('X','M','K','U','V')],
          '014':[('X','A','B','C','D')], '015':[('X','A','E','B','C')],
          '017':[('X','C','K','A','B')], '018':[('X','M','K','B','C')],
          '019':[('X','E','F','B','C'),('Y','E','F','C','D'),('R','X','M','B','B1'),('Q','Y','M','D','D1')],
          '020':[('X','E','B1','A','B'),('Y','B1','F','B','C'),('P','X','Y','A','D'),('Q','X','Y','C','D')],
          '021':[('X','E','F','B','C'),('Y','F','K','C','D'),('Z','X','Y','A','B'),('L','Z','E','A','A1')],
          '022':[('X','K','N','B','C'),('P','M','X','A','C')],
          '023':[('X','M','K','A','C'),('P','N','X','A','D')],
          '024':[('X','E','K','A','M'),('Y','F','K','B','M')],
          '025':[('X','A','C','B','D'),('Y','C','E','B','F')],
          '026':[('P','E','F','B','C'),('N','E','K','A','B'),('R','P','N','C','D')],
          '027':[('F','B','E','B1','C1'),('G','A1','F','C1','D1')],
          '029':[('X','M','N','U','V'),('Y','M','K','U','W'),('Z','X','Y','A','B'),('P','Z','M','A','D'),('Q','Z','M','B','D'),('L','X','Y','B','C'),('H','X','Y','C','A')],
          '030':[('P','A','B','A1','B1'),('Q','B','C','B1','C1'),('R','C','D','C1','D1')]}
        for suffix,items in cases.items():
            p=scene(suffix)['points']
            for x,a,b,c,d in items:
                with self.subTest(exercise=suffix,point=x):
                    self.assertTrue(on_line(p[x],p[a],p[b]))
                    self.assertTrue(on_line(p[x],p[c],p[d]))

    def test_cross_has_thirty_equal_square_faces(self):
        m=scene('028');p=m['points'];self.assertEqual(len(m['faces']),30);edges=Counter()
        for f in m['faces']:
            self.assertEqual(len(f),4)
            for i,n in enumerate(f):
                a,b,c=p[n],p[f[(i+1)%4]],p[f[(i+2)%4]]
                self.assertAlmostEqual(distance(a,b),1)
                self.assertAlmostEqual(dot(sub(a,b),sub(c,b)),0)
                edges[tuple(sorted([n,f[(i+1)%4]]))]+=1
        self.assertTrue(all(n==2 for n in edges.values()))
        self.assertEqual(len(p)-len(edges)+len(m['faces']),2)

    def test_impossible_drawing_and_review_answers(self):
        p=scene('030')['points']
        self.assertFalse(on_line(p['R'],p['P'],p['Q']))
        self.assertGreater(p['P'][1],p['B'][1]);self.assertGreater(p['Q'][0],p['C'][0]);self.assertLess(p['R'][1],p['D'][1])
        p=scene('031')['points']
        self.assertAlmostEqual(distance(p['A'],p['B']),distance(p['B'],p['C']))
        self.assertAlmostEqual(distance(p['A'],p['C']),distance(p['A'],p['D']))
        angle=math.degrees(math.acos(dot(sub(p['B'],p['A']),sub(p['D'],p['A']))/(distance(p['A'],p['B'])*distance(p['A'],p['D']))))
        self.assertAlmostEqual(angle,72)
        p=scene('032')['points']
        self.assertAlmostEqual(area(p['E'],p['B'],p['F'])/area(p['A'],p['B'],p['C']),4/9)

if __name__=='__main__':unittest.main()

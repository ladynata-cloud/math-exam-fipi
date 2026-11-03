#!/usr/bin/env python3
"""Independent numerical/source regressions for chapter IX795–823.
Reads generated artifacts; does not import author generators or grant release.
General families below check theorem boundary cases as well as stored diagrams.
"""
import json,math,unittest
from pathlib import Path
from check_models import validate
ROOT=Path(__file__).resolve().parents[2]
COURSE=ROOT/'geometry-course/textbook'
PREP=json.loads((COURSE/'preparation/chapter-09-c.json').read_text())
ROWS=json.loads((COURSE/'models/chapter-09-c.json').read_text())['models']
P={(e['number'],p['part']):p for e in PREP['exercises'] for p in e['parts']}
M={(m['number'],m['part']):m['model'] for m in ROWS}
def length(p,a,b):return math.dist(p[a][:2],p[b][:2])
def vec(p,a,b):return [p[b][i]-p[a][i] for i in (0,1)]
def dot(u,v):return sum(a*b for a,b in zip(u,v))
def angle(p,a,o,b):
 u,v=vec(p,o,a),vec(p,o,b)
 return math.degrees(math.atan2(abs(u[0]*v[1]-u[1]*v[0]),dot(u,v)))
def distance_line(p,o,a,b):
 u,v=vec(p,a,b),vec(p,a,o)
 return abs(u[0]*v[1]-u[1]*v[0])/math.hypot(*u)
def area(p,names):
 return abs(sum(p[a][0]*p[b][1]-p[a][1]*p[b][0] for a,b in zip(names,names[1:]+names[:1])))/2
def subscene(p,suffix):return {k.removesuffix(suffix):v for k,v in p.items() if k.endswith(suffix)}
class IndependentC(unittest.TestCase):
 def close(self,a,b):self.assertAlmostEqual(a,b,delta=1e-6*max(1,abs(a),abs(b)))
 def perpendicular(self,p,a,b,c,d):self.close(dot(vec(p,a,b),vec(p,c,d)),0)
 def cyclic(self,p,names,center):
  r=length(p,center,names[0])
  for n in names[1:]:self.close(length(p,center,n),r)
 def test_source_inventory_all32_and_coordinate_contract(self):
  expected={(n,s) for n in range(795,824) for s in (['а','б'] if n in [797,798,802] else ['single'])}
  self.assertEqual(set(P),expected);self.assertEqual(set(M),expected);self.assertEqual(len(expected),32)
  for e in PREP['exercises']:
   n=e['number'];pages=[209] if n==795 else [210] if n<=801 else [210,211] if n==802 else [211] if n<=806 else [211,212] if n==807 else [212] if n<=811 else [213]
   self.assertEqual(e['printedPages'],pages);self.assertEqual(e['pdfPages'],[x+1 for x in pages])
  for key,m in M.items():
   self.assertEqual(validate(m),[],key)
   self.assertEqual(len(P[key]['steps']),sum(k.startswith('step-') for k in m['views']))
   for v in m['views'].values():
    visible=[k for k in v.get('points',[]) if not k.startswith('_')]
    for i,a in enumerate(visible):
     for b in visible[i+1:]:self.assertGreater(length(m['points'],a,b),1e-6,(key,a,b))
 def test_795_to800_geometric_mean_and_tangent_formulas(self):
  p=M[795,'single']['points'];self.cyclic(p,'ABCD','O')
  for x,a,b in [('M','A','B'),('N','B','C'),('P','C','D'),('Q','D','A')]:
   self.close(length(p,a,x),length(p,x,b));self.perpendicular(p,'O',x,a,b)
  p=M[796,'single']['points'];self.close(angle(p,'P','O','Q'),90)
  self.close(distance_line(p,'O','P','Q'),distance_line(p,'O','U','V'))
  for part in ['а','б']:
   p=M[797,part]['points'];r,R=length(p,'O','A'),length(p,'Q','A')
   self.close(length(p,'M','K'),2*math.sqrt(r*R));self.close(angle(p,'M','A','K'),90)
   self.close(distance_line(p,'O','M','K'),r);self.close(distance_line(p,'Q','M','K'),R)
   p=M[798,part]['points'];r,R=length(p,'Q','K'),length(p,'O','M');d=length(p,'O','Q')
   self.close(length(p,'M','K')**2,d*d-(R-r if part=='а' else R+r)**2)
  p=M[799,'single']['points'];self.close(angle(p,'A','O','B'),angle(p,'A','O','B1'))
  p=M[800,'single']['points'];self.close(length(p,'A','B'),length(p,'C','D'))
 def test_801_and802_two_positions_and_actual_counterexample(self):
  for key in [(801,'single'),(802,'а'),(802,'б')]:
   m=M[key];cases=[m['points'],subscene(m['points'],'__case1')]
   for i,p in enumerate(cases):
    self.cyclic(p,'ABC','O');self.cyclic(p,'ABD','Q');self.close(angle(p,'C','B','D'),60)
    self.close(angle(p,'C','K','D'),120 if i==0 else 60)
    self.perpendicular(p,'O','C','C','K');self.perpendicular(p,'Q','D','D','K')
    if key==(802,'б'):self.cyclic(p,'BCKD','_T')
  self.assertIn('120°',P[802,'а']['steps'][0]);self.assertIn('60°',P[802,'а']['steps'][1])
  self.assertIn('порядок',P[802,'б']['conditionSummary'])
 def test_801_general_rotating_line_family(self):
  a,c,d=3,-2,1.1
  expected=angle({'A':[0,a],'O1':[c,0],'O2':[d,0]},'O1','A','O2')
  for deg in [-80,-55,-20,0,25,60,83]:
   u,v=math.cos(math.radians(deg)),math.sin(math.radians(deg))
   C=[2*(c*u-a*v)*u,a+2*(c*u-a*v)*v];D=[2*(d*u-a*v)*u,a+2*(d*u-a*v)*v]
   p={'B':[0,-a],'C':C,'D':D}
   self.close(angle(p,'C','B','D'),expected)
 def test_803_both_sides_and_midpoint_degeneracy(self):
  p=M[803,'single']['points'];self.close(length(p,'B','C'),length(p,'C','D'))
  self.cyclic(p,'ABD','O');self.cyclic(p,'AOCD','Q')
  for a,h in [(4,3),(2,5),(7,1)]:
   for c in [-.9*a,-.3*a,.2*a,.8*a,0]:
    rr=a*a+h*h;n=[a-c,-(a*c+h*h)/h];norm=dot(n,n)
    A=[-a,h];B=[a,h];C=[c,h];F=[-rr*x/norm for x in n];D=[2*F[i]-A[i] for i in (0,1)]
    if c==0:self.close(math.dist(A,D),0)
    else:
     self.close(math.dist(B,C),math.dist(C,D));self.close(dot(D,D),rr)
     p={'A':A,'B':B,'C':C,'D':D,'O':[0,0]}
     self.close(angle(p,'A','C','D'),angle(p,'A','O','D'))
     self.close(angle(p,'C','B','D'),angle(p,'B','D','C'))
  self.assertIn('середина',P[803,'single']['steps'][0])
 def test_804_to810_areas_tangencies_and_angle_condition(self):
  for n in [804,809]:
   p=M[n,'single']['points'];self.close(length(p,'A','B'),length(p,'B','C'));self.close(angle(p,'A','B','C'),90)
  p=M[805,'single']['points'];r=distance_line(p,'O','A','B');S=area(p,'ABCD')
  for a,b,c in [('A','B',2/5),('B','C',1/3),('C','D',3/5),('D','A',2/3)]:self.close(length(p,a,b),c*S/r)
  p=M[806,'single']['points'];self.close(distance_line(p,'O','M','N'),0)
  self.close(length(p,'A','M'),length(p,'M','B'));self.close(length(p,'C','N'),length(p,'N','D'))
  p=M[807,'single']['points'];distances=[distance_line(p,'O',a,b) for a,b in zip('ABCD','BCDA')]
  for r in distances:self.close(r,distances[0])
  self.close(length(p,'A','B')+length(p,'C','D'),length(p,'B','C')+length(p,'D','A'))
  p=M[808,'single']['points'];a,b=length(p,'A','D'),length(p,'B','C');r=distance_line(p,'O','A','D')
  self.close(r,a*b/(a+b));self.close(distance_line(p,'O','C','D'),r)
  p=M[810,'single']['points'];self.close(angle(p,'D','A','B')+angle(p,'B','C','D'),180)
 def test_811_to816_perpendicular_chords_and_bicentric_trapezoid(self):
  p=M[811,'single']['points'];self.perpendicular(p,'O','A','A','C');self.perpendicular(p,'O','B','B','C');self.cyclic(p,'ACBO','_I')
  p=M[812,'single']['points'];self.close(angle(p,'Q','P','S'),90);self.close(angle(p,'Q','R','S'),90);self.cyclic(p,'PQRS','O')
  p=M[813,'single']['points'];self.close(angle(p,'M','H','C'),angle(p,'M','B','C'));self.cyclic(p,'BHMC','O')
  p=M[814,'single']['points'];self.close(length(p,'O','A'),2*length(p,'O','H'));self.close(length(p,'A','B'),length(p,'B','C'))
  p=M[815,'single']['points'];self.close(length(p,'A','B'),length(p,'B','C'));self.close(angle(p,'A','B','C'),90)
  p=M[816,'single']['points'];a,b=length(p,'A','D'),length(p,'B','C');r=distance_line(p,'O','A','D')
  self.close(r,math.sqrt(a*b)/2);self.cyclic(p,'ABCD','Q');self.close(distance_line(p,'O','A','B'),r)
 def test_807_and810_contradiction_scenes_are_distinct_and_honest(self):
  m=M[807,'single'];p=subscene(m['points'],'__case1');r=length(p,'O','T')
  for a,b in [('A','B'),('B','C'),('C','E'),('E','A')]:self.close(distance_line(p,'O',a,b),r)
  self.close(length(p,'A','D'),length(p,'A','E')+length(p,'E','D'))
  self.assertLess(length(p,'C','D'),length(p,'C','E')+length(p,'E','D'))
  self.assertNotAlmostEqual(length(p,'A','B')+length(p,'C','D'),length(p,'B','C')+length(p,'D','A'))
  self.assertEqual(m['views']['case-1']['availableFromStep'],3)
  self.assertIn('нарушается',m['views']['case-1']['note'])
  m=M[810,'single']
  p=m['points'];self.perpendicular(p,'O','B','B','_T')
  self.close(angle(p,'D','B','_T'),angle(p,'D','A','B'))
  self.assertLess(angle(p,'D','B','C'),angle(p,'D','B','_T'))
  self.assertFalse(m['views']['neutral'].get('rays'))
  self.assertFalse(m['views']['step-1'].get('rays'))
  self.assertIn(['B','_T'],m['views']['step-2']['rays'])
  for i in [1,2]:
   p=subscene(m['points'],f'__case{i}');self.cyclic(p,'ABDE','O')
   self.assertGreater(length(p,'C','E'),0)
   total=angle(p,'D','A','B')+angle(p,'B','C','D')
   if i==1:
    self.close(length(p,'B','C'),length(p,'B','E')+length(p,'E','C'));self.assertLess(total,180)
    self.assertGreater(angle(p,'B','E','D'),angle(p,'B','C','D'))
   else:
    self.close(length(p,'B','E'),length(p,'B','C')+length(p,'C','E'));self.assertGreater(total,180)
    self.assertGreater(angle(p,'B','C','D'),angle(p,'B','E','D'))
   self.assertEqual(m['views'][f'case-{i}']['availableFromStep'],i+3)
   self.assertIn('вопреки условию',m['views'][f'case-{i}']['note'])
 def test_817_and818_construction_existence_cases(self):
  p=M[817,'single']['points'];self.close(length(p,'O','A'),length(p,'O','B'));self.perpendicular(p,'O','A','_U','_V')
  p=M[818,'single']['points'];r=distance_line(p,'O','_U','_V')
  self.close(length(p,'O','P'),r);self.close(length(p,'Q','P'),r)
  self.close(distance_line(p,'Q','_U','_V'),r);self.assertGreater(length(p,'O','Q'),0)
  q=subscene(p,'__case2');self.assertGreater(distance_line(q,'P','_M','_N'),length(q,'P','_J'))
  self.assertIn('два решения',P[818,'single']['answer']);self.assertIn('решений нет',P[818,'single']['answer'])
 def test_819_to823_every_claimed_angle_and_all_three_altitudes(self):
  p=M[819,'single']['points'];self.close(angle(p,'A','O','D')+angle(p,'B','O','C'),180);self.close(angle(p,'A','O','B')+angle(p,'C','O','D'),180)
  p=M[820,'single']['points'];self.perpendicular(p,'P','R','Q','S')
  for t,a,b in [('P','A','B'),('Q','B','C'),('R','C','D'),('S','D','A')]:self.close(distance_line(p,t,a,b),0)
  p=M[821,'single']['points'];self.perpendicular(p,'A1','C1','B1','D1')
  for t,a,b in [('A1','A','B'),('B1','B','C'),('C1','C','D'),('D1','D','A')]:self.close(length(p,t,a),length(p,t,b))
  p=M[822,'single']['points']
  for v,u,w,x in [('A','B','C','A1'),('B','C','A','B1'),('C','A','B','C1')]:self.close(angle(p,u,v,x),angle(p,x,v,w))
  for v,x,u,w in [('A','A1','B1','C1'),('B','B1','C1','A1'),('C','C1','A1','B1')]:self.perpendicular(p,v,x,u,w)
  p=M[823,'single']['points']
  for v,x,u,w in [('A','A1','B','C'),('B','B1','C','A'),('C','C1','A','B')]:
   self.assertLess(angle(p,u,v,w),90);self.perpendicular(p,v,x,u,w)
  for x,v,u,w in [('A1','A','B1','C1'),('B1','B','C1','A1'),('C1','C','A1','B1')]:
   left,right=angle(p,u,x,v),angle(p,v,x,w);self.close(left,right);self.close(left+right,angle(p,u,x,w))
if __name__=='__main__':unittest.main()

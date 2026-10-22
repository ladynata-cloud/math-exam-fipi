"""Independent source-constraint and geometric checks of authored §§8–9 JSON.
Standard library only; never imports or executes the authoring generator.
"""
import json,math,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'stereo-course/merzlyak-10-base/lessons'
EPS=2e-7

def sub(a,b):return [x-y for x,y in zip(a,b)]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def norm(a):return math.sqrt(dot(a,a))
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def lesson(p,n,part=None):return json.loads((OUT/(f'ex-{p:02d}-{n:03d}'+(f'-{part}' if part else '')+'.json')).read_text())
def points(p,n,part=None):return lesson(p,n,part)['visualization']['model']['points']
def v(p,a,b):return sub(p[b],p[a])
def d(p,a,b):return norm(v(p,a,b))
def angle(p,a,b,c,e):return math.degrees(math.atan2(norm(cross(v(p,a,b),v(p,c,e))),abs(dot(v(p,a,b),v(p,c,e)))))
def vertex(p,a,b,c):return math.degrees(math.acos(max(-1,min(1,dot(v(p,b,a),v(p,b,c))/(d(p,b,a)*d(p,b,c))))))
def area(p,a,b,c):return norm(cross(v(p,a,b),v(p,a,c)))/2
class SourceModels(unittest.TestCase):
 def eq(self,a,b):self.assertAlmostEqual(a,b,delta=EPS*max(1,abs(b)))
 def perp(self,p,a,b,c,d):self.eq(dot(v(p,a,b),v(p,c,d)),0)
 def parallel(self,p,a,b,c,d):self.eq(norm(cross(v(p,a,b),v(p,c,d))),0)
 def midpoint(self,p,m,a,b):
  for x,y,z in zip(p[m],p[a],p[b]):self.eq(x,(y+z)/2)
 def test_source_coverage_references_and_planes(self):
  files=list(OUT.glob('ex-0[89]-*.json'));self.assertEqual(len(files),68)
  coverage=json.loads((ROOT/'tools/merzlyak-10-base/coverage-08-09.json').read_text())
  self.assertEqual(coverage['numberedExercises'],59);self.assertEqual(coverage['lessonCount'],68)
  self.assertEqual({e['exercise'] for e in coverage['entries']},{f'{p}.{n}' for p,maximum in [(8,18),(9,41)] for n in range(1,maximum+1)})
  for f in files:
   x=json.loads(f.read_text());m=x['visualization']['model'];p=m['points']
   with self.subTest(file=f.name):
    self.assertEqual(x['status'],'draft');self.assertEqual(set(x['review'].values()),{'pending'})
    self.assertEqual(x['source']['pdfPages'],[n+1 for n in x['source']['printedPages']])
    para,num=map(int,x['source']['exercise'].split('.'))
    page=(85 if num<=5 else 86 if num<=11 else 87) if para==8 else (94 if num<=7 else 95 if num<=13 else 96 if num<=24 else 97 if num<=35 else 98)
    self.assertEqual(x['source']['printedPages'],[page])
    self.assertEqual(x['source']['chapter'],'Глава 3. Перпендикулярность в пространстве')
    for q in p.values():self.assertTrue(len(q)==3 and all(math.isfinite(z) for z in q))
    for group in m.get('edges',[])+m.get('faces',[]):self.assertTrue(set(group)<=p.keys())
    for key,w in m['views'].items():
     names=set(w.get('points',[])+w.get('polygon',[]))
     for a,b in w.get('segments',[]):self.assertIn(a,p);self.assertIn(b,p);names.update([a,b]);self.assertGreater(d(p,a,b),EPS)
     self.assertTrue(names<=p.keys());self.assertLessEqual(len([n for n in names if not n.startswith('_')]),8,(f.name,key,names))
    for face in m.get('faces',[])+[w['polygon'] for w in m['views'].values() if 'polygon' in w]:
     a,b,c=face[:3];normal=cross(v(p,a,b),v(p,a,c));self.assertGreater(norm(normal),EPS)
     for z in face:self.eq(dot(normal,v(p,a,z)),0)
    for s in x['steps']:self.assertIn(s['view'],m['views'])
  self.assertEqual([lesson(9,6,i)['source']['subpart'] for i in range(1,6)],['1','2','3','4','5'])
  self.assertEqual([lesson(9,19,i)['source']['subpart'] for i in range(1,7)],['1','2','3','4','5','6'])
 def test_paragraph_eight_exact_givens_and_results(self):
  cases={2:[('C','D','B','C',90),('A','A1','C1','D1',90),('A','A1','D1','C',45),('A','C','B1','D1',90),('A1','C1','A','C',0)],3:[('A','B','B','B1',90),('A','B','B1','D1',45),('A1','D','B1','C',0),('B1','D1','C1','C',90)]}
  for n,qs in cases.items():
   p=points(8,n)
   for a,b,c,e,r in qs:self.eq(angle(p,a,b,c,e),r)
  p=points(8,4);self.eq(d(p,'C','M'),d(p,'C','D'));self.eq(d(p,'D','M'),d(p,'C','D'));self.eq(angle(p,'A','B','M','C'),60)
  p=points(8,5);self.eq(vertex(p,'M','B','A'),40);self.eq(vertex(p,'M','B','C'),90)
  p=points(8,6);self.midpoint(p,'E','A','B');self.midpoint(p,'F','C','D');self.eq(d(p,'M','E'),d(p,'F','E'));self.eq(vertex(p,'M','E','F'),110)
  for a,b,c,e,r in [('A','D','E','F',0),('A','D','M','E',70),('B','C','M','F',35)]:self.eq(angle(p,a,b,c,e),r)
  p=points(8,7);self.eq(vertex(p,'A','E','D'),70);self.eq(vertex(p,'A','D','E'),30);self.eq(angle(p,'B','C','A','E'),80)
  for n in [8,9]:
   p=points(8,n)
   for a,b in [('B','C'),('B','D'),('C','D')]:self.perp(p,'A',a,'A',b)
  p=points(8,8);self.eq(d(p,'B','C'),17);self.eq(d(p,'A','B'),15);self.eq(d(p,'B','D'),3*math.sqrt(29));self.eq(d(p,'C','D'),10)
  p=points(8,9);self.eq(d(p,'C','D'),2*math.sqrt(43));self.eq(d(p,'B','D'),12);self.eq(vertex(p,'A','B','D'),60);self.eq(d(p,'B','C'),10)
  p=points(8,10)
  for a,b in [('A','B'),('A','C'),('A','D'),('B','C'),('B','D'),('C','D')]:self.eq(d(p,a,b),1)
  self.midpoint(p,'M','A','B');self.midpoint(p,'K','C','D');self.perp(p,'M','K','A','B');self.perp(p,'M','K','C','D');self.eq(d(p,'M','K'),math.sqrt(.5))
  p=points(8,11);self.parallel(p,'E','F','A','C');self.parallel(p,'M','K','A','B')
  p=points(8,12);self.eq(angle(p,'O','B1','A1','C1'),90)
  p=points(8,13);self.eq(d(p,'A','A1'),math.sqrt(3)*d(p,'A','D'));self.eq(angle(p,'A','D1','B1','C'),60)
  p=points(8,14);self.midpoint(p,'E','A','A1');self.midpoint(p,'F','C','D');self.midpoint(p,'H','E','F');self.eq(d(p,'D1','E'),d(p,'D1','F'));self.perp(p,'D1','H','E','F')
  for n in [15,16]:
   p=points(8,n)
   for z,a,b in [('E','A','B'),('F','A','D'),('M','C','D'),('K','B','C')]:self.midpoint(p,z,a,b)
   self.eq(angle(p,'A','C','B','D'),90 if n==15 else 60)
  p=points(8,15);self.eq(d(p,'E','M'),d(p,'F','K'))
  p=points(8,16);self.eq(d(p,'A','C'),12);self.eq(d(p,'B','D'),16);self.eq(d(p,'F','K'),2*math.sqrt(13))
  p=points(8,17);self.eq(d(p,'A','C'),24);self.eq(d(p,'B','D'),10);self.eq(d(p,'A','D'),13);self.eq(sum(d(p,a,b) for a,b in [('A','B'),('B','C'),('C','D'),('D','A')]),52)
  p=points(8,18);self.eq(d(p,'A','B'),4);self.eq(d(p,'A','C'),7);self.eq(d(p,'A','D'),4);self.eq(d(p,'C','D'),3);self.eq(vertex(p,'B','A','K'),vertex(p,'K','A','C'))
 def test_paragraph_nine_givens_and_conclusions(self):
  for n in [2,3,7]:
   p=points(9,n);self.parallel(p,'A','B','C','D');self.perp(p,'M','N','A','B')
  p=points(9,6,2);self.parallel(p,'E','F','A','B');self.perp(p,'M','N','A','B')
  p=points(9,6,3);self.parallel(p,'A','D','B','C');self.perp(p,'M','N','A','D')
  p=points(9,6,5);self.parallel(p,'A','C','D','F');self.perp(p,'M','N','A','C')
  p=points(9,8)
  for a,b in [('A','B'),('B','C'),('C','A')]:self.eq(d(p,a,b),6)
  self.eq(d(p,'D','A'),4);self.eq(d(p,'D','O'),2);self.perp(p,'D','O','A','B');self.perp(p,'D','O','A','C')
  p=points(9,9);self.eq(d(p,'A','D'),4*math.sqrt(2));self.eq(d(p,'M','O'),2);self.eq(d(p,'M','D'),2*math.sqrt(5))
  p=points(9,10);self.eq(d(p,'O','B1'),math.sqrt(6)/2);self.eq(math.tan(math.radians(angle(p,'B1','O','D','D1'))),math.sqrt(2)/2)
  p=points(9,11);self.eq(d(p,'B1','D'),17);self.eq(d(p,'A','B1'),15);self.eq(d(p,'A','D'),8)
  p=points(9,12);self.perp(p,'A','C','B','D');self.perp(p,'A','C','B','E')
  p=points(9,13);self.perp(p,'B','C','A','C');self.perp(p,'B','C','A','F')
  for n in [14,15,34]:
   x=lesson(9,n);m=x['visualization']['model'];p=m['points'];direction=('A','B') if n==14 else ('A','D');poly=m['views']['section']['polygon'] if n in (14,34) else ['B','K','C']
   for a,b in zip(poly,poly[1:]+poly[:1]):self.perp(p,*direction,a,b)
   if n==14:
    for q,a,b in [('M','A','B'),('N','D','C'),('P','D1','C1'),('Q','A1','B1')]:self.eq(norm(cross(v(p,a,q),v(p,a,b))),0)
   if n==34:self.eq(d(p,'A','M')/d(p,'M','D'),3);self.eq(area(p,'M','P','Q'),math.sqrt(2)/16)
  p=points(9,16);self.parallel(p,'A','M','D','K');self.parallel(p,'A','B','D','C')
  p=points(9,17);self.parallel(p,'A','E','B','F');self.parallel(p,'A','D','B','C')
  p=points(9,20);self.eq(d(p,'A','E')/d(p,'E','C'),3/4);self.eq(d(p,'B','C'),21);self.eq(d(p,'E','F'),9);self.parallel(p,'E','F','B','C')
  p=points(9,21);self.eq(d(p,'A','B'),d(p,'A','C'));self.eq(vertex(p,'B','A','D'),vertex(p,'C','A','D'));self.perp(p,'A','D','B','C')
  p=points(9,22);self.eq(vertex(p,'A','B','D'),vertex(p,'C','B','D'));self.eq(vertex(p,'A','D','B'),vertex(p,'C','D','B'));self.perp(p,'A','C','B','D')
  p=points(9,23);self.midpoint(p,'D','A','C');self.midpoint(p,'D','E','F');self.eq(d(p,'B','A'),d(p,'B','C'));self.eq(d(p,'B','E'),d(p,'B','F'));self.perp(p,'B','D','A','C');self.perp(p,'B','D','E','F')
  p=points(9,24);self.parallel(p,'D','A','F','B');self.parallel(p,'D','A','E','C');self.perp(p,'D','F','F','B');self.perp(p,'D','E','E','C');self.perp(p,'E','F','D','A');self.assertGreater(area(p,'D','E','F'),EPS)
  p=points(9,25);self.eq(d(p,'M','A'),d(p,'M','B'));self.eq(d(p,'M','A'),d(p,'M','C'));self.perp(p,'M','O','A','B');self.perp(p,'M','O','B','C')
  p=points(9,26);self.eq(d(p,'A','C'),34);self.eq(d(p,'B','D'),18);self.eq(d(p,'A','B'),20);self.eq(d(p,'C','D'),12)
  p=points(9,27);self.eq(d(p,'A','A1'),2);self.eq(d(p,'B','B1'),12);self.eq(d(p,'A','B1'),10);self.eq(d(p,'A','B'),14)
  p=points(9,28);self.eq(d(p,'A','C')/d(p,'B','C'),1/4);self.eq(p['A'][2],15);self.eq(p['B'][2],25);self.eq(p['C'][2],17)
  p=points(9,29);self.eq(d(p,'M','K')/d(p,'K','N'),3/5);self.eq(p['M'][2],14);self.eq(p['K'][2],10);self.eq(p['N'][2],10/3)
  p=points(9,30)
  for i in range(3):self.eq(p['C'][i],p['B'][i]+p['D'][i]-p['A'][i])
  self.eq(p['A'][2],11);self.eq(p['B'][2],18);self.eq(p['D'][2],16);self.eq(p['C'][2],23)
  p=points(9,31)
  for a in ['A','B']:self.eq(p[a][0],p[a+'1'][0]);self.eq(p[a][1],p[a+'1'][1]);self.eq(p[a][2],-p[a+'1'][2])
  p=points(9,35);self.perp(p,'A','C','B','C');self.perp(p,'B','D','A','C');self.parallel(p,'E','F','A','C');self.perp(p,'B','E','E','F')
  p=points(9,36);self.parallel(p,'M','Q','A','B');self.perp(p,'M','Q','B','C');self.perp(p,'M','Q','B','M')
  p=points(9,37)
  for name,tri in [('E','ABC'),('F','DBC')]:
   for i in range(3):self.eq(p[name][i],sum(p[q][i] for q in tri)/3)
  self.parallel(p,'E','F','A','D')
  p=points(9,38);self.midpoint(p,'E','D','D1');self.parallel(p,'A1','E','B1','K');self.eq(math.cos(math.radians(angle(p,'A','B1','A1','E'))),math.sqrt(10)/10)
  p=points(9,39)
  for a,b in [('A','B'),('B','C'),('C','A')]:self.eq(d(p,a,b),4*math.sqrt(2))
  self.eq(d(p,'S','C'),2);self.midpoint(p,'M','B','C');self.midpoint(p,'K','A','B');self.parallel(p,'M','N','C','K');self.eq(angle(p,'S','M','C','K'),45)
  p=points(9,40);self.eq(d(p,'H','A'),5);self.eq(d(p,'H','B'),9);self.eq(d(p,'P','B')-d(p,'P','A'),2);self.eq(d(p,'P','H'),12)
  p=points(9,41);self.eq(d(p,'A','B'),d(p,'C','D'));self.eq(vertex(p,'A','B','E'),vertex(p,'E','B','C'));self.perp(p,'B','E','A','C');self.parallel(p,'B','C','D','E');self.parallel(p,'C','D','B','E');self.eq(sum(d(p,a,b) for a,b in [('A','B'),('B','C'),('C','D'),('D','A')]),40);self.eq(d(p,'B','C'),8);self.eq(vertex(p,'B','A','D'),60);self.eq(vertex(p,'A','B','C'),120)
if __name__=='__main__':unittest.main()

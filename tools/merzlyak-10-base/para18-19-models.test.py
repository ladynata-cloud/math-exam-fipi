"""Independent source-constraint and geometric checks of authored §§18–19 JSON.
Standard library only; never imports or executes the authoring generator.
"""
import json,math,unittest
from pathlib import Path
from review_state import assert_review_state
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
def scene(p,n):return lesson(p,n)['visualization']['model']
def polyarea(p,names):return sum(area(p,names[0],names[i],names[i+1]) for i in range(1,len(names)-1))
def lateral(p,n):
 m=scene(p,n);return sum(polyarea(m['points'],f) for f in m['faces'][1 if p==18 else 2:])
def total(p,n):
 m=scene(p,n);return sum(polyarea(m['points'],f) for f in m['faces'])
def mean(a,b,t):return [(1-t)*x+t*y for x,y in zip(a,b)]
class Pyramids(unittest.TestCase):
 def eq(self,a,b):self.assertAlmostEqual(a,b,delta=EPS*max(1,abs(b)))
 def parallel(self,p,a,b,c,e):self.eq(norm(cross(v(p,a,b),v(p,c,e))),0)
 def perp(self,p,a,b,c,e):self.eq(dot(v(p,a,b),v(p,c,e)),0)
 def test_cards_sources_references_and_planarity(self):
  files=[*OUT.glob('ex-18-*.json'),*OUT.glob('ex-19-*.json')];self.assertEqual(len(files),75)
  cover=json.loads((ROOT/'tools/merzlyak-10-base/coverage-18-19.json').read_text());self.assertEqual(cover['numberedExercises'],75);self.assertEqual(cover['lessonCount'],75)
  self.assertEqual({x['exercise'] for x in cover['entries']},{f'{p}.{n}' for p,m in [(18,59),(19,16)] for n in range(1,m+1)})
  for f in files:
   x=json.loads(f.read_text());m=x['visualization']['model'];p=m['points']
   with self.subTest(file=f.name):
    assert_review_state(x);self.assertEqual(x['source']['chapter'],'Глава 4. Многогранники')
    self.assertEqual(x['source']['pdfPages'],[q+1 for q in x['source']['printedPages']]);self.assertTrue(3<=len(x['steps'])<=7)
    for q in p.values():self.assertTrue(len(q)==3 and all(math.isfinite(v) for v in q))
    for a,b in m['edges']:self.assertIn(a,p);self.assertIn(b,p);self.assertGreater(d(p,a,b),EPS)
    for key,w in m['views'].items():
     names=set(w.get('points',[])+w.get('polygon',[]))
     for a,b in w.get('segments',[]):names.update([a,b]);self.assertGreater(d(p,a,b),EPS,(f.name,key,a,b))
     self.assertTrue(names<=p.keys());self.assertLessEqual(len([q for q in names if not q.startswith('_')]),8,(f.name,key))
    for face in m['faces']+[w['polygon'] for w in m['views'].values() if 'polygon' in w]:
     a,b,c=face[:3];normal=cross(v(p,a,b),v(p,a,c));self.assertGreater(norm(normal),EPS,(f.name,face))
     for q in face:self.eq(dot(normal,v(p,a,q)),0)
    for s in x['steps']:self.assertIn(s['view'],m['views'])
  self.assertEqual(lesson(19,3)['source']['printedPages'],[173,174])
 def test_regular_pyramid_givens_and_direct_answers(self):
  p=points(18,6);self.eq(d(p,'A','B'),12);self.eq(vertex(p,'S','A','O'),60);self.eq(d(p,'S','O'),12)
  p=points(18,7);self.eq(d(p,'S','O'),8);self.eq(vertex(p,'S','A','O'),45);self.eq(d(p,'A','B'),8*math.sqrt(2))
  p=points(18,8);self.eq(d(p,'A','B'),6);self.eq(d(p,'S','O'),4);self.eq(d(p,'S','K'),5);self.eq(math.tan(math.radians(vertex(p,'S','K','O'))),4/3)
  p=points(18,9);self.eq(d(p,'A','B'),6);self.eq(d(p,'S','K'),2);self.eq(d(p,'S','O'),1);self.eq(vertex(p,'S','K','O'),30)
  p=points(18,10);self.eq(d(p,'A','B'),10);self.eq(d(p,'S','K'),20);self.eq(lateral(18,10),700)
  p=points(18,11);self.eq(vertex(p,'A','S','B'),30);self.eq(d(p,'S','A'),2);self.eq(lateral(18,11),8)
  p=points(18,12);self.eq(lateral(18,12),300);self.eq(d(p,'S','K'),15);self.eq(d(p,'A','B'),8)
  for n,a in [(13,10),(14,4)]:
   m=scene(18,n);p=m['points']
   for x,y in m['edges']:self.eq(d(p,x,y),a)
  self.eq(total(18,13),100*(1+math.sqrt(3)));self.eq(total(18,14),16*math.sqrt(3))
  p=points(18,15);self.eq(d(p,'B','D'),4);self.eq(d(p,'M','A'),8);self.eq(vertex(p,'M','A','O'),45);self.eq(d(p,'M','D'),6)
  p=points(18,16);self.eq(d(p,'A','B'),13);self.eq(d(p,'A','C'),24);self.eq(d(p,'S','O'),16);self.eq(d(p,'S','A'),20);self.eq(d(p,'S','B'),math.sqrt(281))
  p=points(18,17);b=d(p,'S','A');beta=math.radians(vertex(p,'S','A','O'));self.eq(area(p,'S','A','D'),b*b*math.sin(2*beta)/2)
  p=points(18,18);a=d(p,'A','B');alpha=math.radians(vertex(p,'S','A','O'));self.eq(area(p,'S','A','C'),a*a*math.tan(alpha)/2)
  p=points(18,20);self.eq(math.tan(math.radians(vertex(p,'S','K','O'))),2*math.tan(math.radians(vertex(p,'S','A','O'))))
  p=points(18,21);self.eq(math.tan(math.radians(vertex(p,'S','A','O'))),math.tan(math.radians(vertex(p,'S','K','O')))/math.sqrt(2))
  p=points(18,24);self.eq(vertex(p,'E','S','F'),60);self.eq(vertex(p,'A','S','B'),90);self.eq(d(p,'S','E'),d(p,'A','B')/2)
  for n in [26,27]:
   m=scene(18,n);p=m['points'];base=polyarea(p,m['faces'][0]);alpha=math.radians(vertex(p,'S','K','O'));self.eq(total(18,n),base*(1+1/math.cos(alpha)))
  p=points(18,28);self.eq(d(p,'S','K'),6);self.eq(vertex(p,'S','K','O'),60);self.eq(lateral(18,28),72)
  p=points(18,29);self.eq(d(p,'S','O'),5);self.eq(vertex(p,'S','K','O'),45);self.eq(lateral(18,29),75*math.sqrt(6))
 def test_all_sections_against_solid_edges(self):
  cases=[(18,22,['D','E','F','G']),(18,23,['D','E','G','F']),(18,25,['B','E','D']),(18,47,['P','Q','F','E']),(18,48,['P','Q','F','E']),(18,55,['P','Q','R','T']),(19,5,['A','C','C1','A1']),(19,9,['A','B','C1']),(19,10,['A','C','B1'])]
  for par,n,poly in cases:
   with self.subTest(exercise=f'{par}.{n}'):
    m=scene(par,n);p=m['points'];a,b,c=[p[x] for x in poly[:3]];normal=cross(sub(b,a),sub(c,a));cuts=[]
    for u,w in m['edges']:
     x,y=p[u],p[w];sx,sy=dot(normal,sub(x,a)),dot(normal,sub(y,a))
     if abs(sx)<EPS:cuts.append(x)
     if abs(sy)<EPS:cuts.append(y)
     if sx*sy < -EPS:cuts.append(mean(x,y,sx/(sx-sy)))
    unique=[]
    for q in cuts:
     if not any(norm(sub(q,r))<EPS for r in unique):unique.append(q)
    self.assertEqual(len(unique),len(poly))
    for x in poly:self.assertTrue(any(norm(sub(p[x],q))<EPS for q in unique))
  p=points(18,22);self.eq(d(p,'A','B'),8);self.eq(d(p,'M','A'),12);self.eq(polyarea(p,['D','E','F','G']),24);self.perp(p,'D','E','E','F')
  p=points(18,23);self.eq(d(p,'A','B'),9);self.eq(d(p,'M','A'),12);self.eq(sum(d(p,a,b) for a,b in [('D','E'),('E','G'),('G','F'),('F','D')]),20);self.parallel(p,'D','F','M','A');self.parallel(p,'D','E','B','C');self.eq(norm(cross(v(p,'D','O'),v(p,'D','E'))),0)
  p=points(18,25);a=d(p,'A','B');self.eq(area(p,'B','E','D'),a*a*math.sqrt(2)/4);self.eq(vertex(p,'E','O','C'),45)
  p=points(18,47);self.eq(d(p,'A','B'),8);self.eq(d(p,'M','O'),12);self.eq(polyarea(p,['P','Q','F','E']),36)
  p=points(18,48);self.eq(d(p,'A','B'),4);self.eq(vertex(p,'S','K','O'),60);self.eq(polyarea(p,['P','Q','F','E']),6)
  p=points(18,55);self.eq(polyarea(p,['P','Q','R','T']),.25)
  for t in [.1,.23,.5,.81,.95]:
   q={n:mean(p[a],p[b],t) for n,a,b in [('P','A','C'),('Q','B','C'),('R','B','S'),('T','A','S')]};self.eq(polyarea(q,['P','Q','R','T']),t*(1-t));self.assertLessEqual(polyarea(q,['P','Q','R','T']),.25+EPS)
 def test_nonregular_pyramid_givens_and_answers(self):
  p=points(18,31);self.perp(p,'B','A','B','C');self.eq(d(p,'A','C'),32);self.eq(d(p,'S','O'),12)
  for q in 'ABC':self.eq(d(p,'S',q),20)
  p=points(18,32);self.eq(d(p,'A','B'),8);self.eq(d(p,'A','D'),6);self.eq(vertex(p,'S','A','O'),60);self.eq(d(p,'S','O'),5*math.sqrt(3))
  p=points(18,33);self.eq(d(p,'A','B'),d(p,'B','C'));self.eq(vertex(p,'A','B','C'),120);self.eq(d(p,'D','A'),8);self.eq(vertex(p,'D','A','O'),45);self.eq(area(p,'A','B','C'),8*math.sqrt(3))
  p=points(18,34);self.eq(d(p,'A','B'),3*math.sqrt(10));self.eq(d(p,'B','C'),3*math.sqrt(10));self.eq(d(p,'A','C'),6);self.eq(d(p,'S','O'),5)
  for q in 'ABC':self.eq(d(p,'S',q),5*math.sqrt(2))
  for n,ar,h,ang in [(36,32*math.sqrt(2),2,45),(37,20*math.sqrt(3),2/math.sqrt(3),30),(38,160,4*math.sqrt(3),60)]:
   p=points(18,n);self.eq(lateral(18,n),ar);self.eq(d(p,'S','O'),h);self.eq(vertex(p,'S','K','O'),ang)
  p=points(18,39);self.eq(d(p,'A','B'),12);self.eq(d(p,'A','D'),4);self.eq(vertex(p,'S','D','A'),45);self.eq(d(p,'S','A'),4);self.eq(lateral(18,39),32+8*math.sqrt(10)+24*math.sqrt(2))
  p=points(18,40);self.eq(d(p,'A','B'),12);self.eq(d(p,'S','A'),5);self.eq(total(18,40),360)
  p=points(18,41);self.eq(d(p,'A','B'),17);self.eq(d(p,'B','C'),17);self.eq(d(p,'A','C'),16);self.eq(d(p,'M','B'),20);self.eq(total(18,41),660)
  p=points(18,42);self.eq(d(p,'A','B'),13);self.eq(d(p,'B','C'),14);self.eq(d(p,'A','C'),15);self.eq(d(p,'M','A'),9);self.eq(area(p,'M','B','C'),105)
  p=points(18,43);alpha=math.radians(vertex(p,'A','S','B'));phi=math.radians(vertex(p,'A','H','C'));self.eq(phi,2*math.asin(1/(2*math.cos(alpha/2))))
  p=points(18,44);alpha=math.radians(vertex(p,'A','H','C'));gamma=math.radians(vertex(p,'A','S','B'));self.eq(gamma,2*math.acos(math.sqrt(2)/(2*math.sin(alpha/2))))
  p=points(18,45);dd=d(p,'O','H');alpha=math.radians(vertex(p,'S','K','O'));self.eq(lateral(18,45),6*dd*dd*math.sqrt(3)/(math.sin(2*alpha)*math.sin(alpha)))
  p=points(18,46);mm=d(p,'O','H');beta=math.radians(vertex(p,'O','S','K'));self.eq(lateral(18,46),8*mm*mm/(math.sin(2*beta)*math.cos(beta)))
  self.eq(lateral(18,49),180);self.eq(lateral(18,50),240);self.eq(lateral(18,51),3+math.sqrt(6)+math.sqrt(3))
  p=points(18,49);self.eq(d(p,'B','C'),2);self.eq(d(p,'A','D'),18);self.eq(d(p,'S','K'),9)
  p=points(18,50);self.eq(d(p,'A','B'),15);self.eq(d(p,'A','C'),8);self.eq(d(p,'S','O'),3*math.sqrt(15))
  p=points(18,51);self.eq(d(p,'A','B'),2);self.eq(d(p,'B','C'),2);self.eq(vertex(p,'A','B','C'),120);self.eq(vertex(p,'M','H','A'),45)
  p=points(18,52);a=d(p,'A','B');alpha=math.radians(vertex(p,'A','B','C'));beta=math.radians(vertex(p,'M','H','B'));self.assertGreater(alpha,math.pi/2);self.eq(lateral(18,52),a*a*math.sin(alpha)*(1+math.sin(beta))/math.cos(beta))
  p=points(18,53);self.eq(d(p,'A','B'),6);self.eq(vertex(p,'M','K','H'),45);self.eq(d(p,'M','H'),1.5*math.sqrt(3))
  p=points(18,54);self.eq(d(p,'A','C'),4*math.sqrt(3));self.eq(vertex(p,'B','A','C'),60);self.eq(vertex(p,'A','C','B'),90);self.eq(d(p,'M','C'),8*math.sqrt(3)/3);self.eq(d(p,'M2','C'),8*math.sqrt(3))
  for apex,footname in [('M','H'),('M2','H2')]:
   # Distances of the actual height foot to both nonvertical side lines give tan30.
   for a,b in [('A','B'),('A','C')]:
    distance=norm(cross(v(p,a,footname),v(p,a,b)))/d(p,a,b);self.eq(d(p,apex,footname)/distance,1/math.sqrt(3))
  p=points(18,56);self.perp(p,'S','C','M','N');self.perp(p,'S','C','A','B');self.eq(norm(cross(v(p,'M','C'),v(p,'M','A'))),0);self.eq(norm(cross(v(p,'N','C'),v(p,'N','B'))),0)
  p=points(18,57);self.eq(d(p,'S','A1'),d(p,'A','A1'));self.eq(d(p,'S','C1'),d(p,'C','C1'));self.assertGreater(area(p,'S','A1','C1'),EPS)
  p=points(18,58);self.eq(d(p,'B','C'),3);self.eq(d(p,'A','D'),9);self.eq(area(p,'B','O','C')/area(p,'A','O','D'),1/9)
  p=points(18,59);self.eq(d(p,'A','B'),25);self.eq(d(p,'B','C'),25);self.eq(d(p,'A','C'),14);self.eq(area(p,'M','B','K'),1701/32);self.eq(d(p,'O','T'),d(p,'O','H'))
 def test_frustum_givens_formulas_and_answers(self):
  p=points(19,1);self.eq(lateral(19,1),540);self.eq(d(p,'K','K1'),9);self.eq(d(p,'A1','B1')/d(p,'A','B'),2/3);self.eq(d(p,'A1','B1'),8);self.eq(d(p,'A','B'),12)
  p=points(19,2);self.eq(d(p,'A1','B1'),6);self.eq(d(p,'A','B'),10);self.eq(lateral(19,2),280);self.eq(d(p,'K','K1'),7)
  for n,lo,hi,ang,result in [(3,12,18,45,45*math.sqrt(6)),(4,6,9,60,90)]:
   p=points(19,n);self.eq(d(p,'A1','B1'),lo);self.eq(d(p,'A','B'),hi);self.eq(vertex(p,'K1','K','H'),ang);self.eq(lateral(19,n),result)
  p=points(19,5);self.eq(d(p,'A','B'),10);self.eq(d(p,'A1','B1'),6);self.eq(d(p,'O','O1'),4);self.eq(d(p,'A','C1'),12);self.eq(polyarea(p,['A','C','C1','A1']),32*math.sqrt(2));self.eq(lateral(19,5),64*math.sqrt(5))
  p=points(19,6);self.eq(d(p,'A','B'),27);self.eq(d(p,'A1','B1'),15);self.eq(vertex(p,'A1','A','T'),30);self.eq(d(p,'O','O1'),2*math.sqrt(6));self.eq(lateral(19,6),168*math.sqrt(15))
  p=points(19,7);self.eq(d(p,'A','B'),30);self.eq(d(p,'A1','B1'),24);self.eq(d(p,'A','A1'),4);self.eq(d(p,'O','O1'),2)
  p=points(19,8);self.eq(d(p,'A','B'),12);self.eq(d(p,'A1','B1'),6);self.eq(lateral(19,8),54);self.eq(d(p,'O','O1'),1)
  p=points(19,9);self.eq(d(p,'A','B'),8);self.eq(d(p,'A1','B1'),5);self.eq(d(p,'O','O1'),3);self.eq(area(p,'A','B','C1'),24);self.perp(p,'C1','J','A','B')
  p=points(19,10);self.eq(d(p,'A','B'),8);self.eq(d(p,'A1','B1'),6);self.eq(d(p,'O','O1'),3*math.sqrt(3));self.eq(area(p,'A','C','B1'),12*math.sqrt(10));self.perp(p,'B1','O','A','C')
  p=points(19,11);self.eq(d(p,'B','B1'),4);self.eq(d(p,'A','B'),16);self.eq(d(p,'B','C'),16);self.eq(d(p,'A1','B1'),10);self.eq(d(p,'B1','C1'),10);self.eq(vertex(p,'A','B','C'),120);self.eq(lateral(19,11),104+65*math.sqrt(3))
  p=points(19,12);self.eq(d(p,'A','D'),4);self.eq(d(p,'A1','D1'),2);self.eq(d(p,'A','A1'),d(p,'B','B1'));self.eq(vertex(p,'Q','P','H'),60);self.eq(lateral(19,12),6*(2+math.sqrt(13)+math.sqrt(3)))
  p=points(19,13);h=d(p,'O','O1');alpha=math.radians(vertex(p,'A1','A','T'));beta=math.radians(vertex(p,'C1','A','U'));self.eq(lateral(19,13),2*h*h/math.tan(beta)*math.sqrt(2+1/math.tan(alpha)**2))
  p=points(19,14);a=d(p,'A','B');b=d(p,'A1','B1');alpha=math.radians(vertex(p,'B','A','A1'));self.eq(d(p,'O','O1'),(a-b)*math.sqrt(-math.cos(2*alpha))/(2*math.cos(alpha)))
  p=points(19,15);self.eq(d(p,'A','B'),15);self.eq(vertex(p,'A','O','B'),120);self.eq(math.pi*d(p,'O','A')**2/3,25*math.pi)
  p=points(19,16);self.eq(d(p,'A','B'),6*math.sqrt(3))
  for c,bc,cc in [('C',75,60),('D',15,120)]:self.eq(d(p,'B',c),6*math.sqrt(2));self.eq(vertex(p,'B','A',c),45);self.eq(vertex(p,'A','B',c),bc);self.eq(vertex(p,'A',c,'B'),cc)
if __name__=='__main__':unittest.main()

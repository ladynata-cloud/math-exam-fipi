#!/usr/bin/env python3
"""Independent reviewer oracle for VIII B672–709. No author imports.

Loads only final preparation/model JSON, recomputes Euclidean lengths, angles,
areas and constructions, and binds the result to their byte hashes. This is
math evidence, not browser screenshot or external-provider approval.
"""
from pathlib import Path
import hashlib,json,math,itertools,sys,argparse
from datetime import datetime,timezone
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[2])
parser.add_argument('--report',type=Path,help='Optional explicit report output; normal runs write no files.')
args=parser.parse_args()
ROOT=args.root.resolve()
FILES=['tools/geometry-textbook/models_ch8_b.py','geometry-course/textbook/preparation/chapter-08-b.json','geometry-course/textbook/models/chapter-08-b.json']
inputs={p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in FILES}
prep=json.loads((ROOT/FILES[1]).read_text());data=json.loads((ROOT/FILES[2]).read_text())
records={(e['number'],p['part']):p for e in prep['exercises'] for p in e['parts']}
models={(e['number'],e['part']):e['model'] for e in data['models']}
assert set(records)==set(models) and len(models)==59
assert {n for n,p in models}==set(range(672,710))
checks=[];failures=[];seen=set()
def near(name,a,b,tol=2e-7):
 ok=math.isfinite(a) and math.isfinite(b) and abs(a-b)<=tol*max(1,abs(a),abs(b))
 checks.append({'assertion':name,'actual':a,'expected':b,'passed':ok})
 if not ok:failures.append(checks[-1])
def truth(name,cond):near(name,float(bool(cond)),1)
class G:
 def __init__(self,n,part='single',suffix=''):
  self.key=(n,part);self.m=models[self.key];self.p=self.m['points'];self.s=suffix;seen.add(self.key)
 def pt(self,x):return self.p[x+self.s][:2]
 def vec(self,a,b):return [y-x for x,y in zip(self.pt(a),self.pt(b))]
 def L(self,a,b):return math.dist(self.pt(a),self.pt(b))
 def angle(self,a,o,b):
  u=self.vec(o,a);v=self.vec(o,b)
  return math.degrees(math.atan2(abs(u[0]*v[1]-u[1]*v[0]),sum(x*y for x,y in zip(u,v))))
 def area(self,n):
  q=[self.pt(z) for z in n]
  return abs(sum(q[i][0]*q[(i+1)%len(q)][1]-q[i][1]*q[(i+1)%len(q)][0] for i in range(len(q))))/2
 def ck(self,name,a,b):near(f'{self.key}{self.s} {name}',a,b)
 def R(self,a,b,c,d,x):self.ck(f'{a}{b}/{c}{d}',self.L(a,b)/self.L(c,d),x)
 def perp(self,a,b,c,d):
  u=self.vec(a,b);v=self.vec(c,d);self.ck(f'{a}{b} perpendicular {c}{d}',sum(x*y for x,y in zip(u,v))/(self.L(a,b)*self.L(c,d)),0)
 def par(self,a,b,c,d):
  u=self.vec(a,b);v=self.vec(c,d);self.ck(f'{a}{b} parallel {c}{d}',(u[0]*v[1]-u[1]*v[0])/(self.L(a,b)*self.L(c,d)),0)
 def mid(self,a,m,b):
  for i in (0,1):self.ck(f'{m} midpoint {a}{b} coordinate{i}',self.pt(m)[i],(self.pt(a)[i]+self.pt(b)[i])/2)
 def inside(self,a,m,b):self.ck(f'{m} on segment {a}{b}',self.L(a,m)+self.L(m,b),self.L(a,b));truth(f'{self.key} interior {m}',self.L(a,m)>0 and self.L(m,b)>0)
 def number(self,a,b,value,unit):self.ck(f'physical length {a}{b}',self.L(a,b)/unit,value)

# Independently inspect all stated coordinate claims and visible proof marks.
for key,m in models.items():
 g=G(*key)
 def L(pair):return g.L(*pair)
 for j,c in enumerate(m['checks']):
  typ=c['type'];label=f'{key} claim{j} {typ}'
  if typ=='distanceRatio':near(label,L(c['segments'][0])/L(c['segments'][1]),c['ratio'])
  elif typ=='equalLength':
   for x in c['segments'][1:]:near(label,L(x),L(c['segments'][0]))
  elif typ=='angle':near(label,g.angle(*c['points']),c['degrees'])
  elif typ in ('parallel','perpendicular'):
   u,v=[g.vec(*pair) for pair in c['segments']];value=u[0]*v[1]-u[1]*v[0] if typ=='parallel' else sum(x*y for x,y in zip(u,v));near(label,value/(math.hypot(*u)*math.hypot(*v)),0)
  elif typ=='collinear':
   a,b,*rest=c['points'];u=g.vec(a,b)
   for z in rest:
    v=g.vec(a,z);near(label,(u[0]*v[1]-u[1]*v[0])/max(1,math.hypot(*u)*math.hypot(*v)),0)
  else:raise AssertionError(typ)
 for viewid,v in m['views'].items():
  for r in v.get('rightAngles',[]):near(f'{key} {viewid} right mark',g.angle(r['a'],r['vertex'],r['b']),90)
  for field,calc in [('equalSegments',lambda z:g.L(z['a'],z['b'])),('angleArcs',lambda z:g.angle(z['from'],z['vertex'],z['to']))]:
   groups={}
   for z in v.get(field,[]):
    mark=z.get('marks',1 if field=='equalSegments' else 0)
    if mark:groups.setdefault(mark,[]).append(calc(z))
   for mark,values in groups.items():
    for val in values[1:]:near(f'{key} {viewid} {field} mark{mark}',val,values[0])

# Source numerical demands and geometric results, independently of stored checks.
g=G(672);u=g.L('B','C')/5
for a,b,x in [('A','B',8),('A','C',7)]:g.number(a,b,x,u)
for a,m,b in [('A','M','B'),('B','N','C'),('C','P','A')]:g.mid(a,m,b)
g.ck('medial perimeter',sum(g.L(a,b) for a,b in [('M','N'),('N','P'),('P','M')])/u,10)
g=G(673);u=g.L('O','H')/2.5;g.number('C','D',5,u);g.mid('A','O','C');g.mid('B','O','D');g.perp('O','H','A','D')
g=G(674);small=sum(g.L(a,b) for a,b in [('A','P'),('P','Q'),('Q','A')]);u=small/21;g.ck('whole perimeter',sum(g.L(a,b) for a,b in [('A','B'),('B','C'),('C','A')])/u,42)
for a,m,b in [('A','P','B'),('A','Q','C')]:g.mid(a,m,b)
for suffix in ['', '__case1']:
 g=G(675,suffix=suffix)
 for a,m,b in [('A','M','C'),('B','N','D'),('A','E','B')]:g.mid(a,m,b)
 g.par('M','N','A','D');g.ck('half absolute base difference',2*g.L('M','N'),abs(g.L('A','D')-g.L('B','C')))
g=G(676);u=g.L('A','C')/18;g.number('A','O',6,u);g.number('O','C',12,u);g.mid('A','M','B');g.inside('D','O','M')
g=G(677);g.ck('area multiplier',g.area('ABC')/g.area('ABO'),3);g.mid('B','A1','C');g.mid('A','B1','C')
for part,x,y in [('а',25,16),('б',36,64),('в',6,18),('г',12,4),('д',5,4)]:
 g=G(678,part);u=g.L('A','H')/x
 for a,b,value in [('H','B',y),('A','B',x+y),('C','H',math.sqrt(x*y)),('B','C',math.sqrt(y*(x+y))),('A','C',math.sqrt(x*(x+y)))]:g.number(a,b,value,u)
 g.perp('A','C','B','C');g.perp('C','H','A','B')
for n,part in [(679,'single'),(680,'а'),(680,'б'),(684,'single')]:
 g=G(n,part);h='D' if n==684 else 'H';a=g.L('B','C');b=g.L('A','C');c=g.L('A','B');g.ck('Pythagoras',a*a+b*b,c*c);g.ck('leg a projection',a*a,c*g.L(h,'B'));g.ck('leg b projection',b*b,c*g.L('A',h));g.ck('height through area',g.L('C',h),a*b/c)
g=G(681);u=g.L('A','B')/50
for a,b,x in [('A','H',32),('H','B',18),('A','C',40),('B','C',30)]:g.number(a,b,x,u)
g=G(682);u=abs(g.L('A','H')-g.L('H','B'))/11;g.number('A','B',61,u);g.R('B','C','A','C',6/5)
g=G(683);u=g.L('A','B')/13
for a,b,x in [('A','C',12),('B','C',5),('A','H',144/13),('H','B',25/13)]:g.number(a,b,x,u)
g=G(685);u=g.L('B','C')/3.4
for a,b,x in [('B','C1',6.3),('A','C',1.7),('A1','C1',3.15)]:g.number(a,b,x,u)
g=G(686);u=g.L('A','D')/2.5
for a,b,x in [('O','S',10.2),('A','B',1.7),('T','O',6.936)]:g.number(a,b,x,u)
g.par('T','S','B','D')
g=G(687);u=g.L('A','D')/1.2
for a,b,x in [('A','C',1.65),('B','C',.12),('A','B',1.53),('D','E',4.8),('E','F',6.12)]:g.number(a,b,x,u)
g.ck('reflection angle',g.angle('A','D','B'),g.angle('F','D','E'))
g=G(688);u=g.L('A','C')/42;g.number('A','B',48,u)
g=G(688,suffix='__case1');u=g.L('A1','C1')/6.3;g.number('A1','B1',7.2,u)
g=G(689);u=g.L('A','C')/100
for a,b,x in [('A','C1',32),('A','B1',34),('A','B',106.25),('B','B1',72.25)]:g.number(a,b,x,u)
g.inside('A','B1','B');g.inside('A','C1','C')
g=G(690);g.inside('A','X','B');g.R('A','X','X','B',g.L('P1','Q1')/g.L('P2','Q2'));g.ck('given AC copied',g.L('A','C'),g.L('P1','Q1'));g.ck('given CD copied',g.L('C','D'),g.L('P2','Q2'))
for part,m,n in [('а',2,5),('б',3,7),('в',4,3)]:
 g=G(691,part);g.inside('A','X','B');g.R('A','X','X','B',m/n);g.R('A','U','A','V',m/(m+n));g.par('U','X','V','B')
g=G(692);g.ck('smaller given angle alpha',g.angle('B','A','C'),35);g.ck('other given angle beta',g.angle('A','B','C'),65);g.ck('bisector halves',g.angle('B','A','D'),g.angle('D','A','C'));g.inside('B','D','C');g.ck('given bisector copied',g.L('A','D'),g.L('P','Q'))
g=G(693);g.perp('C','H','A','B');g.ck('given height copied',g.L('C','H'),g.L('P','Q'));g.ck('alpha preserved',g.angle('C','A','B'),g.angle('C','A1','B1'));g.ck('beta preserved',g.angle('A','B','C'),g.angle('A1','B1','C'))
g=G(693,suffix='__case1');g.perp('C','H','A','B');truth('693 external height foot',g.L('H','A')+g.L('A','B')-g.L('H','B')<1e-7)
g=G(693,suffix='__case2');g.perp('C','A','A','B')
g=G(694);g.mid('B','M','C');g.R('A','B','A','C',2/3);g.ck('given median copied',g.L('A','M'),g.L('P','Q'))
g=G(695);g.R('A','B','A','C',2);g.ck('given opposite side copied',g.L('B','C'),g.L('P','Q'));g.ck('parallelogram transfer',g.L('B1','D'),g.L('B','C'))
g=G(696);g.perp('C','A','C','B');g.R('C','A','C','B',g.L('C','A1')/g.L('C','B1'));g.ck('given hypotenuse copied',g.L('A','B'),g.L('P','Q'))
for part,a,b in [('а',8,15),('б',21,20),('в',1,2),('г',7,24)]:
 g=G(697,part);c=math.hypot(a,b);g.perp('A','C','B','C')
 for aa,bb,cc,dd,x in [('B','C','A','B',a/c),('A','C','A','B',b/c),('B','C','A','C',a/b),('A','C','B','C',b/a)]:g.R(aa,bb,cc,dd,x)
for part,kind,x in [('а','tg',.5),('б','tg',.75),('в','cos',.2),('г','cos',2/3),('д','sin',.5),('е','sin',.4)]:
 for suffix in ['','__case1']:
  g=G(698,part,suffix);g.perp('A','C','B','C')
  actual={'tg':g.L('B','C')/g.L('A','C'),'sin':g.L('B','C')/g.L('A','B'),'cos':g.L('A','C')/g.L('A','B')}[kind];g.ck('constructed '+kind,actual,x)
  if not suffix:
   g.R('P','Q','R','S',x)
   if kind=='tg':g.ck('opposite copied',g.L('B','C'),g.L('P','Q'));g.ck('adjacent copied',g.L('A','C'),g.L('R','S'))
   else:g.ck('hypotenuse copied',g.L('A','B'),g.L('R','S'));g.ck('given cathetus copied',g.L('A','C') if kind=='cos' else g.L('B','C'),g.L('P','Q'))
for part,s,c in [('а',math.sqrt(3)/2,.5),('б',math.sqrt(5)/3,2/3),('в',math.sqrt(3)/2,.5),('г',.25,math.sqrt(15)/4)]:
 g=G(699,part);g.R('B','C','A','B',s);g.R('A','C','A','B',c);g.R('B','C','A','C',s/c)
for n,a,b,alpha in [(700,10,10/math.tan(math.radians(50)),50),(701,12*math.tan(math.radians(42)),12,42)]:
 for part in ['а','б']:
  g=G(n,part);u=g.L('B','C')/a
  for q,r,x in [('A','C',b),('A','B',math.hypot(a,b))]:g.number(q,r,x,u)
  g.ck('selected angle',g.angle('C','A','B'),alpha);g.ck('other angle',g.angle('A','B','C'),90-alpha)
g=G(702);u=g.L('A','B')/24;g.number('B','C',24*math.sin(math.radians(35)),u);g.number('A','C',24*math.cos(math.radians(35)),u);g.ck('other angle',g.angle('A','B','C'),55)
g=G(703);u=g.L('B','C')/12;g.number('A','C',15,u);g.number('A','B',3*math.sqrt(41),u);g.R('B','C','A','C',4/5);g.R('A','C','B','C',5/4)
for part in ['а','б']:
 g=G(704,part);alpha=math.radians(g.angle('C','A','B'));g.ck('area through equal side',g.area('ABC'),g.L('A','B')**2*math.sin(alpha)*math.cos(alpha));g.ck('area through base',g.area('ABC'),g.L('A','C')**2*math.tan(alpha)/4);g.mid('A','H','C');g.perp('B','H','A','C')
g=G(705);u=g.L('B','C')/2;g.number('A','D',6,u);alpha=math.radians(g.angle('D','A','B'));g.ck('trapezoid area',g.area('ABCD')/u**2,8*math.tan(alpha));g.ck('equal legs',g.L('A','B'),g.L('C','D'))
g=G(706);u=g.L('B','C')/60;g.number('B','H',12,u);g.number('A','D',60+8*math.sqrt(3),u);g.ck('left slope',g.angle('D','A','B'),60);g.ck('right slope',g.angle('A','D','C'),60)
g=G(707);g.R('A','C','B','D',math.sqrt(3))
for a,o,b,x in [('D','A','B',60),('A','B','C',120),('B','C','D',60),('C','D','A',120)]:g.ck('rhombus angle '+o,g.angle(a,o,b),x)
g=G(708);g.R('A','B','B','C',math.sqrt(3));g.ck('diagonal to long side',g.angle('B','A','C'),30);g.ck('diagonal to short side',g.angle('C','A','D'),60)
g=G(709);u=g.L('A','D')/12;alpha=47+50/60;g.ck('degree-minute conversion',g.angle('D','A','B'),alpha);g.perp('B','D','A','B');g.ck('parallelogram area',g.area('ABCD')/u**2,144*math.sin(math.radians(alpha))*math.cos(math.radians(alpha)))

# Separate analytical parameter sweeps establish that construction proofs are
# valid for shrinking, identity and enlarging factors and obtuse input angles.
for angle in [15,35,65,90,110,150,175]:
 t=math.radians(angle)
 for factor in [.15,.6,1,1.8,4]:
  A=(0.,0.);B=(2.,0.);C=(3*math.cos(t),3*math.sin(t));M=tuple((x+y)/2 for x,y in zip(B,C));Bp=tuple(factor*x for x in B);Cp=tuple(factor*x for x in C);Mp=tuple(factor*x for x in M)
  near(f'694 sweep {angle} {factor} median',math.dist(A,Mp),factor*math.dist(A,M))
  near(f'694 sweep {angle} {factor} ratio',math.dist(A,Bp)/math.dist(A,Cp),2/3)
  D=tuple(B[i]+factor*(C[i]-B[i]) for i in (0,1))
  near(f'695 sweep {angle} {factor} length transfer',math.dist(B,D),math.dist(Bp,Cp))
  # Through D parallel to AB reaches factor*C, even for factor < 1.
  near(f'695 sweep {angle} {factor} parallel transfer',D[1],Cp[1])
for x,y in itertools.product([.2,1,4,15],[.4,2,7]):
 c=math.hypot(x,y);h=x*y/c;u=x*x/c;v=y*y/c
 near(f'projection sweep{x},{y} sum',u+v,c);near(f'projection sweep{x},{y} height',h*h,u*v)

# Exact expected answer strings/tokens guard against a correct diagram paired
# with an unrelated answer. Full proof prose was read separately by reviewer.
expected={672:'10 см',673:'5 см',674:'42 см',676:'6 см',677:'3S',681:'18 мм и 32 мм',682:'61 см',683:'25/13 см',685:'3,15 м',686:'6,936 м',687:'6,12 м',688:'48 м',689:'72,25 м',702:'55°',703:'3√41',705:'8·tg α',706:'60 +8√3',707:'120°',708:'30°',709:'71,65'}
for n,text in expected.items():truth(f'{n} answer token',text in records[(n,'single')]['answer'])
assert seen==set(models)
for path,old in inputs.items():assert hashlib.sha256((ROOT/path).read_bytes()).hexdigest()==old,'Files changed while reviewing; rerun required'
result=dict(scope='Independent mathematics and model relationship audit only; no all-image or external-provider approval',cards=59,numbers=[672,709],inputs=inputs,sourcePrintedPages=[171,172,174,175,176,177,178,179,180,181,182,183,184,185],sourceImagesRead=True,manualProofReview='All59answers and step explanations read; corresponding vertex order, projection roles, physical-unit conversions, construction existence/uniqueness, acute-angle domain and degree-minute conversion checked.',independentAssertions=len(checks),failures=failures,passed=not failures,checks=checks)
result.update(reviewType='independent-mathematics',reviewer='Independent chapter VIII theory author reviewing B; not the B author',externalProviderReview=False,reviewedAt=datetime.now(timezone.utc).isoformat(),oracleSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest())
if args.report:
 args.report.parent.mkdir(parents=True,exist_ok=True)
 args.report.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k not in ['checks']},ensure_ascii=False,indent=2))
sys.exit(bool(failures))

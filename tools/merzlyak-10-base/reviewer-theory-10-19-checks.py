#!/usr/bin/env python3
"""Independent reviewer checks: read JSON only; no author-module imports or mutations.
Numerical examples do not replace the separately recorded general proof/source review.
"""
import json, math, random
from pathlib import Path
from collections import Counter
ROOT=Path(__file__).resolve().parents[2]
DIR=ROOT/'stereo-course/merzlyak-10-base/lessons'
checks=0

def ok(value,why=''):
 global checks
 checks+=1
 assert value,why

def close(x,y=0,why=''):
 if isinstance(x,(list,tuple)):
  ok(len(x)==len(y),why)
  for a,b in zip(x,y):close(a,b,why)
 else:ok(abs(x-y)<1e-7*max(1,abs(x),abs(y)),(why,x,y))
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def add(a,b):return tuple(x+y for x,y in zip(a,b))
def mul(a,k):return tuple(x*k for x in a)
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def norm(a):return math.sqrt(dot(a,a))
def dist(a,b):return norm(sub(a,b))
def normal(poly):return cross(sub(poly[1],poly[0]),sub(poly[2],poly[0]))
def area(poly):
 # Fan triangles: polygons used here are convex, independently checked below.
 return sum(norm(cross(sub(poly[i],poly[0]),sub(poly[i+1],poly[0])))/2 for i in range(1,len(poly)-1))
def polygon(poly,why):
 n=normal(poly);ok(norm(n)>1e-9,why)
 for p in poly:close(dot(n,sub(p,poly[0])),0,why)
 signs=[]
 for i in range(len(poly)):
  v=cross(sub(poly[(i+1)%len(poly)],poly[i]),sub(poly[(i+2)%len(poly)],poly[(i+1)%len(poly)]))
  signs.append(dot(v,n))
 ok(all(s>=-1e-8 for s in signs) or all(s<=1e-8 for s in signs),why)
 ok(area(poly)>0,why)
def cosine(a,o,b):return dot(sub(a,o),sub(b,o))/(dist(a,o)*dist(b,o))
def foot(x,a,b):
 v=sub(b,a);return add(a,mul(v,dot(sub(x,a),v)/dot(v,v)))
def plane_cos(a,b):return abs(dot(normal(a),normal(b)))/(norm(normal(a))*norm(normal(b)))
def line_distance(a,b,c,d):
 n=cross(sub(b,a),sub(d,c));return abs(dot(sub(c,a),n))/norm(n)
def lesson(n,k=None):return json.loads((DIR/(f'theory-{n:02d}'+(f'-detail-{k:02d}' if k else '')+'.json')).read_text())
def pts(n,k=None):return lesson(n,k)['visualization']['model']['points']
def pick(p,names):return [p[x] for x in names]
def perimeter(poly):return sum(dist(poly[i],poly[(i+1)%len(poly)]) for i in range(len(poly)))

files=sorted(ROOT/card['path'] for card in json.loads((ROOT/'tools/merzlyak-10-base/independent-review-theory-10-19.json').read_text())['cards'])
ok(len(files)==37,'27 details plus 10 overview cards')
for f in files:
 d=json.loads(f.read_text());m=d['visualization']['model'];p=m['points']
 for name,point in p.items():ok(len(point)==3 and all(math.isfinite(x) for x in point),(f.name,name))
 for edge in m['edges']:ok(len(edge)==2 and dist(*pick(p,edge))>1e-9,(f.name,edge))
 for face in m.get('faces',[]):polygon(pick(p,face),(f.name,face))
 for key,v in m['views'].items():
  for edge in v.get('segments',[]):ok(dist(*pick(p,edge))>1e-9,(f.name,key,edge))
  if v.get('polygon'):polygon(pick(p,v['polygon']),(f.name,key))
 for s in d['steps']:ok(s['view'] in m['views'],(f.name,s['id']))
 close(d['source']['pdfPages'],[x+1 for x in d['source']['printedPages']],f.name)

# Verify coverage references and corrections independently of author assertions.
cov=json.loads((ROOT/'tools/merzlyak-10-base/coverage-theory-10-19.json').read_text())
ok(len(cov['units'])==95)
ok(sum(u.get('isPrintedSourceUnit',True) for u in cov['units'])==94)
for u in cov['units']:
 close(u['sourcePdfPages'],[x+1 for x in u['sourcePrintedPages']],u['unitId'])
 for ref in u['coveredBy']:
  d=json.loads((ROOT/ref['lessonFile']).read_text());ok(d['id']==ref['lessonId'],u['unitId'])
  for s in ref.get('steps',[]):ok(s in [v['id'] for v in d['steps']],(u['unitId'],s))
u=next(u for u in cov['units'] if u['unitId']=='proof-comparison-inclines')
ok(u['kind']=='author_enrichment' and u['isPrintedSourceUnit'] is False)
text=json.dumps(lesson(13,3),ensure_ascii=False)
ok('ответ — 120°' in text and 'DB=17' in text and 'BC=10' in text,'original task 13.1 restored')

# Every detail model's substantive relationships; coordinate-free metric computations.
for n,k in [(10,1),(12,1),(13,2),(14,1),(16,1)]:
 p=pts(n,k)
 for a in 'ABCD':close(sub(p[a+'1'],p[a]),sub(p['A1'],p['A']))
 for a,b in [('B','D'),('B','A1'),('D','A1')]:close(dot(sub(p[a],p['A']),sub(p[b],p['A'])))
 if n in [10,12,13]:
  for a in ['B','D','A1']:close(dist(p['A'],p[a]),3)
p=pts(10,1);close(line_distance(p['A'],p['A1'],p['C'],p['D']),dist(p['A'],p['D']))
p=pts(10,2)
for a in 'ABC':close(dist(p['O'],p[a]),3);close(dist(p['M'],p[a]),math.sqrt(13))
p=pts(10,3)
for a in 'ABC':close(sub(p[a],p[a+'1']),[0,0,2])
p=pts(10,4);close(foot(p['M'],p['L'],p['R']),p['M']);close(foot(p['N'],p['A'],p['B']),p['N']);close(dist(p['M'],p['N']),line_distance(p['L'],p['R'],p['A'],p['B']))
for p,apex in [(pts(11,1),'M'),(pts(18,2),'D')]:
 for a,b,f in [('A','B','N'),('B','C','K'),('C','A','E')]:
  close(foot(p['O'],p[a],p[b]),p[f]);close(foot(p[apex],p[a],p[b]),p[f]);close(dist(p['O'],p[f]),1)
  t=dot(sub(p[f],p[a]),sub(p[b],p[a]))/dist(p[a],p[b])**2;ok(0<t<1)
 close(sum(area(pick(p,['O',a,b])) for a,b in [('A','B'),('B','C'),('C','A')]),area(pick(p,'ABC')))
p=pts(12,1);close(cosine(p['B1'],p['A'],p['B']),math.sqrt(.5))
p=pts(12,2);close(cosine(p['M'],p['A'],p['O']),cosine(p['M'],p['B'],p['O']));close(dist(p['O'],p['A']),dist(p['O'],p['B']))
p=pts(13,1)
for a,b in [('A','A1'),('B','B1')]:close(sub(p[a],p['O']),sub(p[b],p['O1']));close(dot(sub(p[a],p['O']),sub(p['R'],p['L'])))
close(cosine(p['A'],p['O'],p['B']),-.5)
p=pts(13,2);close(cosine(p['A'],p['D'],p['C']),0)
p=pts(13,3)
for a,b,v in [('A','B',16),('A','C',10),('B','C',10),('A','D',17),('B','D',17),('C','D',3*math.sqrt(39))]:close(dist(p[a],p[b]),v)
close(cosine(p['C'],p['M'],p['D']),-.5);close(plane_cos(pick(p,'ABC'),pick(p,'ABD')),.5)
p=pts(13,4)
for a,b,v in [('A','C',6),('M','B',4),('M','C',10),('A','M',8)]:close(dist(p[a],p[b]),v)
close(plane_cos(pick(p,'ABC'),pick(p,'AMC')),math.sqrt(3)/2)
p=pts(14,2);close(dot(normal(pick(p,['L','R','A'])),normal(pick(p,['L','R','B']))));close(dot(normal(pick(p,['O','B','A'])),normal(pick(p,['L','R','B']))))
p=pts(14,3)
for a,b,v in [('A','D',20),('C','D',13),('B','D',12)]:close(dist(p[a],p[b]),v)
close(cosine(p['A'],p['B'],p['C']),-.5);close(foot(p['B'],p['A'],p['C']),p['E']);close(line_distance(p['B'],p['D'],p['A'],p['C']),40*math.sqrt(3)/19)
p=pts(15,1);close(foot(p['M'],p['B'],p['C']),p['M']);close(p['A'][1:],p['M'][1:]);close(area(pick(p,'ABC')),area(pick(p,'ABM'))+area(pick(p,'AMC')))
close(area(pick(p,['A1','B1','C1']))/area(pick(p,'ABC')),plane_cos(pick(p,'ABC'),pick(p,['A1','B1','C1'])))
for a in 'ABCM':close(p[a+'1'],[p[a][0],p[a][1],0])
p=pts(16,1);ok(not any('A' in f and 'C1' in f for f in lesson(16,1)['visualization']['model']['faces']));ok(any('A' in f and 'C' in f for f in lesson(16,1)['visualization']['model']['faces']))
p=pts(16,2);close(p['X'],mul(add(p['A'],p['I']),.5));ok(max(abs(x) for x in p['X'][:2])>1)
faces=lesson(16,2)['visualization']['model']['faces'];counts=Counter(tuple(sorted((a,b))) for f in faces for a,b in zip(f,f[1:]+f[:1]));ok(set(counts.values())=={2});ok(len(counts)==20);ok(12-20+len(faces)==2)
n=normal(pick(p,['E','F','J']));ok(dot(sub(p['A'],p['E']),n)*dot(sub(p['K'],p['E']),n)<0)
p=pts(16,3)
for a in 'ABCD':close(sub(p[a+'1'],p[a]),sub(p['A1'],p['A']))
close(add(p['A'],p['C1']),add(p['C'],p['A1']))
p=pts(16,4);v=sub(p['A1'],p['A']);cut=pick(p,'MPN')
for a,f in [('A','M'),('B','P'),('C','N')]:close(foot(p[f],p[a],p[a+'1']),p[f])
for i in range(3):close(dot(v,sub(cut[(i+1)%3],cut[i])))
close(sum(area(pick(p,f)) for f in lesson(16,4)['visualization']['model']['faces'][2:]),perimeter(cut)*norm(v))
for k,names in [(5,'ABC'),(6,'ABCDEF')]:
 p=pts(16,k);base=pick(p,names)
 for i,a in enumerate(names):
  close(dist(base[i],base[(i+1)%len(base)]),dist(base[0],base[1]));close(cosine(base[i-1],base[i],base[(i+1)%len(base)]),math.cos((len(base)-2)*math.pi/len(base)));close(sub(p[a+'1'],p[a]),[0,0,3])
p=pts(17,1)
for a,b in [('A','C1'),('B','D1'),('C','A1'),('D','B1')]:close(mul(add(p[a],p[b]),.5),p['O'])
for a,b in [('A','D'),('B','C'),('A1','D1'),('B1','C1')]:close(sub(p[b],p[a]),sub(p['D'],p['A']))
p=pts(18,1)
for a in 'ABC':close(dist(p['D'],p[a]),math.sqrt(43/3))
for f,a,b in [('M','B','C'),('N','C','A'),('K','A','B')]:close(p[f],mul(add(p[a],p[b]),.5));close(foot(p['D'],p[a],p[b]),p[f]);close(dist(p['D'],p[f]),math.sqrt(31/3))
p=pts(18,2);base=area(pick(p,'ABC'));slat=sum(area(pick(p,['D',a,b])) for a,b in [('A','B'),('B','C'),('C','A')]);close(slat/base,math.sqrt(5))
for a,b in [('A','B'),('B','C'),('C','A')]:close(plane_cos(pick(p,['D',a,b]),pick(p,'ABC')),1/math.sqrt(5))
p=pts(18,3);ok(p['O'][0]>max(p[a][0] for a in 'ABCD'));close(sub(p['S'],p['O']),[0,0,3]);n=normal(pick(p,'SAC'));ok(dot(n,sub(p['B'],p['A']))*dot(n,sub(p['D'],p['A']))<0)
p=pts(18,4)
for a,b in [('A','B'),('A','C'),('B','C'),('S','A'),('S','B'),('S','C')]:close(dist(p[a],p[b]),2)
p=pts(19,1)
for a in 'ABCD':close(p[a+'1'],mul(add(p['S'],p[a]),.5))
close(foot(p['M1'],p['A'],p['B']),p['M']);close(dist(p['M'],p['M1']),dist(p['N'],p['N1']))
close(sum(area(pick(p,f)) for f in lesson(19,1)['visualization']['model']['faces'][2:]),(16+8)*dist(p['M'],p['M1'])/2)

# Overview examples, general proofs already reviewed in prose/source.
p=pts(10);close(dist(p['M'],p['A']),5);ok(dist(p['M'],p['A'])>dist(p['M'],p['B'])>dist(p['M'],p['O']))
p=pts(11)
for a,b in [('B','C'),('A','C'),('A','B')]:close(dot(sub(p['E'],p['D']),sub(p[b],p[a])))
p=pts(12);close(cosine(p['M'],p['A'],p['O']),math.sqrt(3)/2)
p=pts(13);close(cosine(p['A'],p['O'],p['B']),-.5)
p=pts(14);close(cosine(p['A'],p['O'],p['B']),0)
p=pts(15);close(area(pick(p,'ABC')),4);close(area(pick(p,['A','B1','C'])),2)
p=pts(16);ok(abs(dist(p['A'],p['B'])-dist(p['B'],p['C']))>.1);close(sub(p['A1'],p['A']),[0,0,3])
p=pts(17);close(dist(p['A'],p['C1']),math.sqrt(29));close(p['O'],mul(add(p['A'],p['C1']),.5))
p=pts(18);close(dist(p['S'],p['M']),math.sqrt(13));close(sum(area(pick(p,f)) for f in lesson(18)['visualization']['model']['faces'][1:]),8*math.sqrt(13))
p=pts(19);close(dist(p['O'],p['O1']),2);close(dist(p['M'],p['M1']),math.sqrt(5))

# Independent non-model families challenge generalisation, using deterministic data.
rng=random.Random(1019)
for repeat in range(80):
 # Orthogonal projection of an arbitrary tilted triangle: oriented cross-product area.
 xy=[(rng.uniform(-3,3),rng.uniform(-3,3)) for _ in range(3)]
 u,v,w=[rng.uniform(-2,2) for _ in range(3)]
 tri=[(x,y,u*x+v*y+w) for x,y in xy];proj=[(x,y,0) for x,y in xy]
 close(area(proj)/area(tri),1/math.sqrt(1+u*u+v*v))
 # General skew lines: solve the closest-point normal equations, not author coordinates.
 a=tuple(rng.uniform(-3,3) for _ in range(3));b=tuple(rng.uniform(-3,3) for _ in range(3));d=(1,0,0);e=(.5,1,0)
 ab=sub(b,a);dd=dot(d,d);ee=dot(e,e);de=dot(d,e);det=dd*ee-de*de
 t=(dot(ab,d)*ee-dot(ab,e)*de)/det;s=(dot(ab,d)*de-dot(ab,e)*dd)/det
 x=add(a,mul(d,t));y=add(b,mul(e,s));close(dot(sub(y,x),d));close(dot(sub(y,x),e));close(dist(x,y),line_distance(a,add(a,d),b,add(b,e)))
 # An affine cube has common diagonal centre, independently of right angles.
 base=tuple(rng.random() for _ in range(3));u=(2,.3,.2);v=(.2,2,.5);w=(.4,.1,3)
 center=add(base,mul(add(add(u,v),w),.5))
 vertices={bits:add(base,add(add(mul(u,bits[0]),mul(v,bits[1])),mul(w,bits[2]))) for bits in [(i,j,k) for i in (0,1) for j in (0,1) for k in (0,1)]}
 for bits,x in vertices.items():close(mul(add(x,vertices[tuple(1-i for i in bits)]),.5),center)
for n in range(3,10):
 for height in [.3,2,7]:
  base=[(2*math.cos(2*math.pi*i/n),2*math.sin(2*math.pi*i/n),0) for i in range(n)];s=(0,0,height);r=2*math.cos(math.pi/n);l=math.hypot(height,r)
  lateral=sum(area([s,base[i],base[(i+1)%n]]) for i in range(n));close(lateral,perimeter(base)*l/2);close(lateral,area(base)*l/r)
  for factor in [.2,.55,.85]:
   upper=[add(s,mul(sub(a,s),factor)) for a in base]
   frustum=sum(area([base[i],base[(i+1)%n],upper[(i+1)%n],upper[i]]) for i in range(n))
   close(frustum,(perimeter(base)+perimeter(upper))*(1-factor)*l/2)
print(json.dumps({'status':'PASS','cards':37,'newDetailCards':27,'overviewCards':10,'coverageUnits':94,'authorEnrichments':1,'independentAssertions':checks,'generalFamilies':{'randomProjectionTriangles':80,'randomCommonPerpendiculars':80,'affineParallelepipeds':80,'regularPyramids':21,'regularFrustums':63}}))

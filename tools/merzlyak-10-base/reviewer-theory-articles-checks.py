#!/usr/bin/env python3
"""Independent article checks: no author imports; all conditions recomputed from JSON."""
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


files=[DIR/f'theory-15-detail-{i:02d}.json' for i in range(2,6)]+[DIR/f'theory-19-detail-{i:02d}.json' for i in range(2,11)]
for f in files:
 ok(f.is_file(),f.name)
 d=json.loads(f.read_text());m=d['visualization']['model'];p=m['points']
 for name,x in p.items():ok(len(x)==3 and all(math.isfinite(t) for t in x),(f.name,name))
 for edge in m['edges']:ok(dist(*pick(p,edge))>1e-8,(f.name,edge))
 for face in m.get('faces',[]):polygon(pick(p,face),(f.name,face))
 for key,v in m['views'].items():
  for edge in v.get('segments',[]):ok(dist(*pick(p,edge))>1e-8,(f.name,key,edge))
  if v.get('polygon'):polygon(pick(p,v['polygon']),(f.name,key))
  shown=set(m.get('labelNames',[])+v.get('points',[])+v.get('polygon',[])+sum(v.get('segments',[]),[]));shown={n for n in shown if not n.startswith('_') or n in m.get('labels',{})}
  ok(len(shown)<=8,(f.name,key,sorted(shown)))
 for s in d['steps']:ok(s['view'] in m['views'],(f.name,s['id']))
 close(d['source']['pdfPages'],[x+1 for x in d['source']['printedPages']],f.name)

# Whole midpoint plane: both inclusions, with independently solved endpoints.
rng=random.Random(1519)
for repeat in range(100):
 x,y=rng.uniform(-100,100),rng.uniform(-100,100)
 # a=(0,0,2)+t(1,2,0), b=(0,0,0)+s(-2,1,0).
 # C=(x,y,1) means t-2s=2x and2t+s=2y.
 t=(2*x+4*y)/5;s=(-4*x+2*y)/5
 a=(t,2*t,2);b=(-2*s,s,0)
 close(mul(add(a,b),.5),(x,y,1));ok(dist(a,b)>=2)
 # Arbitrary perpendicular projection plane and random skew second line.
 v=(1,2,3);unit=mul(v,1/norm(v));B=tuple(rng.uniform(-5,5) for _ in range(3));w=tuple(rng.uniform(-2,2) for _ in range(3));O=(0,0,0)
 project=lambda z:sub(z,mul(unit,dot(z,unit)))
 q=project(B);r=project(add(B,w));close(dist(O,foot(O,q,r)),line_distance(O,v,B,add(B,w)))
 # Interior and exterior witness radii for the ball examples.
 R=rng.uniform(1,10);rad=R*rng.uniform(0,.999);small=(R-rad)/2
 ok(small>0 and rad+small<R)
 outside=R+rng.uniform(.001,10);small=(outside-R)/2
 ok(small>0 and outside-small>R)

# Necessary regular-polyhedron incidence pairs; counts from Euler and double counting.
pairs=[(n,k) for n in range(3,21) for k in range(3,21) if k*(n-2)<2*n]
ok(pairs==[(3,3),(3,4),(3,5),(4,3),(5,3)],pairs)
expected={(3,3):(4,6,4),(4,3):(8,12,6),(3,4):(6,12,8),(5,3):(20,30,12),(3,5):(12,30,20)}
for n,k in pairs:
 edges=2/(2/n+2/k-1);vertices=2*edges/k;faces=2*edges/n
 close([vertices,edges,faces],expected[n,k])

# Current cube constructions, rather than a substitute cube.
p=pts(15,3)
close(foot(p['M'],p['A'],p['A2']),p['M']);close(foot(p['N'],p['B'],p['B2']),p['N']);close(dist(p['M'],p['N']),line_distance(p['A'],p['A2'],p['B'],p['B2']));close(dist(p['P'],p['Q'])**2,dist(p['P'],p['H'])**2+dist(p['Q'],p['H'])**2)
p=pts(15,4)
for X,F in [('P',['A','C','B1']),('Q',['A1','C1','D'])]:
 close(dot(sub(p[X],p[F[0]]),normal(pick(p,F))));close(foot(p[X],p['B'],p['D1']),p[X])
close(foot(p['P'],p['N'],p['C']),p['P']);close(foot(p['Q'],p['A1'],p['M']),p['Q']);close(dist(p['B'],p['P']),dist(p['P'],p['Q']));close(dist(p['D1'],p['Q']),dist(p['P'],p['Q']));close(dist(p['P'],p['Q']),line_distance(p['A1'],p['C1'],p['B1'],p['C']))
p=pts(15,5);n=normal(pick(p,['A','B','C1']))
for original,result in [('A1','M'),('B1','K'),('C','K')]:
 projection=sub(p[original],mul(n,dot(sub(p[original],p['A']),n)/dot(n,n)));close(projection,p[result])
close(foot(p['K'],p['M'],p['C1']),p['H']);close(dist(p['K'],p['H']),line_distance(p['A1'],p['C1'],p['B1'],p['C']))

# Corrected midpoint construction: every labelled point has its asserted role.
p=pts(15,2)
for x,a,b in [('C','A','B'),('C2','A2','B2'),('C0','A0','B0'),('U','A','B0'),('V','A0','B')]:
 close(p[x],mul(add(p[a],p[b]),.5),('midpoint',x))
close(add(p['C0'],p['C']),add(p['U'],p['V']),'parallelogram')
for a,b in [('C0','U'),('C0','V')]:close(p[a][2],p[b][2])
ok(norm(cross(sub(p['U'],p['C0']),sub(p['V'],p['C0'])))>0)
p=pts(15,5)
close(foot(p['P'],p['B1'],p['C']),p['P']);close(foot(p['Q'],p['A1'],p['C1']),p['Q'])
close(dot(sub(p['Q'],p['P']),sub(p['C'],p['B1'])));close(dot(sub(p['Q'],p['P']),sub(p['C1'],p['A1'])))
close(dist(p['P'],p['Q']),dist(p['K'],p['H']))

# All five actual regular solids, not a coordinate family substituted for them.
# Surface vertices are derived from faces, so construction points do not change V.
regular_cases=[(18,4,3,3),(19,2,4,3),(19,3,5,3),(19,4,3,4),(19,5,3,5),(19,6,3,4)]
for para,part,n,k in regular_cases:
 m=lesson(para,part)['visualization']['model'];p=m['points'];faces=m['faces'];verts=set(sum(faces,[]));inc=Counter()
 for face in faces:
  ok(len(face)==n);poly=pick(p,face);polygon(poly,(para,part,face));unit=normal(poly)
  signs=[dot(unit,sub(p[v],poly[0])) for v in verts]
  ok(all(t>=-1e-8 for t in signs) or all(t<=1e-8 for t in signs),'convex supporting plane')
  for i,v in enumerate(face):
   inc[tuple(sorted((v,face[(i+1)%n])))]+=1
   close(cosine(p[face[i-1]],p[v],p[face[(i+1)%n]]),math.cos((n-2)*math.pi/n),'regular face angle')
 edges=list(inc);ok(set(inc.values())=={2},'closed surface')
 base=dist(*pick(p,edges[0]))
 for e in edges:close(dist(*pick(p,e)),base,'all equal edges')
 degrees=Counter(v for e in edges for v in e);ok(set(degrees.values())=={k},'uniform vertex degree')
 close([len(verts),len(edges),len(faces)],expected[n,k]);close(len(verts)-len(edges)+len(faces),2)
 # A single cyclic link at every vertex rules out glued/disconnected local sheets.
 for v in verts:
  link={}
  for f in faces:
   if v in f:
    i=f.index(v);a,b=f[i-1],f[(i+1)%n];link.setdefault(a,set()).add(b);link.setdefault(b,set()).add(a)
  ok(len(link)==k and all(len(q)==2 for q in link.values()))
  seen=set();todo=[next(iter(link))]
  while todo:
   x=todo.pop()
   if x not in seen:seen.add(x);todo.extend(link[x]-seen)
  ok(seen==set(link),'connected link')
 # All incident edge/face angles have the stated strict sum.
 close(k*math.degrees(math.acos(math.cos((n-2)*math.pi/n))),k*(n-2)*180/n)
 ok(k*(n-2)*180/n<360)

# The added section is the actual midpoint cut through all four incident edges.
p=pts(19,6);cut=pick(p,['V1','V2','V3','V4']);polygon(cut,'vertex section')
for v,q in [('V1','P5'),('V2','P4'),('V3','P6'),('V4','P3')]:close(p[v],mul(add(p['P1'],p[q]),.5))
angle_sum=sum(math.acos(cosine(cut[i],p['P1'],cut[(i+1)%4])) for i in range(4))
close(angle_sum,4*math.pi/3);ok(angle_sum<2*math.pi)
for i,v in enumerate(cut):
 side_sum=math.acos(cosine(cut[i-1],v,p['P1']))+math.acos(cosine(p['P1'],v,cut[(i+1)%4]))
 ok(side_sum>math.acos(cosine(cut[i-1],v,cut[(i+1)%4])))

# Great-circle wireframes honestly represent sphere boundaries; all samples,
# not just a handful of visually plausible points, obey the radii in captions.
for part,spheres in [(7,[('_outer','O',3),('_inner','X',.5)]),(8,[('_ball','O',3),('_outside','A',1)]),(9,[('_left','O',1),('_right','O1',1)]),(10,[('_left','O',1),('_right','O1',1),('_tiny','X',.25)])]:
 p=pts(19,part)
 for prefix,center,radius in spheres:
  samples=[x for name,x in p.items() if name.startswith(prefix+'_')];ok(len(samples)==72)
  for x in samples:close(dist(x,p[center]),radius,(part,prefix))
p=pts(19,7);close(dist(p['O'],p['X']),2);ok(dist(p['X'],p['Y'])<.5 and dist(p['O'],p['Y'])<3);ok(dist(p['X'],p['Z'])<.5);ok(dist(p['Z'],foot(p['Z'],p['A'],p['B']))>0)
p=pts(19,8);close(dist(p['O'],p['A']),5);ok(dist(p['A'],p['Y'])<1 and dist(p['O'],p['Y'])>3);close(foot(p['X'],p['P'],p['Q']),p['X']);ok(0<dist(p['P'],p['X'])<dist(p['P'],p['Q']))
p=pts(19,9);close(dist(p['O'],p['O1'])-2,2);close(dist(p['O'],p['A']),1);ok(dist(p['O'],p['I'])<1 and dist(p['O'],p['E'])>1 and dist(p['O1'],p['E'])>1)
p=pts(19,10);close(dist(p['O'],p['A']),1);close(dist(p['O1'],p['B']),1);close(foot(p['X'],p['A'],p['B']),p['X']);ok(dist(p['Y'],p['O'])>1 and dist(p['Y'],p['O1'])>1 and dist(p['Y'],foot(p['Y'],p['A'],p['B']))>0)
# Every positive neighbourhood radius has an off-connector point outside G.
for j in range(1,101):
 radius=j/50;delta=min(radius/2,.5);y=add(p['X'],(0,delta,0))
 ok(dist(y,p['X'])<radius and dist(y,p['O'])>1 and dist(y,p['O1'])>1)

# Check exact inventory references without importing any authoring helper.
manifest=json.loads((ROOT/'tools/merzlyak-10-base/coverage-theory-articles.json').read_text())
ok(len(manifest['units'])==46 and len({u['unitId'] for u in manifest['units']})==46)
ok(len(manifest['newCards'])==13);ids={u['unitId'] for u in manifest['units']}
for u in manifest['units']:
 ok(bool(u['sourcePdfPages']) and set(u['sourcePdfPages'])<=set(manifest['sourcePdfPagesVisuallyChecked']))
 for ref in u['coveredBy']:
  d=json.loads((ROOT/ref['lessonFile']).read_text());ok(d['id']==ref['lessonId'],ref)
for c in manifest['newCards']:
 d=json.loads((ROOT/c['lessonFile']).read_text());ok(d['id']==c['lessonId']);ok(d['source']['subpart']==c['part']);ok(c['sourcePdfPages']==d['source']['pdfPages']);ok(set(c['sourceUnits'])<=ids)
 entry=next(e for e in manifest['entries'] if e['paragraph']==c['paragraph']);ok(c['part'] in entry['requiredPartsToAppend'] and c['part'] in entry['requiredParts'])

print(json.dumps({'status':'PASS','cards':len(files),'independentAssertions':checks,'randomFamilySamples':100,'classificationPairs':pairs,'actualRegularModelsChecked':6,'inventoryUnitsChecked':46}))

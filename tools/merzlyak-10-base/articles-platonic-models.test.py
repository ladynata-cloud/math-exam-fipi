#!/usr/bin/env python3
"""Independent geometric checks for the six Platonic article scene models.
No generator/scipy imports and no mutations to course materials. Auxiliary O/SO
in the tetrahedron height drawing are distinguished from polyhedron vertices/edges.
"""
from collections import Counter,defaultdict
from copy import deepcopy
from fractions import Fraction
import hashlib,json,math,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
COURSE=ROOT/'stereo-course/merzlyak-10-base/lessons'
# name: (vertices, edges, faces, vertices per face n, degree at vertex k)
EXPECTED={
 'theory-18-detail-04':(4,6,4,3,3),
 'theory-19-detail-02':(8,12,6,4,3),
 'theory-19-detail-03':(20,30,12,5,3),
 'theory-19-detail-04':(6,12,8,3,4),
 'theory-19-detail-05':(12,30,20,3,5),
 'theory-19-detail-06':(6,12,8,3,4),
}
TOL=1e-8

def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def norm(a):return math.sqrt(dot(a,a))
def mean(points):return tuple(sum(p[i] for p in points)/len(points) for i in range(3))
def edge(a,b):return tuple(sorted((a,b)))
def near(x,y,scale=1):
 assert abs(x-y)<=TOL*max(1,abs(x),abs(y),scale),(x,y)
def connected(graph):
 if not graph:return False
 start=next(iter(graph));seen={start};todo=[start]
 while todo:
  for item in graph[todo.pop()]:
   if item not in seen:seen.add(item);todo.append(item)
 return seen==set(graph)

def polygon_normal(face,p,scale):
 assert len(face)>=3 and len(set(face))==len(face)
 u=sub(p[face[1]],p[face[0]]);v=sub(p[face[2]],p[face[0]])
 normal=cross(u,v);length=norm(normal);assert length>TOL*scale*scale
 normal=tuple(x/length for x in normal)
 for name in face:near(dot(normal,sub(p[name],p[face[0]])),0,scale)
 return normal

def check_model(name,model):
 expected=EXPECTED[name];V,E,F,n,k=expected
 p=model['points'];faces=model['faces'];vertices={x for face in faces for x in face}
 assert len(vertices)==V and len(faces)==F,(name,len(vertices),len(faces))
 assert len({frozenset(f) for f in faces})==F,'duplicate face'
 assert all(len(face)==n for face in faces),'wrong face arity'
 assert all(len(x)==3 and all(math.isfinite(c) for c in x) for x in p.values())
 aux={'O'} if name=='theory-18-detail-04' else {'V1','V2','V3','V4'} if name=='theory-19-detail-06' else set()
 assert set(p)==vertices|aux,'unaccounted model point'
 centre=mean([p[v] for v in vertices]);length=math.dist(p[faces[0][0]],p[faces[0][1]])
 assert length>TOL
 for a in vertices:
  for b in vertices:
   if a!=b:assert math.dist(p[a],p[b])>TOL*length,'duplicate vertex coordinates'
 edge_faces=defaultdict(list);adj={v:set() for v in vertices};face_adj={i:set() for i in range(F)}
 incident_faces=Counter();volume=0
 for i,face in enumerate(faces):
  normal=polygon_normal(face,p,length)
  sides=[dot(normal,sub(p[x],p[face[0]])) for x in vertices if x not in face]
  # Every listed face must be the entire exposed supporting face; no other
  # polyhedron vertex may lie in its plane, and none may lie on the wrong side.
  assert sides and (all(x>TOL*length for x in sides) or all(x<-TOL*length for x in sides)),'non-supporting/incomplete face'
  if dot(normal,sub(centre,p[face[0]]))>0:normal=tuple(-x for x in normal)
  assert dot(normal,sub(centre,p[face[0]]))<-TOL*length
  for j,b in enumerate(face):
   a,c=face[j-1],face[(j+1)%n];u,v=sub(p[a],p[b]),sub(p[c],p[b])
   near(norm(u),length,length);near(norm(v),length,length)
   near(dot(u,v)/(norm(u)*norm(v)),math.cos(math.pi*(n-2)/n))
   # The polygon order must be simple and convex, not a star/disordered cycle.
   turn=dot(cross(sub(p[b],p[a]),sub(p[c],p[b])),normal)
   if j==0:sign=1 if turn>0 else -1
   assert sign*turn>TOL*length*length
   e=edge(b,c);edge_faces[e].append(i);adj[b].add(c);adj[c].add(b);incident_faces[b]+=1
  area=sum(norm(cross(sub(p[face[j]],p[face[0]]),sub(p[face[j+1]],p[face[0]])))/2 for j in range(1,n-1))
  near(area,n*length*length/(4*math.tan(math.pi/n)),length*length)
  volume+=area*abs(dot(normal,sub(p[face[0]],centre)))/3
 assert volume>TOL*length**3
 assert len(edge_faces)==E and all(len(fs)==2 for fs in edge_faces.values()),'surface is not a closed 2-manifold at edges'
 assert connected(adj),'disconnected vertex graph'
 assert set(map(len,adj.values()))=={k} and set(incident_faces.values())=={k},'wrong or unequal vertex degrees'
 for fs in edge_faces.values():face_adj[fs[0]].add(fs[1]);face_adj[fs[1]].add(fs[0])
 assert connected(face_adj),'disconnected surface'
 # Edge-manifoldness alone does not exclude pinched vertices. Each vertex link
 # must be one connected cycle of its k neighbours.
 for vertex in vertices:
  link={x:set() for x in adj[vertex]}
  for face in faces:
   if vertex not in face:continue
   j=face.index(vertex);a,b=face[j-1],face[(j+1)%n];link[a].add(b);link[b].add(a)
  assert connected(link) and all(len(neighbours)==2 for neighbours in link.values()),'nonmanifold vertex link'
 assert V-E+F==2 and n*F==2*E and k*V==2*E
 assert k*(n-2)<2*n,'regular face angles cannot form a convex vertex'
 scene_edges=[edge(*e) for e in model['edges']]
 assert len(scene_edges)==len(set(scene_edges)),'duplicate rendered edge'
 assert set(edge_faces)<=set(scene_edges),'missing rendered polyhedron edge'
 extra=set(scene_edges)-set(edge_faces)
 assert extra==({edge('S','O')} if name=='theory-18-detail-04' else set()),'unexplained rendered extra edge'
 for a,b in scene_edges:assert a in p and b in p and math.dist(p[a],p[b])>TOL*length
 radii=[math.dist(p[x],centre) for x in vertices]
 for radius in radii:near(radius,radii[0],length)
 for view in model['views'].values():
  assert all(x in p for x in view.get('points',[]))
  for a,b in view.get('segments',[]):assert a in p and b in p and math.dist(p[a],p[b])>TOL*length
  if view.get('polygon'):polygon_normal(view['polygon'],p,length)
 if name=='theory-18-detail-04':
  near(math.dist(p['S'],p['O']),length*math.sqrt(2/3),length)
  near(math.dist(p['A'],p['O']),length/math.sqrt(3),length)
  for a,b in [('A','B'),('A','C')]:near(dot(sub(p['S'],p['O']),sub(p[b],p[a])),0,length*length)
  near(dot(polygon_normal(['A','B','C'],p,length),sub(p['O'],p['A'])),0,length)
 if name=='theory-19-detail-06':
  # The explanatory cut must be the whole intersection with x=-1/2,
  # not four arbitrary coplanar points. Recompute it from all12 body edges.
  near(p['P1'][0],-1);assert len(adj['P1'])==4
  cut=-.5;intersections=[]
  for a,b in edge_faces:
   da,db=p[a][0]-cut,p[b][0]-cut
   if da*db<0:
    t=-da/(db-da);intersections.append(tuple(p[a][i]+t*(p[b][i]-p[a][i]) for i in range(3)))
   elif abs(da)<=TOL:intersections.append(tuple(p[a]))
   elif abs(db)<=TOL:intersections.append(tuple(p[b]))
  assert len(intersections)==4
  for x in aux:
   near(p[x][0],cut)
   assert sum(math.dist(p[x],q)<TOL for q in intersections)==1
   assert sum(math.dist(p[x],mean([p['P1'],p[neighbour]]))<TOL for neighbour in adj['P1'])==1
  section=model['views']['section'];assert set(section['polygon'])==aux and len(section['polygon'])==4
  assert {edge(*seg) for seg in section['segments']}=={edge('P1',x) for x in aux}
  polygon_normal(section['polygon'],p,length)
 return {'model':name,'V':V,'E':E,'F':F,'n':n,'k':k,'edgeLength':length}

def must_reject(name,model):
 try:check_model(name,model)
 except AssertionError:return
 raise AssertionError('Negative regression unexpectedly accepted')

def main():
 models={};results=[]
 for name in EXPECTED:
  path=COURSE/(name+'.json');lesson=json.loads(path.read_text());model=lesson['visualization']['model'];models[name]=model
  result=check_model(name,model);result['sha256']=hashlib.sha256(path.read_bytes()).hexdigest();results.append(result)
 # Exact rational arithmetic verifies all possible integer pairs, and the
 # elementary bound k<6, n<6 proves the finite search has omitted no pair.
 valid={(n,k) for n in range(3,6) for k in range(3,6) if k*(n-2)<2*n}
 assert valid=={(3,3),(4,3),(5,3),(3,4),(3,5)}
 assert {(row['n'],row['k']) for row in results}==valid
 for k in range(6,30):assert 2+Fraction(4,k-2)<=3
 for n in range(6,30):assert 3*(n-2)>=2*n
 # Independent tests must fail when a geometric or topological condition is lost.
 name='theory-19-detail-03';bad=deepcopy(models[name]);bad['faces'].pop();must_reject(name,bad)
 bad=deepcopy(models[name]);bad['points']['P1'][0]+=.01;must_reject(name,bad)
 bad=deepcopy(models[name]);bad['faces'][0][1],bad['faces'][0][2]=bad['faces'][0][2],bad['faces'][0][1];must_reject(name,bad)
 bad=deepcopy(models[name]);bad['edges'].pop();must_reject(name,bad)
 print(json.dumps({'result':'PASS','independent':True,'models':results,'validPairs':sorted(valid),'negativeRegressions':4,'checks':'regular equal faces; convex supporting planes; equal edges; connected closed manifold including vertex links; counts/degrees/Euler; tetrahedron height; every view polygon/segment'},ensure_ascii=False))
if __name__=='__main__':main()

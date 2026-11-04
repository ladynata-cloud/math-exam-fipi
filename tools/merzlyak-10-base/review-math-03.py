"""Independent review assertions for Merzlyak 10 base course models.

Requires Python 3 and NumPy. Does not import the lesson-authoring generators.
Run from any directory. Optional --report PATH writes the individual assertions.
These numerical checks supplement the source and proof review in chapter1-review.json;
they do not certify general theorems, browser rendering or release approval.
"""
import argparse
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--report',help='Optional JSON assertion report path')
args=parser.parse_args()
import json,math
from pathlib import Path
import numpy as np
root=Path(__file__).resolve().parents[2]/'stereo-course/merzlyak-10-base/lessons'
results=[];cache={}
def near(a,b=0):return np.linalg.norm(np.asarray(a)-np.asarray(b))<2e-7
def check(k,name,cond):
 results.append({'card':k,'check':name,'passed':bool(cond)})
 if not cond:print('FAIL',k,name)
def line(p,a,b,c):return near(np.cross(p[b]-p[a],p[c]-p[a]))
def plane(p,ns):return np.linalg.matrix_rank(np.array([p[n]-p[ns[0]] for n in ns[1:]]),tol=2e-7)<=2
def length(p,a,b):return np.linalg.norm(p[a]-p[b])
def insegment(p,x,a,b):
 t=np.dot(p[x]-p[a],p[b]-p[a])/np.dot(p[b]-p[a],p[b]-p[a]);return line(p,a,b,x) and -1e-7<=t<=1+1e-7
for f in sorted(root.glob('ex-03-*.json')):
 d=json.loads(f.read_text());m=d['visualization']['model'];p={k:np.array(v,float)for k,v in m['points'].items()};k=f.stem;cache[k]=(d,m,p)
 check(k,'all finite3D',all(v.shape==(3,)and np.isfinite(v).all()for v in p.values()))
 for i,ns in enumerate(m.get('faces',[])+[v['polygon']for v in m['views'].values()if 'polygon'in v]):
  check(k,f'polygon{i} planar',plane(p,ns))
  check(k,f'polygon{i} nondegenerate',np.linalg.matrix_rank(np.array([p[n]-p[ns[0]]for n in ns[1:]]),tol=2e-7)==2)
sections={3:['A','S','D'],4:['S','D','M'],7:None,8:['A','B','C1'],9:['E','F','M'],10:['D','E','C1'],11:['A','E','D'],19:['E','F','M'],20:['E','B1','F'],21:['E','F','K'],22:['M','N','K'],23:['M','N','K'],26:['E','F','K'],27:['B','A1','E'],29:['M','N','K']}
for k,(d,m,p)in cache.items():
 n=int(d['source']['exercise'].split('.')[1]);ns=sections.get(n)
 if n==7:ns=['A','C','B1']if d['source']['subpart']=='1'else['B','D','C1']
 if ns is None:continue
 normal=np.cross(p[ns[1]]-p[ns[0]],p[ns[2]]-p[ns[0]]);normal/=np.linalg.norm(normal)
 actual=[]
 for a,b in m['edges']:
  da=np.dot(normal,p[a]-p[ns[0]]);db=np.dot(normal,p[b]-p[ns[0]])
  for q in ([p[a]]if abs(da)<1e-8 else [])+([p[b]]if abs(db)<1e-8 else []):
   if not any(near(q,r)for r in actual):actual.append(q)
  if da*db<0:
   q=p[a]+(-da/(db-da))*(p[b]-p[a])
   if not any(near(q,r)for r in actual):actual.append(q)
 poly=m['views']['section']['polygon'];verts=[p[q]for q in poly]
 check(k,'section all corners present',len(actual)==len(verts)and all(any(near(q,r)for r in verts)for q in actual))
 check(k,'section vertices on defining plane',all(abs(np.dot(normal,q-p[ns[0]]))<2e-7 for q in verts))
 check(k,'section edge consecutive vertices share solid face',all(any(plane(p,face+[poly[i],poly[(i+1)%len(poly)]])for face in m['faces'])for i in range(len(poly))))
 # Convex boundary has consistent turn sign.
 turns=[np.dot(np.cross(verts[(i+1)%len(verts)]-verts[i],verts[(i+2)%len(verts)]-verts[(i+1)%len(verts)]),normal)for i in range(len(verts))]
 check(k,'section ordered convex polygon',all(t>1e-8 for t in turns)or all(t<-1e-8 for t in turns))
relations={3:[('D','B','C')],4:[('D','B','C'),('M','S','P'),('P','A','C')],5:[('M','S','A'),('K','S','B'),('X','M','K'),('X','A','B')],6:[('M','S','A'),('K','S','C'),('X','M','K'),('X','A','C')],9:[('E','A1','B1'),('F','B','B1'),('M','B1','C1')],10:[('D','A','C'),('E','B','C'),('X','D','E'),('X','A','B'),('H','D','C1'),('H','A','A1')],11:[('D','C','C1'),('E','B','C'),('H','E','D'),('H','B1','C1'),('J','A','D'),('J','A1','C1')],12:[('M','S','U'),('K','S','V'),('U','A','B'),('V','B','C'),('X','M','K'),('X','U','V')],13:[('M','S','U'),('K','S','V'),('U','A','B'),('V','C','D'),('X','M','K'),('X','U','V')],14:[('X','A','B'),('X','C','D')],15:[('X','A','E'),('X','B','C')],16:[('E','A','B'),('F','C','D')],17:[('K','B','D'),('X','C','K'),('X','A','B')],18:[('M','A','D'),('K','C','D'),('X','M','K'),('X','B','C')],19:[('E','A','B'),('F','A','D'),('M','C','C1')],20:[('E','A','A1'),('F','C','C1')],21:[('E','B','B1'),('F','C','C1'),('K','D','D1')],22:[('M','A','B'),('K','B','D'),('N','C','D')],23:[('M','A','B'),('K','B','C'),('N','C','D')],24:[('E','A','C'),('F','B','D'),('M','C','D'),('K','C','M'),('X','A','M'),('X','E','K'),('Y','B','M'),('Y','F','K')],25:[('E','M','B'),('F','M','C'),('X','A','C'),('X','B','D'),('Y','C','E'),('Y','B','F')],26:[('E','M','B'),('F','M','C'),('K','M','A'),('N','E','K'),('N','A','B')],27:[('E','C','C1')],29:[('M','D','U'),('N','D','V'),('K','D','W'),('U','A','B'),('V','B','C'),('W','C','A')]}
for k,(d,m,p)in cache.items():
 n=int(d['source']['exercise'].split('.')[1])
 for x,a,b in relations.get(n,[]):check(k,f'{x} on {a}{b}',line(p,a,b,x))
k='ex-03-028';d,m,p=cache[k]
check(k,'30faces',len(m['faces'])==30)
for i,ns in enumerate(m['faces']):
 edges=[p[ns[(j+1)%4]]-p[ns[j]]for j in range(4)]
 check(k,f'face{i} unit square',len(ns)==4 and all(near(np.linalg.norm(e),1)for e in edges)and all(near(np.dot(edges[j],edges[(j+1)%4]))for j in range(4)))
k='ex-03-031';d,m,p=cache[k]
check(k,'AB=BC=CD and AC=AD',near(length(p,'A','B'),length(p,'B','C'))and near(length(p,'A','B'),length(p,'C','D'))and near(length(p,'A','C'),length(p,'A','D')))
angle=math.degrees(math.acos(np.dot(p['B']-p['A'],p['D']-p['A'])/length(p,'A','B')/length(p,'A','D')));check(k,'angleA72',near(angle,72))
k='ex-03-032';d,m,p=cache[k]
check(k,'G centroid',near(p['G'],(p['A']+p['B']+p['C'])/3))
check(k,'EFparallelAC',near(np.cross(p['F']-p['E'],p['C']-p['A'])))
area=lambda a,b,c:np.linalg.norm(np.cross(p[b]-p[a],p[c]-p[a]))/2
check(k,'area ratio4/9',near(area('E','B','F')/area('A','B','C'),4/9))

auxiliary={
 '009-a':[('P','E','F','A','B'),('Q','F','M','B','C')],
 '009-b':[('V','E','F','A','A1'),('U','E','M','A1','D1')],
 '009-c':[('P','E','F','A','B'),('Q','F','M','B','C'),('R','F','M','C','C1'),('T','E','M','C1','D1')],
 '009-d':[('P','E','F','A','B'),('Q','F','M','B','C'),('R','F','M','C','C1'),('T','E','M','C1','D1'),('V','E','F','A','A1'),('U','E','M','A1','D1')],
 '019':[('X','E','F','B','C'),('Y','E','F','C','D'),('R','X','M','B','B1'),('Q','Y','M','D','D1')],
 '020':[('X','E','B1','A','B'),('Y','B1','F','B','C'),('P','X','Y','A','D'),('Q','X','Y','C','D')],
 '021':[('X','E','F','B','C'),('Y','F','K','C','D'),('Z','X','Y','A','B'),('L','Z','E','A','A1')],
 '022':[('X','K','N','B','C'),('P','M','X','A','C')],
 '023':[('X','M','K','A','C'),('P','N','X','A','D')],
 '024':[('X','A','M','E','K'),('Y','B','M','F','K')],
 '026':[('P','E','F','B','C'),('N','E','K','A','B'),('R','P','N','C','D')],
 '027':[('F','B','E','B1','C1'),('G','A1','F','C1','D1')],
 '029':[('U','D','M','A','B'),('V','D','N','B','C'),('W','D','K','C','A'),('X','M','N','U','V'),('Y','M','K','U','W'),('Z','X','Y','A','B'),('L','X','Y','B','C'),('H','X','Y','C','A'),('P','M','Z','A','D'),('Q','M','Z','B','D')],
 '030':[('P','A','B','A1','B1'),('Q','B','C','B1','C1'),('R','C','D','C1','D1')]
}
for suffix,items in auxiliary.items():
 k='ex-03-'+suffix;d,m,p=cache[k]
 for x,a,b,c,e in items:
  check(k,f'auxiliary {x} is {a}{b} intersection {c}{e}',line(p,a,b,x) and line(p,c,e,x))
  check(k,f'auxiliary {x} intersection unique',not near(np.cross(p[b]-p[a],p[e]-p[c])))
k='ex-03-030';d,m,p=cache[k]
check(k,'PQR are not collinear',not line(p,'P','Q','R'))

if args.report:
 Path(args.report).write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
print(len(results),'checks',sum(not r['passed']for r in results),'failures')

raise SystemExit(0 if all(r["passed"] for r in results) else 1)

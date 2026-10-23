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
results=[]
def model(a,b):return json.loads((root/f'ex-{a:02}-{b:03}.json').read_text())['visualization']['model']
def pts(a,b):return {k:np.array(v,float) for k,v in model(a,b)['points'].items()}
def check(a,b,name,cond):
 results.append({'exercise':f'{a}.{b}','check':name,'passed':bool(cond)})
 if not cond:print('FAIL',a,b,name)
def near(a,b=0):return np.linalg.norm(np.asarray(a)-np.asarray(b))<1e-8
def col(p,*names):return near(np.cross(p[names[1]]-p[names[0]],p[names[2]]-p[names[0]]))
def dist(p,a,b):return float(np.linalg.norm(p[a]-p[b]))
def par(p,a,b,c,d):return near(np.cross(p[b]-p[a],p[d]-p[c]))
def mid(p,m,a,b):return near(p[m],(p[a]+p[b])/2)
def planar(p,names):
 ar=np.array([p[n]-p[names[0]] for n in names[1:]])
 return np.linalg.matrix_rank(ar,tol=1e-9)<=2
for a,maxb in [(1,27),(2,20)]:
 for b in range(1,maxb+1):
  m=model(a,b);p=pts(a,b)
  check(a,b,'all finite 3D coordinates',all(v.shape==(3,) and np.isfinite(v).all() for v in p.values()))
  polygons=m.get('faces',[])+[v['polygon'] for v in m.get('views',{}).values() if 'polygon'in v]
  for i,names in enumerate(polygons):
   check(a,b,f'polygon {i} planar',planar(p,names))
   check(a,b,f'polygon {i} nondegenerate',np.linalg.matrix_rank(np.array([p[n]-p[names[0]] for n in names[1:]]),tol=1e-9)==2)
p=pts(1,7)
for e,v in [('AB',5),('BC',6),('AC',7)]:check(1,7,e,near(dist(p,*e),v))
p=pts(1,8)
for e,v in [('DE',2),('EF',4),('DF',6)]:check(1,8,e,near(dist(p,*e),v))
check(1,8,'DEF collinear',col(p,'D','E','F'))
p=pts(1,14);check(1,14,'P on AB',col(p,'A','B','P'));check(1,14,'P on plane intersection',near(p['P'][1:]))
p=pts(1,15)
for names in [('C','E','P'),('A','B','P'),('D1','F','Q'),('A','B','Q')]:check(1,15,'collinear '+str(names),col(p,*names))
for names in [('A','B','C','D'),('A','B','C1','D1')]:
 lengths=[dist(p,names[i],names[(i+1)%4]) for i in range(4)]
 check(1,15,'square '+str(names),all(near(x,2)for x in lengths) and near(np.dot(p[names[1]]-p[names[0]],p[names[-1]]-p[names[0]])))
p=pts(1,16);check(1,16,'equilateral triangle',near(dist(p,'A','B'),dist(p,'B','C')) and near(dist(p,'A','B'),dist(p,'A','C')));check(1,16,'O common center',near(p['O'],sum(p[n] for n in 'ABC')/3))
p=pts(1,19);check(1,19,'ABCD noncoplanar',not planar(p,list('ABCD')))
p=pts(1,20);check(1,20,'diagonal intersection',col(p,'A','O','C')and col(p,'B','O','D'))
p=pts(1,21);check(1,21,'BA intersects alpha M',col(p,'B','A','M')and near(p['M'][2]));check(1,21,'BC intersects alpha K',col(p,'B','C','K')and near(p['K'][2]));check(1,21,'MDK collinear',col(p,'M','D','K'))
p=pts(1,22)
for m,a,b in [('M','A','C'),('N','A','B')]:check(1,22,'midpoint '+m,mid(p,m,a,b))
for ns in [('B','M','K'),('C','N','E'),('A','K','E')]:check(1,22,'collinear '+str(ns),col(p,*ns))
p=pts(1,24)
for b in ['B1','B2']:check(1,24,b+'M=4 MC=7',near(dist(p,b,'M'),4)and near(dist(p,'M','C'),7))
check(1,24,'BC values11and3',near(dist(p,'B1','C'),11)and near(dist(p,'B2','C'),3))
p=pts(1,25)
for i,a in enumerate('ABCDE'):check(1,25,'midpoint'+str(i+1),mid(p,'mid'+str(i+1),a,'ABCDE'[(i+1)%5]))
p=pts(1,26);check(1,26,'isosceles',near(dist(p,'A','B'),dist(p,'B','C')));check(1,26,'BD perpendicular AC',near(np.dot(p['B']-p['D'],p['C']-p['A'])));check(1,26,'BD12 BM8',near(dist(p,'B','D'),12)and near(dist(p,'B','M'),8))
p=pts(1,27)
for e,v in [('AB',6),('BC',6),('CD',6),('AD',10),('EK',3),('KF',5)]:check(1,27,e,near(dist(p,*e),v))
for m,a,b in [('E','A','B'),('K','A','C'),('F','C','D')]:check(1,27,'midpoint '+m,mid(p,m,a,b))
check(1,27,'base parallel',par(p,'A','D','B','C'))
p=pts(2,3);check(2,3,'AB CD intersection',col(p,'A','B','O')and col(p,'C','D','O'))
for b in [4,5]:
 p=pts(2,b)
 check(2,b,'circle centered O radius2',all(near(dist(p,'O',n),2)for n in p if n.startswith('_r')))
p=pts(2,5);check(2,5,'right angleB',near(np.dot(p['A']-p['B'],p['C']-p['B'])))
p=pts(2,8);check(2,8,'D on BC',col(p,'B','C','D'))
p=pts(2,9);check(2,9,'X onDEandBC',col(p,'D','E','X')and col(p,'B','C','X'))
p=pts(2,10)
for ns in [('A','B','D'),('B','C','E'),('D','E','X'),('A','C','X')]:check(2,10,'collinear '+str(ns),col(p,*ns))
p=pts(2,11);check(2,11,'three collinear five noncoplanar',col(p,'A','B','C')and not planar(p,list('ABCDE')))
p=pts(2,12);check(2,12,'three axes not coplanar',not planar(p,list('OABC')))
p=pts(2,13);check(2,13,'threads intersectO',col(p,'A','C','O')and col(p,'B','D','O'))
p=pts(2,14)
for ns in [('A','B','E'),('B','C','F'),('E','D','F')]:check(2,14,'collinear '+str(ns),col(p,*ns))
p=pts(2,15)
for ns in [('A','B','C'),('F','P','M'),('F','K','M'),('B','P','E'),('C','K','E'),('F','E','D'),('A','D','M')]:check(2,15,'collinear '+str(ns),col(p,*ns))
p=pts(2,16);check(2,16,'C onAB E onAD',col(p,'A','B','C')and col(p,'A','D','E'))
p=pts(2,18)
for ns in [('M','K','P'),('B','C','P'),('M','N','E'),('C','A','E'),('K','N','Q'),('A','B','Q')]:check(2,18,'collinear '+str(ns),col(p,*ns))
check(2,18,'EPQ noncollinear',not col(p,'E','P','Q'))
p=pts(2,19);check(2,19,'parallelogram',par(p,'A','B','D','C')and par(p,'A','D','B','C'));check(2,19,'M onBC',col(p,'B','C','M'));check(2,19,'triangle area16',near(np.linalg.norm(np.cross(p['M']-p['A'],p['D']-p['A']))/2,16))
p=pts(2,20)
for ns in [('A','B','E'),('C','D','E')]:check(2,20,'collinear '+str(ns),col(p,*ns))
check(2,20,'AD parallelBC',par(p,'A','D','B','C'))
for e,v in [('AE',10),('CE',3),('DE',6),('BE',5)]:check(2,20,e,near(dist(p,*e),v))
if args.report:
 Path(args.report).write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
print(len(results),'checks',sum(not r['passed']for r in results),'failures')

raise SystemExit(0 if all(r["passed"] for r in results) else 1)

"""Independent reviewer /root/chapter6: every new §1.4 A card.
Source read separately from PDF pages 19–20, including the two cell diagrams.
Uses measured geometry and independently listed source values; no file writes.
"""
import importlib.util,math,pathlib,re,sys
HERE=pathlib.Path(__file__).resolve().parent;sys.path.insert(0,str(HERE))
spec=importlib.util.spec_from_file_location('reviewed_a',HERE/'section-1-4-a.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
D={(x['number'],x['part']):x for x in m.lessons}
assert set(D)=={(n,p) for n in list(range(3,14))+[15] for p in ('a','b')}
checks=0
def near(a,b):
 global checks;checks+=1
 assert math.isclose(a,b,rel_tol=1e-9,abs_tol=1e-9),(a,b)
def p(c,n):return c['model']['points'][n][:2]
def vector(a,b):return tuple(y-x for x,y in zip(a,b))
def cross(a,b):return a[0]*b[1]-a[1]*b[0]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def length(c,a,b):return math.dist(p(c,a),p(c,b))
def area(c,*names):
 pts=[p(c,n) for n in names];return abs(sum(cross(pts[i],pts[(i+1)%len(pts)]) for i in range(len(pts))))/2

def angle(c,a,b,d):
 u,v=vector(p(c,b),p(c,a)),vector(p(c,b),p(c,d));return math.degrees(math.acos(max(-1,min(1,dot(u,v)/math.hypot(*u)/math.hypot(*v)))))
def perpendicular(c,a,b,d,e):near(dot(vector(p(c,a),p(c,b)),vector(p(c,d),p(c,e))),0)
def parallel(c,a,b,d,e):near(cross(vector(p(c,a),p(c,b)),vector(p(c,d),p(c,e))),0)
def between(c,a,h,b):near(length(c,a,h)+length(c,h,b),length(c,a,b));assert length(c,a,h)>0 and length(c,h,b)>0

def midpoint(c,h,a,b):
 for x,y,z in zip(p(c,h),p(c,a),p(c,b)):near(2*x,y+z)

def has_edge(c,a,b):return any(set(e)=={a,b} for e in c['model']['edges'])

def ordered_alias(s,side=False):
 s=re.sub(r'[\s;,]','',s.upper().translate(str.maketrans('АВС','ABC')))
 return tuple(''.join(sorted(s[i:i+2])) for i in range(0,len(s),2)) if side else tuple(s)

numeric={(3,'a'):35,(3,'b'):39,(4,'a'):28,(4,'b'):39,(5,'a'):76,(5,'b'):124,(9,'a'):16,(9,'b'):7,(10,'a'):21,(10,'b'):18,(11,'a'):30,(11,'b'):24,(12,'a'):7,(12,'b'):16,(13,'a'):128,(13,'b'):56,(15,'a'):21,(15,'b'):12}
orders={(6,'a'):('C','A','B'),(6,'b'):('B','C','A'),(7,'a'):('AB','BC','AC'),(7,'b'):('BC','AC','AB')}
for key,c in D.items():
 assert c['section']=='1.4' and c['level']=='A'
 assert c['pages']==[19 if key[0]<=10 else 20]
 assert len(c['steps'])>=3 and all(s['explanation'] and s['reason'] and s['view'] in c['model']['views'] for s in c['steps'])
 model=c['model'];assert model['planar'] and 'neutral' in model['views']
 assert all(len(v)==3 and v[2]==0 and all(math.isfinite(x) for x in v) for v in model['points'].values())
 for e in model['edges']:assert len(e)==2 and all(x in model['points'] for x in e)
 for v in model['views'].values():
  for e in v.get('segments',[]):assert all(x in model['points'] for x in e)
  assert all(x in model['points'] for x in v.get('points',[]))
  assert all(x in model['points'] for x in v.get('polygon',[]))
 required=set('ABCDO' if key[0]==11 else 'ABC')
 if key[0]==4:required.add('H')
 if key[0]==10:required|={'M','N'}
 if key[0] in [12,13]:required.add('M')
 assert required<=set(model['labelNames']),(key,required,model['labelNames'])
 if key[0]==8:assert c['answer']['mode']=='manual' and 'accepted' not in c['answer']
 elif key in numeric:
  assert c['answer']['mode']=='exact'
  for value in c['answer']['accepted']:near(float(value.replace(',','.')),numeric[key])
 else:
  assert c['answer']['mode']=='exact'
  expected=tuple(''.join(sorted(x)) for x in orders[key]) if key[0]==7 else orders[key]
  for value in c['answer']['accepted']:assert ordered_alias(value,key[0]==7)==expected,(key,value)

c=D[3,'a'];near(angle(c,'A','C','B'),90);near(length(c,'B','C'),28);near(math.sin(math.radians(angle(c,'B','A','C'))),4/5);near(length(c,'A','B'),35)
c=D[3,'b'];near(angle(c,'B','A','C'),90);near(length(c,'A','C'),15);near(math.cos(math.radians(angle(c,'A','C','B'))),5/13);near(length(c,'B','C'),39)
for part,A,B,C in [('a',51,62,67),('b',32,51,97)]:
 c=D[4,part];near(angle(c,'B','A','C'),A);near(angle(c,'A','B','C'),B);near(angle(c,'A','C','B'),C);perpendicular(c,'C','H','A','B');between(c,'A','H','B');assert has_edge(c,'C','H');near(angle(c,'H','C','B'),numeric[4,part])
for part,A,B in [('a',31,45),('b',48,76)]:
 c=D[5,part];near(angle(c,'B','A','C'),A);near(angle(c,'A','B','C'),B);between(c,'A','C','E');near(angle(c,'B','C','E'),numeric[5,part]);assert 'E' not in c['model']['labelNames'] and has_edge(c,'C','_e');assert 'E' in c['model']['views']['focus']['points'];near(length(c,'E','_e'),0)
for part,ab,bc,ac in [('a',5,8,9),('b',11,10,13)]:
 c=D[6,part];near(length(c,'A','B'),ab);near(length(c,'B','C'),bc);near(length(c,'A','C'),ac)
 a={'A':angle(c,'B','A','C'),'B':angle(c,'A','B','C'),'C':angle(c,'A','C','B')};assert tuple(sorted(a,key=a.get,reverse=part=='b'))==orders[6,part]
for part,A,B,C in [('a',47,46,87),('b',35,65,80)]:
 c=D[7,part];near(angle(c,'B','A','C'),A);near(angle(c,'A','B','C'),B);near(angle(c,'A','C','B'),C)
 sides={n:length(c,n[0],n[1]) for n in ['AB','BC','AC']};assert tuple(sorted(sides,key=sides.get,reverse=part=='a'))==orders[7,part]
for part,ab,ac,bc in [('a',13,5,8),('b',9,4,6)]:
 c=D[8,part];near(length(c,'A','B'),ab);near(length(c,'A','C'),ac);near(length(c,'B','C'),bc)
 if part=='a':near(area(c,'A','B','C'),0);between(c,'A','C','B');assert ab==ac+bc
 else:assert area(c,'A','B','C')>0 and max(ab,ac,bc)<ab+ac+bc-max(ab,ac,bc)
for part,ab,bc in [('a',10,7),('b',7,13)]:
 c=D[9,part];near(length(c,'A','B'),ab);near(length(c,'B','C'),bc)
 feasible=[n for n in range(1,ab+bc+1) if abs(ab-bc)<n<ab+bc]
 assert (max(feasible) if part=='a' else min(feasible))==numeric[9,part];assert abs(ab-bc)<length(c,'A','C')<ab+bc
c=D[10,'a'];between(c,'A','M','C');between(c,'B','N','C');parallel(c,'M','N','A','B');near(length(c,'C','M'),14);near(length(c,'C','N'),18);near(length(c,'B','C'),27);near(length(c,'A','C'),21);assert has_edge(c,'M','N')
c=D[10,'b'];between(c,'A','M','B');between(c,'B','N','C');parallel(c,'M','N','A','C');near(length(c,'A','B'),24);near(length(c,'B','N'),21);near(length(c,'B','C'),28);near(length(c,'B','M'),18);assert has_edge(c,'M','N')
for part in ('a','b'):
 c=D[11,part];between(c,'A','O','C');between(c,'B','O','D');assert has_edge(c,'A','C') and has_edge(c,'B','D')
 if part=='a':
  parallel(c,'A','B','D','C');near(length(c,'C','O'),36);near(length(c,'D','C'),30);near(length(c,'A','B'),25);near(length(c,'A','O'),30)
 else:
  parallel(c,'A','D','B','C');near(length(c,'A','D'),32);near(length(c,'D','O'),20);near(length(c,'B','O'),15);near(length(c,'B','C'),24)
c=D[12,'a'];midpoint(c,'M','A','C');near(length(c,'A','C'),14);near(length(c,'B','M'),10);near(length(c,'A','M'),7);assert has_edge(c,'B','M')
c=D[12,'b'];midpoint(c,'M','B','C');near(length(c,'M','C'),8);near(length(c,'A','M'),10);near(length(c,'B','C'),16);assert has_edge(c,'A','M')
for part in ('a','b'):
 c=D[13,part];between(c,'A','M','C');perpendicular(c,'B','H','A','C');assert 'M' in c['model']['labelNames'] and 'H' not in c['model']['labelNames'];assert has_edge(c,'B','M') and not has_edge(c,'B','H');assert 'H' in c['model']['views']['height']['points']
 if part=='a':near(length(c,'A','M')/length(c,'M','C'),3/5);near(area(c,'A','B','M'),48);near(area(c,'A','B','C'),128)
 else:near(length(c,'A','M')/length(c,'M','C'),2/7);near(area(c,'A','B','C'),72);near(area(c,'M','B','C'),56)
# These vertex coordinates were independently counted on rendered source p20,
# with the drawing's lower left reference translated to an integer-grid origin.
for part,coords,base,height in [('a',{'A':(0,0),'B':(7,2),'C':(7,8)},6,7),('b',{'A':(0,8),'B':(0,5),'C':(8,0)},3,8)]:
 c=D[15,part]
 for key,point in coords.items():
  for actual,expected in zip(p(c,key),point):near(actual,expected)
 assert 'H' not in c['model']['labelNames'];assert 'H' in c['model']['views']['height']['points']
 assert len(c['model']['edges'])>20 # actual square lattice is present
 if part=='a':near(length(c,'B','C'),base);near(length(c,'A','H'),height);perpendicular(c,'A','H','B','C')
 else:near(length(c,'A','B'),base);near(length(c,'C','H'),height);perpendicular(c,'C','H','A','B')
 near(area(c,'A','B','C'),base*height/2);near(area(c,'A','B','C'),numeric[15,part])
print(f'REVIEW_SECTION_1_4_A_OK: 24 source variants, all finite aliases, initial givens/hidden auxiliaries, {checks} numeric assertions plus structural and ordering assertions')

"""Independent source/coordinate checks for all 34 newly authored §1.4 B variants.
Expected values and constraints were transcribed by the reviewer from PDF21–25.
No author helper, author self-test or runtime answer evaluator is used for math.
"""
from pathlib import Path
import ast,math,re,runpy,sys
folder=Path(__file__).resolve().parent
sys.path.insert(0,str(folder))
cards=runpy.run_path(str(folder/'section-1-4-b.py'))['lessons']
count=0

def check(test,context):
 global count
 assert test,context
 count+=1

def eq(x,y,context='numeric constraint'):
 check(abs(x-y)<=1e-8*max(1,abs(x),abs(y)),(context,x,y))

def vec(p,a,b):return [p[b][i]-p[a][i] for i in range(3)]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross2(a,b):return a[0]*b[1]-a[1]*b[0]
def distance(p,a,b):return math.dist(p[a],p[b])
def angle(p,a,o,b):
 u,v=vec(p,o,a),vec(p,o,b)
 return math.degrees(math.acos(max(-1,min(1,dot(u,v)/math.sqrt(dot(u,u)*dot(v,v))))))
def area(p,a,b,c):return abs(cross2(vec(p,a,b),vec(p,a,c)))/2
def parallel(p,a,b,c,d):eq(cross2(vec(p,a,b),vec(p,c,d)),0,'parallel lines')
def on_segment(p,q,a,b):
 parallel(p,a,q,a,b)
 eq(distance(p,a,q)+distance(p,q,b),distance(p,a,b),'point on segment')
def altitude(p,a,h,b,c):
 parallel(p,b,h,b,c);eq(dot(vec(p,a,h),vec(p,b,c)),0,'height perpendicular')
def visible(m):
 v=m['views']['neutral'];return set(m['labelNames'])|set(v.get('points',[]))|set(v.get('polygon',[]))|{n for e in v.get('segments',[]) for n in e}
def has_line(m,a,b):
 p=m['points'];v=m['views']['neutral'];edges=m['edges']+v.get('segments',[]);polygon=v.get('polygon',[])
 edges+=list(zip(polygon,polygon[1:]+polygon[:1]))
 for u,w in edges:
  if abs(cross2(vec(p,u,a),vec(p,u,w)))<1e-8 and abs(cross2(vec(p,u,b),vec(p,u,w)))<1e-8 and distance(p,u,a)+distance(p,a,w)<=distance(p,u,w)+1e-8 and distance(p,u,b)+distance(p,b,w)<=distance(p,u,w)+1e-8:return True
 return False

def answer_number(text):
 # Restricted parser for the finite reviewed aliases; no eval or arbitrary calls.
 text=text.replace(',','.').replace(':','/').replace('−','-').replace('·','*')
 text=re.sub(r'√(\d+)',r'sqrt(\1)',text)
 text=re.sub(r'(?<=\d)(?=sqrt)', '*',text)
 def visit(n):
  if isinstance(n,ast.Expression):return visit(n.body)
  if isinstance(n,ast.Constant) and type(n.value) in (int,float):return n.value
  if isinstance(n,ast.UnaryOp) and isinstance(n.op,(ast.UAdd,ast.USub)):return (1 if isinstance(n.op,ast.UAdd) else -1)*visit(n.operand)
  if isinstance(n,ast.BinOp) and isinstance(n.op,(ast.Add,ast.Sub,ast.Mult,ast.Div)):
   a,b=visit(n.left),visit(n.right)
   if isinstance(n.op,ast.Add):return a+b
   if isinstance(n.op,ast.Sub):return a-b
   if isinstance(n.op,ast.Mult):return a*b
   return a/b
  if isinstance(n,ast.Call) and isinstance(n.func,ast.Name) and n.func.id=='sqrt' and len(n.args)==1 and not n.keywords:return math.sqrt(visit(n.args[0]))
  raise AssertionError(('unsupported answer alias',text))
 return visit(ast.parse(text,mode='eval'))

expected={1:[7,12],3:[9,42],4:[6,42],5:[16,48],6:[32,39],7:[2/3,3],8:[12,18],9:[6*math.sqrt(6),42],11:[20,14],12:[5/12,4/5],13:[5/2,13/5],14:[30,28],15:[128,19],16:[336/5,12],17:[30,20],18:[3,16/math.sqrt(17)],19:[135,90]}
ids=set()
for card in cards:
 n=card['number'];b=card['part']=='b';ident=f"1.4-B{n}-{card['part']}";ids.add(ident);m=card['model'];p=m['points'];want=expected[n][b]
 check(card['section']=='1.4' and card['level']=='B',ident)
 page=21 if n<=4 else 22 if n<=8 or (n==9 and not b) else 23 if n<=14 or (n==15 and not b) else 24 if n<=18 else 25
 check(card['pages']==[page],(ident,'source page'))
 check(card['answer']['mode']=='exact' and bool(card['answer']['accepted']),ident)
 for answer in card['answer']['accepted']:eq(answer_number(answer),want,(ident,'accepted alias',answer))
 check(len(card['steps'])>=3,ident)
 for step in card['steps']:
  check(step['view'] in m['views'] and bool(step['reason']) and bool(step['explanation']),(ident,'step'))
 for point in p.values():check(len(point)==3 and all(math.isfinite(x) for x in point),(ident,'finite point'))
 for edge in m['edges']:check(len(edge)==2 and all(q in p for q in edge),(ident,'edge reference'))
 for view in m['views'].values():
  for q in view.get('points',[])+view.get('polygon',[]):check(q in p,(ident,'view point'))
  for edge in view.get('segments',[]):check(len(edge)==2 and all(q in p for q in edge),(ident,'view edge'))
 given=[];segments=[];hidden=[]
 if n==1:
  eq(distance(p,'B','C'),4*math.sqrt(3) if b else math.sqrt(7));eq(distance(p,'A','C'),8*math.sqrt(3) if b else 3*math.sqrt(7));eq(angle(p,'A','C','B'),60);eq(angle(p,'A','C','_ext'),120);value=distance(p,'A','B');segments=[('C','_ext')]
 elif n==3:
  eq(distance(p,'B','C'),21 if b else 12);eq(math.sin(math.radians(angle(p,'B','A','C'))),1/4 if b else 2/3);eq(angle(p,'A','C','_ext'),150);value=distance(p,'A','B');segments=[('C','_ext')]
 elif n==4:
  on_segment(p,'K','A','B');on_segment(p,'M','B','C');parallel(p,'K','M','A','C');eq(distance(p,'B','K')/distance(p,'K','A'),3/4 if b else 2/5);eq(distance(p,'K','M') if b else distance(p,'A','C'),18 if b else 21);value=distance(p,'A','C') if b else distance(p,'K','M');given=['K','M'];segments=[('K','M')]
 elif n==5:
  on_segment(p,'M','A','B');on_segment(p,'N','B','C');parallel(p,'M','N','A','C');eq(distance(p,'M','N'),13 if b else 18);eq(distance(p,'A','C'),52 if b else 54);eq(distance(p,'N','C'),36 if b else 32);value=distance(p,'B','C') if b else distance(p,'B','N');given=['M','N'];segments=[('M','N')]
 elif n==6:
  on_segment(p,'M','A','B');on_segment(p,'N','B','C');eq(angle(p,'B','M','N'),angle(p,'B','C','A'));eq(distance(p,'A','C'),36 if b else 48);eq(distance(p,'A','B'),52 if b else 42);eq(distance(p,'M','N') if b else distance(p,'B','N'),27 if b else 28);value=distance(p,'B','N') if b else distance(p,'M','N');given=['M','N'];segments=[('M','N')]
 elif n==7:
  on_segment(p,'K','M','P');parallel(p,'M','A','A','B');check(cross2(vec(p,'A','B'),vec(p,'A','K'))*cross2(vec(p,'A','B'),vec(p,'A','P'))>0,ident+' same half-plane');eq(area(p,'A','K','B')/area(p,'A','P','B'),3/4 if b else 2/5);value=distance(p,'M','K')/distance(p,'K','P');given=['A','B','M','K','P'];segments=[('A','B'),('A','K'),('K','B'),('A','P'),('P','B'),('M','P')];hidden=['H','R'];check('MP⊥AB' in card['steps'][1]['explanation'],ident+' perpendicular case addressed')
 elif n==8:
  if b:
   altitude(p,'C','H','A','B');altitude(p,'B','K','A','C');eq(distance(p,'C','H'),9);eq(distance(p,'B','K'),12);eq(distance(p,'A','B'),24);value=distance(p,'A','C');given=['H','K'];segments=[('C','H'),('B','K')]
  else:
   eq(distance(p,'A','B'),32);eq(distance(p,'B','C'),24);altitude(p,'A','H','B','C');eq(distance(p,'A','H'),16);altitude(p,'C','K','A','B');value=distance(p,'C','K');given=['H'];segments=[('A','H')];hidden=['K']
 elif n==9:
  if b:eq(angle(p,'A','B','C'),135);eq(angle(p,'B','C','A'),30);eq(distance(p,'A','B'),21*math.sqrt(2))
  else:eq(angle(p,'B','A','C'),45);eq(angle(p,'A','B','C'),120);eq(distance(p,'B','C'),12)
  value=distance(p,'A','C')
 elif n==11:
  eq(angle(p,'B','A','C'),48 if b else 64);eq(angle(p,'A','B','C'),76 if b else 24);on_segment(p,'D','A','B');altitude(p,'C','H','A','B');eq(angle(p,'A','C','D'),angle(p,'D','C','B'));value=angle(p,'H','C','D');given=['D','H'];segments=[('C','D'),('C','H')]
 elif n==12:
  values=sorted([distance(p,'A','B'),distance(p,'A','C'),distance(p,'B','C')]);target=[12,16,20] if b else [10,24,26]
  for x,y in zip(values,target):eq(x,y)
  theta=min(angle(p,'B','A','C'),angle(p,'A','B','C'),angle(p,'A','C','B'));value=math.cos(math.radians(theta)) if b else math.tan(math.radians(theta))
 elif n==13:
  on_segment(p,'M','A','B');on_segment(p,'K','B','C');eq(distance(p,'B','M')/distance(p,'A','B'),.5);eq(distance(p,'B','K')/distance(p,'B','C'),10/13 if b else 4/5);value=area(p,'A','B','C')/area(p,'M','B','K');given=['M','K'];segments=[('M','K')]
 elif n==14:
  on_segment(p,'M','A','C');eq(distance(p,'A','M'),distance(p,'M','C'));on_segment(p,'K','A','B');eq(distance(p,'A','K')/distance(p,'A','B'),1/7 if b else 1/3);eq(area(p,'A','M','K'),2 if b else 5);value=area(p,'A','B','C');given=['M','K'];segments=[('B','M'),('M','K')]
 elif n==15:
  if b:on_segment(p,'M','A','C');eq(distance(p,'A','M'),distance(p,'M','C'));eq(area(p,'A','B','C'),76);value=area(p,'M','C','N')
  else:on_segment(p,'M','A','B');eq(distance(p,'A','M'),distance(p,'M','B'));eq(area(p,'M','B','N'),32);value=area(p,'A','B','C')
  on_segment(p,'N','B','C');eq(distance(p,'B','N'),distance(p,'N','C'));given=['M','N'];segments=[('M','N')]
 elif n==16:
  on_segment(p,'M','A','C');on_segment(p,'K','B','M');eq(distance(p,'B','K')/distance(p,'K','M'),4/9 if b else 7/5);eq(area(p,'A','B','C') if b else area(p,'A','K','C'),39 if b else 48);value=area(p,'A','B','C')-area(p,'A','K','C');given=['M','K'];segments=[('B','M'),('A','K'),('C','K')];hidden=['H','N']
 elif n==17:
  on_segment(p,'M','A','B');on_segment(p,'K','B','C');on_segment(p,'P','A','C');eq(distance(p,'A','M')/distance(p,'M','B'),1/2 if b else 2);eq(distance(p,'B','K')/distance(p,'K','C'),2/3 if b else 3/2);eq(distance(p,'C','P')/distance(p,'P','A'),1/3 if b else 3);eq(area(p,'A','B','C'),60 if b else 90);value=area(p,'M','P','K');given=['M','K','P'];segments=[('M','P'),('P','K'),('K','M')]
 elif n==18:
  sourcepoints={'A':(0,0),'B':(4,1),'C':(0,4)} if b else {'A':(0,0),'B':(6,3),'C':(4,4)}
  for k,q in sourcepoints.items():eq(p[k][0],q[0]);eq(p[k][1],q[1])
  if b:altitude(p,'C','H','A','B');value=distance(p,'C','H');hidden=['H']
  else:on_segment(p,'D','A','C');eq(angle(p,'A','B','D'),angle(p,'D','B','C'));value=distance(p,'B','D');hidden=['D']
 else:
  sourcepoints={'A':(0,5),'B':(3,2),'C':(1,0)} if b else {'A':(0,5),'B':(3,6),'C':(0,0)}
  for k,q in sourcepoints.items():eq(p[k][0],q[0]);eq(p[k][1],q[1])
  angles=[angle(p,'B','A','C'),angle(p,'A','B','C'),angle(p,'A','C','B')];value=max(angles) if b else angles[0]+angles[2]
 eq(value,want,(ident,'independently derived answer'))
 for name in given:check(name in visible(m),(ident,'given point initially visible',name))
 for edge in segments:check(has_line(m,*edge),(ident,'given segment initially visible',edge))
 for name in hidden:
  check(name not in visible(m),(ident,'auxiliary point initially hidden',name));check(not any(name in e for e in m['edges']),(ident,'auxiliary edges initially hidden',name))
 if n in [18,19]:
  grids=[e for e in m['edges'] if all(k.startswith('_g') for k in e)];check(len(grids)>=10,(ident,'source grid visible'))
# Intermediate answer checks are independent of the author's injection table.
intermediate={(1,'a'):60,(1,'b'):60,(3,'a'):30,(3,'b'):30,(8,'a'):192,(8,'b'):108,(11,'a'):92,(11,'b'):56,(14,'a'):15,(14,'b'):14,(17,'a'):15,(17,'b'):15}
seen_intermediate=set()
for card in cards:
 key=(card['number'],card['part'])
 for step in card['steps']:
  if 'input' in step:
   check(key in intermediate,('unexpected intermediate',key));seen_intermediate.add(key)
   for value in step['input']['accepted']:eq(answer_number(value),intermediate[key],('intermediate answer',key))
check(seen_intermediate==set(intermediate),'all twelve intermediate checks reviewed')

# Additional source-permitted configurations for the B7 ratio, including a
# perpendicular MP, and arbitrary positive bases/heights for area problems.
for r in [2/5,3/4]:
 for theta in [15,45,90,135,170]:
  p={'A':[-2,0,0],'B':[7,0,0],'M':[1,0,0]};p['P']=[1+10*math.cos(math.radians(theta)),10*math.sin(math.radians(theta)),0];p['K']=[1+r*(p['P'][0]-1),r*p['P'][1],0]
  eq(area(p,'A','K','B')/area(p,'A','P','B'),r);eq(distance(p,'M','K')/distance(p,'K','P'),r/(1-r))
for r in [7/12,4/13]:
 for mx in [0,2,7,12]:
  p={'A':[0,0,0],'C':[12,0,0],'B':[3,9,0],'M':[mx,0,0]};p['K']=[(1-r)*p['B'][i]+r*p['M'][i] for i in range(3)]
  eq(area(p,'A','K','C')/area(p,'A','B','C'),1-r)
check(ids=={f'1.4-B{n}-{part}' for n in expected for part in ['a','b']} and len(cards)==34,'exact independent scope')
print(f'SHESTAKOV_1_4_B_INDEPENDENT_OK: 34 source variants, {count} assertions')

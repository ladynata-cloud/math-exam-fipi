"""Authoring helpers for chapter VI only; no publication decisions."""
from pathlib import Path
from copy import deepcopy
import math,json
ROOT=Path(__file__).resolve().parents[2]
COURSE=ROOT/'geometry-course/textbook'
BOOK='atanasyan-2023-7-9'
SOURCE_SHA='3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72'
PARTS={463:['а','б','в'],464:['а','б','в'],465:['а','б','в','г'],471:['а','б'],472:['а','б','в'],476:['а','б','в','г','д'],491:['а','б'],492:['а','б'],495:['а','б'],496:['а','б','в'],500:['а','б'],504:['а','б'],507:['а','б'],510:['а','б'],512:['а','б','в'],515:['а','б','в'],516:['а','б'],517:['а','б']}
def pages(n):
 if n<=470:return [123]
 if n<=472:return [126]
 if n<=481:return [127]
 if n<=487:return [128]
 if n==488:return [128,129]
 if n<=494:return [129]
 if n==495:return [129,130]
 if n==496:return [130,131]
 if n<=501:return [131]
 if n<=506:return [134]
 if n<=519:return [135]
 if n<=532:return [137]
 return [138]
def sc(ps=(),segs=(),**kw):return dict(label=kw.pop('label','Условие'),points=list(ps),segments=[list(x) for x in segs],**kw)
def poly(names='ABCD'):return [[names[i],names[(i+1)%len(names)]] for i in range(len(names))]
def tri(names='ABC'):return poly(names)
def more(v,ps=(),segs=(),**kw):
 q=deepcopy(v);q['points']=list(dict.fromkeys(q.get('points',[])+list(ps)));q['segments']=q.get('segments',[])+[list(x) for x in segs];q.update(kw);return q

def row(prompt,text,reason,refs):return dict(prompt=prompt,text=text,justification=reason,theoryPoints=refs if isinstance(refs,list) else [refs])
def eq(a,b,k=1):return dict(a=a,b=b,marks=k)
def rt(a,o,b):return dict(a=a,vertex=o,b=b,size=2.3)
def arc(o,a,b,k=0,r=5):return dict(vertex=o,**{'from':a,'to':b},marks=k,radius=r)
def ck(kind,**kw):return dict(type=kind,**kw)
def equal(*pairs):return ck('equalLength',segments=[list(x) for x in pairs])
def par(a,b,c,d):return ck('parallel',segments=[[a,b],[c,d]])
def perp(a,b,c,d):return ck('perpendicular',segments=[[a,b],[c,d]])
def col(*ps):return ck('collinear',points=list(ps))
def ang(a,o,b,d):return ck('angle',points=[a,o,b],degrees=d)
def ratio(a,b,c,d,r):return ck('distanceRatio',segments=[[a,b],[c,d]],ratio=r)
def mid(a,b):return [(a[i]+b[i])/2 for i in (0,1)]
def mix(a,b,t):return [a[i]+t*(b[i]-a[i]) for i in (0,1)]
def addv(a,b):return [a[i]+b[i] for i in (0,1)]
def subv(a,b):return [a[i]-b[i] for i in (0,1)]
def polar(o,t,r):return [o[0]+r*math.cos(math.radians(t)),o[1]+r*math.sin(math.radians(t))]
def dist(a,b):return math.hypot(a[0]-b[0],a[1]-b[1])
def foot(p,a,b):
 v=subv(b,a);t=sum((p[i]-a[i])*v[i] for i in (0,1))/sum(x*x for x in v);return mix(a,b,t)
def inter(a,b,c,d):
 u=subv(b,a);v=subv(d,c);den=u[0]*v[1]-u[1]*v[0];assert abs(den)>1e-10
 t=((c[0]-a[0])*v[1]-(c[1]-a[1])*v[0])/den;return mix(a,b,t)
def circle(o,t):return dict(center=o,through=t)
def parallelogram(a=6,b=4,angle=60):
 # AB has length b; AD has length a. Clockwise labels match the book.
 A=[0,0];B=polar(A,angle,b);D=[a,0];C=addv(B,D);return dict(A=A,B=B,C=C,D=D)
def rect(w=7,h=4):return dict(A=[0,0],B=[0,h],C=[w,h],D=[w,0])
def trap(bottom=8,top=4,h=3,left=None):
 left=(bottom-top)/2 if left is None else left
 return dict(A=[0,0],B=[left,h],C=[left+top,h],D=[bottom,0])
def regular(n,r=4):
 names=[chr(65+i) if n<=8 else ('A' if i==0 else 'B' if i==1 else 'C' if i==2 else '_v'+str(i)) for i in range(n)]
 return {name:polar([0,0],90+360*i/n,r) for i,name in enumerate(names)},names

def quad_sides(a,b,c,d,diagonal):
 x=(a*a+diagonal*diagonal-b*b)/(2*diagonal);u=(d*d+diagonal*diagonal-c*c)/(2*diagonal)
 return dict(A=[0,0],B=[x,math.sqrt(a*a-x*x)],C=[diagonal,0],D=[u,-math.sqrt(d*d-u*u)])
def quad_angles(values):
 A,B,C,D=values;assert abs(sum(values)-360)<1e-8
 dirs=[0,180-B,360-B-C,540-B-C-D]
 vs=[[math.cos(math.radians(t)),math.sin(math.radians(t))] for t in dirs]
 for a in [6,8,10,4,2]:
  for b in [4,2,6,1,8,12]:
   rhs=[-a*vs[0][i]-b*vs[1][i] for i in (0,1)];u,v=vs[2:];den=u[0]*v[1]-u[1]*v[0]
   c=(rhs[0]*v[1]-rhs[1]*v[0])/den;d=(u[0]*rhs[1]-u[1]*rhs[0])/den
   if min(c,d)>0.3:
    P=[0,0];Q=[a,0];R=addv(Q,[b*x for x in vs[1]]);S=addv(R,[c*x for x in vs[2]])
    return dict(A=P,B=Q,C=R,D=S)
 raise ValueError(values)
def para_checks():return [par('A','B','D','C'),par('A','D','B','C'),equal(('A','B'),('C','D')),equal(('A','D'),('B','C'))]
def angle_checks(vals):return [ang('D','A','B',vals[0]),ang('A','B','C',vals[1]),ang('B','C','D',vals[2]),ang('C','D','A',vals[3])]
def normalize(p,views):
 extent=list(p.values())
 for v in views:
  for c in v.get('circles',[]):
   o=p[c['center']];r=dist(o,p[c['through']]);extent += [[o[0]-r,o[1]-r],[o[0]+r,o[1]+r]]
 xs=[a[0] for a in extent];ys=[a[1] for a in extent];s=min(74/(max(xs)-min(xs) or 1),52/(max(ys)-min(ys) or 1));cx=(min(xs)+max(xs))/2;cy=(min(ys)+max(ys))/2
 return {k:[round(50+(v[0]-cx)*s,9),round(40-(v[1]-cy)*s,9),0] for k,v in p.items()}
class Block:
 def __init__(self,suffix):self.suffix=suffix;self.ex={};self.models=[];self.theory=[];self.selfchecks=[]
 def add(self,n,part,condition,answer,steps,p,neutral,views=None,checks=(),cases=(),labels=None,offsets=None,givens=(),notes=(),collection='main',title=None,printed=None):
  seq=views or [neutral]*len(steps);assert len(seq)==len(steps),(n,part,len(seq),len(steps))
  vv={'neutral':deepcopy(neutral)};vv.update({f'step-{i}':{**deepcopy(v),'label':f'Шаг {i}'} for i,v in enumerate(seq,1)})
  pp=normalize(p,list(vv.values()));labs=dict(labels or {});cc=list(checks);offs=dict(offsets or {})
  for i,c in enumerate(cases,1):
   q,view,label,unlock=c[:4];cm=c[4] if len(c)>4 else []
   names={k:k+'__case'+str(i) for k in q}
   def ren(x):
    if isinstance(x,str):return names.get(x,x)
    if isinstance(x,list):return [ren(z) for z in x]
    if isinstance(x,dict):return {k:ren(z) for k,z in x.items()}
    return x
   pp.update({names[k]:v for k,v in normalize(q,[view]).items()});vv[f'case-{i}']={**ren(view),'label':label,'availableFromStep':unlock};labs.update({names[k]:(c[5] if len(c)>5 else labels or {}).get(k,k) for k in q if not k.startswith('_')});cc.extend(ren(list(cm)))
  model=dict(points=pp,edges=[],planar=True,bounds=[0,0,100,82],views=vv,checks=cc,labels=labs,labelOffsets=offs,description='Отдельный чертёж к условию. Числа и обоснования приведены рядом; измерение на экране не заменяет доказательство.')
  did=[{k:v for k,v in s.items() if k!='text'} for s in steps]
  record=dict(part=part,conditionSummary=condition,answer=answer,steps=[s['text'] for s in steps],sourceVerified=True,mathVerified=True,notes=list(notes))
  pag=printed or pages(n)
  if collection=='main':self.ex.setdefault(n,dict(number=n,printedPages=pag,pdfPages=[x+1 for x in pag],parts=[],notes=[]))['parts'].append(record)
  else:
   record.pop('part');record['number']=n;record['title']=title;record['statement']=record.pop('conditionSummary');record['printedPages']=pag;record['pdfPages']=[x+1 for x in pag];record['didactics']=dict(steps=did)
   (self.theory if collection=='theory' else self.selfchecks).append(record)
  self.models.append(dict(chapter=6,collection=collection,number=n,part=part,model=model,didactics=dict(steps=did),statementGivens=list(givens)))
 def write(self):
  target='chapter-06-'+self.suffix+'.json';ex=[self.ex[n] for n in sorted(self.ex)]
  meta=dict(bookId=BOOK,chapter=6,title='Четырёхугольники',status='draft-content-preparation',source=dict(sha256=SOURCE_SHA,printedPageRange=[121,138],pdfPageRange=[122,139],pageOffset=1),review=dict(independentSource='pending',independentMathematics='pending',interactiveModels='implemented-awaiting-independent-review',claude='not-performed-owner-task-waiver'),authorSourceCheck=dict(independent=False,printedPages=sorted({p for e in ex+self.theory+self.selfchecks for p in e['printedPages']}),method='Автор визуально прочитал точные исходные страницы; это не независимое одобрение.',reviewedAt='2026-10-29'))
  if self.suffix=='theory':meta.update(theory=self.theory,selfchecks=self.selfchecks)
  else:meta.update(exercises=ex,coverage=dict(numberedExercises=len(ex),parts=sum(len(e['parts']) for e in ex),firstExercise=min(self.ex),lastExercise=max(self.ex),missingNumberedExercises=[]))
  for folder,data in [('preparation',meta),('models',dict(chapter=6,models=self.models))]:
   (COURSE/folder/target).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
  print(self.suffix,len(ex),len(self.models),sum(len(m['model']['views']) for m in self.models))

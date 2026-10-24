"""Pure authored-card helpers for the chapter-one completion.
Each author module owns its local lessons list; importing this file writes nothing.
Source-given points/segments belong in the neutral view. Hide only actual
auxiliary constructions, and cite exact PDF pages rather than guessed figures.
"""
import math

def fmt(x):return str(int(x)) if float(x).is_integer() else str(round(x,8)).rstrip('0')

def acc(x):
 s=str(x);return list(dict.fromkeys([s,s.replace('.',',')]))

def step(title,explanation,reason,view='focus',prompt=None,accepted=None):
 d=dict(title=title,prompt=prompt or title+'?',explanation=explanation,reason=reason,view=view)
 if accepted is not None:d['input']={'prompt':prompt or title,'accepted':acc(accepted),'feedback':explanation}
 return d

def model(points,edges,names=None,views=None):
 p={k:list(v)+([0] if len(v)==2 else []) for k,v in points.items()}
 return dict(points=p,edges=edges,labelNames=names or list(p),planar=True,views={'neutral':{'label':'Исходная модель'},**(views or {'focus':{'label':'Опорные отрезки','segments':edges}})})

def tri(a=(0,0),b=(6,0),c=(2,4),extra=None,views=None):
 p={'A':a,'B':b,'C':c};p.update(extra or {})
 return model(p,[['A','B'],['B','C'],['C','A']],['A','B','C'],views)

def right(a,b,extra=None,views=None):return tri((a,0),(0,0),(0,b),extra,views)

def angletri(A,B,length=8):
 C=180-A-B;c=length;b=c*math.sin(math.radians(B))/math.sin(math.radians(C))
 return tri((0,0),(c,0),(b*math.cos(math.radians(A)),b*math.sin(math.radians(A))))

def card(sec,lev,n,part,page,title,text,goal,answer,hint,steps,m,caption='Модель соответствует условию. Числовые вычисления раскрываются в шагах.',mode='exact'):
 ans={'mode':mode,'prompt':goal,'accepted':acc(answer),'feedback':'Сверьте ответ с последним шагом решения.'}
 if mode=='manual':ans.pop('accepted')
 return dict(section=sec,level=lev,number=n,part=part,pages=[page],title=title,text=text,goal=goal,answer=ans,hint=hint,steps=steps,model=m,caption=caption)

def line(points,edges=None,views=None):return model({k:(v,0) for k,v in points.items()},edges or [[list(points)[0],list(points)[-1]]],views=views)

"""Independent source-derived checks for §1.2 additions; reviewer /root/chapter3.
Source: supplied Shestakov–Yaschenko PDF printed pages 9–13, visually read.
Does not import author's check script or use author's result formula as oracle.
"""
from pathlib import Path
import math,runpy,sys,re,itertools
import ast
from fractions import Fraction
# Tiny exact radical arithmetic avoids a third-party symbolic dependency.
# Values are sums of rational coefficients times square roots of squarefree integers.
def split_square(n):
    factor=1;k=2
    while k*k<=n:
        while n%(k*k)==0:factor*=k;n//=k*k
        k+=1
    return factor,n
class Radical:
    def __init__(self,value=0,terms=None):self.terms=({1:Fraction(value)} if value else {}) if terms is None else {k:v for k,v in terms.items() if v}
    @staticmethod
    def cast(v):return v if isinstance(v,Radical) else Radical(v)
    def __add__(self,v):
        out=self.terms.copy()
        for k,c in self.cast(v).terms.items():out[k]=out.get(k,Fraction(0))+c
        return Radical(terms=out)
    __radd__=__add__
    def __neg__(self):return Radical(terms={k:-v for k,v in self.terms.items()})
    def __sub__(self,v):return self+-self.cast(v)
    def __rsub__(self,v):return self.cast(v)+-self
    def __mul__(self,v):
        out={}
        for k,a in self.terms.items():
            for n,b in self.cast(v).terms.items():
                f,r=split_square(k*n);out[r]=out.get(r,Fraction(0))+a*b*f
        return Radical(terms=out)
    __rmul__=__mul__
    def __truediv__(self,v):
        terms=self.cast(v).terms;assert len(terms)==1,terms
        k,c=next(iter(terms.items()));return self*Radical(terms={k:1/(c*k)})
    def __rtruediv__(self,v):return self.cast(v)/self
    def __eq__(self,v):return self.terms==self.cast(v).terms
    def __float__(self):return sum(float(c)*math.sqrt(k) for k,c in self.terms.items())
    def __repr__(self):return repr(self.terms)
class Exact:
    Rational=Fraction
    @staticmethod
    def sqrt(v):
        value=Radical.cast(v);assert set(value.terms)<={1};q=value.terms.get(1,Fraction(0));assert q>=0
        f,n=split_square(q.numerator*q.denominator);return Radical(terms={n:Fraction(f,q.denominator)})
    @staticmethod
    def simplify(v):return Radical.cast(v)
    @staticmethod
    def sympify(text,locals=None):
        def run(node):
            if isinstance(node,ast.Expression):return run(node.body)
            if isinstance(node,ast.Constant) and isinstance(node.value,int):return Radical(node.value)
            if isinstance(node,ast.UnaryOp) and isinstance(node.op,ast.USub):return -run(node.operand)
            if isinstance(node,ast.Call) and isinstance(node.func,ast.Name) and node.func.id=='sqrt' and len(node.args)==1:return Exact.sqrt(run(node.args[0]))
            if isinstance(node,ast.BinOp):
                a,b=run(node.left),run(node.right)
                if isinstance(node.op,ast.Add):return a+b
                if isinstance(node.op,ast.Sub):return a-b
                if isinstance(node.op,ast.Mult):return a*b
                if isinstance(node.op,ast.Div):return a/b
            raise AssertionError(ast.dump(node))
        return run(ast.parse(text,mode='eval'))
s=Exact()
F=Path(__file__).resolve().parent;sys.path.insert(0,str(F))
records=runpy.run_path(str(F/'section-1-2.py'))['lessons']
lookup={(c['level'],c['number'],c['part']):c for c in records}
expected={('A',2,'a'):114,('A',2,'b'):154,('A',3,'a'):21,('A',3,'b'):26,('A',4,'a'):21,('A',4,'b'):21,('A',5,'a'):6,('A',5,'b'):6,('A',6,'a'):60,('A',6,'b'):60,('A',7,'a'):500,('A',7,'b'):600,('A',10,'a'):25*s.sqrt(3)/4,('A',10,'b'):3*s.sqrt(3),('A',11,'a'):48,('A',11,'b'):60,('A',12,'a'):24*s.sqrt(10),('A',12,'b'):18*s.sqrt(21),('B',1,'a'):4*s.sqrt(15)/5,('B',1,'b'):25*s.sqrt(6)/3,('C',1,'a'):(50,50,80),('C',1,'b'):(55,55,70),('C',2,'a'):2*s.sqrt(19),('C',2,'b'):2*s.sqrt(57)/3,('C',4,'a'):2*s.sqrt(78)/3,('C',4,'b'):2*s.sqrt(1110)/5}
assert set(lookup)==set(expected)
checks=0

def ok(condition,msg=''):
 global checks;checks+=1;assert condition,msg

def equal(a,b):ok(math.isclose(float(a),float(b),rel_tol=2e-9,abs_tol=2e-9),(a,b))
def exact(text):
 # Every supplied accepted scalar is arithmetic with optional sqrt.
 text=text.replace('−','-').replace(',','.').replace('·','*')
 text=re.sub(r'(\d|\))(?=sqrt\()',r'\1*',text)
 ok(re.fullmatch(r'[\d\s\./*()+\-sqrt]+',text) is not None,text)
 return s.sympify(text,locals={'sqrt':s.sqrt})

def d(c,a,b):return math.dist(c['model']['points'][a],c['model']['points'][b])
def dot(c,a,b,e):
 p=c['model']['points'];return sum((p[a][i]-p[b][i])*(p[e][i]-p[b][i]) for i in range(3))
def angle(c,a,b,e):return math.degrees(math.acos(max(-1,min(1,dot(c,a,b,e)/d(c,a,b)/d(c,e,b)))))
def cross(a,b):return a[0]*b[1]-a[1]*b[0]
def vec(a,b):return [a[i]-b[i] for i in range(3)]
def area(c,a='A',b='B',e='C'):
 p=c['model']['points'];return abs(cross(vec(p[a],p[e]),vec(p[b],p[e])))/2

def line_dist(c,p,a,b):
 q=c['model']['points'];return abs(cross(vec(q[p],q[a]),vec(q[b],q[a])))/d(c,a,b)
def visible(c,*names):
 ok(set(names)<=set(c['model']['labelNames']),('initial labels',names))
def edges(c,*pairs):
 current={frozenset(x) for x in c['model']['edges']}
 for pair in pairs:ok(frozenset(pair)<=set(c['model']['points']) and frozenset(pair) in current,('missing given edge',pair))
def hidden(c,*names):ok(not(set(names)&set(c['model']['labelNames'])),('premature labels',names))
def midpoint(c,m,a,b):
 p=c['model']['points']
 for i in range(3):equal(p[m][i],(p[a][i]+p[b][i])/2)
for key,c in lookup.items():
 ok(c['section']=='1.2');ok(len(c['steps'])>=3)
 for st in c['steps']:ok(bool(st['reason']) and bool(st['explanation']) and st['view'] in c['model']['views'])
 answer=expected[key]
 for text in c['answer']['accepted']:
  if isinstance(answer,tuple):ok(tuple(int(x) for x in text.split(';'))==answer)
  else:ok(s.simplify(exact(text)-answer)==0,(key,text,answer))
 for pt in c['model']['points'].values():ok(len(pt)==3 and all(math.isfinite(x) for x in pt))
 for view in c['model']['views'].values():
  for name in view.get('points',[])+view.get('polygon',[]):ok(name in c['model']['points'])
  for pair in view.get('segments',[]):ok(len(pair)==2 and all(n in c['model']['points'] for n in pair))
 # Nonlogical models all retain their source triangle edges and names initially.
 if key[:2]!=('C',1):edges(c,('A','B'),('B','C'),('C','A')) if key[:2]!=('A',7) else None
 if key[:2] not in [('C',1),('A',7)]:visible(c,'A','B','C')

for part,apex in [('a',48),('b',128)]:
 c=lookup['A',2,part];equal(d(c,'A','C'),d(c,'B','C'));equal(angle(c,'A','C','B'),apex);equal(angle(c,'E','A','C'),180-(180-apex)/2);edges(c,('A','E'));visible(c,'E')
for part,side,height in [('a',14*s.sqrt(3),21),('b',26,13*s.sqrt(3))]:
 c=lookup['A',3,part]
 for a,b in [('A','B'),('B','C'),('C','A')]:equal(d(c,a,b),side)
 equal(d(c,'C','H'),height);midpoint(c,'H','A','B');equal(dot(c,'C','H','A'),0)
 if part=='a':hidden(c,'H')
 else:visible(c,'H');edges(c,('C','H'))
c=lookup['A',4,'a'];equal(d(c,'A','B')+d(c,'B','C')+d(c,'C','A'),126);midpoint(c,'M','A','C');midpoint(c,'N','B','C');equal(d(c,'M','N'),21);hidden(c,'M','N')
c=lookup['A',4,'b'];equal(d(c,'A','B')*3,42*s.sqrt(3));equal(d(c,'C','H'),21);hidden(c,'H')
for num in [5,6]:
 for part,target,vertex in [('a','M','B'),('b','K','C')]:
  c=lookup['A',num,part];equal(d(c,'A','B'),d(c,'B','C'));equal(d(c,'B','C'),d(c,'C','A'));edges(c,('A','H'),(vertex,target));visible(c,'H',target);hidden(c,'O')
  midpoint(c,target,'A','C' if part=='a' else 'B');equal(dot(c,vertex,target,'A'),0)
  if num==5:equal(d(c,'A','H'),6);equal(d(c,vertex,target),6)
  else:equal(angle(c,'A','O',vertex),120);equal(angle(c,'A','O',target),60)
for part,h,x,H,y in [('a',80,250,160,500),('b',90,300,180,600)]:
 c=lookup['A',7,part];equal(d(c,'_a1','_a2'),h);equal(d(c,'_b1','_b2'),H);equal(d(c,'O','A'),x);equal(d(c,'O','B'),y)
 for side in ['1','2']:equal(line_dist(c,'_a'+side,'O','_b'+side),0)
 edges(c,('O','_b1'),('O','_b2'),('_a1','_a2'),('_b1','_b2'));visible(c,'O','A','B')
for part,side,height in [('a',5,5*s.sqrt(3)/2),('b',2*s.sqrt(3),3)]:
 c=lookup['A',10,part];equal(d(c,'A','B'),side);equal(d(c,'C','H'),height);equal(area(c),expected['A',10,part])
 if part=='b':edges(c,('C','H'));visible(c,'H')
 else:hidden(c,'H')
for part,base,h,l,S in [('a',16,6,10,48),('b',24,5,13,60)]:
 c=lookup['A',11,part];equal(d(c,'A','B'),base);equal(d(c,'C','H'),h);equal(d(c,'A','C'),l);equal(d(c,'B','C'),l);equal(area(c),S)
 if part=='a':edges(c,('C','H'));visible(c,'H')
 else:hidden(c,'H')
c=lookup['A',12,'a'];equal(d(c,'A','C'),14);equal(math.cos(math.radians(angle(c,'B','A','C'))),3/7);equal(area(c),24*s.sqrt(10));hidden(c,'H')
c=lookup['A',12,'b'];equal(d(c,'C','H'),6);equal(math.sin(math.radians(angle(c,'B','A','C'))),2/5);equal(area(c),18*s.sqrt(21));edges(c,('C','H'));visible(c,'H')
for part,sideh,baseh in [('a',3,6),('b',4,10)]:
 c=lookup['B',1,part];equal(d(c,'A','C'),d(c,'B','C'));equal(line_dist(c,'C','A','B'),baseh);equal(line_dist(c,'A','B','C'),sideh);equal(line_dist(c,'B','A','C'),sideh)
 edges(c,('C','H'),('A','P'),('B','Q'));visible(c,'H','P','Q');midpoint(c,'H','A','B')
 equal(d(c,'A','B') if part=='a' else area(c),expected['B',1,part])
for part,limit,known in [('a',132,80),('b',126,70)]:
 c=lookup['C',1,part];sol=expected['C',1,part]
 truths=[len(set(sol))<3,90 in sol,all(x+y<limit for x,y in itertools.combinations(sol,2)),known in sol]
 ok(truths==[True,False,True,True]);ok(180-limit>45)
 # Complete candidate sets after 2 is false and 1,4 true; exactly one survives 3.
 candidates=[((180-known)/2,(180-known)/2,known),(known,known,180-2*known)]
 ok(sum(all(x+y<limit for x,y in itertools.combinations(t,2)) for t in candidates)==1)
 visible(c,'1','2','3','4');hidden(c,'_bound');ok('вершины' in c['caption'])
for part,da,db,side in [('a',1,7,2*s.sqrt(19)),('b',2,5,2*s.sqrt(57)/3)]:
 c=lookup['C',2,part];p=c['model']['points']
 for a,b in [('A','B'),('B','C'),('C','A')]:equal(d(c,a,b),side)
 equal(line_dist(c,'A','C','D'),da);equal(line_dist(c,'B','C','D'),db);equal(d(c,'A','P'),da);equal(d(c,'B','Q'),db)
 equal(line_dist(c,'P','C','D'),0);equal(line_dist(c,'Q','C','D'),0);equal(dot(c,'A','P','D'),0);equal(dot(c,'B','Q','D'),0)
 if part=='a':ok(p['A'][0]<p['D'][0]<p['B'][0])
 else:ok(p['D'][0]<p['A'][0]<p['B'][0]);edges(c,('D','A'))
 edges(c,('A','P'),('B','Q'),('_l1','_l2'));visible(c,'D','P','Q');hidden(c,'H')
for part,S1,S2 in [('a',4,s.Rational(5,2)),('b',12,s.Rational(13,2))]:
 c=lookup['C',4,part];equal(d(c,'A','B'),d(c,'B','C'));equal(area(c,'A','C','D'),S1);equal(area(c,'B','C','D'),S2);equal(angle(c,'A','C','D'),angle(c,'D','C','B'));equal(d(c,'A','C'),expected['C',4,part]);edges(c,('C','D'));visible(c,'D');hidden(c,'H');midpoint(c,'H','A','C')
# Step-entry values are independently enumerated from the worked arithmetic.
step_oracle={('A',2,'a'):[66,114],('A',2,'b'):[26,154],('A',3,'a'):[21],('A',3,'b'):[26],('A',4,'a'):[42,21],('A',4,'b'):[21],('A',5,'a'):[6],('A',5,'b'):[6],('A',6,'a'):[120,60],('A',6,'b'):[120,60],('A',7,'a'):[500],('A',7,'b'):[600],('A',11,'a'):[48],('A',11,'b'):[60]}
for key,c in lookup.items():
    inputs=[step['input'] for step in c['steps'] if 'input' in step]
    expected_steps=step_oracle.get(key,[]);ok(len(inputs)==len(expected_steps),(key,'unexpected step input'))
    for inp,value in zip(inputs,expected_steps):
        for accepted in inp['accepted']:ok(exact(accepted)==value,(key,'step',accepted,value))
print(f'INDEPENDENT_SECTION_1_2_OK: {len(records)} source variants; {checks} assertions including every accepted exact form and all geometric givens.')

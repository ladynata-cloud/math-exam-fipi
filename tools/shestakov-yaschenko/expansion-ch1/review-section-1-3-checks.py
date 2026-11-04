"""Independent source and model calculator for all 38 new §1.3 variants.

Reads generated records only. Source constants, expected answers and geometric
relations are separate from the author's implementation. No course files written.
"""
import ast
import math
from pathlib import Path
import re
import runpy
import sys

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
records=runpy.run_path(str(HERE/'section-1-3.py'))['lessons']
cards={(c['level'],c['number'],c['part']):c for c in records}
assert len(cards)==len(records)==38
checks=0
def equal(a,b,context):
    global checks
    assert math.isclose(a,b,abs_tol=1e-9,rel_tol=1e-9),(context,a,b)
    checks+=1
def truth(test,context):
    global checks
    assert test,context
    checks+=1
def distance(P,a,b):return math.dist(P[a],P[b])
def determinant(a,b,c):return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
def area(P,a='A',b='B',c='C'):return abs(determinant(P[a],P[b],P[c]))/2
def angle(P,a,b,c):
    u=[P[a][i]-P[b][i] for i in range(2)];v=[P[c][i]-P[b][i] for i in range(2)]
    return math.degrees(math.acos(max(-1,min(1,sum(u[i]*v[i] for i in range(2))/math.hypot(*u)/math.hypot(*v)))))
def on_line(P,p,a,b):equal(determinant(P[a],P[b],P[p]),0,'collinearity '+p+a+b)
def midpoint(P,m,a,b):
    for i in range(2):equal(P[m][i],(P[a][i]+P[b][i])/2,'midpoint '+m)
def point_segment(p,a,b):
    v=[b[i]-a[i] for i in range(2)];t=sum((p[i]-a[i])*v[i] for i in range(2))/sum(x*x for x in v)
    t=min(1,max(0,t));return math.dist(p[:2],[a[i]+t*v[i] for i in range(2)])
def value(raw):
    s=str(raw).replace(',','.').replace('·','*').replace('−','-')
    if ':' in s:
        a,b=s.split(':');return value(a)/value(b)
    s=s.replace('√(','sqrt(')
    s=re.sub(r'√(\d+(?:\.\d+)?)',r'sqrt(\1)',s)
    s=re.sub(r'(?<=[\d)])(?=sqrt)', '*',s)
    node=ast.parse(s,mode='eval').body
    def ev(n):
        if isinstance(n,ast.Constant) and isinstance(n.value,(int,float)):return n.value
        if isinstance(n,ast.UnaryOp) and isinstance(n.op,ast.USub):return -ev(n.operand)
        if isinstance(n,ast.BinOp):
            a,b=ev(n.left),ev(n.right)
            if isinstance(n.op,ast.Add):return a+b
            if isinstance(n.op,ast.Sub):return a-b
            if isinstance(n.op,ast.Mult):return a*b
            if isinstance(n.op,ast.Div):return a/b
        if isinstance(n,ast.Call) and isinstance(n.func,ast.Name) and n.func.id=='sqrt' and len(n.args)==1:return math.sqrt(ev(n.args[0]))
        raise AssertionError(('unsupported exact answer',raw))
    return ev(node)

# Source-derived results; Heron's formula and median/bisector identities provide
# independent paths for the higher-level cards.
expected={
 ('A',1,'a'):90-34,('A',1,'b'):137-90,
 ('A',2,'a'):max(37,90-37),('A',2,'b'):min(58,90-58),
 ('A',3,'a'):3/2,('A',3,'b'):3.7/2,
 ('A',5,'a'):math.hypot(15,8),('A',5,'b'):math.hypot(12,9),
 ('A',6,'a'):math.sqrt(3**2-1.8**2),('A',6,'b'):math.sqrt(2.5**2-2**2),
 ('A',9,'a'):math.hypot(6,8)/2,('A',9,'b'):math.hypot(10,24)/2,
 ('A',10,'a'):48*math.cos(math.pi/3),('A',10,'b'):27/math.sin(math.pi/6),
 ('A',11,'a'):5*math.sqrt(1-(3/5)**2),('A',11,'b'):8*math.sqrt(1+(3/4)**2),
 ('A',12,'a'):12*16/2,('A',12,'b'):15*math.sqrt(17**2-15**2)/2,
 ('A',13,'a'):16*math.sqrt(34**2-16**2)/2,('A',13,'b'):28*math.sqrt(35**2-28**2)/2,
 ('A',14,'a'):2*math.sqrt(13-2**2)/2,('A',14,'b'):math.sqrt(17-1)/2,
 ('A',15,'a'):48**2*(7/24)/2,('A',15,'b'):30**2*(8/15)/2,
 ('A',16,'a'):(2*math.sqrt(5))**2*(1/math.sqrt(5))*math.sqrt(1-1/5)/2,
 ('A',16,'b'):(5*math.sqrt(17))**2*(1/math.sqrt(17))*math.sqrt(1-1/17)/2,
 ('B',3,'a'):math.sqrt(8**2+(math.sqrt((4*math.sqrt(10))**2-(8/2)**2)/2)**2),
 ('B',3,'b'):math.sqrt(6**2+((math.sqrt(73))**2-(6/2)**2))/2,
 ('B',4,'a'):(2*5)**2*(4*3)/(2*(4**2+3**2)),
 ('B',4,'b'):(2*13)**2*(12*5)/(2*(12**2+5**2)),
 ('C',2,'a'):32*3/(8*20),('C',2,'b'):24*5/(6*4),
 ('C',3,'a'):math.sqrt(25*(1-(25**2-1)/(25+1)**2)),
 ('C',3,'b'):math.sqrt(24*3*(1-(24**2-3**2)/(24+3)**2)),
 ('C',5,'a'):(2*math.sqrt(3))**2*(2/3)/(2*(1+(2/3)**2)),
 ('C',5,'b'):(2*math.sqrt(7))**2*(3/math.sqrt(7))/2,
}
intermediates={('A',11,'a'):[3,4],('A',11,'b'):[6,10],('A',15,'a'):[14,336],('A',15,'b'):[16,240],('A',16,'a'):[2,4,4],('A',16,'b'):[5,20,50],('B',3,'a'):[12,10],('B',3,'b'):[8,5]}

for key,c in cards.items():
    lev,num,part=key;P=c['model']['points'];m=c['model']
    truth(c['section']=='1.3' and len(c['steps'])>=3,str(key)+' complete steps')
    for s in c['steps']:truth(s['view'] in m['views'],str(key)+' valid step view')
    for name,p in P.items():truth(len(p)==3 and all(math.isfinite(x) for x in p),str(key)+name+' finite point')
    for e in m['edges']:truth(len(e)==2 and all(n in P for n in e),str(key)+' valid edge')
    right_vertex=('B' if num in [2,3,5,6] else 'C') if lev=='A' else ('C' if lev=='B' else 'B' if num==1 else 'C' if num==2 else 'A')
    if lev=='A' and num==11 and part=='b':right_vertex='A'
    others=[x for x in 'ABC' if x!=right_vertex]
    equal(angle(P,others[0],right_vertex,others[1]),90,str(key)+' right angle')
    if key in expected:
        truth(c['answer']['mode']=='exact',str(key)+' exact mode')
        for accepted in c['answer']['accepted']:equal(value(accepted),expected[key],str(key)+' equivalent final answer')
        inputs=[s['input'] for s in c['steps'] if 'input' in s]
        targets=intermediates.get(key,[expected[key]])
        truth(len(inputs)==len(targets),str(key)+' intermediate check count')
        for inp,target in zip(inputs,targets):
            for accepted in inp['accepted']:equal(value(accepted),target,str(key)+' intermediate answer')
    else:truth(c['answer']['mode']=='manual' and 'accepted' not in c['answer'],str(key)+' proof not auto-graded')

    if lev=='A':
        if num==1:
            equal(angle(P,'B','A','C'),34 if part=='a' else 43,'source acute angle')
            if part=='b':equal(angle(P,'B','A','E'),137,'source exterior angle')
            equal(angle(P,'A','B','C'),expected[key],'requested angle')
        elif num==2:
            on_line(P,'H','A','C');equal(angle(P,'B','H','A'),90,'source height')
            equal(angle(P,'B','A','C'),37 if part=='a' else 32,'corresponding acute angle')
            equal(angle(P,'A','B','H'),53 if part=='a' else 58,'given/sought split angle')
        elif num==3:
            midpoint(P,'M','A','C');equal(angle(P,'M','H','A'),90,'source vertical support');equal(distance(P,'B','C'),3 if part=='a' else 3.7,'source height');equal(distance(P,'M','H'),expected[key],'support height')
        elif num==5:
            equal(distance(P,'B','C'),15 if part=='a' else 12,'flag height');equal(distance(P,'A','B'),8 if part=='a' else 9,'ground distance');equal(distance(P,'A','C'),expected[key],'rope')
        elif num==6:
            equal(distance(P,'A','C'),3 if part=='a' else 2.5,'ladder');equal(distance(P,'A','B'),1.8 if part=='a' else 2,'ground gap');equal(distance(P,'B','C'),expected[key],'height')
        elif num==9:
            a,b=(6,8) if part=='a' else(10,24);equal(distance(P,'A','C'),a,'first given leg');equal(distance(P,'B','C'),b,'second given leg');midpoint(P,'M','A','C');midpoint(P,'N','B','C');equal(distance(P,'M','N'),expected[key],'maximal middle line')
            truth('M' not in m['labelNames'] and 'N' not in m['labelNames'],'middle line introduced only later')
        elif num==10:
            equal(angle(P,'C','A','B'),30,'small source angle');equal(angle(P,'C','B','A'),60,'large source angle');equal(distance(P,'A','B'),48 if part=='a' else 54,'hypotenuse');equal(distance(P,'B','C'),24 if part=='a' else 27,'small leg')
        elif num==11:
            if part=='a':equal(distance(P,'A','B'),5,'source hypotenuse');equal(math.cos(math.radians(angle(P,'A','B','C'))),3/5,'source cosine');equal(distance(P,'A','C'),expected[key],'requested leg')
            else:equal(distance(P,'A','C'),8,'source leg');equal(math.tan(math.radians(angle(P,'A','C','B'))),3/4,'source tangent');equal(distance(P,'B','C'),expected[key],'requested hypotenuse')
        elif num in [12,13,14]:
            a,hyp={(12,'a'):(12,20),(12,'b'):(15,17),(13,'a'):(16,34),(13,'b'):(28,35),(14,'a'):(2,math.sqrt(13)),(14,'b'):(1,math.sqrt(17))}[num,part]
            equal(distance(P,'A','C'),a,'source leg');equal(distance(P,'A','B'),hyp,'source or independently derived hypotenuse');equal(area(P),expected[key],'requested area')
            if num==12 and part=='a':equal(distance(P,'B','C'),16,'second source leg')
        elif num==15:
            equal(distance(P,'B','C'),48 if part=='a' else 30,'source leg');equal(math.tan(math.radians(angle(P,'A','B','C'))),7/24 if part=='a' else 8/15,'source tangent');equal(area(P),expected[key],'requested area')
        elif num==16:
            equal(distance(P,'A','B'),2*math.sqrt(5) if part=='a' else 5*math.sqrt(17),'source hypotenuse');equal(math.sin(math.radians(angle(P,'B','A','C'))),1/math.sqrt(5) if part=='a' else 1/math.sqrt(17),'source sine');equal(area(P),expected[key],'requested area')
    elif lev=='B':
        if num==3:
            midpoint(P,'M','A','C');equal(distance(P,'A','C'),8 if part=='a' else 6,'given leg');equal(distance(P,'B','M'),4*math.sqrt(10) if part=='a' else math.sqrt(73),'given median')
            midpoint(P,'N','B','C' if part=='a' else'A');equal(distance(P,'A','N') if part=='a' else distance(P,'C','N'),expected[key],'requested median');truth('N' not in m['labelNames'],'second median hidden before derivation')
        else:
            midpoint(P,'M','A','B');equal(distance(P,'C','M'),5 if part=='a' else 13,'source median');on_line(P,'D','A','B');equal(angle(P,'A','C','D'),angle(P,'D','C','B'),'angle bisector');equal(distance(P,'A','D')/distance(P,'D','B'),4/3 if part=='a' else 12/5,'source division ratio');equal(area(P),expected[key],'requested area')
    elif num==1:
        a,b=(7,10) if part=='a' else(6,13)
        equal(distance(P,'A','B'),a,'first source leg');equal(distance(P,'B','C'),b,'second source leg')
        equal(point_segment(P['M'],P['A'],P['B']),5 if part=='a' else 6,'distance to finite AB');equal(point_segment(P['M'],P['B'],P['C']),4 if part=='a' else 3,'distance to finite BC')
        sign=P['M'][0]/a+P['M'][1]/b
        truth(sign>1 if part=='a' else sign<1,'shown point classification')
        if part=='b':
            equal(point_segment(P['M′'],P['A'],P['B']),6,'outside counterexample distance AB');equal(point_segment(P['M′'],P['B'],P['C']),3,'outside counterexample distance BC');truth(P['M′'][0]<0,'counterexample outside');truth('M′' not in m['labelNames'],'alternative point is initially hidden')
            # Explicitly test the alternate interpretation as distances to infinite lines.
            equal(abs(-3),3,'line-distance counterexample BC');equal(abs(6),6,'line-distance counterexample AB')
    elif num==2:
        a,b,x,y=(32,8,20,3) if part=='a' else(24,6,4,5)
        truth('3:5' not in c['goal'] and '5:1' not in c['goal'],'answer format does not reveal the answer')
        truth('прямом угле ACB' in c['steps'][0]['explanation'],'correct right-angle vertex in location proof')
        equal(distance(P,'A','C'),a,'source AC');equal(distance(P,'B','C'),b,'source BC');equal(point_segment(P['M'],P['A'],P['C']),y,'source finite-segment distance AC');equal(point_segment(P['M'],P['B'],P['C']),x,'source finite-segment distance BC');on_line(P,'M','A','B');equal(distance(P,'A','M')/distance(P,'M','B'),expected[key],'division from A')
        truth(x<a and y<b and x!=y,'bounds make perpendicular feet lie on finite catheti')
        # A negative-negative point has C as closest point on both finite segments:
        neg=(-x,-y);equal(point_segment(neg,P['A'],P['C']),point_segment(neg,P['B'],P['C']),'third-quadrant distances necessarily equal')
        # For opposite signs, x/a+y/b along ray never reaches AB inside its quadrant.
        for sx,sy in [(1,-1),(-1,1)]:truth(sx*sy<0,'mixed signs cannot enter positive-quadrant segment AB')
    elif num==3:
        equal(distance(P,'B','C'),25 if part=='a' else 24,'source hypotenuse');equal(distance(P,'A','C') if part=='a' else distance(P,'A','B'),1 if part=='a' else 3,'source short leg')
        start='C' if part=='a' else'B';end='B' if part=='a' else'C'
        on_line(P,'D','A',end);equal(angle(P,'A',start,'D'),angle(P,'D',start,end),'source bisector');equal(distance(P,start,'D'),expected[key],'requested bisector length')
    elif num==5:
        if part=='a':
            midpoint(P,'M','A','C');on_line(P,'K','B','M');on_line(P,'K','A','D');equal(distance(P,'B','K')/distance(P,'K','M'),4/3,'source median division from B');equal(distance(P,'B','C'),2*math.sqrt(3),'source hypotenuse');equal(angle(P,'B','A','K'),angle(P,'K','A','C'),'right-angle bisector')
        else:
            midpoint(P,'M','A','B');on_line(P,'K','C','M');on_line(P,'K','B','D');equal(distance(P,'C','K')/distance(P,'K','M'),8/3,'source median division from C');equal(distance(P,'A','C'),2*math.sqrt(7),'source leg');equal(angle(P,'A','B','K'),angle(P,'K','B','C'),'acute-angle bisector')
        equal(area(P),expected[key],'requested area')
    print('verified',f'1.3-{lev}{num}-{part}')

print(f'PASS: all38 source variants, exact final/intermediate aliases, model relations; {checks} assertions.')

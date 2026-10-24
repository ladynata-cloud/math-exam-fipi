"""Independent source-derived numeric/geometry checks for the 26 new §1.2 cards.

Only card data is read from the author module. Expected results and geometric
relations below are computed independently; the author's helper functions are
not used to establish correctness.
"""
import ast
import importlib.util
import math
from pathlib import Path
import re
import sys

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
spec=importlib.util.spec_from_file_location('section12_cards',HERE/'section-1-2.py')
author=importlib.util.module_from_spec(spec);spec.loader.exec_module(author)
cards={(x['level'],x['number'],x['part']):x for x in author.lessons}
count=0
def close(actual,expected,why):
    global count
    assert math.isclose(actual,expected,rel_tol=1e-9,abs_tol=1e-9),(why,actual,expected)
    count+=1
def d(P,a,b):return math.dist(P[a],P[b])
def area(P,a,b,c):
    A,B,C=P[a],P[b],P[c]
    return abs((B[0]-A[0])*(C[1]-A[1])-(B[1]-A[1])*(C[0]-A[0]))/2
def angle(P,a,b,c):
    u=[P[a][i]-P[b][i] for i in range(2)];v=[P[c][i]-P[b][i] for i in range(2)]
    return math.degrees(math.acos(max(-1,min(1,sum(u[i]*v[i] for i in range(2))/math.hypot(*u)/math.hypot(*v)))))
def right(P,a,b,c):close(angle(P,a,b,c),90,f'{a}{b}{c} perpendicular')
def value(s):
    s=s.replace(',','.');s=re.sub(r'(?<=\d)(?=sqrt)', '*',s)
    tree=ast.parse(s,mode='eval')
    def ev(n):
        if isinstance(n,ast.Constant) and isinstance(n.value,(int,float)):return n.value
        if isinstance(n,ast.BinOp):
            a,b=ev(n.left),ev(n.right)
            if isinstance(n.op,ast.Add):return a+b
            if isinstance(n.op,ast.Sub):return a-b
            if isinstance(n.op,ast.Mult):return a*b
            if isinstance(n.op,ast.Div):return a/b
        if isinstance(n,ast.Call) and isinstance(n.func,ast.Name) and n.func.id=='sqrt' and len(n.args)==1:return math.sqrt(ev(n.args[0]))
        raise AssertionError(('unsupported answer expression',s))
    return ev(tree.body)

# These expressions are derived directly from the source values, not from card answers.
expected={
 ('A',2,'a'):90+48/2,('A',2,'b'):90+128/2,
 ('A',3,'a'):math.sqrt((14*math.sqrt(3))**2-(7*math.sqrt(3))**2),
 ('A',3,'b'):13*math.sqrt(3)/math.sin(math.pi/3),
 ('A',4,'a'):126/6,('A',4,'b'):42*math.sqrt(3)/3*math.sin(math.pi/3),
 ('A',5,'a'):6,('A',5,'b'):6,('A',6,'a'):60,('A',6,'b'):60,
 ('A',7,'a'):250*160/80,('A',7,'b'):300*180/90,
 ('A',10,'a'):math.sqrt(7.5*2.5**3),('A',10,'b'):3**2/math.sqrt(3),
 ('A',11,'a'):6*math.sqrt(10**2-6**2),('A',11,'b'):12*math.sqrt(13**2-12**2),
 ('A',12,'a'):(14*3/7)*math.sqrt(14**2-(14*3/7)**2),
 ('A',12,'b'):6*math.sqrt((6/(2/5))**2-6**2),
 ('B',1,'a'):2/math.sqrt(4/3**2-1/6**2),
 ('B',1,'b'):10/math.sqrt(4/4**2-1/10**2),
 ('C',2,'a'):math.sqrt(4*(1**2+1*7+7**2)/3),
 ('C',2,'b'):math.sqrt(4*(2**2-2*5+5**2)/3),
}
# Independently solve C4 using r=base/leg from area ratio and S=(base²/4)*sqrt(4/r²-1).
for part,s,t in [('a',4,2.5),('b',12,6.5)]:
    r=s/t;expected['C',4,part]=math.sqrt(4*(s+t)/math.sqrt(4/r**2-1))

for key,c in cards.items():
    m=c['model'];P=m['points']
    assert c['section']=='1.2' and len(c['steps'])>=3
    for s in c['steps']:assert s['view'] in m['views']
    for e in m['edges']:assert len(e)==2 and all(n in P for n in e)
    if key in expected:
        for answer in c['answer']['accepted']:close(value(answer),expected[key],str(key)+' accepted answer')
    else:
        assert key[:2]==('C',1)
        triple=list(map(int,c['answer']['accepted'][0].split(';')))
        bound=132 if key[2]=='a' else 126
        known=80 if key[2]=='a' else 70
        truths=[len(set(triple))<3,90 in triple,max(triple[0]+triple[1],triple[0]+triple[2],triple[1]+triple[2])<bound,known in triple]
        assert truths==[True,False,True,True] and sum(triple)==180
        # Enumerate all integer-angle triples, including the alternatives rejected in the solution.
        possibilities=[]
        for a in range(1,180):
            for b in range(a,(180-a)//2+1):
                cs=180-a-b
                ts=[a==b or b==cs or a==cs,90 in [a,b,cs],b+cs<bound,known in [a,b,cs]]
                if sum(ts)==3:possibilities.append([a,b,cs])
        assert possibilities==[triple],(key,possibilities)
        count+=2
        continue

    lev,num,part=key
    if lev=='A' and num==2:
        close(d(P,'A','C'),d(P,'B','C'),'equal legs')
        close(angle(P,'A','C','B'),48 if part=='a' else 128,'source apex angle')
        close(angle(P,'E','A','C'),expected[key],'external angle')
    elif lev=='A' and num in [3,4,5,6,10]:
        close(d(P,'A','B'),d(P,'B','C'),'equilateral AB=BC')
        close(d(P,'A','C'),d(P,'B','C'),'equilateral AC=BC')
        if num in [3,4,10]:right(P,'C','H','A')
        if num==3:close(d(P,'C','H') if part=='a' else d(P,'A','B'),expected[key],'requested equilateral length')
        if num==4:
            if part=='a':
                close(sum(d(P,a,b) for a,b in [('A','B'),('B','C'),('C','A')]),126,'source perimeter')
                close(d(P,'M','N'),expected[key],'middle line')
            else:close(d(P,'C','H'),expected[key],'height by perimeter')
        if num==5:
            close(d(P,'A','H'),6,'given height')
            close(d(P,'B','M') if part=='a' else d(P,'C','K'),6,'median/bisector')
        if num==6:close(angle(P,'A','O','M' if part=='a' else'K'),60,'acute line angle')
        if num==10:close(area(P,'A','B','C'),expected[key],'equilateral area')
    elif lev=='A' and num==7:
        close(d(P,'_a1','_a2'),80 if part=='a' else 90,'small screen')
        close(d(P,'_b1','_b2'),160 if part=='a' else 180,'large screen')
        close(d(P,'O','A'),250 if part=='a' else 300,'given distance')
        close(d(P,'O','B'),expected[key],'minimum distance')
        close(area(P,'O','_a1','_b1'),0,'lower ray collinear')
        close(area(P,'O','_a2','_b2'),0,'upper ray collinear')
    elif lev=='A' and num in [11,12]:
        close(d(P,'A','C'),d(P,'B','C'),'isosceles legs')
        right(P,'C','H','A');close(area(P,'A','B','C'),expected[key],'source area')
        if num==12:
            if part=='a':close(math.cos(math.radians(angle(P,'C','A','B'))),3/7,'given cosine');close(d(P,'A','C'),14,'given leg')
            else:close(math.sin(math.radians(angle(P,'C','A','B'))),2/5,'given sine');close(d(P,'C','H'),6,'given height')
    elif lev=='B':
        right(P,'A','P','C');right(P,'B','Q','C');right(P,'C','H','A')
        close(d(P,'A','P'),3 if part=='a' else 4,'first given height')
        close(d(P,'B','Q'),3 if part=='a' else 4,'second given height')
        close(d(P,'C','H'),6 if part=='a' else 10,'third given height')
        close(d(P,'A','B') if part=='a' else area(P,'A','B','C'),expected[key],'requested base/area')
    elif lev=='C' and num==2:
        close(d(P,'A','B'),d(P,'A','C'),'equilateral sides');close(d(P,'A','B'),d(P,'B','C'),'equilateral sides')
        right(P,'A','P','C');right(P,'B','Q','C')
        close(d(P,'A','P'),1 if part=='a' else 2,'given distance A')
        close(d(P,'B','Q'),7 if part=='a' else 5,'given distance B')
        close(d(P,'A','B'),expected[key],'side from two distances')
        assert P['A'][0]<P['D'][0]<P['B'][0] if part=='a' else P['D'][0]<P['A'][0]<P['B'][0]
        close(area(P,'C','D','P'),0,'first foot on line');close(area(P,'C','D','Q'),0,'second foot on line')
    elif lev=='C' and num==4:
        close(d(P,'A','B'),d(P,'B','C'),'correct equal legs AB=BC')
        close(angle(P,'A','C','D'),angle(P,'D','C','B'),'source bisector')
        close(area(P,'A','C','D'),4 if part=='a' else 12,'first given area')
        close(area(P,'B','C','D'),2.5 if part=='a' else 6.5,'second given area')
        close(d(P,'A','C'),expected[key],'requested base AC')
    print(f'1.2-{lev}{num}{part}: source values, answer aliases and model checked')

assert len(cards)==26
print(f'PASS: 26 variants; {count} independent numeric/logic assertions.')

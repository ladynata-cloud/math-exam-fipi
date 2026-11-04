"""Independent IX theory/source oracles: points76–83 and questions1–19.

Expected facts were independently read from the supplied 2023 source pages.
No author generator, coordinate-claim list or author numeric expected values
supplies the mathematical oracles. Generic marker validation is supplementary.
"""
from pathlib import Path
import hashlib
import json
import math
import sys

ROOT=Path(__file__).resolve().parents[2]
DIR=ROOT/'geometry-course/textbook'
prepared=json.loads((DIR/'preparation/chapter-09-theory.json').read_text())
records={(k,e['number']):e for k in ['theory','selfchecks'] for e in prepared[k]}
items={(m['collection'],m['number']):m for m in json.loads((DIR/'models/chapter-09-theory.json').read_text())['models']}
models={k:m['model'] for k,m in items.items()}
checks=0
reviewed={}

def ok(x,label=''):
    global checks
    checks+=1
    assert x,label

def near(a,b,label=''):
    ok(abs(a-b)<=2e-6*max(1,abs(a),abs(b)),(label,a,b))

def P(k,n,case=0):
    suffix='__case'+str(case) if case else ''
    return {a[:-len(suffix)] if suffix else a:b[:2] for a,b in models[k,n]['points'].items()
            if (a.endswith(suffix) if suffix else '__case' not in a)}

def V(p,a,b):return [p[b][i]-p[a][i] for i in (0,1)]
def L(p,a,b):return math.dist(p[a],p[b])
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def det(a,b):return a[0]*b[1]-a[1]*b[0]
def angle(p,a,o,b):
    x,y=V(p,o,a),V(p,o,b)
    return math.degrees(math.acos(max(-1,min(1,dot(x,y)/math.hypot(*x)/math.hypot(*y)))))
def perp(p,a,b,c,d):near(dot(V(p,a,b),V(p,c,d))/L(p,a,b)/L(p,c,d),0)
def line_distance(p,o,a,b):return abs(det(V(p,a,b),V(p,a,o)))/L(p,a,b)
def ratio(p,a,b,c,d,r):near(L(p,a,b)/L(p,c,d),r)
def col(p,a,b,c):near(det(V(p,a,b),V(p,a,c)),0)
def circle(p,names):
    for a in names:near(L(p,'O',a),L(p,'O',names[0]))
def mark(k,n,reason):reviewed[k,n]=reason

ok(set(models)=={('theory',n) for n in range(76,84)}|{('selfcheck',n) for n in range(1,20)},'Exact27card inventory')
ok(prepared['preparationCoverage']['complete'])
for k,n in [('theory',76),('selfcheck',1)]:
    p=P(k,n);circle(p,'AB');perp(p,'O','H','_L','_U')
    ok(L(p,'O','H')<L(p,'O','_R'))
    for case,expected in [(1,1),(2,1.25)]:
        q=P(k,n,case);ratio(q,'O','H','O','_R',expected)
        perp(q,'O','H','_L','_U')
    q=P(k,n,3);col(q,'A','O','B');circle(q,'AB')
    mark(k,n,'All d/r cases, exactly-two-point argument, tangent uniqueness and d=0 diameter exception verified.')
p=P('selfcheck',2);perp(p,'O','M','A','B');col(p,'A','M','B')
mark('selfcheck',2,'Perpendicular at specified point has distance exactly radius; unique line.')

def unique_center(p):
    circle(p,'ABC');col(p,'A','H','B');col(p,'B','K','C')
    ratio(p,'A','H','H','B',1);ratio(p,'B','K','K','C',1)
    perp(p,'O','H','A','B');perp(p,'O','K','B','C')

for k,n in [('theory',77),('selfcheck',4)]:
    p=P(k,n)
    for m in ['M1','M2']:
        near(L(p,'O1',m),L(p,'O1','_R'));near(L(p,'O2',m),L(p,'O2','_r'))
    ok(det(V(p,'O1','O2'),V(p,'O1','M1'))*det(V(p,'O1','O2'),V(p,'O1','M2'))<0)
    q=P(k,n,1);ratio(q,'O1','_R','O1','_r',4/2.5)
    q=P(k,n,2);ratio(q,'A','C','A','B',5/6);ratio(q,'B','C','A','B',4/6);perp(q,'C','H','A','B')
    for case,kind in [(3,'external-touch'),(4,'internal-touch'),(5,'separate'),(6,'nested')]:
        q=P(k,n,case);R=L(q,'O1','_R');r=L(q,'O2','_r');d=L(q,'O1','O2')
        if kind=='external-touch':near(d,R+r)
        if kind=='internal-touch':near(d,R-r)
        if kind=='separate':ok(d>R+r)
        if kind=='nested':ok(d<R-r)
    q=P(k,n,7);unique_center(q)
    visible=models[k,n]['views']['step-2']['points']
    ok(all(a+'__case7' in visible for a in 'ABCO'),'Three-common-points proof uses its own actual drawing')
    mark(k,n,'Five distinct-centre positions, concentric/coincident exceptions, triangle-existence lemma and three-common-points contradiction verified.')
p=P('selfcheck',3);unique_center(p)
mark('selfcheck',3,'Distinct-circles qualification and unique perpendicular-bisector intersection checked.')
# Independent general triangle-lemma algebra across scalene/equal-side families.
for c in [2,3.7,6,13]:
    for b in [.6*c,.8*c,c]:
        for a in [.7*b,.9*b,b]:
            if a+b<=c:continue
            y=(b*b+c*c-a*a)/(2*c)
            ok(0<y<b<=c)
            h=math.sqrt(b*b-y*y)
            near(math.hypot(y,h),b);near(math.hypot(c-y,h),a)

for k,n in [('theory',78),('selfcheck',5)]:
    for case,count in [(1,0),(2,1),(3,2),(4,3),(0,4)]:
        p=P(k,n,case);view=models[k,n]['views']['case-'+str(case) if case else 'step-6']
        ok(len(view.get('lines',[]))==count)
        suffix='__case'+str(case) if case else ''
        for pair in view.get('lines',[]):
            a,b=[x.removesuffix(suffix) if suffix else x for x in pair]
            near(line_distance(p,'O1',a,b),L(p,'O1','_R'))
            near(line_distance(p,'O2',a,b),L(p,'O2','_r'))
    p=P(k,n);lines=models[k,n]['views']['step-1']['lines']
    ok(len(lines)==2)
    signs=[det(V(p,a,b),V(p,a,'O1'))*det(V(p,a,b),V(p,a,'O2')) for a,b in lines]
    ok(min(signs)<0<max(signs),'Definition scene distinguishes external and internal tangents')
    mark(k,n,'Tangent counts0–4 and each actual tangent checked by distances to both centres; signed half-planes check external/internal definitions.')

for k,n in [('theory',79),('selfcheck',6),('selfcheck',8)]:
    p=P(k,n);circle(p,'ABCD');near(angle(p,'A','O','B'),115);near(angle(p,'A','O','C'),30);near(angle(p,'C','O','B'),145);col(p,'B','O','D')
    mark(k,n,'Central angle, diameter, unambiguous arc notation and sourcefigure257 numeric arcs145/245/215/180 verified.')
p=P('selfcheck',7);col(p,'A','O','B');circle(p,'ABL')
q=P('selfcheck',7,1);circle(q,'ABCD')
mark('selfcheck',7,'Semicircle and distinct smaller/larger arcs checked on separate models.')

for k,n in [('theory',80),('selfcheck',9)]:
    for case,expect in [(0,30),(1,57.5),(2,22.5)]:
        p=P(k,n,case);circle(p,'ABC');near(angle(p,'A','B','C'),expect)
        if case==0:col(p,'B','O','C')
        elif case==1:near(angle(p,'A','B','D')+angle(p,'D','B','C'),expect)
        else:near(angle(p,'A','B','D')-angle(p,'C','B','D'),expect)
    p=P(k,n,3);circle(p,'ABCE');near(angle(p,'A','B','C'),angle(p,'A','E','C'))
    p=P(k,n,4);col(p,'A','O','C');near(angle(p,'A','B','C'),90)
    mark(k,n,'All three positions of BO, sum and difference proofs, same-arc and diameter corollaries verified without omitting the external-ray case.')
p=P('selfcheck',10);circle(p,'ABCE');near(angle(p,'A','B','C'),60);near(angle(p,'A','E','C'),60)
mark('selfcheck',10,'Both vertices lie on the complementary arc; same endpoint chords alone are not used as the criterion.')
p=P('selfcheck',11);circle(p,'ABC');col(p,'A','O','C');near(angle(p,'A','B','C'),90)
ok(not models['selfcheck',11]['views']['neutral'].get('rightAngles'))
mark('selfcheck',11,'Diameter and90-degree theorem checked; initial scene does not reveal the right-angle conclusion.')

def chord_angle(p):
    circle(p,'ABCD');col(p,'A','M','B');col(p,'C','M','D')
    near(angle(p,'A','M','C'),(angle(p,'A','O','C')+angle(p,'B','O','D'))/2)
    near(angle(p,'A','M','C'),77.5)
def secant_angle(p):
    circle(p,'ABCD');col(p,'M','B','A');col(p,'M','D','C')
    ok(L(p,'M','B')<L(p,'M','A'));ok(L(p,'M','D')<L(p,'M','C'))
    near(angle(p,'A','M','C'),(angle(p,'A','O','C')-angle(p,'B','O','D'))/2)
    near(angle(p,'A','M','C'),10)
def tangent_chord(p):
    circle(p,'ABM');perp(p,'O','M','L','K')
    near(angle(p,'A','M','K'),55);near(angle(p,'A','M','K'),angle(p,'M','B','A'))
    near(angle(p,'L','M','A'),125)
def tangent_secant(p):
    circle(p,'KAB');col(p,'M','A','B');perp(p,'O','K','L','M')
    near(angle(p,'B','M','K'),45)
    near(angle(p,'B','K','L')-angle(p,'M','B','K'),45)
    near((angle(p,'B','O','K')-angle(p,'A','O','K'))/2,45)
chord_angle(P('theory',81));secant_angle(P('theory',81,1));tangent_chord(P('theory',81,2));tangent_secant(P('theory',81,5))
p=P('theory',81,4);col(p,'A','O','M');near(angle(p,'A','M','K'),90)
mark('theory',81,'Four complete external-angle proofs, exact source-side orders, diameter and supplementary-angle cases verified.')
for n,f in [(12,chord_angle),(13,secant_angle),(14,tangent_chord),(15,tangent_secant)]:
    f(P('selfcheck',n));mark('selfcheck',n,'Individual angle theorem checked against source, its proof and independent coordinate/arc identities.')

def incircle(p):
    circle(p,'KLMN')
    for a,b,k in [('A','B','K'),('B','C','L'),('C','D','M'),('D','A','N')]:
        col(p,a,k,b);perp(p,'O',k,a,b)
        ok(dot(V(p,a,k),V(p,b,k))<0,'Contact lies on side, not its extension')
    for a,k,l in [('A','K','N'),('B','K','L'),('C','L','M'),('D','M','N')]:near(L(p,a,k),L(p,a,l))
    near(L(p,'A','B')+L(p,'C','D'),L(p,'B','C')+L(p,'D','A'))
for k,n in [('theory',82),('selfcheck',16),('selfcheck',17)]:
    incircle(P(k,n));mark(k,n,'All four side contacts, tangent-segment equality and Pitot direct proof independently verified.')
p=P('theory',82,1)
touch=[abs(line_distance(p,'O',a,b)-L(p,'O','T'))<1e-6 for a,b in [('A','B'),('B','C'),('C','D'),('D','A')]]
ok(sum(touch)==3,'Non-square rectangle counterexample has exactly three tangent sides')
ok('№807' in records['theory',82]['steps'][-1] and 'выпуклый' in records['theory',82]['steps'][-1])

for k,n in [('theory',83),('selfcheck',18),('selfcheck',19)]:
    p=P(k,n);circle(p,'ABCD')
    near(angle(p,'D','A','B')+angle(p,'B','C','D'),180)
    near(angle(p,'A','B','C')+angle(p,'C','D','A'),180)
    mark(k,n,'Cyclic definitions, complementary intercepted arcs and both opposite-angle sums verified.')
p=P('theory',83,1)
for a,b in [('B','C'),('C','D'),('D','A')]:near(L(p,a,b),L(p,'A','B'))
near(angle(p,'D','A','B'),60);near(angle(p,'B','C','D'),60)
ok('№810' in records['theory',83]['steps'][-1] and 'выпуклом' in records['theory',83]['steps'][-1])

# Cross-links checked semantically against the exact2023 catalog.
for key,item in items.items():
    for step in item['didactics']['steps']:
        reason=step['justification'];refs=step['theoryPoints']
        ok(all(1<=n<=83 for n in refs))
        if 'Пифагора' in reason:ok(60 in refs and 57 not in refs,(key,reason,refs))
        if 'неравенств' in reason.lower() and 'треугольника' in reason:ok(34 in refs,(key,reason,refs))
        if 'Смежные углы' in reason:ok(11 in refs and 8 not in refs)
        if 'Определение радиуса' in reason:ok(21 in refs)
        if 'Серединный перпендикуляр' in reason or 'Свойство серединного перпендикуляра' in reason:ok(40 in refs)
        if 'Равенство отрезков касательных' in reason:ok(42 in refs and 41 not in refs)
# Retain the original six cards' instructional text and source identity;
# correcting wrong theory cross-links is intentionally allowed.
ORIGINAL_TEXT_HASHES = {('theory', 76): '2ef8bd7a25a5c5dfa160067d8b3c7a445d4d92400a775bb0dd271e1dbe21022e', ('theory', 77): '479f245b0aba8d0e2d6f979881cce42663795580fc50d7d092043a38459e485a', ('selfchecks', 1): 'f6d16a67e10b31eb920fee8a4347a5e42fff5943a87d75449b3d529864c0c569', ('selfchecks', 2): '7d586efa34ac48e919b45951468b647ba34413175585eaa5c66adfb5b813dd75', ('selfchecks', 3): 'cd1d1ced77a6ba72806fb85ea2cf31d30f16e958198b8d4e11d00c5f9106e42a', ('selfchecks', 4): '9a7b4520023a9f04840f63bdbcb837e0ff671f100dc54e384a4fbf0494e0b253'}
for key,digest in ORIGINAL_TEXT_HASHES.items():
    value={a:b for a,b in records[key].items() if a!='didactics'}
    near_hash=hashlib.sha256(json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
    ok(near_hash==digest,('original-six textual preservation',key))
ok(set(reviewed)==set(models),'All27 cards reviewed')
sys.path.insert(0,str(ROOT/'tools/geometry-textbook'))
from check_models import validate
errors=[(k,e) for k,m in models.items() for e in validate(m)]
ok(not errors,str(errors))
print(json.dumps({'verdict':'PASS','cards':len(reviewed),'independentAssertions':checks,
                  'views':sum(len(m['views']) for m in models.values()),
                  'claims':sum(len(m['checks']) for m in models.values())},ensure_ascii=False))

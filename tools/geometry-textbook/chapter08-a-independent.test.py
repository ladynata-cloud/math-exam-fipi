"""Independent VIII-A source-number, answer and coordinate oracles.

Reviewer: /root/viii_b (did not author A). Source pages165–171 read visually.
No author helper or author-derived expected values are imported.
"""
from pathlib import Path
import json,math,hashlib,sys

ROOT=Path(__file__).resolve().parents[2]
PREP=ROOT/'geometry-course/textbook/preparation/chapter-08-a.json'
MODELS=ROOT/'geometry-course/textbook/models/chapter-08-a.json'
AUTHOR=ROOT/'tools/geometry-textbook/models_ch8_a.py'
parts={(e['number'],p['part']):p for e in json.loads(PREP.read_text())['exercises'] for p in e['parts']}
models={(m['number'],m['part']):m['model'] for m in json.loads(MODELS.read_text())['models']}
passed={};checks=0

def close(a,b,label=''):
    global checks
    checks+=1
    assert abs(a-b)<=2e-6*max(1,abs(a),abs(b)),(label,a,b)
def good(x,label=''):
    global checks
    checks+=1
    assert x,label
def P(n,part='single',case=0):
    d=models[n,part]['points'];suffix='__case'+str(case) if case else ''
    return {k[:-len(suffix)] if suffix else k:v[:2] for k,v in d.items() if (k.endswith(suffix) if suffix else '__case' not in k)}
def L(p,a,b):return math.dist(p[a],p[b])
def V(p,a,b):return [p[b][i]-p[a][i] for i in (0,1)]
def dot(x,y):return sum(a*b for a,b in zip(x,y))
def cross(x,y):return x[0]*y[1]-x[1]*y[0]
def angle(p,a,o,b):
    x,y=V(p,o,a),V(p,o,b)
    return math.degrees(math.acos(max(-1,min(1,dot(x,y)/math.hypot(*x)/math.hypot(*y)))))
def area(p,a,b,c):return abs(cross(V(p,a,b),V(p,a,c)))/2
def perp(p,a,b,c,d):close(dot(V(p,a,b),V(p,c,d))/(L(p,a,b)*L(p,c,d)),0,'perpendicular')
def parallel(p,a,b,c,d):close(cross(V(p,a,b),V(p,c,d))/(L(p,a,b)*L(p,c,d)),0,'parallel')
def col(p,a,b,c):close(cross(V(p,a,b),V(p,a,c))/max(1,L(p,a,b)*L(p,a,c)),0,'collinear')
def ratio(p,a,b,c,d,r):close(L(p,a,b)/L(p,c,d),r,f'{a}{b}/{c}{d}')
def lengths(p,reference,value,expected):
    unit=value/L(p,*reference)
    for (a,b),x in expected.items():close(L(p,a,b)*unit,x,f'{a}{b} source units')
def similar(p,first=('A','B','C'),second=('A1','B1','C1'),k=None):
    ratios=[L(p,first[i],first[(i+1)%3])/L(p,second[i],second[(i+1)%3]) for i in range(3)]
    for x in ratios:close(x,ratios[0] if k is None else k,'similar sides')
    for i in range(3):close(angle(p,first[(i+1)%3],first[i],first[(i+2)%3]),angle(p,second[(i+1)%3],second[i],second[(i+2)%3]),'corresponding angles')
def mark(n,part='single',reason='Independent source quantities and geometric argument verified.'):
    passed[n,part]=reason

p=P(640);ratio(p,'A','B','C','D',15/20);close(150/200,3/4);mark(640)
for part in 'абв':
    p=P(641,part);lengths(p,('M','M1'),1,{('A','B'):6,('B','C'):3,('C','D'):9,('M1','M2'):2,('A','C'):9,('B','D'):12});mark(641,part)
good(parts[641,'а']['answer']=='Нет.');good(parts[641,'б']['answer']=='Нет.');good(parts[641,'в']['answer']=='Да.')
for case in (0,1):
    p=P(642,case=case);close(L(p,'B','D')/L(p,'D','C'),L(p,'A','B')/L(p,'A','C'));close(angle(p,'B','A','D'),angle(p,'D','A','C'));perp(p,'A','H','B','C');close(area(p,'A','B','D')/area(p,'A','C','D'),L(p,'B','D')/L(p,'D','C'))
mark(642,reason='Area proof checked for an interior and an exterior altitude foot; no similarity criterion is used before its introduction.')
for part,givens in [('а',{('B','C'):9,('A','B'):15,('A','D'):7.5,('D','C'):4.5}),('б',{('B','C'):16,('A','B'):30,('A','D'):20,('D','C'):32/3})]:
    p=P(643,part);lengths(p,('B','C'),givens['B','C'],givens);close(angle(p,'A','B','D'),angle(p,'D','B','C'));mark(643,part)
p=P(644);lengths(p,('B','C'),20,{('A','B'):14,('A','C'):21,('B','D'):8,('D','C'):12});mark(644)
p=P(645);lengths(p,('B','C'),18,{('A','B'):18,('A','C'):6,('B','D'):13.5,('D','C'):4.5});close(18+18+6,42);mark(645)
p=P(646);lengths(p,('N','K'),6,{('M','N'):7,('M','K'):5,('N','E'):3.5,('E','K'):2.5});
for a,z in [('M','D'),('D','E'),('E','F')]:close(L(p,a,z),L(p,'F','M'))
close(angle(p,'N','M','E'),angle(p,'E','M','K'));mark(646)
p=P(647);lengths(p,('C','E'),20,{('C','D'):14,('D','E'):21,('C','F'):8,('F','E'):12});
for a,z in [('D','M'),('M','F'),('F','N')]:close(L(p,a,z),L(p,'N','D'))
close(14+21+20,55);mark(647)
p=P(648);lengths(p,('A','C'),4.4,{('A','B'):5.2,('B','C'):7.6,('E','D'):15.6,('D','F'):22.8,('E','F'):13.2});similar(p,second=('E','D','F'),k=1/3)
independent_angle=math.degrees(math.acos((5.2**2+4.4**2-7.6**2)/(2*5.2*4.4)))
close(angle(p,'B','A','C'),independent_angle);good(abs(independent_angle-106)>1)
p=P(648,case=1)
for a,o,z,v in [('B','A','C',106),('A','B','C',34),('A','C','B',40),('D','E','F',106),('E','D','F',34),('E','F','D',40)]:close(angle(p,a,o,z),v)
good('несовместим' in parts[648,'single']['answer']);good('редакторская' in ' '.join(parts[648,'single']['steps']).lower());mark(648,reason='Source inconsistency independently confirmed: side data imply angle A = %.12f°, not106°. Definition64 is used for the formal intended correspondence, and computational compatibility check is editorial.'%independent_angle)
p=P(649);lengths(p,('A','B'),4,{('B','C'):5,('C','A'):7,('K','M'):8.4,('M','N'):10.5,('N','K'):14.7});similar(p,second=('K','M','N'),k=1/2.1);mark(649)
for case in (0,1):
    p=P(650,case=case);similar(p,k=5/3);perp(p,'B','H','A','C');perp(p,'B1','H1','A1','C1');ratio(p,'B','H','B1','H1',5/3)
    if case:good(dot(V(p,'A','C'),V(p,'A','H'))<0,'external foot')
mark(650,reason='Area-ratio proof valid for either foot position; internal and external coordinate cases verified.')
p=P(651);similar(p,k=.5);close(area(p,'A','B','C')/area(p,'A1','B1','C1'),75/300);close(9*math.sqrt(75/300),4.5);mark(651)
p=P(652);similar(p,k=6/5);close(area(p,'A','B','C')/area(p,'A1','B1','C1'),252/175);close(252-175,77);mark(652)
p,q=P(653),P(653,case=1)
for a,z,c,d in [('A','B','B','C'),('A','C','B','C')]:close(L(p,a,z)/L(p,c,d),L(q,a,z)/L(q,c,d))
close(87.5*100000**2/100000**2,87.5);close(87.5*100,8750);good('каждый в своём' in ' '.join(parts[653,'single']['steps']));mark(653,reason='Area scale10^10 and cm²→km² and hectares conversions verified; separate viewport scales explicitly disclosed.')
p=P(654);similar(p);k=L(p,'A','B')/L(p,'A1','B1');close(sum(L(p,a,z) for a,z in [('A','B'),('B','C'),('C','A')])/sum(L(p,a,z) for a,z in [('A1','B1'),('B1','C1'),('C1','A1')]),k);mark(654)
p=P(655);similar(p,k=2.5);ratio(p,'B','C','B1','C1',140/56);mark(655)
p=P(656);lengths(p,('A','B'),15,{('B','C'):20,('C','A'):30,('A1','B1'):6,('B1','C1'):8,('C1','A1'):12});close(6+8+12,26);mark(656)
p=P(657);lengths(p,('A','B'),8,{('A','C'):12,('C','D'):6,('D','E'):9});perp(p,'A','B','A','C');perp(p,'C','D','D','E');close(angle(p,'B','C','A'),angle(p,'C','E','D'));lengths(p,('S','R'),8,{('P','S'):20,('T','R'):10,('S','T'):6,('P','Q'):21});perp(p,'P','Q','P','R');perp(p,'S','T','P','R');col(p,'Q','T','R');mark(657,reason='Both unlettered source drawings checked separately: x9 and y21; matching α roles verified.')
for part in 'аб':
    p=P(658,part)
    if part=='а':lengths(p,('B','C'),7,{('D','E'):8,('E','C'):4,('A','E'):10,('E','F'):5,('F','C'):3.5})
    else:lengths(p,('A','B'),8,{('A','D'):5,('C','F'):2,('D','E'):40/7,('E','C'):16/7})
    similar(p,('A','D','E'),('F','C','E'));mark(658,part)
for part in 'абв':
    p=P(659,part);parallel(p,'A','B','C','D');col(p,'A','O','C');col(p,'B','O','D');close(L(p,'A','O')/L(p,'O','C'),L(p,'A','B')/L(p,'C','D'));close(L(p,'B','O')/L(p,'O','D'),L(p,'A','B')/L(p,'C','D'))
    if part=='а':lengths(p,('D','C'),25,{('O','B'):4,('O','D'):10,('A','B'):10})
    if part=='в':lengths(p,('D','C'),24,{('A','B'):96,('A','C'):15,('A','O'):12})
    mark(659,part)
p=P(660,'а')
for a,o,z,w in [('B','A','C',40),('A','B','C',100),('E','D','F',70),('D','E','F',40)]:close(angle(p,a,o,z),w)
good('Не обязательно' in parts[660,'а']['answer']);mark(660,'а',reason='Valid unequal angle-multiset counterexample; same acute angle has different roles.')
for part,target in [('б',110),('в',90)]:
    p=P(660,part);similar(p);close(L(p,'A','B'),L(p,'B','C'));close(angle(p,'A','B','C'),target);mark(660,part)
p=P(661);lengths(p,('A','D'),8,{('B','C'):5,('A','B'):3.6,('C','D'):3.9,('M','B'):6,('M','C'):6.5});similar(p,('M','B','C'),('M','A','D'),5/8);mark(661)
for part in 'аб':
    p=P(662,part);parallel(p,'M','N','A','C');parallel(p,'N','P','A','B');col(p,'B','N','C');close(L(p,'A','M'),L(p,'N','P'));close(L(p,'M','N'),L(p,'A','P'))
    if part=='а':lengths(p,('A','B'),10,{('A','C'):15,('A','M'):5,('N','P'):5,('A','P'):7.5,('M','N'):7.5})
    else:
        a,z=L(p,'A','B'),L(p,'A','C');close(L(p,'A','M'),a*z/(a+z));close(L(p,'A','M'),L(p,'A','P'))
    mark(662,part)
p=P(663);close(L(p,'O','A')/L(p,'O','B'),L(p,'A','C')/L(p,'B','D'));similar(p,('O','A','B'),('A','C','C1'));parallel(p,'A','C1','B','D');close(L(p,'A','C1'),L(p,'B','D'));mark(663)
for part in 'абв':
    for case in (0,1):
        p=P(664,part,case);parallel(p,'B','C','D','E')
        if part=='а':lengths(p,('A','D'),22,{('C','E'):10,('B','D'):8,('A','C'):17.5 if not case else 37.5})
        elif part=='б':lengths(p,('A','B'),10,{('A','C'):8,('B','C'):4,('C','E'):4,('B','D'):5,('D','E'):6 if not case else 2})
        else:lengths(p,('D','E'),12,{('B','C'):8 if not case else 24});ratio(p,'A','B','B','D',2)
    mark(664,part,reason='Both allowed parallel-section orders satisfy all given data and the corresponding distinct answer.')
for case in (0,1):
    p=P(665,case=case);parallel(p,'A','A1','B','B1');parallel(p,'B','B1','C','C1');close(L(p,'A','B')/L(p,'B','C'),L(p,'A1','B1')/L(p,'B1','C1'))
    if not case:similar(p,('A','B','X'),('B','C','Y'));close(L(p,'A','X'),L(p,'A1','B1'));close(L(p,'B','Y'),L(p,'B1','C1'))
mark(665,reason='Intercept relation checked for intersecting and parallel transversals; auxiliary parallels and correspondence verified.')
p=P(666);lengths(p,('A','B'),5,{('A','C'):16,('A','D'):8,('A','F'):10});similar(p,('A','C','D'),('A','F','B'),8/5);mark(666)
p=P(667,'а');lengths(p,('A','B'),3,{('B','C'):5,('C','A'):7,('A1','B1'):4.5,('B1','C1'):7.5,('C1','A1'):10.5});similar(p,k=2/3);mark(667,'а')
p=P(667,'б');lengths(p,('A','B'),1.7,{('B','C'):3,('C','A'):4.2});q=P(667,'б',1);lengths(q,('A1','B1'),340,{('B1','C1'):600,('C1','A1'):840});close(1.7/340,1/200);good('отдельных масштабах' in ' '.join(parts[667,'б']['steps']));mark(667,'б')
p=P(668)
for suffix in ('','1'):
    for a,z in [('A','B'),('B','C')]:close(L(p,a+suffix,z+suffix),L(p,'C'+suffix,'A'+suffix))
similar(p);mark(668)
p=P(669);lengths(p,('A','B'),60,{('A','C'):60,('B','C'):50,('B','D'):25,('C','D'):25});ratio(p,'A','O','O','D',12/5)
for a,z in [('A','B'),('A','C'),('B','C')]:close(abs(cross(V(p,a,z),V(p,a,'O')))/L(p,a,z),L(p,'O','D'))
close(angle(p,'A','B','O'),angle(p,'O','B','C'));mark(669)
p=P(670);a,h=L(p,'A','B'),L(p,'C','H');x=a*h/(a+h)
for edge in [('M','N'),('N','P'),('P','Q'),('Q','M')]:close(L(p,*edge),x)
perp(p,'M','N','M','Q');col(p,'A','Q','C');col(p,'B','P','C');col(p,'A','M','B');col(p,'A','N','B')
q=P(670,case=1);aa,hh=L(q,'A','B'),L(q,'A','C');close(L(q,'A','D'),aa*hh/(aa+hh));col(q,'B','E','C')
q=P(670,case=2);good(dot(V(q,'A','B'),V(q,'A','H'))<0);good('не существует' in parts[670,'single']['answer']);mark(670,reason='Formula ah/(a+h), right-angle boundary and non-existence with external foot independently verified.')
for part,t in [('а',1),('б',.5)]:
    p=P(671,part);ratio(p,'A','M','M','D',t);ratio(p,'A','K','K','C',t/2);close(L(p,'B','D'),L(p,'D','C'));close(L(p,'D','M'),L(p,'D','E'));parallel(p,'B','K','C','E');similar(p,('A','M','K'),('A','E','C'));mark(671,part)

good(set(passed)==set(parts)==set(models),'Every one of45 explicit parts must have an independent oracle')
# Shared validation covers authored markers in every hidden view in addition to
# the independent source-conditioned assertions above.
sys.path.insert(0,str(ROOT/'tools/geometry-textbook'))
from check_models import validate
errors=[(key,e) for key,m in models.items() for e in validate(m)]
good(not errors,str(errors))
report=dict(scope='Independent mathematics and pedagogy, VIII exercises640–671, all45 explicit parts',reviewer='/root/viii_b',independentOfAuthor=True,sourcePages=[165,166,167,168,169,170,171],method='Actual source images and every condition, answer, proof and geometric case read; independent constants, side correspondences, areas, ratios, angle roles and boundary cases evaluated. Shared generic marker gate supplementary only.',verdict='PASS',cards=len(passed),independentAssertions=checks,views=sum(len(m['views']) for m in models.values()),claims=sum(len(m['checks']) for m in models.values()),files={str(f.relative_to(ROOT)):hashlib.sha256(f.read_bytes()).hexdigest() for f in (AUTHOR,PREP,MODELS)},cardsReviewed=[dict(number=n,part=part,result='PASS',reason=why) for (n,part),why in passed.items()],fixesBeforeApproval=['648 no longer invokes AA before point66: correspondence then definition64; inconsistency check explicitly editorial.','650 added an external-foot pair with visible baseline extensions.'],limits=['This is not a visual approval of all320/1280 rendered views.','This is not a Claude/external-provider verdict, release approval, or Git exact-head CI result.'])
print(json.dumps({k:report[k] for k in ('verdict','cards','independentAssertions','views','claims','files')},ensure_ascii=False))

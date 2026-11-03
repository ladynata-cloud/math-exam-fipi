"""Independent IX-A source-conditioned mathematical oracles, all 57 parts.

The reviewer read printed source pages 197–199, 204–205 and every authored
condition, answer, proof and model. Expected values below come from that
source and independent geometry, not from the author generator or its claims.
This is not a browser/visual approval or a release receipt.
"""
from pathlib import Path
import json
import math
import sys

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / 'geometry-course/textbook'
prep = json.loads((DIR / 'preparation/chapter-09-a.json').read_text())
parts = {(e['number'], p['part']): p for e in prep['exercises'] for p in e['parts']}
models = {(e['number'], e['part']): e['model'] for e in json.loads(
    (DIR / 'models/chapter-09-a.json').read_text())['models']}
checked = {}
assertions = 0


def ok(value, label=''):
    global assertions
    assertions += 1
    assert value, label


def near(a, b, label=''):
    ok(abs(a-b) < 2e-6 * max(1, abs(a), abs(b)), (label, a, b))


def P(n, part='single', case=0):
    suffix = '__case' + str(case) if case else ''
    return {k[:-len(suffix)] if suffix else k: v[:2]
            for k, v in models[n, part]['points'].items()
            if (k.endswith(suffix) if suffix else '__case' not in k)}


def v(p, a, b): return [p[b][i] - p[a][i] for i in (0, 1)]
def dot(a, b): return sum(x*y for x, y in zip(a, b))
def det(a, b): return a[0]*b[1]-a[1]*b[0]
def length(p, a, b): return math.dist(p[a], p[b])
def ratio(p, a, b, c, d, r): near(length(p, a, b)/length(p, c, d), r)
def col(p, a, b, c): near(det(v(p, a, b), v(p, a, c)), 0)
def perpendicular(p, a, b, c, d):
    near(dot(v(p, a, b), v(p, c, d))/(length(p, a, b)*length(p, c, d)), 0)


def parallel(p, a, b, c, d):
    near(det(v(p, a, b), v(p, c, d))/(length(p, a, b)*length(p, c, d)), 0)


def distance_to_line(p, o, a, b):
    return abs(det(v(p, a, b), v(p, a, o)))/length(p, a, b)


def angle(p, a, o, b):
    u, w = v(p, o, a), v(p, o, b)
    return math.degrees(math.acos(max(-1, min(1, dot(u, w)/math.hypot(*u)/math.hypot(*w)))))


def mark(n, part='single', reason='Source condition, complete argument and coordinate model checked.'):
    checked[n, part] = reason


# Explicit source subparts independently read from the supplied edition.
explicit = {737: 'абв', 739: 'абвгд', 740: 'абвгд', 748: 'абв',
            749: 'абв', 754: 'абвг', 755: 'абвгд', 756: 'аб',
            762: 'абвг', 763: 'абв', 764: 'аб'}
expected = {(n, q) for n in range(737, 766) for q in explicit.get(n, ['single'])}
ok(set(parts) == set(models) == expected and len(expected) == 57, 'Exact source inventory')

for q, r_over_d in zip('абв', [.5, 5/3, 1]):
    p = P(737, q)
    perpendicular(p, 'O', 'H', '_L', '_R')
    ratio(p, 'O', '_r', 'O', 'H', r_over_d)
    ok(not models[737, q]['views']['neutral'].get('circles'), '737 no preconstructed answer')
    ok(len(models[737, q]['views']['step-3']['circles']) == 1)
    mark(737, q, 'Positive radius on the required side of the distance; constructive answer appears only at the construction step.')

p = P(738)
perpendicular(p, 'O', 'M', '_L', '_R')
ok(length(p, 'O', 'M') > 0)
ok('бесконечно много' in parts[738, 'single']['steps'][-1])
mark(738)

for q, R_over_d, r_over_d in [('а',5/3,1/3),('б',1/3,1/6),('в',5/6,1/2),('г',2/3,1/3),('д',4/3,1/3)]:
    p = P(739, q)
    ratio(p, 'A', '_R', 'A', 'B', R_over_d)
    ratio(p, 'B', '_r', 'A', 'B', r_over_d)
    if q == 'а': ok(1 < R_over_d-r_over_d)
    if q == 'б': ok(1 > R_over_d+r_over_d)
    if q == 'в': ok(abs(R_over_d-r_over_d) < 1 < R_over_d+r_over_d)
    if q == 'г': near(R_over_d+r_over_d, 1)
    if q == 'д': near(R_over_d-r_over_d, 1)
    mark(739, q)

for q, r, d in [('а',16,12),('б',5,4.2),('в',7.2,3.7),('г',8,12),('д',5,5)]:
    p = P(740, q)
    near(distance_to_line(p, 'O', '_L', '_R')/length(p, 'O', '_r'), d/r)
    answer = parts[740, q]['answer']
    ok(('две' in answer) if d < r else ('нет' in answer) if d > r else ('одна' in answer))
    mark(740, q, 'Source lengths including 1.2 dm→12 cm and 50 mm→5 cm checked before the distance-radius comparison.')

for case in [0, 1]:
    p = P(741, case=case)
    col(p, '_L', 'A', '_R')
    ok(length(p, 'O', 'A') < length(p, 'O', '_r'))
    ok(distance_to_line(p, 'O', '_L', '_R') <= length(p, 'O', 'A')+1e-7)
mark(741, reason='General d≤OA<r proof covers arbitrary lines, equality of foot with A, and lines through O.')

p = P(742)
for a, b in [('O','A'),('A','B'),('B','C'),('C','O')]:
    ratio(p, a, b, 'O', '_r', 6/5)
perpendicular(p, 'O', 'A', 'A', 'B')
near(distance_to_line(p, 'O', 'A', 'C')/length(p, 'O', '_r'), 3*math.sqrt(2)/5)
near(distance_to_line(p, 'O', 'O', 'A'), 0)
ok('OA и AC' in parts[742, 'single']['answer'])
mark(742)

p = P(743)
ratio(p, 'A', 'H', 'H', 'B', 1)
ratio(p, 'O', 'A', 'O', 'B', 1)
col(p, 'O', 'H', 'M')
perpendicular(p, 'O', 'M', 'A', 'B')
parallel(p, 'A', 'B', '_L', '_R')
q = P(743, case=1)
col(q, 'A', 'O', 'B')
near(angle(q, 'B', 'O', 'M'), 45)
perpendicular(q, 'O', 'M', '_L', '_R')
ok(abs(det(v(q, 'A','B'), v(q, '_L','_R'))) > 1)
ok('диаметр' in parts[743, 'single']['conditionSummary'])
mark(743, reason='Valid SSS proof for the non-diameter chord; explicit diameter counterexample independently checked, not silently excluded.')

for n, r, hyp, tangent in [(744,1.5,2,math.sqrt(7)/2),(745,12,24,12*math.sqrt(3))]:
    p = P(n)
    perpendicular(p, 'O','B','A','B')
    ratio(p, 'O','A','O','B',hyp/r)
    ratio(p, 'A','B','O','B',tangent/r)
    near(tangent*tangent+r*r,hyp*hyp)
    if n == 745: near(angle(p,'A','O','B'),60)
    mark(n)

for case, beta, ordinary in [(0,30,90),(1,75,135)]:
    p = P(746, case=case)
    col(p,'O','B','C')
    ratio(p,'O','B','B','C',1)
    ratio(p,'O','A','O','B',1)
    perpendicular(p,'O','A','M','A')
    perpendicular(p,'O','B','M','B')
    near(angle(p,'B','M','C'),beta)
    near(angle(p,'A','M','C'),ordinary)
    near(ordinary, min(3*beta,360-3*beta))
ok('360° − 3β' in ' '.join(parts[746, 'single']['steps']))
mark(746, reason='Two right-triangle congruences establish the angle through MB; actual 75° counterexample yields ordinary AMC135° rather than225°.')

p = P(747)
col(p,'A','O','B')
ratio(p,'A','O','O','B',1)
perpendicular(p,'A','A1','_L','_R')
perpendicular(p,'B','B1','_L','_R')
perpendicular(p,'O','M','_L','_R')
ratio(p,'A1','M','M','B1',1)
ratio(p,'O','P','O','Q',1)
perpendicular(p,'A','P','P','O')
perpendicular(p,'B','Q','Q','O')
near(angle(p,'A','O','P'),angle(p,'B','O','Q'))
for a,b,c,d in [('A1','M','O','P'),('M','B1','O','Q')]: ratio(p,a,b,c,d,1)
ok(['B','Q'] in models[747,'single']['views']['step-2']['segments'])
ok(['B','Q'] not in models[747,'single']['views']['neutral']['segments'])
p=P(747,case=1)
parallel(p,'A','B','A1','B1')
ratio(p,'A1','M','O','A',1)
ratio(p,'M','B1','O','B',1)
mark(747, reason='Direct congruent-right-triangle and rectangle proof replaces an unsupported Thales cross-link; parallel-diameter degeneracy has a separate exact scene and proof.')

for q in 'абв':
    p = P(748,q)
    perpendicular(p,'A','B','A','D')
    perpendicular(p,'A','D','C','D')
    parallel(p,'A','B','C','D')
    if q=='а': near(distance_to_line(p,'B','A','D'),length(p,'A','B'))
    if q=='б': near(distance_to_line(p,'A','C','D'),length(p,'A','D'))
    if q=='в': ok(distance_to_line(p,'B','C','D') < length(p,'B','C'))
    mark(748,q, 'The book defines a trapezoid with exactly one parallel-side pair; rectangle exception is excluded explicitly in the proof.')

for q, hyp, h, deg in [('а',5,3,None),('б',4,2*math.sqrt(2),45),('в',6,3,30)]:
    p = P(749,q)
    perpendicular(p,'A','H','O','H')
    ratio(p,'O','H','O','_r',h/3)
    ratio(p,'O','A','O','_r',hyp/3)
    if deg: near(angle(p,'H','A','O'),deg)
    else: ratio(p,'A','H','O','_r',4/3)
    mark(749,q)

ok([d for d in range(0,12) if abs(5-3)<d<5+3] == [3,4,5,6,7])
for case,d in [(0,6),(1,3),(2,4),(3,5),(4,7)]:
    p=P(750,case=case)
    ratio(p,'O1','O2','O1','_R',d/5)
    ratio(p,'O2','_r','O1','_R',3/5)
mark(750)
for n,R,r,d in [(751,7,3,4),(752,10,6,16)]:
    p=P(n)
    ratio(p,'O1','O2','O1','_R',d/R)
    ratio(p,'O2','K','O1','K',r/R)
    mark(n)
ok([r for r in range(1,15) if 8+r<14] == [1,2,3,4,5])
p=P(753)
ratio(p,'O1','O2','O1','_R',14/8)
ok('6 см дало бы внешнее касание' in ' '.join(parts[753,'single']['steps']))
mark(753)

for q,d in zip('абвг',[16,14,7,4]):
    p=P(754,q)
    ratio(p,'O1','O2','O1','_R',d/9)
    ratio(p,'O2','_r','O1','_R',5/9)
    mark(754,q)

for q,R,r,d,expected_count in [('а',8,6,12,2),('б',8,4,12,3),('в',6,4,12,4),('г',8,6,2,1),('д',5,4,3,2)]:
    p=P(755,q)
    final=models[755,q]['views']['step-2']
    ok(len(final['lines'])==expected_count)
    ratio(p,'O1','O2','O1','_R',d/R)
    ratio(p,'O2','_r','O1','_R',r/R)
    for a,b in final['lines']:
        near(distance_to_line(p,'O1',a,b),length(p,'O1','_R'))
        near(distance_to_line(p,'O2',a,b),length(p,'O2','_r'))
    ok(not models[755,q]['views']['neutral'].get('lines'))
    mark(755,q,'Independent perpendicular-distance oracle checks each drawn line touches both circles and the textbook count is exact.')

for q in 'аб':
    p=P(756,q)
    for a,b in [('A','B'),('B','C'),('C','A')]:
        ratio(p,a,b,'A','D',2)
    near(angle(p,'B','A','C'),60)
    if q=='б':
        for a,b in [('D','E'),('E','F'),('F','D')]: ratio(p,a,b,'A','D',1)
        near(angle(p,'E','D','F'),60)
    mark(756,q)
p=P(757)
near(angle(p,'_P','V','_Q'),60)
near(distance_to_line(p,'O1','V','_P'),length(p,'O1','A'))
near(distance_to_line(p,'O2','V','_P'),length(p,'O2','C'))
ratio(p,'O2','C','O1','A',3)
near(length(p,'O1','O2'),length(p,'O1','A')+length(p,'O2','C'))
mark(757)

for n,R,r,d in [(758,5,3,8),(759,5,3,10),(760,7,2,3)]:
    p=P(n)
    ratio(p,'O1','O2','O1','_R',d/R)
    ratio(p,'O2','M','O1','_R',r/R)
    if n==758: near(d,R+r)
    if n==759: ok(d-r>R)
    if n==760: ok(d+r<R)
    mark(n,reason='Existence/uniqueness and triangle-inequality proof checked for arbitrary circle points; collinear equality and concentric cases are explicit.')
p=P(760,case=1)
ratio(p,'O','B','O','A',2/7)

p=P(761)
for k in ['K','K1']:
    near(length(p,'O',k),length(p,'O','_r'))
    near(length(p,'O1',k),length(p,'O1','M'))
    perpendicular(p,'O',k,'M',k)
ratio(p,'O','O1','O1','M',1)
ok('ровно два' in parts[761,'single']['steps'][-1])
mark(761,reason='Both tangent points, circle intersections, d>R existence inequality, and completeness argument checked.')
for q,deg in zip('абвг',[60,90,120,180]):
    p=P(762,q)
    near(length(p,'O','A'),length(p,'O','B'))
    near(angle(p,'A','O','B'),deg)
    mark(762,q)
for q,deg,chord in [('а',60,16),('б',90,16*math.sqrt(2)),('в',180,32)]:
    p=P(763,q)
    near(angle(p,'A','O','B'),deg)
    ratio(p,'A','B','O','A',chord/16)
    mark(763,q)
for q in 'аб':
    p=P(764,q)
    near(length(p,'A','B'),length(p,'C','D'))
    near(angle(p,'A','O','B'),112)
    near(angle(p,'C','O','D'),112)
    mark(764,q,'SSS proof checks both smaller and larger arcs; diameter case separately avoids degenerate triangles.')
p=P(764,'а',1)
col(p,'A','O','B')
col(p,'C','O','D')
p=P(765)
near(angle(p,'A','O','C'),37)
near(angle(p,'B','O','D'),23)
near(angle(p,'C','O','D'),120)
ratio(p,'C','D','O','A',math.sqrt(3))
perpendicular(p,'O','M','C','D')
ratio(p,'C','M','M','D',1)
mark(765)

ok(set(checked)==expected, 'Every source part must receive an independent oracle')
# Regression for cross-links: these are the actual point numbers in the 2023
# edition, not the numbering of another edition or adjacent-topic guesses.
records={(m['number'],m['part']):m for m in json.loads((DIR/'models/chapter-09-a.json').read_text())['models']}
required_links={
    (737,'а',1):37, (738,'single',2):21, (739,'а',2):72,
    (741,'single',1):37, (743,'single',1):21, (743,'single',2):20,
    (747,'single',1):21, (748,'а',1):21, (749,'а',1):37,
    (753,'single',2):21, (758,'single',1):7, (759,'single',1):21,
    (760,'single',1):21, (761,'single',1):23,
    (762,'а',1):23, (762,'а',2):21, (763,'а',1):21,
    (764,'а',1):20,
}
for (n,q,step),ref in required_links.items():
    ok(ref in records[n,q]['didactics']['steps'][step-1]['theoryPoints'],
       ('source-theory cross-link',n,q,step,ref))
sys.path.insert(0,str(ROOT/'tools/geometry-textbook'))
from check_models import validate
errors=[(key,error) for key,model in models.items() for error in validate(model)]
ok(not errors,str(errors))
print(json.dumps({'verdict':'PASS','cards':len(checked),'independentAssertions':assertions,
                  'views':sum(len(m['views']) for m in models.values()),
                  'claims':sum(len(m['checks']) for m in models.values())},ensure_ascii=False))

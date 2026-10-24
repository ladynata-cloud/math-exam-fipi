"""Independent reviewer checks of all 34 §1.4 C additions.

Reviewer: /root/source_inventory; author: /root/chapter6.
Source inputs: visually read PDF pages 25–29, SHA bd125372...39115.
Uses independent line intersections, area determinants, a cosine construction
for C18 and non-isosceles samples for general assertions. It neither imports
the author's test nor treats sampled numerical assertions as general proofs.
Full source/solution/proof review is recorded separately in the review JSON.
Standard library only, no writes.
"""
import ast
import math
import re
import runpy
import sys
from fractions import Fraction as F
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
records = runpy.run_path(str(HERE / 'section-1-4-c.py'))['lessons']
items = {(c['number'], c['part']): c for c in records}
assert set(items) == {(n, p) for n in [1, 2, 3, 4, 5, *range(7, 19)] for p in 'ab'}
assert len(records) == 34


def minus(a, b): return tuple(x - y for x, y in zip(a, b))
def plus(a, b): return tuple(x + y for x, y in zip(a, b))
def times(a, t): return tuple(x * t for x in a)
def dp(a, b): return sum(x * y for x, y in zip(a, b))
def det(a, b): return a[0] * b[1] - a[1] * b[0]
def length(a, b): return math.sqrt(dp(minus(a, b), minus(a, b)))
def near(a, b): assert math.isclose(a, b, abs_tol=1e-7, rel_tol=1e-9), (a, b)
def midpoint(a, b): return times(plus(a, b), F(1, 2))
def angle(a, b, c):
    u, v = minus(a, b), minus(c, b)
    return math.degrees(math.atan2(abs(det(u, v)), dp(u, v)))
def polygon(p): return abs(sum(det(p[i], p[(i+1) % len(p)]) for i in range(len(p)))) / 2
def intersect(a, b, c, d):
    u, v = minus(b, a), minus(d, c)
    t = det(minus(c, a), v) / det(u, v)
    return plus(a, times(u, t))
def projection(q, a, b):
    u = minus(b, a)
    return plus(a, times(u, dp(minus(q, a), u) / dp(u, u)))


class Geometry:
    def __init__(self, item):
        self.item = item
        self.p = {k: tuple(v[:2]) for k, v in item['model']['points'].items()}
    def d(self, a, b): return length(self.p[a], self.p[b])
    def a(self, a, b, c): return angle(self.p[a], self.p[b], self.p[c])
    def area(self, *names): return polygon([self.p[n] for n in names])
    def line(self, a, b, c): near(det(minus(self.p[b], self.p[a]), minus(self.p[c], self.p[a])), 0)
    def perp(self, a, b, c, d): near(dp(minus(self.p[b], self.p[a]), minus(self.p[d], self.p[c])), 0)
    def mid(self, m, a, b): near(length(self.p[m], midpoint(self.p[a], self.p[b])), 0)
    def bisects(self, a, v, b, on): near(self.a(a, v, on), self.a(on, v, b))
    def onsegment(self, a, m, b):
        self.line(a, m, b)
        assert dp(minus(self.p[m], self.p[a]), minus(self.p[m], self.p[b])) <= 1e-7
    def acute(self):
        assert all(self.a(a, v, b) < 90 - 1e-7 for a, v, b in [('A','B','C'),('B','C','A'),('C','A','B')])


def parse_alias(s):
    """Local offline arithmetic parser; unrelated to the browser's matcher."""
    s = s.replace(' ', '').replace(',', '.').replace(':', '/')
    s = re.sub(r'√(\d+)', r'sqrt(\1)', s).replace('√(', 'sqrt(')
    s = re.sub(r'(\d)(sqrt)', r'\1*\2', s)
    def expr(n):
        if isinstance(n, ast.Constant) and type(n.value) in (int, float): return n.value
        if isinstance(n, ast.UnaryOp) and isinstance(n.op, ast.USub): return -expr(n.operand)
        if isinstance(n, ast.BinOp):
            l, r = expr(n.left), expr(n.right)
            if isinstance(n.op, ast.Add): return l + r
            if isinstance(n.op, ast.Sub): return l - r
            if isinstance(n.op, ast.Mult): return l * r
            if isinstance(n.op, ast.Div): return l / r
        if isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id == 'sqrt' and len(n.args) == 1: return math.sqrt(expr(n.args[0]))
        raise AssertionError(ast.dump(n))
    return [expr(ast.parse(t, mode='eval').body) for t in s.split(';')]


# Independent source-based answers; simple input constants do not come from
# the author module. The later model audit checks the constructed instances.
expected = {(1,'a'): [(90 - 21) * 2 / 3], (1,'b'): [(90 + 18) * 2 / 3]}
for part, L in [('a', 16), ('b', 44)]:
    expected[3,part] = [L * math.sqrt(13) / 4, L * math.sqrt(13) / 2, 3 * L * math.sqrt(5) / 4]
for part, side in [('a', 42), ('b', 38)]: expected[4,part] = [F(3,2) * side]
for part, r, s in [('a',5,4), ('b',7,2)]: expected[5,part] = [F(4*s,r)]
for part, base, r in [('a',7,F(4)), ('b',8,F(5,2))]: expected[7,part] = [base * (1+r)]
for part, p, q, base in [('a',4,3,14), ('b',5,4,18)]:
    # The cosine law gives BC² = (AB−AC)² + 4pq because the bisector
    # distances are AB·sin(A/2)=p and AC·sin(A/2)=q.
    difference = math.sqrt(base**2 - 4*p*q)
    expected[8,part] = [p*difference/(p-q), q*difference/(p-q)]
for part, fraction in [('a',F(1,4)), ('b',F(1,2))]: expected[9,part] = [math.degrees(math.acos(math.sqrt(fraction)))]
for part, ab, cosine in [('a',16,F(3,4)), ('b',20,F(2,5))]: expected[10,part] = [ab*(1+cosine)]
expected[11,'a'] = [F(4**2, 5**2-4**2)]
expected[11,'b'] = [F(6**2-5**2, 5**2)]
for part, t, u in [('a',F(5,9),F(3,8)), ('b',F(2,7),F(1,5))]: expected[12,part] = [t*u/(1-t*u)]

# Affine coordinates: solve actual cevians instead of copying area-step ratios.
def median_intersection(targetfraction):
    A, B, C = (F(0), F(0)), (F(7), F(1)), (F(-2), F(5))
    M = midpoint(A, C)
    K = plus(B, times(minus(M, B), targetfraction))
    P = intersect(A, K, B, C)
    return {'A':A, 'B':B, 'C':C, 'M':M, 'K':K, 'P':P}
for key, fraction, numerator, denominator in [
    ((13,'a'), F(1,2), 'ABK', 'KPCM'), ((13,'b'), F(2,5), 'ABK', 'ABC'),
    ((14,'a'), F(1,2), 'ABK', 'ABC'), ((14,'b'), F(1,2), 'BKP', 'AKM'),
    ((15,'a'), F(2,5), 'KPCM', 'ABC'), ((15,'b'), F(2,5), 'BKP', 'AKM')]:
    p = median_intersection(fraction)
    expected[key] = [polygon([p[n] for n in numerator]) / polygon([p[n] for n in denominator])]
expected[16,'a'] = [(3*math.sqrt(5)) * math.sqrt(6**2-(6*F(2,3))**2)/2]
bh = F(8,4); ah = math.sqrt(8**2-bh**2); hc = math.sqrt((4*math.sqrt(15))**2-ah**2)
assert hc > bh  # The alternate positive-ray placement cannot exist.
expected[16,'b'] = [(bh+hc)*ah/2]
for part, t in [('a', F(2,3)), ('b', F(3,2))]:
    A, B, C = (F(0),F(0)), (F(1),F(0)), (F(0),F(1))
    A1, B1, C1 = [plus(q, times(minus(q,p),t)) for p,q in [(B,C),(C,A),(A,B)]]
    outer, inner = polygon([A1,B1,C1]), polygon([A,B,C])
    expected[17,part] = [outer/inner if part=='a' else inner/outer]

# C18 independent cosine construction: BC/AC = height ratio r, AC = 1.
# BH/AH = 2 gives (r-c)/(1-rc)=2, hence c = cos C = (2-r)/(2r-1).
# Scale y by sin C so every shoelace calculation below uses exact Fractions.
for part, r, source_small in [('a',F(8,7),F(3)), ('b',F(3,2),F(4))]:
    c = (2-r)/(2*r-1)
    A,B,C = (F(1),F(0)), (r*c,r*(1-c*c)), (F(0),F(0))
    M,H,P = (r*c,F(0)), (r*c,c*(1-r*c)), (c*c,c*(1-c*c))
    small = polygon([A,M,H])
    assert polygon([B,P,H])/small == 4
    expected[18,part] = [source_small * polygon([M,C,P,H])/small]
assert expected[18,'a'] == [F(132,5)] and expected[18,'b'] == [F(28,5)]


# General-position checks supplement the manually reviewed universal proofs.
# C1 includes acute, obtuse at target vertex and obtuse at either other vertex.
for A in [(3,7), (4,2), (-3,4), (11,4), (3,math.sqrt(15))]:
    B,C = (0,0),(8,0)
    # Two altitudes intersect; weighted incenter formula uses side lengths.
    bc, ca, ab = length(B,C), length(C,A), length(A,B)
    I = times(plus(plus(times(A,bc),times(B,ca)),times(C,ab)),1/(bc+ca+ab))
    H = intersect(A, plus(A,(0,1)), B, plus(B, (A[1]-C[1], C[0]-A[0])))
    alpha, bangle, cangle = angle(B,A,C), angle(A,B,C), angle(A,C,B)
    near(angle(B,I,C), 90+alpha/2)
    near(angle(B,H,C), 180-alpha if bangle<90 and cangle<90 else alpha)

# Orthic relationships must also hold when CA ≠ CB.
for theta, a, b in [(45,7,8), (60,8,7), (70,9,8), (35,7,6)]:
    C,A = (0,0),(a,0)
    B = (b*math.cos(math.radians(theta)),b*math.sin(math.radians(theta)))
    assert all(angle(x,y,z)<90 for x,y,z in [(A,B,C),(B,C,A),(C,A,B)])
    K,P = projection(A,B,C),projection(B,A,C)
    M = midpoint(A,B)
    near(polygon([C,K,P])/polygon([A,B,C]), math.cos(math.radians(theta))**2)
    near(length(M,K),length(A,B)/2);near(length(M,P),length(A,B)/2)
    near(length(K,P)/length(A,B),math.cos(math.radians(theta)))


checked = []
for (n, part), c in sorted(items.items()):
    g = Geometry(c); m = c['model']; p = g.p
    assert c['section']=='1.4' and c['level']=='C' and len(c['steps'])>=3
    assert all(s['reason'] and s['explanation'] and s['view'] in m['views'] for s in c['steps'])
    assert all(len(q)==3 and q[2]==0 and all(math.isfinite(x) for x in q) for q in m['points'].values())
    if n == 2:
        assert c['answer']['mode']=='manual' and 'accepted' not in c['answer']
    else:
        assert c['answer']['mode']=='exact'
        for alias in c['answer']['accepted']:
            values = parse_alias(alias)
            assert len(values) == len(expected[n,part]), (n,part,alias)
            for value, want in zip(values,expected[n,part]): near(value,want)
    if n == 1:
        if part=='a':
            g.bisects('A','B','C','M');g.bisects('A','C','B','M')
            g.perp('B','P','A','C');g.perp('C','P','A','B')
            near(g.a('B','P','C')-g.a('B','M','C'),21);near(g.a('B','A','C'),46)
        else:
            g.bisects('B','A','C','K');g.bisects('A','B','C','K')
            g.perp('A','H','B','C');g.perp('B','H','A','C')
            near(g.a('A','K','B')-g.a('A','H','B'),18);near(g.a('A','C','B'),72)
    elif n == 2:
        for (a,b), value in zip([('A','B'),('B','C'),('A','C')], [16,17,22] if part=='a' else [18,19,26]): near(g.d(a,b),value)
        if part=='a':g.perp('A','H','B','C');g.onsegment('B','H','C');near(g.d('B','H'),F(61,34))
        else:g.perp('B','H','A','C');g.onsegment('A','H','C');near(g.d('A','H'),F(639,52))
    elif n == 3:
        g.mid('D','B','C');g.bisects('A','B','C','E');g.onsegment('A','E','C');g.perp('B','E','A','D')
        for a,b in [('A','D'),('B','E')]: near(g.d(a,b),16 if part=='a' else 44)
        for edge,want in zip([('A','B'),('B','C'),('A','C')],expected[n,part]):near(g.d(*edge),want)
        assert 'O' not in m['labelNames']
    elif n == 4:
        g.mid('D','B','C');g.mid('E','A','C');g.mid('F','A','B');g.perp('B','E','C','F')
        near(g.d('B','C'),42 if part=='a' else 38);near(g.d('A','D'),expected[n,part][0])
    elif n == 5:
        V,W,Z,r,s = ('A','B','C',5,4) if part=='a' else ('B','C','A',7,2)
        g.mid('M',V,Z);g.mid('N',V,W);g.bisects(W,V,Z,'D');g.onsegment(W,'K','M');g.onsegment(Z,'L','N')
        g.line(V,'K','D');g.line(V,'L','D')
        near(g.d(W,'K')/g.d('K','M'),r/s);near(g.d(Z,'L')/g.d('L','N'),expected[n,part][0])
    elif n == 7:
        for V,W,Z in [('A','B','C'),('B','C','A'),('C','A','B')]:g.bisects(W,V,Z,'I')
        g.onsegment('A','I','D');g.onsegment('B','D','C')
        near(g.d('A','I')/g.d('I','D'),4 if part=='a' else 2.5);near(g.d('B','C'),7 if part=='a' else 8)
        near(g.d('A','B')+g.d('B','C')+g.d('C','A'),expected[n,part][0])
    elif n == 8:
        g.bisects('B','A','C','H');g.line('A','K','H');g.perp('B','H','A','H');g.perp('C','K','A','H')
        for value,want in zip([g.d('B','H'),g.d('C','K'),g.d('B','C')], [4,3,14] if part=='a' else [5,4,18]):near(value,want)
        near(g.d('A','B'),expected[n,part][0]);near(g.d('A','C'),expected[n,part][1])
    elif n in (9,10):
        g.acute();g.onsegment('B','K','C');g.onsegment('A','P','C');g.perp('A','K','B','C');g.perp('B','P','A','C')
        if n == 9:near(g.area('C','K','P')/g.area('A','B','C'),.25 if part=='a' else .5);near(g.a('A','C','B'),expected[n,part][0])
        else:
            g.mid('M','A','B');near(g.d('A','B'),16 if part=='a' else 20)
            near(math.cos(math.radians(g.a('A','C','B'))),.75 if part=='a' else .4)
            near(g.d('M','K')+g.d('K','P')+g.d('P','M'),expected[n,part][0])
    elif n == 11:
        g.onsegment('A','P','C');near(g.a('C','B','P'),g.a('C','A','B'))
        near(g.d('A','C')/g.d('B','C'),F(5,4) if part=='a' else F(6,5))
        near(g.area('C','B','P')/g.area('A','B','P') if part=='a' else g.d('A','P')/g.d('P','C'),expected[n,part][0])
    elif n == 12:
        g.onsegment('A','P','B');g.onsegment('A','M','C')
        near(g.d('A','P')/g.d('P','B'),F(5,4) if part=='a' else F(2,5))
        near(g.d('A','M')/g.d('M','C'),F(3,5) if part=='a' else F(1,4))
        near(g.area('A','P','M')/g.area('M','C','B','P'),expected[n,part][0])
    elif n in (13,14,15):
        g.mid('M','A','C');g.onsegment('B','K','M');g.onsegment('A','K','P');g.onsegment('B','P','C')
        ismid = n==14 or (n,part)==(13,'a')
        if ismid:g.mid('K','B','M')
        else:g.bisects('B','A','C','P');near(g.d('A','C')/g.d('A','B'),3)
        numerator,denominator = { (13,'a'):('ABK','KPCM'),(13,'b'):('ABK','ABC'),(14,'a'):('ABK','ABC'),(14,'b'):('BKP','AKM'),(15,'a'):('KPCM','ABC'),(15,'b'):('BKP','AKM')}[n,part]
        near(g.area(*numerator)/g.area(*denominator),expected[n,part][0])
        if 'N' in p:
            assert 'N' not in m['labelNames'];g.mid('N','C','P')
            near(det(minus(p['N'],p['M']),minus(p['P'],p['A'])),0)
    elif n == 16:
        near(g.d('A','B'),6 if part=='a' else 8);near(g.d('A','C'),3*math.sqrt(5) if part=='a' else 4*math.sqrt(15))
        if part=='a':
            g.perp('B','H','A','C');g.bisects('B','A','C','D');g.onsegment('B','K','H');g.line('A','K','D');g.onsegment('A','H','C')
            near(g.d('B','K')/g.d('K','H'),1.5)
        else:
            g.perp('A','H','B','C');g.bisects('A','B','C','D');g.onsegment('A','K','H');g.line('B','K','D');g.onsegment('B','H','C')
            near(g.d('A','K')/g.d('K','H'),4)
        near(g.area('A','B','C'),expected[n,part][0])
    elif n == 17:
        for a,b,z in [('B','C','A1'),('C','A','B1'),('A','B','C1')]:
            g.line(a,b,z);near(g.d(a,z),g.d(a,b)+g.d(b,z));near(g.d(b,z)/g.d(a,b),F(2,3) if part=='a' else F(3,2))
        outer,inner = g.area('A1','B1','C1'),g.area('A','B','C')
        near(outer/inner if part=='a' else inner/outer,expected[n,part][0])
    elif n == 18:
        g.acute();g.onsegment('A','M','C');g.onsegment('B','P','C');g.onsegment('A','H','P');g.onsegment('B','H','M')
        g.perp('A','P','B','C');g.perp('B','M','A','C')
        near(g.d('B','M')/g.d('A','P'),F(8,7) if part=='a' else F(3,2))
        near(g.area('A','M','H'),3 if part=='a' else 4);near(g.area('B','P','H'),12 if part=='a' else 16)
        near(g.area('M','C','P','H'),expected[n,part][0]);assert not any(set(edge)=={'H','C'} for edge in m['edges'])
    checked.append(f'1.4-C{n}-{part}')

assert len(checked)==34 and len(expected)==32
assert sum(len(c['steps']) for c in records)==146
print('REVIEW_SECTION_1_4_C_OK: 34 source/model audits, 32 exact answers with all aliases, 2 manual proofs; 146 steps read separately.')

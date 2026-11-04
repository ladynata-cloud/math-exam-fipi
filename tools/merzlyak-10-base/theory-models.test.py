#!/usr/bin/env python3
"""Independent coordinate checks for the nineteen authored overview examples.

Passing these examples does not verify complete theorem proofs or source coverage.
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / 'stereo-course/merzlyak-10-base/lessons'
checks = 0


def close(a, b, why):
    global checks
    assert math.isclose(a, b, rel_tol=1e-9, abs_tol=1e-9), (why, a, b)
    checks += 1


def vec(a, b):
    return [y - x for x, y in zip(a, b)]


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def cross(a, b):
    return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]


def norm(a):
    return math.sqrt(dot(a, a))


def parallel(a, b, why):
    close(norm(cross(a, b)), 0, why)


def perp(a, b, why):
    close(dot(a, b), 0, why)


def midpoint(a, b, m, why):
    for i in range(3):
        close((a[i] + b[i])/2, m[i], why)


def angle(a, b):
    return math.degrees(math.acos(max(-1, min(1, dot(a, b)/(norm(a)*norm(b))))))


def area(a, b, c):
    return norm(cross(vec(a, b), vec(a, c)))/2


def load(n):
    data = json.loads((DIR / f'theory-{n:02}.json').read_text(encoding='utf-8'))
    return data['visualization']['model']['points']


p=load(1)
assert dot(vec(p['A'],p['D']),cross(vec(p['A'],p['B']),vec(p['A'],p['C']))) != 0
p=load(2)
assert norm(cross(vec(p['B'],p['C']),vec(p['B'],p['A']))) > 0
p=load(3)
for name,vertex in [('M','A'),('N','B'),('P','C')]:
    midpoint(p['S'],p[vertex],p[name],'§3 edge midpoint '+name)
parallel(cross(vec(p['M'],p['N']),vec(p['M'],p['P'])),
         cross(vec(p['A'],p['B']),vec(p['A'],p['C'])),'§3 section parallel to base')
p=load(4)
parallel(vec(p['A'],p['B']),vec(p['D'],p['C']),'§4 parallel cube edges')
perp(vec(p['A'],p['B']),vec(p['A'],p['D']),'§4 intersecting edges')
assert dot(vec(p['A'],p['C']),cross(vec(p['A'],p['B']),vec(p['C'],p['C1']))) != 0
p=load(5)
parallel(vec(p['E'],p['F']),vec(p['A'],p['B']),'§5 line parallel to in-plane line')
assert p['E'][2] == p['F'][2] != p['A'][2]
p=load(6)
parallel(vec(p['A'],p['B']),vec(p['A1'],p['B1']),'§6 first direction')
parallel(vec(p['A'],p['C']),vec(p['A1'],p['C1']),'§6 second direction')
assert p['A'][2] != p['A1'][2]
close(norm(vec(p['A'],p['A1'])),norm(vec(p['B'],p['B1'])),'§6 equal transverse segments')
p=load(7)
parallel(vec(p['A'],p['A1']),vec(p['B'],p['B1']),'§7 first projection direction')
parallel(vec(p['A'],p['A1']),vec(p['C'],p['C1']),'§7 second projection direction')
midpoint(p['A'],p['B'],p['M'],'§7 original midpoint')
midpoint(p['A1'],p['B1'],p['M1'],'§7 projected midpoint')
for name in ['A1','B1','C1','M1']:close(p[name][2],0,'§7 image in target plane')
p=load(8)
parallel(vec(p['C'],p['D']),vec(p['A'],p['E']),'§8 transferred direction')
close(angle(vec(p['A'],p['B']),vec(p['A'],p['E'])),60,'§8 true 60-degree angle')
assert dot(vec(p['A'],p['C']),cross(vec(p['A'],p['B']),vec(p['C'],p['D']))) != 0
p=load(9)
for name in ['A','B']:perp(vec(p['O'],p['M']),vec(p['O'],p[name]),'§9 normal to plane direction')
parallel(vec(p['O'],p['M']),vec(p['Q'],p['N']),'§9 parallel normals')
midpoint(p['M'],p['M1'],p['O'],'§9 reflected points')
p=load(10)
perp(vec(p['O'],p['M']),vec(p['O'],p['A']),'§10 right triangle')
perp(vec(p['O'],p['M']),vec(p['O'],p['B']),'§10 common normal')
close(norm(vec(p['M'],p['A'])),5,'§10 3-4-5 incline')
assert norm(vec(p['M'],p['A']))>norm(vec(p['M'],p['B']))>norm(vec(p['M'],p['O']))
p=load(11)
for a,b in [('A','B'),('B','C'),('A','C')]:perp(vec(p['D'],p['E']),vec(p[a],p[b]),'§11 three perpendiculars')
midpoint(p['D'],p['E'],p['C'],'§11 incline base on in-plane perpendicular')
p=load(12)
close(norm(vec(p['O'],p['M'])),3,'§12 height')
close(norm(vec(p['M'],p['A'])),6,'§12 incline')
close(angle(vec(p['A'],p['M']),vec(p['A'],p['O'])),30,'§12 correct angle vertex')
p=load(13)
for name in ['A','B']:perp(vec(p['L'],p['R']),vec(p['O'],p[name]),'§13 linear rays perpendicular to edge')
close(angle(vec(p['O'],p['A']),vec(p['O'],p['B'])),120,'§13 dihedral angle')
normal1=cross(vec(p['L'],p['R']),vec(p['L'],p['A']))
normal2=cross(vec(p['L'],p['R']),vec(p['L'],p['B']))
normal_angle=angle(normal1,normal2)
close(min(normal_angle,180-normal_angle),60,'§13 plane angle differs from obtuse dihedral')
p=load(14)
for name in ['A','B']:perp(vec(p['L'],p['R']),vec(p['O'],p[name]),'§14 rays perpendicular to edge')
perp(vec(p['O'],p['A']),vec(p['O'],p['B']),'§14 linear right angle')
p=load(15)
perp(vec(p['A'],p['C']),vec(p['D'],p['B']),'§15 original altitude')
perp(vec(p['A'],p['C']),vec(p['D'],p['B1']),'§15 projected altitude')
perp(vec(p['B'],p['B1']),vec(p['A'],p['C']),'§15 orthogonal direction first test')
perp(vec(p['B'],p['B1']),vec(p['D'],p['B1']),'§15 orthogonal direction second test')
close(angle(vec(p['D'],p['B']),vec(p['D'],p['B1'])),60,'§15 plane angle')
close(area(p['A'],p['B'],p['C']),4,'§15 actual area')
close(area(p['A'],p['B1'],p['C']),2,'§15 projected area')
p=load(16)
for name in ['B','C']:perp(vec(p['A'],p['A1']),vec(p['A'],p[name]),'§16 straight prism')
assert not math.isclose(norm(vec(p['A'],p['B'])),norm(vec(p['A'],p['C'])))
for a,b in [('A','A1'),('B','B1'),('C','C1')]:close(norm(vec(p[a],p[b])),3,'§16 equal side edges')
p=load(17)
for a,b in [('A','C1'),('B','D1'),('C','A1'),('D','B1')]:midpoint(p[a],p[b],p['O'],'§17 common diagonal midpoint')
for a,b,c in [('A','B','D'),('A','B','A1'),('A','D','A1')]:perp(vec(p[a],p[b]),vec(p[a],p[c]),'§17 rectangular solid')
close(norm(vec(p['A'],p['C1']))**2,29,'§17 diagonal squared')
p=load(18)
midpoint(p['A'],p['B'],p['M'],'§18 apothem foot')
perp(vec(p['S'],p['M']),vec(p['A'],p['B']),'§18 apothem perpendicular to base side')
for a in ['A','B','C','D']:close(norm(vec(p['S'],p[a]))**2,17,'§18 equal side edges')
close(norm(vec(p['S'],p['M']))**2,13,'§18 apothem squared')
close(sum(area(p['S'],p[a],p[b]) for a,b in [('A','B'),('B','C'),('C','D'),('D','A')]),
      8*math.sqrt(13),'§18 side area formula')
p=load(19)
midpoint(p['A'],p['B'],p['M'],'§19 lower midpoint')
midpoint(p['A1'],p['B1'],p['M1'],'§19 upper midpoint')
perp(vec(p['M'],p['M1']),vec(p['A'],p['B']),'§19 trapezoid altitude')
close(norm(vec(p['O'],p['O1'])),2,'§19 body height')
close(norm(vec(p['M'],p['M1'])),math.sqrt(5),'§19 apothem')
face_area=area(p['A'],p['B'],p['B1'])+area(p['A'],p['B1'],p['A1'])
close(4*face_area,(16+8)*math.sqrt(5)/2,'§19 side area formula')
print(f'MERZLYAK_THEORY_MODELS_OK: 19 overview models, {checks} numerical equalities plus nondegeneracy checks')

#!/usr/bin/env python3
"""Independent checks of complete cuts and affine projection constructions."""
import itertools
import json
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
LESSONS = ROOT / 'stereo-course/merzlyak-10-base/lessons'
checks = 0

def check(value, message):
    global checks
    checks += 1
    assert value, message

def points(paragraph, detail):
    record = json.loads((LESSONS / f'theory-{paragraph:02}-detail-{detail:02}.json').read_text())
    return {name: np.array(coords, dtype=float) for name, coords in record['visualization']['model']['points'].items()}

def prism_edges(base):
    return [(a, b) for ring in [base, [x+'1' for x in base]]
            for a, b in zip(ring, ring[1:]+ring[:1])] + [(a, a+'1') for a in base]

def pyramid_edges(base, apex):
    return list(zip(base, base[1:]+base[:1])) + [(apex, a) for a in base]

def verify_cut(paragraph, detail, edges, plane, expected):
    p = points(paragraph, detail)
    origin, b, c = (p[x] for x in plane)
    normal = np.cross(b-origin, c-origin)
    normal /= np.linalg.norm(normal)
    found = []
    for a, b in edges:
        u, v = p[a], p[b]
        du, dv = np.dot(normal, u-origin), np.dot(normal, v-origin)
        candidates = []
        if abs(du) < 1e-9: candidates.append(u)
        if abs(dv) < 1e-9: candidates.append(v)
        if du*dv < -1e-16: candidates.append(u+du/(du-dv)*(v-u))
        for candidate in candidates:
            if not any(np.linalg.norm(candidate-x) < 1e-8 for x in found): found.append(candidate)
    check(len(found) == len(expected), f'{paragraph}.{detail}: complete intersection vertex count')
    for name in expected:
        check(any(np.linalg.norm(p[name]-x) < 1e-8 for x in found), f'{paragraph}.{detail}: boundary vertex {name}')

verify_cut(3, 1, pyramid_edges(list('ABCDE'), 'F'), list('FAC'), list('FAC'))
verify_cut(3, 3, pyramid_edges(list('ABC'), 'D'), list('KMN'), list('KMNP'))
verify_cut(3, 4, prism_edges(list('ABC')), list('MXY'), list('KMN'))
verify_cut(5, 4, prism_edges(list('ABC')), list('ACM'), list('AMNC'))
verify_cut(5, 5, pyramid_edges(list('ABC'), 'D'), list('MNP'), list('KMNP'))
verify_cut(6, 2, pyramid_edges(list('ABCD'), 'E'), list('MNP'), list('MNPK'))

# Test the whole six-cevian construction via one derived affine map. The map
# is fitted only to the three source/target triangle vertices, not to answers.
p = points(7, 9)
source = np.column_stack([p['B']-p['A'], p['C']-p['A']])
target = np.column_stack([p['B']-p['A'], p['D']-p['A']])
for name in 'KLMNOPGUVWXYZ':
    coeff = np.linalg.lstsq(source, p[name]-p['A'], rcond=None)[0]
    check(np.linalg.norm(source@coeff-(p[name]-p['A'])) < 1e-8, name+' lies in source plane')
    check(np.linalg.norm(p['A']+target@coeff-p[name+'1']) < 1e-8, name+' uses the same affine projection')
for a, b in [('K', 'N'), ('L', 'O'), ('M', 'P')]:
    for suffix in ['', '1']:
        check(np.linalg.norm(np.cross(p[a+suffix]-p['G'+suffix], p[b+suffix]-p['G'+suffix])) < 1e-8,
              a+b+suffix+' passes through the stated point')

# All eight triples in the colouring, independent of the author's list of
# completing vertices. Equal diagonal midpoints characterize a parallelogram.
p = points(7, 7)
red, blue = list('ADC')+['C1'], ['B', 'A1', 'B1', 'D1']
for own, other in [(red, blue), (blue, red)]:
    for triple in itertools.combinations(own, 3):
        valid = False
        for extra in other:
            names = list(triple)+[extra]
            for left in itertools.combinations(range(4), 2):
                right = [i for i in range(4) if i not in left]
                if np.linalg.norm(sum((p[names[i]] for i in left))-sum((p[names[i]] for i in right))) < 1e-8:
                    valid = np.linalg.norm(np.cross(p[names[1]]-p[names[0]], p[names[2]]-p[names[0]])) > 1e-8
                    if valid: break
            if valid: break
        check(valid, 'colour triple '+str(triple))

print(f'INDEPENDENT_THEORY_01_09_OK: {checks} assertions; six full solid cuts, one global affine map and all colour triples')

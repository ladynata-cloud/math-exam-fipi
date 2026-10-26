"""Independently validate the authored practical nets for exercises 271--275.

All incidence, folding and seam correspondences are derived from the actual
lesson coordinates. Authoring metadata and precomputed fold maps are not used.
This verifies the illustrated geometry, not a pupil's physical paper model.
"""
from collections import Counter, defaultdict, deque
import itertools
import json
import math
from pathlib import Path
import re

import numpy as np


ROOT = Path(__file__).resolve().parents[2]
LESSONS = ROOT / 'stereo-course/textbook/lessons'
EPS = 1e-7
CLUSTER_EPS = 2e-6


def close(actual, expected, message):
    assert np.allclose(actual, expected, atol=EPS, rtol=EPS), (message, actual, expected)


def edge(a, b):
    return tuple(sorted((a, b)))


def cross2(a, b):
    return float(a[0] * b[1] - a[1] * b[0])


def signed_area(poly):
    return sum(cross2(poly[i], poly[(i + 1) % len(poly)]) for i in range(len(poly))) / 2


def convex_intersection(subject, clip):
    """Sutherland--Hodgman clipping for the independently checked convex faces."""
    output = [np.asarray(p, dtype=float) for p in subject]
    for i, a in enumerate(clip):
        b = clip[(i + 1) % len(clip)]
        prior = output
        output = []
        if not prior:
            break
        for j, p in enumerate(prior):
            q = prior[(j + 1) % len(prior)]
            dp, dq = cross2(b - a, p - a), cross2(b - a, q - a)
            pin, qin = dp >= -EPS, dq >= -EPS
            if pin:
                output.append(p)
            if pin != qin:
                assert abs(dp - dq) > EPS / 100, 'unstable polygon intersection'
                output.append(p + dp / (dp - dq) * (q - p))
    return output


def cluster_index(point, representatives, tolerance=CLUSTER_EPS):
    matches = [i for i, other in enumerate(representatives) if np.linalg.norm(point - other) < tolerance]
    assert len(matches) <= 1, 'ambiguous vertex cluster'
    if matches:
        return matches[0]
    representatives.append(np.array(point, dtype=float))
    return len(representatives) - 1


def tree_signature(adjacency):
    def rooted(node, parent):
        return '(' + ''.join(sorted(rooted(child, node) for child in adjacency[node] if child != parent)) + ')'
    return min(rooted(node, None) for node in adjacency)


def tree_from_edges(count, links):
    adjacency = {i: set() for i in range(count)}
    for a, b in links:
        adjacency[a].add(b)
        adjacency[b].add(a)
    return adjacency


SOURCE_TREES = {
    271: [(0, 1), (0, 2), (0, 3)],
    272: [(0, 1), (0, 2), (2, 3), (0, 4), (0, 5)],
    273: [(0, 1), (1, 2), (2, 3), (2, 6), (6, 4), (4, 5), (6, 7)],
    274: [(0, j) for j in range(1, 6)] + [(6, j) for j in range(7, 12)] + [(1, 7)],
    275: [(i, i + 1) for i in range(9)] + [(4, 10), (10, 11), (11, 12), (10, 13), (13, 14),
                                                     (5, 15), (15, 16), (16, 17), (15, 18), (18, 19)],
}

# Number, face sides, solid V/E/F, faces per vertex, cosine of outward-normal angle.
SPECS = [
    (271, 3, 4, 6, 4, 3, -1 / 3),
    (272, 4, 8, 12, 6, 3, 0),
    (273, 3, 6, 12, 8, 4, 1 / 3),
    (274, 5, 20, 30, 12, 3, 1 / math.sqrt(5)),
    (275, 3, 12, 30, 20, 5, math.sqrt(5) / 3),
]


def rodrigues(axis, angle):
    axis = axis / np.linalg.norm(axis)
    x, y, z = axis
    skew = np.array([[0, -z, y], [z, 0, -x], [-y, x, 0]])
    return math.cos(angle) * np.eye(3) + (1 - math.cos(angle)) * np.outer(axis, axis) + math.sin(angle) * skew


def validate(number, sides, solid_v, solid_e, face_count, vertex_degree, normal_cosine):
    lesson = json.loads((LESSONS / f'ex-main-{number:04d}.json').read_text())
    model = lesson['visualization']['model']
    points = {name: np.asarray(value, dtype=float) for name, value in model['points'].items()}
    faces = model['faces']
    assert model.get('planar') is True, (number, 'the main image is the paper net')
    assert model.get('labelNames') == [], (number, 'neutral net must remain uncluttered')
    assert len(faces) == face_count and all(len(f) == sides for f in faces), (number, 'face count/type')

    net_points = []
    name_to_net = {}
    for name in sorted({name for face in faces for name in face}):
        p = points[name]
        assert p.shape == (3,) and np.isfinite(p).all()
        close(p[2], 0, (number, 'flat paper plane'))
        name_to_net[name] = cluster_index(p, net_points)
    net_faces = [[name_to_net[name] for name in face] for face in faces]
    assert len({tuple(sorted(face)) for face in net_faces}) == face_count, (number, 'duplicate face')
    planar = [[net_points[v][:2] for v in face] for face in net_faces]
    expected_area = sides / (4 * math.tan(math.pi / sides))
    for face in planar:
        assert len(set(tuple(p) for p in face)) == sides
        close(signed_area(face), expected_area, (number, 'CCW regular unit face area'))
        for i, p in enumerate(face):
            prev, nxt = face[i - 1], face[(i + 1) % sides]
            close(np.linalg.norm(nxt - p), 1, (number, 'common edge length'))
            close(np.dot(prev - p, nxt - p), math.cos((sides - 2) * math.pi / sides), (number, 'regular face angles'))
            assert cross2(p - prev, nxt - p) > EPS, (number, 'strictly convex CCW face')
    for i, j in itertools.combinations(range(face_count), 2):
        overlap = convex_intersection(planar[i], planar[j])
        assert abs(signed_area(overlap)) < EPS if len(overlap) >= 3 else True, (number, i, j, 'flat face overlap')

    edge_faces = defaultdict(list)
    for fi, face in enumerate(net_faces):
        for i, a in enumerate(face):
            edge_faces[edge(a, face[(i + 1) % sides])].append(fi)
    assert all(len(fs) in (1, 2) for fs in edge_faces.values()), (number, 'nonmanifold paper edge')
    hinges = {e: fs for e, fs in edge_faces.items() if len(fs) == 2}
    cuts = {e: fs[0] for e, fs in edge_faces.items() if len(fs) == 1}
    assert len(hinges) == face_count - 1
    assert len(cuts) == 2 * (solid_e - face_count + 1)
    assert len(net_points) - len(edge_faces) + face_count == 1, (number, 'net is a disk')
    adjacency = {i: set() for i in range(face_count)}
    for fs in hinges.values():
        a, b = fs
        adjacency[a].add(b)
        adjacency[b].add(a)
    seen, todo = {0}, [0]
    while todo:
        for child in adjacency[todo.pop()]:
            if child not in seen:
                seen.add(child)
                todo.append(child)
    assert len(seen) == face_count, (number, 'connected hinge tree')
    assert tree_signature(adjacency) == tree_signature(tree_from_edges(face_count, SOURCE_TREES[number])), (number, 'source-figure hinge topology')

    # Build a rigid transform for every face from the flat net itself. A positive
    # rotation about a parent's CCW edge folds the child below the root face;
    # the transformed CCW normals therefore point outward from the final solid.
    transforms = {0: (np.eye(3), np.zeros(3))}
    parent = {0: None}
    queue = deque([0])
    angle = math.acos(normal_cosine)
    while queue:
        fi = queue.popleft()
        rotation, translation = transforms[fi]
        f = net_faces[fi]
        for child in sorted(adjacency[fi]):
            if child in transforms:
                continue
            shared = next(e for e, fs in hinges.items() if set(fs) == {fi, child})
            a, b = next((f[i], f[(i + 1) % sides]) for i in range(sides) if edge(f[i], f[(i + 1) % sides]) == shared)
            pa = rotation @ net_points[a] + translation
            pb = rotation @ net_points[b] + translation
            turn = rodrigues(pb - pa, angle)
            transforms[child] = (turn @ rotation, turn @ (translation - pa) + pa)
            parent[child] = fi
            queue.append(child)

    closed_points = []
    closed_faces = []
    face_to_closed = []
    net_occurrences = defaultdict(list)
    for fi, face in enumerate(net_faces):
        rotation, translation = transforms[fi]
        positions = [rotation @ net_points[v] + translation for v in face]
        ids = [cluster_index(p, closed_points) for p in positions]
        assert len(set(ids)) == sides, (number, 'collapsed folded face')
        closed_faces.append(ids)
        face_to_closed.append(dict(zip(face, ids)))
        for net_id, point in zip(face, positions):
            net_occurrences[net_id].append(point)
    for positions in net_occurrences.values():
        close(positions, np.repeat([positions[0]], len(positions), axis=0), (number, 'paper vertex remains attached'))
    assert len(closed_points) == solid_v, (number, 'folded vertex count', len(closed_points))
    assert len({tuple(sorted(face)) for face in closed_faces}) == face_count, (number, 'folded face uniqueness')
    closed_edges = defaultdict(list)
    normals = []
    incidence = Counter()
    for fi, face in enumerate(closed_faces):
        coords = [closed_points[v] for v in face]
        normal = np.cross(coords[1] - coords[0], coords[2] - coords[0])
        normal /= np.linalg.norm(normal)
        normals.append(normal)
        close([np.dot(normal, p - coords[0]) for p in coords], np.zeros(sides), (number, 'folded face plane'))
        signed = [np.dot(normal, p - coords[0]) for p in closed_points]
        assert max(signed) < CLUSTER_EPS and min(signed) < -EPS, (number, 'closed convex outward face')
        incidence.update(face)
        for i, a in enumerate(face):
            b = face[(i + 1) % sides]
            closed_edges[edge(a, b)].append(fi)
            close(np.linalg.norm(closed_points[a] - closed_points[b]), 1, (number, 'folded unit edge'))
    assert len(closed_edges) == solid_e
    assert all(len(fs) == 2 for fs in closed_edges.values()), (number, 'every solid edge has two faces')
    assert set(incidence.values()) == {vertex_degree}, (number, 'faces at each solid vertex')
    degrees = Counter(v for e in closed_edges for v in e)
    assert set(degrees.values()) == {vertex_degree}, (number, 'edges at each solid vertex')
    assert solid_v - solid_e + face_count == 2
    for fs in closed_edges.values():
        close(np.dot(normals[fs[0]], normals[fs[1]]), normal_cosine, (number, 'normal angle at every solid edge'))
    center = np.mean(closed_points, axis=0)
    radii = [np.linalg.norm(p - center) for p in closed_points]
    close(radii, np.repeat(radii[0], solid_v), (number, 'common circumsphere'))

    def known_net_vertex(name):
        matches = [i for i, p in enumerate(net_points) if np.linalg.norm(points[name] - p) < CLUSTER_EPS]
        assert len(matches) == 1, (number, name, 'edge endpoint must be a net vertex')
        return matches[0]

    def seam_edge(segment):
        return edge(*(known_net_vertex(name) for name in segment))

    # Every instructional seam is tested by the folded geometry, not its number
    # or the author's intended map. This rejects swapped but equal-length edges.
    seams = {key: value for key, value in model['views'].items() if re.fullmatch(r'seam-\d+', key)}
    seam_count = len(cuts) // 2
    assert set(seams) == {f'seam-{i}' for i in range(1, seam_count + 1)}
    used = Counter()
    for key, view in seams.items():
        segments = view.get('segments', [])
        assert len(segments) == 2 and all(len(segment) == 2 for segment in segments), (number, key, 'two seam edges')
        pair = [seam_edge(segment) for segment in segments]
        assert len(set(pair)) == 2 and all(e in cuts for e in pair), (number, key, 'distinct boundary edges only')
        used.update(pair)
        closed = [edge(*(face_to_closed[cuts[e]][v] for v in e)) for e in pair]
        assert closed[0] == closed[1], (number, key, 'glue edges meet after folding', closed)
        markers = view.get('points', [])
        assert len(markers) == 2, (number, key, 'one marker per seam edge')
        expected_midpoints = [(net_points[a] + net_points[b]) / 2 for a, b in pair]
        for marker in markers:
            assert any(np.linalg.norm(points[marker] - midpoint) < EPS for midpoint in expected_midpoints), (number, key, 'midpoint marker')
            assert model.get('labels', {}).get(marker) == key.split('-')[1], (number, key, 'matching seam number')
        assert np.linalg.norm(points[markers[0]] - points[markers[1]]) > EPS
    assert used == Counter({e: 1 for e in cuts}), (number, 'every cut edge paired exactly once')

    # One sample tab explains construction; it is an allowance, never a face.
    tab_names = model['views']['tab'].get('polygon', [])
    assert len(tab_names) >= 3, (number, 'illustrative glue tab')
    tab3 = [points[name] for name in tab_names]
    close([p[2] for p in tab3], np.zeros(len(tab3)), (number, 'tab lies on paper'))
    tab = [p[:2] for p in tab3]
    if signed_area(tab) < 0:
        tab.reverse()
    assert signed_area(tab) > EPS, (number, 'nondegenerate tab')
    for i, p in enumerate(tab):
        assert cross2(p - tab[i - 1], tab[(i + 1) % len(tab)] - p) >= -EPS, (number, 'convex sample tab')
    shared_tab_edges = []
    for i, a in enumerate(tab3):
        b = tab3[(i + 1) % len(tab3)]
        aa = [v for v, p in enumerate(net_points) if np.linalg.norm(a - p) < EPS]
        bb = [v for v, p in enumerate(net_points) if np.linalg.norm(b - p) < EPS]
        if aa and bb and edge(aa[0], bb[0]) in edge_faces:
            shared_tab_edges.append(edge(aa[0], bb[0]))
    assert len(shared_tab_edges) == 1 and shared_tab_edges[0] in cuts, (number, 'tab attached to one cut edge, not a hinge')
    for face in planar:
        overlap = convex_intersection(tab, face)
        assert abs(signed_area(overlap)) < EPS if len(overlap) >= 3 else True, (number, 'tab intrudes into a face')
    assert any(not any(np.linalg.norm(p - q) < EPS for q in net_points) for p in tab3), (number, 'tab extends outside the original net')

    return {'exercise': number, 'net_faces': face_count, 'hinges': len(hinges), 'seams': seam_count,
            'folded_vertices': solid_v, 'folded_edges': solid_e, 'result': 'PASS'}


results = [validate(*spec) for spec in SPECS]
print(json.dumps({'gate': 'POLYHEDRA_PRACTICAL_MATH_OK', 'results': results}, ensure_ascii=False))

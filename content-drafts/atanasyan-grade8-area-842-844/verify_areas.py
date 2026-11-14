"""Check the three area formulas against independent exact coordinate geometry."""
from fractions import Fraction as F
from itertools import product


def add(a, b):
    return a[0] + b[0], a[1] + b[1]


def subtract(a, b):
    return a[0] - b[0], a[1] - b[1]


def scale(k, a):
    return k * a[0], k * a[1]


def det(a, b):
    return a[0] * b[1] - a[1] * b[0]


def area(*vertices):
    sides = zip(vertices, vertices[1:] + vertices[:1])
    return F(abs(sum(det(a, b) for a, b in sides)), 2)


def segment_point(a, b, fraction):
    return add(a, scale(fraction, subtract(b, a)))


def intersection(a, b, c, d):
    ab, cd = subtract(b, a), subtract(d, c)
    t = F(det(subtract(c, a), cd), det(ab, cd))
    return segment_point(a, b, t)


def number_842(a, b, d, x, y):
    c = subtract(add(b, d), a)
    p, q = segment_point(a, b, x), segment_point(b, c, y)
    r, t = segment_point(d, c, x), segment_point(a, d, y)
    m = intersection(p, r, t, q)
    first, second = area(m, p, b, q), area(m, r, d, t)
    assert first - second == (y - x) * area(a, b, c, d)
    assert (first == second) == (det(subtract(m, a), subtract(c, a)) == 0)
    return first, second


def number_843(a, b, c, m, k):
    o = intersection(a, k, b, m)
    first, second, third = area(o, m, a), area(o, a, b), area(o, b, k)
    assert second ** 2 > first * third
    small = area(o, m, k)
    assert small == first * third / second
    ck_over_cb = first * (second + third) / (second * (first + second))
    cm_over_ca = third * (first + second) / (second * (second + third))
    assert ck_over_cb == area(a, m, k) / area(a, m, b)
    assert cm_over_ca == area(b, k, m) / area(b, k, a)
    expected = first * third * (first + second) * (second + third)
    expected /= second * (second ** 2 - first * third)
    assert area(c, m, k) == expected
    return first, second, third, small, ck_over_cb, cm_over_ca, expected


def number_844(a, b, c, ratio):
    proportion = ratio / (1 + ratio)
    m = segment_point(a, c, proportion)
    k = segment_point(c, b, proportion)
    p = segment_point(m, k, proportion)
    first, second, whole = area(a, m, p), area(b, k, p), area(a, b, c)
    assert first == ratio ** 3 * second
    assert whole == (1 + ratio) ** 3 * second
    return first, second, whole


def main():
    bases = (((0, 0), (8, 0), (2, 5)), ((3, -4), (-2, 1), (8, 2)),
             ((-2, 4), (0, -7), (-4, -1)), ((7, 2), (5, -2), (-3, 6)))
    fractions = (F(1, 5), F(1, 3), F(1, 2), F(3, 5), F(4, 5))
    ratios = (F(1, 7), F(1, 2), F(1), F(2), F(5, 2), F(7))
    for (a, b, c), (x, y) in product(bases, product(fractions, repeat=2)):
        number_842(a, b, c, x, y)
        number_843(a, b, c, segment_point(a, c, x), segment_point(b, c, y))
    for (a, b, c), ratio in product(bases, ratios):
        number_844(a, b, c, ratio)

    assert number_842((0, 0), (8, 0), (2, 5), F(3, 5), F(2, 5)) == (F(32, 5), F(72, 5))
    assert number_842((0, 0), (8, 0), (2, 5), F(3, 5), F(3, 5)) == (F(48, 5), F(48, 5))
    assert number_843((4, 0), (0, 3), (F(-12, 5), F(-12, 5)), (0, F(-3, 2)), (F(-4, 3), 0)) == (
        3, 6, 2, 1, F(4, 9), F(3, 8), F(12, 5))
    assert number_844((9, 0), (0, 6), (0, 0), F(2)) == (8, 1, 27)
    grid = len(bases) * len(fractions) ** 2
    print(f'ATANASYAN_AREAS_PASS: №842 {grid}, №843 {grid}, №844 {len(bases) * len(ratios)} exact geometries; four card examples')


if __name__ == '__main__':
    main()

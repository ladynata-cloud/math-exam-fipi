"""Compare areas in tasks 845–847 against independent vertex calculations."""
from itertools import product
from fractions import Fraction as F
from build_area_lessons import DRAFT
from verify_areas import add, area, det, intersection, scale, segment_point, subtract


def check_parallelogram(a, b, d):
    c = subtract(add(b, d), a)
    p, q, r, t = [segment_point(x, y, F(1, 2)) for x, y in [(a,b),(b,c),(c,d),(d,a)]]
    u = intersection(a,q,d,p); v = intersection(a,q,b,r)
    w = intersection(c,t,b,r); z = intersection(c,t,d,p)
    assert subtract(v,u) == subtract(w,z)
    assert subtract(z,u) == subtract(w,v)
    assert 5 * area(u,v,w,z) == area(a,b,c,d)


def check_trapezoid(a, step, up, base1, base2):
    d = add(a, scale(base1, step))
    b = add(a, up); c = add(b, scale(base2,step))
    m = segment_point(c,d,F(1,2))
    # |AB| times the perpendicular distance from M to AB is |AB × AM|.
    assert area(a,b,c,d) == abs(det(up,subtract(m,a)))
    o = intersection(a,c,b,d)
    s1, s2 = area(b,o,c), area(a,o,d)
    wing = area(a,o,b)
    assert wing == area(c,o,d)
    assert wing**2 == s1*s2
    assert area(a,b,c,d) == s1+s2+2*wing


if __name__=='__main__':
    count = 0
    for a,base,side in product([(0,0),(4,-2)],[(2,1),(-1,3)],[(1,5),(3,-2)]):
        check_parallelogram(a,add(a,base),add(a,side)); count+=1
        for n,m in [(1,4),(3,2),(2,2),(3,8)]:
            check_trapezoid(a,base,side,n,m); count+=2
    print('Exact coordinate-area identities passed:',count)


def check_cut_areas(n, shift):
    a,d=(0,0),(n+5,0); b,c=(shift,5),(shift+n,5); e,f=(2,0),(2+n,0)
    u=intersection(a,c,b,e);v=intersection(d,b,c,f);o=intersection(a,c,d,b)
    assert area(e,u,o,v,f)==area(a,b,u)+area(b,c,o)+area(c,d,v)
    # Four different diagonals, with the cutting line as a signed-height axis.
    a,b,c,d=(0,n),(1,-3),(8,-n),(7,3)
    m=intersection(a,b,(0,0),(10,0)); k=intersection(c,d,(0,0),(10,0))
    assert area(d,c,m)==area(a,k,b)
    a,b,c,d=(0,0),(3,0),(4,2),(1,2); e=(3+shift,0);k=(n,2*n)
    o=intersection(e,d,k,b)
    assert area(c,e,o)==area(a,b,o)
    assert area(c,o,k)==area(a,d,o)
    assert area(a,b,o,d)==area(c,e,o,k)
    a,b,c,d=(0,0),(7,1),(n+4,6),(shift,4)
    p,q,r,t=[segment_point(x,y,v) for x,y,v in [(a,b,F(1,3)),(a,b,F(2,3)),(d,c,F(2,3)),(d,c,F(1,3))]]
    assert 3*area(p,q,r,t)==area(a,b,c,d)
    k,m=segment_point(a,b,F(1,2)),segment_point(c,d,F(1,2))
    u,v=intersection(d,k,a,m),intersection(c,k,b,m)
    assert area(k,u,m,v)==area(a,d,u)+area(b,c,v)


if __name__=='__main__':
    for n,shift in product([3,4,5,7],[1,2,3]):
        check_cut_areas(n,shift)
    # Rotate by 60 degrees; compare perpendicular distances with the OA norm.
    from math import sqrt, isclose
    for x,y in product([3,6,10],[.5, 1, 2]):
        a=y; b=(sqrt(3)*x-y)/2
        assert b>0 and isclose(x*x+y*y,4*(a*a+a*b+b*b)/3)
    print('Additional area identities 848–853 passed.')

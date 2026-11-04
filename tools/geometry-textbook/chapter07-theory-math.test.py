#!/usr/bin/env python3
"""Independent area/proof oracle, authored by the non-author theory reviewer.

Uses coordinate determinants and distances, not the chapter authoring helpers.
This numerical gate supplements, and does not replace, written-proof and image
review. It includes independently verified source inconsistencies560в and570.
"""
import json
import math
import random
from fractions import Fraction
from pathlib import Path

ASSERTIONS = 0

def check(value, message):
    global ASSERTIONS
    ASSERTIONS += 1
    assert value, message

def near(a, b, message):
    check(math.isclose(a, b, rel_tol=1e-9, abs_tol=1e-8), message)

def area(points):
    return abs(sum(a[0]*b[1]-b[0]*a[1]
                   for a,b in zip(points, points[1:]+points[:1])))/2

def distance(a,b):
    return math.hypot(a[0]-b[0],a[1]-b[1])

def line_distance(p,a,b):
    return 2*area([p,a,b])/distance(a,b)

def dot(a,b):
    return sum(x*y for x,y in zip(a,b))

def sub(a,b):
    return (a[0]-b[0],a[1]-b[1])

def authored_models():
    """Independently recompute the geometry in the actual serialized models."""
    root=Path(__file__).resolve().parents[2]
    records=json.loads((root/'geometry-course/textbook/models/chapter-07-theory.json').read_text())['models']
    check(len(records)==21,'all nine theory points and twelve questions')
    scenes=0
    for record in records:
        model=record['model']; points=model['points']; scenes+=len(model['views'])
        for view in model['views'].values():
            for marker in view.get('rightAngles',[]):
                a=points[marker['a']]; o=points[marker['vertex']]; b=points[marker['b']]
                # JSON coordinates are rounded to nine decimals. Compare the
                # dimensionless cosine, independent of the drawing scale.
                near(dot(sub(a,o),sub(b,o))/(distance(a,o)*distance(b,o)),0,'actual right-angle marker')
            groups={}
            for marker in view.get('equalSegments',[]):
                groups.setdefault(marker.get('marks',1),[]).append(distance(points[marker['a']],points[marker['b']]))
            for lengths in groups.values():
                for length in lengths[1:]: near(length,lengths[0],'actual equal-length marker')
        def P(name,suffix=''): return points[name+suffix]
        def A(names,suffix=''): return area([P(n,suffix) for n in names])
        def D(a,b,suffix=''): return distance(P(a,suffix),P(b,suffix))
        n=record['number']; kind=record['collection']
        if (kind,n) in [('theory',54),('selfcheck',1),('selfcheck',2),('selfcheck',3)]:
            near(D('A','B')/D('A','D'),1.5,'actual six-cell rectangle ratio')
            near(A(['A','_x1a','_cell','_y1a'])*6,A('ABCD'),'actual unit-cell subdivision') if '_cell' in points else None
        if (kind,n)==('theory',55):
            near(D('A','B'),D('A','D'),'actual unit square')
            suffix='__case2'
            check(A(['A','_L1','_L2','_L3'],suffix)<A('ABCD',suffix)<A(['A','_U1','_U2','_U3'],suffix),'actual nested square bounds')
        if (kind,n) in [('theory',56),('selfcheck',4)]:
            near(A(['A','_E','_F','_G']),2*A('ABCD')+D('A','B')**2+D('A','D')**2,'actual rectangle dissection')
            near(A('ABCD'),A(['C','_I','_F','_H']),'actual congruent rectangles')
        if (kind,n) in [('theory',57),('selfcheck',5)]:
            for suffix in ['', '__case2']:
                near(A('ABCD',suffix),D('A','D',suffix)*D('B','H',suffix),'actual parallelogram area')
                near(A('ABH',suffix),A('DCK',suffix),'actual cut triangles')
                near(A('ABCK',suffix),A('ABCD',suffix)+A('DCK',suffix),'actual first outer dissection')
                near(A('ABCK',suffix),A('HBCK',suffix)+A('ABH',suffix),'actual second outer dissection')
            near(A('ABCD','__case1'),D('A','D','__case1')*D('B','D','__case1'),'actual foot at D')
            near(A('ABCD','__case3'),D('A','B','__case3')*D('A','D','__case3'),'actual rectangular case')
        if (kind,n) in [('theory',58),('selfcheck',6)]:
            near(2*A('ABC'),A('ABDC'),'actual triangle halves parallelogram')
            near(2*A('ABC'),D('A','B')*D('C','H'),'actual triangle area')
            near(2*A('ABC','__case1'),D('A','B','__case1')*D('A','C','__case1'),'actual right triangle case')
            near(2*A('ABC','__case2'),D('A','B','__case2')*D('C','H','__case2'),'actual exterior altitude case')
        if (kind,n)==('theory',58):
            suffix='__case3'
            near(A('ABC',suffix)/A('BCD',suffix),D('A','B',suffix)/D('B','D',suffix),'actual common-height ratio')
            suffix='__case5'; sides=[D('A','B',suffix),D('B','C',suffix),D('C','A',suffix)]
            radius=D('O','K',suffix)
            for a,b in [('A','B'),('B','C'),('C','A')]: near(line_distance(P('O',suffix),P(a,suffix),P(b,suffix)),radius,'actual incircle tangency')
            near(A('ABC',suffix),sum(sides)*radius/2,'actual S=pr')
        if (kind,n) in [('theory',58),('selfcheck',7)]:
            suffix='__case4' if kind=='theory' else ''
            near(A('ABC',suffix)/A(['A','B1','C1'],suffix),D('A','B',suffix)*D('A','C',suffix)/(D('A','B1',suffix)*D('A','C1',suffix)),'actual equal-angle area ratio')
        if (kind,n) in [('theory',59),('selfcheck',8)]:
            for suffix in ['', '__case1']:
                near(A('ABCD',suffix),(D('A','D',suffix)+D('B','C',suffix))*D('B','H',suffix)/2,'actual trapezoid formula')
                near(A('ABCD',suffix),A('ABD',suffix)+A('BCD',suffix),'actual diagonal dissection')
        if (kind,n) in [('theory',60),('selfcheck',9)]:
            near(A('ADEF'),4*A('ABC')+A('BGHC'),'actual Pythagoras dissection')
            near(A('BGHC'),D('B','C')**2,'actual central square area')
            check(not model['views']['step-2'].get('rightAngles') or all(m['vertex']=='A' for m in model['views']['step-2']['rightAngles']),'central square right angle not asserted before proof')
        if (kind,n) in [('theory',61),('selfcheck',10)]:
            for view in ['neutral','step-1']:
                check(not model['views'][view].get('rightAngles'),'converse does not assume sought angle')
            check(all(point.endswith('__case1') for point in model['views']['step-2']['points']),'converse step2 uses auxiliary triangle')
            check(bool(model['views']['step-3'].get('rightAngles')),'converse marks result only after SSS')
        if (kind,n) in [('theory',62),('selfcheck',12)]:
            a=D('B','C');b=D('C','A');c=D('A','B');p=(a+b+c)/2
            near(A('ABC')**2,p*(p-a)*(p-b)*(p-c),'actual Heron formula')
            near(D('A','H')+D('H','B'),c,'actual Heron altitude foot inside base')
    return scenes

def run():
    rng=random.Random(7546262)
    for _ in range(300):
        a=rng.uniform(.2,30); b=rng.uniform(.2,30); h=rng.uniform(.2,20)
        # Rectangle proof: two congruent rectangles and two squares.
        whole=area([(0,0),(a+b,0),(a+b,a+b),(0,a+b)])
        rectangle=area([(0,0),(a,0),(a,b),(0,b)])
        near(whole,2*rectangle+a*a+b*b,'rectangle dissection')
        near(rectangle,a*b,'rectangle area')
        # A height may meet either endpoint, the interior or either extension.
        for offset in [-2*a,0,a/3,a,2*a]:
            points=[(0,0),(a,0),(a+offset,h),(offset,h)]
            near(area(points),a*h,'parallelogram all foot positions')
            near(area([(0,0),(a,0),(offset,h)]),a*h/2,'triangle all foot positions')
        offset=rng.uniform(-50,50)
        near(area([(0,0),(a,0),(offset+b,h),(offset,h)]),(a+b)*h/2,'trapezoid arbitrary shear')
        # Equal-angle area ratio via determinants; includes obtuse angles.
        theta=rng.uniform(.08,math.pi-.08); c=rng.uniform(.2,30); d=rng.uniform(.2,30)
        t1=[(0,0),(a,0),(b*math.cos(theta),b*math.sin(theta))]
        t2=[(0,0),(c,0),(d*math.cos(theta),d*math.sin(theta))]
        near(area(t1)/area(t2),a*b/(c*d),'equal angle ratio')
        # Incenter reconstructed from an arbitrary nondegenerate triangle.
        A=(0,0); B=(a,0); C=(offset,h)
        x=distance(B,C); y=distance(A,C); z=distance(A,B); p=(x+y+z)/2
        I=tuple((x*A[j]+y*B[j]+z*C[j])/(2*p) for j in [0,1])
        r=line_distance(I,A,B)
        near(line_distance(I,B,C),r,'incircle distance to BC')
        near(line_distance(I,C,A),r,'incircle distance to CA')
        near(area([A,B,C]),p*r,'inradius area formula')
        near(area([A,B,C])**2,p*(p-x)*(p-y)*(p-z),'Heron determinant identity')
        # Pythagoras: central square proved by independent dot products.
        P=(a,0); Q=(a+b,a); R=(b,a+b); S=(0,b)
        for X,Y,Z in [(P,Q,R),(Q,R,S),(R,S,P),(S,P,Q)]:
            near(dot(sub(X,Y),sub(Z,Y)),0,'inner square right angle')
            near(distance(X,Y)**2,a*a+b*b,'inner square equal side')
        near(area([P,Q,R,S]),a*a+b*b,'inner square area')
        near(whole,4*(a*b/2)+area([P,Q,R,S]),'Pythagorean dissection')
        # Real positive square sides squeezed by finite decimals.
        rational=Fraction(rng.randrange(1,100000),rng.randrange(1,1000))
        for digits in [0,1,2,4,7]:
            scale=10**digits; lo=Fraction((rational*scale).numerator//(rational*scale).denominator,scale)
            hi=lo+Fraction(1,scale)
            check(lo*lo<=rational*rational<=hi*hi,'decimal square bracketing')
            check(hi*hi-lo*lo<=2*rational/scale+Fraction(1,scale*scale),'bracket width tends to zero')
    for m in range(2,18):
        for n in range(1,m):
            for k in [1,2,7]:
                a=2*k*m*n; b=k*(m*m-n*n); c=k*(m*m+n*n)
                check(a>0 and b>0 and a+b>c,'positive Pythagorean triangle')
                check(a*a+b*b==c*c,'integer Pythagorean family')
    for a,b,c in [(3,4,5),(5,12,13),(8,15,17),(7,24,25)]:
        check(a*a+b*b==c*c,'source Pythagorean examples')
    # Source560в gives an area greater than the maximum possible product.
    check(Fraction(54)>Fraction(45,10)*6,'source560в impossible area')
    check(Fraction(54)/Fraction(45,10)==12 and Fraction(54)/6==9,'source560в formal heights')
    check(12>6 and 9>Fraction(45,10),'source560в impossible heights')
    # Tangency lengths5,5,6 force side lengths10,11,11 and semiperimeter16.
    source_area=math.sqrt(16*6*5*5); source_radius=source_area/16
    near(source_area,20*math.sqrt(6),'source570 actual side-determined area')
    near(source_radius,5*math.sqrt(6)/4,'source570 actual inradius')
    check(not math.isclose(source_radius,3,abs_tol=1e-10),'source570 radius contradiction')
    check(16*3==48,'source570 merely formal S=pr result')
    scenes=authored_models()
    print(json.dumps({'gate':'CHAPTER_VII_INDEPENDENT_THEORY_MATH_OK','assertions':ASSERTIONS,
      'parameterFamilies':300,'actualTheoryCards':21,'actualTheoryViews':scenes,'sourceIssues':['560в','570'],'limits':'Not a source, image or publication approval.'}))

if __name__=='__main__':
    run()

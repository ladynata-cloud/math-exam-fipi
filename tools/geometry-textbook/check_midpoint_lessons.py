"""Check claims using the published drawing data, plus exact ratio edge cases."""
from fractions import Fraction as F
from math import dist,isclose,sqrt
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[2]
DATA=ROOT/'geometry-course/textbook/data/midpoint-lessons.json'


def near(a,b):
    assert isclose(a,b,rel_tol=1e-7,abs_tol=1e-7),(a,b)


def assert_geometry(l):
    n=int(l['source']['exercise']);model=l['visualization']['model']
    def stage(i=0):return {name.split('__')[0]:v[:2] for name,v in model['points'].items() if name.endswith(f'__v{i}')}
    p=stage()
    def length(a,b):return dist(p[a],p[b])
    def vector(a,b):return(p[b][0]-p[a][0],p[b][1]-p[a][1])
    def cross(v,u):return v[0]*u[1]-v[1]*u[0]
    def area(names):
        points=[p[k] for k in names]
        return abs(sum(cross(a,b) for a,b in zip(points,points[1:]+points[:1])))/2
    def middle(a,m,b):
        for i in [0,1]:near(2*p[m][i],p[a][i]+p[b][i])
    def parallel(a,b,c,d):near(cross(vector(a,b),vector(c,d)),0)
    def ratio(a,x,b):return length(a,x)/length(x,b)
    def ratios():return ratio('A','X','B')*ratio('B','Y','C')*ratio('C','Z','A')
    if n==872:
        near(2*(length('E','G')+length('H','F')),sum(length(a,b) for a,b in zip('ABCD','BCDA')))
        parallel('A','B','D','C');parallel('A','D','B','C')
    elif n==873:
        near(2*length('H','F'),length('A','B')+length('C','D'));parallel('A','B','C','D')
    elif n==874:
        for a,m,b in [('O','U','A'),('O','V','D'),('B','W','C')]:middle(a,m,b)
        near(length('U','V'),length('U','W'));near(length('U','W'),length('W','V'))
    elif n==875:
        near(2*length('M','K'),length('A','B')+length('B','C')+length('C','A'))
        middle('A','M','U');middle('A','K','V')
    elif n in [876,877]:
        for case in [0,2]:
            p=stage(case)
            for a,m,b in [('A','P','X'),('B','Q','Y'),('C','R','Z')]:middle(a,m,b)
            assert area('PQR')>1e-7
            if n==877 and case==2:
                for a,b,h in [('C','A','Y'),('A','B','Z')]:
                    assert length(a,b)+1e-8<length(a,h)+length(h,b)
    elif n==878:
        near(length('A','C'),2*length('B','C'))
        near(ratio('A','M','B'),2);near(ratio('A','K','B'),2)
        unit=area('BCM')
        for names,scale in [('ACM',2),('ABC',3),('CMK',4)]:near(area(names),scale*unit)
    elif n==879:
        near(area('GBT'),area('ABC')/3)
        for a,b in [('A','D'),('B','E'),('C','F')]:near(length(a,b),1.5*length(a,'G'))
        near(2.25*area('GBT'),.75*area('ABC'))
    elif n==880:
        near(ratio('B','P','M'),.5);near(area('ABK')/area('ABC'),.2);middle('C','T','K')
    elif n==881:
        near(length('A','M')**2,length('M','N')*length('M','P'))
    elif n==882:
        near(ratio('A','M','B'),2);near(length('M','H')/length('M','K'),2)
        p=stage(3);parallel('V','M','W','B')
    elif n==883:
        near(ratio('A','C','B'),ratio('A','D','B'));parallel('U','W','V','T')
    elif n==884:
        near(length('O','U'),length('U','V'));near(length('A','B'),length('B','C'))
        near(length('O','U')/length('A','B'),(length('O','V')+length('U','M'))/(length('A','C')+length('B','H')))
    elif n==885:
        u=length('O','A');v=length('O','B');h=2*u*v/(u+v)
        near(length('O','T'),h);near(length('O','D')/h,vector('O','A')[0]/u)
        near(ratio('A','D','B'),u/v)
    elif n==886:
        near(length('U','W')/length('A','C'),(length('U','W')+length('V','T'))/(length('A','C')+length('B','H')))
    elif n==887:
        near(length('A','B')/length('U','V'),length('A','D')/length('U','T'))
        near(2*area('ABC'),length('B','C')*length('A','D'))
    elif n==888:
        near(ratio('D','S','B'),ratio('D','T','B'));near(ratio('D','C','B'),ratio('D','S','B'))
        near(length('O','S'),length('O','C'));near(length('O','S'),length('O','T'));parallel('A','B','D','C')
    elif n==889:
        near(area('ABCD'),area('UVWT'));near(length('A','C')/length('B','D'),2)
        p=stage(2);near(length('X','Y')*length('Y','Z'),length('Y','N')**2)
    elif n in [890,891]:
        near(ratios(),1);near(area('XYZ'),0)
        near(length('A','H')/length('B','K'),ratio('A','X','B'))
    elif n==892:
        near(ratios(),1);assert area('XYZ')>1e-7
        p=stage(3);near(area('XYZ'),0);near(ratios(),1)
    elif n==895:
        for names in ['COH','BOK','AOE']:near(area(names),0)
        near(ratio('A','H','B')*ratio('B','Y','C')*ratio('C','X','A'),1)
        near(length('A','C'),length('C','F'));near(length('B','C'),length('C','D'))
    elif n==896:
        near(length('C','O')/length('O','X'),ratio('C','Y','B')+ratio('C','Z','A'))
    elif n==897:
        near(length('A','O')/length('O','D'),(length('A','B')+length('A','C'))/length('B','C'))
    elif n==898:
        near(ratios(),1)
        near(length('O','X'),length('O','Y'));near(length('O','Y'),length('O','Z'))
    elif n==899:
        near(ratios(),1)
        near(length('I','Y'),length('I','U'));near(length('I','U'),length('I','V'))
        near(length('B','U'),length('B','Y'));near(length('C','V'),length('C','Y'))
    elif n in [893,894]:
        near(ratios(),1)
        for names in ['COX','AOY','BOZ']:near(area(names),0)


def independent_examples():
    a,b,m,k=map(F,[0,3,2,6]);x,y=F(4),F(2)
    squared=lambda t:(x-t)**2+y*y
    triangle=lambda s,t:abs(s-t)*y/2
    assert squared(a)==4*squared(b) and (m-a)/(b-m)==(k-a)/(k-b)==2
    assert [triangle(s,t) for s,t in [(b,m),(a,m),(a,b),(m,k)]]==[1,2,3,4]
    # All three finite traces of distinct parallel cevians; the signed product is +1.
    x,y,z=F(-2,3),F(1,2),F(-3)
    assert x*y*z==1 and 1+x+x*y==0


if __name__=='__main__':
    items=json.loads(DATA.read_bytes())['lessons']
    ids=[l['id'] for l in items]
    assert ids==[f'atanasyan-7-9-main-{n}-part-1' for n in range(872,900)]
    for l in items:
        assert str(l['source']['printedPages'][0]) in l['review']['reviewer']
        assert len(l['steps'])==3 and sum('input' in s for s in l['steps'])==1
        try:assert_geometry(l)
        except AssertionError as e:raise AssertionError(l['id']) from e
    independent_examples()
    print('Validated actual coordinate models:',len(items),'and exact exceptional cases.')

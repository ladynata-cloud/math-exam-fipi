#!/usr/bin/env python3
"""Independent algorithms for author verification, not an independent reviewer."""
import hashlib
import json
import math
import random
import tempfile
import unittest
from pathlib import Path
from copy import deepcopy
from build_advanced8_candidate import candidate, build, AUTHOR, COURSE, LABEL
from check_models import validate
from advanced8_release import historical_ix_projection, serialized

BASELINE='84563ef900b15174be7f4dcb03bd450254bcce7789a90a364ae4b9ddf2de4911'
R=random.Random(824841)
def plus(a,b):return (a[0]+b[0],a[1]+b[1])
def sub(a,b):return (a[0]-b[0],a[1]-b[1])
def mul(k,a):return (k*a[0],k*a[1])
def dot(a,b):return a[0]*b[0]+a[1]*b[1]
def cross(a,b):return a[0]*b[1]-a[1]*b[0]
def length(a):return math.hypot(*a)
def mid(a,b):return mul(.5,plus(a,b))
def turn(a):return (-a[1],a[0])
def area(p):return abs(sum(cross(p[i],p[(i+1)%len(p)]) for i in range(len(p)))/2)
def intersect(a,b,c,d):
    u,v=sub(b,a),sub(d,c);return plus(a,mul(cross(sub(c,a),v)/cross(u,v),u))
def angle(a,b):return math.degrees(math.acos(max(-1,min(1,dot(a,b)/(length(a)*length(b))))))
def clipping(p,q):
    # Convex polygon clipping, independently of the authored drawing code.
    for i,c in enumerate(q):
        d=q[(i+1)%len(q)];old=p;p=[]
        if not old:break
        for j,a in enumerate(old):
            b=old[(j+1)%len(old)];ina=cross(sub(d,c),sub(a,c))>=-1e-10;inb=cross(sub(d,c),sub(b,c))>=-1e-10
            if ina:p.append(a)
            if ina!=inb:p.append(intersect(a,b,c,d))
    return p

class SourceAndBoundary(unittest.TestCase):
    def test_exact_source_and_all_18_models(self):
        data=json.loads(AUTHOR.read_text())
        self.assertEqual(data['source']['sha256'],'3b2e890ce425ef9b4893f367e8680e18c0ed380c9bd86fe4eb65b44a2479ca72')
        self.assertEqual([c['number'] for c in data['cards']],list(range(824,842)))
        self.assertEqual(sum(len(c['steps']) for c in data['cards']),72)
        self.assertEqual(sum(len(c['model']['views']) for c in data['cards']),94)
        for c in data['cards']:
            with self.subTest(number=c['number']):
                self.assertEqual(c['printedPages'],[214 if c['number']<=834 else 215])
                self.assertEqual(c['pdfPages'],[x+1 for x in c['printedPages']])
                self.assertEqual(c['sourceFigures'],[274] if c['number']==837 else [])
                self.assertFalse(validate(c['model']))
                for s in c['steps']:
                    self.assertTrue(s['prompt'] and s['explanation'] and s['justification'])
                for v in c['model']['views'].values():
                    visible=[x for x in v['points'] if not x.startswith('_')]
                    for i,x in enumerate(visible):
                        for y in visible[i+1:]:self.assertGreater(math.dist(c['model']['points'][x],c['model']['points'][y]),1e-6)
        fig=next(c for c in data['cards'] if c['number']==837)['model']['points']
        self.assertLess(fig['A__v0'][1],fig['B__v0'][1],'Figure274: A is below B in math-up renderer coordinates')
        self.assertEqual(fig['A__v0'][1],fig['E__v0'][1])
    def test_1407_cards_and_release_receipts_preserved(self):
        published=json.loads((COURSE/'data/course.json').read_bytes())
        scope=json.loads((COURSE.parents[1]/'tools/geometry-textbook/release-scope.json').read_bytes())
        old,_=historical_ix_projection(published,scope)
        self.assertEqual(hashlib.sha256(serialized(old)).hexdigest(),BASELINE)
        b=candidate()
        self.assertEqual(b['lessons'][:1407],old['lessons'])
        self.assertEqual(b['catalog']['entries'][:1407],old['catalog']['entries'])
        self.assertEqual(len(b['lessons']),1425)
        self.assertFalse(b['build']['publicationReviewMatches'])
        for l in b['lessons'][1407:]:
            self.assertEqual(l['status'],'in-review');self.assertEqual(l['review']['reviewer'],'')
            self.assertEqual(l['source']['advancedGrade'],8)
            self.assertEqual(l['source']['relatedChapters'],[6])
            self.assertEqual(l['answer']['mode'],'manual')
            for status in ['source','mathematics','pedagogy']:self.assertEqual(l['review'][status],'pending')
    def test_preview_cannot_overwrite_or_approve(self):
        with tempfile.TemporaryDirectory() as tmp:
            output=Path(tmp)/'review';build(output)
            self.assertEqual((output/'geometry-course/textbook/index.html').read_bytes(),(COURSE/'index.html').read_bytes())
            self.assertNotIn('allowInReview:true',(output/'geometry-course/textbook/index.html').read_text())
            self.assertIn('allowInReview:true',(output/'geometry-course/textbook/review.html').read_text())
            for path in COURSE.glob('release-review*.json'):
                self.assertEqual(path.read_bytes(),(output/'geometry-course/textbook'/path.name).read_bytes())
            with self.assertRaises(ValueError):build(output)

class MathematicalOracles(unittest.TestCase):
    def test_824_825_all_positive_common_difference_cases(self):
        for _ in range(600):
            a2,a4,a6=[R.uniform(.1,20) for _ in range(3)]
            t=R.uniform(-min(a2,a4,a6)+.01,20)
            sides=[a4+t,a2,a6+t,a4,a2+t,a6];p=(0,0);vertices=[]
            for i,s in enumerate(sides):
                vertices.append(p);p=plus(p,(s*math.cos(i*math.pi/3),s*math.sin(i*math.pi/3)))
            self.assertLess(length(p),1e-10)
            for i in range(6):
                self.assertGreater(cross(sub(vertices[(i+1)%6],vertices[i]),sub(vertices[(i+2)%6],vertices[(i+1)%6])),0)
                self.assertAlmostEqual(angle(sub(vertices[i-1],vertices[i]),sub(vertices[(i+1)%6],vertices[i])),120)
            L=sides[0]+a2+a6
            for x,y,z in [(a6,a2,sides[0]),(a2,a4,sides[2]),(a4,a6,sides[4])]:self.assertAlmostEqual(L-x-y,z)
    def test_826_tiling_area_and_disjoint_interiors(self):
        for _ in range(45):
            ts=sorted(R.uniform(0,2*math.pi) for _ in range(4));q=[(3*math.cos(t),2*math.sin(t)) for t in ts]
            a,b,c,d=q;u=sub(c,a);v=sub(d,b)
            self.assertAlmostEqual(abs(cross(u,v)),2*area(q),places=8)
            flipped=[sub(plus(a,b),p) for p in q]
            tiles=[]
            for m in [-1,0,1]:
                for n in [-1,0,1]:
                    delta=plus(mul(m,u),mul(n,v))
                    tiles += [[plus(p,delta) for p in tile] for tile in [q,flipped]]
            for i,x in enumerate(tiles):
                for y in tiles[i+1:]:self.assertLess(area(clipping(x,y)),1e-7)
            # The four half-turn neighbours are exactly the translated flipped tile.
            for aa,bb,delta in [(a,b,(0,0)),(b,c,u),(c,d,plus(u,v)),(d,a,v)]:
                for p,z in zip(q,flipped):self.assertLess(length(sub(sub(plus(aa,bb),p),plus(z,delta))),1e-10)
    def test_829_ratio_including_E_beyond_C(self):
        seen=set()
        for _ in range(600):
            b=R.uniform(.2,10);h=R.uniform(.1,25);A=(0,0);B=(b,h);C=(2*b,0);c=length(B)
            # Independent angle-bisector direction is sum of unit rays.
            direction=plus(mul(1/c,B),(1,0));D=intersect(A,direction,B,C)
            E=intersect(D,plus(D,turn(D)),A,C)
            self.assertAlmostEqual((D[0]-b)/E[0],.25,places=8)
            seen.add(E[0]>C[0])
        self.assertEqual(seen,{True,False})
        # Exact boundary omitted by a random sample: the intersection E is C.
        A=(0,0);B=(1,math.sqrt(3));C=(2,0)
        D=intersect(A,plus(mul(.5,B),(1,0)),B,C)
        E=intersect(D,plus(D,turn(D)),A,C)
        self.assertLess(length(sub(E,C)),1e-12)
        self.assertAlmostEqual(D[0]-1,.5)
    def test_830_strict_median_bounds(self):
        for _ in range(600):
            p=[(0,0),(R.uniform(.1,20),0),(R.uniform(-20,20),R.uniform(.01,20))]
            P=sum(length(sub(p[i],p[(i+1)%3])) for i in range(3))
            m=sum(length(sub(p[i],mid(p[(i+1)%3],p[(i+2)%3]))) for i in range(3))
            self.assertTrue(P/2<m<P)
    def test_831_perpendicular_bisector_argument(self):
        for _ in range(600):
            x,z=R.uniform(.1,20),R.uniform(.1,20);A=(-x,0);C=(z,0);M=(z-x)/2
            for P in [(R.uniform(-30,30),R.uniform(-20,20)),(0,R.uniform(1,10))]:
                delta=length(sub(P,A))-length(sub(P,C))
                self.assertEqual(delta<0,P[0]<M)
            # Equal halves and perpendicular diagonals give four equal perimeters.
            y=R.uniform(.1,20);q=[(-x,0),(0,y),(x,0),(0,-y)]
            ps=[length(q[i])+length(q[(i+1)%4])+length(sub(q[i],q[(i+1)%4])) for i in range(4)]
            self.assertLess(max(ps)-min(ps),1e-10)
    def test_832_double_inclusion_and_833_converse(self):
        for _ in range(400):
            h=R.uniform(.1,20);a=R.uniform(2,20);b=R.uniform(.1,a-.1);s=R.uniform(-20,20)
            A=(s,h);x=R.uniform(-100,100);Y=mid(A,(x,0))
            self.assertAlmostEqual(Y[1],h/2);self.assertAlmostEqual(2*Y[0]-s,x)
            left=(a-b)/2;legs=[math.hypot(left,h),math.hypot(a-left-b,h)]
            self.assertAlmostEqual(*legs);self.assertAlmostEqual(left+b/2,a/2)
    def test_834_rectangle_bisectors_and_square_degeneracy(self):
        for a,b in [(6,4),(4,6),(4,4)]+[(R.uniform(.1,20),R.uniform(.1,20)) for _ in range(400)]:
            p=[(b/2,b/2),(a/2,a/2),(a-b/2,b/2),(a/2,b-a/2)]
            lengths=[length(sub(p[i],p[(i+1)%4])) for i in range(4)]
            self.assertLess(max(lengths)-min(lengths),1e-10)
            self.assertAlmostEqual(dot(sub(p[1],p[0]),sub(p[2],p[1])),0)
            self.assertEqual(lengths[0]<1e-12,a==b)
    def test_835_centres_of_external_squares(self):
        for _ in range(600):
            u=(R.uniform(.1,20),0);v=(R.uniform(-20,20),R.uniform(.1,20));vertices=[(0,0),u,plus(u,v),v]
            centres=[]
            for i,a in enumerate(vertices):
                b=vertices[(i+1)%4];centres.append(plus(mid(a,b),mul(-.5,turn(sub(b,a)))))
            lengths=[length(sub(centres[i],centres[(i+1)%4])) for i in range(4)]
            self.assertLess(max(lengths)-min(lengths),1e-9)
            self.assertAlmostEqual(dot(sub(centres[1],centres[0]),sub(centres[2],centres[1])),0,places=7)
    def test_836_angle_bisector_and_both_endpoints(self):
        for t in [0,1]+[R.random() for _ in range(600)]:
            s=R.uniform(.1,20);M=(s,s*t);unit=mul(1/length(M),M)
            direction=plus((0,1),unit);K=mul(s/direction[1],direction)
            self.assertAlmostEqual(length(M),K[0]+M[1],places=8)
    def test_837_838_exact_angles(self):
        self.assertAlmostEqual(sum(math.degrees(math.atan(1/n)) for n in [1,2,3]),90)
        for _ in range(400):
            s=R.uniform(.1,100);d=(math.cos(math.pi/6),math.sin(math.pi/6))
            M=intersect((0,0),d,(s,s),(s-math.sin(math.pi/12),s-math.cos(math.pi/12)))
            self.assertAlmostEqual(angle(sub(M,(0,s)),(1,0)),30,places=8)
    def test_839_generic_triangle_acute_obtuse_and_rotated(self):
        cases=[(6,(-2,2)),(6,(8,2))]  # O,E,P or O,C,A collinear: use segment sums/differences.
        cases += [(R.uniform(.1,20),(R.uniform(-30,30),R.uniform(.1,20))) for _ in range(600)]
        for a,A in cases:
            B=(0,0);C=(a,0)
            # Construct each square geometrically on the outward side, not by authored coordinate formulas.
            D=plus(C,mul(-1,turn(sub(C,B))));E=plus(B,mul(-1,turn(sub(C,B))))
            T=plus(C,turn(sub(C,A)));K=plus(B,turn(sub(A,B)))
            Q=plus(T,sub(D,C));P=plus(E,sub(K,B));AP=sub(P,A);AQ=sub(Q,A)
            self.assertAlmostEqual(length(AP),length(AQ),places=8);self.assertAlmostEqual(dot(AP,AQ),0,places=7)
            self.assertGreater(length(AP),0)
            # Independently construct the two successive images of the new
            # synthetic proof, including both obtuse configurations.
            O=mid(B,D)
            clockwise=lambda X: plus(O,mul(-1,turn(sub(X,O))))
            self.assertLess(length(sub(clockwise(E),B)),1e-10)
            self.assertLess(length(sub(clockwise(C),D)),1e-10)
            self.assertLess(length(sub(clockwise(P),A)),1e-10)
            self.assertLess(length(sub(clockwise(A),Q)),1e-10)
            self.assertLess(length(sub(mid(P,Q),O)),1e-10)
    def test_840_construction_threshold(self):
        for _ in range(600):
            b=R.uniform(.1,10);a=b+R.uniform(.01,10);x=(a+b)/2;h=R.uniform(.01,10);d=math.hypot(x,h)
            self.assertGreater(d,x);B=((a-b)/2,h);C=(x,h)
            self.assertAlmostEqual(length(B),length(sub((a,0),C)),places=8)
            self.assertAlmostEqual(length(sub(B,C)),b,places=8)
            self.assertAlmostEqual(length(C),d,places=8)
    def test_841_reflection_about_two_axes(self):
        A=(0,math.sqrt(3));B=(-1,0);C=(1,0)
        for O,U,P,Q in [(A,mid(B,C),B,C),(B,mid(A,C),A,C)]:
            e=mul(1/length(sub(U,O)),sub(U,O));v=sub(P,O)
            reflection=plus(O,sub(mul(2*dot(v,e),e),v))
            self.assertLess(length(sub(reflection,Q)),1e-10)

if __name__=='__main__':unittest.main(verbosity=2)

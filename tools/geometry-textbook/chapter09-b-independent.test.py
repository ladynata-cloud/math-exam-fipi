#!/usr/bin/env python3
"""Independent source-sensitive regressions for chapter IX exercises 766–794.

This file reads generated data only. It never imports/runs the author generator,
changes release status, or treats coordinate agreement as a proof.
"""
import copy
import json
import math
from pathlib import Path
import unittest
from check_models import validate

ROOT = Path(__file__).resolve().parents[2]
COURSE = ROOT / 'geometry-course/textbook'
PREP = json.loads((COURSE / 'preparation/chapter-09-b.json').read_text())
MODELS = json.loads((COURSE / 'models/chapter-09-b.json').read_text())['models']
M = {(x['number'], x['part']): x['model'] for x in MODELS}
P = {(e['number'], x['part']): x for e in PREP['exercises'] for x in e['parts']}

def model(n, part='single'):
    return M[n, part]

def length(p, a, b):
    return math.dist(p[a][:2], p[b][:2])

def angle(p, a, v, b):
    u = [p[a][i] - p[v][i] for i in (0, 1)]
    w = [p[b][i] - p[v][i] for i in (0, 1)]
    cross = u[0] * w[1] - u[1] * w[0]
    dot = sum(u[i] * w[i] for i in (0, 1))
    return math.degrees(math.atan2(abs(cross), dot))

def point(theta, r=1):
    return [r*math.cos(math.radians(theta)), r*math.sin(math.radians(theta))]

def line_distance(p, o, a, b):
    u = [p[b][i]-p[a][i] for i in (0,1)]
    w = [p[o][i]-p[a][i] for i in (0,1)]
    return abs(u[0]*w[1]-u[1]*w[0])/math.hypot(*u)

def area(p, ids):
    return abs(sum(p[a][0]*p[b][1]-p[a][1]*p[b][0]
                   for a,b in zip(ids,ids[1:]+ids[:1])))/2

def perimeter(p, ids):
    return sum(length(p,a,b) for a,b in zip(ids,ids[1:]+ids[:1]))

class BlockBIndependent(unittest.TestCase):
    def close(self,a,b):
        self.assertAlmostEqual(a,b,delta=1e-6*max(1,abs(a),abs(b)))

    def test_complete_explicit_source_parts_and_all_model_claims(self):
        explicit={766:list('абвгд'),767:list('абвг'),771:list('аб'),783:list('абвгдеж'),790:list('аб')}
        expected={(n,p) for n in range(766,795) for p in explicit.get(n,['single'])}
        self.assertEqual(set(P),expected);self.assertEqual(set(M),expected)
        self.assertEqual(len(expected),44)
        for key,m in M.items():
            self.assertEqual(validate(m),[],key)
            self.assertEqual(len(P[key]['steps']),len([x for x in m['views'] if x.startswith('step-')]))
            self.assertTrue(all(s.strip() for s in P[key]['steps']))

    def test_numeric_angles_from_source_and_generated_coordinates(self):
        expected=[(766,p,'ABC',d/2) for p,d in zip('абвгд',[48,57,90,124,180])]
        expected += [(767,p,'ABC',d) for p,d in zip('абвг',[64,30,34,20])]
        expected += [(768,'single','ACB',30),(770,'single','BAM',50),
            (771,'а','BAC',67),(771,'а','ABC',23),(771,'б','BAC',55),(771,'б','ABC',35),
            (773,'single','BAD',20),(773,'single','ADB',35),
            (775,'single','BMD',32),(776,'single','BMD',44),(777,'single','BEC',62),
            (779,'single','ACB',90)]
        for n,part,ids,d in expected:
            self.close(angle(model(n,part)['points'],*ids),d)
        p=model(778)['points'];self.close(angle(p,'M','A','B'),angle(p,'A','C','B'))

    def test_769_both_positions_and_incorrect_79_rejected(self):
        p=model(769)['points']
        for suffix,expected in [('',36),('__case1',101)]:
            self.close(angle(p,*[s+suffix for s in 'BAC']),expected)
            self.close(angle(p,*[s+suffix for s in 'AOB']),115)
            self.close(angle(p,*[s+suffix for s in 'AOC']),43)
        self.assertNotAlmostEqual(angle(p,'B__case1','A__case1','C__case1'),79)
        self.assertEqual(model(769)['views']['case-1']['availableFromStep'],3)
        self.assertIn('101',P[769,'single']['answer'])

    def test_772_two_isosceles_positions(self):
        p=model(772)['points']
        for suffix,apex,base in [('',51,64.5),('__case1',129,25.5)]:
            a,b,c=[s+suffix for s in 'ABC']
            self.close(length(p,a,b),length(p,a,c))
            self.close(angle(p,b,a,c),apex);self.close(angle(p,a,b,c),base)
            self.close(angle(p,a,c,b),base)

    def test_secant_tangent_and_parallel_conditions(self):
        p=model(773)['points'];self.close(angle(p,'A','B','O'),90)
        p=model(774)['points'];self.close(angle(p,'B','A','C'),angle(p,'A','C','D'))
        for n in (775,776):
            p=model(n)['points']
            self.close(length(p,'M','B'),length(p,'M','A')+length(p,'A','B'))
            self.close(length(p,'M','D'),length(p,'M','C')+length(p,'C','D'))
        p=model(782)['points']
        for c in ('I','J'):
            for end in ('P','Q'):
                self.close(line_distance(p,c,'O',end),length(p,c,'A'))
        self.close(length(p,'I','J'),length(p,'I','A')+length(p,'A','J'))

    def test_geometric_mean_models_and_constructed_input(self):
        for n in (780,781):
            p=model(n)['points'];self.close(length(p,'C','H')**2,length(p,'A','H')*length(p,'H','B'))
            self.close(angle(p,'C','H','B'),90)
        p=model(781)['points']
        self.close(length(p,'U','V'),length(p,'A','H'));self.close(length(p,'X','Y'),length(p,'H','B'))

    def test_783_grid_geometry_visible_in_every_view(self):
        for part,d in zip('абвгдеж',[45,45,60,135,45,45,45]):
            m=model(783,part);p=m['points'];self.close(angle(p,'A','B','C'),d)
            for v in m['views'].values():
                grid=[q for q in v.get('polygons',[]) if all(s.startswith('_grid') for s in q)]
                self.assertGreaterEqual(len(grid),12)
                horizontal=[];vertical=[]
                for q in grid:
                    xs=[p[s][0] for s in q];ys=[p[s][1] for s in q]
                    (horizontal if max(xs)-min(xs)>max(ys)-min(ys) else vertical).append(
                        sum(ys)/4 if max(xs)-min(xs)>max(ys)-min(ys) else sum(xs)/4)
                dx=[b-a for a,b in zip(sorted(vertical),sorted(vertical)[1:])]
                dy=[b-a for a,b in zip(sorted(horizontal),sorted(horizontal)[1:])]
                for gap in dx+dy:self.close(gap,dx[0])
                self.assertTrue(all(not s.startswith('_grid') for s in v.get('points',[])))
        d=model(783,'д')['views']
        initial={frozenset(x) for x in d['neutral']['segments']}
        first_step={frozenset(x) for x in d['step-1']['segments']}
        for radius in (('O','A'),('O','B')):
            self.assertNotIn(frozenset(radius),initial)
            self.assertIn(frozenset(radius),first_step)
        p=model(783,'в')['points'];self.close(length(p,'O','H')/length(p,'O','C'),.5)
        for part in 'еж':
            p=model(783,part)['points'];self.close(abs(p['A'][0]-p['B'][0]),abs(p['A'][1]-p['B'][1]))

    def test_tangential_polygon_metrics_and_787_impossibility(self):
        for n in (784,785,786,787,788,789,794):
            m=model(n);p=m['points'];ids='ABCDE' if n==786 else 'ABCD'
            r=line_distance(p,'O',ids[0],ids[1])
            for a,b in zip(ids,ids[1:]+ids[:1]):self.close(line_distance(p,'O',a,b),r)
            self.close(area(p,ids),perimeter(p,ids)*r/2)
        p=model(788)['points'];self.close(area(p,'ABCD')/perimeter(p,'ABCD')**2,12/400)
        self.close(line_distance(p,'O','A','B')/perimeter(p,'ABCD'),1.2/20)
        formal=24*5/2;upper=12*12/4
        self.assertGreater(formal,upper);self.assertEqual((formal,upper),(60,36))
        self.assertIn('не существует',P[787,'single']['answer'])
        self.assertTrue(all('не существует' in v.get('note','') for v in model(787)['views'].values()))

    def test_cyclic_quadrilaterals_and_all_three_altitude_circles(self):
        for n,part in [(790,'а'),(790,'б'),(791,'single'),(792,'single')]:
            p=model(n,part)['points']
            for vertex in 'BCD':self.close(length(p,'O',vertex),length(p,'O','A'))
            self.close(angle(p,'D','A','B')+angle(p,'B','C','D'),180)
        p=model(793)['points']
        for center,ids,diameter in [('O1','CMHK','CH'),('O2','AMHN','AH'),('O3','BNHK','BH')]:
            r=length(p,center,ids[0])
            for vertex in ids:self.close(length(p,center,vertex),r)
            self.close(2*r,length(p,*diameter))

    def test_correct_contextual_theory_links(self):
        items={(x['number'],x['part']):x for x in MODELS}
        refs=lambda n,p,i:items[n,p]['didactics']['steps'][i-1]['theoryPoints']
        self.assertEqual(refs(781,'single',1),[22])
        self.assertEqual(refs(781,'single',2),[21,23])
        self.assertEqual(refs(781,'single',3),[23,76])
        self.assertEqual(refs(790,'б',1),[50])
        self.assertEqual(refs(792,'single',3),[36,50])
        self.assertEqual(refs(793,'single',1),[17,70])
        self.assertEqual(refs(772,'single',3),[31,80])
        self.assertEqual(refs(773,'single',3),[18,21,31])
        for part in 'абг':self.assertEqual(refs(783,part,1),[52,79])
        self.assertEqual(refs(783,'в',1),[74,75,79])
        self.assertEqual(refs(783,'д',1),[12,79])
        for part in 'абвг':self.assertEqual(refs(783,part,2),[80])
        self.assertEqual(refs(783,'д',2),[81])
        for part in 'еж':
            for i in (1,2,3):self.assertEqual(refs(783,part,i),[18,31])

    def test_independent_parametric_families(self):
        # Vary geometry outside the generator's fixed examples.
        for i in range(1,181):
            arc=1.9*i
            p={'A':point(0),'C':point(arc),'B':point((arc+360)/2)}
            self.close(angle(p,'A','B','C'),arc/2)
            a=i/13;b=(181-i)/17
            p={'A':[0,0],'H':[a,0],'B':[a+b,0],'C':[a,math.sqrt(a*b)]}
            self.close(angle(p,'A','C','B'),90)
            self.close(length(p,'C','H')**2,a*b)
            # A family of rhombi supplies genuine tangential quadrilaterals.
            x=i/20+.1;y=(181-i)/30+.1
            p={'A':[-x,0],'B':[0,y],'C':[x,0],'D':[0,-y],'O':[0,0]}
            r=line_distance(p,'O','A','B')
            self.close(area(p,'ABCD'),perimeter(p,'ABCD')*r/2)

    def test_negative_model_controls(self):
        m=copy.deepcopy(model(769));m['points']['C__case1'][0]+=7
        self.assertTrue(validate(m))
        m=copy.deepcopy(model(793));m['points']['H'][0]+=3
        self.assertTrue(validate(m))
        m=copy.deepcopy(model(783,'в'));m['points']['H'][1]+=4
        self.assertTrue(validate(m))

if __name__=='__main__':
    unittest.main(verbosity=2)

#!/usr/bin/env python3
"""Independent review checks; does not import the author generator or its tests.

The separate review report records the manual source/proof reading. These checks
cross-check actual geometry and parameter formulas, not the wording of proofs.
"""
import json
import math
import unittest
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
CARDS = ROOT / 'stereo-course/merzlyak-10-base/lessons'
EPS = 3e-7

def load(p, n):
    return json.loads((CARDS / f'ex-{p:02}-{n:03}.json').read_text())

def model(p, n):
    m = load(p, n)['visualization']['model']
    return m, {k: np.asarray(v, dtype=float) for k, v in m['points'].items()}

def area(points):
    return sum(np.linalg.norm(np.cross(points[i]-points[0], points[i+1]-points[0])) / 2
               for i in range(1, len(points)-1))

def angle(u, v):
    return math.atan2(np.linalg.norm(np.cross(u, v)), np.dot(u, v))

def regular(n, radius, height):
    return [np.array([radius*math.cos(2*math.pi*i/n), radius*math.sin(2*math.pi*i/n), 0.]) for i in range(n)], np.array([0.,0.,height])

class IndependentPyramidReview(unittest.TestCase):
    def near(self, x, y):
        self.assertLess(np.linalg.norm(np.asarray(x)-np.asarray(y)), EPS*max(1,np.linalg.norm(y)))

    def test_complete_source_inventory_and_actual_models(self):
        inventory=json.loads((ROOT/'tools/merzlyak-10-base/coverage-remaining-inventory.json').read_text())
        prior={e['source']['exercise']:e for e in inventory['entries'] if e['source']['paragraph'] in [18,19]}
        coverage=json.loads((ROOT/'tools/merzlyak-10-base/coverage-18-19.json').read_text())
        self.assertEqual(len(prior),75)
        self.assertEqual({e['exercise'] for e in coverage['entries']},set(prior))
        for e in coverage['entries']:
            old=prior[e['exercise']]
            self.assertEqual(e['pdfPages'],old['source']['pdfPages'])
            # Numbered subparts can be combined into one full exercise card.
            p,n=map(int,e['exercise'].split('.'))
            card=load(p,n);m,pts=model(p,n)
            self.assertEqual(card['source']['pdfPages'],e['pdfPages'])
            self.assertEqual(card['source']['exercise'],e['exercise'])
            for v in pts.values():self.assertTrue(v.shape==(3,) and np.isfinite(v).all())
            for f in m['faces']+[v['polygon'] for v in m['views'].values() if 'polygon'in v]:
                xyz=[pts[k] for k in f]
                self.assertGreater(area(xyz),EPS)
                normal=np.cross(xyz[1]-xyz[0],xyz[2]-xyz[0])
                for point in xyz:self.near(np.dot(point-xyz[0],normal),0)
            for v in m['views'].values():
                self.assertTrue(set(v)<={'label','points','segments','polygon'})
                for a,b in v.get('segments',[]):self.assertGreater(np.linalg.norm(pts[a]-pts[b]),EPS)

    def test_nine_sections_by_independent_full_edge_clipping(self):
        sections=[(18,22,'D E F G'),(18,23,'D E G F'),(18,25,'B E D'),
                  (18,47,'P Q F E'),(18,48,'P Q F E'),(18,55,'P Q R T'),
                  (19,5,'A C C1 A1'),(19,9,'A B C1'),(19,10,'A C B1')]
        for p,n,letters in sections:
            m,pts=model(p,n);names=letters.split();polygon=[pts[k] for k in names]
            normal=np.cross(polygon[1]-polygon[0],polygon[2]-polygon[0]);normal/=np.linalg.norm(normal)
            found=[]
            for a,b in m['edges']:
                u,v=pts[a],pts[b];x,y=np.dot(u-polygon[0],normal),np.dot(v-polygon[0],normal)
                if abs(x)<EPS:found.append(u)
                if abs(y)<EPS:found.append(v)
                if x*y < -EPS**2:found.append(u+x/(x-y)*(v-u))
            unique=[]
            for q in found:
                if all(np.linalg.norm(q-r)>EPS for r in unique):unique.append(q)
            self.assertEqual(len(unique),len(polygon),(p,n))
            for q in polygon:self.assertTrue(any(np.linalg.norm(q-r)<EPS for r in unique),(p,n))
            # Consecutive sides must lie on an actual supporting face.
            for i,q in enumerate(polygon):
                r=polygon[(i+1)%len(polygon)];supported=False
                for face in m['faces']:
                    a,b,c=[pts[k] for k in face[:3]];fn=np.cross(b-a,c-a);fn/=np.linalg.norm(fn)
                    if abs(np.dot(q-a,fn))<EPS and abs(np.dot(r-a,fn))<EPS:supported=True
                self.assertTrue(supported,(p,n,i))

    def test_general_internal_dihedral_formulas_including_obtuse_face_angles(self):
        for n in [3,4]:
            for height in [.025,.1,.7,2.,13.,75.]:
                base,s=regular(n,2.,height);a,b,c=base[:3]
                # Orthogonally remove the common edge direction to obtain the
                # two inward rays of the normal section, not an acute-plane angle.
                edge=(b-s)/np.linalg.norm(b-s)
                ah=a-s-np.dot(a-s,edge)*edge;ch=c-s-np.dot(c-s,edge)*edge
                dihedral=angle(ah,ch);faceangle=angle(a-s,b-s)
                if n==3:
                    expected=2*math.asin(1/(2*math.cos(faceangle/2)))
                    self.near(dihedral,expected)
                    self.assertTrue(0<faceangle<2*math.pi/3)
                else:
                    expected=2*math.acos(math.sqrt(2)/(2*math.sin(dihedral/2)))
                    self.near(faceangle,expected)
                    self.assertTrue(math.pi/2<dihedral<math.pi)

    def test_general_area_formulas_from_triangular_face_cross_products(self):
        for n in [3,4]:
            for radius,h in [(1,.05),(2,1),(3,7),(5,19)]:
                base,s=regular(n,radius,h);o=np.zeros(3);k=(base[0]+base[1])/2
                r=np.linalg.norm(k);l=np.linalg.norm(s-k)
                actual=sum(area([s,base[i],base[(i+1)%n]]) for i in range(n))
                normal=np.cross(base[1]-base[0],s-base[0]);normal/=np.linalg.norm(normal)
                distance=abs(np.dot(o-base[0],normal))
                alpha=math.atan2(h,r)
                if n==3:expected=3*math.sqrt(3)*distance**2/(math.sin(alpha)**2*math.cos(alpha))
                else:
                    beta=angle(o-s,k-s)
                    expected=4*distance**2/(math.sin(beta)*math.cos(beta)**2)
                self.near(actual,expected)
                self.near(actual,area(base)/math.cos(alpha))

    def test_general_frustum_formulas_and_nonregular_homothety(self):
        for a,b,h in [(4,2,.05),(9,8,3),(12,2,25),(6,1,2)]:
            lo=[np.array([x*a/2,y*a/2,0.]) for x,y in [(-1,-1),(-1,1),(1,1),(1,-1)]]
            hi=[np.array([x*b/2,y*b/2,h]) for x,y in [(-1,-1),(-1,1),(1,1),(1,-1)]]
            actual=sum(area([lo[i],lo[(i+1)%4],hi[(i+1)%4],hi[i]]) for i in range(4))
            edge=hi[0]-lo[0];diag=hi[2]-lo[0]
            alpha=math.atan2(h,np.linalg.norm(edge[:2]));beta=math.atan2(h,np.linalg.norm(diag[:2]))
            self.near(actual,2*h*h/math.tan(beta)*math.sqrt(2+1/math.tan(alpha)**2))
            acute=angle(lo[1]-lo[0],edge)
            self.near(h,(a-b)*math.sqrt(-math.cos(2*acute))/(2*math.cos(acute)))
            self.assertTrue(0<beta<alpha<math.pi/2 and math.pi/4<acute<math.pi/2)
        # Even the deliberately nonregular frusta must be actual parallel
        # sections of one pyramid: all four/three extended ribs concur.
        for n,ratio in [(11,10/16),(12,.5)]:
            _,p=model(19,n);apices=[]
            for k in 'ABC' if n==11 else 'ABCD':apices.append((p[k+'1']-ratio*p[k])/(1-ratio))
            for q in apices:self.near(q,apices[0])

    def test_two_bisector_solutions_and_external_height_counterexample(self):
        _,p=model(18,54)
        for apex,foot in [('M','H'),('M2','H2')]:
            self.near(p[apex][:2],p[foot][:2]);self.near(p[foot][0],0)
            for a,b in [('A','B'),('A','C')]:
                u=p[b]-p[a];distance=np.linalg.norm(np.cross(p[foot]-p[a],u))/np.linalg.norm(u)
                self.near((p[apex][2]-p[foot][2])/distance,math.tan(math.pi/6))
        self.assertTrue(p['H'][1]>0 and p['H2'][1]<0)
        _,p=model(18,56);vertices=[p[k] for k in 'MABN']
        signs=[np.cross(vertices[(i+1)%4]-vertices[i],vertices[(i+2)%4]-vertices[(i+1)%4])[2] for i in range(4)]
        self.assertTrue(all(x<0 for x in signs) or all(x>0 for x in signs))
        # The witness's two nonneighbor faces are vertical, even though C is outside.
        for a,b in [('M','A'),('B','N')]:
            normal=np.cross(p[b]-p[a],p['S']-p[a]);self.near(normal[2],0)
        self.assertLess(p['C'][0]+p['C'][1],1)

    def test_tetrahedron_triangle_construction_for_varied_side_points(self):
        base,s=regular(3,1.,math.sqrt(2.));a,b,c=base
        for t in [.01,.2,.5,.9,1.]:
            for u in [.01,.3,.6,1.]:
                a1=b+t*(c-b);c1=b+u*(a-b)
                self.near(np.linalg.norm(s-a1),np.linalg.norm(a-a1))
                self.near(np.linalg.norm(s-c1),np.linalg.norm(c-c1))
                sides=[np.linalg.norm(a-a1),np.linalg.norm(c-c1),np.linalg.norm(a1-c1)]
                self.assertGreater(sum(sides)-2*max(sides),0)
                self.assertGreater(area([s,a1,c1]),0)

if __name__=='__main__':
    unittest.main()

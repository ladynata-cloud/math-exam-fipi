"""Measure medians and the two common plane maps in all actual 1289–1291 views."""
import json
from math import dist,isclose
from medians_and_translated_altitudes import OUT


def near(a,b):return isclose(a,b,rel_tol=3e-6,abs_tol=3e-6)
def vec(a,b):return tuple(y-x for x,y in zip(a,b,strict=True))
def dot(a,b):return sum(x*y for x,y in zip(a,b,strict=True))
def det(a,b):return a[0]*b[1]-a[1]*b[0]
def same(a,b):return near(dist(a,b),0)
def midpoint(a,b):return tuple((x+y)/2 for x,y in zip(a,b,strict=True))

for c,n,answers in zip(json.loads(OUT.read_text())['lessons'],range(1289,1292),[('3','5'),('5','4'),('6','6')],strict=True):
    s=c['source'];assert (s['exercise'],s['printedPages'],s['pdfPages'],s['chapter'])==(str(n),[330],[331],'XIV')
    assert c['answer']['mode']=='manual' and tuple(t['input']['accepted'][0] for t in c['steps'] if 'input' in t)==answers
    m=c['visualization']['model'];assert len(m['views'])==7
    for name,v in m['views'].items():
        k=int(name[-1])-1 if name[-1].isdigit() else 0
        q={label:m['points'][i][:2] for i in v['points'] for label in m['labels'][i].split('=')}
        unit=dist(q['U'],q['W']);L=lambda a,b:dist(q[a],q[b])/unit;V=lambda a,b:vec(q[a],q[b])
        if n==1289:
            for s1,s2,s3 in ('ABC','BCA','CAB'):
                assert same(midpoint(q[s2],q[s3]),q[s1+'₁']) and same(midpoint(q[s1],q['M']),q[s1+'₂'])
                assert same(midpoint(q[s1+'₁'],q[s1+'₂']),q['M'])
            assert near(L('A₁','B₁'),L('A₂','B₂')) and near(L('C₁','B₁'),L('C₂','B₂'))
            if k==1:assert near(L('M','A₂'),3)
            if k==2:assert near(L('B₂','C₂'),5)
        if n==1290:
            shifts=[V(s,t) for s,t in [('A','D'),('B','C'),('K','P'),('L','Q'),('M','N')]]
            assert all(same(shifts[0],t) for t in shifts)
            for group,center in [('ABLK','M'),('DCQP','N')]:
                assert near(L(*group[:2]),L(*group[1:3])) and near(dot(V(*group[:2]),V(*group[1:3])),0)
                assert same(midpoint(q[group[0]],q[group[2]]),q[center]) and same(midpoint(q[group[1]],q[group[3]]),q[center])
            if k==1:assert near(L('M','N'),5)
            if k==2:assert near(V('M','N')[0]/unit,-4)
        if n==1291:
            assert same(V('D','A'),V('C','B')) and same(V('D','A'),V('K','H'))
            for origin,through,foot,ray,syn in [('C','B','C₁','A','B'),('D','A','D₁','B','A')]:
                assert near(dot(V(origin,foot),V('S',ray)),0) and near(det(V('S',foot),V('S',ray)),0)
                assert near(det(V(origin,foot),V(origin,'K')),0) and near(dot(V(syn,'H'),V('S',ray)),0)
            assert near(det(V('S','H'),V('S','K')),0) and near(dot(V('S','K'),V('A','B')),0)
            if k==1:assert near(L('S','K'),6)
            if k==2:assert near(L('H','K'),6)
print('MEDIANS_TRANSLATED_ALTITUDES_OK: 21 measured views, all centroid halves, translated square vertices and translated perpendicular intersections.')

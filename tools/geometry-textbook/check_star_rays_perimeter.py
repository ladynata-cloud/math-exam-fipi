"""Check the pentagram edge graph, directed ray images and reflected minimizer."""
import json
from itertools import combinations,permutations
from math import atan2,degrees,dist,isclose
from star_rays_perimeter import OUT


def near(a,b):return isclose(a,b,abs_tol=3e-6,rel_tol=3e-6)
def vec(a,b):return (b[0]-a[0],b[1]-a[1])
def det(a,b):return a[0]*b[1]-a[1]*b[0]
def dot(a,b):return a[0]*b[0]+a[1]*b[1]
def ang(a,b):return degrees(atan2(det(a,b),dot(a,b)))
def mid(a,b):return tuple((x+y)/2 for x,y in zip(a,b,strict=True))

for c,n,answers in zip(json.loads(OUT.read_text())['lessons'],range(1286,1289),[('72','9'),('180','4'),('5','18')],strict=True):
    s=c['source'];assert (s['exercise'],s['printedPages'],s['pdfPages'],s['chapter'])==(str(n),[329],[330],'XIV')
    assert c['answer']['mode']=='manual' and tuple(p['input']['accepted'][0] for p in c['steps'] if 'input' in p)==answers
    m=c['visualization']['model'];assert len(m['views'])==7
    for name,v in m['views'].items():
        k=int(name[-1])-1 if name[-1].isdigit() else 0
        p={label:m['points'][i][:2] for i in v['points'] for label in m['labels'][i].split('=')}
        U=dist(p['U'],p['W']);L=lambda a,b:dist(p[a],p[b])/U
        marks=[[m['points'][a][:2],m['points'][b][:2]] for a,b in v['highlightSegments']]
        if n==1286:
            # Recover all five original diagonals independently from vertex endpoints.
            verts=list('ABCDE');segments={frozenset((m['labels'][a],m['labels'][b])) for a,b in v['segments']}
            edges={frozenset((verts[i],verts[(i+2)%5])) for i in range(5)}
            assert edges<=segments and not {frozenset((verts[i],verts[(i+1)%5])) for i in range(5)} & segments
            sym=[]
            for perm in permutations(verts):
                z=dict(zip(verts,perm,strict=True))
                if all(near(L(i,j),L(z[i],z[j])) for i,j in combinations(verts,2)):
                    assert {frozenset(z[i] for i in e) for e in edges}==edges
                    sym.append(perm)
            assert len(sym)==10
            if k==0:
                assert len(marks)==5
                for a,b in marks:
                    d=vec(a,b);assert near(det(vec(a,p['T']),d),0)
                    assert sum(near(det(vec(a,p[i]),d),0) for i in verts)==1
            else:assert len(marks)==20 and near(ang(vec(p['T'],p['A']),vec(p['T'],p['BC'[k-1]])),72*k)
        if n==1287:
            assert len(marks)==6 and near(L('A','P'),L('B','Q'))
            for (a,b),base,tip in [(marks[0],'A','P'),(marks[3],'B','Q')]:
                assert near(dist(p[base],a),0) and near(det(vec(a,b),vec(a,p[tip])),0) and dot(vec(a,b),vec(a,p[tip]))>0
            signed=ang(vec(p['A'],p['P']),vec(p['B'],p['Q']))
            assert near(abs(signed),[65,180,0][k])
            if k==2:assert near(L('B','Q'),4)
        if n==1288:
            for mirror,ray in [('P','A'),('Q','C')]:
                axis=vec(p['B'],p[ray]);center=mid(p['D'],p[mirror])
                assert near(det(axis,vec(p['B'],center)),0) and near(dot(axis,vec(p['D'],p[mirror])),0)
            for site,ray in [('E','A'),('F','C')]:
                axis=vec(p['B'],p[ray]);assert near(det(axis,vec(p['B'],p[site])),0) and dot(axis,vec(p['B'],p[site]))>0
            assert near(L('P','E')+L('E','F')+L('F','Q'),L('P','Q'))
            assert near(L('D','E')+L('E','F')+L('F','D'),L('P','Q'))
            assert L('E','F')>0
            if k==1:assert near(L('P','Q'),5)
            if k==2:assert near(L('P','Q')**2,18)
print('STAR_RAYS_PERIMETER_OK: 21 measured views, complete pentagram isometries, directed rays and attained perimeter minima.')

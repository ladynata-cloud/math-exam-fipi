"""Measure all four final constructions, including their distinct branches."""
import json
from math import atan2,degrees,dist,isclose
from final_motion_constructions import OUT


def near(a,b):return isclose(a,b,abs_tol=4e-6,rel_tol=4e-6)
def vec(a,b):return tuple(y-x for x,y in zip(a,b,strict=True))
def det(a,b):return a[0]*b[1]-a[1]*b[0]
def dot(a,b):return a[0]*b[0]+a[1]*b[1]
def lies(x,line):return near(det(vec(line[0],line[1]),vec(line[0],x)),0)
def angle(a,b):return degrees(atan2(det(a,b),dot(a,b)))
def same(a,b):return near(dist(a,b),0)
def half(a,b):return tuple((x+y)/2 for x,y in zip(a,b,strict=True))


for c,n,answers in zip(json.loads(OUT.read_text())['lessons'],range(1292,1296),[('4','60'),('6','5'),('7','4'),('2','60')],strict=True):
    pg=331 if n==1295 else 330
    s=c['source'];assert (s['exercise'],s['printedPages'],s['pdfPages'],s['chapter'])==(str(n),[pg],[pg+1],'XIV')
    assert c['answer']['mode']=='manual' and tuple(t['input']['accepted'][0] for t in c['steps'] if 'input' in t)==answers
    m=c['visualization']['model'];assert len(m['views'])==7
    for name,v in m['views'].items():
        k=int(name[-1])-1 if name[-1].isdigit() else 0
        p={label:m['points'][i][:2] for i in v['points'] for label in m['labels'][i].split('=')}
        if n==1292:
            vertex_ids=set(v['points'])|{i for ab in v['segments'] for i in ab}
            p.update({label:m['points'][i][:2] for i in vertex_ids for label in m['labels'][i].split('=')})
            # K, L and N are intersections inside the drawn lines, not their ends.
            if k==1:
                q=[]
                for i in range(3):
                    (a,b),(e,f)=[[m['points'][j][:2] for j in line] for line in (v['highlightSegments'][i],v['highlightSegments'][(i+1)%3])]
                    u=vec(a,b);w=vec(e,f);t=det(vec(a,e),w)/det(u,w)
                    q.append((a[0]+t*u[0],a[1]+t*u[1]))
                p.update(dict(zip('KLN',q,strict=True)))
        unit=dist(p['U'],p['W']);V=lambda a,b:vec(p[a],p[b]);L=lambda a,b:dist(p[a],p[b])/unit
        lines=[[m['points'][a][:2],m['points'][b][:2]] for a,b in v['highlightSegments']]
        if n==1292:
            assert len(v['circles'])==1 and len(lines)==3
            for tri in [('A','B','C'),('A₁','B₁','C₁')]:
                assert all(near(angle(V('T',tri[i]),V('T',tri[(i+1)%3])),120) for i in range(3))
                assert all(near(L('T',t),L('T','A')) for t in tri)
            for j,t in enumerate('ABC'):assert lies(p[t],lines[j]) and lies(p[t+'₁'],lines[j])
            if k==0:assert all(lies(p['T'],line) for line in lines)
            else:
                for j,t in enumerate('KLN'):assert lies(p[t],lines[j]) and lies(p[t],lines[(j+1)%3])
                assert all(near(L(*e),L('K','L')) for e in ['LN','NK'])
            if k==1:assert near(L('B','B₁'),4)
        if n==1293:
            assert len(lines)==3 and lies(p['V'],lines[0]) and lies(p['V'],lines[1])
            assert lies(p['A'],lines[0]) and lies(p['B'],lines[1]) and lies(p['B'],lines[2])
            assert near(det(vec(*lines[0]),vec(*lines[2])),0) and same(half(p['A'],p['B']),p['T'])
            if k==1:assert near(V('V','A')[0]/unit,6)
            if k==2:assert near(L('A','B'),5)
        if n==1294:
            assert same(V('B','C'),V('D','E')) and near(L('A','D')+L('B','C'),L('A','E'))
            assert near(L('B','D'),L('C','E')) and near(det(V('A','D'),V('B','C')),0)
            if k==1:assert near(L('A','E'),7)
            if k==2:
                assert near(L('A','C'),5) and near(L('C','E'),5)
                assert near(abs(det(V('A','E'),V('A','C')))/dist(p['A'],p['E'])/unit,4)
        if n==1295:
            b,c=lines[-2:]
            assert near(det(vec(*b),vec(*c)),0)
            for suffix,sign in [('',1),('′',-1)]:
                z='B'+suffix;t='C'+suffix
                assert lies(p[z],b) and lies(p[t],c) and near(L('A',z),L('A',t)) and near(L('A',z),L(z,t))
                assert near(angle(V('A',z),V('A',t)),60*sign)
                if k==2 or (k==0 and not suffix) or(k==1 and suffix):
                    aux=lines[1 if k==2 and suffix else 0]
                    assert lies(p[t],aux) and near(abs(angle(vec(*b),vec(*aux)))%180,60 if not suffix else 120)
            assert L('B','B′')>0 or L('C','C′')>0
print('FINAL_MOTION_CONSTRUCTIONS_OK: 28 measured views, cyclic intersections, central midpoint, complete diagonal translation and both 60-degree solutions.')

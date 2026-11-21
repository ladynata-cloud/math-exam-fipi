"""Measure the actual vectors and check their arrowheads, the shorter angle with a plain line and all scalar values."""
import json
from math import acos, cos, degrees, hypot, isclose, radians, sin, sqrt
from scalar_product import OUT

cards=json.loads(OUT.read_bytes())['lessons']
parts={109:'',110:'',111:'',112:'',1128:'абвгдежз',1129:'абвгде',1130:'абв',1131:'абвг',1132:''}
theory_pages={109:[283,284],110:[284,285],111:[285,286,287],112:[287,288]}
sq=[('AB','AC',45,'AB','CA',135),('AB','DA',90,'AB','AB',0),('OA','OB',90,'OA','OC',180),('AO','OB',90,'AO','OC',0),('OA','OC',180,'OA','OB',90),('AC','BD',90,'AC','AB',45),('AD','DB',135,'AD','BD',45),('AO','OC',0,'AO','CO',180)]
rh=[('AB','AD',60,'AB','DA',120),('AB','DA',120,'AB','AD',60),('BA','AD',120,'BA','DA',60),('OC','OD',90,'OC','DC',30),('AB','DA',60,'AB','AC',30),('AB','CD',0,'AB','BD',60)]
near=lambda a,b:isclose(a,b,abs_tol=.001)
def sub(a,b):return tuple(y-x for x,y in zip(a,b))
def dot(a,b):return a[0]*b[0]+a[1]*b[1]
def magnitude(v):return hypot(*v)
def angle(v,w):return degrees(acos(max(-1,min(1,dot(v,w)/(magnitude(v)*magnitude(w))))))
checks=arrows=0
for c,(n,part) in zip(cards,[(n,q or None) for n,ps in parts.items() for q in ps or [None]],strict=True):
    idx=parts[n].index(part) if part else 0;s=c['source'];col='theory' if n<1000 else 'main'
    assert c['id']==f'atanasyan-7-9-{col}-{n}-part-{idx+1}'
    pp=theory_pages[n] if n<1000 else [288]
    assert s['chapter']=='XII' and s['printedPages']==pp and s['pdfPages']==[p+1 for p in pp] and s.get('subpart')==part
    assert len([step for step in c['steps'] if 'input' in step])==2
    m=c['visualization']['model']
    for key,v in m['views'].items():
        checks+=1;raw=m['points'];suf='__v'+v['points'][0].split('__v')[1];base=raw['U'+suf];unit=magnitude(sub(base[:2],raw['V'+suf][:2]))
        assert unit>0
        def xy(p):return tuple((raw[p][k]-base[k])/unit for k in (0,1))
        pos={m['labels'][i]:xy(i) for i in v['points']}
        alt=key in ('case-3','step-3');mid=key in ('case-2','step-2')
        heads=[(a,b) for a,b in v['segments'] if b.startswith('head_')]
        assert len(heads)%2==0
        for (tip,left),(righttip,right) in zip(heads[::2],heads[1::2]):
            assert tip==righttip and near(magnitude(sub(xy(tip),xy(left))),magnitude(sub(xy(tip),xy(right))))
            arrows+=1
        if n in (1128,1129):
            u,w,original,x,y,practice=(sq if n==1128 else rh)[idx]
            undirected=n==1129 and idx>=4
            if 'A' in pos:
                a,b=(x,y) if alt else (u,w)
                vu=sub(pos[a[0]],pos[a[1]]);vw=sub(pos[b[0]],pos[b[1]])
                if undirected:
                    # In the printed row д only the first expression carries an arrow; in е neither does.
                    assert len(heads)==(2 if idx==4 else 0)
                else:
                    assert len(heads)==(2 if a==b else 4)
                expectedends=([a[1]] if idx==4 else []) if undirected else list(dict.fromkeys(pair[1]+'-'+pair[0] for pair in (a,b)))
                if not undirected:expectedends=[t.split('-')[0] for t in expectedends]
                assert [m['labels'][tip] for tip,_ in heads[::2]]==expectedends
            else:
                vu=sub(pos['P'],pos['X']);vw=sub(pos['P'],pos.get('Y',pos['X']))
            highlights=v['highlightSegments']
            assert all(pair in highlights for pair in v['segments'] if pair[1].startswith('head_'))
            for marked in ([a,b] if 'A' in pos else ['PX']+(['PY'] if 'Y' in pos else [])):
                assert [marked[0]+suf,marked[1]+suf] in highlights
            measure=angle(vu,vw)
            if undirected:measure=min(measure,180-measure)
            assert near(measure,practice if alt else original),(n,idx,key,measure)
            assert c['answer']['accepted'][0]==str(original)
        elif n==1130:
            u=sub(pos['P'],pos['X']);w=sub(pos['P'],pos['Y'])
            result=[-3*sqrt(2),6,3*sqrt(2)][idx] if alt else [3*sqrt(2),0,-3*sqrt(2)][idx]*(4 if mid else 1)
            assert near(dot(u,w),result)
        elif n==1131:
            if 'A' in pos:
                first,second=[('AB','AC'),('AC','CB'),('AB','BD') if alt else ('AC','BD'),('AC','AC')][idx]
                u=sub(pos[first[0]],pos[first[1]]);w=sub(pos[second[0]],pos[second[1]])
            else:
                u=sub(pos['P'],pos['X']);w=sub(pos['P'],pos.get('Y',pos['X']))
            assert near(dot(u,w),[18,-18,-27,36][idx] if alt else [8,-8,0,16][idx])
        elif n==1132:
            u=sub(pos['O'],pos['P']);w=sub(pos['O'],pos['Q']);result=sub(pos['O'],pos['R'])
            assert all(near(result[j],u[j]+w[j]) for j in (0,1))
            assert near(magnitude(result),17 if alt else 26 if mid else 13)
        elif n==111:
            u=sub(pos['P'],pos['X']);w=sub(pos['P'],pos['Y'])
            assert near(dot(u,w),-3 if alt else 0 if mid else 5)
            for label,foot in [('X','H'),('Y','K')]:
                assert near(pos[foot][0],pos[label][0]) and near(pos[foot][1],pos['P'][1])
        elif n==110:
            u=sub(pos['P'],pos['X']);w=sub(pos['P'],pos.get('Y',pos['P']))
            assert near(dot(u,w),0 if (mid or key=='case-4') else -3 if alt else 3)
        elif n==109:
            u=sub(pos['P'],pos['X']);w=sub(pos['P'],pos.get('Y',pos['X']))
            assert near(angle(u,w),90 if key=='case-4' else 0 if alt else 180 if mid else 30)
        elif n==112:
            u=sub(pos['P'],pos['X']);w=sub(pos['P'],pos.get('Y',pos['X']))
            assert near(dot(u,w),-10 if alt else 5)
iterations=0
for x in range(-4,5):
    for y in range(-4,5):
        a=(x,y)
        for u in range(-4,5):
            for v in range(-4,5):
                b=(u,v);d=dot(a,b)
                assert d==dot(b,a) and d==(x*x+y*y+u*u+v*v-(x-u)**2-(y-v)**2)/2
                for k in (-2,0,3):assert dot((k*x,k*y),b)==k*d
                if a!=(0,0) and b!=(0,0):assert near(d,magnitude(a)*magnitude(b)*cos(radians(angle(a,b))))
                iterations+=1
print(f'SCALAR_PRODUCT_OK {len(cards)} source entries, {checks} measured scenes, {arrows} physically checked arrowheads and {iterations} exact coordinate pairs.')

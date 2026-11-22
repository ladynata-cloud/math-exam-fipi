"""Measure each displayed tile, compare adjacent cells and rotate every rosette."""
import json
from math import cos,dist,isclose,pi,sin
from tiling_symmetries import OUT


def near(a,b):
    return isclose(a,b,abs_tol=3e-6,rel_tol=3e-6)


def same_set(a,b):
    return len(a)==len(b) and all(any(near(dist(p,q),0) for q in b) for p in a)


rows=json.loads(OUT.read_text())['lessons']
data=[(1279,'а',(3,1),('3','8')),(1279,'б',(4,0),('3','8')),(1279,'в',(4,1),('6','16')),
      (1280,'а',(3,0),('120','90')),(1280,'б',(4,0),('72','45'))]
for c,(n,part,(size,pair),answers) in zip(rows,data,strict=True):
    s=c['source'];assert (str(n),part,'XIV',[328],[329])==(s['exercise'],s['subpart'],s['chapter'],s['printedPages'],s['pdfPages'])
    assert c['answer']['mode']=='manual' and tuple(t['input']['accepted'][0] for t in c['steps'] if 'input' in t)==answers
    m=c['visualization']['model'];assert len(m['views'])==7
    for name,v in m['views'].items():
        k=int(name[-1])-1 if name[-1].isdigit() else 0
        coord=lambda i:m['points'][i][:2]
        labels={m['labels'][i]:coord(i) for i in v['points']}
        assert set(labels)==({'T','A','A′','U','W'} if n==1280 else {'A','A′','U','W'})
        unit=dist(labels['U'],labels['W'])
        segs=v['segments'][:-1];assert len(segs)%size==0
        cells=[]
        for start in range(0,len(segs),size):
            ring=segs[start:start+size];assert all(ring[j][1]==ring[(j+1)%size][0] for j in range(size))
            corners=[coord(edge[0]) for edge in ring]
            lengths=sorted(dist(coord(a),coord(b))/unit for a,b in ring)
            if n==1279 and part=='а':assert near(lengths[0]**2+lengths[1]**2,lengths[2]**2)
            if part=='б' or n==1280:assert all(near(vv,lengths[0]) for vv in lengths)
            if part=='в':
                bot=sorted(p[0] for p in corners if near(p[1],min(q[1] for q in corners)))
                top=sorted(p[0] for p in corners if near(p[1],max(q[1] for q in corners)))
                assert len(bot)==len(top)==2 and near(sum(bot),sum(top))
                bases=sorted([(bot[1]-bot[0])/unit,(top[1]-top[0])/unit])
                assert all(near(x,y) for x,y in zip(bases,[(1,3),(2,4),(3,5)][k],strict=True))
            cells.append(corners)
        a,a1=labels['A'],labels['A′']
        if n==1279:
            dx=a1[0]-a[0];assert near(a[1],a1[1])
            assert near(dx/unit,([4,6,8] if part=='в' else [2,3,4])[k])
            g=2 if pair else 1
            assert len(cells)==3*g
            for j in range(2*g):
                assert same_set([(p[0]+dx,p[1]) for p in cells[j]],cells[j+g])
            if pair:
                for j in range(0,len(cells),2):
                    assert sum(any(near(dist(p,q),0) for q in cells[j+1]) for p in cells[j])==2
        else:
            count=([6,3,4] if part=='а' else [6,5,8])[k];assert len(cells)==count
            tx,ty=labels['T'];alpha=2*pi/count
            def turn(p):
                x,y=p[0]-tx,p[1]-ty
                return tx+x*cos(alpha)-y*sin(alpha),ty+x*sin(alpha)+y*cos(alpha)
            assert near(dist(turn(a),a1),0)
            for j,cell in enumerate(cells):
                assert same_set([turn(p) for p in cell],cells[(j+1)%count])
print('TILING_SYMMETRIES_OK: 35 measured views, closed polygons, congruent tile types, exact horizontal periods and cyclic rotations.')

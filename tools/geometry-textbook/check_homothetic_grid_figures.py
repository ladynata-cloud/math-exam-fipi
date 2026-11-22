"""Verify every grid coordinate of figures 401 and 402; distinguish textual and pictured centres."""
import json
from math import dist,isclose
from homothetic_grid_figures import OUT


def near(a,b):return isclose(a,b,rel_tol=9e-6,abs_tol=9e-6)
def diff(q,p):return [a-b for a,b in zip(q,p)]
def close_pair(q,expected):return all(near(x,y) for x,y in zip(q,expected))


rows=[(1313,'а',['18','12']),(1313,'б',['2','3']),(1313,'в',['10','8']),(1313,'г',['1','3']),
      (1314,'а',['10','8']),(1314,'б',['4','12']),(1314,'в',['4','8']),(1314,'г',['8','6'])]
for card,(n,part,expected) in zip(json.loads(OUT.read_text())['lessons'],rows,strict=True):
    s=card['source'];assert (s['chapter'],s['exercise'],s['subpart'],s['printedPages'],s['pdfPages'])==('XV',str(n),part,[345],[346])
    assert [t['input']['accepted'][0] for t in card['steps'] if 'input'in t]==expected
    m=card['visualization']['model'];assert len(m['views'])==7
    for name,v in m['views'].items():
        i=int(name[-1])-1 if name[-1].isdigit() else 0
        p={lab:m['points'][key][:2] for key in v['points'] for lab in m['labels'][key].split('=')}
        unit=dist(p['U'],p['W']);d=lambda a,b:[x/unit for x in diff(p[a],p[b])]
        if n==1313:
            o={'а':'T','б':'Z','в':'P','г':'E'}[part];k={'а':3,'б':.5,'в':-2,'г':-.5}[part]
            names={'а':'ABC','б':'XYZ','в':'PQR','г':'LMN'}[part]
            if part=='а':
                original=[(-3,-1.5),(0,1.5),(3,-1.5)] if i<2 else [(-2,-1),(0,1),(2,-1)]
            elif part=='б':
                original=[(-4,-2),(-1,-5),(0,0)] if i<2 else [(-6,-2),(-1,-4),(0,0)]
            elif part=='в':
                original=[(0,0),(1,-3),(6,-3)] if i<2 else [(0,0),(1,-2),(5,-2)]
            else:original=[[(0,-2),(0,2),(4,-2)],[(-2,0),(-2,4),(2,0)],[(0,-3),(0,3),(4,-3)]][i]
        else:
            o='A';k=2
            if part=='а':names='KLMN';original=[(-1,-1),(0,1),(2,1),(4 if i<2 else 3,-1)]
            elif part=='б':
                names='CR';original=[(-1,1),(1,1)] if i<2 else [(-1,2),(2,2)]
                for ring,r in zip(v['circles'],[2,4] if i<2 else [3,6],strict=True):
                    assert near(dist(m['points'][ring['center']][:2],m['points'][ring['through']][:2])/unit,r)
            elif part=='в':
                names='LR';original=[(-1,1),(1,1)] if i<2 else [(-2,2),(2,2)]
                # Each source contour segment and each authored mouth segment has its exact image.
                edges=v['highlightSegments'];assert len(edges)==96
                for source,image in zip(edges[:48],edges[48:],strict=True):
                    for source_key,image_key in zip(source,image,strict=True):
                        x=diff(m['points'][source_key][:2],p['A']);y=diff(m['points'][image_key][:2],p['A'])
                        assert close_pair(y,[2*x[0],2*x[1]])
                outline=[(m['points'][edge[0]][0]-p['A'][0],m['points'][edge[0]][1]-p['A'][1]) for edge in edges[:8]]
                scale=2 if i==2 else 1
                assert all(close_pair([z/unit/scale for z in xy],q) for xy,q in zip(outline,[(-2,1),(-1,2),(1,2),(2,1),(2,0),(1,-1),(-1,-1),(-2,0)]))
            else:names='ABCD';original=[(0,0),(1,2),(5 if i<2 else 4,2),(4 if i<2 else 3,0)]
        for letter,xy in zip(names,original,strict=True):
            assert close_pair(d(letter,o),xy) and close_pair(d(letter+'′',o),[k*x for x in xy]),(n,part,i,letter,xy)
print('HOMOTHETIC_GRID_FIGURES_OK: 56 calibrated views, source figures 401/402, both distinct E positions, all vertices, arcs and circles.')

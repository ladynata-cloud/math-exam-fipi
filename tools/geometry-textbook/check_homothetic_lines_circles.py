"""Verify signed point maps, perpendicular distances and native circles in every view."""
import json
from math import dist,isclose
from homothetic_lines_circles import OUT


def near(a,b):return isclose(a,b,rel_tol=8e-6,abs_tol=8e-6)
def subtract(x,y):return [a-b for a,b in zip(x,y)]
def cross(a,b):return a[0]*b[1]-a[1]*b[0]


rows=[(1311,'а',2,['8','2']),(1311,'б',-.5,['2','3']),(1311,'в',-3,['12','8']),(1311,'г',3,['12','4']),
      (1312,'а',-1,['2','6']),(1312,'б',1.5,['3','9']),(1312,'в',3,['6','18'])]
for card,(n,part,k,checks) in zip(json.loads(OUT.read_text())['lessons'],rows,strict=True):
    s=card['source'];page=344 if n==1311 else 345
    assert (s['exercise'],s['subpart'],s['chapter'],s['printedPages'],s['pdfPages'])==(str(n),part,'XV',[page],[page+1])
    assert [z['input']['accepted'][0] for z in card['steps'] if 'input' in z]==checks
    m=card['visualization']['model'];assert len(m['views'])==7
    for key,v in m['views'].items():
        i=int(key[-1])-1 if key[-1].isdigit() else 0
        ps={z:m['points'][i][:2] for i in v['points'] for z in m['labels'][i].split('=')}
        unit=dist(ps['U'],ps['W'])
        for z in ('AB' if n==1311 else 'CR'):
            for a,b in zip(subtract(ps[z+'′'],ps['T']),subtract(ps[z],ps['T'])):assert near(a,k*b)
        if n==1311:
            delta=subtract(ps['B'],ps['A']);normal=subtract(ps['A'],ps['T'])
            assert near(sum(a*b for a,b in zip(delta,normal)),0)
            assert len(v['highlightSegments'])==2
            for suffix,extended in zip(['','′'],v['highlightSegments']):
                x,y=[m['points'][z][:2] for z in extended];d=subtract(x,y)
                assert all(near(cross(subtract(ps[z+suffix],y),d),0) for z in 'AB')
                assert dist(x,y)>dist(ps['A'+suffix],ps['B'+suffix])
            d=[2,4,2][i]
            assert near(dist(ps['A'],ps['T'])/unit,d) and near(dist(ps['A′'],ps['A'])/unit,abs(k-1)*d)
        else:
            assert len(v['circles'])==2 and not any('bound' in lab for lab in ps)
            for ring,r in zip(v['circles'],[i+1,(i+1)*abs(k)]):
                assert near(dist(m['points'][ring['center']][:2],m['points'][ring['through']][:2])/unit,r)
            assert not near(dist(ps['C'],ps['T']),0)
print('HOMOTHETIC_LINES_CIRCLES_OK: 28 line views, 21 native-circle views, each signed transformation and distance verified.')

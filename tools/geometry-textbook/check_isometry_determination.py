"""Check original exercise references, rendered circle loci, fixed sets and the distance examples."""
import json
from itertools import combinations
from math import dist, isclose
from isometry_determination import OUT

def close(a,b):
    return isclose(a,b,abs_tol=1e-6,rel_tol=1e-6)

for n, lesson in zip(range(1246,1250), json.loads(OUT.read_bytes())['lessons'], strict=True):
    source=lesson['source']
    assert (source['exercise'],source['printedPages'],source['pdfPages'],source['chapter'])==(str(n),[319],[320],'XIV')
    assert 'subpart' not in source and lesson['answer']['mode']=='manual'
    assert [s['input']['accepted'][0] for s in lesson['steps'] if 'input' in s]=={
        1246:['3','8'],1247:['4','5'],1248:['10','26'],1249:['4','1']}[n]
    model=lesson['visualization']['model']
    assert len(model['views'])==7
    for name,view in model['views'].items():
        idx=int(name[-1])-1 if name[-1].isdigit() else 0
        ids={label:k for k in view['points'] for label in model['labels'][k].split('=')}
        def pos(label):
            return model['points'][ids[label]][:2]
        unit=dist(pos('U'),pos('W'))
        def measure(a,b):
            return dist(pos(a),pos(b))/unit
        if n==1246:
            assert len(view['circles'])==2
            assert all(circle['center']==ids['T'+suffix] and circle['through']==ids['A'+suffix] for suffix,circle in zip(['','′'],view['circles'],strict=True))
            for suffix in ['', '′']:
                assert close(measure('T'+suffix,'A'+suffix),[2,3,4][idx])
            assert measure('T','T′')>2*[2,3,4][idx]
        elif n==1248:
            for vertex in ['A','B']:
                assert close(measure(vertex,'M'),measure(vertex,'N'))
            if idx:
                assert close(measure('C','M')**2,2)
                assert close(measure('C','N')**2,[0,10,26][idx])
                ax,ay=pos('A');bx,by=pos('B');cx,cy=pos('C')
                assert not close((bx-ax)*(cy-ay),(by-ay)*(cx-ax))
        else:
            for x,y in combinations('ABC',2):
                assert close(measure(x,y),measure(x+'′',y+'′'))
            if n==1247:
                assert close(measure('A','A′'),0) and close(measure('B','B′'),0)
                assert close(measure('C','C′'),[0,4,0][idx])
                if idx==2:assert close(measure('A','B'),5)
            elif idx==1:assert close(measure('A','B'),4)
print('ISOMETRY_DETERMINATION_OK: four source proofs, 28 verified views; identical points, circles and two-candidate ambiguity checked.')

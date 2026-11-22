"""Metric checks of the displayed triangle, two-candidate and fixed-point models."""
import json
from math import isclose,dist
from congruence_motion_review import OUT


def near(a,b):return isclose(a,b,abs_tol=3e-6,rel_tol=3e-6)


expect=[('5','12'),('4','3'),('4','2'),('13','0'),('2','50'),('6','12'),('6','0'),('8','1')]
for n,(c,answers) in enumerate(zip(json.loads(OUT.read_text())['lessons'],expect,strict=True),8):
    s=c['source'];assert c['id']==f'atanasyan-7-9-selfcheck-chapter-14-{n}-part-1'
    assert (s['exercise'],s['collection'],s['chapter'],s['printedPages'],s['pdfPages'])==(str(n),'selfcheck','XIV',[329],[330])
    assert c['answer']['mode']=='manual' and tuple(t['input']['accepted'][0] for t in c['steps'] if 'input' in t)==answers
    m=c['visualization']['model'];assert len(m['views'])==7
    for name,v in m['views'].items():
        i=int(name[-1])-1 if name[-1].isdigit() else 0
        p={z:m['points'][key][:2] for key in v['points'] for z in m['labels'][key].split('=')}
        u=dist(p['U'],p['W']);L=lambda a,b:dist(p[a],p[b])/u
        if n in (8,9,10,11,12,13) and not (n==12 and i>0):
            for a,b in [('A','B'),('C','A'),('B','C')]:
                if a in p and b in p:
                    factor=2 if n==9 and i==1 else 1
                    assert near(L(a,b)*factor,L(a+'′',b+'′'))
        if n in (8,13):
            if i==1:assert near(L('A′','B′'),5 if n==8 else 6)
            if i==2:assert near(sum(L(a+'′',b+'′') for a,b in ['AB','BC','CA']),12)
        if n==9 and i:assert near(L('A′','B′'),[4,3][i-1])
        if n==10 and i:assert near(L('A′','B′'),[4,1][i-1])
        if n==11 and i:assert near(L('A′','B′'),[13,0][i-1])
        if n==12 and i:
            assert near(L('A','M'),L('A','N')) and near(L('B','M'),L('B','N')) and not near(L('C','M'),L('C','N'))
            assert near(L('C','M' if i==1 else 'N')**2,[2,50][i-1])
        if n==14:assert near(L('A','A′'),[0,6,4][i])
        if n==15:
            if i==1:assert near(L('A','A′'),8)
            else:assert near(L('A','A′'),0) and L('B','B′')>0
print('CONGRUENCE_MOTION_REVIEW_OK: 56 measured views, all side lengths and congruences, reflection candidate distances and fixed points.')

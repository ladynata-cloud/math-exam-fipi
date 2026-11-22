"""Source namespace, displayed distances, affine images and both inclusions."""
import json
from math import dist,isclose
from plane_map_review import OUT


def near(a,b):return isclose(a,b,abs_tol=3e-6,rel_tol=3e-6)
def half(a,b):return tuple((x+y)/2 for x,y in zip(a,b,strict=True))
def same(a,b):return near(dist(a,b),0)


expect=[('3','-4'),('-2','0'),('-1','-1'),('5','6'),('5','13'),('7','10'),('5','5')]
for n,(c,answers) in enumerate(zip(json.loads(OUT.read_text())['lessons'],expect,strict=True),1):
    s=c['source']
    assert c['id']==f'atanasyan-7-9-selfcheck-chapter-14-{n}-part-1'
    assert (s['exercise'],s['collection'],s['chapter'],s['printedPages'],s['pdfPages'])==(str(n),'selfcheck','XIV',[328],[329])
    assert c['answer']['mode']=='manual' and tuple(t['input']['accepted'][0] for t in c['steps'] if 'input' in t)==answers
    m=c['visualization']['model'];assert len(m['views'])==7
    for name,v in m['views'].items():
        case=int(name[-1])-1 if name[-1].isdigit() else 0
        p={s:m['points'][i][:2] for i in v['points'] for s in m['labels'][i].split('=')}
        unit=dist(p['U'],p['W']);L=lambda a,b:dist(p[a],p[b])/unit
        if n==1:
            assert near(p['A′'][1],p['A'][1]) and near((p['A′'][0]-p['A'][0])/unit,[2,3,-2][case])
        if n in (2,5):
            for k in ('A','B') if n==5 else ('A',):
                xy,other=p[k],p[k+'′']
                assert near((xy[0]+other[0])/2,p['T'][0]) and near(xy[1],other[1])
            if n==2:
                assert near(L('A','A′'),[4,6,0][case])
            else:
                assert near(L('A','B'),L('A′','B′'))
                if case:assert near(L('A′','B′'),[5,13][case-1])
        if n in (3,6):
            for k in ('A','B') if n==6 else ('A',):
                assert same(half(p[k],p[k+'′']),p['T'])
            if n==3:
                assert near((p['A′'][0]-p['A'][0])/unit,[-4,-6,-4][case])
                if case==2:assert near((p['A′'][1]-p['A'][1])/unit,6)
            else:
                assert near(L('A','B'),L('A′','B′'))
                if case:assert near(L('A′','B′'),[7,10][case-1])
        if n==4:
            if case!=2:assert near(L('A','B'),L('A′','B′'))
            else:assert near(L('A′','B′'),2*L('A','B'))
            if case:assert near(L('A′','B′'),[5,6][case-1])
        if n==7:
            for suffix in ('','′'):
                assert near(L('A'+suffix,'P'+suffix)+L('P'+suffix,'B'+suffix),L('A'+suffix,'B'+suffix))
            assert near(L('A','P'),L('A′','P′')) and near(L('P','B'),L('P′','B′'))
            if case:assert near(L('P','B'),5)
print('PLANE_MAP_REVIEW_OK: seven independently numbered oral checks and 49 measured diagrams.')

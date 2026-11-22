"""Check parallel constructions including collinear points and both kinds of tangency."""
import json
from math import dist,isclose
from given_homothety_image import OUT


def near(a,b):return isclose(a,b,abs_tol=1e-5,rel_tol=1e-5)
def vec(p,o):return [x-y for x,y in zip(p,o)]
def cross(a,b):return a[0]*b[1]-a[1]*b[0]


rows=[(1321,None,[346],['6','6']),(1322,None,[346],['3','6']),(1323,None,[346,347],['3','12']),
      (1324,'а',[347],['2','6']),(1324,'б',[347],['2','6']),(1324,'в',[347],['6','18'])]
for card,(n,part,pp,ans) in zip(json.loads(OUT.read_text())['lessons'],rows,strict=True):
    s=card['source'];assert (s['chapter'],s['exercise'],s.get('subpart'),s['printedPages'],s['pdfPages'])==('XV',str(n),part,pp,[q+1 for q in pp])
    assert [t['input']['accepted'][0] for t in card['steps'] if 'input' in t]==ans
    m=card['visualization']['model'];assert len(m['views'])==7
    for name,v in m['views'].items():
        i=int(name[-1])-1 if name[-1].isdigit() else 0
        p={lab:m['points'][key][:2] for key in v['points'] for lab in m['labels'][key].split('=')}
        unit=dist(p['U'],p['W']);L=lambda a,b:dist(p[a],p[b])/unit
        if n==1321:names='AMB' if i==1 else 'AM';k=[1.5,2,-1.5][i]
        elif n==1322:names='ABCD';k=[2,1.5,-2][i]
        elif n==1323:names='CA';k=[-.5,1.5,-2][i]
        else:names='CR';k={'а':.5,'б':-.5,'в':3}[part]
        for label in names:
            assert all(near(second,k*first) for first,second in zip(vec(p[label],p['T']),vec(p[label+'′'],p['T'])))
        if n==1321:
            if i==1:
                assert near(cross(vec(p['M'],p['T']),vec(p['A'],p['T'])),0) and not near(cross(vec(p['B'],p['T']),vec(p['A'],p['T'])),0)
                assert near(cross(vec(p['M'],p['B']),vec(p['M′'],p['B′'])),0)
            else:assert not near(cross(vec(p['M'],p['T']),vec(p['A'],p['T'])),0)
            if i>0:assert near(L('T','M′'),6)
        elif n==1322:
            assert near(cross(vec(p['A′'],p['B′']),vec(p['C′'],p['D′'])),0)
            assert near(cross(vec(p['A′'],p['D′']),vec(p['C′'],p['B′'])),0)
            if i in (1,2):assert near(L('A′','B′'),3 if i==1 else 6)
        else:
            r=[2,2,3][i] if n==1323 else [1,2,3][i] if part=='в' else [2,4,6][i]
            assert len(v['circles'])==2
            for circle,radius in zip(v['circles'],[r,abs(k)*r],strict=True):
                assert near(dist(m['points'][circle['center']][:2],m['points'][circle['through']][:2])/unit,radius)
            if n==1323:assert near(L('C','A'),r) and near(L('C′','A′'),abs(k)*r)
            elif part in 'аб':
                assert near(L('C','T'),r) and near(L('C′','T'),abs(k)*r)
                assert near(L('C','C′'),r*(.5 if part=='а' else 1.5))
            else:
                assert not near(L('C','T'),r)
                assert [L('C','T')>r,0<L('C','T')<r,near(L('C','T'),0)][i]
print('GIVEN_HOMOTHETY_IMAGE_OK: 42 views, collinear fallback, both tangencies, interior/exterior/concentric cases.')

"""Verify the final nine review questions on the emitted interactive diagrams."""
import json
from math import atan2,degrees,dist,isclose
from symmetry_motion_review import OUT


def near(a,b):return isclose(a,b,abs_tol=4e-6,rel_tol=4e-6)
def vec(a,b):return tuple(j-i for i,j in zip(a,b,strict=True))
def det(a,b):return a[0]*b[1]-a[1]*b[0]
def dot(a,b):return a[0]*b[0]+a[1]*b[1]
def angle(a,b):return degrees(atan2(det(a,b),dot(a,b)))


expect=[('3','0'),('13','4'),('4','6'),('5','5'),('5','180'),('7','180'),('3','2'),('6','6'),('120','45')]
for n,(c,ans) in enumerate(zip(json.loads(OUT.read_text())['lessons'],expect,strict=True),16):
    s=c['source'];assert c['id']==f'atanasyan-7-9-selfcheck-chapter-14-{n}-part-1'
    assert (s['exercise'],s['collection'],s['chapter'],s['printedPages'],s['pdfPages'])==(str(n),'selfcheck','XIV',[329],[330])
    assert c['answer']['mode']=='manual' and tuple(t['input']['accepted'][0] for t in c['steps'] if 'input' in t)==ans
    m=c['visualization']['model'];assert len(m['views'])==7
    for name,v in m['views'].items():
        i=int(name[-1])-1 if name[-1].isdigit() else 0
        p={z:m['points'][t][:2] for t in v['points'] for z in m['labels'][t].split('=')}
        unit=dist(p['U'],p['W']); V=lambda a,b:vec(p[a],p[b]);L=lambda a,b:dist(p[a],p[b])/unit
        if n in (16,17):
            assert near(dist(V('A','A′'),V('B','B′')),0) and near(L('A','B'),L('A′','B′'))
            if n==16 and i==1:assert near(V('A','A′')[0]/unit,5)
            if n==16 and i==2:assert near(L('A','A′'),0)
            if n==17 and i==1:assert near(L('A′','B′'),13)
            if n==17 and i==2:assert near(V('A′','A')[0]/unit,4)
        if n in (18,19):
            target=([60,-90,180] if n==18 else [55,35,70])[i]
            for letter in 'AB':
                measured=angle(V('T',letter),V('T',letter+'′'))
                assert near(abs(measured),180) if abs(target)==180 else near(measured,target)
                assert near(L('T',letter),L('T',letter+'′'))
            assert near(L('A','B'),L('A′','B′'))
            if n==18 and i==1:assert near(L('T','A′'),4)
            if n==18 and i==2:assert near(L('A','A′'),6)
            if n==19 and i:assert near(L('A′','B′'),5)
        if n==20:
            before=[p[z] for z in 'ABCD'];after=[p[z+'′'] for z in 'ABCD']
            assert near(L('A','B'),L('A′','B′'))
            if i==1:assert near(L('A','A′'),5) and any(not any(near(dist(z,w),0) for w in before) for z in after)
            else:assert all(any(near(dist(z,w),0) for w in before) for z in after)
        if n==21:
            if i==2:assert len(v['circles'])==1 and near(L('T','A'),2)
            else:assert len(v['highlightSegments'])==[3,4][i]
        if n==22:
            lines=[[m['points'][a][:2],m['points'][b][:2]] for a,b in v['highlightSegments']]
            assert len(lines)==3 and all(near(a[1],b[1]) for a,b in lines)
            ys=sorted(a[1] for a,b in lines);assert near(ys[1],p['T'][1]) and near((ys[2]-ys[0])/unit,[2,6,4][i])
        if n==23:assert near(V('A','A′')[0]/unit,[2,3,6][i]) and near(V('A','A′')[1],0)
        if n==24:assert near(angle(V('T','A'),V('T','A′')),[60,120,45][i])
print('SYMMETRY_MOTION_REVIEW_OK: 63 measured views with translations, signed rotations, invariant sets, strips, and ornament periods.')

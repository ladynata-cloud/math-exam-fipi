"""Independently measure the coordinate triangles, arrow lengths, diagonal signs and median angle from p. 292."""
import json
from math import acos, degrees, hypot, isclose, sqrt
from additional_scalar_vectors import OUT


def delta(a,b):
    return a[0]-b[0],a[1]-b[1]


def dot(a,b):
    return a[0]*b[0]+a[1]*b[1]


def close(a,b):
    return isclose(a,b,abs_tol=.0001)


def aligned(u,v):
    return close(u[0]*v[1],u[1]*v[0])


data=json.loads(OUT.read_bytes())['lessons']
count=arrowheads=0
for n,e in zip(range(1154,1159),data,strict=True):
    src=e['source']
    assert src['chapter']=='XII' and src['printedPages']==[292] and src['pdfPages']==[293]
    assert e['id']==f'atanasyan-7-9-main-{n}-part-1' and e['answer']['mode']=='exact'
    assert len([st for st in e['steps'] if 'input' in st])==2
    m=e['visualization']['model']
    for key,v in m['views'].items():
        count+=1
        mode=2 if key in ('case-3','step-3') else 1 if key in ('case-2','step-2') else 0
        suf='__v'+v['points'][0].split('__v')[1]
        raw=m['points']
        origin=raw[('O' if n<1156 else 'U')+suf]
        target=raw[('_unitX' if n<1156 else 'V')+suf]
        scale=hypot(*delta(target,origin))
        assert scale>0
        p={j.split('__')[0]:tuple((x-y)/scale for x,y in zip(raw[j][:2],origin[:2])) for j in v['points']}
        def u(seg):return delta(p[seg[1]],p[seg[0]])
        def squared(seg):return dot(u(seg),u(seg))
        heads=[(a,b) for a,b in v['highlightSegments'] if b.startswith('head_')]
        shafts=[(a,b) for a,b in v['highlightSegments'] if not b.startswith('head_')]
        assert len(heads)==len(shafts)*2;arrowheads+=len(shafts)
        for a,b in shafts:
            h=[w for j,w in heads if j==b];assert len(h)==2
            tang=delta(raw[b],raw[a])
            assert all(dot(delta(raw[w],raw[b]),tang)<0 for w in h)
        if n==1154:
            assert close(dot(u('CA'),u('CB')),0 if mode==2 else -5)
            if mode!=2:
                assert close(dot(u('AB'),u('AC')),7) and close(dot(u('BA'),u('BC')),22)
                assert close(dot(u('CA'),u('CB'))/sqrt(squared('CA')*squared('CB')),-5/sqrt(34))
        elif n==1155:
            assert close(squared('OM'),100 if mode==2 else 25)
            assert close(dot(u('OH'),u('HM')),0) and len(v['rightAngles'])==1
            assert u('OM')[1]>0 if mode==1 else u('OM')[1]<0
        elif n==1156:
            if mode==0:
                assert close(squared('OP'),8) and close(squared('OQ'),9) and close(dot(u('OP'),u('OQ')),6)
            else:
                assert all(close(x+y,z) for x,y,z in zip(u('OA'),u('OB'),u('OS')))
                assert close(squared('OS'),297 if mode==2 else 225) and close(squared('BA'),353 if mode==2 else 593)
        elif n==1157:
            if mode==0:
                assert close(squared('OA'),4) and close(squared('OB'),25) and close(dot(u('OA'),u('OB')),-5)
            else:
                assert close(dot(u('PX'),u('PY'))*40,-340 if mode==2 else 0)
        elif n==1158:
            assert close(squared('AH'),squared('HC')) and close(squared('AK'),squared('KB'))
            assert aligned(u('BH'),u('BG')) and aligned(u('CK'),u('CG'))
            prod=dot(u('BH'),u('CK')); assert prod<0
            cos_squared=prod**2/(squared('BH')*squared('CK'))
            assert close(cos_squared,25/34 if mode==2 else 16/25)
            if mode!=2:assert round(60*degrees(acos(sqrt(cos_squared))))==36*60+52
            assert '36:51' not in e['answer']['accepted']
trials=0
for x in range(1,51):
    for y in range(1,51):
        cosine=(x*x+y*y)/(2*hypot(x,y/2)*hypot(x/2,y))
        direct=abs(dot((-x,y/2),(x/2,-y)))/(hypot(x,y/2)*hypot(x/2,y))
        assert close(cosine,direct) and 0<cosine<=1
        trials+=1
print(f'ADDITIONAL_SCALAR_VECTORS_OK {len(data)} exercises, {count} measured source scenes, {arrowheads} oriented arrows, {trials} independent acute median angles.')

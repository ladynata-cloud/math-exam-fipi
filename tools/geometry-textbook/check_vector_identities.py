"""Read the actual diagram strokes and independently verify the final exercises of §2."""
from itertools import product
from math import acos, degrees, hypot, isclose, sqrt
from pathlib import Path
import json
import re

root=Path(__file__).resolve().parents[2]
cards=json.loads((root/'geometry-course/textbook/data/vector-identities.json').read_text())['lessons']


def close(a,b):return isclose(a,b,rel_tol=1e-8,abs_tol=1e-7)


def eq(a,b):return all(close(x,y) for x,y in zip(a,b,strict=True))


def plus(a,b):return (a[0]+b[0],a[1]+b[1])


def neg(a):return (-a[0],-a[1])


def minus(a,b):return plus(a,neg(b))


def determinant(a,b):return a[0]*b[1]-a[1]*b[0]


def dot(a,b):return a[0]*b[0]+a[1]*b[1]


def measurements(model,key):
    view=model['views'][key];raw=model['points']
    pts={x.split('__v')[0]:tuple(raw[x][:2]) for x in view['points']}
    unit=minus(pts['V'],pts['U']);assert unit[0]>0 and close(unit[1],0)
    heads=[(a,b) for a,b in view['segments'] if b.startswith('head_') and b.endswith('_l')]
    shafts=[(a,b) for a,b in view['segments'] if not b.startswith('head_')][-len(heads):] if heads else []
    for (tip,left),(start,end) in zip(heads,shafts,strict=True):
        right=left[:-1]+'r'
        assert tip==end and [tip,right] in view['segments']
        direction=minus(raw[tip][:2],raw[start][:2]);l=minus(raw[left][:2],raw[tip][:2]);r=minus(raw[right][:2],raw[tip][:2])
        assert close(determinant(direction,l),-determinant(direction,r))
        assert abs(determinant(direction,l))>1e-8 and dot(direction,l)<0
    def vector(names):
        a,b=re.findall(r'[A-Z]₁?',names)
        return tuple(v/unit[0] for v in minus(pts[b],pts[a]))
    return vector,[a.split('__v')[0]+b.split('__v')[0] for a,b in shafts]


source_ids=[];arrows=0;cases=0
for entry in cards:
    source=entry['source'];n=int(source['exercise']);part=source.get('subpart','');source_ids.append((n,part))
    assert (source['bookId'],source['chapter'],source['printedPages'],source['pdfPages'])==('atanasyan-2023-7-9','X',[236],[237])
    assert len([s for s in entry['steps'] if 'input' in s])==2
    model=entry['visualization']['model']
    for name in model['views']:
        arrows+=len(measurements(model,name)[1])
        cases+=name.startswith('case-')
    def expect(i,arrow,vector):
        measure,visible=measurements(model,'case-'+str(i))
        assert arrow in visible and eq(measure(arrow),vector),(n,part,i,arrow,visible,measure(arrow),vector)
    v,_=measurements(model,'neutral')
    if n==953:
        for i,sequence in enumerate([['XY','YZ','ZX'],['XY','YZ','ZX'],['ZY','YX','XZ']],1):
            w,seen=measurements(model,'case-'+str(i));assert seen==sequence
            assert eq(plus(plus(w(sequence[0]),w(sequence[1])),w(sequence[2])),(0,0))
    elif n==954:
        for edge in ['PX','QP','QR','RY']:expect(1,edge,v(edge))
        answer=plus(plus(neg(v('PX')),neg(v('QP'))),plus(v('QR'),v('RY')))
        expect(2,'XY',answer)
        assert eq(answer,(2,-3))
    elif n==955:
        a,b=v('AB'),v('AC')
        label,value={'а':('BA',neg(a)),'б':('CB',minus(a,b)),'в':('CA',neg(b))}[part]
        expect(2,label,value)
        if part=='в':assert eq(plus(v('CB'),v('BA')),value)
    elif n==956:
        a,b=v('AM'),v('AN')
        assert eq(a,v('MB')) and eq(b,v('NC'))
        for i,(label,value) in enumerate([('BM',neg(a)),('NC',b),('MN',minus(b,a)),('BN',minus(minus(b,a),a))],1):expect(i,label,value)
    elif n==957:
        x,y=v('AB₁'),v('AB')
        assert eq(x,v('B₁C'))
        for i,(label,value) in enumerate([('B₁C',x),('BB₁',minus(x,y)),('BA',neg(y)),('BC',plus(minus(x,y),x))],1):expect(i,label,value)
    elif n==958:
        x,y={'а':('AB','BC'),'б':('CB','CD'),'в':('AB','DA')}[part]
        expect(1,x,v(x));expect(1,y,v(y))
        value={'а':plus(v(x),v(y)),'б':neg(plus(v(x),v(y))),'в':minus(v(x),v(y))}[part]
        expect(2,'AC',value);assert eq(value,(5,3))
    elif n==959:
        a,b=v('AB'),v('AD')
        for i,(label,value) in enumerate([('DB',minus(a,b)),('BC',b),('BA',neg(a)),('BD',minus(b,a))],1):expect(i,label,value)
        assert eq(plus(v('DC'),v('CB')),v('DB')) and eq(plus(v('BO'),v('OC')),v('BC'))
        assert eq(minus(v('BO'),v('OC')),v('BA')) and eq(minus(v('BA'),v('DA')),v('BD'))
    elif n==960:
        for i in range(1,4):
            w,_=measurements(model,'case-'+str(i));value=plus(w('XO'),w('XO'))
            expect(i,'XT',value)
            assert eq(value,plus(w('XA'),w('XC'))) and eq(value,plus(w('XB'),w('XD')))
            for middle in ['A','C'] if i==1 else ['B','D'] if i==2 else ['A','B']:
                expect(i,'X'+middle,w('X'+middle));expect(i,middle+'T',minus(value,w('X'+middle)))
        w,_=measurements(model,'case-4')
        assert eq(plus(w('OA'),w('OC')),(0,0)) and eq(plus(w('OB'),w('OD')),(0,0))
    elif n==961:
        for i in (1,2,4):
            w,_=measurements(model,'case-'+str(i));x,y=w('OA'),w('OB')
            expect(i,'BA',minus(x,y));assert close(hypot(*w('BA')),hypot(*x)+hypot(*y))==(i==2)
        w,seq=measurements(model,'case-3');assert seq==['OB','BO'] and eq(w('BO'),neg(w('OB')))
    elif n==962:
        for i in (1,2):
            w,_=measurements(model,'case-'+str(i))
            expect(i,'OA',(0,-3));expect(i,'AB',(3*sqrt(3)*(1 if i==1 else -1),0))
            expect(i,'OB',plus(w('OA'),w('AB')))
            assert close(degrees(acos(dot(w('OA'),w('OB'))/(hypot(*w('OA'))*hypot(*w('OB'))))),60)
        expect(3,'OA',(0,-3))
assert source_ids==[(953,''),(954,'')]+[(955,p) for p in 'абв']+[(956,''),(957,'')]+[(958,p) for p in 'абв']+[(n,'') for n in range(959,963)]
points=list(product(range(-2,3),repeat=2))
for x,y in product(points,repeat=2):
    m=hypot(*minus(x,y));bound=hypot(*x)+hypot(*y)
    assert m<bound or close(m,bound)
    assert close(m,bound)==(x==(0,0) or y==(0,0) or determinant(x,y)==0 and dot(x,y)<0)
for x,y,z in product(points,repeat=3):
    xy,zx,yz=minus(y,x),minus(x,z),minus(z,y)
    for answer in [plus(plus(xy,zx),yz),plus(minus(xy,neg(zx)),yz),minus(minus(neg(yz),xy),zx)]:assert eq(answer,(0,0))
print(f'VECTOR_IDENTITIES_OK {len(cards)} cards, {arrows} arrows, {cases} model cases, {len(points)**2} equality classifications, {len(points)**3} arbitrary triples.')

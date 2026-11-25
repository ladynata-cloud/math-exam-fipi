"""Independently measure every vector, squared length, median and marked vertex used in 1139–1145."""
import json
from math import acos, degrees, hypot, isclose, sqrt
from scalar_geometry import OUT

def sub(a,b):
    return tuple(x-y for x,y in zip(a,b,strict=True))

def plus(a,b):
    return tuple(x+y for x,y in zip(a,b,strict=True))

def dot(a,b):
    return a[0]*b[0]+a[1]*b[1]

def length(a):
    return hypot(*a)

def near(a,b):
    return isclose(a,b,abs_tol=.0001)

def same(a,b):
    return all(near(x,y) for x,y in zip(a,b,strict=True))

def mid(a,b):
    return tuple((x+y)/2 for x,y in zip(a,b,strict=True))

lessons=json.loads(OUT.read_bytes())['lessons']
assert len(lessons)==7
views=heads=0
for n,item in enumerate(lessons,1139):
    assert item['id']==f'atanasyan-7-9-main-{n}-part-1' and item['source']['chapter']=='XII'
    pp=[289,290] if n==1143 else [290] if n>=1144 else [289]
    assert item['source']['printedPages']==pp and item['source']['pdfPages']==[x+1 for x in pp]
    assert item['answer']['mode']==('manual' if n in (1143,1145) else 'exact')
    assert len([s for s in item['steps'] if 'input' in s])==2
    m=item['visualization']['model']
    for key,v in m['views'].items():
        views+=1;suf='__v'+v['points'][0].split('__v')[1];raw=m['points'];u=raw['U'+suf][:2];unit=length(sub(raw['V'+suf][:2],u))
        assert unit>0
        p={m['labels'][k]:tuple((x-y)/unit for x,y in zip(raw[k][:2],u)) for k in v['points']}
        def vec(s):return sub(p[s[1]],p[s[0]])
        right=key in ('case-3','step-3');middle=key in ('case-2','step-2')
        head=[(x,y) for x,y in v['segments'] if y.startswith('head_')]
        assert len(head)%2==0;heads+=len(head)//2
        for (a,b),(c,d) in zip(head[::2],head[1::2]):
            assert a==c and near(length(sub(raw[a][:2],raw[b][:2])),length(sub(raw[c][:2],raw[d][:2])))
        if n==1139:
            a,b,s,d=map(vec,['OA','OB','OS','OD'])
            assert near(length(a),5) and near(length(b),8)
            assert same(s,plus(a,b)) and same(d,sub(a,b))
            assert near(dot(s,s),49 if right else 89 if middle else 129)
            assert near(dot(d,d),129 if right else 89 if middle else 49)
        elif n==1140:
            a,b,c,s=map(vec,['OA','OB','OC','OS'])
            assert near(length(a),1) and near(length(b),2) and near(length(c),2)
            assert same(s,plus(a,b)) and near(dot(s,c),1 if right else 3)
            assert near(dot(b,c),2) and near(dot(a,c),-1 if right else 1)
        elif n==1141:
            a,b,c,d,pv,q=map(vec,['OA','OB','OC','OD','OP','OQ'])
            assert near(dot(a,b),0) and near(length(a),5) and near(length(b),2)
            assert near(length(c),6 if right else 4) and same(d,sub(a,b))
            assert same(pv,sub(d,c)) and same(q,plus(d,c))
            assert near(dot(pv,q),-7 if right else 13)
        elif n==1142:
            a,b=vec('PX'),vec('PY')
            assert near(dot(a,b),11 if right else -5)
        elif n==1143:
            if not (middle or right):
                assert same(mid(p['B'],p['C']),p['M'])
                a,b,med=map(vec,['AB','AC','AM'])
                assert near(4*dot(med,med),dot(a,a)+dot(b,b)+2*dot(a,b)) and near(dot(med,med),13)
            else:
                assert same(mid(p['A'],p['C']),p['H']) and same(mid(p['A'],p['B']),p['K'])
                assert near(length(vec('AB')),length(vec('AC'))) and near(length(vec('BH')),length(vec('CK'))) and near(dot(vec('BH'),vec('BH')),25 if right else 45)
        elif n==1144:
            assert same(mid(p['B'],p['C']),p['H']) and same(mid(p['A'],p['C']),p['K'])
            assert near(dot(vec('AH'),vec('BK')),-5/4 if right else 0)
            value=dot(vec('CA'),vec('CB'))/(length(vec('CA'))*length(vec('CB')))
            assert near(value,3/5 if right else 4/5)
            if not right:assert round(degrees(acos(value))*60)==36*60+52
        elif n==1145:
            assert same(plus(vec('AB'),vec('AD')),vec('AC')) and same(sub(vec('AB'),vec('AD')),vec('DB'))
            assert same(p['O'],mid(p['A'],p['C'])) and same(p['O'],mid(p['B'],p['D']))
            assert near(dot(vec('AC'),vec('DB')),4 if right else 0)
trials=0
for b in range(1,33):
    for h in range(1,81):
        ca=(-b,-h);cb=(b,-h)
        med1=(1.5*b,h/2);med2=(-1.5*b,h/2)
        assert (dot(med1,med2)==0)==(h==3*b)
        assert near(dot(ca,cb)/(length(ca)*length(cb)),(h*h-b*b)/(h*h+b*b))
        for c in [(h,b),(b,-h)]:
            a=ca;z=cb;d=sub(a,z);p=sub(d,c);q=plus(d,c)
            assert dot(p,q)==dot(d,d)-dot(c,c)
        trials+=1
print(f'SCALAR_GEOMETRY_OK {len(lessons)} numbered exercises, {views} measured scenes, {heads} oriented arrows, {trials} isosceles and difference-of-squares trials.')

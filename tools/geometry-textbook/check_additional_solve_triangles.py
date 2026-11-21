"""Recover all three sides and angles independently from each actual 1149–1153 drawing."""
import json
from math import acos, cos, degrees, hypot, isclose, radians, sin, sqrt
from additional_solve_triangles import OUT

def delta(a,b):return a[0]-b[0],a[1]-b[1]
def length(a,b):return hypot(*delta(a,b))
def angle(a,b,c):
    u,v=delta(a,b),delta(c,b)
    return degrees(acos(max(-1,min(1,(u[0]*v[0]+u[1]*v[1])/(hypot(*u)*hypot(*v))))))
def near(a,b):return isclose(a,b,rel_tol=.0001,abs_tol=.0001)
samples=[
    (1149,'а',{'A':30,'B':45,'c':8},{'A':30,'B':60,'c':10},'Cba'),
    (1149,'б',{'B':45,'C':60,'c':5},{'B':60,'C':60,'c':6},'Aab'),
    (1149,'в',{'A':48.5,'a':3.3,'c':3},{'A':90,'a':10,'c':5},'CBb'),
    (1149,'г',{'B':62.8,'b':10.4,'a':5.2},{'B':90,'b':8,'a':4},'ACc'),
    (1150,'а',{'A':135,'c':5,'b':7.5},{'A':90,'c':3,'b':4},'aCB'),
    (1150,'б',{'B':45,'a':3,'c':2*sqrt(2)},{'B':60,'a':4,'c':4},'bAC'),
    (1150,'в',{'C':150,'b':6,'a':sqrt(3)/4},{'C':90,'b':6,'a':8},'cAB'),
    (1151,None,{'a':9.9,'b':7,'c':4.5},{'a':5,'b':4,'c':3},'ABC'),
    (1152,None,{}, {},None),(1153,None,{}, {},None)]
cards=json.loads(OUT.read_bytes())['lessons']
assert len(cards)==len(samples)
scenes=0
for e,(n,part,orig,fresh,keys) in zip(cards,samples,strict=True):
    s=e['source'];idx='абвг'.index(part)+1 if part else 1
    assert e['id']==f'atanasyan-7-9-main-{n}-part-{idx}' and s['exercise']==str(n) and s['chapter']=='XII' and s.get('subpart')==part
    assert s['printedPages']==[292] and s['pdfPages']==[293] and e['answer']['mode']=='exact'
    assert len([r for r in e['steps'] if 'input' in r])==2
    m=e['visualization']['model'];rr=m['points']
    for key,v in m['views'].items():
        k=2 if key in ('step-3','case-3') else 1 if key in ('step-2','case-2') else 0
        suffix='__v'+v['points'][0].split('__v')[1];o=rr['O'+suffix];u=rr['_unitX'+suffix][0]-o[0];assert u>0
        p={lab:tuple((rr[id_][j]-o[j])/u for j in (0,1)) for id_ in v['points'] for lab in m['labels'][id_].split('=')}
        a,b,c=(p[q] for q in ('DEF' if n==1151 else 'ABC'))
        ds={'a':length(b,c),'b':length(a,c),'c':length(a,b),'A':angle(b,a,c),'B':angle(a,b,c),'C':angle(a,c,b)}
        assert near(ds['A']+ds['B']+ds['C'],180)
        for x,y,z in [('A','b','c'),('B','a','c'),('C','a','b')]:
            assert near(ds[x.lower()]**2,ds[y]**2+ds[z]**2-2*ds[y]*ds[z]*cos(radians(ds[x])))
        if keys:
            supplied=fresh if k==2 else orig
            for q,value in supplied.items():assert near(ds[q],value),(n,part,key,q,ds[q],value)
            if k<2:
                values=e['answer']['accepted'][0].replace(',','.').split(';')
                assert len(values)==3 and all(abs(float(x)-ds[q])<=.5*10**(-1 if q.isupper() else -2)+1e-5 for q,x in zip(keys,values))
                if n==1149 and idx in (3,4):
                    q='C' if idx==3 else 'A';fixed='A' if idx==3 else 'B'
                    assert ds[fixed]+180-ds[q]>180
            if n==1150 and idx==3 and k<2:assert near(ds['c']**2,651/16)
        elif n==1152:
            d=p['D']
            assert near(angle(b,a,d),angle(d,a,c))
            assert near(length(b,d)/length(d,c),ds['c']/ds['b'])
            assert near(length(a,d),2*ds['b']*ds['c']*cos(radians(ds['A']/2))/(ds['b']+ds['c']))
        else:
            assert near(ds['b'],12 if k==2 else 4) and near(ds['a'],5 if k==2 else 3)
            assert near(ds['c']**2,[13,37,169][k])
        scenes+=1
count=0
for alpha in range(1,180):
    for b,c in [(1,9),(3,4),(7,7),(8,5),(.6,.43)]:
        x=(c,0);y=(b*cos(radians(alpha)),b*sin(radians(alpha)));d=tuple((b*u+c*v)/(b+c) for u,v in zip(x,y))
        assert near(hypot(*d),2*b*c*cos(radians(alpha/2))/(b+c));count+=1
print(f'ADDITIONAL_SOLVE_OK {len(cards)} original subtasks, {scenes} fully measured triangle scenes, {count} independently reconstructed bisectors, both ambiguous sine problems, common length units.')

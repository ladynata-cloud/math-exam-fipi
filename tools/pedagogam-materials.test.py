#!/usr/bin/env python3
"""Recompute numeric answers from published questions and check artifact links."""
import ast
from fractions import Fraction as F
from html.parser import HTMLParser
import json
import math
import operator
from pathlib import Path
import re
from urllib.parse import urlsplit
import zipfile

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'pedagogam/materialy'
packs=json.loads((OUT/'materials.json').read_text())
ops={ast.Add:operator.add,ast.Sub:operator.sub,ast.Mult:operator.mul,ast.Div:operator.truediv}

def calc(s):
    s=s.strip().rstrip('.').replace('−','-').replace('·','*').replace(':','/').replace(',','.')
    def walk(n):
        if isinstance(n,ast.Constant) and isinstance(n.value,(int,float)):
            return F(str(n.value))
        if isinstance(n,ast.BinOp) and type(n.op) in ops:return ops[type(n.op)](walk(n.left),walk(n.right))
        if isinstance(n,ast.UnaryOp) and isinstance(n.op,ast.USub):return -walk(n.operand)
        raise ValueError(s)
    return walk(ast.parse(s,mode='eval').body)

def first(answer):return F(re.search(r'\d+(?:[,.]\d+)?(?:/\d+)?',answer)[0].replace(',','.'))
def nums(q):return [int(x) for x in re.findall(r'\d+',q)]
checks=0
for pack in packs:
    for v in pack['variants']:
        for i,(q,a) in enumerate(v['tasks']):
            slug=pack['slug']
            if slug=='diagnostika-vychisleniy':
                if i in (0,1,2,3,5):assert calc(q.split(': ',1)[1])==first(a),(q,a)
                elif i==4:
                    x,y=re.findall(r'0,\d+',q);assert calc(x)>calc(y) and f'{x} > {y}' in a
                elif i==6:
                    n,d,total=nums(q);assert F(n,d)*total==first(a)
                else:
                    dividend,divisor,_=nums(q);assert F(dividend,divisor)==first(a)
            elif slug=='obyknovennye-drobi':
                if i==0:
                    total,part=nums(q);assert f'{part}/{total}' in a and f'{total-part}/{total}' in a
                elif i==1:
                    n,d,target,n2,d2,target2=nums(q);expected=[F(n,d)*target,F(n2,d2)*target2]
                    assert expected==[F(x) for x in nums(a)[:2]]
                elif i==2:
                    x,y=re.findall(r'\d+/\d+',q);assert F(x)>F(y) and f'{x} > {y}' in a
                elif i==3:assert calc(q.split(': ',1)[1].split('.')[0])==first(a)
                elif i==4:
                    x,y=re.findall(r'\d+/\d+',q)[:2];assert str(F(x)+F(y)) in a
                elif i==5:
                    x,y=re.findall(r'\d+/\d+',q);assert 1-F(x)-F(y)==first(a)
            elif slug=='procenty':
                ns=nums(q)
                if i==0:expected=F(ns[0],100)*ns[1]
                elif i==1:expected=F(ns[0]*100,ns[1])
                elif i==2:expected=F(ns[1]*100,ns[0])
                elif i==3:expected=ns[0]*(1-F(ns[1],100))
                elif i==4:expected=F(ns[1],1)/(1-F(ns[0],100))
                else:expected=ns[0]*(1+F(ns[1],100))*(1-F(ns[2],100))
                assert expected==first(a),(q,a,expected)
            elif slug=='lineynye-uravneniya':
                if i<5:
                    equation=q if i<4 else q.split(': ',1)[1].split(';')[0]
                    left,right=equation.rstrip('.').split('=')
                    def val(s,x):
                        s=re.sub(r'(\d)x',r'\1*x',s)
                        s=re.sub(r'(\d)\(',r'\1*(',s)
                        return calc(s.replace('x',str(x)))
                    slope=(val(left,1)-val(right,1))-(val(left,0)-val(right,0))
                    root=(val(right,0)-val(left,0))/slope
                else:
                    quantity,extra,total=nums(q);root=F(total-extra,quantity)
                assert f'x = {root}' in a,(q,a,root)
            else:continue # All 12 proofs are reviewed by reading, not claimed as machine-verified.
            checks+=1

# Two valid non-congruent triangles with AB=5, AC=4, angle ABC=30 degrees.
ax,ay=5*math.cos(math.pi/6),2.5
bases=[ax-math.sqrt(16-ay*ay),ax+math.sqrt(16-ay*ay)]
assert 0<bases[0]<bases[1]
for base in bases:assert math.isclose(math.hypot(ax-base,ay),4)
for sides in [(5,6,7),(4,7,8)]:assert sum(sides)-max(sides)>max(sides)

class Links(HTMLParser):
    def __init__(self):super().__init__();self.urls=[]
    def handle_starttag(self,tag,attrs):
        if tag in ('a','link'):
            self.urls.extend(v for k,v in attrs if k=='href')

link_count=0
for page in [ROOT/'pedagogam/index.html',*OUT.glob('*/index.html')]:
    parser=Links();parser.feed(page.read_text())
    for href in parser.urls:
        url=urlsplit(href)
        if url.scheme and url.netloc!='mathexam.space':continue
        if not url.path:continue
        path=ROOT/url.path.lstrip('/') if url.path.startswith('/') else page.parent/url.path
        if url.path.endswith('/'):path=path/'index.html'
        assert path.is_file(),(page,href)
        link_count+=1
assert sum(len(v['tasks']) for p in packs for v in p['variants'])==64
with zipfile.ZipFile(OUT/'mathexam-5-komplektov.zip') as z:
    assert len(z.namelist())==16 and z.testzip() is None
    for p in packs:
        for filename in ('index.html','zadaniya.pdf','otvety.pdf'):
            rel=p['slug']+'/'+filename;assert z.read(rel)==(OUT/rel).read_bytes()
print(f'PEDAGOGAM_MATERIALS_OK: {checks} recomputed numeric tasks; SSA counterexample; {link_count} local links; exact ZIP contents.')

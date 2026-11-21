#!/usr/bin/env python3
"""Build the fixed OGE9 practice extension using exact Fraction arithmetic.

Original 27 exam lines stay byte-for-byte unchanged. Catalogue conditions are
transcribed secondary evidence, stored separately with their verified URLs.
Answers are computed offline from polynomial coefficients, never from the
trainer's answer/step functions. --check performs no writes.
"""
from __future__ import annotations
import argparse
from collections import Counter, defaultdict
from fractions import Fraction as F
import json
from math import isqrt, gcd
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
HTML = ROOT / 'trainers/oge-task9-equations.html'
FIXTURE = ROOT / 'tools/fixtures/task9-expanded-bank.json'
CATALOG = ROOT / 'tools/fixtures/task9-catalog-sources.json'
KINDS = ['linear-transfer','linear-one-bracket','linear-two-brackets','quad-square','quad-factor-x','quad-monic','quad-nonmonic']
NAV = 'https://doc.fipi.ru/navigator-podgotovki/navigator-oge/Ma-9_2_algebra.pdf'
DEMO = 'https://doc.fipi.ru/oge/demoversii-specifikacii-kodifikatory/{year}/ma_9_{year}.zip'
BEGIN = '  /* BEGIN fixed extension: tools/build-task9-expanded-bank.py */'
END = '  /* END fixed extension */'


def term(c, power=0): return {'type':'term','power':power,'coefficient':str(F(c))}
def N(c): return term(c)
def X(c): return term(c,1)
def X2(c): return term(c,2)
def BR(c, terms): return {'type':'bracket','coefficient':str(F(c)),'terms':terms}

def decimal(n):
    n=F(n); d=n.denominator; twos=fives=0
    while d%2==0: d//=2; twos+=1
    while d%5==0: d//=5; fives+=1
    if d!=1: raise ValueError('nonterminating answer '+str(n))
    places=max(twos,fives); sign='-' if n<0 else ''; v=abs(n.numerator)*(10**places//n.denominator)
    if not places:return sign+str(v)
    whole,frac=divmod(v,10**places)
    return sign+str(whole)+','+str(frac).zfill(places).rstrip('0')

def poly(terms):
    out=[F(0),F(0),F(0)]
    for t in terms:
        c=F(t['coefficient'])
        if t['type']=='term':out[t['power']]+=c
        else:
            child=poly(t['terms'])
            for i in range(3):out[i]+=c*child[i]
    return out

def equation_coeffs(L,R):
    p,q=poly(L),poly(R)
    return [p[i]-q[i] for i in (2,1,0)]

def solve(abc):
    a,b,c=abc
    if not a:
        if not b:raise ValueError('degenerate equation')
        return [-c/b]
    d=b*b-4*a*c
    if d<=0:raise ValueError('all quadratic practice must have two real roots')
    pn,pd=isqrt(d.numerator),isqrt(d.denominator)
    if pn*pn!=d.numerator or pd*pd!=d.denominator:raise ValueError('irrational roots')
    s=F(pn,pd)
    return sorted([(-b-s)/(2*a),(-b+s)/(2*a)])

def norm(abc):
    lead=next(c for c in abc if c)
    return tuple(str(c/lead) for c in abc)

def show(terms):
    out=''
    for t in terms:
        c=F(t['coefficient']); positive=c>=0; mag=abs(c)
        if not c and len(terms)>1:continue
        sign=('+' if positive else '−') if out else ('' if positive else '−')
        if t['type']=='bracket':body=('' if mag==1 else decimal(mag))+'('+show(t['terms'])+')'
        elif t['power']:body=('' if mag==1 else decimal(mag))+'x'+('²' if t['power']==2 else '')
        else:body=decimal(mag)
        out+=sign+body
    return out or '0'

def js_term(t):
    c=F(t['coefficient']); assert c.denominator==1,'all fixed display coefficients are integers'
    if t['type']=='bracket':return 'BR('+str(c.numerator)+',['+','.join(map(js_term,t['terms']))+'])'
    return ['N','X','X2'][t['power']]+'('+str(c.numerator)+')'

def make(code, kind, family, Lt, Rt, ask=None, answer=None, source='analog', label=None, evidence=None):
    abc=equation_coeffs(Lt,Rt); roots=solve(abc)
    if len(roots)==1:assert ask is None; key=roots[0]
    else:assert ask in ('min','max'); key=roots[ask=='max']
    expected=decimal(key)
    if answer is not None:assert F(str(answer).replace(',','.'))==key,(code,answer,key)
    return {'id':'exam-'+code,'code':code,'examKind':kind,'family':family,'source':source,
            'equation':show(Lt)+'='+show(Rt),'Lt':Lt,'Rt':Rt,
            'coefficients':dict(zip(['a','b','c'],map(str,abc))),'roots':list(map(str,roots)),
            'ask':ask,'answer':expected,'evidence':evidence or [],'label':label,
            'directOfficialCardVerified':False}

def exam(code,kind,family,L,R,ask,answer,source='fipi',label=None):
    ev=[]
    if source=='fipi':ev=[{'url':NAV,'role':'official identifier only'}, {'url':'https://100ballnik.com/wp-content/uploads/2025/02/9-zadanie-uravnenie-oge-fipi.pdf','role':'secondary condition'}]
    if source=='fipi-demo':ev=[{'url':DEMO.format(year=code[-4:]),'role':'official demonstration condition and key'}]
    return make(code,kind,family,L,R,ask,answer,source,label,ev)

def split_terms(s):
    s=s.replace('−','-').replace(' ',''); depth=0; parts=[]; start=0
    for i,ch in enumerate(s):
        if ch=='(':depth+=1
        if ch==')':depth-=1
        if i and ch in '+-' and depth==0:parts.append(s[start:i]);start=i
    parts.append(s[start:]);return parts

def parse_terms(s):
    terms=[]
    for part in split_terms(s):
        if '(' in part:
            m=re.fullmatch(r'([+-]?\d*)\(([^()]*)\)',part); assert m,part
            c=m[1]; c=1 if c in ('','+') else -1 if c=='-' else int(c)
            terms.append(BR(c,parse_terms(m[2])))
        else:
            power=2 if '²' in part else 1 if 'x' in part else 0
            c=part.replace('x','').replace('²','')
            c=1 if c in ('','+') else -1 if c=='-' else int(c)
            terms.append(term(c,power))
    return terms

def line(t):
    args=[repr(t['code']),repr(t['examKind']),repr(t['family']),
          '['+','.join(map(js_term,t['Lt']))+']','['+','.join(map(js_term,t['Rt']))+']',
          repr(t['ask']) if t['ask'] else 'null',repr(t['answer']),repr(t['source'])]
    if t['label']:args.append(repr(t['label']))
    call='exam('+','.join(args)+')'
    if t['source']=='catalog':
        urls=[e['url'] for e in t['evidence']]
        call='{...'+call+',catalogURL:'+json.dumps(urls[0],ensure_ascii=False)+',catalogSecondary:'+json.dumps(urls[1] if len(urls)>1 else '',ensure_ascii=False)+'}'
    return '  '+call+','

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--write',action='store_true');parser.add_argument('--check',action='store_true');args=parser.parse_args()
    html=HTML.read_text(); start=html.index('const EXAM_BANK=['); stop=html.index('\n];\nBANK.push(...EXAM_BANK);',start)
    bank_text=html[start:stop]
    original_text=bank_text.split(BEGIN)[0].rstrip()
    original_lines=[s for s in original_text.splitlines() if s.strip().startswith('exam(')]
    assert len(original_lines)==27
    old=[eval(s.strip().rstrip(',').replace('null','None'),{'exam':exam,'BR':BR,'X':X,'X2':X2,'N':N}) for s in original_lines]
    tasks=list(old); extra=defaultdict(list); seen={norm(equation_coeffs(t['Lt'],t['Rt'])) for t in old}; ids={t['id'] for t in old}
    def add(t):
        signature=norm(equation_coeffs(t['Lt'],t['Rt']))
        if signature in seen:return False
        assert t['id'] not in ids
        ids.add(t['id']); seen.add(signature); tasks.append(t);extra[t['examKind']].append(t);return True
    catalog=json.loads(CATALOG.read_text())
    for c in catalog['tasks']:
        left,right=c['equation'].split('='); L,R=parse_terms(left),parse_terms(right)
        kind=c['kind'];fam='L' if kind=='linear-transfer' else 'LB' if kind.startswith('linear-') else 'QNB' if kind=='quad-square' else 'QNCm' if kind=='quad-factor-x' and poly(R)[1] else 'QNC' if kind=='quad-factor-x' else 'QF'
        t=make(c['id'],kind,fam,L,R,c['ask'],c['answer'],'catalog','Каталог прототипов · '+c['id'],c['sources'])
        assert list(map(str,equation_coeffs(L,R)))==c['normalizedABC']
        assert t['roots']==c['roots']
        assert add(t),c['id']+' is a normalized duplicate'
    counts=Counter(t['examKind'] for t in tasks)
    def need(kind):return counts[kind]<20
    serial=Counter()
    def authored(kind,fam,L,R,ask=None):
        serial[kind]+=1
        code='var-'+kind+'-'+str(serial[kind]).zfill(2)
        t=make(code,kind,fam,L,R,ask)
        if kind.startswith('linear'):
            if any(abs(F(r))>12 for r in t['roots']):return False
            for tm in L+R:
                bound=12 if tm['type']=='bracket' or tm.get('power',0) else 100
                if abs(F(tm['coefficient']))>bound:return False
        if add(t):counts[kind]+=1;return True
        return False
    # Linear forms are designed from signed final k and a finite decimal root.
    # Root uniqueness avoids replacing only superficial coefficients.
    kpool=[3,-4,5,-6,7,-8,9,-10,12,-1,2,-3,4,-5,6,-7,8,-9,10,-12,1,-2]
    authored('linear-transfer','L',[X(10),N(3)],[X(1),N(21)])
    authored('linear-transfer','L',[X(8),N(-5)],[X(-4),N(-53)])
    for kind in KINDS[:3]:
        trial=0
        while need(kind):
            k=kpool[trial%len(kpool)]; cycle=trial//len(kpool); a=counts[kind]-Counter(t['examKind'] for t in old)[kind]
            denominators=[d for d in [1,2,4,5,8,10] if abs(k)%d==0]
            d=denominators[(trial+cycle)%len(denominators)]
            r=F(0) if kind=='linear-transfer' and trial==0 else F(((-1)**(trial//2))*(1+(trial*7+KINDS.index(kind)*3+cycle)%47),d)
            # Bound x and displayed constants without forcing integers/halves.
            if abs(r)>12:trial+=1;continue
            m=k*r; assert m.denominator==1
            if kind=='linear-transfer':
                b=trial%13-6; right_x=(trial%11)+1; left_x=k+right_x
                if not left_x:left_x+=1;right_x+=1
                L=[X(left_x),N(b)];R=[X(right_x),N(b+m)]
                if trial%3==0:L.reverse()
                if trial%4==0:R.reverse()
                authored(kind,'L',L,R)
            elif kind=='linear-one-bracket':
                a1=[-3,4,-5,6,-7,8,9,-10][trial%8]; shift=trial%9-4 or 2
                shape=trial%4
                if shape==0:
                    a1=k;L=[BR(a1,[X(1),N(shift)])];R=[N(m+a1*shift)]
                elif shape==1:
                    a1=-k;L=[N(a1*shift-m)];R=[BR(a1,[X(1),N(shift)])]
                elif shape==2:
                    L=[BR(a1,[X(1),N(shift)]),N(trial%5-2)];R=[X(a1-k),N(m+a1*shift+trial%5-2)]
                else:
                    L=[X(a1+k),N(a1*shift-m)];R=[BR(a1,[X(1),N(shift)])]
                authored(kind,'LB',L,R)
            else:
                a1=[3,-4,5,-6,7,-8,9,-10][trial%8]; a2=k-a1
                if not a2 or abs(a2)>12:trial+=1;continue
                u=trial%7-3 or 2; v=(trial*3)%9-4 or -2
                if u==v:v=-v
                shift=a1*u+a2*v
                shape=trial%3
                if shape==0:L=[BR(a1,[X(1),N(u)]),BR(a2,[X(1),N(v)])];R=[N(m+shift)]
                elif shape==1:L=[BR(a1,[X(1),N(u)]),N(-m-shift)];R=[BR(-a2,[X(1),N(v)])]
                else:L=[N(m+shift)];R=[BR(a1,[X(1),N(u)]),BR(a2,[X(1),N(v)])]
                authored(kind,'LB',L,R)
            trial+=1
            assert trial<10000,kind
    # Square-only equations: sometimes isolate the square, sometimes divide a
    # non-unit coefficient first; rational roots remain finite decimals.
    square_roots=[F(1,2),F(3,2),F(5,2),F(7,2),F(9,2),F(1,4),F(3,4),F(5,4),F(4),F(6),F(8),F(10),F(11),F(13),F(14),F(15),F(1,5),F(2,5)]
    for i,r in enumerate(square_roots):
        if not need('quad-square'):break
        a=(-1 if i%3==0 else 1)*r.denominator**2*(2 if i%4==1 and r.denominator<=2 and abs(r)<=9 else 1); c=-a*r*r
        if i%3==0:L,R=[X2(a)],[N(-c)]
        elif i%3==1:L,R=[N(c),X2(a)],[N(0)]
        else:L,R=[N(-c)],[X2(a)]
        authored('quad-square','QNB',L,R,'min' if i%2==0 else 'max')
    assert not need('quad-square')
    # Factor-x equations alternate negative/positive, integer/decimal roots and
    # original positions. Zero remains a valid root; do not divide away x.
    second_roots=[F(-1),F(-3,2),F(-2),F(-7,2),F(-4),F(-9,2),F(-6),F(1,2),F(5,4),F(9,4),F(11,2),F(13,2),F(9),F(10),F(-7),F(12)]
    for i,r in enumerate(second_roots):
        if not need('quad-factor-x'):break
        a=r.denominator*[1,2,-1,3,-2,1,2][i%7];b=-a*r
        if i%2==0:L,R=[X2(a),X(b)],[N(0)];fam='QNC'
        else:L,R=[X2(a)],[X(-b)];fam='QNCm'
        authored('quad-factor-x',fam,L,R,'max' if i%2==0 else 'min')
    assert not need('quad-factor-x')
    # Existing catalogue monics have positive integer roots. New monics focus
    # on both negative and mixed-sign roots, keeping arithmetic exam-sized.
    pairs=[(-1,-4),(-2,5),(-3,-7),(-5,2),(-2,-6),(-4,7),(-3,-8),(-7,3),(-5,-6),(-8,4),(-4,-9),(-6,1)]
    for i,(r,s) in enumerate(pairs):
        if not need('quad-monic'):break
        L=[X2(1),X(-(r+s)),N(r*s)];R=[N(0)]
        authored('quad-monic','QF',L,R,'min' if i%2 else 'max')
    assert not need('quad-monic')
    # Nonmonics: denominator 2a varies. Signed leading coefficients and
    # finite fractional roots are chosen before deriving integer coefficients.
    triples=[(3,-2,3),(-3,-2,-5),(4,F(1,4),3),(-4,F(-3,4),2),(5,F(2,5),-3),(-5,F(-4,5),-2),(6,F(1,2),4),(-6,F(-3,2),3),(7,-5,1),(7,-3,-1),(8,F(3,8),-1),(-8,F(-5,8),2),(9,1,4),(9,-4,-2),(10,F(7,10),-2),(-10,F(-9,10),-3),(4,F(5,4),-4),(5,F(3,5),6),(8,F(7,8),5)]
    for i,(a,r,s) in enumerate(triples):
        if not need('quad-nonmonic'):break
        r,s=F(r),F(s); b=-a*(r+s);c=a*r*s
        assert b.denominator==c.denominator==1
        authored('quad-nonmonic','QF',[X2(a),X(b),N(c)],[N(0)],'min' if i%2 else 'max')
    assert all(counts[k]==20 for k in KINDS),counts
    # Append in round-robin order without touching the first 27 IDs or BANK
    # positions. Each following page changes type, avoiding long same-type runs.
    interleaved=[]
    for i in range(max(map(len,extra.values()))):
        for kind in KINDS:
            if i<len(extra[kind]):interleaved.append(extra[kind][i])
    ordered=old+interleaved
    assert len(ordered)==140 and len({t['id'] for t in ordered})==140
    duplicates=defaultdict(list)
    for t in ordered:duplicates[norm(equation_coeffs(t['Lt'],t['Rt']))].append(t['id'])
    dupe=[v for v in duplicates.values() if len(v)>1]
    assert dupe==[['exam-286CF5','exam-9937FD']],dupe
    for t in ordered:
        for side in [t['Lt'],t['Rt']]:
            for tm in side:js_term(tm)
    divisors=Counter(abs(int(F(t['coefficients']['b']))) for t in ordered if t['examKind'].startswith('linear'))
    assert divisors[2]<=9,divisors
    assert max(divisors.values())<=20,divisors
    extension='\n'+BEGIN+'\n'+'\n'.join(map(line,interleaved))+'\n'+END
    new_html=html[:start]+original_text+extension+html[stop:]
    fixture={'schemaVersion':1,'checkedAt':'2026-11-10','sourceLabelling':'Two official demonstrations; 17 officially listed IDs with indirectly verified conditions; 22 additional secondary-catalogue transcriptions; remaining authored analogues. No direct bank card verification claimed.', 'tasks':ordered}
    encoded=json.dumps(fixture,ensure_ascii=False,indent=2)+'\n'
    if args.check:
        assert HTML.read_text()==new_html,'fixed bank is stale; rebuild with --write'
        assert FIXTURE.read_text()==encoded,'fixture is stale; rebuild with --write'
    if args.write:HTML.write_text(new_html);FIXTURE.write_text(encoded)
    print(json.dumps({'count':len(ordered),'kinds':Counter(t['examKind'] for t in ordered),'sources':Counter(t['source'] for t in ordered),'linearDivisors':dict(sorted(divisors.items())),'normalizedDuplicates':dupe},ensure_ascii=False))

if __name__=='__main__':main()

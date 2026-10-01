"""Independent Fraction/divmod oracle for each displayed long-division action."""
import json
import subprocess
from fractions import Fraction
from pathlib import Path

root=Path(__file__).resolve().parents[1]
js="""const D=require('./trainers/oge-basics/multiplication-division/division-lab-core.js');console.log(JSON.stringify(Object.keys(D.levels).flatMap(level=>Array.from({length:500},(_,seed)=>D.plan(D.make(level,seed))))));"""
plans=json.loads(subprocess.check_output(['node','-e',js],cwd=root))
def f(s): return Fraction(str(s).replace(',','.'))
actions=0
for p in plans:
    t=p['task']; original_a=f(t['dividend']); original_b=f(t['divisor']); exact=original_a/original_b
    quotient=f(p['quotient']); remainder=p['remainder']; divisor=p['normalizedDivisor']
    if t['level']=='remainder':
        expected_q,expected_r=divmod(original_a,original_b)
        assert quotient==expected_q and remainder==expected_r
    else: assert quotient==exact and remainder==0
    assert f(p['normalizedDividend'])/divisor==exact
    for c in p['cycles']:
        q,r=divmod(c['partial'],divisor)
        assert 0<=q<=9 and c['qd']==q and c['product']==divisor*q and c['remainder']==r
    current=None; rem=0; last_digit=None; built=''; q=0
    shift=len(t['divisor'].split(',')[1]) if ',' in t['divisor'] else 0
    for a in p['actions']:
        k=a['kind']; answer=a['answer']; actions+=1
        if k=='shift-count': assert f(answer)==shift
        elif k=='shift-factor': assert f(answer)==10**shift
        elif k=='shift-divisor': assert f(answer)==original_b*10**shift
        elif k=='shift-dividend': assert f(answer)==original_a*10**shift
        elif k=='start':
            idx=a['sourceIndex']; current=int(''.join(map(str,p['digits'][:idx+1])))
            assert f(answer)==current
            assert current>=divisor or idx==p['intLen']-1
            if idx: assert int(''.join(map(str,p['digits'][:idx])))<divisor
        elif k=='digit':
            q,rem=divmod(current,divisor);assert f(answer)==q;built+=str(q)
        elif k=='product': assert f(answer)==q*divisor
        elif k=='subtract': assert f(answer)==current-q*divisor
        elif k=='comma': assert answer==built+',';built+=','
        elif k=='bring':
            last_digit=p['digits'][a['sourceIndex']];assert f(answer)==last_digit
            if a['appended']: assert last_digit==0 and a['sourceIndex']>=p['originalLength']
        elif k=='partial': current=rem*10+last_digit;assert f(answer)==current
        elif k=='answer': assert f(answer)==quotient
        elif k=='final-remainder': assert f(answer)==remainder
        elif k=='verify': assert f(answer)==original_a
        else: raise AssertionError(k)
    assert f(built)==quotient
print(f'{len(plans)} tasks and {actions} displayed action answers independently checked with Fraction/divmod: PASS')

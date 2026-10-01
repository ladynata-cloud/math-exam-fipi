"""Independent answer oracle: parse displayed questions, calculate with Fraction."""
import json, re, subprocess, math
from fractions import Fraction as F
from pathlib import Path
root = Path(__file__).resolve().parents[1]
source = """const M=require('./school/math.js'),C=require('./school/curriculum.js');
console.log(JSON.stringify(C.lessons.flatMap(l=>Array.from({length:150},(_,s)=>({id:l.id,seed:s,...M.generate(l.id,s)})))));"""
rows=json.loads(subprocess.check_output(['node','-e',source],cwd=root))
def prime(n):
    return n>=2 and all(n%d for d in range(2,math.isqrt(int(n))+1))
def expected(i,n,t):
    if i=='place': return n[1]*1000
    if i in ('compare','decimalcompare','signedcompare'): return max(n)
    if i=='round': return ((int(n[0])+5)//10)*10
    if i in ('add','segment','angle'): return n[0]+n[1]
    if i in ('subtract','chart'): return n[0]-n[1] if i=='subtract' else n[1]-n[0]
    if i in ('multiply','area','decimalmul','motion','signedmul'): return n[0]*n[1]
    if i in ('divide','decimaldiv','ratio','signeddiv'): return n[0]/n[1]
    if i=='remainder': return n[0]%n[1]
    if i=='order': return n[0]+n[1]*(n[2]-n[3])
    if i=='power': return n[0]**int(n[1])
    if i=='expression': return n[0]*n[2]
    if i=='equation': return (n[2]-n[1])/n[0]
    if i=='perimeter': return 2*(n[0]+n[1])
    if i=='areaunits': return n[0]*100
    if i=='volume': return n[0]*n[1]*n[2]
    if i=='fraction': return n[1]/n[0]
    if i=='fractioncompare': return max(n[0]/n[1],n[2]/n[3])
    if i in ('fractionadd','unlike'): return n[0]/n[1]+n[2]/n[3]
    if i=='mixed': return n[0]+n[1]/n[2]
    if i in ('reduce','decimal'): return n[0]/n[1]
    if i=='common': return math.lcm(int(n[1]),int(n[3]))
    if i=='fractionmul': return n[0]/n[1]*n[2]/n[3]
    if i=='fractiondiv': return (n[0]/n[1])/(n[2]/n[3])
    if i=='part': return n[0]*n[1]/n[2]
    if i=='whole': return n[2]*n[1]/n[0]
    if i=='decimaladd': return n[0]+n[1]
    if i=='average': return sum(n)/len(n)
    if i=='divisibility': return 'да' if n[0]%3==0 else 'нет'
    if i=='prime': return next(x for x in n if prime(x))
    if i=='gcd': return math.gcd(int(n[0]),int(n[1]))
    if i=='lcm': return math.lcm(int(n[0]),int(n[1]))
    if i=='mixedops': return n[0]+n[1]/n[2]-n[3]/n[4]
    if i=='proportion': return n[0]*n[1]/n[2]
    if i=='direct': return n[1]/n[0]*n[2]
    if i=='inverse': return n[0]*n[1]/n[2]
    if i=='scale': return n[1]*n[2]/100
    if i=='percent': return n[0]*n[1]/100
    if i=='percentwhole': return n[1]*100/n[0]
    if i=='percentchange': return n[0]*(100-n[1])/100
    if i=='signed': return n[0]+(n[1] if 'поднялась' in t else -n[1])
    if i=='absolute': return abs(n[0])
    if i=='signedsub': return n[0]-n[1]
    if i=='brackets': return n[0]*(n[1]-n[2])
    if i=='like': return n[0]+n[1]-n[2]
    if i=='coordinate': return n
    if i=='symmetry': return [-n[0],n[1]]
    if i=='circle': return n[1]*n[0]*n[0]
    if i=='triangle': return 180-n[0]-n[1]
    if i=='sets': return n[0]+n[1]-n[2]
    if i=='probability': return n[0]/(n[0]+n[1])
    if i=='units': return n[0]*100+n[1]
    if i=='numline': return (n[1]-n[0])/n[2]
    if i=='distribute': return n[0]*n[1]+n[2]*n[3]
    if i=='shapes': return 2*n[0]
    if i=='calculator': return ((int(n[0])+50)//100)*100*n[1]
    if i=='triangletypes': return 'да' if len(set(n))==1 else 'нет'
    if i=='perpendicular': return 'да' if n[0]==90 else 'нет'
    if i=='parallel': return 'да' if ('не имеют общих точек' in t or 'перпендикулярны одной и той же прямой' in t) else 'нет'
    if i=='factorization':
        assert math.prod(n[1:])==n[0] and all(prime(x) for x in n[1:])
        return len(n)-1
    if i=='piechart': return n[0]*360/100
    raise AssertionError('No reference oracle: '+i)
for r in rows:
    n=[F(x.replace(',','.')) for x in re.findall(r'-?\d+(?:[.,]\d+)?',r['prompt'].replace('−','-'))]
    exp=expected(r['id'],n,r['prompt'])
    actual=r['answer']
    if isinstance(actual,dict): actual=F(actual['n'],actual['d'])
    if isinstance(actual,list): actual=[F(x) for x in actual]
    assert actual==exp, (r['id'],r['seed'],r['prompt'],actual,exp)
print(f'{len(rows)} displayed tasks, {len(set(r["id"] for r in rows))} skills: independent Fraction oracle passed')

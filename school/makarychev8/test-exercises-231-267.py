"""Independent source/formula checks, printed pp. 58–63, Makarychev 2024."""
import json, re, subprocess
from collections import Counter
from fractions import Fraction
from pathlib import Path
import sympy as S
from sympy.parsing.sympy_parser import parse_expr,standard_transformations,implicit_multiplication_application,rationalize

basedir=Path(__file__).parent
rows=[q for group in json.loads((basedir/'exercises-231-267.json').read_text())['topics'].values() for q in group]
cards={q['title'][2:]:q for q in rows}
counts=[4,2,2,1,6,1,2,4,4,4,4,2,2,1,1,1,4,2,1,1,1,4,2,1,1,1,1,4,7,8,2,6,2,2,3,3,3]
assert Counter(int(ref[:3]) for ref in cards)==dict(zip(range(231,268),counts))
assert len(cards)==100 and sum(len(t['steps']) for t in cards.values())==200
for ref,q in cards.items():
    n=int(ref[:3]);assert q['source']['page']==next(pg for limit,pg in [(234,58),(242,59),(248,60),(255,61),(263,62),(267,63)] if n<=limit)
    assert q['source']['paragraph']==(2 if n<=242 else 3)
names={v:S.Symbol(v,real=True) for v in 'abcmnpqrtxyz'}
globals().update(names)
def read(s):
    return parse_expr(s.replace('^','**').replace('−','-'),local_dict=names,transformations=standard_transformations+(implicit_multiplication_application,rationalize))
def graph_formula(node):
    if not isinstance(node,list):return names[node] if node in names else S.Rational(node)
    opt=node[0];left=graph_formula(node[1])
    if opt=='abs':return abs(left)
    if opt=='neg':return -left
    right=graph_formula(node[2])
    return {'+':lambda:left+right,'-':lambda:left-right,'*':lambda:left*right,'/':lambda:left/right,'^':lambda:left**right,'=':lambda:left-right}[opt]()
def same(a,b):
    assert S.factor(S.together(a-b))==0,(a,b)
def expr(ref):return graph_formula(cards[ref]['mathExpression'])
for ref,q in cards.items():
    if q.get('mathExpression') and q['kind'] in ('text','separated-rational') and ref!='256':
        same(expr(ref),read(q['answer']))

# Separate transcription of simplified answers and of easily misread printed coefficients.
finals={
 '231а':'(5*x+3*y)/4','231б':'(n*n-1)/n','231в':'(a*a-b*c)/(a+b+c)','231г':'a*b*(a-b)/(a+b)',
 '232а':'2*n*(m*m-1)/(m*m-n*n)','232б':'(a*a+x*x)/(a*a-x*x)',
 '233а':'4/(2*y+1)','233б':'(16*a*a-19.2*a+5.12)/((2.5*a*a-0.64)*(6*a-3.2))',
 '235а':'(2*y+30)/(y*y-9)','235б':'-8/(2*a-3)','235в':'(2*m+1)/(6*(2*m-1))','235г':'4*y*y/(x*x-y*y)^2','235д':'(2*a*a+6*a+1)/(a^3-1)','235е':'2*(x-y)/(x*x+x*y+y*y)',
 '237а':'1/(a*b*c)','237б':'1','243а':'(a+b)^2/(a-b)^2','243б':'(x-b)^2/(x+b)^2','247а':'a*b/(a-b)','247б':'-x*y','247в':'a/(2*a-b)^2','247г':'(c+2)^2/(c-2)^2','248а':'x*x-y*y','248б':'-a',
 '252а':'(x-z)/(y-z)','252б':'(a+x)*(a*a-a*x+x*x)/((a-x)*(a*a+a*x+x*x))','252в':'(x+1)/(2*x+1)','252г':'x+1'}
for ref,answer in finals.items():same(expr(ref),read(answer))
for ref,ans in [('234',0),('236',0),('244',-1),('245',2*a),('246',(2-x)/2),('249',0),('250',0),('251',6)]:
    same(expr(ref),ans)
same(expr('256').subs(z,2*a*b/(a+b)),0)
same(expr('246')+(x*x-5*x+3)/(2*x),(-3*x*x+3)/(2*x*(x+1)))
same(read(cards['246']['steps'][0]['answer']),-3*x*x+3)
assert S.simplify(expr('246').subs(x,2+S.Symbol('u',positive=True))).is_negative
for letter in 'абвг':
    for ex,expected in [('238',[('x','6/(x-3)'),('y','-8/(y+5)'),('a+1','-4/(a+6)'),('3*b-1','-4/(b-3)')]),('240',[('5','-10/(x+2)'),('-2','-2/(x-1)'),('-2','10/(5-x)'),('-1','-1/(2-x)')])]:
        ref=ex+letter;quot,rem=expected['абвг'.index(letter)]
        same(read(cards[ref]['steps'][0]['answer']),read(quot));same(expr(ref),read(quot)+read(rem))
for letter,const in zip('абвг',[-6,5,6,7]):
    ref='239'+letter;same(expr(ref).subs(a,const),0);assert int(cards[ref]['answer'])==const
for letter in 'абвг':
    ref='241'+letter;domain={j for j in range(-60,61) if expr(ref).subs(n,j).is_integer is True}
    assert set(map(int,cards[ref]['answer'].split(';')))==domain
for letter,coeff in [('а',(2,3)),('б',(8,3))]:
    ref='242'+letter;same(expr(ref).subs({a:coeff[0],b:coeff[1]}),0);assert cards[ref]['answer']==';'.join(map(str,coeff))
assert cards['253а']['answer']=='-2;0;2' and cards['253б']['answer']=='0;1'
assert Fraction(cards['254']['answer'])*(Fraction(1,8)+Fraction(1,9)+Fraction(1,12))==3
assert Fraction(cards['255']['answer'])*(Fraction(240,60)+Fraction(240,80))==480
assert Fraction(cards['257']['answer'])==-9*18
coords258=[(40,'0.025'),('0.03125',32),('0.016','6.25'),('0.125','0.8')]
coords259=[(1,24),('-0.2',-120),(-2,12),(-10,'-2.4'),(5,'-1.2'),('-2.5','-0.6')]
for num,points,kk in [(258,coords258,1),(259,coords259,24)]:
    for letter,(xx,yy) in zip('абвгде',points):
        assert cards[str(num)+letter]['answer']==('Да' if Fraction(xx)*Fraction(yy)==kk else 'Нет')
for l,k0,exc in [('а',9,{0}),('б',-6,{0,3}),('в',-2,{0}),('г',3,{0,-5})]:
    q=cards['260'+l+', область'];assert set(map(int,q['answer'].split(';')))==exc;same(expr('260'+l+', построение'),k0/x)
assert set(map(Fraction,cards['261, уровни']['answer'].split(';')))=={Fraction(-4),Fraction(-7,2)}

# Check the plotted curves away from the construction points. Validate removable
# holes and both one-sided limits, including the two different ends of a jump.
fixtures=[]
for ref,q in cards.items():
    if q.get('graph',{}).get('type')!='curve-build':continue
    curve=q['graph']['curves'][0];formula=expr(ref)
    values=[S.simplify(formula.subs(x,xx)) for xx in curve['xs']]
    assert list(map(S.Rational,q['answer'].split(';')))==values
    for xx,yy in curve.get('holes',[]):
        limits={S.limit(formula,x,xx,dir=d) for d in ('-','+')}
        assert S.Rational(str(yy)) in limits or any(abs(float(limit)-yy)<1e-11 for limit in limits)
    for v in [S.Rational(i,2) for i in range(-16,23)]:
        y0=formula.subs(x,v);hole=any(v==h[0] for h in curve.get('holes',[]))
        if not hole and y0.is_finite is not True:continue
        fixtures.append({'curve':curve,'x':float(v),'y':None if hole else float(y0)})
js="""const G=require('./task-graphs.js');for(const c of JSON.parse(require('fs').readFileSync(0,'utf8'))){const y=G.curveValue(c.curve,c.x);if(c.y===null?!Number.isNaN(y):!Number.isFinite(y)||Math.abs(y-c.y)>1e-10)throw Error(JSON.stringify(c));}"""
subprocess.run(['node','-e',js],cwd=basedir,input=json.dumps(fixtures),text=True,check=True)
assert len([q for q in rows if q.get('graph',{}).get('type')=='curve-build'])==15
for l,xx,yy in [('а',2,1),('б',-2,3),('в',-1,1)]:
    k0,b0=map(int,cards['265'+l]['answer'].split(';'));assert k0==xx*yy and yy==k0*xx+b0
for ref in ['266а','266б','267а','267в']:
    g=cards[ref]['graph'];sol=S.solveset(g['line'][0]*x*x+g['line'][1]*x-g['k'],x,domain=S.Reals);assert sol==S.FiniteSet(*[pt[0] for pt in g['points']])
    assert all(xx*yy==g['k'] and yy==g['line'][0]*xx+g['line'][1] for xx,yy in g['points'])
print('PASS all 37 original numbers, 100 cards / 200 steps, identities, exclusions, work/rate, 15 complete constructions,',len(fixtures),'independent graph samples')

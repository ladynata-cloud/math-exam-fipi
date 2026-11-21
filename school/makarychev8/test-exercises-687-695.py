"""Independently reconstruct both rows, graph meanings and every factorization from pp. 161–163."""
import json
from pathlib import Path
import sympy as S
from sympy.parsing.sympy_parser import parse_expr,standard_transformations,implicit_multiplication_application,convert_xor
p=Path(__file__).resolve().parent
old=next(l['tasks'][:2] for l in json.loads((p/'ch3.json').read_text()) if l['id']=='p29')
q={t['source']['reference'][2:]:t for t in [*old,*json.loads((p/'exercises-687-695.json').read_text())]}
assert len(q)==26
for name,t in q.items():assert t['source']['page']==(161 if int(name[:3])<=688 else 162 if int(name[:3])<=692 else 163)
def count(rows):
    m=S.Matrix(rows);r=m[:,:2].rank()
    return 0 if r<m.rank() else 1 if r==2 else 2
def independent(ref,rows):
    expected=['Нет решений','Одно решение','Бесконечно много решений'][count(rows)]
    assert q[ref]['answer']==expected,ref
    if 'systemLines' in q[ref]:
        assert q[ref]['systemLines']==q[ref]['graph']['lines']==rows and q[ref]['graph']['distinguish']
for ref,rows in {'687а':[[2,-6,10],[2,8,7]],'687б':[[3,-8,12],[S.Rational(3,2),-4,6]],
'687в':[[-4,1,0],[1,6,8]],'687г':[[1,1,5],[3,-2,8]],'687д':[[4,3,3],[-8,-6,-6]],
'687е':[[1,4,5],[1,-1,-3]],'688а':[[7,1,8],[1,-1,-3]],'688б':[[-4,6,7],[8,-12,-14]],
'688в':[[1,-2,6],[4,1,0]],'689а':[[3,-1,5],[3,2,8]],'689б':[[-1,2,4],[-2,1,0]],'689в':[[-1,2,4],[-1,2,-8]]}.items():independent(ref,rows)
base=[1,2,5];others=[[1,1,5],[-4,S.Rational(1,4),0],[3,6,10],[1,0,3],[2,4,10],[2,4,9],[3,6,15],[S.Rational(1,4),S.Rational(1,2),S.Rational(24,5)]]
for group,ct in enumerate([1,0,2],start=1):
    assert {int(a) for a in q['690, группа '+str(group)]['answer'].split(';')}=={i for i,l in enumerate(others,start=1)if count([base,l])==ct}
assert all(a*2-b==c for a,b,c in q['691']['graph']['lines'])
assert q['691']['graph']['fixedPoints']==[[2,-1]]
X=S.symbols('x',real=True)
for ct in (0,1,2):
    t=q['692, решений '+str(ct)];k,b=map(S.Rational,t['answer'].split(';'));assert b==3*k and k!=0
    assert len(S.solveset(k*X+b-S.Abs(X),X,domain=S.Reals))==ct
assert S.solve(X/80-X/90-1,X)==[int(q['693']['answer'])]
snail=q['694'];curve=snail['graph']['curves'][0]
assert curve['domain']==[0,30] and [S.Rational(v)for v in snail['answer'].split(';')]==[S.Rational(1,4)*x for x in curve['xs']]
a,b,m,n,x=S.symbols('a b m n x')
for ref,p0 in [('695а',16*m*m-25*n**4),('695б',S.Rational(9,100)*a**4-9*b*b),('695в',(2*a+3)**2-4),('695г',36-(1-5*x)**2)]:
    got=parse_expr(q[ref]['answer'],transformations=standard_transformations+(implicit_multiplication_application,convert_xor))
    assert S.expand(S.nsimplify(got,rational=True)-p0)==0,ref
print('PASS 26 source cards including eight classified lines, three modulus cases, figure 30, the observed segment and four factorizations')

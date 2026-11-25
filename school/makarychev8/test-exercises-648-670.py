"""Reconstruct time, concentration and work equations from printed pp. 152–155."""
import json
from pathlib import Path
import sympy as S

base=Path(__file__).resolve().parent
new=json.loads((base/'exercises-648-670.json').read_text())
legacy=next(topic['tasks'][:2] for topic in json.loads((base/'ch3.json').read_text()) if topic['id']=='p27')
cards={t['source']['reference'].removeprefix('№ '):t for t in [*new,*legacy]}
assert len(cards)==28
for n in range(648,671):
    refs=[k for k in cards if k.startswith(str(n))]
    assert refs and all(cards[k]['source']['page']==(152 if n<650 else 153 if n<=658 else 154 if n<=667 else 155) for k in refs),n
    assert len(refs)==(2 if n in (667,668,670) else 1)
x=S.symbols('x',real=True)
Q=S.Rational
def entries(raw):
    return [Q(q) for q in str(raw).replace(',','.').split(';')]

# Independently construct the two quantities, their relation and the requested answer.
spec={
651:(560/x,560/(x+10),'difference',1,[80,70]),652:(720/x,720/(x+10),'difference',1,[80]),
653:(192/x,192/(x+2),'difference',Q(2,5),[30]),654:(240/x,240/(x-5),'increase',4,[20]),
655:(110000/x,110000/(x-20),'increase',50,[220]),656:(175/x,175/(x-2),'increase',10,[7]),
657:(14400/x,14400/(x-3),'increase',400,[12]),658:(6/(x-2),15/x,'increase',1,[5,6]),
659:(35/(15+x),25/(15-x),'difference',0,[Q(5,2)]),660:(36/(20-x),22/(20+x),'sum',3,[2]),
661:(3000/x,3000/(x+100),'difference',1,[500]),662:(4000/(x+40),9000/(x+90),'increase',20,[60]),
663:(1/(x+5),1/x,'sum',Q(1,6),[15,10]),664:(1/x,1/(x-2),'sum',Q(12,35),[7]),
665:(1/x,1/(x+5),'sum',Q(2,12),[10]),666:(1/x,1/(x-20),'sum',Q(2)/Q('37.5'),[50])}
for n,(first,second,op,rhs,answer) in spec.items():
    t=cards[str(n)]
    assert entries(t['answer'])==answer,n
    graph=t['graph'];rows=graph['rows']
    for row,original in zip(rows,(first,second)):
        assert S.cancel(row['total']/(row['slope']*x+row['offset'])-original)==0,n
    expr={'difference':first-second,'sum':first+second,'increase':second-first}[op]-rhs
    roots=set(S.solveset(expr,x,domain=S.Reals))
    assert set(entries(t['steps'][1]['answer']))==roots,n
    valid={r for r in roots if (r>=graph['min'] if graph.get('inclusiveMin') else r>graph['min'])
           and (r<graph['max'] if 'max' in graph else True) and (r.is_integer if graph.get('integer') else True)}
    assert valid==(set(answer) if graph.get('all') else {answer[graph.get('answerIndex',0)]}),n
assert S.solveset((x+7)/(x+8)-x/(x+3)-Q(1,2),x,domain=S.Naturals)=={2}
assert entries(cards['648']['answer'])==[Q(2,5)]
for n,total,extra,time in [(649,120,20,1),(650,20,2,Q(1,3))]:
    slower,faster=sorted(entries(cards[str(n)]['answer']))
    assert faster-slower==extra and total/slower-total/faster==time
rt=S.sqrt
for ref,expr in [('667а',1/(11+2*rt(30))+1/(11-2*rt(30))),
                 ('667б',(rt(5)+2)/(rt(5)-2)+(rt(5)-2)/(rt(5)+2))]:
    assert S.simplify(expr)==Q(cards[ref]['mathExpression'][-1])==Q(cards[ref]['steps'][1]['answer'])
a,b=5+2*rt(6),5-2*rt(6)
assert S.simplify(a*b/(a+b))==entries(cards['668а']['answer'])[0]
a,b=rt(11)+rt(3),rt(11)-rt(3)
assert S.simplify((a*a+b*b)/(a*b))==entries(cards['668б']['answer'])[0]
assert S.solve(x*x-10*x+entries(cards['669']['answer'])[0],x)==[2,8]
for ref,(a,b) in [('670а',((rt(3)-1)/2,(rt(3)+1)/2)),('670б',(2-rt(3),1/(2-rt(3))))]:
    linear,free=[S.sympify(term.replace('√3','sqrt(3)')) for term in cards[ref]['ratios']]
    for root in (a,b): assert S.simplify(root*root+linear*root+free)==0
control=cards['§ 9, контрольный вопрос 2']
assert S.solveset(6/(x*x-1)-1-2/(x-1)+3/(x+1),x,domain=S.Reals)=={Q(control['answer'])}
assert cards['§ 9, контрольный вопрос 1']['graph']['type']=='two-equations'
print('PASS printed pp. 152–155: all parts of 648–670, exact physical roots, both control questions.')

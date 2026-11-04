"""Independent exact arithmetic audit of the authored question sequence.

No production calculation, existing oracle, answer or ledger value is used to
calculate expected results. Inputs are independently reviewed statement data.
Expected steps below were transcribed from each question's requested quantity.
"""
from fractions import Fraction as F
from math import floor, ceil
from pathlib import Path
import argparse
import json
import subprocess

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--report',type=Path,help='Optional exact-step JSON evidence output')
args=parser.parse_args()
ROOT=Path(__file__).resolve().parents[1]
data_path=ROOT/'ege-profil/start/finance-data.js'
lessons=json.loads(subprocess.check_output(
    ['node','-e','process.stdout.write(JSON.stringify(require(process.argv[1])))',str(data_path)],
    text=True,cwd=ROOT))
def f(x): return F(str(x))
def rate(m):
    for k in ('annual_rate_percent','rate_percent_per_period','rate_percent'):
        if k in m: return f(m[k])/100
    return F(0)
def rational_root(x,n):
    def root_int(k):
        lo,hi=0,k+1
        while hi-lo>1:
            mid=(lo+hi)//2
            if mid**n<=k: lo=mid
            else: hi=mid
        assert lo**n==k
        return lo
    return F(root_int(x.numerator),root_int(x.denominator))
def steps_for(t):
    sid=str(t['meta']['sourceId']);m=t['meta']['parameters'];r=rate(m);q=1+r
    if sid=='630197':
        S=f(m['principal_thousand']);P=f(m['first_two_payments_thousand']);d1=S*q;d2=d1-P;d3=d2*q;d4=d3-P
        return [d1,d2,d3,d4,d4*q]
    if sid=='630129':
        S=f(m['principal_rub'])/1000;P1,P2=[f(x)/1000 for x in m['first_two_payments_rub']];d1=S*q;d2=d1-P1;d3=d2*q-P2;L=d3*q;T=P1+P2+L
        return [q,d1,d2,d3,L,T,T*1000]
    if sid=='630219':
        P1,P2=[f(x)/1000 for x in m['first_two_payments_rub']];L=f(m['last_payment_rub'])/1000;d2=L/q;d1=(d2+P2)/q;S=(d1+P1)/q
        return [q,d2,d1,S]
    if sid=='704682':
        S=f(m['initial_million']);A=f(m['additions_years_2_3_million']);v1=S*q;v2=v1+A;v3=v2*q;v4=v3+A
        return [v1,v2,v3,v4,v4*q]
    if sid=='704683':
        S=f(m['initial_thousand']);W=f(m['withdrawals_years_2_3_4_thousand']);v1=S*q;v2=v1-W;v3=v2*q;v4=v3-W;v5=v4*q;v6=(v5-W)*q
        return [v1,v2,v3,v4,v5,v6,v6*1000]
    if sid=='704684':
        T=f(m['final_thousand']);A=f(m['additions_years_2_3_thousand']);v1=T/q;v2=v1-A;v3=v2/q;v4=v3-A
        return [v1,v2,v3,v4,v4/q]
    if sid=='517569':
        S=f(m['principal_rub'])/1000000;T=f(m['total_payments_rub'])/1000000;I=T-S;first=S*r;extended=I/(first/2)
        return [I,first,first/2,extended,extended-1]
    if sid in ('526293','517568','624083'):
        S=f(m['principal_rub']);L=f(m['minimum_payment_rub']);n=S*q/L;C=S/n;I=(S*r+C*r)*n/2;T=S+I
        return [q,n,C,S*r,C*r,I,T/(1000000 if sid=='526293' else 1)]
    if sid=='517480':
        S=f(m['principal_million']);P=f(m['max_payment_million']);C=P-S*r;n=S/C;I=(S*r+C*r)*n/2
        return [S*r,C,n,C*r,I,S+I]
    if sid=='517203':
        S=f(m['principal_million']);n=f(m['years']);L=f(m['min_last_payment_million']);C=S/n;growth=L/C
        return [C,growth,(growth-1)*100]
    if sid=='701456':
        a=1-f(m['decrease_percent_of_previous'])/100;b=1+a+a*a;c=r*b;k=1+c;T=f(m['total_payments_rub'])/1000
        return [a,a*a,b,c,k,T/k]
    if sid in ('525414','526017'):
        b=sum(f(x) for x in m['balance_coefficients_exact'][:-1]);i=b*r;k=1+i;limit=f(m['limit']);bound=limit/k
        return [b,i,k,bound,F(ceil(bound)-1)]
    if sid in ('525142','548818'):
        cs=[f(x) for x in m['balance_coefficients_exact']];ps=[a*q-b for a,b in zip(cs,cs[1:])];mx=max(ps);bound=f(m['limit'])/mx
        n=ceil(bound)-1 if m['constraint']=='each_lt' else floor(bound)
        return ps+[mx,bound,F(n)]
    if sid=='643163':
        b=1+sum(f(x) for x in m['after_fractions_of_initial'][:-1]);i=b*r;k=1+i;bound=f(m['total_strictly_greater_than_millions'])/k;n=F(floor(bound)+1)
        return [b,i,k,bound,(n-1)*k,n*k,n]
    if sid=='517503':
        S=f(m['principal_rub']);raw=S*q*q;k=q+1;P=raw/k
        return [q,raw,k,P,2*P]
    if sid=='704627':
        S=f(m['principal_rubles']);raw=S*q**3;k=q*q+q+1;P=raw/k
        return [q,raw,k,P,3*P]
    if sid=='660699':
        S=f(m['principal_rub']);raw=S*q**3;k=q*q+q+1;P=raw/k
        return [q,q*q,k,raw,P,3*P]
    if sid=='672873':
        P=f(m['first_two_payments_thousand']);L=f(m['last_payment_thousand']);d1=L/q;d2=d1+P;d3=d2/q;d4=d3+P
        return [d1,d2,d3,d4,d4/q]
    if sid in ('630122','697032'):
        S=f(m['principal_thousand']);L=f(m['last_payment_thousand']);raw=S*q**3;k=q*q+q;diff=raw-L;P=diff/k
        return [raw,k,diff,P,P*1000 if sid=='630122' else P*2+L]
    if sid=='704685':
        growth=f(m['final_thousand'])/f(m['initial_thousand']);annual=rational_root(growth,int(m['years']))
        return [growth,annual,(annual-1)*100]
    if sid=='704686':
        S=f(m['initial_rubles']);fixed=1+f(m['fixed_rate_percent'])/100;v=[S*fixed**i for i in range(1,4)];variable=S
        for p in m['variable_rates_percent']:
            variable*=1+f(p)/100;v.append(variable)
        return v+[F(1 if v[2]>v[5] else 2),abs(v[2]-v[5])]
    if sid=='517574':
        S=f(m['principal_rub'])/1000;A,B=[f(x)/1000 for x in m['payments_rub']];D=A*A+4*S*B;root=rational_root(D,2);annual=(A+root)/(2*S)
        return [D,root,annual,(annual-1)*100]
    if sid=='628752':
        P=f(m['equal_payment_rub'])/1000000;v1=P/q;v2=(v1+P)/q;S=(v2+P)/q
        return [q,v1,v2,S,S*1000000]
    if sid=='707183':
        O=f(m['overpayment_rub']);k=q*q+q+1;c=3*q**3-k;rhs=k*O
        return [q,k,q**3,c,rhs,rhs/c]
    if sid=='fipi-four-equal-total-to-principal':
        n=int(m['years']);P=f(m['total_rub'])/n;d=F(0);vs=[]
        for _ in range(n):d=(d+P)/q;vs.append(d)
        return [P,q]+vs
    if sid=='630110':
        S=f(m['principal_rub'])/1000000;first=S*r;k=q+1;P=S*q*q/k
        return [first,S,q,k,P,P-first]
    if sid=='fipi-balloon-total':
        S=f(m['principal_thousand']);M=f(m['balance_after_regular_thousand']);k=int(m['regular_months']);r=f(m['rate_percent_per_month'])/100;C=(S-M)/k;last=M+C;totalbases=(S+last)*k/2+M;I=totalbases*r;T=S+I
        return [C,last,totalbases-M,totalbases,I,T,T*1000]
    if sid=='561179':
        S=f(m['principal_rub']);old=1+f(m['original_rate_percent'])/100;new=1+f(m['new_second_period_rate_percent'])/100;k=old+1;P=S*old**2/k;d=S*old-P;newpay=d*new
        return [old,k,P,d,newpay,P-newpay]
    if sid=='513106':
        a=[f(x) for x in m['after_fractions_of_initial']];b=1+sum(a[:-1]);I=b*r
        return [a[0],a[-2],r,b,I,I*100]
    if sid=='fipi-first-months-rate':
        S=f(m['principal_thousand']);n=int(m['months']);a=int(m['window_start']);b=int(m['window_end']);C=S/n;last=S-(b-1)*C;bases=sum(S-(i-1)*C for i in range(a,b+1));principal=(b-a+1)*C;I=f(m['window_total_thousand'])-principal
        return [C,last,bases,principal,I,I/bases*100]
    if sid=='fipi-late-year-principal':
        n=int(m['months']);a=int(m['window_start']);b=int(m['window_end']);N=F(b-a+1);principal=N/n;first=F(n-a+1,n);bases=sum(F(n-i+1,n) for i in range(a,b+1));k=principal+r*bases
        return [N,principal,first,bases,k,f(m['window_total_million'])/k]
    if sid=='fipi-two-stage-principal':
        a=int(m['split_after']);b=int(m['years'])-a;M=f(m['midpoint_thousand']);alpha=F(a+1,2);second=M*F(b+1,2);const=M*F(a-1,2)+second;ic=const*r;k=1+alpha*r;S=(f(m['total_thousand'])-ic)/k
        return [alpha,second,const,ic,k,S]
    if sid=='fipi-two-stage-rate':
        a=int(m['split_after']);b=int(m['years'])-a;S=f(m['principal_thousand']);M=f(m['midpoint_thousand']);C=(S-M)/a;first=(S+M+C)*a/2;second=M*F(b+1,2);I=f(m['total_thousand'])-S
        return [C,first,second,I,I/(first+second)*100]
    if sid=='fipi-two-stage-midpoint':
        a=int(m['split_after']);b=int(m['years'])-a;S=f(m['principal_thousand']);constant=S*F(a+1,2);alpha=F(a-1,2);beta=F(b+1,2);I=f(m['total_thousand'])-S;bases=I/r;M=(bases-constant)/(alpha+beta)
        return [constant,alpha,beta,I,bases,M,M*1000]
    raise ValueError(sid)

results=[];steps=0
for l in lessons:
    for t in l['tasks']:
        expected=steps_for(t)
        actual=[f(s['answerExact']) for s in t['steps']]
        assert len(expected)==len(actual),(t['id'],len(expected),len(actual))
        for idx,(e,a) in enumerate(zip(expected,actual),1):
            assert e==a,(t['id'],idx,str(e),str(a))
            steps+=1
        assert expected[-1]==f(t['answerExact']),(t['id'],'final')
        d=expected[-1].denominator
        for p in (2,5):
            while d%p==0:d//=p
        assert d==1,(t['id'],'nonterminating final')
        results.append({'task':t['id'],'source':str(t['meta']['sourceId']),'steps':len(expected),'final_exact':str(expected[-1]),'unit':t['unit'],'result':'PASS'})
summary={'gate':'INDEPENDENT_FINANCE_STEPS_OK','lessons':len(lessons),'tasks':len(results),'models':len(set(r['source'] for r in results)),'exact_steps':steps,'failed':0,'checks':results,'scope':'Recomputed all question-specific intermediate and final answers from independently reviewed statement parameters, with Fraction arithmetic and no production or test-oracle calculation.'}
assert (summary['lessons'],summary['tasks'],summary['models'],summary['exact_steps'])==(13,78,39,442), 'Complete authored finance coverage'
if args.report:
    args.report.parent.mkdir(parents=True,exist_ok=True)
    args.report.write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in summary.items() if k!='checks'},ensure_ascii=False,indent=2))

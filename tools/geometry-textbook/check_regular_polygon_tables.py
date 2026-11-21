"""Independently reconstruct all forty missing cells from each drawn polygon's circumradius and vertices."""
import json
from math import cos, hypot, isclose, pi, sin, sqrt
from regular_polygon_tables import OUT


def near(x,y):return isclose(x,y,abs_tol=.00015,rel_tol=1e-7)
def diff(a,b):return a[0]-b[0],a[1]-b[1]
def dist(a,b):return hypot(*diff(a,b))
def dot(a,b):return a[0]*b[0]+a[1]*b[1]
def det(a,b):return a[0]*b[1]-a[1]*b[0]


cards=json.loads(OUT.read_bytes())['lessons']
tasks=[(116,None)]+[(n,i) for n in (1176,1177) for i in range(5)]
# The single supplied column, the printed value and the resulting squared side in each row.
givens={1176:[('a',6,36),('r',2,16),('R',4,32),('P',28,49),('S',16,16)],
        1177:[('R',3,27),('S',10,40/sqrt(3)),('r',2,48),('a',5,25),('P',6,4)]}
canonical={1176:['3√2;3;24;36','2√2;4;16;16','2√2;4√2;16√2;32','7√2/2;7/2;7;49','2√2;2;4;16'],
           1177:['3/2;3√3;9√3;27√3/4','2√(10√3)/3;√(10√3)/3;2√(10√3/3);2√(30√3)','4;4√3;12√3;12√3','5√3/3;5√3/6;15;25√3/4','2√3/3;√3/3;2;√3']}
total=0
for e,(number,row) in zip(cards,tasks,strict=True):
    pg=[297,298] if row is None else [300 if number==1176 else 301];source=e['source']
    assert source['chapter']=='XIII' and source['printedPages']==pg and source['pdfPages']==[n+1 for n in pg]
    assert e['id']==f'atanasyan-7-9-{"theory" if row is None else "main"}-{number}-part-{1 if row is None else row+1}'
    if row is not None:
        assert source['subpart']==f'строка {row+1}' and e['title'].endswith(source['subpart'])
        assert e['answer']['accepted'][0]==canonical[number][row] and e['answer']['mode']=='exact'
    if number==1177 and row==3:
        assert '5√3/2' in e['answer']['feedback'] and 'с. 401' in str(e['steps']) and not any(v.startswith('5√3/2;') for v in e['answer']['accepted'])
    model=e['visualization']['model'];raw=model['points']
    for key,view in model['views'].items():
        k=2 if key in ('case-3','step-3') else 1 if key in ('case-2','step-2') else 0
        n=[4,3,6][k] if row is None else 4 if number==1176 else 3
        names=['A','B']+list('CDFG')[:n-2];suf='__v'+view['points'][0].split('__v')[1];o=raw['O'+suf];scale=raw['_unitX'+suf][0]-o[0]
        def c(ref):return tuple((raw[ref][i]-o[i])/scale for i in (0,1))
        p={name:c(ref) for ref in view['points'] for name in model['labels'][ref].split('=')};total+=1
        assert near(dist(p['U'],p['W']),1)
        sides=[dist(p[names[i]],p[names[(i+1)%n]]) for i in range(n)]
        assert all(near(x,sides[0]) for x in sides)
        area=abs(sum(det(p[names[i]],p[names[(i+1)%n]]) for i in range(n)))/2
        outer,inner=view['circles'];T=p['T'];R=dist(c(outer['center']),c(outer['through']));r=dist(c(inner['center']),c(inner['through']))
        for i in range(n):
            a=p[names[i]];b=p[names[(i+1)%n]]
            assert near(dist(a,T),R) and near(abs(det(diff(b,a),diff(T,a)))/sides[i],r)
        assert near(area,sum(sides)*r/2) and near(dot(diff(T,p['H']),diff(p['A'],p['H'])),0)
        assert near(dist(p['H'],p['A']),dist(p['H'],p['B'])) and len(view['rightAngles'])==1
        assert near(R*R,r*r+(sides[0]/2)**2)
        if row is None:
            assert near(R,4) and near(sides[0],2*R*sin(pi/n)) and near(r,R*cos(pi/n))
            continue
        known,value,side_squared=givens[number][row];factor=2 if k==2 else 1
        measured={'R':R,'r':r,'a':sides[0],'P':sum(sides),'S':area}
        assert near(measured[known],value*(factor**2 if known=='S' else factor))
        assert near(sides[0]**2,side_squared*factor**2)
        if k==0:
            forms=[f for f in e['answer']['accepted'] if '√' not in f];vals=[v for name,v in measured.items() if name!=known]
            assert forms
            for f in forms:
                parsed=[float(x.replace(',','.')) for x in f.split(';')]
                assert len(parsed)==4 and all(abs(x-y)<.005001 for x,y in zip(parsed,vals,strict=True))
print(f'REGULAR_POLYGON_TABLES_OK {len(cards)} source entries, all 40 original missing cells checked, {total} measured two-circle figures.')

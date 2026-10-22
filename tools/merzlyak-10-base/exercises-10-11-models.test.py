"""Author-side geometric invariants; not independent pedagogical/release review."""
import json,math,itertools
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'stereo-course/merzlyak-10-base/lessons'
Q=math.sqrt
sub=lambda a,b:[x-y for x,y in zip(a,b)]
dot=lambda a,b:sum(x*y for x,y in zip(a,b))
norm=lambda v:Q(dot(v,v))
cross=lambda a,b:[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def near(a,b=0):assert abs(a-b)<1e-7,(a,b)
def v(a,b):return sub(p[b],p[a])
def d(a,b):return norm(v(a,b))
def perp(a,b,c,d):near(dot(v(a,b),v(c,d)))
def par(a,b,c,d):near(norm(cross(v(a,b),v(c,d))))
def angle(a,o,b):return math.degrees(math.acos(max(-1,min(1,dot(v(o,a),v(o,b))/(d(o,a)*d(o,b))))))
def area(a,b,c):return norm(cross(v(a,b),v(a,c)))/2

def mid(m,a,b):
 for i in range(3):near(p[m][i],(p[a][i]+p[b][i])/2)
def line_dist(x,a,b):return norm(cross(v(a,x),v(a,b)))/d(a,b)
def normal(a,b,c):return cross(v(a,b),v(a,c))
def normal_line(a,b,c,e,f):perp(a,b,c,e);perp(a,b,c,f)
def regular(names):
 edges=[d(a,b) for a,b in itertools.combinations(names,2)]
 for x in edges:near(x,edges[0])
def polygon_sides(names):return [d(names[i],names[(i+1)%len(names)]) for i in range(len(names))]
def incenter(names,r,h,dist):
 near(d('M','O'),h)
 for i in range(len(names)):
  a,b=names[i],names[(i+1)%len(names)];t=f'T{i+1}'
  near(d('O',t),r);near(d('M',t),dist);perp('O',t,a,b);perp('M',t,a,b)
  near(norm(cross(v(a,t),v(a,b))))
  ratio=dot(v(a,t),v(a,b))/d(a,b)**2
  assert -.00001<=ratio<=1.00001,(a,b,ratio)

files=[D/f'ex-{g:02}-{n:03}.json' for g,limit in [(10,41),(11,30)] for n in range(1,limit+1)]
lessons={}
for f in files:
 l=json.loads(f.read_text());lessons[l['source']['exercise']]=l;p=l['visualization']['model']['points'];m=l['visualization']['model']
 assert l['status']=='draft' and set(l['review'].values())=={'pending'}
 assert len(l['steps'])>=3
 for a,b in m['edges']+[s for vv in m['views'].values() for s in vv.get('segments',[])]:assert d(a,b)>1e-8,(f,a,b)
 for poly in m.get('faces',[])+[vv['polygon'] for vv in m['views'].values() if 'polygon'in vv]:
  nn=normal(*poly[:3]);assert norm(nn)>1e-8,(f,poly)
  for x in poly[3:]:near(dot(v(poly[0],x),nn))

def load(g,n):
 global p
 p=lessons[f'{g}.{n}']['visualization']['model']['points']

for n in [1,2,13,30,31,37]:
 load(10,n)
 for a,b,c,e,f in [('A','B','A','D','A1'),('A','D','A','B','A1'),('A','A1','A','B','D')]:normal_line(a,b,c,e,f)
 for a,b,c,e in [('A','B','D','C'),('A','B','A1','B1'),('A','D','B','C')]:par(a,b,c,e)
load(10,1);near(d('A','B'),d('A','D'));near(d('A','B'),d('A','A1'))
load(10,3);near(d('A','H'),12);near(d('A','B'),13);near(d('H','B'),5);perp('A','H','H','B')
load(10,4);near(d('A','B'),Q(7));near(d('H','B'),Q(3));near(d('A','H'),2)
load(10,5);near(d('A','B'),8);near(d('A','D'),9);near(angle('B','A','C'),45);near(d('C','D'),7)
load(10,6);near(d('B','H'),6*Q(6));near(d('M','B'),18);near(angle('M','A','H'),60);near(d('M','A'),12)
for n in [7,8]:
 load(10,n);near(d('A','B'),d('A','C'));near(d('H','B'),d('H','C'));perp('A','H','H','B');perp('A','H','H','C')
for n in [9,15]:
 load(10,n)
 for x in ['A','B','C','D']:near(d('M',x),5);near(d('O',x),4)
for n,h in [(10,4),(11,10)]:
 load(10,n);near(d('P','Q'),h);perp('P','Q','A','B');perp('P','Q','C','D');assert norm(cross(v('A','B'),v('C','D')))>0
load(10,12);par('A','B','C','D');near(d('P','Q'),7);near(p['Q'][2],3);perp('P','Q','A','B')
load(10,13);near(d('A','D'),2);perp('A','D','A','B');perp('A','D','D','D1')
load(10,14);near(d('A','B'),10);near(angle('B','A','C'),45);perp('A','C','A','D');perp('A','C','B','C');near(d('A','C'),5*Q(2))
for n in [16,17]:
 load(10,n);assert d('A','B')>d('A','C');assert d('H','B')>d('H','C')
load(10,18);near(d('A','B'),25);near(d('A','C'),17);near(d('H','B')/d('H','C'),2.5);near(d('A','H'),15)
load(10,19);near(d('D','A')+d('D','B'),28);near(d('H','A'),9);near(d('H','B'),5);near(d('D','A'),15);near(d('D','B'),13)
load(10,20);near(d('A','H'),Q(3));near(angle('A','B','H'),60);near(angle('A','C','H'),60);near(angle('B','A','C'),60);assert abs(angle('B','A','C')-90)>20
assert 'противоречие' in lessons['10.20']['statement']['goal']
load(10,21);near(angle('A','B','O'),30);near(angle('A','C','O'),30);perp('O','B','O','C');near(d('B','C'),6);near(d('A','O'),Q(6));near(d('A','B'),2*Q(6));assert '2√6' in lessons['10.21']['statement']['goal']
load(10,22);regular(['A','B','C']);near(d('A','B'),9);near(d('M','O'),3)
for x in ['A','B','C']:near(d('M',x),6)
load(10,23);near(d('A','C'),6);near(d('B','C'),8);perp('C','A','C','B');near(d('D','O'),12)
for x in ['A','B','C']:near(d('D',x),13)
load(10,24);near(d('B','C'),6);near(angle('B','A','C'),60);near(d('M','O'),4)
for x in ['A','B','C']:near(d('M',x),Q(16+6**2/(4*math.sin(math.radians(60))**2)))
load(10,25);near(d('A','B'),4*Q(5));near(d('B','C'),4*Q(5));near(d('A','C'),8);near(d('D','O'),10)
for x in ['A','B','C']:near(d('D',x),5*Q(5))
load(10,26);near(p['A'][2],0);near(p['B'][2],2);near(p['C'][2],2);near(d('A','B1'),Q(14));near(d('A','C1'),3*Q(5));near(angle('B','A','C'),45);near(d('B','C'),5)
load(10,27);perp('B','C','C','A');near(d('B','C'),20);near(d('A','C'),15);near(d('B','C1'),12);near(d('B','A1'),3*Q(41));near(p['A'][2],p['C'][2])
load(10,28)
for x in polygon_sides(['A','B','C','D']):near(x,5)
near(d('A','C'),8);near(d('B','D'),6);near(p['C'][2],3);near(d('D','C1'),4);near(d('A','C1'),Q(55));near(d('D','B1'),3*Q(3))
load(10,29);near(d('A','B'),5);near(d('B','C'),12);perp('A','B','B','C');near(d('A','C1'),2*Q(22));near(p['C'][2],9)
load(10,30);perp('A1','O1','B1','D1');perp('A1','O1','A','A1');near(d('A1','O1'),Q(2)/2)
load(10,31);perp('O','H','O','O1');perp('O','H','C','D');near(d('O','H'),.5)
load(10,32);near(d('B','C'),10);near(d('A','H'),8);perp('A','H','A','M');perp('A','H','B','C');near(area('A','B','C'),40)
load(10,33);near(d('A','B'),6);near(area('A','B','C')+area('A','C','D'),72);near(d('B','H'),12);perp('B','H','B','M');perp('B','H','C','D')
load(10,34);near(angle('M','A','H'),30);near(angle('M','B','H'),45);perp('A','H','B','H');near(math.cos(math.radians(angle('A','M','B'))),Q(2)/4)
load(10,35);near(angle('A','B','O'),45);near(angle('A','C','O'),45);near(math.cos(math.radians(angle('B','A','C'))),.25);near(angle('B','O','C'),120)
load(10,36);near(d('A','D'),20);near(d('B','C'),15);near(p['B'][2],14);near(norm(cross(v('A','O'),v('A','C'))));near(norm(cross(v('B','O'),v('B','D'))));near(d('O','H'),8)
load(10,37);mid('P','A','C');near(norm(cross(v('B1','Q'),v('B1','D'))));perp('P','Q','A','C');perp('P','Q','B1','D');near(d('P','Q'),Q(6)/6)
load(10,38);regular(['A','B','C','D']);near(d('A','B'),1);mid('P','A','B');mid('Q','C','D');perp('P','Q','A','B');perp('P','Q','C','D');near(d('P','Q'),Q(2)/2)
load(10,39);mid('O','A','C');mid('O','B','D');near(d('O','M'),1);assert all(p[x][2]>0 for x in ['A','B','C','D']);near(sum(p[x][2]for x in ['A','B','C','D']),4*p['O'][2]);assert 4*p['O'][2]<=4
load(10,40);regular(['A','B','C']);near(d('A','B'),12)
for a,b in [('A','B'),('B','C'),('C','A'),('E','F'),('F','G'),('G','H'),('H','E')]:near(line_dist('O',a,b),2*Q(3))
near(d('E','F'),4*Q(3))
load(10,41);near(d('A','B'),d('C','B'));near(d('A','T')/d('T','B'),12/25);perp('O','T','A','B');near(area('A','B','C'),1680)
for a,b in [('A','B'),('B','C'),('C','A')]:near(line_dist('O',a,b),120/7)

load(11,1);mid('O','A','C');mid('O','B','D');perp('N','C','A','B');perp('N','C','A','D');perp('N','O','B','D')
load(11,2);near(max(polygon_sides(['A','B','C','D'])),min(polygon_sides(['A','B','C','D'])));perp('F','C','A','B');perp('A','F','B','D')
load(11,3);regular(['A','B','C']);mid('D','B','C');perp('M','D','B','C')
load(11,4);perp('O','B','P','Q');perp('A','B','P','Q');perp('A','O','O','B')
load(11,5);near(d('A','B'),d('B','C'));mid('H','A','C');perp('B','H','A','C');perp('D','H','A','C')
load(11,6);perp('B','C','A','C');perp('D','C','A','C');perp('B','D','A','C')
load(11,7);mid('O','A','C');mid('O','B','D');perp('E','O','A','C')
load(11,8);par('A','B','D','C');par('A','D','B','C');perp('M','D','C','D');perp('A','B','A','D')
load(11,9);par('A','B','D','C');par('A','D','B','C');perp('M','D','A','C');near(max(polygon_sides(['A','B','C','D'])),min(polygon_sides(['A','B','C','D'])))
load(11,10);near(d('A','B'),10);near(d('A','C'),17);near(d('B','C'),21);near(d('D','A'),15);perp('D','H','B','C');near(d('D','H'),17)
load(11,11);near(d('A','B'),12);near(angle('A','B','C'),30);near(d('E','C'),10);perp('E','C','B','C');near(d('A','E'),8)
for x in ['A','B','C']:near(d('O',x),6)
load(11,12);near(max(polygon_sides(['A','B','C','D'])),10);near(min(polygon_sides(['A','B','C','D'])),10);near(angle('B','A','C'),30);near(d('M','A'),5*Q(3));near(d('M','H'),5*Q(6));perp('M','H','C','D')
load(11,13);near(angle('A','B','C'),120);near(d('A','B'),14);near(d('D','H'),2*Q(43));near(d('D','A'),5);assert p['H'][0]<p['B'][0];perp('D','H','B','C')
load(11,14);regular(['A','B','C']);near(d('A','B'),18);incenter(['A','B','C'],3*Q(3),3*Q(2),3*Q(5))
load(11,15);near(d('A','C'),16)
for x in polygon_sides(['A','B','C','D']):near(x,10)
incenter(['A','B','C','D'],4.8,2,5.2)
load(11,16);perp('C','A','C','B');near(d('A','T1'),3);near(d('B','T1'),10);incenter(['A','B','C'],2,4,2*Q(5))
load(11,17);incenter(['A','B','C','D'],3,4,5)
load(11,18);near(d('B','C'),16);near(d('A','D'),36);near(d('A','B'),d('C','D'));incenter(['A','B','C','D'],12,16,20)
load(11,19);par('B','C','A','D');perp('A','B','A','D');near(d('C','D'),12);near(angle('A','D','C'),45);incenter(['A','B','C','D'],3*Q(2),6*Q(2),3*Q(10))
load(11,20);near(d('A','B'),25);near(d('B','C'),17);near(d('B','E'),17);near(d('B','H'),15);near(d('A','C'),28);near(d('A','E'),12)
for a,b in [('A','A1'),('C','C1'),('E','E1')]:par('B','B1',a,b)
load(11,21);perp('A1','C','B1','D1')
load(11,22);normal_line('C','D1','B1','A','C1')
load(11,23);normal_line('D','A','A','B','C');near(d('A','C'),d('A','D'));perp('A','C','B','C');mid('M','B','D');mid('K','C','D');normal_line('C','D','K','A','M')
load(11,24);regular(['A','B','C','D']);near(d('A','B'),1);mid('K','A','B');normal_line('A','B','K','C','D');near(area('D','C','K'),Q(2)/4)
load(11,25);near(max(polygon_sides(['A','B','C','D'])),min(polygon_sides(['A','B','C','D'])));near(d('B','D'),24);near(p['B'][2],3*Q(7));mid('O','A','C');mid('O','B','D');near(d('B1','D1'),18)
load(11,26);near(p['B'][2],5);near(d('A','B1'),12);near(d('C','B1'),15);near(d('A','C'),9);near(area('A','B','C'),117/2)
load(11,27);normal_line('A1','C','D','B','C1')
load(11,28);regular(['A','B','C']);near(d('A','B'),4*Q(2));near(d('S','C'),2);normal_line('S','C','C','A','B');mid('M','B','C');mid('N','A','B');near(norm(cross(v('S','P'),v('S','M'))));near(norm(cross(v('C','Q'),v('C','N'))));perp('P','Q','S','M');perp('P','Q','C','N');near(d('P','Q'),2*Q(3)/3)
load(11,29);near(angle('D','K','H'),45);near(angle('D','B','H'),60);near(d('D','B'),10*Q(3));near(d('H','K'),15)
load(11,30);par('A','D','B','C');near(d('A','B'),d('C','D'));near(angle('B','A','C'),angle('C','A','D'));near(angle('C','D','B'),angle('B','D','A'));near(d('A','O')/d('O','C'),13/5);near(d('B','H'),9);near(area('A','B','C')+area('A','C','D'),243)

cov=json.loads((R/'tools/merzlyak-10-base/coverage-10-11.json').read_text());index=json.loads((R/'stereo-course/merzlyak-10-base/source-index.json').read_text());idx={x['id']:x for x in index['entries']}
assert len(cov['entries'])==71
for item in cov['entries']:
 src=idx[item['sourceEntryId']]['source'];l=lessons[item['exercise']]
 assert src['exercise']==item['exercise'] and src['collection']==item['collection']
 assert src['printedPages'][0]==l['source']['printedPages'][0]
 assert l['source']['printedPages']==item['sourcePrintedPages']
 assert src['pdfPages'][0]==l['source']['pdfPages'][0]
 assert l['source']['pdfPages']==item['sourcePdfPages']
 assert item['requiredParts']==[None] and not l['source'].get('subpart')
 for f in item['lessonFiles']:assert(R/f).is_file()
assert next(x for x in cov['entries']if x['exercise']=='10.1')['authoredSourceSubparts']==['1','2','3']
assert next(x for x in cov['entries']if x['exercise']=='10.2')['authoredSourceSubparts']==['1','2','3']
assert next(x for x in cov['entries']if x['exercise']=='10.15')['authoredSourceSubparts']==['1','2','3','4']
print('EXERCISES_10_11_MODELS_OK 71: source mapping, all faces/segments and task-specific numeric invariants; draft-only.')

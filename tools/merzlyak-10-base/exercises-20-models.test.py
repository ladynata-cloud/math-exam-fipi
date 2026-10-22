"""Author-side geometric invariants; not independent pedagogical/release review."""
import json,math,itertools
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'stereo-course/merzlyak-10-base/lessons'
Q=math.sqrt;PI=math.pi
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

lessons={};checks=set()
for n in range(1,92):
 f=D/f'ex-20-{n:03}.json';l=json.loads(f.read_text());lessons[n]=l;p=l['visualization']['model']['points'];m=l['visualization']['model']
 assert l['status']=='draft' and set(l['review'].values())=={'pending'} and len(l['steps'])>=3
 for a,b in m['edges']+[s for vv in m['views'].values()for s in vv.get('segments',[])]:assert d(a,b)>1e-8,(n,a,b)
 for poly in m.get('faces',[])+[vv['polygon']for vv in m['views'].values()if'polygon'in vv]:
  nn=normal(*poly[:3]);assert norm(nn)>1e-8,(n,poly)
  for x in poly[3:]:near(dot(v(poly[0],x),nn))
def load(n):
 global p
 p=lessons[n]['visualization']['model']['points'];checks.add(n)
def on_line(x,a,b):near(norm(cross(v(a,x),v(a,b))))
def on_plane(x,a,b,c):near(dot(v(a,x),normal(a,b,c)))
def outside(x,a,b,c):assert abs(dot(v(a,x),normal(a,b,c)))>1e-7

def prism_invariants(base):
 for a in base:
  par(a,a+'1',base[0],base[0]+'1');near(d(a,a+'1'),d(base[0],base[0]+'1'))
 for i in range(len(base)):
  j=(i+1)%len(base);par(base[i],base[j],base[i]+'1',base[j]+'1')
def lateral_area(base):
 return sum(norm(cross(v(base[i],base[(i+1)%len(base)]),v(base[i],base[i]+'1')))for i in range(len(base)))
def pyramid_area(base,top='M'):return sum(area(top,base[i],base[(i+1)%len(base)])for i in range(len(base)))

load(1);on_line('B','A','C');assert norm(cross(v('A','C'),v('A','D')))>0
load(2);mid('O','A','C');mid('O','B','D');perp('A','B','A','D');outside('M','A','B','C');on_plane('O','A','M','C')
load(3);prism_invariants(['A','B','C']);on_line('D','A','B');on_line('E','A','C');on_line('P','A1','D');on_line('P','B','B1');on_line('Q','A1','E');on_line('Q','C','C1')
load(4);on_plane('M','B','B1','C');on_line('K','A','D');par('M','N','B','B1');on_line('T','K','N');on_line('T','A','B');on_line('X','K','M');on_plane('X','A','B','B1');par('T','X','A','A1')
load(5);on_plane('M','A','A1','B');on_plane('K','A','A1','D');on_line('T','A','M');on_line('U','A','K');on_plane('T','A1','B1','C1');on_plane('U','A1','B1','C1');on_line('X','M','K');on_line('X','T','U')
load(6);on_line('M','B','B1');on_line('N','C','C1');on_line('K','D','D1');assert len({d('B','M'),d('C','N'),d('D','K')})==3;on_line('P','M','N');on_line('P','B','C');on_line('Q','N','K');on_line('Q','C','D');on_plane('P','M','N','K');on_plane('Q','M','N','K')
load(7);mid('M','A1','B1');mid('K','C','D');on_line('P','A','M');on_line('P','B','B1');on_line('Q','A','K');on_line('Q','B','C');on_plane('P','A','M','K');on_plane('Q','A','M','K')
load(8);on_line('E','A','B');on_line('F','A','D');on_line('M','A','C');on_line('K','B','C');on_line('P','E','M');on_line('P','A','K');on_plane('F','D','A','K')
load(9);on_line('M','D','A');on_line('K','D','B');on_line('P','M','K');on_line('P','A','B')
load(10)
for a,b,c,d1 in [('A','B','C','D'),('A','C','B','D'),('A','D','B','C')]:assert abs(dot(v(a,c),cross(v(a,b),v(c,d1))))>1e-7
load(11);par('A','D','B','C');par('M','K','A','D');outside('M','A','B','C');assert norm(cross(v('M','K'),v('A','B')))>0
load(12);par('A','B','C','D');on_line('P','C','D');outside('Q','A','B','C')
load(13);par('A','B','C','D')
for x,a,b in [('P','A','B'),('U','A','B'),('Q','C','D'),('V','C','D')]:on_line(x,a,b)
load(14);mid('O','A','B');mid('O','C','D')
for x in ['A','B','C','D']:near(d('O',x),5);par(x,x+'1','O','O1');near(p[x+'1'][2],0)
near(d('A','A1'),5);near(d('B','B1'),9);near(d('D','D1'),3);near(d('C','C1'),11)
load(15);par('A','B','C','D');outside('M','A','B','C');outside('A','C','M','D')
load(16);on_line('M','P','Q');on_line('M','U','V');par('P','Q','A','B');near(p['M'][2],2)
load(17);on_line('M','P','Q');on_plane('M','u1','u2','u3');on_plane('M','v1','v2','v3');outside('A','u1','u2','u3');outside('A','v1','v2','v3');par('A','B','P','Q')
load(18);mid('M','A','C');mid('N','B','C');on_line('K','A','D');on_line('E','B','D');par('K','E','M','N');outside('K','A','B','C')
load(19);par('P','Q','C','D');par('U','V','C','D');on_line('A','P','Q');on_line('B','U','V');outside('C','P','Q','U')
load(20);on_line('E','D','A');on_line('F','D','B');on_line('M','D','C');near(angle('A','B','E'),angle('F','E','B'));near(angle('C','B','M'),angle('F','M','B'));par('A','B','E','F');par('B','C','F','M')
load(21);par('A','B','D','C');par('A','D','B','C');near(p['A'][2],p['D'][2]);near(p['B'][2],p['C'][2])
load(22);on_line('M','N','T');on_line('K','L','T');par('M','K','N','L');near(p['K'][2],p['M'][2]);near(p['L'][2],p['N'][2])
load(23);prism_invariants(['A','B','C']);on_line('D','A','C');on_line('E','A1','C1');par('D','E','B','B1');par('B','D','B1','E');on_plane('E','B','D','B1')
load(24);mid('T','D','B')
for x,verts in [('E',['A','D','B']),('F',['B','D','C'])]:
 for i in range(3):near(p[x][i],sum(p[y][i]for y in verts)/3)
par('E','F','A','C');outside('E','A','B','C')
load(25);on_line('E','A','B');on_line('F','C','C1');on_line('M','B1','C1');on_line('T','M','F');on_line('T','B','C');on_line('P','E','T');on_line('P','C','D');on_line('Q','A1','B1');par('M','Q','E','P')
for x in ['P','Q']:on_plane(x,'E','F','M')
load(26);on_line('E','A','B');on_line('F','A','C');on_line('G','A','D');par('E','F','B','C');par('E','G','B','D')
load(27);regular(['A','B','C']);near(d('A','B'),28);on_line('M','A','D');near(d('A','M')/d('M','D'),4/3);on_line('N','B','D');on_line('P','C','D');par('M','N','A','B');par('M','P','A','C');near(area('M','N','P'),36*Q(3))
load(28);perp('A','B','A','D');near(d('A','B'),10);near(d('M','A'),16);near(d('M','B'),16);mid('K','A','D');mid('L','B','C');mid('P','M','C');mid('Q','M','D');par('K','L','A','B');par('K','Q','A','M');near(d('K','L')+d('L','P')+d('P','Q')+d('Q','K'),31)
load(29);par('P','Q','U1','V1');assert norm(cross(v('P','Q'),v('U','V')))>0;near(d('A','B'),d('A','B1'));near(d('C','B'),d('C','B1'));outside('B','A','B1','C')
load(30);par('A1','B1','D1','C1');par('A1','D1','B1','C1')
load(31);mid('F','A1','B1');on_line('F2','A1','B1');near(d('A1','F2')/d('F2','B1'),2/3)
for e,f,g in [('E','F','G'),('E2','F2','G2')]:par('C1',e,g,f);par('C1',g,e,f);on_line(e,'C1','A1');on_line(g,'C1','B1')
load(32);near(angle('A','B','C'),30);near(angle('B','A','C'),30);par('P','Q','A','C');outside('P','A','B','C');near(abs(dot(v('P','Q'),v('B','C')))/(d('P','Q')*d('B','C')),.5)
load(33);near(d('A','A1')/d('A','B'),2)
for a,b,cosine in [('C','D',1/Q(5)),('C','D1',3/5),('A1','C1',1/Q(10))]:near(abs(dot(v('A','B1'),v(a,b)))/(d('A','B1')*d(a,b)),cosine)
load(34);near(d('A','B'),10);near(d('B','C'),10);near(d('A','C'),12);near(d('D','B'),24);mid('M','A','C');near(d('D','A'),26);near(d('D','M'),8*Q(10))
load(35)
for x in polygon_sides(['A','B','C','D','E','F']):near(x,2)
near(p['C'][0],p['D'][0]);near(p['F'][0],p['A'][0]);par('C','D','F','A')
load(36)
for x in polygon_sides(['A','B','C','D']):near(x,3)
near(angle('A','B','C'),60);near(angle('M','D','B'),30);perp('A','B','B','M');perp('C','B','B','M');near(d('M','D'),2*3*math.cos(PI/6)/math.cos(PI/6))
load(37);mid('O','A','C');mid('K','C','D');near(d('M','C'),6);near(angle('M','C','K'),60);normal_line('C','D','O','K','M');near(d('M','O'),3*Q(2))
load(38);on_line('M','A','C');near(d('A','M')/d('M','C'),.5);on_plane('M','P','Q','P1');normal_line('A','C','P','Q','P1');on_line('P','A','B');on_line('Q','A','D');on_line('P1','A1','B1');on_line('Q1','A1','D1')
load(39);on_line('C','A','B');near(d('A','A1'),16);near(d('B','B1'),6);near(d('A1','B1'),4);near(d('B1','C'),12/5)
load(40);mid('C','A','B');near(p['A'][2],18);near(p['B'][2],-9);near(d('C','C1'),4.5)
load(41);mid('H','P','P1');near(p['P'][2],-p['P1'][2]);near(p['v1'][2],-p['w1'][2])
load(42);near(d('M','H'),5);near(d('M','A'),d('M','B'));near(angle('M','A','H'),30);near(angle('A','M','B'),60);near(d('A','B'),10)
load(43)
for x in ['A','B','C','D']:near(d('M',x),5*Q(3))
near(d('M','O'),5*Q(2));near(angle('A','C','B'),30);near(area('A','B','C')+area('A','C','D'),25*Q(3))
for n in [44,45]:
 load(n);mid('M','A','B');near(d('M','M1'),abs(p['A'][2]+p['B'][2])/2)
load(46);near(d('A','C'),6);near(d('B','C'),6);perp('A','C','B','C');perp('M','H','A','B');near(d('M','H'),3*Q(6));near(d('M','C'),6)
load(47);near(d('A','B'),5);near(d('B','C'),16);near(d('M','C'),20);perp('M','C','C','D');perp('M','A','A','D');near(d('M','A'),13)
load(48);near(d('A','B'),15);near(d('A','D'),20);near(d('K','C'),5);perp('K','H','B','D');near(d('K','H'),13)
load(49);near(d('A','B'),6);near(d('B','C'),25);near(d('A','C'),29);near(d('D','O'),2*Q(15))
for i,(a,b)in enumerate([('A','B'),('B','C'),('C','A')],1):near(d('D',f'T{i}'),8);perp('D',f'T{i}',a,b)
load(50);near(d('A','B'),4);near(angle('M','A','B'),45);near(math.tan(math.radians(angle('M','D','B'))),1/Q(2))
load(51);regular(['A','B','C']);near(d('M','O'),5);near(angle('M','A','O'),60);near(area('A','B','C'),25*Q(3)/4)
load(52);near(d('D','C'),9);near(d('A','C'),15);near(d('B','C'),20);perp('D','E','A','B');near(math.tan(math.radians(angle('D','E','C'))),3/4)
load(53);par('A','B','C','D');near(p['A'][2],0);near(p['C'][2],0);near(d('B','B1')/d('A','B'),d('D','D1')/d('C','D'))
load(54);near(p['M'][2],8*Q(3));near(p['K'][2],5*Q(3));near(d('M','K'),6);near(angle('M','K','H'),60)
load(55);regular(['A','B','C']);perp('A','H','B','C');near(angle('A','H','A1'),45);near(math.sin(math.radians(angle('A','B','A1'))),Q(3)/2*math.sin(PI/4))
load(56)
for x in ['A','B','C']:near(d('M',x),3);near(d('M','O')/d('M',x),1/Q(3))
for a,b in itertools.combinations(['A','B','C'],2):perp('M',a,'M',b)
load(57);near(angle('P','O','Q'),60);near(d('A','P'),2);near(d('A','Q'),2);perp('A','P','O','P');perp('A','Q','O','Q');near(d('A','O'),4)
load(58);near(d('A','C'),2);near(d('B','C'),1);near(d('A','B'),Q(5));normal_line('L','R','C','A','B');near(angle('A','C','B'),90)
# Literal source counterexample: the common C need not lie on m if skew perpendiculars count.
xa=[Q(5),0,0];xb=[Q(5)/2,Q(15)/2,0];xc=[3*Q(5)/5+Q(3/5),2*Q(15)/5+1/Q(5),0]
near(norm(sub(xa,xc)),2);near(norm(sub(xb,xc)),1);near(norm(sub(xa,xb)),Q(5));near(dot(xa,xb)/(norm(xa)*norm(xb)),.5);assert norm(xc)>0
load(59);near(d('A','O'),8);near(d('O','C'),2);perp('O','C','B','C');perp('A','C','B','C');near(math.tan(math.radians(angle('A','C','O'))),4)
load(60);near(d('A','C'),8);near(angle('B','A','C'),30);near(d('M','H'),12);perp('M','H','A','B');near(math.cos(math.radians(angle('M','H','C'))),1/3)
load(61);near(d('A','C'),7);near(d('A','B'),10);near(d('B','C'),13);perp('C','H','A','B');near(angle('C','H','C1'),60);near(d('C','C1'),6)
load(62);near(area('A','B','C')+area('A','C','D'),16);near(area('A','E','F')+area('A','F','D'),32);near(angle('B','A','E'),60);perp('B','E','B','C');perp('B','E','E','F');near(d('B','E'),4*Q(3))
load(63);near(d('A','C'),d('A','D'));near(d('B','C'),d('B','D'));mid('O','C','D');perp('E','X','C','D');par('E','F','A','O');par('F','X','O','B');on_line('F','C','D');on_plane('X','C','D','B')
load(64);par('A','B','C','X');on_line('T','A','C');on_line('T','B','X');on_line('T','L','R');on_plane('X','L','R','B')
load(65);near(d('M','P'),9);near(d('M','Q'),12);perp('H','P','H','Q');near(d('M','H'),15)
load(66);par('A','A1','O','O1');par('B','B1','O','O1');near(d('A','B')-d('A','O'),1);near(d('A','B')-d('B','O'),32);near(d('A','B'),41)
load(67);perp('O','A','O','B');perp('O','A','O','C');perp('O','B','O','C')
load(68);par('A','A1','B','B1');near(norm(cross(normal('u1','u2','u3'),normal('v1','v2','v3'))));near(dot(normal('u1','u2','u3'),normal('g1','g2','g3')));near(dot(normal('v1','v2','v3'),normal('g1','g2','g3')))
load(69);perp('C','A','C','B');near(d('A','B'),16);near(angle('B','A','C'),45);near(angle('D','H','C'),30);near(area('A','B','D'),128*Q(3)/3)
load(70);near(area('A','B','C')+area('A','C','D'),40*Q(2));near(d('B1','C1'),7);near(d('A','D'),13);near(d('A','B1'),5);near(d('D','C1'),5);near(angle('K','H','K1'),45)
load(71);prism_invariants(['A','B','C','D']);near(d('A','B'),d('A','D'));near(d('A','C1'),25);near(d('A','B1'),20);near(d('A','A1'),5*Q(7))
load(72);prism_invariants(['A','B','C']);near(d('A','A1'),12);near(lateral_area(['A','B','C']),816);near(d('A','B'),30);near(d('A','C'),20);near(d('B','C'),18)
load(73);prism_invariants(['A','B','C','D']);near(d('A','A1'),8);near(d('P','T'),7);near(d('Q','R'),5);near(d('P','Q'),6);near(d('R','T'),6);near(lateral_area(['A','B','C','D']),192)
for x,a in zip(['P','Q','R','T'],['A','B','C','D']):on_line(x,a,a+'1');near(p[x][2],0)
assert abs(dot(v('A','A1'),v('A','B')))>1e-6,'Prism really is oblique'
load(74);prism_invariants(['A','B','C']);near(d('A','A1'),12);near(d('A','B'),8);near(d('A','C'),d('B','C'));near(d('B','C1'),13);near(area('A','B','C1'),12*Q(17))
load(75);prism_invariants(['A','B','C','D','E','F'])
for x in polygon_sides(['A','B','C','D','E','F']):near(x,2)
near(angle('D1','A','D'),45);near(lateral_area(['A','B','C','D','E','F']),12*2**2)
load(76);prism_invariants(['A','B','C']);near(d('B','C'),3);perp('A','C','B','C');near(angle('B','A','C'),30);near(angle('A1','C','A'),45);near(d('A','A1'),3/math.tan(PI/6))
load(77);prism_invariants(['A','B','C']);regular(['A','B','C']);near(d('A','A1'),8);normal_line('A','H','B','C','B1');near(angle('A','B1','H'),30);near(lateral_area(['A','B','C']),96*Q(2))
load(78);near(d('A','B'),6);near(6*d('A','B')**2,216);near(area('A','C','C1')+area('A','C1','A1'),36*Q(2))
load(79);mid('M','A1','C1');mid('K','A','B1');near(angle('M','K','H'),45);near(p['K'][2],p['H'][2]);near(p['M'][0],p['H'][0]);near(p['M'][1],p['H'][1])
load(80);mid('E','A','D');mid('F','C','D');mid('M','B','B1');on_line('H','B','D');on_line('H','E','F');perp('M','H','E','F');perp('B','H','E','F');near(math.tan(math.radians(angle('M','H','B'))),Q(2)/3)
load(81);prism_invariants(['A','B','C','D']);near(d('A','B'),9);near(d('A','D'),8);near(angle('B','A','D'),60);near(d('A','C'),d('B','D1'));near(lateral_area(['A','B','C','D']),408)
load(82);prism_invariants(['A','B','C','D'])
for x in polygon_sides(['A','B','C','D']):near(x,4)
near(angle('B','A','D'),60);near(angle('D1','B','D'),45);near(lateral_area(['A','B','C','D'])+2*(area('A','B','C')+area('A','C','D')),2*16*(4*math.sin(PI/6)+math.sin(PI/3)))
load(83);prism_invariants(['A','B','C','D']);near(d('A','A1'),6);near(lateral_area(['A','B','C','D']),312);near(d('P','Q'),5);near(d('Q','T'),19);near(angle('Q','P','T'),60);near(angle('P','Q','R'),120)
for x,a in zip(['P','Q','R','T'],['A','B','C','D']):on_line(x,a,a+'1');near(p[x][2],0)
load(84);near(d('M','A'),d('M','C'));perp('M','A','M','C');near(area('A','B','C')+area('A','C','D'),2*area('A','M','C'))
load(85);near(d('M','A'),d('A','B'));mid('P','A','B');mid('Q','C','D');mid('R','M','B');mid('T','M','C');par('P','R','A','M');par('P','Q','A','D');near((area('P','R','T')+area('P','T','Q'))/(area('A','B','C')+area('A','C','D')),3*Q(3)/16)
load(86);perp('A','B','A','D');near(d('A','B'),6)
for x in ['A','B','C','D']:near(angle('M',x,'O'),45)
near(d('M','O'),6/(2*math.cos(math.atan(4/3))))
load(87);near(d('A','D'),15);near(d('A','B'),10);near(d('C','D'),10);near(angle('M','T','O'),60);near(pyramid_area(['A','B','C','D'])+area('A','B','C')+area('A','C','D'),150*Q(3))
load(88);near(d('A','C'),40);near(d('B','D'),30);near(d('M','O'),5);near(d('O','T'),12);perp('M','T','A','B');near(pyramid_area(['A','B','C','D'])+area('A','B','C')+area('A','C','D'),1250)
load(89);near(d('A','B'),26);near(d('B','C'),10);near(d('A','D'),18);perp('A','C','B','C');normal_line('A','D','A','B','C');near(pyramid_area(['A','B','C'],'D'),600)
load(90);near(d('M','A'),d('A','B'));normal_line('M','A','A','B','D');near(angle('M','B','A'),45);near(angle('M','D','A'),45)
load(91);near(d('A','B'),10);near(angle('B','A','D'),60);normal_line('M','A','A','B','D');near(angle('M','H','A'),60);near(angle('M','K','A'),60);near(pyramid_area(['A','B','C','D']),50*(3+2*Q(3)))

cov=json.loads((R/'tools/merzlyak-10-base/coverage-20.json').read_text());index=json.loads((R/'stereo-course/merzlyak-10-base/source-index.json').read_text());idx={x['id']:x for x in index['entries']}
assert len(cov['entries'])==91 and checks==set(range(1,92))
for item in cov['entries']:
 src=idx[item['sourceEntryId']]['source'];n=int(item['exercise'].split('.')[1]);l=lessons[n]
 assert src['exercise']==item['exercise'] and src['collection']=='main'
 assert src['printedPages'][0] in item['sourcePrintedPages']
 assert l['source']['printedPages']==item['sourcePrintedPages']
 assert l['source']['pdfPages']==item['sourcePdfPages']
 assert item['requiredParts']==[None] and not l['source'].get('subpart')
 for f in item['lessonFiles']:assert(R/f).is_file()
print('EXERCISES_20_MODELS_OK 91: source mapping, every face/segment, task-specific numerical invariants and source58 counterexample; draft-only.')

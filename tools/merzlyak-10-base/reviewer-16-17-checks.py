#!/usr/bin/env python3
"""Independent source/model/math review checks for §§16–17. Not release approval."""
import json,math,pathlib
from review_state import assert_review_state
ROOT=pathlib.Path(__file__).resolve().parents[2];LESSONS=ROOT/'stereo-course/merzlyak-10-base/lessons';EPS=1e-6
checks=[]
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def norm(a):return math.sqrt(dot(a,a))
def close(x,y):assert abs(x-y)<EPS*max(1,abs(x),abs(y)),(current,x,y)
def zero(a):close(norm(a),0)
def v(a,b):return sub(p[b],p[a])
def dist(a,b):return norm(v(a,b))
def line(x,a,b):zero(cross(v(a,x),v(a,b)))
def par(a,b,c,d):zero(cross(v(a,b),v(c,d)))
def perp(a,b,c,d):close(dot(v(a,b),v(c,d)),0)
def midpoint(m,a,b):zero(tuple(2*p[m][i]-p[a][i]-p[b][i] for i in range(3)))
def angle(a,b,c):
 x,y=v(b,a),v(b,c);return math.degrees(math.acos(max(-1,min(1,dot(x,y)/norm(x)/norm(y)))))
def area(*names):
 return sum(norm(cross(v(names[0],names[i]),v(names[0],names[i+1])))/2 for i in range(1,len(names)-1))
def normal(a,b,c):return cross(v(a,b),v(a,c))
def planeangle(x,y):return math.degrees(math.acos(min(1,abs(dot(x,y))/norm(x)/norm(y))))
def coplanar(*names):
 n=normal(*names[:3]);assert norm(n)>EPS,(current,names)
 for x in names[3:]:close(dot(n,v(names[0],x)),0)
def footdist(x,a,b):return norm(cross(v(a,x),v(a,b)))/dist(a,b)
def pointplane(x,a,b,c):n=normal(a,b,c);return abs(dot(n,v(a,x)))/norm(n)
def lineplane(a,b,c,d,e):return math.degrees(math.asin(min(1,abs(dot(v(a,b),normal(c,d,e)))/dist(a,b)/norm(normal(c,d,e)))))
def load(ch,n):
 global current,p,d,m
 current=f'ex-{ch:02d}-{n:03d}';d=json.loads((LESSONS/(current+'.json')).read_text());m=d['visualization']['model'];p=m['points'];checks.append(current)
 assert_review_state(d)
 expected=(153 if n<=10 else 154 if n<=21 else 155 if n<=31 else 156 if n<=42 else 157) if ch==16 else (160 if n<=7 else 161 if n<=20 else 162)
 assert d['source']['printedPages']==[expected],(current,d['source'])
 assert d['source']['pdfPages']==[expected+1]
 if 'faces' not in m:
  base=[]
  for a,b in m['edges']:
   base.append(a)
   if b==m['edges'][0][0]:break
  top=[a+'1' for a in base]
  m['faces']=([base,top]+[[base[i],base[(i+1)%len(base)],top[(i+1)%len(base)],top[i]] for i in range(len(base))]) if all(x in p for x in top) else []
 for e in m['edges']:assert dist(*e)>EPS,(current,e)
 for f in m['faces']:coplanar(*f)
 for view in m['views'].values():
  for e in view.get('segments',[]):assert dist(*e)>EPS,(current,e)
  if view.get('polygon'):coplanar(*view['polygon'])
def prism():
 base=m['faces'][0];top=m['faces'][1];assert len(base)==len(top)
 for a,b in zip(base,top):zero(sub(v(a,b),v(base[0],top[0])))
 return base,top
def straight():
 b,t=prism();perp(b[0],t[0],b[0],b[1]);perp(b[0],t[0],b[0],b[2]);return b,t
def lateral():return sum(area(*f) for f in m['faces'][2:])
def total():return sum(area(*f) for f in m['faces'])
def basearea():return area(*m['faces'][0])
def perimeter():b=m['faces'][0];return sum(dist(b[i],b[(i+1)%len(b)]) for i in range(len(b)))
def height():b,t=prism();return pointplane(t[0],*b[:3])
def edge():b,t=prism();return dist(b[0],t[0])
load(16,1);prism();assert len(m['points'])==6 and len(m['edges'])==9 and len(m['faces'])==5
load(16,2);prism();assert len(m['faces'])==12 and len(m['faces'][0])==10
load(16,3);straight();par('O','O1','A','A1')
load(16,4);prism();close(planeangle(normal('A','B','B1'),normal('A','B','C')),90);close(planeangle(normal('D','C','C1'),normal('A','B','C')),90);assert edge()>height()
load(16,5);straight()
for a,b in m['edges']:close(dist(a,b),3)
close(angle('B','A','D'),60)
load(16,6);straight();close(angle('B','A','D'),70);close(angle('A','B','C'),110);close(dist('A','B'),dist('C','D'))
load(16,7);prism();assert len(m['points'])==10 and len(m['edges'])==15
load(16,8);straight();close(dist('A','B'),3);close(height(),3*math.sqrt(6));close(dist('A','C1'),6*math.sqrt(2))
load(16,9);straight();close(dist('A','B'),5);close(dist('A','B1'),13);close(height(),12)
load(16,10);straight();midpoint('D','A','C');midpoint('E','B','C');line('F','C','C1');close(dist('A','B'),12);close(planeangle(normal('D','E','F'),normal('A','B','C')),30);close(area('D','E','F'),18)
load(16,11);straight();line('M','B','B1');close(dist('A','B'),8);close(planeangle(normal('A','C','M'),normal('A','B','C')),45);close(area('A','C','M'),32*math.sqrt(2))
load(16,12);straight();close(height(),6);close(dist('A','B'),2);close(dist('A','D'),3);close(lateral(),60)
load(16,13);straight();assert len(m['faces'][0])==7;close(height(),10);close(lateral(),420)
for a,b in zip(m['faces'][0],m['faces'][0][1:]+m['faces'][0][:1]):close(dist(a,b),6)
load(16,14);straight();a=dist('A','B');close(total(),4*a*height()+2*a*a)
load(16,15);straight();a=dist('A','B');close(total(),3*a*height()+a*a*math.sqrt(3)/2)
load(16,16);prism();close(height(),10);close(edge(),20);close(lineplane('A','A1','A','B','C'),30)
load(16,17);prism();assert edge()>height();close(edge(),8);close(lateral(),160)
for a,b in [('As','Bs'),('Bs','Cs'),('Cs','Ds'),('Ds','As')]:close(dist(a,b),5);perp(a,b,'A','A1')
load(16,18);prism();assert edge()>height();close(dist('As','Bs'),9);close(dist('As','Cs'),12);perp('As','Bs','As','Cs');close(lateral(),288);close(edge(),8)
load(16,19);straight();a=dist('A','B');close(lineplane('A','C1','A','B','B1'),30);close(height(),a*math.sqrt(2));close(lineplane('A','C1','A','B','C'),45)
load(16,20);straight();a=dist('A','B');close(height(),a);close(dist('A','C1'),2*a);close(dist('A','D1'),a*math.sqrt(5))
load(16,21);straight();a=dist('A','B');al=math.radians(angle('B','A','D'));be=math.radians(lineplane('A','C1','A','B','C'));close(dist('A','C1'),2*a*math.cos(al/2)/math.cos(be));close(dist('B','D1'),2*a*math.sqrt(math.sin(al/2)**2+math.cos(al/2)**2*math.tan(be)**2))
load(16,22);straight();close(height(),4);close(dist('A','C1'),16);close(dist('B','D1'),10);close(dist('A','B'),9)
load(16,23);straight();perp('C','A','C','B');line('D','A','B');close(dist('A','D'),18);close(dist('B','D'),2);close(height(),8);perp('C','D','A','B');close(area('D','C','C1','D1'),48)
load(16,24);straight();perp('C','A','C','B');close(dist('A','C'),30);close(dist('B','C'),40);close(height(),dist('A','B'));midpoint('M','A','B');close(area('C','M','M1','C1'),1250)
load(16,25);straight();a=dist('A','B');close(height(),a);close(area('A','B','C1'),a*a*math.sqrt(7)/4);close(planeangle(normal('A','B','C1'),normal('A','B','C')),math.degrees(math.asin(2/math.sqrt(7))))
load(16,26);straight();perp('C','A','C','B');line('D','B','B1');a=dist('B','D');al=math.radians(angle('B','A','C'));be=math.radians(planeangle(normal('A','C','D'),normal('A','B','C')));close(area('A','C','D'),a*a/math.tan(be)**2/math.tan(al)/(2*math.cos(be)))
load(16,27);straight();al=math.radians(angle('B','A','D'));be=math.radians(planeangle(normal('B','D','A1'),normal('A','B','C')));diag=dist('A','C');close(height(),diag/2*math.tan(be));close(area('B','D','A1'),diag*diag*math.tan(al/2)/(4*math.cos(be)))
load(16,28);straight();midpoint('D','A','B1');close(height(),6);close(dist('A','B'),2);close(lineplane('C','D','A','B','C'),60)
load(16,29);straight();midpoint('M','C','D1');close(height(),math.sqrt(5));close(dist('A','B'),1);close(lineplane('A','M','A','B','C'),45)
load(16,30);straight();close(dist('A','C'),5);close(dist('B','C'),12);close(dist('A','B'),13);close(total(),270);close(height(),7)
load(16,31);straight();close(lateral(),96);close(total(),128);close(height(),6)
load(16,32);straight();close(dist('A','C1'),12);close(lineplane('A','C1','A','B','C'),30);close(total(),108+72*math.sqrt(6))
load(16,33);straight();close(lateral(),2*math.sqrt(2)*area('A','C','C1','A1'))
load(16,34);straight();close(dist('A','C1'),5);close(dist('A','B1'),4);close(total(),18+12*math.sqrt(7))
load(16,35);straight();close(dist('B','C'),11);close(dist('A','D'),21);close(dist('A','B'),13);close(dist('C','D'),13);close(area('A','C','C1','A1'),180);close(lateral(),522);close(area('A','B1','C1','D'),240)
load(16,36);straight();close(dist('A','B1'),10);close(lateral(),288)
for a,h in [(6,8),(8,6)]:close(a*a+h*h,100);close(6*a*h,288)
load(16,37);prism();close(edge(),9);close(planeangle(normal('A','A1','B'),normal('A','A1','C')),90);close(footdist('B','A','A1'),8);close(footdist('C','A','A1'),15);close(lateral(),360);assert edge()>height()
load(16,38);prism();close(angle('Bs','As','Cs'),120);close(footdist('B','A','A1'),16);close(footdist('C','A','A1'),14);close(lateral(),840);close(edge(),15);assert edge()>height()
load(16,39);straight();close(height(),6);midpoint('D','A1','C1');midpoint('E','B1','C1');close(planeangle(normal('A','B','E'),normal('A','B','C')),60);close(area('A','B','E','D'),24*math.sqrt(3))
load(16,40);straight();close(dist('A','B'),4*math.sqrt(2));close(height(),6);midpoint('O','A','C');midpoint('M','D','D1');par('O','M','B','D1');coplanar('A','C','M','O');close(area('A','C','M'),20)
load(16,41);straight();al=math.radians(angle('B','A1','D'));close(area('B','A1','D'),height()**2/2*math.tan(al));assert 0<al<math.pi/2
load(16,42);straight();al=math.radians(angle('B','A1','C'));close(area('B','A1','C'),height()**2*math.sin(al)/(2*(2*math.cos(al)-1)));assert 0<al<math.pi/3
load(16,43);prism();a=dist('A','B');close(edge(),a);close(dist('A','C'),a);close(dist('B','C'),a);close(angle('A1','A','B'),45);close(angle('A1','A','C'),45);perp('A','A1','B','C');close(lateral(),a*a*(1+math.sqrt(2)))
load(16,44);prism();a=dist('A','B');close(edge(),a);close(dist('A','C'),a);close(dist('B','C'),a);zero(tuple(3*p['O'][i]-p['A'][i]-p['B'][i]-p['C'][i] for i in range(3)));perp('O','A1','A','B');perp('O','A1','A','C');perp('B','B1','B','C');close(lateral(),a*a*(1+math.sqrt(3)))
load(16,45);straight();a=dist('A','C');close(dist('B','C'),a);close(edge(),a);perp('C','A','C','B');assert abs(dist('A','B')-a)>EPS
# Corrected example only: literal all-square condition is intentionally unsatisfied.
close(abs(dot(v('A','C1'),v('C','B1')))/dist('A','C1')/dist('C','B1'),.5)
assert 'не существует' in ' '.join(x['explanation'] for x in d['steps']);par('C','E','A','C1');close(dist('C','E'),dist('C','B1'));close(dist('C','E'),dist('E','B1'))
load(16,46);par('A','B','D','C');par('A','D','B','C');midpoint('O','A','C');midpoint('O','B','D');line('E','B','C');line('F','A','D');line('O','E','F');midpoint('O','E','F');par('B','E','F','D');par('E','D','B','F')
load(16,47);diag=dist('A','C');al=math.radians(angle('B','A','D'));close(dist('A','B'),diag/(2*math.cos(al/2)));close(dist('B','D'),diag*math.tan(al/2));close(area('A','B','C','D'),diag*diag/2*math.tan(al/2));line('H','A','B');perp('O','H','A','B');close(dist('O','H'),diag/2*math.sin(al/2))
load(17,1);straight();a=dist('A','B');close(height(),a);close(dist('A','D'),a);perp('A','B','A','D')
load(17,2);straight();close(planeangle(normal('A','C','C1'),normal('A','B','C')),90)
load(17,3);straight();close(dist('A','B'),5);close(dist('A','D'),12);close(lineplane('A','C1','A','B','C'),60);close(height(),13*math.sqrt(3))
load(17,4);straight();close(dist('A','B'),7);close(dist('A','D'),24);close(height(),4);close(area('A','C','C1','A1'),100)
load(17,5);straight();close(dist('A','B'),5);close(dist('A','D'),7);close(height(),12);close(lineplane('D','C1','B','C','C1'),math.degrees(math.atan(5/12)));close(lineplane('B1','D','A','B','B1'),math.degrees(math.atan(7/13)))
load(17,6);straight();close(dist('A','B'),5);close(dist('A','D'),7);close(height(),12);close(lineplane('D','C1','A1','B1','C1'),math.degrees(math.atan(12/5)));close(lineplane('B1','D','A','B','C'),math.degrees(math.atan(12/math.sqrt(74))))
load(17,7);straight();assert sorted([dist('A','B'),dist('A','D'),height()])==[2,3,6];close(dist('A','C1'),7)
load(17,8);straight();assert sorted([dist('A','B'),dist('A','D'),height()])==[2,4,4];close(dist('A','C1'),6)
load(17,9);straight();a=dist('A','B');close(dist('A','D'),a);close(height(),a);close(dist('A','C1'),a*math.sqrt(3))
load(17,10);straight();close(total(),216);close(area('A','C','C1','A1'),36*math.sqrt(2))
load(17,11);straight();close(total(),18);close(basearea()*height(),4)
assert {2*(a*b+b*c+a*c) for a,b,c in [(1,1,4),(1,2,2)]}=={16,18}
load(17,12);straight();al=math.radians(angle('B','A','D'));be=math.radians(lineplane('A','C1','A','B','C'));diag=dist('B','D');close(lateral(),2*diag**2/math.tan(al/2)*math.tan(be)/math.sin(al/2))
load(17,13);straight();close(dist('A','B'),6);close(angle('B','A','D'),60);close(dist('B','D1'),dist('A','C'));close(lateral(),144*math.sqrt(2))
load(17,14);straight();close(dist('A','B'),2*math.sqrt(2));close(dist('A','D'),4);close(angle('B','A','D'),45);close(dist('A','C1'),7);close(lateral(),24+12*math.sqrt(2))
load(17,15);straight();close(dist('A','B'),2);close(dist('A','D'),2*math.sqrt(3));close(angle('B','A','D'),30);close(area('B','D','D1','B1'),8);close(total(),16+20*math.sqrt(3))
load(17,16);straight();ds=sorted([dist('A','C'),dist('A','D1'),dist('A','B1')]);
for x,y in zip(ds,[11,19,20]):close(x,y)
close(dist('A','C1'),21)
load(17,17);straight();diag=dist('A','C1');close(diag,17);assert sorted([round(diag-dist('A','B'),6),round(diag-dist('A','D'),6),round(diag-height(),6)])==[5,8,9]
load(17,18);straight();close(dist('A','C1'),dist('B','D1'));close(dist('A','C'),dist('B','D'));perp('A','B','A','D')
load(17,19);straight();close(dist('A','B'),6);close(angle('B','A','D'),45);close(planeangle(normal('A','B1','D'),normal('A','B','C')),60);line('H','A','D');perp('B','H','A','D');close(height(),3*math.sqrt(6));close(area('A','B1','C1','D'),36*math.sqrt(2))
load(17,20);straight();close(dist('A','D'),8);close(angle('B','A','D'),30);close(planeangle(normal('A1','C','D'),normal('A','B','C')),45);line('H','C','D');perp('A','H','C','D');close(height(),4)
load(17,21);straight();diag=dist('A','C1');al=math.radians(lineplane('A','C1','A','B','C'));be=math.radians(lineplane('A','C1','A','D','D1'));close(lateral(),2*diag**2*math.sin(al)*(math.sin(be)+math.sqrt(math.cos(be)**2-math.sin(al)**2)))
load(17,22);straight();a=dist('A','D');al=math.radians(lineplane('A','C1','A','B','C'));be=math.radians(angle('C1','A','D'));close(lateral(),2*a*a*math.sin(al)*(math.cos(be)+math.sqrt(math.sin(be)**2-math.sin(al)**2))/math.cos(be)**2);assert 0<al<be<math.pi/2
load(17,23);straight();s1=area('A','C','C1','A1');s2=area('B','D','D1','B1');close(lateral(),2*math.sqrt(s1*s1+s2*s2))
load(17,24);straight();s1=area('A','C','C1','A1');s2=area('B','D','D1','B1');close(height(),math.sqrt(s1*s2/(2*basearea())))
load(17,25);straight();close(dist('B','C'),8);close(dist('C','D'),4);close(angle('B','C','D'),60);close(planeangle(normal('B','D','C1'),normal('A','B','C')),30);close(lateral(),32*math.sqrt(3));perp('B','D','C','D')
load(17,26);prism();close(dist('A','B'),8);close(dist('A','D'),8);perp('A','B','A','D');close(edge(),6)
for x in 'ABCD':close(dist('A1',x),6)
close(height(),2);midpoint('O','A','C');perp('A1','O','A','B');perp('A1','O','A','D')
load(17,27);prism();
for a,b in m['edges']:close(dist(a,b),8)
perp('A','B','A','D');close(planeangle(normal('A','A1','B'),normal('A','B','C')),90);close(planeangle(normal('C','C1','D'),normal('A','B','C')),90);close(area('A','A1','D1','D'),64);assert edge()>height()
load(17,28);close(dist('A','C'),dist('B','C'));close(dist('A','B'),2*math.sqrt(2));close(angle('B','A','C'),30);line('D','B','C');close(angle('B','A','D'),angle('D','A','C'));close(dist('A','D'),2)
load(17,29);close(dist('A','B'),20);close(dist('A','C'),30);close(dist('B','C'),30);line('D','B','C');close(angle('B','A','D'),angle('D','A','C'));close(dist('B','D')/dist('D','C'),2/3);close(dist('A','D'),8*math.sqrt(6))
assert len(checks)==76
print(f'Independent checks passed for all {len(checks)} lessons: exact source pages, every solution model, all edges and highlighted polygons.')

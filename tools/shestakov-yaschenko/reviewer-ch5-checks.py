import json,math,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[2]; path=root/'stereo-course/shestakov-yaschenko-10-11/chapters/ch5.json';data=json.loads(path.read_text());cards=data['lessons']
def sub(a,b):return [x-y for x,y in zip(a,b)]
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def norm(a):return math.sqrt(dot(a,a))
def dist(a,b):return norm(sub(a,b))
def area(a,b,c):return norm(cross(sub(b,a),sub(c,a)))/2
def angle(u,v):return math.acos(min(1,max(0,abs(dot(u,v))/(norm(u)*norm(v)))))
def plandist(p,a,b,c):
 n=cross(sub(b,a),sub(c,a));return abs(dot(sub(p,a),n))/norm(n)
def linedist(p,a,b):return norm(cross(sub(p,a),sub(b,a)))/dist(a,b)
def polygonArea(p,names):return sum(area(p[names[0]],p[names[i]],p[names[i+1]]) for i in range(1,len(names)-1))
expected={
'5.1-A1':[math.radians(30),math.radians(60)],'5.1-A13':[180,324],'5.1-A19':[8,25],'5.1-B2':[math.pi/2,math.pi/2],'5.1-B9':[math.sqrt(2),25*math.sqrt(2)/4],'5.1-C6':[5*math.sqrt(3),2*math.sqrt(3)],
'5.2-A1':[math.pi/3,math.pi/3],'5.2-A12':[13,50],'5.2-A18':[84,340],'5.2-B1':[1/3,7/5],'5.2-B5':[2.4,1.2],'5.2-C6':[60/13,2.4],
'5.3-A8':[720,360],'5.3-A10':[12,96],'5.3-A12':[750,162],'5.3-B5':[math.acos(math.sqrt(3)/4)]*2,'5.3-B6':[math.sqrt(13)/2,math.sqrt(15)/4],'5.3-C4':[3,6],
'5.4-A1':[13,17],'5.4-A8':[60,32],'5.4-A15':[60,8],'5.4-B9':[math.acos(1/4)]*2,'5.4-B10':[.5,1],'5.4-C2':[math.asin(4/math.sqrt(35))]*2,
'5.5-A3':[15,10],'5.5-A4':[28,21],'5.5-A5':[4,14],'5.5-B1':[36,48],'5.5-B2':[42,30],'5.5-C1':[2,16]}
results=[]
for c in cards:
 key=f"{c['section']}-{c['level']}{c['number']}";part=c['part'];p=c['model']['points'];q=expected[key][part=='b'];sec=c['section'];num=c['number'];lev=c['level'];m=c['model'];names=m['faces'][0] if 'faces' in m else []
 if key=='5.1-A1':val=angle(sub(p['S'],p['A']),sub(p['O'],p['A']))
 elif key in ['5.1-A13','5.3-A8']:val=sum(polygonArea(p,f) for f in m['faces'][1:])
 elif key in ['5.1-A19','5.3-A10','5.3-A12','5.4-A8']:val=polygonArea(p,names)*p['S'][2]/3
 elif key=='5.1-B2':val=angle(sub(p['S'],p['A']),sub(p['C'],p['B']))
 elif key=='5.1-B9':val=area(p['S'],p['A'],p['M'])
 elif key=='5.1-C6':val=plandist(p['A' if part=='a' else 'B'],p['U'],p['V'],p['M'])
 elif key=='5.2-A1':val=angle(sub(p['B'],p['A']),sub(p['S'],p['A'])) if part=='a' else angle(sub(p['A'],p['S']),sub(p['B'],p['S']))
 elif key=='5.2-A12':val=dist(p['S'],p['A'])
 elif key=='5.2-A18':val=sum(polygonArea(p,f) for f in m['faces'])
 elif key=='5.2-B1':val=dist(p['P'],p['K'])/dist(p['K'],p['D'])
 elif key=='5.2-B5':val=plandist(p['A' if part=='a' else 'E'],p['B'],p['P'],p['D'])
 elif key=='5.2-C6':val=plandist(p['A'],p['S'],p['B'],p['C'])
 elif key=='5.3-B5':val=angle(sub(p['B'],p['S']),sub(p['E'],p['A']))
 elif key=='5.3-B6':val=linedist(p['S'],p['B'],p['F']) if part=='a' else linedist(p['B'],p['S'],p['A'])
 elif key=='5.3-C4':
  val=plandist(p['C'],p['S'],p['A'],p['B']);n=cross(sub(p['S'],p['A']),sub(p['B'],p['A']));assert abs(angle(n,[0,0,1])-math.pi/3)<1e-9
 elif key=='5.4-A1':val=dist(p['S'],p['B'])
 elif key=='5.4-A15':val=area(p['A'],p['B'],p['C'])*p['D'][2]/3
 elif key=='5.4-B9':val=angle(sub(p['B'],p['S']),sub(p['D'],p['A']))
 elif key=='5.4-B10':val=dist(p['M'],p['K'])/dist(p['K'],p['A' if part=='a' else 'C'])
 elif key=='5.4-C2':
  n=cross(sub(p['M'],p['A']),sub(p['C'],p['A']));u=sub(p['P' if part=='a' else 'K'],p['D']);val=math.asin(abs(dot(u,n))/(norm(u)*norm(n)))
 elif key=='5.5-A3':val=area(p['A'],p['B'],p['C'])*2*dist(p['O'],p['H'])/3
 elif key=='5.5-A4':val=area(p['A'],p['B'],p['C'])*p['S'][2]/3/2
 elif key=='5.5-A5':val=area(p['A'],p['B'],p['C'])*p['C1'][2]*2/3
 elif key in ['5.5-B1','5.5-B2']:val=polygonArea(p,names)*p['S'][2]
 elif key=='5.5-C1':val=dist(p['_i0'],p['_i1'])*dist(p['_i0'],p['_i3'])*dist(p['_i0'],p['_i4'])
 assert abs(val-q)<1e-7,(key,part,val,q)
 results.append({'id':key+'-'+part,'calculated':val,'expected':q,'pass':True})
print('Independent coordinate checks:',len(results))

# Independent neutral-view audit against source-given objects. Geometric answer
# calculations above deliberately remain independent of these display checks.
givens={
 '5.1-A19':(['O'],[['S','O']],[]),
 '5.1-B2':(['M','N'],[['M','N']],['K']),
 '5.1-B9':(['H'],[['S','H']],['M']),
 '5.1-C6':(['M','N'],[['M','N']],['O','E','H','U','V','K']),
 '5.2-A12':(['O'],[['S','O'],['B','D']],[]),
 '5.2-B1':(['T','K'],[['A','T'],['B','D']],['O','X','L']),
 '5.2-B5':([], [['A','C'],['B','D'],['P','A']],['O']),
 '5.2-C6':([],[],[]),
 '5.3-B5':([], [['S','B'],['A','E']],[]),
 '5.3-B6':(['G'],[],['H']),
 '5.3-C4':([], [['S','E']],['K','T']),
 '5.4-A8':(['O'],[['S','O']],[]),
 '5.4-B9':([], [['S','B'],['A','D']],[]),
 '5.4-B10':(['P'],[],['K']),
 '5.4-C2':([],[],['Q']),
 '5.5-A3':(['O'],[['O',n] for n in 'ABCD'],['H']),
 '5.5-A4':(list('KLMNPQ'),[],[]),
 '5.5-A5':([], [['A1','C'],['B1','C']],[]),
 '5.5-B1':(['S','K','L','M'],[],[]),
 '5.5-B2':(['S','K','L','M','N'],[],[]),
 '5.5-C1':(['K','L'],[['K','L']],['_i'+str(i) for i in range(8)])}
neutral_count=0
for c in cards:
 key=f"{c['section']}-{c['level']}{c['number']}"
 if key not in givens:continue
 neutral_count+=1
 m=c['model'];p=m['points'];v=m['views']['neutral'];poly=v.get('polygon',[])
 visible=set(m.get('labelNames',[]))|set(v.get('points',[]))|set(poly)
 edges={frozenset(e) for e in m['edges']+v.get('segments',[])}
 for e in v.get('segments',[]):visible.update(e)
 for i,n in enumerate(poly):edges.add(frozenset((n,poly[(i+1)%len(poly)])))
 wanted,segments,hidden=givens[key]
 assert set(wanted)<=visible,(key,c['part'],'missing given points',set(wanted)-visible)
 assert not set(hidden)&visible,(key,c['part'],'premature constructions',set(hidden)&visible)
 assert all(frozenset(e) in edges for e in segments),(key,c['part'],'missing given segment')
 if key in ['5.1-B9','5.1-C6','5.2-B1','5.2-B5','5.2-C6','5.3-C4','5.4-B10','5.4-C2','5.5-A5']:
  assert len(poly)>=3 and polygonArea(p,poly)>1e-9,(key,'given plane not visible')
 if key=='5.1-C6':
  n=cross(sub(p[poly[1]],p[poly[0]]),sub(p[poly[2]],p[poly[0]]))
  assert abs(n[2])<1e-9 and abs(dot(n,sub(p['N'],p['M'])))<1e-9
 if key=='5.2-B1':
  n=cross(sub(p[poly[1]],p[poly[0]]),sub(p[poly[2]],p[poly[0]]))
  assert abs(dot(n,sub(p['D'],p['B'])))<1e-9
 if key=='5.2-B5' and c['part']=='b':assert 'E' in visible
 if key=='5.3-B6':assert frozenset(['B','F'] if c['part']=='a' else ['S','A']) in edges
 if key=='5.4-B10' and c['part']=='a':assert 'Q' in visible
 if key=='5.4-C2':
  q='P' if c['part']=='a' else 'K';assert q in visible and frozenset(['D',q]) in edges
 if key=='5.5-A4':
  assert len([e for e in edges if e<=set('KLMNPQ')])==12
 if key in ['5.5-B1','5.5-B2']:
  base=list('KLM') if key.endswith('B1') else list('KLMN')
  assert set(base)<=set(poly) and all(frozenset(['S',k]) in edges for k in base)
 if key=='5.5-C1':
  assert len([e for e in edges if all(k.startswith('_') for k in e)])==12
assert neutral_count==42
print('Independent source-given neutral-view checks:',neutral_count)

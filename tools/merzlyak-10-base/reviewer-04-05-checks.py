"""Independent reviewer checks: JSON only, never import the author generator.

This supplements the source-image and line-by-line proof review. It is not a
release approval. Section planes are derived from source givens, not from the
claimed final section, before clipping every original solid edge.
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / 'stereo-course/merzlyak-10-base/lessons'
COUNT = 0

def check(condition, context=''):
    global COUNT
    COUNT += 1
    assert condition, context

def close(a, b, context=''):
    check(abs(a-b) < 1e-7 * max(1, abs(a), abs(b)), (context, a, b))

def subtract(a,b): return tuple(x-y for x,y in zip(a,b))
def dot(a,b): return sum(x*y for x,y in zip(a,b))
def cross(a,b): return (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
def length(v): return math.sqrt(dot(v,v))
def data(section, number, part=None):
    suffix = '-'+str(part) if part else ''
    return json.loads((DIR/f'ex-{section:02d}-{number:03d}{suffix}.json').read_text())
def points(section,number,part=None): return data(section,number,part)['visualization']['model']['points']
def v(p,a,b): return subtract(p[b],p[a])
def parallel(p,a,b,c,d): close(length(cross(v(p,a,b),v(p,c,d))),0,(a,b,c,d))
def on_line(p,x,a,b): parallel(p,a,x,a,b)
def distance(p,a,b): return math.dist(p[a],p[b])
def relation(p,a,b,c,d):
    w=cross(v(p,a,b),v(p,c,d))
    if length(w)<1e-7: return 'parallel'
    return 'intersecting' if abs(dot(w,v(p,a,c)))<1e-7 else 'skew'

files=sorted(DIR.glob('ex-0[45]-*.json'))
check(len(files)==72)
coverage=json.loads((ROOT/'tools/merzlyak-10-base/coverage-04-05.json').read_text())
check(len(coverage['entries'])==69)
check({e['exercise'] for e in coverage['entries']}=={f'{s}.{n}' for s,k in [(4,28),(5,41)] for n in range(1,k+1)})
for f in files:
    d=json.loads(f.read_text()); m=d['visualization']['model']; p=m['points']
    check(3<=len(d['steps'])<=7,f.name)
    check(all(step['view'] in m['views'] for step in d['steps']),f.name)
    check(d['source']['pdfPages']==[n+1 for n in d['source']['printedPages']],f.name)
    check(bool(d['help']),f.name)
    for q in p.values(): check(len(q)==3 and all(math.isfinite(x) for x in q),f.name)
    groups=m.get('edges',[]) + [e for w in m['views'].values() for e in w.get('segments',[])]
    for a,b in groups: check(a in p and b in p and distance(p,a,b)>1e-7,(f.name,a,b))
    for names in m.get('faces',[])+[w['polygon'] for w in m['views'].values() if w.get('polygon')]:
        check(len(set(names))==len(names),(f.name,names))
        a,b,c=names[:3]; normal=cross(v(p,a,b),v(p,a,c)); check(length(normal)>1e-7,(f.name,names))
        for name in names: close(dot(normal,v(p,a,name)),0,(f.name,names))

# Discriminating 3D examples: parallel, intersecting and skew are distinct.
p=points(4,4)
for pair,expected in [(('B','C','A1','C'),'intersecting'),(('A','B','C1','D1'),'parallel'),(('B','D','C','C1'),'skew'),(('A','B1','D','C1'),'parallel'),(('D','C1','B','B1'),'skew'),(('A','A1','C','C1'),'parallel')]:
    check(relation(p,*pair)==expected,pair)
for number,pair,expected,part in [(7,('A','D','B','C'),'skew',None),(9,('A','C','B','D'),'skew',None),(10,('A','C','B','D'),'parallel',None),(10,('A','C','B','D2'),'intersecting',None),(11,('P','Q','U','V'),'skew',1),(11,('U','V','P','Q'),'intersecting',2),(18,('B','D','C','E'),'skew',None),(19,('P','Q','R','S'),'skew',None),(19,('U','V','R','S'),'skew',None),(20,('A','B','O','P'),'intersecting',None),(20,('C','D','O','P'),'skew',None)]:
    check(relation(points(4,number,part),*pair)==expected,(number,part,pair))

# Exact givens and answers, including signed affine projection.
for n,part,relations in [(14,2,[('C','C1',5),('B','B1',10)]),(14,3,[('B','B1',28),('C','C1',12)]),(15,None,[('C','E',6),('E','D',9),('E','E1',12),('D','D1',30)]),(16,None,[('A','C',4),('B','C',8),('B1','C1',10),('A1','C1',5)]),(17,None,[('B','B1',18),('C','C1',15),('A','A1',12)]),(23,None,[('A','A1',16),('B','B1',8),('C','C1',4)]),(24,None,[('B','B1',10),('C','C1',4),('A','A1',6)]),(25,None,[('A','A1',17),('C','C1',13),('O','O1',12),('B','B1',9)]),(26,None,[('B','B1',26),('D','D1',9),('C','C1',35)])]:
    p=points(4,n,part)
    for a,b,target in relations: close(distance(p,a,b),target,(n,a,b))
    for a,b in [('A','B'),('B','C')]:
        if a+'1' in p and b+'1' in p: parallel(p,a,a+'1',b,b+'1')
p=points(4,24);close(distance(p,'A','C')/distance(p,'C','B'),5/3);check(p['A'][2]*p['C'][2]<0)
for n in [17,23]:
    p=points(4,n)
    for i in range(3):close(p['C'][i],(p['A'][i]+p['B'][i])/2)
p=points(4,28);on_line(p,'K','A','E');parallel(p,'M','F','A','K');close(distance(p,'B','K')/distance(p,'K','C'),.5)

# Section planes from the given points and/or required parallel directions.
sections={
 19:('M',('A','D'),('B','D'),'ABCD'),
 20:('E',('E','B'),('A','C'),'ABCD'),
 21:('M',('M','C1'),('A','B'),['A','B','C','A1','B1','C1']),
 22:('E',('E','F'),('D','D1'),['A','B','C','D','A1','B1','C1','D1']),
 30:('E',('E','F'),('E','M'),['A','B','C','D','A1','B1','C1','D1']),
 31:('E',('A','B'),('C','D'),'ABCD'),
 32:('M',('M','K'),('C','D'),'ABCD'),
 33:('M',('M','K'),('A','B'),'ABCD'),
 36:('E',('E','F'),('B1','D'),['A','B','C','D','A1','B1','C1','D1']),
 37:('M',('M','D'),('A','C1'),['A','B','C','D','A1','B1','C1','D1']),
 38:('M',('M','N'),('M','K'),['A','B','C','A1','B1','C1']),
 39:('B',('B','M'),('B','N'),'ABCDE'+ 'S')}
for number,(origin,d1,d2,body) in sections.items():
    m=data(5,number)['visualization']['model'];p=m['points']; normal=cross(v(p,*d1),v(p,*d2)); normal=tuple(x/length(normal) for x in normal)
    signed=lambda name:dot(normal,v(p,origin,name))
    hits=[]
    def remember(q):
        if all(math.dist(q,k)>1e-7 for k in hits):hits.append(q)
    original_edges={tuple(sorted((a,b))) for face in m['faces'] if set(face)<=set(body) for a,b in zip(face,face[1:]+face[:1])}
    for a,b in original_edges:
        if a not in body or b not in body:continue
        x,y=signed(a),signed(b)
        if abs(x)<1e-7: remember(p[a])
        if abs(y)<1e-7: remember(p[b])
        if x*y < -1e-12:
            remember([p[a][i]+x/(x-y)*(p[b][i]-p[a][i]) for i in range(3)])
    polygon=m['views']['section']['polygon'];check(len(polygon)==len(hits),(number,len(hits),polygon))
    for name in polygon:
        close(signed(name),0,(number,name))
        check(any(math.dist(p[name],h)<1e-7 for h in hits),(number,name))
    # Every consecutive side is on an actual solid face, hence the cyclic order is valid.
    for a,b in zip(polygon,polygon[1:]+polygon[:1]):
        found=False
        for face in m['faces']:
            q,r,s=face[:3];n=cross(v(p,q,r),v(p,q,s));
            if abs(dot(n,v(p,q,a)))<1e-7 and abs(dot(n,v(p,q,b)))<1e-7:found=True
        check(found,(number,a,b))

# Source-required direction/ratio and main numerical answers in paragraph 5.
p=points(5,13);close(distance(p,'A','A1')/distance(p,'A1','B'),7/5);close(distance(p,'A1','C1'),7.5)
p=points(5,14);close(distance(p,'C','F')/distance(p,'C','B'),3/11);close(distance(p,'A','E')/distance(p,'E','C'),8/3)
for n,expected in [(20,2+4*math.sqrt(3)),(22,4*(2+math.sqrt(2))),(30,60),(31,28)]:
    m=data(5,n)['visualization']['model'];p=m['points'];ns=m['views']['section']['polygon'];close(sum(distance(p,a,b) for a,b in zip(ns,ns[1:]+ns[:1])),expected,n)
for n in [34,35]:
    p=points(5,n)
    if n==34:
        on_line(p,'O','A','L');on_line(p,'O','D','M');parallel(p,'O','Q','A','A1')
    else:
        on_line(p,'P','A','F');on_line(p,'P','A1','E');parallel(p,'P','Q','A','D')
p=points(5,40);close(distance(p,'A','C'),20);close(distance(p,'A','O'),12);close(distance(p,'O','C'),8)
p=points(5,41);close(distance(p,'A','B')/distance(p,'C','D'),3/5);close(distance(p,'A','D')-distance(p,'B','C'),16);close(distance(p,'A','C'),13)
close((distance(p,'A','D')+distance(p,'B','C'))*distance(p,'A','B')/2,156)
# Recheck the author's resolution of R0405-003, not merely the final polygon.
p=points(5,38)
for x,a,b in [('T','M','N'),('T','M0','N0'),('U','N','K'),('U','N0','K0'),('X','A','C'),('Y','A','B'),('Z','B','C'),('P','X','M'),('R','X','M'),('P','Y','N'),('Q','Y','N'),('Q','Z','K'),('R','Z','K')]:on_line(p,x,a,b)
for x in 'XYZ':on_line(p,x,'T','U')
p=points(5,39)
for x,a,b in [('B','U','V'),('U','A','E'),('V','C','D'),('P','U','M'),('P','S','A'),('Q','V','N'),('Q','S','C')]:on_line(p,x,a,b)
parallel(p,'U','V','E','D')
for n,required in [(38,['trace','faces']),(39,['trace','construct'])]:
    d=data(5,n);m=d['visualization']['model']
    check(all(key in {s['view'] for s in d['steps']} for key in required))
    for w in m['views'].values():
        names=set(m['labelNames']+w.get('points',[])+w.get('polygon',[])+[n for e in w.get('segments',[]) for n in e])
        check(len(names)<=8,(n,w['label'],names))
print(f'PASS: {COUNT} reviewer assertions; 72 cards; 12 independently derived section planes.')

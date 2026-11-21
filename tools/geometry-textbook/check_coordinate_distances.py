"""Recalculate source lengths, coordinates, and perpendicular projections from the visible diagrams."""
import json
from itertools import product
from math import dist,isclose,sqrt
from coordinate_distances import ROOT

cards=json.loads((ROOT/'geometry-course/textbook/data/coordinate-distances.json').read_bytes())['lessons']
printed=[(1024,None),(1025,'а'),(1025,'б'),(1025,'в'),(1025,'г'),(1025,'д'),(1025,'е'),(1026,'а'),(1026,'б'),(1026,'в'),(1027,'а'),(1027,'б'),(1027,'в'),(1027,'г'),(1028,None),(1029,None)]
source_vec=[(5,9),(-3,4),(-10,-10),(10,17),(11,-11),(10,0)]
new_vec=[(2,3),(-4,3),(-3,-3),(4,-3),(2,-2),(-7,0)]
source_pairs=[((2,7),(-2,7)),((-5,1),(-5,-7)),((-3,0),(0,4)),((0,3),(-4,0))]
source_finals=[None,'√106','5','10√2','√389','11√2','10','2','3','√13','4','8','5','5',None,'√13']
source_probes=[['-7','3'],['106','13'],['25','25'],['200','18'],['389','25'],['242','8'],['100','49'],['4','25'],['9','16'],['13','41'],['0','9'],['-8','16'],['4','25'],['-3','25'],['98','82','10'],['-1','5']]
def near(a,b):return all(isclose(x,y,abs_tol=1e-6) for x,y in zip(a,b,strict=True))
def delta(a,b):return tuple(x-y for x,y in zip(a,b,strict=True))
def approx(s):
    if '√' not in s:return float(s)
    coeff,root=s.split('√');return int(coeff or 1)*sqrt(int(root))
view_count=angles=0
for i,(card,(n,part),final,probes) in enumerate(zip(cards,printed,source_finals,source_probes,strict=True)):
    s=card['source'];assert s['collection']=='main' and s['bookId']=='atanasyan-2023-7-9' and s['chapter']=='XI' and s['printedPages']==[257] and s['pdfPages']==[258] and int(s['exercise'])==n and s.get('subpart')==part
    inputs=[step['input']['accepted'][0] for step in card['steps'] if 'input' in step];assert inputs==probes,(card['id'],inputs,probes)
    if final:
        values=card['answer']['accepted'];assert values[0]==final and (f'sqrt({round(approx(final)**2)})' in values)
    else:assert card['answer']['mode']=='manual'
    model=card['visualization']['model'];unit=2 if n==1028 or n==1025 and max(map(abs,source_vec[i-1]))>6 else 1
    cases=[v['label'] for k,v in model['views'].items() if k.startswith('case-')];assert len(cases)==len(set(cases))
    for key,v in model['views'].items():
        view_count+=1;raw=model['points'];suffix='__v'+v['points'][0].split('__v')[-1];o=raw['O'+suffix];u=raw['_unitX'+suffix][0]-o[0];assert u>0 and isclose(raw['_unitY'+suffix][1]-o[1],u)
        xy=lambda k:tuple((x-y)*unit/u for x,y in zip(raw[k][:2],o[:2],strict=True))
        pts={name:xy(k) for k in v['points'] for name in model['labels'][k].split('=')}
        for mark in v['rightAngles']:
            origin=xy(mark['vertex']);a=delta(xy(mark['a']),origin);b=delta(xy(mark['b']),origin)
            assert isclose(sum(x*y for x,y in zip(a,b,strict=True)),0,abs_tol=1e-5) and any(abs(x)>1e-5 for x in a) and any(abs(x)>1e-5 for x in b);angles+=1
        if n==1024 and 'D' in pts:
            assert near(delta(pts['B'],pts['A']),delta(pts['C'],pts['B'])) and near(delta(pts['D'],pts['B']),delta(pts['C'],pts['D']))
            if key not in ('case-3','step-3'):assert near(pts['D'],(7.5,-5))
        if n==1025:
            vector=new_vec[i-1] if key in ('step-3','case-3') else source_vec[i-1]
            assert near(delta(pts['B'],pts['A']),vector)
            if key=='case-2':assert isclose(dist(pts['A'],pts['B']),approx(final))
        if n==1026 and key in ('case-2','step-2'):
            assert near(pts['M'],(3,-2));target={'а':'H','б':'K','в':'O'}[part];assert isclose(dist(pts['M'],pts[target]),approx(final))
            if part!='в':assert len(v['rightAngles'])==1
        if n==1027 and key not in ('case-3','step-3'):
            a,b=source_pairs['абвг'.index(part)];assert near(a,pts['A']) and near(b,pts['B']) and isclose(dist(a,b),approx(final))
        if n==1028 and key in ('neutral','step-4','case-4'):
            assert near(pts['M'],(4,0)) and near(pts['N'],(12,-2)) and near(pts['P'],(5,-9))
            perimeter=sum(dist(pts[k],pts[j]) for k,j in zip('MNP','NPM',strict=True));assert isclose(perimeter,2*sqrt(17)+7*sqrt(2)+sqrt(82))
        if n==1029:
            if 'M' in pts and 'B' in pts:assert near(delta(pts['M'],pts['B']),delta(pts['C'],pts['M']))
            if 'M' in pts and key not in ('case-3','step-3'):assert near(pts['M'],(3,-1)) and isclose(dist(pts['A'],pts['M']),sqrt(13))
checked=0
for ax,ay,bx,by in product(range(-3,4),repeat=4):
    assert isclose(dist((ax,ay),(bx,by))**2,(bx-ax)**2+(by-ay)**2,abs_tol=1e-9);checked+=1
print(f'COORDINATE_DISTANCES_OK {len(cards)} exact source lessons, {view_count} measured figures, {angles} perpendiculars, 14 numerical/radical final results, all signed and zero cases in {checked} distance checks.')

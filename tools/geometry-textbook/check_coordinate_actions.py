"""Use fixed transcriptions for every printed subpart and remeasure the source arrows."""
import json
from itertools import combinations,product
from coordinate_actions import ROOT
from vector_model_measurements import close,determinant,eq,minus,plus
from vector_scaling import scale

cards=json.loads((ROOT/'geometry-course/textbook/data/coordinate-actions.json').read_bytes())['lessons']
dataset={1009:[((3,2),(2,5)),((3,-4),(1,5)),((-4,-2),(5,3)),((2,7),(-3,-7))],
         1010:[((5,3),(2,1)),((3,2),(-3,2)),((3,6),(4,-3)),((-5,-6),(2,-4))],
         1013:[[(3,(2,-5)),(-3,(-5,2))],[(2,(4,1)),(-3,(1,2)),(4,(2,7))],[(3,(-7,-1)),(-2,(-1,7)),(-.5,(4,-6))],[(1,(7,-2)),(-1,(2,5)),(-1,(-3,3))]]}
expected=[(n,k) for n in range(1009,1016) for k in ('абвг' if n in dataset else [None])]
assert [(int(c['source']['exercise']),c['source'].get('subpart')) for c in cards]==expected
all_probes=[('7','1'),('1','1'),('1','-3'),('0','4'),('2','-7'),('0','-5'),('9','6'),('-2','2'),('-6','-8'),('2','8'),('7','9'),('28','-9'),('3','7'),('3','3'),('-2','0'),('2','21')]
given1012=[(2,4),(-2,0),(0,0),(-2,-3),(2,-3),(0,5)]
given1015=[(3,7),(-2,1),(6,14),(2,-1),(2,4)]
views=arrows=0
for card,probes in zip(cards,all_probes,strict=True):
    s=card['source'];n=int(s['exercise']);part=s.get('subpart');idx='абвг'.index(part) if part else 0
    assert (s['bookId'],s['chapter'],s['printedPages'],s['pdfPages'])==('atanasyan-2023-7-9','XI',[252],[253])
    assert [step['input']['accepted'][0] for step in card['steps'] if step.get('input')]==list(probes)
    if n in dataset:
        data=dataset[n][idx]
        moves=([data[0],scale(1 if n==1009 else -1,data[1])] if n in (1009,1010) else [scale(k,a) for k,a in data])
        result=tuple(map(sum,zip(*moves)));assert tuple(map(int,card['answer']['accepted'][0].split(';')))==result
    else: assert card['answer']['mode']=='manual'
    model=card['visualization']['model']
    for view,draw in model['views'].items():
        suffix='__v'+draw['points'][0].split('__v')[1]
        pos=model['points'];o=pos['O'+suffix];unit=pos['_unitX'+suffix][0]-o[0];size=5 if n==1013 else 2 if n==1015 else 1
        vec=lambda p,q:tuple((v-u)*size/unit for u,v in zip(pos[p][:2],pos[q][:2],strict=True))
        heads=[(p,q) for p,q in draw['highlightSegments'] if q.startswith('head_')]
        shafts=[(p,q) for p,q in draw['highlightSegments'] if not q.startswith('head_')];assert len(heads)==2*len(shafts)
        vectors=[vec(p,q) for p,q in shafts];arrows+=len(vectors);views+=1
        if n in dataset and view=='case-3':
            assert len(vectors)==len(moves)+1
            assert all(eq(v,w) for v,w in zip(vectors,moves+[result],strict=True))
        elif n==1011 and view.startswith('case-'):
            k=(2,3,-1,-3)[int(view.split('-')[1])-1];assert eq(vectors[0],(3,2)) and eq(vectors[1],scale(k,(3,2)))
        elif n==1012 and view.startswith('case-'):
            a=given1012[int(view.split('-')[1])-1]
            if a==(0,0):assert not vectors
            else:assert eq(vectors[0],a) and eq(vectors[1],scale(-1,a))
        elif n==1014 and view.startswith('case-'):
            if view=='case-3':assert len(vectors)==1
            else:assert close(determinant(*vectors),0)
        elif n==1015 and view=='neutral':
            assert all(eq(v,a) for v,a in zip(vectors,given1015,strict=True))
matches=[pair for pair in combinations(range(5),2) if determinant(given1015[pair[0]],given1015[pair[1]])==0]
assert matches==[(0,2),(1,3)]
tested=0
for ax,ay,bx,by in product(range(-3,4),repeat=4):
    a,b=(ax,ay),(bx,by)
    if b==(0,0):collinear=True
    else:
        k=ax/bx if bx else ay/by;collinear=eq(a,scale(k,b))
    assert collinear==(determinant(a,b)==0);tested+=1
print(f'COORDINATE_ACTIONS_OK {len(cards)} source cards, {views} views, {arrows} measured source arrows, 12 graded ordered pairs, all 10 candidate pairs in 1015, {tested} axis/zero collinearity cases.')

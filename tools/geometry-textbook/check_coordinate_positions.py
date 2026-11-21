"""Remeasure all authored plots, including the original ship's offset and both square labellings."""
import json
from itertools import product
from math import dist, isclose
from coordinate_positions import ROOT

cards = json.loads((ROOT/'geometry-course/textbook/data/coordinate-positions.json').read_bytes())['lessons']
# Order, original subparts, original page spans, saved correct answers on the two embedded tasks.
transcription = [(95,None,[252,253,254],['5','7']), (96,None,[254,255],['5','-6']),
                 (1016,'а',[255],['0','4']), (1016,'б',[255],['4','2,5']), (1017,None,[256],['75','50']),
                 (1018,None,[256],['3','8']), (1019,None,[256],['-3','6']), (1020,None,[256],['7','3'])]

def close(p,q):
    return all(isclose(a,b,abs_tol=1e-6) for a,b in zip(p,q,strict=True))

def diff(p,q):
    return tuple(x-y for x,y in zip(p,q,strict=True))

def mid(p,q):
    return tuple((x+y)/2 for x,y in zip(p,q,strict=True))

views=marks=shafts=0
for card,(n,part,pages,probes) in zip(cards,transcription,strict=True):
    s=card['source']; theory=n<100
    assert s['bookId']=='atanasyan-2023-7-9' and s['chapter']=='XI'
    assert s['collection']==('theory' if theory else 'main') and int(s['point' if theory else 'exercise'])==n
    assert s.get('subpart')==part and s['printedPages']==pages and s['pdfPages']==[i+1 for i in pages]
    assert [step['input']['accepted'][0] for step in card['steps'] if 'input' in step]==probes
    if n in (1017,1020):assert card['answer']['accepted'][0]==('100;75' if n==1017 else '7;-3')
    elif not theory:assert card['answer']['mode']=='manual'
    model=card['visualization']['model'];scale=25 if n==1017 else 1
    cases=[view['label'] for key,view in model['views'].items() if key.startswith('case-')]
    assert len(cases)==len(set(cases))
    for key,view in model['views'].items():
        raw=model['points']; suffix='__v'+view['points'][0].split('__v')[1];O=raw['O'+suffix];unit=raw['_unitX'+suffix][0]-O[0]
        assert unit>0 and isclose(raw['_unitY'+suffix][1]-O[1],unit)
        vertex={k.split('__v')[0]:tuple((v-w)*scale/unit for v,w in zip(raw[k][:2],O[:2],strict=True)) for k in view['points']}
        assert all(13.9<=raw[k][0]<=86.1 and 9.9<=raw[k][1]<=60.1 for k in view['points'])
        for m in view['rightAngles']:
            vo=raw[m['vertex']];u=diff(raw[m['a']],vo);v=diff(raw[m['b']],vo)
            assert any(abs(t)>1e-5 for t in u) and any(abs(t)>1e-5 for t in v)
            assert isclose(sum(x*y for x,y in zip(u,v,strict=True)),0,abs_tol=1e-7);marks+=1
        arrows=[(a,b) for a,b in view['highlightSegments'] if not b.startswith('head_')]
        assert len(view['highlightSegments'])==3*len(arrows);shafts+=len(arrows);views+=1
        if n==95 and key=='case-2':
            assert close(diff(vertex['B'],vertex['A']),(5,-2))
        if n==96 and key.startswith('case-'):
            if key=='case-1':assert close(mid(vertex['A'],vertex['B']),vertex['M'])
            if key=='case-2':assert isclose(dist(vertex['O'],vertex['P']),5)
            if key=='case-3':assert isclose(dist(vertex['A'],vertex['B']),5)
        if n==1016:
            assert isclose(vertex['A'][1],0) and isclose(vertex['B'][0],0) and vertex['A'][0]>0 and vertex['B'][1]>0
            if part=='а' and key!='step-3' and key!='case-3':assert close(vertex['A'],(5,0)) and close(vertex['B'],(0,3))
            if 'C' in vertex:assert close(vertex['C'],(vertex['A'][0],vertex['B'][1]))
        if n==1017 and 'B' in vertex:
            assert close(diff(vertex['K'],vertex['A']),(100,0)) and close(diff(vertex['B'],vertex['K']),(0,75))
            assert close(diff(vertex['B'],vertex['A']),(100,75))
            if key!='case-3':assert close(vertex['A'],(30,0))
        if n==1018:
            assert close(vertex['P'],(-3,3)) and close(vertex['M'],(3,-3))
            if 'N' in vertex:
                assert close(vertex['N'],(-3,-3) if key=='case-3' else (3,3))
                assert close(mid(vertex['N'],vertex['Q']),vertex['O'])
                assert all(isclose(dist(vertex[v],vertex[w]),6) for v,w in zip('MNPQ','NPQM',strict=True))
        if n==1019:
            assert close(mid(vertex['A'],vertex['B']),vertex['O']) and isclose(vertex['C'][0],0)
            assert isclose(dist(vertex['A'],vertex['C']),dist(vertex['B'],vertex['C']))
        if n==1020 and 'D' in vertex:
            assert close(vertex['D'],(7,-3)) and close(diff(vertex['D'],vertex['O']),diff(vertex['C'],vertex['B']))
            assert close(diff(vertex['C'],vertex['D']),diff(vertex['B'],vertex['O']))

count=0
for ax,ay,bx,by in product(range(-3,4),repeat=4):
    a,b=(ax,ay),(bx,by);vector=diff(b,a);m=mid(a,b)
    assert close(diff(m,a),diff(b,m)) and isclose(dist(a,b),dist(vector,(0,0)));count+=1
print(f'COORDINATE_POSITIONS_OK {len(cards)} source lessons, {views} grid views, {marks} orthogonal markers, {shafts} directed arrows, {count} midpoint/distance cases including coincident points.')

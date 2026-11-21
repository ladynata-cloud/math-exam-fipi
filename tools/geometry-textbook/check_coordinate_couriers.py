"""Enumerate every possible delivery order and remeasure every directional edge of the two maps."""
import json
from collections import Counter
from itertools import permutations
from math import dist,isclose
from coordinate_couriers import ROOT

cards=json.loads((ROOT/'geometry-course/textbook/data/coordinate-couriers.json').read_bytes())['lessons']
# Independent transcriptions of Fig. 316 and 317; printed scale bar spans one square.
points={'B':(0,1),'K':(-8,1),'T':(8,1),'M':(0,7),'F':(0,-5)}
expected_routes={1036:{'case-2':'BKMTB','case-3':'BMKTB','case-4':'BKMTB','step-2':'BKMTB','step-3':'BMKTB','step-4':'BKMTB'},
                 1037:{'case-2':'BKMTFB','case-3':'BKMFTB','case-4':'BKTFMB','case-5':'BKMTFB','step-2':'BKMTFB','step-3':'BKMFTB','step-4':'BKMTFB'}}
view_count=arrows=0
for c,n,locations,distribution,answers in zip(cards,(1036,1037),('KMT','KMTF'),({36:2,40:4},{44:8,48:8,52:8}),(['36','40','1800'],['44','48','2200']),strict=True):
    s=c['source'];base=[257,258] if n==1036 else [258,259]
    assert s['bookId']=='atanasyan-2023-7-9' and s['chapter']=='XI' and s.get('subpart') is None and int(s['exercise'])==n and s['printedPages']==base and s['pdfPages']==[x+1 for x in base]
    lengths=Counter()
    for order in permutations(locations):
        route=('B',*order,'B');length=sum(dist(points[a],points[b]) for a,b in zip(route,route[1:]));assert length.is_integer();lengths[int(length)]+=1
    assert lengths==distribution and str(min(lengths)*100)==c['answer']['accepted'][0]
    assert [step['input']['accepted'][0] for step in c['steps'] if 'input'in step]==answers
    model=c['visualization']['model'];labels={'П':'B','Ск':'B','К':'K','М':'M','С':'T','Кд':'F'}
    for key,v in model['views'].items():
        view_count+=1;raw=model['points'];suffix='__v'+v['points'][0].split('__v')[-1];origin=raw['O'+suffix];unit=raw['_unitX'+suffix][0]-origin[0];assert unit>0 and isclose(raw['_unitY'+suffix][1]-origin[1],unit)
        position=lambda k:tuple((x-y)/unit for x,y in zip(raw[k][:2],origin[:2],strict=True))
        pts={labels[model['labels'][k]]:position(k) for k in v['points'] if model['labels'][k] in labels}
        half=key=='step-4' or key==('case-4' if n==1036 else 'case-5')
        for k,p in pts.items():
            x,y=points[k];exp=(x/2,1+(y-1)/2) if half else (x,y);assert all(isclose(a,b,abs_tol=1e-6) for a,b in zip(p,exp,strict=True))
        assert set(pts)==set('B'+locations)
        shafts=[(a,b) for a,b in v['highlightSegments'] if not b.startswith('head_')];assert len(v['highlightSegments'])==3*len(shafts);arrows+=len(shafts)
        wanted=expected_routes[n].get(key)
        if not wanted:assert not shafts;continue
        route=''.join(labels[model['labels'][a]] for a,_ in shafts)+labels[model['labels'][shafts[-1][1]]]
        assert route==wanted and set(route[1:-1])==set(locations) and len(route)==len(locations)+2
        assert all(shafts[j][1]==shafts[j+1][0] for j in range(len(shafts)-1))
        measured=sum(dist(position(a),position(b)) for a,b in shafts)
        if half:assert isclose(measured,min(lengths)/2)
        else:assert round(measured) in lengths and isclose(round(measured),measured)
    assert min(distribution)*100==int(c['answer']['accepted'][0]);assert max(distribution)>min(distribution)
print(f'COORDINATE_COURIERS_OK both source maps and scales, 6+24 distinct delivery orders, {view_count} measured views, {arrows} directed route edges, return to base, outcomes 3600 m and 4400 m, two new half-size maps.')

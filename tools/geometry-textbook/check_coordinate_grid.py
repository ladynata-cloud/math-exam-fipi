"""Measure the new grids as rendered, including non-origin arrow tails on figure 309."""
import json
from math import sqrt
from coordinate_grid import ROOT
from vector_model_measurements import close,eq

cards=json.loads((ROOT/'geometry-course/textbook/data/coordinate-grid.json').read_bytes())['lessons']
ids=[(int(c['source']['exercise']),c['source'].get('subpart')) for c in cards]
assert ids==[(1004,None),(1005,None),(1006,None)]+[(1007,k) for k in 'абвгд']+[(1008,k) for k in 'абвг']
original={1004:[((0,0),(3,0)),((0,0),(2,-1)),((0,0),(0,-3)),((0,0),(1,1)),((0,0),(2,sqrt(2)))],
          1005:[((0,0),(2,3)),((0,0),(-2,3)),((0,4),(2,4)),((0,0),(-3,-4)),((0,0),(2,-2)),((0,5),(-4,0))],
          1006:[((0,0),(2,3)),((0,0),(-.5,2)),((0,0),(8,0)),((0,0),(1,-1)),((0,0),(0,-2)),((0,0),(-1,0))]}
entries={1007:[(-3,.2),(-2,-3),(-1,0),(0,3),(0,1)],1008:[(5,-2),(-3,7),(-4,0),(0,0)]}
views=arrows=lines=0
for c in cards:
    source=c['source'];n=int(source['exercise']);page=251 if n<1006 else 252
    assert (source['chapter'],source['printedPages'],source['pdfPages'])==('XI',[page],[page+1])
    model=c['visualization']['model']
    assert c['answer']['mode']==('exact' if n==1008 else 'manual') and len([s for s in c['steps'] if s.get('input')])==2
    for name,view in model['views'].items():
        idx=view['points'][0].split('__v')[1];coords=model['points'];suffix='__v'+idx
        origin=coords['O'+suffix]
        unit=coords['_unitX'+suffix][0]-origin[0]
        assert unit>0 and close(coords['_unitY'+suffix][1]-origin[1],unit)
        def cart(key):return tuple((x-y)/unit for x,y in zip(coords[key][:2],origin[:2],strict=True))
        for a,b in view['dashSegments']:
            if a.startswith('_gx'):assert close(cart(a)[0],cart(b)[0]) and close(cart(a)[0],round(cart(a)[0]))
            else:assert a.startswith('_gy') and close(cart(a)[1],cart(b)[1]) and close(cart(a)[1],round(cart(a)[1]))
        assert view['segments'][0]==['_left'+suffix,'X'+suffix] and view['segments'][1]==['_base'+suffix,'Y'+suffix]
        assert cart('X'+suffix)[0]>0 and cart('Y'+suffix)[1]>0
        shafts=[e for e in view['highlightSegments'] if not e[1].startswith('head_')]
        heads=[e for e in view['highlightSegments'] if e[1].startswith('head_')]
        assert len(heads)==2*len(shafts)
        for j,(a,b) in enumerate(shafts):
            l,r=heads[2*j:2*j+2];assert l[0]==r[0]==b and l[1].endswith('_l') and r[1].endswith('_r')
            assert not eq(cart(a),cart(b))
        if name.startswith('case') and n in original:
            index=int(name.split('-')[1])-1
            if n==1004 and index==0:
                assert len(shafts)==2 and eq(cart(shafts[0][1]),(1,0)) and eq(cart(shafts[1][1]),(0,1))
            else:
                start,finish=original[n][index-(1 if n==1004 else 0)]
                assert len(shafts)==1 and eq(cart(shafts[0][0]),start) and eq(cart(shafts[0][1]),finish)
        if n in entries and name in ('neutral','case-1'):
            xy=entries[n]['абвгд'.index(source['subpart'])]
            if xy==(0,0):assert not shafts
            else:assert len(shafts)==1 and eq(cart(shafts[0][1]),xy)
        lines+=len(view['dashSegments']);arrows+=len(shafts);views+=1
assert all(original[1005][i][0]!=(0,0) for i in (2,5))
print(f'COORDINATE_GRID_OK {len(cards)} source cards, {views} views, {arrows} original directed arrows, {lines} measured integer grid lines, all 6 figure-309 displacements.')

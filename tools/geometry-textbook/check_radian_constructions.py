"""Measure every tick relative to TA, the six constructed target rays, and rotated transfers."""
import json
from math import atan2,hypot,isclose,pi

from radian_constructions import OUT


def near(a,b):return isclose(a,b,abs_tol=.00005)
def dist(a,b):return hypot(a[0]-b[0],a[1]-b[1])


rows=json.loads(OUT.read_bytes())['lessons'];targets=[60,45,90,30,180,120];transfers=[30,90,45,60,90,60]
tick_count=ray_count=0
for i,c in enumerate(rows):
    s=c['source'];assert s['chapter']=='XIII' and s['printedPages']==[308] and s['pdfPages']==[309] and s['exercise']=='1204' and s['subpart']=='абвгде'[i]
    assert c['answer']['mode']=='manual' and c['steps'][1]['input']['accepted'][0]==str(targets[i])
    m=c['visualization']['model'];points=m['points']
    for key,v in m['views'].items():
        ids={m['labels'][k]:k for k in v['points']};p=lambda ref:points[ref]
        active=key.endswith(('2','3'));turned=key.endswith('3')
        t=p(ids['T']);a=p(ids['A']);start=atan2(a[1]-t[1],a[0]-t[0]);r=dist(a,t)
        assert near(start*180/pi,15 if turned else 0)
        assert set(str(d)+'°' for d in range(0,181,30))<=set(ids)
        def relative(v):return (atan2(v[1]-t[1],v[0]-t[0])-start+2*pi)%(2*pi)
        tks=[(a,b) for a,b in v['segments'] if a.startswith('_tick')]
        assert len(tks)==37
        for j,(inner,outer) in enumerate(tks):
            deg=relative(p(outer))*180/pi
            if near(deg,360):deg=0
            assert near(deg,5*j) and near(dist(p(outer),t),r)
            assert near(dist(p(inner),t)/r,.88 if j%6==0 else .92 if j%2==0 else .965)
            tick_count+=1
        for d in range(0,181,30):
            deg=relative(p(ids[str(d)+'°']))*180/pi
            if near(deg,360):deg=0
            assert near(deg,d)
        if not active:
            assert 'B' not in ids and not v['highlightSegments']
            continue
        assert 'B' in ids;expected=(transfers if turned else targets)[i];assert near(relative(p(ids['B']))*180/pi,expected)
        curve=v['highlightSegments'][:-1];assert len(curve)==int(expected/2.5)
        assert curve[0][0]==ids['A'] and curve[-1][-1]==ids['B']
        assert v['highlightSegments'][-1]==[ids['T'],ids['B']]
        ray_count+=1
assert len(rows)==6 and tick_count==1554 and ray_count==24
print('RADIAN_CONSTRUCTIONS_OK six source targets,',tick_count,'protractor ticks measured,',ray_count,'target rays checked on level and rotated baselines.')

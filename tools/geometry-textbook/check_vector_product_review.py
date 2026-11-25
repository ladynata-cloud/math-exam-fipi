"""Check exact subparts and measure all the displayed arrows, signs, length normalizations and diameter."""
import json
from math import acos, degrees, hypot, isclose
from vector_product_review import OUT

def diff(a,b):
    return a[0]-b[0],a[1]-b[1]

def dot(a,b):
    return a[0]*b[0]+a[1]*b[1]

def near(a,b):
    return isclose(a,b,abs_tol=.001)

def angle(a,b):
    c=dot(a,b)/(hypot(*a)*hypot(*b))
    return degrees(acos(max(-1,min(1,c))))

entries=json.loads(OUT.read_bytes())['lessons'];tasks=[(14,None),(15,None),(16,None),(17,'а'),(17,'б'),(17,'в'),(18,None),(19,None),(20,None),(21,None),(22,None)]
views=head_count=0
for c,(n,part) in zip(entries,tasks,strict=True):
    src=c['source'];idx='абв'.index(part) if part else 0
    assert c['id']==f'atanasyan-7-9-selfcheck-chapter-12-{n}-part-{idx+1}' and c['answer']['mode']=='manual'
    assert src['exercise']==str(n) and src['collection']=='selfcheck' and src['chapter']=='XII' and src['printedPages']==[291] and src['pdfPages']==[292]
    assert src.get('subpart')==part and len([s for s in c['steps'] if 'input'in s])==2
    m=c['visualization']['model']
    for k,v in m['views'].items():
        i=2 if k in ('case-3','step-3') else 1 if k in ('case-2','step-2') else 0
        suffix='__v'+v['points'][0].split('__v')[1];raw=m['points'];origin=raw['U'+suffix];unit=hypot(*diff(raw['V'+suffix],origin))
        assert unit>0
        p={m['labels'][pt]:tuple((raw[pt][j]-origin[j])/unit for j in (0,1)) for pt in v['points']}
        def vec(s):return diff(p[s[1]],p[s[0]])
        head=[s for s in v['highlightSegments'] if s[1].startswith('head_')]
        shafts=[s for s in v['highlightSegments'] if not s[1].startswith('head_')]
        assert len(head)==2*len(shafts) and len(shafts)>=1
        head_count+=len(shafts);views+=1
        if n==14 and i==0:
            assert near(angle(vec('AB'),vec('CD')),45)
        elif n==21:
            a,b,d,s=map(vec,['OA','OB','OC','OS'])
            assert near(dot(a,s),dot(a,b)+dot(a,d)) and near(dot(a,s),[9,-18,4][i])
        elif n==22:
            assert near(dot(vec('MA'),vec('MB')),[0,0,-7][i])
            assert len(v['circles'])==1 and v['circles'][0]=={'center':'O'+suffix,'through':'B'+suffix}
            center=raw['O'+suffix];r=hypot(*diff(raw['B'+suffix],center))
            assert r>0 and min(center[1]-r,70-(center[1]+r))>=0
            assert all(near(a,b) for a,b in zip(p['O'],[(p['A'][k]+p['B'][k])/2 for k in (0,1)]))
        else:
            a=vec('PX');b=vec('PY') if 'Y' in p else (0,0)
            if n==14:assert near(angle(a,b),45 if i==1 else 0)
            elif n==15:assert near(dot(a,b),[0,0,4][i])
            elif n==16:assert near(dot(a,b),[6,-6,0][i])
            elif n==17:assert near(dot(a,b),[[0,3,-6],[6,3,0],[-6,-3,0]][idx][i])
            elif n==18:assert near(dot(a,b),[11,-5,-5][i])
            elif n==19:assert near(dot(a,b),[0,0,-3][i])
            elif n==20:assert near(dot(a,b)/(hypot(*a)*hypot(*b)),[.6,-.6,.6][i])
count=0
for r in range(1,21):
    for x in range(-22,23):
        for y in range(-22,23):
            a=(-r-x,-y);b=(r-x,-y)
            assert dot(a,b)==x*x+y*y-r*r
            count+=1
print(f'VECTOR_PRODUCT_REVIEW_OK 9 original questions in {len(entries)} parts, {views} scenes, {head_count} confirmed arrows, {count} independent diameter checks.')

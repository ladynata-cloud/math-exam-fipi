"""Check all mapped points in the rendered coordinate system and both directions of the line results."""
import json
from math import dist, isclose
from plane_isometries import OUT

lessons=json.loads(OUT.read_bytes())['lessons']
sources=[
    ('theory','122',None,[313,314]), ('theory','123',None,[314,315,316]),
    ('theory','124',None,[316,317,318]), ('main','1240','а',[318]),
    ('main','1240','б',[318]), ('main','1241','а',[318]), ('main','1241','б',[318])]
expected_first = {'1240':([2,2,-3],[2,-1,3]), '1241':([2,2,-3],[0,1,2])}
assert len(lessons)==len(sources)
total=0


def close(x,y):
    return isclose(x,y,abs_tol=1e-6,rel_tol=1e-6)


def aligned(a,b,c):
    return close((b[0]-a[0])*(c[1]-a[1]),(b[1]-a[1])*(c[0]-a[0]))


for card,(collection,n,part,pages) in zip(lessons,sources,strict=True):
    src=card['source']
    assert (src['collection'],src['chapter'],src.get('exercise',src.get('point')),src.get('subpart'))==(collection,'XIV',n,part)
    assert src['printedPages']==pages and src['pdfPages']==[p+1 for p in pages]
    m=card['visualization']['model']
    assert sum('input' in s for s in card['steps'])==2
    for key,s in m['views'].items():
        idx=int(key[-1])-1 if key[-1].isdigit() else 0
        labels={l:k for k in s['points'] for l in m['labels'][k].split('=')}
        p=lambda label:m['points'][labels[label]][:2]
        unit=dist(p('U'),p('W'))
        length=lambda a,b:dist(p(a),p(b))/unit
        if n=='124' and idx>0:
            assert close(length('A','M'),length('A','N')) and close(length('B','M'),length('B','N'))
            for label,val in zip('MN',[(2,26),(5,37)][idx-1],strict=True):
                assert close(length('C',label)**2,val)
            assert not aligned(p('A'),p('B'),p('C'))
        else:
            x0,y0=p('T');axis='K' in labels
            for l in ('A','B','C','P'):
                if l in labels:
                    x,y=p(l);x1,y1=p(l+'′')
                    assert close(x1,2*x0-x)
                    assert close(y1,y if axis else 2*y0-y)
            if axis:
                assert close(p('K')[0],x0) and close(p('L')[0],x0)
            if 'B' in labels:
                assert close(length('A','B'),length('A′','B′'))
            if n=='122' and idx==0:assert close(length('A','A′'),6)
            if n=='122' and idx==1:assert labels['A']==labels['A′']
            if n=='123' and idx<2:
                assert close(length('A','B'),5) and close(length('A′','P′')+length('P′','B′'),5)
            if (n=='123' and idx==2) or n=='124':
                assert close(sum(length(a,b) for a,b in [('A','B'),('B','C'),('C','A')]),12)
            if n in expected_first:
                assert (n=='1240')==axis
                val=expected_first[n][part=='б'][idx];A=p('A');B=p('B')
                if n=='1240' and part=='а':
                    assert close((A[0]-x0)/unit,val) and close(A[0],B[0])
                elif n=='1240' or part=='а':
                    assert close((A[1]-y0)/unit,val) and close(A[1],B[1])
                else:
                    assert aligned(A,B,p('T')) and close((A[1]-y0)/(A[0]-x0),val)
                assert aligned(A,B,p('A′')) == (part=='б')
                assert aligned(A,B,p('B′')) == (part=='б')
        total+=1
assert total==49
print('PLANE_ISOMETRIES_OK: three source points, four proof subparts, 49 checked models.')

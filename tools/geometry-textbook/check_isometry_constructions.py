"""Independently measure the source constructions in the serialized, displayed diagrams."""
import json
from math import dist, isclose
from isometry_constructions import OUT


def close(a, b):
    return isclose(a, b, abs_tol=1e-6, rel_tol=1e-6)


def area2(vertices):
    return sum(x*v-y*u for (x,y),(u,v) in zip(vertices,vertices[1:]+vertices[:1]))


for n, lesson in zip(range(1250,1253),json.loads(OUT.read_text())['lessons'],strict=True):
    s=lesson['source']
    assert (s['chapter'],s['exercise'],s['printedPages'],s['pdfPages'])==('XIV',str(n),[319],[320])
    assert lesson['answer']['mode']=='manual'
    assert [row['input']['accepted'][0] for row in lesson['steps'] if 'input' in row]=={
        1250:['1','22'],1251:['6','-4'],1252:['4','4']}[n]
    model=lesson['visualization']['model']
    assert len(model['views'])==7
    for name,v in model['views'].items():
        case=int(name[-1])-1 if name[-1].isdigit() else 0
        ids={label:k for k in v['points'] for label in model['labels'][k].split('=')}
        def p(s): return model['points'][ids[s]][:2]
        unit=dist(p('U'),p('W'))
        def length(a,b):return dist(p(a),p(b))/unit
        def edges(a,b):return [a,b] in v['segments'] or [b,a] in v['segments']
        for a,b in [('A','B')]+([('B','C'),('C','D'),('D','A')] if n!=1251 else []):
            assert close(length(a,b), length(a+'′',b+'′'))
            for suffix in ('','′'):
                assert edges(ids[a+suffix],ids[b+suffix])
        if n==1250:
            assert close(length('A','B'),length('C','D')) and close(length('A','D'),length('B','C'))
            if case==2:assert close(2*(length('A','B')+length('A','D')),22)
            continue
        assert close(p('K')[0],p('L')[0])
        for label in ('AB' if n==1251 else 'ABCD'):
            x,y=p(label);rx,ry=p(label+'′')
            assert close(y,ry) and close((x+rx)/2,p('K')[0])
        marks=[m['vertex'] for m in v['rightAngles']]
        assert len(set(marks))==len(marks)
        expected=({'H','J'},{'J'},{'H'} if n==1251 else {'H','J'})[case]
        assert {ids[f] for f in expected}<=set(marks)
        for m in v['rightAngles']:
            vtx,a,b=(model['points'][m[k]] for k in ('vertex','a','b'))
            assert close(sum((u-w)*(s-w) for u,s,w in zip(a,b,vtx)),0)
        if n==1251:
            for suffix in ('','′'):
                a,b=p('A'+suffix),p('B'+suffix);dx,dy=b[0]-a[0],b[1]-a[1]
                def on_line(q):return close(dx*(q[1]-a[1]),dy*(q[0]-a[0]))
                def t(q):return ((q[0]-a[0])*dx+(q[1]-a[1])*dy)/(dx*dx+dy*dy)
                drawn=[(model['points'][k],model['points'][j]) for k,j in v['segments']]
                assert any(on_line(u) and on_line(w) and min(t(u),t(w))<0 and max(t(u),t(w))>1 for u,w in drawn)
            if case==1:assert close(length('B','B′'),6)
            if case==2:assert close(abs(p('B′')[0]-p('K')[0])/unit,4)
        else:
            original=[p(i) for i in 'ABCD']; image=[p(i+'′') for i in 'ABCD']
            assert close(area2(original),-area2(image)) and not close(area2(original),0)
            if case==1:assert close(length('A','A′'),0) and close(length('C','C′'),4)
            if case==2:
                turns=[area2([original[i-1], original[i],original[(i+1)%4]]) for i in range(4)]
                assert min(turns)<0<max(turns)
print('ISOMETRY_CONSTRUCTIONS_OK: 21 displayed views; SAS, line extensions, reflected vertices and compass perpendiculars verified.')

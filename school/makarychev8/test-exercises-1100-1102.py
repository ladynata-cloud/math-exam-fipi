from pathlib import Path
import json, re
data=json.loads(Path(__file__).with_name('exercises-1100-1102.json').read_text())
by_id={t['id'].removeprefix('p43-source-'):t for t in data}
expected={
 '1100':{'zeros':'-5;-3;1;4','pos':'[-7;-5)∪(-3;1)∪(4;5]','neg':'(-5;-3)∪(1;4)','inc0':'[-4;-1]','inc1':'[2;5]','dec0':'[-7;-4]','dec1':'[-1;2]','hi':'6','lo':'-4','peer':'(4;5]'},
 '1101':{'domain':'[-5;5]','range':'[-4;6]','zeros':'-3','neg':'[-5;-3)','pos':'(-3;5]','inc0':'[-5;0]','inc1':'[2;5]','dec0':'[0;2]','lo':'-4','hi':'6'},
 '1102':{'count':'4','neg':'[-10;-8)∪(-3;4)∪(8;10]','dec0':'[-5;0]','dec1':'[6;10]'}}
for n,fields in expected.items():
    for key,v in fields.items():
        t=by_id[n+'-'+key];assert t['answer']==v
        assert t['source']['page']==(247 if n=='1102' else 246)
        assert t['graph']['figure']==64+int(n)-1100
assert len(by_id)==sum(map(len,expected.values()))==24
# Independent reference by the sign changes at the source axis intersections.
for number,lower,upper,zeros,positiveAtLeft in [(1100,-7,5,[-5,-3,1,4],True),(1101,-5,5,[-3],False),(1102,-10,10,[-8,-3,4,8],False)]:
   for i in range(lower*64,upper*64+1):
      x=i/64;sign=0 if x in zeros else (1 if positiveAtLeft else -1)*(-1)**sum(z<x for z in zeros)
      for key,target in [('neg',-1),('pos',1)]:
        if key not in expected[str(number)]:continue
        union=expected[str(number)][key].split('∪')
        def inside(part):
            a,b=map(int,part[1:-1].split(';'))
            return (x>a or x==a and part[0]=='[') and (x<b or x==b and part[-1]==']')
        assert any(map(inside,union))==(sign==target)
print('PASS all 24 original subparts, printed figures 64–66, closed source endpoints, strict signs and separate maximal intervals.')

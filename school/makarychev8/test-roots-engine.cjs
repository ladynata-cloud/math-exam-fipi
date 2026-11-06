'use strict';
// Root-specific mathematical input and geometric contracts, independent of content answers.
const assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const C=require('./check.js'),G=require('./task-graphs.js');
let checks=0;
function ok(value,message){assert(value,message);checks++;}
for(const value of ['2√3','2*√(3)','2sqrt(3)','2 sqrt( 3 )','2·√3'])ok(C.check(value,{kind:'text',answer:'2√3'}),'radical notation '+value);
for(const value of ['√12','-2√3','2√9','2sqrt(3)+1'])ok(!C.check(value,{kind:'text',answer:'2√3'}),'required simplified form '+value);
ok(C.check('sqrt(a)*sqrt(b)',{kind:'text',answer:'√a√b'}),'simple variable radicals');
ok(!C.check('sqrt(4)9',{kind:'text',answer:'√49'}),'do not merge factors into radicand');
ok(!C.check('2*3',{kind:'text',answer:'23'}),'do not concatenate numeric factors');
for(const value of ['9','18/2','9,0'])ok(C.check(value,{answer:'9'}),'positive arithmetic root');
for(const value of ['-9','±9','9;-9','81'])ok(!C.check(value,{answer:'9'}),'arithmetic root is one nonnegative number');
ok(C.check('3;-3',{kind:'set',answer:'-3;3'}),'both roots in either order');
for(const value of ['3','-3','3;3','-3;0;3'])ok(!C.check(value,{kind:'set',answer:'-3;3'}),'no lost/extra roots');
ok(C.check('x ≥ 0',{kind:'text',answer:'x>=0'}),'domain including zero');
ok(!C.check('x>0',{kind:'text',answer:'x>=0'}),'do not lose zero');
ok(!C.check('x',{kind:'text',answer:'|x|'}),'absolute value required');
ok(!C.check('a+b',{kind:'text',answer:'√a+√b'}),'radicals not optional');
for(const value of ['0;1;2;3','0;2/2;4/2;9/3','0;1,0;2;3'])ok(C.check(value,{kind:'root-points',answer:'0;1;2;3'}),'ordered y coordinates '+value);
for(const value of ['0;1;3;2','0;1;2','0;1;2;3;4','0;1;-2;3','0.00000000001;1;2;3'])ok(!C.check(value,{kind:'root-points',answer:'0;1;2;3'}),'wrong construction '+value);
ok(Number.isNaN(G.curveValue({kind:'sqrt'},-1)),'root is undefined left of y axis');
ok(G.curveValue({kind:'sqrt'},0)===0,'root includes origin');
ok(Number.isNaN(G.curveValue({kind:'hyperbola',k:4},0)),'hyperbola pole');
const dom=new JSDOM('<div id="graph"></div>');global.document=dom.window.document;
const host=document.getElementById('graph'),config={type:'root-build',xs:[0,1,4,9]};
G.render(host,config,'');ok(!host.querySelector('[data-root-curve]'),'no completed curve before learner input');ok(!host.querySelector('circle'),'no prefilled points');
G.render(host,config,'0;1;-2;3');ok(!host.querySelector('[data-root-curve]'),'wrong branch does not reveal completed curve');
ok(host.querySelectorAll('[data-point-x]').length===3,'out-of-window wrong point is clipped');
G.render(host,config,'0.00000000001;1;2;3');ok(!host.querySelector('[data-root-curve]'),'near-zero error does not reveal curve');
G.render(host,config,'0;1;2;3');ok(host.querySelectorAll('[data-point-x]').length===4,'four learner points');
const path=host.querySelector('[data-root-curve="sqrt"]');ok(path,'correct construction draws root curve');
// Invert the default graph coordinate map and check every rendered sample against y²=x.
const samples=[...path.getAttribute('d').matchAll(/[ML]([\d.-]+) ([\d.-]+)/g)].map(m=>[(Number(m[1])-30)/300*11-1,(230-Number(m[2]))/200*7-1]);
ok(samples.length>400,'curve has enough samples');
for(const [x,y]of samples)ok(x>=-0.00003&&y>=-0.00003&&Math.abs(y*y-x)<0.00015,'rendered sample on nonnegative root branch');
ok(Math.abs(samples[0][0])<0.00003&&Math.abs(samples[0][1])<0.00003,'exact origin is sampled even if grid step misses it');
G.render(host,{type:'root-plane',xRange:[-6,6],yRange:[-6,6],curves:[{kind:'hyperbola',k:4}]},'');
const hyper=host.querySelector('path').getAttribute('d');ok((hyper.match(/M/g)||[]).length===2,'hyperbola branches stay disconnected');
G.render(host,{type:'root-plane',xRange:[-6,6],yRange:[-6,6],curves:[{kind:'line',k:2,b:2,label:'a',labelAt:[2,5]},{kind:'line',k:-2,b:2,label:'b',labelAt:[-2,5]},{kind:'line',k:-.25,b:-3,label:'c',labelAt:[-5,-1]}]},'');
ok([...host.querySelectorAll('[data-curve-label]')].map(n=>n.textContent).join('')==='abc','source figure names remain identifiable');
ok(!host.querySelector('[data-root-curve="sqrt"]'),'line-only figure has no extra root curve');
ok(!host.textContent.includes('2x+2'),'figure labels do not reveal requested equation');
// Long labels near either edge stay inside the plot, including the six №468 examples.
for(const [k,b]of [[1,-1],[1,.125],[1,.25],[1,.5],[-1,-1],[-1,1]]){
 G.render(host,{type:'root-plane',xRange:[-.15,2.5],yRange:[-1.3,3],curves:[{kind:'sqrt',label:'y = √x'},{kind:'line',k,b,label:'y = '+k+'x + '+b}]},'');
 for(const label of host.querySelectorAll('[data-curve-label]')){
  const anchor=label.getAttribute('text-anchor'),x=Number(label.getAttribute('x')),bound=Array.from(label.textContent).length*Number(label.getAttribute('font-size'));
  ok(anchor==='end','right-edge curve label faces inward');
  ok(x<=322&&x-bound>=38,'conservative full label bounds remain inside graph');
 }
}
for(const [xr,yr,axes]of [[[2,13],[-1,4],'x'],[[-1,10],[2,7],'y'],[[2,13],[2,7],''],[[0,10],[0,4],'xy']]){
 G.render(host,{type:'root-plane',xRange:xr,yRange:yr},'');
 ok([...host.querySelectorAll('[data-axis]')].map(el=>el.getAttribute('data-axis')).join('')===axes,'draw only axes whose zero coordinate is visible');
 ok([...host.querySelectorAll('[data-axis-label]')].map(el=>el.getAttribute('data-axis-label')).join('')===axes,'do not label a cropped boundary as zero axis');
}
// A correct mixed-number construction must render exactly like its fraction equivalent.
const mixedGraph={type:'curve-build',xRange:[-5,5],yRange:[-4,4],curves:[{kind:'hyperbola',k:-2,xs:[-4,-2,-1,1,2,4]}]};
const mixedValues='0 1/2;1;2;-2;-1;-0 1/2',fractionValues='1/2;1;2;-2;-1;-1/2';
ok(C.check(mixedValues,{kind:'graph-values',answer:fractionValues}),'mixed ordinates accepted by checker');
G.render(host,mixedGraph,fractionValues);const fractionGraph=host.innerHTML;
G.render(host,mixedGraph,mixedValues);ok(host.innerHTML===fractionGraph,'accepted mixed ordinates draw the same complete graph');
ok(host.querySelectorAll('[data-root-curve]').length===1&&host.querySelectorAll('[data-point-x]').length===6,'mixed construction retains all points and the curve');
assert.deepEqual(G.parseLine('1 1/2;-0 1/2'),G.parseLine('3/2;-1/2'));checks++;
ok(C.rootLineCount('1 1/2;-0 1/2')===C.rootLineCount('3/2;-1/2'),'mixed line coefficients use exact checker classification');
// Chapter review constructions: original domains and discontinuities survive.
for(const [curve,x,expected]of [
 [{kind:'sqrt-shift',h:3,k:-2},3,-2],[{kind:'sqrt-shift',h:3,k:-2},7,0],
 [{kind:'sqrt-shift',h:-3,k:0},-3,0],[{kind:'sqrt-abs'},-9,3],
 [{kind:'abs-ratio',scale:1},-4,-1],[{kind:'abs-ratio',scale:-2},-4,2],
 [{kind:'x-abs',scale:1},-2,-4],[{kind:'x-abs',scale:-1},-2,4]
])ok(G.curveValue(curve,x)===expected,'source graph value '+curve.kind+' '+x);
ok(Number.isNaN(G.curveValue({kind:'sqrt-shift',h:3,k:-2},2)),'shifted root starts at x=3');
ok(Number.isNaN(G.curveValue({kind:'abs-ratio',scale:1},0)),'ratio retains original x=0 exclusion');
const ratio={type:'root-build',curve:{kind:'abs-ratio',scale:1},xs:[-2,-1,1,2],xRange:[-3,3],yRange:[-2,2]};
G.render(host,ratio,'');ok(!host.querySelector('path[data-root-curve]')&&!host.querySelector('[data-hole-x]'),'no answer to ratio construction before entry');
G.render(host,ratio,'-1;-1;1;1');ok(host.querySelectorAll('[data-hole-x="0"]').length===2,'both ends at zero are open');
ok((host.querySelector('path[data-root-curve]').getAttribute('d').match(/M/g)||[]).length===2,'ratio branches not joined');
G.render(host,{type:'root-build',curve:{kind:'sqrt-shift',h:3,k:-2},xs:[3,4,7,12],xRange:[-1,14],yRange:[-3,3]},'-2;-1;0;1');
const shift=host.querySelector('[data-root-curve="sqrt-shift"]');ok(shift,'translated graph is constructed');
const first=/M([\d.-]+) ([\d.-]+)/.exec(shift.getAttribute('d')),firstX=(Number(first[1])-30)/300*15-1,firstY=(230-Number(first[2]))/200*6-3;
ok(Math.abs(firstX-3)<0.00003&&Math.abs(firstY+2)<0.00003,'translated endpoint is exactly sampled');
const pair={type:'curve-build',curves:[{kind:'hyperbola',k:10,xs:[-5,-2,2,5]},{kind:'line',k:10,b:0,xs:[-1,0,1]}],xRange:[-6,6],yRange:[-12,12]};
G.render(host,pair,'-2;-5;5;2;-10;0;10');ok(host.querySelectorAll('[data-root-curve]').length===2,'learner constructs both given functions');
ok(C.check('-2;-5;5;2;-10;0;10',{kind:'graph-values',answer:'-2;-5;5;2;-10;0;10'}),'ordered values for two curves');
G.render(host,{type:'number-line',range:[-3,12],major:1,minor:1,labels:[0,8],points:[{x:5.75,label:'A'}]},'');
const mark=host.querySelector('[data-number-point="A"]');ok(mark&&Math.abs(Number(mark.getAttribute('x1'))-205)<1e-9,'figure15 interval scale, A between5 and6');
ok([...host.querySelectorAll('text')].map(n=>n.textContent).join(';')==='0;8;A','source line retains its labelled ticks');
G.render(host,{type:'number-line',range:[10.5,14],major:1,minor:.25,labels:[11,12,13],points:[{x:11.28,label:'M'},{x:11.7,label:'N'},{x:12.3,label:'P'},{x:12.55,label:'Q'}]},'');
ok(host.querySelectorAll('[data-number-point]').length===4,'figure16 has all four candidates');
// Open textbook examples accept the learner's own valid construction.
for(const v of ['0','-7','2/3','0,125','2 1/3'])ok(C.check(v,{kind:'rational-example'}),'free rational '+v);
for(const v of ['√2','π','1/0'])ok(!C.check(v,{kind:'rational-example'}),'non-rational entry '+v);
for(const v of ['√2','sqrt(101)','√999999999999','π','pi'])ok(C.check(v,{kind:'irrational-example'}),'free irrational '+v);
for(const v of ['√0','√1','√4','sqrt(1000000000000)','√(-2)','0.5'])ok(!C.check(v,{kind:'irrational-example'}),'not a permitted irrational example '+v);
for(const [type,good,bad]of [
 ['rational',['4','9/16','0.25','2/8'],['0','-4','2','2/3']],
 ['irrational',['2','8','2/3','0.5'],['4','1/9','0','-1']],
 ['none',['-1','-1/3','-0.25'],['0','1/3','4']]
]){for(const v of good)ok(C.check(v,{kind:'square-equation-example',rootType:type}),'equation example '+type+' '+v);for(const v of bad)ok(!C.check(v,{kind:'square-equation-example',rootType:type}),'wrong root type '+type+' '+v);}
const interval={kind:'interval-examples',exampleCount:5,lower:'1/3',upper:'1/2'};
ok(C.check('0.34;0.35;0.4;0.45;0.49',interval),'five independent rational choices');
for(const v of ['1/3;.35;.4;.45;.49','.34;.35;.4;.45;1/2','.34;.35;35/100;.45;.49','.34;.35;.4;.45','.34;.35;.4;.45;garbage'])ok(!C.check(v,interval),'interval endpoint/count/duplicate/format '+v);
for(const [value,count]of [
 ['0;-1',0],['0;0',1],['0;100',1],['1;0',2],['-1;0',1],
 ['1;1/4',1],['-1;-1/4',0],['1;249999999999/1000000000000',2],
 ['1;250000000001/1000000000000',0],['-1;1',1],['-1;-1',0],
 ['999999;1/3999996',1],['2;-3',1],['1/2;1/3',2]
]){
 ok(C.rootLineCount(value)===count,'exact nonnegative intersections '+value);
 for(let n=0;n<=2;n++)ok(C.check(value,{kind:'root-line-count',intersectionCount:n})===(n===count),'example classified only once '+value);
}
for(const v of ['1;','1;2;3','1/0;2','garbage;1'])ok(C.rootLineCount(v)===null,'invalid line '+v);
G.render(host,{type:'root-line'},'');ok(host.querySelectorAll('[data-root-curve="sqrt"]').length===1&&!host.querySelector('[data-root-curve="line"]'),'given root but no prefilled example line');
G.render(host,{type:'root-line'},'1;0');ok(host.querySelectorAll('[data-root-curve="line"]').length===1,'learner example line appears from its coefficients');
dom.window.close();delete global.document;
console.log(JSON.stringify({status:'PASS',checks,contracts:['radical notation','required form','arithmetic versus equation roots','zero/domain','absolute value','ordered construction','blank learner graph','root domain and coordinates','hyperbola pole','source figure labels','bounded curve labels','cropped views retain true zero axes','mixed-number graph input','shifted root endpoints','absolute value graphs','excluded zero holes','number line scales','free rational/irrational examples','strict intervals and distinctness','exact equation root classification','arbitrary line examples and tangency']}));

'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM,VirtualConsole}=require('jsdom'),C=require('./core.js'),D=C.D,E=C.E;
const ROOT=path.resolve(__dirname,'../..');
function surface(board=false,seed=null,task=null){const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const dom=new JSDOM(fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),{url:'https://mathexam.space/trainers/college-logarithms/index.html'+(board?'?board=1':'?')+(task?'&task='+encodeURIComponent(task):''),runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});const w=dom.window;if(seed)w.localStorage.setItem('mathExam.collegeLogarithms.v1',seed);for(const el of w.document.querySelectorAll('script[src]'))w.eval(fs.readFileSync(path.join(ROOT,new URL(el.src).pathname),'utf8'));const f={w,errors,q:s=>w.document.querySelector(s),state:()=>JSON.parse(JSON.stringify(w.LogCourseBoard.getState())),click:s=>f.q(s).click(),fill(v){const el=f.q('#answer');el.value=v;el.dispatchEvent(new w.Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));},close(){assert.deepEqual(errors,[]);w.close();}};return f;}
const numericalLog=(a,b)=>Math.log(b)/Math.log(a);
for(const t of D.tasks)test('independent mathematics: '+t.id,()=>{const a=t.audit;assert.equal(t.steps.length>=2,true);for(const s of t.steps){assert.equal(s.hints.length,3);assert(s.error);if(s.kind==='number')assert.notEqual(E.parseNumber(s.answer),null);if(s.kind==='set')assert.notEqual(E.parseSet(s.answer),null);}
let expected;
switch(a.type){case'log':assert(Math.abs(a.a**a.c-a.b)<1e-8);expected=numericalLog(a.a,a.b);break;
case'identity':expected=a.a**numericalLog(a.a,a.b);break;
case'property':expected=numericalLog(a.a,a.u)+(a.op==='+'?1:-1)*numericalLog(a.a,a.v);break;
case'power':expected=numericalLog(a.a,a.b**a.n);break;
case'shift-identity':expected=a.a**(numericalLog(a.a,a.b)+2);break;
case'equation':expected=(a.a**a.c+a.h)/a.m;assert(expected>a.h/a.m);assert(Math.abs(numericalLog(a.a,a.m*expected-a.h)-a.c)<1e-9);assert(E.sameSet(t.steps[1].answer,`(${a.h/a.m}; inf)`));break;
case'equal-logs':expected=3;assert.equal(3*expected-2,expected+4);break;
case'sum-logs':expected=3;assert.equal(numericalLog(2,expected-1)+numericalLog(2,expected+1),3);assert(-3<=1);break;
case'graph':{assert.equal(a.a>0&&a.a!==1,true);const pts=t.steps.filter(s=>s.kind==='point');assert.equal(pts.length,3);for(const s of pts){const [x,y]=s.answer;assert(x>a.h);assert(Math.abs(numericalLog(a.a,x-a.h)+a.k-y)<1e-8);assert(Math.abs(C.graphY(x,a)-y)<1e-8);}assert.equal(C.graphY(a.h,a),null);return;}
case'inequality':{const solution=E.parseSet(t.steps.at(-1).answer),cut=a.h+a.a**a.c;
const contains=x=>solution.intervals.some(i=>{const lo=i.lo==='-inf'?-Infinity:i.lo,hi=i.hi==='inf'?Infinity:i.hi;return(x>lo||i.lc&&x===lo)&&(x<hi||i.rc&&x===hi);});
const predicate=x=>{if(x<=a.h)return false;const v=numericalLog(a.a,x-a.h),diff=v-a.c;if(Math.abs(diff)<1e-9)return['≥','≤'].includes(a.op);return a.op==='>'||a.op==='≥'?diff>0:diff<0;};
for(const x of [a.h-1,a.h,a.h+1e-5,(cut+a.h)/2,cut,cut+.01,cut+5])assert.equal(contains(x),predicate(x),'endpoint/interior '+x);return;}
case'validity':a.pairs.forEach(([base,arg],i)=>assert.equal(t.steps[i].answer==='Определён',base>0&&base!==1&&arg>0));return;
case'fixed':expected=a.result;break;default:assert.fail(a.type);}
assert(Math.abs(E.parseNumber(t.steps.at(-1).answer)-expected)<1e-8,JSON.stringify({expected,last:t.steps.at(-1).answer}));});
for(const t of D.tasks)test('complete retained-step learner journey: '+t.id,()=>{const f=surface();f.w.LogCourseApp.select(t.id);for(let i=0;i<t.steps.length;i++){const s=t.steps[i];f.fill(s.kind==='point'?s.answer.join('; '):s.answer);f.click('#check');assert.equal(f.state().stage,i+1);assert.equal(f.q('#history').children.length,i+1);assert.equal(f.state().errors,0);}assert.equal(f.q('#completion').hidden,false);if(t.graph)assert.equal(f.q('#task-graph').querySelectorAll('[data-point]').length,3);f.close();});
test('wrong answers, three sequential hints, notes, mode isolation and local resume',()=>{const f=surface();f.w.LogCourseApp.select('inequalities-3');f.fill('Недопустимо');f.click('#check');assert.equal(f.state().errors,1);assert.match(f.q('#feedback').textContent,/Основание|a =/);for(let i=1;i<=3;i++){f.click('#hint');assert.equal(f.state().hint,i);assert.equal(f.q('#hint-text').children.length,i);}f.q('#notes').value='<b>ОДЗ: x > 2</b>';f.q('#notes').dispatchEvent(new f.w.Event('input',{bubbles:true}));f.click('#test');assert.equal(f.state().hint,0);assert.equal(f.state().stage,0);assert.equal(f.q('#hint').hidden,true);assert.equal(f.q('#lab').hidden,true);f.click('#learn');assert.equal(f.state().errors,1);assert.equal(f.state().hint,3);const raw=f.w.localStorage.getItem('mathExam.collegeLogarithms.v1');const g=surface(false,raw);assert.deepEqual(g.state(),f.state());assert.equal(g.q('#notes').value,'<b>ОДЗ: x > 2</b>');assert.equal(g.q('#notes').children.length,0);f.close();g.close();});
test('strict shared state rejects forged completion and invalid graph bases atomically',()=>{const f=surface(true),good=f.state();const invalid=[{...good,stage:1},{...good,taskId:'unknown'},{...good,lab:{...good.lab,a:1}},{...good,lab:{...good.lab,a:-2}},{...good,mode:'test',hint:1},{...good,note:'x'.repeat(1501)},{...good,drafts:[]},{...good,extra:1},{...good,errors:-1}];for(const s of invalid){assert.equal(C.validate(s),false);assert.throws(()=>f.w.LogCourseBoard.applyState(f.w.JSON.parse(JSON.stringify(s))));assert.deepEqual(f.state(),good);}f.close();});
test('safe parsing excludes code, blank numbers, invalid denominators and wrong interval endpoints',()=>{for(const v of ['','1/0','NaN','2**3','alert(1)','Infinity'])assert.equal(E.parseNumber(v),null);assert(C.correct({kind:'number',answer:'.5'},'1/2'));assert(!C.correct({kind:'set',answer:'(2; 3]'},'[2; 3]'));assert(!C.correct({kind:'set',answer:'(2; 3]'},'(2; 3)'));});
test('graph laboratory covers every supported base and shift',()=>{for(const a of C.bases)for(let h=-3;h<=3;h++)for(let k=-3;k<=3;k++){const p={a,h,k};assert.equal(C.graphY(h,p),null);assert(Math.abs(C.graphY(h+1,p)-k)<1e-9);assert(Math.abs(C.graphY(h+a,p)-(k+1))<1e-9);assert.equal(C.graphY(h+2,p)>C.graphY(h+1,p),a>1);}});

test('fixed graph window makes shifts visible instead of moving the coordinate window',()=>{const f=surface(),svg=f.q('#lab-graph');const point=()=>[...svg.querySelectorAll('[data-point] circle')].map(e=>[Number(e.getAttribute('cx')),Number(e.getAttribute('cy'))]);f.w.LogCoursePlot.render(svg,{a:2,h:0,k:0},[[1,0]],true);const zero=point()[0],curve=svg.querySelector('[data-curve]').getAttribute('d');f.w.LogCoursePlot.render(svg,{a:2,h:2,k:1},[[3,1]],true);const moved=point()[0];assert(moved[0]>zero[0]);assert(moved[1]<zero[1]);assert.notEqual(svg.querySelector('[data-curve]').getAttribute('d'),curve);f.close();});

test('logarithm grid units are equal and clicking a displayed point recovers its coordinates', () => {
  const f = surface();
  try {
    const svg = f.q('#lab-graph'), plot = f.w.LogCoursePlot;
    plot.render(svg, {a: 2, h: 0, k: 0}, [[1, 0], [2, 1]]);
    const [a, b] = Array.from(svg.querySelectorAll('[data-point] circle'), dot => [Number(dot.getAttribute('cx')), Number(dot.getAttribute('cy'))]);
    assert(Math.abs(b[0] - a[0] - (a[1] - b[1])) < 1e-8);
    svg.getBoundingClientRect = () => ({left: 12, top: 20, width: 920, height: 380});
    const clicked = plot.coordinates(svg, {clientX: 12 + 160 + b[0], clientY: 20 + b[1]});
    assert.deepEqual(Array.from(clicked), [2, 1]);
    assert.equal(plot.coordinates(svg, {clientX: 30, clientY: 180}), null);
    const edge = svg.querySelector('clipPath rect');
    for (const width of [258, 570]) {
      const scale = width / 600, left = 20.35, top = 100.35;
      svg.getBoundingClientRect = () => ({left, top, width, height: 380 * scale});
      const clientX = Math.floor(left + Number(edge.getAttribute('x')) * scale);
      const clientY = Math.floor(top + Number(edge.getAttribute('y')) * scale);
      assert.deepEqual(Array.from(plot.coordinates(svg, {clientX, clientY})), [-5, 6]);
      assert.equal(plot.coordinates(svg, {clientX: clientX - 2, clientY}), null);
    }
  } finally { f.close(); }
});

// Intro links must select the requested task without discarding saved attempts.
test('lesson task links preserve attempts and room initialization',()=>{const f=surface();f.fill('Допустимо');f.click('#check');const raw=f.w.localStorage.getItem('mathExam.collegeLogarithms.v1');const g=surface(false,raw,'graphs-1');assert.equal(g.state().taskId,'graphs-1');g.w.LogCourseApp.select('meaning-1');assert.equal(g.state().stage,1);const b=surface(true,raw,'values-1');assert.equal(b.state().taskId,'values-1');assert.equal(b.state().stage,0);const bad=surface(false,raw,'unknown');assert.equal(bad.state().taskId,'meaning-1');assert.equal(bad.state().stage,1);f.close();g.close();b.close();bad.close();});

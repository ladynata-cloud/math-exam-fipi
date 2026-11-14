'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'../..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const D=require(root+'/geometry-course/assets/proof-diagrams.js'),T=require(root+'/geometry-course/assets/tasks.js'),C=require(root+'/geometry-course/data/course.json');
const baseline=require('./proof-figures-baseline.json'),ids=['segments','equality','length','chords-tangent','circle-position','projections','pythagoras'];
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
function shell(s){const config=/<script>window\.COURSE_CONFIG=[\s\S]*?<\/script>/.exec(s),lesson=/<script>\(function\(\)\{'use strict';const C=window\.COURSE_CONFIG[\s\S]*?<\/script>/.exec(s);assert(config&&lesson);return s.slice(0,config.index+config[0].length)+s.slice(lesson.index+lesson[0].length);}
function fragment(s){return JSDOM.fragment(s);}
function point(f,id){const el=f.querySelector(`[data-point="${id}"]`);assert(el,`point ${id}`);return [+el.getAttribute('cx'),+el.getAttribute('cy')];}
const sub=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),norm=a=>Math.hypot(...a),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function load(id,saved){
  const errors=[],console=new VirtualConsole();console.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(read('geometry-course/atlas/'+id+'.html'),{url:'https://mathexam.test/geometry-course/atlas/'+id+'.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:console,beforeParse(w){
    w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({measureText:t=>({width:String(t).length*8})},{get:(o,k)=>o[k]||(()=>{})});
    if(saved)w.localStorage.setItem('mathExamGeometry.v1',saved);
  }});
  const {window:w}=dom,doc=w.document;
  return {w,doc,errors,click:selector=>{const el=doc.querySelector(selector);assert(el,selector);el.click();},save:()=>{w.dispatchEvent(new w.Event('pagehide'));return w.localStorage.getItem(w.GeoStore.KEY);},close:()=>w.close()};
}

test('all standalone shells, conditions, midline source and embedded runtime copies are preserved',()=>{
  for(const u of C.units){const file='geometry-course/atlas/'+u.id+'.html',html=read(file);assert.equal(hash(shell(html)),baseline.shellSha256[file],file);
    for(const source of ['geometry.js','lab.js','experiments.js','tasks.js','store.js','lesson.js'])assert(html.includes('<script>'+read('geometry-course/assets/'+source).replace(/<\/script/g,'<\\/script')+'</script>'),file+' '+source);
    assert.equal(html.includes('root.GeoProofDiagrams=api'),ids.includes(u.id),u.id);
  }
  assert.equal(hash(read('geometry-course/assets/midline-diagram.js')),baseline.midlineSourceSha256);
});

test('all 4,410 existing generated conditions, answers, steps and task identities are unchanged',()=>{
  for(const [kind,expected] of Object.entries(baseline.practiceContentSha256)){
    const tasks=Array.from({length:630},(_,seed)=>{const t=T.task(kind,seed);return {question:t.question,answer:t.answer,steps:t.steps,fingerprint:T.fingerprint(t)};});
    assert.equal(hash(JSON.stringify(tasks)),expected,kind);
  }
});

test('visible proof geometry satisfies the given facts and advances emphasis',()=>{
  const s=fragment(D.proof('segment'));const A=point(s,'A'),M=point(s,'M'),B=point(s,'B');near(norm(sub(M,A)),norm(sub(B,M)));near(A[1],B[1]);
  const p=fragment(D.proof('projection'));const a=point(p,'A'),b=point(p,'B'),c=point(p,'C'),h=point(p,'H');near(dot(sub(a,c),sub(b,c)),0);near(dot(sub(c,h),sub(b,a)),0);assert(h[0]>a[0]&&h[0]<b[0]);
  const t0=fragment(D.proof('tangent',0));assert.equal(t0.querySelector('[data-point="P"]'),null);
  const t=fragment(D.proof('tangent',2)),o=point(t,'O'),tt=point(t,'T'),pp=point(t,'P');near(norm(sub(o,tt)),65);near(dot(sub(o,tt),sub(pp,tt)),0);assert(norm(sub(o,pp))>65);
  const vertices=[[106,22],[226,94],[154,214],[34,142]],edges=vertices.map((v,i)=>sub(vertices[(i+1)%4],v));for(let i=0;i<4;i++){near(norm(edges[i]),norm(edges[0]));near(dot(edges[i],edges[(i+1)%4]),0);}
  assert(D.proof('pythagoras').includes('M106 22L226 94L154 214L34 142Z'));
  for(const id of D.proofIds){assert.notEqual(D.proof(id,0),D.proof(id,1),id);assert(fragment(D.proof(id)).querySelector('svg[role="img"][aria-label]'));}
  assert.equal(D.proof('unknown'),'');
});

test('practice figures match current numbers, labels, right angles and equal-scale comparisons',()=>{
  for(const kind of Object.keys(baseline.practiceContentSha256))for(let seed=0;seed<630;seed++){
    const t=T.task(kind,seed),d=t.meta.diagram,nums=(t.question.match(/\d+/g)||[]).map(Number),markup=D.practice(t);
    assert.deepEqual(d.values,nums,kind+' condition '+seed);assert(markup.includes(`data-figure-id="${kind}"`));assert(!/NaN|Infinity|undefined/.test(markup));
    for(const n of nums)assert(markup.includes(String(n)),kind+' number '+n);
    if(['segment','length','tangent','projection','pythagoras'].includes(kind))assert(markup.includes('?'));
  }
  for(let seed=0;seed<105;seed++){
    let t=T.task('projection',seed),f=fragment(D.practice(t)),A=point(f,'A'),B=point(f,'B'),C=point(f,'C'),H=point(f,'H');near(dot(sub(A,C),sub(B,C)),0);near(dot(sub(C,H),sub(B,A)),0);near(norm(sub(H,A))/norm(sub(B,H)),t.meta.diagram.values[0]/t.meta.diagram.values[1]);
    t=T.task('pythagoras',seed);f=fragment(D.practice(t));A=point(f,'A');B=point(f,'B');C=point(f,'C');near(dot(sub(A,C),sub(B,C)),0);near(norm(sub(B,A))/norm(sub(C,A)),t.meta.diagram.values[0]/t.meta.diagram.values[1]);
  }
  const f=fragment(D.practice(T.task('tangent',0))),O=point(f,'O'),P=point(f,'P');for(const id of ['A','B']){const T=point(f,id);near(norm(sub(O,T)),60);near(dot(sub(O,T),sub(P,T)),0);}
  assert.equal(D.practice({meta:{}}),'');
  for(const d of [{type:'projection',values:[4]},{type:'pythagoras',values:[3,5]},{type:'length',values:[3,4]},{type:'compare',values:[5,3]},{type:'tangent',values:[NaN]},{type:'unknown',values:[5]}])assert.equal(D.practice({meta:{diagram:d}}),'');
});

test('seven complete lesson DOM flows show the matching figure and preserve progress, drafts and writing',()=>{
  for(const id of ids){let app=load(id),w=app.w,doc=app.doc;const unit=w.COURSE_CONFIG.unit;
    app.click('[data-stage="2"]');assert.equal(doc.querySelector('.lesson-figure').dataset.figureId,unit.proof);
    assert.equal(doc.querySelectorAll('#proof-board .point-select option').length,0);assert.match(doc.querySelector('#proof-board').parentElement.textContent,/временное поле/);
    assert.equal(doc.querySelector('#proof-board [data-tool="point"]').getAttribute('aria-pressed'),'true');
    assert.match(doc.querySelector('#proof-board .lab-mission').textContent,/добавить точки/);
    doc.querySelector('#proof-board .point-x').value='100';doc.querySelector('#proof-board .point-y').value='150';app.click('#proof-board [data-act="move"]');
    assert.equal(doc.querySelectorAll('#proof-board .point-select option').length,1);
    app.click('[data-proof="s1"]');assert.equal(doc.querySelector('#reason .lesson-figure').dataset.figureStep,'1');
    doc.querySelector('#reason-choice').value='yes';app.click('[data-action="reason-check"]');
    let saved=app.save();app.close();app=load(id,saved);w=app.w;doc=app.doc;
    assert.equal(doc.querySelector('.lesson-figure').dataset.figureStep,'1');assert.equal(JSON.parse(app.save()).units[id].proofDone.length,1);
    app.click('[data-stage="3"]');let state=JSON.parse(app.save()).units[id],t=w.GeoTasks.task(unit.calc,state.seed);
    assert.equal(doc.querySelector('.lesson-figure').dataset.figureKind,'practice');assert.equal(doc.querySelector('.task-question').textContent,t.question);
    doc.querySelector('#answer').value='123';doc.querySelector('#answer').dispatchEvent(new w.Event('input',{bubbles:true}));saved=app.save();app.close();app=load(id,saved);w=app.w;doc=app.doc;assert.equal(doc.querySelector('#answer').value,'123');
    for(const s of t.steps){doc.querySelector('#answer').value=w.GeoTasks.format(s.answer);doc.querySelector('#answer-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
    assert.match(doc.querySelector('#lesson').textContent,/Разбор завершён/);
    app.click('[data-action="independent-start"]');state=JSON.parse(app.save()).units[id];t=w.GeoTasks.task(unit.calc,state.seed);assert.equal(doc.querySelector('.lesson-figure').dataset.figureKind,'practice');
    doc.querySelector('#answer').value=w.GeoTasks.format(t.answer);doc.querySelector('#answer-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(JSON.parse(app.save()).units[id].independent,1);
    app.click('[data-stage="5"]');assert.equal(doc.querySelector('.lesson-figure').dataset.figureKind,'proof');assert.equal(doc.querySelector('.lesson-figure').dataset.figureStep,'0');
    const writing='Дано, построение, основание каждого перехода.';doc.querySelector('#written').value=writing;doc.querySelector('#written').dispatchEvent(new w.Event('input',{bubbles:true}));saved=app.save();assert.deepEqual(app.errors,[]);app.close();
    app=load(id,saved);assert.equal(app.doc.querySelector('#written').value,writing);assert.equal(app.doc.querySelector('.lesson-figure').dataset.figureStep,'0');assert.deepEqual(app.errors,[]);app.close();
  }
});

test('middle-line figures remain present and unrelated lessons get no mismatched diagram',()=>{
  for(const id of ['midline','angles']){const app=load(id);for(const stage of [2,3,4,5]){app.click(`[data-stage="${stage}"]`);assert.equal(app.doc.querySelectorAll('.lesson-figure').length,0);assert.equal(app.doc.querySelectorAll('.midline-diagram').length,id==='midline'?1:0);}assert.deepEqual(app.errors,[]);app.close();}
});

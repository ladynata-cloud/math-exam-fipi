'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const D=require('../ege-baza/path/data.js');require('../ege-baza/path/practice.js');
const figures=require('../ege-baza/path/stereo-figures.js');
const families=D.meta.filter(m=>[11,13].includes(m.pos));assert.equal(families.length,12);
const expectedLabels=t=>{
 const p=t.params||{},m=t.model||{};
 switch(t.id){
 case 'box':return {a:m.a,b:m.b,height:m.h};
 case 'roundbody':return m.body==='sphere'?{radius:'r = '+m.a}:m.body==='cone'?{radius:'r = '+m.a,height:'h = '+m.h}:{radius:'r = '+m.a,height:m.h};
 case 'pyramid':return {side:'a = '+m.a,height:'h = '+m.h};
 case 'scale':return {'whole-volume':'V большого = '+27*(2+t.seed%7),'height-ratio':'1 / 3'};
 case 'practice-displacement':return {litres:D.F(p.litres)+' л воды','level-factor':D.F(p.factor)+'h'};
 case 'practice-pour':return {height:p.oldH+' см'};
 case 'practice-joined-surface':return {a:p.a,b:p.a,height:p.a};
 case 'practice-faces':return {};
 case 'practice-cone-area':return {};
 case 'practice-pyramid-lateral':return {side:'a = '+10*p.s,'lateral-edge':13*p.s};
 case 'practice-box-diagonal':return {a:p.a,b:p.b,diagonal:'d = '+p.d};
 case 'practice-similar-volume':return {'small-volume':'V малого = '+p.small,'height-ratio':'1 / '+p.factor};
 }
};
let cases=0;
for(const {id} of families)for(let seed=0;seed<84;seed++){
 const t=D.task(id,seed),html=figures.visual(t),view=new JSDOM(html),doc=view.window.document;
 assert(doc.querySelector(`.stereo-figures[data-stereo-task="${id}"]`),id);
 assert(doc.querySelector('svg[role="img"]'),id+' missing drawing');assert(!html.includes('NaN')&&!html.includes('undefined'),id+' malformed');
 for(const [key,value] of Object.entries(expectedLabels(t))){const el=doc.querySelector(`[data-stereo-given="${key}"]`);assert(el,id+' missing '+key);assert.equal(el.getAttribute('aria-label')||el.textContent,String(value),id+' label '+key);}
 // Deliberately poison every answer/worked hint. A condition diagram must not
 // depend on those values or accidentally include them in an accessible label.
 const poisoned=structuredClone(t);poisoned.answer='ANSWER-MUST-NOT-LEAK';poisoned.steps=[{q:'STEP-MUST-NOT-LEAK',a:987654321,why:'HINT-MUST-NOT-LEAK'}];
 assert.equal(figures.visual(poisoned),html,id+' derives drawing from a solution');
 if(id==='practice-box-diagonal'){poisoned.model.h=987654321;assert.equal(figures.visual(poisoned),html,'unknown height must not be labelled');assert(!doc.querySelector('[data-stereo-given="height"]'));}
 if(id==='practice-cone-area'){
  assert.deepEqual([...doc.querySelectorAll('[data-stereo-given="radius"]')].map(e=>e.textContent),['r = '+t.params.r,'r = '+t.params.r*t.params.ratio]);
  assert.deepEqual([...doc.querySelectorAll('[data-stereo-given="slant"]')].map(e=>e.textContent),['l = '+t.params.l,'l = '+t.params.l*2]);
  for(const dimension of ['rx','ry']){const radii=[...doc.querySelectorAll('svg ellipse')].map(e=>+e.getAttribute(dimension));assert(Math.abs(radii[1]/radii[0]-t.params.ratio)<1e-10,'paired cone radii share one scale');}
  const sides=[...doc.querySelectorAll('svg')].map(svg=>{const match=svg.querySelector('path').getAttribute('d').match(/^M([\d.]+) 268L210 ([\d.]+)L/);return Math.hypot(210-Number(match[1]),268-Number(match[2]));});assert(Math.abs(sides[1]/sides[0]-2)<1e-10,'paired cone slants share one scale');
 }
 if(id==='practice-pour'){
  assert.deepEqual([...doc.querySelectorAll('[data-stereo-given="radius"]')].map(e=>e.textContent),['r',t.params.ratio+'r']);
  const glasses=[...doc.querySelectorAll('svg')];
  const bases=glasses.map(svg=>svg.querySelector('[data-stereo-ring="cylinder-base"]'));
  for(const dim of ['rx','ry'])assert(Math.abs(Number(bases[1].getAttribute(dim))/Number(bases[0].getAttribute(dim))-t.params.ratio)<1e-10,'paired cylinder radii and perspective share one scale');
  const volumes=glasses.map((svg,i)=>{
   const surface=Number(svg.querySelector('[data-stereo-ring="water-level"]').getAttribute('cy'));
   const bottom=Number(bases[i].getAttribute('cy'));
   const mark=svg.querySelector('[data-stereo-aux="water-depth"] path').getAttribute('d').match(/^M([\d.]+),([\d.]+)L([\d.]+),([\d.]+)$/);
   assert.ok(mark&&mark[1]===mark[3]&&Number(mark[2])===surface&&Number(mark[4])===bottom,'depth marker runs vertically from the water surface to the bottom');
   return (bottom-surface)*Number(bases[i].getAttribute('rx'))**2;
  });
  assert.ok(Math.abs(volumes[0]-volumes[1])<1e-8,'drawn water volumes match');
  assert.match(glasses[1].textContent,/h = \?/,'the second depth is still unknown');
 }
 if(id==='practice-similar-volume'||id==='scale')assert(doc.querySelector('g[aria-label] path'),'height ratio must use a horizontal fraction bar');
 if(id==='practice-pyramid-lateral')assert(!doc.querySelector('[data-stereo-given="height"]'),'computed face height must stay unknown');
 view.window.close();cases++;
}
assert.equal(figures.visual(D.task('round',0)),'');
const root=path.resolve(__dirname,'..');
const dom=new JSDOM(fs.readFileSync(path.join(root,'ege-baza/path/index.html'),'utf8'),{url:'https://course.test/ege-baza/path/index.html#lesson=practice-displacement',runScripts:'outside-only'}),w=dom.window;
w.structuredClone=structuredClone;w.matchMedia=()=>({matches:true});w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};
for(const script of w.document.querySelectorAll('script'))w.eval(fs.readFileSync(path.join(root,new URL(script.src).pathname),'utf8'));
assert(w.document.querySelector('.task-first-problem>.task-support .stereo-figures'),'drawing belongs beside condition');
assert.equal(w.document.querySelector('#taskHelp').open,false,'drawing must not open hints');
assert.equal(w.PathCourse.state().lessons['practice-displacement'].help,false,'seeing givens is not assistance');
const host=w.document.createElement('div');w.document.body.append(host);let changes=[];
const t=w.PathData.task('practice-displacement',0),session=w.PathModels.mount(host,t,{state:{kind:'plan',revealed:1},onChange:value=>changes.push(value)});
assert(host.querySelector('.stereo-figures'));assert.equal(host.querySelectorAll('#plan p').length,1);assert.equal(host.pathModel,session);
host.querySelector('#revealPlan').click();assert.equal(host.querySelectorAll('#plan p').length,2);assert.equal(session.getState().revealed,2);assert.equal(changes.at(-1).revealed,2);
const snapshot=session.getState();w.PathModels.mount(host,t,{state:snapshot});assert.equal(host.querySelectorAll('#plan p').length,2,'existing plan state survives remount');
const seam=D.task('practice-joined-surface',0);assert.match(seam.steps[1].q,/квадратов/);assert.match(seam.steps[1].why,/6 граней/);assert.equal(seam.answer,40);
w.close();
// A cabinet assignment keeps the issued task and help text as a snapshot.
// Resume at the original step with an open hint and an unfinished answer.
for(const [id,oldQuestion] of [
 ['practice-pour','Новая высота воды, см?'],
 ['practice-right-ratio','Нужное отношение?'],
 ['practice-displacement','Объём детали, см³?'],
 ['practice-cone-area','Отношение площадей?'],
 ['practice-similar-volume','Объём большого конуса?']
]){
 const frame=new JSDOM('<main id="main"></main>',{url:'https://course.test/ege-baza/path/index.html?learning=1',runScripts:'outside-only'});
 const win=frame.window;let bridge;win.MathExamLearning={register(api){bridge=api;}};
 for(const name of ['data','practice','practice-view','stereo-figures','managed-state','managed'])win.eval(fs.readFileSync(path.join(root,'ege-baza/path',name+'.js'),'utf8'));
 const seed=5,task=win.PathData.task(id,seed),last=task.steps.at(-1),newQuestion=last.q,newHint=last.why;
 last.q=oldQuestion;last.why='Подсказка из сохранённой версии.';
 const spec={id,seed,contentVersion:1,trainerId:'ege-path',task},state=win.PathManagedState.fresh(spec);
 Object.assign(state.work,{stage:2,step:task.steps.length-1,answers:task.steps.slice(0,-1).map(s=>String(s.a)),help:true,draft:'8'});
 state.view.hintText=last.why;const before=JSON.stringify(spec);
 bridge.applyState({taskSpec:spec,state,readOnly:false});
 assert.equal(win.document.querySelector('.callout p').textContent,newQuestion);
 assert.equal(win.document.querySelector('#hintText').textContent,newHint);
 assert.equal(win.document.querySelector('#answer').value,'8');
 assert.equal(JSON.stringify(bridge.getState().work),JSON.stringify(state.work));
 assert.equal(JSON.stringify(spec),before,'the original assignment is intact');
 if(id==='practice-pour')assert.equal(win.document.querySelectorAll('[data-stereo-ring="water-level"]').length,2);
 win.close();
}
console.log(`EGE_BAZA_STEREO_FIGURES_OK: ${cases} condition diagrams across 12 families, saved cabinet questions and depth markers.`);

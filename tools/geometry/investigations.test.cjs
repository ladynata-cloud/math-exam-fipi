'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'../..');
require(root+'/geometry-course/assets/investigations.js');
const I=globalThis.GeoInvestigations,T=require(root+'/geometry-course/assets/tasks.js');
let checks=0;
function near(a,b){assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);checks++;}
const d=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const area=p=>Math.abs((p[1][0]-p[0][0])*(p[2][1]-p[0][1])-(p[1][1]-p[0][1])*(p[2][0]-p[0][0]))/2;
for(let angle=10;angle<=170;angle++){
 const m=I.model('diameter',angle);near(d(m.A,m.C)**2+d(m.B,m.C)**2,4);near(m.dot,0);
 const s=I.model('signs',angle);for(let j=0;j<3;j++)near(d(s.p[j],s.p[(j+1)%3]),d(s.q[j],s.q[(j+1)%3]));
}
for(const value of [-3,-.1,0,3,6,6.1,9]){const m=I.model('height',value);near(area([m.A,m.B,m.C]),12);assert.equal(m.H[0],value);assert.equal(m.outside,value<0||value>6);}
for(const [value,count] of [[0,2],[59,2],[60,1],[61,0],[100,0]])assert.equal(I.model('tangent',value).count,count);
for(let k=.5;k<=2;k+=.05){const m=I.model('similar',k);near(area(m.q)/area(m.p),k*k);near(d(m.q[0],m.q[1])/d(m.p[0],m.p[1]),k);}
for(const id of I.units){const u=I.forUnit(id);const unique=new Set();for(let seed=0;seed<120;seed++){
 const t=u.task(seed);assert.ok(u.check(T.format(t.answer),t.answer,T.equal));for(const step of t.steps)assert.ok(u.check(T.format(step.answer),step.answer,T.equal));unique.add(T.fingerprint(t));
 if(id==='inscribed'){const a=Number(t.question.match(/= (\d+)°/)[1]);near(t.answer+a,90);const m=I.model('diameter',t.figure.value);near(Math.atan2(m.C[1],m.C[0]+1)*180/Math.PI,a);}
 if(id==='chords-tangent'){const a=Number(t.question.match(/= (\d+)°/)[1]);near(t.answer+a,90);assert.ok(!t.question.includes('Пифагор'));}
 if(id==='area-triangle'){const nums=[...t.question.matchAll(/= (\d+) см/g)].map(x=>+x[1]);near(t.answer,nums[0]*nums[1]/2);}
 if(id==='similarity-signs'){const nums=[...t.question.matchAll(/(?:=|равна) (\d+)/g)].map(x=>+x[1]);near(t.answer,nums[2]*(nums[1]/nums[0])**2);}
 if(id==='triangle-signs'){assert.equal(t.answer,t.question.includes('AC =')?'3':t.question.includes('AB =')?'2':'0');}
 }assert.ok(unique.size>=18,id+' fresh condition bank');
}
function boot(id,saved){const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const dom=new JSDOM(fs.readFileSync(root+'/geometry-course/atlas/'+id+'.html','utf8'),{url:'https://mathexam.space/geometry-course/atlas/'+id+'.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){if(saved)w.localStorage.setItem('mathExamGeometry.v1',JSON.stringify(saved));}});assert.deepEqual(errors,[]);return dom;}
const event=(w,node,type)=>node.dispatchEvent(new w.Event(type,{bubbles:true,cancelable:true}));
function read(w,id){return JSON.parse(w.localStorage.getItem('mathExamGeometry.v1')).units[id];}
function answer(w,value){const a=w.document.querySelector('#answer');a.value=String(value);event(w,a,'input');event(w,w.document.querySelector('#answer-form'),'submit');}
function polygons(w){return [...w.document.querySelectorAll('.investigation-model svg polygon')].map(el=>el.getAttribute('points').split(' ').map(x=>x.split(',').map(Number)));}
for(const id of I.units){
 let dom=boot(id),w=dom.window,doc=w.document,u=w.GeoInvestigations.forUnit(id);
 const select=doc.querySelector('.investigation-predict select');select.value=select.options[1].value;event(w,doc.querySelector('.investigation-predict'),'submit');assert.equal(select.disabled,true);
 const range=doc.querySelector('.investigation-model input');range.value=range.max;event(w,range,'input');
 if(id==='triangle-signs'){const [p,q]=polygons(w);for(let j=0;j<3;j++)near(d(p[j],p[(j+1)%3]),d(q[j],q[(j+1)%3]));}
 if(id==='similarity-signs'){for(const k of [.5,1,2]){range.value=k;event(w,range,'input');const [p,q]=polygons(w);near(area(q)/area(p),k*k);near(d(q[0],q[1])/d(p[0],p[1]),k);}}
 const before=read(w,id),saved=JSON.parse(w.localStorage.getItem('mathExamGeometry.v1')),marker=u.progress(before);assert.equal(marker.verified,0);assert.ok(before.events.every(x=>x.type.length<=40));const expectedRange=range.value;dom.window.close();
 dom=boot(id,saved);w=dom.window;doc=w.document;u=w.GeoInvestigations.forUnit(id);assert.equal(doc.querySelector('.investigation-model input').value,expectedRange);assert.equal(doc.querySelector('.investigation-predict select').disabled,true);assert.equal(u.progress(read(w,id)).prediction,marker.prediction);
 doc.querySelector('[data-stage="4"]').click();let record=read(w,id),t=u.task(record.seed);answer(w,T.format(t.answer));assert.equal(u.progress(read(w,id)).verified,1);answer(w,T.format(t.answer));assert.equal(u.progress(read(w,id)).verified,1);
 doc.querySelector('[data-action="new-task"]').click();record=read(w,id);t=u.task(record.seed);answer(w,'999999');answer(w,T.format(t.answer));assert.equal(u.progress(read(w,id)).verified,1);
 doc.querySelector('[data-action="new-task"]').click();record=read(w,id);t=u.task(record.seed);doc.querySelector('[data-action="show-solution"]').click();answer(w,T.format(t.answer));assert.equal(u.progress(read(w,id)).verified,1);dom.window.close();
 const legacy={version:1,units:{[id]:{updated:1,stage:4,seed:2,draft:'старый незавершённый ответ',written:'Старое доказательство',observation:'Старое наблюдение',independent:5,attempts:8,taskStep:1,seenTasks:[],events:[]},segments:{updated:1,written:'Не трогать'}}};
 dom=boot(id,legacy);w=dom.window;doc=w.document;u=w.GeoInvestigations.forUnit(id);record=read(w,id);assert.equal(record.draft,legacy.units[id].draft);assert.equal(record.written,legacy.units[id].written);assert.equal(record.independent,5);assert.equal(u.progress(record).legacy,true);assert.equal(doc.querySelector('#answer').value,legacy.units[id].draft);assert.equal(JSON.parse(w.localStorage.getItem('mathExamGeometry.v1')).units.segments.written,'Не трогать');
 doc.querySelector('[data-action="new-task"]').click();record=read(w,id);assert.equal(u.progress(record).legacy,false);assert.equal(record.independent,5);assert.equal(record.written,legacy.units[id].written);assert.equal(record.draft,'');dom.window.close();checks++;
}
// A stale lesson tab must keep its local recovery copy and preserve the newer stored draft.
{
 const dom=boot('area-triangle'),w=dom.window,doc=w.document;
 const localObservation='Локальное исследование';doc.querySelector('#observation').value=localObservation;event(w,doc.querySelector('#observation'),'input');
 const remote=JSON.parse(w.localStorage.getItem('mathExamGeometry.v1'));remote.units['area-triangle'].draft='Более новый ответ из другой вкладки';remote.units['area-triangle'].updated+=1;w.localStorage.setItem('mathExamGeometry.v1',JSON.stringify(remote));
 w.dispatchEvent(new w.Event('pagehide'));
 assert.equal(read(w,'area-triangle').draft,'Более новый ответ из другой вкладки');assert.equal(doc.querySelector('#storage-notice').hidden,false);assert.match(doc.querySelector('#storage-notice').textContent,/другой вкладке/);
 let exported;w.GeoStore.download=data=>exported=data;doc.querySelector('#export-progress').click();assert.equal(exported.recoveryDrafts['area-triangle'].record.observation,localObservation);assert.equal(exported.units['area-triangle'].draft,'Более новый ответ из другой вкладки');const imported=w.GeoStore.open(w.COURSE_CONFIG.catalog.map(x=>x.id));imported.import(exported);assert.equal(imported.get('area-triangle').draft,'Более новый ответ из другой вкладки');assert.equal(read(w,'area-triangle').draft,'Более новый ответ из другой вкладки');dom.window.close();checks++;
}
for(const id of I.units){const u=I.forUnit(id),state={events:[],congruence:{verified:1000000,legacy:false,prediction:'change~170'}};u.persist(state);assert.ok(state.events[0].type.length<=40);assert.equal(u.progress(state).verified,1000000);}
// Recovery copies are actually visible to the teacher, escaped and separate from canonical work.
(async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));const dom=new JSDOM(fs.readFileSync(root+'/geometry-course/teacher-atlas.html','utf8'),{url:'https://mathexam.space/geometry-course/teacher-atlas.html',runScripts:'dangerously',virtualConsole:vc});
 const w=dom.window,input=w.document.querySelector('#report-files'),payload={version:1,units:{'area-triangle':{updated:2,observation:'Основная новая запись'}},recoveryDrafts:{'area-triangle':{record:{updated:1,draft:'Локальный ввод',observation:'Локальное <script>наблюдение</script>',written:'Локальное доказательство'}}}};
 Object.defineProperty(input,'files',{value:[{name:'recovery.json',size:1000,text:async()=>JSON.stringify(payload)}]});event(w,input,'change');await new Promise(resolve=>setImmediate(resolve));
 assert.match(w.document.querySelector('.recovery-copy').textContent,/Локальный ввод/);assert.match(w.document.querySelector('.recovery-copy').textContent,/Локальное <script>наблюдение<\/script>/);assert.equal(w.document.querySelector('.recovery-copy script'),null);assert.match(w.document.querySelector('#reports').textContent,/Основная новая запись/);assert.deepEqual(errors,[]);dom.window.close();checks++;
 console.log(JSON.stringify({status:'PASS',newUnits:I.units.length,checks,coverage:'exact geometry; displayed ratios; forecast/reload; fresh/assisted/corrected answers; legacy drafts; conflict recovery and teacher view'},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});

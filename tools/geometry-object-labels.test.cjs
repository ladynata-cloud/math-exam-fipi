'use strict';
// Display-only audit: source taskSpec snapshots remain byte-for-byte identical.
const assert=require('node:assert/strict'),test=require('node:test'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom'),D=require('../ege-baza/path/data'),names=require('../learning/geometry-object-labels');
for(const file of ['practice','equation-practice','grade7-algebra','grade7-geometry','grade7-foundations','pre7-arithmetic','pre7-applications','grade7-geometry-core','grade7-geometry-practice','grade7-geometry-rebuild-base','grade7-geometry-rebuild-foundations','grade7-geometry-rebuild-triangles','grade7-geometry-rebuild-relations','grade7-geometry-rebuild-workbook'])require('../ege-baza/path/'+file);
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
const typed=/(?:Точка|Отрезок|Отрезки|Луч|Прямая|Прямые|Угол|Углы|Окружность|Треугольник)/iu;
const element=(task,id)=>task.model.elements.find(e=>e.id===id);
const label=(task,id)=>names.label(task,element(task,id));
function fixture(){
 const dom=new JSDOM('<main></main>',{url:'https://fixture.test/learning/',runScripts:'outside-only'}),w=dom.window;
 w.PathModels={mount(){},session(_host,_kind,options){return {value:options.value||{},changed(){}};}};
 w.PathData=D;w.PathPracticeView={answerText:step=>String(step.a),wrongFeedback:(_step,_answer,fallback)=>fallback};
 for(const file of ['learning/geometry-object-labels.js','ege-baza/path/grade7-geometry-models.js','ege-baza/path/grade7-geometry-core-models.js','learning/assignment-geometry.js'])w.eval(read(file));
 return {dom,w,host:w.document.querySelector('main')};
}
test('all 126 construction families and 8 classic families have typed selectable objects, without changing task content',()=>{
 let tasks=0,elements=0,renamed=0,neutral=0,constructionFamilies=0,classicFamilies=0;const changedFamilies=new Set();
 for(const meta of D.meta.filter(m=>m.geometryRebuild||/^grade7-g-/.test(m.id))){
  const count=meta.geometryRebuild?D.geometryRebuild.count:/^grade7-g-(?:core|practice)-/.test(meta.id)?216:240;
  const first=D.task(meta.id,0);if(!['grade7-construction','grade7-geometry'].includes(first.model?.kind))continue;
  if(first.model.kind==='grade7-construction')constructionFamilies++;else classicFamilies++;
  for(let seed=0;seed<count;seed++){
   const task=D.task(meta.id,seed),before=JSON.stringify(task),normalized=names.elements(task);tasks++;
   assert.deepEqual(normalized.map(e=>e.id),task.model.elements.map(e=>e.id));
   for(let i=0;i<normalized.length;i++){
    const e=normalized[i];elements++;
    if(e.label!==task.model.elements[i].label){renamed++;changedFamilies.add(meta.id);}
    if(meta.id==='grade7-g-core-point-line-ray'&&e.id==='figure'){
     assert.equal(e.label,'Вся фигура','type-identification answer must not be revealed by the picker');neutral++;
    }else assert.match(e.label,typed,`${meta.id}:${seed}:${e.id}`);
    assert(!/undefined|\bNaN\b|_[A-Z]/.test(e.label),`${meta.id}:${seed}:${e.id} hidden or missing point name`);
    assert(e.description.startsWith(e.label),`${meta.id}:${seed}:${e.id} matching selection readout`);
   }
   for(const build of task.model.constructions||[]){
    const text=names.constructionLabel(task,build);
    assert(!/^(?:Построить|Провести) [A-ZА-Я]+$/u.test(text),`${meta.id}:${seed}:${build.id}`);
    assert(!/^Провести прямая /.test(text));
   }
   assert.equal(JSON.stringify(task),before,'labels cannot rewrite taskSpec, IDs, source equations, figures or answers');
  }
 }
 assert.deepEqual({tasks,elements,renamed,neutral,constructionFamilies,classicFamilies,changedFamilies:changedFamilies.size},{tasks:13872,elements:101642,renamed:43952,neutral:216,constructionFamilies:126,classicFamilies:8,changedFamilies:115});
 console.log(`GEOMETRY_LABEL_AUDIT_OK: ${constructionFamilies}+${classicFamilies} families, ${tasks} variants, ${elements} object labels, ${renamed} clarified captions; ${neutral} intentional neutral classification prompts.`);
});
test('semantic source distinguishes segment, ray, straight line, angle and circle; construction captions agree',()=>{
 const membership=D.task('grade7-r-point-membership',24);
 assert.equal(label(membership,'AB'),'Отрезок AB');assert.equal(label(membership,'line'),'Прямая AB');assert.equal(label(membership,'M'),'Точка M');
 for(const id of ['grade7-r-angle-vertex','grade7-r-angle-protractor'])assert.equal(label(D.task(id,0),'OA'),'Луч OA');
 assert.equal(label(D.task('grade7-r-construct-secant',0),'AB'),'Прямая AB');
 assert.equal(label(D.task('grade7-r-circle-elements',0),'OA'),'Отрезок OA','radius is a segment, not a ray');
 assert.equal(label(D.task('grade7-r-circle-elements',0),'circle'),'Окружность с центром O');
 const perpendicular=D.task('grade7-g-core-perpendicular',0);
 assert.equal(names.constructionLabel(perpendicular,perpendicular.model.constructions[0]),'Провести прямую CD');
 const exterior=D.task('grade7-r-construct-exterior',0);
 assert.equal(names.constructionLabel(exterior,exterior.model.constructions[0]),'Провести луч AD');
 const pair=D.task('grade7-g-triangle-correspondence',0);assert.equal(label(pair,'pair-AB'),'Отрезки AB ↔ DE');
 const angle=D.task('grade7-r-angle-vertex',0);assert.equal(label(angle,'angle'),'Угол AOB');
 const explicit={id:'fixture',model:{diagram:{points:{A:{},B:{}},segments:[{id:'ab',from:'A',to:'B',extent:'line'}]},elements:[]}};
 assert.equal(names.label(explicit,{id:'ab',label:'AB'}),'Прямая AB');
 assert.equal(names.label({model:{}},{id:'unknown',label:'Заданный объект'}),'Заданный объект','unknown models are not guessed');
});
test('a pre-existing bare AB taskSpec is normalized in both saved-assignment and practice renderers; IDs/state/math survive',()=>{
 const task=JSON.parse(JSON.stringify(D.task('grade7-r-point-membership',24))),before=JSON.stringify(task);
 assert.equal(element(task,'AB').label,'AB','fixture retains the old saved data');
 for(const mode of ['assignment','practice']){
  const {dom,w,host}=fixture();let state;
  if(mode==='assignment')w.LearningAssignmentGeometry.mount(host,task);
  else{state={selected:'AB',built:[],revealed:0};w.PathGrade7Construction.mount(host,task,{value:state});}
  const chooser=host.querySelector(mode==='assignment'?'option[value="AB"]':'[data-core-select="AB"]');
  assert.equal(chooser.textContent,'Отрезок AB');
  assert.equal(host.querySelector(mode==='assignment'?'option[value="line"]':'[data-core-select="line"]').textContent,'Прямая AB');
  if(mode==='assignment'){const select=host.querySelector('[data-geometry-select]');select.value='AB';select.dispatchEvent(new w.Event('change'));}
  else chooser.click();
  assert.match(host.querySelector(mode==='assignment'?'[data-geometry-read]':'[data-core-read]').textContent,/^Отрезок AB\./);
  assert(host.querySelector('[data-core-part="AB"] path[stroke="#b54527"]'),'selection keeps the original object ID');
  if(state){assert.equal(state.selected,'AB');assert.equal(state.revealed,0);assert.equal(state.built.length,0);}
  assert.equal(JSON.stringify(task),before);dom.window.close();
 }
 const {dom,w,host}=fixture(),classic=D.task('grade7-g-triangle-correspondence',0),saved=JSON.stringify(classic);
 w.PathGrade7Geometry.mount(host,classic,{value:{selected:'pair-AB'}});
 assert.equal(host.querySelector('[data-geometry-select="pair-AB"]').textContent,'Отрезки AB ↔ DE');
 assert(host.querySelector('[data-geometry-read]').textContent.startsWith('Отрезки AB ↔ DE.'));
 assert.equal(JSON.stringify(classic),saved);dom.window.close();
});
test('labels remain text in DOM and both entry points load the normalizer before renderers',()=>{
 const task=D.task('grade7-r-point-membership',0),name='<img src=x onerror="throw Error(1)">';task.model.diagram.points.A.label=name;
 const {dom,w,host}=fixture();w.LearningAssignmentGeometry.mount(host,task);
 assert.equal(host.querySelector('option[value="A"]').textContent,'Точка '+name);assert.equal(host.querySelectorAll('img,script').length,0);dom.window.close();
 for(const file of ['learning/index.html','ege-baza/path/index.html']){
  const text=read(file),normalizer=text.indexOf('geometry-object-labels.js'),renderer=text.indexOf('grade7-geometry-core-models.js');
  assert(normalizer>=0&&normalizer<renderer,file+' must normalize old snapshots before mounting');
 }
});

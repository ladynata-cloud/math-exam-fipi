'use strict';
// DOM/event integration, not a claim of browser layout or physical touch coverage.
const {JSDOM}=require('jsdom'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const D=require('../ege-baza/path/data');
for(const f of ['practice','equation-practice','grade7-algebra','grade7-geometry','grade7-foundations','pre7-arithmetic','pre7-applications','grade7-geometry-core','grade7-geometry-practice','grade7-geometry-rebuild-base','grade7-geometry-rebuild-foundations','grade7-geometry-rebuild-triangles','grade7-geometry-rebuild-relations','grade7-geometry-rebuild-workbook'])require('../ege-baza/path/'+f);
const read=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');
function fixture(){const dom=new JSDOM('<main></main>',{url:'https://fixture.test/learning/',runScripts:'outside-only'}),w=dom.window;
 for(const f of ['ege-baza/path/grade7-geometry-core-models.js','learning/assignment-geometry.js','learning/teaching.js'])w.eval(read(f));
 return {dom,w,host:w.document.querySelector('main')};}
function point(host,id){const circle=host.querySelector(`[data-core-part="${id}"] circle`);return [Number(circle.getAttribute('cx')),Number(circle.getAttribute('cy'))];}
function click(host,s){const b=host.querySelector(s);assert(b,s);b.click();}
for(const n of [1,2,3]){
 const {dom,w,host}=fixture(),task=D.task('grade7-r-photo-proof-'+n,23),saved=JSON.stringify(task),cleanup=w.LearningAssignmentGeometry.mount(host,task);
 assert.equal(typeof cleanup,'function');assert(host.querySelector('svg'));
 const originalView=host.querySelector('svg').getAttribute('viewBox');
 click(host,'[data-geometry-zoom="in"]');assert.equal(host.querySelector('output').textContent,'125%');assert.notEqual(host.querySelector('svg').getAttribute('viewBox'),originalView);
 click(host,'[data-geometry-fit]');assert.equal(host.querySelector('svg').getAttribute('viewBox'),originalView);
 const id=n===3?'D':'B',before=point(host,id);
 click(host,'[data-geometry-move="right"]');assert.notDeepEqual(point(host,id),before);
 const paired=n===3?'H':'D';assert.notDeepEqual(point(host,paired),[task.model.diagram.points[paired].x,task.model.diagram.points[paired].y]);
 const picker=host.querySelector('[data-geometry-select]');picker.value=n===3?'DF':'BC';picker.dispatchEvent(new w.Event('change'));
 assert(host.querySelector(`[data-core-part="${picker.value}"] path[stroke="#b54527"]`));
 click(host,'[data-geometry-reset]');assert.deepEqual(point(host,id),before);
 const viewport=host.querySelector('[data-geometry-drawing]');let capture=null;
 viewport.setPointerCapture=id=>{capture=id;};viewport.hasPointerCapture=id=>capture===id;viewport.releasePointerCapture=()=>{capture=null;};
 w.SVGElement.prototype.getScreenCTM=()=>({inverse:()=>({})});
 w.SVGElement.prototype.createSVGPoint=()=>({x:0,y:0,matrixTransform(){return {x:this.x,y:this.y};}});
 const event=(type,target,x=0,y=0)=>{const e=new w.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:9,button:0,clientX:x,clientY:y});target.dispatchEvent(e);};
 event('pointerdown',host.querySelector(`[data-core-part="${id}"] circle`));assert.equal(capture,9);
 event('pointermove',viewport,before[0]+20,before[1]);assert.deepEqual(point(host,id),[before[0]+20,before[1]]);
 event('pointercancel',viewport);const stopped=point(host,id);assert.equal(capture,null);
 event('pointermove',viewport,before[0]+40,before[1]);assert.deepEqual(point(host,id),stopped);
 assert.equal(JSON.stringify(task),saved,'Stored task, answers and model untouched');
 const reset=host.querySelector('[data-geometry-reset]');cleanup();assert.equal(host.childElementCount,0);reset.click();assert.equal(host.childElementCount,0);dom.window.close();
}
{
 const {dom,w,host}=fixture(),task=D.geometryRebuild.families.map(m=>D.task(m.id,1)).find(t=>t.model.constructions.length),saved=JSON.stringify(task);
 w.LearningAssignmentGeometry.mount(host,task);const b=host.querySelector('[data-geometry-build]');assert(b);b.click();assert.equal(b.getAttribute('aria-pressed'),'true');b.click();assert.equal(b.getAttribute('aria-pressed'),'false');assert.equal(JSON.stringify(task),saved);assert(!host.querySelector('[data-geometry-point]'));dom.window.close();
}
(async()=>{
 for(const mode of ['normal','missing','broken','unsupported']){
  const {dom,w,host}=fixture(),task=D.task('grade7-r-photo-proof-1',23),calls=[];
  if(mode==='missing')delete w.PathGrade7Construction;
  if(mode==='broken')w.PathGrade7Construction.svg=()=>{throw Error('fixture failure');};
  if(mode==='unsupported')task.model.kind='unsupported';
  const attempt={id:'test-attempt',trainerId:'ege-path',contentId:task.id,taskSpec:{task},state:{work:{answers:['saved-answer']}}},before=JSON.stringify(attempt);
  const cleanup=w.LearningTeaching.mount(host,{page:'assignment',id:'fixture',account:{role:'teacher'},catalog:{items:[]},api:async url=>{calls.push(url);return {assignment:{id:'fixture',title:'Test assignment',status:'published'},attempt,photos:[{id:'fixture-photo',kind:'task',url:'/api/learning/photos/fixture-photo',filename:'condition.png'}],feedback:[]};}});
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(host.querySelector('[data-assignment-geometry]').hidden,mode!=='normal');
  assert(host.querySelector('a[href="#attempt=test-attempt"]'),'Trainer link survives every fallback');
  assert(host.querySelector('.teaching-task-photos img'),'Large written condition survives every fallback');
  if(mode==='normal')click(host,'[data-geometry-move="right"]');
  assert.deepEqual(calls,['/assignments/fixture']);assert.equal(JSON.stringify(attempt),before);
  cleanup();assert.equal(host.childElementCount,0);dom.window.close();
 }
 console.log('ASSIGNMENT_GEOMETRY_DOM_OK: mount, zoom, selection, constructions, button/pointer movement, cancellation, teardown, exact saved variant and assignment fallbacks.');
})().catch(error=>{console.error(error);process.exitCode=1;});

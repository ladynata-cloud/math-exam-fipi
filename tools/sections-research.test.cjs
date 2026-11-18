'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '..');
const course = require('../stereo-course/sections/data/course.json');
const source = fs.readFileSync(path.join(root, 'stereo-course/sections/assets/app.js'), 'utf8');
const key = 'mathexam.sections.master.activities.v1';
function boot(saved = {}, hash = '') {
  const dom = new JSDOM('<!doctype html><a class="skip-link"></a><div id="sections-app"></div>', { url:'https://example.test/stereo-course/sections/' + hash, runScripts:'outside-only', pretendToBeVisual:true });
  const w = dom.window, errors = [];
  w.addEventListener('error', e => errors.push(e.error));
  w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = () => {};
  w.SVGElement.prototype.getBBox = function () { return {x:0,y:-16,width:Math.max(12,this.textContent.length*12),height:20}; };
  for (const [k,v] of Object.entries(saved)) w.localStorage.setItem(k,v);
  w.COURSE = w.JSON.parse(JSON.stringify(course)); w.eval(source);
  const doc = w.document;
  return {w,doc,activity:()=>JSON.parse(JSON.stringify(w.SECTIONS_MASTER.getState())),
    saved:()=>Object.fromEntries(Object.keys(w.localStorage).map(k=>[k,w.localStorage.getItem(k)])),
    close(){assert.deepEqual(errors,[]);w.close();}};
}
function click(f, selector){const node=f.doc.querySelector(selector);assert(node,selector);node.click();}
function choose(f, selector, value){const node=f.doc.querySelector(selector);assert(node,selector);node.value=String(value);node.dispatchEvent(new f.w.Event('change',{bubbles:true}));}
function note(f, text){const node=f.doc.querySelector('#research-note');assert(node);node.value=text;node.dispatchEvent(new f.w.Event('input',{bubbles:true}));}
function observeAll(f,stage){for(const action of stage.research.actions)click(f,'[data-action="research-observe"][data-experiment="'+action.id+'"]');}

test('each of 26 thematic entries binds an existing scene and allows a wrong forecast before observation',()=>{
  const f=boot();
  try {
    assert.equal(course.learningPath.length,26);
    assert.equal(new Set(course.learningPath.map(s=>s.research.question)).size,26);
    for(const stage of course.learningPath){
      const spec=stage.research;
      assert(spec.question&&spec.conclusion&&spec.boundary&&spec.transfer,stage.id);
      assert(Number.isInteger(spec.answer)&&spec.answer>=0&&spec.answer<spec.predictions.length);
      assert(spec.actions.length>=2);
      if(spec.source==='lesson'){
        const lesson=course.lessons.find(l=>l.id===spec.lessonId);assert(lesson,stage.id);
        const planes=new Set([...lesson.model.faces,...(lesson.model.planes||[])].map(p=>p.id));
        for(const action of spec.actions){assert(action.count>=0&&action.count<=lesson.steps.length);assert(planes.has(action.planeId),stage.id+': '+action.planeId);}
      }else{
        assert(f.w.SECTION_ACTIVITIES.labFamilies.some(l=>l.id===spec.family));
        for(const a of spec.actions){const m=f.w.SECTION_ACTIVITIES.makeLab(spec.family,a.level,a.height);assert(Number.isFinite(m.area));}
      }
      f.w.SECTIONS_MASTER.openResearch(stage.id);
      assert.equal(f.activity().view,'research');
      assert.equal(f.doc.querySelectorAll('#master-portal .model-final').length,0);
      assert([...f.doc.querySelectorAll('[data-action="research-observe"]')].every(b=>b.disabled));
      click(f,'[data-action="research-observe"]');
      assert.deepEqual(f.activity().research.states[stage.id].observed,[]);
      const wrong=(spec.answer+1)%spec.predictions.length;
      choose(f,'#research-prediction',wrong);
      observeAll(f,stage);
      let work=f.activity().research.states[stage.id];
      assert.equal(work.prediction,String(wrong));assert.equal(work.locked,true);
      assert.equal(f.doc.querySelector('#research-prediction').disabled,true);
      assert.equal(f.doc.querySelector('[data-action="research-to-lesson"]'),null);
      assert.equal(f.doc.querySelector('[data-action="research-finish"]').disabled,true);
      note(f,'Сравнил оба положения. Теперь нужны основания для общего вывода.');
      click(f,'[data-action="research-finish"]');
      work=f.activity().research.states[stage.id];assert.equal(work.completed,true);assert.equal(work.prediction,String(wrong));
      assert.match(f.doc.querySelector('.research-conclusion').textContent,/уточняет первоначальный прогноз/);
      assert(f.doc.querySelector('[data-action="research-to-lesson"]'));
      assert.equal(work.nextLesson,stage.lessons[0]);
    }
  }finally{f.close();}
});

test('new first entry is research; an exact old exercise link and saved attempt remain reachable',()=>{
  const f=boot();try{
    click(f,'[data-action="path-start"]');assert.equal(f.activity().view,'research');
    assert.equal(f.doc.querySelector('[data-research-stage]').dataset.researchStage,'begin-01');
    choose(f,'#research-prediction','unknown');observeAll(f,course.learningPath[0]);note(f,'Поворот не меняет принадлежность точки.');
    click(f,'[data-action="research-finish"]');click(f,'[data-action="research-to-lesson"]');
    assert.equal(f.activity().view,'lessons');assert.equal(f.w.SECTIONS_APP.getState().current,'starter-01');
    assert.equal(f.w.SECTIONS_APP.getState().tasks['starter-01'].helpUsed,true,'research of the same authored model counts as exposure');
  }finally{f.close();}
  const direct=boot({},'#starter-18');try{assert.equal(direct.activity().view,'lessons');assert.equal(direct.w.SECTIONS_APP.getState().current,'starter-18');}finally{direct.close();}
});

test('unfinished research survives reload with its original forecast and preserves a prior record on retry',()=>{
  const f=boot();let reloaded;
  try{
    f.w.SECTIONS_MASTER.openResearch('main-13');
    choose(f,'#research-prediction','0');click(f,'[data-experiment="level-2"]');
    const previous=f.activity().research.states['main-13'];
    reloaded=boot(f.saved());assert.equal(reloaded.activity().view,'research');
    assert.deepEqual(reloaded.activity().research.states['main-13'],previous);
    const stage=course.learningPath.find(s=>s.id==='main-13');
    observeAll(reloaded,stage);note(reloaded,'На точном уровне нужно считать совпавшие точки один раз.');
    click(reloaded,'[data-action="research-finish"]');click(reloaded,'[data-action="research-restart"]');
    const next=reloaded.activity().research.states['main-13'];
    assert.equal(next.prediction,'');assert.equal(next.completed,false);assert.deepEqual(next.observed,[]);
    assert.equal(next.history[0].prediction,'0');assert.equal(next.history[0].completed,true);
    assert.match(next.history[0].notes,/совпавшие/);
  }finally{f.close();reloaded?.close();}
});

test('a missing forecast cannot be resurrected as completed research by malformed saved fields',()=>{
  const saved={[key]:JSON.stringify({view:'research',path:{stageId:'begin-01'},research:{states:{'begin-01':{version:1,prediction:'garbage',observed:['view-1','view-2'],lastAction:'view-2',locked:true,completed:true,notes:'старый текст'}}}})};
  const f=boot(saved);try{
    const work=f.activity().research.states['begin-01'];
    assert.equal(work.prediction,'');assert.equal(work.completed,false);assert.deepEqual(work.observed,[]);
    assert.equal(f.doc.querySelector('[data-action="research-to-lesson"]'),null);
  }finally{f.close();}
});

test('editing a recorded conclusion requires saving it again and preserves the original forecast',()=>{
  const f=boot();try{
    f.w.SECTIONS_MASTER.openResearch('begin-01');choose(f,'#research-prediction','unknown');
    observeAll(f,course.learningPath[0]);note(f,'Положение точки относительно грани не меняется.');
    click(f,'[data-action="research-finish"]');assert.equal(f.activity().research.states['begin-01'].completed,true);
    note(f,'');assert.equal(f.activity().research.states['begin-01'].completed,false);
    assert.equal(f.doc.querySelector('.research-conclusion'),null);assert.equal(f.doc.querySelector('[data-action="research-finish"]').disabled,true);
    note(f,'Поворот меняет вид, но не принадлежность точки грани.');click(f,'[data-action="research-finish"]');
    assert.equal(f.activity().research.states['begin-01'].prediction,'unknown');assert(f.doc.querySelector('[data-action="research-to-lesson"]'));
  }finally{f.close();}
});

test('a recorded research forecast starts its map stage without certifying an independent construction',()=>{
  const f=boot();try{
    f.w.SECTIONS_MASTER.openResearch('begin-01');choose(f,'#research-prediction','unknown');
    f.w.SECTIONS_MASTER.show('map');
    assert.match(f.doc.querySelector('.path-summary').textContent,/Начато этапов: 1 из 26/);
    assert.match(f.doc.querySelector('.path-summary').textContent,/Проверены выборы на новом примере: 0 из 26/);
    assert.match(f.doc.querySelector('[data-path-stage="begin-01"]').closest('li').textContent,/Исследование в работе/);
    assert(f.doc.querySelector('[data-action="research-resume"]'));
  }finally{f.close();}
});

test('all module laboratories are reachable; blank forecast blocks new lab work while unknown is honest',()=>{
  const f=boot();try{
    assert.equal(f.doc.querySelectorAll('[data-module-lab]').length,15);
    f.w.SECTIONS_MASTER.openLab('cube-sum');
    assert.equal(f.doc.querySelector('[data-action="lab-next"]').disabled,true);
    click(f,'[data-action="lab-next"]');assert.equal(f.activity().labs.states['cube-sum'].revealed,0);
    choose(f,'select[aria-label="Прогноз пересечения"]','unknown');
    click(f,'[data-action="lab-next"]');
    const started=f.activity().labs.states['cube-sum'];assert.equal(started.revealed,1);assert.equal(started.prediction,'unknown');assert.equal(started.predictionLocked,true);
    const slider=f.doc.querySelector('#lab-level');slider.value='1';slider.dispatchEvent(new f.w.Event('change',{bubbles:true}));
    const fresh=f.activity().labs.states['cube-sum'];assert.equal(fresh.revealed,0);assert.equal(fresh.prediction,'');assert.equal(fresh.history.at(-1).prediction,'unknown');
  }finally{f.close();}
});

test('a historical lab started without a forecast resumes without inventing a forecast',()=>{
  const saved={[key]:JSON.stringify({view:'labs',labs:{family:'cube-sum',states:{'cube-sum':{level:1.5,height:1,revealed:1,justBuilt:false,prediction:'',predictionLocked:true,notes:'прежний опыт',flat:false,camera:{yaw:-.65,pitch:.46},history:[]}}}})};
  const f=boot(saved);try{
    assert.match(f.doc.querySelector('#master-portal').textContent,/прежний опыт начат без прогноза/);
    click(f,'[data-action="lab-next"]');const work=f.activity().labs.states['cube-sum'];
    assert.equal(work.revealed,2);assert.equal(work.prediction,'');assert.equal(work.notes,'прежний опыт');
  }finally{f.close();}
});

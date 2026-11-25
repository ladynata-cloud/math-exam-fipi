'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const course = require('../stereo-course/sections/data/course.json');
const source = fs.readFileSync(path.join(__dirname, '../stereo-course/sections/assets/app.js'), 'utf8');
const adapter = fs.readFileSync(path.join(__dirname, '../stereo-course/sections/assets/board-session.js'), 'utf8');
const KEY = 'mathexam.sections.master.v1';
const ACTIVITIES = 'mathexam.sections.master.activities.v1';
const copy = value => JSON.parse(JSON.stringify(value));
const pause = () => new Promise(resolve => setTimeout(resolve, 25));

function boot({id='starter-03',tasks={},saved,board=false,courseData=course}={}) {
  const dom=new JSDOM('<!doctype html><body'+(board?' data-sections-board="true"':'')+'><div id="sections-app"></div></body>',{
    url:'https://example.test/'+(board?'trainers/sections-from-zero.html':'stereo-course/sections/')+'#'+id,runScripts:'outside-only',pretendToBeVisual:true
  });
  const w=dom.window,errors=[];
  w.TextEncoder=TextEncoder;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.SVGElement.prototype.getBBox=function(){return {x:0,y:-16,width:Math.max(12,this.textContent.length*12),height:20};};
  w.addEventListener('error',event=>errors.push(event.error));
  for(const [key,value] of Object.entries(saved || {[KEY]:JSON.stringify({version:1,current:id,tasks}),[ACTIVITIES]:JSON.stringify({view:'lessons'})}))w.localStorage.setItem(key,value);
  w.COURSE=w.JSON.parse(JSON.stringify(courseData));
  if(board){w.MathExamBoard={register(){return {destroy(){}};}};w.eval(adapter);}
  w.eval(source);
  return {w,doc:w.document,state:()=>copy(w.SECTIONS_APP.getState()),work:()=>copy(w.SECTIONS_APP.getState().tasks[w.SECTIONS_APP.getState().current]?.construction),
    saved:()=>Object.fromEntries(Object.keys(w.localStorage).map(key=>[key,w.localStorage.getItem(key)])),
    async close(){await pause();w.SECTIONS_BOARD_SESSION?.destroy();assert.deepEqual(errors,[]);w.close();}};
}
function click(f,selector){const node=f.doc.querySelector(selector);assert(node,selector);node.click();}
function fill(f,values){
  click(f,'[data-construction-plane="'+values.plane+'"]');
  for(const [key,value] of Object.entries(values)){
    if(key==='plane')continue;
    const field=f.doc.querySelector('[data-construction-input="'+key+'"]');assert(field,key);field.value=value;
    assert.equal(field.value,value,'offered known element '+key+'='+value);
    field.dispatchEvent(new f.w.Event('change',{bubbles:true}));
  }
}
const segment=(plane,a,b,role='helper')=>({plane,a,b,role});
const intersection=(plane,firstA,firstB,secondA,secondB,location)=>({plane,firstA,firstB,secondA,secondB,...(location?{location}:{})});
const solutions={
  'starter-03':[{plane:'DHEA',point:'M'}],
  'starter-19':[{plane:'EFGH',point:'M'}],
  'starter-06':[segment('DHEA','M','N')],
  'starter-20':[segment('BFGC','M','N')],
  'starter-09':[segment('DHEA','D','E'),segment('DHEA','H','A'),intersection('DHEA','D','E','H','A')],
  'starter-21':[segment('EFGH','E','G'),segment('EFGH','F','H'),intersection('EFGH','E','G','F','H')],
  'starter-12':[segment('ABCD','M','N'),intersection('ABCD','M','N','C','D','edge'),{plane:'CGHD',point:'X',edgeA:'C',edgeB:'D'},segment('CGHD','X','P')],
  'starter-22':[segment('ABCD','M','N'),intersection('ABCD','M','N','C','D','edge'),{plane:'CGHD',point:'X',edgeA:'C',edgeB:'D'},segment('CGHD','X','P')],
  'starter-15':[segment('SAB','M','N','section'),segment('ABC','N','P','section'),segment('SCA','P','M','section')],
  'starter-23':[segment('SAB','M','N','section'),segment('ABC','N','P','section'),segment('SBC','P','M','section')],
  'starter-18':[segment('AEFB','M','N','section'),segment('BFGC','N','P','section'),segment('CGHD','P','Q','section'),segment('DHEA','Q','M','section')],
  'starter-24':[segment('AEFB','M','N','section'),segment('BFGC','N','P','section'),segment('CGHD','P','Q','section'),segment('DHEA','Q','M','section')],
  'bridge-03':[segment('BFGC','M','N','section'),{plane:'DHEA',point:'P',directionA:'M',directionB:'N',edgeA:'D',edgeB:'H'}],
  'bridge-19':[segment('BFGC','M','N','section'),{plane:'DHEA',point:'P',directionA:'M',directionB:'N',edgeA:'D',edgeB:'H'}],
  'bridge-06':[segment('AEFB','M','N','section'),intersection('AEFB','M','N','A','B','extension'),intersection('ABCD','X','P','A','D','edge'),segment('ABCD','Y','P','section')],
  'bridge-20':[segment('BFGC','M','N','section'),intersection('BFGC','M','N','B','C','extension'),intersection('ABCD','X','P','A','B','edge'),segment('ABCD','Y','P','section')],
  'bridge-09':[segment('ABCD','B','D'),{plane:'BDF',a:'B',b:'D',c:'F'},segment('BDF','M','N')],
  'bridge-21':[segment('ABCD','B','D'),{plane:'BDF',a:'B',b:'D',c:'F'},segment('BDF','M','N')],
  'bridge-12':[segment('BDF','B','H'),segment('BDF','M','P'),intersection('BDF','M','P','D','H','edge')],
  'bridge-22':[segment('BDF','B','H'),segment('BDF','M','P'),intersection('BDF','M','P','D','H','edge')],
  'bridge-15':[segment('ABCD','K','L'),segment('MKL','K','M'),segment('MKL','L','N'),segment('MKL','M','N')],
  'bridge-23':[segment('ABCD','K','L'),segment('MKL','K','M'),segment('MKL','L','N'),segment('MKL','M','N')],
  'bridge-18':[segment('SBC','M','N','section'),intersection('SBC','M','N','B','C','extension'),intersection('ABC','X','P','C','A','edge'),segment('SCA','N','Q','section'),segment('SAB','P','M','section')],
  'bridge-24':[segment('SCA','M','N','section'),intersection('SCA','M','N','C','A','extension'),intersection('ABC','X','P','A','B','edge'),segment('SAB','N','Q','section'),segment('SBC','P','M','section')]
};
function start(f,id){f.w.SECTIONS_MASTER?.openLesson(id);assert.equal(f.w.SECTIONS_APP.startConstruction(id),true);}
function action(f,selection){
  if(f.doc.querySelector('[data-action="construction-next"]'))click(f,'[data-action="construction-next"]');
  fill(f,selection);click(f,'[data-action="construction-submit"]');
}
function finish(f,id){
  const lesson=course.lessons.find(l=>l.id===id);
  if(lesson.result.polygon){
    // Deliberately reverse and rotate the authored boundary: the geometry is equivalent.
    const order=lesson.result.polygon.slice().reverse();order.push(order.shift());
    order.forEach(name=>click(f,'[data-construction-vertex="'+name+'"]'));
    click(f,'[data-action="construction-boundary-submit"]');
  }
  if(lesson.check)click(f,'[data-construction-check="'+lesson.check.correct+'"]');
}

test('exactly the approved 24 cards offer an action-checked mode and start with no selected answers',async()=>{
  const f=boot();try{
    assert.deepEqual(course.lessons.filter(l=>f.w.SECTIONS_APP.supportsConstruction(l.id)).map(l=>l.id).sort(),Object.keys(solutions).sort());
    start(f,'starter-06');
    assert.equal(f.doc.querySelectorAll('[data-construction-plane][aria-pressed="true"]').length,0);
    for(const select of f.doc.querySelectorAll('[data-construction-input]'))assert.equal(select.value,'');
    click(f,'[data-action="construction-submit"]');assert.equal(f.work().actions.length,0);assert.equal(f.work().completed,false);
    assert.equal(f.work().evidence,undefined);
  }finally{await f.close();}
});

test('all 24 retained conditions can be completed through real element choices without upgrading guided history',async t=>{
  const f=boot();try{
    for(const [id,selections] of Object.entries(solutions))await t.test(id,()=>{
      start(f,id);
      selections.forEach((selection,index)=>{
        if(f.doc.querySelector('[data-action="construction-next"]'))click(f,'[data-action="construction-next"]');
        const card=f.doc.querySelector('[data-construction-step]');
        assert.doesNotMatch(card.querySelector('h4').textContent,/[A-Z]/,'heading must not supply authored endpoint or plane names');
        if(selection.role)assert.doesNotMatch(card.querySelector('h4 + p').textContent,/вспомогательн|сторон[ау] сечения/,'role is chosen by the learner');
        const location=card.querySelector('label[for="construction-location"]');
        if(location)assert.doesNotMatch(location.textContent,/[A-Z]/,'location question must not reveal the correct edge before line selection');
        action(f,selection);
        assert.equal(f.work().actions.length,index+1,JSON.stringify(f.work().feedback));
        assert.equal(f.work().evidence,undefined,'a reveal alone is not completion');
      });
      finish(f,id);
      assert.equal(f.work().completed,true);assert.equal(f.work().evidence,'first');
      assert.equal(f.state().tasks[id].revealed,0);assert.equal(f.state().tasks[id].mode,'choose');
      assert.equal(f.state().tasks[id].choiceEvidence,undefined);
      assert.match(f.doc.querySelector('.construction-finish').textContent,/доказательство автоматически не оценивается/);
    });
  }finally{await f.close();}
});

test('geometric equivalence accepts reversed endpoints, reversed intersection lines and a different valid plane triple',async()=>{
  const f=boot();try{
    const api=f.w.SECTIONS_APP;
    assert.equal(api.checkConstructionAction('starter-06',0,segment('DHEA','N','M')).correct,true);
    assert.equal(api.checkConstructionAction('bridge-06',1,intersection('AEFB','B','A','N','M','extension')).correct,true);
    assert.equal(api.checkConstructionAction('bridge-09',1,{plane:'BDF',a:'D',b:'H',c:'B'}).correct,true);
    assert.equal(api.checkConstructionAction('bridge-03',1,{plane:'DHEA',point:'P',directionA:'N',directionB:'M',edgeA:'H',edgeB:'D'}).correct,true);
    assert.equal(api.checkConstructionAction('bridge-12',1,segment('BDF','P','M')).correct,true);
  }finally{await f.close();}
});

test('parallel transfer requires a point on the actual trace and the known trace direction, not an incidental target hit',async()=>{
  const f=boot();try{
    const api=f.w.SECTIONS_APP,invalid=[
      {plane:'DHEA',point:'A',directionA:'G',directionB:'M',edgeA:'H',edgeB:'D'},
      {plane:'DHEA',point:'E',directionA:'C',directionB:'M',edgeA:'H',edgeB:'D'}
    ];
    for(const selection of invalid)assert.equal(api.checkConstructionAction('bridge-19',1,selection).code,'parallel-origin');
    assert.equal(api.checkConstructionAction('bridge-19',1,{...invalid[0],point:'P'}).code,'parallel-direction');
    start(f,'bridge-19');action(f,solutions['bridge-19'][0]);
    action(f,invalid[0]);assert.equal(f.work().actions.length,1);assert.equal(f.work().completed,false);
    assert.equal(f.doc.querySelector('[data-point="Q"]'),null,'an invalid action cannot expose the new point');
    assert.equal(f.doc.querySelector('[data-segment="P-Q"]'),null);
    action(f,{plane:'DHEA',point:'P',directionA:'N',directionB:'M',edgeA:'H',edgeB:'D'});finish(f,'bridge-19');
    assert.equal(f.work().completed,true);assert.equal(f.work().evidence,'corrected');
  }finally{await f.close();}
  // Independent equivalent-coordinate fixture: a differently named anchor and
  // half-length reversed direction still describe the same geometric action.
  const variant=copy(course),lesson=variant.lessons.find(l=>l.id==='bridge-19');
  lesson.model.points.J=lesson.model.points.P.slice();
  lesson.model.points.T=lesson.model.points.M.map((v,i)=>(v+lesson.model.points.N[i])/2);
  lesson.model.given.push('J','T');
  const alias=boot({id:'bridge-19',courseData:variant});try{
    const selection={plane:'DHEA',point:'J',directionA:'N',directionB:'T',edgeA:'H',edgeB:'D'};
    assert.equal(alias.w.SECTIONS_APP.checkConstructionAction('bridge-19',1,selection).correct,true);
    start(alias,'bridge-19');action(alias,solutions['bridge-19'][0]);action(alias,selection);
    assert(alias.doc.querySelector('[data-segment="J-Q"][data-kind="section"]'),'render the accepted anchor instead of substituting an authored pair');
  }finally{await alias.close();}
});

test('finding a trace intersection does not disclose the next finite segment or classify it before the learner',async()=>{
  const f=boot();try{
    for(const id of ['bridge-06','bridge-20']) {
      start(f,id);solutions[id].slice(0,3).forEach(selection=>action(f,selection));
      assert(f.doc.querySelector('[data-point="Y"]'));
      assert(f.doc.querySelector('[data-segment="X-P"][data-kind="helper"], [data-segment="P-X"][data-kind="helper"]'));
      assert.equal(f.doc.querySelector('[data-segment="Y-P"], [data-segment="P-Y"]'),null);
      assert.doesNotMatch(f.doc.querySelector('.construction-action').textContent,/YP|PY/,'accepted-point confirmation must not give the future endpoint pair');
      const history=[...f.doc.querySelectorAll('details')].find(n=>n.querySelector('summary')?.textContent==='Мои принятые действия');
      assert.doesNotMatch(history.textContent,/YP|PY/,'accepted history contains only actions the learner performed');
      action(f,{...solutions[id][3],role:'helper'});assert.equal(f.work().actions.length,3);
      assert.equal(f.doc.querySelector('[data-segment="Y-P"][data-kind="section"]'),null);
      action(f,solutions[id][3]);assert(f.doc.querySelector('[data-segment="Y-P"][data-kind="section"]'));
      click(f,'[data-action="construction-undo"]');
      assert.equal(f.doc.querySelector('[data-segment="Y-P"], [data-segment="P-Y"]'),null,'undo removes the accepted finite segment, not merely the counter');
      assert.equal(f.work().helpUsed,false);
    }
  }finally{await f.close();}
});

test('a section side obtained inside an intersection is drawn as boundary only after its explicit final confirmation',async()=>{
  const f=boot();try{
    for(const id of ['bridge-18','bridge-24']) {
      start(f,id);solutions[id].forEach(selection=>action(f,selection));
      assert.equal(f.doc.querySelector('[data-segment="Q-P"][data-kind="section"], [data-segment="P-Q"][data-kind="section"]'),null);
      const polygon=course.lessons.find(l=>l.id===id).result.polygon.slice().reverse();
      polygon.forEach(name=>click(f,'[data-construction-vertex="'+name+'"]'));click(f,'[data-action="construction-boundary-submit"]');
      assert(f.doc.querySelector('[data-segment="Q-P"][data-kind="section"], [data-segment="P-Q"][data-kind="section"]'));
      assert(f.doc.querySelector('.model-final'));
      click(f,'[data-construction-vertex="'+polygon[0]+'"]');
      assert.equal(f.doc.querySelector('[data-segment="Q-P"][data-kind="section"], [data-segment="P-Q"][data-kind="section"]'),null,'editing the unconfirmed boundary removes its accepted classification');
      assert.equal(f.doc.querySelector('.model-final'),null);
    }
  }finally{await f.close();}
});

test('manual actions feed map progress and the later check without upgrading the old attempt',async()=>{
  const f=boot();try{
    const now=Date.UTC(2026,10,16);f.w.Date.now=()=>now;
    start(f,'starter-03');f.w.SECTIONS_MASTER.show('map');
    assert.equal(f.doc.querySelector('[data-action="path-start"]').textContent,'Продолжить занятие');
    assert.equal(f.doc.querySelector('[data-action="path-start"]').dataset.nextLesson,'starter-03');
    click(f,'[data-action="path-start"]');action(f,solutions['starter-03'][0]);finish(f,'starter-03');
    assert.equal(f.work().evidenceAt,now);assert.equal(f.state().tasks['starter-03'].choiceEvidence,undefined);
    f.w.SECTIONS_MASTER.show('map');
    assert.match(f.doc.querySelector('.path-summary').textContent,/Проверены выборы на новом примере: 1 из 26/);
    assert.match(f.doc.querySelector('.stage-review').textContent,/Через сутки/);
    f.w.Date.now=()=>now+24*60*60*1000;f.w.SECTIONS_MASTER.show('map');assert(f.doc.querySelector('[data-action="path-review"]'));
    f.w.SECTIONS_MASTER.openLesson('starter-03');click(f,'[data-action="construction-undo"]');
    assert.equal(f.work().completed,false);assert.equal(f.work().evidence,'first');
    f.w.SECTIONS_MASTER.show('map');assert.equal(f.doc.querySelector('[data-action="path-start"]').textContent,'Продолжить занятие');
    assert.match(f.doc.querySelector('.path-summary').textContent,/Проверены выборы на новом примере: 1 из 26/);
  }finally{await f.close();}
});

test('leaving a partial manual draft keeps its map progress and resumes the actual saved action',async()=>{
  const f=boot({id:'starter-09'});let restored;
  try{
    start(f,'starter-09');action(f,solutions['starter-09'][0]);click(f,'[data-action="construction-leave"]');
    assert.equal(f.work().active,false);f.w.SECTIONS_MASTER.show('map');
    assert(f.doc.querySelector('[data-action="path-resume"]'));assert.equal(f.doc.querySelector('[data-action="path-start"]').dataset.nextLesson,'starter-09');
    assert.match(f.doc.querySelector('[data-path-lesson="starter-09"]').closest('li').textContent,/1 из 3 действий/);
    restored=boot({id:'starter-09',saved:f.saved()});restored.w.SECTIONS_MASTER.show('map');click(restored,'[data-action="path-resume"]');
    assert.equal(restored.work().active,true);assert.equal(restored.work().actions.length,1);
    assert.equal(restored.state().tasks['starter-09'].revealed,0);assert(restored.doc.querySelector('.construction-heading'));
  }finally{if(restored)await restored.close();await f.close();}
});

test('invalid spatial actions have distinct diagnostics and do not create geometry or an unaided result',async()=>{
  const f=boot();try{
    const api=f.w.SECTIONS_APP,check=(id,index,selection,code)=>assert.equal(api.checkConstructionAction(id,index,selection).code,code);
    check('starter-06',0,segment('DHEA','M','M'),'same-point');
    check('starter-06',0,segment('DHEA','M','B'),'different-plane');
    check('starter-06',0,segment('DHEA','M','N','section'),'role');
    check('starter-06',0,segment('ABCD','M','N'),'plane');
    check('bridge-12',2,intersection('BDF','M','P','A','B','edge'),'skew');
    check('bridge-06',1,intersection('AEFB','M','N','A','B','edge'),'finite-edge');
    check('bridge-09',1,{plane:'BDF',a:'B',b:'M',c:'F'},'collinear');
    check('bridge-03',1,{plane:'DHEA',point:'P',directionA:'A',directionB:'B',edgeA:'D',edgeB:'H'},'parallel-plane');
    check('bridge-06',3,segment('ABCD','X','P','section'),'outside-body');
    check('bridge-12',0,segment('BDF','R','B'),'missing');
    start(f,'starter-06');action(f,segment('DHEA','M','B'));assert.equal(f.work().actions.length,0);assert.equal(f.work().mistakes,1);
    action(f,segment('DHEA','M','N'));finish(f,'starter-06');assert.equal(f.work().evidence,'corrected');
  }finally{await f.close();}
});

test('the final boundary rejects missing, external and crossing choices and accepts either cyclic direction',async()=>{
  const f=boot();try{
    const check=names=>f.w.SECTIONS_APP.checkConstructionBoundary('bridge-18',names);
    assert.equal(check(['M','N']).code,'incomplete');
    assert.equal(check(['M','N','X','P']).code,'outside-body');
    assert.equal(check(['M','Q','N','P']).code,'order');
    assert.equal(check(['Q','P','M','N']).correct,true);
    assert.equal(check(['P','Q','N','M']).correct,true);
    start(f,'starter-18');solutions['starter-18'].forEach(s=>action(f,s));
    click(f,'[data-construction-check="'+course.lessons.find(l=>l.id==='starter-18').check.correct+'"]');
    assert.equal(f.work().completed,false);assert.equal(f.work().evidence,undefined,'final multiple choice does not replace boundary construction');
  }finally{await f.close();}
});

test('undo removes an actual action and reload restores the unfinished choices, draft and historical earned evidence',async()=>{
  const f=boot({id:'starter-09'});let restored;try{
    start(f,'starter-09');solutions['starter-09'].forEach(s=>action(f,s));finish(f,'starter-09');
    const earned=f.work().evidenceAt;
    f.w.SECTIONS_APP.markHelp('starter-09','Обсудили готовое построение');
    click(f,'[data-action="construction-undo"]');
    assert.equal(f.work().actions.length,2);assert.equal(f.work().completed,false);assert.equal(f.work().evidenceAt,earned);assert.equal(f.work().helpUsed,true);
    fill(f,{plane:'DHEA',firstA:'E',firstB:'D'});
    const draft=f.doc.getElementById('proof-draft');draft.value='Обе диагонали лежат в DHEA.';draft.dispatchEvent(new f.w.Event('input'));
    restored=boot({id:'starter-09',saved:f.saved()});
    assert.equal(restored.work().actions.length,2);assert.equal(restored.work().selection.firstA,'E');assert.equal(restored.work().selection.firstB,'D');
    assert.equal(restored.work().helpUsed,true);assert.equal(restored.work().evidenceAt,earned);
    assert.equal(restored.doc.getElementById('proof-draft').value,'Обе диагонали лежат в DHEA.');
    assert.equal(restored.doc.querySelector('[data-construction-input="secondA"]').value,'');
    fill(restored,intersection('DHEA','E','D','A','H'));click(restored,'[data-action="construction-submit"]');finish(restored,'starter-09');
    assert.equal(restored.work().completed,true);assert.equal(restored.work().evidenceAt,earned,'repeat after help preserves only the old earned evidence');
  }finally{if(restored)await restored.close();await f.close();}
});

test('guided records remain unchanged and a seen guided answer cannot become new unaided action evidence',async()=>{
  const legacy={mode:'practice',revealed:1,viewCount:1,approved:-1,independentSteps:1,attemptEvidenceVersion:1,mistakes:2,choiceEvidence:'corrected',choiceEvidenceAt:1790000000000,draft:'Моя прежняя запись'};
  const f=boot({id:'starter-06',tasks:{'starter-06':legacy}});try{
    const before=f.state().tasks['starter-06'];start(f,'starter-06');action(f,segment('DHEA','M','N'));finish(f,'starter-06');
    assert.equal(f.work().completed,true);assert.equal(f.work().helpUsed,true);assert.equal(f.work().evidence,undefined);
    const after=f.state().tasks['starter-06'];delete after.construction;assert.deepEqual(after,before);
    click(f,'[data-action="construction-leave"]');assert.equal(f.state().tasks['starter-06'].choiceEvidence,'corrected');
  }finally{await f.close();}
});

test('new personal construction never enters the existing board state or reads personal construction work',async()=>{
  const f=boot({id:'starter-06',board:true,tasks:{'starter-06':{construction:{version:1,active:true,actions:[],selection:{a:'M'}}}}});try{
    const personal=f.saved(),before=copy(f.w.__sectionsBoard.getState());
    assert.equal(f.w.SECTIONS_APP.supportsConstruction('starter-06'),false);
    assert.equal(f.w.SECTIONS_APP.startConstruction('starter-06'),false);
    assert.equal(f.doc.querySelector('[data-action="start-construction"]'),null);
    assert.equal(Object.hasOwn(before.work,'construction'),false);
    assert.equal(f.w.__sectionsBoard.validateState(f.w.JSON.parse(JSON.stringify(before))),true);
    assert.deepEqual(copy(f.w.__sectionsBoard.getState()),before);assert.deepEqual(f.saved(),personal);
  }finally{await f.close();}
});

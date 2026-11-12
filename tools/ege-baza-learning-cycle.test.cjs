'use strict';
const {JSDOM,VirtualConsole}=require('jsdom'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),errors=[],tick=()=>new Promise(resolve=>setTimeout(resolve,5));
function create(saved,hash='lesson=round'){
 const vc=new VirtualConsole();vc.on('jsdomError',error=>errors.push(error.message));
 const dom=new JSDOM(fs.readFileSync(path.join(root,'ege-baza/path/index.html'),'utf8'),{url:'https://course.test/ege-baza/path/index.html#'+hash,runScripts:'outside-only',virtualConsole:vc}),w=dom.window;
 w.structuredClone=structuredClone;w.matchMedia=()=>({matches:true});w.URL.createObjectURL=()=> 'blob:test';w.URL.revokeObjectURL=()=>{};
 if(saved)w.localStorage.setItem('mathexam.ege-baza.path.v1',saved);
 for(const script of w.document.querySelectorAll('script'))w.eval(fs.readFileSync(path.join(root,new URL(script.src).pathname),'utf8'));
 return {w,d:w.document};
}
function submit(w,d,prefix,value){const field=d.querySelector('#'+prefix);field.value=String(value);field.dispatchEvent(new w.Event('input',{bubbles:true}));d.querySelector('#'+prefix+'Form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
const open=async(d,id)=>{d.querySelector('#'+id).open=true;await tick();};
(async()=>{
 const {w,d}=create(),state=w.PathCourse.state(),D=w.PathData;
 // The actual bank receives task-specific repair, without prematurely revealing a solution.
 for(const meta of D.meta.filter(m=>!m.grade7&&!m.pre7)){
  const task=D.task(meta.id,11),message=w.PathTaskFirst.learningFeedback(task,'-987654321');
  assert.equal(typeof message,'string',meta.id);assert(message.length>30,meta.id);assert(!message.includes('Проверь, что нужно найти, знак и единицы'),meta.id);
 }
 // Subject-specific wording must still reject incomplete matching and preserve the real attempt.
 const matching=create(null,'lesson=practice-inequality-match'),match=matching.w.PathCourse.state().lessons['practice-inequality-match'];
 const matchingCount=match.independent,matchingChecks=match.checks.length;
 submit(matching.w,matching.d,'answer','12');
 assert(matching.d.querySelector('#feedback').classList.contains('bad'));
 assert.match(matching.d.querySelector('#feedback').textContent,/Проверь каждое соответствие отдельно\./);
 assert.equal(!!match.done,false);assert.equal(match.attempted,true);assert.equal(match.help,true);assert.equal(match.independent,matchingCount);assert.equal(match.checks.length,matchingChecks);assert.equal(match.taskFirst.finalDraft,'12');assert.equal(match.taskFirst.mistakes,1);
 const matchingRestored=create(matching.w.localStorage.getItem(matching.w.PathCourse.KEY),'lesson=practice-inequality-match');
 const matchAgain=matchingRestored.w.PathCourse.state().lessons['practice-inequality-match'];
 assert.equal(matchingRestored.d.querySelector('#answer').value,'12');assert.equal(!!matchAgain.done,false);assert.equal(matchAgain.attempted,true);assert.equal(matchAgain.help,true);assert.equal(matchAgain.taskFirst.feedbackKind,'bad');assert.equal(matchAgain.taskFirst.mistakes,1);assert.equal(matchAgain.independent,matchingCount);
 const matchingAnswer=String(matchingRestored.w.PathData.task('practice-inequality-match',matchAgain.seed).answer);assert.equal(matchingAnswer.length,4);
 submit(matchingRestored.w,matchingRestored.d,'answer',matchingAnswer);assert.equal(matchAgain.done,true);assert.equal(matchAgain.independent,matchingCount);assert.equal(matchAgain.checks.length,matchingChecks+1);assert.equal(matchAgain.checks.at(-1).independent,false);
 matching.w.close();matchingRestored.w.close();
 // A valid bounded serial can wrap to the same numeric seed; it is still a new attempt.
 const boundary=create(null,'lesson=logic'),boundaryState=boundary.w.PathCourse.state(),boundaryLesson=boundaryState.lessons.logic;
 assert.equal(boundaryLesson.seed,11);boundaryLesson.note='Моя запись о решении';
 const boundaryAnswer=boundary.w.PathData.task('logic',boundaryLesson.seed).answer;
 submit(boundary.w,boundary.d,'answer',boundaryAnswer);const boundaryCount=boundaryLesson.independent,boundaryChecks=JSON.stringify(boundaryLesson.checks);
 boundaryState.serial=1e9-254;assert(boundary.w.PathCourse.valid(boundaryState));boundary.d.querySelector('#new').click();
 assert.equal(boundaryLesson.seed,11);assert.equal(boundaryState.serial,12);assert.equal(boundaryLesson.done,false);assert.equal(boundaryLesson.attempted,false);assert.equal(boundaryLesson.help,false);
 assert.equal(boundary.d.querySelector('#answer').value,'');assert.equal(boundary.d.querySelector('#feedback').textContent,'');assert.equal(boundaryLesson.taskFirst.repeatedVariant,true);assert.match(boundary.d.querySelector('#variantStatus').textContent,/знакомый вариант/);
 assert.equal(boundaryLesson.note,'Моя запись о решении');assert.equal(boundaryLesson.independent,boundaryCount);assert.equal(JSON.stringify(boundaryLesson.checks),boundaryChecks);
 const boundaryReload=create(boundary.w.localStorage.getItem(boundary.w.PathCourse.KEY),'lesson=logic'),boundaryAgain=boundaryReload.w.PathCourse.state().lessons.logic;
 assert.equal(boundaryReload.d.querySelector('#answer').value,'');assert.equal(boundaryReload.d.querySelector('#feedback').textContent,'');assert.equal(boundaryAgain.taskFirst.repeatedVariant,true);assert.equal(boundaryAgain.note,boundaryLesson.note);assert.equal(JSON.stringify(boundaryAgain.checks),boundaryChecks);
 submit(boundaryReload.w,boundaryReload.d,'answer',boundaryAnswer);assert.equal(boundaryAgain.independent,boundaryCount);assert.equal(JSON.stringify(boundaryAgain.checks.slice(0,-1)),boundaryChecks);assert.equal(boundaryAgain.checks.at(-1).independent,false);assert(boundaryReload.w.PathCourse.valid(boundaryReload.w.PathCourse.state()));
 boundary.w.close();boundaryReload.w.close();
 let l=state.lessons.round,t=D.task('round',l.seed),answer=d.querySelector('#answer');
 assert(!d.querySelector('#taskHelp').open);assert(!d.querySelector('#taskIdea').open);assert(d.querySelector('#repairStep').hidden);
 submit(w,d,'answer','');assert.equal(l.taskFirst.mistakes,0,'empty input is not a mathematical error');
 submit(w,d,'answer',t.steps[0].a);assert.match(d.querySelector('#feedback').textContent,new RegExp('В '+t.steps[0].a+' упаковках '+t.steps[0].a*9+' тетрадей'));assert.match(d.querySelector('#feedback').textContent,/Не хватает 4/);assert.equal(l.taskFirst.mistakes,1);assert(d.querySelector('#repairStep').hidden);
 submit(w,d,'answer',-99);assert.equal(l.taskFirst.mistakes,2);assert(!d.querySelector('#repairStep').hidden);assert(!d.querySelector('#taskHelp').open,'help is offered, never forced');assert.equal(d.querySelector('#answer'),answer,'repair feedback preserves original field');
 const saved=w.localStorage.getItem(w.PathCourse.KEY),restored=create(saved);await tick();
 assert.equal(restored.w.PathCourse.state().lessons.round.taskFirst.mistakes,2);assert(!restored.d.querySelector('#repairStep').hidden);assert.equal(restored.d.querySelector('#answer').value,'-99');restored.w.close();
 d.querySelector('#repairStep').click();await tick();assert(d.querySelector('#taskHelp').open);assert(d.querySelector('#taskSteps').open);assert(!d.querySelector('#taskIdea').open,'first question and worked steps do not force full rule');
 const first=d.querySelector('#stepAnswer');first.value='3/';first.dispatchEvent(new w.Event('input'));
 await open(d,'taskIdea');d.querySelector('#returnToAnswer').click();await tick();assert.equal(d.querySelector('#answer'),answer);assert.equal(d.querySelector('#stepAnswer'),first);assert.equal(first.value,'3/');
 const afterHint=create(w.localStorage.getItem(w.PathCourse.KEY));await tick();assert(afterHint.d.querySelector('#taskIdea').open);assert.equal(afterHint.d.querySelector('#stepAnswer').value,'3/');afterHint.w.close();
 for(const step of t.steps)submit(w,d,'stepAnswer',step.a);
 submit(w,d,'answer',-99);assert.match(d.querySelector('#repairStep').textContent,/разобранным шагам/,'no invented step after guided completion');
 const count=l.independent;submit(w,d,'answer',t.answer);assert.equal(l.independent,count);assert(d.querySelector('#repairStep').hidden);assert.equal(d.querySelector('#new').textContent,'Ещё задача этого типа');assert(d.querySelector('#new').classList.contains('primary'));
 const checkedSeed=l.seed;d.querySelector('#new').click();await tick();assert.notEqual(l.seed,checkedSeed);assert.notEqual(D.task('round',l.seed).q,t.q);assert.equal(l.taskFirst.mistakes,0);assert(!d.querySelector('#taskHelp').open);assert.equal(d.querySelector('#answer').value,'');
 submit(w,d,'answer',D.task('round',l.seed).answer);assert.equal(l.independent,count+1,'only fresh unassisted success adds evidence');
 // An unattempted condition must also be skipped when new numbers are requested.
 w.location.hash='lesson=graphs';await tick();l=state.lessons.graphs;t=D.task('graphs',l.seed);state.serial=l.seed+3;d.querySelector('#new').click();assert.notEqual(D.task('graphs',l.seed).q,t.q);
 // This actual family has one condition. Bounded search returns an honest repeat, with no false mastery.
 w.location.hash='lesson=logic';await tick();l=state.lessons.logic;t=D.task('logic',l.seed);const beforeSerial=state.serial;
 d.querySelector('#new').click();assert(state.serial-beforeSerial<=256);assert.equal(D.task('logic',l.seed).q,t.q);assert(l.taskFirst.repeatedVariant);assert.match(d.querySelector('#variantStatus').textContent,/знакомый вариант/);assert.equal(d.querySelector('#new').textContent,'Повторить задачу этого типа');
 submit(w,d,'answer',t.answer);assert.equal(l.independent,0,'repeated condition cannot earn independent credit');
 // Bounded searching cannot invalidate the store when the serial reaches its supported maximum.
 state.serial=1e9-2;d.querySelector('#new').click();assert(state.serial<=1e9);assert(w.PathCourse.valid(state));
 // Seed reuse preserves old evidence, while the latest helped check controls the next action.
 l.checks.push({seed:l.seed,correct:true,independent:true});l.independent=1;submit(w,d,'answer',D.task('logic',l.seed).answer);assert.equal(l.independent,1);assert(d.querySelector('#new').classList.contains('primary'));assert.equal(d.querySelector('#new').textContent,'Повторить задачу этого типа');
 // Optional fields remain compatible with old saves, and corrupt extras are rejected conservatively.
 const ui=JSON.parse(JSON.stringify(l.taskFirst));delete ui.mistakes;delete ui.ideaOpen;delete ui.repeatedVariant;assert(w.PathTaskFirst.valid(ui));
 for(const bad of [{mistakes:-1},{mistakes:1001},{mistakes:.5},{ideaOpen:'yes'},{repeatedVariant:1}])assert(!w.PathTaskFirst.valid({...ui,...bad}));
 // Shared boards receive their original schema and interface unless explicitly opted in.
 const host=d.createElement('div');d.body.append(host);const task=D.task('round',11),lesson={seed:11,stage:3,step:0,help:false,attempted:false,done:false,independent:0,guided:0,note:'',draft:'',checks:[]};
 w.PathTaskFirst.mount(host,{meta:D.meta.find(m=>m.id==='round'),task,lesson,save(){},seen:()=>false,expose(){},fresh(){},remediationId:()=>'',equationPracticeLinks:()=>'',fractionPracticeLink:()=>'',setHash(){}});
 assert(!host.querySelector('#repairStep'));assert(!host.querySelector('#taskIdea'));assert.equal(lesson.taskFirst.mistakes,undefined);assert.equal(lesson.taskFirst.ideaOpen,undefined);assert.equal(lesson.taskFirst.repeatedVariant,undefined);
 assert(w.PathCourse.valid(state));assert.deepEqual(errors,[]);w.close();
 console.log('EGE_BAZA_LEARNING_CYCLE_OK: 113 contextual repairs, optional persisted help ladder, two-error offer, retained drafts, fresh independent check, bounded honest repeats, no shared-board contract change');
})().catch(error=>{console.error(error);process.exitCode=1;});

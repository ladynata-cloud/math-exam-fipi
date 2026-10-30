'use strict';
// Fictional, isolated accounts and databases only. Never opens a deployed cabinet.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'../..'),C=require(path.join(root,'trainers/oge-basics/learning-contracts'));
const contracts=require(path.join(root,'board-server/learning-contracts'));
const {LearningStore}=require(path.join(root,'board-server/learning-store'));
const out=path.resolve(process.env.WEEKLY_EVIDENCE||'artifacts/weekly/fractions');fs.mkdirSync(out,{recursive:true});
const traps=[
 ['common denominator','2/5','5/6',{n:5,d:6}],
 ['subtraction','2/2','7/12',{n:7,d:12}],
 ['multiplication','5/7','1/2',{n:1,d:2}],
 ['division: invert the second fraction','8/15','5/6',{n:5,d:6}],
 ['negative sign','1/2','-1/2',{n:-1,d:2}],
 ['requested reduction','4/8','1/2',{n:1,d:2}],
 ['zero denominator','1/0','1/2',{n:1,d:2}]
];
for(const [name,wrong,right,answer]of traps){assert(!C.equal(wrong,answer,true),name+' wrong response');assert(C.equal(right,answer,true),name+' correct response');}
const report={sourceHead:require('node:child_process').execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),directedTraps:traps.map(([name,wrong,right])=>({name,wrong,right})),fixtures:[],failures:[],complete:false,realLearnerDataUsed:false};
const source=fs.readFileSync(path.join(root,'trainers/oge-basics/learning-managed.js'),'utf8');
const dependencies=[['DivisionLab','trainers/oge-basics/multiplication-division/division-lab-core.js'],['DivisionCourse','trainers/oge-basics/multiplication-division/division-course-core.js'],['MultiplicationColumn','trainers/oge-basics/multiplication-division/multiplication-column-core.js'],['ArithmeticCourse','learning/division-course-map.js'],['MathExamRemediation','trainers/oge-basics/learning-contracts.js'],['LearningScaffolds','trainers/oge-basics/learning-scaffolds.js']];
const clone=x=>JSON.parse(JSON.stringify(x)),gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
function answer(q){if(q.answer&&typeof q.answer==='object'&&Object.hasOwn(q.answer,'n')){let {n,d}=q.answer;const g=gcd(n,d);n/=g;d/=g;if(d<0){n=-n;d=-d;}return d===1?String(n):n+'/'+d;}return String(q.answer);}
try{
 const descriptors=C.list().filter(d=>['fraction-common-denominator','fraction-meaning'].includes(d.contentId));
 assert.equal(descriptors.length,2,'Both core fraction trainers must exist');
 const seeds=Array.from({length:24},(_,i)=>(Math.imul(i+1,2654435761)>>>0)%1000000000);
 for(const descriptor of descriptors)for(const seed of seeds){
  const generated=contracts.create('oge-basics',descriptor.contentId,seed),q=generated.taskSpec.task;
  if(q.kind==='choice')continue;
  assert(!generated.taskSpec.steps.length&&!generated.taskSpec.items.length,'Expected individual practice task');
  const plain=q.prompt.replace(/<[^>]+>/g,''),fractions=[...plain.matchAll(/(\d+)\/(\d+)/g)].map(m=>[Number(m[1]),Number(m[2])]);
  let expected,wrong;
  if(q.skill==='lcm'){const [[,a],[,b]]=fractions;expected=String(a/gcd(a,b)*b);wrong=String(a+b);if(wrong===expected)wrong=String(Math.max(a,b));}
  else if(q.skill==='add'){const [[a,b],[c,d]]=fractions;expected=answer({answer:{n:a*d+c*b,d:b*d}});wrong=(a+c)+'/'+(b+d);}
  else if(q.skill==='simplify'){const [[a,b]]=fractions;expected=answer({answer:{n:a,d:b}});wrong=a+'/'+b;}
  else if(q.skill==='expand'){const [[a,b]]=fractions,d=Number(plain.match(/к знаменателю (\d+)/)[1]);expected=String(a*d/b);wrong=String(a);}
  else if(q.skill==='equal'){const [[a,b]]=fractions,d=Number(plain.match(/\?\/(\d+)/)[1]);expected=String(a*d/b);wrong=String(a);}
  else throw Error('Unreviewed fraction skill '+q.skill);
  assert(C.checked(expected,q),'Independent rational oracle: '+plain);assert(!C.checked(wrong,q),'Plausible error must be wrong: '+plain);
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'weekly-fraction-fixture-')),filePath=path.join(directory,'fixture.sqlite');
  let store,dom,current,teacher,student;
  try{
   store=new LearningStore({filePath,contracts});const hash='scrypt1:'+'01'.repeat(16)+':'+'02'.repeat(32);
   teacher=store.activate(store.bootstrap({login:'synthetic_teacher',name:'Synthetic QA teacher'}).invitationToken,hash).account;
   student=store.activate(store.createStudent(teacher,{login:'synthetic_pupil',name:'Synthetic QA pupil'}).invitationToken,hash).account;
   current=store.newAttempt(student.id,teacher.id,'oge-basics',generated);
   function mount(){
    dom=new JSDOM('<main id="learning-remediation-root"></main>',{url:'https://synthetic.example.test/?learning=1',runScripts:'outside-only'});
    const w=dom.window;w.MathExamRemediationManaged=true;for(const [name,file]of dependencies)w[name]=require(path.join(root,file));let bridge;
    w.MathExamLearning={register(adapter){bridge=adapter;}};w.eval(source);
    bridge.subscribe(event=>{event=clone(event);if(event.kind==='new-task')return;const type=event.kind==='check'?'check':event.kind==='hint'?'hint':'state';const payload=type==='check'?{state:event.state,details:event.details}:type==='hint'?{state:event.state,step:event.details.step}:{state:event.state};current=store.action(student,current.id,{opId:crypto.randomUUID(),expectedVersion:current.version,expectedTrainerVersion:current.trainerVersion,type,payload}).attempt;});
    bridge.applyState({taskSpec:clone(current.taskSpec),state:clone(current.state),readOnly:false});
   }
   function input(value){const field=dom.window.document.querySelector('#lm-answer');assert(field);field.value=value;field.dispatchEvent(new dom.window.Event('input',{bubbles:true}));}
   mount();const initial=clone(current.state);
   for(let mistake=0;mistake<2;mistake++){input(wrong);dom.window.document.querySelector('#lm-check').click();assert.equal(current.state.step,initial.step);assert.deepEqual(current.state.answers,initial.answers);assert.equal(current.state.completed,false);assert.equal(current.state.feedback.kind,'incorrect');}
   for(let help=0;help<2;help++){const hint=dom.window.document.querySelector('#lm-hint');assert(hint);hint.click();}input('1/');
   const before=clone(current);assert(before.assistance.hints>0,'Help must be recorded');
   dom.window.close();store.close();store=new LearningStore({filePath,contracts});current=store.getAttempt(student,before.id);
   assert.deepEqual(current.taskSpec,before.taskSpec);assert.deepEqual(current.state,before.state);assert.deepEqual(current.assistance,before.assistance);mount();
   assert.equal(dom.window.document.querySelector('#lm-answer').value,'1/','Draft restored from reopened database');
   input(expected);dom.window.document.querySelector('#lm-check').click();assert.equal(current.state.completed,true);assert(current.assistance.hints>0,'Assisted result stays assisted');
   const finished=clone(current);dom.window.close();dom=null;store.close();store=new LearningStore({filePath,contracts});current=store.getAttempt(student,finished.id);assert.deepEqual(current.state,finished.state);assert.deepEqual(current.assistance,finished.assistance);
   report.fixtures.push({contentId:descriptor.contentId,seed,skill:q.skill,prompt:plain,plausibleWrongAnswer:wrong,independentlyCalculatedAnswer:expected,wrongAnswerRejected:true,draftAndHintRestoredAfterDatabaseReopen:true,completionPersisted:true,helpCount:current.assistance.hints});
  }finally{if(dom)dom.window.close();if(store)store.close();fs.rmSync(directory,{recursive:true,force:true});}
 }
 assert(report.fixtures.length>=10,'At least ten generated fraction fixtures must actually run');
 const covered=new Set(report.fixtures.map(f=>f.skill));for(const skill of ['lcm','expand','add','equal','simplify'])assert(covered.has(skill),'Missing actual fixture for '+skill);report.complete=true;
 console.log('WEEKLY_FRACTIONS_OK: '+report.directedTraps.length+' directed errors; '+report.fixtures.length+' isolated cabinet/DOM/database restoration flows.');
}catch(error){report.failures.push(error.stack);console.error(error);process.exitCode=1;}finally{fs.writeFileSync(path.join(out,'fraction-robots.json'),JSON.stringify(report,null,2));}

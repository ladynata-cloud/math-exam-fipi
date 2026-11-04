'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const policy = require('./learning-arithmetic-robots-policy.cjs');
const { verifySpec } = require('./learning-arithmetic-robots-oracle.cjs');
const fixtures = require('./fixtures/arithmetic-robot-profiles.json');
const clone = value => JSON.parse(JSON.stringify(value));
const defaultRoot = path.resolve(__dirname, '..');
const scenarios = fixtures.profiles.flatMap(profile => profile.cases.map(([slug, seed]) => ({ id:profile.id+'/'+slug+'/'+seed, profile, contentId:'multiplication-division/'+slug, seed })));
const passwordHash = 'scrypt1:'+'01'.repeat(16)+':'+'02'.repeat(32);

function makeSession(root, scenario) {
  const contracts=require(path.join(root,'board-server/learning-contracts'));
  const {LearningStore}=require(path.join(root,'board-server/learning-store'));
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'arithmetic-robot-'));
  let nextSeed=scenario.seed;
  const controlled={...contracts,create(trainer,id,seed){return contracts.create(trainer,id,seed===undefined?++nextSeed:seed);}};
  const store=new LearningStore({filePath:path.join(directory,'fixture.sqlite'),contracts:controlled});
  const teacher=store.activate(store.bootstrap({login:'synthetic_teacher',name:'Synthetic fixture teacher'}).invitationToken,passwordHash).account;
  const student=store.activate(store.createStudent(teacher,{login:'synthetic_pupil',name:'Synthetic arithmetic robot'}).invitationToken,passwordHash).account;
  let generated=contracts.create('oge-basics',scenario.contentId,scenario.seed);
  if(scenario.generatorVersion===1){generated=require(path.join(root,'trainers/oge-basics/learning-contracts')).create(scenario.contentId,scenario.seed,{generatorVersion:1});generated.taskSpec.trainerId='oge-basics';generated.taskSpec.id=scenario.contentId;}
  let current=store.newAttempt(student.id,teacher.id,'oge-basics',generated);
  const events=[];
  return {
    get spec(){return current.taskSpec;},get state(){return current.state;},events,
    accept(event){
      events.push(clone(event));if(event.kind==='new-task')return;
      const type=event.kind==='check'?'check':event.kind==='hint'?'hint':'state';
      const payload=type==='check'?{state:event.state,details:event.details}:type==='hint'?{state:event.state,step:event.details.step}:{state:event.state};
      current=store.action(student,current.id,{opId:crypto.randomUUID(),expectedVersion:current.version,expectedTrainerVersion:current.trainerVersion,type,payload}).attempt;
    },
    envelope:()=>clone({taskSpec:current.taskSpec,state:current.state}),
    assistance:()=>current.assistance.hints,
    attempt:()=>clone(current),
    next(){current=store.createAttempt(student,{opId:crypto.randomUUID(),trainerId:'oge-basics',contentId:scenario.contentId,fresh:true,sourceAttemptId:current.id}).attempt;return clone({taskSpec:current.taskSpec,state:current.state});},
    preserved(old){return store.listAttempts(student).some(a=>{if(a.id===current.id)return false;const full=store.getAttempt(student,a.id);return JSON.stringify({taskSpec:full.taskSpec,state:full.state})===JSON.stringify(old);});},
    close(){store.close();fs.rmSync(directory,{recursive:true,force:true});}
  };
}

function jsdomAdapter(root,scenario){
  const {JSDOM}=require('jsdom'),session=makeSession(root,scenario);
  const dependencies=[['DivisionLab','trainers/oge-basics/multiplication-division/division-lab-core.js'],['DivisionCourse','trainers/oge-basics/multiplication-division/division-course-core.js'],['MultiplicationColumn','trainers/oge-basics/multiplication-division/multiplication-column-core.js'],['ArithmeticCourse','learning/division-course-map.js'],['MathExamRemediation','trainers/oge-basics/learning-contracts.js'],['LearningScaffolds','trainers/oge-basics/learning-scaffolds.js']];
  const source=fs.readFileSync(path.join(root,'trainers/oge-basics/learning-managed.js'),'utf8');
  let mounted;
  function mount(envelope,readOnly=false){
    const dom=new JSDOM('<main id="learning-remediation-root"></main>',{url:'https://synthetic.example.test/?learning=1',runScripts:'outside-only'}),window=dom.window,events=[];let bridge;
    window.MathExamRemediationManaged=true;
    for(const [name,file]of dependencies)window[name]=require(path.join(root,file));
    window.MathExamLearning={register(adapter){bridge=adapter;}};window.eval(source);
    bridge.subscribe(event=>{events.push(clone(event));if(!readOnly)session.accept(clone(event));});
    bridge.applyState({...clone(envelope),readOnly});
    return {dom,window,bridge,events};
  }
  mounted=mount(session.envelope());
  const adapter={
    snapshot:()=>policy.snapshotDOM(mounted.window.document),
    type(value){const input=mounted.window.document.querySelector('#lm-answer');assert(input,'The visible answer field exists');input.value=String(value);input.dispatchEvent(new mounted.window.Event('input',{bubbles:true}));},
    check(){mounted.window.document.querySelector('#lm-check').click();},
    help(kind){mounted.window.document.querySelector(kind==='solution'?'#lm-solution':'#lm-hint').click();},
    envelope:()=>session.envelope(),assistance:()=>session.assistance(),
    restore(envelope){mounted.dom.window.close();mounted=mount(envelope);},
    mirror(envelope){const other=mount(envelope,true),snapshot=policy.snapshotDOM(other.window.document);for(const control of other.window.document.querySelectorAll('button,input'))assert(control.disabled);const result={snapshot,events:other.events.length};other.dom.window.close();return result;},
    next(){const old=session.envelope(),count=session.events.filter(e=>e.kind==='new-task').length,button=mounted.window.document.querySelector('#lm-new');button.click();button.click();const requestCount=session.events.filter(e=>e.kind==='new-task').length-count;const fresh=session.next();mounted.bridge.applyState({...clone(fresh),readOnly:false});return {previousPreserved:session.preserved(old),requestCount,fresh};},
    close(){mounted.dom.window.close();session.close();}
  };
  return adapter;
}

function sameProgress(before,after,message){assert.equal(after.state.step,before.state.step,message);assert.deepEqual(after.state.answers,before.state.answers,message);}
async function runCase(adapter,scenario){
  const initial=await adapter.envelope(),oracle=verifySpec(initial.taskSpec);
  assert(oracle.ok,JSON.stringify(oracle.errors));
  const record={id:scenario.id,profile:scenario.profile.id,difficulty:scenario.profile.difficulty,contentId:scenario.contentId,seed:scenario.seed,generatorVersion:initial.taskSpec.generatorVersion||1,condition:initial.taskSpec.task.prompt,oracle:{verifiedSteps:oracle.tested,totalSteps:oracle.totalSteps},actions:0,explicitSolutions:0,methods:{},target:null,completed:false,nextPractice:false};
  let targeted=false;
  for(let limit=0;limit<200;limit++){
    let view=await adapter.snapshot();if(view.completed){record.completed=true;break;}
    let proposed=policy.solve(clone(view)),wrong=!targeted?policy.mistake(scenario.profile,clone(view)):null;
    if(wrong){
      targeted=true;const before=await adapter.envelope(),board=view.boardHTML;
      await adapter.type(wrong.value);await adapter.check();const wrongState=await adapter.envelope(),failed=await adapter.snapshot();
      sameProgress(before,wrongState,'A plausible wrong answer cannot advance');assert.match(failed.feedbackKind,/incorrect/);assert.equal(failed.boardHTML,board,'Wrong answers retain the written board');
      const generic=/Посмотри на выделенные цифры\. Если трудно|Пока не получилось\. Посмотри на это действие|Проверь это действие ещё раз\. Если трудно/.test(failed.feedback);
      const targetedFeedback=!generic&&new RegExp(scenario.profile.feedbackPattern,'i').test(failed.feedback);
      await adapter.help('hint');const hinted=await adapter.snapshot(),hintedState=await adapter.envelope();
      sameProgress(before,hintedState,'Hint cannot advance');assert.equal(hinted.input,wrong.value,'Hint cannot autofill or erase the draft');assert.equal(hinted.boardHTML,board,'Hint retains the written rows and empty answer cells');
      const firstHintGivesAnswer=policy.hintRevealsAnswer(hinted,proposed);
      assert(await adapter.assistance(),'The server records requested help');
      await adapter.restore(hintedState);const restored=await adapter.snapshot();assert.deepEqual(await adapter.envelope(),hintedState,'Reload preserves the exact task and raw draft');assert.equal(restored.boardHTML,hinted.boardHTML);assert.equal(restored.feedback,hinted.feedback);assert.equal(restored.input,wrong.value);
      const mirror=await adapter.mirror(hintedState);assert.equal(mirror.events,0,'Read-only observer sends no mutation');assert(mirror.snapshot.disabled);assert.equal(mirror.snapshot.boardHTML,restored.boardHTML);assert.equal(mirror.snapshot.input,wrong.value);
      const target={step:before.state.step,prompt:view.prompt,wrong:wrong.value,feedback:failed.feedback,targetedFeedback,hint:hinted.feedback,firstHintGivesAnswer,wrongDidNotAdvance:true,hintDidNotAdvance:true,hintDidNotAutofill:true,boardRetained:true,helpRecorded:true,rawDraftRestored:true,readOnlyMirror:true,recovery:null};
      record.target=target;
      // The synthetic strategy follows a targeted cue; if it still cannot
      // interpret that cue, it deliberately asks for the worked solution.
      proposed=targetedFeedback&&!firstHintGivesAnswer?policy.solve(clone(restored)):null;
      if(!proposed||scenario.profile.strategy==='help-and-return'){
        await adapter.help('solution');record.explicitSolutions++;
        const worked=await adapter.snapshot();sameProgress(hintedState,await adapter.envelope(),'Explicit worked solution cannot advance');assert.equal(worked.input,wrong.value);assert.equal(worked.boardHTML,board);
        proposed=policy.fromWorkedHelp(clone(worked));assert(proposed,'Explicit worked help must expose an interpretable action');target.workedSolutionExplicit=true;
      }
      target.recovery=proposed.method;view=await adapter.snapshot();
    }
    if(!proposed){
      await adapter.help('solution');record.explicitSolutions++;
      proposed=policy.fromWorkedHelp(clone(await adapter.snapshot()));
      assert(proposed,'The robot is blocked: no visible arithmetic strategy or explicit worked answer');
    }
    const before=await adapter.envelope();await adapter.type(proposed.value);await adapter.check();let after=await adapter.envelope();
    if(after.state.step===before.state.step){
      // Report an imperfect DOM strategy honestly, then use an explicitly
      // requested explanation. Never fall back to a hidden canonical answer.
      record.methods['visible strategy needed worked help']=(record.methods['visible strategy needed worked help']||0)+1;
      await adapter.help('solution');record.explicitSolutions++;const retry=policy.fromWorkedHelp(clone(await adapter.snapshot()));assert(retry);
      await adapter.type(retry.value);await adapter.check();after=await adapter.envelope();
    }
    assert.equal(after.state.step,before.state.step+1,'Visible strategy or explicit worked help continues one action');record.actions++;
    record.methods[proposed.method]=(record.methods[proposed.method]||0)+1;
  }
  assert(record.completed,'The robot completes the displayed exercise within a bounded number of actions');
  assert(targeted,'The selected condition must actually encounter the stated difficulty');
  const done=await adapter.envelope();assert(done.state.completed);assert(await adapter.assistance());
  await adapter.restore(done);assert((await adapter.snapshot()).completed,'A finished solution remains visible after return');
  const next=await adapter.next();assert.equal(next.requestCount,1,'Two rapid clicks create one next request');assert(next.previousPreserved,'The previous completed attempt remains unchanged');assert.equal(next.fresh.taskSpec.contentId,scenario.contentId);assert.equal(next.fresh.state.step,0);assert.equal(next.fresh.state.completed,false);assert((await adapter.snapshot()).input==='');
  record.nextPractice=true;record.previousAttemptPreserved=true;record.issues=[];
  if(!record.target.targetedFeedback)record.issues.push('generic-feedback');
  if(record.target.firstHintGivesAnswer)record.issues.push('first-hint-gives-answer');
  return record;
}

async function runSuite(createAdapter,{root=defaultRoot,output,mode='after',runtime='jsdom',selected=scenarios}={}){
  const report={schema:'mathexam-synthetic-arithmetic-results-v1',synthetic:true,humanLearningEvidence:false,claim:fixtures.claim,mode,runtime,source:{},profiles:fixtures.profiles.length,cases:[],summary:{}};
  try{report.source.commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();}catch(_){report.source.commit='unavailable';}
  for(const file of ['trainers/oge-basics/learning-managed.js','trainers/oge-basics/learning-scaffolds.js','trainers/oge-basics/multiplication-division/multiplication-column-core.js','trainers/oge-basics/multiplication-division/division-course-core.js','trainers/oge-basics/multiplication-division/quotient-estimate-core.js'])report.source[file]=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex');
  for(const scenario of selected){let adapter;try{adapter=await createAdapter(scenario);report.cases.push(await runCase(adapter,scenario));}catch(error){report.cases.push({id:scenario.id,profile:scenario.profile.id,contentId:scenario.contentId,seed:scenario.seed,error:error.message,issues:['scenario-blocked']});}finally{try{await adapter?.close();}catch(error){const last=report.cases.at(-1);last.error=(last.error?last.error+'; ':'')+'Adapter close: '+error.message;last.issues.push('adapter-close-failed');}}}
  report.summary={scenarios:report.cases.length,completed:report.cases.filter(c=>c.completed).length,targetedFeedback:report.cases.filter(c=>c.target?.targetedFeedback).length,firstHintWithoutAnswer:report.cases.filter(c=>c.target&&!c.target.firstHintGivesAnswer).length,resumeAndMirror:report.cases.filter(c=>c.target?.rawDraftRestored&&c.target?.readOnlyMirror).length,nextPractice:report.cases.filter(c=>c.nextPractice).length,verifiedArithmeticSteps:report.cases.reduce((n,c)=>n+(c.oracle?.verifiedSteps||0),0),explicitSolutions:report.cases.reduce((n,c)=>n+(c.explicitSolutions||0),0),issues:report.cases.reduce((n,c)=>n+c.issues.length,0)};
  if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');}
  console.log(JSON.stringify({result:'LEARNING_ARITHMETIC_ROBOTS_'+(report.summary.issues?'OBSERVED':'PASS'),runtime,mode,...report.summary}));
  if(mode!=='baseline'&&report.summary.issues)throw Error('Synthetic arithmetic scenarios have unresolved findings: '+report.cases.filter(c=>c.issues.length).map(c=>c.id+' '+(c.error||c.issues.join(','))).join('; '));
  return report;
}
module.exports={runSuite,runCase,makeSession,jsdomAdapter,snapshotDOM:policy.snapshotDOM,scenarios};
if(require.main===module){
  const arg=name=>process.argv.find(value=>value.startsWith('--'+name+'='))?.split('=').slice(1).join('='),root=path.resolve(arg('root')||defaultRoot),mode=arg('mode')||'after',output=path.resolve(arg('output')||path.join(defaultRoot,'docs/reports/arithmetic-robots-'+mode+'.json')),generatorVersion=arg('generator-version')?Number(arg('generator-version')):undefined;
  const selected=scenarios.map(scenario=>({...scenario,...(generatorVersion?{generatorVersion}:{})}));
  runSuite(scenario=>jsdomAdapter(root,scenario),{root,mode,output,selected}).catch(error=>{console.error(error.message);process.exitCode=1;});
}

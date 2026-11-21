'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const Journey=require('../ege-profil/start/journey.js'),State=require('../ege-profil/start/state.js');
const lessons=['geometry','stereo','algebra','probability','equations','functions','applied','finance','readiness'].flatMap(name=>require('../ege-profil/start/'+name+'-data.js'));
const {exams}=require('../ege-profil/start/calm-data.js'),byId=new Map(lessons.map(lesson=>[lesson.id,lesson]));
function fixture(){const values=new Map();let writes=0;const storage={getItem:key=>values.get(key)||null,setItem(key,value){writes++;values.set(key,value);}};return {state:State.create(lessons,storage),writes:()=>writes};}
function credit(state,id,kind='independent',count=2){const lesson=byId.get(id);state.data.records[id]={guided:[],independent:[],attempts:count,[kind]:lesson.tasks.slice(-3).slice(0,count).map(task=>task.id)};}
function session(state,id,mode,options={}){const lesson=byId.get(id);state.data.sessions[id+':'+mode]={taskId:lesson.tasks[mode==='independent'?lesson.tasks.length-3:0].id,step:0,draft:'',answers:[],done:false,started:'2026-11-09T01:00:00.000Z',...options};}
function choose(state,exam){return Journey.choose({lessons,state,exams,...(exam===undefined?{}:{exam})});}

test('fresh learner starts the declared entry, and catalogue reads never create progress or expose tasks',()=>{
 const {state,writes}=fixture(),before=JSON.stringify(state.data);
 assert.equal(choose(state).lessonId,'geo-right');
 for(const exam of exams)assert.equal(choose(state,exam).lessonId,exam.entry);
 assert.equal(Journey.summarize(lessons,state).unstarted,81);
 assert.equal(JSON.stringify(state.data),before);assert.equal(writes(),0);
});

test('a completed entry advances to another unmastered topic instead of repeating its fixed link',()=>{
 const {state}=fixture(),exam=exams[0];credit(state,exam.entry);session(state,exam.entry,'independent',{done:true});
 const next=choose(state,exam);assert.equal(next.lessonId,'geo-angles');assert.equal(next.kind,'next');assert.notEqual(next.lessonId,exam.entry);
});

test('guided draft in a non-entry topic resumes its exact mode and task without a fresh attempt',()=>{
 const {state}=fixture();session(state,'geo-similarity','guided',{step:1,draft:'12',answers:['3']});
 const before=JSON.stringify(state.data),next=choose(state,1);
 assert.equal(next.href,'#practice/geo-similarity/guided');assert.equal(next.fresh,false);assert.equal(next.kind,'resume');
 assert.equal(JSON.stringify(state.data),before);
});

test('actual saved work wins over a later untouched opening and all modes can resume',()=>{
 for(const mode of ['guided','plan','independent']){
  const {state}=fixture();session(state,'fn-parabola',mode,{draft:'4'});session(state,'geo-right','independent',{started:'2026-11-09T02:00:00.000Z'});
  assert.equal(choose(state).href,'#practice/fn-parabola/'+mode);
 }
});

test('latest worked session wins; a scoped line never resumes a different line',()=>{
 const {state}=fixture();session(state,'geo-right','guided',{draft:'7'});session(state,'eq-rational','plan',{draft:'5',started:'2026-11-09T03:00:00.000Z'});
 assert.equal(choose(state).lessonId,'eq-rational');assert.equal(choose(state,1).lessonId,'geo-right');
});

test('untouched sessions in a mastered topic do not trap the next recommendation',()=>{
 const {state}=fixture();credit(state,'geo-right');session(state,'geo-right','guided');
 assert.equal(choose(state,1).lessonId,'geo-angles');
 session(state,'geo-right','guided',{draft:'6'});assert.equal(choose(state,1).lessonId,'geo-right','an intentional repeat with work can still resume');
});

test('guided activity, seen tasks and one clean solution are not mastery',()=>{
 const {state}=fixture(),lesson=byId.get('geo-right');
 state.data.records[lesson.id]={guided:lesson.tasks.slice(0,3).map(task=>task.id),independent:[lesson.tasks.at(-1).id],attempts:20};
 lesson.tasks.forEach(task=>state.data.seen[task.id]=10);
 const summary=Journey.lessonSummary(lesson,state);assert.equal(summary.mastered,false);assert.equal(summary.canAdvance,false);assert.equal(summary.independent,1);
 assert.equal(choose(state,1).lessonId,'geo-right');
});

test('clean repeats allow the existing continuation rule but stay separate from new independent work',()=>{
 const {state}=fixture(),lesson=byId.get('geo-right');credit(state,lesson.id,'recovered');
 const summary=Journey.lessonSummary(lesson,state);assert.equal(summary.canAdvance,true);assert.equal(summary.mastered,false);assert.equal(summary.independent,0);
 assert.equal(summary.status,'Закреплено на знакомых задачах');assert.equal(choose(state,1).lessonId,'geo-angles');
 const overall=Journey.summarize(lessons,state);assert.equal(overall.recovered,1);assert.equal(overall.mastered,0);
});

test('finished work keeps global continuation in that line and starts a new condition when needed',()=>{
 const {state}=fixture();session(state,'fn-line','independent',{done:true});credit(state,'fn-line', 'independent',1);
 const next=choose(state);assert.equal(next.lessonId,'fn-line');assert.equal(next.fresh,true);
 credit(state,'fn-line');assert.equal(choose(state).lessonId,'fn-parabola');
});

test('finishing the current line advances to the next line, while all completed lines offer mixed practice',()=>{
 const {state}=fixture();for(const id of exams[0].lessonIds)credit(state,id);session(state,'geo-circle','independent',{done:true});
 assert.equal(choose(state).lessonId,'vec-coordinates');assert.equal(choose(state,1).href,'#checkpoint');
 for(const exam of exams)for(const id of exam.lessonIds)credit(state,id);
 assert.equal(choose(state).kind,'checkpoint');assert.equal(choose(state).lessonId,null);
});

test('no unobserved prerequisite gap is invented; an explicitly started foundation can resume',()=>{
 const {state}=fixture();assert.equal(choose(state,3).lessonId,'stereo-box');
 session(state,'bridge-roots','guided',{draft:'2'});assert.equal(choose(state).lessonId,'bridge-roots');assert.equal(choose(state,3).lessonId,'stereo-box');
});

test('foreign task IDs, duplicate successes and invalid sessions cannot inflate a summary or enter links',()=>{
 const {state}=fixture(),lesson=byId.get('geo-right'),id=lesson.tasks.at(-1).id;
 state.data.records[lesson.id]={guided:['foreign'],independent:[id,id,'foreign'],recovered:['foreign'],attempts:0};
 session(state,lesson.id,'guided',{taskId:'foreign',draft:'9'});
 assert.equal(Journey.lessonSummary(lesson,state).independent,1);assert.equal(Journey.lessonSummary(lesson,state).mastered,false);
 assert.equal(choose(state,1).kind,'next');assert.equal(choose(state,999).href,'#calm');
});

test('browser and CommonJS API match, with no storage or DOM dependencies',()=>{
 const context={};vm.runInNewContext(fs.readFileSync(require.resolve('../ege-profil/start/journey.js'),'utf8'),context);
 assert.deepEqual(Object.keys(context.ProfileJourney),Object.keys(Journey));
 assert.equal(context.ProfileJourney.choose().href,'#calm');
 const {state}=fixture(),before=JSON.stringify(state.data);state.record=()=>{throw Error('read-only helper used mutating record');};state.canAdvance=()=>{throw Error('read-only helper used mutating canAdvance');};state.persist=()=>{throw Error('helper wrote progress');};
 Journey.summarize(lessons,state);choose(state);assert.equal(JSON.stringify(state.data),before);
});

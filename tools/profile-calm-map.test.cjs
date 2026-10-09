'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const sources=['geometry','algebra','stereo','probability','equations','functions','applied','readiness'];
const lessons=sources.flatMap(name=>require('../ege-profil/start/'+name+'-data.js'));
const byId=new Map(lessons.map(l=>[l.id,l]));
const map=require('../ege-profil/start/calm-data.js');
const ids=values=>values.slice().sort();

test('map covers every current numeric position and every topic exactly once',()=>{
  assert.equal(lessons.length,68,'current course inventory; update consciously when banks change');
  assert.equal(byId.size,lessons.length,'lesson IDs must be unique');
  assert.deepEqual(map.exams.map(e=>e.number),Array.from({length:13},(_,i)=>i+1));
  const mapped=map.exams.flatMap(e=>e.lessonIds);
  const actual=lessons.filter(l=>Number.isInteger(l.position)&&l.position>=1&&l.position<=13).map(l=>l.id);
  assert.equal(new Set(mapped).size,mapped.length,'no duplicate topic placement');
  assert.deepEqual(ids(mapped),ids(actual),'no missing or invented exam topics');
});

for(const exam of map.exams)test('calm route for exam '+exam.number,()=>{
  assert.deepEqual(ids(exam.lessonIds),ids(lessons.filter(l=>l.position===exam.number).map(l=>l.id)));
  assert.ok(exam.lessonIds.includes(exam.entry),'entry is an actual type of this exam number');
  assert.ok(exam.title.length>5 && exam.goal.length>35);
  assert.equal(exam.plan.length,3);
  for(const action of exam.plan){
    assert.ok(typeof action==='string'&&action.length>15&&action.length<140,'one short actionable prompt');
    assert.doesNotMatch(action,/\d/,'plans must not contain worked-example numbers');
  }
  assert.ok(exam.prerequisites.length>0&&exam.prerequisites.length<=4);
  assert.equal(new Set(exam.prerequisites).size,exam.prerequisites.length);
  for(const id of exam.prerequisites)assert.ok(byId.has(id),'known prerequisite '+id);
  assert.deepEqual(exam.milestones.map(m=>m.id),['supported','guided','independent','mixed']);
  assert.notEqual(exam.milestones,map.milestones,'stage objects are not shared mutable UI state');
  assert.match(exam.milestones[2].description,/два разных новых условия.*первой попытки.*без подсказок/i,'preserve mastery criterion');
  assert.doesNotMatch(JSON.stringify(exam),/\b\d+\s*(?:минут|час)|таймер|диагноз/i,'no time promise or diagnosis');
});

test('non-numeric trigonometry foundations connect to exam eight without masquerading as exam tasks',()=>{
  const trig=map.trigFoundations;
  assert.equal(trig.exam,8);
  assert.equal(trig.entry,'bridge-triangle');
  assert.deepEqual(ids(trig.lessonIds),ids(lessons.filter(l=>l.group==='trigonometry').map(l=>l.id)));
  for(const id of [...trig.lessonIds,...trig.prerequisites])assert.ok(byId.has(id));
  for(const id of trig.lessonIds)assert.equal(typeof byId.get(id).position,'string');
  for(const id of trig.nextLessonIds)assert.equal(byId.get(id).position,8);
  assert.equal(new Set(trig.lessonIds).size,trig.lessonIds.length);
});

test('both browser and Node exports are data-only and preserve task banks',()=>{
  const context={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../ege-profil/start/calm-data.js'),'utf8'),context);
  assert.ok(context.ProfileCalmData);
  assert.equal(JSON.stringify(context.ProfileCalmData),JSON.stringify(map));
  assert.equal(context.ProfileLessons,undefined,'presentation map must not mutate banks');
  assert.equal(JSON.stringify(map).includes('"answer"'),false,'no answer keys in presentation map');
});

'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const contracts=require('../learning-contracts');
const remediation=require('../../trainers/oge-basics/learning-contracts');
const division=require('../../trainers/oge-basics/multiplication-division/division-lab-core');
const source=fs.readFileSync(path.resolve(__dirname,'../../trainers/oge-basics/learning-managed.js'),'utf8');
function adapter(){
 let registered;const host={innerHTML:'',contains:()=>false};
 const context={window:{MathExamRemediationManaged:true,MathExamRemediation:remediation,DivisionLab:division,MathExamLearning:{register:value=>{registered=value;}}},document:{getElementById:id=>id==='learning-remediation-root'?host:null,activeElement:null}};
 vm.runInNewContext(source,context,{filename:'learning-managed.js',timeout:1000});
 return {registered,host};
}
test('managed remediation adapter restores exact persisted server envelopes for every catalog family',()=>{
 const {registered,host}=adapter();const items=contracts.list().filter(i=>i.trainerId==='oge-basics');assert(items.length>=36);
 for(const item of items){const task=contracts.create('oge-basics',item.contentId,17);assert.doesNotThrow(()=>registered.applyState({...task,readOnly:true}),item.contentId);assert(host.innerHTML.includes('Наблюдение'),item.contentId);assert.deepEqual(JSON.parse(JSON.stringify(registered.getState())),contracts.normalize('oge-basics',task.taskSpec,task.state));}
});
test('managed remediation envelope comparison rejects tampered metadata and authored content',()=>{
 const {registered}=adapter(),task=contracts.create('oge-basics','negative-add-subtract',17);
 for(const mutate of [spec=>{spec.trainerId='ege-path';},spec=>{spec.id='fraction-meaning';},spec=>{spec.title+=' changed';},spec=>{spec.extra='untrusted';},spec=>{spec.task.answer=999;}]){const changed=structuredClone(task);mutate(changed.taskSpec);assert.throws(()=>registered.applyState({...changed,readOnly:true}),/Условие отличается/);}
});

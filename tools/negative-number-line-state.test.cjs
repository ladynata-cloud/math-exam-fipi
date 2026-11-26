'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../trainers/negative-numbers-line.html'),'utf8');
function part(start,end){const a=source.indexOf(start),b=source.indexOf(end,a+start.length);assert(a>=0&&b>a,start);return source.slice(a,b)}
function fixture(){
  const task={a:-3,b:5,op:'+',res:2,label:'-3 + 5'};
  const fields={instr:{className:'instr ',textContent:'Шаг 1'},feedback:{className:'feedback ',textContent:''},ans:{value:'',disabled:true},check:{disabled:true},hintBox:{textContent:'',classList:{contains:()=>false,toggle(){}}}};
  const c=vm.createContext({SEED:'fixture',mode:'add',level:'easy',task,phase:'start',hintCount:0,taskNo:1,visual:{start:null,end:null,traveler:null,arc:null,wrong:null},GROUP_LESSON_MODE:false,el:id=>fields[id],renderExpr(){},clsClear(){},setSeg(){},mark(){},traveler(){},arc(){},points:{},setTimeout(){},clearTimeout(){}});
  vm.runInContext([part('let hintTimer=', 'const KEY='),part('function copyTask(', 'function setSeg('),part('function getBoardTrainerState(', 'function sendBoardTrainerState('),part('function applyBoardTrainerState(', 'window.getBoardTrainerState='),part('function instr(', 'function newTask(')].join('\n'),c);
  return {fields,c,read:()=>JSON.parse(JSON.stringify(c.getBoardTrainerState()))};
}
test('initial class bytes are canonical and survive actual adapter roundtrip',()=>{
  const a=fixture(),b=fixture(),first=a.read();
  assert.equal(first.instructionClass,'instr');assert.equal(first.feedbackClass,'feedback');
  b.c.applyBoardTrainerState(first);assert.deepEqual(b.read(),first);
});
test('all meaningful phase and feedback classes are retained without trailing whitespace',()=>{
  const f=fixture();
  for(const kind of ['','good','err','step']){
    f.c.instr('test',kind);assert.equal(f.fields.instr.className,kind?'instr '+kind:'instr');
    assert.equal(f.read().instructionClass,f.fields.instr.className);
  }
  for(const kind of ['','ok','fail','info']){
    f.c.feedback('test',kind);assert.equal(f.fields.feedback.className,kind?'feedback '+kind:'feedback');
    assert.equal(f.read().feedbackClass,f.fields.feedback.className);
  }
});
test('old snapshots with extra class spaces still apply and normalize losslessly',()=>{
  const a=fixture(),b=fixture();const old={...a.read(),instructionClass:'instr  step ',feedbackClass:'feedback  info '};
  b.c.applyBoardTrainerState(old);
  assert.deepEqual(b.read(),{...old,instructionClass:'instr step',feedbackClass:'feedback info'});
});

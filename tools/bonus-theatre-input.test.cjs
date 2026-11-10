'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'trainers/teatr-formul-daily.html'),'utf8');
const script=source.match(/<script>\s*([\s\S]*?)<\/script>/)[1].split('/* ---------------- старт ---------------- */')[0];
function open(){
 const nodes=new Map(),storage=new Map();
 function node(id){if(!nodes.has(id))nodes.set(id,{id,value:'',disabled:false,innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){},toggle(){}},querySelector(){return null;},setAttribute(){},focus(){},scrollIntoView(){}});return nodes.get(id);}
 const context={document:{getElementById:node},console,URLSearchParams,URL,location:{search:'',href:'https://mathexam.space/trainers/teatr-formul-daily.html'},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setTimeout(){},clearTimeout(){}};
 vm.createContext(context);vm.runInContext(script,context);
 context.assignment.date='2026-11-10';
 context.t.prob={sum:true,base:20,k:1,N:21,a2:400,mid:40,b2:1,res:441};
 context.focusActive=()=>{};
 return {w:context,node};
}
test('whole numeric input is required; invalid format is not a mathematical attempt',()=>{
 for(const value of ['', '   ', '400.9','400,9','400abc','400e0','400+1','Infinity','9007199254740993']){
  const {w,node}=open();node('ans-1').value=value;w.checkStep(1);
  assert.equal(node('ans-1').disabled,false,value);assert.equal(w.t.step,1,value);
  assert.equal(w.getDailyState().mistakes,0,value);assert.equal(Object.keys(w.t.tries).length,0,value);
  assert.match(node('hint-1').textContent,/введите ответ|Введите целое число/);
 }
});
test('valid full integers including plus and spacing advance; a wrong integer counts as a real mistake',()=>{
 for(const value of ['400','+400',' 400 ','4 00']){
  const {w,node}=open();node('ans-1').value=value;w.checkStep(1);
  assert.equal(node('ans-1').disabled,true,value);assert.equal(w.t.step,2,value);
 }
 const {w,node}=open();node('ans-1').value='401';w.checkStep(1);
 assert.equal(w.getDailyState().mistakes,1);assert.equal(w.t.tries[1],1);assert.equal(w.t.step,1);
});
test('coefficient step validates every field before recording any attempt',()=>{
 for(const values of [['','9'],['6',''],['6x','9'],['6','9.1']]){
  const {w,node}=open();w.s.prob={};w.s.step=1;w.S_INPUTS[1]=['c1','c2'];w.sExpected=()=>[6,9];
  node('c1').value=values[0];node('c2').value=values[1];w.sCheck(1);
  assert.equal(w.getDailyState().mistakes,0);assert.equal(w.s.step,1);
  assert.equal(node('c1').disabled,false);assert.match(node('shint-1').textContent,/Заполните|Введите целые/);
 }
});
test('negative coefficients and exact zero remain accepted',()=>{
 const {w}=open();assert.equal(w.parseCoef('−12'),-12);assert.equal(w.parseCoef('+0'),0);
 assert(Number.isNaN(w.parseCoef('−12.4')));assert(Number.isNaN(w.parseCoef('12tail')));
});
test('all generated arithmetic square steps agree with direct multiplication',()=>{
 const {w}=open();
 for(const sum of [true,false])for(const base of w.BASES)for(const k of w.KS){
  const N=sum?base+k:base-k,p={sum,base,k,N,a2:base*base,mid:2*base*k,b2:k*k,res:N*N};
  const answers=w.stepConf(p).map(s=>s.ans);
  assert.equal(answers[0]+(sum?1:-1)*answers[1]+answers[2],N*N);
  assert.equal(answers[3],N*N);
 }
});

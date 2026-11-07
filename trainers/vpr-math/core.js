(function(root){
'use strict';
const LIMIT=160;
function number(text){
 if(typeof text!=='string'&&typeof text!=='number')return null;
 let s=String(text).trim().replace(/[−–]/g,'-').replace(/\u00a0/g,' ');
 if(!s||s.length>LIMIT)return null;
 s=s.replace(/,/g,'.');
 if(/^[-+]?\d+\s+\d+\s*\/\s*\d+$/.test(s)){
  const m=s.match(/^([-+]?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/), den=Number(m[4]);
  if(!den||Number(m[3])>=den)return null;
  const value=(Number(m[2])+Number(m[3])/den)*(m[1]==='-'?-1:1);
  return Number.isFinite(value)?(value===0?0:value):null;
 }
 const dec='[-+]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)';
 if(new RegExp('^'+dec+'$').test(s)){const n=Number(s);return Number.isFinite(n)?(n===0?0:n):null;}
 const f=s.match(new RegExp('^('+dec+')\\s*[/⁄]\\s*('+dec+')$'));
 if(f){const den=Number(f[2]);if(!den)return null;const n=Number(f[1])/den;return Number.isFinite(n)?(n===0?0:n):null;}
 return null;
}
function near(a,b){return Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=Math.max(1e-9,Number.EPSILON*8*Math.max(Math.abs(a),Math.abs(b)));}
function judge(answer,value){
 if(!answer||typeof answer!=='object')return {valid:false,correct:false,message:'Не удалось прочитать задание.'};
 if(answer.kind==='choice'){
  if(!Number.isInteger(value)||value<0)return {valid:false,correct:false,message:'Выбери один вариант ответа.'};
  return {valid:true,correct:value===answer.value};
 }
 if(answer.kind==='number'){
  const v=number(value);return v===null?{valid:false,correct:false,message:'Введи число: например, 2,5, 3/4 или −1 1/2. Единицы уже указаны в вопросе.'}:{valid:true,correct:near(v,answer.value)};
 }
 if(answer.kind==='set'||answer.kind==='tuple'){
  if(typeof value!=='string'||value.length>LIMIT)return {valid:false,correct:false,message:'Запиши все числа через точку с запятой.'};
  const raw=value.trim().replace(/^\{(.*)\}$/,'$1').split(';').map(x=>x.trim());
  const values=raw.map(number);
  if(values.some(v=>v===null))return {valid:false,correct:false,message:'Запиши числа через точку с запятой: −2; 3. Запятая внутри числа обозначает дробную часть.'};
  if(answer.kind==='tuple')return {valid:true,correct:values.length===answer.values.length&&values.every((v,i)=>near(v,answer.values[i]))};
  const unique=values.filter((v,i)=>values.findIndex(w=>near(v,w))===i).sort((a,b)=>a-b);
  const target=[...answer.values].sort((a,b)=>a-b);
  return {valid:true,correct:unique.length===target.length&&unique.every((v,i)=>near(v,target[i]))};
 }
 return {valid:false,correct:false,message:'Неизвестный вид ответа.'};
}
function blank(task,mode){return {taskId:task.id,mode,answers:Array(task.steps.length).fill(''),solved:Array(task.steps.length).fill(false),mistakes:Array(task.steps.length).fill(0),hints:Array(task.steps.length).fill(false),shown:Array(task.steps.length).fill(false),notes:'',updated:0};}
function validate(x,task,mode){
 if(!x||x.taskId!==task.id||x.mode!==mode||typeof x.notes!=='string'||x.notes.length>10000)return false;
 const n=task.steps.length;
 for(const key of ['answers','solved','mistakes','hints','shown'])if(!Array.isArray(x[key])||x[key].length!==n)return false;
 if(x.answers.some(v=>!((typeof v==='string'&&v.length<=LIMIT)||(Number.isInteger(v)&&v>=0&&v<=30))))return false;
 for(const key of ['solved','hints','shown'])if(x[key].some(v=>typeof v!=='boolean'))return false;
 if(x.mistakes.some(v=>!Number.isInteger(v)||v<0||v>1e6))return false;
 if(mode==='learn'||task.assessAllSteps){
  let gap=false;
  for(let i=0;i<n;i++){if(!x.solved[i])gap=true;else if(gap)return false;}
 }
 if(mode==='solo'&&((!task.assessAllSteps&&x.solved.slice(0,-1).some(Boolean))||x.hints.some(Boolean)||x.shown.some(Boolean)))return false;
 for(let i=0;i<n;i++)if(x.solved[i]&&!x.shown[i]&&!judge(task.steps[i].answer,x.answers[i]).correct)return false;
 return Number.isFinite(x.updated)&&x.updated>=0;
}
function stage(state,task){return state.mode==='solo'&&!task.assessAllSteps?task.steps.length-1:state.solved.findIndex(v=>!v);}
function done(state,task){return state.mode==='solo'&&!task.assessAllSteps?state.solved.at(-1):state.solved.every(Boolean);}
function format(answer,options){
 if(answer.display)return answer.display;
 if(answer.kind==='choice')return options[answer.value];
 if(answer.kind==='set'||answer.kind==='tuple')return answer.values.map(v=>String(v).replace('.',',')).join('; ');
 return String(Number(answer.value.toPrecision(12))).replace('.',',');
}
root.VPRCore={number,judge,near,blank,validate,stage,done,format};
if(typeof module!=='undefined')module.exports=root.VPRCore;
})(typeof window!=='undefined'?window:globalThis);

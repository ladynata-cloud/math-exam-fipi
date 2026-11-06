(function(root,factory){'use strict';const api=factory(typeof module==='object'&&module.exports?require('../college-functions/engine.js'):root.CollegeFunctionsEngine,typeof module==='object'&&module.exports?require('./data.js'):root.LogCourseData);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.LogCourseCore=api;})(typeof window!=='undefined'?window:null,function(E,D){
'use strict';
const bases=[.25,1/3,.5,2,3,4];
const keys=['taskId','mode','stage','drafts','hint','errors','helped','feedback','note','lab','theory','reference'];
const clone=v=>JSON.parse(JSON.stringify(v));
const task=id=>D.tasks.find(t=>t.id===id);
function point(v){if(typeof v!=='string')return null;const p=v.replace(/[()]/g,'').split(';').map(E.parseNumber);return p.length===2&&p.every(n=>n!==null)?p:null;}
function correct(step,input){
 if(typeof input!=='string')return false;
 if(step.kind==='number'){const n=E.parseNumber(input);return n!==null&&E.near(n,E.parseNumber(step.answer));}
 if(step.kind==='set')return E.sameSet(input,step.answer);
 if(step.kind==='choice')return input===step.answer;
 const p=point(input);return !!p&&p.every((n,i)=>E.near(n,step.answer[i]));
}
function blank(id=D.tasks[0].id,mode='learn'){const t=task(id);return {taskId:id,mode,stage:0,drafts:t.steps.map(()=>''),hint:0,errors:0,helped:false,feedback:'none',note:'',lab:{open:false,a:2,h:0,k:0},theory:false,reference:false};}
function record(v,fields){if(!v||typeof v!=='object'||Array.isArray(v))return false;const p=Object.getPrototypeOf(v);return (p===Object.prototype||p===null)&&Reflect.ownKeys(v).length===fields.length&&fields.every(k=>{const d=Object.getOwnPropertyDescriptor(v,k);return !!d&&Object.hasOwn(d,'value')&&d.enumerable;});}
const int=(n,a,b)=>Number.isInteger(n)&&n>=a&&n<=b;
const text=(s,n)=>typeof s==='string'&&s.length<=n&&!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(s);
function validate(value){try{
 if(!record(value,keys))return false;
 const s=value,t=task(s.taskId);if(!t||!['learn','test'].includes(s.mode)||!int(s.stage,0,t.steps.length))return false;
 if(!Array.isArray(s.drafts)||s.drafts.length!==t.steps.length||Reflect.ownKeys(s.drafts).length!==s.drafts.length+1||!s.drafts.every(v=>text(v,200)))return false;
 if(!s.drafts.every((v,i)=>i>=s.stage||correct(t.steps[i],v)))return false;
 if(!int(s.hint,0,3)||!int(s.errors,0,100000)||typeof s.helped!=='boolean'||(s.hint>0&&!s.helped))return false;
 if(!['none','correct','wrong'].includes(s.feedback)||(s.feedback==='wrong'&&(s.errors===0||s.stage===t.steps.length)))return false;
 if(!text(s.note,1500)||typeof s.theory!=='boolean'||typeof s.reference!=='boolean'||!record(s.lab,['open','a','h','k']))return false;
 if(typeof s.lab.open!=='boolean'||!bases.includes(s.lab.a)||!int(s.lab.h,-3,3)||!int(s.lab.k,-3,3))return false;
 if(s.mode==='test'&&(s.hint!==0||s.theory||s.lab.open))return false;
 if(s.stage===t.steps.length&&s.hint!==0)return false;
 return true;
}catch(_){return false;}}
function graphY(x,p){return x>p.h?Math.log(x-p.h)/Math.log(p.a)+p.k:null;}
return Object.freeze({E,D,bases,clone,task,point,correct,blank,validate,graphY});
});

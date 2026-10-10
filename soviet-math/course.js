/* Stable topic IDs and additive curriculum: existing links remain valid. */
(function(root){
'use strict';
const P=typeof module!=='undefined'&&module.exports?require('./primary.js'):root.SovietPrimary;
const A=typeof module!=='undefined'&&module.exports?require('./advanced.js'):root.SovietAdvanced;
const topics=[...P.topics,...A.topics];
const stages=[{id:'start',title:'Счёт начинается с понимания',note:'Число, десяток и первые задачи'},{id:'written',title:'От групп к письменным действиям',note:'Умножение, деление и вычисления по разрядам'},{id:'division',title:'Деление уголком',note:'Весь уголок остаётся перед глазами'},{id:'fractions',title:'Обыкновенные дроби',note:'Равные части и действия с ними'},{id:'applications',title:'Десятичные дроби и проценты',note:'От вычислений к практическим задачам'}];
const ids=new Set(topics.map(t=>t.id));
if(ids.size!==topics.length)throw Error('Повторяющийся адрес темы');
const make=(id,index=0)=>{if(!ids.has(id)||!Number.isInteger(index)||index<0||index>100000)throw Error('Неизвестное задание');return P.topics.some(t=>t.id===id)?P.make(id,index):A.make(id,index);};
function number(s){if(typeof s!=='string'&&typeof s!=='number')return NaN;const v=String(s).trim().replace(/\s/g,'').replace('−','-').replace(',','.');if(!/^-?\d+(?:\.\d+)?(?:\/-?\d+(?:\.\d+)?)?$/.test(v))return NaN;const a=v.split('/').map(Number);return a.length===1?a[0]:a[1]!==0?a[0]/a[1]:NaN;}
function reducedFraction(value,answer){
 const parse=s=>{const m=String(s).trim().replace(/−/g,'-').match(/^([+-]?\d+)(?:\s*\/\s*([+-]?\d+))?$/);if(!m)return null;const n=BigInt(m[1]),d=BigInt(m[2]||'1');return d===0n?null:[n,d];};
 const a=parse(value),b=parse(answer);if(!a||!b)return false;
 let n=a[0]<0n?-a[0]:a[0],d=a[1]<0n?-a[1]:a[1];while(d){const r=n%d;n=d;d=r;}
 return n===1n&&a[0]*b[1]===b[0]*a[1];
}
function check(value,step){if(!String(value).trim())return false;if(step.raw)return root.DivisionGuided?root.DivisionGuided.check(value,step.raw):require('../trainers/oge-basics/multiplication-division/division-guided-core.js').check(value,step.raw);if(step.checkKind==='reduced-fraction')return reducedFraction(value,step.answer);const a=number(value),b=number(step.answer);if(Number.isFinite(a)&&Number.isFinite(b))return Math.abs(a-b)<1e-9;return String(value).trim().toLowerCase()===String(step.answer).trim().toLowerCase();}
const api={topics,stages,make,check,number,version:1};root.SovietMath=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);

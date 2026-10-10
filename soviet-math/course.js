/* Stable topic IDs and additive curriculum: existing links remain valid. */
(function(root){
'use strict';
const P=typeof module!=='undefined'&&module.exports?require('./primary.js'):root.SovietPrimary;
const A=typeof module!=='undefined'&&module.exports?require('./advanced.js'):root.SovietAdvanced;
const EP=typeof module!=='undefined'&&module.exports?require('./extension-primary.js'):root.SovietExtensionPrimary;
const EF=typeof module!=='undefined'&&module.exports?require('./extension-fractions.js'):root.SovietExtensionFractions;
const EA=typeof module!=='undefined'&&module.exports?require('./extension-applications.js'):root.SovietExtensionApplications;
const modules=[P,A,EP,EF,EA];
const RP=typeof module!=='undefined'&&module.exports?require('./revised-primary.js'):root.SovietRevisedPrimary;
const RA=typeof module!=='undefined'&&module.exports?require('./revised-advanced.js'):root.SovietRevisedAdvanced;
const RD=typeof module!=='undefined'&&module.exports?require('./revised-division.js'):root.SovietRevisedDivision;
const revisedModules=[RP,RA,RD];
const revisedTopics=revisedModules.flatMap(part=>part.topics);
const topics=modules.flatMap(part=>part.topics).map(topic=>revisedTopics.find(t=>t.id===topic.id)||topic);
const stages=[{id:'start',title:'Счёт начинается с понимания',note:'Число, десяток и первые задачи'},{id:'written',title:'От групп к письменным действиям',note:'Умножение, деление и вычисления по разрядам'},{id:'division',title:'Деление уголком',note:'Весь уголок остаётся перед глазами'},{id:'fractions',title:'Обыкновенные дроби',note:'Равные части и действия с ними'},{id:'applications',title:'Десятичные дроби и проценты',note:'От вычислений к практическим задачам'}];
const ids=new Set(topics.map(t=>t.id));
stages.push({id:'more-numbers',title:'Продолжаем устный счёт',note:'Ноль, разряды, круглые числа и неизвестное слагаемое'},
 {id:'more-fractions',title:'Дальше об обыкновенных дробях',note:'Сравнение, смешанные числа и задачи на часть'},
 {id:'more-applications',title:'Десятичные дроби и величины',note:'Действия, единицы измерения и движение'});
if(ids.size!==topics.length)throw Error('Повторяющийся адрес темы');
const legacyMake=(id,index=0)=>{if(!ids.has(id)||!Number.isInteger(index)||index<0||index>100000)throw Error('Неизвестное задание');return modules.find(part=>part.topics.some(t=>t.id===id)).make(id,index);};
const make=(id,index=0)=>{if(!ids.has(id)||!Number.isInteger(index)||index<0||index>100000)throw Error('Неизвестное задание');const part=revisedModules.find(part=>part.topics.some(t=>t.id===id));return {...(part?part.make(id,index):legacyMake(id,index)),index,revision:2};};
function number(s){if(typeof s!=='string'&&typeof s!=='number')return NaN;const mixed=String(s).trim().match(/^(-?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);if(mixed){const w=Number(mixed[2]),n=Number(mixed[3]),d=Number(mixed[4]);return d>0&&n<d?(mixed[1]?-1:1)*(w+n/d):NaN;}if(/\d\s+\S+\s*\//.test(String(s).trim()))return NaN;const v=String(s).trim().replace(/\s/g,'').replace('−','-').replace(',','.');if(!/^-?\d+(?:\.\d+)?(?:\/-?\d+(?:\.\d+)?)?$/.test(v))return NaN;const a=v.split('/').map(Number);return a.length===1?a[0]:a[1]!==0?a[0]/a[1]:NaN;}
function reducedFraction(value,answer){
 const parse=s=>{const m=String(s).trim().replace(/−/g,'-').match(/^([+-]?\d+)(?:\s*\/\s*([+-]?\d+))?$/);if(!m)return null;const n=BigInt(m[1]),d=BigInt(m[2]||'1');return d===0n?null:[n,d];};
 const a=parse(value),b=parse(answer);if(!a||!b)return false;
 let n=a[0]<0n?-a[0]:a[0],d=a[1]<0n?-a[1]:a[1];while(d){const r=n%d;n=d;d=r;}
 return n===1n&&a[0]*b[1]===b[0]*a[1];
}
function mixedParts(value){
 const m=String(value).trim().match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
 if(!m)return null;
 const [whole,n,d]=m.slice(1).map(BigInt);
 if(whole<1n||n<1n||d<=n)return null;
 let a=n,b=d;while(b){const r=a%b;a=b;b=r;}
 return a===1n?[whole*d+n,d]:null;
}
function specificFraction(value,step){
 const m=String(value).trim().match(/^(\d+)\s*\/\s*(\d+)$/);
 const expected=String(step.answer).match(/^(\d+)\/(\d+)$/);
 if(!m||!expected)return false;
 const n=BigInt(m[1]),d=BigInt(m[2]);
 return d>0n&&d===BigInt(step.denominator)&&n*BigInt(expected[2])===BigInt(expected[1])*d;
}
function check(value,step){if(!String(value).trim())return false;if(step.raw)return root.DivisionGuided?root.DivisionGuided.check(value,step.raw):require('../trainers/oge-basics/multiplication-division/division-guided-core.js').check(value,step.raw);if(step.checkKind==='mixed-number'){const a=mixedParts(value),b=mixedParts(step.answer);return !!(a&&b&&a[0]*b[1]===b[0]*a[1]);}if(step.checkKind==='fraction-denominator')return specificFraction(value,step);if(step.checkKind==='reduced-fraction')return reducedFraction(value,step.answer);const a=number(value),b=number(step.answer);if(Number.isFinite(a)&&Number.isFinite(b))return Math.abs(a-b)<1e-9;return String(value).trim().toLowerCase()===String(step.answer).trim().toLowerCase();}
const api={topics,stages,make,legacyMake,check,number,version:1,revision:2};root.SovietMath=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);

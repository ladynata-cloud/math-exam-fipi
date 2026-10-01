(function(root){'use strict';
// Exact rational arithmetic for the balance model. Fractions stay in memory;
// course progress contains only ordinary JSON values.
const abs=n=>n<0n?-n:n;
function fraction(n,d=1n){if(d===0n)throw Error('Делить на ноль нельзя.');if(d<0n){n=-n;d=-d;}let a=abs(n),b=d;while(b){const r=a%b;a=b;b=r;}return {n:n/a,d:d/a};}
function from(value){
 if(value&&typeof value.n==='bigint'&&typeof value.d==='bigint')return fraction(value.n,value.d);
 const s=String(value).trim().replace(',','.').replace('−','-');
 const m=s.match(/^([+-]?)(\d+)(?:\.(\d{1,12}))?$/);
 if(!m)throw Error('Введи целое число или десятичную дробь: не более 12 знаков после запятой.');
 return fraction((m[1]==='-'?-1n:1n)*BigInt(m[2]+(m[3]||'')),10n**BigInt((m[3]||'').length));
}
const add=(a,b)=>fraction(a.n*b.d+b.n*a.d,a.d*b.d),mul=(a,b)=>fraction(a.n*b.n,a.d*b.d),neg=a=>({n:-a.n,d:a.d});
function fromBalance(values){return Object.fromEntries(Object.entries(values).map(([key,value])=>{
 // All generated coefficients are integers or fractions with a small integer
 // denominator. Recover that exact coefficient before any model operation.
 for(let d=1;d<=1000;d++)if(Math.abs(value*d-Math.round(value*d))<1e-10)return [key,fraction(BigInt(Math.round(value*d)),BigInt(d))];
 throw Error('Коэффициент модели не представлен точной дробью.');
}));}
function transform(balance,operation,value){
 const n=from(value);if(typeof value!=='object'&&abs(n.n)>1000n*n.d)throw Error('Для одного шага выбери число по модулю не больше 1000.');
 if(operation==='divide'&&n.n===0n)throw Error('Делить на ноль нельзя.');
 if(operation==='multiply'&&n.n===0n)throw Error('Умножение на ноль теряет сведения о корнях. Для равносильного шага выбери ненулевое число.');
 if(!['constant','variable','multiply','divide'].includes(operation))throw Error('Неизвестное действие.');
 const result={...balance};
 if(operation==='constant')for(const key of ['lB','rB'])result[key]=add(result[key],n);
 if(operation==='variable')for(const key of ['lA','rA'])result[key]=add(result[key],n);
 if(operation==='multiply'||operation==='divide'){const k=operation==='multiply'?n:fraction(n.d,n.n);for(const key of Object.keys(result))result[key]=mul(result[key],k);}
 if(Object.values(result).some(v=>String(abs(v.n)).length>60||String(v.d).length>60))throw Error('Запись стала слишком длинной. Отмени шаги или выбери более простое действие.');
 return result;
}
const fmt=v=>v.d===1n?String(v.n):String(v.n)+'/'+String(v.d);
function term(a,b){return (a.d===1n?fmt(a)+'x':'('+fmt(a)+')·x')+(b.n<0n?' − ':' + ')+fmt(b.n<0n?neg(b):b);}
const api={fraction,from,fromBalance,add,mul,neg,transform,fmt,term};root.EquationAlgebra=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

(function(root){
'use strict';
// A bounded expression parser, never eval / Function. A null rational flag means
// that this small checker cannot certify the expression's arithmetic nature.
function number(source){
 function fraction(n,d){if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||!d)return null;let a=Math.abs(n),b=Math.abs(d);while(b){const t=a%b;a=b;b=t;}return {n:n/a*(d<0?-1:1),d:Math.abs(d)/a};}
 function calc(a,b,op){if(!a||!b)return null;return op==='+'?fraction(a.n*b.d+b.n*a.d,a.d*b.d):op==='-'?fraction(a.n*b.d-b.n*a.d,a.d*b.d):op==='*'?fraction(a.n*b.n,a.d*b.d):fraction(a.n*b.d,a.d*b.n);}
 const s=String(source).replace(/−/g,'-').replace(/,/g,'.').replace(/\s/g,'').replace(/π/g,'pi').replace(/√/g,'sqrt');
 if(!s||s.length>160)throw Error('Введите число.');
 const periodic=s.match(/^([+-]?)(\d*)\.(\d*)\((\d{1,12})\)$/);
 if(periodic){const [,sign,a,b,c]=periodic,p=10**b.length,q=10**c.length-1;return {value:(sign==='-'?-1:1)*(Number(a||0)+Number(b||0)/p+Number(c)/(p*q)),rational:true,fraction:fraction((sign==='-'?-1:1)*((Number(a||0)*p+Number(b||0))*q+Number(c)),p*q)};}
 let i=0,operations=0;
 function make(value,rational,frac){if(!Number.isFinite(value)||Math.abs(value)>1e100)throw Error('Число вне диапазона проверки.');return {value,rational,fraction:frac||null};}
 function atom(){if(++operations>100)throw Error('Слишком длинное выражение.');if(s[i]==='+'){i++;return power();}if(s[i]==='-'){i++;const a=power();return make(-a.value,a.rational,a.fraction?fraction(-a.fraction.n,a.fraction.d):null);}if(s.slice(i,i+4)==='sqrt'){i+=4;let a;if(s[i]==='('){i++;a=sum();if(s[i++]!==')')throw Error('Закройте скобку.');}else a=atom();if(a.value<0)throw Error('Отрицательное число под корнем.');const v=Math.sqrt(a.value);const q=a.fraction,yes=q&&Number.isInteger(Math.sqrt(q.n))&&Number.isInteger(Math.sqrt(q.d));return make(v,yes?true:q?false:null,yes?fraction(Math.sqrt(q.n),Math.sqrt(q.d)):null);}if(s.slice(i,i+2)==='pi'){i+=2;return make(Math.PI,false);}if(s[i]==='('){i++;const a=sum();if(s[i++]!==')')throw Error('Закройте скобку.');return a;}const m=s.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d{1,3})?/);if(!m)throw Error('Поддерживаются числа, дроби, + − * /, sqrt(…), π и степень ^.');i+=m[0].length;const [mantissa,exp='0']=m[0].toLowerCase().split('e'),digits=Math.max(0,(mantissa.split('.')[1]||'').length-Number(exp));return make(Number(m[0]),true,fraction(Math.round(Number(m[0])*10**digits),10**digits));}
 function power(){let a=atom();if(s[i]==='^'){i++;const b=atom();if(!Number.isInteger(b.value)||Math.abs(b.value)>100)throw Error('Нужен целый показатель от −100 до 100.');const q=a.fraction,k=b.value;a=make(a.value**k,a.rational===true?true:k===0?true:null,q?(k>=0?fraction(q.n**k,q.d**k):fraction(q.d**(-k),q.n**(-k))):null);}return a;}
 function product(){let a=power();while(s[i]==='*'||s[i]==='/'){const op=s[i++],b=power();if(op==='/'&&b.value===0)throw Error('На нуль делить нельзя.');const r=a.rational===true&&b.rational===true?true:(op==='*'&&(a.value===0||b.value===0))||a.value===0?true:a.rational!==b.rational&&a.rational!==null&&b.rational!==null?false:null;a=make(op==='*'?a.value*b.value:a.value/b.value,r,calc(a.fraction,b.fraction,op));}return a;}
 function sum(){let a=product();while(s[i]==='+'||s[i]==='-'){const op=s[i++],b=product();const r=a.rational===true&&b.rational===true?true:a.rational!==b.rational&&a.rational!==null&&b.rational!==null?false:null;a=make(op==='+'?a.value+b.value:a.value-b.value,r,calc(a.fraction,b.fraction,op));}return a;}
 const a=sum();if(i!==s.length)throw Error('Не удалось прочитать конец выражения.');return a;
}
 const close=(a,b,t=1e-10)=>Math.abs(a-b)<=t*Math.max(1e-10,Math.abs(b));
function values(s){return String(s).split(';').map(x=>number(x.trim()));}
function check(step,raw){try{
 const r=step.rule;let ok=false;
 if(r.type==='number')ok=close(number(raw).value,r.value,r.tolerance||1e-9);
 else if(r.type==='period')ok=/\([^()]+\)/.test(raw)&&close(number(raw).value,r.value,1e-12);
 else if(r.type==='choice'||r.type==='order'){const a=Array.isArray(raw)?raw:[];ok=a.length===r.answer.length&&(r.type==='order'?[r.answer,...(r.alternatives||[])].some(order=>a.every((x,i)=>x===order[i])):a.every(x=>r.answer.includes(x))&&new Set(a).size===a.length);}
 else if(r.type==='list'){const v=values(raw).map(x=>x.value),w=r.values.slice();ok=v.length===w.length;for(const n of v){const i=w.findIndex(x=>close(n,x));if(i<0){ok=false;break;}w.splice(i,1);}}
 else if(r.type==='witness'){
  const v=values(raw);if(v.length!==r.count)return {ok:false,message:'Нужно чисел: '+r.count+'. Разделяйте их точкой с запятой.'};
  if(v.some((a,i)=>v.slice(0,i).some(b=>close(a.value,b.value,1e-13))))return {ok:false,message:'Выберите разные числа.'};
  let uncertain=false;ok=v.every(a=>{if(a.rational===null||(['square','nonsquare'].includes(r.nature)&&!a.fraction)){uncertain=true;return false;}const n=r.nature==='integer'?Number.isInteger(a.value):r.nature==='natural'?Number.isInteger(a.value)&&a.value>0:r.nature==='rational-noninteger'?a.rational===true&&!Number.isInteger(a.value):r.nature==='integer-not-natural'?Number.isInteger(a.value)&&a.value<=0:r.nature==='rational-not-natural'?a.rational===true&&!(Number.isInteger(a.value)&&a.value>0):r.nature==='square'?a.value>=0&&a.fraction&&Number.isInteger(Math.sqrt(a.fraction.n))&&Number.isInteger(Math.sqrt(a.fraction.d)):r.nature==='nonsquare'?a.value>0&&a.fraction&&!(Number.isInteger(Math.sqrt(a.fraction.n))&&Number.isInteger(Math.sqrt(a.fraction.d))):r.nature==='irrational'?a.rational===false:a.rational===true;return n&&(r.min===undefined||a.value>r.min)&&(r.max===undefined||a.value<r.max);});
  if(uncertain)return {ok:false,unsupported:true,message:'Эту форму записи проверка пока не умеет обосновывать. Это не означает ошибку. Для корня используйте sqrt(целое число), при необходимости разделите его на целое число; либо обсудите запись с учителем.'};
 }
 else if(r.type==='point')ok=Math.abs(number(raw).value-r.value)<=(r.tolerance||0.02);
 else if(r.type==='angle'){if(!raw||!Number.isFinite(raw.angle)||raw.angle<=r.min||raw.angle>=r.max)return {ok:false,message:'Постройте именно острый угол: больше 0° и меньше 90°.'};ok=Math.abs(number(raw.reading).value-raw.angle)<=.5;}
 else if(r.type==='interval')ok=raw&&raw.low===r.low&&raw.high===r.high&&raw.left===r.left&&raw.right===r.right;
 else throw Error('Неизвестный формат проверки.');
 return {ok,message:ok?step.explain:(step.error||'Проверьте условие. Подсказка поможет выбрать следующий ход.')};
}catch(e){return {ok:false,message:e.message};}}
const api={number,check,close};root.M9Checks=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);

(function(root){'use strict';
// Every intermediate operation is checked in the real domain.
function fail(reason,message){const error=new Error(message);error.reason=reason;throw error;}
function number(value){
 const s=String(value).toLowerCase().replace(/\s/g,'').replace(/,/g,'.').replace(/[−–]/g,'-').replace(/π/g,'pi').replace(/√/g,'sqrt');
 if(!s)throw Error('Впиши число или выражение.');if(s.length>120)throw Error('Слишком длинная запись.');
 const tokens=s.match(/sqrt|pi|\d+(?:\.\d+)?|[()+\-*/^]/g)||[];if(tokens.join('')!==s)throw Error('Используй числа, дроби, sqrt(...) или pi.');let at=0,depth=0;
 const checked=n=>{if(!Number.isFinite(n)||Math.abs(n)>1e12)fail('domain','Промежуточное значение не является допустимым конечным числом.');return n;};
 function atom(){if(++depth>20)throw Error('Слишком сложная запись.');const t=tokens[at++];let n;
  if(t==='pi')n=Math.PI;
  else if(t==='sqrt'){if(tokens[at++]!=='(')fail(tokens[at-1]===undefined?'incomplete':'syntax','После sqrt нужны скобки.');const x=sum();if(tokens[at++]!==')')fail(tokens[at-1]===undefined?'incomplete':'syntax','Закрой скобку.');if(x<0)fail('domain','Квадратный корень отрицательного числа не определён в действительных числах.');n=Math.sqrt(x);}
  else if(t==='('){n=sum();if(tokens[at++]!==')')fail(tokens[at-1]===undefined?'incomplete':'syntax','Закрой скобку.');}
  else if(t&&/^\d/.test(t))n=Number(t);else fail(t===undefined?'incomplete':'syntax','Запись не закончена. Проверь числа и скобки.');depth--;return checked(n);
 }
 function power(){let n=atom();if(tokens[at]==='^'){at++;const p=unary();if(Math.abs(p)>12)throw Error('Слишком большой показатель степени.');if(n===0&&p<=0)fail('domain','Нулевая или отрицательная степень нуля не определена.');if(n<0&&!Number.isInteger(p))fail('domain','Для отрицательного основания здесь запиши целый показатель.');n=checked(Math.pow(n,p));}return n;}
 function unary(){if(tokens[at]==='+'||tokens[at]==='-'){const op=tokens[at++];return checked((op==='-'?-1:1)*unary());}return power();}
 function term(){let n=unary();while(tokens[at]==='*'||tokens[at]==='/'){const op=tokens[at++],b=unary();if(op==='/'&&b===0)fail('domain','Деление на ноль не определено.');n=checked(op==='*'?n*b:n/b);}return n;}
 function sum(){let n=term();while(tokens[at]==='+'||tokens[at]==='-'){const op=tokens[at++],b=term();n=checked(op==='+'?n+b:n-b);}return n;}
 const result=sum();if(at!==tokens.length)throw Error('Проверь запись выражения.');return checked(result);
}
function inspect(value,answer){const s=String(value).trim();if(!s)return {kind:'empty',message:'Впиши ответ на вопрос над полем.'};
 if(Array.isArray(answer)){const parts=s.split(';');if(parts.length!==answer.length)return {kind:'invalid',reason:parts.length<answer.length?'incomplete':'syntax',message:'Запиши '+answer.length+' координаты или числа через точку с запятой.'};const checks=parts.map((p,i)=>inspect(p,answer[i])),bad=checks.find(x=>x.kind==='invalid'||x.kind==='empty');return bad?.kind==='empty'?{kind:'invalid',reason:'incomplete',message:'Заполни каждую координату или число.'}:bad||{kind:checks.every(x=>x.kind==='correct')?'correct':'wrong'};}
 if(typeof answer==='string'){const normalize=x=>String(x).trim().toLowerCase().replace(/[′']/g,'').replace(/\s+/g,' ');return {kind:normalize(s)===normalize(answer)?'correct':'wrong'};}
 try{const n=number(s);return {kind:Math.abs(n-answer)<=(Number.isInteger(answer)?1e-8:.00051)?'correct':'wrong'};}catch(error){return {kind:'invalid',reason:error.reason||'syntax',message:error.message};}
}
const equal=(value,answer)=>inspect(value,answer).kind==='correct';
function format(a){return Array.isArray(a)?a.map(format).join('; '):typeof a==='number'?(Number.isInteger(a)?String(a):String(Number(a.toFixed(6)))):a;}
const api={number,equal,inspect,format};root.Answer=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

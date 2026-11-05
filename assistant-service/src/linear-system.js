import { R, add, sub, mul, div, decimal, eq, text } from './math-kernel.js';
const zero=()=>[R(0),R(0),R(0)],isConstant=p=>!p[1].n&&!p[2].n;
export function linearTwo(value){
  const q=value.trim().replaceAll('х','x').replaceAll('у','y').replace(/[−–—]/g,'-');if(q.length>200||/\d\s+\d/.test(q)||/\d\s*\/\s*\d\s*[xy]/.test(q))throw Error('LINEAR_FORMAT');
  const ts=q.match(/\d+(?:[.,]\d+)?|[xy()+*/\-=]/g)||[];if(ts.join('')!==q.replace(/\s/g,'')||ts.length>100)throw Error('LINEAR_FORMAT');let at=0,depth=0;
  function atom(){const t=ts[at++];if(t==='('){if(++depth>10)throw Error('DEPTH');const v=sum();if(ts[at++]!==')')throw Error('PARENTHESIS');depth--;return v;}if(['x','y'].includes(t)){const v=zero();v[t==='x'?1:2]=R(1);return v;}if(/^\d/.test(t||''))return [decimal(t),R(0),R(0)];throw Error('ATOM');}
  function unary(){if(['+','-'].includes(ts[at])){const sign=ts[at++],v=unary();return sign==='-'?v.map(c=>R(-c.n,c.d)):v;}return atom();}
  function product(){let v=unary();while(['*','/','x','y','('].includes(ts[at])){const op=ts[at],implicit=!['*','/'].includes(op);if(!implicit)at++;const b=unary();if(op==='/'&&!implicit){if(!isConstant(b))throw Error('VARIABLE_DENOMINATOR');v=v.map(c=>div(c,b[0]));}else{if(!isConstant(v)&&!isConstant(b))throw Error('NONLINEAR');v=isConstant(b)?v.map(c=>mul(c,b[0])):b.map(c=>mul(c,v[0]));}}return v;}
  function sum(){let v=product();while(['+','-'].includes(ts[at])){const op=ts[at++],b=product();v=v.map((c,i)=>op==='+'?add(c,b[i]):sub(c,b[i]));}return v;}
  const left=sum();if(ts[at++]!=='=')throw Error('EQUATION');const right=sum();if(at!==ts.length)throw Error('TRAILING');return left.map((c,i)=>sub(c,right[i]));
}
export function systemSolution(question){const qs=question.split(';');if(qs.length!==2)throw Error('SYSTEM_FORMAT');const rows=qs.map(linearTwo),[[c,a,b],[f,d,e]]=rows,det=sub(mul(a,e),mul(b,d));
  if(det.n){const x=div(sub(mul(b,f),mul(c,e)),det),y=div(sub(mul(c,d),mul(a,f)),det);return {kind:'one',x,y,rows,det};}
  const inconsistent=rows.some(r=>!r[1].n&&!r[2].n&&r[0].n)||sub(mul(a,f),mul(c,d)).n!==0n||sub(mul(b,f),mul(c,e)).n!==0n;
  return {kind:inconsistent?'none':'infinite',rows,det};
}
export function verifySystem(solution,attempt){if(solution.kind!=='one'){const correct=solution.kind==='none'?/^(нет решений|решений нет|∅)$/i.test(attempt.trim()):/^бесконечно много решений$/i.test(attempt.trim());return {status:correct?'correct':'incorrect',text:correct?'Тип множества решений определён верно.':'Проверь совместность двух равенств.'};}
  try{const pairs=attempt.split(';').map(s=>/^\s*([xy])\s*=\s*([+-]?\d{1,12}(?:[.,]\d{1,6})?|[+-]?\d{1,12}\/[+-]?\d{1,12})\s*$/.exec(s));if(pairs.length!==2||pairs.some(p=>!p)||new Set(pairs.map(p=>p[1])).size!==2)throw Error('ANSWER_FORMAT');const parsed=Object.fromEntries(pairs.map(p=>[p[1],p[2].includes('/')?R(...p[2].split('/').map(BigInt)):decimal(p[2],12)]));const correct=eq(parsed.x,solution.x)&&eq(parsed.y,solution.y);return {status:correct?'correct':'incorrect',text:correct?'Пара удовлетворяет обоим уравнениям.':'Подставь пару в оба уравнения: каждое должно быть верным.'};}catch{return {status:'unsupported',text:'Введи пару в виде x=2; y=3. Обыкновенные дроби допустимы.'};}}
export function systemSteps(s){
  const [[c,a,b],[f,d,e]]=s.rows, neg=r=>R(-r.n,r.d);
  const steps=[`Нормальная запись: (${text(a)})x + (${text(b)})y = ${text(neg(c))}; (${text(d)})x + (${text(e)})y = ${text(neg(f))}.`];
  if(s.kind==='infinite'){
    const row=s.rows.find(r=>r[1].n||r[2].n);
    steps.push('Одно равенство следует из другого, либо одно из них — тождество.');
    if(!row)steps.push('Оба равенства — тождества: подходят любые x и y.');
    else {const [k,u,v]=row;steps.push(u.n?`Пусть y=t, где t — любое число. Тогда x=(${text(neg(k))}-(${text(v)})t)/(${text(u)}).`:`x — любое число; y=${text(div(neg(k),v))}.`);}
    return [...steps,'Ответ: бесконечно много решений.'];
  }
  const eliminateY=Boolean(b.n||e.n),m1=eliminateY?e:d,m2=eliminateY?b:a;
  const coef=eliminateY?sub(mul(a,m1),mul(d,m2)):sub(mul(b,m1),mul(e,m2));
  const rhs=sub(mul(neg(c),m1),mul(neg(f),m2)),variable=eliminateY?'x':'y';
  const contradiction=s.rows.find(r=>!r[1].n&&!r[2].n&&r[0].n);
  if(contradiction)steps.push(`Одно из исходных равенств требует 0=${text(neg(contradiction[0]))}: это невозможно.`);
  else steps.push(`Умножаем первое равенство на ${text(m1)}, второе на ${text(m2)}; вычитаем второе из первого.`, `Остаётся (${text(coef)})${variable} = ${text(rhs)}.`);
  if(s.kind==='none')return [...steps,'Получили противоречие. Ответ: решений нет.'];
  steps.push(`${variable}=${text(variable==='x'?s.x:s.y)}.`, eliminateY?`Подставляем x=${text(s.x)} в равенство с ненулевым коэффициентом при y и получаем y=${text(s.y)}.`:`Подставляем y=${text(s.y)} в равенство с ненулевым коэффициентом при x и получаем x=${text(s.x)}.`, `Ответ: x=${text(s.x)}; y=${text(s.y)}.`);
  return steps;
}

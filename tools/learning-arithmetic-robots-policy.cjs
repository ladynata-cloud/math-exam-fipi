'use strict';

// A robot receives only this visible-DOM snapshot. No task specification,
// canonical answer, generated plan, server evaluator or oracle enters strategy.
function snapshotDOM(document) {
  const one = selector => document.querySelector(selector), all = selector => [...document.querySelectorAll(selector)];
  const text = node => node?.textContent.replace(/\s+/g, ' ').trim() || '';
  const rows = Object.fromEntries(all('.lm-mul-row:not(.lm-mul-carry)').map(row => [row.dataset.mulRow,
    [...row.querySelectorAll('.lm-mul-cell')].map(cell => ({column:Number(cell.dataset.column),text:text(cell),filled:cell.classList.contains('lm-mul-filled'),active:cell.classList.contains('lm-mul-active')}))]));
  const prompts = all('.lm-card .lm-prompt').map(text);
  return {
    problem:prompts[0]||'', prompt:prompts.at(-1)||'', cue:text(one('.lm-course-cue')),
    feedback:text(one('.lm-feedback')), feedbackKind:one('.lm-feedback')?.className||'',
    scaffoldResult:all('[data-scaffold-result]').map(text), selectedRows:all('.lm-scaffold-selected').map(text),
    boardHTML:one('.lm-multiplication-board,.lm-division-scroll,.lm-normalize,.lm-course-visual')?.outerHTML||'',
    mul:rows, division:{top:text(one('.lm-working > .lm-number:first-child')).replace(/\s/g,''),activeTop:all('.lm-working > .lm-number:first-child .active').map(text).join(''),divisor:text(one('.lm-divisor')),quotient:text(one('.lm-quotient')),partials:all('.lm-working .partial').map(text),products:all('.lm-working .product').map(text),remainders:all('.lm-working .remainder').map(text)},
    microDigits:all('.lm-course-digits > span:not(.lm-course-divisor)').map(text).join(''),activeMicro:all('.lm-course-digits > .active').map(text).join(''),
    trail:text(one('.lm-estimate-trail')),input:one('#lm-answer')?.value||'',inputLabel:one('#lm-answer')?.getAttribute('aria-label')||'',
    progress:Number(one('progress')?.value||0), completed:!!all('.lm-card h2').find(node=>/^(Пример решён|Все \d+ примера решены)$/.test(text(node))),
    nextVisible:!!one('#lm-new'),disabled:!!one('#lm-answer')?.disabled
  };
}
const number = raw => Number(String(raw).replace(',', '.'));
const shown = value => String(value).replace('.', ',');
function expression(prompt) {
  const matches=[...prompt.matchAll(/(\d+(?:[,.]\d+)?)\s*([×·+−:/-])\s*(\d+(?:[,.]\d+)?)(?:\s*([+−-])\s*(\d+))?\s*=\s*\?/g)];
  const m=matches.at(-1);if(!m)return null;
  const a=number(m[1]),b=number(m[3]);let value=['×','·'].includes(m[2])?a*b:m[2]==='+'?a+b:['−','-'].includes(m[2])?a-b:a/b;
  if(m[4])value+=m[4]==='+'?number(m[5]):-number(m[5]);
  return {value,a,b,op:m[2]};
}
function rowNumber(cells){return cells?.filter(c=>c.filled).sort((a,b)=>b.column-a.column).map(c=>c.text).join('')||'';}
function divisionContext(view){
  const p=view.prompt,d=view.division;let m;
  if((m=p.match(/(?:для|подходит к)\s+(\d+)\s*:\s*(\d+)/)))return {partial:+m[1],base:+m[2]};
  if((m=p.match(/□\s*[×·]\s*(\d+).*не больше\s+(\d+)/)))return {partial:+m[2],base:+m[1]};
  const base=number(d.divisor),partial=number(d.partials.at(-1)||d.activeTop);
  return base>0&&Number.isFinite(partial)?{partial,base}:null;
}
function solve(view) {
  const p=view.prompt,d=view.division;let m;
  const e=expression(p);if(e)return {value:shown(e.value),method:'visible arithmetic expression'};
  if((m=p.match(/округли\s+(\d+)/i)))return {value:String(Math.floor((+m[1]+5)/10)*10),method:'round visible number to tens'};
  if((m=p.match(/Получилось\s+(\d+).*последнюю цифру/)))return {value:String(+m[1]%10),method:'last digit of visible result'};
  if((m=p.match(/числ[ае]\s+(\d+).*последнюю цифру/)))return {value:String(+m[1]%10),method:'last digit of visible number'};
  if(/Сколько.*(?:в уме|перенес)/.test(p)&&(m=p.match(/(?:Последнюю цифру \d+ записали|Получилось \d+)/))){const n=p.match(/Получилось\s+(\d+)/)?.[1]||view.trail.match(/=\s*(\d+)\.?\s*$/)?.[1];if(n)return {value:String(Math.floor(+n/10)),method:'keep visible tens in mind'};}
  if((m=p.match(/Осталось\s+(\d+)\. Запиши эту цифру/)))return {value:m[1],method:'copy visible remaining digit'};
  if(/Сколько.*(?:в уме|перенес)/.test(p)&&view.mul.A){const activeA=view.mul.A.find(c=>c.active),activeB=view.mul.B?.find(c=>c.active);if(activeA&&activeB)return {value:String(Math.floor(+activeA.text * +activeB.text/10)),method:'tens of visible highlighted multiplication'};}
  if(/самую большую цифру/.test(p))return {value:'9',method:'largest decimal digit'};
  if(/цифру.*первой|Возьми её из прикидки/.test(p)){m=[...view.trail.matchAll(/Прикидка:[^=]*=\s*(\d+)/g)].at(-1);if(m)return {value:String(Math.min(9,+m[1])),method:'read earlier visible estimate'};}
  if(/(?:Уменьши|Увеличь) проверенную цифру/.test(p)){m=[...view.trail.matchAll(/(\d+)\s*×\s*\d+\s*=/g)].at(-1);if(m)return {value:String(+m[1]+(/Уменьши/.test(p)?-1:1)),method:'adjust previous visible trial'};}
  if(/(?:Подбери|Какую).*(?:одну цифру|цифру частного)|цифру.*(?:пишем|запишем)|Проверка закончена/.test(p)){const c=divisionContext(view);if(c)return {value:String(Math.floor(c.partial/c.base)),method:'compare visible products for one digit'};}
  if(/С какого числа.*начн/.test(p)){
    const task=view.problem.match(/(\d+)\s*:\s*(\d+)/),top=d.top||view.microDigits||task?.[1],base=number(d.divisor||p.match(/Нужно\s+(\d+)/)?.[1]||task?.[2]);
    if(top&&base){let take=top[0];for(let i=1;i<top.length&&+take<base;i++)take+=top[i];return {value:String(+take),method:'take visible left prefix'};}
  }
  if(/Умножь выбранную цифру на число справа/.test(p)&&d.divisor&&/\d$/.test(d.quotient))return {value:String(number(d.divisor)*+d.quotient.at(-1)),method:'multiply visible chosen digit and divisor'};
  if(/Вычти.*Сколько осталось/.test(p)){const c=divisionContext(view);if(c&&d.products.length)return {value:String(c.partial-number(d.products.at(-1))),method:'subtract the two written rows'};}
  if(/следующую цифру.*перенес|какую цифру.*перенес/i.test(p)){const digit=view.activeMicro||d.activeTop;if(/^\d$/.test(digit))return {value:digit,method:'copy highlighted next digit'};}
  if(/Какое число получилось|Какое число теперь/.test(p)){
    const r=p.match(/Осталось\s+(\d+)/)?.[1]??d.remainders.at(-1),digit=p.match(/цифру\s+(\d)/)?.[1]??(view.activeMicro||d.activeTop);
    if(r!==undefined&&/^\d$/.test(digit))return {value:String(+r*10 + +digit),method:'append highlighted digit to written remainder'};
  }
  if(/Сколько в ней десятков/.test(p))return {value:'10',method:'one hundred has ten tens'};
  if(/Сколько десятков останется из 10/.test(p))return {value:'9',method:'give one of ten tens away'};
  if((m=p.match(/(?:Сколько будет|Собери ответ для)\s+(\d+)\s*−\s*(\d+)/)))return {value:String(+m[1]-+m[2]),method:'recombine visible subtraction'};
  if(/Прочитай ответ|Запиши весь ответ|полный ответ/.test(p)){const result=rowNumber(view.mul.RES)||d.quotient;if(result&&result!=='?')return {value:result,method:'read the written answer row'};}
  return null;
}
function mistake(profile,view) {
  const p=view.prompt,e=expression(p),correct=solve(view),c=divisionContext(view);if(!correct)return null;
  const n=number(correct.value);let wrong=null;
  switch(profile.strategy){
    case 'table-fact':if(e&&['×','·'].includes(e.op)&&e.a>1&&e.b>1)wrong=n-1;break;
    case 'forgot-in-mind':if(e&&e.op==='+'&&/Прибавь|в уме|перенесли/i.test(p))wrong=e.a;break;
    case 'whole-number-in-cell':{const m=p.match(/Получилось\s+(\d+).*последнюю цифру/);if(m&&+m[1]>=10)wrong=+m[1];break;}
    case 'zero-product':if(e&&['×','·'].includes(e.op)&&e.b===0&&e.a>0)wrong=e.a;break;
    case 'shifted-row':if(e&&/Третью строку/.test(p)&&e.value>0)wrong=e.value*100;break;
    case 'quotient-too-high':if(c&&/цифру/.test(p)&&n>=0&&n<9&&!e)wrong=n+1;break;
    case 'quotient-too-low':if(c&&/цифру/.test(p)&&n>0&&!e)wrong=n-1;break;
    case 'estimate-is-final':if(/Проверка закончена|^Подбери одну цифру/.test(p)){const m=[...view.trail.matchAll(/Прикидка:[^=]*=\s*(\d+)/g)].at(-1);if(m&&+m[1]!==n)wrong=+m[1];}break;
    case 'subtraction':if(e&&['−','-'].includes(e.op))wrong=e.a%10<e.b%10?Math.abs(e.a%10-e.b%10)+10*Math.floor(e.a/10)-10*Math.floor(e.b/10):n+1;else if(/Вычти.*Сколько осталось/.test(p))wrong=n+1;break;
    case 'zero-in-division':if(c&&/Подбери.*цифру|Какую.*цифру.*(?:запишем|пишем)/.test(p)&&n===0&&!e&&!/перенес/.test(p))wrong=1;break;
    case 'help-and-return':if(view.progress>=1)wrong=n+1;break;
  }
  return wrong!==null&&wrong!==n?{value:shown(wrong),reason:profile.difficulty}:null;
}
function fromWorkedHelp(view){const m=view.feedback.match(/(?:На этом шаге запиши|Ответ к действию)\s*:\s*([\d]+(?:[,.]\d+)?)/);return m?{value:m[1],method:'read explicitly requested worked solution'}:null;}
function hintRevealsAnswer(view,correct){
  if(view.scaffoldResult.length||view.selectedRows.length||/✓\s*Берём|На этом шаге запиши\s*:|Ответ к действию\s*:/.test(view.feedback))return true;
  if(!correct)return false;
  const escaped=correct.value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return new RegExp('(?:=|Получается|Берём|Запиши|Должно остаться|цифра[^.]* —)\\s*'+escaped+'(?:[.\\s,;]|$)','i').test(view.feedback);
}
module.exports={snapshotDOM,solve,mistake,fromWorkedHelp,hintRevealsAnswer};

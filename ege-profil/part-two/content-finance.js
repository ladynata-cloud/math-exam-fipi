(function(root){
'use strict';

// The written finance bank has its own stable IDs. It uses the existing
// second-part answer, draft and help contracts.
const criteria=[
 'Я обозначил денежные величины и написал, когда начисляют проценты и когда делают платёж.',
 'Я составил формулу платежа или уравнения остатков и объяснил, из каких условий они следуют.',
 'Я вычислил нужную величину и указал единицу измерения в ответе.'
];
const prerequisites=[{title:'Вспомнить проценты и остаток долга',href:'/ege-profil/start/#fipi/2027/16'}];
const money='тыс. рублей';
const format=value=>String(value).replace('.',',');
// The catalog stores principal and balance in thousands, and calculates
// interest in hundredths of a thousand before summation.
const amount=cents=>format(cents/100);
const sum=values=>values.reduce((total,value)=>total+value,0);
const step=(prompt,answer,hint,explanation)=>({prompt,answers:[answer],hint,explanation,answerFormat:'number'});
const lesson=(id,title,goal,theory,tasks)=>({
 id,exam:16,title,goal,theory,prerequisites,tasks:tasks.map((task,index)=>({...task,id:id+'-'+(index+1)}))
});
const result=(label,answer,prompt,steps,solution)=>({
 prompt,steps,final:[{label,answers:[answer],answerFormat:'number'}],
 proof:{prompt:'Запишите календарь начислений, модель платежей и расчёт ответа.',criteria},
 solution
});

function calendar({principal,phases,first,last,ask}){
 const balances=[principal],rows=[];
 for(const {count,end,rate} of phases){
  const decrease=(balances.at(-1)-end)/count;
  for(let period=0;period<count;period++){
   const before=balances.at(-1),after=before-decrease;
   rows.push({before,after,rate,principalCents:decrease*100,interestCents:before*rate});
   balances.push(after);
  }
 }
 const n=rows.length, selected=rows.slice(first-1,last);
 const principalCents=sum(selected.map(row=>row.principalCents));
 const interestCents=sum(selected.map(row=>row.interestCents));
 const paymentCents=principalCents+interestCents;
 const span=first===last?'за платёж №'+first:first===1&&last===n?'за весь срок':'с '+first+'-го по '+last+'-й платёж включительно';
 const question=ask==='rate'
  ?'Всего '+span+' внесли '+amount(paymentCents)+' '+money+'. Найдите месячную ставку в процентах.'
  :ask==='interest'
   ?'Найдите, сколько '+span+' уплачено именно в виде процентов. Ответ дайте в тысячах рублей.'
   :'Найдите общую сумму выплат '+span+'. Ответ дайте в тысячах рублей.';
 const timeline=['Пятого числа каждого месяца, до платежа, долг увеличивают на '+(ask==='rate'?'один и тот же процент r каждый месяц.':phases.length===1?phases[0].rate+'% каждый месяц.':'ставку своего этапа: '+phases.map((p,i)=>'этап '+(i+1)+' — '+p.rate+'%').join(', ')+'.'),
  'После начисления с 6-го по 20-е число вносят один платёж. Остаток фиксируют в конце 20-го числа.'];
 const equal=phases.length===1
  ?'После каждого платежа остаток на одну и ту же сумму меньше, чем после предыдущего. До первого платежа сравнивают с первоначальным долгом.'
  :'На каждом из двух этапов остаток уменьшают равными долями внутри этапа. После '+phases[0].count+'-го платежа заканчивается первый этап, а остаток равен '+phases[0].end+' '+money+'.';
 const prompt='<p>Банк выдал '+principal+' '+money+' на '+n+' мес. Первый расчётный месяц следует за месяцем выдачи. '+timeline.join(' ')+'</p><p>'+equal+' После '+n+'-го платежа долг равен нулю.</p><p><strong>'+question+'</strong></p>';
 const reductions=phases.map((p,i)=>i===0?(principal-p.end)/p.count:(phases[i-1].end-p.end)/p.count);
 const balanceLine='Остатки после платежей, начиная с первоначального: '+balances.join(' → ')+' '+money+'. Уменьшение остатка за месяц '+(reductions.length===1?'равно '+reductions[0]+' '+money:'на первом этапе '+reductions[0]+', на втором — '+reductions[1]+' '+money)+'.';
 const model='Пусть B — долг перед начислением, C — долг после платежа, r — ставка в процентах. Платёж равен B · (1 + r/100) − C = (B − C) + B · r/100. Проценты начисляются на B.';
 const details='Для выбранных месяцев остатки перед начислением: '+selected.map(row=>row.before).join(', ')+' '+money+'. На основной долг за эти месяцы уходит '+amount(principalCents)+' '+money+'.';
 const wanted=ask==='rate'?phases[0].rate:(ask==='interest'?interestCents:paymentCents)/100;
 const finalLine=ask==='rate'
  ?'Из общей выплаты вычтем погашение основного долга: '+amount(paymentCents)+' − '+amount(principalCents)+' = '+amount(interestCents)+'. Поэтому ('+selected.map(row=>row.before).join(' + ')+') · r/100 = '+amount(interestCents)+'. Получаем r = '+wanted+'%.'
  :'Сумма процентов равна '+selected.map(row=>row.before+' · '+format(row.rate/100)).join(' + ')+' = '+amount(interestCents)+' '+money+'. '+(ask==='interest'?'Это искомая сумма.':'Общая выплата равна '+amount(principalCents)+' + '+amount(interestCents)+' = '+amount(paymentCents)+' '+money+'.');
 return result(ask==='rate'?'Ставка, в процентах':'Сумма, тыс. рублей',wanted,prompt,[
  step('На сколько тысяч рублей уменьшается основной долг за первый месяц?',reductions[0],
   'Разделите снижение остатка первого этапа на число платежей этого этапа.',balanceLine),
  step('Каков остаток долга перед начислением в первом из нужных месяцев, в тысячах рублей?',selected[0].before,
   'Возьмите остаток после предыдущего платежа. Для первого месяца это сумма кредита.',model+' '+details),
  step(ask==='rate'?'Найдите ставку, в процентах.':'Вычислите требуемую сумму, в тысячах рублей.',wanted,
   'Сначала выделите часть платежей, которая ушла на основной долг.',finalLine)
 ],[balanceLine,model,details,finalLine]);
}

// Inverse equal-principal model, approved FIPI 2027 demo, task 16 (second example).
function principalFromSelectedPayments(){
 const months=18,rate=2,first=8,last=13;
 const weights=Array.from({length:last-first+1},(_,i)=>months-first+1-i);
 const coefficientCents=100*weights.length+rate*sum(weights);
 const totalCents=126360;
 const share=totalCents/coefficientCents;
 const principal=months*share;
 const prompt='<p>В сентябре 2028 года заёмщик взял кредит на '+months+' месяцев. Первый расчётный месяц — октябрь 2028 года. Третьего числа каждого расчётного месяца банк увеличивает остаток долга на '+rate+'%. С 4-го по 17-е число заёмщик вносит один платёж.</p><p>После каждого платежа остаток долга уменьшается на одну и ту же сумму по сравнению с остатком после предыдущего платежа. В первый месяц сравнивают с суммой кредита. Последний платёж полностью гасит долг.</p><p>С мая по октябрь 2029 года включительно заёмщик внёс в сумме '+amount(totalCents)+' '+money+'. <strong>Какую сумму он взял в кредит? Ответ дайте в тысячах рублей.</strong></p>';
 const calendarLine='Май 2029 года — расчётный месяц №'+first+', октябрь — №'+last+'. Обозначим через d одинаковое уменьшение основного долга за месяц в тысячах рублей. Сумма кредита равна '+months+'d. Перед начислением процентов в выбранных месяцах долги равны '+weights.map(weight=>weight+'d').join(', ')+' тыс. рублей.';
 const paymentLine='За месяц погашается d тыс. рублей основного долга и уплачиваются проценты. Если перед начислением остаток равен kd, то платёж равен d + '+format(rate/100)+' · kd.';
 const sumLine='За '+weights.length+' месяцев погашено '+weights.length+'d основного долга. Сумма остатков, на которые начислены проценты, равна ('+weights.join(' + ')+')d = '+sum(weights)+'d. Поэтому за эти месяцы выплачено '+weights.length+'d + '+format(rate/100)+' · '+sum(weights)+'d = '+amount(coefficientCents)+'d.';
 const finalLine='По условию '+amount(coefficientCents)+'d = '+amount(totalCents)+'. Отсюда d = '+share+' тыс. рублей. Сумма кредита равна '+months+' · '+share+' = '+principal+' тыс. рублей.';
 return result('Сумма, тыс. рублей',principal,prompt,[
  step('Сколько долей основного долга остаётся перед майским начислением?',weights[0],
   'Отсчитайте расчётные месяцы от октября 2028 года. Из 18 долей уже погашены доли за все предыдущие месяцы.',calendarLine),
  step('Каким числом надо умножить долю основного долга, чтобы получить сумму шести нужных платежей?',coefficientCents/100,
   'Сложите шесть единиц основного долга и 2% от числа долей, оставшихся перед каждым начислением.',paymentLine+' '+sumLine),
  step('Какую сумму взяли в кредит, в тысячах рублей?',principal,
   'Найдите сначала одну долю, разделив сумму платежей на найденный коэффициент.',finalLine)
 ],[calendarLine,paymentLine,sumLine,finalLine]);
}

function equalPayments({rate,base,ask}){
 const k=format((100+rate)/100),initial=(200+rate)*base,after=(100+rate)*base;
 const cents=(100+rate)**2*base;
 const prior=initial*(100+rate),interest=2*cents-initial*100;
 const asked={
  payment:{answer:cents/100,sentence:'Вычислите величину одного платежа.'},
  balance:{answer:after,sentence:'Каков остаток долга сразу после первого платежа?'},
  interest:{answer:interest/100,sentence:'На сколько суммарные выплаты больше суммы кредита?'},
  principal:{answer:initial,sentence:'Какую сумму банк первоначально выдал?'}
 }[ask];
 const given=ask==='principal'?'Каждый платёж составляет '+amount(cents)+' '+money+'.':'Первоначальная сумма кредита равна '+initial+' '+money+'.';
 const prompt='<p>Кредит выдан на два года. В конце каждого года остаток сначала увеличивают на '+rate+'%, затем в тот же день вносят платёж. Размер обоих платежей одинаков. После второго платежа остаток равен нулю.</p><p>'+given+' <strong>'+asked.sentence+' Ответ дайте в тысячах рублей.</strong></p>';
 const description='Обозначим первоначальный долг через S, единый платёж через P. Коэффициент начисления k = '+k+'. Учитываем начисление до платежа.';
 const expression='После первого платежа остаётся kS − P. После второго остаётся k(kS − P) − P. По условию этот остаток нулевой, поэтому k²S = (k + 1)P.';
 const calculation=ask==='principal'
  ?'Отсюда S = (k + 1)P/k². Подставим k = '+k+' и P = '+amount(cents)+'. Получаем S = '+initial+' '+money+'.'
  :'Отсюда P = k²S/(k + 1). Подставим S = '+initial+' и k = '+k+' и получим P = '+amount(cents)+' '+money+'.';
 const check='Перед первым платежом долг равен '+amount(prior)+'. После первого платежа остаётся '+amount(prior)+' − '+amount(cents)+' = '+after+'. После следующего начисления он равен '+amount(cents)+', поэтому ровно закрывается вторым платежом. Переплата 2P − S = '+amount(interest)+' '+money+'.';
 return result('Сумма, тыс. рублей',asked.answer,prompt,[
  step('Во сколько раз увеличивается долг перед каждым платежом?',Number(k.replace(',','.')),
    'Увеличение на r% означает умножение на 1 + r/100.',description),
  step(ask==='principal'?'Сколько тысяч рублей остаётся сразу после первого платежа?':'Сколько тысяч рублей должен заёмщик перед первым платежом?',
   ask==='principal'?after:prior/100,
    ask==='principal'?'Перед последним платежом весь долг равен P. Разделите его на k.':'Умножьте первоначальный долг на коэффициент начисления.',
   expression),
  step('Найдите сумму, которую спрашивают в условии, в тысячах рублей.',asked.answer,
   'Используйте уравнение для нулевого остатка после второго платежа.',calculation+' '+check)
 ],[description,expression,calculation,check]);
}

const periods=(principal,count,rate,first,last,ask)=>calendar({principal,phases:[{count,end:0,rate}],first,last,ask});
const split=(principal,middle,a,b,r,s,first,last,ask)=>calendar({
 principal,phases:[{count:a,end:middle,rate:r},{count:b,end:0,rate:s}],first,last,ask
});
const fixed=(rate,base,ask)=>equalPayments({rate,base,ask});
const lessons=[
 lesson('h12-monthly-balance','Остаток уменьшается равными долями',
  'Составьте ряд остатков и выделите платежи, о которых спрашивают.',
  ['Падение остатка одинаково: делим сумму кредита на число месяцев.',
   'Платёж состоит из этой доли основного долга и процентов на остаток до начисления.'],[
  periods(880,4,7,1,4,'total'),periods(1050,5,6,1,5,'interest'),periods(980,7,9,6,7,'total'),
  periods(930,6,12,5,6,'rate'),principalFromSelectedPayments(),periods(1175,5,4,2,5,'interest')
 ]),
 lesson('h12-two-stage-balance','Долг погашают в два этапа',
  'Найдите шаг уменьшения для каждого этапа и не начисляйте проценты дважды.',
  ['Из первоначальной суммы вычтите промежуточный остаток и разделите разность на число первых платежей.',
   'На втором этапе разделите промежуточный остаток на число оставшихся платежей. Начальный долг для следующего начисления — фактический остаток.'],[
  split(1340,620,3,4,7,7,1,7,'total'),split(1250,550,4,5,8,5,4,6,'total'),split(1080,480,3,4,10,10,1,7,'rate'),
  split(1590,690,3,3,6,9,3,5,'total'),split(1430,650,3,5,9,9,2,7,'rate'),split(1710,750,4,5,7,11,5,8,'interest')
 ]),
 lesson('h12-equal-annual-payments','Одинаковые платежи в конце года',
  'Запишите два остатка подряд и используйте нулевой долг после второй выплаты.',
  ['Одинаковая выплата не означает одинаковое уменьшение основного долга.',
   'При коэффициенте начисления k и платеже P после первого платежа остаётся kS − P. После второго остаток равен нулю.'],[
  fixed(8,7,'payment'),fixed(6,9,'balance'),fixed(5,11,'interest'),
  fixed(9,6,'principal'),fixed(7,5,'interest'),fixed(12,8,'balance')
 ])
];
root.ProfileFinanceWrittenLessons=lessons;
if(typeof module!=='undefined'&&module.exports)module.exports=lessons;
})(typeof globalThis!=='undefined'?globalThis:this);

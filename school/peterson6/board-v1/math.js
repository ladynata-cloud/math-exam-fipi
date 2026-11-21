/* Exact arithmetic and repeatable skill practice. No network or learner records. */
(function(root,factory){'use strict';var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PetersonMath=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const LIMIT=1000000000000n;
function gcdBig(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b){const r=a%b;a=b;b=r;}return a;}
function rational(n,d){try{n=BigInt(n);d=BigInt(d);if(d===0n)return null;if(d<0n){n=-n;d=-d;}const g=gcdBig(n,d);n/=g;d/=g;if(n>LIMIT||n< -LIMIT||d>LIMIT)return null;return {n:Number(n),d:Number(d)};}catch(_){return null;}}
function parse(value){
 if(value&&typeof value==='object'&&Number.isSafeInteger(value.n)&&Number.isSafeInteger(value.d))return rational(value.n,value.d);
 if(typeof value==='number'){if(!Number.isFinite(value))return null;value=String(value);}
 if(typeof value!=='string')return null;const s=value.trim().replace(/−/g,'-').replace(/\u00a0/g,' ');if(!s||s.length>70)return null;
 let m=s.match(/^([+-]?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);if(m){const a=BigInt(m[2]),b=BigInt(m[3]),d=BigInt(m[4]);if(d===0n||b>=d||a>LIMIT||b>LIMIT||d>LIMIT)return null;return rational((m[1]==='-'?-1n:1n)*(a*d+b),d);}
 m=s.match(/^([+-]?\d+)\s*\/\s*(\d+)$/);if(m){const n=BigInt(m[1]),d=BigInt(m[2]);if(n>LIMIT||n< -LIMIT||d>LIMIT)return null;return rational(n,d);}
 m=s.match(/^([+-]?)(?:(\d+)(?:[.,](\d+))?|[.,](\d+))$/);if(!m)return null;
 const whole=m[2]||'0',decimal=m[3]||m[4]||'';if(whole.length>13||decimal.length>12)return null;
 const n=BigInt(whole+decimal)*(m[1]==='-'?-1n:1n),d=10n**BigInt(decimal.length);if(n>LIMIT||n< -LIMIT||d>LIMIT)return null;return rational(n,d);
}
function equal(a,b){a=parse(a);b=parse(b);return !!(a&&b&&BigInt(a.n)*BigInt(b.d)===BigInt(b.n)*BigInt(a.d));}
function check(a,b,form){if(!equal(a,b))return false;const s=String(a).trim().replace(/−/g,'-');if(form==='decimal')return /^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(s);if(form==='integer')return /^[+-]?\d+$/.test(s);if(form==='reduced-fraction'){if(/^[+-]?\d+$/.test(s))return true;const m=s.match(/^([+-]?\d+)\s*\/\s*(\d+)$/);return !!(m&&BigInt(m[2])>1n&&gcdBig(BigInt(m[1]),BigInt(m[2]))===1n);}if(form==='improper-fraction'){if(/^[+-]?\d+$/.test(s))return true;const m=s.match(/^([+-]?\d+)\s*\/\s*(\d+)$/);return !!(m&&BigInt(m[2])>0n&&(BigInt(m[1])<0n?-BigInt(m[1]):BigInt(m[1]))>=BigInt(m[2]));}if(form==='mixed-number')return /^[+-]?\d+\s+\d+\s*\/\s*\d+$/.test(s)||/^[+-]?\d+$/.test(s);return true;}
function must(v){const r=parse(v);if(!r)throw Error('Invalid rational');return r;}
function operation(op,a,b){a=must(a);b=must(b);const an=BigInt(a.n),ad=BigInt(a.d),bn=BigInt(b.n),bd=BigInt(b.d);let r;if(op==='add')r=rational(an*bd+bn*ad,ad*bd);else if(op==='subtract')r=rational(an*bd-bn*ad,ad*bd);else if(op==='multiply')r=rational(an*bn,ad*bd);else if(op==='divide')r=rational(an*bd,ad*bn);else throw Error('Unknown operation');if(!r)throw Error('Arithmetic out of bounds');return r;}
function answer(v){const r=must(v);return r.d===1?String(r.n):r.n+'/'+r.d;}
function decimal(v){const r=must(v);let d=BigInt(r.d),n=BigInt(r.n),digits=0;while(d%2n===0n)d/=2n;while(d%5n===0n)d/=5n;if(d!==1n)throw Error('Nonterminating decimal');d=BigInt(r.d);let factor=1n;while(factor%d!==0n){factor*=10n;digits++;}const neg=n<0n;if(neg)n=-n;let s=(n*(factor/d)).toString().padStart(digits+1,'0');if(digits)s=s.slice(0,-digits)+','+s.slice(-digits);s=s.replace(/(,\d*?)0+$/,'$1').replace(/,$/,'');return (neg?'-':'')+s;}
function format(value){const r=must(value);if(r.d===1)return String(r.n);return (r.n<0?'−':'')+'{{frac:'+Math.abs(r.n)+':'+r.d+'}}';}
function frac(n,d){return '{{frac:'+n+':'+d+'}}';}
function mix(w,n,d){return '{{mix:'+w+':'+n+':'+d+'}}';}
function gcd(a,b){return Number(gcdBig(BigInt(a),BigInt(b)));}
function lcm(a,b){return a/gcd(a,b)*b;}
function rng(seed){let x=(Number(seed)>>>0)||0x9e3779b9;return function(lo,hi){x+=0x6D2B79F5;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return lo+Math.floor(((t^(t>>>14))>>>0)/4294967296*(hi-lo+1));};}
const rows=[
['fraction-reduce','Сокращение дробей','Делим числитель и знаменатель на одно и то же число.',[]],
['fraction-mixed','Смешанное число и неправильная дробь','Переводим целую часть в доли.',['fraction-reduce']],
['fraction-add','Сложение обыкновенных дробей','Общий знаменатель и сложение числителей.',['fraction-reduce']],
['fraction-subtract','Вычитание обыкновенных дробей','Одинаковые доли перед вычитанием.',['fraction-add']],
['fraction-multiply','Умножение обыкновенных дробей','Умножаем числители и знаменатели; сокращаем.',['fraction-reduce']],
['fraction-divide','Деление обыкновенных дробей','Умножаем на дробь, обратную делителю.',['fraction-multiply']],
['decimal-add','Сложение десятичных дробей','Складываем одинаковые разряды.',[]],
['decimal-subtract','Вычитание десятичных дробей','Вычитаем одинаковые разряды.',['decimal-add']],
['decimal-multiply','Умножение десятичных дробей','Сначала без запятой, затем возвращаем её на место.',[]],
['decimal-divide','Деление десятичных дробей','Сдвигаем запятую в обоих числах одинаково.',['decimal-multiply']],
['decimal-to-fraction','Десятичная дробь в обыкновенную','Записываем десятые, сотые или тысячные и сокращаем.',['fraction-reduce']],
['fraction-to-decimal','Обыкновенная дробь в десятичную','Приводим знаменатель к 10, 100 или 1000.',['fraction-reduce']],
['mixed-multiply','Умножение смешанных чисел','Сначала переводим в неправильные дроби.',['fraction-mixed','fraction-multiply']],
['mixed-divide','Деление смешанных чисел','Переводим, затем переворачиваем только делитель.',['fraction-mixed','fraction-divide']],
['unlike-multiply','Десятичная × обыкновенная дробь','Выбираем одну запись для обоих множителей.',['decimal-to-fraction','fraction-multiply']],
['unlike-divide','Десятичная ÷ обыкновенная дробь','Записываем оба числа обыкновенными дробями.',['decimal-to-fraction','fraction-divide']],
['order-operations','Порядок действий с дробями','Сначала умножение или деление, потом сложение.',['fraction-add','unlike-multiply']],
['percent-part','Процент от числа','Находим одну сотую и нужное число сотых.',['decimal-multiply']],
['percent-whole','Число по его проценту','Из известной части восстанавливаем 100%.',['decimal-divide']],
['percent-ratio','Сколько процентов','Часть делим на целое и умножаем на 100.',['decimal-divide']]
];
const skills=rows.map(r=>({id:r[0],title:r[1],description:r[2],prerequisites:r[3]}));
const equationDescriptions={'percent-part':'Обозначаем искомую величину и составляем равенство.','percent-whole':'Обозначаем целое за x и составляем уравнение.','percent-ratio':'Обозначаем неизвестный процент и связываем часть с целым.'};
const equationSkills=skills.map(s=>({...s,description:equationDescriptions[s.id]||s.description}));
function generateLegacy(id,seed,level=1){
 const skill=skills.find(s=>s.id===id);if(!skill)throw Error('Unknown skill: '+id);if(!Number.isInteger(level)||level<1||level>3)throw Error('Level must be 1, 2 or 3');
 if(!Number.isSafeInteger(Number(seed)))throw Error('Seed must be a safe integer');const R=rng((Number(seed)>>>0)^((rows.findIndex(r=>r[0]===id)+1)*1009)^(level*7919));const pick=a=>a[R(0,a.length-1)];
 const task={id:'skill-'+id+'-'+level+'-'+seed,title:skill.title,prompt:'',kind:'number',answer:'',steps:[],hint:skill.description,explanation:'',skills:[id],source:{type:'authored',reference:'Авторская тренировка вычислительного навыка'}};
 const step=(prompt,value,hint,explanation,answerFormat)=>{if(!answerFormat&&/десятичной дробью|Введи десятичную дробь/.test(prompt))answerFormat='decimal';const s={prompt,answer:answerFormat==='decimal'?decimal(value):answer(value),hint,explanation:explanation||hint};if(answerFormat)s.answerFormat=answerFormat;task.steps.push(s);};
 const done=(op,a,b,result)=>{task.answer=answer(result);task.calculation={op,left:answer(a),right:answer(b)};};
 const f=()=>{let d=R(2,level===1?8:level===2?12:20),n=R(1,level===1?d-1:2*d-1);return must(n+'/'+d);};
 const D=()=>{const places=level===1?1:R(1,level===2?2:3),den=10**places;let n=R(1,level===1?39:level===2?249:1499);while(n%10===0)n++;return {r:must(n+'/'+den),n,den,places,text:decimal(n+'/'+den)};};
 const binary=(op,A,B,displayA,displayB)=>{
  const sym={add:'+',subtract:'−',multiply:'·',divide:':'}[op],result=operation(op,A,B);task.prompt='Вычисли: '+(displayA||format(A))+' '+sym+' '+(displayB||format(B))+'. Запиши число или дробь.';
  if(op==='add'||op==='subtract'){const den=lcm(A.d,B.d),a=A.n*(den/A.d),b=B.n*(den/B.d);step('Найди наименьший общий знаменатель. Запиши целое число.',den,'Подбери наименьшее число, которое делится на оба знаменателя.');step('Запиши числитель первой дроби после приведения к знаменателю '+den+'.',a,'Во сколько раз увеличился знаменатель, во столько же увеличь числитель.');step('Запиши числитель второй дроби после приведения к знаменателю '+den+'.',b,'Умножь числитель и знаменатель второй дроби на одно число.');step('Выполни действие с полученными числителями. Запиши новый числитель.',op==='add'?a+b:a-b,'Знаменатель остаётся общим.','Числитель результата: '+a+' '+sym+' '+b+' = '+(op==='add'?a+b:a-b)+'.');}
  else if(op==='multiply'){step('Перемножь числители. Запиши полученное целое число.',A.n*B.n,'Считаем только верхние числа.');step('Перемножь знаменатели. Запиши полученное целое число.',A.d*B.d,'Считаем только нижние числа.');task.hint+=' Сокращать можно множители числителя и знаменателя.';}
  else{step('Какой числитель у дроби, обратной делителю? Запиши число.',B.d,'В обратной дроби числитель и знаменатель меняются местами.');step('Какой знаменатель у дроби, обратной делителю? Запиши число.',B.n,'Первую дробь не переворачиваем.');step('Перемножь числители после замены деления умножением.',A.n*B.d,'Числитель первой дроби умножь на числитель обратной.');step('Перемножь знаменатели после замены деления умножением.',A.d*B.n,'Знаменатель первой дроби умножь на знаменатель обратной.');}
  done(op,A,B,result);task.explanation=(displayA||format(A))+' '+sym+' '+(displayB||format(B))+' = '+format(result)+'. Проверь, можно ли сократить результат.';
 };
 if(id==='fraction-reduce'){
  let a=R(1,level===1?9:25),b=R(a+1,a+(level===3?35:12)),g=gcd(a,b);a/=g;b/=g;const k=R(2,level===1?5:level===2?9:15),n=a*k,d=b*k;
  task.prompt='Сократи дробь '+frac(n,d)+'. Запиши несократимую дробь.';step('На какое наибольшее целое число делятся и '+n+', и '+d+'?',k,'Найди общий делитель числителя и знаменателя.');step('Раздели числитель '+n+' на '+k+'. Запиши новый числитель.',a,'Знаменатель будем делить на тот же делитель.');step('Раздели знаменатель '+d+' на '+k+'. Запиши новый знаменатель.',b,'Деление обеих частей дроби на одно число сохраняет её значение.');task.answer=a+'/'+b;task.answerFormat='reduced-fraction';task.calculation={op:'identity',left:n+'/'+d};task.explanation=frac(n,d)+' = '+frac(a,b)+': обе части разделили на '+k+'.';
 }else if(id==='fraction-mixed'){
  const w=R(1,level===1?4:12),d=R(2,level===1?8:16),n=R(1,d-1);task.prompt='Запиши '+mix(w,n,d)+' в виде неправильной дроби.';
  step('Сколько долей со знаменателем '+d+' содержится в '+w+' целых? Запиши число.',w*d,'Умножь целую часть на знаменатель.');step('Прибавь ещё '+n+' долей. Каким стал числитель?',w*d+n,'К долям из целой части добавь числитель дробной части.');task.answer=answer((w*d+n)+'/'+d);task.answerFormat='improper-fraction';task.calculation={op:'identity',left:(w*d+n)+'/'+d};task.explanation=mix(w,n,d)+' = '+frac(w*d+n,d)+'. Знаменатель не меняется.';
 }else if(/^fraction-(add|subtract|multiply|divide)$/.test(id)){
  const op=id.slice(9);let A=f(),B=f();if(op==='subtract'&&operation('subtract',A,B).n<0){const t=A;A=B;B=t;}binary(op,A,B);
 }else if(id==='decimal-add'||id==='decimal-subtract'){
  let A=D(),B=D();const op=id==='decimal-add'?'add':'subtract';if(op==='subtract'&&operation('subtract',A.r,B.r).n<0){const t=A;A=B;B=t;}const den=Math.max(A.den,B.den),a=A.n*(den/A.den),b=B.n*(den/B.den),result=operation(op,A.r,B.r),unit=den===10?'десятых':den===100?'сотых':'тысячных';
  task.prompt='Вычисли: '+A.text+(op==='add'?' + ':' − ')+B.text+'. Запиши десятичную дробь.';step('Вырази '+A.text+' в '+unit+'. Запиши количество этих долей.',a,'Умножь число на '+den+'.');step('Вырази '+B.text+' в '+unit+'. Запиши количество этих долей.',b,'Считаем доли одинакового размера.');step('Сколько '+unit+' получится после '+(op==='add'?'сложения':'вычитания')+'?',op==='add'?a+b:a-b,'Выполни действие с целыми количествами долей.');done(op,A.r,B.r,result);task.answer=decimal(result);task.answerFormat='decimal';task.explanation=A.text+(op==='add'?' + ':' − ')+B.text+' = '+decimal(result)+'. Запятая отделяет целые от долей.';
 }else if(id==='decimal-multiply'){
  const A=D(),B=D(),result=operation('multiply',A.r,B.r);task.prompt='Вычисли: '+A.text+' · '+B.text+'. Запиши десятичную дробь.';step('Умножь числа без запятых: '+A.n+' · '+B.n+'.',A.n*B.n,'Сначала умножаем как натуральные числа.');step('Сколько всего цифр после запятых в двух множителях?',A.places+B.places,'Сложи число знаков после запятой в первом и втором множителях.');done('multiply',A.r,B.r,result);task.answer=decimal(result);task.answerFormat='decimal';task.explanation='В произведении '+A.n*B.n+' отделяем справа '+(A.places+B.places)+' знаков: '+decimal(result)+'. При необходимости дописываем нули слева.';
 }else if(id==='decimal-divide'){
  const divisor=D(),quotient=D(),dividend=operation('multiply',divisor.r,quotient.r),shifted=operation('multiply',dividend,divisor.den);task.prompt='Вычисли: '+decimal(dividend)+' : '+divisor.text+'. Запиши десятичную дробь.';step('Во сколько раз умножим делитель, чтобы убрать запятую? Запиши 10, 100 или 1000.',divisor.den,'Посчитай знаки после запятой в делителе.');step('Умножь делимое '+decimal(dividend)+' на '+divisor.den+'. Запиши новое делимое.',shifted,'Оба числа умножаем на одно и то же число.');step('Умножь делитель '+divisor.text+' на '+divisor.den+'. Запиши новый делитель.',divisor.n,'Теперь в делителе не будет запятой.');done('divide',dividend,divisor.r,quotient.r);task.answer=decimal(quotient.r);task.answerFormat='decimal';task.explanation=decimal(dividend)+' : '+divisor.text+' = '+decimal(shifted)+' : '+divisor.n+' = '+decimal(quotient.r)+'.';
 }else if(id==='decimal-to-fraction'){
  const A=D(),g=gcd(A.n,A.den);task.prompt='Запиши '+A.text+' обыкновенной несократимой дробью или целым числом.';step('Какой знаменатель соответствует записи '+A.text+': 10, 100 или 1000?',A.den,'Одна цифра после запятой — десятые, две — сотые, три — тысячные.');step('Какой числитель будет у дроби со знаменателем '+A.den+'?',A.n,'Запиши исходное число без запятой.');step('На какой наибольший общий делитель можно сократить числитель и знаменатель? Если сокращать нельзя, введи 1.',g,'Найди НОД числителя и знаменателя.');task.answer=answer(A.r);task.answerFormat='reduced-fraction';task.calculation={op:'identity',left:answer(A.r)};task.explanation=A.text+' = '+frac(A.n,A.den)+' = '+format(A.r)+'.';
 }else if(id==='fraction-to-decimal'){
  const d=pick(level===1?[2,4,5,10,20,25,50,100]:level===2?[4,5,8,20,25,50]:[8,16,20,25,40,50,80,125]),n=R(1,level===1?d-1:d*2-1);let den=10;while(den%d)den*=10;const k=den/d;task.prompt='Запиши '+frac(n,d)+' десятичной дробью.';step('На какое число умножим знаменатель '+d+', чтобы получить '+den+'?',k,'Раздели '+den+' на '+d+'.');step('Умножь числитель '+n+' на '+k+'. Запиши новый числитель.',n*k,'Числитель и знаменатель умножаем одинаково.');task.answer=decimal(n+'/'+d);task.answerFormat='decimal';task.calculation={op:'identity',left:n+'/'+d};task.explanation=frac(n,d)+' = '+frac(n*k,den)+' = '+task.answer+'.';
 }else if(id==='mixed-multiply'||id==='mixed-divide'){
  const aw=R(1,level+2),ad=R(2,level===1?6:12),an=R(1,ad-1),bw=R(1,level+3),bd=R(2,level===1?6:12),bn=R(1,bd-1),A=must((aw*ad+an)+'/'+ad),B=must((bw*bd+bn)+'/'+bd),op=id==='mixed-multiply'?'multiply':'divide',result=operation(op,A,B);task.prompt='Вычисли: '+mix(aw,an,ad)+(op==='multiply'?' · ':' : ')+mix(bw,bn,bd)+'. Запиши число или дробь.';step('Переведи первое смешанное число в неправильную дробь.',A,'Целую часть умножь на знаменатель, прибавь числитель.','Первое число: '+format(A)+'.','improper-fraction');step('Переведи второе смешанное число в неправильную дробь.',B,'Знаменатель при переводе не меняется.','Второе число: '+format(B)+'.','improper-fraction');if(op==='divide')step('Запиши дробь, обратную второму числу.',must(B.d+'/'+B.n),'Меняем местами числитель и знаменатель только делителя.');step('Используем '+format(A)+' и '+format(B)+'. После '+(op==='multiply'?'умножения дробей':'замены деления умножением')+' какой получится числитель до сокращения?',A.n*(op==='multiply'?B.n:B.d),'Перемножь числители.');step('Какой получится знаменатель до сокращения?',A.d*(op==='multiply'?B.d:B.n),'Перемножь знаменатели.');done(op,A,B,result);task.explanation='После перевода: '+format(A)+(op==='multiply'?' · ':' : ')+format(B)+' = '+format(result)+'.';
 }else if(id==='unlike-multiply'||id==='unlike-divide'){
  const A=D(),B=f(),op=id==='unlike-multiply'?'multiply':'divide',result=operation(op,A.r,B);task.prompt='Вычисли: '+A.text+(op==='multiply'?' · ':' : ')+format(B)+'. Запиши число или дробь.';step('Переведи '+A.text+' в обыкновенную дробь.',A.r,'Запиши десятые, сотые или тысячные и сократи при необходимости.');if(op==='divide')step('Запиши дробь, обратную делителю '+format(B)+'.',must(B.d+'/'+B.n),'Переворачиваем только делитель.');step('Используем '+format(A.r)+' и '+format(B)+'. Какой числитель получится при умножении до сокращения?',A.r.n*(op==='multiply'?B.n:B.d),'Умножь числители обыкновенных дробей.');step('Какой знаменатель получится при умножении до сокращения?',A.r.d*(op==='multiply'?B.d:B.n),'Умножь знаменатели.');done(op,A.r,B,result);task.explanation=A.text+' = '+format(A.r)+'. Затем '+format(A.r)+(op==='multiply'?' · ':' : ')+format(B)+' = '+format(result)+'.';
 }else if(id==='order-operations'){
  const A=f(),B=D(),C=f(),product=operation('multiply',B.r,C),result=operation('add',A,product);task.prompt='Вычисли: '+format(A)+' + '+B.text+' · '+format(C)+'. Запиши число или дробь.';step('Запиши десятичный множитель '+B.text+' обыкновенной дробью.',B.r,'Одинаковая запись поможет выполнить умножение.');step('Сначала найди произведение '+format(B.r)+' · '+format(C)+'.',product,'Умножение выполняется раньше сложения.');step('Найди общий знаменатель для '+format(A)+' и '+format(product)+'.',lcm(A.d,product.d),'Сложить можно одинаковые доли.');task.answer=answer(result);task.calculation={op:'add-product',left:answer(A),right:answer(B.r),third:answer(C)};task.explanation='Сначала '+B.text+' · '+format(C)+' = '+format(product)+'. Затем '+format(A)+' + '+format(product)+' = '+format(result)+'.';
 }else{
  const p=pick(level===1?[5,10,20,25,50,75]:level===2?[12,15,18,30,35,60,125]:['0.5','2.5','7.5','12.5',45,120,150]),W=R(2,level===1?20:100)*(level===1?20:level===2?10:8),rate=operation('divide',p,100),part=operation('multiply',W,rate);
  if(id==='percent-part'){task.prompt='Найди '+decimal(p)+'% от '+W+'. Запиши полученное число.';step('Сколько составляет 1% от '+W+'?',operation('divide',W,100),'Раздели целое на 100.');step('Запиши '+decimal(p)+'% десятичной дробью.',rate,'Процент — сотая часть. Раздели число процентов на 100.');done('multiply',W,rate,part);task.explanation=W+' · '+decimal(rate)+' = '+format(part)+'.';}
  else if(id==='percent-whole'){task.prompt=decimal(part)+' составляет '+decimal(p)+'% числа. Найди всё число.';step('Найди 1% неизвестного числа.',operation('divide',part,p),'Раздели известную часть на число процентов.');step('Какой десятичной дробью записывается '+decimal(p)+'%?',rate,'Раздели число процентов на 100.');done('divide',part,rate,W);task.explanation=decimal(part)+' : '+decimal(rate)+' = '+W+'. Это 100%.';}
  else{task.prompt='Сколько процентов число '+decimal(part)+' составляет от '+W+'? Запиши число процентов без знака %.';step('Какое число принимаем за 100%? Запиши его.',W,'В вопросе «от '+W+'» указано целое.');step('Найди долю: раздели '+decimal(part)+' на '+W+'.',rate,'Делим часть на целое.');done('multiply',rate,100,p);task.explanation=decimal(part)+' : '+W+' · 100 = '+decimal(p)+'%. Ответ: '+decimal(p)+'.';}
 }
 const labels={'fraction-reduce':'Запиши несократимую дробь.','fraction-mixed':'Запиши полученную неправильную дробь.','decimal-to-fraction':'Запиши несократимую дробь или целое число.','fraction-to-decimal':'Запиши полученную десятичную дробь.','percent-part':'Чему равна найденная часть числа?','percent-whole':'Чему равно всё число (100%)?','percent-ratio':'Сколько процентов получилось? Запиши число без знака %.','order-operations':'Чему равно всё выражение?'};
 task.finalLabel=labels[id]||(id.includes('multiply')?'Чему равно произведение?':id.includes('divide')?'Чему равно частное?':id.includes('subtract')?'Чему равна разность?':'Чему равна сумма?');
 if(task.steps.length<2||task.steps.length>5)throw Error('Unexpected step count');return task;
}
// The original generator is retained for saved attempts made before the
// equation-method revision. A seed never changes its historical meaning.
function generate(id,seed,level=1,methodVersion=1){
 const task=generateLegacy(id,seed,level);
 if(methodVersion===1||!['percent-part','percent-whole','percent-ratio'].includes(id))return task;
 if(methodVersion!==2)throw Error('Unsupported teaching method');
 const number=(key,prompt,value,hint,explanation)=>({id:key,kind:'number',prompt,answer:answer(value),hint,explanation});
 const choice=(key,prompt,correct,alternatives,hint,explanation)=>({id:key,kind:'choice',prompt,choices:[correct,...alternatives],answer:correct,hint,explanation});
 const c=task.calculation;
 const whole=id==='percent-part'?c.left:id==='percent-whole'?task.answer:task.steps[0].answer;
 const rate=id==='percent-ratio'?c.left:c.right;
 const part=id==='percent-part'?task.answer:id==='percent-whole'?c.left:answer(operation('multiply',whole,rate));
 const pct=answer(operation('multiply',rate,100));
 const W=decimal(whole),P=decimal(part),R=decimal(rate),pc=decimal(pct);
 const meaning=id==='percent-part'?'искомая часть числа':id==='percent-whole'?'всё число, принятое за 100%':'искомое число процентов';
 const equation=id==='percent-part'?'{{frac:x:'+W+'}} = '+R:id==='percent-whole'?R+'x = '+P:W+' · {{frac:x:100}} = '+P;
 const alternatives=id==='percent-part'?['x · '+W+' = '+R,'{{frac:x:'+W+'}} = '+pc]:id==='percent-whole'?[pc+'x = '+P,R+'x = '+decimal(operation('add',part,1))]:[W+' · x = '+P,'{{frac:x:100}} = '+P+' · '+W];
 const root=id==='percent-part'?part:id==='percent-whole'?whole:pct;
 const calculation=id==='percent-part'?'x = '+W+' · '+R+' = '+P:id==='percent-whole'?'x = '+P+' : '+R+' = '+W:'x = '+P+' · 100 : '+W+' = '+pc;
 task.methodVersion=2;
 task.steps=[
  choice('unknown','Что обозначим за x?',meaning,['известное число '+(id==='percent-whole'?P:W),'количество шагов решения'],'Прочитай вопрос: какая величина неизвестна?','x — '+meaning+'.'),
  number('rate',id==='percent-ratio'?'Какое число в условии принимается за 100%?':'Запиши '+pc+'% десятичной дробью.',id==='percent-ratio'?whole:rate,id==='percent-ratio'?'Целое названо после слова «от».':'Раздели число процентов на 100.',id==='percent-ratio'?W+' — целое, принятое за 100%.':pc+'% = '+R+'.'),
  choice('equation','Выбери равенство, которое связывает часть с целым.',equation,alternatives,id==='percent-part'?'Искомая часть x, делённая на данное целое, равна известной доле.':id==='percent-whole'?'Известная доля, умноженная на неизвестное целое x, равна данной части.':'Искомые x% соответствуют доле {{frac:x:100}}. Умножь её на данное целое.','Модель условия: '+equation+'.'),
  number('root','Реши полученное уравнение. Чему равно x?',root,'Используй связь части, доли и целого; одинаковое действие выполняй с обеими частями равенства.',calculation+'.'),
  number('check',id==='percent-part'?'Проверь: какой процент от '+W+' составляет найденное число '+P+'?':'Проверь: чему равна часть '+pc+'% от '+(id==='percent-ratio'?'данного':'найденного')+' целого '+W+'?',id==='percent-part'?pct:part,id==='percent-part'?'Раздели найденную часть на целое и умножь на 100.':'Умножь целое на долю '+R+'.',id==='percent-part'?P+' : '+W+' · 100 = '+pc+'%.':W+' · '+R+' = '+P+' — исходная часть.')
 ];
 if(id!=='percent-ratio'){task.steps[1].answerFormat='decimal';task.steps[1].answer=R;}
 // Vary the correct position deterministically, without changing conditions.
 task.steps.filter(s=>s.kind==='choice').forEach((s,i)=>{const shift=(Number(seed)+i)%s.choices.length;s.choices=s.choices.slice(shift).concat(s.choices.slice(0,shift));});
 task.hint='Пусть x — '+meaning+'. Вырази связь с целым, принятым за 100%.';
 task.explanation='Пусть x — '+meaning+'. '+equation+'. '+calculation+'. Проверка: '+W+' · '+R+' = '+P+'.';
 return task;
}
return {skills,equationSkills,generate,generateLegacy,parse,equal,check,format,decimal,answer,operation};
});

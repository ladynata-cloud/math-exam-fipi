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
function check(a,b,form){if(!equal(a,b))return false;const s=String(a).trim().replace(/−/g,'-');if(form==='decimal')return /^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(s);if(form==='integer')return /^[+-]?\d+$/.test(s);if(form==='reduced-fraction'){if(/^[+-]?\d+$/.test(s))return true;const m=s.match(/^([+-]?\d+)\s*\/\s*(\d+)$/);return !!(m&&BigInt(m[2])>1n&&gcdBig(BigInt(m[1]),BigInt(m[2]))===1n);}if(form==='improper-fraction'){if(/^[+-]?\d+$/.test(s))return true;const m=s.match(/^([+-]?\d+)\s*\/\s*(\d+)$/);return !!(m&&BigInt(m[2])>0n&&(BigInt(m[1])<0n?-BigInt(m[1]):BigInt(m[1]))>=BigInt(m[2]));}if(form==='fraction')return /^[+-]?\d+(?:\s*\/\s*\d+)?$/.test(s);if(form==='mixed-number'){if(/^[+-]?\d+$/.test(s))return true;const m=s.match(/^[+-]?\d+\s+(\d+)\s*\/\s*(\d+)$/);return !!(m&&BigInt(m[1])>0n&&BigInt(m[1])<BigInt(m[2])&&gcdBig(BigInt(m[1]),BigInt(m[2]))===1n);}return true;}
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
// Append only: the first twenty positions are part of the saved-seed contract.
rows.push(
['ratio','Отношение чисел','Сравниваем делением; сохраняем порядок чисел.',['fraction-reduce']],
['scale','Масштаб','Сначала длина на местности в тех же единицах.',['decimal-multiply']],
['proportion','Неизвестный член пропорции','Перемножаем крест-накрест и делим на известный множитель.',['fraction-divide']],
['direct-proportion','Прямая пропорциональность','Сначала находим значение для одной единицы.',['decimal-divide']],
['inverse-proportion','Обратная пропорциональность','Произведение связанных величин остаётся постоянным.',['decimal-multiply']],
['proportional-parts','Деление в данном отношении','Считаем равные части и находим одну часть.',['fraction-divide']],
['signed-add','Сложение чисел со знаками','Сравниваем модули и определяем знак суммы.',['fraction-add']],
['signed-subtract','Вычитание чисел со знаками','Прибавляем число, противоположное вычитаемому.',['signed-add']],
['signed-multiply','Умножение чисел со знаками','Сначала знак, затем произведение модулей.',['fraction-multiply']],
['signed-divide','Деление чисел со знаками','Сначала знак, затем деление модулей.',['fraction-divide']],
['integer-compare','Сравнение целых чисел','Правее на координатной прямой — больше.',['signed-add']],
['absolute-value','Модуль числа','Находим расстояние от числа до нуля.',[]],
['number-base','Позиционная запись числа','Складываем значения цифр с учётом разрядов.',[]],
['linear-equation','Линейное уравнение','Выполняем одинаковые действия с обеими частями.',['signed-subtract','signed-divide']],
['like-terms','Подобные слагаемые','Складываем коэффициенты при одной буквенной части.',['signed-add']],
['angle-measure','Смежные углы','Два смежных угла вместе образуют развёрнутый угол.',['decimal-subtract']],
['unit-conversion','Единицы длины, площади и объёма','Учитываем, сколько малых единиц входит в большую.',['decimal-multiply','decimal-divide']],
['rectangle-area','Площадь прямоугольника','Умножаем длину на ширину в одинаковых единицах.',['decimal-multiply']],
['rectangular-volume','Объём прямоугольного параллелепипеда','Умножаем три измерения в одинаковых единицах.',['rectangle-area']],
['bracket-evaluate','Числовые выражения со скобками','Сначала действие в скобках, затем действие перед ними.',['signed-add','signed-subtract']],
['coefficient','Коэффициент произведения','Перемножаем все числовые множители.',['signed-multiply']],
['point-distance','Расстояние на координатной прямой','Расстояние равно модулю разности координат.',['absolute-value','signed-subtract']],
['triangle-angle','Третий угол треугольника','Из 180° вычитаем сумму двух известных углов.',['angle-measure']]
);
const skills=rows.map(r=>({id:r[0],title:r[1],description:r[2],prerequisites:r[3]}));
function generate(id,seed,level=1){
 const skill=skills.find(s=>s.id===id);if(!skill)throw Error('Unknown skill: '+id);if(!Number.isInteger(level)||level<1||level>3)throw Error('Level must be 1, 2 or 3');
 if(!Number.isSafeInteger(Number(seed)))throw Error('Seed must be a safe integer');const R=rng((Number(seed)>>>0)^((rows.findIndex(r=>r[0]===id)+1)*1009)^(level*7919));const pick=a=>a[R(0,a.length-1)];
 if(rows.findIndex(r=>r[0]===id)>=20)return generateContinuation(id,seed,level,R,pick,skill);
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
  const A=f(),B=D(),C=f(),product=operation('multiply',B.r,C),result=operation('add',A,product);task.prompt='Вычисли: '+format(A)+' + '+B.text+' · '+format(C)+'. Запиши число или дробь.';step('Запиши десятичный множитель '+B.text+' обыкновенной дробью.',B.r,'Одинаковая запись поможет выполнить умножение.');step('Сначала найди произведение '+format(B.r)+' · '+format(C)+'.',product,'Умножение выполняется раньше сложения.');step('Найди наименьший общий знаменатель для '+format(A)+' и '+format(product)+'.',lcm(A.d,product.d),'Сложить можно одинаковые доли.');task.answer=answer(result);task.calculation={op:'add-product',left:answer(A),right:answer(B.r),third:answer(C)};task.explanation='Сначала '+B.text+' · '+format(C)+' = '+format(product)+'. Затем '+format(A)+' + '+format(product)+' = '+format(result)+'.';
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
function generateContinuation(id,seed,level,R,pick,skill){
 const task={id:'skill-'+id+'-'+level+'-'+seed,title:skill.title,prompt:'',kind:'number',answer:'',steps:[],hint:skill.description,explanation:'',skills:[id],source:{type:'authored',reference:'Авторская тренировка по теме, не номер учебника'}};
 const step=(prompt,value,hint)=>task.steps.push({prompt,answer:answer(value),hint,explanation:hint});
 const done=(value,calculation,label)=>{task.answer=answer(value);task.calculation=calculation;task.finalLabel=label;};
 const bound=[20,100,500][level-1],op=operation;
 const signed=()=>must((pick([-1,1])*R(1,bound))+'/'+(level===1?1:level===2?10:pick([2,3,4,5,6,8,10])));
 const a=R(2,bound),b=R(2,bound);
 if(id==='ratio'){
  const common=R(2,9),A=a*common,B=b*common,g=gcd(A,B);
  task.prompt='Найди отношение '+A+' к '+B+'. Запиши несократимой дробью или целым числом.';
  step('Какое число будет знаменателем отношения?',B,'Делим первое число на второе.');
  step('Найди наибольший общий делитель '+A+' и '+B+'.',g,'Сокращаем числитель и знаменатель на один общий делитель.');
  done(op('divide',A,B),{op:'divide',left:String(A),right:String(B)},'Чему равно отношение? Запиши несократимую дробь или целое число.');task.answerFormat='reduced-fraction';
  task.explanation=A+' : '+B+' = '+format(task.answer)+'. Порядок чисел в отношении сохранён.';
 }else if(id==='scale'){
  const den=pick(level===1?[100,1000]:level===2?[500,2000,10000]:[2500,25000,50000]),cm=level===1?must(R(1,30)):must(R(11,199)+'/10'),realCm=op('multiply',cm,den),meters=op('divide',realCm,100);
  task.prompt='Масштаб плана 1 : '+den+'. Длина отрезка на плане '+decimal(cm)+' см. Какова длина на местности в метрах?';
  step('Скольким сантиметрам на местности соответствует 1 см на плане?',den,'В масштабе 1:'+den+' одна часть на плане соответствует '+den+' таким же частям на местности.');
  step('Найди длину на местности в сантиметрах.',realCm,'Умножь длину на плане на знаменатель масштаба.');
  done(meters,{op:'scale',left:answer(cm),right:String(den)},'Какова длина на местности? Введи число метров.');task.explanation=decimal(cm)+' · '+den+' = '+answer(realCm)+' см; делим на 100: '+format(meters)+' м.';
 }else if(id==='proportion'){
  const A=R(1,bound),B=R(2,bound),D=R(2,bound),product=A*D;
  task.prompt='Реши пропорцию: x/'+D+' = '+A+'/'+B+'.';
  step('Чему равно произведение известных чисел крест-накрест: '+A+' · '+D+'?',product,'Основное свойство: x · '+B+' = '+A+' · '+D+'.');
  step('На какое число нужно разделить обе части равенства '+B+'x = '+product+'?',B,'На коэффициент при x.');
  done(op('divide',product,B),{op:'proportion',left:String(A),right:String(B),third:String(D)},'Чему равен x? Введи число или дробь.');task.explanation='Крест-накрест: '+B+'x = '+product+'; x = '+format(task.answer)+'.';
 }else if(id==='direct-proportion'){
  const count=R(2,12),price=R(3,bound),newCount=R(13,35),total=count*price;
  task.prompt=count+' одинаковых тетрадей стоят '+total+' рублей. Сколько стоят '+newCount+' таких тетрадей при той же цене?';
  step('Найди цену одной тетради в рублях.',price,'Раздели общую стоимость на число тетрадей.');
  step('Сколько тетрадей нужно купить по условию?',newCount,'Используем новую величину количества.');
  done(price*newCount,{op:'direct',left:String(count),right:String(total),third:String(newCount)},'Какова стоимость покупки? Введи число рублей.');task.explanation=total+' : '+count+' · '+newCount+' = '+task.answer+' рублей.';
 }else if(id==='inverse-proportion'){
  const workers=R(2,12),hours=R(2,bound),newWorkers=R(13,30),work=workers*hours;
  task.prompt=workers+' рабочих с одинаковой производительностью выполняют работу за '+hours+' часов. За сколько часов её выполнят '+newWorkers+' рабочих при той же производительности каждого?';
  step('Найди произведение числа рабочих на время: '+workers+' · '+hours+'.',work,'Объём работы и производительность каждого не меняются.');
  step('На сколько рабочих теперь делится та же работа?',newWorkers,'Время нужно разделить между новым числом рабочих.');
  done(op('divide',work,newWorkers),{op:'inverse',left:String(workers),right:String(hours),third:String(newWorkers)},'Сколько часов потребуется? Введи число или дробь.');task.explanation=work+' : '+newWorkers+' = '+format(task.answer)+' ч. Рабочих больше, время меньше.';
 }else if(id==='proportional-parts'){
  const A=R(1,12),B=R(1,12),unit=R(2,bound),total=(A+B)*unit;
  task.prompt='Раздели '+total+' в отношении '+A+' : '+B+'. Найди первую часть.';
  step('Сколько равных долей вместе в двух частях?',A+B,'Сложи числа отношения.');
  step('Чему равна одна доля?',unit,'Раздели всё число на количество долей.');
  done(A*unit,{op:'parts',left:String(total),right:String(A),third:String(B)},'Чему равна первая часть? Введи число.');task.explanation=total+' : '+(A+B)+' · '+A+' = '+task.answer+'. Вторая часть равна '+B*unit+'.';
 }else if(id.startsWith('signed-')){
  const A=signed(),B=signed(),action=id.slice(7),operationName={add:'add',subtract:'subtract',multiply:'multiply',divide:'divide'}[action],sym={add:'+',subtract:'−',multiply:'·',divide:':'}[action],result=op(operationName,A,B);
  task.prompt='Вычисли: ('+format(A)+') '+sym+' ('+format(B)+').';
  if(action==='add'||action==='subtract'){
   const added=action==='subtract'?op('multiply',B,-1):B,den=lcm(A.d,added.d);
   step('Какое число прибавляем к '+format(A)+' после записи действия как сложения?',added,'При вычитании прибавляем противоположное число; при сложении второе слагаемое остаётся тем же.');
   step('Найди наименьший общий знаменатель для '+format(A)+' и '+format(added)+'.',den,'Одинаковые доли позволяют сложить числители со знаками.');
   step('Найди сумму числителей после приведения к знаменателю '+den+'.',A.n*(den/A.d)+added.n*(den/added.d),'Одинаковые знаки: складываем модули; разные: вычитаем меньший модуль из большего.');
  }else{
   const sign=Math.sign(A.n)*Math.sign(B.n),absA=must(Math.abs(A.n)+'/'+A.d),absB=must(Math.abs(B.n)+'/'+B.d);
   step('Запиши знак результата числом:1 для плюса или −1 для минуса.',sign,'Одинаковые знаки дают плюс, разные — минус.');
   step('Выполни действие только с модулями '+format(absA)+' и '+format(absB)+'.',op(operationName,absA,absB),'После вычисления модуля верни найденный знак.');
  }
  done(result,{op:operationName,left:answer(A),right:answer(B)},'Чему равно выражение? Введи число или дробь со знаком.');task.explanation='('+format(A)+') '+sym+' ('+format(B)+') = '+format(result)+'.';
 }else if(id==='absolute-value'){
  const A=signed(),abs=must(Math.abs(A.n)+'/'+A.d);
  task.prompt='Найди модуль числа '+format(A)+'.';
  step('Сколько единичных отрезков отделяет 0 от '+format(A)+'? Запиши неотрицательное число.',abs,'Расстояние не бывает отрицательным.');
  step('С каким числом сравнивают расстояние от точки до начала отсчёта: какое число находится в начале?',0,'Начало отсчёта имеет координату 0.');
  done(abs,{op:'abs',left:answer(A)},'Чему равен модуль? Введи неотрицательное число или дробь.');task.explanation='|'+format(A)+'| = '+format(abs)+'.';
 }else if(id==='integer-compare'){
  let A=R(-bound*3,bound*3),B=R(-bound*3,bound*3);if(B===A)B++;
  task.prompt='Какое число больше: '+A+' или '+B+'? Введи само большее число.';
  step('Вычисли разность первого и второго числа: '+A+' − ('+B+').',A-B,'Положительная разность означает, что первое число больше.');
  step('Запиши знак разности числом 1 или −1.',A>B?1:-1,'Это поможет выбрать точку правее на координатной прямой.');
  done(Math.max(A,B),{op:'maximum',left:String(A),right:String(B)},'Какое из двух чисел больше? Введи это число.');task.explanation=Math.max(A,B)+' расположено правее '+Math.min(A,B)+' и потому больше.';
 }else if(id==='number-base'){
  const base=pick(level===1?[2,3]:level===2?[4,5,6]:[7,8,9]),value=R(10,bound*5),digits=value.toString(base),first=Number(digits[0])*base**(digits.length-1);
  task.prompt='Переведи запись '+digits+' из системы счисления с основанием '+base+' в десятичную.';
  step('Чему равен вклад старшей цифры: '+digits[0]+' · '+base+'^'+(digits.length-1)+'?',first,'Вес разряда — степень основания.');
  step('Сложи вклады остальных цифр.',value-first,'У каждого следующего разряда степень основания на 1 меньше.');
  done(value,{op:'base-value',digits,base},'Какое десятичное число получилось? Введи целое число.');task.explanation=digits+' (основание '+base+') = '+value+' (основание 10).';task.answerFormat='integer';
 }else if(id==='linear-equation'){
  const A=pick([-1,1])*R(2,12),B=R(-bound,bound),X=signed(),C=op('add',op('multiply',A,X),B),remainder=op('subtract',C,B);
  task.prompt='Реши уравнение: '+A+'x '+(B<0?'− '+(-B):'+ '+B)+' = '+format(C)+'.';
  step('Вычти '+B+' из обеих частей. Чему равна правая часть?',remainder,'Из обеих частей вычитаем одно и то же число.');
  step('На какое число делим обе части, чтобы оставить x?',A,'Делим на коэффициент при x, он не равен нулю.');
  done(X,{op:'equation',left:String(A),right:String(B),third:answer(C)},'Чему равен корень уравнения x? Введи число или дробь.');task.explanation='После вычитания '+B+': '+A+'x = '+format(remainder)+'. Делим на '+A+': x = '+format(X)+'.';
 }else if(id==='like-terms'){
  const A=R(-bound,bound),B=R(-bound,bound),C=R(1,bound);
  task.prompt='Приведи подобные слагаемые: ('+A+')x + ('+B+')x − '+C+'x. Введи коэффициент при x.';
  step('Сложи коэффициенты первых двух слагаемых.',A+B,'Буквенная часть x одинакова.');
  step('Какой коэффициент у вычитаемого '+C+'x?',C,'Всё выражение становится ('+(A+B)+' − '+C+')x.');
  done(A+B-C,{op:'like-terms',left:String(A),right:String(B),third:String(C)},'Каков коэффициент при x после упрощения?');task.explanation='('+A+' + '+B+' − '+C+')x = '+(A+B-C)+'x.';
 }else if(id==='angle-measure'||id==='triangle-angle'){
  const A=R(1,178),B=id==='triangle-angle'?R(1,179-A):0,known=A+B;
  task.prompt=id==='angle-measure'?'Один из двух смежных углов равен '+A+'°. Найди другой угол.':'Два угла треугольника равны '+A+'° и '+B+'°. Найди третий угол.';
  step('Какова сумма '+(id==='angle-measure'?'двух смежных углов':'трёх углов треугольника')+' в градусах?',180,'В обоих случаях используем 180°.');
  step('Какова сумма известных углов в градусах?',known,'Сложи только данные углы.');
  done(180-known,{op:'remaining-angle',left:String(A),right:String(B)},'Сколько градусов в искомом угле? Введи число без знака°.');task.explanation='180° − '+known+'° = '+task.answer+'°.';
 }else if(id==='unit-conversion'){
  const unit=pick([['м','см',100],['см','мм',10],['м²','см²',10000],['дм³','см³',1000],['кг','г',1000]]),reverse=level===3&&R(0,1),given=R(1,bound)*(reverse?10:1),from=unit[reverse?1:0],to=unit[reverse?0:1],factor=unit[2],action=reverse?'divide':'multiply';
  task.prompt='Вырази '+given+' '+from+' в '+to+'.';
  step('Сколько '+unit[1]+' в 1 '+unit[0]+'?',factor,'Для площади и объёма коэффициент перехода применяется соответственно два или три раза.');
  step('Запиши исходное числовое значение в '+from+'.',given,reverse?'При переходе к большей единице число уменьшается.':'При переходе к меньшей единице число увеличивается.');
  done(op(action,given,factor),{op:action,left:String(given),right:String(factor)},'Каково значение в '+to+'? Введи число.');task.explanation=given+(reverse?' : ':' · ')+factor+' = '+format(task.answer)+' '+to+'.';
 }else if(id==='rectangle-area'||id==='rectangular-volume'){
  const A=must(a+'/'+(level===3?10:1)),B=must(b+'/'+(level===3?10:1)),C=R(2,bound),area=op('multiply',A,B);
  task.prompt=id==='rectangle-area'?'Стороны прямоугольника равны '+decimal(A)+' см и '+decimal(B)+' см. Найди его площадь.':'Измерения прямоугольного параллелепипеда: '+decimal(A)+' см, '+decimal(B)+' см и '+C+' см. Найди объём.';
  step('Какова длина в сантиметрах?',A,'Все измерения уже выражены в сантиметрах.');
  step('Найди площадь прямоугольного основания в см².',area,'Умножь длину на ширину.');
  const result=id==='rectangle-area'?area:op('multiply',area,C);
  done(result,id==='rectangle-area'?{op:'multiply',left:answer(A),right:answer(B)}:{op:'volume',left:answer(A),right:answer(B),third:String(C)},id==='rectangle-area'?'Какова площадь? Введи число квадратных сантиметров.':'Каков объём? Введи число кубических сантиметров.');task.explanation=decimal(A)+' · '+decimal(B)+(id==='rectangle-area'?'':' · '+C)+' = '+format(result)+(id==='rectangle-area'?' см².':' см³.');
 }else if(id==='bracket-evaluate'){
  const A=R(-bound,bound),B=R(-bound,bound),C=R(-bound,bound),inner=B-C;
  task.prompt='Вычисли: '+A+' − ('+B+' − ('+C+')).';
  step('Найди значение выражения в скобках: '+B+' − ('+C+').',inner,'Сначала выполняем действие внутри скобок.');
  step('Какое число прибавляем вместо вычитания результата в скобках?',-inner,'Вычитание заменяем прибавлением противоположного числа.');
  done(A-inner,{op:'bracket',left:String(A),right:String(B),third:String(C)},'Чему равно всё выражение?');task.explanation=A+' − ('+inner+') = '+(A-inner)+'.';
 }else if(id==='coefficient'){
  const A=pick([-1,1])*a,B=pick([-1,1])*b,C=R(2,12);
  task.prompt='Найди коэффициент произведения: ('+A+') · x · ('+B+') · y · '+C+'.';
  step('Перемножь первые два числовых множителя.',A*B,'Числовые множители можно собрать вместе.');
  step('Какой числовой множитель ещё нужно учесть?',C,'Буквенная часть будет xy.');
  done(A*B*C,{op:'volume',left:String(A),right:String(B),third:String(C)},'Какой коэффициент стоит при xy? Введи число со знаком.');task.explanation='('+A+' · '+B+' · '+C+')xy = '+(A*B*C)+'xy.';
 }else if(id==='point-distance'){
  const A=R(-bound*2,bound*2),B=R(-bound*2,bound*2),difference=A-B;
  task.prompt='На координатной прямой A('+A+'), B('+B+'). Найди расстояние AB в единичных отрезках.';
  step('Найди разность координат: '+A+' − ('+B+').',difference,'Разность может быть отрицательной; расстояние — нет.');
  step('Найди модуль этой разности.',Math.abs(difference),'Берём неотрицательную величину расстояния.');
  done(Math.abs(difference),{op:'distance',left:String(A),right:String(B)},'Чему равно расстояние AB? Введи неотрицательное число.');task.explanation='AB = |'+A+' − ('+B+')| = '+task.answer+'.';
 }else throw Error('Unknown continuation skill: '+id);
 if(task.steps.length<2||task.steps.length>5||!task.finalLabel)throw Error('Incomplete continuation practice');
 return task;
}
return {skills,generate,parse,equal,check,format,decimal,answer,operation};
});

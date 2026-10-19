(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ArithmeticFoundations=factory();})(typeof globalThis==='undefined'?this:globalThis,function(){
'use strict';
const stages=[
 ['add-basic','addition','Складываем в пределах десяти','Сначала уверенно складываем единицы.'],
 ['add-ten','addition','Дополняем до десяти','Разбиваем второе число и переходим через десяток.'],
 ['add-columns','addition','Складываем по разрядам','Единицы под единицами, десятки под десятками.'],
 ['add-carry','addition','Переносим десяток','Из суммы единиц выделяем новый десяток.'],
 ['add-chain','addition','Несколько переносов','Не теряем перенос в десятки, сотни и тысячи.'],
 ['add-check','addition','Проверяем сложение','Три новых примера без помощи — затем можно вернуться к делению.'],
 ['sub-basic','subtraction','Вычитаем в пределах десяти','Находим разность и проверяем сложением.'],
 ['sub-ten','subtraction','Вычитаем через десяток','Разбиваем вычитание на два удобных шага.'],
 ['sub-columns','subtraction','Вычитаем по разрядам','Начинаем с единиц справа.'],
 ['sub-borrow','subtraction','Занимаем один десяток','Меняем один десяток на десять единиц.'],
 ['sub-zeros','subtraction','Занимаем через нули','Передаём разряд через ноль и отмечаем все изменения.'],
 ['sub-check','subtraction','Проверяем вычитание','Три новых примера без помощи — затем можно вернуться к делению.']
].map(([id,branch,title,goal])=>Object.freeze({id,branch,title,goal}));
const places=['единиц','десятков','сотен','тысяч'];
function make(id,seed=1){
 const stage=stages.find(s=>s.id===id);if(!stage)throw Error('UNKNOWN_STAGE');
 let s=(seed>>>0)||1;const n=(lo,hi)=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return lo+s%(hi-lo+1);};
 const add=stage.branch==='addition';let a,b;
 switch(id){
 case 'add-basic':a=n(1,8);b=n(1,9-a);break;
 case 'add-ten':a=n(5,9);b=n(11-a,9);break;
 case 'add-columns':a=n(1,7)*10+n(0,5);b=n(1,9-Math.floor(a/10))*10+n(0,9-a%10);break;
 case 'add-carry':a=n(1,7)*10+n(5,9);b=n(1,8-Math.floor(a/10))*10+n(10-a%10,9);break;
 case 'add-chain':a=n(2,7)*100+n(6,9)*10+n(5,9);b=n(1,8-Math.floor(a/100))*100+n(10-Math.floor(a/10)%10,9)*10+n(10-a%10,9);break;
 case 'sub-basic':a=n(3,9);b=n(1,a-1);break;
 case 'sub-ten':a=n(11,17);b=n(a%10+1,9);break;
 case 'sub-columns':a=n(3,9)*10+n(2,9);b=n(1,Math.floor(a/10)-1)*10+n(0,a%10);break;
 case 'sub-borrow':a=n(3,9)*10+n(0,5);b=n(1,Math.floor(a/10)-1)*10+n(a%10+1,9);break;
 case 'sub-zeros':a=n(2,9)*100+n(0,3);b=n(1,8)*10+n(a%10+1,9);break;
 default:a=n(120,999);b=n(11,add?999:a-1);
 }
 const steps=[];const push=(prompt,answer,hint,record)=>steps.push({prompt,answer:String(answer),hint,record});
 const result=add?a+b:a-b,sign=add?'+':'−';
 if(id==='add-ten'){
  const gap=10-a;push('Сколько не хватает от '+a+' до 10?',gap,'Вспомни пару чисел, которая даёт десять.',a+' + '+gap+' = 10');
  push('Из '+b+' взяли '+gap+'. Сколько осталось?',b-gap,'Вычти взятую часть из второго числа.',b+' − '+gap+' = '+(b-gap));
  push('Теперь 10 + '+(b-gap)+' = ?',result,'К десятку прибавь оставшиеся единицы.','Ответ: '+result);
 }else if(id==='sub-ten'){
  push('Сколько надо вычесть из '+a+', чтобы получить 10?',a%10,'Посмотри на единицы первого числа.',a+' − '+a%10+' = 10');
  push('Из '+b+' уже вычли '+a%10+'. Сколько ещё вычесть?',b-a%10,'Найди оставшуюся часть вычитаемого.','Осталось вычесть '+(b-a%10));
  push('10 − '+(b-a%10)+' = ?',result,'Можно проверить: разность плюс вычитаемое равна десяти.','Ответ: '+result);
 }else if(id.endsWith('basic')){
  push(a+' '+sign+' '+b+' = ?',result,add?'Считай дальше от первого числа.':'Подбери число, которое вместе со вторым даст первое.','Ответ: '+result);
 }else if(add){
  let carry=0;const ad=String(a).split('').reverse().map(Number),bd=String(b).split('').reverse().map(Number);
  for(let i=0;i<Math.max(ad.length,bd.length);i++){
   const x=ad[i]||0,y=bd[i]||0,total=x+y+carry;
   push('Разряд '+places[i]+': '+x+' + '+y+(carry?' + '+carry+' (перенос)':'')+' = ?',total,'Сложи цифры этого разряда и не забудь перенос справа.',places[i]+': сумма '+total);
   if(total>=10){push('В сумме '+total+' какую цифру оставим в этом разряде?',total%10,'На месте остаётся цифра единиц этой суммы.','Пишем '+total%10);push('Сколько десятков этой суммы перенесём в следующий разряд?',1,'Десять единиц одного разряда составляют одну единицу следующего.','Переносим 1 в следующий разряд');}
   carry=Math.floor(total/10);
  }
  push('Собери весь ответ: '+a+' + '+b+' = ?',result,'Запиши полученные цифры по своим разрядам; последний перенос — слева.','Ответ: '+result);
 }else{
  const ad=String(a).split('').reverse().map(Number),bd=String(b).split('').reverse().map(Number);
  for(let i=0;i<ad.length;i++){
   const y=bd[i]||0;
   if(ad[i]<y){let j=i+1;while(ad[j]===0)j++;
    push('В разряде '+places[j]+' было '+ad[j]+'. Отдаём одну единицу этого разряда. Сколько осталось?',ad[j]-1,'Уменьши цифру на один. Один старший разряд обменяем на десять младших.',places[j]+': '+ad[j]+' → '+(ad[j]-1));ad[j]--;
    for(let k=j-1;k>i;k--){push('В разряд '+places[k]+' пришло 10. Одну передаём дальше. Сколько осталось?',9,'Из десяти убери один.',places[k]+': 0 → 9');ad[k]=9;}
    push('В разряде '+places[i]+' было '+ad[i]+'. Добавили 10. Сколько теперь?',ad[i]+10,'Обмененный старший разряд дал десять единиц текущего.',places[i]+': '+ad[i]+' → '+(ad[i]+10));ad[i]+=10;
   }
   push('Разряд '+places[i]+': '+ad[i]+' − '+y+' = ?',ad[i]-y,'Используй изменённую цифру верхнего числа после заимствования.',places[i]+': '+ad[i]+' − '+y+' = '+(ad[i]-y));
  }
  push('Собери весь ответ: '+a+' − '+b+' = ?',result,'Соедини цифры разности по разрядам. Нули в начале не нужны.','Ответ: '+result);
 }
 if(!add)push('Проверка сложением: '+result+' + '+b+' = ?',a,'Разность плюс вычитаемое должны дать исходное число.','Проверка: '+result+' + '+b+' = '+a);
 return {id,seed,a,b,sign,result,steps,stage};
}
return Object.freeze({stages,make});
});

(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ArithmeticFoundations=factory();})(typeof globalThis==='undefined'?this:globalThis,function(){
'use strict';
const stages=[
 ['add-basic','addition','Складываем в пределах десяти','Сначала уверенно складываем единицы.'],
 ['add-ten','addition','Дополняем до десяти','Разбиваем второе число и переходим через десяток.'],
 ['add-columns','addition','Складываем столбиком','Пишем числа друг под другом и начинаем справа.'],
 ['add-carry','addition','Пишем цифру, остальное в уме','Например: 6 пишем, 1 в уме.'],
 ['add-chain','addition','Держим в уме на каждом шаге','Прибавляем число в уме, пишем цифру и идём дальше.'],
 ['add-check','addition','Проверяем сложение','Три новых примера без помощи — затем можно вернуться к делению.'],
 ['sub-basic','subtraction','Вычитаем в пределах десяти','Находим разность и проверяем сложением.'],
 ['sub-ten','subtraction','Вычитаем через десяток','Разбиваем вычитание на два удобных шага.'],
 ['sub-columns','subtraction','Вычитаем столбиком','Пишем числа друг под другом и начинаем справа.'],
 ['sub-borrow','subtraction','Занимаем у цифры слева','Слева уменьшаем цифру на 1, справа прибавляем 10.'],
 ['sub-zeros','subtraction','Занимаем через нули','Занимаем через ноль и сразу записываем изменённые цифры.'],
 ['sub-check','subtraction','Проверяем вычитание','Три новых примера без помощи — затем можно вернуться к делению.']
].map(([id,branch,title,goal])=>Object.freeze({id,branch,title,goal}));

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
 const steps=[];const push=(prompt,answer,hint,record,effects={})=>steps.push({prompt,answer:String(answer),hint,record,effects});
 const result=add?a+b:a-b,sign=add?'+':'−';
 if(id==='add-ten'){
  const gap=10-a;push('Сколько не хватает от '+a+' до 10?',gap,'Вспомни пару чисел, которая даёт десять.',a+' + '+gap+' = 10');
  push('Из '+b+' взяли '+gap+'. Сколько осталось?',b-gap,'Вычти взятую часть из второго числа.',b+' − '+gap+' = '+(b-gap));
  push('Теперь 10 + '+(b-gap)+' = ?',result,'К десятку прибавь оставшиеся единицы.','Ответ: '+result,{result});
 }else if(id==='sub-ten'){
  push('Сколько надо вычесть из '+a+', чтобы получить 10?',a%10,'Посмотри на единицы первого числа.',a+' − '+a%10+' = 10');
  push('Из '+b+' уже вычли '+a%10+'. Сколько ещё вычесть?',b-a%10,'Найди оставшуюся часть вычитаемого.','Осталось вычесть '+(b-a%10));
  push('10 − '+(b-a%10)+' = ?',result,'Можно проверить: разность плюс вычитаемое равна десяти.','Ответ: '+result,{result});
 }else if(id.endsWith('basic')){
  push(a+' '+sign+' '+b+' = ?',result,add?'Считай дальше от первого числа.':'Подбери число, которое вместе со вторым даст первое.','Ответ: '+result,{result});
 }else if(add){
  let carry=0;const ad=String(a).split('').reverse().map(Number),bd=String(b).split('').reverse().map(Number);
  for(let i=0;i<Math.max(ad.length,bd.length);i++){
   const x=ad[i]||0,y=bd[i]||0,total=x+y+carry;
   push('Складываем: '+x+' + '+y+(carry?' + '+carry+' (в уме)':'')+' = ?',total,'Сложи эти цифры и прибавь число в уме, если оно есть.',x+' + '+y+(carry?' + '+carry+' (в уме)':'')+' = '+total,{memory:null,...(total<10?{write:{col:i,value:total}}:{})});
   if(total>=10){push('Получилось '+total+'. '+(i===0?'Какую цифру запишем крайней справа?':'Какую цифру запишем слева от предыдущей?'),total%10,'Пишем последнюю цифру полученного числа.',total%10+' пишем',{write:{col:i,value:total%10}});const last=i===Math.max(ad.length,bd.length)-1;push(total%10+' записали. Сколько в уме?',1,'Последнюю цифру уже записали. Слева от неё осталось число в уме.','1 в уме',{memory:{col:i+1,value:1},...(last?{write:{col:i+1,value:1}}:{})});}
   carry=Math.floor(total/10);
  }
  push('Собери весь ответ: '+a+' + '+b+' = ?',result,'Прочитай уже записанные цифры слева направо.','Ответ: '+result,{result});
 }else{
  const ad=String(a).split('').reverse().map(Number),bd=String(b).split('').reverse().map(Number);
  for(let i=0;i<ad.length;i++){
   const y=bd[i]||0;
   if(ad[i]<y){let j=i+1;while(ad[j]===0)j++;
    push('Занимаем у цифры '+ad[j]+' слева. Уменьшаем её на 1. Что запишем над ней?',ad[j]-1,'Вычти 1 из этой цифры.',ad[j]+' заменяем на '+(ad[j]-1),{regroup:{col:j,value:ad[j]-1}});ad[j]--;
    for(let k=j-1;k>i;k--){push('На месте нуля теперь 10. Одну заняли дальше справа. Что запишем над нулём?',9,'Из 10 вычти 1.','Над нулём пишем 9',{regroup:{col:k,value:9}});ad[k]=9;}
    push('К цифре '+ad[i]+' добавили 10. Что запишем над ней?',ad[i]+10,'Прибавь 10 к этой цифре.',ad[i]+' заменяем на '+(ad[i]+10),{regroup:{col:i,value:ad[i]+10}});ad[i]+=10;
   }
   push('Вычитаем: '+ad[i]+' − '+y+' = ?',ad[i]-y,'Если занимали слева, бери число, записанное сверху.',ad[i]+' − '+y+' = '+(ad[i]-y)+'. Пишем '+(ad[i]-y),{write:{col:i,value:ad[i]-y}});
  }
  push('Собери весь ответ: '+a+' − '+b+' = ?',result,'Прочитай уже записанные цифры слева направо. Нули в начале не нужны.','Ответ: '+result,{result});
 }
 if(!add)push('Проверка сложением: '+result+' + '+b+' = ?',a,'Разность плюс вычитаемое должны дать исходное число.','Проверка: '+result+' + '+b+' = '+a);
 return {id,seed,a,b,sign,result,steps,stage};
}
function written(task,count){
 const result={},regroup={};let memory=null;
 for(const step of task.steps.slice(0,Math.max(0,Math.min(task.steps.length,count)))){
  const e=step.effects||{};
  if(e.write)result[e.write.col]=String(e.write.value);
  if(e.regroup)regroup[e.regroup.col]=String(e.regroup.value);
  if(Object.hasOwn(e,'memory'))memory=e.memory;
  if(Object.hasOwn(e,'result')){for(const col of Object.keys(result))delete result[col];for(const [i,digit] of [...String(e.result)].reverse().entries())result[i]=digit;memory=null;}
 }
 return {result,regroup,memory};
}
return Object.freeze({stages,make,written});
});

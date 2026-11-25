/* Виленкин и соавт., 2023, часть 2, п. 25, с. 9, №5.15 и 5.16. */
(function(root){
  'use strict';
  const names=['а','б','в','г','д'];
  const lesson=(number,title,requires,explanation,worked,misconception,reflect)=>({
    number,key:'printed-'+number.replace('.','-'),part:2,point:25,page:9,title,requires:['v5f-printed-'+requires],related:[],explanation,worked,misconception,reflect
  });
  const lessons=[
    lesson('5.15','Пронеси число через пять действий','1-71','Каждый столбик — отдельная цепочка. Начни с верхней разности. Перенеси результат на следующую строку и выполни только действие у этой строки.',
      ['В другой цепочке начинаем с 31 − 27 и получаем 4.','Переход «умножь на 6» ведёт от 4 к 24. Затем «прибавь 8» ведёт к 32.','Обратная проверка последнего перехода даёт 32 − 8 = 24.'],
      'На каждой новой строке действие нужно выполнять с самым первым числом.','Как узнать, какое число вошло в третью строку?'),
    lesson('5.16','Сначала в несколько раз, потом на несколько единиц','5-15','Обведи слова «в … раз». Раздели целое на равные группы и возьми одну. В следующем действии слово «на» указывает, сколько единиц убрать из этой группы.',
      ['Начнём с 800. Уменьшение в 4 раза оставляет одну из четырёх равных групп, 200.','Теперь убираем 30 из этих 200 и получаем 170.','Возвращаем 30 и умножаем на 4. Получилось исходное число 800.'],
      'Уменьшить на 10 и уменьшить в 10 раз можно одним действием.','Какая из двух команд зависит от размера исходного целого?')
  ];
  const printed=[
    [24,19,8,12,17,5],[42,33,6,27,9,8],[57,49,7,14,28,7],
    [72,67,6,24,20,17],[66,59,7,17,38,4]
  ];
  function newRow(random){
    const gap=random(3,10),sub=random(12,70),factor=random(4,9),add=random(11,25),divisor=random(3,9);
    const product=gap*factor+add,answer=random(2,Math.floor((product-1)/divisor));
    return [gap+sub,sub,factor,add,product-answer*divisor,divisor];
  }
  const symbols=['−','×','+','−',':'];
  const hints=['Найди, сколько осталось после вычитания.','Собери равные группы. Проверь ответ делением.','Сложи с предыдущим результатом.','Уменьши результат предыдущей строки.','Сколько групп получится? Проверь деление умножением.'];
  function values(row){
    const [start,remove,factor,plus,minus,divide]=row,first=start-remove,second=first*factor,third=second+plus,fourth=third-minus;
    return [start,first,second,third,fourth,fourth/divide];
  }
  function expression(row,i){
    return values(row)[i]+' '+symbols[i]+' '+row[i+1];
  }
  function chains(seed,random,step){
    const rows=seed?names.map(()=>newRow(random)):printed.map(row=>row.slice());
    const targets=rows.flatMap((row,k)=>symbols.map((sign,i)=>{
      const results=values(row),a=results[i],b=row[i+1],ans=results[i+1];
      const other=i===0||i===3?a+b:i===1?a+b:i===2?a-b:a*b;
      return step(names[k]+'. Строка '+(i+1)+'. '+expression(row,i)+' = ?',ans,hints[i],
        other===ans?[]:[{value:other,text:'Посмотри на знак '+sign+' в выделенной строке. '+hints[i]}]);
    }));
    const result=targets.pop();
    return {...result,why:'Проверка последней строки умножением. '+result.answer+' × '+rows[4][5]+' = '+values(rows[4])[4]+'.',
      inputPrompt:'Результат строки',steps:targets,data:{smallChains:rows},conditionKey:'five-chains/'+rows.map(r=>r.join('-')).join('/')};
  }
  function decrease(seed,random,step){
    const divisor=seed?[2,4,5,10][random(0,3)]:10,part=seed?1000*random(4,45):100000,total=divisor*part,remove=seed?100*random(1,8):100;
    const target=part-remove;
    return {prompt:'Из полученной группы убери ещё '+remove+' единиц. Сколько останется?',inputPrompt:'Оставшееся число',answer:target,why:'Прибавь '+remove+' к остатку и умножь результат на '+divisor+'. Получится '+total+'.',
      errors:[{value:part+'/'+remove,text:'Здесь сказано «на». Нужно вычесть указанное количество из одной группы.'},{value:part,text:'Одна группа уже найдена. Осталось убрать из неё '+remove+'.'},{value:total-remove,text:'Это результат вычитания из всего числа. Сначала найди размер одной группы.'}],
      steps:[step('Всего '+total+'. Раздели на '+divisor+' равных групп. Сколько в одной?',part,'Уменьшить в несколько раз — разделить. Сколько вместе дадут '+divisor+' одинаковых групп?',
        [{value:total-divisor,text:'Это вычитание нескольких единиц. Здесь нужно разделить всё число на равные группы.'}])],
      data:{groupDecrease:{total,divisor,remove}},conditionKey:'decrease/'+[total,divisor,remove].join('/')};
  }
  function ladder(row,i){
    return '<ol style="padding-left:1.8em;text-align:left">'+symbols.map((symbol,j)=>'<li'+(j===i?' aria-current="step" style="font-weight:bold;color:#174e55"':'')+'>'+(j===0?row[0]:'Результат выше')+' '+symbol+' '+row[j+1]+(j===i?' ← сейчас':'')+'</li>').join('')+'</ol>';
  }
  function groups(n){
    const rects=Array.from({length:n},(_,i)=>'<rect x="'+(5+i*230/n)+'" y="9" width="'+(230/n-3)+'" height="25" rx="2" fill="'+(i===0?'#29715f':'#e1efea')+'" stroke="#264c53"/>').join('');
    return '<svg viewBox="0 0 240 40" style="display:block;width:100%;max-width:25rem" role="img" aria-label="Целое разделено на '+n+' равных групп. Выделена одна.">'+rects+'</svg>';
  }
  function taskDrawing(task,scene){
    if(task.data.smallChains){const all=task.data.smallChains,s=scene.mode==='learn'?Math.min(24,Math.max(0,Number(scene.step)||0)):24;return '<p>Столбик '+names[Math.floor(s/5)]+'</p>'+ladder(all[Math.floor(s/5)],s%5);}
    const x=task.data.groupDecrease;return '<p>Всего '+x.total+'. Одна закрашенная группа остаётся для второго действия.</p>'+groups(x.divisor)+'<p>Из неё убирают '+x.remove+' единиц.</p>';
  }
  function explore(task,state){
    if(task.data.smallChains){
      const row=task.data.smallChains[state.column],i=state.operation;
      return {title:'Проверь одну стрелку вычисления',controls:[{key:'column',title:'Столбик',values:names.map((n,j)=>[j,n])},{key:'operation',title:'Строка',values:symbols.map((n,j)=>[j,(j+1)+' ('+n+')'])}],
        visual:ladder(row,i),question:'Перед этой строкой получилось '+values(row)[i]+'. Выполни выделенное действие.',answer:values(row)[i+1],why:expression(row,i)+' = '+values(row)[i+1]+'.'};
    }
    const x=task.data.groupDecrease,divisor=[2,4,5,10][state.groupChoice],part=x.total/divisor,rem=state.hundreds*100;
    return {title:'От одной группы убери сотни',controls:[{key:'groupChoice',title:'Число равных групп',values:[[0,'2'],[1,'4'],[2,'5'],[3,'10']]},{key:'hundreds',title:'Сколько сотен убрать',min:0,max:8,step:1}],
      visual:'<p>Всего '+x.total+'</p>'+groups(divisor),question:'Из одной группы убрали '+rem+'. Сколько осталось?',answer:part-rem,why:x.total+' : '+divisor+' = '+part+'. '+part+' − '+rem+' = '+(part-rem)+'.'};
  }
  const api={lessons,generators:{'5.15':chains,'5.16':decrease},bounds:{'5.15':{column:[0,4,0],operation:[0,4,0]},'5.16':{groupChoice:[0,3,3],hundreds:[0,8,1]}},taskDrawing,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5SmallChains=api;
})(typeof window!=='undefined'?window:globalThis);

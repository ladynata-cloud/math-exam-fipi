/* Виленкин и соавторы, 5 класс, часть 2, 2023, §25, печатная с. 11, №5.35–5.36. */
(function (root) {
  'use strict';
  const lessons = [
    {number:'5.35', key:'printed-5-35', part:2, point:25, page:11, title:'Найди все делители при заданном частном',
      requires:['v5f-remainder-find'], related:[], explanation:'Представь одинаковые коробки. Если частное равно девяти, девять коробок должны заполниться, а десятая целиком уже не заполняется. Увеличивая размер коробки по единице, проверь, где выполняются оба условия.',
      worked:['Пусть 102 фишки дали четыре полные коробки. При вместимости 20 фишек заполнилось бы пять коробок. При вместимости 26 фишек заполнились бы только три.','Значит, подходят все целые вместимости от 21 до 25. Например, при вместимости 24 останется 102 − 4 · 24 = 6 фишек.','Проверка деления с остатком: 0 ≤ остаток < делитель.'],
      misconception:'Если нашли одну подходящую вместимость коробки, других быть не может.', reflect:'Как доказать, что ты проверил все возможные делители?'},
    {number:'5.36', key:'printed-5-36', part:2, point:25, page:11, title:'Посчитай кубики слоями в четырёх телах',
      requires:['v5f-volume-litres'], related:[], explanation:'Посмотри на верхнюю грань. Ряд кубиков идёт по переднему ребру, а следующие ряды уходят вглубь. В каждом горизонтальном слое столько же кубиков, сколько в верхнем. Высота подсказывает число слоёв.',
      worked:['У коробки 3 кубика в ряду и 2 ряда в глубину. Один слой состоит из 6 кубиков.','Если в высоту 4 таких слоя, всего 24 кубика. Кубики внутри тоже занимают место.','При объёме одного кубика 1 мм³ объём коробки составит 24 мм³.'],
      misconception:'Чтобы узнать объём, достаточно сосчитать квадраты на видимых гранях.', reflect:'Что на рисунке помогает посчитать кубики, которых не видно?'}
  ];
  const letters=['а','б','в','г'];
  function divisorRange(n,q) {
    const first=Math.floor(n/(q+1))+1,last=Math.floor(n/q);
    return Array.from({length:last-first+1},(_,i)=>first+i);
  }
  function division(seed,rand,step) {
    const q=seed?rand(6,12):9;
    let n=seed?rand(2*q*q+1,3*q*q):222;
    if(seed)while(divisorRange(n,q).some(d=>n%d===0))n++;
    const ds=divisorRange(n,q),first=ds[0],last=ds[ds.length-1],remainders=ds.map(d=>n-q*d);
    const all=ds.flatMap((d,i)=>[d,remainders[i]]);
    return {steps:[
      step('Разложи '+n+' фишек по коробкам. Должны наполниться ровно '+q+'. Какова наименьшая целая вместимость, при которой коробка №'+(q+1)+' уже не заполнится?',first,'Нужна вместимость, для которой '+(q+1)+' коробок потребовали бы больше '+n+' фишек.',[{value:first-1,text:'При такой вместимости заполнится и коробка №'+(q+1)+'. Увеличь вместимость на одну.'}]),
      step('Какова наибольшая вместимость, при которой ещё можно заполнить '+q+' коробок?',last,'Раздели '+n+' на '+q+' и возьми целую часть.',[{value:last+1,text:'Такая вместимость слишком большая — фишек на последнюю целую коробку не хватит.'}]),
      {...step('Теперь для каждого делителя от '+first+' до '+last+' найди остаток. Запиши остатки по порядку через точку с запятой.',remainders,'Для каждого размера вычти из '+n+' количество фишек в '+q+' полных коробках.',[{value:ds,text:'Это вместимости коробок. Запиши фишки, которые останутся снаружи.'}]),answerFormat:'v5-list'}],
      prompt:'Какие делители дают неполное частное '+q+' при делении '+n+' и сколько остаётся в каждом случае? Перечисли пары по возрастанию делителя: делитель; остаток; следующий делитель; остаток.',
      answer:all,answerFormat:'v5-list',inputPrompt:'Делители и их остатки',errors:[{value:ds,text:'Делители найдены. После каждого впиши его остаток.'},{value:remainders,text:'Остатки найдены. Перед каждым укажи его делитель.'}],
      why:ds.map((d,i)=>n+' = '+q+' · '+d+' + '+remainders[i]).join('. ')+'. Для соседних делителей частное изменится.',
      data:{fixedQuotient:{n,q,first,last}},conditionKey:'quotient/'+n+'/'+q};
  }
  function grouping(n,q,d,showRemainder) {
    const count=Math.floor(n/d),rest=n%d,scale=280/Math.max(n,(q+1)*d);
    let marks='';
    for(let i=0;i<count;i++)marks+='<rect x="'+(5+i*d*scale)+'" y="8" width="'+Math.max(1,d*scale-1)+'" height="19" rx="2" fill="#245c78"/>';
    if(rest)marks+='<rect x="'+(5+count*d*scale)+'" y="8" width="'+rest*scale+'" height="19" fill="#df9656"/>';
    return '<figure style="margin:.5em 0"><svg viewBox="0 0 292 36" role="img" aria-label="Полные порции и отдельный остаток" style="display:block;width:100%;max-width:24rem">'+marks+'</svg><figcaption>Одна синяя полоска — '+d+' фишек. Всего '+n+' фишек. '+(showRemainder?'Оранжевый отрезок показывает остаток.':'Сколько синих полосок поместилось целиком?')+'</figcaption></figure>';
  }
  function boxes(seed,r,step) {
    const solids=seed?Array.from({length:4},()=>[r(1,9),r(2,10),r(1,9)]):[[2,6,2],[1,10,10],[10,10,10],[7,10,10]];
    const steps=[];
    solids.forEach(([w,h,d],i)=>{
      steps.push(step('Фигура '+letters[i]+'. Сколько кубиков в одном горизонтальном слое? Посчитай ряды на верхней грани.',w*d,'Перемножь число кубиков вдоль переднего ребра и число рядов в глубину.',w*d!==w*h?[{value:w*h,text:'Ты посчитал переднюю стенку. В горизонтальном слое нужны ширина и глубина.'}]:[]));
      if(i<3)steps.push(step('Фигура '+letters[i]+'. Каков объём в мм³, если объём одного кубика 1 мм³?',w*h*d,'Умножь число кубиков в слое на число слоёв по высоте.',[{value:w*d,text:'Это один слой. Посчитай, сколько таких слоёв стоит один на другом.'}]));
    });
    const [w,h,d]=solids[3];
    return {steps,prompt:'Фигура г. Определи объём всего тела в мм³. Объём каждого маленького кубика 1 мм³.',answer:w*h*d,inputPrompt:'Объём в мм³',errors:[{value:w*d,text:'Получился один слой. Учитывай все слои, в том числе скрытые.'}],why:'В одном слое '+w+' · '+d+' = '+w*d+' кубиков. Объём '+w*d+' · '+h+' = '+w*h*d+' мм³.',data:{layerSolids:solids},conditionKey:'layers/'+solids.join('/')};
  }
  function drawBox(shape,level) {
    const [w,h,d]=shape;
    const size=Math.min(235/(w+.45*d),132/(h+.32*d)),x=16,y=12+size*(h+.32*d);
    const point=(a,b,c)=>[+(x+size*(a+.45*b)).toFixed(2),+(y-size*(c+.32*b)).toFixed(2)];
    const pts=arr=>arr.map(v=>point(...v).join(',')).join(' ');
    const face=(points,color)=>'<polygon points="'+pts(points)+'" fill="'+color+'"/>';
    const line=(a,b)=>'<polyline points="'+pts([a,b])+'" fill="none" stroke="#344d56" stroke-width="1.05" stroke-linecap="round"/>';
    let svg=face([[0,0,0],[w,0,0],[w,0,h],[0,0,h]],'#f6dfaa')+face([[w,0,0],[w,d,0],[w,d,h],[w,0,h]],'#d6c296')+face([[0,0,h],[w,0,h],[w,d,h],[0,d,h]],'#85c7c5');
    if(level>0)svg+=face([[0,0,level-1],[w,0,level-1],[w,0,level],[0,0,level]],'#66b5b4')+face([[w,0,level-1],[w,d,level-1],[w,d,level],[w,0,level]],'#4e9b9d');
    for(let i=0;i<=w;i++)svg+=line([i,0,0],[i,0,h])+line([i,0,h],[i,d,h]);
    for(let j=0;j<=d;j++)svg+=line([0,j,h],[w,j,h])+line([w,j,0],[w,j,h]);
    for(let k=0;k<=h;k++)svg+=line([0,0,k],[w,0,k])+line([w,0,k],[w,d,k]);
    return '<figure style="margin:.5em 0"><svg role="img" aria-label="Тело из единичных кубиков: '+w+' в ширину, '+d+' в глубину, '+h+' в высоту" viewBox="0 0 '+Math.ceil(size*(w+.45*d)+32)+' '+Math.ceil(size*(h+.32*d)+24)+'" style="display:block;width:auto;max-width:100%;height:9rem">'+svg+'</svg><figcaption>Верхняя грань выделена цветом.'+(level?' Отмечен слой №'+level+' снизу.':'')+'</figcaption></figure>';
  }
  function taskDrawing(t,s){
    if(t.data.fixedQuotient){const {n,q,first}=t.data.fixedQuotient;return grouping(n,q,first-1,false);}
    const i=s?.mode==='learn'?s.step:t.steps.length,j=Math.min(3,Math.floor(i/2));
    return drawBox(t.data.layerSolids[j],i%2?1:0);
  }
  function explore(t,s){
    if(t.data.fixedQuotient){
      const {n,q,first}=t.data.fixedQuotient,d=first+s.offset-2;
      return {title:'Подбери размер полной коробки',controls:[{key:'offset',title:'Вместимость коробки',values:[0,1,2,3,4,5,6].map(k=>[k,String(first+k-2)])},{key:'measure',title:'Что считать',values:[[0,'Полные коробки'],[1,'Остаток фишек']]}],visual:grouping(n,q,d,true),question:s.measure?'Сколько фишек останется вне полных коробок?':'Сколько коробок получится заполнить целиком?',answer:s.measure?n%d:Math.floor(n/d),why:n+' = '+d+' · '+Math.floor(n/d)+' + '+n%d+'. Остаток меньше вместимости коробки.'};
    }
    const [w,h,d]=t.data.layerSolids[s.solid],level=s.measure===0?[1,Math.ceil(h/2),h][s.layer]:0;
    return {title:'Сосчитай один слой и всё тело',controls:[{key:'solid',title:'Фигура',values:letters.map((l,i)=>[i,l])},{key:'measure',title:'Что считать',values:[[0,'Один слой'],[1,'Всё тело']]},...(s.measure===0?[{key:'layer',title:'Отметь слой',values:[[0,'Нижний'],[1,'Средний снизу'],[2,'Верхний']]}]:[])],visual:drawBox([w,h,d],level),question:s.measure?'Сколько кубиков в теле целиком?':'Сколько кубиков в отмеченном слое?',answer:s.measure?w*h*d:w*d,why:'В слое '+w+' · '+d+' кубиков. Таких слоёв '+h+'.'};
  }
  const api={lessons,generators:{'5.35':division,'5.36':boxes},bounds:{'5.35':{offset:[0,6,2],measure:[0,1,0]},'5.36':{solid:[0,3,0],measure:[0,1,0],layer:[0,2,0]}},taskDrawing,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5GroupsAndLayers=api;
})(typeof window!=='undefined'?window:globalThis);

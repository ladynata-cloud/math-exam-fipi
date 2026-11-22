/* Vilenkin 5, first volume, point 5. Coordinate constructions on pages 29–30. */
(function(root){
  'use strict';
  const descriptions=[
    ['1.135',29,'Раздели отрезок на равные промежутки','Нулевая отметка уже стоит на левом конце. Чтобы найти единичный шаг, длину всей шкалы в клетках раздели на число промежутков между подписями концов.','Если между 0 и 6 помещается 18 клеток, одному шагу соответствуют 3 клетки. Метка 4 находится в 12 клетках от нуля.'],
    ['1.136',29,'Расставь числа на координатной прямой','Выбери начало и положительное направление. Один и тот же единичный отрезок откладывается каждый раз. Считай промежутки между штрихами.','Если единица занимает одну клетку, отметки 3 и 8 удалены друг от друга на пять клеток. Ноль ставится у начального штриха.'],
    ['1.137',30,'Поставь именованные точки в двух масштабах','Буква именует точку, число в скобках задаёт её координату. Умножь координату на длину единичного отрезка. Ответ запиши в тех единицах длины, которые заданы для этого рисунка.','При масштабе 12 мм на единицу точка A(3) находится в 36 мм от начала. Если масштаб заменить двумя клетками, расстояние до A равно шести клеткам.']
  ];
  const lessons=descriptions.map(([number,page,title,explanation,example])=>({
    number,page,title,explanation,worked:[example],part:1,point:5,key:'printed-'+number.replace('.','-'),
    misconception:'Для положения точки достаточно сосчитать штрихи вместе с начальным.',
    reflect:'Как убедиться, что найденное расстояние соответствует заданной координате и единичному отрезку?',
    requires:['v5f-printed-1-128'],related:['v5f-printed-1-83']
  }));
  const list=(step,prompt,answer,why,errors)=>({...step(prompt,answer,why,errors),answerFormat:'v5-list'});
  function locationErrors(g){
    const mistakes=[{value:toPositions(g).map(v=>v+1),text:'Начальный штрих соответствует нулю. Первый промежуток начинается только после него.'}];
    if(g.step!==1)mistakes.push({value:g.coords,text:'Ты записал координаты. Каждой единице соответствует '+g.step+' '+g.unit+' Умножь каждую координату на этот масштаб.'});
    return mistakes;
  }
  const rows=(labels,coords)=>coords.map((v,i)=>[labels?labels[i]:'Метка '+(i+1),String(v)]);
  const spaces=coords=>coords.slice(1).map((v,i)=>v-coords[i]);
  function shifted(coords,amount){return coords.map(v=>v===0?0:v+amount);}
  const units=group=>group.unit==='мм'?'миллиметрах':'клетках';
  const toPositions=group=>group.coords.map(v=>v*group.step);
  function makeScale(seed,random,step){
    const size=seed?random(2,5):2,limit=seed?random(12,18):14;
    const coords=seed?[1,3,4,6,9,11].map(x=>x+random(0,1)):[5,8,9,10,11,13];
    if(seed)for(let i=1;i<coords.length;i++)coords[i]=Math.max(coords[i],coords[i-1]+1);
    const group={step:size,unit:'кл.',coords,limit},length=size*limit;
    const steps=[
      step('Между O(0) и K('+limit+') всего '+length+' клеток. Сколько клеток от одного целого числа до следующего?',size,'Раздели длину отрезка на число единичных промежутков.',[{value:limit+1,text:'Ты посчитал штрихи вместе с начальным. Делить нужно на число промежутков.'},{value:limit,text:'Это число промежутков на всей шкале. Раздели на него длину OK.'}]),
      step('В скольких клетках от O поставить первую метку '+coords[0]+'?',coords[0]*size,'Координата показывает число единичных шагов, каждый из которых занимает '+size+' клетки.',[{value:coords[0],text:'Указана координата. От нуля до каждого следующего числа больше одной клетки.'}])
    ];
    return {prefix:'Начерти горизонтальный отрезок OK в '+length+' клеток. У O подпиши 0, у K — '+limit+'. ',prompt:'Раздели OK на равные единичные отрезки. Отметь '+coords.join(', ')+'. Запиши расстояния от O в клетках в этом же порядке.',inputPrompt:'Шесть расстояний в клетках через точку с запятой',answer:toPositions(group),answerFormat:'v5-list',steps,errors:locationErrors(group),conditionKey:[limit,size,...coords].join('/'),data:{coordinateConstruction:[group]},table:{caption:'Числа для разметки отрезка OK',headers:['Метка','Координата'],rows:rows(null,coords)}};
  }
  function numbers(seed,random,step){
    const size=seed?random(1,3):1,shift=seed?random(1,3):0;
    const groups=[[0,4,8,12,16,20,24],[1,5,10,15,20,25]].map(coords=>({step:size,unit:'кл.',coords:shifted(coords,shift)}));
    const steps=groups.map((g,i)=>list(step,'На прямой '+('аб'[i])+', начиная от 0, отметь '+g.coords.join(', ')+'. На каких расстояниях в клетках от нуля они стоят?',toPositions(g),'Умножай каждую координату на '+size+'. У нуля расстояние нулевое.',locationErrors(g)));
    const g=groups[1],intervals=spaces(toPositions(g));
    return {prefix:'Начерти две прямые. Прими '+size+' кл. за единичный отрезок. ',prompt:'На второй прямой поставь числа '+g.coords.join(', ')+'. Сколько клеток между соседними метками по порядку слева направо?',inputPrompt:'Пять длин промежутков в клетках',answer:intervals,answerFormat:'v5-list',steps,errors:[{value:toPositions(g).slice(1),text:'Это расстояния от нуля. Для каждой соседней пары вычитай положение левой метки из положения правой.'},{value:intervals.map(v=>v+1),text:'У двух соседних делений два края, но один промежуток. Считай промежутки между метками.'}],conditionKey:[size,shift].join('/'),data:{coordinateConstruction:groups},table:{caption:'Что отметить на каждой прямой',headers:['Рисунок','Координаты слева направо'],rows:groups.map((a,i)=>['аб'[i],a.coords.join(', ')])}};
  }
  function named(seed,random,step){
    const groups=[{labels:'OJMR',coords:shifted([0,1,5,7],seed?random(1,3):0),step:seed?random(2,5):2,unit:'кл.'},{labels:'PLDZ',coords:shifted([0,1,7,8],seed?random(1,3):0),step:seed?random(8,19):15,unit:'мм'}];
    const annotate=g=>g.coords.map((v,i)=>g.labels[i]+'('+v+')').join(', ');
    const steps=groups.map((g,i)=>list(step,'Построй '+('аб'[i])+'. '+annotate(g)+'. В единичном отрезке '+g.step+' '+g.unit+' Запиши расстояния от начальной точки до всех четырёх точек в '+units(g)+'.',toPositions(g),'Координату каждой точки умножь на длину единичного отрезка этого рисунка.',locationErrors(g)));
    const b=groups[1],answer=(b.coords[3]-b.coords[2])*b.step;
    return {prefix:'Начерти для каждого подпункта свою прямую. ',prompt:'На прямой б поставь '+annotate(b)+'. Единица равна '+b.step+' мм. Какова длина отрезка DZ в миллиметрах?',inputPrompt:'Расстояние в миллиметрах',answer,errors:[{value:b.coords[3]*b.step,text:'Ты измерил расстояние от начала до Z. Для DZ вычти расстояние до D.'},{value:b.coords[3]-b.coords[2],text:'Это длина в единичных отрезках. Переведи её в миллиметры.'}],steps,conditionKey:groups.map(g=>[g.step,...g.coords].join('/')).join(':'),data:{coordinateConstruction:groups},table:{caption:'Имена точек и единичный отрезок',headers:['Рисунок','Точки и масштаб'],rows:groups.map((g,i)=>['аб'[i],annotate(g)+' · 1 ед. = '+g.step+' '+g.unit])}};
  }
  function selection(task,state){
    const groups=task.data.coordinateConstruction;
    if(task.data.number==='1.136'){
      const choices=groups.flatMap((group,index)=>group.coords.map((coordinate,k)=>({group,k,label:'аб'[index]+' · '+coordinate})));
      const {group,k}=choices[state.target??1];
      return {g:group,k,controls:[{key:'target',title:'Прямая и метка',values:choices.map((item,i)=>[i,item.label])}]};
    }
    const g=groups[state.group||0],k=state.target??(g.labels?1:0),controls=[];
    if(groups.length>1)controls.push({key:'group',title:'Прямая',values:groups.map((_,i)=>[i,'аб'[i]])});
    controls.push({key:'target',title:'Метка',values:g.coords.map((v,i)=>[i,g.labels?g.labels[i]+'('+v+')':String(v)])});
    return {g,k,controls};
  }
  function diagram(task,state={}){
    const {g,k:tick}=selection(task,state),maximum=g.limit||Math.max(1,...g.coords),n=g.coords[tick];
    const x=v=>20+244*v/maximum,marks=Array.from({length:maximum+1},(_,i)=>'<path d="M'+x(i)+' 48v'+(i===0||i===maximum?'11':'6')+'" stroke="#375b69"/>').join('');
    const endpoints='Ось в единичных отрезках. Отметка '+(g.labels?g.labels[tick]+' ':'')+'с координатой '+n+'. Один отрезок равен '+g.step+' '+g.unit;
    const unitMarks=Array.from({length:g.step+1},(_,i)=>'<path d="M'+(28+152*i/g.step)+' 111v'+(i===0||i===g.step?'10':'5')+'" stroke="#375b69"/>').join('');
    return '<svg viewBox="0 0 294 136" preserveAspectRatio="xMidYMid meet" role="img" aria-label="'+endpoints+'"><path d="M12 48h268m-7-4 7 4-7 4" fill="none" stroke="#16475a" stroke-width="2"/>'+marks+'<circle cx="'+x(n)+'" cy="48" r="4" fill="#ac3c29"/><text x="'+x(n)+'" y="33" text-anchor="middle" style="font:16px sans-serif">'+(g.labels?g.labels[tick]+'('+n+')':n)+'</text><text x="20" y="73" text-anchor="middle" style="font:15px sans-serif">'+(g.limit?'O(0)':'0')+'</text><text x="264" y="73" text-anchor="middle" style="font:15px sans-serif">'+(g.limit?'K('+maximum+')':maximum)+'</text><text x="20" y="98" style="font:15px sans-serif">Один единичный отрезок крупно</text><path d="M28 111h152" stroke="#16475a" stroke-width="2"/>'+unitMarks+'<text x="191" y="117" style="font:15px sans-serif">'+g.step+' '+g.unit+'</text></svg>';
  }
  function explore(lesson,s,t){
    const {g,k,controls}=selection(t,s),n=g.coords[k];
    return {title:'Отмерь путь по шкале',controls,visual:diagram(t,s),question:'Единица равна '+g.step+' '+g.unit+' На каком расстоянии в '+units(g)+' от нуля стоит выделенная метка?',answer:n*g.step,why:'Сосчитай '+n+' промежутков от нуля. В каждом '+g.step+' '+g.unit+' Проверь произведение '+n+' × '+g.step+'.'};
  }
  const generators={'1.135':makeScale,'1.136':numbers,'1.137':named};
  const bounds={'1.135':{target:[0,5,0]},'1.136':{target:[0,12,1]},'1.137':{group:[0,1,0],target:[0,3,1]}};
  const api={lessons,generators,bounds,diagram,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5CoordinateConstruction=api;
})(typeof window!=='undefined'?window:globalThis);

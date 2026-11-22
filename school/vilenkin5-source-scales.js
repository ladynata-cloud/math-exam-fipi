/* First four source exercises in point 5: thermometer scales, an arc and a comparative height diagram. */
(function(root){
  'use strict';
  const lessons=[
    ['1.126','Считай уровень четырёх термометров','На каждом термометре одно малое деление равно одному градусу. Прочти метку у верхнего края столбика. Для каждого нового подпункта снова бери исходный уровень. Только в последнем подпункте два изменения следуют одно за другим.','От 18 градусов вверх на 4 и затем вниз на 3 — это сначала 22, затем 19 градусов.','Каждый подпункт начинается с результата предыдущего подпункта.'],
    ['1.127','Цена деления и изменение температуры','Одно деление показывает изменение на два градуса. Сначала учти направление и число делений, затем умножь перемещение на цену деления. Здесь нужно изменение температуры, а не её конечное значение.','Два деления вниз и пять вверх дают три деления вверх. При цене 2 °C это повышение на 6 °C.','При изменении на пять делений температура всегда меняется на пять градусов.'],
    ['1.128','Читаем дуговую шкалу','Сначала найди конец шкалы с меньшим значением. Раздели разность крайних показаний на число промежутков. Затем от начального значения двигайся по дуге к выбранной букве и добавляй цену каждого пройденного промежутка.','Между 10 и 16 три равных промежутка: промежуточные метки соответствуют 12 и 14.','Для цены деления надо разделить разность показаний на число всех штрихов, включая оба конца.'],
    ['1.129','Сравни высоты объектов на диаграмме','Все объекты начинаются у общей нулевой линии. Сравнивай высоту верхней точки объекта с верхней точкой выбранного ориентира. Число объектов выше ориентира и ниже него вместе с самим ориентиром даёт число всех объектов.','Если верх башни ниже верхушки дерева, но выше крыши дома, дерево выше башни, дом ниже.','Ширина условного изображения определяет, какой объект выше.']
  ].map(([number,title,explanation,example,misconception])=>({number,title,key:'printed-'+number.replace('.','-'),explanation,worked:[example],misconception,reflect:'Какой ориентир на шкале позволил проверить ответ?',part:1,point:5,page:number==='1.126'?28:29,requires:['v5f-printed-1-109'],related:['v5f-printed-1-108']}));
  const opt=(key,title,values)=>({key,title,values:values.map((word,i)=>[i,word])}),err=(value,text)=>({value,text});
  const asStep=(step,prompt,ans,why,errors=[])=>({...step(prompt,ans,why,errors),answerFormat:'v5-list'});
  const summary=delta=>delta.map(x=>(x>0?'↑ ':'↓ ')+Math.abs(x)).join(', затем ');
  function thermometers(seed,r,step){
    const levels=seed?[r(15,26),r(20,28),r(9,16),r(29,36)]:[26,25,10,34];
    const up=seed?r(4,8):7,down=seed?r(2,4):2,mild=seed?r(2,6):4,fall=seed?r(5,8):7,last=seed?r(1,up-1):5;
    const deltas=[[up],[-down],[mild],[-fall],[up,-last]],adjust=(change)=>levels.map(x=>x+change.reduce((s,v)=>s+v,0));
    const steps=[asStep(step,'Прочитай четыре исходных температуры слева направо. Введи четыре целых числа через точку с запятой.',levels,'Следи за верхним краем каждого красного столбика. Между соседними длинными отметками десять малых делений.')];
    deltas.forEach((d,i)=>steps.push(asStep(step,'абвгд'[i]+'. Для каждого из четырёх исходных термометров сдвиг в делениях: '+summary(d)+'. Каковы четыре новых показания слева направо?',adjust(d),'Каждый подпункт начинается с исходного ряда. Изменения внутри текущей строки выполняй последовательно.',[err(levels,'Записаны исходные показания. Теперь сдвинь каждый столбик по стрелке этой строки.')])));
    if(!seed){
      // The top of the fourth column in the supplied print scan lies between two adjacent marks.
      for(const question of steps){
        const [first,second,third,fourth]=question.answer;
        question.printedThermometerAlternative=[first,second,third,fourth+1];
      }
      steps[0].prompt+=' У четвёртого столбика в бумажной книге округли размытый верхний край до ближайшей риски. В следующих подпунктах считай от выбранного показания.';
    }
    const final=adjust(deltas[4]);
    return {prefix:seed?'Новые авторские шкалы. ':'В авторской модели риски точные. У четвёртого столбика на печатном рисунке верхний край размыт. ',prompt:'На сколько градусов после обоих действий пункта д изменилось показание каждого термометра? Повышение запиши положительным числом.',inputPrompt:'Общее изменение, °C',answer:final[0]-levels[0],steps,errors:[err(up+last,'Второе движение направлено вниз. Оно частично отменяет первое.')],data:{thermo:{levels,deltas}},table:{caption:'Направление движения столбиков',headers:['№','Деления'],rows:deltas.map((d,i)=>['абвгд'[i],summary(d)])},conditionKey:[...levels,...deltas.flat()].join('/')};
  }
  function signedMoves(seed,r,step){
    const size=seed?r(2,4):2,moves=seed?[[-r(2,5)],[r(3,7)],[-r(6,9)],[r(4,8)],[r(6,9),-r(2,5)],[-r(2,4),r(5,8)]]:[[-2],[5],[-9],[6],[8,-6],[-3,5]],total=moves.map(xs=>xs.reduce((a,b)=>a+b,0)*size);
    const steps=moves.map((a,i)=>{const net=a.reduce((x,y)=>x+y,0);return step('абвгде'[i]+'. '+summary(a)+'. Изменение температуры в градусах? Повышение положительно, понижение обозначь минусом.',total[i],'Учитывай направление стрелок. Умножь суммарное число делений со знаком на '+size+'.',[err(net,'Это перемещение в делениях. Каждое из них соответствует '+size+' градусам.'),err(-total[i],'Размер изменения найден. Проверь направление последнего результата относительно старта.')]);});
    return {prefix:'Цена деления равна '+size+' °C. ',prompt:'Запиши шесть изменений температур от а до е со знаком. Ответы разделяй точкой с запятой.',inputPrompt:'Шесть изменений в градусах',answer:total,answerFormat:'v5-list',steps,errors:[],data:{moves:{moves,size}},table:{caption:'Изменение по делениям, каждый раз от старта',headers:['№','Движение'],rows:moves.map((a,i)=>['абвгде'[i],summary(a)])},conditionKey:size+'/'+moves.flat().join('/')};
  }
  const marks=['L','M','N','C','K'];
  function arc(seed,r,step){
    const base=seed?r(0,8)*10:20,unit=seed?r(1,4):1,positions=seed?[r(1,3),r(4,7),10,r(13,15),r(16,19)]:[2,5,10,15,17],values=positions.map(k=>base+k*unit),end=base+20*unit;
    const steps=[step('Сколько числовых единиц соответствует одному промежутку? На всей дуге 20 одинаковых промежутков.',unit,'Раздели разность между числами на концах на 20.')];
    for(let i=0;i<5;i++)steps.push(step('Какое число стоит у метки '+marks[i]+'?',values[i],'От левого конца прибавь по одной цене деления за каждый промежуток.',values[i]-unit!==base?[err(values[i]-unit,'Проверь, не был ли отсчитан левый край шкалы как первый интервал: начальная метка уже имеет своё число.')]:[]));
    return {prefix:seed?'Новая шкала с двадцатью равными промежутками. ':'Дуговая шкала по рисунку 1.31. ',prompt:'Запиши показания по порядку L, M, N, C, K.',inputPrompt:'Пять чисел',answer:values,answerFormat:'v5-list',steps,errors:[],data:{arcScale:{base,end,unit,positions}},table:{caption:'Опоры дуговой шкалы',headers:['Ориентир','Значение'],rows:[['Слева',base],['Справа',end],['Промежутков',20]]},conditionKey:[base,unit,...positions].join('/')};
  }
  const objects=['Секвойя','Троицкая башня','Скульптура «Родина-мать зовёт!»','Биг-Бен','Сибирский кедр'],short=['Секвойя','Троицкая башня','Скульптура','Биг-Бен','Кедр'];
  const colours=['#46846b','#a95f44','#81778d','#8d673d','#5a8664'];
  const valuesFor=(levels,i,upper)=>levels.flatMap((n,j)=>(upper?n>levels[i]:n<levels[i])?[j+1]:[]);
  const list=set=>set.length?set:[0];
  function heights(seed,r,step){
    // The original asks only for comparisons. Preserve the vertical order instead of asserting exact architectural measurements.
    const levels=seed?(()=>{const base=[106,76,85,96,19];for(let i=base.length-1;i>0;i--){const j=r(0,i);[base[i],base[j]]=[base[j],base[i]];}return base;})():[108,80,85,96,20],targets=[1,2,3];
    const steps=targets.flatMap((k,i)=>[true,false].map(upper=>{const ids=list(valuesFor(levels,k,upper));return {...step('абв'[i]+'. '+objects[k]+': укажи номера всех объектов, которые '+(upper?'выше':'ниже')+' этого ориентира. Порядок неважен. Если таких нет, введи 0.',ids,'Сравни верх каждого из остальных четырёх столбиков с ориентиром и проверь номера в подписях.'),answerFormat:'unordered'};}));
    return {prefix:seed?'Новая авторская сравнительная диаграмма. ':'Схема сохраняет порядок высот рисунка 1.32. ',prompt:'Запиши номера всех пяти объектов от самого низкого до самого высокого.',inputPrompt:'Пять номеров в порядке возрастания',answer:levels.map((n,i)=>[n,i+1]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]),answerFormat:'v5-list',steps,errors:[],data:{ranking:{levels}},table:{caption:'Подписи к пяти столбикам',headers:['№','Объект'],rows:objects.map((v,i)=>[i+1,v])},conditionKey:levels.join('/')};
  }
  function thermometer(value,index){
    const X=30,Y=n=>197-3.7*n;let ticks='';
    for(let n=0;n<=45;n++){const major=n%5===0; ticks+='<path d="M'+(X+5)+' '+Y(n)+'h'+(major?10:5)+'" stroke="#657b79" stroke-width="'+(major?1.25:.7)+'"/>';if(n%10===0)ticks+='<text x="'+(X+18)+'" y="'+(Y(n)+3)+'" style="font:10px sans-serif">'+n+'</text>';}
    return '<svg role="img" viewBox="0 0 74 222" style="width:100%;max-width:94px;height:auto;margin:auto" aria-label="Термометр '+(index+1)+', цена деления один градус, верх столбика на ' +(value%10)+ ' делений выше отметки '+Math.floor(value/10)*10+'"><rect x="3" y="3" width="68" height="214" rx="7" fill="#edf3f2" stroke="#aababa"/><text x="14" y="19" style="font:bold 12px sans-serif">№'+(index+1)+'</text><text x="43" y="19" style="font:11px sans-serif">°C</text>'+ticks+'<path d="M'+X+' 198V27" stroke="#b9c5c5" stroke-width="5"/><path d="M'+X+' 198V'+Y(value)+'" stroke="#b53f32" stroke-width="4"/><circle cx="'+X+'" cy="200" r="5" fill="#b53f32"/></svg>';
  }
  function arcSvg(d,hi=-1){
    const cx=137,cy=137,r=116,point=(i,len)=>{const ang=Math.PI-i*Math.PI/20;return [cx+len*Math.cos(ang),cy-len*Math.sin(ang)];};
    let ticks='';for(let i=0;i<=20;i++){const [x,y]=point(i,r),[xx,yy]=point(i,r-(i%5?8:15));ticks+='<path d="M'+x+' '+y+'L'+xx+' '+yy+'" stroke="#637975" stroke-width="1.6"/>';}
    return '<svg role="img" viewBox="0 0 274 157" aria-label="Дуговая шкала от '+d.base+' до '+d.end+', двадцать равных промежутков. '+marks.map((m,i)=>m+' после '+d.positions[i]+' промежутков').join(', ')+'"><path d="M21 137 A116 116 0 0 1 253 137" fill="none" stroke="#3e7061" stroke-width="2.5"/>'+ticks+d.positions.map((n,i)=>{const [x,y]=point(n,r),[a,b]=point(n,r+10);return '<circle cx="'+x+'" cy="'+y+'" r="'+(i===hi?4:2.5)+'" fill="'+(i===hi?'#a8462d':'#36483d')+'"/><text x="'+a+'" y="'+(b+3)+'" text-anchor="middle" style="font:bold 11px sans-serif">'+marks[i]+'</text>';}).join('')+'<text x="18" y="151" style="font:12px sans-serif">'+d.base+'</text><text x="243" y="151" style="font:12px sans-serif">'+d.end+'</text></svg>';
  }
  function chart(d,selected=-1){
    const baseline=132,y=n=>baseline-n*.94;let grid='';for(let n=0;n<=120;n+=20)grid+='<path d="M25 '+y(n)+'H254" stroke="#c8d5ce" stroke-width="1"/><text x="21" y="'+(y(n)+3)+'" text-anchor="end" style="font:9px sans-serif">'+n+'</text>';
    return '<svg role="img" viewBox="0 0 260 154" aria-label="Сравнительная диаграмма пяти высот, номера столбиков соответствуют таблице. Снизу вверх по высоте: '+d.levels.map((v,i)=>[v,i+1]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]).join(', ')+'">'+grid+d.levels.map((v,i)=>'<rect x="'+(32+45*i)+'" y="'+y(v)+'" width="22" height="'+(baseline-y(v))+'" fill="'+colours[i]+'" stroke="'+(i===selected?'#252e2b':'none')+'" stroke-width="2"/><text x="'+(43+45*i)+'" y="147" text-anchor="middle" style="font:bold 12px sans-serif">'+(i+1)+'</text>').join('')+'</svg>';
  }
  function diagram(t){const d=t.data;if(d.thermo)return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(78px,1fr));gap:4px;max-width:400px;margin:auto">'+d.thermo.levels.map(thermometer).join('')+'</div>';return d.arcScale?arcSvg(d.arcScale):d.ranking?chart(d.ranking):'';}
  function explore(l,s,t,table){
    const d=t.data;
    if(d.thermo){const base=d.thermo.levels[s.which],row=s.row?d.thermo.deltas[s.row-1]:[],k=s.phase?row.length:Math.min(row.length,1),delta=row.slice(0,k).reduce((a,b)=>a+b,0);
      return {title:'Рассмотри один термометр крупно',controls:[opt('which','Какой термометр',['Первый','Второй','Третий','Четвёртый']),opt('row','Какое изменение',['Исходный','а','б','в','г','д']),opt('phase','Этап',['После первой стрелки','После всех стрелок'])],visual:'<div style="width:74px;margin:auto">'+thermometer(base,s.which)+'</div>',question:'От показанного исходного уровня примени '+(k?summary(row.slice(0,k)):'нулевой сдвиг')+'. Сколько градусов получится?',answer:base+delta,why:'Один штрих вверх добавляет один градус, вниз — уменьшает на один.'};}
    if(d.moves){const i=s.row,a=d.moves.moves[i],size=s.scale||d.moves.size,net=a.reduce((a,b)=>a+b,0);return {title:'Поменяй цену одного деления',controls:[opt('row','Подпункт',Array.from('абвгде')),{key:'scale',title:'Градусов в делении (0 — из условия)',min:0,max:6,step:1}],visual:table('Изменение по шкале',['Стрелки','Одно деление'],[[summary(a),size+' °C']]),question:'Как изменится показание в градусах? Для понижения нужен минус.',answer:net*size,why:'Умножь итоговое перемещение в делениях на выбранную цену.'};}
    if(d.arcScale){const a=d.arcScale;return {title:'Проследи интервалы вдоль дуги',controls:[opt('which','Метка',marks),opt('ask','Что посчитать',['Промежутки от левого края','Число у метки'])],visual:arcSvg(a,s.which),question:s.ask?'Какое число у выделенной метки?':'Сколько промежутков от левого края до выделенной метки?',answer:s.ask?a.base+a.positions[s.which]*a.unit:a.positions[s.which],why:'Не считай сам левый конец как пройденный промежуток.'};}
    const heights=d.ranking,ids=valuesFor(heights.levels,s.ref,!!s.upper);return {title:'Сравни верхушки с выбранным ориентиром',controls:[opt('ref','Ориентир',short),opt('upper','Какие сравнивать',['Ниже','Выше'])],visual:chart(heights,s.ref),question:'Сколько объектов '+(s.upper?'выше':'ниже')+' выделенного?',answer:ids.length,why:'Считай только остальные столбики с верхней точкой по нужную сторону от уровня ориентира.'};
  }
  const api={lessons,generators:{'1.126':thermometers,'1.127':signedMoves,'1.128':arc,'1.129':heights},bounds:{'1.126':{which:[0,3,0],row:[0,5,0],phase:[0,1,0]},'1.127':{row:[0,5,0],scale:[0,6,0]},'1.128':{which:[0,4,0],ask:[0,1,0]},'1.129':{ref:[0,4,0],upper:[0,1,0]}},diagram,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5SourceScales=api;
})(typeof window!=='undefined'?window:globalThis);

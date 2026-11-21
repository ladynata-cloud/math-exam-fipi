/* Виленкин и соавторы, 5 класс, часть 2, 2023, §26, печатная с. 13, №5.40–5.42. */
(function(root){
  'use strict';
  function lesson(no,title,explanation,worked,misconception,reflect){return {number:'5.'+no,key:'printed-5-'+no,part:2,point:26,page:13,title,requires:[],related:[],explanation,worked,misconception,reflect};}
  const lessons=[
    lesson(40,'Выдели части отрезка двумя цветами','Начерти отрезок и отметь равные части. Над первой цветной частью подпиши С, над второй — З. Учитывай каждую часть только один раз. Чтобы записать долю, сравни выделенное со всем отрезком.',
      ['Отрезок в 9 см разбит на 9 равных частей. Две отмечены синим, ещё три зелёным.','Всего отмечено 5 из 9 частей, а свободны ещё 4 из 9.'], 'Для суммы двух цветов нужно сложить знаменатели.', 'Почему у выделенной и оставшейся частей один знаменатель?'),
    lesson(41,'Найди незакрашенную часть отрезка','Отметь все равные интервалы, затем столько интервалов, сколько указывает числитель. Промежутки и точки на концах считаются по-разному. Для ответа сосчитай свободные интервалы.',
      ['У полоски из 7 равных частей закрасили 3.','Осталось 4 из 7 частей, то есть 4/7 полоски.'], 'Остаток получают, вычитая один из знаменателя независимо от числителя.', 'Можно ли разнести цветные интервалы по разным местам, сохранив ту же долю?'),
    lesson(42,'Покажи шестую часть квадрата на сетке','Построй квадрат на клетчатой бумаге. Раздели всё поле на шесть равных по площади частей. Отметь любую одну из них. Проверь, что шесть таких площадей заполнят весь квадрат.',
      ['В квадрате 12 на 12 клеток всего 144 клетки.','Можно провести пять линий и получить шесть полос. В одной полосе 2 · 12 = 24 клетки. Можно также получить шесть прямоугольников по 4 · 6 клеток.'], 'Одна шестая квадрата обязана иметь форму полосы.', 'Как изменить форму выделенной части и сохранить её площадь?')
  ];
  const frac=(typeof module!=='undefined'&&module.exports?require('./math.js'):root.WorkshopMath).q;
  function stripTask(no,seed,r,step){
    const two=no===40,n=seed?r(5,12):two?7:8,blue=seed?r(1,n-2):two?1:5,green=two?(seed?r(1,n-1-blue):2):0,lit=blue+green,free=n-lit;
    const condition='Отрезок длиной '+n+' см разделён на '+n+' равных интервалов. '+(two?blue+'/'+n+' отмечено синим, ещё '+green+'/'+n+' зелёным.':blue+'/'+n+' отмечено цветом.');
    const steps=[step(condition+' Какова длина одного интервала в сантиметрах?',1,'Раздели длину всего отрезка на число интервалов.',[{value:n,text:'Это длина всего отрезка. Сколько сантиметров приходится на одну часть?'}])];
    if(two)steps.push(step('Сколько интервалов выделено обоими цветами вместе?',lit,'Сложи число синих и зелёных интервалов. Они не перекрываются.',[{value:green,text:'Ты учёл только зелёный. Присоедини синие интервалы.'}]),step('Какую долю всего отрезка занимают два цвета вместе? Запиши дробь.',frac(lit,n),'Числитель считает все выделенные интервалы. Знаменатель считает все равные интервалы.',[{value:frac(lit,2*n),text:'Отрезок тот же. Знаменатель остаётся прежним.'}]));
    steps.push(step('Сколько интервалов остаётся без цвета?',free,'Вычти число выделенных интервалов из полного числа интервалов.',[{value:lit,text:'Это число цветных интервалов. Нужны свободные.'}].filter(e=>e.value!==free)));
    return {steps,prompt:condition+' Какую долю отрезка оставили без цвета? Запиши дробь.',answer:frac(free,n),inputPrompt:'Доля без цвета',errors:lit===free?[]:[{value:frac(lit,n),text:'Ты записал долю с цветом. Сосчитай оставшиеся промежутки.'}],why:free+' из '+n+' равных интервалов свободны: '+free+'/'+n+'.',data:{equalStrip:{n,blue,green,two}},conditionKey:'strip/'+[no,n,blue,green].join('/')};
  }
  function strip(n,blue,green,shift){
    const dx=270/n;let marks='';
    for(let j=0;j<n;j++){
      const index=(j-shift+n)%n,letter=index<blue?'С':index<blue+green?'З':'',color=letter==='С'?'#226484':letter==='З'?'#387449':'#fff';
      marks+='<rect x="'+(7+j*dx)+'" y="18" width="'+dx+'" height="23" fill="'+color+'" stroke="#314b54" stroke-width="1"/>';
      if(letter)marks+='<text x="'+(7+(j+.5)*dx)+'" y="34" text-anchor="middle" font-size="12" font-weight="bold" fill="#fff">'+letter+'</text>';
    }
    return '<figure style="margin:.4em 0"><svg role="img" aria-label="Полоска из '+n+' равных частей: '+blue+' синих и '+green+' зелёных" viewBox="0 0 284 53" style="width:100%;max-width:24rem;display:block">'+marks+'</svg><figcaption>С — синий интервал. '+(green?'З — зелёный интервал. ':'')+'Светлые интервалы свободны.</figcaption></figure>';
  }
  function squareTask(seed,r,step){
    const side=seed?6*r(1,5):18,whole=side*side,sixth=whole/6;
    return {steps:[step('Сторона квадрата '+side+' клеток. Сколько клеток во всём квадрате?',whole,'Умножь число клеток в ряду на число рядов.',[{value:4*side,text:'Получен периметр. Здесь считаем клетки, покрывающие всё поле.'}]),step('Если делить квадрат на шесть одинаковых вертикальных полос, какой будет ширина одной полосы в клетках?',side/6,'Раздели ширину всего квадрата на число равных полос.',[{value:6,text:'6 — число полос. Вопрос о ширине каждой.'}].filter(x=>x.value!==side/6))],
      prompt:'Раздели квадрат со стороной '+side+' клеток на шесть равных по площади частей и закрась любую одну. Сколько клеток нужно закрасить?',answer:sixth,inputPrompt:'Клеток в одной шестой',errors:[{value:side/6,text:'Это ширина одной полосы. Учти все ряды по высоте.'},{value:whole,text:'Это всё поле. Нужна только одна из шести равных частей.'}],why:whole+' : 6 = '+sixth+' клеток. Столько же клеток у любой другой одной шестой.',data:{sixthSquare:{side}},conditionKey:'sixth-square/'+side};
  }
  function grid(side,pattern,selected){
    const [cols,rows]=[[6,1],[1,6],[3,2],[2,3]][pattern],cell=180/side,w=180/cols,h=180/rows;let lines='';
    for(let i=1;i<side;i++){const o=8+i*cell;lines+='<path d="M'+o+' 8V188 M8 '+o+'H188" stroke="#91aab0" stroke-width=".7"/>';}
    for(let i=1;i<cols;i++)lines+='<path d="M'+(8+i*w)+' 8 V188" stroke="#254749" stroke-width="2"/>';
    for(let i=1;i<rows;i++)lines+='<path d="M8 '+(8+i*h)+' H188" stroke="#254749" stroke-width="2"/>';
    return '<figure style="margin:.4em 0"><svg role="img" aria-label="Квадрат '+side+' на '+side+' клеток разделён на шесть частей. Отмечена часть '+(selected+1)+'" viewBox="0 0 196 196" style="width:100%;max-width:15rem;display:block"><rect x="8" y="8" width="180" height="180" fill="#fff"/><rect x="'+(8+(selected%cols)*w)+'" y="'+(8+Math.floor(selected/cols)*h)+'" width="'+w+'" height="'+h+'" fill="#84c9b7"/>'+lines+'<rect x="8" y="8" width="180" height="180" fill="none" stroke="#26494c" stroke-width="2.5"/></svg><figcaption>Толстые линии отделяют шесть частей, тонкие — клетки. Сторона квадрата '+side+' клеток.</figcaption></figure>';
  }
  function draw(t){if(t.data.equalStrip){const d=t.data.equalStrip;return strip(d.n,d.blue,d.green,0);}return grid(t.data.sixthSquare.side,0,0);}
  function explore(t,s){
    if(t.data.sixthSquare){const n=t.data.sixthSquare.side;return {title:'По-разному раздели квадрат на шесть',controls:[{key:'pattern',title:'Как делить',values:[[0,'Вертикальные полосы'],[1,'Горизонтальные полосы'],[2,'Три столбца по две части'],[3,'Два столбца по три части']]},{key:'selected',title:'Какую часть закрасить',values:[1,2,3,4,5,6].map((a,i)=>[i,String(a)])}],visual:grid(n,s.pattern,s.selected),question:'Сколько клеток в закрашенной части при таком делении?',answer:n*n/6,why:'Площадь всего квадрата делится на шесть при каждом из четырёх способов.'};}
    const d=t.data.equalStrip,b=s.blue<0?d.blue:s.blue,g=d.two?(s.green<0?d.green:s.green):0,n=d.n;
    // A longer choice starts a different proportion experiment while keeping the whole strip fixed.
    const blue=Math.min(b,n),green=Math.min(g,n-blue),clipped=b>n||g>n-blue;
    return {title:'Отметь интервалы и сравни доли',controls:[{key:'blue',title:'Сколько синих',values:[[-1,'Из задания'],...Array.from({length:n+1},(_,v)=>[v,String(v)])]},...(d.two?[{key:'green',title:'Сколько ещё зелёных',values:[[-1,'Из задания'],...Array.from({length:n+1},(_,v)=>[v,String(v)])]}]:[]),{key:'shift',title:'Где начать выделение',values:[[0,'Слева'],[1,'Со второго интервала'],[2,'С третьего интервала']]},{key:'ask',title:'Что сравнить со всем отрезком',values:[[0,'Цветную часть'],[1,'Свободную часть']]}],visual:strip(n,blue,green,s.shift)+(clipped?'<p>Для выбранного цвета уже не хватает свободных клеток. На рисунке показано, сколько уместилось без наложения.</p>':''),question:'Какую долю отрезка составляет выбранная часть? Запиши дробь.',answer:frac(s.ask?n-blue-green:blue+green,n),why:'Сосчитай нужные интервалы. Знаменатель говорит о делении всей полоски на '+n+' равных частей.'};
  }
  const stripBounds={blue:[-1,12,-1],green:[-1,12,-1],shift:[0,2,0],ask:[0,1,0]};
  const api={lessons,generators:{'5.40':(s,r,f)=>stripTask(40,s,r,f),'5.41':(s,r,f)=>stripTask(41,s,r,f),'5.42':squareTask},bounds:{'5.40':stripBounds,'5.41':stripBounds,'5.42':{pattern:[0,3,0],selected:[0,5,0]}},taskDrawing:draw,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5EqualParts=api;
})(typeof window!=='undefined'?window:globalThis);

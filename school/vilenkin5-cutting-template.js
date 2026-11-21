/* Виленкин и соавт., 2023, часть 2, §25, с. 10, №5.24–5.25. Ключ к №5.25 на с. 172. */
(function(root){
  'use strict';
  const make=(n,title,prev,explanation,worked,misconception,reflect)=>({number:n,key:'printed-'+n.replace('.','-'),part:2,point:25,page:10,title,requires:['v5f-printed-'+prev],related:[],explanation,worked,misconception,reflect});
  const lessons=[
    make('5.24','Разбери шаблон по клеткам','5-22','Отдельно посчитай нижний прямоугольник, узкую ручку и две клетки высоты между ними. В авторской модели изгибы плеч симметричны: поворотом на пол-оборота добавку с одной стороны можно переложить в выемку. Габариты считай по внешним краям.',
      ['У другого шаблона ширина 4 клетки, высота 5. Чтобы он встал в прямоугольник шириной 18 и высотой 30 см, ширина клетки не должна превышать 18 : 4, а высота — 30 : 5.','Если клетки обязаны быть квадратными, для обеих сторон возьми меньший предел.','Когда меняется размер клетки, площадь всего шаблона равна числу равновеликих клеток, умноженному на площадь одной.'],
      'Умножив ширину шаблона на высоту, получим его точную площадь даже при наличии выемок.','Как проверить перестановкой двух кусочков, что площадь сохранилась?'),
    make('5.25','Взвесь банку и мёд по долям','5-16','Изобрази пустую банку одной частью. Отдельно изобрази столько же частей, сколько банок по массе составляет мёд. Вместе это полная банка на весах.',
      ['Если содержимое втрое тяжелее тары, полная масса состоит из четырёх частей.','Пусть полная масса 800 г. На пустую тару приходится 200 г, на содержимое — 600 г.','Проверка двойная. Всего 800 г, а 600 : 200 = 3.'],
      'Если содержимое тяжелее пустой банки в четыре раза, нужно разделить массу полной банки на четыре.','Что означают четыре части и почему весы показывают больше?')];
  const decimal=n=>Number.isInteger(n)?n:String(n);
  function picture(flat,show,region=3){
    const path=flat?'M3 0H4V2H5V4H6V8H1V4H2V2H3Z':'M3 0H4V2C4 3,6 3,6 4V8H1V4C1 3,3 3,3 2Z';
    // In the middle band the two S-shaped boundaries have half-turn symmetry.
    // A straight equal-area replacement is a centered 3-by-2 rectangle.
    const parts=['M1 4H6V8H1Z',flat?'M2 2H5V4H2Z':'M3 2H4C4 3,6 3,6 4H1C1 3,3 3,3 2Z','M3 0H4V2H3Z'];
    const mark=region===3?'':'<path d="'+parts[region]+'" fill="#7ab4a1"/>';
    const middle=flat?'<path d="M2 2H5V4H2Z" fill="#d9b071"/>':'';
    const outline=flat?'<path d="M3 0H4V2H5V4H6V8H1V4H2V2H3Z" fill="#ecc598"/>':'<path d="'+path+'" fill="#ecc598"/>';
    let grid='';for(let j=0;j<=8;j++)grid+='<path d="M0 '+j+'H7" stroke="#737d78" stroke-width=".025"/>';for(let j=0;j<=7;j++)grid+='<path d="M'+j+' 0V8" stroke="#737d78" stroke-width=".025"/>';
    return '<svg role="img" class="v5q-printed-geometry" aria-label="'+(flat?'Те же части сложены из трёх прямоугольников':'Шаблон с двумя симметричными изгибами плеч')+'" viewBox="-.4 -.4 7.8 8.8" style="width:100%;max-width:14rem;display:block;margin:auto">'+outline+middle+mark+(show?'<path d="M1 4H6M2 2H5" fill="none" stroke="#215749" stroke-width=".1" stroke-dasharray=".24 .15"/>':'')+grid+'<path d="'+path+'" fill="none" stroke="#513d35" stroke-width=".075"/></svg>';
  }
  function board(seed,rand,step){
    const variants=[[24,50,6],[30,48,3],[20,40,2],[35,64,4],[40,56,5],[25,32,2]],caseId=seed?1+(seed-1)%(variants.length-1):0;
    const [width,height,size]=variants[caseId],wide=width/5,tall=height/8,square=Math.min(wide,tall);
    const ask=(s,n,why,feedback)=>({...step(s,decimal(n),why,feedback),answerFormat:'v5-unit-fraction'});
    return {steps:[
      ask('а. Нижняя часть имеет ширину 5 и высоту 4 клетки. Сколько клеток в ней?',20,'Перемножь две стороны нижнего прямоугольника.',[{value:40,text:'Это весь охватывающий прямоугольник 5 × 8 с вырезами. Сейчас нужна только нижняя часть.'}]),
      ask('Сколько клеток вместе добавляют ручка 1 × 2 и средняя полоса? Переключи модель, чтобы сложить из плеч прямоугольник 3 × 2.',8,'Сложи площадь ручки и равновеликого среднего прямоугольника.',[{value:6,text:'Это пара плеч вместе с центральной полосой. Добавь ещё ручку высотой две клетки.'}]),
      ask('Сколько всего единичных клеток составляет площадь модели шаблона?',28,'Соедини площади трёх окрашенных частей.',[{value:40,text:'В это число вошли и незакрашенные клетки вокруг ручки.'}]),
      ask('б. Лист имеет ширину '+width+' и длину '+height+' см. Верх ручки направлен вдоль длины листа. Какой наибольшей ширины может быть прямоугольная клетка, если по ширине шаблона их пять?',wide,'Раздели ширину листа на полный размах шаблона по горизонтали.',[]),
      ask('Какой наибольшей высоты может быть прямоугольная клетка? По высоте шаблона их восемь.',tall,'Раздели длину листа на восемь промежутков.',[]),
      ask('Если нужна именно квадратная клетка, какую наибольшую сторону можно взять, в см?',square,'Квадрат должен одновременно поместиться и по ширине, и по высоте.',wide===tall?[]:[{value:decimal(Math.max(wide,tall)),text:'Проверь оба размера фанеры: больший предел не обязательно подходит для другой стороны.'}])
    ],prompt:'в. Теперь у каждой клетки сторона '+size+' см. Это отдельный масштаб. Найди площадь доски в см².',answer:28*size**2,inputPrompt:'Площадь, см²',why:'На сетке модель занимает 28 клеток. Одна клетка имеет площадь '+size+' × '+size+' = '+size**2+' см². Вместе '+28*size**2+' см².',
      errors:[{value:28*size,text:'Ты умножил число клеток на длину. Нужна площадь одной клетки.'}],data:{boardGrid:{width,height,size}},conditionKey:'template/'+caseId};
  }
  function bar(k,focus){
    let boxes='';for(let i=0;i<=k;i++)boxes+='<rect x="'+(6+228*i/(k+1))+'" y="5" width="'+(228/(k+1)-1)+'" height="23" fill="'+((focus===2|| (focus===1?i===0:i>0))?'#d59c43':'#d4e3e2')+'" stroke="#414f4f"/>';
    return '<figure style="margin:.3em 0"><svg viewBox="0 0 241 32" role="img" aria-label="Пустая банка — одна часть, мёд — '+k+' равных частей" style="width:100%;max-width:26rem;display:block">'+boxes+'</svg><figcaption>Первая часть — тара. За ней '+k+' частей мёда.</figcaption></figure>';
  }
  function honey(seed,rand,step){
    const k=seed?2+(seed-1)%5:4,jar=seed?50*(2+Math.floor((seed-1)/5)%8):300,total=(k+1)*jar,contents=k*jar;
    return {steps:[step('Полная банка весит '+total+' г. Масса мёда равна массе '+k+' таких пустых банок. Сколько равных частей массы вместе на весах?',k+1,'К частям мёда добавь одну часть — пустую банку.',[{value:k,text:'Это только мёд. Весы держат и стекло.'}]),
      step('Сколько граммов весит пустая банка?',jar,'Раздели всю массу на общее число частей.',[{value:total+'/'+k,text:'Так ты разделил всю массу только на число медовых частей. Прибавь часть тары.'}])],
      prompt:'Какова масса одного мёда, в граммах?',answer:contents,inputPrompt:'Масса мёда, г',data:{honeyJar:{k,jar,total}},conditionKey:'honey/'+[k,jar].join('/'),why:'Мёд весит '+k+' · '+jar+' = '+contents+' г. Вместе с банкой это '+total+' г.',errors:[{value:jar,text:'Это масса одного стекла. Вес мёда составляет несколько таких частей.'},{value:total,text:'Это полная банка. Убери массу стекла.'}]};
  }
  function taskDrawing(task){return task.data.boardGrid?picture(false,true):bar(task.data.honeyJar.k,0);}
  function explore(t,s){
    if(t.data.boardGrid){const n=[20,6,2,28][s.region];return {title:'Переложи плечи и пересчитай площадь',controls:[{key:'flatten',title:'Форма',values:[[0,'С изгибами'],[1,'Три прямоугольника']]},{key:'region',title:'Какая часть нужна',values:[[0,'Нижняя часть'],[1,'Средняя часть'],[2,'Ручка'],[3,'Весь шаблон']]}],
      visual:picture(s.flatten,true,s.region),question:'Сколько единичных клеток занимает выбранная часть?',answer:n,why:['5 × 4 = 20.','После перекладки средняя часть имеет площадь 3 × 2 = 6.','1 × 2 = 2.','20 + 6 + 2 = 28.'][s.region]};}
    const one=t.data.honeyJar.jar,k=s.ratio,what=s.target;return {title:'Поставь банку с мёдом на весы',controls:[{key:'ratio',title:'Число частей мёда',min:2,max:7,step:1},{key:'target',title:'Найди массу',values:[[0,'Мёд'],[1,'Тара'],[2,'Вся банка']]}],
      visual:bar(k,what)+'<p>Одна часть весит '+one+' г.</p>',question:'Сколько граммов весит выбранное?',answer:[k*one,one,(k+1)*one][what],why:'Посчитай выбранные равные части и умножь их число на '+one+' г.'};
  }
  const api={lessons,generators:{'5.24':board,'5.25':honey},bounds:{'5.24':{flatten:[0,1,0],region:[0,3,3]},'5.25':{ratio:[2,7,4],target:[0,2,0]}},taskDrawing,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5BoardGridAndHoney=api;
})(typeof window!=='undefined'?window:globalThis);

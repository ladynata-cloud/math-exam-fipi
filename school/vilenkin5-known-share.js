/* Виленкин, часть 2, §26, с. 16. Печатные №5.61–5.66. */
(function(root){
  'use strict';
  const q=(typeof module!=='undefined'&&module.exports?require('./math.js'):root.WorkshopMath).q;
  const inputs=[
    ['Запас воды по одной шестой','В бочке',1,6,30,'л','Каким был весь запас воды до полива?'],
    ['Расстояние по двум пятым пути','Путь от станции до Заречья составляет',2,5,4,'км','Сколько километров от станции до посёлка у озера?'],
    ['Длина проспекта по его участку','Старо-Невский участок составляет',4,9,2,'км','Чему равна длина всего проспекта в данных задачи?'],
    ['Длина одного бульвара через длину другого','Длина Яузского бульвара составляет',8,15,400,'м','Какова длина Гоголевского бульвара в данных задачи?'],
    ['Чистые листы в тетради','Исписанная часть тетради равна',5,9,10,'листов','Сколько чистых листов осталось?']
  ];
  const lessons=inputs.map(([title],i)=>({number:'5.'+(61+i),key:'printed-5-'+(61+i),part:2,point:26,page:16,title,requires:['v5f-printed-5-57'],related:[],explanation:'Здесь известно значение нескольких равных долей. Раздели эту величину на число известных долей, затем собери из одной доли нужное количество.',worked:['Если три седьмых отрезка равны 12 см, одна седьмая равна 4 см. Весь отрезок состоит из семи таких долей и имеет длину 28 см.'],misconception:'Если известна часть величины, для нахождения целого всегда надо умножить данное число на знаменатель.',reflect:'Как проверить найденное целое, вернувшись от него к известной части?'}));
  lessons.push({number:'5.66',key:'printed-5-66',part:2,point:26,page:16,title:'Сравни площади двух комнат',requires:['v5f-printed-5-48'],related:[],explanation:'Площади обеих комнат заданы долями одной квартиры. Найди каждую площадь в квадратных метрах. Затем вычти меньшую из большей.',worked:['При общей площади 48 м² одна комната занимает четверть, то есть 12 м². Другая занимает треть, то есть 16 м². Площади различаются на 4 м².'],misconception:'Если числитель у дроби больше, то и соответствующая комната обязательно больше.',reflect:'Почему нельзя сравнить комнаты только по числителям 5 и 3?'});
  function build(num,seed,r,step){
    if(num===66){
      const total=seed?56*r(2,5):56,a=total*5/14,b=total*3/8;
      const p='В квартире '+total+' м². Одна комната занимает 5/14 общей площади, вторая — 3/8 всей квартиры.';
      return {steps:[step(p+' Сколько квадратных метров в первой комнате?',a,'Найди 1/14 площади квартиры и возьми пять таких долей.',[]),step('Чему равна площадь второй комнаты в м²?',b,'Раздели площадь всей квартиры на восемь и умножь на три.',[{value:a,text:'Это площадь первой комнаты. Вторая занимает три восьмых квартиры.'}])],prompt:p+' На сколько квадратных метров площади комнат различаются?',answer:b-a,why:'Сравни '+b+' м² и '+a+' м². Больше вторая комната.',errors:[{value:a+b,text:'Это суммарная площадь комнат. Вопрос просит разность.'}],inputPrompt:'Разность в м²',data:{knownShare:{num,total,a,b}},conditionKey:'two-room-fractions/'+total};
    }
    const [,,n,d,orig,unit,final]=inputs[num-61];
    const given=seed?(num===63?r(1,15):n*r(num===64?15:2,num===64?85:19)):orig;
    const unitPart=q(given,n),all=q(given*d,n),left=q(given*(d-n),n);
    const condition=num===61?'Одна шестая воды в бочке — '+given+' л.':
      num===62?'От станции до Заречья '+given+' км. Это '+n+'/'+d+' пути до посёлка у озера.':
      num===63?(seed?'В учебной модели участок проспекта длиной ':'В условии учебника Старо-Невский участок длиной ')+given+' км составляет 4/9 всего проспекта.':
      num===64?(seed?'В учебной модели короткий бульвар длиной ':'В условии учебника Яузский бульвар длиной ')+given+' м составляет 8/15 длины длинного бульвара.':
      'В тетради исписали '+given+' листов. Это 5/9 всех её листов.';
    const wrong=q(given*d,1);
    const steps=num===61?[step(condition+' Сколько равных шестых в целом запасе?',d,'Знаменатель показывает число равных долей во всём запасе.',[])]:[step(condition+' Чему равна одна из '+d+' равных долей? Введи число ('+unit+').',unitPart,'Раздели известную величину на '+n+' — столько долей известно.',[{value:q(given,d),text:'Данное число соответствует закрашенным долям, а не всему целому. Раздели его на число закрашенных долей.'}])];
    if(num===65)steps.push(step('Сколько листов было в полной тетради?',all,'Составь целое из девяти равных долей.',[]));
    const answer=num===65?left:all,errors=[];
    if(n>1&&num!==65)errors.push({value:wrong,text:'Ты умножил всю известную часть на знаменатель. Сначала найди одну долю.'});
    if(num===65)errors.push({value:all,text:'Это все листы с обложки до обложки. Вычти уже исписанные.'});
    if(num===61)errors.push({value:q(given,d),text:'Объём одной шестой уже известен. В полной бочке шесть таких объёмов.'});
    return {steps,prompt:condition+' '+final,answer,why:num===65?'Вычти исписанные листы из полной тетради.':'От одной доли восстанови все '+d+' долей.',errors,inputPrompt:'Число ('+unit+')',data:{knownShare:{num,n,d,given,unit}},conditionKey:'restore/'+num+'/'+given};
  }
  function stripe(n,d,x,y,sw,shade){
    let out='';for(let i=0;i<d;i++)out+='<rect x="'+(x+i*sw/d)+'" y="'+y+'" width="'+(sw/d)+'" height="19" fill="'+(i<n?shade:'#eef2ef')+'" stroke="#385653" stroke-width=".9"/>';return out;
  }
  function picture(x,focus=0,request=null){
    let shapes,label;
    if(x.num===66){shapes=stripe(5,14,9,8,236,focus?'#83aa9c':'#207d68')+stripe(3,8,9,37,236,focus?'#b76c24':'#d3a06c');label='Полосы одной длины показывают площадь квартиры. Верхняя разделена на 14, вторая на 8 равных частей.';
      if(focus===2){const a=236*x.a/x.total,b=236*x.b/x.total,c=236-a-b;shapes+='<rect x="9" y="66" width="'+a+'" height="16" fill="#83aa9c"/><rect x="'+(9+a)+'" y="66" width="'+b+'" height="16" fill="#d3a06c"/><rect x="'+(9+a+b)+'" y="66" width="'+c+'" height="16" fill="#705681"/>';label+=' На третьей полосе фиолетовым показана площадь вне обеих комнат.';}}
    else {shapes=stripe(x.n,x.d,9,12,236,'#278576');label='Известная величина '+x.given+' '+x.unit+' относится ко всей закрашенной части: '+x.n+' из '+x.d+' равных долей.';
      if(request!==null){shapes+=stripe(request,x.d,9,41,236,'#bd7b40');label+=' На нижней полосе оранжевым показано выбранное количество долей.';}}
    return '<figure style="margin:.4em 0"><svg role="img" aria-label="'+label+'" viewBox="0 0 254 '+(x.num===66?(focus===2?90:65):(request===null?41:68))+'" style="width:100%;max-width:23rem">'+shapes+'</svg><figcaption>'+label+'</figcaption></figure>';
  }
  function explore(t,s){
    const x=t.data.knownShare;
    if(x.num===66)return {title:'Сравни комнаты на общей шкале',controls:[{key:'focus',title:'Что измерить',values:[[0,'Первая комната'],[1,'Вторая комната'],[2,'Остальная площадь квартиры']]}],visual:picture(x,s.focus),question:'Сколько квадратных метров занимает выбранная часть квартиры?',answer:[x.a,x.b,x.total-x.a-x.b][s.focus],why:'Все доли относятся к площади '+x.total+' м².'};
    const count=s.count<0?x.d:s.count;
    return {title:'От известной части к любому числу долей',controls:[{key:'count',title:'Сколько равных долей нужно',values:[[-1,'Все доли'],...Array.from({length:x.d+1},(_,i)=>[i,String(i)])]}],visual:picture(x,0,count),question:'Узнай величину для '+count+' равных долей ('+x.unit+').',answer:q(x.given*count,x.n),why:'Сначала раздели '+x.given+' на '+x.n+', затем умножь на '+count+'.'};
  }
  const generators={},bounds={};for(let n=61;n<=66;n++){generators['5.'+n]=(s,r,f)=>build(n,s,r,f);bounds['5.'+n]=n===66?{focus:[0,2,0]}:{count:[-1,inputs[n-61][3],-1]};}
  const api={lessons,generators,bounds,draw:t=>picture(t.data.knownShare),explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5KnownShare=api;
})(typeof window!=='undefined'?window:globalThis);

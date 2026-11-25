/* Виленкин и соавторы, часть 2, §26, с. 14, №5.47–5.50. Авторские модели. */
(function(root) {
  'use strict';
  const q=(typeof module!=='undefined'&&module.exports?require('./math.js'):root.WorkshopMath).q;
  const descriptions=[
    ['Доля куска ткани','Запиши всю длину в сантиметрах. Раздели полосу на равные отрезки и прочитай длину одного.','В 2 м 40 см всего 240 см. Шестая часть равна 40 см.','Нужно разделить только сантиметры после числа метров.','Как вернуть исходную длину из длины одной доли?'],
    ['Два куска и остаток','Обе доли взяты от одного целого арбуза. Сначала запиши его массу в граммах. Найди каждый кусок отдельно и проверь сумму трёх масс.','От дыни массой 3000 г отрезали пятую и десятую части. Это 600 и 300 г. Осталось 2100 г.','Вторую долю обязательно берут от остатка после первого куска.','На какое слово нужно посмотреть, чтобы выбрать целое для второй доли?'],
    ['Доля всего времени и доля остатка','Нарисуй всю прогулку полосой. Убери время первого занятия. Для второго раздели на равные части только оставшуюся полосу.','Из 60 минут на первое занятие ушла треть, то есть 20 минут. Половина оставшихся 40 минут равна 20 минутам.','Вторая дробь всегда относится ко всей прогулке.','Как показать на рисунке, что во втором действии целое изменилось?'],
    ['Четверть квадрата в клетку','Раздели квадрат на четыре равные по площади части. Закрась одну из них и посчитай клетки в оставшихся трёх. Попробуй закрасить другую четверть.','У квадрата 4 × 4 всего 16 клеток. В каждой четверти 4 клетки. Свободно 12 из 16.','Если закрашена четверть, свободна тоже четверть.','Как проверить на клетках, что при другом выборе четверти свободная доля сохраняется?']
  ];
  const lessons=descriptions.map(([title,explanation,example,misconception,reflect],i)=>({number:'5.'+(47+i),key:'printed-5-'+(47+i),part:2,point:26,page:14,title,explanation,worked:[example],misconception,reflect,requires:[i===3?'v5f-printed-5-44':'v5f-printed-5-40'],related:[]}));
  function make(number,seed,rand,step) {
    let whole,first,second=0,left,den,other=0,side=0,paint=1,unit,steps=[],question,answer,why,errors;
    const err=(value,text)=>({value,text});
    if(number===47) {
      den=seed?rand(2,7):3;whole=seed?den*rand(51,120):150;first=whole/den;left=whole-first;unit='см';
      const cm=whole%100,metres=Math.floor(whole/100);
      steps=[step('Ткань имеет длину '+metres+' м '+cm+' см. Запиши всю длину в сантиметрах.',whole,'Каждый метр даёт сто сантиметров.',cm?[err(cm,'Ты записал только часть после метров. Учти каждый полный метр.')]:[])];
      question='На фартук взяли 1/'+den+' всей длины ('+metres+' м '+cm+' см). Сколько сантиметров ткани отмерить?';
      answer=first;errors=[err(whole,'Ты назвал длину целого отреза. Раздели его на равные доли.')];why=whole+' : '+den+' = '+first+' см.';
    } else if(number===48) {
      den=10;other=12;whole=seed?600*rand(3,14):4800;first=whole/den;second=whole/other;left=whole-first-second;unit='г';
      steps=[step('Арбуз весит '+Math.floor(whole/1000)+' кг '+whole%1000+' г. Запиши массу в граммах.',whole,'В каждом килограмме тысяча граммов.',[]),step('Первый кусок — десятая часть исходного арбуза. Сколько это граммов?',first,'Найди одну из десяти равных по массе частей.',[]),step('Второй кусок — двенадцатая часть того же целого арбуза. Сколько он весит в граммах?',second,'Для обеих дробей исходная масса одна.',[err((whole-first)/other,'Так получилась доля остатка. Здесь двенадцатая часть взята от целого арбуза.')])];
      question='После обоих разрезов сколько граммов осталось от арбуза массой '+whole+' г? Первый взял десятую часть, второй — двенадцатую часть целого.';
      answer=left;errors=[err(first+second,'Это сумма двух отрезанных кусков. Найди массу того, что осталось.')];why=whole+' − '+first+' − '+second+' = '+left+' г.';
    } else if(number===49) {
      den=4;other=3;whole=seed?4*rand(16,43):80;first=whole/den;second=(whole-first)/other;left=whole-first-second;unit='мин';
      steps=[step('Прогулка длилась '+Math.floor(whole/60)+' ч '+whole%60+' мин. Сколько всего минут?',whole,'В часе шестьдесят минут.',[]),step('Катание заняло четверть всей прогулки. Сколько минут длилось катание?',first,'Раздели всю прогулку на четыре равные части.',[]),step('Сколько минут осталось сразу после катания?',whole-first,'Из всей прогулки вычти время катания.',[err(first,'Ты указал уже проведённое время. Нужен остаток.')])];
      question='На хоккей ушла треть времени, оставшегося после катания. Прогулка длилась '+whole+' мин, четверть ушла на катание. Сколько минут длилась игра?';
      answer=second;errors=[err(q(whole,3),'Ты взял треть всей прогулки. Найди на полосе только время после катания и раздели его на три.')];why='После катания осталось '+(whole-first)+' мин. Разделим на три: '+second+' мин.';
    } else {
      side=seed?2*rand(2,8):10;whole=side*side;paint=seed?rand(1,3):1;first=whole*paint/4;left=whole-first;den=4;unit='клеток';
      steps=[step('В квадрате '+side+' рядов по '+side+' клеток. Сколько всего клеток?',whole,'Умножь число рядов на число клеток в ряду.',[]),step('Отметь '+paint+' из четырёх равных частей. Сколько клеток заняли отмеченные части?',first,'Раздели общее число клеток на четыре и учти число закрашенных частей.',[])];
      question='Квадрат разделили на четыре равные по площади части. Цветом отметили '+paint+' из них. Какая доля всего квадрата осталась без цвета?';answer=q(4-paint,4);errors=paint===2?[]:[err(q(paint,4),'Ты указал закрашенную часть. Посчитай оставшиеся равные доли.')];why='Свободных четвертей осталось '+(4-paint)+': '+left+' из '+whole+' клеток.';
    }
    return {steps,prompt:question,answer,inputPrompt:number===50?'Доля квадрата':'Ответ в '+({47:'сантиметрах',48:'граммах',49:'минутах'}[number]),why,errors,data:{shareStory:{number,whole,first,second,left,den,other,side,paint,unit}},conditionKey:'share-story/'+number+'/'+whole+'/'+den+'/'+paint};
  }
  const colours=['#157c71','#e3a94e','#e3ecea'];
  function figure(x,corner=0) {
    let marks='';
    if(x.number===50) {
      const cell=176/x.side,half=x.side/2;
      for(let r=0;r<x.side;r++)for(let c=0;c<x.side;c++){
        const region=(r>=half?2:0)+(c>=half?1:0);
        marks+='<rect x="'+(8+c*cell)+'" y="'+(8+r*cell)+'" width="'+cell+'" height="'+cell+'" fill="'+((region-corner+4)%4<x.paint?colours[0]:'#fff')+'" stroke="#858e8c" stroke-width=".65"/>';
      }
      marks+='<path d="M96 8V184 M8 96H184" stroke="#283b39" stroke-width="2"/>';
      return '<figure style="margin:.4em 0"><svg role="img" aria-label="Квадрат в клетку. Закрашено областей: '+x.paint+' из четырёх" viewBox="0 0 192 192" style="width:100%;max-width:14rem">'+marks+'</svg><figcaption>Квадрат '+x.side+' × '+x.side+'. Сравни четыре области.</figcaption></figure>';
    }
    const width=240,start=8,svgEnd=248;
    function row(y,segments,ticks,base=0,n=1){
      let at=start;
      for(const [share,color] of segments){const w=width*share;marks+='<rect x="'+at+'" y="'+y+'" width="'+w+'" height="20" fill="'+color+'" stroke="#354941"/>';at+=w;}
      for(let i=1;i<ticks;i++){const pos=start+width*(base+n*i/ticks);marks+='<path d="M'+pos+' '+y+'v20" stroke="#465850"/>';}
    }
    const a=1/x.den;
    row(12,[[a,colours[0]],[1-a,colours[2]]],x.den);
    if(x.number===48)row(49,[[1/x.other,colours[1]],[1-1/x.other,colours[2]]],x.other);
    if(x.number===49)row(49,[[a,'#bfc7c4'],[(1-a)/x.other,colours[1]],[(1-a)*(1-1/x.other),colours[2]]],x.other,a,1-a);
    const caption=x.number===47?'Одна цветная часть — ткань на фартук.':x.number===48?'Обе полосы показывают один целый арбуз. На каждой отмечен отдельный кусок.':'Верхняя полоса — вся прогулка. Слева на нижней полосе серым отмечено уже потраченное время.';
    return '<figure style="margin:.4em 0"><svg role="img" aria-label="'+caption+'" viewBox="0 0 '+(svgEnd+8)+' '+(x.number===47?40:80)+'" style="width:100%;max-width:24rem">'+marks+'</svg><figcaption>'+caption+'</figcaption></figure>';
  }
  function explore(t,state) {
    const x=t.data.shareStory;
    if(x.number===50) {
      const places=['Верхнюю левую','Верхнюю правую','Нижнюю левую','Нижнюю правую'];
      return {title:'Перемести закрашенную область',controls:[{key:'corner',title:'С какой четверти начать',values:places.map((v,i)=>[i,v])},{key:'ask',title:'Что посчитать',values:[[0,'Закрашенные клетки'],[1,'Свободные клетки']]}],visual:figure(x,state.corner),question:state.ask?'Сколько клеток сейчас свободно?':'Сколько клеток закрашено?',answer:state.ask?x.left:x.first,why:'Каждая область занимает четверть квадрата. Число цветных областей — '+x.paint+'.'};
    }
    const labels=x.number===47?['Одну долю ткани','Остаток ткани']:x.number===48?['Первый кусок','Второй кусок','Остаток арбуза']:['Катание','Хоккей','Остальное время'];
    const values=x.number===47?[x.first,x.left]:[x.first,x.second,x.left];
    const amounts=[1,2,3],k=amounts[state.scale];
    return {title:'Измени целое и проверь долю',controls:[{key:'scale',title:'Размер целого',values:amounts.map((m,i)=>[i,String(x.whole*m)+' '+x.unit])},{key:'ask',title:'Что ищем',values:labels.map((v,i)=>[i,v])}],visual:figure(x),question:'Целое теперь '+x.whole*k+' '+x.unit+'. Найди '+labels[state.ask].toLowerCase()+'. Введи число.',answer:values[state.ask]*k,why:'Размер целого изменился в '+k+' раз. При прежних долях каждая часть изменяется во столько же раз.'};
  }
  const generators={},bounds={};
  for(let n=47;n<=50;n++){
    generators['5.'+n]=(s,r,step)=>make(n,s,r,step);
    bounds['5.'+n]=n===50?{corner:[0,3,0],ask:[0,1,0]}:{scale:[0,2,0],ask:[0,n===47?1:2,0]};
  }
  const api={lessons,generators,bounds,taskDrawing:t=>figure(t.data.shareStory),explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5ShareStories=api;
})(typeof window!=='undefined'?window:globalThis);

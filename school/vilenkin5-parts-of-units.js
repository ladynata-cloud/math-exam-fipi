/* Виленкин и соавт., 2023, часть 2, п. 25, с. 9, №5.18–5.19. */
(function(root){
  'use strict';
  const labels=['а','б','в','г','д','е'];
  const length=[['сантиметра','1 см',10],['дециметра','1 дм',100],['километра','1 км',1000000]];
  const mass=[['килограмма','1 кг',1000],['центнера','1 ц',100000],['тонны','1 т',1000000]];
  const denominators=[2,4,5,10,20,25,40,50,100,1000];
  const factors={2:[2],4:[4],5:[5],10:[10],20:[2,10],25:[5,5],40:[4,10],50:[5,10],100:[10,10],1000:[10,10,10]};
  const printedLength=[[1,2],[0,4],[1,5],[1,50],[1,100],[2,1000]];
  const printedMass=[[0,100],[1,10],[0,25],[1,4],[2,1000],[2,40]];
  function describe(number,title,requires,explanation,worked,misconception,reflect){
    return {number,title,requires:['v5f-printed-'+requires],part:2,point:25,page:9,key:'printed-'+number.replace('.','-'),related:[],explanation,worked,misconception,reflect};
  }
  const lessons=[
    describe('5.18','Вырази части длины в миллиметрах','5-17','Запиши целую единицу в миллиметрах. Знаменатель указывает, на сколько равных частей ты её делишь. Для четверти сантиметра можно записать ответ десятичной или обыкновенной дробью.',
      ['В одном дециметре 100 мм. Чтобы найти десятую часть, раздели 100 на 10.','Вся полоска даёт 100 мм. Десять одинаковых кусочков по 10 мм снова составляют эту полоску.'],
      'Чтобы найти часть километра в миллиметрах, достаточно знать число метров в километре.','Как проверить, что результат относится к одной части целого?'),
    describe('5.19','Вырази части массы в граммах','5-18','Назови целое и переведи его в граммы. Килограмм содержит тысячу граммов, центнер — сто килограммов, тонна — тысячу килограммов. Теперь дели на знаменатель.',
      ['Чтобы найти пятую часть центнера, переведи 100 кг в 100 000 г.','Раздели 100 000 на 5. Обратная проверка даёт 20 000 г · 5 = 100 000 г.'],
      'Центнер и тонна содержат одинаковое количество килограммов.','Почему одна и та же доля тонны тяжелее такой доли центнера?')
  ];
  const exact=n=>Number.isInteger(n)?n:String(n);
  const fmt=n=>String(n).replace('.',',');
  function bars(denominator){
    let product=1;
    return factors[denominator].map((n,index)=>{
      product*=n;let rectangles='';
      for(let k=0;k<n;k++)rectangles+='<rect x="'+(4+240*k/n)+'" y="4" width="'+(240/n-1)+'" height="15" fill="'+(k===0?'#2e7969':'#e5eee9')+'" stroke="#285b59"/>';
      const label=index===0?'Целое':('Выделенную часть ещё раз');
      return '<div><small>'+label+' делим на '+n+'. Закрашена доля 1/'+product+'.</small><svg viewBox="0 0 250 24" role="img" aria-label="Выбрана одна из '+n+' равных частей" style="width:100%;max-width:25rem;display:block">'+rectangles+'</svg></div>';
    }).join('');
  }
  function make(kind,seed,rand,step){
    const isLength=kind==='length',units=isLength?length:mass,unit=isLength?'мм':'г',source=isLength?printedLength:printedMass;
    const rows=source.map(([item,denominator])=>[item,seed?denominators[rand(0,denominators.length-1)]:denominator]);
    const targets=rows.map(([item,d],i)=>{
      const [name,,whole]=units[item],answer=whole/d,errors=[];
      for(const [value,text] of [[whole,'Сейчас у тебя величина целого. Раздели её на число равных частей.'],[d,'Это число частей. Нужно узнать величину одной.'],[whole*d,'Так величина увеличилась. Каждая часть меньше целого.'],[answer/1000,'Проверь единицы. В ответе нужны '+(isLength?'миллиметры.':'граммы.')]])if(value!==answer&&!errors.some(x=>x.value===value))errors.push({value:exact(value),text});
      const target=step(labels[i]+'. Вырази 1/'+d+' '+name+' в '+(isLength?'миллиметрах.':'граммах.'),exact(answer),'Целое содержит '+whole+' '+unit+'. Раздели на '+d+'. Можно ввести дробь.',errors);
      return {...target,answerFormat:'v5-unit-fraction'};
    });
    const end=targets.pop();return {...end,inputPrompt:isLength?'Длина, мм':'Масса, г',steps:targets,data:{partsOfUnits:{kind,rows}},conditionKey:kind+'/'+rows.map(pair=>pair.join('-')).join('/')};
  }
  function taskDrawing(task,scene){
    const data=task.data.partsOfUnits,units=data.kind==='length'?length:mass;
    const i=scene.mode==='learn'?Math.max(0,Math.min(5,Number(scene.step)||0)):5,[item,denominator]=data.rows[i];
    return '<p>Целое — '+units[item][1]+'. Отмеряем одну из '+denominator+' равных частей.</p>'+bars(denominator);
  }
  function explore(task,state){
    const {kind}=task.data.partsOfUnits,units=kind==='length'?length:mass,unit=kind==='length'?'мм':'г',row=units[state.unitChoice],d=denominators[state.portion];
    return {title:'Раздели целую единицу на равные части',controls:[{key:'unitChoice',title:'Целое',values:units.map((x,i)=>[i,x[1]])},{key:'portion',title:'Закрашенная доля',values:denominators.map((d,i)=>[i,'1/'+d])}],
      visual:'<p>'+row[1]+' = '+row[2]+' '+unit+'</p>'+bars(d),question:'Какова выделенная доля в '+(kind==='length'?'миллиметрах?':'граммах?'),answer:exact(row[2]/d),why:'Раздели '+row[2]+' на '+d+'. Получится '+fmt(row[2]/d)+' '+unit+'.'};
  }
  const bounds=()=>({unitChoice:[0,2,0],portion:[0,9,0]});
  function normalized(input){const value=String(input).trim();return /^\d{1,3}(?:[ \u00a0\u202f]\d{3})+$/.test(value)?value.replace(/[ \u00a0\u202f]/g,''):value;}
  const api={lessons,normalized,generators:{'5.18':(seed,rand,step)=>make('length',seed,rand,step),'5.19':(seed,rand,step)=>make('mass',seed,rand,step)},bounds:{'5.18':bounds(),'5.19':bounds()},taskDrawing,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5PartsOfUnits=api;
})(typeof window!=='undefined'?window:globalThis);

/* Виленкин и соавт., 2023, часть 2, п. 25, с. 9, №5.17, рис. 5.9. */
(function(root){
  'use strict';
  const letters=['F','K','N','C','D'];
  const lesson={number:'5.17',key:'printed-5-17',part:2,point:25,page:9,title:'Прочитай координаты по одной известной точке',requires:['v5f-printed-1-42'],related:[],
    explanation:'Найди начало луча O. До точки M отсчитай целые клетки. Известную координату M раздели на число этих клеток. С этой ценой клетки можно читать все остальные точки, включая середины клеток.',
    worked:['На другом луче точка с координатой 12 отстоит от нуля на три клетки. В одной клетке 4 единицы.','Четыре с половиной клетки дают 4 · 4 + 2 = 18.','Если одна точка правее другой, её координата на этом луче больше.'],
    misconception:'Все точки внутри одной клетки имеют одинаковую координату.',reflect:'Почему точка посередине между 28 и 32 имеет координату 30?'};
  const choices=[2,4,6,8,10];
  const labels={'С':'C','Д':'D','К':'K','Ф':'F','Н':'N','М':'M','О':'O'};
  function read(value){const s=String(value).trim().toUpperCase(),letter=labels[s]||s;return /^[CDFKMNO]$/.test(letter)?letter:null;}
  // Positions count half-cells, so both printed midpoints remain exact.
  function svg(ticks,unit,chosen,split){
    const xx=i=>16+i*7,points={O:0,K:ticks.K,M:10,C:ticks.C,F:ticks.F,N:ticks.N,D:ticks.D};
    let marks='';
    for(let i=0;i<=38;i+=split?1:2)marks+='<path d="M'+xx(i)+' '+(i%2?38:12)+'V'+(i%2?47:57)+'" stroke="'+(i%2?'#59737a':'#c4d4d5')+'" stroke-width="1"/>';
    let labels='';
    for(const [letter,value] of Object.entries(points)){
      const x=xx(value),active=chosen===letter;labels+='<circle cx="'+x+'" cy="43" r="'+(active?4.5:2.5)+'" fill="'+(active?'#a54929':'#214956')+'"/><text x="'+x+'" y="31" text-anchor="middle" font-size="12" font-weight="'+(active?'bold':'normal')+'">'+letter+'</text>';
    }
    return '<svg viewBox="0 0 300 75" role="img" class="v5q-printed-geometry" aria-label="Координатный луч. M на пятой клетке. Её координата '+5*unit+'." style="display:block;width:100%;max-width:40rem"><rect width="300" height="75" fill="#fff"/>'+marks+'<path d="M9 43H288M281 39L289 43L281 47" fill="none" stroke="#245d69" stroke-width="2"/><g fill="#143e48" font-family="sans-serif">'+labels+'<text x="16" y="68" text-anchor="middle" font-size="12">0</text><text x="'+xx(10)+'" y="68" text-anchor="middle" font-size="12">'+5*unit+'</text></g></svg>';
  }
  function generate(seed,rand,step){
    const unit=seed?choices[rand(0,4)]:4;
    const ticks=seed?{K:rand(2,6),C:rand(13,17),F:rand(21,25),N:rand(28,31),D:rand(34,36)}:{K:4,C:15,F:24,N:30,D:35};
    const number=k=>ticks[k]*unit/2;
    const steps=letters.map(k=>{
      const ans=number(k);
      return step('Координата точки '+k+' при M('+5*unit+').',ans,'В одной целой клетке '+unit+' единиц. Половина клетки даёт '+unit/2+'.',
        [{value:ticks[k]+'/2',text:'Это расстояние в клетках. Умножь число клеток на цену одной.'},{value:ans+unit,text:'Ты прибавил лишнюю клетку. Отсчитывай промежутки от нуля.'}]);
    });
    const pairs=seed&&rand(0,1)?[['F','K'],['N','D']]:[['K','C'],['C','D']];
    function compare(pair){
      const [a,b]=pair,win=ticks[a]>ticks[b]?a:b,other=win===a?b:a;
      return {...step('У какой точки координата больше, '+a+' или '+b+'? Запиши букву.',win,'Смотри, какая из двух точек расположена правее.'),
        answerFormat:'v5-ray-label',wrongLetter:other,rayReason:other+' левее '+win+'. Посмотри, куда направлена стрелка луча.'};
    }
    steps.push(compare(pairs[0]));const end=compare(pairs[1]);
    return {...end,inputPrompt:'Буква точки',steps,data:{markedRay:{unit,ticks}},conditionKey:'marked-ray/'+[unit,...letters.map(k=>ticks[k]),...pairs.flat()].join('/')};
  }
  function taskDrawing(task,scene){const {unit,ticks}=task.data.markedRay;return svg(ticks,unit,scene.mode==='learn'?letters[scene.step]:'',false);}
  function explore(task,state){
    const {unit,ticks}=task.data.markedRay,k=letters[state.point];
    return {title:'Проверь целые и половинки клетки',controls:[{key:'point',title:'Выделить точку',values:letters.map((k,i)=>[i,k])},{key:'halves',title:'Промежуточные штрихи',values:[[0,'Только целые клетки'],[1,'Показать половины']]}],
      visual:svg(ticks,unit,k,state.halves),question:'Проверь свою оценку. Чему равна координата выделенной точки '+k+'?',answer:ticks[k]*unit/2,why:'От O до '+k+' укладывается '+ticks[k]+' половинок. Каждая стоит '+unit/2+'.'};
  }
  const api={lesson,generate,taskDrawing,explore,read,bounds:{'5.17':{point:[0,4,0],halves:[0,1,0]}}};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5PrintedRay=api;
})(typeof window!=='undefined'?window:globalThis);

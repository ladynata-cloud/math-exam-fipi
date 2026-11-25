/* Open examples and separate, checkable classification for Vilenkin 5, part 2, §25, p. 8. */
(function(root){
  'use strict';
  const types=['окружность','круг','цилиндр','шар'];
  const items=[
    ['След круглой чашки на бумаге. Рассматриваем только замкнутую линию следа.','Линия по краю круглого медальона.','Граница круглой наклейки, проведённая тонким карандашом.'],
    ['Круглая бумажная этикетка. Рассматриваем всю плоскую закрашенную область с краем.','Рабочая поверхность круглого штемпеля, которая целиком оставляет отпечаток.','Круглая столешница, если смотреть на всю её верхнюю поверхность.'],
    ['Прямая восковая свеча с одинаковыми круглыми основаниями. Фитиль в модель не входит.','Прямая металлическая заготовка с двумя одинаковыми круглыми торцами.','Круглая прямая шайба сыра до того, как в ней вырезали кусок.'],
    ['Круглый пластилиновый шарик целиком.','Сплошная стеклянная бусина шаровой формы до сверления отверстия.','Снежок, скатанный в ровное круглое тело.']
  ];
  const clues=['Веди пальцем только по линии. Точка в центре на эту линию не попадает.',
    'Закрась всю плоскую область до края. Центр и край принадлежат этой фигуре.',
    'У тела два одинаковых параллельных круглых основания. Проверь оба торца.',
    'Представь всё тело целиком, включая середину. Поверхность изгибается со всех сторон.'];
  const lesson={number:'5.9',key:'printed-5-9',title:'Какая часть предмета похожа на фигуру?',part:2,point:25,page:8,requires:['v5f-printed-5-1'],related:['v5f-circle-shapes'],
    explanation:'Найди вокруг себя четыре предмета или их части. Для окружности обведи один край. Для круга покажи плоскую область целиком. У цилиндра найди два основания. Для шара покажи объёмное тело. У одного предмета можно рассмотреть разные части.',
    worked:['Возьми круглую коробку. Её верхнюю крышку можно обвести по самому краю. Получится окружность.','Если закрасить весь отпечаток крышки, получится круг. Если рассмотреть всю прямую коробку, её приближённая форма — цилиндр.','Записывая свой пример, добавь слова «край», «поверхность крышки» или «весь предмет». Так другой человек поймёт, что ты выбрал.'],
    misconception:'Край круглого предмета и вся его плоская сторона — одна и та же геометрическая фигура.',reflect:'Как один предмет может дать пример и окружности, и круга, и цилиндра?'};
  const aliases={'окружность':'окружность','окружности':'окружность','круг':'круг','круга':'круг','цилиндр':'цилиндр','цилиндра':'цилиндр','шар':'шар','шара':'шар','шаром':'шар','сфера':'сфера','сферы':'сфера','диск':'круг','диска':'круг','цилиндром':'цилиндр','окружностью':'окружность'};
  function read(input){return aliases[String(input).toLowerCase().trim().replace(/[.!?]+$/,'')]||null;}
  function words(i){
    const alternatives=types.filter(t=>t!==types[i]).concat('сфера');
    return alternatives.map(w=>({value:w,text:w==='сфера'&&i===3?'Сфера — внешняя поверхность. В этом задании выделен предмет с серединой, всем его объёмом.':i===0&&w==='круг'?'Ты выбрал заполненную область. В этом примере рассматривается только след края.':i===1&&w==='окружность'?'Окружность проходит по краю. Проверь, входит ли в рассматриваемую поверхность её середина.':i>=2&&['круг','окружность'].includes(w)?'Ты назвал плоскую фигуру. Здесь рассматривается объёмный предмет целиком.':clues[i]}));
  }
  function problem(i,index){return {prompt:items[i][index]+' Назови геометрическую форму одним словом.',answer:types[i],answerFormat:'v5-object-shape',inputPrompt:'Форма выбранной части',why:clues[i],hints:[clues[i]],errors:words(i),v6Full:true};}
  function generate(seed,random){
    const order=[0,1,2,3],indexes=order.map(()=>seed?random(0,2):0);
    if(seed)for(let i=3;i>0;i--){const j=random(0,i);[order[i],order[j]]=[order[j],order[i]];}
    const tasks=order.map(i=>problem(i,indexes[i])),final=tasks.pop();
    return {...final,prefix:seed?'Новая подборка примеров. ':'Авторская проверка к №5.9. ',steps:tasks,data:{roundObject:{order,indexes}},conditionKey:order.join('')+'/'+indexes.join(''),
      prompt:final.prompt+' В школьном номере придумай также четыре своих примера. Их можно записать в «Мои четыре примера».',
      errors:final.errors};
  }
  const palette={stroke:'#254d65',line:'#a5441e',paper:'#e6f4ec'};
  function figure(kind){
    const color=palette.stroke;
    let body='';
    if(kind<2){
      body='<circle cx="105" cy="78" r="54" stroke="'+palette.line+'" stroke-width="3" fill="'+(kind===0?'white':palette.paper)+'"/>';
      for(const [name,x,y] of [['O',105,78],['P',159,78],['Q',190,108]])body+='<circle cx="'+x+'" cy="'+y+'" r="3" fill="'+color+'"/><text x="'+(x+5)+'" y="'+(y-7)+'">'+name+'</text>';
    }else if(kind===2){
      body='<path d="M 49 49 V 107 A 51 18 0 0 0 151 107 V 49 Z" fill="'+palette.paper+'" stroke="none"/><path d="M 49 49 V 107 M 151 49 V 107" stroke="'+color+'" fill="none" stroke-width="2.5"/><ellipse cx="100" cy="49" rx="51" ry="18" stroke="'+color+'" fill="#ebd9a6" stroke-width="2"/><path d="M 49 107 A 51 18 0 0 1 151 107" fill="none" stroke="'+color+'" stroke-dasharray="4 4"/><path d="M 49 107 A 51 18 0 0 0 151 107" fill="none" stroke="'+color+'" stroke-width="2.5"/>';
    }else{
      body='<circle cx="105" cy="78" r="52" fill="#fadac1" stroke="'+color+'" stroke-width="2.5"/><path d="M 53 78 A 52 15 0 0 0 157 78" fill="none" stroke="'+color+'"/><path d="M 53 78 A 52 15 0 0 1 157 78" fill="none" stroke="'+color+'" stroke-dasharray="4 4"/>';
    }
    const label=['Тонкая линия с точками O, P и Q','Закрашенная область с точками O, P и Q','Тело с двумя круглыми основаниями','Круглое тело со всех сторон'][kind];
    return '<svg class="v5q-printed-geometry" role="img" aria-label="'+label+'" viewBox="0 0 220 150" style="display:block;width:100%;max-width:23rem;height:auto;margin:auto"><desc>'+clues[kind]+'</desc><rect width="220" height="150" fill="white"/><g font-family="sans-serif" font-size="16" fill="'+color+'">'+body+'</g></svg>';
  }
  function explore(task,state){
    const i=state.kind;
    return {title:'Покажи нужную часть',controls:[{key:'kind',title:'Что рассмотреть',values:[[0,'След от края крышки'],[1,'Отпечаток всей крышки'],[2,'Прямую круглую коробку'],[3,'Целый шарик']]}],
      visual:figure(i),question:i<2?'Сколько из трёх отмеченных точек принадлежат выделенной фигуре?':'Сколько плоских круглых оснований у этого тела?',
      answer:[1,2,2,0][i],why:['Только P лежит прямо на линии. O в середине, Q снаружи.','Две точки, O и P. Закрашенная область содержит и свой край.','Есть верхнее и нижнее основания. Задняя половина нижнего края показана пунктиром.','У шара нет плоских оснований. Линия посередине показывает положение экватора на поверхности.'][i]};
  }
  function taskDrawing(task,scene){const f=task.data.roundObject,step=scene.mode==='learn'?Math.min(scene.step||0,3):3;return figure(f.order[step]);}
  const api={lesson,generate,explore,taskDrawing,read,bounds:{'5.9':{kind:[0,3,0]}}};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5RoundObjects=api;
})(typeof window!=='undefined'?window:globalThis);

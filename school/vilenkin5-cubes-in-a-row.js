/* Виленкин и соавт., 2023, часть 2, §25, с. 9, №5.20. */
(function(root){
  'use strict';
  const lesson={number:'5.20',key:'printed-5-20',part:2,point:25,page:9,title:'Как далеко протянется ряд из кубиков?',requires:['v5f-printed-5-18'],related:[],
    explanation:'Сначала найди число кубиков вдоль одного ребра. Столько же помещается в ряд по глубине и столько же будет слоёв. Когда кубики выстроят в одну линию, нужна длина одного маленького ребра.',
    worked:['Если ребро большого куба 60 см, а маленького 20 см, вдоль ребра поместится 3 кубика.','В слое 3 · 3 = 9 кубиков. В трёх слоях 27 кубиков.','Ряд получится длиной 27 · 20 = 540 см. Проверь единицы до сравнения рядов.'],
    misconception:'Если кубик вдвое мельче по ребру, то весь ряд из кубиков вдвое короче.',reflect:'Одно ребро уменьшилось вдвое. Что изменилось сразу в трёх направлениях большого куба?'};
  const fmt=n=>String(n).replace('.',',');
  const cases=[[100,10,1],[100,20,10],[120,20,5],[200,20,5],[160,40,10],[180,30,10],[240,40,8]];
  function grid(n,unit,layer){
    const block=n>12?(n%10===0?10:n%5===0?5:n%4===0?4:n%3===0?3:2):1;
    const displayed=n/block;
    let lines='';
    for(let i=0;i<=displayed;i++){
      const x=20+90*i/displayed,y=12+90*i/displayed;lines+='<path d="M'+x+' 12V102 M20 '+y+'H110" fill="none" stroke="#375964" stroke-width="1"/>';
    }
    const color=layer?'#d2e6db':'#c2dde0';
    const stripCount=Math.min(6,n),stacks=Array.from({length:stripCount},(_,i)=>{
      const x=151+i*3,y=83-i*6;return '<path d="M'+x+' '+y+'l31 -13 32 8 -31 14Z" fill="'+(i===stripCount-1?'#6b9d89':color)+'" stroke="#315360" stroke-width="1.1"/>';
    }).join('');
    const annotation=block>1?'Крупный квадрат на плане объединяет '+block+' × '+block+' кубиков.':'Каждая клетка на плане — один кубик в слое.';
    return '<figure style="margin:.2rem 0"><svg class="v5q-printed-geometry" role="img" aria-label="Вид на слой сверху и схема стопки параллельных слоёв" viewBox="0 0 245 116" style="width:100%;max-width:33rem;display:block"><rect x="20" y="12" width="90" height="90" fill="'+color+'"/>'+lines+'<rect x="20" y="12" width="'+90/displayed+'" height="'+90/displayed+'" fill="#a54d2b" opacity=".55"/>'+stacks+'<text x="184" y="27" text-anchor="middle" font-size="12" fill="#173c49">слои</text></svg><figcaption>'+annotation+' Справа схема стопки. Высота всей стопки '+n*unit+' см, толщина каждого слоя '+unit+' см.</figcaption></figure>';
  }
  function generate(seed,rand,step){
    const [side,a,b]=cases[seed?rand(1,cases.length-1):0],n=side/a,m=side/b,firstCm=n**3*a,secondCm=m**3*b,first=firstCm/100,second=secondCm/100,ratio=(a/b)**2;
    const exact=value=>Number.isInteger(value)?value:String(value);
    const cubeStep=(prompt,ans,why,bad,msg)=>({...step(prompt,exact(ans),why,[{value:exact(bad),text:msg}]),answerFormat:'v5-unit-fraction'});
    const steps=[
      cubeStep('Первый куб имеет ребро '+side+' см. Его делят на маленькие кубики с ребром '+a+' см. Сколько их вдоль одного ребра?',n,'Дели длину большого ребра на длину маленького.',n*n,'Так получилось бы число кубиков во всём слое. Сейчас нужна одна сторона.'),
      cubeStep('Сколько маленьких кубиков получится из первого большого куба?',n**3,'Умножь число рядов, число кубиков в ряду и число слоёв.',n*n,'Получился один слой. Проверь, сколько таких слоёв в кубе.'),
      cubeStep('Первый комплект выстроили в ряд. Запиши длину в метрах.',first,'Сначала умножь число кубиков на '+a+' см. В одном метре 100 см.',n**3*a,'Ты указал сантиметры. Переведи всю длину ряда в метры.'),
      cubeStep('У второго большого куба то же ребро, а у маленького '+b+' см. Сколько маленьких кубиков теперь получается из всего куба?',m**3,'Посчитай число кубиков вдоль ребра, затем собери все одинаковые слои.',m*m,'Ты сосчитал кубики лишь на одной грани. Нужна вся стопка.'),
      cubeStep('Какова длина второго ряда в метрах?',second,'У каждого кубика в этом ряду ребро '+b+' см. Все размеры сравнивай в метрах.',m**3*b,'Получились сантиметры. В каждом метре их 100.'),
      {...step('Какой ряд короче? Введи номер ряда, 1 или 2.',1,'Сравни две длины после перевода в метры.'),errors:[{value:2,text:'У второго кубика ребро меньше, но таких кубиков набралось намного больше.'}]}
    ];
    return {prompt:'Во сколько раз первый ряд короче второго?',answer:ratio,inputPrompt:'Во сколько раз',steps,
      why:'Раздели длинный ряд на короткий. '+fmt(second)+' : '+fmt(first)+' = '+fmt(ratio)+'.',
      errors:[{value:m/n,text:'Ты сравнил рёбра кубиков. В рядах различается и количество кубиков.'},{value:exact((secondCm-firstCm)/100),text:'Получилась разность длин. Здесь нужно отношение.'}],
      data:{cubeRows:{side,a,b}},conditionKey:'cube-rows/'+[side,a,b].join('/')};
  }
  function taskDrawing(task,scene){
    const {side,a,b}=task.data.cubeRows,edge=scene.mode==='learn'&&scene.step<3?a:b;
    return '<p>Большой куб, ребро '+side+' см. Ребро маленького кубика '+edge+' см.</p>'+grid(side/edge,edge,false);
  }
  function explore(task,s){
    const {side,a,b}=task.data.cubeRows,edge=s.set===0?a:b,n=side/edge;
    return {title:'Один ряд, один слой, весь большой куб',controls:[{key:'set',title:'Какие кубики',values:[[0,'Первый комплект'],[1,'Второй комплект']]},{key:'what',title:'Что считать',values:[[0,'Кубики вдоль ребра'],[1,'Кубики в одном слое'],[2,'Кубики во всём кубе'],[3,'Длина всего ряда в метрах']]}],
      visual:grid(n,edge,s.what===1),question:['Сколько кубиков вдоль ребра?','Сколько кубиков лежит в одном слое?','Сколько кубиков во всех слоях?','Какой длины будет ряд, в метрах?'][s.what],
      answer:String([n,n*n,n**3,n**3*edge/100][s.what]),why:[side+' : '+edge+' = '+n+'.',n+' · '+n+' = '+n*n+'.',n*n+' кубиков в слое, '+n+' слоёв.',n**3+' кубиков по '+edge+' см. Переведи полученные сантиметры в метры.'][s.what]};
  }
  const api={lesson,generate,taskDrawing,explore,bounds:{'5.20':{set:[0,1,0],what:[0,3,1]}}};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5CubesInARow=api;
})(typeof window!=='undefined'?window:globalThis);

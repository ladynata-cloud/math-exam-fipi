/* Vilenkin et al., 2023, part 2, §25, ex. 5.14 on p. 8; clock on p. 7. */
(function(root){
  'use strict';
  const lesson={number:'5.14',key:'printed-5-14',title:'Передвинь минутную стрелку',part:2,point:25,page:8,requires:['v5f-printed-5-13'],related:['v5f-printed-5-13'],
    explanation:'Сначала найди длинную минутную стрелку. Один маленький промежуток — минута. Между соседними числами пять маленьких промежутков. Если идёшь назад через 12, время окажется в предыдущем часе. Каждый подпункт начинай с исходного времени.',
    worked:['Пусть сейчас 4:00. Передвинь минутную стрелку вперёд на два промежутка между соседними числами. Это 2 · 5 = 10 минут, получится 4:10.','Верни стрелки к 4:00. Сдвинь длинную назад на 10 минут. Она дойдёт до цифры 10. Короткая окажется между 3 и 4. Получится 3:50.'],
    misconception:'Если минутная стрелка проходит от цифры к следующей цифре, всегда проходит один час.',reflect:'Как по короткой стрелке проверить, в какой час попал при движении назад через 12?'};
  function clock(t){const u=((t%720)+720)%720;return (Math.floor(u/60)||12)+':'+String(u%60).padStart(2,'0');}
  function readTime(value){
    const s=String(value).toLowerCase().trim();
    const m=s.match(/^(\d{1,2})\s*[:.]\s*(\d{2})$/)||s.match(/^(\d{1,2})\s*ч(?:ас(?:а|ов)?)?\.?\s*(\d{1,2})\s*(?:м(?:ин(?:ут(?:а|ы|у)?)?)?\.?)?$/u);
    if(!m||Number(m[1])>23||Number(m[2])>59)return null;
    return clock((Number(m[1])%12)*60+Number(m[2]));
  }
  const positions=['а','б','в','г'];
  function targets(start,counts){
    return counts.map((n,i)=>{
      const forward=i<2,large=i===0||i===2,delta=n*(large?5:1)*(forward?1:-1),answer=clock(start+delta);
      const mistakes=[];
      for(const [t,text] of [[start-delta,'Проверь, куда двигать длинную стрелку: направление здесь меняет результат.'],[start+n*(forward?1:-1)*(large?1:5),large?'Взята одна минута за большое деление. Между соседними числами пять минут.':'Здесь считаются маленькие деления. Каждое соответствует одной минуте.'],[Math.floor(start/60)*60+(((start+delta)%60)+60)%60,'Минуты найдены. Проследи за короткой стрелкой при переходе через 12.']]){
        const value=clock(t);if(value!==answer&&!mistakes.some(m=>m.value===value))mistakes.push({value,text});
      }
      return {prompt:positions[i]+'. Начни с '+clock(start)+'. Минутная стрелка сдвигается '+(forward?'вперёд':'назад')+'; число '+(large?'больших':'маленьких')+' делений — '+n+'. Какое время получится?',answer,answerFormat:'v5-clock-time',inputPrompt:'Время, например 4:05',
        why:'Сдвиг равен '+Math.abs(delta)+' мин. От '+clock(start)+' '+(forward?'вперёд':'назад')+' получаем '+answer+'.',
        hints:[large?'Переведи большие деления в минуты. Потом учти направление.':'Отсчитай по одной минуте за маленькое деление. Учитывай час при переходе через 12.'],errors:mistakes,v6Full:true};
    });
  }
  function generate(seed,rand){
    const start=seed?(rand(0,11)*60+rand(0,11)*5):120,counts=seed?[rand(1,7),rand(8,37),rand(1,6),rand(10,54)]:[5,15,2,35];
    const tasks=targets(start,counts),last=tasks.pop();
    return {...last,prefix:seed?'Другой циферблат. ':'По циферблату печатного номера. ',steps:tasks,data:{clockMoves:{start,counts}},conditionKey:'clock/'+start+'/'+counts.join('-')};
  }
  function dial(time){
    const angle=v=>v*Math.PI/180,point=(degree,r)=>[110+r*Math.sin(angle(degree)),98-r*Math.cos(angle(degree))];
    const line=(p,q,color,width)=>'<line x1="'+p[0]+'" y1="'+p[1]+'" x2="'+q[0]+'" y2="'+q[1]+'" stroke="'+color+'" stroke-width="'+width+'" stroke-linecap="round"/>';
    let marks='';
    for(let i=0;i<60;i++)marks+=line(point(i*6,i%5?78:74),point(i*6,81),'#234654',i%5?1:2.5);
    for(let i=1;i<=12;i++){const xy=point(i*30,62);marks+='<text x="'+xy[0]+'" y="'+(xy[1]+5.5)+'" text-anchor="middle">'+i+'</text>';}
    const u=((time%720)+720)%720;
    marks+=line([110,98],point(u*0.5,43),'#26475e',6)+line([110,98],point((u%60)*6,69),'#a34120',3.5);
    return '<svg role="img" class="v5q-printed-geometry" aria-label="Аналоговые часы: '+clock(time)+'" viewBox="0 0 220 195" style="display:block;width:100%;max-width:20rem;height:auto;margin:auto"><rect width="220" height="195" fill="white"/><circle cx="110" cy="98" r="85" fill="#f7f6ed" stroke="#234654" stroke-width="2"/><g font-family="sans-serif" font-size="16" fill="#16384a">'+marks+'</g><circle cx="110" cy="98" r="4" fill="#16384a"/></svg>';
  }
  function taskDrawing(task){return dial(task.data.clockMoves.start);}
  function explore(task,s){const start=task.data.clockMoves.start,delta=s.ticks*(s.scale?5:1)*(s.back?-1:1);
    return {title:'Считай деления на циферблате',controls:[{key:'scale',title:'Что считать',values:[[0,'Маленькие промежутки'],[1,'Между соседними числами']]},{key:'back',title:'Направление',values:[[0,'Вперёд'],[1,'Назад']]},{key:'ticks',title:'Сколько делений',min:0,max:35,step:1}],
      visual:dial(start+delta)+'<p>Начало '+clock(start)+'. Длинная оранжевая стрелка показывает минуты, короткая синяя — часы.</p>',
      question:'На сколько минут длинная стрелка сдвинулась от исходного времени?',answer:Math.abs(delta),why:s.ticks+' · '+(s.scale?5:1)+' = '+Math.abs(delta)+' мин. На часах '+clock(start+delta)+'.'};
  }
  const api={lesson,generate,taskDrawing,explore,readTime,clock,bounds:{'5.14':{scale:[0,1,1],back:[0,1,0],ticks:[0,35,0]}}};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5ClockSteps=api;
})(typeof window!=='undefined'?window:globalThis);

/* Виленкин и соавторы, часть 2, §26, с. 17. */
(function(root){
  'use strict';
  const clock=typeof module!=='undefined'&&module.exports?require('./vilenkin5-clock-steps.js'):root.Vilenkin5ClockSteps;
  const lesson=(n,title,explanation,example,claim,reflect)=>({number:'5.'+n,key:'printed-5-'+n,part:2,point:26,page:17,title,requires:['v5f-printed-5-14'],related:['v5f-printed-5-14'],explanation,worked:[example],misconception:claim,reflect});
  const lessons=[
    lesson(72,'Доли минуты в секундах','В одной минуте 60 секунд. Чтобы найти одну равную долю, раздели эти секунды на число долей. Если сказано «часть от части», раздели ещё раз.','Половина трети минуты: сначала 60 : 3 = 20 секунд, затем 20 : 2 = 10 секунд.','Минуту надо делить как сотню, потому что в ней 100 секунд.','Что стало новым целым при втором делении?'),
    lesson(73,'Часть часа и часть суток','Сначала выбери целое. Час содержит 60 минут, сутки — 24 часа. Несколько полных часов складывают, а чтобы найти долю, минуты целого делят.','Треть суток — это 8 часов. В них 8 · 60 = 480 минут.','Половина суток и половина часа содержат одинаковое число минут.','В каком подпункте целым были сутки?'),
    lesson(74,'Часы и их отражение','Отражение меняет правую и левую стороны местами. Если мысленно сложить циферблат по линии от 12 до 6, концы каждой из двух стрелок совместятся со своими отражениями.','В зеркале 1:10. Минутная стрелка у цифры 2. На настоящих часах она у 10, значит, минут 50. Короткая стрелка ещё не дошла до 11. Время — 10:50.','У настоящих часов и их отражения всегда одинаковое число минут.','В каких двух положениях обе стрелки разом лежат на вертикальной оси?')
  ];
  const letters=['а','б','в','г','д','е'];
  function durations(number,seed,r,step){
    const seconds=number===72;
    const duration=(text,total,div1,div2=1)=>({text,total,div1,div2});
    let rows;
    if(seconds){
      const n=seed?r(2,6):1,total=n*60;
      const whole=n===1?'одной минуты':n+' мин';
      const ds=seed?[3,4,5,6,10,12,15,20]:[6,4,3,15,12];
      rows=Array.from({length:5},(_,i)=>{const k=ds[seed?(i+seed)%ds.length:i];return duration('1/'+k+' от '+whole,total,k);});
      const x=seed?[2,3,4][r(0,2)]:4,options=[2,5].filter(k=>total%(x*k)===0),y=seed?options[r(0,options.length-1)]:5;
      rows.push(duration('1/'+y+' от 1/'+x+' от '+whole,total,x,y));
    }else{
      const hours=seed?r(2,9):4,dayPart=seed?[2,3,4,6,8,12][r(0,5)]:2;
      const d=seed?[3,4,5,6,10,12]:[3,6,4,2];
      const h=(i)=>seed?d[(i+seed)%d.length]:d[i];
      rows=[duration(hours+' ч',60*hours,1),duration('1/'+h(0)+' часа',60,h(0)),duration('1/'+dayPart+' суток',1440,dayPart),...Array.from({length:3},(_,i)=>duration('1/'+h(i+1)+' часа',60,h(i+1)))];
    }
    const unit=seconds?'секунд':'минут',tasks=rows.map((v,i)=>{
      const result=v.total/v.div1/v.div2,errors=[];
      if(v.div2>1)errors.push({value:v.total/v.div1,text:'Ты нашёл первую долю. Теперь возьми указанную часть от неё.'});
      if(!seconds&&i===2)errors.push({value:60/v.div1,text:'Это часть часа. Здесь целым служат сутки, в них 24 часа.'});
      if(result!==v.total&&v.div2===1)errors.push({value:v.total,text:'Это всё исходное время. Найди только указанную долю.'});
      return step('Подпункт '+letters[i]+'. Дано: '+v.text+'. Сколько это '+unit+'?',result,'Сначала вырази целое в нужных единицах. '+v.total+(v.div1===1?'':' : '+v.div1)+(v.div2===1?'':' : '+v.div2)+' = '+result+'.',errors);
    });
    return {...tasks.pop(),steps:tasks,inputPrompt:seconds?'Число секунд':'Число минут',data:{durationMirror:{kind:'durations',number,unit,rows}},conditionKey:'durations/'+number+'/'+rows.map(v=>v.text).join('/')};
  }
  const reflect=t=>(720-t%720)%720;
  function mirrors(seed,r,step){
    const vals=seed?[r(1,11)*60,r(1,11)*60,r(1,11)*60,(r(0,11)*60+5*r(1,11)),(r(0,11)*60+5*r(1,11))]:[420,180,120,15,140];
    const tasks=vals.map((m,i)=>{
      const answer=clock.clock(reflect(m)),read=clock.clock(m),format=step((i===0?'Начни с примера на рисунке. ':'')+'В зеркале стрелки показывают '+read+'. Какое время на настоящих часах?',answer,'Отрази обе стрелки относительно линии 12–6. Минуты тоже меняют положение.',answer!==read?[{value:read,text:'Ты записал то, что видно в зеркале. Перенеси длинную и короткую стрелки на другую сторону вертикальной оси.'}]:[]);
      return {...format,answerFormat:'v5-clock-time',inputPrompt:'Время, например 4:05'};
    });
    const fixed={prompt:'Когда на 12-часовом циферблате настоящее и зеркальное время совпадают? Найди оба положения. В обоих случаях минутная стрелка показывает 00. Введи два часа от 1 до 12, начиная с меньшего, через точку с запятой.',answer:[6,12],answerFormat:'v5-list',inputPrompt:'Два часа, меньший первым',why:'При 6:00 и 12:00 обе стрелки лежат на вертикальной оси, и при отражении их положения сохраняются.',errors:[{value:[3,9],text:'Три и девять переходят друг в друга. Ищи время, которое после отражения остаётся на месте.'}]};
    const order=seed?[0,1,2,3,-1,4]:[0,1,2,3,4,-1],all=order.map(i=>i<0?fixed:tasks[i]);
    return {...all.pop(),steps:all,data:{durationMirror:{kind:'mirrors',vals,order}},conditionKey:'mirror/'+vals.join(',')};
  }
  function bar(v,unit){
    const ticks=(pieces)=>Array.from({length:pieces+1},(_,n)=>'<line x1="'+(8+n*192/pieces)+'" x2="'+(8+n*192/pieces)+'" y1="6" y2="27" stroke="#315463" stroke-width="1"/>').join('');
    const strip=(n)=>'<svg style="width:100%;max-width:340px;height:auto;display:block" role="img" aria-label="Одна часть из '+n+'" viewBox="0 0 208 34"><rect x="8" y="6" width="192" height="21" fill="#f3f7f4" stroke="#315463"/><rect x="8" y="6" width="'+(192/n)+'" height="21" fill="#8cc4b0"/>'+ticks(n)+'</svg>';
    return '<figure style="margin:.4em 0"><figcaption>'+v.text+'. Полная полоса — '+v.total+' '+unit+'.</figcaption>'+strip(v.div1)+(v.div2===1?'':'<p style="margin:.3em 0">Выделенная доля показана крупнее. Она стала целым для второй полосы.</p>'+strip(v.div2))+'</figure>';
  }
  function dial(m){return clock.taskDrawing({data:{clockMoves:{start:m}}});}
  function viewed(m,show){return '<figure style="margin:.4em 0"><figcaption>В зеркале видно '+clock.clock(m)+'. Ось отражения проходит от 12 до 6.</figcaption>'+dial(m)+(show?'<p>На настоящих часах стрелки занимают симметричные положения.</p>'+dial(reflect(m)):'')+'</figure>';}
  function draw(t,s){
    const p=t.data.durationMirror,i=s?.mode==='learn'?s.step:t.steps.length;
    if(p.kind==='durations')return bar(p.rows[i],p.unit);
    return p.order[i]>=0?viewed(p.vals[p.order[i]],false):'<figure style="margin:.4em 0"><figcaption>Мысленно сложи циферблат по линии 12–6. Найди два целых часа, при которых обе стрелки останутся на месте.</figcaption>'+dial(0)+'</figure>';
  }
  function explore(t,s){
    const p=t.data.durationMirror;
    if(p.kind==='durations'){const x=p.rows[s.index];return {title:'Раздели время на равные доли',controls:[{key:'index',title:'Подпункт',values:letters.map((k,i)=>[i,k])}],visual:bar(x,p.unit),question:'Сколько '+p.unit+' занимает выделенная часть последней полосы?',answer:x.total/x.div1/x.div2,why:'За начало счёта прими целую полосу и выполняй деления по порядку.'};}
    const m=p.vals[s.index],real=reflect(m);return {title:'Сопоставь положения стрелок',controls:[{key:'index',title:'Показание в зеркале',values:p.vals.map((v,i)=>[i,clock.clock(v)])},{key:'show',title:'Вид',values:[[0,'Только отражение'],[1,'Сравнить оба циферблата']]}],visual:viewed(m,s.show),question:'Сколько минут после целого часа показывают настоящие часы?',answer:real%60,why:'Смотри на длинную стрелку. Отражение отметки минут симметрично относительно линии 12–6.'};
  }
  const api={lessons,generators:{'5.72':(s,r,f)=>durations(72,s,r,f),'5.73':(s,r,f)=>durations(73,s,r,f),'5.74':mirrors},bounds:{'5.72':{index:[0,5,0]},'5.73':{index:[0,5,0]},'5.74':{index:[0,4,0],show:[0,1,0]}},draw,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5DurationMirror=api;
})(typeof window!=='undefined'?window:globalThis);

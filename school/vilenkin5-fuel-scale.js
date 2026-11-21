/* Vilenkin et al., 2023, part 2, §25, p. 8, ex. 5.13, fig. 5.8. */
(function(root){
  'use strict';
  const lesson={number:'5.13',key:'printed-5-13',title:'Прочитай шкалу бензобака',part:2,point:25,page:8,
    requires:['v5f-printed-5-10'],related:['v5f-printed-5-14'],
    explanation:'Найди две соседние подписанные отметки и разность между ними. Посчитай промежутки от одной подписи до следующей. Раздели разность на число промежутков. Теперь можно прочитать даже неподписанную отметку.',
    worked:['На другой шкале от 0 до 12 четыре одинаковых промежутка. В каждом 12 : 4 = 3 л.','Начни с отметки 12. Стрелка ещё на два промежутка правее — это 12 + 2 · 3 = 18 л.','Если долить 3 л, будет 21 л. В отдельном опыте, если из исходных 18 л потратить 6 л, останется 12 л.'],
    misconception:'Чтобы найти цену деления, нужно посчитать обе крайние черточки и все черточки между ними.',reflect:'Почему между пятью черточками всего четыре промежутка?'};
  function dial(unit,index,highlights){
    const point=(i,r)=>{const a=Math.PI*(1-i/16);return [110+r*Math.cos(a),116-r*Math.sin(a)];};
    const seg=(a,b,color,width)=>'<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" stroke="'+color+'" stroke-width="'+width+'" stroke-linecap="round"/>';
    let ticks='';for(let i=0;i<=16;i++){
      const major=i%4===0;
      ticks+=seg(point(i,major?83:87),point(i,96),major?'#173b50':'#396271',major?3:1.7);
      if(major){const a=point(i,72);ticks+='<text x="'+a[0]+'" y="'+(a[1]+4)+'" text-anchor="middle">'+unit*i+'</text>';}
    }
    if(highlights)for(let i=4;i<8;i++){
      const a=point(i+.08,101),b=point(i+.92,101);
      ticks+='<path d="M'+a.join(' ')+' A101 101 0 0 1 '+b.join(' ')+'" fill="none" stroke="#2f7d59" stroke-width="2.5"/>';
    }
    const start=[110,116],tip=point(index,84);
    return '<svg class="v5q-printed-geometry" role="img" aria-label="Шкала в литрах: стрелка на отметке '+index+' от нуля по счёту промежутков" viewBox="0 0 220 145" style="display:block;width:100%;max-width:24rem;height:auto;margin:auto"><rect width="220" height="145" fill="white"/><path d="M14 116 A96 96 0 0 1 206 116" fill="#eff5ef" stroke="#214858" stroke-width="2"/><g fill="#173b50" font-family="sans-serif" font-size="14">'+ticks+seg(start,tip,'#a44224',3.5)+'<circle cx="110" cy="116" r="5" fill="#173b50"/><text x="110" y="138" text-anchor="middle">литры</text></g></svg>';
  }
  function generate(seed,rand,step){
    const unit=seed?rand(2,6):5,initial=seed?rand(5,11):10,fuel=unit*initial,plus=seed?rand(1,16-initial):3,minus=seed?rand(2,initial):5;
    const steps=[
      step('а. Сколько литров приходится на один маленький промежуток между отметками?',unit,'Посчитай четыре промежутка между двумя соседними подписанными чертами. Раздели разность подписей на 4.',
        [{value:4*unit,text:'Это разность между подписями. Между ними четыре маленьких промежутка.'}]),
      step('Какой запас бензина в баке до обоих изменений? Прочитай положение стрелки.',fuel,'От ближайшей подписи двигайся по одному маленькому промежутку до стрелки. Деление считаем в литрах.',
        [{value:initial,text:'Ты указал число промежутков от нуля. Умножь его на число литров в одном промежутке.'}]),
      step('б(1). К исходному запасу долили '+(plus*unit)+' л. Какое показание получилось?',fuel+plus*unit,'При заправке запас увеличивается. К исходному показанию прибавь долитые литры.',
        [{value:fuel-plus*unit,text:'Так получилось бы при расходе топлива. При заправке стрелка сдвигается вправо.'}])
    ];
    return {prefix:seed?'Новая шкала. ':'Показания по рис. 5.8. ',data:{fuelScale:{unit,initial,plus,minus}},conditionKey:'fuel/'+[unit,initial,plus,minus].join('/'),steps,
      prompt:'б(2). Вернись к исходной стрелке. Из первоначального запаса израсходовали '+minus*unit+' л. Сколько литров останется?',
      answer:fuel-minus*unit,inputPrompt:'Запас после расхода, л',why:'Оба случая начинаются с '+fuel+' л. После расхода: '+fuel+' − '+minus*unit+' = '+(fuel-minus*unit)+' л.',
      errors:[{value:fuel+(plus-minus)*unit,text:'Ты продолжил от результата заправки. Здесь второй отдельный случай: начни снова с исходной стрелки.'},{value:fuel+minus*unit,text:'Запас уменьшился. Двигайся в сторону меньших показаний.'}]};
  }
  function taskDrawing(task){const x=task.data.fuelScale;return dial(x.unit,x.initial,0);}
  function explore(task,s){const x=task.data.fuelScale;return {title:'Передвинь стрелку по шкале',controls:[
    {key:'position',title:'Положение от нуля, в промежутках',min:0,max:16,step:1},{key:'marks',title:'Участок между двумя подписями',values:[[0,'Без выделения'],[1,'Выделить четыре промежутка']]}],
    visual:dial(x.unit,s.position,s.marks),question:'Какой запас в литрах показывает стрелка на этой модели?',answer:x.unit*s.position,why:'Один промежуток означает '+x.unit+' л. От нуля отсчитано '+s.position+'. Получается '+x.unit*s.position+' л.'};}
  const api={lesson,generate,taskDrawing,explore,bounds:{'5.13':{position:[0,16,10],marks:[0,1,0]}}};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5FuelScale=api;
})(typeof window!=='undefined'?window:globalThis);

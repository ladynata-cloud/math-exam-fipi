/* Виленкин и соавт., 5 класс, 2023, часть 2, §25, с. 10. Авторские схемы к №5.26–5.27. */
(function(root){
  'use strict';
  function lesson(number,title,explanation,worked,misconception,reflect){
    return {number,key:'printed-'+number.replace('.','-'),part:2,point:25,page:10,title,requires:[],related:[],explanation,worked,misconception,reflect};
  }
  const lessons=[
    lesson('5.26','Восстанови, сколько было сначала','Запиши три момента. Стрелка вправо показывает, что произошло. Чтобы вернуться влево, отмени это действие. После решения снова пройди вперёд.',
      ['На стол принесли 8 тетрадей, потом взяли 5. Осталось 17.','Перед тем как взяли 5, было 22. Перед тем как принесли 8, было 14.','Проверка: 14 + 8 − 5 = 17.'], 'Чтобы узнать начало по концу, достаточно выполнить те же два действия ещё раз.','Какой момент удаётся восстановить первым и почему?'),
    lesson('5.27','Реши четыре выражения по порядку','Деление и умножение без скобок выполняй слева направо. Если есть скобки, замени выражение внутри них одним числом. Затем закончи вычисление.',
      ['В выражении 72 : 6 · 3 первым получаем 12, затем 36.','В выражении 72 : (6 · 3) сначала получаем 18, затем 4.','Проверь деление обратным умножением.'], 'При одинаковых числах скобки никогда не меняют результата.','Как понять по записи, делим ли мы на одно число или на произведение?')
  ];
  function stories(seed){
    if(!seed)return [[22,13,-16],[47,-16,29]];
    const a=15+seed%23,b=5+seed%9,c=4+Math.floor(seed/2)%13;
    return [[a,b,-c],[a+26,-c,b+12]];
  }
  function op(n){return (n>0?'+ ':'− ')+Math.abs(n);}
  function timeline(row,back,focus,alsoHidden=-1){
    const [a,x,y]=row,values=[a,a+x,a+x+y],order=back?[2,1,0]:[0,1,2],ops=back?[-y,-x]:[x,y];
    const text=(x,y,t)=>'<text text-anchor="middle" x="'+x+'" y="'+y+'" fill="#173b3b" font-size="12">'+t+'</text>';
    const boxes=order.map((stage,i)=>'<rect x="'+(2+i*93)+'" y="22" width="54" height="30" rx="5" fill="'+(i===focus?'#ffd58c':'#ddede9')+'"/>'+text(29+i*93,42,(i===focus||i===alsoHidden)?'?':values[stage])+text(29+i*93,68,['Сначала','Потом','В конце'][stage])).join('');
    const links=ops.map((v,i)=>text(76+i*93,18,op(v))+'<path d="M'+(58+i*93)+' 37h32l-5 -4m5 4l-5 4" stroke="#36655b" fill="none"/>').join('');
    return '<svg viewBox="0 0 244 74" role="img" aria-label="Три момента, направление '+(back?'от конца к началу':'от начала к концу')+'" style="display:block;width:100%;max-width:27rem">'+boxes+links+'</svg>';
  }
  function storyTask(seed,rand,step){
    const rows=stories(seed),[a,x,y]=rows[0],[b,u,v]=rows[1],ducks=a+x+y,books=b+u+v;
    return {steps:[
      step('1. В конце на пруду '+ducks+' уток. Перед этим '+Math.abs(y)+' улетели. Сколько уток было на воде перед отлётом?',ducks-y,'Верни тех, кто улетел последними.',[{value:ducks+y,text:'Отлёт уже произошёл. Чтобы узнать предыдущее число, верни улетевших.'}]),
      step('Ещё раньше на пруд прилетели '+x+' уток. Сколько уток плавало до прилёта?',a,'Из восстановленного числа убери прилетевших.',[{value:a+2*x,text:'Мы возвращаемся к началу. Прилетевшие тогда ещё не сидели на воде.'}]),
      step('2. С полки взяли '+Math.abs(u)+' книг, после этого добавили '+v+'. В конце на полке '+books+'. Сколько стояло непосредственно перед добавлением?',books-v,'Убери последнее пополнение полки.',[{value:books+v,text:'Ты добавил книги повторно. Последнее поступление надо отменить.'}])],
      prompt:'Сколько книг было в самом начале, перед тем как взяли '+Math.abs(u)+'?',answer:b,inputPrompt:'Сначала на полке, книг',why:'На промежуточной полке '+(b+u)+'. Вернём '+Math.abs(u)+', получим '+b+'. Проверка: '+b+' '+op(u)+' '+op(v)+' = '+books+'.',
      errors:[{value:b+2*u,text:'Это ещё одно снятие книг. Чтобы восстановить прошлое, поставь снятые книги обратно.'}],data:{reverseStories:rows},conditionKey:'events/'+rows.flat().join('/')};
  }
  const firstRows=[[229372,286,506],[282370,302,85],[195840,32,18],[538,301608,426]];
  function orderRows(seed,r){
    if(!seed)return firstRows.map(row=>row.slice());
    const x=r(8,30),y=r(11,45),z=r(3,19),k=r(2,11);
    return [[x*y,y,z],[y*z*k,z,k],[x*y*z,x,y],[k,x*y,y]];
  }
  function pair(row,i){
    const [a,b,c]=row;
    return i===0?[a/b,a/b*c]:i===1?[a/b,a/b/c]:i===2?[b*c,a/(b*c)]:[b/c,a*(b/c)];
  }
  function expression(row,i){
    const [a,b,c]=row;
    return [a+' : '+b+' · '+c,a+' : '+b+' : '+c,a+' : ('+b+' · '+c+')',a+' · ('+b+' : '+c+')'][i];
  }
  function orderTask(seed,r,step){
    const rows=orderRows(seed,r),steps=[];
    rows.forEach((row,i)=>{
      const [first,answer]=pair(row,i),expr=expression(row,i),inner=i>=2;
      steps.push(step((i+1)+'. '+expr+'. Найди '+(inner?'число в скобках.':'результат первого действия.'),first,inner?'Сначала закончи действие внутри скобок.':'Начни с деления слева.',[]));
      if(i<3)steps.push(step('Закончи вычисление '+expr+'.',answer,'Подставь промежуточное число и выполни оставшееся действие.',[{value:first,text:'Пока получено промежуточное число. В выражении осталось второе действие.'}]));
    });
    return {steps,prompt:'4. Заверши выражение '+expression(rows[3],3)+'.',answer:pair(rows[3],3)[1],inputPrompt:'Значение четвертого выражения',why:'Число в скобках '+pair(rows[3],3)[0]+'. Умножь его на '+rows[3][0]+'.',errors:[{value:pair(rows[3],3)[0],text:'Это значение скобок. Перед ними остался множитель.'}],data:{orderRows:rows},conditionKey:'order/'+rows.flat().join('/')};
  }
  function exprPicture(row,i,focus){
    const [a,b,c]=row,v=pair(row,i)[0],steps=[v+' · '+c,v+' : '+c,a+' : '+v,a+' · '+v];
    return '<figure style="margin:.4em 0;padding:.5em;background:#ebf3ef;color:#183d36"><figcaption>'+ (focus?'Второе действие':'Начальная запись')+'</figcaption><strong style="font-size:1.1em">'+(focus?steps[i]:expression(row,i))+'</strong></figure>';
  }
  function taskDrawing(t,s){
    const i=s?.mode==='learn'?(s.step||0):t.steps.length;
    if(t.data.reverseStories){
      const row=t.data.reverseStories[i<2?0:1],focus=i%2===0?1:2;
      // Cover both unknown prior values until a learner has recovered the middle.
      return timeline(row,true,focus,i%2===0?2:-1);
    }
    const n=Math.min(3,Math.floor(i/2));return exprPicture(t.data.orderRows[n],n,i%2);
  }
  function explore(t,s){
    if(t.data.reverseStories){
      const row=t.data.reverseStories[s.story],[a,x,y]=row,values=[a,a+x,a+x+y],idx=s.back?2-s.focus:s.focus;
      return {title:'Пройди ход событий в обе стороны',controls:[{key:'story',title:'Сюжет',values:[[0,'Утки'],[1,'Книжная полка']]},{key:'back',title:'Направление',values:[[0,'Вперёд'],[1,'Назад']]},{key:'focus',title:'Пропуск на схеме',values:[[0,'Слева'],[1,'Посередине'],[2,'Справа']]}],visual:timeline(row,s.back,s.focus),question:'Какое число должно быть на месте вопроса?',answer:values[idx],why:'В прямом порядке получится '+values[0]+' '+op(x)+' '+op(y)+' = '+values[2]+'.'};
    }
    const row=t.data.orderRows[s.row],pairValues=pair(row,s.row);return {title:'Выбери выражение и действие',controls:[{key:'row',title:'Номер строки',values:[[0,'1'],[1,'2'],[2,'3'],[3,'4']]},{key:'operation',title:'Что вычислить',values:[[0,'Первое действие'],[1,'Второе действие']]}],visual:exprPicture(row,s.row,s.operation),question:s.operation?'Какое значение у всего выражения?':'Какой промежуточный результат получится?',answer:pairValues[s.operation],why:'Первый результат '+pairValues[0]+', итог '+pairValues[1]+'.'};
  }
  const api={lessons,generators:{'5.26':storyTask,'5.27':orderTask},bounds:{'5.26':{story:[0,1,0],back:[0,1,1],focus:[0,2,1]},'5.27':{row:[0,3,0],operation:[0,1,0]}},taskDrawing,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5ReverseCount=api;
})(typeof window!=='undefined'?window:globalThis);

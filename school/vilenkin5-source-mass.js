/* Vilenkin 5, first volume, point 5. The source quantities below match printed page 29. */
(function(root) {
  'use strict';
  const labels = ['т','ц','кг','г'];
  const grams = [1000000,100000,1000,1];
  const letters = 'абвгде';
  const original = {
    '1.130':[[4,0,200,0],[50,0,20,0],[1,7,0,0],[0,6,80,0],[9,4,30,0],[0,27,4,0]],
    '1.131':[[0,0,7,350],[0,0,12,30],[0,0,5,43],[0,0,102,0],[0,2,20,500],[0,3,3,70]],
    '1.132':[5982,4031], '1.133':[71500,3040], '1.134':[1230,503]
  };
  const descriptions = [
    ['1.130','Тонны и центнеры на весах','Представь каждую большую гирю набором килограммовых. Одна тонна заменяет тысячу таких гирь, центнер — сотню. К килограммам от больших гирь добавь отдельно указанные килограммы.','Для 2 т 4 ц 18 кг набираем 2000 кг, 400 кг и 18 кг. Всего 2418 кг.','К одному центнеру можно приравнять десять килограммов.'],
    ['1.131','От центнера и килограмма к грамму','Сначала объедини центнеры и килограммы. Переведи полученное число килограммов в граммы и добавь маленькую гирю, которая уже подписана в граммах.','1 ц 6 кг 7 г: в крупной части 106 кг. Вся масса равна 106 007 г.','Килограммы переводят в граммы умножением на сто.'],
    ['1.132','Полные килограммы и остаток в граммах','Отложи по тысяче граммов для каждого полного килограмма. После этого на чаше останется меньше тысячи граммов.','2806 г дают 2 полных килограмма и 806 г. Обратная сборка: 2 × 1000 + 806 = 2806.','Остаток после выделения полных килограммов может быть равен тысяче граммов.'],
    ['1.133','Полные тонны и остаток в килограммах','Узнай, сколько раз в массе поместится по 1000 кг. Это тонны. Оставшиеся килограммы добавляются к целым тоннам.','9607 кг можно отвезти как 9 т и ещё 607 кг.','Чтобы выделить тонны из килограммов, нужно группировать килограммы по сто.'],
    ['1.134','Полные центнеры и остаток в килограммах','Погрузи мешки по сто килограммов. Каждый полный мешок даёт центнер. То, что осталось после последнего полного мешка, запиши в килограммах.','735 кг: семь полных мешков по 100 кг и остаток 35 кг. Проверка: 700 + 35 = 735.','И для тонн, и для центнеров килограммы группируются по тысяче.']
  ];
  const lessons = descriptions.map(([number,title,explanation,example,misconception])=>({
    number,title,key:'printed-'+number.replace('.','-'),part:1,point:5,page:29,explanation,worked:[example],
    misconception,reflect:'Как из своего ответа собрать исходную массу и проверить единицы?',
    requires:['v5f-printed-1-83'],related:['v5f-printed-1-125']
  }));
  const factor=(from,to)=>grams[from]/grams[to];
  const notation=row=>row.map((q,i)=>q?q+' '+labels[i]:'').filter(Boolean).join(' ');
  const mass=(row,to)=>row.reduce((sum,q,i)=>sum+q*factor(i,to),0);
  const quantity=(target,text)=>({value:target,text});
  function conversions(number,to,seed,rand,step) {
    const rows=original[number].map(row=>row.map(value=>seed&&value?rand(1,Math.max(3,value+3)):value));
    const questions=rows.map((row,i)=>{
      const answer=mass(row,to), dropped=row.reduce((sum,q)=>sum+q,0);
      const units=row.map((q,unit)=>q?unit:null).filter(unit=>unit!==null);
      const errors=[];
      if(dropped!==answer) errors.push(quantity(dropped,'Ты сложил числа с разными единицами. Сначала замени каждую большую гирю равной массой в '+labels[to]+'.'));
      const first=units[0], onlyLarge=row[first]*factor(first,to);
      if(onlyLarge!==answer)errors.push(quantity(onlyLarge,'Крупнейшая гиря посчитана. Посмотри, какие ещё гири составляют эту массу.'));
      if(row[to]&&answer-row[to]!==onlyLarge)errors.push(quantity(answer-row[to],'Маленькая гиря уже подписана в нужных единицах. Прибавь и её.'));
      return step(letters[i]+'. Как записать массу '+notation(row)+' одним числом в '+labels[to]+'?',answer,'Для каждого слагаемого умножь число больших единиц на число маленьких в одной большой. Затем сложи.',errors);
    });
    const last=questions.at(-1);
    return {prompt:last.prompt,inputPrompt:'Масса, '+labels[to],answer:last.answer,steps:questions.slice(0,-1),errors:last.errors,
      table:{caption:'Гири для каждой строки',headers:['Пункт','Состав массы'],rows:rows.map((row,i)=>[letters[i],notation(row)])},
      conditionKey:number+'/'+rows.map(r=>r.join(':')).join('/'),data:{massGroups:{rows,to}}};
  }
  function splits(number,large,small,seed,rand,step) {
    const group=factor(large,small);
    const totals=original[number].map(x=>seed?rand(2,Math.max(8,Math.floor(x/group)+5))*group+rand(1,group-1):x);
    const questions=totals.map((total,i)=>{
      const q=Math.floor(total/group),r=total%group;
      const prompt=letters[i]+'. Распредели '+total+' '+labels[small]+' на полные '+labels[large]+' и оставшиеся '+labels[small]+'. Запиши два числа через точку с запятой сначала для большей, затем для меньшей единицы.';
      return {...step(prompt,[q,r],'Проверь оба условия: остаток меньше '+group+', а первая часть, умноженная на '+group+', вместе с остатком даёт '+total+'.',[
        ...(r===q?[]:[quantity([r,q],'Числа поменялись местами. Сначала нужны полные '+labels[large]+', затем остаток в '+labels[small]+'.')]),
        quantity([q,total],'Ты правильно нашёл полные группы. Для остатка вычти их массу из первоначальной.')
      ]),answerFormat:'v5-list'};
    });
    const last=questions[1];
    return {prompt:last.prompt,inputPrompt:labels[large]+'; '+labels[small],answer:last.answer,answerFormat:'v5-list',steps:[questions[0]],errors:last.errors,
      table:{caption:'Масса до разделения',headers:['Пункт','Масса'],rows:totals.map((value,i)=>[letters[i],value+' '+labels[small]])},
      conditionKey:number+'/'+totals.join('/'),data:{massSplit:{totals,large,small,group}}};
  }
  const generators={
    '1.130':(s,r,step)=>conversions('1.130',2,s,r,step),
    '1.131':(s,r,step)=>conversions('1.131',3,s,r,step),
    '1.132':(s,r,step)=>splits('1.132',2,3,s,r,step),
    '1.133':(s,r,step)=>splits('1.133',0,2,s,r,step),
    '1.134':(s,r,step)=>splits('1.134',1,2,s,r,step)
  };
  const select=(key,title,text)=>({key,title,values:text.map((name,i)=>[i,name])});
  function explore(lesson,state,task,table){
    const d=task.data,conversion=d.massGroups;
    const controls=[select('row','Строка задания',Array.from(letters.slice(0,conversion?6:2))),{key:'extra',title:'Добавь малых единиц',min:0,max:9,step:1}];
    if(conversion) {
      const row=conversion.rows[state.row].slice();row[conversion.to]+=state.extra;
      const to=conversion.to,items=row.flatMap((q,i)=>q?[[q+' '+labels[i],i===to?'уже в '+labels[to]:q+' × '+factor(i,to)+' '+labels[to]]]:[]);
      return {title:'Собери массу на чаше весов',controls,visual:table('Сколько весят гири',['Гиря','Перевод'],items),
        question:'Все эти гири вместе весят сколько '+labels[to]+'?',answer:mass(row,to),
        why:'Сложи переведённые массы, включая гирю, уже подписанную в нужной единице.'};
    }
    const {totals,large,small,group}=d.massSplit,total=totals[state.row]+state.extra;
    controls.push(select('ask','Что найти',['Полные группы','Остаток']));
    return {title:'Уложи массу полными группами',controls,
      visual:table('Условия упаковки',['На весах','Размер полной группы'],[[total+' '+labels[small],'1 '+labels[large]+' = '+group+' '+labels[small]]]),
      question:state.ask?'Сколько '+labels[small]+' осталось после заполнения всех полных групп?':'Сколько полных групп по '+group+' '+labels[small]+' можно наполнить?',
      answer:state.ask?total%group:Math.floor(total/group),
      why:state.ask?'Вычти массу всех полных групп. Остаток должен быть меньше одной группы.':'Возьми целую часть частного. Неполная группа в этот ответ не входит.'};
  }
  const bounds={};
  for(const lesson of lessons)bounds[lesson.number]=lesson.number==='1.130'||lesson.number==='1.131'?{row:[0,5,0],extra:[0,9,0]}:{row:[0,1,0],extra:[0,9,0],ask:[0,1,0]};
  const api={lessons,generators,bounds,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5SourceMass=api;
})(typeof window!=='undefined'?window:globalThis);

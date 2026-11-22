/* First volume, point 5, page 30. Four arithmetic columns and an open multiplication table. */
(function(root){
  'use strict';
  const letters='абвг',signs=['+','−','×','÷'];
  const printed=[[[17,15],[39,14],[57,43],[46,0]],[[23,17],[42,16],[81,46],[72,53]],[[12,5],[39,2],[14,0],[83,1]],[[360,6],[450,5],[560,8],[111,1]]];
  const modelNames=['Слагаемые','Уменьшаемое и вычитаемое','Равные группы','Деление поровну'];
  const lessons=[
    {number:'1.141',title:'Четыре действия над натуральными числами',explanation:'Сначала найди знак действия. При сложении число увеличивается на добавленное, при умножении складываются равные группы. Вычитание проверяют сложением, деление — умножением.',example:'Для 28 + 15 прибавь сначала десяток, затем пять. Для 28 × 3 сложи три группы по 28.'},
    {number:'1.142',title:'Множители и произведение в восьми столбцах',explanation:'Проверяй в каждом столбце одно равенство. Если известны оба множителя, умножь их. Если известны произведение и один множитель, найди второй делением. Когда данных меньше, можно сделать свой выбор.',example:'Если известно только произведение 24, подходят и 3 × 8, и 4 × 6. Если один множитель уже равен 4, подходящий второй множитель равен 6.'}
  ].map(x=>({...x,key:'printed-'+x.number.replace('.','-'),worked:[x.example],part:1,point:5,page:30,misconception:'К любому положительному произведению подходит только одна пара натуральных множителей.',reflect:'Каким обратным действием можно проверить результат?',requires:['v5f-printed-1-59'],related:['v5f-printed-1-124']}));
  const compute=(kind,[a,b])=>kind===0?a+b:kind===1?a-b:kind===2?a*b:a/b;
  const expr=(kind,[a,b])=>a+' '+signs[kind]+' '+b;
  function changed(kind,i,r){
    if(kind===0)return [r(12,92),i===3?0:r(11,48)];
    if(kind===1){const b=r(12,48);return [b+r(3,45),b];}
    if(kind===2)return [r(8,94),i===2?0:i===3?1:r(2,8)];
    const b=i===3?1:r(3,9);return [b*r(12,95),b];
  }
  function arithmetic(seed,r,step){
    const groups=printed.map((rows,k)=>rows.map((pair,i)=>seed?changed(k,i,r):pair.slice()));
    const order=seed?[0,1,2,3].slice(seed%4).concat([0,1,2,3].slice(0,seed%4)):[0,1,2,3];
    const questions=order.map(k=>{
      const g=groups[k],answer=g.map(pair=>compute(k,pair)),alternatives=g.map(([a,b])=>k===0?a-b:k===1?a+b:k===2?a+b:a*b);
      return {...step('Столбик '+letters[k]+'. Вычисли по строкам: '+g.map(pair=>expr(k,pair)).join(', ')+'. Запиши четыре результата через точку с запятой.',answer,['Разложи второе слагаемое на десятки и единицы.','Начни с десятков, затем вычти единицы.','Множитель показывает число равных групп. Ноль групп даёт ноль предметов.','Проверь каждый ответ умножением на делитель.'][k],[{value:alternatives,text:'Результаты соответствуют другому действию. В этом столбике стоит знак '+signs[k]+'.'}]),answerFormat:'v5-list'};
    });
    const last=questions.pop();
    return {prompt:last.prompt,inputPrompt:'Четыре результата по порядку',answer:last.answer,answerFormat:'v5-list',steps:questions,errors:last.errors,conditionKey:groups.flat(2).join('/'),data:{opRows:groups},table:{caption:'Четыре отдельных столбика',headers:['Действие','Четыре примера сверху вниз'],rows:groups.map((rows,k)=>[letters[k]+' · '+signs[k],rows.map(p=>expr(k,p)).join(', ')])}};
  }
  function tableTask(seed,r,step){
    const pairs=seed?Array.from({length:8},(_,i)=>[r(i>4?2:3,i>4?11:26),r(2,19)]):[[26,4],[12,8],[33,2],[4,23],[18,3],[7,10],[5,19],[2,23]];
    const masks=[[1,1,0],[0,1,1],[1,0,1],[0,1,1],[1,0,1],[0,1,0],[0,0,1],[0,0,1]];
    const complete=pairs.map(([a,b])=>[a,b,a*b]),cols=complete.map((v,i)=>v.map((n,k)=>masks[i][k]?n:null));
    const steps=cols.map((column,i)=>{
      const why=i===5?'Выбери первый множитель сам. Умножь его на уже заданный второй множитель.':i>=6?'Подбери любую пару множителей с указанным произведением. Можно начать с 1 и самого произведения.':'Сохрани заполненные значения на своих местах. Проверка столбца: первый множитель × второй множитель = произведение.';
      return {...step('Столбец '+(i+1)+'. '+(i===5?'Один множитель известен. Два остальных числа подбери сам. ':i>=6?'Известно только произведение. Выбери собственную подходящую пару множителей. ':'Восстанови пропущенное число. ')+'Введи три числа: первый множитель; второй множитель; произведение.',complete[i],why),answerFormat:'v5-triple',columnRules:column,columnOperation:'multiply'};
    });
    const last=pairs.at(-1),total=last[0]*last[1];
    return {prefix:'Читай таблицу по одному столбцу. Знак ? означает пустую клетку. ',prompt:'В последнем столбце произведение равно '+total+'. Для дополнительной проверки выбери первым множителем '+last[0]+'. Каким будет второй множитель?',inputPrompt:'Второй множитель при указанном выборе',answer:last[1],steps,errors:[{value:total-last[0],text:'Вычитание восстанавливает слагаемое. Здесь нужно узнать, сколько раз первый множитель помещается в произведении.'}],conditionKey:cols.map(c=>c.map(x=>x??'_').join(':')).join('/'),data:{multiplyColumns:cols},table:{caption:'Столбцы учебной таблицы показаны по строкам',headers:['№','Множители','Итог'],rows:cols.map(([a,b,p],i)=>[String(i+1),(a??'?')+' × '+(b??'?'),String(p??'?')])}};
  }
  function shaded(kind,a,b){
    const size=kind===0?a+b:kind===1?a:kind===2?a*b:a,portion=kind===0?a:kind===1?a-b:kind===2?a:(a/b);
    const fill=size?Math.max(0,Math.min(210,210*portion/size)):0;
    const label=kind===0?'Вместе две части':kind===1?'Остаток и снятая часть':kind===2?'Одна группа и все группы':'Одна доля и всё количество';
    return '<svg role="img" viewBox="0 0 270 68" aria-label="'+label+'"><text x="10" y="18" style="font:15px sans-serif">'+label+'</text><rect x="12" y="29" width="210" height="16" fill="#e2e8df" stroke="#56665d"/><rect x="12" y="29" width="'+fill+'" height="16" fill="#5c9181"/>'+(size===0?'<text x="12" y="63" style="font:14px sans-serif">Нет ни одной группы</text>':'')+'</svg>';
  }
  function explore(l,s,t,table){
    if(t.data.opRows){
      const [a,b]=t.data.opRows[s.column][s.row],kind=s.column;
      return {title:modelNames[kind],controls:[{key:'column',title:'Столбик',values:[...letters].map((x,i)=>[i,x+' · '+signs[i]])},{key:'row',title:'Строка',values:[1,2,3,4].map((n,i)=>[i,n])}],visual:shaded(kind,a,b),question:'Сколько получится при действии '+expr(kind,[a,b])+'?',answer:compute(kind,[a,b]),why:['К первому числу прибавь второе.','Вычти второе число из первого.','Одна группа содержит '+a+' предметов. Возьми '+b+' таких групп.','Раздели всё количество на '+b+' равных долей.'][kind]};
    }
    const col=t.data.multiplyColumns[s.column],a=col[0]??s.left,b=col[1]??s.right;
    const controls=[{key:'column',title:'Столбец',values:t.data.multiplyColumns.map((_,i)=>[i,i+1])}];
    if(col[0]===null)controls.push({key:'left',title:'Первый множитель',min:0,max:500,step:1});
    if(col[1]===null)controls.push({key:'right',title:'Второй множитель',min:0,max:500,step:1});
    return {title:'Подбери множители',controls,visual:table('Проверка выбранной пары',['Первый','Второй','Задано'],[[a,b,col[2]??'?']]),question:'Какое произведение дают выбранные множители '+a+' и '+b+'?',answer:a*b,why:'Равенство для твоей пары: '+a+' × '+b+' = '+(a*b)+'. '+(col[2]===null?'Это число можно вписать в свободную клетку.':col[2]===a*b?'Пара согласуется с таблицей.':'Заданное произведение другое. Выбери другой свободный множитель.')};
  }
  const generators={'1.141':arithmetic,'1.142':tableTask},bounds={'1.141':{column:[0,3,0],row:[0,3,0]},'1.142':{column:[0,7,0],left:[0,500,1],right:[0,500,1]}};
  const api={lessons,generators,bounds,explore};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5NaturalOperationRows=api;
})(typeof window!=='undefined'?window:globalThis);

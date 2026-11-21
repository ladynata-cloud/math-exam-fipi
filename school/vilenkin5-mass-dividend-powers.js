/* Виленкин и соавторы, 2023, 5 класс, часть 2, §25, с. 11, №5.37–5.39. Для №5.39 сверены также ответы на с. 172. */
(function(root){
  'use strict';
  function lesson(n,title,requires,explanation,worked,misconception,reflect){
    return {number:'5.'+n,key:'printed-5-'+n,part:2,point:25,page:11,title,requires,related:[],explanation,worked,misconception,reflect};
  }
  const lessons=[
    lesson(37,'От одного литра к массе полного бака',['v5f-volume-litres'],'Вместимость отвечает на вопрос «сколько литров?». Чтобы узнать массу жидкости, запиши, сколько весит один литр, и сосчитай одинаковые порции. Затем выбери единицу массы.',
      ['Один литр подсолнечного масла весит в нашем примере 920 г. Пять литров весят 920 · 5 = 4600 г.','В 4600 г содержатся четыре полные тысячи граммов и ещё 600 г. Масса масла — 4 кг 600 г.'],
      'Один литр любой жидкости весит ровно один килограмм.','Почему для массы бака с бензином понадобилось бы знать ещё и массу пустого бака?'),
    lesson(38,'Собери делимое из частного и остатка',['v5f-printed-5-35'],'Соедини все полные группы. Затем верни то, что осталось отдельно. Чтобы проверить себя, мысленно разложи полученное число обратно по группам.',
      ['Есть 14 полных пачек по 12 наклеек и ещё 5 наклеек. В пачках 168 наклеек.','Всего 173 наклейки. При делении 173 на 12 получаем частное 14 и остаток 5.'],
      'Остаток нужно умножить на делитель вместе с частным.','Что произойдёт с частным, если остаток окажется равным делителю?'),
    lesson(39,'Скобки и степени в четырёх вычислениях',['v5f-printed-5-27'],'Обведи группы с собственным порядком действий. В скобках сначала вычисли степени, а за скобками пока ничего не меняй. После проверки выражения в скобках вернись к внешнему действию.',
      ['(5³ − 3³)²: сначала 125 и 27, затем 98. Теперь в квадрат возводится всё число 98.','24 : 6 · 5 = 4 · 5. Если между делением и умножением нет скобок, выполняй их слева направо.'],
      'Квадрат разности всегда равен разности квадратов.','Как отличить показатель степени внутри скобок от показателя после закрывающей скобки?')
  ];
  function mass(seed,r,step){
    const litres=seed?r(12,98):85,gramsPerLitre=seed?25*r(28,34):750,grams=litres*gramsPerLitre,kg=Math.floor(grams/1000),rest=grams%1000;
    return {steps:[step('В бак входит '+litres+' л. Один литр бензина имеет массу '+gramsPerLitre+' г. Сколько граммов бензина в полном баке?',grams,'Умножь число литров на массу одного литра.',[{value:litres*1000,text:'Ты взял 1000 г для каждого литра. В этом условии для одного литра дана другая масса.'}]),
      step('Сколько полных килограммов содержится в '+grams+' г?',kg,'Сосчитай полные группы по 1000 граммов.',[{value:grams,text:'Это масса в граммах. В одном килограмме 1000 г.'}])],
      prompt:'Полный бак вмещает '+litres+' л бензина по '+gramsPerLitre+' г за литр. Запиши массу одного бензина в целых килограммах и оставшихся граммах. Если остатка нет, укажи 0.',inputPrompt:'Килограммы; граммы',answer:[kg,rest],answerFormat:'v5-pair',errors:[{value:[rest,kg],text:'Сначала запиши полные килограммы, затем граммы сверх них.'}],why:grams+' г = '+kg+' кг '+rest+' г.',data:{tankMass:{litres,gramsPerLitre}},conditionKey:'fuel-mass/'+litres+'/'+gramsPerLitre};
  }
  function dividend(seed,r,step){
    const b=seed?r(12,98):93,q=seed?r(34,515):446,rem=seed?r(1,b-1):2,packed=b*q;
    return {steps:[step('Делитель b = '+b+', неполное частное q = '+q+', остаток r = '+rem+'. Сколько единиц пришлось на все полные группы?',packed,'Каждая из '+q+' групп содержит '+b+' единиц.',[{value:b+q,text:'Группы одинакового размера. Вместо сложения двух подписей умножь размер группы на их число.'}])],
      prompt:'Восстанови делимое a, если b = '+b+', q = '+q+' и r = '+rem+'.',answer:packed+rem,inputPrompt:'Делимое a',errors:[{value:packed,text:'Ты учёл полные группы. Добавь остаток за последней группой.'},{value:b*(q+rem),text:'Остаток — отдельные единицы, его не умножают на размер группы.'}],why:'a = b · q + r = '+b+' · '+q+' + '+rem+' = '+(packed+rem)+'. Остаток меньше '+b+'.',data:{dividend:{b,q,rem}},conditionKey:'dividend/'+b+'/'+q+'/'+rem};
  }
  function recipe(seed,r){
    if(!seed)return [[7055,60,49610,82,104],[2175289,865439,536,2429],[14,7],[9,6]];
    const d=r(6,28),u=r(8,42),k=r(70,135),j=r(15,35),total=k*j,x=r(15,total-6),a=r(4,18),b=r(2,a-1),c=r(4,13),f=r(1,c-1);
    // Make (a³ + b³)/(a − b) integral by choosing a = 2b in this row.
    return [[r(23,176),r(7,22),d*u,d,r(5,26)],[x,total-x,j,r(10,k-1)],[2*b,b],[c,f]];
  }
  function rowData(rows,i){
    const [a,b,c,d,e]=rows[i];
    if(i===0)return {formula:a+' · '+b+' + '+c+' : '+d+' · '+e,labels:['Первое произведение','Частное во второй цепочке','Второе слагаемое','Всё выражение'],values:[a*b,c/d,c/d*e,a*b+c/d*e],clues:['Умножь первые два числа.','Вторую цепочку начни с деления слева.','Умножь частное на последний множитель.','Сложи два слагаемых.']};
    if(i===1)return {formula:'('+a+' + '+b+') : '+c+' − '+d,labels:['Сумма в скобках','Частное','Всё выражение'],values:[a+b,(a+b)/c,(a+b)/c-d],clues:['Сначала выполни сложение в скобках.','Раздели сумму на делитель.','Вычти последнее число из частного.']};
    if(i===2)return {formula:'('+a+'³ + '+b+'³) : ('+a+' − '+b+')',labels:['Куб первого числа','Куб второго числа','Сумма кубов','Делитель','Всё выражение'],values:[a**3,b**3,a**3+b**3,a-b,(a**3+b**3)/(a-b)],clues:['Перемножь три равных множителя.','Перемножь три равных множителя.','Сложи уже вычисленные кубы.','Посчитай разность только в правых скобках.','Раздели сумму в левых скобках на разность в правых.']};
    return {formula:'('+a+'³ − '+b+'³)²',labels:['Куб первого числа','Куб второго числа','Разность в скобках','Квадрат всей разности'],values:[a**3,b**3,a**3-b**3,(a**3-b**3)**2],clues:['Куб — это три равных множителя.','Куб — это три равных множителя.','Вычти второй куб из первого.','Теперь возведи в квадрат всю найденную разность.']};
  }
  const letters=['а','б','в','г'];
  function powers(seed,r,step){
    const rows=recipe(seed,r),steps=[];
    rows.forEach((row,i)=>{const v=rowData(rows,i);v.values.forEach((val,j)=>{if(i===3&&j===v.values.length-1)return;
      const last=j===0?null:v.values[j-1];steps.push(step(letters[i]+'. '+v.formula+'. '+v.labels[j]+'?',val,v.clues[j],last!==null&&last!==val?[{value:last,text:'Это результат предыдущего действия. '+v.clues[j]}]:[]));});});
    const v=rowData(rows,3);return {steps,prompt:'г. Доведи вычисление до конца: '+v.formula+'.',answer:v.values.at(-1),inputPrompt:'Значение выражения',errors:[{value:v.values[2],text:'Это значение скобок. Снаружи стоит квадрат — перемножь два таких числа.'}],why:v.values[2]+' · '+v.values[2]+' = '+v.values[3]+'.',data:{orderWithPowers:rows},conditionKey:'order-with-powers/'+rows.join('/')};
  }
  function cells(parts){
    return '<figure style="margin:.5em 0"><div style="display:flex;gap:.35em;flex-wrap:wrap">'+parts.map(p=>'<span style="padding:.4em .55em;border:1px solid #527a77;border-radius:.3em;background:#e8f3ef">'+p+'</span>').join('')+'</div></figure>';
  }
  function drawing(t,s){
    if(t.data.tankMass){const {litres,gramsPerLitre}=t.data.tankMass;return cells(['1 л — '+gramsPerLitre+' г',litres+' л — ? г','1000 г — 1 кг']);}
    if(t.data.dividend){const {b,q,rem}=t.data.dividend;return cells([q+' полных групп','по '+b+' в каждой','ещё '+rem+' отдельно']);}
    let index=s?.mode==='learn'?s.step:t.steps.length;
    for(let i=0;i<4;i++){const v=rowData(t.data.orderWithPowers,i);if(index<v.values.length)return cells([v.formula,'Найди: '+v.labels[index]]);index-=v.values.length;}
  }
  function explore(t,s){
    if(t.data.tankMass){const {gramsPerLitre}=t.data.tankMass,l=s.litres,g=l*gramsPerLitre;return {title:'Сколько весит бензин?',controls:[{key:'litres',title:'Литры бензина',min:1,max:100,step:1}],visual:cells(['1 л — '+gramsPerLitre+' г','Таких порций: '+l]),question:'Сколько граммов бензина в выбранном количестве литров?',answer:g,why:l+' · '+gramsPerLitre+' = '+g+' г.'};}
    if(t.data.dividend){const {b,q,rem}=t.data.dividend,groups=q+s.extra;return {title:'Пересобери делимое',controls:[{key:'extra',title:'Сколько полных групп взять',values:[[0,String(q)],[1,String(q+1)],[2,String(q+2)]]}],visual:cells([groups+' групп по '+b,'Осталось '+rem]),question:'Каким стало делимое при том же остатке?',answer:groups*b+rem,why:'Каждая дополнительная полная группа увеличивает делимое на '+b+'.'};}
    const v=rowData(t.data.orderWithPowers,s.row),j=s.focus===0?0:v.values.length-1;return {title:'От первого вычисления к ответу',controls:[{key:'row',title:'Выражение',values:letters.map((l,i)=>[i,l])},{key:'focus',title:'Что найти',values:[[0,'Первый шаг'],[1,'Итог']]}],visual:cells([v.formula,v.labels[j]]),question:'Каков результат выбранного вычисления?',answer:v.values[j],why:v.clues[j]+' Получится '+v.values[j]+'.'};
  }
  const api={lessons,generators:{'5.37':mass,'5.38':dividend,'5.39':powers},bounds:{'5.37':{litres:[1,100,5]},'5.38':{extra:[0,2,0]},'5.39':{row:[0,3,0],focus:[0,1,0]}},taskDrawing:drawing,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5MassDividendPowers=api;
})(typeof window!=='undefined'?window:globalThis);

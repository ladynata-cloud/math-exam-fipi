(function () {
  'use strict';
  const {add, lessons, example, f} = window.MathExamTopicPractice;
  const tasks = [
    ['Скобка перед множителем', '(2½ + 3⅓) · 6', 'Приведи слагаемые к шестым: 15/6 + 20/6 = 35/6. Множитель 6 убирает знаменатель, получаем 35.'],
    ['Множитель у второго слагаемого', '2½ + 3⅓ · 6', 'Здесь на 6 умножают только 10/3. После умножения на 6 остаётся прибавить 5/2 к 20. Получаем 45/2.'],
    ['Множитель у первого слагаемого', '2½ · 6 + 3⅓', 'Сначала 5/2 умножаем на 6: это 15. Прибавляем 10/3 и получаем 55/3.'],
    ['Сумма двух произведений', '2½ · 2 + 3⅓ · 3', 'В первом произведении остаётся 5, во втором 10. Их сумма равна 15.'],
    ['Сумму делим на целое', '(4⅓ + 3⅕) : 113', 'В скобках 13/3 + 16/5 = 113/15. Деление на 113 даёт 1/15.'],
    ['Произведение разности и суммы', '(6 − 7⅛) · (2/9 + 2/3)', 'Первая скобка равна −9/8, вторая равна 8/9. В произведении дроби сокращаются, остаётся −1.'],
    ['Разность в делителе', '17 : (4⅓ − 3⅕)', 'Вычтем 16/5 из 13/3. Получаем 17/15. Чтобы узнать, сколько таких долей в 17, умножим 17 на 15/17. Ответ 15.'],
    ['Произведение двух разностей', '(15 − 4⅛) · (3 14/15 − 2⅗)', 'В первой скобке 87/8. Во второй 59/15 − 39/15 = 4/3. При умножении сокращаем 87 с 3 и 4 с 8. Получаем 29/2.'],
    ['Сложить число с произведением', 'Прибавь к 3⅓ результат умножения 2,5 на 16.', 'Произведение равно 40. Теперь 40 + 10/3 = 130/3.'],
    ['Вычесть число из произведения', 'Из произведения 2⅐ и 2⅘ вычти 2,4.', 'Перемножим 15/7 и 14/5 с сокращением. Получаем 6. Из 6 вычитаем 12/5 и получаем 18/5.'],
    ['Сумма и разность тех же чисел', 'Умножь сумму 2,4 и 5,6 на разность этих чисел в том же порядке.', 'Сумма равна 8, разность равна −3,2. Произведение равно −25,6.'],
    ['Делитель — большее число', 'Вычти 25/38 из смешанного числа 1 6/19. Подели разность на большее из исходных чисел.', 'Первое число равно 50/38. Разность равна 25/38, это половина от 50/38. Ответ 1/2.'],
    ['Словесная сумма с умножением', 'Прибавь к 2⅓ произведение 2,4 и 15.', 'Умножение даёт 36. Складываем 108/3 и 7/3. Итог 115/3.'],
    ['Словесная разность с умножением', 'Перемножь смешанные числа 2 2/25 и 1 9/16. Вычти из результата 1,25.', 'Запишем смешанные числа как 52/25 и 25/16. Получим 13/4. Вычитаем 5/4, остаётся 2.'],
    ['Две скобки с десятичными дробями', 'Перемножь сумму и разность чисел 3,8 и 5,2. В разности оставь 3,8 первым.', 'Сумма равна 9, разность равна −1,4. Умножение даёт −12,6.'],
    ['Делитель — меньшее число', 'Из смешанного числа 4 8/15 вычти 1⅓. Подели полученную разность на меньшее из исходных чисел.', 'В пятнадцатых разность равна 68/15 − 20/15 = 16/5. Меньшее число 4/3. Частное равно 16/5 · 3/4 = 12/5.']
  ];
  const plus = (a,b) => a+b, minus = (a,b) => a-b, times = (a,b) => a*b, divide = (a,b) => a/b;
  const names = {'+':'сумма','−':'разность','·':'произведение',':':'частное'};
  const code = {'+':1,'−':2,'·':3,':':4};
  const operations = {'+':plus,'−':minus,'·':times,':':divide};
  function leaf(v) { return {v, text:f(v)}; }
  function pair(op,l,r) {
    if(typeof l==='number') l=leaf(l);
    if(typeof r==='number') r=leaf(r);
    return {op,l,r,v:operations[op](l.v,r.v),text:'('+l.text+' '+op+' '+r.text+')'};
  }
  function expression(i,s) {
    const a=s+1/2, b=s+1/3, k=s+3;
    const x=s+1/4, y=s+3/4;
    if(i===0) return pair('·',pair('+',a,b),k);
    if(i===1) return pair('+',a,pair('·',b,k));
    if(i===2) return pair('+',pair('·',a,k),b);
    if(i===3) return pair('+',pair('·',a,2),pair('·',b,3));
    if(i===4) return pair(':',pair('+',a,b),k);
    if(i===5) return pair('·',pair('−',s,s+1+s/8),pair('+',2/(s+4),3/(s+4)));
    if(i===6) return pair(':',s+5,pair('−',a,s/(s+1)));
    if(i===7) return pair('·',pair('−',s+8,s/2),pair('−',x,b));
    if(i===8) return pair('+',s+1/3,pair('·',s+1/2,2*s+2));
    if(i===9) return pair('−',pair('·',(s+1)/3,3*(s+2)/(s+1)),s/4);
    if(i===10) return pair('·',pair('+',x,y),pair('−',x,y));
    if(i===11) return pair(':',pair('−',(s+2)*x,x),(s+2)*x);
    if(i===12) return pair('+',s+2/3,pair('·',s+1/5,5*s));
    if(i===13) return pair('−',pair('·',(s+2)/5,5*(s+3)/(s+2)),s/8);
    if(i===14) return pair('·',pair('+',x/2,y),pair('−',x/2,y));
    return pair(':',pair('−',3*y,x),x);
  }
  function question(prompt,answer,calculation,error,bad) {
    return {prompt,answer,calculation,error,mistakes:[[Math.abs(answer-bad)<1e-7?answer+1:bad,error]]};
  }
  function model(i,s) {
    const root=expression(i,s), inner=root.l.op?root.l:root.r;
    const calc=node=>node.l.text+' '+node.op+' '+node.r.text+' = '+f(node.v);
    const wrongFirst=inner.op==='·'?inner.l.v+inner.r.v:inner.op==='+'?inner.l.v*inner.r.v:inner.r.v-inner.l.v;
    const wrongResult=root.op===':'?root.r.v/root.l.v:root.op==='−'?root.r.v-root.l.v:root.op==='·'?root.l.v+root.r.v:root.l.v*root.r.v;
    const order='1 — сложение, 2 — вычитание, 3 — умножение, 4 — деление.';
    const e=example('Прочитай выражение и установи порядок действий.', ['Часть','Запись'],[
      ['Выражение',root.text.slice(1,-1)],['Ветвь для первого шага',inner.text],['Последнее действие',order]
    ],[
      question('Вычисли выделенную ветвь '+inner.text+'.',inner.v,calc(inner),'Выполни действие внутри выделенных скобок. Проверь его знак и порядок чисел.',wrongFirst),
      question('Какое действие связывает две главные части? Введи его код. '+order,code[root.op],'Две части связывает '+names[root.op]+'.','Найди знак между двумя целыми ветвями. Знак внутри ветви относится к предыдущему шагу.',code[inner.op]),
      question('Вычисли всё выражение.',root.v,f(root.l.v)+' '+root.op+' '+f(root.r.v)+' = '+f(root.v),'Проверь последнее действие: слева '+f(root.l.v)+', справа '+f(root.r.v)+'. Сохрани их порядок.',wrongResult)
    ],'operation-tree');
    return Object.assign(e,{tree:root});
  }
  const order=[];
  for(const [i,[title,prompt,guide]] of tasks.entries()) {
    const n=1+Math.floor(i/4), part=i%4, key='1-'+n+'-'+'abcd'[part], ref='Упражнение №1.'+n+'абвг'[part];
    add(90,key,n===4?5:4,title,'Разбери порядок действий, затем реши похожую задачу с новыми числами.',
      'Найди последнее действие. Для каждого из его двух аргументов отдельно выполни действия в скобках.', 'fraction',s=>model(i,s));
    const l=lessons.get('90-'+key);
    Object.assign(l,{printedReference:ref,printedPrompt:n<3?'Прочти выражение словами и вычисли его: '+prompt+'.':prompt,printedGuide:guide});
    order.push(l.id);
  }
  function figure(data) {
    const t=data.tree;
    const shape=(x,y,label,value)=>'<rect x="'+(x-59)+'" y="'+y+'" width="118" height="40" rx="7" fill="#e4f1ed" stroke="#47766a"/><text x="'+x+'" y="'+(y+15)+'">'+label+'</text><text x="'+x+'" y="'+(y+31)+'">'+value+'</text>';
    return '<svg viewBox="0 0 280 116" role="img" aria-label="Дерево действий: две ветви сходятся в последний шаг"><g text-anchor="middle" font-family="sans-serif" font-size="12" fill="#244139">'+
      shape(70,4,'левая ветвь',t.l.text)+shape(210,4,'правая ветвь',t.r.text)+
      '<path d="M70 45L132 73m78-28l-62 28" fill="none" stroke="#47766a"/>'+shape(140,72,'соедини ветви','найди значение')+'</g></svg>';
  }
  window.MathExamTopicEdition={trainerId:'mordkovich-2019',storePrefix:'math:mordkovich-2019:v1:',authors:'А. Г. Мордкович, Н. П. Николаев',
    grade:()=>'7 класс · часть 2 · 11-е издание · 2019',unit:'упражнение',source:(_book,p)=>'https://pdf.my-uchebnik.ru/pdf/algebra/00000070.pdf#page='+(p+1),
    figure,nextId:l=>order[order.indexOf(l.id)+1]};
})();

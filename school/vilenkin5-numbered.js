/* Individual source exercises, Vilenkin et al., part 1, 3rd revised edition, 2023. */
(function (root) {
  'use strict';
  const tables=typeof module!=='undefined'&&module.exports?require('./vilenkin5-numbered-tables.js'):root.Vilenkin5NumberedTables;
  const diary=typeof module!=='undefined'&&module.exports?require('./vilenkin5-weather-diary.js'):root.Vilenkin5WeatherDiary;
  const circles=typeof module!=='undefined'&&module.exports?require('./vilenkin5-circle-points.js'):root.Vilenkin5CirclePoints;
  const finalPoint=typeof module!=='undefined'&&module.exports?require('./vilenkin5-first-point-end.js'):root.Vilenkin5FirstPointEnd;
  const digits=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-digits.js'):root.Vilenkin5PrintedDigits;
  const textNumbers=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-text-numbers.js'):root.Vilenkin5PrintedTextNumbers;
  const digitTree=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-digit-tree.js'):root.Vilenkin5PrintedDigitTree;
  const calculations=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-calculations.js'):root.Vilenkin5PrintedCalculations;
  const p15=typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-p15.js'):root.Vilenkin5PrintedPageFifteen;
  const lessons = [
    {number:'1.1', key:'printed-1-1', title:'Читаем таблицу о домашних животных',
      explanation:'Подпись строки показывает, что именно считали. При подсчёте группы складывай численности подходящих животных. Строка о семьях без питомца не прибавляет ни одного животного.',
      worked:['В отдельном опросе записали 4 кошек, 3 черепах и 2 птиц.','У кошек и черепах по четыре ноги. Вместе это 4 + 3 = 7 животных.','Шерсть есть только у кошек. Получилось 4 животных, а не 7.'],
      misconception:'Каждое четвероногое животное покрыто шерстью.', reflect:'Какая строка разделяет группы «четвероногие» и «покрытые шерстью»?'},
    {number:'1.2', key:'printed-1-2', title:'Превращаем список в таблицу частот',
      explanation:'Каждая запись в списке принадлежит одному читателю. Посчитай одинаковые записи. Чтобы получить число книг в группе, умножь число читателей на результат одного из них.',
      worked:['Трое прочитали по 2 книги, двое — по 5.','Читателей 3 + 2 = 5. В первой группе прочитано 3 × 2 = 6 книг, во второй 2 × 5 = 10.','Всего 16 книг. Пять читателей и шестнадцать книг отвечают на разные вопросы.'],
      misconception:'Сумма частот всегда равна числу прочитанных книг.', reflect:'Какая сумма позволяет проверить, что ни одна запись не пропущена?'}
  ].concat(tables.lessons,diary.lesson,finalPoint.lessons,digits.lessons,textNumbers.lessons,digitTree.lessons,calculations.lessons,p15.lessons,circles.lesson);
  const pets = ['Кошка','Собака','Хомяк','Черепаха','Морская свинка','Кролик','Птицы','Рыбки','Змеи','Нет животных'];
  const mammal = [0,1,2,4,5], fourLegs = [...mammal,3];
  const sourceCounts = [19,11,3,8,5,1,5,9,0,5];
  const sourceBooks = [4,5,3,4,6,4,3,5,6,4,7,5,6,4,5,5,6,7,5,5,7,4,6,6,3,5,6,4,3,7,5,6];
  const step = (prompt,answer,why,errors=[]) => ({prompt,answer,why,hints:[why],errors,answerFormat:Array.isArray(answer)?'v5-pair':'',v6Full:true});
  const err = (value,text) => ({value,text});
  const total = values => values.reduce((sum,n)=>sum+n,0);
  function animalSurvey(seed,random) {
    const counts = seed === 0 ? sourceCounts.slice() : pets.map(()=>random(1,14));
    if(seed !== 0) {
      counts[random(0,1)] = random(17,26);
      counts[[2,3,7,8][random(0,3)]] = 0;
    }
    const countGroup = indexes=>total(indexes.map(i=>counts[i]));
    const four=countGroup(fourLegs), fur=countGroup(mammal), noLegs=counts[7]+counts[8];
    const absent=counts.indexOf(0), most=counts.indexOf(Math.max(...counts.slice(0,-1)));
    const steps=[
      step('а. Прочитай строку 7, считая заголовок строкой 1. Кто записан и сколько? Введи код (1 — кролик, 2 — птицы), затем количество через точку с запятой.',[1,counts[5]],'Первая строка содержит заголовки. У строки 7 есть название животного и численность.'),
      step('б. Найди вид животных, которого в этом опросе нет. Введи номер его строки.',absent+2,'Отсутствие вида отмечено нулём в строке животного.',[err(11,'Последняя строка сообщает о семьях. Ищи ноль в строке одного из видов животных.')]),
      step('в. Какой питомец встречается чаще всех? Укажи номер строки с этим видом.',most+2,'Сравни правый столбец только у животных. Ответь номером строки, где число наибольшее.',[err(counts[most],'Ты нашёл наибольшую численность. Теперь прочитай номер строки с этим животным.')]),
      step('г. Сколько животных ходят на четырёх ногах?',four,'Отметь кошек, собак, хомяков, черепах, морских свинок и кроликов. Сложи численности этих видов.',[err(fur,'Ты выбрал только животных с шерстью. Проверь ещё строку с черепахами.'),err(four*4,'Получилось число ног. В вопросе считают самих животных.')]),
      step('д. Сколько двуногих животных?',counts[6],'У птицы две ноги. Перенеси численность из строки птиц.',[err(2*counts[6],'Ты посчитал ноги. Каждую птицу здесь считаем один раз.')]),
      step('е. Сколько животных без ног?',noLegs,'Сложи рыбок и змей. Семьи без питомцев сюда не входят.',[err(noLegs+counts[9],'В последней строке посчитали семьи без питомцев. Это не отдельный вид животных.')]),
      step('ж. У скольких животных есть шерсть?',fur,'Убери из четвероногих черепах. Птичьи перья, рыбья чешуя и панцирь не относятся к шерсти.',[err(four,'У черепахи есть четыре ноги и панцирь. Пересмотри строку с черепахами.')])
    ];
    steps[0].clarifications=[err([2,counts[6]],'Если считать только строки с животными, седьмыми действительно стоят птицы. В этом вопросе заголовок считается строкой 1. Прочитай строку с меткой 7.')];
    return {prompt:'з. Сколько всего млекопитающих указано в таблице опроса? В разборе сначала пройди подпункты а–ж.',inputPrompt:'Количество млекопитающих',answer:fur,steps,
      errors:[err(four,'Не все четвероногие здесь млекопитающие. Проверь черепах.'),err(mammal.length,'Это число видов. Сложи численности животных этих видов.')],
      table:{caption:'Результаты опроса о питомцах',headers:['№','Группа','Сколько'],columnWidths:[14,52,34],rows:pets.map((pet,i)=>[i+2,pet,counts[i]])},data:{counts}};
  }
  function readingSurvey(seed,random) {
    const books=seed===0?sourceBooks.slice():[];
    if(seed!==0){
      const last=random(0,1)?8:7;
      for(let n=3;n<=last;n++) for(let i=random(2,8);i>0;i--) books.push(n);
      for(let i=books.length-1;i>0;i--){const j=random(0,i);[books[i],books[j]]=[books[j],books[i]];}
    }
    const values=books.includes(8)?[3,4,5,6,7,8]:[3,4,5,6,7],freq=values.map(n=>books.filter(value=>value===n).length),bookTotal=total(books);
    const steps=values.map((n,i)=>step('Результат одного читателя — '+n+'. Сколько учеников прочитали именно столько и сколько книг получилось в этой группе? Введи два числа через точку с запятой.',[freq[i],n*freq[i]],'Перечитай ряд слева направо и сосчитай вхождения числа '+n+'. Для второго столбца умножь эту частоту на '+n+'.',[
      err([freq[i],freq[i]],'Первый ответ считает учеников. Для второго умножь частоту на '+n+'.'),err([n,freq[i]],'Число '+n+' — это результат одного ученика. Первое поле спрашивает, сколько раз результат встретился.') ]));
    steps.push(step('Итог первого столбца. Сколько учеников приняли участие в опросе?',books.length,'Сложи частоты всех строк и сверь с числом записей в исходном списке.',[err(bookTotal,'Это сумма прочитанных книг. Здесь один элемент списка означает одного ученика.')]));
    steps.push(step('а. Сколько учеников прочитали ровно семь книг?',freq[4],'Нужна частота строки 7, а не сумма книг этой группы.',[err(7*freq[4],'Это книги тех, кто прочитал по семь книг. Перечитай число учеников в её строке.')]));
    steps.push(step('б. Сколько учеников прочитали восемь книг?',freq[5]||0,'Проверь, встречается ли результат 8. Отсутствующему результату соответствует частота ноль.',[err(8,'Восемь — результат, который ищут. Ответ показывает, сколько раз он встретился.')]));
    return {prompt:'в. Сколько книг прочитали все ученики вместе? В разборе заполни частоты и ответь на а и б.',inputPrompt:'Общее число книг',answer:bookTotal,steps,
      errors:[err(books.length,'Ты сложил численности читателей. Для каждой группы умножь частоту на число книг и сложи произведения.'),err(total(values),'Каждый результат учтён один раз. В списке один и тот же результат может принадлежать нескольким ученикам.')],
      table:{caption:'Анкеты читателей. Каждая запись — ответ одного ученика',headers:['Записи','Число прочитанных книг'],rows:Array.from({length:Math.ceil(books.length/8)},(_,i)=>[`${i*8+1}–${Math.min((i+1)*8,books.length)}`,books.slice(i*8,(i+1)*8).join(', ')])},data:{books}};
  }
  function generate(lesson,seed,M){
    const random=M.rng(seed+9153);
    const generators={'1.1':animalSurvey,'1.2':readingSurvey,...tables.generators,'1.8':diary.generate,...finalPoint.generators,...digits.generators,...textNumbers.generators,...digitTree.generators,...calculations.generators,...p15.generators,'5.1':circles.generate};
    const t=generators[lesson.number](seed,random,step);
    return {...t,conditionKey:t.conditionKey||(t.data.counts||t.data.books).join(','),prompt:(t.prefix||(seed===0?'Данные печатного номера. ':t.data.counts||t.data.books?'Новый авторский опрос. ':'Новое авторское задание. '))+t.prompt,v5Full:true,v6Full:true,model:{kind:'v5-numbered'},data:{...t.data,number:lesson.number}};
  }
  function install(C,M){
    const path=C.pathById.vilenkin5;
    const ids=lessons.map(l=>'v5f-'+l.key);
    lessons.forEach((l,i)=>{
      const lesson={id:ids[i],title:'№'+l.number+' · '+l.title,number:l.number,grade:5,v5Course:true,fullKey:l.key,point:l.point||1,minutes:15,area:'Номера учебника',requires:l.requires||['v5f-table-read'],related:l.related||['v5f-table-total'],next:lessons[i+1]&&(lessons[i+1].part||1)===(l.part||1)?ids[i+1]:(l.related||['v5f-table-total'])[0],explanation:l.explanation,worked:l.worked,misconception:l.misconception,reflect:[l.reflect],claim:l.misconception,claimTrue:false,source:{book:'Виленкин и соавторы · 5 класс · 2023',part:l.part||1,point:l.point||1,page:l.page||9,...(l.pageEnd?{pageEnd:l.pageEnd}:{})}};
      C.byId[lesson.id]=lesson;C.lessons.push(lesson);
    });
    path.numbered=ids;
    const accepts=M.accepts;
    M.accepts=(input,target)=>target.answerFormat==='v5-list'?accepts(String(input).split(';').map(x=>digits.natural(x)??x).join(';'),target):target.answerFormat==='v5-classes'?digits.splitClasses(input)===digits.splitClasses(target.answer):target.answerFormat==='v5-natural'?digits.natural(input)===target.answer:target.answerFormat==='v5-reading'?digits.cleanReading(input)===digits.cleanReading(target.answer):target.answerFormat==='v5-point-set'?circles.readSet(input)===target.answer:target.columnRules?Boolean(tables.columnFits(tables.fields(input,M),target.columnRules)):accepts(input,target);
    const previous=M.generate;
    M.generate=(id,seed)=>ids.includes(id)?generate(C.byId[id],seed,M):previous(id,seed);
  }
  const escape = value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function table(caption,headers,rows,columnWidths=[]) {
    const columns=columnWidths.length?'<colgroup>'+columnWidths.map(width=>'<col style="width:'+width+'%">').join('')+'</colgroup>':'';
    return '<div class="v5q-table-scroll"><table class="v5q-place-table"><caption>'+escape(caption)+'</caption>'+columns+'<thead><tr>'+headers.map(title=>'<th scope="col"'+(['ч','км/ч','км'].includes(title)?' class="v5q-unit"':'')+'>'+escape(title)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map((value,i)=>i===0?'<th scope="row">'+escape(value)+'</th>':'<td>'+escape(value)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
  }
  function taskTable(task,scene) {
    if(task.data.circle)return circles.diagram(task.data.circle);
    const {caption,headers,rows,columnWidths}=task.table;
    if(scene.mode==='learn'&&task.data.columns){
      const filled=task.data.columns.map((column,i)=>{
        const draft=scene.answers?.[i];
        if(!draft)return rows[i];
        const entries=draft.split(';').map(cell=>cell.trim());
        return [i+1,...(i<4?column.map(value=>value??entries[0]):entries)];
      });
      return table('Твоя таблица. Каждая строка на экране — один столбец учебника.',headers,filled,columnWidths);
    }
    if(scene.mode==='learn'&&task.data.trips){
      const filled=rows.map((row,i)=>row.map(cell=>cell==='—'&&scene.answers?.[i]?scene.answers[i]:cell));
      return table(caption,headers,filled,columnWidths);
    }
    if(scene.mode==='learn'&&task.data.calculations){
      const checked=rows.map((row,i)=>[...row,scene.answers?.[i]||'—']);
      return table(caption,[...headers,'Ответ'],checked,[16,53,31]);
    }
    let output=table(caption,headers,rows,columnWidths);
    if(scene.mode==='learn'&&task.data.books){
      const values=task.data.books.includes(8)?[3,4,5,6,7,8]:[3,4,5,6,7];
      const solved=values.map((n,i)=>{
        const pair=(scene.answers?.[i]||'').split(';');
        return [n,pair[0]||'—',pair[1]||'—'];
      });
      output+=table('Твоя таблица по проверенным ответам',['Книг у одного','Учеников','Всего книг'],solved);
    }
    return output;
  }
  function explore(lesson,state,task) {
    if(task.data.circle)return circles.explore(task,state);
    if(p15.generators[lesson.number])return p15.explore(lesson,state,task,table);
    if(calculations.generators[lesson.number])return calculations.explore(lesson,state,task,table);
    if(digitTree.generators[lesson.number])return digitTree.explore(lesson,state,task,table);
    if(textNumbers.generators[lesson.number])return textNumbers.explore(lesson,state,task,table);
    if(digits.generators[lesson.number])return digits.explore(lesson,state,task,table);
    if(finalPoint.generators[lesson.number])return finalPoint.explore(lesson,state,task,table);
    if(tables.generators[lesson.number])return tables.explore(lesson,state,task,table);
    if(lesson.number==='1.1'){
      const groups=[['Четыре ноги',fourLegs],['Две ноги',[6]],['Нет ног',[7,8]],['Есть шерсть',mammal]];
      const [group,indexes]=groups[state.group];
      const counts=indexes.map(i=>task.data.counts[i]);
      return {title:'Собери группу по признаку',controls:[{key:'group',title:'Признак животного',values:groups.map(([label],i)=>[i,label])}],visual:table(group,['Животное','Количество'],indexes.map(i=>[pets[i],task.data.counts[i]])),question:'Сколько животных подходит под выбранный признак?',answer:total(counts),why:'Отобранные строки дают '+counts.join(' + ')+' = '+total(counts)+'. Каждое животное посчитано один раз.'};
    }
    const n=state.group+3,rows=task.data.books, matches=rows.filter(v=>v===n).length;
    const result=state.weight?matches*n:matches;
    return {title:'Отметь одинаковые анкеты',controls:[{key:'group',title:'Книг у одного читателя',values:[3,4,5,6,7,8].map((v,i)=>[i,v])},{key:'weight',title:'Что считаем',values:[[0,'Читателей'],[1,'Книги всей группы']]}],visual:'<p>'+rows.map(v=>v===n?'<mark>'+v+'</mark>':String(v)).join(', ')+'</p>',question:state.weight?'Сколько книг прочитали все отмеченные ученики?':'Сколько читателей дали выбранный ответ?',answer:result,why:state.weight?'В группе '+matches+' чел. По '+n+' книг у каждого. Получается '+matches+' × '+n+' = '+result+'.':'Число '+n+' встретилось '+matches+' раз. Каждая отметка — один ученик.'};
  }
  const bounds={'1.1':{group:[0,3,0]},'1.2':{group:[0,5,0],weight:[0,1,0]},...tables.bounds,...finalPoint.bounds,...digits.bounds,...textNumbers.bounds,...digitTree.bounds,...calculations.bounds,...p15.bounds,'5.1':{region:[0,5,0]}};
  const api={install,generate,taskTable,explore,bounds,readPointSet:circles.readSet,mistake:(input,target,M)=>target.weekRules?finalPoint.mistake(input,target,M):tables.mistake(input,target,M)};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else {root.Vilenkin5Numbered=api;install(root.WorkshopCurriculum,root.WorkshopMath);}
})(typeof window!=='undefined'?window:globalThis);

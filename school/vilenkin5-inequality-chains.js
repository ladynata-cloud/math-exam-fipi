/* Виленкин, 5 класс, часть 1, §6. Авторские модели к номерам печатной страницы 34. */
(function(root){
  'use strict';
  const oral=()=>typeof module!=='undefined'&&module.exports?require('./vilenkin5-inequality-entry.js'):root.Vilenkin5InequalityEntry;
  const letters='абв';
  const source={
    '1.167':[[23,25,30],[232,284,300]],
    '1.168':[['83??9','86??1'],['??2?','9?9']],
    '1.169':[[15,23],[3109,3111],[51,52]],
    '1.170':[[3,12,13],[4,9,21],[34,39,44]]
  };
  const descriptions={
    '1.167':['Чтение двойных неравенств','Обе части записи говорят об одном среднем числе. Определи, какое число находится левее него и какое правее.','Например, 5 < 8 < 10 можно прочитать так: восемь больше пяти и меньше десяти.','Среднее число всегда находится на равном расстоянии от концов.','Как прочитать ту же запись, начиная с левого числа?'],
    '1.168':['Сравнение чисел со скрытыми цифрами','Знак вопроса занимает ровно одно место. Сначала посчитай разряды. При одинаковой длине найди первую слева цифру, которая заведомо различается.','В 51? и 54? сотен поровну. Даже 519 меньше 540, поэтому последние цифры знак изменить не могут.','Любая скрытая цифра делает сравнение невозможным.','Какие цифры ты можешь менять без изменения результата?'],
    '1.169':['Натуральные числа строго между двумя другими','Начинай со следующего за левой границей числа и остановись перед правой границей. Если границы соседние, места между ними нет.','Между 40 и 44 лежат 41, 42 и 43. Самих чисел 40 и 44 в этом перечне нет.','Границы нужно включить в ответ на вопрос «между».','Как найти количество промежуточных чисел без перебора?'],
    '1.170':['От слов к двойному неравенству','Найди в двух сравнениях общее число. Помести его посередине, а числа слева и справа поставь в согласованном порядке.','Фразы «7 больше 5» и «7 меньше 9» можно записать как 5 < 7 < 9 или 9 > 7 > 5.','Общее число должно стоять первым.','Почему при чтении с другого конца оба знака меняют направление?']
  };
  const lessons=Object.entries(descriptions).map(([number,[title,explanation,example,misconception,reflect]])=>({number,part:1,page:34,point:6,key:'printed-'+number.replace('.','-'),title,explanation,worked:[example],misconception,reflect,requires:['v5f-printed-1-166'],related:['v5f-printed-1-164']}));
  const interior=(a,b)=>Array.from({length:b-a-1},(_,i)=>a+i+1);
  const clean=value=>String(value).toLowerCase().replace(/ё/g,'е').replace(/[.,!?:;()«»]/g,' ').replace(/(?:^|\s)чем(?=\s|$)/g,' ').replace(/(?:^|\s)(?:число|числа)(?=\s|$)/g,' ').replace(/\s+/g,' ').trim();
  function readings([l,m,h]){
    const speak=oral().spoken;const norm=(n,g)=>[String(n),speak(n,g)];
    const templates=[
      [m,false,'больше',l,true,'меньше',h,true],[m,false,'меньше',h,true,'больше',l,true],
      [l,false,'меньше',m,true,'меньше',h,true],[h,false,'больше',m,true,'больше',l,true]
    ];
    const phrases=new Set();
    for(const [a,ga,verb,b,gb,next,c,gc] of templates)for(const x of norm(a,ga))for(const y of norm(b,gb))for(const z of norm(c,gc)){
      const p=x+' '+verb+' '+y;
      if(a===m){for(const join of [' и ',' но ',' а ',' '])phrases.add(clean(p+join+next+' '+z));}
      else {for(const join of [' а ',' и ',' '])for(const subject of [...norm(b,false),'оно'])phrases.add(clean(p+join+subject+' '+next+' '+z));}
    }
    return phrases;
  }
  const defaultReading=([l,m,h])=>oral().spoken(m)+' больше '+oral().spoken(l,true)+' и меньше '+oral().spoken(h,true);
  const setFormat='v5-between-set',spokenFormat='v5-spoken-chain',chainFormat='v5-three-terms',signFormat='v5-masked-sign';
  const custom=t=>[setFormat,spokenFormat,chainFormat,signFormat].includes(t?.answerFormat);
  function list(value){
    const s=String(value).trim().toLowerCase();
    if(/^(?:нет|ни одного|нет чисел|таких (?:чисел )?нет|между ними нет чисел|пусто|∅|\{\})[.!]?$/.test(s))return [];
    if(!/^\d+(?:[\s,;]+\d+)*$/.test(s))return null;
    return s.split(/[\s,;]+/).map(Number);
  }
  function chain(value){
    const m=String(value).match(/^\s*(\d+)\s*([<>])\s*(\d+)\s*([<>])\s*(\d+)\s*$/);return m&&[Number(m[1]),m[2],Number(m[3]),m[4],Number(m[5])];
  }
  function accepts(value,t){
    if(t.answerFormat===spokenFormat)return readings(t.boundaries).has(clean(value));
    if(t.answerFormat===chainFormat){const c=chain(value),[l,m,h]=t.boundaries;return Boolean(c&&c[2]===m&&((c[0]===l&&c[1]==='<'&&c[3]==='<'&&c[4]===h)||(c[0]===h&&c[1]==='>'&&c[3]==='>'&&c[4]===l)));}
    if(t.answerFormat===signFormat)return String(value).trim()===t.answer;
    const values=list(value);return Boolean(values&&values.length===t.inside.length&&values.slice().sort((a,b)=>a-b).every((n,i)=>n===t.inside[i]));
  }
  function inputIssue(value,t){
    if(t.answerFormat===spokenFormat&&!/[а-яё]/i.test(value))return 'Прочитай запись словами и запиши, что больше и что меньше. Числа можно вводить цифрами.';
    if(t.answerFormat===chainFormat&&!chain(value))return 'Запиши три числа и два знака сравнения между ними.';
    if(t.answerFormat===signFormat&&!/^[<>]$/.test(String(value).trim()))return 'Нужен один знак между первым и вторым числом: > или <.';
    if(t.answerFormat===setFormat&&!list(value))return 'Перечисли числа через запятую или напиши «нет».';
    return '';
  }
  function mistake(value,t){
    if(t.answerFormat===setFormat){const a=list(value)||[],[l,h]=t.boundaries;
      if(a.includes(l)||a.includes(h))return 'Одно из введённых чисел является границей. Слово «между» исключает обе границы.';
      if(new Set(a).size!==a.length)return 'В списке есть повтор. Каждое подходящее число назови один раз.';
      return a.length<t.inside.length?'В перечне пропущено число. Считай от левой границы по единице до правой.':'Проверь, лежит ли каждое названное число строго внутри промежутка.';}
    if(t.answerFormat===signFormat)return t.maskedPair[0].length!==t.maskedPair[1].length?'Посчитай цифры в каждой записи. Старший разряд четырёхзначного числа не может быть нулевым.':'Начни слева. Какая первая открытая цифра различается, ещё до скрытых разрядов?';
    if(t.answerFormat===chainFormat){const c=chain(value);return c&&c[2]!==t.boundaries[1]?'В середине цепочки должно стоять число, которое участвует в обеих частях фразы.':'Прочитай обе соседние пары отдельно. Каждый знак должен смотреть острым кончиком на меньшее число.';}
    return 'Прочитай сначала один знак, затем другой. Можно написать проще: «… больше … и меньше …», используя числа из строки.';
  }
  function masks(seed,r){
    if(!seed)return source['1.168'].map(pair=>pair.slice());
    const a=r(1,9),b=r(0,7),c=r(b+1,9);
    const pairs=[[a+String(b)+'??'+r(0,9),a+String(c)+'??'+r(0,9)],['??'+r(0,9)+'?',r(1,9)+'?'+r(0,9)]];
    return pairs.map(pair=>r(0,1)?pair.reverse():pair);
  }
  function instruction(row,i){
    const [l,m,h]=row;
    return [m+' меньше '+h+', но больше '+l,m+' больше '+l+', но меньше '+h,h+' больше '+m+', а '+m+' больше '+l][i];
  }
  function generate(number,seed,r,step){
    let rows;
    if(number==='1.168')rows=masks(seed,r);
    else rows=source[number].map((row,i)=>{
      if(!seed)return row.slice();
      const l=row[0]+r(1,120);
      if(number==='1.169')return [l,l+(i===2?r(1,2):i===1?r(2,4):r(4,10))];
      const m=l+r(2,i?25:9);return [l,m,m+r(1,i?30:12)];
    });
    const steps=rows.map((row,i)=>{
      const tag=letters[i]+'. ';
      if(number==='1.167')return {...step(tag+'Прочитай '+row.join(' < ')+' вслух и запиши чтение. Можно использовать цифры.',defaultReading(row),'Найди число посередине и прочитай каждое из двух сравнений.',[]),answerFormat:spokenFormat,boundaries:row,inputPrompt:'Например: 8 больше 5 и меньше 10'};
      if(number==='1.168')return {...step(tag+row[0]+' и '+row[1]+'. Запиши знак, который подходит при всех возможных цифрах.',Number(row[0].replace(/\?/g,'9'))<Number(row[1].replace(/^\?/,'1').replace(/\?/g,'0'))?'<':'>','Сравни число разрядов и старшие открытые цифры.',[]),answerFormat:signFormat,maskedPair:row,inputPrompt:'Знак > или <'};
      if(number==='1.169'){const inside=interior(...row);return {...step(tag+'Какие натуральные числа лежат строго между '+row[0]+' и '+row[1]+'?',inside.join(', ')||'нет','Числа на концах в ответ не входят.',[]),answerFormat:setFormat,boundaries:row,inside,inputPrompt:'Все числа или слово «нет»'};}
      return {...step(tag+'Запиши двойным неравенством: '+instruction(row,i)+'.',row.join('<'),'Поставь общее число посередине. Проверь оба знака.',[]),answerFormat:chainFormat,boundaries:row,inputPrompt:'Три числа и два знака'};
    });
    const headings={'1.167':['Двойные неравенства','Запись'],'1.168':['Скрытые цифры','Сравни'],'1.169':['Натуральные числа между границами','Границы'],'1.170':['Высказывания','Условие']}[number];
    const tableValues=rows.map((row,i)=>[letters[i],number==='1.170'?instruction(row,i):row.join(number==='1.167'?' < ':' и ')]);
    const finals={'1.167':['Какое число одновременно больше нижней и меньше верхней границы в пункте б?',rows[1][1],'Возьми среднее число из второй цепочки.'],'1.168':['В скольких парах знак можно определить без подстановки цифр?',2,'В одной паре решает открытая цифра, в другой — число разрядов.'],'1.169':['Сколько всего чисел получилось в списках а, б и в?',rows.reduce((sum,row)=>sum+row.at(-1)-row[0]-1,0),'Сосчитай значения строго между границами каждого пункта.'],'1.170':['На сколько наибольшее число в последней фразе больше наименьшего?',rows.at(-1).at(-1)-rows.at(-1)[0],'Найди крайние члены последней цепочки и вычисли их разность.']};
    const [prompt,answer,why]=finals[number];return {steps,prompt,answer,why,inputPrompt:'Число',errors:[],conditionKey:number+'/'+rows.map(a=>a.join(':')).join('/'),data:{chains34:{number,rows}},table:{caption:headings[0],headers:['Пункт',headings[1]],rows:tableValues,columnWidths:[21,79]}};
  }
  function ray(l,h,x){
    const p=n=>24+(n-l)*190/(h-l);
    const tag=(v,c,above)=>'<circle cx="'+p(v)+'" cy="34" r="3" fill="'+c+'"/><text x="'+p(v)+'" y="'+(above?'19':'58')+'" text-anchor="middle" style="font:15px sans-serif;fill:'+c+'">'+v+'</text>';
    return '<figure style="margin:.4em 0"><svg viewBox="0 0 244 68" style="width:100%;max-width:450px;display:block" role="img" aria-label="От '+l+' до '+h+'. Отмечено '+x+'."><path d="M9 34h221m-7-4 7 4-7 4" stroke="#334e56" fill="none" stroke-width="2"/>'+tag(l,'#344653',false)+tag(h,'#344653',false)+tag(x,'#016754',true)+'</svg><figcaption>Отмеченное число подписано над прямой, границы — под ней.</figcaption></figure>';
  }
  function digitsFigure(row,values){
    let k=0;
    const band=mask=>[...mask].map((ch,j)=>{const hidden=ch==='?',key=hidden?(j===0?'lead':'d'+k++):null;return '<span style="display:inline-block;min-width:1.35em;text-align:center;border-bottom:2px '+(hidden?'dashed #975626;background:#fcebdc':'solid #34574b;background:#eff5ef')+'">'+(hidden&&values?values[key]:ch)+'</span>';}).join('');
    return '<figure style="margin:.4em 0">'+row.map(m=>'<div style="margin:.4em 0">'+band(m)+'</div>').join('')+'<figcaption>Пунктир отмечает места для произвольных цифр.</figcaption></figure>';
  }
  function draw(t,scene){
    const d=t.data.chains34,row=d.rows[Math.min(scene?.mode==='learn'?scene.step:0,d.rows.length-1)];
    if(d.number==='1.168')return digitsFigure(row);
    return ray(row[0],row.at(-1),row.length===3?row[1]:row[0]);
  }
  const choices=(lo,hi)=>Array.from({length:hi-lo+1},(_,i)=>[lo+i,String(lo+i)]);
  function explore(lesson,s,task){
    const d=task.data.chains34,row=d.rows[s.row],controls=[{key:'row',title:'Подпункт',values:d.rows.map((_,i)=>[i,letters[i]])}];
    if(d.number==='1.168'){
      let k=0;const concrete=row.map((mask,idx)=>Number([...mask].map((ch,j)=>{
        if(ch!=='?')return ch;const key=j===0?'lead':'d'+k++;controls.push({key,title:(idx?'Второе':'Первое')+' число, место '+(j+1)+' слева',values:choices(j===0?1:0,9)});return s[key];
      }).join('')));
      return {title:'Подставь цифры вместо вопросов',controls,visual:digitsFigure(row,s),question:'Какое из двух полученных чисел больше? Введи его целиком.',answer:Math.max(...concrete),why:'Меняй цифры по одной. Какие разряды действительно определяют знак?'};
    }
    const l=row[0],h=row.at(-1),m=row.length===3?row[1]:Math.min(l+1,h);
    controls.push({key:'point',title:'Отметить на прямой',values:[[0,'Левую границу'],[1,row.length===3?'Среднее число':'Следующее за левой'],[2,'Правую границу']]});
    const x=[l,m,h][s.point];return {title:'Границы и положение числа',controls,visual:ray(l,h,x),question:'Сколько единичных шагов от отмеченного числа до правой границы?',answer:h-x,why:'Найди разность правой границы и отмеченного числа. Если это одна точка, шагов нет.'};
  }
  const bounds=Object.fromEntries(Object.keys(source).map(n=>[n,{row:[0,source[n].length-1,0],...(n==='1.168'?{d0:[0,9,0],d1:[0,9,0],d2:[0,9,0],d3:[0,9,0],lead:[1,9,1]}:{point:[0,2,0]})}]));
  const api={lessons,generators:Object.fromEntries(Object.keys(source).map(n=>[n,(seed,r,step)=>generate(n,seed,r,step)])),bounds,custom,accepts,inputIssue,mistake,draw,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5InequalityChains=api;
})(typeof window!=='undefined'?window:globalThis);

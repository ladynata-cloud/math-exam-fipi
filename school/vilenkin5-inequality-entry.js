/* Запись и чтение неравенств, Виленкин, 5 класс, часть 1, §6, с. 34. */
(function(root){
  'use strict';
  const digits=()=>typeof module!=='undefined'&&module.exports?require('./vilenkin5-printed-digits.js'):root.Vilenkin5PrintedDigits;
  const source={
    '1.165':[[0,21],[38,17],[231,213],[22383,22369],[3249005,3249002],[5342075215,5343974215]],
    '1.166':[[1,71],[562,499],[4032,402],[9354,9345],[5459000,5456991],[98000542000,98000561002]]
  };
  const wordForms={
    'ноль':'нуля','один':'одного','одна':'одной','два':'двух','две':'двух','три':'трёх','четыре':'четырёх','пять':'пяти','шесть':'шести','семь':'семи','восемь':'восьми','девять':'девяти',
    'десять':'десяти','одиннадцать':'одиннадцати','двенадцать':'двенадцати','тринадцать':'тринадцати','четырнадцать':'четырнадцати','пятнадцать':'пятнадцати','шестнадцать':'шестнадцати','семнадцать':'семнадцати','восемнадцать':'восемнадцати','девятнадцать':'девятнадцати',
    'двадцать':'двадцати','тридцать':'тридцати','сорок':'сорока','пятьдесят':'пятидесяти','шестьдесят':'шестидесяти','семьдесят':'семидесяти','восемьдесят':'восьмидесяти','девяносто':'девяноста',
    'сто':'ста','двести':'двухсот','триста':'трёхсот','четыреста':'четырёхсот','пятьсот':'пятисот','шестьсот':'шестисот','семьсот':'семисот','восемьсот':'восьмисот','девятьсот':'девятисот',
    'тысяча':'тысячи','тысячи':'тысяч','тысяч':'тысяч','миллион':'миллиона','миллиона':'миллионов','миллионов':'миллионов','миллиард':'миллиарда','миллиарда':'миллиардов','миллиардов':'миллиардов'
  };
  const format=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
  function spoken(n,genitive=false){
    const text=digits().words(n);
    return genitive?text.split(' ').map(w=>wordForms[w]).join(' '):text;
  }
  const signs={'1.165':'>','1.166':'<'};
  const compare=(a,b,sign)=>sign==='>'?a>b:a<b;
  const sorted=(row,sign)=>compare(row[0],row[1],sign)?row:[row[1],row[0]];
  function aloud(row,sign){
    const [a,b]=sorted(row,sign);
    return spoken(a)+(sign==='>'?' больше ':' меньше ')+spoken(b,true);
  }
  function read(value){
    const m=String(value).trim().match(/^([^<>=]+?)\s*([<>])\s*([^<>=]+)$/);
    if(!m)return null;
    const a=digits().natural(m[1]),b=digits().natural(m[3]);
    return a===null||b===null?null:[a,m[2],b];
  }
  function accepts(value,target){
    const q=read(value),answer=read(target.answer);return Boolean(q&&q[0]===answer[0]&&q[1]===answer[1]&&q[2]===answer[2]);
  }
  function inputIssue(value,target){
    const q=read(value),a=read(target.answer);
    if(!q)return 'Нужны два числа и один знак между ними. Отделять классы пробелами можно по три цифры справа.';
    if(q[0]===a[2]&&q[2]===a[0]&&q[1]!==a[1])return 'Сравнение верно. В этом подпункте нужен знак '+a[1]+': переставь числа, сохранив верное неравенство.';
    return '';
  }
  function mistake(value,target){
    const q=read(value),a=read(target.answer);
    if(!q)return 'Прочитай два числа из текущей строки.';
    if(q[0]!==a[0]&&q[0]!==a[2]||q[2]!==a[0]&&q[2]!==a[2]||q[0]===q[2])return 'Проверь обе записи по строке условия. Сохрани все цифры, включая нули внутри числа.';
    return 'Острый кончик знака направлен к меньшему числу. Сравни старший разряд, в котором цифры различаются.';
  }
  const lessons=Object.keys(source).map((number,i)=>({number,part:1,page:34,point:6,key:'printed-'+number.replace('.','-'),title:i?'Запиши сравнение со знаком «меньше»':'Запиши и прочитай сравнение со знаком «больше»',
    requires:[i?'v5f-printed-1-164':'v5f-printed-1-163'],related:['v5f-printed-1-16'],
    explanation:'Сначала посчитай цифры в натуральных числах. Если их поровну, двигайся слева направо до первого различия. Запиши оба числа в таком порядке, чтобы острый кончик знака указывал на меньшее.',
    worked:[i?'В числах 6104 и 6140 одинаковые тысячи и сотни. В десятках 0 меньше 4, поэтому 6104 < 6140.':'В числах 823 и 832 сотни одинаковы. У 832 больше десятков. Запись 832 > 823 читается «восемьсот тридцать два больше восьмисот двадцати трёх».'],
    misconception:'При сравнении двух больших чисел начинать удобно с последних цифр.',reflect:'Какие первые различающиеся цифры определили твой ответ?'}));
  function generate(number,seed,r,step){
    const sign=signs[number], rows=source[number].map(([a,b],i)=>{
      if(!seed)return [a,b];
      const offset=r(1,75)*10**i,delta=r(1,9);const x=a+offset,y=b+offset+delta;
      return r(0,1)?[x,y===x?y+1:y]:[y===x?y+1:y,x];
    });
    const steps=rows.map((row,i)=>{
      const [a,b]=sorted(row,sign),answer=a+sign+b;
      return {...step('абвгде'[i]+'. Даны '+format(row[0])+' и '+format(row[1])+'. Составь верное неравенство со знаком '+sign+'.',answer,
        'Читай запись слева направо. '+aloud(row,sign)+'.',[]),answerFormat:'v5-written-inequality',inputPrompt:'Оба числа и знак '+sign};
    });
    const count=rows.filter(([a,b])=>compare(a,b,sign)).length;
    return {steps,prompt:'Для каждой строки запиши в тетради верное неравенство со знаком '+sign+'. '+(sign==='>'?'Прочитай получившиеся записи вслух. ':'')+'Самопроверка: в скольких строках числа уже стояли в нужном порядке?',
      inputPrompt:'Число строк',answer:count,why:'Отметь строки, в которых можно было сразу поставить между числами нужный знак.',
      errors:count===3?[]:[{value:6-count,text:'Таково число строк, в которых пришлось поменять числа местами. Посчитай оставшиеся строки.'}],
      data:{comparisonRows:{rows,sign}},table:{caption:'Шесть пар для сравнения',headers:['Пункт','Первое число','Второе число'],rows:rows.map((row,i)=>['абвгде'[i],format(row[0]),format(row[1])])},
      conditionKey:number+'/'+rows.map(x=>x.join(':')).join('/')};
  }
  function placeBands(row){
    const width=Math.max(...row.map(n=>String(n).length)),str=row.map(n=>String(n).padStart(width,' '));
    const i=str[0].split('').findIndex((d,j)=>d!==str[1][j]);
    const line=s=>'<div style="display:grid;grid-template-columns:repeat('+width+',minmax(0,1fr));gap:1px;max-width:440px;margin:.15em 0" aria-label="'+s.trim()+'">'+[...s].map((d,j)=>'<span style="display:block;min-width:0;text-align:center;padding:.1em 0;border-bottom:2px solid '+(j===i?'#904927':'#b2c5c1')+';background:'+(j===i?'#f6dcc9':'#eef4ee')+'">'+(d===' '?' ':d)+'</span>').join('')+'</div>';
    const caption=str[0].trim().length===str[1].trim().length?'Отмечен первый слева разряд, в котором цифры различаются.':'Числа записаны разряд под разряд. У одного числа есть лишний старший разряд.';
    return '<figure style="margin:.5em 0">'+str.map(line).join('')+'<figcaption>'+caption+'</figcaption></figure>';
  }
  function draw(task,scene){
    const d=task.data.comparisonRows,i=scene?.mode==='learn'?Math.min(scene.step,5):0;return placeBands(d.rows[i]);
  }
  function explore(lesson,s,task){
    const d=task.data.comparisonRows,row=d.rows[s.row],a=sorted(row,d.sign);
    const reading=s.say?'<p><strong>Прочитай вслух.</strong> '+aloud(row,d.sign)+'.</p>':'';
    return {title:'Сравни числа по разрядам',controls:[{key:'row',title:'Строка',values:d.rows.map((_,i)=>[i,'абвгде'[i]])},{key:'say',title:'Чтение',values:[[0,'Читаю сам'],[1,'Сверить произношение']]}],
      visual:placeBands(row)+reading,question:'Какое число нужно поставить первым перед знаком '+d.sign+'?',answer:a[0],why:'Прочитай знак. Выбери большее число для «больше» и меньшее для «меньше».'};
  }
  const api={lessons,generators:Object.fromEntries(Object.keys(source).map(n=>[n,(seed,rand,step)=>generate(n,seed,rand,step)])),bounds:Object.fromEntries(Object.keys(source).map(n=>[n,{row:[0,5,0],say:[0,1,0]}])),draw,explore,read,accepts,inputIssue,mistake,aloud,spoken};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5InequalityEntry=api;
})(typeof window!=='undefined'?window:globalThis);

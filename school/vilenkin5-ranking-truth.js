/* Сравнение натуральных чисел. Печатные №1.173 и №1.174, часть 1, с. 35. */
(function(root){
  'use strict';
  const cities=['Смоленск','Тула','Липецк','Владивосток','Курск','Новосибирск'],distances=[369,173,372,6417,457,2811],letters='абвгде';
  const lessons=[
    {number:'1.173',title:'Расположи расстояния по порядку',requires:['v5f-printed-1-166'],explanation:'У каждого города есть своё расстояние. Сначала выпиши все шесть чисел. Для убывания начни с самого большого, для возрастания — с самого маленького.',
      worked:['Пусть три маршрута имеют длины 317, 75 и 309 км. По возрастанию получим 75, 309, 317. Развернув этот ряд, получим порядок убывания.'],misconception:'Числа в таблице уже стоят в порядке удаления.',reflect:'Какие два города пришлось сравнивать особенно внимательно и почему?'},
    {number:'1.174',title:'Проверь шесть равенств и неравенств',requires:['v5f-printed-1-166'],explanation:'Вычисли значение с каждой стороны знака. Прочитай буквально, что утверждает знак. Иногда оба выражения выглядят по-разному, хотя значения равны.',
      worked:['Запись 18 · 4 < 75 верна. Слева 72, справа 75, а 72 меньше 75. В записи 84 : 7 = 20 − 8 обе стороны равны 12.'],misconception:'Если числа стоят по разные стороны знака равенства, можно сразу считать их равными.',reflect:'Как проверить ответ на деление умножением?'}
  ].map(l=>({...l,key:'printed-'+l.number.replace('.','-'),part:1,page:35,point:6,related:['v5f-printed-1-165']}));
  const rankFormat='v5-distance-ranking',truthFormat='v5-arithmetic-truth';
  const custom=q=>[rankFormat,truthFormat].includes(q?.answerFormat);
  function rank(value){
    const text=String(value).toLowerCase().trim().replace(/\s*км\b/gu,'').replace(/\s*км(?=$|[,;\s])/gu,'');
    if(!/^\d+(?:[\s,;]+\d+)*$/.test(text))return null;
    return text.split(/[\s,;]+/u).map(Number);
  }
  function verdict(value){
    const s=String(value).trim().toLowerCase().replace(/[.!]$/,'').trim();
    if(['да','верно','правильно','истинно','истина','верна','верное'].includes(s))return true;
    if(['нет','неверно','не верно','неправильно','ложно','ложь','неверна','неверное'].includes(s))return false;
    return null;
  }
  function accepts(value,q){
    if(q.answerFormat===truthFormat)return verdict(value)===q.trueStatement;
    const values=rank(value);return Boolean(values&&values.length===q.ranked.length&&values.every((n,i)=>n===q.ranked[i]));
  }
  function inputIssue(value,q){
    if(q.answerFormat===truthFormat)return verdict(value)===null?'Напиши «да», если запись верна, или «нет», если она неверна.':'';
    const values=rank(value);
    if(!values||values.length!==q.ranked.length)return 'Нужны шесть расстояний в километрах. Пиши каждое число целиком и разделяй соседние числа запятыми.';
    return '';
  }
  function mistake(value,q){
    if(q.answerFormat===truthFormat)return q.evidence;
    const values=rank(value);if(!values)return 'Сверь числа с расстояниями в таблице.';
    if(new Set(values).size!==6)return 'Одно расстояние повторяется. Проверь, что каждому городу соответствует ровно одна запись.';
    if(values.some(x=>!q.ranked.includes(x)))return 'В списке появилось расстояние, которого нет в этой таблице. Проверь цифры.';
    const i=values.findIndex((x,j)=>j&&(q.descending?x>values[j-1]:x<values[j-1]));return i<0?'Проверь порядок всех расстояний.':'Сравни соседние значения '+values[i-1]+' и '+values[i]+'. При движении вправо расстояния здесь должны '+(q.descending?'уменьшаться.':'увеличиваться.');
  }
  function generate173(seed,r,step){
    const values=seed?Array.from({length:6},(_,i)=>i*50+r(25,69)):distances.slice();
    if(seed)for(let i=values.length-1;i>0;i--){const j=r(0,i);[values[i],values[j]]=[values[j],values[i]];}
    const places=seed?Array.from({length:6},(_,i)=>'Город '+'АБВГДЕ'[i]):cities.slice(),asc=values.slice().sort((a,b)=>a-b);
    const steps=[true,false].map((descending,i)=>{
      const ranked=descending?asc.slice().reverse():asc;
      return {...step((i?'б. ':'а. ')+'Назови расстояния по порядку '+(descending?'убывания':'возрастания')+'. Запиши все шесть значений.',ranked.join(', '),
        'Начни с '+(descending?'самого длинного':'самого короткого')+' маршрута. Вычёркивай уже использованные расстояния.',[]),answerFormat:rankFormat,ranked,descending,inputPrompt:'Шесть расстояний через запятую'};
    });
    return {steps,prompt:'На сколько километров самый длинный маршрут больше самого короткого?',inputPrompt:'Разность в километрах',answer:asc.at(-1)-asc[0],why:'Нужны крайние значения упорядоченного ряда.',errors:[],data:{distanceRanking:{places,values}},conditionKey:'1.173/'+values.join(':'),
      table:{caption:seed?'Условные расстояния авторского варианта':'Расстояния по прямой от Москвы по таблице учебника',headers:['Город','Расстояние, км'],rows:places.map((p,i)=>[p,values[i]]),columnWidths:[58,42]}};
  }
  function expr(a,op,b){return {a,op,b};}
  const display=e=>e.op?e.a+' '+e.op+' '+e.b:String(e.a);
  const compute=e=>e.op==='−'?e.a-e.b:e.op==='·'?e.a*e.b:e.op===':'?e.a/e.b:e.a;
  const printed=()=>[[expr(896,'−',269),'=',expr(227)],[expr(67,'·',45),'=',expr(2875)],[expr(32,'·',55),'=',expr(7040)],[expr(1001,':',13),'=',expr(100,'−',23)],[expr(24,'·',26),'<',expr(630)],[expr(1551,':',47),'>',expr(35)]];
  function variants(r){
    const x=r(100,950),y=r(12,x-1),a=r(12,70),b=r(12,65),c=r(12,70),d=r(12,65),quotient=r(10,89),divisor=r(4,23),extra=r(5,40),e=r(12,44),f=r(12,40),g=r(10,50),h=r(10,60);
    const alter=()=>r(0,1)?0:r(1,14);
    return [[expr(x,'−',y),'=',expr(x-y+alter())],[expr(a,'·',b),'=',expr(a*b+alter())],[expr(c,'·',d),'=',expr(c*d+alter())],[expr(quotient*divisor,':',divisor),'=',expr(quotient+extra+alter(),'−',extra)],[expr(e,'·',f),'<',expr(e*f+r(-7,7))],[expr(g*h,':',h),'>',expr(g+r(-6,6))]];
  }
  const isTrue=(l,op,h)=>op==='='?l===h:op==='<'?l<h:l>h;
  function generate174(seed,r,step){
    const rows=seed?variants(r):printed(),strings=rows.map(([x,op,y])=>display(x)+' '+op+' '+display(y));
    const steps=rows.map(([x,op,y],i)=>{
      const a=compute(x),b=compute(y),correct=isTrue(a,op,b),evidence='Слева получается '+a+', справа '+b+'. '+(op==='='?'Проверь, совпадают ли значения.':op==='<'?'Знак требует, чтобы левое значение было меньше правого.':'Знак требует, чтобы левое значение было больше правого.');
      return {...step(letters[i]+'. Верна ли запись '+strings[i]+'?',correct?'да':'нет','Вычисли значения слева и справа отдельно.',[]),answerFormat:truthFormat,trueStatement:correct,evidence,inputPrompt:'Да или нет'};
    });
    return {steps,prompt:'Сколько из шести записей оказались верными?',inputPrompt:'Число верных записей',answer:steps.filter(s=>s.trueStatement).length,
      why:'Отметь каждый верный вывод один раз и пересчитай отметки.',errors:[],conditionKey:'1.174/'+strings.join('/'),data:{truthChecks:{rows}},
      table:{caption:'Записи для проверки',headers:['Пункт','Утверждение'],rows:strings.map((text,i)=>[letters[i],text]),columnWidths:[20,80]}};
  }
  function bars(d,indices){
    const top=Math.max(...indices.map(i=>d.values[i]));
    return '<figure style="margin:.45em 0">'+indices.map(i=>'<div style="margin:.35em 0"><span>'+d.places[i]+' · '+d.values[i]+' км</span><div style="height:7px;background:#e7efea"><div style="height:100%;background:#276f62;width:'+100*d.values[i]/top+'%"></div></div></div>').join('')+'<figcaption>Длина каждой полосы пропорциональна расстоянию. Масштаб общий для показанных маршрутов.</figcaption></figure>';
  }
  function sides(row){const [a,sign,b]=row;return '<figure style="margin:.4em 0"><div style="display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:.2em;text-align:center"><div>'+display(a)+'</div><b>'+(sign==='<'?'&lt;':sign==='>'?'&gt;':'=')+'</b><div>'+display(b)+'</div></div><figcaption>Слева и справа от знака находятся отдельные значения.</figcaption></figure>';}
  function draw(task,scene){if(task.data.distanceRanking)return bars(task.data.distanceRanking,[0,1,2,3,4,5]);const rows=task.data.truthChecks.rows;return sides(rows[scene?.mode==='learn'?Math.min(scene.step,5):0]);}
  function explore(lesson,s,t){
    if(t.data.distanceRanking){
      const d=t.data.distanceRanking,order=d.values.map((v,i)=>[v,i]).sort((a,b)=>a[0]-b[0]),shown=s.group?order.slice(0,4).map(p=>p[1]):[0,1,2,3,4,5];
      return {title:'Сравни расстояния одной меркой',controls:[{key:'group',title:'Показать полосы',values:[[0,'Все шесть'],[1,'Четыре коротких']]},{key:'place',title:'Сравнить с городом',values:d.places.map((p,i)=>[i,p])}],
        visual:bars(d,shown),question:'Сколько из всех шести маршрутов короче маршрута до города «'+d.places[s.place]+'»?',answer:d.values.filter(v=>v<d.values[s.place]).length,why:'Ищи в таблице все значения строго меньше выбранного. Сам маршрут не входит в счёт.'};
    }
    const d=t.data.truthChecks.rows,row=d[s.row],expression=row[s.side===0?0:2];
    return {title:'Вычисли одну сторону записи',controls:[{key:'row',title:'Запись',values:d.map((_,i)=>[i,letters[i]])},{key:'side',title:'Сторона',values:[[0,'Левая'],[1,'Правая']]}],visual:sides(row),
      question:'Чему равна выбранная сторона: '+display(expression)+'?',answer:compute(expression),why:'Сначала выполни действие выбранной стороны. Затем сравни полученные значения со знаком в условии.'};
  }
  const api={lessons,generators:{'1.173':generate173,'1.174':generate174},bounds:{'1.173':{group:[0,1,0],place:[0,5,0]},'1.174':{row:[0,5,0],side:[0,1,0]}},accepts,custom,inputIssue,mistake,draw,explore,compute};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5RankingTruth=api;
})(typeof window!=='undefined'?window:globalThis);

(function(){
  'use strict';
  const course=window.MathExamTopicEdition,{lesson,q,sample}=course;
  const rows=window.MathExamAlimovDivision;
  const supers=['','¹','²','³','⁴','⁵','⁶','⁷'];
  const trim=a=>{while(a.length>1&&Math.abs(a.at(-1))<1e-9)a.pop();return a;};
  const zero=p=>p.length===1&&Math.abs(p[0])<1e-9;
  const read=p=>p.map(v=>{const [n,d]=v.split('/').map(Number);return n/(d||1);});
  function rational(x){
    if(Math.abs(x)<1e-9)return '0';
    for(let d=1;d<=512;d++){const n=Math.round(x*d);if(Math.abs(n/d-x)<1e-8)return d===1?String(n):n+'/'+d;}
    throw Error('Unexpected coefficient in this edition');
  }
  function polynomial(p){
    const parts=[];
    for(let j=p.length-1;j>=0;j--){
      const k=p[j];if(Math.abs(k)<1e-9)continue;
      const factor=Math.abs(k),power=j===1?'x':j?'x'+supers[j]:'';
      const num=power&&Math.abs(factor-1)<1e-9?'':rational(factor);const sign=parts.length?(k<0?' − ':' + '):(k<0?'−':'');
      parts.push(sign+num+(num.includes('/')&&power?'·':'')+power);
    }
    return parts.join('')||'0';
  }
  const plus=(a,b,scale=1)=>trim(Array.from({length:Math.max(a.length,b.length)},(_,i)=>(a[i]||0)+scale*(b[i]||0)));
  function product(a,b){
    const result=Array(a.length+b.length-1).fill(0);
    a.forEach((u,i)=>b.forEach((v,j)=>result[i+j]+=u*v));return trim(result);
  }
  function divide(original,divisor){
    let rest=[...original];const quotient=[],steps=[];
    while(!zero(rest)&&rest.length>=divisor.length){
      const p=rest.length-divisor.length,c=rest.at(-1)/divisor.at(-1),term=Array(p).fill(0).concat(c);
      quotient[p]=c;rest=plus(rest,product(term,divisor),-1);steps.push({term,rest});
    }
    return {quotient:Array.from({length:Math.max(1,quotient.length)},(_,p)=>quotient[p]||0),rest,steps};
  }
  const identity=(P,Q,M,R)=>polynomial(P)+' = ('+polynomial(Q)+')('+polynomial(M)+')'+(zero(R)?'':' + ('+polynomial(R)+')');
  const normalLead='Сначала раздели старший член делимого на старший член делителя. Вычитай всё произведение вместе со скобками. Нулевой коэффициент пропущенной степени тоже занимает свой столбец.';
  const captions=['','Точное частное','Деление многочленов','Формула деления','Частное и остаток','Деление с проверкой','Проверка делимости','Параметр и нулевой остаток','Восстановление делителя','Делитель по частному и остатку'];
  function worked(P,Q,M,R,n,part,parameter,condition){
    const inverse=n>=8,A=inverse?plus(P,R,-1):P,B=inverse?M:Q,division=divide(A,B);
    const action=division.steps.map(({term,rest})=>'добавь '+polynomial(term)+' в '+(inverse?'искомый делитель':'частное')+', после вычитания останется '+polynomial(rest)).join('; ');
    let intro=normalLead;
    if(n===7){
      const equations=['a − 3 = 0','a − 10 = 0','−4a + 12 = 0 и a − 3 = 0','a − 2 = 0 и −a + 2 = 0'];
      intro='Раздели исходную запись с параметром. Остаток равен '+condition+'. Чтобы он был нулевым многочленом, каждый его коэффициент должен равняться нулю: '+equations[part-1]+'. Получается a = '+parameter+'. Подставь это значение.';
    }else if(inverse)intro='Из P = QM + R получаем QM = P − R. Чтобы восстановить Q, раздели '+polynomial(A)+' на '+polynomial(M)+'.';
    const end=n===6?(zero(R)?' Остаток нулевой, поэтому деление нацело возможно.':' Остаток ненулевой, поэтому деления нацело нет.'):'';
    return intro+' Шаги: '+action+'. '+(inverse?'Искомый Q = '+polynomial(Q):'Частное M = '+polynomial(M))+', остаток R = '+polynomial(R)+'. Проверка умножением даёт '+identity(P,Q,M,R)+'.'+
      (zero(R)?'':' Степень остатка '+(R.length-1)+' меньше степени делителя '+(Q.length-1)+'.')+end;
  }
  const coefficients=[[1],[0,1],[1,-4],[0,-1,1]];
  for(const row of rows){
    const [key,pRaw,qRaw,mRaw,rRaw,paramSource,parameter,condition]=row,[n,part]=key.split('-').map(Number);
    const P=read(pRaw),Q=read(qRaw),M=read(mRaw),R=read(rRaw),inverse=n>=8;
    const title=captions[n]+' · '+polynomial(n===7?Q:inverse?M:P);
    const prompt=n===7?'Найди все значения a, при которых '+paramSource+' делится без остатка на '+polynomial(Q)+'.':inverse?
      'Восстанови Q по данным P = '+polynomial(P)+', M = '+polynomial(M)+' и R = '+polynomial(R)+'.':
      (n===6?'Проверь делимость без остатка: ':'Найди частное и проверь остаток: ')+'('+polynomial(P)+') : ('+polynomial(Q)+').';
    lesson(key,title,prompt,worked(P,Q,M,R,n,part,parameter,condition),
      'Должно выполняться P = QM + R. Если R ненулевой, его степень строго меньше степени Q.',s=>{
        const qs=plus(Q,[s+1]),ms=plus(M,[s]),t=s%3+1;let rs=R.map(v=>v*(s+1));
        if(n===6)rs=s%2?[s+part]:[0];
        const ps=plus(product(qs,ms),rs);
        const baseRows=[['P',polynomial(ps)],[inverse?'Известное частное M':'Делитель Q',polynomial(inverse?ms:qs)]];
        let questions,chart,model;
        if(n===7){
          const target=Number(parameter)+s,basis=coefficients[part-1],probe=target+t,lead=basis.at(-1),A=product(qs,ms),A0=plus(A,basis,-target);
          baseRows[0]=['P с параметром','('+polynomial(A0)+') + a·('+polynomial(basis)+')'];baseRows.push(['Пробное a',probe]);
          questions=[
            q('Каков старший коэффициент остатка при пробном a?',lead*t,'Многочлен P при пробном a отличается от точного произведения на ('+probe+' − '+target+')('+polynomial(basis)+').',-lead*t,'Вычитание пробного и точного параметра сделано в обратном порядке.'),
            q('При каком a весь остаток обращается в ноль?',target,'Параметр входит общим множителем (a − '+target+'). У второго множителя ненулевой старший коэффициент.',probe,'Это пробное значение. При нём вы получили ненулевой остаток.'),
            q('Каков свободный коэффициент частного после найденной подстановки?',ms[0],'Выполни точное деление после выбора a; свободный член частного '+polynomial(ms)+' равен его значению при x = 0.',ms[0]+1,'В свободный член добавлена лишняя единица. Проверь последнюю строку деления.')
          ];chart='poly-parameter';model={P:plus(A,basis,t),Q:qs,M:ms,R:basis.map(c=>t*c),probe};
        }else if(inverse){
          baseRows.push(['Остаток R',polynomial(rs)]);
          const combined=plus(ps,rs,-1);
          questions=[
            q('Каков свободный член в P − R?',combined[0],'Возьми свободный коэффициент P и вычти свободный коэффициент R.',combined[0]+(rs[0]||1),'Свободный член должен соответствовать произведению Q·M. Проверь вычитание остатка.'),
            q('Какова степень искомого Q?',qs.length-1,'Степень Q равна степени P − R минус степень M.',combined.length-1,'Получена степень делимого до вычитания степени известного частного.'),
            q('Каков свободный коэффициент восстановленного Q?',qs[0],'Раздели P − R на M, затем проверь Q·M + R.',qs[0]+1,'Предложенный свободный коэффициент меняет произведение на целое ненулевое M.')
          ];chart='poly-inverse';model={P:ps,Q:qs,M:ms,R:rs};
        }else{
          const div=divide(ps,qs),lead=ms.at(-1),last=ms[0],r0=rs[0];
          questions=[
            q('Каков коэффициент первого (старшего) члена частного?',lead,'Раздели '+rational(ps.at(-1))+' на '+rational(qs.at(-1))+'.',-lead,'При делении старших коэффициентов знак поменялся ошибочно.'),
            q(n===6?'Введи 1 для деления нацело или 0 для ненулевого остатка.':'Каков свободный коэффициент частного?',n===6?Number(zero(rs)):last,
              n===6?'Закончи все вычитания. Последняя строка равна '+polynomial(div.rest)+'.':'Собери все члены частного. Его значение при нуле равно свободному коэффициенту.',
              n===6?Number(!zero(rs)):last+1,n===6?'Нужен нулевой многочлен целиком. Ненулевой остаток исключает делимость.':'Свободный коэффициент на единицу больше искомого. Обратное умножение добавило бы целый делитель.'),
            q('Каков свободный коэффициент остатка?',r0,'Из свободного коэффициента P вычти произведение свободных коэффициентов Q и M. При нулевом остатке ответ 0.',r0===0?1:-r0,'Смотри на свободный коэффициент последней строки после вычитания всего произведения.')
          ];chart='poly-divide';model={P:ps,Q:qs,M:ms,R:rs};
        }
        return sample(inverse?'Восстанови неизвестный множитель в тождестве деления.':n===7?'Изменяй параметр до исчезновения всего остатка.':'Столбцы модели соответствуют одинаковым степеням. Проверь вычитание и обратное умножение.',
          baseRows,questions,chart,model);
      },n===1?8:n===9?10:9,undefined,58);
  }
  const fallback=course.figure;
  course.figure=d=>{
    if(!['poly-divide','poly-parameter','poly-inverse'].includes(d.chart))return fallback(d);
    const title=d.chart==='poly-parameter'?'Коэффициенты остатка при пробном параметре':d.chart==='poly-inverse'?'Восстановление делителя по столбцам степеней':'Коэффициенты частного и остатка по степеням';
    const t=(x,y,v,extra='')=>'<text x="'+x+'" y="'+y+'" '+extra+'>'+v+'</text>';
    let body=t(5,14,d.chart==='poly-parameter'?'Пробное a = '+d.probe:'Столбцы степеней многочленов');
    const deg=d.P.length-1,w=233/(deg+1);
    for(let j=deg;j>=0;j--){const x=39+(deg-j+.5)*w;body+=t(x,33,j===0?'1':j===1?'x':'x'+supers[j],'text-anchor="middle"');}
    for(const [i,[name,p]] of [['P',d.P],['Q',d.Q],['M',d.M],['R',d.R]].entries()){
      const y=48+17*i;body+=t(7,y,name);
      for(let j=deg;j>=0;j--){const x=39+(deg-j+.5)*w,val=p[j]||0,token=rational(val);body+=t(x,y,token,'text-anchor="middle" fill="'+(val<0?'#993f64':val===0?'#66736b':'#245644')+'"'+(token.length*6.5>w-1?' textLength="'+(w-2)+'" lengthAdjust="spacingAndGlyphs"':''));}
    }
    return '<svg viewBox="0 0 280 120" role="img" aria-label="'+title+'"><g font-family="sans-serif" font-size="11" fill="#244c3e">'+body+'</g></svg>';
  };
})();

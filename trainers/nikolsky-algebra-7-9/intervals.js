(function(){
  'use strict';
  const {add,lessons}=window.MathExamTopicPractice;
  const {q,sample,order}=window.NikolskyWorkshop;
  const letters='абвгдежзиклм';
  function register(n,i,title,prompt,guide,rule,make){
    const ex=typeof n==='string',id=n+(i===null?'':'-'+String.fromCharCode(97+i));
    const page=ex?(n==='example-1'?5:6):n<=7?7:n<=21?8:9;
    add(57,id,page,title,prompt,rule,'signedcompare',make);
    const l=lessons.get('57-'+id);
    Object.assign(l,{printedReference:ex?'Пример '+n.at(-1):'Упражнение №'+n+(i===null?'':letters[i]),printedPrompt:prompt,printedGuide:guide});order.push(l.id);
  }
  const bounds={
    1:[['between',-2,7,'(−2; 7)'],['between',-17,34,'(−17; 34)'],['between',1234,1398,'(1234; 1398)'],['left',0,0,'(−∞; 0)'],['right',0,0,'(0; +∞)'],['left',-3,-3,'(−∞; −3)'],['right',2,2,'(2; +∞)'],['all',0,0,'(−∞; +∞)'],['between',1/3,0.5,'(1/3; 0,5)']],
    2:[['right',1,1,'рис. 1а: пустой кружок в 1, штриховка вправо'],['left',0,0,'рис. 1б: пустой кружок в 0, штриховка влево'],['between',-1,3,'рис. 1в: штриховка между −1 и 3, оба конца открыты']],
    3:[['right',0,0,'x > 0'],['left',3,3,'x < 3'],['right',3579,3579,'x > 3579'],['left',-2,-2,'x < −2'],['right',-1748,-1748,'x > −1748'],['left',0.06,0.06,'x < 0,06'],['right',Math.sqrt(5),Math.sqrt(5),'x > √5'],['left',Math.PI,Math.PI,'x < π'],['between',0,Math.SQRT2,'0 < x < √2'],['between',-2,-0.5,'−2 < x < −0,5'],['between',-1,1,'|x| < 1'],['outside',-1,1,'|x| > 1']]
  };
  function pretty(v){
    const rounded=Number(v.toFixed(5));
    if(Math.abs(v-rounded)<1e-10)return rounded.toLocaleString('ru-RU',{useGrouping:false,maximumFractionDigits:5});
    for(let d=2;d<=10000;d++){
      const n=Math.round(v*d);
      if(Math.abs(v-n/d)<1e-12)return n+'/'+d;
    }
    return '≈ '+rounded.toLocaleString('ru-RU',{useGrouping:false,maximumFractionDigits:5});
  }
  function boundLabel(n,i,v){
    if(n===3&&i===6)return '√5';
    if(n===3&&i===7)return 'π';
    if(n===3&&i===8&&v!==0)return '√2';
    if(n===1&&i===8&&v<0.5)return '1/3';
    return pretty(v);
  }
  function description(kind,A,B){
    if(kind==='all')return 'Подходит любое действительное число. Выдели всю прямую без конечных границ.';
    if(kind==='left')return 'Ответ x < '+A+'. Оставь точку '+A+' открытой и отметь левый луч.';
    if(kind==='right')return 'Ответ x > '+A+'. Оставь точку '+A+' открытой и отметь правый луч.';
    if(kind==='outside')return 'Получатся два луча: x < '+A+' или x > '+B+'. Число 0 между ними не подходит. Обе конечные границы открыты.';
    return 'Ответ '+A+' < x < '+B+'. Закрась отрезок между границами и выколоти оба конца.';
  }
  for(const [idx,rows] of Object.entries(bounds)){
    const n=Number(idx);
    rows.forEach(([kind,a,b,expr],i)=>{
      const phrase=n===2?'Запиши строгий порядок точек, показанный в учебнике: ':'Покажи на координатной прямой ';
      const rule='Пустой кружок исключает границу. Сначала установи сторону штриховки и проверь одну внутреннюю точку.';
      const guide=description(kind,boundLabel(n,i,a),boundLabel(n,i,b));
      register(n,i,(n===2?'Чтение рисунка':'Открытое множество')+' · '+expr,phrase+expr+'.',guide,rule,s=>{
        const shift=s-6,A=a+shift,B=b+shift,irr=n===3&&[6,7,8].includes(i);
        const symbolic=(v,base)=>irr&&![0,1].includes(base)?(shift?shift+' + ':'')+boundLabel(n,i,base):pretty(v);
        const shownA=symbolic(A,a),shownB=symbolic(B,b);
        let x,answer,questions,rows;
        if(kind==='all'){
          x=A;rows=[['Множество','Все действительные'],['Центр шкалы',x]];
          questions=[q('Сколько конечных границ у всей прямой?',0,'Со штриховкой в обе стороны она нигде не заканчивается.',2,'Бесконечности не являются точками прямой.'),
            q('Сколько из чисел '+(x-1)+', '+x+' и '+(x+1)+' принадлежат множеству?',3,'Всякое действительное число лежит на этой прямой.',2,'Центр также принадлежит множеству.'),
            q('Какова координата на две единицы правее '+x+'?',x+2,'Сделай два шага вправо. Эта точка тоже подходит.',x-2,'Правее означает в сторону увеличения.')];
        }else{
          const between=kind==='between',outside=kind==='outside',two=between||outside;
          x=s%3===0?A:two?(s%2?(A+B)/2:B+1):A+(s%2?1:-1);
          answer=Number(between?x>A&&x<B:outside?x<A||x>B:kind==='right'?x>A:x<A);
          rows=[['Множество',description(kind,shownA,shownB)],['Проверяемая точка',s%3===0?shownA:pretty(x)]];
          questions=[q(irr?'Какое наибольшее целое не превосходит первой границы?':two?'Чему равна левая из двух конечных границ?':'Какова конечная граница?',irr?Math.floor(A):A,irr?'Сравни точную границу с соседними целыми. Используй 2 < √5 < 3 и 3 < π < 4.':'Считай координату открытого кружка'+(two?' слева.':'.'),(irr?Math.floor(A):A)+1,'Проверяется сама граница или целое слева от неё. Соседняя точка справа слишком велика.'),
            q(two?(irr?'Какое наименьшее целое не меньше длины открытого промежутка?':'Сколько единиц между двумя конечными границами?'):'В какую сторону идёт выделенный луч? Введи 1 для «вправо», −1 для «влево».',two?(irr?Math.ceil(B-A):B-A):kind==='right'?1:-1,two?(irr?'Сравни длину √2 с соседними целыми.':'Вычти левую координату из правой.'):'Сравни с границей, какие числа подходят.',two?A-B:kind==='right'?-1:1,two?'Длина промежутка положительна.':'Выбран луч с другой стороны открытой точки.'),
            q('Принадлежит ли указанная в таблице точка этому множеству? Введи 1 для «да» или 0 для «нет».',answer,'Сопоставь координату с обеими открытыми границами, если их две.',1-answer,'Проверь именно отмеченную область. Для двух внешних лучей центральный промежуток исключён.')];
        }
        return sample('Штриховка и пробная точка',rows,questions,'openInterval',{kind,A,B,x,shownA,shownB});
      });
    });
  }
  window.NikolskyIntervals={register,q,sample,pretty};
})();

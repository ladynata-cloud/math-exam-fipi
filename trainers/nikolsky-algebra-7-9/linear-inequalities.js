(function(){
  'use strict';
  const {register,q,sample,pretty}=window.NikolskyIntervals;
  const {lessons}=window.MathExamTopicPractice,{order}=window.NikolskyWorkshop;
  const parse=v=>{const [a,b='1']=String(v).split('/');return Number(a)/Number(b);};
  for(const [key,expr,sk,sb,sgn,sc,answer,side] of window.NikolskyLinearOriginals){
    const [no,suffix]=key.split('-'),ex=no==='example',n=ex?key:Number(no),i=ex?null:suffix.charCodeAt(0)-97;
    const k=parse(sk),b=parse(sb),c=parse(sc),zero=!b&&!c;
    const rule=k<0?'При делении на отрицательный коэффициент разверни знак сравнения.':k===1?'Вычти свободный член из обеих сторон. Перенос сохраняет направление.':'Раздели обе стороны на положительный коэффициент, сохранив знак.';
    const step=b?'После одинакового вычитания '+(b<0?'('+sb+')':sb)+' из обеих сторон получаем '+sk+'x '+sgn+' '+pretty(c-b)+'. ':'Переменный член уже выделен. ';
    const guide=step+(k===1?'Коэффициент при x равен единице. ':k<0?'Делитель '+sk+' отрицателен, знак меняется. ':'Делитель '+sk+' положителен, знак сохраняется. ')+
      'Ответ x '+side+' '+answer+'. Точка '+answer+' исключается, поскольку сравнение строгое. Луч направлен '+(side==='<'?'влево.':'вправо.');
    register(n,i,(ex?'Разбор':'Решение')+' · '+expr,'Найди все действительные решения '+expr+'.',guide,rule,s=>{
      const A=zero?k*(1+s):k,shift=s-6,B=b?b+s/10:0,C=zero?0:c+A*shift;
      const D=C-B,t=D/A,kind=side==='<'?'left':'right';
      const point=t+(s%3===0?0:(s%2?1:-1)*(1+s%4));
      const rows=[['Коэффициент k',pretty(A)],['Свободный член b',pretty(B)],['Правая часть c',pretty(C)],['Сравнение',sgn],['Пробная точка',pretty(point)]];
      let questions;
      if(zero){
        questions=[q('В какой точке левая часть равна нулю?',0,'Коэффициент ненулевой, свободного члена нет.',A,'Коэффициент определяет наклон, а не положение нуля.'),
          q('Найди значение левой части kx в пробной точке.',A*point,'Умножь коэффициент на данную координату.',A*point+1,'Проверь точное произведение k и x, без дополнительного слагаемого.'),
          q('В какую сторону идёт луч решений? Введи −1 для левого и 1 для правого.',side==='<'?-1:1,rule,side==='<'?1:-1,'Проверь исходный знак и знак коэффициента перед выбором луча.')];
      }else{
        questions=[q('После переноса свободного члена какое число стоит справа?',D,'Вычисли c − b с исходными знаками.',D+1,'К правой части добавлена лишняя единица. Выполняй одно и то же действие на обеих сторонах.'),
          q('Найди точную конечную границу. Можно ввести дробь.',t,'Раздели c − b на k, не теряя знак коэффициента.',t+1,'Число на границе должно обнулить разность левой и правой частей. Проверь подстановкой.'),
          q('В какую сторону идёт луч решений? Введи −1 для левого и 1 для правого.',side==='<'?-1:1,rule,side==='<'?1:-1,'Проверь знак k. Отрицательный делитель меняет знак неравенства.')];
      }
      return sample('Реши '+pretty(A)+' · x '+(B<0?'− ':'+ ')+pretty(Math.abs(B))+' '+sgn+' '+pretty(C),rows,questions,'openInterval',{kind,A:t,B:t,x:point,shownA:pretty(t),shownB:pretty(t)});
    });
  }
  // Worked examples precede the numbered exercises in this edition.
  const sorted=[...lessons.values()].filter(l=>l.book===57).sort((a,b)=>{
    const av=a.point.startsWith('example-'),bv=b.point.startsWith('example-');
    if(av!==bv)return av?-1:1;
    return a.point.localeCompare(b.point,'en',{numeric:true});
  });
  const first=order.findIndex(id=>id.startsWith('57-'));
  order.splice(first,sorted.length,...sorted.map(l=>l.id));
  sorted.forEach(l=>lessons.delete(l.id));sorted.forEach(l=>lessons.set(l.id,l));
})();

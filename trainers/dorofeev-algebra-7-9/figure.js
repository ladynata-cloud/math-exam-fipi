(function(){
  'use strict';
  const {fraction,v}=window.DorofeevSchool;
  const label=(x,y,t,anchor='start',size=10)=>'<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'" font-size="'+size+'">'+t+'</text>';
  function point(x,y,fill='#39745b'){return '<circle cx="'+x+'" cy="'+y+'" r="4" fill="'+fill+'"/>';}
  window.MathExamTopicEdition.figure=d=>{
    const m=d.m;let out='',title='';
    if (d.chart.startsWith('alg-')) {
      const f = window.MathExamTopicPractice.f;
      const card = (x, y, t) => '<rect x="'+x+'" y="'+y+'" width="82" height="24" rx="4" fill="#e1eee7"/>'+label(x+41,y+16,t,'middle',12);
      const row = (x, y, t, value) => label(x+41,y-4,t,'middle') + card(x,y,f(value));
      if (d.chart === 'alg-quotient' || d.chart === 'alg-substitution') {
        title = 'Числитель и знаменатель по разные стороны дробной черты';
        out = row(17,23,'числитель',m.n) + '<path d="M10 53H106" stroke="currentColor" stroke-width="2"/>' + card(17,60,f(m.d)) + label(58,100,'знаменатель','middle');
        if (d.chart === 'alg-substitution') out += row(164,25,'сумма x + y',m.u) + row(164,77,'разность x − y',m.v);
        else out += row(164,49,'слагаемое вне дроби',m.outer);
      } else if (d.chart === 'alg-reciprocal') {
        title = 'Перестановка числителя и знаменателя обратной дроби';
        out = card(12,18,m.n) + card(12,62,m.d) + card(181,18,m.d) + card(181,62,m.n) +
          '<path d="M8 51H99 M177 51H267 M98 32L171 71 M98 74L171 32" stroke="#39745b" stroke-width="2"/>' +
          label(53,108,'исходное число','middle') + label(222,108,'обратное число','middle');
      } else if (d.chart === 'alg-product') {
        title = 'Обратная проверка через произведение делителя и частного';
        out = row(2,48,'делитель',m.d) + label(90,64,'×','middle') + row(98,48,'частное',m.v) + label(185,64,'=','middle') + row(195,48,'делимое',m.n);
      } else {
        title = 'Два делителя одного общего кратного';
        out = row(98,17,'общее кратное',m.M) + '<path d="M130 43L68 68 M148 43L214 68" stroke="#39745b"/>' +
          row(19,82,'первый делитель',m.A) + row(175,82,'второй делитель',m.B);
      }
      return '<svg viewBox="0 0 280 120" role="img" aria-label="'+title+'"><g fill="#214939" font-family="sans-serif">'+out+'</g></svg>';
    }
    if(d.chart==='fractions'||d.chart==='quality'){
      const values=m.values.map(v),min=Math.min(...values),max=Math.max(...values),pad=Math.max((max-min)*.15,.00001),lo=min-pad,hi=max+pad;
      title=d.chart==='quality'?'Сравнение долей годной продукции на общей дробной шкале':'Точки дробей на одной шкале и сравнение расстояний';
      values.forEach((n,i)=>{const y=21+i*20,x=27+(n-lo)*164/(hi-lo);
        out+=label(4,y+3,i+1)+'<path d="M23 '+y+'H193" stroke="#a8bab0"/>'+point(x,y)+label(206,y+3,fraction(m.values[i]));
      });
      const minText=Number(lo.toPrecision(3)),maxText=Number(hi.toPrecision(3));out+=label(136,112,'общая шкала от '+minText+' до '+maxText,'middle');
    }else if(d.chart==='factors'){
      title='Сокращение и остаточные множители знаменателя';
      const cols=[['исходный',m.input[1]],['сокращённый',m.den],['без 2 и 5',m.left]];
      cols.forEach(([name,n],i)=>{const x=7+90*i;out+='<rect x="'+x+'" y="29" width="82" height="33" rx="5" fill="#d9e9df"/>'+label(x+41,50,n,'middle',14)+label(x+41,82,name,'middle');});
    }else{
      title='Целые точки между границами допустимых знаменателей';
      const lo=m.min-1,hi=m.max===null?m.min+7:m.max+1,range=hi-lo,X=n=>22+232*(n-lo)/range;
      out='<path d="M17 52H260" stroke="#73887e"/>';
      for(let i=lo;i<=hi;i++){if(i!==lo&&i!==hi&&range>22&&(i-lo)%Math.ceil(range/18))continue;const inRange=i>=m.min&&(m.max===null||i<=m.max);out+=point(X(i),52,inRange?'#39745b':'#ccd8d1');}
      out+=label(X(lo),76,lo,'middle')+label(X(hi),76,hi,'middle')+label(140,102,m.max===null?'допустимый луч продолжается вправо →':'крайние серые точки исключены','middle');
    }
    return '<svg viewBox="0 0 280 120" role="img" aria-label="'+title+'"><g fill="#214939" font-family="sans-serif">'+out+'</g></svg>';
  };
})();

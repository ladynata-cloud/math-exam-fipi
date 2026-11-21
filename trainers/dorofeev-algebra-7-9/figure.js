(function(){
  'use strict';
  const {fraction,v}=window.DorofeevSchool;
  const label=(x,y,t,anchor='start',size=10)=>'<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'" font-size="'+size+'">'+t+'</text>';
  function point(x,y,fill='#39745b'){return '<circle cx="'+x+'" cy="'+y+'" r="4" fill="'+fill+'"/>';}
  window.MathExamTopicEdition.figure=d=>{
    const m=d.m;let out='',title='';
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

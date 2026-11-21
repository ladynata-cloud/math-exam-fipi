(function(){
  'use strict';
  const {order}=window.NikolskyWorkshop;
  const text=(x,y,v)=>'<text x="'+x+'" y="'+y+'">'+v+'</text>';
  const line=(x1,y1,x2,y2)=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#315b50" stroke-width="2"/>';
  const bar=(x,y,w,fill)=>'<rect x="'+x+'" y="'+y+'" width="'+Math.max(w,1)+'" height="12" rx="2" fill="'+fill+'"/>';
  function figure(data){
    const m=data.marks;let title,body='';
    if(data.chart==='orderedPoints'){
      title='Числовая прямая с точками сравнения';
      const min=Math.min(...m),max=Math.max(...m),left=37,right=240;
      body+=line(10,58,267,58);
      m.forEach((v,i)=>{
        const x=min===max?136:left+(right-left)*(v-min)/(max-min);
        const lab=Number(v.toFixed(4)).toLocaleString('ru-RU',{useGrouping:false,maximumFractionDigits:4}),y=[22,94,38][i];
        body+=line(x,58,x,i===1?77:43)+'<circle cx="'+x+'" cy="58" r="4" fill="'+['#276948','#9a5559','#885d80'][i]+'"/><text text-anchor="middle" x="'+x+'" y="'+y+'">'+['A','B','C'][i]+' '+lab+'</text>';
      });
    }else if(data.chart==='line'){
      title='Позиции на числовой прямой';
      const positions=[...new Set(m)].sort((a,b)=>a-b),min=positions[0],max=positions.at(-1);
      body+=line(12,61,263,61);
      positions.forEach((v,i)=>{const x=20+(v-min)*226/(max-min||1);body+=line(x,54,x,69)+text(x-4,i%2?91:43,v);});
    }else if(data.chart==='grid'){
      title='Строки и столбцы прямоугольника';
      for(let i=0;i<m[0];i++)for(let j=0;j<m[1];j++)body+='<circle cx="'+(20+j*26)+'" cy="'+(30+i*16)+'" r="5" fill="'+(i%2?'#a56271':'#437b65')+'"/>';
    }else if(data.chart==='division'){
      title='Полные группы и остаток';const [n,d,k,r]=m,w=236/n;
      body+=text(8,22,n+' = '+d+' × '+k+' + '+r)+bar(13,52,d*k*w,'#397963');
      if(r)body+=bar(13+d*k*w,52,r*w,'#b06e55');
      if(k<=24)for(let i=1;i<k;i++)body+=line(13+d*i*w,51,13+d*i*w,66);
      body+=text(11,91,'полные группы')+text(171,91,'остаток '+r);
    }else if(data.chart==='remainders'){
      title='Три остатка от деления на одинаковые группы';
      m.slice(1).forEach((n,i)=>{const y=20+32*i,r=n%m[0];body+=text(9,y,n)+line(60,y-4,175,y-4)+bar(60,y-8,116*r/m[0],'#ac6456')+text(185,y,'остаток '+r);});
    }else if(data.chart==='digits'){
      title='Десятичные разряды числа';body+=text(9,22,'Делитель '+m[0]);
      m.slice(2).forEach((v,i,ds)=>{const x=13+49*i;body+='<rect x="'+x+'" y="37" width="39" height="35" rx="4" fill="'+(i===ds.length-1?'#efd8b5':'#cde3da')+'"/>'+text(x+15,59,v);});
    }else if(data.chart==='steps'){
      title='Промежуточные результаты вычислений';
      m.forEach((v,i)=>{const x=11+i*65;body+=text(x,48,v)+text(x,79,'шаг '+(i+1));if(i+1<m.length)body+=line(x+37,58,x+54,58);});
    }else if(data.chart==='branches'){
      title='Общий множитель и две ветви';body+=text(10,24,'общий множитель '+m[0])+line(76,37,43,64)+line(98,37,163,64)+text(15,87,m[0]+' × '+m[1])+text(145,87,m[0]+' × '+m[2]);
    }else{
      title=data.chart==='powers'?'Пятёрки из кратных 5, 25 и 125':'Число появлений в двух разрядах';
      const labels=data.chart==='powers'?['кратны 5','кратны 25','кратны 125']:data.chart==='countPlaces'?['нули','единицы','десятки']:['единицы','старшие','вместе'];
      const largest=Math.max(...m,1);
      m.forEach((v,i)=>{const y=24+31*i;body+=text(7,y,labels[i])+bar(94,y-10,116*v/largest,i%2?'#ad7185':'#487d68')+text(226,y,v);});
    }
    return '<svg viewBox="0 0 280 112" role="img" aria-label="'+title+'"><g font-family="sans-serif" font-size="12" fill="#193e32">'+body+'</g></svg>';
  }
  window.MathExamTopicEdition={
    trainerId:'nikolsky-algebra-7-9',storePrefix:'math:nikolsky-algebra-7-9:v1:',authors:'Никольский и соавторы',grade:book=>book===75?'8 класс · 2014':'7 класс · 2013',unit:'упражнение',figure,
    source:(book,page)=>'https://pdf.my-uchebnik.ru/pdf/algebra/'+(book===75?'00000055':'00000077')+'.pdf#page='+(page+1),
    nextId(l){const next=order[order.indexOf(l.id)+1];return next&&window.MathExamTopicPractice.lessons.get(next).book===l.book?next:undefined;}
  };
})();

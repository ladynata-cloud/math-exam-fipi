(function(){
  'use strict';
  const course=window.MathExamTopicEdition,old=course.figure,{text}=window.MerzlyakExpressions2015;
  const operators={'+':'+','-':'−','*':'×','/':'÷','^':'^'};
  const label=(x,y,t,size=12)=>'<text x="'+x+'" y="'+y+'" font-size="'+size+'" text-anchor="middle">'+t+'</text>';
  const compact=r=>text(r).replace('-','−');
  course.figure=d=>{
    if(d.chart!=='expression-tree')return old(d);
    const root=d.tree,blocks=[root.A,root.B];
    let out='<path d="M72 43L139 84L208 43" stroke="#728b7e" stroke-width="2" fill="none"/>';
    for(const [i,b] of blocks.entries()){
      const x=i?208:72,v=compact(b.r);
      out+='<rect x="'+(x-51)+'" y="14" width="102" height="34" rx="5" fill="#e3ede6" stroke="#648274"/>';
      out+=label(x,37,v,Math.min(15,130/v.length))+label(x,62,b.op?'блок '+operators[b.op]:'число',10);
    }
    out+='<circle cx="139" cy="86" r="12" fill="#286153"/><g fill="white">'+label(139,90,operators[root.op],15)+'</g>';
    out+=label(139,113,'сначала блоки, затем внешнее действие',10);
    return '<svg viewBox="0 0 280 120" role="img" aria-label="Дерево выражения с двумя блоками и внешним действием"><g fill="#21483a" font-family="sans-serif">'+out+'</g></svg>';
  };
})();

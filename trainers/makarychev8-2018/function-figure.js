(function(){
  'use strict';
  const c=window.MathExamTopicEdition,previous=c.figure;
  function short(v){return String(Number(v.toPrecision(4))).replace('-','−');}
  c.figure=d=>{
    if(d.chart!=='advanced-function')return previous(d);
    const {segments,points}=d.graph,vertices=segments.map(({left,right,fn})=>
      Array.from({length:45},(_,i)=>{const x=left+(right-left)*i/44;return [x,fn(x)];}));
    const all=vertices.flat().concat(points),xMin=Math.min(...all.map(p=>p[0])),xMax=Math.max(...all.map(p=>p[0]));
    const ys=all.map(p=>p[1]),yMin=Math.min(...ys,0),yMax=Math.max(...ys,0);
    const x=v=>36+210*(v-xMin)/(xMax-xMin),y=v=>92-77*(v-yMin)/(yMax-yMin||1);
    const dot=(a,b,open=false)=>'<circle cx="'+x(a)+'" cy="'+y(b)+'" r="3" stroke="#315f52" stroke-width="1.6" fill="'+(open?'white':'#315f52')+'"/>';
    const axis=(x1,y1,x2,y2)=>'<path d="M'+x1+' '+y1+'L'+x2+' '+y2+'" fill="none" stroke="#82958c"/>';
    let out=axis(33,y(0),250,y(0));
    if(xMin<=0&&xMax>=0)out+=axis(x(0),11,x(0),96);
    vertices.forEach(path=>{out+='<polyline points="'+path.map(([a,b])=>x(a).toFixed(2)+','+y(b).toFixed(2)).join(' ')+'" fill="none" stroke="#315f52" stroke-width="2"/>';});
    const ends=segments.flatMap(({left,right,fn,openLeft,openRight})=>[[left,fn(left),openLeft],[right,fn(right),openRight]]);
    for(const [a,b,open] of ends.filter(p=>p[2]))out+=dot(a,b,open);
    // Adjacent pieces can contribute different open and closed values at the same x.
    for(const [a,b] of ends.filter(p=>!p[2]))out+=dot(a,b);
    points.forEach(([a,b])=>{out+=dot(a,b);});
    const label=(a,b,t,align)=>'<text x="'+a+'" y="'+b+'" text-anchor="'+align+'">'+t+'</text>';
    out+=label(140,114,'показан фрагмент графика','middle');
    out+=label(36,108,short(xMin),'middle')+label(246,108,short(xMax),'middle')+label(259,y(0)+3,'x','start');
    out+=label(3,17,'y','start')+label(33,13,short(yMax),'end')+label(33,91,short(yMin),'end');
    return '<svg viewBox="0 0 280 116" role="img" aria-label="График функции с отдельными ветвями и контрольными точками"><g fill="#294837" font-family="sans-serif" font-size="9">'+out+'</g></svg>';
  };
})();

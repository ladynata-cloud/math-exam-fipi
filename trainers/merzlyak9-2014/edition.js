(function(){
  'use strict';
  const api=window.MathExamTopicPractice;
  const escape=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  // A continuous curve and a discrete sequence use different marks. Bounds and
  // labels are derived from the same coordinates as the accessible data table.
  function figure(data){
    if(data.chart==='intervals'){
      const [a,b]=data.limits,lo=a-2,hi=b+2,X=v=>35+210*(v-lo)/(hi-lo);
      const range=(v,lower,y)=>'<path d="M35 '+y+'H245" stroke="#74818c"/><path d="M'+(lower?X(v):35)+' '+y+'H'+(lower?245:X(v))+'" stroke="#12635e" stroke-width="5"/><circle cx="'+X(v)+'" cy="'+y+'" r="5" stroke="#12635e" stroke-width="2" fill="'+(lower?'#12635e':'white')+'"/><text x="'+X(v)+'" y="'+(y+17)+'" text-anchor="middle">'+v+'</text>';
      return '<svg viewBox="0 0 280 120" role="img" aria-label="Два луча: x не меньше '+a+' и x строго меньше '+b+'"><g font-size="12" fill="#203948"><text x="5" y="15">x ≥ '+a+'</text>'+range(a,true,32)+'<text x="5" y="72">x &lt; '+b+'</text>'+range(b,false,88)+'</g></svg>';
    }
    const ps=data.plot;if(!ps||!ps.length)return '';
    const xs=ps.map(p=>p[0]),ys=[...ps,...(data.second||[])].map(p=>p[1]),xmin=Math.min(...xs,0),xmax=Math.max(...xs,0),ymin=Math.min(...ys,0),ymax=Math.max(...ys,0);
    const X=n=>36+220*(n-xmin)/(xmax-xmin||1),Y=n=>145-112*(n-ymin)/(ymax-ymin||1);
    const horizontal=Y(0),vertical=X(Math.max(xmin,Math.min(0,xmax)));
    const axes='<path d="M30 '+horizontal+'H263 M'+vertical+' 18V150" fill="none" stroke="#516a76"/>';
    const marks=data.chart==='sequence'?ps.map(([x,y])=>'<circle cx="'+X(x)+'" cy="'+Y(y)+'" r="4" fill="#11695f"/>').join(''):
      '<polyline points="'+ps.map(([x,y])=>X(x)+','+Y(y)).join(' ')+'" fill="none" stroke="#12635e" stroke-width="3"/>';
    const second=data.second?'<polyline points="'+data.second.map(([x,y])=>X(x)+','+Y(y)).join(' ')+'" fill="none" stroke="#8a4f18" stroke-width="2.5" stroke-dasharray="6 4"/>':'';
    const labels='<g fill="#203948" font-size="12"><text x="30" y="169">'+escape(api.f(xmin))+'</text><text x="244" y="169">'+escape(api.f(xmax))+'</text><text x="3" y="34">'+escape(api.f(ymax))+'</text><text x="3" y="149">'+escape(api.f(ymin))+'</text><text x="268" y="'+Math.max(17,horizontal)+'">'+(data.chart==='sequence'?'n':'x')+'</text></g>';
    return '<svg viewBox="0 0 286 179" role="img" aria-label="'+escape(data.caption)+'">'+axes+marks+second+labels+'</svg>';
  }
  window.MathExamTopicEdition={trainerId:'merzlyak9-2014',storePrefix:'math:merzlyak9-2014:v1:',authors:'Мерзляк, Полонский, Якир',grade:()=>'9 класс',unit:'§',nextId:l=>l.book+'-'+(l.point+1),source:(_,page)=>'https://pdf.my-uchebnik.ru/pdf/algebra/00000040.pdf#page='+(page+1),figure};
  const lesson=(...args)=>api.add(55,...args);
  function graph(data,fn,lo,hi,other){data.chart='function';data.plot=Array.from({length:81},(_,i)=>{const x=lo+(hi-lo)*i/80;return [x,fn(x)];});if(other)data.second=data.plot.map(([x])=>[x,other(x)]);return data;}
  function intervals(data,a,b){data.chart='intervals';data.limits=[a,b];return data;}
  function sequence(data,fn,n=6){data.chart='sequence';data.plot=Array.from({length:n},(_,i)=>[i+1,fn(i+1)]);return data;}
  window.Merzlyak9Practice={lesson,graph,sequence,intervals,model:api.example,q:api.task,f:api.f};
})();
